import { describe, expect, it } from "vitest";

import { createBatch2DefenseBrowserConformanceRuntime } from "../../game-template/vertical-shooter/src/runtime-kernel/batch2-defense-browser-conformance.js";
import { BATCH1_VERTICAL_SLICE_ASSET_EVIDENCE } from "../../src/modules/batch1-vertical-slice.js";
import { createBatch2CoreProductionRegistry } from "../../src/modules/batch2-core-library.js";
import { BATCH2_DEFENSE_VERTICAL_SLICE_ASSEMBLY } from "../../src/modules/batch2-defense-vertical-slice.js";
import { generateBrowserRuntimeCatalogV13 } from "../../src/modules/game-module-runtime-catalog-generator.js";
import { resolveGameAssemblyV13 } from "../../src/modules/game-module-resolver.js";

async function conformance(durationMs: number) {
  const registry = await createBatch2CoreProductionRegistry();
  const assembly = structuredClone(BATCH2_DEFENSE_VERTICAL_SLICE_ASSEMBLY);
  const invulnerability = assembly.modules.find(
    (module) => module.instanceId === "invulnerability",
  )!;
  invulnerability.configuration = {
    ...(invulnerability.configuration as Record<string, unknown>),
    durationMs,
  };
  const result = resolveGameAssemblyV13(
    assembly,
    registry,
    BATCH1_VERTICAL_SLICE_ASSET_EVIDENCE,
  );
  return createBatch2DefenseBrowserConformanceRuntime(
    result.graph,
    generateBrowserRuntimeCatalogV13(result.graph, registry),
  );
}

function contact(
  runtime: Awaited<ReturnType<typeof conformance>>,
  entityId: string,
): void {
  try {
    runtime.triggerProjectileContact(entityId);
  } catch (error) {
    const messages: string[] = [];
    const visit = (value: unknown): void => {
      messages.push(String(value));
      if (value instanceof AggregateError)
        for (const cause of value.errors) visit(cause);
    };
    visit(error);
    throw new Error(messages.join(" <- "));
  }
}

describe("Batch 2 defense browser-kernel conformance", () => {
  it("uses the half-open runtime clock across same-time and exact-expiry contacts", async () => {
    const runtime = await conformance(125);
    contact(runtime, runtime.triggerPointerAttack());
    expect(runtime.snapshot()).toMatchObject({
      simulationTimeMs: 0,
      resolvedContacts: 1,
      invulnerabilityActiveUntilMs: 125,
      shieldCurrent: 0,
      healthCurrent: 95,
    });

    runtime.triggerProjectileContact(runtime.triggerPointerAttack());
    expect(runtime.snapshot()).toMatchObject({
      simulationTimeMs: 0,
      resolvedContacts: 2,
      healthCurrent: 95,
    });

    runtime.frame(125);
    runtime.triggerProjectileContact(runtime.triggerPointerAttack());
    expect(runtime.snapshot()).toMatchObject({
      simulationTimeMs: 125,
      resolvedContacts: 3,
      invulnerabilityActiveUntilMs: 250,
      healthCurrent: 65,
    });

    runtime.pause();
    expect(runtime.snapshot()).toMatchObject({
      phase: "stopped",
      activeProjectiles: 0,
      inputHandlers: 0,
      overlapHandlers: 0,
    });
    runtime.resume();
    runtime.restart();
    expect(runtime.snapshot()).toMatchObject({
      phase: "running",
      simulationTimeMs: 0,
      shieldCurrent: 25,
      healthCurrent: 100,
    });
    runtime.destroy();
    expect(runtime.snapshot()).toMatchObject({
      phase: "destroyed",
      cleanupResidue: 0,
    });
  });

  it("lets duration zero accept consecutive contacts at the same time", async () => {
    const runtime = await conformance(0);
    runtime.triggerProjectileContact(runtime.triggerPointerAttack());
    runtime.triggerProjectileContact(runtime.triggerPointerAttack());
    expect(runtime.snapshot()).toMatchObject({
      simulationTimeMs: 0,
      invulnerabilityActiveUntilMs: 0,
      shieldCurrent: 0,
      healthCurrent: 65,
      resolvedContacts: 2,
    });
    runtime.destroy();
    expect(runtime.snapshot().cleanupResidue).toBe(0);
  });
});
