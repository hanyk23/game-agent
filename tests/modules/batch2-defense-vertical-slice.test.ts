import { describe, expect, it } from "vitest";

import {
  BATCH2_DEFENSE_VERTICAL_SLICE_ASSEMBLY,
  resolveBatch2DefenseVerticalSlice,
} from "../../src/modules/batch2-defense-vertical-slice.js";
import { ResolvedModuleGraphV13Schema } from "../../src/modules/game-module-resolver.js";
import { generateBrowserRuntimeCatalogV13 } from "../../src/modules/game-module-runtime-catalog-generator.js";
import { createBatch2CoreProductionRegistry } from "../../src/modules/batch2-core-library.js";

describe("Batch 2 defense ready Graph 1.3 vertical slice", () => {
  it("resolves player projectile damage through an enemy invulnerability, shield, and terminal health route", async () => {
    const result = await resolveBatch2DefenseVerticalSlice();

    expect(BATCH2_DEFENSE_VERTICAL_SLICE_ASSEMBLY.modules).toHaveLength(11);
    expect(result.graph.graphVersion).toBe("1.3.0");
    expect(result.graph.executionReadiness.status).toBe("ready");
    expect(result.readinessReport.blockers).toEqual([]);
    expect(result.graph.damageSinkRoutes).toEqual([
      {
        ownerId: "defender-one",
        headInstanceId: "invulnerability",
        orderedSinkInstanceIds: ["invulnerability", "shield", "health"],
        terminalHealthInstanceId: "health",
        producerInstanceIds: ["resolver"],
      },
    ]);
    expect(result.graph.attackChannels).toHaveLength(1);
    expect(result.graph.projectileChannelLineages).toHaveLength(1);
    expect(() =>
      ResolvedModuleGraphV13Schema.parse(result.graph),
    ).not.toThrow();
  });

  it("generates a browser-safe catalog from only admitted production handles", async () => {
    const result = await resolveBatch2DefenseVerticalSlice();
    const registry = await createBatch2CoreProductionRegistry();
    const catalog = generateBrowserRuntimeCatalogV13(result.graph, registry);

    expect(catalog.catalogEvidenceId).toBe(result.graph.catalogEvidenceId);
    const entries = result.graph.modules.map(({ instanceId }) =>
      catalog.findForGraph(result.graph, instanceId),
    );
    expect(entries).toHaveLength(
      BATCH2_DEFENSE_VERTICAL_SLICE_ASSEMBLY.modules.length,
    );
    expect(
      entries.every(
        (entry) =>
          entry.manifestSchemaVersion === "1.2.0" ||
          entry.manifestSchemaVersion === "1.3.0",
      ),
    ).toBe(true);
  });

  it("rejects a producer binding that bypasses the declared route head", async () => {
    const registry = await createBatch2CoreProductionRegistry();
    const { resolveGameAssemblyV13 } =
      await import("../../src/modules/game-module-resolver.js");
    const { BATCH1_VERTICAL_SLICE_ASSET_EVIDENCE } =
      await import("../../src/modules/batch1-vertical-slice.js");
    const broken = {
      ...structuredClone(BATCH2_DEFENSE_VERTICAL_SLICE_ASSEMBLY),
      bindings: [
        ...structuredClone(BATCH2_DEFENSE_VERTICAL_SLICE_ASSEMBLY.bindings),
        {
          from: { instanceId: "resolver", portId: "damage" },
          to: { instanceId: "shield", portId: "damage" },
        },
      ],
    };

    expect(() =>
      resolveGameAssemblyV13(
        broken,
        registry,
        BATCH1_VERTICAL_SLICE_ASSET_EVIDENCE,
      ),
    ).toThrow(/below the declared route head/);
  });
});
