import { describe, expect, it } from "vitest";

import {
  resolveBatch3AuthorityPlanV14,
  type Batch3ManifestSelectionV14,
  type Batch3ScoreAwardBoundV14,
} from "../../src/modules/game-module-authority-resolver-v14.js";
import { BATCH1_MODULE_DEFINITIONS } from "../../src/modules/batch1-gameplay-library.js";
import { BATCH2_DEFENSE_DEFINITIONS } from "../../src/modules/batch2-defense-library.js";
import { BATCH1_VERTICAL_SLICE_ASSEMBLY } from "../../src/modules/batch1-vertical-slice.js";
import {
  GameAssemblySpecV13Schema,
  GameModuleManifestV14Schema,
  type GameAssemblySpecV13,
} from "../../src/modules/game-module-contract.js";
import type { ResolvedScoreCapacityBasisV14 } from "../../src/modules/game-module-resolver-v14.js";

function asV14(
  base: (typeof BATCH1_MODULE_DEFINITIONS)[number]["manifest"],
  overrides: Record<string, unknown>,
) {
  return GameModuleManifestV14Schema.parse({
    ...structuredClone(base),
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
  });
}

function fixture(): {
  assembly: GameAssemblySpecV13;
  manifests: Batch3ManifestSelectionV14[];
  scoreCapacityBasis: ResolvedScoreCapacityBasisV14;
  scoreAwardBounds: Batch3ScoreAwardBoundV14[];
} {
  const neutral = BATCH1_MODULE_DEFINITIONS.find(
    (entry) => entry.manifest.kind === "player-intent",
  )!.manifest;
  const triggerBase = BATCH1_MODULE_DEFINITIONS.find(
    (entry) => entry.manifest.kind === "attack-trigger",
  )!.manifest;
  const targetingBase = BATCH1_MODULE_DEFINITIONS.find(
    (entry) => entry.manifest.kind === "targeting",
  )!.manifest;
  const deliveryBase = BATCH1_MODULE_DEFINITIONS.find(
    (entry) => entry.manifest.kind === "attack-delivery",
  )!.manifest;
  const authorization = {
    ownerRelation: "same-owner",
    sourceActorRoles: ["enemy"],
    targetActorRoles: ["enemy"],
    sourceEntityRoles: [],
  } as const;

  const producer = asV14(neutral, {
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
    resources: {
      activeEntities: 8,
      activeProjectiles: 0,
      spawnsPerSecond: 8,
      timers: 0,
    },
    runtimeContract: {
      update: null,
      timerSlots: { slotGroupId: "main" },
      inputRegistrations: [],
      observationReaders: [],
      contactCommit: null,
    },
    runtimeLeases: { startLeases: 10, instanceLeases: 10, graphLeases: 0 },
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
  const source = asV14(triggerBase, {
    moduleId: "trigger.hostile-test",
    implementationId: "trigger.hostile-test.v1",
    configurationSchemaId: "trigger.hostile-test.config",
    inputPorts: [
      {
        id: "roots",
        payloadType: "actor-root-channel-v1",
        required: true,
        multiple: false,
        delivery: "state",
        authorization,
      },
      {
        id: "lifecycle",
        payloadType: "actor-root-lifecycle-v1",
        required: true,
        multiple: false,
        delivery: "event",
        authorization,
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
    runtimeLeases: { startLeases: 10, instanceLeases: 10, graphLeases: 0 },
    actorRootConsumers: [
      {
        consumerId: "enemy.pattern-source",
        rootChannelInputPort: "roots",
        expectedActorRole: "enemy",
        purpose: "pattern-source",
        maximumEntries: 8,
      },
    ],
    hostileAttackChannel: {
      role: "source",
      configurationField: "attackChannelId",
      rootChannelInputPort: "roots",
      lifecycleInputPort: "lifecycle",
      requestOutputPort: "requests",
      requestPayloadType: "attack-request-v3",
    },
  });
  const targeting = asV14(targetingBase, {
    moduleId: "targeting.hostile-test",
    implementationId: "targeting.hostile-test.v1",
    configurationSchemaId: "targeting.hostile-test.config",
    inputPorts: [
      {
        id: "requests",
        payloadType: "attack-request-v3",
        required: true,
        multiple: false,
        delivery: "event",
        authorization,
      },
    ],
    outputPorts: [
      {
        id: "targeted",
        payloadType: "targeted-attack-v1",
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
    runtimeLeases: { startLeases: 10, instanceLeases: 10, graphLeases: 0 },
    hostileAttackChannel: {
      role: "targeting",
      configurationField: "attackChannelId",
      requestInputPort: "requests",
      targetedOutputPort: "targeted",
      requestPayloadType: "attack-request-v3",
      targetedPayloadType: "targeted-attack-v1",
    },
  });
  const delivery = asV14(deliveryBase, {
    moduleId: "delivery.hostile-test",
    implementationId: "delivery.hostile-test.v1",
    configurationSchemaId: "delivery.hostile-test.config",
    inputPorts: [
      {
        id: "targeted",
        payloadType: "targeted-attack-v1",
        required: true,
        multiple: false,
        delivery: "event",
        authorization,
      },
    ],
    outputPorts: [
      {
        id: "projectiles",
        payloadType: "entity-channel-v1",
        delivery: "state",
        entityRole: "projectile",
      },
      {
        id: "emission",
        payloadType: "emission-v2",
        delivery: "event",
      },
    ],
    assetRequirements: [
      {
        roleId: "enemy-projectile",
        category: "projectile",
        cardinality: "exactly-one",
        sharing: "instance",
      },
    ],
    runtimeLeases: { startLeases: 10, instanceLeases: 10, graphLeases: 0 },
    hostileAttackChannel: {
      role: "delivery",
      configurationField: "attackChannelId",
      targetedInputPort: "targeted",
      projectileChannelOutputPort: "projectiles",
      emissionOutputPort: "emission",
      targetedPayloadType: "targeted-attack-v1",
      emissionPayloadType: "emission-v2",
      requiredAssetRole: "enemy-projectile",
    },
    aggregateResourceClaims: [
      {
        claimId: "hostile.projectiles.claim",
        contentionKind: "hostile-contention-v1",
        ownedProjectileChannelId: "projectiles",
        resources: ["activeEntities", "activeProjectiles", "spawnsPerSecond"],
        capacitySource: "resolved-resource-grant",
      },
    ],
  });
  const health = asV14(neutral, {
    moduleId: "combat.actor-set-health-test",
    implementationId: "combat.actor-set-health-test.v1",
    configurationSchemaId: "combat.actor-set-health-test.config",
    kind: "combat-interaction",
    inputPorts: [
      {
        id: "roots",
        payloadType: "actor-root-channel-v1",
        required: true,
        multiple: false,
        delivery: "state",
        authorization,
      },
      {
        id: "damage",
        payloadType: "damage-v2",
        required: true,
        multiple: true,
        delivery: "event",
        authorization,
      },
    ],
    outputPorts: [
      {
        id: "health",
        payloadType: "health-state-v3",
        delivery: "state",
      },
      {
        id: "defeated",
        payloadType: "actor-defeated-v1",
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
    runtimeLeases: { startLeases: 10, instanceLeases: 10, graphLeases: 0 },
    actorRootConsumers: [
      {
        consumerId: "enemy.health-bank",
        rootChannelInputPort: "roots",
        expectedActorRole: "enemy",
        purpose: "health-bank",
        maximumEntries: 8,
      },
    ],
    actorSetDamageSink: {
      rootChannelInputPort: "roots",
      damageInputPort: "damage",
      healthStateOutputPort: "health",
      defeatedOutputPort: "defeated",
      maximumEntriesSource: "resolved-root-channel-capacity",
    },
  });
  const rootContact = asV14(neutral, {
    moduleId: "interaction.actor-root-contact-test",
    implementationId: "interaction.actor-root-contact-test.v1",
    configurationSchemaId: "interaction.actor-root-contact-test.config",
    kind: "combat-interaction",
    inputPorts: [
      {
        id: "roots",
        payloadType: "actor-root-channel-v1",
        required: true,
        multiple: false,
        delivery: "state",
        authorization,
      },
    ],
    outputPorts: [
      {
        id: "candidates",
        payloadType: "contact-candidate-v2",
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
    runtimeLeases: { startLeases: 10, instanceLeases: 10, graphLeases: 0 },
    actorRootConsumers: [
      {
        consumerId: "enemy.body-contact",
        rootChannelInputPort: "roots",
        expectedActorRole: "enemy",
        purpose: "body-contact",
        maximumEntries: 8,
      },
    ],
    actorRootContactConsumer: {
      rootChannelInputPort: "roots",
      candidateOutputPort: "candidates",
      admittedSourceOperation: "deactivate-root",
    },
  });
  const scoreSource = asV14(neutral, {
    moduleId: "scoring.source-test",
    implementationId: "scoring.source-test.v1",
    configurationSchemaId: "scoring.source-test.config",
    kind: "scoring",
    inputPorts: [],
    outputPorts: [
      {
        id: "transactions",
        payloadType: "score-transaction-v1",
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
    runtimeLeases: { startLeases: 10, instanceLeases: 10, graphLeases: 0 },
  });
  const scoreLedger = asV14(neutral, {
    moduleId: "scoring.ledger",
    implementationId: "scoring.ledger.v1",
    configurationSchemaId: "scoring.ledger.config",
    kind: "scoring",
    inputPorts: [
      {
        id: "transactions",
        payloadType: "score-transaction-v1",
        required: true,
        multiple: true,
        delivery: "event",
        authorization,
      },
    ],
    outputPorts: [
      { id: "score", payloadType: "score-state-v1", delivery: "state" },
    ],
    runtimeContract: {
      update: null,
      timerSlots: { slotGroupId: "main" },
      inputRegistrations: [],
      observationReaders: [],
      contactCommit: null,
    },
    runtimeLeases: { startLeases: 10, instanceLeases: 10, graphLeases: 0 },
  });
  const condition = (id: "win" | "loss") =>
    asV14(neutral, {
      moduleId: `outcome.${id}-test`,
      implementationId: `outcome.${id}-test.v1`,
      configurationSchemaId: `outcome.${id}-test.config`,
      kind: "outcome",
      inputPorts: [],
      outputPorts: [
        {
          id: "condition",
          payloadType: "outcome-condition-v1",
          delivery: "state",
        },
      ],
      runtimeContract: {
        update: null,
        timerSlots: { slotGroupId: "main" },
        inputRegistrations: [],
        observationReaders: [],
        contactCommit: null,
      },
      runtimeLeases: { startLeases: 10, instanceLeases: 10, graphLeases: 0 },
    });
  const win = condition("win");
  const loss = condition("loss");
  const coordinator = asV14(neutral, {
    moduleId: "outcome.coordinator",
    implementationId: "outcome.coordinator.v1",
    configurationSchemaId: "outcome.coordinator.config",
    kind: "outcome",
    inputPorts: [
      {
        id: "win",
        payloadType: "outcome-condition-v1",
        required: true,
        multiple: false,
        delivery: "state",
        authorization,
      },
      {
        id: "loss",
        payloadType: "outcome-condition-v1",
        required: true,
        multiple: false,
        delivery: "state",
        authorization,
      },
    ],
    outputPorts: [],
    runtimeContract: {
      update: null,
      timerSlots: { slotGroupId: "main" },
      inputRegistrations: [],
      observationReaders: [],
      contactCommit: null,
    },
    runtimeLeases: { startLeases: 10, instanceLeases: 10, graphLeases: 0 },
    outcomeCommit: {
      commitServiceId: "outcome.commit",
      arbitrationPhase: "post-provider-post-event-frame-v1",
      winConditionStateInputPort: "win",
      lossConditionStateInputPort: "loss",
      coordinatorIdentity: "resolved-instance",
    },
  });

  const moduleRequests = [
    {
      instanceId: "enemy-roots",
      moduleId: producer.moduleId,
      versionRange: producer.version,
      ownerId: "enemy-one",
      configuration: {
        maximumEnemies: 8,
        sourceIds: ["scout"],
        assetRoleBySource: { scout: "enemy" },
      },
    },
    {
      instanceId: "hostile-source",
      moduleId: source.moduleId,
      versionRange: source.version,
      ownerId: "enemy-one",
      configuration: { attackChannelId: "enemy.primary" },
    },
    {
      instanceId: "hostile-targeting",
      moduleId: targeting.moduleId,
      versionRange: targeting.version,
      ownerId: "enemy-one",
      configuration: { attackChannelId: "enemy.primary" },
    },
    {
      instanceId: "hostile-delivery",
      moduleId: delivery.moduleId,
      versionRange: delivery.version,
      ownerId: "enemy-one",
      configuration: { attackChannelId: "enemy.primary" },
    },
    ...[
      ["root-health", health],
      ["root-contact", rootContact],
      ["score-source", scoreSource],
      ["score-ledger", scoreLedger],
      ["win-condition", win],
      ["loss-condition", loss],
      ["outcome-coordinator", coordinator],
    ].map(([instanceId, manifest]) => ({
      instanceId: instanceId as string,
      moduleId: (manifest as typeof health).moduleId,
      versionRange: (manifest as typeof health).version,
      ownerId: "enemy-one",
      configuration: {},
    })),
  ];
  const assembly = GameAssemblySpecV13Schema.parse({
    ...structuredClone(BATCH1_VERTICAL_SLICE_ASSEMBLY),
    schemaVersion: "1.3.0",
    modules: [
      ...structuredClone(BATCH1_VERTICAL_SLICE_ASSEMBLY.modules),
      ...moduleRequests,
    ],
    bindings: [
      ...structuredClone(BATCH1_VERTICAL_SLICE_ASSEMBLY.bindings),
      {
        from: { instanceId: "enemy-roots", portId: "roots" },
        to: { instanceId: "hostile-source", portId: "roots" },
      },
      {
        from: { instanceId: "enemy-roots", portId: "lifecycle" },
        to: { instanceId: "hostile-source", portId: "lifecycle" },
      },
      {
        from: { instanceId: "hostile-source", portId: "requests" },
        to: { instanceId: "hostile-targeting", portId: "requests" },
      },
      {
        from: { instanceId: "hostile-targeting", portId: "targeted" },
        to: { instanceId: "hostile-delivery", portId: "targeted" },
      },
      {
        from: { instanceId: "enemy-roots", portId: "roots" },
        to: { instanceId: "root-health", portId: "roots" },
      },
      {
        from: { instanceId: "enemy-roots", portId: "roots" },
        to: { instanceId: "root-contact", portId: "roots" },
      },
      {
        from: { instanceId: "score-source", portId: "transactions" },
        to: { instanceId: "score-ledger", portId: "transactions" },
      },
      {
        from: { instanceId: "win-condition", portId: "condition" },
        to: { instanceId: "outcome-coordinator", portId: "win" },
      },
      {
        from: { instanceId: "loss-condition", portId: "condition" },
        to: { instanceId: "outcome-coordinator", portId: "loss" },
      },
    ],
    effectApplicationBindings: [],
    pickupEffectPlanSelections: [],
    actorRootBindings: [
      {
        bindingId: "enemy.pattern-source",
        producerInstanceId: "enemy-roots",
        producerOutputPort: "roots",
        consumerInstanceId: "hostile-source",
        consumerInputPort: "roots",
        expectedActorRole: "enemy",
        purpose: "pattern-source",
        maximumEntries: 8,
      },
      {
        bindingId: "enemy.health-bank",
        producerInstanceId: "enemy-roots",
        producerOutputPort: "roots",
        consumerInstanceId: "root-health",
        consumerInputPort: "roots",
        expectedActorRole: "enemy",
        purpose: "health-bank",
        maximumEntries: 8,
      },
      {
        bindingId: "enemy.body-contact",
        producerInstanceId: "enemy-roots",
        producerOutputPort: "roots",
        consumerInstanceId: "root-contact",
        consumerInputPort: "roots",
        expectedActorRole: "enemy",
        purpose: "body-contact",
        maximumEntries: 8,
      },
    ],
    hostileAggregateBudgetGroups: [
      {
        groupId: "hostile.shared",
        kind: "hostile-contention-v1",
        memberInstanceIds: ["hostile-delivery"],
        activeEntityCapacity: 256,
        activeProjectileCapacity: 256,
        spawnsPerSecondCapacity: 20,
        ordering: "resolved-provider-order",
      },
    ],
    actorSetDamageRoutes: [
      {
        routeId: "enemy.damage",
        rootBindingId: "enemy.health-bank",
        orderedSinkInstanceIds: ["root-health"],
      },
    ],
    actorRootMutationGrantSelections: [
      {
        selectionId: "enemy.body-contact.deactivate",
        rootBindingId: "enemy.body-contact",
        consumerInstanceId: "root-contact",
        producerInstanceId: "enemy-roots",
        operation: "deactivate-root",
      },
    ],
    outcomeCoordinatorSelection: {
      coordinatorInstanceId: "outcome-coordinator",
      winConditionInstanceId: "win-condition",
      lossConditionInstanceId: "loss-condition",
      arbitrationPhase: "post-provider-post-event-frame-v1",
    },
  });
  return {
    assembly,
    manifests: [
      { instanceId: "enemy-roots", manifest: producer },
      { instanceId: "hostile-source", manifest: source },
      { instanceId: "hostile-targeting", manifest: targeting },
      { instanceId: "hostile-delivery", manifest: delivery },
      { instanceId: "root-health", manifest: health },
      { instanceId: "root-contact", manifest: rootContact },
      { instanceId: "score-source", manifest: scoreSource },
      { instanceId: "score-ledger", manifest: scoreLedger },
      { instanceId: "win-condition", manifest: win },
      { instanceId: "loss-condition", manifest: loss },
      { instanceId: "outcome-coordinator", manifest: coordinator },
    ],
    scoreCapacityBasis: {
      profile: "resolved-score-capacity-basis-v1",
      maximumWaveBossDefeats: 8,
      waveBossEvidenceId: "a".repeat(64),
      maximumGrazeProjectileGenerations: 256,
      grazeGenerationEvidenceId: "b".repeat(64),
      maximumScheduledPickups: 4,
      pickupScheduleEvidenceId: "c".repeat(64),
    },
    scoreAwardBounds: [
      {
        sourceInstanceId: "score-source",
        sourcePortId: "transactions",
        ledgerInstanceId: "score-ledger",
        ledgerPortId: "transactions",
        maximumAward: 7.5,
        evidenceId: "d".repeat(64),
      },
    ],
  };
}

describe("ADR 0028 pure authority resolver", () => {
  it("retains a frozen V1.3 participant without granting it V1.4 authority", () => {
    const input = fixture();
    const graze = BATCH2_DEFENSE_DEFINITIONS.find(
      (definition) => definition.manifest.moduleId === "combat.graze",
    )!.manifest;
    const assembly = GameAssemblySpecV13Schema.parse({
      ...input.assembly,
      modules: [
        ...input.assembly.modules,
        {
          instanceId: "frozen-graze",
          ownerId: "enemy-one",
          moduleId: graze.moduleId,
          versionRange: graze.version,
          configuration: {
            playerRadius: 8,
            bulletRadius: 4,
            margin: 18,
            ledgerCeiling: 16,
          },
        },
      ],
    });
    const result = resolveBatch3AuthorityPlanV14({
      ...input,
      assembly,
      manifests: [
        ...input.manifests,
        { instanceId: "frozen-graze", manifest: graze },
      ],
    });
    expect(result.readinessReport.status).toBe("ready");
    expect(result.plan.scoringAuthority?.sourceRoutes).toEqual([
      expect.objectContaining({ sourceInstanceId: "score-source" }),
    ]);
  });

  it("resolves deterministic root, V3 hostile, and host contention grants", () => {
    const input = fixture();
    const result = resolveBatch3AuthorityPlanV14(input);
    const reordered = resolveBatch3AuthorityPlanV14({
      ...input,
      manifests: input.manifests.slice().reverse(),
    });

    expect(result.readinessReport.status).toBe("ready");
    expect(result.readinessReport.blockers).toEqual([]);
    expect(result.plan.actorRootChannels).toHaveLength(1);
    expect(result.plan.hostileAttackChannels).toEqual([
      expect.objectContaining({
        attackChannelId: "enemy.primary",
        sourceInstanceId: "hostile-source",
        targetingInstanceId: "hostile-targeting",
        deliveryInstanceId: "hostile-delivery",
        requestPayloadType: "attack-request-v3",
        contentionGroupId: "hostile.shared",
      }),
    ]);
    expect(result.plan.actorSetDamageRoutes).toEqual([
      expect.objectContaining({
        routeId: "enemy.damage",
        orderedSinkInstanceIds: ["root-health"],
      }),
    ]);
    expect(result.plan.actorRootMutationGrants).toEqual([
      expect.objectContaining({
        consumerInstanceId: "root-contact",
        producerInstanceId: "enemy-roots",
        operation: "deactivate-root",
      }),
    ]);
    expect(result.plan.scoringAuthority).toEqual(
      expect.objectContaining({
        ledgerInstanceId: "score-ledger",
        duplicateCapacity: 268,
        awardProfile: "bounded-score-number-v1",
        sourceRoutes: [
          {
            sourceInstanceId: "score-source",
            sourcePortId: "transactions",
            ledgerPortId: "transactions",
            maximumAward: 7.5,
            evidenceId: "d".repeat(64),
          },
        ],
      }),
    );
    expect(result.plan.outcomeAuthority).toEqual({
      coordinatorInstanceId: "outcome-coordinator",
      winConditionInstanceId: "win-condition",
      lossConditionInstanceId: "loss-condition",
      winConditionStateInputPort: "win",
      lossConditionStateInputPort: "loss",
      arbitrationPhase: "post-provider-post-event-frame-v1",
      commitServiceId: "outcome.commit",
    });
    expect(reordered).toEqual(result);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.plan.actorRootChannels[0])).toBe(true);
  });

  it("fails closed on one-over root capacity with immutable stable blockers", () => {
    const input = fixture();
    const assembly = structuredClone(input.assembly);
    const rootRequest = assembly.modules.find(
      (entry) => entry.instanceId === "enemy-roots",
    )!;
    rootRequest.configuration = {
      ...(rootRequest.configuration as Record<string, unknown>),
      maximumEnemies: 9,
    };
    const result = resolveBatch3AuthorityPlanV14({
      assembly: GameAssemblySpecV13Schema.parse(assembly),
      manifests: input.manifests,
      scoreCapacityBasis: input.scoreCapacityBasis,
    });

    expect(result.readinessReport.status).toBe("blocked");
    expect(
      result.readinessReport.blockers.map((entry) => entry.code),
    ).toContain("invalid-root-capacity");
    expect(result.plan.hostileAttackChannels).toEqual([]);
    expect(Object.isFrozen(result.readinessReport.blockers)).toBe(true);
  });

  it("blocks missing lifecycle lineage and attack-channel mismatch", () => {
    const missing = fixture();
    const missingAssembly = structuredClone(missing.assembly);
    missingAssembly.bindings = missingAssembly.bindings.filter(
      (binding) =>
        !(
          binding.from.instanceId === "enemy-roots" &&
          binding.from.portId === "lifecycle"
        ),
    );
    const missingResult = resolveBatch3AuthorityPlanV14({
      assembly: GameAssemblySpecV13Schema.parse(missingAssembly),
      manifests: missing.manifests,
      scoreCapacityBasis: missing.scoreCapacityBasis,
    });
    expect(missingResult.readinessReport.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "missing-hostile-root-lineage" }),
      ]),
    );

    const mismatch = fixture();
    const mismatchAssembly = structuredClone(mismatch.assembly);
    mismatchAssembly.modules.find(
      (entry) => entry.instanceId === "hostile-targeting",
    )!.configuration = { attackChannelId: "boss.primary" };
    const mismatchResult = resolveBatch3AuthorityPlanV14({
      assembly: GameAssemblySpecV13Schema.parse(mismatchAssembly),
      manifests: mismatch.manifests,
      scoreCapacityBasis: mismatch.scoreCapacityBasis,
    });
    expect(mismatchResult.readinessReport.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "missing-hostile-targeting" }),
      ]),
    );
  });

  it("blocks group one-under ceilings and non-hostile members", () => {
    const under = fixture();
    const underAssembly = structuredClone(under.assembly);
    underAssembly.hostileAggregateBudgetGroups[0]!.activeProjectileCapacity = 255;
    const underResult = resolveBatch3AuthorityPlanV14({
      assembly: GameAssemblySpecV13Schema.parse(underAssembly),
      manifests: under.manifests,
      scoreCapacityBasis: under.scoreCapacityBasis,
    });
    expect(underResult.readinessReport.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "missing-hostile-delivery-or-group" }),
      ]),
    );

    const exact = fixture();
    const exactAssembly = structuredClone(exact.assembly);
    exactAssembly.hostileAggregateBudgetGroups[0]!.activeEntityCapacity = 20;
    exactAssembly.hostileAggregateBudgetGroups[0]!.activeProjectileCapacity = 20;
    exactAssembly.hostileAggregateBudgetGroups[0]!.spawnsPerSecondCapacity = 40;
    const exactManifests = exact.manifests.map((selection) =>
      selection.instanceId === "hostile-delivery"
        ? {
            ...selection,
            resourceGrant: {
              activeEntities: 20,
              activeProjectiles: 20,
              spawnsPerSecond: 40,
              timers: 0,
            },
          }
        : selection,
    );
    const exactResult = resolveBatch3AuthorityPlanV14({
      assembly: GameAssemblySpecV13Schema.parse(exactAssembly),
      manifests: exactManifests,
      scoreCapacityBasis: exact.scoreCapacityBasis,
      scoreAwardBounds: exact.scoreAwardBounds,
    });
    expect(exactResult.readinessReport.blockers).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "missing-hostile-delivery-or-group" }),
      ]),
    );
    exactAssembly.hostileAggregateBudgetGroups[0]!.activeProjectileCapacity = 19;
    const oneUnder = resolveBatch3AuthorityPlanV14({
      assembly: GameAssemblySpecV13Schema.parse(exactAssembly),
      manifests: exactManifests,
      scoreCapacityBasis: exact.scoreCapacityBasis,
      scoreAwardBounds: exact.scoreAwardBounds,
    });
    expect(oneUnder.readinessReport.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "missing-hostile-delivery-or-group" }),
      ]),
    );

    const ordinary = fixture();
    const ordinaryAssembly = structuredClone(ordinary.assembly);
    ordinaryAssembly.hostileAggregateBudgetGroups[0]!.memberInstanceIds.push(
      "keyboard",
    );
    const ordinaryResult = resolveBatch3AuthorityPlanV14({
      assembly: GameAssemblySpecV13Schema.parse(ordinaryAssembly),
      manifests: ordinary.manifests,
      scoreCapacityBasis: ordinary.scoreCapacityBasis,
    });
    expect(ordinaryResult.readinessReport.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          instanceId: "keyboard",
          code: "contention-member-not-hostile-delivery",
        }),
      ]),
    );
  });

  it("blocks actor-set terminal drift and split root mutation lineage", () => {
    const routeInput = fixture();
    const routeAssembly = structuredClone(routeInput.assembly);
    routeAssembly.actorSetDamageRoutes[0]!.orderedSinkInstanceIds = [
      "root-contact",
    ];
    const routeResult = resolveBatch3AuthorityPlanV14({
      ...routeInput,
      assembly: GameAssemblySpecV13Schema.parse(routeAssembly),
    });
    expect(routeResult.readinessReport.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-actor-set-route" }),
        expect.objectContaining({ code: "orphan-actor-set-health-bank" }),
      ]),
    );

    const mutationInput = fixture();
    const mutationAssembly = structuredClone(mutationInput.assembly);
    mutationAssembly.actorRootMutationGrantSelections[0]!.producerInstanceId =
      "hostile-source";
    const mutationResult = resolveBatch3AuthorityPlanV14({
      ...mutationInput,
      assembly: GameAssemblySpecV13Schema.parse(mutationAssembly),
    });
    expect(mutationResult.readinessReport.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-root-mutation-lineage" }),
      ]),
    );
  });

  it("derives score capacity only from bounded upstream evidence", () => {
    const missing = fixture();
    const missingResult = resolveBatch3AuthorityPlanV14({
      assembly: missing.assembly,
      manifests: missing.manifests,
    });
    expect(missingResult.readinessReport.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "invalid-score-ledger-lineage-or-capacity",
        }),
      ]),
    );

    const overflow = fixture();
    const overflowResult = resolveBatch3AuthorityPlanV14({
      ...overflow,
      scoreCapacityBasis: {
        ...overflow.scoreCapacityBasis,
        maximumWaveBossDefeats: 1_000_000,
      },
    });
    expect(overflowResult.readinessReport.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "score-capacity-overflow" }),
      ]),
    );

    const estimated = fixture();
    const estimatedAssembly = structuredClone(estimated.assembly);
    estimatedAssembly.modules.find(
      (entry) => entry.instanceId === "score-ledger",
    )!.configuration = { duplicateCapacity: 268 };
    const estimatedResult = resolveBatch3AuthorityPlanV14({
      ...estimated,
      assembly: GameAssemblySpecV13Schema.parse(estimatedAssembly),
    });
    expect(estimatedResult.readinessReport.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "invalid-score-ledger-lineage-or-capacity",
        }),
      ]),
    );

    const identity = fixture();
    const ledgerManifest = identity.manifests.find(
      (entry) => entry.instanceId === "score-ledger",
    )!.manifest;
    const identityResult = resolveBatch3AuthorityPlanV14({
      ...identity,
      manifests: identity.manifests.map((entry) =>
        entry.instanceId === "score-source"
          ? { ...entry, manifest: ledgerManifest }
          : entry,
      ),
    });
    expect(identityResult.readinessReport.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          instanceId: "score-source",
          code: "manifest-selection-identity-mismatch",
        }),
      ]),
    );
  });

  it("requires one immutable award bound for every exact score route", () => {
    const missing = fixture();
    const missingResult = resolveBatch3AuthorityPlanV14({
      ...missing,
      scoreAwardBounds: [],
    });
    expect(missingResult.readinessReport.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          instanceId: "score-ledger",
          code: "invalid-score-ledger-lineage-or-capacity",
        }),
      ]),
    );

    const duplicate = fixture();
    const duplicateResult = resolveBatch3AuthorityPlanV14({
      ...duplicate,
      scoreAwardBounds: [
        ...duplicate.scoreAwardBounds,
        ...duplicate.scoreAwardBounds,
      ],
    });
    expect(duplicateResult.readinessReport.status).toBe("blocked");

    const extra = fixture();
    const extraResult = resolveBatch3AuthorityPlanV14({
      ...extra,
      scoreAwardBounds: [
        ...extra.scoreAwardBounds,
        {
          ...extra.scoreAwardBounds[0]!,
          sourcePortId: "unresolved",
          evidenceId: "e".repeat(64),
        },
      ],
    });
    expect(extraResult.readinessReport.status).toBe("blocked");

    const invalid = fixture();
    const invalidResult = resolveBatch3AuthorityPlanV14({
      ...invalid,
      scoreAwardBounds: [
        {
          ...invalid.scoreAwardBounds[0]!,
          maximumAward: Number.POSITIVE_INFINITY,
        },
      ],
    });
    expect(invalidResult.readinessReport.status).toBe("blocked");
  });

  it("requires one exact outcome selection and frame-tail commit lineage", () => {
    const bindingInput = fixture();
    const bindingAssembly = structuredClone(bindingInput.assembly);
    const lossBinding = bindingAssembly.bindings.find(
      (binding) => binding.from.instanceId === "loss-condition",
    )!;
    lossBinding.to.portId = "win";
    const bindingResult = resolveBatch3AuthorityPlanV14({
      ...bindingInput,
      assembly: GameAssemblySpecV13Schema.parse(bindingAssembly),
    });
    expect(bindingResult.readinessReport.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-outcome-selection-lineage" }),
      ]),
    );

    const swapped = fixture();
    const swappedAssembly = structuredClone(swapped.assembly);
    swappedAssembly.bindings.find(
      (binding) => binding.from.instanceId === "win-condition",
    )!.to.portId = "loss";
    swappedAssembly.bindings.find(
      (binding) => binding.from.instanceId === "loss-condition",
    )!.to.portId = "win";
    const swappedResult = resolveBatch3AuthorityPlanV14({
      ...swapped,
      assembly: GameAssemblySpecV13Schema.parse(swappedAssembly),
    });
    expect(swappedResult.readinessReport.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-outcome-selection-lineage" }),
      ]),
    );

    const extra = fixture();
    const extraAssembly = structuredClone(extra.assembly);
    const extraWinBinding = structuredClone(
      extraAssembly.bindings.find(
        (binding) => binding.from.instanceId === "win-condition",
      )!,
    );
    extraWinBinding.to.portId = "loss";
    extraAssembly.bindings.push(extraWinBinding);
    const extraResult = resolveBatch3AuthorityPlanV14({
      ...extra,
      assembly: GameAssemblySpecV13Schema.parse(extraAssembly),
    });
    expect(extraResult.readinessReport.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-outcome-selection-lineage" }),
      ]),
    );

    const extraInput = fixture();
    const extraInputManifests = structuredClone(
      extraInput.manifests,
    ) as unknown as Array<{
      instanceId: string;
      manifest: {
        inputPorts: Array<Record<string, unknown>>;
      };
    }>;
    const coordinatorManifest = extraInputManifests.find(
      (entry) => entry.instanceId === "outcome-coordinator",
    )!.manifest;
    coordinatorManifest.inputPorts.push({
      ...coordinatorManifest.inputPorts[0]!,
      id: "extra-input",
      required: false,
    });
    const extraInputResult = resolveBatch3AuthorityPlanV14({
      ...extraInput,
      manifests: extraInputManifests as unknown as typeof extraInput.manifests,
    });
    expect(extraInputResult.readinessReport.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-outcome-selection-lineage" }),
      ]),
    );

    const missing = fixture();
    const missingAssembly = structuredClone(missing.assembly);
    missingAssembly.outcomeCoordinatorSelection = null;
    const missingResult = resolveBatch3AuthorityPlanV14({
      ...missing,
      assembly: GameAssemblySpecV13Schema.parse(missingAssembly),
    });
    expect(missingResult.readinessReport.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "outcome-coordinator-cardinality" }),
      ]),
    );
  });
});
