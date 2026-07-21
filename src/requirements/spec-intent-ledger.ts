import { createHash } from "node:crypto";

import { z } from "zod";

import {
  parseShooterGameSpec,
  type ShooterGameSpec,
} from "./shooter-game-spec.js";
import { sha256CompletedShooterGameSpec } from "./spec-completion-policy.js";

const Sha256Schema = z.string().regex(/^[0-9a-f]{64}$/u);
const SafeIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u);

const IntentIdSchema = z.enum([
  "target-desktop-browser",
  "target-mobile-browser",
  "enemy-wave-count",
  "enemy-role-small-fighter",
  "enemy-role-asteroid",
  "enemy-role-aimed-formation",
  "difficulty",
  "pickup-shield",
  "pickup-firepower",
  "boss-victory",
  "player-max-health",
]);

const RequestEvidenceSchema = z.strictObject({
  quote: z.string().min(1).max(160),
  startUtf16: z.number().int().min(0).max(2_000),
  endUtf16: z.number().int().positive().max(2_000),
});

const SpecBindingSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("control-surface"),
    surface: z.enum(["keyboard", "touch"]),
    specPath: z.enum(["/controls/keyboard", "/controls/touch"]),
  }),
  z.strictObject({
    kind: z.literal("wave-count"),
    specPath: z.literal("/enemyWaves"),
    value: z.number().int().min(1).max(20),
  }),
  z.strictObject({
    kind: z.literal("enemy-role"),
    role: z.enum(["small-fighter", "asteroid", "aimed-formation"]),
    waveId: SafeIdSchema,
    assetQueryId: SafeIdSchema,
  }),
  z.strictObject({
    kind: z.literal("difficulty"),
    specPath: z.literal("/difficulty"),
    value: z.enum(["easy", "medium", "hard"]),
  }),
  z.strictObject({
    kind: z.literal("pickup-effect"),
    effect: z.enum(["heal", "weaponPower", "shield", "scoreBonus"]),
    pickupId: SafeIdSchema,
  }),
  z.strictObject({
    kind: z.literal("win-condition"),
    specPath: z.literal("/winCondition/type"),
    value: z.enum(["bossDefeated", "surviveMs", "scoreReached"]),
  }),
  z.strictObject({
    kind: z.literal("player-max-health"),
    specPath: z.literal("/player/maxHealth"),
    value: z.number().int().min(1).max(20),
  }),
]);

const IntentEntrySchema = z
  .strictObject({
    intentId: IntentIdSchema,
    ownership: z.enum(["user-locked", "agent-choice"]),
    requestEvidence: z.array(RequestEvidenceSchema).max(4),
    reasonCode: z
      .enum(["explicit-request", "not-stated-in-request"])
      .optional(),
    specBinding: SpecBindingSchema,
  })
  .superRefine((entry, context) => {
    const expectedBindingKind = {
      "target-desktop-browser": "control-surface",
      "target-mobile-browser": "control-surface",
      "enemy-wave-count": "wave-count",
      "enemy-role-small-fighter": "enemy-role",
      "enemy-role-asteroid": "enemy-role",
      "enemy-role-aimed-formation": "enemy-role",
      difficulty: "difficulty",
      "pickup-shield": "pickup-effect",
      "pickup-firepower": "pickup-effect",
      "boss-victory": "win-condition",
      "player-max-health": "player-max-health",
    } as const;
    if (entry.specBinding.kind !== expectedBindingKind[entry.intentId]) {
      context.addIssue({
        code: "custom",
        path: ["specBinding", "kind"],
        message: `${entry.intentId} requires ${expectedBindingKind[entry.intentId]}`,
      });
    }
    if (entry.ownership === "user-locked") {
      if (
        entry.requestEvidence.length === 0 ||
        entry.reasonCode !== "explicit-request"
      ) {
        context.addIssue({
          code: "custom",
          path: ["requestEvidence"],
          message: "user-locked intent requires explicit request evidence",
        });
      }
    } else if (
      entry.intentId !== "player-max-health" ||
      entry.requestEvidence.length !== 0 ||
      entry.reasonCode !== "not-stated-in-request"
    ) {
      context.addIssue({
        code: "custom",
        path: ["ownership"],
        message:
          "SpecIntentLedger 1.0.0 permits Agent ownership only for unstated player max health",
      });
    }
  });

