# Cocos Runtime Migration Plan

Updated: 2026-07-22
Status: Approved direction; implementation not started
Owner: deterministic orchestrator and reviewed runtime kernel

## Goal

Move generated H5 games from Phaser 3.90.0 to a pinned Cocos Creator Web
runtime while preserving the reusable Agent, reviewed gameplay library,
deterministic authority boundaries, immutable evidence, and fail-closed package
promotion. This is an engine-port program, not a rewrite of the product or a
license for generated code to modify trusted infrastructure.

## Working assumptions to validate

- “Cocos” means Cocos Creator targeting desktop and mobile Web/H5.
- The exact Cocos Creator version and supported command-line build workflow are
  selected only after a bounded local compatibility spike.
- A generated game consumes deterministic data and a reviewed runtime project;
  model output cannot select engine versions, edit engine adapters, or inject
  dependencies, scripts, native plugins, or editor extensions.
- Phaser remains installed and runnable only as a migration oracle until Cocos
  parity and package promotion succeed.

## Reuse ledger

| Area                                                                 | Disposition                                       | Required proof                                            |
| -------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------- |
| Requirement/provider adapters and intent/completion ledgers          | Reuse unchanged                                   | Existing schema/hash tests pass                           |
| `ShooterGameSpec`, Manifest 1.2-1.4, Assembly 1.1-1.3, Graph 1.2-1.4 | Reuse unchanged initially                         | Canonical fixtures are byte/hash stable                   |
| Registry, loader admission, resolver, catalog, instantiator          | Reuse; isolate browser-path assumptions           | Node/browser closure tests pass against Cocos output      |
| Authority, custody, budgets, quarantine, ports, score, outcome       | Reuse unchanged                                   | Existing deterministic tests plus adapter contracts pass  |
| Reviewed gameplay factories and pattern planners                     | Reuse unchanged by default                        | Same input traces yield equivalent semantic events        |
| Asset provenance, selection, materialization, notices                | Reuse policy and records                          | Cocos import/materialization map is deterministic         |
| Browser verification and read-only observation                       | Reuse assertions; replace bridge binding          | Desktop/mobile assertions map to Cocos snapshots          |
| Run state, recovery, immutable evidence, bounded repair              | Reuse schemas; extend engine identity             | Resume/rehash tests reject cross-engine drift             |
| Package promotion                                                    | Reuse fail-closed rules; replace output allowlist | Rebuilt Cocos package hashes and contains no editor state |
| Phaser scenes, loader, pools, physics/contact, rendering             | Replace with Cocos adapter/project                | Adapter parity and cleanup tests pass                     |
| Vite Phaser template build                                           | Replace for generated runtime                     | Reproducible Cocos Web build and preview are proven       |

## Work breakdown

### M0 — Inventory and contract freeze

Deliverables:

- machine-readable engine-dependency inventory covering source, tests, scripts,
  package metadata, browser gates, recovery, evidence, licenses, and docs;
- port matrix mapping every Phaser-owned capability to an existing semantic
  service or a new Cocos adapter responsibility;
- baseline fixture list and immutable hashes for representative Graph 1.2,
  Graph 1.3, production Graph 1.4, fixed template, browser reports, and package;
- forbidden-change list for module factories and deterministic orchestrator.

Exit checks:

- every Phaser import/reference is classified as oracle, replace, adapt, or
  historical documentation;
- no Cocos dependency, project, or generated artifact has been added yet;
- focused documentation/contract checks pass.

### M1 — Bounded toolchain compatibility spike

Before execution, request approval for the exact version/source/download size.
Use one minimal Cocos project and no paid model call.

Deliverables:

- ADR 0029 amendment pinning the supported Cocos Creator version and build mode;
- reproducible commands for clean build, preview server, and Playwright launch;
- output allowlist, cache/editor-state exclusions, license notices, and clean
  worker prerequisites;
- evidence showing desktop and mobile Web boot, deterministic seed visibility,
  pause/resume, teardown, and zero console/page/request failures.

Fail closed if the build needs interactive editor state, undisclosed network
access, credentials, non-redistributable runtime files, or unverifiable output.

### M2 — Engine-port contract and Cocos host

Create a reviewed Cocos adapter behind the existing semantic runtime boundary.
Keep gameplay modules unaware of Cocos nodes, components, physics objects,
asset handles, director state, or the unrestricted kernel.

Adapter surfaces:

1. lifecycle and deterministic frame clock;
2. keyboard/pointer/touch input arbitration;
3. logical entity identity/generation and bounded component/node ownership;
4. projectile/entity pools and conservative quarantine;
5. body/overlap/contact proposals with source-first commit semantics;
6. asset resolution/loading and deterministic render metadata;
7. viewport scaling, world bounds, visibility, and mobile orientation behavior;
8. sound/effect handles if required by the preserved assembly;
9. cleanup, restart, failure disposal, and leak observation;
10. frozen read-only verification snapshots absent from production packages.

