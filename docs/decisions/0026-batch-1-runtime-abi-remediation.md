# ADR 0026: Batch 1 runtime ABI remediation

- Status: Accepted
- Date: 2026-07-17
- Decision owner: user
- Accepted by user: 2026-07-17

## Context

ADR 0025 defines the intended execution model for reviewed gameplay modules. A
pre-factory audit found that the implemented foundation does not yet close every
contract required by the eleven Batch 1 modules:

- no graph or participant `update(deltaMs)` path exists;
- scene shutdown can call `dispose` while the graph is running even though the
  coordinator rejects that transition;
- Graph 1.1 production eligibility is derived from registration kind without
  proving an executable export exists;
- dependency scope and module asset requirements are not expressible;
- module observation replaces one global reader;
- timer leases do not enforce exact live timer grants;
- factories can separate some entity or lease operations from the service that
  should account for them;
- final contact resolution does not own a mechanically enforced precommit and
  evidence boundary.

Existing tests remain valid evidence for routing, policy evaluation, logical
entity authority, leases, rollback, browser-safe imports, builds, and the fixed
template. They do not prove the missing paths. Gameplay factories must not
invent local substitutes for shared runtime behavior.

## Status and authorization `[ABI26-AUTH-001]`

The user accepted this ADR on 2026-07-17. Runtime ABI remediation is now the
active Phase 7 gate. Batch 1 factory implementation remains blocked until every
exit criterion passes. Acceptance does not authorize gameplay factories, a
default graph, asset download, model workflow, paid call, or Git state change.

## Goals

1. Make every shared Batch 1 runtime behavior mechanically expressible.
2. Bind executable functions to reviewed artifact bytes through a trusted build
   chain, not caller-supplied metadata.
3. Fail before side effects when identity, authority, phase, lease, exact
   resource evidence, or transaction capacity is missing.
4. Preserve deterministic execution, bounded memory, and reverse cleanup.
5. Preserve Manifest/Assembly/Graph legacy fixtures and the fixed-template path.
6. Keep Node admission outside the browser runtime closure.
7. Make the completion gate traceable from each normative rule to code and tests.

## Non-goals

- implementing the eleven gameplay factories;
- adding Phase 8 model adapters or OpenCode repair;
- expanding the asset corpus;
- retiring the fixed template;
- implementing safe cross-channel custody transfer;
- adding multiplayer, networking, or unrestricted engine access.

## Required version boundary `[ABI26-VER-001]`

The remediation introduces three explicit versions:

| Contract        | Existing version | Remediated version | Rule                                                |
| --------------- | ---------------- | ------------------ | --------------------------------------------------- |
| Module manifest | 1.0/1.1          | **1.2.0**          | Batch 1 production requires 1.2                     |
| Assembly spec   | 1.0              | **1.1.0**          | Adds exact asset bindings and 1.2 selections        |
| Resolved graph  | 1.1              | **1.2.0**          | Adds execution readiness and new resolved contracts |

Manifest 1.0/1.1, Assembly 1.0, and Graph 1.1 retain their current canonical
bytes and semantics. They remain available for legacy fixtures and regression.
They are not silently reinterpreted as new contracts.

Graph 1.2 never exposes the old `productionInstantiationAllowed` boolean. It
contains:

```ts
type GraphExecutionReadiness = Readonly<{
  status: "ready" | "blocked";
  evidenceId: string;
}>;
```

The detailed immutable readiness report remains Node-side:

```ts
type ExecutionReadinessReport = Readonly<{
  graphEvidenceId: string;
  status: "ready" | "blocked";
  blockers: readonly Readonly<{
    instanceId: string;
    code: string;
    evidenceId?: string;
  }>[];
}>;
```

The graph readiness value and report are produced by the same pure function and
must have the same evidence ID. Browser instantiation accepts only Graph 1.2
with `status: "ready"` and the matching frozen catalog evidence.

## Runtime layers `[ABI26-LAYER-001]`

```text
content-addressed reviewed bundle store
  -> trusted Node artifact loader and admission registry
  -> deterministic resolver plus readiness report
  -> generated, deeply frozen browser runtime catalog
  -> Graph 1.2 lifecycle/frame coordinator
  -> instance-scoped services and resource controllers
  -> Phaser adapters plus namespaced observation
```

Factories receive only instance-scoped services. They do not receive the
registry, resolver, raw lease ledger, raw entity directory, Phaser, DOM, full
kernel, filesystem, environment, credentials, or arbitrary imports.

## Trusted executable loading `[ABI26-LOAD-001]`

### Threat being closed

A caller must not be able to submit a correct artifact hash alongside an
unrelated `create` function or policy transform. TypeScript branding alone is
not proof that an in-memory function came from reviewed bytes.

### Admitted bundle form

A reviewed module bundle is a self-contained ESM closure with no top-level side
effects. Before any module code executes, static admission scans the complete
import closure and rejects:

- Node builtins, DOM globals, network APIs, environment/filesystem access, and
  arbitrary package resolution;
- dynamic `import()`, computed imports, `eval`, `Function`, WebAssembly loading,
  workers, child processes, and native addons;
- imports of the registry, resolver, orchestrator, test runner, credential
  sources, or mutable application singletons;
- top-level registration, timer creation, event subscription, global mutation,
  I/O, or calls other than admitted pure constant construction;
- exports other than the exact declared lifecycle factory or policy transform
  plus reviewed data constants.

Static analysis is necessary but not treated as a security sandbox. The
build/admission process also runs in an isolated process with no credentials,
no network authority, restricted filesystem access, a reviewed package allowlist,
and bounded CPU/time/output. Node `vm`, TypeScript branding, and code review alone
are not described as security boundaries.

### Content-addressed build and load chain

1. Admission receives one immutable byte buffer and validates canonical
   manifest/configuration/reservation descriptors, bundle closure, dependency
   lock, and toolchain identity against it.
