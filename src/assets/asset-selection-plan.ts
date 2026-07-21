import { z } from "zod";

import {
  ASSET_CATEGORIES,
  IMAGE_FORMATS,
  parseAssetCatalog,
} from "./asset-catalog.js";
import { DEFAULT_ASSET_LICENSE_POLICY } from "./asset-license-policy.js";
import {
  applyAssetQueryGrounding,
  type AssetQueryGrounding,
} from "./asset-query-grounding.js";
import { rankAssets } from "./asset-retrieval.js";
import {
  parseShooterGameSpec,
  type ShooterGameSpec,
} from "../requirements/shooter-game-spec.js";

const SafeIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const Sha256Schema = z.string().regex(/^[0-9a-f]{64}$/);

const RelativePathSchema = z
  .string()
  .min(1)
  .max(320)
  .refine(
    (value) =>
      !value.startsWith("/") &&
      !value.includes("\\") &&
      !value.split("/").includes("..") &&
      !/^[a-zA-Z]:/.test(value),
    "must be a safe forward-slash relative path",
  );

const RankingBreakdownSchema = z.strictObject({
  theme: z.number().int().nonnegative(),
  visualStyle: z.number().int().nonnegative(),
  tags: z.number().int().nonnegative(),
  palette: z.number().int().nonnegative(),
});

const AssetSelectionSchema = z.strictObject({
  queryId: SafeIdSchema,
  category: z.enum(ASSET_CATEGORIES),
  selectedAssetId: SafeIdSchema,
  score: z.number().int().positive(),
  breakdown: RankingBreakdownSchema,
  rationale: z.array(z.string().min(1).max(80)).min(1).max(4),
  excludedCandidateCount: z.number().int().nonnegative(),
  sourceFile: z.strictObject({
    path: RelativePathSchema,
    sha256: Sha256Schema,
    format: z.enum(IMAGE_FORMATS),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    byteSize: z.number().int().positive(),
    hasTransparency: z.boolean(),
  }),
  provenance: z.strictObject({
    siteName: z.string().min(1).max(120),
    author: z.string().min(1).max(160),
    sourcePageUrl: z.url().refine((value) => value.startsWith("https://")),
    licenseId: z.enum(["CC0-1.0", "CC-BY-4.0"]),
    attributionText: z.string().min(1).max(1_000),
  }),
  materialization: z.strictObject({
    workspacePath: RelativePathSchema.refine(
      (value) =>
        value.startsWith(
          "game-template/vertical-shooter/public/assets/catalog/",
        ),
      "must target the fixed template public asset directory",
    ),
    runtimeUrl: z
      .string()
      .regex(
        /^\/assets\/catalog\/[a-z0-9]+(?:-[a-z0-9]+)*\.(?:png|webp|jpeg|svg)$/,
      ),
  }),
});

export const AssetSelectionPlanSchema = z
  .strictObject({
    schemaVersion: z.literal("1.0.0"),
    policyId: z.literal("phase-2-baseline"),
    catalog: z.strictObject({
      catalogId: SafeIdSchema,
      path: z.literal("assets/corpus/catalog.json"),
      sha256: Sha256Schema,
    }),
    selections: z.array(AssetSelectionSchema).min(1).max(64),
  })
  .superRefine((plan, context) => {
    const queryIds = new Set<string>();
    const assetPaths = new Map<string, string>();
    plan.selections.forEach((selection, index) => {
      if (queryIds.has(selection.queryId)) {
        context.addIssue({
          code: "custom",
          message: `duplicate asset query selection: ${selection.queryId}`,
          path: ["selections", index, "queryId"],
        });
      }
      queryIds.add(selection.queryId);

      const previousPath = assetPaths.get(selection.selectedAssetId);
      if (
        previousPath !== undefined &&
        previousPath !== selection.materialization.workspacePath
      ) {
        context.addIssue({
          code: "custom",
          message: `one asset must use one materialization path: ${selection.selectedAssetId}`,
          path: ["selections", index, "materialization", "workspacePath"],
        });
      }
      assetPaths.set(
        selection.selectedAssetId,
        selection.materialization.workspacePath,
      );
    });
  });

