# Batch 3 Encounter, Scoring, Outcome, and Legacy-Parity Design

Updated: 2026-07-18  
Status: Revision 2 freeze candidate; implementation blocked pending ADR 0028 acceptance

## Purpose and authority

This packet freezes the detailed Batch 3 design boundary for Phase 7 legacy
parity. It adds legal enemy/Boss actor and projectile sources, bounded encounter
execution, scoring, terminal outcomes, and a complete modular legacy assembly
without changing any accepted Manifest 1.2/1.3, Assembly 1.1/1.2, Graph 1.2/1.3,
ADR 0026/0027, Batch 1/2 factory, or immutable evidence byte.

Revision 2 is a reviewable freeze candidate. It incorporates the three P1 review
findings against Revision 1: fractional legacy score bonuses, the zero combo
window, and frame-tail outcome arbitration. Its hash is bound by proposed ADR 0028. Factory or runtime implementation remains blocked until the user accepts
that ADR. A semantic change requires a numbered packet revision and reviewed ADR
change; editing this packet alone never widens runtime authority.

The product remains the reusable vertical bullet-hell game-generation Agent.
The preserved v2 game is the parity fixture, not the product target.

## Scope and reconciliation

Batch 3 must provide:

- `encounter.scrolling-waves` and `encounter.boss-phases`;
- legal bounded enemy and Boss actor roots;
- hostile radial, spiral, fan, aimed, wave, rain, rotating-ring, and burst
  projectile sources using the already reviewed pure planners;
- enemy-root and Boss-root health/contact execution;
- defeat/combo/graze/pickup scoring and one authoritative score ledger;
- player-health, Boss-defeat, score-threshold, and survival-time conditions plus
  deterministic terminal coordination;
- whole-graph stop, outcome, restart, recovery, browser, and packaging parity.

The base-library table omitted three mechanically necessary adapter roles. This
packet adds reviewed IDs instead of hiding their behavior inside encounter code:

- `targeting.hostile-fixed`, for a configured normalized hostile direction;
- `targeting.hostile-aimed`, for a bounded live player snapshot per emission;
- `scoring.ledger`, for singleton score ownership and duplicate rejection.

It also adds source-specific contact adapters and compatible versions where an
immutable Batch 1/2 contract cannot express actor-root sets. These are catalog
closures, not a product-scope expansion.

## Non-goals

- No Batch 4 dash, homing, beam, field, mine, orbit, cancellation, absorption,
  reflection, polarity, status, equipment, room, arena, objective, or companion.
- No dynamic module source, model orchestration, OpenCode run, paid call, corpus
  expansion, asset download, or new asset role.
- No raw actor directory, Phaser group, sprite, pool, registry, resolver,
  filesystem, environment, network, credential, path, callback, or code in an
  assembly or factory context.
- No mutation of frozen Batch 2 pattern or graze factories. Hostile-compatible
  pattern definitions use a new reviewed version; graze is instantiated unchanged.
- No shared physical projectile pool, cross-channel custody transfer, inferred
  owner role, factory-local global cap, or unbounded actor map.
- No fixed-template retirement. That remains a later explicit user decision.

## Design principles

1. Encounter modules own schedules and actor-root custody, not health, scoring,
   damage policy, or projectile geometry.
2. Dynamic actors are bounded host-minted roots in one resolved root channel;
   factories never create an arbitrary actor ID or generation.
3. Hostile attacks are event pipelines keyed by exact root-channel lineage and
   attack-channel ID. Every request names one active actor generation.
4. Every projectile remains in its delivery instance's physical pool/channel.
   Source deactivation cancels future emissions but does not silently consume
   already active bullets, matching the legacy game.
5. Local pool ceilings and shared hostile caps are distinct evidence. Runtime
   activation must obtain both local custody and aggregate group tokens.
6. Health, score, and outcome have one explicit writer each. Evidence events do
   not grant mutation authority merely because payload names match.
