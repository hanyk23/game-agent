import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  didDesignAgentV2StructuralAssertionsPass,
  evaluateDesignAgentV2StructuralAssertions,
} from "./design-agent-v2-structural-assertions.js";
import { sha256GameDesignV2 } from "../src/gameplay/game-design-v2.js";
import { runDesignAgentStage } from "../src/orchestration/run-design-agent-stage.js";
import { analyzeDesignWithDeepSeek } from "../src/requirements/deepseek-design-agent-adapter.js";
import type { DesignStageV2Result } from "../src/requirements/design-agent-result.js";
import {
  parseGameSpecV2,
  sha256GameSpecV2,
  type GameSpecV2,
} from "../src/requirements/game-spec-v2.js";
import {
  parseIntentLedgerV2,
  sha256IntentLedgerV2,
  verifyIntentLedgerV2,
  type IntentLedgerV2,
} from "../src/requirements/intent-ledger-v2.js";

/**
 * Controlled real DeepSeek probe for the single-call direct GameDesignV2 stage.
 * This file owns live I/O only; objective assertions live in the shared pure
 * evaluator used by both live and offline report paths.
 */

const UPSTREAM_REPORT_RELATIVE_PATH = path.join(
  "evals",
  "reports",
  "spec-agent-v2-live-probe-deepseek-v4-pro.json",
);

const PROBE_REQUEST_PROMPT =
  "我想要一个横屏的弹幕射击 H5 游戏：玩家可以在二维平面里自由移动，用鼠标瞄准射击，不要 Boss，存活满 120 秒后进入结算。";

const PROBE_MODEL = "deepseek-v4-flash" as const;
const PROBE_THINKING = { type: "enabled" } as const;
const PROBE_MAX_OUTPUT_TOKENS = 32_768;
const PROBE_TIMEOUT_MS = 300_000;
const PROBE_TOOL_COUNT = 1;

const PROBE_REQUEST_CONFIG = {
  model: PROBE_MODEL,
  thinking: PROBE_THINKING,
  maxTokens: PROBE_MAX_OUTPUT_TOKENS,
  timeoutMs: PROBE_TIMEOUT_MS,
  stream: false,
  toolCount: PROBE_TOOL_COUNT,
} as const;

