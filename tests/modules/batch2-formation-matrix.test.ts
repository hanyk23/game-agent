import { describe, expect, it } from "vitest";

import {
  BATCH2_FORMATION_CASES,
  createBatch2FormationAssembly,
  resolveBatch2FormationMatrix,
} from "../../src/modules/batch2-formation-matrix.js";
import { createBatch2CoreProductionRegistry } from "../../src/modules/batch2-core-library.js";
import { generateBrowserRuntimeCatalogV13 } from "../../src/modules/game-module-runtime-catalog-generator.js";
import { ResolvedModuleGraphV13Schema } from "../../src/modules/game-module-resolver.js";

describe("Batch 2 production formation Graph 1.3 matrix", () => {
  it("contains every frozen delivery exactly once", () => {
    expect(BATCH2_FORMATION_CASES).toHaveLength(10);
    expect(
      new Set(BATCH2_FORMATION_CASES.map(({ caseId }) => caseId)).size,
    ).toBe(10);
    expect(BATCH2_FORMATION_CASES.map(({ moduleId }) => moduleId)).toEqual([
      "delivery.spread",
      "delivery.multi-shot",
      "delivery.pattern.radial",
      "delivery.pattern.spiral",
      "delivery.pattern.fan",
      "delivery.pattern.aimed",
      "delivery.pattern.wave",
      "delivery.pattern.rain",
      "delivery.pattern.rotating-ring",
      "delivery.pattern.burst",
    ]);
  });

  it("resolves each production formation as an independently ready graph", async () => {
    const results = await resolveBatch2FormationMatrix();
    expect(results).toHaveLength(BATCH2_FORMATION_CASES.length);

    for (const [index, result] of results.entries()) {
      const formation = BATCH2_FORMATION_CASES[index]!;
      const graph = result.graph;
      const delivery = graph.modules.find(
        ({ instanceId }) => instanceId === "delivery",
      );
      expect(graph.assemblyId).toBe(`batch2.formation-${formation.caseId}`);
      expect(graph.graphVersion).toBe("1.3.0");
      expect(graph.executionReadiness.status).toBe("ready");
      expect(result.readinessReport.blockers).toEqual([]);
      expect(delivery).toEqual(
        expect.objectContaining({
          moduleId: formation.moduleId,
          version: "1.0.0",
          configuration: formation.configuration,
          manifestSchemaVersion: "1.3.0",
          factoryContextVersion: "1.3.0",
        }),
      );
      expect(graph.attackChannels).toEqual([
        expect.objectContaining({
          attackChannelId: "player.primary",
          deliveryInstanceId: "delivery",
        }),
      ]);
      expect(graph.projectileChannelLineages).toEqual([
        expect.objectContaining({ providerInstanceId: "delivery" }),
      ]);
      expect(graph.resourceTotals).toEqual({
        activeEntities: 16,
        activeProjectiles: 16,
        spawnsPerSecond: 40,
        timers: 0,
      });
      expect(() => ResolvedModuleGraphV13Schema.parse(graph)).not.toThrow();
    }
  });

  it("mints an exact loader-owned browser catalog for every ready graph", async () => {
    const registry = await createBatch2CoreProductionRegistry();
    const results = await resolveBatch2FormationMatrix();
    for (const [index, { graph }] of results.entries()) {
      const catalog = generateBrowserRuntimeCatalogV13(graph, registry);
      const formation = BATCH2_FORMATION_CASES[index]!;
      const assembly = createBatch2FormationAssembly(formation);
      expect(catalog.catalogEvidenceId).toBe(graph.catalogEvidenceId);
      const entries = graph.modules.map(({ instanceId }) =>
        catalog.findForGraph(graph, instanceId),
      );
      expect(entries).toHaveLength(graph.modules.length);
      expect(
        entries.some(({ moduleId }) => moduleId === formation.moduleId),
      ).toBe(true);
      expect(assembly.modules).toHaveLength(15);
    }
  });
});
