# Progress Log

## 2026-07-15 - Project startup and technical proposal

- Confirmed the working directory and empty Git repository.
- Read and visually verified the complete source PDF; extracted task 2 requirements.
- Identified project-added stronger constraints and no direct PDF conflict.
- Surveyed OpenCode v1.18.1, OpenGame, PlayCoder, clip-retrieval, img2dataset, and Phaser from official sources.
- Proposed a deterministic TypeScript orchestrator using the official OpenCode SDK, with project-local Skills/tools/plugins and no core fork.
- Defined initial architecture, specification security boundaries, bullet-pattern strategy, asset governance/retrieval, browser verification, bounded repair, staged milestones, and acceptance gates.
- Paused before implementation pending user confirmation.

## 2026-07-15 - Phase 1 specification and OpenCode compatibility foundation

- User confirmed the core technical proposal.
- Accepted the SDK-based OpenCode integration ADR and the Phaser 3.90.0 MVP version ADR.
- Initialized a pinned TypeScript/pnpm workspace and a unified `pnpm check` gate.
- Implemented strict `ShooterGameSpec` v1.0.0 validation, JSON Schema export, cross-reference checks, and injection-resistant unknown-field rejection.
- Added ten requirement prompt fixtures and a tool-free OpenCode structured-output analyzer boundary with local revalidation.
- Implemented a versioned run manifest, legal state transitions, relative artifact paths, and repair-budget enforcement.
- Installed and isolated OpenCode 1.18.1; verified server health/version, session creation/abort, and SSE event capture.
- Passed formatting, strict TypeScript validation, and 20 tests in four files.
- Deferred the paid/live structured-output call until provider/model and cost approval are supplied.

## 2026-07-15 - DeepSeek live compatibility evaluation

- Read the DeepSeek credential from ignored local `api key.txt` without displaying or copying it; added both `api key.txt` and `apikey.txt` to `.gitignore`.
- Confirmed OpenCode model IDs and ran bounded paid tests after stating the expected cost.
- Verified OpenCode 1.18.1, DeepSeek authentication, and a minimal JSON response with `deepseek/deepseek-v4-flash`.
- Found that DeepSeek returns minimal JSON as assistant text rather than OpenCode's native structured field; added strict JSON-text fallback.
- Added deterministic support for one exact JSON code fence while continuing to reject surrounding prose.
- Ran a representative full-spec test. `deepseek/deepseek-chat` returned valid fenced JSON but invented its own schema; offline replay confirmed local `ShooterGameSpec` validation correctly rejects it.
- Increased analyzer coverage to 22 passing tests across four files.
- Stopped further paid calls and left Phase 1 open pending a schema-adherence strategy.

## 2026-07-15 - Phase 1 closure and Phase 2 template start

- Added a dedicated model-visible requirement contract while retaining OpenCode JSON Schema output and unchanged local Zod validation.
- Ran one bounded OpenCode/DeepSeek retry after stating its expected cost. The exact top-level schema was produced, but two `fan.arcDegrees` values were below the minimum; local validation correctly rejected it.
- Recovered safe failure evidence with exact validation paths and token/cost metadata without persisting model prose or credentials.
- Accepted ADR 0003 and implemented a narrow direct DeepSeek adapter using the fixed official endpoint, provider-native JSON Object output, one request with no automatic retry, a fixed timeout, and mandatory local validation.
- Ran one separately stated bounded direct-adapter evaluation. `deepseek-v4-flash` produced a valid `ShooterGameSpec`; 2,960 input and 2,114 output tokens were recorded, with estimated cost about CNY 0.0072 at the stated current rate.
- Closed the final Phase 1 schema-adherence acceptance item.
- Pinned Phaser 3.90.0 and Vite 8.1.4, recorded their source/license information, and started the deterministic vertical-shooter template.
- Implemented and visually exercised start, play, timed win, end, and restart scenes; keyboard/touch movement, auto-fire, ordinary enemies, collision, health, and score are present.
- Passed `pnpm check`: formatting, two strict TypeScript projects, 26 tests in five files, and the production template build.

## 2026-07-15 - Deterministic bullet runtime and boss milestone

- Implemented a pure one-emission planner for radial, spiral, and fan patterns with deterministic angles, velocity vectors, emission timestamps, missing-parameter rejection, and global active-bullet budget enforcement.
- Added a pure three-phase selector with strict descending-threshold validation.
- Added 13 gameplay tests covering geometry, rotation, timestamps, budgets, threshold boundaries, and the read-only bridge.
- Wired patterns into a capped reusable Phaser enemy-bullet pool and added a health-driven three-phase boss with per-phase speed and pattern changes.
- Replaced the scaffolding timed win with boss defeat; the timer now provides a bounded failure ceiling.
- Added a 500ms player invulnerability window to prevent multiple same-frame hits from dense emissions.
- Added a frozen snapshot-only DEV bridge with no mutation methods and verified the bridge symbol is absent from the production bundle.
- Browser spot-check rendered the boss and radial ring. A browser-control URL policy blocked the later hot-reload revisit, and no alternate browser workaround was used.
- Passed `pnpm check`: formatting, both strict TypeScript projects, 8 test files/39 tests, and production build.

## 2026-07-15 - Git and context continuity policy

- Added a mandatory disclosure rule for actual automatic context compaction or summary handoff, followed by the full repository recovery protocol.
- Defined the unborn-repository baseline procedure and prohibited implicit initial commits.
- Defined stable `master`, short-lived `codex/` branches, Conventional Commit-style subjects, explicit staging, cached-diff review, verification gates, secret checks, and generated-artifact exclusions.
- Required explicit user authorization for branch, commit, tag, push, merge, rebase, and pull-request state changes; a local commit never implies push authorization.
- Added durable Git metadata requirements to every substantive handoff.

## 2026-07-15 - Agent-to-runtime Composer and resource budgets

- Added balanced, desktop, and mobile resource profiles with centralized caps for enemy bullets, player bullets, enemies, pickups, effects, and enemy-bullet spawn rate.
- Derived player projectile capacity from viewport height, projectile speed, fire interval, projectile count, and a deterministic safety margin; removed the fixed pool size of 80.
- Added structured adjustment evidence whenever a requested Spec budget exceeds the chosen device profile.
- Implemented a fail-closed full-Spec Composer that revalidates input, rejects unsupported runtime patterns and win conditions, derives the boss schedule, and preserves supported configuration data.
- Moved composition before the browser build. The H5 bundle consumes a generated 5 KB JSON file and does not include Zod, provider adapters, OpenCode, or the Composer.
- Added ADR 0004 and deterministic template composition, resource budget, unsupported-feature, schedule, artifact-sync, and recorded-DeepSeek integration tests.
- Verified the previously recorded passing DeepSeek Spec composes offline with no additional API call.
- Passed the unified gate with 12 test files/47 tests; production boundary and numeric pool-capacity scans passed.

## 2026-07-15 - Isolated runs and automated Chromium gates

- Upgraded the run manifest to v1.1.0 with hashed Spec, plan, workspace, runtime-config, build-log, package, and verification evidence plus structured budget adjustments and fixed-build metadata.
- Implemented an overwrite-protected `spec_validated → planned → composed → built` stage that materializes only an explicit template source allowlist and invokes Vite without a shell or Spec-controlled arguments.
- Preserved safe failed-run evidence and proved the recorded passing DeepSeek Spec reaches a real isolated production build offline, with no credential access or paid API call.
- Added Playwright Test 1.61.1 and its Apache-2.0 provenance. A repository-local managed Chromium download failed from repeated CDN TLS resets; the gate uses installed Microsoft Edge as the Chromium channel.
- Extended the frozen read-only bridge across start/play/end lifecycle snapshots and added player/Boss position diagnostics only to instrumented builds; the production package remains free of the bridge marker.
- Added hash-gated automated desktop 1280×720 and mobile 390×844 touch gates with local serving, lifecycle/input/spawn/Boss/win/restart assertions, error capture, and screenshots.
- The browser gate found player projectiles crossing the Boss without damage under headless frame timing. Added a swept `Body.prev → Body.current` AABB fallback so fast projectiles cannot tunnel through the Boss.
- Final browser acceptance run `412a1ce5-51f1-4646-9dce-b5ee5a1d4d38` reached `play_checked`; both cases passed with zero console, page, or request failures.
- Final unified checks passed with 13 test files and 52 tests; the production build and a post-format desktop/mobile browser rerun also passed.

## 2026-07-15 - Generic deterministic enemy-wave executor

- Added a pure wave scheduler with stable chronological ordering, inclusive-start/exclusive-end windows, bounded spawn counts, overlap preservation, and invalid-input rejection.
- Replaced the Phaser scene's `enemyWaves[0]` binding with execution of every scheduled wave, including independent `maxAlive` limits and source-aware health, movement speed, and score values.
- Added deterministic cleanup of all wave timers at Boss and end transitions and included the scheduler in the isolated-run source allowlist.
- Extended the read-only test bridge with deeply frozen per-wave configuration and spawn evidence.
- Added a browser fixture containing two materially different waves and required both desktop and mobile Chromium gates to prove successful execution of both.
- Browser run `093f14e8-0495-4c63-9748-90bc030af562` reached `play_checked` with zero console, page, or request failures; verification SHA-256 is `3dc33d5810736aecf9a94dc7a6875001385bacba5b9637cbc054821dd28ab19a`.
- Final `pnpm check` passed with 14 test files and 56 tests; production build remained free of the test bridge marker.

## 2026-07-15 - Generic deterministic multi-weapon executor

- Added a pure deterministic firing planner that preserves Spec order, schedules each weapon independently, generates symmetric multi-projectile salvos, and clips each emission to the remaining global player-projectile budget.
- Replaced the runtime's first-weapon-only timer and damage lookups with per-weapon timers and pooled projectiles that retain source weapon, speed, and damage metadata.
- Extended the frozen read-only bridge with configured and observed per-weapon firing, drop, speed, hit, and damage evidence plus the effective global player-bullet cap.
- Extended the local browser fixture with two materially different weapons. Desktop and mobile Edge gates proved both firing plans and the resource cap; desktop also proved damage from both weapons.
- Preserved failed run `21b100f5-ae81-4d97-befe-ef513d23f37a`, which exposed a missing isolated-workspace allowlist entry, then passed run `a9cda564-97b7-419b-a7e1-149c339549d4` after adding only the required planner source.
- Final `pnpm check` passed with 15 test files and 60 tests; production build remained free of the test bridge marker.

## 2026-07-15 - Generic deterministic pickup executor

- Added a pure pickup planner with stable Spec-order timing, fixed fall speed, active-pool budget checks, all four pickup state transforms, and shield-first player damage resolution.
- Added a `ResourceBudget.maxPickups`-capped reusable Phaser pool, effect-specific colors, player-lane spawns, natural overlap collection, offscreen recycling, and timer cleanup.
- Applied healing with max-health clamping, persistent weapon-power damage, numeric shield absorption, and direct score bonuses without adding executable fields to `ShooterGameSpec`.
- Extended the deeply frozen read-only bridge with per-pickup spawn, drop, collection, effect, and global-budget evidence.
- Final post-format browser run `8cd03348-56a9-4149-8d9d-380a9f96c940` reached `play_checked`; desktop and mobile collected all four effects with zero console, page, or request failures. Verification SHA-256 is `d1a1f7fc9ef05946d93af656058000609acd20322b49055f094ae7cf48a99516`.
- Final `pnpm check` passed with 16 test files and 65 tests; the production boundary scan remained clean.

## 2026-07-15 - Finding-bound bounded runtime repair

- Added ADR 0006 and a strict fingerprinted verification-finding schema bound to hashed browser reports.
- Kept browser failure terminal by default while adding an explicit repairable mode that preserves a valid repair-entry state and immutable failure evidence.
- Added a bounded controller that accepts only exact-match replacements in fixed allowlisted workspace sources and enforces file, operation, changed-line, patch-byte, source-hash, repeated-fingerprint, and maximum-round limits.
- Preserved original packages, failed verification, selected findings, and pre-repair files; rebuilt outputs and ledgers live under `repairs/round-N/`.
- Added deterministic stop tests for budget exhaustion and repeated identical findings, plus controller tests with an injected build boundary.
- Final no-model evaluation run `c04c55ff-d618-43b9-90b2-5ba1149ca7d8` produced a real `player-control-failed` desktop finding, repaired one expression in one round, and passed full desktop/mobile regressions with zero browser failures. Final verification SHA-256 is `4aee10974bbb6f334d14adcbe842d3b88cb585d775e4f3cad4014902050af377`.
- Normal browser run `a2559e27-39ae-4945-94cc-e8fbb5542c64` then confirmed the default terminal-on-failure verification path still passes unchanged healthy input; verification SHA-256 is `f9fcbeaaffc82d09cd2fe26c83634043b625a8732989ea9d995b1ba64e0f2e69`.
- Final `pnpm check` passed with 18 test files and 71 tests; the production boundary remained clean.

## 2026-07-15 - Deterministic asset catalog and retrieval baseline

- Added catalog schema v1.0.0 with strict provenance, author, license,
  attribution, permissions, category, descriptive metadata, source/derived file
  separation, technical bounds, lowercase SHA-256 hashes, and review evidence.
- Added duplicate ID, source-hash, and path rejection so aliases or derived
  variants cannot inflate corpus counts.
- Implemented the proposed `CC0-1.0`/`CC-BY-4.0` allowlist, explicit restrictive
  license/permission rejection, and fail-closed manual-review decisions.
- Added an origin-separated source-image count summary that excludes all derived
  files from the proposed 300-500 count.
- Added deterministic hard filters and weighted theme/style/tag/palette ranking
  with stable `assetId` tie-breaking and explicit exclusion evidence.
- Added three labeled retrieval fixtures using synthetic metadata only; no image
  corpus or model call was used.
- Added `docs/ASSET_POLICY_PROPOSAL.md` and proposed ADR 0007. Acquisition remains
  blocked until the user confirms the allowlist and counting interpretation.
- Final `pnpm check` passed with 22 test files and 89 tests; the unchanged Phaser
  production build passed, and browser gates were omitted because asset modules
  are not yet integrated into the browser package.

## 2026-07-15 - First bounded asset acquisition

- The user accepted ADR 0007: automatic eligibility remains limited to
  `CC0-1.0`/`CC-BY-4.0`, unique source SHA-256 values count once, derived files
  do not add to the count, and project-owned/generated images remain separate
  supplemental totals.
- Reverified official source pages, Creative Commons terms, Kenney support and
  terms, the OpenGameArt submission/FAQ, and site crawl behavior before any
  download.
- Restated a 35-image category plan inside the approved 20-40 image, 150 MB,
  and 3-6 hour envelope; no model call or paid service was used.
- Downloaded three official Kenney CC0 archives and five serialized
  OpenGameArt CC-BY 4.0 PNGs. The downloads were approximately 16.9 MB and the
  archives expanded to approximately 17.6 MB.
- Selected 35 source images across player, enemy, boss, background, both
  projectile categories, pickup, UI, and effect. The permanent corpus plus
  metadata and evidence remains below 1 MB.
- Preserved source/archive hashes, original entry names, exact URLs, author,
  license, attribution, included Kenney license files, and a non-counted review
  contact sheet.
- Added deterministic corpus verification for SHA-256, byte size, PNG
  dimensions, actual transparency, safe paths, and the 150 MB total-disk cap.
- Added three real-corpus tests; the project owner then approved all 35 contact-
  sheet candidates without exclusions.
- Promoted only review status/evidence, leaving all source hashes unchanged.
  Real counting now reports 35 eligible third-party source images and zero
  manual-review records.
- Added a real-corpus retrieval regression: the coherent blue Kenney player ship
  ranks first for a blue clean/vector science-fiction query while the separate
  pixel style remains available for matching queries.
- Final strict checks pass with 23 test files and 93 tests.

## 2026-07-15 - Deterministic asset selection and package materialization

- Added ADR 0008 and a strict `asset-selection.json` schema in stable Spec query
  order, bound to the complete catalog hash, source hashes/metadata,
  provenance/license/attribution, ranking breakdown, and fixed output paths.
- Required positive theme and visual-style matches after license/category/
  technical filters; category-only, palette-only, and zero-score fallbacks stop
  before creating a run directory.
- Extended isolated composition with an explicit asset-enabled mode that verifies
  all corpus bytes before planning and copies only unique selected files into
  the fixed Vite public asset directory.
- Added run manifest v1.2.0 asset-selection evidence while retaining parser
  compatibility with v1.1.0 manifests.
- Added deterministic-order, incompatible-style, fixed-path, tampered-source,
  immutable-copy, and selection-artifact tests.
- Real no-model run `226096b4-e5b5-4be7-94e7-bc32e519b192` reached `built` with
  seven selections and seven packaged files. Every packaged file hash matched
  its catalog source; selection SHA-256 is
  `5f9c3a8f2e85d412dc300feca6ef89b608d2ffaa4de3c16b7caf0d551e9783f0`
  and package SHA-256 is
  `d6c12d74b482333c5c34d7295445d2aa0d591d0c1257d2b6df6d489504a6deb5`.
- Final unified checks pass with 24 test files and 100 tests. Phaser is unchanged
  and does not yet preload or render the selected assets.

## 2026-07-15 - Runtime asset resolution and Phaser rendering

- Added ADR 0009 and a discriminated `RuntimeGameConfig.resolvedAssets` map.
  Catalog mode binds every stable Spec query to a deterministic texture key,
  fixed URL, source SHA-256, and dimensions; legacy geometry is now explicit.
- Added a dependency-free strict template validator for exact fields, safe IDs
  and URLs, complete ordered query coverage, categories, role bindings, hashes,
  dimensions, and duplicate-definition consistency.
