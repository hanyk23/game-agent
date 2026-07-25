# Batch 003 Source Research

Status: research and network acquisition stopped on 2026-07-15. The completed
quarantine evidence and the project owner's fast-continuation decision are in
`docs/ASSET_BATCH_003_ACQUISITION_REPORT.md`; request, byte, disk, and transport
history remains in `docs/ASSET_BATCH_003_PROPOSAL.md`.

## Purpose

Find multiple current, license-compatible sources capable of filling the exact
70-image semantic matrix in `docs/ASSET_CORPUS_PLAN.md`. A page is not an
approved source until its direct files/archive inventory proves that selected
images are standalone, runtime-usable source files rather than crops from a
sheet.

## Resumption boundary

- The project owner first paused automated acquisition to search independently,
  then explicitly asked the assistant to resume because suitable materials were
  not found.
- Independently supplied candidates must still pass the existing provenance,
  `CC0-1.0`/`CC-BY-4.0`, author, immutable-hash, unique-source, category,
  dimensions, visible-bounds, theme-coherence, and contact-sheet approval gates.
- Batch 002's 56 rejected files remain ineligible and cannot be resubmitted as
  Batch 003 selections.
- Acquisition is authorized only within `docs/ASSET_BATCH_003_PROPOSAL.md`; no
  model call, license expansion, Git state change, or automatic promotion is
  implied.

## Promising current sources

### Entity candidates

- 200+ CC0 Spaceship Sprites
  - Page: https://opengameart.org/node/95248
  - Author: Wisedawn
  - Page license: CC0
  - Page evidence: 211 ships in four styles; 25.3 MB archive
  - Limit: at most 17 selections, at most two related silhouettes, and not more
    than four ordinary light ships
  - Transport decision: excluded from Batch 003 after its 25.3 MB archive timed
    out before any asset file was written; it will not be retried
- Multiple Alien Enemies and Soldier Character
  - Page:
    https://opengameart.org/content/multiple-alien-enemies-and-soldier-character
  - Author: Gusmando
  - Page license: CC0
  - Page evidence: 59 KB archive containing original alien/soldier animations
  - Intended roles: non-spacecraft enemies and possibly one player/mech family
  - Preflight need: confirm standalone files and top-down readability
- Pixel Robot
  - Page: https://opengameart.org/content/pixel-robot
  - Author: David Harrington
  - Page license: CC0
  - Page evidence: 33 KB archive with an animated robot
  - Limit: at most two non-state source records
- Alien Enemies 32x32
  - Page: https://opengameart.org/content/alien-enemies-32x32
  - Author: Gendgi
  - Page license: CC0
  - Page evidence: 32×32 alien enemies
  - Conditional: the page exposes one sheet; it is usable only if an archive or
    separate original files exist. Crops will not count.

### Background candidates

- Pixel-Art Backgrounds
  - Page: https://opengameart.org/content/pixel-art-backgrounds-0
  - Author: stealthix
  - Page license: CC0
  - Page evidence: nine separately exported backgrounds in a 90 KB archive
  - Intended maximum: eight, subject to opacity and 540×960 presentation gates
- Space Ship Shooter Pixel Art Assets
  - Page: https://opengameart.org/node/34210
  - Author: ansimuz
  - Page license: CC0
  - Page evidence: loopable background, clouds, ships, explosion, projectiles,
    and power-ups in a 263 KB archive
  - Conditional: page wording emphasizes sprite sheets; only original
    standalone entries can be selected, and transparent cloud layers cannot be
    standalone backgrounds

### UI candidates

- Simple HUD GUI construction kit in 8 colors
  - Page:
    https://opengameart.org/content/simple-hud-gui-constraction-kit-in-8-colors
  - Author: Rawdanitsu
  - Page license: CC0
  - Page evidence: 1.3 MB construction-kit archive
  - Intended maximum: ten distinct UI roles; colors, states, and construction
    fragments do not count as separate roles
- Sci-fi User Interface
  - Page: https://opengameart.org/content/sci-fi-user-interface
  - Authors: Buch and vk
  - Page license: CC0
  - Conditional: current page exposes a single sheet, so it can provide at most
    one original source record unless separate original files are available

### Projectile/effect candidates

- Bullet Collection 2 (M484 Games)
  - Page: https://opengameart.org/content/bullet-collection-2-m484-games
  - Author: Master484
  - Page license: CC0
  - Conditional: current page exposes a single sheet. It can count as only one
    source image and is not directly suitable for the runtime without explicit
    sheet support.
- Bullet Collection Different Colors
  - Page:
    https://opengameart.org/content/bullet-collection-different-colors
  - Author: Luca Pixel
  - Page license: CC0
  - Page evidence: 2.3 KB archive
  - Intended maximum: four, only if the archive has distinct standalone shapes;
    color-only variants are capped at two

## Sources currently excluded

- Kenney Pixel Shmup: already preserved in rejected Batch 002; too small and
  visually concentrated for reuse.
- Retro spaceships and Pixel Explosion (12 Frames): current pages use CC-BY 3.0,
  outside ADR 0007's `CC0-1.0`/`CC-BY-4.0` allowlist.
- Shmup Ships and Boss Ships: current pages use CC-BY-SA 3.0, outside the
  allowlist.
- Space War Man: the page mixes OGA-BY 3.0 and CC0 lineage, requiring a policy
  and attribution review beyond Batch 003.
- Sheet-only sources: individual crops cannot count as new source images and
  cannot silently enter the current fixed runtime.
- Wisedawn's 25.3 MB archive: license-compatible but transport-excluded after a
  bounded timeout; four smaller independent ship sources replaced it.
- Reactorcore's plasma/electric archive: license-compatible but
  transport-excluded after the partial acquisition timed out at logical GET 62.

## Research gap closed before proposal

The initial pages covered backgrounds and potential entities but did not prove
the exact 70-image standalone-file quota. Research added fixed CC0 pages for:

- a spaceship Boss set, a station, an alien Boss set, and an independent CC0
  pixel-mecha pack;
- two complementary pickup packs plus a space-shooter backup pack;
- individual-image projectile/effect packs, a rocket sheet, charge and shield
  sheets, and small bullet archives;
- two Reactorcore packs that explicitly include individual transparent PNGs as
  well as sheets;
- four UI sources, including direct original cursor/icon/dialogue PNGs;
- an asteroid/debris pack, an independent drone, and independent turret pages
  so ordinary-enemy quotas do not collapse back into small similar ships.

The initial exact 29-page, 70-logical-GET proposal stopped after 31 asset files.
Inspection found 927 valid unique PNGs but no eligible full-frame background,
no proven complete giant-mech Boss from the Shiv archive, and insufficient
standalone projectile coverage. The 17-page, 41-logical-GET increment ultimately
completed as a detached process and retained 23 files. A later 19-page curl
amendment was stopped during page preflight after that completion was
discovered; it wrote no duplicate asset files. Archive inspection remains necessary: page descriptions cannot
prove PNG dimensions, visual bounds, originality, or runtime usability. Any
unresolved semantic cell after inspection is a hard stop, not permission to
relabel components or create count-inflating crops.