export const SpecIntentLedgerSchema = z
  .strictObject({
    schemaVersion: z.literal("1.0.0"),
    policyId: z.literal("zh-cn-playability-intent-v1"),
    scope: z.literal("playability-provenance-v1"),
    request: z.strictObject({
      language: z.literal("zh-CN"),
      normalization: z.literal("NFKC"),
      sha256: Sha256Schema,
      normalizedSha256: Sha256Schema,
    }),
    sourceSpec: z.strictObject({
      schemaVersion: z.literal("1.0.0"),
      sha256: Sha256Schema,
    }),
    entries: z.array(IntentEntrySchema).min(1).max(16),
  })
  .superRefine((ledger, context) => {
    const seen = new Set<string>();
    ledger.entries.forEach((entry, index) => {
      if (seen.has(entry.intentId)) {
        context.addIssue({
          code: "custom",
          path: ["entries", index, "intentId"],
          message: `duplicate intent: ${entry.intentId}`,
        });
      }
      seen.add(entry.intentId);
    });
  });

export type SpecIntentLedger = z.infer<typeof SpecIntentLedgerSchema>;
export type SpecIntentEntry = z.infer<typeof IntentEntrySchema>;

export type SpecIntentRequest = Readonly<{
  language: "zh-CN";
  prompt: string;
}>;

type RequestEvidence = z.infer<typeof RequestEvidenceSchema>;
type EnemyRole = Extract<
  SpecIntentEntry["specBinding"],
  { kind: "enemy-role" }
>["role"];

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function canonicalSpecIntentLedgerJson(rawLedger: unknown): string {
  return `${JSON.stringify(SpecIntentLedgerSchema.parse(rawLedger), null, 2)}\n`;
}

export function sha256SpecIntentLedger(rawLedger: unknown): string {
  return sha256(canonicalSpecIntentLedgerJson(rawLedger));
}

function normalize(value: string): string {
  return value.normalize("NFKC");
}

function evidenceAt(
  normalizedPrompt: string,
  startUtf16: number,
  quote: string,
): RequestEvidence {
  const endUtf16 = startUtf16 + quote.length;
  if (normalizedPrompt.slice(startUtf16, endUtf16) !== quote) {
    throw new SpecIntentLedgerError(
      "binding-mismatch",
      "Request evidence does not match its normalized source span.",
    );
  }
  return { quote, startUtf16, endUtf16 };
}

function literalEvidence(
  normalizedPrompt: string,
  literal: string,
  intentId: string,
): RequestEvidence[] {
  const matches: RequestEvidence[] = [];
  let offset = 0;
  while (offset <= normalizedPrompt.length - literal.length) {
    const index = normalizedPrompt.indexOf(literal, offset);
    if (index < 0) break;
    matches.push(evidenceAt(normalizedPrompt, index, literal));
    offset = index + literal.length;
  }
  if (matches.length > 1) {
    throw new SpecIntentLedgerError(
      "ambiguous-intent",
      `Intent ${intentId} has more than one request evidence span.`,
    );
  }
  return matches;
}

function userEntry(
  intentId: SpecIntentEntry["intentId"],
  requestEvidence: RequestEvidence[],
  specBinding: SpecIntentEntry["specBinding"],
): SpecIntentEntry {
  return IntentEntrySchema.parse({
    intentId,
    ownership: "user-locked",
    requestEvidence,
    reasonCode: "explicit-request",
    specBinding,
  });
}

