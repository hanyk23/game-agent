import { describe, expect, it } from "vitest";

import {
  createMixedV14BrowserConformanceRuntime,
  EXPECTED_MANIFEST_V12_SERVICE_KEY_BYTES,
  EXPECTED_MANIFEST_V13_SERVICE_KEY_BYTES,
  EXPECTED_MANIFEST_V14_SERVICE_KEY_BYTES,
} from "../../game-template/vertical-shooter/src/runtime-kernel/mixed-v14-browser-conformance.js";

describe("ADR 0028 mixed browser conformance fixture", () => {
  it("executes exact Manifest 1.2, 1.3, and 1.4 browser contexts", () => {
    const runtime = createMixedV14BrowserConformanceRuntime();
    expect(runtime.snapshot()).toEqual({
      phase: "running",
      contextVersions: ["1.2.0", "1.3.0", "1.4.0"],
      serviceKeyBytes: [
        EXPECTED_MANIFEST_V12_SERVICE_KEY_BYTES,
        EXPECTED_MANIFEST_V13_SERVICE_KEY_BYTES,
        EXPECTED_MANIFEST_V14_SERVICE_KEY_BYTES,
      ],
      olderContextsHaveV14Authority: false,
      v14HasExactGrantedAuthority: true,
      executedInstanceIds: ["keyboard", "modern-probe", "batch3-probe"],
      lifecycleTrace: [
        "keyboard:initialize",
        "modern-probe:initialize",
        "batch3-probe:initialize",
        "keyboard:start",
        "modern-probe:start",
        "batch3-probe:start",
      ],
    });
    runtime.destroy();
    expect(runtime.snapshot().phase).toBe("destroyed");
  });
});
