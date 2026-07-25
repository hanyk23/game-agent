import { describe, expect, it } from "vitest";

import { DeterministicActorSnapshotHostV13 } from "../../src/modules/game-module-actor-snapshot-host.js";
import { createBatch2CoreProductionRegistry } from "../../src/modules/batch2-core-library.js";
import {
  BATCH2_NEAREST_TARGETING_ASSEMBLY,
  resolveBatch2NearestTargetingSlice,
} from "../../src/modules/batch2-nearest-targeting-slice.js";
import { DeterministicGameModuleProductionInstantiatorV13 } from "../../src/modules/game-module-production-instantiator.js";
import { generateBrowserRuntimeCatalogV13 } from "../../src/modules/game-module-runtime-catalog-generator.js";
import type { ResolvedModuleGraphV13 } from "../../src/modules/game-module-resolver.js";

type SourceActor = Parameters<DeterministicActorSnapshotHostV13["register"]>[0];

const player: SourceActor = {
  actorId: "player-one",
  role: "player",
  active: true,
  position: { x: 360, y: 600 },
  collisionRadius: 12,
  healthRatio: 1,
};

const target = (
  actorId: "enemy-one" | "boss-one",
  role: "enemy" | "boss",
  position: Readonly<{ x: number; y: number }>,
  active = true,
): SourceActor => ({
  actorId,
  role,
  active,
  position,
  collisionRadius: 20,
  healthRatio: 1,
});

function expectVelocity(
  actual: Readonly<{ x: number; y: number }> | undefined,
  expected: Readonly<{ x: number; y: number }>,
): void {
  expect(actual).toBeDefined();
  expect(actual!.x).toBeCloseTo(expected.x, 10);
  expect(actual!.y).toBeCloseTo(expected.y, 10);
}

async function createNearestHarness(targets: readonly SourceActor[]): Promise<
  Readonly<{
    graph: ResolvedModuleGraphV13;
    host: DeterministicActorSnapshotHostV13;
    frame(): void;
    fire(): void;
    velocities: readonly Readonly<{ x: number; y: number }>[];
    actorReadCount(): number;
    cleanup(): Readonly<{ active: number; input: number }>;
  }>
> {
  const result = await resolveBatch2NearestTargetingSlice();
  const registry = await createBatch2CoreProductionRegistry();
  const catalog = generateBrowserRuntimeCatalogV13(result.graph, registry);
  const host = new DeterministicActorSnapshotHostV13(
    result.graph.actorSnapshotGrants,
  );
  host.register(player);
  for (const actor of targets) host.register(actor);
  const owner = {
    actorId: player.actorId,
    active: true,
    position: { ...player.position },
    velocity: { x: 0, y: 0 },
  };
  const inputHandlers = new Map<string, (value: unknown) => unknown>();
  const active = new Map<string, unknown>();
  const velocities: Array<Readonly<{ x: number; y: number }>> = [];
  let snapshotSequence = 0;
  let actorReads = 0;
  const grant = result.graph.actorSnapshotGrants[0]!;
  const createContext = (
    module: (typeof result.graph.modules)[number],
    clock: unknown,
  ) => ({
    identity: {
      instanceId: module.instanceId,
      ownerId: module.ownerId,
      moduleId: module.moduleId,
      version: module.version,
      artifactEnvelopeSha256: module.artifactIdentity!.envelopeSha256,
    },
    configuration: module.configuration,
    services: {
      viewport: { read: () => ({ width: 720, height: 720 }) },
      actors: {
        readOwner: () => owner,
        writeOwnerMotion: () => undefined,
        writeOwnerPosition: () => undefined,
      },
      input: {
        register: (id: string, handler: (value: unknown) => unknown) => {
          inputHandlers.set(`${module.instanceId}:${id}`, handler);
          return () => inputHandlers.delete(`${module.instanceId}:${id}`);
        },
      },
      overlaps: { register: () => () => undefined },
      channels: {
        activate: (_channelId: string, entity: unknown) => {
          const value = entity as {
            entityId: string;
            velocity: Readonly<{ x: number; y: number }>;
          };
          const reference = Object.freeze({
            ...value,
            channelId: `${module.instanceId}.projectiles`,
            ownerActorId: module.ownerId,
            entityRole: "projectile" as const,
          });
          active.set(value.entityId, reference);
          velocities.push(Object.freeze({ ...value.velocity }));
          return reference;
        },
        recycle: (_channelId: string, entity: unknown) =>
          active.delete((entity as { entityId: string }).entityId),
        read: () => Object.freeze([]),
      },
      observation: { register: () => () => undefined },
      contact: {
        executePolicy: () => undefined,
        prepareCommit: () => undefined,
      },
      actorSnapshots: {
        read: (grantId: string) => {
          actorReads += 1;
          return host.snapshot(
            module.instanceId,
            grantId,
            snapshotSequence,
            snapshotSequence++,
          );
        },
      },
    },
    ports: {
      declareHandler: () => undefined,
      declareAddressedHandler: () => undefined,
      publishState: () => undefined,
      emitEvent: () => undefined,
    },
    clock,
    assets: {
      requireTexture: () => result.graph.assetBindings[0]!.textureKey,
      optionalTexture: () => undefined,
    },
  });
  const runtime = DeterministicGameModuleProductionInstantiatorV13.create({
    graph: result.graph,
    catalog,
    createContextV12: (module, clock) => createContext(module, clock) as never,
    createContextV13: (module, clock) => createContext(module, clock) as never,
    registerAddressedHandler: () => undefined,
  });
  runtime.initialize();
  runtime.start();
  let pointerIdentity = 0;
  return Object.freeze({
    graph: result.graph,
    host,
    frame: () => runtime.frame(16),
    fire: () => {
      pointerIdentity += 1;
      inputHandlers.get("attack-intent:attack.pointer-down")!({
        id: pointerIdentity,
      });
      inputHandlers.get("attack-intent:attack.pointer-up")!({
        id: pointerIdentity,
      });
    },
    velocities,
    actorReadCount: () => actorReads,
    cleanup: () => {
      runtime.stop();
      runtime.dispose();
      runtime.destroy();
      return Object.freeze({ active: active.size, input: inputHandlers.size });
    },
  });
}

