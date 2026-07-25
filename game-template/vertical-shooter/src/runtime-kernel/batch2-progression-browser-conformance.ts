import {
  DeterministicGameModuleProductionInstantiatorV13,
  resolvePickupEffectTransformV13,
} from "../../../../src/modules/game-module-production-instantiator.js";
import { PreparedEffectCommitHostV1 } from "../../../../src/modules/game-module-prepared-effect-host.js";
import type { ResolvedModuleGraphV13 } from "../../../../src/modules/game-module-resolver.js";
import type { BrowserGameModuleRuntimeCatalogV13 } from "../../../../src/modules/game-module-runtime-catalog.js";
import type { DeterministicGameModuleRuntimeV12 } from "../../../../src/modules/game-module-runtime-abi-v12.js";

type Actor = {
  actorId: string;
  active: boolean;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
};

type ActiveEntity = Readonly<{
  channelId: string;
  entityId: string;
  generation: number;
  ownerActorId: string;
  entityRole: "projectile" | "pickup";
  effectId?: string;
  value?: number;
  [key: string]: unknown;
}>;

export type Batch2ProgressionBrowserSnapshot = Readonly<{
  phase: string;
  simulationTimeMs: number;
  activePickups: number;
  activeProjectiles: number;
  collectedEvents: number;
  addressedApplications: number;
  deliveryDamageBonus: number;
  inputHandlers: number;
  overlapHandlers: number;
  observationReaders: number;
  preparedRoutes: number;
  preparedSources: number;
  activePreparedEffects: number;
  effectTrace: readonly ("consume" | "collected" | "application")[];
  cleanupResidue: number;
}>;

export type Batch2ProgressionBrowserConformanceRuntime = Readonly<{
  frame(deltaMs: number): void;
  triggerPickupOverlap(entityId?: string): void;
  triggerPointerAttack(worldX: number, worldY: number): void;
  pause(): void;
  resume(): void;
  restart(): void;
  snapshot(): Batch2ProgressionBrowserSnapshot;
  destroy(): void;
}>;

type Session = Readonly<{
  runtime: DeterministicGameModuleRuntimeV12;
  active: Map<string, ActiveEntity>;
  inputHandlers: Map<string, (input: unknown) => unknown>;
  overlapHandlers: Map<string, (input: unknown) => unknown>;
  observations: Map<string, () => unknown>;
  effectHost: PreparedEffectCommitHostV1;
  effectTrace: readonly ("consume" | "collected" | "application")[];
  readCollected(): number;
  readApplications(): number;
  triggerPickupOverlap(entityId?: string): void;
  triggerPointerAttack(worldX: number, worldY: number): void;
  destroy(): void;
}>;

