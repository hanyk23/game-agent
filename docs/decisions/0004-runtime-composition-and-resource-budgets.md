# ADR 0004: Build-time runtime composition and centralized resource budgets

- Status: Accepted
- Date: 2026-07-15

## Context

The initial Phaser proof of concept used a hand-authored partial runtime config
and contained a fixed player-projectile pool size. That demonstrated mechanics
but did not connect the Agent's validated `ShooterGameSpec` to the game template.
Running the validator and composer inside the browser also pulled Zod and Agent
code into the H5 bundle.

## Decision

- Compose a complete, locally validated `ShooterGameSpec` into
  `RuntimeGameConfig` before the browser build.
- Keep the browser artifact data-only: it imports generated JSON and does not
  bundle Zod, provider adapters, OpenCode, or the Composer.
- Derive object-pool capacities through one `ResourceBudget` using a named
  `balanced`, `desktop`, or `mobile` safety profile.
- Preserve the Spec's requested values and record every device-profile clamp as
  a structured adjustment instead of silently changing it.
- Derive player-projectile capacity from viewport height, projectile speed,
  weapon fire interval, projectile count, and safety margin.
- Fail closed when a Schema-valid feature is not implemented by the runtime,
  rather than dropping it or approximating it without evidence.

## Consequences

- The Agent-to-template boundary is deterministic and unit-testable without a
  paid model call.
- Scene code consumes centralized budgets instead of capacity magic numbers.
- Safety profiles contain deliberate hard ceilings; per-game values remain Spec
  driven below those ceilings.
- Generated runtime JSON becomes a reviewed build input and has a deterministic
  source Spec.
- The current Composer rejects later pattern types and non-Boss win conditions
  until the corresponding stable runtime modules exist.
