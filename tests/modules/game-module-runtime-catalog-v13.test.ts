import { describe, expect, it } from "vitest";

import { createBatch1ProductionRegistry } from "../../src/modules/batch1-gameplay-library.js";
import {
  BATCH1_VERTICAL_SLICE_ASSEMBLY,
  BATCH1_VERTICAL_SLICE_ASSET_EVIDENCE,
} from "../../src/modules/batch1-vertical-slice.js";
import { generateBrowserRuntimeCatalogV13 } from "../../src/modules/game-module-runtime-catalog-generator.js";
import { BrowserGameModuleRuntimeCatalogV13 } from "../../src/modules/game-module-runtime-catalog.js";
import {
  resolveGameAssemblyV13,
  type ResolvedModuleGraphV13,
} from "../../src/modules/game-module-resolver.js";

async function fixture() {
  const registry = await createBatch1ProductionRegistry();
  const assembly = {
    ...structuredClone(BATCH1_VERTICAL_SLICE_ASSEMBLY),
    schemaVersion: "1.2.0",
    effectApplicationBindings: [],
    pickupEffectPlanSelections: [],
  };
  const graph = resolveGameAssemblyV13(
    assembly,
    registry,
    BATCH1_VERTICAL_SLICE_ASSET_EVIDENCE,
  ).graph;
  return { registry, graph };
}

describe("Graph 1.3 generated browser catalog", () => {
  it("rejects a runtime catalog entry with an unreviewed manifest version", () => {
    expect(
      () =>
        new BrowserGameModuleRuntimeCatalogV13({
          catalogEvidenceId: "a".repeat(64),
          entries: [
            {
              moduleId: "test.drift",
              version: "1.0.0",
              envelopeSha256: "b".repeat(64),
              implementationId: "test.drift.v1",
              manifestSchemaVersion: "1.4.0",
              exportKind: "lifecycle-create-v1",
              entryEvidenceId: "c".repeat(64),
              executable: () => ({}),
            },
          ],
        } as unknown as ConstructorParameters<
          typeof BrowserGameModuleRuntimeCatalogV13
        >[0]),
    ).toThrow(/invalid Graph 1.3 catalog entry/);
  });

  it("generates exact entries for an unchanged Manifest 1.2 mixed graph", async () => {
    const { registry, graph } = await fixture();
    expect(graph.executionReadiness.status).toBe("ready");
    expect(
      graph.modules.every(
        (module) =>
          module.manifestSchemaVersion === "1.2.0" &&
          module.factoryContextVersion === "1.2.0",
      ),
    ).toBe(true);
    const catalog = generateBrowserRuntimeCatalogV13(graph, registry);
    for (const module of graph.modules) {
      expect(catalog.findForGraph(graph, module.instanceId)).toMatchObject({
        moduleId: module.moduleId,
        version: module.version,
        manifestSchemaVersion: "1.2.0",
        entryEvidenceId: module.catalogEntryEvidenceId,
      });
    }
  });

  it("rejects blocked generation and every browser boundary identity drift", async () => {
    const { registry, graph } = await fixture();
    const catalog = generateBrowserRuntimeCatalogV13(graph, registry);
    const blocked = {
      ...structuredClone(graph),
      executionReadiness: {
        ...structuredClone(graph.executionReadiness),
        status: "blocked" as const,
      },
    };
    expect(() =>
      generateBrowserRuntimeCatalogV13(
        blocked as ResolvedModuleGraphV13,
        registry,
      ),
    ).toThrow(/blocked Graph 1.3/);

    const drift = {
      ...structuredClone(graph),
      modules: graph.modules.map((module, index) =>
        index === 0
          ? {
              ...structuredClone(module),
              manifestSchemaVersion: "1.3.0" as const,
            }
          : structuredClone(module),
      ),
    };
    expect(() =>
      catalog.findForGraph(
        drift as ResolvedModuleGraphV13,
        drift.modules[0]!.instanceId,
      ),
    ).toThrow(/catalog drift/);

    for (const readinessEvidenceId of ["", "g".repeat(64)]) {
      const missingReadiness = {
        ...structuredClone(graph),
        executionReadiness: {
          status: "ready" as const,
          evidenceId: readinessEvidenceId,
        },
      };
      expect(() =>
        catalog.findForGraph(
          missingReadiness as ResolvedModuleGraphV13,
          graph.modules[0]!.instanceId,
        ),
      ).toThrow(/readiness\/catalog evidence mismatch/);
    }

    const graphVersionDrift = {
      ...structuredClone(graph),
      graphVersion: "1.2.0",
    };
    expect(() =>
      catalog.findForGraph(
        graphVersionDrift as ResolvedModuleGraphV13,
        graph.modules[0]!.instanceId,
      ),
    ).toThrow(/readiness\/catalog evidence mismatch/);

    const catalogEvidenceDrift = {
      ...structuredClone(graph),
      catalogEvidenceId: "9".repeat(64),
    };
    expect(() =>
      catalog.findForGraph(
        catalogEvidenceDrift as ResolvedModuleGraphV13,
        graph.modules[0]!.instanceId,
      ),
    ).toThrow(/readiness\/catalog evidence mismatch/);

    const entryEvidenceDrift = {
      ...structuredClone(graph),
      modules: graph.modules.map((module, index) =>
        index === 0
          ? {
              ...structuredClone(module),
              catalogEntryEvidenceId: "8".repeat(64),
            }
          : structuredClone(module),
      ),
    };
    expect(() =>
      catalog.findForGraph(
        entryEvidenceDrift as ResolvedModuleGraphV13,
        graph.modules[0]!.instanceId,
      ),
    ).toThrow(/catalog drift/);
  });
});
