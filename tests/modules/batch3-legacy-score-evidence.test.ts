import { describe, expect, it } from "vitest";

import { sha256ShooterGameSpec } from "../../src/assets/asset-query-grounding.js";
import { deriveBatch3LegacyScoreEvidence } from "../../src/modules/batch3-legacy-score-evidence.js";
import { GameAssemblySpecV13Schema } from "../../src/modules/game-module-contract.js";
import { ShooterGameSpecSchema } from "../../src/requirements/shooter-game-spec.js";

function spec() {
  return ShooterGameSpecSchema.parse({
    schemaVersion: "1.0.0",
    title: "Score evidence",
    theme: "space",
    story: "A deterministic score evidence fixture.",
    visualStyle: ["arcade"],
    difficulty: "medium",
    viewport: {
      logicalWidth: 360,
      logicalHeight: 640,
      maxEnemyBullets: 200,
      maxEnemies: 8,
    },
    player: {
      assetQueryId: "player",
      maxHealth: 3,
      moveSpeed: 200,
      hitboxRadius: 8,
    },
    weapons: [
      {
        id: "primary",
        projectileAssetQueryId: "player-projectile",
        fireIntervalMs: 100,
        projectileSpeed: 500,
        damage: 2,
      },
    ],
    enemyWaves: [
      {
        id: "scouts",
        enemyAssetQueryId: "enemy",
        startMs: 0,
        durationMs: 2_000,
        spawnIntervalMs: 1_000,
        maxAlive: 2,
        health: 10,
        moveSpeed: 50,
        patternIds: ["radial"],
        scoreValue: 100,
      },
    ],
    boss: {
      assetQueryId: "boss",
      maxHealth: 100,
      phases: [
        {
          id: "phase-one",
          healthThreshold: 1,
          patternIds: ["radial"],
          moveSpeed: 20,
        },
      ],
      scoreValue: 500,
    },
    bulletPatterns: [
      {
        id: "radial",
        pattern: "radial",
        bulletCount: 4,
        speed: 100,
        intervalMs: 500,
        durationMs: 1_000,
        color: "#ffffff",
      },
      {
        id: "aimed",
        pattern: "aimed",
        bulletCount: 1,
        speed: 100,
        intervalMs: 500,
        durationMs: 1_000,
        color: "#ffffff",
      },
      {
        id: "fan",
        pattern: "fan",
        bulletCount: 3,
        speed: 100,
        intervalMs: 500,
        durationMs: 1_000,
        color: "#ffffff",
        arcDegrees: 45,
      },
    ],
    pickups: [
      {
        id: "bonus",
        assetQueryId: "pickup",
        effect: "scoreBonus",
        value: 7.5,
      },
      {
        id: "heal",
        assetQueryId: "pickup",
        effect: "heal",
        value: 1,
      },
    ],
    scoring: {
      comboWindowMs: 1_000,
      comboMultiplierCap: 3,
      grazePoints: 40,
    },
    winCondition: { type: "bossDefeated" },
    loseCondition: { type: "healthDepleted" },
    controls: {
      keyboard: {
        up: ["ArrowUp"],
        down: ["ArrowDown"],
        left: ["ArrowLeft"],
        right: ["ArrowRight"],
        focus: [],
      },
      touch: { mode: "drag", relativeMovement: true },
    },
    audioStyle: { music: "energetic", effects: "arcade" },
    assetQueries: [
      {
        id: "player",
        category: "player",
        theme: "space",
        visualStyle: ["arcade"],
      },
      {
        id: "player-projectile",
        category: "player-projectile",
        theme: "space",
        visualStyle: ["arcade"],
      },
      {
        id: "enemy",
        category: "enemy",
        theme: "space",
        visualStyle: ["arcade"],
      },
      { id: "boss", category: "boss", theme: "space", visualStyle: ["arcade"] },
      {
        id: "pickup",
        category: "pickup",
        theme: "space",
        visualStyle: ["arcade"],
      },
    ],
  });
}