function parseChineseInteger(value: string): number | undefined {
  if (/^\d{1,2}$/u.test(value)) return Number(value);
  const digits = new Map([
    ["一", 1],
    ["二", 2],
    ["三", 3],
    ["四", 4],
    ["五", 5],
    ["六", 6],
    ["七", 7],
    ["八", 8],
    ["九", 9],
  ]);
  if (value === "十") return 10;
  if (!value.includes("十")) return digits.get(value);
  const [tens, ones] = value.split("十");
  const tensValue = tens === "" ? 1 : digits.get(tens ?? "");
  const onesValue = ones === "" ? 0 : digits.get(ones ?? "");
  if (tensValue === undefined || onesValue === undefined) return undefined;
  return tensValue * 10 + onesValue;
}

function uniqueRegexMatch(
  normalizedPrompt: string,
  pattern: RegExp,
  intentId: string,
): RegExpExecArray | undefined {
  const matches = [...normalizedPrompt.matchAll(pattern)];
  if (matches.length > 1) {
    throw new SpecIntentLedgerError(
      "ambiguous-intent",
      `Intent ${intentId} has more than one matching request clause.`,
    );
  }
  return matches[0];
}

function planPlatforms(
  normalizedPrompt: string,
  spec: ShooterGameSpec,
): SpecIntentEntry[] {
  if (/桌面\s*(?:或|或者)\s*手机/u.test(normalizedPrompt)) {
    throw new SpecIntentLedgerError(
      "ambiguous-intent",
      "The request offers desktop or mobile as alternatives instead of locking both targets.",
    );
  }
  const entries: SpecIntentEntry[] = [];
  const desktopEvidence = literalEvidence(
    normalizedPrompt,
    "桌面",
    "target-desktop-browser",
  );
  if (desktopEvidence.length === 1) {
    if (spec.controls.keyboard === undefined) {
      throw new SpecIntentLedgerError(
        "source-spec-mismatch",
        "The request locks desktop support but the source Spec has no keyboard controls.",
      );
    }
    entries.push(
      userEntry("target-desktop-browser", desktopEvidence, {
        kind: "control-surface",
        surface: "keyboard",
        specPath: "/controls/keyboard",
      }),
    );
  }
  const mobileEvidence = literalEvidence(
    normalizedPrompt,
    "手机",
    "target-mobile-browser",
  );
  if (mobileEvidence.length === 1) {
    if (spec.controls.touch === undefined) {
      throw new SpecIntentLedgerError(
        "source-spec-mismatch",
        "The request locks mobile support but the source Spec has no touch controls.",
      );
    }
    entries.push(
      userEntry("target-mobile-browser", mobileEvidence, {
        kind: "control-surface",
        surface: "touch",
        specPath: "/controls/touch",
      }),
    );
  }
  return entries;
}

function planWaveCount(
  normalizedPrompt: string,
  spec: ShooterGameSpec,
): SpecIntentEntry[] {
  const matches = [
    ...normalizedPrompt.matchAll(
      /(?<count>[一二三四五六七八九十]{1,3}|\d{1,2})\s*波(?:敌人)?/gu,
    ),
  ];
  if (matches.length === 0) return [];
  const values = matches.map((match) =>
    parseChineseInteger(match.groups?.count ?? ""),
  );
  if (values.some((value) => value === undefined)) {
    throw new SpecIntentLedgerError(
      "unknown-intent",
      "The request contains an unsupported enemy-wave count.",
    );
  }
  if (new Set(values).size > 1) {
    throw new SpecIntentLedgerError(
      "conflicting-intent",
      "The request contains conflicting enemy-wave counts.",
    );
  }
  if (matches.length > 1) {
    throw new SpecIntentLedgerError(
      "ambiguous-intent",
      "The request repeats the enemy-wave count.",
    );
  }
  const value = values[0]!;
  if (spec.enemyWaves.length !== value) {
    throw new SpecIntentLedgerError(
      "source-spec-mismatch",
      `The request locks ${value} enemy waves but the source Spec contains ${spec.enemyWaves.length}.`,
    );
  }
  const match = matches[0]!;
  return [
    userEntry(
      "enemy-wave-count",
      [evidenceAt(normalizedPrompt, match.index, match[0])],
      { kind: "wave-count", specPath: "/enemyWaves", value },
    ),
  ];
}

