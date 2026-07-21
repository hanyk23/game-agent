import { describe, expect, it, vi } from "vitest";

import type { RuntimeKernel } from "../../game-template/vertical-shooter/src/runtime-kernel/contracts.js";
import {
  createGameModuleRuntimeServiceHost,
  GameModuleRuntimeServiceHostError,
  GameModuleRuntimeServiceHostErrorCode,
} from "../../game-template/vertical-shooter/src/runtime-kernel/game-module-runtime-service-host.js";

type FakeEntity = {
  active: boolean;
  velocity: Readonly<{ x: number; y: number }>;
  texture: string;
};

function fakeKernel(
  overrides: Readonly<{
    scheduleThrows?: boolean;
    cancelThrows?: boolean;
  }> = {},
) {
  let now = 0;
  const cleanup: string[] = [];
  const used: string[] = [];
  const observations: [string, number][] = [];
  const pools: FakeEntity[][] = [];
  const createPool = vi.fn(() => {
    const entities: FakeEntity[] = [];
    pools.push(entities);
    return {
      budgetKey: "projectiles",
      acquire: (_x: number, _y: number, texture: string) => {
        const entity = { active: true, velocity: { x: 0, y: 0 }, texture };
        entities.push(entity);
        return entity;
      },
      create: (_x: number, _y: number, texture: string) => {
        const entity = { active: true, velocity: { x: 0, y: 0 }, texture };
        entities.push(entity);
        return entity;
      },
      countActive: () => entities.filter((entity) => entity.active).length,
      forEach: (visitor: (entity: FakeEntity) => void) =>
        entities.forEach(visitor),
      clear: (destroyChildren: boolean) => {
        cleanup.push(`pool:${destroyChildren}`);
        for (const entity of entities) entity.active = false;
      },
    };
  });
  const kernel: RuntimeKernel<FakeEntity, unknown> = {
    lifecycle: {
      onShutdown: () => () => undefined,
      startScene: () => undefined,
    },
    clock: {
      nowMs: () => now,
      schedule: () => {
        if (overrides.scheduleThrows) throw new Error("schedule failed");
        return {
          cancel: () => {
            cleanup.push("timer");
            if (overrides.cancelThrows) throw new Error("cancel failed");
          },
        };
      },
    },
    entities: {
      createSprite: () => ({
        active: true,
        velocity: { x: 0, y: 0 },
        texture: "actor",
      }),
      createPool,
    },
    input: {
      readDirection: () => ({ x: 1, y: 0 }),
      onPointerDown: () => () => cleanup.push("pointer"),
      onPointerMove: () => () => cleanup.push("pointer-move"),
      onPointerUp: () => () => cleanup.push("pointer-up"),
    },
    rendering: {
      createText: () => ({
        setOrigin() {
          return this;
        },
        setText() {
          return this;
        },
        setVisible() {
          return this;
        },
      }),
      shakeCamera: () => undefined,
    },
    collisions: {
      watchOverlap: () => () => cleanup.push("overlap"),
      overlapNow: () => undefined,
      pause: () => undefined,
    },
    assets: {
      markUsed: (key) => used.push(key),
      snapshot: () => ({
        expectedTextureKeys: [],
        loadedTextureKeys: [],
        usedTextureKeys: used,
      }),
    },
    events: { emit: () => undefined, on: () => () => undefined },
    budgets: {
      limitFor: (key) => {
        if (key !== "projectiles") throw new Error(`unknown budget ${key}`);
        return 4;
      },
      observe: (key, current) => observations.push([key, current]),
      snapshot: () => ({ limit: 4, current: 0, peak: 0 }),
    },
    observation: {
      registerReader: () => () => cleanup.push("observation"),
    },
    viewport: {
      width: 320,
      height: 640,
      clampX: (x) => Math.min(320, Math.max(0, x)),
      clampY: (y) => Math.min(640, Math.max(0, y)),
    },
  };
  return {
    kernel,
    cleanup,
    used,
    observations,
    pools,
    createPool,
    setNow: (value: number) => {
      now = value;
    },
  };
}

