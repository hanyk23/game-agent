# Batch 2 Module Contract Design

Updated: 2026-07-18  
Status: Revision 4 approved and frozen; ADR 0027 accepted

## Purpose

This packet is the user-approved frozen contract boundary for Phase 7 Batch 2. It adds
legacy offensive and defensive mechanics to the executable module library while
preserving Batch 1 Manifest 1.2, Assembly 1.1, Graph 1.2, ADR 0026 authority,
and the passing Batch 1 and fixed-template paths.

The user approved Revision 4 on 2026-07-18. Changes to its gameplay semantics,
authority, timing, resource, or interaction rules require a new reviewed
revision. Approval authorizes the ADR draft, not contract/runtime implementation,
a paid model call, asset expansion, Git operation, or fixed-template retirement.

## Scope reconciliation

The detailed capability table assigns `targeting.nearest` to Batch 2 and the
ROADMAP Core gate names directional/nearest targeting, although the ROADMAP next
gate sentence omits nearest. This draft includes it. Freezing the packet should
also reconcile that sentence.

Focus has the opposite gap: `locomotion.focus-speed` is assigned to Batch 2 but
there is no focus-intent provider. Letting locomotion capture a key or pointer
would violate the accepted intent/locomotion boundary. This draft therefore
adds the new reviewed ID `intent.focus`.

The approved production set is 27 definitions:

- 23 new module IDs;
- four compatible new versions: `locomotion.bounded@1.1.0`,
  `combat.health@1.1.0`, `interaction.projectile-contact@1.1.0`, and
  `interaction.contact-resolution@1.1.0`.

No Batch 1 manifest, bundle, graph, profile, or evidence identity is rewritten.

The first review accepted `intent.focus`, Batch 2 nearest targeting, the four
compatible versions, conditional trigger timer reservations, and evidence-only
score bonus. The second review accepted delivery modifier budgeting, internal
contact policy order, and independent pools with aggregate contention. The third
review accepted Revision 3's evidence timing, attack V2, timer grant, and stale
direction decisions but found missing schema/state-machine detail. Revision 4
closed those details and passed user review on 2026-07-18.

ADR 0027 establishes Manifest 1.3, Assembly 1.2, and Graph 1.3 because the
existing 1.2/1.1/1.2 schemas are strict and immutable. That accepted version
boundary requires explicit ADR acceptance; it does not change the frozen
gameplay semantics in this packet.

## Non-goals

- No factory source, generated browser catalog, or modular scene migration.
- No reflection, arbitrary modifier path, raw Phaser group, or broad actor read.
- No source transfer, reflection, absorption, cancellation, or cross-channel
  custody transfer.
- No score mutation; Batch 2 emits pickup and graze evidence for Batch 3 scoring.
- No waves, Boss phases, outcomes, homing, dash, charge, ammo, or equipment.
- No combined touch-control layout; that remains Batch 4. Batch 2 touch tests use
  declared pointer input without claiming a final dual-stick user experience.

## Contract principles

1. Every Batch 2 production definition uses Manifest 1.3 after ADR 0027
   acceptance and one strict local Zod configuration schema with unknown-field
   rejection. Batch 1 remains Manifest 1.2.
2. Every definition has a canonical configuration descriptor, canonical resource
   reservation descriptor, pure reservation evaluator, admitted self-contained
   bundle, and exact runtime grants.
3. New reads are resolver-issued, role-bounded snapshots. They never expose a
   directory, pool, group, entity handle, iterator, or engine object.
4. New source mutation is performed only by a host prepared commit after all
   output payloads and bindings are validated.
5. Damage continues through one same-owner linear `combat.damage-sink@1.0.0`
   route. Shield and invulnerability never call health directly.
6. Batch 1 payload IDs are immutable. New semantics receive new payload IDs.
7. Pause retains simulation state but owns no input, timer, overlap, port, or
   update start lease. New game always disposes and reinstantiates.
8. Fixed-template and Batch 1 browser gates remain required regressions.

## Required ABI review before module factories

These additions need a separate accepted ADR because they expand authority
beyond the Batch 1 restriction. The recommended record is ADR 0027.

### A. Payload registry additions

All values are strict, frozen, and bounded. Routable state/events are registered
in the runtime payload registry used for graph routing; transaction-local plans
use an execution-contract schema and are explicitly forbidden as graph ports.

