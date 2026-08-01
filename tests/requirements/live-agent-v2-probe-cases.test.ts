import { describe, expect, it } from "vitest";

import {
  LIVE_AGENT_V2_PROBE_CASES,
  resolveLiveAgentV2ProbeCase,
} from "../../scripts/live-agent-v2-probe-cases.js";

describe("live Agent v2 probe cases", () => {
  it("provides several distinct requests instead of one hard-coded prompt", () => {
    expect(LIVE_AGENT_V2_PROBE_CASES.length).toBeGreaterThanOrEqual(4);
    expect(
      new Set(LIVE_AGENT_V2_PROBE_CASES.map((value) => value.id)).size,
    ).toBe(LIVE_AGENT_V2_PROBE_CASES.length);
    expect(
      new Set(LIVE_AGENT_V2_PROBE_CASES.map((value) => value.prompt)).size,
    ).toBe(LIVE_AGENT_V2_PROBE_CASES.length);
  });

  it("selects a requested case and rejects unknown ids", () => {
    expect(resolveLiveAgentV2ProbeCase("desert-dash-charge").id).toBe(
      "desert-dash-charge",
    );
    expect(() => resolveLiveAgentV2ProbeCase("missing-case")).toThrow(
      "Unknown GAME_AGENT_LIVE_PROBE_CASE_ID",
    );
  });
});
