import { z } from "zod";

import { describe, expect, it } from "vitest";

import { BATCH1_MODULE_DEFINITIONS } from "../../src/modules/batch1-gameplay-library.js";
import { GameModuleManifestV13Schema } from "../../src/modules/game-module-contract.js";
import { GameModuleRegistry } from "../../src/modules/game-module-registry.js";
import {
  ModuleResolutionError,
  ModuleResolutionErrorCode,
  resolveGameAssemblyV13,
} from "../../src/modules/game-module-resolver.js";

const base = BATCH1_MODULE_DEFINITIONS[0]!.manifest;
const resources = {
  activeEntities: 0,
  activeProjectiles: 0,
  spawnsPerSecond: 0,
  timers: 0,
};

function manifest(moduleId: string, overrides: Record<string, unknown>) {
  return GameModuleManifestV13Schema.parse({
    ...structuredClone(base),
    schemaVersion: "1.3.0",
    moduleId,
    kind: "progression-loadout",
    implementationId: `${moduleId}.v1`,
    configurationSchemaId: `${moduleId}.config`,
    provides: [],
    requires: [],
    dependencies: [],
    inputPorts: [],
    outputPorts: [],
    assetRequirements: [],
    conflicts: [],
    exclusiveOwnership: [],
    resources,
    runtimeLeases: { startLeases: 0, instanceLeases: 0, graphLeases: 0 },
    runtimeContract: {
      update: null,
      timerSlots: { slotGroupId: "main" },
      inputRegistrations: [],
      observationReaders: [],
      contactCommit: null,
    },
    ownedEntityChannels: [],
    entityMutationAccess: [],
    actorSnapshotReads: [],
    entityChannelReads: [],
    projectileChannelConsumer: null,
    attackChannel: null,
    preparedEffectCommit: null,
    modifierTargets: [],
    pickupEffectPlanTransform: null,
    ...overrides,
  });
}

