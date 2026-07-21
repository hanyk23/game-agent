import { describe, expect, it, vi } from "vitest";

import {
  ClosedModifierTargetHostV1,
  DeliveryModifierTargetHostV1,
  type ModifierApplicationV1,
} from "../../src/modules/game-module-modifier-target-host.js";

function application(
  targetInstanceId: string,
  fieldId: ModifierApplicationV1["fieldId"],
  value: number,
): ModifierApplicationV1 {
  return Object.freeze({
    sequence: 1,
    emittedAtMs: 10,
    commitSequence: 1,
    commitEvidenceId: 1,
    eventOrdinal: 1,
    routeId: `pickup.${fieldId.replaceAll(".", "-")}`,
    targetInstanceId,
    fieldId,
    operation: "add",
    value,
  });
}

describe("ADR 0027 closed modifier target host", () => {
  it("clamps exact health and shield targets at receiver-owned bounds", () => {
    const healthEvidence = vi.fn();
    const health = new ClosedModifierTargetHostV1({
      configuration: {
        targetInstanceId: "player-health",
        fieldId: "combat.health.current",
        operation: "add",
        minimum: 0,
        maximum: 100,
        initial: 90,
      },
      nowMs: () => 12,
      publish: healthEvidence,
    });
    const shield = new ClosedModifierTargetHostV1({
      configuration: {
        targetInstanceId: "player-shield",
        fieldId: "combat.shield.current",
        operation: "add",
        minimum: 0,
        maximum: 25,
        initial: 0,
      },
      nowMs: () => 12,
    });

    expect(
      health.apply(application("player-health", "combat.health.current", 20)),
    ).toMatchObject({ current: 100, minimum: 0, maximum: 100 });
    expect(
      shield.apply(application("player-shield", "combat.shield.current", 30)),
    ).toMatchObject({ current: 25, minimum: 0, maximum: 25 });
    expect(healthEvidence).toHaveBeenCalledWith(
      expect.objectContaining({ revision: 0, emittedAtMs: 12, current: 100 }),
    );
  });

  it("rejects wrong instance, field, non-finite value, and non-integer count", () => {
    const target = new ClosedModifierTargetHostV1({
      configuration: {
        targetInstanceId: "spread",
        fieldId: "attack.projectile-count.bonus",
        operation: "add",
        minimum: 0,
        maximum: 3,
        initial: 0,
      },
      nowMs: () => 0,
    });
    expect(() =>
      target.apply(
        application("other-spread", "attack.projectile-count.bonus", 1),
      ),
    ).toThrow("exact target");
    expect(() =>
      target.apply(application("spread", "attack.damage.multiplier", 1)),
    ).toThrow("exact target");
    expect(() =>
      target.apply(
        application("spread", "attack.projectile-count.bonus", Infinity),
      ),
    ).toThrow();
    expect(() =>
      target.apply(application("spread", "attack.projectile-count.bonus", 1.5)),
    ).toThrow("safe integer");
    expect(target.current).toBe(0);
  });

  it("takes one immutable request snapshot and never mutates active entities", () => {
    const delivery = new DeliveryModifierTargetHostV1({
      targetInstanceId: "spread",
      baseCount: 2,
      baseDamage: 10,
      maximumCountBonus: 3,
      maximumDamageMultiplier: 2,
      maxActive: 5,
      nowMs: () => 20,
    });
    delivery.apply(application("spread", "attack.damage.multiplier", 0.5));
    delivery.apply(application("spread", "attack.projectile-count.bonus", 1));
    const firstRequest = delivery.snapshotRequest();
    const activeEntity = Object.freeze({
      entityId: "projectile-one",
      damage: firstRequest.effectiveDamage,
    });

    delivery.apply(application("spread", "attack.damage.multiplier", 99));
    delivery.apply(application("spread", "attack.projectile-count.bonus", 99));
    const secondRequest = delivery.snapshotRequest();

    expect(firstRequest).toEqual({
      damageBonus: 0.5,
      countBonus: 1,
      effectiveCount: 3,
      effectiveDamage: 15,
    });
    expect(Object.isFrozen(firstRequest)).toBe(true);
    expect(activeEntity).toEqual({
      entityId: "projectile-one",
      damage: 15,
    });
    expect(secondRequest).toEqual({
      damageBonus: 1,
      countBonus: 3,
      effectiveCount: 5,
      effectiveDamage: 20,
    });
  });

  it("rejects one-over maximum-effective-count capacity", () => {
    expect(
      () =>
        new DeliveryModifierTargetHostV1({
          targetInstanceId: "spread",
          baseCount: 3,
          baseDamage: 10,
          maximumCountBonus: 2,
          maximumDamageMultiplier: 2,
          maxActive: 4,
          nowMs: () => 0,
        }),
    ).toThrow("configuration");
  });
});
