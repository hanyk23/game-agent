# ADR 0011: Data-only UI and effect asset roles

- Status: Accepted
- Date: 2026-07-15

## Context

ADR 0009 made seven gameplay asset categories available to the fixed Phaser
template. `ui` and `effect` records could be selected, materialized, and loaded,
but the runtime map had no role identifiers for them and the scenes had no
evidence-backed rendering path.

## Decision

- Add optional `uiQueryId` and `effectQueryId` fields to catalog-mode runtime
  asset maps. They are present and required exactly when the Spec contains the
  corresponding category.
- Preserve parsing of older catalog maps that have no UI/effect queries. Do not
  add geometric UI/effect fallbacks to catalog mode.
- Bind the first UI query to a fixed HUD-panel role and the first effect query
  to a fixed pickup-feedback role. Selection order and category must still match
  the complete Spec query list.
- Render the HUD asset behind text and gameplay objects. Render the effect as a
  bounded transient tween at the player after pickup collection.
- Extend the browser fixture from seven to nine selected textures and require
  every unique selected texture to be both loaded and used on desktop and mobile.

## Consequences

- Every catalog category now has a fixed runtime consumption path.
- Specs without UI/effect queries remain compatible with the previous seven-role
  catalog map.
- One UI panel and one pickup effect are the current stable roles; richer
  buttons, bars, cursors, explosions, and effect semantics require future typed
  role mappings rather than implicit relabeling.

## Evidence

- `src/runtime/runtime-game-config.ts`
- `src/runtime/shooter-game-composer.ts`
- `game-template/vertical-shooter/src/runtime-assets.ts`
- `game-template/vertical-shooter/src/scenes/play-scene.ts`
- `src/verification/browser-gate-spec.ts`
- `src/verification/browser-verification-stage.ts`
- `tests/runtime/runtime-assets.test.ts`
- Browser run `6cd534b8-33f2-43e6-bdbc-cdc236c29fee`
