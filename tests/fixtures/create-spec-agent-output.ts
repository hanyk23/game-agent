import type { SpecAgentModelOutput } from "../../src/requirements/spec-agent-result.js";

/**
 * Deterministic GameSpec v2 / Spec Agent output fixtures.
 *
 * These prove CONTRACT coverage only — they are hand-written, not model output,
 * and must never be presented as evidence of a real DeepSeek call. Each helper
 * builds a legal model output for one scenario in the batch prompt §九 matrix.
 *
 * Quotes used as user-declared evidence are verbatim substrings of the paired
 * prompt so verifyIntentLedgerV2 accepts them.
 */

/** §九.1 — horizontal, free 2D movement, mouse aim, no Boss, endless survival. */
export const HORIZONTAL_FREE_MOVE_PROMPT =
  "做一个横屏游戏，玩家可以在屏幕上自由二维移动，用鼠标瞄准射击，不要 Boss，无限生存。";

export function horizontalFreeMoveOutput(): SpecAgentModelOutput {
  return {
    outcome: "spec-ready",
    gameSpec: {
      schemaVersion: "2.0.0",
      kind: "GameSpecV2",
      gameConcept: [
        {
          statementId: "concept-horizontal",
          text: "游戏采用横屏（横版）呈现。",
        },
      ],
      gameplayIntent: [
        {
          statementId: "move-free-2d",
          text: "玩家可以在屏幕上自由地进行二维移动。",
        },
        {
          statementId: "player-aims-and-shoots",
          text: "玩家主动瞄准并射击敌人。",
        },
        {
          statementId: "no-boss",
          text: "游戏中不出现 Boss。",
        },
        {
          statementId: "endless-survival",
          text: "游戏是无限生存，没有固定的结束关卡。",
        },
      ],
      platformAndControls: [
        {
          statementId: "control-mouse-aim",
          text: "使用鼠标进行瞄准操作。",
        },
      ],
      additionalConstraints: [],
    },
    ledger: [
      {
        statementId: "concept-horizontal",
        source: "user-declared",
        strength: "required",
        locked: true,
        confidence: 0.98,
        evidence: { quotes: ["横屏"] },
      },
      {
        statementId: "move-free-2d",
        source: "user-declared",
        strength: "required",
        locked: true,
        confidence: 0.95,
        evidence: { quotes: ["自由二维移动"] },
      },
      {
        statementId: "player-aims-and-shoots",
        source: "user-declared",
        strength: "required",
        locked: true,
        confidence: 0.95,
        // Canonical GAMEPLAY statement: the player actively aims/shoots. The
        // mouse-as-device requirement is the single canonical statement in
        // platformAndControls (§五 — one requirement, one canonical statement).
        evidence: { quotes: ["瞄准射击"] },
      },
      {
        statementId: "no-boss",
        source: "user-declared",
        strength: "forbidden",
        locked: true,
        confidence: 0.97,
        evidence: { quotes: ["不要 Boss"] },
      },
      {
        statementId: "endless-survival",
        source: "user-declared",
        strength: "required",
        locked: true,
        confidence: 0.96,
        evidence: { quotes: ["无限生存"] },
      },
      {
        statementId: "control-mouse-aim",
        source: "user-declared",
        strength: "required",
        locked: true,
        confidence: 0.9,
        evidence: { quotes: ["鼠标"] },
      },
    ],
  };
}

/** §九.2 — vertical traditional bullet-hell; Boss/wave counts unspecified. */
export const VERTICAL_TRADITIONAL_PROMPT =
  "我想要一个竖屏的传统弹幕射击游戏，飞机向上开火躲避子弹。";

export function verticalTraditionalOutput(): SpecAgentModelOutput {
  return {
    outcome: "spec-ready",
    gameSpec: {
      schemaVersion: "2.0.0",
      kind: "GameSpecV2",
      gameConcept: [
        {
          statementId: "concept-vertical",
          text: "游戏采用竖屏（竖版）呈现。",
        },
      ],
      gameplayIntent: [
        {
          statementId: "traditional-bullet-hell",
          text: "玩家操控飞机向上开火，同时躲避敌方子弹，属于传统弹幕射击玩法。",
        },
      ],
      platformAndControls: [],
      additionalConstraints: [],
    },
    ledger: [
      {
        statementId: "concept-vertical",
        source: "user-declared",
        strength: "required",
        locked: true,
        confidence: 0.97,
        evidence: { quotes: ["竖屏"] },
      },
      {
        statementId: "traditional-bullet-hell",
        source: "user-declared",
        strength: "required",
        locked: true,
        confidence: 0.9,
        evidence: { quotes: ["传统弹幕射击"] },
      },
    ],
  };
}

/** §九.3 — pure dodge; no attacking, no win condition. */
export const PURE_DODGE_PROMPT =
  "做一个纯躲避的游戏，玩家完全不能攻击，只需要一直躲开子弹活下去。";

