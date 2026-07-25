# ADR 0027: Batch 2 runtime authority and transactional effects

- Status: Accepted
- Accepted revision: 3
- Date: 2026-07-18
- Decision owner: user
- Frozen design source: `docs/BATCH_2_MODULE_DESIGN.md`, Revision 4
- Acceptance: explicitly accepted by the user on 2026-07-18

## Context

ADR 0026 closed the executable Batch 1 ABI with strict Manifest 1.2, Assembly
1.1, Graph 1.2, trusted executable loading, guarded lifecycle/time/events,
exact grants, observation, entity custody/quarantine, and a source-first contact
commit. The eleven Batch 1 modules and fixed-template compatibility path pass
their current gates.

The user approved Revision 4 of the Batch 2 contract packet on 2026-07-18.
Batch 2 needs authority that the immutable Batch 1 contracts do not express:

- bounded different-owner actor snapshots for nearest targeting;
- bounded read-only entity-channel snapshots for graze;
- channel-explicit targeting, trigger, and delivery ownership;
- configuration-conditional exact timer reservations;
- a restricted pickup-effect planner and source-first multi-output commit;
- graph-derived addressed effect delivery to one exact modifier receiver;
- projectile capability, channel binding, candidate, and mutation lineage;
- non-wrapping safe-integer identity allocation;
- closed modifier targets and maximum-reachable reservation evidence;
- compatible contact/health/locomotion versions without changing Batch 1;
- independent pattern pools under one assembly aggregate budget.

The current Manifest 1.2 schema is strict and has no extension point for these
descriptors. Reinterpreting the same version would violate ADR 0026's version
boundary and make previously canonical bytes mean something new. The new
authority therefore needs explicit contract versions before schema or runtime
implementation.

## Status and authorization `[ABI27-AUTH-001]`

The user explicitly accepted Revision 3 on 2026-07-18. This authorizes the
contract/schema/resolver/host work and red tests in the frozen implementation
order.

Acceptance does not authorize gameplay factories before the contract/red-test
gate passes, a paid model call, asset expansion, Git operations, fixed-template
retirement, or changes to Batch 1 manifests, graphs, factories, and evidence.

## Goals

1. Encode every frozen Batch 2 authority as canonical strict data.
2. Preserve Batch 1 bytes, behavior, evidence, and browser compatibility.
3. Make actor/channel reads least-privilege, bounded, stable, and observable.
4. Make attack-channel ownership mechanically resolvable across targeting,
   trigger, and delivery.
5. Preserve source-first custody while prevalidating every pickup effect output.
6. Make dynamic modifiers incapable of exceeding admitted resource grants.
7. Specify lifecycle, timing, identity, and failure behavior with unique tests.
8. Fail before factory construction when any schema, authority, route, budget,
   implementation, or evidence requirement is missing.

## Non-goals

- implementing Batch 2 gameplay factories in the ADR gate;
- changing Batch 1 Manifest 1.2, Assembly 1.1, or Graph 1.2 semantics;
- safe source transfer, reflection, absorption, or cancellation;
- arbitrary actor-directory queries, raw entity iteration, or Phaser access;
- arbitrary property paths, reflection, or module-internal modifier writes;
- scoring, waves, Boss phases, outcomes, or Batch 4 mechanics;
- model orchestration, OpenCode module generation, paid calls, or corpus work;
- retiring the fixed template.

## Required version boundary `[ABI27-VER-001]`

This ADR establishes new versions rather than silently widening strict existing
schemas:

| Contract        | Preserved version | Proposed Batch 2 version | Rule                                                    |
| --------------- | ----------------- | ------------------------ | ------------------------------------------------------- |
| Module manifest | 1.2.0             | **1.3.0**                | Adds Batch 2 authority descriptors                      |
| Assembly spec   | 1.1.0             | **1.2.0**                | Selects 1.3 modules without reinterpreting Assembly 1.1 |
| Resolved graph  | 1.2.0             | **1.3.0**                | Carries exact read/channel/effect/modifier grants       |

