# Project Agent Instructions

## Project identity

This repository builds an AI code-generation agent for vertical bullet-hell H5 games. The generated games target common desktop and mobile browsers. The project is not a general-purpose game generator in its first phase.

## Product objective lock

- The repository product is the reusable game-generation Agent, not any one
  generated game.
- Treat every user-supplied game description as an Agent evaluation input unless
  the user explicitly changes the repository's product objective.
- An evaluation pass demonstrates an Agent capability. An evaluation failure
  must become a reusable schema, validator, type, test, template constraint,
  bounded repair rule, or immutable fail-closed report; do not chase a passing
  single game through case-specific edits or repeated paid calls.
- Never let the latest probe prompt, generated Spec, browser run, or packaging
  task replace the product objective in planning or handoff documents.
- Only the user can authorize a product-objective change. A request to "try this
  game prompt" does not authorize that change.

## Recovery protocol

Before changing files in a new session:

1. Confirm the working directory is this repository.
2. Read this file, `docs/HANDOFF.md`, and `docs/CURRENT_STATUS.md`.
3. Read `docs/REQUIREMENTS.md`, `docs/ARCHITECTURE.md`, and relevant ADRs as needed.
4. Run `git status --short --branch`, inspect the current branch and latest commit, and reconcile documentation with actual files.
5. Report the product objective, current Agent capability, current evaluation
   case (if any), uncommitted changes, known blockers, and exact next step as
   separate items.

If documentation and code disagree, use actual code and Git state as evidence, then correct the documentation.

## Planning and handoff governance

The project plan and operational handoff have distinct durable roles:

- `docs/ROADMAP.md` is the single source of truth for the product outcome,
  phase definitions, actual phase status, active mainline, entry/exit gates, and
  user-owned decision gates.
- `docs/CURRENT_STATUS.md` is the evidence ledger for implemented capabilities,
  completed verification, dependencies, known risks, and unresolved gaps. It
  may be detailed, but it must not define a competing active roadmap.
- `docs/HANDOFF.md` is the concise operational resume point: repository state,
  roadmap position, current objective, latest relevant evidence, blockers,
  constraints, and one exact next step. Move historical detail to
  `docs/PROGRESS_LOG.md` instead of accumulating a chronological transcript in
  the handoff.
- `docs/TECHNICAL_PROPOSAL.md` preserves the approved design and original phase
  gates. It must link to `docs/ROADMAP.md` for live status rather than claiming
  a stale current phase.
- `docs/PROGRESS_LOG.md` is append-only milestone history; it is not the active
  plan or handoff.

Keep the recovery surface intentionally small:

- `docs/ROADMAP.md`: at most 140 lines.
- `docs/HANDOFF.md`: at most 80 lines.
- `docs/CURRENT_STATUS.md`: at most 220 lines.
- Detailed run chronology, hashes, token ledgers, and superseded failures belong
  in `docs/PROGRESS_LOG.md` or immutable artifacts, not all three current-state
  documents.
- The documentation governance test enforces size budgets and required objective
  headings. Do not bypass it by compressing unrelated facts into unreadable
  paragraphs; move history to its durable owner.

Before starting a new implementation objective:

1. Map it to the active mainline or an explicit gate in `docs/ROADMAP.md`.
2. If it is only a local configuration, template, asset, or test gap, do not
   promote it to the mainline unless a real evaluation failure, source
   requirement, accepted ADR, or user decision makes it necessary.
3. If the mapping is missing or contradicted by current evidence, stop
   implementation and reconcile the roadmap and handoff first.
4. In the recovery report, explicitly state whether `docs/HANDOFF.md`'s current
   objective and exact next step agree with `docs/ROADMAP.md`'s active mainline
   and next gate.

When a milestone changes the active phase, mainline objective, or next gate,
update the planning documents in the same change:

1. Update `docs/ROADMAP.md` first.
2. Rewrite the affected summary and exact next step in `docs/HANDOFF.md`.
3. Reconcile phase wording, evidence, gaps, and next milestone in
   `docs/CURRENT_STATUS.md`.
