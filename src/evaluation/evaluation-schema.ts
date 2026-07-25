import { z } from "zod";

import { ShooterGameSpecSchema } from "../requirements/shooter-game-spec.js";

const CaseIdSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const RelativeEvidencePathSchema = z
  .string()
  .min(1)
  .max(500)
  .superRefine((value, context) => {
    const normalized = value.replaceAll("\\", "/");
    if (
      normalized.startsWith("/") ||
      /^[a-zA-Z]:/.test(normalized) ||
      normalized.split("/").includes("..")
    ) {
      context.addIssue({
        code: "custom",
        message: "evidence paths must remain project-relative",
      });
    }
  });

const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);

export const EvaluationFailureCategorySchema = z.enum([
  "schema-invalid",
  "planning-failed",
  "composition-failed",
  "build-failed",
  "browser-verification-failed",
  "packaging-failed",
  "internal-error",
]);

const EvaluationStageSchema = z.enum([
  "spec-validation",
  "planning",
  "composition",
  "build",
  "browser",
  "repair",
  "packaging",
  "internal",
]);

export const EvaluationDifferentiatorsSchema = z.strictObject({
  theme: z.string().min(1).max(200),
  difficulty: z.enum(["easy", "medium", "hard"]),
  waveStructure: z.string().min(1).max(300),
  bossPatterns: z.array(z.string().min(1).max(80)).min(1).max(24),
  scoring: z.string().min(1).max(300),
  winCondition: z.string().min(1).max(120),
  loseCondition: z.string().min(1).max(120),
});

export const EvaluationCaseDefinitionSchema = z.strictObject({
  caseId: CaseIdSchema,
  request: z.string().min(1).max(2_000),
  inputKind: z.literal("local-spec"),
  resourceProfile: z.enum(["balanced", "desktop", "mobile"]),
  enableAssetSelection: z.boolean(),
  browserGate: z.enum(["comprehensive-v1", "case-aware-v1"]),
  expectedDifferentiators: EvaluationDifferentiatorsSchema,
  spec: ShooterGameSpecSchema,
});

export const EvaluationBatchDefinitionSchema = z
  .strictObject({
    schemaVersion: z.literal("1.0.0"),
    batchId: CaseIdSchema,
    description: z.string().min(1).max(1_000),
    paidModelCallsAllowed: z.literal(false),
    executionMode: z.literal("sequential"),
    cases: z.array(EvaluationCaseDefinitionSchema).min(3).max(5),
  })
  .superRefine((definition, context) => {
    const seen = new Set<string>();
    for (const [index, evaluationCase] of definition.cases.entries()) {
      if (seen.has(evaluationCase.caseId)) {
        context.addIssue({
          code: "custom",
          message: `duplicate evaluation case id: ${evaluationCase.caseId}`,
          path: ["cases", index, "caseId"],
        });
      }
      seen.add(evaluationCase.caseId);
    }
  });

const GateOutcomeSchema = z.enum(["not-run", "passed", "failed"]);

const EvaluationGateResultsSchema = z.strictObject({
  specValidation: GateOutcomeSchema,
  planning: GateOutcomeSchema,
  composition: GateOutcomeSchema,
  build: GateOutcomeSchema,
  desktopBrowser: GateOutcomeSchema,
  mobileBrowser: GateOutcomeSchema,
  packaging: GateOutcomeSchema,
});

const RunStateSchema = z.enum([
  "received",
  "spec_generated",
  "spec_validated",
  "planned",
  "composed",
  "code_adjusted",
  "built",
  "runtime_checked",
  "play_checked",
  "repairing",
  "packaged",
  "failed",
  "cancelled",
  "repair_budget_exhausted",
]);

const ArtifactHashesSchema = z.strictObject({
  spec: Sha256Schema.optional(),
  plan: Sha256Schema.optional(),
  assetQueryGrounding: Sha256Schema.optional(),
  assetSelection: Sha256Schema.optional(),
  workspace: Sha256Schema.optional(),
  runtimeConfig: Sha256Schema.optional(),
  buildLog: Sha256Schema.optional(),
  package: Sha256Schema.optional(),
  verification: Sha256Schema.optional(),
  deliveryManifest: Sha256Schema.optional(),
  delivery: Sha256Schema.optional(),
});

