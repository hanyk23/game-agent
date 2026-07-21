# Asset Batch 002 Proposal

Status: acquired and rejected as a complete batch on 2026-07-15 after
project-owner contact-sheet review. All files are preserved as failed evidence.

## Purpose

Batch 001 proved the complete catalog-to-runtime path with 35 approved images,
but its coverage is narrow:

- all 35 records use the `space` theme;
- category counts are player 4, enemy 7, Boss 4, background 1, player projectile
  4, enemy projectile 4, pickup 3, UI 4, and effect 4;
- 26 records are tagged vector while only five are pixel-art/retro;
- the single background is the largest runtime and retrieval coverage gap.

Batch 002 should add one coherent pixel/retro vertical-shooter family rather
than inflate the count with arbitrary variants. It should also add backgrounds
that can pass the existing 540×960 desktop/mobile visual gate.

## Proposed bounded envelope

- Target selected source images: 60 unique PNG files
- Acceptable final range: 54-60 after technical, rights, duplicate, and visual
  rejection
- Resulting eligible third-party corpus if all pass: 89-95 unique source images
- New source pages: five official asset pages
- Network acquisition: three archive downloads and five serialized direct PNG
  downloads; no listing crawl or bulk site enumeration
- Expected download size: 10-40 MB
- Download hard stop: 75 MB before completing all planned sources
- Expected expanded acquisition workspace: less than 80 MB
- Expanded-workspace hard stop: 150 MB
- Expected additional permanent corpus size: less than 5 MB
- Additional permanent-corpus hard stop: 15 MB; the existing 150 MB complete
  corpus verifier cap remains unchanged
- Estimated work: 6-10 hours for rechecking terms, bounded download, hashing,
  archive inspection, selection, metadata, contact sheet, review, tests, and one
  end-to-end browser/visual/package-hash regression
- Model calls: none
- Paid services: none

Any hard-stop breach ends acquisition before further download or catalog
promotion and requires a revised proposal.

## Planned category allocation

| Category          | Target |   Hard minimum | Intended source                         |
| ----------------- | -----: | -------------: | --------------------------------------- |
| player            |      6 |              4 | Kenney Pixel Shmup                      |
| enemy             |     12 |              8 | Kenney Pixel Shmup                      |
| boss              |      4 |              2 | Kenney Pixel Shmup, visually large only |
| background        |      8 |              6 | Three OpenGameArt background pages      |
| player-projectile |      6 |              4 | Kenney Pixel Shmup                      |
| enemy-projectile  |      6 |              4 | Kenney Pixel Shmup                      |
| pickup            |      4 |              3 | Kenney Pixel Shmup                      |
| ui                |      8 |              6 | Kenney Pixel UI Pack                    |
| effect            |      6 |              4 | Kenney Pixel Shmup                      |
| **Total**         | **60** | **54 overall** |                                         |

The overall accepted count must remain at least 54 even if every category hard
minimum is met. Up to six rejected or unavailable targets may be reallocated
within the same coherent pixel family after visual review, but not by inventing
an inaccurate category or copying a derived variant.

## Candidate sources and current rights evidence

Source and license pages were checked on 2026-07-15. The exact download URL,
archive/file byte size, SHA-256, included license file, and original archive
entry will be recorded only after approval and acquisition.

### Kenney: Pixel Shmup

- Source: https://kenney.nl/assets/pixel-shmup
- Official page evidence: 2D, 16×16 tile size, 128 files, Creative Commons CC0
- Proposed maximum selection: 44 PNG source files
- Intended roles: player, enemy, Boss, both projectile categories, pickup, and
  effect
- Stop condition: if the archive does not contain at least the hard-minimum
  semantically valid roles, do not use unrelated sprites merely to hit the count

### Kenney: Pixel UI Pack

- Source: https://kenney.nl/assets/pixel-ui-pack
- Official page evidence: 2D pixel panel/button pack, 750 files, Creative
  Commons CC0
- Proposed selection: eight semantically distinct UI PNG source files
- Variant rule: do not count hover/pressed/disabled states, nine-slice pieces,
  recolors, or size variants as separate semantic coverage merely to raise the
  count

### OpenGameArt: Mars Background Pixel Art

- Source: https://opengameart.org/content/mars-background-pixel-art
- Author: Quantiset
- Page license: CC0
- Page evidence: four 1280×720 PNG layers totaling approximately 113.9 KB
- Proposed selection: four files, subject to separate full-frame visual review;
  transparent foreground-only layers cannot be mislabeled as opaque backgrounds

### OpenGameArt: Seamless Space Backgrounds

- Source: https://opengameart.org/content/seamless-space-backgrounds
- Author: Screaming Brain Studios
- Page license: CC0
- Page evidence: 32 seamless PNG backgrounds in 512×512 and 1024×1024 groups;
  the smaller archive is reported as 7.9 MB
- Proposed selection: three visually distinct 512×512 PNG files
- Variant rule: do not select the same design at both resolutions; verify that
  the current full-canvas presentation does not create unacceptable distortion

### OpenGameArt: Pixel Art 2D Space Themed Background

