import { ContactCandidatePayloadSchema } from "./game-module-execution-contract.js";
import type { DeterministicLogicalEntityDirectory } from "./game-module-entity-directory.js";

export const ContactGenerationLedgerErrorCode = {
  invalidCeiling: "invalid-ceiling",
  invalidCandidate: "invalid-candidate",
  ceilingExceeded: "ceiling-exceeded",
  asynchronousPredicate: "asynchronous-predicate",
  leakDetected: "leak-detected",
  destroyed: "destroyed",
} as const;

export type ContactGenerationLedgerErrorCode =
  (typeof ContactGenerationLedgerErrorCode)[keyof typeof ContactGenerationLedgerErrorCode];

export class ContactGenerationLedgerError extends Error {
  constructor(
    readonly code: ContactGenerationLedgerErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ContactGenerationLedgerError";
  }
}

export type ContactGenerationLedgerEntry = Readonly<{
  sourceChannelId: string;
  sourceEntityId: string;
  sourceGeneration: number;
  targetActorId: string;
  firstContactId: string;
  contactSequence: number;
}>;

export type ContactGenerationClaim = Readonly<
  | { status: "accepted"; entry: ContactGenerationLedgerEntry }
  | {
      status: "duplicate";
      entry: ContactGenerationLedgerEntry;
      duplicateContactId: string;
    }
>;

function fail(code: ContactGenerationLedgerErrorCode, message: string): never {
  throw new ContactGenerationLedgerError(code, message);
}

function isThenable(value: unknown): boolean {
  if (
    value === null ||
    (typeof value !== "object" && typeof value !== "function")
  ) {
    return false;
  }
  try {
    return typeof (value as { then?: unknown }).then === "function";
  } catch {
    fail(
      ContactGenerationLedgerErrorCode.asynchronousPredicate,
      "generation activity source exposed an unreadable thenable",
    );
  }
}

function keyOf(entry: {
  sourceChannelId: string;
  sourceEntityId: string;
  sourceGeneration: number;
  targetActorId: string;
}): string {
  return [
    entry.sourceChannelId,
    entry.sourceEntityId,
    String(entry.sourceGeneration),
    entry.targetActorId,
  ]
    .map((part) => `${part.length}:${part}`)
    .join("");
}

export class DeterministicContactGenerationLedger {
  readonly #entries = new Map<string, ContactGenerationLedgerEntry>();
  #destroyed = false;

  constructor(readonly maximumEntries: number) {
    if (
      !Number.isSafeInteger(maximumEntries) ||
      maximumEntries < 0 ||
      maximumEntries > 100_000
    ) {
      fail(
        ContactGenerationLedgerErrorCode.invalidCeiling,
        "maximumEntries must be a safe integer from 0 through 100000",
      );
    }
  }

  claim(candidateInput: unknown): ContactGenerationClaim {
    this.#requireAlive();
    const parsed = ContactCandidatePayloadSchema.safeParse(candidateInput);
    if (!parsed.success) {
      fail(
        ContactGenerationLedgerErrorCode.invalidCandidate,
        `invalid contact candidate: ${parsed.error.message}`,
      );
    }
    const candidate = parsed.data;
    const key = keyOf(candidate);
    const existing = this.#entries.get(key);
    if (existing !== undefined) {
      return Object.freeze({
        status: "duplicate",
        entry: existing,
        duplicateContactId: candidate.contactId,
      });
    }
    if (this.#entries.size >= this.maximumEntries) {
      fail(
        ContactGenerationLedgerErrorCode.ceilingExceeded,
        `contact generation ledger ceiling ${this.maximumEntries} exceeded`,
      );
    }
    const entry = Object.freeze({
      sourceChannelId: candidate.sourceChannelId,
      sourceEntityId: candidate.sourceEntityId,
      sourceGeneration: candidate.sourceGeneration,
      targetActorId: candidate.targetActorId,
      firstContactId: candidate.contactId,
      contactSequence: candidate.contactSequence,
    });
    this.#entries.set(key, entry);
    return Object.freeze({ status: "accepted", entry });
  }

  pruneInactive(
    activitySource: Pick<
      DeterministicLogicalEntityDirectory,
      "isGenerationActive"
    >,
  ): readonly ContactGenerationLedgerEntry[] {
    this.#requireAlive();
    const removals: ContactGenerationLedgerEntry[] = [];
    for (const entry of this.#entries.values()) {
      let active: unknown;
      try {
        active = activitySource.isGenerationActive(
          entry.sourceChannelId,
          entry.sourceEntityId,
          entry.sourceGeneration,
        );
      } catch (error) {
        if (error instanceof ContactGenerationLedgerError) throw error;
        fail(
          ContactGenerationLedgerErrorCode.invalidCandidate,
          `generation activity check failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      if (isThenable(active)) {
        fail(
          ContactGenerationLedgerErrorCode.asynchronousPredicate,
          "generation activity predicate returned a thenable",
        );
      }
      if (typeof active !== "boolean") {
        fail(
          ContactGenerationLedgerErrorCode.invalidCandidate,
          "generation activity source must return a boolean",
        );
      }
      if (!active) removals.push(entry);
    }
    for (const entry of removals) this.#entries.delete(keyOf(entry));
    return Object.freeze(removals);
  }

  assertNoLeaks(): void {
    this.#requireAlive();
    if (this.#entries.size > 0) {
      fail(
        ContactGenerationLedgerErrorCode.leakDetected,
        `contact generation ledger retains ${this.#entries.size} entries`,
      );
    }
  }

  snapshot(): Readonly<{
    maximumEntries: number;
    count: number;
    entries: readonly ContactGenerationLedgerEntry[];
  }> {
    this.#requireAlive();
    return Object.freeze({
      maximumEntries: this.maximumEntries,
      count: this.#entries.size,
      entries: Object.freeze([...this.#entries.values()]),
    });
  }

  destroy(): void {
    this.#requireAlive();
    this.assertNoLeaks();
    this.#destroyed = true;
  }

  #requireAlive(): void {
    if (this.#destroyed) {
      fail(
        ContactGenerationLedgerErrorCode.destroyed,
        "contact generation ledger has been destroyed",
      );
    }
  }
}
