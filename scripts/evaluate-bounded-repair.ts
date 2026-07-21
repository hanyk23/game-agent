import { randomUUID } from "node:crypto";
import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  executeFixedViteBuild,
  runCompositionStage,
} from "../src/orchestration/run-composition-stage.js";
import { runBoundedRepairRound } from "../src/repair/bounded-repair-controller.js";
import { digestDirectory, sha256File } from "../src/runs/artifact-hash.js";
import {
  createRunManifest,
  RunManifestSchema,
  transitionRunManifest,
} from "../src/runs/run-manifest.js";
import { createBrowserGateSpec } from "../src/verification/browser-gate-spec.js";
import {
  BrowserVerificationFailure,
  runBrowserVerificationStage,
} from "../src/verification/browser-verification-stage.js";

const projectDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const targetRelativePath =
  "game-template/vertical-shooter/src/scenes/play-scene.ts";
const healthyLine = "      direction.y * demoRuntimeConfig.player.moveSpeed,\n";
const faultyLine = "      0,\n";

function toJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function writeAtomic(filePath: string, contents: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, contents, "utf8");
  await rename(temporaryPath, filePath);
}

async function writeJsonAtomic(
  filePath: string,
  value: unknown,
): Promise<void> {
  await writeAtomic(filePath, toJson(value));
}

let manifest = createRunManifest(
  "Controlled deterministic runtime-repair evaluation without a model call.",
);
manifest = transitionRunManifest(
  manifest,
  "spec_generated",
  "Local repair-evaluation fixture loaded without a model call.",
);
manifest = transitionRunManifest(
  manifest,
  "spec_validated",
  "Repair-evaluation fixture entered unchanged local validation.",
);
const composed = await runCompositionStage({
  projectDirectory,
  manifest,
  spec: createBrowserGateSpec(),
  resourceProfile: "mobile",
});
const runDirectory = composed.runDirectory;
const manifestPath = path.join(runDirectory, "manifest.json");
const workspaceDirectory = path.join(runDirectory, "workspace");
const targetPath = path.join(workspaceDirectory, targetRelativePath);
const setupDirectory = path.join(runDirectory, "evaluation", "setup");
const originalPath = path.join(setupDirectory, "before", targetRelativePath);
await mkdir(path.dirname(originalPath), { recursive: true });
await copyFile(targetPath, originalPath);
const healthySource = await readFile(targetPath, "utf8");
if (healthySource.split(healthyLine).length - 1 !== 1) {
  throw new Error("controlled fault target must match exactly once");
}
const faultySource = healthySource.replace(healthyLine, faultyLine);
await writeAtomic(targetPath, faultySource);

const originalPackage = composed.manifest.artifacts.package;
if (!originalPackage) throw new Error("initial package evidence is missing");
const faultyPackageRelativePath = "evaluation/setup/package";
const faultyPackageDirectory = path.join(
  runDirectory,
  faultyPackageRelativePath,
);
await executeFixedViteBuild({
  projectDirectory,
  templateDirectory: path.join(
    workspaceDirectory,
    "game-template",
    "vertical-shooter",
  ),
  packageDirectory: faultyPackageDirectory,
});
const faultyPackageDigest = await digestDirectory(faultyPackageDirectory);
const setupBuildRelativePath = "evaluation/setup/build.json";
const setupBuildPath = path.join(runDirectory, setupBuildRelativePath);
await writeJsonAtomic(setupBuildPath, {
  tool: "vite",
  status: "passed",
  exitCode: 0,
  outputFileCount: faultyPackageDigest.fileCount,
  outputBytes: faultyPackageDigest.totalBytes,
});
const faultyWorkspaceDigest = await digestDirectory(workspaceDirectory);
manifest = RunManifestSchema.parse({
  ...composed.manifest,
  artifacts: {
    ...composed.manifest.artifacts,
    workspace: { path: "workspace", sha256: faultyWorkspaceDigest.sha256 },
    package: {
      path: faultyPackageRelativePath,
      sha256: faultyPackageDigest.sha256,
    },
    buildLog: {
      path: setupBuildRelativePath,
      sha256: await sha256File(setupBuildPath),
    },
  },
});
await writeJsonAtomic(manifestPath, manifest);
await writeJsonAtomic(path.join(setupDirectory, "fault-injection.json"), {
  evaluationSetupVersion: "1.0.0",
  fault: "keyboard vertical velocity forced to zero",
  target: targetRelativePath,
  healthySha256: await sha256File(originalPath),
  faultySha256: await sha256File(targetPath),
  originalPackage,
  faultyPackage: {
    path: faultyPackageRelativePath,
    sha256: faultyPackageDigest.sha256,
  },
  modelCall: null,
});

let browserFailure: BrowserVerificationFailure | undefined;
try {
  await runBrowserVerificationStage({
    projectDirectory,
    runId: manifest.runId,
    failureDisposition: "repairable",
  });
} catch (error) {
  if (!(error instanceof BrowserVerificationFailure)) throw error;
  browserFailure = error;
}
if (!browserFailure) {
  throw new Error("controlled runtime fault unexpectedly passed browser gates");
}
const failedManifest = RunManifestSchema.parse(
  JSON.parse(await readFile(manifestPath, "utf8")),
);
if (failedManifest.state !== "built") {
  throw new Error("repairable browser failure must preserve the built state");
}
const failedVerification = failedManifest.artifacts.verification;
if (!failedVerification)
  throw new Error("failed verification evidence is missing");

const faultySha256 = await sha256File(targetPath);
const repair = await runBoundedRepairRound({
  projectDirectory,
  runId: manifest.runId,
  finding: browserFailure.finding,
  repairExecutor: async (finding) => ({
    findingId: finding.id,
    summary: "Restore the configured vertical keyboard velocity expression.",
    patches: [
      {
        path: targetRelativePath,
        expectedSha256: faultySha256,
        replacements: [{ search: faultyLine, replacement: healthyLine }],
      },
    ],
  }),
});
const verified = await runBrowserVerificationStage({
  projectDirectory,
  runId: manifest.runId,
  attempt: repair.manifest.repairBudget.usedRounds,
});
const finalVerification = verified.artifacts.verification;
if (!finalVerification)
  throw new Error("final verification evidence is missing");

const reportPath = path.join(
  projectDirectory,
  "evals",
  "reports",
  "bounded-runtime-repair.json",
);
await writeJsonAtomic(reportPath, {
  evaluationVersion: "1.0.0",
  status: "passed",
  runId: verified.runId,
  controlledFault: {
    target: targetRelativePath,
    code: browserFailure.finding.code,
    fingerprint: browserFailure.finding.fingerprint,
  },
  failedVerification,
  repair: {
    roundsUsed: verified.repairBudget.usedRounds,
    maximumRounds: verified.repairBudget.maximumRounds,
    directory: path
      .relative(runDirectory, repair.repairDirectory)
      .replaceAll("\\", "/"),
    modelCall: null,
  },
  finalState: verified.state,
  finalPackage: verified.artifacts.package,
  finalVerification,
});

process.stdout.write(
  `${JSON.stringify({
    status: verified.state,
    runId: verified.runId,
    finding: browserFailure.finding.code,
    repairRoundsUsed: verified.repairBudget.usedRounds,
    verificationSha256: finalVerification.sha256,
    reportSha256: await sha256File(reportPath),
  })}\n`,
);
