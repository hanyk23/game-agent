import { describe, expect, it } from "vitest";

import {
  DeterministicLogicalEntityDirectory,
  LogicalEntityDirectoryError,
  LogicalEntityDirectoryErrorCode,
} from "../../src/modules/game-module-entity-directory.js";

function createDirectory(capacity = 1) {
  return new DeterministicLogicalEntityDirectory(
    [
      {
        channelId: "enemy.projectiles",
        ownerInstanceId: "delivery",
        ownerActorId: "enemy-one",
        entityRole: "enemy-projectile",
        capacity,
        readerInstanceIds: ["resolver"],
      },
    ],
    [
      {
        grantId: "resolver.final-mutation",
        granteeInstanceId: "resolver",
        channelId: "enemy.projectiles",
        operations: ["consume", "transfer"],
        transferTargetActorIds: ["player-one"],
      },
    ],
  );
}

function errorCode(action: () => void): string {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(LogicalEntityDirectoryError);
    return (error as LogicalEntityDirectoryError).code;
  }
  throw new Error("expected logical entity directory failure");
}

describe("safe logical entity channels and mutation grants", () => {
  it("exposes frozen logical references without runtime handles", () => {
    const directory = createDirectory();
    const reference = directory.activate(
      "delivery",
      "enemy.projectiles",
      "projectile-one",
      1,
    );
    expect(Object.isFrozen(reference)).toBe(true);
    expect(reference).toEqual({
      channelId: "enemy.projectiles",
      entityId: "projectile-one",
      generation: 1,
      ownerActorId: "enemy-one",
      entityRole: "enemy-projectile",
    });
    expect(directory.read("resolver", reference)).toEqual(reference);
    expect(
      directory.isGenerationActive("enemy.projectiles", "projectile-one", 1),
    ).toBe(true);
  });

  it("permits only granted final consume or bounded transfer operations", () => {
    const directory = createDirectory();
    const consumed = directory.activate(
      "delivery",
      "enemy.projectiles",
      "projectile-one",
      1,
    );
    expect(
      directory.mutate(
        "resolver",
        "resolver.final-mutation",
        consumed,
        "consume",
      ),
    ).toMatchObject({ operation: "consume", before: consumed });
    expect(
      directory.isGenerationActive("enemy.projectiles", "projectile-one", 1),
    ).toBe(false);

    const transferred = directory.activate(
      "delivery",
      "enemy.projectiles",
      "projectile-one",
      2,
    );
    const evidence = directory.mutate(
      "resolver",
      "resolver.final-mutation",
      transferred,
      "transfer",
      "player-one",
    );
    expect(evidence.after?.ownerActorId).toBe("player-one");
  });

  it("rejects unauthorized reads/mutations, stale generations, and capacity overflow atomically", () => {
    const directory = createDirectory();
    const reference = directory.activate(
      "delivery",
      "enemy.projectiles",
      "projectile-one",
      1,
    );
    expect(errorCode(() => directory.read("intruder", reference))).toBe(
      LogicalEntityDirectoryErrorCode.unauthorized,
    );
    expect(
      errorCode(() =>
        directory.mutate(
          "intruder",
          "resolver.final-mutation",
          reference,
          "consume",
        ),
      ),
    ).toBe(LogicalEntityDirectoryErrorCode.unauthorized);
    expect(
      errorCode(() =>
        directory.activate(
          "delivery",
          "enemy.projectiles",
          "projectile-two",
          1,
        ),
      ),
    ).toBe(LogicalEntityDirectoryErrorCode.capacityExceeded);
    expect(directory.snapshot().activeEntities).toEqual([reference]);
  });

  it("requires release before destruction and rejects later operations", () => {
    const directory = createDirectory();
    directory.activate("delivery", "enemy.projectiles", "projectile-one", 1);
    expect(errorCode(() => directory.destroy())).toBe(
      LogicalEntityDirectoryErrorCode.activeEntityLeak,
    );
    expect(directory.releaseOwnedChannels("delivery")).toHaveLength(1);
    directory.destroy();
    expect(errorCode(() => directory.snapshot())).toBe(
      LogicalEntityDirectoryErrorCode.destroyed,
    );
  });
});
