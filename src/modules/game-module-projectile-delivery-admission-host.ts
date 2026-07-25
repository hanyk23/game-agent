import type { LogicalEntityReference } from "./game-module-entity-directory.js";
import { SafeMonotonicCounterV1 } from "./game-module-safe-counter.js";

export type ProjectileDeliveryAdmissionSnapshotV1 = Readonly<{
  requestedRequests: number;
  acceptedRequests: number;
  droppedRequestsByRate: number;
  plannedProjectiles: number;
  activatedProjectiles: number;
  droppedProjectilesByPool: number;
  activeProjectiles: number;
}>;

export type ProjectileDeliveryAdmissionResultV1 = Readonly<{
  accepted: boolean;
  activated: readonly LogicalEntityReference[];
  droppedByPool: number;
}>;

type ActiveRecord = Readonly<{
  slot: number;
  reference: LogicalEntityReference;
}>;

/**
 * Host-owned deterministic admission boundary shared by Batch 2 projectile
 * deliveries. It owns request-rate ordering and physical-pool suffix drops;
 * formation planning and projectile payload construction remain factory work.
 */
export class ProjectileDeliveryAdmissionHostV1<TPlan> {
  readonly #instanceId: string;
  readonly #maxActive: number;
  readonly #maximumEffectiveCount: number;
  readonly #maximumAcceptedRequestsPerSecond: number;
  readonly #nowMs: () => number;
  readonly #activate: (
    entityId: string,
    generation: number,
    plan: TPlan,
  ) => LogicalEntityReference;
  readonly #recycle: (reference: LogicalEntityReference) => void;
  readonly #generation: SafeMonotonicCounterV1;
  readonly #acceptedRequestTimes: number[] = [];
  readonly #active = new Map<string, ActiveRecord>();
  #lastRequestSequence = -1;
  #lastRequestTime = -1;
  #requestedRequests = 0;
  #acceptedRequests = 0;
  #droppedRequestsByRate = 0;
  #plannedProjectiles = 0;
  #activatedProjectiles = 0;
  #droppedProjectilesByPool = 0;
  #disposed = false;

  constructor(
    input: Readonly<{
      instanceId: string;
      maxActive: number;
      maximumEffectiveCount: number;
      maximumAcceptedRequestsPerSecond: number;
      nowMs(): number;
      activate(
        entityId: string,
        generation: number,
        plan: TPlan,
      ): LogicalEntityReference;
      recycle(reference: LogicalEntityReference): void;
    }>,
  ) {
    if (
      !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(input.instanceId) ||
      !Number.isSafeInteger(input.maxActive) ||
      input.maxActive < 1 ||
      !Number.isSafeInteger(input.maximumEffectiveCount) ||
      input.maximumEffectiveCount < 1 ||
      input.maximumEffectiveCount > input.maxActive ||
      !Number.isSafeInteger(input.maximumAcceptedRequestsPerSecond) ||
      input.maximumAcceptedRequestsPerSecond < 1
    )
      throw new Error("invalid projectile delivery admission configuration");
    this.#instanceId = input.instanceId;
    this.#maxActive = input.maxActive;
    this.#maximumEffectiveCount = input.maximumEffectiveCount;
    this.#maximumAcceptedRequestsPerSecond =
      input.maximumAcceptedRequestsPerSecond;
    this.#nowMs = input.nowMs;
    this.#activate = input.activate;
    this.#recycle = input.recycle;
    this.#generation = new SafeMonotonicCounterV1(
      `${input.instanceId}.projectile-generation`,
    );
  }

  admit(
    requestSequence: number,
    plan: readonly TPlan[],
  ): ProjectileDeliveryAdmissionResultV1 {
    this.#requireAlive();
    const nowMs = this.#readNow();
    if (
      !Number.isSafeInteger(requestSequence) ||
      requestSequence < 0 ||
      requestSequence <= this.#lastRequestSequence
    )
      throw new Error("attack request sequence is not strictly increasing");
    if (nowMs < this.#lastRequestTime)
      throw new Error("attack request time is not monotonic");
    if (!Array.isArray(plan) || plan.length > this.#maximumEffectiveCount)
      throw new Error("planned salvo exceeds maximum effective count");

    this.#lastRequestSequence = requestSequence;
    this.#lastRequestTime = nowMs;
    this.#requestedRequests += 1;
    while (
      this.#acceptedRequestTimes.length > 0 &&
      this.#acceptedRequestTimes[0]! <= nowMs - 1_000
    )
      this.#acceptedRequestTimes.shift();
    if (
      this.#acceptedRequestTimes.length >=
      this.#maximumAcceptedRequestsPerSecond
    ) {
      this.#droppedRequestsByRate += 1;
      return Object.freeze({
        accepted: false,
        activated: Object.freeze([]),
        droppedByPool: 0,
      });
    }

    this.#acceptedRequestTimes.push(nowMs);
    this.#acceptedRequests += 1;
    this.#plannedProjectiles += plan.length;
    const available = this.#maxActive - this.#active.size;
    const activationCount = Math.min(available, plan.length);
    if (activationCount > 0) this.#generation.preflightBlock(activationCount);
    const freeSlots = this.#freeSlots(activationCount);
    const activated: LogicalEntityReference[] = [];
    for (let index = 0; index < activationCount; index += 1) {
      const generation = this.#generation.allocate();
      const slot = freeSlots[index]!;
      const entityId = `${this.#instanceId}-projectile-${slot}`;
      const reference = this.#activate(entityId, generation, plan[index]!);
      this.#active.set(
        entityId,
        Object.freeze({ slot, reference: Object.freeze({ ...reference }) }),
      );
      activated.push(Object.freeze({ ...reference }));
    }
    const droppedByPool = plan.length - activationCount;
    this.#activatedProjectiles += activationCount;
    this.#droppedProjectilesByPool += droppedByPool;
    return Object.freeze({
      accepted: true,
      activated: Object.freeze(activated),
      droppedByPool,
    });
  }

  recycle(reference: LogicalEntityReference): void {
    this.#requireAlive();
    const active = this.#active.get(reference.entityId);
    if (
      active === undefined ||
      active.reference.channelId !== reference.channelId ||
      active.reference.generation !== reference.generation ||
      active.reference.ownerActorId !== reference.ownerActorId ||
      active.reference.entityRole !== reference.entityRole
    )
      throw new Error("projectile reference is not active in this pool");
    this.#recycle(active.reference);
    this.#active.delete(reference.entityId);
  }

  observe(): ProjectileDeliveryAdmissionSnapshotV1 {
    return Object.freeze({
      requestedRequests: this.#requestedRequests,
      acceptedRequests: this.#acceptedRequests,
      droppedRequestsByRate: this.#droppedRequestsByRate,
      plannedProjectiles: this.#plannedProjectiles,
      activatedProjectiles: this.#activatedProjectiles,
      droppedProjectilesByPool: this.#droppedProjectilesByPool,
      activeProjectiles: this.#active.size,
    });
  }

  stop(): void {
    this.#requireAlive();
    this.#recycleActive();
    this.#acceptedRequestTimes.splice(0);
    this.#lastRequestTime = -1;
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#recycleActive();
    this.#acceptedRequestTimes.splice(0);
    this.#disposed = true;
  }

  #recycleActive(): void {
    for (const active of [...this.#active.values()].sort(
      (left, right) => left.slot - right.slot,
    ))
      this.#recycle(active.reference);
    this.#active.clear();
  }

  #freeSlots(count: number): number[] {
    const occupied = new Set(
      [...this.#active.values()].map(({ slot }) => slot),
    );
    const slots: number[] = [];
    for (
      let slot = 0;
      slot < this.#maxActive && slots.length < count;
      slot += 1
    )
      if (!occupied.has(slot)) slots.push(slot);
    return slots;
  }

  #readNow(): number {
    const nowMs = this.#nowMs();
    if (!Number.isSafeInteger(nowMs) || nowMs < 0)
      throw new Error("projectile delivery clock returned invalid time");
    return nowMs;
  }

  #requireAlive(): void {
    if (this.#disposed) throw new Error("projectile delivery host is disposed");
  }
}
