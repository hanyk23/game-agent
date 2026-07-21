import { describe, expect, it, vi } from "vitest";

import type { ActorRootReferenceV1 } from "../../src/modules/game-module-actor-root-custody-host.js";
import { GraphBoundActorContactAuthorityAdapterV14 } from "../../src/modules/game-module-actor-contact-authority-adapter-v14.js";
import { ActorSetHealthBankHostV1 } from "../../src/modules/game-module-actor-set-combat-host.js";
import { ContactCommitCoordinatorV14 } from "../../src/modules/game-module-contact-commit-v14.js";
import type { ResolvedModuleGraphV14 } from "../../src/modules/game-module-resolver-v14.js";
import { GraphTransitionGuard } from "../../src/modules/game-module-runtime-abi-v12.js";
import type { ContactDecisionPayloadV2 } from "../../src/modules/game-module-runtime-payloads.js";

const root = (generation: number): ActorRootReferenceV1 =>
  Object.freeze({
    rootChannelId: "enemy-roots",
    actorId: "root/waves/0",
    actorGeneration: generation,
    actorRole: "enemy",
    sourceId: "scout",
    slotIndex: 0,
  });

function graph(): ResolvedModuleGraphV14 {
  return {
    graphVersion: "1.4.0",
    modules: [
      {
        instanceId: "enemy-health",
        moduleId: "combat.health",
        version: "1.2.0",
      },
      {
        instanceId: "projectile-root-contact",
        moduleId: "interaction.projectile-root-contact",
        version: "1.0.0",
      },
      {
        instanceId: "actor-root-contact",
        moduleId: "interaction.actor-root-contact",
        version: "1.0.0",
      },
      {
        instanceId: "contact-resolution",
        moduleId: "interaction.contact-resolution",
        version: "1.2.0",
      },
    ],
    actorSetDamageRoutes: [
      {
        routeId: "enemy.damage",
        rootChannelId: "enemy-roots",
        orderedSinkInstanceIds: ["enemy-health"],
      },
    ],
    actorRootMutationGrants: [
      {
        grantId: "enemy.body-contact.deactivate",
        rootChannelId: "enemy-roots",
        consumerInstanceId: "actor-root-contact",
        producerInstanceId: "enemy-roots-producer",
        operation: "deactivate-root",
      },
    ],
  } as unknown as ResolvedModuleGraphV14;
}

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
    routeId: "enemy.damage",
  };
}

function fixture(sourceResult = { physical: true, logical: true }) {
  let now = 0;
  const guard = new GraphTransitionGuard();
  const order: string[] = [];
  const hit = vi.fn(() => order.push("hit"));
  const damage = vi.fn(() => order.push("damage"));
  const health = new ActorSetHealthBankHostV1({
    rootChannelId: "enemy-roots",
    actorRole: "enemy",
    capacity: 1,
    maximumHealthBySourceId: { scout: 10 },
    nowMs: () => now,
  });
  const coordinator = new ContactCommitCoordinatorV14({
    guard,
    maximumConcurrentCommits: 2,
    projectileRootRouteId: "enemy.damage",
    actorRootPlayerRouteId: "player.damage",
    adapter: {
      consumeProjectile: () => {
        order.push("consume-projectile");
        return sourceResult;
      },
      deactivateRoot: () => {
        order.push("deactivate-root");
        return sourceResult;
      },
      quarantine: () => order.push("quarantine"),
    },
  });
  const registrations: string[] = [];
  const adapter = new GraphBoundActorContactAuthorityAdapterV14({
    graph: graph(),
    healthHosts: new Map([["enemy-health", health]]),
    candidateRegistrar: {
      register: (instanceId, kind) => {
        registrations.push(`${instanceId}:${kind}`);
      },
    },
    contactCoordinator: coordinator,
    deliveriesFor: (instanceId) => {
      expect(instanceId).toBe("contact-resolution");
      return {
        deliverHitEvidence: hit,
        deliverDamage: damage,
      };
    },
  });
  return {
    adapter,
    coordinator,
    guard,
    health,
    hit,
    damage,
    order,
    registrations,
    tick: () => {
      now += 1;
    },
  };
}

