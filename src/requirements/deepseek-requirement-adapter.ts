import {
  buildRequirementAnalyzerSystemPrompt,
  RequirementAnalysisError,
} from "./requirement-analyzer.js";
import {
  parseShooterGameSpec,
  type ShooterGameSpec,
} from "./shooter-game-spec.js";

const DEEPSEEK_CHAT_COMPLETIONS_URL =
  "https://api.deepseek.com/chat/completions";

export type DeepSeekRequirementAdapterOptions = {
  apiKey: string;
  prompt: string;
  model?: "deepseek-v4-flash";
  maxOutputTokens?: number;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

export type DeepSeekRequirementAnalysisResult = {
  spec: ShooterGameSpec;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    providerReportedCost: null;
  };
};

type DeepSeekChatCompletion = {
  model?: unknown;
  choices?: Array<{
    finish_reason?: unknown;
    message?: { content?: unknown };
  }>;
  usage?: {
    prompt_tokens?: unknown;
    completion_tokens?: unknown;
  };
};

function readTokenCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export async function analyzeRequirementWithDeepSeek(
  options: DeepSeekRequirementAdapterOptions,
): Promise<DeepSeekRequirementAnalysisResult> {
  if (options.prompt.trim().length < 12) {
    throw new RequirementAnalysisError(
      "The game request is too short to produce a complete ShooterGameSpec.",
    );
  }
  if (!options.apiKey.trim()) {
    throw new RequirementAnalysisError("A DeepSeek API key is required.");
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(DEEPSEEK_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options.model ?? "deepseek-v4-flash",
      messages: [
        { role: "system", content: buildRequirementAnalyzerSystemPrompt() },
        { role: "user", content: options.prompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: options.maxOutputTokens ?? 8_192,
      temperature: 0,
      stream: false,
    }),
    signal: AbortSignal.timeout(options.timeoutMs ?? 60_000),
  });

  if (!response.ok) {
    throw new RequirementAnalysisError(
      `DeepSeek requirement request failed with HTTP ${response.status}.`,
    );
  }

  const completion = (await response.json()) as DeepSeekChatCompletion;
  const choice = completion.choices?.[0];
  const content = choice?.message?.content;
  if (choice?.finish_reason === "length") {
    throw new RequirementAnalysisError(
      "DeepSeek truncated the JSON requirement response at the output-token limit.",
    );
  }
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new RequirementAnalysisError(
      "DeepSeek returned an empty JSON requirement response.",
    );
  }

  let value: unknown;
  try {
    value = JSON.parse(content);
  } catch (error) {
    throw new RequirementAnalysisError(
      "DeepSeek JSON mode returned content that was not valid JSON.",
      { cause: error },
    );
  }

  try {
    return {
      spec: parseShooterGameSpec(value),
      model:
        typeof completion.model === "string"
          ? completion.model
          : (options.model ?? "deepseek-v4-flash"),
      usage: {
        inputTokens: readTokenCount(completion.usage?.prompt_tokens),
        outputTokens: readTokenCount(completion.usage?.completion_tokens),
        providerReportedCost: null,
      },
    };
  } catch (error) {
    throw new RequirementAnalysisError(
      "DeepSeek returned JSON that failed local ShooterGameSpec validation.",
      { cause: error },
    );
  }
}