| Payload ID                         | Delivery          | Required semantics                                                                                                    |
| ---------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| `aim-command-v1`                   | state             | source, revision, active flag, and either normalized direction or finite world point                                  |
| `attack-intent-v1`                 | event             | source, sequence, `press/release`, pointer/key identity, and event time; hold cadence belongs to the trigger          |
| `focus-state-v1`                   | state             | source, revision, focused boolean, and event time                                                                     |
| `target-solution-v1`               | state             | resolved attack-channel ID, normalized published direction, and optional evidence-only actor generation/revision      |
| `attack-request-v2`                | event             | resolved attack-channel ID, channel-local slot `primary`, request sequence, and request time; Batch 1 v1 is unchanged |
| `movement-scale-v1`                | state             | revision and bounded multiplier in `(0, 1]`                                                                           |
| `defense-state-v1`                 | state             | owner, defense kind, current/maximum value, active-until time, revision, and reason                                   |
| `defense-result-v1`                | event             | damage identity, accepted/blocked/absorbed amounts, and defense revision                                              |
| `graze-v1`                         | event             | projectile channel/entity/generation, player owner, distance evidence, and one-shot sequence                          |
| `pickup-collected-v1`              | event             | pickup/collector/effect plus host sequence, time, shared commit evidence, and ordinal `0`                             |
| `modifier-application-v1`          | event             | target/field/operation/value plus host sequence, time, shared commit evidence, and ordinal `1..N`                     |
| `pickup-effect-event-envelope-v1`  | schema mixin      | host-owned sequence, time, commit sequence/evidence, and event ordinal; never a standalone graph port                 |
| `modifier-state-v1`                | state             | target instance, closed field ID, bounded effective value, and revision                                               |
| `health-state-v2`                  | state             | Batch 1 health fields plus `healed` and `modified` reasons without widening `health-state-v1`                         |
| `pickup-collected-template-v1`     | transaction-local | collected identity/effect fields only; all host-owned envelope/evidence/ordinal fields absent                         |
| `modifier-application-template-v1` | transaction-local | exact target/field/operation/value only; all host-owned envelope/evidence/ordinal fields absent                       |
| `pickup-effect-plan-v1`            | transaction-local | immutable collected template plus an ordered bounded array of application templates; never routable                   |

`target-selection-v1` remains the Batch 1 direction-only state. It is not widened
into a union because reusing that ID would change already-admitted semantics.

### B. Resolved actor snapshot read

Add Manifest 1.3 descriptor `actorSnapshotReads` and corresponding resolved
grant. Each descriptor declares:

- `readId`;
- allowed owner relation (`same-owner` or `different-owner`);
- exact source and target actor roles;
- maximum returned snapshots;
- `entryFields`, selected from the closed set `actorId`, `actorGeneration`,
  `role`, `active`, `position`, `collisionRadius`, and `healthRatio`;
- exact envelope fields `directoryRevision`, `sampledAtMs`,
  `sampledFrameSequence`, and `entryCount`;
- stable order (`distance-then-actor-id-generation` or
  `actor-id-generation`);
- for distance order, `distanceOrigin: owner-position-same-snapshot`.

The runtime service accepts only the descriptor ID and returns a newly frozen
snapshot envelope capped by the resolved grant. `entryCount` equals the returned
array length. Sample time and frame sequence come from the graph simulation
clock/frame that performs the atomic directory read; they are not factory-
selected fields. `targeting.nearest` must explicitly request
`actorId/actorGeneration/role/active/position` plus every envelope field. No
other module inherits that read. `targeting.directional` needs only
`readOwner()` when an aim command contains a world point.

For distance ordering, the service samples the owner position inside the same
atomic directory read and uses it internally as the descriptor-fixed distance
origin. It sorts by squared Euclidean distance from that position, then
`actorId`, then `actorGeneration`. The rule is recorded in resolved/readiness
evidence; the owner position is not returned as undeclared envelope data. The
factory never supplies an unverified origin or receives an undeclared actor
field.

The graph-owned actor directory supplies a monotonic non-negative
`directoryRevision`. It increments on every accepted snapshot-relevant actor
registration, generation change, activation/inactivation, position change, or
removal. Actor identity is `(actorId, actorGeneration)`; generation increments
before an ID is reused. A nearest snapshot carries both values plus the one
directory revision observed by the complete read.

`targeting.nearest` computes and publishes a normalized direction from that
single frozen snapshot. Its optional actor reference, actor generation, and
directory revision are evidence only. Delivery consumes only the already
published direction and never resolves or revalidates the reference. If the
target moves, becomes inactive, or is replaced before an attack, that attack
continues along the published direction. The next targeting update reads a new
snapshot and publishes a new selected or configured fallback direction.

The stale-snapshot assertion is therefore deterministic: after a solution is
published, mutate/remove/reuse the referenced target and deliver an attack
before the next targeting update; the emission must use the old published
direction. After the next targeting update it must use the newly selected or
fallback direction and the newer directory revision/generation evidence.

### C. Resolved entity-channel snapshot read

Add `entityChannelReads` for non-mutating graze inspection. A descriptor binds
one state input carrying `entity-channel-v1`, an exact source entity role, target
actor roles, maximum live entries, and the closed fields `entityId`,
`generation`, `position`, `collisionRadius`, and `active`.

The service returns a frozen generation-aware snapshot in entity-ID order.
Capacity is derived from the resolved source channel grant, not trusted from
factory configuration. This authority permits no activate, recycle, consume, or
transfer operation.

### D. Two-phase prepared pickup effect commit

Keep ADR 0026 `contactCommit` unchanged for Batch 1 `hit -> damage`. Add a
separate host-managed `preparedEffectCommit` descriptor for pickup collection.
It declares:

- one mutation-channel state input;
- admitted source operation, initially only `consume`;
- one exact `pickup-effect-plan-v1` profile and reviewed synchronous planner;
- one ordinary collected output port and one non-routable addressed-application
  route source ID with exact payload types;
- maximum concurrent prepared commits;
- bounded duplicate-ledger capacity;
- one evidence profile ID.

