import { describe, expect, it } from "vitest";

import { createBatch3ProductionRegistry } from "../../src/modules/batch3-production-library.js";
import { sha256CanonicalJson } from "../../src/modules/game-module-execution-contract.js";
import {
  generateBrowserRuntimeCatalogIdentityV14,
  generateBrowserRuntimeCatalogV14,
} from "../../src/modules/game-module-runtime-catalog-generator.js";
import { BrowserRuntimeCatalogIdentityV14Schema } from "../../src/modules/game-module-runtime-catalog-identity-v14.js";
import type { ResolvedModuleGraphV14 } from "../../src/modules/game-module-resolver-v14.js";

async function fixture() {
  const registry = await createBatch3ProductionRegistry();
  const registration = registry.findForGraphV14("scoring.ledger", "1.0.0")[0]!;
  const handle = registration.executableHandle!;
  const artifact = registration.artifactIdentity!;
  const entryEvidenceId = sha256CanonicalJson({
    moduleId: registration.manifest.moduleId,
    version: registration.manifest.version,
    manifestSchemaVersion: registration.manifest.schemaVersion,
    factoryContextVersion: registration.manifest.schemaVersion,
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
        instanceId: "ledger-one",
        moduleId: registration.manifest.moduleId,
        version: registration.manifest.version,
        implementationId: handle.implementationId,
        manifestSchemaVersion: registration.manifest.schemaVersion,
        factoryContextVersion: registration.manifest.schemaVersion,
        artifactIdentity: artifact,
        catalogEntryEvidenceId: entryEvidenceId,
      },
      {
        instanceId: "ledger-two",
        moduleId: registration.manifest.moduleId,
        version: registration.manifest.version,
        implementationId: handle.implementationId,
        manifestSchemaVersion: registration.manifest.schemaVersion,
        factoryContextVersion: registration.manifest.schemaVersion,
        artifactIdentity: artifact,
        catalogEntryEvidenceId: entryEvidenceId,
      },
    ],
  } as unknown as ResolvedModuleGraphV14;
  return { graph, registry };
}

describe("Graph 1.4 runtime catalog identity", () => {
  it("emits deterministic JSON-safe unique registration evidence", async () => {
    const { graph, registry } = await fixture();
    const first = generateBrowserRuntimeCatalogIdentityV14(graph, registry);
    const second = generateBrowserRuntimeCatalogIdentityV14(graph, registry);

    expect(second).toEqual(first);
    expect(first.entries).toHaveLength(1);
    expect(first.entries[0]).toMatchObject({
      moduleId: "scoring.ledger",
      version: "1.0.0",
      manifestSchemaVersion: "1.4.0",
      factoryContextVersion: "1.4.0",
    });
    expect(first.catalogIdentityEvidenceId).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.parse(JSON.stringify(first))).toEqual(first);
    const executable = generateBrowserRuntimeCatalogV14(graph, registry);
    expect(executable.findForGraph(graph, "ledger-one")).toBe(
      executable.findForGraph(graph, "ledger-two"),
    );
  });

  it("rejects blocked graphs and catalog entry drift", async () => {
    const { graph, registry } = await fixture();
    expect(() =>
      generateBrowserRuntimeCatalogIdentityV14(
        {
          ...graph,
          executionReadiness: {
            status: "blocked",
            evidenceId: "c".repeat(64),
          },
        } as ResolvedModuleGraphV14,
        registry,
      ),
    ).toThrow(/ready Graph 1.4/);
    expect(() =>
      generateBrowserRuntimeCatalogIdentityV14(
        {
          ...graph,
          modules: [
            { ...graph.modules[0]!, catalogEntryEvidenceId: "d".repeat(64) },
          ],
        } as ResolvedModuleGraphV14,
        registry,
      ),
    ).toThrow(/identity drift/);
  });

  it("rejects executable material and context drift in the data schema", () => {
    expect(
      BrowserRuntimeCatalogIdentityV14Schema.safeParse({
        schemaVersion: "1.0.0",
        graphVersion: "1.4.0",
        graphReadinessEvidenceId: "a".repeat(64),
        catalogEvidenceId: "b".repeat(64),
        entries: [
          {
            moduleId: "scoring.ledger",
            version: "1.0.0",
            manifestSchemaVersion: "1.4.0",
            factoryContextVersion: "1.3.0",
            envelopeSha256: "c".repeat(64),
            implementationId: "scoring.ledger.v1",
            exportName: "create",
            exportKind: "lifecycle-create-v1",
            outputBundleSha256: "d".repeat(64),
            entryEvidenceId: "e".repeat(64),
            executable: () => undefined,
          },
        ],
        catalogIdentityEvidenceId: "f".repeat(64),
      }).success,
    ).toBe(false);
  });
});
