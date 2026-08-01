import { describe, expect, it } from "vitest";

import {
  didDesignAgentV2StructuralAssertionsPass,
  evaluateDesignAgentV2StructuralAssertions,
  type DesignAgentV2StructuralAssertion,
} from "../../scripts/design-agent-v2-structural-assertions.js";
import {
  sha256GameDesignV2,
  type GameDesignV2,
} from "../../src/gameplay/game-design-v2.js";
import type {
  DesignStageProvenance,
  DesignStageV2Success,
} from "../../src/requirements/design-agent-result.js";
import { sha256GameSpecV2 } from "../../src/requirements/game-spec-v2.js";
import {
  sha256IntentLedgerV2,
  type IntentLedgerV2,
} from "../../src/requirements/intent-ledger-v2.js";
import {
  compiledSurvivalDesign,
  upstreamGameSpecV2,
  upstreamIntentLedgerV2,
  upstreamRequestSha256,
} from "../fixtures/create-design-agent-output.js";

function provenance(): DesignStageProvenance {
  return {
    provider: "test",
    model: "deepseek-v4-flash",
    outputMode: "test",
    thinkingMode: "enabled",
    finishReason: "tool_calls",
    toolCallCount: 1,
    argumentsLength: 1,
    elapsedMs: 1,
    timeoutMs: 300_000,
    usage: {
      cost: 0,
      costKnown: false,
      costEvidence: {
        kind: "unknown",
        currency: "USD",
        reason: "offline deterministic test",
      },
      inputTokens: 0,
      outputTokens: 0,
      reasoningTokens: 0,
    },
  };
}

function structurallyBoundDesign(mode = "mouse-aimed"): GameDesignV2 {
  const design = compiledSurvivalDesign();
  const aiming = design.spatialDesign.aiming.find(
    (candidate) => candidate.id === "aiming-player",
  );
  if (aiming === undefined) throw new Error("missing aiming fixture");
  aiming.mode = mode;

  const binding = design.requirementBindings.decisions.find(
    (decision) =>
      decision.source !== "agent-derived" &&
      decision.statementId === "control-mouse-aim-shoot",
  );
  if (binding === undefined) throw new Error("missing control binding fixture");
  binding.targets = [{ nodeId: "aiming-player" }, { nodeId: "action-fire" }];
  return design;
}

function evaluate(
  design: GameDesignV2,
  intentLedger: IntentLedgerV2 = upstreamIntentLedgerV2(),
): DesignAgentV2StructuralAssertion[] {
  const gameSpecSha256 = sha256GameSpecV2(upstreamGameSpecV2());
  const intentLedgerSha256 = sha256IntentLedgerV2(intentLedger);
  const result: DesignStageV2Success = {
    schemaVersion: "2.0.0",
    kind: "design-stage-v2-result",
    status: "design-ready",
    request: {
      language: "zh-CN",
      prompt: "offline structural assertion test",
      sha256: upstreamRequestSha256(),
    },
    gameDesign: design,
    gameDesignSha256: sha256GameDesignV2(design),
    gameSpecSha256,
    intentLedgerSha256,
    provenance: provenance(),
  };
  return evaluateDesignAgentV2StructuralAssertions({
    result,
    intentLedger,
    expectedRequestSha256: upstreamRequestSha256(),
    expectedGameSpecSha256: gameSpecSha256,
    expectedIntentLedgerSha256: intentLedgerSha256,
  });
}

function aimingAssertion(
  assertions: readonly DesignAgentV2StructuralAssertion[],
) {
  const assertion = assertions.find(
    (candidate) => candidate.id === "pointer-world-aiming",
  );
  if (assertion === undefined) throw new Error("missing aiming assertion");
  return assertion;
}

