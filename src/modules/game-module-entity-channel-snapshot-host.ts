import type {
  ResolvedEntityChannelReadGrantV13,
  ResolvedModuleGraphV13,
} from "./game-module-resolver.js";

export type EntityChannelSnapshotEntryV13 = Readonly<{
  entityId: string;
  generation: number;
  position: Readonly<{ x: number; y: number }>;
  collisionRadius: number;
  active: boolean;
}>;

export class EntityChannelSnapshotHostError extends Error {}

type ChannelRecord = {
  readonly ownerInstanceId: string;
  readonly capacity: number;
  readonly entries: Map<string, EntityChannelSnapshotEntryV13>;
};

export class DeterministicEntityChannelSnapshotHostV13 {
  readonly #channels = new Map<string, ChannelRecord>();
  readonly #grants = new Map<string, ResolvedEntityChannelReadGrantV13>();

  constructor(
    channels: ResolvedModuleGraphV13["entityChannels"],
    grants: readonly ResolvedEntityChannelReadGrantV13[],
  ) {
    for (const channel of channels) {
      if (this.#channels.has(channel.channelId))
        throw new EntityChannelSnapshotHostError(
          `duplicate entity channel: ${channel.channelId}`,
        );
      this.#channels.set(channel.channelId, {
        ownerInstanceId: channel.ownerInstanceId,
        capacity: channel.capacity,
        entries: new Map(),
      });
    }
    for (const grant of grants) {
      if (
        this.#grants.has(grant.grantId) ||
        !this.#channels.has(grant.channelId)
      )
        throw new EntityChannelSnapshotHostError(
          `invalid entity channel read grant: ${grant.grantId}`,
        );
      this.#grants.set(grant.grantId, grant);
    }
  }

  activate(
    ownerInstanceId: string,
    channelId: string,
    entry: EntityChannelSnapshotEntryV13,
  ): void {
    const channel = this.#channels.get(channelId);
    if (channel === undefined || channel.ownerInstanceId !== ownerInstanceId)
      throw new EntityChannelSnapshotHostError(
        `unauthorized entity channel activation: ${channelId}`,
      );
    if (
      !Number.isSafeInteger(entry.generation) ||
      entry.generation < 0 ||
      !Number.isFinite(entry.position.x) ||
      !Number.isFinite(entry.position.y) ||
      !Number.isFinite(entry.collisionRadius) ||
      entry.collisionRadius < 0
    )
      throw new EntityChannelSnapshotHostError(
        "invalid channel snapshot entry",
      );
    const previous = channel.entries.get(entry.entityId);
    if (
      entry.active !== true ||
      previous?.active ||
      entry.generation <= (previous?.generation ?? -1)
    )
      throw new EntityChannelSnapshotHostError(
        "entity generation must be active and strictly increasing",
      );
    const activeCount = [...channel.entries.values()].filter(
      (candidate) => candidate.active,
    ).length;
    if (activeCount >= channel.capacity)
      throw new EntityChannelSnapshotHostError(
        `entity channel capacity exceeded: ${channelId}`,
      );
    channel.entries.set(
      entry.entityId,
      Object.freeze({
        ...entry,
        position: Object.freeze({ ...entry.position }),
      }),
    );
  }

  update(
    ownerInstanceId: string,
    channelId: string,
    entityId: string,
    generation: number,
    update: Readonly<{
      position?: Readonly<{ x: number; y: number }>;
      collisionRadius?: number;
    }>,
  ): void {
    const channel = this.#channels.get(channelId);
    const current = channel?.entries.get(entityId);
    if (
      channel === undefined ||
      channel.ownerInstanceId !== ownerInstanceId ||
      current === undefined ||
      !current.active ||
      current.generation !== generation
    )
      throw new EntityChannelSnapshotHostError("stale channel snapshot update");
    const position = update.position ?? current.position;
    const collisionRadius = update.collisionRadius ?? current.collisionRadius;
    if (
      !Number.isFinite(position.x) ||
      !Number.isFinite(position.y) ||
      !Number.isFinite(collisionRadius) ||
      collisionRadius < 0
    )
      throw new EntityChannelSnapshotHostError(
        "invalid channel snapshot update",
      );
    channel.entries.set(
      entityId,
      Object.freeze({
        ...current,
        position: Object.freeze({ ...position }),
        collisionRadius,
      }),
    );
  }

  deactivate(
    ownerInstanceId: string,
    channelId: string,
    entityId: string,
    generation: number,
  ): void {
    const channel = this.#channels.get(channelId);
    const current = channel?.entries.get(entityId);
    if (
      channel === undefined ||
      channel.ownerInstanceId !== ownerInstanceId ||
      current === undefined ||
      !current.active ||
      current.generation !== generation
    )
      throw new EntityChannelSnapshotHostError(
        "stale channel snapshot deactivation",
      );
    channel.entries.set(entityId, Object.freeze({ ...current, active: false }));
  }

  snapshot(
    instanceId: string,
    grantId: string,
  ): readonly Readonly<Record<string, unknown>>[] {
    const grant = this.#grants.get(grantId);
    if (grant === undefined || grant.instanceId !== instanceId)
      throw new EntityChannelSnapshotHostError(
        `unauthorized entity channel snapshot: ${grantId}`,
      );
    const channel = this.#channels.get(grant.channelId)!;
    const entries = [...channel.entries.values()]
      .filter((entry) => entry.active)
      .sort(
        (left, right) =>
          left.entityId.localeCompare(right.entityId) ||
          left.generation - right.generation,
      )
      .slice(0, grant.maximumEntries)
      .map((entry) => {
        const source: Record<string, unknown> = {
          entityId: entry.entityId,
          generation: entry.generation,
          position: Object.freeze({ ...entry.position }),
          collisionRadius: entry.collisionRadius,
          active: entry.active,
        };
        return Object.freeze(
          Object.fromEntries(
            grant.descriptor.entryFields.map((field) => [field, source[field]]),
          ),
        );
      });
    return Object.freeze(entries);
  }
}
