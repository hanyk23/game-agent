import {
  batch1ResolvedGraph,
  batch1RuntimeCatalog,
} from "../generated/batch1-runtime.js";
import { DeterministicGameModuleProductionInstantiatorV12 } from "../../../../src/modules/game-module-production-instantiator.js";
import {
  ContactDecisionPayloadSchema,
  type ContactCandidatePayload,
} from "../../../../src/modules/game-module-runtime-payloads.js";
import {
  ContactCommitCoordinatorV12,
  type DeterministicGameModuleRuntimeV12,
} from "../../../../src/modules/game-module-runtime-abi-v12.js";

export type Batch1BrowserSnapshot = Readonly<{
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
  emittedProjectiles: number;
  resolvedContacts: number;
}>;

type SemanticActor = {
  actorId: string;
  active: boolean;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
};
type SemanticEntity = {
  entityId: string;
  generation: number;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  damage: number;
};

export type Batch1BrowserRuntime = Readonly<{
  frame(deltaMs: number): void;
  snapshot(): Batch1BrowserSnapshot;
  destroy(): void;
}>;

export function createBatch1BrowserRuntime(
  canvas: HTMLCanvasElement,
): Batch1BrowserRuntime {
  const actors: Record<string, SemanticActor> = {
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
  const active = new Map<string, SemanticEntity>();
  const inputHandlers = new Map<string, (input: unknown) => unknown>();
  const overlapHandlers = new Map<string, (input: unknown) => unknown>();
  const observations = new Map<string, () => unknown>();
  const pressed = new Set<string>();
  const removers: Array<() => void> = [];
  let runtime!: DeterministicGameModuleRuntimeV12;
  let resolvedContacts = 0;
  const coordinators = new Map<string, ContactCommitCoordinatorV12>();
  const policyEntry = batch1RuntimeCatalog.findForGraph(
    batch1ResolvedGraph,
    "default-policy",
  );

  const listen = <K extends keyof WindowEventMap>(
    type: K,
    listener: (event: WindowEventMap[K]) => void,
  ) => {
    window.addEventListener(type, listener);
    removers.push(() => window.removeEventListener(type, listener));
  };
  listen("keydown", (event) => pressed.add(event.code));
  listen("keyup", (event) => pressed.delete(event.code));
  const pointer = (event: PointerEvent, isDown: boolean) => {
    const rect = canvas.getBoundingClientRect();
    return Object.freeze({
      id: event.pointerId,
      isDown,
      worldX: ((event.clientX - rect.left) / rect.width) * 720,
      worldY: ((event.clientY - rect.top) / rect.height) * 720,
    });
  };
  listen("pointerdown", (event) =>
    inputHandlers.get("touch:pointer.down")?.(pointer(event, true)),
  );
  listen("pointermove", (event) => {
    if ((event.buttons & 1) !== 0)
      inputHandlers.get("touch:pointer.move")?.(pointer(event, true));
  });
  listen("pointerup", (event) =>
    inputHandlers.get("touch:pointer.up")?.(pointer(event, false)),
  );

  runtime = DeterministicGameModuleProductionInstantiatorV12.create({
    graph: batch1ResolvedGraph,
    catalog: batch1RuntimeCatalog,
    createContext: (module, clock) => {
      const actor = actors[module.ownerId]!;
      return Object.freeze({
        identity: Object.freeze({
          instanceId: module.instanceId,
          ownerId: module.ownerId,
          moduleId: module.moduleId,
          version: module.version,
          artifactEnvelopeSha256: module.artifactIdentity!.envelopeSha256,
        }),
        configuration: module.configuration as Readonly<unknown>,
        services: Object.freeze({
          viewport: Object.freeze({
            read: () => ({ width: 720, height: 720 }),
          }),
          actors: Object.freeze({
            readOwner: () => actor,
            writeOwnerMotion: (motion: Readonly<{ x: number; y: number }>) => {
              actor.velocity = { ...motion };
            },
            writeOwnerPosition: (
              position: Readonly<{ x: number; y: number }>,
            ) => {
              actor.position = { ...position };
            },
          }),
          input: Object.freeze({
            register: (id: string, handler: (input: unknown) => unknown) => {
              const key = `${module.instanceId}:${id}`;
              inputHandlers.set(key, handler);
              return () => inputHandlers.delete(key);
            },
          }),
          overlaps: Object.freeze({
            register: (id: string, handler: (input: unknown) => unknown) => {
              const key = `${module.instanceId}:${id}`;
              overlapHandlers.set(key, handler);
              return () => overlapHandlers.delete(key);
            },
          }),
          channels: Object.freeze({
            activate: (_id: string, entity: unknown) => {
              const source = entity as SemanticEntity;
              const value: SemanticEntity = {
                ...source,
                position: { ...source.position },
                velocity: { ...source.velocity },
              };
              active.set(value.entityId, value);
              return value;
            },
            recycle: (_id: string, entity: unknown) => {
              active.delete((entity as SemanticEntity).entityId);
            },
            read: () => Object.freeze([...active.values()]),
          }),
          observation: Object.freeze({
            register: (id: string, reader: () => unknown) => {
              const key = `${module.instanceId}:${id}`;
              observations.set(key, reader);
              return () => observations.delete(key);
            },
          }),
          contact: Object.freeze({
            executePolicy: (candidateInput: unknown) => {
              const candidate = candidateInput as ContactCandidatePayload;
              const seed = Object.freeze({
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
              });
              const decision = ContactDecisionPayloadSchema.parse(
                policyEntry.executable(seed),
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
              const decision =
                ContactDecisionPayloadSchema.parse(decisionInput);
              if (
                decision.disposition !== "damage" ||
                decision.sourceOperation !== "consume"
              )
                throw new Error("Batch 1 browser policy drift");
              const coordinator =
                coordinators.get(module.instanceId) ??
                new ContactCommitCoordinatorV12(
                  runtime.guard,
                  module.runtimeContract!.contactCommit!
                    .maximumConcurrentCommits,
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
                sourceOperation: "consume",
                applySourceOperation: () => {
                  const removed = active.delete(candidate.sourceEntityId);
                  return Object.freeze({ physical: removed, logical: removed });
                },
                deliverHit: deliveries.hit,
                deliverDamage: (evidenceId) => {
                  const result = deliveries.damage(evidenceId);
                  resolvedContacts += 1;
                  return result;
                },
                quarantine: () => undefined,
              });
            },
          }),
        }),
        ports: Object.freeze({
          declareHandler: () => undefined,
          publishState: () => undefined,
          emitEvent: () => undefined,
        }),
        clock,
        assets: Object.freeze({
          requireTexture: () =>
            batch1ResolvedGraph.assetBindings[0]!.textureKey,
          optionalTexture: () => undefined,
        }),
      });
    },
  });
  runtime.initialize();
  runtime.start();

  const snapshot = (): Batch1BrowserSnapshot => {
    const player = actors["player-one"]!;
    const health = observations.get("health:health")?.() as
      { current?: number } | undefined;
    const delivery = observations.get("delivery:delivery")?.() as
      { emissions?: number } | undefined;
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
      emittedProjectiles: delivery?.emissions ?? 0,
      resolvedContacts,
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
      const seconds = accepted / 1000;
      for (const actor of Object.values(actors)) {
        actor.position.x += actor.velocity.x * seconds;
        actor.position.y += actor.velocity.y * seconds;
      }
      for (const entity of active.values()) {
        entity.position.x += entity.velocity.x * seconds;
        entity.position.y += entity.velocity.y * seconds;
      }
      try {
        runtime.frame(accepted);
      } catch (error) {
        const details = runtime.cleanupReport?.failures
          .map((failure) =>
            failure instanceof Error ? failure.message : String(failure),
          )
          .join(" | ");
        throw new Error(
          `Batch 1 browser frame failed: ${details ?? "unknown"}`,
          {
            cause: error,
          },
        );
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
    },
  });
}
