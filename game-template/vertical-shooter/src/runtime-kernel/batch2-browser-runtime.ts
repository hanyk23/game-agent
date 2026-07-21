import {
  batch2ResolvedGraph,
  batch2RuntimeCatalog,
} from "../generated/batch2-runtime.js";
import { DeterministicGameModuleProductionInstantiatorV13 } from "../../../../src/modules/game-module-production-instantiator.js";
import {
  ContactDecisionPayloadSchema,
  type ContactCandidatePayload,
} from "../../../../src/modules/game-module-runtime-payloads.js";
import {
  ContactCommitCoordinatorV12,
  type DeterministicGameModuleRuntimeV12,
} from "../../../../src/modules/game-module-runtime-abi-v12.js";

type Actor = {
  actorId: string;
  active: boolean;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
};
type Projectile = {
  entityId: string;
  generation: number;
  channelId: string;
  ownerActorId: string;
  entityRole: "projectile";
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  damage: number;
};

export type Batch2BrowserSnapshot = Readonly<{
  phase: string;
  frameSequence: number;
  simulationTimeMs: number;
  player: Readonly<{
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
  }>;
  enemyHealth: number;
  activeProjectiles: number;
  requestedAttacks: number;
  emittedProjectiles: number;
  droppedByRate: number;
  droppedByPool: number;
  resolvedContacts: number;
  cleanupResidue: number;
}>;

export type Batch2BrowserRuntime = Readonly<{
  frame(deltaMs: number): void;
  snapshot(): Batch2BrowserSnapshot;
  destroy(): void;
}>;

