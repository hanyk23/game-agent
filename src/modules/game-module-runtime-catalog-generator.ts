import { mkdir, open, chmod, lstat, readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

import type { GameModuleRegistry } from "./game-module-registry.js";
import type {
  ResolvedModuleGraphV12,
  ResolvedModuleGraphV13,
} from "./game-module-resolver.js";
import type { ResolvedModuleGraphV14 } from "./game-module-resolver-v14.js";
import {
  BrowserGameModuleRuntimeCatalogV12,
  BrowserGameModuleRuntimeCatalogV13,
  BrowserGameModuleRuntimeCatalogV14,
  type BrowserRuntimeCatalogEntryV12,
  type BrowserRuntimeCatalogEntryV13,
  type BrowserRuntimeCatalogEntryV14,
} from "./game-module-runtime-catalog.js";
import { sha256CanonicalJson } from "./game-module-execution-contract.js";

/** Generates the immutable assembly catalog from the same loader-owned handles. */
export function generateBrowserRuntimeCatalogV12(
  graph: ResolvedModuleGraphV12,
  registry: GameModuleRegistry,
): BrowserGameModuleRuntimeCatalogV12 {
  if (graph.executionReadiness.status !== "ready")
    throw new Error("blocked graph cannot generate a runtime catalog");
  const entries: BrowserRuntimeCatalogEntryV12[] = [];
  for (const module of graph.modules) {
    const registration = registry.findExactProduction(
      module.moduleId,
      module.version,
      module.artifactIdentity?.envelopeSha256 ?? "",
    );
    const handle = registration?.executableHandle;
    if (
      registration?.manifest.schemaVersion !== "1.2.0" ||
      handle === undefined ||
      handle.exportKind === "pickup-effect-plan-transform-v1" ||
      module.catalogEntryEvidenceId === undefined ||
      module.artifactIdentity === undefined
    ) {
      throw new Error(`missing admitted executable for ${module.instanceId}`);
    }
    const entryEvidenceId = sha256CanonicalJson({
      moduleId: module.moduleId,
      version: module.version,
      envelopeSha256: module.artifactIdentity.envelopeSha256,
      implementationId: handle.implementationId,
      exportName: handle.exportName,
      exportKind: handle.exportKind,
      outputBundleSha256: handle.outputBundleSha256,
    });
    if (entryEvidenceId !== module.catalogEntryEvidenceId)
      throw new Error(`catalog entry evidence drift for ${module.instanceId}`);
    entries.push(
      Object.freeze({
        moduleId: module.moduleId,
        version: module.version,
        envelopeSha256: module.artifactIdentity.envelopeSha256,
        implementationId: handle.implementationId,
        exportKind: handle.exportKind,
        entryEvidenceId,
        executable: handle.loadedExport,
      }),
    );
  }
  return new BrowserGameModuleRuntimeCatalogV12({
    catalogEvidenceId: graph.catalogEvidenceId,
    entries,
  });
}

/** Generates the version-explicit mixed Manifest 1.2/1.3 Graph 1.3 catalog. */
export function generateBrowserRuntimeCatalogV13(
  graph: ResolvedModuleGraphV13,
  registry: GameModuleRegistry,
): BrowserGameModuleRuntimeCatalogV13 {
  if (graph.executionReadiness.status !== "ready")
    throw new Error("blocked Graph 1.3 cannot generate a runtime catalog");
  const entries: BrowserRuntimeCatalogEntryV13[] = [];
  for (const module of graph.modules) {
    const registration = registry.findExactProduction(
      module.moduleId,
      module.version,
      module.artifactIdentity?.envelopeSha256 ?? "",
    );
    const handle = registration?.executableHandle;
    if (
      registration === undefined ||
      (registration.manifest.schemaVersion !== "1.2.0" &&
        registration.manifest.schemaVersion !== "1.3.0") ||
      registration.manifest.schemaVersion !== module.manifestSchemaVersion ||
      handle === undefined ||
      module.catalogEntryEvidenceId === undefined ||
      module.artifactIdentity === undefined
    )
      throw new Error(
        `missing admitted Graph 1.3 executable for ${module.instanceId}`,
      );
    const entryEvidenceId = sha256CanonicalJson({
      moduleId: module.moduleId,
      version: module.version,
      manifestSchemaVersion: module.manifestSchemaVersion,
      factoryContextVersion: module.factoryContextVersion,
      envelopeSha256: module.artifactIdentity.envelopeSha256,
      implementationId: handle.implementationId,
      exportName: handle.exportName,
      exportKind: handle.exportKind,
      outputBundleSha256: handle.outputBundleSha256,
    });
    if (entryEvidenceId !== module.catalogEntryEvidenceId)
      throw new Error(
        `Graph 1.3 catalog entry evidence drift for ${module.instanceId}`,
      );
    entries.push(
      Object.freeze({
        moduleId: module.moduleId,
        version: module.version,
        manifestSchemaVersion: module.manifestSchemaVersion,
        envelopeSha256: module.artifactIdentity.envelopeSha256,
        implementationId: handle.implementationId,
        exportKind: handle.exportKind,
        entryEvidenceId,
        executable: handle.loadedExport,
      }),
    );
  }
  return new BrowserGameModuleRuntimeCatalogV13({
    catalogEvidenceId: graph.catalogEvidenceId,
    entries,
  });
}

/** Generates the exact-version mixed Manifest 1.2/1.3/1.4 Graph 1.4 catalog. */
export function generateBrowserRuntimeCatalogV14(
  graph: ResolvedModuleGraphV14,
  registry: GameModuleRegistry,
): BrowserGameModuleRuntimeCatalogV14 {
  if (graph.executionReadiness.status !== "ready")
    throw new Error("blocked Graph 1.4 cannot generate a runtime catalog");
  const entries: BrowserRuntimeCatalogEntryV14[] = [];
  for (const module of graph.modules) {
    const registration = registry.findExactProductionV14(
      module.moduleId,
      module.version,
      module.artifactIdentity?.envelopeSha256 ?? "",
    );
    const handle = registration?.executableHandle;
    if (
      registration === undefined ||
      !["1.2.0", "1.3.0", "1.4.0"].includes(
        registration.manifest.schemaVersion,
      ) ||
      registration.manifest.schemaVersion !== module.manifestSchemaVersion ||
      module.factoryContextVersion !== module.manifestSchemaVersion ||
      handle === undefined ||
      module.catalogEntryEvidenceId === undefined ||
      module.artifactIdentity === undefined
    )
      throw new Error(
        `missing admitted Graph 1.4 executable for ${module.instanceId}`,
      );
    const entryEvidenceId = sha256CanonicalJson({
      moduleId: module.moduleId,
      version: module.version,
      manifestSchemaVersion: module.manifestSchemaVersion,
      factoryContextVersion: module.factoryContextVersion,
      envelopeSha256: module.artifactIdentity.envelopeSha256,
      implementationId: handle.implementationId,
      exportName: handle.exportName,
      exportKind: handle.exportKind,
      outputBundleSha256: handle.outputBundleSha256,
    });
    if (entryEvidenceId !== module.catalogEntryEvidenceId)
      throw new Error(
        `Graph 1.4 catalog entry evidence drift for ${module.instanceId}`,
      );
    entries.push(
      Object.freeze({
        moduleId: module.moduleId,
        version: module.version,
        manifestSchemaVersion: module.manifestSchemaVersion,
        factoryContextVersion: module.factoryContextVersion,
        envelopeSha256: module.artifactIdentity.envelopeSha256,
        implementationId: handle.implementationId,
        exportKind: handle.exportKind,
        entryEvidenceId,
        executable: handle.loadedExport,
      }),
    );
  }
  return new BrowserGameModuleRuntimeCatalogV14({
    catalogEvidenceId: graph.catalogEvidenceId,
    entries,
  });
}

/** Exclusive content-addressed write used before isolated build execution. */
export async function writeContentAddressedBuildInput(
  rootDirectory: string,
  sha256: string,
  bytes: Uint8Array,
): Promise<string> {
  if (!/^[a-f0-9]{64}$/.test(sha256))
    throw new Error("invalid content address");
  await mkdir(rootDirectory, { recursive: true });
  const target = path.join(rootDirectory, `${sha256}.mjs`);
  let handle;
  try {
    handle = await open(target, "wx", 0o400);
    await handle.writeFile(bytes);
    await handle.sync();
  } catch (error) {
    throw new Error(
      `content-addressed build input already exists or is unsafe: ${target}`,
      { cause: error },
    );
  } finally {
    await handle?.close();
  }
  const stats = await lstat(target);
  if (!stats.isFile() || stats.isSymbolicLink())
    throw new Error("content-addressed input is not a regular file");
  const actual = createHash("sha256")
    .update(await readFile(target))
    .digest("hex");
  if (actual !== sha256)
    throw new Error("content-addressed post-write verification failed");
  await chmod(target, 0o400);
  return target;
}
