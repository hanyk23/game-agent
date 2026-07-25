import { readFile } from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import { sha256ShooterGameSpec } from "../assets/asset-query-grounding.js";
import {
  Batch3LegacyScoreEvidenceSchema,
  deriveBatch3LegacyScoreEvidence,
  type Batch3LegacyScoreEvidence,
} from "../modules/batch3-legacy-score-evidence.js";
import { createBatch3ProductionRegistry } from "../modules/batch3-production-library.js";
import { resolveGameAssemblyV14 } from "../modules/game-module-composer-v14.js";
import { GameAssemblySpecV13Schema } from "../modules/game-module-contract.js";
import { sha256CanonicalJson } from "../modules/game-module-execution-contract.js";
import { generateBrowserRuntimeCatalogIdentityV14 } from "../modules/game-module-runtime-catalog-generator.js";
import {
  BrowserRuntimeCatalogIdentityV14Schema,
  type BrowserRuntimeCatalogIdentityV14,
} from "../modules/game-module-runtime-catalog-identity-v14.js";
import {
  ResolvedModuleGraphV14Schema,
  type ResolvedModuleGraphV14,
} from "../modules/game-module-resolver-v14.js";
import type { ModuleAssetAdmissionEvidenceV12 } from "../modules/game-module-resolver.js";
import { parseShooterGameSpec } from "../requirements/shooter-game-spec.js";
import { sha256File } from "./artifact-hash.js";
import { RunManifestSchema, type RunManifest } from "./run-manifest.js";

const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);

export const Batch3ModuleResolutionEvidenceV14Schema = z.strictObject({
  graphEvidenceId: Sha256Schema,
  status: z.enum(["ready", "blocked"]),
  blockers: z.array(
    z.strictObject({
      instanceId: z.string().min(1),
      code: z.string().min(1),
      evidenceId: Sha256Schema.optional(),
    }),
  ),
});

export type Batch3ModuleResolutionEvidenceV14 = z.infer<
  typeof Batch3ModuleResolutionEvidenceV14Schema
>;

export type VerifiedBatch3ModuleEvidenceChain = Readonly<{
  assembly: z.infer<typeof GameAssemblySpecV13Schema>;
  scoreEvidence: Batch3LegacyScoreEvidence;
  moduleResolution: Batch3ModuleResolutionEvidenceV14;
  graph: ResolvedModuleGraphV14;
  moduleCatalog: BrowserRuntimeCatalogIdentityV14;
}>;

function assertInside(parent: string, child: string): void {
  const relative = path.relative(parent, child);
  if (
    relative === "" ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  )
    throw new Error(`module artifact path must remain inside ${parent}`);
}

async function readArtifact(
  runDirectory: string,
  manifest: RunManifest,
  name: keyof RunManifest["artifacts"],
): Promise<unknown> {
  const evidence = manifest.artifacts[name];
  if (evidence === undefined)
    throw new Error(`missing ${name} artifact evidence`);
  const artifactPath = path.resolve(runDirectory, evidence.path);
  assertInside(runDirectory, artifactPath);
  if ((await sha256File(artifactPath)) !== evidence.sha256)
    throw new Error(`${name} artifact hash does not match the manifest`);
  return JSON.parse(await readFile(artifactPath, "utf8"));
}

function sameCanonical(left: unknown, right: unknown): boolean {
  return sha256CanonicalJson(left) === sha256CanonicalJson(right);
}

function verifyCatalogSelfEvidence(
  catalog: BrowserRuntimeCatalogIdentityV14,
): void {
  const { catalogIdentityEvidenceId, ...basis } = catalog;
  if (sha256CanonicalJson(basis) !== catalogIdentityEvidenceId)
    throw new Error("module catalog identity evidence does not match");
}

