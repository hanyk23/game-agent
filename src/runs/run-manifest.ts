import { randomUUID } from "node:crypto";

import { z } from "zod";

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

const RelativeArtifactPathSchema = z
  .string()
  .min(1)
  .superRefine((value, context) => {
    const normalized = value.replaceAll("\\", "/");
    if (
      normalized.startsWith("/") ||
      /^[a-zA-Z]:/.test(normalized) ||
      normalized.split("/").includes("..")
    ) {
      context.addIssue({
        code: "custom",
        message:
          "artifact paths must be relative and remain inside the run directory",
      });
    }
  });

const Sha256Schema = z
  .string()
  .regex(/^[a-f0-9]{64}$/, "artifact hashes must be lowercase SHA-256 hex");

const ArtifactEvidenceSchema = z.strictObject({
  path: RelativeArtifactPathSchema,
  sha256: Sha256Schema,
});

const ResourceBudgetAdjustmentSchema = z.strictObject({
  field: z.enum([
    "maxEnemyBullets",
    "maxPlayerBullets",
    "maxEnemies",
    "maxPickups",
    "maxEffects",
    "maxEnemyBulletSpawnsPerSecond",
  ]),
  requested: z.number().int().nonnegative(),
  effective: z.number().int().nonnegative(),
  reason: z.literal("device-profile-cap"),
});

export const RunManifestSchema = z.strictObject({
  manifestVersion: z.enum(["1.1.0", "1.2.0", "1.3.0", "1.4.0", "1.5.0"]),
  runId: z.string().uuid(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
  state: RunStateSchema,
  request: z.strictObject({
    prompt: z.string().min(1).max(10_000),
  }),
  repairBudget: z.strictObject({
    maximumRounds: z.number().int().min(0).max(10),
    usedRounds: z.number().int().min(0).max(10),
  }),
  artifacts: z
    .strictObject({
      spec: ArtifactEvidenceSchema.optional(),
      sourceSpec: ArtifactEvidenceSchema.optional(),
      specIntentLedger: ArtifactEvidenceSchema.optional(),
      playabilitySpec: ArtifactEvidenceSchema.optional(),
      specPlayabilityCompletion: ArtifactEvidenceSchema.optional(),
      specCompletion: ArtifactEvidenceSchema.optional(),
      plan: ArtifactEvidenceSchema.optional(),
      assetQueryGrounding: ArtifactEvidenceSchema.optional(),
      assetSelection: ArtifactEvidenceSchema.optional(),
      workspace: ArtifactEvidenceSchema.optional(),
      runtimeConfig: ArtifactEvidenceSchema.optional(),
      buildLog: ArtifactEvidenceSchema.optional(),
      verification: ArtifactEvidenceSchema.optional(),
      package: ArtifactEvidenceSchema.optional(),
      deliveryManifest: ArtifactEvidenceSchema.optional(),
      delivery: ArtifactEvidenceSchema.optional(),
    })
    .default({}),
  composition: z
    .strictObject({
      resourceProfile: z.enum(["balanced", "desktop", "mobile"]),
      budgetAdjustments: z.array(ResourceBudgetAdjustmentSchema),
    })
    .optional(),
  build: z
    .strictObject({
      tool: z.literal("vite"),
      exitCode: z.literal(0),
    })
    .optional(),
  opencode: z
    .strictObject({
      serverVersion: z.string().min(1),
      serverUrl: z.url(),
      sessionId: z.string().min(1).optional(),
      model: z.string().min(1).optional(),
    })
    .optional(),
  transitions: z.array(
    z.strictObject({
      from: RunStateSchema.nullable(),
      to: RunStateSchema,
      at: z.iso.datetime({ offset: true }),
      detail: z.string().min(1).max(1_000),
    }),
  ),
});

export type RunState = z.infer<typeof RunStateSchema>;
export type RunManifest = z.infer<typeof RunManifestSchema>;

const AllowedTransitions: Readonly<Record<RunState, readonly RunState[]>> = {
  received: ["spec_generated", "failed", "cancelled"],
  spec_generated: ["spec_validated", "failed", "cancelled"],
  spec_validated: ["planned", "failed", "cancelled"],
  planned: ["composed", "failed", "cancelled"],
  composed: ["code_adjusted", "built", "failed", "cancelled"],
  code_adjusted: ["built", "failed", "cancelled"],
  built: [
    "runtime_checked",
    "repairing",
    "repair_budget_exhausted",
    "failed",
    "cancelled",
  ],
  runtime_checked: [
    "play_checked",
    "repairing",
    "repair_budget_exhausted",
    "failed",
    "cancelled",
  ],
  play_checked: [
    "packaged",
    "repairing",
    "repair_budget_exhausted",
    "failed",
    "cancelled",
  ],
  repairing: [
    "spec_validated",
    "composed",
    "code_adjusted",
    "built",
    "runtime_checked",
    "play_checked",
    "repair_budget_exhausted",
    "failed",
    "cancelled",
  ],
  packaged: [],
  failed: [],
  cancelled: [],
  repair_budget_exhausted: [],
};

export type CreateRunManifestOptions = {
  now?: () => Date;
  runId?: string;
  maximumRepairRounds?: number;
};

export function createRunManifest(
  prompt: string,
  options: CreateRunManifestOptions = {},
): RunManifest {
  const now = options.now?.() ?? new Date();
  const at = now.toISOString();

  return RunManifestSchema.parse({
    manifestVersion: "1.5.0",
    runId: options.runId ?? randomUUID(),
    createdAt: at,
    updatedAt: at,
    state: "received",
    request: { prompt },
    repairBudget: {
      maximumRounds: options.maximumRepairRounds ?? 3,
      usedRounds: 0,
    },
    artifacts: {},
    transitions: [
      {
        from: null,
        to: "received",
        at,
        detail: "Generation request accepted.",
      },
    ],
  });
}

export function transitionRunManifest(
  manifestInput: RunManifest,
  to: RunState,
  detail: string,
  now: Date = new Date(),
): RunManifest {
  const manifest = RunManifestSchema.parse(manifestInput);
  if (!AllowedTransitions[manifest.state].includes(to)) {
    throw new Error(`invalid run transition: ${manifest.state} -> ${to}`);
  }

  const usedRounds =
    to === "repairing" && manifest.state !== "repairing"
      ? manifest.repairBudget.usedRounds + 1
      : manifest.repairBudget.usedRounds;

  if (usedRounds > manifest.repairBudget.maximumRounds) {
    throw new Error("repair budget exhausted");
  }

  const at = now.toISOString();
  return RunManifestSchema.parse({
    ...manifest,
    updatedAt: at,
    state: to,
    repairBudget: {
      ...manifest.repairBudget,
      usedRounds,
    },
    transitions: [
      ...manifest.transitions,
      {
        from: manifest.state,
        to,
        at,
        detail,
      },
    ],
  });
}
