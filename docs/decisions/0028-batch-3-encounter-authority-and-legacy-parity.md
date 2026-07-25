# ADR 0028: Batch 3 encounter authority, hostile-source custody, and legacy parity

- Status: Accepted
- Proposed: 2026-07-18
- Accepted: 2026-07-18
- Decision owner: user
- Design source: `docs/BATCH_3_MODULE_DESIGN.md`, Revision 2 freeze candidate
- Design SHA-256: `75dd92da3bde0974fcbde59ff565a5323a23fdf1a77428db8d259dcabef3d530`

## Context `[ABI28-CONTEXT-001]`

Batch 2 Core is complete. Manifest 1.3, Assembly 1.2, and Graph 1.3 legally
express player-owned attack triples, bounded snapshots, projectile lineage,
prepared effects, modifiers, defenses, independent projectile custody, and
aggregate sum admission. All 27 Batch 2 definitions are admitted. The graze
factory is frozen and tested, but its hostile-projectile integration was
explicitly deferred to Batch 3.

The current ABI cannot legally express the next source:

- V2 attack channels are keyed by a statically declared owner actor;
- `attack-request-v2` has no dynamic source generation;
- admitted pattern deliveries require the player projectile asset role;
- assemblies cannot grant actor-root creation or mutation;
- Graph 1.3 sums ordinary reservations and cannot express independent hostile
  pools contending for one overbooked active cap;
- health/damage routes are per static owner, not a bounded actor-root set;
- no assembly-scoped score writer or host-owned outcome commit exists.

Reusing the player as an enemy owner, changing Batch 2 manifest bytes, injecting
actor IDs, or sharing a physical pool would weaken ADR 0027. Batch 3 therefore
needs an explicit strict version boundary and new least-privilege authorities.

## Status and authorization `[ABI28-AUTH-001]`

The user accepted this ADR on 2026-07-18. The accepted bytes are the referenced
Revision 2 freeze candidate, which closes the three P1 findings from the first
review: fractional score bonuses, zero-window combo semantics, and frame-tail
outcome arbitration.

The design source intentionally retains its pre-acceptance candidate/status
header because ADR acceptance binds those exact immutable bytes. This ADR and
the current recovery documents, rather than that historical header, own live
authorization and implementation status.

Acceptance authorizes the contract/schema/resolver/host work, red tests, and
later factory sequence described here. It does not authorize a paid model
call, credential read, asset/corpus expansion, dependency addition, Git state
change, fixed-template retirement, or modification of a frozen Batch 1/2
artifact or immutable run.

## Decision summary `[ABI28-DECISION-001]`

Batch 3 will:

1. add Manifest 1.4, Assembly 1.3, and Graph 1.4 without reinterpreting older
   strict versions;
2. represent enemies and the Boss as bounded host-minted actor roots owned by
   exact encounter root channels;
3. resolve hostile source -> targeting -> delivery event pipelines carrying an
   exact actor generation;
4. keep every delivery's physical pool/channel independent while a host-owned
   contention group enforces the shared hostile cap;
5. add actor-root-set health/damage routes and source-first root contact;
6. add explicit score-source modules and one authoritative score ledger;
7. add condition modules and one win-first outcome coordinator using a
   host-owned deferred terminal commit;
8. preserve all fixed-template and Batch 1/2 regressions until modular recovery
   and package parity pass and the user separately considers retirement.

The normative module, payload, state-machine, reservation, interaction, and
rejection detail is the hash-bound design packet. This ADR owns its authority,
version, safety, and implementation boundaries.

## Goals `[ABI28-GOAL-001]`

- Make every enemy/Boss projectile trace to an active admitted root generation,
  reviewed pattern definition, exact channel, and hostile budget group.
- Keep actor, projectile, damage, score, and terminal-state writers explicit.
- Bound every dynamic table by resolver evidence before a factory runs.
- Preserve source-first mutation and conservative quarantine on indeterminate
  physical/logical custody.
- Reuse legacy pure schedule, pattern, phase, scoring, and outcome semantics
  without embedding the fixed scene in the new kernel.
- Reach full modular legacy browser, recovery, and packaging parity.

## Non-goals `[ABI28-NONGOAL-001]`

- Batch 4 mechanics or general-purpose games;
- arbitrary dynamic subgraphs, runtime code loading, or module creation by an
  encounter factory;
