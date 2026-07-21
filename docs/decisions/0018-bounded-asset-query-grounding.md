# ADR 0018: Versioned bounded asset-query grounding

- Status: Accepted
- Date: 2026-07-16

## Context

The first live natural-language Spec passed provider JSON extraction and the
unchanged local `ShooterGameSpec 1.0.0` validator, then failed before run
creation because Chinese open vocabulary in `assetQueries` did not match the
reviewed catalog's finite English theme and visual-style vocabulary. Eligible
assets existed, and weakening the positive-match gate or hand-editing the Spec
would have hidden the actual boundary.

## Decision

- Insert a deterministic `asset-query-grounding.json` artifact between Spec
  validation and asset selection. Version 1.0.0 binds the canonical serialized
  Spec SHA-256 and exact catalog-file SHA-256.
- Permit a derived selection view to change only `assetQueries.theme`,
  `assetQueries.visualStyle`, and `assetQueries.tags`. Preserve every query ID,
  category, preferred color, transparency requirement, non-asset field, and the
  original Spec used by the Composer.
- Resolve every input term through catalog identity or a finite versioned rule.
  Record source/target field, source term, target terms, rule ID, disposition,
  and rationale. Unknown terms and explicitly ambiguous terms fail with exact
  query/field/term evidence.
- Validate every target against vocabulary derived from the catalog bound by the
  artifact. Use fixed category-aware compatibility terms only where the current
  reviewed corpus lacks a pixel-style semantic role, without lowering the
  requirement for positive theme and visual-style evidence.
- Rank deterministically as before, but select the first stably ranked candidate
  that passes both positive-match gates. A higher total-score candidate with a
  zero theme or style score may not hide a later eligible candidate.
- Version 1.1.2 extends the bounded rules for the second live Spec: explicit
  mappings override same-named terms contributed by rejected catalog records,
  and category-compatible pixel-style rules use reviewed role styles where an
  eligible pixel role does not exist. Older artifacts remain tied to their
  original version/policy pair.
- Hash the optional grounding artifact in run manifests, browser resumption,
  packaging evidence, and final package source-artifact evidence. Preserve every
  offline replay and pipeline attempt under a new UUID path.

## Consequences

- The preserved orange-meteor Spec now grounds and selects all nine queries
  offline without a model call, corpus change, Phaser change, or gameplay-field
  edit.
- Mapping behavior is intentionally narrow. A new word requires an explicit
  reviewed rule or fails closed; the boundary is not a translation service or
  embedding search.
- The first post-grounding full pipeline advanced to the existing Composer
  reachability gate and exposed a separate schedule conflict: waves end at the
  same 30,000 ms instant as the time-expired loss condition, leaving no Boss
  encounter. Resolving that requires a new user decision because the current
  objective forbids gameplay-field changes.
- The simplified v2 probe proved the extended rules with distinct fighter,
  meteor, aiming-fighter, shield, and firepower selections. Its next failure was
  outside grounding: the Spec omitted the catalog background query. The Spec
  remains unchanged and future live extraction now checks fixed catalog-role
  coverage before reporting success.

## Evidence

- `src/assets/asset-query-grounding.ts`
- `src/assets/asset-selection-plan.ts`
- `tests/assets/asset-query-grounding.test.ts`
- Offline replay `4ad5b4bb-4b44-4448-aad1-e27e148ef5d4`
- Post-grounding pipeline attempt `73a974d7-98c8-4848-9960-d6d94896608a`
- V2 semantic replay `45ad2b04-4f44-4f0f-b07f-061b7da08dc2`
- V2 missing-background pipeline attempt
  `6f3c2ef7-8b7a-43cd-919f-ece4cefe79e0`
