import { createHash } from "node:crypto";

import { z } from "zod";

import { canonicalJsonBytes } from "../modules/game-module-execution-contract.js";

/**
 * agent-envelope — the frozen, engine-neutral data contract shared by every
 * production Agent seam (Spec, Design, Module, Code, Verifier, Repair).
 *
 * Design constraints (see /Users/bytedance/code/AGENTS.md §权威数据流):
 *  - Every pipeline stage except the Orchestrator is a model-backed Agent. This
 *    module does NOT call any model and imports no model client; it only defines
 *    the pure-data record the Orchestrator uses to validate and account for one
 *    Agent invocation.
 *  - The Orchestrator is the sole authority for advancing state. It reuses these
 *    schemas to validate an executor's output, verify reference integrity, and
 *    record hashes/budget. It never performs the Agent's reasoning.
 *  - Production executors must be model-backed; unit tests may inject a
 *    deterministic stub. The `modelCall` record keeps that provenance honest by
 *    naming whichever provider/model (or explicit stub) produced the artifact.
 *
 * Current wiring status: this is a testable, unified seam. It is NOT yet threaded
 * through the full Request → Cocos build → Verification → Package pipeline; the
 * existing stages (run-spec-stage, run-composition-stage, run-packaging-stage)
 * have not yet been migrated onto it. That migration is explicitly incomplete.
 */

export const AGENT_ROLES = [
  "spec",
  "design",
  "module",
  "code",
  "verifier",
  "repair",
] as const;

export const AgentRoleSchema = z.enum(AGENT_ROLES);
export type AgentRole = z.infer<typeof AgentRoleSchema>;

/**
 * Deterministic tool categories an Agent may drive. These are TOOLS the Agent
 * calls, not Agents themselves: a planner, resolver, builder, browser harness,
 * state machine, hasher, schema validator or sandboxed workspace. Recording the
 * category set keeps the "tool ≠ Agent" boundary auditable.
 */
export const AGENT_TOOL_CATEGORIES = [
  "deterministic-planner",
  "schema-validator",
  "reference-resolver",
  "cocos-builder",
  "browser-harness",
  "state-machine",
  "artifact-hash",
  "sandboxed-workspace",
] as const;

export const AgentToolCategorySchema = z.enum(AGENT_TOOL_CATEGORIES);
export type AgentToolCategory = z.infer<typeof AgentToolCategorySchema>;

const Sha256Schema = z
  .string()
  .regex(/^[a-f0-9]{64}$/, "artifact hashes must be lowercase SHA-256 hex");

const IsoDateTimeSchema = z.iso.datetime({ offset: true });

/**
 * A hash-bound reference to an artifact this invocation consumes or derives from.
 * `kind` is the artifact contract name (e.g. "GameSpec", "GameDesign",
 * "ModuleAssembly", "CandidateAssembly", "VerificationEvidence"). The reference
 * carries only identity + hash so the Orchestrator can verify reference
 * integrity without re-reading the artifact.
 */
export const AgentArtifactRefSchema = z.strictObject({
  kind: z.string().min(1),
  sha256: Sha256Schema,
  bytes: z.number().int().nonnegative().optional(),
  /** File count when the artifact is a directory digest (see digestDirectory). */
  fileCount: z.number().int().positive().optional(),
  /** Relative provenance path inside the run directory when the artifact is persisted. */
  path: z.string().min(1).optional(),
});
export type AgentArtifactRef = z.infer<typeof AgentArtifactRefSchema>;

/**
 * The model/provider provenance and token/cost accounting for one Agent call.
 * Generalises RequirementAnalysisResult.usage across every role. Production
 * wiring records the real provider/model; a test stub records an explicit
 * "stub" provider so the record never falsely claims a real model ran.
 */
