import { GraphTransitionGuard } from "./game-module-runtime-abi-v12.js";
import type {
  OutcomeConditionPayload,
  TerminalDecisionPayload,
} from "./game-module-runtime-payloads.js";
import { SafeMonotonicCounterV1 } from "./game-module-safe-counter.js";

export type OutcomeConditionUpdateV1 = Readonly<{
  providerInstanceId: string;
  candidate: "win" | "loss";
  met: boolean;
  reason: "player-health" | "boss-defeat" | "score-threshold" | "survival-time";
  observedAtMs: number;
  evidenceId: string;
}>;

export type OutcomeArbitrationViewV1 = Readonly<{
  frameSequence: number;
  win: OutcomeConditionPayload | null;
  loss: OutcomeConditionPayload | null;
}>;

export type OutcomeCommitRequestV1 = Readonly<{
  outcome: "win" | "loss";
  reason: TerminalDecisionPayload["reason"];
  conditionEvidenceId: string;
}>;

type TerminalStatus = "open" | "latched" | "failed" | "completed";

function isThenable(value: unknown): boolean {
  return (
    value !== null &&
    (typeof value === "object" || typeof value === "function") &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

/** Once-per-frame post-provider/post-event arbitration and deferred commit. */
export class FrameTailOutcomeHostV1 {
  readonly #guard: GraphTransitionGuard;
  readonly #winProviderInstanceId: string;
  readonly #lossProviderInstanceId: string;
  readonly #commitServiceId: string;
  readonly #conditionRevision: SafeMonotonicCounterV1;
  readonly #terminalSequence: SafeMonotonicCounterV1;
  readonly #conditions = new Map<string, OutcomeConditionPayload>();
  #lastFrameSequence = -1;
  #activeFrameSequence: number | undefined;
  #closedFrameTransitionId: number | undefined;
  #barrierActive = false;
  #decision: TerminalDecisionPayload | null = null;
  #status: TerminalStatus = "open";

  constructor(
    input: Readonly<{
      guard: GraphTransitionGuard;
      winProviderInstanceId: string;
      lossProviderInstanceId: string;
      commitServiceId: string;
      lastConditionRevision?: number;
      lastTerminalSequence?: number;
      firstFrameSequence?: number;
    }>,
  ) {
    if (
      input.winProviderInstanceId === input.lossProviderInstanceId ||
      !this.#validInstanceId(input.winProviderInstanceId) ||
      !this.#validInstanceId(input.lossProviderInstanceId) ||
      !/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(input.commitServiceId)
    )
      throw new Error("invalid outcome host configuration");
    this.#guard = input.guard;
    this.#winProviderInstanceId = input.winProviderInstanceId;
    this.#lossProviderInstanceId = input.lossProviderInstanceId;
    this.#commitServiceId = input.commitServiceId;
    const firstFrameSequence = input.firstFrameSequence ?? 0;
    if (!Number.isSafeInteger(firstFrameSequence) || firstFrameSequence < 0)
      throw new Error("invalid first outcome frame sequence");
    this.#lastFrameSequence = firstFrameSequence - 1;
    this.#conditionRevision = new SafeMonotonicCounterV1(
      "outcome-condition-revision",
      input.lastConditionRevision ?? -1,
    );
    this.#terminalSequence = new SafeMonotonicCounterV1(
      "terminal-decision-sequence",
      input.lastTerminalSequence ?? -1,
    );
  }

  get commitServiceId(): string {
    return this.#commitServiceId;
  }

  get terminalStatus(): TerminalStatus {
    return this.#status;
  }

  get nextFrameSequence(): number {
    return this.#lastFrameSequence + 1;
  }

  beginFrame(frameSequence: number): void {
    this.#requireOpen();
    if (
      this.#guard.currentTransition?.kind !== "frame" ||
      this.#guard.currentEventToken !== undefined ||
      this.#activeFrameSequence !== undefined ||
      !Number.isSafeInteger(frameSequence) ||
      frameSequence !== this.#lastFrameSequence + 1
    )
      throw new Error("outcome frame begin requires the next guarded frame");
    this.#activeFrameSequence = frameSequence;
  }

  publishCondition(update: OutcomeConditionUpdateV1): OutcomeConditionPayload {
    this.#requireOpen();
    if (this.#barrierActive)
      throw new Error("condition publication is forbidden during arbitration");
    const transition = this.#guard.currentTransition;
    if (
      transition === undefined ||
      !["frame", "external-event"].includes(transition.kind) ||
      (transition.kind === "frame" &&
        (this.#activeFrameSequence === undefined ||
          transition.id === this.#closedFrameTransitionId)) ||
      !Number.isSafeInteger(update.observedAtMs) ||
      update.observedAtMs < 0 ||
      !/^[a-z0-9][a-z0-9./:-]*$/.test(update.evidenceId)
    )
      throw new Error("invalid guarded outcome condition update");
    const expectedCandidate =
      update.providerInstanceId === this.#winProviderInstanceId
        ? "win"
        : update.providerInstanceId === this.#lossProviderInstanceId
          ? "loss"
          : undefined;
    if (expectedCandidate !== update.candidate)
      throw new Error("outcome provider/candidate authority mismatch");
    const eligibleFrameSequence =
      transition.kind === "frame" && this.#activeFrameSequence !== undefined
        ? this.#activeFrameSequence
        : this.#lastFrameSequence + 1;
    this.#conditionRevision.preflightBlock(1);
    const state = Object.freeze({
      revision: this.#conditionRevision.allocate(),
      emittedAtMs: update.observedAtMs,
      providerInstanceId: update.providerInstanceId,
      candidate: update.candidate,
      met: update.met,
      reason: update.reason,
      observedAtMs: update.observedAtMs,
      eligibleFrameSequence,
      evidenceId: update.evidenceId,
    });
    this.#conditions.set(update.providerInstanceId, state);
    return state;
  }

  arbitrateFrameTail(
    frameSequence: number,
    elapsedMs: number,
    score: number,
    coordinator: (
      view: OutcomeArbitrationViewV1,
      commit: (request: OutcomeCommitRequestV1) => TerminalDecisionPayload,
    ) => unknown,
  ): TerminalDecisionPayload | null {
    this.#requireOpen();
    if (
      this.#guard.currentTransition?.kind !== "frame" ||
      this.#guard.currentEventToken !== undefined ||
      this.#activeFrameSequence !== frameSequence ||
      !Number.isSafeInteger(elapsedMs) ||
      elapsedMs < 0 ||
      !Number.isFinite(score) ||
      score < 0 ||
      score > Number.MAX_SAFE_INTEGER
    )
      throw new Error("outcome arbitration requires the frame-tail barrier");
    const win = this.#eligible(this.#winProviderInstanceId, frameSequence);
    const loss = this.#eligible(this.#lossProviderInstanceId, frameSequence);
    const expected = win?.met ? win : loss?.met ? loss : null;
    const view = Object.freeze({ frameSequence, win, loss });
    this.#barrierActive = true;
    let tokenLive = true;
    let submitted = false;
    let committed: TerminalDecisionPayload | null = null;
    const commit = (
      request: OutcomeCommitRequestV1,
    ): TerminalDecisionPayload => {
      if (!tokenLive || !this.#barrierActive || submitted)
        throw new Error(
          "terminal commit arbitration token is invalid or consumed",
        );
      if (
        expected === null ||
        request.outcome !== expected.candidate ||
        request.reason !== expected.reason ||
        request.conditionEvidenceId !== expected.evidenceId
      )
        throw new Error(
          "terminal commit does not match win-first retained state",
        );
      this.#terminalSequence.preflightBlock(1);
      submitted = true;
      committed = Object.freeze({
        sequence: this.#terminalSequence.allocate(),
        committedAtMs: elapsedMs,
        frameSequence,
        outcome: request.outcome,
        reason: request.reason,
        elapsedMs,
        score,
        conditionEvidenceId: request.conditionEvidenceId,
      });
      this.#decision = committed;
      this.#status = "latched";
      return committed;
    };
    try {
      const result = coordinator(view, commit);
      if (isThenable(result))
        throw new Error("outcome coordinator returned a thenable");
      if (expected !== null && !submitted)
        throw new Error(
          "outcome coordinator omitted a mature terminal decision",
        );
      if (expected === null && submitted)
        throw new Error(
          "outcome coordinator committed without a mature condition",
        );
      return committed;
    } finally {
      this.#closedFrameTransitionId = this.#guard.currentTransition?.id;
      tokenLive = false;
      this.#barrierActive = false;
      this.#activeFrameSequence = undefined;
      this.#lastFrameSequence = frameSequence;
    }
  }

  finalizeTerminal(
    cleanup: () => Readonly<{ graphClean: boolean; quarantineClean: boolean }>,
    transition: (decision: TerminalDecisionPayload) => unknown,
  ): TerminalDecisionPayload {
    if (this.#guard.held)
      throw new Error("terminal finalization must wait for guard release");
    if (this.#status !== "latched" || this.#decision === null)
      throw new Error("no latched terminal decision to finalize");
    try {
      const cleanupResult = cleanup();
      if (
        isThenable(cleanupResult) ||
        !cleanupResult.graphClean ||
        !cleanupResult.quarantineClean
      )
        throw new Error("terminal cleanup evidence is not clean");
      const transitionResult = transition(this.#decision);
      if (isThenable(transitionResult))
        throw new Error("terminal lifecycle adapter returned a thenable");
      this.#status = "completed";
      return this.#decision;
    } catch (error) {
      this.#status = "failed";
      throw error;
    }
  }

  snapshot(): Readonly<{
    status: TerminalStatus;
    lastFrameSequence: number;
    decision: TerminalDecisionPayload | null;
  }> {
    return Object.freeze({
      status: this.#status,
      lastFrameSequence: this.#lastFrameSequence,
      decision: this.#decision,
    });
  }

  #eligible(
    providerInstanceId: string,
    frameSequence: number,
  ): OutcomeConditionPayload | null {
    const state = this.#conditions.get(providerInstanceId);
    return state !== undefined && state.eligibleFrameSequence <= frameSequence
      ? state
      : null;
  }

  #requireOpen(): void {
    if (this.#status !== "open")
      throw new Error("terminal latch blocks later gameplay or frames");
  }

  #validInstanceId(value: string): boolean {
    return /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(value);
  }
}
