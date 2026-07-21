# ADR 0006: Finding-bound deterministic runtime repair

- Status: Accepted
- Date: 2026-07-15

## Context

The run manifest already counted repair rounds, but browser verification sent
every failure directly to the terminal `failed` state. There was no
machine-readable finding contract, target-file policy, diff budget, immutable
pre-repair evidence, or full failure-to-regression evaluation.

## Decision

- Keep terminal failure as the default browser-verification behavior. Only an
  explicit `repairable` invocation may preserve `built` or `runtime_checked`
  state after writing a failed verification artifact.
- Represent repair input as a strict, fingerprinted machine-readable finding
  bound to one hashed verification report.
- Allow repairs only in the isolated run workspace and only for source files in
  the fixed composition allowlist. Test files, the test bridge, dependencies,
  permissions, and files outside the workspace are not repair targets.
- Accept exact-match text replacements rather than commands or arbitrary patch
  scripts. Enforce file, operation, changed-line, patch-byte, source-hash, and
  maximum-round limits before modifying files.
- Preserve the original package, failed verification, selected finding, and
  pre-repair target files. Write rebuilt packages, ledgers, and regression
  evidence under `repairs/round-N/`.
- Stop before requesting another patch when the same finding fingerprint repeats
  or no repair round remains.
- A repair executor is an injected capability boundary. The deterministic
  evaluation uses no model; any future model-backed executor requires a separate
  approved purpose and cost envelope.

## Consequences

- Repair decisions are traceable to immutable runtime evidence and cannot widen
  their own filesystem or command authority.
- A successful repair returns the run to `built`, after which the failed browser
  gate and all desktop/mobile regressions run normally.
- Full-file rewrites and broad refactors are intentionally unsupported by the
  first controller; such changes require a separately reviewed workflow.
- The controlled evaluation proves orchestration behavior, not the general
  ability of a model to diagnose arbitrary gameplay defects.

## Evidence

- `evals/reports/bounded-runtime-repair.json`
- Controlled run `c04c55ff-d618-43b9-90b2-5ba1149ca7d8`
