import type { ResolvedActorSnapshotGrantV13 } from "./game-module-resolver.js";
import { SafeMonotonicCounterV1 } from "./game-module-safe-counter.js";

export const ActorSnapshotHostErrorCode = {
  invalidActor: "invalid-actor",
  duplicateActor: "duplicate-actor",
  unknownActor: "unknown-actor",
  unknownGrant: "unknown-grant",
  unauthorized: "unauthorized",
} as const;

export class ActorSnapshotHostError extends Error {
  constructor(
    readonly code: (typeof ActorSnapshotHostErrorCode)[keyof typeof ActorSnapshotHostErrorCode],
    message: string,
  ) {
    super(message);
    this.name = "ActorSnapshotHostError";
  }
}

export type ActorSnapshotSourceV13 = Readonly<{
  actorId: string;
  role: "player" | "enemy" | "boss" | "companion" | "world";
  active: boolean;
  position: Readonly<{ x: number; y: number }>;
  collisionRadius: number;
  healthRatio: number;
}>;

type ActorRecord = ActorSnapshotSourceV13 & { actorGeneration: number };

export type ActorSnapshotEnvelopeV13 = Readonly<{
  directoryRevision: number;
  sampledAtMs: number;
  sampledFrameSequence: number;
  entryCount: number;
  entries: readonly Readonly<Record<string, unknown>>[];
}>;

function fail(
  code: (typeof ActorSnapshotHostErrorCode)[keyof typeof ActorSnapshotHostErrorCode],
  message: string,
): never {
  throw new ActorSnapshotHostError(code, message);
}

function validateActor(actor: ActorSnapshotSourceV13): void {
  if (
    !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(actor.actorId) ||
    !Number.isFinite(actor.position.x) ||
    !Number.isFinite(actor.position.y) ||
    !Number.isFinite(actor.collisionRadius) ||
    actor.collisionRadius < 0 ||
    !Number.isFinite(actor.healthRatio) ||
    actor.healthRatio < 0 ||
    actor.healthRatio > 1
  )
    fail(
      ActorSnapshotHostErrorCode.invalidActor,
      "invalid actor snapshot data",
    );
}

