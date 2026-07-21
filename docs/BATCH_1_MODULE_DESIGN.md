# Batch 1 Gameplay Module Design

Updated: 2026-07-17
Status: design baseline for review; no module implementation is implied

## Scope

This document is the implementation contract for Phase 7's first executable
combat slice within the complete library architecture in
`docs/BASE_MODULE_LIBRARY_PLAN.md`. It designs reviewed modules for keyboard and touch movement,
input arbitration, bounded locomotion, fixed-forward targeting, interval
triggering, pooled projectile delivery, health, and collision-driven damage.
It does not migrate the fixed-template path, add directional shooting, run a
model, or define Phase 8 request-time behavior.

The design reuses the current `GameModuleManifest`, `GameAssemblySpec`, local
registry, deterministic resolver, runtime event bus, timer, pool, budget,
viewport, asset, and observation seams. ADR 0025 records the complete execution
contract required before factories can be implemented. New kernel services stay
gameplay-neutral while supporting every Phase 7 family; Batch 1 does not limit
the module-library design or reduce later batches.

## Existing-contract audit

| Area                  | Reusable now                                                                                                                                                                                         | Gap that must be closed before implementation                                                                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Manifest and assembly | IDs, versions, kinds, config-schema IDs, capabilities, ports, dependencies, conflicts, cardinality, ownership, resources, browser flags, evidence, actors, bindings, asset roles, and global budgets | Capability requirements need owner scope; input ports need an explicit allowed owner relation                                                                           |
| Registry and resolver | Exact local registration, strict local configuration validation, bounded version ranges, fail-closed compatibility and aggregate budget checks                                                       | Production registration needs an exact factory; resolved graphs need actors, asset roles, manifest evidence, stable construction order, and exact runtime budget grants |
| Port taxonomy         | Movement, aim, attack, target, emission, hit, damage, resource, modifier, and encounter names exist                                                                                                  | Names are not runtime payload contracts; touch absolute movement, resolved movement, entity channels, and health changes are not representable without ambiguity        |
| Lifecycle and events  | Timer cancellation, synchronous event disposal, scene shutdown callback                                                                                                                              | Input and persistent overlap listeners cannot be removed; stop/dispose rollback rules do not exist                                                                      |
| Entities and pools    | Sprite creation, bounded Phaser groups, pool clearing, viewport clamp                                                                                                                                | Gameplay factories would receive raw Phaser sprites; no scoped actor/entity directory or safe channel lookup exists                                                     |
| Budgets               | Aggregate four-field admission and fail-closed named runtime limits                                                                                                                                  | No deterministic per-instance grants, timer leases, or one-second spawn-rate accounting exists                                                                          |
| Legacy behavior       | Arrow/WASD normalization, pointer drag, world bounds, interval fire, pooled bullets, collision damage, health, restart evidence                                                                      | Parity assertions are not yet bound to module contracts                                                                                                                 |

## Execution ABI baseline

### Registration and resolved graph

A production registration uses `GameModuleManifest 1.1.0` and binds a canonical
manifest, canonical configuration-schema descriptor and validator, canonical
resource-reservation descriptor and evaluator, and reviewed implementation
bundle export. Manifest 1.0.0 remains data-only fixture compatibility and cannot
be instantiated.

Evidence hashes reproducible artifacts, never runtime function or Zod objects.
The versioned length-delimited evidence envelope contains canonical manifest
JSON, both canonical descriptor byte streams, implementation bundle bytes,
dependency-lock identity, and build/toolchain identity. `function.toString()`
is forbidden. Runtime lookup repeats exact logical and artifact-hash matching;
registry drift fails before side effects.

A contact-policy registration also binds a canonical transform descriptor with
`executionModel`, `policyPhase`, `allowedPredecessors`, `allowedSuccessors`,
`requiresBefore`, `requiresAfter`, `supportedChainEvidenceIds`, and
`mutableDecisionFields`. A
registry-owned `ContactPolicyChainProfile` is a separately hashed artifact with
`profileId`, version, exact ordered policy IDs/version constraints, policy roles,
allowed dispositions/source operations, maximum depth, supported-chain evidence
ID, and evidence hash. Its referenced policy artifact hashes enter the graph
evidence envelope. An assembly selects a profile and bounded parameters; it
cannot submit, omit, or reorder raw policy IDs.

Manifest 1.1.0 adds capability scope, structured endpoint authorization, port
delivery semantics, resource ceilings, and lifecycle-scoped leases.

The resolver emits `ResolvedModuleGraph 1.1.0`, preserving actors, asset roles,
artifact identities, validated configuration, per-instance grants, bindings,
explicit dependencies, matched capability providers, and a stable
provider-first order. Equal-order nodes use lexical `instanceId`. The
synchronous event data-flow graph must be acyclic. The graph also pins expanded
policy profiles and owner-scoped damage-sink paths. Resolver checks every policy
manifest's execution model, phase, predecessor/successor and before/after rules,
supported evidence IDs, version, and mutable-field allowlist. Unknown orders and
non-linear or unterminated sink routes fail before instantiation.

