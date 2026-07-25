# ADR 0014: Generic deterministic game-outcome execution

- Status: Accepted
- Date: 2026-07-15

## Context

`ShooterGameSpec` supports three win conditions (`bossDefeated`, `surviveMs`,
and `scoreReached`) and two loss conditions (`healthDepleted` and
`timeExpired`). The Composer previously rejected alternative wins, while the
Phaser scene hard-coded Boss victory, health defeat, and a separate timer
defeat in different callbacks. Valid Spec data therefore did not have one
runtime meaning or one deterministic precedence rule.

## Decision

- Evaluate every schema condition variant through one pure, dependency-free
  outcome function using elapsed play time, score, player health, and explicit
  Boss-defeat state.
- Make every numeric threshold inclusive. If win and loss become true on the
  same frame, the configured win takes precedence. This makes surviving exactly
  to a time limit a success rather than a frame-order race.
- Remove direct scene-end calls from Boss damage, player damage, and the round
  timer. Those paths update state only; the scene evaluates the complete state
  once per frame and starts the end scene from the returned outcome.
- Preserve the condition reason and elapsed time in frozen play/end evidence.
- Reject only statically unreachable combinations that can be proven: a
  Boss-defeat win whose time limit ends before the Boss starts, and a survival
  target strictly beyond its time-expired loss limit.
- Keep the derived schedule as planning/verification metadata, not an implicit
  extra loss condition.

## Consequences

- Every valid win/loss schema variant now has deterministic runtime semantics.
- Score and survival games may end without defeating the Boss, while Boss
  destruction alone does not end a game configured for another win condition.
- Threshold checks can overshoot by at most one rendered frame, and the exact
  observed elapsed value is retained as evidence.
- Adding a new condition requires extending the closed condition types, pure
  evaluator, Composer reachability checks where possible, and tests.

## Evidence

- `src/gameplay/game-outcome.ts`
- `game-template/vertical-shooter/src/scenes/play-scene.ts`
- `game-template/vertical-shooter/src/scenes/end-scene.ts`
- `game-template/vertical-shooter/src/test-bridge.ts`
- `tests/gameplay/game-outcome.test.ts`
- `tests/runtime/shooter-game-composer.test.ts`
- Browser run `3d9bdcb0-fe7a-4bdc-b186-afb572ed100b`
