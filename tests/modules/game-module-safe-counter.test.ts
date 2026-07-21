import { describe, expect, it } from "vitest";

import {
  preflightMonotonicAllocations,
  SafeMonotonicCounterError,
  SafeMonotonicCounterErrorCode,
  SafeMonotonicCounterV1,
} from "../../src/modules/game-module-safe-counter.js";

describe("ADR 0027 safe-monotonic-v1", () => {
  it("allocates zero first and contiguous blocks without holes", () => {
    const counter = new SafeMonotonicCounterV1("event");
    expect(counter.allocate()).toBe(0);
    expect(counter.allocateBlock(3)).toEqual({ base: 1, end: 3 });
    expect(counter.current).toBe(3);
  });

  it("allocates the final legal value and rejects wrap without mutation", () => {
    const counter = new SafeMonotonicCounterV1(
      "generation",
      Number.MAX_SAFE_INTEGER - 1,
    );
    expect(counter.allocate()).toBe(Number.MAX_SAFE_INTEGER);
    expect(() => counter.allocate()).toThrow(SafeMonotonicCounterError);
    expect(counter.current).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("rejects the first oversized block before changing any counter", () => {
    const commit = new SafeMonotonicCounterV1("commit", 9);
    const evidence = new SafeMonotonicCounterV1("evidence", 4);
    const events = new SafeMonotonicCounterV1(
      "events",
      Number.MAX_SAFE_INTEGER - 1,
    );
    try {
      preflightMonotonicAllocations([
        { counter: commit, count: 1 },
        { counter: evidence, count: 1 },
        { counter: events, count: 2 },
      ]);
      throw new Error("expected overflow");
    } catch (error) {
      expect(error).toBeInstanceOf(SafeMonotonicCounterError);
      expect((error as SafeMonotonicCounterError).code).toBe(
        SafeMonotonicCounterErrorCode.exhausted,
      );
    }
    expect(commit.current).toBe(9);
    expect(evidence.current).toBe(4);
    expect(events.current).toBe(Number.MAX_SAFE_INTEGER - 1);
  });
});
