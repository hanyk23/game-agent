import { describe, expect, it } from "vitest";

import {
  parseAssetCatalog,
  toAssetCatalogJsonSchema,
  validateAssetCatalog,
} from "../../src/assets/asset-catalog.js";
import { SYNTHETIC_ASSET_CATALOG } from "../fixtures/asset-retrieval-fixtures.js";

describe("asset catalog", () => {
  it("accepts strict provenance, rights, source, and review metadata", () => {
    expect(parseAssetCatalog(SYNTHETIC_ASSET_CATALOG)).toEqual(
      SYNTHETIC_ASSET_CATALOG,
    );
  });

  it("rejects unknown fields and unsafe source paths", () => {
    const unknownField = structuredClone(SYNTHETIC_ASSET_CATALOG) as Record<
      string,
      unknown
    >;
    unknownField.shellCommand = "not allowed";
    expect(validateAssetCatalog(unknownField).success).toBe(false);

    const unsafePath = structuredClone(SYNTHETIC_ASSET_CATALOG);
    unsafePath.records[0]!.sourceFile.path = "../outside.png";
    expect(validateAssetCatalog(unsafePath).success).toBe(false);
  });

  it("rejects duplicate source images so counting cannot inflate variants", () => {
    const duplicate = structuredClone(SYNTHETIC_ASSET_CATALOG);
    duplicate.records[1]!.sourceFile.sha256 =
      duplicate.records[0]!.sourceFile.sha256;
    const result = validateAssetCatalog(duplicate);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes("duplicate source image hash"),
        ),
      ).toBe(true);
    }
  });

  it("requires reviewer evidence before a record is marked reviewed", () => {
    const missingEvidence = structuredClone(SYNTHETIC_ASSET_CATALOG);
    delete missingEvidence.records[0]!.review.reviewedBy;

    expect(validateAssetCatalog(missingEvidence).success).toBe(false);
  });

  it("exports a strict Draft 2020-12 JSON Schema", () => {
    const schema = toAssetCatalogJsonSchema();

    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.type).toBe("object");
    expect(schema.additionalProperties).toBe(false);
  });
});
