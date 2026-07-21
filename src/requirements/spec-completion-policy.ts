import { createHash } from "node:crypto";

import { z } from "zod";

import {
  AssetQuerySchema,
  parseShooterGameSpec,
  type AssetQuery,
  type ShooterGameSpec,
} from "./shooter-game-spec.js";

const Sha256Schema = z.string().regex(/^[0-9a-f]{64}$/u);
const CompletionRuleSchema = z.enum([
  "add-required-background-v1",
  "add-required-enemy-projectile-v1",
]);

const SpecCompletionDecisionSchema = z.strictObject({
  field: z.literal("assetQueries"),
  action: z.literal("added"),
  queryId: z.string().min(1).max(64),
  ruleId: CompletionRuleSchema,
  reason: z.string().min(1).max(320),
  derivedValue: AssetQuerySchema,
});

export const SpecCompletionArtifactSchema = z.strictObject({
  schemaVersion: z.literal("1.0.0"),
  policyId: z.literal("vertical-shooter-defaults-v1"),
  sourceSpec: z.strictObject({
    schemaVersion: z.literal("1.0.0"),
    sha256: Sha256Schema,
  }),
  completedSpec: z.strictObject({
    schemaVersion: z.literal("1.0.0"),
    sha256: Sha256Schema,
  }),
  decisions: z.array(SpecCompletionDecisionSchema).max(2),
});

export type SpecCompletionArtifact = z.infer<
  typeof SpecCompletionArtifactSchema
>;

export type SpecCompletionResult = Readonly<{
  sourceSpec: ShooterGameSpec;
  completedSpec: ShooterGameSpec;
  artifact: SpecCompletionArtifact;
}>;

const THEME_PREFERENCE = [
  "space",
  "science fiction",
  "arcade",
  "battle",
  "energy",
] as const;
const BACKGROUND_STYLE_PREFERENCE = [
  "pixel-art",
  "retro",
  "vector",
  "cartoon",
  "clean",
  "raster",
] as const;

function canonicalSpecJson(rawSpec: unknown): string {
  return `${JSON.stringify(parseShooterGameSpec(rawSpec), null, 2)}\n`;
}

export function sha256CompletedShooterGameSpec(rawSpec: unknown): string {
  return createHash("sha256")
    .update(canonicalSpecJson(rawSpec), "utf8")
    .digest("hex");
}

function normalize(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en-US");
}

function countOccurrences(
  values: readonly string[],
  candidate: string,
): number {
  return values.reduce(
    (count, value) => count + (normalize(value).includes(candidate) ? 1 : 0),
    0,
  );
}

function dominantTheme(spec: ShooterGameSpec): string {
  const values = [spec.theme, ...spec.assetQueries.map((query) => query.theme)];
  return (
    [...THEME_PREFERENCE]
      .map((value, index) => ({
        value,
        index,
        count: countOccurrences(values, value),
      }))
      .sort(
        (left, right) => right.count - left.count || left.index - right.index,
      )
      .find((entry) => entry.count > 0)?.value ?? "space"
  );
}

function dominantStyles(spec: ShooterGameSpec): string[] {
  const values = [
    ...spec.visualStyle,
    ...spec.assetQueries.flatMap((query) => query.visualStyle),
  ];
  const selected = [...BACKGROUND_STYLE_PREFERENCE]
    .map((value, index) => ({
      value,
      index,
      count: values.filter((entry) => normalize(entry) === value).length,
    }))
    .filter((entry) => entry.count > 0)
    .sort((left, right) => right.count - left.count || left.index - right.index)
    .slice(0, 2)
    .map((entry) => entry.value);
  return selected.length > 0 ? selected : ["clean"];
}

function uniqueId(spec: ShooterGameSpec, base: string): string {
  const ids = new Set(spec.assetQueries.map((query) => query.id));
  if (!ids.has(base)) return base;
  for (let suffix = 2; suffix <= 99; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if (!ids.has(candidate)) return candidate;
  }
  throw new SpecCompletionError(`No safe derived ID remains for ${base}.`);
}