2. The verified buffer is written once to a new content-addressed, read-only
   build input. The build never re-resolves the caller's original mutable path.
3. Exclusive creation plus post-write hash verification closes replacement
   between verification and build input creation. Existing paths, links, and
   hash collisions are rejected instead of overwritten.
4. The isolated build transforms that exact content-addressed input, scans the
   resulting closure again, and records input/output hashes and toolchain evidence.
5. The trusted loader imports only the generated admitted output and observes
   pre/post load guards proving zero registry, timer, listener, network, global,
   or filesystem side effects during module evaluation.
6. Any load-time side effect or unexpected export fails admission and terminates
   the isolated process; no handle or catalog entry is created.
7. A loader-private constructor creates an `ExecutableArtifactHandle`. Its
   validity is held in a private closure/`WeakSet`; constructors and minting
   authority are not exported.
8. The handle binds source/output bundle hashes, manifest hash, implementation
   ID, export name/kind, lock identity, toolchain identity, and loaded function.
9. The production registry accepts only a valid handle. It never accepts a
   caller-supplied function plus string hashes.
10. The same build process generates and deeply freezes the browser runtime
    catalog, records its evidence ID, and emits immutable catalog bytes.
11. Graph resolution binds each instance to the exact catalog entry evidence ID.
12. Instantiation rechecks graph/catalog evidence identity before calling the
    already-frozen export.

The reviewed source bytes, generated output, and transformation are all evidence.
Browser runtime code cannot mint handles, register modules, or mutate catalog
entries. Byte drift, closure drift, export drift, evaluation side effects,
duplicate identity, TOCTOU evidence mismatch, or catalog mutation blocks Graph
1.2 readiness.

## Manifest 1.2 `[ABI26-MAN-001]`

### Dependencies

```ts
type ModuleDependencyV12 = Readonly<{
  moduleId: string;
  versionRange: string;
  optional: boolean;
  scope: "owner" | "assembly";
}>;
```

- Owner scope requires exactly one matching provider with the same resolved
  owner, or zero when optional.
- Assembly scope requires exactly one matching provider in the assembly, or zero
  when optional.
- Optional always means zero or exactly one. Multiple matches are ambiguous and
  rejected; the resolver never selects one arbitrarily.
- Dependency and capability edges form one combined DAG. Cycle detection runs
  after all matches and before construction order is emitted.
- Provider-first order follows the combined DAG; lexical instance ID breaks
  otherwise equal ordering.

### Asset requirements

```ts
type ModuleAssetRequirementV12 = Readonly<{
  roleId: string;
  category: string;
  cardinality: "exactly-one" | "optional-one";
  sharing: "instance" | "assembly";
}>;
```

Role ID, category, cardinality, and sharing are canonical manifest bytes.

### Runtime contract descriptor

```ts
type ModuleRuntimeContractV12 = Readonly<{
  update: Readonly<{
    mode: "graph-frame-v1";
    registrationId: string;
  }> | null;
  timerSlots: Readonly<{
    slotGroupId: string;
  }>;
  inputRegistrations: readonly Readonly<{
    registrationId: string;
    kind: "keyboard" | "pointer-down" | "pointer-move" | "pointer-up";
  }>[];
  observationReaders: readonly Readonly<{
    readerId: string;
  }>[];
  contactCommit: Readonly<{
    commitServiceId: string;
    maximumConcurrentCommits: number;
    admittedOperations: readonly ("consume" | "retain")[];
  }> | null;
}>;
```

The schema enforces stable identifier syntax and uniqueness. Factories reference
only declared semantic registration IDs; host code derives lease keys. Update,
observation, generated timer slots, input/overlap, port/cache, pool/channel, and
commit leases all count toward the appropriate manifest ceiling.

Lease keys use host-owned namespaces:

```text
graph/<assemblyId>/<service>
module/<instanceId>/start/<kind>/<slot>
module/<instanceId>/instance/<kind>/<slot>
```

Factories never concatenate or submit lease keys. Resolver/host code derives
them from canonical descriptors and resolved IDs. Module and graph namespaces
cannot collide.

### Authoritative service-identity derivation

Every runtime service identity has one canonical source and key template:

| Runtime service               | Canonical identity source                                    | Host-derived key suffix or full graph key   |
| ----------------------------- | ------------------------------------------------------------ | ------------------------------------------- |
| update registration           | `runtimeContract.update.registrationId`                      | `start/update/<registrationId>`             |
| timer slots                   | `runtimeContract.timerSlots.slotGroupId` + exact grant index | `start/timer/<slotGroupId>/<index>`         |
| keyboard/pointer listeners    | `runtimeContract.inputRegistrations.registrationId`          | `start/input/<registrationId>`              |
| observation readers           | `runtimeContract.observationReaders.readerId`                | `instance/observation/<readerId>`           |
| contact commit infrastructure | `runtimeContract.contactCommit.commitServiceId`              | `instance/contact-commit/<commitServiceId>` |
| port subscriptions            | input port ID + resolved binding ID                          | `start/port/<portId>/<bindingId>`           |
| retained state cache          | state output port ID                                         | `instance/state/<portId>`                   |
| overlap watch                 | contact detector rule ID                                     | `start/overlap/<ruleId>`                    |
| physical pool                 | owned-channel pool ID                                        | `instance/pool/<poolId>`                    |
| logical entity channel        | owned channel ID                                             | `instance/channel/<channelId>`              |
| external channel reader       | resolved channel grant ID                                    | `instance/channel-reader/<grantId>`         |
| external mutation capability  | resolved mutation access ID                                  | `instance/channel-mutation/<accessId>`      |
| policy transform              | policy execution descriptor                                  | no ordinary runtime lease                   |
| actor read/write              | resolved owner-actor authority                               | no separately acquirable factory lease      |
| router                        | Graph 1.2 system descriptor                                  | `graph/<assemblyId>/router/main`            |
| root entity directory         | Graph 1.2 system descriptor                                  | `graph/<assemblyId>/entity-directory/main`  |
| shared budget ledger          | Graph 1.2 system descriptor                                  | `graph/<assemblyId>/budget-ledger/main`     |

