# Batch 003 Acquisition Report

Status: source acquisition stopped on 2026-07-15 with a large quarantined
candidate pool. The project owner explicitly made a one- or two-image quota
shortfall non-blocking in favor of continuing development quickly. Nothing in
this report promotes an image into the reviewed corpus.

## Outcome

- Batch 002's 56 rejected files were not reused.
- The main partial acquisition retained 31 files totaling 5,310,222 bytes.
- The gap acquisition completed 23 more files totaling 11,124,256 bytes.
- A final direct-background probe retained one 318,439-byte PNG. Its only
  defect is one transparent pixel among 4,000,000 pixels, which the project
  owner accepted as negligible for runtime use.
- Total retained Batch 003 response files: 55 files and 16,752,917 asset bytes.
- Safe archive expansion produced 12,564,739 bytes across the two archive
  workspaces, below the 150 MB hard stop.
- PNG inventory contains 1,002 valid records and 1,001 unique SHA-256 values.
  One duplicate group is two identical Mega Bot shooting states.
- No Batch 003 PNG hash overlaps the permanent Batch 001/002 catalog.
- Fifteen macOS AppleDouble pseudo-PNG entries were rejected as invalid files.
- No paid model or paid service was used.

## Category evidence

- Boss: a complete 1770x986 Mega Mecha image, a 224x256 STG Boss body,
  multiple large RUOK geometric Bosses, spaceship/alien Boss archives, and a
  station image are present.
- Projectile/effect: separated phobi and Luca bullets, RUOK circle/player
  bullets, STG Boss shot/laser, missile/beam sources, Reactorcore muzzle PNGs,
  and explosion, energy, shield, and rocket files are present for screening.
- UI/pickup/entity: the partial acquisition provides large independent candidate
  pools, but sheets and palette/state variants must not inflate counts.
- Background: eleven files pass the original exact-opacity gate. Six are from
  one phoenix1291 pack, so the maximum-two-family rule leaves seven exact
  independent selections. The 2000x2000 `GreenBlackBG.png` has 3,999,999
  opaque pixels and one transparent pixel; under the project-owner-approved
  practical tolerance it is the eighth usable independent background.

## Transport evidence

- The Wisedawn and Reactorcore plasma archives remain transport-excluded after
  bounded timeouts.
- A 41-GET gap process appeared stalled but later completed as a detached child;
  its complete request log and manifest are retained.
- A later curl amendment was stopped during page preflight after the completed
  manifest was discovered; it wrote no duplicate asset files.
- Future network work should verify whether OpenGameArt attachment traffic uses
  the intended proxy before requesting files.

## Fast continuation decision

The fixed 70-image matrix remains a long-term planning target, not a current
development blocker. Small count deviations and negligible technical defects
such as one transparent pixel in a 4,000,000-pixel background are recorded but
do not fail review. Final promotion still requires provenance, rights, unique
hashes, technical metadata, readable contact sheets, and project-owner
approval; corrupt, unsafe, visibly broken, or runtime-incompatible files remain
blocking.

## Evidence locations

- `.runtime/asset-batch-003/acquisition/`
- `.runtime/asset-batch-003/gap-acquisition/`
- `.runtime/asset-batch-003/background-gap-acquisition/`
- `docs/ASSET_BATCH_003_PROPOSAL.md`
- `docs/ASSET_BATCH_003_SOURCE_RESEARCH.md`

## Exact next step

Review the completed 70-candidate provisional contact sheet. Approve the set,
reject it, or name specific candidate numbers to replace; do not promote any
Batch 003 file before that decision.
