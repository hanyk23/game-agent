import { describe, expect, it } from "vitest";

import { createPhase6RehearsalDefinition } from "../../src/evaluation/phase-6-rehearsal.js";
import {
  caseAwareEndSnapshotIssues,
  caseAwarePlaySnapshotIssues,
  deriveCaseAwareBrowserAssertions,
} from "../../src/verification/browser-assertion-profile.js";
import { createValidSpec } from "../fixtures/create-valid-spec.js";

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

// S7 — the Verifier only asserts "technically runnable" facts plus the
// gameplay the Spec actually declares. Boss phases, a winning end, and wave
// generation are no longer treated as universal premises: they are required
// only when the Spec's own win condition / schedule calls for them, while
// every declared wave and every technical cap remains enforced.
describe("case-aware assertions follow the Spec's declared gameplay", () => {
  function bossDefeatSpec() {
    // createValidSpec() already wins by bossDefeated with a single wave.
    return createValidSpec();
  }

  function survivalSpecWithNoWaveInHorizon() {
    // A legitimate survival Spec whose lone wave begins after the survival
    // target, so no wave falls inside the win horizon. The Boss and pickups
    // still exist in the Spec but are not part of the declared outcome.
    const spec = createValidSpec();
    spec.winCondition = { type: "surviveMs", targetMs: 10_000 };
    spec.loseCondition = { type: "timeExpired", limitMs: 20_000 };
    spec.enemyWaves = spec.enemyWaves.map((wave) => ({
      ...wave,
      startMs: 20_000,
    }));
    return spec;
  }

  it("keeps Boss-defeat specs requiring their Boss phases and a win", () => {
    const spec = bossDefeatSpec();
    const assertions = deriveCaseAwareBrowserAssertions(spec, true);

    expect(assertions.expectedOutcome).toEqual({
      won: true,
      reason: "bossDefeated",
    });
    expect(assertions.requiredBossPatternIds.length).toBeGreaterThan(0);
    expect(assertions.requiredPickupIds.length).toBeGreaterThan(0);

    const losingEnd = caseAwareEndSnapshotIssues(
      {
        scene: "end",
        won: false,
        outcomeReason: "bossDefeated",
        elapsedMs: 1_000,
        score: 0,
        scoring: { ...spec.scoring },
      },
      assertions,
    );
    expect(losingEnd).toContain("configured evaluation outcome did not win");
  });

  it("does not require Boss or pickup evidence for a non-Boss outcome", () => {
    const spec = survivalSpecWithNoWaveInHorizon();
    // The Spec still carries a Boss and pickups...
    expect(spec.boss.phases.length).toBeGreaterThan(0);
    expect(spec.pickups.length).toBeGreaterThan(0);

    const assertions = deriveCaseAwareBrowserAssertions(spec, true);
    // ...but the verifier does not force Boss phases / pickups on it.
    expect(assertions.requiredBossPatternIds).toEqual([]);
    expect(assertions.requiredPickupIds).toEqual([]);
    expect(assertions.expectedOutcome).toEqual({
      won: true,
      reason: "surviveMs",
      targetMs: 10_000,
    });
  });

  it("accepts a Spec with no required wave without inventing one", () => {
    const spec = survivalSpecWithNoWaveInHorizon();
    const assertions = deriveCaseAwareBrowserAssertions(spec, true);
    // No wave inside the survival horizon -> empty requiredWaves is legal now.
    expect(assertions.requiredWaves).toEqual([]);

    // A play snapshot that spawns no waves is not reported as missing a wave.
    const issues = caseAwarePlaySnapshotIssues(
      {
        scene: "play",
        activeEnemyBullets: 0,
        maxEnemyBullets: spec.viewport.maxEnemyBullets,
        peakActiveEnemyBullets: 0,
        activePlayerBullets: 0,
        maxPlayerBullets: 20,
        activeEnemies: 0,
        activePickups: 0,
        maxPickups: 4,
        scoring: { ...spec.scoring },
        weapons: spec.weapons.map((weapon) => ({
          id: weapon.id,
          fireAttempts: 1,
          successfulProjectiles: 1,
          droppedProjectiles: 0,
          maxProjectilesPerFire: weapon.projectileCount,
          projectileCount: weapon.projectileCount,
          projectileSpeed: weapon.projectileSpeed,
          lastProjectileSpeed: weapon.projectileSpeed,
        })),
        enemyWaves: [],
        bulletPatterns: [],
        pickups: [],
        assets: {
          mode: "legacy-geometric",
          expectedTextureKeys: [],
          loadedTextureKeys: [],
          usedTextureKeys: [],
        },
      },
      assertions,
    );
    expect(issues.some((issue) => issue.includes("did not spawn"))).toBe(false);
  });

  it("still validates any wave the Spec does declare", () => {
    // A Boss-defeat spec declares its wave, so a snapshot missing it fails.
    const spec = bossDefeatSpec();
    const assertions = deriveCaseAwareBrowserAssertions(spec, true);
    expect(assertions.requiredWaves.length).toBeGreaterThan(0);

    const declaredWaveId = assertions.requiredWaves[0]!.id;
    const issues = caseAwarePlaySnapshotIssues(
      {
        scene: "play",
        activeEnemyBullets: 0,
        maxEnemyBullets: spec.viewport.maxEnemyBullets,
        peakActiveEnemyBullets: 0,
        activePlayerBullets: 0,
        maxPlayerBullets: 20,
        activeEnemies: 0,
        activePickups: 0,
        maxPickups: 4,
        scoring: { ...spec.scoring },
        weapons: [],
        enemyWaves: [],
        bulletPatterns: [],
        pickups: [],
        assets: {
          mode: "legacy-geometric",
          expectedTextureKeys: [],
          loadedTextureKeys: [],
          usedTextureKeys: [],
        },
      },
      assertions,
    );
    expect(issues).toContain(`wave ${declaredWaveId} did not spawn`);
  });

  it("gates the win requirement on the declared outcome, not a universal premise", () => {
    // White-box: a non-winning declared outcome must not demand won===true.
    // The public schema currently only derives win-shaped outcomes, so we
    // build the gated shape directly to prove the branch is conditional.
    const notAWinOutcome = {
      assertionVersion: "1.0.0" as const,
      expectedOutcome: {
        won: false as unknown as true,
        reason: "healthDepleted",
      },
      expectedWeaponIds: ["only-weapon"],
      requiredWaves: [],
      requiredBossPatternIds: [],
      requiredPickupIds: [],
      scoring: { comboWindowMs: 0, comboMultiplierCap: 1, grazePoints: 0 },
      assets: {
        expectedMode: "legacy-geometric" as const,
        requireEveryExpectedTextureUsed: false,
        minimumUsedTextureCount: 0,
      },
      playEvidenceTimeoutMs: 20_000,
      outcomeTimeoutMs: 20_000,
    };
    const issues = caseAwareEndSnapshotIssues(
      {
        scene: "end",
        won: false,
        outcomeReason: "healthDepleted",
        elapsedMs: 1_000,
        score: 0,
        scoring: { comboWindowMs: 0, comboMultiplierCap: 1, grazePoints: 0 },
      },
      notAWinOutcome as unknown as Parameters<
        typeof caseAwareEndSnapshotIssues
      >[1],
    );
    expect(issues).not.toContain("configured evaluation outcome did not win");
  });
});
