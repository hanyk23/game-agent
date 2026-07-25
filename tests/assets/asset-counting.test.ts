import { describe, expect, it } from "vitest";

import { summarizeAssetImageCounts } from "../../src/assets/asset-counting.js";
import { SYNTHETIC_ASSET_CATALOG } from "../fixtures/asset-retrieval-fixtures.js";

describe("asset image counting", () => {
  it("counts unique eligible source images and reports rights states separately", () => {
    expect(summarizeAssetImageCounts(SYNTHETIC_ASSET_CATALOG)).toEqual({
      catalogRecords: 7,
      eligibleUniqueSourceImages: 4,
      eligibleThirdPartySourceImages: 4,
      eligibleProjectOwnedSourceImages: 0,
      eligibleGeneratedSourceImages: 0,
      manualReviewSourceImages: 1,
      rejectedSourceImages: 2,
      derivedFilesExcludedFromCount: 0,
    });
  });

  it("does not increase source-image count for derived variants", () => {
    const catalog = structuredClone(SYNTHETIC_ASSET_CATALOG);
    catalog.records[0]!.derivedFiles.push({
      path: "derived/crane-ink-white.webp",
      sha256: "9".repeat(64),
      format: "webp",
      width: 256,
      height: 256,
      byteSize: 24_000,
      hasTransparency: true,
      transforms: ["resize 512x512 to 256x256", "convert PNG to WebP"],
    });

    const result = summarizeAssetImageCounts(catalog);

    expect(result.eligibleUniqueSourceImages).toBe(4);
    expect(result.derivedFilesExcludedFromCount).toBe(1);
  });
});