`progression.modifier` uses restricted execution model
`pickup-effect-plan-transform-v1`. During prepare, the host creates an immutable
`pickup-collected-template-v1` with no final event sequence, emission time,
commit sequence/evidence ID, or event ordinal and invokes that admitted
synchronous planner. The planner receives only validated configuration and the
template; it has no ports, clock, entity, mutation, lifecycle, async, or host-
service authority. It returns exactly once with an immutable
`pickup-effect-plan-v1` containing zero or more ordered
`modifier-application-template-v1` values.

Both final routable events use the host-owned
`pickup-effect-event-envelope-v1`: `sequence`, `emittedAtMs`, `commitSequence`,
`commitEvidenceId`, and `eventOrdinal`. Stable transaction-local output identity
is `(commitEvidenceId, eventOrdinal)`. Both template schemas exclude the entire
envelope; the planner cannot supply placeholders, timestamps, ordinals, source
evidence, or guessed IDs. For an application, its source evidence is exactly the
envelope's `commitEvidenceId`, with no second independently writable field.

Prepare validates the event token, source identity/generation, mutation grant,
planner/profile identity, effect mapping, exact singleton addressed target routes,
receiver-advertised fields/operations/bounds, every non-reserved template field,
output order, and all capacities without a side effect or evidence allocation.
A planner throw, thenable, missing/double return, identity change, reserved-field
injection, unknown target, or invalid template fails prepare, leaves the pickup
active, and creates no sequence hole. Immediately after reserving the slot and
installing the provisional duplicate marker, the host registers a no-throw
unwind. Any failure before capability return atomically releases that pair in
prepare-creation order before propagating the error. It leaves no provisional or
durable duplicate state and consumes no identity or capacity; the same source
can prepare again, and repeated failures cannot exhaust concurrent slots or the
duplicate ledger. An abandoned returned capability uses the same unwind.

Commit follows the ADR 0026 timing boundary:

1. revalidate the capability, event token, graph phase, source generation, and
   reserved slot;
2. allocate one monotonic commit sequence, one commit evidence ID, and one
   contiguous global event-sequence block of `1 + applicationCount` entries;
3. construct new final `pickup-collected-v1` and
   `modifier-application-v1` objects from the templates by filling only the
   host-owned envelope/evidence/ordinal fields. Collected has `eventOrdinal=0`;
   applications use ordinals `1..N` in plan order; every output has
   `sequence=eventSequenceBase+eventOrdinal`, the same commit-time
   `emittedAtMs`, `commitSequence`, and `commitEvidenceId`;
4. validate and freeze every final payload and its already-resolved singleton
   addressed route, and prove every target-handler lease active, before any
   callback or source mutation;
5. install the durable duplicate marker and mark the slot `committing`;
6. consume physical then logical custody;
7. mark committed without further schema, lookup, or allocation work, then
   broadcast collected through its ordinary port and deliver every application
   exactly once to its addressed handler in fixed plan order.

An abandoned prepare allocates no evidence ID. No downstream module dynamically
derives an application after consumption. Indeterminate mutation emits nothing
and enters quarantine. A receiver hook can still throw while handling a valid
delivered application; as with ADR 0026 post-source result delivery, that is a
terminal graph failure after a committed consume, not a payload, mapping, or
binding validation failure.

An unexpected host finalization failure after allocation but before mutation
leaves the source active, terminally fails the graph, and records the allocated
commit sequence, evidence ID, event-sequence block, and suppressed ordinals in
immutable failed-commit evidence. An indeterminate source mutation records the
same identities in quarantine evidence. A committed delivery failure consumes
all identities normally. Thus abandoned prepare consumes nothing; every commit
attempt consumes and durably accounts for one commit/evidence identity and its
complete event block, with no unreported sequence hole.

Addressed application bindings are a distinct Assembly 1.2 binding kind and are
not ordinary router bindings. The resolver hashes one route per exact target
instance/input/field/operation; `ports.emitEvent` cannot use them. Each route has
one start-scoped target-handler lease. Missing leases fail before mutation; a
handler throw after consumption does not roll back or skip later routes. The
host records each ordinal's singleton route result, attempts the remainder, and
terminally fails afterward. Broadcasting one application to all modifier inputs
is forbidden.

### E. Closed modifier targets

Add a `modifierTarget` descriptor to receiving manifests. It declares a closed
`fieldId`, accepted operation (`add` initially), input port, finite lower and
upper bounds, and reset semantics. The resolver must match every addressed
`modifier-application-v1` route to one exact advertised target instance and
field. Ordinary broadcast bindings are forbidden. Factories receive no object
path, property name, reflection primitive, or write service.

Initial admitted fields are:

- `combat.health.current` (`add`, clamped to maximum);
- `combat.shield.current` (`add`, clamped to configured maximum);
- `attack.damage.multiplier` (`add`, bounded additive bonus above `1`);
- `attack.projectile-count.bonus` (`add`, bounded integer).

Score bonus is deliberately absent until the Batch 3 score transaction sink is
available.

### F. Compatible locomotion version

`locomotion.bounded@1.1.0` retains every 1.0 behavior and adds one optional
same-owner state input `speedScale: movement-scale-v1`. Missing input means
exactly `1`. Absolute touch positioning remains unscaled. Velocity-direction
commands multiply `moveSpeed` by the current scale. The new version has its own
manifest, bundle, tests, and evidence; Batch 1 remains pinned to 1.0.0.

### G. Compatible contact and health versions

