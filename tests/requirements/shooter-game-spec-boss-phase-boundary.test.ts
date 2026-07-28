import { describe, expect, it } from "vitest";

import { validateShooterGameSpec } from "../../src/requirements/shooter-game-spec.js";
import { createValidSpec } from "../fixtures/create-valid-spec.js";

// T8 — final boss phase boundary. The existing strict-descending rule is kept;
// this only rejects an unreachable final phase (healthThreshold <= 0).
describe("ShooterGameSpec boss phase boundaries (T8)", () => {
  it("keeps accepting the descending fixture thresholds (1 → 0.66 → 0.33)", () => {
    expect(validateShooterGameSpec(createValidSpec()).success).toBe(true);
  });

  it("rejects a final phase whose threshold is exactly 0 (unreachable)", () => {
    const spec = createValidSpec();
    spec.boss.phases[spec.boss.phases.length - 1]!.healthThreshold = 0;
    const result = validateShooterGameSpec(spec);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes("final boss phase healthThreshold"),
        ),
      ).toBe(true);
    }
  });

  it("still rejects non-descending thresholds (existing rule preserved)", () => {
    const spec = createValidSpec();
    spec.boss.phases[1]!.healthThreshold = 1;
    const result = validateShooterGameSpec(spec);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes("strictly descending"),
        ),
      ).toBe(true);
    }
  });

  it("accepts a small-but-positive final threshold at the reachable boundary", () => {
    const spec = createValidSpec();
    spec.boss.phases[spec.boss.phases.length - 1]!.healthThreshold = 0.05;
    expect(validateShooterGameSpec(spec).success).toBe(true);
  });
});
