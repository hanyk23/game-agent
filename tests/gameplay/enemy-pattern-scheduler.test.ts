import { describe, expect, it } from "vitest";

import type { SupportedBulletPattern } from "../../src/gameplay/bullet-pattern-planner.js";
import { planEnemyPatternSchedule } from "../../src/gameplay/enemy-pattern-scheduler.js";

const patterns: SupportedBulletPattern[] = [
  {
    id: "aimed",
    pattern: "aimed",
    bulletCount: 3,
    speed: 200,
    intervalMs: 250,
    durationMs: 1_000,
    color: "#ffffff",
  },
  {
    id: "wave",
    pattern: "wave",
    bulletCount: 5,
    speed: 180,
    intervalMs: 400,
    durationMs: 1_000,
    color: "#66ccff",
  },
];

const wave = {
  id: "gunners",
  enemyAssetQueryId: "enemy",
  startMs: 0,
  durationMs: 2_000,
  spawnIntervalMs: 500,
  maxAlive: 3,
  health: 20,
  moveSpeed: 80,
  patternIds: ["wave", "aimed"],
  scoreValue: 100,
};

describe("enemy pattern scheduler", () => {
  it("preserves configured order and bounds each independent emitter", () => {
    const schedule = planEnemyPatternSchedule(wave, patterns);

    expect(schedule).toEqual([
      {
        wavePatternIndex: 0,
        patternIndex: 1,
        patternId: "wave",
        intervalMs: 400,
        durationMs: 1_000,
        emissionCount: 3,
      },
      {
        wavePatternIndex: 1,
        patternIndex: 0,
        patternId: "aimed",
        intervalMs: 250,
        durationMs: 1_000,
        emissionCount: 5,
      },
    ]);
    expect(Object.isFrozen(schedule)).toBe(true);
    expect(schedule.every(Object.isFrozen)).toBe(true);
  });

  it("keeps duplicate IDs as explicit independent emitters", () => {
    const schedule = planEnemyPatternSchedule(
      { ...wave, patternIds: ["aimed", "aimed"] },
      patterns,
    );

    expect(schedule.map((entry) => entry.wavePatternIndex)).toEqual([0, 1]);
    expect(schedule.map((entry) => entry.patternId)).toEqual([
      "aimed",
      "aimed",
    ]);
  });

  it("allows non-firing waves and fails closed on missing references", () => {
    expect(
      planEnemyPatternSchedule({ ...wave, patternIds: [] }, patterns),
    ).toEqual([]);
    expect(() =>
      planEnemyPatternSchedule({ ...wave, patternIds: ["missing"] }, patterns),
    ).toThrow("Missing enemy-wave bullet pattern for gunners: missing");
  });
});
