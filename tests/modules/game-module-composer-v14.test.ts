import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createBatch3ProductionRegistry } from "../../src/modules/batch3-production-library.js";
import { resolveGameAssemblyV14 } from "../../src/modules/game-module-composer-v14.js";
import {
  GameAssemblySpecV13Schema,
  GameModuleManifestV13Schema,
} from "../../src/modules/game-module-contract.js";
import { GameModuleRegistry } from "../../src/modules/game-module-registry.js";
import {
  manifest11,
  zeroBudget,
} from "./game-module-execution-test-helpers.js";

describe("Graph 1.4 compositor", () => {
  it("retains frozen Graze beside the admitted hostile radial channel without a context upcast", async () => {
    const registry = await createBatch3ProductionRegistry();
    const assembly = GameAssemblySpecV13Schema.parse({
      schemaVersion: "1.3.0",
      assemblyId: "batch3.graze-cross-version",
      kernelVersion: "1.0.0",
      engine: { id: "phaser", version: "3.90.0" },
      actors: [
        { actorId: "player-one", role: "player" },
        { actorId: "enemy-host", role: "enemy" },
      ],
      modules: [
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
      ],
      bindings: [
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
          from: { instanceId: "enemy-radial", portId: "projectiles" },
          to: { instanceId: "frozen-graze", portId: "projectiles" },
        },
      ],
      assetRoles: [
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
      globalBudget: {
        activeEntities: 256,
        activeProjectiles: 256,
        spawnsPerSecond: 1024,
        timers: 64,
      },
      effectApplicationBindings: [],
      pickupEffectPlanSelections: [],
      assetBindings: [],
      contactPolicySelections: [],
      damageSinkRoutes: [],
      entityMutationGrantSelections: [],
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
      ],
      hostileAggregateBudgetGroups: [
        {
          groupId: "enemy.hostile",
          kind: "hostile-contention-v1",
          memberInstanceIds: ["enemy-radial"],
          activeEntityCapacity: 1,
          activeProjectileCapacity: 1,
          spawnsPerSecondCapacity: 1,
          ordering: "resolved-provider-order",
        },
      ],
      actorSetDamageRoutes: [],
      actorRootMutationGrantSelections: [],
      outcomeCoordinatorSelection: null,
    });
    const result = resolveGameAssemblyV14(assembly, registry, {
      scoreCapacityBasis: {
        profile: "resolved-score-capacity-basis-v1",
        maximumWaveBossDefeats: 1,
        waveBossEvidenceId: "a".repeat(64),
        maximumGrazeProjectileGenerations: 1,
        grazeGenerationEvidenceId: "b".repeat(64),
        maximumScheduledPickups: 0,
        pickupScheduleEvidenceId: "c".repeat(64),
      },
      scoreAwardBounds: [],
    });
    expect(
      result.graph.modules.find(
        (module) => module.instanceId === "frozen-graze",
      ),
    ).toMatchObject({
      manifestSchemaVersion: "1.3.0",
      factoryContextVersion: "1.3.0",
    });
    expect(result.graph.entityChannelReadGrants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ instanceId: "frozen-graze" }),
      ]),
    );
    expect(result.graph.projectileChannelLineages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          consumerInstanceId: "frozen-graze",
          providerInstanceId: "enemy-radial",
        }),
      ]),
    );
  });
  it("retains a strict Assembly 1.3 base and emits deterministic blocked evidence before authority closure", () => {
    const registry = new GameModuleRegistry();
    const manifest = GameModuleManifestV13Schema.parse({
      ...(manifest11("test.legacy-participant", {
        schemaVersion: "1.3.0",
        kind: "scoring",
        runtimeContract: {
          update: null,
          timerSlots: { slotGroupId: "main" },
          inputRegistrations: [],
          observationReaders: [],
          contactCommit: null,
        },
        runtimeLeases: { startLeases: 0, instanceLeases: 0, graphLeases: 0 },
        resources: zeroBudget,
        assetRequirements: [],
      }) as Record<string, unknown>),
      actorSnapshotReads: [],
      entityChannelReads: [],
      projectileChannelConsumer: null,
      attackChannel: null,
      preparedEffectCommit: null,
      modifierTargets: [],
      pickupEffectPlanTransform: null,
    });
    registry.register(manifest, z.strictObject({}));
    const assembly = GameAssemblySpecV13Schema.parse({
      schemaVersion: "1.3.0",
      assemblyId: "test.v14-compositor",
      kernelVersion: "1.0.0",
      engine: { id: "phaser", version: "3.90.0" },
      actors: [
        { actorId: "player", role: "player" },
        { actorId: "world", role: "world" },
      ],
      modules: [
        {
          instanceId: "legacy",
          ownerId: "world",
          moduleId: manifest.moduleId,
          versionRange: manifest.version,
          configuration: {},
        },
      ],
      bindings: [],
      contactPolicySelections: [],
      damageSinkRoutes: [],
      assetRoles: [],
      globalBudget: zeroBudget,
      assetBindings: [],
      effectApplicationBindings: [],
      pickupEffectPlanSelections: [],
      actorRootBindings: [],
      hostileAggregateBudgetGroups: [],
      actorSetDamageRoutes: [],
      actorRootMutationGrantSelections: [],
      outcomeCoordinatorSelection: null,
    });
    const input = {
      scoreCapacityBasis: {
        profile: "resolved-score-capacity-basis-v1" as const,
        maximumWaveBossDefeats: 0,
        waveBossEvidenceId: "a".repeat(64),
        maximumGrazeProjectileGenerations: 0,
        grazeGenerationEvidenceId: "b".repeat(64),
        maximumScheduledPickups: 0,
        pickupScheduleEvidenceId: "c".repeat(64),
      },
      scoreAwardBounds: [],
    };
    const first = resolveGameAssemblyV14(assembly, registry, input);
    const second = resolveGameAssemblyV14(assembly, registry, input);
    expect(first.readinessReport.status).toBe("blocked");
    expect(first).toEqual(second);
    expect(first.graph.graphVersion).toBe("1.4.0");
    expect(first.graph.modules[0]).toMatchObject({
      instanceId: "legacy",
      manifestSchemaVersion: "1.3.0",
      factoryContextVersion: "1.3.0",
    });
  });
});
