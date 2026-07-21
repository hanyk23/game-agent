# Base Gameplay Module Library Design

Updated: 2026-07-18
Status: Phase 7 complete library design baseline; implementation is staged

## Purpose

Phase 7 builds a complete, bounded gameplay-module library for reusable
single-player vertical bullet-hell H5 generation. “Complete” here means that
the library architecture, capability catalog, contracts, compatibility model,
resource model, validation evidence, implementation batches, and legacy-parity
route are decided as a coherent whole before large-scale implementation. It
does not mean that every conceivable 2D-game mechanic is in scope.

The user has confirmed this reviewed catalog from market-game coverage as the
required product scope. Implementation order is Batch 2, Batch 3 with full
legacy parity, then Batch 4; the later extension is required but does not move
ahead of the parity gate.

Batch 1 is the first detailed implementation slice, not the design boundary of
the library. Its module-by-module contracts live in
`docs/BATCH_1_MODULE_DESIGN.md`. ADR 0025 defines the execution ABI that must
support the entire Phase 7 catalog while adding only gameplay-neutral services
to the kernel.

The user-facing Chinese review packet is
`docs/MODULE_LIBRARY_DESIGN_REVIEW_ZH.md`. It consolidates the complete library,
ABI, Batch 1, interactions, parity, gates, and decisions requiring approval.

## Product and phase boundary

- Product: a reusable Agent that generates verified single-player vertical
  bullet-hell H5 games.
- Library responsibility: reviewed gameplay behavior and safe composition.
- Kernel responsibility: lifecycle, time, input, safe entities/pools,
  rendering, collision, assets, typed event delivery, budgets, and read-only
  observation.
- Orchestrator responsibility: assembly validation, resolution, evidence,
  verification, recovery, and packaging.
- Phase 7 excludes provider/model intent review, model-driven assembly,
  OpenCode module development, bounded model repair, paid calls, and asset
  corpus expansion. Those are later roadmap work.
- The fixed-template path remains a passing compatibility baseline until a
  complete modular legacy assembly passes equivalent browser, recovery, and
  package gates.

## Library-wide design principles

1. **Orthogonal capability axes:** intent, locomotion, targeting, trigger,
   delivery, combat, progression/loadout, encounter, companion, scoring, and
   outcomes remain independently replaceable.
2. **Data-only composition:** assemblies contain IDs, versions, bounded
   configuration, declared actors, bindings, asset roles, and budgets—never
   code, packages, paths, imports, commands, or engine objects.
3. **Explicit semantics:** every port name maps to a strict versioned payload
   schema; units, coordinate space, ordering, idempotency, and ownership are
   documented.
4. **Owner-safe composition:** actor capabilities are owner-scoped unless
   explicitly assembly-scoped; cross-actor bindings require a reviewed target
   input declaration.
5. **Deterministic execution:** exact factories, stable provider ordering, synchronous
   validated port delivery, bounded updates, reverse cleanup, and complete
   partial-failure rollback.
6. **Budget before behavior:** resource reservations pass resolution before a
   factory runs; runtime grants enforce the same or tighter limits.
7. **Evidence over names:** matching IDs or payload names do not prove
   compatibility. Schema, ownership, lifecycle, resources, interactions, and
   browser evidence all contribute.
8. **Extraction before invention:** reuse existing pure planners and proven
   fixed-scene rules where they meet the new contract.
9. **Fail closed without shrinking intent:** unsupported or incompatible graphs
   produce immutable findings; verification may not remove required behavior to
   obtain a pass.

## Complete capability architecture

### Player intent

Intent modules translate devices or UI state into semantic commands. They never
move actors or execute attacks.

