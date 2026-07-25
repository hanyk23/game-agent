import { afterEach, describe, expect, it, vi } from "vitest";

import {
  installReadOnlyTestBridge,
  registerRuntimeSnapshotReader,
} from "../../game-template/vertical-shooter/src/test-bridge.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("read-only shooter test bridge", () => {
  it("exposes frozen snapshots without a mutation surface", () => {
    vi.stubGlobal("window", {});
    installReadOnlyTestBridge();

    const removeReader = registerRuntimeSnapshotReader(() => ({
      scene: "play",
      elapsedMs: 5_000,
      score: 120,
      playerHealth: 4,
      playerX: 270,
      playerY: 720,
      bossHealth: 80,
      bossX: 270,
      bossY: 120,
      nearestPlayerBulletY: 300,
      bossPhaseId: "dragon-spiral",
      activeEnemies: 0,
      activeEnemyBullets: 24,
      maxEnemyBullets: 260,
      peakActiveEnemyBullets: 80,
      activePlayerBullets: 5,
      maxPlayerBullets: 16,
      activePickups: 1,
      maxPickups: 8,
      weaponPowerBonus: 2,
      shieldStrength: 1,
      scoring: {
        comboWindowMs: 1_500,
        comboMultiplierCap: 5,
        grazePoints: 10,
        comboCount: 2,
        comboMultiplier: 2,
        maxComboMultiplier: 3,
        defeatCount: 4,
        defeatScore: 300,
        grazeCount: 2,
        grazeScore: 20,
        minimumEnemyBulletDistance: 18,
        hitRadiusAtMinimumDistance: 10,
      },
      weapons: [
        {
          id: "feather-shot",
          fireIntervalMs: 140,
          projectileSpeed: 780,
          damage: 4,
          projectileCount: 1,
          fireAttempts: 5,
          successfulProjectiles: 5,
          droppedProjectiles: 0,
          maxProjectilesPerFire: 1,
          hitCount: 2,
          damageDealt: 8,
          lastProjectileSpeed: 780,
        },
      ],
      enemyWaves: [
        {
          id: "opening",
          startMs: 0,
          spawnIntervalMs: 500,
          health: 3,
          moveSpeed: 100,
          started: true,
          spawnAttempts: 3,
          successfulSpawns: 2,
          patterns: [
            {
              id: "aimed-test",
              pattern: "aimed",
              emitterCount: 2,
              emissionAttempts: 4,
              requestedBullets: 24,
              plannedBullets: 16,
              successfulSpawns: 16,
              droppedByBudget: 8,
              droppedByPool: 0,
              movedBullets: 12,
              maxTravelDistance: 140,
              minimumAimErrorRadians: 0,
            },
          ],
        },
      ],
      bulletPatterns: [
        {
          id: "aimed-test",
          pattern: "aimed",
          emissionAttempts: 2,
          requestedBullets: 12,
          plannedBullets: 10,
          successfulSpawns: 10,
          droppedByBudget: 2,
          droppedByPool: 0,
          movedBullets: 8,
          maxTravelDistance: 160,
          minimumAimErrorRadians: 0,
        },
      ],
      pickups: [
        {
          id: "healing-orb",
          effect: "heal",
          value: 1,
          spawnMs: 250,
          fallSpeed: 180,
          spawnAttempts: 1,
          successfulSpawns: 1,
          droppedByBudget: 0,
          collections: 1,
          appliedValue: 1,
        },
      ],
      assets: {
        mode: "catalog",
        expectedTextureKeys: ["catalog-player"],
        loadedTextureKeys: ["catalog-player"],
        usedTextureKeys: ["catalog-player"],
      },
      ending: false,
    }));
    const bridge = window.__SHOOTER_TEST__;
    const snapshot = bridge?.getSnapshot();

    expect(Object.isFrozen(bridge)).toBe(true);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(
      snapshot?.scene === "play" && Object.isFrozen(snapshot.weapons),
    ).toBe(true);
    expect(
      snapshot?.scene === "play" && Object.isFrozen(snapshot.weapons[0]),
    ).toBe(true);
    expect(
      snapshot?.scene === "play" && Object.isFrozen(snapshot.enemyWaves),
    ).toBe(true);
    expect(
      snapshot?.scene === "play" && Object.isFrozen(snapshot.enemyWaves[0]),
    ).toBe(true);
    expect(
      snapshot?.scene === "play" &&
        Object.isFrozen(snapshot.enemyWaves[0]?.patterns),
    ).toBe(true);
    expect(
      snapshot?.scene === "play" &&
        Object.isFrozen(snapshot.enemyWaves[0]?.patterns[0]),
    ).toBe(true);
    expect(
      snapshot?.scene === "play" && Object.isFrozen(snapshot.bulletPatterns),
    ).toBe(true);
    expect(
      snapshot?.scene === "play" && Object.isFrozen(snapshot.bulletPatterns[0]),
    ).toBe(true);
    expect(
      snapshot?.scene === "play" && Object.isFrozen(snapshot.pickups),
    ).toBe(true);
    expect(
      snapshot?.scene === "play" && Object.isFrozen(snapshot.pickups[0]),
    ).toBe(true);
    expect(snapshot?.scene === "play" && Object.isFrozen(snapshot.assets)).toBe(
      true,
    );
    expect(
      snapshot?.scene === "play" && Object.isFrozen(snapshot.scoring),
    ).toBe(true);
    expect(
      snapshot?.scene === "play" &&
        Object.isFrozen(snapshot.assets.usedTextureKeys),
    ).toBe(true);
    expect(snapshot?.scene).toBe("play");
    expect(snapshot?.scene === "play" ? snapshot.bossPhaseId : null).toBe(
      "dragon-spiral",
    );
    expect(Object.keys(bridge ?? {})).toEqual([
      "getSnapshot",
      "getBatch1Snapshot",
      "getBatch2Snapshot",
      "getBatch2FormationSnapshot",
      "getBatch2ProgressionSnapshot",
      "getBatch2NearestSnapshot",
      "getBatch2DefenseSnapshot",
      "getMixedV13ConformanceSnapshot",
      "getMixedV14ConformanceSnapshot",
    ]);

    removeReader();
    expect(bridge?.getSnapshot()).toBeNull();
  });
});
