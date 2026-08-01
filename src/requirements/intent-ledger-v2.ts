import { createHash } from "node:crypto";

import { z } from "zod";

import { canonicalJsonBytes } from "../modules/game-module-execution-contract.js";
import {
  collectPartialStatementIds,
  collectStatementIds,
  GameSpecV2Schema,
  PartialGameSpecV2Schema,
  sha256GameSpecV2,
  sha256PartialGameSpecV2,
  SPEC_PARTITIONS,
  SpecStatementIdSchema,
  type GameSpecV2,
  type PartialGameSpecV2,
} from "./game-spec-v2.js";
import {
  isSystemDefaultRuleId,
  normalizeRuleText,
  systemDefaultRule,
} from "./system-default-rules.js";

/**
 * intent-ledger-v2 — the provenance/constraint ledger for GameSpec v2.
 *
 * Purpose (batch prompt §四): every GameSpec v2 statement carries exactly one
 * ledger record describing WHO wanted it (source), HOW binding it is (strength),
 * whether it is frozen (locked), how sure we are (confidence) and the checkable
 * evidence behind it. This ledger reuses the OLD ledger's Request-hash /
 * Spec-hash / deterministic-verification / tamper-resistance *ideas*, but NOT
 * its Boss/wave/health business rules — those do not belong to an open-ended
 * requirement contract.
 *
 * Critical boundary (§四 rule 8): the deterministic code here NEVER re-derives
 * gameplay semantics with keyword regexes. Semantic understanding belongs to the
 * Spec Agent (model). This module only verifies STRUCTURE, EVIDENCE and
 * REFERENCE integrity: schema shape, source/strength/locked consistency,
 * verbatim user-quote presence, 1:1 statementId coverage, and the SHA-256
 * bindings to the original Request and the GameSpec.
 */

export const INTENT_LEDGER_V2_SCHEMA_VERSION = "2.0.0" as const;

const Sha256Schema = z
  .string()
  .regex(/^[0-9a-f]{64}$/u, "must be a lowercase SHA-256 hex digest");

const RuleIdSchema = z
  .string()
  .min(3)
  .max(64)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/u,
    "ruleId must be a lowercase kebab-case identifier",
  );

/** Who is responsible for a statement. */
export const INTENT_SOURCES = [
  "user-declared",
  "system-default",
  "agent-inferred",
] as const;
export const IntentSourceSchema = z.enum(INTENT_SOURCES);
export type IntentSource = z.infer<typeof IntentSourceSchema>;

/** How binding the statement is on downstream Agents. */
export const INTENT_STRENGTHS = [
  "required",
  "preferred",
  "forbidden",
  "unresolved",
] as const;
export const IntentStrengthSchema = z.enum(INTENT_STRENGTHS);
export type IntentStrength = z.infer<typeof IntentStrengthSchema>;

const ConfidenceSchema = z.number().min(0).max(1);

/**
 * A user-declared quote. The deterministic verifier later checks it is a
 * verbatim (NFKC-normalized) substring of the original request, so the record
 * cannot fabricate a user requirement.
 */
const UserQuoteSchema = z.string().trim().min(1).max(400);

/**
 * Ledger entry, discriminated by source so each source carries exactly the
 * evidence it must. All six required fields (statementId, source, strength,
 * locked, confidence, evidence) are present on every variant.
 */
const UserDeclaredEntrySchema = z
  .strictObject({
    statementId: SpecStatementIdSchema,
    source: z.literal("user-declared"),
    strength: IntentStrengthSchema,
    locked: z.boolean(),
    confidence: ConfidenceSchema,
    // Rule 1: user-declared must carry checkable original-text evidence.
    evidence: z.strictObject({
      quotes: z.array(UserQuoteSchema).min(1).max(6),
    }),
  })
  .superRefine((entry, context) => {
    // Rule 4: user-declared required/forbidden statements must be locked.
    if (
      (entry.strength === "required" || entry.strength === "forbidden") &&
      !entry.locked
    ) {
      context.addIssue({
        code: "custom",
        message:
          "user-declared required/forbidden statements must be locked so later Agents cannot override them",
        path: ["locked"],
      });
    }
    // A user-declared statement is, by definition, resolved.
    if (entry.strength === "unresolved") {
      context.addIssue({
        code: "custom",
        message: "user-declared statements cannot have unresolved strength",
        path: ["strength"],
      });
    }
  });