function fakeAuthority() {
  let sequence = 0;
  const activeLeases = new Map<
    string,
    Readonly<{
      leaseId: string;
      ownerId: string;
      scope: "start" | "instance" | "graph";
      key: string;
    }>
  >();
  const activeEntities = new Map<
    string,
    Readonly<{
      channelId: string;
      entityId: string;
      generation: number;
      ownerActorId: string;
      entityRole: string;
    }>
  >();
  const released: string[] = [];
  const recycled: string[] = [];
  return {
    activeLeases,
    activeEntities,
    released,
    recycled,
    authority: {
      acquireLease: (scope: "start" | "instance" | "graph", key: string) => {
        const lease = {
          leaseId: `lease-${++sequence}`,
          ownerId: "module",
          scope,
          key,
        } as const;
        activeLeases.set(lease.leaseId, lease);
        return lease;
      },
      releaseLease: (lease: { leaseId: string; key: string }) => {
        activeLeases.delete(lease.leaseId);
        released.push(lease.key);
      },
      activateEntity: (
        channelId: string,
        entityId: string,
        generation: number,
      ) => {
        const reference = {
          channelId,
          entityId,
          generation,
          ownerActorId: "player-one",
          entityRole: "projectile.player",
        } as const;
        activeEntities.set(`${channelId}.${entityId}.${generation}`, reference);
        return reference;
      },
      readEntity: (reference: {
        channelId: string;
        entityId: string;
        generation: number;
      }) =>
        activeEntities.get(
          `${reference.channelId}.${reference.entityId}.${reference.generation}`,
        )!,
      recycleEntity: (reference: {
        channelId: string;
        entityId: string;
        generation: number;
      }) => {
        const key = `${reference.channelId}.${reference.entityId}.${reference.generation}`;
        const existing = activeEntities.get(key)!;
        activeEntities.delete(key);
        recycled.push(key);
        return existing;
      },
      isGenerationActive: (
        channelId: string,
        entityId: string,
        generation: number,
      ) => activeEntities.has(`${channelId}.${entityId}.${generation}`),
    },
  };
}

function setup(kernel = fakeKernel()) {
  const actorEntity: FakeEntity = {
    active: true,
    velocity: { x: 0, y: 0 },
    texture: "player",
  };
  let position = { x: 10, y: 20 };
  let velocity = { x: 0, y: 0 };
  const host = createGameModuleRuntimeServiceHost(kernel.kernel, {
    actors: [
      {
        actorId: "player-one",
        collisionTarget: actorEntity,
        read: () => ({
          actorId: "player-one",
          active: true,
          position,
          velocity,
        }),
        setVelocity: (next) => {
          velocity = { ...next };
        },
        setPosition: (next) => {
          position = { ...next };
        },
      },
    ],
    channels: [
      {
        channelId: "producer.projectiles",
        ownerInstanceId: "producer",
        entityRole: "projectile.player",
        budgetKey: "projectiles",
        capacity: 2,
        countsAsProjectile: true,
      },
    ],
    assetRoles: [{ roleId: "projectile", textureKey: "bullet" }],
    entities: {
      setVelocity: (entity, next) => {
        entity.velocity = { ...next };
      },
      recycle: (entity) => {
        entity.active = false;
      },
    },
  });
  const authority = fakeAuthority();
  const evidence = {
    instanceId: "producer",
    ownerId: "player-one",
    moduleId: "test.producer",
    version: "1.0.0",
    artifactEnvelopeSha256: "a".repeat(64),
    resourceGrant: {
      activeEntities: 2,
      activeProjectiles: 2,
      spawnsPerSecond: 2,
      timers: 1,
    },
    assetRoleIds: ["projectile"],
    ownedChannelIds: ["producer.projectiles"],
    readableChannelIds: ["producer.projectiles"],
    mutationGrantIds: [],
    runtimeLeaseKeys: {
      start: ["timer", "pointer", "overlap"],
      instance: ["pool", "observation"],
      graph: [],
    },
  } as const;
  return { host, authority, evidence, kernel, getPosition: () => position };
}

function hostCode(action: () => unknown): string {
  try {
    action();
    throw new Error("expected host failure");
  } catch (error) {
    expect(error).toBeInstanceOf(GameModuleRuntimeServiceHostError);
    return (error as GameModuleRuntimeServiceHostError).code;
  }
}

