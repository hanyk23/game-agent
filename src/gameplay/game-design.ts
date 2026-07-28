import { z } from "zod";

/**
 * GameDesign — the internal design contract for the Design Agent (src/gameplay/).
 *
 * This is a NEW internal design契约, distinct from the external
 * ShooterGameSpec contract (src/requirements/shooter-game-spec.ts). It captures
 * the *gameplay decisions* derived from a validated spec — orientation, whether
 * there is a Boss, the bullet-pattern composition, the wave structure, and a
 * coarse difficulty curve — without re-encoding the entire spec.
 *
 * ⚠ Review note (needs Mira review): this schema introduces a new design-layer
 * contract. It intentionally does not perform winnability self-check (that is a
 * separate downstream task, S5); a reserved `playability` extension point is
 * declared so the self-check can attach later without reshaping this schema.
 */

/** Orientation is a first-class GameDesign decision, mirrored from the spec. */
export const DesignOrientationSchema = z.enum(["vertical", "horizontal"]);

const BULLET_PATTERN_KINDS = [
  "radial",
  "spiral",
  "fan",
  "aimed",
  "wave",
  "rain",
  "rotatingRing",
  "burst",
] as const;

const BulletPatternCompositionSchema = z.strictObject({
  /** Distinct pattern kinds present in the spec, in first-seen order. */
  kinds: z.array(z.enum(BULLET_PATTERN_KINDS)).min(1),
  /** Total number of configured bullet patterns. */
  totalPatterns: z.number().int().min(1),
  /** True when at least one aimed/homing-style pattern is present. */
  hasAimedPressure: z.boolean(),
});

const WaveDesignSchema = z.strictObject({
  waveId: z.string().min(1),
  /** Deterministic activation window derived from the wave scheduler. */
  startMs: z.number().int().min(0),
  endMs: z.number().int().min(0),
  spawnCount: z.number().int().min(0),
  patternCount: z.number().int().min(0),
});

const BossDesignSchema = z.strictObject({
  phaseCount: z.number().int().min(1),
  /** Health thresholds in strictly descending spec order. */
  phaseThresholds: z.array(z.number().min(0).max(1)).min(1),
  /** Total distinct bullet patterns referenced across all phases. */
  patternCount: z.number().int().min(0),
});

const DifficultyCurveSchema = z.strictObject({
  declaredDifficulty: z.enum(["easy", "medium", "hard"]),
  waveCount: z.number().int().min(1),
  /** Coarse monotonic tension score per wave (data-only, for later tuning). */
  tensionByWave: z.array(z.number().min(0)).min(1),
});

/**
 * Reserved, empty-by-default extension point for the future winnability
 * self-check (S5). Keeping it here means the self-check can populate it without
 * a breaking schema change.
 */
const PlayabilityExtensionSchema = z.strictObject({
  /** Whether a winnability self-check has been run. Always false in S4. */
  selfCheckPerformed: z.literal(false),
});

export const GameDesignSchema = z.strictObject({
  schemaVersion: z.literal("1.0.0"),
  kind: z.literal("game-design"),
  orientation: DesignOrientationSchema,
  hasBoss: z.literal(true),
  bulletPatterns: BulletPatternCompositionSchema,
  waves: z.array(WaveDesignSchema).min(1),
  boss: BossDesignSchema,
  difficultyCurve: DifficultyCurveSchema,
  playability: PlayabilityExtensionSchema,
});

export type GameDesign = z.infer<typeof GameDesignSchema>;
export type DesignOrientation = z.infer<typeof DesignOrientationSchema>;

export function parseGameDesign(input: unknown): GameDesign {
  return GameDesignSchema.parse(input);
}

export function validateGameDesign(input: unknown) {
  return GameDesignSchema.safeParse(input);
}
