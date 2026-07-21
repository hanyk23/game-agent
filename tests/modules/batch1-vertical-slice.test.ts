import { describe, expect, it, vi } from "vitest";

import {
  BATCH1_MODULE_DEFINITIONS,
  createBatch1ProductionRegistry,
} from "../../src/modules/batch1-gameplay-library.js";
import {
  BATCH1_VERTICAL_SLICE_ASSEMBLY,
  BATCH1_VERTICAL_SLICE_ASSET_EVIDENCE,
} from "../../src/modules/batch1-vertical-slice.js";
import { generateBrowserRuntimeCatalogV12 } from "../../src/modules/game-module-runtime-catalog-generator.js";
import { DeterministicGameModuleProductionInstantiatorV12 } from "../../src/modules/game-module-production-instantiator.js";
import {
  resolveGameAssemblyV12,
  type ResolvedModuleGraphV12,
} from "../../src/modules/game-module-resolver.js";
import {
  ContactDecisionPayloadSchema,
  type ContactCandidatePayload,
} from "../../src/modules/game-module-runtime-payloads.js";
import {
  ContactCommitCoordinatorV12,
  type DeterministicGameModuleRuntimeV12,
} from "../../src/modules/game-module-runtime-abi-v12.js";

type InputHandler = (input: unknown) => unknown;

