import { describe, expect, it } from "vitest";

import { evaluateGameOutcome } from "../../src/gameplay/game-outcome.js";

const pending = {
  elapsedMs: 9_999,
  score: 99,
  playerHealth: 1,
  bossDefeated: false,
} as const;

describe("game outcome evaluator", () => {
  it.each([
    [
      { type: "bossDefeated" } as const,
      { ...pending, bossDefeated: true },
      "bossDefeated",
    ],
    [
      { type: "surviveMs", targetMs: 10_000 } as const,
      { ...pending, elapsedMs: 10_000 },
      "surviveMs",
    ],
    [
      { type: "scoreReached", targetScore: 100 } as const,
      { ...pending, score: 100 },
      "scoreReached",
    ],
  ])("recognizes the %s win variant", (condition, state, reason) => {
    expect(
      evaluateGameOutcome(condition, { type: "healthDepleted" }, state),
    ).toEqual({ won: true, reason, elapsedMs: state.elapsedMs });
  });

  it.each([
    [
      { type: "healthDepleted" } as const,
      { ...pending, playerHealth: 0 },
      "healthDepleted",
    ],
    [
      { type: "timeExpired", limitMs: 10_000 } as const,
      { ...pending, elapsedMs: 10_000 },
      "timeExpired",
    ],
  ])("recognizes the %s loss variant", (condition, state, reason) => {
    expect(
      evaluateGameOutcome({ type: "bossDefeated" }, condition, state),
    ).toEqual({ won: false, reason, elapsedMs: state.elapsedMs });
  });

  it("returns null before either condition is met", () => {
    expect(
      evaluateGameOutcome(
        { type: "scoreReached", targetScore: 100 },
        { type: "timeExpired", limitMs: 10_000 },
        pending,
      ),
    ).toBeNull();
  });

  it("gives an inclusive win precedence when both conditions mature together", () => {
    expect(
      evaluateGameOutcome(
        { type: "surviveMs", targetMs: 10_000 },
        { type: "timeExpired", limitMs: 10_000 },
        { ...pending, elapsedMs: 10_000 },
      ),
    ).toEqual({ won: true, reason: "surviveMs", elapsedMs: 10_000 });
  });

  it("fails closed for invalid standalone state", () => {
    expect(() =>
      evaluateGameOutcome(
        { type: "bossDefeated" },
        { type: "healthDepleted" },
        { ...pending, elapsedMs: Number.NaN },
      ),
    ).toThrow("elapsedMs must be a finite non-negative number");
  });
});