Manifest 1.2, Assembly 1.1, and Graph 1.2 retain their exact canonical bytes and
remain the Batch 1 production path. No converter silently rewrites immutable
Batch 1 artifacts. A normal resolver may support both paths through distinct
entry points. Graph 1.3 construction accepts only Assembly 1.2, but may contain
an explicit mixture of admitted Manifest 1.2 and Manifest 1.3 registrations so
Batch 2 can reuse unchanged Batch 1 modules. A Manifest 1.2 instance contributes
only its original authorities and receives no implicit 1.3 descriptor or grant.

The Graph 1.3 host selects the factory ABI by each admitted manifest version.
An unchanged Manifest 1.2 registration receives the exact
`GameModuleFactoryContextV12` shape, service phase matrix, payload validation,
lease ceilings, and export kind it receives in Graph 1.2. It is never upcast to
a V1.3 context and no extra service key is present. Manifest 1.3 instances use a
distinct exact V1.3 context exposing only their resolved grants. Both execute
under the Graph 1.3 transaction guard, deterministic clock, router ordering, and
terminal cleanup, but graph-level infrastructure does not broaden either
factory view.

The frozen Revision 4 packet describes gameplay semantics and used the prior
version names before this strict-schema audit. If this ADR is accepted, its
version table supersedes only those version references; the frozen module,
payload, authority, timing, resource, and interaction decisions remain unchanged.

## Manifest 1.3 authority closure `[ABI27-MAN-001]`

Manifest 1.3 contains all Manifest 1.2 fields and adds strict optional arrays or
nullable descriptors. Absence means no authority. Unknown fields remain
rejected. Descriptor IDs are stable logical IDs, unique within a manifest, and
covered by the artifact envelope hash.

The new canonical fields are:

```ts
type GameModuleManifestV13 = Readonly<{
  schemaVersion: "1.3.0";
  // Canonical Manifest 1.2 fields remain structurally unchanged.
  actorSnapshotReads: readonly ActorSnapshotReadDescriptorV1[];
  entityChannelReads: readonly EntityChannelReadDescriptorV1[];
  projectileChannelConsumer: ProjectileChannelConsumerDescriptorV1 | null;
  attackChannel: AttackChannelDescriptorV1 | null;
  preparedEffectCommit: PreparedEffectCommitDescriptorV1 | null;
  modifierTargets: readonly ModifierTargetDescriptorV1[];
  pickupEffectPlanTransform: PickupEffectPlanTransformDescriptorV1 | null;
}>;
```

No factory receives these raw descriptors. Resolution produces instance-bound
grants; scoped services accept only host-minted grant IDs.

## Payload and attack-channel contract `[ABI27-ATTACK-001]`

Batch 1 `attack-request-v1` remains unchanged with `channel: "primary"`.
Batch 2 adds `attack-request-v2`:

```ts
type AttackRequestV2 = Readonly<{
  sequence: number;
  emittedAtMs: number;
  requestedAtMs: number;
  attackChannelId: string;
  slot: "primary";
}>;
```

`target-solution-v1` is a new Batch 2 state payload and includes the same
resolved `attackChannelId`, a normalized published direction, state revision,
emission time, and optional evidence-only target actor/generation/directory
revision. Delivery never re-resolves the reference.

Each Manifest 1.3 targeting, trigger, or delivery module declares exactly one
closed discriminated descriptor:

```ts
type AttackChannelDescriptorV1 =
  | Readonly<{
      role: "targeting";
      configurationField: "attackChannelId";
      targetOutputPort: string;
      targetPayloadType: "target-solution-v1";
    }>
  | Readonly<{
      role: "trigger";
      configurationField: "attackChannelId";
      requestOutputPort: string;
      requestPayloadType: "attack-request-v2";
    }>
  | Readonly<{
      role: "delivery";
      configurationField: "attackChannelId";
      targetInputPort: string;
      targetPayloadType: "target-solution-v1";
      requestInputPort: string;
      requestPayloadType: "attack-request-v2";
    }>;
```

The resolver materializes one record per `(ownerActorId, attackChannelId)` and
requires exactly one targeting, one trigger, and one delivery role. It proves
the targeting output is bound to the delivery target input and the trigger
output is bound to the delivery request input, with the literal payload types
shown above. Duplicate/missing roles, wrong descriptor branch or port direction,
owner mismatch, channel mismatch, or V1/V2 mixing blocks readiness.

