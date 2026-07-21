# Project Handoff

Updated: 2026-07-22

## Product objective

Develop the reusable Agent that generates, verifies, and packages single-player
vertical bullet-hell H5 games. The user authorized changing the generated-game
runtime from Phaser to Cocos; the product objective and trust boundaries remain
unchanged.

## Resume protocol

1. Run the recovery protocol in `AGENTS.md`.
2. Read `docs/COCOS_MIGRATION_PLAN.md` and ADR 0029 after the three recovery
   documents.
3. Trust files, Git, immutable reports, and newly run tests over this handoff.

## Repository state

- Workspace: `D:\Documents\game agent`
- Git at planning start: unborn `master`, no revision, no configured remote;
  every file was untracked/potentially user-owned.
- The Cocos migration is planned only. No dependency, runtime code, asset,
  generated project, or existing evidence has been changed.

## Roadmap position

- Phase 7D Cocos runtime migration is active under ADR 0029.
- Phaser fixed-template and Batch 1-3 evidence are immutable migration oracles.
- Batch 4, model orchestration, corpus growth, and active Phaser retirement wait
  until Cocos legacy-equivalent parity.

## Current Agent capability

- Strict Spec/Manifest/Assembly/Graph contracts and deterministic composition.
- Loader admission, registry, resolver, mixed-version scoped contexts, budgets,
  custody/quarantine, ports, scoring, outcomes, and bounded cleanup.
- Reviewed gameplay factories and pure bullet-pattern planners through the
  current production Graph 1.4 closure.
- Asset provenance/selection/materialization, immutable run evidence, browser
  verification, recovery, bounded repair, and verified package promotion.
- Engine coupling is concentrated in the template entry/scenes, asset/runtime
  bindings, Phaser adapter, and build/package integration.

## Evaluation case

- Fresh pre-migration `pnpm check` passed template composition, formatting, both
  TypeScript projects, 125 test files / 604 tests, and a 142-module Vite build;
  only the existing >500 kB warning remained.
- Offline run `fa3daaa2-689a-4af0-a7ae-0f2eed511569` is `built`; package SHA-256 is
  `64a98d0559fc0ce004f1779a140e1001caeff273e45aad9b9c3d6eb28aab7ca1`.
- Edge run `c69c2b21-2942-48b4-8ac7-1642d08c7a09` is `play_checked`; verification
  SHA-256 is `ff4472459740ea202acb16c72658b741e74a4e20c9a57125a086e83533e31691`.
- No Cocos toolchain, runtime, browser, recovery, or package evidence exists.
- Planning-file Prettier checks and 2 documentation governance files / 11 tests
  pass. A mistakenly broad Vitest invocation exposed unrelated existing module
  failures; no runtime source was changed or repaired in this planning task.

## Constraints and risks

- Assume Cocos Creator Web/H5; pin its exact version only after an approved
  bounded compatibility spike.
- No download, dependency change, credential read, paid model call, corpus
  expansion, or generated-code authority expansion is authorized.
- Preserve factory bytes and semantic contracts unless a failing adapter test
  proves a reviewed contract gap.
- Phaser evidence cannot be reported as Cocos evidence; browser and package
  promotion remain fail-closed.
- The repository has no remote. An initial commit/push is blocked on the target
  remote and whether its scope is the complete untracked repository or only the
  planning files.

## Exact next step

Complete migration gate M0: produce the engine-dependency inventory and Cocos
port matrix, classify every Phaser coupling, and define the exact bounded M1
toolchain spike for user approval before any download or dependency change.
