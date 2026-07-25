import {
  RuntimeKernelSessionQuarantineLedgerV12,
  type QuarantineReportV12,
} from "./game-module-runtime-abi-v12.js";
import { SafeMonotonicCounterV1 } from "./game-module-safe-counter.js";

export type ActorRootReferenceV1 = Readonly<{
  rootChannelId: string;
  actorId: string;
  actorGeneration: number;
  actorRole: "enemy" | "boss";
  sourceId: string;
  slotIndex: number;
}>;

export type ActorRootActivationRequestV1 = Readonly<{
  sourceId: string;
  assetRole: "enemy" | "boss";
  position: Readonly<{ x: number; y: number }>;
  radius: number;
  movement:
    | Readonly<{
        mode: "scrolling-wave-v1";
        velocity: Readonly<{ x: number; y: number }>;
      }>
    | Readonly<{
        mode: "boss-horizontal-v1";
        speed: number;
        minX: number;
        maxX: number;
      }>;
}>;

type ActorRootRecord = {
  reference: ActorRootReferenceV1;
  state: "activating" | "active" | "deactivating" | "quarantined";
  releaseActiveEntity: () => void;
  releaseQuarantine: () => void;
};

type ActorRootCustodyAdapterV1 = Readonly<{
  activatePhysical(
    reference: ActorRootReferenceV1,
    request: ActorRootActivationRequestV1,
  ): void;
  activateLogical(
    reference: ActorRootReferenceV1,
    request: ActorRootActivationRequestV1,
  ): void;
  deactivatePhysical(reference: ActorRootReferenceV1, reason: string): boolean;
  deactivateLogical(reference: ActorRootReferenceV1, reason: string): boolean;
}>;

function validId(value: string): boolean {
  return /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(value);
}

/** ADR 0028 host-minted actor-root identity and conservative custody boundary. */
export class ActorRootCustodyHostV1 {
  readonly #producerInstanceId: string;
  readonly #rootChannelId: string;
  readonly #actorRole: "enemy" | "boss";
  readonly #capacity: number;
  readonly #session: RuntimeKernelSessionQuarantineLedgerV12;
  readonly #reserveActiveEntity: () => () => void;
  readonly #adapter: ActorRootCustodyAdapterV1;
  readonly #generation: SafeMonotonicCounterV1;
  readonly #records = new Map<number, ActorRootRecord>();
  #disposed = false;

