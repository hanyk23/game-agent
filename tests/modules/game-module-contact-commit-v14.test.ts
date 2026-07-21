import { describe, expect, it, vi } from "vitest";

import { ContactCommitCoordinatorV14 } from "../../src/modules/game-module-contact-commit-v14.js";
import { GraphTransitionGuard } from "../../src/modules/game-module-runtime-abi-v12.js";
import type { ContactDecisionPayloadV2 } from "../../src/modules/game-module-runtime-payloads.js";

function projectileDecision(): ContactDecisionPayloadV2 {
  return {
    candidate: {
      sequence: 0,
      emittedAtMs: 0,
      contactId: "projectile-root",
      contactSequence: 0,
      damage: 5,
      contactKind: "projectile-root",
      sourceChannelId: "player-projectiles",
      sourceEntityId: "projectile-one",
      sourceGeneration: 0,
      sourceActorId: "player-one",
      targetRootChannelId: "enemy-roots",
      targetActorId: "root/waves/0",
      targetActorGeneration: 0,
    },
    disposition: "damage",
    sourceOperation: "consume",
    damage: 5,
    routeId: "enemy-health",
  };
}

function rootDecision(): ContactDecisionPayloadV2 {
  return {
    candidate: {
      sequence: 1,
      emittedAtMs: 0,
      contactId: "root-player",
      contactSequence: 1,
      damage: 3,
      contactKind: "actor-root-player",
      sourceRootChannelId: "enemy-roots",
      sourceActorId: "root/waves/0",
      sourceActorGeneration: 0,
      targetActorId: "player-one",
    },
    disposition: "damage",
    sourceOperation: "deactivate-root",
    damage: 3,
    routeId: "player-health",
  };
}

function fixture(sourceResult = { physical: true, logical: true }) {
  const guard = new GraphTransitionGuard();
  const order: string[] = [];
  const quarantine = vi.fn();
  const host = new ContactCommitCoordinatorV14({
    guard,
    maximumConcurrentCommits: 2,
    projectileRootRouteId: "enemy-health",
    actorRootPlayerRouteId: "player-health",
    adapter: {
      consumeProjectile: () => {
        order.push("consume-projectile");
        return sourceResult;
      },
      deactivateRoot: () => {
        order.push("deactivate-root");
        return sourceResult;
      },
      quarantine,
    },
  });
  return { guard, host, order, quarantine };
}

describe("ADR 0028 V2 contact commit host", () => {
  it("commits both contact forms source-first in fixed delivery order", () => {
    for (const decision of [projectileDecision(), rootDecision()]) {
      const { guard, host, order } = fixture();
      guard.run("external-event", () =>
        guard.deliver(() =>
          host
            .prepare(decision, {
              deliverHitEvidence: () => order.push("hit"),
              deliverDamage: () => order.push("damage"),
            })
            .commit(),
        ),
      );
      expect(order).toEqual([
        decision.sourceOperation === "consume"
          ? "consume-projectile"
          : "deactivate-root",
        "hit",
        "damage",
      ]);
    }
  });

  it("quarantines indeterminate source mutation and emits no result", () => {
    const { guard, host, order, quarantine } = fixture({
      physical: false,
      logical: true,
    });
    const hit = vi.fn();
    const damage = vi.fn();
    const decision = projectileDecision();
    expect(() =>
      guard.run("external-event", () =>
        guard.deliver(() =>
          host
            .prepare(decision, {
              deliverHitEvidence: hit,
              deliverDamage: damage,
            })
            .commit(),
        ),
      ),
    ).toThrow(/indeterminate/);
    expect(order).toEqual(["consume-projectile"]);
    expect(hit).not.toHaveBeenCalled();
    expect(damage).not.toHaveBeenCalled();
    expect(quarantine).toHaveBeenCalledOnce();
    host.releaseQuarantined(decision);
  });

  it("attempts every post-source delivery and aggregates failures", () => {
    const { guard, host, order } = fixture();
    expect(() =>
      guard.run("external-event", () =>
        guard.deliver(() =>
          host
            .prepare(projectileDecision(), {
              deliverHitEvidence: () => {
                order.push("hit");
                throw new Error("hit failed");
              },
              deliverDamage: () => {
                order.push("damage");
                throw new Error("damage failed");
              },
            })
            .commit(),
        ),
      ),
    ).toThrow(AggregateError);
    expect(order).toEqual(["consume-projectile", "hit", "damage"]);
  });

  it("rejects route drift and expires abandoned prepares", () => {
    const { guard, host } = fixture();
    expect(() =>
      guard.run("external-event", () =>
        guard.deliver(() =>
          host.prepare(
            { ...projectileDecision(), routeId: "below-route-head" },
            { deliverHitEvidence: vi.fn(), deliverDamage: vi.fn() },
          ),
        ),
      ),
    ).toThrow(/lineage mismatch/);
    let prepared: ReturnType<typeof host.prepare> | undefined;
    guard.run("external-event", () =>
      guard.deliver(() => {
        prepared = host.prepare(projectileDecision(), {
          deliverHitEvidence: vi.fn(),
          deliverDamage: vi.fn(),
        });
      }),
    );
    expect(host.abortedPrepareCount).toBe(1);
    expect(() => prepared!.commit()).toThrow(/expired/);
  });

  it("requires the graph event guard", () => {
    const { host } = fixture();
    expect(() =>
      host.prepare(projectileDecision(), {
        deliverHitEvidence: vi.fn(),
        deliverDamage: vi.fn(),
      }),
    ).toThrow(/event token/);
  });
});