- a shared hostile physical pool or cross-channel custody transfer;
- implicit payload adapters, role inference, or assembly-provided authority;
- model orchestration, OpenCode generation, paid calls, assets, or corpus work;
- fixed-path retirement.

## Version boundary `[ABI28-VER-001]`

| Contract | Preserved    | Batch 3   | Rule                                  |
| -------- | ------------ | --------- | ------------------------------------- |
| Manifest | 1.2.0, 1.3.0 | **1.4.0** | strict Batch 3 descriptors only       |
| Assembly | 1.1.0, 1.2.0 | **1.3.0** | data-only roots/groups/routes/outcome |
| Graph    | 1.2.0, 1.3.0 | **1.4.0** | exact grants, lineage, readiness      |

Graph 1.4 may select admitted Manifest 1.2/1.3/1.4 registrations. Factory
context is selected by manifest version. An older factory receives the exact
existing key set, phase matrix, payload registry view, and grants; it is never
upcast. Mixed-version isolated and desktop/mobile conformance is a pre-factory
gate.

There is no converter that rewrites an immutable Graph 1.2/1.3 artifact. The
legacy-Spec adapter creates a new Assembly 1.3 artifact and preserves the source
Spec hash.

## Manifest 1.4 authority closure `[ABI28-MAN-001]`

Manifest 1.4 contains Manifest 1.3 fields unchanged and adds strict optional
descriptors:

```ts
type GameModuleManifestV14 = Readonly<{
  schemaVersion: "1.4.0";
  // all V1.3 fields retain their exact structure
  actorRootProducer: ActorRootProducerDescriptorV1 | null;
  actorRootConsumers: readonly ActorRootConsumerDescriptorV1[];
  hostileAttackChannel: HostileAttackChannelDescriptorV1 | null;
  aggregateResourceClaims: readonly AggregateResourceClaimDescriptorV1[];
  actorSetDamageSink: ActorSetDamageSinkDescriptorV1 | null;
  actorRootContactConsumer: ActorRootContactConsumerDescriptorV1 | null;
  outcomeCommit: OutcomeCommitDescriptorV1 | null;
}>;
```

Absence grants no authority. IDs are unique canonical bytes covered by the
artifact envelope. Factories receive only instance-bound opaque grants, never
raw descriptors.

## Actor-root authority `[ABI28-ROOT-001]`

An actor-root producer declares one enemy or Boss role, exact state/lifecycle
ports, capacity configuration source, pool ID, closed source-ID field, asset
mapping field, and movement mode. Resolution binds configuration, admitted
assets, exact active-entity grants, channel capacity, and session quarantine
capacity.

The host chooses the lowest free slot and mints
`root/<producerInstanceId>/<slotIndex>` plus the next safe generation. The
factory cannot propose either identity. Generation and directory/lifecycle/
channel sequences use `safe-monotonic-v1` and fail before mutation on overflow.

Activation and deactivation use one physical/logical custody protocol:

```text
inactive -> activating -> active -> deactivating -> inactive
                 \-> quarantined       \-> quarantined
```

Activation pre-reserves slot, active-entity, and quarantine capacity before the
adapter call. Deactivation releases them only after both physical and logical
inactivity are proven. Indeterminate state transfers conservative tokens and
evidence to the ADR 0026 session quarantine ledger. It blocks graph creation,
verification, and packaging.

Consumers name an exact bound root channel, expected actor role, purpose, and
maximum capacity. A port binding is not read/mutation authority. Root iteration,
arbitrary predicates, raw directory access, engine objects, and factory-selected
IDs remain unavailable.

## Hostile attack pipeline `[ABI28-ATTACK-001]`

`attack-request-v3` contains request sequence, time, attack channel, source root
channel/actor/generation, pattern source, and per-generation emission index.
`targeted-attack-v1` adds the frozen source position and normalized direction.
`emission-v2` preserves the full source provenance beside projectile identity.

`HostileAttackChannelDescriptorV1` has exactly three roles:

```text
source: root activation -> attack-request-v3
targeting: attack-request-v3 -> targeted-attack-v1
delivery: targeted-attack-v1 -> entity-channel-v1 + emission-v2
```

Resolution keys the triple by exact root-channel lineage and attack-channel ID.
It rejects missing/duplicate roles, owner/role/channel mismatch, V2/V3 mixing,
wrong bindings, stale source identity, non-hostile asset roles, or missing
contention membership.

