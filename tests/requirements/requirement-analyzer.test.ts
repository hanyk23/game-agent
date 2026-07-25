import type { OpencodeClient } from "@opencode-ai/sdk/v2/client";
import { describe, expect, it, vi } from "vitest";

import {
  analyzeRequirement,
  buildRequirementAnalyzerSystemPrompt,
  readOpenCodeJsonResult,
  RequirementAnalysisError,
} from "../../src/requirements/requirement-analyzer.js";
import { createValidSpec } from "../fixtures/create-valid-spec.js";

function createMockClient(structured: unknown): {
  client: OpencodeClient;
  prompt: ReturnType<typeof vi.fn>;
} {
  const prompt = vi.fn().mockResolvedValue({
    data: {
      info: {
        structured,
        cost: 0,
        tokens: { input: 0, output: 0, reasoning: 0 },
      },
      parts: [],
    },
  });
  return {
    client: { session: { prompt } } as unknown as OpencodeClient,
    prompt,
  };
}

describe("requirement analyzer", () => {
  it("places the exact ShooterGameSpec contract in model-visible instructions", () => {
    const system = buildRequirementAnalyzerSystemPrompt();

    expect(system).toContain(
      "schemaVersion, title, theme, story, visualStyle, difficulty, viewport",
    );
    expect(system).toContain('Set schemaVersion to "1.0.0"');
    expect(system).toContain('"additionalProperties":false');
    expect(system).toContain('"bulletPatterns"');
    expect(system).toContain(
      "Every asset reference must match an assetQueries id",
    );
    expect(system).toContain(
      "If the user does not request a deadline, do not invent a timeExpired loss",
    );
    expect(system).toContain(
      "For assetQueries only, use finite English catalog vocabulary",
    );
    expect(system).toContain(
      "Always include at least one assetQueries entry with category background",
    );
  });

  it("accepts strict JSON text when a provider cannot use OpenCode structured output", () => {
    const result = readOpenCodeJsonResult({
      info: { error: { name: "StructuredOutputError" } },
      parts: [{ type: "text", text: '{"probe":"ok"}' }],
    });

    expect(result).toEqual({
      value: { probe: "ok" },
      outputMode: "json_text_fallback",
    });
  });

  it("accepts a single JSON code fence without accepting surrounding prose", () => {
    const result = readOpenCodeJsonResult({
      info: { error: { name: "StructuredOutputError" } },
      parts: [{ type: "text", text: '```json\n{"probe":"ok"}\n```' }],
    });
    expect(result.outputMode).toBe("json_fence_fallback");
    expect(result.value).toEqual({ probe: "ok" });

    expect(() =>
      readOpenCodeJsonResult({
        info: { error: { name: "StructuredOutputError" } },
        parts: [{ type: "text", text: 'Result: {"probe":"ok"}' }],
      }),
    ).toThrow("neither strict JSON nor a single JSON code fence");
  });

  it("requests tool-free JSON Schema output and validates it locally", async () => {
    const { client, prompt } = createMockClient(createValidSpec());
    const result = await analyzeRequirement(client, {
      sessionId: "session-id",
      directory: "D:/project",
      model: { providerID: "openai", modelID: "example-model" },
      prompt:
        "生成一个水墨风纵版弹幕射击游戏，玩家控制白鹤，Boss 是三阶段黑龙。",
    });

    expect(result.title).toBe("Ink Crane");
    expect(prompt).toHaveBeenCalledOnce();
    const request = prompt.mock.calls[0]![0] as {
      tools: Record<string, boolean>;
      system: string;
      format: {
        type: string;
        retryCount: number;
        schema: Record<string, unknown>;
      };
    };
    expect(request.tools).toEqual({ "*": false });
    expect(request.system).toBe(buildRequirementAnalyzerSystemPrompt());
    expect(request.format.type).toBe("json_schema");
    expect(request.format.retryCount).toBe(2);
    expect(request.format.schema.additionalProperties).toBe(false);
  });

  it("fails before model invocation for an insufficient request", async () => {
    const { client, prompt } = createMockClient(createValidSpec());

    await expect(
      analyzeRequirement(client, {
        sessionId: "session-id",
        directory: "D:/project",
        model: { providerID: "openai", modelID: "example-model" },
        prompt: "做个游戏。",
      }),
    ).rejects.toBeInstanceOf(RequirementAnalysisError);
    expect(prompt).not.toHaveBeenCalled();
  });

  it("rejects structured output that fails local semantic validation", async () => {
    const invalid = createValidSpec();
    invalid.player.assetQueryId = "missing-player";
    const { client } = createMockClient(invalid);

    await expect(
      analyzeRequirement(client, {
        sessionId: "session-id",
        directory: "D:/project",
        model: { providerID: "openai", modelID: "example-model" },
        prompt:
          "生成一个水墨风纵版弹幕射击游戏，玩家控制白鹤，Boss 是三阶段黑龙。",
      }),
    ).rejects.toThrow("failed local ShooterGameSpec validation");
  });
});
