import type { ActorRootReferenceV1 } from "./game-module-actor-root-custody-host.js";
import type {
  ActorDefeatedPayloadSchema,
  DamagePayloadV2,
  HealthStatePayloadV3,
} from "./game-module-runtime-payloads.js";
import { DamagePayloadV2Schema } from "./game-module-runtime-payloads.js";
import { SafeMonotonicCounterV1 } from "./game-module-safe-counter.js";
import type { z } from "zod";

export type ActorDefeatedPayload = z.infer<typeof ActorDefeatedPayloadSchema>;

type HealthEntry = {
  reference: ActorRootReferenceV1;
  current: number;
  maximum: number;
  defeated: boolean;
};

export type ActorSetHealthTransitionV1 = Readonly<{
  state: HealthStatePayloadV3;
  defeated?: ActorDefeatedPayload;
}>;

/** Bounded generation-keyed health bank for one resolved actor-root channel. */
export class ActorSetHealthBankHostV1 {
  readonly #rootChannelId: string;
  readonly #actorRole: "enemy" | "boss";
  readonly #capacity: number;
  readonly #maximumBySourceId: ReadonlyMap<string, number>;
  readonly #nowMs: () => number;
  readonly #entries = new Map<string, HealthEntry>();
  readonly #revision: SafeMonotonicCounterV1;
  readonly #eventSequence: SafeMonotonicCounterV1;
  #lastTimeMs = -1;
  #disposed = false;