- Phaser now preloads unique selected textures and renders the selected player,
  ordinary enemy, Boss, player/enemy projectile, pickup, and background images.
- Added deeply frozen loaded/used texture evidence to the DEV bridge and required
  both desktop and mobile browser gates to prove all seven selected textures were
  loaded and used with zero request failures.
- Added post-Vite per-file package SHA-256 verification and a tampered-package
  regression that preserves a failed run instead of recording a false build.
- Visual review found Boss HUD overlap on mobile; moving Boss state to a separate
  second row resolved it and the complete browser regression passed again.
- Final run `2e82d80e-1286-4a9f-8eab-62c72cd4b9bf` reached `play_checked` with
  selection SHA-256
  `4271263ebe9da372d2305d73bbdb67765ddca60162afe8c728f4bf8bf1971233`,
  package SHA-256
  `1b3dbcc3ae1ad37a9ead596bd6d9c1c834346e13a3fe5e3a8bfee5d9d11c2311`,
  and verification SHA-256
  `7fc23e9c258602c7205730d867e36c14a1f45468328548a9da81611eaab67659`.
  All seven packaged asset hashes matched their selected source hashes.
- Final `pnpm check` passed with 25 test files and 104 tests; the production Vite
  build passed with the expected Phaser chunk-size warning.

## 2026-07-15 - Batch 002 bounded acquisition proposal

- Recomputed the approved Batch 001 distribution from the actual catalog: 35
  space-themed records, with background (1), pickup (3), UI (4), and effect (4)
  as the clearest coverage gaps.
- Checked the official Kenney Pixel Shmup and Pixel UI Pack pages, Kenney's CC0
  support statement, the Creative Commons CC0 deed, and three OpenGameArt
  background pages. No asset file or model was downloaded.
- Added `docs/ASSET_BATCH_002_PROPOSAL.md` for a coherent pixel/retro expansion:
  target 60 unique PNG sources, acceptable range 54-60, explicit per-category
  targets/minima, five official source pages, and item-level review before
  eligibility.
- Bounded the proposed acquisition at 10-40 MB expected/75 MB hard-stop download,
  150 MB expanded workspace, less than 5 MB expected/15 MB hard-stop additional
  permanent corpus, and 6-10 hours. Existing 150 MB complete-corpus verification
  remains unchanged.
- Added stop rules for missing semantic roles, near-duplicate variants, unsafe
  background presentation, changed rights, unexpected redirects, duplicate
  hashes, and absent provenance. Approval is still required before download.

## 2026-07-15 - Batch 002 bounded acquisition and quarantine

- Received project-owner approval for the fixed no-model envelope and completed
  exactly 14 GETs: five source pages, one robots file, three archives, and five
  direct PNGs. OpenGameArt starts remained at least ten seconds apart.
- Downloaded 8,296,597 asset bytes and expanded 8,156,881 archive bytes, below
  the 75 MB and 150 MB hard stops. ZIP entries were checked for absolute paths,
  drive paths, traversal components, and destination escape before extraction.
- Preserved source-page, archive, license, author, original-entry, byte-size,
  SHA-256, dimension, and transparency evidence.
- Rejected the four Mars layers and Cayden composition as standalone
  backgrounds because they contain transparent canvas regions. Six opaque
  Seamless Space Backgrounds replacements passed a 540×960 visual preview.
- Added 56 unique source candidates totaling 1,488,228 bytes: player 6, enemy
  12, Boss 4, background 6, both projectile classes 6 each, pickup 4, UI 6, and
  effect 6. All records are `quarantined`, leaving 35 eligible and 56 manual
  review.
- Generated a numbered contact sheet and background presentation evidence.
  Project-owner item approval remains required before promotion or a new
  catalog-enabled browser/package-hash regression.

## 2026-07-15 - Batch 002 rejection and theme-kit corpus plan

- The project owner rejected the complete Batch 002 contact sheet because it
  was visually dominated by small, similar spacecraft. All 56 files, hashes,
  licenses, manifest records, and review evidence remain preserved; no file was
  deleted or made eligible.
- Changed all 56 catalog review states from `quarantined` to `rejected`, leaving
  exactly 35 eligible third-party images.
- Accepted ADR 0010 and added `docs/ASSET_CORPUS_PLAN.md`: five complete
  70-image visual-theme kits plus five existing supplemental records, targeting
  355 eligible third-party images.
- Fixed every kit at player 6, enemy 14, Boss 4, background 8, both projectile
  classes 6 each, pickup 6, UI 10, and effect 10.
- Added source-concentration, visual-bounds, Boss-prominence, variant-family,
  opacity, semantic-role, readable-contact-sheet, and runtime-scale review
  gates. Batch 003 will replace Batch 002 with a complete multi-source
  pixel/retro science-fiction kit.
- Performed read-only current-source research and recorded promising CC0 entity,
  background, UI, and projectile pages plus explicit sheet-only and license
  exclusions in `docs/ASSET_BATCH_003_SOURCE_RESEARCH.md`. No Batch 003 asset was
  downloaded. Standalone Boss, pickup, projectile, effect, and UI coverage must
  be completed before a bounded acquisition proposal is honest.

## 2026-07-15 - Nine-category runtime assets and Batch 003 deferral

- The project owner deferred Batch 003 crawling/acquisition to source candidate
  materials independently. No Batch 003 file was downloaded and the existing
  provenance, rights, hash, category, visual, and approval gates remain intact.
- Accepted ADR 0011 and added optional, category-checked `uiQueryId` and
  `effectQueryId` fields while preserving older seven-role catalog maps.
- Bound reviewed UI to the HUD panel and reviewed effect art to bounded pickup
  feedback without adding a catalog-mode geometric fallback.
- Extended the deterministic browser fixture from seven to nine selected
  textures and strengthened desktop/mobile evidence to require every selection
  to be loaded and used.
- Browser run `6cd534b8-33f2-43e6-bdbc-cdc236c29fee` reached `play_checked`;
  desktop/mobile had zero console, page, or request failures. Verification
  SHA-256 is
  `00dcdbcfb6f39c6b1177429206133e3c175be6e9e7237389b672bc2151e29f97`.

## 2026-07-15 - Deterministic final H5 packaging

- Accepted ADR 0012 and added a packaging stage that accepts only
  `play_checked` runs after recomputing all required artifact hashes.
- Required semantic passing desktop and mobile Chromium evidence, no findings,
  and zero console, page, or request errors.
- Rechecked selected package assets directly against source hashes and rejected
  symlinks, non-regular files, development instrumentation, and model/credential
  markers.
- Added temporary-directory promotion and atomic final manifest replacement;
  run manifest v1.3.0 now records immutable delivery and package-manifest hashes
  while continuing to parse v1.1.0 and v1.2.0.
- Delivered the static game with `RUN.md`, project dependency notices, nine
  selected-asset attribution/license records, and a deterministic per-file
  inventory.
- No-model run `6cd534b8-33f2-43e6-bdbc-cdc236c29fee` reached `packaged`.
  Delivery SHA-256 is
  `1bf1606707b930c48a1af047e3d016333ff14a1947a82ff53f2b9f8ca7992733`;
  `PACKAGE_MANIFEST.json` SHA-256 is
  `800b161258aeb7a02b1394d65e027abd93ee348685f345d901dea070492fd1ea`.

## 2026-07-15 - Deterministic combo and graze scoring

- Accepted ADR 0013 and implemented pure immutable scoring transitions for
  defeat combos, inclusive window expiry, fractional caps with floored awards,
  flat pickup points, and one-shot graze points.
- Bound the player collision circle to Spec `hitboxRadius` and enemy-projectile
  circles to rendered short-side size; graze detection uses a fixed 18-pixel
  annulus outside the combined hit radius.
- Added frozen play/end evidence for current/historical combo, defeat, graze,
  closest-bullet distance, and hit radius.
- Removed `Phaser.Math.Between` from ordinary-enemy placement. Every wave starts
  on a deterministic center lane and later spawns rotate stable side lanes.
- Several fail-closed browser runs preserved the real diagnosis path: the first
  fixture allowed Boss defeat before a near miss, then randomized enemy lanes
  sometimes produced no combo. Timing/geometry diagnostics and the stable lane
  planner corrected the causes without weakening the gate.
- Run `3187e6be-4702-40ba-a069-80694e470e8b` passed desktop and mobile
  combo/graze checks with zero console/page/request failures. Manual screenshots
  passed. Verification SHA-256 is
  `39fa8188b8c7d1f5c6dadefb0620c87fe1f603cae3a903657e79200559e781ef`.
- The run was promoted to `packaged`; delivery SHA-256 is
  `4a3a358bc29bb848148027b852c2f26512f92c9255534a3dc2e75ecb06d3a8fc`
  and delivery-manifest SHA-256 is
  `fea6fd8063d5a74192b8df2bf40163788b78e085420bda926988d139c5b45611`.

## 2026-07-15 - Batch 003 source acquisition and inventory

- Resumed Batch 003 crawling after the project owner could not find suitable
  materials independently; no model call or paid service was used.
- Retained 55 response files totaling 16,752,917 bytes across the partial,
  gap, and final-background-probe acquisitions.
- Verified every completed manifest file by SHA-256 and byte size, rejected
  unsafe archive behavior before extraction, and kept combined expansion at
  12,564,739 bytes below the 150 MB hard stop.
- Inventoried 1,002 valid PNG records and 1,001 unique hashes. One identical
  Mega Bot state pair is the only duplicate group; no hash overlaps the
  permanent corpus.
- Added complete Mega Mecha, STG, RUOK, separated bullet, effect, UI, pickup,
  and large-background candidate pools. Seven backgrounds remain strict
  independent selections after family caps; a 2000x2000 image with one
  transparent pixel is provisional only.
- The project owner made a one- or two-image quota shortfall non-blocking to
  favor fast continuation. Network acquisition is stopped; shortlist/contact-
  sheet review is next and promotion still requires explicit approval.

## 2026-07-15 - Generic deterministic win/loss execution

- Accepted ADR 0014 and added one pure evaluator for `bossDefeated`,
  `surviveMs`, `scoreReached`, `healthDepleted`, and `timeExpired`.
- Removed callback-specific Boss/health/timer endings. The Phaser scene now
  submits complete state once per frame and records the chosen reason plus
  elapsed time in frozen end evidence.
- Defined inclusive thresholds and win precedence when both configured
  conditions mature on the same frame; added Composer rejection for two
  statically unreachable condition combinations.
- `pnpm check` passed with 28 test files and 129 tests. Production output is
  1,237.23 kB JavaScript (330.51 kB gzip) with the existing chunk warning.
- Browser run `3d9bdcb0-fe7a-4bdc-b186-afb572ed100b` reached `play_checked`.
  Desktop and mobile both proved the configured Boss-defeat outcome through
  public input/runtime paths with zero console, page, or request failures;
  verification SHA-256 is
  `39643bf231ec60a9e0fbcf2a43ab44ae9bcabe0a263dedc1fe50fea71a6b78f8`.
- Clarified Batch 003 review tolerance: small count deviations and negligible
  pixel defects are recorded rather than blocking. The 2000x2000 background
  with one transparent pixel is now the eighth usable independent candidate.
- Reduced the 1,001 unique quarantine hashes to a fast 70-candidate shortlist
  with the planned category distribution, unique hashes, measured technical
  metadata, and a grouped numbered contact sheet. No file was promoted; mixed
  style and original sprite-sheet risks are explicitly deferred to project-
  owner review.

## 2026-07-16 - Complete schema bullet-pattern planning

- Shifted priority away from asset polishing at the project owner's direction.
- Added deterministic planning for `aimed`, `wave`, `rain`, `rotatingRing`, and
  `burst`, removing the Composer rejection for all five schema-valid variants.
- Bound aimed Boss emissions to the live player angle while preserving the
  shared active-bullet cap and deterministic fallback parameters.
- `pnpm check` passed with 28 test files and 137 tests. Production JavaScript is
  1,237.75 kB (330.63 kB gzip) with the existing chunk warning.

## 2026-07-16 - Five-pattern browser execution evidence

- Added a focused five-phase Boss fixture for `aimed`, `wave`, `rain`,
  `rotatingRing`, and `burst` with a 20-bullet global cap.
- Extended the frozen DEV-only bridge with per-pattern emission, successful
  spawn, budget clipping, actual movement distance, and aimed-direction
  evidence plus global active/peak cap values.
- Browser verification report v1.2.0 now persists bounded numeric evidence for
  each viewport instead of only recording a named pass check.
- Run `c6c057d8-6dd7-4c9a-85a6-9cec106eed15` reached `play_checked`. Desktop
  and mobile generated and moved all five variants, reached but never exceeded
  20 active enemy bullets, clipped 211/241 requested bullets, and reported zero
  console, page, or request failures. Verification SHA-256 is
  `fe46255bdc0ae90a2ab5194e030028a528149c05d2e75825b010d9f6ca59f590`.
- Manual screenshot review found responsive, unclipped desktop/mobile layouts;
  the mobile capture visibly shows the final `browser-burst` phase and moving
  enemy projectiles.
- `pnpm check` passed with 29 test files and 138 tests. Production JavaScript is
  1,239.53 kB (331.03 kB gzip) with the existing chunk warning.

## 2026-07-16 - Complete Boss-phase pattern arrays

- Added a pure scheduler for all configured Boss-phase `patternIds`, preserving
  stable entry order and deriving bounded emission counts from independent
  interval/duration values.
- Replaced the single first-pattern timer with independent Phaser timers that
  emit immediately, stop on duration/phase/end, and share the global pooled
  enemy-bullet budget.
- Added three scheduler tests covering stable multi-pattern ordering, explicit
  duplicate emitters, duration bounds, freezing, and missing-reference failure.
- Added the scheduler to the isolated template allowlist so generated runs do
  not fail after importing the new fixed source.
- Updated the browser fixture so its first Boss phase concurrently executes
  `aimed` and `wave`. Run `16eef17d-a925-4ba9-9b26-1e74c915fc8d` reached
  `play_checked`; desktop/mobile recorded 12/11 and 16/14 respective emissions,
  exact 20/20 cap peaks, 285/349 budget drops, and zero console, page, or request
  failures. Verification SHA-256 is
  `ec3a177fd1e0d601136388b56fb9f97791e00386125bf9e2ed32656172f3b773`.
- Final `pnpm check` passed with 30 test files and 141 tests. Production
  JavaScript is 1,240.12 kB (331.18 kB gzip) with the existing chunk warning.

## 2026-07-16 - Complete ordinary-wave pattern sources

- Accepted ADR 0015 and added a pure scheduler for ordinary-wave pattern IDs,
  preserving stable order, explicit duplicate emitters, independent
  interval/duration bounds, freezing, and fail-closed reference checks.
- Every successful ordinary enemy now executes all configured patterns from a
  visible top-edge spawn. Aimed patterns recompute the live player angle on
  every emission, and all sources share the one capped enemy-bullet pool.
- Tied emitter timers to enemy lifecycle: death, player collision, offscreen
  recycling, Boss entry, and scene end all cancel remaining events.
- Extended frozen DEV evidence and browser report v1.3.0 with nested
  wave-pattern emitter, attempt, requested/planned/spawned, budget, movement,
  and aimed-angle values.
- Tightened the browser gate after the first passing run sampled only one
  emitter. The final gate requires at least two successful enemies and exact
  equality between successful enemies and each configured pattern's emitter
  count.
- Final run `fea2601b-56dd-42b2-8874-41aaa8277859` reached `play_checked`.
  Desktop/mobile each recorded two emitters per pattern, four emissions per
  pattern, 13 aimed and seven wave bullets generated/moved, zero aimed error,
  44 shared-cap drops, exact 20/20 peak use, and zero console/page/request
  failures. Verification SHA-256 is
  `2e37f2382ccc72407600b829daec8b1675436997fe7dd6a11f8221aea0e64b76`.
- `pnpm check` passed with 31 test files and 144 tests. Production JavaScript is
  1,243.66 kB (332.08 kB gzip) with the existing chunk warning.

## 2026-07-16 - Reconcile roadmap and operational handoff

- Added `docs/ROADMAP.md` as the single overall-plan source, separating phase
  outcomes and gates from the status evidence ledger and resume instructions.
- Reconciled actual progress: Phases 0-1 are complete, Phase 2 is substantially
  complete, Phase 3-4 baselines are complete, Phase 5 is partial/paused, and
  Phase 6 preparation is now active.
- Replaced the field-by-field controls objective with a no-paid, reproducible
  3-5-game end-to-end evaluation rehearsal. Runtime, control, repair, and asset
  expansion now follow evidence from that batch or an explicit final gate.
- Rewrote the handoff as a concise operational resume point and aligned the
  architecture, technical proposal, current status, and README with the same
  roadmap.

## 2026-07-16 - Enforce planning and handoff governance

- Added durable document ownership rules to `AGENTS.md`: the roadmap owns
  active phase and gates, current status owns evidence, the handoff owns the
  concise resume point, and the progress log owns history.
- Required every new implementation objective to map to the active mainline or
  explicit roadmap gate. Local TODOs and schema fields cannot become mainline
  work without evaluation evidence, a source requirement, an accepted ADR, or
  a user decision.
- Added an atomic stage-change synchronization checklist and a stale-objective
  search requirement so roadmap, handoff, status, and stable overview documents
  cannot silently drift apart again.

## 2026-07-16 - First versioned Phase 6 multi-game rehearsal

- Accepted ADR 0016 and added strict v1.0.0 schemas for a 3-5-case local batch,
  per-case evidence, and aggregate evidence. Cases record intended gameplay
  differences plus schema/planning/composition/build/browser/packaging gates,
  elapsed time, disk, failure category, repairs, intervention, model requests,
  tokens, and CNY cost.
- Added a sequential no-paid runner and a three-case definition spanning
  medium Boss defeat, easy score target, and hard timed survival. Failed cases
  remain preserved and do not stop later cases.