Manifest 1.2 extends each owned entity-channel declaration with one strict
`poolDescriptor` when the channel has physical pooled entities:

```ts
type OwnedPoolDescriptorV12 = Readonly<{
  poolId: string;
  entityRole: string;
  capacityResource: "activeEntities";
  projectileResource: "activeProjectiles" | null;
}>;
```

Pool ID is unique within the manifest. Entity role equals the owned channel role;
projectile channels require `activeProjectiles`, and non-projectile channels
require null. Capacity continues to come from the owned channel descriptor and
exact reservation grant rather than a second pool field.
Contact detector descriptors remain the sole source of overlap-watch identity.

No implementation may introduce a second source, fallback naming convention,
or factory-provided service key. Golden tests cover every row and reject key
collisions across graph, instance, scope, service kind, and slot.

## Assembly 1.1 asset contract `[ABI26-ASSET-001]`

Assembly 1.1 selects Manifest 1.2 modules and supplies strict asset bindings:

```ts
type AssemblyAssetBindingV11 = Readonly<{
  bindingId: string;
  roleId: string;
  category: string;
  artifact: Readonly<{
    assetId: string;
    sourceSha256: string;
    runtimeSha256: string;
    provenanceId: string;
    licenseRecordId: string;
    attributionRecordId?: string;
  }>;
  sharing: "instance" | "assembly";
  approvedSharingEvidenceId?: string;
  consumerInstanceIds: readonly string[];
}>;
```

Resolver rules:

- required roles resolve to exactly one compatible binding;
- optional roles resolve to zero or one, never an arbitrary one of many;
- category, sharing mode, consumer membership, hashes, provenance, license, and
  required attribution must match admitted asset evidence;
- an instance-local binding names exactly one consumer;
- an assembly-shared binding names multiple compatible consumers and requires an
  exact approved sharing evidence ID;
- the same admitted artifact may be shared only when its binding and manifest
  requirements allow assembly sharing.

Assembly data never supplies a Phaser texture key. The host derives exactly:

```text
module/<runtimeSha256>/<bindingId>
```

Both values are validated canonical fields, and the full 64-hex runtime hash is
used. Before modular preload, the host snapshots every existing TextureManager
key—including fixed-template player, background, UI, and framework keys—as the
reserved legacy/runtime namespace.

- A derived key absent from the snapshot may be loaded once.
- Any pre-existing key is rejected by default even when bytes match.
- Reuse is allowed only through an exact approved sharing record that binds the
  existing key, runtime hash, originating binding evidence, and all consumers.
- Same-key/different-hash is always rejected.
- Module code receives only the resolved host-derived key and cannot request or
  overwrite an arbitrary texture key.

Graph 1.2 preserves exact resolved bindings. Preload validates every required
runtime hash and host-derived texture key before graph initialization. Required preload
failure blocks graph creation. Optional absence yields `undefined` only through
`assets.optionalTexture(roleId)`; required access uses
`assets.requireTexture(roleId)` and cannot return missing data.

## Execution readiness `[ABI26-READY-001]`

An ordinary lifecycle module is ready only when all of these are true:

- Manifest 1.2, Assembly 1.1, and Graph 1.2 parse exactly;
- canonical descriptors and artifact identities match;
- the trusted loader supplied one valid `lifecycle-create-v1` handle;
- implementation ID, export name, bundle hash, and catalog evidence match;
- factory shape and runtime-contract descriptor agree;
- every required asset, dependency, capability, port, authority, lease, and
  exact resource grant resolves.

A contact-policy module requires one valid `contact-policy-transform-v1` handle
and must not have a lifecycle factory. Missing exports, both export kinds,
caller-supplied functions, fixture registrations, or any mismatch produce a
blocked readiness report and cannot enter the browser runtime catalog.

## Lifecycle, transition guard, and event transactions `[ABI26-LIFE-001]`

### Public states

```text
created -> initialized -> running <-> stopped -> disposed -> destroyed
```

`failed` is diagnostic context, not a stable terminal state. A terminal runtime
failure automatically attempts cleanup and ends in public state `destroyed`.
Snapshot also reports:

```ts
type CleanupDisposition = "clean" | "quarantined";
```

`destroyed/quarantined` is terminal and fails verification; it does not claim
zero resource residue.

### Top-level transition guard

Initialize, start, update, stop, dispose, destroy, and external event injection
are top-level graph operations. Exactly one `GraphTransitionGuard` may exist.

- A second frame, lifecycle operation, external event injection, or observation
  while the guard exists fails before side effects.
- Participant hooks, timer callbacks, state handlers, event handlers, policy
  transforms, and contact delivery cannot start a lifecycle operation.
- The guard owns one immutable transition token and remains held until all
  synchronous nested delivery and cleanup for that operation completes.
- Sequential operations after guard release are allowed; concurrent or reentrant
  top-level operations are not.

### Nested event transaction token

Synchronous event delivery does not reacquire the top-level guard. The first
event under an existing guarded operation creates an `EventTransactionToken`.
An event handler may emit a permitted downstream event only by inheriting that
same token.

```ts
type EventTransactionToken = Readonly<{
  graphTransitionId: number;
  eventTransactionId: number;
  depth: number;
}>;
```

- Nested delivery increments depth, uses the same transaction ID, and does not
  create a second frame/lifecycle transaction.
- `MAX_EVENT_TRANSACTION_DEPTH = 32`. Depth 33 fails before invoking the next
  handler and terminally fails the guarded operation.
- Resolver proof that the synchronous event subgraph is acyclic remains
  mandatory; the depth limit is an independent runtime defense.