7. Source-first mutation, quarantine, safe counters, phase permissions, and
   exact leases remain at least as strict as ADRs 0026/0027.
8. Every legacy rule is extracted from existing pure planners/evaluators before
   scene logic is replaced.

## Required contract version boundary

Strict existing schemas have no actor-root producer, dynamic hostile-source,
shared-contention, actor-set damage, or terminal-outcome commit descriptors.
Revision 2 therefore proposes:

| Contract        | Preserved production versions | Batch 3 version | Rule                                    |
| --------------- | ----------------------------- | --------------- | --------------------------------------- |
| Module manifest | 1.2.0, 1.3.0                  | **1.4.0**       | Adds only Batch 3 descriptors           |
| Assembly spec   | 1.1.0, 1.2.0                  | **1.3.0**       | Selects exact root/budget/route records |
| Resolved graph  | 1.2.0, 1.3.0                  | **1.4.0**       | Carries exact grants and lineage        |

Graph 1.4 may mix admitted Manifest 1.2, 1.3, and 1.4 instances. V1.2 and V1.3
factories receive their byte-identical context key sets and no V1.4 service.
Graph 1.2/1.3 readiness and browser paths are not reinterpreted.

## Payload registry additions

All new payloads are strict, frozen, bounded, safe-integer sequenced, and covered
by graph/catalog evidence.

| Payload                           | Delivery          | Meaning                                                                         |
| --------------------------------- | ----------------- | ------------------------------------------------------------------------------- |
| `actor-root-channel-v1`           | state             | root-channel ID, producer, role, exact capacity, revision                       |
| `actor-root-lifecycle-v1`         | event             | root ID/generation, source/archetype ID, spawn/deactivate reason, position/time |
| `actor-defeated-v1`               | event             | health-bank evidence requesting exact root deactivation                         |
| `encounter-pattern-activation-v1` | event             | root ref, pattern source/channel, start/end and cadence                         |
| `attack-request-v3`               | event             | source root ref/generation, channel, request sequence, emission index/time      |
| `targeted-attack-v1`              | event             | request identity plus frozen source position and normalized direction           |
| `emission-v2`                     | event             | projectile identity/damage plus source root/channel/generation provenance       |
| `contact-candidate-v2`            | transaction input | projectile-to-root or root-to-static-actor exact lineage                        |
| `contact-decision-v2`             | transaction local | V1 identity rules plus source operation `consume` or `deactivate-root`          |
| `damage-v2`                       | event             | target root ID/generation/channel lineage and positive damage                   |
| `health-state-v3`                 | state             | root ref/source ID, current/maximum/ratio, revision and reason                  |
| `defeat-evidence-v1`              | event             | successful health-depleted root deactivation and base score identity            |
| `score-source-v1`                 | event             | bounded immutable defeat/graze/pickup award input                               |
| `score-transaction-v1`            | event             | unique source evidence, bounded finite non-negative binary64 award and kind     |
| `score-state-v1`                  | state             | total plus bounded source/combo counters and revision                           |
| `outcome-condition-v1`            | state             | candidate, met flag, reason, time, and host-assigned eligible frame sequence    |
| `terminal-decision-v1`            | host commit       | one winning/losing decision, elapsed time, score, source evidence               |

`attack-request-v2`, `target-solution-v1`, `emission-v1`, `damage-v1`, and all
Batch 2 payloads remain unchanged. V2/V3 attack pipelines have no implicit adapter.

## Actor-root authority and custody

### Manifest descriptor

Manifest 1.4 may declare one `ActorRootProducerDescriptorV1`:

```text
producerId
rootChannelOutputPort: actor-root-channel-v1
lifecycleOutputPort: actor-root-lifecycle-v1
actorRole: enemy | boss
capacityConfigurationField
sourceIdsConfigurationField
poolId
assetRoleMappingConfigurationField
movementMode: scrolling-wave-v1 | boss-horizontal-v1
```

