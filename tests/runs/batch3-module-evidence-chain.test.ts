import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { GameAssemblySpecV13Schema } from "../../src/modules/game-module-contract.js";
import { createBrowserGateSpec } from "../../src/verification/browser-gate-spec.js";
import { sha256File } from "../../src/runs/artifact-hash.js";
import { verifyBatch3ModuleEvidenceChain } from "../../src/runs/batch3-module-evidence-chain.js";
import {
  createRunManifest,
  RunManifestSchema,
  type RunManifest,
} from "../../src/runs/run-manifest.js";

const createdDirectories: string[] = [];

afterEach(async () => {
  for (const directory of createdDirectories.splice(0)) {
    const resolved = path.resolve(directory);
    if (!resolved.startsWith(path.resolve(tmpdir()) + path.sep))
      throw new Error(`refusing to remove non-temporary fixture: ${resolved}`);
    await rm(resolved, { recursive: true, force: true });
  }
});

async function writeJson(directory: string, name: string, value: unknown) {
  const filePath = path.join(directory, name);
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return { path: name, sha256: await sha256File(filePath) };
}

function assetAssembly() {
  return GameAssemblySpecV13Schema.parse({
    schemaVersion: "1.3.0",
    assemblyId: "batch3.asset-evidence",
    kernelVersion: "1.0.0",
    engine: { id: "phaser", version: "3.90.0" },
    actors: [{ actorId: "player-one", role: "player" }],
    modules: [
      {
        instanceId: "ledger",
        ownerId: "player-one",
        moduleId: "scoring.ledger",
        versionRange: "1.0.0",
        configuration: {},
      },
    ],
    bindings: [],
    assetRoles: [
      {
        roleId: "enemy",
        category: "enemy",
        requiredByInstanceIds: ["ledger"],
      },
    ],
    contactPolicySelections: [],
    damageSinkRoutes: [],
    entityMutationGrantSelections: [],
    assetBindings: [
      {
        bindingId: "enemy.asset",
        roleId: "enemy",
        category: "enemy",
        artifact: {
          assetId: "enemy.asset",
          sourceSha256: "a".repeat(64),
          runtimeSha256: "b".repeat(64),
          provenanceId: "agent.reviewed",
          licenseRecordId: "cc0",
        },
        sharing: "instance",
        consumerInstanceIds: ["ledger"],
      },
    ],
    effectApplicationBindings: [],
    pickupEffectPlanSelections: [],
    globalBudget: {
      activeEntities: 1,
      activeProjectiles: 1,
      spawnsPerSecond: 1,
      timers: 1,
    },
    actorRootBindings: [],
    hostileAggregateBudgetGroups: [],
    actorSetDamageRoutes: [],
    actorRootMutationGrantSelections: [],
    outcomeCoordinatorSelection: null,
  });
}

async function fixture(): Promise<{
  runDirectory: string;
  manifest: RunManifest;
}> {
  const runDirectory = await mkdtemp(
    path.join(tmpdir(), "batch3-module-evidence-"),
  );
  createdDirectories.push(runDirectory);
  const artifacts = {
    spec: await writeJson(runDirectory, "spec.json", createBrowserGateSpec()),
    gameAssemblySpec: await writeJson(
      runDirectory,
      "game-assembly-spec.json",
      assetAssembly(),
    ),
    scoreEvidence: await writeJson(runDirectory, "score-evidence.json", {}),
    moduleResolution: await writeJson(
      runDirectory,
      "module-resolution.json",
      {},
    ),
    resolvedModuleGraph: await writeJson(
      runDirectory,
      "resolved-module-graph.json",
      {},
    ),
    moduleCatalog: await writeJson(runDirectory, "module-catalog.json", {}),
  };
  const base = createRunManifest("Batch 3 module evidence", {
    runId: "144ec28a-1895-49a3-87bd-54b8a0b6e96d",
  });
  return {
    runDirectory,
    manifest: RunManifestSchema.parse({
      ...base,
      manifestVersion: "1.6.0",
      composition: {
        mode: "batch3-legacy-v14",
        resourceProfile: "mobile",
        budgetAdjustments: [],
      },
      artifacts,
    }),
  };
}

describe("Batch 3 module evidence chain fail-closed boundary", () => {
  it("rejects non-modular manifests before reading run artifacts", async () => {
    const runDirectory = await mkdtemp(
      path.join(tmpdir(), "batch3-module-evidence-"),
    );
    createdDirectories.push(runDirectory);
    await expect(
      verifyBatch3ModuleEvidenceChain(
        runDirectory,
        createRunManifest("fixed"),
        { assets: [], approvedSharingEvidenceIds: [] },
      ),
    ).rejects.toThrow(/manifest 1.6.0/);
  });

  it("rejects missing or drifted trusted asset admission evidence", async () => {
    const input = await fixture();
    await expect(
      verifyBatch3ModuleEvidenceChain(
        input.runDirectory,
        input.manifest,
        undefined as never,
      ),
    ).rejects.toThrow();
    await expect(
      verifyBatch3ModuleEvidenceChain(input.runDirectory, input.manifest, {
        assets: [
          {
            assetId: "enemy.asset",
            sourceSha256: "a".repeat(64),
            runtimeSha256: "c".repeat(64),
            provenanceId: "agent.reviewed",
            licenseRecordId: "cc0",
          },
        ],
        approvedSharingEvidenceIds: [],
      }),
    ).rejects.toThrow(/asset admission evidence drift/);
  });

  it("rejects raw artifact hash drift before parsing or replay", async () => {
    const input = await fixture();
    await writeFile(
      path.join(
        input.runDirectory,
        input.manifest.artifacts.gameAssemblySpec!.path,
      ),
      "{}\n",
      "utf8",
    );
    await expect(
      verifyBatch3ModuleEvidenceChain(input.runDirectory, input.manifest, {
        assets: [],
        approvedSharingEvidenceIds: [],
      }),
    ).rejects.toThrow(/hash does not match/);
  });
});
