import { createHash } from "node:crypto";

import { z } from "zod";

import { canonicalJsonBytes } from "../modules/game-module-execution-contract.js";

/**
 * game-spec-v2 — the open-ended, natural-language requirement contract.
 *
 * Product boundary (see AGENTS.md §架构流水线 and the batch prompt §二/§三):
 *  - GameSpec v2 is NOT a game-parameter table. It is a structured
 *    natural-language "requirement sheet" that records WHAT the user wants,
 *    together with provenance and constraint metadata (held in the companion
 *    IntentLedger v2). It never decides HOW to implement anything.
 *  - The OUTER structure is fixed (four business partitions); the gameplay the
 *    user may express is NOT. We deliberately avoid any closed gameplay enum so
 *    a user can invent a concept this schema never enumerated and still be
 *    accepted as free-form text.
 *  - No numeric/engine parameters live here (no wave timings, bullet counts,
 *    Boss phase thresholds, weapon damage, module ids, asset-query ids …).
 *    Converging natural language into strongly-typed design data is the Design
 *    Agent's job, which this stage does not perform.
 *
 * This module is pure data + deterministic hashing. It calls no model.
 */

export const GAME_SPEC_V2_SCHEMA_VERSION = "2.0.0" as const;

/**
 * The four fixed first-level business partitions. Their meaning is intentionally
 * broad so any game concept fits; only the partition *set* is closed.
 */
export const SPEC_PARTITIONS = [
  // 游戏概念：扮演什么、世界/题材/故事、氛围、横竖屏等表现要求。
  "gameConcept",
  // 玩法意图：玩家主要做什么、移动/瞄准/攻击/躲避、节奏、Boss/wave/pickup 的
  // 明确要求或禁止项、进程意图（有限关卡/限时生存/无限生存/积分挑战…）。
  "gameplayIntent",
  // 平台与操作：PC/手机优先级、键鼠/touch 等操作要求。
  "platformAndControls",
  // 额外硬约束：无法自然归入前三类、但后续必须遵守的约束（语言、内容禁忌、
  // 素材限制、特殊时长限制…），不重复其他分区已记录的内容。
  "additionalConstraints",
] as const;

export const SpecPartitionSchema = z.enum(SPEC_PARTITIONS);
export type SpecPartition = z.infer<typeof SpecPartitionSchema>;

/**
 * A statementId is a stable, unique, human-auditable handle for one requirement.
 * It must be globally unique across all four partitions so the IntentLedger can
 * reference it 1:1. We keep the token engine-neutral (lowercase kebab-case) and
 * NOT semantically loaded — it is an identity, not a gameplay enum.
 */
export const SpecStatementIdSchema = z
  .string()
  .min(3)
  .max(64)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/u,
    "statementId must be a lowercase kebab-case identifier",
  );

/**
 * A single requirement item. The batch prompt requires at minimum a stable
 * unique statementId and one complete, unambiguous, self-contained natural
 * language sentence. We intentionally add NO structured gameplay fields here.
 */
export const SpecStatementSchema = z.strictObject({
  statementId: SpecStatementIdSchema,
  text: z.string().trim().min(1).max(600),
});
export type SpecStatement = z.infer<typeof SpecStatementSchema>;

const StatementArraySchema = z.array(SpecStatementSchema).max(40);

/**
 * Deterministic normalization for the cross-partition duplicate guard (§五):
 * one user requirement may exist as exactly ONE canonical statement, so two
 * statements sharing the same normalized text — whether in the same partition
 * or across partitions — are a schema violation. We normalize with NFKC, trim,
 * and collapse internal whitespace so trivial spacing differences do not slip a
 * literal duplicate through. This is a STRUCTURAL exact-match guard only; it
 * deliberately does NOT try to detect paraphrased/synonymous duplication — that
 * semantic constraint belongs to the Spec Agent prompt and model evaluation, not
 * to brittle keyword rules here.
 */
export function normalizeStatementText(text: string): string {
  return text.normalize("NFKC").trim().replace(/\s+/gu, " ");
}

/**
 * Shared partition walk for the two spec schemas: enforces globally-unique
 * statementIds and globally-unique normalized statement text, and returns the
 * total statement count so each schema can apply its own count guard.
 */
function refineStatementUniqueness(
  spec: {
    gameConcept: SpecStatement[];
    gameplayIntent: SpecStatement[];
    platformAndControls: SpecStatement[];
    additionalConstraints: SpecStatement[];
  },
  context: z.core.$RefinementCtx,
): number {
  const seenIds = new Set<string>();
  const seenTextToId = new Map<string, string>();
  let total = 0;
  for (const partition of SPEC_PARTITIONS) {
    spec[partition].forEach((statement, index) => {
      total += 1;
      if (seenIds.has(statement.statementId)) {
        context.addIssue({
          code: "custom",
          message: `duplicate statementId: ${statement.statementId}`,
          path: [partition, index, "statementId"],
        });
      }
      seenIds.add(statement.statementId);

      const normalizedText = normalizeStatementText(statement.text);
      const priorId = seenTextToId.get(normalizedText);
      if (priorId !== undefined) {
        context.addIssue({
          code: "custom",
          message: `duplicate statement text (already recorded as ${priorId}); one user requirement must have exactly one canonical statement`,
          path: [partition, index, "text"],
        });
      } else {
        seenTextToId.set(normalizedText, statement.statementId);
      }
    });
  }
  return total;
}

