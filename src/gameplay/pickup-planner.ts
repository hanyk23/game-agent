export type PickupEffect = "heal" | "weaponPower" | "shield" | "scoreBonus";

export type PickupInput = Readonly<{
  id: string;
  effect: PickupEffect;
  value: number;
}>;

export type ScheduledPickup = Readonly<{
  sourceIndex: number;
  pickupId: string;
  effect: PickupEffect;
  value: number;
  spawnMs: number;
  fallSpeed: number;
}>;

export type PickupEffectState = Readonly<{
  health: number;
  maxHealth: number;
  weaponPowerBonus: number;
  shieldStrength: number;
  score: number;
}>;

export type PickupEffectResult = Readonly<{
  state: PickupEffectState;
  appliedValue: number;
}>;

export type PlayerDamageResult = Readonly<{
  health: number;
  shieldStrength: number;
  absorbedDamage: number;
}>;

const FIRST_PICKUP_MS = 250;
const PICKUP_STAGGER_MS = 250;
const PICKUP_FALL_SPEED = 180;

function assertNonNegativeFinite(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a non-negative finite number.`);
  }
}

function assertPositiveFinite(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be a positive finite number.`);
  }
}

function assertNonNegativeInteger(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer.`);
  }
}

export function planPickupSchedule(
  pickups: readonly PickupInput[],
): readonly ScheduledPickup[] {
  return Object.freeze(
    pickups.map((pickup, sourceIndex) => {
      if (pickup.id.length === 0)
        throw new Error("Pickup id must not be empty.");
      assertPositiveFinite(pickup.value, `${pickup.id}.value`);
      const spawnMs = FIRST_PICKUP_MS + sourceIndex * PICKUP_STAGGER_MS;
      if (!Number.isSafeInteger(spawnMs)) {
        throw new Error(`${pickup.id} schedule exceeds safe integers.`);
      }
      return Object.freeze({
        sourceIndex,
        pickupId: pickup.id,
        effect: pickup.effect,
        value: pickup.value,
        spawnMs,
        fallSpeed: PICKUP_FALL_SPEED,
      });
    }),
  );
}

export function canSpawnPickup(
  currentActivePickups: number,
  maxActivePickups: number,
): boolean {
  assertNonNegativeInteger(currentActivePickups, "currentActivePickups");
  assertNonNegativeInteger(maxActivePickups, "maxActivePickups");
  if (currentActivePickups > maxActivePickups) {
    throw new Error("currentActivePickups exceeds maxActivePickups.");
  }
  return currentActivePickups < maxActivePickups;
}

export function applyPickupEffect(
  pickup: Pick<PickupInput, "effect" | "value">,
  state: PickupEffectState,
): PickupEffectResult {
  assertPositiveFinite(pickup.value, "pickup.value");
  assertPositiveFinite(state.maxHealth, "state.maxHealth");
  assertNonNegativeFinite(state.health, "state.health");
  assertNonNegativeFinite(state.weaponPowerBonus, "state.weaponPowerBonus");
  assertNonNegativeFinite(state.shieldStrength, "state.shieldStrength");
  assertNonNegativeFinite(state.score, "state.score");
  if (state.health > state.maxHealth) {
    throw new Error("state.health exceeds state.maxHealth.");
  }

  const next = { ...state };
  let appliedValue = pickup.value;
  switch (pickup.effect) {
    case "heal":
      next.health = Math.min(state.maxHealth, state.health + pickup.value);
      appliedValue = next.health - state.health;
      break;
    case "weaponPower":
      next.weaponPowerBonus += pickup.value;
      break;
    case "shield":
      next.shieldStrength += pickup.value;
      break;
    case "scoreBonus":
      next.score += pickup.value;
      break;
  }
  return Object.freeze({
    state: Object.freeze(next),
    appliedValue,
  });
}

export function applyShieldedPlayerDamage(
  state: Readonly<{ health: number; shieldStrength: number }>,
  incomingDamage: number,
): PlayerDamageResult {
  assertNonNegativeFinite(state.health, "state.health");
  assertNonNegativeFinite(state.shieldStrength, "state.shieldStrength");
  assertPositiveFinite(incomingDamage, "incomingDamage");
  const absorbedDamage = Math.min(state.shieldStrength, incomingDamage);
  return Object.freeze({
    health: Math.max(0, state.health - (incomingDamage - absorbedDamage)),
    shieldStrength: state.shieldStrength - absorbedDamage,
    absorbedDamage,
  });
}
