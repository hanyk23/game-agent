import { describe, expect, it } from "vitest";

import {
  planBulletEmission,
  type SupportedBulletPattern,
} from "../../src/gameplay/bullet-pattern-planner.js";

function pattern(
  overrides: Partial<SupportedBulletPattern> = {},
): SupportedBulletPattern {
  return {
    id: "test-pattern",
    pattern: "radial",
    bulletCount: 4,
    speed: 100,
    intervalMs: 500,
    durationMs: 5_000,
    color: "#ffffff",
    ...overrides,
  };
}

const unlimitedContext = {
  baseAngleRadians: 0,
  emissionIndex: 0,
  maxActiveBullets: 100,
  currentActiveBullets: 0,
};

describe("bullet pattern planner", () => {
  it("plans an evenly spaced radial emission", () => {
    const result = planBulletEmission(pattern(), unlimitedContext);

    expect(result.droppedCount).toBe(0);
    expect(result.spawns).toHaveLength(4);
    expect(result.spawns.map((spawn) => spawn.velocityX)).toEqual([
      100,
      expect.closeTo(0, 10),
      -100,
      expect.closeTo(0, 10),
    ]);
    expect(result.spawns.map((spawn) => spawn.velocityY)).toEqual([
      0,
      100,
      expect.closeTo(0, 10),
      -100,
    ]);
  });

  it("centers a fan on the requested base angle", () => {
    const result = planBulletEmission(
      pattern({ pattern: "fan", bulletCount: 3, arcDegrees: 90 }),
      { ...unlimitedContext, baseAngleRadians: Math.PI / 2 },
    );

    expect(result.spawns.map((spawn) => spawn.angleRadians)).toEqual([
      expect.closeTo(Math.PI / 4, 10),
      expect.closeTo(Math.PI / 2, 10),
      expect.closeTo((Math.PI * 3) / 4, 10),
    ]);
  });

  it("rotates spiral emissions deterministically by emission index", () => {
    const spiral = pattern({
      pattern: "spiral",
      bulletCount: 2,
      rotationSpeed: 0.25,
    });
    const result = planBulletEmission(spiral, {
      ...unlimitedContext,
      emissionIndex: 3,
    });

    expect(result.spawns[0]?.angleRadians).toBeCloseTo(0.75, 10);
    expect(result.spawns[1]?.angleRadians).toBeCloseTo(0.75 + Math.PI, 10);
    expect(result.spawns[0]?.spawnOffsetMs).toBe(1_500);
  });

  it.each([
    ["aimed", 30],
    ["rain", 40],
    ["burst", 10],
  ] as const)("centers the %s spread on the base angle", (kind, spread) => {
    const result = planBulletEmission(
      pattern({
        pattern: kind,
        bulletCount: 3,
        aimSpreadDegrees: spread,
      }),
      unlimitedContext,
    );

    expect(result.spawns[1]?.angleRadians).toBeCloseTo(0, 10);
  });

  it("oscillates wave emissions and rotates ring emissions", () => {
    const wave = planBulletEmission(
      pattern({ pattern: "wave", bulletCount: 1, aimSpreadDegrees: 40 }),
      { ...unlimitedContext, emissionIndex: 1 },
    );
    const ring = planBulletEmission(
      pattern({ pattern: "rotatingRing", rotationSpeed: 0.2 }),
      { ...unlimitedContext, emissionIndex: 2 },
    );

    expect(wave.spawns[0]?.angleRadians).toBeCloseTo(Math.PI / 9, 10);
    expect(ring.spawns[0]?.angleRadians).toBeCloseTo(0.4, 10);
  });

  it("enforces the global active-bullet budget", () => {
    const result = planBulletEmission(pattern({ bulletCount: 6 }), {
      ...unlimitedContext,
      maxActiveBullets: 10,
      currentActiveBullets: 8,
    });

    expect(result.requestedCount).toBe(6);
    expect(result.spawns).toHaveLength(2);
    expect(result.droppedCount).toBe(4);
  });

  it("fails closed for missing pattern parameters or invalid budgets", () => {
    expect(() =>
      planBulletEmission(
        pattern({ pattern: "fan", arcDegrees: undefined }),
        unlimitedContext,
      ),
    ).toThrow("Fan patterns require arcDegrees");
    expect(() =>
      planBulletEmission(
        pattern({ pattern: "spiral", rotationSpeed: undefined }),
        unlimitedContext,
      ),
    ).toThrow("Spiral patterns require rotationSpeed");
    expect(() =>
      planBulletEmission(pattern(), {
        ...unlimitedContext,
        maxActiveBullets: 3,
        currentActiveBullets: 4,
      }),
    ).toThrow("cannot exceed");
  });
});
