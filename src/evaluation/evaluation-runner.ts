import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { runCompositionStage } from "../orchestration/run-composition-stage.js";
import { runPackagingStage } from "../orchestration/run-packaging-stage.js";
import { parseShooterGameSpec } from "../requirements/shooter-game-spec.js";
import { digestDirectory } from "../runs/artifact-hash.js";
import {
  createRunManifest,
  RunManifestSchema,
  transitionRunManifest,
  type RunManifest,
} from "../runs/run-manifest.js";
import {
  BrowserVerificationFailure,
  runBrowserVerificationStage,
} from "../verification/browser-verification-stage.js";
import {
  EvaluationBatchDefinitionSchema,
  EvaluationBatchReportSchema,
  EvaluationCaseReportSchema,
  type EvaluationBatchDefinition,
  type EvaluationBatchReport,
  type EvaluationCaseDefinition,
  type EvaluationCaseReport,
} from "./evaluation-schema.js";

const EVALUATION_DIRECTORY = "artifacts/evaluations";
const RUNS_DIRECTORY = "artifacts/runs";

type GateResults = EvaluationCaseReport["gates"];
type FailureCategory = NonNullable<EvaluationCaseReport["failure"]>["category"];
type FailureStage = NonNullable<EvaluationCaseReport["failure"]>["stage"];

export type EvaluationRunnerOptions = Readonly<{
  projectDirectory: string;
  definition: EvaluationBatchDefinition;
  batchRunId?: string;
  now?: () => Date;
}>;

export type EvaluationRunnerResult = Readonly<{
  evaluationDirectory: string;
  definitionPath: string;
  reportPath: string;
  report: EvaluationBatchReport;
}>;

export async function createEvaluationDirectory(
  projectDirectory: string,
  batchRunId: string,
): Promise<string> {
  const evaluationDirectory = path.join(
    projectDirectory,
    EVALUATION_DIRECTORY,
    batchRunId,
  );
  await mkdir(path.dirname(evaluationDirectory), { recursive: true });
  await mkdir(evaluationDirectory);
  return evaluationDirectory;
}

function toJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function writeJsonAtomic(
  filePath: string,
  value: unknown,
): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, toJson(value), "utf8");
  await rename(temporaryPath, filePath);
}

function projectRelative(projectDirectory: string, filePath: string): string {
  const relative = path.relative(projectDirectory, filePath);
  if (
    relative === "" ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`evidence path must remain inside ${projectDirectory}`);
  }
  return relative.replaceAll("\\", "/");
}

function emptyGates(): GateResults {
  return {
    specValidation: "not-run",
    planning: "not-run",
    composition: "not-run",
    build: "not-run",
    desktopBrowser: "not-run",
    mobileBrowser: "not-run",
    packaging: "not-run",
  };
}

