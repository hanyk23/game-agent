import { describe, expect, it } from "vitest";

import { deriveResourceBudget } from "../../src/runtime/resource-budget.js";
import { createValidSpec } from "../fixtures/create-valid-spec.js";

describe("resource budget", () => {
  it("derives player capacity from weapon lifetime and fire rate", () => {
    const spec = createValidSpec();
    const result = deriveResourceBudget(spec, "balanced");

    expect(result.budget.maxPlayerBullets).toBeGreaterThanOrEqual(16);
    expect(result.budget.maxPlayerBullets).toBeLessThanOrEqual(128);
    expect(result.budget.maxEnemyBullets).toBe(spec.viewport.maxEnemyBullets);
  });

  it("records transparent device-profile clamps", () => {
    const spec = createValidSpec();
    spec.viewport.maxEnemyBullets = 900;
    spec.viewport.maxEnemies = 100;
    const result = deriveResourceBudget(spec, "mobile");

    expect(result.budget.maxEnemyBullets).toBe(180);
    expect(result.budget.maxEnemies).toBe(32);
    expect(result.adjustments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "maxEnemyBullets",
          requested: 900,
          effective: 180,
        }),
        expect.objectContaining({
          field: "maxEnemies",
          requested: 100,
          effective: 32,
        }),
      ]),
    );
  });
});
