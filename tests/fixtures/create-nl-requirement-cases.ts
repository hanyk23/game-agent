import type { ShooterGameSpec } from "../../src/requirements/shooter-game-spec.js";
import { createValidSpec } from "./create-valid-spec.js";

/**
 * Natural-language requirement cases for the direction-neutral Spec Agent.
 *
 * These are deterministic fixtures (no live LLM): each valid case carries a
 * `buildSpec()` that returns the ShooterGameSpec a well-behaved analyzer is
 * expected to produce for the prompt, including an `orientation` that matches
 * both the request and the viewport aspect. Tests and the run-spec-stage
 * orchestrator drive a mock analyzer with these specs.
 *
 * Coverage guaranteed by tests: ≥10 cases, ≥3 horizontal, ≥3 vertical, ≥2
 * direction-unspecified (auto-completed to vertical), varied style / difficulty /
 * pickup presence, and ≥1 bounded-failure (unsatisfiable) request.
 */
export type NlRequirementDirection = "vertical" | "horizontal" | "unspecified";

export type NlRequirementCase = Readonly<{
  id: string;
  prompt: string;
  /** Whether a compliant pipeline should accept or bounded-fail the request. */
  expected: "valid" | "bounded_failure";
  /** Direction as expressed in the prompt (before any auto-completion). */
  requestedDirection: NlRequirementDirection;
  /**
   * Orientation the resulting spec should carry. For direction-unspecified
   * requests this is the auto-completed default ("vertical"). Absent for
   * bounded-failure cases that never yield a spec.
   */
  expectedOrientation?: "vertical" | "horizontal";
  /** True when the orientation was auto-completed rather than user-stated. */
  orientationAutoCompleted?: boolean;
  /** Deterministic spec a compliant analyzer should emit (valid cases only). */
  buildSpec?: () => ShooterGameSpec;
}>;

type SpecOptions = Readonly<{
  orientation: "vertical" | "horizontal";
  difficulty: ShooterGameSpec["difficulty"];
  title: string;
  visualStyle: string[];
  withPickups: boolean;
}>;

function buildSpecVariant(options: SpecOptions): ShooterGameSpec {
  const spec = createValidSpec();
  spec.title = options.title;
  spec.difficulty = options.difficulty;
  spec.visualStyle = options.visualStyle;
  spec.orientation = options.orientation;
  spec.viewport =
    options.orientation === "horizontal"
      ? { ...spec.viewport, logicalWidth: 1_024, logicalHeight: 576 }
      : { ...spec.viewport, logicalWidth: 540, logicalHeight: 960 };
  if (!options.withPickups) {
    spec.pickups = [];
  }
  return spec;
}