The instantiator performs these operations deterministically:

1. Validate graph/kernel/registry identity and allocate scoped contexts.
2. Create factories in provider-first order without starting them.
3. Wire every declared port and declare handlers before initialization without
   activating delivery.
4. Call every `initialize`; modules may seed state but cannot emit events.
5. Activate every consumer port-subscription start lease, then replay initial
   state in stable provider-first/port-ID order.
6. Call every `start`; only after all succeed atomically enter `running` and
   enable event delivery.
7. Call `update(deltaMs)` in stable order while running.
8. On stop, block new events and release modules in reverse order; on disposal
   release instance resources in reverse order exactly once.
9. On partial failure, release every acquired lease at its scope, reverse-stop
   and reverse-dispose, and preserve original plus cleanup failures.

Resume first activates consumer subscriptions, replays current state, then calls
start hooks and enables events. `stop -> start` means pause/resume of the same instance. Game restart means
`dispose -> instantiate` and creates fresh health, trigger, and contact state.
`dispose` is terminal; graph destruction follows disposal.

### Runtime payloads and delivery phases

Each payload type name resolves to one strict local schema and frozen TypeScript
value. Unknown fields, non-finite numbers, undeclared logical IDs, invalid
entity references, and emission on an unbound output fail synchronously.
Sequence numbers are non-negative, strictly increasing per output port, and
timestamps use kernel time.

Batch 1 uses these payloads:

| Payload                        | Required semantics                                                                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `movement-command-v1`          | `{sourceId, sequence, sampledAtMs, active, command}` where command is either normalized `velocity-direction{x,y}` or `absolute-position{x,y,pointerId}` |
| `resolved-movement-command-v1` | The same command plus `selectedSourceId` and arbitration reason                                                                                         |
| `target-selection-v1`          | State: `{kind:"direction", direction:{x,y}}` with a finite normalized non-zero vector                                                                   |
| `attack-request-v1`            | `{sequence, requestedAtMs, channel:"primary"}`; it carries no damage or implementation rule                                                             |
| `entity-channel-v1`            | State: data-only logical channel identity, owner instance, entity role, and generation; resolved only for an authorized binding                         |
| `emission-v1`                  | Projectile logical entity ID, channel ID, owner actor ID, position, velocity, damage, and generation                                                    |
| `contact-candidate-v1`         | Event: source channel/entity/generation, target actor, contact sequence, and immutable contact metadata; no disposition                                 |
| `contact-decision-v1`          | Frozen transaction value: candidate identity, disposition, independent source operation, bounded policy trace, and disposition-specific result fields   |
| `hit-v1`                       | Source/target logical entity IDs, contact sequence, and consumed flag                                                                                   |
| `damage-v1`                    | Source/target actor IDs, positive finite amount, damage kind, and contact sequence                                                                      |
| `health-state-v1`              | State: actor ID, current/max health, non-negative revision, delta, and reason (`initialized`, `damaged`, or `depleted`)                                 |

Each output declares `delivery: state | event`. State retains and replays one
latest value; event retains nothing, never replays, and is rejected before the
graph is running. Target selection, health state, and entity-channel declaration
are state. Movement commands, attack requests, emissions, contact candidates,
hits, and damage are events. Contact decisions never enter the ordinary event
router; they exist only inside `contact-policy-transform-v1` transactions. The
port enum adds the new movement, channel, contact, and health payloads. The older
`movement-vector-v1` remains fixture-only.

`contact-decision-v1` separates `disposition` from `sourceOperation`:

| disposition | Allowed source operation |
| ----------- | ------------------------ |
| `damage`    | `consume`, `retain`      |
| `absorb`    | `consume`                |
| `reflect`   | `transfer`               |
| `cancel`    | `consume`                |
| `ignore`    | `retain`                 |

The transaction seed is `ignore/retain`. Contact, source generation, target,
and candidate metadata are immutable. A policy may change only manifest-listed
fields; the transaction host alone appends its policy ID to the trace.

```ts
type ContactPolicyTransform = (
  decision: FrozenContactDecision,
) => FrozenContactDecision;
```

This ABI has one return channel and no callback. The host rejects a Promise or
thenable, missing return, thrown error, repeated invocation, invalid trace, or
any identity/field violation before granting mutation.

### Scoped kernel context

Factories receive no Phaser object and no unrestricted kernel. Their context
contains:

- read-only instance, owner actor, exact configuration, asset-role, manifest,
  and admitted-budget data;
- a port reader/emitter that is limited to resolved bindings and validates
  payloads;
- clock and disposable timers charged to the instance grant;
- keyboard direction polling and pointer subscriptions that return disposers;
- a safe actor/entity handle with only active state, position, bounded velocity,
  collision-body configuration, activation/recycling, and immutable metadata;
- an entity directory that exposes the owner actor and only channels granted by
  declared bindings; module-created channels and pools remain owned by their
  creator;
- cancellable overlap watches, asset-role resolution, viewport bounds,
  per-instance budget accounting, and namespaced read-only observation.