async function createSliceHarness() {
  const registry = await createBatch1ProductionRegistry();
  const result = resolveGameAssemblyV12(
    BATCH1_VERTICAL_SLICE_ASSEMBLY,
    registry,
    BATCH1_VERTICAL_SLICE_ASSET_EVIDENCE,
  );
  const catalog = generateBrowserRuntimeCatalogV12(result.graph, registry);
  const inputs = new Map<string, InputHandler>();
  const overlaps = new Map<string, InputHandler>();
  const observations = new Map<string, () => unknown>();
  const active = new Map<string, Record<string, unknown>>();
  const actors = {
    "player-one": {
      actorId: "player-one",
      active: true,
      position: { x: 360, y: 600 },
      velocity: { x: 0, y: 0 },
    },
    "enemy-one": {
      actorId: "enemy-one",
      active: true,
      position: { x: 360, y: 180 },
      velocity: { x: 0, y: 0 },
    },
  };
  let runtime!: DeterministicGameModuleRuntimeV12;
  const coordinators = new Map<string, ContactCommitCoordinatorV12>();
  const policyModule = result.graph.modules.find(
    (module) => module.instanceId === "default-policy",
  )!;
  const transform = catalog.findForGraph(
    result.graph,
    policyModule.instanceId,
  ).executable;

  runtime = DeterministicGameModuleProductionInstantiatorV12.create({
    graph: result.graph,
    catalog,
    createContext: (module, clock) => {
      const actor = actors[module.ownerId as keyof typeof actors];
      return Object.freeze({
        identity: Object.freeze({
          instanceId: module.instanceId,
          ownerId: module.ownerId,
          moduleId: module.moduleId,
          version: module.version,
          artifactEnvelopeSha256: module.artifactIdentity!.envelopeSha256,
        }),
        configuration: module.configuration as Readonly<unknown>,
        services: Object.freeze({
          viewport: Object.freeze({
            read: () => ({ width: 720, height: 720 }),
          }),
          actors: Object.freeze({
            readOwner: () => actor,
            writeOwnerMotion: (motion: Readonly<{ x: number; y: number }>) => {
              actor.velocity = { ...motion };
            },
            writeOwnerPosition: (
              position: Readonly<{ x: number; y: number }>,
            ) => {
              actor.position = { ...position };
            },
          }),
          input: Object.freeze({
            register: (id: string, handler: InputHandler) => {
              const key = `${module.instanceId}:${id}`;
              inputs.set(key, handler);
              return () => inputs.delete(key);
            },
          }),
          overlaps: Object.freeze({
            register: (id: string, handler: InputHandler) => {
              const key = `${module.instanceId}:${id}`;
              overlaps.set(key, handler);
              return () => overlaps.delete(key);
            },
          }),
          channels: Object.freeze({
            activate: (_channelId: string, entity: unknown) => {
              const record = entity as Record<string, unknown>;
              active.set(record.entityId as string, record);
              return record;
            },
            recycle: (_channelId: string, entity: unknown) => {
              active.delete(
                (entity as Record<string, unknown>).entityId as string,
              );
            },
            read: () => Object.freeze([...active.values()]),
          }),
          observation: Object.freeze({
            register: (id: string, reader: () => unknown) => {
              const key = `${module.instanceId}:${id}`;
              observations.set(key, reader);
              return () => observations.delete(key);
            },
          }),
          contact: Object.freeze({
            executePolicy: (candidateInput: unknown) => {
              const candidate = candidateInput as ContactCandidatePayload;
              const seed = Object.freeze({
                contactId: candidate.contactId,
                sourceChannelId: candidate.sourceChannelId,
                sourceEntityId: candidate.sourceEntityId,
                sourceGeneration: candidate.sourceGeneration,
                sourceActorId: candidate.sourceActorId,
                targetActorId: candidate.targetActorId,
                contactSequence: candidate.contactSequence,
                metadata: candidate.metadata,
                disposition: "ignore" as const,
                sourceOperation: "retain" as const,
                policyTrace: Object.freeze([]),
              });
              const transformed = ContactDecisionPayloadSchema.parse(
                transform(seed),
              );
              return Object.freeze({
                ...transformed,
                policyTrace: Object.freeze([
                  "interaction.contact-default-damage",
                ]),
              });
            },
            prepareCommit: (
              candidateInput: unknown,
              decisionInput: unknown,
              deliveries: Readonly<{
                hit(evidenceId: number): unknown;
                damage(evidenceId: number): unknown;
              }>,
            ) => {
              const candidate = candidateInput as ContactCandidatePayload;
              const decision =
                ContactDecisionPayloadSchema.parse(decisionInput);
              expect(decision).toMatchObject({
                disposition: "damage",
                sourceOperation: "consume",
              });
              const coordinator =
                coordinators.get(module.instanceId) ??
                new ContactCommitCoordinatorV12(
                  runtime.guard,
                  module.runtimeContract!.contactCommit!
                    .maximumConcurrentCommits,
                );
              coordinators.set(module.instanceId, coordinator);
              return coordinator.prepare({
                contactIdentity: {
                  producerInstanceId: module.instanceId,
                  producerSequence: candidate.contactSequence,
                  sourceChannelId: candidate.sourceChannelId,
                  sourceEntityId: candidate.sourceEntityId,
                  sourceGeneration: candidate.sourceGeneration,
                },
                sourceOperation: "consume",
                applySourceOperation: () => {
                  const existed = active.delete(candidate.sourceEntityId);
                  return Object.freeze({ physical: existed, logical: existed });
                },
                deliverHit: deliveries.hit,
                deliverDamage: deliveries.damage,
                quarantine: vi.fn(),
              });
            },
          }),
        }),
        ports: Object.freeze({
          declareHandler: vi.fn(),
          publishState: vi.fn(),
          emitEvent: vi.fn(),
        }),
        clock,
        assets: Object.freeze({
          requireTexture: (roleId: string) => {
            expect(roleId).toBe("player-projectile");
            return result.graph.assetBindings[0]!.textureKey;
          },
          optionalTexture: () => undefined,
        }),
      });
    },
  });
  return { result, runtime, inputs, overlaps, observations, active, actors };
}

