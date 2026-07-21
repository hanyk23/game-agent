import { describe, expect, it } from "vitest";

import {
  applyPickupEffect,
  applyShieldedPlayerDamage,
  canSpawnPickup,
  planPickupSchedule,
  type PickupEffectState,
} from "../../src/gameplay/pickup-planner.js";

const state = (
  overrides: Partial<PickupEffectState> = {},
): PickupEffectState => ({
  health: 3,
  maxHealth: 5,
  weaponPowerBonus: 0,
  shieldStrength: 0,
  score: 100,
  ...overrides,
});

describe("pickup planner", () => {
  it("plans every pickup in stable Spec order", () => {
    const plan = planPickupSchedule([
      { id: "heal-orb", effect: "heal", value: 2 },
      { id: "power-orb", effect: "weaponPower", value: 1.5 },
    ]);

    expect(plan).toEqual([
      {
        sourceIndex: 0,
        pickupId: "heal-orb",
        effect: "heal",
        value: 2,
        spawnMs: 250,
        fallSpeed: 180,
      },
      {
        sourceIndex: 1,
        pickupId: "power-orb",
        effect: "weaponPower",
        value: 1.5,
        spawnMs: 500,
        fallSpeed: 180,
      },
    ]);
    expect(Object.isFrozen(plan)).toBe(true);
    expect(plan.every(Object.isFrozen)).toBe(true);
  });

  it("enforces the global active-pickup budget", () => {
    expect(canSpawnPickup(2, 3)).toBe(true);
    expect(canSpawnPickup(3, 3)).toBe(false);
    expect(() => canSpawnPickup(4, 3)).toThrow("exceeds");
  });

  it("applies all four effects without mutating the input state", () => {
    const initial = state();
    const healed = applyPickupEffect({ effect: "heal", value: 4 }, initial);
    const powered = applyPickupEffect(
      { effect: "weaponPower", value: 2.5 },
      initial,
    );
    const shielded = applyPickupEffect({ effect: "shield", value: 3 }, initial);
    const scored = applyPickupEffect(
      { effect: "scoreBonus", value: 250 },
      initial,
    );

    expect(healed.state.health).toBe(5);
    expect(healed.appliedValue).toBe(2);
    expect(powered.state.weaponPowerBonus).toBe(2.5);
    expect(shielded.state.shieldStrength).toBe(3);
    expect(scored.state.score).toBe(350);
    expect(initial).toEqual(state());
    expect(Object.isFrozen(healed)).toBe(true);
    expect(Object.isFrozen(healed.state)).toBe(true);
  });

  it("uses shield strength before player health", () => {
    expect(
      applyShieldedPlayerDamage({ health: 5, shieldStrength: 0.5 }, 1),
    ).toEqual({ health: 4.5, shieldStrength: 0, absorbedDamage: 0.5 });
    expect(
      applyShieldedPlayerDamage({ health: 5, shieldStrength: 2 }, 1),
    ).toEqual({ health: 5, shieldStrength: 1, absorbedDamage: 1 });
  });

  it("fails closed for invalid standalone input", () => {
    expect(() =>
      planPickupSchedule([{ id: "broken", effect: "heal", value: 0 }]),
    ).toThrow("value");
    expect(() =>
      applyPickupEffect({ effect: "heal", value: 1 }, state({ health: 6 })),
    ).toThrow("exceeds");
  });
});