Batch 1 contact is deliberately bound to `delivery.projectile@1.0.0`; matching
an entity-channel payload does not authorize a spread or pattern channel.
`interaction.projectile-contact@1.1.0` instead requires the abstract owner-
scoped capability `delivery.projectile-channel@1.0.0`, while retaining the same
mutation-free candidate behavior and bounded duplicate ledger.

Capability satisfaction alone does not grant a channel. The 1.1 detector also
declares its exact source-channel input and projectile consumer descriptor. The
resolver binds that input to exactly one provider that both owns the bound
`entity-channel-v1` output and provides the abstract capability, then records
provider/capability/binding/channel lineage. Candidate and resolution mutation
grants must inherit the same lineage; a same-capability wrong provider/channel
or split lineage blocks readiness.

`interaction.contact-resolution@1.1.0` requires the corresponding contact-
candidate capability rather than a hard dependency on the 1.0 detector. It
retains the ADR 0026 default-damage profile, consume-only mutation grant,
source-first prepared contact commit, and exact hit/damage order.

Every Batch 2 projectile delivery provides both its specific capability and
`delivery.projectile-channel@1.0.0`. This does not retroactively alter the Batch
1 delivery manifest.

`combat.health@1.1.0` remains the unique terminal damage sink and adds one
optional `modifier-application-v1` input for the exact
`combat.health.current` target. It publishes `health-state-v2` so healing is a
new versioned semantic rather than an illegal new reason in
`health-state-v1`. Batch 1 health remains pinned to 1.0.0.

### H. Attack-channel ownership and payload version

Batch 1 `attack-request-v1` remains immutable with channel-local slot
`channel: "primary"`. Batch 2 introduces `attack-request-v2`; it carries both a
strict resolved `attackChannelId` and `slot: "primary"`. V1 and V2 ports are not
compatible and the resolver cannot adapt them implicitly.

Each Batch 2 targeting, trigger, and delivery manifest declares exactly one of
the descriptors `attackTargeting`, `attackTrigger`, or `attackDelivery`. Every
descriptor identifies the same strict configuration field `attackChannelId`
and its exact target/request port. The resolver constructs a channel record
keyed by `(ownerActorId, attackChannelId)` and requires exactly one targeting,
one trigger, and one delivery owner with matching V2 payloads and bindings.
Duplicate roles, missing roles, owner mismatch, channel mismatch, or V1/V2
mixing block Graph 1.3 readiness.

`target-solution-v1` and `attack-request-v2` both carry the resolved channel ID.
The delivery validates both against its grant before reading direction or
snapshotting modifiers. The literal `primary` is only the attack slot inside one
resolved channel; it is not an assembly-wide channel identity.

One targeting instance owns exactly one attack channel and cannot publish one
solution directly to multiple channels. Fan-out occurs only before targeting:
one retained `aim-command-v1` state may bind to multiple separately configured
targeting instances, each of which computes and publishes its own channel-bound
solution. This keeps channel ownership and state replay mechanically provable.

The descriptors are resolved evidence and cannot be synthesized by a factory.
Modifier, contact, and observation bindings must name the same resolved attack
channel where applicable.

All identity-bearing counters use the ADR 0027 `safe-monotonic-v1` rule. Actor/
entity generation, directory revision, attack/commit/evidence/event sequences,
and contiguous sequence blocks never wrap, saturate, or reuse a live-scope
value. Every next value and inclusive block end is preflighted against
`Number.MAX_SAFE_INTEGER`; overflow terminally fails before registration,
mutation, delivery, or identity-bearing evidence.

A mixed Graph 1.3 selects factory context by admitted manifest version.
Manifest 1.2 modules receive the exact unchanged V1.2 context/service matrix and
no V1.3 grant; Manifest 1.3 modules receive a distinct exact context limited to
resolved V1.3 authority. The contract gate includes mixed resolver, isolated-
runtime, and desktop/mobile browser conformance fixtures.

## Module contracts

All resource values below are reservation formulas. Manifest ceilings must be
equal or greater, and resolution fails when a formula exceeds a ceiling.

### Intent, locomotion, targeting, and trigger

| Module                         | Configuration                                                                              | Ports and ownership                                                                                   | Exact reservation                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `intent.directional-aim@1.0.0` | `source: pointer-world/keyboard-vector`, bounded dead zone, normalization, pointer capture | input registration(s); state out `aim: aim-command-v1`; owns one aim device source                    | zero gameplay resources; exact input/observation leases          |
| `intent.active-attack@1.0.0`   | admitted devices, key/button, pointer capture                                              | input registration(s); transition event out `intent: attack-intent-v1`; owns one attack device source | zero gameplay resources; exact input/observation leases          |
| `intent.focus@1.0.0`           | admitted key/button and initial false                                                      | input registration(s); state out `focus: focus-state-v1`; owns one focus device source                | zero gameplay resources; exact input/observation leases          |
| `locomotion.focus-speed@1.0.0` | multiplier `0.1..1`, release behavior `restore`                                            | state in `focus`; state out `scale: movement-scale-v1`; owns primary movement-scale policy            | zero gameplay resources; state cache and observation only        |
| `locomotion.bounded@1.1.0`     | identical to 1.0                                                                           | existing movement event plus optional `speedScale`; owns actor transform                              | identical to 1.0; no new timer/entity grant                      |
| `targeting.directional@1.0.0`  | `attackChannelId`, point fallback direction, zero-vector policy `retain-last`              | state in `aim`; channel-bound state out `selection: target-solution-v1`; owns one `attackTargeting`   | zero gameplay resources; owner read only                         |
| `targeting.nearest@1.0.0`      | `attackChannelId`, range, allowed roles, inactive policy, no-target fallback               | channel-bound state out `selection: target-solution-v1`; exact actor read; owns one `attackTargeting` | zero gameplay resources; one bounded snapshot read per update    |
| `trigger.active@1.0.0`         | `attackChannelId`, mode `press/hold-repeat/release`, repeat interval, initial delay        | event in `intent`; channel-bound event out `request: attack-request-v2`; owns one `attackTrigger`     | timers `0` for press/release, `1` for hold-repeat; zero entities |

