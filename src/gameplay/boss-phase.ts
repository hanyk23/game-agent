export type BossPhaseThreshold = {
  id: string;
  healthThreshold: number;
};

export function selectBossPhaseIndex(
  phases: readonly BossPhaseThreshold[],
  healthRatio: number,
): number {
  if (phases.length === 0) {
    throw new RangeError("At least one boss phase is required.");
  }
  if (!Number.isFinite(healthRatio) || healthRatio < 0 || healthRatio > 1) {
    throw new RangeError("healthRatio must be between 0 and 1.");
  }

  for (let index = 1; index < phases.length; index += 1) {
    const previous = phases[index - 1]!.healthThreshold;
    const current = phases[index]!.healthThreshold;
    if (current >= previous) {
      throw new RangeError(
        "Boss phase health thresholds must be strictly descending.",
      );
    }
  }

  let selectedIndex = 0;
  for (let index = 1; index < phases.length; index += 1) {
    if (healthRatio <= phases[index]!.healthThreshold) {
      selectedIndex = index;
    }
  }
  return selectedIndex;
}
