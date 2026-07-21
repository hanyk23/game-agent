import {
  ScoreTransactionPayloadSchema,
  type ScoreStatePayload,
  type ScoreTransactionPayload,
} from "./game-module-runtime-payloads.js";
import { SafeMonotonicCounterV1 } from "./game-module-safe-counter.js";

export type ResolvedScoreAwardBoundV1 = Readonly<{
  maximumAward: number;
  evidenceId: string;
}>;

/** Assembly-singleton score writer using stable-order ordinary binary64 addition. */
export class ScoreLedgerHostV1 {
  readonly #duplicateCapacity: number;
  readonly #capacityEvidenceId: string;
  readonly #nowMs: () => number;
  readonly #revision: SafeMonotonicCounterV1;
  readonly #seen = new Set<string>();
  #total = 0;
  #transactionCount = 0;
  #defeatCount = 0;
  #grazeCount = 0;
  #pickupCount = 0;
  #lastRouterSequence = -1;
  #lastTimeMs = -1;
  #disposed = false;

  constructor(
    input: Readonly<{
      duplicateCapacity: number;
      capacityEvidenceId: string;
      nowMs(): number;
      lastRevision?: number;
    }>,
  ) {
    if (
      !Number.isSafeInteger(input.duplicateCapacity) ||
      input.duplicateCapacity < 1 ||
      input.duplicateCapacity > 1_000_000 ||
      !/^[a-f0-9]{64}$/.test(input.capacityEvidenceId)
    )
      throw new Error("invalid score ledger configuration");
    this.#duplicateCapacity = input.duplicateCapacity;
    this.#capacityEvidenceId = input.capacityEvidenceId;
    this.#nowMs = input.nowMs;
    this.#revision = new SafeMonotonicCounterV1(
      "score-ledger-revision",
      input.lastRevision ?? 0,
    );
  }

  get capacityEvidenceId(): string {
    return this.#capacityEvidenceId;
  }

  apply(
    routerSequence: number,
    transactionInput: ScoreTransactionPayload,
    bound: ResolvedScoreAwardBoundV1,
  ): ScoreStatePayload {
    this.#requireAlive();
    if (
      !Number.isSafeInteger(routerSequence) ||
      routerSequence < 0 ||
      routerSequence <= this.#lastRouterSequence
    )
      throw new Error("score router sequence is not strictly increasing");
    const transaction = ScoreTransactionPayloadSchema.parse(transactionInput);
    if (
      !Number.isFinite(bound.maximumAward) ||
      bound.maximumAward < 0 ||
      bound.maximumAward > Number.MAX_SAFE_INTEGER ||
      !/^[a-f0-9]{64}$/.test(bound.evidenceId) ||
      transaction.award > bound.maximumAward
    )
      throw new Error("score award exceeds resolved source bound");
    if (this.#seen.has(transaction.sourceEvidenceId))
      throw new Error("duplicate score source evidence");
    if (this.#seen.size >= this.#duplicateCapacity)
      throw new Error("score duplicate ledger capacity exhausted");
    const nextTotal = this.#total + transaction.award;
    if (
      !Number.isFinite(nextTotal) ||
      nextTotal < 0 ||
      nextTotal > Number.MAX_SAFE_INTEGER
    )
      throw new Error("score total exceeds bounded binary64 range");
    const nowMs = this.#readNow();
    this.#revision.preflightBlock(1);
    if (this.#transactionCount >= Number.MAX_SAFE_INTEGER)
      throw new Error("score transaction count exhausted");

    this.#total = nextTotal;
    this.#transactionCount += 1;
    if (transaction.kind === "defeat") this.#defeatCount += 1;
    else if (transaction.kind === "graze") this.#grazeCount += 1;
    else this.#pickupCount += 1;
    this.#seen.add(transaction.sourceEvidenceId);
    this.#lastRouterSequence = routerSequence;
    return this.#state(this.#revision.allocate(), nowMs);
  }

  snapshot(): ScoreStatePayload {
    this.#requireAlive();
    return this.#state(this.#revision.current, this.#readNow());
  }

  dispose(): void {
    this.#requireAlive();
    this.#disposed = true;
  }

  #state(revision: number, emittedAtMs: number): ScoreStatePayload {
    return Object.freeze({
      revision,
      emittedAtMs,
      total: this.#total,
      transactionCount: this.#transactionCount,
      defeatCount: this.#defeatCount,
      grazeCount: this.#grazeCount,
      pickupCount: this.#pickupCount,
    });
  }

  #readNow(): number {
    const nowMs = this.#nowMs();
    if (!Number.isSafeInteger(nowMs) || nowMs < 0 || nowMs < this.#lastTimeMs)
      throw new Error("score ledger clock is invalid or non-monotonic");
    this.#lastTimeMs = nowMs;
    return nowMs;
  }

  #requireAlive(): void {
    if (this.#disposed) throw new Error("score ledger host is disposed");
  }
}
