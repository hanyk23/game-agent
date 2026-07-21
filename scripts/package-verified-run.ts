import path from "node:path";
import { fileURLToPath } from "node:url";

import { z } from "zod";

import { runPackagingStage } from "../src/orchestration/run-packaging-stage.js";

const [runId] = z
  .tuple([z.string().uuid()])
  .parse(process.argv.slice(2).filter((argument) => argument !== "--"));
const projectDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const result = await runPackagingStage({ projectDirectory, runId });

process.stdout.write(
  `${JSON.stringify({
    status: result.manifest.state,
    runId: result.manifest.runId,
    deliveryDirectory: path.relative(
      projectDirectory,
      result.deliveryDirectory,
    ),
    deliverySha256: result.manifest.artifacts.delivery?.sha256,
    deliveryManifestSha256: result.manifest.artifacts.deliveryManifest?.sha256,
  })}\n`,
);
