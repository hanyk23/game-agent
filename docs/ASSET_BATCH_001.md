# Asset Batch 001

Status: acquired, technically verified, and approved by the project owner on
2026-07-15. All 35 source records are retrieval-eligible.

## Purpose and bounded envelope

This first real batch proves the provenance, rights, immutable-file, technical
metadata, counting, and deterministic retrieval path before expansion to the
required 300-500 crawled images.

- Selected source images: 35 unique PNG files
- Planned range: 20-40 images
- Categories: player 4, enemy 7, boss 4, background 1, player projectile 4,
  enemy projectile 4, pickup 3, UI 4, effect 4
- Permanent corpus size: less than 1 MB, including catalog and review evidence
- Acquisition workspace: three ZIP archives plus five PNG files, approximately
  16.9 MB downloaded and approximately 17.6 MB expanded
- Hard cap: 150 MB for originals, derived files, metadata, and review evidence
- Estimated work: 3-6 hours for source checks, collection, hashing, metadata,
  rights review, technical verification, and retrieval regression
- Model calls: none

## Verified sources and current terms

Source and license pages were checked on 2026-07-15.

### Kenney: Space Shooter Remastered

- Source page: https://kenney.nl/assets/space-shooter-remastered
- Page license: Creative Commons CC0
- Included license: CC0; personal and commercial use permitted; credit optional
- Archive bytes: 1,108,777
- Archive SHA-256:
  `0edbe0ab5cda6c44901d8c42f150268fdfa0c8d48492098669f37e9c296929b5`
- Selected files: 22

### Kenney: Particle Pack

- Source page: https://kenney.nl/assets/particle-pack
- Page license: Creative Commons CC0
- Included license: CC0; personal and commercial use permitted; filter-template
  contributors are retained in the preserved license evidence
- Archive bytes: 15,001,764
- Archive SHA-256:
  `b631d4b07f7002549fdcf155f01141ad482f79f3440e4e301eed49ce5f1d8958`
- Selected files: 4

### Kenney: UI Pack - Sci-Fi

- Source page: https://kenney.nl/assets/ui-pack-sci-fi
- Page license: Creative Commons CC0
- Included license: CC0; personal, educational, and commercial use permitted;
  credit optional
- Archive bytes: 768,505
- Archive SHA-256:
  `4ae5a4949b71ba6c08bfb4d4708b3880915782f7deae7bc5872e1d56f0a668af`
- Selected files: 4

Kenney's support page also states that game assets on its asset pages are CC0,
can be used commercially, and do not require attribution. The project still
preserves Kenney attribution for provenance. Kenney returned 404 for its root
`robots.txt`; this batch therefore used only the three public official download
links and did not enumerate or crawl asset listings.

### OpenGameArt: Pixel space invaders

- Source page: https://opengameart.org/content/pixel-space-invaders
- Author: jlunesc
- Page license: CC-BY 4.0
- Selected direct PNG files: player ship, asteroid, boss, starfield, and medal
- Required attribution: credit the author, link the license, and indicate
  changes without implying endorsement
- OpenGameArt `robots.txt`: `Crawl-delay: 10`; the five direct file requests
  were serialized with at least ten seconds between request starts

The OpenGameArt page says the sprites are the author's own pixel artwork and
permits use and modification. Only the downloadable files were collected;
preview images were excluded because the OpenGameArt FAQ warns that previews
may not share the submission license.

## Rights decision

- Kenney records use `CC0-1.0` and preserve optional attribution.
- OpenGameArt records use `CC-BY-4.0` and preserve the exact author/page/license
  chain plus the requirement to indicate modifications.
- All selected records state commercial use, modification, and redistribution
  permission.
- No unknown, noncommercial, no-derivatives, share-alike, GPL, custom-license,
  project-owned, or generated images are present.
- The project owner reviewed the contact sheet and replied `继续` without
  identifying any rejected asset numbers. All 35 records are `reviewed` with
  dated project-owner approval evidence.

## Technical and counting evidence

- `assets/corpus/catalog.json` contains strict records for all 35 source files.
- `assets/corpus/evidence/acquisition-manifest.json` binds source URLs, archive
  hashes, original entry names, stored paths, and source hashes.
- `assets/corpus/evidence/licenses/` preserves the three included Kenney license
  files.
- `assets/corpus/evidence/review-contact-sheet.png` is approved review evidence
  only and is never counted as a corpus source image.
- `verifyAssetCorpus` recomputes every source SHA-256, byte size, PNG dimensions,
  actual transparency, and total corpus disk use.
- Duplicate source hashes remain invalid, derived files remain excluded, and
  the approved records produce an eligible third-party source count of 35.

## Project-owner approval evidence

The project owner approved all 35 contact-sheet candidates after reviewing the
two intentionally separate style groups:

1. Kenney clean/vector sci-fi assets, including separate raster particle VFX.
2. OpenGameArt retro pixel assets with mandatory CC-BY 4.0 attribution.

Only review status/evidence changed during promotion. Immutable-file,
retrieval/count, and unified gates were rerun; exactly 35 third-party source
images became eligible without altering hashes or weakening a gate.