- The first preflight found that a missing `artifacts/evaluations` parent caused
  `ENOENT`. Fixed recursive parent creation and added a focused regression; no
  case or browser had started during the failed preflight.
- Before the real batch, reported a 2-4 minute, 9-15 MiB, three sequential Edge
  launch / six maximum viewport budget. No model, network, or asset acquisition
  was authorized.
- Batch `8ebc36ec-d4b5-420a-99b9-4b44ec913199` completed in 103.375 seconds
  with 10,047,151 bytes of run evidence and zero model requests, tokens, cost,
  repairs, or manual intervention.
- `orbital-siege-balanced` run `aca11c85-8d01-4434-baa3-9e550198f268`
  passed desktop/mobile and reached `packaged`. The valid score and survival
  cases built but failed the fixture-bound desktop browser profile.
- Manual desktop/mobile screenshot review of the packaged case confirmed a
  readable HUD, visible selected textures/projectiles, and no clipping.
- Survival run `b71ff5c3-1943-4ac5-9e68-67e9ccef2bf6` froze a correct
  `surviveMs` win at 10,001 ms before the comprehensive gate timed out waiting
  for fixture-specific Boss-pattern evidence. This selected a strict case-aware
  browser assertion profile as the next objective; no Phaser field, control,
  repair, or asset expansion was promoted.
- Final `pnpm check` passed formatting, both strict TypeScript projects, 32 test
  files / 149 tests, and the Vite production build. JavaScript remains
  1,243.66 kB (332.08 kB gzip) with the expected large-chunk warning.

## 2026-07-16 - Complete case-aware multi-game browser rehearsal

- Accepted ADR 0017 and added strict versioned `case-aware-v1` browser
  assertions derived from each validated hashed Spec while retaining the
  unchanged `comprehensive-v1` deep regression.
- Kept lifecycle, desktop keyboard/mobile touch input, responsive canvas,
  console/page/request, configured weapons/waves/patterns/pickups/scoring,
  resource caps, catalog use, screenshots, and terminal outcome fail-closed.
  Failed waits now preserve bounded final snapshots.
- Preserved diagnostic batch `217815d6-0982-4c9b-bfcf-caa102adae74`, which
  proved all three desktop cases passed but exposed mobile firing-lane and
  restart-coordinate defects plus imprecise text-based classification.
- Preserved diagnostic batch `82f07d73-e458-4e20-8ba4-88f1c8816add`. Two cases
  passed and packaged; the Boss case's correct mobile victory showed that input
  restoration occurred between the first and later player-positioned pickups.
  The driver now waits for required pickup semantics through public input before
  returning to the Boss firing lane; no assertion was removed.
- Passing batch `03938bfd-306f-459f-b127-562c1e4e3f68` completed the same three
  materially different local Specs in 71.665 seconds with 12,868,590 bytes of
  evidence. All three cases, six browser viewports, and three static packages
  passed with zero model calls, tokens, CNY cost, repairs, or manual
  interventions.
- Packaged runs are `d09996d8-a04a-4f0c-b948-eb97c70b4ab5`
  (`bossDefeated`), `af37b9ae-ae78-415d-9fed-6fedaf662467`
  (`scoreReached`), and `e2ed4ca3-6141-4c65-8062-e92490dc0efe`
  (`surviveMs`). Manual review of all six screenshots found responsive,
  unclipped play with visible HUD, entities, projectiles, and selected assets.
- Comprehensive regression `12786fdc-2e0b-4dac-befa-37f8c0975f17` reached
  `play_checked`; verification SHA-256 is
  `583c0ee8118d4370a72752025e507c63000e89d6e117ea3d7b14d0aef164b5f5`.
- Final `pnpm check` passed formatting, both strict TypeScript projects, 33 test
  files / 152 tests, and the production Vite build. JavaScript remains
  1,243.66 kB (332.08 kB gzip) with the expected large-chunk warning. The first
  attempt stopped at ROADMAP formatting and was rerun in full after Prettier.
- The passing batch produced no next product failure. ROADMAP now stops at the
  user-owned final time, browser/device, and 300-500-image acceptance decisions
  instead of promoting nearby template, control, asset, or repair TODOs.

## 2026-07-16 - Select local effect review as the next gate

- The user chose not to set a generation-time hard limit yet; batch reports
  continue recording actual elapsed time.
- The user rejected treating one browser/device matrix as a universal hard-
  coded final requirement. The current named Edge/Chromium desktop/mobile
  profile remains reproducible baseline evidence; future extensions should be
  versioned and selectable.
- Corpus expansion remains paused. The 35 approved images stay eligible, while
  rejected and quarantined evidence stays preserved; the PDF's 300-500-image
  target is still unresolved rather than waived.
- The next gate is a local cross-case product-effect review of the three passing
  packages. No template, controls, assets, repair surface, or model work is
  authorized until that review identifies a material shortfall.

## 2026-07-16 - Review packaged game effects and select differentiation gap

- Served each passing `delivery/game` at a local web root and exercised its
  public start/play/end flow without rebuilding, calling a model, or acquiring
  assets. Game pages reported no console errors; package evidence remained
  unchanged.
- Confirmed the Boss case provides the strongest complete loop at about 13.5
  seconds and the survival case ends correctly at 10 seconds. The score case
  ends correctly but in only 2.261 seconds on desktop and 3.736 seconds on
  mobile, too quickly to establish its advertised score-rush rhythm.
- Compared the Specs and selection plans. All three use identical nine-entry
  `assetQueries` and select the same nine background/player/enemy/Boss/
  projectile/pickup/UI/effect assets despite different top-level themes.
- Confirmed the 35-image approved corpus has alternatives in eight categories;
  background has only one approved record. Corpus expansion remains paused, so
  the next iteration can differentiate sprites/UI/effects but must disclose the
  shared-background limitation.
- Added `docs/PHASE_6_EFFECT_REVIEW.md`. ROADMAP now selects local Spec query
  differentiation and score pacing as the first evidence-backed next objective,
  without authorizing Phaser expansion, model calls, or asset acquisition.

## 2026-07-16 - Define the first natural-language entry probe

- The user declined to promote visual similarity or score-case duration into
  implementation work and instead authorized one natural-language request as a
  controlled product-entry probe. ROADMAP was updated first so the older local-
  Spec polish objective no longer competes with the product outcome.
- Added versioned case `orange-meteor-rescue-probe` under
  `evals/cases/natural-language-probe-v1.json`. Its 227-character Chinese request
  specifies three enemy waves, a three-phase Boss, fan/spiral/rotating-ring
  patterns, shield and firepower pickups, desktop/touch controls, Boss-defeat
  victory, and a 30-second loss condition.
- A fresh explicit-UTF-8 local preflight passed the adapter's request-length
  boundary and found no code, command, URL, or credential-like instruction. An
  earlier ad-hoc PowerShell read failed only because legacy default encoding
  misread the UTF-8 JSON; no model call occurred.
- Official DeepSeek documentation confirms `deepseek-v4-flash`, JSON output,
  and current rates of CNY 1 per million cache-miss input tokens and CNY 2 per
  million output tokens. A prior passing extraction's 2,960 input / 2,114 output
  usage implies about CNY 0.0072; the new one-call plan remains unapproved and
  the current process has no `DEEPSEEK_API_KEY`.
- The exact next step is to present the one-call token/cost plan and wait. A live
  probe must use a distinct report path, preserve failure evidence, and pass the
  unchanged local Spec validator before deterministic generation may continue.
- Fresh `pnpm check` passed template composition, formatting, both TypeScript
  projects, 33 test files / 152 tests, and the Vite production build. No browser
  process or model call was started for this request-definition milestone.
- The user approved exactly one `deepseek-v4-flash` extraction call, zero
  automatic retries, an 8,192-output-token cap, and a CNY 0.10 ceiling.
- Added `pnpm eval:natural-language-probe`. It validates the versioned case,
  reads the credential only from the process environment, and writes each
  attempt to a new UUID-scoped evidence directory so old reports cannot be
  overwritten. Passed output includes only the locally validated Spec; failure
  output records a bounded safe error.
- Fresh typechecking and all 33 test files / 152 tests passed. The first runner
  invocation stopped before networking because `DEEPSEEK_API_KEY` was absent;
  model requests, tokens, and cost remain zero.

## 2026-07-16 - Execute the first live natural-language probe

- The user explicitly authorized one-time in-memory use of `api key.txt` for the
  approved call. The credential was never printed or written to evidence and was
  removed from the child-process environment afterward.
- Probe `fcbc9858-8d1c-43af-bcdb-b04e544f9be8` completed one
  `deepseek-v4-flash` request with no retry: 3,066 input tokens, 4,272 output
  tokens, and estimated CNY 0.01161 cost. Provider JSON and unchanged local
  `ShooterGameSpec 1.0.0` validation passed.
- Added a reproducible offline pipeline command bound to the probe hash. Before
  execution, reported a 25-50 second, 4-7 MiB, one Edge/two-viewport budget.
- Pipeline run `4c0c40ef-071a-47bd-81fd-afa39ec96276` stopped after 392 ms at
  asset planning with `AssetSelectionPlanningError` for `orange-rescue-ship`.
  It preserved 9,874 bytes of probe evidence and created no run workspace,
  browser case, package, repair, manual intervention, or additional model call.
- The raw Spec uses Chinese open vocabulary for theme/style while the reviewed
  catalog uses finite terms such as `space`, `science fiction`, and `pixel-art`.
  Eligible orange/pixel-space assets exist, so the first real gap is bounded
  vocabulary grounding rather than asset quantity or Phaser behavior.
- ROADMAP now selects a versioned, catalog-hash-bound grounding artifact as the
  next objective. Ranking remains strict, the extracted Spec remains immutable,
  and recorded touch/schedule fidelity risks do not displace the first executed
  failure.
- Final `pnpm check` passed template composition, formatting, both TypeScript
  projects, 33 test files / 152 tests, and the Vite production build. The first
  attempt stopped at ROADMAP formatting; after formatting, the definitive rerun
  completed with exit code 0.

## 2026-07-16 - Ground live asset queries and expose the next schedule gate

- Added ADR 0018 and `asset-query-grounding.json` v1.0.0. The artifact binds the
  canonical Spec and catalog SHA-256, maps only asset-query theme/style/tag
  vocabulary, records per-term rules and reasons, and rejects unknown or
  ambiguous terms with exact bounded evidence.
- Kept the original Spec unchanged for the Composer. Asset selection receives a
  derived vocabulary-only view and still requires positive theme and visual-
  style evidence. Selection now takes the first stably ranked candidate that
  passes both hard gates instead of failing merely because a higher-scoring
  zero-style candidate appears first.
- Added manifest, browser-resume, evaluation, and package hashing for the
  optional grounding artifact. Pipeline reports now use UUID run paths so the
  original failed report cannot be overwritten.
- Final offline replay `4ad5b4bb-4b44-4448-aad1-e27e148ef5d4` passed corpus
  verification, grounding, and 9/9 selections in 472 ms with 40,564 bytes of
  evidence. Grounding SHA-256 is
  `29cda55f2b55d006e61ca071e72b8b03f752322efdb0939109a0ad6a0c05501f`;
  selection SHA-256 is
  `f547fad63962bb8bd89cc1fd566379d2455a96cf81688d01b5c47f0e688dfddb`.
  Model calls, browser cases, and packages were zero.
- Reported a 25-50 second, 4-7 MiB budget for one Edge channel and desktop/mobile
  viewports, then resumed the full pipeline. Attempt
  `73a974d7-98c8-4848-9960-d6d94896608a` passed asset planning but failed after
  363 ms at the existing Composer reachability rule: waves end at the same
  30,000 ms instant as the time-expired loss, leaving no Boss encounter. No Edge
  process, run directory, package, repair, model call, or credential access
  occurred.
- The next step is a user decision. A valid continuation must either authorize a
  separately bounded derived-Spec repair, approve a newly budgeted extraction,
  or preserve this live request as terminal evidence. The original Spec and
  reachability gate remain unchanged.

## 2026-07-16 - Prepare a simplified second live request

- The user confirmed that the earlier 30-second deadline was unnecessary case
  detail, declined to make it a runtime task, and supplied a shorter request
  that retains only desktop/mobile, three enemy roles, medium difficulty,
  shield/firepower pickups, and Boss-defeat victory.
- Added immutable v2 case `three-wave-boss-probe` without changing v1. Its
  100-character prompt has no deadline, fixed Boss phases, theme, colors, exact
  controls, or wave timings. Case SHA-256 is
  `409f819ddf787b99fcfb4f0de8bffa184728593c93a47f6eef847fd7ad328900`;
  prompt SHA-256 is
  `0bfb2efcc2b4fb1bab7048488a459e758ab5b7354346580ce4757168a5335aba`.
- Added allowlisted case-path/hash binding to extraction, grounding-replay, and
  pipeline runners. Local UTF-8/safety preflight passed with zero unsafe
  patterns and zero model requests.
- Strengthened the generic model-visible contract: do not invent
  `timeExpired` when no deadline is requested, preserve a reachable Boss window
  when it is requested, and keep asset queries in finite English catalog
  vocabulary.
- Current official `deepseek-v4-flash` rates checked on 2026-07-16 are USD 0.14
  per million cache-miss input tokens and USD 0.28 per million output tokens.
  One 4,096-input / 8,192-output upper-budget call is about USD 0.00287 or CNY
  0.02151 at a conservative 7.5 CNY/USD planning rate. The runner ceiling is CNY
  0.05. No new call or credential access is authorized yet.

## 2026-07-16 - Execute v2 extraction and expose catalog-role coverage

- Consumed the separately approved single `deepseek-v4-flash` call for probe
  `66f33ad6-6d53-440d-9fca-4324cd768c27`, with zero retries. Usage was 3,102
  input and 2,430 output tokens; estimated cost was USD 0.00111468 / CNY
  0.0083601, below the CNY 0.05 ceiling. The Spec passed the then-current local
  validator and did not invent a deadline.
- Extended bounded grounding to version/policy 1.1.2. Explicit mappings now
  override matching terms contributed by rejected catalog records, and reviewed
  category-compatible styles keep semantic fighter/meteor/pickup roles ahead of
  unrelated pixel assets without relaxing the positive-match gate.
- Final zero-model replay `45ad2b04-4f44-4f0f-b07f-061b7da08dc2` passed 9/9
  selections in 383 ms. It selected distinct normal fighter, meteor, orange
  aiming fighter, shield, and firepower assets and preserved Spec/catalog/
  grounding/selection hashes.
- Reported a 2-4 minute, 4-7 MiB budget for one Edge channel and desktop/mobile
  viewports. Pipeline `6f3c2ef7-8b7a-43cd-919f-ece4cefe79e0` failed after 506
  ms before Edge because catalog mode requires a background query and the Spec
  omitted it. No viewport, package, repair, further model call, or credential
  access occurred.
- Kept the original Spec immutable and retained the Composer gate. Future live
  probe extraction now asserts fixed catalog-role coverage before writing a
  successful report, while legacy geometric Specs remain valid. The
  model-visible contract explicitly requires a background query.
- Replaced the case-aware verifier's universal 20-second Boss play-evidence wait
  with a Spec-derived 20-60 second bound based on the last wave end. This changes
  only verification timing and retains every gameplay assertion.
- Final `pnpm check` passed formatting, both strict TypeScript projects, 35 test
  files / 162 tests, and the Vite production build.

## 2026-07-16 - Lock the Agent objective and reduce recovery-document drift

- Added an explicit product-objective lock to `AGENTS.md`: game descriptions are
  Agent evaluation inputs by default, not a switch from Agent development to
  one-game delivery. Recovery reports must separate product objective, Agent
  capability, evaluation case, blocker, and exact next step.
- Rewrote the current-state documents around single responsibilities. ROADMAP
  fell from 184 to 108 lines, HANDOFF from 114 to 68, and CURRENT_STATUS from
  581 to 134. Historical chronology remains in this append-only log and
  immutable artifacts.
- Added a deterministic documentation-governance test that caps ROADMAP at 140
  lines, HANDOFF at 80, and CURRENT_STATUS at 220; it also requires objective,
  Agent capability, evaluation case, active mainline, and next-step headings.
- The governance-focused test run passed 36 test files / 165 tests. The final
  unified gate is recorded in the current handoff/status rather than duplicated
  here as new chronology.

## 2026-07-16 - Require documentation compaction at major stage close

- Added a mandatory stage-close compaction protocol to `AGENTS.md`. Before a
  major transition, completed detail moves to this progress log or immutable
  artifacts; ROADMAP, HANDOFF, and CURRENT_STATUS are rewritten around the next
  active state rather than accumulating another narrative.
- The protocol requires stale-objective searches, preservation of reproducible
  evidence, before/after line-count reporting, documentation governance tests,
  formatting, and a proportionate project gate.
- Routine test iterations and small task boundaries do not trigger compaction,
  preventing noisy documentation churn. Immutable reports, rejected assets,
  credential exclusions, and reproducibility evidence may never be deleted by
  the compaction step.
- Extended the deterministic documentation-governance test so this protocol and
  its line-count reporting requirement cannot be silently removed.

## 2026-07-16 - Complete bounded Spec completion and expose intent provenance

- Added `SpecCompletionPolicy 1.0.0` under ADR 0019. It preserves the source
  Spec, derives only missing background/enemy-projectile asset queries, records
  rules and reasons, and binds source/effective Specs with SHA-256.
- Integrated the policy through manifest 1.4.0, grounding, selection,
  composition, browser resumption, and final packaging. Existing values,
  gameplay fields, Phaser, catalog data, and positive-match gates are unchanged.