- Event ordering is depth-first in binding order, matching synchronous emit
  semantics. A nested chain completes before the emitting handler resumes.
- A contact prepare/commit may attach to the current event token. While one
  candidate commit is in `committing` or delivery, reentrant/nested commit for
  that candidate is rejected. Independent candidates may commit sequentially
  after the preceding commit finishes, never concurrently.
- Event tokens cannot authorize lifecycle transitions, observation, state-replay
  side effects, or a new top-level graph operation.

### Terminal failure

Update/timer/event infrastructure throw or thenable follows one path:

Host-owned terminal cleanup is a continuation of the current guard/token, not a
second public transition, so the reentrancy rule cannot prevent required cleanup.

1. preserve the original failure as primary;
2. block future frames and events;
3. mark the internal transition as terminal cleanup;
4. reverse-stop every attempted started participant;
5. revoke all start services and leases;
6. reverse-dispose every created participant;
7. revoke instance services and leases;
8. destroy graph infrastructure and revoke graph leases;
9. publish immutable cleanup/quarantine evidence;
10. set public state to `destroyed`;
11. throw one aggregate with cleanup failures appended in execution order.

Cleanup failure does not leave the lifecycle in a resumable intermediate state.
After `destroyed`, public `dispose()` and `destroy()` are idempotent no-ops that
return the existing cleanup report. Initialize/start/update/stop remain invalid.

### Normal terminal cleanup

`dispose()` from running performs the ordinary block-and-reverse-stop sequence
before reverse disposal. The template owner can therefore call dispose/destroy
without inspecting coordinator internals. Pause remains explicit stop/start;
game restart always creates a fresh graph.

## Deterministic frame and time contract `[ABI26-TIME-001]`

The modular graph owns `DeterministicModuleClock`; modular factories do not use
Phaser scene time directly.

Constants:

```text
MAX_GRAPH_DELTA_MS = 250
MIN_GRAPH_DELTA_MS = 0
```

Frame rules:

- raw delta must be finite and within `[0, 250]` milliseconds;
- an over-limit/invalid delta is rejected before clock advancement, timer
  dispatch, event delivery, or participant update;
- rejected delta does not terminally fail the graph, does not catch up later,
  and increments bounded `rejectedFrameCount` observation;
- delta zero is one valid frame: frame sequence increments and participants run
  once with zero, while simulation time does not advance;
- pause time is excluded. Resume resets the scene-to-module frame baseline, so
  the first resumed delta contains only post-resume time;
- `clock.nowMs()`, timer due time, frame sequence, and update delta come from the
  same simulation clock evidence;
- no silent clamp, hidden substep, or independent animation loop is allowed.

Accepted frame order is fixed:

1. acquire the top-level transition guard;
2. validate delta and increment frame sequence;
3. advance simulation clock;
4. run due timer callbacks by due time, construction order, then timer slot;
5. invoke participant updates once in provider-first construction order;
6. release the guard after nested event delivery completes.

A zero-delay timer is eligible only at the next accepted frame. Kernel adapters
may not invoke a modular timer callback synchronously during registration.

## Update contract `[ABI26-UPD-001]`

```ts
type GameModuleLifecycleParticipantV12 = Readonly<{
  instanceId: string;
  initialize?: () => unknown;
  start?: () => unknown;
  update?: (deltaMs: number) => unknown;
  stop?: () => unknown;
  dispose?: () => unknown;
}>;
```

- Hook presence must match the Manifest 1.2 update descriptor exactly.
- Update is synchronous, running-only, and provider-first.
- The host owns the declared update start lease; factories cannot acquire it.
- Stop blocks update entry before reverse cleanup.
- Resume follows the retained-state/start barrier below, then enables events and
  future frames.
- Throw, Promise, or thenable invokes the terminal failure path above.

## Retained-state replay and the start barrier `[ABI26-STATE-001]`

Initialize may publish retained state but cannot deliver it. Initial start and
resume use this exact sequence:

1. acquire the top-level transition guard;
2. activate declared port subscriptions and update leases;
3. replay initialize/previous-running retained state in provider/port order;
4. invoke module `start` hooks provider-first;
5. after every start succeeds, mark the graph running and enable events/future
   frames;
6. release the guard.

Start hooks cannot publish state or events. State may be published only during
initialize and running/update. Therefore each retained port is delivered exactly
once during initial/resume replay, and every consumer receives the current value
before its own start hook. There is no post-start duplicate delivery or dirty
state queue.

Replay handlers execute in a `state-handler-restricted` subphase. They may update
only factory-private memory and use read-only
config/identity/asset/viewport/actor/channel services. The host rejects
state/event publication, timer/input/overlap registration, entity or actor
mutation, contact policy/commit, lifecycle transition, and observation.

Input and overlap registrations created by start hooks remain host-dormant until
the start barrier opens. External adapter callbacks before running are ignored
and counted as pre-running adapter observations; they never invoke factory code.
Timers scheduled during start use simulation time and cannot become due until a
later accepted running frame.

If replay or start fails, no event/frame becomes visible; the graph follows the
terminal failure cleanup path.

## Lifecycle service-permission matrix `[ABI26-PHASE-001]`

`R` means read-only, `A` means allowed, `C` means cleanup-only, and `-` means the
host rejects the call before side effects.

