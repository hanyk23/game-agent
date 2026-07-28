import { describe, expect, it } from "vitest";

import { validateShooterGameSpec } from "../../src/requirements/shooter-game-spec.js";
import { createValidSpec } from "../fixtures/create-valid-spec.js";

// T7a — the time-budget ceilings are unified as named constants. These tests pin
// the口径 relationship (wave start/duration ≤ run time limits) at the boundary so
// the constants cannot silently drift. No bound is loosened relative to before.
describe("ShooterGameSpec time-budget ceilings (T7a)", () => {
  it("accepts an enemy wave starting at the 600s ceiling", () => {
    const spec = createValidSpec();
    spec.enemyWaves[0]!.startMs = 600_000;
    expect(validateShooterGameSpec(spec).success).toBe(true);
  });

  it("rejects an enemy wave starting past the 600s ceiling", () => {
    const spec = createValidSpec();
    spec.enemyWaves[0]!.startMs = 600_001;
    expect(validateShooterGameSpec(spec).success).toBe(false);
  });

  it("accepts an enemy wave duration at the 180s ceiling", () => {
    const spec = createValidSpec();
    spec.enemyWaves[0]!.durationMs = 180_000;
    expect(validateShooterGameSpec(spec).success).toBe(true);
  });

  it("rejects an enemy wave duration past the 180s ceiling", () => {
    const spec = createValidSpec();
    spec.enemyWaves[0]!.durationMs = 180_001;
    expect(validateShooterGameSpec(spec).success).toBe(false);
  });

  it("accepts a surviveMs win condition at the 900s ceiling", () => {
    const spec = createValidSpec();
    spec.winCondition = { type: "surviveMs", targetMs: 900_000 };
    expect(validateShooterGameSpec(spec).success).toBe(true);
  });

  it("rejects a surviveMs win condition past the 900s ceiling", () => {
    const spec = createValidSpec();
    spec.winCondition = { type: "surviveMs", targetMs: 900_001 };
    expect(validateShooterGameSpec(spec).success).toBe(false);
  });

  it("accepts a timeExpired lose condition at the 900s ceiling", () => {
    const spec = createValidSpec();
    spec.loseCondition = { type: "timeExpired", limitMs: 900_000 };
    expect(validateShooterGameSpec(spec).success).toBe(true);
  });

  it("rejects a timeExpired lose condition past the 900s ceiling", () => {
    const spec = createValidSpec();
    spec.loseCondition = { type: "timeExpired", limitMs: 900_001 };
    expect(validateShooterGameSpec(spec).success).toBe(false);
  });
});