- Replay `3df2c95f-b2d9-46cb-b884-df1b4ccb7a51` passed 10/10 selections. Build
  run `54123291-f3dc-4e99-a578-87b00c91c188` reached `built` in 2,384 ms with
  one background decision, 51 files, 1,445,798 bytes, and zero model calls.
- The first Edge run `6be17eb5-5e9f-40e0-84d3-2dfe3d4dd273` failed on desktop
  at 7.1 seconds because a stationary five-health player died. Three bounded
  public-key movement experiments were preserved under runs
  `34b488fa-0238-4ead-9a13-0c4685bce735`,
  `b870188c-d2c4-46d5-8295-05c0449a2230`, and
  `3c1f959a-3aac-4469-9c6c-8df1115037ad`; none proved the 53-second case, so
  their source change was removed. No mobile case or package ran.
- The failure selects the next reusable boundary: bind request intent to source
  Spec fields before changing Agent-chosen playability values. It does not
  justify a case-specific health edit, browser-gate relaxation, Phaser change,
  or another paid model call.

## 2026-07-16 - Complete request-bound Spec intent provenance

- Added `SpecIntentLedger 1.0.0` under ADR 0020. The bounded
  `zh-cn-playability-intent-v1` policy hashes the exact request, its NFKC
  normalization, and the canonical source Spec; user locks retain request spans
  and deterministic domain bindings.
- Version 1 covers desktop/mobile targets, wave count, the supported enemy-role
  list, difficulty, shield/firepower pickups, Boss-defeat victory, and player
  max health. Unknown scoped terms, conflicts, incomplete/repeated evidence,
  ambiguous bindings, source mismatches, and tampering fail closed.
- Health is Agent-owned only when bounded health vocabulary is absent. An exact
  stated value becomes user-locked and must match the source Spec. No gameplay
  value, Phaser source, catalog record, selection gate, or browser assertion was
  changed.
- Zero-model replay `aa527332-3ebd-40a9-b744-650a30d86ad1` bound request SHA-256
  `0bfb2efcc2b4fb1bab7048488a459e758ab5b7354346580ce4757168a5335aba`,
  source Spec SHA-256
  `d2419cf040a077d013b75b81814b9732abef54811d8b1ab49212b4268079f2c7`,
  and ledger SHA-256
  `ebb3fdf530ede92aa505aa974a5e17e567799065d457da8aa191c1315e74609d`.
  It locked the requested platforms, three waves and roles, medium difficulty,
  pickups, and Boss victory; `player.maxHealth=5` is Agent-owned. The report
  records zero model calls and `gameplayCompletionApplied=false`.
- The provenance stage is complete. The next distinct stage is a separately
  versioned, ledger-gated playability-completion policy; it remains unimplemented
  and must not modify the raw Spec or existing failed evidence.
- `pnpm check` passed formatting, both strict TypeScript projects, 38 test files
  / 178 tests, and the Vite production build. The existing 1,243.66 kB
  JavaScript / 332.08 kB gzip chunk warning remains unchanged.

## 2026-07-16 - Complete ledger-gated gameplay completion and preserve the ceiling failure

- Added `SpecPlayabilityCompletionPolicy 1.0.0` under ADR 0021. It rebuilds the
  request-bound intent ledger, permits only Agent-owned `/player/maxHealth`,
  derives the existing schema ceiling of 20 for Boss-defeat games, and rejects
  locked, unknown, conflicting, ambiguous, mismatched, or tampered evidence.
- Manifest 1.5.0 now binds the raw Spec, intent ledger, playability Spec,
  gameplay decision, asset completion, and final Spec. The shared verifier
  replays this chain during browser resumption and packaging; final package
  metadata carries the new source-artifact hashes.
- Build-only run `d87c1057-991a-43a3-a8cf-1df7c0a99a9c` reached `built`, passed
  10/10 asset selections, changed health from 5 to 20, retained every user lock,
  and used zero model calls.
- Seven public-key Edge runs were preserved. Their desktop survival ranged from
  16.62 to 53.74 seconds. Best run
  `0ccaa709-4764-436a-b198-244d24eae1d2` completed all three waves and scored
  8,600 before health depletion at Boss entry. Final opposite-direction run
  `f57743f7-36cb-48dc-b5fe-d273732477cc` reached 52.11 seconds and scored 8,000.
  Desktop failed closed, so mobile and packaging did not run.
- Phaser, the raw Spec, catalog, selected assets, positive-match gates, and
  browser assertions were unchanged. Further per-case key timing was stopped:
  the next attempt requires a new reusable ownership boundary rather than an
  unrecorded gameplay change.

## 2026-07-16 - Complete the fixed-template browser and package baseline

- Evolved the ledger-gated policy through replay-compatible versions 1.1.0
  (health 40) and 1.2.0 (health 60). Each decision remained limited to the
  proven Agent-owned `/player/maxHealth`; request locks and the source Spec did
  not change.
- Replaced the browser harness's insufficient wait with a watchdog derived from
  the configured wave, weapon, pickup, and projectile schedule. This is test
  infrastructure, not a gameplay deadline, and all semantic assertions remain.
- Exercised generic keyboard and touch controls through public input. Final run
  `21ce7794-0160-4ba0-a0ed-acbbc8946842` passed desktop and mobile with all
  three waves, both pickups, required Boss patterns, victory, restart, selected
  assets, budgets, recovery evidence, and final package promotion.
- Desktop reached victory at 83.7361 seconds with score 21,800; mobile reached
  victory at 81.1682 seconds with score 21,300. The run used zero model calls
  and zero repair rounds. Full hashes remain in its immutable reports.
- `pnpm check` passed formatting, both strict TypeScript projects, 40 test files
  / 185 tests, and the production build. The result is a migration regression
  baseline, not a product-objective change or proof that one automated policy
  fully measures playability.

## 2026-07-17 - Approve the compatible gameplay-module architecture

- The user replaced further fixed-template expansion with a library-style
  design: reviewed compatible basic gameplay modules are implemented once, and
  an API model later selects, configures, and connects them like a programmer
  using a packaged library. Normal generation may not write module internals.
- Accepted ADR 0022 and moved the roadmap to Phase 7. A thin Phaser kernel owns
  lifecycle, entities, input, rendering, collision, events, pools, assets,
  budgets, and observation; modules own health, weapons, trajectories, drops,
  waves, Boss phases, scoring, and outcomes.
- Added planned `GameModuleManifest` and `GameAssemblySpec 1.0.0` boundaries plus
  deterministic local version/compatibility resolution. Unknown modules,
  ambiguous versions, bad ports, cycles, conflicts, duplicate ownership,
  incompatible kernels, and over-budget graphs must fail closed.
- Preserved the passing fixed-template path and packaged run as immutable
  compatibility evidence. Corpus expansion remains paused until module asset
  roles stabilize.
- This milestone changes planning and architecture documentation only. It made
  no paid model call, touched no credential contents, changed no runtime code,
  and performed no branch, commit, tag, push, or PR operation.
- The exact next gate is the contract foundation only: strict schemas, an
  in-memory registry, a pure resolver, fixtures, and fail-closed tests. Phaser
  behavior and module migration remain outside that slice.
- Stage-close compaction changed ROADMAP/HANDOFF/CURRENT_STATUS from
  107/74/164 lines to 111/68/125 lines. The unified `pnpm check` then passed
  formatting, both strict TypeScript projects, the documentation governance
  checks within 40 test files / 185 tests, and the production build.

## 2026-07-17 - Refine module contracts into orthogonal single-player capabilities

- Reviewed common vertical, top-down, arena-survival, equipment-driven, and
  special bullet-interaction designs against the planned module list. The
  current upward auto-fire planner demonstrated that a broad
  `weapon/projectile` label does not prove directional aim, active firing,
  automatic targeting, non-projectile delivery, or build composition.
- Accepted ADR 0023. Phase 7 contracts now separate player intent, locomotion,
  targeting, attack trigger, attack delivery, combat interaction,
  progression/loadout, encounter flow, companion behavior, scoring, and
  outcomes. This refines ADR 0022 without changing the product objective or
  starting runtime migration.
- The user excluded multiplayer. Networking, split-screen, PvP, replication,
  rollback, shared-loot, and player-synchronization contracts are not part of
  the active roadmap and must fail closed if requested.
- Defined five data-only contract fixtures: legacy fixed-forward auto-fire,
  directional active fire, automatic targeting, polarity/absorption, and
  slotted primary weapon, armor, secondary weapon, and companion equipment.
  They prove schema/resolver expressiveness, not implemented Phaser behavior.
- The exact next gate remains documentation-to-code contract implementation:
  schemas, an in-memory registry, a pure deterministic resolver, representative
  fixtures, and fail-closed compatibility tests. No paid model call, runtime
  behavior change, Git operation, or credential access occurred.
- Targeted Prettier verification passed for every changed planning, architecture,
  requirement, progress, and ADR document. The documentation governance suite
  passed 1 test file / 3 tests; no runtime or build check was needed for this
  documentation-only refinement.

## 2026-07-17 - Complete the Phase 7 module-contract foundation

- Added strict `GameModuleManifest 1.0.0` and `GameAssemblySpec 1.0.0` data
  rules under `src/modules/`. Manifests bind logical implementations and local
  configuration schemas; assemblies require exactly one player and reject
  unknown multiplayer or networking topology.
- Added a local versioned registry and pure deterministic resolver. It supports
  only exact, caret, and tilde selectors, pins one exact version, and rejects
  missing or ambiguous versions, incompatible kernel/engine ranges, invalid
  configuration, cardinality violations, missing or cyclic dependencies,
  conflicts, missing or ambiguous capabilities, duplicate exclusive ownership,
  undeclared or mismatched ports, missing required bindings, and aggregate
  resource-budget excess.
- Added five passing data-only assemblies: legacy fixed-forward auto-fire,
  directional active fire, automatic targeting, polarity/absorption, and
  slotted primary weapon, armor, secondary weapon, and companion equipment.
  They prove contract expressiveness only; Phaser behavior is unchanged.
- Added 10 focused tests covering the valid assemblies and the principal
  fail-closed boundaries, including executable-path rejection and multiplayer
  rejection. `pnpm check` passed formatting, both strict TypeScript projects,
  41 test files / 195 tests, and the production build. The known 1,243.66 kB /
  332.08 kB gzip bundle warning remains unchanged.
- No paid model call, credential access, gameplay migration, dependency change,
  branch, commit, tag, push, or PR occurred. The legacy packaged baseline
  remains immutable.
- This milestone moves the active mainline to the thin runtime-kernel seam.
  Stage-close compaction changed ROADMAP/HANDOFF/CURRENT_STATUS from
  128/75/141 lines to 123/67/150 lines. The older progress-log statement that
  the contract gate was next is intentionally retained as append-only history.

## 2026-07-17 - Complete the thin runtime-kernel seam

- Added engine-neutral runtime contracts for lifecycle, time, entities and
  pools, input, rendering, collision, assets, typed events, resource budgets,
  and generic read-only observation. Deterministic budget, event, and asset
  services fail closed on unknown or exceeded ownership.
- Added one Phaser adapter and changed the preserved legacy `PlayScene` to use
  only the kernel service surface. Health, damage, weapons, waves, pickups,
  Boss patterns, scoring, and outcomes remain in the legacy scene; no gameplay
  module or non-legacy fixture behavior was implemented.
- Added a static boundary test that rejects direct legacy scene access to
  Phaser services plus focused event, budget, asset, and template-source tests.
- The first no-model browser attempt, run
  `1ddb3849-7467-4056-ba1c-c021d2d73c99`, failed closed before browser launch
  because the isolated-template allowlist omitted the three new kernel files.
  The immutable failure was preserved, the reusable allowlist and regression
  test were corrected, and no repair round or paid call was used.
- Fresh no-model run `a4a249f0-0e60-4fd9-a107-f62eefc267f2` reached
  `play_checked`. Desktop/mobile comprehensive controls, spawning, weapons,
  waves, patterns, pickups, scoring, assets, caps, victory, restart, and all
  console/page/request error gates passed. Verification SHA-256 is
  `d407f3f74f215306e62cac8ce2db7670ee0f6eb2efcfa5d8b734e903b26b3d86`.
- Formatting, both strict TypeScript projects, 42 test files / 200 tests, and
  the production build pass. No credential, corpus, dependency, paid model,
  gameplay-module, or Git-state change occurred.
- This completes the kernel-seam stage. The active mainline moves to the first
  reviewed legacy-capability slice: player intent and bounded locomotion with
  legacy parity while the fixed scene remains available.
- Stage-close compaction changed ROADMAP/HANDOFF/CURRENT_STATUS from
  123/67/150 lines to 126/72/163 lines. Current-state mentions of the kernel
  seam are intentionally retained only as completed capability and as the
  dependency of the new player-intent/locomotion gate.

## 2026-07-17 - Require API-model ownership of production module wiring

- The user corrected the first module-slice acceptance boundary. Local
  development owns reviewed module internals, but the requirement API model
  must select, configure, and bind production modules through a request-bound
  `GameAssemblySpec`. A hand-authored legacy assembly cannot claim Agent success.
- Moved the minimum model-visible catalog, request/assembly binding, and runtime
  instantiation proof into the Phase 7 player-intent/locomotion gate. Phase 8
  now generalizes that first proof across a broader reviewed module catalog.
- The next implementation remains no-call preparation. It must stop before a
  paid request and present the proposed model, purpose, call count, token ceiling,
  and estimated cost for explicit user approval.
- This planning correction changed no runtime code, dependency, credential,
  corpus, evaluation artifact, or Git state and made no model call.

## 2026-07-17 - Move the active mainline to the executable base-module library

- The user clarified that Agent development should first build a broad,
  reusable base library for common single-player vertical bullet-hell
  capabilities. API-model intent review and normal assembly should follow only
  after the library can reproduce the preserved game through executable modules.
- The user also clarified that an in-scope catalog gap should not fail
  immediately. In Phase 8 the same API model may use OpenCode as its bounded
  code-tool framework to develop a run-local module; deterministic local gates
  retain admission authority and failure occurs after the bounded attempt is
  exhausted. Explicit scope, security, permission, credential, and cost
  violations still fail immediately.
- Accepted ADR 0024 and added `docs/BASE_MODULE_LIBRARY_PLAN.md`. The plan defines
  the module ABI, ten capability domains, four implementation batches, module
  admission evidence, and the later gap-development boundary.
- The exact next objective is the base-module execution foundation and first
  coherent combat loop: implementation factories, resolved-graph instantiation,
  player input/intent, bounded locomotion, fixed targeting, interval trigger,
  projectile delivery, and health/damage modules with parity evidence.
- No runtime code, dependency, credential, corpus, model call, evaluation
  artifact, branch, commit, tag, push, or PR changed in this documentation
  milestone.
- Stage-close compaction changed ROADMAP/HANDOFF/CURRENT_STATUS from
  137/78/173 lines to 121/77/182 lines. Historical statements in ADR 0022 and
  earlier progress entries are retained with explicit ADR 0024 supersession;
  current-state documents now contain one base-library mainline and next gate.

## 2026-07-17 - Separate development planning from target runtime behavior

- Cleaned the recovery and planning surface so Phase 7 describes only Agent
  development deliverables: the executable base-module ABI, library batches,
  legacy parity, evidence, and the next implementation gate.
- Recast Phase 8 as development of the model-orchestration subsystem, including
  adapters, catalog/request contracts, isolated workspace control, admission,
  budgets, repair, and mock/integration tests. No model workflow is treated as
  an action to perform during Phase 7.
- Kept the finished Agent's intent review, module reuse, and bounded OpenCode
  gap behavior in Architecture, Requirements, and ADR 0024, with explicit
  target-runtime labels and a pointer back to ROADMAP for sequencing.
- Changed no runtime code, dependency, credential, corpus, model call,
  evaluation artifact, branch, commit, tag, push, or PR.

## 2026-07-17 - Complete the Phase 7 library and Batch 1 design baseline

- Replaced the earlier coverage sketch with a complete Phase 7 base-library
  design spanning player intent, locomotion, targeting, triggers, delivery,
  combat, progression/loadout, encounters, companions, scoring, and outcomes.
  It now defines the planned module families, shared payload/configuration and
  ownership rules, lifecycle, resources, compatibility layers,
  representative interactions, four batches, admission evidence, and gates.
- Added implementation-ready specifications for nine Batch 1 modules:
  keyboard movement, touch drag, movement arbitration, bounded locomotion,
  fixed-forward targeting, interval trigger, pooled projectile delivery,
  health, and collision damage. Each records IDs/versions, responsibilities,
  bounded configuration, ports, ownership, kernel access, compatibility,
  lifecycle, budgets, fail-closed behavior, and five levels of acceptance.
- Added ADR 0025 for exact factory registration, strict runtime payloads,
  owner-scoped capabilities, explicit cross-owner bindings, safe logical entity
  channels, stable graph order, partial-failure rollback, reverse cleanup,
  cancellable listeners/colliders, and per-instance budget grants.
- Defined end-to-end keyboard/touch/arbitration, fire, damage/health, and
  stop/restart/release flows plus direct fixed-path parity evidence. Batch 1 is
  explicitly the first implementation slice, not the complete-design boundary;
  only new gameplay-neutral kernel surface is constrained to the sufficient
  ABI required by the complete catalog.
- Changed no runtime code, dependency, credential, corpus, model call,
  evaluation artifact, branch, commit, tag, push, or PR. The next milestone is
  contract-first implementation of ADR 0025 before gameplay factories.

## 2026-07-17 - Add the complete Chinese module-design review packet

- Added `docs/MODULE_LIBRARY_DESIGN_REVIEW_ZH.md` as the user-facing review
  entry for the complete Phase 7 library architecture, execution ABI, all nine
  Batch 1 module contracts, six interactions, parity, resources, compatibility,
  gates, and ten explicit review decisions.
