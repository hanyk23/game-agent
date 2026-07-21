import { describe, expect, it } from "vitest";

import { createBatch2CoreProductionRegistry } from "../../src/modules/batch2-core-library.js";
import {
  BATCH2_PROGRESSION_SLICE_ASSEMBLY,
  resolveBatch2ProgressionSlice,
} from "../../src/modules/batch2-progression-slice.js";
import { DeterministicGameModuleProductionInstantiatorV13 } from "../../src/modules/game-module-production-instantiator.js";
import { resolvePickupEffectTransformV13 } from "../../src/modules/game-module-production-instantiator.js";
import { generateBrowserRuntimeCatalogV13 } from "../../src/modules/game-module-runtime-catalog-generator.js";
import { ResolvedModuleGraphV13Schema } from "../../src/modules/game-module-resolver.js";

describe("Batch 2 pickup/modifier ready Graph 1.3 slice", () => {
  it("closes prepared selection, consume authority, and exact addressed routes", async () => {
    const result = await resolveBatch2ProgressionSlice();
    expect(BATCH2_PROGRESSION_SLICE_ASSEMBLY.modules).toHaveLength(8);
    expect(result.graph.executionReadiness.status).toBe("ready");
    expect(result.readinessReport.blockers).toEqual([]);
    expect(result.graph.effectApplicationRoutes).toEqual([
      expect.objectContaining({
        routeId: "pickup-collect.effect-route.delivery-damage",
        targetInstanceId: "player-delivery",
        fieldId: "attack.damage.multiplier",
      }),
    ]);
    expect(result.graph.pickupEffectPlans).toEqual([
      expect.objectContaining({
        commitInstanceId: "pickup-collect",
        transformInstanceId: "pickup-modifier",
        mutationChannelId: "pickup-spawn.pickups",
        mutationGrantId: "pickup-collect.pickup.consume",
        routeIds: ["pickup-collect.effect-route.delivery-damage"],
      }),
    ]);
    expect(result.graph.entityMutationGrants).toContainEqual(
      expect.objectContaining({
        grantId: "pickup-collect.pickup.consume",
        granteeInstanceId: "pickup-collect",
        channelId: "pickup-spawn.pickups",
        operations: ["consume"],
      }),
    );
    expect(() =>
      ResolvedModuleGraphV13Schema.parse(result.graph),
    ).not.toThrow();
  });

  it("executes the graph-selected production transform for the routed effect", async () => {
    const result = await resolveBatch2ProgressionSlice();
    const registry = await createBatch2CoreProductionRegistry();
    const catalog = generateBrowserRuntimeCatalogV13(result.graph, registry);
    const resolved = resolvePickupEffectTransformV13(
      result.graph,
      catalog,
      "pickup-collect",
    );
    const configuration = result.graph.modules.find(
      (module) => module.instanceId === "pickup-modifier",
    )!.configuration;
    expect(
      resolved.transform(configuration, {
        effectId: "weaponPower",
        value: 1,
      }),
    ).toEqual([
      expect.objectContaining({
        routeId: "pickup-collect.effect-route.delivery-damage",
        targetInstanceId: "player-delivery",
        value: 1,
      }),
    ]);
  });

  it("runs admitted lifecycle factories with prepared and addressed authority only", async () => {
    const result = await resolveBatch2ProgressionSlice();
    const registry = await createBatch2CoreProductionRegistry();
    const catalog = generateBrowserRuntimeCatalogV13(result.graph, registry);
    const actors = new Map(
      result.graph.actors.map((actor) => [
        actor.actorId,
        {
          actorId: actor.actorId,
          active: true,
          position: { x: 360, y: actor.role === "enemy" ? 120 : 600 },
          velocity: { x: 0, y: 0 },
        },
      ]),
    );
    const activeRoutes = new Set<string>();
    const createContext = (
      module: (typeof result.graph.modules)[number],
      clock: unknown,
    ) => ({
      identity: {
        instanceId: module.instanceId,
        ownerId: module.ownerId,
        moduleId: module.moduleId,
        version: module.version,
        artifactEnvelopeSha256: module.artifactIdentity!.envelopeSha256,
      },
      configuration: module.configuration,
      services: {
        viewport: { read: () => ({ width: 720, height: 720 }) },
        actors: {
          readOwner: () => actors.get(module.ownerId),
          writeOwnerMotion: (motion: { x: number; y: number }) => {
            actors.get(module.ownerId)!.velocity = { ...motion };
          },
          writeOwnerPosition: (position: { x: number; y: number }) => {
            actors.get(module.ownerId)!.position = { ...position };
          },
        },
        input: { register: () => () => undefined },
        overlaps: { register: () => () => undefined },
        channels: {
          activate: (_id: string, entity: unknown) => entity,
          recycle: () => undefined,
          read: () => [],
        },
        observation: { register: () => () => undefined },
        contact: {
          executePolicy: () => {
            throw new Error("contact is not exercised by lifecycle smoke");
          },
          prepareCommit: () => {
            throw new Error("contact is not exercised by lifecycle smoke");
          },
        },
        ...(module.instanceId === "pickup-collect"
          ? {
              preparedEffects: {
                prepare: () => ({
                  commit: () => undefined,
                  abandon: () => undefined,
                }),
              },
            }
          : {}),
      },
      ports: {
        declareHandler: () => undefined,
        declareAddressedHandler: () => undefined,
        publishState: () => undefined,
        emitEvent: () => undefined,
      },
      clock,
      assets: {
        requireTexture: (roleId: string) => `texture:${roleId}`,
        optionalTexture: () => undefined,
      },
    });
    const runtime = DeterministicGameModuleProductionInstantiatorV13.create({
      graph: result.graph,
      catalog,
      createContextV12: (module, clock) =>
        createContext(module, clock) as never,
      createContextV13: (module, clock) =>
        createContext(module, clock) as never,
      registerAddressedHandler: (routeId) => {
        activeRoutes.add(routeId);
        return () => activeRoutes.delete(routeId);
      },
    });
    runtime.initialize();
    runtime.start();
    expect(activeRoutes).toEqual(
      new Set(["pickup-collect.effect-route.delivery-damage"]),
    );
    runtime.frame(16);
    runtime.stop();
    expect(activeRoutes.size).toBe(0);
    runtime.dispose();
    expect(runtime.guard.held).toBe(false);
  });
});