Persistent overlap registration returns a disposer; input subscriptions return
disposers; neither graph stop nor a module may pause all scene physics. Actor
root creation stays a runtime-host responsibility for Batch 1. The fixed scene
is the compatibility host; module tests use a deterministic fake host. A later
encounter slice may own enemy creation without changing these entity handles.

### Ownership and compatibility rules

Capabilities are owner-scoped by default. An assembly-scoped capability must be
explicit. Cross-owner inputs use structured constraints containing
`ownerRelation: same-owner | different-owner`, closed source/target actor-role
sets, and a closed source-entity-role set. Broad `any-declared-actor` is not
admitted. Dependencies remain owner-scoped unless explicitly assembly-scoped.

Input source modules own only their source state. The arbiter exclusively owns
the resolved movement intent, locomotion exclusively owns the player transform
and velocity, targeting owns primary targeting, the trigger owns the primary
fire schedule, delivery owns its projectile pool/channel, each health instance
owns its actor's health state and terminal damage sink, the contact detector owns
one overlap rule, policy modules own only synchronous decision transformation,
and the final resolver alone owns source consumption or transfer. Matching port
names never override these rules.

Damage producers require owner-scoped `combat.damage-sink@1.0.0`, not a concrete
health module. Its descriptor declares `sinkRole:filter|terminal-health`, input
port, and a filter's required downstream output port. Each owner has one route:
a declared head, ordered sink instances, and exactly one terminal health. All
producers bind the head; multiple producers may share it. Every filter has one
downstream sink and terminal health has none. Resolver rejects a producer bound
below the head, a fork, cycle, duplicate sink, multiple terminal health owners,
or an unterminated route.

Manifest resource declarations are ceilings, not estimates. The reviewed local
reservation function derives exact instance grants from validated configuration
and cannot exceed those ceilings. `activeProjectiles` is a subset of
`activeEntities`, but both independent ceilings must pass. Runtime keys are
namespaced by instance. Spawn rate uses a deterministic trailing 1,000 ms
kernel-time window; timer count uses acquired live timers.

Leases are lifecycle-scoped: `startLeases` cover input/port subscriptions,
timers, overlap watches, and update registrations; `instanceLeases` cover pools,
channels, state caches, and observation readers; `graphLeases` cover the router,
root actor directory, and shared budget ledger. Stop must zero start leases and
active pool entities; dispose must also zero instance leases; graph destruction
must zero graph leases. Normal pool exhaustion may drop-and-observe only when
explicitly configured.

## Module specifications

### `intent.keyboard-movement@1.0.0`

- **Responsibility:** sample Arrow and WASD state once per update, merge the two
  key sets, normalize diagonals, and emit an active or neutral movement command.
- **Non-responsibility:** touch handling, arbitration, speed, actor mutation,
  bounds, aiming, attack input, or key listener ownership.
- **Configuration Schema:** strict `{bindings:"arrows-and-wasd",
normalizeDiagonal:true, emitNeutral:true}`; no custom key codes in v1.
- **Ports:** no input; event output `command: movement-command-v1`.
- **State/entity ownership:** last emitted command and sequence;
  `player.movement-intent-source.keyboard`; no entity.
- **Kernel interfaces:** keyboard direction polling, clock, output emitter,
  namespaced observation.
- **Dependencies/conflicts/cardinality:** provides owner-scoped
  `intent.movement-source@1.0.0`; no dependency or conflict; at most one per
  owner and 16 per assembly.
- **Lifecycle/resources:** initialize sequence, start polling, update once per
  frame, stop releases polling without emitting after the graph blocks events,
  dispose clears state; zero entities/projectiles/spawn rate/timers.
- **Deterministic failures:** missing keyboard service, non-finite direction,
  non-monotonic time/sequence, output validation failure, or update after
  disposal.
- **Acceptance:** unit tests cover eight directions, neutral, Arrow/WASD merge,
  diagonal normalization; contract tests cover owner-scoped binding and stopped
  event rejection; resource test proves zero leases; interaction tests feed the arbiter;
  desktop browser evidence reproduces legacy velocity directions and touch
  browser evidence confirms keyboard inactivity causes no movement.

### `intent.touch-drag@1.0.0`

- **Responsibility:** track one pointer deterministically and emit absolute
  world-position movement commands while it is actively dragged.
- **Non-responsibility:** clamping, direct actor mutation, multi-touch gestures,
  attack/aim intent, arbitration, or velocity calculation.
- **Configuration Schema:** strict `{capture:"first-active",
release:"matching-pointer-up", emitOnDown:false}` to match the legacy drag
  path; additional gestures are outside v1.
- **Ports:** no input; event output `command: movement-command-v1`.
- **State/entity ownership:** captured pointer ID, latest position, sequence;
  `player.movement-intent-source.touch`; no entity.
- **Kernel interfaces:** cancellable pointer down/move/up subscriptions, clock,
  output emitter, observation.
