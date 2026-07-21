import type { ResolvedEffectApplicationRouteV13 } from "./game-module-resolver.js";
import {
  ModifierApplicationPayloadSchema,
  ModifierApplicationTemplateV1Schema,
  PickupCollectedPayloadSchema,
  PickupCollectedTemplateV1Schema,
} from "./game-module-runtime-payloads.js";
import {
  preflightMonotonicAllocations,
  SafeMonotonicCounterV1,
} from "./game-module-safe-counter.js";

export const PreparedEffectHostErrorCode = {
  invalidPhaseOrToken: "invalid-phase-or-token",
  duplicateSource: "duplicate-source",
  capacityExceeded: "capacity-exceeded",
  invalidPlannerResult: "invalid-planner-result",
  invalidRoute: "invalid-route",
  inactiveRouteLease: "inactive-route-lease",
  staleCapability: "stale-capability",
  sourceMutationIndeterminate: "source-mutation-indeterminate",
  deliveryFailed: "delivery-failed",
} as const;

export class PreparedEffectHostError extends Error {
  constructor(
    readonly code: (typeof PreparedEffectHostErrorCode)[keyof typeof PreparedEffectHostErrorCode],
    message: string,
    readonly causes: readonly unknown[] = Object.freeze([]),
  ) {
    super(message);
    this.name = "PreparedEffectHostError";
  }
}

export type PickupEffectPlannerV1 = (
  collected: Readonly<ReturnType<typeof PickupCollectedTemplateV1Schema.parse>>,
) => unknown;

export type PreparedEffectFailureEvidenceV1 = Readonly<{
  kind: "finalization-failed" | "mutation-indeterminate" | "delivery-failed";
  sourceKey: string;
  commitSequence: number;
  commitEvidenceId: number;
  eventSequenceBase: number;
  applicationCount: number;
  failedOrdinals: readonly number[];
}>;

export type PreparedEffectHostV1Options = Readonly<{
  maximumConcurrentCommits: number;
  duplicateLedgerCapacity: number;
  maximumApplicationsPerCommit: number;
  routes: readonly ResolvedEffectApplicationRouteV13[];
  planner: PickupEffectPlannerV1;
  assertRunningEventToken(token: object): void;
  nowMs(): number;
  consumeSource(sourceKey: string): "consumed" | "indeterminate";
  quarantineSource(sourceKey: string): void;
  deliverCollected(payload: Readonly<unknown>): void;
  recordFailure(evidence: PreparedEffectFailureEvidenceV1): void;
}>;

export type PreparedEffectCapabilityV1 = Readonly<{
  commit(): void;
  abandon(): void;
}>;

type ProvisionalPair = {
  readonly sourceKey: string;
  readonly creationOrder: number;
  active: boolean;
};

type AddressedHandler = (payload: Readonly<unknown>) => void;

export class PreparedEffectCommitHostV1 {
  readonly #options: PreparedEffectHostV1Options;
  readonly #routes = new Map<string, ResolvedEffectApplicationRouteV13>();
  readonly #handlers = new Map<string, AddressedHandler>();
  readonly #provisionalBySource = new Map<string, ProvisionalPair>();
  readonly #durableSources = new Set<string>();
  readonly #prepareOrder = new SafeMonotonicCounterV1("effect.prepare-order");
  readonly #commitSequence = new SafeMonotonicCounterV1("effect.commit");
  readonly #evidenceSequence = new SafeMonotonicCounterV1("effect.evidence");
  readonly #eventSequence = new SafeMonotonicCounterV1("effect.event");
  #activeSlots = 0;
  #disposed = false;

