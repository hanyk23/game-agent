import { describe, expect, it } from "vitest";

import { BATCH1_MODULE_DEFINITIONS } from "../../src/modules/batch1-gameplay-library.js";
import { BATCH1_VERTICAL_SLICE_ASSEMBLY } from "../../src/modules/batch1-vertical-slice.js";
import {
  GameAssemblySpecV12Schema,
  GameAssemblySpecV13Schema,
  GameModuleManifestV13Schema,
  GameModuleManifestV14Schema,
} from "../../src/modules/game-module-contract.js";

function v14Manifest(overrides: Record<string, unknown> = {}) {
  return {
    ...structuredClone(BATCH1_MODULE_DEFINITIONS[0]!.manifest),
    schemaVersion: "1.4.0",
    actorSnapshotReads: [],
    entityChannelReads: [],
    projectileChannelConsumer: null,
    attackChannel: null,
    preparedEffectCommit: null,
    modifierTargets: [],
    pickupEffectPlanTransform: null,
    actorRootProducer: null,
    actorRootConsumers: [],
    hostileAttackChannel: null,
    aggregateResourceClaims: [],
    actorSetDamageSink: null,
    actorRootContactConsumer: null,
    outcomeCommit: null,
    ...overrides,
  };
}

function v13Assembly(overrides: Record<string, unknown> = {}) {
  return {
    ...structuredClone(BATCH1_VERTICAL_SLICE_ASSEMBLY),
    schemaVersion: "1.3.0",
    effectApplicationBindings: [],
    pickupEffectPlanSelections: [],
    actorRootBindings: [],
    hostileAggregateBudgetGroups: [],
    actorSetDamageRoutes: [],
    actorRootMutationGrantSelections: [],
    outcomeCoordinatorSelection: null,
    ...overrides,
  };
}