| Module family         | Planned reviewed IDs                            | Purpose                                               | Batch |
| --------------------- | ----------------------------------------------- | ----------------------------------------------------- | ----- |
| Movement sources      | `intent.keyboard-movement`, `intent.touch-drag` | Desktop normalized direction and mobile absolute drag | 1     |
| Movement policy       | `intent.movement-arbiter`                       | Deterministic multi-source priority/selection         | 1     |
| Aim source            | `intent.directional-aim`                        | Pointer/stick/key aim vector or point                 | 2     |
| Attack source         | `intent.active-attack`                          | Press/hold/release semantic attack intent             | 2     |
| Ability source        | `intent.ability`                                | Bounded named ability-slot intent                     | 4     |
| Equipment source      | `intent.equipment-selection`                    | Select declared loadout slots only                    | 4     |
| Combined touch layout | `intent.touch-combined`                         | Reviewed movement/aim/attack touch zones              | 4     |

All simultaneous sources must pass through an explicit policy module. Device
modules own capture state only; they cannot claim locomotion, targeting, or
trigger ownership.

### Locomotion

Locomotion consumes resolved movement or ability commands and exclusively owns
actor transform/velocity policy.

| Module                        | Responsibility                                    | Required composition                                                                    | Batch |
| ----------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------- | ----- |
| `locomotion.bounded`          | Velocity and absolute drag within viewport insets | One resolved movement source                                                            | 1     |
| `locomotion.focus-speed`      | Hold-to-reduce speed by bounded factor            | Bounded locomotion + focus intent                                                       | 2     |
| `locomotion.dash`             | Cooldown, distance, duration, collision policy    | Bounded locomotion + ability intent                                                     | 4     |
| `locomotion.reviewed-inertia` | Bounded acceleration/deceleration                 | Replaces direct velocity policy; conflicts with dash unless interaction evidence exists | 4     |

Only one base transform owner may exist per actor. Focus is a modifier; dash is
a coordinated locomotion capability; inertia is an alternative base policy.

### Targeting

Targeting produces direction or declared target references; it does not decide
attack timing or create attack entities.

| Module                    | Responsibility                                        | Batch |
| ------------------------- | ----------------------------------------------------- | ----- |
| `targeting.fixed-forward` | World-up legacy target direction                      | 1     |
| `targeting.directional`   | Normalize declared aim vector/point                   | 2     |
| `targeting.nearest`       | Stable nearest valid target within range and filters  | 2     |
| `targeting.hostile-fixed` | Per-emission configured hostile direction             | 3     |
| `targeting.hostile-aimed` | Per-emission bounded live-player direction            | 3     |
| `targeting.priority`      | Stable ordered role/health/distance policy            | 4     |
| `targeting.homing-update` | Bounded turn-rate updates for owned delivery entities | 4     |
| `targeting.multi-lock`    | Stable capped target set with expiry                  | 4     |

Target queries use safe actor/entity directory snapshots and stable tie-breaking
by logical entity ID/generation. They never iterate Phaser groups directly.
Batch 2 nearest targeting publishes a snapshot-derived direction; its reference
and directory revision are evidence only and delivery never re-resolves them.
The resolved read grant separately authorizes actor entry fields (including
generation) and snapshot-envelope metadata. Distance order uses the owner
position from the same atomic directory sample.

### Attack trigger

Trigger modules turn interval or player intent into attack requests. Resource
policies may gate requests but never spawn attacks.

| Module                      | Responsibility                                            | Batch |
| --------------------------- | --------------------------------------------------------- | ----- |
| `trigger.interval`          | Fixed-cadence automatic primary requests                  | 1     |
| `trigger.active`            | Press/hold/release requests                               | 2     |
| `trigger.encounter-pattern` | Per-root-generation encounter pattern cadence             | 3     |
| `trigger.cooldown`          | Gate upstream requests by cooldown                        | 4     |
| `trigger.charge`            | Accumulate bounded hold duration and emit charge tier     | 4     |
| `trigger.ammunition`        | Magazine, reload, and bounded reserve                     | 4     |
| `trigger.energy-heat`       | Energy consumption/regeneration or heat threshold/cooling | 4     |

Exactly one primary request producer owns a channel after all gates are wired.
Cooldown/ammo/energy modules are explicit request filters, not hidden fields in
delivery modules.

Batch 1 retains `attack-request-v1` with channel-local `primary`. Batch 2 uses
channel-explicit `attack-request-v2`; one targeting, trigger, and delivery owner
must resolve for each `(ownerActorId, attackChannelId)`. One aim state may feed
multiple channel-specific targeting instances, but one targeting instance does
not fan out across channels.

