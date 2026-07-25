import { randomUUID } from "node:crypto";
import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import {
  executeFixedViteBuild,
  RUN_TEMPLATE_SOURCE_FILES,
  type RunBuildExecutor,
} from "../orchestration/run-composition-stage.js";
import { digestDirectory, sha256File } from "../runs/artifact-hash.js";
import {
  RunManifestSchema,
  transitionRunManifest,
  type RunManifest,
} from "../runs/run-manifest.js";
import {
  VerificationFindingSchema,
  type VerificationFinding,
} from "../verification/verification-finding.js";

const ReplacementOperationSchema = z.strictObject({
  search: z.string().min(1).max(8_000),
  replacement: z.string().max(8_000),
});

const RepairProposalSchema = z.strictObject({
  findingId: z.string().uuid(),
  summary: z.string().min(1).max(500),
  patches: z
    .array(
      z.strictObject({
        path: z.string().min(1).max(300),
        expectedSha256: z.string().regex(/^[a-f0-9]{64}$/),
        replacements: z.array(ReplacementOperationSchema).min(1).max(8),
      }),
    )
    .min(1)
    .max(4),
});

export type RepairProposal = z.infer<typeof RepairProposalSchema>;
export type RepairExecutor = (
  finding: VerificationFinding,
) => Promise<RepairProposal>;

export type RepairLimits = Readonly<{
  maxFiles: number;
  maxOperations: number;
  maxChangedLines: number;
  maxPatchBytes: number;
}>;

const DEFAULT_LIMITS: RepairLimits = Object.freeze({
  maxFiles: 2,
  maxOperations: 6,
  maxChangedLines: 24,
  maxPatchBytes: 8_000,
});

const REPAIRABLE_SOURCE_FILES = new Set(
  RUN_TEMPLATE_SOURCE_FILES.filter(
    (source) => source.endsWith(".ts") && !source.endsWith("test-bridge.ts"),
  ),
);

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

function assertInside(parent: string, child: string): void {
  const relative = path.relative(parent, child);
  if (
    relative === "" ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`repair path must remain inside ${parent}`);
  }
}

function normalizedSourcePath(value: string): string {
  const normalized = value.replaceAll("\\", "/");
  if (
    normalized.startsWith("/") ||
    /^[a-zA-Z]:/.test(normalized) ||
    normalized.split("/").includes("..")
  ) {
    throw new Error("repair target must be a relative source path");
  }
  return normalized;
}

function changedLineCount(search: string, replacement: string): number {
  const searchLines = search.split(/\r?\n/).length;
  const replacementLines = replacement.split(/\r?\n/).length;
  return Math.max(searchLines, replacementLines);
}

async function verifyBoundEvidence(
  runDirectory: string,
  manifest: RunManifest,
  finding: VerificationFinding,
): Promise<void> {
  const workspace = manifest.artifacts.workspace;
  const packageEvidence = manifest.artifacts.package;
  const verification = manifest.artifacts.verification;
  if (!workspace || !packageEvidence || !verification) {
    throw new Error(
      "repair requires workspace, package, and verification evidence",
    );
  }
  const workspacePath = path.join(runDirectory, workspace.path);
  const packagePath = path.join(runDirectory, packageEvidence.path);
  const verificationPath = path.join(runDirectory, verification.path);
  assertInside(runDirectory, workspacePath);
  assertInside(runDirectory, packagePath);
  assertInside(runDirectory, verificationPath);
  if ((await digestDirectory(workspacePath)).sha256 !== workspace.sha256) {
    throw new Error("workspace hash does not match repair input evidence");
  }
  if ((await digestDirectory(packagePath)).sha256 !== packageEvidence.sha256) {
    throw new Error("package hash does not match repair input evidence");
  }
  if (
    (await digestDirectory(verificationPath)).sha256 !== verification.sha256
  ) {
    throw new Error("verification hash does not match repair input evidence");
  }

  const reportPath = path.join(runDirectory, finding.evidence.reportPath);
  assertInside(runDirectory, reportPath);
  const report = JSON.parse(await readFile(reportPath, "utf8")) as {
    findings?: unknown[];
  };
  const bound = report.findings
    ?.map((candidate) => VerificationFindingSchema.safeParse(candidate))
    .find(
      (candidate) =>
        candidate?.success &&
        candidate.data.id === finding.id &&
        candidate.data.fingerprint === finding.fingerprint,
    );
  if (!bound?.success) {
    throw new Error("repair finding is not bound to the verification report");
  }
}

