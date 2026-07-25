import type { SupportedBulletPattern } from "../gameplay/bullet-pattern-planner.js";
import type { ShooterGameSpec } from "../requirements/shooter-game-spec.js";
import type {
  ResourceBudget,
  ResourceBudgetAdjustment,
  ResourceProfile,
} from "./resource-budget.js";

export type RuntimeSchedule = Readonly<{
  bossStartMs: number;
  roundTimeLimitMs: number;
}>;

export type RuntimeCompositionMetadata = Readonly<{
  resourceProfile: ResourceProfile;
  budgetAdjustments: readonly ResourceBudgetAdjustment[];
}>;

export type RuntimeResolvedAsset = Readonly<{
  queryId: string;
  category: ShooterGameSpec["assetQueries"][number]["category"];
  assetId: string;
  textureKey: string;
  runtimeUrl: string;
  sourceSha256: string;
  width: number;
  height: number;
}>;

export type RuntimeResolvedAssetMap =
  | Readonly<{ mode: "legacy-geometric" }>
  | Readonly<{
      mode: "catalog";
      catalogId: string;
      catalogSha256: string;
      backgroundQueryId: string;
      enemyProjectileQueryId: string;
      uiQueryId?: string;
      effectQueryId?: string;
      selections: readonly RuntimeResolvedAsset[];
    }>;

export type RuntimeGameConfig = Omit<ShooterGameSpec, "bulletPatterns"> & {
  bulletPatterns: SupportedBulletPattern[];
  resourceBudget: ResourceBudget;
  schedule: RuntimeSchedule;
  composition: RuntimeCompositionMetadata;
  resolvedAssets: RuntimeResolvedAssetMap;
};
