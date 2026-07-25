import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  copyFile,
  lstat,
  mkdir,
  readFile,
  rename,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import {
  planAssetSelections,
  type AssetSelectionPlan,
} from "../assets/asset-selection-plan.js";
import { verifyAssetCorpus } from "../assets/asset-corpus-verification.js";
import {
  planAssetQueryGrounding,
  sha256ShooterGameSpec,
  type AssetQueryGrounding,
} from "../assets/asset-query-grounding.js";
import { parseShooterGameSpec } from "../requirements/shooter-game-spec.js";
import {
  completePlayableShooterGameSpec,
  verifySpecPlayabilityCompletion,
  type SpecPlayabilityCompletionResult,
} from "../requirements/spec-playability-completion-policy.js";
import {
  completeShooterGameSpec,
  verifySpecCompletion,
  type SpecCompletionResult,
} from "../requirements/spec-completion-policy.js";
import type {
  SpecIntentLedger,
  SpecIntentRequest,
} from "../requirements/spec-intent-ledger.js";
import type { ResourceProfile } from "../runtime/resource-budget.js";
import { composeShooterGame } from "../runtime/shooter-game-composer.js";
import { digestDirectory, sha256File } from "../runs/artifact-hash.js";
import {
  RunManifestSchema,
  transitionRunManifest,
  type RunManifest,
} from "../runs/run-manifest.js";

export const RUN_TEMPLATE_SOURCE_FILES = Object.freeze([
  "tsconfig.json",
  "game-template/vertical-shooter/index.html",
  "game-template/vertical-shooter/tsconfig.json",
  "game-template/vertical-shooter/src/main.ts",
  "game-template/vertical-shooter/src/runtime-assets.ts",
  "game-template/vertical-shooter/src/runtime-config.ts",
  "game-template/vertical-shooter/src/runtime-kernel/contracts.ts",
  "game-template/vertical-shooter/src/runtime-kernel/core-services.ts",
  "game-template/vertical-shooter/src/runtime-kernel/game-module-runtime-service-host.ts",
  "game-template/vertical-shooter/src/runtime-kernel/game-module-runtime.ts",
  "game-template/vertical-shooter/src/runtime-kernel/batch1-browser-runtime.ts",
  "game-template/vertical-shooter/src/runtime-kernel/batch2-browser-runtime.ts",
  "game-template/vertical-shooter/src/runtime-kernel/batch2-formation-browser-runtime.ts",
  "game-template/vertical-shooter/src/runtime-kernel/batch2-progression-browser-conformance.ts",
  "game-template/vertical-shooter/src/runtime-kernel/batch2-progression-browser-runtime.ts",
  "game-template/vertical-shooter/src/runtime-kernel/batch2-nearest-browser-conformance.ts",
  "game-template/vertical-shooter/src/runtime-kernel/batch2-defense-browser-conformance.ts",
  "game-template/vertical-shooter/src/runtime-kernel/batch2-defense-browser-runtime.ts",
  "game-template/vertical-shooter/src/runtime-kernel/mixed-v13-browser-conformance.ts",
  "game-template/vertical-shooter/src/runtime-kernel/mixed-v14-browser-conformance.ts",
  "game-template/vertical-shooter/src/runtime-kernel/phaser-runtime-kernel.ts",
  "game-template/vertical-shooter/src/test-bridge.ts",
  "game-template/vertical-shooter/src/generated/batch1-runtime.ts",
  "game-template/vertical-shooter/src/generated/batch2-runtime.ts",
  "game-template/vertical-shooter/src/generated/batch2-formations.ts",
  "game-template/vertical-shooter/src/generated/batch2-progression.ts",
  "game-template/vertical-shooter/src/generated/batch2-nearest.ts",
  "game-template/vertical-shooter/src/generated/batch2-defense.ts",
  "game-template/vertical-shooter/src/scenes/boot-scene.ts",
  "game-template/vertical-shooter/src/scenes/end-scene.ts",
  "game-template/vertical-shooter/src/scenes/play-scene.ts",
  "game-template/vertical-shooter/src/scenes/start-scene.ts",
  "src/gameplay/boss-phase.ts",
  "src/gameplay/boss-pattern-scheduler.ts",
  "src/gameplay/bullet-pattern-planner.ts",
  "src/gameplay/enemy-pattern-scheduler.ts",
  "src/gameplay/enemy-wave-scheduler.ts",
  "src/gameplay/game-outcome.ts",
  "src/gameplay/player-firing-planner.ts",
  "src/gameplay/pickup-planner.ts",
  "src/gameplay/scoring-state.ts",
  "src/modules/game-module-contact-policy-host.ts",
  "src/modules/game-module-actor-snapshot-host.ts",
  "src/modules/game-module-entity-directory.ts",
  "src/modules/game-module-graph-execution-harness.ts",
  "src/modules/game-module-hostile-attack-router.ts",
  "src/modules/game-module-lease-ledger.ts",
  "src/modules/game-module-lifecycle-coordinator.ts",
  "src/modules/game-module-port-router.ts",
  "src/modules/game-module-prepared-effect-host.ts",
  "src/modules/game-module-outcome-authority-adapter-v14.ts",
  "src/modules/game-module-outcome-host.ts",
  "src/modules/game-module-production-authority-v14.ts",
  "src/modules/game-module-production-instantiator.ts",
  "src/modules/game-module-projectile-delivery-admission-host.ts",
  "src/modules/game-module-score-authority-adapter-v14.ts",
  "src/modules/game-module-score-ledger-host.ts",
  "src/modules/game-module-runtime-abi-v12.ts",
  "src/modules/game-module-runtime-catalog.ts",
  "src/modules/game-module-runtime-factory.ts",
  "src/modules/game-module-runtime-payloads.ts",
  "src/modules/game-module-runtime-services.ts",
  "src/modules/game-module-safe-counter.ts",
]);

