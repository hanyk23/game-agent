import { describe, expect, it } from "vitest";

import { createPhase6RehearsalDefinition } from "../../src/evaluation/phase-6-rehearsal.js";
import {
  caseAwareEndSnapshotIssues,
  caseAwarePlaySnapshotIssues,
  deriveCaseAwareBrowserAssertions,
} from "../../src/verification/browser-assertion-profile.js";

describe("case-aware browser assertions", () => {
  it("derives distinct outcomes and only reachable score-wave evidence", () => {
    const definition = createPhase6RehearsalDefinition();
    const [bossCase, scoreCase, survivalCase] = definition.cases;
    const boss = deriveCaseAwareBrowserAssertions(bossCase!.spec, true);
    const score = deriveCaseAwareBrowserAssertions(scoreCase!.spec, true);
    const survival = deriveCaseAwareBrowserAssertions(survivalCase!.spec, true);

    expect(boss.expectedOutcome.reason).toBe("bossDefeated");
    expect(boss.requiredBossPatternIds).toHaveLength(5);
    expect(boss.requiredPickupIds).toHaveLength(4);
    expect(score.expectedOutcome).toEqual({
      won: true,
      reason: "scoreReached",
      targetScore: 500,
    });
    expect(score.requiredWaves.map((wave) => wave.id)).toEqual([
      "browser-opening",
    ]);
    expect(score.requiredBossPatternIds).toEqual([]);
    expect(score.assets.requireEveryExpectedTextureUsed).toBe(false);
    expect(survival.expectedOutcome).toEqual({
      won: true,
      reason: "surviveMs",
      targetMs: 10_000,
    });
    expect(survival.requiredWaves).toHaveLength(3);
  });

  it("allows reachable Boss phase evidence after the configured wave schedule", () => {
    const bossSpec = structuredClone(
      createPhase6RehearsalDefinition().cases[0]!.spec,
    );
    const timings = [
      { startMs: 0, durationMs: 15_000 },
      { startMs: 15_000, durationMs: 18_000 },
      { startMs: 33_000, durationMs: 20_000 },
    ];
    bossSpec.enemyWaves.forEach((wave, index) => {
      const timing = timings[index];
      if (timing !== undefined) Object.assign(wave, timing);
    });

    const timeout = deriveCaseAwareBrowserAssertions(
      bossSpec,
      true,
    ).playEvidenceTimeoutMs;
    expect(timeout).toBeGreaterThan(60_000);
    expect(timeout).toBeLessThanOrEqual(120_000);
  });

  it("accepts matching score outcome evidence and rejects a wrong reason", () => {
    const scoreCase = createPhase6RehearsalDefinition().cases[1]!;
    const assertions = deriveCaseAwareBrowserAssertions(scoreCase.spec, true);
    const snapshot = {
      scene: "end" as const,
      won: true,
      outcomeReason: "scoreReached" as const,
      elapsedMs: 2_000,
      score: 500,
      scoring: { ...scoreCase.spec.scoring },
    };
    expect(caseAwareEndSnapshotIssues(snapshot, assertions)).toEqual([]);
    expect(
      caseAwareEndSnapshotIssues(
        { ...snapshot, outcomeReason: "bossDefeated" },
        assertions,
      ),
    ).toContain("expected scoreReached but received bossDefeated");
  });

  it("reports configured play evidence gaps without weakening caps", () => {
    const scoreCase = createPhase6RehearsalDefinition().cases[1]!;
    const assertions = deriveCaseAwareBrowserAssertions(scoreCase.spec, true);
    const issues = caseAwarePlaySnapshotIssues(
      {
        scene: "play",
        activeEnemyBullets: 21,
        maxEnemyBullets: 20,
        peakActiveEnemyBullets: 21,
        activePlayerBullets: 0,
        maxPlayerBullets: 20,
        activeEnemies: 0,
        activePickups: 0,
        maxPickups: 4,
        scoring: { ...scoreCase.spec.scoring },
        weapons: [],
        enemyWaves: [],
        bulletPatterns: [],
        pickups: [],
        assets: {
          mode: "catalog",
          expectedTextureKeys: ["a", "b", "c", "d", "e"],
          loadedTextureKeys: ["a"],
          usedTextureKeys: ["a"],
        },
      },
      assertions,
    );
    expect(issues).toContain(
      "active enemy bullets exceeded the configured cap",
    );
    expect(issues).toContain("peak enemy bullets exceeded the configured cap");
    expect(issues).toContain("weapon feather-shot is missing");
    expect(issues).toContain("wave browser-opening did not spawn");
    expect(issues).toContain("not every selected catalog texture loaded");
  });
});
