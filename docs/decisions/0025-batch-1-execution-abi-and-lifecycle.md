# ADR 0025: Executable module ABI, transactional contact policy, and scoped cleanup

- Status: Accepted
- Date: 2026-07-17
- Accepted by user: 2026-07-17

## Context

The Phase 7 contract foundation resolves data-only assemblies, and the thin
runtime kernel exposes useful services. Production execution still needs exact
factories, strict runtime payloads, actor-scoped compatibility, safe entity
sharing, deterministic lifecycle, per-instance resources, and reproducible
evidence.

The first review exposed four blocking flaws in the earlier design:

1. one collision module detected contact, consumed a projectile, and emitted
   damage before polarity, cancellation, absorption, or reflection could act;
2. one-shot startup outputs could be lost because state and event ports had no
   distinct phase or replay semantics;
3. cleanup requirements conflicted because running listeners and instance-owned
   pools/channels were treated as one lease class;
4. runtime factory functions, closures, and Zod objects do not have a stable
   cross-build canonical hash.

The second review then found four further ABI blockers: final resolution was
coupled directly to health, decision outcome and source operation were conflated,
ordinary event ports could not guarantee exactly-one policy transformation, and
unsupported policy order was not a resolver error. This revision resolves both
review rounds before implementation.

## Decision

### Production registration and reproducible evidence

A production registration uses `GameModuleManifest 1.1.0` and binds:

- one exact manifest;
- one canonical configuration-schema descriptor plus its local validator;
- one canonical resource-reservation descriptor plus its deterministic local
  evaluator;
- one reviewed implementation bundle export.

Manifest 1.1.0 adds capability scope, structured endpoint authorization, port
delivery semantics, resource ceilings, and lifecycle-scoped leases. Manifest
1.0.0 remains parseable only for existing resolver fixtures and cannot enter
production instantiation.

Evidence never hashes runtime function objects or Zod instances. The canonical
registration evidence hash covers, in a length-delimited versioned envelope:

- canonical manifest JSON;
- canonical configuration-schema descriptor bytes;
- canonical reservation descriptor bytes;
- implementation bundle bytes;
- dependency-lock identity;
- build/toolchain identity.

The runtime registration matches exact logical IDs and the recorded artifact
hashes. The implementation bundle covers factory and evaluator code; descriptors
cover the data contracts. `function.toString()` is forbidden evidence.

Contact-policy registrations additionally bind a canonical transform descriptor.
Reviewed policy-chain profiles are independent canonical registry artifacts;
their bytes and referenced policy artifact hashes are included in resolution
evidence. Neither an assembly nor a factory may supply executable transforms.

### Resolved graph and authorization

`ResolvedModuleGraph 1.1.0` preserves actors, asset roles, exact artifact
identities, validated configuration, per-instance grants, bindings, explicit
dependencies, matched capability providers, and a stable provider-first order.
Lexical `instanceId` breaks otherwise equal ordering.

It also preserves each selected `ContactPolicyChainProfile` and each resolved
owner-scoped damage-sink chain. The resolver, not runtime convention or a later
compatibility test, rejects an unknown profile, policy-version mismatch,
unsupported order, damage-sink bypass, fork, cycle, duplicate sink, or
unterminated chain.

Capabilities are owner-scoped by default. Cross-owner access uses structured
authorization rather than `any-declared-actor`:

```text
ownerRelation: same-owner | different-owner
sourceActorRoles: closed actor-role set
targetActorRoles: closed actor-role set
sourceEntityRoles: closed entity-role set
```

The resolver verifies actual actor roles, channel entity role, source and target
owners, and the target input constraint. A broad wildcard is not admitted in
Manifest 1.1.0.

### State and event ports

Each output port declares `delivery: state | event`.

- A state port retains exactly one latest validated frozen value and revision.
  It replays deterministically to a newly activated bound consumer.
- An event port retains nothing, never replays, and may emit only while the
  graph is `running`.
- Port handlers are declared before initialization without activating delivery.
- During initialize, a module may seed state but may not emit events.
- After all modules initialize, the instantiator activates every consumer's
  port-subscription start lease, then the router replays initial state in stable
  provider-first/port-ID order.
- Modules then start in provider-first order. When every start succeeds, the
  graph atomically becomes `running` and event delivery is enabled.
- Stop first blocks new events, then releases modules/start leases in reverse
  order. Resume activates all port consumers, replays current state, calls start
  hooks, and only then enables events.

Fixed targeting, health state, and entity-channel declarations are state ports.
Attack requests, contact candidates, hits, damage, and resource transactions are
event ports. A contact decision is an internal frozen transaction value, not an
ordinary routable event. The synchronous event subgraph must be acyclic; state
feedback may occur only across an update/time boundary defined by a reviewed
module.

### Contact detection, policy, and resolution

Contact is separated into three Batch 1 modules:

1. `interaction.projectile-contact@1.0.0` detects overlap and emits
   `contact-candidate-v1`; it never consumes or transfers an entity and never
   emits damage.
