import { describe, expect, it } from "vitest";

import { createBatch2DefenseBrowserRuntime } from "../../game-template/vertical-shooter/src/runtime-kernel/batch2-defense-browser-runtime.js";
import {
  batch2DefenseGraphs,
  batch2DefenseRuntimeCatalogs,
} from "../../game-template/vertical-shooter/src/generated/batch2-defense.js";

class FakeEventTarget {
  readonly listeners = new Map<string, Set<EventListener>>();
  addEventListener(type: string, listener: EventListener): void {
    const listeners = this.listeners.get(type) ?? new Set<EventListener>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }
  removeEventListener(type: string, listener: EventListener): void {
    this.listeners.get(type)?.delete(listener);
  }
  dispatch(type: string, event: object = {}): void {
    for (const listener of this.listeners.get(type) ?? [])
      listener(event as Event);
  }
  get size(): number {
    return [...this.listeners.values()].reduce(
      (total, listeners) => total + listeners.size,
      0,
    );
  }
}

describe("generated Batch 2 defense browser runtime", () => {
  it("binds two ready graphs to their exact catalogs", () => {
    expect(batch2DefenseGraphs).toHaveLength(2);
    expect(batch2DefenseRuntimeCatalogs).toHaveLength(2);
    for (const [index, graph] of batch2DefenseGraphs.entries()) {
      const catalog = batch2DefenseRuntimeCatalogs[index]!;
      expect(graph.executionReadiness.status).toBe("ready");
      expect(catalog.catalogEvidenceId).toBe(graph.catalogEvidenceId);
      for (const module of graph.modules)
        expect(() =>
          catalog.findForGraph(graph, module.instanceId),
        ).not.toThrow();
    }
  });

  it("drives both timing cases with public pointer, focus, and restart events", () => {
    const events = new FakeEventTarget();
    const canvas = {
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 720,
        height: 720,
      }),
    } as HTMLCanvasElement;
    const runtime = createBatch2DefenseBrowserRuntime(canvas, events);
    const pointer = { pointerId: 1, clientX: 360, clientY: 0 };

    events.dispatch("pointerdown", pointer);
    events.dispatch("keydown", { code: "KeyR" });
    expect(runtime.snapshot()).toMatchObject({
      currentCaseIndex: 0,
      currentDurationMs: 125,
      currentHitCount: 0,
      completedCases: [],
    });

    events.dispatch("pointerdown", pointer);
    events.dispatch("pointerdown", pointer);
    events.dispatch("blur");
    expect(runtime.snapshot().phase).toBe("stopped");
    events.dispatch("focus");
    runtime.frame(125);
    events.dispatch("pointerdown", pointer);
    expect(runtime.snapshot()).toMatchObject({
      currentCaseIndex: 1,
      currentDurationMs: 0,
      completedCases: [
        {
          durationMs: 125,
          healthAfterFirst: 95,
          healthAfterSecond: 95,
          healthAfterExpiry: 65,
          sameTimeBlocked: true,
          exactExpiryAccepted: true,
          route: ["invulnerability", "shield", "health"],
          cleanupResidue: 0,
        },
      ],
    });

    events.dispatch("pointerdown", pointer);
    events.dispatch("pointerdown", pointer);
    expect(runtime.snapshot()).toMatchObject({
      phase: "complete",
      allPassed: true,
      completedCases: [
        expect.anything(),
        {
          durationMs: 0,
          healthAfterFirst: 95,
          healthAfterSecond: 65,
          sameTimeBlocked: false,
          exactExpiryAccepted: null,
          cleanupResidue: 0,
        },
      ],
    });

    runtime.destroy();
    expect(events.size).toBe(0);
    expect(runtime.snapshot()).toMatchObject({
      phase: "destroyed",
      allPassed: true,
      eventListenerResidue: 0,
      cleanupResidue: 0,
    });
  });
});