- **Dependencies/conflicts/cardinality:** provides owner-scoped
  `intent.movement-source@1.0.0`; no dependency or conflict; one per owner, 16
  per assembly.
- **Lifecycle/resources:** subscribe on start; on stop release capture without
  emitting, and remove all three listeners; dispose is idempotent; zero declared
  resources.
- **Deterministic failures:** duplicate capture, move from a non-captured
  pointer, invalid coordinates, missing disposer, listener after stop, or
  payload failure. Non-captured moves are ignored and observed, not failures.
- **Acceptance:** unit tests cover capture/move/up and competing pointers;
  contract tests prove listener removal and owner scope; resource test proves no
  residual listener lease; interaction test feeds the arbiter; mobile browser
  evidence matches legacy drag-to-pointer behavior after viewport clamping and
  new-game re-instantiation proves no duplicate listeners.

### `intent.movement-arbiter@1.0.0`

- **Responsibility:** deterministically select one movement source and emit the
  single command consumed by locomotion.
- **Non-responsibility:** reading devices, smoothing, applying speed/bounds,
  modifying commands, or combining simultaneous vectors.
- **Configuration Schema:** strict `{policy:"touch-while-active-else-keyboard",
keyboardSourceId, touchSourceId}` using declared instance IDs; v1 does not
  average sources.
- **Ports:** event input `commands: movement-command-v1`, required, multiple,
  same owner; event output `resolved: resolved-movement-command-v1`.
- **State/entity ownership:** latest validated command per bound source and last
  selected source; exclusive `player.movement-intent`; no entity.
- **Kernel interfaces:** input subscription, output emitter, clock, observation.
- **Dependencies/conflicts/cardinality:** requires owner-scoped
  `intent.movement-source@^1.0.0` at least one; conflicts with other owners of
  `player.movement-intent`; one per owner, 16 per assembly.
- **Lifecycle/resources:** initialize verifies configured IDs are bound; start
  subscribes; stop removes subscriptions without emitting; locomotion itself
  zeroes velocity during reverse stop; dispose clears
  retained commands; zero resources.
- **Deterministic failures:** configured source not bound, duplicate source ID,
  stale/non-monotonic source sequence, command from undeclared source, or output
  failure.
- **Acceptance:** table-driven unit tests prove touch wins only while active and
  keyboard resumes immediately on touch release; contract tests reject wrong
  owner/unbound IDs; resource test is zero; interaction tests cover both input
  modules; desktop/mobile browser test holds a key while dragging and proves the
  same priority and release transition on every run.

### `locomotion.bounded@1.0.0`

- **Responsibility:** apply the resolved velocity or absolute-position command
  to the owner actor and keep its collision body inside configured viewport
  insets.
- **Non-responsibility:** input acquisition/arbitration, actor creation,
  animation, dash/focus/inertia, collision consequences, or camera movement.
- **Configuration Schema:** strict `{moveSpeed:50..2000,
bounds:{left:0..256,right:0..256,top:0..256,bottom:0..256},
absoluteMode:"clamp", neutralMode:"zero-velocity"}` with cross-field proof
  that a positive play area remains.
- **Ports:** required same-owner event input `command:
resolved-movement-command-v1`; no gameplay output.
- **State/entity ownership:** latest command and owner actor transform/velocity;
  exclusive `player.locomotion`; it references but does not create/destroy the
  host-owned actor.
- **Kernel interfaces:** owner actor handle, viewport, input subscription,
  observation.
- **Dependencies/conflicts/cardinality:** requires owner-scoped
  `intent.movement-resolved@1.0.0`; conflicts with any other player-transform
  owner; one per owner, 16 per assembly.
- **Lifecycle/resources:** initialize resolves an active owner actor; start
  subscribes and zeroes velocity; update applies velocity or clamped absolute
  position; stop zeroes velocity and unsubscribes; dispose drops actor handle;
  no created resources.
- **Deterministic failures:** missing/inactive owner actor at start, invalid
  bounds, non-finite command, actor ownership mismatch, or actor operation after
  disposal.
- **Acceptance:** pure tests prove speed, normalization preservation, all four
  bounds, corners, and absolute clamp; contract tests prove exclusive transform
  ownership; zero-resource test; keyboard/touch interaction tests; desktop and
  mobile browser evidence compares positions, velocity, and boundary tolerance
  with the fixed scene at identical public inputs.

### `targeting.fixed-forward@1.0.0`

- **Responsibility:** publish the legacy world-up normalized target direction
  for the primary attack channel.
- **Non-responsibility:** player input, target discovery, homing, trigger timing,
  projectile creation, or directional shooting.
- **Configuration Schema:** reuse the fixture contract exactly:
  `{angleDegrees:-90}`.
- **Ports:** no input; state output `selection: target-selection-v1` with
  replay-latest semantics.
- **State/entity ownership:** immutable direction; exclusive
  `attack.primary-targeting`; no entity.
- **Kernel interfaces:** output emitter and observation only.
- **Dependencies/conflicts/cardinality:** provides owner-scoped
  `targeting.selection@1.0.0`; conflicts with another primary-targeting owner;
  one per owner, 16 per assembly.
