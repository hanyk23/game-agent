import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { z } from "zod";

import {
  NaturalLanguageProbeCasePathSchema,
  parseNaturalLanguageProbeCase,
} from "../src/evaluation/natural-language-probe-case.js";
import {
  planSpecIntentLedger,
  verifySpecIntentLedger,
} from "../src/requirements/spec-intent-ledger.js";
import { parseShooterGameSpec } from "../src/requirements/shooter-game-spec.js";

const extractionReportSchema = z
  .object({
    reportVersion: z.literal("1.0.0"),
    probeRunId: z.string().uuid(),
    caseId: z.string(),
    casePath: NaturalLanguageProbeCasePathSchema,
    caseSha256: z.string().regex(/^[a-f0-9]{64}$/u),
    promptSha256: z.string().regex(/^[a-f0-9]{64}$/u),
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
  const caseJson = await readFile(
    path.join(projectDirectory, extractionReport.casePath),
    "utf8",
  );
  const probeCase = parseNaturalLanguageProbeCase(JSON.parse(caseJson));
  if (
    sha256(caseJson) !== extractionReport.caseSha256 ||
    probeCase.caseId !== extractionReport.caseId ||
    sha256(probeCase.prompt) !== extractionReport.promptSha256
  ) {
    throw new Error(
      "The extraction report is not bound to the current saved request case.",
    );
  }

  const startedAt = new Date();
  const sourceSpec = parseShooterGameSpec(extractionReport.spec);
  const ledger = planSpecIntentLedger(
    { language: probeCase.language, prompt: probeCase.prompt },
    sourceSpec,
  );
  verifySpecIntentLedger(
    { language: probeCase.language, prompt: probeCase.prompt },
    sourceSpec,
    ledger,
  );

  const locked = new Map(
    ledger.entries
      .filter((entry) => entry.ownership === "user-locked")
      .map((entry) => [entry.intentId, entry]),
  );
  const health = ledger.entries.find(
    (entry) => entry.intentId === "player-max-health",
  );
  const waveCount = locked.get("enemy-wave-count")?.specBinding;
  const requiredLocks = [
    "target-desktop-browser",
    "target-mobile-browser",
    "enemy-role-small-fighter",
    "enemy-role-asteroid",
    "enemy-role-aimed-formation",
    "pickup-shield",
    "pickup-firepower",
    "boss-victory",
  ] as const;
  if (
    requiredLocks.some((intentId) => !locked.has(intentId)) ||
    waveCount?.kind !== "wave-count" ||
    waveCount.value !== 3 ||
    health?.ownership !== "agent-choice" ||
    health.specBinding.kind !== "player-max-health"
  ) {
    throw new Error(
      "The saved v2 case did not produce the required locked/Agent-owned proof.",
    );
  }

  const replayId = randomUUID();
  const replayDirectory = path.join(probeDirectory, "intent-replays", replayId);
  await mkdir(path.dirname(replayDirectory), { recursive: true });
  await mkdir(replayDirectory);
  const sourceSpecJson = toJson(sourceSpec);
  const ledgerJson = toJson(ledger);
  await writeFile(
    path.join(replayDirectory, "source-spec.json"),
    sourceSpecJson,
    "utf8",
  );
  await writeFile(
    path.join(replayDirectory, "spec-intent-ledger.json"),
    ledgerJson,
    "utf8",
  );

  const completedAt = new Date();
  const report = {
    reportVersion: "1.0.0",
    replayId,
    sourceProbeRunId: probeRunId,
    caseId: probeCase.caseId,
    casePath: extractionReport.casePath,
    caseSha256: extractionReport.caseSha256,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    elapsedMs: completedAt.getTime() - startedAt.getTime(),
    status: "passed",
    completedStage: "spec-intent-ledger",
    requestSha256: ledger.request.sha256,
    sourceSpecSha256: ledger.sourceSpec.sha256,
    ledgerSha256: sha256(ledgerJson),
    lockedIntentIds: ledger.entries
      .filter((entry) => entry.ownership === "user-locked")
      .map((entry) => entry.intentId),
    agentChoiceIntentIds: ledger.entries
      .filter((entry) => entry.ownership === "agent-choice")
      .map((entry) => entry.intentId),
    proof: {
      desktopAndMobileLocked: true,
      enemyWaveCountLocked: waveCount.value,
      enemyRolesLocked: ["small-fighter", "asteroid", "aimed-formation"],
      pickupEffectsLocked: ["shield", "weaponPower"],
      bossVictoryLocked: "bossDefeated",
      playerMaxHealth: {
        ownership: health.ownership,
        value: health.specBinding.value,
      },
    },
    artifactBytes:
      Buffer.byteLength(sourceSpecJson, "utf8") +
      Buffer.byteLength(ledgerJson, "utf8"),
    modelRequestsDuringReplay: 0,
    gameplayCompletionApplied: false,
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