export function createBatch2ProgressionBrowserConformanceRuntime(
  graph: ResolvedModuleGraphV13,
  catalog: BrowserGameModuleRuntimeCatalogV13,
): Batch2ProgressionBrowserConformanceRuntime {
  if (graph.executionReadiness.status !== "ready")
    throw new Error("progression conformance requires a ready Graph 1.3");

  const createSession = (): Session => {
    const actors = new Map<string, Actor>(
      graph.actors.map((actor) => [
        actor.actorId,
        {
          actorId: actor.actorId,
          active: true,
          position: { x: 360, y: actor.role === "world" ? 0 : 600 },
          velocity: { x: 0, y: 0 },
        },
      ]),
    );
    const active = new Map<string, ActiveEntity>();
    const inputHandlers = new Map<string, (input: unknown) => unknown>();
    const overlapHandlers = new Map<string, (input: unknown) => unknown>();
    const observations = new Map<string, () => unknown>();
    const transform = resolvePickupEffectTransformV13(
      graph,
      catalog,
      "pickup-collect",
    );
    const transformConfiguration = graph.modules.find(
      (module) => module.instanceId === transform.plan.transformInstanceId,
    )!.configuration;
    const collectorConfiguration = graph.modules.find(
      (module) => module.instanceId === "pickup-collect",
    )!.configuration as Readonly<{
      maximumConcurrentCommits: number;
      maximumTrackedCollections: number;
      maximumApplicationsPerPickup: number;
    }>;
    const transactionToken = Object.freeze({ kind: "progression-event" });
    let runtime!: DeterministicGameModuleRuntimeV12;
    let collectedEvents = 0;
    let addressedApplications = 0;
    const effectTrace: ("consume" | "collected" | "application")[] = [];

    const effectHost = new PreparedEffectCommitHostV1({
      maximumConcurrentCommits: collectorConfiguration.maximumConcurrentCommits,
      duplicateLedgerCapacity: collectorConfiguration.maximumTrackedCollections,
      maximumApplicationsPerCommit:
        collectorConfiguration.maximumApplicationsPerPickup,
      routes: graph.effectApplicationRoutes,
      planner: (collected) =>
        transform.transform(transformConfiguration, collected),
      assertRunningEventToken: (token) => {
        if (token !== transactionToken || runtime.phase !== "running")
          throw new Error("prepared effect escaped its running event");
      },
      nowMs: () => Math.floor(runtime.clock.nowMs()),
      consumeSource: (sourceKey) => {
        if (!active.delete(sourceKey)) return "indeterminate";
        effectTrace.push("consume");
        return "consumed";
      },
      quarantineSource: () => undefined,
      deliverCollected: () => {
        effectTrace.push("collected");
        collectedEvents += 1;
      },
      recordFailure: () => undefined,
    });

    const entityKey = (entity: ActiveEntity) =>
      `${entity.channelId}:${entity.entityId}:${entity.generation}`;
    const createContext = (
      module: ResolvedModuleGraphV13["modules"][number],
      clock: unknown,
    ) => {
      const actor = actors.get(module.ownerId)!;
      return {
        identity: {
          instanceId: module.instanceId,
          ownerId: module.ownerId,
          moduleId: module.moduleId,
          version: module.version,
          artifactEnvelopeSha256: module.artifactIdentity!.envelopeSha256,
        },
        configuration: module.configuration,
        services: {
          viewport: { read: () => ({ width: 720, height: 720 }) },
          actors: {
            readOwner: () => actor,
            writeOwnerMotion: (motion: Readonly<{ x: number; y: number }>) => {
              actor.velocity = { ...motion };
            },
            writeOwnerPosition: (
              position: Readonly<{ x: number; y: number }>,
            ) => {
              actor.position = { ...position };
            },
          },
          input: {
            register: (id: string, handler: (input: unknown) => unknown) => {
              const key = `${module.instanceId}:${id}`;
              inputHandlers.set(key, handler);
              return () => inputHandlers.delete(key);
            },
          },
          overlaps: {
            register: (id: string, handler: (input: unknown) => unknown) => {
              const key = `${module.instanceId}:${id}`;
              overlapHandlers.set(key, handler);
              return () => overlapHandlers.delete(key);
            },
          },
          channels: {
            activate: (localChannelId: string, entityInput: unknown) => {
              const source = entityInput as Readonly<
                Record<string, unknown> & {
                  entityId: string;
                  generation: number;
                }
              >;
              const entityRole =
                module.instanceId === "pickup-spawn" ? "pickup" : "projectile";
              const entity = Object.freeze({
                ...source,
                channelId: `${module.instanceId}.${localChannelId}`,
                ownerActorId: module.ownerId,
                entityRole,
              }) as ActiveEntity;
              active.set(entityKey(entity), entity);
              return entity;
            },
            recycle: (_localChannelId: string, entityInput: unknown) => {
              const entity = entityInput as Partial<ActiveEntity>;
              for (const [key, activeEntity] of active)
                if (
                  activeEntity.entityId === entity.entityId &&
                  activeEntity.generation === entity.generation
                )
                  active.delete(key);
            },
            read: (channelId: string) =>
              Object.freeze(
                [...active.values()].filter(
                  (entity) => entity.channelId === channelId,
                ),
              ),
          },
          observation: {
            register: (id: string, reader: () => unknown) => {
              const key = `${module.instanceId}:${id}`;
              observations.set(key, reader);
              return () => observations.delete(key);
            },
          },
          contact: {
            executePolicy: () => {
              throw new Error("contact is outside progression conformance");
            },
            prepareCommit: () => {
              throw new Error("contact is outside progression conformance");
            },
          },
          ...(module.instanceId === "pickup-collect"
            ? {
                preparedEffects: {
                  prepare: (sourceKey: string, template: unknown) =>
                    effectHost.prepare(transactionToken, sourceKey, template),
                },
              }
            : {}),
        },
        ports: {
          declareHandler: () => undefined,
          declareAddressedHandler: () => undefined,
          publishState: () => undefined,
          emitEvent: () => undefined,
        },
        clock,
        assets: {
          requireTexture: (roleId: string) => `texture:${roleId}`,
          optionalTexture: () => undefined,
        },
      };
    };

    runtime = DeterministicGameModuleProductionInstantiatorV13.create({
      graph,
      catalog,
      createContextV12: (module, clock) =>
        createContext(module, clock) as never,
      createContextV13: (module, clock) =>
        createContext(module, clock) as never,
      registerAddressedHandler: (routeId, handler) =>
        effectHost.startRoute(routeId, (payload) => {
          const route = graph.effectApplicationRoutes.find(
            (candidate) => candidate.routeId === routeId,
          )!;
          effectTrace.push("application");
          addressedApplications += 1;
          handler(
            payload,
            Object.freeze({
              fromInstanceId: route.sourceInstanceId,
              fromPortId: route.applicationRouteSourceId,
              toInstanceId: route.targetInstanceId,
              toPortId: route.targetInputPort,
              payloadType: route.payloadType,
              delivery: "event" as const,
              replay: false,
            }),
          );
        }),
    });
    runtime.initialize();
    runtime.start();

    return Object.freeze({
      runtime,
      active,
      inputHandlers,
      overlapHandlers,
      observations,
      effectHost,
      effectTrace,
      readCollected: () => collectedEvents,
      readApplications: () => addressedApplications,
      triggerPickupOverlap: (entityId?: string) => {
        const pickup = [...active.values()].find(
          (entity) =>
            entity.entityRole === "pickup" &&
            (entityId === undefined || entity.entityId === entityId),
        );
        if (pickup === undefined)
          throw new Error("no active pickup to overlap");
        const handler = overlapHandlers.get("pickup-collect:pickup.commit");
        if (handler === undefined)
          throw new Error("pickup overlap is inactive");
        handler({
          sourceEntityId: pickup.entityId,
          sourceGeneration: pickup.generation,
          effectId: pickup.effectId,
          value: pickup.value,
        });
      },
      triggerPointerAttack: (worldX, worldY) => {
        const pointer = Object.freeze({
          id: 1,
          isDown: true,
          worldX,
          worldY,
        });
        inputHandlers.get("player-aim:aim.pointer")?.(pointer);
        inputHandlers.get("player-attack-intent:attack.pointer-down")?.(
          pointer,
        );
      },
      destroy: () => {
        runtime.dispose();
        runtime.destroy();
        effectHost.dispose();
        active.clear();
        inputHandlers.clear();
        overlapHandlers.clear();
        observations.clear();
      },
    });
  };

  let session = createSession();
  let destroyed = false;
  const snapshot = (): Batch2ProgressionBrowserSnapshot => {
    const delivery = session.observations.get(
      "player-delivery:delivery",
    )?.() as { damageBonus?: number } | undefined;
    const cleanupResidue = destroyed
      ? session.active.size +
        session.inputHandlers.size +
        session.overlapHandlers.size +
        session.observations.size +
        session.effectHost.activeRouteCount +
        session.effectHost.durableSourceCount +
        session.effectHost.activePreparedCount
      : 0;
    return Object.freeze({
      phase: session.runtime.phase,
      simulationTimeMs: session.runtime.clock.nowMs(),
      activePickups: [...session.active.values()].filter(
        (entity) => entity.entityRole === "pickup",
      ).length,
      activeProjectiles: [...session.active.values()].filter(
        (entity) => entity.entityRole === "projectile",
      ).length,
      collectedEvents: session.readCollected(),
      addressedApplications: session.readApplications(),
      deliveryDamageBonus: delivery?.damageBonus ?? 0,
      inputHandlers: session.inputHandlers.size,
      overlapHandlers: session.overlapHandlers.size,
      observationReaders: session.observations.size,
      preparedRoutes: session.effectHost.activeRouteCount,
      preparedSources: session.effectHost.durableSourceCount,
      activePreparedEffects: session.effectHost.activePreparedCount,
      effectTrace: Object.freeze([...session.effectTrace]),
      cleanupResidue,
    });
  };

  return Object.freeze({
    frame: (deltaMs) => session.runtime.frame(deltaMs),
    triggerPickupOverlap: (entityId) => session.triggerPickupOverlap(entityId),
    triggerPointerAttack: (worldX, worldY) =>
      session.triggerPointerAttack(worldX, worldY),
    pause: () => session.runtime.stop(),
    resume: () => session.runtime.start(),
    restart: () => {
      session.destroy();
      session = createSession();
      destroyed = false;
    },
    snapshot,
    destroy: () => {
      if (destroyed) return;
      session.destroy();
      destroyed = true;
    },
  });
}