describe("Batch 1 production vertical slice", () => {
  it("freezes all eleven Manifest 1.2/configuration/reservation contracts and resolves ready", async () => {
    expect(BATCH1_MODULE_DEFINITIONS).toHaveLength(11);
    expect(
      BATCH1_MODULE_DEFINITIONS.map(({ manifest }) => manifest.moduleId),
    ).toEqual([
      "intent.keyboard-movement",
      "intent.touch-drag",
      "intent.movement-arbiter",
      "locomotion.bounded",
      "targeting.fixed-forward",
      "trigger.interval",
      "delivery.projectile",
      "combat.health",
      "interaction.projectile-contact",
      "interaction.contact-default-damage",
      "interaction.contact-resolution",
    ]);
    for (const definition of BATCH1_MODULE_DEFINITIONS) {
      expect(definition.manifest.schemaVersion).toBe("1.2.0");
      expect(definition.configurationSchema.safeParse({}).success).toBe(false);
      expect(definition.implementationSource).not.toMatch(
        /\b(?:import|require)\b/,
      );
      const request = BATCH1_VERTICAL_SLICE_ASSEMBLY.modules.find(
        (module) => module.moduleId === definition.manifest.moduleId,
      )!;
      expect(
        definition.configurationSchema.safeParse(request.configuration).success,
      ).toBe(true);
      expect(
        definition.configurationSchema.safeParse({
          ...(request.configuration as Record<string, unknown>),
          undeclared: true,
        }).success,
      ).toBe(false);
    }
    const delivery = BATCH1_MODULE_DEFINITIONS.find(
      ({ manifest }) => manifest.moduleId === "delivery.projectile",
    )!;
    const deliveryConfiguration = BATCH1_VERTICAL_SLICE_ASSEMBLY.modules.find(
      ({ moduleId }) => moduleId === "delivery.projectile",
    )!.configuration;
    expect(delivery.reservationEvaluator(deliveryConfiguration)).toEqual({
      activeEntities: 16,
      activeProjectiles: 16,
      spawnsPerSecond: 12,
      timers: 0,
    });
    expect(() =>
      delivery.reservationEvaluator({
        ...(deliveryConfiguration as Record<string, unknown>),
        maxActive: 257,
      }),
    ).toThrow();
    const { result } = await createSliceHarness();
    expect(result.graph.executionReadiness.status).toBe("ready");
    expect(result.readinessReport.blockers).toEqual([]);
    expect(result.graph.modules).toHaveLength(11);
    expect(result.graph.resourceTotals).toEqual({
      activeEntities: 16,
      activeProjectiles: 16,
      spawnsPerSecond: 12,
      timers: 1,
    });
  });

  it("executes movement, firing, source-first contact, health, pause/resume, and fresh restart", async () => {
    const first = await createSliceHarness();
    first.runtime.initialize();
    first.runtime.start();

    first.inputs.get("keyboard:keyboard.direction")!({ x: 1, y: 1 });
    first.runtime.frame(16.5);
    expect(first.actors["player-one"].velocity.x).toBeCloseTo(
      300 / Math.sqrt(2),
    );
    expect(first.actors["player-one"].velocity.y).toBeCloseTo(
      300 / Math.sqrt(2),
    );

    first.inputs.get("touch:pointer.down")!({
      id: 1,
      isDown: true,
      worldX: 10,
      worldY: 900,
    });
    first.inputs.get("touch:pointer.move")!({
      id: 1,
      isDown: true,
      worldX: 10,
      worldY: 900,
    });
    first.runtime.frame(16);
    expect(first.actors["player-one"].position).toEqual({ x: 24, y: 696 });
    first.inputs.get("touch:pointer.up")!({
      id: 1,
      isDown: false,
      worldX: 10,
      worldY: 900,
    });
    first.runtime.frame(67.5);
    expect(first.actors["player-one"].velocity.x).toBeCloseTo(
      300 / Math.sqrt(2),
    );

    expect(first.active.size).toBe(1);
    const projectile = [...first.active.values()][0]!;
    first.overlaps.get("detector:projectile.overlap")!({
      sourceEntityId: projectile.entityId,
      sourceGeneration: projectile.generation,
      damage: projectile.damage,
    });
    expect(first.active.size).toBe(0);
    expect(first.observations.get("health:health")!()).toMatchObject({
      current: 90,
      maximum: 100,
    });

    first.runtime.stop();
    expect(first.inputs.size).toBe(0);
    expect(first.overlaps.size).toBe(0);
    first.runtime.start();
    expect(first.inputs.size).toBe(4);
    expect(first.overlaps.size).toBe(1);
    first.runtime.dispose();
    first.runtime.destroy();
    expect(first.runtime.phase).toBe("destroyed");

    const second = await createSliceHarness();
    second.runtime.initialize();
    second.runtime.start();
    expect(second.observations.get("health:health")!()).toMatchObject({
      current: 100,
      maximum: 100,
    });
    second.runtime.dispose();
    second.runtime.destroy();
  });
});
