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
import { sha256GameSpecV2 } from "../requirements/game-spec-v2.js";
import {
  assertLockedStatementsPreserved,
  assertLockedStatementsPreservedPartial,
  buildClarificationResult,
  buildClarificationRound2Request,
  ClarificationContinuationError,
} from "../requirements/clarification-continuation.js";
import {
  IntentLedgerV2Error,
  verifyIntentLedgerV2,
  type IntentLedgerV2,
} from "../requirements/intent-ledger-v2.js";
import type { DeepSeekSpecAgentResult } from "../requirements/deepseek-spec-agent-adapter.js";
import {
  parseSpecAgentModelOutput,
  type BoundedFailureCode,
  type SpecAgentModelOutput,
  type SpecStageProvenance,
  type SpecStageV2Clarification,
  type SpecStageV2Result,
} from "../requirements/spec-agent-result.js";

/**
 * run-spec-agent-stage — the v2 production entry for Request → GameSpec v2.
 *
 * Design constraints (AGENTS.md §Orchestrator + batch prompt §七):
 *  - The Orchestrator calls no model. It only: computes the Request SHA-256,
 *    invokes the INJECTED Spec Agent executor (the sole place a model may run),
 *    RE-validates the model output locally, binds hashes, assembles + verifies
 *    the IntentLedger v2 (structure/evidence/reference — never gameplay
 *    semantics), enforces the budget, persists a pure-JSON artifact atomically,
 *    and returns one of the three states.
 *  - It never understands gameplay, generates requirements, or invents Boss /
 *    waves / win-lose conditions, and never repairs invalid Agent output into a
 *    success. Invalid output fails closed as a bounded-failure.
 *  - It reuses the frozen generic Agent seam (agent-envelope /
 *    run-agent-invocation) for hashing, budget enforcement, model-provenance
 *    accounting, and fail-closed validation of the executor's output.
 *
 * The legacy runSpecStage / ShooterGameSpec path is untouched; this is a new,
 * canonically-named entry so old and new meanings never blur.
 */

export type RunSpecAgentStageRequest = Readonly<{
  language: "zh-CN";
  prompt: string;
}>;

/**
 * Injected Spec Agent analysis. Production wiring passes a closure over
 * analyzeSpecWithDeepSeek(...); unit/integration tests pass a deterministic stub
 * or a mocked-fetch adapter. It returns the raw model output + provenance, or
 * throws a structured SpecAgentModelError on a model/adapter failure. Keeping it
 * a dependency is what keeps the Orchestrator model-free.
 */
export type SpecAgentV2Analysis = (
  request: RunSpecAgentStageRequest,
) => Promise<DeepSeekSpecAgentResult>;

export type RunSpecAgentStageDeps = Readonly<{
  analyze: SpecAgentV2Analysis;
  /** Per-invocation budget the seam enforces (default: single attempt). */
  budget?: AgentBudget;
  /** When set, the stage result is written atomically as JSON. */
  outputPath?: string;
  /** Injected clock so tests stay deterministic. */
  now?: () => Date;
  invocationId?: string;
  /**
   * Extra hash-bound input references recorded on the invocation alongside the
   * Request. The clarification continuation uses this to bind the second-round
   * invocation to the first-round clarification context hash.
   */
  additionalInputs?: readonly AgentArtifactRef[];
}>;

/** The result plus the audited invocation record the seam produced. */
export type RunSpecAgentStageOutcome = Readonly<{
  result: SpecStageV2Result;
  /**
   * The hash-bound invocation record. Absent only when the seam could not even
   * mint a schema-valid record (e.g. the model's reported usage exceeded the
   * budget), in which case `result` is a bounded-failure.
   */
  invocation?: AgentInvocation;
}>;

const SCHEMA_VERSION = "2.0.0" as const;
const DEFAULT_BUDGET: AgentBudget = { maxAttempts: 1 };

function sha256Utf8(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function toJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function writeJsonAtomic(
  filePath: string,
  value: unknown,
): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, toJson(value), "utf8");
  await rename(temporaryPath, filePath);
}

/**
 * Map an invocation-level failure (adapter threw, budget exceeded, or the
 * output failed the seam's schema re-parse) onto the bounded-failure taxonomy.
 * `invalid_agent_artifact` is the seam's own code when parseArtifact rejects.
 */
function mapFailureCode(failureCode: string | undefined): {
  code: BoundedFailureCode;
  retryableDefault: boolean;
} {
  switch (failureCode) {
    case "invalid_agent_artifact":
    case "invalid-agent-output":
      return { code: "invalid-agent-output", retryableDefault: false };
    case "model-failure":
      return { code: "model-failure", retryableDefault: true };
    default:
      // An unknown thrown exception in the model client is a model failure.
      return { code: "model-failure", retryableDefault: false };
  }
}