  constructor(
    input: Readonly<{
      rootChannelId: string;
      actorRole: "enemy" | "boss";
      capacity: number;
      maximumHealthBySourceId: Readonly<Record<string, number>>;
      nowMs(): number;
      lastRevision?: number;
      lastEventSequence?: number;
    }>,
  ) {
    const healthEntries = Object.entries(input.maximumHealthBySourceId);
    if (
      !/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(input.rootChannelId) ||
      !Number.isSafeInteger(input.capacity) ||
      input.capacity < 1 ||
      input.capacity > 10_000 ||
      healthEntries.length === 0 ||
      healthEntries.length > 1_000 ||
      healthEntries.some(
        ([sourceId, maximum]) =>
          !/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(sourceId) ||
          !Number.isFinite(maximum) ||
          maximum <= 0 ||
          maximum > Number.MAX_SAFE_INTEGER,
      )
    )
      throw new Error("invalid actor-set health configuration");
    this.#rootChannelId = input.rootChannelId;
    this.#actorRole = input.actorRole;
    this.#capacity = input.capacity;
    this.#maximumBySourceId = new Map(healthEntries);
    this.#nowMs = input.nowMs;
    this.#revision = new SafeMonotonicCounterV1(
      `${input.rootChannelId}.health-revision`,
      input.lastRevision ?? -1,
    );
    this.#eventSequence = new SafeMonotonicCounterV1(
      `${input.rootChannelId}.health-event`,
      input.lastEventSequence ?? -1,
    );
  }

  activate(reference: ActorRootReferenceV1): HealthStatePayloadV3 {
    this.#requireAlive();
    this.#validateReference(reference);
    const key = this.#key(reference);
    if (this.#entries.has(key))
      throw new Error("duplicate actor health generation");
    if (this.#entries.size >= this.#capacity)
      throw new Error("actor-set health capacity exhausted");
    const maximum = this.#maximumBySourceId.get(reference.sourceId);
    if (maximum === undefined)
      throw new Error("unknown actor-root health source");
    const nowMs = this.#readNow();
    this.#revision.preflightBlock(1);
    const entry: HealthEntry = {
      reference,
      current: maximum,
      maximum,
      defeated: false,
    };
    this.#entries.set(key, entry);
    return this.#state(entry, "initialized", nowMs);
  }

  damage(payloadInput: DamagePayloadV2): ActorSetHealthTransitionV1 {
    this.#requireAlive();
    const payload = DamagePayloadV2Schema.parse(payloadInput);
    const entry = this.#entries.get(
      `${payload.targetActorId}@${payload.targetActorGeneration}`,
    );
    if (
      entry === undefined ||
      payload.targetRootChannelId !== this.#rootChannelId ||
      entry.reference.rootChannelId !== payload.targetRootChannelId ||
      entry.defeated
    )
      throw new Error("damage targets an inactive, stale, or depleted root");
    const nowMs = this.#readNow();
    const next = Math.max(0, entry.current - payload.amount);
    const depleted = next <= 0;
    this.#revision.preflightBlock(1);
    if (depleted) this.#eventSequence.preflightBlock(1);
    entry.current = next;
    entry.defeated = depleted;
    const state = this.#state(entry, depleted ? "depleted" : "damaged", nowMs);
    if (!depleted) return Object.freeze({ state });
    const sequence = this.#eventSequence.allocate();
    return Object.freeze({
      state,
      defeated: Object.freeze({
        sequence,
        emittedAtMs: nowMs,
        rootChannelId: entry.reference.rootChannelId,
        actorId: entry.reference.actorId,
        actorGeneration: entry.reference.actorGeneration,
        actorRole: entry.reference.actorRole,
        sourceId: entry.reference.sourceId,
        healthEvidenceId: `health:${entry.reference.actorId}:${entry.reference.actorGeneration}`,
      }),
    });
  }

  prune(reference: ActorRootReferenceV1): void {
    this.#requireAlive();
    const key = this.#key(reference);
    const entry = this.#entries.get(key);
    if (
      entry === undefined ||
      entry.reference.rootChannelId !== reference.rootChannelId
    )
      throw new Error("cannot prune inactive or stale actor health");
    this.#entries.delete(key);
  }

  snapshot(): Readonly<{
    entries: readonly Readonly<{
      reference: ActorRootReferenceV1;
      current: number;
      maximum: number;
      defeated: boolean;
    }>[];
  }> {
    this.#requireAlive();
    return Object.freeze({
      entries: Object.freeze(
        [...this.#entries.values()]
          .sort(
            (left, right) =>
              left.reference.actorId.localeCompare(right.reference.actorId) ||
              left.reference.actorGeneration - right.reference.actorGeneration,
          )
          .map((entry) =>
            Object.freeze({
              reference: entry.reference,
              current: entry.current,
              maximum: entry.maximum,
              defeated: entry.defeated,
            }),
          ),
      ),
    });
  }

  dispose(): void {
    this.#requireAlive();
    if (this.#entries.size > 0)
      throw new Error("actor-set health retains active generations");
    this.#disposed = true;
  }

  #state(
    entry: HealthEntry,
    reason: HealthStatePayloadV3["reason"],
    emittedAtMs: number,
  ): HealthStatePayloadV3 {
    return Object.freeze({
      revision: this.#revision.allocate(),
      emittedAtMs,
      rootChannelId: entry.reference.rootChannelId,
      actorId: entry.reference.actorId,
      actorGeneration: entry.reference.actorGeneration,
      actorRole: entry.reference.actorRole,
      sourceId: entry.reference.sourceId,
      current: entry.current,
      maximum: entry.maximum,
      ratio: entry.current / entry.maximum,
      reason,
    });
  }

  #validateReference(reference: ActorRootReferenceV1): void {
    if (
      reference.rootChannelId !== this.#rootChannelId ||
      reference.actorRole !== this.#actorRole
    )
      throw new Error("actor-root health lineage mismatch");
  }

  #key(reference: ActorRootReferenceV1): string {
    return `${reference.actorId}@${reference.actorGeneration}`;
  }

  #readNow(): number {
    const nowMs = this.#nowMs();
    if (!Number.isSafeInteger(nowMs) || nowMs < 0 || nowMs < this.#lastTimeMs)
      throw new Error("actor-set health clock is invalid or non-monotonic");
    this.#lastTimeMs = nowMs;
    return nowMs;
  }

  #requireAlive(): void {
    if (this.#disposed) throw new Error("actor-set health host is disposed");
  }
}
