# ADR 0012: Deterministic final H5 packaging

- Status: Accepted
- Date: 2026-07-15

## Context

Browser verification could advance an isolated run to `play_checked`, but the
build directory was still an internal artifact. There was no final promotion
boundary that revalidated the complete evidence chain, excluded development
instrumentation, or assembled deployment instructions and third-party notices
into one immutable delivery.

## Decision

- Accept only runs in `play_checked`; packaging is not a substitute for any
  schema, build, runtime, play, or browser gate.
- Recompute the hashes of the Spec, plan, workspace, runtime configuration,
  build log, production package, browser-verification directory, and optional
  asset-selection artifact before copying bytes.
- Parse browser evidence semantically and require exactly one passing desktop
  case and one passing mobile case under Chromium, with no findings and zero
  console, page, or failed-request errors.
- Recompute each selected package asset hash directly against its immutable
  selected source hash even when the enclosing package hash is internally
  consistent.
- Reject symbolic links, non-regular files, empty packages, unsafe paths, the
  DEV test bridge marker, model credential/configuration markers, and the local
  credential filename marker.
- Assemble the delivery in a temporary directory, then rename it into place.
  Write the final run manifest atomically and remove the new delivery if that
  manifest write fails.
- Deliver only the static game, `RUN.md`, the project dependency notices, a
  per-selected-asset attribution/license manifest, and a deterministic package
  inventory with byte sizes and SHA-256 hashes.
- Record the delivery manifest and complete delivery-directory hashes in run
  manifest v1.3.0, then transition `play_checked -> packaged`. Continue parsing
  v1.1.0 and v1.2.0 runs so verified older runs can be packaged.

## Consequences

- `packaged` is an evidence-backed terminal delivery state rather than an alias
  for a successful Vite build.
- The source corpus, OpenCode runtime, Agent code, credentials, development
  bridge, screenshots, and repair workspaces do not enter the delivery.
- A directory is the canonical first delivery form. ZIP creation, signing, and
  publication remain separate future operations and require their own explicit
  integrity and authorization boundaries.
- Re-running packaging against the same run fails instead of overwriting a
  reviewed delivery.

## Evidence

- `src/orchestration/run-packaging-stage.ts`
- `src/runs/run-manifest.ts`
- `scripts/package-verified-run.ts`
- `tests/runs/run-packaging-stage.test.ts`
- Packaged run `6cd534b8-33f2-43e6-bdbc-cdc236c29fee`
