# Project Agent Instructions

## Product objective lock

- The repository product is the reusable game-generation Agent for verified,
  packaged single-player vertical bullet-hell H5 games, not one generated game.
- A game request is evaluation input unless the user explicitly changes the
  objective. Convert failures into reusable contracts, validators, tests,
  bounded repair, or immutable fail-closed evidence.
- Only the user may authorize a product-objective or engine change.

## Recovery protocol

Before edits in a new or compacted session:

1. Confirm `D:\Documents\game agent` and inspect Git state/revision.
2. Read only `docs/HANDOFF.md`, `docs/CURRENT_STATUS.md`, and `docs/ROADMAP.md`.
3. Load requirement, architecture, ADR, or batch documents only when directly
   relevant to the requested change.
4. Report: objective, capability, evaluation case, uncommitted changes,
   blockers, exact next step, and HANDOFF/ROADMAP agreement.

Trust files, Git, artifacts, and tests over conversation. Disclose detected
conversation compaction and rerun recovery.
Do not reread unchanged recovery files later in the same uninterrupted task.

## Context and cost control

- Keep this file small because Codex may load it on every request. Durable detail
  belongs in its owning document and is loaded only when needed.
- Use targeted searches and bounded output. Never dump full large documents,
  generated artifacts, or broad recursive matches when a scoped query suffices.
- Keep routine updates and final handoffs concise; link to files instead of
  copying their contents. Do not restate recovery documents.
- Run focused checks during development and the unified gate once when
  proportionate; do not repeatedly rerun unchanged expensive checks.
- Do not invoke paid models without explicit provider/model, purpose, call
  count, token ceiling, retry policy, and expected-cost approval.
- Never read, print, or transmit credential files, `.env` values, tokens, or cookies.

## Planning and documentation

- ROADMAP owns outcome, phase, active mainline, and next gate; CURRENT_STATUS
  owns evidence/risks; HANDOFF is the concise resume point; PROGRESS_LOG is
  append-only history.
- Map implementation to the active roadmap or an explicit user decision.
- When phase/mainline/next gate changes: update ROADMAP first, then HANDOFF and
  CURRENT_STATUS, append PROGRESS_LOG, and reconcile affected stable docs.
- Line budgets: ROADMAP 140, HANDOFF 80, CURRENT_STATUS 220.

## Stage-close documentation compaction

At a major stage transition, preserve detailed evidence in PROGRESS_LOG and
immutable artifacts, remove superseded current-state narratives, search stale
stage/next-step wording, and run documentation, formatting, and proportionate
project gates. Report before/after line counts for ROADMAP, HANDOFF, and CURRENT_STATUS.

Then announce the transition and provide a concise Chinese continuation prompt
with workspace, completed milestone, next objective, recovery, evidence-first,
credential, and cost constraints. The current conversation may continue.

## Architecture boundaries

- The deterministic orchestrator owns state, manifests, validation, budgets,
  evidence, and repair limits. Specs/assemblies are strict non-executable data.
- The runtime kernel owns engine lifecycle and primitives; reviewed modules own
  gameplay and receive only declared semantic services and compatible ports.
- OpenCode remains external and sandboxed. Generated modules may not edit the
  base library, kernel, orchestrator, validators, tests, dependencies,
  permissions, or admission gates.
- Preserve the fixed-template baseline until modular recovery/browser/package
  parity. Engine migration requires a user decision and ADR.
- Assets require license/provenance admission before ranking. Verification is
  immutable; repair may not weaken requirements or tests.

## Safety and workflow

- Modify only this repository; preserve user and unrelated untracked changes.
- No destructive cleanup, forced Git operations, broad deletion, secret access,
  or unapproved large downloads.
- Record source, author, license, and attribution for third-party code/assets.
- Before edits: define objective, roadmap mapping, constraints, and checks.
- Make small reversible changes, run focused then proportionate checks, review
  the complete intended diff, and reconcile handoff evidence.
- Standard gates: `pnpm format:check`, `pnpm typecheck`, `pnpm test`, `pnpm check`.
  Runtime gates are run only when relevant. Never enable a model probe without
  explicit cost approval.

## Git policy

- Inspection is allowed. Branch, commit, tag, push, merge, rebase, and PR actions
  require explicit user authorization.
- The repository is an unborn `master`; all files are potentially user-owned.
  Never create the initial commit implicitly.
- Before an authorized commit, run proportionate gates, inspect licenses and
  secret/generated exclusions, stage explicit paths, and review the cached diff.
- A commit does not authorize push; never force or rewrite shared history.
- Handoff records branch/revision, worktree, checks, risks, exact next step, and
  whether work remains uncommitted.

## Definition of Done

Acceptance checks pass or omissions are explicit; no secret, unsafe authority,
unlicensed asset, or unconstrained repair is introduced; evidence and docs match
Git/runtime state; known risks and one exact next step are recorded.
