import { describe, expect, it } from "vitest";

import {
  awardDefeatScore,
  awardFlatScore,
  awardGrazeScore,
  createScoringState,
  expireCombo,
  isGrazeContact,
  type ScoringRules,
} from "../../src/gameplay/scoring-state.js";

const rules: ScoringRules = {
  comboWindowMs: 1_000,
  comboMultiplierCap: 2.5,
  grazePoints: 10,
};

describe("scoring state", () => {
  it("chains defeat multipliers deterministically and caps fractional awards", () => {
    const first = awardDefeatScore(rules, createScoringState(), 25, 100);
    const second = awardDefeatScore(rules, first.state, 25, 900);
    const third = awardDefeatScore(rules, second.state, 25, 1_200);

    expect(first.awardedPoints).toBe(25);
    expect(second.awardedPoints).toBe(50);
    expect(third.awardedPoints).toBe(62);
    expect(third.state).toMatchObject({
      score: 137,
      comboCount: 3,
      comboMultiplier: 2.5,
      maxComboMultiplier: 2.5,
      defeatCount: 3,
      defeatScore: 137,
    });
  });

  it("expires the visible combo and treats a zero window as no chaining", () => {
    const first = awardDefeatScore(rules, createScoringState(), 20, 100);
    expect(expireCombo(rules, first.state, 1_100)).toBe(first.state);
    expect(expireCombo(rules, first.state, 1_101)).toMatchObject({
      comboCount: 0,
      comboMultiplier: 1,
      lastDefeatAtMs: null,
      maxComboMultiplier: 1,
    });
    const zeroWindow = { ...rules, comboWindowMs: 0 };
    const second = awardDefeatScore(zeroWindow, first.state, 20, 100);
    expect(second.state.comboCount).toBe(1);
    expect(second.state.comboMultiplier).toBe(1);
  });

  it("adds graze and flat points without extending the combo", () => {
    const first = awardDefeatScore(rules, createScoringState(), 20, 100);
    const grazed = awardGrazeScore(rules, first.state);
    const flat = awardFlatScore(grazed, 7.5);
    expect(flat).toMatchObject({
      score: 37.5,
      comboCount: 1,
      lastDefeatAtMs: 100,
      grazeCount: 1,
      grazeScore: 10,
      defeatScore: 20,
    });
  });

  it("recognizes only the annulus outside the collision radius", () => {
    const base = {
      playerX: 0,
      playerY: 0,
      playerHitboxRadius: 4,
      bulletY: 0,
      bulletRadius: 6,
      grazeMargin: 18,
    };
    expect(isGrazeContact({ ...base, bulletX: 10 })).toBe(false);
    expect(isGrazeContact({ ...base, bulletX: 10.01 })).toBe(true);
    expect(isGrazeContact({ ...base, bulletX: 28 })).toBe(true);
    expect(isGrazeContact({ ...base, bulletX: 28.01 })).toBe(false);
  });

  it("rejects reversed scoring time", () => {
    const first = awardDefeatScore(rules, createScoringState(), 20, 100);
    expect(() => awardDefeatScore(rules, first.state, 20, 99)).toThrow(
      "timestamps must be monotonic",
    );
  });
});
