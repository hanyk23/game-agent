# Technical Proposal

Status: core architecture confirmed on 2026-07-15. This document preserves the
original phase definitions; actual phase status and active work are maintained
in `docs/ROADMAP.md`. Model budget, asset counting policy, and final generation
time limit remain operational decisions.

Architecture amendment: the passing fixed-template design below is retained as
historical rationale and a compatibility baseline. On 2026-07-17 the user
approved ADRs 0022-0024, which supersede fixed-template expansion with a thin
Phaser runtime kernel, an executable base-module library, data-only
`GameAssemblySpec`, deterministic local resolution, and a later bounded
API-model gap-development path through OpenCode. These clauses describe target
product behavior, not the current implementation procedure. The active
development sequence and gates are in `docs/ROADMAP.md` and
`docs/BASE_MODULE_LIBRARY_PLAN.md`.

## Recommendation in one sentence

Build a deterministic TypeScript generation pipeline that uses OpenCode through its supported SDK as a permission-bounded code agent, composes a pinned Phaser template from a validated specification and licensed asset catalog, and validates the result through Playwright before a maximum-three-round repair loop.

## OpenCode integration options

| Option                                           | Advantages                                                                                     | Risks/limits                                                                                                                                              | Verdict                                                               |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| A. Formal extension only: Skills, tools, plugins | Native user experience; supported mechanisms; easy to teach the agent domain workflows         | Plugin hooks are event-oriented, not a complete durable pipeline; run state, artifact ownership, retries, and packaging would be awkward inside a session | Use as a companion layer, not the sole architecture                   |
| B. Standalone orchestration invoking OpenCode    | Strong determinism, resumability, testability, budgets, and artifact control                   | Requires an adapter and version compatibility tests                                                                                                       | Primary architecture                                                  |
| C. Reusable SDK/interface dependency             | Type-safe sessions, structured output, event stream, abort, permissions; avoids shell scraping | Fast-moving API must be pinned and capability-checked                                                                                                     | Use with B through `@opencode-ai/sdk`                                 |
| D. Fork OpenCode core                            | Maximum control                                                                                | High maintenance cost, divergence, security burden, and weak research distinction                                                                         | Reject unless a future documented blocker survives a proof-of-concept |

Recommended combination: **B + C**, augmented by selected **A** mechanisms. The orchestrator uses the SDK; project Skills describe game-domain procedures; custom tools expose safe, schema-validated composition/verification operations; plugins may record events or enforce extra policy. Core OpenCode remains upstream.

## How this differs from OpenGame

- OpenGame is a design reference, not the project base.
- This project narrows the domain to one vertical bullet-hell template and makes the game specification the primary intermediate representation.
- The reviewed base library owns common cases; OpenCode gives the same API model bounded code tools only for verified in-scope capability gaps or repair.
- Asset license filtering is a hard gate before semantic ranking.
- Browser behavior is validated with explicit domain assertions and deterministic seeds, not only generic visual judgment.
- The repair controller is outside the agent session and writes auditable run artifacts.
- No OpenGame runtime, GameCoder model, repository structure, or provider stack is copied.

## Proposed technology stack

| Area              | Proposal                                                                 | Reason                                                                             |
| ----------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Language/runtime  | Node.js LTS + TypeScript                                                 | Matches OpenCode SDK, Phaser, Playwright, and shared types                         |
| Package manager   | pnpm with committed lockfile                                             | Reproducible workspace and efficient installs                                      |
| Orchestration     | Explicit typed state machine in project code                             | Durable, inspectable, resumable pipeline without premature workflow infrastructure |
| Agent integration | `@opencode-ai/sdk`, pinned after spike                                   | Official typed client, structured output, sessions, events                         |
| Schema            | Zod as source + generated JSON Schema                                    | Runtime checks, TypeScript inference, OpenCode structured output                   |
| Game              | Phaser 3.90.0 + Vite, pending version decision                           | Mature H5 engine/API and stable documentation                                      |
| Tests             | Vitest + Playwright                                                      | Unit/integration plus real browser behavior                                        |
| Asset metadata    | JSON initially; SQLite when catalog workflows need queries               | Simple reviewable start, local deterministic growth                                |
| Retrieval         | License/metadata filter + keyword baseline; optional OpenCLIP embeddings | Establish correctness before model complexity                                      |
| Reports           | JSON evidence + generated Markdown summary                               | Machine-readable and human-reviewable                                              |