The resolver derives one producer grant from validated configuration, admitted
assets, exact `activeEntities` reservation, and the immutable root-channel
capacity. Source IDs and asset-role mappings are closed configuration values;
neither is a runtime path or texture key.

Consumers declare an exact root-channel input, expected role, lineage purpose,
and maximum entries. Purposes are the closed set `pattern-source`, `health-bank`,
`projectile-target`, `body-contact`, `defeat-scoring`, `boss-phase`, and
`outcome`. A binding alone never grants a read or mutation service.

### Host-minted identity

The host preallocates bounded logical slots, but it mints actor identity only on
activation:

```text
actorId = root/<producerInstanceId>/<slotIndex>
identity = (actorId, actorGeneration)
```

Slot index is the lowest free index. Generation, directory revision, lifecycle
sequence, and channel revision use ADR 0027 `safe-monotonic-v1`; overflow fails
before physical or logical mutation. Factories supply only a configured source
ID, admitted asset role, finite position/radius, and allowed movement values.

### Custody protocol

Root custody is host-owned:

```text
inactive -> activating -> active -> deactivating -> inactive
                 \-> quarantined       \-> quarantined
```

Activation atomically preflights identity, reserves the physical slot,
`activeEntities`, and session quarantine capacity, creates the adapter root,
registers the actor-directory generation, then publishes lifecycle evidence.
Deactivation proves physical and logical inactivity before releasing tokens.
Indeterminate activation/deactivation retains conservative tokens and enters the
existing session quarantine ledger. It blocks new graphs, verification, and
packaging exactly as ADR 0026 requires.

Only the producer normally activates/moves/deactivates its roots. A contact
resolver may receive one lineage-bound `deactivate-root` mutation capability;
health banks emit a defeat request back to the exact producer, which performs
the same host protocol. No consumer receives a raw root handle.

Actor-root body contact uses `contact-decision-v2` with only
`damage/deactivate-root`. Projectile contact keeps `damage/consume`. The host
fully validates evidence and delivery before source mutation, mutates the source
first, then delivers damage. Indeterminate source mutation emits no hit, damage,
defeat, score, or outcome event and quarantines custody.

## Hostile attack-source ABI

### Why V2 cannot be reused

Graph 1.3 keys an attack triple by static `(ownerActorId, attackChannelId)`.
`attack-request-v2` carries no source actor generation, and admitted Batch 2
deliveries require the `player-projectile` asset role. Treating an enemy as the
player owner, injecting an actor ID in configuration, or relabeling the texture
would violate frozen authority and is rejected.

### Resolved pipeline

Manifest 1.4 adds `HostileAttackChannelDescriptorV1` with roles:

```text
source:    root channel + activation input -> attack-request-v3
targeting: attack-request-v3 -> targeted-attack-v1
delivery:  targeted-attack-v1 -> hostile projectile channel + emission-v2
```

The resolver keys a channel by
`(rootChannelLineageId, attackChannelId)` and requires exactly one source,
targeting, and delivery instance. It proves exact bindings, payload versions,
source role, asset role `enemy-projectile`, and hostile aggregate-group membership.
Wrong root provider, generation field, faction, role, channel, payload version,
or pipeline order blocks Graph 1.4 readiness.

`trigger.encounter-pattern` maintains a bounded emitter table keyed by
`(rootChannelId, actorId, actorGeneration, patternSourceId)`. On activation it
emits index zero immediately and stores the next due simulation time. Its single
provider-first update emits at most one due request per emitter per accepted
frame, ordered by activation sequence then actor ID/generation. Missed intervals
are not replayed, matching the deterministic timer rule. Deactivation or phase
exit removes the emitter before any later request.

Pause stops the update lease but retains emitter state and due times; simulation
time is frozen, so resume continues the exact remaining cadence. New-game
instantiation clears the table and all sequences. The emitter table capacity is
derived from root-channel capacity times the definition's one pattern source;
the first over-cap activation fails before a request.

