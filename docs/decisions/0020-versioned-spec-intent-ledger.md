# ADR 0020: Versioned request-bound Spec intent ledger

- Status: Accepted
- Date: 2026-07-16

## Context

The saved v2 natural-language Spec passed completion, selection, composition,
and build, then repeatedly failed desktop play because `player.maxHealth=5` did
not survive the 53-second configured flow. The request states medium difficulty
but no player-health value. The populated source Spec alone cannot prove whether
health is a user lock or an Agent choice, so changing it would risk overwriting
intent.

## Decision

- Add strict `SpecIntentLedger 1.0.0` with policy
  `zh-cn-playability-intent-v1` and scope `playability-provenance-v1`.
- Bind the exact original request SHA-256, its NFKC-normalized SHA-256, and the
  canonical source `ShooterGameSpec 1.0.0` SHA-256.
- Record each supported user lock with normalized request spans and a
  deterministic domain binding. Version 1 covers desktop/mobile targets, enemy
  wave count, the supported enemy-role list, difficulty, supported pickup
  effects, Boss-defeat victory, and player max health.
- Mark `player.maxHealth` as Agent-owned only when the bounded health vocabulary
  is completely absent. An exact stated value becomes user-locked and must match
  the source Spec.
- Fail closed on unknown terms inside scoped enemy/pickup/difficulty/victory
  clauses, conflicting values, repeated or incomplete evidence, ambiguous Spec
  bindings, source mismatches, and any ledger/request/Spec tampering.
- Deterministically rebuild the ledger during verification rather than trusting
  recorded ownership. Text outside the declared v1 playability scope remains
  preserved but is not claimed as classified by this policy.
- Keep the ledger separate from gameplay completion. This milestone does not
  modify the raw Spec, Phaser, catalog, browser assertions, or failed evidence.

## Consequences

- The saved v2 request now proves that desktop/mobile, three waves, the three
  requested enemy roles, medium difficulty, shield/firepower pickups, and Boss
  victory are user-locked while `player.maxHealth=5` is Agent-owned.
- The bounded parser is intentionally not a general Chinese semantic analyzer.
  New scoped phrasing or intent domains require a reviewed policy version and
  tests; unsupported scoped terms fail instead of being guessed.
- A later playability-completion policy may inspect ownership only after
  revalidating this ledger. Manifest integration and any health change remain
  future work.

## Evidence

- `src/requirements/spec-intent-ledger.ts`
- `tests/requirements/spec-intent-ledger.test.ts`
- `scripts/replay-natural-language-probe-intent.ts`
- Intent replay `aa527332-3ebd-40a9-b744-650a30d86ad1`
