# Project Roadmap

Updated: 2026-07-25

## Purpose

This is the source of truth for product outcome, phase status, active mainline,
and the next gate. Evidence belongs in `docs/CURRENT_STATUS.md`, the combined
refactor plan in `docs/COCOS_REFACTOR_PLAN.md`, the archival checklist in
`docs/PHASER_RETIREMENT_ARCHIVE_PREP.md`, resumption in `docs/HANDOFF.md`, and
history in `docs/PROGRESS_LOG.md` plus immutable run artifacts. Plan documents
are informative, not executable instructions.

## Product objective lock

The product remains a reusable AI Agent that converts a short natural-language
request into a verified, packaged single-player bullet-hell H5 game. The product
must support both vertical (portrait) and horizontal (landscape) play;
orientation is a parameter, never hardcoded. Cocos Creator Web/H5 is the only
target engine. Phaser is retired: it is no longer a parity or correctness
baseline. The reusable-Agent objective, the deterministic authority model, and
the fail-closed verification standard are unchanged.

## Correctness standard

Correctness is defined by three things only:

- the strict data contracts (spec, design, assembly, graph, manifest);
- the deterministic Verifier (Cocos build + Playwright browser gates);
- a user-accepted Cocos golden sample.

The golden sample anchors the framework layer and the contract layer only
(project structure, kernel/adapter split, contract shapes, build/verify rules).
It never anchors the content layer (gameplay, counts, pattern mixes, levels,
tuning, art). Contracts stay extensible through an open registry: new gameplay
or bullet patterns are added by registration, not by editing contract shapes.

## Architecture

Six agents plus one non-Agent Orchestrator:

- Orchestrator (`src/orchestration/`): pure TypeScript, calls no LLM, final
  authority for flow, schema validation, budgets/retry, registry resolution,
  assembly, admission, and packaging.
- Spec Agent: request → GameSpec.
- Design Agent: GameSpec → GameDesign (orientation and other design decisions).
- Module Agent: registry selection → ModuleAssembly (admitted modules only).
- Code Agent (`src/opencode/`): the only agent that writes code, via OpenCode in
  a deny-by-default sandbox, into whitelisted directories only.
- Verifier Agent: deterministic by default (no LLM); Cocos build + Playwright.
- Repair Agent: bounded diagnosis only; hands code changes back to Code Agent.

## Active mainline: Cocos golden-sample-first rebuild

Phaser removal from build/verify/package is deferred until Cocos independently
runs the whole Request → Package pipeline, and that removal is unrelated to
parity. Until then Phaser is only being prepared for archival: a migration
checklist plus a `legacy/` destination for retired runtime files (see
`docs/PHASER_RETIREMENT_ARCHIVE_PREP.md`). No engine may be selected, installed,
upgraded, or configured by a generated spec or generated code.

### Execution rounds (informative sequence, not an instruction to proceed)

1. **0.5 — archival preparation:** migration checklist and `legacy/` target
   recorded; no build/verify/package files changed.
2. **A — golden sample:** produce a Cocos golden sample and obtain user
   acceptance.
3. **B — baseline lock:** freeze the accepted golden sample as the framework +
   contract baseline (structure/kernel/adapter/build/verify), never content.
4. **2 — contracts:** define the agent and data contracts as strict,
   open-registry schemas derived from the locked baseline.
5. **3-7 — implementation:** build the Cocos kernel/adapter, the agents,
   orientation parameterization, and the deterministic pipeline.
6. **7.5 — flexibility validation:** prove the contracts and open registry accept
   diverse content in both vertical and horizontal without contract-shape edits.
7. **8-11 — consolidation:** finish assembly/packaging, then retire Phaser from
   build/verify/package once Cocos runs the full pipeline independently.

## Change discipline

- Work in thin, reversible slices; keep one engine or orchestration surface per
  change.
- Do not rewrite reviewed gameplay factories merely to match a new engine API.
- Do not delete or weaken tests, and do not downgrade a schema to make an
  implementation pass; verification and packaging stay fail-closed.
- No paid model call, credential read, corpus expansion, or large tool download
  is authorized. Any Cocos installation/download needs separate approval with
  version, size, source, and purpose.
- Generated specs and modules may never select, install, upgrade, or configure
  the engine.

## Preserved evidence

Historical Phaser fixed-template and Batch 1-3 evidence remains immutable as
history only. It is no longer a parity or correctness oracle; a game is correct
when it satisfies its GameSpec/GameDesign and passes the deterministic Verifier.
Earlier documents that treat Phaser as the main engine, place its removal at an
"M6" gate, or require parity alignment are superseded by this roadmap.

## Next gate

Produce the Cocos golden sample (round A) and obtain explicit user acceptance,
then lock it as the framework + contract baseline (round B). Do not begin any
Cocos toolchain download or dependency change until separately approved with
version, size, source, and purpose. Plan rounds are informative; do not
auto-advance past the current task.