4. Update `README.md`, `docs/ARCHITECTURE.md`, or
   `docs/TECHNICAL_PROPOSAL.md` only when their stable overview has become
   inaccurate.
5. Append the completed milestone and rationale to `docs/PROGRESS_LOG.md`.
6. Search the planning documents for the superseded objective or phase label,
   run the documentation format check, and report any intentionally retained
   historical occurrence.

## Stage-close documentation compaction

After every major development stage completes, and before announcing a stage
transition or beginning the next distinct stage, compact the recovery documents
as part of the same milestone:

1. Preserve the completed milestone, rationale, and durable evidence IDs in
   `docs/PROGRESS_LOG.md` and immutable artifacts before removing current-state
   detail.
2. Keep `docs/ROADMAP.md` focused on product outcome, actual phase status, one
   active mainline, and one next gate. Remove superseded active narratives.
3. Rewrite affected sections of `docs/HANDOFF.md`; never append a second current
   objective, blocker, or exact next step.
4. Remove completed chronology and superseded gaps from
   `docs/CURRENT_STATUS.md`, retaining only current capabilities, latest relevant
   verification, dependencies, and unresolved risks.
5. Preserve evidence rather than prose duplication: current-state documents may
   cite the minimal run/report IDs needed to resume, while full hashes, token
   ledgers, failures, and older checks stay in the progress log or artifacts.
6. Search all current-state documents for the superseded stage label and stale
   next-step language. Explain any intentionally retained occurrence.
7. Report before/after line counts for ROADMAP, HANDOFF, and CURRENT_STATUS, then
   run the documentation governance test, formatting check, and proportionate
   project gate.

This compaction is mandatory for major stage transitions, not for ordinary test
iterations or small implementation steps. It must never delete immutable run
artifacts, rejected assets, credential exclusions, or evidence required to
reproduce a result.

After every major implementation milestone, re-evaluate the next step against
the product outcome before continuing. A nearby TODO, schema-valid field, or
known implementation gap is not sufficient evidence that it should be next.
During implementation, follow the active roadmap gate rather than simulating a
future Agent run. Prefer evaluation-driven reusable work over unbounded
field-by-field template expansion. Finished-product gap and failure behavior is
specified in the architecture and accepted ADRs; it does not make that later
workflow part of the current development phase.

## Context compaction disclosure

- If the assistant detects that the conversation was automatically compacted,
  summarized, or resumed from a generated context summary, tell the user in the
  next commentary update before continuing substantive work.
- State what was compacted, what recovery sources will be reread, and any
  assumptions that cannot be verified from files or Git.
- After compaction, rerun the recovery protocol in this file. Do not claim that
  conversational context remained uninterrupted.
- Do not announce compaction merely because recovery documents were reread; only
  announce it when an actual compaction or summary handoff was detected.

## Stage transition disclosure

- Complete the stage-close documentation compaction protocol before announcing
  a major stage transition.
- When a major milestone is complete and the exact next step begins a distinct
  development stage, explicitly tell the user that a stage transition has
  occurred.
- At every such transition, provide a concise, copy-ready Chinese prompt for
  continuing the project in a new conversation. The prompt must name the
  workspace, require the recovery protocol, identify the completed milestone and
  exact next objective, preserve the credential/cost restrictions, and instruct
  the next assistant to trust files, Git, and tests over conversational claims.
- Do not label routine implementation steps, test iterations, or small task
  boundaries as stage transitions.
- A stage transition notice does not require the user to open a new conversation;
  clearly state that continuing the current conversation remains valid.

## Safety and scope

- Modify files only inside this repository.
- Never modify the source requirements PDF or other workspaces.
- Preserve user changes; never use `git reset --hard`, forced overwrite, or unconfirmed broad deletion.
- Never commit API keys, tokens, passwords, cookies, personal credentials, or real secrets in source, logs, fixtures, screenshots, or Git history.
- Document environment variables in `.env.example` using names and descriptions only.
- Explain size, disk use, time, and necessity before downloading large models, dependencies, or asset collections.
- Explain intended use and expected cost before invoking a paid model API.
- Record source, author, license, and required attribution for every third-party code or asset source.
- Do not copy or rename the OpenGame repository. Reuse only clearly licensed ideas or narrowly selected components with attribution and compatibility review.