Active trigger uses a closed edge/hold state machine. Browser-repeat press and
wrong-identity release are ignored, hold cadence begins only at its exact timer
boundary, and pause clears held identity/cadence so resume requires a new press.

### Attack delivery

Delivery turns a target plus admitted request into owned attack entities or
effects. It never applies health changes directly.

| Module family         | Planned reviewed IDs                                                                                 | Purpose                                                             | Batch |
| --------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ----- |
| Basic projectile      | `delivery.projectile`                                                                                | One pooled constant-velocity projectile                             | 1     |
| Salvo formation       | `delivery.spread`, `delivery.multi-shot`                                                             | Bounded offsets and angular formations                              | 2     |
| Legacy pattern source | `delivery.pattern.radial`, `.spiral`, `.fan`, `.aimed`, `.wave`, `.rain`, `.rotating-ring`, `.burst` | Reuse all eight pure pattern planners and shared caps               | 2/3   |
| Homing projectile     | `delivery.homing-projectile`                                                                         | Projectile channel plus bounded target updates                      | 4     |
| Beam                  | `delivery.beam`                                                                                      | Timed line/strip contact with bounded tick rate                     | 4     |
| Area field            | `delivery.area-field`                                                                                | Timed bounded area contacts                                         | 4     |
| Mine/orbit            | `delivery.mine`, `delivery.orbit`                                                                    | Delayed or owner-relative delivery                                  | 4     |
| Summon command        | `delivery.companion-command`                                                                         | Data command to an admitted companion, not arbitrary actor creation | 4     |

Every entity-producing delivery owns its pool/channel, declares active and spawn
caps, and exposes logical entity-channel evidence for interactions. Simultaneous
pattern deliveries use distinct resolved attack channels and independent
physical pools; one assembly aggregate projectile/spawn ledger enforces their
shared cap in stable resolved order.

### Combat interaction

Combat modules turn declared contacts or transactions into health/defense state
changes. They are ordered explicitly rather than embedded in collision
callbacks.

| Module                                | Responsibility                                                   | Batch |
| ------------------------------------- | ---------------------------------------------------------------- | ----- |
| `combat.health`                       | Bounded health state and terminal damage-sink capability         | 1     |
| `interaction.projectile-contact`      | Detect contact without source mutation                           | 1     |
| `interaction.projectile-root-contact` | Detect projectile contact against a bounded actor-root set       | 3     |
| `interaction.actor-root-contact`      | Detect enemy-root body contact against the static player         | 3     |
| `interaction.contact-default-damage`  | Initialize the explicit policy chain with a damage decision      | 1     |
| `interaction.contact-resolution`      | Apply the final consume/retain/transfer decision and emit result | 1     |
| `combat.shield`                       | Consume downstream damage through bounded shield strength        | 2     |
| `combat.invulnerability-window`       | Time-gate downstream accepted damage                             | 2     |
| `combat.graze`                        | One-shot annulus detection and graze evidence                    | 2     |
| `interaction.projectile-cancel`       | Transform a contact decision to cancellation                     | 4     |
| `interaction.absorption`              | Transform to absorption and a resource transaction               | 4     |
| `interaction.reflection`              | Transform to bounded ownership/direction transfer                | 4     |
| `interaction.polarity`                | Transform by match/mismatch policy                               | 4     |
| `combat.status`                       | Small closed set of bounded timed modifiers                      | 4     |

Contact policy is an explicit synchronous transaction: contact candidate → final
resolution host → reviewed default-damage transform → optional reviewed
polarity/cancel/absorb/reflect transforms → final decision → source operation.
Detection never mutates the projectile; only final resolution may consume,
retain, or transfer it. Policies are restricted synchronous transforms, not
ordinary event subscribers. A registry-owned `ContactPolicyChainProfile` fixes
exact versions/order/depth/evidence, and the resolver rejects every unreviewed
ordering before instantiation.

