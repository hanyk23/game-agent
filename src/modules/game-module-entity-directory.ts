export const LogicalEntityDirectoryErrorCode = {
  invalidDeclaration: "invalid-declaration",
  unknownChannel: "unknown-channel",
  unauthorized: "unauthorized",
  invalidGeneration: "invalid-generation",
  capacityExceeded: "capacity-exceeded",
  inactiveEntity: "inactive-entity",
  unknownGrant: "unknown-grant",
  operationForbidden: "operation-forbidden",
  invalidMutation: "invalid-mutation",
  activeEntityLeak: "active-entity-leak",
  destroyed: "destroyed",
} as const;

export type LogicalEntityDirectoryErrorCode =
  (typeof LogicalEntityDirectoryErrorCode)[keyof typeof LogicalEntityDirectoryErrorCode];

export class LogicalEntityDirectoryError extends Error {
  constructor(
    readonly code: LogicalEntityDirectoryErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "LogicalEntityDirectoryError";
  }
}

export type LogicalEntityChannelDeclaration = Readonly<{
  channelId: string;
  ownerInstanceId: string;
  ownerActorId: string;
  entityRole: string;
  capacity: number;
  readerInstanceIds: readonly string[];
}>;

export type LogicalEntityMutationGrant = Readonly<{
  grantId: string;
  granteeInstanceId: string;
  channelId: string;
  operations: readonly ("consume" | "transfer")[];
  transferTargetActorIds: readonly string[];
}>;

export type LogicalEntityReference = Readonly<{
  channelId: string;
  entityId: string;
  generation: number;
  ownerActorId: string;
  entityRole: string;
}>;

export type LogicalEntityMutationEvidence = Readonly<{
  grantId: string;
  granteeInstanceId: string;
  operation: "consume" | "transfer";
  before: LogicalEntityReference;
  after?: LogicalEntityReference;
}>;

type EntityRecord = {
  entityId: string;
  generation: number;
  ownerActorId: string;
  active: boolean;
};

type ChannelRecord = Readonly<{
  declaration: LogicalEntityChannelDeclaration;
  readers: ReadonlySet<string>;
  entities: Map<string, EntityRecord>;
}>;

function fail(code: LogicalEntityDirectoryErrorCode, message: string): never {
  throw new LogicalEntityDirectoryError(code, message);
}

function validId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(value)
  );
}

function validInstanceId(value: unknown): value is string {
  return (
    typeof value === "string" && /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(value)
  );
}

function freezeReference(
  channel: LogicalEntityChannelDeclaration,
  entity: EntityRecord,
): LogicalEntityReference {
  return Object.freeze({
    channelId: channel.channelId,
    entityId: entity.entityId,
    generation: entity.generation,
    ownerActorId: entity.ownerActorId,
    entityRole: channel.entityRole,
  });
}

export class DeterministicLogicalEntityDirectory {
  readonly #channels = new Map<string, ChannelRecord>();
  readonly #grants = new Map<string, LogicalEntityMutationGrant>();
  #destroyed = false;

