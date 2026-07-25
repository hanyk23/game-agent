import { describe, expect, it } from "vitest";

import {
  ContactGenerationLedgerError,
  ContactGenerationLedgerErrorCode,
  DeterministicContactGenerationLedger,
} from "../../src/modules/game-module-contact-generation-ledger.js";
import { DeterministicLogicalEntityDirectory } from "../../src/modules/game-module-entity-directory.js";

function candidate(
  contactId: string,
  sourceGeneration = 1,
  targetActorId = "player-one",
) {
  return {
    sequence: 0,
    emittedAtMs: 10,
    contactId,
    sourceChannelId: "enemy.projectiles",
    sourceEntityId: "projectile-one",
    sourceGeneration,
    sourceActorId: "enemy-one",
    targetActorId,
    contactSequence: 0,
    metadata: { damage: 2, damageKind: "projectile" },
  } as const;
}

function errorCode(action: () => void): string {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(ContactGenerationLedgerError);
    return (error as ContactGenerationLedgerError).code;
  }
  throw new Error("expected contact generation ledger failure");
}

function activitySource(activeGenerations: readonly number[]) {
  return {
    isGenerationActive: (
      _channelId: string,
      _entityId: string,
      generation: number,
    ) => activeGenerations.includes(generation),
  };
}

describe("bounded active-generation contact ledger", () => {
  it("suppresses duplicates by channel/entity/generation/target and prunes inactive generations", () => {
    const ledger = new DeterministicContactGenerationLedger(3);
    expect(ledger.claim(candidate("contact.first")).status).toBe("accepted");
    const duplicate = ledger.claim(candidate("contact.duplicate"));
    expect(duplicate).toMatchObject({
      status: "duplicate",
      duplicateContactId: "contact.duplicate",
      entry: { firstContactId: "contact.first" },
    });
    expect(ledger.claim(candidate("contact.generation-two", 2)).status).toBe(
      "accepted",
    );
    expect(
      ledger.claim(candidate("contact.other-target", 2, "player-two")).status,
    ).toBe("accepted");

    const removed = ledger.pruneInactive(activitySource([2]));
    expect(removed.map((entry) => entry.firstContactId)).toEqual([
      "contact.first",
    ]);
    expect(ledger.snapshot().count).toBe(2);
  });

  it("admits the exact ceiling and rejects one-over without mutation", () => {
    const ledger = new DeterministicContactGenerationLedger(1);
    ledger.claim(candidate("contact.first"));
    const before = ledger.snapshot();
    expect(
      errorCode(() =>
        ledger.claim(candidate("contact.second", 1, "player-two")),
      ),
    ).toBe(ContactGenerationLedgerErrorCode.ceilingExceeded);
    expect(ledger.snapshot()).toEqual(before);

    expect(
      errorCode(() =>
        new DeterministicContactGenerationLedger(0).claim(
          candidate("contact.zero"),
        ),
      ),
    ).toBe(ContactGenerationLedgerErrorCode.ceilingExceeded);
  });

  it("rejects invalid candidates and asynchronous pruning without partial mutation", () => {
    const ledger = new DeterministicContactGenerationLedger(2);
    ledger.claim(candidate("contact.first"));
    const before = ledger.snapshot();
    expect(
      errorCode(() => ledger.claim({ ...candidate("bad"), unknown: true })),
    ).toBe(ContactGenerationLedgerErrorCode.invalidCandidate);
    expect(
      errorCode(() =>
        ledger.pruneInactive({
          isGenerationActive: async () => true,
        } as never),
      ),
    ).toBe(ContactGenerationLedgerErrorCode.asynchronousPredicate);
    expect(
      errorCode(() =>
        ledger.pruneInactive({
          isGenerationActive: () => undefined,
        } as never),
      ),
    ).toBe(ContactGenerationLedgerErrorCode.invalidCandidate);
    expect(ledger.snapshot()).toEqual(before);
  });

  it("requires explicit zero-residue destruction and rejects later calls", () => {
    const ledger = new DeterministicContactGenerationLedger(2);
    ledger.claim(candidate("contact.first"));
    expect(errorCode(() => ledger.destroy())).toBe(
      ContactGenerationLedgerErrorCode.leakDetected,
    );
    expect(ledger.pruneInactive(activitySource([]))).toHaveLength(1);
    ledger.destroy();
    expect(errorCode(() => ledger.snapshot())).toBe(
      ContactGenerationLedgerErrorCode.destroyed,
    );
  });

  it("cannot prune an active directory generation and prunes it after consumption", () => {
    const directory = new DeterministicLogicalEntityDirectory(
      [
        {
          channelId: "enemy.projectiles",
          ownerInstanceId: "projectile-owner",
          ownerActorId: "enemy-one",
          entityRole: "hostile-projectile",
          capacity: 1,
          readerInstanceIds: ["resolver"],
        },
      ],
      [
        {
          grantId: "resolution.consume",
          granteeInstanceId: "resolver",
          channelId: "enemy.projectiles",
          operations: ["consume"],
          transferTargetActorIds: [],
        },
      ],
    );
    const reference = directory.activate(
      "projectile-owner",
      "enemy.projectiles",
      "projectile-one",
      1,
    );
    const ledger = new DeterministicContactGenerationLedger(1);
    ledger.claim(candidate("contact.first"));
    expect(ledger.pruneInactive(directory)).toEqual([]);
    expect(ledger.claim(candidate("contact.duplicate")).status).toBe(
      "duplicate",
    );

    directory.mutate("resolver", "resolution.consume", reference, "consume");
    expect(ledger.pruneInactive(directory)).toHaveLength(1);
    expect(ledger.claim(candidate("contact.reused"))).toMatchObject({
      status: "accepted",
      entry: { firstContactId: "contact.reused" },
    });
    ledger.pruneInactive(directory);
    ledger.destroy();
    directory.destroy();
  });
});
