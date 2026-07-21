import { z } from "zod";

const SafeIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "must be a lowercase kebab-case identifier",
  );

const HexColorSchema = z
  .string()
  .regex(
    /^#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?$/,
    "must be a 6- or 8-digit hex color",
  );

const AssetCategorySchema = z.enum([
  "player",
  "enemy",
  "boss",
  "background",
  "player-projectile",
  "enemy-projectile",
  "pickup",
  "ui",
  "effect",
]);

export const AssetQuerySchema = z.strictObject({
  id: SafeIdSchema,
  category: AssetCategorySchema,
  theme: z.string().min(1).max(120),
  visualStyle: z.array(z.string().min(1).max(60)).min(1).max(8),
  tags: z.array(z.string().min(1).max(40)).max(16).default([]),
  preferredColors: z.array(HexColorSchema).max(8).default([]),
  requiresTransparency: z.boolean().default(false),
});

const BulletPatternSchema = z.strictObject({
  id: SafeIdSchema,
  pattern: z.enum([
    "radial",
    "spiral",
    "fan",
    "aimed",
    "wave",
    "rain",
    "rotatingRing",
    "burst",
  ]),
  bulletCount: z.number().int().min(1).max(96),
  speed: z.number().min(40).max(640),
  intervalMs: z.number().int().min(80).max(5_000),
  durationMs: z.number().int().min(250).max(120_000),
  color: HexColorSchema,
  rotationSpeed: z.number().min(-4).max(4).optional(),
  arcDegrees: z.number().min(5).max(360).optional(),
  aimSpreadDegrees: z.number().min(0).max(90).optional(),
});

const WeaponSchema = z.strictObject({
  id: SafeIdSchema,
  projectileAssetQueryId: SafeIdSchema,
  fireIntervalMs: z.number().int().min(50).max(2_000),
  projectileSpeed: z.number().min(120).max(1_500),
  damage: z.number().min(0.1).max(100),
  projectileCount: z.number().int().min(1).max(12).default(1),
});

const EnemyWaveSchema = z.strictObject({
  id: SafeIdSchema,
  enemyAssetQueryId: SafeIdSchema,
  startMs: z.number().int().min(0).max(600_000),
  durationMs: z.number().int().min(1_000).max(180_000),
  spawnIntervalMs: z.number().int().min(100).max(10_000),
  maxAlive: z.number().int().min(1).max(80),
  health: z.number().min(1).max(10_000),
  moveSpeed: z.number().min(20).max(600),
  patternIds: z.array(SafeIdSchema).max(6).default([]),
  scoreValue: z.number().int().min(0).max(100_000),
});

const BossPhaseSchema = z.strictObject({
  id: SafeIdSchema,
  healthThreshold: z.number().min(0).max(1),
  patternIds: z.array(SafeIdSchema).min(1).max(8),
  moveSpeed: z.number().min(0).max(500),
});

const WinConditionSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("bossDefeated") }),
  z.strictObject({
    type: z.literal("surviveMs"),
    targetMs: z.number().int().min(10_000).max(900_000),
  }),
  z.strictObject({
    type: z.literal("scoreReached"),
    targetScore: z.number().int().min(1).max(100_000_000),
  }),
]);

const LoseConditionSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("healthDepleted") }),
  z.strictObject({
    type: z.literal("timeExpired"),
    limitMs: z.number().int().min(10_000).max(900_000),
  }),
]);

function addDuplicateIssues(
  values: readonly string[],
  path: PropertyKey[],
  context: z.RefinementCtx,
): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      context.addIssue({
        code: "custom",
        message: `duplicate id: ${value}`,
        path,
      });
    }
    seen.add(value);
  }
}