function requestSha256Of(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function redactedProvenance(result: DesignStageV2Result): unknown {
  return "provenance" in result ? result.provenance : undefined;
}

async function loadVerifiedUpstream(projectDirectory: string): Promise<{
  gameSpec: GameSpecV2;
  intentLedger: IntentLedgerV2;
  gameSpecSha256: string;
  intentLedgerSha256: string;
}> {
  const reportPath = path.join(projectDirectory, UPSTREAM_REPORT_RELATIVE_PATH);
  const raw = JSON.parse(await readFile(reportPath, "utf8")) as {
    gameSpec?: unknown;
    intentLedger?: unknown;
    gameSpecSha256?: unknown;
  };
  const gameSpec = parseGameSpecV2(raw.gameSpec);
  const intentLedger = parseIntentLedgerV2(raw.intentLedger);
  const gameSpecSha256 = sha256GameSpecV2(gameSpec);
  if (
    typeof raw.gameSpecSha256 === "string" &&
    raw.gameSpecSha256 !== gameSpecSha256
  ) {
    throw new Error(
      "saved GameSpec sha256 does not match the recomputed digest; upstream is inconsistent.",
    );
  }
  verifyIntentLedgerV2(
    { language: "zh-CN", prompt: PROBE_REQUEST_PROMPT },
    gameSpec,
    intentLedger,
  );
  return {
    gameSpec,
    intentLedger,
    gameSpecSha256,
    intentLedgerSha256: sha256IntentLedgerV2(intentLedger),
  };
}

async function main(): Promise<void> {
  const projectDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  );
  const checkedAt = new Date();
  const reportTimestamp = checkedAt
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replaceAll(".", "");
  const reportPath = path.join(
    projectDirectory,
    "evals",
    "reports",
    `design-agent-v2-live-probe-thinking-${reportTimestamp}.json`,
  );
  await mkdir(path.dirname(reportPath), { recursive: true });

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    const report = {
      checkedAt: checkedAt.toISOString(),
      status: "skipped-no-credential",
      passed: false,
      message: "环境缺少凭据，无法进行 live probe。",
      requestConfig: PROBE_REQUEST_CONFIG,
    };
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    process.stdout.write(`${JSON.stringify(report)}\n`);
    return;
  }

  let upstream: Awaited<ReturnType<typeof loadVerifiedUpstream>>;
  try {
    upstream = await loadVerifiedUpstream(projectDirectory);
  } catch (error) {
    const report = {
      checkedAt: checkedAt.toISOString(),
      status: "upstream-unavailable",
      passed: false,
      requestConfig: PROBE_REQUEST_CONFIG,
      message:
        "已保存的 GameSpecV2/IntentLedgerV2 缺失或校验失败，无法进行 live probe。",
      error: {
        name: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : String(error),
      },
    };
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    process.stdout.write(`${JSON.stringify(report)}\n`);
    process.exitCode = 1;
    return;
  }

  const requestSha256 = requestSha256Of(PROBE_REQUEST_PROMPT);

  try {
    const { result } = await runDesignAgentStage(
      {
        request: { language: "zh-CN", prompt: PROBE_REQUEST_PROMPT },
        gameSpec: upstream.gameSpec,
        intentLedger: upstream.intentLedger,
      },
      {
        analyze: (input) =>
          analyzeDesignWithDeepSeek({
            apiKey,
            request: input.request.prompt,
            gameSpec: input.gameSpec,
            intentLedger: input.intentLedger,
            model: PROBE_MODEL,
            timeoutMs: PROBE_TIMEOUT_MS,
            maxOutputTokens: PROBE_MAX_OUTPUT_TOKENS,
          }),
        budget: { maxAttempts: 1 },
      },
    );

    const structuralAssertions =
      result.status === "design-ready"
        ? evaluateDesignAgentV2StructuralAssertions({
            result,
            intentLedger: upstream.intentLedger,
            expectedRequestSha256: requestSha256,
            expectedGameSpecSha256: upstream.gameSpecSha256,
            expectedIntentLedgerSha256: upstream.intentLedgerSha256,
          })
        : [];
    const passed = didDesignAgentV2StructuralAssertionsPass(
      result.status,
      structuralAssertions,
    );

    const report = {
      checkedAt: checkedAt.toISOString(),
      status: result.status,
      passed,
      requestConfig: PROBE_REQUEST_CONFIG,
      request: {
        prompt: PROBE_REQUEST_PROMPT,
        sha256: requestSha256,
      },
      inputHashes: {
        request: requestSha256,
        gameSpec: upstream.gameSpecSha256,
        intentLedger: upstream.intentLedgerSha256,
      },
      gameDesign:
        result.status === "design-ready" ? result.gameDesign : undefined,
      gameDesignSha256:
        result.status === "design-ready" ? result.gameDesignSha256 : undefined,
      recomputedGameDesignSha256:
        result.status === "design-ready"
          ? sha256GameDesignV2(result.gameDesign)
          : undefined,
      requirementCoverage:
        result.status === "design-ready"
          ? {
              lockedStatementIds: upstream.intentLedger.entries
                .filter((entry) => entry.locked === true)
                .map((entry) => entry.statementId),
              decisions: result.gameDesign.requirementBindings.decisions.map(
                (decision) => ({
                  decisionId: decision.id,
                  source: decision.source,
                  ...(decision.source === "agent-derived"
                    ? { rationale: decision.rationale }
                    : { statementId: decision.statementId }),
                }),
              ),
              forbidden: result.gameDesign.requirementBindings.forbidden,
            }
          : undefined,
      structuralAssertions,
      usageRecordOnly: redactedProvenance(result),
      failure: result.status === "bounded-failure" ? result.failure : undefined,
      failureEvidence:
        result.status === "bounded-failure"
          ? result.failureEvidence
          : undefined,
      clarification:
        result.status === "needs-clarification" ? result.questions : undefined,
    };
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    process.stdout.write(
      `${JSON.stringify({
        status: report.status,
        passed: report.passed,
        assertions: structuralAssertions.map((assertion) => ({
          id: assertion.id,
          passed: assertion.passed,
        })),
      })}\n`,
    );
    if (!passed) process.exitCode = 1;
  } catch (error) {
    const safeError = {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
    };
    const report = {
      checkedAt: checkedAt.toISOString(),
      status: "probe-failed",
      passed: false,
      requestConfig: PROBE_REQUEST_CONFIG,
      error: safeError,
    };
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    process.stdout.write(`${JSON.stringify(report)}\n`);
    process.exitCode = 1;
  }
}

if (
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  await main();
}