  constructor(
    channelDeclarations: readonly LogicalEntityChannelDeclaration[],
    mutationGrants: readonly LogicalEntityMutationGrant[],
  ) {
    for (const declaration of channelDeclarations) {
      if (
        !validId(declaration.channelId) ||
        !validInstanceId(declaration.ownerInstanceId) ||
        !validInstanceId(declaration.ownerActorId) ||
        !validId(declaration.entityRole) ||
        !Number.isSafeInteger(declaration.capacity) ||
        declaration.capacity < 0 ||
        declaration.capacity > 100_000 ||
        new Set(declaration.readerInstanceIds).size !==
          declaration.readerInstanceIds.length ||
        declaration.readerInstanceIds.some((id) => !validInstanceId(id)) ||
        this.#channels.has(declaration.channelId)
      ) {
        fail(
          LogicalEntityDirectoryErrorCode.invalidDeclaration,
          `invalid logical entity channel: ${declaration.channelId}`,
        );
      }
      const frozen = Object.freeze({
        ...declaration,
        readerInstanceIds: Object.freeze([...declaration.readerInstanceIds]),
      });
      this.#channels.set(
        declaration.channelId,
        Object.freeze({
          declaration: frozen,
          readers: new Set(frozen.readerInstanceIds),
          entities: new Map(),
        }),
      );
    }
    for (const grant of mutationGrants) {
      const channel = this.#channels.get(grant.channelId);
      if (
        !validId(grant.grantId) ||
        !validInstanceId(grant.granteeInstanceId) ||
        channel === undefined ||
        grant.operations.length === 0 ||
        new Set(grant.operations).size !== grant.operations.length ||
        grant.operations.some(
          (operation) => operation !== "consume" && operation !== "transfer",
        ) ||
        new Set(grant.transferTargetActorIds).size !==
          grant.transferTargetActorIds.length ||
        grant.transferTargetActorIds.some((id) => !validInstanceId(id)) ||
        (grant.operations.includes("transfer") &&
          grant.transferTargetActorIds.length === 0) ||
        (!grant.operations.includes("transfer") &&
          grant.transferTargetActorIds.length > 0) ||
        this.#grants.has(grant.grantId)
      ) {
        fail(
          LogicalEntityDirectoryErrorCode.invalidDeclaration,
          `invalid logical entity mutation grant: ${grant.grantId}`,
        );
      }
      this.#grants.set(
        grant.grantId,
        Object.freeze({
          ...grant,
          operations: Object.freeze([...grant.operations]),
          transferTargetActorIds: Object.freeze([
            ...grant.transferTargetActorIds,
          ]),
        }),
      );
    }
  }

  activate(
    ownerInstanceId: string,
    channelId: string,
    entityId: string,
    generation: number,
  ): LogicalEntityReference {
    this.#requireAlive();
    const channel = this.#requireChannel(channelId);
    if (channel.declaration.ownerInstanceId !== ownerInstanceId) {
      fail(
        LogicalEntityDirectoryErrorCode.unauthorized,
        `${ownerInstanceId} does not own channel ${channelId}`,
      );
    }
    if (!validInstanceId(entityId) || !Number.isSafeInteger(generation)) {
      fail(
        LogicalEntityDirectoryErrorCode.invalidGeneration,
        "entityId and generation must be valid logical values",
      );
    }
    const previous = channel.entities.get(entityId);
    if (
      generation < 0 ||
      previous?.active ||
      generation <= (previous?.generation ?? -1)
    ) {
      fail(
        LogicalEntityDirectoryErrorCode.invalidGeneration,
        `${channelId}.${entityId} generation is not strictly increasing`,
      );
    }
    const activeCount = [...channel.entities.values()].filter(
      (entity) => entity.active,
    ).length;
    if (activeCount >= channel.declaration.capacity) {
      fail(
        LogicalEntityDirectoryErrorCode.capacityExceeded,
        `${channelId} active entity capacity exceeded`,
      );
    }
    const entity = {
      entityId,
      generation,
      ownerActorId: channel.declaration.ownerActorId,
      active: true,
    };
    channel.entities.set(entityId, entity);
    return freezeReference(channel.declaration, entity);
  }

  read(
    readerInstanceId: string,
    reference: LogicalEntityReference,
  ): LogicalEntityReference {
    this.#requireAlive();
    const channel = this.#requireChannel(reference.channelId);
    if (
      readerInstanceId !== channel.declaration.ownerInstanceId &&
      !channel.readers.has(readerInstanceId)
    ) {
      fail(
        LogicalEntityDirectoryErrorCode.unauthorized,
        `${readerInstanceId} cannot read channel ${reference.channelId}`,
      );
    }
    return freezeReference(
      channel.declaration,
      this.#requireActive(channel, reference),
    );
  }

  recycle(
    ownerInstanceId: string,
    reference: LogicalEntityReference,
  ): LogicalEntityReference {
    this.#requireAlive();
    const channel = this.#requireChannel(reference.channelId);
    if (channel.declaration.ownerInstanceId !== ownerInstanceId) {
      fail(
        LogicalEntityDirectoryErrorCode.unauthorized,
        `${ownerInstanceId} does not own channel ${reference.channelId}`,
      );
    }
    const entity = this.#requireActive(channel, reference);
    const recycled = freezeReference(channel.declaration, entity);
    entity.active = false;
    return recycled;
  }

  mutate(
    granteeInstanceId: string,
    grantId: string,
    reference: LogicalEntityReference,
    operation: "consume" | "transfer",
    transferTargetActorId?: string,
  ): LogicalEntityMutationEvidence {
    this.#requireAlive();
    const grant = this.#grants.get(grantId);
    if (grant === undefined || grant.channelId !== reference.channelId) {
      fail(
        LogicalEntityDirectoryErrorCode.unknownGrant,
        `unknown mutation grant: ${grantId}`,
      );
    }
    if (grant.granteeInstanceId !== granteeInstanceId) {
      fail(
        LogicalEntityDirectoryErrorCode.unauthorized,
        `${granteeInstanceId} cannot use grant ${grantId}`,
      );
    }
    if (!grant.operations.includes(operation)) {
      fail(
        LogicalEntityDirectoryErrorCode.operationForbidden,
        `${grantId} does not permit ${operation}`,
      );
    }
    if (
      (operation === "consume" && transferTargetActorId !== undefined) ||
      (operation === "transfer" &&
        (transferTargetActorId === undefined ||
          !grant.transferTargetActorIds.includes(transferTargetActorId)))
    ) {
      fail(
        LogicalEntityDirectoryErrorCode.invalidMutation,
        `invalid ${operation} mutation for ${grantId}`,
      );
    }
    const channel = this.#requireChannel(reference.channelId);
    const entity = this.#requireActive(channel, reference);
    const before = freezeReference(channel.declaration, entity);
    if (operation === "consume") entity.active = false;
    else entity.ownerActorId = transferTargetActorId!;
    const after =
      operation === "transfer"
        ? freezeReference(channel.declaration, entity)
        : undefined;
    return Object.freeze({
      grantId,
      granteeInstanceId,
      operation,
      before,
      ...(after === undefined ? {} : { after }),
    });
  }

  isGenerationActive(
    channelId: string,
    entityId: string,
    generation: number,
  ): boolean {
    this.#requireAlive();
    const entity = this.#requireChannel(channelId).entities.get(entityId);
    return entity?.active === true && entity.generation === generation;
  }

  releaseOwnedChannels(
    ownerInstanceId: string,
  ): readonly LogicalEntityReference[] {
    this.#requireAlive();
    const released: LogicalEntityReference[] = [];
    for (const channel of this.#channels.values()) {
      if (channel.declaration.ownerInstanceId !== ownerInstanceId) continue;
      for (const entity of channel.entities.values()) {
        if (!entity.active) continue;
        released.push(freezeReference(channel.declaration, entity));
        entity.active = false;
      }
    }
    return Object.freeze(released.reverse());
  }

  snapshot(): Readonly<{
    activeEntities: readonly LogicalEntityReference[];
  }> {
    this.#requireAlive();
    return Object.freeze({
      activeEntities: Object.freeze(
        [...this.#channels.values()].flatMap((channel) =>
          [...channel.entities.values()]
            .filter((entity) => entity.active)
            .map((entity) => freezeReference(channel.declaration, entity)),
        ),
      ),
    });
  }

  destroy(): void {
    this.#requireAlive();
    const active = this.snapshot().activeEntities.length;
    if (active > 0) {
      fail(
        LogicalEntityDirectoryErrorCode.activeEntityLeak,
        `logical entity directory retains ${active} active entities`,
      );
    }
    this.#destroyed = true;
  }

  #requireChannel(channelId: string): ChannelRecord {
    const channel = this.#channels.get(channelId);
    if (channel === undefined) {
      fail(
        LogicalEntityDirectoryErrorCode.unknownChannel,
        `unknown logical entity channel: ${channelId}`,
      );
    }
    return channel;
  }

  #requireActive(
    channel: ChannelRecord,
    reference: LogicalEntityReference,
  ): EntityRecord {
    const entity = channel.entities.get(reference.entityId);
    if (
      entity?.active !== true ||
      entity.generation !== reference.generation ||
      reference.entityRole !== channel.declaration.entityRole ||
      reference.ownerActorId !== entity.ownerActorId
    ) {
      fail(
        LogicalEntityDirectoryErrorCode.inactiveEntity,
        `inactive or stale logical entity: ${reference.channelId}.${reference.entityId}@${reference.generation}`,
      );
    }
    return entity;
  }

  #requireAlive(): void {
    if (this.#destroyed) {
      fail(
        LogicalEntityDirectoryErrorCode.destroyed,
        "logical entity directory has been destroyed",
      );
    }
  }
}