One targeting instance owns one channel. One retained `aim-command-v1` output
may fan out to multiple separately configured targeting instances; one targeting
solution may not fan out across channels. The literal `primary` is only the slot
inside one resolved channel.

## Actor snapshot read grant `[ABI27-ACTOR-001]`

```ts
type ActorSnapshotReadDescriptorV1 = Readonly<{
  readId: string;
  ownerRelation: "same-owner" | "different-owner";
  sourceActorRoles: readonly ActorRole[];
  targetActorRoles: readonly ActorRole[];
  maximumEntries: number;
  entryFields: readonly (
    | "actorId"
    | "actorGeneration"
    | "role"
    | "active"
    | "position"
    | "collisionRadius"
    | "healthRatio"
  )[];
  envelopeFields: readonly [
    "directoryRevision",
    "sampledAtMs",
    "sampledFrameSequence",
    "entryCount",
  ];
  order: "distance-then-actor-id-generation" | "actor-id-generation";
  distanceOrigin: "owner-position-same-snapshot" | null;
}>;
```

Distance order requires the fixed distance origin; actor-ID order requires
null. The resolver rejects duplicate fields, missing identity fields, impossible
role relations, zero/over-limit capacity, and an order/origin mismatch.

The graph-owned directory performs one atomic read. Its envelope contains a
monotonic directory revision, integer simulation sample time, frame sequence,
and exact entry count. Each accepted registration, generation change,
activation/inactivation, position change, or removal increments the revision.
Actor identity is `(actorId, actorGeneration)` and generation increments before
ID reuse.

For distance order the host samples owner position inside the same atomic read,
sorts by squared Euclidean distance, then actor ID, then generation. The origin
rule is readiness evidence; owner position is not returned unless separately
authorized as an entry field. Factories receive no directory, iterator, engine
object, or undeclared field.

Nearest targeting publishes a direction computed from one snapshot. If the
target moves, deactivates, or is reused before attack, delivery still uses that
published direction. The next targeting update selects again or publishes the
configured fallback. Reference and snapshot metadata are evidence only.

## Safe monotonic identity allocation `[ABI27-COUNT-001]`

Every identity-bearing counter uses a non-negative safe integer and one shared
`safe-monotonic-v1` rule. This includes actor generation, directory revision,
sample/frame sequence where used as evidence identity, attack sequence, commit
sequence, commit evidence sequence, global event sequence, and entity
generation. Counters never wrap, saturate, reuse a value, or reset while their
identity scope remains live.

Before an increment or block allocation, the host proves both the next value and
the inclusive block end are no greater than `Number.MAX_SAFE_INTEGER`. A
multi-output commit therefore preflights commit sequence, evidence sequence,
`eventSequenceBase`, and
`eventSequenceBase + applicationCount` as one operation before allocating or
recording any of them. Failure terminally stops the graph before registration,
source mutation, logical state mutation, gameplay delivery, or identity-bearing
evidence write.

Actor-ID reuse preflights the next generation before registration. Any actor
directory change preflights the next directory revision before changing the
directory. Triggers and deliveries preflight their next sequence before changing
emission state. Overflow has a stable counter-specific terminal error code and
may be reported by the existing graph failure channel, but it consumes no value
from the exhausted identity domain. Boundary tests cover the last legal single
value, the last legal block, and the first rejected single/block allocation.

## Entity-channel read grant `[ABI27-CHANNEL-001]`

```ts
type EntityChannelReadDescriptorV1 = Readonly<{
  readId: string;
  channelStateInputPort: string;
  sourceEntityRole: string;
  targetActorRoles: readonly ActorRole[];
  maximumEntriesSource: "resolved-channel-capacity";
  entryFields: readonly (
    "entityId" | "generation" | "position" | "collisionRadius" | "active"
  )[];
  order: "entity-id-generation";
}>;
```

The grant is bound to one resolved `entity-channel-v1` state input and cannot
exceed that channel's exact capacity. The service returns frozen logical
snapshots only. It grants no activate, recycle, consume, transfer, pool, group,
or engine access. Graze uses `(channel, entity, generation, player)` one-shot
identity and prunes entries after the authorized generation disappears.

### Projectile capability and channel lineage

Abstract capability satisfaction is necessary but not sufficient for a
projectile-channel consumer. Manifest 1.3 adds a closed discriminated consumer
descriptor:

