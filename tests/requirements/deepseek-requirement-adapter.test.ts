import { describe, expect, it, vi } from "vitest";

import { analyzeRequirementWithDeepSeek } from "../../src/requirements/deepseek-requirement-adapter.js";
import { RequirementAnalysisError } from "../../src/requirements/requirement-analyzer.js";
import { createValidSpec } from "../fixtures/create-valid-spec.js";

const representativePrompt =
  "Create an ink-style vertical bullet-hell game with a crane player and a three-phase dragon boss.";

function createFetchResponse(body: unknown, status = 200): typeof fetch {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  ) as unknown as typeof fetch;
}

describe("DeepSeek requirement adapter", () => {
  it("uses provider-native JSON mode and validates the result locally", async () => {
    const fetchImpl = createFetchResponse({
      model: "deepseek-v4-flash",
      choices: [
        {
          finish_reason: "stop",
          message: { content: JSON.stringify(createValidSpec()) },
        },
      ],
      usage: { prompt_tokens: 6000, completion_tokens: 1700 },
    });

    const result = await analyzeRequirementWithDeepSeek({
      apiKey: "fake-test-key",
      prompt: representativePrompt,
      fetchImpl,
    });

    expect(result.spec.title).toBe("Ink Crane");
    expect(result.usage).toEqual({
      inputTokens: 6000,
      outputTokens: 1700,
      providerReportedCost: null,
    });
    expect(fetchImpl).toHaveBeenCalledOnce();

    const [url, request] = vi.mocked(fetchImpl).mock.calls[0]!;
    expect(url).toBe("https://api.deepseek.com/chat/completions");
    const requestBody = JSON.parse(String(request?.body)) as {
      response_format: { type: string };
      messages: Array<{ content: string }>;
      max_tokens: number;
    };
    expect(requestBody.response_format).toEqual({ type: "json_object" });
    expect(requestBody.messages[0]?.content).toContain(
      "<shooter-game-spec-json-schema>",
    );
    expect(requestBody.max_tokens).toBe(8_192);
  });

  it("rejects provider JSON that fails the unchanged local schema", async () => {
    const invalid = createValidSpec();
    invalid.bulletPatterns[0]!.bulletCount = 0;
    const fetchImpl = createFetchResponse({
      choices: [
        {
          finish_reason: "stop",
          message: { content: JSON.stringify(invalid) },
        },
      ],
    });

    await expect(
      analyzeRequirementWithDeepSeek({
        apiKey: "fake-test-key",
        prompt: representativePrompt,
        fetchImpl,
      }),
    ).rejects.toThrow("failed local ShooterGameSpec validation");
  });

  it("fails closed on truncation without retrying", async () => {
    const fetchImpl = createFetchResponse({
      choices: [
        {
          finish_reason: "length",
          message: { content: '{"schemaVersion":"1.0.0"' },
        },
      ],
    });

    await expect(
      analyzeRequirementWithDeepSeek({
        apiKey: "fake-test-key",
        prompt: representativePrompt,
        fetchImpl,
      }),
    ).rejects.toBeInstanceOf(RequirementAnalysisError);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});