function roleForRequestItem(item: string): EnemyRole | undefined {
  if (/^(?:小型)?战机$/u.test(item)) return "small-fighter";
  if (/^(?:陨石|小行星)$/u.test(item)) return "asteroid";
  if (/^(?:会)?瞄准玩家(?:射击)?的?(?:编队|敌机)$/u.test(item)) {
    return "aimed-formation";
  }
  return undefined;
}

function roleMatchesQuery(
  role: EnemyRole,
  query: ShooterGameSpec["assetQueries"][number],
): boolean {
  if (query.category !== "enemy") return false;
  const terms = [query.id, ...query.tags].map((value) =>
    value.normalize("NFKC").toLocaleLowerCase("en-US"),
  );
  if (role === "small-fighter") {
    return terms.some((value) => value.includes("fighter"));
  }
  if (role === "asteroid") {
    return terms.some(
      (value) => value.includes("asteroid") || value === "rock",
    );
  }
  return terms.some(
    (value) =>
      value.includes("aimer") || value.includes("aiming") || value === "target",
  );
}

function bindEnemyRole(
  spec: ShooterGameSpec,
  role: EnemyRole,
): Extract<SpecIntentEntry["specBinding"], { kind: "enemy-role" }> {
  const candidates = spec.assetQueries.filter(
    (query) =>
      roleMatchesQuery(role, query) &&
      spec.enemyWaves.some((wave) => wave.enemyAssetQueryId === query.id),
  );
  if (candidates.length !== 1) {
    throw new SpecIntentLedgerError(
      candidates.length === 0 ? "source-spec-mismatch" : "ambiguous-intent",
      `Enemy role ${role} resolves to ${candidates.length} referenced asset queries.`,
    );
  }
  const assetQueryId = candidates[0]!.id;
  const waves = spec.enemyWaves.filter(
    (wave) => wave.enemyAssetQueryId === assetQueryId,
  );
  if (waves.length !== 1) {
    throw new SpecIntentLedgerError(
      waves.length === 0 ? "source-spec-mismatch" : "ambiguous-intent",
      `Enemy role ${role} resolves to ${waves.length} waves.`,
    );
  }
  if (role === "aimed-formation") {
    const patternTypes = new Map(
      spec.bulletPatterns.map((pattern) => [pattern.id, pattern.pattern]),
    );
    if (
      !waves[0]!.patternIds.some(
        (patternId) => patternTypes.get(patternId) === "aimed",
      )
    ) {
      throw new SpecIntentLedgerError(
        "source-spec-mismatch",
        "The requested aiming formation is not bound to an aimed bullet pattern.",
      );
    }
  }
  return {
    kind: "enemy-role",
    role,
    waveId: waves[0]!.id,
    assetQueryId,
  };
}