Policy manifests declare `executionModel:contact-policy-transform-v1`,
`policyPhase`, `allowedPredecessors`, `allowedSuccessors`, `requiresBefore`,
`requiresAfter`, `supportedChainEvidenceIds`, and `mutableDecisionFields`.
`ContactPolicyTransform` maps one frozen decision to one frozen decision; its
`disposition` and `sourceOperation` must satisfy the closed matrix.

Damage then enters owner-scoped `combat.damage-sink@1.0.0`. Health supplies the
terminal sink; shield and invulnerability supply upstream sinks with one
downstream output. Each owner declares one head and ordered route; all damage
producers bind the head, while multiple producers may share it. The resolver
proves one same-owner linear path to exactly one health owner and rejects
below-head bypass, fork, cycle, duplicate sink, or unterminated routing.

### Progression and loadout

Progression modules modify declared capabilities through bounded data; they
cannot replace factories or mutate Schemas.

| Module                               | Responsibility                                   | Batch |
| ------------------------------------ | ------------------------------------------------ | ----- |
| `progression.pickup-spawn`           | Planned pickup spawn schedule and pool           | 2     |
| `progression.pickup-collect`         | Contact to bounded effect transaction            | 2     |
| `progression.modifier`               | Apply allowlisted numeric modifier targets       | 2     |
| `progression.upgrade-choice`         | Bounded deterministic/player-selected choice set | 4     |
| `progression.evolution-recipe`       | Validate declared prerequisite combination       | 4     |
| `loadout.slotted`                    | Primary/armor/secondary/companion slot ownership | 4     |
| `progression.local-unlock-reference` | Read validated local unlock IDs only             | 4     |

Modifiers target published modifier ports and bounded fields; they never reach
module internals by path or reflection.

### Encounter flow

Encounter modules own schedules and actor-source state, not combat rules.

| Module                      | Responsibility                                       | Batch |
| --------------------------- | ---------------------------------------------------- | ----- |
| `encounter.scrolling-waves` | Stable ordinary-wave schedule and spawn lanes        | 3     |
| `encounter.boss-phases`     | Health-ratio phase transitions and pattern schedules | 3     |
| `encounter.fixed-arena`     | Bounded arena lifecycle                              | 4     |
| `encounter.room-sequence`   | Stable declared room transitions                     | 4     |
| `encounter.timed-survival`  | Kernel-time survival completion evidence             | 4     |
| `encounter.objectives`      | Closed objective counters/transitions                | 4     |

The legacy wave and Boss schedulers remain the source of truth during
extraction. Encounter modules create actor roots through reviewed host/entity
services and publish declared lifecycle transitions.

### Companion behavior

Companions remain single-player-owned actors with independent state and caps.

| Module                         | Responsibility                                | Batch |
| ------------------------------ | --------------------------------------------- | ----- |
| `companion.follow`             | Bounded offset follow                         | 4     |
| `companion.orbit`              | Stable owner-relative orbit                   | 4     |
| `companion.targeting`          | Companion-scoped target selection             | 4     |
| `companion.attack`             | Route admitted companion requests to delivery | 4     |
| `companion.collection-support` | Bounded pickup attraction/collection assist   | 4     |

Companions cannot become a second player topology. Ownership always traces to
the one declared player actor.

### Scoring and outcomes

Scoring consumes immutable gameplay evidence; outcomes consume read-only state
snapshots. Neither alters combat to force a result.

| Module                    | Responsibility                                       | Batch |
| ------------------------- | ---------------------------------------------------- | ----- |
| `scoring.defeat`          | Base defeat awards                                   | 3     |
| `scoring.combo`           | Existing bounded combo window/multiplier             | 3     |
| `scoring.graze`           | Graze awards                                         | 3     |
| `scoring.pickup`          | Flat pickup awards                                   | 3     |
| `scoring.ledger`          | Singleton duplicate-safe authoritative score state   | 3     |
| `outcome.player-health`   | Loss at inclusive zero health                        | 3     |
| `outcome.boss-defeat`     | Win on explicit Boss defeat                          | 3     |
| `outcome.score-threshold` | Inclusive score win/loss                             | 3     |
| `outcome.survival-time`   | Kernel-time threshold outcome                        | 3/4   |
| `outcome.objective`       | Closed encounter-objective result                    | 4     |
| `outcome.coordinator`     | Deterministic precedence and one terminal transition | 3     |

