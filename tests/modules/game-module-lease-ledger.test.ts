import { describe, expect, it } from "vitest";

import {
  DeterministicGameModuleLeaseLedger,
  GameModuleLeaseLedgerError,
  GameModuleLeaseLedgerErrorCode,
  type GameModuleLease,
  type GameModuleLeaseOwnerDeclaration,
} from "../../src/modules/game-module-lease-ledger.js";

const declarations = [
  {
    ownerId: "alpha",
    ceilings: { startLeases: 2, instanceLeases: 1, graphLeases: 1 },
    keys: {
      start: ["input", "timer", "one-over"],
      instance: ["pool", "one-over"],
      graph: ["router", "one-over"],
    },
  },
  {
    ownerId: "zero",
    ceilings: { startLeases: 0, instanceLeases: 0, graphLeases: 0 },
    keys: { start: ["input"], instance: ["pool"], graph: ["router"] },
  },
] as const satisfies readonly GameModuleLeaseOwnerDeclaration[];

function ledgerCode(action: () => void): string {
  try {
    action();
    throw new Error("expected lease ledger failure");
  } catch (error) {
    expect(error).toBeInstanceOf(GameModuleLeaseLedgerError);
    return (error as GameModuleLeaseLedgerError).code;
  }
}

describe("deterministic scoped game-module lease ledger", () => {
  it("acquires unique leases in all scopes and reports stable scoped snapshots", () => {
    const ledger = new DeterministicGameModuleLeaseLedger(declarations);
    const start = ledger.acquire("alpha", "start", "input");
    const instance = ledger.acquire("alpha", "instance", "pool");
    const graph = ledger.acquire("alpha", "graph", "router");

    expect([start.leaseId, instance.leaseId, graph.leaseId]).toEqual([
      "lease-00000001",
      "lease-00000002",
      "lease-00000003",
    ]);
    expect(Object.isFrozen(start)).toBe(true);
    expect(ledger.snapshot()).toMatchObject({
      counts: { start: 1, instance: 1, graph: 1 },
      owners: [
        {
          ownerId: "alpha",
          counts: { start: 1, instance: 1, graph: 1 },
        },
        {
          ownerId: "zero",
          counts: { start: 0, instance: 0, graph: 0 },
        },
      ],
    });
    expect(ledger.snapshotOwner("alpha").activeLeases).toEqual([
      start,
      instance,
      graph,
    ]);
    expect(ledger.snapshotScope("instance")).toEqual({
      scope: "instance",
      count: 1,
      activeLeases: [instance],
    });

    ledger.release(start);
    ledger.release(instance);
    ledger.release(graph);
    expect(ledger.snapshot().counts).toEqual({
      start: 0,
      instance: 0,
      graph: 0,
    });
    ledger.assertNoLeaks();
  });

  it("admits each exact scope ceiling and rejects one-over atomically", () => {
    for (const [scope, exactKeys] of [
      ["start", ["input", "timer"]],
      ["instance", ["pool"]],
      ["graph", ["router"]],
    ] as const) {
      const ledger = new DeterministicGameModuleLeaseLedger(declarations);
      for (const key of exactKeys) {
        ledger.acquire("alpha", scope, key);
      }
      const before = ledger.snapshot();
      expect(ledgerCode(() => ledger.acquire("alpha", scope, "one-over"))).toBe(
        GameModuleLeaseLedgerErrorCode.ceilingExceeded,
      );
      expect(ledger.snapshot()).toEqual(before);
      expect(ledger.releaseAll({ ownerId: "alpha", scope })).toHaveLength(
        exactKeys.length,
      );
    }

    const ledger = new DeterministicGameModuleLeaseLedger(declarations);
    const input = ledger.acquire("alpha", "start", "input");
    ledger.acquire("alpha", "start", "timer");
    ledger.release(input);
    const replacement = ledger.acquire("alpha", "start", "one-over");
    expect(replacement.leaseId).toBe("lease-00000003");
    expect(ledger.releaseAll({ scope: "start" })).toHaveLength(2);
  });

  it("rejects every declared key at a zero ceiling without mutation", () => {
    const ledger = new DeterministicGameModuleLeaseLedger(declarations);
    for (const [scope, key] of [
      ["start", "input"],
      ["instance", "pool"],
      ["graph", "router"],
    ] as const) {
      expect(ledgerCode(() => ledger.acquire("zero", scope, key))).toBe(
        GameModuleLeaseLedgerErrorCode.ceilingExceeded,
      );
    }
    expect(ledger.snapshotOwner("zero").counts).toEqual({
      start: 0,
      instance: 0,
      graph: 0,
    });
  });

  it("rejects unknown owners, wrong scopes, unknown keys, and duplicate active keys", () => {
    const ledger = new DeterministicGameModuleLeaseLedger(declarations);
    expect(ledgerCode(() => ledger.acquire("missing", "start", "input"))).toBe(
      GameModuleLeaseLedgerErrorCode.unknownOwner,
    );
    expect(ledgerCode(() => ledger.acquire("alpha", "graph", "input"))).toBe(
      GameModuleLeaseLedgerErrorCode.unknownKey,
    );
    expect(ledgerCode(() => ledger.acquire("alpha", "start", "missing"))).toBe(
      GameModuleLeaseLedgerErrorCode.unknownKey,
    );
    expect(
      ledgerCode(() => ledger.acquire("alpha", "invalid" as "start", "input")),
    ).toBe(GameModuleLeaseLedgerErrorCode.invalidScope);

    const lease = ledger.acquire("alpha", "start", "input");
    const before = ledger.snapshot();
    expect(ledgerCode(() => ledger.acquire("alpha", "start", "input"))).toBe(
      GameModuleLeaseLedgerErrorCode.duplicateActiveKey,
    );
    expect(ledger.snapshot()).toEqual(before);
    ledger.release(lease);
  });

  it("fails closed on forged identity, wrong owner or scope, and double release", () => {
    const ledger = new DeterministicGameModuleLeaseLedger(declarations);
    const lease = ledger.acquire("alpha", "start", "input");
    for (const forged of [
      { ...lease, ownerId: "zero" },
      { ...lease, scope: "instance" as const },
      { ...lease, key: "timer" },
    ]) {
      expect(ledgerCode(() => ledger.release(forged))).toBe(
        GameModuleLeaseLedgerErrorCode.leaseMismatch,
      );
      expect(ledger.snapshotScope("start").activeLeases).toEqual([lease]);
    }

    ledger.release(lease);
    expect(ledgerCode(() => ledger.release(lease))).toBe(
      GameModuleLeaseLedgerErrorCode.unknownLease,
    );
    expect(
      ledgerCode(() =>
        ledger.release({
          ...lease,
          leaseId: "lease-99999999",
        } as GameModuleLease),
      ),
    ).toBe(GameModuleLeaseLedgerErrorCode.unknownLease);
  });

  it("detects global, owner, and scope leaks and permits zero-count assertions", () => {
    const ledger = new DeterministicGameModuleLeaseLedger(declarations);
    const start = ledger.acquire("alpha", "start", "input");
    const graph = ledger.acquire("alpha", "graph", "router");

    expect(ledgerCode(() => ledger.assertNoLeaks())).toBe(
      GameModuleLeaseLedgerErrorCode.leakDetected,
    );
    expect(ledgerCode(() => ledger.assertNoLeaks({ ownerId: "alpha" }))).toBe(
      GameModuleLeaseLedgerErrorCode.leakDetected,
    );
    expect(ledgerCode(() => ledger.assertNoLeaks({ scope: "graph" }))).toBe(
      GameModuleLeaseLedgerErrorCode.leakDetected,
    );
    ledger.assertNoLeaks({ ownerId: "zero" });
    ledger.assertNoLeaks({ scope: "instance" });
    expect(ledgerCode(() => ledger.assertNoLeaks({ ownerId: "missing" }))).toBe(
      GameModuleLeaseLedgerErrorCode.unknownOwner,
    );

    ledger.release(start);
    ledger.release(graph);
    ledger.assertNoLeaks();
  });

  it("bulk releases filtered leases in reverse acquisition order", () => {
    const ledger = new DeterministicGameModuleLeaseLedger(declarations);
    const input = ledger.acquire("alpha", "start", "input");
    const pool = ledger.acquire("alpha", "instance", "pool");
    const timer = ledger.acquire("alpha", "start", "timer");
    const router = ledger.acquire("alpha", "graph", "router");

    expect(ledger.releaseAll({ ownerId: "alpha", scope: "start" })).toEqual([
      timer,
      input,
    ]);
    expect(ledger.snapshot().activeLeases).toEqual([pool, router]);
    expect(ledger.releaseAll({ scope: "instance" })).toEqual([pool]);
    expect(ledger.releaseAll({ ownerId: "zero" })).toEqual([]);
    expect(ledger.releaseAll()).toEqual([router]);
    expect(Object.isFrozen(ledger.releaseAll())).toBe(true);
    ledger.assertNoLeaks();

    expect(ledgerCode(() => ledger.release(input))).toBe(
      GameModuleLeaseLedgerErrorCode.unknownLease,
    );
  });

  it("rejects unknown bulk-release filters before mutation", () => {
    const ledger = new DeterministicGameModuleLeaseLedger(declarations);
    const input = ledger.acquire("alpha", "start", "input");
    const before = ledger.snapshot();
    expect(ledgerCode(() => ledger.releaseAll({ ownerId: "missing" }))).toBe(
      GameModuleLeaseLedgerErrorCode.unknownOwner,
    );
    expect(
      ledgerCode(() =>
        ledger.releaseAll({
          scope: "invalid" as "start",
        }),
      ),
    ).toBe(GameModuleLeaseLedgerErrorCode.invalidScope);
    expect(ledger.snapshot()).toEqual(before);
    ledger.release(input);
  });

  it("rejects invalid declarations before creating a usable ledger", () => {
    expect(
      ledgerCode(
        () =>
          new DeterministicGameModuleLeaseLedger([
            declarations[0],
            declarations[0],
          ]),
      ),
    ).toBe(GameModuleLeaseLedgerErrorCode.invalidDeclaration);
    expect(
      ledgerCode(
        () =>
          new DeterministicGameModuleLeaseLedger([
            {
              ...declarations[0],
              keys: { ...declarations[0].keys, start: ["input", "input"] },
            },
          ]),
      ),
    ).toBe(GameModuleLeaseLedgerErrorCode.invalidDeclaration);
    expect(
      ledgerCode(
        () =>
          new DeterministicGameModuleLeaseLedger([
            {
              ...declarations[0],
              ceilings: { ...declarations[0].ceilings, graphLeases: -1 },
            },
          ]),
      ),
    ).toBe(GameModuleLeaseLedgerErrorCode.invalidDeclaration);
    expect(
      ledgerCode(
        () =>
          new DeterministicGameModuleLeaseLedger([
            {
              ...declarations[0],
              ceilings: {
                ...declarations[0].ceilings,
                graphLeases: 10_001,
              },
            },
          ]),
      ),
    ).toBe(GameModuleLeaseLedgerErrorCode.invalidDeclaration);
  });

  it("requires zero residue for destruction and rejects every later operation", () => {
    const ledger = new DeterministicGameModuleLeaseLedger(declarations);
    const graph = ledger.acquire("alpha", "graph", "router");
    expect(ledgerCode(() => ledger.destroy())).toBe(
      GameModuleLeaseLedgerErrorCode.leakDetected,
    );
    ledger.release(graph);
    ledger.destroy();

    for (const operation of [
      () => ledger.acquire("alpha", "start", "input"),
      () => ledger.release(graph),
      () => ledger.releaseAll(),
      () => ledger.snapshot(),
      () => ledger.snapshotOwner("alpha"),
      () => ledger.snapshotScope("start"),
      () => ledger.assertNoLeaks(),
      () => ledger.destroy(),
    ]) {
      expect(ledgerCode(operation)).toBe(
        GameModuleLeaseLedgerErrorCode.destroyed,
      );
    }
  });
});
