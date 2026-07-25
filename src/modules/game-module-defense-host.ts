import {
  DamagePayloadSchema,
  DefenseResultPayloadSchema,
  DefenseStatePayloadSchema,
  type DamagePayload,
} from "./game-module-runtime-payloads.js";
import { SafeMonotonicCounterV1 } from "./game-module-safe-counter.js";

const DAMAGE_KINDS = new Set<DamagePayload["damageKind"]>([
  "projectile",
  "beam",
  "field",
  "contact",
]);

export type InvulnerabilityDefenseStateV1 = Readonly<{
  revision: number;
  emittedAtMs: number;
  actorId: string;
  active: boolean;
  current: number;
  maximum: number;
}>;

export type InvulnerabilityDefenseResultV1 = Readonly<{
  sequence: number;
  emittedAtMs: number;
  targetActorId: string;
  result: "accepted" | "blocked";
  amount: number;
}>;

/** Half-open, simulation-clock defense filter for ADR 0027. */
export class InvulnerabilityWindowHostV1 {
  readonly #targetActorId: string;
  readonly #durationMs: number;
  readonly #acceptedDamageKinds: ReadonlySet<DamagePayload["damageKind"]>;
  readonly #nowMs: () => number;
  readonly #forward: (damage: DamagePayload) => void;
  readonly #publishState: (state: InvulnerabilityDefenseStateV1) => void;
  readonly #publishResult: (result: InvulnerabilityDefenseResultV1) => void;
  readonly #stateRevision = new SafeMonotonicCounterV1(
    "invulnerability.state-revision",
  );
  readonly #resultSequence = new SafeMonotonicCounterV1(
    "invulnerability.result-sequence",
  );
  #activeUntilMs = 0;
  #running = false;
  #disposed = false;

  constructor(
    input: Readonly<{
      targetActorId: string;
      durationMs: number;
      acceptedDamageKinds: readonly DamagePayload["damageKind"][];
      nowMs(): number;
      forward(damage: DamagePayload): void;
      publishState?(state: InvulnerabilityDefenseStateV1): void;
      publishResult?(result: InvulnerabilityDefenseResultV1): void;
    }>,
  ) {
    if (
      !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(input.targetActorId) ||
      !Number.isSafeInteger(input.durationMs) ||
      input.durationMs < 0 ||
      input.durationMs > 10_000 ||
      input.acceptedDamageKinds.length < 1 ||
      new Set(input.acceptedDamageKinds).size !==
        input.acceptedDamageKinds.length ||
      input.acceptedDamageKinds.some((kind) => !DAMAGE_KINDS.has(kind))
    )
      throw new Error("invalid invulnerability-window configuration");
    this.#targetActorId = input.targetActorId;
    this.#durationMs = input.durationMs;
    this.#acceptedDamageKinds = new Set(input.acceptedDamageKinds);
    this.#nowMs = input.nowMs;
    this.#forward = input.forward;
    this.#publishState = input.publishState ?? (() => undefined);
    this.#publishResult = input.publishResult ?? (() => undefined);
  }

  get activeUntilMs(): number {
    return this.#activeUntilMs;
  }

  start(): void {
    if (this.#disposed) throw new Error("invulnerability window is disposed");
    if (this.#running)
      throw new Error("invulnerability window already running");
    this.#running = true;
  }

  stop(): void {
    this.#running = false;
  }

  accept(input: unknown): InvulnerabilityDefenseResultV1 {
    if (!this.#running)
      throw new Error("invulnerability window is not running");
    const validation = DamagePayloadSchema.safeParse(input);
    if (!validation.success) throw validation.error;
    if (!Object.isFrozen(input))
      throw new Error("damage entering the defense route must be immutable");
    const damage = input as DamagePayload;
    if (damage.targetActorId !== this.#targetActorId)
      throw new Error("damage bypassed the resolved defense route target");
    const nowMs = this.#readNow();

    if (!this.#acceptedDamageKinds.has(damage.damageKind)) {
      this.#forward(damage);
      return this.#emit(nowMs, "accepted", damage.amount);
    }

    if (nowMs < this.#activeUntilMs)
      return this.#emit(nowMs, "blocked", damage.amount);

    const activeUntilMs = nowMs + this.#durationMs;
    if (!Number.isSafeInteger(activeUntilMs))
      throw new Error("invulnerability active-until counter overflow");
    this.#activeUntilMs = activeUntilMs;
    this.#publish(nowMs);
    const result = this.#emit(nowMs, "accepted", damage.amount);
    this.#forward(damage);
    return result;
  }

  observe(): InvulnerabilityDefenseStateV1 {
    const nowMs = this.#readNow();
    return this.#state(
      this.#stateRevision.current < 0 ? 0 : this.#stateRevision.current,
      nowMs,
    );
  }

  dispose(): void {
    this.#running = false;
    this.#disposed = true;
    this.#activeUntilMs = 0;
  }

  #readNow(): number {
    const nowMs = this.#nowMs();
    if (!Number.isSafeInteger(nowMs) || nowMs < 0)
      throw new Error("defense clock returned invalid simulation time");
    return nowMs;
  }

  #state(revision: number, nowMs: number): InvulnerabilityDefenseStateV1 {
    const remaining = Math.max(0, this.#activeUntilMs - nowMs);
    return Object.freeze(
      DefenseStatePayloadSchema.parse({
        revision,
        emittedAtMs: nowMs,
        actorId: this.#targetActorId,
        active: nowMs < this.#activeUntilMs,
        current: remaining,
        maximum: this.#durationMs,
      }),
    );
  }

  #publish(nowMs: number): void {
    const revision = this.#stateRevision.preflightBlock(1).base;
    const state = this.#state(revision, nowMs);
    this.#stateRevision.allocate();
    this.#publishState(state);
  }

  #emit(
    nowMs: number,
    result: "accepted" | "blocked",
    amount: number,
  ): InvulnerabilityDefenseResultV1 {
    const sequence = this.#resultSequence.preflightBlock(1).base;
    const payload = Object.freeze(
      DefenseResultPayloadSchema.parse({
        sequence,
        emittedAtMs: nowMs,
        targetActorId: this.#targetActorId,
        result,
        amount,
      }),
    ) as InvulnerabilityDefenseResultV1;
    this.#resultSequence.allocate();
    this.#publishResult(payload);
    return payload;
  }
}