- **Lifecycle/resources:** seed world-up state during initialize; the router
  replays it after all modules initialize and on pause/resume consumer
  reactivation; stop/dispose retain no start lease; zero gameplay resources.
- **Deterministic failures:** angle differs from `-90`, normalized vector is
  invalid, or emission is unbound/invalid.
- **Acceptance:** unit test proves exactly `{x:0,y:-1}` within fixed epsilon;
  contract test reuses the legacy-forward fixture; zero-resource test;
  interaction test feeds delivery; browser evidence proves every Batch 1 player
  projectile has zero horizontal velocity and negative vertical velocity.

### `trigger.interval@1.0.0`

- **Responsibility:** emit one primary attack request at each admitted interval
  while started.
- **Non-responsibility:** aim, damage, ammunition, attack input, projectile
  spawning, pool policy, or pause rules beyond lifecycle stop.
- **Configuration Schema:** strict `{intervalMs:50..10000,
firstEmission:"after-interval"}`; the fixed option preserves legacy timing.
- **Ports:** no input; event output `request: attack-request-v1`.
- **State/entity ownership:** timer, request sequence, last fire time; exclusive
  `attack.primary-trigger`.
- **Kernel interfaces:** charged cancellable clock timer, output emitter,
  observation.
- **Dependencies/conflicts/cardinality:** provides owner-scoped
  `trigger.attack@1.0.0`; conflicts with another primary-trigger owner; one per
  owner, 16 per assembly.
- **Lifecycle/resources:** initialize sequence; start/resume acquires exactly one
  loop timer after the graph is ready to enter running; stop/pause cancels it;
  game restart creates a fresh graph; dispose cancels exactly once; resources
  `timers:1`, all other fields zero.
- **Deterministic failures:** second live timer, early/late callback outside fake
  clock contract, timer callback after stop, non-monotonic request sequence, or
  budget/port failure.
- **Acceptance:** fake-clock unit tests cover first delay, repeated cadence,
  pause/resume, new-game re-instantiation, and no catch-up burst; contract test proves one primary owner;
  resource test observes peak timer count one; interaction test drives delivery;
  browser evidence compares fire-attempt timestamps to the legacy interval with
  one-frame tolerance.

### `delivery.projectile@1.0.0`

- **Responsibility:** combine the latest target direction with an attack request,
  acquire one projectile from its owned bounded pool, configure it, and publish
  channel/emission evidence.
- **Non-responsibility:** deciding when to fire, target selection, collision
  consequences, health mutation, trajectories other than constant straight
  motion, multi-shot, or enemy recycling.
- **Configuration Schema:** extend the fixture's bounded speed/damage with
  strict `{speed:100..2000,damage:0.001..100000,textureRole:"player-projectile",
spawnOffset:{x:-256..256,y:-256..256},maxActive:1..256,
maximumSpawnRate:1..20,recycleMargin:0..256,
poolExhaustion:"drop-and-observe"}`.
- **Ports:** required same-owner state input `target: target-selection-v1`;
  required same-owner event input `attack: attack-request-v1`; state output
  `projectiles: entity-channel-v1` and event output `emission: emission-v1`.
- **State/entity ownership:** latest selection, request sequence, pool/channel,
  projectile generation IDs, drop counters; exclusive
  `attack.primary-delivery`; owns every projectile until recycle/dispose.
- **Kernel interfaces:** owner actor read-only position, owned pool/channel,
  safe entity handles, asset role, viewport, per-instance budgets, output and
  observation.
- **Dependencies/conflicts/cardinality:** requires owner-scoped
  `targeting.selection@^1.0.0` and `trigger.attack@^1.0.0`; conflicts with
  another primary-delivery owner; one per owner, 16 per assembly.
- **Lifecycle/resources:** initialize resolves asset, creates an empty pool and
  channel, and seeds channel state; router replays target/channel state before
  running; attack events acquire/configure; update recycles inactive/out-of-bounds
  projectiles; stop deactivates and returns all while retaining the empty
  instance-owned pool/channel; resume replays state; dispose clears/destroys the
  pool and revokes the channel. Manifest ceilings are 256 active
  entities, 256 active projectiles, 20 spawns/second, and zero timers; the local
  reservation function grants `maxActive`, `maxActive`,
  `maximumSpawnRate`, and zero. Graph cross-validation proves the bound trigger
  cadence cannot exceed `maximumSpawnRate`.
- **Deterministic failures:** attack before target/channel start, stale request,
  invalid actor/asset, unowned entity, budget-accounting drift, undeclared
  channel access, or invalid emission. Admitted pool exhaustion records a drop
  without exceeding a budget.
- **Acceptance:** unit tests cover vector velocity, offset, damage, generation,
  recycling, and pool exhaustion; contract tests cover both required ports and
  channel grants; resource/property tests never exceed active or spawn limits;
  interaction test connects target+trigger+collision; desktop/mobile browser
  evidence matches legacy upward spawn, speed, damage, pool cap, offscreen
  recycle, and fire/drop counters.

