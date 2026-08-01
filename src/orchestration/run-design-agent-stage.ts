import { createHash, randomUUID } from "node:crypto";
import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  runAgentInvocation,
  type AgentArtifactRef,
  type AgentBudget,
  type AgentExecutor,
  type AgentInvocation,
} from "../agents/index.js";
import { sha256GameDesignV2 } from "../gameplay/game-design-v2.js";
import {
  GameDesignV2ConsistencyError,
  verifyGameDesignV2Consistency,
} from "../gameplay/game-design-v2-consistency.js";
import {
  sha256GameSpecV2,
  type GameSpecV2,
} from "../requirements/game-spec-v2.js";
import {
  sha256IntentLedgerV2,
  verifyIntentLedgerV2,
  type IntentLedgerV2,
} from "../requirements/intent-ledger-v2.js";
import type { DeepSeekDesignAgentResult } from "../requirements/deepseek-design-agent-adapter.js";
import {
  parseDesignAgentModelOutput,
  type DesignAgentFailureEvidence,
  type DesignAgentModelOutput,
  type DesignBoundedFailureCode,
  type DesignStageProvenance,
  type DesignStageV2Clarification,
  type DesignStageV2Result,
} from "../requirements/design-agent-result.js";

export type RunDesignAgentStageRequest = Readonly<{
  language: "zh-CN";
  prompt: string;
}>;

export type RunDesignAgentStageInput = Readonly<{
  request: RunDesignAgentStageRequest;
  gameSpec: GameSpecV2;
  intentLedger: IntentLedgerV2;
}>;

export type DesignAgentV2Analysis = (
  input: RunDesignAgentStageInput,
) => Promise<DeepSeekDesignAgentResult>;

export type RunDesignAgentStageDeps = Readonly<{
  analyze: DesignAgentV2Analysis;
  budget?: AgentBudget;
  outputPath?: string;
  now?: () => Date;
  invocationId?: string;
}>;

export type RunDesignAgentStageOutcome = Readonly<{
  result: DesignStageV2Result;
  invocation?: AgentInvocation;
}>;

const SCHEMA_VERSION = "2.0.0" as const;
const DEFAULT_BUDGET: AgentBudget = { maxAttempts: 1 };

function sha256Utf8(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

async function writeJsonAtomic(
  filePath: string,
  value: unknown,
): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryPath, filePath);
}

async function persist(
  outputPath: string | undefined,
  result: DesignStageV2Result,
): Promise<void> {
  if (outputPath !== undefined) await writeJsonAtomic(outputPath, result);
}

function mapFailureCode(code: string | undefined): DesignBoundedFailureCode {
  return code === "invalid_agent_artifact" || code === "invalid-agent-output"
    ? "invalid-agent-output"
    : "model-failure";
}

function boundedFailure(
  request: DesignStageV2Result["request"],
  failure: {
    code: DesignBoundedFailureCode;
    message: string;
    retryable: boolean;
  },
  provenance?: DesignStageProvenance,
  failureEvidence?: DesignAgentFailureEvidence,
): DesignStageV2Result {
  return {
    schemaVersion: SCHEMA_VERSION,
    kind: "design-stage-v2-result",
    status: "bounded-failure",
    request,
    failure,
    ...(provenance !== undefined ? { provenance } : {}),
    ...(failureEvidence !== undefined ? { failureEvidence } : {}),
  };
}

function consistencyFailureEvidence(
  error: GameDesignV2ConsistencyError,
  provenance: DesignStageProvenance,
): DesignAgentFailureEvidence {
  return {
    stage: "consistency",
    issueCode: error.code,
    issues: [{ code: error.code, path: [], message: error.message }],
    issueCount: 1,
    model: provenance.model,
    thinkingMode: provenance.thinkingMode,
    finishReason: provenance.finishReason,
    toolCallCount: provenance.toolCallCount,
    argumentsLength: provenance.argumentsLength,
    inputTokens: provenance.usage.inputTokens,
    outputTokens: provenance.usage.outputTokens,
    reasoningTokens: provenance.usage.reasoningTokens,
    elapsedMs: provenance.elapsedMs,
    timeoutMs: provenance.timeoutMs,
  };
}