`targeting.hostile-fixed` attaches one configured normalized direction.
`targeting.hostile-aimed` performs one exact different-owner player snapshot at
request handling and freezes the direction. Both copy the host-validated source
position/generation into `targeted-attack-v1`. Delivery never re-resolves it.

Hostile-compatible `delivery.pattern.*@1.1.0` definitions reuse the one reviewed
planner implementation, consume only `targeted-attack-v1`, require the admitted
`enemy-projectile` role, expose no pickup modifier target, and publish exact
source provenance. Request sequence is instance-monotonic; planner emission
index is per source actor generation. Existing `@1.0.0` bytes stay frozen.

An enemy/Boss deactivation cancels future requests but active projectiles remain
owned by their delivery pool/channel until contact, offscreen recycle, stop, or
terminal cleanup. This preserves legacy bullet persistence without transferring
custody to an inactive actor.

## Aggregate hostile budget contract

Graph 1.3 continues to sum ordinary exact reservations. Graph 1.4 adds explicit
`hostile-contention-v1` groups only for resolved hostile delivery members.

Assembly 1.3 declares each group as strict data:

```text
groupId
memberInstanceIds (non-empty, unique)
activeEntityCapacity
activeProjectileCapacity
spawnsPerSecondCapacity
ordering: resolved-provider-order
```

The resolver, not the assembly, proves every member is a hostile delivery bound
to the same group and that its local ceiling is no greater than each group
capacity. A member may belong to exactly one group. Player deliveries, actor
roots, pickups, and ordinary reservations cannot enter the group.

Graph aggregate admission is:

```text
non-contention exact sums
+ one capacity contribution per hostile group
<= assembly global budget
```

Independent physical pool capacities may sum above the shared active cap; no
member may activate above its local ceiling or while the group lacks a token.
Each activation atomically reserves local slot/entity generation, group active
entity/projectile tokens, the group trailing-1,000-ms spawn admission, and
quarantine capacity before adapter mutation. A stable request/salvo suffix is
dropped and observed when rate, group, or local pool capacity is exhausted.

Recycle releases local and group tokens. Quarantine retains all of them. There
is no shared physical pool, token borrowing outside the named group, fairness
callback, random ordering, or factory-local counter. Same-frame contention is
settled by existing provider/binding/event order.

The preserved legacy assembly uses one hostile group capped by
`resourceBudget.maxEnemyBullets` and its admitted spawn ceiling. Every enemy and
Boss delivery channel remains physically independent while contending for that
one cap.

## Encounter module contracts

| Definition                        | Responsibility                                                                                        | Key authority                                              | Exact reservation                                                                            |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `encounter.scrolling-waves@1.0.0` | stable `[start,end)` waves, lane order, maxAlive, downward motion/offscreen recycle                   | enemy root producer; lifecycle/pattern activation outputs  | roots `global maxEnemies`; projectiles 0; spawns from schedule maximum; timers 0; one update |
| `encounter.boss-phases@1.0.0`     | absolute Boss start, enemy-wave handoff, one Boss root, descending health phases, horizontal movement | Boss root producer; health input; phase/pattern activation | one root; projectiles 0; timers 0; one update                                                |
| `trigger.encounter-pattern@1.0.0` | immediate plus bounded per-generation cadence                                                         | exact root/pattern lineage; V3 source role                 | no entities/projectiles/timers; one update                                                   |
| `targeting.hostile-fixed@1.0.0`   | configured finite normalized direction                                                                | source request only                                        | zero gameplay resources                                                                      |
| `targeting.hostile-aimed@1.0.0`   | live player direction at request time                                                                 | exact player actor snapshot                                | zero gameplay resources                                                                      |

