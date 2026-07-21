import {
  batch2FormationGraphs,
  batch2FormationRuntimeCatalogs,
} from "../generated/batch2-formations.js";
import { DeterministicGameModuleProductionInstantiatorV13 } from "../../../../src/modules/game-module-production-instantiator.js";
import type { DeterministicGameModuleRuntimeV12 } from "../../../../src/modules/game-module-runtime-abi-v12.js";

type Actor = {
  actorId: string;
  active: boolean;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
};

type FormationProjectile = Readonly<{
  entityId: string;
  generation: number;
  channelId: string;
  ownerActorId: string;
  entityRole: "projectile";
  position: Readonly<{ x: number; y: number }>;
  velocity: Readonly<{ x: number; y: number }>;
  damage: number;
}>;

export type Batch2FormationCaseEvidence = Readonly<{
  caseId: string;
  moduleId: string;
  requestedAttacks: number;
  activatedProjectiles: number;
  finiteGeometry: boolean;
  distinctDirections: number;
  cleanup: Readonly<{
    active: number;
    input: number;
    overlap: number;
    observation: number;
  }>;
}>;

export type Batch2FormationBrowserSnapshot = Readonly<{
  phase: "running" | "complete" | "destroyed";
  currentCaseIndex: number;
  currentCaseId: string | null;
  completedCases: readonly Batch2FormationCaseEvidence[];
  activeProjectiles: number;
  inputHandlers: number;
  overlapHandlers: number;
  observationReaders: number;
  allPassed: boolean;
}>;

export type Batch2FormationBrowserRuntime = Readonly<{
  frame(deltaMs: number): void;
  snapshot(): Batch2FormationBrowserSnapshot;
  destroy(): void;
}>;

