import { describe, expect, it } from "vitest";

import { createBatch3ProductionRegistry } from "../../src/modules/batch3-production-library.js";
import { BATCH1_VERTICAL_SLICE_ASSET_EVIDENCE } from "../../src/modules/batch1-vertical-slice.js";
import { BATCH2_VERTICAL_SLICE_ASSEMBLY } from "../../src/modules/batch2-vertical-slice.js";
import { resolveGameAssemblyV14 } from "../../src/modules/game-module-composer-v14.js";
import { GameAssemblySpecV13Schema } from "../../src/modules/game-module-contract.js";
import {
  DeterministicGameModuleProductionInstantiatorV14,
  type ProductionModuleV14View,
} from "../../src/modules/game-module-production-instantiator.js";
import { generateBrowserRuntimeCatalogV14 } from "../../src/modules/game-module-runtime-catalog-generator.js";
import type {
  GameModuleFactoryContextV12,
  GameModuleFactoryContextV13,
} from "../../src/modules/game-module-runtime-factory.js";

const reviewedArtifact = BATCH1_VERTICAL_SLICE_ASSET_EVIDENCE.assets[0]!;
const assetEvidence = Object.freeze({
  assets: BATCH1_VERTICAL_SLICE_ASSET_EVIDENCE.assets,
  approvedSharingEvidenceIds: Object.freeze([
    "batch3.enemy-sharing",
    "batch3.enemy-projectile-sharing",
  ]),
});
const playerAttackInstanceIds = new Set([
  "aim",
  "attack-intent",
  "targeting",
  "trigger",
  "delivery",
]);
const playerAttackModules = BATCH2_VERTICAL_SLICE_ASSEMBLY.modules
  .filter((module) => playerAttackInstanceIds.has(module.instanceId))
  .map((module) => structuredClone(module));
const playerAttackBindings = BATCH2_VERTICAL_SLICE_ASSEMBLY.bindings
  .filter(
    (binding) =>
      playerAttackInstanceIds.has(binding.from.instanceId) &&
      playerAttackInstanceIds.has(binding.to.instanceId),
  )
  .map((binding) => structuredClone(binding));

