import { z } from "zod";

export const ASSET_CATEGORIES = [
  "player",
  "enemy",
  "boss",
  "background",
  "player-projectile",
  "enemy-projectile",
  "pickup",
  "ui",
  "effect",
] as const;

export const IMAGE_FORMATS = ["png", "webp", "jpeg", "svg"] as const;

const SafeIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "must be a lowercase kebab-case identifier",
  );

const Sha256Schema = z
  .string()
  .regex(/^[0-9a-f]{64}$/, "must be a lowercase SHA-256 hash");

const HexColorSchema = z
  .string()
  .regex(
    /^#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?$/,
    "must be a 6- or 8-digit hex color",
  );

const HttpsUrlSchema = z
  .url()
  .max(2_048)
  .refine((value) => value.startsWith("https://"), {
    message: "must use HTTPS",
  });

const RelativeCatalogPathSchema = z
  .string()
  .min(1)
  .max(240)
  .refine(
    (value) =>
      !value.startsWith("/") &&
      !value.includes("\\") &&
      !value.split("/").includes("..") &&
      !/^[a-zA-Z]:/.test(value),
    "must be a safe forward-slash relative path",
  );

const ImageFileSchema = z.strictObject({
  path: RelativeCatalogPathSchema,
  sha256: Sha256Schema,
  format: z.enum(IMAGE_FORMATS),
  width: z.number().int().min(1).max(32_768),
  height: z.number().int().min(1).max(32_768),
  byteSize: z
    .number()
    .int()
    .min(1)
    .max(512 * 1024 * 1024),
  hasTransparency: z.boolean(),
});

const DerivedImageFileSchema = ImageFileSchema.extend({
  transforms: z.array(z.string().min(1).max(120)).min(1).max(12),
});

const LicenseSchema = z.strictObject({
  licenseId: z
    .string()
    .min(1)
    .max(80)
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9.+-]*$/,
      "must be an SPDX identifier or a stable LicenseRef identifier",
    ),
  licenseName: z.string().min(1).max(160),
  termsUrl: HttpsUrlSchema.optional(),
  attributionText: z.string().min(1).max(1_000),
  permissions: z.strictObject({
    commercialUse: z.boolean(),
    modification: z.boolean(),
    redistribution: z.boolean(),
  }),
});

const ReviewSchema = z
  .strictObject({
    status: z.enum(["quarantined", "reviewed", "rejected"]),
    reviewedBy: z.string().min(1).max(120).optional(),
    reviewedAt: z.iso.date().optional(),
    notes: z.string().max(1_000).default(""),
  })
  .superRefine((review, context) => {
    if (
      review.status === "reviewed" &&
      (review.reviewedBy === undefined || review.reviewedAt === undefined)
    ) {
      context.addIssue({
        code: "custom",
        message: "reviewed records require reviewedBy and reviewedAt",
      });
    }
  });

export const AssetCatalogRecordSchema = z
  .strictObject({
    assetId: SafeIdSchema,
    mediaType: z.literal("image"),
    category: z.enum(ASSET_CATEGORIES),
    subcategory: z.string().min(1).max(80),
    description: z.string().min(1).max(1_000),
    tags: z.array(z.string().min(1).max(60)).min(1).max(32),
    themes: z.array(z.string().min(1).max(120)).min(1).max(12),
    visualStyles: z.array(z.string().min(1).max(60)).min(1).max(12),
    palette: z.array(HexColorSchema).max(12).default([]),
    source: z.strictObject({
      origin: z.enum(["third-party", "project-owned", "generated"]),
      siteName: z.string().min(1).max(120),
      author: z.string().min(1).max(160),
      sourcePageUrl: HttpsUrlSchema.optional(),
      sourceFileUrl: HttpsUrlSchema.optional(),
      collectedAt: z.iso.date(),
      license: LicenseSchema,
    }),
    sourceFile: ImageFileSchema,
    derivedFiles: z.array(DerivedImageFileSchema).max(8).default([]),
    review: ReviewSchema,
  })
  .superRefine((record, context) => {
    if (
      record.source.origin === "third-party" &&
      record.source.sourcePageUrl === undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "third-party records require a sourcePageUrl",
        path: ["source", "sourcePageUrl"],
      });
    }

    if (!record.sourceFile.path.startsWith("sources/")) {
      context.addIssue({
        code: "custom",
        message: "source files must be stored under sources/",
        path: ["sourceFile", "path"],
      });
    }

    record.derivedFiles.forEach((file, index) => {
      if (!file.path.startsWith("derived/")) {
        context.addIssue({
          code: "custom",
          message: "derived files must be stored under derived/",
          path: ["derivedFiles", index, "path"],
        });
      }
    });
  });

export const AssetCatalogSchema = z
  .strictObject({
    schemaVersion: z.literal("1.0.0"),
    catalogId: SafeIdSchema,
    records: z.array(AssetCatalogRecordSchema).max(5_000),
  })
  .superRefine((catalog, context) => {
    const ids = new Set<string>();
    const sourceHashes = new Set<string>();
    const paths = new Set<string>();

    catalog.records.forEach((record, index) => {
      if (ids.has(record.assetId)) {
        context.addIssue({
          code: "custom",
          message: `duplicate assetId: ${record.assetId}`,
          path: ["records", index, "assetId"],
        });
      }
      ids.add(record.assetId);

      if (sourceHashes.has(record.sourceFile.sha256)) {
        context.addIssue({
          code: "custom",
          message: `duplicate source image hash: ${record.sourceFile.sha256}`,
          path: ["records", index, "sourceFile", "sha256"],
        });
      }
      sourceHashes.add(record.sourceFile.sha256);

      const recordPaths = [
        record.sourceFile.path,
        ...record.derivedFiles.map((file) => file.path),
      ];
      recordPaths.forEach((path) => {
        if (paths.has(path)) {
          context.addIssue({
            code: "custom",
            message: `duplicate catalog path: ${path}`,
            path: ["records", index],
          });
        }
        paths.add(path);
      });
    });
  });

export type AssetCategory = (typeof ASSET_CATEGORIES)[number];
export type ImageFormat = (typeof IMAGE_FORMATS)[number];
export type AssetCatalogRecord = z.infer<typeof AssetCatalogRecordSchema>;
export type AssetCatalog = z.infer<typeof AssetCatalogSchema>;

export function parseAssetCatalog(input: unknown): AssetCatalog {
  return AssetCatalogSchema.parse(input);
}

export function validateAssetCatalog(input: unknown) {
  return AssetCatalogSchema.safeParse(input);
}

export function toAssetCatalogJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(AssetCatalogSchema, {
    target: "draft-2020-12",
    unrepresentable: "throw",
  }) as Record<string, unknown>;
}
