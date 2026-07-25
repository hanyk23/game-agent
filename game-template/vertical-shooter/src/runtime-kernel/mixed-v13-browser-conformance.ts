import { DeterministicGameModuleProductionInstantiatorV13 } from "../../../../src/modules/game-module-production-instantiator.js";
import {
  BrowserGameModuleRuntimeCatalogV13,
  type BrowserRuntimeCatalogEntryV13,
} from "../../../../src/modules/game-module-runtime-catalog.js";
import type {
  GameModuleFactoryContextV12,
  GameModuleFactoryContextV13,
} from "../../../../src/modules/game-module-runtime-factory.js";
import type { ResolvedModuleGraphV13 } from "../../../../src/modules/game-module-resolver.js";
import {
  batch1ResolvedGraph,
  batch1RuntimeCatalog,
} from "../generated/batch1-runtime.js";

const hash = (character: string): string => character.repeat(64);
const zeroBudget = Object.freeze({
  activeEntities: 0,
  activeProjectiles: 0,
  spawnsPerSecond: 0,
  timers: 0,
});
const runtimeContract = Object.freeze({
  update: null,
  timerSlots: Object.freeze({ slotGroupId: "main" }),
  inputRegistrations: Object.freeze([]),
  observationReaders: Object.freeze([]),
  contactCommit: null,
});

export const EXPECTED_MANIFEST_V12_CONTEXT_KEY_BYTES =
  '{"context":["assets","clock","configuration","identity","ports","services"],"identity":["artifactEnvelopeSha256","instanceId","moduleId","ownerId","version"],"services":["actors","channels","contact","input","observation","overlaps","viewport"],"ports":["declareHandler","emitEvent","publishState"],"clock":["nowMs","schedule"],"assets":["optionalTexture","requireTexture"]}';

export type MixedV13BrowserConformanceSnapshot = Readonly<{
  phase: string;
  legacyContextKeyBytes: string;
  expectedLegacyContextKeyBytes: string;
  legacyHasV13Grant: boolean;
  modernHasActorSnapshotGrant: boolean;
  executedInstanceIds: readonly string[];
}>;

export type MixedV13BrowserConformanceRuntime = Readonly<{
  snapshot(): MixedV13BrowserConformanceSnapshot;
  destroy(): void;
}>;

function module(instanceId: "modern-probe", entryEvidenceId: string) {
  return Object.freeze({
    instanceId,
    ownerId: "player-one",
    moduleId: `conformance.${instanceId}`,
    version: "1.0.0",
    kind: "player-intent" as const,
    implementationId: `conformance.${instanceId}.v1`,
    configurationSchemaId: `conformance.${instanceId}.config`,
    configuration: Object.freeze({}),
    manifestSchemaVersion: "1.3.0" as const,
    factoryContextVersion: "1.3.0" as const,
    instantiation: "production-eligible" as const,
    manifestSha256: hash("1"),
    resources: zeroBudget,
    resourceGrant: zeroBudget,
    artifactIdentity: Object.freeze({
      schemaVersion: "1.0.0" as const,
      algorithm: "sha256" as const,
      envelopeFormat: "module-registration-envelope-v1" as const,
      manifestSha256: hash("1"),
      configurationDescriptorSha256: hash("2"),
      reservationDescriptorSha256: hash("3"),
      implementationBundleSha256: hash("4"),
      dependencyLockSha256: hash("5"),
      toolchainIdentitySha256: hash("6"),
      envelopeSha256: hash("b"),
    }),
    runtimeLeaseCeilings: Object.freeze({
      startLeases: 0,
      instanceLeases: 0,
      graphLeases: 0,
    }),
    runtimeContract,
    runtimePorts: Object.freeze({
      inputPorts: Object.freeze([]),
      outputPorts: Object.freeze([]),
    }),
    runtimeAuthorities: Object.freeze({
      inputRegistrationIds: Object.freeze([]),
      observationReaderIds: Object.freeze([]),
      ownedChannelIds: Object.freeze([]),
      ownsPlayerLocomotion: false,
    }),
    catalogEntryEvidenceId: entryEvidenceId,
  });
}

function keyBytes(context: GameModuleFactoryContextV12): string {
  return JSON.stringify({
    context: Object.keys(context).sort(),
    identity: Object.keys(context.identity).sort(),
    services: Object.keys(context.services).sort(),
    ports: Object.keys(context.ports).sort(),
    clock: Object.keys(context.clock).sort(),
    assets: Object.keys(context.assets).sort(),
  });
}

