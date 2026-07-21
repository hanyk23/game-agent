# ADR 0003: Narrow direct provider adapter for requirement extraction

- Status: Accepted
- Date: 2026-07-15

## Context

OpenCode remains the selected external code-agent runtime. Its structured-output
compatibility path can return provider assistant text when DeepSeek does not
populate OpenCode's native structured field. An explicit model-visible schema
improved a representative response from an invented top-level structure to the
exact `ShooterGameSpec` structure, but two numeric bounds still failed local
validation.

## Decision

Move DeepSeek requirement extraction behind a narrow project-owned adapter that:

- calls only DeepSeek's fixed official chat-completions endpoint;
- uses provider-native JSON Object output with the full model-visible schema;
- disables streaming and tools, sets a fixed timeout, and performs no automatic
  retry;
- parses JSON and then applies the unchanged local `ShooterGameSpec` Zod schema;
- never reads or logs credentials itself; callers provide the key in process
  memory.

Keep OpenCode as the supported code-agent capability for bounded generated-code
work. Do not fork or patch OpenCode core.

## Consequences

- Requirement extraction no longer depends on OpenCode's provider-specific
  structured-output fallback.
- The adapter adds a small provider-specific HTTP boundary and must track the
  allowed DeepSeek API contract.
- Provider JSON mode guarantees valid JSON, not semantic schema compliance, so
  local validation remains mandatory and failures remain closed.
- Any live retry still requires an explicitly stated bounded call and cost
  estimate.

## Evidence

- https://api-docs.deepseek.com/guides/json_mode
- `evals/reports/deepseek-live-spec.json`