```ts
type ProjectileChannelConsumerDescriptorV1 =
  | Readonly<{
      role: "contact-detector";
      sourceChannelInputPort: string;
      candidateOutputPort: string;
      requiredCapability: "delivery.projectile-channel@1.0.0";
      sourceEntityRole: "projectile";
    }>
  | Readonly<{
      role: "graze-reader";
      sourceChannelInputPort: string;
      readId: string;
      requiredCapability: "delivery.projectile-channel@1.0.0";
      sourceEntityRole: "projectile";
    }>;
```

The resolver requires exactly one source binding at that input. Its provider
must both provide the required capability and own the exact bound
`entity-channel-v1` output with the declared role. It emits one immutable
lineage record containing provider instance, provider capability evidence,
source binding ID, resolved channel ID, channel output port, consumer instance,
and consumer input port.

For contact, the candidate binding into resolution and resolution's mutation-
channel binding must trace to that same lineage record. The mutation grant
inherits its lineage ID, channel ID, provider instance, entity role, and
generation authority; assembly scope or owner scope may not substitute another
provider with the same capability. A wrong provider, wrong channel output,
capability-only match, or candidate/mutation lineage split blocks readiness.

## Conditional exact reservations `[ABI27-RES-001]`

The canonical reservation descriptor adds strategy `conditional-enum-v1`:

```ts
type ConditionalEnumReservationV1 = Readonly<{
  configurationField: string;
  cases: readonly Readonly<{
    value: string;
    resources: Readonly<{
      activeEntities: number;
      activeProjectiles: number;
      spawnsPerSecond: number;
      timers: number;
    }>;
  }>[];
}>;
```

Cases are unique, exhaustive for the strict configuration enum, non-negative
safe integers, and no greater than manifest ceilings. The evaluator must exactly
match the canonical case. Unknown mode, missing/duplicate case, formula drift,
zero-grant side effect, and one-over-grant side effect fail closed.

For `trigger.active`: press/release reserve zero timers; hold-repeat reserves
exactly one. There is no reserve-one fallback for edge modes.

## Active-trigger state machine `[ABI27-TRIGGER-001]`

The strict configuration union has press and release variants without timer
fields, and hold-repeat with `initialDelayMs` 0..10000 and
`repeatIntervalMs` 50..10000. Runtime state is one of `idle`, `held-edge`,
`held-waiting`, or `held-repeating`, with at most one captured input identity.

- First press in idle captures identity. Press mode emits once immediately;
  release mode arms without emission; hold-repeat schedules its one timer and
  waits for the exact initial due boundary.
- Repeated captured press and different-identity press are ignored and observed.
- Isolated/wrong-identity release is ignored. Matching release emits once only
  in release mode; matching hold release cancels the timer before idle.
- Initial delay zero means the next timer-dispatch boundary, not synchronous
  emission inside the press handler.
- Accepted input before a same-time frame transition wins and may cancel the
  timer. Once the frame begins, exact timers precede later queued input. The
  top-level transition guard similarly orders stop versus timer callback.
- Stop/pause cancels timer, clears identity, and explicitly resets idle. Resume
  schedules nothing and requires a new press. Dispose resets; a new instance
  begins idle with sequence zero.

Ignored inputs consume neither attack sequence nor timer capacity.

## Prepared pickup effect transaction `[ABI27-EFFECT-001]`

Manifest 1.3 adds:

```ts
type PreparedEffectCommitDescriptorV1 = Readonly<{
  commitServiceId: string;
  mutationChannelStateInputPort: string;
  admittedSourceOperation: "consume";
  effectPlanProfileId: string;
  collectedOutputPort: string;
  applicationRouteSourceId: string;
  maximumApplicationsPerCommit: number;
  maximumConcurrentCommits: number;
  duplicateLedgerCapacity: number;
}>;
```

`progression.modifier` is admitted through restricted export kind
`pickup-effect-plan-transform-v1`, not a lifecycle factory. Its descriptor fixes
the input/output template schemas, exact profile evidence, target mapping limit,
and lack of port/service/async authority.

`applicationRouteSourceId` is not an ordinary routable output port. Assembly
1.2 represents each permitted effect target with an
`effect-application-binding-v1`, separate from ordinary port bindings. The
resolver turns each binding into exactly one frozen addressed route:

