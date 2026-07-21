# Architecture

Status: target product architecture approved under ADRs 0022-0024. This file
specifies how the finished Agent is intended to behave; it does not define the
current development step. The passing fixed template remains a compatibility
baseline. Development phase status and gates live only in `docs/ROADMAP.md`.

## Design goals

- Generate one family of games reliably before broadening scope.
- Make every stage resumable and independently verifiable.
- Keep model output constrained by schemas, templates, permissions, and budgets.
- Separate deterministic composition from exceptional code changes.
- Preserve provenance for code-agent actions, assets, tests, and repairs.

## Target Agent runtime system

The following flow is a product-runtime specification. It must not be read as a
list of actions to perform while building the Phase 7 module library.

```text
Natural-language request + reviewed module catalog
  -> API-model intent review and catalog coverage decision
  -> reuse path: request-bound data-only GameAssemblySpec
  -> gap path: OpenCode session + isolated run-local module proposal
  -> independent module admission gates
  -> deterministic module registry/version/compatibility resolution
  -> resolved module graph + asset-role plan
  -> engine-neutral kernel + reviewed gameplay modules + Cocos Web adapter
  -> OpenCode (only for a separately approved new-module workflow)
  -> Schema/static/build gates
  -> Isolated preview server
  -> Playwright runtime/play/visual gates
  -> Diagnoser + bounded repair controller
  -> H5 package + run manifest + verification report
```

## Ownership boundaries

### Deterministic orchestrator

Owns run IDs, state transitions, input/output paths, budgets, retries, permissions, validation, evidence, and packaging. Proposed implementation: Node.js + TypeScript.

### OpenCode adapter target responsibility

Uses the supported `@opencode-ai/sdk` to start/connect, create sessions, request structured output, send tightly scoped edit prompts, subscribe to events, abort timeouts, and record message/tool metadata. It must negotiate server version/capabilities at startup and fail closed if required interfaces are missing.

In the finished Agent, OpenCode supplies tools to the same API model for an
in-scope capability-gap workflow. It is not a second model and cannot decide
admission. The orchestrator confines changes to a run-local module workspace
and controls files, commands, imports, dependencies, tokens, time, and repair
rounds. Building that controller is later roadmap work, not a Phase 7 action.

### Requirement analyzer

Uses a narrow provider adapter for model extraction, requests provider-native JSON output with the complete model-visible contract, then runs unchanged local validation and semantic normalization. OpenCode remains the code-agent runtime. Validation failure stops before source generation; any later specification-repair request must be separately bounded and budgeted.

### Runtime kernel and module library

ADR 0022 replaced fixed-template expansion with a thin engine kernel plus
versioned gameplay modules. ADR 0029 now directs the active adapter from Phaser
to Cocos Creator Web/H5 while preserving Phaser as a migration oracle. ADR 0023 refines those modules into orthogonal
single-player capability axes instead of one broad weapon/template abstraction:
player intent, locomotion, targeting, attack trigger, attack delivery, combat
interaction, progression/loadout, encounter flow, companion behavior, scoring,
and outcomes. Multiplayer, networking, split-screen, PvP, and synchronization
are outside the active product scope.

The kernel owns browser lifecycle, time, entities, input, rendering, collision,
pools, assets, event delivery, resource budgets, and read-only test observation.
It must not own health, weapons, drops, waves, Boss progression, scoring, or
outcome rules.

Every local `GameModuleManifest` declares its ID/version, kernel compatibility,
provided/required capabilities, typed event ports, bounded configuration,
dependencies, conflicts, cardinality, entity ownership, resource contribution,
browser support, provenance, and tests. A deterministic registry pins exact
versions and rejects unknown, ambiguous, cyclic, conflicting, incompatible, or
over-budget graphs.

