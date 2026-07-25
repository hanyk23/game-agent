import { AttackRequestPayloadV2Schema } from "./game-module-runtime-payloads.js";
import type {
  TimerHandleV12,
  TimerScheduleV12,
} from "./game-module-runtime-abi-v12.js";
import { SafeMonotonicCounterV1 } from "./game-module-safe-counter.js";

export type ActiveTriggerConfigurationV1 =
  | Readonly<{ attackChannelId: string; mode: "press" | "release" }>
  | Readonly<{
      attackChannelId: string;
      mode: "hold-repeat";
      initialDelayMs: number;
      repeatIntervalMs: number;
    }>;

export type ActiveTriggerStateV1 =
  | Readonly<{ state: "idle" }>
  | Readonly<{
      state: "held-edge" | "held-waiting" | "held-repeating";
      inputIdentity: string;
    }>;

export type ActiveTriggerClockV1 = Readonly<{
  nowMs(): number;
  schedule(instanceId: string, schedule: TimerScheduleV12): TimerHandleV12;
}>;

export type ActiveTriggerRequestV1 = Readonly<{
  sequence: number;
  emittedAtMs: number;
  requestedAtMs: number;
  attackChannelId: string;
  slot: "primary";
}>;

const incrementBounded = (value: number): number =>
  value === Number.MAX_SAFE_INTEGER ? value : value + 1;

/** Closed host state machine for ADR 0027 trigger.active. */
export class ActiveTriggerHostV1 {
  readonly #instanceId: string;
  readonly #configuration: ActiveTriggerConfigurationV1;
  readonly #clock: ActiveTriggerClockV1;
  readonly #emit: (request: ActiveTriggerRequestV1) => void;
  readonly #sequence = new SafeMonotonicCounterV1("trigger.attack-sequence");
  #state: ActiveTriggerStateV1 = Object.freeze({ state: "idle" });
  #timer: TimerHandleV12 | undefined;
  #running = false;
  #ignoredCapturedPresses = 0;
  #ignoredForeignPresses = 0;
  #ignoredReleases = 0;

  constructor(
    input: Readonly<{
      instanceId: string;
      configuration: ActiveTriggerConfigurationV1;
      clock: ActiveTriggerClockV1;
      emit(request: ActiveTriggerRequestV1): void;
    }>,
  ) {
    if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(input.instanceId))
      throw new Error("invalid active-trigger instance identity");
    if (
      !/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(
        input.configuration.attackChannelId,
      ) ||
      (input.configuration.mode === "hold-repeat" &&
        (!Number.isSafeInteger(input.configuration.initialDelayMs) ||
          input.configuration.initialDelayMs < 0 ||
          input.configuration.initialDelayMs > 10_000 ||
          !Number.isSafeInteger(input.configuration.repeatIntervalMs) ||
          input.configuration.repeatIntervalMs < 50 ||
          input.configuration.repeatIntervalMs > 10_000))
    )
      throw new Error("invalid active-trigger configuration");
    this.#instanceId = input.instanceId;
    this.#configuration = Object.freeze({ ...input.configuration });
    this.#clock = input.clock;
    this.#emit = input.emit;
  }

  get state(): ActiveTriggerStateV1 {
    return this.#state;
  }

  observe(): Readonly<{
    state: ActiveTriggerStateV1["state"];
    capturedInputIdentity: string | null;
    timerActive: boolean;
    nextSequence: number;
    ignoredCapturedPresses: number;
    ignoredForeignPresses: number;
    ignoredReleases: number;
  }> {
    return Object.freeze({
      state: this.#state.state,
      capturedInputIdentity:
        this.#state.state === "idle" ? null : this.#state.inputIdentity,
      timerActive: this.#timer?.active ?? false,
      nextSequence: this.#sequence.current + 1,
      ignoredCapturedPresses: this.#ignoredCapturedPresses,
      ignoredForeignPresses: this.#ignoredForeignPresses,
      ignoredReleases: this.#ignoredReleases,
    });
  }

  start(): void {
    if (this.#running) throw new Error("active trigger already running");
    this.#running = true;
  }

  accept(edge: "press" | "release", inputIdentity: string): void {
    if (!this.#running) throw new Error("active trigger is not running");
    if (inputIdentity.length === 0 || inputIdentity.length > 200)
      throw new Error("invalid active-trigger input identity");
    if (edge === "press") this.#press(inputIdentity);
    else this.#release(inputIdentity);
  }

  stop(): void {
    this.#running = false;
    this.#resetHeldState();
  }

  dispose(): void {
    this.#running = false;
    this.#resetHeldState();
  }

  #press(inputIdentity: string): void {
    if (this.#state.state !== "idle") {
      if (this.#state.inputIdentity === inputIdentity)
        this.#ignoredCapturedPresses = incrementBounded(
          this.#ignoredCapturedPresses,
        );
      else
        this.#ignoredForeignPresses = incrementBounded(
          this.#ignoredForeignPresses,
        );
      return;
    }
    if (this.#configuration.mode === "hold-repeat") {
      this.#state = Object.freeze({
        state: "held-waiting",
        inputIdentity,
      });
      this.#timer = this.#clock.schedule(this.#instanceId, {
        mode: "interval",
        initialDelayMs: this.#configuration.initialDelayMs,
        intervalMs: this.#configuration.repeatIntervalMs,
        callback: () => this.#onTimer(),
      });
      return;
    }
    this.#state = Object.freeze({ state: "held-edge", inputIdentity });
    if (this.#configuration.mode === "press") this.#emitRequest();
  }

  #release(inputIdentity: string): void {
    if (
      this.#state.state === "idle" ||
      this.#state.inputIdentity !== inputIdentity
    ) {
      this.#ignoredReleases = incrementBounded(this.#ignoredReleases);
      return;
    }
    const emit =
      this.#state.state === "held-edge" &&
      this.#configuration.mode === "release";
    this.#resetHeldState();
    if (emit) this.#emitRequest();
  }

  #onTimer(): void {
    if (
      !this.#running ||
      (this.#state.state !== "held-waiting" &&
        this.#state.state !== "held-repeating")
    )
      return;
    const inputIdentity = this.#state.inputIdentity;
    this.#emitRequest();
    this.#state = Object.freeze({ state: "held-repeating", inputIdentity });
  }

  #emitRequest(): void {
    const sequence = this.#sequence.preflightBlock(1).base;
    const nowMs = Math.floor(this.#clock.nowMs());
    const request = Object.freeze(
      AttackRequestPayloadV2Schema.parse({
        sequence,
        emittedAtMs: nowMs,
        requestedAtMs: nowMs,
        attackChannelId: this.#configuration.attackChannelId,
        slot: "primary",
      }),
    );
    this.#sequence.allocate();
    this.#emit(request);
  }

  #resetHeldState(): void {
    this.#timer?.cancel();
    this.#timer = undefined;
    this.#state = Object.freeze({ state: "idle" });
  }
}