```ts
type ResolvedEffectApplicationRouteV1 = Readonly<{
  routeId: string;
  sourceInstanceId: string;
  applicationRouteSourceId: string;
  targetInstanceId: string;
  targetInputPort: string;
  fieldId: ModifierTargetDescriptorV1["fieldId"];
  operation: "add";
  payloadType: "modifier-application-v1";
}>;
```

The route table is derived only from admitted manifests, exact assembly effect
bindings, and target descriptors. It is hashed readiness/catalog evidence.
Ordinary router bindings from an application route source are forbidden, and
`ports.emitEvent` cannot invoke addressed delivery.

Prepare is running/event-token only and mutation-free:

1. validate source identity/generation, mutation grant, profile, bindings,
   receiver target descriptors, capacities, and duplicate state;
2. reserve one fixed commit slot and install a token-owned provisional marker;
3. build an immutable collected template with no host-owned event envelope;
4. invoke the reviewed synchronous planner exactly once;
5. resolve each template's route ID and validate the immutable ordered
   application templates, including every non-host field, exact singleton
   target, operation, bound, and maximum count;
6. return a token/source/profile-bound single-use prepared capability.

Templates exclude `sequence`, `emittedAtMs`, `commitSequence`,
`commitEvidenceId`, and `eventOrdinal`. The planner cannot inject or guess these
fields.

Reservation of the slot and installation of the provisional duplicate marker
form one host-owned provisional resource pair. Immediately after step 2, the
host registers a no-throw unwind before constructing templates or calling the
planner. Any throw, thenable, missing/double return, identity change, reserved-
field injection, invalid template, unknown route/target, capacity failure, or
other failure before the capability is returned must execute that unwind before
the error escapes prepare. The unwind removes the marker and releases the slot
as one unobservable atomic host operation. When multiple failed/abandoned
prepares are finalized in one event transaction, their pairs are released in
ascending prepare-creation order.

Failed prepare cleanup invokes no factory callback, performs no allocation or
schema lookup, and cannot fail independently. It keeps the source active,
allocates no commit/evidence/event identity, emits nothing, and leaves no
durable or provisional duplicate state. The same source may therefore prepare
again after the failure, and repeated failures cannot consume
`maximumConcurrentCommits` or duplicate-ledger capacity. A successfully returned
but abandoned capability uses the same ordered atomic unwind.

Commit under the same event token:

1. revalidates capability, phase, source generation, and slot;
2. allocates one commit sequence, one commit evidence ID, and a contiguous
   global event-sequence block of `1 + applicationCount`;
3. constructs new final events with one integer commit time. Collected uses
   ordinal zero; applications use plan-order ordinals 1..N; global event
   sequence equals block base plus ordinal;
4. validates/freezes every complete payload and its single addressed route,
   proves every target handler lease is active, and freezes the ordered delivery
   plan before callback or mutation;
5. installs the durable duplicate marker and marks committing;
6. consumes physical then logical source custody;
7. marks committed without later validation/lookup/allocation, broadcasts the
   collected event through its ordinary port, then delivers each application
   exactly once to its one addressed handler in plan order, attempting all
   planned deliveries;
8. aggregates handler failures and terminally fails after delivery accounting.

All final events share `commitSequence` and `commitEvidenceId`; stable output
identity is `(commitEvidenceId, eventOrdinal)`. An application has no separately
writable source-evidence field.

An unexpected host finalization failure before mutation leaves source active,
terminally fails, and records the allocated commit/evidence/event block plus
suppressed ordinals. Indeterminate source mutation delivers nothing, quarantines
custody, and records the same identities. Delivery failure retains committed
evidence. Thus every commit attempt durably accounts for all allocated
identities; abandoned prepare consumes none.

Each resolved addressed route owns one start-scoped target-handler lease with
identity `start/effect-target/<routeId>`. Stop revokes it; prepare and commit are
running/event-token only. The transition guard prevents lifecycle reentry from
changing leases during commit. Missing or inactive leases fail before source
mutation. A handler throw after source consumption does not roll back custody or
skip later applications: the host attempts the remaining frozen singleton
routes, records per-route success/failure against event ordinal, aggregates the
failures, and terminally fails afterward. No application is broadcast to other
modifier targets.

