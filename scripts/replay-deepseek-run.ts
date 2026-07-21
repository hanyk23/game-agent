import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runCompositionStage } from "../src/orchestration/run-composition-stage.js";
import {
  createRunManifest,
  transitionRunManifest,
} from "../src/runs/run-manifest.js";

const projectDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const reportPath = path.join(
  projectDirectory,
  "evals",
  "reports",
  "deepseek-direct-live-spec.json",
);
const report = JSON.parse(await readFile(reportPath, "utf8")) as {
  status?: unknown;
  spec?: unknown;
};

if (report.status !== "passed" || report.spec === undefined) {
  throw new Error("recorded DeepSeek report does not contain a passing Spec");
}

let manifest = createRunManifest(
  "Offline replay of the recorded passing DeepSeek ShooterGameSpec.",
);
manifest = transitionRunManifest(
  manifest,
  "spec_generated",
  "Recorded provider output loaded without a model call.",
);
manifest = transitionRunManifest(
  manifest,
  "spec_validated",
  "Recorded Spec re-entered the unchanged local validation boundary.",
);

const result = await runCompositionStage({
  projectDirectory,
  manifest,
  spec: report.spec,
  resourceProfile: "balanced",
});

process.stdout.write(
  `${JSON.stringify({
    status: result.manifest.state,
    runId: result.manifest.runId,
    runDirectory: path.relative(projectDirectory, result.runDirectory),
    resourceProfile: result.manifest.composition?.resourceProfile,
    adjustmentCount:
      result.manifest.composition?.budgetAdjustments.length ?? null,
    packageSha256: result.manifest.artifacts.package?.sha256,
  })}\n`,
);
