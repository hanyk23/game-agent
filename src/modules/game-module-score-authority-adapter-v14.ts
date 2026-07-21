import type { ResolvedModuleGraphV14 } from "./game-module-resolver-v14.js";
import {
  ScoreLedgerHostV1,
  type ResolvedScoreAwardBoundV1,
} from "./game-module-score-ledger-host.js";
import type {
  ScoreStatePayload,
  ScoreTransactionPayload,
} from "./game-module-runtime-payloads.js";
import { SafeMonotonicCounterV1 } from "./game-module-safe-counter.js";

export type ResolvedScoreBindingAwardBoundV14 = Readonly<{
  sourceInstanceId: string;
  sourcePortId: string;
  ledgerPortId: string;
  maximumAward: number;
  evidenceId: string;
}>;

export type GraphBoundScoreTransactionInputV14 = Readonly<{
  ledgerInstanceId: string;
  sourceInstanceId: string;
  sourcePortId: string;
  ledgerPortId: string;
  transaction: Readonly<unknown>;
}>;

const INPUT_KEYS = Object.freeze([
  "ledgerInstanceId",
  "ledgerPortId",
  "sourceInstanceId",
  "sourcePortId",
  "transaction",
]);

function routeKey(
  input: Pick<
    GraphBoundScoreTransactionInputV14,
    "ledgerInstanceId" | "ledgerPortId" | "sourceInstanceId" | "sourcePortId"
  >,
): string {
  return `${input.sourceInstanceId}\u0000${input.sourcePortId}\u0000${input.ledgerInstanceId}\u0000${input.ledgerPortId}`;
}

/**
 * Assembly-singleton adapter from exact Graph 1.4 score routes to the trusted
 * score ledger. Source factories never receive this object or choose bounds,
 * router sequence, ledger state, or the score-state writer.
 */
export class GraphBoundScoreLedgerAdapterV14 {
  readonly #ledger: ScoreLedgerHostV1;
  readonly #routerSequence: SafeMonotonicCounterV1;
  readonly #boundsByRoute: ReadonlyMap<string, ResolvedScoreAwardBoundV1>;
  #disposed = false;

  constructor(
    input: Readonly<{
      graph: ResolvedModuleGraphV14;
      nowMs(): number;
      lastRevision?: number;
      lastRouterSequence?: number;
    }>,
  ) {
    if (input.graph.graphVersion !== "1.4.0")
      throw new Error("score authority adapter requires Graph 1.4");
    const authority = input.graph.scoringAuthority;
    if (authority === null)
      throw new Error("score authority adapter requires resolved authority");
    const resolvedAuthority = authority as typeof authority &
      Readonly<{
        sourceRoutes: readonly ResolvedScoreBindingAwardBoundV14[];
      }>;
    if (!Array.isArray(resolvedAuthority.sourceRoutes))
      throw new Error("score authority lacks resolved source route bounds");
    const routes = input.graph.bindings.filter(
      (binding) =>
        binding.to.instanceId === authority.ledgerInstanceId &&
        binding.payloadType === "score-transaction-v1" &&
        binding.delivery === "event",
    );
    const routeKeys = new Set(
      routes.map((binding) =>
        routeKey({
          sourceInstanceId: binding.from.instanceId,
          sourcePortId: binding.from.portId,
          ledgerInstanceId: binding.to.instanceId,
          ledgerPortId: binding.to.portId,
        }),
      ),
    );
    if (routes.length === 0 || routeKeys.size !== routes.length)
      throw new Error("resolved score routes are empty or ambiguous");

    const bounds = new Map<string, ResolvedScoreAwardBoundV1>();
    for (const candidate of resolvedAuthority.sourceRoutes) {
      const key = routeKey({
        ...candidate,
        ledgerInstanceId: authority.ledgerInstanceId,
      });
      if (!routeKeys.has(key))
        throw new Error("score award bound lacks an exact resolved binding");
      if (bounds.has(key)) throw new Error("duplicate score award route bound");
      if (
        !Number.isFinite(candidate.maximumAward) ||
        candidate.maximumAward < 0 ||
        candidate.maximumAward > Number.MAX_SAFE_INTEGER ||
        !/^[a-f0-9]{64}$/.test(candidate.evidenceId)
      )
        throw new Error("invalid resolved score award bound");
      bounds.set(
        key,
        Object.freeze({
          maximumAward: candidate.maximumAward,
          evidenceId: candidate.evidenceId,
        }),
      );
    }
    if (bounds.size !== routeKeys.size)
      throw new Error("every resolved score route requires one award bound");

    this.#boundsByRoute = bounds;
    this.#routerSequence = new SafeMonotonicCounterV1(
      "score-router-sequence",
      input.lastRouterSequence ?? -1,
    );
    this.#ledger = new ScoreLedgerHostV1({
      duplicateCapacity: authority.duplicateCapacity,
      capacityEvidenceId: authority.capacityEvidenceId,
      nowMs: input.nowMs,
      ...(input.lastRevision === undefined
        ? {}
        : { lastRevision: input.lastRevision }),
    });
  }

  accept(input: GraphBoundScoreTransactionInputV14): ScoreStatePayload {
    this.#requireAlive();
    if (
      input === null ||
      typeof input !== "object" ||
      Object.keys(input).sort().join("\u0000") !== INPUT_KEYS.join("\u0000")
    )
      throw new Error("invalid score authority request shape");
    const bound = this.#boundsByRoute.get(routeKey(input));
    if (bound === undefined)
      throw new Error("score delivery lacks an exact resolved binding bound");
    const next = this.#routerSequence.preflightBlock(1).base;
    const state = this.#ledger.apply(
      next,
      input.transaction as ScoreTransactionPayload,
      bound,
    );
    this.#routerSequence.allocate();
    return state;
  }

  snapshot(): ScoreStatePayload {
    this.#requireAlive();
    return this.#ledger.snapshot();
  }

  dispose(): void {
    this.#requireAlive();
    this.#ledger.dispose();
    this.#disposed = true;
  }

  #requireAlive(): void {
    if (this.#disposed) throw new Error("score authority adapter is disposed");
  }
}