- Source:
  https://opengameart.org/content/pixel-art-2d-space-themed-background
- Author: Cayden Franklin
- Page license: CC-BY-4.0
- Page evidence: one direct PNG reported as approximately 40.8 KB
- Proposed selection: one file
- Attribution requirement: preserve author, page URL, CC-BY-4.0 link, and any
  modification notice without implying endorsement

Kenney's official support page states that game assets on its asset pages are
CC0, usable in commercial projects, and do not require attribution. The project
will still preserve Kenney as optional provenance. CC0 permits copying,
modification, and distribution, including commercial use, but does not grant
trademark rights or allow implied endorsement.

## Technical and quality gates

Every candidate must pass all existing catalog and corpus gates plus the
following Batch 002 checks:

1. PNG only; no SVG, PSD, XCF, BMP, preview image, or generated derivative may
   enter the counted source set.
2. Recompute SHA-256, byte size, dimensions, and actual transparency from the
   downloaded file; reject duplicate source hashes across both batches.
3. Preserve archive SHA-256, included license, official source page, author,
   original entry name, and exact direct-file URL.
4. Do not count sprite-sheet crops or transformed files as new source images.
5. Limit near-identical palette/state/size variants to at most four files per
   semantic family; prefer different silhouettes and gameplay roles.
6. A Boss candidate must be visually distinct and larger/more prominent than
   ordinary enemies; otherwise it remains an enemy or is rejected.
7. A background must be non-transparent at its base layer and remain visually
   usable at the current 540×960 presentation. If stretch/crop behavior is not
   acceptable, stop background promotion and propose a separate cover/tile-mode
   runtime change rather than weakening the visual gate.
8. UI records must represent distinct roles such as button, panel, health bar,
   score frame, icon frame, slider, cursor, or badge—not animation/state slices.
9. Retrieval labels must include at least one complete pixel/retro test case in
   which player, enemy, Boss, projectiles, pickup, and background all receive
   positive theme and visual-style scores.
10. All candidates remain `pending`/quarantined until a numbered contact sheet
    is generated and the project owner approves or rejects each item.

## Network and acquisition conduct

- Recheck every source page, included license, direct download target, and
  OpenGameArt `robots.txt` immediately before acquisition.
- Retain the Batch 001 OpenGameArt safety rule unless the current policy is more
  restrictive: serialize direct requests with at least ten seconds between
  request starts.
- Use only the two official Kenney archive links and the bounded OpenGameArt
  archive/direct files named above; do not crawl search results or collections.
- Stop on redirects to an unexpected host, login requirement, changed license,
  missing author evidence, ambiguous preview/file ownership, or checksum/path
  inconsistency.
- Downloads and extraction occur only in the ignored project-local acquisition
  workspace. No other workspace is modified.

## Approval and execution sequence

1. Project owner approves or revises this envelope.
2. Reverify source pages, license links, robots policy, and download metadata.
3. State the exact request count and final byte caps before downloading.
4. Download serially into the ignored acquisition workspace and record hashes.
5. Inspect archive inventories and included licenses; select only valid PNGs.
6. Build quarantined catalog/acquisition records and a numbered contact sheet.
7. Run corpus, duplicate, rights, metadata, and retrieval checks.
8. Obtain project-owner item-level approval before making records eligible.
9. Run `pnpm check` and one catalog-enabled real Vite/browser/visual/package-hash
   regression using a complete pixel/retro Spec.
10. Update the stable catalog evidence, status, progress log, and handoff while
    preserving all failed runs.

## Approval requested

Approval of this proposal authorizes only the bounded no-model acquisition and
review workflow above. It does not authorize a paid model call, a larger batch,
new license classes, Git state changes, or promotion without contact-sheet
review.

## Acquisition result

The project owner approved the bounded acquisition in conversation on
2026-07-15 and asked not to be interrupted again before all candidate images
were prepared. The fixed 14-GET plan completed without an unexpected redirect:

- downloaded asset bytes: 8,296,597, below the 75 MB hard stop;
- expanded archive bytes: 8,156,881, below the 150 MB hard stop;
- selected candidates: 56 unique PNG source files totaling 1,488,228 bytes;
- category counts: player 6, enemy 12, Boss 4, background 6, player projectile
  6, enemy projectile 6, pickup 4, UI 6, and effect 6;
- all 56 records were initially quarantined; the project owner subsequently
  rejected the complete batch, so the eligible third-party count remains 35;
- four Mars composition layers and the Cayden composition were technically
  rejected because they are not opaque full-canvas backgrounds;
- six opaque files from the already approved Seamless Space Backgrounds archive
  filled the background hard minimum and passed a 540×960 presentation preview;
- no model or paid service was used.

The exact download/page/archive hashes, original entries, rejection reasons,
and selected-file metadata are in
`assets/corpus/evidence/acquisition-manifest-batch-002.json`. The project owner
rejected the complete sheet because it was dominated by small, visually similar
spacecraft and requested a category-first replacement plan. No Batch 002 record
will be promoted or reused as a Batch 003 selection.
