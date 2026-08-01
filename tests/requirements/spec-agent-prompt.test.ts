import { describe, expect, it } from "vitest";

import { buildSpecAgentSystemPrompt } from "../../src/requirements/spec-agent-prompt.js";

// Prompt-layer assertions for the open-ended Spec Agent. The prompt is where the
// SEMANTIC constraints live (things a deterministic schema must not police with
// brittle keyword rules): preserving user-declared numbers, never inventing
// design params, and forbidding synonymous cross-partition duplication (§五.5).

describe("Spec Agent system prompt — semantic guardrails", () => {
  const prompt = buildSpecAgentSystemPrompt();

  it("§一 instructs the model to preserve user-declared numbers verbatim and invent none", () => {
    // It must forbid inventing design parameters…
    expect(prompt).toContain("禁止自行发明用户没有声明的设计参数");
    // …while REQUIRING that explicitly declared numbers survive verbatim.
    expect(prompt).toContain("原样");
    expect(prompt).toContain("三条命");
    expect(prompt).toContain("坚持 120 秒");
    expect(prompt).toContain("最多两种武器");
    // Declared numbers stay in natural language, not a separate numeric field.
    expect(prompt).toContain("不要拆成单独的数值字段");
  });

  it("§五.5 forbids synonymous duplication and cross-partition repetition", () => {
    // One requirement → exactly one canonical statement.
    expect(prompt).toContain("一项用户要求只能有一条 canonical statement");
    // Synonymous / re-worded duplication is explicitly banned…
    expect(prompt).toContain("同义重复");
    // …and so is cross-partition repetition of the same requirement.
    expect(prompt).toContain("禁止在多个分区之间重复");
    // The mouse-aim example: device belongs to controls; gameplay only records
    // the active aim/shoot intent, never re-stating the mouse operation.
    expect(prompt).toContain("使用鼠标瞄准」属于 platformAndControls");
    expect(prompt).toContain("不得再次重复鼠标操作要求");
    // Empty partitions are allowed; padding is forbidden.
    expect(prompt).toContain("分区允许为空");
  });
});
