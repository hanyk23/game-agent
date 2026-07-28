import { describe, expect, it } from "vitest";

import {
  designFromSpec,
  toGameDesignArtifact,
} from "../../src/gameplay/design-from-spec.js";
import { validateGameDesign } from "../../src/gameplay/game-design.js";
import type { ShooterGameSpec } from "../../src/requirements/shooter-game-spec.js";
import { createValidSpec } from "../fixtures/create-valid-spec.js";

function horizontalSpec(): ShooterGameSpec {
  const spec = createValidSpec();
  return {
    ...spec,
    orientation: "horizontal",
    viewport: { ...spec.viewport, logicalWidth: 1_024, logicalHeight: 576 },
  };
}

describe("designFromSpec (S4)", () => {
  it("produces a schema-valid GameDesign from a valid spec", () => {
    const design = designFromSpec(createValidSpec());
    expect(validateGameDesign(design).success).toBe(true);
    expect(design.kind).toBe("game-design");
    expect(design.hasBoss).toBe(true);
  });

  it("mirrors an explicit orientation as a first-class decision", () => {
    expect(designFromSpec(horizontalSpec()).orientation).toBe("horizontal");
    expect(
      designFromSpec({ ...createValidSpec(), orientation: "vertical" })
        .orientation,
    ).toBe("vertical");
  });

  it("defaults orientation from the viewport when the spec omits it", () => {
    const spec = createValidSpec();
    expect("orientation" in spec).toBe(false);
    // Fixture viewport 540×960 is taller than wide → vertical.
    expect(designFromSpec(spec).orientation).toBe("vertical");
  });

  it("summarizes the bullet-pattern composition without duplication", () => {
    const design = designFromSpec(createValidSpec());
    expect(design.bulletPatterns.totalPatterns).toBe(3);
    expect(design.bulletPatterns.kinds).toEqual(["radial", "spiral", "fan"]);
    expect(design.bulletPatterns.hasAimedPressure).toBe(false);
  });

  it("derives wave structure by reusing the deterministic scheduler", () => {
    const design = designFromSpec(createValidSpec());
    expect(design.waves).toHaveLength(1);
    expect(design.waves[0]).toMatchObject({
      waveId: "spirit-wave",
      startMs: 0,
      endMs: 30_000,
      patternCount: 1,
    });
    expect(design.difficultyCurve.waveCount).toBe(1);
    expect(design.difficultyCurve.declaredDifficulty).toBe("medium");
  });

  it("captures boss phase decisions in descending order", () => {
    const design = designFromSpec(createValidSpec());
    expect(design.boss.phaseCount).toBe(3);
    expect(design.boss.phaseThresholds).toEqual([1, 0.66, 0.33]);
    expect(design.boss.patternCount).toBe(3);
  });

  it("does NOT perform a winnability self-check in S4", () => {
    const design = designFromSpec(createValidSpec());
    expect(design.playability.selfCheckPerformed).toBe(false);
  });

  it("wraps the design in a pure-data artifact envelope (GAP-1)", () => {
    const spec = createValidSpec();
    const artifact = toGameDesignArtifact(spec, designFromSpec(spec));
    expect(artifact.kind).toBe("game-design-artifact");
    expect(artifact.sourceSpecSchemaVersion).toBe("1.0.0");
    // Must be JSON-serializable with no functions / cycles.
    expect(() => JSON.parse(JSON.stringify(artifact))).not.toThrow();
  });
});
