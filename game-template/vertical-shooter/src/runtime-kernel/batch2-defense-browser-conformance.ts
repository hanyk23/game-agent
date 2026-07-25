import { DeterministicGameModuleProductionInstantiatorV13 } from "../../../../src/modules/game-module-production-instantiator.js";
import {
  ContactDecisionPayloadSchema,
  type ContactCandidatePayload,
} from "../../../../src/modules/game-module-runtime-payloads.js";
import type { ResolvedModuleGraphV13 } from "../../../../src/modules/game-module-resolver.js";
import type { BrowserGameModuleRuntimeCatalogV13 } from "../../../../src/modules/game-module-runtime-catalog.js";
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

type Projectile = Readonly<{
  entityId: string;
  generation: number;
  channelId: string;
  ownerActorId: string;
  entityRole: "projectile";
  position: Readonly<{ x: number; y: number }>;
  velocity: Readonly<{ x: number; y: number }>;
  damage: number;
}>;

export type Batch2DefenseBrowserSnapshot = Readonly<{
  phase: string;
  simulationTimeMs: number;
  activeProjectiles: number;
  resolvedContacts: number;
  invulnerabilityActiveUntilMs: number;
  shieldCurrent: number;
  healthCurrent: number;
  inputHandlers: number;
  overlapHandlers: number;
  observationReaders: number;
  cleanupResidue: number;
}>;

export type Batch2DefenseBrowserConformanceRuntime = Readonly<{
  frame(deltaMs: number): void;
  triggerPointerAttack(worldX?: number, worldY?: number): string;
  triggerProjectileContact(entityId?: string): void;
  pause(): void;
  resume(): void;
  restart(): void;
  snapshot(): Batch2DefenseBrowserSnapshot;
  destroy(): void;
}>;

type Session = Readonly<{
  runtime: DeterministicGameModuleRuntimeV12;
  active: Map<string, Projectile>;
  inputHandlers: Map<string, (input: unknown) => unknown>;
  overlapHandlers: Map<string, (input: unknown) => unknown>;
  observations: Map<string, () => unknown>;
  coordinators: Map<string, ContactCommitCoordinatorV12>;
  readResolvedContacts(): number;
  triggerPointerAttack(worldX?: number, worldY?: number): string;
  triggerProjectileContact(entityId?: string): void;
  destroy(): void;
}>;

