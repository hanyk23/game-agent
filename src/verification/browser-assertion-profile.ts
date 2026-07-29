import { z } from "zod";

import type { ShooterGameSpec } from "../requirements/shooter-game-spec.js";

export const BrowserAssertionProfileSchema = z.discriminatedUnion("profileId", [
  z.strictObject({
    profileVersion: z.literal("1.0.0"),
    profileId: z.literal("comprehensive-v1"),
  }),
  z.strictObject({
    profileVersion: z.literal("1.0.0"),
    profileId: z.literal("case-aware-v1"),
  }),
]);

const ExpectedOutcomeSchema = z.discriminatedUnion("reason", [
  z.strictObject({
    won: z.literal(true),
    reason: z.literal("bossDefeated"),
  }),
  z.strictObject({
    won: z.literal(true),
    reason: z.literal("surviveMs"),
    targetMs: z.number().int().min(10_000),
  }),
  z.strictObject({
    won: z.literal(true),
    reason: z.literal("scoreReached"),
    targetScore: z.number().int().positive(),
  }),
]);

const RequiredWaveSchema = z.strictObject({
  id: z.string().min(1),
  patternIds: z.array(z.string().min(1)),
});

export const CaseAwareBrowserAssertionsSchema = z.strictObject({
  assertionVersion: z.literal("1.0.0"),
  expectedOutcome: ExpectedOutcomeSchema,
  expectedWeaponIds: z.array(z.string().min(1)).min(1),
  // S7 — a spec that legitimately schedules no wave inside the win horizon
  // must not be forced to have one. The list may be empty; every wave that IS
  // declared here is still validated by caseAwarePlaySnapshotIssues below.
  requiredWaves: z.array(RequiredWaveSchema).min(0),
  requiredBossPatternIds: z.array(z.string().min(1)),
  requiredPickupIds: z.array(z.string().min(1)),
  scoring: z.strictObject({
    comboWindowMs: z.number().int().nonnegative(),
    comboMultiplierCap: z.number().min(1),
    grazePoints: z.number().int().nonnegative(),
  }),
  assets: z.strictObject({
    expectedMode: z.enum(["legacy-geometric", "catalog"]),
    requireEveryExpectedTextureUsed: z.boolean(),
    minimumUsedTextureCount: z.number().int().nonnegative(),
  }),
  playEvidenceTimeoutMs: z.number().int().min(1_000).max(120_000),
  outcomeTimeoutMs: z.number().int().min(1_000).max(120_000),
});

export type BrowserAssertionProfile = z.infer<
  typeof BrowserAssertionProfileSchema
>;
export type CaseAwareBrowserAssertions = z.infer<
  typeof CaseAwareBrowserAssertionsSchema
>;

type CaseAwarePlaySnapshot = Readonly<{
  scene: "play";
  activeEnemyBullets: number;
  maxEnemyBullets: number;
  peakActiveEnemyBullets: number;
  activePlayerBullets: number;
  maxPlayerBullets: number;
  activeEnemies: number;
  activePickups: number;
  maxPickups: number;
  scoring: Readonly<{
    comboWindowMs: number;
    comboMultiplierCap: number;
    grazePoints: number;
  }>;
  weapons: ReadonlyArray<{
    id: string;
    fireAttempts: number;
    successfulProjectiles: number;
    droppedProjectiles: number;
    maxProjectilesPerFire: number;
    projectileCount: number;
    projectileSpeed: number;
    lastProjectileSpeed: number | null;
  }>;
  enemyWaves: ReadonlyArray<{
    id: string;
    started: boolean;
    successfulSpawns: number;
    patterns: ReadonlyArray<{
      id: string;
      emitterCount: number;
      emissionAttempts: number;
      successfulSpawns: number;
      droppedByPool: number;
      movedBullets: number;
      minimumAimErrorRadians: number | null;
      pattern: string;
    }>;
  }>;
  bulletPatterns: ReadonlyArray<{
    id: string;
    emissionAttempts: number;
    successfulSpawns: number;
    droppedByPool: number;
    movedBullets: number;
    minimumAimErrorRadians: number | null;
    pattern: string;
  }>;
  pickups: ReadonlyArray<{
    id: string;
    successfulSpawns: number;
    droppedByBudget: number;
    collections: number;
  }>;
  assets: Readonly<{
    mode: "legacy-geometric" | "catalog";
    expectedTextureKeys: readonly string[];
    loadedTextureKeys: readonly string[];
    usedTextureKeys: readonly string[];
  }>;
}>;