`scrolling-waves` extracts `planEnemyWaveSchedule` and `planEnemySpawnX`
semantics unchanged: first attempt at `startMs`, active window `[startMs,endMs)`,
stable source-index ordering, and the existing five lane fractions. It activates
only below both wave `maxAlive` and the resolved global root capacity.

At configured `bossStartMs`, Boss phases emits a handoff request. Waves cancels
future activations, deactivates all active enemy roots in stable identity order,
and emits a cleared acknowledgement; only then does Boss activation occur. This
acyclic event chain prevents simultaneous hidden ownership.

Boss phase selection reuses `selectBossPhaseIndex`: non-empty strictly descending
thresholds and inclusive `healthRatio <= threshold`. A phase change cancels old
pattern activations before emitting new ones in configured array order. Pattern
schedules reuse the existing `floor(duration/interval)+1` rule, including the
immediate emission.

## Actor-set health and contact

`combat.health@1.2.0` is a compatible Manifest 1.4 actor-root-set definition; it
does not replace static `@1.0.0/@1.1.0`. It binds one root channel, maintains at
most its exact capacity of generation-keyed entries, initializes maximum health
from a closed source-ID table, consumes `damage-v2`, emits `health-state-v3`, and
emits exactly one `actor-defeated-v1` at inclusive zero. Root deactivation prunes
the entry; slot reuse gets fresh health and a new generation.

`interaction.projectile-root-contact@1.0.0` proves exact projectile-source and
root-target lineage. `interaction.actor-root-contact@1.0.0` proves exact root
source and static player target lineage for body collision. Compatible
`interaction.contact-default-damage@1.1.0` and
`interaction.contact-resolution@1.2.0` use only the reviewed V2 profiles:

- projectile -> root: `damage/consume`, then `damage-v2` to the exact actor-set
  damage-route head;
- enemy root -> player: `damage/deactivate-root`, then `damage-v1` to the exact
  existing player route head.

The resolver rejects source/target lineage split, inactive/stale generation,
wrong root channel, below-head damage binding, mixed V1/V2 decision profile, or
more than one terminal health bank for a root channel.

## Scoring contracts

| Module                 | Input                                     | Output/state                                           |
| ---------------------- | ----------------------------------------- | ------------------------------------------------------ |
| `scoring.defeat@1.0.0` | successful health-depleted root lifecycle | base `score-source-v1` from closed source-ID points    |
| `scoring.combo@1.0.0`  | defeat score source                       | combo-adjusted `score-transaction-v1` plus combo state |
| `scoring.graze@1.0.0`  | unchanged `graze-v1`                      | flat graze transaction                                 |
| `scoring.pickup@1.0.0` | `pickup-collected-v1` with `scoreBonus`   | flat pickup transaction; other effects ignored         |
| `scoring.ledger@1.0.0` | all score transactions                    | singleton assembly-scoped `score-state-v1`             |

Defeat scoring preserves `awardDefeatScore` exactly. The combo continues only
when all three predicates are true:

```text
comboWindowMs > 0
&& lastDefeatAtMs != null
&& atMs - lastDefeatAtMs <= comboWindowMs
```

Count starts at one, multiplier is `min(cap,count)`, and defeat points are
floored. A zero window never continues a combo, including two defeats at the
same millisecond. Expiry occurs only after a positive inclusive window;
fractional multiplier caps remain legal. Graze and pickup awards are flat and
never enter the defeat combo.

Every transaction carries one stable source evidence identity. Award values use
`bounded-score-number-v1`: an IEEE-754 binary64 number that is finite,
non-negative, no greater than the exact source/configuration bound, and whose
resulting total is finite, non-negative, and no greater than
`Number.MAX_SAFE_INTEGER`. `Number.isSafeInteger` is deliberately not required
for award or total values; it remains required for sequences, capacities, and
event counts. The ledger performs ordinary binary64 addition exactly once in
stable event order, with no rounding, flooring, decimal scaling, epsilon, or
reassociation. Thus a legal `scoreBonus` such as `7.5` remains `7.5` through the
adapter and ledger. A non-finite or over-magnitude next total fails before score
mutation or state publication.

