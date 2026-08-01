import { z } from "zod";

/**
 * system-default-rules — the single authoritative registry of system-default
 * requirements for GameSpec v2 (batch prompt §二).
 *
 * This is the ONE shared source of truth. The Spec Agent prompt, the IntentLedger
 * v2 schema/verifier, and the tests all read from here so no second hard-coded
 * copy can drift. A system-default ledger entry may cite ONLY a ruleId listed
 * here, and its GameSpec statement text must match this registry verbatim — the
 * model may not invent or extend system defaults.
 *
 * Product-confirmed defaults only. Deliberately NOT defaulted (must stay
 * user-driven / Design-driven, never assumed here):
 *   - UI language (we do NOT assume Simplified Chinese),
 *   - orientation (we do NOT assume vertical),
 *   - the presence of any Boss / wave / pickup / win condition.
 */

export type SystemDefaultRule = Readonly<{
  ruleId: string;
  text: string;
}>;

export const SYSTEM_DEFAULT_RULES = [
  {
    ruleId: "default-single-player-2d-bullet-hell-h5",
    text: "产品是单人 2D 弹幕类 Web/H5 游戏，运行在浏览器中。",
  },
  {
    ruleId: "default-target-engine-cocos-web-h5",
    text: "目标引擎固定为 Cocos Creator Web/H5。",
  },
  {
    ruleId: "default-primary-platform-pc-keyboard-mouse",
    text: "PC 键盘与鼠标是首要支持与验收平台。",
  },
  {
    ruleId: "default-secondary-platform-mobile-touch",
    text: "手机 touch 为次优先支持，不阻塞 PC 首版交付。",
  },
] as const satisfies readonly SystemDefaultRule[];

export type SystemDefaultRuleId =
  (typeof SYSTEM_DEFAULT_RULES)[number]["ruleId"];

export const SYSTEM_DEFAULT_RULE_IDS = SYSTEM_DEFAULT_RULES.map(
  (rule) => rule.ruleId,
) as [SystemDefaultRuleId, ...SystemDefaultRuleId[]];

/** A Zod enum accepting only registered system-default ruleIds. */
export const SystemDefaultRuleIdSchema = z.enum(SYSTEM_DEFAULT_RULE_IDS);

const RULE_BY_ID = new Map<string, SystemDefaultRule>(
  SYSTEM_DEFAULT_RULES.map((rule) => [rule.ruleId, rule]),
);

export function isSystemDefaultRuleId(
  ruleId: string,
): ruleId is SystemDefaultRuleId {
  return RULE_BY_ID.has(ruleId);
}

export function systemDefaultRule(
  ruleId: string,
): SystemDefaultRule | undefined {
  return RULE_BY_ID.get(ruleId);
}

/** NFKC-normalized comparison so a matching statement text is byte-stable. */
export function normalizeRuleText(text: string): string {
  return text.normalize("NFKC").trim().replace(/\s+/gu, " ");
}
