import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import {
  runSpecAgentClarificationStage,
  runSpecAgentStage,
  type RunSpecAgentStageRequest,
  type SpecAgentV2Analysis,
} from "../../src/orchestration/run-spec-agent-stage.js";
import { SpecAgentModelError } from "../../src/requirements/deepseek-spec-agent-adapter.js";
import { parseSpecStageV2Result } from "../../src/requirements/spec-agent-result.js";
import type { DeepSeekSpecAgentResult } from "../../src/requirements/deepseek-spec-agent-adapter.js";
import type {
  SpecAgentModelOutput,
  SpecStageProvenance,
} from "../../src/requirements/spec-agent-result.js";
import {
  bossForbiddenOutput,
  BOSS_FORBIDDEN_PROMPT,
  bossRequiredOutput,
  BOSS_REQUIRED_PROMPT,
  conflictingClarificationOutput,
  CONFLICTING_PROMPT,
  horizontalFreeMoveOutput,
  HORIZONTAL_FREE_MOVE_PROMPT,
  horizontalSurvivalNumbersOutput,
  HORIZONTAL_SURVIVAL_NUMBERS_PROMPT,
  novelConceptOutput,
  NOVEL_CONCEPT_PROMPT,
  pureDodgeOutput,
  PURE_DODGE_PROMPT,
  survivorOutput,
  SURVIVOR_PROMPT,
  verticalTraditionalOutput,
  VERTICAL_TRADITIONAL_PROMPT,
} from "../fixtures/create-spec-agent-output.js";

const cleanups: Array<() => Promise<void>> = [];
afterAll(async () => {
  for (const cleanup of cleanups) await cleanup();
});

function fixedClock(): () => Date {
  const stamps = [
    new Date("2026-07-30T00:00:00.000Z"),
    new Date("2026-07-30T00:00:01.000Z"),
  ];
  let index = 0;
  return () => stamps[Math.min(index++, stamps.length - 1)]!;
}

/**
 * A stub provenance. Its cost is an EXPLICIT unknown (costKnown:false) so the
 * stub can never be mistaken for a real, priced DeepSeek call (§三). Callers that
 * need to exercise the budget gate override usage.
 */
function stubProvenance(
  usage?: Partial<SpecStageProvenance["usage"]>,
): SpecStageProvenance {
  return {
    provider: "stub",
    model: "deterministic-spec-agent",
    outputMode: "stub",
    usage: {
      cost: 0,
      costKnown: false,
      costEvidence: {
        kind: "unknown",
        currency: "USD",
        reason: "deterministic stub — no real model call, no cost basis.",
      },
      inputTokens: 0,
      outputTokens: 0,
      reasoningTokens: 0,
      ...usage,
    },
  };
}

function stubAnalyze(output: SpecAgentModelOutput): SpecAgentV2Analysis {
  return async (): Promise<DeepSeekSpecAgentResult> => ({
    output,
    provenance: stubProvenance(),
  });
}

function request(prompt: string): RunSpecAgentStageRequest {
  return { language: "zh-CN", prompt };
}

