import {
  AttackRequestPayloadV3Schema,
  EmissionPayloadV2Schema,
  TargetedAttackPayloadSchema,
  type AttackRequestPayloadV3,
  type EmissionPayloadV2,
  type TargetedAttackPayload,
} from "./game-module-runtime-payloads.js";

type PendingAttack = {
  request: AttackRequestPayloadV3;
  sourcePosition: Readonly<{ x: number; y: number }>;
  targeted?: TargetedAttackPayload;
};

function deepFreeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>))
      deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export type HostileProjectileEmissionInputV1 = Readonly<{
  projectileEntityId: string;
  projectileChannelId: string;
  projectileGeneration: number;
  position: Readonly<{ x: number; y: number }>;
  velocity: Readonly<{ x: number; y: number }>;
  damage: number;
}>;

/** Exact V3 source -> targeting -> delivery lineage with one frozen source read. */
export class HostileAttackLineageRouterV1 {
  readonly #sourceInstanceId: string;
  readonly #targetingInstanceId: string;
  readonly #deliveryInstanceId: string;
  readonly #rootChannelId: string;
  readonly #attackChannelId: string;
  readonly #projectileChannelId: string;
  readonly #maximumPending: number;
  readonly #readActiveSource: (
    rootChannelId: string,
    actorId: string,
    actorGeneration: number,
  ) => Readonly<{ position: Readonly<{ x: number; y: number }> }>;
  readonly #pending = new Map<string, PendingAttack>();
  readonly #lastRequestSequenceBySource = new Map<string, number>();
  #disposed = false;

  constructor(
    input: Readonly<{
      sourceInstanceId: string;
      targetingInstanceId: string;
      deliveryInstanceId: string;
      rootChannelId: string;
      attackChannelId: string;
      projectileChannelId: string;
      maximumPending: number;
      readActiveSource(
        rootChannelId: string,
        actorId: string,
        actorGeneration: number,
      ): Readonly<{ position: Readonly<{ x: number; y: number }> }>;
    }>,
  ) {
    if (
      [
        input.sourceInstanceId,
        input.targetingInstanceId,
        input.deliveryInstanceId,
      ].some((id) => !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id)) ||
      [
        input.rootChannelId,
        input.attackChannelId,
        input.projectileChannelId,
      ].some((id) => !/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(id)) ||
      !Number.isSafeInteger(input.maximumPending) ||
      input.maximumPending < 1 ||
      input.maximumPending > 10_000
    )
      throw new Error("invalid hostile attack lineage configuration");
    this.#sourceInstanceId = input.sourceInstanceId;
    this.#targetingInstanceId = input.targetingInstanceId;
    this.#deliveryInstanceId = input.deliveryInstanceId;
    this.#rootChannelId = input.rootChannelId;
    this.#attackChannelId = input.attackChannelId;
    this.#projectileChannelId = input.projectileChannelId;
    this.#maximumPending = input.maximumPending;
    this.#readActiveSource = input.readActiveSource;
  }

  acceptRequest(
    senderInstanceId: string,
    requestInput: AttackRequestPayloadV3,
  ): AttackRequestPayloadV3 {
    this.#requireAlive();
    if (senderInstanceId !== this.#sourceInstanceId)
      throw new Error("hostile request sender authority mismatch");
    const request = deepFreeze(
      AttackRequestPayloadV3Schema.parse(requestInput),
    );
    if (
      request.rootChannelId !== this.#rootChannelId ||
      request.attackChannelId !== this.#attackChannelId
    )
      throw new Error("hostile request channel lineage mismatch");
    const sourceKey = `${request.sourceActorId}@${request.sourceGeneration}`;
    if (
      request.sequence <=
      (this.#lastRequestSequenceBySource.get(sourceKey) ?? -1)
    )
      throw new Error("hostile source request sequence is not increasing");
    if (this.#pending.size >= this.#maximumPending)
      throw new Error("hostile attack pending capacity exhausted");
    const key = this.#key(request);
    if (this.#pending.has(key))
      throw new Error("duplicate hostile attack request");
    const snapshot = this.#readActiveSource(
      request.rootChannelId,
      request.sourceActorId,
      request.sourceGeneration,
    );
    if (
      !Number.isFinite(snapshot.position.x) ||
      !Number.isFinite(snapshot.position.y)
    )
      throw new Error("hostile source snapshot is invalid");
    const frozenPosition = Object.freeze({ ...snapshot.position });
    this.#pending.set(key, { request, sourcePosition: frozenPosition });
    this.#lastRequestSequenceBySource.set(sourceKey, request.sequence);
    return request;
  }

  target(
    senderInstanceId: string,
    requestInput: AttackRequestPayloadV3,
    direction: Readonly<{ x: number; y: number }>,
  ): TargetedAttackPayload {
    this.#requireAlive();
    if (senderInstanceId !== this.#targetingInstanceId)
      throw new Error("hostile targeting sender authority mismatch");
    const request = AttackRequestPayloadV3Schema.parse(requestInput);
    const pending = this.#pending.get(this.#key(request));
    if (
      pending === undefined ||
      pending.targeted !== undefined ||
      JSON.stringify(request) !== JSON.stringify(pending.request)
    )
      throw new Error("hostile targeting request identity mismatch");
    const targeted = deepFreeze(
      TargetedAttackPayloadSchema.parse({
        ...pending.request,
        sourcePosition: pending.sourcePosition,
        direction,
      }),
    );
    pending.targeted = targeted;
    return targeted;
  }

  targetPosition(
    senderInstanceId: string,
    requestInput: AttackRequestPayloadV3,
    targetPosition: Readonly<{ x: number; y: number }>,
  ): TargetedAttackPayload {
    const request = AttackRequestPayloadV3Schema.parse(requestInput);
    const pending = this.#pending.get(this.#key(request));
    if (
      !Number.isFinite(targetPosition.x) ||
      !Number.isFinite(targetPosition.y) ||
      pending === undefined
    )
      throw new Error("hostile aimed target position is invalid");
    const x = targetPosition.x - pending.sourcePosition.x;
    const y = targetPosition.y - pending.sourcePosition.y;
    const magnitude = Math.hypot(x, y);
    if (!Number.isFinite(magnitude) || magnitude <= 0)
      throw new Error("hostile aimed target coincides with source");
    return this.target(senderInstanceId, request, {
      x: x / magnitude,
      y: y / magnitude,
    });
  }

  emit(
    senderInstanceId: string,
    targetedInput: TargetedAttackPayload,
    projectile: HostileProjectileEmissionInputV1,
    finalizeRequest = true,
  ): EmissionPayloadV2 {
    this.#requireAlive();
    if (senderInstanceId !== this.#deliveryInstanceId)
      throw new Error("hostile delivery sender authority mismatch");
    const targeted = TargetedAttackPayloadSchema.parse(targetedInput);
    const key = this.#key(targeted);
    const pending = this.#pending.get(key);
    if (
      pending?.targeted === undefined ||
      JSON.stringify(targeted) !== JSON.stringify(pending.targeted) ||
      projectile.projectileChannelId !== this.#projectileChannelId
    )
      throw new Error("hostile delivery lineage or targeted identity mismatch");
    const emission = deepFreeze(
      EmissionPayloadV2Schema.parse({ ...targeted, ...projectile }),
    );
    if (finalizeRequest) this.#pending.delete(key);
    return emission;
  }

  completeDelivery(
    senderInstanceId: string,
    targetedInput: TargetedAttackPayload,
  ): void {
    this.#requireAlive();
    if (senderInstanceId !== this.#deliveryInstanceId)
      throw new Error("hostile delivery sender authority mismatch");
    const targeted = TargetedAttackPayloadSchema.parse(targetedInput);
    const key = this.#key(targeted);
    const pending = this.#pending.get(key);
    if (
      pending?.targeted === undefined ||
      JSON.stringify(targeted) !== JSON.stringify(pending.targeted)
    )
      throw new Error("hostile delivery completion identity mismatch");
    this.#pending.delete(key);
  }

  cancelSource(sourceActorId: string, sourceGeneration: number): number {
    this.#requireAlive();
    let cancelled = 0;
    for (const [key, pending] of this.#pending)
      if (
        pending.request.sourceActorId === sourceActorId &&
        pending.request.sourceGeneration === sourceGeneration
      ) {
        this.#pending.delete(key);
        cancelled += 1;
      }
    return cancelled;
  }

  snapshot(): Readonly<{ pendingCount: number }> {
    this.#requireAlive();
    return Object.freeze({ pendingCount: this.#pending.size });
  }

  dispose(): void {
    this.#requireAlive();
    this.#pending.clear();
    this.#disposed = true;
  }

  #key(request: AttackRequestPayloadV3): string {
    return JSON.stringify([
      request.rootChannelId,
      request.sourceActorId,
      request.sourceGeneration,
      request.attackChannelId,
      request.sequence,
      request.emissionIndex,
    ]);
  }

  #requireAlive(): void {
    if (this.#disposed) throw new Error("hostile attack router is disposed");
  }
}
