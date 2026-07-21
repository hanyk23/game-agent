import { demoShooterGameSpec } from "../../game-template/vertical-shooter/spec/demo-spec.js";
import type { ShooterGameSpec } from "../requirements/shooter-game-spec.js";

export function createBrowserGateSpec(): ShooterGameSpec {
  const spec: ShooterGameSpec = structuredClone(demoShooterGameSpec);
  spec.title = "Browser Gate Vertical Shooter";
  spec.theme = "space science fiction";
  spec.visualStyle = ["vector", "clean"];
  spec.assetQueries.push(
    {
      id: "background-starfield",
      category: "background",
      theme: "space arcade starfield",
      visualStyle: ["pixel-art", "retro"],
      tags: ["background", "stars"],
      preferredColors: ["#07111f"],
      requiresTransparency: false,
    },
    {
      id: "enemy-laser",
      category: "enemy-projectile",
      theme: "red space laser",
      visualStyle: ["vector", "glow"],
      tags: ["projectile", "laser", "red"],
      preferredColors: ["#ff6677"],
      requiresTransparency: true,
    },
    {
      id: "ui-hud-panel",
      category: "ui",
      theme: "space science fiction glass panel",
      visualStyle: ["vector", "clean"],
      tags: ["ui", "panel", "glass", "hud"],
      preferredColors: ["#dadce7"],
      requiresTransparency: true,
    },
    {
      id: "effect-pickup-ring",
      category: "effect",
      theme: "space energy ring",
      visualStyle: ["raster", "particle", "soft"],
      tags: ["effect", "ring", "energy", "shield"],
      preferredColors: ["#e0e0e0"],
      requiresTransparency: true,
    },
  );
  spec.assetQueries = spec.assetQueries.map((query) => {
    const overrides: Partial<
      Record<
        ShooterGameSpec["assetQueries"][number]["category"],
        { theme: string; visualStyle: string[]; tags: string[] }
      >
    > = {
      player: {
        theme: "blue space ship",
        visualStyle: ["vector", "clean"],
        tags: ["ship", "blue"],
      },
      "player-projectile": {
        theme: "blue space laser",
        visualStyle: ["vector", "glow"],
        tags: ["projectile", "laser", "blue"],
      },
      enemy: {
        theme: "space science fiction enemy",
        visualStyle: ["vector", "clean"],
        tags: ["enemy", "ship"],
      },
      boss: {
        theme: "space science fiction ufo",
        visualStyle: ["vector", "clean"],
        tags: ["boss", "ufo"],
      },
      pickup: {
        theme: "space science fiction shield",
        visualStyle: ["vector", "clean"],
        tags: ["pickup", "shield"],
      },
    };
    const override = overrides[query.category];
    return override === undefined ? query : { ...query, ...override };
  });
  Object.assign(spec.enemyWaves[0]!, {
    id: "browser-opening",
    durationMs: 1_000,
    spawnIntervalMs: 300,
    maxAlive: 2,
    health: 2,
    moveSpeed: 80,
    scoreValue: 25,
  });
  spec.enemyWaves.push({
    ...spec.enemyWaves[0]!,
    id: "browser-dive",
    startMs: 1_200,
    durationMs: 1_000,
    spawnIntervalMs: 200,
    maxAlive: 4,
    health: 7,
    moveSpeed: 220,
    scoreValue: 75,
  });
  spec.enemyWaves.push({
    ...spec.enemyWaves[0]!,
    id: "browser-gunners",
    startMs: 400,
    durationMs: 1_500,
    spawnIntervalMs: 700,
    maxAlive: 2,
    health: 500,
    moveSpeed: 60,
    patternIds: ["browser-aimed", "browser-wave"],
    scoreValue: 75,
  });
  spec.player.maxHealth = 20;
  spec.player.hitboxRadius = 4;
  spec.viewport.maxEnemyBullets = 20;
  spec.scoring = {
    comboWindowMs: 10_000,
    comboMultiplierCap: 3,
    grazePoints: 40,
  };
  spec.pickups = [
    {
      id: "browser-shield",
      assetQueryId: "pickup-heal",
      effect: "shield",
      value: 2,
    },
    {
      id: "browser-power",
      assetQueryId: "pickup-heal",
      effect: "weaponPower",
      value: 3,
    },
    {
      id: "browser-score",
      assetQueryId: "pickup-heal",
      effect: "scoreBonus",
      value: 500,
    },
    {
      id: "browser-heal",
      assetQueryId: "pickup-heal",
      effect: "heal",
      value: 2,
    },
  ];
  spec.weapons[0]!.damage = 20;
  spec.weapons.push({
    ...spec.weapons[0]!,
    id: "browser-twin-shot",
    fireIntervalMs: 260,
    projectileSpeed: 520,
    damage: 7,
    projectileCount: 2,
  });
  spec.boss.maxHealth = 2_400;
  spec.boss.phases = [
    {
      id: "browser-aimed-wave",
      healthThreshold: 1,
      patternIds: ["browser-aimed", "browser-wave"],
      moveSpeed: 0,
    },
    {
      id: "browser-rain",
      healthThreshold: 0.7,
      patternIds: ["browser-rain"],
      moveSpeed: 0,
    },
    {
      id: "browser-rotating-ring",
      healthThreshold: 0.45,
      patternIds: ["browser-rotating-ring"],
      moveSpeed: 0,
    },
    {
      id: "browser-burst",
      healthThreshold: 0.2,
      patternIds: ["browser-burst"],
      moveSpeed: 0,
    },
  ];
  spec.bulletPatterns = [
    {
      id: "browser-aimed",
      pattern: "aimed",
      bulletCount: 9,
      speed: 260,
      intervalMs: 250,
      durationMs: 10_000,
      color: "#ff6677",
      aimSpreadDegrees: 20,
    },
    {
      id: "browser-wave",
      pattern: "wave",
      bulletCount: 7,
      speed: 220,
      intervalMs: 280,
      durationMs: 10_000,
      color: "#66ccff",
      aimSpreadDegrees: 60,
    },
    {
      id: "browser-rain",
      pattern: "rain",
      bulletCount: 8,
      speed: 300,
      intervalMs: 260,
      durationMs: 10_000,
      color: "#99ddff",
      aimSpreadDegrees: 50,
    },
    {
      id: "browser-rotating-ring",
      pattern: "rotatingRing",
      bulletCount: 10,
      speed: 240,
      intervalMs: 300,
      durationMs: 10_000,
      color: "#cc66ff",
      rotationSpeed: 0.25,
    },
    {
      id: "browser-burst",
      pattern: "burst",
      bulletCount: 12,
      speed: 340,
      intervalMs: 400,
      durationMs: 10_000,
      color: "#ffdc6e",
      aimSpreadDegrees: 24,
    },
  ];
  spec.loseCondition = { type: "timeExpired", limitMs: 30_000 };
  return spec;
}
