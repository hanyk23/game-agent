import type {
  RuntimeDisposer,
  RuntimeEntityPool,
  RuntimeKernel,
} from "./contracts.js";

type ModuleResourceBudget = Readonly<{
  activeEntities: number;
  activeProjectiles: number;
  spawnsPerSecond: number;
  timers: number;
}>;

type GameModuleRuntimeVector = Readonly<{ x: number; y: number }>;
type GameModuleActorSnapshot = Readonly<{
  actorId: string;
  active: boolean;
  position: GameModuleRuntimeVector;
  velocity: GameModuleRuntimeVector;
}>;
type LogicalEntityReference = Readonly<{
  channelId: string;
  entityId: string;
  generation: number;
  ownerActorId: string;
  entityRole: string;
}>;
type GameModuleLease = Readonly<{
  leaseId: string;
  ownerId: string;
  scope: "start" | "instance" | "graph";
  key: string;
}>;
type GameModuleRuntimeServiceScopeEvidence = Readonly<{
  instanceId: string;
  ownerId: string;
  moduleId: string;
  version: string;
  artifactEnvelopeSha256: string;
  resourceGrant: ModuleResourceBudget;
  assetRoleIds: readonly string[];
  ownedChannelIds: readonly string[];
  readableChannelIds: readonly string[];
  mutationGrantIds: readonly string[];
  runtimeLeaseKeys: Readonly<
    Record<"start" | "instance" | "graph", readonly string[]>
  >;
}>;
type GameModuleRuntimeServiceScopeAuthority = Readonly<{
  acquireLease(
    scope: "start" | "instance" | "graph",
    key: string,
  ): GameModuleLease;
  releaseLease(lease: GameModuleLease): void;
  activateEntity(
    channelId: string,
    entityId: string,
    generation: number,
  ): LogicalEntityReference;
  readEntity(reference: LogicalEntityReference): LogicalEntityReference;
  recycleEntity(reference: LogicalEntityReference): LogicalEntityReference;
  isGenerationActive(
    channelId: string,
    entityId: string,
    generation: number,
  ): boolean;
}>;
type GameModuleScopedRuntimeServices = Readonly<{
  clock: Readonly<{
    nowMs(): number;
    schedule(
      startLeaseKey: string,
      schedule: Readonly<{
        delayMs: number;
        repeat?: number;
        loop?: boolean;
        callback: () => void;
      }>,
    ): void;
  }>;
  input: Readonly<{
    readDirection(): GameModuleRuntimeVector;
    onPointer(
      startLeaseKey: string,
      phase: "down" | "move" | "up",
      listener: (
        pointer: Readonly<{
          id: number;
          isDown: boolean;
          worldX: number;
          worldY: number;
        }>,
      ) => void,
    ): void;
  }>;
  actors: Readonly<{
    read(actorId: string): GameModuleActorSnapshot;
    setVelocity(actorId: string, velocity: GameModuleRuntimeVector): void;
    setPosition(actorId: string, position: GameModuleRuntimeVector): void;
  }>;
  pools: Readonly<{
    create(
      instanceLeaseKey: string,
      channelId: string,
      budgetKey: string,
    ): void;
    activate(
      channelId: string,
      entityId: string,
      generation: number,
      position: GameModuleRuntimeVector,
      velocity: GameModuleRuntimeVector,
      assetRoleId: string,
    ): LogicalEntityReference;
    recycle(reference: LogicalEntityReference): void;
    countActive(channelId: string): number;
  }>;
  collisions: Readonly<{
    watchOverlap(
      startLeaseKey: string,
      sourceChannelId: string,
      targetActorId: string,
      listener: (source: LogicalEntityReference, targetActorId: string) => void,
    ): void;
  }>;
  assets: Readonly<{ resolveRole(roleId: string): string }>;
  viewport: Readonly<{
    width: number;
    height: number;
    clampX(x: number): number;
    clampY(y: number): number;
  }>;
  budgets: Readonly<{
    limitFor(resource: keyof ModuleResourceBudget): number;
    observe(resource: keyof ModuleResourceBudget, current: number): void;
  }>;
  observation: Readonly<{
    register(instanceLeaseKey: string, reader: () => unknown): void;
  }>;
}>;
export type KernelGameModuleRuntimeServiceHost = Readonly<{
  createScope(
    evidence: GameModuleRuntimeServiceScopeEvidence,
    authority?: GameModuleRuntimeServiceScopeAuthority,
  ): GameModuleScopedRuntimeServices;
  revoke(instanceId: string, scope: "start" | "instance"): unknown;
  destroy(): unknown;
}>;

