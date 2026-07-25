import type { ShooterGameSpec } from "../requirements/shooter-game-spec.js";

type ShooterBulletPattern = ShooterGameSpec["bulletPatterns"][number];

export type SupportedBulletPattern = ShooterBulletPattern;

export type BulletEmissionLimits = {
  maxActiveBullets: number;
  currentActiveBullets: number;
};

export type BulletEmissionContext = BulletEmissionLimits & {
  baseAngleRadians: number;
  emissionIndex: number;
};

export type PlannedBulletSpawn = {
  angleRadians: number;
  velocityX: number;
  velocityY: number;
  spawnOffsetMs: number;
};

export type BulletEmissionPlan = {
  patternId: string;
  requestedCount: number;
  droppedCount: number;
  spawns: PlannedBulletSpawn[];
};

function assertFiniteNonNegativeInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative integer.`);
  }
}

function angleForPattern(
  pattern: SupportedBulletPattern,
  bulletIndex: number,
  context: BulletEmissionContext,
): number {
  if (pattern.pattern === "fan") {
    if (pattern.arcDegrees === undefined) {
      throw new RangeError("Fan patterns require arcDegrees.");
    }
    return fanAngle(
      context.baseAngleRadians,
      (pattern.arcDegrees * Math.PI) / 180,
      pattern.bulletCount,
      bulletIndex,
    );
  }
  if (pattern.pattern === "aimed") {
    return fanAngle(
      context.baseAngleRadians,
      degrees(pattern.aimSpreadDegrees ?? 0),
      pattern.bulletCount,
      bulletIndex,
    );
  }
  if (pattern.pattern === "wave") {
    const arc = degrees(pattern.aimSpreadDegrees ?? 30);
    const center =
      context.baseAngleRadians +
      Math.sin((context.emissionIndex * Math.PI) / 2) * (arc / 2);
    return fanAngle(center, arc, pattern.bulletCount, bulletIndex);
  }
  if (pattern.pattern === "rain") {
    return fanAngle(
      context.baseAngleRadians,
      degrees(pattern.aimSpreadDegrees ?? 45),
      pattern.bulletCount,
      bulletIndex,
    );
  }
  if (pattern.pattern === "burst") {
    return fanAngle(
      context.baseAngleRadians,
      degrees(pattern.aimSpreadDegrees ?? 12),
      pattern.bulletCount,
      bulletIndex,
    );
  }

  const rotation =
    pattern.pattern === "spiral"
      ? context.emissionIndex * requireRotationSpeed(pattern)
      : pattern.pattern === "rotatingRing"
        ? context.emissionIndex * (pattern.rotationSpeed ?? 0.15)
        : 0;
  return (
    context.baseAngleRadians +
    rotation +
    (Math.PI * 2 * bulletIndex) / pattern.bulletCount
  );
}

function degrees(value: number): number {
  return (value * Math.PI) / 180;
}

function fanAngle(
  center: number,
  arcRadians: number,
  bulletCount: number,
  bulletIndex: number,
): number {
  if (bulletCount === 1) return center;
  return (
    center - arcRadians / 2 + (arcRadians * bulletIndex) / (bulletCount - 1)
  );
}

function requireRotationSpeed(pattern: SupportedBulletPattern): number {
  if (pattern.rotationSpeed === undefined) {
    throw new RangeError("Spiral patterns require rotationSpeed.");
  }
  return pattern.rotationSpeed;
}

export function planBulletEmission(
  pattern: SupportedBulletPattern,
  context: BulletEmissionContext,
): BulletEmissionPlan {
  assertFiniteNonNegativeInteger(context.emissionIndex, "emissionIndex");
  assertFiniteNonNegativeInteger(context.maxActiveBullets, "maxActiveBullets");
  assertFiniteNonNegativeInteger(
    context.currentActiveBullets,
    "currentActiveBullets",
  );
  if (!Number.isFinite(context.baseAngleRadians)) {
    throw new RangeError("baseAngleRadians must be finite.");
  }
  if (context.currentActiveBullets > context.maxActiveBullets) {
    throw new RangeError(
      "currentActiveBullets cannot exceed maxActiveBullets.",
    );
  }

  const available = context.maxActiveBullets - context.currentActiveBullets;
  const plannedCount = Math.min(pattern.bulletCount, available);
  const spawnOffsetMs = context.emissionIndex * pattern.intervalMs;
  const spawns = Array.from({ length: plannedCount }, (_, bulletIndex) => {
    const angleRadians = angleForPattern(pattern, bulletIndex, context);
    return {
      angleRadians,
      velocityX: Math.cos(angleRadians) * pattern.speed,
      velocityY: Math.sin(angleRadians) * pattern.speed,
      spawnOffsetMs,
    };
  });

  return {
    patternId: pattern.id,
    requestedCount: pattern.bulletCount,
    droppedCount: pattern.bulletCount - spawns.length,
    spawns,
  };
}