function backgroundQuery(spec: ShooterGameSpec): AssetQuery {
  return AssetQuerySchema.parse({
    id: uniqueId(spec, "default-background"),
    category: "background",
    theme: dominantTheme(spec),
    visualStyle: dominantStyles(spec),
    tags: ["background", "stars"],
    preferredColors: [],
    requiresTransparency: false,
  });
}

function enemyProjectileQuery(spec: ShooterGameSpec): AssetQuery {
  return AssetQuerySchema.parse({
    id: uniqueId(spec, "default-enemy-projectile"),
    category: "enemy-projectile",
    theme: "energy",
    visualStyle: ["glow"],
    tags: ["projectile", "enemy"],
    preferredColors: [spec.bulletPatterns[0]!.color],
    requiresTransparency: true,
  });
}

export class SpecCompletionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpecCompletionError";
  }
}

export function completeShooterGameSpec(
  rawSpec: unknown,
): SpecCompletionResult {
  const sourceSpec = parseShooterGameSpec(rawSpec);
  const completedDraft = structuredClone(sourceSpec);
  const decisions: SpecCompletionArtifact["decisions"] = [];

  if (
    !completedDraft.assetQueries.some(
      (query) => query.category === "background",
    )
  ) {
    const derivedValue = backgroundQuery(completedDraft);
    completedDraft.assetQueries.push(derivedValue);
    decisions.push({
      field: "assetQueries",
      action: "added",
      queryId: derivedValue.id,
      ruleId: "add-required-background-v1",
      reason:
        "The user did not specify a catalog background; the Agent derived one from the dominant validated theme and visual styles.",
      derivedValue,
    });
  }

  if (
    !completedDraft.assetQueries.some(
      (query) => query.category === "enemy-projectile",
    )
  ) {
    const derivedValue = enemyProjectileQuery(completedDraft);
    completedDraft.assetQueries.push(derivedValue);
    decisions.push({
      field: "assetQueries",
      action: "added",
      queryId: derivedValue.id,
      ruleId: "add-required-enemy-projectile-v1",
      reason:
        "The user did not specify enemy-projectile artwork; the Agent derived the fixed catalog role from validated bullet-pattern evidence.",
      derivedValue,
    });
  }

  const completedSpec = parseShooterGameSpec(completedDraft);
  const artifact = SpecCompletionArtifactSchema.parse({
    schemaVersion: "1.0.0",
    policyId: "vertical-shooter-defaults-v1",
    sourceSpec: {
      schemaVersion: sourceSpec.schemaVersion,
      sha256: sha256CompletedShooterGameSpec(sourceSpec),
    },
    completedSpec: {
      schemaVersion: completedSpec.schemaVersion,
      sha256: sha256CompletedShooterGameSpec(completedSpec),
    },
    decisions,
  });
  return { sourceSpec, completedSpec, artifact };
}

export function verifySpecCompletion(
  rawSourceSpec: unknown,
  rawCompletedSpec: unknown,
  rawArtifact: unknown,
): SpecCompletionResult {
  const expected = completeShooterGameSpec(rawSourceSpec);
  const completedSpec = parseShooterGameSpec(rawCompletedSpec);
  const artifact = SpecCompletionArtifactSchema.parse(rawArtifact);
  if (
    artifact.sourceSpec.sha256 !== expected.artifact.sourceSpec.sha256 ||
    artifact.completedSpec.sha256 !== expected.artifact.completedSpec.sha256 ||
    sha256CompletedShooterGameSpec(completedSpec) !==
      expected.artifact.completedSpec.sha256 ||
    JSON.stringify(artifact.decisions) !==
      JSON.stringify(expected.artifact.decisions)
  ) {
    throw new SpecCompletionError(
      "Spec completion evidence does not match the deterministic policy.",
    );
  }
  return { ...expected, completedSpec };
}
