import { describe, expect, it, vi } from "vitest";

import { HostileAttackLineageRouterV1 } from "../../src/modules/game-module-hostile-attack-router.js";

function request(sequence = 0) {
  return {
    sequence,
    emittedAtMs: sequence,
    requestedAtMs: sequence,
    attackChannelId: "enemy-main",
    rootChannelId: "enemy-roots",
    sourceActorId: "root/waves/0",
    sourceGeneration: 1,
    patternSourceId: "radial",
    emissionIndex: sequence,
  };
}

function fixture(maximumPending = 2) {
  const sourcePosition = { x: 10, y: 20 };
  const readActiveSource = vi.fn(() => ({ position: sourcePosition }));
  const router = new HostileAttackLineageRouterV1({
    sourceInstanceId: "pattern-source",
    targetingInstanceId: "fixed-targeting",
    deliveryInstanceId: "radial-delivery",
    rootChannelId: "enemy-roots",
    attackChannelId: "enemy-main",
    projectileChannelId: "enemy-projectiles",
    maximumPending,
    readActiveSource,
  });
  return { router, sourcePosition, readActiveSource };
}

describe("ADR 0028 hostile V3 lineage router", () => {
  it("freezes one active-source snapshot through targeting and emission", () => {
    const { router, sourcePosition, readActiveSource } = fixture();
    const accepted = router.acceptRequest("pattern-source", request());
    sourcePosition.x = 999;
    const targeted = router.target("fixed-targeting", accepted, { x: 0, y: 1 });
    expect(targeted.sourcePosition).toEqual({ x: 10, y: 20 });
    const emission = router.emit("radial-delivery", targeted, {
      projectileEntityId: "enemy-projectile-one",
      projectileChannelId: "enemy-projectiles",
      projectileGeneration: 0,
      position: { x: 10, y: 20 },
      velocity: { x: 0, y: 100 },
      damage: 2,
    });
    expect(emission).toMatchObject({
      sourceActorId: "root/waves/0",
      sourceGeneration: 1,
      sourcePosition: { x: 10, y: 20 },
      projectileChannelId: "enemy-projectiles",
    });
    expect(readActiveSource).toHaveBeenCalledOnce();
    expect(Object.isFrozen(emission.position)).toBe(true);
    expect(router.snapshot().pendingCount).toBe(0);
  });

  it("derives aimed direction from the already frozen source snapshot", () => {
    const { router, readActiveSource } = fixture();
    const targeted = router.targetPosition(
      "fixed-targeting",
      router.acceptRequest("pattern-source", request()),
      { x: 13, y: 24 },
    );
    expect(targeted.sourcePosition).toEqual({ x: 10, y: 20 });
    expect(targeted.direction).toEqual({ x: 0.6, y: 0.8 });
    expect(readActiveSource).toHaveBeenCalledOnce();
  });

  it("keeps a V3 request pending through a salvo and closes empty delivery", () => {
    const { router } = fixture();
    const targeted = router.target(
      "fixed-targeting",
      router.acceptRequest("pattern-source", request()),
      { x: 0, y: 1 },
    );
    const projectile = (projectileEntityId: string) => ({
      projectileEntityId,
      projectileChannelId: "enemy-projectiles",
      projectileGeneration: 0,
      position: { x: 10, y: 20 },
      velocity: { x: 0, y: 100 },
      damage: 2,
    });
    router.emit(
      "radial-delivery",
      targeted,
      projectile("enemy-projectile-one"),
      false,
    );
    expect(router.snapshot().pendingCount).toBe(1);
    router.emit(
      "radial-delivery",
      targeted,
      projectile("enemy-projectile-two"),
      true,
    );
    expect(router.snapshot().pendingCount).toBe(0);

    const emptyTargeted = router.target(
      "fixed-targeting",
      router.acceptRequest("pattern-source", request(1)),
      { x: 0, y: 1 },
    );
    router.completeDelivery("radial-delivery", emptyTargeted);
    expect(router.snapshot().pendingCount).toBe(0);
  });

  it("rejects sender/channel/V2/stale source lineage before routing", () => {
    const { router, readActiveSource } = fixture();
    expect(() => router.acceptRequest("other-source", request())).toThrow(
      /sender/,
    );
    expect(() =>
      router.acceptRequest("pattern-source", {
        ...request(),
        attackChannelId: "other-channel",
      }),
    ).toThrow(/channel lineage/);
    expect(() =>
      router.acceptRequest("pattern-source", {
        sequence: 0,
        emittedAtMs: 0,
        requestedAtMs: 0,
        attackChannelId: "enemy-main",
        slot: "primary",
      } as never),
    ).toThrow();
    readActiveSource.mockImplementationOnce(() => {
      throw new Error("stale source");
    });
    expect(() => router.acceptRequest("pattern-source", request())).toThrow(
      /stale source/,
    );
    expect(router.snapshot().pendingCount).toBe(0);
  });

  it("rejects target re-resolution, payload drift, and wrong delivery channel", () => {
    const { router } = fixture();
    const accepted = router.acceptRequest("pattern-source", request());
    expect(() =>
      router.target("fixed-targeting", accepted, { x: 1, y: 1 }),
    ).toThrow(/normalized/);
    const targeted = router.target("fixed-targeting", accepted, { x: 1, y: 0 });
    expect(() =>
      router.emit(
        "radial-delivery",
        { ...targeted, sourcePosition: { x: 0, y: 0 } },
        {
          projectileEntityId: "enemy-projectile-one",
          projectileChannelId: "enemy-projectiles",
          projectileGeneration: 0,
          position: { x: 10, y: 20 },
          velocity: { x: 1, y: 0 },
          damage: 1,
        },
      ),
    ).toThrow(/identity mismatch/);
    expect(() =>
      router.emit("radial-delivery", targeted, {
        projectileEntityId: "enemy-projectile-one",
        projectileChannelId: "player-projectiles",
        projectileGeneration: 0,
        position: { x: 10, y: 20 },
        velocity: { x: 1, y: 0 },
        damage: 1,
      }),
    ).toThrow(/lineage/);
  });

  it("bounds pending requests and cancels future work by source generation", () => {
    const { router } = fixture(1);
    router.acceptRequest("pattern-source", request(0));
    expect(() => router.acceptRequest("pattern-source", request(1))).toThrow(
      /capacity/,
    );
    expect(router.cancelSource("root/waves/0", 1)).toBe(1);
    expect(router.snapshot().pendingCount).toBe(0);
    expect(() => router.acceptRequest("pattern-source", request(0))).toThrow(
      /sequence/,
    );
  });
});