/**
 * Advances Request → GameSpec v2. Returns exactly one of spec-ready /
 * needs-clarification / bounded-failure. Never throws for a model/validation
 * failure; only truly unexpected Orchestrator bugs would propagate.
 */
export async function runSpecAgentStage(
  request: RunSpecAgentStageRequest,
  deps: RunSpecAgentStageDeps,
): Promise<RunSpecAgentStageOutcome> {
  const requestSha256 = sha256Utf8(request.prompt);
  const requestRecord = {
    language: request.language,
    prompt: request.prompt,
    sha256: requestSha256,
  } as const;
  const requestRef: AgentArtifactRef = {
    kind: "Request",
    sha256: requestSha256,
  };
  const budget = deps.budget ?? DEFAULT_BUDGET;

  // Capture the validated model output + provenance through the parser the seam
  // invokes, so we reuse the seam's hashing/budget/validation while still
  // obtaining the artifact the Orchestrator must act on.
  let captured: SpecAgentModelOutput | undefined;
  let capturedProvenance: SpecStageProvenance | undefined;

  const executor: AgentExecutor<
    RunSpecAgentStageRequest,
    SpecAgentModelOutput
  > = async (input) => {
    try {
      const analysis = await deps.analyze(input);
      capturedProvenance = analysis.provenance;
      return {
        status: "succeeded",
        artifact: analysis.output,
        kind: "SpecAgentOutput",
        modelCall: {
          provider: analysis.provenance.provider,
          model: analysis.provenance.model,
          outputMode: analysis.provenance.outputMode,
          // The seam's modelCall carries the numeric cost + honesty flag; the
          // full reproducible cost evidence lives on the stage provenance.
          usage: {
            cost: analysis.provenance.usage.cost,
            costKnown: analysis.provenance.usage.costKnown,
            inputTokens: analysis.provenance.usage.inputTokens,
            outputTokens: analysis.provenance.usage.outputTokens,
            reasoningTokens: analysis.provenance.usage.reasoningTokens,
          },
        },
        tools: ["schema-validator"],
      };
    } catch (error) {
      const failure = error as {
        name?: string;
        message?: string;
        code?: "model-failure" | "invalid-agent-output";
        retryable?: boolean;
      };
      return {
        status: "failed",
        name:
          typeof failure.name === "string"
            ? failure.name
            : "SpecAgentModelError",
        message:
          typeof failure.message === "string"
            ? failure.message
            : "The Spec Agent model call failed.",
        ...(failure.code !== undefined ? { code: failure.code } : {}),
        retryable: failure.retryable === true,
        modelCall: {
          provider: "deepseek",
          model: "unknown",
          usage: {
            // §三: a failed call produced no settled charge and no usage from
            // which to estimate one. Record the cost as explicitly UNKNOWN
            // (costKnown:false) rather than a misleading verified zero.
            cost: 0,
            costKnown: false,
            inputTokens: 0,
            outputTokens: 0,
            reasoningTokens: 0,
          },
        },
        tools: [],
      };
    }
  };

  let invocation: AgentInvocation | undefined;
  try {
    invocation = await runAgentInvocation({
      role: "spec",
      executor,
      input: request,
      inputs: [requestRef, ...(deps.additionalInputs ?? [])],
      budget,
      parseArtifact: (value) => {
        const parsed = parseSpecAgentModelOutput(value);
        captured = parsed;
        return parsed;
      },
      ...(deps.now !== undefined ? { now: deps.now } : {}),
      ...(deps.invocationId !== undefined
        ? { invocationId: deps.invocationId }
        : {}),
    });
  } catch (error) {
    // The seam parses the final record through AgentInvocationSchema; a budget
    // breach (model usage/cost/duration over budget) is rejected there. Fail
    // closed as a bounded model-failure with no invocation record to record.
    const result = boundedFailure(
      requestRecord,
      {
        code: "model-failure",
        message:
          error instanceof Error
            ? `Spec Agent invocation was rejected: ${error.message}`
            : "Spec Agent invocation was rejected.",
        retryable: false,
      },
      capturedProvenance,
    );
    await persist(deps.outputPath, result);
    return { result };
  }

  let result: SpecStageV2Result;

  if (invocation.result.status === "failed") {
    const failure = invocation.result.failure;
    const mapped = mapFailureCode(failure.code);
    result = boundedFailure(
      requestRecord,
      {
        code: mapped.code,
        message: failure.message,
        retryable: failure.retryable,
      },
      capturedProvenance,
    );
  } else if (captured === undefined || capturedProvenance === undefined) {
    // Defensive: a succeeded invocation must have produced a captured artifact.
    result = boundedFailure(requestRecord, {
      code: "invalid-agent-output",
      message: "Spec Agent produced no recoverable output artifact.",
      retryable: false,
    });
  } else {
    result = finalizeSuccessOrClarification(
      requestRecord,
      requestSha256,
      captured,
      capturedProvenance,
    );
  }

  await persist(deps.outputPath, result);
  return { result, invocation };
}

