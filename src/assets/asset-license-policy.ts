import { z } from "zod";

import type { AssetCatalogRecord } from "./asset-catalog.js";

const AssetLicensePolicySchema = z
  .strictObject({
    schemaVersion: z.literal("1.0.0"),
    policyId: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    allowlistedLicenseIds: z.array(z.string().min(1).max(80)).min(1),
    rejectedLicenseIds: z.array(z.string().min(1).max(80)),
    requireCommercialUse: z.boolean(),
    requireModification: z.boolean(),
    requireRedistribution: z.boolean(),
  })
  .superRefine((policy, context) => {
    const rejected = new Set(policy.rejectedLicenseIds);
    policy.allowlistedLicenseIds.forEach((licenseId, index) => {
      if (rejected.has(licenseId)) {
        context.addIssue({
          code: "custom",
          message: `license cannot be both allowed and rejected: ${licenseId}`,
          path: ["allowlistedLicenseIds", index],
        });
      }
    });
  });

export type AssetLicensePolicy = z.infer<typeof AssetLicensePolicySchema>;

export const DEFAULT_ASSET_LICENSE_POLICY: AssetLicensePolicy =
  AssetLicensePolicySchema.parse({
    schemaVersion: "1.0.0",
    policyId: "phase-2-baseline",
    allowlistedLicenseIds: ["CC0-1.0", "CC-BY-4.0"],
    rejectedLicenseIds: [
      "CC-BY-NC-4.0",
      "CC-BY-ND-4.0",
      "CC-BY-NC-ND-4.0",
      "CC-BY-SA-4.0",
      "GPL-2.0-only",
      "GPL-3.0-only",
    ],
    requireCommercialUse: true,
    requireModification: true,
    requireRedistribution: true,
  });

export type AssetLicenseDecision = Readonly<{
  decision: "eligible" | "manual-review" | "rejected";
  reasons: readonly string[];
}>;

function hasRestrictedLicenseMarker(licenseId: string): boolean {
  return (
    /^CC-[A-Z-]*(?:NC|ND|SA)(?:-|$)/.test(licenseId) ||
    /^(?:A?GPL|LGPL)-/.test(licenseId)
  );
}

export function evaluateAssetLicense(
  record: AssetCatalogRecord,
  policy: AssetLicensePolicy = DEFAULT_ASSET_LICENSE_POLICY,
): AssetLicenseDecision {
  const parsedPolicy = AssetLicensePolicySchema.parse(policy);
  const reasons: string[] = [];
  const license = record.source.license;
  const licenseExplicitlyRejected =
    parsedPolicy.rejectedLicenseIds.includes(license.licenseId) ||
    hasRestrictedLicenseMarker(license.licenseId);

  if (record.review.status === "rejected") {
    reasons.push("record-rejected");
  }
  if (
    licenseExplicitlyRejected ||
    (parsedPolicy.requireCommercialUse && !license.permissions.commercialUse) ||
    (parsedPolicy.requireModification && !license.permissions.modification) ||
    (parsedPolicy.requireRedistribution && !license.permissions.redistribution)
  ) {
    if (licenseExplicitlyRejected) {
      reasons.push("license-explicitly-rejected");
    }
    if (
      parsedPolicy.requireCommercialUse &&
      !license.permissions.commercialUse
    ) {
      reasons.push("commercial-use-denied");
    }
    if (parsedPolicy.requireModification && !license.permissions.modification) {
      reasons.push("modification-denied");
    }
    if (
      parsedPolicy.requireRedistribution &&
      !license.permissions.redistribution
    ) {
      reasons.push("redistribution-denied");
    }
  }

  if (reasons.length > 0) {
    return { decision: "rejected", reasons };
  }

  if (record.review.status !== "reviewed") {
    return {
      decision: "manual-review",
      reasons: ["record-not-reviewed"],
    };
  }

  if (!parsedPolicy.allowlistedLicenseIds.includes(license.licenseId)) {
    return {
      decision: "manual-review",
      reasons: ["license-not-allowlisted"],
    };
  }

  return { decision: "eligible", reasons: [] };
}

export function parseAssetLicensePolicy(input: unknown): AssetLicensePolicy {
  return AssetLicensePolicySchema.parse(input);
}
