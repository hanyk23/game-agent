# ADR 0010: Theme-kit-first asset corpus planning

- Status: Accepted
- Date: 2026-07-15

## Context

Batch 002 selected 56 technically valid files but derived 44 of them from one
small Pixel Shmup archive. Category quotas were met mechanically while the
contact sheet remained visually dominated by small, similar spacecraft. The
project owner rejected the batch and requested a planned type/count structure.

The final requirement calls for approximately 300-500 relevant images. A large
global count is not useful unless each supported game style has complete,
coherent coverage of every runtime role.

## Decision

- Plan the corpus as five complete visual-theme kits instead of source-pack
  batches.
- Give every kit an exact 70-image category allocation: player 6, enemy 14,
  Boss 4, background 8, both projectile categories 6 each, pickup 6, UI 10, and
  effect 10.
- Target 350 complete-kit images plus five existing supplemental records, for
  355 eligible third-party source images.
- Require at least four packs and two authors or publishers per new kit; allow
  at most 17 selected images from one pack and two variants of one base visual
  family.
- Enforce category-specific canvas, visible-bounds, prominence, opacity, and
  semantic-role gates before contact-sheet review.
- Show pixel art at readable integer nearest-neighbor scale and add a separate
  relative runtime-scale mockup.
- Preserve rejected acquisitions and records as evidence but exclude them from
  eligibility and future kit quotas.
- Treat the 70-image allocation as a planning target rather than an exact
  development blocker. Record small count deviations and negligible pixel-level
  defects, but block only defects that visibly or technically impair runtime
  use. This 2026-07-15 clarification admits a 2000x2000 background with one
  transparent pixel as usable.

## Consequences

- Acquisition proposals start from missing category cells and source-diversity
  limits rather than archive file counts.
- Each approved kit can independently generate a coherent game without mixing
  unrelated themes or depending on one source pack.
- More candidates must be screened than ultimately selected, increasing review
  effort while reducing misclassification and near-duplicate inflation.
- Batch 003 replaces Batch 002 with a complete 70-image pixel/retro
  science-fiction kit.

## Evidence

- `docs/ASSET_CORPUS_PLAN.md`
- `docs/ASSET_BATCH_002_PROPOSAL.md`
- `assets/corpus/evidence/review-contact-sheet-batch-002.png`
- `assets/corpus/evidence/acquisition-manifest-batch-002.json`
- `tests/assets/asset-corpus-verification.test.ts`