function assembly() {
  const modules = [
    {
      instanceId: "combo",
      ownerId: "world",
      moduleId: "scoring.combo",
      versionRange: "1.0.0",
      configuration: { comboWindowMs: 1_000, multiplierCap: 3 },
    },
    {
      instanceId: "pickup-score",
      ownerId: "world",
      moduleId: "scoring.pickup",
      versionRange: "1.0.0",
      configuration: {},
    },
    {
      instanceId: "graze-score",
      ownerId: "world",
      moduleId: "scoring.graze",
      versionRange: "1.0.0",
      configuration: { award: 40 },
    },
    {
      instanceId: "ledger",
      ownerId: "world",
      moduleId: "scoring.ledger",
      versionRange: "1.0.0",
      configuration: {},
    },
  ];
  return GameAssemblySpecV13Schema.parse({
    schemaVersion: "1.3.0",
    assemblyId: "batch3.score-evidence",
    kernelVersion: "1.0.0",
    engine: { id: "phaser", version: "3.90.0" },
    actors: [
      { actorId: "player-one", role: "player" },
      { actorId: "world", role: "world" },
    ],
    modules,
    bindings: modules.slice(0, 3).map((module) => ({
      from: { instanceId: module.instanceId, portId: "transactions" },
      to: { instanceId: "ledger", portId: "transactions" },
    })),
    assetRoles: [],
    contactPolicySelections: [],
    damageSinkRoutes: [],
    entityMutationGrantSelections: [],
    assetBindings: [],
    effectApplicationBindings: [],
    pickupEffectPlanSelections: [],
    globalBudget: {
      activeEntities: 1,
      activeProjectiles: 1,
      spawnsPerSecond: 1,
      timers: 1,
    },
    actorRootBindings: [],
    hostileAggregateBudgetGroups: [],
    actorSetDamageRoutes: [],
    actorRootMutationGrantSelections: [],
    outcomeCoordinatorSelection: null,
  });
}

describe("Batch 3 legacy score evidence", () => {
  it("derives deterministic capacities and exact direct-source award bounds", () => {
    const sourceSpec = spec();
    const input = {
      spec: sourceSpec,
      sourceSpecSha256: sha256ShooterGameSpec(sourceSpec),
      assembly: assembly(),
    };
    const first = deriveBatch3LegacyScoreEvidence(input);
    const second = deriveBatch3LegacyScoreEvidence(input);

    expect(second).toEqual(first);
    expect(first.scoreCapacityBasis).toMatchObject({
      maximumWaveBossDefeats: 3,
      maximumGrazeProjectileGenerations: 36,
      maximumScheduledPickups: 2,
    });
    expect(first.scoreAwardBounds).toEqual([
      expect.objectContaining({
        sourceInstanceId: "combo",
        maximumAward: 1_500,
      }),
      expect.objectContaining({
        sourceInstanceId: "graze-score",
        maximumAward: 40,
      }),
      expect.objectContaining({
        sourceInstanceId: "pickup-score",
        maximumAward: 7.5,
      }),
    ]);
    expect(first.evidenceId).toMatch(/^[a-f0-9]{64}$/);
  });

  it("fails closed for Spec hash drift, unknown routes, and source config drift", () => {
    const sourceSpec = spec();
    const sourceSpecSha256 = sha256ShooterGameSpec(sourceSpec);
    expect(() =>
      deriveBatch3LegacyScoreEvidence({
        spec: sourceSpec,
        sourceSpecSha256: "0".repeat(64),
        assembly: assembly(),
      }),
    ).toThrow(/does not match/);

    const unknownRoute = structuredClone(assembly());
    unknownRoute.bindings[0]!.from.instanceId = "unknown-source";
    expect(() =>
      deriveBatch3LegacyScoreEvidence({
        spec: sourceSpec,
        sourceSpecSha256,
        assembly: unknownRoute,
      }),
    ).toThrow();

    const drift = structuredClone(assembly());
    drift.modules.find(
      (module) => module.instanceId === "graze-score",
    )!.configuration = { award: 41 };
    expect(() =>
      deriveBatch3LegacyScoreEvidence({
        spec: sourceSpec,
        sourceSpecSha256,
        assembly: drift,
      }),
    ).toThrow(/does not match/);
  });

  it("rejects missing or multiple ledgers and duplicate source routes", () => {
    const sourceSpec = spec();
    const sourceSpecSha256 = sha256ShooterGameSpec(sourceSpec);
    const missing = structuredClone(assembly());
    missing.modules = missing.modules.filter(
      (module) => module.moduleId !== "scoring.ledger",
    );
    missing.bindings = [];
    expect(() =>
      deriveBatch3LegacyScoreEvidence({
        spec: sourceSpec,
        sourceSpecSha256,
        assembly: missing,
      }),
    ).toThrow(/exactly one scoring ledger/);

    const duplicate = structuredClone(assembly());
    duplicate.modules.push({
      ...structuredClone(duplicate.modules.at(-1)!),
      instanceId: "ledger-two",
    });
    expect(() =>
      deriveBatch3LegacyScoreEvidence({
        spec: sourceSpec,
        sourceSpecSha256,
        assembly: duplicate,
      }),
    ).toThrow(/exactly one scoring ledger/);

    const duplicateRoute = structuredClone(assembly());
    duplicateRoute.bindings.push(structuredClone(duplicateRoute.bindings[0]!));
    expect(() =>
      deriveBatch3LegacyScoreEvidence({
        spec: sourceSpec,
        sourceSpecSha256,
        assembly: duplicateRoute,
      }),
    ).toThrow(/exactly once/);
  });
});