The canonical reservation descriptor uses deterministic
`conditional-enum-v1`: `press` and `release` evaluate to exactly zero timers;
`hold-repeat` evaluates to exactly one. Unknown modes, descriptor/evaluator
drift, a zero-grant hold timer, and the first timer above the exact grant are all
rejected. There is no reserve-one fallback for press/release modes.

#### Active trigger state machine

The configuration is a strict discriminated union. `press` and `release` modes
have no timer fields. `hold-repeat` alone requires integer `initialDelayMs`
(`0..10000`) and `repeatIntervalMs` (`50..10000`). Runtime states are the closed
set `idle`, `held-edge`, `held-waiting`, and `held-repeating`; each non-idle state
stores exactly one captured pointer/key input identity.

- In `idle`, the first valid `press` captures its identity. Press mode emits one
  channel-bound request synchronously and enters `held-edge`. Release mode emits
  nothing and enters `held-edge`. Hold-repeat schedules its sole timer, emits
  nothing synchronously, and enters `held-waiting`.
- In any non-idle state, repeated `press` from the captured identity is a
  browser-repeat duplicate and is ignored with bounded observation. Press from a
  different identity is ignored until the captured identity releases. No timer
  or request is created by either case.
- A `release` in `idle`, or from a non-captured identity, is isolated and ignored.
  A matching release in `held-edge` emits exactly once only for release mode,
  then returns to `idle`. A matching release in either hold state cancels the
  live timer before returning to `idle` and emits nothing.
- At the exact first timer due time, a still-captured hold-repeat emits one
  request and changes `held-waiting -> held-repeating`. Each later exact interval
  emits one request while held. `initialDelayMs=0` means the next exact timer-
  dispatch boundary, never a synchronous emission inside the press handler.
- Every request receives the next trigger sequence and the descriptor's resolved
  attack channel. Duplicate or ignored inputs do not consume a sequence.

Top-level transition IDs define same-time ordering. An input transaction already
accepted before the frame timer transition runs first, so a same-time matching
release cancels the due timer. Once a frame transition has begun, ADR 0026 exact
timers dispatch before later queued input; that callback may emit once before the
release transaction. Stop follows the same guard order: stop-first cancels with
no emission, while an already-running timer transaction completes before stop.
There is no concurrent tie or factory-selected ordering.

Stop/pause cancels the timer, clears the captured identity, and explicitly resets
the active-trigger state to `idle`; this is the contract-authorized exception to
ordinary retained instance state. Start/resume schedules nothing. If the physical
control remains down, the subsequent isolated release is ignored and a new
press is required to attack again. Cadence is never silently continued or
restarted across pause. Dispose performs the same reset and new-game
reinstantiation starts at `idle` with sequence zero.

### Projectile and pattern deliveries

All ten modules below own one resolved attack channel. Each consumes
`target-solution-v1` state, `attack-request-v2` events, and optional
`modifier-application-v1` events; owns one independent projectile pool/channel;
publishes `entity-channel-v1` and `modifier-state-v1`; and emits `emission-v1`.
They never apply damage directly. The same contact/resolution path can consume
their projectile channels through the compatible 1.1 detector/resolver pair.

| Module                                 | Formation-specific configuration                                |
| -------------------------------------- | --------------------------------------------------------------- |
| `delivery.spread@1.0.0`                | projectile count `1..64`, total arc `0..360`, centered ordering |
| `delivery.multi-shot@1.0.0`            | projectile count `1..64`, lateral spacing, centered offsets     |
| `delivery.pattern.radial@1.0.0`        | count and base-angle offset                                     |
| `delivery.pattern.spiral@1.0.0`        | count and bounded rotation step                                 |
| `delivery.pattern.fan@1.0.0`           | count and required arc                                          |
| `delivery.pattern.aimed@1.0.0`         | count and bounded aim spread                                    |
| `delivery.pattern.wave@1.0.0`          | count, bounded wave spread, and phase step                      |
| `delivery.pattern.rain@1.0.0`          | count, bounded spread, and downward base direction              |
| `delivery.pattern.rotating-ring@1.0.0` | count and bounded ring rotation step                            |
| `delivery.pattern.burst@1.0.0`         | count, bounded burst spread, and stable emission index          |

