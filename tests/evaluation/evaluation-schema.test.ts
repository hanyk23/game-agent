import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  EvaluationBatchDefinitionSchema,
  EvaluationBatchReportSchema,
} from "../../src/evaluation/evaluation-schema.js";
import {
  createEvaluationDirectory,
  summarizeEvaluationCases,
} from "../../src/evaluation/evaluation-runner.js";
import { createPhase6RehearsalDefinition } from "../../src/evaluation/phase-6-rehearsal.js";

describe("Phase 6 evaluation evidence", () => {
  it("creates the missing evaluation parent directory", async () => {
    const projectDirectory = await mkdtemp(
      path.join(tmpdir(), "phase-6-evaluation-"),
    );
    try {
      const evaluationDirectory = await createEvaluationDirectory(
        projectDirectory,
        "00000000-0000-4000-8000-000000000001",
      );
      expect(evaluationDirectory).toContain("artifacts");
    } finally {
      await rm(projectDirectory, { recursive: true, force: true });
    }
  });

  it("defines three materially distinct valid local Specs with no paid calls", () => {
    const definition = createPhase6RehearsalDefinition();
    expect(EvaluationBatchDefinitionSchema.parse(definition)).toEqual(
      definition,
    );
    expect(definition.paidModelCallsAllowed).toBe(false);
    expect(definition.cases).toHaveLength(3);
    expect(new Set(definition.cases.map((entry) => entry.caseId)).size).toBe(3);
    expect(
      new Set(definition.cases.map((entry) => entry.spec.winCondition.type)),
    ).toEqual(new Set(["bossDefeated", "scoreReached", "surviveMs"]));
    expect(
      new Set(definition.cases.map((entry) => entry.spec.difficulty)),
    ).toEqual(new Set(["easy", "medium", "hard"]));
  });

  it("rejects duplicate case IDs", () => {
    const definition = createPhase6RehearsalDefinition();
    definition.cases[1]!.caseId = definition.cases[0]!.caseId;
    expect(() => EvaluationBatchDefinitionSchema.parse(definition)).toThrow(
      /duplicate evaluation case id/,
    );
  });

  it("aggregates failures, gates, repairs, interventions, tokens, and cost", () => {
    const definition = createPhase6RehearsalDefinition();
    const base = {
      reportVersion: "1.0.0" as const,
      request: definition.cases[0]!.request,
      inputKind: "local-spec" as const,
      expectedDifferentiators: definition.cases[0]!.expectedDifferentiators,
      startedAt: "2026-07-16T00:00:00.000Z",
      completedAt: "2026-07-16T00:00:01.000Z",
      elapsedMs: 1_000,
      runId: null,
      runState: null,
      runDirectory: null,
      diskBytes: 100,
      repair: {
        maximumRounds: 3,
        usedRounds: 0,
        attempted: false,
        outcome: "not-needed" as const,
      },
      manualIntervention: { required: false, count: 0 },
      modelUsage: {
        requestCount: 0,
        inputTokens: 0,
        outputTokens: 0,
        cost: { currency: "CNY" as const, amount: 0 },
      },
      evidence: {
        manifestPath: null,
        browserReportPath: null,
        desktopScreenshotPath: null,
        mobileScreenshotPath: null,
        artifactHashes: {},
      },
    };
    const passed = {
      ...base,
      caseId: "passed-case",
      status: "passed" as const,
      gates: {
        specValidation: "passed" as const,
        planning: "passed" as const,
        composition: "passed" as const,
        build: "passed" as const,
        desktopBrowser: "passed" as const,
        mobileBrowser: "passed" as const,
        packaging: "passed" as const,
      },
      failure: null,
    };
    const failed = {
      ...base,
      caseId: "failed-case",
      status: "failed" as const,
      gates: {
        ...passed.gates,
        desktopBrowser: "failed" as const,
        mobileBrowser: "not-run" as const,
        packaging: "not-run" as const,
      },
      failure: {
        stage: "browser" as const,
        category: "browser-verification-failed" as const,
        code: "outcome-mismatch",
        message: "Configured outcome was not accepted.",
      },
      repair: {
        ...base.repair,
        outcome: "not-attempted-no-bounded-proposal" as const,
      },
    };
    const cases = [passed, failed, { ...passed, caseId: "passed-case-two" }];
    const aggregate = summarizeEvaluationCases(cases, 3_000);
    expect(aggregate).toMatchObject({
      totalCases: 3,
      passedCases: 2,
      failedCases: 1,
      browserViewportPasses: 4,
      elapsedMs: 3_000,
      diskBytes: 300,
      repairRounds: 0,
      manualInterventions: 0,
      modelRequests: 0,
      inputTokens: 0,
      outputTokens: 0,
      cost: { currency: "CNY", amount: 0 },
      failureCounts: [{ category: "browser-verification-failed", count: 1 }],
    });
  });

  it("requires a complete report rather than accepting paid-call evidence", () => {
    expect(() =>
      EvaluationBatchReportSchema.parse({
        paidModelCallsAllowed: true,
      }),
    ).toThrow();
  });
});
