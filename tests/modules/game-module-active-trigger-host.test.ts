import { describe, expect, it } from "vitest";

import { ActiveTriggerHostV1 } from "../../src/modules/game-module-active-trigger-host.js";
import { DeterministicModuleClockV12 } from "../../src/modules/game-module-runtime-abi-v12.js";

function host(
  configuration:
    | { attackChannelId: string; mode: "press" | "release" }
    | {
        attackChannelId: string;
        mode: "hold-repeat";
        initialDelayMs: number;
        repeatIntervalMs: number;
      },
) {
  const clock = new DeterministicModuleClockV12(
    ["trigger"],
    Object.freeze({
      trigger: configuration.mode === "hold-repeat" ? 1 : 0,
    }),
  );
  const requests: unknown[] = [];
  const trigger = new ActiveTriggerHostV1({
    instanceId: "trigger",
    configuration,
    clock,
    emit(request) {
      requests.push(request);
    },
  });
  trigger.start();
  return { clock, trigger, requests };
}

describe("ADR 0027 active trigger state machine", () => {
  it("emits once on press and ignores duplicate/foreign presses and releases", () => {
    const { trigger, requests } = host({
      attackChannelId: "player.primary",
      mode: "press",
    });
    trigger.accept("release", "key-a");
    trigger.accept("press", "key-a");
    trigger.accept("press", "key-a");
    trigger.accept("press", "key-b");
    trigger.accept("release", "key-b");
    expect(requests).toEqual([
      {
        sequence: 0,
        emittedAtMs: 0,
        requestedAtMs: 0,
        attackChannelId: "player.primary",
        slot: "primary",
      },
    ]);
    expect(trigger.observe()).toMatchObject({
      state: "held-edge",
      capturedInputIdentity: "key-a",
      ignoredCapturedPresses: 1,
      ignoredForeignPresses: 1,
      ignoredReleases: 2,
    });
    trigger.accept("release", "key-a");
    expect(trigger.state).toEqual({ state: "idle" });
  });

  it("arms release mode and emits only for the matching captured release", () => {
    const { trigger, requests } = host({
      attackChannelId: "player.primary",
      mode: "release",
    });
    trigger.accept("press", "pointer-1");
    trigger.accept("release", "pointer-2");
    expect(requests).toHaveLength(0);
    trigger.accept("release", "pointer-1");
    expect(requests).toHaveLength(1);
    expect(trigger.state).toEqual({ state: "idle" });
  });

  it("waits for the next exact timer boundary at zero delay and repeats exactly", () => {
    const { clock, trigger, requests } = host({
      attackChannelId: "enemy.pattern",
      mode: "hold-repeat",
      initialDelayMs: 0,
      repeatIntervalMs: 50,
    });
    trigger.accept("press", "key-space");
    expect(requests).toHaveLength(0);
    expect(trigger.observe()).toMatchObject({
      state: "held-waiting",
      timerActive: true,
    });
    clock.beginAcceptedFrame(0);
    clock.dispatchDue();
    expect(requests).toHaveLength(1);
    expect(trigger.state).toMatchObject({ state: "held-repeating" });
    clock.beginAcceptedFrame(49);
    clock.dispatchDue();
    expect(requests).toHaveLength(1);
    clock.beginAcceptedFrame(1);
    clock.dispatchDue();
    expect(requests).toHaveLength(2);
    expect(
      requests.map((request) => (request as { sequence: number }).sequence),
    ).toEqual([0, 1]);
  });

  it("makes accepted release-before-frame cancel the same-time due timer", () => {
    const { clock, trigger, requests } = host({
      attackChannelId: "enemy.pattern",
      mode: "hold-repeat",
      initialDelayMs: 0,
      repeatIntervalMs: 50,
    });
    trigger.accept("press", "key-space");
    trigger.accept("release", "key-space");
    clock.beginAcceptedFrame(0);
    clock.dispatchDue();
    expect(requests).toHaveLength(0);
    expect(trigger.state).toEqual({ state: "idle" });
  });

  it("lets an already-started timer transition emit before later release", () => {
    const { clock, trigger, requests } = host({
      attackChannelId: "enemy.pattern",
      mode: "hold-repeat",
      initialDelayMs: 0,
      repeatIntervalMs: 50,
    });
    trigger.accept("press", "key-space");
    clock.beginAcceptedFrame(0);
    clock.dispatchDue();
    trigger.accept("release", "key-space");
    expect(requests).toHaveLength(1);
    expect(trigger.state).toEqual({ state: "idle" });
  });

  it("resets on stop/pause and requires a fresh press after resume", () => {
    const { clock, trigger, requests } = host({
      attackChannelId: "enemy.pattern",
      mode: "hold-repeat",
      initialDelayMs: 100,
      repeatIntervalMs: 50,
    });
    trigger.accept("press", "key-space");
    trigger.stop();
    clock.beginAcceptedFrame(100);
    clock.dispatchDue();
    expect(requests).toHaveLength(0);
    expect(trigger.state).toEqual({ state: "idle" });
    trigger.start();
    trigger.accept("release", "key-space");
    clock.beginAcceptedFrame(100);
    clock.dispatchDue();
    expect(requests).toHaveLength(0);
    trigger.accept("press", "key-space");
    clock.beginAcceptedFrame(100);
    clock.dispatchDue();
    expect(requests).toHaveLength(1);
  });

  it("makes stop-first cancel while a completed timer callback remains observable", () => {
    const first = host({
      attackChannelId: "enemy.pattern",
      mode: "hold-repeat",
      initialDelayMs: 0,
      repeatIntervalMs: 50,
    });
    first.trigger.accept("press", "key-space");
    first.trigger.stop();
    first.clock.beginAcceptedFrame(0);
    first.clock.dispatchDue();
    expect(first.requests).toHaveLength(0);

    const second = host({
      attackChannelId: "enemy.pattern",
      mode: "hold-repeat",
      initialDelayMs: 0,
      repeatIntervalMs: 50,
    });
    second.trigger.accept("press", "key-space");
    second.clock.beginAcceptedFrame(0);
    second.clock.dispatchDue();
    second.trigger.stop();
    expect(second.requests).toHaveLength(1);
  });

  it("starts a fresh game instance at idle with sequence zero", () => {
    const first = host({ attackChannelId: "player.primary", mode: "press" });
    first.trigger.accept("press", "key-a");
    first.trigger.dispose();
    const second = host({ attackChannelId: "player.primary", mode: "press" });
    second.trigger.accept("press", "key-a");
    expect(second.requests[0]).toMatchObject({ sequence: 0 });
  });
});
