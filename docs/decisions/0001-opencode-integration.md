# ADR 0001: OpenCode integration boundary

- Status: Accepted
- Date: 2026-07-15

## Context

The system needs durable pipeline state, structured specification generation, permission-bounded code edits, event logs, cancellation, browser verification, and bounded repairs. OpenCode v1.18.1 documents an official JS/TS SDK and server, structured JSON output, sessions/events, permissions, plugins, Skills, and custom tools.

OpenGame demonstrates useful game-generation ideas but is based on a different agent runtime lineage and is broader than this project's first phase.

## Decision

Use a project-owned TypeScript orchestrator as the durable control plane. Integrate OpenCode through the pinned `@opencode-ai/sdk` and supported server APIs. Add project-local Skills/custom tools/plugins only where they improve the agent interface or policy. Do not fork OpenCode core and do not copy OpenGame.

The user confirmed this proposal on 2026-07-15.

## Consequences

- Pipeline behavior can be tested without invoking an LLM.
- OpenCode can be replaced or upgraded behind an adapter.
- More adapter and compatibility-test code is required.
- The project must pin a verified OpenCode version and fail clearly on capability mismatch.
- A future core fork requires a new ADR, a documented unsupported requirement, a failed proof-of-concept using supported interfaces, and explicit user approval.

## Evidence

- https://opencode.ai/docs/sdk
- https://opencode.ai/docs/server
- https://opencode.ai/docs/permissions
- https://opencode.ai/docs/plugins
- https://opencode.ai/docs/custom-tools
- https://opencode.ai/docs/skills
- https://github.com/anomalyco/opencode/releases/tag/v1.18.1