The Phase 7 contract foundation implements module boundaries under
`src/modules/`. The kernel seam lives under
`game-template/vertical-shooter/src/runtime-kernel/`: engine-neutral contracts,
deterministic core services, and the preserved Phaser adapter. Phase 7D adds a
reviewed Cocos adapter without moving gameplay rules or exposing engine objects
to modules. The preserved `PlayScene` remains a parity oracle. Version selectors are
deliberately limited to exact, caret, or tilde forms. Registered local
configuration schemas validate all module
configuration, and resolution also rejects missing capabilities, invalid port
bindings, duplicate exclusive ownership, cardinality violations, incompatible
kernel/engine versions, and aggregate budget excess.

`GameAssemblySpec 1.0.0` is the normal composition output. It may select reviewed
module IDs/version ranges, configure them, instantiate entities, bind declared
ports, and request asset roles. It may not contain implementation code,
commands, packages, imports, executable URLs, paths, or undeclared events. The
current vertical-shooter template stays available only as a migration and
behavioral-parity adapter until the module path meets equivalent gates.

The target architecture requires reviewed implementation factories and a
deterministic resolved-graph instantiator. Production wiring originates from a
request-bound `GameAssemblySpec`. For an in-scope catalog gap, module source may
be created only through the bounded OpenCode workflow; source never enters
`GameAssemblySpec`. Local admission, resolution, instantiation, and verification
retain authority. `docs/ROADMAP.md` owns when these subsystems are developed.

The contract gate uses data-only fixtures for fixed-forward auto-fire,
directional active fire, automatic targeting, polarity/absorption, and slotted
weapon/armor/companion composition. These fixtures demonstrate schema and
resolver expressiveness; they are not claims of implemented runtime behavior.
Implementation status and the exact next gate are intentionally omitted here;
they are recorded in `docs/CURRENT_STATUS.md` and `docs/HANDOFF.md`.

#### Executable module architecture

`docs/BASE_MODULE_LIBRARY_PLAN.md` is the complete Phase 7 library design. It
defines the reviewed module families across all orthogonal capability domains,
the shared payload/configuration/ownership/resource model, representative
interaction sets, four implementation batches, admission evidence, and the
legacy-parity route. `docs/BATCH_1_MODULE_DESIGN.md` narrows the first batch to
reviewed module contracts; it does not limit later library scope. Accepted ADR
0026 records the runtime remediation required before those contracts are safe to
implement; current status remains in the recovery documents.

ADR 0025 requires each production registration to bind a canonical manifest,
canonical configuration/reservation descriptors plus local validation, and one
reviewed implementation bundle export. Evidence hashes canonical descriptor and
bundle bytes, dependency-lock identity, and build/toolchain identity—never
runtime function or Zod objects.
Production Batch 1 uses `GameModuleManifest 1.2.0`, `GameAssemblySpec 1.1.0`,
and `ResolvedModuleGraph 1.2.0`. Legacy Manifest 1.0/1.1, Assembly 1.0, and Graph
1.1 retain their previous bytes and semantics. Manifest 1.2 adds scoped
dependencies, admitted asset requirements, and canonical service descriptors.
Graph 1.2 carries exact ready/blocked evidence instead of reinterpreting the
legacy production boolean; only a ready graph with matching frozen catalog
evidence may instantiate.

Accepted ADR 0027 adds Manifest 1.3, Assembly 1.2, and Graph 1.3 without
widening Batch 1 bytes. Graph 1.3 may mix admitted Manifest 1.2/1.3 instances;
each retains its exact version-selected factory context. New graph-derived
authority covers bounded actor/entity snapshots, explicit attack channels,
projectile lineage, conditional and maximum-reachable reservations, prepared
pickup effects, singleton addressed modifier routes, defense timing, and
aggregate pattern budgets. Production factories receive only resolved grants.

Batch 3 Revision 2 and accepted ADR 0028 define the next strict boundary:
Manifest 1.4, Assembly 1.3, and Graph 1.4 add bounded host-minted actor-root
channels, source-generation-bearing V3 hostile attack pipelines, independent
physical pools under explicit host-owned contention groups, actor-set combat,
single-writer scoring, and a deferred terminal outcome commit. Strict schema/
type isolation and complete pure authority/readiness resolution are implemented;
mixed-version production instantiation, host authority, isolated-build, and
desktop/mobile browser conformance now close the pre-factory ABI gate. This work
does not reinterpret accepted Manifest 1.2/1.3 paths or the frozen Batch 2 graze
factory.