function applyManifestEvidence(
  gates: GateResults,
  manifest: RunManifest,
): GateResults {
  const reached = new Set(
    manifest.transitions.map((transition) => transition.to),
  );
  return {
    ...gates,
    planning: reached.has("planned") ? "passed" : gates.planning,
    composition: reached.has("composed") ? "passed" : gates.composition,
    build: reached.has("built") ? "passed" : gates.build,
    desktopBrowser:
      reached.has("runtime_checked") ||
      reached.has("play_checked") ||
      reached.has("packaged")
        ? "passed"
        : gates.desktopBrowser,
    mobileBrowser:
      reached.has("play_checked") || reached.has("packaged")
        ? "passed"
        : gates.mobileBrowser,
    packaging: reached.has("packaged") ? "passed" : gates.packaging,
  };
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await lstat(filePath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

async function readManifest(runDirectory: string): Promise<RunManifest | null> {
  const manifestPath = path.join(runDirectory, "manifest.json");
  if (!(await exists(manifestPath))) return null;
  return RunManifestSchema.parse(
    JSON.parse(await readFile(manifestPath, "utf8")),
  );
}

function safeMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.slice(0, 1_000) || "Unknown evaluation failure";
}

function classifyFailure(
  stage: FailureStage,
  error: unknown,
): {
  stage: FailureStage;
  category: FailureCategory;
  code: string;
  message: string;
} {
  if (error instanceof BrowserVerificationFailure) {
    return {
      stage: "browser",
      category: "browser-verification-failed",
      code: error.finding.code,
      message: error.finding.message,
    };
  }
  const categories: Record<FailureStage, FailureCategory> = {
    "spec-validation": "schema-invalid",
    planning: "planning-failed",
    composition: "composition-failed",
    build: "build-failed",
    browser: "browser-verification-failed",
    repair: "internal-error",
    packaging: "packaging-failed",
    internal: "internal-error",
  };
  return {
    stage,
    category: categories[stage],
    code: categories[stage],
    message: safeMessage(error),
  };
}

function markFailedGate(gates: GateResults, stage: FailureStage): GateResults {
  if (stage === "spec-validation")
    return { ...gates, specValidation: "failed" };
  if (stage === "planning") return { ...gates, planning: "failed" };
  if (stage === "composition") return { ...gates, composition: "failed" };
  if (stage === "build") return { ...gates, build: "failed" };
  if (stage === "packaging") return { ...gates, packaging: "failed" };
  return gates;
}

function artifactHashes(manifest: RunManifest | null) {
  if (manifest === null) return {};
  return Object.fromEntries(
    Object.entries(manifest.artifacts).flatMap(([name, evidence]) =>
      evidence === undefined ? [] : [[name, evidence.sha256]],
    ),
  );
}

type BrowserReportSummary = Readonly<{
  reportPath: string | null;
  desktopScreenshotPath: string | null;
  mobileScreenshotPath: string | null;
}>;

async function readBrowserReportSummary(
  projectDirectory: string,
  runDirectory: string,
  manifest: RunManifest | null,
): Promise<BrowserReportSummary> {
  const verification = manifest?.artifacts.verification;
  if (verification === undefined) {
    return {
      reportPath: null,
      desktopScreenshotPath: null,
      mobileScreenshotPath: null,
    };
  }
  const reportFile = path.join(
    runDirectory,
    ...verification.path.split("/"),
    "browser-gates.json",
  );
  if (!(await exists(reportFile))) {
    return {
      reportPath: null,
      desktopScreenshotPath: null,
      mobileScreenshotPath: null,
    };
  }
  const report = JSON.parse(await readFile(reportFile, "utf8")) as {
    cases?: Array<{ name?: unknown; screenshot?: unknown }>;
    completedCases?: Array<{ name?: unknown; screenshot?: unknown }>;
  };
  const cases = report.cases ?? report.completedCases ?? [];
  const screenshotFor = (name: "desktop" | "mobile") => {
    const screenshot = cases.find((entry) => entry.name === name)?.screenshot;
    return typeof screenshot === "string"
      ? projectRelative(projectDirectory, path.join(runDirectory, screenshot))
      : null;
  };
  return {
    reportPath: projectRelative(projectDirectory, reportFile),
    desktopScreenshotPath: screenshotFor("desktop"),
    mobileScreenshotPath: screenshotFor("mobile"),
  };
}

async function runCase(
  projectDirectory: string,
  definition: EvaluationCaseDefinition,
  now: () => Date,
): Promise<EvaluationCaseReport> {
  const startedAt = now();
  const startedClock = Date.now();
  let gates = emptyGates();
  let stage: FailureStage = "spec-validation";
  let failure: EvaluationCaseReport["failure"] = null;
  let manifest: RunManifest | null = null;
  let runDirectory: string | null = null;

  try {
    const spec = parseShooterGameSpec(definition.spec);
    gates = { ...gates, specValidation: "passed" };
    manifest = createRunManifest(definition.request);
    manifest = transitionRunManifest(
      manifest,
      "spec_generated",
      "Project-local evaluation Spec loaded without a model call.",
    );
    manifest = transitionRunManifest(
      manifest,
      "spec_validated",
      "Evaluation Spec passed unchanged local validation.",
    );
    runDirectory = path.join(projectDirectory, RUNS_DIRECTORY, manifest.runId);

    stage = "planning";
    const composed = await runCompositionStage({
      projectDirectory,
      manifest,
      spec,
      resourceProfile: definition.resourceProfile,
      enableAssetSelection: definition.enableAssetSelection,
    });
    runDirectory = composed.runDirectory;
    manifest = composed.manifest;
    gates = applyManifestEvidence(gates, manifest);

    stage = "browser";
    manifest = await runBrowserVerificationStage({
      projectDirectory,
      runId: manifest.runId,
      failureDisposition: "terminal",
      assertionProfile: {
        profileVersion: "1.0.0",
        profileId: definition.browserGate,
      },
    });
    gates = applyManifestEvidence(gates, manifest);

    stage = "packaging";
    const packaged = await runPackagingStage({
      projectDirectory,
      runId: manifest.runId,
    });
    manifest = packaged.manifest;
    gates = applyManifestEvidence(gates, manifest);
  } catch (error) {
    if (runDirectory !== null) {
      manifest = (await readManifest(runDirectory)) ?? manifest;
      if (manifest !== null) gates = applyManifestEvidence(gates, manifest);
    }
    if (error instanceof BrowserVerificationFailure) {
      const caseName = error.finding.evidence.caseName;
      if (caseName === "desktop") {
        gates = { ...gates, desktopBrowser: "failed" };
      } else if (caseName === "mobile") {
        gates = {
          ...gates,
          desktopBrowser: "passed",
          mobileBrowser: "failed",
        };
      }
    } else if (stage === "planning" && manifest !== null) {
      const reached = new Set(
        manifest.transitions.map((transition) => transition.to),
      );
      stage = reached.has("composed")
        ? "build"
        : reached.has("planned")
          ? "composition"
          : "planning";
      gates = markFailedGate(gates, stage);
    } else {
      gates = markFailedGate(gates, stage);
    }
    failure = classifyFailure(stage, error);
  }

  const completedAt = now();
  const browserEvidence =
    runDirectory === null
      ? {
          reportPath: null,
          desktopScreenshotPath: null,
          mobileScreenshotPath: null,
        }
      : await readBrowserReportSummary(
          projectDirectory,
          runDirectory,
          manifest,
        );
  const diskBytes =
    runDirectory !== null && (await exists(runDirectory))
      ? (await digestDirectory(runDirectory)).totalBytes
      : 0;
  const failed = failure !== null;
  const repairUsed = manifest?.repairBudget.usedRounds ?? 0;
  const manifestPath =
    runDirectory !== null &&
    (await exists(path.join(runDirectory, "manifest.json")))
      ? projectRelative(
          projectDirectory,
          path.join(runDirectory, "manifest.json"),
        )
      : null;

  return EvaluationCaseReportSchema.parse({
    reportVersion: "1.0.0",
    caseId: definition.caseId,
    request: definition.request,
    inputKind: definition.inputKind,
    expectedDifferentiators: definition.expectedDifferentiators,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    elapsedMs: Math.max(0, Date.now() - startedClock),
    status: failed ? "failed" : "passed",
    runId: manifest?.runId ?? null,
    runState: manifest?.state ?? null,
    runDirectory:
      runDirectory === null
        ? null
        : projectRelative(projectDirectory, runDirectory),
    diskBytes,
    gates,
    failure,
    repair: {
      maximumRounds: manifest?.repairBudget.maximumRounds ?? 3,
      usedRounds: repairUsed,
      attempted: repairUsed > 0,
      outcome: failed
        ? repairUsed > 0
          ? "failed"
          : "not-attempted-no-bounded-proposal"
        : repairUsed > 0
          ? "passed"
          : "not-needed",
    },
    manualIntervention: { required: false, count: 0 },
    modelUsage: {
      requestCount: 0,
      inputTokens: 0,
      outputTokens: 0,
      cost: { currency: "CNY", amount: 0 },
    },
    evidence: {
      manifestPath,
      browserReportPath: browserEvidence.reportPath,
      desktopScreenshotPath: browserEvidence.desktopScreenshotPath,
      mobileScreenshotPath: browserEvidence.mobileScreenshotPath,
      artifactHashes: artifactHashes(manifest),
    },
  });
}

export function summarizeEvaluationCases(
  cases: readonly EvaluationCaseReport[],
  elapsedMs: number,
) {
  const failureCounts = new Map<FailureCategory, number>();
  for (const evaluationCase of cases) {
    if (evaluationCase.failure !== null) {
      failureCounts.set(
        evaluationCase.failure.category,
        (failureCounts.get(evaluationCase.failure.category) ?? 0) + 1,
      );
    }
  }
  return {
    totalCases: cases.length,
    passedCases: cases.filter((entry) => entry.status === "passed").length,
    failedCases: cases.filter((entry) => entry.status === "failed").length,
    packagedCases: cases.filter((entry) => entry.runState === "packaged")
      .length,
    browserViewportPasses: cases.reduce(
      (total, entry) =>
        total +
        (entry.gates.desktopBrowser === "passed" ? 1 : 0) +
        (entry.gates.mobileBrowser === "passed" ? 1 : 0),
      0,
    ),
    elapsedMs,
    diskBytes: cases.reduce((total, entry) => total + entry.diskBytes, 0),
    repairRounds: cases.reduce(
      (total, entry) => total + entry.repair.usedRounds,
      0,
    ),
    manualInterventions: cases.reduce(
      (total, entry) => total + entry.manualIntervention.count,
      0,
    ),
    modelRequests: cases.reduce(
      (total, entry) => total + entry.modelUsage.requestCount,
      0,
    ),
    inputTokens: cases.reduce(
      (total, entry) => total + entry.modelUsage.inputTokens,
      0,
    ),
    outputTokens: cases.reduce(
      (total, entry) => total + entry.modelUsage.outputTokens,
      0,
    ),
    cost: {
      currency: "CNY" as const,
      amount: cases.reduce(
        (total, entry) => total + entry.modelUsage.cost.amount,
        0,
      ),
    },
    failureCounts: [...failureCounts.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([category, count]) => ({ category, count })),
  };
}

export async function runEvaluationBatch(
  options: EvaluationRunnerOptions,
): Promise<EvaluationRunnerResult> {
  const projectDirectory = path.resolve(options.projectDirectory);
  const definition = EvaluationBatchDefinitionSchema.parse(options.definition);
  const batchRunId = options.batchRunId ?? randomUUID();
  const now = options.now ?? (() => new Date());
  const startedAt = now();
  const startedClock = Date.now();
  const evaluationDirectory = await createEvaluationDirectory(
    projectDirectory,
    batchRunId,
  );
  const definitionPath = path.join(evaluationDirectory, "definition.json");
  const definitionJson = toJson(definition);
  await writeFile(definitionPath, definitionJson, "utf8");
  const definitionSha256 = createHash("sha256")
    .update(definitionJson)
    .digest("hex");

  const cases: EvaluationCaseReport[] = [];
  for (const evaluationCase of definition.cases) {
    cases.push(await runCase(projectDirectory, evaluationCase, now));
  }

  const completedAt = now();
  const elapsedMs = Math.max(0, Date.now() - startedClock);
  const firstFailure = cases.find((entry) => entry.failure !== null);
  const report = EvaluationBatchReportSchema.parse({
    reportVersion: "1.0.0",
    definitionVersion: definition.schemaVersion,
    definitionSha256,
    batchId: definition.batchId,
    batchRunId,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    executionMode: definition.executionMode,
    paidModelCallsAllowed: definition.paidModelCallsAllowed,
    cases,
    aggregate: summarizeEvaluationCases(cases, elapsedMs),
    firstEvidenceBackedGap:
      firstFailure?.failure === null || firstFailure === undefined
        ? null
        : {
            caseId: firstFailure.caseId,
            stage: firstFailure.failure.stage,
            category: firstFailure.failure.category,
            code: firstFailure.failure.code,
            summary: firstFailure.failure.message,
          },
    missingFinalAcceptanceDecisions: [
      "Prescribed generation time for the final 3-5 games",
      "Minimum final browser/version or real-device matrix",
      "Whether original or generated images count toward the 300-500-image target",
    ],
  });
  const reportPath = path.join(evaluationDirectory, "report.json");
  await writeJsonAtomic(reportPath, report);
  return { evaluationDirectory, definitionPath, reportPath, report };
}
