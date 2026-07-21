import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  naturalLanguageProbeCasePath,
  parseNaturalLanguageProbeCase,
  preflightNaturalLanguageProbePrompt,
} from "../../src/evaluation/natural-language-probe-case.js";

describe("natural-language probe cases", () => {
  it("preserves the simplified v2 request as a safe independent case", async () => {
    const relativePath = naturalLanguageProbeCasePath(
      "natural-language-probe-v2.json",
    );
    const probe = parseNaturalLanguageProbeCase(
      JSON.parse(
        await readFile(
          new URL(`../../${relativePath}`, import.meta.url),
          "utf8",
        ),
      ),
    );

    expect(probe.caseId).toBe("three-wave-boss-probe");
    expect(probe.prompt).toContain("三波敌人");
    expect(probe.prompt).toContain("击败 Boss 获胜");
    expect(probe.prompt).not.toMatch(/30\s*秒/u);
    expect(probe.prompt).not.toContain("三阶段");
    expect(preflightNaturalLanguageProbePrompt(probe.prompt)).toMatchObject({
      status: "passed",
      unsafePatternCount: 0,
    });
  });
});