Fixture registration remains resolvable for regression, but only a production
registration that independently matches canonical descriptors, reviewed bundle
bytes, dependency-lock identity, toolchain identity, and expected artifact hash
can authorize routing. The reservation evaluator must equal its canonical
descriptor and remain within Manifest ceilings. Assemblies reference
registry-owned contact profiles and declare only each owner's damage-route head;
the resolver expands exact policy artifacts and the full linear sink route.

The deterministic runtime accepts only ready Graph 1.2 data. Handlers are
declared before initialization; initialize may retain state,
subscription start leases activate before stable provider/port-ordered replay,
and events remain blocked until running. State revisions and event sequences are
strictly increasing, handlers are synchronous, stop zeros subscription leases,
resume replays only latest state, and graph destruction clears retained routing
state. This router is pure infrastructure, not a gameplay factory or full graph
instantiator.

The execution host contains a host-owned lease ledger, guarded lifecycle/frame
coordinator, loader-minted executable boundary, contact transaction host,
active-generation ledger, logical entity directory, scoped service host,
browser runtime catalog, and production Graph instantiator. The ledger enforces
Manifest 1.2 start/instance/graph ceilings, reverse revocation, and zero-residue
assertions. The coordinator initializes/starts/updates provider-first, cleans up
in reverse, preserves pause state, rolls failure through graph destruction, and
rejects thenables. Production instantiation accepts only semantic scoped
services. Runtime payload, routing, contact,
entity, lease, lifecycle, catalog, and instantiation code is browser-safe;
canonical hashing and admission stay Node-side. The template's Phaser registry
holds the frozen catalog/execution foundation, while a lifecycle owner binds
scene shutdown to terminal disposal and graph destruction. One top-level guard,
inherited bounded event tokens, deterministic simulation time, retained-state
start barrier, and running auto-stop implement ADR 0026.

Factories receive scoped gameplay-neutral services rather than Phaser or the
unrestricted kernel. Capabilities are actor-owner scoped by default;
cross-owner inputs constrain source/target actor roles and source entity roles.
Safe logical entity channels permit contact without engine objects in ports.
Manifest descriptors bind owned channel outputs and capacity resources;
detector and resolution descriptors close candidate lineage. Assembly selects
only concrete transfer recipients within manifest roles. The resolver alone
emits frozen channel readers and final mutation grants for instantiation.
Their current transfer operation changes logical actor ownership while the
origin channel retains cleanup custody; cross-channel custody transfer requires
a separately reviewed protocol. Production declarations must ultimately be
derived from resolved evidence rather than injected harness fixtures.
Detection emits a candidate without mutation. Final contact resolution runs a
registry-owned `ContactPolicyChainProfile` as one bounded synchronous
transaction over frozen decisions; policy transforms are not ordinary event
subscribers. The restricted `contact-policy-transform-v1`
`ContactPolicyTransform` returns exactly once, preserves contact/source/target
identity, changes only manifest-authorized fields, and cannot receive mutation
grants. The resolver rejects unsupported policy order before instantiation.
Only successful final resolution may consume, retain, or transfer the source.

