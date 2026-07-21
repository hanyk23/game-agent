import type {
  AssetCatalog,
  AssetCatalogRecord,
} from "../../src/assets/asset-catalog.js";
import type { AssetRetrievalQuery } from "../../src/assets/asset-retrieval.js";

type SyntheticRecordInput = Readonly<{
  assetId: string;
  hashCharacter: string;
  category: AssetCatalogRecord["category"];
  theme: string;
  visualStyles: string[];
  tags: string[];
  palette: string[];
  licenseId?: string;
  reviewStatus?: AssetCatalogRecord["review"]["status"];
  redistribution?: boolean;
}>;

function createSyntheticRecord(
  input: SyntheticRecordInput,
): AssetCatalogRecord {
  const reviewStatus = input.reviewStatus ?? "reviewed";
  const review =
    reviewStatus === "reviewed"
      ? {
          status: reviewStatus,
          reviewedBy: "fixture-reviewer",
          reviewedAt: "2026-07-15",
          notes: "Synthetic metadata fixture; no image was downloaded.",
        }
      : {
          status: reviewStatus,
          notes: "Synthetic metadata fixture awaiting review.",
        };

  return {
    assetId: input.assetId,
    mediaType: "image",
    category: input.category,
    subcategory: input.category,
    description: `Synthetic ${input.theme} fixture`,
    tags: input.tags,
    themes: [input.theme],
    visualStyles: input.visualStyles,
    palette: input.palette,
    source: {
      origin: "third-party",
      siteName: "Synthetic Fixture Registry",
      author: "Fixture Author",
      sourcePageUrl: `https://assets.example.invalid/${input.assetId}`,
      collectedAt: "2026-07-15",
      license: {
        licenseId: input.licenseId ?? "CC0-1.0",
        licenseName: input.licenseId ?? "CC0 1.0 Universal",
        termsUrl: "https://licenses.example.invalid/fixture",
        attributionText: `Fixture Author - ${input.assetId}`,
        permissions: {
          commercialUse: true,
          modification: true,
          redistribution: input.redistribution ?? true,
        },
      },
    },
    sourceFile: {
      path: `sources/${input.assetId}.png`,
      sha256: input.hashCharacter.repeat(64),
      format: "png",
      width: 512,
      height: 512,
      byteSize: 64_000,
      hasTransparency: input.category !== "background",
    },
    derivedFiles: [],
    review,
  };
}

export const SYNTHETIC_ASSET_CATALOG: AssetCatalog = {
  schemaVersion: "1.0.0",
  catalogId: "synthetic-retrieval-baseline",
  records: [
    createSyntheticRecord({
      assetId: "crane-ink-white",
      hashCharacter: "a",
      category: "player",
      theme: "white crane",
      visualStyles: ["ink-painting", "high-contrast"],
      tags: ["bird", "flying", "hero"],
      palette: ["#f5f5f5", "#111111"],
      licenseId: "CC-BY-4.0",
    }),
    createSyntheticRecord({
      assetId: "crane-pixel-blue",
      hashCharacter: "b",
      category: "player",
      theme: "blue crane",
      visualStyles: ["pixel-art"],
      tags: ["bird", "flying"],
      palette: ["#3366ff"],
    }),
    createSyntheticRecord({
      assetId: "spirit-ink-shadow",
      hashCharacter: "c",
      category: "enemy",
      theme: "corrupted shadow spirit",
      visualStyles: ["ink-painting"],
      tags: ["monster", "spirit"],
      palette: ["#333333"],
    }),
    createSyntheticRecord({
      assetId: "crane-ink-noncommercial",
      hashCharacter: "d",
      category: "player",
      theme: "white crane hero",
      visualStyles: ["ink-painting", "high-contrast"],
      tags: ["bird", "flying", "hero"],
      palette: ["#f5f5f5"],
      licenseId: "CC-BY-NC-4.0",
    }),
    createSyntheticRecord({
      assetId: "crane-ink-quarantined",
      hashCharacter: "e",
      category: "player",
      theme: "white crane hero",
      visualStyles: ["ink-painting"],
      tags: ["bird", "flying"],
      palette: ["#f5f5f5"],
      licenseId: "CC-BY-4.0",
      reviewStatus: "quarantined",
    }),
    createSyntheticRecord({
      assetId: "crane-ink-no-redistribution",
      hashCharacter: "f",
      category: "player",
      theme: "white crane hero",
      visualStyles: ["ink-painting"],
      tags: ["bird", "flying"],
      palette: ["#f5f5f5"],
      licenseId: "CC-BY-4.0",
      redistribution: false,
    }),
    createSyntheticRecord({
      assetId: "orb-ink-blue",
      hashCharacter: "0",
      category: "enemy-projectile",
      theme: "blue spirit orb",
      visualStyles: ["ink-painting"],
      tags: ["bullet", "spirit"],
      palette: ["#66ccff"],
    }),
  ],
};

export type LabeledAssetRetrievalFixture = Readonly<{
  id: string;
  query: AssetRetrievalQuery;
  expectedFirstAssetId: string;
  expectedLicenseExclusions: readonly string[];
}>;

export const LABELED_ASSET_RETRIEVAL_FIXTURES: readonly LabeledAssetRetrievalFixture[] =
  [
    {
      id: "ink-player-prefers-theme-and-style",
      query: {
        id: "player-crane",
        category: "player",
        theme: "white crane",
        visualStyle: ["ink-painting"],
        tags: ["bird", "flying"],
        preferredColors: ["#f5f5f5"],
        requiresTransparency: true,
        allowedFormats: ["png"],
        minimumWidth: 256,
        minimumHeight: 256,
        limit: 3,
      },
      expectedFirstAssetId: "crane-ink-white",
      expectedLicenseExclusions: [
        "crane-ink-no-redistribution",
        "crane-ink-noncommercial",
        "crane-ink-quarantined",
      ],
    },
    {
      id: "enemy-category-hard-filter",
      query: {
        id: "enemy-spirit",
        category: "enemy",
        theme: "corrupted spirit",
        visualStyle: ["ink-painting"],
        tags: ["monster"],
        preferredColors: ["#333333"],
        requiresTransparency: true,
        allowedFormats: ["png"],
        minimumWidth: 128,
        minimumHeight: 128,
        limit: 3,
      },
      expectedFirstAssetId: "spirit-ink-shadow",
      expectedLicenseExclusions: [
        "crane-ink-no-redistribution",
        "crane-ink-noncommercial",
        "crane-ink-quarantined",
      ],
    },
    {
      id: "pixel-style-beats-theme-only-match",
      query: {
        id: "player-pixel-crane",
        category: "player",
        theme: "blue crane",
        visualStyle: ["pixel-art"],
        tags: ["bird"],
        preferredColors: ["#3366ff"],
        requiresTransparency: true,
        allowedFormats: ["png"],
        minimumWidth: 128,
        minimumHeight: 128,
        limit: 3,
      },
      expectedFirstAssetId: "crane-pixel-blue",
      expectedLicenseExclusions: [
        "crane-ink-no-redistribution",
        "crane-ink-noncommercial",
        "crane-ink-quarantined",
      ],
    },
  ];