2. `interaction.contact-default-damage@1.0.0` is registered with
   `executionModel: contact-policy-transform-v1`; it synchronously transforms a
   frozen seed decision into the default damage decision and owns no event
   subscription or entity grant.
3. `interaction.contact-resolution@1.0.0` receives a candidate, executes the
   resolved policy profile transaction, validates its one final decision, and
   is the only module allowed to consume, retain, or transfer the source entity;
   only then may it emit hit, damage, resource, or transfer evidence.

`contact-decision-v1` contains two independent required fields:

```text
disposition: damage | absorb | reflect | cancel | ignore
sourceOperation: consume | retain | transfer
```

Every intermediate and final decision must satisfy this closed matrix:

| disposition | allowed sourceOperation |
| ----------- | ----------------------- |
| damage      | consume, retain         |
| absorb      | consume                 |
| reflect     | transfer                |
| cancel      | consume                 |
| ignore      | retain                  |

The resolver constructs a frozen `ignore/retain` seed from the immutable
candidate. A registered policy implements the restricted synchronous ABI:

```ts
type ContactPolicyTransform = (
  decision: FrozenContactDecision,
) => FrozenContactDecision;
```

The transaction host invokes each transform exactly once in profile order. A
Promise/thenable, no return, second completion, exception, identity change, an
undeclared field change, an invalid combination, or an incorrect trace fails
the whole transaction. Contact ID, source channel/entity/generation, target
actor, and candidate metadata are immutable. Each manifest declares the exact
decision fields it may change; the host appends that policy ID exactly once to
an otherwise non-writable trace. Transaction depth is bounded by the profile.
Transforms receive no ports, clock, entity handle, mutation grant, or async
service. No source mutation or result event occurs until the complete chain
succeeds; an exception therefore leaves the source unchanged.

Assemblies select a reviewed `ContactPolicyChainProfile` by logical ID and
version and may configure only its declared bounded parameters. They may not
list or reorder raw policy transforms. A profile canonically declares:

```text
profileId, version, orderedPolicyIds, policyVersionConstraints,
requiredPolicyRoles, allowedDispositions, allowedSourceOperations,
maxDepth, supportedChainEvidenceId, evidenceHash
```

Each policy manifest also declares `executionModel`, `policyPhase`,
`allowedPredecessors`, `allowedSuccessors`, `requiresBefore`, `requiresAfter`,
`supportedChainEvidenceIds`, and its mutable-field allowlist. The resolver
checks both profile and manifests, expands the exact chain into the resolved
graph, and rejects every unreviewed order before instantiation. Batch 1 uses a
profile containing only default damage and admits only `damage/consume`.

Damage routing uses owner-scoped capability `combat.damage-sink@1.0.0` rather
than a direct health dependency. Its Manifest descriptor is strict data:

```text
capability, sinkRole: filter | terminal-health, inputPort,
downstreamOutputPort (required only for filter)
```

Each target owner has one resolved route with a declared head sink, ordered sink
instances, and exactly one terminal health instance. Every damage producer for
that owner must bind the head; multiple producers may share that head. Each
filter has exactly one downstream sink binding, while terminal health has none.
`combat.health@1.0.0` provides the terminal sink. A later shield or
invulnerability module provides a filter sink and conditionally forwards one
validated damage value downstream. The resolver proves the route is same-owner
and linear to exactly one terminal health, rejecting a producer bound below the
head (bypass), multiple downstream edges (fork), cycle, duplicate sink instance,
or unbound end. Thus Batch 2 can insert defense without changing Batch 1 ABI.

The contact detector's duplicate ledger is bounded. It keys by source channel,
source entity generation, and target actor. It prunes entries when the source
generation is no longer active and has a hard ceiling derived from the admitted
source-channel capacity and target count. Reaching the ceiling fails before
adding an unaccounted entry.

### Factory context and engine boundary

Factories receive a scoped context, not Phaser and not the full kernel. The
context exposes validated identity/configuration/assets, state/event ports,
clock, cancellable input, safe actor/entity handles, owned pools/channels,
authorized external channels, cancellable overlap, viewport, budgets, and
namespaced observation.

An entity-channel payload is a logical state grant, never a runtime handle.
Only the final contact resolver can receive a separately declared mutation grant
for consumption or ownership transfer; policy transforms cannot receive it.
Actor roots are supplied by the runtime host in Batch 1; later encounter modules
may own actor roots they create through the same safe entity directory.

### Lifecycle and restart vocabulary

Factories are created, initialized, started, and updated in stable
provider-first order. Stop and dispose execute in reverse order. A partial
failure blocks events, releases every acquired lease at its proper scope, stops
every started module, and disposes every created module in reverse order while
preserving original and cleanup failures.

Vocabulary is fixed:

- `stop -> start` means pause/resume of the same graph instance and preserves
  instance state unless a module contract explicitly resets a field;
