# ADR 0002: Pin Phaser 3.90.0 for the MVP template

- Status: Accepted
- Date: 2026-07-15

## Context

Phaser 4 is the current major line, but it was released recently relative to project startup. Phaser 3.90.0 has stable versioned documentation and a longer history of examples and integrations. The first milestone values template reliability and browser-test repeatability more than immediate adoption of the latest major API.

## Decision

Pin Phaser 3.90.0 when the Phase 2 game template is initialized. The generated specification may not select or change the engine version. Re-evaluate Phaser 4 only through a separate compatibility spike and ADR after the MVP template is stable.

## Consequences

- The MVP uses the mature Phaser 3 API and documentation.
- A later Phaser 4 migration is explicit work rather than an incidental dependency update.
- New Phaser 4-only capabilities are unavailable during the MVP.

## Evidence

- https://github.com/phaserjs/phaser
- https://docs.phaser.io/api-documentation/3.90.0
