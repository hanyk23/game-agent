import { describe, expect, it } from "vitest";

import {
  parseShooterGameSpec,
  validateShooterGameSpec,
} from "../../src/requirements/shooter-game-spec.js";
import { createValidSpec } from "../fixtures/create-valid-spec.js";

// S6a — the bullet-pattern count is gameplay-driven, not a fixed shape baked
// into the contract. The schema keeps a non-empty lower bound (min 1) so the
// single `bulletPatterns[0]!` consumer in spec-completion-policy stays safe,
// but it no longer demands three patterns. These tests pin both edges of that
// bound: one pattern is accepted, zero patterns is still rejected.
function createSinglePatternSpec() {
  const spec = createValidSpec();
  // Keep exactly one pattern and repoint every pattern reference at it so the
  // reference-integrity superRefine still passes.
  spec.bulletPatterns = [spec.bulletPatterns[0]!];
  const soleId = spec.bulletPatterns[0]!.id;
  spec.enemyWaves = spec.enemyWaves.map((wave) => ({
    ...wave,
    patternIds: [soleId],
  }));
  spec.boss.phases = spec.boss.phases.map((phase) => ({
    ...phase,
    patternIds: [soleId],
  }));
  return spec;
}

describe("ShooterGameSpec bullet-pattern count", () => {
  it("accepts a spec that declares a single bullet pattern", () => {
    const spec = createSinglePatternSpec();

    expect(spec.bulletPatterns).toHaveLength(1);
    expect(() => parseShooterGameSpec(spec)).not.toThrow();
    expect(validateShooterGameSpec(spec).success).toBe(true);
  });

  it("still rejects a spec that declares no bullet patterns", () => {
    const spec = createSinglePatternSpec();
    spec.bulletPatterns = [];

    const result = validateShooterGameSpec(spec);
    expect(result.success).toBe(false);
    if (!result.success) {
      // Prove the rejection comes from the surviving `.min(1)` lower bound on
      // bulletPatterns itself, not merely from an incidental dangling
      // pattern reference elsewhere in the spec.
      expect(
        result.error.issues.some(
          (issue) =>
            issue.code === "too_small" &&
            issue.path.length === 1 &&
            issue.path[0] === "bulletPatterns",
        ),
      ).toBe(true);
    }
  });
});
