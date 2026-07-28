import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import type { RequirementAnalysisResult } from "../../src/requirements/requirement-analyzer.js";
import { RequirementAnalysisError } from "../../src/requirements/requirement-analyzer.js";
import {
  runSpecStage,
  type RunSpecStageRequest,
  type SpecStageResult,
} from "../../src/orchestration/run-spec-stage.js";
import type { ShooterGameSpec } from "../../src/requirements/shooter-game-spec.js";
import { createValidSpec } from "../fixtures/create-valid-spec.js";

const cleanups: Array<() => Promise<void>> = [];

afterAll(async () => {
  for (const cleanup of cleanups) await cleanup();
});

function stubAnalysis(spec: ShooterGameSpec): RequirementAnalysisResult {
  return {
    spec,
    outputMode: "structured",
    usage: { cost: 0, inputTokens: 0, outputTokens: 0, reasoningTokens: 0 },
  };
}

function verticalSpec(): ShooterGameSpec {
  return { ...createValidSpec(), orientation: "vertical" };
}

function horizontalSpec(): ShooterGameSpec {
  const spec = createValidSpec();
  return {
    ...spec,
    orientation: "horizontal",
    viewport: { ...spec.viewport, logicalWidth: 1_024, logicalHeight: 576 },
  };
}

describe("runSpecStage (Orchestrator seam)", () => {
  const request: RunSpecStageRequest = {
    language: "zh-CN",
    prompt: "生成一个纵版弹幕射击游戏，玩家控制白鹤对抗黑龙。",
  };

  it("advances a valid analysis to a spec-ready record carrying orientation", async () => {
    const result = await runSpecStage(request, {
      analyze: async () => stubAnalysis(verticalSpec()),
    });

    expect(result.status).toBe("spec-ready");
    if (result.status !== "spec-ready") return;
    expect(result.orientation).toBe("vertical");
    expect(result.request.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(result.completion.notes.length).toBeGreaterThan(0);
  });

  it("records a deterministic playability completion in the ledger notes", async () => {
    const result = await runSpecStage(request, {
      analyze: async () => stubAnalysis(verticalSpec()),
    });

    expect(result.status).toBe("spec-ready");
    if (result.status !== "spec-ready") return;
    // createValidSpec has Boss-defeat + agent-owned health below ceiling, so the
    // deterministic playability policy applies and raises maxHealth to 60.
    expect(result.completion.playabilityApplied).toBe(true);
    expect(result.spec.player.maxHealth).toBe(60);
    expect(
      result.completion.notes.some((note) =>
        note.includes("playability completion applied"),
      ),
    ).toBe(true);
  });

  it("preserves a horizontal orientation end-to-end", async () => {
    const result = await runSpecStage(request, {
      analyze: async () => stubAnalysis(horizontalSpec()),
    });

    expect(result.status).toBe("spec-ready");
    if (result.status !== "spec-ready") return;
    expect(result.orientation).toBe("horizontal");
    expect(result.spec.viewport.logicalWidth).toBeGreaterThan(
      result.spec.viewport.logicalHeight,
    );
  });

  it("turns an analyzer failure into a structured bounded-failure record", async () => {
    const result = await runSpecStage(request, {
      analyze: async () => {
        throw new RequirementAnalysisError("request too short");
      },
    });

    expect(result.status).toBe("bounded-failure");
    if (result.status !== "bounded-failure") return;
    expect(result.failure.name).toBe("RequirementAnalysisError");
    expect(result.failure.message).toContain("request too short");
  });

  it("persists the result as a pure-data JSON artifact when an outputPath is set", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "run-spec-stage-"));
    cleanups.push(() => rm(dir, { recursive: true, force: true }));
    const outputPath = path.join(dir, "spec-stage-result.json");

    const result = await runSpecStage(request, {
      analyze: async () => stubAnalysis(verticalSpec()),
      outputPath,
    });

    const written = JSON.parse(
      await readFile(outputPath, "utf8"),
    ) as SpecStageResult;
    expect(written).toEqual(result);
    expect(written.kind).toBe("spec-stage-result");
  });
});