function planEnemyRoles(
  normalizedPrompt: string,
  spec: ShooterGameSpec,
): SpecIntentEntry[] {
  const match = uniqueRegexMatch(
    normalizedPrompt,
    /包括(?<list>[^,，;；。]+?)(?=[,，]随后|[;；。])/gu,
    "enemy-roles",
  );
  if (match === undefined) return [];
  const list = match.groups?.list;
  if (list === undefined) {
    throw new SpecIntentLedgerError(
      "ambiguous-intent",
      "The enemy-role list could not be isolated.",
    );
  }
  const listStart = match.index + match[0].indexOf(list);
  const items = list
    .split(/[、和]/u)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  const roles = items.map((item) => ({ item, role: roleForRequestItem(item) }));
  const unknown = roles.find((entry) => entry.role === undefined);
  if (unknown !== undefined) {
    throw new SpecIntentLedgerError(
      "unknown-intent",
      `Unsupported enemy role in request: ${JSON.stringify(unknown.item)}.`,
    );
  }
  if (new Set(roles.map((entry) => entry.role)).size !== roles.length) {
    throw new SpecIntentLedgerError(
      "ambiguous-intent",
      "The request repeats an enemy role.",
    );
  }
  let searchOffset = 0;
  return roles.map(({ item, role }) => {
    const relativeIndex = list.indexOf(item, searchOffset);
    searchOffset = relativeIndex + item.length;
    const evidence = evidenceAt(
      normalizedPrompt,
      listStart + relativeIndex,
      item,
    );
    const intentId = {
      "small-fighter": "enemy-role-small-fighter",
      asteroid: "enemy-role-asteroid",
      "aimed-formation": "enemy-role-aimed-formation",
    }[role!] as SpecIntentEntry["intentId"];
    return userEntry(intentId, [evidence], bindEnemyRole(spec, role!));
  });
}

function planDifficulty(
  normalizedPrompt: string,
  spec: ShooterGameSpec,
): SpecIntentEntry[] {
  const matches = [
    ...normalizedPrompt.matchAll(/难度(?<label>[^，；。,.\s]{1,4})/gu),
  ];
  if (matches.length === 0) return [];
  const labels = matches.map((match) => match.groups?.label ?? "");
  const valueByLabel = new Map<string, ShooterGameSpec["difficulty"]>([
    ["简单", "easy"],
    ["容易", "easy"],
    ["中等", "medium"],
    ["困难", "hard"],
  ]);
  const values = labels.map((label) => valueByLabel.get(label));
  if (values.some((value) => value === undefined)) {
    throw new SpecIntentLedgerError(
      "unknown-intent",
      `Unsupported difficulty intent: ${JSON.stringify(labels[0])}.`,
    );
  }
  if (new Set(values).size > 1) {
    throw new SpecIntentLedgerError(
      "conflicting-intent",
      "The request contains conflicting difficulty requirements.",
    );
  }
  if (matches.length > 1) {
    throw new SpecIntentLedgerError(
      "ambiguous-intent",
      "The request repeats the difficulty requirement.",
    );
  }
  const value = values[0]!;
  if (spec.difficulty !== value) {
    throw new SpecIntentLedgerError(
      "source-spec-mismatch",
      `The request locks difficulty ${value} but the source Spec contains ${spec.difficulty}.`,
    );
  }
  const match = matches[0]!;
  return [
    userEntry(
      "difficulty",
      [evidenceAt(normalizedPrompt, match.index, match[0])],
      { kind: "difficulty", specPath: "/difficulty", value },
    ),
  ];
}

type PickupEffect = Extract<
  SpecIntentEntry["specBinding"],
  { kind: "pickup-effect" }
>["effect"];

function pickupEffectForItem(item: string): PickupEffect | undefined {
  if (/护盾/u.test(item)) return "shield";
  if (/(?:火力强化|武器强化|火力升级)/u.test(item)) return "weaponPower";
  if (/(?:治疗|生命恢复|回血)/u.test(item)) return "heal";
  if (/(?:分数奖励|得分奖励)/u.test(item)) return "scoreBonus";
  return undefined;
}

function bindPickupEffect(
  spec: ShooterGameSpec,
  effect: PickupEffect,
): Extract<SpecIntentEntry["specBinding"], { kind: "pickup-effect" }> {
  const matches = spec.pickups.filter((pickup) => pickup.effect === effect);
  if (matches.length !== 1) {
    throw new SpecIntentLedgerError(
      matches.length === 0 ? "source-spec-mismatch" : "ambiguous-intent",
      `Pickup effect ${effect} resolves to ${matches.length} source Spec pickups.`,
    );
  }
  return { kind: "pickup-effect", effect, pickupId: matches[0]!.id };
}