/**
 * GameSpec v2 — four partitions, each a list of independent NL requirement
 * items. Partitions may be empty (we never invent content to fill the schema),
 * but the whole spec must carry at least one requirement, every statementId must
 * be globally unique, and no two statements may share the same normalized text.
 */
export const GameSpecV2Schema = z
  .strictObject({
    schemaVersion: z.literal(GAME_SPEC_V2_SCHEMA_VERSION),
    kind: z.literal("GameSpecV2"),
    gameConcept: StatementArraySchema,
    gameplayIntent: StatementArraySchema,
    platformAndControls: StatementArraySchema,
    additionalConstraints: StatementArraySchema,
  })
  .superRefine((spec, context) => {
    const total = refineStatementUniqueness(spec, context);
    if (total === 0) {
      context.addIssue({
        code: "custom",
        message:
          "GameSpec v2 must carry at least one requirement statement across its partitions",
        path: ["gameConcept"],
      });
    }
    if (total > 80) {
      context.addIssue({
        code: "custom",
        message: "GameSpec v2 exceeds the 80-statement ceiling",
        path: ["gameConcept"],
      });
    }
  });

export type GameSpecV2 = z.infer<typeof GameSpecV2Schema>;

/**
 * A partial spec captures only the requirements confirmed so far, used by a
 * needs-clarification outcome. It shares GameSpec v2's exact structure and its
 * uniqueness/ceiling guards, but — unlike a spec-ready GameSpec — it MAY be
 * empty when nothing has been confirmed yet. It never carries invented content.
 */
export const PartialGameSpecV2Schema = z
  .strictObject({
    schemaVersion: z.literal(GAME_SPEC_V2_SCHEMA_VERSION),
    kind: z.literal("PartialGameSpecV2"),
    gameConcept: StatementArraySchema,
    gameplayIntent: StatementArraySchema,
    platformAndControls: StatementArraySchema,
    additionalConstraints: StatementArraySchema,
  })
  .superRefine((spec, context) => {
    const total = refineStatementUniqueness(spec, context);
    if (total > 80) {
      context.addIssue({
        code: "custom",
        message: "partial GameSpec v2 exceeds the 80-statement ceiling",
        path: ["gameConcept"],
      });
    }
  });

export type PartialGameSpecV2 = z.infer<typeof PartialGameSpecV2Schema>;

export function parsePartialGameSpecV2(input: unknown): PartialGameSpecV2 {
  return PartialGameSpecV2Schema.parse(input);
}

export function parseGameSpecV2(input: unknown): GameSpecV2 {
  return GameSpecV2Schema.parse(input);
}

export function validateGameSpecV2(input: unknown) {
  return GameSpecV2Schema.safeParse(input);
}

/** Every statementId in the spec, in partition then array order. */
export function collectStatementIds(spec: GameSpecV2): string[] {
  const ids: string[] = [];
  for (const partition of SPEC_PARTITIONS) {
    for (const statement of spec[partition]) ids.push(statement.statementId);
  }
  return ids;
}

/** The partition a statementId belongs to, or undefined when absent. */
export function partitionOfStatement(
  spec: GameSpecV2,
  statementId: string,
): SpecPartition | undefined {
  for (const partition of SPEC_PARTITIONS) {
    if (spec[partition].some((s) => s.statementId === statementId)) {
      return partition;
    }
  }
  return undefined;
}

/**
 * Canonical (key-sorted) JSON for a validated spec, so the hash is independent
 * of provider key ordering. Mirrors canonicalSpecIntentLedgerJson.
 */
export function canonicalGameSpecV2Json(rawSpec: unknown): string {
  const spec = GameSpecV2Schema.parse(rawSpec);
  return Buffer.from(canonicalJsonBytes(spec)).toString("utf8");
}

export function sha256GameSpecV2(rawSpec: unknown): string {
  return createHash("sha256")
    .update(canonicalJsonBytes(GameSpecV2Schema.parse(rawSpec)))
    .digest("hex");
}

/** Canonical hash for a partial spec (needs-clarification), independent of key order. */
export function sha256PartialGameSpecV2(rawSpec: unknown): string {
  return createHash("sha256")
    .update(canonicalJsonBytes(PartialGameSpecV2Schema.parse(rawSpec)))
    .digest("hex");
}

/** Every statementId in a partial spec, in partition then array order. */
export function collectPartialStatementIds(spec: PartialGameSpecV2): string[] {
  const ids: string[] = [];
  for (const partition of SPEC_PARTITIONS) {
    for (const statement of spec[partition]) ids.push(statement.statementId);
  }
  return ids;
}

export function toGameSpecV2JsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(GameSpecV2Schema, {
    target: "draft-2020-12",
    unrepresentable: "throw",
  }) as Record<string, unknown>;
}
