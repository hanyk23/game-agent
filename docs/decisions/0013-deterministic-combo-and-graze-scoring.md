# ADR 0013: Deterministic combo and graze scoring

- Status: Accepted
- Date: 2026-07-15

## Context

`ShooterGameSpec.scoring` already carried a combo window, multiplier cap, and
graze points, but the fixed Phaser template ignored all three and added only
base defeat scores. Player and enemy-projectile collisions also used texture
bounds, making transparent or glowing art change gameplay geometry.

## Decision

- Implement scoring as pure immutable state transitions outside Phaser.
- A defeat starts at multiplier 1. Each later defeat within the inclusive combo
  window increments the multiplier by one up to `comboMultiplierCap`; a zero
  window disables chaining. Expired visible combos return to count zero and
  multiplier one without erasing the historical maximum.
- Award `floor(basePoints * multiplier)` for ordinary-enemy and Boss defeats.
  Pickup score bonuses remain flat points and do not start or extend combos.
- Derive the player's circular world-space collision body from
  `player.hitboxRadius`. Give enemy projectiles a circular hit body based on the
  rendered texture's short side so transparent/glowing padding is not lethal.
- A graze occurs once per pooled enemy projectile when its center first enters
  the closed outer edge of an 18-pixel annulus while remaining strictly outside
  the combined player/projectile hit radius. Grazes add `grazePoints` and do not
  extend combos.
- Replace random ordinary-enemy x positions with a pure stable lane planner.
  The first spawn of each wave enters the center lane; later spawns rotate
  deterministic side lanes. Timing, health, caps, and wave identity remain
  unchanged.
- Expose frozen current/historical combo, defeat, graze, and closest-bullet
  evidence in play and end snapshots. Browser verification must prove a capped
  combo and at least one real one-shot graze through keyboard/pointer and touch
  input on desktop and mobile without a mutation bridge.

## Consequences

- Every existing scoring field now has a concrete runtime meaning, including
  fractional multiplier caps and zero-point grazes.
- Asset dimensions no longer silently define the player's critical hitbox or an
  enemy projectile's full lethal rectangle.
- Browser evidence is reproducible because wave lanes and the graze trajectory
  do not depend on Phaser random placement.
- Combo growth currently responds only to defeats. Damage-reset, decay curves,
  graze multipliers, and weapon-specific score rules would require new explicit
  schema fields rather than implicit behavior.

## Evidence

- `src/gameplay/scoring-state.ts`
- `src/gameplay/enemy-wave-scheduler.ts`
- `game-template/vertical-shooter/src/scenes/play-scene.ts`
- `game-template/vertical-shooter/src/scenes/end-scene.ts`
- `game-template/vertical-shooter/src/test-bridge.ts`
- `src/verification/browser-verification-stage.ts`
- `tests/gameplay/scoring-state.test.ts`
- `tests/gameplay/enemy-wave-scheduler.test.ts`
- Packaged run `3187e6be-4702-40ba-a069-80694e470e8b`