## Architecture boundaries

These are target product-runtime boundaries. They constrain implementation but
do not replace `docs/ROADMAP.md` as the development sequence.

- The deterministic orchestrator owns pipeline state, run manifests, validation gates, budgets, and repair limits.
- OpenCode is an external code-agent capability accessed through its supported SDK/server and project-local extension mechanisms. Do not patch its core without a new ADR and explicit user approval.
- Legacy `ShooterGameSpec` and planned `GameAssemblySpec` are data only. They
  must not contain shell commands, source code, dynamic imports, executable
  URLs, packages, implementation paths, or arbitrary file paths.
- The thin Phaser runtime kernel owns only lifecycle, time, entities, input,
  rendering, collision, pools, assets, events, budgets, and test observation.
  Versioned reviewed modules own gameplay behavior. Normal Agent composition
  selects/configures admitted modules and binds declared compatible ports. For
  a verified in-scope coverage gap, the same API model may use OpenCode only in
  a bounded run-local new-module workspace; it may not edit the base library,
  kernel, orchestrator, validators, tests, dependencies, or permissions, and it
  may never bypass deterministic admission, registry, or resolution gates.
- Preserve the passing fixed-template pipeline as a compatibility baseline
  until module assemblies meet equivalent recovery, browser, and package gates.
- Asset selection must pass license and metadata filters before semantic or stylistic ranking.
- Verification results are immutable run artifacts. A repair may not delete required behavior or weaken tests merely to pass a gate.

## Standard commands

- `pnpm install --frozen-lockfile` - install exactly the reviewed lockfile.
- `pnpm format:check` - verify formatting without changing files.
- `pnpm typecheck` - run strict TypeScript validation.
- `pnpm test` - run the Vitest suite once.
- `pnpm check` - unified Phase 1 quality gate: format, typecheck, tests.
- `pnpm run:offline-deepseek` - replay the recorded passing Spec through an isolated run build without a model call.
- `pnpm browser:verify` - create a local acceptance run and execute desktop/mobile Chromium gates through installed Microsoft Edge.
- `pnpm package:verified -- <run-id>` - promote one hash-verified `play_checked` run into an attributed static H5 delivery.
- `pnpm opencode:probe` - run the local, no-model-cost OpenCode SDK/server probe.

Do not set `OPENCODE_RUN_MODEL_PROBE=1` until the user has selected an allowed provider/model and approved its expected cost.

## Development workflow

1. Define the objective, constraints, and acceptance checks.
2. Inspect Git state before edits.
3. Prefer small, reversible, verifiable changes.
4. Run the most focused relevant checks, then the unified gate when proportionate.
5. Review the complete diff.
6. Update stable documentation, `docs/CURRENT_STATUS.md`, and `docs/HANDOFF.md`; append `docs/PROGRESS_LOG.md` for milestones.
7. Record recurring failures as types, schemas, tests, template constraints, CI checks, or instructions.

## Git workflow

### General policy

- Treat Git as the durable engineering record and project documentation as the
  durable operational handoff. Conversation history is not a substitute for
  either.
- Never create a branch, commit, tag, push, merge, rebase, or pull request unless
  the user explicitly requests Git state changes or the active task explicitly
  includes them. It is always safe to inspect Git state and prepare a change for
  review.
- Never use `git reset --hard`, forced checkout, forced push, broad unconfirmed
  deletion, or history rewriting to clean up a worktree.
- Preserve unrelated user changes. Stage and commit only paths belonging to the
  requested change.

### Repository startup state

- This repository currently has an unborn `master` branch and no initial commit.
- Before the first commit, treat every project file as potentially user-owned and
  review the complete file inventory, ignored files, dependency lockfile, license
  records, and secret exclusions.