const assembly = GameAssemblySpecV13Schema.parse({
  schemaVersion: "1.3.0",
  assemblyId: "batch3.first-ready-production-graph",
  kernelVersion: "1.0.0",
  engine: { id: "phaser", version: "3.90.0" },
  actors: [
    { actorId: "player-one", role: "player" },
    { actorId: "enemy-host", role: "enemy" },
  ],
  modules: [
    ...playerAttackModules,
    {
      instanceId: "enemy-waves",
      ownerId: "enemy-host",
      moduleId: "encounter.scrolling-waves",
      versionRange: "1.0.0",
      configuration: {
        maximumEnemies: 1,
        maximumSpawnsPerSecond: 1,
        sourceIds: ["scout"],
        assetRoleBySource: { scout: "enemy" },
        spawnY: 0,
        radius: 8,
        waves: [
          {
            sourceId: "scout",
            startsAtMs: 0,
            endsAtMs: 1000,
            intervalMs: 1000,
            maxAlive: 1,
            speed: 10,
          },
        ],
      },
    },
    {
      instanceId: "enemy-pattern",
      ownerId: "enemy-host",
      moduleId: "trigger.encounter-pattern",
      versionRange: "1.0.0",
      configuration: {
        attackChannelId: "enemy.primary",
        patternSourceId: "radial.one",
        intervalMs: 1000,
        durationMs: 1000,
        maximumEmitters: 1,
      },
    },
    {
      instanceId: "enemy-fixed",
      ownerId: "enemy-host",
      moduleId: "targeting.hostile-fixed",
      versionRange: "1.0.0",
      configuration: {
        attackChannelId: "enemy.primary",
        direction: { x: 0, y: 1 },
      },
    },
    {
      instanceId: "enemy-radial",
      ownerId: "enemy-host",
      moduleId: "delivery.pattern.radial",
      versionRange: "1.1.0",
      configuration: {
        attackChannelId: "enemy.primary",
        count: 1,
        maximumCountBonus: 0,
        speed: 100,
        damage: 1,
        textureRole: "enemy-projectile",
        maxActive: 1,
        maximumAcceptedRequestsPerSecond: 1,
        baseAngleOffsetDegrees: 0,
        recycleMargin: 8,
        exhaustionPolicy: "drop-and-observe",
      },
    },
    {
      instanceId: "enemy-health",
      ownerId: "enemy-host",
      moduleId: "combat.health",
      versionRange: "1.2.0",
      configuration: {
        damageRouteId: "enemy.damage",
        maximumHealthBySourceId: { scout: 10 },
      },
    },
    {
      instanceId: "projectile-root-contact",
      ownerId: "enemy-host",
      moduleId: "interaction.projectile-root-contact",
      versionRange: "1.0.0",
      configuration: { maximumTrackedContacts: 8 },
    },
    {
      instanceId: "actor-root-contact",
      ownerId: "player-one",
      moduleId: "interaction.actor-root-contact",
      versionRange: "1.0.0",
      configuration: { maximumTrackedContacts: 8 },
    },
    {
      instanceId: "projectile-default-damage",
      ownerId: "enemy-host",
      moduleId: "interaction.contact-default-damage",
      versionRange: "1.1.0",
      configuration: {
        projectileRootRouteId: "enemy.damage",
        actorRootPlayerRouteId: "player.damage",
      },
    },
    {
      instanceId: "projectile-contact-resolution",
      ownerId: "enemy-host",
      moduleId: "interaction.contact-resolution",
      versionRange: "1.2.0",
      configuration: { maximumResolvedContacts: 8 },
    },
    {
      instanceId: "body-default-damage",
      ownerId: "player-one",
      moduleId: "interaction.contact-default-damage",
      versionRange: "1.1.0",
      configuration: {
        projectileRootRouteId: "enemy.damage",
        actorRootPlayerRouteId: "player.damage",
      },
    },
    {
      instanceId: "body-contact-resolution",
      ownerId: "player-one",
      moduleId: "interaction.contact-resolution",
      versionRange: "1.2.0",
      configuration: { maximumResolvedContacts: 8 },
    },
    {
      instanceId: "player-health",
      ownerId: "player-one",
      moduleId: "combat.health",
      versionRange: "1.1.0",
      configuration: {
        maxHealth: 10,
        initialHealth: 10,
        damageFloor: 0,
      },
    },
    {
      instanceId: "frozen-graze",
      ownerId: "player-one",
      moduleId: "combat.graze",
      versionRange: "1.0.0",
      configuration: {
        playerRadius: 8,
        bulletRadius: 4,
        margin: 12,
        ledgerCeiling: 8,
      },
    },
    {
      instanceId: "graze-score",
      ownerId: "player-one",
      moduleId: "scoring.graze",
      versionRange: "1.0.0",
      configuration: { award: 0.25 },
    },
    {
      instanceId: "score-ledger",
      ownerId: "player-one",
      moduleId: "scoring.ledger",
      versionRange: "1.0.0",
      configuration: {},
    },
    {
      instanceId: "win-score",
      ownerId: "player-one",
      moduleId: "outcome.score-threshold",
      versionRange: "1.0.0",
      configuration: { candidate: "win", threshold: 1 },
    },
    {
      instanceId: "loss-time",
      ownerId: "player-one",
      moduleId: "outcome.survival-time",
      versionRange: "1.0.0",
      configuration: { candidate: "loss", thresholdMs: 60_000 },
    },
    {
      instanceId: "outcome-coordinator",
      ownerId: "player-one",
      moduleId: "outcome.coordinator",
      versionRange: "1.0.0",
      configuration: {},
    },
  ],
  bindings: [
    ...playerAttackBindings,
    {
      from: { instanceId: "enemy-waves", portId: "roots" },
      to: { instanceId: "enemy-pattern", portId: "roots" },
    },
    {
      from: { instanceId: "enemy-waves", portId: "lifecycle" },
      to: { instanceId: "enemy-pattern", portId: "lifecycle" },
    },
    {
      from: { instanceId: "enemy-pattern", portId: "requests" },
      to: { instanceId: "enemy-fixed", portId: "requests" },
    },
    {
      from: { instanceId: "enemy-fixed", portId: "targeted" },
      to: { instanceId: "enemy-radial", portId: "targeted" },
    },
    {
      from: { instanceId: "enemy-waves", portId: "roots" },
      to: { instanceId: "enemy-health", portId: "roots" },
    },
    {
      from: { instanceId: "enemy-health", portId: "defeated" },
      to: { instanceId: "enemy-waves", portId: "defeated" },
    },
    {
      from: { instanceId: "enemy-waves", portId: "roots" },
      to: { instanceId: "projectile-root-contact", portId: "roots" },
    },
    {
      from: { instanceId: "enemy-waves", portId: "roots" },
      to: { instanceId: "actor-root-contact", portId: "roots" },
    },
    {
      from: { instanceId: "delivery", portId: "projectiles" },
      to: { instanceId: "projectile-root-contact", portId: "projectiles" },
    },
    {
      from: { instanceId: "projectile-root-contact", portId: "candidates" },
      to: { instanceId: "projectile-default-damage", portId: "candidates" },
    },
    {
      from: { instanceId: "actor-root-contact", portId: "candidates" },
      to: { instanceId: "body-default-damage", portId: "candidates" },
    },
    {
      from: { instanceId: "projectile-default-damage", portId: "decisions" },
      to: { instanceId: "projectile-contact-resolution", portId: "decisions" },
    },
    {
      from: { instanceId: "body-default-damage", portId: "decisions" },
      to: { instanceId: "body-contact-resolution", portId: "decisions" },
    },
    {
      from: { instanceId: "enemy-radial", portId: "projectiles" },
      to: { instanceId: "frozen-graze", portId: "projectiles" },
    },
    {
      from: { instanceId: "frozen-graze", portId: "graze" },
      to: { instanceId: "graze-score", portId: "grazes" },
    },
    {
      from: { instanceId: "graze-score", portId: "transactions" },
      to: { instanceId: "score-ledger", portId: "transactions" },
    },
    {
      from: { instanceId: "score-ledger", portId: "score" },
      to: { instanceId: "win-score", portId: "score" },
    },
    {
      from: { instanceId: "win-score", portId: "condition" },
      to: { instanceId: "outcome-coordinator", portId: "win" },
    },
    {
      from: { instanceId: "loss-time", portId: "condition" },
      to: { instanceId: "outcome-coordinator", portId: "loss" },
    },
  ],
  assetRoles: [
    {
      roleId: "player-projectile",
      category: "projectile",
      requiredByInstanceIds: ["delivery"],
    },
    {
      roleId: "enemy",
      category: "enemy",
      requiredByInstanceIds: ["enemy-waves"],
    },
    {
      roleId: "enemy-projectile",
      category: "projectile",
      requiredByInstanceIds: ["enemy-radial"],
    },
  ],
  assetBindings: [
    structuredClone(BATCH2_VERTICAL_SLICE_ASSEMBLY.assetBindings[0]!),
    {
      bindingId: "enemy",
      roleId: "enemy",
      category: "enemy",
      artifact: reviewedArtifact,
      sharing: "assembly",
      consumerInstanceIds: ["enemy-waves", "enemy-pattern"],
      approvedSharingEvidenceId: "batch3.enemy-sharing",
    },
    {
      bindingId: "enemy-projectile",
      roleId: "enemy-projectile",
      category: "projectile",
      artifact: reviewedArtifact,
      sharing: "instance",
      consumerInstanceIds: ["enemy-radial"],
    },
  ],
  globalBudget: {
    activeEntities: 256,
    activeProjectiles: 256,
    spawnsPerSecond: 1024,
    timers: 64,
  },
  contactPolicySelections: [],
  damageSinkRoutes: [
    { ownerId: "player-one", headInstanceId: "player-health" },
  ],
  entityMutationGrantSelections: [],
  effectApplicationBindings: [],
  pickupEffectPlanSelections: [],
  actorRootBindings: [
    {
      bindingId: "enemy.pattern-source",
      producerInstanceId: "enemy-waves",
      producerOutputPort: "roots",
      consumerInstanceId: "enemy-pattern",
      consumerInputPort: "roots",
      expectedActorRole: "enemy",
      purpose: "pattern-source",
      maximumEntries: 1,
    },
    {
      bindingId: "enemy.health-bank",
      producerInstanceId: "enemy-waves",
      producerOutputPort: "roots",
      consumerInstanceId: "enemy-health",
      consumerInputPort: "roots",
      expectedActorRole: "enemy",
      purpose: "health-bank",
      maximumEntries: 1,
    },
    {
      bindingId: "enemy.projectile-target",
      producerInstanceId: "enemy-waves",
      producerOutputPort: "roots",
      consumerInstanceId: "projectile-root-contact",
      consumerInputPort: "roots",
      expectedActorRole: "enemy",
      purpose: "projectile-target",
      maximumEntries: 1,
    },
    {
      bindingId: "enemy.body-contact",
      producerInstanceId: "enemy-waves",
      producerOutputPort: "roots",
      consumerInstanceId: "actor-root-contact",
      consumerInputPort: "roots",
      expectedActorRole: "enemy",
      purpose: "body-contact",
      maximumEntries: 1,
    },
  ],
  hostileAggregateBudgetGroups: [
    {
      groupId: "enemy.hostile",
      kind: "hostile-contention-v1",
      memberInstanceIds: ["enemy-radial"],
      activeEntityCapacity: 256,
      activeProjectileCapacity: 256,
      spawnsPerSecondCapacity: 1024,
      ordering: "resolved-provider-order",
    },
  ],
  actorSetDamageRoutes: [
    {
      routeId: "enemy.damage",
      rootBindingId: "enemy.health-bank",
      orderedSinkInstanceIds: ["enemy-health"],
    },
  ],
  actorRootMutationGrantSelections: [
    {
      selectionId: "enemy.body-contact.deactivate",
      rootBindingId: "enemy.body-contact",
      consumerInstanceId: "actor-root-contact",
      producerInstanceId: "enemy-waves",
      operation: "deactivate-root",
    },
  ],
  outcomeCoordinatorSelection: {
    coordinatorInstanceId: "outcome-coordinator",
    winConditionInstanceId: "win-score",
    lossConditionInstanceId: "loss-time",
    arbitrationPhase: "post-provider-post-event-frame-v1",
  },
});

