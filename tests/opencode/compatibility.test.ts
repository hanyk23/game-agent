import { describe, expect, it } from "vitest";

import {
  OpenCodeCompatibilityReportSchema,
  parseModelReference,
} from "../../src/opencode/compatibility.js";

describe("OpenCode compatibility helpers", () => {
  it("parses provider/model references without truncating nested model names", () => {
    expect(parseModelReference("openai/gpt-5/codex")).toEqual({
      providerID: "openai",
      modelID: "gpt-5/codex",
    });
  });

  it("rejects ambiguous model references", () => {
    expect(() => parseModelReference("gpt-5")).toThrow("provider/model");
  });

  it("validates a skipped live-model probe explicitly", () => {
    expect(
      OpenCodeCompatibilityReportSchema.safeParse({
        checkedAt: "2026-07-15T00:00:00.000Z",
        sdkVersion: "1.18.1",
        server: {
          started: true,
          healthy: true,
          version: "1.18.1",
          url: "http://127.0.0.1:4096",
        },
        session: {
          created: true,
          sessionId: "session-id",
          aborted: true,
        },
        events: {
          subscribed: true,
          capturedTypes: ["session.created"],
        },
        structuredOutput: {
          status: "skipped",
          model: null,
          reason: "No paid model call was authorized.",
        },
        errors: [],
      }).success,
    ).toBe(true);
  });
});