Encounter pattern triggers keep a bounded emitter table, emit index zero on
activation, and emit at most one due request per emitter per accepted frame in
stable activation/identity order. They do not catch up missed intervals. Source
or phase deactivation removes the schedule. Pause retains due simulation times;
resume continues because simulation time did not advance. Restart creates a new
table and sequences.

Fixed targeting uses a configured normalized direction. Aimed targeting reads
one exact active player snapshot per request. Delivery consumes the frozen
result without re-resolution.

Hostile `delivery.pattern.*@1.1.0` registrations are new reviewed artifacts.
They reuse the reviewed planner, require `enemy-projectile`, expose no pickup
modifier input/target, and consume only V3 targeted events. Existing `@1.0.0`
registrations remain byte-identical player definitions.

Source deactivation cancels future requests but does not consume existing
projectiles. Those remain under their delivery instance/channel custody and
recycle only by contact, bounds, lifecycle stop, or terminal cleanup.

## Aggregate contention `[ABI28-BUDGET-001]`

Graph 1.4 introduces explicit `hostile-contention-v1` groups for active entity,
active projectile, and trailing-1,000-ms spawn capacity. Assembly group records
name exact members/capacities and fixed resolved-provider ordering. The resolver
proves every member is one hostile delivery, each local ceiling is within the
group, and membership is unique.

Admission contributes non-group reservations by exact sum and each group once
by group capacity. Existing Graph 1.3 sum semantics are unchanged. Player,
pickup, actor-root, and ordinary resources cannot use hostile overbooking.

Each projectile activation atomically obtains:

1. local pool slot and entity-generation capacity;
2. group active-entity and active-projectile tokens;
3. group spawn-window admission;
4. session quarantine reservation;
5. physical and logical activation.

Failure before mutation releases reservations. Proven recycle releases local
and group tokens. Quarantine retains them. Rate, group, or local exhaustion
drops one stable request/salvo suffix and records the exact cause. Independent
members never share physical pools or recycle each other's identity.

## Actor-set combat `[ABI28-COMBAT-001]`

`combat.health@1.2.0` binds one root channel and owns a bounded health entry per
active actor generation. Source-ID configuration supplies maximum health.
Activation initializes; `damage-v2` changes only the exact active generation;
inclusive zero emits one defeat request; successful root deactivation prunes
state. Static health versions remain unchanged.

Graph 1.4 resolves one same-root-channel linear actor-set damage route to one
terminal health bank. Projectile-root contact proves projectile source lineage,
root target lineage, candidate, consume grant, and target route. Actor-root body
contact proves root source lineage, static player target, root deactivation
grant, and existing player damage route.

`contact-decision-v2` admits only:

| Contact              | Decision/source operation |
| -------------------- | ------------------------- |
| projectile -> root   | `damage/consume`          |
| enemy root -> player | `damage/deactivate-root`  |

Prepare validates the complete route/evidence plan without mutation. Commit
mutates the source first, then attempts all fixed damage/evidence deliveries.
Indeterminate source mutation emits no gameplay, defeat, score, or outcome event
and enters quarantine. Body-contact deactivation reason is not score-eligible.

## Encounter semantics `[ABI28-ENCOUNTER-001]`

Scrolling waves preserve the pure legacy schedule and lane rules: non-empty
waves, `[startMs,endMs)`, first spawn at start, stable source-index order, safe
spawn counts, five fixed lanes, and both per-wave `maxAlive` and graph global
capacity. Movement/offscreen deactivation is bounded and host-owned.

At absolute `bossStartMs`, Boss phases requests an acyclic handoff. Waves stop
future activation and deactivate active enemy roots in stable identity order;
Boss activation occurs only after a cleared acknowledgement.

Boss phases preserve strict descending thresholds and inclusive selection.
Phase exit cancels old pattern sources before the next phase activates its
configured patterns in array order. Pattern schedules preserve immediate index
zero and `floor(duration/interval)+1` emissions.

## Scoring authority `[ABI28-SCORE-001]`

Defeat, graze, and scoreBonus pickup modules convert immutable source evidence
into bounded score inputs. Combo transforms only defeat input, preserving the
positive inclusive window, integer count, fractional cap, floored award, and
expiry after the window. The continuation predicate is exactly
`comboWindowMs > 0 && lastDefeatAtMs != null && delta <= comboWindowMs`; a zero
window never chains same-millisecond defeats. Graze and pickup awards remain flat.

