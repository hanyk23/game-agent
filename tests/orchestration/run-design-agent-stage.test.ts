import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import {
  runDesignAgentStage,
  type DesignAgentV2Analysis,
  type RunDesignAgentStageInput,
} from "../../src/orchestration/run-design-agent-stage.js";
import {
  parseDesignStageV2Result,
  type DesignAgentModelOutput,
  type DesignStageProvenance,
} from "../../src/requirements/design-agent-result.js";
import { sha256GameDesignV2 } from "../../src/gameplay/game-design-v2.js";
import { sha256GameSpecV2 } from "../../src/requirements/game-spec-v2.js";
import { sha256IntentLedgerV2 } from "../../src/requirements/intent-ledger-v2.js";
import {
  survivalDesignReadyOutput,
  upstreamGameSpecV2,
  upstreamIntentLedgerV2,
  upstreamRequestRecord,
  upstreamRequestSha256,
} from "../fixtures/create-design-agent-output.js";

/**
 * runDesignAgentStage tests (batch prompt §二十 tests 50-60). A deterministic
 * stub executor drives the full seam:
 *   GameSpecV2 + IntentLedgerV2 → Design Agent seam → GameDesignV2 → AgentInvocation.
 * The Orchestrator is model-free: it only verifies inputs, hash-binds them,
 * re-validates the model output, attaches the authoritative source hashes, runs
 * the consistency validator, enforces the budget, and returns exactly one of the
 * three states. Clarification / bounded-failure are NEVER promoted to design-ready.
 */

const cleanups: Array<() => Promise<void>> = [];
afterAll(async () => {
  for (const cleanup of cleanups) await cleanup();
});

function fixedClock(): () => Date {
  const stamps = [
    new Date("2026-07-31T00:00:00.000Z"),
    new Date("2026-07-31T00:00:01.000Z"),
  ];
  let index = 0;
  return () => stamps[Math.min(index++, stamps.length - 1)]!;
}

/**
 * A stub provenance. Its cost is an EXPLICIT unknown (costKnown:false) so the
 * stub is never mistaken for a real, priced DeepSeek call (§三). Callers that
 * exercise the budget gate override usage.
 */
