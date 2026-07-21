import {
  cp,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

import {
  RUN_TEMPLATE_SOURCE_FILES,
  runCompositionStage,
} from "../../src/orchestration/run-composition-stage.js";
import { planSpecIntentLedger } from "../../src/requirements/spec-intent-ledger.js";
import {
  createRunManifest,
  transitionRunManifest,
} from "../../src/runs/run-manifest.js";
import { sha256File } from "../../src/runs/artifact-hash.js";
import { createSpaceAssetSpec } from "../fixtures/create-space-asset-spec.js";
import { createValidSpec } from "../fixtures/create-valid-spec.js";

const sourceProjectDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const createdDirectories: string[] = [];

async function createProjectFixture(
  includeAssetCorpus = false,
): Promise<string> {
  const projectDirectory = await mkdtemp(
    path.join(tmpdir(), "game-agent-run-stage-"),
  );
  createdDirectories.push(projectDirectory);
  for (const relativePath of RUN_TEMPLATE_SOURCE_FILES) {
    const destination = path.join(projectDirectory, relativePath);
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(
      path.join(sourceProjectDirectory, relativePath),
      destination,
    );
  }
  if (includeAssetCorpus) {
    await cp(
      path.join(sourceProjectDirectory, "assets", "corpus"),
      path.join(projectDirectory, "assets", "corpus"),
      { recursive: true },
    );
  }
  return projectDirectory;
}

function createValidatedManifest(
  runId: string,
  prompt = "Generate a deterministic test game",
) {
  let manifest = createRunManifest(prompt, {
    runId,
    now: () => new Date("2026-07-15T00:00:00.000Z"),
  });
  manifest = transitionRunManifest(
    manifest,
    "spec_generated",
    "Fixture Spec supplied.",
    new Date("2026-07-15T00:00:01.000Z"),
  );
  return transitionRunManifest(
    manifest,
    "spec_validated",
    "Fixture Spec passed local validation.",
    new Date("2026-07-15T00:00:02.000Z"),
  );
}

async function fakeBuild({
  packageDirectory,
}: {
  packageDirectory: string;
}): Promise<void> {
  await mkdir(packageDirectory);
  await writeFile(
    path.join(packageDirectory, "index.html"),
    "<!doctype html><title>built</title>\n",
    "utf8",
  );
}

async function fakeAssetBuild({
  templateDirectory,
  packageDirectory,
}: {
  templateDirectory: string;
  packageDirectory: string;
}): Promise<void> {
  await fakeBuild({ packageDirectory });
  await cp(
    path.join(templateDirectory, "public", "assets"),
    path.join(packageDirectory, "assets"),
    { recursive: true },
  );
}

afterEach(async () => {
  for (const directory of createdDirectories.splice(0)) {
    const resolved = path.resolve(directory);
    if (!resolved.startsWith(path.resolve(tmpdir()) + path.sep)) {
      throw new Error(`refusing to remove non-temporary fixture: ${resolved}`);
    }
    await rm(resolved, { recursive: true, force: true });
  }
});

describe("run composition stage", () => {
  it("materializes every source required by the runtime-kernel seam", () => {
    expect(RUN_TEMPLATE_SOURCE_FILES).toEqual(
      expect.arrayContaining([
        "game-template/vertical-shooter/src/runtime-kernel/contracts.ts",
        "game-template/vertical-shooter/src/runtime-kernel/core-services.ts",
        "game-template/vertical-shooter/src/runtime-kernel/game-module-runtime-service-host.ts",
        "game-template/vertical-shooter/src/runtime-kernel/game-module-runtime.ts",
        "game-template/vertical-shooter/src/runtime-kernel/mixed-v13-browser-conformance.ts",
        "game-template/vertical-shooter/src/runtime-kernel/mixed-v14-browser-conformance.ts",
        "game-template/vertical-shooter/src/runtime-kernel/phaser-runtime-kernel.ts",
        "src/modules/game-module-production-instantiator.ts",
        "src/modules/game-module-production-authority-v14.ts",
        "src/modules/game-module-hostile-attack-router.ts",
        "src/modules/game-module-outcome-authority-adapter-v14.ts",
        "src/modules/game-module-outcome-host.ts",
        "src/modules/game-module-score-authority-adapter-v14.ts",
        "src/modules/game-module-score-ledger-host.ts",
        "src/modules/game-module-runtime-catalog.ts",
        "src/modules/game-module-runtime-payloads.ts",
      ]),
    );
    expect(
      RUN_TEMPLATE_SOURCE_FILES.filter(
        (source) =>
          source ===
          "game-template/vertical-shooter/src/runtime-kernel/mixed-v13-browser-conformance.ts",
        "game-template/vertical-shooter/src/runtime-kernel/mixed-v14-browser-conformance.ts",
      ),
    ).toHaveLength(1);
    expect(
      RUN_TEMPLATE_SOURCE_FILES.every(
        (source) =>
          !path.isAbsolute(source) &&
          !source.split("/").includes("..") &&
          !/[?*]/.test(source) &&
          path.extname(source).length > 0,
      ),
    ).toBe(true);
  });

  it("materializes, hashes, records adjustments, and builds an isolated run", async () => {
    const projectDirectory = await createProjectFixture();
    const runId = "ef8ca9d5-7ce4-4a70-81bd-1dfbcad03f17";
    const result = await runCompositionStage({
      projectDirectory,
      manifest: createValidatedManifest(runId),
      spec: createValidSpec(),
      resourceProfile: "mobile",
      buildExecutor: fakeBuild,
      now: () => new Date("2026-07-15T00:00:03.000Z"),
    });

    expect(result.manifest.state).toBe("built");
    expect(result.manifest.manifestVersion).toBe("1.5.0");
    expect(result.manifest.composition).toMatchObject({
      resourceProfile: "mobile",
      budgetAdjustments: [
        {
          field: "maxEnemyBullets",
          requested: 260,
          effective: 180,
        },
        {
          field: "maxEnemies",
          requested: 36,
          effective: 32,
        },
      ],
    });
    expect(result.manifest.artifacts).toMatchObject({
      spec: { path: "spec.json" },
      plan: { path: "plan.json" },
      workspace: { path: "workspace" },
      runtimeConfig: {
        path: "workspace/game-template/vertical-shooter/src/generated/runtime-config.json",
      },
      buildLog: { path: "logs/build.json" },
      package: { path: "package" },
    });
    for (const evidence of Object.values(result.manifest.artifacts)) {
      expect(evidence?.sha256).toMatch(/^[a-f0-9]{64}$/);
    }

    const persistedManifest = JSON.parse(
      await readFile(path.join(result.runDirectory, "manifest.json"), "utf8"),
    ) as { state: string };
    expect(persistedManifest.state).toBe("built");
    const runtime = JSON.parse(
      await readFile(
        path.join(
          result.runDirectory,
          "workspace/game-template/vertical-shooter/src/generated/runtime-config.json",
        ),
        "utf8",
      ),
    ) as { resourceBudget: { profile: string } };
    expect(runtime.resourceBudget.profile).toBe("mobile");
  });

  it("records and materializes only deterministic reviewed asset selections", async () => {
    const projectDirectory = await createProjectFixture(true);
    const runId = "a9137489-bba5-421c-bf09-c3492af29faf";
    const result = await runCompositionStage({
      projectDirectory,
      manifest: createValidatedManifest(runId),
      spec: createSpaceAssetSpec(),
      enableAssetSelection: true,
      buildExecutor: fakeAssetBuild,
      now: () => new Date("2026-07-15T00:00:03.000Z"),
    });

    expect(result.manifest.artifacts.assetSelection).toMatchObject({
      path: "asset-selection.json",
      sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(result.manifest.artifacts.assetQueryGrounding).toMatchObject({
      path: "asset-query-grounding.json",
      sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    const grounding = JSON.parse(
      await readFile(
        path.join(result.runDirectory, "asset-query-grounding.json"),
        "utf8",
      ),
    ) as {
      schemaVersion: string;
      queries: Array<{ queryId: string; terms: unknown[] }>;
    };
    expect(grounding.schemaVersion).toBe("1.1.2");
    expect(grounding.queries).toHaveLength(9);
    expect(grounding.queries.every((query) => query.terms.length > 0)).toBe(
      true,
    );
    const selection = JSON.parse(
      await readFile(
        path.join(result.runDirectory, "asset-selection.json"),
        "utf8",
      ),
    ) as {
      selections: Array<{
        selectedAssetId: string;
        sourceFile: { sha256: string };
        materialization: { workspacePath: string; runtimeUrl: string };
      }>;
    };
    expect(selection.selections).toHaveLength(9);
    const runtimeConfig = JSON.parse(
      await readFile(
        path.join(
          result.runDirectory,
          "workspace/game-template/vertical-shooter/src/generated/runtime-config.json",
        ),
        "utf8",
      ),
    ) as {
      resolvedAssets: {
        mode: string;
        selections: Array<{ queryId: string; sourceSha256: string }>;
      };
    };
    expect(runtimeConfig.resolvedAssets.mode).toBe("catalog");
    expect(runtimeConfig.resolvedAssets.selections).toHaveLength(9);

    const uniqueWorkspacePaths = new Set(
      selection.selections.map(
        (selected) => selected.materialization.workspacePath,
      ),
    );
    expect(uniqueWorkspacePaths.size).toBe(9);
    for (const selected of selection.selections) {
      const materializedPath = path.join(
        result.runDirectory,
        "workspace",
        ...selected.materialization.workspacePath.split("/"),
      );
      await expect(sha256File(materializedPath)).resolves.toBe(
        selected.sourceFile.sha256,
      );
      const packagedPath = path.join(
        result.runDirectory,
        "package",
        ...selected.materialization.runtimeUrl.slice(1).split("/"),
      );
      await expect(sha256File(packagedPath)).resolves.toBe(
        selected.sourceFile.sha256,
      );
    }

    const publicFiles = await readdir(
      path.join(
        result.runDirectory,
        "workspace/game-template/vertical-shooter/public/assets/catalog",
      ),
    );
    expect(publicFiles).toHaveLength(9);
  });

  it("completes and records omitted creative catalog roles before planning", async () => {
    const projectDirectory = await createProjectFixture(true);
    const runId = "324c9d2e-0fd0-40fa-a777-50ddbf8a2227";
    const report = JSON.parse(
      await readFile(
        path.join(
          sourceProjectDirectory,
          "artifacts/evaluations/natural-language-probes/66f33ad6-6d53-440d-9fca-4324cd768c27/report.json",
        ),
        "utf8",
      ),
    ) as { spec: unknown };
    const result = await runCompositionStage({
      projectDirectory,
      manifest: createValidatedManifest(runId),
      spec: report.spec,
      enableAssetSelection: true,
      buildExecutor: fakeAssetBuild,
      now: () => new Date("2026-07-16T00:00:03.000Z"),
    });

    expect(result.manifest.artifacts).toMatchObject({
      sourceSpec: { path: "source-spec.json" },
      spec: { path: "spec.json" },
      specCompletion: { path: "spec-completion.json" },
      assetQueryGrounding: { path: "asset-query-grounding.json" },
      assetSelection: { path: "asset-selection.json" },
    });
    const sourceSpec = JSON.parse(
      await readFile(
        path.join(result.runDirectory, "source-spec.json"),
        "utf8",
      ),
    ) as { assetQueries: unknown[] };
    const completedSpec = JSON.parse(
      await readFile(path.join(result.runDirectory, "spec.json"), "utf8"),
    ) as { assetQueries: Array<{ id: string; category: string }> };
    const completion = JSON.parse(
      await readFile(
        path.join(result.runDirectory, "spec-completion.json"),
        "utf8",
      ),
    ) as { decisions: Array<{ queryId: string; ruleId: string }> };
    const selection = JSON.parse(
      await readFile(
        path.join(result.runDirectory, "asset-selection.json"),
        "utf8",
      ),
    ) as {
      selections: Array<{ queryId: string; selectedAssetId: string }>;
    };

    expect(sourceSpec.assetQueries).toHaveLength(9);
    expect(completedSpec.assetQueries).toHaveLength(10);
    expect(completion.decisions).toEqual([
      {
        field: "assetQueries",
        action: "added",
        queryId: "default-background",
        ruleId: "add-required-background-v1",
        reason:
          "The user did not specify a catalog background; the Agent derived one from the dominant validated theme and visual styles.",
        derivedValue: expect.objectContaining({
          id: "default-background",
          category: "background",
        }),
      },
    ]);
    expect(
      selection.selections.find(
        (entry) => entry.queryId === "default-background",
      ),
    ).toEqual({
      queryId: "default-background",
      category: "background",
      selectedAssetId: "oga-pixel-starfield",
      score: expect.any(Number),
      breakdown: expect.any(Object),
      rationale: expect.any(Array),
      excludedCandidateCount: expect.any(Number),
      sourceFile: expect.any(Object),
      provenance: expect.any(Object),
      materialization: expect.any(Object),
    });
  });

  it("records the ledger-gated playability and asset completion chain", async () => {
    const projectDirectory = await createProjectFixture(true);
    const runId = "da392740-805d-4a0d-a9ce-fd03643f2951";
    const probeCase = JSON.parse(
      await readFile(
        path.join(
          sourceProjectDirectory,
          "evals/cases/natural-language-probe-v2.json",
        ),
        "utf8",
      ),
    ) as { language: "zh-CN"; prompt: string };
    const report = JSON.parse(
      await readFile(
        path.join(
          sourceProjectDirectory,
          "artifacts/evaluations/natural-language-probes/66f33ad6-6d53-440d-9fca-4324cd768c27/report.json",
        ),
        "utf8",
      ),
    ) as { spec: unknown };
    const request = {
      language: probeCase.language,
      prompt: probeCase.prompt,
    } as const;
    const ledger = planSpecIntentLedger(request, report.spec);
    const result = await runCompositionStage({
      projectDirectory,
      manifest: createValidatedManifest(runId, probeCase.prompt),
      spec: report.spec,
      specIntent: { request, ledger },
      enableAssetSelection: true,
      buildExecutor: fakeAssetBuild,
      now: () => new Date("2026-07-16T00:00:03.000Z"),
    });

    expect(result.manifest.artifacts).toMatchObject({
      sourceSpec: { path: "source-spec.json" },
      specIntentLedger: { path: "spec-intent-ledger.json" },
      playabilitySpec: { path: "playability-spec.json" },
      specPlayabilityCompletion: {
        path: "spec-playability-completion.json",
      },
      specCompletion: { path: "spec-completion.json" },
      spec: { path: "spec.json" },
    });
    const sourceSpec = JSON.parse(
      await readFile(
        path.join(result.runDirectory, "source-spec.json"),
        "utf8",
      ),
    ) as { player: { maxHealth: number }; assetQueries: unknown[] };
    const playabilitySpec = JSON.parse(
      await readFile(
        path.join(result.runDirectory, "playability-spec.json"),
        "utf8",
      ),
    ) as { player: { maxHealth: number }; assetQueries: unknown[] };
    const finalSpec = JSON.parse(
      await readFile(path.join(result.runDirectory, "spec.json"), "utf8"),
    ) as { player: { maxHealth: number }; assetQueries: unknown[] };

    expect(sourceSpec.player.maxHealth).toBe(5);
    expect(sourceSpec.assetQueries).toHaveLength(9);
    expect(playabilitySpec.player.maxHealth).toBe(60);
    expect(playabilitySpec.assetQueries).toHaveLength(9);
    expect(finalSpec.player.maxHealth).toBe(60);
    expect(finalSpec.assetQueries).toHaveLength(10);
  });

  it("fails before creating a run when query vocabulary is not grounded", async () => {
    const projectDirectory = await createProjectFixture(true);
    const runId = "cb4be0bf-c7b5-4232-a524-d30291518bdd";

    await expect(
      runCompositionStage({
        projectDirectory,
        manifest: createValidatedManifest(runId),
        spec: createValidSpec(),
        enableAssetSelection: true,
        buildExecutor: fakeBuild,
      }),
    ).rejects.toThrow("Asset query grounding unknown-term");
    await expect(
      readFile(
        path.join(
          projectDirectory,
          "artifacts",
          "runs",
          runId,
          "manifest.json",
        ),
        "utf8",
      ),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("fails before planning when a catalog source file was tampered", async () => {
    const projectDirectory = await createProjectFixture(true);
    const runId = "62f67867-7291-4a5c-b06e-199205a0a097";
    await writeFile(
      path.join(
        projectDirectory,
        "assets/corpus/sources/kenney/space-shooter-remastered/player/playerShip1_blue.png",
      ),
      "tampered",
      "utf8",
    );

    await expect(
      runCompositionStage({
        projectDirectory,
        manifest: createValidatedManifest(runId),
        spec: createSpaceAssetSpec(),
        enableAssetSelection: true,
        buildExecutor: fakeBuild,
      }),
    ).rejects.toThrow("asset corpus verification failed");
  });

  it("fails the build when a selected package asset hash changes", async () => {
    const projectDirectory = await createProjectFixture(true);
    const runId = "7df6e9df-cc06-49e0-8df4-855225e804bc";

    await expect(
      runCompositionStage({
        projectDirectory,
        manifest: createValidatedManifest(runId),
        spec: createSpaceAssetSpec(),
        enableAssetSelection: true,
        buildExecutor: async (context) => {
          await fakeAssetBuild(context);
          await writeFile(
            path.join(
              context.packageDirectory,
              "assets/catalog/kenney-player-ship-1-blue.png",
            ),
            "tampered",
            "utf8",
          );
        },
      }),
    ).rejects.toThrow("failed during the fixed Vite build");

    const manifest = JSON.parse(
      await readFile(
        path.join(
          projectDirectory,
          "artifacts",
          "runs",
          runId,
          "manifest.json",
        ),
        "utf8",
      ),
    ) as { state: string };
    expect(manifest.state).toBe("failed");
  });

  it("requires a validated manifest before creating artifacts", async () => {
    const projectDirectory = await createProjectFixture();
    const manifest = createRunManifest("Invalid stage entry", {
      runId: "b92da832-7501-43c6-9cb0-267d32973fb7",
    });

    await expect(
      runCompositionStage({
        projectDirectory,
        manifest,
        spec: createValidSpec(),
        buildExecutor: fakeBuild,
      }),
    ).rejects.toThrow("requires spec_validated state");
  });

  it("fails closed instead of overwriting an existing run directory", async () => {
    const projectDirectory = await createProjectFixture();
    const runId = "0c47a2ee-5454-4690-ac90-b1580f6e8003";
    const runDirectory = path.join(
      projectDirectory,
      "artifacts",
      "runs",
      runId,
    );
    await mkdir(runDirectory, { recursive: true });
    await writeFile(path.join(runDirectory, "owner.txt"), "preserve\n", "utf8");

    await expect(
      runCompositionStage({
        projectDirectory,
        manifest: createValidatedManifest(runId),
        spec: createValidSpec(),
        buildExecutor: fakeBuild,
      }),
    ).rejects.toThrow();
    await expect(
      readFile(path.join(runDirectory, "owner.txt"), "utf8"),
    ).resolves.toBe("preserve\n");
  });

  it("persists a failed terminal state when the fixed build fails", async () => {
    const projectDirectory = await createProjectFixture();
    const runId = "9c47b797-901b-4c51-b1b3-c80f0babdff2";

    await expect(
      runCompositionStage({
        projectDirectory,
        manifest: createValidatedManifest(runId),
        spec: createValidSpec(),
        buildExecutor: async () => {
          throw new Error("simulated build failure");
        },
      }),
    ).rejects.toThrow("failed during the fixed Vite build");

    const persisted = JSON.parse(
      await readFile(
        path.join(
          projectDirectory,
          "artifacts",
          "runs",
          runId,
          "manifest.json",
        ),
        "utf8",
      ),
    ) as { state: string; artifacts: { buildLog: { path: string } } };
    expect(persisted.state).toBe("failed");
    expect(persisted.artifacts.buildLog.path).toBe("logs/build.json");
  });
});
