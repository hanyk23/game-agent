# ADR 0019: Versioned bounded Spec completion

- Status: Accepted
- Date: 2026-07-16

## Context

The second natural-language probe produced a valid `ShooterGameSpec` whose nine
asset queries grounded and selected successfully, but catalog composition
requires a background role. The user clarified that omitted creative details
are Agent-owned choices rather than automatic errors. Silently editing the
recorded Spec or weakening catalog gates would lose provenance.

## Decision

- Preserve the extracted Spec as `source-spec.json` and derive a separate
  effective `spec.json` through `SpecCompletionPolicy 1.0.0`.
- Limit the first policy to missing background and enemy-projectile asset-query
  roles. Never overwrite an existing query or any gameplay field.
- Record every addition in `spec-completion.json` with the policy/rule ID,
  field, full derived value, and human-readable reason.
- Bind the source Spec, effective Spec, and completion artifact with SHA-256.
  Deterministically re-execute the policy during browser resumption and final
  packaging instead of trusting the recorded decision.
- Feed only the effective Spec into the unchanged grounding, positive-match
  selection, composition, and runtime boundaries. Preserve legacy runs without
  completion artifacts.
- Extend run manifests to 1.4.0 while retaining parsers for 1.1.0-1.3.0.

## Consequences

- The saved v2 Spec gains one recorded pixel-space background query without a
  model call, source-Spec edit, corpus change, Phaser change, or gate relaxation.
- Completion is an allowlist, not a general repair system. Unknown roles,
  explicit conflicts, security constraints, and unsupported behavior still
  fail closed.
- The later browser failure shows that presence alone cannot distinguish a
  user-locked gameplay value from a model-chosen default. Intent provenance and
  playability calibration require a separate versioned stage; this policy must
  not infer that distinction retroactively.

## Evidence

- `src/requirements/spec-completion-policy.ts`
- `tests/requirements/spec-completion-policy.test.ts`
- Grounding replay `3df2c95f-b2d9-46cb-b884-df1b4ccb7a51`
- Build-only run `54123291-f3dc-4e99-a578-87b00c91c188`