### `combat.health@1.0.0`

- **Responsibility:** own one actor's bounded current/max health, apply declared
  damage in binding order, clamp at zero, and publish immutable state changes.
- **Non-responsibility:** collision detection, shields, invulnerability, healing,
  actor destruction, score, Boss phases, or outcome transitions.
- **Configuration Schema:** strict `{maxHealth:0.001..100000,
initialHealth:0.001..maxHealth,damageFloor:0}`.
- **Ports:** required same-owner, multiple event input `damage: damage-v1`;
  state output `state: health-state-v1` with replay-latest semantics.
- **State/entity ownership:** current/max health and revision; exclusive
  `combat.health`; it references no entity.
- **Kernel interfaces:** input subscription, output emitter, observation.
- **Dependencies/conflicts/cardinality:** provides owner-scoped
  `combat.health@1.0.0` and terminal `combat.damage-sink@1.0.0`; it has no
  downstream sink output; conflicts with another health owner or terminal sink
  for the actor; one per owner, 128 per assembly.
- **Lifecycle/resources:** initialize state and seed revision zero in the state
  router; each running damage event increments once and replaces latest state;
  stop/pause releases event subscriptions without resetting instance state;
  resume replays current state; game restart disposes and instantiates fresh
  initial state; zero gameplay resources.
- **Deterministic failures:** damage target differs from owner, non-positive or
  non-finite amount, duplicate contact sequence from one source, damage after
  stop, revision overflow, or payload failure.
- **Acceptance:** unit/property tests cover subtraction, zero clamp, order,
  depletion-once, and duplicate rejection; contract tests prove owner identity
  and multiple declared damage producers; zero-resource test; collision
  interaction test proves one contact causes one revision; browser evidence
  compares enemy and player health deltas to fixed-scene basic damage with
  shield/invulnerability disabled for this slice.

### `interaction.projectile-contact@1.0.0`

- **Responsibility:** watch overlap between one authorized projectile channel
  and the owner actor and emit exactly one immutable contact candidate per
  active source generation/target pair.
- **Non-responsibility:** consuming, deactivating, transferring, or reflecting
  the source; selecting a combat policy; emitting hit/damage; health/defense.
- **Configuration Schema:** strict source entity role, target actor role, and
  `maximumTrackedContacts:1..4096`; target role must equal the owner actor role.
- **Ports:** required state input `sources: entity-channel-v1` with structured
  `different-owner`, source actor roles, target actor roles, and source entity
  roles; event output `candidate: contact-candidate-v1`.
- **State/entity ownership:** one overlap rule, contact sequence, and bounded
  active-generation ledger; exclusive `combat.contact-detection.<source-role>`;
  owns no source or target entity.
- **Kernel interfaces:** read-only authorized source channel, owner actor handle,
  cancellable overlap, active-generation snapshot, output, observation.
- **Dependencies/conflicts/cardinality:** requires a compatible entity-channel
  capability; conflicts only with an identical detector rule; up to 64 per
  assembly and one identical source/target rule per owner.
- **Lifecycle/resources:** initialize validates authorization; start registers
  one overlap start lease; each update prunes entries whose source generation is
  no longer active; stop removes overlap and clears running ledger; dispose
  releases state. Gameplay resources zero; one overlap start lease, one port
  start lease, one observation instance lease.
- **Deterministic failures:** wrong role/owner/channel, stale source generation,
  candidate for an inactive entity, duplicate contact, ledger ceiling reached,
  missing disposer, event before running/after stop, or payload failure.
- **Acceptance:** tests prove no source mutation, exactly-one candidate, role
  authorization, active-generation pruning, hard ledger bound, stop cleanup,
  and long-running memory stability; browser evidence shows contact count and
  geometry match the fixed path.

### `interaction.contact-default-damage@1.0.0`

- **Responsibility:** synchronously transform one frozen seed decision into the
  default `damage/consume` decision in an admitted contact-policy transaction.
- **Non-responsibility:** collision detection, entity mutation, shield,
  invulnerability, absorption, reflection, polarity, or health mutation.
- **Configuration Schema:** strict `{damageKind:"projectile",
defaultDisposition:"damage",defaultSourceOperation:"consume"}`.
- **Ports/execution ABI:** no ordinary state/event ports. Registration declares
  `executionModel:"contact-policy-transform-v1"`, transform input/output
  `contact-decision-v1`, `policyPhase:"default"`, empty predecessor,
  resolver-only successor, reviewed evidence ID, and mutable fields
  `disposition,sourceOperation,damage`.
- **State/entity ownership:** stateless; exclusive policy role
  `combat.contact-policy.default-damage`; no entity, subscription, or grant.
- **Kernel interfaces:** none. The transaction host supplies and receives frozen
  values; the transform cannot access ports, time, actors, entities, or async
  services.
- **Dependencies/conflicts/cardinality:** exactly one default policy in each
  admitted profile; conflicts with another default initializer; later transforms
  are allowed only through the selected profile's exact order.