function baseContext(
  module: ProductionModuleV14View,
  clock: GameModuleFactoryContextV12["clock"],
) {
  const services = {
    viewport: { read: () => ({ width: 800, height: 600 }) },
    actors: {
      readOwner: () => ({}),
      readPlayer: () => ({}),
      writeOwnerMotion: () => undefined,
      writeOwnerPosition: () => undefined,
    },
    input: { register: () => () => undefined },
    overlaps: { register: () => () => undefined },
    channels: {
      activate: (_id: string, value: unknown) => value,
      recycle: () => undefined,
      read: () => [],
    },
    observation: { register: () => () => undefined },
    contact: { prepare: () => ({}), commit: () => ({}) },
  };
  return {
    identity: {
      instanceId: module.instanceId,
      ownerId: module.ownerId,
      moduleId: module.moduleId,
      version: module.version,
      artifactEnvelopeSha256: module.artifactIdentity!.envelopeSha256,
    },
    configuration: module.configuration,
    services,
    ports: {
      declareHandler: () => undefined,
      declareAddressedHandler: () => undefined,
      publishState: () => undefined,
      emitEvent: () => undefined,
    },
    clock,
    assets: {
      requireTexture: (roleId: string) => roleId,
      optionalTexture: () => undefined,
    },
  };
}

