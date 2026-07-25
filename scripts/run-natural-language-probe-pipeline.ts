import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { z } from "zod";

import {
  NaturalLanguageProbeCasePathSchema,
  parseNaturalLanguageProbeCase,
} from "../src/evaluation/natural-language-probe-case.js";
import { runCompositionStage } from "../src/orchestration/run-composition-stage.js";
import { runPackagingStage } from "../src/orchestration/run-packaging-stage.js";
import { planSpecIntentLedger } from "../src/requirements/spec-intent-ledger.js";
import { parseShooterGameSpec } from "../src/requirements/shooter-game-spec.js";
import {
  createRunManifest,
  transitionRunManifest,
} from "../src/runs/run-manifest.js";
import { runBrowserVerificationStage } from "../src/verification/browser-verification-stage.js";

const extractionReportSchema = z
  .object({
    reportVersion: z.literal("1.0.0"),
    probeRunId: z.string().uuid(),
    caseId: z.string(),
    casePath: NaturalLanguageProbeCasePathSchema.optional(),
    caseSha256: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
    promptSha256: z.string().regex(/^[a-f0-9]{64}$/),
    status: z.literal("passed"),
    modelRequests: z.literal(1),
    spec: z.unknown(),
  })
  .passthrough();

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((argument) => argument !== "--");
  const buildOnly = args.includes("--build-only");
  const [probeRunId] = z
    .tuple([z.string().uuid()])
    .parse(args.filter((argument) => argument !== "--build-only"));
  const projectDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  );
  const probeDirectory = path.join(
    projectDirectory,
    "artifacts",
    "evaluations",
    "natural-language-probes",
    probeRunId,
  );
  const extractionReport = extractionReportSchema.parse(
    JSON.parse(
      await readFile(path.join(probeDirectory, "report.json"), "utf8"),
    ),
  );
  const casePath =
    extractionReport.casePath ?? "evals/cases/natural-language-probe-v1.json";
  const caseJson = await readFile(
    path.join(projectDirectory, casePath),
    "utf8",
  );
  const probeCase = parseNaturalLanguageProbeCase(JSON.parse(caseJson));
  if (
    extractionReport.caseSha256 !== undefined &&
    sha256(caseJson) !== extractionReport.caseSha256
  ) {
    throw new Error(
      "The extraction report is not bound to the current case file.",
    );
  }
  if (
    probeCase.caseId !== extractionReport.caseId ||
    sha256(probeCase.prompt) !== extractionReport.promptSha256
  ) {
    throw new Error(
      "The extraction report is not bound to the current probe request.",
    );
  }

  const spec = parseShooterGameSpec(extractionReport.spec);
  const intentRequest = {
    language: probeCase.language,
    prompt: probeCase.prompt,
  } as const;
  const intentLedger = planSpecIntentLedger(intentRequest, spec);
  let manifest = createRunManifest(probeCase.prompt);
  manifest = transitionRunManifest(
    manifest,
    "spec_generated",
    `Validated DeepSeek probe ${probeRunId} loaded without another model call.`,
  );
  manifest = transitionRunManifest(
    manifest,
    "spec_validated",
    "Extracted Spec re-entered the unchanged local validation boundary.",
  );
  const runId = manifest.runId;
  const pipelineReportsDirectory = path.join(probeDirectory, "pipeline-runs");
  await mkdir(pipelineReportsDirectory, { recursive: true });
  const pipelineReportPath = path.join(
    pipelineReportsDirectory,
    `${runId}.json`,
  );
  const startedAt = new Date();
  let stage = "planning-composition-build";

  try {
    const composed = await runCompositionStage({
      projectDirectory,
      manifest,
      spec,
      specIntent: { request: intentRequest, ledger: intentLedger },
      resourceProfile: "balanced",
      enableAssetSelection: true,
    });
    manifest = composed.manifest;

    if (buildOnly) {
      const report = {
        reportVersion: "1.0.0",
        probeRunId,
        caseId: probeCase.caseId,
        casePath,
        mode: "build-only",
        startedAt: startedAt.toISOString(),
        completedAt: new Date().toISOString(),
        elapsedMs: Date.now() - startedAt.getTime(),
        status: "passed",
        completedStage: "planning-composition-build",
        runId,
        runState: manifest.state,
        modelRequestsDuringPipeline: 0,
        browserCases: 0,
        packages: 0,
        artifacts: manifest.artifacts,
      } as const;
      await writeFile(
        pipelineReportPath,
        `${JSON.stringify(report, null, 2)}\n`,
        "utf8",
      );
      process.stdout.write(
        `${JSON.stringify({ ...report, pipelineReportPath })}\n`,
      );
      return;
    }

    stage = "desktop-mobile-browser";
    manifest = await runBrowserVerificationStage({
      projectDirectory,
      runId,
      failureDisposition: "terminal",
      assertionProfile: {
        profileVersion: "1.0.0",
        profileId: "case-aware-v1",
      },
    });

    stage = "static-packaging";
    const packaged = await runPackagingStage({ projectDirectory, runId });
    manifest = packaged.manifest;
    const report = {
      reportVersion: "1.0.0",
      probeRunId,
      caseId: probeCase.caseId,
      casePath,
      startedAt: startedAt.toISOString(),
      completedAt: new Date().toISOString(),
      elapsedMs: Date.now() - startedAt.getTime(),
      status: "passed",
      runId,
      runState: manifest.state,
      modelRequestsDuringPipeline: 0,
      artifacts: manifest.artifacts,
    };
    await writeFile(
      pipelineReportPath,
      `${JSON.stringify(report, null, 2)}\n`,
      "utf8",
    );
    process.stdout.write(
      `${JSON.stringify({ ...report, pipelineReportPath })}\n`,
    );
  } catch (error) {
    const report = {
      reportVersion: "1.0.0",
      probeRunId,
      caseId: probeCase.caseId,
      casePath,
      startedAt: startedAt.toISOString(),
      completedAt: new Date().toISOString(),
      elapsedMs: Date.now() - startedAt.getTime(),
      status: "failed",
      failedStage: stage,
      runId,
      modelRequestsDuringPipeline: 0,
      error: {
        name: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : String(error),
      },
    };
    await writeFile(
      pipelineReportPath,
      `${JSON.stringify(report, null, 2)}\n`,
      "utf8",
    );
    throw error;
  }
}

await main();
