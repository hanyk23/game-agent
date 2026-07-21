# ADR 0015: Deterministic bullet-pattern source execution

- Status: Accepted
- Date: 2026-07-16

## Context

`ShooterGameSpec` allows multiple `patternIds` on every Boss phase and ordinary
enemy wave. The runtime originally used only the first Boss pattern and ignored
ordinary-wave patterns, so schema-valid configuration did not have complete
runtime meaning. Pattern timing, source lifecycle, shared budgets, and evidence
also needed one deterministic contract.

## Decision

- Preserve every configured pattern-ID entry in stable array order. Duplicate
  IDs are explicit independent emitters rather than silently deduplicated.
- Give each Boss entry an immediate emission and an independent timer bounded
  by its pattern `intervalMs` and `durationMs`. Stop all phase emitters on phase
  transition, Boss defeat, or scene end.
- Give every successfully spawned ordinary enemy its own emitter for every
  configured wave pattern. Spawn ordinary enemies visibly at the top edge,
  emit immediately, and stop their timers on death, collision, offscreen
  recycling, Boss entry, or scene end.
- Recompute `aimed` direction from the live player position on every emission,
  regardless of whether the source is a Boss or an ordinary enemy.
- Route every source through the same pure bullet planner and globally capped
  pooled enemy-bullet group. No source receives a private capacity exemption.
- Preserve global pattern evidence and add nested wave-to-pattern evidence for
  emitter count, attempts, requested/planned/spawned bullets, budget drops,
  movement, and aimed-angle accuracy through the DEV-only read-only bridge.

## Consequences

- Every configured Boss and ordinary-wave pattern ID now has deterministic
  runtime semantics.
- Timer count is bounded by configured patterns and active enemies; all timers
  are tied to explicit source lifecycles.
- Multiple sources may compete for the shared cap. Stable callback creation
  order plus recorded budget drops makes that contention reproducible and
  visible instead of silently over-allocating objects.
- Verification report v1.3.0 can prove that bullets came from the configured
  ordinary wave rather than relying only on global pattern totals.

## Evidence

- `src/gameplay/boss-pattern-scheduler.ts`
- `src/gameplay/enemy-pattern-scheduler.ts`
- `game-template/vertical-shooter/src/scenes/play-scene.ts`
- `game-template/vertical-shooter/src/test-bridge.ts`
- `tests/gameplay/boss-pattern-scheduler.test.ts`
- `tests/gameplay/enemy-pattern-scheduler.test.ts`
- Browser run `fea2601b-56dd-42b2-8874-41aaa8277859`
