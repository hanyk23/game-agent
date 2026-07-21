import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { runPackagingStage } from "../../src/orchestration/run-packaging-stage.js";
import { digestDirectory, sha256File } from "../../src/runs/artifact-hash.js";
import {
  createRunManifest,
  RunManifestSchema,
  transitionRunManifest,
  type RunManifest,
} from "../../src/runs/run-manifest.js";

const runId = "99aa26e7-488d-46e9-862e-e5c5e624b8de";
const createdDirectories: string[] = [];

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, json(value), "utf8");
}

function advanceManifest(targetState: "built" | "play_checked"): RunManifest {
  let manifest = createRunManifest("Package the verified fixture", {
    runId,
    now: () => new Date("2026-07-15T00:00:00.000Z"),
  });
  for (const [state, detail] of [
    ["spec_generated", "Spec fixture recorded."],
    ["spec_validated", "Spec fixture validated."],
    ["planned", "Plan fixture recorded."],
    ["composed", "Workspace fixture composed."],
    ["built", "Package fixture built."],
  ] as const) {
    manifest = transitionRunManifest(
      manifest,
      state,
      detail,
      new Date("2026-07-15T00:00:01.000Z"),
    );
  }
  if (targetState === "built") return manifest;
  manifest = transitionRunManifest(
    manifest,
    "runtime_checked",
    "Desktop fixture passed.",
    new Date("2026-07-15T00:00:02.000Z"),
  );
  return transitionRunManifest(
    manifest,
    "play_checked",
    "Desktop and mobile fixtures passed.",
    new Date("2026-07-15T00:00:03.000Z"),
  );
}

async function createPackagingFixture(
  options: {
    state?: "built" | "play_checked";
    verificationStatus?: "passed" | "failed";
  } = {},
) {
  const projectDirectory = await mkdtemp(
    path.join(tmpdir(), "game-agent-package-stage-"),
  );
  createdDirectories.push(projectDirectory);
  const runDirectory = path.join(projectDirectory, "artifacts", "runs", runId);
  await mkdir(runDirectory, { recursive: true });
  await mkdir(path.join(projectDirectory, "docs"));
  await writeFile(
    path.join(projectDirectory, "docs", "THIRD_PARTY_NOTICES.md"),
    "# Third-party notices\n\nFixture dependency notice.\n",
    "utf8",
  );

  const specPath = path.join(runDirectory, "spec.json");
  const planPath = path.join(runDirectory, "plan.json");
  const workspaceDirectory = path.join(runDirectory, "workspace");
  const runtimeConfigPath = path.join(workspaceDirectory, "runtime.json");
  const buildLogPath = path.join(runDirectory, "logs", "build.json");
  const packageDirectory = path.join(runDirectory, "package");
  const selectedAssetPath = path.join(
    packageDirectory,
    "assets",
    "catalog",
    "fixture-asset.png",
  );
  const verificationDirectory = path.join(runDirectory, "verification");
  const selectionPath = path.join(runDirectory, "asset-selection.json");

  await writeJson(specPath, { title: "Fixture game" });
  await writeJson(planPath, { planVersion: "1.0.0" });
  await writeJson(runtimeConfigPath, { mode: "fixture" });
  await writeJson(buildLogPath, { status: "passed" });
  await mkdir(packageDirectory, { recursive: true });
  await writeFile(
    path.join(packageDirectory, "index.html"),
    "<!doctype html><title>Fixture game</title>\n",
    "utf8",
  );
  await mkdir(path.dirname(selectedAssetPath), { recursive: true });
  await writeFile(selectedAssetPath, "fixture-png-bytes", "utf8");
  const selectedAssetSha256 = await sha256File(selectedAssetPath);
  await writeJson(selectionPath, {
    schemaVersion: "1.0.0",
    policyId: "phase-2-baseline",
    catalog: {
      catalogId: "fixture-catalog",
      path: "assets/corpus/catalog.json",
      sha256: "a".repeat(64),
    },
    selections: [
      {
        queryId: "fixture-player",
        category: "player",
        selectedAssetId: "fixture-asset",
        score: 40,
        breakdown: { theme: 20, visualStyle: 20, tags: 0, palette: 0 },
        rationale: ["theme:20", "visualStyle:20"],
        excludedCandidateCount: 0,
        sourceFile: {
          path: "sources/fixture/fixture-asset.png",
          sha256: selectedAssetSha256,
          format: "png",
          width: 32,
          height: 32,
          byteSize: 17,
          hasTransparency: true,
        },
        provenance: {
          siteName: "Fixture Art",
          author: "Fixture Author",
          sourcePageUrl: "https://example.com/fixture-asset",
          licenseId: "CC-BY-4.0",
          attributionText: "Fixture Asset by Fixture Author, CC-BY 4.0.",
        },
        materialization: {
          workspacePath:
            "game-template/vertical-shooter/public/assets/catalog/fixture-asset.png",
          runtimeUrl: "/assets/catalog/fixture-asset.png",
        },
      },
    ],
  });
  await writeJson(path.join(verificationDirectory, "browser-gates.json"), {
    verificationVersion: "1.1.0",
    status: options.verificationStatus ?? "passed",
    browser: { engine: "chromium", channel: "msedge" },
    cases: [
      {
        name: "desktop",
        consoleErrorCount: 0,
        pageErrorCount: 0,
        failedRequestCount: 0,
      },
      {
        name: "mobile",
        consoleErrorCount: 0,
        pageErrorCount: 0,
        failedRequestCount: 0,
      },
    ],
    findings: [],
  });

  let manifest = advanceManifest(options.state ?? "play_checked");
  manifest = RunManifestSchema.parse({
    ...manifest,
    artifacts: {
      spec: { path: "spec.json", sha256: await sha256File(specPath) },
      plan: { path: "plan.json", sha256: await sha256File(planPath) },
      assetSelection: {
        path: "asset-selection.json",
        sha256: await sha256File(selectionPath),
      },
      workspace: {
        path: "workspace",
        sha256: (await digestDirectory(workspaceDirectory)).sha256,
      },
      runtimeConfig: {
        path: "workspace/runtime.json",
        sha256: await sha256File(runtimeConfigPath),
      },
      buildLog: {
        path: "logs/build.json",
        sha256: await sha256File(buildLogPath),
      },
      package: {
        path: "package",
        sha256: (await digestDirectory(packageDirectory)).sha256,
      },
      verification: {
        path: "verification",
        sha256: (await digestDirectory(verificationDirectory)).sha256,
      },
    },
    build: { tool: "vite", exitCode: 0 },
  });
  await writeJson(path.join(runDirectory, "manifest.json"), manifest);
  return {
    projectDirectory,
    runDirectory,
    packageDirectory,
    selectedAssetPath,
  };
}

