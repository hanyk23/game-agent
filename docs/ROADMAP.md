# Project Roadmap

Updated: 2026-07-22

## Purpose

This is the source of truth for product outcome, phase status, active mainline,
and the next gate. Evidence belongs in `docs/CURRENT_STATUS.md`, resumption in
`docs/HANDOFF.md`, migration detail in `docs/COCOS_MIGRATION_PLAN.md`, and
history in `docs/PROGRESS_LOG.md` plus immutable run artifacts.

## Product objective lock

The product remains an AI agent that converts a short request into a verified,
packaged single-player vertical bullet-hell H5 game. The user authorized a
change from Phaser to Cocos on 2026-07-22. This changes the generated-game
engine, not the reusable-Agent objective, deterministic authority model, or
fail-closed verification standard.

## Phase status

| Phase | Outcome                          | Status                    | Remaining gate                          |
| ----- | -------------------------------- | ------------------------- | --------------------------------------- |
| 0-4   | Original deterministic pipeline  | Preserved baseline        | Use as migration regression             |
| 5     | 300-500 reviewed images          | Partial and paused        | Resume after Cocos asset roles settle   |
| 6     | Phaser fixed-template acceptance | Complete and immutable    | Preserve evidence; no new features      |
| 7A-C  | Engine-neutral module library    | Complete through Batch 3  | Freeze contracts during port            |
| 7D    | Cocos runtime migration          | Active                    | Compatibility spike and adapter slice   |
| 7E    | Cocos legacy-equivalent assembly | Planned                   | Browser/recovery/package parity         |
| 7F    | Extended module library          | Deferred behind migration | Rebase Batch 4 on the Cocos kernel      |
| 8     | Model-orchestration subsystem    | Planned                   | Adapters, sandbox controller, tests     |
| 9     | Modular multi-game acceptance    | Planned                   | Diverse Cocos graphs and final packages |

## Active mainline: Cocos runtime migration

### Reuse boundary

Preserve without semantic redesign unless a failing compatibility test proves a
gap:

- versioned `ShooterGameSpec`, Manifest, Assembly, and Graph data contracts;
- deterministic registry, loader admission, resolver, budgets, authority,
  custody/quarantine, scoring, outcome, evidence, and bounded-repair rules;
- reviewed gameplay modules and pure bullet-pattern planners;
- asset provenance, deterministic selection/materialization, run manifests,
  browser assertions, recovery state, and verified-package promotion;
- immutable Phaser fixed-template and Batch 1-3 evidence as migration oracles.

Replace or adapt behind the kernel seam:

- Phaser boot/play/end scenes and engine startup;
- Phaser-specific input, clock/timer, entity, pooling, collision, rendering,
  scaling, audio, asset-loading, lifecycle, cleanup, and observation bindings;
- Vite/template composition and package allowlists where Cocos Web output has a
  different build or directory layout.

The assumed target is Cocos Creator with an H5/Web build. The exact supported
version, editor/CLI invocation, generated-output policy, and license/tooling
requirements must be pinned by ADR after a no-model compatibility spike. Specs
and generated modules may never select or upgrade the engine.

### Migration gates

1. **M0 — decision and inventory (active):** accept ADR 0029, inventory every
   Phaser dependency, classify reusable code, define the Cocos port map, and
   record baseline hashes and tests. Exit: no unclassified engine coupling.
2. **M1 — toolchain spike:** prove a minimal Cocos Creator Web project can be
   built reproducibly in the supported environment, served to Playwright, and
   packaged without editor-local or credential state. Exit: pinned version,
   commands, licenses, output allowlist, and a pass/fail ADR amendment.
3. **M2 — engine-port contract:** keep module-facing semantic services stable;
   specify Cocos adapters for lifecycle, time, input, entities, pools, contacts,
   assets, rendering, scaling, audio, cleanup, and read-only observation. Exit:
   contract tests run against a deterministic fake and the Cocos adapter.
4. **M3 — first vertical slice:** run one reviewed Graph 1.2 slice in Cocos with
   player movement, firing, enemy delivery, collision, score, outcome, restart,
   desktop keyboard, and mobile touch. Exit: focused unit/contract tests plus
   desktop/mobile browser evidence with bounded resources and zero errors.
5. **M4 — Batch 2/3 recovery:** port only adapter gaps needed by existing
   factories, then recover defense/progression/formations, hostile contention,
   Graze, actor-set combat, scoring, and win-first outcomes. Exit: the existing
   production Graph 1.4 runs without factory authority expansion.
6. **M5 — complete legacy-equivalent assembly:** finish deterministic preserved
   v2-Spec to Assembly 1.3 derivation on Cocos and pass equivalent functional,
   recovery, desktop/mobile, asset, performance, and package gates. Exit:
   immutable Cocos evidence and an explicit fixed-path retirement decision.
7. **M6 — consolidation:** make Cocos the only active generated-game engine,
   archive rather than rewrite Phaser evidence, remove active Phaser dependency
   only after parity, and update requirements/architecture/notices. Exit: clean
   dependency/license audit and unified gate.
8. **M7 — resume product expansion:** implement required Batch 4 on the stable
   Cocos kernel, then continue Phases 8 and 9. No engine migration work may be
   hidden inside generated output or model repair.

## Change discipline

- Work in thin, reversible slices; keep one engine-port surface per change.
- Do not rewrite reviewed gameplay factories merely to match Cocos APIs.
- Treat observable timing, coordinate, collision, cleanup, and ordering
  differences as explicit adapter contracts with parity fixtures.
- Preserve the Phaser build until M5 passes; it is a read-only regression oracle,
  not a dual-engine product commitment.
- No paid model call, credential read, corpus expansion, or large tool download
  is authorized. Any Cocos installation/download requires separate approval
  with version, size, source, and purpose.
- Browser and package promotion remain fail-closed; migration repair may not
  weaken tests, budgets, evidence hashes, or generated-code permissions.

## Preserved evidence

The Phaser fixed-template, execution-foundation, Batch 1, Batch 2, and current
Batch 3 evidence remains immutable. It proves behavior and Agent contracts, not
that the new Cocos path has passed. Historical ADRs remain valid descriptions of
the baseline unless ADR 0029 explicitly supersedes their active engine choice.

## Next gate

Complete M0: create the engine-dependency inventory and Cocos port matrix,
including every source, test, build, browser, recovery, package, license, and
evidence assumption. Then propose the bounded M1 compatibility spike with no
download or dependency change until separately approved.
