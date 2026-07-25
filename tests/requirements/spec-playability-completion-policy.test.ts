import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { planSpecIntentLedger } from "../../src/requirements/spec-intent-ledger.js";
import {
  completePlayableShooterGameSpec,
  SpecPlayabilityCompletionError,
  verifySpecPlayabilityCompletion,
} from "../../src/requirements/spec-playability-completion-policy.js";
import { parseShooterGameSpec } from "../../src/requirements/shooter-game-spec.js";

async function loadV2() {
  const probeCase = JSON.parse(
    await readFile(
      new URL(
        "../../evals/cases/natural-language-probe-v2.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as { language: "zh-CN"; prompt: string };
  const report = JSON.parse(
    await readFile(
      new URL(
        "../../artifacts/evaluations/natural-language-probes/66f33ad6-6d53-440d-9fca-4324cd768c27/report.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as { spec: unknown };
  const request = { language: probeCase.language, prompt: probeCase.prompt };
  const spec = parseShooterGameSpec(report.spec);
  return { request, spec, ledger: planSpecIntentLedger(request, spec) };
}

describe("SpecPlayabilityCompletionPolicy", () => {
  it("changes only Agent-owned v2 player health to the evidence-backed ceiling", async () => {
    const { request, spec, ledger } = await loadV2();
    const original = structuredClone(spec);
    const result = completePlayableShooterGameSpec(request, spec, ledger);

    expect(spec).toEqual(original);
    expect(result.completedSpec).toEqual({
      ...spec,
      player: { ...spec.player, maxHealth: 60 },
    });
    expect(result.artifact).toMatchObject({
      schemaVersion: "1.2.0",
      policyId: "boss-flow-player-health-v3",
      decisions: [
        {
          field: "player.maxHealth",
          previousValue: 5,
          completedValue: 60,
        },
      ],
    });
  });

  it("rejects user-locked health", async () => {
    const { request, spec } = await loadV2();
    const lockedRequest = {
      ...request,
      prompt: `${request.prompt} 玩家生命值为5。`,
    };
    const ledger = planSpecIntentLedger(lockedRequest, spec);

    expect(() =>
      completePlayableShooterGameSpec(lockedRequest, spec, ledger),
    ).toThrow(SpecPlayabilityCompletionError);
  });

  it("rejects request, ledger, completed Spec, and decision tampering", async () => {
    const { request, spec, ledger } = await loadV2();
    const result = completePlayableShooterGameSpec(request, spec, ledger);
    const changedLedger = structuredClone(ledger);
    changedLedger.entries.find(
      (entry) => entry.intentId === "player-max-health",
    )!.ownership = "user-locked";
    const changedCompleted = structuredClone(result.completedSpec);
    changedCompleted.player.maxHealth = 19;
    const changedArtifact = structuredClone(result.artifact);
    changedArtifact.decisions[0].completedValue = 59 as 60;

    expect(() =>
      completePlayableShooterGameSpec(request, spec, changedLedger),
    ).toThrow();
    expect(() =>
      verifySpecPlayabilityCompletion(
        request,
        spec,
        changedCompleted,
        ledger,
        result.artifact,
      ),
    ).toThrow(SpecPlayabilityCompletionError);
    expect(() =>
      verifySpecPlayabilityCompletion(
        request,
        spec,
        result.completedSpec,
        ledger,
        changedArtifact,
      ),
    ).toThrow();
  });
});