  constructor(
    input: Readonly<{
      producerInstanceId: string;
      rootChannelId: string;
      actorRole: "enemy" | "boss";
      capacity: number;
      session: RuntimeKernelSessionQuarantineLedgerV12;
      reserveActiveEntity(): () => void;
      adapter: ActorRootCustodyAdapterV1;
      lastAllocatedGeneration?: number;
    }>,
  ) {
    if (
      !validId(input.producerInstanceId) ||
      !validId(input.rootChannelId) ||
      !Number.isSafeInteger(input.capacity) ||
      input.capacity < 1 ||
      input.capacity > 10_000
    )
      throw new Error("invalid actor-root custody configuration");
    this.#producerInstanceId = input.producerInstanceId;
    this.#rootChannelId = input.rootChannelId;
    this.#actorRole = input.actorRole;
    this.#capacity = input.capacity;
    this.#session = input.session;
    this.#reserveActiveEntity = input.reserveActiveEntity;
    this.#adapter = input.adapter;
    this.#generation = new SafeMonotonicCounterV1(
      `${input.rootChannelId}.actor-generation`,
      input.lastAllocatedGeneration ?? -1,
    );
  }

  activate(request: ActorRootActivationRequestV1): ActorRootReferenceV1 {
    this.#requireAlive();
    this.#validateRequest(request);
    const slotIndex = this.#lowestFreeSlot();
    if (slotIndex === undefined)
      throw new Error("actor-root capacity exhausted");
    this.#generation.preflightBlock(1);
    const releaseQuarantine = this.#session.reserveActivation();
    let releaseActiveEntity: (() => void) | undefined;
    try {
      releaseActiveEntity = this.#reserveActiveEntity();
    } catch (error) {
      releaseQuarantine();
      throw error;
    }
    const actorGeneration = this.#generation.allocate();
    const reference = Object.freeze({
      rootChannelId: this.#rootChannelId,
      actorId: `root/${this.#producerInstanceId}/${slotIndex}`,
      actorGeneration,
      actorRole: this.#actorRole,
      sourceId: request.sourceId,
      slotIndex,
    });
    const record: ActorRootRecord = {
      reference,
      state: "activating",
      releaseActiveEntity,
      releaseQuarantine,
    };
    this.#records.set(slotIndex, record);
    try {
      this.#adapter.activatePhysical(reference, request);
      this.#adapter.activateLogical(reference, request);
      record.state = "active";
      return reference;
    } catch (primary) {
      const physicalInactive = this.#attempt(() =>
        this.#adapter.deactivatePhysical(reference, "activation-rollback"),
      );
      const logicalInactive = this.#attempt(() =>
        this.#adapter.deactivateLogical(reference, "activation-rollback"),
      );
      if (physicalInactive && logicalInactive) {
        releaseActiveEntity();
        releaseQuarantine();
        this.#records.delete(slotIndex);
      } else {
        record.state = "quarantined";
        this.#session.transfer(
          reference.actorId,
          actorGeneration,
          this.#retainedTokens(reference),
          releaseQuarantine,
        );
      }
      throw new Error("actor-root activation failed", { cause: primary });
    }
  }

  deactivate(reference: ActorRootReferenceV1, reason: string): void {
    this.#requireAlive();
    const record = this.#requireActive(reference);
    if (!validId(reason))
      throw new Error("invalid actor-root deactivation reason");
    record.state = "deactivating";
    const physicalInactive = this.#attempt(() =>
      this.#adapter.deactivatePhysical(record.reference, reason),
    );
    const logicalInactive = this.#attempt(() =>
      this.#adapter.deactivateLogical(record.reference, reason),
    );
    if (physicalInactive && logicalInactive) {
      record.releaseActiveEntity();
      record.releaseQuarantine();
      this.#records.delete(reference.slotIndex);
      return;
    }
    record.state = "quarantined";
    this.#session.transfer(
      reference.actorId,
      reference.actorGeneration,
      this.#retainedTokens(reference),
      record.releaseQuarantine,
    );
    throw new Error("actor-root deactivation result is indeterminate");
  }

  snapshot(): Readonly<{
    roots: readonly Readonly<{
      reference: ActorRootReferenceV1;
      state: ActorRootRecord["state"];
    }>[];
  }> {
    this.#requireAlive();
    return Object.freeze({
      roots: Object.freeze(
        [...this.#records.values()]
          .sort(
            (left, right) =>
              left.reference.slotIndex - right.reference.slotIndex,
          )
          .map((record) =>
            Object.freeze({
              reference: record.reference,
              state: record.state,
            }),
          ),
      ),
    });
  }

  cleanupQuarantine(): QuarantineReportV12 {
    this.#requireAlive();
    return this.#session.finalCleanup((entry) => {
      const record = [...this.#records.values()].find(
        ({ reference, state }) =>
          state === "quarantined" &&
          reference.actorId === entry.identity &&
          reference.actorGeneration === entry.generation,
      );
      if (record === undefined) return false;
      const physicalInactive = this.#attempt(() =>
        this.#adapter.deactivatePhysical(
          record.reference,
          "quarantine-cleanup",
        ),
      );
      const logicalInactive = this.#attempt(() =>
        this.#adapter.deactivateLogical(record.reference, "quarantine-cleanup"),
      );
      if (!physicalInactive || !logicalInactive) return false;
      record.releaseActiveEntity();
      this.#records.delete(record.reference.slotIndex);
      return true;
    });
  }

  dispose(): void {
    this.#requireAlive();
    for (const record of [...this.#records.values()].sort(
      (left, right) => right.reference.slotIndex - left.reference.slotIndex,
    )) {
      if (record.state === "active")
        this.deactivate(record.reference, "graph-dispose");
    }
    if (this.#records.size > 0)
      throw new Error("actor-root custody remains quarantined");
    this.#disposed = true;
  }

  #lowestFreeSlot(): number | undefined {
    for (let slot = 0; slot < this.#capacity; slot += 1)
      if (!this.#records.has(slot)) return slot;
    return undefined;
  }

  #requireActive(reference: ActorRootReferenceV1): ActorRootRecord {
    const record = this.#records.get(reference.slotIndex);
    if (
      record?.state !== "active" ||
      record.reference.actorId !== reference.actorId ||
      record.reference.actorGeneration !== reference.actorGeneration ||
      record.reference.rootChannelId !== reference.rootChannelId
    )
      throw new Error("actor-root reference is stale or inactive");
    return record;
  }

  #validateRequest(request: ActorRootActivationRequestV1): void {
    const exactRequestKeys = [
      "assetRole",
      "movement",
      "position",
      "radius",
      "sourceId",
    ];
    const exactPositionKeys = ["x", "y"];
    const movementKeys =
      request.movement.mode === "scrolling-wave-v1"
        ? ["mode", "velocity"]
        : ["maxX", "minX", "mode", "speed"];
    const movementIsValid =
      request.movement.mode === "scrolling-wave-v1"
        ? Object.keys(request.movement).sort().join() === movementKeys.join() &&
          Object.keys(request.movement.velocity).sort().join() === "x,y" &&
          Number.isFinite(request.movement.velocity.x) &&
          Number.isFinite(request.movement.velocity.y)
        : request.movement.mode === "boss-horizontal-v1" &&
          Object.keys(request.movement).sort().join() === movementKeys.join() &&
          Number.isFinite(request.movement.speed) &&
          request.movement.speed >= 0 &&
          Number.isFinite(request.movement.minX) &&
          Number.isFinite(request.movement.maxX) &&
          request.movement.minX <= request.movement.maxX;
    if (
      Object.keys(request).sort().join() !== exactRequestKeys.join() ||
      Object.keys(request.position).sort().join() !==
        exactPositionKeys.join() ||
      !validId(request.sourceId) ||
      request.assetRole !== this.#actorRole ||
      !Number.isFinite(request.position.x) ||
      !Number.isFinite(request.position.y) ||
      !Number.isFinite(request.radius) ||
      request.radius <= 0 ||
      !movementIsValid
    )
      throw new Error("invalid actor-root activation request");
  }

  #retainedTokens(reference: ActorRootReferenceV1): readonly string[] {
    return Object.freeze([
      `actor-root-slot:${this.#rootChannelId}:${reference.slotIndex}`,
      `active-entity:${this.#rootChannelId}`,
    ]);
  }

  #attempt(operation: () => boolean): boolean {
    try {
      return operation() === true;
    } catch {
      return false;
    }
  }

  #requireAlive(): void {
    if (this.#disposed) throw new Error("actor-root custody host is disposed");
  }
}