function planPickups(
  normalizedPrompt: string,
  spec: ShooterGameSpec,
): SpecIntentEntry[] {
  const match = uniqueRegexMatch(
    normalizedPrompt,
    /拾取(?<list>[^,，;；。]+?)(?=[,，;；。])/gu,
    "pickups",
  );
  if (match === undefined) return [];
  const list = match.groups?.list;
  if (list === undefined) {
    throw new SpecIntentLedgerError(
      "ambiguous-intent",
      "The pickup list could not be isolated.",
    );
  }
  const listStart = match.index + match[0].indexOf(list);
  const items = list
    .split(/[、和]/u)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  const effects = items.map((item) => ({
    item,
    effect: pickupEffectForItem(item),
  }));
  const unknown = effects.find((entry) => entry.effect === undefined);
  if (unknown !== undefined) {
    throw new SpecIntentLedgerError(
      "unknown-intent",
      `Unsupported pickup intent in request: ${JSON.stringify(unknown.item)}.`,
    );
  }
  if (new Set(effects.map((entry) => entry.effect)).size !== effects.length) {
    throw new SpecIntentLedgerError(
      "ambiguous-intent",
      "The request repeats a pickup effect.",
    );
  }
  let searchOffset = 0;
  return effects.map(({ item, effect }) => {
    const relativeIndex = list.indexOf(item, searchOffset);
    searchOffset = relativeIndex + item.length;
    const evidence = evidenceAt(
      normalizedPrompt,
      listStart + relativeIndex,
      item,
    );
    const intentId = effect === "shield" ? "pickup-shield" : "pickup-firepower";
    if (effect !== "shield" && effect !== "weaponPower") {
      throw new SpecIntentLedgerError(
        "unknown-intent",
        `SpecIntentLedger 1.0.0 does not yet own pickup intent ${effect}.`,
      );
    }
    return userEntry(intentId, [evidence], bindPickupEffect(spec, effect));
  });
}

function planVictory(
  normalizedPrompt: string,
  spec: ShooterGameSpec,
): SpecIntentEntry[] {
  const winMentions = [...normalizedPrompt.matchAll(/获胜/gu)];
  if (winMentions.length === 0) return [];
  const matches = [...normalizedPrompt.matchAll(/击败\s*Boss\s*获胜/giu)];
  if (matches.length === 0) {
    throw new SpecIntentLedgerError(
      "unknown-intent",
      "The request contains an unsupported victory statement.",
    );
  }
  if (matches.length !== 1 || winMentions.length !== 1) {
    throw new SpecIntentLedgerError(
      matches.length === winMentions.length
        ? "ambiguous-intent"
        : "conflicting-intent",
      "The request contains multiple or conflicting victory statements.",
    );
  }
  if (spec.winCondition.type !== "bossDefeated") {
    throw new SpecIntentLedgerError(
      "source-spec-mismatch",
      `The request locks Boss defeat but the source Spec uses ${spec.winCondition.type}.`,
    );
  }
  const match = matches[0]!;
  return [
    userEntry(
      "boss-victory",
      [evidenceAt(normalizedPrompt, match.index, match[0])],
      {
        kind: "win-condition",
        specPath: "/winCondition/type",
        value: "bossDefeated",
      },
    ),
  ];
}

