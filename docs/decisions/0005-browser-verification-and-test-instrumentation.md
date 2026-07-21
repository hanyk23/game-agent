# ADR 0005: Hash-gated browser verification and read-only instrumentation

- Status: Accepted; repair-entry behavior amended by ADR 0006
- Date: 2026-07-15

## Context

The generated production package must be verified on desktop and mobile browser
profiles without exposing a mutation surface or shipping test-only code. Browser
verification must also resume from durable run artifacts rather than trusting a
path or state held only in process memory.

## Decision

- Browser verification accepts only a persisted `built` manifest and rehashes
  the Spec, plan, workspace, runtime configuration, build log, and production
  package before launching a browser.
- Build a separate instrumented production bundle under the run's
  `verification/` directory with `VITE_SHOOTER_TEST_BRIDGE=1`. The deliverable
  `package/` remains a normal production build and must not contain the bridge
  marker.
- Keep the browser bridge read-only. It returns frozen lifecycle and runtime
  snapshots and provides no setters, commands, clock control, collision
  injection, or requirement relaxation.
- Run desktop Chromium at 1280×720 and mobile Chromium emulation at 390×844 with
  touch enabled. Record bounded checks, error counts, screenshots, and a
  directory hash before advancing the manifest.
- On the current Windows development machine, use the installed Microsoft Edge
  channel as the Chromium executable. A Playwright-managed Chromium remains the
  intended clean-worker strategy once a reliable pinned download path is
  available.
- A failed gate writes bounded diagnostic metadata and advances to the terminal
  `failed` state by default; ADR 0006 defines the only explicit repairable-mode
  exception. Neither mode deletes or rewrites the production package.

## Consequences

- Production H5 output remains free of test instrumentation while verification
  can inspect lifecycle, inputs, entity counts, Boss phases, and resource caps.
- Browser results are tied to validated immutable inputs by hashes and manifest
  transitions.
- The local gate depends on an installed Edge version and is not yet a fully
  hermetic CI browser environment.
- Runtime defects found by the gate must be fixed in stable template mechanics
  or rejected by validation; tests may not mutate state to manufacture a pass.
