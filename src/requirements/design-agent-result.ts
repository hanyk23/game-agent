import { z } from "zod";

import { CostEvidenceSchema } from "./deepseek-cost-policy.js";
import {
  GameDesignV2BodySchema,
  GameDesignV2Schema,
} from "../gameplay/game-design-v2.js";
import { SpecPartitionSchema } from "./game-spec-v2.js";

/**
 * design-agent-result — the Design Agent's three-state output contract (batch
 * prompt §十一).
 *
 * The Design Agent returns exactly one of:
 *   design-ready | needs-clarification | bounded-failure.
 *
 * It reuses the Spec Agent's PROVEN three-state pattern, budget, provenance and
 * fail-closed ideas, but does NOT reuse the Spec Agent's business objects: a
 * design result carries a GameDesignV2, not a GameSpec. Two schema layers live
 * here:
 *  1. DesignAgentModelOutputSchema — what the Design Agent emits. A
 *     design-ready result carries GameDesignV2Body without source hashes; the
 *     Orchestrator attaches the authoritative upstream hashes.
 *  2. DesignStageV2ResultSchema — what the Orchestrator returns after it binds
 *     the source hashes, runs the deterministic consistency + reference
 *     validator, and records model provenance/usage. This is the persisted,
 *     hash-bound artifact.
 */

/**
 * Bounded-failure taxonomy (§十一). Mirrors the Spec Agent's split: the model may
 * legitimately declare a design genuinely out of the product boundary, genuinely
 * self-contradictory, or a safety violation; `invalid-agent-output` and
 * `model-failure` are reserved for the adapter/Orchestrator to raise when the
 * model misbehaves, so a model self-reporting them is treated as invalid output.
 */
export const DESIGN_BOUNDED_FAILURE_CODES = [
  "unsupported-product",
  "conflicting-requirements",
  "invalid-agent-output",
  "model-failure",
  "safety-violation",
] as const;
export const DesignBoundedFailureCodeSchema = z.enum(
  DESIGN_BOUNDED_FAILURE_CODES,
);
export type DesignBoundedFailureCode = z.infer<
  typeof DesignBoundedFailureCodeSchema
>;

/** Codes the model may emit; the reserved two are the pipeline's to raise. */
export const DESIGN_MODEL_EMITTABLE_FAILURE_CODES: readonly DesignBoundedFailureCode[] =
  ["unsupported-product", "conflicting-requirements", "safety-violation"];

export const DesignAgentFailureSchema = z.strictObject({
  code: DesignBoundedFailureCodeSchema,
  message: z.string().trim().min(1).max(600),
  retryable: z.boolean(),
});
export type DesignAgentFailure = z.infer<typeof DesignAgentFailureSchema>;

/**
 * A stable, machine-checkable question id (mirrors the Spec Agent). Only a truly
 * intent-affecting, unsafe-to-fill ambiguity becomes a design clarification
 * (§十一); ordinary design gaps are filled and marked agent-derived instead.
 */
export const DesignQuestionIdSchema = z
  .string()
  .regex(
    /^q-[a-z0-9]+(?:-[a-z0-9]+)*$/u,
    "questionId must be kebab-case prefixed with 'q-'",
  );

export const DesignClarificationQuestionSchema = z.strictObject({
  questionId: DesignQuestionIdSchema,
  question: z.string().trim().min(1).max(300),
  why: z.string().trim().min(1).max(400),
  // Which spec partition(s) the answer would affect, reusing the Spec Agent's
  // partition vocabulary so a design clarification points back at the request.
  affectedPartitions: z.array(SpecPartitionSchema).min(1).max(4),
});
export type DesignClarificationQuestion = z.infer<
  typeof DesignClarificationQuestionSchema
>;

function refineUniqueQuestionIds(
  questions: readonly DesignClarificationQuestion[],
  context: z.core.$RefinementCtx,
): void {
  const seen = new Set<string>();
  questions.forEach((question, index) => {
    if (seen.has(question.questionId)) {
      context.addIssue({
        code: "custom",
        message: `duplicate questionId: ${question.questionId}`,
        path: [index, "questionId"],
      });
    }
    seen.add(question.questionId);
  });
}

export const DesignClarificationQuestionsSchema = z
  .array(DesignClarificationQuestionSchema)
  .min(1)
  .max(3)
  .superRefine(refineUniqueQuestionIds);

// ---------------------------------------------------------------------------
// Layer 1 — the raw model output contract.
// ---------------------------------------------------------------------------

export const DesignAgentModelOutputSchema = z.discriminatedUnion("outcome", [
  z.strictObject({
    outcome: z.literal("design-ready"),
    gameDesign: GameDesignV2BodySchema,
  }),
  z.strictObject({
    outcome: z.literal("needs-clarification"),
    questions: DesignClarificationQuestionsSchema,
  }),
  z.strictObject({
    outcome: z.literal("bounded-failure"),
    failure: DesignAgentFailureSchema,
  }),
]);
export type DesignAgentModelOutput = z.infer<
  typeof DesignAgentModelOutputSchema
>;

export function parseDesignAgentModelOutput(
  input: unknown,
): DesignAgentModelOutput {
  return DesignAgentModelOutputSchema.parse(input);
}

// ---------------------------------------------------------------------------
// Layer 2 — the Orchestrator's returned stage artifact.
// ---------------------------------------------------------------------------

