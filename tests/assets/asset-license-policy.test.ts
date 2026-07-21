import { describe, expect, it } from "vitest";

import {
  DEFAULT_ASSET_LICENSE_POLICY,
  evaluateAssetLicense,
} from "../../src/assets/asset-license-policy.js";
import { SYNTHETIC_ASSET_CATALOG } from "../fixtures/asset-retrieval-fixtures.js";

function record(assetId: string) {
  const found = SYNTHETIC_ASSET_CATALOG.records.find(
    (candidate) => candidate.assetId === assetId,
  );
  if (found === undefined) {
    throw new Error(`missing fixture record: ${assetId}`);
  }
  return found;
}

describe("asset license policy", () => {
  it("starts with the narrow proposed allowlist", () => {
    expect(DEFAULT_ASSET_LICENSE_POLICY.allowlistedLicenseIds).toEqual([
      "CC0-1.0",
      "CC-BY-4.0",
    ]);
  });

  it("allows only reviewed records with allowlisted rights", () => {
    expect(evaluateAssetLicense(record("crane-ink-white"))).toEqual({
      decision: "eligible",
      reasons: [],
    });
  });

  it("requires manual review for quarantined records", () => {
    expect(evaluateAssetLicense(record("crane-ink-quarantined"))).toEqual({
      decision: "manual-review",
      reasons: ["record-not-reviewed"],
    });
  });

  it("rejects prohibited terms and denied redistribution", () => {
    expect(evaluateAssetLicense(record("crane-ink-noncommercial"))).toEqual({
      decision: "rejected",
      reasons: ["license-explicitly-rejected"],
    });
    expect(evaluateAssetLicense(record("crane-ink-no-redistribution"))).toEqual(
      {
        decision: "rejected",
        reasons: ["redistribution-denied"],
      },
    );

    const olderRestrictedLicense = structuredClone(record("crane-ink-white"));
    olderRestrictedLicense.source.license.licenseId = "CC-BY-NC-3.0";
    expect(evaluateAssetLicense(olderRestrictedLicense)).toEqual({
      decision: "rejected",
      reasons: ["license-explicitly-rejected"],
    });
  });

  it("keeps unknown licenses in manual review instead of guessing", () => {
    const unknownLicense = structuredClone(record("crane-ink-white"));
    unknownLicense.source.license.licenseId = "CC-BY-3.0";

    expect(evaluateAssetLicense(unknownLicense)).toEqual({
      decision: "manual-review",
      reasons: ["license-not-allowlisted"],
    });
  });
});
