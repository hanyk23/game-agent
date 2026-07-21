import { describe, expect, it } from "vitest";

import {
  planEnemySpawnX,
  planEnemyWaveSchedule,
  scheduledEnemySpawnMs,
} from "../../src/gameplay/enemy-wave-scheduler.js";

describe("enemy wave scheduler", () => {
  it("places each wave's first enemy on center and rotates stable lanes", () => {
    expect(planEnemySpawnX(540, 0, 0)).toBe(270);
    expect(planEnemySpawnX(540, 1, 0)).toBe(270);
    expect([
      planEnemySpawnX(540, 0, 1),
      planEnemySpawnX(540, 0, 2),
      planEnemySpawnX(540, 0, 3),
      planEnemySpawnX(540, 0, 4),
    ]).toEqual([149, 391, 88.5, 451.5]);
    expect(planEnemySpawnX(540, 0, 1)).toBe(planEnemySpawnX(540, 0, 1));
  });

  it("plans every wave in stable chronological order", () => {
    const schedule = planEnemyWaveSchedule([
      { id: "late", startMs: 2_000, durationMs: 1_000, spawnIntervalMs: 400 },
      { id: "opening-a", startMs: 0, durationMs: 1_000, spawnIntervalMs: 600 },
      { id: "opening-b", startMs: 0, durationMs: 1_500, spawnIntervalMs: 500 },
    ]);

    expect(schedule.map((wave) => wave.waveId)).toEqual([
      "opening-a",
      "opening-b",
      "late",
    ]);
    expect(schedule.map((wave) => wave.sourceIndex)).toEqual([1, 2, 0]);
    expect(Object.isFrozen(schedule)).toBe(true);
    expect(schedule.every(Object.isFrozen)).toBe(true);
  });

  it("uses an inclusive start and exclusive end for deterministic spawns", () => {
    const [wave] = planEnemyWaveSchedule([
      {
        id: "crosswind",
        startMs: 250,
        durationMs: 1_000,
        spawnIntervalMs: 400,
      },
    ]);

    expect(wave).toMatchObject({
      startMs: 250,
      endMs: 1_250,
      spawnCount: 3,
    });
    expect(
      [0, 1, 2].map((index) => scheduledEnemySpawnMs(wave!, index)),
    ).toEqual([250, 650, 1_050]);
    expect(() => scheduledEnemySpawnMs(wave!, 3)).toThrow("outside wave");
  });

  it("preserves overlapping windows without merging or truncating them", () => {
    const schedule = planEnemyWaveSchedule([
      { id: "slow", startMs: 0, durationMs: 3_000, spawnIntervalMs: 1_000 },
      { id: "fast", startMs: 1_000, durationMs: 1_500, spawnIntervalMs: 300 },
    ]);

    expect(schedule).toEqual([
      {
        sourceIndex: 0,
        waveId: "slow",
        startMs: 0,
        endMs: 3_000,
        spawnIntervalMs: 1_000,
        spawnCount: 3,
      },
      {
        sourceIndex: 1,
        waveId: "fast",
        startMs: 1_000,
        endMs: 2_500,
        spawnIntervalMs: 300,
        spawnCount: 5,
      },
    ]);
  });

  it("fails closed for invalid standalone planner input", () => {
    expect(() => planEnemyWaveSchedule([])).toThrow("At least one enemy wave");
    expect(() =>
      planEnemyWaveSchedule([
        { id: "broken", startMs: -1, durationMs: 1_000, spawnIntervalMs: 500 },
      ]),
    ).toThrow("startMs");
    expect(() =>
      planEnemyWaveSchedule([
        { id: "broken", startMs: 0, durationMs: 0, spawnIntervalMs: 500 },
      ]),
    ).toThrow("durationMs");
  });
});
