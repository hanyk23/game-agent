export const SafeMonotonicCounterErrorCode = {
  invalidInitialValue: "invalid-initial-value",
  invalidBlockSize: "invalid-block-size",
  exhausted: "counter-exhausted",
} as const;

export class SafeMonotonicCounterError extends Error {
  constructor(
    readonly code: (typeof SafeMonotonicCounterErrorCode)[keyof typeof SafeMonotonicCounterErrorCode],
    readonly counterId: string,
  ) {
    super(`${counterId}: ${code}`);
    this.name = "SafeMonotonicCounterError";
  }
}

/** ADR 0027 safe-monotonic-v1. The stored value is the last allocated value. */
export class SafeMonotonicCounterV1 {
  readonly #counterId: string;
  #current: number;

  constructor(counterId: string, lastAllocated = -1) {
    if (
      counterId.length === 0 ||
      !Number.isSafeInteger(lastAllocated) ||
      lastAllocated < -1
    )
      throw new SafeMonotonicCounterError(
        SafeMonotonicCounterErrorCode.invalidInitialValue,
        counterId,
      );
    this.#counterId = counterId;
    this.#current = lastAllocated;
  }

  get current(): number {
    return this.#current;
  }

  preflightBlock(count: number): Readonly<{ base: number; end: number }> {
    if (!Number.isSafeInteger(count) || count < 1)
      throw new SafeMonotonicCounterError(
        SafeMonotonicCounterErrorCode.invalidBlockSize,
        this.#counterId,
      );
    if (
      this.#current >= Number.MAX_SAFE_INTEGER ||
      count - 1 > Number.MAX_SAFE_INTEGER - (this.#current + 1)
    )
      throw new SafeMonotonicCounterError(
        SafeMonotonicCounterErrorCode.exhausted,
        this.#counterId,
      );
    const base = this.#current + 1;
    return Object.freeze({ base, end: base + count - 1 });
  }

  allocate(): number {
    return this.allocateBlock(1).base;
  }

  allocateBlock(count: number): Readonly<{ base: number; end: number }> {
    const block = this.preflightBlock(count);
    this.#current = block.end;
    return block;
  }
}

export function preflightMonotonicAllocations(
  requests: readonly Readonly<{
    counter: SafeMonotonicCounterV1;
    count: number;
  }>[],
): readonly Readonly<{ base: number; end: number }>[] {
  return Object.freeze(
    requests.map((request) => request.counter.preflightBlock(request.count)),
  );
}