/**
 * The hash-bound input reference kind recorded on the second-round invocation to
 * bind it to the first-round clarification context.
 */
const CLARIFICATION_CONTEXT_REF_KIND = "ClarificationContext" as const;

export type RunSpecAgentClarificationStageInput = Readonly<{
  /** The fully-verified first-round needs-clarification result. */
  clarification: SpecStageV2Clarification;
  /** The user's answers to this round's questions (validated deterministically). */
  answers: readonly unknown[];
}>;

/**
 * runSpecAgentClarificationStage — the production Orchestrator entry for the
 * SECOND clarification round (batch prompt §二). It is the only sanctioned way to
 * turn a first-round needs-clarification result + the user's answers into a
 * verified continuation, and it is model-free: it delegates the single model call
 * to the injected Spec Agent executor and only validates.
 *
 * Flow (fail closed at every step):
 *   1. Validate the answers deterministically against THIS clarification round —
 *      every question answered exactly once, each answer citing the correct
 *      questionId + clarificationId + context hash. A missing / unknown /
 *      duplicate / mismatched answer throws the structured
 *      ClarificationContinuationError BEFORE any model runs (no artifact written).
 *   2. Build the canonical-JSON second-round Request (§四) whose sha256 is bound
 *      to the final payload.
 *   3. Invoke the injected Spec Agent executor through runSpecAgentStage —
 *      WITHOUT an outputPath, so an unverified result can never reach the real
 *      artifact — recording the clarification context hash as a hash-bound input
 *      reference on the invocation.
 *   4. runSpecAgentStage already re-validates the model output and assembles +
 *      verifies the (full or partial) IntentLedger v2 locally.
 *   5. Enforce first-round locked-statement preservation on the round-2 result:
 *      a spec-ready output must keep every locked statement (id / text /
 *      partition / source / strength / locked) and a second needs-clarification
 *      must carry them all forward too. ANY deletion / rewrite / move / downgrade
 *      / unlock fails closed as bounded-failure(invalid-agent-output).
 *   6. Only AFTER the locked-statement gate passes is the final artifact
 *      persisted atomically to outputPath, together with the returned invocation
 *      evidence.
 */
export async function runSpecAgentClarificationStage(
  input: RunSpecAgentClarificationStageInput,
  deps: RunSpecAgentStageDeps,
): Promise<RunSpecAgentStageOutcome> {
  const { clarification } = input;

  // Step 1 + 2: deterministic answer validation (throws
  // ClarificationContinuationError on any missing / unknown / duplicate /
  // mismatch) and canonical-JSON second-round Request assembly. This runs before
  // any model call, so a malformed continuation never invokes the model.
  const round2 = buildClarificationRound2Request(clarification, input.answers);

  // Step 3: invoke the injected Spec Agent through the base stage, but never let
  // it persist — an unverified round-2 result must not reach outputPath. Bind the
  // clarification context hash as a hash-bound input reference on the invocation.
  const contextRef: AgentArtifactRef = {
    kind: CLARIFICATION_CONTEXT_REF_KIND,
    sha256: clarification.clarificationContextSha256,
  };
  const round2Deps: RunSpecAgentStageDeps = {
    analyze: deps.analyze,
    ...(deps.budget !== undefined ? { budget: deps.budget } : {}),
    ...(deps.now !== undefined ? { now: deps.now } : {}),
    ...(deps.invocationId !== undefined
      ? { invocationId: deps.invocationId }
      : {}),
    // outputPath is deliberately OMITTED: no persistence until the locked-
    // statement gate below has passed.
    additionalInputs: [contextRef, ...(deps.additionalInputs ?? [])],
  };
  const { result: round2Result, invocation } = await runSpecAgentStage(
    { language: "zh-CN", prompt: round2.request.prompt },
    round2Deps,
  );

  // Steps 4 + 5: enforce first-round locked-statement preservation on whatever
  // the round-2 output is. A bounded-failure round-2 result is already fail-
  // closed and passes through unchanged.
  const gated = enforceLockedStatementsOnRound2(clarification, round2Result);

  // Step 6: persist the final, fully-verified artifact atomically.
  await persist(deps.outputPath, gated);
  return {
    result: gated,
    ...(invocation !== undefined ? { invocation } : {}),
  };
}

