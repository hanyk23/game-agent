# ADR 0029: Migrate the generated-game runtime to Cocos Web

> **SUPERSEDED (2026-07-25):** This document predates the Cocos golden-sample-first strategy. The authoritative current plan is `docs/ROADMAP.md`, `docs/CURRENT_STATUS.md`, and `docs/COCOS_REFACTOR_PLAN.md`. Any "parity / oracle / M0–M6 / Phaser-as-main-engine" wording below is historical context only and is not an executable instruction.

- Status: Accepted direction; version and toolchain pending spike
- Date: 2026-07-22

## Context

The reusable Agent currently has immutable Phaser acceptance evidence and a
substantial engine-neutral module/authority layer. The user has explicitly
authorized changing the game engine to Cocos and asked to reuse prior work.
An incidental dependency swap would risk losing deterministic lifecycle,
contact ordering, resource custody, browser evidence, recovery, and packaging.

## Decision

- Target Cocos Creator Web/H5 for generated games.
- Preserve the product objective and reuse engine-neutral specifications,
  reviewed modules, deterministic hosts, evidence, assets, verification,
  recovery, and package-promotion policy.
- Implement Cocos only through a reviewed runtime adapter. Module factories
  receive semantic services and never Cocos engine objects or broad authority.
- Keep Phaser as an immutable migration oracle until a complete Cocos assembly
  passes equivalent browser, recovery, and package gates.
- Pin the exact Cocos version, build interface, output policy, and toolchain
  prerequisites only after a separately approved no-model compatibility spike.
- Generated specs/code cannot choose, install, upgrade, or configure the engine.

## Consequences

- ADR 0002 and the Phaser-specific runtime choice in ADR 0022 no longer govern
  new generated-game development; they remain historical baseline decisions.
- Batch 4 and later model-orchestration work wait until Cocos recovers the
  existing module path and legacy-equivalent assembly.
- Existing Phaser evidence stays valid only as baseline evidence and cannot be
  presented as proof that Cocos works.
- Downloads, dependency changes, or paid calls remain unauthorized until the
  user approves their exact bounded proposal.

## Exit criteria

The migration is complete only when a pinned Cocos Web runtime executes the
complete preserved assembly with equivalent deterministic semantics and passes
desktop/mobile browser, cleanup/restart, recovery, asset/license, performance,
and verified-package gates. Retirement of the Phaser active path requires an
explicit post-parity decision.