export const AgentModelCallSchema = z.strictObject({
  provider: z.string().min(1),
  model: z.string().min(1),
  /** How the structured output was obtained; free-form per provider. */
  outputMode: z.string().min(1).optional(),
  usage: z.strictObject({
    cost: z.number().nonnegative(),
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    reasoningTokens: z.number().int().nonnegative(),
    /**
     * Minimal, backward-compatible cost-honesty flag (batch prompt §三). When a
     * provider returns no settled charge and no usage from which to derive a
     * conservative estimate, the caller sets this to `false` so `cost` is NOT
     * mistaken for a verified zero. Left undefined (the default) the cost is a
     * reproducible conservative upper bound and a maxCost gate may be enforced;
     * when `false`, a maxCost budget can NOT be claimed as verified and the
     * invocation fails closed rather than silently passing.
     */
    costKnown: z.boolean().optional(),
  }),
});
export type AgentModelCall = z.infer<typeof AgentModelCallSchema>;

/** Structured failure. Agents never throw across the seam; they report this. */
export const AgentFailureSchema = z.strictObject({
  name: z.string().min(1),
  message: z.string().min(1),
  code: z.string().min(1).optional(),
  retryable: z.boolean(),
});
export type AgentFailure = z.infer<typeof AgentFailureSchema>;

/** Per-invocation budget the Orchestrator enforces against the model call. */
export const AgentBudgetSchema = z.strictObject({
  maxAttempts: z.number().int().positive(),
  maxCost: z.number().nonnegative().optional(),
  maxTokens: z.number().int().nonnegative().optional(),
  maxDurationMs: z.number().int().positive().optional(),
});
export type AgentBudget = z.infer<typeof AgentBudgetSchema>;

/**
 * The envelope wrapping a single artifact an Agent produced: its hash, the
 * invocation that produced it, and its provenance (which hash-bound inputs it
 * derives from and which deterministic tools were used). This is what the
 * Orchestrator records and chains as hash-bound evidence.
 */
export const AgentArtifactEnvelopeSchema = z.strictObject({
  role: AgentRoleSchema,
  kind: z.string().min(1),
  sha256: Sha256Schema,
  bytes: z.number().int().nonnegative(),
  path: z.string().min(1).optional(),
  producedBy: z.strictObject({
    invocationId: z.uuid(),
    attempt: z.number().int().positive(),
  }),
  provenance: z.strictObject({
    inputs: z.array(AgentArtifactRefSchema),
    tools: z.array(AgentToolCategorySchema),
    notes: z.array(z.string()).default([]),
  }),
});
export type AgentArtifactEnvelope = z.infer<typeof AgentArtifactEnvelopeSchema>;

/**
 * The outcome of one invocation: either a produced artifact envelope, or a
 * structured failure. Discriminated so the Orchestrator can branch safely.
 */
export const AgentInvocationOutcomeSchema = z.discriminatedUnion("status", [
  z.strictObject({
    status: z.literal("succeeded"),
    output: AgentArtifactEnvelopeSchema,
  }),
  z.strictObject({
    status: z.literal("failed"),
    failure: AgentFailureSchema,
  }),
]);
export type AgentInvocationOutcome = z.infer<
  typeof AgentInvocationOutcomeSchema
>;

/**
 * The full, auditable record of one Agent invocation. Every field the batch
 * prompt requires is captured: agentRole, invocationId, attempt, input hashes,
 * model/provider + token/cost, budget, startedAt/completedAt, success or
 * structured failure, tool categories, and provenance (carried on the output
 * envelope). The Orchestrator validates this record before advancing state.
 */
