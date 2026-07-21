import { describe, expect, it } from "vitest";

import {
  DeterministicLogicalEntityDirectory,
  type LogicalEntityReference,
} from "../../src/modules/game-module-entity-directory.js";
import { ProjectileDeliveryAdmissionHostV1 } from "../../src/modules/game-module-projectile-delivery-admission-host.js";

function fixture(
  instanceId: string,
  maxActive: number,
  maximumEffectiveCount: number,
  maximumAcceptedRequestsPerSecond: number,
  nowMs: () => number,
) {
  const channelId = `${instanceId}.projectiles`;
  const directory = new DeterministicLogicalEntityDirectory(
    [
      {
        channelId,
        ownerInstanceId: instanceId,
        ownerActorId: "player-one",
        entityRole: "projectile",
        capacity: maxActive,
        readerInstanceIds: [],
      },
    ],
    [],
  );
  const host = new ProjectileDeliveryAdmissionHostV1<number>({
    instanceId,
    maxActive,
    maximumEffectiveCount,
    maximumAcceptedRequestsPerSecond,
    nowMs,
    activate: (entityId, generation) =>
      directory.activate(instanceId, channelId, entityId, generation),
    recycle: (reference) => {
      directory.recycle(instanceId, reference);
    },
  });
  return { channelId, directory, host };
}

describe("ADR 0027 projectile delivery admission host", () => {
  it("drops excess request rate in simulation-time and request-sequence order", () => {
    let nowMs = 100;
    const { host } = fixture("delivery-alpha", 8, 2, 2, () => nowMs);

    expect(host.admit(0, [0]).accepted).toBe(true);
    expect(host.admit(1, [1]).accepted).toBe(true);
    expect(host.admit(2, [2])).toEqual({
      accepted: false,
      activated: [],
      droppedByPool: 0,
    });
    nowMs = 1_100;
    expect(host.admit(3, [3]).accepted).toBe(true);
    expect(host.observe()).toMatchObject({
      requestedRequests: 4,
      acceptedRequests: 3,
      droppedRequestsByRate: 1,
      plannedProjectiles: 3,
      activatedProjectiles: 3,
    });
  });

  it("activates a stable planner prefix and observes the pool-exhausted suffix", () => {
    const { host } = fixture("delivery-alpha", 3, 3, 4, () => 0);
    const first = host.admit(0, [10, 11]);
    const second = host.admit(1, [20, 21, 22]);
    const exhausted = host.admit(2, [30, 31, 32]);

    expect(first.activated.map(({ entityId }) => entityId)).toEqual([
      "delivery-alpha-projectile-0",
      "delivery-alpha-projectile-1",
    ]);
    expect(second.activated.map(({ entityId }) => entityId)).toEqual([
      "delivery-alpha-projectile-2",
    ]);
    expect(second.droppedByPool).toBe(2);
    expect(exhausted).toEqual({
      accepted: true,
      activated: [],
      droppedByPool: 3,
    });
    expect(host.observe()).toEqual({
      requestedRequests: 3,
      acceptedRequests: 3,
      droppedRequestsByRate: 0,
      plannedProjectiles: 8,
      activatedProjectiles: 3,
      droppedProjectilesByPool: 5,
      activeProjectiles: 3,
    });
  });

  it("keeps independent channel custody and generation identity across pools", () => {
    let nowMs = 0;
    const alpha = fixture("delivery-alpha", 2, 2, 3, () => nowMs);
    const beta = fixture("delivery-beta", 2, 2, 3, () => nowMs);

    const alphaFirst = alpha.host.admit(0, [1]).activated[0]!;
    const betaFirst = beta.host.admit(0, [1]).activated[0]!;
    expect(alphaFirst.channelId).toBe(alpha.channelId);
    expect(betaFirst.channelId).toBe(beta.channelId);
    expect(alphaFirst.entityId).not.toBe(betaFirst.entityId);
    expect(alphaFirst.generation).toBe(0);
    expect(betaFirst.generation).toBe(0);

    alpha.host.recycle(alphaFirst);
    nowMs = 1;
    const alphaSecond = alpha.host.admit(1, [2]).activated[0]!;
    expect(alphaSecond.entityId).toBe(alphaFirst.entityId);
    expect(alphaSecond.generation).toBe(1);
    expect(() => alpha.host.recycle(betaFirst)).toThrow(
      "not active in this pool",
    );
    expect(beta.directory.read("delivery-beta", betaFirst)).toEqual(betaFirst);
  });

  it("accepts the exact maximum salvo and rejects one over before activation", () => {
    const { host } = fixture("delivery-alpha", 3, 3, 1, () => 0);
    expect(host.admit(0, [1, 2, 3]).activated).toHaveLength(3);

    const other = fixture("delivery-beta", 3, 3, 1, () => 0).host;
    expect(() => other.admit(0, [1, 2, 3, 4])).toThrow(
      "maximum effective count",
    );
    expect(other.observe().activeProjectiles).toBe(0);
  });

  it("recycles active custody deterministically on disposal", () => {
    const recycled: LogicalEntityReference[] = [];
    const directory = new DeterministicLogicalEntityDirectory(
      [
        {
          channelId: "delivery-alpha.projectiles",
          ownerInstanceId: "delivery-alpha",
          ownerActorId: "player-one",
          entityRole: "projectile",
          capacity: 2,
          readerInstanceIds: [],
        },
      ],
      [],
    );
    const host = new ProjectileDeliveryAdmissionHostV1<number>({
      instanceId: "delivery-alpha",
      maxActive: 2,
      maximumEffectiveCount: 2,
      maximumAcceptedRequestsPerSecond: 1,
      nowMs: () => 0,
      activate: (entityId, generation) =>
        directory.activate(
          "delivery-alpha",
          "delivery-alpha.projectiles",
          entityId,
          generation,
        ),
      recycle: (reference) => {
        recycled.push(reference);
        directory.recycle("delivery-alpha", reference);
      },
    });
    host.admit(0, [1, 2]);
    host.dispose();
    expect(recycled.map(({ entityId }) => entityId)).toEqual([
      "delivery-alpha-projectile-0",
      "delivery-alpha-projectile-1",
    ]);
    expect(() => host.admit(1, [3])).toThrow("disposed");
  });
});