describe("runSpecAgentStage (Orchestrator v2 seam)", () => {
  it("§九.1 horizontal free-move endless survival → spec-ready with bound ledger", async () => {
    const { result, invocation } = await runSpecAgentStage(
      request(HORIZONTAL_FREE_MOVE_PROMPT),
      { analyze: stubAnalyze(horizontalFreeMoveOutput()), now: fixedClock() },
    );
    expect(result.status).toBe("spec-ready");
    if (result.status !== "spec-ready") return;
    expect(result.gameSpecSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(result.intentLedger.gameSpec.sha256).toBe(result.gameSpecSha256);
    expect(result.intentLedger.request.sha256).toBe(result.request.sha256);
    // Provenance must faithfully name the stub, never a real model.
    expect(result.provenance.provider).toBe("stub");
    expect(invocation?.result.status).toBe("succeeded");
  });

  it("§九.2 vertical traditional shmup without Boss/wave counts → spec-ready", async () => {
    const { result } = await runSpecAgentStage(
      request(VERTICAL_TRADITIONAL_PROMPT),
      { analyze: stubAnalyze(verticalTraditionalOutput()) },
    );
    expect(result.status).toBe("spec-ready");
  });

  it("§九.3 pure dodge, no attack, no win condition → spec-ready", async () => {
    const { result } = await runSpecAgentStage(request(PURE_DODGE_PROMPT), {
      analyze: stubAnalyze(pureDodgeOutput()),
    });
    expect(result.status).toBe("spec-ready");
  });

  it("§九.4 survivor-style horde → spec-ready", async () => {
    const { result } = await runSpecAgentStage(request(SURVIVOR_PROMPT), {
      analyze: stubAnalyze(survivorOutput()),
    });
    expect(result.status).toBe("spec-ready");
  });

  it("§九.5 a novel, never-enumerated concept is accepted as free text", async () => {
    const { result } = await runSpecAgentStage(request(NOVEL_CONCEPT_PROMPT), {
      analyze: stubAnalyze(novelConceptOutput()),
    });
    expect(result.status).toBe("spec-ready");
    if (result.status !== "spec-ready") return;
    expect(
      result.gameSpec.gameConcept.some((s) => s.text.includes("引力回声")),
    ).toBe(true);
  });

  it("§九.6 explicit Boss request → spec-ready, ledger marks it user-declared", async () => {
    const { result } = await runSpecAgentStage(request(BOSS_REQUIRED_PROMPT), {
      analyze: stubAnalyze(bossRequiredOutput()),
    });
    expect(result.status).toBe("spec-ready");
    if (result.status !== "spec-ready") return;
    const boss = result.intentLedger.entries.find(
      (e) => e.statementId === "has-boss",
    );
    expect(boss?.source).toBe("user-declared");
    expect(boss?.strength).toBe("required");
  });

  it("§九.7 explicit Boss prohibition → spec-ready, ledger marks it forbidden", async () => {
    const { result } = await runSpecAgentStage(request(BOSS_FORBIDDEN_PROMPT), {
      analyze: stubAnalyze(bossForbiddenOutput()),
    });
    expect(result.status).toBe("spec-ready");
    if (result.status !== "spec-ready") return;
    const boss = result.intentLedger.entries.find(
      (e) => e.statementId === "forbid-boss",
    );
    expect(boss?.strength).toBe("forbidden");
    expect(boss?.locked).toBe(true);
  });

  it("§一 preserves user-declared numbers verbatim without inventing design params", async () => {
    // A horizontal survival request with EXPLICITLY DECLARED numbers: three
    // lives, survive 120 seconds, at most two weapon kinds. The declared numbers
    // must survive VERBATIM inside natural-language statement text, be attributed
    // to the user, and be locked — while the Agent invents no damage / enemy /
    // Boss numbers of its own.
    const { result } = await runSpecAgentStage(
      request(HORIZONTAL_SURVIVAL_NUMBERS_PROMPT),
      { analyze: stubAnalyze(horizontalSurvivalNumbersOutput()) },
    );
    expect(result.status).toBe("spec-ready");
    if (result.status !== "spec-ready") return;

    const texts = result.gameSpec.gameplayIntent.map((s) => s.text);
    // The declared numbers survive verbatim, un-rounded and un-rewritten.
    expect(texts.some((t) => t.includes("三条命"))).toBe(true);
    expect(texts.some((t) => t.includes("120 秒"))).toBe(true);
    expect(texts.some((t) => t.includes("两种武器"))).toBe(true);

    const numericIds = [
      "three-lives",
      "survive-120-seconds",
      "at-most-two-weapons",
    ];
    for (const id of numericIds) {
      const entry = result.intentLedger.entries.find(
        (e) => e.statementId === id,
      );
      expect(entry?.source).toBe("user-declared");
      expect(entry?.strength).toBe("required");
      expect(entry?.locked).toBe(true);
    }

    // The Agent invented NO damage / enemy-count / Boss numbers of its own: every
    // statement is user-declared, and none names those design parameters.
    expect(
      result.intentLedger.entries.every((e) => e.source === "user-declared"),
    ).toBe(true);
    const allText = [
      ...result.gameSpec.gameConcept,
      ...result.gameSpec.gameplayIntent,
      ...result.gameSpec.platformAndControls,
      ...result.gameSpec.additionalConstraints,
    ].map((s) => s.text);
    expect(allText.some((t) => t.includes("伤害"))).toBe(false);
    expect(allText.some((t) => t.includes("Boss"))).toBe(false);
    expect(allText.some((t) => t.includes("敌人数"))).toBe(false);
  });

  it("§九.13/14 genuinely conflicting requirements → needs-clarification (≤3 questions)", async () => {
    const { result } = await runSpecAgentStage(request(CONFLICTING_PROMPT), {
      analyze: stubAnalyze(conflictingClarificationOutput()),
    });
    expect(result.status).toBe("needs-clarification");
    if (result.status !== "needs-clarification") return;
    expect(result.questions.length).toBeGreaterThan(0);
    expect(result.questions.length).toBeLessThanOrEqual(3);
    expect(result.partialSpec.kind).toBe("PartialGameSpecV2");
  });

  it("§九.15 out-of-scope product → bounded-failure(unsupported-product)", async () => {
    const output: SpecAgentModelOutput = {
      outcome: "bounded-failure",
      failure: {
        code: "unsupported-product",
        message: "多人 3D 赛车超出当前弹幕类 H5 产品边界。",
        retryable: false,
      },
    };
    const { result } = await runSpecAgentStage(
      request("帮我生成一个多人 3D 赛车游戏。"),
      { analyze: stubAnalyze(output) },
    );
    expect(result.status).toBe("bounded-failure");
    if (result.status !== "bounded-failure") return;
    expect(result.failure.code).toBe("unsupported-product");
  });

  it("§九.21 fails closed when the model client throws", async () => {
    const { result } = await runSpecAgentStage(
      request(HORIZONTAL_FREE_MOVE_PROMPT),
      {
        analyze: async () => {
          throw new SpecAgentModelError(
            "model-failure",
            "network exploded",
            true,
          );
        },
      },
    );
    expect(result.status).toBe("bounded-failure");
    if (result.status !== "bounded-failure") return;
    expect(result.failure.code).toBe("model-failure");
    expect(result.failure.message).toContain("network exploded");
  });

  it("fails closed on invalid model output rather than repairing it", async () => {
    // A model output that survives the model-output schema but fails ledger
    // verification (a quote that isn't in the request) must NOT be silently
    // repaired into success.
    const output = horizontalFreeMoveOutput();
    if (output.outcome !== "spec-ready") throw new Error("bad fixture");
    const tampered: SpecAgentModelOutput = {
      ...output,
      ledger: output.ledger.map((entry) =>
        entry.statementId === "no-boss" && entry.source === "user-declared"
          ? { ...entry, evidence: { quotes: ["用户从未说过"] } }
          : entry,
      ),
    };
    const { result } = await runSpecAgentStage(
      request(HORIZONTAL_FREE_MOVE_PROMPT),
      { analyze: stubAnalyze(tampered) },
    );
    expect(result.status).toBe("bounded-failure");
    if (result.status !== "bounded-failure") return;
    expect(result.failure.code).toBe("invalid-agent-output");
    expect(result.failure.message).toContain(
      "IntentLedger verification failed",
    );
  });

  it("§九.20 persists a spec-ready artifact atomically as pure JSON", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "spec-agent-stage-"));
    cleanups.push(() => rm(dir, { recursive: true, force: true }));
    const outputPath = path.join(dir, "spec-stage-v2-result.json");

    const { result } = await runSpecAgentStage(
      request(HORIZONTAL_FREE_MOVE_PROMPT),
      { analyze: stubAnalyze(horizontalFreeMoveOutput()), outputPath },
    );
    const written = JSON.parse(await readFile(outputPath, "utf8")) as unknown;
    expect(parseSpecStageV2Result(written)).toEqual(result);
  });

  it("§九.20 persists a bounded-failure artifact atomically as pure JSON", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "spec-agent-stage-fail-"));
    cleanups.push(() => rm(dir, { recursive: true, force: true }));
    const outputPath = path.join(dir, "spec-stage-v2-result.json");

    const { result } = await runSpecAgentStage(
      request(HORIZONTAL_FREE_MOVE_PROMPT),
      {
        analyze: async () => {
          throw new SpecAgentModelError("model-failure", "boom", false);
        },
        outputPath,
      },
    );
    const written = JSON.parse(await readFile(outputPath, "utf8")) as unknown;
    const parsed = parseSpecStageV2Result(written);
    expect(parsed.status).toBe("bounded-failure");
    expect(parsed).toEqual(result);
  });

  it("fails closed with model-failure when the model usage exceeds the budget", async () => {
    const output = horizontalFreeMoveOutput();
    const analyze: SpecAgentV2Analysis = async () => ({
      output,
      provenance: stubProvenance({ inputTokens: 5_000_000 }),
    });
    const { result, invocation } = await runSpecAgentStage(
      request(HORIZONTAL_FREE_MOVE_PROMPT),
      { analyze, budget: { maxAttempts: 1, maxTokens: 1_000 } },
    );
    expect(result.status).toBe("bounded-failure");
    if (result.status !== "bounded-failure") return;
    expect(result.failure.code).toBe("model-failure");
    expect(invocation).toBeUndefined();
  });
});

