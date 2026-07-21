import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  planSpecIntentLedger,
  SpecIntentLedgerError,
  verifySpecIntentLedger,
  type SpecIntentRequest,
} from "../../src/requirements/spec-intent-ledger.js";
import { parseShooterGameSpec } from "../../src/requirements/shooter-game-spec.js";

const caseUrl = new URL(
  "../../evals/cases/natural-language-probe-v2.json",
  import.meta.url,
);
const reportUrl = new URL(
  "../../artifacts/evaluations/natural-language-probes/66f33ad6-6d53-440d-9fca-4324cd768c27/report.json",
  import.meta.url,
);

async function loadV2Inputs(): Promise<{
  request: SpecIntentRequest;
  spec: ReturnType<typeof parseShooterGameSpec>;
}> {
  const probeCase = JSON.parse(await readFile(caseUrl, "utf8")) as {
    language: "zh-CN";
    prompt: string;
  };
  const report = JSON.parse(await readFile(reportUrl, "utf8")) as {
    spec: unknown;
  };
  return {
    request: { language: probeCase.language, prompt: probeCase.prompt },
    spec: parseShooterGameSpec(report.spec),
  };
}

describe("SpecIntentLedger", () => {
  it("binds the saved v2 request and source Spec with explicit locks and Agent-owned health", async () => {
    const { request, spec } = await loadV2Inputs();
    const first = planSpecIntentLedger(request, spec);
    const second = planSpecIntentLedger(request, spec);

    expect(second).toEqual(first);
    expect(first).toMatchObject({
      schemaVersion: "1.0.0",
      policyId: "zh-cn-playability-intent-v1",
      scope: "playability-provenance-v1",
      request: {
        language: "zh-CN",
        sha256:
          "0bfb2efcc2b4fb1bab7048488a459e758ab5b7354346580ce4757168a5335aba",
      },
      sourceSpec: {
        schemaVersion: "1.0.0",
        sha256:
          "d2419cf040a077d013b75b81814b9732abef54811d8b1ab49212b4268079f2c7",
      },
    });

    const ownership = Object.fromEntries(
      first.entries.map((entry) => [entry.intentId, entry.ownership]),
    );
    expect(ownership).toMatchObject({
      "target-desktop-browser": "user-locked",
      "target-mobile-browser": "user-locked",
      "enemy-wave-count": "user-locked",
      "enemy-role-small-fighter": "user-locked",
      "enemy-role-asteroid": "user-locked",
      "enemy-role-aimed-formation": "user-locked",
      "pickup-shield": "user-locked",
      "pickup-firepower": "user-locked",
      "boss-victory": "user-locked",
      "player-max-health": "agent-choice",
    });
    expect(first.entries).toContainEqual(
      expect.objectContaining({
        intentId: "enemy-wave-count",
        specBinding: {
          kind: "wave-count",
          specPath: "/enemyWaves",
          value: 3,
        },
      }),
    );
    expect(first.entries).toContainEqual(
      expect.objectContaining({
        intentId: "player-max-health",
        ownership: "agent-choice",
        requestEvidence: [],
        reasonCode: "not-stated-in-request",
        specBinding: {
          kind: "player-max-health",
          specPath: "/player/maxHealth",
          value: 5,
        },
      }),
    );
    expect(
      first.entries
        .filter((entry) => entry.ownership === "user-locked")
        .every((entry) => entry.requestEvidence.length > 0),
    ).toBe(true);
  });

  it("fails closed on an unknown enemy role in a scoped request clause", async () => {
    const { request, spec } = await loadV2Inputs();
    const changedRequest = {
      ...request,
      prompt: request.prompt.replace("陨石", "幽灵"),
    };

    expect(() => planSpecIntentLedger(changedRequest, spec)).toThrowError(
      expect.objectContaining<Partial<SpecIntentLedgerError>>({
        code: "unknown-intent",
      }),
    );
  });

  it("fails closed on conflicting wave counts", async () => {
    const { request, spec } = await loadV2Inputs();
    const changedRequest = {
      ...request,
      prompt: `${request.prompt} 另需四波敌人。`,
    };

    expect(() => planSpecIntentLedger(changedRequest, spec)).toThrowError(
      expect.objectContaining<Partial<SpecIntentLedgerError>>({
        code: "conflicting-intent",
      }),
    );
  });

  it("fails closed when health is mentioned without an exact value", async () => {
    const { request, spec } = await loadV2Inputs();
    const changedRequest = {
      ...request,
      prompt: `${request.prompt} 玩家生命值适中。`,
    };

    expect(() => planSpecIntentLedger(changedRequest, spec)).toThrowError(
      expect.objectContaining<Partial<SpecIntentLedgerError>>({
        code: "ambiguous-intent",
      }),
    );
  });

  it("locks player health when the request states one exact matching value", async () => {
    const { request, spec } = await loadV2Inputs();
    const changedRequest = {
      ...request,
      prompt: `${request.prompt} 玩家生命值为5。`,
    };
    const ledger = planSpecIntentLedger(changedRequest, spec);

    expect(
      ledger.entries.find((entry) => entry.intentId === "player-max-health"),
    ).toMatchObject({
      ownership: "user-locked",
      reasonCode: "explicit-request",
      specBinding: {
        kind: "player-max-health",
        value: 5,
      },
    });
  });

  it("rejects source Spec and ledger tampering", async () => {
    const { request, spec } = await loadV2Inputs();
    const ledger = planSpecIntentLedger(request, spec);
    const changedSpec = structuredClone(spec);
    changedSpec.player.maxHealth = 6;
    const changedLedger = structuredClone(ledger);
    changedLedger.entries.find(
      (entry) => entry.intentId === "player-max-health",
    )!.specBinding = {
      kind: "player-max-health",
      specPath: "/player/maxHealth",
      value: 6,
    };

    expect(() =>
      verifySpecIntentLedger(request, changedSpec, ledger),
    ).toThrowError(SpecIntentLedgerError);
    expect(() =>
      verifySpecIntentLedger(
        { ...request, prompt: `${request.prompt} ` },
        spec,
        ledger,
      ),
    ).toThrowError(SpecIntentLedgerError);
    expect(() =>
      verifySpecIntentLedger(request, spec, changedLedger),
    ).toThrowError(SpecIntentLedgerError);
  });

  it("rejects a source Spec that drops a user-locked wave", async () => {
    const { request, spec } = await loadV2Inputs();
    const changedSpec = structuredClone(spec);
    changedSpec.enemyWaves.splice(1, 1);

    expect(() => planSpecIntentLedger(request, changedSpec)).toThrowError(
      expect.objectContaining<Partial<SpecIntentLedgerError>>({
        code: "source-spec-mismatch",
      }),
    );
  });
});