const MANIFEST_PATH = "manifest.json";
const SOURCE_SPEC_PATH = "source-spec.json";
const SPEC_INTENT_LEDGER_PATH = "spec-intent-ledger.json";
const PLAYABILITY_SPEC_PATH = "playability-spec.json";
const SPEC_PLAYABILITY_COMPLETION_PATH = "spec-playability-completion.json";
const SPEC_PATH = "spec.json";
const SPEC_COMPLETION_PATH = "spec-completion.json";
const PLAN_PATH = "plan.json";
const ASSET_QUERY_GROUNDING_PATH = "asset-query-grounding.json";
const ASSET_SELECTION_PATH = "asset-selection.json";
const ASSET_CORPUS_PATH = "assets/corpus";
const ASSET_CATALOG_PATH = "assets/corpus/catalog.json";
const ASSET_CORPUS_DISK_CAP_BYTES = 150 * 1024 * 1024;
const WORKSPACE_PATH = "workspace";
const RUNTIME_CONFIG_PATH =
  "workspace/game-template/vertical-shooter/src/generated/runtime-config.json";
const BUILD_LOG_PATH = "logs/build.json";
const PACKAGE_PATH = "package";

export type RunBuildContext = Readonly<{
  projectDirectory: string;
  templateDirectory: string;
  packageDirectory: string;
}>;

export type RunBuildExecutor = (context: RunBuildContext) => Promise<void>;

export type RunCompositionStageOptions = Readonly<{
  projectDirectory: string;
  manifest: RunManifest;
  spec: unknown;
  resourceProfile?: ResourceProfile;
  enableAssetSelection?: boolean;
  specIntent?: Readonly<{
    request: SpecIntentRequest;
    ledger: SpecIntentLedger;
  }>;
  buildExecutor?: RunBuildExecutor;
  now?: () => Date;
}>;

export type RunCompositionStageResult = Readonly<{
  runDirectory: string;
  manifest: RunManifest;
}>;

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

function artifact(pathValue: string, sha256: string) {
  return { path: pathValue, sha256 };
}

function assertInside(parent: string, child: string): void {
  const relative = path.relative(parent, child);
  if (
    relative === "" ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`path must remain inside ${parent}`);
  }
}

