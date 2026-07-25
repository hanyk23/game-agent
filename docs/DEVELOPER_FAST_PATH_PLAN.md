# Developer Fast-Path Plan — layered safety checks

Updated: 2026-07-25
Status: Planning only; no source or gate script changed in this round
Owner: deterministic Orchestrator (final authority)

## Problem

The current unified gate is a single monolithic command:

```
pnpm check = template:compose && format:check && typecheck && test && vite build
```

Plus separate `pnpm browser:verify` and `pnpm package:verified`. Running the full
gate (template composition + both TypeScript projects + 125 test files / 604
tests + a 142-module Vite build, then Playwright) on every inner-loop edit is
slow and discourages small iterations.

The goal is to **split verification into layered tiers so day-to-day iteration is
fast, without removing or weakening any safety.** The strongest tier stays
exactly as strict as today's full gate plus browser and package promotion.

## Design principle: three tiers, monotonically strengthening

Each tier is a strict superset of the guarantees below it. Nothing that passes a
higher tier can fail a lower one. Promotion to a package requires the release
tier — it can never be skipped.

| Tier          | When it runs                                          | What it guarantees                                                                                                                                                      | What it deliberately skips                            |
| ------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **fast**      | inner dev loop, per-edit, per-agent-iteration         | types + lint + fast unit/contract tests on changed scope; schema still fully validated                                                                                  | full build, browser/Playwright, packaging             |
| **admission** | before a candidate module/spec is accepted into a run | fast tier + loader/registry admission, license/provenance admission, budget/resource checks, module ABI/version compat                                                  | full production Vite build, browser render, packaging |
| **release**   | before any verified package is promoted               | admission tier + full `pnpm check` (template compose, format, both TS projects, complete test suite, production build) + browser verification + package boundary checks | nothing — this is the fail-closed gate                |

Key rule: **the release tier equals today's guarantees byte-for-byte.** The fast
and admission tiers are additions that let developers/agents get quick feedback;
they are never a substitute for release when promoting.

## Tier contents (mapped to existing code)

### fast tier

- `tsc --noEmit` (root project) — types.
- `prettier --check` on changed files — format.
- `vitest run` scoped to affected areas (e.g. `tests/requirements`,
  `tests/gameplay`, `tests/modules` subsets) — pure logic + schema tests.
- Schema validation is **fully** exercised even here: `ShooterGameSpecSchema`
  (`src/requirements/shooter-game-spec.ts`) and module contracts
  (`src/modules/game-module-contract.ts`) are strict; the fast tier does not
  relax them.
- Deliberately NOT run: `template:compose`, `vite build`, browser verification,
  packaging.

### admission tier

Adds the checks that decide whether a candidate is allowed into a run, without a
full build/render:

- Loader/registry admission: `src/modules/game-module-registry.ts`,
  `src/modules/game-module-executable-loader.ts` (rejects imports, ambient
  authority, dynamic eval, unexpected exports, byte drift, top-level statements).
- License/provenance admission: `src/assets/asset-license-policy.ts`,
  `src/assets/asset-catalog.ts`, `src/assets/asset-corpus-verification.ts`.
- Budget/resource admission: `src/runtime/resource-budget.ts`,
  `src/modules/game-module-lease-ledger.ts`,
  `src/modules/game-module-projectile-delivery-admission-host.ts`.
- Module ABI/version compatibility: `src/modules/game-module-contract.ts`,
  `src/modules/game-module-resolver-v14.ts`.
- OpenCode sandbox posture (deny-by-default) remains in force for any Code Agent
  candidate: `scripts/opencode-compat.ts`.

### release tier

Equals the current full gate, unchanged and fail-closed:

- `pnpm check` (`template:compose` → `format:check` → `typecheck` (both TS
  projects) → `test` (full suite) → `vite build`).
- `pnpm browser:verify` — Playwright/chromium verification
  (`src/verification/browser-verification-stage.ts`,
  `scripts/verify-browser-gates.ts`).
- Package boundary: `src/orchestration/run-packaging-stage.ts` (symlink/marker
  rejection, artifact hash match), driven by `scripts/package-verified-run.ts`.
- Orientation: release verification must pass for **both** vertical and
  horizontal target viewports once orientation is parameterized; a build that
  only passes one orientation is not release-complete.

## What must NOT change

- No schema is loosened to let the fast tier pass. Strict spec/module/manifest
  schemas apply at every tier.
- No existing test is deleted or weakened. The fast tier runs a **subset for
  speed**, but the full suite still runs at release; the subset is a filter, not
  a replacement.
- Admission gates (loader, license, budget) are never bypassed on the path to a
  package. They may be run earlier (admission tier) but never skipped.
- Browser and package promotion stay fail-closed. Repair may not relax any tier.

## Proposed script surface (later rounds — not created this round)

To be added as package.json scripts without altering existing ones:

- `pnpm check:fast` — types + changed-file format + scoped vitest.
- `pnpm check:admission` — fast + admission-focused test selection.
- `pnpm check` (unchanged) and `pnpm browser:verify` / `pnpm package:verified`
  (unchanged) form the release tier.

The existing `check`, `browser:verify`, `package:verified`, `typecheck`, `test`,
and `format:check` scripts are preserved as-is. New tiers are additive.

## Acceptance criteria for this workstream

- Running `check:fast` gives sub-full-build feedback and never reports a failure
  that the release tier would not also catch (monotonic).
- Running the release tier reproduces today's guarantees exactly: same test
  count, same build, same browser + package gates.
- No promotion path (offline run, repair loop, package) can reach a package
  without the release tier passing.
- Adding the tiers changes no existing schema, test, or gate strength.

## Open questions / TODOs (do not act without a round)

- FP-TODO-1: Define the exact "affected scope" selection for `check:fast`
  (path-based vs. changed-file graph). Keep it conservative — over-run rather
  than under-run.
- FP-TODO-2: Decide whether the admission tier gets its own aggregate script or
  is composed from existing focused test files.
- FP-TODO-3: Wire the tiers into the multi-agent loop (ADR 0030) so the Code
  Agent iterates on fast/admission and only the Orchestrator triggers release.