- Kept the existing English design files as implementation specifications and
  recorded that user-confirmed Chinese conclusions must be reconciled into
  those specifications before implementation if any ambiguity is found.
- Changed no runtime code, dependency, credential, corpus, model call,
  evaluation artifact, branch, commit, tag, push, or PR.

## 2026-07-17 - Revise the module design after blocking review

- Accepted four blocking findings: early projectile consumption prevented later
  combat-policy composition; startup state/event semantics were undefined;
  runtime lease cleanup mixed pause and disposal scopes; and runtime functions/
  Zod objects could not provide reproducible evidence hashes.
- Replaced the combined collision-damage module with projectile contact,
  default damage decision, and final contact resolution. Only final resolution
  can consume, retain, or transfer a source; later polarity, cancellation,
  absorption, and reflection modules form an explicit acyclic decision chain.
- Added replay-latest state ports, non-replayable running-only event ports,
  consumer activation before state replay, synchronous event-cycle rejection,
  and precise pause/resume versus new-game re-instantiation semantics.
- Split leases into start, instance, and graph ownership; added a bounded
  active-generation contact ledger and structured actor/entity-role grants in
  place of broad cross-owner authorization.
- Replaced function-object hashing with canonical manifest/schema/reservation
  descriptors, implementation bundle bytes, dependency-lock identity, and
  build/toolchain identity. Recorded reviewed AssemblyRecipe expansion as a
  Phase 8 design requirement only.
- Updated ADR 0025, the complete library plan, Batch 1 design, Chinese review
  packet, architecture, roadmap, status, and handoff. No runtime code,
  dependency, credential, corpus, model call, evaluation artifact, or Git state
  changed. User re-review is the next gate.
- Formatting, 17 focused governance/module/kernel tests, all 42 files / 200
  tests, and a structural audit for eleven complete module specifications plus
  all four blocker resolutions passed.

## 2026-07-17 - Close the second module-design review blockers

- Replaced the final resolver's direct-health dependency with owner-scoped
  `combat.damage-sink@1.0.0`. Each owner has one route head; all damage producers
  enter that head, filters have one downstream sink, and the route uniquely
  terminates at health. This permits later shield/invulnerability insertion
  without changing the Batch 1 ABI.
- Split `contact-decision-v1` into independent `disposition` and
  `sourceOperation` fields with a closed valid-combination matrix.
- Replaced ordinary policy events with a restricted synchronous
  `ContactPolicyTransform` transaction. Identity is frozen, mutable fields are
  allowlisted, each policy executes exactly once, and transform failure cannot
  mutate an entity or emit a result.
- Added registry-owned, hashed `ContactPolicyChainProfile` artifacts and exact
  manifest order constraints so the resolver rejects unknown policy ordering
  before instantiation.
- Kept Batch 1 at eleven modules: damage-sink is a capability, not a twelfth
  module. Changed no runtime code, dependencies, credentials, assets, model
  calls, evaluation artifacts, or Git state. User design approval remains the
  next gate.
- Formatting, 17 focused governance/module/kernel tests, all 42 files / 200
  tests, and a structural audit for eleven modules plus all four second-review
  contracts passed.

## 2026-07-17 - Approve the complete module design and open execution foundation

- The user approved ADR 0025 and the Chinese Phase 7 module-design packet after
  both review rounds. The approved design retains eleven Batch 1 modules,
  restricted synchronous contact-policy transforms, registry-owned chain
  profiles, dual decision fields, linear owner-scoped damage sinks, scoped
  leases, canonical evidence, and the fixed-template compatibility baseline.
- Closed the design-review gate and moved the Phase 7 active gate to the first
  execution-foundation contract slice: Manifest 1.1 schemas/descriptors,
  structured authorization and evidence, followed by resolver failure tests.
  Gameplay module implementation remains a later gate.
- Changed documentation only. No runtime code, dependency, credential, asset,
  model call, evaluation artifact, branch, commit, tag, push, or PR changed.
- Stage-close verification passed formatting, the 17 focused
  governance/module/kernel tests, all 42 files / 200 tests, and the stale-stage
  wording audit. Recovery-document line counts changed from 125/76/196 to
  126/78/198 for ROADMAP/HANDOFF/CURRENT_STATUS, all within governance limits.

## 2026-07-17 - Implement the first execution-foundation contract slice

- Added strict discriminated `GameModuleManifest 1.1.0` and retained Manifest
  1.0 fixture parsing/resolution. Resolved Graph 1.1 marks legacy instances
  `fixture-only`, so the compatibility data cannot be treated as production
  instantiation input.
- Added strict state/event delivery and eleven Batch 1 payload Schemas,
  independent contact disposition/source-operation fields with the accepted
  combination matrix, scoped capabilities, structured endpoint authorization,
  runtime lease ceilings, damage-sink descriptors, and restricted contact
  transform descriptors.
- Added canonical configuration/reservation descriptors, length-delimited
  module artifact hashing, canonical registry-owned policy-profile hashing, and
  exact hash-drift rejection.
- Extended deterministic resolution evidence with actors, asset roles,
  validated configuration, artifact identity, delivery-aware bindings,
  dependency/capability edges, provider-first order, expanded exact policy
  profiles, and same-owner linear damage-sink routes.
- Added deterministic failures for owner/scope/role violations, mixed Manifest
  port generations, state/event mismatch, synchronous event cycles, missing or
  reordered profiles, missing damage routes, below-head producer bypass, fork,
  cycle, disconnected/unterminated sinks, and unbound damage producers.
- Verification passed the 23 focused module tests, both TypeScript projects,
  formatting, and all 43 test files / 213 tests. Build and browser gates were
  not rerun because no template or runtime behavior changed. No dependency,
  asset, credential, model call, evaluation artifact, or Git state changed.
- The next execution-foundation slice is exact production registration for
  canonical descriptors and reviewed bundle artifacts, followed by the pure
  state/event router with stable replay, phase rejection, and subscription
  leases. Factories, full graph instantiation, and gameplay modules remain
  outside that slice.

## 2026-07-17 - Bind production artifacts and add deterministic port routing

- Separated artifact identity from Manifest 1.1 to avoid self-referential
  hashing. Fixture registration remains resolver-compatible but cannot authorize
  production routing; only the new exact production registration can do so.
- Production registration now binds canonical configuration and reservation
  descriptors, local validator/evaluator behavior, reviewed implementation
  bundle bytes, dependency-lock identity, toolchain identity, and an independently
  supplied expected artifact hash. Descriptor, bundle, or hash drift fails.
- Made reservation descriptors executable as deterministic evidence: evaluator
  output must exactly match constant or configuration-field mappings, remain
  synchronous, validate as a full resource grant, and stay within Manifest
  ceilings. Graph 1.1 records each exact grant and artifact identity.
- Added a pure deterministic state/event router for production Graph 1.1. It
  requires predeclared handlers, validates and freezes payloads, retains/replays
  only latest state in stable order, blocks events before running and while
  stopped, rejects async handlers and non-monotonic counters, and enforces
  subscription start-lease ceilings.
- Stop and failed replay zero subscription leases; resume replays state but not
  events; destruction clears handlers, retained state, counters, and the router
  graph lease. The router does not execute bundle exports or instantiate modules.
- Verification passed formatting, both TypeScript projects, 31 focused module
  tests, and all 44 test files / 221 tests. Build/browser were not rerun because
  template and Phaser runtime behavior were unchanged. No dependency, asset,
  credential, model call, evaluation artifact, or Git state changed.
- The next slice is a scoped lease ledger and pure provider-first lifecycle
  coordinator with reverse cleanup, partial-failure rollback, pause/resume, and
  graph destruction over injected fake participants. Gameplay factories,
  Phaser services, full graph instantiation, and modules remain later work.

## 2026-07-17 - Add scoped leases and deterministic lifecycle rollback

- Added an owner/key-scoped start, instance, and graph lease ledger with exact
  per-owner ceilings, frozen unique identities, atomic failure, reverse bulk
  revocation, scoped snapshots, leak assertions, and zero-residue destruction.
- Added a pure coordinator for already-created injected participants. It rejects
  non-production graphs, follows resolved provider-first initialize/start order,
  reverses stop/dispose, preserves pause/resume instance state, and separates
  terminal disposal from graph destruction.
- Initialization and start failures preserve the primary error plus every
  cleanup failure while continuing reverse rollback. Thenable hooks fail closed;
  a failed explicit stop becomes non-resumable but remains disposable.
- Integration tests prove start leases reach zero on pause and failed start,
  instance leases survive pause then reach zero on disposal, and graph leases
  reach zero only at destruction.
- Fixed provider-order validation to reject capability-only and mixed cycles
  deterministically instead of risking recursive stack exhaustion.
- Verification passed 31 focused tests, formatting, both strict TypeScript
  projects, and all 47 test files / 242 tests. Build/browser were not rerun
  because no template, Phaser adapter, or gameplay behavior changed.
- No dependency, asset, credential, model call, evaluation artifact, branch,
  commit, tag, push, or PR changed. The next pure slice is the restricted
  contact-policy transaction host and bounded active-generation contact ledger.

## 2026-07-17 - Integrate the pure execution host over fake Graph 1.1 participants

- Added exact executable factory/policy exports bound to reviewed artifact
  identity, plus a scoped factory context that exposes only router, lease, and
  logical-entity capabilities rather than Phaser or the unrestricted kernel.
- Added a restricted synchronous contact-policy transaction host, deep-frozen
  and rehashed profile evidence, immutable identity/host-owned trace checks,
  mutable-field allowlists, final outcome validation, and deterministic async,
  exception, malformed, and unauthorized failure.
- Added a bounded active-generation contact ledger that keys channel/entity/
  generation/target and prunes only through a trusted logical entity activity
  source. Added frozen logical entity references and explicit consume/actor-
  transfer grants; policy failure is proven mutation-free before final consume.
- Added a fake-only production Graph 1.1 harness integrating exact registry
  lookup, provider-first factories/lifecycle, state replay and running events,
  combined subscription/module start ceilings, reverse rollback, pause/resume,
  terminal disposal, new instances, entity cleanup, and graph destruction.
- Sub-agents owned non-overlapping runtime-factory and harness test files while a
  third performed a read-only ADR audit. Main review fixed shallow profile
  freezing, arbitrary ledger pruning, and aggregate start-lease accounting,
  then reviewed the actual files and reran all gates.
- Verification passed 48 focused tests, formatting, both strict TypeScript
  projects, and all 52 test files / 269 tests. Build/browser were not rerun
  because no template, Phaser adapter, gameplay behavior, or browser surface
  changed. No dependency, asset, credential, model call, evaluation artifact,
  or Git state changed.
- Execution foundation remains active. Next, entity channel/grant declarations
  must become resolved Manifest/Graph evidence before a production graph
  instantiator and scoped gameplay-neutral kernel adapters are implemented.

## 2026-07-17 - Resolve entity authority and add production instantiation

- Added strict Manifest 1.1 owned-channel, mutation-access, contact-detector,
  and final-resolution descriptors. Assembly data may select only concrete
  transfer recipients inside manifest-authorized roles; it cannot invent a
  source channel, operation, grantee, or contact-policy order.
- Resolver output now freezes exact entity channels, capacity resources,
  readers, source artifact identity, and mutation grants. It proves one
  detector source channel, candidate path, policy-profile consumer, and final
  resolver all share the same authority, rejecting missing/ambiguous bindings,
  unmatched selections, unauthorized recipients, duplicate grants, and exact
  capacity above per-instance resource grants.
- Added a closed gameplay-neutral runtime service-host contract for clock,
  input, actors, pools, collisions, assets, viewport, budgets, and observation.
  Factories receive only a frozen per-instance scope plus resolved ports,
  leases, and entity authority; they never receive Phaser or the full kernel.
- Added the deterministic production Graph instantiator. It requires an
  explicit service host, ignores extra caller authority, constructs scopes and
  factories provider-first, revokes services and participants in reverse order,
  preserves pause/resume and new-instance semantics, and continues cleanup
  across factory, scope, revoke, or host-destruction failures.
- Entity channels and mutation grants now create host-owned instance leases
  combined with factory keys and Manifest ceilings. Integration proves the
  resolved final resolver can transfer one source while the detector cannot,
  and origin-channel custody is released on disposal.
- Sub-agents owned the entity-resolution and production-instantiator test files
  while a third performed a read-only ADR audit. The audit added static contact
  lineage and multi-resource capacity constraints; a red test corrected service
  revocation from lexical module order to reverse construction order.
- Verification passed 58 focused tests, formatting, both strict TypeScript
  projects, and all 54 test files / 289 tests. Build/browser were not rerun
  because no template, Phaser adapter, gameplay behavior, or browser surface
  changed. No dependency, asset, credential, model call, evaluation artifact,
  branch, commit, tag, push, or PR changed.
- Execution foundation remains active. The next slice is the Phaser-backed
  scoped service host and template composition with cancellable lifecycle and
  build evidence, before any concrete gameplay factory begins.

## 2026-07-17 - Complete Execution foundation and open Batch 1 factories

- Split all runtime payload schemas from Node-only hashing while preserving
  compatible exports. The production harness now depends on a minimal exact
  execution registry; a frozen browser catalog consumes only Node-admitted
  identities. Contact transactions use browser-safe equality and exact frozen
  profile/descriptor checks, and are injected into the scoped factory context.
- Added owner-only logical recycle and a live scope authority that atomically
  binds engine side effects to ledger leases. Registration failure releases the
  lease; duplicate, unknown, unauthorized, stale, async, and over-limit actions
  fail deterministically before an unaccounted side effect is retained.
- Made Phaser timers, pointer listeners, overlaps, and shutdown listeners return
  idempotent cancellers. Added the kernel-backed service host for safe actors,
  shared readable/owned pools, physical/logical generations, assets, viewport,
  exact active entity/projectile/timer grants, a trailing 1,000 ms spawn window,
  observation, reverse cleanup, and aggregated cleanup failures.
- Added the reviewed browser runtime closure to isolated composition. The Phaser
  registry holds a frozen catalog/execution foundation; a template lifecycle
  owner preserves pause/resume, removes explicit shutdown hooks, disposes and
  destroys on scene shutdown, and creates fresh owners for a new game. The
  preserved `PlayScene` remains the default compatibility path.
- Sub-agent 1 implemented and tested cancellable kernel primitives, then the
  scoped service host. Sub-agent 2 split the browser execution closure and
  connected atomic lease/entity authority. Sub-agent 3 first audited ADR 0025,
  resolver/template risks, then removed Node dependencies from contact policy.
  The main Agent reviewed actual source, corrected post-policy physical recycle,
  integrated policy authority/catalog/template lifecycle, and reran every gate.
- Verification passed 56 focused tests, formatting, both TypeScript projects,
  all 60 test files / 313 tests, the root and isolated Vite production builds,
  and desktop/mobile comprehensive Edge gates. Final run
  `417fcf36-579b-4abb-a295-8f6f3f1d5e2c` reached `play_checked` with verification
  SHA-256 `41477ebbc0dd4d0ca98cc7d70b6bba3e4efbf1fc23c5b8a4630200b664a2e07d`,
  zero findings/errors/failed requests, no model call, and no repair round.
- Stage-close recovery documents were compacted and the active Phase 7 gate
  moved from Execution foundation to First vertical slice. The exact next work
  is all eleven Batch 1 production manifests, schemas, reservations, factories,
  catalog entries, default policy profile, and resolved vertical-slice graph.

## 2026-07-17 - Reopen Execution foundation after pre-factory ABI audit

- Before creating Batch 1 gameplay skeletons, three read-only audits and a main
  source review compared ADR 0025 and the Batch 1 design with the actual
  lifecycle, resolver, registry, scoped host, template owner, and tests.
- The audit found blocking shared-contract gaps: no provider-first frame update;
  running scene shutdown conflicts with coordinator phases; production
  eligibility does not require an executable export; dependencies cannot express
  owner scope; modular observation replaces one global reader; and timer leases
  do not enforce the exact live timer grant. It also identified missing asset
  requirements and final contact-resolution commit authority.
- Existing 60 test files / 313 tests, formatting, and both TypeScript projects
  still pass. Those results remain valid evidence for implemented infrastructure
  but do not cover the newly identified runtime paths. No gameplay factory,
  default graph, model call, credential access, asset expansion, or Git state
  change occurred.
- Added proposed ADR 0026. It preserves Manifest 1.0/1.1 compatibility and the
  fixed path while proposing Manifest 1.2, exact execution readiness,
  deterministic frame/lifecycle semantics, scoped resource controllers,
  namespaced observation, and a final-resolution commit boundary.
- The earlier completion entry above remains as historical evidence of the
  decision made from the then-passing gates; current recovery documents now
  correctly reopen Execution foundation. The next action is user review of ADR
  0026, not gameplay-factory implementation.

## 2026-07-17 - Seal proposed ADR 0026 review gaps

- A second read-only review accepted the remediation direction but found that
  its version boundary, executable provenance, contact atomic boundary, update
  failure state, lifecycle service permissions, and timer-slot semantics still
  required implementers to invent behavior.
- Rewrote proposed ADR 0026 rather than approving it. The revision mandates
  Manifest 1.2, Assembly 1.1, and Graph 1.2; preserves legacy semantics; replaces
  caller-supplied function/hash pairs with a content-addressed loader-owned
  executable handle and generated frozen catalog; and defines readiness evidence
  without reinterpreting the Graph 1.1 boolean.
- The revision also freezes one transition lock, deterministic simulation time
  and delta policy, a lifecycle service-permission matrix, host-assigned timer
  slots, explicit entity quarantine, stable multi-reader snapshots, and a
  prepare-before-mutate contact commit whose planned deliveries are all attempted.
