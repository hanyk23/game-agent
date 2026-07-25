import type { ShooterGameSpec } from "../requirements/shooter-game-spec.js";
import type { SupportedBulletPattern } from "./bullet-pattern-planner.js";

type EnemyWave = ShooterGameSpec["enemyWaves"][number];

export type ScheduledEnemyPattern = Readonly<{
  wavePatternIndex: number;
  patternIndex: number;
  patternId: string;
  intervalMs: number;
  durationMs: number;
  emissionCount: number;
}>;

export function planEnemyPatternSchedule(
  wave: EnemyWave,
  patterns: readonly SupportedBulletPattern[],
): readonly ScheduledEnemyPattern[] {
  const patternIndexById = new Map(
    patterns.map((pattern, patternIndex) => [pattern.id, patternIndex]),
  );
  return Object.freeze(
    wave.patternIds.map((patternId, wavePatternIndex) => {
      const patternIndex = patternIndexById.get(patternId);
      if (patternIndex === undefined) {
        throw new Error(
          `Missing enemy-wave bullet pattern for ${wave.id}: ${patternId}`,
        );
      }
      const pattern = patterns[patternIndex]!;
      return Object.freeze({
        wavePatternIndex,
        patternIndex,
        patternId,
        intervalMs: pattern.intervalMs,
        durationMs: pattern.durationMs,
        emissionCount: Math.floor(pattern.durationMs / pattern.intervalMs) + 1,
      });
    }),
  );
}
