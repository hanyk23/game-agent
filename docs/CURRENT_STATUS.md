# Current Status

Updated: 2026-07-26

## Scope

This is the evidence ledger for implemented capability, latest verification,
dependencies, and unresolved gaps. `docs/ROADMAP.md` owns the active plan,
`docs/COCOS_REFACTOR_PLAN.md` owns the combined Cocos + multi-agent + fast-path
refactor plan, `docs/PHASER_RETIREMENT_ARCHIVE_PREP.md` owns the Phaser archival
checklist, `docs/DEVELOPER_FAST_PATH_PLAN.md` owns the layered-check design, ADR
0030 owns the multi-agent decision, `docs/HANDOFF.md` owns resumption, and
`docs/PROGRESS_LOG.md` owns history. Plan documents are informative, not
executable instructions.

## Product and phase

The product remains a reusable Agent for verified single-player bullet-hell H5
games, supporting both vertical and horizontal play with orientation as a
parameter. Cocos Creator Web/H5 is the only target engine. Phaser is retired: it
is no longer a parity or correctness baseline, and its historical evidence is
kept as history only. The current strategy is a golden-sample-first rebuild:
produce and accept a Cocos golden sample, lock it as the framework + contract
baseline, then implement contracts and the pipeline. Removing Phaser from
build/verify/package is deferred until Cocos runs the whole pipeline
independently, and that removal is unrelated to parity. The latest source change
was a Batch 3 authority-chain follow-through in `src/modules/` (resolver,
resolver-v14, and the legacy adapter) with matching test/fixture updates; no
kernel, orchestrator, contract, registry, dependency, build, or CI file was
changed.

## Capability matrix

### Deterministic Agent pipeline

- Strict data-only `ShooterGameSpec`, bounded provider output, intent and
  completion/grounding evidence, fail-closed hashes, isolated runs, recovery,
  licensed asset selection, bounded repair, and verified packaging.
- Manifest 1.2-1.4, Assembly 1.1-1.3, and Graph 1.2-1.4 contracts support scoped
  dependencies, exact authorities, bounded resources, browser catalogs, and
  deterministic ready/blocked resolution.
- The Node-only loader rejects imports, ambient authority, dynamic evaluation,
  unexpected exports, byte drift, and top-level executable statements before
  minting private handles over reviewed factory bytes.
- Generated specifications and modules cannot edit the kernel, orchestrator,
  validators, tests, dependencies, permissions, or admission gates.

### Engine-neutral runtime authority

- Factories receive exact semantic services, ports, clocks, and assets rather
  than raw engine objects, registry, resolver, filesystem, or environment.
- Lifecycle reentry guards, bounded event delivery, entity generations,
  custody/quarantine, source-first contact commit, hostile contention, score
  evidence, and win-first frame-tail outcomes have deterministic tests.
- Mixed V1.2/V1.3/V1.4 contexts prevent authority upcast. The cumulative Batch
  3 registry selects reviewed production factories and the byte-preserved Batch
  2 Graze factory without re-admission.
- The current production Graph 1.4 closes hostile lineage, actor-set health,
  two owner-correct contact routes, Graze, scoring, and outcomes.

### Reviewed gameplay and assets

- Batch 1 first-slice modules and all 27 Batch 2 Core definitions are admitted.
- Batch 3 includes scrolling waves, Boss phases, encounter-pattern, fixed/aimed
  targeting, eight hostile deliveries, scoring/outcome, actor-set health, and
  contact factories with tested host authority.
- Pure pattern geometry and reviewed factory behavior are intended to be reusable
  behind a Cocos host; no factory rewrite is authorized by the engine decision.
- Thirty-five reviewed CC0/CC-BY images and their deterministic provenance,
  selection, materialization, notices, and package admission remain reusable.

## Engine status

### Decision

