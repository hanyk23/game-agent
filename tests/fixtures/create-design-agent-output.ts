import { createHash } from "node:crypto";

import type {
  GameDesignV2,
  GameDesignV2Body,
} from "../../src/gameplay/game-design-v2.js";
import type { DesignAgentModelOutput } from "../../src/requirements/design-agent-result.js";
import type { GameSpecV2 } from "../../src/requirements/game-spec-v2.js";
import {
  sha256IntentLedgerV2,
  type IntentLedgerV2,
} from "../../src/requirements/intent-ledger-v2.js";

export const DESIGN_UPSTREAM_REQUEST_PROMPT =
  "我想要一个横屏的弹幕射击 H5 游戏：玩家可以在二维平面里自由移动，用鼠标瞄准射击，不要 Boss，存活满 120 秒后进入结算。";

export function upstreamGameSpecV2(): GameSpecV2 {
  return {
    schemaVersion: "2.0.0",
    kind: "GameSpecV2",
    gameConcept: [
      {
        statementId: "concept-horizontal-screen",
        text: "游戏画面采用横屏显示。",
      },
      { statementId: "concept-bullet-hell", text: "游戏是2D弹幕射击游戏。" },
      {
        statementId: "s-default-single-player-2d-bullet-hell-h5",
        text: "产品是单人 2D 弹幕类 Web/H5 游戏，运行在浏览器中。",
      },
    ],
    gameplayIntent: [
      {
        statementId: "intent-free-movement",
        text: "玩家可以在二维平面内自由移动。",
      },
      { statementId: "intent-shooting", text: "玩家可以进行射击。" },
      {
        statementId: "intent-survive-120s",
        text: "游戏目标为存活满120秒，存活满120秒后进入结算。",
      },
    ],
    platformAndControls: [
      {
        statementId: "control-mouse-aim-shoot",
        text: "玩家使用鼠标进行瞄准和射击。",
      },
      {
        statementId: "s-default-primary-platform-pc-keyboard-mouse",
        text: "PC 键盘与鼠标是首要支持与验收平台。",
      },
      {
        statementId: "s-default-secondary-platform-mobile-touch",
        text: "手机 touch 为次优先支持，不阻塞 PC 首版交付。",
      },
    ],
    additionalConstraints: [
      { statementId: "constraint-no-boss", text: "游戏中不应出现 Boss。" },
      {
        statementId: "s-default-target-engine-cocos-web-h5",
        text: "目标引擎固定为 Cocos Creator Web/H5。",
      },
    ],
  };
}

export function upstreamIntentLedgerV2(): IntentLedgerV2 {
  return {
    schemaVersion: "2.0.0",
    kind: "IntentLedgerV2",
    scope: "open-requirement-provenance-v2",
    request: {
      language: "zh-CN",
      normalization: "NFKC",
      sha256:
        "bd34bd89e2f3900fe3f65382b45a070259c2efcfc44cf63b87824e11a593db58",
    },
    gameSpec: {
      schemaVersion: "2.0.0",
      sha256:
        "461be7b4cbcebcda136c7c05c6d11aa0db8bbfa32b8e25b3a1988ed42a4ec9b2",
    },
    entries: [
      {
        statementId: "concept-horizontal-screen",
        source: "user-declared",
        strength: "required",
        locked: true,
        confidence: 1,
        evidence: { quotes: ["我想要一个横屏的弹幕射击 H5 游戏"] },
      },
      {
        statementId: "concept-bullet-hell",
        source: "user-declared",
        strength: "required",
        locked: true,
        confidence: 1,
        evidence: { quotes: ["弹幕射击 H5 游戏"] },
      },
      {
        statementId: "s-default-single-player-2d-bullet-hell-h5",
        source: "system-default",
        strength: "required",
        locked: true,
        confidence: 1,
        evidence: { ruleId: "default-single-player-2d-bullet-hell-h5" },
      },
      {
        statementId: "intent-free-movement",
        source: "user-declared",
        strength: "required",
        locked: true,
        confidence: 1,
        evidence: { quotes: ["玩家可以在二维平面里自由移动"] },
      },
      {
        statementId: "intent-shooting",
        source: "user-declared",
        strength: "required",
        locked: true,
        confidence: 1,
        evidence: { quotes: ["用鼠标瞄准射击"] },
      },
      {
        statementId: "intent-survive-120s",
        source: "user-declared",
        strength: "required",
        locked: true,
        confidence: 1,
        evidence: { quotes: ["存活满 120 秒后进入结算"] },
      },
      {
        statementId: "control-mouse-aim-shoot",
        source: "user-declared",
        strength: "required",
        locked: true,
        confidence: 1,
        evidence: { quotes: ["用鼠标瞄准射击"] },
      },
      {
        statementId: "s-default-primary-platform-pc-keyboard-mouse",
        source: "system-default",
        strength: "required",
        locked: true,
        confidence: 1,
        evidence: { ruleId: "default-primary-platform-pc-keyboard-mouse" },
      },
      {
        statementId: "s-default-secondary-platform-mobile-touch",
        source: "system-default",
        strength: "required",
        locked: true,
        confidence: 1,
        evidence: { ruleId: "default-secondary-platform-mobile-touch" },
      },
      {
        statementId: "constraint-no-boss",
        source: "user-declared",
        strength: "forbidden",
        locked: true,
        confidence: 1,
        evidence: { quotes: ["不要 Boss"] },
      },
      {
        statementId: "s-default-target-engine-cocos-web-h5",
        source: "system-default",
        strength: "required",
        locked: true,
        confidence: 1,
        evidence: { ruleId: "default-target-engine-cocos-web-h5" },
      },
    ],
  };
}

