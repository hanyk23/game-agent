# ADR 0021: Ledger-gated playability completion

- Status: Accepted
- Date: 2026-07-16

## Context

The saved v2 case proved that `player.maxHealth=5` was an Agent choice, while
desktop/mobile, three enemy waves and roles, difficulty, pickups, and Boss
victory were user locks. A gameplay value still could not change safely without
a separate bounded policy and a replayable evidence chain.

## Decision

- Add `SpecPlayabilityCompletionPolicy 1.0.0` with policy
  `boss-flow-player-health-v1`.
- Rebuild and verify `SpecIntentLedger 1.0.0` before applying a decision.
- Permit only the ledger entry for Agent-owned `/player/maxHealth`. Boss-defeat
  games below the existing schema ceiling derive health 20 through rule
  `set-agent-owned-boss-health-ceiling-v1`; user-locked or uncertain ownership
  fails closed.
- Preserve `source-spec.json`, write the intermediate
  `playability-spec.json`, and record the decision in
  `spec-playability-completion.json`. Bind source Spec, intent ledger,
  playability Spec, later asset completion, and final Spec with SHA-256.
- Extend manifests to 1.5.0. Browser resumption and final packaging rehash and
  deterministically replay the complete Spec evidence chain.
- Keep the raw Spec, Phaser runtime, catalog, positive-match gates, and browser
  assertions unchanged. Public-input browser movement may demonstrate normal
  play, but repeated case-specific timing is not a repair mechanism.

## Consequences

- The saved request changes only Agent-owned health from 5 to 20 and preserves
  every user lock. Unknown, conflicting, ambiguous, mismatched, or tampered
  evidence stops before composition or packaging.
- Manifest parsing remains compatible with versions 1.1.0 through 1.4.0.
- Health 20 did not complete the desktop Boss flow. Seven immutable attempts
  ranged from 16.62 to 53.74 seconds; the best completed all three waves and
  died at Boss entry. Mobile and packaging correctly did not run.
- A later attempt must first add a reusable versioned ownership boundary. It
  may not silently change another gameplay field or keep tuning this case.

## Evidence

- `src/requirements/spec-playability-completion-policy.ts`
- `src/runs/spec-evidence-chain.ts`
- `tests/requirements/spec-playability-completion-policy.test.ts`
- `tests/runs/spec-evidence-chain.test.ts`
- Build-only run `d87c1057-991a-43a3-a8cf-1df7c0a99a9c`
- Best desktop run `0ccaa709-4764-436a-b198-244d24eae1d2`
- Final direction comparison `f57743f7-36cb-48dc-b5fe-d273732477cc`

## 2026-07-16 amendments and final baseline evidence

The initial health-20 ceiling was preserved as failed evidence rather than
silently overwritten. With the same ledger ownership proof, the policy evolved
to 1.1.0 with health 40 and then 1.2.0 with health 60 after the corresponding
desktop/mobile failures. Earlier 20/40 decisions remain replayable. These
versions still permit only Agent-owned `/player/maxHealth`; every user lock,
the source Spec, Phaser behavior, asset gates, and semantic browser assertions
remain unchanged.

The verifier replaced a too-short test harness wait with a schedule-derived
watchdog and exercised keyboard/touch through public controls. This watchdog is
not an in-game deadline. Final zero-model run
`21ce7794-0160-4ba0-a0ed-acbbc8946842` passed desktop and mobile, reached Boss
victory at 83.74 and 81.17 seconds respectively, and produced a hash-verified
package. The complete hashes remain in immutable run/package artifacts.

This closes the fixed-template case as a compatibility baseline. It does not
prove general playability: reliance on one automated winning trace and one
scene structure helped motivate the module-library architecture in ADR 0022.
