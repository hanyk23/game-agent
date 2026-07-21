import { z } from "zod";

import { describe, expect, it } from "vitest";

import { BATCH1_MODULE_DEFINITIONS } from "../../src/modules/batch1-gameplay-library.js";
import { GameModuleManifestV13Schema } from "../../src/modules/game-module-contract.js";
import { GameModuleRegistry } from "../../src/modules/game-module-registry.js";
import {
  ModuleResolutionError,
  ModuleResolutionErrorCode,
  ResolvedModuleGraphV13Schema,
  resolveGameAssemblyV13,
} from "../../src/modules/game-module-resolver.js";
import { canonicalJsonBytes } from "../../src/modules/game-module-execution-contract.js";

const sameOwner = {
  ownerRelation: "same-owner",
  sourceActorRoles: ["player"],
  targetActorRoles: ["player"],
  sourceEntityRoles: [],
};

function manifest(
  moduleId: string,
  kind: "targeting" | "attack-trigger" | "attack-delivery",
  overrides: Record<string, unknown>,
) {
  return GameModuleManifestV13Schema.parse({
    ...structuredClone(BATCH1_MODULE_DEFINITIONS[0]!.manifest),
    schemaVersion: "1.3.0",
    moduleId,
    kind,
    implementationId: `${moduleId}.v1`,
    configurationSchemaId: `${moduleId}.config`,
    provides: [],
    requires: [],
    inputPorts: [],
    outputPorts: [],
    dependencies: [],
    assetRequirements: [],
    conflicts: [],
    exclusiveOwnership: [],
    resources: {
      activeEntities: 0,
      activeProjectiles: 0,
      spawnsPerSecond: 0,
      timers: 0,
    },
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
  const targeting = manifest("targeting.test-directional", "targeting", {
    outputPorts: [
      {
        id: "selection",
        payloadType: "target-solution-v1",
        delivery: "state",
      },
    ],
    runtimeLeases: { startLeases: 0, instanceLeases: 1, graphLeases: 0 },
    attackChannel: {
      role: "targeting",
      configurationField: "attackChannelId",
      targetOutputPort: "selection",
      targetPayloadType: "target-solution-v1",
    },
  });
  const trigger = manifest("trigger.test-active", "attack-trigger", {
    outputPorts: [
      {
        id: "request",
        payloadType: "attack-request-v2",
        delivery: "event",
      },
    ],
    attackChannel: {
      role: "trigger",
      configurationField: "attackChannelId",
      requestOutputPort: "request",
      requestPayloadType: "attack-request-v2",
    },
  });
  const delivery = manifest("delivery.test-projectile", "attack-delivery", {
    inputPorts: [
      {
        id: "target",
        payloadType: "target-solution-v1",
        required: true,
        multiple: false,
        delivery: "state",
        authorization: sameOwner,
      },
      {
        id: "request",
        payloadType: "attack-request-v2",
        required: true,
        multiple: false,
        delivery: "event",
        authorization: sameOwner,
      },
    ],
    runtimeLeases: { startLeases: 2, instanceLeases: 0, graphLeases: 0 },
    attackChannel: {
      role: "delivery",
      configurationField: "attackChannelId",
      targetInputPort: "target",
      targetPayloadType: "target-solution-v1",
      requestInputPort: "request",
      requestPayloadType: "attack-request-v2",
    },
  });
  const registry = new GameModuleRegistry();
  const configuration = z.strictObject({
    attackChannelId: z.literal("primary"),
  });
  registry.register(targeting, configuration);
  registry.register(trigger, configuration);
  registry.register(delivery, configuration);
  const assembly = {
    schemaVersion: "1.2.0",
    assemblyId: "test.graph-v13",
    kernelVersion: "1.0.0",
    engine: { id: "phaser", version: "3.90.0" },
    actors: [{ actorId: "player-one", role: "player" }],
    modules: [
      {
        instanceId: "targeting",
        moduleId: targeting.moduleId,
        versionRange: targeting.version,
        ownerId: "player-one",
        configuration: { attackChannelId: "primary" },
      },
      {
        instanceId: "trigger",
        moduleId: trigger.moduleId,
        versionRange: trigger.version,
        ownerId: "player-one",
        configuration: { attackChannelId: "primary" },
      },
      {
        instanceId: "delivery",
        moduleId: delivery.moduleId,
        versionRange: delivery.version,
        ownerId: "player-one",
        configuration: { attackChannelId: "primary" },
      },
    ],
    bindings: [
      {
        from: { instanceId: "targeting", portId: "selection" },
        to: { instanceId: "delivery", portId: "target" },
      },
      {
        from: { instanceId: "trigger", portId: "request" },
        to: { instanceId: "delivery", portId: "request" },
      },
    ],
    assetRoles: [],
    assetBindings: [],
    effectApplicationBindings: [],
    pickupEffectPlanSelections: [],
    globalBudget: {
      activeEntities: 0,
      activeProjectiles: 0,
      spawnsPerSecond: 0,
      timers: 0,
    },
  };
  return { registry, assembly };
}

describe("Graph 1.3 resolver", () => {
  it("materializes one channel triple and keeps its exact bindings", () => {
    const { registry, assembly } = fixture();
    const result = resolveGameAssemblyV13(assembly, registry);
    expect(result.graph.graphVersion).toBe("1.3.0");
    expect(result.graph.attackChannels).toHaveLength(1);
    expect(result.graph.attackChannels[0]).toMatchObject({
      ownerActorId: "player-one",
      attackChannelId: "primary",
      targetingInstanceId: "targeting",
      triggerInstanceId: "trigger",
      deliveryInstanceId: "delivery",
    });
    expect(result.graph.executionReadiness.status).toBe("blocked");
    expect(result.readinessReport.graphEvidenceId).toBe(
      "8d4404b1e025bf4c2c25014348c0b1a1d4202f8e7236cc5346ab91edeb26ee78",
    );
    expect(ResolvedModuleGraphV13Schema.parse(result.graph)).toEqual(
      result.graph,
    );
    expect(canonicalJsonBytes(result.graph)).toEqual(
      canonicalJsonBytes(ResolvedModuleGraphV13Schema.parse(result.graph)),
    );
  });

  it("rejects unknown Graph 1.3 and nested module fields", () => {
    const { registry, assembly } = fixture();
    const graph = resolveGameAssemblyV13(assembly, registry).graph;
    expect(() =>
      ResolvedModuleGraphV13Schema.parse({ ...graph, unexpected: true }),
    ).toThrow();
    expect(() =>
      ResolvedModuleGraphV13Schema.parse({
        ...graph,
        modules: [
          { ...graph.modules[0]!, unexpected: true },
          ...graph.modules.slice(1),
        ],
      }),
    ).toThrow();
  });

  it("rejects a channel whose trigger does not bind the resolved delivery", () => {
    const { registry, assembly } = fixture();
    const broken = structuredClone(assembly);
    broken.bindings.pop();
    expect(() => resolveGameAssemblyV13(broken, registry)).toThrow(
      ModuleResolutionError,
    );
    try {
      resolveGameAssemblyV13(broken, registry);
    } catch (error) {
      expect((error as ModuleResolutionError).code).toBe(
        ModuleResolutionErrorCode.missingRequiredPort,
      );
    }
  });

  it("records the exact context version for mixed Manifest 1.2/1.3 graphs", () => {
    const { registry, assembly } = fixture();
    const legacy = BATCH1_MODULE_DEFINITIONS[0]!;
    registry.register(legacy.manifest, legacy.configurationSchema);
    const mixedAssembly = {
      ...assembly,
      modules: [
        ...assembly.modules,
        {
          instanceId: "legacy-input",
          moduleId: legacy.manifest.moduleId,
          versionRange: legacy.manifest.version,
          ownerId: "player-one",
          configuration: {
            bindings: "arrows-and-wasd",
            normalizeDiagonal: true,
            emitNeutral: true,
          },
        },
      ],
    };
    const result = resolveGameAssemblyV13(mixedAssembly, registry);
    expect(
      result.graph.modules.find(
        (module) => module.instanceId === "legacy-input",
      ),
    ).toMatchObject({
      manifestSchemaVersion: "1.2.0",
      factoryContextVersion: "1.2.0",
    });
    expect(
      result.graph.modules.find((module) => module.instanceId === "targeting"),
    ).toMatchObject({
      manifestSchemaVersion: "1.3.0",
      factoryContextVersion: "1.3.0",
    });
  });
});