- **Lifecycle/resources:** bundle registration follows graph lifecycle but the
  transform acquires no lease and owns no mutable instance state; zero gameplay
  and runtime resources.
- **Deterministic failures:** Promise/thenable or missing return, throw, input
  mutation, identity/trace/undeclared-field change, invalid disposition-operation
  pair, non-positive damage, profile mismatch, or second invocation in one
  transaction.
- **Acceptance:** one invocation returns exactly one frozen `damage/consume`
  result, changes only its allowlist, and cannot touch the source. Contract tests
  reject missing/double/async/throwing/identity-changing transforms and prove the
  host records this policy ID exactly once.

### `interaction.contact-resolution@1.0.0`

- **Responsibility:** receive one candidate, run its resolved policy profile as
  one bounded synchronous transaction, validate the unique final decision,
  perform the sole authorized source operation, and emit resulting evidence.
- **Non-responsibility:** overlap detection, inventing/reordering policies,
  shield/invulnerability behavior, health storage, score, or outcome.
- **Configuration Schema:** strict `{policyProfileId,policyProfileVersion,
allowedDispositions,maxResolvedContacts}` plus
  `allowedSourceOperations`; Batch 1 selects the reviewed default-damage profile,
  `allowedDispositions:["damage"]`, and
  `allowedSourceOperations:["consume"]`.
- **Ports:** required event input `candidate: contact-candidate-v1`; event outputs
  `hit: hit-v1`, `damage: damage-v1`, and later optional resource/transfer
  evidence. Each damage output binds exactly one same-target-owner
  `combat.damage-sink@1.0.0`, never a concrete health requirement.
- **State/entity ownership:** resolution sequence and bounded in-flight set;
  exclusive `combat.contact-resolution.<source-role>`; it owns no entity but has
  the only explicit mutation grant for the bound source channel.
- **Kernel interfaces:** policy-transaction host, authorized mutable channel
  operation, owner identities, event input/output, budget ledger, observation.
- **Dependencies/conflicts/cardinality:** requires an exactly resolved
  `ContactPolicyChainProfile`, its policy artifacts, and for damage one linear
  same-owner damage-sink chain ending at unique health; conflicts with another
  resolver for the same contact rule; up to 64 per assembly.
- **Lifecycle/resources:** each running candidate resolves wholly in one
  depth-bounded synchronous transaction; only after success may consume or
  transfer occur, before result events. Stop releases the candidate subscription
  and clears in-flight work; dispose revokes mutation. Zero gameplay resources;
  one port start lease and one observation instance lease.
- **Deterministic failures:** unknown/unreviewed profile or order; missing,
  repeated, async, throwing, identity-changing, or unauthorized transform;
  invalid disposition-operation pair or trace; inactive/changed source
  generation; duplicate resolution; unauthorized mutation; non-linear,
  below-head bypassed, forked, cyclic, duplicated, or unterminated damage-sink
  route; event outside running; or
  payload failure. Transform failure emits nothing and performs no mutation.
- **Acceptance:** tests prove each policy is invoked exactly once in exact order,
  identity and source remain unchanged until a valid final decision, and failed
  transforms produce no mutation/event. Successful consume precedes hit/damage;
  Batch 1 damage traverses its sole terminal sink and causes one health revision.

## Representative end-to-end interactions

### Keyboard intent to bounded movement

`intent.keyboard-movement.command -> intent.movement-arbiter.commands ->
locomotion.bounded.command`. The fake clock advances one frame, the keyboard
module emits a normalized direction, the arbiter selects keyboard, and
locomotion applies `direction * moveSpeed`, with the host physics body enforcing
the configured inset bounds. Neutral input zeros velocity in the same frame.

### Touch drag to bounded movement

`intent.touch-drag.command -> intent.movement-arbiter.commands ->
locomotion.bounded.command`. Pointer down captures without moving, matching
legacy behavior; a captured pointer move emits an absolute world position; the
arbiter selects touch; locomotion clamps and sets position. Pointer up makes
touch inactive and zeros or transfers control according to arbitration.

### Simultaneous keyboard and touch

Both source outputs bind to the arbiter's multiple input. Active captured touch
always wins, independent of callback order. The arbiter retains the latest
keyboard command and selects it on the same deterministic dispatch turn as the
matching pointer-up event. It never adds vectors or applies both commands.

### Fixed target to interval trigger to projectile delivery

The target module seeds world-up state during initialize. After every module
initializes the router replays that state to delivery; only after the graph is
running can the trigger emit request 0 after exactly one interval. Delivery has a target, acquires one pool item,
positions it at the owner actor plus offset, applies negative-y velocity, and
emits the entity channel/emission evidence. Missing target or pool grant fails
or records a permitted pool drop; it never invents a default aim.

### Projectile hit to damage to health