const SystemDefaultEntrySchema = z.strictObject({
  statementId: SpecStatementIdSchema,
  source: z.literal("system-default"),
  strength: IntentStrengthSchema,
  locked: z.boolean(),
  confidence: ConfidenceSchema,
  // Rule 2: system-default must carry a stable ruleId.
  evidence: z.strictObject({
    ruleId: RuleIdSchema,
    note: z.string().trim().min(1).max(400).optional(),
  }),
});

const AgentInferredEntrySchema = z
  .strictObject({
    statementId: SpecStatementIdSchema,
    source: z.literal("agent-inferred"),
    strength: IntentStrengthSchema,
    // Rule 3: agent-inferred must be unlocked.
    locked: z.literal(false),
    confidence: ConfidenceSchema,
    evidence: z.strictObject({
      rationale: z.string().trim().min(1).max(400),
    }),
  })
  .superRefine((entry, context) => {
    // Rule 3 (cont.): an inference is never a user's explicit requirement, so it
    // must not masquerade as a hard "required" demand attributed to the user.
    if (entry.strength === "required" || entry.strength === "forbidden") {
      context.addIssue({
        code: "custom",
        message:
          "agent-inferred statements may only be preferred or unresolved, never required/forbidden",
        path: ["strength"],
      });
    }
  });

export const IntentLedgerV2EntrySchema = z.discriminatedUnion("source", [
  UserDeclaredEntrySchema,
  SystemDefaultEntrySchema,
  AgentInferredEntrySchema,
]);
export type IntentLedgerV2Entry = z.infer<typeof IntentLedgerV2EntrySchema>;

export const IntentLedgerV2Schema = z
  .strictObject({
    schemaVersion: z.literal(INTENT_LEDGER_V2_SCHEMA_VERSION),
    kind: z.literal("IntentLedgerV2"),
    scope: z.literal("open-requirement-provenance-v2"),
    request: z.strictObject({
      language: z.literal("zh-CN"),
      normalization: z.literal("NFKC"),
      sha256: Sha256Schema,
    }),
    gameSpec: z.strictObject({
      schemaVersion: z.literal("2.0.0"),
      sha256: Sha256Schema,
    }),
    entries: z.array(IntentLedgerV2EntrySchema).min(1).max(80),
  })
  .superRefine((ledger, context) => {
    const seen = new Set<string>();
    ledger.entries.forEach((entry, index) => {
      if (seen.has(entry.statementId)) {
        context.addIssue({
          code: "custom",
          message: `duplicate ledger statementId: ${entry.statementId}`,
          path: ["entries", index, "statementId"],
        });
      }
      seen.add(entry.statementId);
    });
  });

export type IntentLedgerV2 = z.infer<typeof IntentLedgerV2Schema>;

/**
 * The partial provenance ledger for a needs-clarification outcome (batch prompt
 * §四). It mirrors IntentLedgerV2 exactly EXCEPT:
 *   - `kind` / `scope` name it a partial ledger,
 *   - it binds to the PARTIAL spec hash (partialSpec.sha256),
 *   - `entries` MAY be empty, so an empty partialSpec has a legal, hash-bound
 *     empty ledger rather than no ledger at all.
 * Every confirmed statement still carries a full provenance record with the same
 * per-source rules (user-declared quotes, locked required/forbidden, etc.).
 */
export const PartialIntentLedgerV2Schema = z
  .strictObject({
    schemaVersion: z.literal(INTENT_LEDGER_V2_SCHEMA_VERSION),
    kind: z.literal("PartialIntentLedgerV2"),
    scope: z.literal("open-requirement-provenance-v2-partial"),
    request: z.strictObject({
      language: z.literal("zh-CN"),
      normalization: z.literal("NFKC"),
      sha256: Sha256Schema,
    }),
    partialSpec: z.strictObject({
      schemaVersion: z.literal("2.0.0"),
      sha256: Sha256Schema,
    }),
    entries: z.array(IntentLedgerV2EntrySchema).max(80),
  })
  .superRefine((ledger, context) => {
    const seen = new Set<string>();
    ledger.entries.forEach((entry, index) => {
      if (seen.has(entry.statementId)) {
        context.addIssue({
          code: "custom",
          message: `duplicate partial ledger statementId: ${entry.statementId}`,
          path: ["entries", index, "statementId"],
        });
      }
      seen.add(entry.statementId);
    });
  });

export type PartialIntentLedgerV2 = z.infer<typeof PartialIntentLedgerV2Schema>;

export type IntentLedgerV2Request = Readonly<{
  language: "zh-CN";
  prompt: string;
}>;