## Closed modifier targets `[ABI27-MOD-001]`

```ts
type ModifierTargetDescriptorV1 = Readonly<{
  fieldId:
    | "combat.health.current"
    | "combat.shield.current"
    | "attack.damage.multiplier"
    | "attack.projectile-count.bonus";
  inputPort: string;
  operation: "add";
  minimum: number;
  maximum: number;
  reset: "dispose-new-graph";
}>;
```

The resolver binds each application route to one exact instance, advertised
field, operation, and addressed payload input. Paths, property names,
reflection, unknown fields, unbound instances, ordinary broadcast bindings,
non-finite values, and out-of-range bounds are rejected. Receivers own clamping
and publish state evidence.

Batch 2 projectile deliveries advertise damage-multiplier and count-bonus
targets. They snapshot both exactly once when handling an attack request;
applications cannot change that request or active projectiles. Effective count
and damage follow the frozen formulas. Every projectile/emission carries the
snapshotted damage.

Reservations use maximum reachable modifier state:

```text
maximumEffectiveCount = baseCount + maximumCountBonus
spawnsPerSecond = maximumAcceptedRequestsPerSecond * maximumEffectiveCount
```

The configuration requires maximum effective count no greater than pool
capacity, safe-integer multiplication, and values within manifest/assembly
ceilings. Excess input request rate and pool exhaustion drop a stable suffix and
remain observable; modifiers never create an unreserved allowance.

## Compatible module versions `[ABI27-COMPAT-001]`

Batch 1 versions remain unchanged. Batch 2 adds reviewed compatible versions:

- `locomotion.bounded@1.1.0`: optional same-owner `movement-scale-v1` state;
- `combat.health@1.1.0`: terminal sink plus exact health modifier input and
  `health-state-v2`;
- `interaction.projectile-contact@1.1.0`: depends on abstract
  `delivery.projectile-channel@1.0.0`, not one concrete delivery module;
- `interaction.contact-resolution@1.1.0`: depends on the compatible candidate
  capability while preserving ADR 0026 policy/commit/damage-route semantics.

Every Batch 2 projectile delivery provides its specific capability plus
`delivery.projectile-channel@1.0.0`. Matching payload names alone do not satisfy
the capability or mutation grant. The 1.1 contact detector also declares the
projectile-channel consumer descriptor; its exact source binding creates the
lineage inherited by candidate and mutation grants.

## Defense, graze, and pattern boundaries `[ABI27-COMBAT-001]`

The player damage route is a same-owner linear route:

```text
producer -> invulnerability -> shield -> terminal health
```

Contact resolution executes the reviewed default-damage policy internally,
then emits to the resolved route head. Invulnerability uses the half-open
predicate `nowMs < activeUntilMs`: zero duration blocks nothing, the second
same-time event is blocked for positive duration, exact expiry is accepted, and
simulation-time pause retains the remainder.

Graze has read-only channel authority, never mutation. Pattern deliveries own
independent actor/channel-local pools and generations. Multiple patterns use
distinct resolved attack channels and contend through one assembly aggregate
projectile/spawn ledger in stable resolved module order. There is no shared
physical pool contract.

## Service identity, phases, and leases `[ABI27-SVC-001]`

New service identities are derived only from resolved descriptors:

| Service                  | Scope                   | Canonical identity             |
| ------------------------ | ----------------------- | ------------------------------ |
| actor snapshot read      | instance                | resolved actor-read grant ID   |
| entity-channel read      | instance                | resolved channel-read grant ID |
| prepared effect commit   | instance                | commit service ID/profile ID   |
| modifier target consumer | start addressed lease   | resolved effect route ID       |
| attack-channel role      | resolved graph evidence | owner/channel/role tuple       |

Actor/channel reads and observation are read-only. Prepared effect planning and
commit are running/event-transaction only. Modifier application delivery is a
host-owned addressed event constrained by its resolved singleton route under the
existing transaction token; collected evidence remains an ordinary port event.
Active trigger timer/input leases exist only while started; stop zeros them.
Restricted transforms own no runtime lease.

No new operation permits raw registry, resolver, directory, entity, pool,
kernel, Phaser, filesystem, environment, network, or credential access.