- game restart means `dispose -> instantiate` and creates a new graph and new
  health/trigger/contact state;
- `dispose` is terminal;
- graph destruction follows disposal and releases graph-owned infrastructure.

### Lifecycle-scoped leases and resources

Manifest gameplay resources remain ceilings; the canonical reservation
descriptor derives exact per-instance grants from validated configuration before
aggregate admission. Projectiles count toward both active-projectile and
active-entity limits. Spawn rate uses a trailing 1,000 ms kernel-time window.

Runtime leases are divided by owner and release point:

- `startLeases`: input listeners, port consumer subscriptions, timers, overlap
  watches, and update registrations; all reach zero on stop or failed start;
- `instanceLeases`: module-owned pools, entity channels, state caches, and
  module observation readers; active pool entities reach zero on stop, while
  the pool/channel lease reaches zero on dispose;
- `graphLeases`: port router, root actor directory, and shared budget ledger;
  these reach zero only when the graph is destroyed.

A paused instance may retain instance state and empty pools, but no input,
timer, overlap, event consumer, or update callback may remain active. Unknown
keys, inconsistent accounting, or a side effect above a grant fail before
mutation.

### Complete-library sufficiency and Batch 1 set

The ABI must support the complete Phase 7 targeting, trigger, delivery, combat,
progression, encounter, companion, scoring, and outcome catalog without adding
gameplay escape hatches to the kernel.

The revised Batch 1 set contains eleven modules:

- `intent.keyboard-movement@1.0.0`
- `intent.touch-drag@1.0.0`
- `intent.movement-arbiter@1.0.0`
- `locomotion.bounded@1.0.0`
- `targeting.fixed-forward@1.0.0`
- `trigger.interval@1.0.0`
- `delivery.projectile@1.0.0`
- `interaction.projectile-contact@1.0.0`
- `interaction.contact-default-damage@1.0.0`
- `interaction.contact-resolution@1.0.0`
- `combat.health@1.0.0`

## Rejected alternatives

- A combined collision/damage/consumption module is rejected because it blocks
  policy composition.
- Directly requiring health from contact resolution is rejected because it
  creates a defense bypass and would force a Batch 1 ABI change for shields.
- Free-form policy lists and ordinary policy event subscriptions are rejected
  because they cannot prove supported order, synchronous exactly-once return, or
  mutation-free failure.
- Parallel policy proposals plus an implicit coordinator are rejected for the
  first library because completion barriers and hidden precedence complicate
  deterministic synchronous delivery. The explicit policy chain is reviewable.
- Treating direction and touch position as one vector is rejected because their
  units and arbitration differ.
- Passing Phaser sprites/groups through ports is rejected because it violates
  data-only composition and ownership.
- A single unscoped runtime lease bucket is rejected because pause and disposal
  have different owners and release points.
- Hashing functions, closures, Zod objects, or `function.toString()` is rejected
  as non-reproducible.
- Using assembly-global capability matching or broad cross-owner wildcards is
  rejected because it can bind the wrong actor or entity role.
- Pausing all scene physics for one module's cleanup is rejected.
- Directional shooting remains outside Batch 1.

## Consequences

- The first implementation step changes Manifest, descriptors, resolver output,
  port router, tests, and kernel adapters before gameplay factories.
- Batch 1 remains eleven modules. `combat.damage-sink@1.0.0` is an abstract
  owner-scoped capability supplied terminally by health, not a twelfth module.
- Contact-policy profiles and transforms become registry artifacts resolved
  before instantiation; assemblies cannot invent policy order.
- Pause/resume, new-game restart, and graph destruction now have distinct and
  testable semantics.
- The fixed template remains unchanged as compatibility evidence.
- No model workflow, paid call, asset expansion, or later gameplay implementation
  is authorized by this ADR.

## Phase 8 note

The complete low-level library may be difficult for a model to wire directly.
Phase 8 should design reviewed `AssemblyRecipe` records that expose high-level
choices and bounded parameters, then expand deterministically into a normal
data-only `GameAssemblySpec`. Recipes cannot bypass schema, resolution,
ownership, budgets, evidence, or verification. This is a later design
requirement, not a Phase 7 implementation action.

## Verification gate

Implementation is blocked until tests are planned for state replay, event phase
rejection, synchronous-cycle rejection, structured cross-owner authorization,
profile/manifest order rejection, exactly-once synchronous policy transforms,
immutable decision identity, disposition/source-operation combinations,
mutation-free transform failure, linear damage-sink termination at unique
health, contact-policy replacement, final-only entity mutation, bounded
duplicate ledgers, all three lease scopes, pause/resume, new-game
re-instantiation, canonical artifact hashing, exact/one-over resource limits,
reverse rollback, and zero cleanup residue at each lifecycle boundary.

## Relationship

This ADR refines ADRs 0022-0024 without changing their product boundary,
data-only assembly rule, deterministic authority, fixed-path preservation, or
Phase 8 separation.
