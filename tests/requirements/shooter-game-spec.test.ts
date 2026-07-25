import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  parseShooterGameSpec,
  toShooterGameSpecJsonSchema,
  validateShooterGameSpec,
} from "../../src/requirements/shooter-game-spec.js";
import { createValidSpec } from "../fixtures/create-valid-spec.js";

describe("ShooterGameSpec", () => {
  it("accepts a complete valid specification", () => {
    expect(parseShooterGameSpec(createValidSpec())).toEqual(createValidSpec());
  });

  it("rejects unknown fields instead of accepting executable extensions", () => {
    const input = { ...createValidSpec(), shellCommand: "rm -rf ." };
    const result = validateShooterGameSpec(input);

    expect(result.success).toBe(false);
  });

  it("rejects invalid numeric budgets", () => {
    const input = createValidSpec();
    input.viewport.maxEnemyBullets = 10_000;

    expect(validateShooterGameSpec(input).success).toBe(false);
  });

  it("rejects missing cross-referenced assets", () => {
    const input = createValidSpec();
    input.player.assetQueryId = "missing-player";
    const result = validateShooterGameSpec(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes("unknown asset"),
        ),
      ).toBe(true);
    }
  });

  it("rejects missing cross-referenced bullet patterns", () => {
    const input = createValidSpec();
    input.boss.phases[0]!.patternIds = ["missing-pattern"];
    const result = validateShooterGameSpec(input);

    expect(result.success).toBe(false);
  });

  it("requires descending boss phase thresholds", () => {
    const input = createValidSpec();
    input.boss.phases[1]!.healthThreshold = 1;

    expect(validateShooterGameSpec(input).success).toBe(false);
  });

  it("requires pattern-specific parameters", () => {
    const input = createValidSpec();
    delete input.bulletPatterns[1]!.rotationSpeed;

    expect(validateShooterGameSpec(input).success).toBe(false);
  });

  it("exports a strict JSON Schema for OpenCode structured output", () => {
    const schema = toShooterGameSpecJsonSchema();

    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.type).toBe("object");
    expect(schema.additionalProperties).toBe(false);
  });

  it("maintains at least ten prompt fixtures with explicit expected outcomes", async () => {
    const file = new URL(
      "../../evals/cases/requirement-prompts.json",
      import.meta.url,
    );
    const fixtures = JSON.parse(await readFile(file, "utf8")) as Array<{
      id: string;
      prompt: string;
      expected: "valid" | "bounded_failure";
    }>;

    expect(fixtures).toHaveLength(10);
    expect(new Set(fixtures.map((fixture) => fixture.id)).size).toBe(10);
    expect(fixtures.every((fixture) => fixture.prompt.trim().length > 0)).toBe(
      true,
    );
    expect(
      fixtures.some((fixture) => fixture.expected === "bounded_failure"),
    ).toBe(true);
  });
});