async function readyGraph(candidate = assembly) {
  const registry = await createBatch3ProductionRegistry();
  const result = resolveGameAssemblyV14(candidate, registry, {
    assetEvidence,
    scoreCapacityBasis: {
      profile: "resolved-score-capacity-basis-v1",
      maximumWaveBossDefeats: 0,
      waveBossEvidenceId: "a".repeat(64),
      maximumGrazeProjectileGenerations: 8,
      grazeGenerationEvidenceId: "b".repeat(64),
      maximumScheduledPickups: 0,
      pickupScheduleEvidenceId: "c".repeat(64),
    },
    scoreAwardBounds: [
      {
        sourceInstanceId: "graze-score",
        sourcePortId: "transactions",
        ledgerInstanceId: "score-ledger",
        ledgerPortId: "transactions",
        maximumAward: 0.25,
        evidenceId: "d".repeat(64),
      },
    ],
  });
  return { registry, result };
}

describe("Batch 3 first production-registry ready Graph 1.4", () => {
  it("closes actual hostile, contact, scoring, and outcome production routes", async () => {
    const { registry, result } = await readyGraph();
    for (const request of assembly.modules) {
      const entries = registry.findForGraphV14(
        request.moduleId,
        request.versionRange,
      );
      expect(entries, request.instanceId).toHaveLength(1);
      expect(entries[0]!.registrationKind, request.instanceId).toBe(
        "production",
      );
      expect(entries[0]!.executableHandle, request.instanceId).toBeDefined();
      expect(
        entries[0]!.artifactIdentity?.envelopeSha256,
        request.instanceId,
      ).toMatch(/^[a-f0-9]{64}$/);
    }
    expect(result.readinessReport).toMatchObject({
      status: "ready",
      blockers: [],
    });
    expect(result.graph.executionReadiness.status).toBe("ready");
    expect(result.graph.hostileAttackChannels).toHaveLength(1);
    expect(result.graph.actorSetDamageRoutes).toHaveLength(1);
    expect(result.graph.actorRootMutationGrants).toHaveLength(1);
    expect(result.graph.contactRoutes).toHaveLength(2);
    expect(result.graph.scoringAuthority?.ledgerInstanceId).toBe(
      "score-ledger",
    );
    expect(result.graph.outcomeAuthority?.coordinatorInstanceId).toBe(
      "outcome-coordinator",
    );
  });

  it("actually instantiates both route-bound V2 resolution factories", async () => {
    const { registry, result } = await readyGraph();
    const contactCommits: unknown[] = [];
    const runtime = DeterministicGameModuleProductionInstantiatorV14.create({
      graph: result.graph,
      catalog: generateBrowserRuntimeCatalogV14(result.graph, registry),
      createContextV12: (module, clock) =>
        baseContext(module, clock) as unknown as GameModuleFactoryContextV12,
      createContextV13: (module, clock) => {
        const context = baseContext(module, clock);
        return {
          ...context,
          services: {
            ...context.services,
            actorSnapshots: { read: () => ({}) },
            entityChannelSnapshots: { read: () => [] },
          },
        } as unknown as GameModuleFactoryContextV13;
      },
      createContextV14Base: (module, clock) =>
        baseContext(module, clock) as never,
      createAuthorityAdapters: () => ({
        actorSnapshots: { read: () => ({}) },
        entityChannelSnapshots: { read: () => [] },
        actorRoots: {
          activate: () => ({}),
          deactivate: () => undefined,
        },
        actorRootSnapshots: { read: () => ({}) },
        actorRootMutation: { deactivate: () => undefined },
        actorSetHealth: {
          damage: () => ({ state: {}, defeated: undefined }),
        },
        contactCandidates: { register: () => () => undefined },
        contactCommitV2: {
          commit: (instanceId, decision) => {
            contactCommits.push({ instanceId, decision });
            return { evidenceId: contactCommits.length - 1 };
          },
        },
        hostileProjectileDelivery: {
          admit: () => ({ activated: [] }),
          recycle: () => undefined,
          observe: () => ({}),
        },
        hostileAttackLineage: {
          readActiveSource: () => ({ position: { x: 0, y: 0 } }),
        },
        outcomeCommit: {
          publishCondition: () => undefined,
          commit: () => undefined,
          beginFrame: () => undefined,
          arbitrateFrameTail: () => undefined,
          afterGuard: () => undefined,
        },
      }),
      registerAddressedHandler: () => undefined,
    });
    runtime.initialize();
    expect(contactCommits).toEqual([]);
    runtime.destroy();
  });

  it("blocks production actor-set health without successful defeat deactivation routing", async () => {
    const candidate = GameAssemblySpecV13Schema.parse({
      ...structuredClone(assembly),
      bindings: assembly.bindings.filter(
        (binding) =>
          !(
            binding.from.instanceId === "enemy-health" &&
            binding.from.portId === "defeated"
          ),
      ),
    });
    const { result } = await readyGraph(candidate);
    expect(result.readinessReport.status).toBe("blocked");
    expect(result.readinessReport.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          instanceId: "enemy-health",
          code: "invalid-actor-set-route",
        }),
      ]),
    );
  });
});
