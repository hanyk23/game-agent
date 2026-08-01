import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { sha256GameSpecV2 } from "../../src/requirements/game-spec-v2.js";
import {
  IntentLedgerV2Error,
  IntentLedgerV2Schema,
  parseIntentLedgerV2,
  sha256IntentLedgerV2,
  verifyIntentLedgerV2,
  type IntentLedgerV2,
  type IntentLedgerV2Entry,
} from "../../src/requirements/intent-ledger-v2.js";
import {
  bossForbiddenOutput,
  BOSS_FORBIDDEN_PROMPT,
  bossRequiredOutput,
  BOSS_REQUIRED_PROMPT,
  horizontalFreeMoveOutput,
  HORIZONTAL_FREE_MOVE_PROMPT,
} from "../fixtures/create-spec-agent-output.js";
import type { SpecAgentModelOutput } from "../../src/requirements/spec-agent-result.js";

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function readySpec(output: SpecAgentModelOutput) {
  if (output.outcome !== "spec-ready") throw new Error("not spec-ready");
  return output;
}

function assembleLedger(
  prompt: string,
  output: SpecAgentModelOutput,
): IntentLedgerV2 {
  const ready = readySpec(output);
  return {
    schemaVersion: "2.0.0",
    kind: "IntentLedgerV2",
    scope: "open-requirement-provenance-v2",
    request: {
      language: "zh-CN",
      normalization: "NFKC",
      sha256: sha256(prompt),
    },
    gameSpec: {
      schemaVersion: "2.0.0",
      sha256: sha256GameSpecV2(ready.gameSpec),
    },
    entries: ready.ledger,
  };
}

