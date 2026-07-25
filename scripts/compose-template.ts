import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { demoShooterGameSpec } from "../game-template/vertical-shooter/spec/demo-spec.js";
import { composeShooterGame } from "../src/runtime/shooter-game-composer.js";
import {
  createBatch1ProductionRegistry,
  BATCH1_MODULE_DEFINITIONS,
} from "../src/modules/batch1-gameplay-library.js";
import {
  BATCH1_VERTICAL_SLICE_ASSEMBLY,
  BATCH1_VERTICAL_SLICE_ASSET_EVIDENCE,
} from "../src/modules/batch1-vertical-slice.js";
import { resolveGameAssemblyV12 } from "../src/modules/game-module-resolver.js";
import { resolveBatch2VerticalSlice } from "../src/modules/batch2-vertical-slice.js";
import { createBatch2CoreProductionRegistry } from "../src/modules/batch2-core-library.js";
import { BATCH2_CONTROL_DEFINITIONS } from "../src/modules/batch2-gameplay-library.js";
import { BATCH2_DELIVERY_DEFINITIONS } from "../src/modules/batch2-delivery-library.js";
import { BATCH2_DEFENSE_DEFINITIONS } from "../src/modules/batch2-defense-library.js";
import { BATCH2_PROGRESSION_COMPAT_DEFINITIONS } from "../src/modules/batch2-progression-compat-library.js";
import { resolveBatch2FormationMatrix } from "../src/modules/batch2-formation-matrix.js";
import { resolveBatch2ProgressionSlice } from "../src/modules/batch2-progression-slice.js";
import { resolveBatch2NearestTargetingSlice } from "../src/modules/batch2-nearest-targeting-slice.js";
import { resolveBatch2DefenseVerticalSlice } from "../src/modules/batch2-defense-vertical-slice.js";
import { sha256CanonicalJson } from "../src/modules/game-module-execution-contract.js";

const projectDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const outputPath = path.join(
  projectDirectory,
  "game-template",
  "vertical-shooter",
  "src",
  "generated",
  "runtime-config.json",
);
const runtimeConfig = composeShooterGame(demoShooterGameSpec, {
  resourceProfile: "balanced",
});
const batch1Registry = await createBatch1ProductionRegistry();
const batch1Graph = resolveGameAssemblyV12(
  BATCH1_VERTICAL_SLICE_ASSEMBLY,
  batch1Registry,
  BATCH1_VERTICAL_SLICE_ASSET_EVIDENCE,
).graph;
const executableDeclarations: string[] = [];
const catalogEntries = batch1Graph.modules.map((module, index) => {
  const definition = BATCH1_MODULE_DEFINITIONS.find(
    (candidate) => candidate.manifest.moduleId === module.moduleId,
  );
  const registration = batch1Registry.findExactProduction(
    module.moduleId,
    module.version,
    module.artifactIdentity!.envelopeSha256,
  );
  const handle = registration?.executableHandle;
  if (definition === undefined || handle === undefined)
    throw new Error(`missing Batch 1 executable: ${module.instanceId}`);
  const identifier = `batch1Executable${index}`;
  executableDeclarations.push(
    definition.implementationSource.replace(
      `export function ${definition.exportName}`,
      `function ${identifier}`,
    ),
  );
  return {
    moduleId: module.moduleId,
    version: module.version,
    envelopeSha256: module.artifactIdentity!.envelopeSha256,
    implementationId: module.implementationId,
    exportKind: handle.exportKind,
    entryEvidenceId: sha256CanonicalJson({
      moduleId: module.moduleId,
      version: module.version,
      envelopeSha256: module.artifactIdentity!.envelopeSha256,
      implementationId: handle.implementationId,
      exportName: handle.exportName,
      exportKind: handle.exportKind,
      outputBundleSha256: handle.outputBundleSha256,
    }),
    executableIdentifier: identifier,
  };
});
const batch1OutputPath = path.join(
  projectDirectory,
  "game-template",
  "vertical-shooter",
  "src",
  "generated",
  "batch1-runtime.ts",
);
const batch2Registry = await createBatch2CoreProductionRegistry();
const batch2Graph = (await resolveBatch2VerticalSlice()).graph;
const batch2Definitions = [
  ...BATCH1_MODULE_DEFINITIONS,
  ...BATCH2_CONTROL_DEFINITIONS,
  ...BATCH2_DELIVERY_DEFINITIONS,
  ...BATCH2_DEFENSE_DEFINITIONS,
  ...BATCH2_PROGRESSION_COMPAT_DEFINITIONS,
];
const batch2ExecutableDeclarations: string[] = [];
const batch2CatalogEntries = batch2Definitions.map((definition, index) => {
  const registrationCandidate = batch2Registry.find(
    definition.manifest.moduleId,
    definition.manifest.version,
  )[0]!;
  const registration = batch2Registry.findExactProduction(
    definition.manifest.moduleId,
    definition.manifest.version,
    registrationCandidate.artifactIdentity!.envelopeSha256,
  );
  const handle = registration?.executableHandle;
  if (registration === undefined || handle === undefined)
    throw new Error(
      `missing Batch 2 executable: ${definition.manifest.moduleId}@${definition.manifest.version}`,
    );
  const identifier = `batch2Executable${index}`;
  batch2ExecutableDeclarations.push(
    definition.implementationSource.replace(
      `export function ${definition.exportName}`,
      `export function ${identifier}`,
    ),
  );
  return {
    moduleId: definition.manifest.moduleId,
    version: definition.manifest.version,
    envelopeSha256: registration.artifactIdentity!.envelopeSha256,
    implementationId: definition.manifest.implementationId,
    manifestSchemaVersion: definition.manifest.schemaVersion,
    exportKind: handle.exportKind,
    entryEvidenceId: sha256CanonicalJson({
      moduleId: definition.manifest.moduleId,
      version: definition.manifest.version,
      manifestSchemaVersion: definition.manifest.schemaVersion,
      factoryContextVersion: definition.manifest.schemaVersion,
      envelopeSha256: registration.artifactIdentity!.envelopeSha256,
      implementationId: handle.implementationId,
      exportName: handle.exportName,
      exportKind: handle.exportKind,
      outputBundleSha256: handle.outputBundleSha256,
    }),
    executableIdentifier: identifier,
  };
});
const batch2FormationGraphs = (await resolveBatch2FormationMatrix()).map(
  ({ graph }) => graph,
);
const batch2ProgressionGraph = (await resolveBatch2ProgressionSlice()).graph;
const batch2NearestGraph = (await resolveBatch2NearestTargetingSlice()).graph;
const batch2DefenseGraphs = await Promise.all(
  [125, 0].map(
    async (durationMs) =>
      (await resolveBatch2DefenseVerticalSlice(durationMs)).graph,
  ),
);
const batch2OutputPath = path.join(
  projectDirectory,
  "game-template",
  "vertical-shooter",
  "src",
  "generated",
  "batch2-runtime.ts",
);
const batch2FormationsOutputPath = path.join(
  projectDirectory,
  "game-template",
  "vertical-shooter",
  "src",
  "generated",
  "batch2-formations.ts",
);
const batch2ProgressionOutputPath = path.join(
  projectDirectory,
  "game-template",
  "vertical-shooter",
  "src",
  "generated",
  "batch2-progression.ts",
);
const batch2NearestOutputPath = path.join(
  projectDirectory,
  "game-template",
  "vertical-shooter",
  "src",
  "generated",
  "batch2-nearest.ts",
);
const batch2DefenseOutputPath = path.join(
  projectDirectory,
  "game-template",
  "vertical-shooter",
  "src",
  "generated",
  "batch2-defense.ts",
);

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `${JSON.stringify(runtimeConfig, null, 2)}\n`,
  "utf8",
);
await writeFile(
  batch2OutputPath,
  `// @ts-nocheck -- generated from loader-admitted self-contained JavaScript bytes\nimport { BrowserGameModuleRuntimeCatalogV13 } from "../../../../src/modules/game-module-runtime-catalog.js";\nimport type { ResolvedModuleGraphV13 } from "../../../../src/modules/game-module-resolver.js";\n\n${batch2ExecutableDeclarations.join("\n\n")}\n\nexport const batch2ResolvedGraph = ${JSON.stringify(batch2Graph, null, 2)} as unknown as ResolvedModuleGraphV13;\n\nexport const batch2RuntimeCatalog = new BrowserGameModuleRuntimeCatalogV13({\n  catalogEvidenceId: ${JSON.stringify(batch2Graph.catalogEvidenceId)},\n  entries: [\n${batch2CatalogEntries.map((entry) => `    { moduleId: ${JSON.stringify(entry.moduleId)}, version: ${JSON.stringify(entry.version)}, envelopeSha256: ${JSON.stringify(entry.envelopeSha256)}, implementationId: ${JSON.stringify(entry.implementationId)}, manifestSchemaVersion: ${JSON.stringify(entry.manifestSchemaVersion)}, exportKind: ${JSON.stringify(entry.exportKind)}, entryEvidenceId: ${JSON.stringify(entry.entryEvidenceId)}, executable: ${entry.executableIdentifier} },`).join("\n")}\n  ],\n});\n`,
  "utf8",
);
await writeFile(
  batch2FormationsOutputPath,
  `// @ts-nocheck -- generated from production-ready Graph 1.3 artifacts\nimport { BrowserGameModuleRuntimeCatalogV13 } from "../../../../src/modules/game-module-runtime-catalog.js";\nimport type { ResolvedModuleGraphV13 } from "../../../../src/modules/game-module-resolver.js";\nimport * as executables from "./batch2-runtime.js";\n\nexport const batch2FormationGraphs = ${JSON.stringify(batch2FormationGraphs, null, 2)} as unknown as readonly ResolvedModuleGraphV13[];\n\nconst entries = [\n${batch2CatalogEntries.map((entry) => `  { moduleId: ${JSON.stringify(entry.moduleId)}, version: ${JSON.stringify(entry.version)}, envelopeSha256: ${JSON.stringify(entry.envelopeSha256)}, implementationId: ${JSON.stringify(entry.implementationId)}, manifestSchemaVersion: ${JSON.stringify(entry.manifestSchemaVersion)}, exportKind: ${JSON.stringify(entry.exportKind)}, entryEvidenceId: ${JSON.stringify(entry.entryEvidenceId)}, executable: executables.${entry.executableIdentifier} },`).join("\n")}\n];\n\nexport const batch2FormationRuntimeCatalogs = batch2FormationGraphs.map((graph) => new BrowserGameModuleRuntimeCatalogV13({ catalogEvidenceId: graph.catalogEvidenceId, entries }));\n`,
  "utf8",
);
await writeFile(
  batch2ProgressionOutputPath,
  `// @ts-nocheck -- generated from one production-ready pickup/modifier Graph 1.3 artifact
import { BrowserGameModuleRuntimeCatalogV13 } from "../../../../src/modules/game-module-runtime-catalog.js";
import type { ResolvedModuleGraphV13 } from "../../../../src/modules/game-module-resolver.js";
import * as executables from "./batch2-runtime.js";

export const batch2ProgressionGraph = ${JSON.stringify(batch2ProgressionGraph, null, 2)} as unknown as ResolvedModuleGraphV13;

const entries = [
${batch2CatalogEntries.map((entry) => `  { moduleId: ${JSON.stringify(entry.moduleId)}, version: ${JSON.stringify(entry.version)}, envelopeSha256: ${JSON.stringify(entry.envelopeSha256)}, implementationId: ${JSON.stringify(entry.implementationId)}, manifestSchemaVersion: ${JSON.stringify(entry.manifestSchemaVersion)}, exportKind: ${JSON.stringify(entry.exportKind)}, entryEvidenceId: ${JSON.stringify(entry.entryEvidenceId)}, executable: executables.${entry.executableIdentifier} },`).join("\n")}
];

export const batch2ProgressionRuntimeCatalog = new BrowserGameModuleRuntimeCatalogV13({ catalogEvidenceId: batch2ProgressionGraph.catalogEvidenceId, entries });
`,
  "utf8",
);
await writeFile(
  batch2NearestOutputPath,
  `// @ts-nocheck -- generated from one production-ready nearest-targeting Graph 1.3 artifact
import { BrowserGameModuleRuntimeCatalogV13 } from "../../../../src/modules/game-module-runtime-catalog.js";
import type { ResolvedModuleGraphV13 } from "../../../../src/modules/game-module-resolver.js";
import * as executables from "./batch2-runtime.js";

export const batch2NearestGraph = ${JSON.stringify(batch2NearestGraph, null, 2)} as unknown as ResolvedModuleGraphV13;

const entries = [
${batch2CatalogEntries.map((entry) => `  { moduleId: ${JSON.stringify(entry.moduleId)}, version: ${JSON.stringify(entry.version)}, envelopeSha256: ${JSON.stringify(entry.envelopeSha256)}, implementationId: ${JSON.stringify(entry.implementationId)}, manifestSchemaVersion: ${JSON.stringify(entry.manifestSchemaVersion)}, exportKind: ${JSON.stringify(entry.exportKind)}, entryEvidenceId: ${JSON.stringify(entry.entryEvidenceId)}, executable: executables.${entry.executableIdentifier} },`).join("\n")}
];

export const batch2NearestRuntimeCatalog = new BrowserGameModuleRuntimeCatalogV13({ catalogEvidenceId: batch2NearestGraph.catalogEvidenceId, entries });
`,
  "utf8",
);
await writeFile(
  batch2DefenseOutputPath,
  `// @ts-nocheck -- generated from production-ready defense Graph 1.3 artifacts
import { BrowserGameModuleRuntimeCatalogV13 } from "../../../../src/modules/game-module-runtime-catalog.js";
import type { ResolvedModuleGraphV13 } from "../../../../src/modules/game-module-resolver.js";
import * as executables from "./batch2-runtime.js";

export const batch2DefenseGraphs = ${JSON.stringify(batch2DefenseGraphs, null, 2)} as unknown as readonly [ResolvedModuleGraphV13, ResolvedModuleGraphV13];

const entries = [
${batch2CatalogEntries.map((entry) => `  { moduleId: ${JSON.stringify(entry.moduleId)}, version: ${JSON.stringify(entry.version)}, envelopeSha256: ${JSON.stringify(entry.envelopeSha256)}, implementationId: ${JSON.stringify(entry.implementationId)}, manifestSchemaVersion: ${JSON.stringify(entry.manifestSchemaVersion)}, exportKind: ${JSON.stringify(entry.exportKind)}, entryEvidenceId: ${JSON.stringify(entry.entryEvidenceId)}, executable: executables.${entry.executableIdentifier} },`).join("\n")}
];

export const batch2DefenseRuntimeCatalogs = batch2DefenseGraphs.map((graph) => new BrowserGameModuleRuntimeCatalogV13({
  catalogEvidenceId: graph.catalogEvidenceId,
  entries: entries.filter((entry) => graph.modules.some((module) => module.moduleId === entry.moduleId && module.version === entry.version && module.artifactIdentity?.envelopeSha256 === entry.envelopeSha256)),
})) as readonly [BrowserGameModuleRuntimeCatalogV13, BrowserGameModuleRuntimeCatalogV13];
`,
  "utf8",
);
await writeFile(
  batch1OutputPath,
  `// @ts-nocheck -- generated from loader-admitted self-contained JavaScript bytes\nimport { BrowserGameModuleRuntimeCatalogV12 } from "../../../../src/modules/game-module-runtime-catalog.js";\nimport type { ResolvedModuleGraphV12 } from "../../../../src/modules/game-module-resolver.js";\n\n${executableDeclarations.join("\n\n")}\n\nexport const batch1ResolvedGraph = ${JSON.stringify(batch1Graph, null, 2)} as unknown as ResolvedModuleGraphV12;\n\nexport const batch1RuntimeCatalog = new BrowserGameModuleRuntimeCatalogV12({\n  catalogEvidenceId: ${JSON.stringify(batch1Graph.catalogEvidenceId)},\n  entries: [\n${catalogEntries.map((entry) => `    { moduleId: ${JSON.stringify(entry.moduleId)}, version: ${JSON.stringify(entry.version)}, envelopeSha256: ${JSON.stringify(entry.envelopeSha256)}, implementationId: ${JSON.stringify(entry.implementationId)}, exportKind: ${JSON.stringify(entry.exportKind)}, entryEvidenceId: ${JSON.stringify(entry.entryEvidenceId)}, executable: ${entry.executableIdentifier} },`).join("\n")}\n  ],\n});\n`,
  "utf8",
);
process.stdout.write(
  `${JSON.stringify({
    status: "composed",
    resourceProfile: runtimeConfig.resourceBudget.profile,
    adjustmentCount: runtimeConfig.composition.budgetAdjustments.length,
    outputPath,
    batch1OutputPath,
    batch2OutputPath,
    batch2FormationsOutputPath,
    batch2ProgressionOutputPath,
    batch2NearestOutputPath,
    batch2DefenseOutputPath,
  })}\n`,
);
