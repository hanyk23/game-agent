import { describe, expect, it } from "vitest";

import {
  BATCH3_ACTOR_CONTACT_DEFINITIONS,
  createBatch3ActorContactRegistry,
} from "../../src/modules/batch3-actor-contact-library.js";
import { createModuleArtifactHashDescriptor } from "../../src/modules/game-module-execution-contract.js";

async function factoryFor(index: number) {
  const definition = BATCH3_ACTOR_CONTACT_DEFINITIONS[index]!;
  const implementationBundle = new TextEncoder().encode(
    definition.implementationSource,
  );
  const artifact = createModuleArtifactHashDescriptor({
    manifest: definition.manifest,
    configurationDescriptor: definition.configurationDescriptor,
    reservationDescriptor: definition.reservationDescriptor,
    implementationBundle,
    dependencyLockIdentity: new TextEncoder().encode(
      "pnpm-lock.batch3.actor-contact.v1",
    ),
    toolchainIdentity: new TextEncoder().encode(
      "typescript-5.9.3.esm-self-contained.batch3.actor-contact.v1",
    ),
  });
  const registry = await createBatch3ActorContactRegistry();
  return registry.findExactProductionV14(
    definition.manifest.moduleId,
    definition.manifest.version,
    artifact.envelopeSha256,
  )!.executableHandle!.loadedExport as (context: any) => any;
}