describe("IntentLedger v2 — provenance + deterministic verification", () => {
  it("verifies a well-formed ledger bound to its request and spec", () => {
    const output = horizontalFreeMoveOutput();
    const ledger = assembleLedger(HORIZONTAL_FREE_MOVE_PROMPT, output);
    const verified = verifyIntentLedgerV2(
      { language: "zh-CN", prompt: HORIZONTAL_FREE_MOVE_PROMPT },
      readySpec(output).gameSpec,
      ledger,
    );
    expect(verified.entries.length).toBe(6);
    expect(sha256IntentLedgerV2(verified)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("accepts a user-declared forbidden Boss that is locked", () => {
    // §九.7 — explicit prohibition, locked, with verbatim evidence.
    const output = bossForbiddenOutput();
    const ledger = assembleLedger(BOSS_FORBIDDEN_PROMPT, output);
    const verified = verifyIntentLedgerV2(
      { language: "zh-CN", prompt: BOSS_FORBIDDEN_PROMPT },
      readySpec(output).gameSpec,
      ledger,
    );
    const forbidBoss = verified.entries.find(
      (e) => e.statementId === "forbid-boss",
    );
    expect(forbidBoss?.source).toBe("user-declared");
    expect(forbidBoss?.strength).toBe("forbidden");
    expect(forbidBoss?.locked).toBe(true);
  });

  it("accepts an explicit user-required Boss", () => {
    // §九.6
    const output = bossRequiredOutput();
    const ledger = assembleLedger(BOSS_REQUIRED_PROMPT, output);
    expect(() =>
      verifyIntentLedgerV2(
        { language: "zh-CN", prompt: BOSS_REQUIRED_PROMPT },
        readySpec(output).gameSpec,
        ledger,
      ),
    ).not.toThrow();
  });

  it("rejects a user-declared entry whose quote is not in the request", () => {
    // §九.11 — user-declared must carry checkable original-text evidence.
    const output = bossRequiredOutput();
    const ledger = assembleLedger(BOSS_REQUIRED_PROMPT, output);
    const tampered: IntentLedgerV2 = {
      ...ledger,
      entries: ledger.entries.map((entry) =>
        entry.statementId === "has-boss" && entry.source === "user-declared"
          ? { ...entry, evidence: { quotes: ["用户从未说过这句话"] } }
          : entry,
      ),
    };
    expect(() =>
      verifyIntentLedgerV2(
        { language: "zh-CN", prompt: BOSS_REQUIRED_PROMPT },
        readySpec(output).gameSpec,
        tampered,
      ),
    ).toThrow(/evidence-mismatch/);
  });

  it("rejects a required user-declared statement that is not locked", () => {
    // §九.10-adjacent — rule 4: required/forbidden user-declared must be locked.
    expect(() =>
      IntentLedgerV2Schema.parse({
        schemaVersion: "2.0.0",
        kind: "IntentLedgerV2",
        scope: "open-requirement-provenance-v2",
        request: {
          language: "zh-CN",
          normalization: "NFKC",
          sha256: "a".repeat(64),
        },
        gameSpec: { schemaVersion: "2.0.0", sha256: "b".repeat(64) },
        entries: [
          {
            statementId: "wants-x",
            source: "user-declared",
            strength: "required",
            locked: false,
            confidence: 0.9,
            evidence: { quotes: ["x"] },
          },
        ],
      }),
    ).toThrow();
  });

  it("rejects an agent-inferred entry that is locked or marked required", () => {
    // §九.10 — agent inference must be unlocked and never required/forbidden.
    const lockedInference = {
      statementId: "inferred-x",
      source: "agent-inferred",
      strength: "preferred",
      locked: true,
      confidence: 0.5,
      evidence: { rationale: "推断" },
    };
    expect(() =>
      IntentLedgerV2Schema.parse({
        schemaVersion: "2.0.0",
        kind: "IntentLedgerV2",
        scope: "open-requirement-provenance-v2",
        request: {
          language: "zh-CN",
          normalization: "NFKC",
          sha256: "a".repeat(64),
        },
        gameSpec: { schemaVersion: "2.0.0", sha256: "b".repeat(64) },
        entries: [lockedInference],
      }),
    ).toThrow();

    const requiredInference = {
      ...lockedInference,
      locked: false,
      strength: "required",
    };
    expect(() =>
      IntentLedgerV2Schema.parse({
        schemaVersion: "2.0.0",
        kind: "IntentLedgerV2",
        scope: "open-requirement-provenance-v2",
        request: {
          language: "zh-CN",
          normalization: "NFKC",
          sha256: "a".repeat(64),
        },
        gameSpec: { schemaVersion: "2.0.0", sha256: "b".repeat(64) },
        entries: [requiredInference],
      }),
    ).toThrow();
  });

  it("requires a stable ruleId on a system-default entry", () => {
    // §九.9 — a system-default entry must carry a stable ruleId. This asserts the
    // schema SHAPE only (ruleId present vs missing); registry membership + text
    // matching is proven by the verifier in system-default-rules.test.ts (§二).
    const base: IntentLedgerV2Entry = {
      statementId: "engine-default",
      source: "system-default",
      strength: "preferred",
      locked: false,
      confidence: 0.8,
      evidence: { ruleId: "default-target-engine-cocos-web-h5" },
    };
    expect(() =>
      parseIntentLedgerV2({
        schemaVersion: "2.0.0",
        kind: "IntentLedgerV2",
        scope: "open-requirement-provenance-v2",
        request: {
          language: "zh-CN",
          normalization: "NFKC",
          sha256: "a".repeat(64),
        },
        gameSpec: { schemaVersion: "2.0.0", sha256: "b".repeat(64) },
        entries: [base],
      }),
    ).not.toThrow();

    // Missing ruleId → rejected.
    const noRule = { ...base, evidence: {} };
    expect(() =>
      parseIntentLedgerV2({
        schemaVersion: "2.0.0",
        kind: "IntentLedgerV2",
        scope: "open-requirement-provenance-v2",
        request: {
          language: "zh-CN",
          normalization: "NFKC",
          sha256: "a".repeat(64),
        },
        gameSpec: { schemaVersion: "2.0.0", sha256: "b".repeat(64) },
        entries: [noRule],
      }),
    ).toThrow();
  });

  it("rejects a ledger missing a statement present in the spec", () => {
    // §九.12 — coverage: missing statement.
    const output = horizontalFreeMoveOutput();
    const ledger = assembleLedger(HORIZONTAL_FREE_MOVE_PROMPT, output);
    const missing: IntentLedgerV2 = {
      ...ledger,
      entries: ledger.entries.filter((e) => e.statementId !== "no-boss"),
    };
    expect(() =>
      verifyIntentLedgerV2(
        { language: "zh-CN", prompt: HORIZONTAL_FREE_MOVE_PROMPT },
        readySpec(output).gameSpec,
        missing,
      ),
    ).toThrow(/statement-coverage/);
  });

  it("rejects a ledger referencing a statement not in the spec (dangling)", () => {
    // §九.12 — coverage: dangling reference.
    const output = horizontalFreeMoveOutput();
    const ledger = assembleLedger(HORIZONTAL_FREE_MOVE_PROMPT, output);
    const dangling: IntentLedgerV2 = {
      ...ledger,
      entries: [
        ...ledger.entries,
        {
          statementId: "ghost-statement",
          source: "agent-inferred",
          strength: "preferred",
          locked: false,
          confidence: 0.3,
          evidence: { rationale: "不存在于 spec" },
        },
      ],
    };
    expect(() =>
      verifyIntentLedgerV2(
        { language: "zh-CN", prompt: HORIZONTAL_FREE_MOVE_PROMPT },
        readySpec(output).gameSpec,
        dangling,
      ),
    ).toThrow(/statement-coverage/);
  });

  it("rejects a ledger whose request hash does not match", () => {
    // §九.12 — hash mismatch.
    const output = horizontalFreeMoveOutput();
    const ledger = assembleLedger(HORIZONTAL_FREE_MOVE_PROMPT, output);
    const wrongHash: IntentLedgerV2 = {
      ...ledger,
      request: { ...ledger.request, sha256: "0".repeat(64) },
    };
    let thrown: unknown;
    try {
      verifyIntentLedgerV2(
        { language: "zh-CN", prompt: HORIZONTAL_FREE_MOVE_PROMPT },
        readySpec(output).gameSpec,
        wrongHash,
      );
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(IntentLedgerV2Error);
    expect((thrown as IntentLedgerV2Error).code).toBe("request-hash-mismatch");
  });

  it("rejects a ledger whose spec hash does not match", () => {
    const output = horizontalFreeMoveOutput();
    const ledger = assembleLedger(HORIZONTAL_FREE_MOVE_PROMPT, output);
    const wrongSpecHash: IntentLedgerV2 = {
      ...ledger,
      gameSpec: { schemaVersion: "2.0.0", sha256: "0".repeat(64) },
    };
    expect(() =>
      verifyIntentLedgerV2(
        { language: "zh-CN", prompt: HORIZONTAL_FREE_MOVE_PROMPT },
        readySpec(output).gameSpec,
        wrongSpecHash,
      ),
    ).toThrow(/spec-hash-mismatch/);
  });

  it("rejects duplicate statementIds inside the ledger", () => {
    const output = horizontalFreeMoveOutput();
    const ledger = assembleLedger(HORIZONTAL_FREE_MOVE_PROMPT, output);
    const dup: unknown = {
      ...ledger,
      entries: [
        ledger.entries[0],
        ledger.entries[0],
        ...ledger.entries.slice(1),
      ],
    };
    expect(() => IntentLedgerV2Schema.parse(dup)).toThrow();
  });
});