export const GameModuleRuntimeServiceHostErrorCode = {
  invalidOptions: "invalid-options",
  invalidEvidence: "invalid-evidence",
  destroyed: "destroyed",
  duplicateScope: "duplicate-scope",
  unknownInstance: "unknown-instance",
  unknownLeaseKey: "unknown-lease-key",
  duplicateRegistration: "duplicate-registration",
  unknownActor: "unknown-actor",
  unauthorizedActor: "unauthorized-actor",
  unknownChannel: "unknown-channel",
  unauthorizedChannel: "unauthorized-channel",
  unknownAssetRole: "unknown-asset-role",
  unauthorizedAssetRole: "unauthorized-asset-role",
  resourceExceeded: "resource-exceeded",
  spawnRateExceeded: "spawn-rate-exceeded",
  adapterFailure: "adapter-failure",
  cleanupFailed: "cleanup-failed",
} as const;

export type GameModuleRuntimeServiceHostErrorCode =
  (typeof GameModuleRuntimeServiceHostErrorCode)[keyof typeof GameModuleRuntimeServiceHostErrorCode];

export class GameModuleRuntimeServiceHostError extends Error {
  constructor(
    readonly code: GameModuleRuntimeServiceHostErrorCode,
    message: string,
    readonly failures: readonly unknown[] = [],
  ) {
    super(message);
    this.name = "GameModuleRuntimeServiceHostError";
  }
}

export type GameModuleRuntimeActorBinding<TEntity> = Readonly<{
  actorId: string;
  collisionTarget: TEntity;
  read(): GameModuleActorSnapshot;
  setVelocity(velocity: GameModuleRuntimeVector): void;
  setPosition(position: GameModuleRuntimeVector): void;
}>;

export type GameModuleRuntimeChannelBinding = Readonly<{
  channelId: string;
  ownerInstanceId: string;
  entityRole: string;
  budgetKey: string;
  capacity: number;
  countsAsProjectile: boolean;
}>;

export type GameModuleRuntimeAssetRoleBinding = Readonly<{
  roleId: string;
  textureKey: string;
}>;

export type GameModuleRuntimeEntityAdapter<TEntity> = Readonly<{
  setVelocity(entity: TEntity, velocity: GameModuleRuntimeVector): void;
  recycle(entity: TEntity): void;
}>;

export type GameModuleRuntimeServiceHostOptions<TEntity> = Readonly<{
  actors: readonly GameModuleRuntimeActorBinding<TEntity>[];
  channels: readonly GameModuleRuntimeChannelBinding[];
  assetRoles: readonly GameModuleRuntimeAssetRoleBinding[];
  entities: GameModuleRuntimeEntityAdapter<TEntity>;
}>;

type StartRegistration = {
  key: string;
  lease: GameModuleLease;
  dispose: RuntimeDisposer;
};

type ActiveEntity<TEntity> = {
  reference: LogicalEntityReference;
  entity: TEntity;
};

type PoolRecord<TEntity> = {
  key: string;
  lease: GameModuleLease;
  channel: GameModuleRuntimeChannelBinding;
  pool: RuntimeEntityPool<TEntity>;
  active: Map<string, ActiveEntity<TEntity>>;
};

type ObservationRecord = {
  key: string;
  lease: GameModuleLease;
  dispose: RuntimeDisposer;
};

