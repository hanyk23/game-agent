import type { ModuleResourceBudget } from "./game-module-contract.js";
import type { LogicalEntityReference } from "./game-module-entity-directory.js";
import type {
  GameModuleLease,
  GameModuleLeaseScope,
} from "./game-module-lease-ledger.js";

export type GameModuleRuntimeVector = Readonly<{ x: number; y: number }>;
export type GameModuleRuntimePointer = Readonly<{
  id: number;
  isDown: boolean;
  worldX: number;
  worldY: number;
}>;
export type GameModuleActorSnapshot = Readonly<{
  actorId: string;
  active: boolean;
  position: GameModuleRuntimeVector;
  velocity: GameModuleRuntimeVector;
}>;

export type GameModuleScopedRuntimeServices = Readonly<{
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
      listener: (pointer: GameModuleRuntimePointer) => void,
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
  assets: Readonly<{
    resolveRole(roleId: string): string;
  }>;
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

/** Manifest 1.2 service surface: semantic IDs only, never lease keys/slots. */
export type GameModuleScopedRuntimeServicesV12 = Readonly<{
  viewport: Readonly<{ read(): Readonly<{ width: number; height: number }> }>;
  actors: Readonly<{
    readOwner(): unknown;
    writeOwnerMotion(motion: Readonly<{ x: number; y: number }>): void;
    writeOwnerPosition(position: Readonly<{ x: number; y: number }>): void;
  }>;
  input: Readonly<{
    register(
      registrationId: string,
      handler: (input: unknown) => unknown,
    ): () => void;
  }>;
  overlaps: Readonly<{
    register(
      ruleId: string,
      handler: (candidate: unknown) => unknown,
    ): () => void;
  }>;
  channels: Readonly<{
    activate(channelId: string, entity: unknown): unknown;
    recycle(channelId: string, entity: unknown): void;
    read(grantId: string): unknown;
  }>;
  observation: Readonly<{
    register(readerId: string, reader: () => unknown): () => void;
  }>;
  contact: Readonly<{
    executePolicy(candidate: unknown): unknown;
    prepareCommit(
      candidate: unknown,
      decision: unknown,
      deliveries: Readonly<{
        hit(evidenceId: number): unknown;
        damage(evidenceId: number): unknown;
      }>,
    ): unknown;
  }>;
}>;

export function createPhaseGuardedRuntimeServicesV12(
  source: GameModuleScopedRuntimeServicesV12,
  authorize: (
    operation:
      | "read"
      | "register-input"
      | "activate-entity"
      | "recycle-entity"
      | "write-actor-motion"
      | "register-observation"
      | "contact-policy"
      | "contact-commit",
  ) => void,
): GameModuleScopedRuntimeServicesV12 {
  const registration = (
    operation: "register-input" | "register-observation",
    call: () => () => void,
  ): (() => void) => {
    authorize(operation);
    const dispose = call();
    if (typeof dispose !== "function")
      throw new Error(`${operation} adapter returned an invalid disposer`);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      dispose();
    };
  };
  return Object.freeze({
    viewport: Object.freeze({
      read: () => {
        authorize("read");
        return source.viewport.read();
      },
    }),
    actors: Object.freeze({
      readOwner: () => {
        authorize("read");
        return source.actors.readOwner();
      },
      writeOwnerMotion: (motion: Readonly<{ x: number; y: number }>) => {
        authorize("write-actor-motion");
        source.actors.writeOwnerMotion(motion);
      },
      writeOwnerPosition: (position: Readonly<{ x: number; y: number }>) => {
        authorize("write-actor-motion");
        source.actors.writeOwnerPosition(position);
      },
    }),
    input: Object.freeze({
      register: (id: string, handler: (input: unknown) => unknown) =>
        registration("register-input", () =>
          source.input.register(id, handler),
        ),
    }),
    overlaps: Object.freeze({
      register: (id: string, handler: (candidate: unknown) => unknown) =>
        registration("register-input", () =>
          source.overlaps.register(id, handler),
        ),
    }),
    channels: Object.freeze({
      activate: (id: string, entity: unknown) => {
        authorize("activate-entity");
        return source.channels.activate(id, entity);
      },
      recycle: (id: string, entity: unknown) => {
        authorize("recycle-entity");
        source.channels.recycle(id, entity);
      },
      read: (id: string) => {
        authorize("read");
        return source.channels.read(id);
      },
    }),
    observation: Object.freeze({
      register: (id: string, reader: () => unknown) =>
        registration("register-observation", () =>
          source.observation.register(id, reader),
        ),
    }),
    contact: Object.freeze({
      executePolicy: (candidate: unknown) => {
        authorize("contact-policy");
        return source.contact.executePolicy(candidate);
      },
      prepareCommit: (
        candidate: unknown,
        decision: unknown,
        deliveries: Readonly<{
          hit(evidenceId: number): unknown;
          damage(evidenceId: number): unknown;
        }>,
      ) => {
        authorize("contact-commit");
        return source.contact.prepareCommit(candidate, decision, deliveries);
      },
    }),
  });
}

export type GameModuleRuntimeServiceScopeEvidence = Readonly<{
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
  runtimeLeaseKeys: Readonly<Record<GameModuleLeaseScope, readonly string[]>>;
}>;

export type GameModuleRuntimeServiceScopeAuthority = Readonly<{
  acquireLease(scope: GameModuleLeaseScope, key: string): GameModuleLease;
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

export type GameModuleRuntimeServiceHost = Readonly<{
  createScope(
    evidence: GameModuleRuntimeServiceScopeEvidence,
    authority?: GameModuleRuntimeServiceScopeAuthority,
  ): GameModuleScopedRuntimeServices;
  revoke(instanceId: string, scope: "start" | "instance"): unknown;
  destroy(): unknown;
}>;

function unavailable(name: string): never {
  throw new Error(
    `runtime service is unavailable in the pure harness: ${name}`,
  );
}

const unavailableServices: GameModuleScopedRuntimeServices = Object.freeze({
  clock: Object.freeze({
    nowMs: () => 0,
    schedule: () => unavailable("clock.schedule"),
  }),
  input: Object.freeze({
    readDirection: () => Object.freeze({ x: 0, y: 0 }),
    onPointer: () => unavailable("input.onPointer"),
  }),
  actors: Object.freeze({
    read: () => unavailable("actors.read"),
    setVelocity: () => unavailable("actors.setVelocity"),
    setPosition: () => unavailable("actors.setPosition"),
  }),
  pools: Object.freeze({
    create: () => unavailable("pools.create"),
    activate: () => unavailable("pools.activate"),
    recycle: () => unavailable("pools.recycle"),
    countActive: () => unavailable("pools.countActive"),
  }),
  collisions: Object.freeze({
    watchOverlap: () => unavailable("collisions.watchOverlap"),
  }),
  assets: Object.freeze({
    resolveRole: () => unavailable("assets.resolveRole"),
  }),
  viewport: Object.freeze({
    width: 0,
    height: 0,
    clampX: (x: number) => x,
    clampY: (y: number) => y,
  }),
  budgets: Object.freeze({
    limitFor: () => 0,
    observe: () => unavailable("budgets.observe"),
  }),
  observation: Object.freeze({
    register: () => unavailable("observation.register"),
  }),
});

export function createUnavailableRuntimeServiceHost(): GameModuleRuntimeServiceHost {
  return Object.freeze({
    createScope: () => unavailableServices,
    revoke: () => undefined,
    destroy: () => undefined,
  });
}