Decision `disposition` and `sourceOperation` are separate closed dimensions.
Damage output targets owner-scoped `combat.damage-sink@1.0.0`, not concrete
health. Health is the terminal sink; shield and invulnerability can be upstream
sinks. Resolution proves one same-owner linear path to exactly one health owner
and rejects below-head bypass, fork, duplicate, cycle, or unterminated chains.
Multiple damage producers may share the one owner route head. These rules keep
Batch 1 ABI stable when later defense modules are inserted.
Input listeners, timers, overlaps, subscriptions, readers, channels, and pools
are tracked as start-, instance-, or graph-scoped leases. Per-instance resource
grants come from the reviewed reservation function bounded by manifest ceilings
and enforce the aggregate admission decision at runtime. Runtime-lease ceilings
and release assertions match stop/pause, dispose, and graph destruction.
The Phaser-backed scoped host acquires a lease atomically with each engine side
effect, rolls registration failure back before returning, reverses cancellable
start resources on stop, empties active pool generations while retaining pool
leases during pause, and releases pool/reader leases on disposal. Exact active
entity/projectile and trailing-1,000-ms spawn grants are enforced before
activation; exact live timer slots come only from reservation grants under the
single manifest timer ceiling. Factories receive only semantic safe actors,
logical channels, content-addressed textures, viewport, observation, ports, and
policy/commit services. Entity activation pre-reserves session quarantine
capacity, and indeterminate custody blocks verification and packaging.

`stop -> start` is pause/resume of one graph. A new game always disposes and
instantiates a new graph. Phase 8 should later add reviewed `AssemblyRecipe`
records that deterministically expand high-level choices into a normal
`GameAssemblySpec` without bypassing existing gates.

The execution ABI is deliberately gameplay-neutral but must support the
complete library: additional targeting, trigger, delivery, combat,
progression, encounter, companion, scoring, and outcome modules add reviewed
factories and payload versions rather than new engine escape hatches.

### Asset system

Stores immutable source records and derived files separately. Hard filters precede ranking. The first implementation can use JSON/SQLite metadata plus deterministic keyword scoring; local embeddings are an optional later stage after a retrieval baseline exists.

The implemented JSON baseline lives under `src/assets/`. Catalog schema v1.0.0
rejects unknown fields, unsafe paths, missing review evidence, duplicate IDs,
duplicate source hashes, and mixed source/derived path ownership. The proposed
license policy admits only reviewed `CC0-1.0` and `CC-BY-4.0` records with
commercial-use, modification, and redistribution permission; other records are
rejected or held for manual review. This allowlist was confirmed under ADR 0007.
The confirmed Batch 001 corpus contains 35
project-owner-approved third-party PNG source images.

ADR 0010 replaces source-pack-driven expansion with five complete 70-image
visual-theme kits. Each kit has fixed player, enemy, Boss, background,
projectile, pickup, UI, and effect quotas plus source-concentration,
visible-bounds, semantic-role, and contact-sheet gates. The final planned corpus
is 350 complete-kit images plus five existing supplemental records, for 355
eligible third-party source images. Rejected acquisitions remain immutable
evidence and do not fill kit quotas.

### Asset selection and materialization

ADR 0018 inserts a strict catalog-grounding boundary before selection for live
natural-language Specs. `asset-query-grounding.json` policies through v1.1.2
bind the canonical validated Spec and exact catalog SHA-256, record every
source/target vocabulary term plus rule and rationale, and permit changes only
to a derived theme/style/tag view. Explicit reviewed mappings take priority over
same-named vocabulary that exists only in rejected catalog records. Unknown and
ambiguous terms fail closed. The original Spec continues into the Composer
unchanged, and selection still requires positive theme and visual-style
evidence. Run manifests, browser resumption, and final packaging rehash the
grounding artifact when it is present.

ADR 0019 inserts `SpecCompletionPolicy 1.0.0` before grounding. It preserves a
model-produced `source-spec.json`, derives only allowlisted missing background
or enemy-projectile queries into the effective `spec.json`, and records every
decision and both Spec hashes in `spec-completion.json`. Manifest 1.4.0 binds
these optional artifacts, and browser resumption plus packaging deterministically
re-execute the policy. Gameplay fields, existing queries, catalog records,
positive-match gates, and legacy geometric Specs remain unchanged.

ADR 0020 adds `SpecIntentLedger 1.0.0` at the natural-language requirement
boundary. It binds the exact request, its NFKC normalization, and the canonical
source Spec; supported user locks carry request spans and deterministic domain
bindings, while unstated player health is structurally Agent-owned. The ledger
is deterministically rebuilt for verification, and scoped unknown, conflicting,
ambiguous, mismatched, or tampered evidence fails closed. The current zero-model
replay proves the boundary.

