import { describe, expect, it } from "vitest";

import { ScoreLedgerHostV1 } from "../../src/modules/game-module-score-ledger-host.js";
import { SafeMonotonicCounterError } from "../../src/modules/game-module-safe-counter.js";

const hash = (character: string): string => character.repeat(64);

function transaction(
  sourceEvidenceId: string,
  award: number,
  kind: "defeat" | "graze" | "pickup" = "pickup",
) {
  return { sequence: 0, emittedAtMs: 0, sourceEvidenceId, kind, award };
}

function fixture(overrides = {}) {
  let nowMs = 0;
  const host = new ScoreLedgerHostV1({
    duplicateCapacity: 4,
    capacityEvidenceId: hash("a"),
    nowMs: () => nowMs,
    ...overrides,
  });
  return { host, setNowMs: (value: number) => (nowMs = value) };
}

describe("ADR 0028 bounded binary64 score ledger", () => {
  it("preserves a legal fractional 7.5 award without coercion", () => {
    const { host } = fixture();
    expect(
      host.apply(0, transaction("pickup:one", 7.5), {
        maximumAward: 10,
        evidenceId: hash("b"),
      }),
    ).toMatchObject({ total: 7.5, pickupCount: 1, transactionCount: 1 });
  });

  it("adds once in stable router order and retains ordinary binary64 results", () => {
    const { host } = fixture();
    for (const [index, award] of [0.1, 0.2, 0.3].entries())
      host.apply(index, transaction(`pickup:${index}`, award), {
        maximumAward: award,
        evidenceId: hash("b"),
      });
    expect(host.snapshot().total).toBe(0.1 + 0.2 + 0.3);
    expect(host.snapshot().total).not.toBe(0.6);
  });

  it("rejects duplicate evidence and capacity one-over before mutation", () => {
    const { host } = fixture({ duplicateCapacity: 1 });
    const bound = { maximumAward: 5, evidenceId: hash("b") };
    host.apply(0, transaction("defeat:one", 5, "defeat"), bound);
    expect(() =>
      host.apply(1, transaction("defeat:one", 5, "defeat"), bound),
    ).toThrow(/duplicate/);
    expect(() =>
      host.apply(1, transaction("defeat:two", 5, "defeat"), bound),
    ).toThrow(/capacity/);
    expect(host.snapshot()).toMatchObject({ total: 5, defeatCount: 1 });
  });

  it("rejects source-bound and total overflow before score mutation", () => {
    const { host } = fixture();
    expect(() =>
      host.apply(0, transaction("pickup:one", 7.5), {
        maximumAward: 7,
        evidenceId: hash("b"),
      }),
    ).toThrow(/source bound/);
    expect(host.snapshot().total).toBe(0);
    host.apply(0, transaction("pickup:max", Number.MAX_SAFE_INTEGER), {
      maximumAward: Number.MAX_SAFE_INTEGER,
      evidenceId: hash("c"),
    });
    expect(() =>
      host.apply(1, transaction("pickup:over", 0.5), {
        maximumAward: 1,
        evidenceId: hash("d"),
      }),
    ).toThrow(/binary64 range/);
    expect(host.snapshot().total).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("rejects stale router order and revision overflow", () => {
    const { host } = fixture();
    const bound = { maximumAward: 1, evidenceId: hash("b") };
    host.apply(2, transaction("graze:one", 1, "graze"), bound);
    expect(() =>
      host.apply(2, transaction("graze:two", 1, "graze"), bound),
    ).toThrow(/router sequence/);
    const exhausted = fixture({
      lastRevision: Number.MAX_SAFE_INTEGER,
    }).host;
    expect(() =>
      exhausted.apply(0, transaction("pickup:one", 1), bound),
    ).toThrow(SafeMonotonicCounterError);
    expect(exhausted.snapshot().total).toBe(0);
  });

  it("publishes immutable per-kind counters and rejects use after disposal", () => {
    const { host } = fixture();
    const bound = { maximumAward: 2, evidenceId: hash("b") };
    host.apply(0, transaction("defeat:one", 2, "defeat"), bound);
    host.apply(1, transaction("graze:one", 1, "graze"), bound);
    const state = host.apply(2, transaction("pickup:one", 1), bound);
    expect(state).toMatchObject({
      total: 4,
      defeatCount: 1,
      grazeCount: 1,
      pickupCount: 1,
    });
    expect(Object.isFrozen(state)).toBe(true);
    host.dispose();
    expect(() => host.snapshot()).toThrow(/disposed/);
  });
});