export function createBatch2FormationBrowserRuntime(
  canvas: HTMLCanvasElement,
): Batch2FormationBrowserRuntime {
  const active = new Map<string, FormationProjectile>();
  const inputHandlers = new Map<string, (input: unknown) => unknown>();
  const overlapHandlers = new Map<string, (input: unknown) => unknown>();
  const observations = new Map<string, () => unknown>();
  const completedCases: Batch2FormationCaseEvidence[] = [];
  const removers: Array<() => void> = [];
  const activatedGeometry: FormationProjectile[] = [];
  const observationReleases: Array<() => void> = [];
  let runtime: DeterministicGameModuleRuntimeV12 | undefined;
  let currentCaseIndex = 0;
  let destroyed = false;

  const currentGraph = () => batch2FormationGraphs[currentCaseIndex];
  const listen = <K extends keyof WindowEventMap>(
    type: K,
    listener: (event: WindowEventMap[K]) => void,
  ) => {
    window.addEventListener(type, listener);
    removers.push(() => window.removeEventListener(type, listener));
  };
  const pointer = (event: PointerEvent, isDown: boolean) => {
    const rect = canvas.getBoundingClientRect();
    return Object.freeze({
      id: event.pointerId,
      isDown,
      worldX: ((event.clientX - rect.left) / rect.width) * 720,
      worldY: ((event.clientY - rect.top) / rect.height) * 720,
    });
  };

  const createCurrentRuntime = (): void => {
    const graph = currentGraph();
    const catalog = batch2FormationRuntimeCatalogs[currentCaseIndex];
    if (graph === undefined || catalog === undefined) return;
    active.clear();
    activatedGeometry.splice(0);
    const actors: Record<string, Actor> = {
      "player-one": {
        actorId: "player-one",
        active: true,
        position: { x: 360, y: 590 },
        velocity: { x: 0, y: 0 },
      },
      "enemy-one": {
        actorId: "enemy-one",
        active: true,
        position: { x: 360, y: 180 },
        velocity: { x: 0, y: 0 },
      },
    };
    const createContext = (
      module: (typeof graph.modules)[number],
      clock: unknown,
    ) => {
      const actor = actors[module.ownerId]!;
      return {
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
            readOwner: () => actor,
            writeOwnerMotion: (motion: Readonly<{ x: number; y: number }>) => {
              actor.velocity = { ...motion };
            },
            writeOwnerPosition: (
              position: Readonly<{ x: number; y: number }>,
            ) => {
              actor.position = { ...position };
            },
          },
          input: {
            register: (id: string, handler: (input: unknown) => unknown) => {
              const key = `${module.instanceId}:${id}`;
              inputHandlers.set(key, handler);
              return () => inputHandlers.delete(key);
            },
          },
          overlaps: {
            register: (id: string, handler: (input: unknown) => unknown) => {
              const key = `${module.instanceId}:${id}`;
              overlapHandlers.set(key, handler);
              return () => overlapHandlers.delete(key);
            },
          },
          channels: {
            activate: (channelId: string, entity: unknown) => {
              const source = entity as Omit<
                FormationProjectile,
                "channelId" | "ownerActorId" | "entityRole"
              >;
              const projectile: FormationProjectile = Object.freeze({
                ...source,
                channelId: `${module.instanceId}.${channelId}`,
                ownerActorId: module.ownerId,
                entityRole: "projectile",
                position: Object.freeze({ ...source.position }),
                velocity: Object.freeze({ ...source.velocity }),
              });
              active.set(projectile.entityId, projectile);
              activatedGeometry.push(projectile);
              return projectile;
            },
            recycle: (_channelId: string, entity: unknown) =>
              active.delete((entity as FormationProjectile).entityId),
            read: () => Object.freeze([...active.values()]),
          },
          observation: {
            register: (id: string, reader: () => unknown) => {
              const key = `${module.instanceId}:${id}`;
              observations.set(key, reader);
              const release = () => observations.delete(key);
              observationReleases.push(release);
              return release;
            },
          },
          contact: {
            executePolicy: () => {
              throw new Error("formation conformance does not execute contact");
            },
            prepareCommit: () => {
              throw new Error("formation conformance does not prepare contact");
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
          requireTexture: () => graph.assetBindings[0]!.textureKey,
          optionalTexture: () => undefined,
        },
      };
    };

    runtime = DeterministicGameModuleProductionInstantiatorV13.create({
      graph,
      catalog,
      createContextV12: (module, clock) =>
        createContext(module, clock) as never,
      createContextV13: (module, clock) =>
        createContext(module, clock) as never,
      registerAddressedHandler: () => undefined,
    });
    runtime.initialize();
    runtime.start();
  };

  const finishCurrentCase = (): void => {
    const graph = currentGraph();
    const activeRuntime = runtime;
    if (graph === undefined || activeRuntime === undefined) return;
    const delivery = graph.modules.find(
      ({ instanceId }) => instanceId === "delivery",
    )!;
    const observation = observations.get("delivery:delivery")?.() as
      | Partial<{
          requestedRequests: number;
          activatedProjectiles: number;
        }>
      | undefined;
    const finiteGeometry = activatedGeometry.every((projectile) =>
      [
        projectile.position.x,
        projectile.position.y,
        projectile.velocity.x,
        projectile.velocity.y,
        projectile.damage,
      ].every(Number.isFinite),
    );
    const distinctDirections = new Set(
      activatedGeometry.map(
        ({ velocity }) => `${velocity.x.toFixed(6)},${velocity.y.toFixed(6)}`,
      ),
    ).size;
    const requestedAttacks = observation?.requestedRequests ?? 0;
    const activatedProjectiles = observation?.activatedProjectiles ?? 0;
    activeRuntime.stop();
    const stoppedActive = active.size;
    const stoppedInput = inputHandlers.size;
    const stoppedOverlap = overlapHandlers.size;
    activeRuntime.dispose();
    activeRuntime.destroy();
    for (const release of observationReleases.splice(0)) release();
    runtime = undefined;
    completedCases.push(
      Object.freeze({
        caseId: graph.assemblyId.replace("batch2.formation-", ""),
        moduleId: delivery.moduleId,
        requestedAttacks,
        activatedProjectiles,
        finiteGeometry,
        distinctDirections,
        cleanup: Object.freeze({
          active: stoppedActive,
          input: stoppedInput,
          overlap: stoppedOverlap,
          observation: observations.size,
        }),
      }),
    );
    currentCaseIndex += 1;
    createCurrentRuntime();
  };

  listen("pointerdown", (event) => {
    if (destroyed || runtime === undefined) return;
    try {
      const value = pointer(event, true);
      inputHandlers.get("aim:aim.pointer")?.(value);
      inputHandlers.get("attack-intent:attack.pointer-down")?.(value);
    } catch (error) {
      const nested =
        error instanceof AggregateError
          ? error.errors.map((item) => String(item)).join(" | ")
          : String(error);
      throw new Error(
        `formation ${currentGraph()?.assemblyId ?? "unknown"} pointerdown failed: ${nested}`,
      );
    }
  });
  listen("pointermove", (event) => {
    if (destroyed || runtime === undefined) return;
    inputHandlers.get("aim:aim.pointer")?.(
      pointer(event, (event.buttons & 1) !== 0),
    );
  });
  listen("pointerup", (event) => {
    if (destroyed || runtime === undefined) return;
    inputHandlers.get("attack-intent:attack.pointer-up")?.(
      pointer(event, false),
    );
    finishCurrentCase();
  });
  createCurrentRuntime();

  const snapshot = (): Batch2FormationBrowserSnapshot => {
    const allPassed =
      completedCases.length === batch2FormationGraphs.length &&
      completedCases.every(
        ({ requestedAttacks, activatedProjectiles, finiteGeometry, cleanup }) =>
          requestedAttacks === 1 &&
          activatedProjectiles === 3 &&
          finiteGeometry &&
          cleanup.active === 0 &&
          cleanup.input === 0 &&
          cleanup.overlap === 0 &&
          cleanup.observation === 0,
      );
    return Object.freeze({
      phase: destroyed
        ? "destroyed"
        : currentCaseIndex >= batch2FormationGraphs.length
          ? "complete"
          : "running",
      currentCaseIndex,
      currentCaseId:
        currentGraph()?.assemblyId.replace("batch2.formation-", "") ?? null,
      completedCases: Object.freeze([...completedCases]),
      activeProjectiles: active.size,
      inputHandlers: inputHandlers.size,
      overlapHandlers: overlapHandlers.size,
      observationReaders: observations.size,
      allPassed,
    });
  };

  return Object.freeze({
    frame: (deltaMs: number) => {
      if (runtime === undefined) return;
      runtime.frame(Math.min(250, Math.max(0, deltaMs)));
    },
    snapshot,
    destroy: () => {
      if (destroyed) return;
      for (const remove of removers.splice(0)) remove();
      if (runtime !== undefined) {
        runtime.dispose();
        runtime.destroy();
        runtime = undefined;
      }
      destroyed = true;
    },
  });
}