ADR 0021 adds `SpecPlayabilityCompletionPolicy 1.2.0`. It deterministically
reverifies the ledger and may derive only Agent-owned `/player/maxHealth` for
Boss-defeat games, currently to the evidence-backed ceiling of 60 while
retaining replay support for the earlier 20/40 decisions. Manifest
1.5.0 binds the source Spec, intent ledger, intermediate playability Spec,
gameplay decision, later asset completion, and final Spec. Browser resumption
and packaging replay the entire chain; uncertain ownership and tampering fail.

When explicitly enabled, run planning verifies the fixed corpus and converts
every `ShooterGameSpec.assetQueries` entry into a strict
`asset-selection.json`. A candidate must pass rights/category/technical filters
and have positive theme and visual-style matches; deterministic zero-score
fallbacks fail closed. The artifact binds the catalog SHA-256, selected record,
source SHA-256 and metadata, provenance/license/attribution, ranking evidence,
and fixed workspace/runtime paths.

Only unique selected source files are copied into the isolated template's fixed
`public/assets/catalog/` directory. The complete catalog and unselected files do
not enter the run. Manifest v1.2.0 records the selection artifact hash while the
parser remains compatible with pre-asset v1.1.0 manifests.

The Composer converts the verified plan into a strict data-only
`RuntimeGameConfig.resolvedAssets` map. Catalog mode resolves every query to a
fixed texture key, runtime URL, source hash, and dimensions; background and
enemy-projectile roles are explicit. The fixed template validates this map again
without bundling Agent code, preloads unique textures, and renders query-bound
player, enemy, Boss, projectile, pickup, background, UI, and effect images.
ADR 0011 adds optional, category-checked UI-HUD and pickup-effect role IDs while
preserving older seven-role catalog maps. Geometric textures exist only behind
explicit `legacy-geometric` mode. After Vite builds, the orchestrator recomputes
every selected package-file hash before recording the run as built. ADRs 0009
and 0011 record this boundary.

### Final packaging

Only a `play_checked` run can enter final packaging. The orchestrator recomputes
the complete manifest evidence chain, requires semantic passing desktop and
mobile Chromium results, directly rechecks selected asset bytes, and scans the
production boundary for development or credential markers. It then assembles a
temporary static delivery containing the game, run instructions, dependency
notices, selected-asset attribution/license evidence, and a deterministic file
inventory. Atomic promotion records both the inventory and directory SHA-256
values before transitioning to `packaged`. New completion-aware runs use
manifest v1.5.0 while the parser retains v1.1.0-v1.4.0 compatibility. ADRs 0012,
0019, and 0021 record this boundary.

### Verification and repair

Verification emits machine-readable findings with gate, severity, evidence, and suspected files. Repair accepts only a selected finding set, uses a diff/file/round budget, and reruns the failed gate plus required regression gates.

The modular path adds per-module schema/unit/property/resource tests, resolver
contract tests, representative interaction sets, and legacy parity. Browser
evidence must separate controls, mechanics, reachability, resource safety,
outcomes, and visuals. A successful automated play trace remains useful
regression evidence but is not the sole definition of playability.

### Multi-game evaluation

ADR 0016 adds a strict versioned batch definition and per-case/aggregate report
above the existing run stages. A case binds one local valid Spec to a stable ID,
request, expected differentiators, resource profile, asset-selection mode, and
browser assertion profile. The no-paid runner executes cases sequentially,
continues after preserved failures, and records gates, time, disk, repair,
intervention, model, token, and cost data.

ADR 0017 keeps the comprehensive browser fixture as a deep regression and adds
a strict case-aware profile that derives applicable assertions and the expected
terminal outcome from validated case data instead of requiring every game to
share the fixture's exact IDs and Boss sequence. Both profiles retain
fail-closed lifecycle, public-input controls, responsive layout,
console/page/request, resource-budget, screenshot, configured-gameplay, and
bounded failure evidence.

### Scoring and hit geometry