No large model, bulk asset corpus, or paid API is required for the next implementation spike. OpenCLIP would be evaluated only after the metadata baseline, with size and runtime disclosed before download.

## Initial module plan

1. `requirements`: prompt-to-spec request, local validation, normalization, spec repair.
2. `templates`: template manifest, supported features, compatibility/version checks.
3. `assets`: catalog validation, filtering, ranking, provenance.
4. `generation`: deterministic plan and composition.
5. `opencode`: SDK lifecycle, sessions, permission policy, event/run logging.
6. `verification`: schema/static/build/runtime/play/visual gates.
7. `repair`: finding selection, budgets, OpenCode patch session, revalidation.
8. `packaging`: static artifact, manifest, licenses, verification report.

Directories should be created only as their modules are implemented.

## ShooterGameSpec proposal

The first schema version is `1.0.0`. A generated spec is accepted only after structural and semantic validation.

Representative shape:

```json
{
  "schemaVersion": "1.0.0",
  "title": "Ink Crane",
  "theme": "Chinese ink fantasy",
  "story": "A white crane defends the sky river.",
  "visualStyle": ["ink-painting", "high-contrast"],
  "difficulty": "medium",
  "viewport": {
    "logicalWidth": 540,
    "logicalHeight": 960,
    "maxEnemyBullets": 260
  },
  "player": {
    "assetQueryId": "player-crane",
    "maxHealth": 5,
    "moveSpeed": 320
  },
  "weapons": [{ "id": "feather", "fireIntervalMs": 140, "damage": 1 }],
  "enemyWaves": [],
  "boss": { "assetQueryId": "boss-dragon", "phases": [] },
  "bulletPatterns": [],
  "pickups": [],
  "scoring": {},
  "winCondition": {},
  "loseCondition": {},
  "controls": {},
  "audioStyle": {},
  "assetQueries": []
}
```

Detailed numeric ranges should be established from a playable calibration prototype and encoded in both schema tests and gameplay budgets. They should not be invented solely from language-model output.

## Bullet-pattern proposal

MVP implements `radial`, `spiral`, and `fan`, then adds `aimed`, `wave`, `rain`, `rotatingRing`, and `burst`. Patterns are pure parameterized strategies with deterministic seeds, not executable scripts.

Each pattern has:

- a discriminated input schema;
- fixed numeric limits;
- a spawn-plan function independent of Phaser;
- a Phaser adapter using object pools;
- geometry/property tests;
- runtime caps and telemetry;
- calibrated presets for easy/medium/hard.

## Asset-system proposal

### Phase-one corpus

Start with roughly 20-40 license-cleared images covering player, enemy, boss, background, player projectile, enemy projectile, pickup, UI, and effects. Validate the entire provenance-to-retrieval-to-package flow before collecting 300-500 files.

### Acquisition policy

- Human-approved source allowlist and license allowlist.
- Preserve source page, direct URL, author, license snapshot/reference, attribution, collection date, and original hash.
- Quarantine newly downloaded assets until automated checks and human rights review pass.
- Respect site terms, robots directives, request rates, and opt-out headers.
- Treat unknown/custom/no-derivatives/no-redistribution terms conservatively.

### Retrieval policy

License and technical compatibility are hard constraints. Semantic similarity cannot override them. Selection should return an explanation so failures can be diagnosed and retrieval quality evaluated.

## Browser-test proposal

Prefer deterministic assertions before VLM review:

- load and render canvas;
- click/tap start;
- keyboard movement changes player position and stays in bounds;
- touch drag changes position on a mobile viewport;
- auto-fire and enemies spawn;
- forced deterministic collision changes score/health;
- wave progression and boss phases advance;
- win and loss overlays appear;
- restart resets state;
- console/page/request failures are absent;
- active object caps and a coarse frame-time budget are respected.

Screenshots at start, mid-wave, boss, win/loss, and mobile states support visual review. Later, a VLM judge may score style consistency, but it must not be the only correctness signal.

## Phased plan and acceptance gates

### Phase 0 - Proposal confirmation (complete)

Deliver: source requirements, open-source comparison, architecture, integration decision, module designs, risks, and handoff.

Gate: user confirms or changes the key decisions listed below.

### Phase 1 - Specification and OpenCode spike (complete)

