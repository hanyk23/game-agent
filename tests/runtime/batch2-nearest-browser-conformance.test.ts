import { describe, expect, it } from "vitest";

import { createBatch2NearestBrowserConformanceRuntime } from "../../game-template/vertical-shooter/src/runtime-kernel/batch2-nearest-browser-conformance.js";

describe("Batch 2 nearest-targeting browser-kernel conformance", () => {
  it("advances all frozen snapshot cases through browser lifecycle frames", () => {
    const runtime = createBatch2NearestBrowserConformanceRuntime();
    for (let index = 0; index < 7; index += 1) runtime.frame(16);
    const snapshot = runtime.snapshot();
    expect(snapshot.phase).toBe("complete");
    expect(snapshot.completedCases.map(({ caseId }) => caseId)).toEqual([
      "empty",
      "equal-distance-tie",
      "inactive",
      "out-of-range",
      "stale-old",
      "stale-new",
      "stale-fallback",
    ]);
    expect(
      snapshot.completedCases.every(({ noReresolve }) => noReresolve),
    ).toBe(true);
    expect(
      snapshot.completedCases.every(
        ({ cleanupResidue }) => cleanupResidue === 0,
      ),
    ).toBe(true);
    expect(snapshot.allPassed).toBe(true);
    runtime.destroy();
    expect(runtime.snapshot().phase).toBe("destroyed");
  });
});
