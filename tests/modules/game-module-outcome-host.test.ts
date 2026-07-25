import { describe, expect, it, vi } from "vitest";

import { FrameTailOutcomeHostV1 } from "../../src/modules/game-module-outcome-host.js";
import { GraphTransitionGuard } from "../../src/modules/game-module-runtime-abi-v12.js";
import { SafeMonotonicCounterError } from "../../src/modules/game-module-safe-counter.js";

function fixture(overrides = {}) {
  const guard = new GraphTransitionGuard();
  const host = new FrameTailOutcomeHostV1({
    guard,
    winProviderInstanceId: "win-provider",
    lossProviderInstanceId: "loss-provider",
    commitServiceId: "outcome.commit",
    ...overrides,
  });
  return { guard, host };
}

const win = {
  providerInstanceId: "win-provider",
  candidate: "win" as const,
  met: true,
  reason: "boss-defeat" as const,
  observedAtMs: 10,
  evidenceId: "win:boss:1",
};
const loss = {
  providerInstanceId: "loss-provider",
  candidate: "loss" as const,
  met: true,
  reason: "player-health" as const,
  observedAtMs: 10,
  evidenceId: "loss:health:1",
};

describe("ADR 0028 frame-tail outcome host", () => {
  it("arbitrates opposite same-frame callback orders with win-first precedence", () => {
    for (const updates of [
      [loss, win],
      [win, loss],
    ]) {
      const { guard, host } = fixture();
      const decision = guard.run("frame", () => {
        host.beginFrame(0);
        for (const update of updates) host.publishCondition(update);
        return host.arbitrateFrameTail(0, 10, 7.5, (view, commit) => {
          expect(view.win?.met).toBe(true);
          expect(view.loss?.met).toBe(true);
          commit({
            outcome: "win",
            reason: view.win!.reason,
            conditionEvidenceId: view.win!.evidenceId,
          });
        });
      });
      expect(decision).toMatchObject({
        outcome: "win",
        reason: "boss-defeat",
        frameSequence: 0,
        score: 7.5,
      });
    }
  });

  it("defers an external condition to the next accepted frame", () => {
    const { guard, host } = fixture();
    guard.run("frame", () => {
      host.beginFrame(0);
      expect(
        host.arbitrateFrameTail(0, 0, 0, (_view, _commit) => undefined),
      ).toBeNull();
    });
    guard.run("external-event", () => {
      expect(host.publishCondition(loss).eligibleFrameSequence).toBe(1);
    });
    const decision = guard.run("frame", () => {
      host.beginFrame(1);
      return host.arbitrateFrameTail(1, 11, 0, (view, commit) =>
        commit({
          outcome: "loss",
          reason: view.loss!.reason,
          conditionEvidenceId: view.loss!.evidenceId,
        }),
      );
    });
    expect(decision).toMatchObject({ outcome: "loss", frameSequence: 1 });
  });

  it("allows one barrier only after events and rejects post-barrier providers", () => {
    const { guard, host } = fixture();
    guard.run("frame", () => {
      host.beginFrame(0);
      guard.deliver(() =>
        expect(() => host.arbitrateFrameTail(0, 0, 0, () => undefined)).toThrow(
          /frame-tail barrier/,
        ),
      );
      host.arbitrateFrameTail(0, 0, 0, () => undefined);
      expect(() => host.publishCondition(win)).toThrow(/invalid guarded/);
      expect(() => host.arbitrateFrameTail(0, 0, 0, () => undefined)).toThrow(
        /frame-tail barrier/,
      );
    });
  });

  it("makes the commit capability synchronous, once-only, and state-matched", () => {
    const { guard, host } = fixture();
    let escaped:
      | ((request: {
          outcome: "win" | "loss";
          reason: "boss-defeat";
          conditionEvidenceId: string;
        }) => unknown)
      | undefined;
    guard.run("frame", () => {
      host.beginFrame(0);
      host.publishCondition(win);
      host.arbitrateFrameTail(0, 10, 0, (view, commit) => {
        escaped = commit as typeof escaped;
        expect(() =>
          commit({
            outcome: "loss",
            reason: view.win!.reason,
            conditionEvidenceId: view.win!.evidenceId,
          }),
        ).toThrow(/win-first/);
        commit({
          outcome: "win",
          reason: view.win!.reason,
          conditionEvidenceId: view.win!.evidenceId,
        });
        expect(() =>
          commit({
            outcome: "win",
            reason: view.win!.reason,
            conditionEvidenceId: view.win!.evidenceId,
          }),
        ).toThrow(/consumed/);
      });
    });
    expect(() =>
      escaped!({
        outcome: "win",
        reason: "boss-defeat",
        conditionEvidenceId: "win:boss:1",
      }),
    ).toThrow(/invalid|consumed/);
  });

  it("defers lifecycle transition until guard release and clean evidence", () => {
    const { guard, host } = fixture();
    const order: string[] = [];
    guard.run("frame", () => {
      host.beginFrame(0);
      host.publishCondition(win);
      host.arbitrateFrameTail(0, 10, 0, (view, commit) =>
        commit({
          outcome: "win",
          reason: view.win!.reason,
          conditionEvidenceId: view.win!.evidenceId,
        }),
      );
      expect(() =>
        host.finalizeTerminal(
          () => ({ graphClean: true, quarantineClean: true }),
          vi.fn(),
        ),
      ).toThrow(/guard release/);
    });
    const finalized = host.finalizeTerminal(
      () => {
        order.push("cleanup");
        return { graphClean: true, quarantineClean: true };
      },
      () => order.push("transition"),
    );
    expect(finalized.outcome).toBe("win");
    expect(order).toEqual(["cleanup", "transition"]);
    expect(host.terminalStatus).toBe("completed");
    expect(() => guard.run("frame", () => host.beginFrame(1))).toThrow(
      /latch blocks/,
    );
  });

  it("records cleanup failure without publishing a successful terminal run", () => {
    const { guard, host } = fixture();
    guard.run("frame", () => {
      host.beginFrame(0);
      host.publishCondition(win);
      host.arbitrateFrameTail(0, 10, 0, (view, commit) =>
        commit({
          outcome: "win",
          reason: view.win!.reason,
          conditionEvidenceId: view.win!.evidenceId,
        }),
      );
    });
    const transition = vi.fn();
    expect(() =>
      host.finalizeTerminal(
        () => ({ graphClean: true, quarantineClean: false }),
        transition,
      ),
    ).toThrow(/not clean/);
    expect(host.terminalStatus).toBe("failed");
    expect(transition).not.toHaveBeenCalled();
  });

  it("preflights condition and terminal counters before state mutation", () => {
    const condition = fixture({
      lastConditionRevision: Number.MAX_SAFE_INTEGER,
    });
    expect(() =>
      condition.guard.run("external-event", () =>
        condition.host.publishCondition(win),
      ),
    ).toThrow(SafeMonotonicCounterError);
    const terminal = fixture({
      lastTerminalSequence: Number.MAX_SAFE_INTEGER,
    });
    expect(() =>
      terminal.guard.run("frame", () => {
        terminal.host.beginFrame(0);
        terminal.host.publishCondition(win);
        terminal.host.arbitrateFrameTail(0, 10, 0, (view, commit) =>
          commit({
            outcome: "win",
            reason: view.win!.reason,
            conditionEvidenceId: view.win!.evidenceId,
          }),
        );
      }),
    ).toThrow(SafeMonotonicCounterError);
    expect(terminal.host.snapshot().decision).toBeNull();
  });
});