| Service                               | initialize | state replay | start | running/update | stop | dispose |
| ------------------------------------- | ---------- | ------------ | ----- | -------------- | ---- | ------- |
| config/identity/assets/viewport reads | R          | R            | R     | R              | R    | R       |
| owner actor/channel reads             | R          | R            | R     | R              | R    | R       |
| publish state                         | A          | -            | -     | A              | -    | -       |
| publish event                         | -          | -            | -     | A              | -    | -       |
| create pool/channel/state cache       | A          | -            | -     | -              | -    | C       |
| register observation reader           | A          | -            | -     | -              | -    | C       |
| register input/overlap                | -          | -            | A     | -              | C    | C       |
| schedule/cancel modular timer         | -          | -            | A     | A              | C    | C       |
| activate entity/projectile            | -          | -            | -     | A              | -    | C       |
| recycle owned entity                  | -          | -            | -     | A              | C    | C       |
| write owner actor motion              | -          | -            | -     | A              | C    | -       |
| execute contact policy                | -          | -            | -     | A              | -    | -       |
| commit contact result                 | -          | -            | -     | A              | -    | -       |
| raw lease/entity/kernel access        | -          | -            | -     | -              | -    | -       |

State-replay handlers use the restricted subphase above. Host-driven cleanup
remains permitted even when a module cleanup hook fails.

## Unified lease and side-effect ownership `[ABI26-LEASE-001]`

Only runtime infrastructure acquires/releases raw ledger leases. Port
subscriptions, update hooks, timers, input listeners, overlap watches,
observation readers, pools, channels, state caches, router, root directory, and
budget ledger all appear in the same owner/key ledger.

Every side-effecting service is one atomic protocol:

1. validate phase, resolved authority, descriptor, and capacity;
2. reserve exact resource/slot capacity;
3. acquire the derived scoped lease;
4. create the adapter side effect;
5. validate the returned disposer/handle;
6. publish the registration to the scope.

Failure reverses completed steps in reverse order. No published registration
may have a missing token, lease, or valid disposer.

## Timer slots and exact grants `[ABI26-TIMER-001]`

Factories call:

```ts
type TimerScheduleV12 =
  | Readonly<{
      mode: "once";
      delayMs: number;
      callback: () => unknown;
    }>
  | Readonly<{
      mode: "finite-repeat";
      initialDelayMs: number;
      intervalMs: number;
      totalFireCount: number;
      callback: () => unknown;
    }>
  | Readonly<{
      mode: "interval";
      initialDelayMs: number;
      intervalMs: number;
      callback: () => unknown;
    }>;

clock.schedule(schedule: TimerScheduleV12): TimerHandle
```

They do not supply a lease key or slot ID.

- `manifest.resources.timers` is the only reviewed manifest timer ceiling.
- `reservationGrant.timers` is the exact simultaneously live slot count for the
  instance and must not exceed `manifest.resources.timers`.
- The runtime contract declares only the semantic slot-group ID. The host
  pre-generates exactly `reservationGrant.timers` stable slot keys using indexes
  `0..grant-1`; grant zero generates no slot.
- Scheduling allocates the lowest free admitted slot.
- A live timer owns one resource token, one slot, and one start lease.
- `finite-repeat.totalFireCount` includes the first fire and is bounded
  `1..10_000`; no separate `repeat` or `loop` flag exists.
- Repeating/interval `intervalMs` must be finite and strictly positive.
  `initialDelayMs` may be zero; once delay must be finite and non-negative.
- A timer fires at most once per accepted graph frame. Missed intervals are not
  replayed; after a fire, next due time is `currentSimulationTime + intervalMs`.
- Repeating/interval timers hold their slot/token/lease until their final fire,
  cancellation, stop, or terminal cleanup.
- One-shot timers release them after callback delivery completes.
- Explicit cancellation, callback completion, stop, failed start, and terminal
  cleanup are idempotent.
- Zero grant rejects the first timer; grant N accepts exactly N concurrent live
  timers and rejects N+1 before clock mutation.
- Registration enters an internal `registering` state before adapter creation.
  The modular clock never invokes callbacks during registration; adapters that
  attempt it are rejected and rolled back.
- A one-shot remains live and owns its slot throughout its callback. A timer
  scheduled by that callback therefore requires a different free slot. The old
  slot becomes reusable only after callback completion accounting.
- The frame captures due timers in stable order. Cancellation before a timer's
  ordered turn removes it from that frame; cancellation from inside its own
  callback cannot undo the current fire and only suppresses future fires.
- Callback throw/thenable follows terminal graph failure. Completion/cancellation
  races are resolved by the single transition guard and idempotent timer state;
  exactly one release path wins.
- Zero-delay infinite repetition is unrepresentable because interval mode
  requires positive `intervalMs` and any timer fires at most once per frame.

## Entity custody and quarantine `[ABI26-ENTITY-001]`

Gameplay factories use owned-pool/channel and authorized reader/commit services.
They cannot call raw entity-directory activate/recycle/mutate.

Entity custody states are:

```text
inactive -> activating -> active -> recycling -> inactive
                         \-> quarantined
activating ----------------> quarantined
```

Physical and logical changes are coordinated by the host. If rollback cannot
prove both sides inactive, the entry becomes `quarantined`.

- A quarantined entry retains the most conservative active entity/projectile,
  pool slot, and related resource tokens.
- It cannot be read as active gameplay state, reused, transferred, or returned
  to the free pool.
- Cleanup retries are idempotent and record each physical/logical result.
- Double recycle is rejected using custody state and generation.
- Graph destroy performs a bounded retry but does not release unproven tokens.
- Remaining entries transfer to `RuntimeKernelSessionQuarantineLedger`, owned by
  the runtime-kernel session above scenes and module graphs.
- Session creation allocates quarantine capacity equal to its admitted global
  `activeEntities` ceiling. Graph readiness requires its aggregate active-entity
  grant not to exceed that immutable session capacity.
- Before every entity activation, the host reserves one unused session
  quarantine-capacity slot in the same atomic protocol as entity/projectile and
  pool tokens. Activation cannot begin without that reservation.
- A proven normal recycle releases the quarantine-capacity reservation. A
  transition to quarantine transfers the already-held reservation into the
  session ledger; it never needs a new slot during failure cleanup.
- Activation rollback that proves no physical/logical entity became active
  releases the reservation. An indeterminate rollback retains and transfers it.
