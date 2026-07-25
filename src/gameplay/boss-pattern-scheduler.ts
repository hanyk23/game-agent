import type { ShooterGameSpec } from "../requirements/shooter-game-spec.js";
import type { SupportedBulletPattern } from "./bullet-pattern-planner.js";

type BossPhase = ShooterGameSpec["boss"]["phases"][number];

export type ScheduledBossPattern = Readonly<{
  phasePatternIndex: number;
  patternIndex: number;
  patternId: string;
  intervalMs: number;
  durationMs: number;
  emissionCount: number;
}>;

export function planBossPatternSchedule(
  phase: BossPhase,
  patterns: readonly SupportedBulletPattern[],
): readonly ScheduledBossPattern[] {
  const patternIndexById = new Map(
    patterns.map((pattern, patternIndex) => [pattern.id, patternIndex]),
  );
  return Object.freeze(
    phase.patternIds.map((patternId, phasePatternIndex) => {
      const patternIndex = patternIndexById.get(patternId);
      if (patternIndex === undefined) {
        throw new Error(`Missing Boss bullet pattern: ${patternId}`);
      }
      const pattern = patterns[patternIndex]!;
      return Object.freeze({
        phasePatternIndex,
        patternIndex,
        patternId,
        intervalMs: pattern.intervalMs,
        durationMs: pattern.durationMs,
        emissionCount: Math.floor(pattern.durationMs / pattern.intervalMs) + 1,
      });
    }),
  );
}