The existing pure scoring and outcome evaluators are adapted without changing
their inclusive thresholds or precedence rules.

## Shared type and port system

The library's stable payload families are:

- input commands: movement, resolved movement, aim, attack, ability, and
  equipment selection;
- targeting: direction, target reference, and bounded target set;
- attacks: request, charge/resource annotations, entity channel, emission, and
  delivery completion;
- combat: contact candidate, frozen contact decision/policy trace, independent
  disposition and source operation, hit, damage, defense result, health state,
  graze, and status;
- progression: resource transaction, pickup/equipment reference, modifier
  application, and upgrade choice;
- encounters: actor lifecycle, phase/wave transition, objective progress;
- scoring/outcomes: score transaction, state snapshot, terminal decision.

Every payload version specifies coordinate space, units, numeric bounds,
sequence rules, duplicate handling, actor/entity identity, ordering, fan-out,
and `delivery: state | event`. State retains and replays one latest revision;
event never replays and is illegal before the graph is running. A new semantic
cannot reuse an old payload merely because its fields look similar.

`contact-decision-v1` is transaction-local and never a routable event. Its
closed combinations are damage→consume/retain, absorb→consume,
reflect→transfer, cancel→consume, and ignore→retain. Identity fields are frozen;
each transform can alter only its manifest allowlist, while the host appends one
trace entry. Promise, missing/double return, exception, identity change, invalid
combination, or unreviewed trace fails without entity mutation or result event.

## Configuration design

- Every module owns one strict Zod Schema with bounded defaults materialized
  during resolution.
- Cross-field checks belong in local configuration validation or deterministic
  graph validation, never in a factory's first update.
- Configurations may reference only declared actor IDs, module instance IDs,
  asset role IDs, equipment IDs, pattern IDs, and other closed logical IDs.
- Runtime paths, texture URLs, constructors, callbacks, expressions, and code
  are forbidden.
- Modifier targets are closed field IDs published by the receiving module.
- A canonical configuration-schema descriptor and local validator replace any
  attempt to hash a runtime Zod instance.

## Ownership model

Ownership namespaces cover:

- device/source capture;
- resolved player intent;
- actor transform/velocity;
- target selection per attack channel;
- trigger state per attack channel;
- delivery pools and entity channels;
- contact rule per source/target role pair;
- health, shield, invulnerability, status, and polarity state;
- pickup/equipment/loadout state;
- encounter schedule and spawned actor roots;
- companion motion/target/attack state;
- scoring ledgers and terminal outcome coordination.

Exclusive ownership is enforced per actor or assembly scope. Cross-owner ports
must constrain owner relation, source/target actor roles, and source entity role;
no broad wildcard is admitted. Read access is provided through snapshots or
declared ports. Write access is never inferred from a capability requirement.
Only final contact resolution receives an explicit source mutation grant.
Entity generation IDs prevent stale references after pool reuse.
Damage write access is granted through `combat.damage-sink@1.0.0`; it is not
inferred from direct knowledge of health. Every sink chain is same-owner,
single-input/single-output except terminal health, and statically closed.

## Lifecycle and execution model

Batch 1 production modules use `GameModuleManifest 1.2.0`. Accepted ADR 0027
uses Manifest 1.3, Assembly 1.2, and Graph 1.3 for Batch 2 authority rather than
reinterpreting strict Batch 1 versions. Manifest 1.0/1.1 registrations remain
legacy/fixture compatibility and cannot enter either production instantiator.
All modules use `initialize`, `start`, optional `update`, `stop`, and `dispose`.
The complete deterministic rules, context tracking, rollback, and reverse
cleanup are fixed by ADR 0025 and apply to every batch.

