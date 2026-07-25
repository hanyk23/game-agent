import path from "node:path";
import { fileURLToPath } from "node:url";

import { runCompositionStage } from "../src/orchestration/run-composition-stage.js";
import {
  createRunManifest,
  transitionRunManifest,
} from "../src/runs/run-manifest.js";
import { createBrowserGateSpec } from "../src/verification/browser-gate-spec.js";
import { runBrowserVerificationStage } from "../src/verification/browser-verification-stage.js";

const projectDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const browserGateSpec = createBrowserGateSpec();

let manifest = createRunManifest(
  "Deterministic local Spec for desktop and mobile browser acceptance gates.",
);
manifest = transitionRunManifest(
  manifest,
  "spec_generated",
  "Local browser-gate fixture loaded without a model call.",
);
manifest = transitionRunManifest(
  manifest,
  "spec_validated",
  "Browser-gate fixture entered unchanged local validation.",
);

const composed = await runCompositionStage({
  projectDirectory,
  manifest,
  spec: browserGateSpec,
  resourceProfile: "mobile",
  enableAssetSelection: true,
});
const verified = await runBrowserVerificationStage({
  projectDirectory,
  runId: composed.manifest.runId,
});

process.stdout.write(
  `${JSON.stringify({
    status: verified.state,
    runId: verified.runId,
    runDirectory: path.relative(projectDirectory, composed.runDirectory),
    verificationSha256: verified.artifacts.verification?.sha256,
  })}\n`,
);
