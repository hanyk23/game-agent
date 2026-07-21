# ADR 0008: Deterministic asset selection and materialization

- Status: Accepted
- Date: 2026-07-15

## Context

ADR 0007 established a reviewed image catalog, license hard filters, unique
source counting, and deterministic ranking. A generated run still needed a
bounded way to turn `ShooterGameSpec.assetQueries` into immutable evidence and
copy only selected files into its isolated build workspace. The existing
recorded ink-painting Spec is intentionally unsupported by the first space-
shooter corpus, so integration must fail closed without breaking legacy
no-asset evaluation paths.

## Decision

- Add a strict versioned `asset-selection.json` artifact in stable Spec query
  order.
- Verify the complete fixed corpus against hashes, PNG metadata, safe paths, and
  the 150 MB cap before planning any selection.
- Require every selected candidate to pass license/review/category/technical
  filters and to have positive theme and visual-style matches. Category-only,
  palette-only, and deterministic zero-score fallbacks are not acceptable.
- Bind each selection to the complete catalog SHA-256, asset ID, source file
  SHA-256 and metadata, author/source/license/attribution, ranking breakdown,
  and fixed materialization/runtime paths.
- Copy only unique selected assets into
  `game-template/vertical-shooter/public/assets/catalog/` inside the isolated
  workspace. Never copy a query-controlled path or the whole corpus.
- Record the selection artifact hash in run manifest v1.2.0. Continue parsing
  v1.1.0 manifests that predate asset selection.
- Keep asset selection explicit through `enableAssetSelection` until the Phaser
  runtime consumes the data-only selection map. Existing offline and recorded
  ink-painting evaluations can therefore continue without silently substituting
  incompatible space assets.

## Consequences

- Unsupported themes/styles stop before a run directory is created.
- A changed catalog or source file invalidates planning before materialization.
- Vite copies only selected reviewed files into the package, with bytes
  identical to their source hashes.
- Multiple queries may select one asset, but the workspace receives one fixed
  materialized copy for that asset ID.
- The current slice does not change Phaser scenes or preload selected textures;
  that remains the next stage.

## Evidence

- `src/assets/asset-selection-plan.ts`
- `src/assets/asset-corpus-verification.ts`
- `src/orchestration/run-composition-stage.ts`
- `src/runs/run-manifest.ts`
- `tests/assets/asset-selection-plan.test.ts`
- `tests/runs/run-composition-stage.test.ts`
- Real isolated run `226096b4-e5b5-4be7-94e7-bc32e519b192`
