# ADR 0024: Base library first and bounded API-model module development

- Status: Accepted
- Date: 2026-07-17

## Context

ADRs 0022-0023 established a thin kernel, compatible modules, orthogonal
capabilities, and model-produced data-only assemblies. The first implementation
created strict contracts and five representative fixtures but no executable
gameplay modules or graph instantiator.

The user clarified two product requirements. First, Agent development should
build the common base-module library as completely as practical before testing
normal model composition. Second, an in-scope capability gap during generation
should trigger a bounded attempt by the same API model to develop a new module,
not an immediate unsupported response. OpenCode is the execution framework for
that API model's code work, not a separate intelligence.

## Decision

### Interpretation boundary

The development-sequence clauses below govern repository work. The normal
generation and capability-gap clauses specify the finished Agent's request-time
behavior; they do not authorize model calls and do not make Phase 8 workflows
part of the active Phase 7 implementation step. `docs/ROADMAP.md` remains the
only live development plan.

### Development sequence

- Phase 7 first builds the executable module ABI, implementation registry,
  resolved-graph instantiator, and the base library defined in
  `docs/BASE_MODULE_LIBRARY_PLAN.md`.
- Existing pure planners and preserved legacy behavior are adapted before
  inventing replacements. Every slice retains the fixed-template regression.
- API-model intent review and composition begin after the base library can run
  the preserved game with equivalent browser, recovery, and package evidence.

### Normal generation

- One approved API model reviews the request's gameplay intent, compares it to
  the model-visible catalog, and produces a request-bound `GameAssemblySpec`
  when admitted modules cover the requirement.
- `GameAssemblySpec` remains data only. It may never contain source code,
  commands, packages, imports, URLs, or implementation paths.
- The deterministic orchestrator and resolver retain authority over versions,
  configuration, ports, ownership, budgets, instantiation, verification,
  recovery, repair limits, and packaging.

### Capability gaps

- For a genuine in-scope gap, the same API model may enter a distinct bounded
  module-development session through OpenCode. The development artifact is
  isolated module source plus manifest, schema, and tests; it is never embedded
  in `GameAssemblySpec`.
- The workflow restricts writable files, imports, dependencies, commands,
  permissions, tokens, time, diff size, and repair rounds. Generated code may
  use only the reviewed module ABI and kernel surface.
- Independent local schema, type, unit/property, contract, resource, build, and
  browser gates decide run-local admission. The API model cannot approve its
  own output or weaken tests.
- Explicit scope, security, permission, credential, and cost violations fail
  immediately. Other in-scope gaps fail closed only after the bounded
  development or repair budget is exhausted.
- Run-local admission does not silently promote a module into the permanent
  base library. Promotion requires reproducible evidence and normal review.

### Cost and credentials

No paid call is implied by this ADR. Before any paid model request, report the
model, purpose, number of calls, token ceiling, and estimated cost and obtain
explicit user approval. Credentials remain external and must never enter model
context, logs, fixtures, artifacts, or source control.

## Consequences

- The active mainline moves from an early model-composed movement proof to
  construction of the executable base-module library.
- The Agent reuses reviewed modules by default while retaining a bounded path
  for novel in-scope requirements.
- OpenCode becomes part of the later capability-gap workflow, while deterministic
  orchestration remains outside the session and independently auditable.
- Compatibility and browser costs increase, so the coverage matrix and staged
  batches constrain the first library.
- The legacy fixed path remains until modular parity, recovery, and packaging
  gates pass.

## Supersession

This ADR supersedes ADR 0022 only where it says the API model may never develop
module internals, OpenCode is outside normal generation for every new module,
or unsupported in-scope behavior must fail before a bounded development
attempt. ADR 0022's kernel, module contract, deterministic resolution, evidence,
security, and parity decisions remain accepted. ADR 0023's single-player scope,
capability taxonomy, typed ports, and ownership rules remain accepted.
