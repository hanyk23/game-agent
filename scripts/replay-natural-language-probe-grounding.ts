import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { z } from "zod";

import {
  NaturalLanguageProbeCasePathSchema,
  parseNaturalLanguageProbeCase,
} from "../src/evaluation/natural-language-probe-case.js";
import { verifyAssetCorpus } from "../src/assets/asset-corpus-verification.js";
import { planAssetQueryGrounding } from "../src/assets/asset-query-grounding.js";
import { planAssetSelections } from "../src/assets/asset-selection-plan.js";
import { parseShooterGameSpec } from "../src/requirements/shooter-game-spec.js";
import { completeShooterGameSpec } from "../src/requirements/spec-completion-policy.js";
import { sha256File } from "../src/runs/artifact-hash.js";

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

function toJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function main(): Promise<void> {
  const [probeRunId] = z
    .tuple([z.string().uuid()])
    .parse(process.argv.slice(2).filter((argument) => argument !== "--"));
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

  const startedAt = new Date();
  const sourceSpec = parseShooterGameSpec(extractionReport.spec);
  const completion = completeShooterGameSpec(sourceSpec);
  const spec = completion.completedSpec;
  const catalogPath = path.join(
    projectDirectory,
    "assets",
    "corpus",
    "catalog.json",
  );
  const corpusDirectory = path.dirname(catalogPath);
  const catalog = JSON.parse(await readFile(catalogPath, "utf8")) as unknown;
  const corpusVerification = await verifyAssetCorpus(
    corpusDirectory,
    catalog,
    150 * 1024 * 1024,
  );
  if (!corpusVerification.ok) {
    const firstIssue = corpusVerification.issues[0];
    throw new Error(
      `asset corpus verification failed: ${firstIssue?.path ?? "unknown"}:${firstIssue?.reason ?? "unknown"}`,
    );
  }
  const catalogSha256 = await sha256File(catalogPath);
  const grounding = planAssetQueryGrounding(spec, catalog, catalogSha256);
  const selection = planAssetSelections(spec, catalog, catalogSha256, {
    grounding,
  });

  const replayId = randomUUID();
  const replayDirectory = path.join(
    probeDirectory,
    "grounding-replays",
    replayId,
  );
  await mkdir(path.dirname(replayDirectory), { recursive: true });
  await mkdir(replayDirectory);
  const groundingJson = toJson(grounding);
  const selectionJson = toJson(selection);
  const sourceSpecJson = toJson(completion.sourceSpec);
  const completedSpecJson = toJson(completion.completedSpec);
  const completionJson = toJson(completion.artifact);
  await writeFile(
    path.join(replayDirectory, "source-spec.json"),
    sourceSpecJson,
    "utf8",
  );
  await writeFile(
    path.join(replayDirectory, "spec.json"),
    completedSpecJson,
    "utf8",
  );
  await writeFile(
    path.join(replayDirectory, "spec-completion.json"),
    completionJson,
    "utf8",
  );
  await writeFile(
    path.join(replayDirectory, "asset-query-grounding.json"),
    groundingJson,
    "utf8",
  );
  await writeFile(
    path.join(replayDirectory, "asset-selection.json"),
    selectionJson,
    "utf8",
  );
  const completedAt = new Date();
  const report = {
    reportVersion: "1.0.0",
    replayId,
    sourceProbeRunId: probeRunId,
    caseId: probeCase.caseId,
    casePath,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    elapsedMs: completedAt.getTime() - startedAt.getTime(),
    status: "passed",
    completedStage: "spec-completion-grounding-and-selection",
    sourceSpecSha256: completion.artifact.sourceSpec.sha256,
    completedSpecSha256: completion.artifact.completedSpec.sha256,
    completionSha256: sha256(completionJson),
    completionDecisionCount: completion.artifact.decisions.length,
    catalogSha256,
    groundingSha256: sha256(groundingJson),
    selectionSha256: sha256(selectionJson),
    queryCount: grounding.queries.length,
    selectionCount: selection.selections.length,
    selectedAssetIds: selection.selections.map(
      (entry) => entry.selectedAssetId,
    ),
    artifactBytes:
      Buffer.byteLength(sourceSpecJson, "utf8") +
      Buffer.byteLength(completedSpecJson, "utf8") +
      Buffer.byteLength(completionJson, "utf8") +
      Buffer.byteLength(groundingJson, "utf8") +
      Buffer.byteLength(selectionJson, "utf8"),
    modelRequestsDuringReplay: 0,
    browserCases: 0,
    packages: 0,
  } as const;
  const reportPath = path.join(replayDirectory, "report.json");
  await writeFile(reportPath, toJson(report), "utf8");
  process.stdout.write(
    `${JSON.stringify({ ...report, replayDirectory, reportPath })}\n`,
  );
}

await main();