## Assembly 1.2 and Graph 1.3 readiness `[ABI27-READY-001]`

Assembly 1.2 remains data-only. It selects admitted Manifest 1.2 and 1.3 module
IDs/versions, strict configuration, actors, bindings, admitted assets, budgets,
and reviewed profiles. It contains no code, paths, imports, URLs, packages,
commands, callbacks, expressions, or runtime handles. Selection of a 1.2
registration never synthesizes a 1.3 authority descriptor.

Graph 1.3 readiness requires:

- exact manifest/configuration/reservation/implementation/catalog evidence;
- all payload schemas and delivery kinds;
- owner/role/cardinality/dependency/capability compatibility;
- complete attack-channel role triples;
- exact actor/channel read grants and snapshot capacities;
- prepared-effect profile, transform handle, mutation grant, output plan, and
  quarantine capacity;
- singleton addressed effect routes and target-handler leases;
- exact projectile capability/channel/candidate/mutation lineage;
- modifier targets and maximum-reachable resource reservations;
- linear damage routes and compatible contact profiles;
- exact assets, timers, entities, projectile/spawn aggregates, leases, and
  browser-safe catalog evidence.

Any blocker yields one immutable Node-side readiness report and
`status:"blocked"`. Browser runtime accepts only ready Graph 1.3 with matching
catalog evidence. Graph 1.2 remains accepted only by the Batch 1 runtime path.

## Verification gate `[ABI27-GATE-001]`

Before any Batch 2 production factory:

1. Manifest 1.3, Assembly 1.2, and Graph 1.3 schemas/types have canonical and
   unknown-field rejection tests.
2. Batch 1 versions retain canonical bytes and all existing tests.
3. A mixed Graph 1.3 conformance fixture resolves an unchanged admitted Manifest
   1.2 factory beside a Manifest 1.3 conformance probe, executes in the isolated
   runtime and desktop/mobile browser harness, and proves the V1.2 context/service
   key set is byte-for-byte unchanged with no V1.3 grant.
4. Every new descriptor has missing, duplicate, wrong-owner/role, over-capacity,
   and evidence-drift red tests.
5. Actor snapshots reject undeclared entry/envelope fields, invalid count,
   non-monotonic revision, stale generation misuse, and wrong distance origin.
6. Nearest tests prove old direction before the next targeting update and new/
   fallback direction afterward without reference re-resolution.
7. Attack channels reject missing/duplicate roles, channel mismatch, owner
   mismatch, wrong role-specific ports/directions, V1/V2 mixing, and targeting
   fan-out.
8. Identity-counter tests cover the last legal value/block and reject the first
   overflow before registration, mutation, allocation, delivery, or evidence.
9. Conditional reservations prove press/release zero, hold-repeat one,
   descriptor/evaluator equality, zero-grant rejection, and one-over rejection.
10. Active-trigger tests cover duplicate press, isolated/wrong release,
    initial/repeat boundaries, same-time release/timer and stop/timer ordering,
    pause reset, resume requiring new press, and fresh restart.
11. Effect prepare rejects host-owned template fields, invalid target/operation,
    async/double/missing transform return, route/capacity excess, and abandoned
    leaks. Every failure before capability return proves atomic slot/marker
    release, source-active/no-identity behavior, successful same-source retry,
    and repeated failures never exhausting concurrent slots or duplicate capacity.
12. Effect commit proves contiguous sequences/ordinals, complete prevalidation,
    source-first consume, singleton addressed delivery, no broadcast misdelivery,
    fixed all-attempt failure behavior, durable accounting, quarantine, and no
    event on indeterminate mutation.
13. Projectile lineage tests reject a same-capability wrong provider/channel and
    any split between source binding, candidate, and mutation grant.
14. Modifier tests prove request-level snapshots, no active-entity mutation,
    maximum-reachable reservations, request-rate drop, pool suffix drop, and
    exact/one-over bounds.
15. Damage tests prove route-head enforcement and half-open invulnerability at
    zero, same time, exact expiry, and pause.
16. Pattern tests prove independent custody/generations and aggregate budget
    contention in stable resolved order.
