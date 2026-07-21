import type {
  RuntimeAssetSnapshot,
  RuntimeAssets,
  RuntimeBudgetSnapshot,
  RuntimeBudgets,
  RuntimeEventBus,
} from "./contracts.js";

export class DeterministicRuntimeBudgets implements RuntimeBudgets {
  private readonly peaks = new Map<string, number>();
  private readonly currents = new Map<string, number>();

  constructor(private readonly limits: Readonly<Record<string, number>>) {
    for (const [key, value] of Object.entries(limits)) {
      if (!Number.isInteger(value) || value < 0) {
        throw new Error(`Invalid runtime budget: ${key}`);
      }
    }
  }

  limitFor(key: string): number {
    const limit = this.limits[key];
    if (limit === undefined) throw new Error(`Unknown runtime budget: ${key}`);
    return limit;
  }

  observe(key: string, current: number): void {
    const limit = this.limitFor(key);
    if (!Number.isInteger(current) || current < 0 || current > limit) {
      throw new Error(`Runtime budget exceeded: ${key} (${current}/${limit})`);
    }
    this.currents.set(key, current);
    this.peaks.set(key, Math.max(this.peaks.get(key) ?? 0, current));
  }

  snapshot(key: string): RuntimeBudgetSnapshot {
    return Object.freeze({
      limit: this.limitFor(key),
      current: this.currents.get(key) ?? 0,
      peak: this.peaks.get(key) ?? 0,
    });
  }
}

export class DeterministicRuntimeEventBus<
  TEvents extends Record<string, unknown> = Record<string, unknown>,
> implements RuntimeEventBus<TEvents> {
  private readonly listeners = new Map<
    keyof TEvents,
    Set<(payload: never) => void>
  >();

  emit<TKey extends keyof TEvents>(event: TKey, payload: TEvents[TKey]): void {
    for (const listener of [...(this.listeners.get(event) ?? [])]) {
      listener(payload as never);
    }
  }

  on<TKey extends keyof TEvents>(
    event: TKey,
    listener: (payload: TEvents[TKey]) => void,
  ): () => void {
    const listeners = this.listeners.get(event) ?? new Set();
    listeners.add(listener as (payload: never) => void);
    this.listeners.set(event, listeners);
    return () => listeners.delete(listener as (payload: never) => void);
  }
}

export class RuntimeAssetLedger implements RuntimeAssets {
  private readonly expected: readonly string[];
  private readonly used = new Set<string>();

  constructor(
    expectedTextureKeys: readonly string[],
    private readonly textureExists: (textureKey: string) => boolean,
  ) {
    this.expected = Object.freeze([...new Set(expectedTextureKeys)]);
  }

  markUsed(textureKey: string): void {
    if (!this.expected.includes(textureKey)) return;
    this.used.add(textureKey);
  }

  snapshot(): RuntimeAssetSnapshot {
    return Object.freeze({
      expectedTextureKeys: this.expected,
      loadedTextureKeys: Object.freeze(
        this.expected.filter((textureKey) => this.textureExists(textureKey)),
      ),
      usedTextureKeys: Object.freeze([...this.used].sort()),
    });
  }
}
