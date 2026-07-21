import {
  RuntimeKernelSessionQuarantineLedgerV12,
  type QuarantineReportV12,
} from "./game-module-runtime-abi-v12.js";
import { SafeMonotonicCounterV1 } from "./game-module-safe-counter.js";

export type HostileContentionCandidateV1 = Readonly<{
  memberInstanceId: string;
  requestSequence: number;
  plannedProjectiles: number;
}>;

export type HostileContentionAdmissionV1 = Readonly<{
  memberInstanceId: string;
  requestSequence: number;
  admittedTokenIds: readonly number[];
  droppedProjectiles: number;
  dropCause:
    | "none"
    | "active-entity-capacity"
    | "active-projectile-capacity"
    | "spawn-rate-capacity";
}>;

type ContentionToken = {
  tokenId: number;
  memberInstanceId: string;
  admittedAtMs: number;
  state: "prepared" | "active" | "quarantined";
  identity?: string;
  generation?: number;
  releaseSession: () => void;
};

function validInstanceId(value: string): boolean {
  return /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(value);
}

/** ADR 0028 stable, group-owned admission over independent hostile pools. */
export class HostileAggregateContentionHostV1 {
  readonly #groupId: string;
  readonly #members: readonly string[];
  readonly #memberOrder: ReadonlyMap<string, number>;
  readonly #activeEntityCapacity: number;
  readonly #activeProjectileCapacity: number;
  readonly #spawnsPerSecondCapacity: number;
  readonly #nowMs: () => number;
  readonly #session: RuntimeKernelSessionQuarantineLedgerV12;
  readonly #tokenSequence: SafeMonotonicCounterV1;
  readonly #tokens = new Map<number, ContentionToken>();
  readonly #rateWindow = new Map<number, number>();
  readonly #lastRequestSequence = new Map<string, number>();
  #lastFrameSequence = -1;
  #lastTimeMs = -1;
  #disposed = false;

