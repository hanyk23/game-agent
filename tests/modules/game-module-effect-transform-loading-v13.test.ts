import { describe, expect, it, vi } from "vitest";

import { resolvePickupEffectTransformV13 } from "../../src/modules/game-module-production-instantiator.js";
import {
  BrowserGameModuleRuntimeCatalogV13,
  type BrowserRuntimeCatalogEntryV13,
} from "../../src/modules/game-module-runtime-catalog.js";
import type { ResolvedModuleGraphV13 } from "../../src/modules/game-module-resolver.js";

const hash = (value: string) => value.repeat(64);

function fixture(exportKind: BrowserRuntimeCatalogEntryV13["exportKind"]) {
  const transform = vi.fn(() => []);
  const graph = {
    graphVersion: "1.3.0",
    executionReadiness: { status: "ready", evidenceId: hash("a") },
    catalogEvidenceId: hash("b"),
    modules: [
      {
        instanceId: "planner",
        moduleId: "progression.pickup-plan-test",
        version: "1.0.0",
        implementationId: "progression.pickup-plan-test.v1",
        manifestSchemaVersion: "1.3.0",
        factoryContextVersion: "1.3.0",
        artifactIdentity: { envelopeSha256: hash("c") },
        catalogEntryEvidenceId: hash("d"),
      },
    ],
    pickupEffectPlans: [
      {
        commitInstanceId: "collector",
        transformInstanceId: "planner",
        profileId: "pickup.default",
        mutationChannelId: "provider.pickups",
        mutationGrantId: "collector.pickup.consume",
        maximumApplicationsPerCommit: 2,
        routeIds: ["collector.effect-route.health"],
      },
    ],
  } as unknown as ResolvedModuleGraphV13;
  const catalog = new BrowserGameModuleRuntimeCatalogV13({
    catalogEvidenceId: graph.catalogEvidenceId,
    entries: [
      {
        moduleId: "progression.pickup-plan-test",
        version: "1.0.0",
        envelopeSha256: hash("c"),
        implementationId: "progression.pickup-plan-test.v1",
        manifestSchemaVersion: "1.3.0",
        exportKind,
        entryEvidenceId: hash("d"),
        executable: transform,
      },
    ],
  });
  return { catalog, graph, transform };
}

describe("ADR 0027 restricted pickup transform loading", () => {
  it("returns only the exact graph-selected Manifest 1.3 transform", () => {
    const { catalog, graph, transform } = fixture(
      "pickup-effect-plan-transform-v1",
    );
    const resolved = resolvePickupEffectTransformV13(
      graph,
      catalog,
      "collector",
    );
    expect(resolved.plan).toBe(graph.pickupEffectPlans[0]);
    expect(resolved.transform).toBe(transform);
  });

  it("rejects lifecycle-kind substitution and missing/duplicate plan selection", () => {
    const wrong = fixture("lifecycle-create-v1");
    expect(() =>
      resolvePickupEffectTransformV13(wrong.graph, wrong.catalog, "collector"),
    ).toThrow(/export kind mismatch/);

    const exact = fixture("pickup-effect-plan-transform-v1");
    expect(() =>
      resolvePickupEffectTransformV13(
        {
          ...exact.graph,
          pickupEffectPlans: [],
        } as ResolvedModuleGraphV13,
        exact.catalog,
        "collector",
      ),
    ).toThrow(/requires one resolved plan/);
    expect(() =>
      resolvePickupEffectTransformV13(
        {
          ...exact.graph,
          pickupEffectPlans: [
            exact.graph.pickupEffectPlans[0]!,
            exact.graph.pickupEffectPlans[0]!,
          ],
        } as ResolvedModuleGraphV13,
        exact.catalog,
        "collector",
      ),
    ).toThrow(/requires one resolved plan/);
  });
});
