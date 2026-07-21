import { describe, expect, it, vi } from "vitest";

import { DeterministicGameModuleProductionInstantiatorV13 } from "../../src/modules/game-module-production-instantiator.js";
import { BrowserGameModuleRuntimeCatalogV13 } from "../../src/modules/game-module-runtime-catalog.js";
import type { GameModuleFactoryContextV13 } from "../../src/modules/game-module-runtime-factory.js";
import type { ResolvedModuleGraphV13 } from "../../src/modules/game-module-resolver.js";

const hash = (value: string) => value.repeat(64);
const zeroBudget = {
  activeEntities: 0,
  activeProjectiles: 0,
  spawnsPerSecond: 0,
  timers: 0,
};

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

function fixture(start: () => unknown = () => undefined) {
  const module = {
    instanceId: "health",
    ownerId: "player-one",
    moduleId: "combat.health-test",
    version: "1.1.0",
    kind: "combat-interaction" as const,
    implementationId: "combat.health-test.v1",
    configurationSchemaId: "combat.health-test.config",
    configuration: {},
    manifestSchemaVersion: "1.3.0" as const,
    factoryContextVersion: "1.3.0" as const,
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
      envelopeSha256: hash("a"),
    },
    runtimeLeaseCeilings: { startLeases: 1, instanceLeases: 0, graphLeases: 0 },
    runtimeContract: {
      update: null,
      timerSlots: { slotGroupId: "main" },
      inputRegistrations: [],
      observationReaders: [],
      contactCommit: null,
    },
    runtimePorts: { inputPorts: [], outputPorts: [] },
    runtimeAuthorities: {
      inputRegistrationIds: [],
      observationReaderIds: [],
      ownedChannelIds: [],
      ownsPlayerLocomotion: false,
      modifierTargetFieldIds: ["combat.health.current"],
    },
    catalogEntryEvidenceId: hash("b"),
  };
  const graph = {
    graphVersion: "1.3.0",
    assemblyId: "test.addressed-lease",
    kernelVersion: "1.0.0",
    engine: { id: "phaser", version: "3.90.0" },
    executionReadiness: { status: "ready", evidenceId: hash("c") },
    catalogEvidenceId: hash("d"),
    actors: [{ actorId: "player-one", role: "player" }],
    modules: [module],
    dependencyEdges: [],
    capabilityEdges: [],
    bindings: [],
    constructionOrder: ["health"],
    assetBindings: [],
    contactPolicyProfiles: [],
    damageSinkRoutes: [],
    entityChannels: [],
    entityMutationGrants: [],
    actorSnapshotGrants: [],
    entityChannelReadGrants: [],
    attackChannels: [],
    projectileChannelLineages: [],
    effectApplicationRoutes: [
      {
        routeId: "collector.effect-route.health",
        bindingId: "health",
        sourceInstanceId: "collector",
        applicationRouteSourceId: "applications",
        targetInstanceId: "health",
        targetInputPort: "modifier",
        fieldId: "combat.health.current",
        operation: "add",
        payloadType: "modifier-application-v1",
        targetLeaseId: "start/effect-target/collector.effect-route.health",
      },
    ],
    pickupEffectPlans: [],
    resourceTotals: zeroBudget,
  } as unknown as ResolvedModuleGraphV13;
  const catalog = new BrowserGameModuleRuntimeCatalogV13({
    catalogEvidenceId: graph.catalogEvidenceId,
    entries: [
      {
        moduleId: module.moduleId,
        version: module.version,
        envelopeSha256: module.artifactIdentity.envelopeSha256,
        implementationId: module.implementationId,
        manifestSchemaVersion: "1.3.0",
        exportKind: "lifecycle-create-v1",
        entryEvidenceId: module.catalogEntryEvidenceId,
        executable: (contextInput) => {
          const context = contextInput as GameModuleFactoryContextV13;
          context.ports.declareAddressedHandler(
            "combat.health.current",
            () => undefined,
          );
          return { instanceId: "health", start };
        },
      },
    ],
  });
  const registered = vi.fn();
  const released = vi.fn();
  const runtime = DeterministicGameModuleProductionInstantiatorV13.create({
    graph,
    catalog,
    createContextV12: () => {
      throw new Error("unexpected V1.2 context");
    },
    createContextV13: (resolved, clock) => ({
      identity: {
        instanceId: resolved.instanceId,
        ownerId: resolved.ownerId,
        moduleId: resolved.moduleId,
        version: resolved.version,
        artifactEnvelopeSha256: resolved.artifactIdentity!.envelopeSha256,
      },
      configuration: {},
      services: services(),
      ports: {
        declareHandler: () => undefined,
        declareAddressedHandler: () => undefined,
        publishState: () => undefined,
        emitEvent: () => undefined,
      },
      clock,
      assets: {
        requireTexture: () => "texture",
        optionalTexture: () => undefined,
      },
    }),
    registerAddressedHandler: (routeId) => {
      registered(routeId);
      return released;
    },
  });
  return { registered, released, runtime };
}

describe("ADR 0027 addressed target lifecycle lease", () => {
  it("activates only at start and revokes on stop/dispose", () => {
    const { registered, released, runtime } = fixture();
    runtime.initialize();
    expect(registered).not.toHaveBeenCalled();
    runtime.start();
    expect(registered).toHaveBeenCalledOnce();
    runtime.stop();
    expect(released).toHaveBeenCalledOnce();
    runtime.dispose();
    expect(released).toHaveBeenCalledOnce();
  });

  it("revokes the lease when factory start fails", () => {
    const { registered, released, runtime } = fixture(() => {
      throw new Error("start failed");
    });
    runtime.initialize();
    expect(() => runtime.start()).toThrow("module graph terminal failure");
    expect(registered).toHaveBeenCalledOnce();
    expect(released).toHaveBeenCalledOnce();
  });
});