`delivery.projectile.projectiles -> interaction.projectile-contact.sources ->
interaction.contact-resolution.candidate -> [reviewed default-damage policy
profile] -> combat.damage-sink -> combat.health.damage`. Detection emits a
candidate without mutating the projectile. Resolution creates the frozen seed
and synchronously invokes the exact registered profile; the default transform
returns `damage/consume`. Only after the transaction validates does the resolver
consume the active generation and emit hit/damage. The same-owner linear sink
chain terminates at health, which replaces its state once. Observation after
synchronous resolution sees both the source action and health revision complete.

### Pause, resume, game restart, and release

Graph stop means pause: it blocks events, removes contact watches and all other
start leases, cancels the trigger timer, zeroes locomotion, releases pointer
capture, and returns every projectile while retaining empty instance-owned
pools/channels and state. Resume reacquires start leases and replays latest
state before events resume. Game restart always disposes the old graph, revokes
instance leases, then instantiates a fresh graph. Graph destruction releases
router/root-directory/budget graph leases. Partial failure follows the same
scoped reverse rollback. No module pauses global scene physics.

## Legacy behavior equivalence proof

Parity is established by shared public-input traces and bounded observations,
not by identical implementation structure.

| Legacy behavior | Fixed-path reference                                                                          | Modular acceptance                                                                                                                                                                           |
| --------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keyboard        | Arrow/WASD union and normalized diagonal from `readDirection`                                 | Same eight directions, diagonal magnitude 1, speed, neutral stop, and sampled-frame positions within one physics-step tolerance                                                              |
| Touch drag      | First pointer ID; move only while down; set to clamped world position; release on matching up | Same down/move/up trace, positions within 0.5 px, competing pointer ignored, and no duplicate after new-game re-instantiation                                                                |
| Bounds          | Phaser world bounds plus viewport clamp                                                       | No collision body crosses configured equivalent bounds; all four edges/corners tested desktop and mobile                                                                                     |
| Basic fire      | First shot after configured interval; upward pooled projectile from player offset             | Fire timestamps within one frame, x velocity 0, y speed/damage/offset equal, active cap and recycle counters equal                                                                           |
| Basic combat    | Projectile consumed once; one configured damage applied; health clamps                        | One candidate enters the reviewed profile, default policy occurs once in trace, `damage/consume` traverses the sole sink, one health revision, and projectile is inactive before observation |
| Cleanup         | Scene transition cancels known timers and rebuilds scene                                      | Stop zeros start leases and active entities; dispose zeros instance leases; destruction zeros graph leases; two pause/resume and two new-game cycles show constant counts                    |

The modular browser fixture must run alongside, not replace, the existing
fixed-template desktop/mobile verification. Any parity mismatch is a reusable
contract/test failure; the immutable packaged baseline is never edited.

## Design review gate

Implementation may begin only when reviewers accept all of the following:

1. ADR 0025, this document, the roadmap, architecture, and base-library plan use
   the same ABI, module IDs, lifecycle, ownership, and next step.
2. Every new payload has a strict Schema and semantic tests planned; no runtime
   object crosses a data port.
3. Owner-scoped capabilities, structured role-constrained cross-owner inputs,
   entity-channel grants, and exact artifact identity fail closed.
4. Policy profiles and manifests agree on exact order; every transform is
   synchronous exactly once, preserves immutable identity, changes only
   allowlisted fields, and cannot mutate or emit on failure.
5. Disposition/source-operation pairs use the closed matrix, and every damage
   path enters its same-owner linear route head and ends at one terminal health;
   below-head bypass, fork, cycle, duplicate sink, and missing/multiple
   terminals fail in resolution.
6. State replay, pre-running event rejection, event-cycle rejection, all three
   lease scopes, reverse rollback/disposal, pause/resume, and new-game leak
   assertions are mandatory before a browser slice.
7. Per-instance budget grants reconcile with aggregate admission and are tested
   at exact limits and one-over-limit.
8. The Batch 1 interaction matrix covers keyboard, touch, simultaneous input,
   firing, contact candidate, transactional policy, final resolution, damage,
   health, pause/resume, new game, and partial-start failure.
9. Fixed-path tests and browser/package capability remain untouched.

## Exact implementation sequence after approval

1. Add strict state/event payload Schemas, decision matrix, damage-sink
   capability, policy transform/profile descriptors, capability scope,
   structured endpoint authorization, canonical descriptors, and artifact-hash
   rules; upgrade resolver output and fail-closed tests.
2. Add production bundle registration plus the deterministic instantiator/router
   with state replay, event phases, fake contexts, rollback, lifecycle-scoped
   leases, and budget grants.
3. Extend the kernel with cancellable input/overlap handles, safe entity
   handles/channels, and instance accounting; keep `PlayScene` behavior
   unchanged through its adapter.
4. Implement keyboard, touch, arbiter, and bounded locomotion with pure and
   interaction tests, then desktop/mobile parity evidence.
5. Implement fixed targeting, interval trigger, projectile delivery, projectile
   contact, the policy transaction host/default transform, final resolution, and
   terminal damage-sink health with resource and interaction tests, then the
   coherent browser slice.
6. Run the unified gate and preserved fixed-template browser regression before
   updating the next Phase 7 batch.