export async function runDesignAgentStage(
  input: RunDesignAgentStageInput,
  deps: RunDesignAgentStageDeps,
): Promise<RunDesignAgentStageOutcome> {
  const requestIsValid =
    input.request?.language === "zh-CN" &&
    typeof input.request.prompt === "string" &&
    input.request.prompt.trim().length > 0;
  const requestSha256 = requestIsValid
    ? sha256Utf8(input.request.prompt)
    : "0".repeat(64);
  const requestRecord = {
    language: "zh-CN" as const,
    prompt: requestIsValid ? input.request.prompt : "invalid-request",
    sha256: requestSha256,
  };
  if (!requestIsValid) {
    const result = boundedFailure(requestRecord, {
      code: "invalid-agent-output",
      message: "Upstream Request is invalid.",
      retryable: false,
    });
    await persist(deps.outputPath, result);
    return { result };
  }

  let gameSpecSha256: string;
  let intentLedgerSha256: string;
  try {
    gameSpecSha256 = sha256GameSpecV2(input.gameSpec);
    intentLedgerSha256 = sha256IntentLedgerV2(input.intentLedger);
    verifyIntentLedgerV2(input.request, input.gameSpec, input.intentLedger);
  } catch (error) {
    const result = boundedFailure(requestRecord, {
      code: "invalid-agent-output",
      message:
        error instanceof Error
          ? `Upstream validation failed: ${error.message}`
          : "Upstream validation failed.",
      retryable: false,
    });
    await persist(deps.outputPath, result);
    return { result };
  }

  const inputs: readonly AgentArtifactRef[] = [
    { kind: "Request", sha256: requestSha256 },
    { kind: "GameSpecV2", sha256: gameSpecSha256 },
    { kind: "IntentLedgerV2", sha256: intentLedgerSha256 },
  ];
  let captured: DesignAgentModelOutput | undefined;
  let capturedProvenance: DesignStageProvenance | undefined;
  let capturedFailureEvidence: DesignAgentFailureEvidence | undefined;

  const executor: AgentExecutor<
    RunDesignAgentStageInput,
    DesignAgentModelOutput
  > = async (stageInput) => {
    try {
      const analysis = await deps.analyze(stageInput);
      capturedProvenance = analysis.provenance;
      return {
        status: "succeeded",
        artifact: analysis.output,
        kind: "DesignAgentOutput",
        modelCall: {
          provider: analysis.provenance.provider,
          model: analysis.provenance.model,
          outputMode: analysis.provenance.outputMode,
          usage: {
            cost: analysis.provenance.usage.cost,
            costKnown: analysis.provenance.usage.costKnown,
            inputTokens: analysis.provenance.usage.inputTokens ?? 0,
            outputTokens: analysis.provenance.usage.outputTokens ?? 0,
            reasoningTokens: analysis.provenance.usage.reasoningTokens ?? 0,
          },
        },
        tools: ["schema-validator", "artifact-hash"],
      };
    } catch (error) {
      const failure = error as {
        name?: string;
        message?: string;
        code?: string;
        retryable?: boolean;
        evidence?: DesignAgentFailureEvidence;
        provenance?: DesignStageProvenance;
      };
      capturedFailureEvidence = failure.evidence;
      capturedProvenance = failure.provenance;
      const failureProvenance = failure.provenance;
      return {
        status: "failed",
        name: failure.name ?? "DesignAgentModelError",
        message: failure.message ?? "The Design Agent model call failed.",
        ...(failure.code !== undefined ? { code: failure.code } : {}),
        retryable: failure.retryable === true,
        modelCall: {
          provider: failureProvenance?.provider ?? "deepseek",
          model:
            failureProvenance?.model ?? failure.evidence?.model ?? "unknown",
          usage: {
            cost: failureProvenance?.usage.cost ?? 0,
            costKnown: failureProvenance?.usage.costKnown ?? false,
            inputTokens:
              failureProvenance?.usage.inputTokens ??
              failure.evidence?.inputTokens ??
              0,
            outputTokens:
              failureProvenance?.usage.outputTokens ??
              failure.evidence?.outputTokens ??
              0,
            reasoningTokens:
              failureProvenance?.usage.reasoningTokens ??
              failure.evidence?.reasoningTokens ??
              0,
          },
        },
        tools: [],
      };
    }
  };

  let invocation: AgentInvocation | undefined;
  try {
    invocation = await runAgentInvocation({
      role: "design",
      executor,
      input,
      inputs,
      budget: deps.budget ?? DEFAULT_BUDGET,
      parseArtifact: (value) => {
        captured = parseDesignAgentModelOutput(value);
        return captured;
      },
      ...(deps.now !== undefined ? { now: deps.now } : {}),
      ...(deps.invocationId !== undefined
        ? { invocationId: deps.invocationId }
        : {}),
    });
  } catch (error) {
    const result = boundedFailure(
      requestRecord,
      {
        code: "model-failure",
        message:
          error instanceof Error
            ? `Design Agent invocation was rejected: ${error.message}`
            : "Design Agent invocation was rejected.",
        retryable: false,
      },
      capturedProvenance,
      capturedFailureEvidence,
    );
    await persist(deps.outputPath, result);
    return { result };
  }

  let result: DesignStageV2Result;
  if (invocation.result.status === "failed") {
    result = boundedFailure(
      requestRecord,
      {
        code: mapFailureCode(invocation.result.failure.code),
        message: invocation.result.failure.message,
        retryable: invocation.result.failure.retryable,
      },
      capturedProvenance,
      capturedFailureEvidence,
    );
  } else if (captured === undefined || capturedProvenance === undefined) {
    result = boundedFailure(requestRecord, {
      code: "invalid-agent-output",
      message: "Design Agent produced no recoverable output artifact.",
      retryable: false,
    });
  } else {
    result = finalizeDesignResult(
      requestRecord,
      gameSpecSha256,
      intentLedgerSha256,
      input,
      captured,
      capturedProvenance,
    );
  }

  await persist(deps.outputPath, result);
  return { result, invocation };
}

