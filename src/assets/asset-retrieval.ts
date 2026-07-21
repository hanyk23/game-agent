import { z } from "zod";

import {
  ASSET_CATEGORIES,
  AssetCatalogRecordSchema,
  IMAGE_FORMATS,
  type AssetCatalogRecord,
} from "./asset-catalog.js";
import {
  DEFAULT_ASSET_LICENSE_POLICY,
  evaluateAssetLicense,
  type AssetLicensePolicy,
} from "./asset-license-policy.js";

const AssetRetrievalQuerySchema = z.strictObject({
  id: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  category: z.enum(ASSET_CATEGORIES),
  theme: z.string().min(1).max(120),
  visualStyle: z.array(z.string().min(1).max(60)).min(1).max(8),
  tags: z.array(z.string().min(1).max(40)).max(16).default([]),
  preferredColors: z
    .array(z.string().regex(/^#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?$/))
    .max(8)
    .default([]),
  requiresTransparency: z.boolean().default(false),
  allowedFormats: z
    .array(z.enum(IMAGE_FORMATS))
    .min(1)
    .default([...IMAGE_FORMATS]),
  minimumWidth: z.number().int().min(1).max(32_768).default(1),
  minimumHeight: z.number().int().min(1).max(32_768).default(1),
  limit: z.number().int().min(1).max(50).default(10),
});

export type AssetRetrievalQuery = z.infer<typeof AssetRetrievalQuerySchema>;

export type AssetRankingBreakdown = Readonly<{
  theme: number;
  visualStyle: number;
  tags: number;
  palette: number;
}>;

export type RankedAsset = Readonly<{
  assetId: string;
  score: number;
  breakdown: AssetRankingBreakdown;
  rationale: readonly string[];
}>;

export type ExcludedAsset = Readonly<{
  assetId: string;
  stage: "license" | "technical";
  reasons: readonly string[];
}>;

export type AssetRetrievalResult = Readonly<{
  queryId: string;
  ranked: readonly RankedAsset[];
  excluded: readonly ExcludedAsset[];
}>;

function normalize(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en-US");
}

function tokens(values: readonly string[]): Set<string> {
  return new Set(
    values
      .flatMap((value) => normalize(value).split(/[^\p{L}\p{N}]+/u))
      .filter((value) => value.length > 0),
  );
}

function intersectionCount(left: Set<string>, right: Set<string>): number {
  let count = 0;
  left.forEach((value) => {
    if (right.has(value)) {
      count += 1;
    }
  });
  return count;
}

function scoreRecord(
  query: AssetRetrievalQuery,
  record: AssetCatalogRecord,
): RankedAsset {
  const queryTheme = tokens([query.theme]);
  const recordTheme = tokens([
    ...record.themes,
    record.description,
    ...record.tags,
  ]);
  const queryStyles = new Set(query.visualStyle.map(normalize));
  const recordStyles = new Set(record.visualStyles.map(normalize));
  const queryTags = new Set(query.tags.map(normalize));
  const recordTags = new Set(record.tags.map(normalize));
  const queryColors = new Set(
    query.preferredColors.map((color) => color.toLowerCase()),
  );
  const recordColors = new Set(
    record.palette.map((color) => color.toLowerCase()),
  );

  const breakdown: AssetRankingBreakdown = {
    theme: Math.min(intersectionCount(queryTheme, recordTheme) * 20, 60),
    visualStyle: Math.min(
      intersectionCount(queryStyles, recordStyles) * 20,
      40,
    ),
    tags: Math.min(intersectionCount(queryTags, recordTags) * 10, 30),
    palette: Math.min(intersectionCount(queryColors, recordColors) * 4, 12),
  };

  const rationale = Object.entries(breakdown)
    .filter(([, value]) => value > 0)
    .map(([field, value]) => `${field}:${value}`);

  return {
    assetId: record.assetId,
    score: Object.values(breakdown).reduce((sum, value) => sum + value, 0),
    breakdown,
    rationale,
  };
}

export function rankAssets(
  rawQuery: unknown,
  rawRecords: readonly unknown[],
  policy: AssetLicensePolicy = DEFAULT_ASSET_LICENSE_POLICY,
): AssetRetrievalResult {
  const query = AssetRetrievalQuerySchema.parse(rawQuery);
  const records = rawRecords.map((record) =>
    AssetCatalogRecordSchema.parse(record),
  );
  const ranked: RankedAsset[] = [];
  const excluded: ExcludedAsset[] = [];

  records.forEach((record) => {
    const licenseDecision = evaluateAssetLicense(record, policy);
    if (licenseDecision.decision !== "eligible") {
      excluded.push({
        assetId: record.assetId,
        stage: "license",
        reasons: [licenseDecision.decision, ...licenseDecision.reasons],
      });
      return;
    }

    const technicalReasons: string[] = [];
    if (record.category !== query.category) {
      technicalReasons.push("category-mismatch");
    }
    if (
      query.requiresTransparency &&
      !record.sourceFile.hasTransparency &&
      !record.derivedFiles.some((file) => file.hasTransparency)
    ) {
      technicalReasons.push("transparency-required");
    }
    const compatibleFiles = [record.sourceFile, ...record.derivedFiles].filter(
      (file) => query.allowedFormats.includes(file.format),
    );
    if (compatibleFiles.length === 0) {
      technicalReasons.push("format-mismatch");
    } else if (
      !compatibleFiles.some(
        (file) =>
          file.width >= query.minimumWidth &&
          file.height >= query.minimumHeight,
      )
    ) {
      technicalReasons.push("dimensions-too-small");
    }

    if (technicalReasons.length > 0) {
      excluded.push({
        assetId: record.assetId,
        stage: "technical",
        reasons: technicalReasons,
      });
      return;
    }

    ranked.push(scoreRecord(query, record));
  });

  ranked.sort(
    (left, right) =>
      right.score - left.score || left.assetId.localeCompare(right.assetId),
  );
  excluded.sort((left, right) => left.assetId.localeCompare(right.assetId));

  return {
    queryId: query.id,
    ranked: ranked.slice(0, query.limit),
    excluded,
  };
}

export function parseAssetRetrievalQuery(input: unknown): AssetRetrievalQuery {
  return AssetRetrievalQuerySchema.parse(input);
}
