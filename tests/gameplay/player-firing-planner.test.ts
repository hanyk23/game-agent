import { describe, expect, it } from "vitest";

import {
  planPlayerFiring,
  planPlayerWeaponEmission,
  scheduledPlayerFireMs,
} from "../../src/gameplay/player-firing-planner.js";

describe("player firing planner", () => {
  const weapons = [
    {
      id: "fast-single",
      fireIntervalMs: 100,
      projectileSpeed: 800,
      damage: 2,
      projectileCount: 1,
    },
    {
      id: "slow-triple",
      fireIntervalMs: 250,
      projectileSpeed: 500,
      damage: 5,
      projectileCount: 3,
    },
  ];

  it("plans every weapon in stable Spec order with independent schedules", () => {
    const plan = planPlayerFiring(weapons);

    expect(plan.map((weapon) => weapon.weaponId)).toEqual([
      "fast-single",
      "slow-triple",
    ]);
    expect(plan.map((weapon) => weapon.sourceIndex)).toEqual([0, 1]);
    expect(scheduledPlayerFireMs(plan[0]!, 2)).toBe(300);
    expect(scheduledPlayerFireMs(plan[1]!, 2)).toBe(750);
    expect(Object.isFrozen(plan)).toBe(true);
    expect(plan.every(Object.isFrozen)).toBe(true);
  });

  it("applies speed, damage, and a symmetric projectile count", () => {
    const weapon = planPlayerFiring(weapons)[1]!;
    const emission = planPlayerWeaponEmission(weapon, {
      currentActiveProjectiles: 2,
      maxActiveProjectiles: 10,
    });

    expect(emission).toEqual({
      weaponId: "slow-triple",
      requestedCount: 3,
      droppedCount: 0,
      spawns: [
        { projectileIndex: 0, offsetX: -14, velocityY: -500, damage: 5 },
        { projectileIndex: 1, offsetX: 0, velocityY: -500, damage: 5 },
        { projectileIndex: 2, offsetX: 14, velocityY: -500, damage: 5 },
      ],
    });
    expect(Object.isFrozen(emission)).toBe(true);
    expect(Object.isFrozen(emission.spawns)).toBe(true);
    expect(emission.spawns.every(Object.isFrozen)).toBe(true);
  });

  it("clips a salvo to the remaining global player-projectile budget", () => {
    const weapon = planPlayerFiring(weapons)[1]!;
    const emission = planPlayerWeaponEmission(weapon, {
      currentActiveProjectiles: 9,
      maxActiveProjectiles: 10,
    });

    expect(emission.requestedCount).toBe(3);
    expect(emission.spawns).toEqual([
      { projectileIndex: 0, offsetX: 0, velocityY: -500, damage: 5 },
    ]);
    expect(emission.droppedCount).toBe(2);
  });

  it("fails closed for invalid standalone input", () => {
    expect(() => planPlayerFiring([])).toThrow("At least one weapon");
    expect(() =>
      planPlayerFiring([{ ...weapons[0]!, projectileCount: 0 }]),
    ).toThrow("projectileCount");
    const weapon = planPlayerFiring(weapons)[0]!;
    expect(() =>
      planPlayerWeaponEmission(weapon, {
        currentActiveProjectiles: 11,
        maxActiveProjectiles: 10,
      }),
    ).toThrow("exceeds");
  });
});