export const DesignRequestRecordSchema = z.strictObject({
  language: z.literal("zh-CN"),
  prompt: z.string().min(1),
  sha256: z.string().regex(/^[0-9a-f]{64}$/u),
});
export type DesignRequestRecord = z.infer<typeof DesignRequestRecordSchema>;

/**
 * Model provenance recorded on every design stage result. `costKnown` is true
 * only when complete usage exists.
 */
const DesignUsageSchema = z.strictObject({
  cost: z.number().nonnegative(),
  costKnown: z.boolean(),
  costEvidence: CostEvidenceSchema,
  inputTokens: z.number().int().nonnegative().nullable(),
  outputTokens: z.number().int().nonnegative().nullable(),
  reasoningTokens: z.number().int().nonnegative().nullable(),
});

export const DesignStageProvenanceSchema = z.strictObject({
  provider: z.string().min(1),
  model: z.string().min(1),
  outputMode: z.string().min(1),
  thinkingMode: z.enum(["enabled", "disabled"]),
  finishReason: z.string().nullable(),
  toolCallCount: z.number().int().nonnegative(),
  argumentsLength: z.number().int().nonnegative(),
  elapsedMs: z.number().int().nonnegative(),
  timeoutMs: z.number().int().positive().nullable(),
  usage: DesignUsageSchema,
});
export type DesignStageProvenance = z.infer<typeof DesignStageProvenanceSchema>;

export const DesignAgentFailureEvidenceSchema = z.strictObject({
  stage: z.enum([
    "request-validation",
    "network",
    "http",
    "response-body-read-timeout",
    "response-body-read",
    "empty-response-body",
    "provider-json",
    "tool-call",
    "function-arguments-json",
    "design-schema",
    "consistency",
  ]),
  issueCode: z.string().min(1),
  issues: z
    .array(
      z.strictObject({
        code: z.string().min(1),
        path: z.array(z.union([z.string(), z.number()])),
        message: z.string().min(1).max(600),
      }),
    )
    .max(20),
  issueCount: z.number().int().nonnegative(),
  model: z.string().min(1),
  thinkingMode: z.enum(["enabled", "disabled"]),
  finishReason: z.string().nullable(),
  toolCallCount: z.number().int().nonnegative(),
  argumentsLength: z.number().int().nonnegative(),
  inputTokens: z.number().int().nonnegative().nullable(),
  outputTokens: z.number().int().nonnegative().nullable(),
  reasoningTokens: z.number().int().nonnegative().nullable(),
  elapsedMs: z.number().int().nonnegative(),
  timeoutMs: z.number().int().positive().nullable(),
});
export type DesignAgentFailureEvidence = z.infer<
  typeof DesignAgentFailureEvidenceSchema
>;

export const DESIGN_STAGE_V2_SCHEMA_VERSION = "2.0.0" as const;

export const DesignStageV2ResultSchema = z.discriminatedUnion("status", [
  z.strictObject({
    schemaVersion: z.literal(DESIGN_STAGE_V2_SCHEMA_VERSION),
    kind: z.literal("design-stage-v2-result"),
    status: z.literal("design-ready"),
    request: DesignRequestRecordSchema,
    gameDesign: GameDesignV2Schema,
    gameDesignSha256: z.string().regex(/^[0-9a-f]{64}$/u),
    gameSpecSha256: z.string().regex(/^[0-9a-f]{64}$/u),
    intentLedgerSha256: z.string().regex(/^[0-9a-f]{64}$/u),
    provenance: DesignStageProvenanceSchema,
  }),
  z.strictObject({
    schemaVersion: z.literal(DESIGN_STAGE_V2_SCHEMA_VERSION),
    kind: z.literal("design-stage-v2-result"),
    status: z.literal("needs-clarification"),
    request: DesignRequestRecordSchema,
    questions: DesignClarificationQuestionsSchema,
    provenance: DesignStageProvenanceSchema,
  }),
  z.strictObject({
    schemaVersion: z.literal(DESIGN_STAGE_V2_SCHEMA_VERSION),
    kind: z.literal("design-stage-v2-result"),
    status: z.literal("bounded-failure"),
    request: DesignRequestRecordSchema,
    failure: DesignAgentFailureSchema,
    failureEvidence: DesignAgentFailureEvidenceSchema.optional(),
    // Provenance is optional: an environment failure (e.g. missing credential)
    // never reaches the model, so there is nothing to attribute.
    provenance: DesignStageProvenanceSchema.optional(),
  }),
]);
export type DesignStageV2Result = z.infer<typeof DesignStageV2ResultSchema>;
export type DesignStageV2Success = Extract<
  DesignStageV2Result,
  { status: "design-ready" }
>;
export type DesignStageV2Clarification = Extract<
  DesignStageV2Result,
  { status: "needs-clarification" }
>;
export type DesignStageV2Failure = Extract<
  DesignStageV2Result,
  { status: "bounded-failure" }
>;

export function parseDesignStageV2Result(input: unknown): DesignStageV2Result {
  return DesignStageV2ResultSchema.parse(input);
}

export function toDesignAgentModelOutputJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(DesignAgentModelOutputSchema, {
    target: "draft-2020-12",
    unrepresentable: "throw",
  }) as Record<string, unknown>;
}
