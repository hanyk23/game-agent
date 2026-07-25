import {
  DeterministicGameModuleProductionInstantiatorV14,
  type ProductionModuleV14View,
} from "../../../../src/modules/game-module-production-instantiator.js";
import {
  BrowserGameModuleRuntimeCatalogV14,
  type BrowserResolvedModuleGraphV14,
  type BrowserRuntimeCatalogEntryV14,
} from "../../../../src/modules/game-module-runtime-catalog.js";
import type {
  GameModuleFactoryContextV12,
  GameModuleFactoryContextV13,
  GameModuleFactoryContextV14,
} from "../../../../src/modules/game-module-runtime-factory.js";
import type { ResolvedModuleGraphV14 } from "../../../../src/modules/game-module-resolver-v14.js";
import {
  batch1ResolvedGraph,
  batch1RuntimeCatalog,
} from "../generated/batch1-runtime.js";

const hash = (character: string): string => character.repeat(64);
const baseServiceKeys = [
  "actors",
  "channels",
  "contact",
  "input",
  "observation",
  "overlaps",
  "viewport",
];

export const EXPECTED_MANIFEST_V12_SERVICE_KEY_BYTES =
  JSON.stringify(baseServiceKeys);
export const EXPECTED_MANIFEST_V13_SERVICE_KEY_BYTES = JSON.stringify(
  ["actorSnapshots", ...baseServiceKeys].sort(),
);
export const EXPECTED_MANIFEST_V14_SERVICE_KEY_BYTES = JSON.stringify(
  [
    "actorRootSnapshots",
    ...baseServiceKeys,
    "hostileProjectileDelivery",
  ].sort(),
);

export type MixedV14BrowserConformanceSnapshot = Readonly<{
  phase: "running" | "destroyed";
  contextVersions: readonly string[];
  serviceKeyBytes: readonly string[];
  olderContextsHaveV14Authority: boolean;
  v14HasExactGrantedAuthority: boolean;
  executedInstanceIds: readonly string[];
  lifecycleTrace: readonly string[];
}>;

export type MixedV14BrowserConformanceRuntime = Readonly<{
  snapshot(): MixedV14BrowserConformanceSnapshot;
  destroy(): void;
}>;

function baseServices() {
  return Object.freeze({
    viewport: Object.freeze({ read: () => ({ width: 720, height: 720 }) }),
    actors: Object.freeze({
      readOwner: () => undefined,
      writeOwnerMotion: () => undefined,
      writeOwnerPosition: () => undefined,
    }),
    input: Object.freeze({ register: () => () => undefined }),
    overlaps: Object.freeze({ register: () => () => undefined }),
    channels: Object.freeze({
      activate: (_id: string, entity: unknown) => entity,
      recycle: () => undefined,
      read: () => Object.freeze([]),
    }),
    observation: Object.freeze({ register: () => () => undefined }),
    contact: Object.freeze({
      executePolicy: () => undefined,
      prepareCommit: () => undefined,
    }),
  });
}

function probeModule(
  instanceId: string,
  index: number,
  contextVersion: "1.3.0" | "1.4.0",
) {
  return Object.freeze({
    instanceId,
    ownerId: "world",
    moduleId: `conformance.${instanceId}`,
    version: "1.0.0",
    kind: "outcome",
    implementationId: `conformance.${instanceId}.v1`,
    configurationSchemaId: `conformance.${instanceId}.config`,
    configuration: Object.freeze({}),
    instantiation: "production-eligible",
    manifestSchemaVersion: contextVersion,
    factoryContextVersion: contextVersion,
    runtimeContract: Object.freeze({
      update: null,
      timerSlots: Object.freeze({ slotGroupId: "main" }),
      inputRegistrations: Object.freeze([]),
      observationReaders: Object.freeze([]),
      contactCommit: null,
    }),
    runtimeAuthorities: Object.freeze({
      ownsPlayerLocomotion: false,
      inputRegistrationIds: Object.freeze([]),
      overlapRuleId: null,
      observationReaderIds: Object.freeze([]),
      ownedPoolIds: Object.freeze([]),
      ownedChannelIds: Object.freeze([]),
      modifierTargetFieldIds: Object.freeze([]),
    }),
    runtimePorts: Object.freeze({
      inputPorts: Object.freeze([]),
      outputPorts: Object.freeze([]),
    }),
    resourceGrant: Object.freeze({
      activeEntities: 0,
      activeProjectiles: 0,
      spawnsPerSecond: 0,
      timers: 0,
    }),
    artifactIdentity: Object.freeze({ envelopeSha256: hash(String(index)) }),
    catalogEntryEvidenceId: hash(String(index + 3)),
  }) as unknown as ProductionModuleV14View;
}