export function pureDodgeOutput(): SpecAgentModelOutput {
  return {
    outcome: "spec-ready",
    gameSpec: {
      schemaVersion: "2.0.0",
      kind: "GameSpecV2",
      gameConcept: [
        {
          statementId: "concept-pure-dodge",
          text: "游戏核心是纯躲避体验。",
        },
      ],
      gameplayIntent: [
        {
          statementId: "no-attack",
          text: "玩家完全不能攻击。",
        },
        {
          statementId: "survive-by-dodging",
          text: "玩家通过持续躲避子弹存活。",
        },
      ],
      platformAndControls: [],
      additionalConstraints: [],
    },
    ledger: [
      {
        statementId: "concept-pure-dodge",
        source: "user-declared",
        strength: "required",
        locked: true,
        confidence: 0.95,
        evidence: { quotes: ["纯躲避"] },
      },
      {
        statementId: "no-attack",
        source: "user-declared",
        strength: "forbidden",
        locked: true,
        confidence: 0.96,
        evidence: { quotes: ["完全不能攻击"] },
      },
      {
        statementId: "survive-by-dodging",
        source: "user-declared",
        strength: "required",
        locked: true,
        confidence: 0.9,
        evidence: { quotes: ["躲开子弹活下去"] },
      },
    ],
  };
}

/** §九.4 — survivor-style horde gameplay. */
export const SURVIVOR_PROMPT =
  "我想做一个幸存者式的游戏，玩家被大量敌人包围，自动攻击并不断升级变强。";

export function survivorOutput(): SpecAgentModelOutput {
  return {
    outcome: "spec-ready",
    gameSpec: {
      schemaVersion: "2.0.0",
      kind: "GameSpecV2",
      gameConcept: [
        {
          statementId: "concept-survivor",
          text: "游戏是幸存者式（survivor-like）玩法。",
        },
      ],
      gameplayIntent: [
        {
          statementId: "surrounded-by-horde",
          text: "玩家被大量敌人从四面包围。",
        },
        {
          statementId: "auto-attack-and-upgrade",
          text: "玩家自动攻击，并通过不断升级变强。",
        },
      ],
      platformAndControls: [],
      additionalConstraints: [],
    },
    ledger: [
      {
        statementId: "concept-survivor",
        source: "user-declared",
        strength: "required",
        locked: true,
        confidence: 0.94,
        evidence: { quotes: ["幸存者式"] },
      },
      {
        statementId: "surrounded-by-horde",
        source: "user-declared",
        strength: "required",
        locked: true,
        confidence: 0.93,
        evidence: { quotes: ["被大量敌人包围"] },
      },
      {
        statementId: "auto-attack-and-upgrade",
        source: "user-declared",
        strength: "required",
        locked: true,
        confidence: 0.9,
        evidence: { quotes: ["自动攻击并不断升级变强"] },
      },
    ],
  };
}

/** §九.5 — a user-invented novel concept the schema never enumerated. */
export const NOVEL_CONCEPT_PROMPT =
  "我要一个「引力回声」玩法：玩家发射的能量会在墙壁间反弹并把敌人吸进黑洞。";

export function novelConceptOutput(): SpecAgentModelOutput {
  return {
    outcome: "spec-ready",
    gameSpec: {
      schemaVersion: "2.0.0",
      kind: "GameSpecV2",
      gameConcept: [
        {
          statementId: "concept-gravity-echo",
          text: "游戏采用用户自创的「引力回声」玩法概念。",
        },
      ],
      gameplayIntent: [
        {
          statementId: "energy-bounces",
          text: "玩家发射的能量会在墙壁之间反弹。",
        },
        {
          statementId: "pull-enemies-into-blackhole",
          text: "反弹的能量会把敌人吸进黑洞。",
        },
      ],
      platformAndControls: [],
      additionalConstraints: [],
    },
    ledger: [
      {
        statementId: "concept-gravity-echo",
        source: "user-declared",
        strength: "required",
        locked: true,
        confidence: 0.9,
        evidence: { quotes: ["引力回声"] },
      },
      {
        statementId: "energy-bounces",
        source: "user-declared",
        strength: "required",
        locked: true,
        confidence: 0.9,
        evidence: { quotes: ["在墙壁间反弹"] },
      },
      {
        statementId: "pull-enemies-into-blackhole",
        source: "user-declared",
        strength: "required",
        locked: true,
        confidence: 0.9,
        evidence: { quotes: ["把敌人吸进黑洞"] },
      },
    ],
  };
}

/** §九.6 — user explicitly requests a Boss. */
export const BOSS_REQUIRED_PROMPT =
  "竖屏弹幕游戏，最后必须有一个大型 Boss 战。";

export function bossRequiredOutput(): SpecAgentModelOutput {
  return {
    outcome: "spec-ready",
    gameSpec: {
      schemaVersion: "2.0.0",
      kind: "GameSpecV2",
      gameConcept: [
        { statementId: "concept-vertical-boss", text: "游戏采用竖屏呈现。" },
      ],
      gameplayIntent: [
        {
          statementId: "has-boss",
          text: "游戏在最后包含一场大型 Boss 战。",
        },
      ],
      platformAndControls: [],
      additionalConstraints: [],
    },
    ledger: [
      {
        statementId: "concept-vertical-boss",
        source: "user-declared",
        strength: "required",
        locked: true,
        confidence: 0.95,
        evidence: { quotes: ["竖屏"] },
      },
      {
        statementId: "has-boss",
        source: "user-declared",
        strength: "required",
        locked: true,
        confidence: 0.97,
        evidence: { quotes: ["必须有一个大型 Boss 战"] },
      },
    ],
  };
}

