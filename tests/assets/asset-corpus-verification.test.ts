import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { summarizeAssetImageCounts } from "../../src/assets/asset-counting.js";
import { verifyAssetCorpus } from "../../src/assets/asset-corpus-verification.js";
import { parseAssetCatalog } from "../../src/assets/asset-catalog.js";
import { rankAssets } from "../../src/assets/asset-retrieval.js";

const corpusRoot = fileURLToPath(
  new URL("../../assets/corpus/", import.meta.url),
);

async function loadCatalog(): Promise<unknown> {
  return JSON.parse(
    await readFile(
      new URL("../../assets/corpus/catalog.json", import.meta.url),
      {
        encoding: "utf8",
      },
    ),
  );
}

describe("reviewed and rejected asset corpus", () => {
  it("keeps the 56 rejected Batch 002 files out of the 35-image eligible count", async () => {
    const catalog = parseAssetCatalog(await loadCatalog());
    const categoryCounts = Object.fromEntries(
      [
        "player",
        "enemy",
        "boss",
        "background",
        "player-projectile",
        "enemy-projectile",
        "pickup",
        "ui",
        "effect",
      ].map((category) => [
        category,
        catalog.records.filter((record) => record.category === category).length,
      ]),
    );

    expect(categoryCounts).toEqual({
      player: 10,
      enemy: 19,
      boss: 8,
      background: 7,
      "player-projectile": 10,
      "enemy-projectile": 10,
      pickup: 7,
      ui: 10,
      effect: 10,
    });
    expect(
      catalog.records.filter((record) => record.source.siteName === "Kenney"),
    ).toHaveLength(80);
    expect(
      catalog.records.filter(
        (record) => record.source.siteName === "OpenGameArt.org",
      ),
    ).toHaveLength(11);
    expect(summarizeAssetImageCounts(catalog)).toEqual({
      catalogRecords: 91,
      eligibleUniqueSourceImages: 35,
      eligibleThirdPartySourceImages: 35,
      eligibleProjectOwnedSourceImages: 0,
      eligibleGeneratedSourceImages: 0,
      manualReviewSourceImages: 0,
      rejectedSourceImages: 56,
      derivedFilesExcludedFromCount: 0,
    });
    expect(
      catalog.records.filter((record) => record.review.status === "rejected"),
    ).toHaveLength(56);
  });

  it("retrieves the coherent blue Kenney player ship ahead of other styles", async () => {
    const catalog = parseAssetCatalog(await loadCatalog());
    const result = rankAssets(
      {
        id: "real-blue-space-player",
        category: "player",
        theme: "space science fiction",
        visualStyle: ["vector", "clean"],
        tags: ["ship", "blue"],
        preferredColors: [],
        requiresTransparency: true,
        allowedFormats: ["png"],
        minimumWidth: 1,
        minimumHeight: 1,
        limit: 4,
      },
      catalog.records,
    );

    expect(result.ranked).toHaveLength(4);
    expect(result.ranked[0]?.assetId).toBe("kenney-player-ship-1-blue");
    expect(result.excluded).toHaveLength(87);
    expect(
      result.excluded.find(
        (asset) => asset.assetId === "kenney-pixel-shmup-player-ship-0000",
      )?.stage,
    ).toBe("license");
    expect(
      result.excluded.find((asset) => asset.assetId === "kenney-enemy-black-1")
        ?.stage,
    ).toBe("technical");
  });

  it("verifies immutable files, PNG metadata, and the 150 MB disk cap", async () => {
    const result = await verifyAssetCorpus(
      corpusRoot,
      await loadCatalog(),
      150 * 1024 * 1024,
    );

    expect(result).toEqual({
      ok: true,
      verifiedFiles: 91,
      corpusBytes: expect.any(Number),
      issues: [],
    });
    expect(result.corpusBytes).toBeLessThan(15 * 1024 * 1024);
  });

  it("fails closed when a catalog hash does not match its source file", async () => {
    const catalog = parseAssetCatalog(await loadCatalog());
    const tampered = structuredClone(catalog);
    const firstRecord = tampered.records[0];
    if (firstRecord === undefined) {
      throw new Error("expected the first asset corpus record");
    }
    firstRecord.sourceFile.sha256 = "0".repeat(64);

    const result = await verifyAssetCorpus(
      corpusRoot,
      tampered,
      150 * 1024 * 1024,
    );

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({
      path: firstRecord.sourceFile.path,
      reason: "sha256-mismatch",
    });
  });
});