type CaseAwareEndSnapshot = Readonly<{
  scene: "end";
  won: boolean;
  outcomeReason:
    | "bossDefeated"
    | "surviveMs"
    | "scoreReached"
    | "healthDepleted"
    | "timeExpired";
  elapsedMs: number;
  score: number;
  scoring: Readonly<{
    comboWindowMs: number;
    comboMultiplierCap: number;
    grazePoints: number;
  }>;
}>;

function outcomeFor(spec: ShooterGameSpec) {
  if (spec.winCondition.type === "surviveMs") {
    return {
      won: true as const,
      reason: "surviveMs" as const,
      targetMs: spec.winCondition.targetMs,
    };
  }
  if (spec.winCondition.type === "scoreReached") {
    return {
      won: true as const,
      reason: "scoreReached" as const,
      targetScore: spec.winCondition.targetScore,
    };
  }
  return { won: true as const, reason: "bossDefeated" as const };
}

function requiredWaves(spec: ShooterGameSpec) {
  if (spec.winCondition.type === "scoreReached") {
    const earliestStart = Math.min(
      ...spec.enemyWaves.map((wave) => wave.startMs),
    );
    return spec.enemyWaves.filter((wave) => wave.startMs === earliestStart);
  }
  const horizon =
    spec.winCondition.type === "surviveMs"
      ? spec.winCondition.targetMs
      : Number.POSITIVE_INFINITY;
  return spec.enemyWaves.filter((wave) => wave.startMs < horizon);
}

function outcomeTimeoutMs(spec: ShooterGameSpec): number {
  if (spec.winCondition.type === "surviveMs") {
    return Math.min(spec.winCondition.targetMs + 8_000, 120_000);
  }
  if (spec.loseCondition.type === "timeExpired") {
    return Math.min(spec.loseCondition.limitMs + 5_000, 120_000);
  }
  return spec.winCondition.type === "scoreReached" ? 30_000 : 45_000;
}

function playEvidenceTimeoutMs(spec: ShooterGameSpec): number {
  if (spec.winCondition.type === "scoreReached") return 10_000;
  if (spec.winCondition.type !== "bossDefeated") return 20_000;
  const latestWaveEndMs = Math.max(
    ...spec.enemyWaves.map((wave) => wave.startMs + wave.durationMs),
  );
  const weaponPowerBonus = spec.pickups
    .filter((pickup) => pickup.effect === "weaponPower")
    .reduce((total, pickup) => total + pickup.value, 0);
  const damagePerSecond = spec.weapons.reduce(
    (total, weapon) =>
      total +
      ((weapon.damage + weaponPowerBonus) * weapon.projectileCount * 1_000) /
        weapon.fireIntervalMs,
    0,
  );
  const finalPhaseThreshold = Math.min(
    ...spec.boss.phases.map((phase) => phase.healthThreshold),
  );
  const phaseDamage =
    spec.boss.maxHealth * (1 - finalPhaseThreshold) +
    Math.max(...spec.weapons.map((weapon) => weapon.damage + weaponPowerBonus));
  const phaseDamageMs = Math.ceil((phaseDamage / damagePerSecond) * 1_000 * 3);
  const projectileTravelMs = Math.ceil(
    (spec.viewport.logicalHeight /
      Math.min(...spec.weapons.map((weapon) => weapon.projectileSpeed))) *
      1_000,
  );
  return Math.min(
    Math.max(
      20_000,
      latestWaveEndMs + phaseDamageMs + projectileTravelMs + 3_000,
    ),
    120_000,
  );
}

