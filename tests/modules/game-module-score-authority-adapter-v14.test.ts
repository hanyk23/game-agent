import { describe, expect, it } from "vitest";

import type { ResolvedModuleGraphV14 } from "../../src/modules/game-module-resolver-v14.js";
import { GraphBoundScoreLedgerAdapterV14 } from "../../src/modules/game-module-score-authority-adapter-v14.js";

const hash = (character: string): string => character.repeat(64);

function graph(): ResolvedModuleGraphV14 {
  return {
    graphVersion: "1.4.0",
    bindings: [
      {
        from: { instanceId: "pickup-score", portId: "award" },
        to: { instanceId: "score-ledger", portId: "transactions" },
        payloadType: "score-transaction-v1",
        delivery: "event",
      },
      {
        from: { instanceId: "graze-score", portId: "award" },
        to: { instanceId: "score-ledger", portId: "transactions" },
        payloadType: "score-transaction-v1",
        delivery: "event",
      },
    ],
    scoringAuthority: {
      ledgerInstanceId: "score-ledger",
      duplicateCapacity: 4,
      capacityEvidenceId: hash("a"),
      awardProfile: "bounded-score-number-v1",
      additionOrder: "stable-router-order-binary64-v1",
      sourceRoutes: [
        {
          sourceInstanceId: "pickup-score",
          sourcePortId: "award",
          ledgerPortId: "transactions",
          maximumAward: 7.5,
          evidenceId: hash("b"),
        },
        {
          sourceInstanceId: "graze-score",
          sourcePortId: "award",
          ledgerPortId: "transactions",
          maximumAward: 1,
          evidenceId: hash("c"),
        },
      ],
    },
  } as unknown as ResolvedModuleGraphV14;
}

function request(
  sourceInstanceId: string,
  sourceEvidenceId: string,
  award: number,
) {
  return {
    ledgerInstanceId: "score-ledger",
    ledgerPortId: "transactions",
    sourceInstanceId,
    sourcePortId: "award",
    transaction: {
      sequence: 0,
      emittedAtMs: 0,
      sourceEvidenceId,
      kind: sourceInstanceId === "graze-score" ? "graze" : "pickup",
      award,
    },
  } as const;
}

describe("Graph 1.4 graph-bound score authority adapter", () => {
  it("maps exact resolved routes to immutable ledger states in stable call order", () => {
    const adapter = new GraphBoundScoreLedgerAdapterV14({
      graph: graph(),
      nowMs: () => 16,
    });
    const first = adapter.accept(request("pickup-score", "pickup:one", 0.1));
    const second = adapter.accept(request("graze-score", "graze:one", 0.2));
    expect(first).toMatchObject({ revision: 1, total: 0.1 });
    expect(second).toMatchObject({
      revision: 2,
      total: 0.1 + 0.2,
      grazeCount: 1,
      pickupCount: 1,
    });
    expect(Object.isFrozen(second)).toBe(true);
  });

  it("rejects wrong bindings and the bound belonging to another exact route", () => {
    const adapter = new GraphBoundScoreLedgerAdapterV14({
      graph: graph(),
      nowMs: () => 0,
    });
    expect(() =>
      adapter.accept({
        ...request("pickup-score", "pickup:wrong-port", 1),
        sourcePortId: "other",
      }),
    ).toThrow(/exact resolved binding bound/);
    expect(() =>
      adapter.accept(request("graze-score", "graze:over", 1.5)),
    ).toThrow(/source bound/);
    expect(adapter.snapshot()).toMatchObject({ total: 0, revision: 0 });
  });

  it("deduplicates source evidence before mutation without corrupting order", () => {
    const adapter = new GraphBoundScoreLedgerAdapterV14({
      graph: graph(),
      nowMs: () => 0,
    });
    adapter.accept(request("pickup-score", "shared:evidence", 1));
    expect(() =>
      adapter.accept(request("graze-score", "shared:evidence", 1)),
    ).toThrow(/duplicate score source evidence/);
    const state = adapter.accept(request("graze-score", "graze:next", 1));
    expect(state).toMatchObject({
      revision: 2,
      total: 2,
      transactionCount: 2,
    });
  });

  it("requires one resolved bound per score binding and no unbound extras", () => {
    const missing = graph() as unknown as {
      scoringAuthority: { sourceRoutes: unknown[] };
    };
    missing.scoringAuthority.sourceRoutes.pop();
    expect(
      () =>
        new GraphBoundScoreLedgerAdapterV14({
          graph: missing as unknown as ResolvedModuleGraphV14,
          nowMs: () => 0,
        }),
    ).toThrow(/every resolved score route/);

    const extra = graph() as unknown as {
      scoringAuthority: { sourceRoutes: unknown[] };
    };
    extra.scoringAuthority.sourceRoutes.push({
      sourceInstanceId: "forged",
      sourcePortId: "award",
      ledgerPortId: "transactions",
      maximumAward: 1,
      evidenceId: hash("d"),
    });
    expect(
      () =>
        new GraphBoundScoreLedgerAdapterV14({
          graph: extra as unknown as ResolvedModuleGraphV14,
          nowMs: () => 0,
        }),
    ).toThrow(/exact resolved binding/);
  });

  it("has one internal writer and rejects caller-supplied state fields", () => {
    const adapter = new GraphBoundScoreLedgerAdapterV14({
      graph: graph(),
      nowMs: () => 0,
    });
    expect(() =>
      adapter.accept({
        ...request("pickup-score", "pickup:forged", 1),
        state: { total: 999 },
      } as never),
    ).toThrow(/request shape/);
    expect(adapter.snapshot()).toMatchObject({ total: 0, revision: 0 });
    adapter.dispose();
    expect(() => adapter.snapshot()).toThrow(/disposed/);
  });
});
