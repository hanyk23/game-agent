import { createHash, randomUUID } from "node:crypto";
import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import type { RequirementAnalysisResult } from "../requirements/requirement-analyzer.js";
import {
  parseShooterGameSpec,
  type ShooterGameSpec,
} from "../requirements/shooter-game-spec.js";
import {
  planSpecIntentLedger,
  SpecIntentLedgerError,
  type SpecIntentLedger,
  type SpecIntentRequest,
} from "../requirements/spec-intent-ledger.js";
import {
  completePlayableShooterGameSpec,
  SpecPlayabilityCompletionError,
  type SpecPlayabilityCompletionArtifact,
} from "../requirements/spec-playability-completion-policy.js";

/**
 * run-spec-stage — the minimal Orchestrator seam for Request → GameSpec.
 *
 * Design constraints (see AGENTS.md / batch prompt §0):
 *  - The Orchestrator calls no LLM. This module only *orchestrates*: it invokes
 *    the injected analyzer, advances state, reuses the deterministic
 *    spec-playability completion policy, and persists pure-data JSON artifacts.
 *    All model reasoning stays inside the analyzer dependency.
 *  - GAP-1: every artifact is plain JSON produced here in Node; nothing is fed
 *    into an engine runtime.
 *  - It does not touch run-composition-stage.ts or run-packaging-stage.ts.
 */

export type RunSpecStageRequest = Readonly<{
  language: "zh-CN";
  prompt: string;
}>;

/**
 * Injected analyzer. Production wiring passes a closure over
 * analyzeRequirementWithMetadata(client, …); tests pass a deterministic stub.
 * Keeping this a dependency is what keeps the Orchestrator LLM-free.
 */
export type RequirementAnalysis = (
  request: RunSpecStageRequest,
) => Promise<RequirementAnalysisResult>;

export type RunSpecStageDeps = Readonly<{
  analyze: RequirementAnalysis;
  /** When provided, the stage result is written atomically as JSON. */
  outputPath?: string;
}>;

export type SpecStageCompletion = Readonly<{
  /** True when the playability policy replaced a bounded field. */
  playabilityApplied: boolean;
  intentLedger?: SpecIntentLedger;
  playabilityArtifact?: SpecPlayabilityCompletionArtifact;
  /** Human-readable, deterministic provenance notes (auto-completion ledger). */
  notes: readonly string[];
}>;

type CompletionOutcome = Readonly<{
  completedSpec: ShooterGameSpec;
  completion: SpecStageCompletion;
}>;

export type SpecStageSuccess = Readonly<{
  schemaVersion: "1.0.0";
  kind: "spec-stage-result";
  status: "spec-ready";
  request: Readonly<{
    language: "zh-CN";
    prompt: string;
    sha256: string;
  }>;
  orientation: "vertical" | "horizontal" | null;
  spec: ShooterGameSpec;
  completion: SpecStageCompletion;
  analysis: Readonly<{
    outputMode: RequirementAnalysisResult["outputMode"];
    usage: RequirementAnalysisResult["usage"];
  }>;
}>;

export type SpecStageFailure = Readonly<{
  schemaVersion: "1.0.0";
  kind: "spec-stage-result";
  status: "bounded-failure";
  request: Readonly<{
    language: "zh-CN";
    prompt: string;
    sha256: string;
  }>;
  failure: Readonly<{
    name: string;
    message: string;
  }>;
}>;

export type SpecStageResult = SpecStageSuccess | SpecStageFailure;

function sha256(value: string): string {
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
 * Best-effort deterministic completion. The playability policy only applies to
 * Boss-defeat games whose player health is an unstated Agent choice below the
 * ceiling; for every other spec we keep the source spec unchanged and record
 * why completion did not apply. This never throws for a valid spec.
 */
function completeDeterministically(
  request: SpecIntentRequest,
  spec: ShooterGameSpec,
): CompletionOutcome {
  const notes: string[] = [];
  notes.push(
    spec.orientation === undefined
      ? "orientation not present on spec; downstream defaults to vertical."
      : `orientation locked to ${spec.orientation} by the analyzer.`,
  );

  let intentLedger: SpecIntentLedger;
  try {
    intentLedger = planSpecIntentLedger(request, spec);
  } catch (error) {
    if (error instanceof SpecIntentLedgerError) {
      notes.push(`intent ledger not derived: ${error.code}.`);
      return {
        completedSpec: spec,
        completion: { playabilityApplied: false, notes: Object.freeze(notes) },
      };
    }
    throw error;
  }

  try {
    const completion = completePlayableShooterGameSpec(
      request,
      spec,
      intentLedger,
    );
    notes.push(
      `playability completion applied: ${completion.artifact.decisions
        .map((decision) => `${decision.field}→${decision.completedValue}`)
        .join(", ")}.`,
    );
    return {
      completedSpec: completion.completedSpec,
      completion: {
        playabilityApplied: true,
        intentLedger: completion.intentLedger,
        playabilityArtifact: completion.artifact,
        notes: Object.freeze(notes),
      },
    };
  } catch (error) {
    if (error instanceof SpecPlayabilityCompletionError) {
      notes.push(`playability completion not applicable: ${error.message}.`);
      return {
        completedSpec: spec,
        completion: {
          playabilityApplied: false,
          intentLedger,
          notes: Object.freeze(notes),
        },
      };
    }
    throw error;
  }
}

/**
 * Advances Request → GameSpec: run the analyzer, apply deterministic
 * completion, and (optionally) persist the artifact. A completed, valid spec
 * yields a "spec-ready" record; any analyzer/validation failure yields a
 * structured "bounded-failure" record rather than throwing to the caller.
 */
export async function runSpecStage(
  request: RunSpecStageRequest,
  deps: RunSpecStageDeps,
): Promise<SpecStageResult> {
  const requestRecord = {
    language: request.language,
    prompt: request.prompt,
    sha256: sha256(request.prompt),
  } as const;

  let result: SpecStageResult;
  try {
    const analysis = await deps.analyze(request);
    // Re-validate defensively; the analyzer already parsed, but the
    // Orchestrator is the authority for what advances.
    const spec = parseShooterGameSpec(analysis.spec);
    const outcome = completeDeterministically(
      { language: request.language, prompt: request.prompt },
      spec,
    );
    result = {
      schemaVersion: "1.0.0",
      kind: "spec-stage-result",
      status: "spec-ready",
      request: requestRecord,
      orientation: outcome.completedSpec.orientation ?? null,
      spec: outcome.completedSpec,
      completion: outcome.completion,
      analysis: {
        outputMode: analysis.outputMode,
        usage: analysis.usage,
      },
    };
  } catch (error) {
    result = {
      schemaVersion: "1.0.0",
      kind: "spec-stage-result",
      status: "bounded-failure",
      request: requestRecord,
      failure: {
        name: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }

  if (deps.outputPath !== undefined) {
    await writeJsonAtomic(deps.outputPath, result);
  }
  return result;
}
