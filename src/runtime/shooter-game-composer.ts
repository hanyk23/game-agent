import type { SupportedBulletPattern } from "../gameplay/bullet-pattern-planner.js";
import {
  parseAssetSelectionPlan,
  type AssetSelectionPlan,
} from "../assets/asset-selection-plan.js";
import {
  parseShooterGameSpec,
  type ShooterGameSpec,
} from "../requirements/shooter-game-spec.js";
import {
  deriveResourceBudget,
  type ResourceProfile,
} from "./resource-budget.js";
import type {
  RuntimeGameConfig,
  RuntimeResolvedAssetMap,
  RuntimeSchedule,
} from "./runtime-game-config.js";

export class ShooterGameCompositionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShooterGameCompositionError";
  }
}

export type ShooterGameComposerOptions = {
  resourceProfile?: ResourceProfile;
  assetSelection?: AssetSelectionPlan;
};

function resolveRoleQuery(
  spec: ShooterGameSpec,
  category: "background" | "enemy-projectile",
): string {
  const query = spec.assetQueries.find(
    (candidate) => candidate.category === category,
  );
  if (query === undefined) {
    throw new ShooterGameCompositionError(
      `Catalog asset mode requires a ${category} asset query.`,
    );
  }
  return query.id;
}

function resolveOptionalRoleQuery(
  spec: ShooterGameSpec,
  category: "ui" | "effect",
): string | undefined {
  return spec.assetQueries.find((candidate) => candidate.category === category)
    ?.id;
}

export function assertCatalogAssetQueryCoverage(
  rawSpec: unknown,
): ShooterGameSpec {
  const spec = parseShooterGameSpec(rawSpec);
  resolveRoleQuery(spec, "background");
  resolveRoleQuery(spec, "enemy-projectile");
  return spec;
}

function composeResolvedAssets(
  spec: ShooterGameSpec,
  rawSelection: AssetSelectionPlan | undefined,
): RuntimeResolvedAssetMap {
  if (rawSelection === undefined) return { mode: "legacy-geometric" };

  assertCatalogAssetQueryCoverage(spec);
  const selection = parseAssetSelectionPlan(rawSelection);
  if (selection.selections.length !== spec.assetQueries.length) {
    throw new ShooterGameCompositionError(
      "Asset selection must resolve every Spec asset query exactly once.",
    );
  }

  const selections = selection.selections.map((selected, index) => {
    const query = spec.assetQueries[index];
    if (
      query === undefined ||
      selected.queryId !== query.id ||
      selected.category !== query.category
    ) {
      throw new ShooterGameCompositionError(
        "Asset selection order and categories must exactly match the Spec queries.",
      );
    }
    return {
      queryId: selected.queryId,
      category: selected.category,
      assetId: selected.selectedAssetId,
      textureKey: `catalog-${selected.selectedAssetId}`,
      runtimeUrl: selected.materialization.runtimeUrl,
      sourceSha256: selected.sourceFile.sha256,
      width: selected.sourceFile.width,
      height: selected.sourceFile.height,
    };
  });

  const uiQueryId = resolveOptionalRoleQuery(spec, "ui");
  const effectQueryId = resolveOptionalRoleQuery(spec, "effect");
  return {
    mode: "catalog",
    catalogId: selection.catalog.catalogId,
    catalogSha256: selection.catalog.sha256,
    backgroundQueryId: resolveRoleQuery(spec, "background"),
    enemyProjectileQueryId: resolveRoleQuery(spec, "enemy-projectile"),
    ...(uiQueryId === undefined ? {} : { uiQueryId }),
    ...(effectQueryId === undefined ? {} : { effectQueryId }),
    selections,
  };
}

function deriveSchedule(spec: ShooterGameSpec): RuntimeSchedule {
  const bossStartMs = Math.max(
    ...spec.enemyWaves.map((wave) => wave.startMs + wave.durationMs),
  );
  if (spec.loseCondition.type === "timeExpired") {
    if (
      spec.winCondition.type === "bossDefeated" &&
      spec.loseCondition.limitMs <= bossStartMs
    ) {
      throw new ShooterGameCompositionError(
        "The time-expired limit must leave time for the boss encounter.",
      );
    }
    if (
      spec.winCondition.type === "surviveMs" &&
      spec.winCondition.targetMs > spec.loseCondition.limitMs
    ) {
      throw new ShooterGameCompositionError(
        "The survive target cannot exceed the time-expired limit.",
      );
    }
    return { bossStartMs, roundTimeLimitMs: spec.loseCondition.limitMs };
  }

  if (spec.winCondition.type === "surviveMs") {
    return { bossStartMs, roundTimeLimitMs: spec.winCondition.targetMs };
  }

  const bestDamagePerMs = Math.max(
    ...spec.weapons.map(
      (weapon) =>
        (weapon.damage * weapon.projectileCount) / weapon.fireIntervalMs,
    ),
  );
  const estimatedBossFightMs = Math.ceil(spec.boss.maxHealth / bestDamagePerMs);
  const bossWindowMs = Math.min(
    180_000,
    Math.max(30_000, estimatedBossFightMs * 2),
  );
  return {
    bossStartMs,
    roundTimeLimitMs: Math.min(900_000, bossStartMs + bossWindowMs),
  };
}

export function composeShooterGame(
  input: unknown,
  options: ShooterGameComposerOptions = {},
): RuntimeGameConfig {
  const spec = parseShooterGameSpec(input);
  const resourceProfile = options.resourceProfile ?? "balanced";
  const resourceResult = deriveResourceBudget(spec, resourceProfile);
  const cloned = structuredClone(spec);

  return {
    ...cloned,
    bulletPatterns: cloned.bulletPatterns as SupportedBulletPattern[],
    resourceBudget: resourceResult.budget,
    schedule: deriveSchedule(spec),
    composition: {
      resourceProfile,
      budgetAdjustments: resourceResult.adjustments,
    },
    resolvedAssets: composeResolvedAssets(spec, options.assetSelection),
  };
}