export function createBatch2DefenseBrowserConformanceRuntime(
  graph: ResolvedModuleGraphV13,
  catalog: BrowserGameModuleRuntimeCatalogV13,
): Batch2DefenseBrowserConformanceRuntime {
  if (graph.executionReadiness.status !== "ready")
    throw new Error("defense conformance requires a ready Graph 1.3");

  const createSession = (): Session => {
    const actors = new Map<string, Actor>(
      graph.actors.map((actor) => [
        actor.actorId,
        {
          actorId: actor.actorId,
          active: true,
          position: { x: 360, y: actor.role === "player" ? 590 : 180 },
          velocity: { x: 0, y: 0 },
        },
      ]),
    );
    const active = new Map<string, Projectile>();
    const inputHandlers = new Map<string, (input: unknown) => unknown>();
    const overlapHandlers = new Map<string, (input: unknown) => unknown>();
    const observations = new Map<string, () => unknown>();
    const coordinators = new Map<string, ContactCommitCoordinatorV12>();
    let runtime!: DeterministicGameModuleRuntimeV12;
    let resolvedContacts = 0;
    const policyEntry = catalog.findForGraph(graph, "default-policy");

    const createContext = (
      module: ResolvedModuleGraphV13["modules"][number],
      clock: unknown,
    ) => {
      const actor = actors.get(module.ownerId)!;
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
            activate: (localChannelId: string, entityInput: unknown) => {
              const source = entityInput as Omit<
                Projectile,
                "channelId" | "ownerActorId" | "entityRole"
              >;
              const projectile = Object.freeze({
                ...source,
                channelId: `${module.instanceId}.${localChannelId}`,
                ownerActorId: module.ownerId,
                entityRole: "projectile" as const,
              });
              active.set(projectile.entityId, projectile);
              return projectile;
            },
            recycle: (_localChannelId: string, entityInput: unknown) =>
              active.delete((entityInput as Projectile).entityId),
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
              const decision =
                ContactDecisionPayloadSchema.parse(decisionInput);
              const coordinator =
                coordinators.get(module.instanceId) ??
                new ContactCommitCoordinatorV12(
                  runtime.guard,
                  module.runtimeContract.contactCommit!
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
          requireTexture: (roleId: string) => `texture:${roleId}`,
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

    return Object.freeze({
      runtime,
      active,
      inputHandlers,
      overlapHandlers,
      observations,
      coordinators,
      readResolvedContacts: () => resolvedContacts,
      triggerPointerAttack: (worldX = 360, worldY = 0) => {
        const before = new Set(active.keys());
        const down = Object.freeze({
          id: 1,
          isDown: true,
          worldX,
          worldY,
        });
        inputHandlers.get("aim:aim.pointer")?.(down);
        inputHandlers.get("attack-intent:attack.pointer-down")?.(down);
        inputHandlers.get("attack-intent:attack.pointer-up")?.(
          Object.freeze({ ...down, isDown: false }),
        );
        const entityId = [...active.keys()].find((key) => !before.has(key));
        if (entityId === undefined)
          throw new Error("pointer attack emitted no projectile");
        return entityId;
      },
      triggerProjectileContact: (entityId?: string) => {
        const projectile =
          entityId === undefined
            ? active.values().next().value
            : active.get(entityId);
        if (projectile === undefined)
          throw new Error("no active projectile to contact");
        const handler = overlapHandlers.get("detector:projectile.overlap");
        if (handler === undefined)
          throw new Error("projectile overlap is inactive");
        try {
          handler({
            sourceEntityId: projectile.entityId,
            sourceGeneration: projectile.generation,
            damage: projectile.damage,
          });
        } catch (error) {
          if (error instanceof AggregateError)
            throw new AggregateError(
              error.errors,
              `${error.message}: ${error.errors.map(String).join(" | ")}`,
            );
          throw error;
        }
      },
      destroy: () => {
        runtime.dispose();
        runtime.destroy();
        active.clear();
        inputHandlers.clear();
        overlapHandlers.clear();
        observations.clear();
        coordinators.clear();
      },
    });
  };

  let session = createSession();
  let destroyed = false;
  const snapshot = (): Batch2DefenseBrowserSnapshot => {
    const invulnerability = session.observations.get(
      "invulnerability:invulnerability",
    )?.() as { activeUntilMs?: number } | undefined;
    const shield = session.observations.get("shield:shield")?.() as
      { current?: number } | undefined;
    const health = session.observations.get("health:health")?.() as
      { current?: number } | undefined;
    const cleanupResidue = destroyed
      ? session.active.size +
        session.inputHandlers.size +
        session.overlapHandlers.size +
        session.observations.size +
        session.coordinators.size
      : 0;
    return Object.freeze({
      phase: session.runtime.phase,
      simulationTimeMs: session.runtime.clock.nowMs(),
      activeProjectiles: session.active.size,
      resolvedContacts: session.readResolvedContacts(),
      invulnerabilityActiveUntilMs: invulnerability?.activeUntilMs ?? 0,
      shieldCurrent: shield?.current ?? 0,
      healthCurrent: health?.current ?? 0,
      inputHandlers: session.inputHandlers.size,
      overlapHandlers: session.overlapHandlers.size,
      observationReaders: session.observations.size,
      cleanupResidue,
    });
  };

  return Object.freeze({
    frame: (deltaMs) => session.runtime.frame(deltaMs),
    triggerPointerAttack: (worldX, worldY) =>
      session.triggerPointerAttack(worldX, worldY),
    triggerProjectileContact: (entityId) =>
      session.triggerProjectileContact(entityId),
    pause: () => session.runtime.stop(),
    resume: () => session.runtime.start(),
    restart: () => {
      session.destroy();
      session = createSession();
      destroyed = false;
    },
    snapshot,
    destroy: () => {
      if (destroyed) return;
      session.destroy();
      destroyed = true;
    },
  });
}
