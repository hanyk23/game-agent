# ADR 0022: Compatible gameplay modules and a thin runtime kernel

> **SUPERSEDED (2026-07-25):** This document predates the Cocos golden-sample-first strategy. The authoritative current plan is `docs/ROADMAP.md`, `docs/CURRENT_STATUS.md`, and `docs/COCOS_REFACTOR_PLAN.md`. Any "parity / oracle / M0–M6 / Phaser-as-main-engine" wording below is historical context only and is not an executable instruction.

- Status: Accepted foundation; module-authoring and gap-failure clauses
  partially superseded by ADR 0024
- Date: 2026-07-17

## Context

The fixed Phaser template proved the complete request-to-package pipeline, but
it also fixed too much game structure inside one scene implementation. Adding
fields can vary a known vertical shooter, yet changing controls, weapon
composition, drops, progression, or outcome structure still tends to expand the
template and its case-specific verification logic.

The user selected a library-style architecture: programmers first implement and
test compatible basic modules; an approved model API then interprets a request
and composes those modules like a programmer using a reviewed library. The
model must not regenerate module internals.

## Decision

### Runtime ownership

- Retain Phaser 3.90.0 behind a thin runtime kernel that owns browser lifecycle,
  time, entity ownership, input, rendering, collision, object pools, assets,
  event delivery, resource enforcement, and read-only test observation.
- Move gameplay rules out of the kernel. Health, damage, shields, weapons,
  projectiles, trajectories, drops, pickups, waves, Boss phases, scoring, and
  outcomes are versioned modules.
- Preserve the existing template pipeline as a compatibility adapter until a
  module assembly reproduces its required behavior and package evidence.

### Module contract

Every admitted module has a strict `GameModuleManifest` declaring:

- stable module ID, semantic version, kind, and implementation entry owned by
  the local registry;
- kernel and engine compatibility;
- provided and required capabilities;
- typed input and output event ports;
- bounded configuration schema and defaults;
- dependencies, optional dependencies, conflicts, and cardinality rules;
- entity ownership and lifecycle hooks;
- resource-budget contributions and browser support;
- provenance, test suite, and compatibility evidence.

Module manifests may reference only registry-owned logical IDs. Model output
may not contain source code, dynamic imports, URLs to execute, commands, package
dependencies, implementation paths, or undeclared event names.

### Assembly and resolution

- `GameAssemblySpec 1.0.0` is data only. It lists requested module IDs/version
  ranges, bounded configuration, entity instances, event bindings, asset roles,
  and global budgets.
- The API receives a versioned model-visible module catalog and may select
  modules, fill configuration, and connect declared compatible ports.
- A deterministic local resolver pins exact versions and writes a resolved
  module graph. It rejects unknown modules, unresolved or ambiguous versions,
  missing capabilities, invalid ports, cycles, conflicts, duplicate ownership,
  incompatible kernels, and exceeded budgets.
- Request intent, model-visible catalog, proposed assembly, resolved graph, and
  every selected manifest are SHA-256-bound in the run evidence chain.
- OpenCode is reserved for a separately authorized new-module workflow; it is
  not part of normal assembly and may not patch existing modules to make one
  request pass.

### Verification

- Each module must pass schema, unit, property, resource, and contract tests.
- Representative pairwise and interaction sets test compatibility without
  claiming to enumerate every possible graph.
- Runtime verification separates controls, mechanics, reachability, resource
  safety, outcome execution, and visual evidence. One automated winning policy
  is optional regression evidence, not the sole definition of playability.
- Package promotion still requires immutable evidence, asset/license checks,
  secret scanning, and reproducible hashes.

## Migration plan and gates

1. **Contract foundation:** implement only schemas, an in-memory registry, a
   pure resolver, fixtures, and fail-closed tests. No Phaser behavior changes.
2. **Kernel seam:** place lifecycle, events, entities, input, collision, pools,
   and observation behind stable interfaces while the legacy game still runs.
3. **First module library:** adapt existing pure logic for health/damage,
   shield, weapon/projectile, eight trajectories, pickup/drop, waves, Boss
   phases, scoring, and outcomes. Each extraction requires parity tests.
4. **Legacy assembly parity:** express the preserved v2 behavior as a module
   graph and pass desktop/mobile functional evidence and package hashes without
   editing the immutable baseline.
5. **API composition:** expose only reviewed manifests to the requirement API;
   validate saved zero-model fixtures before requesting any paid call.
6. **Modular acceptance:** generate materially different valid graphs, preserve
   unsupported requests as explicit failures, and retire fixed-template-only
   composition only after equivalent recovery and packaging gates pass.

Each slice is independently reviewable. Failure in a later slice must not force
removal of the passing legacy pipeline.

## Consequences

- The Agent becomes more flexible without allowing arbitrary code generation.
- Module authoring costs move to reviewed library development and compatibility
  testing; API calls become assembly decisions rather than code-writing tasks.
- Compatibility cannot be assumed from matching names. Contracts, exact local
  resolution, budgets, and interaction tests remain mandatory.
- The 300-500-image corpus expansion stays paused until module asset roles and
  assembly-level retrieval needs are stable.

## Evidence and supersession

- User architecture decision: 2026-07-17.
- Legacy packaged baseline: `21ce7794-0160-4ba0-a0ed-acbbc8946842`.
- This ADR supersedes the fixed-template expansion direction in ADR 0003 and
  the active recommendation in `docs/TECHNICAL_PROPOSAL.md`; their historical
  rationale remains valid for the preserved baseline.