  constructor(options: PreparedEffectHostV1Options) {
    if (
      !Number.isSafeInteger(options.maximumConcurrentCommits) ||
      options.maximumConcurrentCommits < 1 ||
      !Number.isSafeInteger(options.duplicateLedgerCapacity) ||
      options.duplicateLedgerCapacity < 1 ||
      !Number.isSafeInteger(options.maximumApplicationsPerCommit) ||
      options.maximumApplicationsPerCommit < 0
    )
      throw new PreparedEffectHostError(
        PreparedEffectHostErrorCode.capacityExceeded,
        "invalid prepared effect capacity",
      );
    this.#options = options;
    for (const route of options.routes) {
      if (this.#routes.has(route.routeId))
        throw new PreparedEffectHostError(
          PreparedEffectHostErrorCode.invalidRoute,
          `duplicate addressed route: ${route.routeId}`,
        );
      this.#routes.set(route.routeId, route);
    }
  }

  get activePreparedCount(): number {
    return this.#activeSlots;
  }

  get activeRouteCount(): number {
    return this.#handlers.size;
  }

  get durableSourceCount(): number {
    return this.#durableSources.size;
  }

  hasDuplicateState(sourceKey: string): boolean {
    return (
      this.#provisionalBySource.has(sourceKey) ||
      this.#durableSources.has(sourceKey)
    );
  }

  startRoute(routeId: string, handler: AddressedHandler): () => void {
    if (this.#disposed)
      throw new PreparedEffectHostError(
        PreparedEffectHostErrorCode.invalidPhaseOrToken,
        "prepared effect host is disposed",
      );
    if (!this.#routes.has(routeId) || this.#handlers.has(routeId))
      throw new PreparedEffectHostError(
        PreparedEffectHostErrorCode.invalidRoute,
        `cannot start addressed route: ${routeId}`,
      );
    this.#handlers.set(routeId, handler);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      this.#handlers.delete(routeId);
    };
  }

  prepare(
    token: object,
    sourceKey: string,
    collectedInput: unknown,
  ): PreparedEffectCapabilityV1 {
    if (this.#disposed)
      throw new PreparedEffectHostError(
        PreparedEffectHostErrorCode.invalidPhaseOrToken,
        "prepared effect host is disposed",
      );
    this.#options.assertRunningEventToken(token);
    if (
      this.#provisionalBySource.has(sourceKey) ||
      this.#durableSources.has(sourceKey)
    )
      throw new PreparedEffectHostError(
        PreparedEffectHostErrorCode.duplicateSource,
        `duplicate prepared effect source: ${sourceKey}`,
      );
    if (
      this.#activeSlots >= this.#options.maximumConcurrentCommits ||
      this.#provisionalBySource.size + this.#durableSources.size >=
        this.#options.duplicateLedgerCapacity
    )
      throw new PreparedEffectHostError(
        PreparedEffectHostErrorCode.capacityExceeded,
        "prepared effect capacity exceeded",
      );

    const pair: ProvisionalPair = {
      sourceKey,
      creationOrder: this.#prepareOrder.allocate(),
      active: true,
    };
    this.#activeSlots += 1;
    this.#provisionalBySource.set(sourceKey, pair);
    const unwind = () => this.#releasePair(pair);

    try {
      const collected = Object.freeze(
        PickupCollectedTemplateV1Schema.parse(collectedInput),
      );
      const rawPlan = this.#options.planner(collected);
      if (
        rawPlan !== null &&
        (typeof rawPlan === "object" || typeof rawPlan === "function") &&
        typeof (rawPlan as { then?: unknown }).then === "function"
      )
        throw new PreparedEffectHostError(
          PreparedEffectHostErrorCode.invalidPlannerResult,
          "effect planner returned a thenable",
        );
      if (!Array.isArray(rawPlan))
        throw new PreparedEffectHostError(
          PreparedEffectHostErrorCode.invalidPlannerResult,
          "effect planner must return one application array",
        );
      if (rawPlan.length > this.#options.maximumApplicationsPerCommit)
        throw new PreparedEffectHostError(
          PreparedEffectHostErrorCode.capacityExceeded,
          "effect plan exceeds the application ceiling",
        );
      const plan = Object.freeze(
        rawPlan.map((application) => {
          const template = Object.freeze(
            ModifierApplicationTemplateV1Schema.parse(application),
          );
          const route = this.#routes.get(template.routeId);
          if (
            route === undefined ||
            route.targetInstanceId !== template.targetInstanceId ||
            route.fieldId !== template.fieldId ||
            route.operation !== template.operation
          )
            throw new PreparedEffectHostError(
              PreparedEffectHostErrorCode.invalidRoute,
              `application does not match its singleton route: ${template.routeId}`,
            );
          return Object.freeze({ template, route });
        }),
      );
      let capabilityActive = true;
      return Object.freeze({
        commit: () => {
          if (!capabilityActive || !pair.active)
            throw new PreparedEffectHostError(
              PreparedEffectHostErrorCode.staleCapability,
              "prepared effect capability is stale",
            );
          capabilityActive = false;
          try {
            this.#commit(token, pair, collected, plan);
          } catch (error) {
            if (pair.active) unwind();
            throw error;
          }
        },
        abandon: () => {
          if (!capabilityActive) return;
          capabilityActive = false;
          unwind();
        },
      });
    } catch (error) {
      unwind();
      throw error;
    }
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    for (const pair of this.#provisionalBySource.values()) pair.active = false;
    this.#provisionalBySource.clear();
    this.#durableSources.clear();
    this.#handlers.clear();
    this.#activeSlots = 0;
  }

  #releasePair(pair: ProvisionalPair): void {
    if (!pair.active) return;
    pair.active = false;
    this.#provisionalBySource.delete(pair.sourceKey);
    this.#activeSlots -= 1;
  }

  #commit(
    token: object,
    pair: ProvisionalPair,
    collected: ReturnType<typeof PickupCollectedTemplateV1Schema.parse>,
    plan: readonly Readonly<{
      template: ReturnType<typeof ModifierApplicationTemplateV1Schema.parse>;
      route: ResolvedEffectApplicationRouteV13;
    }>[],
  ): void {
    this.#options.assertRunningEventToken(token);
    if (!pair.active || this.#provisionalBySource.get(pair.sourceKey) !== pair)
      throw new PreparedEffectHostError(
        PreparedEffectHostErrorCode.staleCapability,
        "prepared effect capability lost its provisional pair",
      );
    for (const entry of plan) {
      if (!this.#handlers.has(entry.route.routeId))
        throw new PreparedEffectHostError(
          PreparedEffectHostErrorCode.inactiveRouteLease,
          `inactive addressed target lease: ${entry.route.routeId}`,
        );
    }
    preflightMonotonicAllocations([
      { counter: this.#commitSequence, count: 1 },
      { counter: this.#evidenceSequence, count: 1 },
      { counter: this.#eventSequence, count: 1 + plan.length },
    ]);
    const commitSequence = this.#commitSequence.allocate();
    const commitEvidenceId = this.#evidenceSequence.allocate();
    const eventBlock = this.#eventSequence.allocateBlock(1 + plan.length);
    const emittedAtMs = this.#options.nowMs();
    let collectedPayload: Readonly<unknown>;
    let applications: readonly Readonly<unknown>[];
    try {
      collectedPayload = Object.freeze(
        PickupCollectedPayloadSchema.parse({
          ...collected,
          sequence: eventBlock.base,
          emittedAtMs,
          commitSequence,
          commitEvidenceId,
          eventOrdinal: 0,
        }),
      );
      applications = Object.freeze(
        plan.map((entry, index) =>
          Object.freeze(
            ModifierApplicationPayloadSchema.parse({
              ...entry.template,
              sequence: eventBlock.base + index + 1,
              emittedAtMs,
              commitSequence,
              commitEvidenceId,
              eventOrdinal: index + 1,
            }),
          ),
        ),
      );
    } catch (error) {
      this.#releasePair(pair);
      this.#options.recordFailure(
        Object.freeze({
          kind: "finalization-failed",
          sourceKey: pair.sourceKey,
          commitSequence,
          commitEvidenceId,
          eventSequenceBase: eventBlock.base,
          applicationCount: plan.length,
          failedOrdinals: Object.freeze(
            Array.from({ length: plan.length + 1 }, (_, index) => index),
          ),
        }),
      );
      throw error;
    }

    this.#provisionalBySource.delete(pair.sourceKey);
    this.#durableSources.add(pair.sourceKey);
    pair.active = false;
    this.#activeSlots -= 1;
    const mutation = this.#options.consumeSource(pair.sourceKey);
    if (mutation !== "consumed") {
      const evidence = Object.freeze({
        kind: "mutation-indeterminate" as const,
        sourceKey: pair.sourceKey,
        commitSequence,
        commitEvidenceId,
        eventSequenceBase: eventBlock.base,
        applicationCount: plan.length,
        failedOrdinals: Object.freeze(
          Array.from({ length: plan.length + 1 }, (_, index) => index),
        ),
      });
      const failures: unknown[] = [];
      try {
        this.#options.quarantineSource(pair.sourceKey);
      } catch (error) {
        failures.push(error);
      }
      this.#options.recordFailure(evidence);
      throw new PreparedEffectHostError(
        PreparedEffectHostErrorCode.sourceMutationIndeterminate,
        "prepared effect source mutation is indeterminate",
        Object.freeze(failures),
      );
    }

    const failures: unknown[] = [];
    const failedOrdinals: number[] = [];
    try {
      this.#options.deliverCollected(collectedPayload);
    } catch (error) {
      failures.push(error);
      failedOrdinals.push(0);
    }
    for (const [index, payload] of applications.entries()) {
      try {
        this.#handlers.get(plan[index]!.route.routeId)!(payload);
      } catch (error) {
        failures.push(error);
        failedOrdinals.push(index + 1);
      }
    }
    if (failures.length > 0) {
      this.#options.recordFailure(
        Object.freeze({
          kind: "delivery-failed",
          sourceKey: pair.sourceKey,
          commitSequence,
          commitEvidenceId,
          eventSequenceBase: eventBlock.base,
          applicationCount: plan.length,
          failedOrdinals: Object.freeze(failedOrdinals),
        }),
      );
      throw new PreparedEffectHostError(
        PreparedEffectHostErrorCode.deliveryFailed,
        "prepared effect delivery failed after source consumption",
        Object.freeze(failures),
      );
    }
  }
}