function finalizeDesignResult(
  request: DesignStageV2Result["request"],
  gameSpecSha256: string,
  intentLedgerSha256: string,
  input: RunDesignAgentStageInput,
  output: DesignAgentModelOutput,
  provenance: DesignStageProvenance,
): DesignStageV2Result {
  if (output.outcome === "needs-clarification") {
    return {
      schemaVersion: SCHEMA_VERSION,
      kind: "design-stage-v2-result",
      status: "needs-clarification",
      request,
      questions: output.questions,
      provenance,
    };
  }
  if (output.outcome === "bounded-failure") {
    return boundedFailure(request, output.failure, provenance);
  }

  try {
    const gameDesign = verifyGameDesignV2Consistency({
      request: input.request,
      gameSpec: input.gameSpec,
      intentLedger: input.intentLedger,
      design: {
        ...output.gameDesign,
        sources: {
          request: { sha256: request.sha256 },
          gameSpec: { schemaVersion: "2.0.0", sha256: gameSpecSha256 },
          intentLedger: {
            schemaVersion: "2.0.0",
            sha256: intentLedgerSha256,
          },
        },
      },
    });
    return {
      schemaVersion: SCHEMA_VERSION,
      kind: "design-stage-v2-result",
      status: "design-ready",
      request,
      gameDesign,
      gameDesignSha256: sha256GameDesignV2(gameDesign),
      gameSpecSha256,
      intentLedgerSha256,
      provenance,
    };
  } catch (error) {
    const consistencyError =
      error instanceof GameDesignV2ConsistencyError
        ? error
        : new GameDesignV2ConsistencyError(
            "schema",
            "GameDesignV2 validation failed unexpectedly.",
            { cause: error },
          );
    return boundedFailure(
      request,
      {
        code: "invalid-agent-output",
        message: consistencyError.message,
        retryable: false,
      },
      provenance,
      consistencyFailureEvidence(consistencyError, provenance),
    );
  }
}

export type { DesignStageV2Clarification };
