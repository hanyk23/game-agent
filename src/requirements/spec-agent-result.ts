import { z } from "zod";

import { CostEvidenceSchema } from "./deepseek-cost-policy.js";
import {
  GameSpecV2Schema,
  PartialGameSpecV2Schema,
  SpecPartitionSchema,
} from "./game-spec-v2.js";
import {
  IntentLedgerV2EntrySchema,
  IntentLedgerV2Schema,
  PartialIntentLedgerV2Schema,
} from "./intent-ledger-v2.js";

/**
 * spec-agent-result — the Spec Agent's three-state output contract.
 *
 * The Spec Agent (batch prompt §五) returns exactly one of three outcomes:
 *   spec-ready | needs-clarification | bounded-failure.
 *
 * Two layers of schema live here:
 *  1. SpecAgentModelOutputSchema — what the MODEL is allowed to emit. It carries
 *     the GameSpec v2 plus the ledger *entries* (source/strength/locked/
 *     confidence/evidence), but NOT the Request/Spec SHA-256 bindings: those are
 *     computed deterministically by the Orchestrator, never trusted from the
 *     model. This is the schema the DeepSeek adapter validates locally so an
 *     illegal model response fails closed before it ever reaches the pipeline.
 *  2. SpecStageV2ResultSchema — what the Orchestrator returns after it binds the
 *     hashes, assembles + verifies the full IntentLedger v2, and records model
 *     provenance/usage. This is the persisted, hash-bound artifact.
 */

/** Bounded-failure taxonomy (batch prompt §五.3). */
export const BOUNDED_FAILURE_CODES = [
  // Out of the current product boundary (e.g. a 3D multiplayer racing game).
  "unsupported-product",
  // The user's own requirements genuinely contradict each other.
  "conflicting-requirements",
  // The model returned JSON that failed local schema/reference validation.
  "invalid-agent-output",
  // The model call itself failed: network, timeout, truncation, exception.
  "model-failure",
  // The request tried to violate the system contract / safety rules.
  "safety-violation",
] as const;
export const BoundedFailureCodeSchema = z.enum(BOUNDED_FAILURE_CODES);
export type BoundedFailureCode = z.infer<typeof BoundedFailureCodeSchema>;

export const SpecAgentFailureSchema = z.strictObject({
  code: BoundedFailureCodeSchema,
  message: z.string().trim().min(1).max(600),
  retryable: z.boolean(),
});
export type SpecAgentFailure = z.infer<typeof SpecAgentFailureSchema>;

/**
 * A stable, machine-checkable question identifier (batch prompt §四). It must be
 * kebab-case and prefixed `q-` so a user answer can reference exactly which
 * question it resolves. Stability across rounds is guaranteed by persisting it in
 * the clarification result and carrying it verbatim into the second round.
 */
export const QuestionIdSchema = z
  .string()
  .regex(
    /^q-[a-z0-9]+(?:-[a-z0-9]+)*$/u,
    "questionId must be kebab-case prefixed with 'q-'",
  );

/**
 * A stable identifier for one clarification round (batch prompt §四). Derived
 * deterministically from the round's context hash so the same first-round result
 * always yields the same clarificationId. The user's answer cites it to prove it
 * is answering THIS round.
 */
export const ClarificationIdSchema = z
  .string()
  .regex(/^clarify-[0-9a-f]{16}$/u, "clarificationId must be clarify-<16 hex>");

/**
 * One clarification question. Only asked when different answers would materially
 * change the game's SHAPE (batch prompt §五.2) — never for Design-layer numbers
 * such as enemy counts, Boss phases, damage or bullet speed.
 */
export const ClarificationQuestionSchema = z.strictObject({
  // §四: a stable id so the user's answer can cite exactly this question.
  questionId: QuestionIdSchema,
  question: z.string().trim().min(1).max(300),
  // Why the question must be asked (which ambiguity/conflict it resolves).
  why: z.string().trim().min(1).max(400),
  // Which partition(s) the answer would affect.
  affectedPartitions: z.array(SpecPartitionSchema).min(1).max(4),
});
export type ClarificationQuestion = z.infer<typeof ClarificationQuestionSchema>;

