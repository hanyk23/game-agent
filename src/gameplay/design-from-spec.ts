import type { ShooterGameSpec } from "../requirements/shooter-game-spec.js";
import { planEnemyWaveSchedule } from "./enemy-wave-scheduler.js";
import { planEnemyPatternSchedule } from "./enemy-pattern-scheduler.js";
import {
  GameDesignSchema,
  type DesignOrientation,
  type GameDesign,
} from "./game-design.js";

/**
 * designFromSpec — GameSpec → GameDesign (S4 skeleton).
 *
 * Reads a *validated* ShooterGameSpec and derives gameplay decisions only. It
 * reuses the existing src/gameplay/ planning primitives (enemy-wave-scheduler,
 * enemy-pattern-scheduler) instead of re-deriving schedules, and does not touch
 * any of them. It performs NO winnability self-check (that is downstream S5);
 * the returned design carries a reserved, inert playability extension point.
 *
 * GAP-1: this produces a plain data object; callers persist it as JSON in Node.
 */

/**
 * When the spec omits orientation, downstream defaults to vertical (matching the
 * Spec Agent's auto-completion口径). Design records the resolved value so the
 * decision is explicit and never re-inferred later.
 */
function resolveOrientation(spec: ShooterGameSpec): DesignOrientation {
  if (spec.orientation !== undefined) return spec.orientation;
  return spec.viewport.logicalWidth > spec.viewport.logicalHeight
    ? "horizontal"
    : "vertical";
}

const TENSION_BY_DIFFICULTY: Readonly<
  Record<ShooterGameSpec["difficulty"], number>
> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

export function designFromSpec(spec: ShooterGameSpec): GameDesign {
  const orientation = resolveOrientation(spec);

  // Bullet-pattern composition: distinct kinds in first-seen order.
  const kinds: ShooterGameSpec["bulletPatterns"][number]["pattern"][] = [];
  for (const pattern of spec.bulletPatterns) {
    if (!kinds.includes(pattern.pattern)) kinds.push(pattern.pattern);
  }
  const hasAimedPressure = spec.bulletPatterns.some(
    (pattern) => pattern.pattern === "aimed",
  );

  // Wave structure: reuse the deterministic scheduler for stable windows.
  const scheduled = planEnemyWaveSchedule(
    spec.enemyWaves.map((wave) => ({
      id: wave.id,
      startMs: wave.startMs,
      durationMs: wave.durationMs,
      spawnIntervalMs: wave.spawnIntervalMs,
    })),
  );
  const wavesById = new Map(spec.enemyWaves.map((wave) => [wave.id, wave]));
  const waves = scheduled.map((scheduledWave) => {
    const wave = wavesById.get(scheduledWave.waveId)!;
    const patternSchedule = planEnemyPatternSchedule(wave, spec.bulletPatterns);
    return {
      waveId: scheduledWave.waveId,
      startMs: scheduledWave.startMs,
      endMs: scheduledWave.endMs,
      spawnCount: scheduledWave.spawnCount,
      patternCount: patternSchedule.length,
    };
  });

  // Boss decisions: phase thresholds are already validated as descending.
  const bossPatternIds = new Set<string>();
  for (const phase of spec.boss.phases) {
    for (const patternId of phase.patternIds) bossPatternIds.add(patternId);
  }

  // Coarse difficulty curve: a monotonic tension score per wave, scaled by the
  // declared difficulty. Data-only; tuning/winnability live downstream.
  const baseTension = TENSION_BY_DIFFICULTY[spec.difficulty];
  const tensionByWave = waves.map((_, index) => baseTension + index * 0.5);

  return GameDesignSchema.parse({
    schemaVersion: "1.0.0",
    kind: "game-design",
    orientation,
    hasBoss: true,
    bulletPatterns: {
      kinds,
      totalPatterns: spec.bulletPatterns.length,
      hasAimedPressure,
    },
    waves,
    boss: {
      phaseCount: spec.boss.phases.length,
      phaseThresholds: spec.boss.phases.map((phase) => phase.healthThreshold),
      patternCount: bossPatternIds.size,
    },
    difficultyCurve: {
      declaredDifficulty: spec.difficulty,
      waveCount: waves.length,
      tensionByWave,
    },
    playability: {
      selfCheckPerformed: false,
    },
  } satisfies GameDesign);
}

/**
 * Design artifact落盘 convention (GAP-1): a plain-data envelope wrapping the
 * GameDesign with its source-spec version. Callers serialize this to JSON; this
 * module never performs IO.
 */
export type GameDesignArtifact = Readonly<{
  schemaVersion: "1.0.0";
  kind: "game-design-artifact";
  sourceSpecSchemaVersion: "1.0.0";
  design: GameDesign;
}>;

export function toGameDesignArtifact(
  spec: ShooterGameSpec,
  design: GameDesign,
): GameDesignArtifact {
  return {
    schemaVersion: "1.0.0",
    kind: "game-design-artifact",
    sourceSpecSchemaVersion: spec.schemaVersion,
    design,
  };
}
