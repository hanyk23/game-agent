import { describe, expect, it } from "vitest";

import {
  assertCatalogAssetQueryCoverage,
  composeShooterGame,
  ShooterGameCompositionError,
} from "../../src/runtime/shooter-game-composer.js";
import { createValidSpec } from "../fixtures/create-valid-spec.js";

describe("shooter game composer", () => {
  it("maps a complete validated spec into deterministic runtime configuration", () => {
    const spec = createValidSpec();
    const result = composeShooterGame(spec);

    expect(result.schemaVersion).toBe("1.0.0");
    expect(result.enemyWaves).toHaveLength(spec.enemyWaves.length);
    expect(result.bulletPatterns).toHaveLength(spec.bulletPatterns.length);
    expect(result.schedule.bossStartMs).toBe(30_000);
    expect(result.scoring).toEqual(spec.scoring);
    expect(result.schedule.roundTimeLimitMs).toBeGreaterThan(
      result.schedule.bossStartMs,
    );
    expect(result.resourceBudget.profile).toBe("balanced");
    expect(result.resolvedAssets).toEqual({ mode: "legacy-geometric" });
    expect(result).not.toBe(spec);
    expect(result.enemyWaves).not.toBe(spec.enemyWaves);
  });

  it.each(["aimed", "wave", "rain", "rotatingRing", "burst"] as const)(
    "composes the %s pattern",
    (pattern) => {
      const spec = createValidSpec();
      spec.bulletPatterns[0] = { ...spec.bulletPatterns[0]!, pattern };

      expect(composeShooterGame(spec).bulletPatterns[0]?.pattern).toBe(pattern);
    },
  );

  it("rejects unreachable time-expired schedules", () => {
    const spec = createValidSpec();
    spec.loseCondition = { type: "timeExpired", limitMs: 20_000 };

    expect(() => composeShooterGame(spec)).toThrow(
      "must leave time for the boss encounter",
    );
  });

  it.each([
    { type: "bossDefeated" } as const,
    { type: "surviveMs", targetMs: 45_000 } as const,
    { type: "scoreReached", targetScore: 1_000 } as const,
  ])("composes the $type win condition", (winCondition) => {
    const spec = createValidSpec();
    spec.winCondition = winCondition;

    const result = composeShooterGame(spec);

    expect(result.winCondition).toEqual(winCondition);
    if (winCondition.type === "surviveMs") {
      expect(result.schedule.roundTimeLimitMs).toBe(winCondition.targetMs);
    }
  });

  it("allows a pre-Boss time limit when the win does not require the Boss", () => {
    const spec = createValidSpec();
    spec.winCondition = { type: "scoreReached", targetScore: 100 };
    spec.loseCondition = { type: "timeExpired", limitMs: 20_000 };

    expect(composeShooterGame(spec).schedule.roundTimeLimitMs).toBe(20_000);
  });

  it("rejects a survive target beyond the loss limit", () => {
    const spec = createValidSpec();
    spec.winCondition = { type: "surviveMs", targetMs: 20_001 };
    spec.loseCondition = { type: "timeExpired", limitMs: 20_000 };

    expect(() => composeShooterGame(spec)).toThrow(
      "survive target cannot exceed",
    );
  });

  it("rejects locally invalid input before composition", () => {
    const spec = createValidSpec() as Record<string, unknown>;
    spec.unsafeCommand = "run something";

    expect(() => composeShooterGame(spec)).toThrow();
    expect(() => composeShooterGame(spec)).not.toThrow(
      ShooterGameCompositionError,
    );
  });

  it("rejects missing fixed catalog role queries before asset planning", () => {
    const spec = createValidSpec();
    spec.assetQueries = spec.assetQueries.filter(
      (query) => query.category !== "background",
    );

    expect(() => assertCatalogAssetQueryCoverage(spec)).toThrow(
      "requires a background asset query",
    );
    expect(composeShooterGame(spec).resolvedAssets).toEqual({
      mode: "legacy-geometric",
    });
  });
});