17. Lifecycle tests prove state replay, exact timer/input/update/overlap and
    addressed-target leases, pause/resume reset rules, reverse cleanup, terminal
    failure, and fresh game.
18. Trusted loading/catalog/browser-boundary tests reject imports, closure,
    export/hash/catalog drift, Node authority, and missing readiness evidence.
19. Focused contract tests pass, then `pnpm check`, root/isolated production
    builds, and preserved Batch 1/fixed-template browser regressions pass before
    the first Batch 2 factory slice is admitted.

## Implementation order after acceptance `[ABI27-IMPL-001]`

1. Add schemas/types and canonical artifact hashing for the accepted versions.
2. Add pure resolver/readiness evidence and red tests for every descriptor.
3. Add the version-selected mixed-graph factory-context boundary and its
   resolver/isolated/browser conformance fixture.
4. Add scoped actor/channel read hosts, projectile lineage, safe monotonic
   counters, and exact observation/lease accounting.
5. Add conditional reservation evaluation and active-trigger host boundaries.
6. Add restricted effect-plan loading/profile resolution, singleton addressed
   target routes, and prepared commit host with complete failure accounting.
7. Add modifier-target resolution and maximum-reachable budget proofs.
8. Run the full ABI gate and fixed-path regression.
9. Only then implement the frozen Batch 2 factory slices in their documented
   control, delivery, defense, progression, and complete-graph order.

## Rejected alternatives

- Widening strict Manifest 1.2, Assembly 1.1, or Graph 1.2 under the same version
  is rejected because canonical bytes and semantics are immutable.
- Factory-local actor directory or entity iteration is rejected.
- Broadcasting one modifier application across ordinary port bindings is
  rejected; addressed routes remain graph-derived and host-owned.
- Matching an abstract projectile capability without exact channel lineage is
  rejected.
- Wrapping, saturating, or reusing an identity-bearing counter is rejected.
- Upcasting a Manifest 1.2 factory context inside Graph 1.3 is rejected.
- Returning descriptor-undeclared generation or envelope fields is rejected.
- Factory-provided distance origin or runtime query predicate is rejected.
- Reusing `attack-request-v1` for arbitrary graph channels is rejected.
- Implicit V1/V2 adapters or channel inference from bindings are rejected.
- One targeting state directly fan-out to multiple channel identities is rejected.
- Reserve-one timers for every active-trigger mode is rejected.
- Browser key-repeat as attack cadence is rejected.
- Preserving held cadence across pause without an input lease is rejected.
- Preparing final pickup payloads before evidence allocation is rejected.
- Retaining a provisional marker or commit slot after any prepare failure is
  rejected; failed and abandoned prepare share the same ordered atomic unwind.
- Planner-provided sequence/time/evidence/ordinal placeholders are rejected.
- Mutating immutable templates at commit is rejected; the host constructs new
  final payloads.
- Consuming the pickup before complete final validation/freeze is rejected.
- Post-consume dynamic modifier derivation is rejected.
- Unreported sequence holes or dropping allocated failure identities is rejected.
- Arbitrary modifier paths, reflection, and unbounded multiplier/count growth are
  rejected.
- Shared physical pattern pools across independent actor/channel custody are
  rejected for Batch 2; aggregate budget contention is retained.
- Direct health calls or contact-policy nodes outside resolution are rejected.
- Starting production factories before this ADR and its red-test gate pass is
  rejected.

## Consequences

- Batch 2 authority becomes explicit and independently auditable.
- Three new contract versions and resolver/runtime paths are required.
- Batch 1 remains stable rather than being silently reinterpreted.
- Snapshot and transaction evidence grows, but remains bounded and immutable.
- Multi-channel attacks and modifiers have higher schema/test cost, preventing
  factory-local shortcuts that would block Batch 3/Boss composition.
- The fixed template and Batch 1 modular slice remain mandatory regressions.

## Relationship

This ADR is a Batch 2 extension of ADRs 0025-0026. It preserves ADR 0026
for Batch 1 and supersedes only the frozen packet's provisional use of Manifest
1.2/Assembly 1.1/Graph 1.2 for new Batch 2 authority. It preserves
ADRs 0022-0024, the single-player boundary, data-only assembly, deterministic
resolver authority, bounded model-development separation, fixed-path
compatibility, and no-paid-call constraint.
