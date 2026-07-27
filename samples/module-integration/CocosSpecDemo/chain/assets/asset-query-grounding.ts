import { createHash } from "node:crypto";

import { z } from "zod";

import { parseAssetCatalog, type AssetCategory } from "./asset-catalog.js";
import {
  parseShooterGameSpec,
  type ShooterGameSpec,
} from "../requirements/shooter-game-spec.js";

const Sha256Schema = z.string().regex(/^[0-9a-f]{64}$/);
const SafeIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const VocabularyFieldSchema = z.enum(["theme", "visualStyle", "tags"]);

const GroundingTermSchema = z.strictObject({
  sourceField: VocabularyFieldSchema,
  sourceTerm: z.string().min(1).max(120),
  targetField: VocabularyFieldSchema,
  targetTerms: z.array(z.string().min(1).max(120)).min(1).max(12),
  disposition: z.enum(["catalog-identity", "mapped"]),
  ruleId: z.string().min(1).max(80),
  rationale: z.string().min(1).max(320),
});

const QueryVocabularySchema = z.strictObject({
  theme: z.string().min(1).max(120),
  visualStyle: z.array(z.string().min(1).max(60)).min(1).max(8),
  tags: z.array(z.string().min(1).max(40)).max(16),
});

const GroundedQuerySchema = z.strictObject({
  queryId: SafeIdSchema,
  original: QueryVocabularySchema,
  grounded: QueryVocabularySchema,
  terms: z.array(GroundingTermSchema).min(1).max(25),
});

export const AssetQueryGroundingSchema = z
  .strictObject({
    schemaVersion: z.enum(["1.0.0", "1.1.0", "1.1.1", "1.1.2"]),
    policyId: z.enum([
      "bounded-catalog-grounding-v1",
      "bounded-catalog-grounding-v1.1",
      "bounded-catalog-grounding-v1.1.1",
      "bounded-catalog-grounding-v1.1.2",
    ]),
    sourceSpec: z.strictObject({
      schemaVersion: z.literal("1.0.0"),
      sha256: Sha256Schema,
    }),
    catalog: z.strictObject({
      catalogId: SafeIdSchema,
      path: z.literal("assets/corpus/catalog.json"),
      sha256: Sha256Schema,
    }),
    queries: z.array(GroundedQuerySchema).min(1).max(64),
  })
  .superRefine((artifact, context) => {
    const expectedPolicy = {
      "1.0.0": "bounded-catalog-grounding-v1",
      "1.1.0": "bounded-catalog-grounding-v1.1",
      "1.1.1": "bounded-catalog-grounding-v1.1.1",
      "1.1.2": "bounded-catalog-grounding-v1.1.2",
    }[artifact.schemaVersion];
    if (artifact.policyId !== expectedPolicy) {
      context.addIssue({
        code: "custom",
        path: ["policyId"],
        message: `schemaVersion ${artifact.schemaVersion} requires ${expectedPolicy}`,
      });
    }
  });

export type AssetQueryGrounding = z.infer<typeof AssetQueryGroundingSchema>;
export type AssetQueryVocabularyField = z.infer<typeof VocabularyFieldSchema>;

type GroundingRule = Readonly<{
  sourceField: AssetQueryVocabularyField;
  sourceTerm: string;
  targetField: AssetQueryVocabularyField;
  targetTerms: readonly string[];
  ruleId: string;
  rationale: string;
}>;

