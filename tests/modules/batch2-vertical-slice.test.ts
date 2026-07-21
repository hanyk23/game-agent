import { describe, expect, it } from "vitest";

import { generateBrowserRuntimeCatalogV13 } from "../../src/modules/game-module-runtime-catalog-generator.js";
import { DeterministicGameModuleProductionInstantiatorV13 } from "../../src/modules/game-module-production-instantiator.js";
import { createBatch2CoreProductionRegistry } from "../../src/modules/batch2-core-library.js";
import {
  BATCH2_VERTICAL_SLICE_ASSEMBLY,
  resolveBatch2VerticalSlice,
} from "../../src/modules/batch2-vertical-slice.js";
import { ResolvedModuleGraphV13Schema } from "../../src/modules/game-module-resolver.js";

describe("Batch 2 ready Graph 1.3 vertical slice", () => {
  it("resolves production-ready with exact attack and projectile lineage", async () => {
    const result = await resolveBatch2VerticalSlice();
    expect(BATCH2_VERTICAL_SLICE_ASSEMBLY.modules).toHaveLength(15);
    expect(result.graph.graphVersion).toBe("1.3.0");
    expect(result.graph.executionReadiness.status).toBe("ready");
    expect(result.readinessReport.blockers).toEqual([]);
    expect(result.graph.attackChannels).toHaveLength(1);
    expect(result.graph.projectileChannelLineages).toHaveLength(1);
    expect(
      result.graph.modules.find((module) => module.instanceId === "keyboard")
        ?.factoryContextVersion,
    ).toBe("1.2.0");
    expect(
      result.graph.modules.find((module) => module.instanceId === "delivery")
        ?.factoryContextVersion,
    ).toBe("1.3.0");
    expect(() =>
      ResolvedModuleGraphV13Schema.parse(result.graph),
    ).not.toThrow();
  });

  it("instantiates, starts, stops, and disposes the mixed production graph", async () => {
    const result = await resolveBatch2VerticalSlice();
    const registry = await createBatch2CoreProductionRegistry();
    const catalog = generateBrowserRuntimeCatalogV13(result.graph, registry);
    const inputs = new Map<string, (input: unknown) => unknown>();
    const active = new Map<string, Record<string, unknown>>();
    let recycleCount = 0;
    const actors = new Map(
      result.graph.actors.map((actor) => [
        actor.actorId,
        {
          actorId: actor.actorId,
          active: true,
          position: { x: 360, y: actor.role === "player" ? 600 : 120 },
          velocity: { x: 0, y: 0 },
        },
      ]),
    );
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
        input: {
          register: (id: string, handler: (input: unknown) => unknown) => {
            const key = `${module.instanceId}:${id}`;
            inputs.set(key, handler);
            return () => inputs.delete(key);
          },
        },
        overlaps: { register: () => () => undefined },
        channels: {
          activate: (id: string, entity: unknown) => {
            const source = entity as Record<string, unknown>;
            const value = {
              ...source,
              channelId: `${module.instanceId}.${id}`,
              ownerActorId: module.ownerId,
              entityRole: "projectile",
            };
            active.set(source.entityId as string, value);
            return value;
          },
          recycle: (_id: string, entity: unknown) => {
            recycleCount += 1;
            active.delete(
              (entity as Record<string, unknown>).entityId as string,
            );
          },
          read: () => [...active.values()],
        },
        observation: { register: () => () => undefined },
        contact: {
          executePolicy: () => {
            throw new Error(
              "contact policy is not exercised by lifecycle smoke",
            );
          },
          prepareCommit: () => {
            throw new Error(
              "contact commit is not exercised by lifecycle smoke",
            );
          },
        },
      },
      ports: {
        declareHandler: () => undefined,
        declareAddressedHandler: () => undefined,
        publishState: () => undefined,
        emitEvent: () => undefined,
      },
      clock,
      assets: {
        requireTexture: () => result.graph.assetBindings[0]!.textureKey,
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
      registerAddressedHandler: () => undefined,
    });
    runtime.initialize();
    runtime.start();
    inputs.get("aim:aim.pointer")!({ worldX: 360, worldY: 0 });
    inputs.get("attack-intent:attack.pointer-down")!({ id: 1 });
    expect(active.size).toBe(3);
    runtime.frame(16);
    runtime.stop();
    expect(active.size).toBe(0);
    expect(recycleCount).toBe(3);
    runtime.dispose();
    expect(runtime.guard.held).toBe(false);
  });
});
