import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { z } from "zod";

import {
  didDesignAgentV2StructuralAssertionsPass,
  evaluateDesignAgentV2StructuralAssertions,
} from "./design-agent-v2-structural-assertions.js";
import {
  parseGameDesignV2,
  sha256GameDesignV2,
} from "../src/gameplay/game-design-v2.js";
import { DesignStageV2ResultSchema } from "../src/requirements/design-agent-result.js";
import {
  parseGameSpecV2,
  sha256GameSpecV2,
} from "../src/requirements/game-spec-v2.js";
import {
  parseIntentLedgerV2,
  sha256IntentLedgerV2,
  verifyIntentLedgerV2,
} from "../src/requirements/intent-ledger-v2.js";

const SHA256_HEX = /^[0-9a-f]{64}$/u;

const SavedDesignReportSchema = z.object({
  status: z.literal("design-ready"),
  request: z.object({
    prompt: z.string().min(1),
    sha256: z.string().regex(SHA256_HEX),
  }),
  inputHashes: z.object({
    request: z.string().regex(SHA256_HEX),
    gameSpec: z.string().regex(SHA256_HEX),
    intentLedger: z.string().regex(SHA256_HEX),
  }),
  gameDesign: z.unknown(),
  gameDesignSha256: z.string().regex(SHA256_HEX),
  recomputedGameDesignSha256: z.string().regex(SHA256_HEX),
  usageRecordOnly: z.unknown(),
});

const SavedUpstreamReportSchema = z.object({
  gameSpec: z.unknown(),
  intentLedger: z.unknown(),
  gameSpecSha256: z.string().regex(SHA256_HEX),
});

export const DEFAULT_SOURCE_REPORT_RELATIVE_PATH = path.join(
  "evals",
  "reports",
  "design-agent-v2-live-probe-thinking-20260801T035539712Z.json",
);

export const DEFAULT_REAUDIT_REPORT_RELATIVE_PATH = path.join(
  "evals",
  "reports",
  "design-agent-v2-live-probe-thinking-20260801T035539712Z-reaudit.json",
);

const DEFAULT_UPSTREAM_REPORT_RELATIVE_PATH = path.join(
  "evals",
  "reports",
  "spec-agent-v2-live-probe-deepseek-v4-pro.json",
);

function sha256(value: Uint8Array | string): string {
  return createHash("sha256").update(value).digest("hex");
}

export type RecheckDesignAgentV2ReportOptions = Readonly<{
  projectDirectory: string;
  sourceReportPath?: string;
  upstreamReportPath?: string;
  outputReportPath?: string;
  now?: () => Date;
}>;

export async function recheckDesignAgentV2Report(
  options: RecheckDesignAgentV2ReportOptions,
) {
  const sourceReportPath =
    options.sourceReportPath ??
    path.join(options.projectDirectory, DEFAULT_SOURCE_REPORT_RELATIVE_PATH);
  const upstreamReportPath =
    options.upstreamReportPath ??
    path.join(options.projectDirectory, DEFAULT_UPSTREAM_REPORT_RELATIVE_PATH);
  const outputReportPath =
    options.outputReportPath ??
    path.join(options.projectDirectory, DEFAULT_REAUDIT_REPORT_RELATIVE_PATH);
  const now = options.now ?? (() => new Date());

  const sourceBytesBefore = await readFile(sourceReportPath);
  const sourceReportSha256Before = sha256(sourceBytesBefore);
  const source = SavedDesignReportSchema.parse(
    JSON.parse(sourceBytesBefore.toString("utf8")),
  );

  const gameDesign = parseGameDesignV2(source.gameDesign);
  const recomputedGameDesignSha256 = sha256GameDesignV2(gameDesign);
  if (
    source.gameDesignSha256 !== recomputedGameDesignSha256 ||
    source.recomputedGameDesignSha256 !== recomputedGameDesignSha256
  ) {
    throw new Error(
      "saved GameDesignV2 hash does not match the recomputed digest",
    );
  }

  const upstream = SavedUpstreamReportSchema.parse(
    JSON.parse(await readFile(upstreamReportPath, "utf8")),
  );
  const gameSpec = parseGameSpecV2(upstream.gameSpec);
  const intentLedger = parseIntentLedgerV2(upstream.intentLedger);
  const gameSpecSha256 = sha256GameSpecV2(gameSpec);
  const intentLedgerSha256 = sha256IntentLedgerV2(intentLedger);
  if (upstream.gameSpecSha256 !== gameSpecSha256) {
    throw new Error(
      "saved GameSpecV2 hash does not match the recomputed digest",
    );
  }

  const requestSha256 = sha256(source.request.prompt);
  if (
    source.request.sha256 !== requestSha256 ||
    source.inputHashes.request !== requestSha256
  ) {
    throw new Error("saved Request hash does not match the recomputed digest");
  }
  verifyIntentLedgerV2(
    { language: "zh-CN", prompt: source.request.prompt },
    gameSpec,
    intentLedger,
  );

  const result = DesignStageV2ResultSchema.parse({
    schemaVersion: "2.0.0",
    kind: "design-stage-v2-result",
    status: source.status,
    request: {
      language: "zh-CN",
      prompt: source.request.prompt,
      sha256: source.request.sha256,
    },
    gameDesign,
    gameDesignSha256: source.gameDesignSha256,
    gameSpecSha256: source.inputHashes.gameSpec,
    intentLedgerSha256: source.inputHashes.intentLedger,
    provenance: source.usageRecordOnly,
  });
  if (result.status !== "design-ready") {
    throw new Error("saved report did not contain a design-ready result");
  }

  const structuralAssertions = evaluateDesignAgentV2StructuralAssertions({
    result,
    intentLedger,
    expectedRequestSha256: requestSha256,
    expectedGameSpecSha256: gameSpecSha256,
    expectedIntentLedgerSha256: intentLedgerSha256,
  });
  const passed = didDesignAgentV2StructuralAssertionsPass(
    result.status,
    structuralAssertions,
  );

  const sourceBytesAfter = await readFile(sourceReportPath);
  const sourceReportSha256After = sha256(sourceBytesAfter);
  if (sourceReportSha256After !== sourceReportSha256Before) {
    throw new Error("source live report changed during offline re-audit");
  }

  const report = {
    kind: "design-agent-v2-offline-reaudit",
    checkedAt: now().toISOString(),
    sourceReportPath: path.relative(options.projectDirectory, sourceReportPath),
    sourceReportSha256: sourceReportSha256Before,
    sourceReportSha256Before,
    sourceReportSha256After,
    sourceGameDesignSha256: source.gameDesignSha256,
    recomputedGameDesignSha256,
    status: result.status,
    passed,
    structuralAssertions,
    modelCalls: 0,
    reusedSavedArtifact: true,
  } as const;

  await mkdir(path.dirname(outputReportPath), { recursive: true });
  await writeFile(
    outputReportPath,
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );
  return report;
}

async function main(): Promise<void> {
  const projectDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  );
  const report = await recheckDesignAgentV2Report({ projectDirectory });
  process.stdout.write(
    `${JSON.stringify({
      status: report.status,
      passed: report.passed,
      modelCalls: report.modelCalls,
      assertions: report.structuralAssertions.map((assertion) => ({
        id: assertion.id,
        passed: assertion.passed,
      })),
    })}\n`,
  );
  if (!report.passed) process.exitCode = 1;
}

if (
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  await main();
}
