import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { analyzeSpecWithDeepSeek } from "../src/requirements/deepseek-spec-agent-adapter.js";
import { runSpecAgentStage } from "../src/orchestration/run-spec-agent-stage.js";
import {
  collectStatementIds,
  normalizeStatementText,
  sha256GameSpecV2,
  SPEC_PARTITIONS,
  type GameSpecV2,
  type SpecStatement,
} from "../src/requirements/game-spec-v2.js";
import type {
  IntentLedgerV2,
  IntentLedgerV2Entry,
} from "../src/requirements/intent-ledger-v2.js";
import type { SpecStageV2Result } from "../src/requirements/spec-agent-result.js";

/**
 * live-spec-agent-v2-probe — the ONE authorized real DeepSeek probe for the
 * GameSpec v2 stage.
 *
 * Hard limits enforced here:
 *  - At most ONE model request. No automatic retry (budget.maxAttempts = 1).
 *  - The API key is read ONLY from DEEPSEEK_API_KEY. It is never printed,
 *    written, or embedded in the report.
 *  - If the key is absent, we DO NOT search for credentials; we report
 *    "环境缺少凭据，无法进行 live probe" and exit 0 (this is not a regression).
 *  - temperature = 0, JSON object mode, tools disabled, explicit timeout, and
 *    maxOutputTokens = 8192 so the full GameSpec v2 + IntentLedger v2 JSON is not
 *    truncated. The model JSON is re-validated locally by the adapter +
 *    Orchestrator; nothing is trusted blindly.
 *
 * NO budget gate: cost and tokens are RECORDED for auditing only. They are never
 * a maxCost ceiling, never a CNY cap, and never a pass/fail condition. The probe
 * writes `passed: true` ONLY when the stage reaches spec-ready AND every semantic
 * assertion below holds; otherwise `passed: false` with the failing details.
 *
 * The report persists the reproducible GameSpec v2 + IntentLedger v2, the request
 * / spec hashes recomputed independently, and the semantic assertions that prove:
 *   1. the "存活 120 秒" requirement is preserved and its ledger entry is locked;
 *   2. the "不要 Boss" requirement is recorded as forbidden AND locked;
 *   3. the IntentLedger covers the GameSpec 1:1 (no orphan / no missing entry).
 *
 * NOTE: a former "mouse-aim not duplicated" assertion was removed. It relied on a
 * naive keyword ("鼠标") + exact-normalized-text dedup that cannot judge semantic
 * duplication (paraphrases differ textually yet mean the same). Semantic dedup
 * quality is deferred to a separate independent model-based eval and is NOT a
 * basic Spec Agent functional gate this round. No deterministic synonym algorithm
 * is substituted here.
 */

const PROBE_PROMPT =
  "我想要一个横屏的弹幕射击 H5 游戏：玩家可以在二维平面里自由移动，用鼠标瞄准射击，不要 Boss，存活满 120 秒后进入结算。";

/**
 * The model this probe requests. §二十二.3: the Spec future live probe config is
 * migrated to deepseek-v4-flash so all future real calls use one model. This only
 * changes the FUTURE config of this script — it does NOT re-run the Spec Agent and
 * does NOT alter the historical Pro evidence saved from the earlier real call
 * (that report is preserved verbatim under the -deepseek-v4-pro suffix; see below).
 */
const PROBE_MODEL = "deepseek-v4-flash" as const;

/**
 * Cost-honesty note (§三). This probe requests deepseek-v4-flash, and the offline
 * price snapshot in deepseek-cost-policy.ts IS the deepseek-v4-flash tier, so the
 * recorded `usageRecordOnly.cost` is now a same-tier conservative upper-bound
 * estimate for the requested model (§二十二.5 reuses the matching flash snapshot).
 * The former "Pro call but Flash pricing" caveat is removed (§二十二.6) because it
 * no longer applies. Cost/tokens remain audit-only and are never a pass/fail gate.
 */
const PRICING_NOTE =
  "调用模型为 deepseek-v4-flash，成本估算沿用同档的 flash 价格快照（deepseek-cost-policy.ts）；usageRecordOnly.cost 为 flash 档保守上界估算，仅记录、不作门禁。";

type SemanticAssertion = {
  id: string;
  description: string;
  passed: boolean;
  detail: string;
};