async function rewritePackageHash(runDirectory: string): Promise<void> {
  const manifestPath = path.join(runDirectory, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
    artifacts: { package: { sha256: string } };
  };
  manifest.artifacts.package.sha256 = (
    await digestDirectory(path.join(runDirectory, "package"))
  ).sha256;
  await writeJson(manifestPath, manifest);
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

describe("run packaging stage", () => {
  it("creates a deterministic attributed delivery and records packaged state", async () => {
    const first = await createPackagingFixture();
    const firstResult = await runPackagingStage({
      projectDirectory: first.projectDirectory,
      runId,
      now: () => new Date("2026-07-15T00:00:04.000Z"),
    });

    expect(firstResult.manifest.state).toBe("packaged");
    expect(firstResult.manifest.manifestVersion).toBe("1.5.0");
    expect(firstResult.manifest.artifacts.delivery?.sha256).toMatch(
      /^[a-f0-9]{64}$/,
    );
    await expect(
      readFile(
        path.join(firstResult.deliveryDirectory, "game", "index.html"),
        "utf8",
      ),
    ).resolves.toContain("Fixture game");
    const assets = JSON.parse(
      await readFile(
        path.join(firstResult.deliveryDirectory, "THIRD_PARTY_ASSETS.json"),
        "utf8",
      ),
    ) as { assetCount: number; assets: Array<{ attributionText: string }> };
    expect(assets.assetCount).toBe(1);
    expect(assets.assets[0]?.attributionText).toContain("Fixture Author");

    const second = await createPackagingFixture();
    const secondResult = await runPackagingStage({
      projectDirectory: second.projectDirectory,
      runId,
      now: () => new Date("2026-07-15T00:00:04.000Z"),
    });
    expect(secondResult.manifest.artifacts.delivery?.sha256).toBe(
      firstResult.manifest.artifacts.delivery?.sha256,
    );
  });

  it("rejects a package whose directory hash no longer matches", async () => {
    const fixture = await createPackagingFixture();
    await writeFile(
      path.join(fixture.packageDirectory, "index.html"),
      "tampered",
      "utf8",
    );
    await expect(
      runPackagingStage({ projectDirectory: fixture.projectDirectory, runId }),
    ).rejects.toThrow("package artifact hash does not match");
    await expect(
      readFile(path.join(fixture.runDirectory, "delivery", "RUN.md"), "utf8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rechecks selected asset hashes even if the package evidence was rewritten", async () => {
    const fixture = await createPackagingFixture();
    await writeFile(fixture.selectedAssetPath, "different-asset", "utf8");
    await rewritePackageHash(fixture.runDirectory);
    await expect(
      runPackagingStage({ projectDirectory: fixture.projectDirectory, runId }),
    ).rejects.toThrow("selected package asset hash mismatch");
  });

  it("requires semantic desktop and mobile passing evidence", async () => {
    const fixture = await createPackagingFixture({
      verificationStatus: "failed",
    });
    await expect(
      runPackagingStage({ projectDirectory: fixture.projectDirectory, runId }),
    ).rejects.toThrow();
  });

  it("rejects development instrumentation in a rewritten package", async () => {
    const fixture = await createPackagingFixture();
    await writeFile(
      path.join(fixture.packageDirectory, "index.html"),
      "<script>window.__SHOOTER_TEST__ = {};</script>",
      "utf8",
    );
    await rewritePackageHash(fixture.runDirectory);
    await expect(
      runPackagingStage({ projectDirectory: fixture.projectDirectory, runId }),
    ).rejects.toThrow("production package contains forbidden marker");
  });

  it("rejects runs that have not reached play_checked", async () => {
    const fixture = await createPackagingFixture({ state: "built" });
    await expect(
      runPackagingStage({ projectDirectory: fixture.projectDirectory, runId }),
    ).rejects.toThrow("requires play_checked state");
  });
});