`scoring.ledger@1.0.0` is the only score writer and an assembly singleton. It
accepts bounded finite non-negative IEEE-754 binary64 awards, including legal
fractional `scoreBonus` values such as `7.5`. It rejects duplicate source evidence
before mutation and performs one ordinary binary64 addition in stable router
order with no rounding, flooring, decimal scaling, epsilon, coercion, or
reassociation. The next total must remain finite, non-negative, and no greater
than `Number.MAX_SAFE_INTEGER`; it need not be an integer. Identity sequences,
capacities, and event counts remain safe integers. The ledger publishes
`score-state-v1`, and inclusive outcome comparison uses that value unchanged.

Its duplicate capacity is resolved from maximum wave/Boss defeats, hostile
projectile generations eligible for one-shot graze, and scheduled pickups. No
factory may estimate or grow the ledger. The unchanged admitted Batch 2 graze
factory is instantiated once per hostile channel; scoring reads its evidence
without widening its context or mutation authority.

## Outcome authority `[ABI28-OUTCOME-001]`

Player-health, Boss-defeat, score-threshold, and survival-time modules publish
read-only retained condition state. Thresholds are inclusive. The selected
coordinator is an assembly singleton, reads exactly one win and one loss for the
legacy graph, and cannot commit from an ordinary update or event handler.

Graph 1.4 owns one `post-provider-post-event-frame-v1` barrier per accepted
frame. Timers and their nested events finish first; all participant updates run
provider-first and fully drain nested events; only then does the host invoke the
resolved coordinator exactly once. Condition state carries a host-assigned
`eligibleFrameSequence`; an external event between frames becomes eligible only
at the next accepted frame. The coordinator atomically snapshots eligible win/
loss states at the barrier, evaluates win first, and may latch one decision.
Callback arrival order therefore cannot turn a same-frame win/loss tie into a
loss.

The outcome commit service additionally requires the exact arbitration token and
frame sequence. The arbitration subphase cannot publish ordinary state/events,
schedule timers, register input/overlaps, mutate actors/entities, or enter
lifecycle. The service validates selected evidence, score, elapsed simulation
time, safe identity capacity, phase, and unlatch state under the existing
transition guard. It blocks later gameplay but does not call scene lifecycle
reentrantly. After guard release, the host performs reverse graph cleanup and
requires clean session evidence before asking the lifecycle adapter to enter the
end scene.

Cleanup/adapter failure cannot publish a passing terminal result. Restart is
dispose/destroy/new instantiation; no actor generation, timer, health, scoring,
condition, or latch state crosses the boundary.

## Assembly 1.3 and Graph 1.4 readiness `[ABI28-READY-001]`

Assembly 1.3 remains strict data and adds exact root bindings, hostile budget
groups, actor-set damage routes, root mutation selections, and one outcome
coordinator selection. It may not contain a dynamic actor ID, code, path, URL,
import, package, command, callback, expression, executable data, or runtime
handle.

Readiness requires exact registration/catalog bytes plus:

- root producer/consumer role, capacity, asset, and lifecycle lineage;
- V3 hostile triples and source generations;
- independent channel custody and complete contention groups;
- actor-set health/damage route termination;
- source candidate/mutation/target lineage for both contact forms;
- bounded score sources, duplicate capacity, and singleton ledger;
- exact selected conditions, singleton coordinator, frame-tail arbitration
  barrier/token, and outcome commit;
- all phase, lease, timer/update, overlap, observation, aggregate, quarantine,
  browser-boundary, and safe-counter evidence.

Any missing or inconsistent requirement yields one immutable blocked readiness
report. Browser instantiation accepts only a ready Graph 1.4 and matching frozen
catalog evidence.

## Verification gate `[ABI28-GATE-001]`

Before the first Batch 3 production factory:

1. strict 1.4/1.3/1.4 schemas, canonical records, and unknown/version rejection pass;
2. all older canonical bytes and test suites remain unchanged;
3. mixed V1.2/V1.3/V1.4 contexts pass resolver, isolated, and desktop/mobile
   browser conformance with no authority leakage;
4. root exact/one-over activation, generation overflow, rollback, reuse,
   deactivation, quarantine, and cleanup pass;
5. root consumers reject wrong provider/role/capacity/purpose/stale generation;
6. V3 pipelines reject missing/duplicate roles, wrong binding/channel/source,
   V2 mixing, stale source, wrong asset, and target re-resolution;