export class DeterministicActorSnapshotHostV13 {
  readonly #grants = new Map<string, ResolvedActorSnapshotGrantV13>();
  readonly #actors = new Map<string, ActorRecord>();
  readonly #generationCounters = new Map<string, SafeMonotonicCounterV1>();
  readonly #directoryRevision = new SafeMonotonicCounterV1(
    "actor.directory-revision",
  );

  constructor(grants: readonly ResolvedActorSnapshotGrantV13[]) {
    for (const grant of grants) {
      if (this.#grants.has(grant.grantId))
        fail(
          ActorSnapshotHostErrorCode.unknownGrant,
          `duplicate actor snapshot grant: ${grant.grantId}`,
        );
      this.#grants.set(grant.grantId, grant);
    }
  }

  get directoryRevision(): number {
    return Math.max(0, this.#directoryRevision.current);
  }

  register(actor: ActorSnapshotSourceV13): number {
    validateActor(actor);
    if (this.#actors.has(actor.actorId))
      fail(
        ActorSnapshotHostErrorCode.duplicateActor,
        `actor already registered: ${actor.actorId}`,
      );
    const generation =
      this.#generationCounters.get(actor.actorId) ??
      new SafeMonotonicCounterV1(`actor.generation.${actor.actorId}`);
    generation.preflightBlock(1);
    this.#directoryRevision.preflightBlock(1);
    const actorGeneration = generation.allocate();
    this.#generationCounters.set(actor.actorId, generation);
    this.#actors.set(actor.actorId, {
      ...structuredClone(actor),
      position: Object.freeze({ ...actor.position }),
      actorGeneration,
    });
    this.#directoryRevision.allocate();
    return actorGeneration;
  }

  update(
    actorId: string,
    update: Partial<Omit<ActorSnapshotSourceV13, "actorId" | "role">>,
  ): void {
    const current = this.#actors.get(actorId);
    if (current === undefined)
      fail(
        ActorSnapshotHostErrorCode.unknownActor,
        `unknown actor: ${actorId}`,
      );
    const next: ActorSnapshotSourceV13 = {
      actorId,
      role: current.role,
      active: update.active ?? current.active,
      position: update.position ?? current.position,
      collisionRadius: update.collisionRadius ?? current.collisionRadius,
      healthRatio: update.healthRatio ?? current.healthRatio,
    };
    validateActor(next);
    this.#directoryRevision.preflightBlock(1);
    Object.assign(current, next, {
      position: Object.freeze({ ...next.position }),
    });
    this.#directoryRevision.allocate();
  }

  remove(actorId: string): void {
    if (!this.#actors.has(actorId))
      fail(
        ActorSnapshotHostErrorCode.unknownActor,
        `unknown actor: ${actorId}`,
      );
    this.#directoryRevision.preflightBlock(1);
    this.#actors.delete(actorId);
    this.#directoryRevision.allocate();
  }

  snapshot(
    instanceId: string,
    grantId: string,
    sampledAtMs: number,
    sampledFrameSequence: number,
  ): ActorSnapshotEnvelopeV13 {
    const grant = this.#grants.get(grantId);
    if (grant === undefined)
      fail(
        ActorSnapshotHostErrorCode.unknownGrant,
        `unknown actor snapshot grant: ${grantId}`,
      );
    if (grant.instanceId !== instanceId)
      fail(
        ActorSnapshotHostErrorCode.unauthorized,
        `${instanceId} cannot use ${grantId}`,
      );
    if (
      !Number.isSafeInteger(sampledAtMs) ||
      sampledAtMs < 0 ||
      !Number.isSafeInteger(sampledFrameSequence) ||
      sampledFrameSequence < 0
    )
      fail(
        ActorSnapshotHostErrorCode.invalidActor,
        "snapshot envelope identity must be a non-negative safe integer",
      );
    const owner = this.#actors.get(grant.ownerActorId);
    if (owner === undefined)
      fail(
        ActorSnapshotHostErrorCode.unknownActor,
        `snapshot owner is absent: ${grant.ownerActorId}`,
      );
    const descriptor = grant.descriptor;
    const selected = [...this.#actors.values()].filter(
      (actor) =>
        descriptor.targetActorRoles.includes(actor.role) &&
        (descriptor.ownerRelation === "same-owner"
          ? actor.actorId === owner.actorId
          : actor.actorId !== owner.actorId),
    );
    selected.sort((left, right) => {
      if (descriptor.order === "distance-then-actor-id-generation") {
        const leftDistance =
          (left.position.x - owner.position.x) ** 2 +
          (left.position.y - owner.position.y) ** 2;
        const rightDistance =
          (right.position.x - owner.position.x) ** 2 +
          (right.position.y - owner.position.y) ** 2;
        if (leftDistance !== rightDistance) return leftDistance - rightDistance;
      }
      return (
        left.actorId.localeCompare(right.actorId) ||
        left.actorGeneration - right.actorGeneration
      );
    });
    const entries = Object.freeze(
      selected.slice(0, descriptor.maximumEntries).map((actor) => {
        const source: Record<string, unknown> = {
          actorId: actor.actorId,
          actorGeneration: actor.actorGeneration,
          role: actor.role,
          active: actor.active,
          position: Object.freeze({ ...actor.position }),
          collisionRadius: actor.collisionRadius,
          healthRatio: actor.healthRatio,
        };
        return Object.freeze(
          Object.fromEntries(
            descriptor.entryFields.map((field) => [field, source[field]]),
          ),
        );
      }),
    );
    return Object.freeze({
      directoryRevision: this.directoryRevision,
      sampledAtMs,
      sampledFrameSequence,
      entryCount: entries.length,
      entries,
    });
  }
}