export async function runBoundedRepairRound(options: {
  projectDirectory: string;
  runId: string;
  finding: VerificationFinding;
  repairExecutor: RepairExecutor;
  limits?: Partial<RepairLimits>;
  buildExecutor?: RunBuildExecutor;
  now?: () => Date;
}): Promise<Readonly<{ manifest: RunManifest; repairDirectory: string }>> {
  const projectDirectory = path.resolve(options.projectDirectory);
  const runsDirectory = path.join(projectDirectory, "artifacts", "runs");
  const runDirectory = path.join(runsDirectory, options.runId);
  assertInside(runsDirectory, runDirectory);
  const manifestPath = path.join(runDirectory, "manifest.json");
  let manifest = RunManifestSchema.parse(
    JSON.parse(await readFile(manifestPath, "utf8")),
  );
  if (
    !(["built", "runtime_checked", "play_checked"] as const).includes(
      manifest.state as "built" | "runtime_checked" | "play_checked",
    )
  ) {
    throw new Error(
      `repair requires a verified build state, received ${manifest.state}`,
    );
  }
  const finding = VerificationFindingSchema.parse(options.finding);
  await verifyBoundEvidence(runDirectory, manifest, finding);

  if (manifest.repairBudget.usedRounds > 0) {
    const previousFindingPath = path.join(
      runDirectory,
      "repairs",
      `round-${manifest.repairBudget.usedRounds}`,
      "finding.json",
    );
    const previousFinding = VerificationFindingSchema.parse(
      JSON.parse(await readFile(previousFindingPath, "utf8")),
    );
    if (previousFinding.fingerprint === finding.fingerprint) {
      manifest = transitionRunManifest(
        manifest,
        "repair_budget_exhausted",
        "Repeated identical verification finding stopped the repair loop.",
        options.now?.() ?? new Date(),
      );
      await writeJsonAtomic(manifestPath, manifest);
      throw new Error("repeated identical repair finding");
    }
  }

  if (manifest.repairBudget.usedRounds >= manifest.repairBudget.maximumRounds) {
    manifest = transitionRunManifest(
      manifest,
      "repair_budget_exhausted",
      "Repair finding rejected because no repair rounds remain.",
      options.now?.() ?? new Date(),
    );
    await writeJsonAtomic(manifestPath, manifest);
    throw new Error("repair budget exhausted");
  }

  manifest = transitionRunManifest(
    manifest,
    "repairing",
    `Selected finding ${finding.code} for a bounded repair round.`,
    options.now?.() ?? new Date(),
  );
  await writeJsonAtomic(manifestPath, manifest);
  const round = manifest.repairBudget.usedRounds;
  const repairRelativePath = `repairs/round-${round}`;
  const repairDirectory = path.join(runDirectory, repairRelativePath);
  await mkdir(repairDirectory, { recursive: true });
  await writeJsonAtomic(path.join(repairDirectory, "finding.json"), finding);

  const limits = { ...DEFAULT_LIMITS, ...options.limits };
  try {
    const proposal = RepairProposalSchema.parse(
      await options.repairExecutor(finding),
    );
    if (proposal.findingId !== finding.id) {
      throw new Error("repair proposal does not match the selected finding");
    }
    if (proposal.patches.length > limits.maxFiles) {
      throw new Error("repair proposal exceeds the target-file limit");
    }
    const uniquePaths = new Set(proposal.patches.map((patch) => patch.path));
    if (uniquePaths.size !== proposal.patches.length) {
      throw new Error("repair proposal contains duplicate target files");
    }

    const suspectedFiles = new Set(finding.suspectedFiles);
    const workspaceDirectory = path.join(runDirectory, "workspace");
    const prepared: Array<{
      path: string;
      absolutePath: string;
      before: string;
      after: string;
      beforeSha256: string;
      changedLines: number;
      patchBytes: number;
    }> = [];
    let totalOperations = 0;
    let totalChangedLines = 0;
    let totalPatchBytes = 0;

    for (const patch of proposal.patches) {
      const sourcePath = normalizedSourcePath(patch.path);
      if (!suspectedFiles.has(sourcePath)) {
        throw new Error("repair target is not named by the selected finding");
      }
      if (!REPAIRABLE_SOURCE_FILES.has(sourcePath)) {
        throw new Error("repair target is outside the fixed source allowlist");
      }
      const absolutePath = path.join(workspaceDirectory, sourcePath);
      assertInside(workspaceDirectory, absolutePath);
      const beforeSha256 = await sha256File(absolutePath);
      if (beforeSha256 !== patch.expectedSha256) {
        throw new Error("repair target hash does not match the proposal");
      }
      const before = await readFile(absolutePath, "utf8");
      let after = before;
      let fileChangedLines = 0;
      let filePatchBytes = 0;
      for (const replacement of patch.replacements) {
        const occurrences = after.split(replacement.search).length - 1;
        if (occurrences !== 1) {
          throw new Error("each repair search must match exactly once");
        }
        after = after.replace(replacement.search, replacement.replacement);
        fileChangedLines += changedLineCount(
          replacement.search,
          replacement.replacement,
        );
        filePatchBytes += Buffer.byteLength(
          replacement.search + replacement.replacement,
          "utf8",
        );
      }
      totalOperations += patch.replacements.length;
      totalChangedLines += fileChangedLines;
      totalPatchBytes += filePatchBytes;
      prepared.push({
        path: sourcePath,
        absolutePath,
        before,
        after,
        beforeSha256,
        changedLines: fileChangedLines,
        patchBytes: filePatchBytes,
      });
    }

    if (totalOperations > limits.maxOperations) {
      throw new Error("repair proposal exceeds the operation limit");
    }
    if (totalChangedLines > limits.maxChangedLines) {
      throw new Error("repair proposal exceeds the changed-line limit");
    }
    if (totalPatchBytes > limits.maxPatchBytes) {
      throw new Error("repair proposal exceeds the patch-byte limit");
    }

    for (const file of prepared) {
      const beforePath = path.join(repairDirectory, "before", file.path);
      await mkdir(path.dirname(beforePath), { recursive: true });
      await copyFile(file.absolutePath, beforePath);
      await writeAtomic(file.absolutePath, file.after);
    }

    const packageRelativePath = `${repairRelativePath}/package`;
    const packageDirectory = path.join(runDirectory, packageRelativePath);
    const templateDirectory = path.join(
      workspaceDirectory,
      "game-template",
      "vertical-shooter",
    );
    const buildExecutor = options.buildExecutor ?? executeFixedViteBuild;
    await buildExecutor({
      projectDirectory,
      templateDirectory,
      packageDirectory,
    });
    const packageDigest = await digestDirectory(packageDirectory);
    const workspaceDigest = await digestDirectory(workspaceDirectory);
    const buildLogRelativePath = `${repairRelativePath}/build.json`;
    const buildLogPath = path.join(runDirectory, buildLogRelativePath);
    await writeJsonAtomic(buildLogPath, {
      tool: "vite",
      status: "passed",
      exitCode: 0,
      outputFileCount: packageDigest.fileCount,
      outputBytes: packageDigest.totalBytes,
    });

    manifest = RunManifestSchema.parse({
      ...manifest,
      artifacts: {
        ...manifest.artifacts,
        workspace: { path: "workspace", sha256: workspaceDigest.sha256 },
        package: { path: packageRelativePath, sha256: packageDigest.sha256 },
        buildLog: {
          path: buildLogRelativePath,
          sha256: await sha256File(buildLogPath),
        },
      },
      build: { tool: "vite", exitCode: 0 },
    });
    manifest = transitionRunManifest(
      manifest,
      "built",
      `Repair round ${round} applied a bounded patch and rebuilt the package.`,
      options.now?.() ?? new Date(),
    );
    await writeJsonAtomic(manifestPath, manifest);
    await writeJsonAtomic(path.join(repairDirectory, "repair.json"), {
      repairVersion: "1.0.0",
      status: "built",
      findingId: finding.id,
      findingFingerprint: finding.fingerprint,
      summary: proposal.summary,
      limits,
      totals: {
        files: prepared.length,
        operations: totalOperations,
        changedLines: totalChangedLines,
        patchBytes: totalPatchBytes,
      },
      files: await Promise.all(
        prepared.map(async (file) => ({
          path: file.path,
          beforeSha256: file.beforeSha256,
          afterSha256: await sha256File(file.absolutePath),
          changedLines: file.changedLines,
          patchBytes: file.patchBytes,
        })),
      ),
      modelCall: null,
    });
    return { manifest, repairDirectory };
  } catch (error) {
    await writeJsonAtomic(path.join(repairDirectory, "repair.json"), {
      repairVersion: "1.0.0",
      status: "failed",
      findingId: finding.id,
      failure:
        error instanceof Error
          ? error.message.slice(0, 500)
          : "unknown failure",
      modelCall: null,
    });
    manifest = transitionRunManifest(
      manifest,
      "failed",
      "Bounded repair round failed; safe evidence recorded.",
      options.now?.() ?? new Date(),
    );
    await writeJsonAtomic(manifestPath, manifest);
    throw error;
  }
}