export class IntentLedgerV2Error extends Error {
  constructor(
    readonly code:
      | "schema"
      | "request-hash-mismatch"
      | "spec-hash-mismatch"
      | "statement-coverage"
      | "evidence-mismatch"
      | "unknown-rule"
      | "rule-text-mismatch",
    message: string,
    options?: ErrorOptions,
  ) {
    super(`IntentLedger v2 ${code}: ${message}`, options);
    this.name = "IntentLedgerV2Error";
  }
}

function sha256Utf8(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function normalize(value: string): string {
  return value.normalize("NFKC");
}

export function parseIntentLedgerV2(input: unknown): IntentLedgerV2 {
  try {
    return IntentLedgerV2Schema.parse(input);
  } catch (error) {
    throw new IntentLedgerV2Error(
      "schema",
      error instanceof Error ? error.message : "invalid ledger shape",
      { cause: error },
    );
  }
}

export function canonicalIntentLedgerV2Json(rawLedger: unknown): string {
  return Buffer.from(
    canonicalJsonBytes(IntentLedgerV2Schema.parse(rawLedger)),
  ).toString("utf8");
}

export function sha256IntentLedgerV2(rawLedger: unknown): string {
  return createHash("sha256")
    .update(canonicalJsonBytes(IntentLedgerV2Schema.parse(rawLedger)))
    .digest("hex");
}

export function parsePartialIntentLedgerV2(
  input: unknown,
): PartialIntentLedgerV2 {
  try {
    return PartialIntentLedgerV2Schema.parse(input);
  } catch (error) {
    throw new IntentLedgerV2Error(
      "schema",
      error instanceof Error ? error.message : "invalid partial ledger shape",
      { cause: error },
    );
  }
}

export function sha256PartialIntentLedgerV2(rawLedger: unknown): string {
  return createHash("sha256")
    .update(canonicalJsonBytes(PartialIntentLedgerV2Schema.parse(rawLedger)))
    .digest("hex");
}

/**
 * Shared, engine-neutral evidence/reference checks reused by both the full and
 * partial verifiers. These are STRUCTURAL only (verbatim quotes, registered
 * ruleId + matching text, exact 1:1 coverage). They never reason about gameplay.
 */
function verifyStatementCoverage(
  statementIds: readonly string[],
  entries: ReadonlyArray<{ statementId: string }>,
): void {
  const specIdSet = new Set(statementIds);
  const ledgerIds = entries.map((entry) => entry.statementId);
  const ledgerIdSet = new Set(ledgerIds);
  const missing = statementIds.filter((id) => !ledgerIdSet.has(id));
  const dangling = ledgerIds.filter((id) => !specIdSet.has(id));
  if (missing.length > 0) {
    throw new IntentLedgerV2Error(
      "statement-coverage",
      `spec statements without a ledger record: ${missing.join(", ")}`,
    );
  }
  if (dangling.length > 0) {
    throw new IntentLedgerV2Error(
      "statement-coverage",
      `ledger records referencing unknown statements: ${dangling.join(", ")}`,
    );
  }
}

function verifyUserDeclaredQuotes(
  entries: readonly IntentLedgerV2Entry[],
  prompt: string,
): void {
  const normalizedPrompt = normalize(prompt);
  for (const entry of entries) {
    if (entry.source !== "user-declared") continue;
    for (const quote of entry.evidence.quotes) {
      if (!normalizedPrompt.includes(normalize(quote))) {
        throw new IntentLedgerV2Error(
          "evidence-mismatch",
          `user-declared quote for ${entry.statementId} is not present in the request: ${JSON.stringify(
            quote,
          )}`,
        );
      }
    }
  }
}

function verifySystemDefaultEntries(
  entries: readonly IntentLedgerV2Entry[],
  statementTextById: ReadonlyMap<string, string>,
): void {
  for (const entry of entries) {
    if (entry.source !== "system-default") continue;
    const { ruleId } = entry.evidence;
    if (!isSystemDefaultRuleId(ruleId)) {
      throw new IntentLedgerV2Error(
        "unknown-rule",
        `system-default entry for ${entry.statementId} cites an unregistered ruleId: ${JSON.stringify(
          ruleId,
        )}`,
      );
    }
    const rule = systemDefaultRule(ruleId)!;
    const statementText = statementTextById.get(entry.statementId)!;
    if (normalizeRuleText(statementText) !== normalizeRuleText(rule.text)) {
      throw new IntentLedgerV2Error(
        "rule-text-mismatch",
        `system-default statement ${entry.statementId} text does not match the authoritative rule ${ruleId}`,
      );
    }
  }
}

/**
 * The deterministic verifier. It proves — WITHOUT any semantic gameplay
 * reasoning — that the ledger is a faithful, tamper-evident provenance record
 * for THIS request and THIS spec:
 *   - schema shape and per-source rules (locked/strength/evidence),
 *   - the raw Request SHA-256 binding,
 *   - the canonical GameSpec SHA-256 binding,
 *   - exact 1:1 statementId coverage with the spec (no missing/extra/dangling),
 *   - every user-declared quote is a verbatim substring of the request,
 *   - every system-default entry cites a registered ruleId with matching text.
 * Returns the parsed ledger on success; throws a structured error otherwise.
 */
export function verifyIntentLedgerV2(
  rawRequest: IntentLedgerV2Request,
  rawSpec: unknown,
  rawLedger: unknown,
): IntentLedgerV2 {
  const request = z
    .strictObject({
      language: z.literal("zh-CN"),
      prompt: z.string().min(1).max(8_000),
    })
    .parse(rawRequest);
  const spec: GameSpecV2 = GameSpecV2Schema.parse(rawSpec);
  const ledger = parseIntentLedgerV2(rawLedger);

  // Rule 5: Request SHA-256 binding (over the raw, unnormalized prompt).
  const expectedRequestHash = sha256Utf8(request.prompt);
  if (ledger.request.sha256 !== expectedRequestHash) {
    throw new IntentLedgerV2Error(
      "request-hash-mismatch",
      "ledger request.sha256 does not match the original request digest",
    );
  }

  // Rule 5: GameSpec SHA-256 binding (over the canonical spec bytes).
  const expectedSpecHash = sha256GameSpecV2(spec);
  if (ledger.gameSpec.sha256 !== expectedSpecHash) {
    throw new IntentLedgerV2Error(
      "spec-hash-mismatch",
      "ledger gameSpec.sha256 does not match the GameSpec v2 digest",
    );
  }

  // Rule 6: exact 1:1 statementId coverage between spec and ledger.
  verifyStatementCoverage(collectStatementIds(spec), ledger.entries);

  // Rule 1: every user-declared quote is a verbatim substring of the request.
  verifyUserDeclaredQuotes(ledger.entries, request.prompt);

  // §二: system-default entries may cite ONLY a registered ruleId, and the
  // covered GameSpec statement text must match the authoritative registry.
  const statementTextById = new Map<string, string>();
  for (const partition of SPEC_PARTITIONS) {
    for (const statement of spec[partition]) {
      statementTextById.set(statement.statementId, statement.text);
    }
  }
  verifySystemDefaultEntries(ledger.entries, statementTextById);

  return ledger;
}

/**
 * The deterministic verifier for a needs-clarification PARTIAL ledger (batch
 * prompt §四). Same structural guarantees as the full verifier, bound instead to
 * the partial spec: request-hash binding, partialSpec-hash binding, exact 1:1
 * coverage with the partial spec's statements (which MAY be empty), verbatim
 * user-declared quotes, and registered system-default rules. Returns the parsed
 * partial ledger on success; throws a structured error otherwise.
 */
export function verifyPartialIntentLedgerV2(
  rawRequest: IntentLedgerV2Request,
  rawPartialSpec: unknown,
  rawLedger: unknown,
): PartialIntentLedgerV2 {
  const request = z
    .strictObject({
      language: z.literal("zh-CN"),
      prompt: z.string().min(1).max(8_000),
    })
    .parse(rawRequest);
  const spec: PartialGameSpecV2 = PartialGameSpecV2Schema.parse(rawPartialSpec);
  const ledger = parsePartialIntentLedgerV2(rawLedger);

  const expectedRequestHash = sha256Utf8(request.prompt);
  if (ledger.request.sha256 !== expectedRequestHash) {
    throw new IntentLedgerV2Error(
      "request-hash-mismatch",
      "partial ledger request.sha256 does not match the original request digest",
    );
  }

  const expectedSpecHash = sha256PartialGameSpecV2(spec);
  if (ledger.partialSpec.sha256 !== expectedSpecHash) {
    throw new IntentLedgerV2Error(
      "spec-hash-mismatch",
      "partial ledger partialSpec.sha256 does not match the partial GameSpec v2 digest",
    );
  }

  verifyStatementCoverage(collectPartialStatementIds(spec), ledger.entries);
  verifyUserDeclaredQuotes(ledger.entries, request.prompt);

  const statementTextById = new Map<string, string>();
  for (const partition of SPEC_PARTITIONS) {
    for (const statement of spec[partition]) {
      statementTextById.set(statement.statementId, statement.text);
    }
  }
  verifySystemDefaultEntries(ledger.entries, statementTextById);

  return ledger;
}