- Added a normative rule-to-code-to-test traceability requirement and sixteen
  other exit checks. The ADR remains Proposed and gameplay/runtime implementation
  remains unauthorized until the user reviews the rewritten contract.

## 2026-07-17 - Close nested delivery and failure-custody semantics in ADR 0026

- A third review found that one non-reentrant transition lock conflicted with
  nested synchronous event emission, start-hook state could reach a consumer
  before its own start, indeterminate source mutation lacked a branch, and
  runtime-root quarantine had no exact owner or lifetime.
- Revised proposed ADR 0026 to separate one top-level graph guard from inherited,
  depth-bounded event transaction tokens. Nested delivery reuses the token while
  lifecycle/frame reentry remains forbidden. Start-hook state is retained-only
  until a post-start restricted delivery barrier, and dormant adapters cannot
  call factories before running.
- Defined source-operation-indeterminate as a no-result terminal failure with
  commit/entity quarantine and retained duplicate/resource custody. The
  runtime-kernel session now owns a bounded quarantine ledger, blocks graph
  restart while non-empty, retains global budget, performs final teardown retry,
  and emits evidence required by verification and packaging.
- Strengthened executable admission against forbidden imports and top-level side
  effects; froze timer mode/count/cancellation semantics, exact observation
  limits and purity claims, and one authoritative descriptor-to-service-key map.
  ADR 0026 remains Proposed; no runtime implementation was authorized.

## 2026-07-17 - Remove remaining duplicated and late-allocation ABI authority

- A fourth review found duplicate timer ceilings, possible replay/start state
  duplication, abandoned prepared-contact capacity, quarantine allocation that
  occurred too late for mass cleanup failure, and assembly-controlled texture
  keys that could collide with the fixed template.
- Revised proposed ADR 0026 so `manifest.resources.timers` is the sole timer
  ceiling and exact reservation alone determines host-generated slots. Start
  hooks can no longer publish state/event; consumers receive retained state once
  in the restricted replay phase before their own start.
- Prepared contact capabilities are now bound to their originating event token.
  Its finalizer aborts every uncommitted capability without evidence-ID holes,
  duplicate residue, or slot leaks. Each entity activation atomically reserves
  session quarantine capacity, so failure transfers an existing reservation
  rather than allocating during cleanup.
- Removed assembly-selected texture keys. The host derives a content-addressed
  module namespace, snapshots all existing template/runtime keys, and requires
  exact approved evidence for any sharing. Added stable `ABI26-*` rule-group IDs,
  child-ID governance, and a safe future ADR/spec split policy. The ADR remains
  Proposed and no runtime implementation was authorized.

## 2026-07-17 - Accept ADR 0026 and open runtime ABI remediation

- The user explicitly approved ADR 0026 after four review/revision rounds. The
  accepted contract mandates Manifest 1.2, Assembly 1.1, Graph 1.2, trusted
  executable loading, deterministic frame/lifecycle semantics, scoped service
  authority, one timer ceiling, pre-reserved quarantine capacity, host-derived
  textures, bounded observation, and event-finalized contact commit.
- Changed the active Phase 7 gate from ADR review to Execution foundation
  remediation. First vertical slice remains blocked; approval does not authorize
  gameplay factories, asset expansion, model calls, or Git state changes.
- Compacted the current recovery surface in the same transition. ROADMAP owns the
  accepted gate and implementation boundary; HANDOFF names one exact red-test
  resume point; CURRENT_STATUS retains only current capability, blockers, and
  evidence. Earlier Proposed statements remain only in this append-only history.
- The exact next objective is ADR 0026 boundary 1: add red tests and implement
  Manifest 1.2, Assembly 1.1, Graph 1.2, the combined dependency/capability DAG,
  host-derived asset bindings, trusted executable loading/generated catalog, and
  execution-readiness evidence while preserving legacy versions and the fixed
  template.
- Stage-close recovery line counts changed ROADMAP/HANDOFF/CURRENT_STATUS from
  `103/79/180` to `103/76/180`. Documentation governance (3 tests), formatting,
  both strict TypeScript projects, and the full 60-file/313-test suite pass.
  Build/browser verification was not rerun because approval changed documents
  only and no runtime, template, browser surface, or packaged evidence changed.

## 2026-07-17 - Complete ADR 0026 runtime ABI remediation

- Added append-only ABI26 child rule IDs and implemented Manifest 1.2, Assembly
  1.1, and Graph 1.2 without changing legacy version semantics. Graph 1.2 uses
  matching immutable readiness/catalog evidence and rejects legacy resolver
  entry, fixtures, missing handles, admission drift, unresolved dependencies,
  assets, grants, and authorities.
- Replaced caller function/hash production admission with a Node-only loader
  that scans self-contained ESM, rejects ambient authority/top-level execution,
  evaluates the exact hashed bytes, and mints privately validated handles.
  Added exclusive content-addressed build inputs and generated frozen catalog
  entries whose evidence is rechecked at browser instantiation.
- Added the browser-safe ABI runtime: one transition guard; inherited events at
  depth 32; deterministic 0-250 ms clock; timer-first/provider-first frames;
  retained-state start barrier; phase permissions; host-derived lease/service
  identities; exact timer slots; atomic bounded observation; entity custody and
  pre-reserved session quarantine; and token-finalized source-first contact
  commit with no-result indeterminate failure.
- Removed raw lease/entity/kernel authority from the V1.2 factory context and
  froze the movement-arbiter, projectile-delivery, final contact-resolution,
  global contact identity, and input/policy semantic contracts needed by Batch
  1. No gameplay factory, model call, credential access, asset expansion, or Git
     state change occurred.
- The first fixed-path browser run
  `89dc60d9-a162-4ed0-8891-14180f2889e2` failed safely because isolated
  composition omitted the new browser ABI source. Reproduction exposed the
  unresolved import; adding that exact source to the allowlist produced passing
  run `0e47917e-8de7-4b7d-8b6b-e9920b434ae4`. After final phase-guarded service
  wrapping, desktop/mobile run `32f35950-ca07-4b27-a6b4-4937ac7ca547` reached
  `play_checked`, verification SHA-256
  `5cc57b1c55c2812ca0b42351acd5dddffcdb520e400e2ab3203a7e89868296a9`.
- `pnpm check` passes formatting, both strict TypeScript projects, 61 test files
  / 334 tests, template composition, and production build. The known 1.37 MB
  chunk warning remains non-blocking. Stage-close recovery documents moved the
  active gate from remediation to First vertical slice. Stage-close line counts
  changed ROADMAP/HANDOFF/CURRENT_STATUS from `103/76/180` to `105/74/136`.

## 2026-07-17 - Complete the eleven-module Batch 1 vertical slice

- Added frozen Manifest 1.2/configuration/reservation definitions and
  loader-admitted self-contained factories for all eleven approved Batch 1
  modules. Assembly 1.1 resolves them into one ready Graph 1.2 with exact asset,
  capability, damage-route, policy-profile, mutation-grant, and resource evidence.
- Closed production integration by deriving payload-validated state/event ports
  from resolved graph evidence, admitting external input/overlap callbacks through
  the inherited event transaction, and keeping motion/entity cleanup host-owned
  instead of expanding forbidden factory stop-phase authority.
- Added unit/integration evidence for configuration strictness, exact/one-over
  reservations, keyboard/touch arbitration, bounded movement, exact firing,
  frozen default policy, prepared source-first contact, health, pause/resume,
  cleanup, and fresh-game state. `pnpm check` passes 62 files / 336 tests.
- Template composition now emits the evidence-bound Batch 1 browser catalog.
  The modular semantic host runs beside the preserved fixed scene and exposes a
  read-only observation; the fixed path remains in the comprehensive gate.
- Browser run `2e3fe6a1-c9ce-46de-a53a-931a66e11e1c` failed safely when real
  fractional frame time violated integer payload timestamps and a frozen entity
  descriptor was treated as mutable host state. The instantiator now exposes
  integer payload time while retaining fractional simulation time, and activation
  creates a host-owned physical copy.
- Successor run `29675591-949e-47aa-a1b0-5a2e13f76ab3` reached `play_checked` on
  desktop/mobile Edge; verification SHA-256 is
  `f29d8fb0649645527150b545bc41741df92d26d289413b35f3545747940e2dbe`.
- After final formatting, documentation compaction, and a clean `pnpm check`,
  final desktop/mobile run `77063902-f52e-4003-b8ac-00a555fa84df` also reached
  `play_checked`; verification SHA-256 is
  `2275afbc60f41717eae3ec2e52fc70e849248329cbd817b1b8f879ca3fe24011`.
- First vertical slice is complete. Core library is the new active gate; its
  first step is a detailed Batch 2 contract review, not unreviewed factory work.
- Stage-close recovery documents changed ROADMAP/HANDOFF/CURRENT_STATUS from
  `105/74/136` to `98/67/118`; completed chronology remains here and in immutable
  run evidence rather than competing current-state narratives.

## 2026-07-17 - Draft the Batch 2 contract packet

- Recovered from actual files and unborn `master`, then reran `pnpm check`:
  formatting, both TypeScript projects, 62 test files / 336 tests, template
  composition, and the root production build passed with only the existing
  1.43 MB non-blocking chunk warning.
- Added `docs/BATCH_2_MODULE_DESIGN.md` as a review draft; it authorizes no
  factory implementation. The packet specifies payloads, manifests/configuration
  boundaries, exact reservations, interaction graphs, rejection cases,
  implementation slices, and desktop/mobile evidence.
- Reconciled the Core gate's `targeting.nearest` scope and identified the missing
  focus intent provider. The draft proposes 23 new module IDs plus compatible
  1.1 versions of bounded locomotion, health, projectile contact, and contact
  resolution without mutating Batch 1 evidence.
- Identified authority that cannot be hidden in factories: bounded actor/channel
  snapshots, consume-only prepared pickup commit, generic projectile-channel
  compatibility, and closed modifier targets. These remain blocked pending the
  six recorded user decisions and an accepted ADR 0027.

## 2026-07-17 - Revise Batch 2 contracts after static review

- Accepted the review decisions for focus intent, nearest targeting, four
  compatible versions, conditional trigger timer reservations, and evidence-only
  score bonus. ADR 0027 remains deferred.
- Replaced the impossible post-consume modifier derivation with a host-managed
  two-phase pickup effect plan. A restricted synchronous modifier transform now
  returns every complete application during prepare, and the host validates the
  full plan before source consumption.
- Added exact delivery modifier targets, reset/snapshot semantics, effective
  count/damage formulas, and reservations based on maximum reachable modifier
  state. Runtime request-rate and pool drops are deterministic and observable.
- Corrected the representative contact graph so contact resolution executes the
  reviewed default-damage profile internally before the resolved damage route.
- Selected independent owner/channel-local pattern pools with assembly aggregate
  projectile/spawn contention, added resolved attack-channel ownership, and
  reconciled the base library plan. No runtime factory was implemented.
- Revision 2 passes Prettier and the focused documentation-governance suite
  (1 file / 4 tests).

## 2026-07-18 - Revise Batch 2 contracts for evidence and channel timing

- Kept ADR 0027 deferred and produced Revision 3 after the second static review.
- Aligned pickup evidence timing with ADR 0026: prepare validates immutable
  templates without final IDs; commit allocates evidence, constructs and freezes
  final payloads, then mutates source custody and performs fixed-order delivery.
- Added channel-explicit `attack-request-v2` and resolved targeting/trigger/
  delivery ownership per `(ownerActorId, attackChannelId)`. One aim state may
  feed multiple channel-specific targeting instances; one targeting instance
  cannot fan out across channels.
- Removed the obsolete trigger-timer fallback. The sole canonical evaluator is
  press/release zero timers and hold-repeat one timer, with drift/one-over
  rejection.
- Defined nearest snapshots with directory revision and actor generation.
  Delivery consumes only the published direction; stale references are evidence
  and have an exact before/after-targeting-update assertion.
- Revision 3 passes Prettier and the focused documentation-governance suite
  (1 file / 4 tests); no runtime factory or ADR was created.

## 2026-07-18 - Close Batch 2 snapshot and trigger contracts

- Produced Revision 4 while keeping the packet unfrozen and ADR 0027 deferred.
- Split actor snapshot authority into exact entry fields, including
  `actorGeneration`, and an explicit envelope with directory revision,
  simulation sample time/frame, and entry count. Distance sorting now uses the
  owner position from the same atomic snapshot.
- Removed every host-owned envelope/evidence/ordinal field from pickup templates.
  Commit allocates one commit/evidence identity and a contiguous event block;
  collected uses ordinal zero and applications use stable plan-order ordinals.
  Every allocated identity is durably accounted on finalization, quarantine, or
  delivery failure.
- Froze active trigger input identity, duplicate/release behavior, initial/repeat
  timing, same-time transition ordering, and pause/resume reset semantics.
- Fixed invulnerability to the half-open predicate `nowMs < activeUntilMs`,
  including zero-duration, same-time, expiry, and pause behavior.
- Revision 4 passes Prettier and the focused documentation-governance suite
  (1 file / 4 tests); no runtime factory or ADR was created.

## 2026-07-18 - Freeze Batch 2 Revision 4 and propose ADR 0027

- The user approved Revision 4. Marked the detailed Batch 2 gameplay contract
  frozen; future semantic/authority/timing/resource changes require review.
- Drafted proposed ADR 0027 for bounded actor/channel reads, channel-explicit
  attacks, conditional reservations, prepared pickup effects, modifier targets,
  compatible module versions, and Graph readiness. No implementation authority
  is claimed before explicit ADR acceptance.
- The strict-schema audit found Manifest 1.2/Assembly 1.1/Graph 1.2 cannot be
  widened without reinterpreting canonical Batch 1 bytes. ADR 0027 therefore
  proposes Manifest 1.3, Assembly 1.2, and Graph 1.3 while preserving the entire
  Batch 1 and fixed-template path.
- Closed two draft-level ambiguities before review: attack-channel descriptors
  are a role-discriminated union with both delivery inputs, and Graph 1.3 may
  mix admitted Manifest 1.2/1.3 instances without synthesizing new authority for
  1.2 modules. Repository-wide Prettier and the focused documentation-governance
  suite pass (1 file / 4 tests).

## 2026-07-18 - Reconcile Phase 7 batch and parity order

- Recorded the user's confirmation that the complete reviewed module catalog is
  required based on market-game coverage; Batch 4 is committed scope rather than
  an optional evaluation-only backlog.
- Reconciled the ROADMAP with the base-library plan: finish Batch 2 Core, then
  Batch 3 encounter/scoring/outcomes and full legacy parity, then Batch 4
  Extended library. Legacy parity no longer incorrectly follows Batch 4.
- Removed the stale ROADMAP classification of focus as an Extended-library item;
  focus remains in Batch 2. The active objective remains freezing the reviewed
  Batch 2 Revision 4 packet and drafting ADR 0027 before factory work.

## 2026-07-18 - Revise proposed ADR 0027 after authority review

- Accepted four static-review findings without accepting the ADR or starting
  implementation. Draft Revision 2 replaces broadcast modifier applications
  with graph-derived singleton addressed routes and start-scoped target leases.
- Bound abstract projectile capability satisfaction to the exact provider,
  source binding, entity channel, candidate, and mutation-grant lineage.
- Added one non-wrapping safe-integer allocation rule for generation, revision,
  attack, commit, evidence, and event identities, including pre-mutation block
  overflow checks.
- Froze mixed Graph 1.3 compatibility: unchanged Manifest 1.2 factories retain
  the exact V1.2 context/service matrix and require positive resolver, isolated-
  runtime, and desktop/mobile browser conformance evidence.
- Draft Revision 2 passes repository-wide Prettier and the focused documentation-
  governance suite (1 file / 4 tests). No schema, resolver, host, or factory code
  was implemented, and ADR acceptance remains pending.

## 2026-07-18 - Close ADR 0027 failed-prepare cleanup

- Accepted the final transaction review finding and produced Draft Revision 3.
  Any failure before a prepared capability is returned now executes the same
  no-throw, creation-ordered atomic unwind as abandonment, releasing the commit
  slot and provisional duplicate marker before the error escapes.
- Froze source-active/no-identity behavior, same-source retry, and repeated-
  failure capacity preservation. The ADR remains proposed pending explicit user
  acceptance; no runtime implementation began.
- Draft Revision 3 passes repository-wide Prettier and the focused documentation-
  governance suite (1 file / 4 tests).

## 2026-07-18 - Accept ADR 0027 Revision 3

- The user explicitly accepted ADR 0027 Revision 3 after the failed-prepare
  cleanup closure. Manifest 1.3, Assembly 1.2, Graph 1.3, and their bounded
  schema/resolver/host/red-test work are now authorized.
- Batch 2 production gameplay factories remain blocked until the complete ABI
  gate passes. No paid call, corpus expansion, fixed-path retirement, or Git
  state change was authorized.

## 2026-07-18 - Complete ADR 0027 pre-factory gate

- Implemented strict Manifest 1.3, Assembly 1.2, and serialized Graph 1.3 with
  canonical evidence while preserving Manifest 1.2/Graph 1.2 semantics.
- Closed actor/entity snapshot grants, safe identity counters, attack-channel
  triples, exact projectile provider/candidate/mutation lineage, conditional and
  maximum-reachable reservations, and stable aggregate pattern contention.
- Added the active-trigger state machine, restricted loader-owned pickup
  transform selection, prepared multi-output commit with failed-prepare unwind,
  explicit quarantine, singleton addressed delivery, and start-scoped leases.
- Added receiver-clamped health/shield/weapon modifiers, immutable request-level
  count/damage snapshots, and half-open invulnerability defense behavior.
- A real unchanged loader-admitted Manifest 1.2 keyboard factory runs beside a
  Manifest 1.3 actor-snapshot probe in isolated desktop/mobile conformance;
  V1.2 context key bytes remain unchanged and receive no V1.3 authority.
