import { describe, expect, it } from "vitest";

import type { ActorRootReferenceV1 } from "../../src/modules/game-module-actor-root-custody-host.js";
import { ActorSetHealthBankHostV1 } from "../../src/modules/game-module-actor-set-combat-host.js";
import { SafeMonotonicCounterError } from "../../src/modules/game-module-safe-counter.js";

function root(
  slotIndex: number,
  generation: number,
  sourceId = "wave-scout",
): ActorRootReferenceV1 {
  return Object.freeze({
    rootChannelId: "enemy-roots",
    actorId: `root/waves/${slotIndex}`,
    actorGeneration: generation,
    actorRole: "enemy",
    sourceId,
    slotIndex,
  });
}

function damage(reference: ActorRootReferenceV1, amount: number, sequence = 0) {
  return {
    sequence,
    emittedAtMs: sequence,
    sourceEvidenceId: `contact:${sequence}`,
    targetRootChannelId: reference.rootChannelId,
    targetActorId: reference.actorId,
    targetActorGeneration: reference.actorGeneration,
    amount,
    damageKind: "projectile" as const,
  };
}

function fixture(overrides = {}) {
  let nowMs = 0;
  const host = new ActorSetHealthBankHostV1({
    rootChannelId: "enemy-roots",
    actorRole: "enemy",
    capacity: 2,
    maximumHealthBySourceId: { "wave-scout": 10, elite: 25 },
    nowMs: () => nowMs,
    ...overrides,
  });
  return { host, setNowMs: (value: number) => (nowMs = value) };
}

describe("ADR 0028 actor-set health host", () => {
  it("initializes source health and resets a reused slot generation", () => {
    const { host } = fixture();
    const first = root(0, 0);
    expect(host.activate(first)).toMatchObject({
      current: 10,
      maximum: 10,
      ratio: 1,
      reason: "initialized",
    });
    host.prune(first);
    const reused = root(0, 1, "elite");
    expect(host.activate(reused)).toMatchObject({ current: 25, maximum: 25 });
    expect(() => host.damage(damage(first, 1))).toThrow(/inactive.*stale/);
  });

  it("emits one inclusive-zero defeat and suppresses duplicate defeat", () => {
    const { host } = fixture();
    const reference = root(0, 0);
    host.activate(reference);
    expect(host.damage(damage(reference, 4))).toMatchObject({
      state: { current: 6, reason: "damaged" },
    });
    const depleted = host.damage(damage(reference, 6, 1));
    expect(depleted).toMatchObject({
      state: { current: 0, ratio: 0, reason: "depleted" },
      defeated: { sequence: 0, actorId: reference.actorId, actorGeneration: 0 },
    });
    expect(() => host.damage(damage(reference, 1, 2))).toThrow(/depleted/);
  });

  it("rejects capacity one-over, wrong lineage, and unknown sources", () => {
    const { host } = fixture();
    host.activate(root(0, 0));
    host.activate(root(1, 1));
    expect(() => host.activate(root(2, 2))).toThrow(/capacity/);
    expect(() =>
      host.activate({ ...root(3, 3), rootChannelId: "boss-roots" }),
    ).toThrow(/lineage/);
    expect(() => fixture().host.activate(root(0, 0, "unknown"))).toThrow(
      /unknown/,
    );
  });

  it("preflights revision and defeat evidence overflow before mutation", () => {
    const revision = fixture({ lastRevision: Number.MAX_SAFE_INTEGER }).host;
    expect(() => revision.activate(root(0, 0))).toThrow(
      SafeMonotonicCounterError,
    );
    expect(revision.snapshot().entries).toEqual([]);
    const event = fixture({ lastEventSequence: Number.MAX_SAFE_INTEGER }).host;
    const reference = root(0, 0);
    event.activate(reference);
    expect(() => event.damage(damage(reference, 10))).toThrow(
      SafeMonotonicCounterError,
    );
    expect(event.snapshot().entries[0]).toMatchObject({
      current: 10,
      defeated: false,
    });
  });

  it("requires successful root pruning before clean disposal", () => {
    const { host } = fixture();
    const reference = root(0, 0);
    host.activate(reference);
    expect(() => host.dispose()).toThrow(/retains active/);
    host.prune(reference);
    host.dispose();
    expect(() => host.snapshot()).toThrow(/disposed/);
  });
});