function fixture() {
  const provider = manifest("progression.pickup-source-test", {
    outputPorts: [
      {
        id: "pickups",
        payloadType: "entity-channel-v1",
        delivery: "state",
        entityRole: "pickup",
      },
    ],
    resources: { ...resources, activeEntities: 4 },
    runtimeLeases: { startLeases: 0, instanceLeases: 2, graphLeases: 0 },
    ownedEntityChannels: [
      {
        channelId: "pickups",
        outputPort: "pickups",
        entityRole: "pickup",
        capacity: {
          kind: "constant",
          value: 4,
          resources: ["activeEntities"],
        },
      },
    ],
  });
  const collector = manifest("progression.pickup-collector-test", {
    inputPorts: [
      {
        id: "sources",
        payloadType: "entity-channel-v1",
        required: true,
        multiple: false,
        delivery: "state",
        authorization: {
          ownerRelation: "different-owner",
          sourceActorRoles: ["world"],
          targetActorRoles: ["player"],
          sourceEntityRoles: ["pickup"],
        },
      },
    ],
    outputPorts: [
      {
        id: "collected",
        payloadType: "pickup-collected-v1",
        delivery: "event",
      },
    ],
    runtimeLeases: { startLeases: 1, instanceLeases: 1, graphLeases: 0 },
    entityMutationAccess: [
      {
        accessId: "pickup.consume",
        inputPort: "sources",
        operations: ["consume"],
        transferRecipientActorRoles: [],
      },
    ],
    preparedEffectCommit: {
      commitServiceId: "pickup.commit",
      mutationChannelStateInputPort: "sources",
      admittedSourceOperation: "consume",
      effectPlanProfileId: "pickup.default",
      collectedOutputPort: "collected",
      applicationRouteSourceId: "applications",
      maximumApplicationsPerCommit: 2,
      maximumConcurrentCommits: 4,
      duplicateLedgerCapacity: 16,
    },
  });
  const transform = manifest("progression.pickup-plan-test", {
    pickupEffectPlanTransform: {
      profileId: "pickup.default",
      exportKind: "pickup-effect-plan-transform-v1",
      maximumApplicationsPerPlan: 2,
    },
  });
  const target = manifest("combat.health-modifier-test", {
    inputPorts: [
      {
        id: "modifier",
        payloadType: "modifier-application-v1",
        required: false,
        multiple: false,
        delivery: "event",
        authorization: {
          ownerRelation: "same-owner",
          sourceActorRoles: ["player"],
          targetActorRoles: ["player"],
          sourceEntityRoles: [],
        },
      },
    ],
    runtimeLeases: { startLeases: 1, instanceLeases: 0, graphLeases: 0 },
    modifierTargets: [
      {
        fieldId: "combat.health.current",
        inputPort: "modifier",
        operation: "add",
        minimum: 0,
        maximum: 100,
        reset: "dispose-new-graph",
      },
    ],
  });
  const registry = new GameModuleRegistry();
  for (const entry of [provider, collector, transform, target])
    registry.register(entry, z.strictObject({}));
  const assembly = {
    schemaVersion: "1.2.0",
    assemblyId: "test.effect-route-v13",
    kernelVersion: "1.0.0",
    engine: { id: "phaser", version: "3.90.0" },
    actors: [
      { actorId: "player-one", role: "player" },
      { actorId: "world-one", role: "world" },
    ],
    modules: [
      {
        instanceId: "provider",
        moduleId: provider.moduleId,
        versionRange: provider.version,
        ownerId: "world-one",
        configuration: {},
      },
      {
        instanceId: "collector",
        moduleId: collector.moduleId,
        versionRange: collector.version,
        ownerId: "player-one",
        configuration: {},
      },
      {
        instanceId: "planner",
        moduleId: transform.moduleId,
        versionRange: transform.version,
        ownerId: "player-one",
        configuration: {},
      },
      {
        instanceId: "health",
        moduleId: target.moduleId,
        versionRange: target.version,
        ownerId: "player-one",
        configuration: {},
      },
    ],
    bindings: [
      {
        from: { instanceId: "provider", portId: "pickups" },
        to: { instanceId: "collector", portId: "sources" },
      },
    ],
    assetRoles: [],
    assetBindings: [],
    contactPolicySelections: [],
    damageSinkRoutes: [],
    entityMutationGrantSelections: [
      {
        granteeInstanceId: "collector",
        accessId: "pickup.consume",
        transferRecipientActorIds: [],
      },
    ],
    effectApplicationBindings: [
      {
        bindingId: "health-route",
        from: {
          instanceId: "collector",
          applicationRouteSourceId: "applications",
        },
        to: { instanceId: "health", portId: "modifier" },
        fieldId: "combat.health.current",
        operation: "add",
      },
    ],
    pickupEffectPlanSelections: [
      {
        commitInstanceId: "collector",
        transformInstanceId: "planner",
        profileId: "pickup.default",
      },
    ],
    globalBudget: {
      activeEntities: 4,
      activeProjectiles: 0,
      spawnsPerSecond: 0,
      timers: 0,
    },
  };
  return { registry, assembly };
}

describe("ADR 0027 effect route resolution", () => {
  it("binds one addressed target and the exact pickup mutation lineage", () => {
    const { registry, assembly } = fixture();
    const graph = resolveGameAssemblyV13(assembly, registry).graph;
    expect(graph.effectApplicationRoutes).toEqual([
      expect.objectContaining({
        routeId: "collector.effect-route.health-route",
        sourceInstanceId: "collector",
        targetInstanceId: "health",
        targetInputPort: "modifier",
        fieldId: "combat.health.current",
      }),
    ]);
    expect(graph.pickupEffectPlans).toEqual([
      expect.objectContaining({
        commitInstanceId: "collector",
        transformInstanceId: "planner",
        mutationChannelId: "provider.pickups",
        mutationGrantId: "collector.pickup.consume",
        routeIds: ["collector.effect-route.health-route"],
      }),
    ]);
  });

  it("rejects an effect binding whose field does not match the exact receiver", () => {
    const { registry, assembly } = fixture();
    const broken = structuredClone(assembly);
    broken.effectApplicationBindings[0]!.fieldId = "combat.shield.current";
    expect(() => resolveGameAssemblyV13(broken, registry)).toThrow(
      ModuleResolutionError,
    );
    try {
      resolveGameAssemblyV13(broken, registry);
    } catch (error) {
      expect((error as ModuleResolutionError).code).toBe(
        ModuleResolutionErrorCode.invalidEffectApplicationRoute,
      );
    }
  });

  it("rejects a pickup plan whose mutation grant no longer follows its bound source", () => {
    const { registry, assembly } = fixture();
    const broken = structuredClone(assembly);
    broken.entityMutationGrantSelections = [];
    expect(() => resolveGameAssemblyV13(broken, registry)).toThrow(
      ModuleResolutionError,
    );
  });
});
