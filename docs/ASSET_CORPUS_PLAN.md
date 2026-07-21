# Asset Corpus Plan

Status: confirmed planning baseline on 2026-07-15; exact Batch 003 source pages
and download caps must be proposed before acquisition.

## Planning principle

The corpus is organized as complete visual-theme kits, not as isolated source
packs. Every complete kit must support an entire vertical bullet-hell game with
coherent player characters, ordinary enemies, Bosses, backgrounds, both
projectile sides, pickups, UI, and effects.

A source pack is only an input. Its file count never determines category
quotas, and one pack cannot be split into inaccurate roles merely to raise the
total.

## Current evidence and target

- Batch 001: 35 reviewed and retrieval-eligible third-party images.
- Batch 002: 56 preserved but rejected images. They remain in the catalog and
  corpus as failed acquisition evidence and do not count toward eligibility.
- Final planned eligible corpus: 355 unique third-party source images, within
  the required approximate 300-500 range.
- Project-owned or generated images remain supplemental and do not satisfy this
  third-party acquisition target.

The 355-image target consists of five complete 70-image kits plus five existing
Batch 001 pixel-art supplemental records.

## Per-kit category quota

| Category          | Per kit | Five kits | Intended coverage                                        |
| ----------------- | ------: | --------: | -------------------------------------------------------- |
| player            |       6 |        30 | At least three silhouettes or character archetypes       |
| enemy             |      14 |        70 | At least seven ordinary-enemy silhouettes                |
| boss              |       4 |        20 | Four clearly distinct large/prominent threats            |
| background        |       8 |        40 | At least four scene compositions, maximum two variants   |
| player-projectile |       6 |        30 | Readable friendly shots with distinct shapes/functions   |
| enemy-projectile  |       6 |        30 | Readable hostile bullets distinct from friendly shots    |
| pickup            |       6 |        30 | Six gameplay meanings, not color-only variants           |
| ui                |      10 |        50 | Ten roles such as HUD, button, panel, bar, frame, cursor |
| effect            |      10 |        50 | Explosion, impact, shield, heal, charge, trail, warning  |
| **Total**         |  **70** |   **350** | One complete game-ready visual kit                       |

With the five existing supplemental Batch 001 pixel records, the final target
by category is player 31, enemy 71, Boss 21, background 41, player projectile
30, enemy projectile 30, pickup 31, UI 50, and effect 50: 355 eligible source
images in total.

## Planned visual-theme kits

| Kit | Theme/style                   | Current eligible | Planned additions | Examples beyond small spacecraft                         |
| --- | ----------------------------- | ---------------: | ----------------: | -------------------------------------------------------- |
| A   | clean/vector science fiction  |               30 |                40 | drones, stations, asteroids, planets, holographic UI     |
| B   | pixel/retro science fiction   |                0 |                70 | distinct ships, robots, aliens, turrets, large Bosses    |
| C   | fantasy/magic/creature        |                0 |                70 | witches, familiars, monsters, dragons, spells, ruins     |
| D   | sky/sea/steampunk or military |                0 |                70 | aircraft, airships, ships, submarines, forts, clouds     |
| E   | neon/cyber/abstract           |                0 |                70 | avatars, viruses, machines, geometric enemies, gridspace |

The five already approved OpenGameArt pixel records from Batch 001 remain
eligible supplemental material but do not fill a complete-kit quota.

## Source-diversity gates

Every new 70-image kit must satisfy all of these gates:

1. Use at least four independent source packs, at least three source pages, and
   at least two authors or publishing organizations.
2. Select at most 17 images from one pack and at most 28 from one author. A
   single archive therefore cannot dominate the kit.
3. Use at most two palette/state/size variants of one base silhouette or scene.
4. Treat an original sprite sheet as one source image. Crops, frames, recolors,
   resizes, and other derivatives do not increase the source-image count.
5. Prefer sources that cover a category deeply and accurately; never relabel a
   projectile, ship component, exhaust tile, or transparent scene layer as a
   different role to meet a quota.

## Technical and visual gates

