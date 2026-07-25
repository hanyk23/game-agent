import { describe, expect, it } from "vitest";

import {
  isMixedV14ProductionConformanceEvidence,
  MIXED_V14_PRODUCTION_CONFORMANCE_EXPECTATION,
} from "../../src/verification/browser-verification-stage.js";

function validEvidence() {
  return {
    phase: "running",
    ...MIXED_V14_PRODUCTION_CONFORMANCE_EXPECTATION,
    olderContextsHaveV14Authority: false,
    v14HasExactGrantedAuthority: true,
  };
}

describe("mixed V1.4 production browser evidence", () => {
  it("accepts the exact mixed contexts, authority projection, and lifecycle", () => {
    expect(isMixedV14ProductionConformanceEvidence(validEvidence())).toBe(true);
  });

  it.each([
    ["context version drift", { contextVersions: ["1.2.0", "1.4.0"] }],
    ["service projection drift", { serviceKeyBytes: ["[]", "[]", "[]"] }],
    ["legacy authority leak", { olderContextsHaveV14Authority: true }],
    ["missing exact grant", { v14HasExactGrantedAuthority: false }],
    ["factory execution drift", { executedInstanceIds: ["batch3-probe"] }],
    ["lifecycle drift", { lifecycleTrace: ["batch3-probe:start"] }],
  ])("rejects %s", (_label, replacement) => {
    expect(
      isMixedV14ProductionConformanceEvidence({
        ...validEvidence(),
        ...replacement,
      }),
    ).toBe(false);
  });
});