export function deriveCaseAwareBrowserAssertions(
  spec: ShooterGameSpec,
  hasCatalogSelection: boolean,
): CaseAwareBrowserAssertions {
  const bossOutcome = spec.winCondition.type === "bossDefeated";
  return CaseAwareBrowserAssertionsSchema.parse({
    assertionVersion: "1.0.0",
    expectedOutcome: outcomeFor(spec),
    expectedWeaponIds: spec.weapons.map((weapon) => weapon.id),
    requiredWaves: requiredWaves(spec).map((wave) => ({
      id: wave.id,
      patternIds: [...wave.patternIds],
    })),
    // S7 — Boss phase evidence is only required when the Spec's win condition
    // is bossDefeated. Without a Boss-defeat outcome we assert nothing about
    // Boss phases (empty list), rather than assuming every game must break a
    // Boss. Pickup evidence follows the same declared-outcome gate.
    requiredBossPatternIds: bossOutcome
      ? spec.boss.phases.flatMap((phase) => phase.patternIds)
      : [],
    requiredPickupIds: bossOutcome
      ? spec.pickups.map((pickup) => pickup.id)
      : [],
    scoring: { ...spec.scoring },
    assets: {
      expectedMode: hasCatalogSelection ? "catalog" : "legacy-geometric",
      requireEveryExpectedTextureUsed:
        hasCatalogSelection && spec.winCondition.type !== "scoreReached",
      minimumUsedTextureCount: hasCatalogSelection ? 5 : 0,
    },
    playEvidenceTimeoutMs: playEvidenceTimeoutMs(spec),
    outcomeTimeoutMs: outcomeTimeoutMs(spec),
  });
}

function patternIssues(
  prefix: string,
  pattern: CaseAwarePlaySnapshot["bulletPatterns"][number] | undefined,
) {
  if (pattern === undefined) return [`${prefix} is missing`];
  const issues: string[] = [];
  if (pattern.emissionAttempts < 1) issues.push(`${prefix} never emitted`);
  if (pattern.successfulSpawns < 1) issues.push(`${prefix} spawned no bullets`);
  if (pattern.movedBullets < 1) issues.push(`${prefix} moved no bullets`);
  if (pattern.droppedByPool !== 0) issues.push(`${prefix} exhausted its pool`);
  if (
    pattern.pattern === "aimed" &&
    (pattern.minimumAimErrorRadians === null ||
      pattern.minimumAimErrorRadians >= 0.000_001)
  ) {
    issues.push(`${prefix} did not aim at the live player`);
  }
  return issues;
}