// §二 — the production Orchestrator entry for the SECOND clarification round.
// These tests prove the continuation is model-free, deterministically validated,
// and fail-closed on any locked-statement tampering or malformed answer set,
// with no unverified artifact ever reaching outputPath.
describe("runSpecAgentClarificationStage (Orchestrator v2 continuation)", () => {
  /** A first-round needs-clarification result from the conflict fixture. */
  async function firstRound() {
    const { result } = await runSpecAgentStage(request(CONFLICTING_PROMPT), {
      analyze: stubAnalyze(conflictingClarificationOutput()),
    });
    if (result.status !== "needs-clarification") {
      throw new Error("expected a first-round needs-clarification result");
    }
    return result;
  }

  /** A valid, fully-referenced answer to the single fixture question. */
  function answerTo(clarification: {
    questions: readonly { questionId: string }[];
    clarificationId: string;
    clarificationContextSha256: string;
  }) {
    return {
      questionId: clarification.questions[0]!.questionId,
      clarificationId: clarification.clarificationId,
      clarificationContextSha256: clarification.clarificationContextSha256,
      answer: "以纯躲避为准，玩家不能攻击，也不需要 Boss。",
    };
  }

  /**
   * A round-2 spec-ready model output. `locked` controls how the first-round
   * locked statement (wants-dodge-only, forbidden) is treated so tests can prove
   * preservation vs. every kind of tampering.
   */
  function round2SpecReady(
    locked:
      | { kind: "preserve" }
      | { kind: "delete" }
      | { kind: "rewrite" }
      | { kind: "downgrade" }
      | { kind: "move" } = { kind: "preserve" },
  ): SpecAgentModelOutput {
    const gameplayIntent: Array<{ statementId: string; text: string }> = [];
    const platformAndControls: Array<{ statementId: string; text: string }> =
      [];
    const entries: Array<Record<string, unknown>> = [];

    if (locked.kind !== "delete") {
      const text =
        locked.kind === "rewrite"
          ? "用户其实希望可以攻击。"
          : "用户希望是纯躲避、玩家不能攻击的玩法。";
      const statement = { statementId: "wants-dodge-only", text };
      if (locked.kind === "move") {
        platformAndControls.push(statement);
      } else {
        gameplayIntent.push(statement);
      }
      entries.push({
        statementId: "wants-dodge-only",
        source: "user-declared",
        strength: locked.kind === "downgrade" ? "preferred" : "forbidden",
        locked: true,
        confidence: 0.9,
        evidence: { quotes: ["玩家绝不能攻击"] },
      });
    }

    // A newly-resolved statement so the spec is non-empty and coherent.
    gameplayIntent.push({
      statementId: "resolved-dodge-only",
      text: "澄清后确认：游戏保持纯躲避，玩家不攻击。",
    });
    entries.push({
      statementId: "resolved-dodge-only",
      source: "agent-inferred",
      strength: "preferred",
      locked: false,
      confidence: 0.6,
      evidence: { rationale: "根据用户回答消解冲突：选择纯躲避。" },
    });

    return {
      outcome: "spec-ready",
      gameSpec: {
        schemaVersion: "2.0.0",
        kind: "GameSpecV2",
        gameConcept: [],
        gameplayIntent,
        platformAndControls,
        additionalConstraints: [],
      },
      ledger: entries,
    } as unknown as SpecAgentModelOutput;
  }

  it("resolves a valid continuation to spec-ready while preserving the locked statement", async () => {
    const clarification = await firstRound();
    const { result, invocation } = await runSpecAgentClarificationStage(
      { clarification, answers: [answerTo(clarification)] },
      { analyze: stubAnalyze(round2SpecReady({ kind: "preserve" })) },
    );
    expect(result.status).toBe("spec-ready");
    if (result.status !== "spec-ready") return;
    const locked = result.intentLedger.entries.find(
      (e) => e.statementId === "wants-dodge-only",
    );
    expect(locked?.strength).toBe("forbidden");
    expect(locked?.locked).toBe(true);
    // The invocation is bound to the first-round clarification context hash.
    expect(
      invocation?.inputs.some(
        (i) =>
          i.kind === "ClarificationContext" &&
          i.sha256 === clarification.clarificationContextSha256,
      ),
    ).toBe(true);
  });

  it("fails closed (invalid-agent-output) when round 2 deletes a locked statement", async () => {
    const clarification = await firstRound();
    const { result } = await runSpecAgentClarificationStage(
      { clarification, answers: [answerTo(clarification)] },
      { analyze: stubAnalyze(round2SpecReady({ kind: "delete" })) },
    );
    expect(result.status).toBe("bounded-failure");
    if (result.status !== "bounded-failure") return;
    expect(result.failure.code).toBe("invalid-agent-output");
    expect(result.failure.message).toContain("locked statement");
  });

  it("fails closed when round 2 rewrites / downgrades / moves a locked statement", async () => {
    const clarification = await firstRound();
    for (const kind of ["rewrite", "downgrade", "move"] as const) {
      const { result } = await runSpecAgentClarificationStage(
        { clarification, answers: [answerTo(clarification)] },
        { analyze: stubAnalyze(round2SpecReady({ kind })) },
      );
      expect(result.status).toBe("bounded-failure");
      if (result.status !== "bounded-failure") continue;
      expect(result.failure.code).toBe("invalid-agent-output");
    }
  });

  it("rejects a missing / unknown / duplicate answer BEFORE any model call, writing no artifact", async () => {
    const clarification = await firstRound();
    const dir = await mkdtemp(path.join(tmpdir(), "spec-agent-clar-"));
    cleanups.push(() => rm(dir, { recursive: true, force: true }));
    const outputPath = path.join(dir, "spec-stage-v2-result.json");

    let modelCalls = 0;
    const analyze: SpecAgentV2Analysis = async () => {
      modelCalls += 1;
      return { output: round2SpecReady(), provenance: stubProvenance() };
    };

    // No answers → the single fixture question is missing.
    await expect(
      runSpecAgentClarificationStage(
        { clarification, answers: [] },
        { analyze, outputPath },
      ),
    ).rejects.toMatchObject({ code: "missing-answer" });

    // A duplicate answer.
    const answer = answerTo(clarification);
    await expect(
      runSpecAgentClarificationStage(
        { clarification, answers: [answer, { ...answer }] },
        { analyze, outputPath },
      ),
    ).rejects.toMatchObject({ code: "duplicate-answer" });

    // An answer for a question that is not in this round.
    await expect(
      runSpecAgentClarificationStage(
        {
          clarification,
          answers: [{ ...answer, questionId: "q-does-not-exist" }],
        },
        { analyze, outputPath },
      ),
    ).rejects.toMatchObject({ code: "unknown-question" });

    // An answer that cites a different clarification context hash.
    await expect(
      runSpecAgentClarificationStage(
        {
          clarification,
          answers: [{ ...answer, clarificationContextSha256: "0".repeat(64) }],
        },
        { analyze, outputPath },
      ),
    ).rejects.toMatchObject({ code: "context-mismatch" });

    // The model was never called and NO artifact was written.
    expect(modelCalls).toBe(0);
    await expect(readFile(outputPath, "utf8")).rejects.toThrow();
  });

  it("persists the final artifact only after the locked-statement gate passes", async () => {
    const clarification = await firstRound();

    // A violating round 2 must NOT leave a spec-ready artifact on disk.
    const failDir = await mkdtemp(path.join(tmpdir(), "spec-agent-clar-fail-"));
    cleanups.push(() => rm(failDir, { recursive: true, force: true }));
    const failPath = path.join(failDir, "spec-stage-v2-result.json");
    const { result: failed } = await runSpecAgentClarificationStage(
      { clarification, answers: [answerTo(clarification)] },
      {
        analyze: stubAnalyze(round2SpecReady({ kind: "delete" })),
        outputPath: failPath,
      },
    );
    const failWritten = JSON.parse(await readFile(failPath, "utf8")) as unknown;
    const failParsed = parseSpecStageV2Result(failWritten);
    // What lands on disk is the fail-closed bounded-failure, never a success.
    expect(failParsed.status).toBe("bounded-failure");
    expect(failParsed).toEqual(failed);

    // A valid round 2 persists the verified spec-ready artifact.
    const okDir = await mkdtemp(path.join(tmpdir(), "spec-agent-clar-ok-"));
    cleanups.push(() => rm(okDir, { recursive: true, force: true }));
    const okPath = path.join(okDir, "spec-stage-v2-result.json");
    const { result: ok } = await runSpecAgentClarificationStage(
      { clarification, answers: [answerTo(clarification)] },
      {
        analyze: stubAnalyze(round2SpecReady({ kind: "preserve" })),
        outputPath: okPath,
      },
    );
    const okWritten = JSON.parse(await readFile(okPath, "utf8")) as unknown;
    expect(parseSpecStageV2Result(okWritten)).toEqual(ok);
    expect(ok.status).toBe("spec-ready");
  });
});