describe("kernel-backed game-module runtime service host", () => {
  it("scopes services and revokes start then instance resources without residue", () => {
    const { host, authority, evidence, kernel, getPosition } = setup();
    const services = host.createScope(evidence, authority.authority);
    expect(services.viewport.clampX(999)).toBe(320);
    expect(services.assets.resolveRole("projectile")).toBe("bullet");
    services.actors.setPosition("player-one", { x: 30, y: 40 });
    expect(getPosition()).toEqual({ x: 30, y: 40 });
    expect(services.budgets.limitFor("activeProjectiles")).toBe(2);

    services.pools.create("pool", "producer.projectiles", "projectiles");
    services.observation.register("observation", () => ({}));
    const reference = services.pools.activate(
      "producer.projectiles",
      "shot-one",
      1,
      { x: 1, y: 2 },
      { x: 0, y: -3 },
      "projectile",
    );
    expect(reference.entityRole).toBe("projectile.player");
    expect(services.pools.countActive("producer.projectiles")).toBe(1);
    services.clock.schedule("timer", {
      delayMs: 10,
      callback: () => undefined,
    });
    services.input.onPointer("pointer", "down", () => undefined);
    services.collisions.watchOverlap(
      "overlap",
      "producer.projectiles",
      "player-one",
      () => undefined,
    );

    host.revoke("producer", "start");
    expect(kernel.cleanup.slice(0, 4)).toEqual([
      "overlap",
      "pointer",
      "timer",
      "pool:false",
    ]);
    expect(authority.recycled).toEqual(["producer.projectiles.shot-one.1"]);
    expect(authority.activeEntities.size).toBe(0);
    expect(
      [...authority.activeLeases.values()].map((lease) => lease.key),
    ).toEqual(["pool", "observation"]);
    host.revoke("producer", "start");

    host.revoke("producer", "instance");
    expect(kernel.cleanup.slice(-3)).toEqual([
      "pool:false",
      "observation",
      "pool:true",
    ]);
    expect(authority.activeLeases.size).toBe(0);
    host.destroy();
    expect(hostCode(() => host.destroy())).toBe(
      GameModuleRuntimeServiceHostErrorCode.destroyed,
    );
  });

  it("fails before mutation for unknown authority, keys, actors, channels, assets, and duplicates", () => {
    const { host, authority, evidence, kernel } = setup();
    expect(hostCode(() => host.createScope(evidence))).toBe(
      GameModuleRuntimeServiceHostErrorCode.invalidEvidence,
    );
    const services = host.createScope(evidence, authority.authority);
    expect(
      hostCode(() =>
        services.clock.schedule("missing", {
          delayMs: 1,
          callback: () => undefined,
        }),
      ),
    ).toBe(GameModuleRuntimeServiceHostErrorCode.unknownLeaseKey);
    expect(hostCode(() => services.actors.read("missing"))).toBe(
      GameModuleRuntimeServiceHostErrorCode.unknownActor,
    );
    expect(
      hostCode(() => services.pools.create("pool", "missing", "projectiles")),
    ).toBe(GameModuleRuntimeServiceHostErrorCode.unknownChannel);
    services.pools.create("pool", "producer.projectiles", "projectiles");
    expect(
      hostCode(() =>
        services.pools.create("pool", "producer.projectiles", "projectiles"),
      ),
    ).toBe(GameModuleRuntimeServiceHostErrorCode.duplicateRegistration);
    expect(hostCode(() => services.assets.resolveRole("missing"))).toBe(
      GameModuleRuntimeServiceHostErrorCode.unknownAssetRole,
    );
    expect(kernel.createPool).toHaveBeenCalledTimes(1);
  });

  it("enforces exact active and trailing-1000ms spawn grants", () => {
    const active = setup();
    const services = active.host.createScope(
      active.evidence,
      active.authority.authority,
    );
    services.pools.create("pool", "producer.projectiles", "projectiles");
    const first = services.pools.activate(
      "producer.projectiles",
      "one",
      1,
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      "projectile",
    );
    services.pools.activate(
      "producer.projectiles",
      "two",
      1,
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      "projectile",
    );
    expect(
      hostCode(() =>
        services.pools.activate(
          "producer.projectiles",
          "three",
          1,
          { x: 0, y: 0 },
          { x: 0, y: 0 },
          "projectile",
        ),
      ),
    ).toBe(GameModuleRuntimeServiceHostErrorCode.resourceExceeded);
    services.pools.recycle(first);

    const rate = setup();
    const rateServices = rate.host.createScope(
      {
        ...rate.evidence,
        resourceGrant: { ...rate.evidence.resourceGrant, spawnsPerSecond: 1 },
      },
      rate.authority.authority,
    );
    rateServices.pools.create("pool", "producer.projectiles", "projectiles");
    const rateFirst = rateServices.pools.activate(
      "producer.projectiles",
      "one",
      1,
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      "projectile",
    );
    rateServices.pools.recycle(rateFirst);
    expect(
      hostCode(() =>
        rateServices.pools.activate(
          "producer.projectiles",
          "two",
          1,
          { x: 0, y: 0 },
          { x: 0, y: 0 },
          "projectile",
        ),
      ),
    ).toBe(GameModuleRuntimeServiceHostErrorCode.spawnRateExceeded);
    rate.kernel.setNow(1_001);
    expect(() =>
      rateServices.pools.activate(
        "producer.projectiles",
        "two",
        1,
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        "projectile",
      ),
    ).not.toThrow();
  });

  it("rolls back a lease when the underlying adapter registration fails", () => {
    const setupResult = setup(fakeKernel({ scheduleThrows: true }));
    const services = setupResult.host.createScope(
      setupResult.evidence,
      setupResult.authority.authority,
    );
    expect(
      hostCode(() =>
        services.clock.schedule("timer", {
          delayMs: 1,
          callback: () => undefined,
        }),
      ),
    ).toBe(GameModuleRuntimeServiceHostErrorCode.adapterFailure);
    expect(setupResult.authority.activeLeases.size).toBe(0);
    expect(setupResult.authority.released).toEqual(["timer"]);
  });

  it("shares an owned pool only with scopes carrying readable-channel evidence", () => {
    const setupResult = setup();
    const producer = setupResult.host.createScope(
      setupResult.evidence,
      setupResult.authority.authority,
    );
    producer.pools.create("pool", "producer.projectiles", "projectiles");
    const consumerAuthority = fakeAuthority();
    const consumer = setupResult.host.createScope(
      {
        ...setupResult.evidence,
        instanceId: "consumer",
        ownedChannelIds: [],
        readableChannelIds: ["producer.projectiles"],
        resourceGrant: {
          activeEntities: 0,
          activeProjectiles: 0,
          spawnsPerSecond: 0,
          timers: 0,
        },
        runtimeLeaseKeys: {
          start: ["overlap"],
          instance: [],
          graph: [],
        },
      },
      consumerAuthority.authority,
    );
    expect(() =>
      consumer.collisions.watchOverlap(
        "overlap",
        "producer.projectiles",
        "player-one",
        () => undefined,
      ),
    ).not.toThrow();
    setupResult.host.destroy();
    expect(consumerAuthority.activeLeases.size).toBe(0);
  });

  it("aggregates disposer errors, releases leases, and makes revocation idempotent", () => {
    const setupResult = setup(fakeKernel({ cancelThrows: true }));
    const services = setupResult.host.createScope(
      setupResult.evidence,
      setupResult.authority.authority,
    );
    services.clock.schedule("timer", {
      delayMs: 1,
      callback: () => undefined,
    });
    expect(hostCode(() => setupResult.host.revoke("producer", "start"))).toBe(
      GameModuleRuntimeServiceHostErrorCode.cleanupFailed,
    );
    expect(setupResult.authority.activeLeases.size).toBe(0);
    expect(setupResult.authority.released).toEqual(["timer"]);
    expect(() => setupResult.host.revoke("producer", "start")).not.toThrow();
  });

  it("validates constructor mappings and exact channel capacity", () => {
    const kernel = fakeKernel();
    expect(
      hostCode(() =>
        createGameModuleRuntimeServiceHost(kernel.kernel, {
          actors: [],
          channels: [
            {
              channelId: "producer.projectiles",
              ownerInstanceId: "producer",
              entityRole: "projectile.player",
              budgetKey: "missing",
              capacity: 1,
              countsAsProjectile: true,
            },
          ],
          assetRoles: [],
          entities: { setVelocity: () => undefined, recycle: () => undefined },
        }),
      ),
    ).toBe(GameModuleRuntimeServiceHostErrorCode.invalidOptions);
    const invalid = setup();
    expect(
      hostCode(() =>
        invalid.host.createScope(
          {
            ...invalid.evidence,
            resourceGrant: {
              ...invalid.evidence.resourceGrant,
              activeProjectiles: 1,
            },
          },
          invalid.authority.authority,
        ),
      ),
    ).toBe(GameModuleRuntimeServiceHostErrorCode.invalidEvidence);
  });
});
