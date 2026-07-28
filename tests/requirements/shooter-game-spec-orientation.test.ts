import { describe, expect, it } from "vitest";

import { validateShooterGameSpec } from "../../src/requirements/shooter-game-spec.js";
import { createValidSpec } from "../fixtures/create-valid-spec.js";

// T5 — the orientation field is optional and, when present, must agree with the
// viewport aspect (vertical ⇔ height>width, horizontal ⇔ width>height).
describe("ShooterGameSpec orientation (T5)", () => {
  it("stays valid when orientation is omitted (backward compatible)", () => {
    const spec = createValidSpec();
    expect("orientation" in spec).toBe(false);
    expect(validateShooterGameSpec(spec).success).toBe(true);
  });

  it("accepts vertical orientation with a taller viewport", () => {
    const spec = { ...createValidSpec(), orientation: "vertical" as const };
    // Fixture viewport is 540×960 (height > width).
    expect(validateShooterGameSpec(spec).success).toBe(true);
  });

  it("accepts horizontal orientation with a wider viewport", () => {
    const spec = createValidSpec();
    const horizontal = {
      ...spec,
      orientation: "horizontal" as const,
      viewport: {
        ...spec.viewport,
        logicalWidth: 960,
        logicalHeight: 600,
      },
    };
    expect(validateShooterGameSpec(horizontal).success).toBe(true);
  });

  it("rejects vertical orientation when the viewport is wider than tall", () => {
    const spec = createValidSpec();
    const result = validateShooterGameSpec({
      ...spec,
      orientation: "vertical",
      viewport: { ...spec.viewport, logicalWidth: 960, logicalHeight: 600 },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes("vertical orientation requires"),
        ),
      ).toBe(true);
    }
  });

  it("rejects horizontal orientation when the viewport is taller than wide", () => {
    const spec = { ...createValidSpec(), orientation: "horizontal" as const };
    // Fixture viewport is 540×960 (height > width), inconsistent with horizontal.
    const result = validateShooterGameSpec(spec);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes("horizontal orientation requires"),
        ),
      ).toBe(true);
    }
  });

  it("rejects a square viewport for either orientation (boundary)", () => {
    const spec = createValidSpec();
    const square = { ...spec.viewport, logicalWidth: 600, logicalHeight: 600 };

    expect(
      validateShooterGameSpec({
        ...spec,
        orientation: "vertical",
        viewport: square,
      }).success,
    ).toBe(false);
    expect(
      validateShooterGameSpec({
        ...spec,
        orientation: "horizontal",
        viewport: square,
      }).success,
    ).toBe(false);
  });

  it("rejects orientation values outside the vertical/horizontal enum", () => {
    const spec = createValidSpec();
    expect(
      validateShooterGameSpec({ ...spec, orientation: "portrait" }).success,
    ).toBe(false);
  });
});
