import { describe, expect, it } from "vitest";

import { createBatch2ProgressionBrowserRuntime } from "../../game-template/vertical-shooter/src/runtime-kernel/batch2-progression-browser-runtime.js";
import {
  batch2ProgressionGraph,
  batch2ProgressionRuntimeCatalog,
} from "../../game-template/vertical-shooter/src/generated/batch2-progression.js";

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

describe("generated Batch 2 progression browser runtime", () => {
  it("binds the exact ready graph and catalog evidence", () => {
    expect(batch2ProgressionGraph.executionReadiness.status).toBe("ready");
    expect(batch2ProgressionRuntimeCatalog.catalogEvidenceId).toBe(
      batch2ProgressionGraph.catalogEvidenceId,
    );
    for (const module of batch2ProgressionGraph.modules)
      expect(() =>
        batch2ProgressionRuntimeCatalog.findForGraph(
          batch2ProgressionGraph,
          module.instanceId,
        ),
      ).not.toThrow();
  });

  it("uses public pointer/focus/restart events and destroys with zero residue", () => {
    const events = new FakeEventTarget();
    const canvas = {
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 720,
        height: 720,
      }),
    } as HTMLCanvasElement;
    const runtime = createBatch2ProgressionBrowserRuntime(canvas, events);
    runtime.frame(0);
    expect(runtime.snapshot()).toMatchObject({
      phase: "running",
      activePickups: 1,
      addressedApplications: 0,
    });

    events.dispatch("pointerdown", {
      pointerId: 7,
      clientX: 400,
      clientY: 160,
    });
    expect(runtime.snapshot()).toMatchObject({
      activePickups: 0,
      collectedEvents: 1,
      addressedApplications: 1,
      deliveryDamageBonus: 1,
      preparedSources: 1,
      activePreparedEffects: 0,
      effectTrace: ["consume", "collected", "application"],
    });

    events.dispatch("blur");
    expect(runtime.snapshot()).toMatchObject({
      phase: "stopped",
      inputHandlers: 0,
      overlapHandlers: 0,
      preparedRoutes: 0,
    });
    events.dispatch("focus");
    expect(runtime.snapshot().phase).toBe("running");

    events.dispatch("keydown", { code: "KeyR" });
    runtime.frame(0);
    expect(runtime.snapshot()).toMatchObject({
      activePickups: 1,
      collectedEvents: 0,
      addressedApplications: 0,
      deliveryDamageBonus: 0,
      preparedSources: 0,
      effectTrace: [],
    });

    runtime.destroy();
    expect(events.size).toBe(0);
    expect(runtime.snapshot()).toMatchObject({
      phase: "destroyed",
      cleanupResidue: 0,
      preparedRoutes: 0,
      preparedSources: 0,
      activePreparedEffects: 0,
    });
  });
});
