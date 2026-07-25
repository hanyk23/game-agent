import { z } from "zod";

import { describe, expect, it } from "vitest";

import { BATCH1_MODULE_DEFINITIONS } from "../../src/modules/batch1-gameplay-library.js";
import { GameModuleManifestV14Schema } from "../../src/modules/game-module-contract.js";
import {
  createModuleArtifactHashDescriptor,
  sha256CanonicalJson,
} from "../../src/modules/game-module-execution-contract.js";
import { TrustedGameModuleExecutableLoader } from "../../src/modules/game-module-executable-loader.js";
import { GameModuleRegistry } from "../../src/modules/game-module-registry.js";
import type { ResolvedModuleGraphV14 } from "../../src/modules/game-module-resolver-v14.js";
import { generateBrowserRuntimeCatalogV14 } from "../../src/modules/game-module-runtime-catalog-generator.js";

const configurationDescriptor = {
  descriptorVersion: "1.0.0",
  schemaId: "test.runtime-v14.config",
  dialect: "json-schema-2020-12-subset",
  schema: { type: "object", additionalProperties: false },
} as const;

const reservationDescriptor = {
  descriptorVersion: "1.0.0",
  reservationId: "test.runtime-v14.resources",
  strategy: "constant",
  fields: [],
} as const;

function manifestV14() {
  return GameModuleManifestV14Schema.parse({
    ...structuredClone(BATCH1_MODULE_DEFINITIONS[0]!.manifest),
    schemaVersion: "1.4.0",
    moduleId: "test.runtime-v14",
    implementationId: "test.runtime-v14.v1",
    configurationSchemaId: configurationDescriptor.schemaId,
    provides: [],
    requires: [],
    inputPorts: [],
    outputPorts: [],
    dependencies: [],
    assetRequirements: [],
    conflicts: [],
    exclusiveOwnership: [],
    resources: {
      activeEntities: 0,
      activeProjectiles: 0,
      spawnsPerSecond: 0,
      timers: 0,
    },
    runtimeLeases: { startLeases: 0, instanceLeases: 0, graphLeases: 0 },
    runtimeContract: {
      update: null,
      timerSlots: { slotGroupId: "main" },
      inputRegistrations: [],
      observationReaders: [],
      contactCommit: null,
    },
    actorSnapshotReads: [],
    entityChannelReads: [],
    projectileChannelConsumer: null,
    attackChannel: null,
    preparedEffectCommit: null,
    modifierTargets: [],
    pickupEffectPlanTransform: null,
    actorRootProducer: null,
    actorRootConsumers: [],
    hostileAttackChannel: null,
    aggregateResourceClaims: [],
    actorSetDamageSink: null,
    actorRootContactConsumer: null,
    outcomeCommit: null,
  });
}

async function admittedV14() {
  const manifest = manifestV14();
  const implementationBundle = new TextEncoder().encode(
    "export function create(){return Object.freeze({});}",
  );
  const dependencyLockIdentity = new TextEncoder().encode("lock-v14");
  const toolchainIdentity = new TextEncoder().encode("toolchain-v14");
  const artifact = createModuleArtifactHashDescriptor({
    manifest,
    configurationDescriptor,
    reservationDescriptor,
    implementationBundle,
    dependencyLockIdentity,
    toolchainIdentity,
  });
  const handle = await new TrustedGameModuleExecutableLoader().admit({
    generatedOutput: implementationBundle,
    expectedOutputSha256: artifact.implementationBundleSha256,
    implementationId: manifest.implementationId,
    exportName: "create",
    exportKind: "lifecycle-create-v1",
    sourceBundleSha256: artifact.implementationBundleSha256,
    manifestSha256: artifact.manifestSha256,
    dependencyLockSha256: artifact.dependencyLockSha256,
    toolchainIdentitySha256: artifact.toolchainIdentitySha256,
  });
  const registry = new GameModuleRegistry();
  registry.registerProductionV14({
    manifest,
    configurationDescriptor,
    configurationSchema: z.strictObject({}),
    reservationDescriptor,
    reservationEvaluator: () => ({
      activeEntities: 0,
      activeProjectiles: 0,
      spawnsPerSecond: 0,
      timers: 0,
    }),
    implementationBundle,
    dependencyLockIdentity,
    toolchainIdentity,
    expectedArtifact: artifact,
    executableHandle: handle,
  });
  return { artifact, handle, manifest, registry };
}

describe("Manifest/Graph 1.4 production registry and catalog generation", () => {
  it("keeps V1.4 registration out of legacy lookup while exact V1.4 lookup succeeds", async () => {
    const { artifact, manifest, registry } = await admittedV14();
    expect(registry.find(manifest.moduleId, manifest.version)).toEqual([]);
    expect(registry.list()).toEqual([]);
    expect(
      registry.findExactProduction(
        manifest.moduleId,
        manifest.version,
        artifact.envelopeSha256,
      ),
    ).toBeUndefined();
    expect(
      registry.findExactProductionV14(
        manifest.moduleId,
        manifest.version,
        artifact.envelopeSha256,
      )?.manifest.schemaVersion,
    ).toBe("1.4.0");
    expect(() =>
      new GameModuleRegistry().registerProductionV13({
        manifest,
      } as never),
    ).toThrow();
  });

  it("generates only the exact ready Graph 1.4 catalog identity", async () => {
    const { artifact, handle, manifest, registry } = await admittedV14();
    const entryEvidenceId = sha256CanonicalJson({
      moduleId: manifest.moduleId,
      version: manifest.version,
      manifestSchemaVersion: "1.4.0",
      factoryContextVersion: "1.4.0",
      envelopeSha256: artifact.envelopeSha256,
      implementationId: handle.implementationId,
      exportName: handle.exportName,
      exportKind: handle.exportKind,
      outputBundleSha256: handle.outputBundleSha256,
    });
    const graph = {
      graphVersion: "1.4.0",
      executionReadiness: {
        status: "ready",
        evidenceId: "a".repeat(64),
      },
      catalogEvidenceId: "b".repeat(64),
      modules: [
        {
          instanceId: "runtime-v14",
          moduleId: manifest.moduleId,
          version: manifest.version,
          implementationId: manifest.implementationId,
          manifestSchemaVersion: "1.4.0",
          factoryContextVersion: "1.4.0",
          artifactIdentity: artifact,
          catalogEntryEvidenceId: entryEvidenceId,
        },
      ],
    } as unknown as ResolvedModuleGraphV14;
    const catalog = generateBrowserRuntimeCatalogV14(graph, registry);
    expect(catalog.findForGraph(graph, "runtime-v14")).toMatchObject({
      manifestSchemaVersion: "1.4.0",
      factoryContextVersion: "1.4.0",
      entryEvidenceId,
    });
    expect(() =>
      generateBrowserRuntimeCatalogV14(
        {
          ...graph,
          executionReadiness: {
            status: "blocked",
            evidenceId: "c".repeat(64),
          },
        } as ResolvedModuleGraphV14,
        registry,
      ),
    ).toThrow(/blocked Graph 1.4/);
    expect(() =>
      generateBrowserRuntimeCatalogV14(
        {
          ...graph,
          modules: [{ ...graph.modules[0]!, factoryContextVersion: "1.3.0" }],
        } as ResolvedModuleGraphV14,
        registry,
      ),
    ).toThrow(/missing admitted Graph 1.4 executable/);
  });
});