- Do not create the initial commit implicitly. When the user requests it, first
  run the full baseline gate and present the planned root-commit contents.
- The initial commit should be a reviewed, buildable baseline, not a mixture of
  known broken experiments. Suggested message: `chore: establish verified project baseline`.

### Branch strategy after the baseline

- Keep `master` buildable and use it as the stable integration branch.
- Use short-lived branches for implementation work with the `codex/` prefix,
  for example `codex/runtime-composer`, `codex/browser-gates`, or
  `codex/asset-index`.
- Use one branch per coherent objective. Do not combine unrelated runtime,
  documentation, dependency, and experiment work merely to reduce branch count.
- Branch from the latest verified `master`. If `master` or the working tree has
  unexpected changes, reconcile them before creating the branch.
- Prefer a normal merge or pull request. Do not rebase or rewrite a branch that
  may be shared without explicit user approval.

### Commit design

- Make small, reviewable commits that each leave the repository internally
  consistent. Separate unrelated refactors from behavior changes.
- Use Conventional Commit-style subjects where practical:
  `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`, or `build:`.
- Describe the durable outcome, not the tool used. Example:
  `feat: compose validated specs into runtime configuration`.
- Include relevant tests and documentation in the same commit as the behavior
  they protect when they form one coherent change.
- Do not commit generated runtime artifacts, local reports, caches, development
  builds, or screenshots unless they are intentionally promoted as reviewed
  evaluation evidence.

### Pre-commit gate

Before staging a commit:

1. Run `git status --short --branch` and identify all intended and unrelated changes.
2. Run the most focused tests during development, then `pnpm check` before the commit.
3. Run proportionate runtime, browser, visual, or evaluation checks for affected behavior.
4. Review the complete intended diff and update `docs/CURRENT_STATUS.md`,
   `docs/HANDOFF.md`, and `docs/PROGRESS_LOG.md` when the change moves a milestone.
5. Confirm third-party sources and licenses are recorded.
6. Confirm `api key.txt`, `apikey.txt`, `.env*`, `.runtime/`, build output,
   caches, and run artifacts are not staged.
7. Stage explicit paths rather than using broad staging when unrelated files are present.
8. Review `git diff --cached --check`, `git diff --cached --stat`, and the full
   cached diff before committing.

If any required gate is omitted, record the exact omission and reason in the
handoff instead of describing the commit as fully verified.

### Secrets and generated evidence

- Never inspect, print, diff, stage, commit, or transmit the contents of
  `api key.txt` or any other credential file.
- Verify credential filename exclusions with `git check-ignore -v` without
  reading their contents.
- Reports must contain only safe metadata. Do not preserve raw model responses
  when a bounded validation summary is sufficient.
- Before a first commit or release commit, inspect staged filenames for secrets,
  private runtime state, generated packages, and accidental large binaries.

### Push and pull-request policy

- A local commit does not authorize a push. Push only when the user explicitly
  requests it and the destination remote/branch is known.
- Never force-push unless the user explicitly approves the exact branch and risk.
- Before pushing, report the branch name, commits to be pushed, verification
  status, known risks, and whether the branch contains generated evidence.
- Pull requests should state the objective, architecture impact, verification
  performed, omitted checks, security/license review, known risks, and exact
  follow-up work.
- Do not merge a pull request unless the user explicitly requests the merge.

### Handoff requirements

- Every substantive handoff must record the current branch, revision, working
  tree state, completed checks, known risks, and exact next step.
- If work is ready but not committed, say so explicitly and list the intended
  commit boundary.
- If commits were created, report their hashes and subjects. If a branch was
  pushed or a pull request opened, report the remote branch and URL.

## Definition of Done

A change is done only when:

- requested behavior and explicit acceptance criteria are met;
- relevant schema, static, unit, integration, build, runtime, play, and visual checks have run, or omissions are precisely documented;
- no new secret, unlicensed asset, unsafe command path, or unconstrained repair path is introduced;
- generated artifacts include provenance and test evidence where applicable;
- documentation and handoff reflect actual Git and runtime state;
- known risks and the exact next step are recorded.
