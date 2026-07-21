# ADR 0009: Data-only runtime asset resolution and rendering

- Status: Accepted
- Date: 2026-07-15

## Context

ADR 0008 selected reviewed catalog records and copied their immutable bytes into
an isolated Vite workspace, but `RuntimeGameConfig` did not identify those files
and Phaser still generated geometric textures. The browser package needed a
strict, non-executable bridge from selection evidence to runtime texture use.

## Decision

- Add a discriminated `resolvedAssets` map to `RuntimeGameConfig`.
- Keep pre-catalog evaluations explicit as `legacy-geometric`; only that mode may
  generate the original circle textures.
- In catalog mode, resolve every Spec asset query in stable order to an asset ID,
  deterministic texture key, fixed runtime URL, source SHA-256, and dimensions.
- Bind the first background and enemy-projectile queries as explicit runtime
  roles; entity-owned player, boss, weapon, wave, and pickup query references
  remain authoritative for their textures.
- Validate the catalog map again inside the fixed browser template without
  bundling Zod or the Composer. Reject unknown fields, unsafe IDs/URLs, missing or
  reordered queries, category mismatches, conflicting duplicate definitions, and
  invalid hashes or dimensions.
- Preload unique selected textures in `BootScene`; render the background and use
  query-bound textures for every runtime entity category.
- Recompute every selected package-file hash after the real Vite build and before
  recording `built` state.
- Extend only the DEV/test bridge with deeply frozen loaded/used texture evidence;
  keep the production bundle free of the bridge.

## Consequences

- Catalog-enabled runs fail closed if selection evidence, runtime mapping,
  materialized bytes, package bytes, or browser use diverge.
- Existing incompatible recorded Specs continue to build only through an
  explicit geometric legacy mode; catalog mode has no silent fallback.
- Browser regression can prove both preload and actual use of all seven current
  runtime categories on desktop and mobile Chromium profiles.
- UI and effect images remain cataloged but are not yet runtime-bound because the
  current Phaser scenes do not have image-backed UI/effect modules.

## Evidence

- `src/runtime/runtime-game-config.ts`
- `src/runtime/shooter-game-composer.ts`
- `game-template/vertical-shooter/src/runtime-assets.ts`
- `game-template/vertical-shooter/src/scenes/boot-scene.ts`
- `game-template/vertical-shooter/src/scenes/play-scene.ts`
- `src/orchestration/run-composition-stage.ts`
- `src/verification/browser-verification-stage.ts`
- `tests/runtime/runtime-assets.test.ts`
- `tests/runs/run-composition-stage.test.ts`
- Browser run `2e82d80e-1286-4a9f-8eab-62c72cd4b9bf`