7. emitter timing proves immediate first emission, per-frame maximum one,
   stable order, phase/source cancellation, pause retention, and fresh restart;
8. contention proves independent pools, group admission formula, local/group/rate
   exact/one-over, stable suffix drops, token retention in quarantine, and no
   Graph 1.3 semantic change;
9. projectile-root and root-player contact prove prepare purity, source-first
   commit, route-head enforcement, all-attempt delivery, no body defeat score,
   and no result on indeterminate mutation;
10. actor-set health proves generation reset, duplicate defeat suppression,
    stale damage rejection, and bounded prune;
11. scoring proves positive-window combo continuation, zero-window rejection of
    same-time chaining, inclusive expiry, fractional cap/floor, exact `7.5`
    scoreBonus preservation, stable binary64 addition, no coercion/rounding,
    source dedupe, derived capacity, bounded finite total, and one writer;
12. outcomes prove every inclusive threshold, opposite callback orders within
    one frame sequence, once-only post-provider/post-event arbitration,
    configured win-first precedence, barrier-token-only commit, singleton latch,
    deferred transition, cleanup failure, and new graph restart;
13. wave lanes/windows/maxAlive, Boss handoff/phases, and all eight legacy pure
    planners match existing test vectors;
14. focused tests, `pnpm check`, isolated/root builds, and fixed/Batch 1/2
    desktop/mobile regressions pass;
15. the complete modular legacy graph passes equivalent desktop/mobile,
    recovery-hash, quarantine, and package gates before retirement is discussed.

## Implementation order after acceptance `[ABI28-IMPL-001]`

1. Schemas/types/canonical evidence and red version-isolation tests.
2. Pure resolver/readiness for roots, hostile triples, groups, actor-set routes,
   scoring capacity, and outcome selection.
3. Mixed-version factory context and browser-boundary conformance.
4. Root custody/quarantine and aggregate contention hosts.
5. V3 payload routing, actor-set damage/contact, bounded binary64 score ledger,
   frame-tail arbitration, and outcome commit.
6. Complete ABI gate and preserved browser regressions.
7. Encounter/source factories, then scoring/outcome factories.
8. Unchanged graze integration after hostile source admission.
9. Deterministic legacy assembly, full browser/recovery/package parity.

Each boundary is sequential. Gameplay factories cannot supply a missing shared
host behavior locally.

## Rejected alternatives `[ABI28-REJECT-001]`

- Widening Manifest 1.3/Graph 1.3 or relabeling an admitted player delivery.
- Predeclaring one full module graph per possible enemy, which makes module
  count scale with `maxEnemies * patternCount` and hides reuse behavior.
- Letting encounter code own health, score, pattern geometry, collision damage,
  or terminal scene rules.
- Factory-created actor IDs/generations or arbitrary actor-directory mutation.
- Reusing V2 requests without source generation or inferring it from current state.
- One shared hostile physical pool or cross-channel recycle authority.
- Factory-local global counters, assembly self-attested concurrency proofs, or
  ordinary group membership by matching string.
- Consuming old projectiles when their source root deactivates.
- Damage before root/projectile source mutation, or score before proven defeat.
- Multiple score writers, score mutation in graze/pickup/encounter, or an
  unbounded duplicate set.
- Safe-integer-only score awards, silent rounding/scaling of a legal fractional
  scoreBonus, or reassociated accumulation that changes legacy binary64 results.
- Direct scene transitions or terminal commit from an event/ordinary update
  handler, pre-barrier loss latching, or loss-first tie breaking.
- Retiring the fixed path when only functional play, but not recovery/package
  parity, has passed.

## Consequences `[ABI28-CONSEQ-001]`

- Batch 3 requires a larger ABI gate before gameplay factories, but dynamic
  source count no longer multiplies module instances.
- Hostile physical pools remain independent while legacy global bullet caps are
  expressed without unsafe factory coordination.
- Actor-root, score, and terminal evidence become explicit and bounded.
- Existing pure legacy functions remain reusable test oracles.
- The fixed path and all Batch 1/2 evidence remain mandatory regressions.

## Relationship `[ABI28-REL-001]`

This decision extends ADRs 0025-0027. It does not supersede their version
isolation, trusted loading, phase matrix, exact services, source-first mutation,
safe counters, prepared effects, projectile lineage, independent custody,
quarantine, or fixed-path preservation. It implements the active Batch 3 gate
in `docs/ROADMAP.md` and leaves Batch 4 and Phase 8 in their existing order.