export const EvaluationCaseReportSchema = z.strictObject({
  reportVersion: z.literal("1.0.0"),
  caseId: CaseIdSchema,
  request: z.string().min(1).max(2_000),
  inputKind: z.literal("local-spec"),
  expectedDifferentiators: EvaluationDifferentiatorsSchema,
  startedAt: z.iso.datetime({ offset: true }),
  completedAt: z.iso.datetime({ offset: true }),
  elapsedMs: z.number().int().nonnegative(),
  status: z.enum(["passed", "failed"]),
  runId: z.string().uuid().nullable(),
  runState: RunStateSchema.nullable(),
  runDirectory: RelativeEvidencePathSchema.nullable(),
  diskBytes: z.number().int().nonnegative(),
  gates: EvaluationGateResultsSchema,
  failure: z
    .strictObject({
      stage: EvaluationStageSchema,
      category: EvaluationFailureCategorySchema,
      code: z.string().min(1).max(100),
      message: z.string().min(1).max(1_000),
    })
    .nullable(),
  repair: z.strictObject({
    maximumRounds: z.number().int().min(0).max(10),
    usedRounds: z.number().int().min(0).max(10),
    attempted: z.boolean(),
    outcome: z.enum([
      "not-needed",
      "passed",
      "failed",
      "not-attempted-no-bounded-proposal",
    ]),
  }),
  manualIntervention: z.strictObject({
    required: z.boolean(),
    count: z.number().int().nonnegative(),
  }),
  modelUsage: z.strictObject({
    requestCount: z.number().int().nonnegative(),
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    cost: z.strictObject({
      currency: z.literal("CNY"),
      amount: z.number().nonnegative(),
    }),
  }),
  evidence: z.strictObject({
    manifestPath: RelativeEvidencePathSchema.nullable(),
    browserReportPath: RelativeEvidencePathSchema.nullable(),
    desktopScreenshotPath: RelativeEvidencePathSchema.nullable(),
    mobileScreenshotPath: RelativeEvidencePathSchema.nullable(),
    artifactHashes: ArtifactHashesSchema,
  }),
});

const FailureCountSchema = z.strictObject({
  category: EvaluationFailureCategorySchema,
  count: z.number().int().positive(),
});

export const EvaluationBatchReportSchema = z.strictObject({
  reportVersion: z.literal("1.0.0"),
  definitionVersion: z.literal("1.0.0"),
  definitionSha256: Sha256Schema,
  batchId: CaseIdSchema,
  batchRunId: z.string().uuid(),
  startedAt: z.iso.datetime({ offset: true }),
  completedAt: z.iso.datetime({ offset: true }),
  executionMode: z.literal("sequential"),
  paidModelCallsAllowed: z.literal(false),
  cases: z.array(EvaluationCaseReportSchema).min(3).max(5),
  aggregate: z.strictObject({
    totalCases: z.number().int().min(3).max(5),
    passedCases: z.number().int().nonnegative(),
    failedCases: z.number().int().nonnegative(),
    packagedCases: z.number().int().nonnegative(),
    browserViewportPasses: z.number().int().nonnegative(),
    elapsedMs: z.number().int().nonnegative(),
    diskBytes: z.number().int().nonnegative(),
    repairRounds: z.number().int().nonnegative(),
    manualInterventions: z.number().int().nonnegative(),
    modelRequests: z.number().int().nonnegative(),
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    cost: z.strictObject({
      currency: z.literal("CNY"),
      amount: z.number().nonnegative(),
    }),
    failureCounts: z.array(FailureCountSchema),
  }),
  firstEvidenceBackedGap: z
    .strictObject({
      caseId: CaseIdSchema,
      stage: EvaluationStageSchema,
      category: EvaluationFailureCategorySchema,
      code: z.string().min(1).max(100),
      summary: z.string().min(1).max(1_000),
    })
    .nullable(),
  missingFinalAcceptanceDecisions: z.array(z.string().min(1).max(300)),
});

export type EvaluationBatchDefinition = z.infer<
  typeof EvaluationBatchDefinitionSchema
>;
export type EvaluationCaseDefinition = z.infer<
  typeof EvaluationCaseDefinitionSchema
>;
export type EvaluationCaseReport = z.infer<typeof EvaluationCaseReportSchema>;
export type EvaluationBatchReport = z.infer<typeof EvaluationBatchReportSchema>;
