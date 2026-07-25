# ADR 0030: Multi-agent orchestration with a deterministic Orchestrator authority

- Status: Accepted direction; incremental wiring pending per-round approval
- Date: 2026-07-25
- Related: ADR 0029 (Cocos Web runtime migration), ADR 0001 (OpenCode
  integration), ADR 0006 (bounded runtime repair)

## Context

The game-generation product converts one natural-language request into a
verified, packaged bullet-hell H5 game. Today the pipeline logic is spread across
composition/packaging drivers, requirement analysis + completion policies, the
module registry/resolver/composer, the OpenCode integration, the browser
verification stage, and the bounded repair controller, coordinated implicitly
through the immutable run manifest state machine.

We want to make the internal division of labor explicit as a set of named agents,
so responsibilities, inputs, and outputs are legible and independently testable —
while keeping strong guarantees: only one component may write code, verification
stays deterministic by default, and a single authority owns state promotion,
schema validation, budgets, admission, and packaging.

This ADR records the agreed division of labor. It does **not** authorize changing
gameplay behavior, the engine, or any schema; those are governed by their own
ADRs and by per-round tasks.

## Decision

Adopt the following runtime-internal roles. All are product-internal components,
not user-facing services.

- **Orchestrator (pure TypeScript, not an agent) — final authority.** Owns flow
  advancement, schema validation, budget/retry accounting, registry resolution,
  assembly, admission gates, evidence recording, and packaging. It is the only
  component that promotes run state and the only component that decides
  pass/fail. It never delegates authority to a model.
- **Spec Agent.** Natural language → `GameSpec`. Bounded model output validated
  by the Orchestrator against the strict spec schema.
- **Design Agent.** `GameSpec` → `GameDesign`. Produces a validated design
  artifact derived from the spec; carries orientation and other design decisions
  forward as data.
- **Module Agent.** Selects registry modules → `ModuleAssembly`. Chooses from
  reviewed/admitted modules only; it cannot author new module code.
- **Code Agent.** The **only** component permitted to write code. It generates
  candidate module code at runtime through OpenCode (`@opencode-ai/sdk`) under a
  deny-by-default sandbox. Its output is admitted by the Orchestrator/loader, not
  self-promoted.
- **Verifier Agent.** Runs the Cocos build + Playwright verification. It is
  **deterministic by default and does not call an LLM.** It emits verification
  findings; it does not repair or promote.
- **Repair Agent.** Reads the verification report, produces a bounded diagnosis,
  and hands the actual code change back to the Code Agent. It cannot itself widen
  authority, weaken tests, or exceed repair budgets.

Invariants that hold regardless of implementation detail:

1. The Orchestrator is the single authority for state, schema validation,
   budgets, admission, and packaging.
2. Exactly one writer of code exists: the Code Agent via OpenCode.
3. Verification is deterministic by default; enabling any model probe requires
   explicit, separately approved cost authorization.
4. Repair diagnoses but does not write code and may not relax any gate.
5. Agents exchange strict, non-executable data artifacts (Spec, Design,
   ModuleAssembly, verification findings, repair proposals). Specs and generated
   modules may never edit the kernel, orchestrator, validators, tests,
   dependencies, permissions, or admission gates.
6. Orientation (vertical/horizontal) is a design parameter carried in the data
   artifacts; no agent may hardcode a single orientation.

## Consequences

- The existing pipeline components map onto these roles without behavior change
  in the first rounds; the split is introduced by adding boundary contracts and
  an explicit Orchestrator driver around current code (see
  `docs/COCOS_REFACTOR_PLAN.md`, Workstream A).
- `GameDesign` becomes an explicit artifact distinct from `GameSpec`. Whether it
  is persisted with its own manifest hash is an open question (COCOS_REFACTOR_PLAN
  TODO-4) to be resolved in a later round.
- The Code Agent's exclusive-writer status formalizes today's OpenCode boundary;
  it does not grant generated code any new authority.
- The deterministic-Verifier rule keeps the default acceptance path free of paid
  model calls, consistent with the project's cost-control constraints.
- This ADR is compatible with ADR 0029: the Verifier Agent's build step targets
  Cocos once the engine migration lands, and Phaser remains the parity oracle
  until then.

## Non-goals

- No change to gameplay factory bytes, the engine, or any schema is authorized by
  this ADR.
- No user- or model-driven selection of engine, orientation policy, dependencies,
  or admission rules.
- No consolidation of the `docs/decisions/` and `docs/adr/` directories is
  decided here (COCOS_REFACTOR_PLAN TODO-1).

## Exit criteria

The multi-agent structure is considered realized when each of the six roles has a
strict data contract and a boundary test, the Orchestrator alone promotes run
state, the Code Agent is the only writer, the Verifier runs without an LLM by
default, and an offline run reaches the same terminal manifest state and
evidence as the pre-split pipeline.