const GROUNDING_RULES: readonly GroundingRule[] = Object.freeze([
  {
    sourceField: "theme",
    sourceTerm: "红色陨石带",
    targetField: "theme",
    targetTerms: ["space"],
    ruleId: "theme-red-meteor-belt-to-space",
    rationale:
      "The reviewed catalog represents meteor-belt scenes under the finite space theme; color remains bound by preferredColors and color tags.",
  },
  ...[
    ["橙色", "orange"],
    ["蓝色", "blue"],
    ["灰色", "grey"],
    ["棕色", "brown"],
    ["红色", "red"],
    ["绿色", "green"],
  ].map(([sourceTerm, targetTerm]): GroundingRule => ({
    sourceField: "visualStyle",
    sourceTerm: sourceTerm!,
    targetField: "tags",
    targetTerms: [targetTerm!],
    ruleId: `style-color-${targetTerm!}-to-tag`,
    rationale:
      "The term is a color descriptor, so it is grounded into the catalog tag vocabulary instead of being treated as a visual style.",
  })),
  {
    sourceField: "visualStyle",
    sourceTerm: "发光",
    targetField: "visualStyle",
    targetTerms: ["glow"],
    ruleId: "style-glow-cn-to-glow",
    rationale:
      "The source term is the unambiguous Chinese label for the catalog visual style glow.",
  },
  {
    sourceField: "tags",
    sourceTerm: "rescue",
    targetField: "tags",
    targetTerms: ["ship"],
    ruleId: "tag-rescue-to-ship",
    rationale:
      "The bounded corpus has no rescue-role appearance tag; its reviewed player rescue craft remain indexed as ships.",
  },
  {
    sourceField: "tags",
    sourceTerm: "fighter",
    targetField: "tags",
    targetTerms: ["ship"],
    ruleId: "tag-fighter-to-ship",
    rationale:
      "The reviewed catalog indexes fighter craft under the generic ship tag.",
  },
  {
    sourceField: "tags",
    sourceTerm: "small",
    targetField: "tags",
    targetTerms: ["enemy"],
    ruleId: "tag-small-to-enemy",
    rationale:
      "The bounded reviewed catalog has no size tag; enemy preserves the unambiguous requested asset role without inventing size evidence.",
  },
  {
    sourceField: "tags",
    sourceTerm: "rock",
    targetField: "tags",
    targetTerms: ["asteroid"],
    ruleId: "tag-rock-to-asteroid",
    rationale: "The reviewed catalog uses asteroid for space-rock imagery.",
  },
  {
    sourceField: "tags",
    sourceTerm: "aiming",
    targetField: "tags",
    targetTerms: ["target"],
    ruleId: "tag-aiming-to-target",
    rationale:
      "The reviewed catalog represents aiming semantics with the target tag.",
  },
  {
    sourceField: "tags",
    sourceTerm: "squad",
    targetField: "tags",
    targetTerms: ["enemy"],
    ruleId: "tag-squad-to-enemy",
    rationale:
      "The bounded catalog has no formation-size vocabulary; enemy preserves the unambiguous asset role without inventing a formation appearance.",
  },
  {
    sourceField: "tags",
    sourceTerm: "hero",
    targetField: "tags",
    targetTerms: ["player"],
    ruleId: "tag-hero-to-player",
    rationale:
      "The reviewed catalog indexes the user-controlled hero craft with the player role tag.",
  },
  {
    sourceField: "tags",
    sourceTerm: "aimer",
    targetField: "tags",
    targetTerms: ["target"],
    ruleId: "tag-aimer-to-target",
    rationale:
      "The reviewed catalog represents aiming semantics with the finite target tag.",
  },
  {
    sourceField: "tags",
    sourceTerm: "mothership",
    targetField: "tags",
    targetTerms: ["command craft"],
    ruleId: "tag-mothership-to-command-craft",
    rationale:
      "The catalog's finite large-command-ship vocabulary uses command craft for mothership imagery.",
  },
]);

const AMBIGUOUS_TERMS = new Map<string, readonly string[]>([
  ["visualStyle:科幻", ["visualStyle:sci-fi", "theme:science fiction"]],
  ["tags:战机", ["tags:ship", "tags:drone"]],
]);

function normalize(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en-US");
}

function themeTokens(value: string): string[] {
  return normalize(value)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 0);
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function canonicalShooterGameSpecJson(rawSpec: unknown): string {
  return `${JSON.stringify(parseShooterGameSpec(rawSpec), null, 2)}\n`;
}

export function sha256ShooterGameSpec(rawSpec: unknown): string {
  return sha256(canonicalShooterGameSpecJson(rawSpec));
}

export class AssetQueryGroundingError extends Error {
  constructor(
    readonly code:
      | "unknown-term"
      | "ambiguous-term"
      | "unsupported-target"
      | "binding-mismatch"
      | "grounded-query-invalid",
    readonly queryId: string,
    readonly field: AssetQueryVocabularyField,
    readonly term: string,
    readonly candidates: readonly string[] = [],
  ) {
    const suffix =
      candidates.length === 0 ? "" : `; candidates=${candidates.join(",")}`;
    super(
      `Asset query grounding ${code}: query=${queryId}; field=${field}; term=${JSON.stringify(term)}${suffix}`,
    );
    this.name = "AssetQueryGroundingError";
  }
}

