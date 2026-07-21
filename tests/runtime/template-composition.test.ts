import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { demoShooterGameSpec } from "../../game-template/vertical-shooter/spec/demo-spec.js";
import { composeShooterGame } from "../../src/runtime/shooter-game-composer.js";

describe("template composition artifact", () => {
  it("matches deterministic composition of the complete demo spec", () => {
    const generatedPath = new URL(
      "../../game-template/vertical-shooter/src/generated/runtime-config.json",
      import.meta.url,
    );
    const generated = JSON.parse(
      readFileSync(generatedPath, "utf8"),
    ) as unknown;
    const expected = composeShooterGame(demoShooterGameSpec, {
      resourceProfile: "balanced",
    });

    expect(generated).toEqual(expected);
    expect(expected.resourceBudget.maxPlayerBullets).not.toBe(80);
    expect(expected.schedule).toEqual({
      bossStartMs: 5_000,
      roundTimeLimitMs: 35_000,
    });
  });
});