Exit checks:

- fake-host and Cocos-host contract suites share the same semantic traces;
- module contexts expose no Cocos object or expanded authority;
- time/order/coordinate conversions are explicit and property-tested.

### M3 — First Cocos vertical slice

Port the smallest representative Graph 1.2 slice. Reuse reviewed movement,
trigger, delivery, damage, scoring, and outcome modules. Add only the adapter
capabilities required to boot, play, win/lose, restart, and clean up.

Acceptance:

- keyboard and touch movement remain bounded and mutually well-defined;
- firing, one hostile delivery, collision/damage, score, and outcome execute;
- restart produces fresh logical generations and zero residual listeners,
  timers, contacts, or active pooled entities;
- desktop 1280×720 and mobile 390×844 gates pass with bounded counts and no
  browser errors;
- production package contains neither test mutation authority nor editor state.

### M4 — Recover the reviewed Batch 2/3 catalog

Recover by capability clusters, not by copying Phaser scenes:

1. defenses, pickups, progression, modifiers, and formations;
2. waves, Boss phases, targeting, eight hostile delivery patterns, and shared
   contention with independent physical pools;
3. frozen Graze, actor-set health, both owner-correct V2 contact routes;
4. fractional score ledger, retained outcome conditions, and win-first frame
   tail coordination.

Each cluster needs unit/property, adapter-contract, isolated-build, and focused
browser evidence. A cluster may expose an adapter gap but may not widen an
older module context or rewrite frozen factory bytes.

### M5 — Legacy-equivalent Cocos assembly and promotion

- finish deterministic preserved-v2-Spec to Assembly 1.3 derivation;
- resolve the complete production Graph 1.4 and exact score evidence;
- compare semantic trace fixtures rather than engine-private object layouts;
- pass desktop/mobile gameplay, visual, performance, cleanup/restart, recovery,
  asset provenance, package-content, secret scan, and rehash gates;
- produce one immutable verified Cocos package and record hashes in status.

Only after M5 may a separate decision retire the active Phaser build path.
Historical Phaser artifacts, hashes, ADRs, and progress records remain intact.

### M6 — Consolidation and continuation

- make engine identity explicit in supported specs/manifests/run evidence where
  required without allowing user/model selection;
- remove active Phaser dependencies and adapter code only after a license,
  package, and stale-reference audit;
- reconcile README, requirements, architecture, technical proposal, notices,
  scripts, CI/clean-worker instructions, and recovery docs;
- resume required Batch 4 against Cocos, then Phases 8 and 9.

## Verification strategy

Use three comparison layers:

1. **Exact reuse:** hashes/canonical fixtures for data contracts, manifests,
   reviewed factories, plans, and evidence schemas.
2. **Semantic parity:** deterministic event traces for input, spawn, contact,
   damage, score, outcome, cleanup, and resource decisions.
3. **Rendered acceptance:** desktop/mobile browser behavior, screenshots,
   visibility, responsive layout, performance ceilings, restart, and package.

Rendered pixels and physics internals need not be byte-identical across engines;
observable rules, authority, budgets, and acceptance outcomes must be equivalent
or an intentional difference must receive a new decision and test.

## Risks and mitigations

| Risk                                                  | Mitigation                                                |
| ----------------------------------------------------- | --------------------------------------------------------- |
| Cocos build depends on GUI/editor-local state         | M1 clean-build proof; fail closed before implementation   |
| Engine callbacks change deterministic ordering        | Host-owned frame coordinator and trace parity tests       |
| Coordinate/physics differences change gameplay        | Explicit conversion layer and swept/contact fixtures      |
| Asset import metadata makes packages nondeterministic | Reviewed import map, allowlist, clean rebuild hashes      |
| Port turns into gameplay rewrite                      | Freeze factory bytes; adapter-gap review per cluster      |
| Dual-engine maintenance expands indefinitely          | Phaser is oracle only; retirement decision after M5       |
| Bundle size/startup/mobile performance regresses      | Establish M1/M3 budgets and gate package promotion        |
| New toolchain adds license or distribution limits     | Source/license review before install or package admission |

## Ordered next actions

1. Build the M0 inventory and port matrix.
2. Select a minimal representative Graph 1.2 fixture and record baseline hashes.
3. Draft the exact M1 spike proposal: version candidate, source, size, commands,
   expected files, timeout, rollback, and pass/fail criteria.
4. Obtain explicit approval for any download or dependency change.
5. Run M1; amend ADR 0029 and only then schedule adapter implementation.