export type AssetSelectionPlan = z.infer<typeof AssetSelectionPlanSchema>;

export class AssetSelectionPlanningError extends Error {
  constructor(readonly queryId: string) {
    super(`No positively ranked reviewed asset satisfies query: ${queryId}`);
    this.name = "AssetSelectionPlanningError";
  }
}

export type AssetSelectionPlannerOptions = Readonly<{
  minimumScore?: number;
  grounding?: AssetQueryGrounding;
}>;

type AssetQuery = ShooterGameSpec["assetQueries"][number];

function retrievalQuery(query: AssetQuery) {
  return {
    ...query,
    allowedFormats: [...IMAGE_FORMATS],
    minimumWidth: 1,
    minimumHeight: 1,
    limit: 50,
  };
}

export function planAssetSelections(
  rawSpec: unknown,
  rawCatalog: unknown,
  catalogSha256: string,
  options: AssetSelectionPlannerOptions = {},
): AssetSelectionPlan {
  const spec = parseShooterGameSpec(rawSpec);
  const catalog = parseAssetCatalog(rawCatalog);
  const parsedCatalogSha256 = Sha256Schema.parse(catalogSha256);
  const selectionSpec =
    options.grounding === undefined
      ? spec
      : applyAssetQueryGrounding(
          spec,
          catalog,
          parsedCatalogSha256,
          options.grounding,
        );
  const minimumScore = options.minimumScore ?? 1;
  if (!Number.isSafeInteger(minimumScore) || minimumScore < 1) {
    throw new Error("minimumScore must be a positive safe integer");
  }
  const recordsById = new Map(
    catalog.records.map((record) => [record.assetId, record]),
  );

  const selections = selectionSpec.assetQueries.map((query) => {
    const result = rankAssets(
      retrievalQuery(query),
      catalog.records,
      DEFAULT_ASSET_LICENSE_POLICY,
    );
    const best = result.ranked.find(
      (candidate) =>
        candidate.score >= minimumScore &&
        candidate.breakdown.theme > 0 &&
        candidate.breakdown.visualStyle > 0,
    );
    if (
      best === undefined ||
      best.score < minimumScore ||
      best.breakdown.theme === 0 ||
      best.breakdown.visualStyle === 0
    ) {
      throw new AssetSelectionPlanningError(query.id);
    }
    const record = recordsById.get(best.assetId);
    if (record === undefined || record.source.sourcePageUrl === undefined) {
      throw new AssetSelectionPlanningError(query.id);
    }
    const extension = record.sourceFile.format;
    const workspacePath =
      `game-template/vertical-shooter/public/assets/catalog/` +
      `${record.assetId}.${extension}`;
    return {
      queryId: query.id,
      category: query.category,
      selectedAssetId: record.assetId,
      score: best.score,
      breakdown: best.breakdown,
      rationale: [...best.rationale],
      excludedCandidateCount: result.excluded.length,
      sourceFile: { ...record.sourceFile },
      provenance: {
        siteName: record.source.siteName,
        author: record.source.author,
        sourcePageUrl: record.source.sourcePageUrl,
        licenseId: record.source.license.licenseId,
        attributionText: record.source.license.attributionText,
      },
      materialization: {
        workspacePath,
        runtimeUrl: `/assets/catalog/${record.assetId}.${extension}`,
      },
    };
  });

  return AssetSelectionPlanSchema.parse({
    schemaVersion: "1.0.0",
    policyId: DEFAULT_ASSET_LICENSE_POLICY.policyId,
    catalog: {
      catalogId: catalog.catalogId,
      path: "assets/corpus/catalog.json",
      sha256: parsedCatalogSha256,
    },
    selections,
  });
}

export function parseAssetSelectionPlan(input: unknown): AssetSelectionPlan {
  return AssetSelectionPlanSchema.parse(input);
}
