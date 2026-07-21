# ADR 0016: Versioned no-paid multi-game evaluation evidence

- Status: Accepted
- Date: 2026-07-16

## Context

The project had durable evidence for individual composition, browser, repair,
and packaging runs, but no common 3-5-game definition or aggregate report for
the Phase 6 acceptance shape. Continuing template expansion without that batch
would not reveal which remaining gap blocks materially different games.

## Decision

- Define each rehearsal case as one strict local `ShooterGameSpec`, deterministic
  case ID, local request, resource profile, asset-selection mode, browser-gate
  profile, and expected gameplay differentiators.
- Version both the batch definition and per-case/aggregate report as `1.0.0` and
  validate them with strict Zod schemas.
- Execute cases sequentially. Preserve each isolated run and continue the batch
  after a case fails so one defect cannot erase evidence for later cases.
- Record schema/planning/composition/build/desktop/mobile/packaging outcomes,
  elapsed time, disk bytes, failure classification, repair rounds, manual
  intervention, model requests, tokens, and CNY cost.
- Make the initial batch no-paid by construction: local Specs only, zero model
  requests, zero tokens, and zero cost. A future live extraction batch requires
  separate provider and cost approval.
- Do not invent a repair when no bounded evidence-bound patch proposal exists.
  Record the explicit failure and zero repair rounds instead.
- Select the next implementation objective from the first preserved
  evidence-backed failure, while keeping missing final-acceptance decisions
  separate from product failures.

## Consequences

- Phase 6 preparation now has a reproducible common harness instead of a list of
  unrelated successful runs.
- The first batch proved one complete packaged path and exposed that the current
  comprehensive browser verifier assumes its exact fixture and Boss-defeat
  ending. Outcome-aware verification is therefore the next bounded task.
- Evaluation artifacts remain ignored runtime evidence until a later explicit
  decision promotes a bounded report into version control.
- The harness does not authorize template, controls, assets, or repair-surface
  expansion by itself.

## Evidence

- `src/evaluation/evaluation-schema.ts`
- `src/evaluation/phase-6-rehearsal.ts`
- `src/evaluation/evaluation-runner.ts`
- `scripts/run-phase-6-rehearsal.ts`
- `tests/evaluation/evaluation-schema.test.ts`
- Evaluation run `8ebc36ec-d4b5-420a-99b9-4b44ec913199`