export const UPSTREAM_LOCKED_STATEMENT_IDS =
  upstreamIntentLedgerV2().entries.map((entry) => entry.statementId);

export function survivalGameDesignBody(): GameDesignV2Body {
  return {
    schemaVersion: "2.0.0",
    kind: "GameDesignV2",
    gameplayDesign: {
      coreLoop: {
        id: "gameplay-core-loop",
        summary: "玩家自由移动、鼠标瞄准射击并躲避敌人，坚持到计时结束。",
        actionIds: ["action-move", "action-fire"],
      },
      progression: {
        id: "gameplay-progression",
        model: "timed-survival",
        summary: "对局开始后持续 120 秒，计时结束则进入胜利结算。",
      },
      pacing: {
        id: "gameplay-pacing",
        model: "steady",
        summary: "敌人以固定节奏从四周生成并持续追踪玩家。",
      },
    },
    systemDesign: {
      actors: [
        {
          id: "actor-player",
          role: "player",
          capabilityTags: ["move-2d", "aim-fire"],
        },
        {
          id: "actor-enemy",
          role: "enemy",
          capabilityTags: ["chase-player"],
        },
        {
          id: "actor-player-shot",
          role: "projectile",
          capabilityTags: ["damage-enemy"],
        },
      ],
      resources: [
        {
          id: "resource-health",
          initial: 3,
          min: 0,
          max: 3,
          unit: "hitpoints",
        },
        { id: "resource-score", initial: 0, min: 0, unit: "points" },
      ],
      states: [
        {
          id: "state-session",
          values: ["playing", "settled"],
          initial: "playing",
        },
      ],
      actions: [
        {
          id: "action-move",
          actor: "actor-player",
          kind: "move-2d",
          effects: [
            {
              kind: "behavior",
              behavior: "player-controlled-movement",
              subject: "actor-player",
            },
          ],
        },
        {
          id: "action-fire",
          actor: "actor-player",
          kind: "pointer-fire",
          emits: "event-fire-requested",
          effects: [{ kind: "spawn", actor: "actor-player-shot", count: 1 }],
        },
      ],
      events: [
        { id: "event-game-start" },
        { id: "event-fire-requested" },
        { id: "event-enemy-contact" },
        { id: "event-enemy-destroyed" },
        { id: "survival-complete-elapsed" },
      ],
      timers: [
        {
          id: "survival-complete-timer",
          mode: "delay",
          durationMs: 120000,
          repeat: "once",
          startOn: "event-game-start",
          emits: "survival-complete-elapsed",
        },
      ],
      rules: [
        {
          id: "contact-damage",
          when: { kind: "event", event: "event-enemy-contact" },
          effects: [
            {
              kind: "resource-change",
              resource: "resource-health",
              operation: "decrement",
              amount: 1,
            },
          ],
        },
        {
          id: "destroy-score",
          when: { kind: "event", event: "event-enemy-destroyed" },
          effects: [
            {
              kind: "resource-change",
              resource: "resource-score",
              operation: "increment",
              amount: 100,
            },
          ],
        },
      ],
      processes: [
        {
          id: "enemy-spawn",
          owner: { type: "world" },
          startOn: "event-game-start",
          stopOn: "survival-complete-elapsed",
          cadence: { kind: "interval", intervalMs: 1200 },
          effects: [{ kind: "spawn", actor: "actor-enemy", count: 1 }],
        },
        {
          id: "enemy-chase",
          owner: { type: "actor", id: "actor-enemy" },
          startOn: "event-game-start",
          cadence: { kind: "continuous" },
          effects: [
            {
              kind: "behavior",
              behavior: "chase-target",
              subject: "actor-enemy",
              target: "actor-player",
            },
          ],
        },
      ],
      outcomes: [
        {
          id: "survival-complete",
          result: "won",
          when: { kind: "event", event: "survival-complete-elapsed" },
          priority: 10,
          terminal: true,
        },
        {
          id: "health-depleted",
          result: "lost",
          when: {
            kind: "condition",
            condition: {
              kind: "predicate",
              target: { type: "resource", id: "resource-health" },
              comparator: "lte",
              value: 0,
            },
          },
          priority: 20,
          terminal: true,
        },
      ],
    },
    spatialDesign: {
      viewport: {
        id: "viewport-main",
        orientation: "horizontal",
        logicalWidth: 1280,
        logicalHeight: 720,
        scaling: "uniform",
        letterbox: "allow-bars",
      },
      topology: { id: "topology-room", kind: "bounded-room" },
      movement: [
        {
          id: "movement-player",
          subject: "actor-player",
          dimensions: "2d",
          axes: ["x", "y"],
          constrainedToBoundaryId: "boundary-player",
          speedPerSecond: 300,
        },
        {
          id: "movement-enemy",
          subject: "actor-enemy",
          dimensions: "2d",
          axes: ["x", "y"],
          speedPerSecond: 120,
        },
      ],
      aiming: [
        {
          id: "aiming-player",
          subject: "actor-player",
          mode: "pointer-world-target",
          cooldownMs: 250,
          projectileSpeedPerSecond: 600,
        },
      ],
      camera: { id: "camera-main", mode: "static" },
      spawn: [
        {
          id: "spawn-enemy",
          owner: { type: "world" },
          spawns: "actor-enemy",
          region: "room-perimeter",
          activationEvent: "event-game-start",
          minimumDistance: 160,
          offscreenPolicy: "onscreen-edge",
        },
      ],
      boundaries: [
        {
          id: "boundary-player",
          subject: "actor-player",
          appliesTo: "player",
          behavior: "clamp",
        },
        {
          id: "boundary-shot",
          subject: "actor-player-shot",
          appliesTo: "projectile",
          behavior: "destroy",
        },
      ],
      culling: [
        {
          id: "culling-shot",
          subject: "actor-player-shot",
          appliesTo: "projectile",
          rule: "outside-room",
        },
      ],
    },
    requirementBindings: {
      constraints: [
        { id: "constraint-product", kind: "single-player-bullet-hell-h5" },
        { id: "constraint-primary-input", kind: "pc-keyboard-mouse" },
        { id: "constraint-secondary-input", kind: "mobile-touch-secondary" },
        { id: "constraint-engine", kind: "cocos-web-h5" },
      ],
      exclusions: [{ id: "exclusion-boss", capability: "boss" }],
      decisions: [
        {
          id: "bind-horizontal",
          source: "user-declared",
          statementId: "concept-horizontal-screen",
          targets: [{ nodeId: "viewport-main" }],
        },
        {
          id: "bind-bullet-hell",
          source: "user-declared",
          statementId: "concept-bullet-hell",
          targets: [{ nodeId: "gameplay-core-loop" }],
        },
        {
          id: "bind-product",
          source: "system-default",
          statementId: "s-default-single-player-2d-bullet-hell-h5",
          targets: [{ nodeId: "constraint-product" }],
        },
        {
          id: "bind-movement",
          source: "user-declared",
          statementId: "intent-free-movement",
          targets: [{ nodeId: "movement-player" }],
        },
        {
          id: "bind-shooting",
          source: "user-declared",
          statementId: "intent-shooting",
          targets: [{ nodeId: "action-fire" }],
        },
        {
          id: "bind-survival",
          source: "user-declared",
          statementId: "intent-survive-120s",
          targets: [{ nodeId: "survival-complete" }],
        },
        {
          id: "bind-mouse-aim",
          source: "user-declared",
          statementId: "control-mouse-aim-shoot",
          targets: [{ nodeId: "aiming-player" }],
        },
        {
          id: "bind-primary-input",
          source: "system-default",
          statementId: "s-default-primary-platform-pc-keyboard-mouse",
          targets: [{ nodeId: "constraint-primary-input" }],
        },
        {
          id: "bind-secondary-input",
          source: "system-default",
          statementId: "s-default-secondary-platform-mobile-touch",
          targets: [{ nodeId: "constraint-secondary-input" }],
        },
        {
          id: "bind-engine",
          source: "system-default",
          statementId: "s-default-target-engine-cocos-web-h5",
          targets: [{ nodeId: "constraint-engine" }],
        },
        {
          id: "derive-resource-values",
          source: "agent-derived",
          rationale: "首版生命与计分资源需要有限、可读的初值和边界。",
          targets: [
            { nodeId: "resource-health" },
            { nodeId: "resource-score" },
          ],
        },
        {
          id: "derive-action-values",
          source: "agent-derived",
          rationale: "首版射击动作每次生成一个玩家投射物。",
          targets: [{ nodeId: "action-fire" }],
        },
        {
          id: "derive-rule-values",
          source: "agent-derived",
          rationale: "接触伤害和击毁得分是首版可感知反馈数值。",
          targets: [{ nodeId: "contact-damage" }, { nodeId: "destroy-score" }],
        },
        {
          id: "derive-spawn-values",
          source: "agent-derived",
          rationale: "固定生成节奏与数量形成稳定压力。",
          targets: [{ nodeId: "enemy-spawn" }],
        },
        {
          id: "derive-outcome-values",
          source: "agent-derived",
          rationale: "不同优先级保证同帧胜负有唯一裁决，零血阈值定义失败。",
          targets: [
            { nodeId: "survival-complete" },
            { nodeId: "health-depleted" },
          ],
        },
        {
          id: "derive-spatial-values",
          source: "agent-derived",
          rationale: "逻辑视口、速度、射击节奏和安全距离是首版玩法参数。",
          targets: [
            { nodeId: "viewport-main" },
            { nodeId: "movement-player" },
            { nodeId: "movement-enemy" },
            { nodeId: "aiming-player" },
            { nodeId: "spawn-enemy" },
          ],
        },
      ],
      forbidden: [
        {
          id: "bind-no-boss",
          statementId: "constraint-no-boss",
          exclusion: "exclusion-boss",
        },
      ],
    },
  };
}

export function survivalDesignReadyOutput(): DesignAgentModelOutput {
  return { outcome: "design-ready", gameDesign: survivalGameDesignBody() };
}

export function upstreamRequestRecord() {
  return {
    language: "zh-CN" as const,
    prompt: DESIGN_UPSTREAM_REQUEST_PROMPT,
  };
}

export function upstreamRequestSha256(): string {
  return createHash("sha256")
    .update(DESIGN_UPSTREAM_REQUEST_PROMPT, "utf8")
    .digest("hex");
}

export function compiledSurvivalDesign(): GameDesignV2 {
  return {
    ...survivalGameDesignBody(),
    sources: {
      request: { sha256: upstreamRequestSha256() },
      gameSpec: {
        schemaVersion: "2.0.0",
        sha256: upstreamIntentLedgerV2().gameSpec.sha256,
      },
      intentLedger: {
        schemaVersion: "2.0.0",
        sha256: sha256IntentLedgerV2(upstreamIntentLedgerV2()),
      },
    },
  };
}