- The ledger hard bound is therefore the admitted session `activeEntities`
  ceiling, not a second arbitrary quarantine constant. One reservation per
  potentially active entity proves that every failure can be recorded.
- Quarantined tokens continue to count against session/global resource budgets.
- While the session ledger is non-empty, the same session cannot instantiate a
  new modular graph; ordinary game restart cannot bypass quarantine.
- Scene teardown asks the session owner to perform one final bounded cleanup
  pass. Application/runtime-kernel session destruction owns that pass even when
  the originating scene or graph no longer exists.
- After the final pass, the session writes one immutable quarantine report with
  entry identities, generations, retained tokens, attempt outcomes, and final
  `clean | unresolved` disposition.
- There is no silent permanent abandonment. Exhausted retries leave entries and
  tokens unresolved in the terminal report. Only destruction of the entire
  runtime-kernel session ends retry ownership, never by declaring them free.
- Browser verification reads the session report; non-empty/unresolved evidence
  fails play verification. Packaging requires a clean report and refuses absent
  evidence.
- Lifecycle may be `destroyed`, but cleanup disposition is `quarantined`; such a
  run cannot pass verification or packaging.

Zero-residue success requires an empty session quarantine ledger and a clean
immutable report.

## Namespaced observation `[ABI26-OBS-001]`

Legacy scene observation and modular observation use separate registries. Module
snapshot shape is exact:

```ts
type ModularObservationSnapshot = Readonly<{
  revision: number;
  frameSequence: number;
  simulationTimeMs: number;
  modules: Readonly<Record<string, Readonly<Record<string, JsonValue>>>>;
}>;
```

The first key is resolved instance ID; the second is manifest-declared reader
ID. Host code derives instance namespace, and factories cannot impersonate it.

Hard limits are:

```text
MAX_OBSERVATION_READERS_PER_INSTANCE = 8
MAX_OBSERVATION_VALUE_DEPTH = 8
MAX_OBSERVATION_ENTRIES_PER_READER = 128
MAX_OBSERVATION_ENTRIES_PER_SNAPSHOT = 2048
MAX_OBSERVATION_CANONICAL_BYTES = 262144
MAX_OBSERVATION_STRING_CODE_UNITS = 4096
```

Every object property and array element counts as one entry. Canonical byte size
is measured after the complete snapshot is encoded with the project's canonical
JSON rules.

Snapshot rules:

- readers run by graph construction order, then lexical reader ID;
- readers are synchronous and non-reentrant. They receive no service, mutable
  runtime handle, engine object, or credential source;
- observation is unavailable while the top-level transition guard is held;
- any throw, thenable, cycle, engine object, function, depth overflow, entry
  overflow, or invalid JSON value fails the entire snapshot;
- no partial snapshot or revision is published;
- revision increments only after every reader succeeds and the complete snapshot
  is validated/frozen;
- invalid adapter disposer fails registration and rolls back its instance lease;
- disposal removes exactly the matching instance/reader registration.

JavaScript cannot mechanically prove that a reader never mutates its private
closure. Runtime enforcement covers phase, reentrancy, unavailable authorities,
and returned value only. Logical purity of private reader code is established by
the reviewed artifact, static checks, and tests; the ADR does not call closure
purity a runtime guarantee.

Observation cannot reliably classify secrets embedded in arbitrary strings.
The enforceable safety rule is that factory context supplies no environment,
filesystem, credential, cookie, token, or network source. Tests use synthetic
non-secret values only.

## Final contact-resolution transaction `[ABI26-CONTACT-001]`

### Batch 1 restriction

Batch 1 runtime profiles admit only `damage/consume`. `transfer` and general
retain-based policies remain data-design concepts but receive no runtime commit
capability until a separate custody protocol is accepted and implemented.

### Bounded ledgers

Each resolver instance owns:

- a fixed in-flight commit-slot array sized by
  `maximumConcurrentCommits` and charged to its instance contract;
- the existing bounded source-channel/entity-generation/target duplicate ledger;
- monotonic commit and evidence sequences;
- one instance lease for commit infrastructure.

Slots exist for the instance lifetime and are reused only after terminal
delivery. Clean slots release on dispose; quarantined slots transfer with their
retained evidence to the session quarantine ledger. Duplicate entries remain
until the source generation is confirmed inactive, then prune deterministically.
Ceiling is checked before reservation.

Commit-slot states are closed:

```text
free -> preparing -> prepared -> committing -> committed -> free
                         \-> aborted -> free
                                      \-> quarantined
```

### Prepare and commit

`prepare(candidate, decision)` is running-only, requires the current
`EventTransactionToken`, and performs no mutation:

1. validate candidate identity, selected profile, decision trace, source
   channel/entity/generation, target owner, damage route, and allowed operation;
2. verify the source generation is active;
3. reject a second prepare for the same candidate in that event transaction and
   reject existing `committing` or completed duplicate identity;
4. reserve one fixed commit slot;
5. install a provisional duplicate marker owned by the event token;
6. construct and validate the evidence template and exact delivery plan without
   assigning final evidence sequence IDs;
7. return a host-minted, candidate-bound, token-bound, single-use
   `PreparedContactCommit`.

`MAX_PREPARES_PER_EVENT_TRANSACTION = 64`; attempt 65 fails before slot
reservation and terminally fails the event transaction. Slot capacity may be
lower and remains an independent exact check.

The capability must commit inside the same synchronous event transaction that
created it. It also expires on stop, dispose, source-generation change, or
profile change. It cannot be serialized, transferred between instances/tokens,
or called twice.

### Event-transaction finalizer

Before an event token completes—whether handlers return or throw—the host
finalizes every prepared capability created under it. Each still-uncommitted
capability is aborted in creation order:

1. move the slot `prepared -> aborted`;
2. remove only that token's provisional duplicate marker;
3. discard the prepared evidence template and delivery plan;
4. invalidate the capability;
5. return the slot to `free`;
6. increment the bounded/saturating `abortedPrepareCount` observation.