function stubProvenance(
  usage?: Partial<DesignStageProvenance["usage"]>,
): DesignStageProvenance {
  return {
    provider: "stub",
    model: "deterministic-design-agent",
    outputMode: "stub",
    thinkingMode: "disabled",
    finishReason: "tool_calls",
    toolCallCount: 1,
    argumentsLength: 100,
    elapsedMs: 10,
    timeoutMs: 120_000,
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

function stubAnalyze(
  output: DesignAgentModelOutput,
  usage?: Partial<DesignStageProvenance["usage"]>,
): DesignAgentV2Analysis {
  return async () => ({ output, provenance: stubProvenance(usage) });
}

function stageInput(): RunDesignAgentStageInput {
  return {
    request: upstreamRequestRecord(),
    gameSpec: upstreamGameSpecV2(),
    intentLedger: upstreamIntentLedgerV2(),
  };
}

describe("runDesignAgentStage (Orchestrator v2 design seam)", () => {
  it("§二十.50 runs the full stub chain to a design-ready result + AgentInvocation", async () => {
    const { result, invocation } = await runDesignAgentStage(stageInput(), {
      analyze: stubAnalyze(survivalDesignReadyOutput()),
      now: fixedClock(),
    });
    expect(result.status).toBe("design-ready");
    if (result.status !== "design-ready") return;
    // The verified, source-bound GameDesignV2 is present and hash-consistent.
    expect(result.gameDesign.kind).toBe("GameDesignV2");
    expect(invocation?.result.status).toBe("succeeded");
    // Provenance faithfully names the stub, never a real model.
    expect(result.provenance.provider).toBe("stub");
  });

  it("§二十.51 the invocation role is exactly `design`", async () => {
    const { invocation } = await runDesignAgentStage(stageInput(), {
      analyze: stubAnalyze(survivalDesignReadyOutput()),
    });
    expect(invocation?.role).toBe("design");
    if (invocation?.result.status === "succeeded") {
      expect(invocation.result.output.role).toBe("design");
      expect(invocation.result.output.kind).toBe("DesignAgentOutput");
      // The Design Agent drives only the schema-validator tool.
      expect(invocation.tools).toEqual(["schema-validator", "artifact-hash"]);
    }
  });

  it("§二十.52 the input artifact refs carry the correct kinds and recomputed hashes", async () => {
    const { result, invocation } = await runDesignAgentStage(stageInput(), {
      analyze: stubAnalyze(survivalDesignReadyOutput()),
    });
    expect(result.status).toBe("design-ready");

    const expected = [
      { kind: "Request", sha256: upstreamRequestSha256() },
      { kind: "GameSpecV2", sha256: sha256GameSpecV2(upstreamGameSpecV2()) },
      {
        kind: "IntentLedgerV2",
        sha256: sha256IntentLedgerV2(upstreamIntentLedgerV2()),
      },
    ];
    expect(invocation?.inputs).toEqual(expected);

    if (result.status !== "design-ready") return;
    // The result's bound hashes match the recomputed upstream hashes, and the
    // request hash matches the ledger's recorded request hash (hash binding).
    expect(result.gameSpecSha256).toBe(sha256GameSpecV2(upstreamGameSpecV2()));
    expect(result.intentLedgerSha256).toBe(
      sha256IntentLedgerV2(upstreamIntentLedgerV2()),
    );
    expect(result.request.sha256).toBe(upstreamRequestSha256());
    expect(result.request.sha256).toBe(upstreamIntentLedgerV2().request.sha256);
    expect(result.gameSpecSha256).toBe(
      upstreamIntentLedgerV2().gameSpec.sha256,
    );
  });

  it("§二十.53 the design hash equals the canonical hash of the bound GameDesignV2", async () => {
    const { result } = await runDesignAgentStage(stageInput(), {
      analyze: stubAnalyze(survivalDesignReadyOutput()),
    });
    expect(result.status).toBe("design-ready");
    if (result.status !== "design-ready") return;
    // Recomputing the canonical hash from the returned design reproduces the
    // recorded gameDesignSha256 exactly.
    expect(sha256GameDesignV2(result.gameDesign)).toBe(result.gameDesignSha256);
  });

  it("§二十.54 fails closed when the model output is schema-invalid (no promotion)", async () => {
    // A design-ready with an empty body survives the discriminator but fails the
    // body schema, so the seam's parseArtifact rejects it.
    const badOutput = {
      outcome: "design-ready",
      gameDesign: {},
    } as unknown as DesignAgentModelOutput;
    const { result, invocation } = await runDesignAgentStage(stageInput(), {
      analyze: stubAnalyze(badOutput),
    });
    expect(result.status).toBe("bounded-failure");
    if (result.status !== "bounded-failure") return;
    expect(result.failure.code).toBe("invalid-agent-output");
    // A schema-invalid artifact still produces a failed invocation record.
    expect(invocation?.result.status).toBe("failed");
  });

  it("§二十.54b fails closed when a design-ready body breaks consistency (dangling reference)", async () => {
    const ready = survivalDesignReadyOutput();
    if (ready.outcome !== "design-ready") throw new Error("bad fixture");
    const process = ready.gameDesign.systemDesign.processes.find(
      (value) => value.id === "enemy-spawn",
    );
    const effect = process?.effects[0];
    if (effect?.kind === "spawn") effect.actor = "actor-ghost";
    const { result } = await runDesignAgentStage(stageInput(), {
      analyze: stubAnalyze(ready),
    });
    expect(result.status).toBe("bounded-failure");
    if (result.status !== "bounded-failure") return;
    expect(result.failure.code).toBe("invalid-agent-output");
    expect(result.failureEvidence?.stage).toBe("consistency");
  });

  it("fails closed when locked requirement coverage is missing", async () => {
    const ready = survivalDesignReadyOutput();
    if (ready.outcome !== "design-ready") throw new Error("bad fixture");
    ready.gameDesign.requirementBindings.decisions =
      ready.gameDesign.requirementBindings.decisions.filter(
        (decision) => decision.id !== "bind-movement",
      );
    const { result } = await runDesignAgentStage(stageInput(), {
      analyze: stubAnalyze(ready),
    });
    expect(result.status).toBe("bounded-failure");
    if (result.status !== "bounded-failure") return;
    expect(result.failureEvidence?.stage).toBe("consistency");
    expect(result.failureEvidence?.issueCode).toBe("locked-coverage");
  });

  it("fails closed on a duplicate canonical node id", async () => {
    const ready = survivalDesignReadyOutput();
    if (ready.outcome !== "design-ready") throw new Error("bad fixture");
    ready.gameDesign.systemDesign.events.push({
      id: "survival-complete-elapsed",
    });
    const { result } = await runDesignAgentStage(stageInput(), {
      analyze: stubAnalyze(ready),
    });
    expect(result.status).toBe("bounded-failure");
    if (result.status !== "bounded-failure") return;
    expect(result.failure.code).toBe("invalid-agent-output");
  });

  it("§二十.55 converts an executor throw into a structured bounded-failure", async () => {
    const { result } = await runDesignAgentStage(stageInput(), {
      analyze: async () => {
        throw {
          name: "DesignAgentModelError",
          code: "model-failure",
          message: "network exploded",
          retryable: true,
        };
      },
    });
    expect(result.status).toBe("bounded-failure");
    if (result.status !== "bounded-failure") return;
    expect(result.failure.code).toBe("model-failure");
    expect(result.failure.message).toContain("network exploded");
  });

  it("§二十.56 threads the budget (maxAttempts) through to the invocation record", async () => {
    const { result, invocation } = await runDesignAgentStage(stageInput(), {
      analyze: stubAnalyze(survivalDesignReadyOutput()),
      budget: { maxAttempts: 2 },
    });
    expect(result.status).toBe("design-ready");
    expect(invocation?.budget.maxAttempts).toBe(2);
    // The seam mints attempt 1, always within the declared maxAttempts.
    expect(invocation?.attempt).toBe(1);
    expect(invocation!.attempt).toBeLessThanOrEqual(
      invocation!.budget.maxAttempts,
    );
  });

  it("§二十.57 fails closed when the model token usage exceeds the token budget", async () => {
    const { result, invocation } = await runDesignAgentStage(stageInput(), {
      analyze: stubAnalyze(survivalDesignReadyOutput(), {
        inputTokens: 5_000_000,
        // A real estimate would make cost known; the point is the token gate.
        costKnown: true,
        costEvidence: {
          kind: "estimated",
          currency: "USD",
          estimatedCostUsd: 0.7,
          estimatedCostCnyUpper: 5.25,
          inputTokens: 5_000_000,
          outputTokens: 0,
          pricingBasis: {
            input: "cache-miss upper estimate",
            officialPriceCurrency: "USD",
            cacheHitInputUsdPerMillionTokens: 0.0028,
            cacheMissInputUsdPerMillionTokens: 0.14,
            outputUsdPerMillionTokens: 0.28,
            conservativeCnyPerUsd: 7.5,
            source: "test",
            checkedAt: "2026-07-16",
            policyVersion: "2026-07-16",
          },
        },
        cost: 0.7,
      }),
      budget: { maxAttempts: 1, maxTokens: 1_000 },
    });
    expect(result.status).toBe("bounded-failure");
    if (result.status !== "bounded-failure") return;
    expect(result.failure.code).toBe("model-failure");
    // The budget breach is rejected by the seam schema before a record is minted.
    expect(invocation).toBeUndefined();
  });

  it("§二十.58 fails closed when an unknown cost meets a maxCost budget", async () => {
    // The stub provenance is costKnown:false; with a maxCost ceiling the seam
    // refuses to certify the cost and rejects the invocation.
    const { result, invocation } = await runDesignAgentStage(stageInput(), {
      analyze: stubAnalyze(survivalDesignReadyOutput()),
      budget: { maxAttempts: 1, maxCost: 1 },
    });
    expect(result.status).toBe("bounded-failure");
    if (result.status !== "bounded-failure") return;
    expect(result.failure.code).toBe("model-failure");
    expect(invocation).toBeUndefined();
  });

  it("§二十.59 a needs-clarification output does NOT advance to design-ready", async () => {
    const clarification: DesignAgentModelOutput = {
      outcome: "needs-clarification",
      questions: [
        {
          questionId: "q-loss-mechanic",
          question: "游戏是否需要明确的失败机制？",
          why: "缺少失败条件会影响胜负裁决。",
          affectedPartitions: ["gameplayIntent"],
        },
      ],
    };
    const { result } = await runDesignAgentStage(stageInput(), {
      analyze: stubAnalyze(clarification),
    });
    expect(result.status).toBe("needs-clarification");
    if (result.status !== "needs-clarification") return;
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0]?.questionId).toBe("q-loss-mechanic");
  });

  it("§二十.60 a bounded-failure output does NOT advance to design-ready", async () => {
    const failure: DesignAgentModelOutput = {
      outcome: "bounded-failure",
      failure: {
        code: "unsupported-product",
        message: "该请求超出当前弹幕类 H5 产品边界。",
        retryable: false,
      },
    };
    const { result } = await runDesignAgentStage(stageInput(), {
      analyze: stubAnalyze(failure),
    });
    expect(result.status).toBe("bounded-failure");
    if (result.status !== "bounded-failure") return;
    expect(result.failure.code).toBe("unsupported-product");
  });

  it("§十八 persists a design-ready artifact atomically as pure JSON", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "design-agent-stage-"));
    cleanups.push(() => rm(dir, { recursive: true, force: true }));
    const outputPath = path.join(dir, "design-stage-v2-result.json");

    const { result } = await runDesignAgentStage(stageInput(), {
      analyze: stubAnalyze(survivalDesignReadyOutput()),
      outputPath,
    });
    const written = JSON.parse(await readFile(outputPath, "utf8")) as unknown;
    expect(parseDesignStageV2Result(written)).toEqual(result);
  });

  it("§十八 fails closed on structurally invalid upstream before any model call", async () => {
    let modelCalls = 0;
    const analyze: DesignAgentV2Analysis = async () => {
      modelCalls += 1;
      return {
        output: survivalDesignReadyOutput(),
        provenance: stubProvenance(),
      };
    };
    // A tampered GameSpec (empty concept partition, etc.) fails its own schema
    // when the stage recomputes its hash, before the model is ever invoked.
    const brokenSpec = { ...upstreamGameSpecV2(), kind: "not-a-spec" };
    const { result } = await runDesignAgentStage(
      {
        request: upstreamRequestRecord(),
        gameSpec: brokenSpec as unknown as RunDesignAgentStageInput["gameSpec"],
        intentLedger: upstreamIntentLedgerV2(),
      },
      { analyze },
    );
    expect(result.status).toBe("bounded-failure");
    if (result.status !== "bounded-failure") return;
    expect(result.failure.code).toBe("invalid-agent-output");
    expect(modelCalls).toBe(0);
  });
});