The ledger rejects duplicate evidence before mutation and is the only score
writer. Its duplicate capacity is the resolver-derived sum of maximum wave/Boss
defeats, hostile projectile generations eligible for one-shot graze, and
scheduled pickups. Capacity cannot be a factory estimate. Outcome score
thresholds compare the resulting binary64 total inclusively without coercion.

The frozen Batch 2 graze factory is instantiated once per hostile projectile
channel and retains read-only, one-shot `(channel,entity,generation,player)`
semantics. Scoring consumes its evidence; neither module mutates projectiles.

## Outcome and terminal commit contracts

Condition modules publish retained `outcome-condition-v1` only:

- `outcome.player-health@1.0.0`: loss when player health is inclusively `<= 0`;
- `outcome.boss-defeat@1.0.0`: win only after successful Boss root lifecycle
  reason `health-depleted`;
- `outcome.score-threshold@1.0.0`: configured win or loss at inclusive score;
- `outcome.survival-time@1.0.0`: configured win or loss at inclusive simulation
  time.

`outcome.coordinator@1.0.0` is an assembly singleton. Its configuration selects
exactly one admitted win condition and one admitted loss condition for legacy
parity. Condition providers may only refresh retained condition state; they
cannot call the terminal commit service.

Graph 1.4 adds one host-owned
`post-provider-post-event-frame-v1` arbitration barrier to every accepted frame.
The fixed order extends ADR 0026 as follows:

1. advance the frame/clock and dispatch due timers with all nested events;
2. run every ordinary participant update provider-first, fully draining each
   synchronous nested event transaction before continuing;
3. after all providers and nested events complete, invoke the one resolved
   outcome coordinator exactly once at the arbitration barrier;
4. allow that coordinator alone to submit at most one terminal decision;
5. release the graph guard, then perform any latched terminal cleanup/transition.

Condition state records a host-assigned `eligibleFrameSequence`. A condition
that matures during frame `F` is eligible at barrier `F`; one that matures in an
external event between frames is assigned the next accepted frame and cannot
commit early. Counter preflight follows `safe-monotonic-v1`. At barrier `F`, the
coordinator atomically snapshots the selected states eligible at or before `F`,
evaluates win before loss, and latches once. This frame sequence, not callback
arrival order, defines “same frame.” The arbitration subphase forbids ordinary
state/event publication, timers, input, overlaps, actor/entity mutation, and
lifecycle entry.

The commit service validates the arbitration token and frame sequence in
addition to graph phase, selected condition evidence, elapsed time, score state,
sequence capacity, and singleton latch before mutation. A loss publication or
callback before the barrier can never latch early. The service records the
terminal decision under the current guard, blocks later gameplay events/frames,
and defers scene transition until the guard is released. The
host then performs normal reverse stop/dispose/destroy and only after clean graph
and session evidence asks the lifecycle adapter to enter the end scene.

An adapter or cleanup failure cannot publish a successful terminal run. Restart
always creates a new graph with fresh actor generations, health maps, trigger
schedules, score ledger, condition state, and outcome latch.

## Manifest 1.4 descriptor closure

Manifest 1.4 contains all Manifest 1.3 fields unchanged and adds only strict
nullable/array descriptors:

```text
actorRootProducer
actorRootConsumers[]
hostileAttackChannel
aggregateResourceClaims[]
actorSetDamageSink
actorRootContactConsumer
outcomeCommit
```

Absence grants nothing. No raw descriptor enters a factory context. Resolution
emits opaque grant IDs and exact service keys. Restricted policy transforms
still receive no lifecycle context or service.

`outcomeCommit` fixes
`arbitrationPhase: post-provider-post-event-frame-v1`, the condition-state input
ports, and the exact coordinator identity. No ordinary update registration or
event handler can acquire its arbitration token.