Shared strict fields are `attackChannelId`, speed, positive base damage, texture
role, spawn offset, `maxActive`, `maximumAcceptedRequestsPerSecond`,
`maximumCountBonus`, `maximumDamageMultiplier`, recycle margin, and
`drop-and-observe` exhaustion. Pattern-specific schemas expose only fields used
by that planner. The fixed planner enum value `rotatingRing` is mapped at the
adapter boundary; it does not leak into module IDs.

`maximumAcceptedRequestsPerSecond` is a positive integer. Cross-field validation
requires `baseCount + maximumCountBonus <= maxActive`, so an empty pool can
represent the largest admitted salvo. Existing active entities may still cause
the stable suffix drop described below.

Every delivery advertises two exact modifier targets:

- `attack.damage.multiplier`, finite additive input, initial bonus `0`, clamped
  so the effective multiplier is `1..maximumDamageMultiplier`;
- `attack.projectile-count.bonus`, non-negative integer additive input, initial
  `0`, clamped to `maximumCountBonus`.

Modifier state is retained across pause/resume and reset only by disposal/new
graph instantiation. Application delivery updates the state synchronously. An
attack handler snapshots both effective values exactly once on entry, so a later
application cannot change that request or any active projectile. For that
snapshot:

`effectiveCount = baseCount + min(countBonus, maximumCountBonus)`

`effectiveDamage = baseDamage * min(1 + damageBonus, maximumDamageMultiplier)`

Every activated entity and `emission-v1` value carries the snapshotted effective
damage. No modifier mutates an already active entity.

For every delivery:

- it provides `delivery.projectile-channel@1.0.0` in addition to its specific
  capability;
- `activeEntities = maxActive`;
- `activeProjectiles = maxActive`;
- `spawnsPerSecond = maximumAcceptedRequestsPerSecond * maximumEffectiveCount`,
  where `maximumEffectiveCount = baseCount + maximumCountBonus`;
- `timers = 0`;
- requested, planned, activated, and dropped counts are observable;
- stable spawn order is planner order, then entity generation;
- a request above `maximumAcceptedRequestsPerSecond` is dropped in stable
  simulation-time/sequence order and observed; pool exhaustion may then drop a
  stable suffix of the already planned salvo;
- simultaneous modules own independent physical pools/channels but contend
  through one assembly aggregate projectile/spawn budget in resolved module
  order, never through runtime randomness.

The reservation evaluator uses the maximum reachable modifier values rather
than the initial values. Multiplication must be a safe integer and remain within
the manifest ceiling. Configuration or a graph whose aggregate worst case
exceeds a budget fails resolution; modifier growth cannot create an unreserved
spawn allowance at runtime.

The eight adapters must call one shared reviewed pure planner implementation.
The build step bundles that source into the self-contained admitted artifact;
factories may not import repository files at browser runtime and may not copy
eight divergent geometry implementations by hand.

### Defense and graze

| Module                                | Configuration                                                                     | Ports and route                                                                        | Exact reservation                                                                        |
| ------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `combat.invulnerability-window@1.0.0` | duration `0..10000 ms`, initial inactive, accepted damage kinds                   | damage event in/out, defense state/result out; filter damage sink and route head       | zero timers/entities; clock read, state cache, observation                               |
| `combat.shield@1.0.0`                 | maximum/initial strength, accepted damage kinds, overflow policy `pass-remainder` | damage event in/out, modifier event in, defense state/result out; filter damage sink   | zero timers/entities; state cache and observation                                        |
| `combat.graze@1.0.0`                  | player/bullet radii, margin, ledger ceiling                                       | projectile channel state in, `graze-v1` event out, owner read plus entity-channel read | zero timers/entities; one update lease; ledger capacity equals resolved channel capacity |

The legacy-equivalent player route is fixed as:

`damage producer -> invulnerability -> shield -> terminal health`

On first accepted damage, invulnerability forwards the original immutable
damage, sets `activeUntilMs = now + duration`, and publishes evidence. During
the window it emits a blocked defense result and no downstream damage. Shield
absorbs `min(current, amount)`, publishes state/result, emits no downstream
event for a fully absorbed hit, and otherwise forwards a new immutable damage
payload carrying the same source/contact identity and the positive remainder.

The invulnerability interval is half-open: damage is blocked exactly when
`nowMs < activeUntilMs`. Duration zero therefore blocks nothing, a second damage
event at the same simulation time is blocked when duration is positive, and
damage at exact expiry is accepted. Simulation time is frozen during pause, so
the remaining interval is retained. Same-time damage events follow event-
transaction sequence order; the first accepted event updates the window before
the next event is evaluated.

Graze is not a damage sink and never mutates a projectile. Its one-shot key is
`channel/entity/generation/player`. It removes stale entries when a generation
disappears from the authorized channel snapshot and fails before unbounded
growth. The annulus inequality remains the ADR 0013 rule.

### Pickups and modifiers

| Module                             | Configuration                                                                                        | Ports and authority                                                                                         | Exact reservation                                                                                      |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `progression.pickup-spawn@1.0.0`   | bounded ordered schedule, effect ID, value, position/lane, fall speed, texture role, max active/rate | owns pickup pool/channel and publishes channel/emission evidence                                            | entities `maxActive`, projectiles `0`, rate `maximumSpawnRate`, one scheduler timer                    |
| `progression.pickup-collect@1.0.0` | source role `pickup`, target role `player`, duplicate ceiling, effect-plan/commit profile            | pickup channel state in; overlap candidate internal; collected/application outputs owned by prepared commit | zero owned entities; one overlap; commit/ledger capacities derived from source channel/config ceilings |
| `progression.modifier@1.0.0`       | closed effect-to-exact-target table, maximum applications per pickup, and per-field bounds           | restricted synchronous `pickup-effect-plan-transform-v1`; no routable ports or lifecycle factory            | zero gameplay resources and leases; host bounds returned plan by the profile ceiling                   |

