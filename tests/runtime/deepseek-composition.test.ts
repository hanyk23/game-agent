import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { composeShooterGame } from "../../src/runtime/shooter-game-composer.js";

describe("validated DeepSeek spec composition", () => {
  it("composes the recorded passing requirement result without a model call", () => {
    const reportPath = new URL(
      "../../evals/reports/deepseek-direct-live-spec.json",
      import.meta.url,
    );
    const report = JSON.parse(readFileSync(reportPath, "utf8")) as {
      status: string;
      spec: unknown;
    };

    expect(report.status).toBe("passed");
    const runtime = composeShooterGame(report.spec, {
      resourceProfile: "balanced",
    });

    expect(runtime.schemaVersion).toBe("1.0.0");
    expect(runtime.composition.budgetAdjustments).toEqual([]);
    expect(runtime.resourceBudget).toMatchObject({
      maxEnemyBullets: 200,
      maxPlayerBullets: 16,
      maxEnemies: 30,
    });
    expect(runtime.schedule).toEqual({
      bossStartMs: 30_000,
      roundTimeLimitMs: 210_000,
    });
  });
});