/** Reject duplicate questionIds in a question list (batch prompt §四 test 3). */
function refineUniqueQuestionIds(
  questions: readonly ClarificationQuestion[],
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

export const ClarificationQuestionsSchema = z
  .array(ClarificationQuestionSchema)
  .min(1)
  .max(3)
  .superRefine(refineUniqueQuestionIds);

// ---------------------------------------------------------------------------
// Layer 1 — the raw model output contract.
// ---------------------------------------------------------------------------

export const SpecAgentModelOutputSchema = z.discriminatedUnion("outcome", [
  z.strictObject({
    outcome: z.literal("spec-ready"),
    gameSpec: GameSpecV2Schema,
    // Ledger entries only; the Orchestrator attaches request/spec hashes.
    ledger: z.array(IntentLedgerV2EntrySchema).min(1).max(80),
  }),
  z.strictObject({
    outcome: z.literal("needs-clarification"),
    partialSpec: PartialGameSpecV2Schema,
    // Ledger entries for the partial spec's statements only; the Orchestrator
    // attaches request/partial-spec hashes (§四). MAY be empty for an empty
    // partial spec, so an empty partial spec still has an explicit ledger.
    partialLedger: z.array(IntentLedgerV2EntrySchema).max(80),
    questions: ClarificationQuestionsSchema,
  }),
  z.strictObject({
    outcome: z.literal("bounded-failure"),
    failure: SpecAgentFailureSchema,
  }),
]);
export type SpecAgentModelOutput = z.infer<typeof SpecAgentModelOutputSchema>;

export function parseSpecAgentModelOutput(
  input: unknown,
): SpecAgentModelOutput {
  return SpecAgentModelOutputSchema.parse(input);
}

/**
 * The model output codes the Spec Agent may legitimately emit as a
 * bounded-failure. `invalid-agent-output` and `model-failure` are reserved for
 * the adapter/Orchestrator to raise when the model misbehaves, so a model that
 * self-reports them is treated as invalid output.
 */
export const MODEL_EMITTABLE_FAILURE_CODES: readonly BoundedFailureCode[] = [
  "unsupported-product",
  "conflicting-requirements",
  "safety-violation",
];

// ---------------------------------------------------------------------------
// Layer 2 — the Orchestrator's returned stage artifact.
// ---------------------------------------------------------------------------

export const RequestRecordSchema = z.strictObject({
  language: z.literal("zh-CN"),
  prompt: z.string().min(1),
  sha256: z.string().regex(/^[0-9a-f]{64}$/u),
});
export type RequestRecord = z.infer<typeof RequestRecordSchema>;

/**
 * Model provenance recorded on every stage result. Mirrors the Agent envelope's
 * modelCall so a stub can never be mistaken for a real DeepSeek call.
 *
 * Cost honesty (batch prompt §三): `cost` is the numeric conservative upper
 * bound a budget gate compares against, `costKnown` says whether that number is
 * a real estimate (true) or an explicit unknown (false), and `costEvidence`
 * carries the reproducible basis (estimated with pricing basis, or unknown with
 * a reason). A provider that reports no settled charge is NEVER recorded as a
 * verified `cost: 0`.
 */
export const SpecStageProvenanceSchema = z.strictObject({
  provider: z.string().min(1),
  model: z.string().min(1),
  outputMode: z.string().min(1),
  usage: z.strictObject({
    cost: z.number().nonnegative(),
    costKnown: z.boolean(),
    costEvidence: CostEvidenceSchema,
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    reasoningTokens: z.number().int().nonnegative(),
  }),
});
export type SpecStageProvenance = z.infer<typeof SpecStageProvenanceSchema>;

export const SPEC_STAGE_V2_SCHEMA_VERSION = "2.0.0" as const;

export const SpecStageV2ResultSchema = z.discriminatedUnion("status", [
  z.strictObject({
    schemaVersion: z.literal(SPEC_STAGE_V2_SCHEMA_VERSION),
    kind: z.literal("spec-stage-v2-result"),
    status: z.literal("spec-ready"),
    request: RequestRecordSchema,
    gameSpec: GameSpecV2Schema,
    intentLedger: IntentLedgerV2Schema,
    gameSpecSha256: z.string().regex(/^[0-9a-f]{64}$/u),
    provenance: SpecStageProvenanceSchema,
  }),
  z.strictObject({
    schemaVersion: z.literal(SPEC_STAGE_V2_SCHEMA_VERSION),
    kind: z.literal("spec-stage-v2-result"),
    status: z.literal("needs-clarification"),
    request: RequestRecordSchema,
    partialSpec: PartialGameSpecV2Schema,
    // §四: the partial ledger giving every partial-spec statement provenance,
    // hash-bound to the request and the partial spec.
    partialIntentLedger: PartialIntentLedgerV2Schema,
    // §四: reproducible integrity bindings so a second round cannot silently
    // drift from what the first round confirmed.
    partialSpecSha256: z.string().regex(/^[0-9a-f]{64}$/u),
    requestSha256: z.string().regex(/^[0-9a-f]{64}$/u),
    // §四: a stable id for this clarification round and a context hash covering
    // {request, partialSpec, partialLedger, questions} — the user's answer must
    // reference both so the second round is a verifiable continuation.
    clarificationId: ClarificationIdSchema,
    clarificationContextSha256: z.string().regex(/^[0-9a-f]{64}$/u),
    questions: ClarificationQuestionsSchema,
    provenance: SpecStageProvenanceSchema,
  }),
  z.strictObject({
    schemaVersion: z.literal(SPEC_STAGE_V2_SCHEMA_VERSION),
    kind: z.literal("spec-stage-v2-result"),
    status: z.literal("bounded-failure"),
    request: RequestRecordSchema,
    failure: SpecAgentFailureSchema,
    // Provenance is optional: an environment failure (e.g. missing credential)
    // never reaches the model, so there is nothing to attribute.
    provenance: SpecStageProvenanceSchema.optional(),
  }),
]);
export type SpecStageV2Result = z.infer<typeof SpecStageV2ResultSchema>;
export type SpecStageV2Success = Extract<
  SpecStageV2Result,
  { status: "spec-ready" }
>;
export type SpecStageV2Clarification = Extract<
  SpecStageV2Result,
  { status: "needs-clarification" }
>;
export type SpecStageV2Failure = Extract<
  SpecStageV2Result,
  { status: "bounded-failure" }
>;

export function parseSpecStageV2Result(input: unknown): SpecStageV2Result {
  return SpecStageV2ResultSchema.parse(input);
}

export function toSpecAgentModelOutputJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(SpecAgentModelOutputSchema, {
    target: "draft-2020-12",
    unrepresentable: "throw",
  }) as Record<string, unknown>;
}