/** All statements across the four partitions, paired with their partition. */
function allStatements(
  spec: GameSpecV2,
): Array<{ partition: string; statement: SpecStatement }> {
  const out: Array<{ partition: string; statement: SpecStatement }> = [];
  for (const partition of SPEC_PARTITIONS) {
    for (const statement of spec[partition]) out.push({ partition, statement });
  }
  return out;
}

function ledgerEntryFor(
  ledger: IntentLedgerV2,
  statementId: string,
): IntentLedgerV2Entry | undefined {
  return ledger.entries.find((entry) => entry.statementId === statementId);
}

/**
 * Evaluate the four required semantic assertions on a spec-ready result. These
 * checks read statement TEXT (this is the eval layer, not the deterministic
 * pipeline verifier) to locate the requested requirements and then verify their
 * STRUCTURAL provenance (locked / strength / 1:1 coverage) against the ledger.
 */
export function evaluateSemanticAssertions(
  gameSpec: GameSpecV2,
  ledger: IntentLedgerV2,
): SemanticAssertion[] {
  const statements = allStatements(gameSpec);
  const assertions: SemanticAssertion[] = [];

  // 1. 存活 120 秒被保留并 locked.
  const survivalMatches = statements.filter((s) =>
    normalizeStatementText(s.statement.text).includes("120"),
  );
  const lockedSurvival = survivalMatches.find((s) => {
    const entry = ledgerEntryFor(ledger, s.statement.statementId);
    return entry !== undefined && entry.locked === true;
  });
  assertions.push({
    id: "survival-120s-preserved-and-locked",
    description: "存活 120 秒的要求被保留，且其 ledger 记录 locked=true。",
    passed: lockedSurvival !== undefined,
    detail:
      lockedSurvival !== undefined
        ? `statementId=${lockedSurvival.statement.statementId} (${lockedSurvival.partition}) locked，text="${lockedSurvival.statement.text}"`
        : survivalMatches.length === 0
          ? "未找到包含 120 的需求语句。"
          : `找到 ${survivalMatches.length} 条含 120 的语句，但均未 locked。`,
  });

  // 2. 禁止 Boss 被 locked（strength=forbidden 且 locked）。
  const bossMatches = statements.filter((s) =>
    normalizeStatementText(s.statement.text).toLowerCase().includes("boss"),
  );
  const forbiddenBoss = bossMatches.find((s) => {
    const entry = ledgerEntryFor(ledger, s.statement.statementId);
    return (
      entry !== undefined &&
      entry.locked === true &&
      entry.strength === "forbidden"
    );
  });
  assertions.push({
    id: "forbid-boss-locked",
    description: "不要 Boss 的要求被记录为 forbidden 且 locked=true。",
    passed: forbiddenBoss !== undefined,
    detail:
      forbiddenBoss !== undefined
        ? `statementId=${forbiddenBoss.statement.statementId} (${forbiddenBoss.partition}) forbidden+locked，text="${forbiddenBoss.statement.text}"`
        : bossMatches.length === 0
          ? "未找到提到 Boss 的需求语句。"
          : `找到 ${bossMatches.length} 条提到 Boss 的语句，但均非 forbidden+locked。`,
  });

  // (Removed) 鼠标瞄准去重断言：朴素关键词 + 精确文本去重无法判断语义重复，
  // 语义去重质量留给后续独立模型评估，不作为本轮 Spec Agent 基本功能门禁；
  // 此处不替换任何确定性近义词算法。

  // 3. ledger 与 spec statementId 一一对应（无孤儿、无缺失）。
  const specIds = [...collectStatementIds(gameSpec)].sort();
  const ledgerIds = [...ledger.entries.map((e) => e.statementId)].sort();
  const oneToOne =
    specIds.length === ledgerIds.length &&
    specIds.every((id, index) => id === ledgerIds[index]);
  assertions.push({
    id: "ledger-covers-spec-one-to-one",
    description: "IntentLedger 与 GameSpec 的 statementId 一一对应。",
    passed: oneToOne,
    detail: oneToOne
      ? `spec 与 ledger 各 ${specIds.length} 条，statementId 完全一致。`
      : `spec ids (${specIds.length}) 与 ledger ids (${ledgerIds.length}) 不一致。`,
  });

  return assertions;
}

/** The credential-free provenance we record (cost/tokens are audit-only). */
function redactedProvenance(result: SpecStageV2Result): unknown {
  return "provenance" in result ? result.provenance : undefined;
}