/**
 * Apply the first-round locked-statement preservation gate to a round-2 result.
 * A spec-ready or needs-clarification result that drops / rewrites / moves /
 * downgrades / unlocks a first-round locked statement is downgraded to a
 * bounded-failure(invalid-agent-output); every other result passes through
 * unchanged (a bounded-failure is already fail-closed).
 */
function enforceLockedStatementsOnRound2(
  clarification: SpecStageV2Clarification,
  round2Result: SpecStageV2Result,
): SpecStageV2Result {
  try {
    if (round2Result.status === "spec-ready") {
      assertLockedStatementsPreserved(
        clarification,
        round2Result.gameSpec,
        round2Result.intentLedger,
      );
    } else if (round2Result.status === "needs-clarification") {
      assertLockedStatementsPreservedPartial(
        clarification,
        round2Result.partialSpec,
        round2Result.partialIntentLedger,
      );
    }
    return round2Result;
  } catch (error) {
    if (error instanceof ClarificationContinuationError) {
      return boundedFailure(
        round2Result.request,
        {
          code: "invalid-agent-output",
          message: `Second-round output violated a first-round locked statement (${error.code}): ${error.message}`,
          retryable: false,
        },
        "provenance" in round2Result ? round2Result.provenance : undefined,
      );
    }
    throw error;
  }
}

function boundedFailure(
  requestRecord: SpecStageV2Result["request"],
  failure: { code: BoundedFailureCode; message: string; retryable: boolean },
  provenance?: SpecStageProvenance,
): SpecStageV2Result {
  return {
    schemaVersion: SCHEMA_VERSION,
    kind: "spec-stage-v2-result",
    status: "bounded-failure",
    request: requestRecord,
    failure,
    ...(provenance !== undefined ? { provenance } : {}),
  };
}

/**
 * Turn a validated model output into the final stage result. For spec-ready we
 * bind hashes and deterministically verify the assembled IntentLedger v2; any
 * verification failure downgrades to a bounded-failure (invalid-agent-output),
 * never a silently repaired success.
 */
function finalizeSuccessOrClarification(
  requestRecord: SpecStageV2Result["request"],
  requestSha256: string,
  output: SpecAgentModelOutput,
  provenance: SpecStageProvenance,
): SpecStageV2Result {
  if (output.outcome === "needs-clarification") {
    // §四: assemble + verify the partial ledger, bind every hash and derive the
    // clarification round's id + context hash. A partial ledger that is not a
    // faithful, hash-bound record of the partial spec fails closed as
    // invalid-agent-output rather than a half-verified clarification.
    try {
      return buildClarificationResult({
        request: requestRecord,
        partialSpec: output.partialSpec,
        partialLedgerEntries: output.partialLedger,
        questions: output.questions,
        provenance,
      });
    } catch (error) {
      return boundedFailure(
        requestRecord,
        {
          code: "invalid-agent-output",
          message:
            error instanceof Error
              ? `Clarification assembly failed: ${error.message}`
              : "Clarification assembly failed.",
          retryable: false,
        },
        provenance,
      );
    }
  }

  if (output.outcome === "bounded-failure") {
    return boundedFailure(
      requestRecord,
      {
        code: output.failure.code,
        message: output.failure.message,
        retryable: output.failure.retryable,
      },
      provenance,
    );
  }

  // spec-ready — bind hashes and assemble + verify the full ledger.
  const gameSpecSha256 = sha256GameSpecV2(output.gameSpec);
  const assembledLedger: IntentLedgerV2 = {
    schemaVersion: "2.0.0",
    kind: "IntentLedgerV2",
    scope: "open-requirement-provenance-v2",
    request: {
      language: "zh-CN",
      normalization: "NFKC",
      sha256: requestSha256,
    },
    gameSpec: { schemaVersion: "2.0.0", sha256: gameSpecSha256 },
    entries: output.ledger,
  };

  let verifiedLedger: IntentLedgerV2;
  try {
    verifiedLedger = verifyIntentLedgerV2(
      { language: requestRecord.language, prompt: requestRecord.prompt },
      output.gameSpec,
      assembledLedger,
    );
  } catch (error) {
    return boundedFailure(
      requestRecord,
      {
        code: "invalid-agent-output",
        message:
          error instanceof IntentLedgerV2Error
            ? `IntentLedger verification failed (${error.code}): ${error.message}`
            : "IntentLedger verification failed.",
        retryable: false,
      },
      provenance,
    );
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    kind: "spec-stage-v2-result",
    status: "spec-ready",
    request: requestRecord,
    gameSpec: output.gameSpec,
    intentLedger: verifiedLedger,
    gameSpecSha256,
    provenance,
  };
}

async function persist(
  outputPath: string | undefined,
  result: SpecStageV2Result,
): Promise<void> {
  if (outputPath !== undefined) {
    await writeJsonAtomic(outputPath, result);
  }
}