export const ShooterGameSpecSchema = z
  .strictObject({
    schemaVersion: z.literal("1.0.0"),
    title: z.string().min(1).max(80),
    theme: z.string().min(1).max(120),
    story: z.string().min(1).max(1_000),
    visualStyle: z.array(z.string().min(1).max(60)).min(1).max(8),
    difficulty: z.enum(["easy", "medium", "hard"]),
    viewport: z.strictObject({
      logicalWidth: z.number().int().min(320).max(1_440),
      logicalHeight: z.number().int().min(568).max(2_560),
      maxEnemyBullets: z.number().int().min(20).max(1_000),
      maxEnemies: z.number().int().min(1).max(120),
    }),
    player: z.strictObject({
      assetQueryId: SafeIdSchema,
      maxHealth: z.number().int().min(1).max(60),
      moveSpeed: z.number().min(80).max(800),
      hitboxRadius: z.number().min(2).max(64),
    }),
    weapons: z.array(WeaponSchema).min(1).max(4),
    enemyWaves: z.array(EnemyWaveSchema).min(1).max(20),
    boss: z.strictObject({
      assetQueryId: SafeIdSchema,
      maxHealth: z.number().min(100).max(1_000_000),
      phases: z.array(BossPhaseSchema).min(1).max(6),
      scoreValue: z.number().int().min(1).max(10_000_000),
    }),
    bulletPatterns: z.array(BulletPatternSchema).min(3).max(24),
    pickups: z
      .array(
        z.strictObject({
          id: SafeIdSchema,
          assetQueryId: SafeIdSchema,
          effect: z.enum(["heal", "weaponPower", "shield", "scoreBonus"]),
          value: z.number().min(0.1).max(100_000),
        }),
      )
      .max(12)
      .default([]),
    scoring: z.strictObject({
      comboWindowMs: z.number().int().min(0).max(10_000),
      comboMultiplierCap: z.number().min(1).max(20),
      grazePoints: z.number().int().min(0).max(10_000),
    }),
    winCondition: WinConditionSchema,
    loseCondition: LoseConditionSchema,
    controls: z.strictObject({
      keyboard: z.strictObject({
        up: z
          .array(z.enum(["ArrowUp", "KeyW"]))
          .min(1)
          .max(2),
        down: z
          .array(z.enum(["ArrowDown", "KeyS"]))
          .min(1)
          .max(2),
        left: z
          .array(z.enum(["ArrowLeft", "KeyA"]))
          .min(1)
          .max(2),
        right: z
          .array(z.enum(["ArrowRight", "KeyD"]))
          .min(1)
          .max(2),
        focus: z
          .array(z.enum(["ShiftLeft", "ShiftRight"]))
          .max(2)
          .default([]),
      }),
      touch: z.strictObject({
        mode: z.enum(["drag", "virtualJoystick"]),
        relativeMovement: z.boolean(),
      }),
    }),
    audioStyle: z.strictObject({
      music: z.string().min(1).max(120),
      effects: z.string().min(1).max(120),
    }),
    assetQueries: z.array(AssetQuerySchema).min(5).max(64),
  })
  .superRefine((spec, context) => {
    addDuplicateIssues(
      spec.assetQueries.map((query) => query.id),
      ["assetQueries"],
      context,
    );
    addDuplicateIssues(
      spec.bulletPatterns.map((pattern) => pattern.id),
      ["bulletPatterns"],
      context,
    );
    addDuplicateIssues(
      spec.weapons.map((weapon) => weapon.id),
      ["weapons"],
      context,
    );
    addDuplicateIssues(
      spec.enemyWaves.map((wave) => wave.id),
      ["enemyWaves"],
      context,
    );
    addDuplicateIssues(
      spec.boss.phases.map((phase) => phase.id),
      ["boss", "phases"],
      context,
    );

    const assetIds = new Set(spec.assetQueries.map((query) => query.id));
    const patternIds = new Set(
      spec.bulletPatterns.map((pattern) => pattern.id),
    );

    const assetReferences: Array<{ path: PropertyKey[]; value: string }> = [
      { path: ["player", "assetQueryId"], value: spec.player.assetQueryId },
      { path: ["boss", "assetQueryId"], value: spec.boss.assetQueryId },
      ...spec.weapons.map((weapon, index) => ({
        path: ["weapons", index, "projectileAssetQueryId"],
        value: weapon.projectileAssetQueryId,
      })),
      ...spec.enemyWaves.map((wave, index) => ({
        path: ["enemyWaves", index, "enemyAssetQueryId"],
        value: wave.enemyAssetQueryId,
      })),
      ...spec.pickups.map((pickup, index) => ({
        path: ["pickups", index, "assetQueryId"],
        value: pickup.assetQueryId,
      })),
    ];

    for (const reference of assetReferences) {
      if (!assetIds.has(reference.value)) {
        context.addIssue({
          code: "custom",
          message: `unknown asset query id: ${reference.value}`,
          path: reference.path,
        });
      }
    }

    spec.enemyWaves.forEach((wave, waveIndex) => {
      wave.patternIds.forEach((patternId, patternIndex) => {
        if (!patternIds.has(patternId)) {
          context.addIssue({
            code: "custom",
            message: `unknown bullet pattern id: ${patternId}`,
            path: ["enemyWaves", waveIndex, "patternIds", patternIndex],
          });
        }
      });
    });

    spec.boss.phases.forEach((phase, phaseIndex) => {
      phase.patternIds.forEach((patternId, patternIndex) => {
        if (!patternIds.has(patternId)) {
          context.addIssue({
            code: "custom",
            message: `unknown bullet pattern id: ${patternId}`,
            path: ["boss", "phases", phaseIndex, "patternIds", patternIndex],
          });
        }
      });
    });

    spec.bulletPatterns.forEach((pattern, index) => {
      if (pattern.bulletCount > spec.viewport.maxEnemyBullets) {
        context.addIssue({
          code: "custom",
          message: "one emission cannot exceed the global enemy-bullet budget",
          path: ["bulletPatterns", index, "bulletCount"],
        });
      }
      if (pattern.pattern === "spiral" && pattern.rotationSpeed === undefined) {
        context.addIssue({
          code: "custom",
          message: "spiral patterns require rotationSpeed",
          path: ["bulletPatterns", index, "rotationSpeed"],
        });
      }
      if (pattern.pattern === "fan" && pattern.arcDegrees === undefined) {
        context.addIssue({
          code: "custom",
          message: "fan patterns require arcDegrees",
          path: ["bulletPatterns", index, "arcDegrees"],
        });
      }
    });

    const thresholds = spec.boss.phases.map((phase) => phase.healthThreshold);
    for (let index = 1; index < thresholds.length; index += 1) {
      const previous = thresholds[index - 1];
      const current = thresholds[index];
      if (
        previous !== undefined &&
        current !== undefined &&
        current >= previous
      ) {
        context.addIssue({
          code: "custom",
          message:
            "boss phase healthThreshold values must be strictly descending",
          path: ["boss", "phases", index, "healthThreshold"],
        });
      }
    }
  });

export type ShooterGameSpec = z.infer<typeof ShooterGameSpecSchema>;
export type AssetQuery = z.infer<typeof AssetQuerySchema>;

export function parseShooterGameSpec(input: unknown): ShooterGameSpec {
  return ShooterGameSpecSchema.parse(input);
}

export function validateShooterGameSpec(input: unknown) {
  return ShooterGameSpecSchema.safeParse(input);
}

export function toShooterGameSpecJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(ShooterGameSpecSchema, {
    target: "draft-2020-12",
    unrepresentable: "throw",
  }) as Record<string, unknown>;
}