type CatalogVocabulary = Readonly<
  Record<AssetQueryVocabularyField, ReadonlySet<string>>
>;

function catalogVocabulary(rawCatalog: unknown): CatalogVocabulary {
  const catalog = parseAssetCatalog(rawCatalog);
  return {
    theme: new Set(
      catalog.records.flatMap((record) => [
        ...record.themes.flatMap(themeTokens),
        ...record.tags.flatMap(themeTokens),
        ...themeTokens(record.description),
      ]),
    ),
    visualStyle: new Set(
      catalog.records.flatMap((record) => record.visualStyles.map(normalize)),
    ),
    tags: new Set(
      catalog.records.flatMap((record) => record.tags.map(normalize)),
    ),
  };
}

function groundTerm(
  queryId: string,
  category: AssetCategory,
  field: AssetQueryVocabularyField,
  sourceTerm: string,
  vocabulary: CatalogVocabulary,
): z.infer<typeof GroundingTermSchema> {
  const normalized = normalize(sourceTerm);
  if (
    field === "theme" &&
    normalized === "energy" &&
    ["player-projectile", "enemy-projectile", "pickup"].includes(category)
  ) {
    return {
      sourceField: field,
      sourceTerm,
      targetField: "theme",
      targetTerms: ["energy", "space"],
      disposition: "mapped",
      ruleId: `theme-energy-${category}-compatibility`,
      rationale:
        "The current reviewed role assets are indexed under space; energy is retained while space supplies the category-compatible positive theme evidence.",
    };
  }
  if (field === "theme") {
    const targets = themeTokens(sourceTerm);
    if (
      targets.length > 0 &&
      targets.every((target) => vocabulary.theme.has(target))
    ) {
      return {
        sourceField: field,
        sourceTerm,
        targetField: field,
        targetTerms: targets,
        disposition: "catalog-identity",
        ruleId: "catalog-token-identity",
        rationale:
          "Every normalized theme token already exists in the finite catalog retrieval vocabulary.",
      };
    }
  }
  if (
    field === "visualStyle" &&
    (normalized === "像素风格" || normalized === "pixel-art")
  ) {
    const compatibleTargets: Readonly<
      Record<AssetCategory, readonly string[]>
    > = {
      player: ["pixel-art"],
      enemy: ["clean"],
      boss: ["pixel-art", "clean"],
      background: ["pixel-art"],
      "player-projectile": ["glow"],
      "enemy-projectile": ["glow"],
      pickup: ["pixel-art", "clean"],
      ui: ["clean"],
      effect: ["particle"],
    };
    const targetTerms = compatibleTargets[category];
    const unsupported = targetTerms.filter(
      (target) => !vocabulary.visualStyle.has(target),
    );
    if (unsupported.length > 0) {
      throw new AssetQueryGroundingError(
        "unsupported-target",
        queryId,
        field,
        sourceTerm,
        unsupported,
      );
    }
    return {
      sourceField: field,
      sourceTerm,
      targetField: "visualStyle",
      targetTerms: [...targetTerms],
      disposition:
        normalized === "pixel-art" &&
        targetTerms.length === 1 &&
        targetTerms[0] === "pixel-art"
          ? "catalog-identity"
          : "mapped",
      ruleId: `style-pixel-${category}-compatibility`,
      rationale:
        targetTerms.length === 1 && targetTerms[0] === "pixel-art"
          ? "The category has reviewed pixel-art vocabulary, so the source style maps directly to pixel-art."
          : `The current catalog has no reviewed pixel-art ${category} match for every semantic role; the fixed secondary style preserves a positive category-compatible catalog match without changing the ranking gate.`,
    };
  }
  const ambiguous = AMBIGUOUS_TERMS.get(`${field}:${normalized}`);
  if (ambiguous !== undefined) {
    throw new AssetQueryGroundingError(
      "ambiguous-term",
      queryId,
      field,
      sourceTerm,
      ambiguous,
    );
  }

  const rule = GROUNDING_RULES.find(
    (candidate) =>
      candidate.sourceField === field &&
      normalize(candidate.sourceTerm) === normalized,
  );
  if (rule !== undefined) {
    const unsupported = rule.targetTerms.filter(
      (target) => !vocabulary[rule.targetField].has(normalize(target)),
    );
    if (unsupported.length > 0) {
      throw new AssetQueryGroundingError(
        "unsupported-target",
        queryId,
        field,
        sourceTerm,
        unsupported,
      );
    }
    return {
      sourceField: field,
      sourceTerm,
      targetField: rule.targetField,
      targetTerms: rule.targetTerms.map(normalize),
      disposition: "mapped",
      ruleId: rule.ruleId,
      rationale: rule.rationale,
    };
  }

  if (vocabulary[field].has(normalized)) {
    return {
      sourceField: field,
      sourceTerm,
      targetField: field,
      targetTerms: [normalized],
      disposition: "catalog-identity",
      ruleId: "catalog-identity",
      rationale: `The normalized term already exists in catalog ${field} vocabulary.`,
    };
  }

  throw new AssetQueryGroundingError(
    "unknown-term",
    queryId,
    field,
    sourceTerm,
  );
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function planQuery(
  query: ShooterGameSpec["assetQueries"][number],
  vocabulary: CatalogVocabulary,
): z.infer<typeof GroundedQuerySchema> {
  const terms = [
    groundTerm(query.id, query.category, "theme", query.theme, vocabulary),
    ...query.visualStyle.map((term) =>
      groundTerm(query.id, query.category, "visualStyle", term, vocabulary),
    ),
    ...query.tags.map((term) =>
      groundTerm(query.id, query.category, "tags", term, vocabulary),
    ),
  ];
  const targets = (field: AssetQueryVocabularyField) =>
    unique(
      terms.flatMap((term) =>
        term.targetField === field ? term.targetTerms : [],
      ),
    );
  const grounded = {
    theme: targets("theme").join(" "),
    visualStyle: targets("visualStyle"),
    tags: targets("tags"),
  };
  const parsed = QueryVocabularySchema.safeParse(grounded);
  if (!parsed.success) {
    throw new AssetQueryGroundingError(
      "grounded-query-invalid",
      query.id,
      "theme",
      query.theme,
      parsed.error.issues.map((issue) => issue.message),
    );
  }
  return {
    queryId: query.id,
    original: {
      theme: query.theme,
      visualStyle: [...query.visualStyle],
      tags: [...query.tags],
    },
    grounded: parsed.data,
    terms,
  };
}

export function planAssetQueryGrounding(
  rawSpec: unknown,
  rawCatalog: unknown,
  catalogSha256: string,
): AssetQueryGrounding {
  const spec = parseShooterGameSpec(rawSpec);
  const catalog = parseAssetCatalog(rawCatalog);
  const parsedCatalogSha256 = Sha256Schema.parse(catalogSha256);
  const vocabulary = catalogVocabulary(catalog);
  return AssetQueryGroundingSchema.parse({
    schemaVersion: "1.1.2",
    policyId: "bounded-catalog-grounding-v1.1.2",
    sourceSpec: {
      schemaVersion: spec.schemaVersion,
      sha256: sha256ShooterGameSpec(spec),
    },
    catalog: {
      catalogId: catalog.catalogId,
      path: "assets/corpus/catalog.json",
      sha256: parsedCatalogSha256,
    },
    queries: spec.assetQueries.map((query) => planQuery(query, vocabulary)),
  });
}

export function applyAssetQueryGrounding(
  rawSpec: unknown,
  rawCatalog: unknown,
  catalogSha256: string,
  rawGrounding: unknown,
): ShooterGameSpec {
  const spec = parseShooterGameSpec(rawSpec);
  const grounding = AssetQueryGroundingSchema.parse(rawGrounding);
  const expected = planAssetQueryGrounding(spec, rawCatalog, catalogSha256);
  if (JSON.stringify(grounding) !== JSON.stringify(expected)) {
    throw new AssetQueryGroundingError(
      "binding-mismatch",
      grounding.queries[0]?.queryId ?? spec.assetQueries[0]!.id,
      "theme",
      "artifact",
    );
  }
  return parseShooterGameSpec({
    ...spec,
    assetQueries: spec.assetQueries.map((query, index) => ({
      ...query,
      ...grounding.queries[index]!.grounded,
    })),
  });
}

export function parseAssetQueryGrounding(input: unknown): AssetQueryGrounding {
  return AssetQueryGroundingSchema.parse(input);
}
