import path from "node:path";
import { fileURLToPath } from "node:url";

import { runEvaluationBatch } from "../src/evaluation/evaluation-runner.js";
import { createPhase6RehearsalDefinition } from "../src/evaluation/phase-6-rehearsal.js";

const projectDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const result = await runEvaluationBatch({
  projectDirectory,
  definition: createPhase6RehearsalDefinition(),
});

process.stdout.write(
  `${JSON.stringify({
    status:
      result.report.aggregate.failedCases === 0
        ? "passed"
        : "completed-with-failures",
    batchRunId: result.report.batchRunId,
    reportPath: path.relative(projectDirectory, result.reportPath),
    aggregate: result.report.aggregate,
    firstEvidenceBackedGap: result.report.firstEvidenceBackedGap,
  })}\n`,
);