async function main(): Promise<void> {
  const projectDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  );
  // §二十二.3 / §十六.5: this script now requests flash, so its output goes to a
  // flash-specific filename. The historical Pro evidence lives untouched at
  // spec-agent-v2-live-probe-deepseek-v4-pro.json — a future flash run must NOT
  // overwrite it. This script is future config only and is not re-run this round.
  const reportPath = path.join(
    projectDirectory,
    "evals",
    "reports",
    "spec-agent-v2-live-probe-deepseek-v4-flash.json",
  );
  await mkdir(path.dirname(reportPath), { recursive: true });

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    const report = {
      checkedAt: new Date().toISOString(),
      status: "skipped-no-credential",
      passed: false,
      message: "环境缺少凭据，无法进行 live probe。",
    };
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    process.stdout.write(`${JSON.stringify(report)}\n`);
    return;
  }

  try {
    // Route through the real Orchestrator entry so the probe exercises the same
    // hash-binding + local re-validation the production path uses. The single
    // model call happens inside analyzeSpecWithDeepSeek; maxAttempts = 1 forbids
    // any retry. There is NO maxCost / budget gate: cost and tokens are recorded
    // for auditing only, never a pass/fail condition.
    const { result } = await runSpecAgentStage(
      { language: "zh-CN", prompt: PROBE_PROMPT },
      {
        analyze: (request) =>
          analyzeSpecWithDeepSeek({
            apiKey,
            prompt: request.prompt,
            model: PROBE_MODEL,
            // deepseek-v4-flash produces the full GameSpec v2 + IntentLedger v2
            // JSON well within a bounded window; a 120s ceiling gives the single
            // no-retry attempt ample room without a Pro-tier reasoning budget.
            timeoutMs: 120_000,
            maxOutputTokens: 8_192,
          }),
        budget: { maxAttempts: 1 },
      },
    );

    const semanticAssertions =
      result.status === "spec-ready"
        ? evaluateSemanticAssertions(result.gameSpec, result.intentLedger)
        : [];
    const allAssertionsPassed =
      semanticAssertions.length > 0 &&
      semanticAssertions.every((assertion) => assertion.passed);
    // passed ONLY when the stage reached spec-ready AND every semantic assertion
    // held. Cost/tokens never influence this.
    const passed = result.status === "spec-ready" && allAssertionsPassed;

    // Reproducible, credential-free report. GameSpec + IntentLedger are stored in
    // full; hashes are recomputed independently so a reviewer can re-verify them.
    const report = {
      checkedAt: new Date().toISOString(),
      status: result.status,
      passed,
      requestedModel: PROBE_MODEL,
      pricingNote: PRICING_NOTE,
      request: {
        prompt: PROBE_PROMPT,
        sha256: result.request.sha256,
      },
      gameSpec: result.status === "spec-ready" ? result.gameSpec : undefined,
      gameSpecSha256:
        result.status === "spec-ready" ? result.gameSpecSha256 : undefined,
      recomputedGameSpecSha256:
        result.status === "spec-ready"
          ? sha256GameSpecV2(result.gameSpec)
          : undefined,
      intentLedger:
        result.status === "spec-ready" ? result.intentLedger : undefined,
      semanticAssertions,
      // Audit-only usage. NOT a budget gate; recorded so cost/tokens are visible.
      usageRecordOnly: redactedProvenance(result),
      failure: result.status === "bounded-failure" ? result.failure : undefined,
      clarification:
        result.status === "needs-clarification"
          ? {
              clarificationId: result.clarificationId,
              questions: result.questions,
            }
          : undefined,
    };
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    process.stdout.write(
      `${JSON.stringify({ status: report.status, passed: report.passed, assertions: semanticAssertions.map((a) => ({ id: a.id, passed: a.passed })) })}\n`,
    );
    if (!passed) process.exitCode = 1;
  } catch (error) {
    // Never leak the key; only a redacted error name/message.
    const safeError = {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
    };
    const report = {
      checkedAt: new Date().toISOString(),
      status: "probe-failed",
      passed: false,
      error: safeError,
    };
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    process.stdout.write(`${JSON.stringify(report)}\n`);
    process.exitCode = 1;
  }
}

// Only run the live probe when this file is executed directly. Importing it
// (e.g. for offline assertion recompute) must NOT trigger a model call.
if (
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  await main();
}
