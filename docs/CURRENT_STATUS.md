# Current Status

Updated: 2026-07-22

## Scope

This is the evidence ledger for implemented capability, latest verification,
dependencies, and unresolved gaps. `docs/ROADMAP.md` owns the active plan,
`docs/COCOS_MIGRATION_PLAN.md` owns migration work packages,
`docs/HANDOFF.md` owns resumption, and `docs/PROGRESS_LOG.md` owns history.

## Product and phase

The product remains a reusable Agent for verified single-player vertical
bullet-hell H5 games. On 2026-07-22 the user authorized changing the active
generated-game engine from Phaser to Cocos. ADR 0029 records the decision and
Phase 7D Cocos runtime migration is now active. The previous Phaser fixed path
and executable module-library work are preserved as migration baselines; the
migration has not begun implementation.

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
- Pure pattern geometry and reviewed factory behavior should be reusable behind
  a Cocos host; no factory rewrite is authorized by the engine decision alone.
- Thirty-five reviewed CC0/CC-BY images and their deterministic provenance,
  selection, materialization, notices, and package admission remain reusable.

## Engine migration status

### Decision

- ADR 0029 accepts Cocos Creator Web/H5 as the target direction.
- Exact Cocos version, build interface, output layout, license/toolchain
  prerequisites, and reproducibility are pending migration gate M1.
- ADR 0002 and Phaser-specific clauses in ADR 0022 remain historical baseline
  decisions but no longer direct new generated-game runtime work.

### Coupling observed so far

- Direct Phaser references are concentrated in the template entry, runtime
  assets, boot/start/play/end scenes, `phaser-runtime-kernel.ts`, and one runtime
  integration file.
- Build, browser, recovery, package, license, and documentation assumptions also
  require inventory even where source files do not import Phaser.
- This is initial evidence, not the completed M0 machine-readable inventory.

### Planned replacement boundary

- Replace engine startup/scenes and adapt lifecycle, time, input, entities,
  pools, contacts, assets, rendering, scaling, audio, cleanup, observation, and
  Web build integration behind the semantic kernel seam.
- Reuse specifications, reviewed modules, pure planners, deterministic hosts,
  evidence schemas, asset governance, browser assertions, recovery, bounded
  repair, and package promotion unless a focused failing test proves a gap.
- Preserve the Phaser path as a read-only oracle until complete Cocos parity;
  do not maintain two active product engines after an explicit M5 retirement
  decision.

## Latest evaluation evidence

- Fresh pre-migration `pnpm check` passes template composition, formatting, both
  strict TypeScript projects, 125 test files / 604 tests, and a 142-module Vite
  production build. The only build warning is the existing >500 kB chunk.
- Offline run `fa3daaa2-689a-4af0-a7ae-0f2eed511569` reached `built`; package
  SHA-256 is
  `64a98d0559fc0ce004f1779a140e1001caeff273e45aad9b9c3d6eb28aab7ca1`.
- Edge run `c69c2b21-2942-48b4-8ac7-1642d08c7a09` reached `play_checked`;
  verification SHA-256 is
  `ff4472459740ea202acb16c72658b741e74a4e20c9a57125a086e83533e31691`.
- Fixed-template, execution-foundation, Batch 1, Batch 2, and current Batch 3
  evidence remains immutable Phaser baseline evidence.
- No Cocos dependency, project, runtime, browser run, recovery run, or package
  evidence exists. The migration plan must not imply otherwise.
- All 10 planning-related Markdown files pass targeted Prettier checking. Both
  documentation governance files pass 11/11 tests after restoring required
  headings.
- A mistakenly broad Vitest invocation ran 133 files: 123 passed and 10 failed.
  Two documentation failures were corrected; the remaining reported failures
  are in pre-existing module source/tests outside this planning change and were
  not repaired or re-run as a full suite.
- Full-repository `format:check` remains red on six unrelated existing files;
  the planning-file format gate is green.

## Current dependencies

- Node.js 22+, TypeScript 5.9.3, Zod 4.4.3, Phaser 3.90.0,
  `@opencode-ai/sdk@1.18.1`, Vitest 4.1.10, Playwright 1.61.1, Vite 8.1.4,
  Prettier 3.9.5, tsx 4.23.1, and pnpm 11.7.0.
- Cocos is not installed or pinned. Phaser must not be removed until parity and
  a dependency/license audit pass.

## Known risks and gaps

- Cocos Creator Web build reproducibility and headless/CLI suitability are
  unproven in this environment.
- Callback ordering, coordinate systems, physics/contact behavior, pooling,
  asset import metadata, cleanup, bundle size, startup time, and mobile
  performance may differ and need explicit adapter contracts.
- The complete preserved-v2-Spec to Assembly 1.3 derivation remains unfinished;
  it moves behind the migration recovery gates rather than being discarded.
- No download, dependency change, paid model call, credential read, corpus
  expansion, or engine installation is authorized.
- Git now has complete 480-file root commit `442fa88` on `master`. Ignored local
  credentials, dependencies, caches, runtime artifacts, and build output were
  excluded; no staged credential-like assignment or ≥50 MiB file was found.
- The user created empty public repository `hanyk23/game-agent`. It is the
  confirmed push target; local `master` will publish to remote default `main`.

## Next milestone

Finish M0 by creating the engine-dependency inventory and port matrix, then
present the exact M1 toolchain spike—including version candidate, source,
download size, commands, timeout, expected outputs, rollback, and pass/fail
criteria—for explicit approval before execution.