- `pnpm check` passed 83 test files / 415 tests and root production build.
  Offline run `20987e47-b137-46a8-8f7f-7d5502b55695` built successfully.
  Edge run `3608797e-8d85-4c63-97cd-8e00e326f59c` reached `play_checked` with
  verification SHA-256
  `03061a6093e3eed869db71634c8d0cd6441febeea0e855854e876f78bf9971ae`.
- The ABI/red-test gate is complete. The next stage implements all eleven
  approved Batch 2 gameplay factories and one ready Graph 1.3 slice.

## 2026-07-18 - Correct Batch 2 count and close delivery-admission evidence

- Corrected the prior milestone's Batch 2 count: the frozen production set is
  27 definitions, comprising 23 new module IDs and four compatible versions;
  the earlier reference to eleven incorrectly carried the Batch 1 count forward.
- Added one host-owned deterministic projectile-delivery admission boundary.
  It applies a rolling simulation-time request-rate ceiling, drops only the
  stable planner suffix on pool exhaustion, observes both drop causes, and
  recycles active custody in physical-slot order.
- Added direct tests for exact/one-over salvo bounds, same-time request-sequence
  rate ordering, stable pool suffix drops, independent channel custody and
  generation reuse, cross-pool rejection, and deterministic disposal cleanup.
- This closes the missing runtime evidence in ADR 0027 gate items 14 and 16;
  the resolver's existing stable aggregate ledger remains the graph-level
  contention proof. Batch 2 gameplay factories remain unimplemented.
- `pnpm check` passed 84 test files / 420 tests, both strict TypeScript projects,
  template composition, and the root production build. The output bundle is
  1,448.42 kB with the existing non-blocking chunk warning.

## 2026-07-18 - Admit the Batch 2 control definitions

- Added strict Manifest 1.3/configuration/reservation records and loader-admitted
  self-contained factories for the eight frozen control definitions:
  directional aim, active attack, focus, focus speed, bounded locomotion 1.1,
  directional targeting, nearest targeting, and active trigger.
- Kept Batch 1 bytes unchanged. The new production registry uses loader-minted
  handles and canonical artifact evidence; all configurations reject unknown
  fields, and the active-trigger evaluator preserves the conditional exact
  zero/one timer rule.
- Added direct production-admission, artifact, strict-configuration, and exact-
  reservation tests. `pnpm check` passed 85 test files / 423 tests, both strict
  TypeScript projects, template composition, and root production build.
- This is an internal Core-library increment, not a stage transition. Delivery,
  defense, progression, complete ready Graph 1.3, isolated build, and browser
  evidence remain before the Batch 2 gate can close.

## 2026-07-18 - Admit all Batch 2 definitions and browser-check the first Graph 1.3 slice

- Added all ten delivery, three defense, three progression, and three compatible
  combat definitions, bringing the frozen Batch 2 production set to 27 of 27.
  Each has strict Manifest 1.3 configuration/reservation records, reviewed
  self-contained bytes, loader handles, and canonical artifact evidence.
- Connected projectile factories to the host-owned deterministic admission
  service, made generation identity authoritative during cleanup, recorded
  modifier target field authority in Graph 1.3, and made derived state replay
  read-only under the existing phase matrix.
- Added a 15-module mixed ready Graph 1.3 plus generated V1.3 browser catalog and
  runtime. The fixed scene, Batch 1 graph, and mixed-context conformance remain
  active beside it.
- `pnpm check` passed 90 test files / 445 tests. Isolated run
  `9d54385f-8e1f-401c-8410-39a29f15fa89` built successfully. Edge run
  `80559727-bd12-4252-9edc-2345912ae5b2` reached `play_checked`; verification
  SHA-256 is
  `da8eb9b07b2ce038ed680de657dfa5716759ccb0e25ed1ca0990822086c4b3c7`.
- This remains an internal Core-library increment, not a stage transition:
  defense, pickup/modifier, graze/nearest, and complete formation browser
  evidence are still required by the frozen Batch 2 gate.

## 2026-07-18 - Add ready defense/progression graphs and browser-check all formations

- Added a production-ready enemy defense graph with the exact
  `invulnerability -> shield -> health` route and a weaponPower-only progression
  graph with source-first pickup consume and one addressed delivery modifier.
- Added ten independently ready formation graphs and generated graph-specific,
  loader-evidence-bound browser catalogs. Desktop/mobile Edge input proves each
  formation activates three finite projectiles and stops with zero residue.
- Corrected logical projectile cleanup, host-owned stop recycling, prepared-
  effect disposal, the frozen camel-case pickup effect IDs, and a full-pool edge
  where zero activations incorrectly requested a zero-length safe-counter block.
- `pnpm check` passed 94 files / 458 tests. Isolated run
  `eed09e81-d276-4a94-8c7a-987d143be0c3` built; Edge run
  `53c7045a-4056-432c-92eb-85c95d872bdc` reached `play_checked` with verification
  SHA-256 `6f34f536e1b4ebdaed29141088674c859b5f015774fa0e5a91b630b3495ced57`.
- This is not a stage transition. Generated progression/defense and nearest
  browser evidence remain. Graze has no legal Batch 2 hostile projectile source;
  its cross-batch prerequisite is a later user decision gate, and Batch 2
  player-input authority remains unchanged.

## 2026-07-18 - Browser-close defense, progression, and nearest evidence

- Generated graph-specific catalogs for the ready defense, progression, and
  nearest-targeting Graph 1.3 slices and bound them into the preserved browser
  scene without replacing the fixed or Batch 1 paths.
- Desktop/mobile Edge proves source-first pickup consume and addressed modifier
  order, nearest empty/tie/inactive/out-of-range/stale direction with no attack-
  time actor re-read, and defense duration zero/same-time/exact-expiry through
  `invulnerability -> shield -> health`, including cleanup and restart.
- Fixed the V1.3-only port adapter to refreeze schema-parsed inbound damage;
  Manifest 1.2 remains unchanged. Added the required isolated runtime dependency
  allowlist without widening gameplay authority.
- `pnpm check` passed 99 files / 471 tests. Isolated run
  `40d959ac-9bdf-4375-b95a-334d5b79bee0` built; Edge run
  `a541c2e2-882a-49d7-8992-676dd7cd211a` reached `play_checked`, verification
  SHA-256 `6f7c109e585da3a16346bcffeb156f2511f582060290f6c1f6e5af417119ba43`.
- This is not a stage transition. The only remaining Batch 2 closure is the
  user-owned graze hostile-source dependency decision.

## 2026-07-18 - Close Batch 2 and defer hostile-source graze evidence

- Reconciled the final Batch 2 gate with the base-library catalog: enemy sources
  are Batch 3 modules, while Batch 2 active-attack authority is intentionally
  player-only. The missing hostile projectile provider was a cross-batch
  scheduling omission, not a defect in the admitted `combat.graze@1.0.0`
  factory.
- The user explicitly classified graze as non-critical and deferred its complete
  enemy-projectile integration and desktop/mobile browser evidence until the
  legal Batch 3 source exists. The Manifest 1.3 contract, reservations, factory,
  rejection tests, and ADR 0027 authority remain frozen; no player-input role was
  widened and no provider was fabricated.
- Batch 2 Core is complete on the existing passing evidence: `pnpm check` passed
  99 files / 471 tests, isolated run
  `40d959ac-9bdf-4375-b95a-334d5b79bee0` built, and Edge run
  `a541c2e2-882a-49d7-8992-676dd7cd211a` reached `play_checked`.
- Phase 7 now transitions to Batch 3 encounter/scoring/outcomes plus full legacy
  parity. The next gate is the detailed Batch 3 module/ABI design, beginning with
  legal enemy/Boss projectile sources and aggregate budget/ownership contracts.
- A documentation audit clarified that only the modular Graph 1.3 graze evidence
  is deferred. The fixed-template combo/graze desktop/mobile regression already
  passes; the Batch 3 gates will add the distinct modular graze read trace and
  ledger after admitting a legal hostile source.

## 2026-07-18 - Draft the hash-bound Batch 3 Revision 1 freeze candidate

- Added `docs/BATCH_3_MODULE_DESIGN.md` Revision 1 and proposed ADR 0028. The
  packet is SHA-256 bound and implementation remains blocked pending explicit
  user acceptance of the ADR.
- Closed the legal hostile-source design around bounded host-minted actor-root
  channels, exact root generations in a V3 source/target/delivery event pipeline,
  and new strict Manifest 1.4/Assembly 1.3/Graph 1.4 versions. Manifest 1.2/1.3,
  Graph 1.2/1.3, and all Batch 1/2 artifacts remain immutable.
- Kept every hostile delivery's physical pool/channel independent while adding
  explicit host-owned contention groups for the shared active/spawn caps. Root
  and projectile quarantine retains both local and aggregate custody.
- Detailed actor-set health/contact, source-first root deactivation, defeat/
  combo/graze/pickup scoring with one score ledger, inclusive condition modules,
  win-first coordination, and a deferred host terminal commit.
- Added a design-governance test that binds packet bytes to ADR 0028 and locks
  version isolation, frozen graze reuse, hostile lineage/custody/budgets, scoring
  ownership, and restart-safe outcomes. Batch 3 plus recovery-document governance
  passes 2 files / 8 tests.
- Final `pnpm check` passes 100 files / 475 tests, both strict TypeScript projects,
  template composition, and the root Vite build. Output remains 2,175.03 kB with
  the existing non-blocking chunk warning.
- This is not a stage transition: Batch 3 remains the active Phase 7 gate. The
  exact next step is user review/acceptance, followed by the strict contract and
  resolver red-test gate if accepted.

## 2026-07-18 - Revise the Batch 3 freeze candidate after P1 review

- Accepted all three review findings and advanced the packet to Revision 2 while
  keeping ADR 0028 proposed and implementation blocked.
- Replaced safe-integer-only score awards with bounded finite non-negative
  binary64 values. Stable event-order addition performs no rounding, flooring,
  decimal scaling, epsilon, coercion, or reassociation, so legal fractional
  `scoreBonus` values such as `7.5` retain their legacy result. Identity counters
  and capacities remain safe integers.
- Restored the exact combo continuation predicate, including
  `comboWindowMs > 0`; a zero window never chains same-millisecond defeats.
- Added the host-owned once-per-accepted-frame
  `post-provider-post-event-frame-v1` barrier. All providers and nested events
  finish before one coordinator arbitration keyed by `frameSequence`; only its
  barrier token may submit a terminal decision, so callback order cannot defeat
  win-first same-frame precedence.
- Updated ADR text, rejection/verification gates, governance assertions, roadmap,
  handoff, status, architecture, and base-library plan. ADR 0028 binds the
  formatted Revision 2 SHA-256
  `75dd92da3bde0974fcbde59ff565a5323a23fdf1a77428db8d259dcabef3d530`.
- Focused Batch 3, recovery-document governance, and legacy scoring tests pass
  3 files / 16 tests. Final `pnpm check` passes 100 files / 478 tests, both strict
  TypeScript projects, template composition, and the Vite production build;
  output remains 2,175.03 kB with the existing non-blocking chunk warning.
- This is a design correction inside the active Batch 3 stage, not a stage
  transition and not implementation authorization.

## 2026-07-18 - Accept Batch 3 Revision 2 and ADR 0028

- The user accepted the hash-bound Revision 2 design and ADR 0028 without
  changing the frozen design bytes or SHA-256.
- The active Batch 3 gate advances from design approval to strict Manifest 1.4,
  Assembly 1.3, and Graph 1.4 contract/schema plus resolver red tests, beginning
  with actor-root custody, V3 hostile-source lineage, and aggregate contention.
- Gameplay factories, hostile graze integration, and browser parity remain
  behind the ABI gate; fixed-template and Batch 1/2 evidence remain preserved.

## 2026-07-18 - Complete the Batch 3 strict schema and version-isolation gate

- Added explicit strict `GameModuleManifestV14Schema` and
  `GameAssemblySpecV13Schema` boundaries. Seven nullable/array Manifest authority
  descriptors and five Assembly selection record families reject unknown fields,
  caller-supplied actor identities, V2/V3 mixing, invalid ports, duplicate IDs,
  unknown instances, and duplicate contention membership.
- Kept the legacy generic Manifest/Assembly parsers on their existing version
  set. Graph 1.4 uses an explicit new parser, preventing a V1.4 manifest from
  widening an existing V1.0-V1.3 resolver or factory context.
- Added strict Graph 1.4 serialized types and cross-lineage rejection for
  host-minted actor-root channels, V1.4-only hostile source/target/delivery
  contexts, exact V3 payloads, unique host contention membership, and local
  delivery ceilings within group caps.
- Focused new/legacy ABI and Batch 3 governance passes 6 files / 28 tests. Final
  `pnpm check` passes 102 files / 487 tests, both strict TypeScript projects,
  template composition, and Vite build. Output remains 2,175.03 kB with the
  existing non-blocking chunk warning.
- The exact next step is pure Graph 1.4 resolution/readiness for root grants, V3
  triples, and contention groups. No gameplay factory is authorized yet.

## 2026-07-18 - Resolve Batch 3 root, V3 hostile, and contention authority

- Added a pure ADR 0028 authority resolver over strict Assembly 1.3 plus admitted
  Manifest 1.4 selections. It loads or executes no bundle and grants no runtime
  service.
- Root grants derive capacity from closed configuration, require exact producer/
  consumer ports, roles, purposes, and lifecycle binding, and fix host-minted
  lowest-slot identity plus safe-monotonic counters.
- Hostile resolution requires an exact root-linked source -> targeting ->
  delivery chain with matching configured channel IDs, V3 descriptors, one
  projectile channel claim, one host group, and local ceilings within group caps.
- Ready and blocked results are deeply frozen. Blockers are deterministically
  sorted and the complete authority plan/report basis receives canonical SHA-256
  evidence. Manifest selection order does not change the output.
- Exact/negative tests cover ready resolution, root one-over, missing lifecycle,
  channel mismatch, group one-under, and non-hostile membership. Final
  `pnpm check` passes 103 files / 491 tests plus both strict TypeScript projects,
  template composition, and Vite build; the existing chunk warning is unchanged.
- Next is pure readiness for actor-set routes, scoring capacity/singleton, and
  outcome selection/barrier evidence. Gameplay factories remain blocked.

## 2026-07-18 - Complete Batch 3 pure authority readiness

- Extended the pure resolver with one actor-set terminal health route and one
  body-contact root-deactivation lineage per resolved root. Orphan terminals,
  split producers, wrong binding purposes, unknown intermediates, forks, and
  missing root closure block readiness.
- Added `resolved-score-capacity-basis-v1`. Only Node-side wave/Boss, hostile
  projectile-generation, and pickup-schedule evidence IDs plus bounded safe
  counts may contribute. The resolver recomputes the sum and evidence hash;
  assembly/factory `duplicateCapacity` estimates, missing evidence, overflow,
  duplicate writers, and unbound transaction sources are rejected.
- Outcome readiness requires exactly one selected coordinator, distinct win/loss
  providers, exact retained-state bindings, one V1.4 commit descriptor, and the
  fixed `post-provider-post-event-frame-v1` arbitration phase.
- Graph 1.4 serialization now prevents a partial authority plan from claiming
  `ready`; blocked graphs may retain partial immutable diagnostic records.
- Focused V1.4 contract/schema/readiness passes 3 files / 17 tests. Final
  `pnpm check` passes 103 files / 495 tests, both strict TypeScript projects,
  template composition, and Vite build with only the existing chunk warning.
- Next is mixed V1.2/V1.3/V1.4 factory-context and browser-boundary conformance.
  All Batch 3 gameplay factories remain blocked.

## 2026-07-18 - Complete Batch 3 mixed-version browser context gate

- Added a distinct Manifest 1.4 factory context. Its optional semantic services
  exist only by exact resolved grant; Manifest 1.2 and 1.3 validators and key
  sets remain unchanged and reject all V1.4 authority.
- Added a frozen Graph 1.4 browser catalog that binds admitted manifest and
  factory-context versions, artifact identity, entry evidence, implementation,
  graph readiness, and catalog evidence. Any upcast or evidence drift fails.
- Added a template-closure conformance runtime that executes one unchanged real
  Manifest 1.2 keyboard artifact beside Manifest 1.3 and 1.4 probes. The isolated
  composition allowlist and its contract test now preserve this browser file.
- Failed runs `54f5d804-157d-4e26-a4f6-bd06654d72f7` and
  `d9027ea7-b75a-4b6a-94ed-fa8d17b72a5e` retain the initial isolated-build
  failures. The latter exposed the missing composition allowlist entry.
- Edge run `cfcdaf56-ebac-43a6-8ec9-009da6e30cf6` reached `play_checked` on
  desktop/mobile; verification SHA-256 is
  `14e4272508ee36406bf0a22e7f0a75e3ab20bd972559b57359d7b0458397f267`.
- Final `pnpm check` passes 106 files / 502 tests, both strict TypeScript
  projects, formatting, template composition, and production build.
- The exact next step is actor-root custody/quarantine and hostile aggregate-
  contention hosts. Gameplay factories and graze integration remain blocked.

## 2026-07-18 - Complete Batch 3 root custody and hostile contention hosts

- Added a dedicated actor-root custody host over the preserved session
  quarantine ledger. It validates closed role-specific movement data, preflights
  safe generation plus quarantine/entity capacity, mints the lowest free
  `root/<producer>/<slot>` identity, and reuses only proven-clean slots.
- Activation and deactivation use physical/logical proof. Determinate failures
  release every reservation; indeterminate results retain slot, entity, and
  quarantine tokens until bounded cleanup proves both sides inactive.