export const AgentInvocationSchema = z
  .strictObject({
    invocationId: z.uuid(),
    role: AgentRoleSchema,
    attempt: z.number().int().positive(),
    startedAt: IsoDateTimeSchema,
    completedAt: IsoDateTimeSchema,
    inputs: z.array(AgentArtifactRefSchema),
    budget: AgentBudgetSchema,
    tools: z.array(AgentToolCategorySchema),
    modelCall: AgentModelCallSchema,
    result: AgentInvocationOutcomeSchema,
  })
  .superRefine((invocation, context) => {
    if (invocation.attempt > invocation.budget.maxAttempts) {
      context.addIssue({
        code: "custom",
        message: "attempt exceeds the invocation budget's maxAttempts",
        path: ["attempt"],
      });
    }
    const startedAtMs = Date.parse(invocation.startedAt);
    const completedAtMs = Date.parse(invocation.completedAt);
    if (completedAtMs < startedAtMs) {
      context.addIssue({
        code: "custom",
        message: "completedAt must not precede startedAt",
        path: ["completedAt"],
      });
    }
    if (
      invocation.budget.maxDurationMs !== undefined &&
      completedAtMs - startedAtMs > invocation.budget.maxDurationMs
    ) {
      context.addIssue({
        code: "custom",
        message: "invocation duration exceeds the budget",
        path: ["completedAt"],
      });
    }
    if (invocation.budget.maxCost !== undefined) {
      if (invocation.modelCall.usage.costKnown === false) {
        // §三: an unknown cost can never be claimed as within a maxCost ceiling.
        // Fail closed rather than let a silent zero pass the gate.
        context.addIssue({
          code: "custom",
          message:
            "model cost is unknown, so the maxCost budget cannot be verified",
          path: ["modelCall", "usage", "costKnown"],
        });
      } else if (invocation.modelCall.usage.cost > invocation.budget.maxCost) {
        context.addIssue({
          code: "custom",
          message: "model cost exceeds the invocation budget",
          path: ["modelCall", "usage", "cost"],
        });
      }
    }
    const usedTokens =
      invocation.modelCall.usage.inputTokens +
      invocation.modelCall.usage.outputTokens +
      invocation.modelCall.usage.reasoningTokens;
    if (
      invocation.budget.maxTokens !== undefined &&
      usedTokens > invocation.budget.maxTokens
    ) {
      context.addIssue({
        code: "custom",
        message: "model token usage exceeds the invocation budget",
        path: ["modelCall", "usage"],
      });
    }
    if (invocation.result.status === "succeeded") {
      const output = invocation.result.output;
      if (output.role !== invocation.role) {
        context.addIssue({
          code: "custom",
          message: "output envelope role must match the invocation role",
          path: ["result", "output", "role"],
        });
      }
      if (output.producedBy.invocationId !== invocation.invocationId) {
        context.addIssue({
          code: "custom",
          message: "output envelope must be attributed to this invocation's id",
          path: ["result", "output", "producedBy", "invocationId"],
        });
      }
      if (output.producedBy.attempt !== invocation.attempt) {
        context.addIssue({
          code: "custom",
          message: "output envelope attempt must match the invocation attempt",
          path: ["result", "output", "producedBy", "attempt"],
        });
      }
      if (
        JSON.stringify(output.provenance.inputs) !==
        JSON.stringify(invocation.inputs)
      ) {
        context.addIssue({
          code: "custom",
          message: "output provenance inputs must match invocation inputs",
          path: ["result", "output", "provenance", "inputs"],
        });
      }
      if (
        JSON.stringify(output.provenance.tools) !==
        JSON.stringify(invocation.tools)
      ) {
        context.addIssue({
          code: "custom",
          message: "output provenance tools must match invocation tools",
          path: ["result", "output", "provenance", "tools"],
        });
      }
    }
  });
export type AgentInvocation = z.infer<typeof AgentInvocationSchema>;

/** Parse-and-validate an invocation record. Throws on any contract violation. */
export function parseAgentInvocation(value: unknown): AgentInvocation {
  return AgentInvocationSchema.parse(value);
}

/** Hash a UTF-8 string artifact (used for JSON/text artifacts held in memory). */
export function sha256Utf8(value: string): {
  sha256: string;
  bytes: number;
} {
  const buffer = Buffer.from(value, "utf8");
  return {
    sha256: createHash("sha256").update(buffer).digest("hex"),
    bytes: buffer.byteLength,
  };
}

/** Canonically serialise + hash a JSON artifact so envelopes are reproducible. */
export function sha256Json(value: unknown): {
  sha256: string;
  bytes: number;
} {
  const bytes = canonicalJsonBytes(value);
  return {
    sha256: createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.byteLength,
  };
}