export const NL_REQUIREMENT_CASES: readonly NlRequirementCase[] = [
  // ── Horizontal (≥3) ──────────────────────────────────────────────────────
  {
    id: "horizontal-space-armada",
    prompt:
      "制作一个横版太空弹幕射击游戏，玩家驾驶战机从左向右推进，高难度，包含护盾和火力强化拾取，Boss 是三阶段母舰。",
    expected: "valid",
    requestedDirection: "horizontal",
    expectedOrientation: "horizontal",
    orientationAutoCompleted: false,
    buildSpec: () =>
      buildSpecVariant({
        orientation: "horizontal",
        difficulty: "hard",
        title: "Space Armada",
        visualStyle: ["vector", "glow"],
        withPickups: true,
      }),
  },
  {
    id: "horizontal-desert-runner",
    prompt:
      "做一个横屏卷轴的沙漠机甲弹幕游戏，中等难度，不需要任何道具拾取，专注躲弹和击败最终 Boss。",
    expected: "valid",
    requestedDirection: "horizontal",
    expectedOrientation: "horizontal",
    orientationAutoCompleted: false,
    buildSpec: () =>
      buildSpecVariant({
        orientation: "horizontal",
        difficulty: "medium",
        title: "Desert Runner",
        visualStyle: ["cartoon", "clean"],
        withPickups: false,
      }),
  },
  {
    id: "horizontal-reef-drift",
    prompt:
      "生成一个横版海底珊瑚礁弹幕游戏，画面柔和、适合新手（简单难度），带有治疗拾取。",
    expected: "valid",
    requestedDirection: "horizontal",
    expectedOrientation: "horizontal",
    orientationAutoCompleted: false,
    buildSpec: () =>
      buildSpecVariant({
        orientation: "horizontal",
        difficulty: "easy",
        title: "Reef Drift",
        visualStyle: ["soft", "particle"],
        withPickups: true,
      }),
  },
  // ── Vertical (≥3) ────────────────────────────────────────────────────────
  {
    id: "vertical-ink-crane",
    prompt:
      "生成一个水墨风纵版弹幕射击游戏，玩家控制白鹤发射羽毛，Boss 是三阶段黑龙，难度中等，带治疗拾取。",
    expected: "valid",
    requestedDirection: "vertical",
    expectedOrientation: "vertical",
    orientationAutoCompleted: false,
    buildSpec: () =>
      buildSpecVariant({
        orientation: "vertical",
        difficulty: "medium",
        title: "Ink Crane",
        visualStyle: ["ink-painting", "high-contrast"],
        withPickups: true,
      }),
  },
  {
    id: "vertical-neon-ascent",
    prompt:
      "制作竖屏霓虹赛博主题弹幕射击，玩家飞船向上突进，高难度，没有拾取道具，Boss 多阶段。",
    expected: "valid",
    requestedDirection: "vertical",
    expectedOrientation: "vertical",
    orientationAutoCompleted: false,
    buildSpec: () =>
      buildSpecVariant({
        orientation: "vertical",
        difficulty: "hard",
        title: "Neon Ascent",
        visualStyle: ["glow", "electric"],
        withPickups: false,
      }),
  },
  {
    id: "vertical-forest-spirit",
    prompt:
      "生成温暖绘本风格的纵版森林精灵射击游戏，简单难度，玩家用种子子弹，带分数奖励拾取。",
    expected: "valid",
    requestedDirection: "vertical",
    expectedOrientation: "vertical",
    orientationAutoCompleted: false,
    buildSpec: () =>
      buildSpecVariant({
        orientation: "vertical",
        difficulty: "easy",
        title: "Forest Spirit",
        visualStyle: ["soft", "cartoon"],
        withPickups: true,
      }),
  },
  {
    id: "vertical-clockwork-sky",
    prompt:
      "制作蒸汽朋克天空主题的纵版弹幕游戏，黄铜飞艇对抗机械鸟，中等难度，无拾取。",
    expected: "valid",
    requestedDirection: "vertical",
    expectedOrientation: "vertical",
    orientationAutoCompleted: false,
    buildSpec: () =>
      buildSpecVariant({
        orientation: "vertical",
        difficulty: "medium",
        title: "Clockwork Sky",
        visualStyle: ["retro", "raster"],
        withPickups: false,
      }),
  },
  // ── Direction unspecified (≥2) → auto-complete to vertical ────────────────
  {
    id: "unspecified-candy-dream",
    prompt:
      "做一个糖果梦境风格的轻度弹幕游戏，颜色柔和，简单难度，带治疗拾取，让玩家放松。",
    expected: "valid",
    requestedDirection: "unspecified",
    expectedOrientation: "vertical",
    orientationAutoCompleted: true,
    buildSpec: () =>
      buildSpecVariant({
        orientation: "vertical",
        difficulty: "easy",
        title: "Candy Dream",
        visualStyle: ["soft", "pixel-art"],
        withPickups: true,
      }),
  },
  {
    id: "unspecified-volcanic-dragon",
    prompt:
      "生成火山龙穴主题的高难度弹幕射击游戏，强调扇形和瞄准弹，Boss 有多个阶段，不需要拾取。",
    expected: "valid",
    requestedDirection: "unspecified",
    expectedOrientation: "vertical",
    orientationAutoCompleted: true,
    buildSpec: () =>
      buildSpecVariant({
        orientation: "vertical",
        difficulty: "hard",
        title: "Volcanic Dragon",
        visualStyle: ["particle", "electric"],
        withPickups: false,
      }),
  },
  // ── Bounded failure (≥1): unsatisfiable / underspecified request ──────────
  {
    id: "insufficient-request",
    prompt: "做个游戏。",
    expected: "bounded_failure",
    requestedDirection: "unspecified",
  },
];