ADR 0013 defines pure immutable scoring transitions for defeat combos, flat
pickup bonuses, combo expiry, and one-shot enemy-projectile grazes. Defeat
multipliers grow inside the configured inclusive window, respect fractional
caps, and floor the awarded points. Graze detection uses an 18-pixel annulus
outside circular world-space player/projectile hit bodies rather than texture
rectangles. Ordinary enemies use stable planned x lanes instead of runtime
random placement. Frozen play/end snapshots preserve current and historical
scoring evidence, and both desktop and mobile gates must exercise combo and
graze behavior only through public input paths.

### Game-outcome execution

ADR 0014 routes all three win and both loss condition variants through one pure
deterministic evaluator. Phaser callbacks mutate only state; one per-frame
decision uses elapsed play time, score, health, and explicit Boss-defeat state.
Thresholds are inclusive, configured wins take precedence when win and loss
mature on the same frame, and end evidence records the reason and elapsed time.
The derived schedule remains planning metadata instead of silently adding an
undeclared timeout loss.

## Run state model

Proposed states:

`received -> spec_generated -> spec_validated -> planned -> composed -> code_adjusted -> built -> runtime_checked -> play_checked -> packaged`

Any verification state may transition to `repairing`, then back to the failing gate. Terminal exceptional states are `failed`, `cancelled`, and `repair_budget_exhausted`.

Each transition writes a manifest entry before the next side effect. Resuming reads disk state and validates artifact hashes rather than trusting conversation history.

## Proposed run artifact layout

```text
artifacts/runs/<run-id>/
  request.json
  source-spec.json
  spec-intent-ledger.json
  module-catalog.json
  game-assembly-spec.json
  module-resolution.json
  resolved-module-graph.json
  playability-spec.json
  spec-playability-completion.json
  spec.json
  spec-completion.json
  plan.json
  asset-selection.json
  workspace/
  logs/
  screenshots/
  repairs/
  verification.json
  manifest.json
  package/
  delivery/
    game/
    RUN.md
    THIRD_PARTY_NOTICES.md
    THIRD_PARTY_ASSETS.json
    PACKAGE_MANIFEST.json
```

This directory is ignored by default during development; selected evaluation reports may later be promoted into version control.

## Specification evolution

`ShooterGameSpec 1.0.0` remains the legacy compatibility input. The modular
path introduces `GameAssemblySpec 1.0.0`; it will coexist until the same request,
recovery, browser, and package evidence can be reproduced. Converters may read
legacy data, but they may not silently rewrite immutable source Specs.

## ShooterGameSpec legacy design

The canonical schema is versioned and shared between runtime validation and TypeScript types. Zod is recommended for authoring, with generated JSON Schema supplied to OpenCode structured output.

Top-level sections:

- `schemaVersion`, `title`, `theme`, `story`, `visualStyle`, `difficulty`
- `viewport` and performance budgets
- `player`, `weapons`, `enemyWaves`, `boss`
- `bulletPatterns` referencing a closed pattern enum
- `pickups`, `scoring`, `winCondition`, `loseCondition`
- `controls` for keyboard and touch
- `audioStyle`
- `assetQueries`

Security constraints:

- reject unknown fields where practical;
- closed enums for module and pattern selection;
- bounded numeric values and total active-object budgets;
- logical asset IDs only, never arbitrary paths;
- no code, command, URL execution, package dependency, or import fields;
- cross-field checks for referenced patterns/assets, boss phases, reachable win/loss rules, and performance budgets.

## Bullet pattern library

The runtime supports the complete closed pattern enum: `radial`, `spiral`,
`fan`, `aimed`, `wave`, `rain`, `rotatingRing`, and `burst`.

Every pattern implements a common pure planning interface that produces spawn vectors/timestamps from constrained inputs. Runtime spawning uses pooled Phaser objects. Validation applies:

- per-pattern count, speed, interval, duration, and angular bounds;
- global active enemy-bullet and spawn-rate budgets;
- minimum telegraph and reaction-time heuristics;
- deterministic seed support for tests;
- unit tests for geometry and bounds;
- browser tests for object caps, frame stability, visibility, and avoidability smoke checks.