/** §九.7 — user explicitly forbids a Boss. */
export const BOSS_FORBIDDEN_PROMPT = "横屏射击，明确不要任何 Boss。";

export function bossForbiddenOutput(): SpecAgentModelOutput {
  return {
    outcome: "spec-ready",
    gameSpec: {
      schemaVersion: "2.0.0",
      kind: "GameSpecV2",
      gameConcept: [
        { statementId: "concept-horizontal-shmup", text: "游戏采用横屏呈现。" },
      ],
      gameplayIntent: [
        { statementId: "forbid-boss", text: "游戏中不出现任何 Boss。" },
      ],
      platformAndControls: [],
      additionalConstraints: [],
    },
    ledger: [
      {
        statementId: "concept-horizontal-shmup",
        source: "user-declared",
        strength: "required",
        locked: true,
        confidence: 0.95,
        evidence: { quotes: ["横屏"] },
      },
      {
        statementId: "forbid-boss",
        source: "user-declared",
        strength: "forbidden",
        locked: true,
        confidence: 0.97,
        evidence: { quotes: ["不要任何 Boss"] },
      },
    ],
  };
}

/** §五.2 / §九.13 — genuinely conflicting requirements → needs-clarification. */
export const CONFLICTING_PROMPT =
  "我既要纯躲避、玩家绝不能攻击，又必须由玩家开枪击败 Boss。";

export function conflictingClarificationOutput(): SpecAgentModelOutput {
  return {
    outcome: "needs-clarification",
    partialSpec: {
      schemaVersion: "2.0.0",
      kind: "PartialGameSpecV2",
      gameConcept: [],
      gameplayIntent: [
        {
          statementId: "wants-dodge-only",
          text: "用户希望是纯躲避、玩家不能攻击的玩法。",
        },
      ],
      platformAndControls: [],
      additionalConstraints: [],
    },
    partialLedger: [
      {
        statementId: "wants-dodge-only",
        source: "user-declared",
        strength: "forbidden",
        locked: true,
        confidence: 0.9,
        evidence: { quotes: ["玩家绝不能攻击"] },
      },
    ],
    questions: [
      {
        questionId: "q-dodge-vs-shoot-boss",
        question:
          "你希望玩家完全不能攻击（纯躲避），还是需要玩家开枪击败 Boss？这两者互相冲突，只能二选一。",
        why: "纯躲避且玩家不能攻击，与由玩家开枪击败 Boss 直接矛盾，会决定游戏的根本形态。",
        affectedPartitions: ["gameplayIntent"],
      },
    ],
  };
}

/**
 * §一 — a horizontal survival request with EXPLICITLY DECLARED numbers: three
 * lives, survive 120 seconds, at most two weapon kinds. The declared numbers are
 * preserved VERBATIM inside natural-language statement text (never invented, and
 * never re-encoded as a design parameter field). Each numeric statement is
 * user-declared with a verbatim quote and, being a hard requirement, is locked.
 * Crucially, the Agent invents NO damage / enemy-count / Boss numbers.
 */
export const HORIZONTAL_SURVIVAL_NUMBERS_PROMPT =
  "做一个横屏生存游戏，玩家有三条命，坚持 120 秒后结束，每局最多出现两种武器。";

export function horizontalSurvivalNumbersOutput(): SpecAgentModelOutput {
  return {
    outcome: "spec-ready",
    gameSpec: {
      schemaVersion: "2.0.0",
      kind: "GameSpecV2",
      gameConcept: [
        {
          statementId: "concept-horizontal-survival",
          text: "游戏是横屏生存玩法。",
        },
      ],
      gameplayIntent: [
        {
          statementId: "three-lives",
          text: "玩家有三条命。",
        },
        {
          statementId: "survive-120-seconds",
          text: "玩家坚持 120 秒后游戏结束。",
        },
        {
          statementId: "at-most-two-weapons",
          text: "每局最多出现两种武器。",
        },
      ],
      platformAndControls: [],
      additionalConstraints: [],
    },
    ledger: [
      {
        statementId: "concept-horizontal-survival",
        source: "user-declared",
        strength: "required",
        locked: true,
        confidence: 0.96,
        evidence: { quotes: ["横屏生存游戏"] },
      },
      {
        statementId: "three-lives",
        source: "user-declared",
        strength: "required",
        locked: true,
        confidence: 0.97,
        evidence: { quotes: ["三条命"] },
      },
      {
        statementId: "survive-120-seconds",
        source: "user-declared",
        strength: "required",
        locked: true,
        confidence: 0.97,
        evidence: { quotes: ["坚持 120 秒后结束"] },
      },
      {
        statementId: "at-most-two-weapons",
        source: "user-declared",
        strength: "required",
        locked: true,
        confidence: 0.96,
        evidence: { quotes: ["最多出现两种武器"] },
      },
    ],
  };
}