describe("Graph-bound Batch 3 actor/contact authority adapter", () => {
  it("binds route terminal/root lineage and resets health only on a new generation", () => {
    const { adapter, tick } = fixture();
    expect(adapter.activateRoot(root(0))).toEqual(
      expect.objectContaining({ current: 10, reason: "initialized" }),
    );
    tick();
    const depleted = adapter.adapters.actorSetHealth.damage(
      "enemy.damage",
      "enemy-health",
      {
        sequence: 0,
        emittedAtMs: 1,
        sourceEvidenceId: "contact:0",
        targetRootChannelId: "enemy-roots",
        targetActorId: "root/waves/0",
        targetActorGeneration: 0,
        amount: 10,
        damageKind: "projectile",
      },
    );
    expect(depleted.defeated).toBeDefined();
    adapter.pruneRoot(root(0));
    tick();
    expect(adapter.activateRoot(root(1))).toEqual(
      expect.objectContaining({ current: 10, reason: "initialized" }),
    );
    tick();
    expect(() =>
      adapter.adapters.actorSetHealth.damage("enemy.damage", "enemy-health", {
        sequence: 1,
        emittedAtMs: 3,
        sourceEvidenceId: "contact:1",
        targetRootChannelId: "enemy-roots",
        targetActorId: "root/waves/0",
        targetActorGeneration: 0,
        amount: 1,
        damageKind: "projectile",
      }),
    ).toThrow(/inactive, stale, or depleted/);
  });

  it("delegates only graph-matching contact candidate kinds", () => {
    const { adapter, registrations } = fixture();
    adapter.adapters.contactCandidates.register(
      "projectile-root-contact",
      "projectile-root",
      vi.fn(),
    );
    adapter.adapters.contactCandidates.register(
      "actor-root-contact",
      "actor-root-player",
      vi.fn(),
    );
    expect(registrations).toEqual([
      "projectile-root-contact:projectile-root",
      "actor-root-contact:actor-root-player",
    ]);
    expect(() =>
      adapter.adapters.contactCandidates.register(
        "projectile-root-contact",
        "actor-root-player",
        vi.fn(),
      ),
    ).toThrow(/undeclared graph-bound/);
  });

  it("keeps fixed host deliveries after the source-first commit", () => {
    const { adapter, guard, order } = fixture();
    guard.run("external-event", () =>
      guard.deliver(() =>
        adapter.adapters.contactCommitV2.commit(
          "contact-resolution",
          projectileDecision(),
        ),
      ),
    );
    expect(order).toEqual(["consume-projectile", "hit", "damage"]);
  });

  it("emits no fixed delivery when source custody is indeterminate", () => {
    const { adapter, coordinator, damage, guard, hit, order } = fixture({
      physical: false,
      logical: true,
    });
    expect(() =>
      guard.run("external-event", () =>
        guard.deliver(() =>
          adapter.adapters.contactCommitV2.commit(
            "contact-resolution",
            projectileDecision(),
          ),
        ),
      ),
    ).toThrow(/indeterminate/);
    expect(order).toEqual(["consume-projectile", "quarantine"]);
    expect(hit).not.toHaveBeenCalled();
    expect(damage).not.toHaveBeenCalled();
    coordinator.releaseQuarantined(projectileDecision());
  });

  it("rejects host and route closure drift before delegation", () => {
    const { adapter } = fixture();
    expect(() =>
      adapter.adapters.actorSetHealth.damage(
        "different.route",
        "enemy-health",
        {} as never,
      ),
    ).toThrow(/route\/terminal\/root lineage mismatch/);
    expect(
      () =>
        new GraphBoundActorContactAuthorityAdapterV14({
          graph: graph(),
          healthHosts: new Map(),
          candidateRegistrar: { register: () => undefined },
          contactCoordinator: {} as never,
          deliveriesFor: () => ({
            deliverHitEvidence: () => undefined,
            deliverDamage: () => undefined,
          }),
        }),
    ).toThrow(/invalid graph-bound actor-set health route/);
  });
});
