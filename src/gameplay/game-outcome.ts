export type RuntimeWinCondition =
  | Readonly<{ type: "bossDefeated" }>
  | Readonly<{ type: "surviveMs"; targetMs: number }>
  | Readonly<{ type: "scoreReached"; targetScore: number }>;

export type RuntimeLoseCondition =
  | Readonly<{ type: "healthDepleted" }>
  | Readonly<{ type: "timeExpired"; limitMs: number }>;

export type GameOutcomeState = Readonly<{
  elapsedMs: number;
  score: number;
  playerHealth: number;
  bossDefeated: boolean;
}>;

export type GameOutcomeReason =
  RuntimeWinCondition["type"] | RuntimeLoseCondition["type"];

export type GameOutcome = Readonly<{
  won: boolean;
  reason: GameOutcomeReason;
  elapsedMs: number;
}>;

function assertState(state: GameOutcomeState): void {
  if (!Number.isFinite(state.elapsedMs) || state.elapsedMs < 0) {
    throw new Error("elapsedMs must be a finite non-negative number");
  }
  if (!Number.isFinite(state.score) || state.score < 0) {
    throw new Error("score must be a finite non-negative number");
  }
  if (!Number.isFinite(state.playerHealth)) {
    throw new Error("playerHealth must be finite");
  }
}

function winReason(
  condition: RuntimeWinCondition,
  state: GameOutcomeState,
): RuntimeWinCondition["type"] | null {
  switch (condition.type) {
    case "bossDefeated":
      return state.bossDefeated ? condition.type : null;
    case "surviveMs":
      return state.elapsedMs >= condition.targetMs ? condition.type : null;
    case "scoreReached":
      return state.score >= condition.targetScore ? condition.type : null;
  }
}

function loseReason(
  condition: RuntimeLoseCondition,
  state: GameOutcomeState,
): RuntimeLoseCondition["type"] | null {
  switch (condition.type) {
    case "healthDepleted":
      return state.playerHealth <= 0 ? condition.type : null;
    case "timeExpired":
      return state.elapsedMs >= condition.limitMs ? condition.type : null;
  }
}

export function evaluateGameOutcome(
  winCondition: RuntimeWinCondition,
  loseCondition: RuntimeLoseCondition,
  state: GameOutcomeState,
): GameOutcome | null {
  assertState(state);

  // Reaching both inclusive thresholds on the same frame counts as success.
  const achievedWin = winReason(winCondition, state);
  if (achievedWin !== null) {
    return { won: true, reason: achievedWin, elapsedMs: state.elapsedMs };
  }

  const achievedLoss = loseReason(loseCondition, state);
  return achievedLoss === null
    ? null
    : { won: false, reason: achievedLoss, elapsedMs: state.elapsedMs };
}
