import { randomUUID } from "node:crypto";

import {
  AgentInvocationSchema,
  sha256Json,
  type AgentArtifactEnvelope,
  type AgentArtifactRef,
  type AgentBudget,
  type AgentInvocation,
  type AgentModelCall,
  type AgentRole,
} from "./agent-envelope.js";
import type {
  AgentExecutionContext,
  AgentExecutor,
  AgentExecutorResult,
} from "./agent-executor.js";

/**
 * run-agent-invocation — the Orchestrator-side seam that turns one executor
 * call into a validated, hash-bound {@link AgentInvocation} record.
 *
 * This function is deliberately model-free. It only:
 *   1. builds the execution context (invocationId, attempt, inputs, budget, clock),
 *   2. calls the injected executor (the sole place a model may run, inside the
 *      closure the caller supplied),
 *   3. hashes whatever artifact the executor produced,
 *   4. assembles and SCHEMA-VALIDATES the invocation record,
 *   5. returns it for the Orchestrator to record and act on.
 *
 * It never designs, selects modules, writes code, plans verification, or
 * diagnoses. If the executor throws, that is converted into a structured,
 * non-retryable failure rather than propagating: an unknown exception is not
 * evidence that repeating the same call is safe. The returned record is always
 * parsed through AgentInvocationSchema so an invalid executor result fails
 * closed here.
 */

export type RunAgentInvocationOptions<Input, Artifact> = Readonly<{
  role: AgentRole;
  executor: AgentExecutor<Input, Artifact>;
  input: Input;
  inputs: readonly AgentArtifactRef[];
  budget: AgentBudget;
  /** Strict role-specific artifact parser applied before hashing/admission. */
  parseArtifact: (value: unknown) => Artifact;
  attempt?: number;
  now?: () => Date;
  invocationId?: string;
  /**
   * How to hash the produced artifact. Defaults to canonical JSON hashing,
   * which fits pure-data artifacts (GameSpec, GameDesign, VerificationPlan,
   * RepairDiagnosis). Directory-shaped artifacts (a built CandidateAssembly)
   * pass a custom hasher that reuses digestDirectory.
   */
  hashArtifact?: (artifact: Artifact) => {
    sha256: string;
    bytes: number;
    fileCount?: number;
    path?: string;
  };
}>;

function buildModelCallProvenance(modelCall: AgentModelCall): AgentModelCall {
  return modelCall;
}

export async function runAgentInvocation<Input, Artifact>(
  options: RunAgentInvocationOptions<Input, Artifact>,
): Promise<AgentInvocation> {
  const now = options.now ?? (() => new Date());
  const invocationId = options.invocationId ?? randomUUID();
  const attempt = options.attempt ?? 1;
  const startedAt = now().toISOString();

  const context: AgentExecutionContext = {
    invocationId,
    attempt,
    inputs: options.inputs,
    budget: options.budget,
    now,
  };

  let result: AgentExecutorResult<Artifact>;
  try {
    result = await options.executor(options.input, context);
  } catch (error) {
    // An executor that throws is a bug in the Agent seam, not a valid outcome.
    // Convert it to a structured, non-retryable failure so the pipeline fails
    // closed without entering an unbounded retry loop.
    const completedAt = now().toISOString();
    return AgentInvocationSchema.parse({
      invocationId,
      role: options.role,
      attempt,
      startedAt,
      completedAt,
      inputs: options.inputs,
      budget: options.budget,
      tools: [],
      modelCall: {
        provider: "unknown",
        model: "unknown",
        usage: {
          cost: 0,
          inputTokens: 0,
          outputTokens: 0,
          reasoningTokens: 0,
        },
      },
      result: {
        status: "failed",
        failure: {
          name: error instanceof Error ? error.name : "AgentExecutorError",
          message: error instanceof Error ? error.message : String(error),
          retryable: false,
        },
      },
    });
  }

  const completedAt = now().toISOString();

  if (result.status === "failed") {
    return AgentInvocationSchema.parse({
      invocationId,
      role: options.role,
      attempt,
      startedAt,
      completedAt,
      inputs: options.inputs,
      budget: options.budget,
      tools: result.tools ?? [],
      modelCall: buildModelCallProvenance(result.modelCall),
      result: {
        status: "failed",
        failure: {
          name: result.name,
          message: result.message,
          ...(result.code !== undefined ? { code: result.code } : {}),
          retryable: result.retryable,
        },
      },
    });
  }

  let artifact: Artifact;
  try {
    artifact = options.parseArtifact(result.artifact);
  } catch (error) {
    return AgentInvocationSchema.parse({
      invocationId,
      role: options.role,
      attempt,
      startedAt,
      completedAt,
      inputs: options.inputs,
      budget: options.budget,
      tools: result.tools,
      modelCall: buildModelCallProvenance(result.modelCall),
      result: {
        status: "failed",
        failure: {
          name: "InvalidAgentArtifact",
          message:
            error instanceof Error
              ? error.message
              : "agent output failed its artifact schema",
          code: "invalid_agent_artifact",
          retryable: false,
        },
      },
    });
  }

  const hasher: (artifact: Artifact) => {
    sha256: string;
    bytes: number;
    fileCount?: number;
    path?: string;
  } = options.hashArtifact ?? ((artifact: Artifact) => sha256Json(artifact));
  const digest = hasher(artifact);

  const envelope: AgentArtifactEnvelope = {
    role: options.role,
    kind: result.kind,
    sha256: digest.sha256,
    bytes: digest.bytes,
    ...(digest.path !== undefined ? { path: digest.path } : {}),
    producedBy: { invocationId, attempt },
    provenance: {
      inputs: [...options.inputs],
      tools: [...result.tools],
      notes: [...(result.provenanceNotes ?? [])],
    },
  };

  return AgentInvocationSchema.parse({
    invocationId,
    role: options.role,
    attempt,
    startedAt,
    completedAt,
    inputs: options.inputs,
    budget: options.budget,
    tools: result.tools,
    modelCall: buildModelCallProvenance(result.modelCall),
    result: {
      status: "succeeded",
      output: envelope,
    },
  });
}
