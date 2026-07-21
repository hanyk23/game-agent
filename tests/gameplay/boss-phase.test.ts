import { describe, expect, it } from "vitest";

import { selectBossPhaseIndex } from "../../src/gameplay/boss-phase.js";

const phases = [
  { id: "opening", healthThreshold: 1 },
  { id: "pressure", healthThreshold: 0.65 },
  { id: "finale", healthThreshold: 0.3 },
];

describe("boss phase selection", () => {
  it.each([
    [1, 0],
    [0.66, 0],
    [0.65, 1],
    [0.31, 1],
    [0.3, 2],
    [0, 2],
  ])("maps health ratio %s to phase %s", (healthRatio, expected) => {
    expect(selectBossPhaseIndex(phases, healthRatio)).toBe(expected);
  });

  it("fails closed for invalid phase ordering or health ratios", () => {
    expect(() =>
      selectBossPhaseIndex(
        [
          { id: "one", healthThreshold: 1 },
          { id: "two", healthThreshold: 1 },
        ],
        0.5,
      ),
    ).toThrow("strictly descending");
    expect(() => selectBossPhaseIndex(phases, 1.1)).toThrow("between 0 and 1");
  });
});
