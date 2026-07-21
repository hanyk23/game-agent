import { describe, expect, it } from "vitest";

import { rankAssets } from "../../src/assets/asset-retrieval.js";
import {
  LABELED_ASSET_RETRIEVAL_FIXTURES,
  SYNTHETIC_ASSET_CATALOG,
} from "../fixtures/asset-retrieval-fixtures.js";

describe("deterministic asset retrieval", () => {
  for (const fixture of LABELED_ASSET_RETRIEVAL_FIXTURES) {
    it(fixture.id, () => {
      const result = rankAssets(fixture.query, SYNTHETIC_ASSET_CATALOG.records);

      expect(result.ranked[0]?.assetId).toBe(fixture.expectedFirstAssetId);
      expect(
        result.excluded
          .filter((entry) => entry.stage === "license")
          .map((entry) => entry.assetId),
      ).toEqual(fixture.expectedLicenseExclusions);
    });
  }

  it("hard-filters license failures before semantic ranking", () => {
    const result = rankAssets(
      LABELED_ASSET_RETRIEVAL_FIXTURES[0]!.query,
      SYNTHETIC_ASSET_CATALOG.records,
    );

    expect(
      result.ranked.some(
        (entry) => entry.assetId === "crane-ink-noncommercial",
      ),
    ).toBe(false);
    expect(
      result.excluded.find(
        (entry) => entry.assetId === "crane-ink-noncommercial",
      )?.stage,
    ).toBe("license");
  });

  it("uses assetId as a deterministic tie breaker", () => {
    const first = structuredClone(SYNTHETIC_ASSET_CATALOG.records[0]!);
    const second = structuredClone(first);
    first.assetId = "tie-b";
    first.sourceFile.path = "sources/tie-b.png";
    first.sourceFile.sha256 = "1".repeat(64);
    second.assetId = "tie-a";
    second.sourceFile.path = "sources/tie-a.png";
    second.sourceFile.sha256 = "2".repeat(64);

    const result = rankAssets(LABELED_ASSET_RETRIEVAL_FIXTURES[0]!.query, [
      first,
      second,
    ]);

    expect(result.ranked.map((entry) => entry.assetId)).toEqual([
      "tie-a",
      "tie-b",
    ]);
  });

  it("fails closed on malformed records", () => {
    const malformed = structuredClone(SYNTHETIC_ASSET_CATALOG.records[0]!) as
      Record<string, unknown> | undefined;
    expect(malformed).toBeDefined();
    delete malformed!.source;

    expect(() =>
      rankAssets(LABELED_ASSET_RETRIEVAL_FIXTURES[0]!.query, [malformed]),
    ).toThrow();
  });
});
