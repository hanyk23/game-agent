# Batch 003 Provisional Source Review

Status: awaiting project-owner visual approval. No Batch 003 source file is
promoted or retrieval-eligible.

## Fast shortlist

The completed quarantine inventory was reduced to 70 numbered candidates
without another network request or model call:

| Category          | Candidates |
| ----------------- | ---------: |
| player            |          6 |
| enemy             |         14 |
| boss              |          4 |
| background        |          8 |
| player-projectile |          6 |
| enemy-projectile  |          6 |
| pickup            |          6 |
| ui                |         10 |
| effect            |         10 |

The exact total is incidental; future review is not required to preserve it.
Every record retains its acquisition root, original relative path, source ID,
SHA-256, byte size, dimensions, visible dimensions, occupied pixels, and
opacity measurement in `shortlist-batch-003.json`.

## Tolerance and cautions

- Candidate 32 (`GreenBlackBG.png`) has 3,999,999 occupied pixels out of
  4,000,000 and is accepted as a usable background under the project owner's
  negligible-defect tolerance.
- Several entity and projectile candidates are original animation sheets rather
  than one-frame sprites. They remain useful source images but require a later
  runtime-frame policy; no crop or derived frame is counted here.
- The fast set intentionally favors semantic coverage over final style purity.
  The RUOK geometric candidates, large rendered pickup icons, and mixed UI packs
  may be rejected during visual review if they clash with the intended
  pixel/retro kit.
- Two Reactorcore muzzle frames were selected from one large effect family.
  They do not authorize promotion of the remaining family variants.
- Batch 002's 56 rejected files were not reused.

## Evidence

- `review-contact-sheet-batch-003.png`: numbered category contact sheet.
- `shortlist-batch-003.json`: immutable technical shortlist metadata.
- `.runtime/asset-batch-003/*/png-inventory.json`: ignored full inventories.
- `docs/ASSET_BATCH_003_ACQUISITION_REPORT.md`: acquisition and transport
  summary.

## Approval gate

The project owner may approve the complete provisional set, reject it, or name
specific candidate numbers to replace. Only approved candidates may be copied
into the permanent corpus and cataloged as reviewed assets.
