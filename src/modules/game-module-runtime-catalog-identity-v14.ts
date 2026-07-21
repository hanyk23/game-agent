import { z } from "zod";

const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);

export const BrowserRuntimeCatalogIdentityEntryV14Schema = z.strictObject({
  moduleId: z.string().min(1),
  version: z.string().min(1),
  manifestSchemaVersion: z.enum(["1.2.0", "1.3.0", "1.4.0"]),
  factoryContextVersion: z.enum(["1.2.0", "1.3.0", "1.4.0"]),
  envelopeSha256: Sha256Schema,
  implementationId: z.string().min(1),
  exportName: z.string().min(1),
  exportKind: z.enum([
    "lifecycle-create-v1",
    "contact-policy-transform-v1",
    "pickup-effect-plan-transform-v1",
  ]),
  outputBundleSha256: Sha256Schema,
  entryEvidenceId: Sha256Schema,
});

export const BrowserRuntimeCatalogIdentityV14Schema = z
  .strictObject({
    schemaVersion: z.literal("1.0.0"),
    graphVersion: z.literal("1.4.0"),
    graphReadinessEvidenceId: Sha256Schema,
    catalogEvidenceId: Sha256Schema,
    entries: z.array(BrowserRuntimeCatalogIdentityEntryV14Schema).max(128),
    catalogIdentityEvidenceId: Sha256Schema,
  })
  .superRefine((catalog, context) => {
    const keys = catalog.entries.map(
      (entry) =>
        `${entry.moduleId}\u0000${entry.version}\u0000${entry.envelopeSha256}`,
    );
    if (new Set(keys).size !== keys.length)
      context.addIssue({
        code: "custom",
        message: "catalog identity entries must be unique registrations",
        path: ["entries"],
      });
    for (const [index, entry] of catalog.entries.entries())
      if (entry.factoryContextVersion !== entry.manifestSchemaVersion)
        context.addIssue({
          code: "custom",
          message: "factory context must match the frozen manifest version",
          path: ["entries", index, "factoryContextVersion"],
        });
  });

export type BrowserRuntimeCatalogIdentityEntryV14 = z.infer<
  typeof BrowserRuntimeCatalogIdentityEntryV14Schema
>;
export type BrowserRuntimeCatalogIdentityV14 = z.infer<
  typeof BrowserRuntimeCatalogIdentityV14Schema
>;