export function createBatch2BrowserRuntime(
  canvas: HTMLCanvasElement,
): Batch2BrowserRuntime {
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
  const active = new Map<string, Projectile>();
  const inputHandlers = new Map<string, (input: unknown) => unknown>();
  const overlapHandlers = new Map<string, (input: unknown) => unknown>();
  const observations = new Map<string, () => unknown>();
  const pressed = new Set<string>();
  const removers: Array<() => void> = [];
  const coordinators = new Map<string, ContactCommitCoordinatorV12>();
  let runtime!: DeterministicGameModuleRuntimeV12;
  let resolvedContacts = 0;
  let destroyed = false;
  const policyEntry = batch2RuntimeCatalog.findForGraph(
    batch2ResolvedGraph,
    "default-policy",
  );

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
  listen("keydown", (event) => {
    pressed.add(event.code);
    if (event.code === "ShiftLeft")
      inputHandlers.get("focus:focus.keyboard")?.({ phase: "press" });
  });
  listen("keyup", (event) => {
    pressed.delete(event.code);
    if (event.code === "ShiftLeft")
      inputHandlers.get("focus:focus.keyboard")?.({ phase: "release" });
  });
  listen("pointerdown", (event) => {
    try {
      const value = pointer(event, true);
      inputHandlers.get("touch:pointer.down")?.(value);
      inputHandlers.get("aim:aim.pointer")?.(value);
      inputHandlers.get("attack-intent:attack.pointer-down")?.(value);
    } catch (error) {
      const nested =
        error instanceof AggregateError
          ? error.errors.map((item) => String(item)).join(" | ")
          : String(error);
      throw new Error(`Batch 2 pointerdown failed: ${nested}`);
    }
  });
  listen("pointermove", (event) => {
    const value = pointer(event, (event.buttons & 1) !== 0);
    inputHandlers.get("aim:aim.pointer")?.(value);
    if (value.isDown) inputHandlers.get("touch:pointer.move")?.(value);
  });
  listen("pointerup", (event) => {
    const value = pointer(event, false);
    inputHandlers.get("touch:pointer.up")?.(value);
    inputHandlers.get("attack-intent:attack.pointer-up")?.(value);
  });

  const createContext = (
    module: (typeof batch2ResolvedGraph.modules)[number],
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
              Projectile,
              "channelId" | "ownerActorId" | "entityRole"
            >;
            const value: Projectile = {
              ...source,
              channelId: `${module.instanceId}.${channelId}`,
              ownerActorId: module.ownerId,
              entityRole: "projectile",
              position: { ...source.position },
              velocity: { ...source.velocity },
            };
            active.set(value.entityId, value);
            return value;
          },
          recycle: (_channelId: string, entity: unknown) =>
            active.delete((entity as Projectile).entityId),
          read: () => Object.freeze([...active.values()]),
        },
        observation: {
          register: (id: string, reader: () => unknown) => {
            const key = `${module.instanceId}:${id}`;
            observations.set(key, reader);
            return () => observations.delete(key);
          },
        },
        contact: {
          executePolicy: (candidateInput: unknown) => {
            const candidate = candidateInput as ContactCandidatePayload;
            const decision = ContactDecisionPayloadSchema.parse(
              policyEntry.executable(
                Object.freeze({
                  contactId: candidate.contactId,
                  sourceChannelId: candidate.sourceChannelId,
                  sourceEntityId: candidate.sourceEntityId,
                  sourceGeneration: candidate.sourceGeneration,
                  sourceActorId: candidate.sourceActorId,
                  targetActorId: candidate.targetActorId,
                  contactSequence: candidate.contactSequence,
                  metadata: candidate.metadata,
                  disposition: "ignore" as const,
                  sourceOperation: "retain" as const,
                  policyTrace: Object.freeze([]),
                }),
              ),
            );
            return Object.freeze({
              ...decision,
              policyTrace: Object.freeze([
                "interaction.contact-default-damage",
              ]),
            });
          },
          prepareCommit: (
            candidateInput: unknown,
            decisionInput: unknown,
            deliveries: Readonly<{
              hit(evidenceId: number): unknown;
              damage(evidenceId: number): unknown;
            }>,
          ) => {
            const candidate = candidateInput as ContactCandidatePayload;
            const decision = ContactDecisionPayloadSchema.parse(decisionInput);
            const coordinator =
              coordinators.get(module.instanceId) ??
              new ContactCommitCoordinatorV12(
                runtime.guard,
                module.runtimeContract.contactCommit!.maximumConcurrentCommits,
              );
            coordinators.set(module.instanceId, coordinator);
            return coordinator.prepare({
              contactIdentity: {
                producerInstanceId: module.instanceId,
                producerSequence: candidate.contactSequence,
                sourceChannelId: candidate.sourceChannelId,
                sourceEntityId: candidate.sourceEntityId,
                sourceGeneration: candidate.sourceGeneration,
              },
              sourceOperation: decision.sourceOperation as "consume",
              applySourceOperation: () => {
                const removed = active.delete(candidate.sourceEntityId);
                return Object.freeze({ physical: removed, logical: removed });
              },
              deliverHit: deliveries.hit,
              deliverDamage: (evidenceId) => {
                const value = deliveries.damage(evidenceId);
                resolvedContacts += 1;
                return value;
              },
              quarantine: () => undefined,
            });
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
        requireTexture: () => batch2ResolvedGraph.assetBindings[0]!.textureKey,
        optionalTexture: () => undefined,
      },
    };
  };

  runtime = DeterministicGameModuleProductionInstantiatorV13.create({
    graph: batch2ResolvedGraph,
    catalog: batch2RuntimeCatalog,
    createContextV12: (module, clock) => createContext(module, clock) as never,
    createContextV13: (module, clock) => createContext(module, clock) as never,
    registerAddressedHandler: () => undefined,
  });
  runtime.initialize();
  runtime.start();

  const snapshot = (): Batch2BrowserSnapshot => {
    const player = actors["player-one"]!;
    const health = observations.get("health:health")?.() as
      { current?: number } | undefined;
    const delivery = observations.get("delivery:delivery")?.() as
      | Partial<{
          requestedRequests: number;
          activatedProjectiles: number;
          droppedRequestsByRate: number;
          droppedProjectilesByPool: number;
        }>
      | undefined;
    return Object.freeze({
      phase: runtime.phase,
      frameSequence: runtime.clock.frameSequence,
      simulationTimeMs: runtime.clock.nowMs(),
      player: Object.freeze({
        x: player.position.x,
        y: player.position.y,
        velocityX: player.velocity.x,
        velocityY: player.velocity.y,
      }),
      enemyHealth: health?.current ?? 0,
      activeProjectiles: active.size,
      requestedAttacks: delivery?.requestedRequests ?? 0,
      emittedProjectiles: delivery?.activatedProjectiles ?? 0,
      droppedByRate: delivery?.droppedRequestsByRate ?? 0,
      droppedByPool: delivery?.droppedProjectilesByPool ?? 0,
      resolvedContacts,
      cleanupResidue: destroyed
        ? active.size +
          inputHandlers.size +
          overlapHandlers.size +
          observations.size
        : 0,
    });
  };

  return Object.freeze({
    frame: (deltaMs: number) => {
      const horizontal =
        (pressed.has("ArrowRight") || pressed.has("KeyD") ? 1 : 0) -
        (pressed.has("ArrowLeft") || pressed.has("KeyA") ? 1 : 0);
      const vertical =
        (pressed.has("ArrowDown") || pressed.has("KeyS") ? 1 : 0) -
        (pressed.has("ArrowUp") || pressed.has("KeyW") ? 1 : 0);
      inputHandlers.get("keyboard:keyboard.direction")?.({
        x: horizontal,
        y: vertical,
      });
      const accepted = Math.min(250, Math.max(0, deltaMs));
      runtime.frame(accepted);
      const seconds = accepted / 1000;
      for (const actor of Object.values(actors)) {
        actor.position.x += actor.velocity.x * seconds;
        actor.position.y += actor.velocity.y * seconds;
      }
      for (const entity of active.values()) {
        entity.position.x += entity.velocity.x * seconds;
        entity.position.y += entity.velocity.y * seconds;
      }
      for (const entity of [...active.values()]) {
        if (entity.position.y <= actors["enemy-one"]!.position.y) {
          overlapHandlers.get("detector:projectile.overlap")?.({
            sourceEntityId: entity.entityId,
            sourceGeneration: entity.generation,
            damage: entity.damage,
          });
        }
      }
    },
    snapshot,
    destroy: () => {
      for (const remove of removers.splice(0)) remove();
      runtime.dispose();
      runtime.destroy();
      destroyed = true;
    },
  });
}