Deliver: minimal TypeScript workspace, schema v1, prompt fixtures, local validator, OpenCode SDK compatibility spike, structured-output spec generation, run manifest skeleton.

Gate:

- schema tests cover required fields, numeric bounds, unknown fields, injection-like values, and cross-references;
- at least ten prompt fixtures yield valid specs or explicit bounded failures;
- SDK spike records OpenCode version, creates/aborts a session, receives structured JSON, and captures events;
- no generated game code yet required.

### Phase 2 - Stable playable template (substantially complete)

Deliver: Phaser template with lifecycle, player movement/auto-fire, waves, multi-phase boss, health/score/win/loss/restart, keyboard/touch, responsive scaling, three patterns, and test bridge.

Gate:

- typecheck/unit/build pass;
- Playwright passes core flows at desktop and mobile viewports;
- bullet caps and deterministic seeds are enforced;
- production package contains no test mutation bridge.

### Phase 3 - Deterministic composer and small asset corpus (baseline complete)

Deliver: template manifest, composer, asset catalog schema/validator, 20-40 reviewed images, filtered/ranked retrieval, provenance output.

Gate:

- at least five representative specs compose without code-agent edits;
- every packaged asset resolves to an approved provenance record;
- retrieval evaluation demonstrates category/theme/style relevance against labeled cases;
- generated projects build and pass core browser tests.

### Phase 4 - Code agent and bounded repair (baseline complete)

Deliver: OpenCode adapter, scoped edit policy, findings schema, repair ledger, maximum-three-round controller.

Gate:

- seeded broken cases produce actual failing evidence;
- at least one case is repaired with a minimal patch and full revalidation;
- repeated/unsafe/unrepairable cases stop with an accurate report;
- edits cannot escape the generated workspace or broaden permissions silently.

### Phase 5 - Corpus expansion and retrieval quality (partial and paused)

Deliver: 300-500 reviewed images, acquisition logs, optional local embeddings after baseline evaluation, style-coherence reranking.

Gate:

- required categories meet agreed coverage targets;
- 100% of admitted assets have source/license/hash/review metadata;
- duplicate, corrupt, incompatible, and prohibited assets are rejected;
- retrieval metrics and human review meet user-confirmed thresholds.

### Phase 6 - Final acceptance package (active preparation)

Deliver: 3-5 generated games, run manifests, verification reports, screenshots, source, approximately ten-page technical report, and PPT.

Gate:

- generation finishes within the user-confirmed time budget;
- all required games meet lifecycle/gameplay/browser/visual criteria;
- failures and manual interventions are disclosed;
- report discloses code-generation tools and actual API/server costs.

## Risks and mitigations

- **Rapid OpenCode API changes:** pin the version, add adapter contract tests, and record health/version per run.
- **Phaser 3/4 split:** pin one template version; never let generated specs choose engine versions.
- **Asset copyright:** source allowlist, quarantine, human review, immutable provenance, package-time license gate.
- **Behavioral flakiness:** deterministic seeds, test bridge, fixed timestep where possible, trace/video retention, limited retries.
- **Model non-determinism:** structured output, local validation, small retry counts, prompt/spec fixtures, model/version logs.
- **Repair makes regressions:** minimal patch budgets and mandatory regression gates.
- **Context loss:** disk-backed manifests and maintained handoff/status/ADRs.
- **Scope growth:** one game family and one template until acceptance evidence is strong.

## Decisions required from the user

Decision status after confirmation:

1. **Accepted - Phaser version:** pin 3.90.0 for MVP; revisit Phaser 4 through a separate spike.
2. **Accepted - OpenCode approach:** SDK-based standalone orchestration plus project-local extensions; no fork.
3. **Pending - allowed model provider:** select OpenAI, Doubao, or DeepSeek and define a per-run/per-week budget before live model use.
4. **Pending - asset policy:** choose the allowed license set and whether generated/original assets count toward the required 300-500 crawled images.
5. **Pending - final time limit:** define the prescribed time for generating 3-5 games.
6. **Accepted for MVP - browser matrix:** Chromium desktop + mobile emulation, with WebKit or another real-device check before final acceptance.
7. **Accepted for initial development - environment:** local Windows-first development; CI/clean-worker details will be selected before browser automation is finalized.

No paid API, large dependency/model download, or bulk asset crawl should start until the relevant decision is confirmed.