The initial effect mapping is:

| Pickup effect | Batch 2 result                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `heal`        | application to `combat.health.current`                                                                                   |
| `shield`      | application to `combat.shield.current`                                                                                   |
| `weaponPower` | bounded `attack.damage.multiplier` and/or `attack.projectile-count.bonus` state for an explicitly bound Batch 2 delivery |
| `scoreBonus`  | collected evidence only; Batch 3 scoring consumes it                                                                     |

During prepare, the host invokes the reviewed modifier planner to produce the
complete template plan and validates every non-reserved field, target, binding,
and capacity. Commit allocates the evidence ID, constructs/validates/freezes all
final payloads, then consumes the source before delivering
`pickup-collected-v1` and the ordered applications. A full health bar may produce
an applied value of zero in defense state evidence, but modifier applications
carry the requested positive value and the receiver owns clamping. No final
application is first constructed after the pickup has been consumed.

## Representative resolved graphs

The contract gate requires these ready Graph 1.3 fixtures before factories:

1. Desktop directional active attack:
   `directional-aim -> directional-targeting[channel=player.primary]` and
   `active-attack -> active-trigger[channel=player.primary] ->
spread[channel=player.primary] -> projectile-contact@1.1 ->
contact-resolution@1.1[default-damage profile] -> enemy damage-route head ->
health`.
2. Focus locomotion:
   `keyboard/touch -> arbiter -> bounded@1.1` plus
   `focus intent -> focus-speed -> bounded@1.1 speedScale`.
3. Defense route:
   enemy projectile contact/resolution -> player invulnerability -> shield ->
   player health@1.1, with graze reading the same enemy projectile channel. It
   covers duration zero, same-time consecutive damage, and exact expiry.
4. Pattern matrix: each of the eight adapters resolves independently, and one
   graph contains at least three simultaneous pattern owners with distinct
   `attackChannelId` values. Their independent pools/channels exhaust the same
   assembly aggregate projectile/spawn budgets in stable resolved order.
5. Pickup path:
   pickup spawn -> collect prepare -> restricted modifier effect-plan transform
   -> host validates complete plan -> prepared consume -> collected/applications
   -> health/shield and one Batch 2 delivery modifier target.
6. Nearest targeting:
   stable enemy/Boss snapshots -> nearest -> one delivery, including empty,
   equal-distance, inactive, out-of-range, and stale-snapshot cases. A stale
   reference must not be re-resolved by delivery: the pre-update request uses
   the old published direction, and the post-update request uses the new or
   fallback direction.

Matching names are insufficient. Each graph must include exact payload,
authorization, owner relation, resource, asset, lifecycle, factory-handle, and
readiness evidence.

## Rejection matrix

Resolution or runtime must fail closed for at least:

- aim point with non-finite coordinates or active zero direction;
- attack phase outside the configured set or a duplicate input identity;
- focus wired directly to actor motion or locomotion reading device input;
- nearest targeting without the exact role/range/snapshot grant;
- actor or channel snapshots above the resolved count;
- an actor snapshot returning an undeclared entry/envelope field, an entry count
  mismatch, a non-monotonic directory revision, or distance order based on a
  position outside the same atomic snapshot;
- delivery bound to `target-selection-v1` instead of `target-solution-v1`;
- a Batch 2 trigger/delivery bound through `attack-request-v1`, any V1/V2
  implicit adapter, or a target/request channel ID different from the resolved
  delivery channel;
- one targeting instance bound directly to multiple attack channels;
- a delivery that resolves the evidence-only target reference again instead of
  consuming the published direction;
- formation count/rate/active capacity one over its exact grant;
- pattern-specific fields on the wrong adapter;
- two delivery owners for one `(ownerActorId, attackChannelId)` pair;
- damage bypassing the resolved route head, shield after health, a route fork,
  or a second terminal sink;
- graze with mutation authority, stale generation reuse, or ledger overflow;
- pickup collection without a consume grant, without a reviewed effect-plan
  profile, or with output before source commit;
- an application route represented as an ordinary broadcast binding, resolving
  to zero/multiple targets, or delivered to a target other than its route;
- a projectile consumer satisfied by the right abstract capability on the wrong
  provider/channel, or a candidate/mutation grant with split lineage;
- an effect planner that is async, changes identity, returns an unknown target,
  exceeds its application ceiling, injects a host-reserved evidence field, or
  constructs an invalid template;
- a failed prepare retaining its provisional marker/slot, blocking same-source
  retry, or reducing capacity after repeated failures;
- prepare-time evidence allocation, commit-time mutation of a template, or
  source mutation before final payload construction/validation/freeze;
- a template containing any host-owned envelope/evidence/ordinal field,
  non-contiguous application ordinals, or an output sequence different from
  `eventSequenceBase + eventOrdinal`;
- any identity counter wrap/saturation/reuse, or a single/block overflow detected
  after registration, mutation, delivery, or identity-bearing evidence;