Abort invokes no factory/adapter code and is defined as non-failing. Final
evidence IDs are allocated only by commit, so an abandoned prepare creates no
sequence hole or tombstone. A later transaction may prepare the candidate again
only if its source generation remains active and no durable duplicate exists.

`commit(prepared)` runs under the existing top-level guard and the exact event
transaction token bound by prepare:

1. revalidate capability, graph phase, source generation, and slot ownership;
2. allocate monotonic commit/evidence sequences, construct complete hit/damage
   evidence from the prepared template, and validate/freeze it before mutation;
3. replace the provisional marker with the durable duplicate identity and mark
   the slot `committing` before any callback or mutation;
4. apply the one authorized source operation exactly once;
5. move the already-validated slot to `committed` using no user callback,
   schema validation, dynamic route lookup, or evidence allocation;
6. deliver immutable events in fixed order: `hit`, then `damage` for Batch 1;
7. attempt every planned delivery even if an earlier handler throws;
8. aggregate delivery failures in order, mark the graph terminally failed after
   planned delivery attempts, and retain committed evidence;
9. release the in-flight slot after delivery accounting; source inactivity is
   the durable duplicate defense for `consume`.

### Source-operation failure

The source operation is successful only when both physical and logical custody
changes are proven complete. If either side fails or the host cannot prove their
joint result:

1. the slot moves from `committing` to `quarantined`, never `committed`;
2. the duplicate identity remains reserved through graph cleanup and session
   quarantine reporting;
3. the prepared hit/damage values remain immutable but are marked
   `source-operation-indeterminate` and are not gameplay result events;
4. no `hit`, `damage`, or resource event is delivered;
5. the entity enters custody quarantine and retains conservative pool/entity/
   projectile/resource tokens;
6. the commit capability is consumed and cannot be retried by factory code;
7. an immutable failure record links contact, slot, entity generation, physical
   result, logical result, retained tokens, and primary error;
8. the graph immediately follows the unified terminal failure path;
9. ownership of the quarantined slot/evidence/entity transfers to the
   runtime-kernel session ledger during graph destruction.

Only a source operation whose physical and logical completion is proven may
enter `committed` and deliver gameplay events. Cleanup retries address custody;
they never retroactively deliver a quarantined contact result.

The modeled runtime treats the in-memory slot transition after mutation as
non-failing because all capacity, evidence, and routes are preallocated and no
external/user code runs there. Catastrophic process failure or out-of-memory is
outside recoverable runtime semantics; immutable external verification must not
claim a completed run without the committed evidence artifact.

Policy failure exposes no prepared capability and causes no source mutation or
result event.

## Batch 1 shared contract closure `[ABI26-BATCH1-001]`

Before gameplay manifests are frozen, the shared contracts must also define:

- `intent.movement-arbiter` provides the exact owner-scoped resolved-movement
  capability required by locomotion;
- `delivery.projectile` provides an owned entity-channel capability with an
  exact projectile role and capacity descriptor;
- contact resolution declares its required mutation-channel state input,
  authorization, and final-resolution descriptor;
- contact/damage evidence carries one globally unambiguous contact identity so
  multiple producers cannot collide;
- touch non-captured movement, trigger resume cadence, fixed-forward ownership,
  and default-policy successor/profile IDs have one canonical meaning.

These are versioned data contracts, not factory conventions.

## Browser boundary `[ABI26-BROWSER-001]`

Node-side only:

- artifact hashing, content-addressed loading, handle minting, and registration;
- Assembly 1.1 resolution and readiness diagnostic reports;
- graph planning and compatibility matrices;
- build-time browser catalog generation;
- validators/evaluators not required for runtime payload checks.

Browser-safe runtime only:

- frozen catalog entries and evidence ID;
- Graph 1.2 ready data;
- strict runtime payload validators;
- lifecycle/frame coordinator and deterministic module clock;
- scoped services, bounded ledgers, quarantine records, and Phaser adapters.

Browser-boundary tests reject Node builtins, registry/hash/loader imports,
arbitrary paths, runtime registration, dynamic executable assembly data, and
catalog mutation.

## Required traceability matrix `[ABI26-TRACE-001]`

Implementation maintains a reviewed matrix with one row per normative rule:

```text
ADR rule ID
  -> public type/schema
  -> implementation owner
  -> positive test
  -> rejection/boundary test
  -> browser/build evidence when applicable
```

The `ABI26-*` heading ID is the stable rule group. Before the first code change,
the traceability owner assigns stable child IDs to each normative MUST/boundary
inside that group; child IDs are append-only and never renumbered. Tests and code
comments cite IDs, never line numbers.

No gate may be called complete merely because the existing suite is green.
Every MUST in this ADR needs an implementation and at least one direct test;
every fail-closed boundary needs a rejection test.

## Document ownership `[ABI26-GOV-001]`

This ADR currently keeps decision rationale and detailed protocol together
so review can detect cross-section contradictions. Before runtime implementation
begins, maintainers may extract detailed types, constants, state machines, and
test vectors to `docs/BATCH_1_RUNTIME_ABI_SPEC.md` without changing semantics.

The implemented companion is version `1.0.0`, SHA-256
`c608ace2143fc0520e5ed97dbec89628514d33cc292fe25bec5ddfc7b41dbb56`.

Extraction rules:

- this ADR retains the decision, version/safety boundaries, rejected alternatives,
  and every stable `ABI26-*` group ID;
- the specification uses child IDs such as `ABI26-TIMER-001.1` and links back to
  the owning ADR group;
- the ADR records the exact specification version/hash accepted for implementation;
- line numbers are never normative references;
- a semantic change to either document requires a new/revised ADR decision, not
  an unreviewed specification edit.