  constructor(
    input: Readonly<{
      groupId: string;
      orderedMemberInstanceIds: readonly string[];
      activeEntityCapacity: number;
      activeProjectileCapacity: number;
      spawnsPerSecondCapacity: number;
      nowMs(): number;
      session: RuntimeKernelSessionQuarantineLedgerV12;
      lastAllocatedTokenId?: number;
    }>,
  ) {
    if (
      !/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(input.groupId) ||
      input.orderedMemberInstanceIds.length === 0 ||
      new Set(input.orderedMemberInstanceIds).size !==
        input.orderedMemberInstanceIds.length ||
      input.orderedMemberInstanceIds.some((id) => !validInstanceId(id)) ||
      !this.#validCapacity(input.activeEntityCapacity) ||
      !this.#validCapacity(input.activeProjectileCapacity) ||
      !this.#validCapacity(input.spawnsPerSecondCapacity)
    )
      throw new Error("invalid hostile contention configuration");
    this.#groupId = input.groupId;
    this.#members = Object.freeze([...input.orderedMemberInstanceIds]);
    this.#memberOrder = new Map(
      this.#members.map((member, index) => [member, index]),
    );
    this.#activeEntityCapacity = input.activeEntityCapacity;
    this.#activeProjectileCapacity = input.activeProjectileCapacity;
    this.#spawnsPerSecondCapacity = input.spawnsPerSecondCapacity;
    this.#nowMs = input.nowMs;
    this.#session = input.session;
    this.#tokenSequence = new SafeMonotonicCounterV1(
      `${input.groupId}.contention-token`,
      input.lastAllocatedTokenId ?? -1,
    );
  }

  admitFrame(
    frameSequence: number,
    candidates: readonly HostileContentionCandidateV1[],
  ): readonly HostileContentionAdmissionV1[] {
    this.#requireAlive();
    const nowMs = this.#readNow();
    if (
      !Number.isSafeInteger(frameSequence) ||
      frameSequence < 0 ||
      frameSequence <= this.#lastFrameSequence
    )
      throw new Error("contention frame sequence is not strictly increasing");
    const ordered = this.#validateAndOrderCandidates(candidates);
    this.#pruneRateWindow(nowMs);
    let availableEntities = this.#activeEntityCapacity - this.#tokens.size;
    let availableProjectiles =
      this.#activeProjectileCapacity - this.#tokens.size;
    let availableRate = this.#spawnsPerSecondCapacity - this.#rateWindow.size;
    const plans = ordered.map((candidate) => {
      const admittedCount = Math.min(
        candidate.plannedProjectiles,
        availableEntities,
        availableProjectiles,
        availableRate,
      );
      const dropCause = this.#dropCause(
        candidate.plannedProjectiles,
        admittedCount,
        availableEntities,
        availableProjectiles,
        availableRate,
      );
      availableEntities -= admittedCount;
      availableProjectiles -= admittedCount;
      availableRate -= admittedCount;
      return { candidate, admittedCount, dropCause };
    });
    const totalAdmitted = plans.reduce(
      (total, plan) => total + plan.admittedCount,
      0,
    );
    if (totalAdmitted > 0) this.#tokenSequence.preflightBlock(totalAdmitted);
    const reservations: (() => void)[] = [];
    try {
      for (let index = 0; index < totalAdmitted; index += 1)
        reservations.push(this.#session.reserveActivation());
    } catch (error) {
      for (const release of reservations.reverse()) release();
      throw error;
    }

    let reservationIndex = 0;
    const admissions: HostileContentionAdmissionV1[] = [];
    for (const { candidate, admittedCount, dropCause } of plans) {
      const admittedTokenIds: number[] = [];
      for (let index = 0; index < admittedCount; index += 1) {
        const tokenId = this.#tokenSequence.allocate();
        const token: ContentionToken = {
          tokenId,
          memberInstanceId: candidate.memberInstanceId,
          admittedAtMs: nowMs,
          state: "prepared",
          releaseSession: reservations[reservationIndex++]!,
        };
        this.#tokens.set(tokenId, token);
        this.#rateWindow.set(tokenId, nowMs);
        admittedTokenIds.push(tokenId);
      }
      this.#lastRequestSequence.set(
        candidate.memberInstanceId,
        candidate.requestSequence,
      );
      admissions.push(
        Object.freeze({
          memberInstanceId: candidate.memberInstanceId,
          requestSequence: candidate.requestSequence,
          admittedTokenIds: Object.freeze(admittedTokenIds),
          droppedProjectiles: candidate.plannedProjectiles - admittedCount,
          dropCause,
        }),
      );
    }
    this.#lastFrameSequence = frameSequence;
    this.#lastTimeMs = nowMs;
    return Object.freeze(admissions);
  }

  commit(
    memberInstanceId: string,
    tokenId: number,
    identity: string,
    generation: number,
  ): void {
    const token = this.#requireToken(memberInstanceId, tokenId, "prepared");
    if (
      identity.length === 0 ||
      identity.length > 200 ||
      !Number.isSafeInteger(generation) ||
      generation < 0
    )
      throw new Error("invalid hostile contention activation identity");
    token.identity = identity;
    token.generation = generation;
    token.state = "active";
  }

  rollback(memberInstanceId: string, tokenId: number): void {
    const token = this.#requireToken(memberInstanceId, tokenId, "prepared");
    token.releaseSession();
    this.#tokens.delete(tokenId);
    this.#rateWindow.delete(tokenId);
  }

  release(memberInstanceId: string, tokenId: number): void {
    const token = this.#requireToken(memberInstanceId, tokenId, "active");
    token.releaseSession();
    this.#tokens.delete(tokenId);
  }

  quarantine(
    memberInstanceId: string,
    tokenId: number,
    identity: string,
    generation: number,
    retainedLocalTokens: readonly string[],
  ): void {
    const token = this.#requireToken(
      memberInstanceId,
      tokenId,
      "prepared",
      "active",
    );
    if (
      identity.length === 0 ||
      identity.length > 200 ||
      !Number.isSafeInteger(generation) ||
      generation < 0 ||
      (token.state === "active" &&
        (token.identity !== identity || token.generation !== generation)) ||
      retainedLocalTokens.length > 16 ||
      new Set(retainedLocalTokens).size !== retainedLocalTokens.length ||
      retainedLocalTokens.some(
        (value) =>
          value.length > 100 ||
          !/^[a-z][a-z0-9.-]*(?::[a-z0-9./-]+)*$/.test(value),
      )
    )
      throw new Error("invalid hostile quarantine identity");
    this.#session.transfer(
      identity,
      generation,
      Object.freeze([
        ...retainedLocalTokens,
        `hostile-contention:${this.#groupId}:${tokenId}`,
      ]),
      token.releaseSession,
    );
    token.identity = identity;
    token.generation = generation;
    token.state = "quarantined";
  }

  cleanupQuarantine(
    retry: (
      token: Readonly<{
        tokenId: number;
        memberInstanceId: string;
        identity: string;
        generation: number;
      }>,
    ) => boolean,
  ): QuarantineReportV12 {
    this.#requireAlive();
    return this.#session.finalCleanup((entry) => {
      const token = [...this.#tokens.values()].find(
        (candidate) =>
          candidate.state === "quarantined" &&
          candidate.identity === entry.identity &&
          candidate.generation === entry.generation,
      );
      if (
        token === undefined ||
        token.identity === undefined ||
        token.generation === undefined
      )
        return false;
      if (
        !retry(
          Object.freeze({
            tokenId: token.tokenId,
            memberInstanceId: token.memberInstanceId,
            identity: token.identity,
            generation: token.generation,
          }),
        )
      )
        return false;
      this.#tokens.delete(token.tokenId);
      return true;
    });
  }

  snapshot(): Readonly<{
    prepared: number;
    active: number;
    quarantined: number;
    retainedActiveEntities: number;
    retainedActiveProjectiles: number;
    rateWindowCount: number;
  }> {
    this.#requireAlive();
    this.#pruneRateWindow(this.#readNow());
    const states = [...this.#tokens.values()].map(({ state }) => state);
    return Object.freeze({
      prepared: states.filter((state) => state === "prepared").length,
      active: states.filter((state) => state === "active").length,
      quarantined: states.filter((state) => state === "quarantined").length,
      retainedActiveEntities: this.#tokens.size,
      retainedActiveProjectiles: this.#tokens.size,
      rateWindowCount: this.#rateWindow.size,
    });
  }

  dispose(): void {
    this.#requireAlive();
    for (const token of [...this.#tokens.values()])
      if (token.state === "prepared")
        this.rollback(token.memberInstanceId, token.tokenId);
    if (this.#tokens.size > 0)
      throw new Error(
        "hostile contention retains active or quarantined tokens",
      );
    this.#disposed = true;
  }

  #validateAndOrderCandidates(
    candidates: readonly HostileContentionCandidateV1[],
  ): HostileContentionCandidateV1[] {
    const seen = new Set<string>();
    for (const candidate of candidates) {
      if (
        !this.#memberOrder.has(candidate.memberInstanceId) ||
        !Number.isSafeInteger(candidate.requestSequence) ||
        candidate.requestSequence < 0 ||
        candidate.requestSequence <=
          (this.#lastRequestSequence.get(candidate.memberInstanceId) ?? -1) ||
        !Number.isSafeInteger(candidate.plannedProjectiles) ||
        candidate.plannedProjectiles < 1 ||
        candidate.plannedProjectiles > 10_000
      )
        throw new Error("invalid hostile contention candidate");
      const key = `${candidate.memberInstanceId}:${candidate.requestSequence}`;
      if (seen.has(key))
        throw new Error("duplicate hostile contention candidate");
      seen.add(key);
    }
    return [...candidates].sort(
      (left, right) =>
        this.#memberOrder.get(left.memberInstanceId)! -
          this.#memberOrder.get(right.memberInstanceId)! ||
        left.requestSequence - right.requestSequence,
    );
  }

  #dropCause(
    requested: number,
    admitted: number,
    availableEntities: number,
    availableProjectiles: number,
    availableRate: number,
  ): HostileContentionAdmissionV1["dropCause"] {
    if (admitted === requested) return "none";
    if (availableEntities === admitted) return "active-entity-capacity";
    if (availableProjectiles === admitted) return "active-projectile-capacity";
    if (availableRate === admitted) return "spawn-rate-capacity";
    throw new Error("hostile contention drop cause is indeterminate");
  }

  #requireToken(
    memberInstanceId: string,
    tokenId: number,
    ...states: readonly ContentionToken["state"][]
  ): ContentionToken {
    this.#requireAlive();
    const token = this.#tokens.get(tokenId);
    if (
      token === undefined ||
      token.memberInstanceId !== memberInstanceId ||
      !states.includes(token.state)
    )
      throw new Error("hostile contention token authority/state violation");
    return token;
  }

  #pruneRateWindow(nowMs: number): void {
    for (const [tokenId, admittedAtMs] of this.#rateWindow)
      if (admittedAtMs <= nowMs - 1_000) this.#rateWindow.delete(tokenId);
  }

  #readNow(): number {
    const nowMs = this.#nowMs();
    if (!Number.isSafeInteger(nowMs) || nowMs < 0 || nowMs < this.#lastTimeMs)
      throw new Error("hostile contention clock is invalid or non-monotonic");
    this.#lastTimeMs = nowMs;
    return nowMs;
  }

  #validCapacity(value: number): boolean {
    return Number.isSafeInteger(value) && value >= 1 && value <= 10_000;
  }

  #requireAlive(): void {
    if (this.#disposed) throw new Error("hostile contention host is disposed");
  }
}
