export type EnemyWaveScheduleInput = Readonly<{
  id: string;
  startMs: number;
  durationMs: number;
  spawnIntervalMs: number;
}>;

export type ScheduledEnemyWave = Readonly<{
  sourceIndex: number;
  waveId: string;
  startMs: number;
  endMs: number;
  spawnIntervalMs: number;
  spawnCount: number;
}>;

const ENEMY_LANE_FRACTIONS = Object.freeze([0.5, 0.25, 0.75, 0.125, 0.875]);

export function planEnemySpawnX(
  viewportWidth: number,
  sourceIndex: number,
  spawnIndex: number,
  margin = 28,
): number {
  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) {
    throw new Error("viewportWidth must be a positive finite number");
  }
  for (const [name, value] of [
    ["sourceIndex", sourceIndex],
    ["spawnIndex", spawnIndex],
  ] as const) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`${name} must be a non-negative integer`);
    }
  }
  if (!Number.isFinite(margin) || margin < 0 || margin * 2 >= viewportWidth) {
    throw new Error("margin must leave a positive horizontal spawn range");
  }
  const laneIndex =
    spawnIndex === 0
      ? 0
      : 1 +
        ((spawnIndex - 1 + sourceIndex * 2) %
          (ENEMY_LANE_FRACTIONS.length - 1));
  const fraction = ENEMY_LANE_FRACTIONS[laneIndex]!;
  return margin + (viewportWidth - margin * 2) * fraction;
}

function assertNonNegativeInteger(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer.`);
  }
}

function assertPositiveInteger(value: number, field: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive integer.`);
  }
}

/**
 * Creates stable, data-only execution windows for every configured enemy wave.
 * A wave is active on [startMs, endMs), with its first spawn attempt at startMs.
 */
export function planEnemyWaveSchedule(
  waves: readonly EnemyWaveScheduleInput[],
): readonly ScheduledEnemyWave[] {
  if (waves.length === 0)
    throw new Error("At least one enemy wave is required.");

  const plans = waves.map((wave, sourceIndex) => {
    if (wave.id.length === 0)
      throw new Error("Enemy wave id must not be empty.");
    assertNonNegativeInteger(wave.startMs, `${wave.id}.startMs`);
    assertPositiveInteger(wave.durationMs, `${wave.id}.durationMs`);
    assertPositiveInteger(wave.spawnIntervalMs, `${wave.id}.spawnIntervalMs`);
    const endMs = wave.startMs + wave.durationMs;
    if (!Number.isSafeInteger(endMs)) {
      throw new Error(`${wave.id} schedule exceeds the safe integer range.`);
    }

    return Object.freeze({
      sourceIndex,
      waveId: wave.id,
      startMs: wave.startMs,
      endMs,
      spawnIntervalMs: wave.spawnIntervalMs,
      spawnCount: Math.ceil(wave.durationMs / wave.spawnIntervalMs),
    });
  });

  plans.sort(
    (left, right) =>
      left.startMs - right.startMs || left.sourceIndex - right.sourceIndex,
  );
  return Object.freeze(plans);
}

export function scheduledEnemySpawnMs(
  wave: ScheduledEnemyWave,
  spawnIndex: number,
): number {
  assertNonNegativeInteger(spawnIndex, "spawnIndex");
  if (spawnIndex >= wave.spawnCount) {
    throw new Error(
      `Spawn index ${spawnIndex} is outside wave ${wave.waveId}'s schedule.`,
    );
  }
  return wave.startMs + spawnIndex * wave.spawnIntervalMs;
}