Batch 3 Revision 2 and accepted ADR 0028 add Manifest 1.4, Assembly 1.3, and
Graph 1.4 for bounded actor-root channels, V3 hostile-source lineage, explicit
hostile contention groups, actor-set combat, scoring ownership, and deferred
terminal outcomes. They do not reinterpret the accepted 1.2/1.3 paths, and
schema/type/version isolation plus complete pure authority/readiness resolution
are complete. Mixed-version context conformance precedes runtime hosts and
gameplay factories.

Explicit dependencies and matched capability providers form the provider-first
lifecycle DAG. Ports and handlers are declared before initialization without
delivery. Initialize may seed state but cannot emit events; after all
initialization the instantiator activates consumer start leases, replays latest
state, starts modules, and atomically enables events.
Stop blocks events and releases in reverse order. `stop -> start` means
pause/resume; game restart means `dispose -> instantiate`. Long-lived schedules
use charged timers. Port event delivery is synchronous and depth-bounded;
immediate event cycles are rejected. Modules cannot perform network work or
retain host objects beyond scoped context.

## Resource model

The existing aggregate fields remain the common gameplay admission currency:

- `activeEntities`
- `activeProjectiles`
- `spawnsPerSecond`
- `timers`

Each manifest declares ceilings. A canonical reservation descriptor plus local
evaluator derives exact grants from validated configuration and may not exceed
them. Runtime functions are covered by implementation bundle bytes, not direct
function hashing.

Leases are scoped: `startLeases` cover input/port subscriptions, timers,
overlaps, and updates; `instanceLeases` cover pools, channels, state caches, and
module readers; `graphLeases` cover router, root actor directory, and shared
budget ledger. Stop zeros start leases and active pool entities, dispose zeros
instance leases, and graph destruction zeros graph leases. Entity producers declare both
entity and specialized projectile ceilings. Composite assemblies pass exact
sum checks plus interaction-specific shared caps. Simultaneous enemy patterns
retain owner/channel-local physical pools and generations. Batch 3 Revision 2
makes their shared cap an explicit host-owned `hostile-contention-v1` group;
this is budget contention, never a shared physical pool contract.

Each module receives exact-limit and one-over-limit tests. Browser evidence
records peak active objects, spawn rates, timers, dropped-by-approved-cap
counts, and cleanup residue.

## Compatibility model

Compatibility is established in five layers:

1. **Static:** versions, engine/kernel ranges, payload schemas, configuration,
   owner relation, dependencies, conflicts, cardinality, and budgets.
2. **Lifecycle:** stable construction, state replay, event phases, pause/resume,
   new-game re-instantiation, rollback, scoped cleanup, and zero leaks.
3. **Pairwise contracts:** each required binding has positive, wrong-type,
   wrong-owner, stale-generation, duplicate, and missing-provider cases. Policy
   transforms additionally test sync exactly-once, immutable identity, field
   allowlists, profile order, and mutation-free failure; damage sinks test
   below-head bypass/fork/cycle/duplicate/termination rejection.
4. **Representative interaction sets:** coherent chains cover meaningful
   three-or-more-module behavior and shared resource contention.
5. **Browser evidence:** desktop/touch controls, mechanics, reachability,
   resources, outcomes, visuals, restart, and fixed-path parity.

Required representative sets across the completed library are:

- keyboard/touch/arbitration → bounded/focus/dash locomotion;
- fixed/directional/nearest targeting × interval/active trigger × projectile or
  representative non-projectile delivery;
- multiple pattern sources sharing one projectile cap;
- projectile contact → final-resolution transaction using a reviewed default /
  polarity / cancel / absorb / reflect profile → source operation → linear
  shield/invulnerability damage-sink chain → terminal health;
- pickup → modifier/upgrade/evolution/loadout;
- waves/Boss phases → patterns → scoring → outcome coordination;
- companion follow/orbit → target → attack/collection;
- simultaneous pause/resume, scene transition, loss/win, new-game restart, and
  graph destruction cleanup.

Pairwise evidence is selected by risk boundaries, not an unbounded Cartesian
product. Unsupported combinations remain explicit even when individual modules
are admitted.

## Implementation batches and gates

### Batch 1: executable basic combat