- Player/enemy candidates: source canvas at least 32×32 and non-transparent
  visual bounding box at least 24×24.
- Boss candidates: source canvas at least 64×64, visual bounding box at least
  48×48, and occupied-pixel area at least twice the kit's median ordinary enemy.
- Projectiles: visual bounding box at least 8×8 and clear friendly/hostile
  readability at runtime scale.
- Pickups/UI: visual bounding box at least 16×16; each record must have a
  distinct gameplay or interface role.
- Effects: standalone source canvas at least 32×32 unless an original complete
  animation sheet is intentionally recorded as one image.
- Backgrounds: visually full-frame image at least 512×512 or 360×640.
  Negligible isolated alpha defects may pass with measured evidence; materially
  transparent composition layers cannot be standalone backgrounds. Seamless
  square images require a runtime presentation preview.
- All files: supported format, safe paths, immutable SHA-256, unique source
  hash, source/author/license evidence, and explicit commercial-use,
  modification, and redistribution rights.

## Contact-sheet and approval gates

The Batch 002 sheet made native 16×16/32×32 art look like tiny marks and obscured
quality differences. Future review evidence must include:

1. A category-grouped sheet with pixel art enlarged by integer nearest-neighbor
   scaling so every silhouette is readable.
2. Native dimensions and visual-bounding-box dimensions beside every item.
3. A second runtime-scale mockup showing relative player, enemy, Boss,
   projectile, pickup, and background sizes together.
4. Separate category totals and base-silhouette family labels, making variant
   concentration visible.
5. Project-owner approval or rejection by number before any candidate becomes
   retrieval-eligible.

## Replacement Batch 003

Batch 003 will build Kit B, a complete pixel/retro science-fiction kit, instead
of repairing or promoting Batch 002.

Exact target: 70 selected unique PNG source images using the per-kit quota above.
Discovery should shortlist approximately 100-110 technically plausible files so
quality rejection does not force category misclassification. Batch 003 must use
at least four packs and cannot reuse any rejected Batch 002 file as a selected
candidate.

### Batch 003 semantic allocation

The category totals are further divided by meaning so different labels cannot
hide the same visual family:

- Player 6: two agile fighters, two heavy/mechanical characters, and two
  alien/organic or otherwise non-conventional craft silhouettes.
- Enemy 14: four light ships/drones, four robots or alien creatures, three
  hazards such as asteroids/mines, and three turrets/satellites/station units.
- Boss 4: one mothership, one station/fortress, one biomechanical alien, and one
  giant robot or mech. No palette swaps.
- Background 8: two starfields, two nebula/planet scenes, two constructed or
  terrain scenes, and two vertically scrollable or seamless scenes.
- Player projectile 6: two lasers, two plasma/energy shots, one missile, and one
  beam or charged shot.
- Enemy projectile 6: two orb bullets, two spread/star bullets, one mine or
  missile, and one beam. Their palette and silhouettes must remain visibly
  distinct from the player set.
- Pickup 6: health, shield, weapon upgrade, bomb/screen clear, energy, and score
  reward.
- UI 10: primary button, restart/end button, HUD panel, player-health bar,
  Boss-health bar, score frame, icon slot, cursor/focus, touch control, and
  warning/badge.
- Effect 10: small explosion, large explosion, hit spark, muzzle flash, shield,
  heal, power-up, engine trail, charge/beam, and warp/warning effect.

Before downloading, the Batch 003 proposal must list the exact source pages,
authors, licenses, expected request count, archive/direct-file count, download
bytes, expanded-workspace bytes, permanent-corpus bytes, estimated review time,
and hard stops. No model call is required.

## Acquisition order after Batch 003

1. Complete Kit B: pixel/retro science fiction — 70 images.
2. Complete Kit A gaps: clean/vector science fiction — 40 images.
3. Acquire Kit C: fantasy/magic/creature — 70 images.
4. Acquire Kit D: sky/sea/steampunk or military — 70 images.
5. Acquire Kit E: neon/cyber/abstract — 70 images.

After every approved kit, run corpus/count/retrieval gates plus one complete
desktop/mobile browser, visual, and package-hash regression for that style.
