import { randomUUID, createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  NaturalLanguageProbeCaseFileSchema,
  naturalLanguageProbeCasePath,
  parseNaturalLanguageProbeCase,
  preflightNaturalLanguageProbePrompt,
} from "../src/evaluation/natural-language-probe-case.js";
import { analyzeRequirementWithDeepSeek } from "../src/requirements/deepseek-requirement-adapter.js";
import { completeShooterGameSpec } from "../src/requirements/spec-completion-policy.js";

const MODEL = "deepseek-v4-flash" as const;
const AUTHORIZED_INPUT_TOKENS = 4_096;
const MAX_OUTPUT_TOKENS = 8_192;
const AUTHORIZED_CALLS = 1;
const AUTHORIZED_COST_CNY = 0.05;
const CACHE_HIT_INPUT_USD_PER_MILLION = 0.0028;
const CACHE_MISS_INPUT_USD_PER_MILLION = 0.14;
const OUTPUT_USD_PER_MILLION = 0.28;
const CONSERVATIVE_CNY_PER_USD = 7.5;

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function estimateCostUsd(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens * CACHE_MISS_INPUT_USD_PER_MILLION +
      outputTokens * OUTPUT_USD_PER_MILLION) /
    1_000_000
  );
}

async function writeReport(
  reportPath: string,
  report: Record<string, unknown>,
): Promise<void> {
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((argument) => argument !== "--");
  const preflightOnly = args.includes("--preflight-only");
  const caseArgs = args.filter((argument) => argument !== "--preflight-only");
  if (caseArgs.length > 1) {
    throw new Error("Expected at most one natural-language probe case file.");
  }
  const caseFile = NaturalLanguageProbeCaseFileSchema.parse(
    caseArgs[0] ?? "natural-language-probe-v1.json",
  );
  const casePath = naturalLanguageProbeCasePath(caseFile);
  const projectDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  );
  const caseJson = await readFile(
    path.join(projectDirectory, casePath),
    "utf8",
  );
  const probe = parseNaturalLanguageProbeCase(JSON.parse(caseJson));
  const preflight = preflightNaturalLanguageProbePrompt(probe.prompt);
  if (preflight.status !== "passed") {
    throw new Error(
      "Natural-language probe prompt failed safe local preflight.",
    );
  }
  if (preflightOnly) {
    process.stdout.write(
      `${JSON.stringify({
        caseId: probe.caseId,
        casePath,
        caseSha256: sha256(caseJson),
        promptSha256: sha256(probe.prompt),
        ...preflight,
        modelRequests: 0,
      })}\n`,
    );
    return;
  }
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error(
      "DEEPSEEK_API_KEY must be supplied through the process environment.",
    );
  }

  const probeRunId = randomUUID();
  const runDirectory = path.join(
    projectDirectory,
    "artifacts",
    "evaluations",
    "natural-language-probes",
    probeRunId,
  );
  const reportPath = path.join(runDirectory, "report.json");
  const startedAt = new Date().toISOString();
  await mkdir(runDirectory, { recursive: true });

  const commonEvidence = {
    reportVersion: "1.0.0",
    probeRunId,
    caseVersion: probe.caseVersion,
    caseId: probe.caseId,
    casePath,
    caseSha256: sha256(caseJson),
    promptSha256: sha256(probe.prompt),
    model: MODEL,
    authorization: {
      purpose: "natural-language requirement extraction only",
      callLimit: AUTHORIZED_CALLS,
      automaticRetries: 0,
      inputTokenBudget: AUTHORIZED_INPUT_TOKENS,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      costCeilingCny: AUTHORIZED_COST_CNY,
    },
    startedAt,
  };

  try {
    const result = await analyzeRequirementWithDeepSeek({
      apiKey,
      prompt: probe.prompt,
      model: MODEL,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });
    const completionPreflight = completeShooterGameSpec(result.spec);
    const estimatedCostUsd = estimateCostUsd(
      result.usage.inputTokens,
      result.usage.outputTokens,
    );
    const estimatedCostCnyUpper = estimatedCostUsd * CONSERVATIVE_CNY_PER_USD;
    if (result.usage.inputTokens > AUTHORIZED_INPUT_TOKENS) {
      throw new Error(
        `Provider input usage exceeded the authorized ${AUTHORIZED_INPUT_TOKENS}-token budget.`,
      );
    }
    if (estimatedCostCnyUpper > AUTHORIZED_COST_CNY) {
      throw new Error(
        `Provider usage exceeded the authorized CNY ${AUTHORIZED_COST_CNY.toFixed(2)} ceiling.`,
      );
    }

    const report = {
      ...commonEvidence,
      completedAt: new Date().toISOString(),
      status: "passed",
      modelRequests: 1,
      outputMode: "deepseek_json_object",
      usage: {
        ...result.usage,
        estimatedCostUsd,
        estimatedCostCnyUpper,
        pricingBasis: {
          input: "cache-miss upper estimate",
          officialPriceCurrency: "USD",
          cacheHitInputUsdPerMillionTokens: CACHE_HIT_INPUT_USD_PER_MILLION,
          cacheMissInputUsdPerMillionTokens: CACHE_MISS_INPUT_USD_PER_MILLION,
          outputUsdPerMillionTokens: OUTPUT_USD_PER_MILLION,
          conservativeCnyPerUsd: CONSERVATIVE_CNY_PER_USD,
          source: "https://api-docs.deepseek.com/quick_start/pricing",
          checkedAt: "2026-07-16",
        },
      },
      validation: {
        validator: "ShooterGameSpec",
        schemaVersion: result.spec.schemaVersion,
        status: "passed",
        completionPolicy: {
          policyId: completionPreflight.artifact.policyId,
          status: "passed",
          decisionCount: completionPreflight.artifact.decisions.length,
          completedSpecSha256:
            completionPreflight.artifact.completedSpec.sha256,
        },
      },
      spec: result.spec,
    };
    await writeReport(reportPath, report);
    process.stdout.write(
      `${JSON.stringify({
        status: report.status,
        probeRunId,
        caseId: probe.caseId,
        model: result.model,
        usage: report.usage,
        reportPath,
      })}\n`,
    );
  } catch (error) {
    const safeError = {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
    };
    await writeReport(reportPath, {
      ...commonEvidence,
      completedAt: new Date().toISOString(),
      status: "failed",
      modelRequests: 1,
      error: safeError,
    });
    throw error;
  }
}

await main();
