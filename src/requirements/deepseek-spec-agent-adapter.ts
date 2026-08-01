import {
  parseSpecAgentModelOutput,
  MODEL_EMITTABLE_FAILURE_CODES,
  type SpecAgentModelOutput,
  type SpecStageProvenance,
} from "./spec-agent-result.js";
import { buildSpecAgentSystemPrompt } from "./spec-agent-prompt.js";
import {
  buildEstimatedCostEvidence,
  buildUnknownCostEvidence,
} from "./deepseek-cost-policy.js";

/**
 * deepseek-spec-agent-adapter — the model-backed executor for GameSpec v2.
 *
 * This is a NEW adapter dedicated to GameSpec v2; it does not reuse the old
 * ShooterGameSpec prompt/parser. It reuses the existing DeepSeek call shape and
 * fail-closed error handling ideas from deepseek-requirement-adapter, but drives
 * the open-ended Spec Agent prompt and validates against the three-state model
 * output schema (batch prompt §六).
 *
 * Safety/robustness contract:
 *  - The API key is read only from the caller (the Orchestrator reads it from
 *    the DEEPSEEK_API_KEY env var); this module never touches process.env, and
 *    never logs, prints, writes or returns the key.
 *  - Thinking enabled, temperature = 0, provider-native JSON object mode, all
 *    tools disabled.
 *  - Explicit timeout and max output tokens.
 *  - The provider's JSON is NEVER treated as a trusted artifact: it is parsed
 *    and validated locally, and any illegal/empty/truncated/non-JSON response
 *    fails closed as a structured error.
 */

const DEEPSEEK_CHAT_COMPLETIONS_URL =
  "https://api.deepseek.com/chat/completions";
const DEFAULT_MAX_OUTPUT_TOKENS = 16_384;
const DEFAULT_TIMEOUT_MS = 180_000;

export type DeepSeekSpecAgentModel = "deepseek-v4-flash" | "deepseek-v4-pro";

export type DeepSeekSpecAgentOptions = Readonly<{
  apiKey: string;
  prompt: string;
  model?: DeepSeekSpecAgentModel;
  maxOutputTokens?: number;
  timeoutMs?: number;
  /** Injected for tests; production uses the global fetch. */
  fetchImpl?: typeof fetch;
}>;

export type DeepSeekSpecAgentResult = Readonly<{
  output: SpecAgentModelOutput;
  provenance: SpecStageProvenance;
}>;

/**
 * Structured, fail-closed error. `code` distinguishes a call-level failure
 * ("model-failure": network/timeout/truncation/http) from a contract-level
 * failure ("invalid-agent-output": non-JSON, empty, or schema-invalid). The
 * Orchestrator maps these onto the bounded-failure taxonomy.
 */
export class SpecAgentModelError extends Error {
  constructor(
    readonly code: "model-failure" | "invalid-agent-output",
    message: string,
    readonly retryable: boolean,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "SpecAgentModelError";
  }
}

type DeepSeekChatCompletion = {
  model?: unknown;
  choices?: Array<{
    finish_reason?: unknown;
    message?: { content?: unknown };
  }>;
  usage?: {
    prompt_tokens?: unknown;
    completion_tokens?: unknown;
    completion_tokens_details?: { reasoning_tokens?: unknown };
  };
};

/**
 * §三: a token count is only usable as a cost basis when it is a finite,
 * non-negative integer. A missing field, NaN, a negative number, a float, or a
 * non-number (e.g. a string "900") is NOT silently coerced to zero — it returns
 * undefined so the caller records the cost as explicitly UNKNOWN rather than
 * under-reporting the charge by treating the missing side as free.
 */
function readValidTokenCount(value: unknown): number | undefined {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0
    ? value
    : undefined;
}

