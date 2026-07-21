import { describe, expect, it } from "vitest";

import { DeterministicActorSnapshotHostV13 } from "../../src/modules/game-module-actor-snapshot-host.js";
import { TargetSolutionPayloadSchema } from "../../src/modules/game-module-runtime-payloads.js";
import type { ResolvedActorSnapshotGrantV13 } from "../../src/modules/game-module-resolver.js";

const grant: ResolvedActorSnapshotGrantV13 = {
  grantId: "nearest/actor-read/enemies",
  instanceId: "nearest",
  ownerActorId: "player-one",
  descriptor: {
    readId: "enemies",
    ownerRelation: "different-owner",
    sourceActorRoles: ["player"],
    targetActorRoles: ["enemy", "boss"],
    maximumEntries: 8,
    entryFields: ["actorId", "actorGeneration", "role", "active", "position"],
    envelopeFields: [
      "directoryRevision",
      "sampledAtMs",
      "sampledFrameSequence",
      "entryCount",
    ],
    order: "distance-then-actor-id-generation",
    distanceOrigin: "owner-position-same-snapshot",
  },
};

function actor(
  actorId: string,
  role: "player" | "enemy" | "boss",
  x: number,
  y: number,
) {
  return {
    actorId,
    role,
    active: true,
    position: { x, y },
    collisionRadius: 5,
    healthRatio: 1,
  } as const;
}

describe("ADR 0027 actor snapshots", () => {
  it("returns only granted fields and uses owner position from one atomic read", () => {
    const host = new DeterministicActorSnapshotHostV13([grant]);
    host.register(actor("player-one", "player", 10, 10));
    host.register(actor("enemy-b", "enemy", 12, 10));
    host.register(actor("enemy-a", "enemy", 8, 10));
    const snapshot = host.snapshot("nearest", grant.grantId, 20, 3);
    expect(snapshot.entries.map((entry) => entry.actorId)).toEqual([
      "enemy-a",
      "enemy-b",
    ]);
    expect(Object.keys(snapshot.entries[0]!).sort()).toEqual(
      [...grant.descriptor.entryFields].sort(),
    );
    expect(snapshot).toMatchObject({
      sampledAtMs: 20,
      sampledFrameSequence: 3,
      entryCount: 2,
    });
  });

  it("increments revision on relevant changes and generation before ID reuse", () => {
    const host = new DeterministicActorSnapshotHostV13([grant]);
    host.register(actor("player-one", "player", 0, 0));
    const firstGeneration = host.register(actor("enemy-a", "enemy", 1, 0));
    const before = host.directoryRevision;
    host.update("enemy-a", { position: { x: 2, y: 0 } });
    expect(host.directoryRevision).toBe(before + 1);
    host.remove("enemy-a");
    const secondGeneration = host.register(actor("enemy-a", "enemy", 3, 0));
    expect(secondGeneration).toBe(firstGeneration + 1);
  });

  it("caps entries and rejects unauthorized or invalid envelope reads", () => {
    const cappedGrant = {
      ...grant,
      descriptor: { ...grant.descriptor, maximumEntries: 1 },
    } satisfies ResolvedActorSnapshotGrantV13;
    const host = new DeterministicActorSnapshotHostV13([cappedGrant]);
    host.register(actor("player-one", "player", 0, 0));
    host.register(actor("enemy-a", "enemy", 1, 0));
    host.register(actor("enemy-b", "enemy", 2, 0));
    expect(host.snapshot("nearest", cappedGrant.grantId, 0, 0).entryCount).toBe(
      1,
    );
    expect(() => host.snapshot("other", cappedGrant.grantId, 0, 0)).toThrow(
      /cannot use/,
    );
    expect(() => host.snapshot("nearest", cappedGrant.grantId, 0.5, 0)).toThrow(
      /non-negative safe integer/,
    );
  });

  it("keeps a published nearest direction stale until the next targeting update", () => {
    const host = new DeterministicActorSnapshotHostV13([grant]);
    host.register(actor("player-one", "player", 0, 0));
    const firstGeneration = host.register(actor("enemy-a", "enemy", 0, -10));

    const publishNearest = (frame: number) => {
      const snapshot = host.snapshot("nearest", grant.grantId, frame, frame);
      const target = snapshot.entries.find((entry) => entry.active === true);
      if (target === undefined)
        return TargetSolutionPayloadSchema.parse({
          revision: frame,
          emittedAtMs: frame,
          attackChannelId: "player.primary",
          direction: { x: 1, y: 0 },
          targetEvidence: null,
        });
      const position = target.position as { x: number; y: number };
      const length = Math.hypot(position.x, position.y);
      return TargetSolutionPayloadSchema.parse({
        revision: frame,
        emittedAtMs: frame,
        attackChannelId: "player.primary",
        direction: { x: position.x / length, y: position.y / length },
        targetEvidence: {
          actorId: target.actorId,
          actorGeneration: target.actorGeneration,
          directoryRevision: snapshot.directoryRevision,
        },
      });
    };

    let deliverySolution = publishNearest(1);
    expect(deliverySolution.direction).toEqual({ x: 0, y: -1 });
    expect(deliverySolution.targetEvidence?.actorGeneration).toBe(
      firstGeneration,
    );

    host.remove("enemy-a");
    const secondGeneration = host.register(actor("enemy-a", "enemy", 10, 0));
    expect(secondGeneration).toBe(firstGeneration + 1);
    // Delivery has no actor-directory grant and consumes only its latched state.
    expect(deliverySolution.direction).toEqual({ x: 0, y: -1 });
    expect(deliverySolution.targetEvidence?.actorGeneration).toBe(
      firstGeneration,
    );

    deliverySolution = publishNearest(2);
    expect(deliverySolution.direction).toEqual({ x: 1, y: 0 });
    expect(deliverySolution.targetEvidence?.actorGeneration).toBe(
      secondGeneration,
    );
    expect(deliverySolution.targetEvidence?.directoryRevision).toBeGreaterThan(
      2,
    );
  });
});