function services() {
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

export function createMixedV13BrowserConformanceRuntime(): MixedV13BrowserConformanceRuntime {
  const catalogEvidenceId = hash("c");
  const admittedLegacy = batch1ResolvedGraph.modules.find(
    (candidate) => candidate.instanceId === "keyboard",
  );
  if (admittedLegacy === undefined)
    throw new Error("missing admitted Manifest 1.2 conformance module");
  const admittedLegacyEntry = batch1RuntimeCatalog.findForGraph(
    batch1ResolvedGraph,
    admittedLegacy.instanceId,
  );
  const legacy = Object.freeze({
    ...admittedLegacy,
    manifestSchemaVersion: "1.2.0" as const,
    factoryContextVersion: "1.2.0" as const,
  });
  const modern = module("modern-probe", hash("e"));
  const graph = {
    graphVersion: "1.3.0",
    assemblyId: "conformance.mixed-v13-browser",
    kernelVersion: "1.0.0",
    engine: { id: "phaser", version: "3.90.0" },
    executionReadiness: { status: "ready", evidenceId: hash("f") },
    catalogEvidenceId,
    actors: [
      { actorId: "player-one", role: "player" },
      { actorId: "enemy-one", role: "enemy" },
    ],
    modules: [legacy, modern],
    dependencyEdges: [],
    capabilityEdges: [],
    bindings: [],
    constructionOrder: [legacy.instanceId, modern.instanceId],
    assetBindings: [],
    contactPolicyProfiles: [],
    damageSinkRoutes: [],
    entityChannels: [],
    entityMutationGrants: [],
    actorSnapshotGrants: [
      {
        grantId: "modern-probe:nearest-enemies",
        instanceId: modern.instanceId,
        ownerActorId: modern.ownerId,
        descriptor: {
          readId: "nearest-enemies",
          ownerRelation: "different-owner",
          sourceActorRoles: ["player"],
          targetActorRoles: ["enemy"],
          maximumEntries: 1,
          entryFields: ["actorId", "actorGeneration", "active", "position"],
          envelopeFields: [
            "directoryRevision",
            "sampledAtMs",
            "sampledFrameSequence",
            "entryCount",
          ],
          order: "distance-then-actor-id-generation",
          distanceOrigin: "owner-position-same-snapshot",
        },
      },
    ],
    entityChannelReadGrants: [],
    attackChannels: [],
    projectileChannelLineages: [],
    effectApplicationRoutes: [],
    pickupEffectPlans: [],
    projectileBudgetContention: {
      budget: { activeProjectiles: 0, spawnsPerSecond: 0 },
      totals: { activeProjectiles: 0, spawnsPerSecond: 0 },
      orderedOwners: [],
    },
    resourceTotals: zeroBudget,
  } as unknown as ResolvedModuleGraphV13;
  let legacyContextKeyBytes = "";
  let legacyHasV13Grant = false;
  let modernHasActorSnapshotGrant = false;
  const executedInstanceIds: string[] = [];
  const entries: BrowserRuntimeCatalogEntryV13[] = [
    {
      moduleId: legacy.moduleId,
      version: legacy.version,
      envelopeSha256: legacy.artifactIdentity!.envelopeSha256,
      implementationId: legacy.implementationId,
      manifestSchemaVersion: "1.2.0",
      exportKind: "lifecycle-create-v1",
      entryEvidenceId: legacy.catalogEntryEvidenceId!,
      executable: (contextInput) => {
        const context = contextInput as GameModuleFactoryContextV12;
        executedInstanceIds.push(legacy.instanceId);
        legacyContextKeyBytes = keyBytes(context);
        legacyHasV13Grant =
          "actorSnapshots" in context.services ||
          "entityChannelSnapshots" in context.services ||
          "preparedEffects" in context.services ||
          "declareAddressedHandler" in context.ports;
        return admittedLegacyEntry.executable(contextInput);
      },
    },
    {
      moduleId: modern.moduleId,
      version: modern.version,
      envelopeSha256: modern.artifactIdentity.envelopeSha256,
      implementationId: modern.implementationId,
      manifestSchemaVersion: "1.3.0",
      exportKind: "lifecycle-create-v1",
      entryEvidenceId: modern.catalogEntryEvidenceId,
      executable: (contextInput) => {
        const context = contextInput as GameModuleFactoryContextV13;
        executedInstanceIds.push(modern.instanceId);
        modernHasActorSnapshotGrant =
          typeof context.services.actorSnapshots?.read === "function" &&
          "declareAddressedHandler" in context.ports;
        return Object.freeze({ instanceId: modern.instanceId });
      },
    },
  ];
  const catalog = new BrowserGameModuleRuntimeCatalogV13({
    catalogEvidenceId,
    entries,
  });
  const common = Object.freeze({
    services: services(),
    assets: Object.freeze({
      requireTexture: () => "unused",
      optionalTexture: () => undefined,
    }),
  });
  const identity = (resolved: (typeof graph.modules)[number]) =>
    Object.freeze({
      instanceId: resolved.instanceId,
      ownerId: resolved.ownerId,
      moduleId: resolved.moduleId,
      version: resolved.version,
      artifactEnvelopeSha256: resolved.artifactIdentity!.envelopeSha256,
    });
  const basePorts = Object.freeze({
    declareHandler: () => undefined,
    publishState: () => undefined,
    emitEvent: () => undefined,
  });
  const runtime = DeterministicGameModuleProductionInstantiatorV13.create({
    graph,
    catalog,
    createContextV12: (resolved, clock) => ({
      ...common,
      configuration: resolved.configuration as Readonly<unknown>,
      identity: identity(resolved),
      ports: basePorts,
      clock,
    }),
    createContextV13: (resolved, clock) => ({
      ...common,
      configuration: resolved.configuration as Readonly<unknown>,
      identity: identity(resolved),
      services: Object.freeze({
        ...common.services,
        actorSnapshots: Object.freeze({ read: () => Object.freeze({}) }),
      }),
      ports: Object.freeze({
        ...basePorts,
        declareAddressedHandler: () => undefined,
      }),
      clock,
    }),
    registerAddressedHandler: () => undefined,
  });
  runtime.initialize();
  runtime.start();

  return Object.freeze({
    snapshot: () =>
      Object.freeze({
        phase: runtime.phase,
        legacyContextKeyBytes,
        expectedLegacyContextKeyBytes: EXPECTED_MANIFEST_V12_CONTEXT_KEY_BYTES,
        legacyHasV13Grant,
        modernHasActorSnapshotGrant,
        executedInstanceIds: Object.freeze([...executedInstanceIds]),
      }),
    destroy: () => {
      runtime.dispose();
      runtime.destroy();
    },
  });
}