type ScopeRecord<TEntity> = {
  evidence: GameModuleRuntimeServiceScopeEvidence;
  authority: GameModuleRuntimeServiceScopeAuthority;
  start: StartRegistration[];
  pools: Map<string, PoolRecord<TEntity>>;
  observations: ObservationRecord[];
  spawnTimes: number[];
};

const resources = [
  "activeEntities",
  "activeProjectiles",
  "spawnsPerSecond",
  "timers",
] as const satisfies readonly (keyof ModuleResourceBudget)[];

function fail(
  code: GameModuleRuntimeServiceHostErrorCode,
  message: string,
): never {
  throw new GameModuleRuntimeServiceHostError(code, message);
}

function validId(value: string): boolean {
  return /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(value);
}

function activeKey(reference: LogicalEntityReference): string {
  return `${reference.channelId.length}:${reference.channelId}${reference.entityId.length}:${reference.entityId}:${reference.generation}`;
}

function isThenable(value: unknown): boolean {
  return (
    value !== null &&
    (typeof value === "object" || typeof value === "function") &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

export function createGameModuleRuntimeServiceHost<TEntity, TSnapshot>(
  kernel: RuntimeKernel<TEntity, TSnapshot>,
  options: GameModuleRuntimeServiceHostOptions<TEntity>,
): KernelGameModuleRuntimeServiceHost {
  const actors = new Map<string, GameModuleRuntimeActorBinding<TEntity>>();
  const channels = new Map<string, GameModuleRuntimeChannelBinding>();
  const assetRoles = new Map<string, string>();
  const scopes = new Map<string, ScopeRecord<TEntity>>();
  const poolsByChannel = new Map<string, PoolRecord<TEntity>>();
  const scopeOrder: string[] = [];
  let destroyed = false;

  for (const actor of options.actors) {
    if (!validId(actor.actorId) || actors.has(actor.actorId)) {
      fail(
        GameModuleRuntimeServiceHostErrorCode.invalidOptions,
        `invalid or duplicate actor binding: ${actor.actorId}`,
      );
    }
    actors.set(actor.actorId, actor);
  }
  for (const channel of options.channels) {
    if (
      !validId(channel.channelId) ||
      !validId(channel.ownerInstanceId) ||
      !validId(channel.entityRole) ||
      !validId(channel.budgetKey) ||
      !Number.isInteger(channel.capacity) ||
      channel.capacity < 0 ||
      channels.has(channel.channelId)
    ) {
      fail(
        GameModuleRuntimeServiceHostErrorCode.invalidOptions,
        `invalid or duplicate channel binding: ${channel.channelId}`,
      );
    }
    let kernelLimit: number;
    try {
      kernelLimit = kernel.budgets.limitFor(channel.budgetKey);
    } catch (error) {
      throw new GameModuleRuntimeServiceHostError(
        GameModuleRuntimeServiceHostErrorCode.invalidOptions,
        `unknown channel budget: ${channel.budgetKey}`,
        Object.freeze([error]),
      );
    }
    if (channel.capacity > kernelLimit) {
      fail(
        GameModuleRuntimeServiceHostErrorCode.invalidOptions,
        `${channel.channelId} capacity exceeds kernel budget`,
      );
    }
    channels.set(channel.channelId, Object.freeze({ ...channel }));
  }
  for (const asset of options.assetRoles) {
    if (
      !validId(asset.roleId) ||
      asset.textureKey.length === 0 ||
      assetRoles.has(asset.roleId)
    ) {
      fail(
        GameModuleRuntimeServiceHostErrorCode.invalidOptions,
        `invalid or duplicate asset role: ${asset.roleId}`,
      );
    }
    assetRoles.set(asset.roleId, asset.textureKey);
  }

  const requireAlive = (): void => {
    if (destroyed) {
      fail(
        GameModuleRuntimeServiceHostErrorCode.destroyed,
        "runtime service host is destroyed",
      );
    }
  };

  const requireScope = (instanceId: string): ScopeRecord<TEntity> => {
    requireAlive();
    const scope = scopes.get(instanceId);
    if (scope === undefined) {
      fail(
        GameModuleRuntimeServiceHostErrorCode.unknownInstance,
        `unknown runtime service scope: ${instanceId}`,
      );
    }
    return scope;
  };

  const requireLeaseKey = (
    scope: ScopeRecord<TEntity>,
    leaseScope: "start" | "instance",
    key: string,
  ): void => {
    if (!scope.evidence.runtimeLeaseKeys[leaseScope].includes(key)) {
      fail(
        GameModuleRuntimeServiceHostErrorCode.unknownLeaseKey,
        `unknown ${leaseScope} lease key for ${scope.evidence.instanceId}: ${key}`,
      );
    }
  };

  const rollbackLease = (
    authority: GameModuleRuntimeServiceScopeAuthority,
    lease: GameModuleLease,
    primary: unknown,
  ): never => {
    const failures = [primary];
    try {
      authority.releaseLease(lease);
    } catch (error) {
      failures.push(error);
    }
    throw new GameModuleRuntimeServiceHostError(
      GameModuleRuntimeServiceHostErrorCode.adapterFailure,
      "runtime adapter registration failed",
      Object.freeze(failures),
    );
  };

  const registerStart = (
    scope: ScopeRecord<TEntity>,
    key: string,
    register: () => RuntimeDisposer,
  ): void => {
    requireLeaseKey(scope, "start", key);
    if (scope.start.some((entry) => entry.key === key)) {
      fail(
        GameModuleRuntimeServiceHostErrorCode.duplicateRegistration,
        `duplicate active start registration: ${scope.evidence.instanceId}.${key}`,
      );
    }
    const lease = scope.authority.acquireLease("start", key);
    let dispose!: RuntimeDisposer;
    try {
      dispose = register();
      if (typeof dispose !== "function") {
        throw new Error("runtime adapter did not return a disposer");
      }
    } catch (error) {
      rollbackLease(scope.authority, lease, error);
    }
    scope.start.push({ key, lease, dispose });
  };

  const recyclePool = (
    scope: ScopeRecord<TEntity>,
    pool: PoolRecord<TEntity>,
    destroyChildren: boolean,
    failures: unknown[],
  ): void => {
    const entries = [...pool.active.values()].reverse();
    for (const active of entries) {
      try {
        if (
          scope.authority.isGenerationActive(
            active.reference.channelId,
            active.reference.entityId,
            active.reference.generation,
          )
        ) {
          scope.authority.recycleEntity(active.reference);
        }
      } catch (error) {
        failures.push(error);
      }
    }
    pool.active.clear();
    try {
      pool.pool.clear(destroyChildren);
    } catch (error) {
      failures.push(error);
    }
    try {
      kernel.budgets.observe("activeEntities", totalActive(scope));
      kernel.budgets.observe("activeProjectiles", totalActive(scope, true));
    } catch (error) {
      failures.push(error);
    }
  };

  const totalActive = (
    scope: ScopeRecord<TEntity>,
    projectileOnly = false,
  ): number =>
    [...scope.pools.values()].reduce(
      (total, pool) =>
        total +
        (projectileOnly && !pool.channel.countsAsProjectile
          ? 0
          : pool.active.size),
      0,
    );

  const revokeStart = (scope: ScopeRecord<TEntity>): unknown[] => {
    const failures: unknown[] = [];
    const registrations = scope.start.splice(0).reverse();
    for (const registration of registrations) {
      try {
        registration.dispose();
      } catch (error) {
        failures.push(error);
      }
      try {
        scope.authority.releaseLease(registration.lease);
      } catch (error) {
        failures.push(error);
      }
    }
    for (const pool of [...scope.pools.values()].reverse()) {
      recyclePool(scope, pool, false, failures);
    }
    scope.spawnTimes.length = 0;
    return failures;
  };

  const revokeInstance = (scope: ScopeRecord<TEntity>): unknown[] => {
    const failures = revokeStart(scope);
    for (const observation of scope.observations.splice(0).reverse()) {
      try {
        observation.dispose();
      } catch (error) {
        failures.push(error);
      }
      try {
        scope.authority.releaseLease(observation.lease);
      } catch (error) {
        failures.push(error);
      }
    }
    for (const pool of [...scope.pools.values()].reverse()) {
      recyclePool(scope, pool, true, failures);
      try {
        scope.authority.releaseLease(pool.lease);
      } catch (error) {
        failures.push(error);
      }
      poolsByChannel.delete(pool.channel.channelId);
    }
    scope.pools.clear();
    return failures;
  };

  const throwCleanup = (failures: unknown[]): void => {
    if (failures.length > 0) {
      throw new GameModuleRuntimeServiceHostError(
        GameModuleRuntimeServiceHostErrorCode.cleanupFailed,
        `runtime service cleanup failed with ${failures.length} failure(s)`,
        Object.freeze(failures),
      );
    }
  };

  const createScope = (
    evidence: GameModuleRuntimeServiceScopeEvidence,
    authorityInput?: GameModuleRuntimeServiceScopeAuthority,
  ): GameModuleScopedRuntimeServices => {
    requireAlive();
    if (authorityInput === undefined) {
      fail(
        GameModuleRuntimeServiceHostErrorCode.invalidEvidence,
        `runtime service authority is required: ${evidence.instanceId}`,
      );
    }
    const authority = authorityInput;
    if (scopes.has(evidence.instanceId)) {
      fail(
        GameModuleRuntimeServiceHostErrorCode.duplicateScope,
        `duplicate runtime service scope: ${evidence.instanceId}`,
      );
    }
    if (
      !validId(evidence.instanceId) ||
      !actors.has(evidence.ownerId) ||
      resources.some(
        (resource) =>
          !Number.isInteger(evidence.resourceGrant[resource]) ||
          evidence.resourceGrant[resource] < 0,
      ) ||
      new Set(evidence.assetRoleIds).size !== evidence.assetRoleIds.length ||
      new Set(evidence.ownedChannelIds).size !==
        evidence.ownedChannelIds.length ||
      new Set(evidence.readableChannelIds).size !==
        evidence.readableChannelIds.length
    ) {
      fail(
        GameModuleRuntimeServiceHostErrorCode.invalidEvidence,
        `invalid runtime service evidence: ${evidence.instanceId}`,
      );
    }
    for (const roleId of evidence.assetRoleIds) {
      if (!assetRoles.has(roleId)) {
        fail(
          GameModuleRuntimeServiceHostErrorCode.invalidEvidence,
          `evidence references unknown asset role: ${roleId}`,
        );
      }
    }
    for (const channelId of evidence.ownedChannelIds) {
      const channel = channels.get(channelId);
      if (
        channel === undefined ||
        channel.ownerInstanceId !== evidence.instanceId ||
        channel.capacity > evidence.resourceGrant.activeEntities ||
        (channel.countsAsProjectile &&
          channel.capacity > evidence.resourceGrant.activeProjectiles)
      ) {
        fail(
          GameModuleRuntimeServiceHostErrorCode.invalidEvidence,
          `evidence cannot own channel: ${channelId}`,
        );
      }
    }
    for (const channelId of evidence.readableChannelIds) {
      if (!channels.has(channelId)) {
        fail(
          GameModuleRuntimeServiceHostErrorCode.invalidEvidence,
          `evidence references unknown readable channel: ${channelId}`,
        );
      }
    }
    const scope: ScopeRecord<TEntity> = {
      evidence,
      authority,
      start: [],
      pools: new Map(),
      observations: [],
      spawnTimes: [],
    };
    scopes.set(evidence.instanceId, scope);
    scopeOrder.push(evidence.instanceId);

    const requireActor = (
      actorId: string,
    ): GameModuleRuntimeActorBinding<TEntity> => {
      const actor = actors.get(actorId);
      if (actor === undefined) {
        fail(
          GameModuleRuntimeServiceHostErrorCode.unknownActor,
          `unknown actor: ${actorId}`,
        );
      }
      if (actorId !== evidence.ownerId) {
        fail(
          GameModuleRuntimeServiceHostErrorCode.unauthorizedActor,
          `${evidence.instanceId} cannot access actor ${actorId}`,
        );
      }
      return actor;
    };
    const requireChannel = (
      channelId: string,
      access: "owned" | "readable",
    ): GameModuleRuntimeChannelBinding => {
      const channel = channels.get(channelId);
      if (channel === undefined) {
        fail(
          GameModuleRuntimeServiceHostErrorCode.unknownChannel,
          `unknown channel: ${channelId}`,
        );
      }
      const allowed =
        access === "owned"
          ? evidence.ownedChannelIds.includes(channelId)
          : evidence.readableChannelIds.includes(channelId) ||
            evidence.ownedChannelIds.includes(channelId);
      if (!allowed) {
        fail(
          GameModuleRuntimeServiceHostErrorCode.unauthorizedChannel,
          `${evidence.instanceId} cannot access channel ${channelId}`,
        );
      }
      return channel;
    };
    const textureFor = (roleId: string): string => {
      const texture = assetRoles.get(roleId);
      if (texture === undefined) {
        fail(
          GameModuleRuntimeServiceHostErrorCode.unknownAssetRole,
          `unknown asset role: ${roleId}`,
        );
      }
      if (!evidence.assetRoleIds.includes(roleId)) {
        fail(
          GameModuleRuntimeServiceHostErrorCode.unauthorizedAssetRole,
          `${evidence.instanceId} cannot use asset role ${roleId}`,
        );
      }
      kernel.assets.markUsed(texture);
      return texture;
    };

    const services: GameModuleScopedRuntimeServices = {
      clock: Object.freeze({
        nowMs: () => kernel.clock.nowMs(),
        schedule: (key, schedule) => {
          if (schedule.delayMs < 0 || !Number.isFinite(schedule.delayMs)) {
            fail(
              GameModuleRuntimeServiceHostErrorCode.invalidEvidence,
              "timer delay must be finite and non-negative",
            );
          }
          registerStart(scope, key, () => {
            const timer = kernel.clock.schedule(schedule);
            return () => timer.cancel();
          });
        },
      }),
      input: Object.freeze({
        readDirection: () => Object.freeze({ ...kernel.input.readDirection() }),
        onPointer: (key, phase, listener) =>
          registerStart(scope, key, () => {
            const wrapped = (pointer: Parameters<typeof listener>[0]) =>
              listener(Object.freeze({ ...pointer }));
            return phase === "down"
              ? kernel.input.onPointerDown(wrapped)
              : phase === "move"
                ? kernel.input.onPointerMove(wrapped)
                : kernel.input.onPointerUp(wrapped);
          }),
      }),
      actors: Object.freeze({
        read: (actorId) => Object.freeze({ ...requireActor(actorId).read() }),
        setVelocity: (actorId, velocity) =>
          requireActor(actorId).setVelocity(Object.freeze({ ...velocity })),
        setPosition: (actorId, position) =>
          requireActor(actorId).setPosition(Object.freeze({ ...position })),
      }),
      pools: Object.freeze({
        create: (key, channelId, budgetKey) => {
          requireLeaseKey(scope, "instance", key);
          const channel = requireChannel(channelId, "owned");
          if (channel.budgetKey !== budgetKey) {
            fail(
              GameModuleRuntimeServiceHostErrorCode.unauthorizedChannel,
              `${channelId} requires budget ${channel.budgetKey}`,
            );
          }
          if (poolsByChannel.has(channelId)) {
            fail(
              GameModuleRuntimeServiceHostErrorCode.duplicateRegistration,
              `pool already exists: ${channelId}`,
            );
          }
          const lease = authority.acquireLease("instance", key);
          let pool!: RuntimeEntityPool<TEntity>;
          try {
            pool = kernel.entities.createPool(budgetKey);
          } catch (error) {
            rollbackLease(authority, lease, error);
          }
          const record = {
            key,
            lease,
            channel,
            pool,
            active: new Map(),
          };
          scope.pools.set(channelId, record);
          poolsByChannel.set(channelId, record);
        },
        activate: (
          channelId,
          entityId,
          generation,
          position,
          velocity,
          assetRoleId,
        ) => {
          const channel = requireChannel(channelId, "owned");
          const pool = poolsByChannel.get(channelId);
          if (pool === undefined) {
            fail(
              GameModuleRuntimeServiceHostErrorCode.unknownChannel,
              `pool is not created: ${channelId}`,
            );
          }
          const texture = textureFor(assetRoleId);
          const provisional: LogicalEntityReference = {
            channelId,
            entityId,
            generation,
            ownerActorId: evidence.ownerId,
            entityRole: channel.entityRole,
          };
          if (
            authority.isGenerationActive(channelId, entityId, generation) ||
            pool.active.has(activeKey(provisional))
          ) {
            fail(
              GameModuleRuntimeServiceHostErrorCode.duplicateRegistration,
              `entity generation is already active: ${channelId}.${entityId}.${generation}`,
            );
          }
          const now = kernel.clock.nowMs();
          const oldestAllowed = now - 1_000;
          const retainedTimes = scope.spawnTimes.filter(
            (timestamp) => timestamp > oldestAllowed,
          );
          if (
            pool.active.size >= channel.capacity ||
            totalActive(scope) >= evidence.resourceGrant.activeEntities ||
            (channel.countsAsProjectile &&
              totalActive(scope, true) >=
                evidence.resourceGrant.activeProjectiles)
          ) {
            fail(
              GameModuleRuntimeServiceHostErrorCode.resourceExceeded,
              `entity activation exceeds exact grant for ${channelId}`,
            );
          }
          if (retainedTimes.length >= evidence.resourceGrant.spawnsPerSecond) {
            fail(
              GameModuleRuntimeServiceHostErrorCode.spawnRateExceeded,
              `spawn rate exceeds exact grant for ${evidence.instanceId}`,
            );
          }
          const entity = pool.pool.acquire(position.x, position.y, texture);
          if (entity === null) {
            fail(
              GameModuleRuntimeServiceHostErrorCode.resourceExceeded,
              `runtime pool exhausted: ${channelId}`,
            );
          }
          let reference: LogicalEntityReference | undefined;
          try {
            options.entities.setVelocity(
              entity,
              Object.freeze({ ...velocity }),
            );
            reference = authority.activateEntity(
              channelId,
              entityId,
              generation,
            );
            kernel.budgets.observe("activeEntities", totalActive(scope) + 1);
            kernel.budgets.observe(
              "activeProjectiles",
              totalActive(scope, true) + (channel.countsAsProjectile ? 1 : 0),
            );
            pool.active.set(activeKey(reference), { reference, entity });
            scope.spawnTimes.splice(
              0,
              scope.spawnTimes.length,
              ...retainedTimes,
              now,
            );
            return reference;
          } catch (error) {
            const failures = [error];
            if (reference !== undefined) {
              try {
                authority.recycleEntity(reference);
              } catch (rollbackError) {
                failures.push(rollbackError);
              }
            }
            try {
              options.entities.recycle(entity);
            } catch (rollbackError) {
              failures.push(rollbackError);
            }
            throw new GameModuleRuntimeServiceHostError(
              GameModuleRuntimeServiceHostErrorCode.adapterFailure,
              "entity activation failed",
              Object.freeze(failures),
            );
          }
        },
        recycle: (reference) => {
          requireChannel(reference.channelId, "owned");
          const pool = scope.pools.get(reference.channelId);
          const active = pool?.active.get(activeKey(reference));
          if (pool === undefined || active === undefined) {
            fail(
              GameModuleRuntimeServiceHostErrorCode.unknownChannel,
              "entity is not active in the scoped pool",
            );
          }
          options.entities.recycle(active.entity);
          if (
            authority.isGenerationActive(
              reference.channelId,
              reference.entityId,
              reference.generation,
            )
          ) {
            authority.recycleEntity(reference);
          }
          pool.active.delete(activeKey(reference));
          kernel.budgets.observe("activeEntities", totalActive(scope));
          kernel.budgets.observe("activeProjectiles", totalActive(scope, true));
        },
        countActive: (channelId) => {
          requireChannel(channelId, "readable");
          const pool = poolsByChannel.get(channelId);
          if (pool === undefined) {
            fail(
              GameModuleRuntimeServiceHostErrorCode.unknownChannel,
              `pool is not created in this scope: ${channelId}`,
            );
          }
          return pool.active.size;
        },
      }),
      collisions: Object.freeze({
        watchOverlap: (key, sourceChannelId, targetActorId, listener) => {
          const channel = requireChannel(sourceChannelId, "readable");
          const pool = poolsByChannel.get(channel.channelId);
          if (pool === undefined) {
            fail(
              GameModuleRuntimeServiceHostErrorCode.unknownChannel,
              `overlap source pool is not created: ${sourceChannelId}`,
            );
          }
          const actor = requireActor(targetActorId);
          registerStart(scope, key, () =>
            kernel.collisions.watchOverlap(
              pool.pool,
              actor.collisionTarget,
              (source) => {
                const active = [...pool.active.values()].find(
                  (entry) => entry.entity === source,
                );
                if (active === undefined) {
                  fail(
                    GameModuleRuntimeServiceHostErrorCode.unknownChannel,
                    "overlap source is not an active logical entity",
                  );
                }
                listener(active.reference, targetActorId);
              },
            ),
          );
        },
      }),
      assets: Object.freeze({ resolveRole: textureFor }),
      viewport: Object.freeze({
        width: kernel.viewport.width,
        height: kernel.viewport.height,
        clampX: (x) => kernel.viewport.clampX(x),
        clampY: (y) => kernel.viewport.clampY(y),
      }),
      budgets: Object.freeze({
        limitFor: (resource) => evidence.resourceGrant[resource],
        observe: (resource, current) => {
          if (
            !Number.isInteger(current) ||
            current < 0 ||
            current > evidence.resourceGrant[resource]
          ) {
            fail(
              GameModuleRuntimeServiceHostErrorCode.resourceExceeded,
              `${resource} observation exceeds exact grant`,
            );
          }
          kernel.budgets.observe(resource, current);
        },
      }),
      observation: Object.freeze({
        register: (key, reader) => {
          requireLeaseKey(scope, "instance", key);
          if (scope.observations.some((entry) => entry.key === key)) {
            fail(
              GameModuleRuntimeServiceHostErrorCode.duplicateRegistration,
              `duplicate observation registration: ${key}`,
            );
          }
          const lease = authority.acquireLease("instance", key);
          let dispose!: RuntimeDisposer;
          try {
            dispose = kernel.observation.registerReader(
              reader as () => TSnapshot,
            );
          } catch (error) {
            rollbackLease(authority, lease, error);
          }
          scope.observations.push({ key, lease, dispose });
        },
      }),
    };
    return Object.freeze(services);
  };

  return Object.freeze({
    createScope,
    revoke: (instanceId, revokeScope) => {
      const scope = requireScope(instanceId);
      const failures =
        revokeScope === "start" ? revokeStart(scope) : revokeInstance(scope);
      if (revokeScope === "instance") scopes.delete(instanceId);
      throwCleanup(failures);
    },
    destroy: () => {
      requireAlive();
      const failures: unknown[] = [];
      for (const instanceId of [...scopeOrder].reverse()) {
        const scope = scopes.get(instanceId);
        if (scope !== undefined) failures.push(...revokeInstance(scope));
      }
      scopes.clear();
      destroyed = true;
      throwCleanup(failures);
    },
  });
}