## Assembly 1.3 and Graph 1.4

Assembly 1.3 remains data-only and adds:

```text
actorRootBindings[]
hostileAggregateBudgetGroups[]
actorSetDamageRoutes[]
actorRootMutationGrantSelections[]
outcomeCoordinatorSelection
```

All references are logical IDs to selected instances, ports, closed source IDs,
or reviewed profiles. Unknown fields, actor IDs supplied for dynamic roots,
paths, URLs, code, imports, packages, commands, callbacks, expressions, and
runtime handles are rejected.

Graph 1.4 readiness requires exact loader/catalog evidence and:

- one producer and bounded custody grant per root channel;
- exact consumer lineage, roles, capacities, assets, and lifecycle ports;
- complete hostile source/targeting/delivery triples with V3 payloads;
- exact independent channel custody and hostile aggregate groups;
- actor-set health and one linear damage route per root channel;
- contact candidate/source mutation/target route lineage without split;
- safe maximum scoring-event capacity and singleton ledger;
- selected condition providers, coordinator, frame-tail arbitration barrier,
  and outcome commit service;
- exact timers, updates, overlaps, leases, observations, entities, projectiles,
  spawn windows, quarantine capacity, and browser-safe catalog evidence.

Any blocker produces one immutable Node-side readiness report. Browser runtime
accepts only ready Graph 1.4 with matching generated catalog evidence.

## Production definition set

The freeze candidate contains 29 definitions:

- five encounter/source adapters: scrolling waves, Boss phases, encounter
  pattern trigger, hostile fixed targeting, hostile aimed targeting;
- eight compatible hostile pattern delivery `@1.1.0` definitions;
- five actor-set/contact definitions: health `@1.2.0`, projectile-root contact,
  actor-root contact, default damage `@1.1.0`, resolution `@1.2.0`;
- five scoring definitions: defeat, combo, graze, pickup, ledger;
- five outcome definitions: player health, Boss defeat, score threshold,
  survival time, coordinator;
- one unchanged `combat.graze@1.0.0` factory definition reused per hostile
  channel. It is counted as reused catalog evidence, not a new artifact.

No existing definition is rewritten. If implementation inventory counts only
new artifact envelopes, the Batch 3 admission count is 28 new envelopes plus
the reused frozen graze envelope.

## Representative graphs and legacy parity

Before production factories, resolver/red fixtures must prove:

1. one enemy root generation -> immediate radial hostile request -> fixed target
   -> independent projectile channel -> unchanged graze -> player contact route;
2. two enemy sources and one Boss source contending for one hostile group, with
   local pools independent and stable suffix drops at exact/one-over caps;
3. enemy slot deactivation/reuse while old bullets remain valid under delivery
   custody and new requests carry the next actor generation;
4. aimed targeting snapshots the live player once per request and delivery does
   not re-resolve it;
5. player projectile -> dynamic enemy health -> source-first root deactivation
   -> defeat/combo -> ledger;
6. enemy body -> source-first root deactivation -> existing player defense/
   health route, without a defeat award;
7. wave-to-Boss handoff, descending phase transitions, independent phase
   pattern schedules, Boss defeat, and win precedence;
8. graze and scoreBonus evidence -> flat score transactions -> inclusive score
   outcome;
9. survival win/time loss and Boss win/health loss maturing in opposite callback
   orders within one `frameSequence`, both arbitrated win-first only at the
   frame-tail barrier;
10. pause/resume, terminal outcome, new-game restart, graph destruction, and
    session quarantine with zero clean residue.

The final legacy assembly must be deterministically derived from the preserved
v2 `ShooterGameSpec` and bind every configured wave, phase, pattern, score rule,
win/loss condition, player defense, pickup, and asset role. It must not mutate
the source Spec or use model output.