Detailed modules: keyboard movement, touch drag, movement arbitration, bounded
locomotion, fixed-forward targeting, interval trigger, pooled projectile
delivery, projectile contact, default damage decision, final contact resolution,
and terminal damage-sink health. `combat.damage-sink@1.0.0` is a capability, not
an additional module.

Gate: the design review in `docs/BATCH_1_MODULE_DESIGN.md` passes; then a graph
starts, moves, fires, detects contact without mutation, resolves a replaceable
policy, changes health, pauses/resumes, performs a fresh game restart, and
disposes/destroys with scoped cleanup while the fixed path remains passing.

### Batch 2: legacy offensive and defensive mechanics

Directional aim/active attack, focus, spread/multi-shot, eight legacy pattern
planners, shield, invulnerability, graze, pickups, and bounded modifiers.

Gate: shared pure planner results, timing, score-neutral combat state, aggregate
budget contention, desktop input, and touch behavior are equivalent to preserved
legacy evidence where the capability exists.

### Batch 3: encounter, scoring, outcomes, and full legacy assembly

Scrolling waves, bounded actor-root enemy sources, Boss phases, V3 hostile
pattern pipelines, actor-set contact/health, single-writer scoring modules,
deferred terminal outcome coordination, and restart-safe whole-graph cleanup.

Gate: the preserved v2 game is expressed as an executable resolved graph and
passes equivalent desktop/mobile functional, recovery, and package evidence.
The fixed path still remains until the user later approves retirement.

### Batch 4: compositional breadth

Dash/inertia, homing and representative beam/field/mine/orbit delivery,
cancellation/absorption/reflection/polarity/status, charge/cooldown/ammo/energy,
upgrades/evolution/loadouts, arenas/rooms/timed objectives, and companion
behavior.

Gate: directional-fire, automatic-target, polarity/absorption, and
slotted-equipment fixtures become executable supported graphs; additional
representative graphs prove breadth without claiming general-purpose games.

## Module admission definition

A module is admitted only with:

1. exact ID/version, canonical manifest and descriptors, local validators/
   evaluators, reviewed implementation bundle, and exact artifact hashes;
2. declared capabilities, port semantics, owner relations, dependencies,
   conflicts, cardinality, entity/state ownership, assets, resources, and
   browser support;
3. provenance plus canonical artifact-envelope hash covering descriptors,
   bundle bytes, dependency lock, and build/toolchain identity;
4. unit/property tests for pure rules and deterministic failures;
5. configuration, port, owner, lifecycle, rollback, and resource contract tests;
6. every required pairwise binding and assigned representative interaction set;
7. desktop/touch browser evidence where user-visible behavior applies;
8. no secret, dependency, license, permission, or fixed-baseline regression.

## Complete design review gate

Large-scale module implementation may proceed only after:

- this complete catalog and Batch 1 detailed design agree with ADRs 0022-0025,
  architecture, roadmap, handoff, and status;
- the ABI supports every capability family above without adding gameplay rules
  to the kernel;
- port ontology, owner scope, entity channels, lifecycle, budgets, evidence, and
  compatibility strategy are decided before factory code;
- Batch 1 has per-module implementation-ready specifications and end-to-end
  parity criteria, revised after the blocking design review;
- later batches have explicit responsibilities, dependencies, interaction
  sets, and admission gates sufficient to prevent Batch 1 shortcuts from
  blocking them;
- fixed-path preservation and Phase 8 separation remain explicit.

The current design is not an implementation authorization until the user
approves the revised Chinese review packet and ADR 0025.

Phase 8 must separately design reviewed `AssemblyRecipe` records so a model can
choose high-level recipes and bounded parameters while deterministic code
expands them into a normal `GameAssemblySpec`. Recipes never bypass the normal
schema, resolver, ownership, budget, evidence, or verification gates.

## Explicit exclusions

Multiplayer, networking, split-screen, PvP, rollback, replication, shared
online state, online services, arbitrary plugins, unrestricted dependencies,
unbounded scripting, general-purpose game generation, and silent module
promotion are outside this plan.
