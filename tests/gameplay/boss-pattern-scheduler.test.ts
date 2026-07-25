import { describe, expect, it } from "vitest";

import { planBossPatternSchedule } from "../../src/gameplay/boss-pattern-scheduler.js";
import type { SupportedBulletPattern } from "../../src/gameplay/bullet-pattern-planner.js";

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

describe("Boss pattern scheduler", () => {
  it("preserves phase order and derives bounded independent emissions", () => {
    const schedule = planBossPatternSchedule(
      {
        id: "mixed",
        healthThreshold: 1,
        patternIds: ["wave", "aimed"],
        moveSpeed: 0,
      },
      patterns,
    );

    expect(schedule).toEqual([
      {
        phasePatternIndex: 0,
        patternIndex: 1,
        patternId: "wave",
        intervalMs: 400,
        durationMs: 1_000,
        emissionCount: 3,
      },
      {
        phasePatternIndex: 1,
        patternIndex: 0,
        patternId: "aimed",
        intervalMs: 250,
        durationMs: 1_000,
        emissionCount: 5,
      },
    ]);
    expect(Object.isFrozen(schedule)).toBe(true);
    expect(Object.isFrozen(schedule[0])).toBe(true);
  });

  it("keeps duplicate configured entries as independent deterministic emitters", () => {
    const schedule = planBossPatternSchedule(
      {
        id: "double",
        healthThreshold: 1,
        patternIds: ["aimed", "aimed"],
        moveSpeed: 0,
      },
      patterns,
    );

    expect(schedule.map((entry) => entry.phasePatternIndex)).toEqual([0, 1]);
    expect(schedule.map((entry) => entry.patternId)).toEqual([
      "aimed",
      "aimed",
    ]);
  });

  it("fails closed when a referenced pattern is absent", () => {
    expect(() =>
      planBossPatternSchedule(
        {
          id: "broken",
          healthThreshold: 1,
          patternIds: ["missing"],
          moveSpeed: 0,
        },
        patterns,
      ),
    ).toThrow("Missing Boss bullet pattern: missing");
  });
});