describe("Batch 3 actor-set and source-first contact production catalog", () => {
  it("loader-admits exactly the five design-frozen definitions", async () => {
    const registry = await createBatch3ActorContactRegistry();
    expect(registry).toBeDefined();
    expect(
      BATCH3_ACTOR_CONTACT_DEFINITIONS.map(
        ({ manifest }) => `${manifest.moduleId}@${manifest.version}`,
      ),
    ).toEqual([
      "combat.health@1.2.0",
      "interaction.projectile-root-contact@1.0.0",
      "interaction.actor-root-contact@1.0.0",
      "interaction.contact-default-damage@1.1.0",
      "interaction.contact-resolution@1.2.0",
    ]);
    for (const definition of BATCH3_ACTOR_CONTACT_DEFINITIONS) {
      expect(definition.manifest.schemaVersion).toBe("1.4.0");
      expect(definition.implementationSource).toContain(
        "export function create",
      );
    }
  });

  it("declares actor-set and body-contact authority without local custody", () => {
    const [health, projectileContact, bodyContact] =
      BATCH3_ACTOR_CONTACT_DEFINITIONS;
    expect(health!.manifest.actorSetDamageSink).toEqual({
      rootChannelInputPort: "roots",
      damageInputPort: "damage",
      healthStateOutputPort: "health",
      defeatedOutputPort: "defeated",
      maximumEntriesSource: "resolved-root-channel-capacity",
    });
    expect(projectileContact!.manifest.actorRootConsumers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ purpose: "projectile-target" }),
      ]),
    );
    expect(bodyContact!.manifest.actorRootContactConsumer).toEqual({
      rootChannelInputPort: "roots",
      candidateOutputPort: "candidates",
      admittedSourceOperation: "deactivate-root",
    });
    for (const definition of [health, projectileContact, bodyContact])
      expect(definition!.manifest.actorRootProducer).toBeNull();
  });

  it("routes host-owned actor-set transitions through exact output ports", async () => {
    const create = await factoryFor(0);
    const handlers = new Map<string, (value: any) => unknown>();
    const states: unknown[] = [];
    const defeats: unknown[] = [];
    const transition = {
      state: { current: 0, maximum: 5, reason: "depleted" },
      defeated: { actorId: "root/waves/0", actorGeneration: 0 },
    };
    const participant = create({
      identity: { instanceId: "enemy-health" },
      configuration: {
        damageRouteId: "enemy.damage",
        maximumHealthBySourceId: { scout: 5 },
      },
      services: {
        actorSetHealth: {
          damage: (routeId: string, payload: unknown) => {
            expect(routeId).toBe("enemy.damage");
            expect(payload).toEqual({ amount: 5 });
            return transition;
          },
          snapshot: () => ({ entries: [] }),
        },
        observation: { register: () => undefined },
      },
      ports: {
        declareHandler: (id: string, handler: (value: any) => unknown) =>
          handlers.set(id, handler),
        publishState: (_id: string, value: unknown) => states.push(value),
        emitEvent: (_id: string, value: unknown) => defeats.push(value),
      },
    });
    participant.initialize();
    handlers.get("damage")!({ amount: 5 });
    expect(states).toEqual([transition.state]);
    expect(defeats).toEqual([transition.defeated]);
    expect(() =>
      create({
        identity: { instanceId: "invalid-health" },
        configuration: { damageRouteId: "enemy.damage" },
        services: {},
        ports: { declareHandler: () => undefined },
      }),
    ).toThrow(/missing actor-set health service/);
  });

  it("maps both V2 candidates to the only admitted source operations", async () => {
    const create = await factoryFor(3);
    const handlers = new Map<string, (value: any) => unknown>();
    const decisions: any[] = [];
    create({
      identity: { instanceId: "default-damage" },
      configuration: {
        projectileRootRouteId: "enemy.damage",
        actorRootPlayerRouteId: "player.damage",
      },
      ports: {
        declareHandler: (id: string, handler: (value: any) => unknown) =>
          handlers.set(id, handler),
        emitEvent: (_id: string, value: unknown) => decisions.push(value),
      },
    });
    handlers.get("candidates")!({ contactKind: "projectile-root", damage: 4 });
    handlers.get("candidates")!({
      contactKind: "actor-root-player",
      damage: 7,
    });
    expect(decisions).toEqual([
      expect.objectContaining({
        sourceOperation: "consume",
        routeId: "enemy.damage",
        damage: 4,
      }),
      expect.objectContaining({
        sourceOperation: "deactivate-root",
        routeId: "player.damage",
        damage: 7,
      }),
    ]);
  });

  it("accepts projectile-root candidates through the exact overlap detector", async () => {
    const create = await factoryFor(1);
    const handlers = new Map<string, (value: any) => unknown>();
    const candidates: unknown[] = [];
    let contactHandler: ((value: any) => unknown) | undefined;
    const participant = create({
      identity: { instanceId: "projectile-root-contact" },
      configuration: { maximumTrackedContacts: 4 },
      services: {
        overlaps: {
          register: (ruleId: string, handler: (value: any) => unknown) => {
            expect(ruleId).toBe("projectile.overlap");
            contactHandler = handler;
            return () => {
              contactHandler = undefined;
            };
          },
        },
        observation: { register: () => () => undefined },
      },
      clock: { nowMs: () => 24 },
      ports: {
        declareHandler: (id: string, handler: (value: any) => unknown) =>
          handlers.set(id, handler),
        emitEvent: (_id: string, value: unknown) => candidates.push(value),
      },
    });
    participant.initialize();
    participant.start();
    handlers.get("projectiles")!({
      channelId: "player-delivery.projectiles",
      ownerActorId: "player-one",
    });
    handlers.get("roots")!({ rootChannelId: "enemy-roots" });
    contactHandler!({
      sourceEntityId: "projectile-1",
      sourceGeneration: 2,
      targetActorId: "root/enemy/0",
      targetActorGeneration: 3,
      damage: 4,
    });
    expect(candidates).toEqual([
      expect.objectContaining({
        contactKind: "projectile-root",
        sourceChannelId: "player-delivery.projectiles",
        targetRootChannelId: "enemy-roots",
        targetActorGeneration: 3,
        damage: 4,
      }),
    ]);
    participant.stop();
    expect(contactHandler).toBeUndefined();
  });

  it("delegates source-first result delivery entirely to the V2 host", async () => {
    const create = await factoryFor(4);
    const handlers = new Map<string, (value: any) => unknown>();
    const committed: unknown[] = [];
    create({
      identity: { instanceId: "resolution" },
      configuration: { maximumResolvedContacts: 4 },
      services: {
        contactCommitV2: {
          commit: () => {
            committed.push("source-commit");
            return { evidenceId: 9 };
          },
        },
        observation: { register: () => undefined },
      },
      clock: { nowMs: () => 16 },
      ports: {
        declareHandler: (id: string, handler: (value: any) => unknown) =>
          handlers.set(id, handler),
        emitEvent: () => {
          throw new Error("factory must not duplicate host-owned delivery");
        },
      },
    });
    handlers.get("decisions")!({
      candidate: {
        contactKind: "projectile-root",
        contactSequence: 2,
        sourceEntityId: "projectile-1",
        sourceActorId: "player-one",
        targetActorId: "root/waves/0",
        targetActorGeneration: 0,
        targetRootChannelId: "enemy-roots",
      },
      damage: 3,
    });
    expect(committed).toEqual(["source-commit"]);
  });
});