function serializeServiceKeys(context: {
  services: Readonly<Record<string, unknown>>;
}): string {
  return JSON.stringify(Object.keys(context.services).sort());
}

export function createMixedV14BrowserConformanceRuntime(): MixedV14BrowserConformanceRuntime {
  const admittedLegacy = batch1ResolvedGraph.modules.find(
    (candidate) => candidate.instanceId === "keyboard",
  );
  if (
    admittedLegacy === undefined ||
    admittedLegacy.artifactIdentity === undefined ||
    admittedLegacy.catalogEntryEvidenceId === undefined
  )
    throw new Error("missing admitted Manifest 1.2 conformance module");
  const admittedLegacyEntry = batch1RuntimeCatalog.findForGraph(
    batch1ResolvedGraph,
    admittedLegacy.instanceId,
  );
  const legacy = Object.freeze({
    ...admittedLegacy,
    manifestSchemaVersion: "1.2.0" as const,
    factoryContextVersion: "1.2.0" as const,
  }) as unknown as ProductionModuleV14View;
  const modern = probeModule("modern-probe", 2, "1.3.0");
  const batch3 = probeModule("batch3-probe", 3, "1.4.0");
  const modules: readonly ProductionModuleV14View[] = [legacy, modern, batch3];
  const catalogEvidenceId = hash("b");
  const graph = {
    graphVersion: "1.4.0",
    executionReadiness: { status: "ready", evidenceId: hash("a") },
    catalogEvidenceId,
    constructionOrder: modules.map((module) => module.instanceId),
    modules,
    bindings: [],
    entityChannels: [],
    attackChannels: [],
    actorSnapshotGrants: [
      {
        grantId: "modern-snapshot-grant",
        instanceId: modern.instanceId,
        descriptor: { readId: "modern-snapshot" },
      },
    ],
    entityChannelReadGrants: [],
    pickupEffectPlans: [],
    effectApplicationRoutes: [],
    actorRootChannels: [
      {
        rootChannelId: "enemy-roots",
        producerInstanceId: modern.instanceId,
        consumerGrants: [
          {
            bindingId: "batch3-root-snapshot",
            consumerInstanceId: batch3.instanceId,
          },
        ],
      },
    ],
    hostileAttackChannels: [
      {
        lineageId: "batch3-hostile-lineage",
        contentionGroupId: "enemy-projectiles",
        deliveryInstanceId: batch3.instanceId,
      },
    ],
    hostileContentionGroups: [],
    actorSetDamageRoutes: [],
    actorRootMutationGrants: [],
    scoringAuthority: null,
    outcomeAuthority: null,
  } as unknown as ResolvedModuleGraphV14 & BrowserResolvedModuleGraphV14;
  const executedInstanceIds: string[] = [];
  const lifecycleTrace: string[] = [];
  const contexts: Array<
    | GameModuleFactoryContextV12
    | GameModuleFactoryContextV13
    | GameModuleFactoryContextV14
  > = [];
  const entries: BrowserRuntimeCatalogEntryV14[] = modules.map((resolved) => ({
    moduleId: resolved.moduleId,
    version: resolved.version,
    envelopeSha256: resolved.artifactIdentity!.envelopeSha256,
    implementationId: resolved.implementationId,
    manifestSchemaVersion: resolved.manifestSchemaVersion,
    factoryContextVersion: resolved.factoryContextVersion,
    exportKind: "lifecycle-create-v1",
    entryEvidenceId: resolved.catalogEntryEvidenceId!,
    executable: (context) => {
      executedInstanceIds.push(resolved.instanceId);
      contexts.push(
        context as
          | GameModuleFactoryContextV12
          | GameModuleFactoryContextV13
          | GameModuleFactoryContextV14,
      );
      const participant =
        resolved.instanceId === legacy.instanceId
          ? admittedLegacyEntry.executable(context)
          : Object.freeze({});
      const source = participant as Record<string, unknown>;
      const invoke = (hook: "initialize" | "start" | "stop" | "dispose") =>
        typeof source[hook] === "function"
          ? (source[hook] as () => unknown)()
          : undefined;
      return Object.freeze({
        initialize: () => {
          lifecycleTrace.push(`${resolved.instanceId}:initialize`);
          return invoke("initialize");
        },
        start: () => {
          lifecycleTrace.push(`${resolved.instanceId}:start`);
          return invoke("start");
        },
        ...(typeof source.update === "function"
          ? {
              update: (deltaMs: number) =>
                (source.update as (deltaMs: number) => unknown)(deltaMs),
            }
          : {}),
        stop: () => {
          lifecycleTrace.push(`${resolved.instanceId}:stop`);
          return invoke("stop");
        },
        dispose: () => {
          lifecycleTrace.push(`${resolved.instanceId}:dispose`);
          return invoke("dispose");
        },
      });
    },
  }));
  const catalog = new BrowserGameModuleRuntimeCatalogV14({
    catalogEvidenceId,
    entries,
  });
  const createContext = (
    resolved: ProductionModuleV14View,
    clock: GameModuleFactoryContextV12["clock"],
    services: GameModuleFactoryContextV12["services"],
  ) => ({
    identity: Object.freeze({
      instanceId: resolved.instanceId,
      ownerId: resolved.ownerId,
      moduleId: resolved.moduleId,
      version: resolved.version,
      artifactEnvelopeSha256: resolved.artifactIdentity!.envelopeSha256,
    }),
    configuration: resolved.configuration,
    services,
    ports: Object.freeze({
      declareHandler: () => undefined,
      declareAddressedHandler: () => undefined,
      publishState: () => undefined,
      emitEvent: () => undefined,
    }),
    clock,
    assets: Object.freeze({
      requireTexture: () => "unused",
      optionalTexture: () => undefined,
    }),
  });
  const runtime = DeterministicGameModuleProductionInstantiatorV14.create({
    graph,
    catalog,
    createContextV12: (resolved, clock) =>
      createContext(
        resolved,
        clock,
        baseServices(),
      ) as GameModuleFactoryContextV12,
    createContextV13: (resolved, clock) =>
      createContext(
        resolved,
        clock,
        Object.freeze({
          ...baseServices(),
          actorSnapshots: Object.freeze({ read: () => Object.freeze({}) }),
        }) as GameModuleFactoryContextV13["services"],
      ) as GameModuleFactoryContextV13,
    createContextV14Base: (resolved, clock) =>
      createContext(resolved, clock, baseServices()) as never,
    createAuthorityAdapters: () => ({
      actorRoots: Object.freeze({
        activate: () => Object.freeze({}),
        deactivate: () => Object.freeze({}),
      }),
      actorRootSnapshots: Object.freeze({
        read: () => Object.freeze({}),
      }),
      hostileProjectileDelivery: Object.freeze({
        admit: () => Object.freeze({ admitted: false }),
        recycle: () => undefined,
        observe: () => Object.freeze({}),
      }),
      hostileAttackLineage: Object.freeze({
        readActiveSource: () =>
          Object.freeze({ position: Object.freeze({ x: 0, y: 0 }) }),
      }),
    }),
    registerAddressedHandler: () => undefined,
  });
  runtime.initialize();
  runtime.start();
  let phase: "running" | "destroyed" = "running";

  return Object.freeze({
    snapshot: () => {
      const serviceKeyBytes = contexts.map((context) =>
        serializeServiceKeys(context),
      );
      return Object.freeze({
        phase,
        contextVersions: Object.freeze(
          modules.map((module) => module.factoryContextVersion),
        ),
        serviceKeyBytes: Object.freeze(serviceKeyBytes),
        olderContextsHaveV14Authority: contexts
          .slice(0, 2)
          .some((context) =>
            [
              "actorRoots",
              "actorRootSnapshots",
              "actorRootMutation",
              "hostileProjectileDelivery",
              "outcomeCommit",
            ].some((key) => key in context.services),
          ),
        v14HasExactGrantedAuthority:
          serviceKeyBytes[2] === EXPECTED_MANIFEST_V14_SERVICE_KEY_BYTES,
        executedInstanceIds: Object.freeze([...executedInstanceIds]),
        lifecycleTrace: Object.freeze([...lifecycleTrace]),
      });
    },
    destroy: () => {
      runtime.destroy();
      phase = "destroyed";
    },
  });
}