async function copyRegularFile(
  source: string,
  destination: string,
): Promise<void> {
  const stats = await lstat(source);
  if (!stats.isFile() || stats.isSymbolicLink()) {
    throw new Error(
      `template allowlist entry is not a regular file: ${source}`,
    );
  }
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

async function materializeWorkspace(
  projectDirectory: string,
  workspaceDirectory: string,
  runtimeConfig: unknown,
  assetSelection: AssetSelectionPlan | undefined,
): Promise<void> {
  for (const relativePath of RUN_TEMPLATE_SOURCE_FILES) {
    const source = path.join(projectDirectory, relativePath);
    const destination = path.join(workspaceDirectory, relativePath);
    assertInside(projectDirectory, source);
    assertInside(workspaceDirectory, destination);
    await copyRegularFile(source, destination);
  }

  const runtimeConfigPath = path.join(
    workspaceDirectory,
    "game-template",
    "vertical-shooter",
    "src",
    "generated",
    "runtime-config.json",
  );
  assertInside(workspaceDirectory, runtimeConfigPath);
  await writeJsonAtomic(runtimeConfigPath, runtimeConfig);

  if (assetSelection !== undefined) {
    const corpusDirectory = path.join(projectDirectory, ASSET_CORPUS_PATH);
    const copiedDestinations = new Set<string>();
    for (const selection of assetSelection.selections) {
      const source = path.join(
        corpusDirectory,
        ...selection.sourceFile.path.split("/"),
      );
      const destination = path.join(
        workspaceDirectory,
        ...selection.materialization.workspacePath.split("/"),
      );
      assertInside(corpusDirectory, source);
      assertInside(workspaceDirectory, destination);
      if (copiedDestinations.has(destination)) {
        continue;
      }
      await copyRegularFile(source, destination);
      copiedDestinations.add(destination);
    }
  }
}

async function verifyPackagedSelectedAssets(
  packageDirectory: string,
  assetSelection: AssetSelectionPlan | undefined,
): Promise<void> {
  if (assetSelection === undefined) return;
  for (const selection of assetSelection.selections) {
    const packagedPath = path.join(
      packageDirectory,
      ...selection.materialization.runtimeUrl.slice(1).split("/"),
    );
    assertInside(packageDirectory, packagedPath);
    const packagedSha256 = await sha256File(packagedPath);
    if (packagedSha256 !== selection.sourceFile.sha256) {
      throw new Error(
        `packaged asset hash mismatch: ${selection.selectedAssetId}`,
      );
    }
  }
}

class FixedBuildError extends Error {
  constructor(readonly exitCode: number | null) {
    super("The fixed Vite build failed.");
    this.name = "FixedBuildError";
  }
}

export const executeFixedViteBuild: RunBuildExecutor = async ({
  projectDirectory,
  templateDirectory,
  packageDirectory,
}) => {
  const viteCli = path.join(
    projectDirectory,
    "node_modules",
    "vite",
    "bin",
    "vite.js",
  );

  await new Promise<void>((resolve, reject) => {
    execFile(
      process.execPath,
      [viteCli, "build", templateDirectory, "--outDir", packageDirectory],
      {
        cwd: projectDirectory,
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
        windowsHide: true,
      },
      (error) => {
        if (error) {
          reject(
            new FixedBuildError(
              typeof error.code === "number" ? error.code : null,
            ),
          );
        } else {
          resolve();
        }
      },
    );
  });
};

function withEvidence(
  manifest: RunManifest,
  evidence: Partial<Pick<RunManifest, "artifacts" | "composition" | "build">>,
): RunManifest {
  return RunManifestSchema.parse({
    ...manifest,
    ...evidence,
    artifacts: {
      ...manifest.artifacts,
      ...evidence.artifacts,
    },
  });
}

export async function runCompositionStage(
  options: RunCompositionStageOptions,
): Promise<RunCompositionStageResult> {
  const projectDirectory = path.resolve(options.projectDirectory);
  const manifest = RunManifestSchema.parse(options.manifest);
  if (manifest.state !== "spec_validated") {
    throw new Error(
      `composition stage requires spec_validated state, received ${manifest.state}`,
    );
  }

  const sourceSpec = parseShooterGameSpec(options.spec);
  let spec = sourceSpec;
  let playabilityCompletion: SpecPlayabilityCompletionResult | undefined;
  if (options.specIntent !== undefined) {
    if (options.specIntent.request.prompt !== manifest.request.prompt) {
      throw new Error("Spec intent request does not match the run request");
    }
    playabilityCompletion = completePlayableShooterGameSpec(
      options.specIntent.request,
      sourceSpec,
      options.specIntent.ledger,
    );
    verifySpecPlayabilityCompletion(
      options.specIntent.request,
      playabilityCompletion.sourceSpec,
      playabilityCompletion.completedSpec,
      playabilityCompletion.intentLedger,
      playabilityCompletion.artifact,
    );
    spec = playabilityCompletion.completedSpec;
  }
  let specCompletion: SpecCompletionResult | undefined;
  let assetQueryGrounding: AssetQueryGrounding | undefined;
  let assetSelection: AssetSelectionPlan | undefined;
  if (options.enableAssetSelection === true) {
    const completion = completeShooterGameSpec(spec);
    spec = completion.completedSpec;
    if (completion.artifact.decisions.length > 0) {
      specCompletion = completion;
      verifySpecCompletion(
        completion.sourceSpec,
        completion.completedSpec,
        completion.artifact,
      );
    }
    const corpusDirectory = path.join(projectDirectory, ASSET_CORPUS_PATH);
    const catalogPath = path.join(projectDirectory, ASSET_CATALOG_PATH);
    assertInside(projectDirectory, corpusDirectory);
    assertInside(projectDirectory, catalogPath);
    const catalog = JSON.parse(await readFile(catalogPath, "utf8")) as unknown;
    const verification = await verifyAssetCorpus(
      corpusDirectory,
      catalog,
      ASSET_CORPUS_DISK_CAP_BYTES,
    );
    if (!verification.ok) {
      const firstIssue = verification.issues[0];
      throw new Error(
        `asset corpus verification failed: ${firstIssue?.path ?? "unknown"}:${firstIssue?.reason ?? "unknown"}`,
      );
    }
    const catalogSha256 = await sha256File(catalogPath);
    assetQueryGrounding = planAssetQueryGrounding(spec, catalog, catalogSha256);
    assetSelection = planAssetSelections(spec, catalog, catalogSha256, {
      grounding: assetQueryGrounding,
    });
  }
  const runtimeConfig = composeShooterGame(spec, {
    resourceProfile: options.resourceProfile ?? "balanced",
    ...(assetSelection === undefined ? {} : { assetSelection }),
  });
  const runsDirectory = path.join(projectDirectory, "artifacts", "runs");
  const runDirectory = path.join(runsDirectory, manifest.runId);
  assertInside(runsDirectory, runDirectory);

  await mkdir(runsDirectory, { recursive: true });
  await mkdir(runDirectory);

  const manifestPath = path.join(runDirectory, MANIFEST_PATH);
  await writeJsonAtomic(manifestPath, manifest);

  const specPath = path.join(runDirectory, SPEC_PATH);
  await writeJsonAtomic(specPath, spec);
  let sourceSpecArtifact: ReturnType<typeof artifact> | undefined;
  let specIntentLedgerArtifact: ReturnType<typeof artifact> | undefined;
  let playabilitySpecArtifact: ReturnType<typeof artifact> | undefined;
  let specPlayabilityCompletionArtifact:
    ReturnType<typeof artifact> | undefined;
  let specCompletionArtifact: ReturnType<typeof artifact> | undefined;
  if (playabilityCompletion !== undefined) {
    const sourceSpecPath = path.join(runDirectory, SOURCE_SPEC_PATH);
    const specIntentLedgerPath = path.join(
      runDirectory,
      SPEC_INTENT_LEDGER_PATH,
    );
    const playabilitySpecPath = path.join(runDirectory, PLAYABILITY_SPEC_PATH);
    const specPlayabilityCompletionPath = path.join(
      runDirectory,
      SPEC_PLAYABILITY_COMPLETION_PATH,
    );
    await writeJsonAtomic(sourceSpecPath, playabilityCompletion.sourceSpec);
    await writeJsonAtomic(
      specIntentLedgerPath,
      playabilityCompletion.intentLedger,
    );
    await writeJsonAtomic(
      playabilitySpecPath,
      playabilityCompletion.completedSpec,
    );
    await writeJsonAtomic(
      specPlayabilityCompletionPath,
      playabilityCompletion.artifact,
    );
    sourceSpecArtifact = artifact(
      SOURCE_SPEC_PATH,
      await sha256File(sourceSpecPath),
    );
    specIntentLedgerArtifact = artifact(
      SPEC_INTENT_LEDGER_PATH,
      await sha256File(specIntentLedgerPath),
    );
    playabilitySpecArtifact = artifact(
      PLAYABILITY_SPEC_PATH,
      await sha256File(playabilitySpecPath),
    );
    specPlayabilityCompletionArtifact = artifact(
      SPEC_PLAYABILITY_COMPLETION_PATH,
      await sha256File(specPlayabilityCompletionPath),
    );
  }
  if (specCompletion !== undefined) {
    const sourceSpecPath = path.join(runDirectory, SOURCE_SPEC_PATH);
    const specCompletionPath = path.join(runDirectory, SPEC_COMPLETION_PATH);
    if (playabilityCompletion === undefined) {
      await writeJsonAtomic(sourceSpecPath, specCompletion.sourceSpec);
    }
    await writeJsonAtomic(specCompletionPath, specCompletion.artifact);
    sourceSpecArtifact ??= artifact(
      SOURCE_SPEC_PATH,
      await sha256File(sourceSpecPath),
    );
    specCompletionArtifact = artifact(
      SPEC_COMPLETION_PATH,
      await sha256File(specCompletionPath),
    );
  }
  const planPath = path.join(runDirectory, PLAN_PATH);
  await writeJsonAtomic(planPath, {
    planVersion: "1.0.0",
    resourceProfile: runtimeConfig.composition.resourceProfile,
    templateSourceFiles: RUN_TEMPLATE_SOURCE_FILES,
    output: RUNTIME_CONFIG_PATH,
    specIntent:
      playabilityCompletion === undefined
        ? { mode: "disabled" }
        : {
            mode: "ledger-gated",
            source: SOURCE_SPEC_PATH,
            ledger: SPEC_INTENT_LEDGER_PATH,
            policyId: playabilityCompletion.artifact.policyId,
            decision: SPEC_PLAYABILITY_COMPLETION_PATH,
            output: PLAYABILITY_SPEC_PATH,
          },
    specCompletion:
      specCompletion === undefined
        ? { mode: "unchanged" }
        : {
            mode: "derived",
            policyId: specCompletion.artifact.policyId,
            source:
              playabilityCompletion === undefined
                ? SOURCE_SPEC_PATH
                : PLAYABILITY_SPEC_PATH,
            evidence: SPEC_COMPLETION_PATH,
            output: SPEC_PATH,
          },
    assetSelection:
      assetSelection === undefined
        ? { mode: "disabled" }
        : {
            mode: "catalog",
            catalog: ASSET_CATALOG_PATH,
            grounding: ASSET_QUERY_GROUNDING_PATH,
            output: ASSET_SELECTION_PATH,
          },
  });
  let assetQueryGroundingArtifact: ReturnType<typeof artifact> | undefined;
  if (assetQueryGrounding !== undefined) {
    const assetQueryGroundingPath = path.join(
      runDirectory,
      ASSET_QUERY_GROUNDING_PATH,
    );
    await writeJsonAtomic(assetQueryGroundingPath, assetQueryGrounding);
    assetQueryGroundingArtifact = artifact(
      ASSET_QUERY_GROUNDING_PATH,
      await sha256File(assetQueryGroundingPath),
    );
  }
  let assetSelectionArtifact: ReturnType<typeof artifact> | undefined;
  if (assetSelection !== undefined) {
    const assetSelectionPath = path.join(runDirectory, ASSET_SELECTION_PATH);
    await writeJsonAtomic(assetSelectionPath, assetSelection);
    assetSelectionArtifact = artifact(
      ASSET_SELECTION_PATH,
      await sha256File(assetSelectionPath),
    );
  }

  let current = withEvidence(manifest, {
    artifacts: {
      spec: artifact(SPEC_PATH, await sha256File(specPath)),
      ...(sourceSpecArtifact === undefined
        ? {}
        : { sourceSpec: sourceSpecArtifact }),
      ...(specIntentLedgerArtifact === undefined
        ? {}
        : { specIntentLedger: specIntentLedgerArtifact }),
      ...(playabilitySpecArtifact === undefined
        ? {}
        : { playabilitySpec: playabilitySpecArtifact }),
      ...(specPlayabilityCompletionArtifact === undefined
        ? {}
        : {
            specPlayabilityCompletion: specPlayabilityCompletionArtifact,
          }),
      ...(specCompletionArtifact === undefined
        ? {}
        : { specCompletion: specCompletionArtifact }),
      plan: artifact(PLAN_PATH, await sha256File(planPath)),
      ...(assetQueryGroundingArtifact === undefined
        ? {}
        : { assetQueryGrounding: assetQueryGroundingArtifact }),
      ...(assetSelectionArtifact === undefined
        ? {}
        : { assetSelection: assetSelectionArtifact }),
    },
  });
  if (
    assetQueryGrounding !== undefined &&
    current.artifacts.spec?.sha256 !== sha256ShooterGameSpec(spec)
  ) {
    throw new Error("grounding source Spec hash does not match spec.json");
  }
  if (
    specCompletion !== undefined &&
    ((current.artifacts.playabilitySpec ?? current.artifacts.sourceSpec)
      ?.sha256 !== specCompletion.artifact.sourceSpec.sha256 ||
      current.artifacts.spec?.sha256 !==
        specCompletion.artifact.completedSpec.sha256)
  ) {
    throw new Error("Spec completion hashes do not match run artifacts");
  }
  if (
    playabilityCompletion !== undefined &&
    (current.artifacts.sourceSpec?.sha256 !==
      playabilityCompletion.artifact.sourceSpec.sha256 ||
      current.artifacts.specIntentLedger?.sha256 !==
        playabilityCompletion.artifact.intentLedger.sha256 ||
      current.artifacts.playabilitySpec?.sha256 !==
        playabilityCompletion.artifact.completedSpec.sha256)
  ) {
    throw new Error(
      "Spec playability completion hashes do not match run artifacts",
    );
  }
  current = transitionRunManifest(
    current,
    "planned",
    "Fixed template composition plan recorded.",
    options.now?.() ?? new Date(),
  );
  await writeJsonAtomic(manifestPath, current);

  const workspaceDirectory = path.join(runDirectory, WORKSPACE_PATH);
  await mkdir(workspaceDirectory);
  await materializeWorkspace(
    projectDirectory,
    workspaceDirectory,
    runtimeConfig,
    assetSelection,
  );
  const workspaceDigest = await digestDirectory(workspaceDirectory);
  const runtimeConfigPath = path.join(runDirectory, RUNTIME_CONFIG_PATH);

  current = withEvidence(current, {
    artifacts: {
      workspace: artifact(WORKSPACE_PATH, workspaceDigest.sha256),
      runtimeConfig: artifact(
        RUNTIME_CONFIG_PATH,
        await sha256File(runtimeConfigPath),
      ),
    },
    composition: {
      resourceProfile: runtimeConfig.composition.resourceProfile,
      budgetAdjustments: [...runtimeConfig.composition.budgetAdjustments],
    },
  });
  current = transitionRunManifest(
    current,
    "composed",
    "Runtime configuration rendered into an isolated workspace.",
    options.now?.() ?? new Date(),
  );
  await writeJsonAtomic(manifestPath, current);

  const templateDirectory = path.join(
    workspaceDirectory,
    "game-template",
    "vertical-shooter",
  );
  const packageDirectory = path.join(runDirectory, PACKAGE_PATH);
  assertInside(runDirectory, templateDirectory);
  assertInside(runDirectory, packageDirectory);

  const buildExecutor = options.buildExecutor ?? executeFixedViteBuild;
  try {
    await buildExecutor({
      projectDirectory,
      templateDirectory,
      packageDirectory,
    });
    await verifyPackagedSelectedAssets(packageDirectory, assetSelection);
  } catch (error) {
    const exitCode = error instanceof FixedBuildError ? error.exitCode : null;
    const buildLogPath = path.join(runDirectory, BUILD_LOG_PATH);
    await writeJsonAtomic(buildLogPath, {
      tool: "vite",
      status: "failed",
      exitCode,
    });
    current = withEvidence(current, {
      artifacts: {
        buildLog: artifact(BUILD_LOG_PATH, await sha256File(buildLogPath)),
      },
    });
    current = transitionRunManifest(
      current,
      "failed",
      "Fixed Vite build failed; safe metadata recorded.",
      options.now?.() ?? new Date(),
    );
    await writeJsonAtomic(manifestPath, current);
    throw new Error(
      `run ${manifest.runId} failed during the fixed Vite build`,
      {
        cause: error,
      },
    );
  }

  const packageDigest = await digestDirectory(packageDirectory);
  const buildLogPath = path.join(runDirectory, BUILD_LOG_PATH);
  await writeJsonAtomic(buildLogPath, {
    tool: "vite",
    status: "passed",
    exitCode: 0,
    outputFileCount: packageDigest.fileCount,
    outputBytes: packageDigest.totalBytes,
    selectedAssetFileCount:
      assetSelection === undefined
        ? 0
        : new Set(
            assetSelection.selections.map(
              (selection) => selection.materialization.runtimeUrl,
            ),
          ).size,
  });
  current = withEvidence(current, {
    artifacts: {
      buildLog: artifact(BUILD_LOG_PATH, await sha256File(buildLogPath)),
      package: artifact(PACKAGE_PATH, packageDigest.sha256),
    },
    build: {
      tool: "vite",
      exitCode: 0,
    },
  });
  current = transitionRunManifest(
    current,
    "built",
    "Fixed Vite production build completed.",
    options.now?.() ?? new Date(),
  );
  await writeJsonAtomic(manifestPath, current);

  return { runDirectory, manifest: current };
}