describe("ADR 0028 strict contracts", () => {
  it("keeps Manifest 1.4 and Assembly 1.3 behind explicit versioned parsers", () => {
    const manifest = v14Manifest();
    const assembly = v13Assembly();

    expect(GameModuleManifestV14Schema.parse(manifest)).toEqual(manifest);
    expect(GameAssemblySpecV13Schema.parse(assembly)).toEqual(assembly);
    expect(() => GameModuleManifestV13Schema.parse(manifest)).toThrow();
    expect(() => GameAssemblySpecV12Schema.parse(assembly)).toThrow();
    expect(() =>
      GameModuleManifestV14Schema.parse({
        ...manifest,
        rawActorDirectory: true,
      }),
    ).toThrow();
    expect(() =>
      GameAssemblySpecV13Schema.parse({ ...assembly, command: "unsafe" }),
    ).toThrow();
  });

  it("admits only exact host-owned actor-root ports and rejects supplied identities", () => {
    const manifest = v14Manifest({
      moduleId: "encounter.test-roots",
      implementationId: "encounter.test-roots.v1",
      configurationSchemaId: "encounter.test-roots.config",
      kind: "encounter-flow",
      inputPorts: [],
      outputPorts: [
        {
          id: "roots",
          payloadType: "actor-root-channel-v1",
          delivery: "state",
        },
        {
          id: "lifecycle",
          payloadType: "actor-root-lifecycle-v1",
          delivery: "event",
        },
      ],
      runtimeContract: {
        update: null,
        timerSlots: { slotGroupId: "main" },
        inputRegistrations: [],
        observationReaders: [],
        contactCommit: null,
      },
      runtimeLeases: { startLeases: 0, instanceLeases: 1, graphLeases: 0 },
      actorRootProducer: {
        producerId: "enemy.roots",
        rootChannelOutputPort: "roots",
        lifecycleOutputPort: "lifecycle",
        actorRole: "enemy",
        capacityConfigurationField: "maximumEnemies",
        sourceIdsConfigurationField: "sourceIds",
        poolId: "enemy.pool",
        assetRoleMappingConfigurationField: "assetRoleBySource",
        movementMode: "scrolling-wave-v1",
      },
    });

    expect(GameModuleManifestV14Schema.parse(manifest)).toEqual(manifest);
    expect(() =>
      GameModuleManifestV14Schema.parse({
        ...manifest,
        actorRootProducer: {
          ...(manifest.actorRootProducer as unknown as Record<string, unknown>),
          actorId: "enemy-1",
        },
      }),
    ).toThrow();
    expect(() =>
      GameModuleManifestV14Schema.parse({
        ...manifest,
        actorRootProducer: {
          ...(manifest.actorRootProducer as unknown as Record<string, unknown>),
          rootChannelOutputPort: "missing",
        },
      }),
    ).toThrow(/actor-root producer ports/);
  });

  it("requires exact V3 hostile-source ports and rejects V2 mixing", () => {
    const manifest = v14Manifest({
      moduleId: "trigger.hostile-test",
      implementationId: "trigger.hostile-test.v1",
      configurationSchemaId: "trigger.hostile-test.config",
      kind: "attack-trigger",
      inputPorts: [
        {
          id: "roots",
          payloadType: "actor-root-channel-v1",
          required: true,
          multiple: false,
          delivery: "state",
          authorization: {
            ownerRelation: "same-owner",
            sourceActorRoles: ["world"],
            targetActorRoles: ["enemy"],
            sourceEntityRoles: [],
          },
        },
        {
          id: "lifecycle",
          payloadType: "actor-root-lifecycle-v1",
          required: true,
          multiple: false,
          delivery: "event",
          authorization: {
            ownerRelation: "same-owner",
            sourceActorRoles: ["world"],
            targetActorRoles: ["enemy"],
            sourceEntityRoles: [],
          },
        },
      ],
      outputPorts: [
        {
          id: "requests",
          payloadType: "attack-request-v3",
          delivery: "event",
        },
      ],
      runtimeContract: {
        update: null,
        timerSlots: { slotGroupId: "main" },
        inputRegistrations: [],
        observationReaders: [],
        contactCommit: null,
      },
      runtimeLeases: { startLeases: 2, instanceLeases: 0, graphLeases: 0 },
      hostileAttackChannel: {
        role: "source",
        configurationField: "attackChannelId",
        rootChannelInputPort: "roots",
        lifecycleInputPort: "lifecycle",
        requestOutputPort: "requests",
        requestPayloadType: "attack-request-v3",
      },
    });

    expect(GameModuleManifestV14Schema.parse(manifest)).toEqual(manifest);
    expect(() =>
      GameModuleManifestV14Schema.parse({
        ...manifest,
        hostileAttackChannel: {
          ...(manifest.hostileAttackChannel as unknown as Record<
            string,
            unknown
          >),
          requestPayloadType: "attack-request-v2",
        },
      }),
    ).toThrow();
  });

  it("rejects duplicate or unknown hostile contention membership in Assembly 1.3", () => {
    const instanceIds = BATCH1_VERTICAL_SLICE_ASSEMBLY.modules.map(
      (module) => module.instanceId,
    );
    const member = instanceIds[0]!;
    const group = {
      groupId: "hostile.shared",
      kind: "hostile-contention-v1",
      memberInstanceIds: [member],
      activeEntityCapacity: 16,
      activeProjectileCapacity: 16,
      spawnsPerSecondCapacity: 64,
      ordering: "resolved-provider-order",
    } as const;
    const assembly = v13Assembly({
      hostileAggregateBudgetGroups: [group],
    });
    expect(GameAssemblySpecV13Schema.parse(assembly)).toEqual(assembly);
    expect(() =>
      GameAssemblySpecV13Schema.parse({
        ...assembly,
        hostileAggregateBudgetGroups: [
          group,
          { ...group, groupId: "hostile.second" },
        ],
      }),
    ).toThrow(/membership/);
    expect(() =>
      GameAssemblySpecV13Schema.parse({
        ...assembly,
        hostileAggregateBudgetGroups: [
          { ...group, memberInstanceIds: ["missing-instance"] },
        ],
      }),
    ).toThrow(/membership/);
  });
});