describe("Design Agent v2 structural assertions", () => {
  it("accepts an open mouse-aimed label when binding, nodes and actor relation are valid", () => {
    const assertion = aimingAssertion(evaluate(structurallyBoundDesign()));
    expect(assertion.passed).toBe(true);
    expect(assertion.detail).toContain("aiming=aiming-player");
    expect(assertion.detail).toContain("action=action-fire");
    expect(assertion.detail).toContain("actor=actor-player");
  });

  it("does not couple aiming validation to a model-generated statement id", () => {
    const design = structurallyBoundDesign();
    const ledger = upstreamIntentLedgerV2();
    const oldId = "control-mouse-aim-shoot";
    const newId = "controls-mouse-aim-and-shoot";
    const entry = ledger.entries.find((value) => value.statementId === oldId);
    const binding = design.requirementBindings.decisions.find(
      (decision) =>
        decision.source !== "agent-derived" && decision.statementId === oldId,
    );
    if (
      entry === undefined ||
      binding === undefined ||
      binding.source === "agent-derived"
    ) {
      throw new Error("missing mouse aiming fixture");
    }
    entry.statementId = newId;
    binding.statementId = newId;

    expect(aimingAssertion(evaluate(design, ledger)).passed).toBe(true);
  });

  it("rejects pointer-world-target without control-mouse-aim-shoot binding", () => {
    const design = structurallyBoundDesign("pointer-world-target");
    design.requirementBindings.decisions =
      design.requirementBindings.decisions.filter(
        (decision) =>
          decision.source === "agent-derived" ||
          decision.statementId !== "control-mouse-aim-shoot",
      );
    expect(aimingAssertion(evaluate(design)).passed).toBe(false);
  });

  it("rejects a binding that targets aiming but no action", () => {
    const design = structurallyBoundDesign();
    const binding = design.requirementBindings.decisions.find(
      (decision) =>
        decision.source !== "agent-derived" &&
        decision.statementId === "control-mouse-aim-shoot",
    );
    if (binding === undefined) throw new Error("missing control binding");
    binding.targets = [{ nodeId: "aiming-player" }];
    expect(aimingAssertion(evaluate(design)).passed).toBe(false);
  });

  it("rejects aiming and action targets owned by different actors", () => {
    const design = structurallyBoundDesign();
    const aiming = design.spatialDesign.aiming.find(
      (candidate) => candidate.id === "aiming-player",
    );
    if (aiming === undefined) throw new Error("missing aiming fixture");
    aiming.subject = "actor-enemy";
    expect(aimingAssertion(evaluate(design)).passed).toBe(false);
  });

  it("does not accept enemy pointer/radial labels without a core-loop or shooting-bound action", () => {
    const design = structurallyBoundDesign();
    design.spatialDesign.aiming.push({
      id: "aiming-enemy-radial",
      subject: "actor-enemy",
      mode: "enemy-pointer-radial",
    });
    design.systemDesign.actions.push({
      id: "action-enemy-radial",
      actor: "actor-enemy",
      kind: "radial",
      effects: [],
    });
    const binding = design.requirementBindings.decisions.find(
      (decision) =>
        decision.source !== "agent-derived" &&
        decision.statementId === "control-mouse-aim-shoot",
    );
    if (binding === undefined) throw new Error("missing control binding");
    binding.targets = [
      { nodeId: "aiming-enemy-radial" },
      { nodeId: "action-enemy-radial" },
    ];
    expect(aimingAssertion(evaluate(design)).passed).toBe(false);
  });

  it("preserves the complete objective assertion set and other semantics", () => {
    const assertions = evaluate(structurallyBoundDesign());
    expect(assertions.map((assertion) => assertion.id)).toEqual([
      "status-design-ready",
      "model-is-flash",
      "design-schema-valid",
      "hash-binding-consistent",
      "locked-coverage-complete",
      "forbidden-excluded-and-no-boss-actor",
      "survival-120000ms",
      "viewport-horizontal-wide",
      "spatial-decoupled-from-orientation",
      "free-2d-movement",
      "pointer-world-aiming",
      "survival-timer-event-outcome-chain",
      "explicit-loss-outcome",
      "references-closed",
      "terminal-outcome-priority-distinct",
      "agent-derived-has-rationale",
    ]);
    expect(assertions.every((assertion) => assertion.passed)).toBe(true);
  });

  it("requires design-ready and every objective assertion for total pass", () => {
    const assertions = evaluate(structurallyBoundDesign());
    expect(
      didDesignAgentV2StructuralAssertionsPass("design-ready", assertions),
    ).toBe(true);
    expect(
      didDesignAgentV2StructuralAssertionsPass(
        "needs-clarification",
        assertions,
      ),
    ).toBe(false);
    expect(
      didDesignAgentV2StructuralAssertionsPass("design-ready", [
        ...assertions.slice(0, -1),
        { ...assertions.at(-1)!, passed: false },
      ]),
    ).toBe(false);
  });
});
