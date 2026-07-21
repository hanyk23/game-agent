import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import { runBoundedRepairRound } from "../../src/repair/bounded-repair-controller.js";
import { digestDirectory, sha256File } from "../../src/runs/artifact-hash.js";
import {
  createRunManifest,
  RunManifestSchema,
  transitionRunManifest,
} from "../../src/runs/run-manifest.js";
import { createVerificationFinding } from "../../src/verification/verification-finding.js";

const runId = "e9c6c8cf-d2be-4f9d-8dd4-cfc994f342f4";
const targetPath = "game-template/vertical-shooter/src/scenes/play-scene.ts";

async function createRepairableRun(maximumRepairRounds = 3) {
  const projectDirectory = await mkdtemp(
    path.join(os.tmpdir(), "repair-test-"),
  );
  const runDirectory = path.join(projectDirectory, "artifacts", "runs", runId);
  const workspaceDirectory = path.join(runDirectory, "workspace");
  const target = path.join(workspaceDirectory, targetPath);
  const packageDirectory = path.join(runDirectory, "package");
  const verificationDirectory = path.join(runDirectory, "verification");
  await mkdir(path.dirname(target), { recursive: true });
  await mkdir(packageDirectory, { recursive: true });
  await mkdir(verificationDirectory, { recursive: true });
  await writeFile(target, "export function speed() { return 0; }\n", "utf8");
  await writeFile(path.join(packageDirectory, "index.html"), "faulty", "utf8");
  const finding = createVerificationFinding({
    gate: "play",
    code: "player-control-failed",
    message: "Keyboard movement did not move the player.",
    suspectedFiles: [targetPath],
    reportPath: "verification/browser-gates.json",
    caseName: "desktop",
    id: "b4f6f330-0d2c-41a1-85a0-f704c6b3099a",
  });
  await writeFile(
    path.join(verificationDirectory, "browser-gates.json"),
    `${JSON.stringify({ findings: [finding] }, null, 2)}\n`,
    "utf8",
  );

  let manifest = createRunManifest("Repair test", {
    runId,
    maximumRepairRounds,
  });
  manifest = transitionRunManifest(
    manifest,
    "spec_generated",
    "Spec generated.",
  );
  manifest = transitionRunManifest(manifest, "spec_validated", "Spec valid.");
  manifest = transitionRunManifest(manifest, "planned", "Plan ready.");
  manifest = transitionRunManifest(manifest, "composed", "Game composed.");
  manifest = transitionRunManifest(manifest, "built", "Faulty build ready.");
  manifest = RunManifestSchema.parse({
    ...manifest,
    artifacts: {
      workspace: {
        path: "workspace",
        sha256: (await digestDirectory(workspaceDirectory)).sha256,
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
  });
  await writeFile(
    path.join(runDirectory, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  return { projectDirectory, runDirectory, target, finding };
}

describe("bounded repair controller", () => {
  it("binds a small source patch to a finding and rebuilds into a new package", async () => {
    const setup = await createRepairableRun();
    const expectedSha256 = await sha256File(setup.target);
    const buildExecutor = vi.fn(async ({ packageDirectory }) => {
      await mkdir(packageDirectory, { recursive: true });
      await writeFile(
        path.join(packageDirectory, "index.html"),
        "repaired",
        "utf8",
      );
    });

    const result = await runBoundedRepairRound({
      projectDirectory: setup.projectDirectory,
      runId,
      finding: setup.finding,
      repairExecutor: async () => ({
        findingId: setup.finding.id,
        summary: "Restore configured movement speed.",
        patches: [
          {
            path: targetPath,
            expectedSha256,
            replacements: [{ search: "return 0", replacement: "return 320" }],
          },
        ],
      }),
      buildExecutor,
    });

    expect(result.manifest.state).toBe("built");
    expect(result.manifest.repairBudget.usedRounds).toBe(1);
    expect(result.manifest.artifacts.package?.path).toBe(
      "repairs/round-1/package",
    );
    expect(await readFile(setup.target, "utf8")).toContain("return 320");
    expect(
      await readFile(
        path.join(result.repairDirectory, "before", targetPath),
        "utf8",
      ),
    ).toContain("return 0");
    expect(buildExecutor).toHaveBeenCalledOnce();
  });

  it("records terminal budget exhaustion before requesting another patch", async () => {
    const setup = await createRepairableRun(0);
    const repairExecutor = vi.fn();

    await expect(
      runBoundedRepairRound({
        projectDirectory: setup.projectDirectory,
        runId,
        finding: setup.finding,
        repairExecutor,
      }),
    ).rejects.toThrow("repair budget exhausted");
    const persisted = RunManifestSchema.parse(
      JSON.parse(
        await readFile(path.join(setup.runDirectory, "manifest.json"), "utf8"),
      ),
    );
    expect(persisted.state).toBe("repair_budget_exhausted");
    expect(repairExecutor).not.toHaveBeenCalled();
  });

  it("stops before patching a repeated identical finding", async () => {
    const setup = await createRepairableRun();
    const manifestPath = path.join(setup.runDirectory, "manifest.json");
    const current = RunManifestSchema.parse(
      JSON.parse(await readFile(manifestPath, "utf8")),
    );
    await mkdir(path.join(setup.runDirectory, "repairs", "round-1"), {
      recursive: true,
    });
    await writeFile(
      path.join(setup.runDirectory, "repairs", "round-1", "finding.json"),
      `${JSON.stringify(setup.finding, null, 2)}\n`,
      "utf8",
    );
    await writeFile(
      manifestPath,
      `${JSON.stringify(
        RunManifestSchema.parse({
          ...current,
          repairBudget: { ...current.repairBudget, usedRounds: 1 },
        }),
        null,
        2,
      )}\n`,
      "utf8",
    );
    const repairExecutor = vi.fn();

    await expect(
      runBoundedRepairRound({
        projectDirectory: setup.projectDirectory,
        runId,
        finding: setup.finding,
        repairExecutor,
      }),
    ).rejects.toThrow("repeated identical");
    const persisted = RunManifestSchema.parse(
      JSON.parse(await readFile(manifestPath, "utf8")),
    );
    expect(persisted.state).toBe("repair_budget_exhausted");
    expect(repairExecutor).not.toHaveBeenCalled();
  });
});
