import { describe, expect, it } from "vitest";

import { DeterministicGameModuleProductionInstantiatorV13 } from "../../src/modules/game-module-production-instantiator.js";
import {
  BrowserGameModuleRuntimeCatalogV13,
  type BrowserRuntimeCatalogEntryV13,
} from "../../src/modules/game-module-runtime-catalog.js";
import type {
  GameModuleFactoryContextV12,
  GameModuleFactoryContextV13,
} from "../../src/modules/game-module-runtime-factory.js";
import type { ResolvedModuleGraphV13 } from "../../src/modules/game-module-resolver.js";

const hash = (character: string) => character.repeat(64);
const zeroBudget = {
  activeEntities: 0,
  activeProjectiles: 0,
  spawnsPerSecond: 0,
  timers: 0,
};
const runtimeContract = {
  update: null,
  timerSlots: { slotGroupId: "main" },
  inputRegistrations: [],
  observationReaders: [],
  contactCommit: null,
} as const;

function module(
  instanceId: string,
  manifestSchemaVersion: "1.2.0" | "1.3.0",
  entryEvidenceId: string,
) {
  return {
    instanceId,
    ownerId: "player-one",
    moduleId: `test.${instanceId}`,
    version: "1.0.0",
    kind: "player-intent" as const,
    implementationId: `test.${instanceId}.v1`,
    configurationSchemaId: `test.${instanceId}.config`,
    configuration: {},
    manifestSchemaVersion,
    factoryContextVersion: manifestSchemaVersion,
    instantiation: "production-eligible" as const,
    manifestSha256: hash("1"),
    resources: zeroBudget,
    resourceGrant: zeroBudget,
    artifactIdentity: {
      schemaVersion: "1.0.0" as const,
      algorithm: "sha256" as const,
      envelopeFormat: "module-registration-envelope-v1" as const,
      manifestSha256: hash("1"),
      configurationDescriptorSha256: hash("2"),
      reservationDescriptorSha256: hash("3"),
      implementationBundleSha256: hash("4"),
      dependencyLockSha256: hash("5"),
      toolchainIdentitySha256: hash("6"),
      envelopeSha256: hash(instanceId === "legacy" ? "a" : "b"),
    },
    runtimeLeaseCeilings: { startLeases: 0, instanceLeases: 0, graphLeases: 0 },
    runtimeContract,
    runtimePorts: { inputPorts: [], outputPorts: [] },
    runtimeAuthorities: {
      inputRegistrationIds: [],
      observationReaderIds: [],
      ownedChannelIds: [],
      ownsPlayerLocomotion: false,
    },
    catalogEntryEvidenceId: entryEvidenceId,
  };
}

function services() {
  return {
    viewport: { read: () => ({ width: 1, height: 1 }) },
    actors: {
      readOwner: () => undefined,
      writeOwnerMotion: () => undefined,
      writeOwnerPosition: () => undefined,
    },
    input: { register: () => () => undefined },
    overlaps: { register: () => () => undefined },
    channels: {
      activate: () => undefined,
      recycle: () => undefined,
      read: () => undefined,
    },
    observation: { register: () => () => undefined },
    contact: {
      executePolicy: () => undefined,
      prepareCommit: () => undefined,
    },
  };
}

