import {
  FrameTailOutcomeHostV1,
  type OutcomeCommitRequestV1,
  type OutcomeConditionUpdateV1,
} from "./game-module-outcome-host.js";
import type { OutcomeFrameTailCallableV14 } from "./game-module-runtime-factory.js";
import type { TerminalDecisionPayload } from "./game-module-runtime-payloads.js";

function assertExactCommitRequest(value: unknown): OutcomeCommitRequestV1 {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw new Error("invalid outcome commit request");
  const source = value as Record<string, unknown>;
  if (
    JSON.stringify(Object.keys(source).sort()) !==
      JSON.stringify(["conditionEvidenceId", "outcome", "reason"].sort()) ||
    !["win", "loss"].includes(source.outcome as string) ||
    ![
      "player-health",
      "boss-defeat",
      "score-threshold",
      "survival-time",
    ].includes(source.reason as string) ||
    typeof source.conditionEvidenceId !== "string"
  )
    throw new Error("invalid outcome commit request");
  return Object.freeze({
    outcome: source.outcome as OutcomeCommitRequestV1["outcome"],
    reason: source.reason as OutcomeCommitRequestV1["reason"],
    conditionEvidenceId: source.conditionEvidenceId,
  });
}

/** Arms the outcome commit capability only for the resolved frame-tail call. */
export class FrameTailOutcomeAuthorityAdapterV14 {
  readonly #host: FrameTailOutcomeHostV1;
  readonly #readElapsedMs: () => number;
  readonly #readScore: () => number;
  readonly #cleanup: () => Readonly<{
    graphClean: boolean;
    quarantineClean: boolean;
  }>;
  readonly #transition: (decision: TerminalDecisionPayload) => unknown;
  #activeCommit:
    | Readonly<{
        frameSequence: number;
        commit(request: OutcomeCommitRequestV1): TerminalDecisionPayload;
      }>
    | undefined;

  constructor(input: {
    host: FrameTailOutcomeHostV1;
    readElapsedMs(): number;
    readScore(): number;
    cleanup(): Readonly<{ graphClean: boolean; quarantineClean: boolean }>;
    transition(decision: TerminalDecisionPayload): unknown;
  }) {
    if (input.host.nextFrameSequence !== 1)
      throw new Error("production outcome host must start at runtime frame 1");
    this.#host = input.host;
    this.#readElapsedMs = input.readElapsedMs;
    this.#readScore = input.readScore;
    this.#cleanup = input.cleanup;
    this.#transition = input.transition;
  }

  beginFrame(frameSequence: number): void {
    this.#host.beginFrame(frameSequence);
  }

  publishCondition(update: OutcomeConditionUpdateV1): unknown {
    return this.#host.publishCondition(update);
  }

  arbitrateFrameTail(
    frameSequence: number,
    coordinator: OutcomeFrameTailCallableV14,
  ): unknown {
    return this.#host.arbitrateFrameTail(
      frameSequence,
      this.#readElapsedMs(),
      this.#readScore(),
      (view, commit) => {
        if (this.#activeCommit !== undefined)
          throw new Error("outcome commit capability is already armed");
        this.#activeCommit = Object.freeze({ frameSequence, commit });
        try {
          return coordinator(view);
        } finally {
          this.#activeCommit = undefined;
        }
      },
    );
  }

  commit(commitServiceId: string, decision: Readonly<unknown>): unknown {
    if (commitServiceId !== this.#host.commitServiceId)
      throw new Error(`undeclared outcome commit grant: ${commitServiceId}`);
    const active = this.#activeCommit;
    if (active === undefined)
      throw new Error("outcome commit requires the active frame-tail token");
    return active.commit(assertExactCommitRequest(decision));
  }

  afterGuard(_frameSequence: number): void {
    if (this.#host.terminalStatus === "latched")
      this.#host.finalizeTerminal(this.#cleanup, this.#transition);
  }
}
