import type { ShooterGameSpec } from "../requirements/shooter-game-spec.js";

export type ResourceProfile = "balanced" | "desktop" | "mobile";

export type ResourceBudget = Readonly<{
  profile: ResourceProfile;
  maxEnemyBullets: number;
  maxPlayerBullets: number;
  maxEnemies: number;
  maxPickups: number;
  maxEffects: number;
  maxEnemyBulletSpawnsPerSecond: number;
}>;

export type ResourceBudgetAdjustment = Readonly<{
  field: keyof Omit<ResourceBudget, "profile">;
  requested: number;
  effective: number;
  reason: "device-profile-cap";
}>;

export type ResourceBudgetResult = Readonly<{
  budget: ResourceBudget;
  adjustments: readonly ResourceBudgetAdjustment[];
}>;

type ResourceCaps = {
  -readonly [
    Field in keyof Omit<ResourceBudget, "profile">
  ]: ResourceBudget[Field];
};

const RESOURCE_CAPS: Record<ResourceProfile, ResourceCaps> = {
  balanced: {
    maxEnemyBullets: 260,
    maxPlayerBullets: 128,
    maxEnemies: 40,
    maxPickups: 24,
    maxEffects: 160,
    maxEnemyBulletSpawnsPerSecond: 240,
  },
  desktop: {
    maxEnemyBullets: 600,
    maxPlayerBullets: 256,
    maxEnemies: 80,
    maxPickups: 48,
    maxEffects: 320,
    maxEnemyBulletSpawnsPerSecond: 500,
  },
  mobile: {
    maxEnemyBullets: 180,
    maxPlayerBullets: 96,
    maxEnemies: 32,
    maxPickups: 20,
    maxEffects: 120,
    maxEnemyBulletSpawnsPerSecond: 180,
  },
};

function estimatePlayerBulletDemand(spec: ShooterGameSpec): number {
  const simultaneousDemand = spec.weapons.reduce((total, weapon) => {
    const screenTravelMs =
      (spec.viewport.logicalHeight / weapon.projectileSpeed) * 1_000;
    const activeShots = Math.ceil(screenTravelMs / weapon.fireIntervalMs);
    return total + activeShots * weapon.projectileCount;
  }, 0);
  return Math.max(16, Math.ceil(simultaneousDemand * 1.5));
}

function estimateEnemySpawnRate(spec: ShooterGameSpec): number {
  return Math.ceil(
    Math.max(
      ...spec.bulletPatterns.map(
        (pattern) => (pattern.bulletCount * 1_000) / pattern.intervalMs,
      ),
    ),
  );
}

export function deriveResourceBudget(
  spec: ShooterGameSpec,
  profile: ResourceProfile = "balanced",
): ResourceBudgetResult {
  const caps = RESOURCE_CAPS[profile];
  const requested: ResourceCaps = {
    maxEnemyBullets: spec.viewport.maxEnemyBullets,
    maxPlayerBullets: estimatePlayerBulletDemand(spec),
    maxEnemies: spec.viewport.maxEnemies,
    maxPickups: Math.max(8, spec.pickups.length * 4),
    maxEffects: Math.max(
      32,
      spec.viewport.maxEnemies * 2 + spec.pickups.length * 2,
    ),
    maxEnemyBulletSpawnsPerSecond: estimateEnemySpawnRate(spec),
  };
  const adjustments: ResourceBudgetAdjustment[] = [];

  const effective = {} as ResourceCaps;
  for (const field of Object.keys(caps) as Array<keyof ResourceCaps>) {
    effective[field] = Math.min(requested[field], caps[field]);
    if (effective[field] < requested[field]) {
      adjustments.push({
        field,
        requested: requested[field],
        effective: effective[field],
        reason: "device-profile-cap",
      });
    }
  }

  return {
    budget: Object.freeze({ profile, ...effective }),
    adjustments: Object.freeze(adjustments),
  };
}