- indeterminate pickup mutation followed by any collected/modifier event;
- modifier target by path, unknown field ID, wrong instance, wrong operation,
  non-finite value, or result outside receiver bounds;
- delivery reservation based on initial rather than maximum reachable modifier
  state, or an attack request changing its modifier snapshot mid-emission;
- active-trigger duplicate press emission, isolated/wrong-identity release
  emission, hold emission before its exact timer boundary, cadence surviving
  pause, or same-time ordering that contradicts the transition guard;
- invulnerability blocking duration zero or exact-expiry damage, or accepting a
  second same-time damage inside a positive half-open window;
- pause with a live input/timer/overlap/update lease;
- browser catalog drift, Node import, bundle/hash drift, or missing evidence.
- a Manifest 1.2 factory receiving any V1.3 context/service key in a mixed Graph
  1.3, or absence of the mixed isolated/browser conformance evidence.

## Implementation plan after approval

### Step 1: ADR and contract closure

Implement accepted ADR 0027 by adding the new payload schemas/descriptors/
resolved grants, extend readiness and browser catalog evidence, and write only
resolver/red tests. No gameplay factory is admitted in this step.

### Step 2: Control slice

Implement directional aim/targeting, active attack/trigger, focus intent/speed,
`locomotion.bounded@1.1.0`, and nearest targeting. Pass unit, contract,
lifecycle, complete active-trigger state-machine, exact-grant, snapshot-envelope,
root, isolated, desktop, and touch checks.

### Step 3: Delivery slice

Implement spread and multi-shot, then the eight adapters over the shared pure
planner. Prove geometry, modifier snapshots, worst-case reservations, aggregate
budget contention across independent pools, cleanup, and fixed-path regression
before continuing.

### Step 4: Defense slice

Implement invulnerability, shield, the fixed linear route profile, and graze.
Prove no damage bypass, pause-time semantics, terminal cleanup, and graze's
factory-local contract behavior. Enemy-projectile-driven graze integration and
browser evidence require the Batch 3 hostile source and are scheduled there by
the 2026-07-18 user gate amendment; this does not change the frozen factory or
its authority.

### Step 5: Progression slice

Implement pickup spawn, the restricted effect-plan transform, prepared collection
commit, and closed modifier receivers. Prove complete prevalidation before
source-first custody, quarantine failure behavior, exact effects, and no score
mutation.

### Step 6: Complete Batch 2 vertical slice

Compose all source-satisfiable Batch 2 definitions with the required Batch 1
modules into ready graphs. Run focused tests, `pnpm check`, root and isolated
production builds, desktop/mobile browser gates, cleanup/restart evidence, and
preserved fixed template gates. Graze remains admitted and contract-tested, but
its complete hostile-source graph joins the Batch 3 enemy-source gate.

## Browser evidence

Desktop gates use only public keyboard/pointer input and prove directional aim,
press/hold/release edges, duplicate/wrong identities, hold cadence, pause reset,
focus speed, nearest tie-breaking, each formation, half-open defense ordering,
pickup collection, and modifiers. Graze one-shot browser behavior is required in
Batch 3 after a legal hostile projectile source is admitted.

Mobile gates use only public touch input and prove pointer aim/attack where the
module declares touch support, existing touch-drag movement, simultaneous
resource caps, readable evidence, pause/resume, cleanup, and restart. They do
not claim final combined-touch ergonomics.

The completed Batch 2 gates record peak entities/projectiles, spawn rate, live
timers, read snapshot maxima, prepared-commit counts, dropped-by-cap counts,
damage-route trace, pickup ledgers, quarantine state, and zero cleanup residue.
The modular graze read trace and ledger are recorded by the Batch 3 gates after
the legal hostile projectile source is admitted.

## Review disposition and remaining gate

Accepted in the first review:

1. Add `intent.focus` as the missing intent provider.
2. Include `targeting.nearest` in Batch 2 and reconcile ROADMAP wording.
3. Add four compatible versions instead of mutating Batch 1 manifests.
4. Use conditional exact timer reservations for `trigger.active`.
5. Keep score bonus evidence-only until Batch 3.

Revision 4 retains every previously accepted closure and adds the missing
freeze-level detail: actor snapshot grants now distinguish authorized entry
fields from envelope metadata and fix the distance origin; pickup templates omit
every host-owned field and one commit receives a shared evidence ID plus
contiguous ordinal-derived event sequences; active trigger has a closed input,
timer, lifecycle, and same-time ordering state machine; invulnerability uses a
half-open interval.

Revision 4 is approved and frozen. Accepted ADR 0027 contains the required
bounded actor/channel reads and snapshot envelopes, two-phase prepared
template/finalization and multi-output identity, V2 attack-channel payloads and
ownership, conditional timer descriptors, abstract projectile-channel
compatibility, closed modifier targets, and strict version boundary. Factory
implementation was authorized after the ADR and contract/red tests were
accepted; all 27 definitions are now admitted.

The 2026-07-18 user decision amends only the delivery schedule: because enemy
sources are Batch 3 scope, hostile-projectile-driven graze integration and
desktop/mobile evidence move to Batch 3. The Manifest 1.3 graze contract,
factory, reservations, rejection rules, and ADR 0027 authority remain frozen.