Parity requires equivalent desktop/mobile public-input behavior, configured
waves and Boss patterns, hostile cap evidence, collision/damage, combo/graze/
pickup score, win/loss/end/restart, responsive layout, clean console/network,
recovery hash replay, and verified packaging. Exact internal entity IDs or pool
partitioning are not visual parity requirements; configured semantics, caps,
outcomes, and evidence are.

## Rejection matrix

Graph readiness or runtime must reject:

- a Manifest 1.2/1.3 factory receiving any V1.4 context key;
- a hostile delivery using `player-projectile` or a player delivery entering a
  hostile contention group;
- missing/duplicate source, targeting, delivery, root producer, health bank,
  score ledger, condition, or coordinator roles;
- root identity supplied by assembly/factory, generation reuse, stale source
  request, wrong source role, or root-channel lineage split;
- actor activation without physical slot, resource, and quarantine reservation;
- group member overlap, undeclared member, local ceiling above group capacity,
  aggregate one-over, or factory-local shared counter;
- physical-pool sharing between pattern deliveries or release of group tokens
  from an unproven recycle;
- pattern emission after source/phase deactivation, replayed missed cadence,
  more than one emission per emitter per frame, or pause-time advancement;
- damage to a stale root generation, damage-route bypass/fork/cycle, duplicate
  health bank, or score before proven root deactivation;
- body-contact defeat score, duplicate score evidence, non-finite/negative/
  over-magnitude score, fractional score rounding/coercion/reassociation, ledger
  capacity overflow, or zero/positive-window combo boundary drift;
- outcome threshold strictness drift, loss-first same-frame precedence, second
  terminal decision, arbitration before all provider/nested-event completion,
  more than one arbitration per frame, commit outside the barrier token, scene
  transition inside the event guard, or restart that reuses graph state;
- any indeterminate source/root mutation that emits gameplay, score, or outcome
  evidence or releases quarantine custody;
- catalog/hash/export drift, Node authority in the browser closure, missing
  fixed/Batch 1/2 regression, or absent recovery/package evidence.

## Implementation gate after acceptance

1. Add strict Manifest 1.4, Assembly 1.3, Graph 1.4 types/schemas and golden
   unknown-field/version-isolation tests.
2. Add pure resolver grants/readiness for root lineage, V3 hostile pipelines,
   contention groups, actor-set damage routes, scoring capacity, and outcome.
3. Add mixed V1.2/V1.3/V1.4 context and browser-boundary conformance before any
   gameplay factory.
4. Add actor-root custody/quarantine and aggregate-budget hosts with exact and
   one-over failure tests.
5. Add payloads, contact V2, actor-set health, bounded binary64 score ledger,
   frame-tail arbitration, and outcome commit host with source-first/terminal
   failure accounting.
6. Run the complete ABI red/green gate, `pnpm check`, isolated build, and fixed/
   Batch 1/2 browser regressions.
7. Admit encounter/source factories, then scoring/outcome factories, then bind
   the unchanged graze factory to admitted hostile channels.
8. Build the deterministic legacy assembly and pass equivalent desktop/mobile,
   recovery, and package gates before any fixed-template retirement discussion.

## Review decisions requested

Acceptance of ADR 0028 would freeze these choices:

1. new 1.4/1.3/1.4 versions instead of widening strict older contracts;
2. bounded dynamic actor-root channels rather than predeclared per-enemy module
   instances or factory-created arbitrary actors;
3. V3 event attack pipelines carrying exact source generation;
4. independent hostile pools under explicit host-owned contention groups;
5. actor-set health/contact routes and source-first root deactivation;
6. the added hostile targeting and scoring-ledger adapter IDs;
7. one host-owned terminal outcome commit after win-first coordination;
8. implementation order and unchanged fixed/Batch 1/2 evidence requirements.

Revision 2 additionally freezes exact legacy-compatible fractional scoring, the
positive-window combo predicate, and the once-per-frame
post-provider/post-event arbitration barrier.
