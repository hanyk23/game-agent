import { parseAssetCatalog } from "./asset-catalog.js";
import {
  DEFAULT_ASSET_LICENSE_POLICY,
  evaluateAssetLicense,
  type AssetLicensePolicy,
} from "./asset-license-policy.js";

export type AssetImageCountSummary = Readonly<{
  catalogRecords: number;
  eligibleUniqueSourceImages: number;
  eligibleThirdPartySourceImages: number;
  eligibleProjectOwnedSourceImages: number;
  eligibleGeneratedSourceImages: number;
  manualReviewSourceImages: number;
  rejectedSourceImages: number;
  derivedFilesExcludedFromCount: number;
}>;

export function summarizeAssetImageCounts(
  rawCatalog: unknown,
  policy: AssetLicensePolicy = DEFAULT_ASSET_LICENSE_POLICY,
): AssetImageCountSummary {
  const catalog = parseAssetCatalog(rawCatalog);
  let eligibleUniqueSourceImages = 0;
  let eligibleThirdPartySourceImages = 0;
  let eligibleProjectOwnedSourceImages = 0;
  let eligibleGeneratedSourceImages = 0;
  let manualReviewSourceImages = 0;
  let rejectedSourceImages = 0;
  let derivedFilesExcludedFromCount = 0;

  catalog.records.forEach((record) => {
    derivedFilesExcludedFromCount += record.derivedFiles.length;
    const decision = evaluateAssetLicense(record, policy).decision;
    if (decision === "manual-review") {
      manualReviewSourceImages += 1;
      return;
    }
    if (decision === "rejected") {
      rejectedSourceImages += 1;
      return;
    }

    eligibleUniqueSourceImages += 1;
    if (record.source.origin === "third-party") {
      eligibleThirdPartySourceImages += 1;
    } else if (record.source.origin === "project-owned") {
      eligibleProjectOwnedSourceImages += 1;
    } else {
      eligibleGeneratedSourceImages += 1;
    }
  });

  return {
    catalogRecords: catalog.records.length,
    eligibleUniqueSourceImages,
    eligibleThirdPartySourceImages,
    eligibleProjectOwnedSourceImages,
    eligibleGeneratedSourceImages,
    manualReviewSourceImages,
    rejectedSourceImages,
    derivedFilesExcludedFromCount,
  };
}
