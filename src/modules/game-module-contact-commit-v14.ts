import {
  GraphTransitionGuard,
  MAX_PREPARES_PER_EVENT_TRANSACTION,
} from "./game-module-runtime-abi-v12.js";
import {
  ContactDecisionPayloadV2Schema,
  type ContactDecisionPayloadV2,
} from "./game-module-runtime-payloads.js";
import { SafeMonotonicCounterV1 } from "./game-module-safe-counter.js";

function isThenable(value: unknown): boolean {
  return (
    value !== null &&
    (typeof value === "object" || typeof value === "function") &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

type PreparedSlot = {
  state: "free" | "prepared" | "committing" | "quarantined";
  candidateId?: string;
  eventTransactionId?: number;
};

type ContactMutationAdapterV14 = Readonly<{
  consumeProjectile(
    decision: ContactDecisionPayloadV2,
  ): Readonly<{ physical: boolean; logical: boolean }>;
  deactivateRoot(
    decision: ContactDecisionPayloadV2,
  ): Readonly<{ physical: boolean; logical: boolean }>;
  quarantine(decision: ContactDecisionPayloadV2): void;
}>;

export type PreparedContactCommitV14 = Readonly<{
  commit(): Readonly<{ evidenceId: number }>;
}>;

/** Source-first V2 contact transaction for projectile-root and root-player. */
export class ContactCommitCoordinatorV14 {
  readonly #guard: GraphTransitionGuard;
  readonly #slots: PreparedSlot[];
  readonly #projectileRootRouteId: string;
  readonly #actorRootPlayerRouteId: string;
  readonly #adapter: ContactMutationAdapterV14;
  readonly #evidence: SafeMonotonicCounterV1;
  readonly #durable = new Set<string>();
  readonly #prepareCounts = new Map<number, number>();
  #aborted = 0;

  constructor(
    input: Readonly<{
      guard: GraphTransitionGuard;
      maximumConcurrentCommits: number;
      projectileRootRouteId: string;
      actorRootPlayerRouteId: string;
      adapter: ContactMutationAdapterV14;
      lastEvidenceId?: number;
    }>,
  ) {
    if (
      !Number.isSafeInteger(input.maximumConcurrentCommits) ||
      input.maximumConcurrentCommits < 1 ||
      input.maximumConcurrentCommits > 10_000 ||
      !this.#validId(input.projectileRootRouteId) ||
      !this.#validId(input.actorRootPlayerRouteId)
    )
      throw new Error("invalid V2 contact commit configuration");
    this.#guard = input.guard;
    this.#slots = Array.from(
      { length: input.maximumConcurrentCommits },
      () => ({ state: "free" }) as PreparedSlot,
    );
    this.#projectileRootRouteId = input.projectileRootRouteId;
    this.#actorRootPlayerRouteId = input.actorRootPlayerRouteId;
    this.#adapter = input.adapter;
    this.#evidence = new SafeMonotonicCounterV1(
      "contact-v2-evidence",
      input.lastEvidenceId ?? -1,
    );
  }

  get abortedPrepareCount(): number {
    return this.#aborted;
  }

  prepare(
    decisionInput: ContactDecisionPayloadV2,
    deliveries: Readonly<{
      deliverHitEvidence(evidenceId: number): unknown;
      deliverDamage(
        decision: ContactDecisionPayloadV2,
        evidenceId: number,
      ): unknown;
    }>,
  ): PreparedContactCommitV14 {
    const token = this.#guard.currentEventToken;
    if (token === undefined)
      throw new Error("V2 contact prepare requires event token");
    const decision = ContactDecisionPayloadV2Schema.parse(decisionInput);
    this.#validateResolvedRoute(decision);
    const count = (this.#prepareCounts.get(token.eventTransactionId) ?? 0) + 1;
    if (count > MAX_PREPARES_PER_EVENT_TRANSACTION)
      throw new Error("V2 contact prepare transaction limit exceeded");
    this.#prepareCounts.set(token.eventTransactionId, count);
    const candidateId = JSON.stringify(decision.candidate);
    if (
      this.#durable.has(candidateId) ||
      this.#slots.some((slot) => slot.candidateId === candidateId)
    )
      throw new Error("duplicate V2 contact candidate");
    const slot = this.#slots.find(({ state }) => state === "free");
    if (slot === undefined)
      throw new Error("V2 contact commit slots exhausted");
    this.#evidence.preflightBlock(1);
    slot.state = "prepared";
    slot.candidateId = candidateId;
    slot.eventTransactionId = token.eventTransactionId;
    let live = true;
    const abort = () => {
      this.#prepareCounts.delete(token.eventTransactionId);
      if (!live || slot.state !== "prepared") return;
      live = false;
      this.#free(slot);
      this.#aborted = Math.min(Number.MAX_SAFE_INTEGER, this.#aborted + 1);
    };
    this.#guard.addEventFinalizer(abort);

    return Object.freeze({
      commit: () => {
        const current = this.#guard.currentEventToken;
        if (
          !live ||
          slot.state !== "prepared" ||
          current?.eventTransactionId !== slot.eventTransactionId
        )
          throw new Error("prepared V2 contact is expired or consumed");
        live = false;
        slot.state = "committing";
        this.#durable.add(candidateId);
        const evidenceId = this.#evidence.allocate();
        let sourceResult: Readonly<{ physical: boolean; logical: boolean }>;
        try {
          sourceResult =
            decision.sourceOperation === "consume"
              ? this.#adapter.consumeProjectile(decision)
              : this.#adapter.deactivateRoot(decision);
          if (isThenable(sourceResult))
            throw new Error("source mutation returned a thenable");
        } catch {
          sourceResult = { physical: false, logical: false };
        }
        if (!sourceResult.physical || !sourceResult.logical) {
          slot.state = "quarantined";
          this.#adapter.quarantine(decision);
          throw new Error("V2 source-operation-indeterminate");
        }
        const failures: unknown[] = [];
        for (const operation of [
          () => deliveries.deliverHitEvidence(evidenceId),
          () => deliveries.deliverDamage(decision, evidenceId),
        ])
          try {
            const result = operation();
            if (isThenable(result))
              throw new Error("V2 contact delivery returned a thenable");
          } catch (error) {
            failures.push(error);
          }
        this.#free(slot);
        if (failures.length > 0)
          throw new AggregateError(
            failures,
            "V2 contact result delivery failed",
          );
        return Object.freeze({ evidenceId });
      },
    });
  }

  releaseInactiveSource(
    candidate: ContactDecisionPayloadV2["candidate"],
  ): void {
    this.#durable.delete(JSON.stringify(candidate));
  }

  releaseQuarantined(decisionInput: ContactDecisionPayloadV2): void {
    const decision = ContactDecisionPayloadV2Schema.parse(decisionInput);
    const candidateId = JSON.stringify(decision.candidate);
    const slot = this.#slots.find(
      (candidate) =>
        candidate.state === "quarantined" &&
        candidate.candidateId === candidateId,
    );
    if (slot === undefined)
      throw new Error("V2 quarantined contact candidate is not retained");
    this.#durable.delete(candidateId);
    this.#free(slot);
  }

  #validateResolvedRoute(decision: ContactDecisionPayloadV2): void {
    const projectile = decision.candidate.contactKind === "projectile-root";
    if (
      decision.damage !== decision.candidate.damage ||
      (projectile &&
        (decision.sourceOperation !== "consume" ||
          decision.routeId !== this.#projectileRootRouteId)) ||
      (!projectile &&
        (decision.sourceOperation !== "deactivate-root" ||
          decision.routeId !== this.#actorRootPlayerRouteId))
    )
      throw new Error("V2 contact route/source lineage mismatch");
  }

  #free(slot: PreparedSlot): void {
    slot.state = "free";
    delete slot.candidateId;
    delete slot.eventTransactionId;
  }

  #validId(value: string): boolean {
    return /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(value);
  }
}