Document splitting is maintenance work, not an implementation gate unless the
approved decision explicitly makes it one. Missing stable IDs or a broken
ADR/spec hash link is always a governance failure.

## Implementation sequence after approval `[ABI26-IMPL-001]`

1. Add red version/readiness tests; implement Manifest 1.2, Assembly 1.1, Graph
   1.2, combined dependency/capability DAG, asset bindings, trusted loader
   handle, generated catalog, and readiness evidence.
2. Add red transition/time/event tests; implement the top-level guard, inherited
   event transaction tokens/depth, deterministic module clock, delta policy,
   update order, retained-state start barrier, terminal cleanup, idempotent
   terminal calls, and running scene shutdown.
3. Add red phase-permission/lease/timer tests; implement host phase enforcement,
   unified owner/key accounting, host timer slots, and exact grants.
4. Add red observation/entity-failure tests; implement multi-reader aggregation,
   bounded JSON validation, custody state machine, quarantine ledger, and cleanup
   evidence.
5. Add red contact prepare/commit tests and close the remaining Batch 1 shared
   capabilities/payload identities.
6. Run formatting, both strict TypeScript projects, full unit/integration suite,
   root and isolated builds, browser runtime-boundary checks, and preserved
   desktop/mobile fixed-template regression.
7. Freeze the eleven Manifest 1.2 contracts only after all remediation evidence
   passes. Gameplay factories begin in a later milestone.

Shared public types and golden fixtures are sequential boundaries. Parallel work
may begin only after the preceding boundary is frozen.

## Exit criteria `[ABI26-GATE-001]`

1. Legacy versions retain exact bytes/semantics; 1.2/1.1/1.2 golden records pass.
2. Trusted loading rejects arbitrary functions, forbidden closure imports,
   top-level side effects, byte drift, export drift, catalog drift, and
   readiness/instantiation TOCTOU.
3. Owner/assembly dependencies, optional ambiguity, asset roles, host-derived
   texture namespace/sharing, and the combined DAG resolve and reject exactly.
4. Graph 1.2 cannot be ready without every exact executable and resolved
   prerequisite.
5. Valid/rejected delta, clock source, zero frame, pause/resume, timer order, and
   provider-first update pass.
6. Top-level transition reentrancy fails before side effects; inherited nested
   event delivery remains synchronous, ordered, acyclic, and depth-bounded.
7. Initialize/resume replay uses the restricted handler subphase; start hooks
   cannot publish state/event, and no consumer side effect occurs before the
   start barrier opens.
8. Update failure always ends destroyed with ordered primary/cleanup evidence.
9. Running shutdown reaches destroyed; clean cases have zero start/instance/graph
   leases and no quarantine.
10. Every lifecycle phase enforces the service-permission matrix.
11. `resources.timers` is the sole manifest ceiling; exact-grant slot generation,
    mode/count/interval semantics, zero/exact/one-over, slot reuse, callback
    scheduling, cancellation ordering, completion, stop, and resume pass.
12. Observation reader/value/snapshot hard limits pass at exact and one-over;
    multiple readers coexist in stable order and revision commits atomically.
13. Every activation pre-reserves session quarantine capacity; clean recycle
    releases it and indeterminate failure transfers it without allocating during
    cleanup.
14. Physical/logical adapter failures enter session quarantine without returning
    tokens; new graph creation, verification, and packaging reject unresolved
    quarantine.
15. Abandoned prepared capabilities are token-finalized without evidence-ID
    holes, duplicate residue, slot leaks, or cross-transaction reuse.
16. Contact prepare performs no mutation; successful commit is single-use,
    duplicate-safe, source-first, evidence-preserving, and fixed-order.
17. Indeterminate source operation emits no gameplay result, retains duplicate
    and resource custody, transfers to session quarantine, and terminally fails.
18. Every service lease identity is generated from the authoritative mapping;
    undeclared/fallback/colliding keys are rejected.
19. The four missing shared Batch 1 contracts and remaining semantic decisions
    have canonical schemas and rejection tests.
20. The browser closure remains Node-free and immutable.
21. Fixed-template desktop/mobile regression passes unchanged.
22. The traceability matrix has no missing implementation or test cell.
23. Recovery documents identify gameplay factories as next only after all prior
    evidence exists.

## Rejected alternatives

- Reinterpreting Graph 1.1 readiness is rejected as a semantic version break.
- Caller-supplied function plus matching hash is rejected as self-attestation.
- TypeScript branding without loader-owned minting is rejected as insufficient.
- Importing a reviewed bundle before closure/side-effect admission is rejected.
- Local factory frame loops or Phaser timers are rejected.
- Silent delta clamp/catch-up is rejected.
- Lifecycle transitions from inside update or synchronous delivery are rejected;
  inherited nested events under the current event token remain permitted.
- Any state/event publication during a start hook is rejected.
- A second timer ceiling in the runtime descriptor is rejected.
- Factory abandonment of prepared contact capacity without token finalization is
  rejected.
- Side effects during state replay are rejected.
- Factory-generated lease keys and timer slot IDs are rejected.
- Returning uncertain entity capacity after rollback failure is rejected.
- Allocating quarantine capacity only after a custody failure is rejected.
- Starting a new graph while session quarantine is non-empty is rejected.
- Assembly-selected or implicit legacy texture keys are rejected.
- One global modular observation reader is rejected.
- Mutation before evidence preparation is rejected.
- Stopping event delivery at the first post-commit handler error is rejected
  because it creates avoidable partial delivery.
- Runtime `transfer` before a custody protocol is rejected for Batch 1.
- Implementing gameplay factories before this gate closes is rejected.
- Replacing the fixed template during remediation is rejected.

## Relationship

This ADR refines ADR 0025 where the accepted intent and implementation were
not mechanically closed. It preserves ADRs 0022-0024, the data-only assembly
boundary, deterministic authority, fixed-path compatibility, and the separation
of Phase 8 model orchestration.