- Added a host-owned `hostile-contention-v1` admission boundary. A whole frame's
  candidates are sorted by resolver member order and request sequence, then a
  stable prefix receives separate group tokens under active-entity, active-
  projectile, and trailing-1,000-ms capacities.
- Member token authority remains distinct, so independent delivery pools cannot
  release each other's custody. Rollback removes unspawned rate evidence;
  successful recycle retains its historical rate entry; quarantine retains the
  local plus group token until cleanup succeeds.
- Seventeen focused tests cover exact/one-over, callback-order independence,
  limiting-cause evidence, rate boundaries, partial-reservation rollback,
  stale/member rejection, generation/token overflow, quarantine, and cleanup.
  Final `pnpm check` passes 108 files / 519 tests plus both strict TypeScript
  projects, formatting, template composition, and production build.
- Next is V3 routing, actor-set combat, bounded score ledger, and frame-tail
  outcome hosts. Gameplay factories and graze integration remain blocked.

## 2026-07-18 - Complete Batch 3 V3, combat, scoring, and outcome hosts

- Added all 17 strict Batch 3 runtime payload schemas without widening any V2
  schema. Root identities use a dedicated `root/<producer>/<slot>` grammar;
  V2/V3 mixing, unknown fields, illegal contact pairs, non-finite scores, and
  inconsistent health ratios fail closed.
- Added a bounded V3 lineage router. It reads an admitted active root exactly
  once, freezes that position through targeting and emission, preserves root/
  attack/projectile lineage, rejects sender/channel/payload drift, and cancels
  pending work by exact source generation.
- Added generation-keyed actor-set health with closed source health tables,
  inclusive-zero once-only defeat evidence, stale rejection, bounded pruning,
  and pre-mutation counter checks. V2 contact uses exact route heads, performs
  projectile consume or root deactivation first, quarantines uncertainty with
  zero result, and attempts every post-source delivery.
- Added the assembly-singleton bounded binary64 score ledger. Stable router
  order performs one ordinary addition, preserves legal `7.5` and normal
  floating-point results, and rejects duplicate/capacity/source-bound/total/
  counter failures before score mutation.
- Added host-owned post-provider/post-event arbitration. Conditions only refresh
  retained state with host-assigned eligible frames; same-frame win/loss is
  win-first in either callback order; the synchronous once-only commit token
  latches under the frame guard and defers cleanup/scene transition until release.
- Final `pnpm check` passes 114 files / 550 tests, both strict TypeScript
  projects, formatting, template composition, and a 2,185.14 kB Vite build with
  only the existing non-blocking chunk warning.
- Next is Graph 1.4 production instantiator/catalog grant wiring and the complete
  isolated plus preserved desktop/mobile ABI regression gate. Gameplay factories
  and hostile graze integration remain blocked.

## 2026-07-18 - Graph 1.4 production boundary partial gate

- Reconciled ROADMAP/HANDOFF/CURRENT_STATUS, ADR 0028 hash, immutable browser/
  package artifacts, unborn `master`, and documentation budgets before edits.
- Added isolated Manifest 1.4 production registration/exact lookup and the
  Node-side Graph 1.4 browser catalog generator without widening legacy manifest
  unions or Graph 1.3 lookup paths.
- Added a host-only accepted-frame begin/tail/after-guard barrier plus trusted
  instance-bound facades for actor roots/snapshots/mutation, hostile delivery,
  outcome commit, and the host-owned score ledger route.
- Implementation audit found the remaining production blocker: the coordinator
  factory has no V1.4-only callable invoked by the frame-tail host. Ordinary
  update/event callbacks would violate accepted ADR 0028, so gameplay factories
  remain blocked until that ABI and the complete instantiator are tested.
- `pnpm check` passes 116 files / 555 tests; production build passes with the
  existing chunk warning. No credential/model/corpus/Git-state action occurred.

## 2026-07-18 - Complete Graph 1.4 pre-factory ABI gate

- Added the V1.4-only coordinator frame-tail callable and completed the exact
  mixed-version production instantiator over the loader-owned V1.4 registry,
  generated browser catalog, host-only begin/tail/after-guard barrier, and
  instance-bound authority facades.
- Ready Graph 1.4 now fails closed during creation when its coordinator omits
  the declared frame-tail callable. A malicious V1.4 base context cannot smuggle
  unresolved V1.3/V1.4 optional services; only exact resolved grants survive.
- Score transactions route through the host-owned singleton ledger, and only
  its authoritative state is published. Outcome commit remains token-bound,
  win-first, once per accepted frame, and deferred until guard release plus clean
  graph/quarantine evidence.
- Final `pnpm check` passes 120 files / 572 tests, formatting, both strict
  TypeScript projects, template composition, and a 139-module Vite production
  build. Output is 2,196.54 kB / 519.38 kB gzip with only the existing
  non-blocking >500 kB chunk warning.
- Offline run `0991a68e-0cb7-4714-ad93-d26e4509e181` reached `built`; package
  SHA-256 is
  `1686aba29c50911a0a602bac2cb77858ea55ea11ab5f5c7bd8afdbad46eb5857`.
- Edge run `a747f86b-1df1-4c78-8926-42518524cc01` reached `play_checked`;
  verification SHA-256 is
  `44815bb5b5d3140140b3f129f923aa473134b769bc3d679b3cf5c43801ac7149`
  and package SHA-256 is
  `ddeb3861e74405eb4c837053199dd6c43d2da35679ec949ec458a4272a552d5a`.
  Desktop/mobile explicitly pass mixed-V1.4 production instantiation with zero
  console, page, or request errors while preserving the fixed and Batch 1/2 paths.
- The pre-factory ABI stage is complete. Batch 3 transitions to the first legal
  encounter/root-producer plus hostile source/targeting/delivery factory slice:
  scrolling waves, encounter pattern, hostile fixed targeting, and one hostile
  radial `@1.1.0` delivery. Hostile graze integration remains frozen until this
  source is loader-admitted and resolved.
- No credential read, model call, corpus expansion, dependency change, branch,
  commit, tag, push, or pull request occurred.

## 2026-07-18 - Finalize Graph 1.4 pre-factory closure evidence

- This entry supersedes only the run counts and immutable run identifiers in the
  preceding milestone; that historical entry remains unchanged. The completed
  boundary now exercises real condition providers through exact ports into
  host-retained state before the once-per-frame coordinator tail barrier.
- Score publication uses internally bound source routes and the host-owned
  singleton ledger. Creation failures dispose already-created factories; exact
  outcome provider/coordinator port closure and isolated copy/runtime closure
  are directly regression-tested.
- Final `pnpm check` passes 121 files / 581 tests, formatting, both strict
  TypeScript projects, template composition, and a 141-module Vite production
  build. Output is 2,203.67 kB / 521.40 kB gzip with only the existing
  non-blocking >500 kB chunk warning.
- Offline run `448615e2-19de-4b87-b3b8-3307a4dae25b` reached `built`; package
  SHA-256 is
  `7875387993825708cd1c795fa127b235019420e3fa0acc13af1476daaf616d27`.
- Edge run `2051d150-32f4-48d0-9db7-7f01291e17cb` reached `play_checked`;
  verification SHA-256 is
  `ab2311377b2aca2a45d4feb893b140b67a2b18fe78ae9b337ca9dcd740983546`
  and package SHA-256 is
  `97b3071ceebfce922a8a586a258062b142d2bdbadc4c1115b58dfe731f1d7022`.
  The report is `passed`; desktop and mobile contain explicit mixed-V1.4 checks
  and each records zero console, page, and request errors.
- The exact next gate remains the legal scrolling-waves, encounter-pattern,
  hostile-fixed, and hostile radial `@1.1.0` factory slice. Hostile graze
  integration remains frozen until its legal source is loader-admitted and
  resolved. No credential, model, corpus, dependency, or Git-state action
  occurred.

## 2026-07-18 - Admit the first legal hostile production slice

- Added loader-admitted Manifest 1.4 definitions for scrolling waves,
  encounter-pattern source, hostile-fixed targeting, and hostile radial
  delivery `@1.1.0`, each with strict configuration, canonical maximum-reachable
  reservations, reviewed self-contained ESM bytes, and exact artifact evidence.
- Corrected resolver-minted root/lineage identifiers to the canonical logical-ID
  grammar. Production routing now reads one active source through the host,
  freezes its position and generation across V3 targeting/emission, and never
  exposes that host-only adapter to factories.
- Actual loader-minted factories execute through the actor-root custody host,
  V3 lineage router, and hostile contention host. The proof mints
  `root/enemy-waves/0` generation 0 and admits the stable first three shots of a
  four-shot radial salvo against a group cap while preserving the delivery's
  independent enemy-projectile pool.
- Added host-owned final-projectile and empty-salvo completion so partial or
  complete contention drops cannot strand pending lineage. Graph disposal now
  explicitly disposes each delivery-owned router.
- The first offline replay exposed a missing hostile-router file in the isolated
  copy closure (`f37a9a2f-b2a2-4513-9a1f-e6d6b9006de8`, failed safely). The
  deterministic copy list and browser-closure tests now lock that dependency.
- Final `pnpm check` passes 122 files / 588 tests, both strict TypeScript
  projects, formatting, template composition, and a 142-module Vite build at
  2,209.15 kB / 522.81 kB gzip with only the existing chunk warning.
- Offline run `4b7dce25-5eba-4db1-a9ce-4ce37b85733a` reached `built`; package
  SHA-256 is
  `326728dfa130040cef321c0f1a8acf81d3bb0a86050f9bc80cb68d704bf3b7fc`.
- Edge run `b078ee6f-8f42-48d0-8f4a-fec8720b7faa` reached `play_checked`;
  verification SHA-256 is
  `10374840108368880a6d5ca9cfd05550a54582778f0879bc26cfe2fdee46b4ae`
  and package SHA-256 is
  `e3540549384d161a243ace2c9da8e9f28feb8a253ac35fe964d5543c027696f8`.
- The legal hostile-source prerequisite for graze is satisfied. ADR 0028 still
  sequences remaining encounter/source factories and scoring/outcome factories
  before binding the unchanged Batch 2 graze definition. No credential, paid
  model, corpus, dependency, or Git-state action occurred.

## 2026-07-18 - Complete encounter and hostile-source production factories

- Added loader-admitted Boss phases, hostile aimed targeting, and all seven
  remaining hostile pattern deliveries at `@1.1.0`; together with the first
  slice, the set now covers scrolling waves, Boss phases, reusable source
  triggers, fixed/aimed targeting, and all eight legacy hostile patterns.
- Closed two implementation-discovered V1.4 ABI gaps without widening an older
  context: strict request/cleared encounter handoff payloads, and a host-owned
  aimed target-point proposal that derives direction from the already frozen
  pending source position.
- Actual factories prove enemy slot generation reuse `[0,1]`, stable wave
  cleanup before a host-minted Boss generation, ordered Boss phase activation,
  exact single-snapshot aimed targeting, and all seven new geometries against
  the preserved pure planner oracle.
- Resolver evidence closes two enemy source triples and one Boss source triple
  into one host-owned contention group. All eight hostile deliveries retain
  independent enemy-projectile pools/channels; stable group admissions are
  `[3,2,0]` for the representative three-member frame.
- Final `pnpm check` passes 123 files / 597 tests, both strict TypeScript
  projects, formatting, template composition, and a 142-module Vite build at
  2,209.90 kB / 523.03 kB gzip with only the existing chunk warning.
- Offline run `d5279606-41d7-42a3-b340-71da7d4e3a76` reached `built`; package
  SHA-256 is
  `64a98d0559fc0ce004f1779a140e1001caeff273e45aad9b9c3d6eb28aab7ca1`.
- Edge run `f2223981-1158-4779-86b8-b1ea1c57c6a2` reached `play_checked`;
  verification SHA-256 is
  `66fe6c2a6aca3747efc020a246570849306c9707adfee472a5a10b84f8c657f3`
  and package SHA-256 is
  `64d1a393a5474543fd98165191a920045ae0a67c45e499d4bd370b5d420dd722`.
- ADR 0028 now advances to scoring/outcome production factories. The unchanged
  graze factory remains frozen until that set is admitted. No credential, paid
  model, corpus, dependency, or Git-state action occurred.

## 2026-07-19 - Admit scoring and outcome production factories

- Added ten loader-admitted Manifest 1.4 scoring/outcome definitions and a
  cumulative Batch 3 registry. The frozen Batch 2 graze definition was not
  copied, changed, or re-admitted.
- Actual factories prove defeat-only combo scoring and Boss-defeat retained
  condition publication followed by host-owned win-first frame-tail commit.
- `pnpm check` passes 124 files / 600 tests. Offline run
  `fa3daaa2-689a-4af0-a7ae-0f2eed511569` is `built`; Edge run
  `c69c2b21-2942-48b4-8ac7-1642d08c7a09` is `play_checked` with verification
  SHA-256 `ff4472459740ea202acb16c72658b741e74a4e20c9a57125a086e83533e31691`.
- Next: bind frozen graze once per resolved hostile channel, then actor-set
  combat/contact. No credential, model, corpus, dependency, or Git action.

## 2026-07-19 - Prove frozen Graze hostile-source grants

- Added a Graph-1.4-only registry lookup and resolver path so admitted Manifest
  1.4 modules can participate without changing legacy registry visibility or
  older resolver semantics.
- A production-registry blocked Graph 1.4 projection selects the byte-preserved
  Batch 2 `combat.graze@1.0.0` factory beside admitted scrolling waves,
  encounter-pattern, hostile-fixed targeting, and hostile radial delivery. It
  proves the unchanged V1.3 context plus exact entity-channel and V3 projectile
  lineage grants without a V1.4 authority upcast.
- Fresh focused verification passes 5 files / 27 tests. Fresh `pnpm check`
  passes template composition, formatting, both strict TypeScript projects,
  125 test files / 604 tests, and a 142-module Vite production build with only
  the existing non-blocking chunk warning.
- No new offline, Edge, or package run covers this Graze graph change. Actor-set
  health and source-first contact factories remain the exact next gate; runtime
  score routing, ready legacy assembly, and parity gates follow. No credential,
  paid model, corpus, dependency, asset, or Git-state action occurred.

## 2026-07-19 - Close actor-set and V2 contact production readiness

- Added five loader-admitted actor/contact definitions and exact V1.4 host
  services. Projectile-root detection retains the existing overlap boundary;
  actor-root body contact alone uses the new semantic candidate service.
- Corrected two ABI gaps instead of weakening ownership: V1.4 cross-owner
  actor-root channels need no invented entity role, and V1.4 V2 contact uses an
  exact detector -> default-damage -> resolution host route rather than the
  incompatible Graph 1.3 direct-mutation projection. Older schemas and locked
  Graph 1.3 evidence remain unchanged.
- The first cumulative actual-production Graph 1.4 is ready with zero blockers.
  It closes player projectile -> enemy root and enemy root -> player contact,
  actor-set health, root mutation, hostile radial contention, frozen Graze,
  scoring, and outcome authority. Every selected module has a production
  registration, loader handle, and artifact envelope.
- Fresh focused verification passes 10 files / 49 tests and both strict
  TypeScript projects. No credential, paid model, corpus, dependency, asset, or
  Git-state action occurred. Next: deterministic complete legacy Assembly 1.3.

## 2026-07-22 - Bound repository-agent context overhead

- Reduced the automatically loaded root `AGENTS.md` from 337 lines / 18,730
  bytes to 105 lines / 5,447 bytes while preserving product, recovery,
  architecture, evidence, safety, cost-approval, documentation, and Git rules.
- Changed recovery from broad documentation preloading to three bounded recovery
  documents plus task-relevant references on demand. OpenCode sessions rooted at
  the repository can now avoid carrying unrelated operational detail.
- Added strict line/byte governance plus assertions that Codex context control
  and no repeated recovery reads remain explicit.
- A repository-local Luna default was briefly tested, then removed because it
  overrode the user's model selection in the Codex UI. Model choice remains
  user-controlled; context reduction comes only from bounded instructions and
  on-demand recovery reads.
- Product phase and the deterministic legacy Assembly 1.3 next gate are unchanged.

## 2026-07-22 - Authorize and plan the Cocos Web migration

- The user explicitly authorized changing the generated-game engine from Phaser
  to Cocos while preserving the reusable Agent objective and prior work.
- Accepted ADR 0029 and moved ROADMAP from Phaser legacy-parity implementation
  to Phase 7D Cocos runtime migration. Added a gated M0-M7 migration plan.
- Classified the intended reuse boundary: preserve data contracts, deterministic
  resolution/authority, reviewed gameplay factories, asset governance, evidence,
  browser assertions, recovery, bounded repair, and package promotion; replace
  Phaser scenes and adapt engine-owned runtime/build surfaces behind the kernel.
- Cocos Creator Web/H5 is the working target. Exact version/toolchain selection
  remains gated by a separately approved no-model compatibility spike; no
  dependency, download, runtime code, asset, or evidence was changed.
- Pre-change line counts were ROADMAP 92, HANDOFF 63, CURRENT_STATUS 185. The
  exact next gate is M0 engine-dependency inventory and Cocos port mapping.
- Post-compaction line counts are ROADMAP 99, HANDOFF 55, CURRENT_STATUS 108.
  All 10 planning-related Markdown files pass targeted Prettier checking, and 2
  documentation governance files / 11 tests pass.
- A mistakenly broad Vitest invocation exposed unrelated existing module-test
  failures; no runtime repair was attempted. The repository remains an unborn
  `master` with no remote, so initial commit/push awaits remote and scope input.
- After the user authorized a complete-repository push, staged and reviewed all
  480 non-ignored files (about 9.2 MB), confirmed license records and exclusions,
  and found no staged credential-like assignment or ≥50 MiB file. Created root
  commit `442fa88`. The user then created empty public target
  `hanyk23/game-agent`; local `master` will publish to remote `main`.
