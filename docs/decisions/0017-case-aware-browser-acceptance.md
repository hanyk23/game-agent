# ADR 0017: Versioned case-aware browser acceptance

- Status: Accepted
- Date: 2026-07-16

## Context

The first Phase 6 rehearsal proved that the comprehensive browser fixture was a
valid deep regression but an invalid universal acceptance profile. Correct
`scoreReached` and `surviveMs` games could end before the fixture's named waves,
five Boss patterns, pickups, and Boss-defeat outcome completed. A multi-game
evaluation still needs fail-closed evidence for each Spec's configured behavior
without silently dropping assertions.

## Decision

- Keep `comprehensive-v1` as the unchanged fixed deep-regression profile and add
  strict versioned `case-aware-v1` as a separate browser assertion profile.
- Revalidate the run's hashed `spec.json` and deterministically derive the
  expected outcome, applicable waves and their patterns, weapons, Boss patterns,
  pickups, scoring values, asset use, resource caps, and bounded timeouts.
- Require keyboard or touch start/movement/restart, responsive canvas geometry,
  screenshots, zero console/page/request failures, and semantic play/outcome
  evidence on both desktop and mobile Chromium.
- Require only gameplay that can execute before the configured outcome. A score
  target uses the earliest wave set; timed survival uses waves starting before
  the survival horizon; Boss defeat requires the complete Boss/pickup sequence.
- Keep configured object caps and exact scoring values fail-closed. Required
  patterns must emit and move real bullets, aimed patterns must target the live
  player, required pickups must spawn and collect without budget drops, and
  selected catalog textures must load and meet the applicable use rule.
- Preserve a bounded final start/play/end snapshot whenever a wait fails. Use
  explicit configured-play/configured-outcome failure codes before generic
  text classification.
- For Boss-defeat cases, derive the configured-play evidence timeout from the
  latest ordinary-wave end plus a fixed seven-second Boss allowance, bounded to
  20-60 seconds. This prevents a fixed 20-second verifier deadline from expiring
  before a longer valid wave schedule while keeping the gate finite.
- Exercise mobile pickup semantics before restoring the player to the Boss
  firing lane when pickups are required. Restart taps target the end scene's
  actual interactive control. These are verification-driver actions through
  public input paths, not test-state mutation.
- Permit final packaging to parse either browser profile while continuing to
  require two semantic passing viewport cases and an otherwise unchanged hash
  and attribution chain.

## Consequences

- Alternative valid outcomes are accepted against their own strict Spec-derived
  contract instead of a fixture-shaped subset or a weakened universal gate.
- Comprehensive regression remains available to catch loss of the broad fixed
  capability baseline.
- The profile currently covers configured behavior represented by the frozen
  bridge. Exact custom key arrays, focus mode, relative touch movement, and a
  distinct virtual joystick remain fail-closed/tracked until an evaluation or
  accepted final gate requires them.
- Failed evaluation runs and their snapshots remain immutable evidence; later
  passing runs do not overwrite them.

## Evidence

- `src/verification/browser-assertion-profile.ts`
- `src/verification/browser-verification-stage.ts`
- `src/evaluation/evaluation-schema.ts`
- `src/evaluation/evaluation-runner.ts`
- `tests/verification/browser-assertion-profile.test.ts`
- Preserved diagnostic batches
  `217815d6-0982-4c9b-bfcf-caa102adae74` and
  `82f07d73-e458-4e20-8ba4-88f1c8816add`
- Passing evaluation batch `03938bfd-306f-459f-b127-562c1e4e3f68`
- Passing comprehensive regression run
  `12786fdc-2e0b-4dac-befa-37f8c0975f17`
