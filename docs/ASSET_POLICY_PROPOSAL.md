# Asset Policy Proposal

Status: confirmed by the user on 2026-07-15. The project owner subsequently
approved all 35 Batch 001 contact-sheet candidates.

## Implemented baseline

The local deterministic baseline now validates catalog records, separates source
and derived files, records provenance and rights, hard-filters eligibility, and
ranks eligible candidates by category, theme, visual style, tags, and palette.
No image corpus has been downloaded and all retrieval fixtures are synthetic.

The executable default policy is versioned as `phase-2-baseline` in
`src/assets/asset-license-policy.ts`. It is deliberately narrower than the set
of licenses that might be legally usable. The user confirmed this narrow policy
and the conservative counting interpretation on 2026-07-15.

## Confirmed default allowlist

- `CC0-1.0`
- `CC-BY-4.0`

An allowlisted identifier is not enough by itself. A record is retrieval-eligible
only when it is human-reviewed and its recorded terms permit commercial use,
modification, and redistribution. Attribution text remains mandatory even for
CC0 so provenance is never lost.

## Confirmed hard rejection rules

Reject an asset from retrieval when any of the following is true:

- the record is explicitly rejected;
- the license is explicitly noncommercial, no-derivatives, share-alike, or
  copyleft under the narrow baseline;
- commercial use, modification, or redistribution is denied;
- source provenance, author, license identity, attribution, immutable source
  hash, or required review evidence is missing;
- the file or metadata fails the strict catalog schema.

The initial explicit rejection list contains `CC-BY-NC-4.0`, `CC-BY-ND-4.0`,
`CC-BY-NC-ND-4.0`, `CC-BY-SA-4.0`, `GPL-2.0-only`, and `GPL-3.0-only`.
This is a packaging-risk policy, not a claim that every listed license is
universally unusable.

## Manual-review cases

The following do not enter retrieval automatically:

- an otherwise valid record still in quarantine;
- any license identifier not on either the allowlist or explicit rejection
  list;
- public-domain statements without a stable CC0 or equivalent rights record;
- image files offered under software licenses such as MIT or Apache-2.0;
- custom terms, generated assets, or project-owned originals until their
  redistribution terms and counting treatment are approved.

## Confirmed image-counting interpretation

One countable image is one unique, rights-reviewed, retrieval-eligible source
image identified by its lowercase SHA-256 content hash.

- Identical bytes found at multiple URLs count once.
- Thumbnails, crops, resized files, format conversions, palette variants,
  extracted frames, and other derived files do not increase the source-image
  count.
- A sprite sheet counts as one source image; extracted sprites are derived
  files.
- Rejected and quarantined records do not count.
- Third-party, project-owned, and generated sources are reported separately.
- Until the user resolves the PDF ambiguity, generated and project-owned images
  must not be claimed as satisfying the `300-500 crawled images` requirement.

The executable count summary reports eligible totals by origin plus manual-review,
rejected, and excluded-derived-file counts. The catalog rejects duplicate source
hashes so metadata aliases cannot inflate the result.

## First reviewed batch envelope

The user authorized acquisition after confirming the decisions below. The
restated first-batch envelope was:

- 20-40 unique source images across player, enemy, boss, background,
  projectiles, pickup, UI, and effect categories;
- only source pages whose per-asset license and attribution can be preserved;
- an initial disk cap of 150 MB for originals, derived files, metadata, and
  review evidence;
- approximately 3-6 hours for source verification, collection, hashing,
  metadata entry, technical checks, and human rights review;
- necessity: prove the full provenance-to-retrieval-to-package workflow before
  spending time and disk on the required 300-500-image corpus.

Immediately before collection, candidate source pages and their current terms
must be verified and the exact source list, expected count, disk estimate, and
time estimate must be restated. Site crawling rules and request-rate limits must
also be respected.

## Confirmed decisions

1. The narrow default allowlist is `CC0-1.0` and `CC-BY-4.0`.
2. One unique eligible source SHA-256 counts once; derived variants do not add
   to the count.
3. Project-owned and generated images remain separately reported supplemental
   totals and are not claimed toward the PDF's 300-500 crawled-image target.

## First batch state

Batch 001 contains 35 third-party PNG source files: 30 from three Kenney CC0
packs and five from the OpenGameArt `Pixel space invaders` CC-BY 4.0 page. The
selected corpus is below 1 MB including metadata, contact sheet, and preserved
license evidence. Hash, byte-size, dimensions, transparency, provenance, and
rights metadata verify locally. The project owner approved all 35 contact-sheet
candidates; all records are `reviewed` and the eligible third-party source count
is 35.

See `docs/ASSET_BATCH_001.md` and `assets/corpus/` for the bounded source list,
evidence, catalog, and immutable files.