export function caseAwarePlaySnapshotIssues(
  snapshot: CaseAwarePlaySnapshot,
  assertions: CaseAwareBrowserAssertions,
): string[] {
  const issues: string[] = [];
  if (snapshot.activeEnemyBullets > snapshot.maxEnemyBullets) {
    issues.push("active enemy bullets exceeded the configured cap");
  }
  if (snapshot.peakActiveEnemyBullets > snapshot.maxEnemyBullets) {
    issues.push("peak enemy bullets exceeded the configured cap");
  }
  if (snapshot.activePlayerBullets > snapshot.maxPlayerBullets) {
    issues.push("active player bullets exceeded the configured cap");
  }
  if (snapshot.activePickups > snapshot.maxPickups) {
    issues.push("active pickups exceeded the configured cap");
  }
  if (
    snapshot.scoring.comboWindowMs !== assertions.scoring.comboWindowMs ||
    snapshot.scoring.comboMultiplierCap !==
      assertions.scoring.comboMultiplierCap ||
    snapshot.scoring.grazePoints !== assertions.scoring.grazePoints
  ) {
    issues.push("runtime scoring configuration differs from the Spec");
  }

  for (const weaponId of assertions.expectedWeaponIds) {
    const weapon = snapshot.weapons.find(
      (candidate) => candidate.id === weaponId,
    );
    if (weapon === undefined) {
      issues.push(`weapon ${weaponId} is missing`);
      continue;
    }
    if (
      weapon.fireAttempts < 1 ||
      weapon.successfulProjectiles < 1 ||
      weapon.maxProjectilesPerFire !== weapon.projectileCount ||
      weapon.lastProjectileSpeed !== weapon.projectileSpeed
    ) {
      issues.push(`weapon ${weaponId} did not execute its configured salvo`);
    }
  }

  for (const requiredWave of assertions.requiredWaves) {
    const wave = snapshot.enemyWaves.find(
      (candidate) => candidate.id === requiredWave.id,
    );
    if (wave === undefined || !wave.started || wave.successfulSpawns < 1) {
      issues.push(`wave ${requiredWave.id} did not spawn`);
      continue;
    }
    for (const patternId of requiredWave.patternIds) {
      issues.push(
        ...patternIssues(
          `wave ${requiredWave.id} pattern ${patternId}`,
          wave.patterns.find((pattern) => pattern.id === patternId),
        ),
      );
    }
  }

  for (const patternId of assertions.requiredBossPatternIds) {
    issues.push(
      ...patternIssues(
        `Boss pattern ${patternId}`,
        snapshot.bulletPatterns.find((pattern) => pattern.id === patternId),
      ),
    );
  }
  for (const pickupId of assertions.requiredPickupIds) {
    const pickup = snapshot.pickups.find(
      (candidate) => candidate.id === pickupId,
    );
    if (
      pickup === undefined ||
      pickup.successfulSpawns < 1 ||
      pickup.droppedByBudget !== 0 ||
      pickup.collections < 1
    ) {
      issues.push(`pickup ${pickupId} did not spawn and collect within budget`);
    }
  }

  if (snapshot.assets.mode !== assertions.assets.expectedMode) {
    issues.push("runtime asset mode differs from the evaluation profile");
  } else if (snapshot.assets.mode === "catalog") {
    const expected = new Set(snapshot.assets.expectedTextureKeys);
    const loaded = new Set(snapshot.assets.loadedTextureKeys);
    const used = new Set(snapshot.assets.usedTextureKeys);
    if (expected.size !== snapshot.assets.expectedTextureKeys.length) {
      issues.push("catalog texture expectations contain duplicates");
    }
    if (![...expected].every((textureKey) => loaded.has(textureKey))) {
      issues.push("not every selected catalog texture loaded");
    }
    if (
      assertions.assets.requireEveryExpectedTextureUsed &&
      ![...expected].every((textureKey) => used.has(textureKey))
    ) {
      issues.push("not every applicable catalog texture rendered");
    }
    if (used.size < assertions.assets.minimumUsedTextureCount) {
      issues.push("too few selected catalog textures rendered");
    }
  }
  return issues;
}

export function caseAwareEndSnapshotIssues(
  snapshot: CaseAwareEndSnapshot,
  assertions: CaseAwareBrowserAssertions,
): string[] {
  const issues: string[] = [];
  // S7 — only require a win when the Spec's declared win condition actually
  // asks for one. Today every derived expectedOutcome carries `won: true`
  // (bossDefeated / surviveMs / scoreReached), so this preserves current
  // behavior for those cases while no longer treating "must win" as a
  // universal premise for outcomes that are not win-shaped.
  if (assertions.expectedOutcome.won && !snapshot.won) {
    issues.push("configured evaluation outcome did not win");
  }
  if (snapshot.outcomeReason !== assertions.expectedOutcome.reason) {
    issues.push(
      `expected ${assertions.expectedOutcome.reason} but received ${snapshot.outcomeReason}`,
    );
  }
  if (
    assertions.expectedOutcome.reason === "surviveMs" &&
    snapshot.elapsedMs < assertions.expectedOutcome.targetMs
  ) {
    issues.push("survival outcome ended before its configured target");
  }
  if (
    assertions.expectedOutcome.reason === "scoreReached" &&
    snapshot.score < assertions.expectedOutcome.targetScore
  ) {
    issues.push("score outcome ended below its configured target");
  }
  if (
    snapshot.scoring.comboWindowMs !== assertions.scoring.comboWindowMs ||
    snapshot.scoring.comboMultiplierCap !==
      assertions.scoring.comboMultiplierCap ||
    snapshot.scoring.grazePoints !== assertions.scoring.grazePoints
  ) {
    issues.push("end evidence scoring configuration differs from the Spec");
  }
  return issues;
}
