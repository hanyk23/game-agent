import {
  batch2ProgressionGraph,
  batch2ProgressionRuntimeCatalog,
} from "../generated/batch2-progression.js";
import {
  createBatch2ProgressionBrowserConformanceRuntime,
  type Batch2ProgressionBrowserSnapshot,
} from "./batch2-progression-browser-conformance.js";

type BrowserEventTarget = Readonly<{
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}>;

export type Batch2ProgressionBrowserRuntime = Readonly<{
  frame(deltaMs: number): void;
  snapshot(): Batch2ProgressionBrowserSnapshot;
  destroy(): void;
}>;

/**
 * Binds the admitted progression graph to public pointer, focus, and restart
 * events. Pointer contact with the configured pickup position enters the
 * collector's resolved overlap service; callers receive no direct commit API.
 */
export function createBatch2ProgressionBrowserRuntime(
  canvas: HTMLCanvasElement,
  eventTarget: BrowserEventTarget = window,
): Batch2ProgressionBrowserRuntime {
  const runtime = createBatch2ProgressionBrowserConformanceRuntime(
    batch2ProgressionGraph,
    batch2ProgressionRuntimeCatalog,
  );
  const spawn = batch2ProgressionGraph.modules.find(
    ({ instanceId }) => instanceId === "pickup-spawn",
  )?.configuration as
    | Readonly<{
        schedule: readonly Readonly<{
          position: Readonly<{ x: number; y: number }>;
        }>[];
      }>
    | undefined;
  const pickupPosition = spawn?.schedule[0]?.position;
  if (pickupPosition === undefined)
    throw new Error("generated progression graph has no pickup schedule");

  let destroyed = false;
  const removers: Array<() => void> = [];
  const listen = (type: string, listener: EventListener) => {
    eventTarget.addEventListener(type, listener);
    removers.push(() => eventTarget.removeEventListener(type, listener));
  };
  const worldPoint = (event: PointerEvent) => {
    const bounds = canvas.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0)
      throw new Error("progression canvas has empty bounds");
    return Object.freeze({
      x: ((event.clientX - bounds.left) / bounds.width) * 720,
      y: ((event.clientY - bounds.top) / bounds.height) * 720,
    });
  };

  listen("pointerdown", ((event: PointerEvent) => {
    if (destroyed) return;
    const point = worldPoint(event);
    if (
      runtime.snapshot().activePickups > 0 &&
      Math.hypot(point.x - pickupPosition.x, point.y - pickupPosition.y) <= 48
    )
      runtime.triggerPickupOverlap();
    runtime.triggerPointerAttack(point.x, point.y);
  }) as EventListener);
  listen("blur", (() => {
    if (!destroyed && runtime.snapshot().phase === "running") runtime.pause();
  }) as EventListener);
  listen("focus", (() => {
    if (!destroyed && runtime.snapshot().phase === "stopped") runtime.resume();
  }) as EventListener);
  listen("keydown", ((event: KeyboardEvent) => {
    if (!destroyed && event.code === "KeyR") runtime.restart();
  }) as EventListener);

  return Object.freeze({
    frame: (deltaMs) => {
      if (!destroyed) runtime.frame(Math.min(250, Math.max(0, deltaMs)));
    },
    snapshot: runtime.snapshot,
    destroy: () => {
      if (destroyed) return;
      for (const remove of removers.splice(0).reverse()) remove();
      runtime.destroy();
      destroyed = true;
    },
  });
}