export async function verifyBatch3ModuleEvidenceChain(
  runDirectoryInput: string,
  manifestInput: RunManifest,
  assetEvidenceInput: ModuleAssetAdmissionEvidenceV12,
): Promise<VerifiedBatch3ModuleEvidenceChain> {
  const runDirectory = path.resolve(runDirectoryInput);
  const manifest = RunManifestSchema.parse(manifestInput);
  if (
    manifest.manifestVersion !== "1.6.0" ||
    manifest.composition?.mode !== "batch3-legacy-v14"
  )
    throw new Error("Batch 3 module verification requires manifest 1.6.0");

  const rawSpec = await readArtifact(runDirectory, manifest, "spec");
  const spec = parseShooterGameSpec(rawSpec);
  const specSha256 = sha256ShooterGameSpec(spec);

  const assembly = GameAssemblySpecV13Schema.parse(
    await readArtifact(runDirectory, manifest, "gameAssemblySpec"),
  );
  const assetEvidence = z
    .strictObject({
      assets: z.array(
        z.strictObject({
          assetId: z.string().min(1),
          sourceSha256: Sha256Schema,
          runtimeSha256: Sha256Schema,
          provenanceId: z.string().min(1),
          licenseRecordId: z.string().min(1),
          attributionRecordId: z.string().min(1).optional(),
        }),
      ),
      approvedSharingEvidenceIds: z.array(z.string().min(1)),
    })
    // 类型安全说明：上方 strictObject 已在运行时保证结构与契约
    // ModuleAssetAdmissionEvidenceV12 完全一致（未知字段直接拒绝，
    // attributionRecordId 要么缺失、要么是非空 string，parse 不会产出
    // 显式 undefined）。此断言仅消除 zod 在 exactOptionalPropertyTypes 下
    // 为可选字段附加的多余 `| undefined` 类型标注，不掩盖任何真实类型风险。
    .parse(assetEvidenceInput) as ModuleAssetAdmissionEvidenceV12;
  for (const binding of assembly.assetBindings) {
    const admitted = assetEvidence.assets.find(
      (asset) => asset.assetId === binding.artifact.assetId,
    );
    if (
      admitted === undefined ||
      admitted.sourceSha256 !== binding.artifact.sourceSha256 ||
      admitted.runtimeSha256 !== binding.artifact.runtimeSha256 ||
      admitted.provenanceId !== binding.artifact.provenanceId ||
      admitted.licenseRecordId !== binding.artifact.licenseRecordId ||
      admitted.attributionRecordId !== binding.artifact.attributionRecordId ||
      (binding.sharing === "assembly" &&
        !assetEvidence.approvedSharingEvidenceIds.includes(
          binding.approvedSharingEvidenceId!,
        ))
    )
      throw new Error(
        `module asset admission evidence drift: ${binding.bindingId}`,
      );
  }
  const scoreEvidence = Batch3LegacyScoreEvidenceSchema.parse(
    await readArtifact(runDirectory, manifest, "scoreEvidence"),
  );
  if (scoreEvidence.sourceSpecSha256 !== specSha256)
    throw new Error("score evidence does not bind the validated Spec");
  if (scoreEvidence.assemblyEvidenceId !== sha256CanonicalJson(assembly))
    throw new Error("score evidence does not bind the Assembly 1.3 artifact");
  const expectedScoreEvidence = deriveBatch3LegacyScoreEvidence({
    spec,
    sourceSpecSha256: specSha256,
    assembly,
  });
  if (!sameCanonical(scoreEvidence, expectedScoreEvidence))
    throw new Error("Batch 3 score evidence replay drift");

  const moduleResolution = Batch3ModuleResolutionEvidenceV14Schema.parse(
    await readArtifact(runDirectory, manifest, "moduleResolution"),
  );
  const graph = ResolvedModuleGraphV14Schema.parse(
    await readArtifact(runDirectory, manifest, "resolvedModuleGraph"),
  );
  const moduleCatalog = BrowserRuntimeCatalogIdentityV14Schema.parse(
    await readArtifact(runDirectory, manifest, "moduleCatalog"),
  );
  verifyCatalogSelfEvidence(moduleCatalog);

  const registry = await createBatch3ProductionRegistry();
  const replay = resolveGameAssemblyV14(assembly, registry, {
    scoreCapacityBasis: scoreEvidence.scoreCapacityBasis,
    scoreAwardBounds: scoreEvidence.scoreAwardBounds,
    assetEvidence,
  });
  if (
    replay.readinessReport.status !== "ready" ||
    replay.readinessReport.blockers.length !== 0 ||
    graph.executionReadiness.status !== "ready" ||
    moduleResolution.status !== "ready" ||
    moduleResolution.blockers.length !== 0
  )
    throw new Error("Batch 3 modular evidence requires a ready Graph 1.4");
  if (!sameCanonical(moduleResolution, replay.readinessReport))
    throw new Error("module resolution replay drift");
  if (!sameCanonical(graph, replay.graph))
    throw new Error("resolved Graph 1.4 replay drift");

  const expectedCatalog = generateBrowserRuntimeCatalogIdentityV14(
    replay.graph,
    registry,
  );
  if (!sameCanonical(moduleCatalog, expectedCatalog))
    throw new Error("module catalog identity replay drift");

  return Object.freeze({
    assembly,
    scoreEvidence,
    moduleResolution,
    graph,
    moduleCatalog,
  });
}
