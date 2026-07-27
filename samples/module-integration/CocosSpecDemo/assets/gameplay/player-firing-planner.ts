export type PlayerWeaponInput = Readonly<{
  id: string;
  fireIntervalMs: number;
  projectileSpeed: number;
  damage: number;
  projectileCount: number;
}>;

export type PlayerWeaponFiringPlan = Readonly<{
  sourceIndex: number;
  weaponId: string;
  fireIntervalMs: number;
  projectileSpeed: number;
  damage: number;
  projectileCount: number;
}>;

export type PlayerProjectileSpawn = Readonly<{
  projectileIndex: number;
  offsetX: number;
  velocityY: number;
  damage: number;
}>;

export type PlayerWeaponEmissionPlan = Readonly<{
  weaponId: string;
  requestedCount: number;
  droppedCount: number;
  spawns: readonly PlayerProjectileSpawn[];
}>;

const PROJECTILE_SPACING = 14;

function assertPositiveFinite(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be a positive finite number.`);
  }
}

function assertPositiveInteger(value: number, field: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive integer.`);
  }
}

function assertNonNegativeInteger(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer.`);
  }
}

/**
 * Preserves Spec order so equal-time Phaser timer callbacks have a stable
 * resource-budget arbitration order.
 */
export function planPlayerFiring(
  weapons: readonly PlayerWeaponInput[],
): readonly PlayerWeaponFiringPlan[] {
  if (weapons.length === 0) throw new Error("At least one weapon is required.");

  return Object.freeze(
    weapons.map((weapon, sourceIndex) => {
      if (weapon.id.length === 0)
        throw new Error("Weapon id must not be empty.");
      assertPositiveInteger(
        weapon.fireIntervalMs,
        `${weapon.id}.fireIntervalMs`,
      );
      assertPositiveFinite(
        weapon.projectileSpeed,
        `${weapon.id}.projectileSpeed`,
      );
      assertPositiveFinite(weapon.damage, `${weapon.id}.damage`);
      assertPositiveInteger(
        weapon.projectileCount,
        `${weapon.id}.projectileCount`,
      );
      return Object.freeze({
        sourceIndex,
        weaponId: weapon.id,
        fireIntervalMs: weapon.fireIntervalMs,
        projectileSpeed: weapon.projectileSpeed,
        damage: weapon.damage,
        projectileCount: weapon.projectileCount,
      });
    }),
  );
}

export function scheduledPlayerFireMs(
  weapon: PlayerWeaponFiringPlan,
  emissionIndex: number,
): number {
  assertNonNegativeInteger(emissionIndex, "emissionIndex");
  const fireMs = (emissionIndex + 1) * weapon.fireIntervalMs;
  if (!Number.isSafeInteger(fireMs)) {
    throw new Error(
      `${weapon.weaponId} firing schedule exceeds safe integers.`,
    );
  }
  return fireMs;
}

/** Plans one budget-bounded salvo without mutating runtime state. */
export function planPlayerWeaponEmission(
  weapon: PlayerWeaponFiringPlan,
  context: Readonly<{
    currentActiveProjectiles: number;
    maxActiveProjectiles: number;
  }>,
): PlayerWeaponEmissionPlan {
  assertNonNegativeInteger(
    context.currentActiveProjectiles,
    "currentActiveProjectiles",
  );
  assertPositiveInteger(context.maxActiveProjectiles, "maxActiveProjectiles");
  if (context.currentActiveProjectiles > context.maxActiveProjectiles) {
    throw new Error("currentActiveProjectiles exceeds maxActiveProjectiles.");
  }

  const plannedCount = Math.min(
    weapon.projectileCount,
    context.maxActiveProjectiles - context.currentActiveProjectiles,
  );
  const spawns = Array.from({ length: plannedCount }, (_, projectileIndex) =>
    Object.freeze({
      projectileIndex,
      offsetX: (projectileIndex - (plannedCount - 1) / 2) * PROJECTILE_SPACING,
      velocityY: -weapon.projectileSpeed,
      damage: weapon.damage,
    }),
  );
  return Object.freeze({
    weaponId: weapon.weaponId,
    requestedCount: weapon.projectileCount,
    droppedCount: weapon.projectileCount - plannedCount,
    spawns: Object.freeze(spawns),
  });
}
