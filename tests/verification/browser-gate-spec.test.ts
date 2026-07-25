import { describe, expect, it } from "vitest";

import { parseShooterGameSpec } from "../../src/requirements/shooter-game-spec.js";
import { createBrowserGateSpec } from "../../src/verification/browser-gate-spec.js";

describe("browser gate spec", () => {
  it("stresses new patterns through Boss and source-aware enemy-wave schedules", () => {
    const spec = parseShooterGameSpec(createBrowserGateSpec());

    expect(spec.viewport.maxEnemyBullets).toBe(20);
    expect(spec.bulletPatterns.map((pattern) => pattern.pattern)).toEqual([
      "aimed",
      "wave",
      "rain",
      "rotatingRing",
      "burst",
    ]);
    expect(spec.boss.phases.flatMap((phase) => phase.patternIds)).toEqual(
      spec.bulletPatterns.map((pattern) => pattern.id),
    );
    expect(spec.boss.phases[0]?.patternIds).toEqual([
      "browser-aimed",
      "browser-wave",
    ]);
    expect(spec.boss.phases).toHaveLength(4);
    expect(
      spec.enemyWaves.find((wave) => wave.id === "browser-gunners")?.patternIds,
    ).toEqual(["browser-aimed", "browser-wave"]);
    expect(
      spec.bulletPatterns.some(
        (pattern) => pattern.bulletCount === spec.viewport.maxEnemyBullets,
      ),
    ).toBe(false);
    expect(
      spec.bulletPatterns.every(
        (pattern) => pattern.bulletCount < spec.viewport.maxEnemyBullets,
      ),
    ).toBe(true);
  });
});
