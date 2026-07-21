import { describe, expect, it } from "vitest";

import {
  DeterministicGameModuleLeaseLedger,
  GameModuleLeaseLedgerError,
  GameModuleLeaseLedgerErrorCode,
} from "../../src/modules/game-module-lease-ledger.js";
import {
  DeterministicGameModuleLifecycleCoordinator,
  GameModuleLifecycleError,
  type GameModuleLifecycleParticipant,
} from "../../src/modules/game-module-lifecycle-coordinator.js";

function createLedger(): DeterministicGameModuleLeaseLedger {
  return new DeterministicGameModuleLeaseLedger([
    {
      ownerId: "provider",
      ceilings: { startLeases: 1, instanceLeases: 1, graphLeases: 0 },
      keys: { start: ["timer"], instance: ["state"], graph: [] },
    },
    {
      ownerId: "consumer",
      ceilings: { startLeases: 1, instanceLeases: 1, graphLeases: 0 },
      keys: { start: ["input"], instance: ["cache"], graph: [] },
    },
    {
      ownerId: "graph-host",
      ceilings: { startLeases: 0, instanceLeases: 0, graphLeases: 1 },
      keys: { start: [], instance: [], graph: ["lifecycle"] },
    },
  ]);
}

function lifecycleFailure(action: () => void): GameModuleLifecycleError {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(GameModuleLifecycleError);
    return error as GameModuleLifecycleError;
  }
  throw new Error("expected lifecycle failure");
}

describe("lifecycle and scoped lease integration", () => {
  it("releases start leases on pause, retains instance leases, and destroys graph leases", () => {
    const ledger = createLedger();
    const graphLease = ledger.acquire("graph-host", "graph", "lifecycle");
    const calls: string[] = [];
    const participants: GameModuleLifecycleParticipant[] = [
      {
        instanceId: "provider",
        initialize: () => {
          calls.push("initialize:provider");
          ledger.acquire("provider", "instance", "state");
        },
        start: () => {
          calls.push("start:provider");
          ledger.acquire("provider", "start", "timer");
        },
        stop: () => {
          calls.push("stop:provider");
          ledger.releaseAll({ ownerId: "provider", scope: "start" });
        },
        dispose: () => {
          calls.push("dispose:provider");
          ledger.releaseAll({ ownerId: "provider", scope: "instance" });
        },
      },
      {
        instanceId: "consumer",
        initialize: () => {
          calls.push("initialize:consumer");
          ledger.acquire("consumer", "instance", "cache");
        },
        start: () => {
          calls.push("start:consumer");
          ledger.acquire("consumer", "start", "input");
        },
        stop: () => {
          calls.push("stop:consumer");
          ledger.releaseAll({ ownerId: "consumer", scope: "start" });
        },
        dispose: () => {
          calls.push("dispose:consumer");
          ledger.releaseAll({ ownerId: "consumer", scope: "instance" });
        },
      },
    ];
    const coordinator = new DeterministicGameModuleLifecycleCoordinator({
      graph: {
        productionInstantiationAllowed: true,
        constructionOrder: ["provider", "consumer"],
      },
      participants,
      boundaries: {
        afterStop: () => ledger.assertNoLeaks({ scope: "start" }),
        afterDispose: () => {
          ledger.assertNoLeaks({ scope: "start" });
          ledger.assertNoLeaks({ scope: "instance" });
        },
      },
      destroyGraph: () => {
        ledger.release(graphLease);
        ledger.assertNoLeaks();
        ledger.destroy();
      },
    });

    coordinator.initialize();
    coordinator.start();
    coordinator.stop();
    expect(ledger.snapshot().counts).toEqual({
      start: 0,
      instance: 2,
      graph: 1,
    });
    coordinator.start();
    coordinator.stop();
    coordinator.dispose();
    coordinator.destroy();

    expect(calls).toEqual([
      "initialize:provider",
      "initialize:consumer",
      "start:provider",
      "start:consumer",
      "stop:consumer",
      "stop:provider",
      "start:provider",
      "start:consumer",
      "stop:consumer",
      "stop:provider",
      "dispose:consumer",
      "dispose:provider",
    ]);
    expect(() => ledger.snapshot()).toThrowError(
      expect.objectContaining({
        code: GameModuleLeaseLedgerErrorCode.destroyed,
      }) as GameModuleLeaseLedgerError,
    );
  });

  it("revokes leases acquired by a throwing start and preserves cleanup failures", () => {
    const ledger = createLedger();
    const graphLease = ledger.acquire("graph-host", "graph", "lifecycle");
    const primary = new Error("consumer start failed");
    const cleanup = new Error("provider stop failed after releasing its lease");
    const coordinator = new DeterministicGameModuleLifecycleCoordinator({
      graph: {
        productionInstantiationAllowed: true,
        constructionOrder: ["provider", "consumer"],
      },
      participants: [
        {
          instanceId: "provider",
          initialize: () => ledger.acquire("provider", "instance", "state"),
          start: () => ledger.acquire("provider", "start", "timer"),
          stop: () => {
            ledger.releaseAll({ ownerId: "provider", scope: "start" });
            throw cleanup;
          },
          dispose: () =>
            ledger.releaseAll({ ownerId: "provider", scope: "instance" }),
        },
        {
          instanceId: "consumer",
          initialize: () => ledger.acquire("consumer", "instance", "cache"),
          start: () => {
            ledger.acquire("consumer", "start", "input");
            throw primary;
          },
          stop: () =>
            ledger.releaseAll({ ownerId: "consumer", scope: "start" }),
          dispose: () =>
            ledger.releaseAll({ ownerId: "consumer", scope: "instance" }),
        },
      ],
      boundaries: {
        afterStop: () => ledger.assertNoLeaks({ scope: "start" }),
        afterDispose: () => {
          ledger.assertNoLeaks({ scope: "start" });
          ledger.assertNoLeaks({ scope: "instance" });
        },
      },
      destroyGraph: () => {
        ledger.release(graphLease);
        ledger.assertNoLeaks();
        ledger.destroy();
      },
    });

    coordinator.initialize();
    const failure = lifecycleFailure(() => coordinator.start());
    expect(failure.failures.map(({ error }) => error)).toEqual([
      primary,
      cleanup,
    ]);
    expect(coordinator.phase).toBe("destroyed");
    expect(() => ledger.snapshot()).toThrowError(
      expect.objectContaining({
        code: GameModuleLeaseLedgerErrorCode.destroyed,
      }) as GameModuleLeaseLedgerError,
    );
  });
});