Within each Boss phase, every configured `patternIds` entry receives an
independent deterministic schedule in stable array order. The runtime emits
once immediately, repeats at that pattern's own `intervalMs`, stops after its
bounded `durationMs` emission count or a phase transition, and shares the one
global pooled enemy-bullet cap with every sibling pattern. Duplicate IDs remain
explicit independent emitters rather than being silently deduplicated.

ADR 0015 applies the same source contract to ordinary waves. Every successful
enemy spawn independently executes every configured wave pattern, recomputes
live-player aim when required, and cancels its timers on destruction, offscreen
recycling, Boss entry, or scene end. Global pattern totals remain available,
while nested wave-pattern evidence proves the configured source and its exact
budget contention.

## Asset metadata and retrieval

Minimum record:

`assetId`, logical/derived paths, source URL/site, author, license/SPDX or custom terms, attribution, category/subcategory, description, tags, visual style, theme, palette, dimensions, format, hash, modification and redistribution permissions, collection date, review status.

Retrieval stages:

1. Exclude unreviewed or incompatible licenses.
2. Filter by category, intended use, format, dimensions, and transparency needs.
3. Score theme/style/tag text match.
4. Optionally score local multimodal embedding similarity.
5. Rerank the complete game set for palette/style coherence and diversity.
6. Return selected IDs, scores, rationale, provenance, and fallbacks.

The deterministic baseline implements stages 1-3 with category and technical
compatibility as hard filters, weighted theme/style/tag/palette matches, and
`assetId` tie-breaking. It also reports every license or technical exclusion.
Source-image counts use unique eligible source SHA-256 values; derived variants
are excluded and origins are reported separately until the final counting scope
is confirmed.

## Browser verification design

Use Playwright against a production build served from an isolated generated workspace. The template exposes a read-only test bridge in test builds, for example lifecycle state, entity counts, score, health, boss phase, and deterministic seed; test-only state mutation is narrowly controlled and absent from production packages.

Viewport matrix proposal:

- Desktop Chromium: 1280x720
- Mobile Chromium emulation: 390x844 with touch
- One additional engine or WebKit/mobile check before final acceptance

Layered gates:

- Schema: structure, bounds, references, security.
- Static: format, lint, typecheck, imports, asset paths.
- Build: dependency lock, production build, bundle output.
- Runtime: page/canvas loads, no blocking console or asset errors, loop advances.
- Play: start, move, touch, shoot, spawn, collision, score, damage, loss, win, restart.
- Visual: readable buttons/text, no major overlap/clipping, coherent selections, usable desktop/mobile screenshots.

## Bounded repair policy

- Default maximum: 3 rounds per run.
- Browser failures remain terminal by default; only an explicit repairable mode
  emits a finding while preserving a repair-entry state.
- Findings are strict fingerprinted data bound to one hashed verification
  report and a bounded suspected-file set.
- Per round: one diagnosed issue cluster, explicit target files, and a small diff budget.
- The first controller accepts only unique exact-match replacements in fixed
  allowlisted workspace source files; it cannot target tests, test
  instrumentation, dependencies, or files outside the run.
- No dependency addition, config-permission broadening, test deletion, or requirement relaxation without approval.
- Rerun the failing gate after every patch; on success rerun its required downstream/regression gates.
- Stop on repeated identical failure, budget exhaustion, unsafe requested action, or missing external dependency.
- Persist input evidence, diagnosis, prompt/session ID, patch, commands, results, and remaining issues.
- Preserve the original package and failed verification; repaired packages,
  pre-repair files, ledgers, and regression evidence live under
  `repairs/round-N/`.

## Deployment modes

- Development: local orchestrator, local OpenCode server/client, local preview server, Playwright browser.
- Evaluation: clean local/CI worker with pinned lockfile and browser versions; each generated game has an isolated workspace and time/resource limits.
- Final H5 artifact: static files deployable to a standard static host. No model credentials or OpenCode runtime are included.
