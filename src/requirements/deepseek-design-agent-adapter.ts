import { z } from "zod";

import {
  DESIGN_MODEL_EMITTABLE_FAILURE_CODES,
  parseDesignAgentModelOutput,
  toDesignAgentModelOutputJsonSchema,
  type DesignAgentFailureEvidence,
  type DesignAgentModelOutput,
  type DesignStageProvenance,
} from "./design-agent-result.js";
import {
  buildDesignAgentSystemPrompt,
  buildDesignAgentUserPrompt,
  DESIGN_AGENT_SUBMIT_TOOL_NAME,
} from "./design-agent-prompt.js";
import {
  buildEstimatedCostEvidence,
  buildUnknownCostEvidence,
} from "./deepseek-cost-policy.js";

const DEEPSEEK_CHAT_COMPLETIONS_URL =
  "https://api.deepseek.com/chat/completions";
const DEFAULT_TIMEOUT_MS = 300_000;
const DEFAULT_MAX_OUTPUT_TOKENS = 32_768;

export type DeepSeekDesignAgentModel = "deepseek-v4-flash" | "deepseek-v4-pro";

export type DeepSeekDesignAgentOptions = Readonly<{
  apiKey: string;
  request: string;
  gameSpec: unknown;
  intentLedger: unknown;
  model?: DeepSeekDesignAgentModel;
  maxOutputTokens?: number;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  nowMs?: () => number;
}>;

export type DeepSeekDesignAgentResult = Readonly<{
  output: DesignAgentModelOutput;
  provenance: DesignStageProvenance;
}>;

export class DesignAgentModelError extends Error {
  constructor(
    readonly code: "model-failure" | "invalid-agent-output",
    message: string,
    readonly retryable: boolean,
    readonly evidence: DesignAgentFailureEvidence,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "DesignAgentModelError";
  }
}

type DeepSeekChatCompletion = {
  model?: unknown;
  choices?: Array<{
    finish_reason?: unknown;
    message?: {
      content?: unknown;
      reasoning_content?: unknown;
      tool_calls?: Array<{
        type?: unknown;
        function?: { name?: unknown; arguments?: unknown };
      }>;
    };
  }>;
  usage?: {
    prompt_tokens?: unknown;
    completion_tokens?: unknown;
    completion_tokens_details?: { reasoning_tokens?: unknown };
  };
};

type JsonSchemaRecord = Record<string, unknown>;

export function toDesignAgentSubmitToolParameters(): JsonSchemaRecord {
  const canonical = toDesignAgentModelOutputJsonSchema();
  const alternatives = canonical.oneOf;
  if (!Array.isArray(alternatives)) {
    throw new Error(
      "Design Agent output schema must export a root oneOf union.",
    );
  }
  return {
    type: "object",
    properties: { result: { anyOf: alternatives } },
    required: ["result"],
    additionalProperties: false,
    ...(canonical.$defs !== undefined ? { $defs: canonical.$defs } : {}),
  };
}

function readTokenCount(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0
    ? value
    : null;
}

function elapsed(nowMs: () => number, startedAt: number): number {
  return Math.max(0, Math.round(nowMs() - startedAt));
}

type EvidenceContext = {
  model: string;
  thinkingMode: "enabled" | "disabled";
  timeoutMs: number;
  startedAt: number;
  nowMs: () => number;
  finishReason: string | null;
  toolCallCount: number;
  argumentsLength: number;
  inputTokens: number | null;
  outputTokens: number | null;
  reasoningTokens: number | null;
};

function evidence(
  context: EvidenceContext,
  stage: DesignAgentFailureEvidence["stage"],
  issueCode: string,
  issues: DesignAgentFailureEvidence["issues"] = [],
): DesignAgentFailureEvidence {
  return {
    stage,
    issueCode,
    issues,
    issueCount: issues.length,
    model: context.model,
    thinkingMode: context.thinkingMode,
    finishReason: context.finishReason,
    toolCallCount: context.toolCallCount,
    argumentsLength: context.argumentsLength,
    inputTokens: context.inputTokens,
    outputTokens: context.outputTokens,
    reasoningTokens: context.reasoningTokens,
    elapsedMs: elapsed(context.nowMs, context.startedAt),
    timeoutMs: context.timeoutMs,
  };
}

