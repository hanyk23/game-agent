/* Browser-safe mechanical runtime for accepted ADR 0026. */

export const MAX_EVENT_TRANSACTION_DEPTH = 32;
export const MAX_PREPARES_PER_EVENT_TRANSACTION = 64;
export const MAX_GRAPH_DELTA_MS = 250;
export const MAX_OBSERVATION_READERS_PER_INSTANCE = 8;
export const MAX_OBSERVATION_VALUE_DEPTH = 8;
export const MAX_OBSERVATION_ENTRIES_PER_READER = 128;
export const MAX_OBSERVATION_ENTRIES_PER_SNAPSHOT = 2048;
export const MAX_OBSERVATION_CANONICAL_BYTES = 262_144;
export const MAX_OBSERVATION_STRING_CODE_UNITS = 4_096;

function isThenable(value: unknown): boolean {
  return (
    value !== null &&
    (typeof value === "object" || typeof value === "function") &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

function invokeSync(label: string, callback: () => unknown): void {
  const result = callback();
  if (isThenable(result)) throw new Error(`${label} returned a thenable`);
}

export type GraphTransitionKind =
  | "initialize"
  | "start"
  | "frame"
  | "stop"
  | "dispose"
  | "destroy"
  | "external-event";

export type EventTransactionToken = Readonly<{
  graphTransitionId: number;
  eventTransactionId: number;
  depth: number;
}>;

/** ABI26-LIFE-001.1/.2: one top-level guard, inherited synchronous event token. */
export class GraphTransitionGuard {
  #transitionId = 0;
  #eventId = 0;
  #active: Readonly<{ id: number; kind: GraphTransitionKind }> | undefined;
  #event:
    | Readonly<{ graphTransitionId: number; eventTransactionId: number }>
    | undefined;
  #depth = 0;
  #finalizers: Array<() => void> = [];

  get held(): boolean {
    return this.#active !== undefined;
  }
  get currentTransition():
    Readonly<{ id: number; kind: GraphTransitionKind }> | undefined {
    return this.#active;
  }
  get currentEventToken(): EventTransactionToken | undefined {
    return this.#event === undefined
      ? undefined
      : Object.freeze({ ...this.#event, depth: this.#depth });
  }

  run<T>(kind: GraphTransitionKind, operation: () => T): T {
    if (this.#active !== undefined) {
      throw new Error(
        `${kind} reentered active ${this.#active.kind} transition`,
      );
    }
    this.#active = Object.freeze({ id: ++this.#transitionId, kind });
    try {
      return operation();
    } finally {
      try {
        this.#finishEvent();
      } finally {
        this.#active = undefined;
      }
    }
  }

  deliver<T>(operation: (token: EventTransactionToken) => T): T {
    if (this.#active === undefined)
      throw new Error("event delivery requires the graph transition guard");
    const root = this.#event === undefined;
    if (root) {
      this.#event = Object.freeze({
        graphTransitionId: this.#active.id,
        eventTransactionId: ++this.#eventId,
      });
    }
    if (this.#depth >= MAX_EVENT_TRANSACTION_DEPTH)
      throw new Error("event transaction depth exceeds 32");
    this.#depth += 1;
    try {
      return operation(this.currentEventToken!);
    } finally {
      this.#depth -= 1;
      if (root) this.#finishEvent();
    }
  }

  addEventFinalizer(finalizer: () => void): void {
    if (this.#event === undefined)
      throw new Error("event finalizer requires an event transaction");
    this.#finalizers.push(finalizer);
  }

  #finishEvent(): void {
    if (this.#event === undefined) return;
    const failures: unknown[] = [];
    for (const finalizer of this.#finalizers.splice(0)) {
      try {
        finalizer();
      } catch (error) {
        failures.push(error);
      }
    }
    this.#event = undefined;
    this.#depth = 0;
    if (failures.length > 0)
      throw new AggregateError(
        failures,
        "event transaction finalization failed",
      );
  }
}

export type RuntimeServicePhase =
  "initialize" | "state-replay" | "start" | "running" | "stop" | "dispose";
export type RuntimeServiceOperation =
  | "read"
  | "publish-state"
  | "publish-event"
  | "create-runtime-state"
  | "register-observation"
  | "register-input"
  | "timer"
  | "activate-entity"
  | "recycle-entity"
  | "write-actor-motion"
  | "contact-policy"
  | "contact-commit";

const allowedOperations: Readonly<
  Record<RuntimeServicePhase, readonly RuntimeServiceOperation[]>
> = Object.freeze({
  initialize: [
    "read",
    "publish-state",
    "create-runtime-state",
    "register-observation",
  ],
  "state-replay": ["read"],
  start: ["read", "register-input", "timer"],
  running: [
    "read",
    "publish-state",
    "publish-event",
    "timer",
    "activate-entity",
    "recycle-entity",
    "write-actor-motion",
    "contact-policy",
    "contact-commit",
  ],
  stop: ["read"],
  dispose: ["read"],
});

export function assertRuntimeServicePermission(
  phase: RuntimeServicePhase,
  operation: RuntimeServiceOperation,
): void {
  if (!allowedOperations[phase].includes(operation)) {
    throw new Error(`${operation} is forbidden during ${phase}`);
  }
}

export type RuntimeLeaseScope = "start" | "instance" | "graph";
export class HostLeaseLedgerV12 {
  readonly #live = new Map<
    string,
    Readonly<{ instanceId: string; scope: RuntimeLeaseScope }>
  >();
  acquire(
    instanceId: string,
    scope: RuntimeLeaseScope,
    suffix: string,
  ): string {
    if (!/^[a-z0-9][a-z0-9./-]*$/.test(suffix))
      throw new Error("invalid host lease suffix");
    const key =
      scope === "graph"
        ? `graph/${instanceId}/${suffix}`
        : `module/${instanceId}/${scope}/${suffix}`;
    if (this.#live.has(key)) throw new Error(`duplicate lease: ${key}`);
    this.#live.set(key, Object.freeze({ instanceId, scope }));
    return key;
  }
  release(key: string): void {
    if (!this.#live.delete(key)) throw new Error(`unknown lease: ${key}`);
  }
  releaseScope(instanceId: string, scope: RuntimeLeaseScope): void {
    for (const [key, lease] of [...this.#live])
      if (lease.instanceId === instanceId && lease.scope === scope)
        this.#live.delete(key);
  }
  snapshot(): readonly string[] {
    return Object.freeze([...this.#live.keys()].sort());
  }
}

export function deriveRuntimeServiceLeaseSuffix(
  input: Readonly<{
    kind:
      | "update"
      | "timer"
      | "input"
      | "observation"
      | "contact-commit"
      | "port"
      | "state"
      | "overlap"
      | "pool"
      | "channel"
      | "channel-reader"
      | "channel-mutation";
    id: string;
    secondaryId?: string;
  }>,
): string {
  if (
    !/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(input.id) ||
    (input.secondaryId !== undefined &&
      !/^[a-z0-9][a-z0-9.-]*$/.test(input.secondaryId))
  ) {
    throw new Error("service identity must come from a canonical descriptor");
  }
  if (
    (input.kind === "timer" || input.kind === "port") !==
    (input.secondaryId !== undefined)
  ) {
    throw new Error(`${input.kind} secondary identity mismatch`);
  }
  return `${input.kind}/${input.id}${input.secondaryId === undefined ? "" : `/${input.secondaryId}`}`;
}

export type TimerScheduleV12 =
  | Readonly<{ mode: "once"; delayMs: number; callback: () => unknown }>
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
export type TimerHandleV12 = Readonly<{
  cancel(): void;
  readonly active: boolean;
}>;
type TimerRecord = {
  instanceId: string;
  slot: number;
  dueMs: number;
  mode: TimerScheduleV12["mode"];
  intervalMs: number;
  remaining: number;
  callback: () => unknown;
  active: boolean;
  bornFrame: number;
};

export class DeterministicModuleClockV12 {
  #timeMs = 0;
  #frame = 0;
  #rejected = 0;
  readonly #order: ReadonlyMap<string, number>;
  readonly #slots = new Map<string, Array<TimerRecord | undefined>>();
  constructor(
    constructionOrder: readonly string[],
    exactTimerGrants: Readonly<Record<string, number>>,
  ) {
    this.#order = new Map(constructionOrder.map((id, index) => [id, index]));
    for (const id of constructionOrder) {
      const grant = exactTimerGrants[id] ?? 0;
      if (!Number.isSafeInteger(grant) || grant < 0)
        throw new Error(`invalid timer grant for ${id}`);
      this.#slots.set(id, Array.from({ length: grant }));
    }
  }
  nowMs(): number {
    return this.#timeMs;
  }
  get frameSequence(): number {
    return this.#frame;
  }
  get rejectedFrameCount(): number {
    return this.#rejected;
  }
  validateDelta(deltaMs: number): boolean {
    const valid =
      Number.isFinite(deltaMs) && deltaMs >= 0 && deltaMs <= MAX_GRAPH_DELTA_MS;
    if (!valid)
      this.#rejected = Math.min(Number.MAX_SAFE_INTEGER, this.#rejected + 1);
    return valid;
  }
  schedule(instanceId: string, schedule: TimerScheduleV12): TimerHandleV12 {
    const slots = this.#slots.get(instanceId);
    if (slots === undefined)
      throw new Error(`unknown timer owner: ${instanceId}`);
    const slot = slots.findIndex((entry) => entry === undefined);
    if (slot < 0)
      throw new Error(`timer exact grant exhausted for ${instanceId}`);
    const initialDelay =
      schedule.mode === "once" ? schedule.delayMs : schedule.initialDelayMs;
    if (!Number.isFinite(initialDelay) || initialDelay < 0)
      throw new Error("timer delay must be finite and non-negative");
    if (
      schedule.mode !== "once" &&
      (!Number.isFinite(schedule.intervalMs) || schedule.intervalMs <= 0)
    ) {
      throw new Error("repeating timer interval must be finite and positive");
    }
    if (
      schedule.mode === "finite-repeat" &&
      (!Number.isSafeInteger(schedule.totalFireCount) ||
        schedule.totalFireCount < 1 ||
        schedule.totalFireCount > 10_000)
    ) {
      throw new Error("finite-repeat totalFireCount must be 1..10000");
    }
    const record: TimerRecord = {
      instanceId,
      slot,
      dueMs: this.#timeMs + initialDelay,
      mode: schedule.mode,
      intervalMs: schedule.mode === "once" ? 0 : schedule.intervalMs,
      remaining:
        schedule.mode === "finite-repeat"
          ? schedule.totalFireCount
          : Number.POSITIVE_INFINITY,
      callback: schedule.callback,
      active: true,
      bornFrame: this.#frame,
    };
    slots[slot] = record;
    return Object.freeze({
      cancel: () => this.#release(record),
      get active() {
        return record.active;
      },
    });
  }
  beginAcceptedFrame(deltaMs: number): void {
    this.#frame += 1;
    this.#timeMs += deltaMs;
  }
  dispatchDue(): void {
    const due = [...this.#slots.values()].flatMap((slots) =>
      slots.filter(
        (timer): timer is TimerRecord =>
          timer !== undefined &&
          timer.active &&
          timer.bornFrame < this.#frame &&
          timer.dueMs <= this.#timeMs,
      ),
    );
    due.sort(
      (a, b) =>
        a.dueMs - b.dueMs ||
        this.#order.get(a.instanceId)! - this.#order.get(b.instanceId)! ||
        a.slot - b.slot,
    );
    for (const timer of due) {
      if (!timer.active) continue;
      invokeSync(`timer ${timer.instanceId}/${timer.slot}`, timer.callback);
      if (!timer.active) continue;
      if (timer.mode === "once") this.#release(timer);
      else {
        timer.remaining -= 1;
        if (timer.remaining === 0) this.#release(timer);
        else timer.dueMs = this.#timeMs + timer.intervalMs;
      }
    }
  }
  cancelInstance(instanceId: string): void {
    for (const timer of this.#slots.get(instanceId) ?? [])
      if (timer !== undefined) this.#release(timer);
  }
  cancelAll(): void {
    for (const id of this.#slots.keys()) this.cancelInstance(id);
  }
  #release(timer: TimerRecord): void {
    if (!timer.active) return;
    timer.active = false;
    const slots = this.#slots.get(timer.instanceId)!;
    if (slots[timer.slot] === timer) slots[timer.slot] = undefined;
  }
}

export type GameModuleLifecycleParticipantV12 = Readonly<{
  instanceId: string;
  initialize?: () => unknown;
  start?: () => unknown;
  update?: (deltaMs: number) => unknown;
  stop?: () => unknown;
  dispose?: () => unknown;
}>;
export type RuntimeFactoryControlsV12 = Readonly<{
  assertService(operation: RuntimeServiceOperation): void;
  nowMs(): number;
  schedule(instanceId: string, schedule: TimerScheduleV12): TimerHandleV12;
  registerStateHandler(
    portKey: string,
    handler: (value: unknown, replay: boolean) => unknown,
  ): void;
  registerEventHandler(
    portKey: string,
    handler: (value: unknown) => unknown,
  ): void;
  publishState(portKey: string, value: unknown): void;
  emitEvent(portKey: string, value: unknown): void;
  injectExternalEvent(delivery: () => unknown): void;
}>;
export type RuntimePublicPhaseV12 =
  "created" | "initialized" | "running" | "stopped" | "disposed" | "destroyed";
export type CleanupDisposition = "clean" | "quarantined";
export type RuntimeCleanupReportV12 = Readonly<{
  disposition: CleanupDisposition;
  failures: readonly unknown[];
}>;

/** Host-only frame barrier; never exposed through factory controls or context. */
export type RuntimeHostFrameHooksV14 = Readonly<{
  beginFrame(frameSequence: number): void;
  frameTail(frameSequence: number): void;
  afterGuard(frameSequence: number): void;
}>;

export class DeterministicGameModuleRuntimeV12 {
  readonly guard: GraphTransitionGuard;
  readonly clock: DeterministicModuleClockV12;
  readonly #participants: readonly GameModuleLifecycleParticipantV12[];
  #phase: RuntimePublicPhaseV12 = "created";
  #servicePhase: RuntimeServicePhase | undefined;
  #started = 0;
  #initialized = 0;
  #blocked = false;
  #cleanup: RuntimeCleanupReportV12 | undefined;
  readonly #cleanupDisposition: (() => CleanupDisposition) | undefined;
  readonly #hostFrameHooks: RuntimeHostFrameHooksV14 | undefined;
  readonly #retained = new Map<string, unknown>();
  readonly #stateHandlers = new Map<
    string,
    readonly ((value: unknown, replay: boolean) => unknown)[]
  >();
  readonly #eventHandlers = new Map<
    string,
    readonly ((value: unknown) => unknown)[]
  >();
  constructor(
    input: Readonly<{
      readiness: Readonly<{ status: "ready" | "blocked" }>;
      constructionOrder: readonly string[];
      participants?: readonly GameModuleLifecycleParticipantV12[];
      createParticipants?: (
        controls: RuntimeFactoryControlsV12,
      ) => readonly GameModuleLifecycleParticipantV12[];
      updateInstanceIds: readonly string[];
      exactTimerGrants: Readonly<Record<string, number>>;
      cleanupDisposition?: () => CleanupDisposition;
      hostFrameHooks?: RuntimeHostFrameHooksV14;
      guard?: GraphTransitionGuard;
    }>,
  ) {
    if (input.readiness.status !== "ready")
      throw new Error("blocked Graph 1.2 cannot instantiate");
    this.guard = input.guard ?? new GraphTransitionGuard();
    this.clock = new DeterministicModuleClockV12(
      input.constructionOrder,
      input.exactTimerGrants,
    );
    this.#cleanupDisposition = input.cleanupDisposition;
    this.#hostFrameHooks = input.hostFrameHooks;
    if (
      (input.participants === undefined) ===
      (input.createParticipants === undefined)
    )
      throw new Error("provide exactly one participant source");
    const participants =
      input.participants ??
      input.createParticipants!(
        Object.freeze({
          assertService: (operation: RuntimeServiceOperation) =>
            this.assertService(operation),
          nowMs: () => {
            this.assertService("read");
            return this.clock.nowMs();
          },
          schedule: (instanceId: string, schedule: TimerScheduleV12) => {
            this.assertService("timer");
            return this.clock.schedule(instanceId, schedule);
          },
          registerStateHandler: (portKey, handler) =>
            this.registerStateHandler(portKey, handler),
          registerEventHandler: (portKey, handler) =>
            this.registerEventHandler(portKey, handler),
          publishState: (portKey, value) => this.publishState(portKey, value),
          emitEvent: (portKey, value) => this.emitPortEvent(portKey, value),
          injectExternalEvent: (delivery) => this.injectEvent(delivery),
        }),
      );
    const byId = new Map(
      participants.map((participant) => [participant.instanceId, participant]),
    );
    if (
      byId.size !== participants.length ||
      input.constructionOrder.some((id) => !byId.has(id)) ||
      byId.size !== input.constructionOrder.length
    ) {
      throw new Error("participant set does not match construction order");
    }
    const updates = new Set(input.updateInstanceIds);
    this.#participants = Object.freeze(
      input.constructionOrder.map((id) => {
        const participant = byId.get(id)!;
        if ((participant.update !== undefined) !== updates.has(id))
          throw new Error(`update descriptor mismatch for ${id}`);
        return participant;
      }),
    );
  }
  get phase(): RuntimePublicPhaseV12 {
    return this.#phase;
  }
  get servicePhase(): RuntimeServicePhase | undefined {
    return this.#servicePhase;
  }
  get cleanupReport(): RuntimeCleanupReportV12 | undefined {
    return this.#cleanup;
  }
  assertService(operation: RuntimeServiceOperation): void {
    if (this.#servicePhase === undefined)
      throw new Error(`${operation} used outside a module phase`);
    assertRuntimeServicePermission(this.#servicePhase, operation);
  }
  registerStateHandler(
    portKey: string,
    handler: (value: unknown, replay: boolean) => unknown,
  ): void {
    if (this.#phase !== "created")
      throw new Error("state handlers must be registered before initialize");
    this.#stateHandlers.set(
      portKey,
      Object.freeze([...(this.#stateHandlers.get(portKey) ?? []), handler]),
    );
  }
  registerEventHandler(
    portKey: string,
    handler: (value: unknown) => unknown,
  ): void {
    if (this.#phase !== "created")
      throw new Error("event handlers must be registered before initialize");
    this.#eventHandlers.set(
      portKey,
      Object.freeze([...(this.#eventHandlers.get(portKey) ?? []), handler]),
    );
  }
  publishState(portKey: string, value: unknown): void {
    this.assertService("publish-state");
    this.#retained.set(portKey, value);
    if (this.#servicePhase === "running")
      for (const handler of this.#stateHandlers.get(portKey) ?? [])
        invokeSync(`state handler ${portKey}`, () => handler(value, false));
  }
  emitPortEvent(portKey: string, value: unknown): void {
    this.emitNestedEvent(() => {
      for (const handler of this.#eventHandlers.get(portKey) ?? [])
        invokeSync(`event handler ${portKey}`, () => handler(value));
    });
  }
  schedule(instanceId: string, schedule: TimerScheduleV12): TimerHandleV12 {
    this.assertService("timer");
    return this.clock.schedule(instanceId, schedule);
  }
  initialize(): void {
    if (this.#phase !== "created")
      throw new Error(`initialize forbidden during ${this.#phase}`);
    this.#execute("initialize", () => {
      this.#servicePhase = "initialize";
      for (const participant of this.#participants) {
        invokeSync(`initialize ${participant.instanceId}`, () =>
          participant.initialize?.(),
        );
        this.#initialized += 1;
      }
      this.#servicePhase = undefined;
      this.#phase = "initialized";
    });
  }
  start(): void {
    if (this.#phase !== "initialized" && this.#phase !== "stopped")
      throw new Error(`start forbidden during ${this.#phase}`);
    this.#execute("start", () => {
      this.#servicePhase = "state-replay";
      for (const [key, value] of [...this.#retained].sort(([a], [b]) =>
        a.localeCompare(b),
      ))
        for (const handler of this.#stateHandlers.get(key) ?? [])
          invokeSync(`state replay ${key}`, () => handler(value, true));
      this.#servicePhase = "start";
      for (const participant of this.#participants) {
        invokeSync(`start ${participant.instanceId}`, () =>
          participant.start?.(),
        );
        this.#started += 1;
      }
      this.#servicePhase = undefined;
      this.#phase = "running";
    });
  }
  frame(deltaMs: number): void {
    if (this.#phase !== "running" || this.#blocked)
      throw new Error(`frame forbidden during ${this.#phase}`);
    if (!this.clock.validateDelta(deltaMs)) return;
    let acceptedFrameSequence: number | undefined;
    this.#execute("frame", () => {
      this.#servicePhase = "running";
      this.clock.beginAcceptedFrame(deltaMs);
      acceptedFrameSequence = this.clock.frameSequence;
      this.#hostFrameHooks?.beginFrame(acceptedFrameSequence);
      this.clock.dispatchDue();
      for (const participant of this.#participants)
        if (participant.update !== undefined)
          invokeSync(`update ${participant.instanceId}`, () =>
            participant.update!(deltaMs),
          );
      this.#servicePhase = undefined;
      this.#hostFrameHooks?.frameTail(acceptedFrameSequence);
    });
    if (acceptedFrameSequence !== undefined)
      try {
        this.#hostFrameHooks?.afterGuard(acceptedFrameSequence);
      } catch (primary) {
        this.#terminalFailure(primary);
      }
  }
  injectEvent(delivery: () => unknown): void {
    if (this.#phase !== "running" || this.#blocked)
      throw new Error("external events require running graph");
    this.#execute("external-event", () => {
      this.#servicePhase = "running";
      this.guard.deliver(() => invokeSync("event delivery", delivery));
      this.#servicePhase = undefined;
    });
  }
  emitNestedEvent(delivery: (token: EventTransactionToken) => unknown): void {
    this.assertService("publish-event");
    this.guard.deliver((token) =>
      invokeSync("nested event", () => delivery(token)),
    );
  }
  stop(): void {
    if (this.#phase !== "running")
      throw new Error(`stop forbidden during ${this.#phase}`);
    this.guard.run("stop", () => {
      const failures: unknown[] = [];
      this.#stop(failures);
      this.#phase = "stopped";
      if (failures.length) throw new AggregateError(failures, "stop failed");
    });
  }
  dispose(): RuntimeCleanupReportV12 {
    if (this.#phase === "destroyed") return this.#cleanup!;
    if (this.#phase === "disposed")
      return (
        this.#cleanup ??
        Object.freeze({ disposition: "clean", failures: Object.freeze([]) })
      );
    return this.guard.run("dispose", () => {
      const failures: unknown[] = [];
      if (this.#phase === "running") this.#stop(failures);
      this.#dispose(failures);
      this.#phase = "disposed";
      this.#cleanup = Object.freeze({
        disposition: this.#cleanupDisposition?.() ?? "clean",
        failures: Object.freeze(failures),
      });
      if (failures.length) throw new AggregateError(failures, "dispose failed");
      return this.#cleanup;
    });
  }
  destroy(): RuntimeCleanupReportV12 {
    if (this.#phase === "destroyed") return this.#cleanup!;
    if (this.#phase !== "disposed") this.dispose();
    return this.guard.run("destroy", () => {
      this.#phase = "destroyed";
      return (
        this.#cleanup ??
        Object.freeze({ disposition: "clean", failures: Object.freeze([]) })
      );
    });
  }
  #execute(kind: GraphTransitionKind, operation: () => void): void {
    try {
      this.guard.run(kind, operation);
    } catch (primary) {
      this.#terminalFailure(primary);
    }
  }
  #terminalFailure(primary: unknown): never {
    this.#blocked = true;
    const failures: unknown[] = [primary];
    this.#stop(failures);
    this.#dispose(failures);
    this.clock.cancelAll();
    this.#servicePhase = undefined;
    this.#phase = "destroyed";
    this.#cleanup = Object.freeze({
      disposition: this.#cleanupDisposition?.() ?? "clean",
      failures: Object.freeze(failures),
    });
    throw new AggregateError(failures, "module graph terminal failure");
  }
  #stop(failures: unknown[]): void {
    this.#servicePhase = "stop";
    this.clock.cancelAll();
    for (let index = this.#started - 1; index >= 0; index -= 1)
      try {
        invokeSync(`stop ${this.#participants[index]!.instanceId}`, () =>
          this.#participants[index]!.stop?.(),
        );
      } catch (error) {
        failures.push(error);
      }
    this.#started = 0;
    this.#servicePhase = undefined;
  }
  #dispose(failures: unknown[]): void {
    this.#servicePhase = "dispose";
    for (let index = this.#initialized - 1; index >= 0; index -= 1)
      try {
        invokeSync(`dispose ${this.#participants[index]!.instanceId}`, () =>
          this.#participants[index]!.dispose?.(),
        );
      } catch (error) {
        failures.push(error);
      }
    this.#initialized = 0;
    this.#servicePhase = undefined;
  }
}

function validateObservationValue(
  value: unknown,
  depth: number,
  state: { entries: number },
  maxEntries: number,
  seen: Set<object>,
): void {
  if (depth > MAX_OBSERVATION_VALUE_DEPTH)
    throw new Error("observation depth overflow");
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "string") {
    if (value.length > MAX_OBSERVATION_STRING_CODE_UNITS)
      throw new Error("observation string overflow");
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value))
      throw new Error("observation rejects non-finite number");
    return;
  }
  if (typeof value !== "object" || isThenable(value))
    throw new Error("observation must contain only JSON values");
  if (seen.has(value)) throw new Error("observation cycle");
  seen.add(value);
  const children = Array.isArray(value)
    ? value
    : Object.values(value as Record<string, unknown>);
  for (const child of children) {
    state.entries += 1;
    if (state.entries > maxEntries)
      throw new Error("observation entry overflow");
    validateObservationValue(child, depth + 1, state, maxEntries, seen);
  }
  seen.delete(value);
}

export class ModularObservationRegistryV12 {
  #revision = 0;
  readonly #readers = new Map<string, Map<string, () => unknown>>();
  register(
    instanceId: string,
    readerId: string,
    reader: () => unknown,
  ): () => void {
    const readers = this.#readers.get(instanceId) ?? new Map();
    if (
      readers.size >= MAX_OBSERVATION_READERS_PER_INSTANCE ||
      readers.has(readerId)
    )
      throw new Error("observation reader capacity/identity violation");
    readers.set(readerId, reader);
    this.#readers.set(instanceId, readers);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      readers.delete(readerId);
      if (readers.size === 0) this.#readers.delete(instanceId);
    };
  }
  snapshot(
    frameSequence: number,
    simulationTimeMs: number,
    guard: GraphTransitionGuard,
  ): Readonly<{
    revision: number;
    frameSequence: number;
    simulationTimeMs: number;
    modules: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  }> {
    if (guard.held)
      throw new Error(
        "observation is forbidden while transition guard is held",
      );
    let total = 0;
    const modules: Record<string, Record<string, unknown>> = {};
    for (const instanceId of [...this.#readers.keys()].sort()) {
      const output: Record<string, unknown> = {};
      for (const [readerId, reader] of [...this.#readers.get(instanceId)!].sort(
        ([a], [b]) => a.localeCompare(b),
      )) {
        const value = reader();
        if (isThenable(value))
          throw new Error("observation reader returned thenable");
        const state = { entries: 0 };
        validateObservationValue(
          value,
          0,
          state,
          MAX_OBSERVATION_ENTRIES_PER_READER,
          new Set(),
        );
        total += state.entries;
        if (total > MAX_OBSERVATION_ENTRIES_PER_SNAPSHOT)
          throw new Error("observation snapshot entry overflow");
        output[readerId] = value;
      }
      modules[instanceId] = Object.freeze(output);
    }
    const candidate = {
      revision: this.#revision + 1,
      frameSequence,
      simulationTimeMs,
      modules: Object.freeze(modules),
    };
    if (
      new TextEncoder().encode(JSON.stringify(candidate)).byteLength >
      MAX_OBSERVATION_CANONICAL_BYTES
    )
      throw new Error("observation snapshot byte overflow");
    this.#revision += 1;
    return Object.freeze(candidate);
  }
}

export type QuarantineEntryV12 = Readonly<{
  identity: string;
  generation: number;
  retainedTokens: readonly string[];
  attempts: readonly string[];
}>;
export type QuarantineReportV12 = Readonly<{
  disposition: "clean" | "unresolved";
  entries: readonly QuarantineEntryV12[];
}>;
export class RuntimeKernelSessionQuarantineLedgerV12 {
  readonly #capacity: number;
  #reserved = 0;
  readonly #entries = new Map<string, QuarantineEntryV12>();
  #destroyed = false;
  constructor(activeEntitiesCeiling: number) {
    if (
      !Number.isSafeInteger(activeEntitiesCeiling) ||
      activeEntitiesCeiling < 0
    )
      throw new Error("invalid session quarantine capacity");
    this.#capacity = activeEntitiesCeiling;
  }
  assertGraphCreationAllowed(activeEntityGrant: number): void {
    if (this.#destroyed || this.#entries.size > 0)
      throw new Error("session quarantine blocks graph creation");
    if (activeEntityGrant > this.#capacity)
      throw new Error(
        "graph activeEntities grant exceeds session quarantine capacity",
      );
  }
  reserveActivation(): () => void {
    if (this.#reserved + this.#entries.size >= this.#capacity)
      throw new Error("session quarantine reservation exhausted");
    this.#reserved += 1;
    let held = true;
    return () => {
      if (!held) return;
      held = false;
      this.#reserved -= 1;
    };
  }
  transfer(
    identity: string,
    generation: number,
    retainedTokens: readonly string[],
    releaseReservation: () => void,
  ): void {
    if (this.#entries.has(identity))
      throw new Error("duplicate quarantine identity");
    this.#entries.set(
      identity,
      Object.freeze({
        identity,
        generation,
        retainedTokens: Object.freeze([...retainedTokens]),
        attempts: Object.freeze([]),
      }),
    );
    releaseReservation();
  }
  get size(): number {
    return this.#entries.size;
  }
  finalCleanup(
    retry: (entry: QuarantineEntryV12) => boolean,
  ): QuarantineReportV12 {
    for (const [id, entry] of [...this.#entries])
      if (retry(entry)) this.#entries.delete(id);
    return Object.freeze({
      disposition: this.#entries.size === 0 ? "clean" : "unresolved",
      entries: Object.freeze([...this.#entries.values()]),
    });
  }
  destroy(retry: (entry: QuarantineEntryV12) => boolean): QuarantineReportV12 {
    const report = this.finalCleanup(retry);
    this.#destroyed = true;
    return report;
  }
  assertVerificationClean(report: QuarantineReportV12 | undefined): void {
    if (
      report === undefined ||
      report.disposition !== "clean" ||
      report.entries.length !== 0
    )
      throw new Error("clean quarantine evidence is required");
  }
}

export type EntityCustodyStateV12 =
  "inactive" | "activating" | "active" | "recycling" | "quarantined";
export class EntityCustodyControllerV12 {
  readonly #entries = new Map<
    string,
    {
      state: EntityCustodyStateV12;
      generation: number;
      releaseCapacity?: () => void;
    }
  >();
  constructor(
    readonly session: RuntimeKernelSessionQuarantineLedgerV12,
    readonly adapter: Readonly<{
      activatePhysical(identity: string, generation: number): void;
      activateLogical(identity: string, generation: number): void;
      deactivatePhysical(identity: string, generation: number): boolean;
      deactivateLogical(identity: string, generation: number): boolean;
    }>,
  ) {}
  state(identity: string): EntityCustodyStateV12 {
    return this.#entries.get(identity)?.state ?? "inactive";
  }
  activate(
    identity: string,
    generation: number,
    retainedTokens: readonly string[],
  ): void {
    if (
      this.state(identity) !== "inactive" ||
      !Number.isSafeInteger(generation) ||
      generation < 1
    )
      throw new Error("entity activation identity/state violation");
    const releaseCapacity = this.session.reserveActivation();
    const entry: {
      state: EntityCustodyStateV12;
      generation: number;
      releaseCapacity?: () => void;
    } = { state: "activating", generation, releaseCapacity };
    this.#entries.set(identity, entry);
    try {
      this.adapter.activatePhysical(identity, generation);
      this.adapter.activateLogical(identity, generation);
      entry.state = "active";
    } catch (primary) {
      const physicalInactive = this.#attempt(() =>
        this.adapter.deactivatePhysical(identity, generation),
      );
      const logicalInactive = this.#attempt(() =>
        this.adapter.deactivateLogical(identity, generation),
      );
      if (physicalInactive && logicalInactive) {
        releaseCapacity();
        this.#entries.delete(identity);
      } else {
        entry.state = "quarantined";
        this.session.transfer(
          identity,
          generation,
          retainedTokens,
          releaseCapacity,
        );
        delete entry.releaseCapacity;
      }
      throw new Error("entity activation failed", { cause: primary });
    }
  }
  recycle(
    identity: string,
    generation: number,
    retainedTokens: readonly string[],
  ): void {
    const entry = this.#entries.get(identity);
    if (entry?.state !== "active" || entry.generation !== generation)
      throw new Error("entity recycle identity/generation/state violation");
    entry.state = "recycling";
    const physicalInactive = this.#attempt(() =>
      this.adapter.deactivatePhysical(identity, generation),
    );
    const logicalInactive = this.#attempt(() =>
      this.adapter.deactivateLogical(identity, generation),
    );
    if (physicalInactive && logicalInactive) {
      entry.releaseCapacity!();
      this.#entries.delete(identity);
      return;
    }
    entry.state = "quarantined";
    this.session.transfer(
      identity,
      generation,
      retainedTokens,
      entry.releaseCapacity!,
    );
    delete entry.releaseCapacity;
    throw new Error("entity recycle result is indeterminate");
  }
  #attempt(operation: () => boolean): boolean {
    try {
      return operation() === true;
    } catch {
      return false;
    }
  }
}

export function deriveModuleTextureKey(
  runtimeSha256: string,
  bindingId: string,
  existingKeys: ReadonlySet<string>,
  approvedExistingKey?: string,
): string {
  if (
    !/^[a-f0-9]{64}$/.test(runtimeSha256) ||
    !/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(bindingId)
  )
    throw new Error("invalid texture binding identity");
  const key = `module/${runtimeSha256}/${bindingId}`;
  if (existingKeys.has(key) && approvedExistingKey !== key)
    throw new Error(`texture key already exists: ${key}`);
  return key;
}

type PreparedSlot = {
  state: "free" | "prepared" | "committing" | "committed" | "quarantined";
  candidateId?: string;
  tokenId?: number;
};
export type PreparedContactCommitV12 = Readonly<{
  commit(): Readonly<{ evidenceId: number }>;
}>;
export type ContactIdentityV12 = Readonly<{
  producerInstanceId: string;
  producerSequence: number;
  sourceChannelId: string;
  sourceEntityId: string;
  sourceGeneration: number;
}>;
export class ContactCommitCoordinatorV12 {
  readonly #slots: PreparedSlot[];
  readonly #guard: GraphTransitionGuard;
  readonly #durable = new Set<string>();
  #evidence = 0;
  #aborted = 0;
  #prepares = new Map<number, number>();
  constructor(guard: GraphTransitionGuard, maximumConcurrentCommits: number) {
    this.#guard = guard;
    this.#slots = Array.from({ length: maximumConcurrentCommits }, () => ({
      state: "free",
    }));
  }
  get abortedPrepareCount(): number {
    return this.#aborted;
  }
  prepare(
    input: Readonly<{
      contactIdentity: ContactIdentityV12;
      sourceOperation: "consume";
      applySourceOperation: () => Readonly<{
        physical: boolean;
        logical: boolean;
      }>;
      deliverHit: (evidenceId: number) => unknown;
      deliverDamage: (evidenceId: number) => unknown;
      quarantine: () => void;
    }>,
  ): PreparedContactCommitV12 {
    const token = this.#guard.currentEventToken;
    if (token === undefined)
      throw new Error("contact prepare requires an event token");
    const candidateId = JSON.stringify([
      input.contactIdentity.producerInstanceId,
      input.contactIdentity.producerSequence,
      input.contactIdentity.sourceChannelId,
      input.contactIdentity.sourceEntityId,
      input.contactIdentity.sourceGeneration,
    ]);
    const count = (this.#prepares.get(token.eventTransactionId) ?? 0) + 1;
    if (count > MAX_PREPARES_PER_EVENT_TRANSACTION)
      throw new Error("contact prepare transaction limit exceeded");
    this.#prepares.set(token.eventTransactionId, count);
    if (
      this.#durable.has(candidateId) ||
      this.#slots.some((slot) => slot.candidateId === candidateId)
    )
      throw new Error("duplicate contact candidate");
    const slot = this.#slots.find((candidate) => candidate.state === "free");
    if (slot === undefined) throw new Error("contact commit slots exhausted");
    slot.state = "prepared";
    slot.candidateId = candidateId;
    slot.tokenId = token.eventTransactionId;
    let live = true;
    const abort = () => {
      this.#prepares.delete(token.eventTransactionId);
      if (!live || slot.state !== "prepared") return;
      live = false;
      slot.state = "free";
      delete slot.candidateId;
      delete slot.tokenId;
      this.#aborted = Math.min(Number.MAX_SAFE_INTEGER, this.#aborted + 1);
    };
    this.#guard.addEventFinalizer(abort);
    return Object.freeze({
      commit: () => {
        const current = this.#guard.currentEventToken;
        if (
          !live ||
          slot.state !== "prepared" ||
          current?.eventTransactionId !== slot.tokenId
        )
          throw new Error("prepared contact is expired or already consumed");
        live = false;
        slot.state = "committing";
        this.#durable.add(candidateId);
        const evidenceId = ++this.#evidence;
        let result: Readonly<{ physical: boolean; logical: boolean }>;
        try {
          result = input.applySourceOperation();
        } catch (error) {
          result = { physical: false, logical: false };
        }
        if (!result.physical || !result.logical) {
          slot.state = "quarantined";
          input.quarantine();
          throw new Error("source-operation-indeterminate");
        }
        slot.state = "committed";
        const failures: unknown[] = [];
        for (const delivery of [input.deliverHit, input.deliverDamage])
          try {
            invokeSync("contact result delivery", () => delivery(evidenceId));
          } catch (error) {
            failures.push(error);
          }
        slot.state = "free";
        delete slot.candidateId;
        delete slot.tokenId;
        if (failures.length > 0)
          throw new AggregateError(failures, "contact result delivery failed");
        return Object.freeze({ evidenceId });
      },
    });
  }

  releaseInactiveSourceGeneration(
    sourceChannelId: string,
    sourceEntityId: string,
    sourceGeneration: number,
  ): void {
    for (const key of [...this.#durable]) {
      const identity = JSON.parse(key) as [
        string,
        number,
        string,
        string,
        number,
      ];
      if (
        identity[2] === sourceChannelId &&
        identity[3] === sourceEntityId &&
        identity[4] === sourceGeneration
      ) {
        this.#durable.delete(key);
      }
    }
  }
}
