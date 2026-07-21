import {
  batch2DefenseGraphs,
  batch2DefenseRuntimeCatalogs,
} from "../generated/batch2-defense.js";
import {
  createBatch2DefenseBrowserConformanceRuntime,
  type Batch2DefenseBrowserConformanceRuntime,
} from "./batch2-defense-browser-conformance.js";

type BrowserEventTarget = Readonly<{
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}>;

export type Batch2DefenseCaseEvidence = Readonly<{
  durationMs: 0 | 125;
  hitCount: number;
  healthAfterFirst: number;
  healthAfterSecond: number;
  healthAfterExpiry: number | null;
  sameTimeBlocked: boolean;
  exactExpiryAccepted: boolean | null;
  route: readonly string[];
  cleanupResidue: number;
}>;

export type Batch2DefenseBrowserRuntimeSnapshot = Readonly<{
  phase: "running" | "stopped" | "complete" | "destroyed";
  currentCaseIndex: number;
  currentDurationMs: 0 | 125 | null;
  currentHitCount: number;
  simulationTimeMs: number;
  completedCases: readonly Batch2DefenseCaseEvidence[];
  allPassed: boolean;
  eventListenerResidue: number;
  cleanupResidue: number;
}>;

export type Batch2DefenseBrowserRuntime = Readonly<{
  frame(deltaMs: number): void;
  snapshot(): Batch2DefenseBrowserRuntimeSnapshot;
  destroy(): void;
}>;

export function createBatch2DefenseBrowserRuntime(
  canvas: HTMLCanvasElement,
  eventTarget: BrowserEventTarget = window,
): Batch2DefenseBrowserRuntime {
  const durations = [125, 0] as const;
  const completedCases: Batch2DefenseCaseEvidence[] = [];
  const removers: Array<() => void> = [];
  let currentCaseIndex = 0;
  let runtime: Batch2DefenseBrowserConformanceRuntime | undefined;
  let healthAfterFirst = 0;
  let healthAfterSecond = 0;
  let currentHitCount = 0;
  let expiryAdvanced = false;
  let destroyed = false;

  const createCurrent = (): void => {
    const graph = batch2DefenseGraphs[currentCaseIndex];
    const catalog = batch2DefenseRuntimeCatalogs[currentCaseIndex];
    if (graph === undefined || catalog === undefined) {
      runtime = undefined;
      return;
    }
    runtime = createBatch2DefenseBrowserConformanceRuntime(graph, catalog);
    healthAfterFirst = 0;
    healthAfterSecond = 0;
    currentHitCount = 0;
    expiryAdvanced = false;
  };
  const reset = (): void => {
    runtime?.destroy();
    completedCases.splice(0);
    currentCaseIndex = 0;
    createCurrent();
  };
  const routeFor = (index: number): readonly string[] =>
    Object.freeze([
      ...(batch2DefenseGraphs[index]?.damageSinkRoutes[0]
        ?.orderedSinkInstanceIds ?? []),
    ]);
  const finishCurrent = (healthAfterExpiry: number | null): void => {
    const current = runtime!;
    const durationMs = durations[currentCaseIndex]!;
    const beforeCleanup = current.snapshot();
    current.destroy();
    const cleanup = current.snapshot().cleanupResidue;
    completedCases.push(
      Object.freeze({
        durationMs,
        hitCount: currentHitCount,
        healthAfterFirst,
        healthAfterSecond,
        healthAfterExpiry,
        sameTimeBlocked: healthAfterSecond === healthAfterFirst,
        exactExpiryAccepted:
          durationMs === 125
            ? beforeCleanup.simulationTimeMs === 125 &&
              healthAfterExpiry === healthAfterSecond - 30
            : null,
        route: routeFor(currentCaseIndex),
        cleanupResidue: cleanup,
      }),
    );
    currentCaseIndex += 1;
    createCurrent();
  };
  const pointerWorld = (event: PointerEvent) => {
    const bounds = canvas.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0)
      throw new Error("defense canvas has empty bounds");
    return Object.freeze({
      x: ((event.clientX - bounds.left) / bounds.width) * 720,
      y: ((event.clientY - bounds.top) / bounds.height) * 720,
    });
  };
  const onPointer = (event: PointerEvent): void => {
    if (destroyed || runtime === undefined) return;
    const point = pointerWorld(event);
    const entityId = runtime.triggerPointerAttack(point.x, point.y);
    runtime.triggerProjectileContact(entityId);
    currentHitCount += 1;
    const health = runtime.snapshot().healthCurrent;
    if (currentHitCount === 1) healthAfterFirst = health;
    else if (currentHitCount === 2) {
      healthAfterSecond = health;
      if (durations[currentCaseIndex] === 0) finishCurrent(null);
    } else if (currentHitCount === 3 && durations[currentCaseIndex] === 125)
      finishCurrent(health);
  };
  const listen = (type: string, listener: EventListener): void => {
    eventTarget.addEventListener(type, listener);
    removers.push(() => eventTarget.removeEventListener(type, listener));
  };

  createCurrent();
  listen("pointerdown", ((event: PointerEvent) =>
    onPointer(event)) as EventListener);
  listen("blur", (() => {
    if (!destroyed && runtime?.snapshot().phase === "running") runtime.pause();
  }) as EventListener);
  listen("focus", (() => {
    if (!destroyed && runtime?.snapshot().phase === "stopped") runtime.resume();
  }) as EventListener);
  listen("keydown", ((event: KeyboardEvent) => {
    if (!destroyed && event.code === "KeyR") reset();
  }) as EventListener);

  const snapshot = (): Batch2DefenseBrowserRuntimeSnapshot => {
    const current = runtime?.snapshot();
    const allPassed =
      completedCases.length === 2 &&
      completedCases.every(
        (evidence) =>
          evidence.route.join(">") === "invulnerability>shield>health" &&
          evidence.cleanupResidue === 0,
      ) &&
      completedCases[0]?.sameTimeBlocked === true &&
      completedCases[0]?.exactExpiryAccepted === true &&
      completedCases[1]?.sameTimeBlocked === false;
    const cleanupResidue =
      completedCases.reduce(
        (total, evidence) => total + evidence.cleanupResidue,
        0,
      ) + (destroyed ? 0 : (current?.cleanupResidue ?? 0));
    return Object.freeze({
      phase: destroyed
        ? "destroyed"
        : runtime === undefined
          ? "complete"
          : current?.phase === "stopped"
            ? "stopped"
            : "running",
      currentCaseIndex,
      currentDurationMs: durations[currentCaseIndex] ?? null,
      currentHitCount,
      simulationTimeMs: current?.simulationTimeMs ?? 0,
      completedCases: Object.freeze([...completedCases]),
      allPassed,
      eventListenerResidue: destroyed ? removers.length : 0,
      cleanupResidue,
    });
  };

  return Object.freeze({
    frame: (deltaMs) => {
      if (!Number.isFinite(deltaMs) || deltaMs < 0)
        throw new Error("invalid defense browser delta");
      if (
        !destroyed &&
        runtime !== undefined &&
        durations[currentCaseIndex] === 125 &&
        currentHitCount === 2 &&
        !expiryAdvanced
      ) {
        runtime.frame(125);
        expiryAdvanced = true;
      }
    },
    snapshot,
    destroy: () => {
      if (destroyed) return;
      runtime?.destroy();
      runtime = undefined;
      for (const remove of removers.splice(0).reverse()) remove();
      destroyed = true;
    },
  });
}
