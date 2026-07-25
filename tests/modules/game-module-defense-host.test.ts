import { describe, expect, it, vi } from "vitest";

import { InvulnerabilityWindowHostV1 } from "../../src/modules/game-module-defense-host.js";
import type { DamagePayload } from "../../src/modules/game-module-runtime-payloads.js";

function damage(sequence: number, emittedAtMs: number): DamagePayload {
  return Object.freeze({
    sequence,
    emittedAtMs,
    sourceActorId: "enemy-one",
    targetActorId: "player-one",
    amount: 10,
    damageKind: "projectile",
    contactSequence: sequence,
  });
}

function fixture(durationMs: number) {
  let nowMs = 0;
  const forwarded: DamagePayload[] = [];
  const states: unknown[] = [];
  const results: unknown[] = [];
  const host = new InvulnerabilityWindowHostV1({
    targetActorId: "player-one",
    durationMs,
    acceptedDamageKinds: ["projectile"],
    nowMs: () => nowMs,
    forward: (payload) => forwarded.push(payload),
    publishState: (state) => states.push(state),
    publishResult: (result) => results.push(result),
  });
  host.start();
  return {
    host,
    forwarded,
    states,
    results,
    setNow(value: number) {
      nowMs = value;
    },
  };
}

describe("ADR 0027 invulnerability defense host", () => {
  it("uses a half-open interval so duration zero blocks nothing", () => {
    const { host, forwarded } = fixture(0);
    const first = damage(0, 0);
    const second = damage(1, 0);
    expect(host.accept(first).result).toBe("accepted");
    expect(host.accept(second).result).toBe("accepted");
    expect(forwarded).toEqual([first, second]);
    expect(forwarded[0]).toBe(first);
    expect(host.observe()).toMatchObject({ active: false, current: 0 });
  });

  it("blocks the second same-time event after the first updates the window", () => {
    const { host, forwarded, results } = fixture(100);
    const first = damage(0, 0);
    expect(host.accept(first).result).toBe("accepted");
    expect(host.accept(damage(1, 0)).result).toBe("blocked");
    expect(forwarded).toEqual([first]);
    expect(results).toEqual([
      expect.objectContaining({ sequence: 0, result: "accepted" }),
      expect.objectContaining({ sequence: 1, result: "blocked" }),
    ]);
    expect(host.observe()).toMatchObject({ active: true, current: 100 });
  });

  it("accepts damage at exact expiry and opens the next half-open window", () => {
    const { host, setNow, forwarded } = fixture(100);
    host.accept(damage(0, 0));
    setNow(99);
    expect(host.accept(damage(1, 99)).result).toBe("blocked");
    setNow(100);
    expect(host.accept(damage(2, 100)).result).toBe("accepted");
    expect(host.activeUntilMs).toBe(200);
    expect(forwarded).toHaveLength(2);
  });

  it("retains remaining simulation time across stop/pause and resume", () => {
    const { host, setNow, forwarded } = fixture(100);
    host.accept(damage(0, 0));
    setNow(40);
    host.stop();
    expect(() => host.accept(damage(1, 40))).toThrow("not running");
    host.start();
    expect(host.observe()).toMatchObject({ active: true, current: 60 });
    expect(host.accept(damage(2, 40)).result).toBe("blocked");
    setNow(100);
    expect(host.accept(damage(3, 100)).result).toBe("accepted");
    expect(forwarded).toHaveLength(2);
  });

  it("rejects route bypass, mutable damage, and invalid clock before output", () => {
    let nowMs = 0;
    const forward = vi.fn();
    const host = new InvulnerabilityWindowHostV1({
      targetActorId: "player-one",
      durationMs: 100,
      acceptedDamageKinds: ["projectile"],
      nowMs: () => nowMs,
      forward,
    });
    host.start();
    expect(() => host.accept({ ...damage(0, 0) })).toThrow("immutable");
    expect(() =>
      host.accept(
        Object.freeze({ ...damage(0, 0), targetActorId: "other-player" }),
      ),
    ).toThrow("bypassed");
    nowMs = Number.MAX_SAFE_INTEGER;
    expect(() => host.accept(damage(1, 0))).toThrow("overflow");
    expect(forward).not.toHaveBeenCalled();
  });
});
