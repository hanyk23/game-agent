import { describe, expect, it } from "vitest";

import {
  createMixedV13BrowserConformanceRuntime,
  EXPECTED_MANIFEST_V12_CONTEXT_KEY_BYTES,
} from "../../game-template/vertical-shooter/src/runtime-kernel/mixed-v13-browser-conformance.js";

describe("ADR 0027 mixed browser conformance fixture", () => {
  it("executes unchanged Manifest 1.2 and granted Manifest 1.3 contexts", () => {
    const runtime = createMixedV13BrowserConformanceRuntime();
    const snapshot = runtime.snapshot();

    expect(snapshot).toEqual({
      phase: "running",
      legacyContextKeyBytes: EXPECTED_MANIFEST_V12_CONTEXT_KEY_BYTES,
      expectedLegacyContextKeyBytes: EXPECTED_MANIFEST_V12_CONTEXT_KEY_BYTES,
      legacyHasV13Grant: false,
      modernHasActorSnapshotGrant: true,
      executedInstanceIds: ["keyboard", "modern-probe"],
    });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.executedInstanceIds)).toBe(true);

    runtime.destroy();
  });
});
