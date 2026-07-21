import { describe, expect, it, vi } from "vitest";

import { FrameTailOutcomeAuthorityAdapterV14 } from "../../src/modules/game-module-outcome-authority-adapter-v14.js";
import { FrameTailOutcomeHostV1 } from "../../src/modules/game-module-outcome-host.js";
import { GraphTransitionGuard } from "../../src/modules/game-module-runtime-abi-v12.js";

function fixture() {
  const guard = new GraphTransitionGuard();
  const host = new FrameTailOutcomeHostV1({
    guard,
    winProviderInstanceId: "outcome-win",
    lossProviderInstanceId: "outcome-loss",
    commitServiceId: "outcome.commit",
    firstFrameSequence: 1,
  });
  const transition = vi.fn();
  const cleanup = vi.fn(() => ({ graphClean: true, quarantineClean: true }));
  const adapter = new FrameTailOutcomeAuthorityAdapterV14({
    host,
    readElapsedMs: () => 16,
    readScore: () => 7.5,
    cleanup,
    transition,
  });
  return { adapter, cleanup, guard, host, transition };
}

describe("Graph 1.4 outcome authority adapter", () => {
  it("arms commit only during the frame-tail callable and finalizes after guard release", () => {
    const { adapter, cleanup, guard, host, transition } = fixture();
    const order: string[] = [];
    guard.run("frame", () => {
      adapter.beginFrame(1);
      host.publishCondition({
        providerInstanceId: "outcome-loss",
        candidate: "loss",
        met: true,
        reason: "player-health",
        observedAtMs: 16,
        evidenceId: "loss:0",
      });
      host.publishCondition({
        providerInstanceId: "outcome-win",
        candidate: "win",
        met: true,
        reason: "boss-defeat",
        observedAtMs: 16,
        evidenceId: "win:0",
      });
      adapter.arbitrateFrameTail(1, (view) => {
        order.push(`tail:${guard.held}`);
        expect(view.win?.met).toBe(true);
        expect(view.loss?.met).toBe(true);
        adapter.commit("outcome.commit", {
          outcome: "win",
          reason: "boss-defeat",
          conditionEvidenceId: "win:0",
        });
      });
      expect(cleanup).not.toHaveBeenCalled();
    });
    order.push(`released:${guard.held}`);
    adapter.afterGuard(1);
    expect(order).toEqual(["tail:true", "released:false"]);
    expect(cleanup).toHaveBeenCalledOnce();
    expect(transition).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "win", score: 7.5 }),
    );
  });

  it("rejects early, stale, wrong-ID, and non-strict commit requests", () => {
    const { adapter, guard, host } = fixture();
    expect(() =>
      adapter.commit("outcome.commit", {
        outcome: "win",
        reason: "boss-defeat",
        conditionEvidenceId: "win:0",
      }),
    ).toThrow(/active frame-tail token/);
    guard.run("frame", () => {
      adapter.beginFrame(1);
      host.publishCondition({
        providerInstanceId: "outcome-win",
        candidate: "win",
        met: true,
        reason: "boss-defeat",
        observedAtMs: 16,
        evidenceId: "win:0",
      });
      adapter.arbitrateFrameTail(1, () => {
        expect(() =>
          adapter.commit("wrong.commit", {
            outcome: "win",
            reason: "boss-defeat",
            conditionEvidenceId: "win:0",
          }),
        ).toThrow(/undeclared outcome commit grant/);
        expect(() =>
          adapter.commit("outcome.commit", {
            outcome: "win",
            reason: "boss-defeat",
            conditionEvidenceId: "win:0",
            extra: true,
          }),
        ).toThrow(/invalid outcome commit request/);
        adapter.commit("outcome.commit", {
          outcome: "win",
          reason: "boss-defeat",
          conditionEvidenceId: "win:0",
        });
      });
    });
    expect(() =>
      adapter.commit("outcome.commit", {
        outcome: "win",
        reason: "boss-defeat",
        conditionEvidenceId: "win:0",
      }),
    ).toThrow(/active frame-tail token/);
  });
});