- Cocos Creator Web/H5 is the only target engine. Correctness is defined by the
  data contracts, the deterministic Verifier, and a user-accepted Cocos golden
  sample — not by any Phaser behavior.
- Phaser is retired as a baseline. Historical Phaser and Batch 1-3 evidence is
  history only; it does not prove the Cocos path.
- Exact Cocos version, build interface, output layout, and license/toolchain
  prerequisites are still unpinned and require a separately approved spike.

### Coupling observed so far

- Live Phaser references are concentrated in the template entry, runtime assets,
  boot/start/play/end scenes, `phaser-runtime-kernel.ts`, and their protected
  wiring in `src/orchestration/run-composition-stage.ts`,
  `src/verification/`, `package.json`, and coupled tests.
- Build, browser, recovery, package, license, and documentation assumptions also
  require attention even where source files do not import Phaser.
- The archival checklist enumerates every file, reference, and coupled test; see
  `docs/PHASER_RETIREMENT_ARCHIVE_PREP.md`.

### Archival posture

- Phaser is only being prepared for archival this stage: a migration checklist
  plus a `legacy/` destination for retired runtime files. No file has been moved.
- Actual removal from build/verify/package is deferred until Cocos runs the
  whole Request → Package pipeline independently; it is unrelated to parity.

## Latest evaluation evidence

- `pnpm typecheck` (both strict TypeScript projects) currently passes with no
  errors. `vitest run` currently passes 133 test files / 643 tests, including
  the documentation governance suite. This is the pre-Cocos green state, not a
  correctness baseline for the Cocos path.
- The historical pre-retirement full `pnpm check` (Phaser template) additionally
  passed composition, formatting, and a 142-module Vite production build. That
  Vite build is retained as history only and is not a correctness baseline for
  the Cocos path.
- No Cocos dependency, project, runtime, browser run, recovery run, or package
  evidence exists yet. The plan must not imply otherwise.
- No golden-sample acceptance, verification hash, or package hash exists for the
  Cocos path.

## Current dependencies

- Node.js 22+, TypeScript 5.9.3, Zod 4.4.3, `@opencode-ai/sdk@1.18.1`, Vitest
  4.1.10, Playwright 1.61.1, Vite 8.1.4, Prettier 3.9.5, tsx 4.23.1, and pnpm
  11.7.0.
- Phaser 3.90.0 is still declared in `package.json` because the live template
  and its protected wiring have not been rebuilt on Cocos yet; the dependency is
  removed only after Cocos runs the full pipeline and a license/package audit
  passes.
- Cocos is not installed or pinned.

## Known risks and gaps

- No Cocos toolchain exists yet: Web build reproducibility and headless/CLI
  suitability are unproven in this environment; no Cocos template, kernel, or
  adapter directory exists.
- Phaser is still the only buildable engine and is wired into protected files
  (`src/orchestration/`, `src/verification/`, `package.json`, coupled tests), so
  it cannot be removed without a working Cocos replacement.
- Orientation is currently hardcoded to vertical: no `orientation` field exists
  in `ShooterGameSpec`/`RuntimeGameConfig`; player-firing
  (`src/gameplay/player-firing-planner.ts`), enemy motion/off-screen culling and
  spawn position (`game-template/vertical-shooter/src/scenes/play-scene.ts`), and
  the `vertical-shooter` template naming assume portrait. Bullet-pattern angles
  are already parameterized. Parameterizing orientation is a tracked obligation.
- Callback ordering, coordinate systems, contact behavior, pooling, asset import
  metadata, cleanup, bundle size, startup time, and mobile performance may differ
  on Cocos and need explicit adapter contracts.
- No download, dependency change, paid model call, credential read, corpus
  expansion, or engine installation is authorized.

## Next milestone

Produce the Cocos golden sample (round A) and obtain explicit user acceptance,
then lock it as the framework + contract baseline (round B). Do not begin any
Cocos toolchain download or dependency change until separately approved with
version, size, source, and purpose.