function fail(
  context: EvidenceContext,
  options: {
    code: "model-failure" | "invalid-agent-output";
    message: string;
    retryable: boolean;
    stage: DesignAgentFailureEvidence["stage"];
    issueCode: string;
    issues?: DesignAgentFailureEvidence["issues"];
    cause?: unknown;
  },
): DesignAgentModelError {
  return new DesignAgentModelError(
    options.code,
    options.message,
    options.retryable,
    evidence(context, options.stage, options.issueCode, options.issues),
    options.cause === undefined ? undefined : { cause: options.cause },
  );
}

export async function analyzeDesignWithDeepSeek(
  options: DeepSeekDesignAgentOptions,
): Promise<DeepSeekDesignAgentResult> {
  const model = options.model ?? "deepseek-v4-flash";
  const thinkingMode = "enabled" as const;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const nowMs = options.nowMs ?? (() => performance.now());
  const context: EvidenceContext = {
    model,
    thinkingMode,
    timeoutMs,
    startedAt: nowMs(),
    nowMs,
    finishReason: null,
    toolCallCount: 0,
    argumentsLength: 0,
    inputTokens: null,
    outputTokens: null,
    reasoningTokens: null,
  };

  if (options.request.trim().length < 4) {
    throw fail(context, {
      code: "invalid-agent-output",
      message: "The game request is too short to design.",
      retryable: false,
      stage: "request-validation",
      issueCode: "request-too-short",
    });
  }
  if (!options.apiKey.trim()) {
    throw fail(context, {
      code: "model-failure",
      message: "A DeepSeek API key is required.",
      retryable: false,
      stage: "request-validation",
      issueCode: "missing-credential",
    });
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
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
          { role: "system", content: buildDesignAgentSystemPrompt() },
          {
            role: "user",
            content: buildDesignAgentUserPrompt({
              request: options.request,
              gameSpec: options.gameSpec,
              intentLedger: options.intentLedger,
            }),
          },
        ],
        thinking: { type: thinkingMode },
        max_tokens: options.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
        tools: [
          {
            type: "function",
            function: {
              name: DESIGN_AGENT_SUBMIT_TOOL_NAME,
              description:
                "Submit exactly one final Design Agent three-state result.",
              parameters: toDesignAgentSubmitToolParameters(),
            },
          },
        ],
        stream: false,
      }),
      signal: timeoutSignal,
    });
  } catch (error) {
    throw fail(context, {
      code: "model-failure",
      message: timeoutSignal.aborted
        ? "DeepSeek Design Agent request timed out."
        : "DeepSeek Design Agent network request failed.",
      retryable: true,
      stage: "network",
      issueCode: timeoutSignal.aborted ? "request-timeout" : "network-failure",
      cause: error,
    });
  }

  if (!response.ok) {
    throw fail(context, {
      code: "model-failure",
      message: `DeepSeek Design Agent request failed with HTTP ${response.status}.`,
      retryable: response.status >= 500,
      stage: "http",
      issueCode: `http-${response.status}`,
    });
  }

  let responseBody: string;
  try {
    responseBody = await response.text();
  } catch (error) {
    const timedOut = timeoutSignal.aborted;
    throw fail(context, {
      code: "model-failure",
      message: timedOut
        ? "DeepSeek response body read timed out."
        : "DeepSeek response body could not be read.",
      retryable: true,
      stage: timedOut ? "response-body-read-timeout" : "response-body-read",
      issueCode: timedOut ? "response-body-read-timeout" : "body-read-failure",
      cause: error,
    });
  }

  if (responseBody.trim().length === 0) {
    throw fail(context, {
      code: "model-failure",
      message: "DeepSeek returned an empty HTTP response body.",
      retryable: true,
      stage: "empty-response-body",
      issueCode: "empty-response-body",
    });
  }

  let completion: DeepSeekChatCompletion;
  try {
    completion = JSON.parse(responseBody) as DeepSeekChatCompletion;
  } catch (error) {
    throw fail(context, {
      code: "model-failure",
      message: `DeepSeek returned invalid provider JSON (bodyLength=${responseBody.length}, contentType=${response.headers.get("content-type") ?? "unknown"}).`,
      retryable: true,
      stage: "provider-json",
      issueCode: "invalid-provider-json",
      cause: error,
    });
  }

  context.inputTokens = readTokenCount(completion.usage?.prompt_tokens);
  context.outputTokens = readTokenCount(completion.usage?.completion_tokens);
  context.reasoningTokens = readTokenCount(
    completion.usage?.completion_tokens_details?.reasoning_tokens,
  );
  const choice = completion.choices?.[0];
  context.finishReason =
    typeof choice?.finish_reason === "string" ? choice.finish_reason : null;
  if (context.finishReason === "length") {
    throw fail(context, {
      code: "model-failure",
      message:
        "DeepSeek truncated the Design Agent function call at the output-token limit.",
      retryable: false,
      stage: "tool-call",
      issueCode: "output-truncated",
    });
  }

  const toolCalls = choice?.message?.tool_calls;
  context.toolCallCount = Array.isArray(toolCalls) ? toolCalls.length : 0;
  if (!Array.isArray(toolCalls) || toolCalls.length !== 1) {
    throw fail(context, {
      code: "invalid-agent-output",
      message: "DeepSeek must return exactly one Design Agent function call.",
      retryable: false,
      stage: "tool-call",
      issueCode: "tool-call-count",
    });
  }

  const toolCall = toolCalls[0];
  if (
    toolCall?.type !== "function" ||
    toolCall.function?.name !== DESIGN_AGENT_SUBMIT_TOOL_NAME
  ) {
    throw fail(context, {
      code: "invalid-agent-output",
      message: "DeepSeek called an unexpected Design Agent function.",
      retryable: false,
      stage: "tool-call",
      issueCode: "wrong-function-name",
    });
  }

  const argumentsJson = toolCall.function.arguments;
  context.argumentsLength =
    typeof argumentsJson === "string" ? argumentsJson.length : 0;
  if (typeof argumentsJson !== "string" || argumentsJson.trim().length === 0) {
    throw fail(context, {
      code: "invalid-agent-output",
      message: "DeepSeek returned empty Design Agent function arguments.",
      retryable: false,
      stage: "function-arguments-json",
      issueCode: "empty-function-arguments",
    });
  }

  let envelope: unknown;
  try {
    envelope = JSON.parse(argumentsJson);
  } catch (error) {
    throw fail(context, {
      code: "invalid-agent-output",
      message: "DeepSeek returned function arguments that were not valid JSON.",
      retryable: false,
      stage: "function-arguments-json",
      issueCode: "invalid-function-arguments-json",
      cause: error,
    });
  }
  if (
    typeof envelope !== "object" ||
    envelope === null ||
    Array.isArray(envelope) ||
    Object.keys(envelope).length !== 1 ||
    !("result" in envelope)
  ) {
    throw fail(context, {
      code: "invalid-agent-output",
      message:
        "Design Agent function arguments must contain only the required result property.",
      retryable: false,
      stage: "design-schema",
      issueCode: "invalid-function-envelope",
    });
  }

  let output: DesignAgentModelOutput;
  try {
    output = parseDesignAgentModelOutput(
      (envelope as { result: unknown }).result,
    );
  } catch (error) {
    const issues =
      error instanceof z.ZodError
        ? error.issues.slice(0, 20).map((value) => ({
            code: value.code,
            path: value.path.map((part) =>
              typeof part === "symbol" ? String(part) : part,
            ),
            message: value.message,
          }))
        : [];
    throw fail(context, {
      code: "invalid-agent-output",
      message:
        "DeepSeek function arguments failed local Design Agent output validation.",
      retryable: false,
      stage: "design-schema",
      issueCode: "design-schema-invalid",
      issues,
      cause: error,
    });
  }

  if (
    output.outcome === "bounded-failure" &&
    !DESIGN_MODEL_EMITTABLE_FAILURE_CODES.includes(output.failure.code)
  ) {
    throw fail(context, {
      code: "invalid-agent-output",
      message: "DeepSeek reported a reserved bounded-failure code.",
      retryable: false,
      stage: "design-schema",
      issueCode: "reserved-failure-code",
    });
  }

  const costEvidence =
    context.inputTokens !== null && context.outputTokens !== null
      ? buildEstimatedCostEvidence(context.inputTokens, context.outputTokens)
      : buildUnknownCostEvidence(
          "DeepSeek response did not report complete prompt_tokens and completion_tokens; cost is unknown.",
        );
  const provenance: DesignStageProvenance = {
    provider: "deepseek",
    model: typeof completion.model === "string" ? completion.model : model,
    outputMode: "deepseek_function_call",
    thinkingMode,
    finishReason: context.finishReason,
    toolCallCount: context.toolCallCount,
    argumentsLength: context.argumentsLength,
    elapsedMs: elapsed(nowMs, context.startedAt),
    timeoutMs,
    usage: {
      cost:
        costEvidence.kind === "estimated" ? costEvidence.estimatedCostUsd : 0,
      costKnown: costEvidence.kind === "estimated",
      costEvidence,
      inputTokens: context.inputTokens,
      outputTokens: context.outputTokens,
      reasoningTokens: context.reasoningTokens,
    },
  };
  return { output, provenance };
}