describe("Batch 2 nearest-targeting production Graph 1.3", () => {
  it("resolves exact enemy/Boss snapshot authority into a ready attack graph", async () => {
    const result = await resolveBatch2NearestTargetingSlice();
    expect(BATCH2_NEAREST_TARGETING_ASSEMBLY.modules).toHaveLength(4);
    expect(result.graph.executionReadiness.status).toBe("ready");
    expect(result.readinessReport.blockers).toEqual([]);
    expect(result.graph.attackChannels).toEqual([
      expect.objectContaining({
        targetingInstanceId: "targeting",
        triggerInstanceId: "trigger",
        deliveryInstanceId: "delivery",
      }),
    ]);
    expect(result.graph.actorSnapshotGrants).toEqual([
      expect.objectContaining({
        instanceId: "targeting",
        ownerActorId: "player-one",
        descriptor: expect.objectContaining({
          targetActorRoles: ["enemy", "boss"],
          order: "distance-then-actor-id-generation",
        }),
      }),
    ]);
    expect(
      result.graph.actorSnapshotGrants.filter(
        ({ instanceId }) => instanceId === "delivery",
      ),
    ).toEqual([]);
  });

  it.each([
    {
      name: "empty",
      targets: [],
      expected: { x: 0, y: -600 },
    },
    {
      name: "equal-distance actor-id tie",
      targets: [
        target("enemy-one", "enemy", { x: 460, y: 600 }),
        target("boss-one", "boss", { x: 260, y: 600 }),
      ],
      expected: { x: -600, y: 0 },
    },
    {
      name: "inactive",
      targets: [target("enemy-one", "enemy", { x: 360, y: 500 }, false)],
      expected: { x: 0, y: -600 },
    },
    {
      name: "out-of-range",
      targets: [target("boss-one", "boss", { x: 360, y: 100 })],
      expected: { x: 0, y: -600 },
    },
  ])(
    "selects deterministically for $name snapshots",
    async ({ targets, expected }) => {
      const harness = await createNearestHarness(targets);
      harness.frame();
      expect(harness.actorReadCount()).toBe(1);
      harness.fire();
      expect(harness.actorReadCount()).toBe(1);
      expect(harness.velocities).toHaveLength(1);
      expectVelocity(harness.velocities[0], expected);
      expect(harness.cleanup()).toEqual({ active: 0, input: 0 });
    },
  );

  it("keeps the old direction until the next update without resolving target evidence in delivery", async () => {
    const harness = await createNearestHarness([
      target("enemy-one", "enemy", { x: 460, y: 600 }),
    ]);
    harness.frame();
    expect(harness.actorReadCount()).toBe(1);
    harness.host.update("enemy-one", { position: { x: 360, y: 700 } });

    harness.fire();
    expect(harness.actorReadCount()).toBe(1);
    expectVelocity(harness.velocities[0], { x: 600, y: 0 });

    harness.frame();
    expect(harness.actorReadCount()).toBe(2);
    harness.fire();
    expect(harness.actorReadCount()).toBe(2);
    expectVelocity(harness.velocities[1], { x: 0, y: 600 });

    harness.host.update("enemy-one", { active: false });
    harness.frame();
    expect(harness.actorReadCount()).toBe(3);
    harness.fire();
    expect(harness.actorReadCount()).toBe(3);
    expectVelocity(harness.velocities[2], { x: 0, y: -600 });
    expect(harness.cleanup()).toEqual({ active: 0, input: 0 });
  });
});
