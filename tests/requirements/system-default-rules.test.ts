import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  isSystemDefaultRuleId,
  normalizeRuleText,
  SYSTEM_DEFAULT_RULE_IDS,
  SYSTEM_DEFAULT_RULES,
  systemDefaultRule,
} from "../../src/requirements/system-default-rules.js";
import { sha256GameSpecV2 } from "../../src/requirements/game-spec-v2.js";
import {
  verifyIntentLedgerV2,
  type IntentLedgerV2,
} from "../../src/requirements/intent-ledger-v2.js";
import { buildSpecAgentSystemPrompt } from "../../src/requirements/spec-agent-prompt.js";

// §二 — the ONE authoritative system-default registry. The prompt, the schema /
// verifier, and these tests all read the SAME source, so a model can neither
// invent a new default ruleId nor drift a default statement's text. A user
// requirement that conflicts with a default is never silently overridden.

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

const RULE_ENGINE = SYSTEM_DEFAULT_RULES.find(
  (r) => r.ruleId === "default-target-engine-cocos-web-h5",
)!;

/**
 * Assemble a spec + ledger for a single system-default statement, so we can run
 * the deterministic verifier against the shared registry. `ruleId` / `text` are
 * overridable to prove the forged-ruleId and tampered-text rejections.
 */
function assembleDefaultOnly(params: {
  prompt: string;
  ruleId: string;
  statementText: string;
}): { prompt: string; spec: unknown; ledger: IntentLedgerV2 } {
  const spec = {
    schemaVersion: "2.0.0",
    kind: "GameSpecV2",
    gameConcept: [
      { statementId: "engine-default", text: params.statementText },
    ],
    gameplayIntent: [],
    platformAndControls: [],
    additionalConstraints: [],
  };
  const ledger: IntentLedgerV2 = {
    schemaVersion: "2.0.0",
    kind: "IntentLedgerV2",
    scope: "open-requirement-provenance-v2",
    request: {
      language: "zh-CN",
      normalization: "NFKC",
      sha256: sha256(params.prompt),
    },
    gameSpec: { schemaVersion: "2.0.0", sha256: sha256GameSpecV2(spec) },
    entries: [
      {
        statementId: "engine-default",
        source: "system-default",
        strength: "required",
        locked: true,
        confidence: 0.99,
        evidence: { ruleId: params.ruleId },
      },
    ],
  };
  return { prompt: params.prompt, spec, ledger };
}