describe("ADR 0027 mixed isolated runtime", () => {
  it("runs unchanged V1.2 and exact V1.3 contexts in one Graph 1.3", () => {
    const catalogEvidenceId = hash("c");
    const legacyEvidence = hash("d");
    const modernEvidence = hash("e");
    const legacy = module("legacy", "1.2.0", legacyEvidence);
    const modern = module("modern", "1.3.0", modernEvidence);
    const underlyingActorReads: string[] = [];
    const graph = {
      graphVersion: "1.3.0",
      assemblyId: "test.mixed-runtime",
      kernelVersion: "1.0.0",
      engine: { id: "phaser", version: "3.90.0" },
      executionReadiness: { status: "ready", evidenceId: hash("f") },
      catalogEvidenceId,
      actors: [{ actorId: "player-one", role: "player" }],
      modules: [legacy, modern],
      dependencyEdges: [],
      capabilityEdges: [],
      bindings: [],
      constructionOrder: ["legacy", "modern"],
      assetBindings: [],
      contactPolicyProfiles: [],
      damageSinkRoutes: [],
      entityChannels: [],
      entityMutationGrants: [],
      actorSnapshotGrants: [
        {
          grantId: "modern/actor-read/nearest.targets",
          instanceId: "modern",
          ownerActorId: "player-one",
          descriptor: {
            readId: "nearest.targets",
            ownerRelation: "different-owner",
            sourceActorRoles: ["player"],
            targetActorRoles: ["enemy"],
            maximumEntries: 1,
            entryFields: ["actorId", "actorGeneration", "active"],
            envelopeFields: [
              "directoryRevision",
              "sampledAtMs",
              "sampledFrameSequence",
              "entryCount",
            ],
            order: "actor-id-generation",
            distanceOrigin: null,
          },
        },
      ],
      entityChannelReadGrants: [],
      attackChannels: [],
      projectileChannelLineages: [],
      effectApplicationRoutes: [],
      pickupEffectPlans: [],
      resourceTotals: zeroBudget,
    } as unknown as ResolvedModuleGraphV13;
    const observed = new Map<string, { services: string[]; ports: string[] }>();
    const entries: BrowserRuntimeCatalogEntryV13[] = [legacy, modern].map(
      (resolved) => ({
        moduleId: resolved.moduleId,
        version: resolved.version,
        envelopeSha256: resolved.artifactIdentity.envelopeSha256,
        implementationId: resolved.implementationId,
        manifestSchemaVersion: resolved.manifestSchemaVersion,
        exportKind: "lifecycle-create-v1",
        entryEvidenceId: resolved.catalogEntryEvidenceId,
        executable: (contextInput) => {
          const context = contextInput as GameModuleFactoryContextV13;
          observed.set(resolved.instanceId, {
            services: Object.keys(context.services).sort(),
            ports: Object.keys(context.ports).sort(),
          });
          return {
            instanceId: resolved.instanceId,
            ...(resolved.instanceId === "modern"
              ? {
                  initialize() {
                    context.services.actorSnapshots!.read("nearest.targets");
                  },
                }
              : {}),
          };
        },
      }),
    );
    const catalog = new BrowserGameModuleRuntimeCatalogV13({
      catalogEvidenceId,
      entries,
    });
    const common = {
      configuration: {},
      services: services(),
      assets: {
        requireTexture: () => "texture",
        optionalTexture: () => undefined,
      },
    };
    const runtime = DeterministicGameModuleProductionInstantiatorV13.create({
      graph,
      catalog,
      createContextV12: (resolved, clock) =>
        ({
          ...common,
          identity: {
            instanceId: resolved.instanceId,
            ownerId: resolved.ownerId,
            moduleId: resolved.moduleId,
            version: resolved.version,
            artifactEnvelopeSha256: resolved.artifactIdentity!.envelopeSha256,
          },
          ports: {
            declareHandler: () => undefined,
            publishState: () => undefined,
            emitEvent: () => undefined,
          },
          clock,
        }) satisfies GameModuleFactoryContextV12,
      createContextV13: (resolved, clock) =>
        ({
          ...common,
          services: {
            ...services(),
            actorSnapshots: {
              read: (grantId: string) => {
                underlyingActorReads.push(grantId);
                return { entries: [] };
              },
            },
          },
          identity: {
            instanceId: resolved.instanceId,
            ownerId: resolved.ownerId,
            moduleId: resolved.moduleId,
            version: resolved.version,
            artifactEnvelopeSha256: resolved.artifactIdentity!.envelopeSha256,
          },
          ports: {
            declareHandler: () => undefined,
            declareAddressedHandler: () => undefined,
            publishState: () => undefined,
            emitEvent: () => undefined,
          },
          clock,
        }) satisfies GameModuleFactoryContextV13,
      registerAddressedHandler: () => undefined,
    });
    runtime.initialize();
    runtime.start();
    runtime.stop();
    runtime.dispose();
    expect(observed.get("legacy")?.services).toEqual([
      "actors",
      "channels",
      "contact",
      "input",
      "observation",
      "overlaps",
      "viewport",
    ]);
    expect(observed.get("legacy")?.ports).toEqual([
      "declareHandler",
      "emitEvent",
      "publishState",
    ]);
    expect(observed.get("modern")?.ports).toContain("declareAddressedHandler");
    expect(observed.get("modern")?.services).toContain("actorSnapshots");
    expect(underlyingActorReads).toEqual(["modern/actor-read/nearest.targets"]);
  });
});
