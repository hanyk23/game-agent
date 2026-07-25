export const DEFAULT_GRAZE_MARGIN = 18;

export type ScoringRules = Readonly<{
  comboWindowMs: number;
  comboMultiplierCap: number;
  grazePoints: number;
}>;

export type ScoringState = Readonly<{
  score: number;
  comboCount: number;
  comboMultiplier: number;
  maxComboMultiplier: number;
  lastDefeatAtMs: number | null;
  defeatCount: number;
  defeatScore: number;
  grazeCount: number;
  grazeScore: number;
}>;

export type DefeatScoreResult = Readonly<{
  state: ScoringState;
  awardedPoints: number;
}>;

function assertFiniteNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a finite non-negative number`);
  }
}

function assertRules(rules: ScoringRules): void {
  assertFiniteNonNegative(rules.comboWindowMs, "comboWindowMs");
  if (
    !Number.isFinite(rules.comboMultiplierCap) ||
    rules.comboMultiplierCap < 1
  ) {
    throw new Error("comboMultiplierCap must be a finite number at least 1");
  }
  assertFiniteNonNegative(rules.grazePoints, "grazePoints");
}

export function createScoringState(): ScoringState {
  return {
    score: 0,
    comboCount: 0,
    comboMultiplier: 1,
    maxComboMultiplier: 1,
    lastDefeatAtMs: null,
    defeatCount: 0,
    defeatScore: 0,
    grazeCount: 0,
    grazeScore: 0,
  };
}

export function awardDefeatScore(
  rules: ScoringRules,
  state: ScoringState,
  basePoints: number,
  atMs: number,
): DefeatScoreResult {
  assertRules(rules);
  assertFiniteNonNegative(basePoints, "basePoints");
  assertFiniteNonNegative(atMs, "atMs");
  if (state.lastDefeatAtMs !== null && atMs < state.lastDefeatAtMs) {
    throw new Error("defeat timestamps must be monotonic");
  }
  const continuesCombo =
    rules.comboWindowMs > 0 &&
    state.lastDefeatAtMs !== null &&
    atMs - state.lastDefeatAtMs <= rules.comboWindowMs;
  const comboCount = continuesCombo ? state.comboCount + 1 : 1;
  const comboMultiplier = Math.min(rules.comboMultiplierCap, comboCount);
  const awardedPoints = Math.floor(basePoints * comboMultiplier);
  return {
    awardedPoints,
    state: {
      ...state,
      score: state.score + awardedPoints,
      comboCount,
      comboMultiplier,
      maxComboMultiplier: Math.max(state.maxComboMultiplier, comboMultiplier),
      lastDefeatAtMs: atMs,
      defeatCount: state.defeatCount + 1,
      defeatScore: state.defeatScore + awardedPoints,
    },
  };
}

export function expireCombo(
  rules: ScoringRules,
  state: ScoringState,
  atMs: number,
): ScoringState {
  assertRules(rules);
  assertFiniteNonNegative(atMs, "atMs");
  if (state.lastDefeatAtMs !== null && atMs < state.lastDefeatAtMs) {
    throw new Error("combo expiry timestamp cannot precede the last defeat");
  }
  if (
    state.comboCount === 0 ||
    (rules.comboWindowMs > 0 &&
      state.lastDefeatAtMs !== null &&
      atMs - state.lastDefeatAtMs <= rules.comboWindowMs)
  ) {
    return state;
  }
  return {
    ...state,
    comboCount: 0,
    comboMultiplier: 1,
    lastDefeatAtMs: null,
  };
}

export function awardGrazeScore(
  rules: ScoringRules,
  state: ScoringState,
): ScoringState {
  assertRules(rules);
  return {
    ...state,
    score: state.score + rules.grazePoints,
    grazeCount: state.grazeCount + 1,
    grazeScore: state.grazeScore + rules.grazePoints,
  };
}

export function awardFlatScore(
  state: ScoringState,
  points: number,
): ScoringState {
  assertFiniteNonNegative(points, "points");
  if (points === 0) return state;
  return { ...state, score: state.score + points };
}

export function isGrazeContact(
  input: Readonly<{
    playerX: number;
    playerY: number;
    playerHitboxRadius: number;
    bulletX: number;
    bulletY: number;
    bulletRadius: number;
    grazeMargin?: number;
  }>,
): boolean {
  for (const [name, value] of Object.entries(input)) {
    if (value !== undefined && !Number.isFinite(value)) {
      throw new Error(`${name} must be finite`);
    }
  }
  assertFiniteNonNegative(input.playerHitboxRadius, "playerHitboxRadius");
  assertFiniteNonNegative(input.bulletRadius, "bulletRadius");
  const grazeMargin = input.grazeMargin ?? DEFAULT_GRAZE_MARGIN;
  assertFiniteNonNegative(grazeMargin, "grazeMargin");
  const collisionRadius = input.playerHitboxRadius + input.bulletRadius;
  const grazeRadius = collisionRadius + grazeMargin;
  const deltaX = input.playerX - input.bulletX;
  const deltaY = input.playerY - input.bulletY;
  const distanceSquared = deltaX * deltaX + deltaY * deltaY;
  return (
    distanceSquared > collisionRadius * collisionRadius &&
    distanceSquared <= grazeRadius * grazeRadius
  );
}