describe("system-default registry — single authoritative source (§二)", () => {
  it("registers exactly the product-confirmed defaults and no UI-language / orientation / Boss default", () => {
    expect([...SYSTEM_DEFAULT_RULE_IDS].sort()).toEqual(
      [
        "default-primary-platform-pc-keyboard-mouse",
        "default-secondary-platform-mobile-touch",
        "default-single-player-2d-bullet-hell-h5",
        "default-target-engine-cocos-web-h5",
      ].sort(),
    );
    // Deliberately NOT defaulted (must stay user/Design-driven): UI language,
    // orientation, and the presence of any Boss / wave / pickup / win condition.
    for (const rule of SYSTEM_DEFAULT_RULES) {
      expect(rule.text).not.toContain("简体中文");
      expect(rule.text).not.toContain("竖版");
      expect(rule.text).not.toContain("Boss");
    }
    expect(isSystemDefaultRuleId("default-language-zh-cn")).toBe(false);
    expect(isSystemDefaultRuleId("default-orientation-vertical")).toBe(false);
  });

  it("test — accepts a system-default entry citing a registered ruleId with matching text", () => {
    const { prompt, spec, ledger } = assembleDefaultOnly({
      prompt: "做一个弹幕小游戏。",
      ruleId: RULE_ENGINE.ruleId,
      statementText: RULE_ENGINE.text,
    });
    expect(() =>
      verifyIntentLedgerV2({ language: "zh-CN", prompt }, spec, ledger),
    ).not.toThrow();
  });

  it("test — rejects a forged 'default-anything' ruleId that is not in the registry", () => {
    const { prompt, spec, ledger } = assembleDefaultOnly({
      prompt: "做一个弹幕小游戏。",
      // Well-formed kebab-case, so it passes the schema shape, but it is NOT a
      // registered rule — the verifier must reject it as an unknown rule.
      ruleId: "default-anything",
      statementText: RULE_ENGINE.text,
    });
    expect(() =>
      verifyIntentLedgerV2({ language: "zh-CN", prompt }, spec, ledger),
    ).toThrow(/unknown-rule/);
  });

  it("test — rejects a registered ruleId whose statement text was tampered", () => {
    const { prompt, spec, ledger } = assembleDefaultOnly({
      prompt: "做一个弹幕小游戏。",
      ruleId: RULE_ENGINE.ruleId,
      // A legal ruleId, but the statement text no longer matches the registry.
      statementText: "目标引擎其实可以随便换成别的引擎。",
    });
    expect(() =>
      verifyIntentLedgerV2({ language: "zh-CN", prompt }, spec, ledger),
    ).toThrow(/rule-text-mismatch/);
  });

  it("test — a user requirement that conflicts with a default is not silently overridden", () => {
    // The engine default is Cocos. A user request that explicitly demands a
    // DIFFERENT engine is a user-declared requirement in its own right; the
    // verifier accepts it as user-declared (it does not get replaced by the
    // system-default text). Reconciling the conflict is the model's job via
    // needs-clarification / bounded-failure — never a silent default overwrite.
    const prompt = "我一定要用 Phaser 引擎，不要 Cocos。";
    const spec = {
      schemaVersion: "2.0.0",
      kind: "GameSpecV2",
      gameConcept: [],
      gameplayIntent: [],
      platformAndControls: [],
      additionalConstraints: [
        { statementId: "wants-phaser", text: "用户坚持使用 Phaser 引擎。" },
      ],
    };
    const ledger: IntentLedgerV2 = {
      schemaVersion: "2.0.0",
      kind: "IntentLedgerV2",
      scope: "open-requirement-provenance-v2",
      request: {
        language: "zh-CN",
        normalization: "NFKC",
        sha256: sha256(prompt),
      },
      gameSpec: { schemaVersion: "2.0.0", sha256: sha256GameSpecV2(spec) },
      entries: [
        {
          statementId: "wants-phaser",
          source: "user-declared",
          strength: "required",
          locked: true,
          confidence: 0.9,
          evidence: { quotes: ["一定要用 Phaser 引擎"] },
        },
      ],
    };
    const verified = verifyIntentLedgerV2(
      { language: "zh-CN", prompt },
      spec,
      ledger,
    );
    const entry = verified.entries.find(
      (e) => e.statementId === "wants-phaser",
    );
    // The user's own requirement is preserved as user-declared, NOT quietly
    // rewritten into the Cocos system-default text.
    expect(entry?.source).toBe("user-declared");
    expect(
      spec.additionalConstraints.some((s) => s.text.includes("Phaser")),
    ).toBe(true);
  });

  it("test — the prompt renders the SAME registry the verifier enforces (no drift)", () => {
    const prompt = buildSpecAgentSystemPrompt();
    // Every authoritative rule id + text appears verbatim in the prompt.
    for (const rule of SYSTEM_DEFAULT_RULES) {
      expect(prompt).toContain(rule.ruleId);
      expect(prompt).toContain(rule.text);
    }
    // The prompt explicitly forbids defaulting UI language / orientation / Boss.
    expect(prompt).toContain("不要假设简体中文");
    expect(prompt).toContain("不要假设竖版");
    // And it forbids silently overriding a conflicting user requirement.
    expect(prompt).toContain("不得静默");
  });

  it("normalizeRuleText / systemDefaultRule expose the shared basis for comparison", () => {
    expect(systemDefaultRule(RULE_ENGINE.ruleId)?.text).toBe(RULE_ENGINE.text);
    expect(systemDefaultRule("default-anything")).toBeUndefined();
    expect(normalizeRuleText("  a   b  ")).toBe("a b");
  });
});