export async function analyzeSpecWithDeepSeek(
  options: DeepSeekSpecAgentOptions,
): Promise<DeepSeekSpecAgentResult> {
  if (options.prompt.trim().length < 4) {
    throw new SpecAgentModelError(
      "invalid-agent-output",
      "The game request is too short to analyze.",
      false,
    );
  }
  if (!options.apiKey.trim()) {
    // Never echo the key or its absence beyond this generic message.
    throw new SpecAgentModelError(
      "model-failure",
      "A DeepSeek API key is required.",
      false,
    );
  }

  const model = options.model ?? "deepseek-v4-flash";
  const fetchImpl = options.fetchImpl ?? fetch;

  let response: Response;
  try {
    response = await fetchImpl(DEEPSEEK_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: buildSpecAgentSystemPrompt() },
          { role: "user", content: options.prompt },
        ],
        response_format: { type: "json_object" },
        thinking: { type: "enabled" },
        max_tokens: options.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
        temperature: 0,
        // Tools are disabled: the Spec Agent only reasons over text.
        tools: [],
        stream: false,
      }),
      signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });
  } catch (error) {
    // Network failure, timeout/abort, DNS, etc.
    throw new SpecAgentModelError(
      "model-failure",
      error instanceof Error
        ? `DeepSeek Spec Agent request failed: ${error.message}`
        : "DeepSeek Spec Agent request failed.",
      true,
      { cause: error },
    );
  }

  if (!response.ok) {
    throw new SpecAgentModelError(
      "model-failure",
      `DeepSeek Spec Agent request failed with HTTP ${response.status}.`,
      response.status >= 500,
    );
  }

  let completion: DeepSeekChatCompletion;
  try {
    completion = (await response.json()) as DeepSeekChatCompletion;
  } catch (error) {
    throw new SpecAgentModelError(
      "model-failure",
      "DeepSeek returned a response body that was not valid JSON.",
      true,
      { cause: error },
    );
  }

  const choice = completion.choices?.[0];
  if (choice?.finish_reason === "length") {
    throw new SpecAgentModelError(
      "model-failure",
      "DeepSeek truncated the Spec Agent JSON at the output-token limit.",
      false,
    );
  }

  const content = choice?.message?.content;
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new SpecAgentModelError(
      "invalid-agent-output",
      "DeepSeek returned an empty Spec Agent response.",
      false,
    );
  }

  let value: unknown;
  try {
    value = JSON.parse(content);
  } catch (error) {
    throw new SpecAgentModelError(
      "invalid-agent-output",
      "DeepSeek JSON mode returned content that was not valid JSON.",
      false,
      { cause: error },
    );
  }

  let output: SpecAgentModelOutput;
  try {
    output = parseSpecAgentModelOutput(value);
  } catch (error) {
    throw new SpecAgentModelError(
      "invalid-agent-output",
      "DeepSeek returned JSON that failed local Spec Agent output validation.",
      false,
      { cause: error },
    );
  }

  // A model must not self-report reserved codes: those are the adapter's /
  // Orchestrator's to raise, so a model claiming them is itself invalid output.
  if (
    output.outcome === "bounded-failure" &&
    !MODEL_EMITTABLE_FAILURE_CODES.includes(output.failure.code)
  ) {
    throw new SpecAgentModelError(
      "invalid-agent-output",
      `DeepSeek reported a reserved bounded-failure code it may not emit: ${output.failure.code}.`,
      false,
    );
  }

  const inputTokens = readValidTokenCount(completion.usage?.prompt_tokens);
  const outputTokens = readValidTokenCount(completion.usage?.completion_tokens);
  const reasoningTokens = readValidTokenCount(
    completion.usage?.completion_tokens_details?.reasoning_tokens,
  );
  // §三: cost is KNOWN only when BOTH prompt_tokens AND completion_tokens are
  // present as finite, non-negative integers. If either side is missing, NaN,
  // negative, or a non-integer/non-number, we have no honest basis and the
  // missing side must NOT be treated as a real zero (that would under-report the
  // charge and silently defeat a maxCost gate). When both are valid — including
  // a genuine 0/0 the provider actually reported — we derive a reproducible
  // conservative UPPER BOUND (cache-miss input + output tiers) from the
  // checked-in DeepSeek pricing snapshot; that number is what a maxCost gate
  // compares against.
  const costEvidence =
    inputTokens !== undefined && outputTokens !== undefined
      ? buildEstimatedCostEvidence(inputTokens, outputTokens)
      : buildUnknownCostEvidence(
          "DeepSeek response reported incomplete token usage (prompt_tokens and completion_tokens must both be finite non-negative integers); no cost basis available.",
        );

  const provenance: SpecStageProvenance = {
    provider: "deepseek",
    model: typeof completion.model === "string" ? completion.model : model,
    outputMode: "deepseek_json_object",
    usage: {
      cost:
        costEvidence.kind === "estimated" ? costEvidence.estimatedCostUsd : 0,
      costKnown: costEvidence.kind === "estimated",
      costEvidence,
      // §三: the numeric usage fields keep a schema-legal, backward-compatible
      // zero when a side is unusable, but costKnown:false + unknown evidence
      // above make it explicit that this zero is NOT a verified charge.
      inputTokens: inputTokens ?? 0,
      outputTokens: outputTokens ?? 0,
      reasoningTokens: reasoningTokens ?? 0,
    },
  };

  return { output, provenance };
}
