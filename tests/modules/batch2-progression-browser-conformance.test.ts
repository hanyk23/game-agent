import { describe, expect, it } from "vitest";

import { createBatch2ProgressionBrowserConformanceRuntime } from "../../game-template/vertical-shooter/src/runtime-kernel/batch2-progression-browser-conformance.js";
import { createBatch2CoreProductionRegistry } from "../../src/modules/batch2-core-library.js";
import { resolveBatch2ProgressionSlice } from "../../src/modules/batch2-progression-slice.js";
import { generateBrowserRuntimeCatalogV13 } from "../../src/modules/game-module-runtime-catalog-generator.js";

describe("Batch 2 progression browser-kernel conformance", () => {
  it("runs scheduled pickup through consume, collected, and addressed delivery", async () => {
    const result = await resolveBatch2ProgressionSlice();
    const registry = await createBatch2CoreProductionRegistry();
    const catalog = generateBrowserRuntimeCatalogV13(result.graph, registry);
    const runtime = createBatch2ProgressionBrowserConformanceRuntime(
      result.graph,
      catalog,
    );

    runtime.frame(0);
    expect(runtime.snapshot()).toMatchObject({
      phase: "running",
      activePickups: 1,
      collectedEvents: 0,
      addressedApplications: 0,
      deliveryDamageBonus: 0,
      preparedRoutes: 1,
    });

    runtime.triggerPickupOverlap();
    expect(runtime.snapshot()).toMatchObject({
      activePickups: 0,
      collectedEvents: 1,
      addressedApplications: 1,
      deliveryDamageBonus: 1,
      preparedSources: 1,
      activePreparedEffects: 0,
    });
    runtime.triggerPointerAttack(360, 0);
    expect(runtime.snapshot().activeProjectiles).toBe(1);

    runtime.pause();
    expect(runtime.snapshot()).toMatchObject({
      phase: "stopped",
      activePickups: 0,
      activeProjectiles: 0,
      inputHandlers: 0,
      overlapHandlers: 0,
      preparedRoutes: 0,
    });
    runtime.resume();
    expect(runtime.snapshot()).toMatchObject({
      phase: "running",
      preparedRoutes: 1,
    });

    runtime.restart();
    runtime.frame(0);
    expect(runtime.snapshot()).toMatchObject({
      phase: "running",
      activePickups: 1,
      collectedEvents: 0,
      addressedApplications: 0,
      deliveryDamageBonus: 0,
      preparedSources: 0,
    });
    runtime.destroy();
    expect(runtime.snapshot()).toMatchObject({
      phase: "destroyed",
      cleanupResidue: 0,
      preparedRoutes: 0,
      preparedSources: 0,
      activePreparedEffects: 0,
    });
  });
});