function planPlayerHealth(
  normalizedPrompt: string,
  spec: ShooterGameSpec,
): SpecIntentEntry {
  const healthMentions = [
    ...normalizedPrompt.matchAll(/(?:生命值|血量|生命)/gu),
  ];
  if (healthMentions.length === 0) {
    return IntentEntrySchema.parse({
      intentId: "player-max-health",
      ownership: "agent-choice",
      requestEvidence: [],
      reasonCode: "not-stated-in-request",
      specBinding: {
        kind: "player-max-health",
        specPath: "/player/maxHealth",
        value: spec.player.maxHealth,
      },
    });
  }
  const matches = [
    ...normalizedPrompt.matchAll(
      /(?:生命值|血量|生命)\s*(?:为|是|=|：|:)?\s*(?<count>[一二三四五六七八九十]{1,3}|\d{1,2})/gu,
    ),
  ];
  if (matches.length === 0 || matches.length !== healthMentions.length) {
    throw new SpecIntentLedgerError(
      "ambiguous-intent",
      "The request mentions player health without one exact supported value.",
    );
  }
  const values = matches.map((match) =>
    parseChineseInteger(match.groups?.count ?? ""),
  );
  if (values.some((value) => value === undefined)) {
    throw new SpecIntentLedgerError(
      "unknown-intent",
      "The request contains an unsupported player-health value.",
    );
  }
  if (new Set(values).size > 1) {
    throw new SpecIntentLedgerError(
      "conflicting-intent",
      "The request contains conflicting player-health values.",
    );
  }
  if (matches.length > 1) {
    throw new SpecIntentLedgerError(
      "ambiguous-intent",
      "The request repeats the player-health value.",
    );
  }
  const value = values[0]!;
  if (spec.player.maxHealth !== value) {
    throw new SpecIntentLedgerError(
      "source-spec-mismatch",
      `The request locks player health ${value} but the source Spec contains ${spec.player.maxHealth}.`,
    );
  }
  const match = matches[0]!;
  return userEntry(
    "player-max-health",
    [evidenceAt(normalizedPrompt, match.index, match[0])],
    {
      kind: "player-max-health",
      specPath: "/player/maxHealth",
      value,
    },
  );
}

export class SpecIntentLedgerError extends Error {
  constructor(
    readonly code:
      | "unknown-intent"
      | "conflicting-intent"
      | "ambiguous-intent"
      | "source-spec-mismatch"
      | "binding-mismatch",
    message: string,
  ) {
    super(`Spec intent ledger ${code}: ${message}`);
    this.name = "SpecIntentLedgerError";
  }
}

export function planSpecIntentLedger(
  rawRequest: SpecIntentRequest,
  rawSourceSpec: unknown,
): SpecIntentLedger {
  const request = z
    .strictObject({
      language: z.literal("zh-CN"),
      prompt: z.string().min(12).max(2_000),
    })
    .parse(rawRequest);
  const sourceSpec = parseShooterGameSpec(rawSourceSpec);
  const normalizedPrompt = normalize(request.prompt);
  const entries = [
    ...planPlatforms(normalizedPrompt, sourceSpec),
    ...planWaveCount(normalizedPrompt, sourceSpec),
    ...planEnemyRoles(normalizedPrompt, sourceSpec),
    ...planDifficulty(normalizedPrompt, sourceSpec),
    ...planPickups(normalizedPrompt, sourceSpec),
    ...planVictory(normalizedPrompt, sourceSpec),
    planPlayerHealth(normalizedPrompt, sourceSpec),
  ];
  return SpecIntentLedgerSchema.parse({
    schemaVersion: "1.0.0",
    policyId: "zh-cn-playability-intent-v1",
    scope: "playability-provenance-v1",
    request: {
      language: request.language,
      normalization: "NFKC",
      sha256: sha256(request.prompt),
      normalizedSha256: sha256(normalizedPrompt),
    },
    sourceSpec: {
      schemaVersion: sourceSpec.schemaVersion,
      sha256: sha256CompletedShooterGameSpec(sourceSpec),
    },
    entries,
  });
}

export function verifySpecIntentLedger(
  rawRequest: SpecIntentRequest,
  rawSourceSpec: unknown,
  rawLedger: unknown,
): SpecIntentLedger {
  const ledger = SpecIntentLedgerSchema.parse(rawLedger);
  const expected = planSpecIntentLedger(rawRequest, rawSourceSpec);
  if (JSON.stringify(ledger) !== JSON.stringify(expected)) {
    throw new SpecIntentLedgerError(
      "binding-mismatch",
      "Recorded intent evidence does not match the deterministic request/Spec policy.",
    );
  }
  return expected;
}
