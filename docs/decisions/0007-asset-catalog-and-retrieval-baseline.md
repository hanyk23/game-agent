# ADR 0007: Deterministic asset catalog and retrieval baseline

- Status: Accepted on 2026-07-15; all 35 Batch 001 contact-sheet candidates were
  subsequently approved by the project owner
- Date: 2026-07-15

## Context

The source requirement calls for roughly 300-500 categorized game images with
descriptions, tags, and non-random retrieval. The project needs a small reviewed
baseline before bulk collection, and the architecture requires license and
metadata filters to run before semantic or stylistic ranking.

## Decision

- Store strict versioned image records with immutable source hashes, safe
  source/derived paths, provenance, author, license, attribution, permission
  booleans, category, descriptions, tags, theme, style, palette, dimensions,
  format, review evidence, and derived-transform metadata.
- Reject duplicate source hashes and count one unique eligible source file once;
  never count derived variants as additional corpus images.
- Default to `CC0-1.0` and `CC-BY-4.0` as the narrow allowlist. Require explicit
  human review plus commercial-use, modification, and redistribution rights.
- Treat unknown or unapproved terms as manual-review and explicitly incompatible
  terms as rejected. License decisions are hard filters and cannot be overridden
  by semantic score.
- Rank remaining category-compatible records using deterministic keyword/style/
  palette scoring and break ties by `assetId`. Do not add embeddings until this
  labeled baseline is measured.
- Report eligible source counts separately for third-party, project-owned, and
  generated origins. Generated and project-owned sources remain supplemental
  and do not satisfy the PDF's crawled-image count.

## Consequences

- Retrieval behavior is testable without downloading images or invoking a
  model.
- Rights uncertainty fails closed and remains visible as a decision reason.
- The narrow allowlist may exclude usable sources and require later policy
  revision.
- Source-hash counting is conservative and prevents variants or duplicate URLs
  from inflating corpus size.
- Acquisition can proceed only within a restated source/count/disk/time envelope.
  Acquired records remain quarantined until project-owner review evidence exists.

## Evidence

- `src/assets/asset-catalog.ts`
- `src/assets/asset-license-policy.ts`
- `src/assets/asset-counting.ts`
- `src/assets/asset-retrieval.ts`
- `tests/assets/`
- `tests/fixtures/asset-retrieval-fixtures.ts`
- `docs/ASSET_POLICY_PROPOSAL.md`
- `docs/ASSET_BATCH_001.md`
- `assets/corpus/catalog.json`
