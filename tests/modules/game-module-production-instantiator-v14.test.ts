import { describe, expect, it, vi } from "vitest";

import { FrameTailOutcomeAuthorityAdapterV14 } from "../../src/modules/game-module-outcome-authority-adapter-v14.js";
import { FrameTailOutcomeHostV1 } from "../../src/modules/game-module-outcome-host.js";
import { HostileAttackLineageRouterV1 } from "../../src/modules/game-module-hostile-attack-router.js";
import type { GraphAuthorityAdaptersV14 } from "../../src/modules/game-module-production-authority-v14.js";
import {
  DeterministicGameModuleProductionInstantiatorV14,
  type ProductionModuleV14View,
} from "../../src/modules/game-module-production-instantiator.js";
import type { ResolvedModuleGraphV14 } from "../../src/modules/game-module-resolver-v14.js";
import { BrowserGameModuleRuntimeCatalogV14 } from "../../src/modules/game-module-runtime-catalog.js";
import { GraphBoundScoreLedgerAdapterV14 } from "../../src/modules/game-module-score-authority-adapter-v14.js";
import type {
  GameModuleFactoryContextV12,
  GameModuleFactoryContextV13,
  GameModuleFactoryContextV14,
} from "../../src/modules/game-module-runtime-factory.js";
import type { GraphTransitionGuard } from "../../src/modules/game-module-runtime-abi-v12.js";

const hash = (character: string): string => character.repeat(64);

function moduleView(
  instanceId: string,
  factoryContextVersion: "1.2.0" | "1.3.0" | "1.4.0",
  inputPorts: readonly Readonly<{
    id: string;
    payloadType: string;
    delivery: "state" | "event";
    required: boolean;
  }>[] = [],
  outputPorts: readonly Readonly<{
    id: string;
    payloadType: string;
    delivery: "state" | "event";
  }>[] = [],
  update = false,
): ProductionModuleV14View {
  return {
    instanceId,
    ownerId: "world",
    moduleId: `test.${instanceId}`,
    version: "1.0.0",
    kind: "outcome",
    implementationId: `test.${instanceId}.v1`,
    configurationSchemaId: `test.${instanceId}.config`,
    configuration: {},
    instantiation: "production-eligible",
    manifestSchemaVersion: factoryContextVersion,
    factoryContextVersion,
    runtimeContract: {
      update: update ? { mode: "frame", order: 0 } : null,
      timerSlots: { slotGroupId: "main" },
      inputRegistrations: [],
      observationReaders: [],
      contactCommit: null,
    },
    runtimeAuthorities: {
      ownsPlayerLocomotion: false,
      inputRegistrationIds: [],
      overlapRuleId: null,
      observationReaderIds: [],
      ownedPoolIds: [],
      ownedChannelIds: [],
      modifierTargetFieldIds: [],
    },
    runtimePorts: { inputPorts, outputPorts },
    resourceGrant: {
      activeEntities: 0,
      activeProjectiles: 0,
      spawnsPerSecond: 0,
      timers: 0,
    },
    artifactIdentity: { envelopeSha256: hash("a") },
    catalogEntryEvidenceId: hash("b"),
  } as unknown as ProductionModuleV14View;
}

function graph(
  modules: readonly ProductionModuleV14View[],
  additions: Record<string, unknown> = {},
): ResolvedModuleGraphV14 {
  return {
    graphVersion: "1.4.0",
    executionReadiness: { status: "ready", evidenceId: hash("e") },
    catalogEvidenceId: hash("c"),
    constructionOrder: modules.map((module) => module.instanceId),
    modules,
    bindings: [],
    entityChannels: [],
    attackChannels: [],
    actorSnapshotGrants: [],
    entityChannelReadGrants: [],
    pickupEffectPlans: [],
    effectApplicationRoutes: [],
    actorRootChannels: [],
    hostileAttackChannels: [],
    hostileContentionGroups: [],
    actorSetDamageRoutes: [],
    actorRootMutationGrants: [],
    scoringAuthority: null,
    outcomeAuthority: null,
    ...additions,
  } as unknown as ResolvedModuleGraphV14;
}

function baseServices() {
  return {
    viewport: { read: () => ({}) },
    actors: {
      readOwner: () => ({}),
      readPlayer: () => ({}),
      writeOwnerMotion: () => undefined,
    },
    input: { register: () => () => undefined },
    overlaps: { register: () => () => undefined },
    channels: {
      activate: (_id: string, value: unknown) => value,
      recycle: () => undefined,
      read: () => [],
    },
    observation: { register: () => () => undefined },
    contact: {
      prepare: () => ({}),
      commit: () => ({}),
    },
  } as unknown as GameModuleFactoryContextV12["services"];
}

function context(
  module: ProductionModuleV14View,
  clock: GameModuleFactoryContextV12["clock"],
) {
  return {
    identity: {
      instanceId: module.instanceId,
      ownerId: module.ownerId,
      moduleId: module.moduleId,
      version: module.version,
      artifactEnvelopeSha256: module.artifactIdentity!.envelopeSha256,
    },
    configuration: module.configuration,
    services: baseServices(),
    ports: {
      declareHandler: () => undefined,
      declareAddressedHandler: () => undefined,
      publishState: () => undefined,
      emitEvent: () => undefined,
    },
    clock,
    assets: {
      requireTexture: (roleId: string) => roleId,
      optionalTexture: () => undefined,
    },
  };
}

function catalog(
  resolved: ResolvedModuleGraphV14,
  factories: Readonly<Record<string, (context: unknown) => unknown>>,
) {
  return new BrowserGameModuleRuntimeCatalogV14({
    catalogEvidenceId: resolved.catalogEvidenceId!,
    entries: resolved.modules.map((module) => ({
      moduleId: module.moduleId,
      version: module.version,
      envelopeSha256: module.artifactIdentity!.envelopeSha256,
      implementationId: module.implementationId,
      manifestSchemaVersion: module.manifestSchemaVersion,
      factoryContextVersion: module.factoryContextVersion,
      exportKind: "lifecycle-create-v1",
      entryEvidenceId: module.catalogEntryEvidenceId!,
      executable: factories[module.instanceId] ?? (() => ({})),
    })),
  });
}

const noAuthorityAdapters: GraphAuthorityAdaptersV14 = {};

function outcomeModules(providerUpdates = false) {
  const conditionOutput = [
    {
      id: "condition",
      payloadType: "outcome-condition-v1",
      delivery: "state" as const,
    },
  ];
  return {
    coordinator: moduleView("coordinator", "1.4.0", [
      {
        id: "win",
        payloadType: "outcome-condition-v1",
        delivery: "state",
        required: true,
      },
      {
        id: "loss",
        payloadType: "outcome-condition-v1",
        delivery: "state",
        required: true,
      },
    ]),
    win: moduleView(
      "outcome-win",
      "1.4.0",
      [],
      conditionOutput,
      providerUpdates,
    ),
    loss: moduleView(
      "outcome-loss",
      "1.4.0",
      [],
      conditionOutput,
      providerUpdates,
    ),
  };
}

function outcomeAuthorityAdditions() {
  return {
    bindings: [
      {
        from: { instanceId: "outcome-win", portId: "condition" },
        to: { instanceId: "coordinator", portId: "win" },
        payloadType: "outcome-condition-v1",
        delivery: "state",
      },
      {
        from: { instanceId: "outcome-loss", portId: "condition" },
        to: { instanceId: "coordinator", portId: "loss" },
        payloadType: "outcome-condition-v1",
        delivery: "state",
      },
    ],
    outcomeAuthority: {
      coordinatorInstanceId: "coordinator",
      winConditionInstanceId: "outcome-win",
      lossConditionInstanceId: "outcome-loss",
      winConditionStateInputPort: "win",
      lossConditionStateInputPort: "loss",
      arbitrationPhase: "post-provider-post-event-frame-v1",
      commitServiceId: "outcome.commit",
    },
  };
}

describe("Graph 1.4 production instantiator", () => {
  it.each([
    {
      targetingMode: "fixed",
      targetingProposal: { direction: { x: 0, y: 1 } },
      expectedDirection: { x: 0, y: 1 },
    },
    {
      targetingMode: "aimed",
      targetingProposal: { targetPosition: { x: 28, y: 44 } },
      expectedDirection: { x: 0.6, y: 0.8 },
    },
  ])(
    "host-mints the production V3 source position for $targetingMode targeting",
    ({ targetingProposal, expectedDirection }) => {
      const disposeRouter = vi.spyOn(
        HostileAttackLineageRouterV1.prototype,
        "dispose",
      );
      const source = moduleView(
        "hostile-source",
        "1.4.0",
        [],
        [
          {
            id: "requests",
            payloadType: "attack-request-v3",
            delivery: "event",
          },
        ],
        true,
      );
      const targeting = moduleView(
        "hostile-targeting",
        "1.4.0",
        [
          {
            id: "requests",
            payloadType: "attack-request-v3",
            delivery: "event",
            required: true,
          },
        ],
        [
          {
            id: "targeted",
            payloadType: "targeted-attack-v1",
            delivery: "event",
          },
        ],
      );
      const delivery = moduleView(
        "hostile-delivery",
        "1.4.0",
        [
          {
            id: "targeted",
            payloadType: "targeted-attack-v1",
            delivery: "event",
            required: true,
          },
        ],
        [
          {
            id: "emission",
            payloadType: "emission-v2",
            delivery: "event",
          },
        ],
      );
      const observer = moduleView("observer", "1.4.0", [
        {
          id: "emission",
          payloadType: "emission-v2",
          delivery: "event",
          required: true,
        },
      ]);
      const modules = [source, targeting, delivery, observer];
      const bindings = [
        {
          from: { instanceId: "hostile-source", portId: "requests" },
          to: { instanceId: "hostile-targeting", portId: "requests" },
          payloadType: "attack-request-v3",
          delivery: "event" as const,
        },
        {
          from: { instanceId: "hostile-targeting", portId: "targeted" },
          to: { instanceId: "hostile-delivery", portId: "targeted" },
          payloadType: "targeted-attack-v1",
          delivery: "event" as const,
        },
        {
          from: { instanceId: "hostile-delivery", portId: "emission" },
          to: { instanceId: "observer", portId: "emission" },
          payloadType: "emission-v2",
          delivery: "event" as const,
        },
      ];
      const resolved = graph(modules, {
        bindings,
        actorRootChannels: [
          {
            rootChannelId: "enemy.roots",
            producerInstanceId: "hostile-source",
            producerId: "enemy.roots",
            actorRole: "enemy",
            capacity: 2,
            poolId: "enemy.pool",
            rootChannelOutputPort: "roots",
            lifecycleOutputPort: "lifecycle",
            consumerGrants: [],
            identityStrategy: "host-minted-lowest-free-slot-v1",
            counterStrategy: "safe-monotonic-v1",
          },
        ],
        hostileAttackChannels: [
          {
            lineageId: "hostile.enemy.roots.enemy.primary",
            rootChannelId: "enemy.roots",
            attackChannelId: "enemy.primary",
            sourceInstanceId: "hostile-source",
            targetingInstanceId: "hostile-targeting",
            deliveryInstanceId: "hostile-delivery",
            projectileChannelId: "enemy.projectiles",
            requestPayloadType: "attack-request-v3",
            targetedPayloadType: "targeted-attack-v1",
            emissionPayloadType: "emission-v2",
            requiredAssetRole: "enemy-projectile",
            contentionGroupId: "hostile.shared",
          },
        ],
        hostileContentionGroups: [
          {
            groupId: "hostile.shared",
            kind: "hostile-contention-v1",
            memberInstanceIds: ["hostile-delivery"],
            activeEntityCapacity: 2,
            activeProjectileCapacity: 2,
            spawnsPerSecondCapacity: 2,
            ordering: "resolved-provider-order",
          },
        ],
      });
      const emissions: unknown[] = [];
      const runtime = DeterministicGameModuleProductionInstantiatorV14.create({
        graph: resolved,
        catalog: catalog(resolved, {
          "hostile-source": (value) => {
            const ctx = value as GameModuleFactoryContextV14;
            return {
              update: () =>
                ctx.ports.emitEvent("requests", {
                  sequence: 0,
                  emittedAtMs: 16,
                  requestedAtMs: 16,
                  attackChannelId: "enemy.primary",
                  rootChannelId: "enemy.roots",
                  sourceActorId: "root/hostile-source/0",
                  sourceGeneration: 7,
                  patternSourceId: "radial.one",
                  emissionIndex: 0,
                }),
            };
          },
          "hostile-targeting": (value) => {
            const ctx = value as GameModuleFactoryContextV14;
            ctx.ports.declareHandler("requests", (request) =>
              ctx.ports.emitEvent("targeted", {
                request,
                ...targetingProposal,
              }),
            );
            return {};
          },
          "hostile-delivery": (value) => {
            const ctx = value as GameModuleFactoryContextV14;
            ctx.ports.declareHandler("targeted", (targeted) =>
              ctx.ports.emitEvent("emission", {
                targeted,
                projectile: {
                  projectileEntityId: "hostile-projectile-0",
                  projectileChannelId: "enemy.projectiles",
                  projectileGeneration: 3,
                  position: { x: 25, y: 40 },
                  velocity: { x: 0, y: 100 },
                  damage: 2,
                },
                final: true,
              }),
            );
            return {};
          },
          observer: (value) => {
            const ctx = value as GameModuleFactoryContextV14;
            ctx.ports.declareHandler("emission", (emission) =>
              emissions.push(emission),
            );
            return {};
          },
        }),
        createContextV12: (module, clock) =>
          context(module, clock) as GameModuleFactoryContextV12,
        createContextV13: (module, clock) =>
          context(module, clock) as GameModuleFactoryContextV13,
        createContextV14Base: (module, clock) =>
          context(module, clock) as never,
        createAuthorityAdapters: () => ({
          actorRoots: {
            activate: () => undefined,
            deactivate: () => undefined,
          },
          hostileProjectileDelivery: {
            admit: () => undefined,
            recycle: () => undefined,
            observe: () => undefined,
          },
          hostileAttackLineage: {
            readActiveSource: () => ({ position: { x: 25, y: 40 } }),
          },
        }),
        registerAddressedHandler: () => undefined,
      });
      runtime.initialize();
      runtime.start();
      runtime.frame(16);
      expect(emissions).toEqual([
        expect.objectContaining({
          sourceActorId: "root/hostile-source/0",
          sourceGeneration: 7,
          sourcePosition: { x: 25, y: 40 },
          direction: expectedDirection,
          projectileEntityId: "hostile-projectile-0",
          projectileGeneration: 3,
        }),
      ]);
      runtime.destroy();
      expect(disposeRouter).toHaveBeenCalledOnce();
      disposeRouter.mockRestore();
    },
  );

  it("selects exact V1.2/V1.3/V1.4 contexts without authority upcast", () => {
    const modules = [
      moduleView("legacy12", "1.2.0"),
      moduleView("legacy13", "1.3.0"),
      moduleView("current14", "1.4.0"),
    ];
    const resolved = graph(modules);
    const seen: Record<string, string[]> = {};
    const runtime = DeterministicGameModuleProductionInstantiatorV14.create({
      graph: resolved,
      catalog: catalog(
        resolved,
        Object.fromEntries(
          modules.map((module) => [
            module.instanceId,
            (value: unknown) => {
              seen[module.instanceId] = Object.keys(
                (value as GameModuleFactoryContextV14).services,
              ).sort();
              return {};
            },
          ]),
        ),
      ),
      createContextV12: (module, clock) =>
        context(module, clock) as GameModuleFactoryContextV12,
      createContextV13: (module, clock) =>
        context(module, clock) as GameModuleFactoryContextV13,
      createContextV14Base: (module, clock) => context(module, clock) as never,
      createAuthorityAdapters: () => noAuthorityAdapters,
      registerAddressedHandler: () => undefined,
    });
    expect(new Set(Object.values(seen).map((keys) => keys.join(",")))).toEqual(
      new Set(["actors,channels,contact,input,observation,overlaps,viewport"]),
    );
    runtime.initialize();
    runtime.start();
  });

  it("strips unresolved V1.3 and V1.4 optional services from the supplied V1.4 base context", () => {
    const current = moduleView("current14", "1.4.0");
    const resolved = graph([current]);
    let seenServices: readonly string[] | undefined;
    const runtime = DeterministicGameModuleProductionInstantiatorV14.create({
      graph: resolved,
      catalog: catalog(resolved, {
        current14: (value: unknown) => {
          seenServices = Object.keys(
            (value as GameModuleFactoryContextV14).services,
          ).sort();
          return {};
        },
      }),
      createContextV12: (module, clock) =>
        context(module, clock) as GameModuleFactoryContextV12,
      createContextV13: (module, clock) =>
        context(module, clock) as GameModuleFactoryContextV13,
      createContextV14Base: (module, clock) => {
        const supplied = context(module, clock);
        return {
          ...supplied,
          services: {
            ...supplied.services,
            actorSnapshots: { read: () => "unresolved" },
            entityChannelSnapshots: { read: () => "unresolved" },
            preparedEffects: { prepare: () => "unresolved" },
            projectileDelivery: {
              admit: () => "unresolved",
              recycle: () => undefined,
              observe: () => "unresolved",
            },
            actorRoots: {
              activate: () => "unresolved",
              deactivate: () => "unresolved",
            },
            actorRootSnapshots: { read: () => "unresolved" },
            actorRootMutation: { deactivate: () => "unresolved" },
            hostileProjectileDelivery: {
              admit: () => "unresolved",
              recycle: () => "unresolved",
              observe: () => "unresolved",
            },
            outcomeCommit: { commit: () => "unresolved" },
          },
        } as unknown as GameModuleFactoryContextV14;
      },
      createAuthorityAdapters: () => noAuthorityAdapters,
      registerAddressedHandler: () => undefined,
    });
    expect(seenServices).toEqual([
      "actors",
      "channels",
      "contact",
      "input",
      "observation",
      "overlaps",
      "viewport",
    ]);
    runtime.initialize();
  });

  it("rejects a ready outcome coordinator without its frame-tail callable during create", () => {
    const { coordinator, win, loss } = outcomeModules();
    const resolved = graph(
      [win, loss, coordinator],
      outcomeAuthorityAdditions(),
    );
    const beginFrame = vi.fn();
    expect(() =>
      DeterministicGameModuleProductionInstantiatorV14.create({
        graph: resolved,
        catalog: catalog(resolved, { coordinator: () => ({}) }),
        createContextV12: (module, clock) =>
          context(module, clock) as GameModuleFactoryContextV12,
        createContextV13: (module, clock) =>
          context(module, clock) as GameModuleFactoryContextV13,
        createContextV14Base: (module, clock) =>
          context(module, clock) as never,
        createAuthorityAdapters: () => ({
          outcomeCommit: {
            publishCondition: () => undefined,
            commit: () => ({}),
            beginFrame,
            arbitrateFrameTail: () => undefined,
            afterGuard: () => undefined,
          },
        }),
        registerAddressedHandler: () => undefined,
      }),
    ).toThrow(/invalid resolved outcome frame-tail callable: coordinator/);
    expect(beginFrame).not.toHaveBeenCalled();
  });

  it("invokes only the resolved coordinator at frame tail and finalizes after guard release", () => {
    const { coordinator, win, loss } = outcomeModules(true);
    const resolved = graph(
      [loss, win, coordinator],
      outcomeAuthorityAdditions(),
    );
    let runtime: ReturnType<
      typeof DeterministicGameModuleProductionInstantiatorV14.create
    >;
    const transition = vi.fn();
    let outcomeHost: FrameTailOutcomeHostV1;
    const publishedConditions: unknown[] = [];
    const factories = {
      "outcome-loss": (value: unknown) => {
        const ctx = value as GameModuleFactoryContextV14;
        return {
          update: () => {
            expect(() =>
              ctx.ports.publishState("condition", {
                candidate: "win",
                met: true,
                reason: "boss-defeat",
                observedAtMs: 16,
                evidenceId: "forged:1",
              }),
            ).toThrow(/authority mismatch/);
            ctx.ports.publishState("condition", {
              candidate: "loss",
              met: true,
              reason: "player-health",
              observedAtMs: 16,
              evidenceId: "loss:1",
            });
          },
        };
      },
      "outcome-win": (value: unknown) => {
        const ctx = value as GameModuleFactoryContextV14;
        return {
          update: () => {
            expect(() =>
              ctx.ports.publishState("condition", {
                revision: 99,
                emittedAtMs: 16,
                eligibleFrameSequence: 99,
                providerInstanceId: "outcome-win",
                candidate: "win",
                met: true,
                reason: "boss-defeat",
                observedAtMs: 16,
                evidenceId: "forged:2",
              }),
            ).toThrow();
            ctx.ports.publishState("condition", {
              candidate: "win",
              met: true,
              reason: "boss-defeat",
              observedAtMs: 16,
              evidenceId: "win:1",
            });
          },
        };
      },
      coordinator: (value: unknown) => {
        const ctx = value as GameModuleFactoryContextV14;
        ctx.ports.declareHandler("win", (state) =>
          publishedConditions.push(state),
        );
        ctx.ports.declareHandler("loss", (state) =>
          publishedConditions.push(state),
        );
        return {
          arbitrateOutcomeFrameTail: (view: {
            win: { evidenceId: string; reason: string } | null;
          }) => {
            if (view.win?.evidenceId !== undefined)
              ctx.services.outcomeCommit!.commit("outcome.commit", {
                outcome: "win",
                reason: view.win.reason,
                conditionEvidenceId: view.win.evidenceId,
              });
          },
        };
      },
    };
    runtime = DeterministicGameModuleProductionInstantiatorV14.create({
      graph: resolved,
      catalog: catalog(resolved, factories),
      createContextV12: (module, clock) =>
        context(module, clock) as GameModuleFactoryContextV12,
      createContextV13: (module, clock) =>
        context(module, clock) as GameModuleFactoryContextV13,
      createContextV14Base: (module, clock) => context(module, clock) as never,
      createAuthorityAdapters: (guard: GraphTransitionGuard) => {
        outcomeHost = new FrameTailOutcomeHostV1({
          guard,
          winProviderInstanceId: "outcome-win",
          lossProviderInstanceId: "outcome-loss",
          commitServiceId: "outcome.commit",
          firstFrameSequence: 1,
        });
        return {
          outcomeCommit: new FrameTailOutcomeAuthorityAdapterV14({
            host: outcomeHost,
            readElapsedMs: () => 16,
            readScore: () => 7.5,
            cleanup: () => {
              runtime.destroy();
              return { graphClean: true, quarantineClean: true };
            },
            transition,
          }),
        };
      },
      registerAddressedHandler: () => undefined,
    });
    runtime.initialize();
    runtime.start();
    runtime.frame(16);
    expect(publishedConditions).toEqual([
      expect.objectContaining({
        providerInstanceId: "outcome-loss",
        candidate: "loss",
        eligibleFrameSequence: 1,
        revision: 0,
      }),
      expect.objectContaining({
        providerInstanceId: "outcome-win",
        candidate: "win",
        eligibleFrameSequence: 1,
        revision: 1,
      }),
    ]);
    expect(runtime.phase).toBe("destroyed");
    expect(transition).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "win", frameSequence: 1 }),
    );
  });

  it("routes score transactions through the host-owned ledger and publishes only its state", () => {
    const source = moduleView(
      "score-source",
      "1.4.0",
      [],
      [
        {
          id: "score-out",
          payloadType: "score-transaction-v1",
          delivery: "event",
        },
      ],
      true,
    );
    const ledger = moduleView(
      "score-ledger",
      "1.4.0",
      [
        {
          id: "score-in",
          payloadType: "score-transaction-v1",
          delivery: "event",
          required: true,
        },
      ],
      [
        {
          id: "score-state",
          payloadType: "score-state-v1",
          delivery: "state",
        },
      ],
    );
    const observer = moduleView("score-observer", "1.4.0", [
      {
        id: "state-in",
        payloadType: "score-state-v1",
        delivery: "state",
        required: true,
      },
    ]);
    const resolved = graph([source, ledger, observer], {
      bindings: [
        {
          from: { instanceId: "score-source", portId: "score-out" },
          to: { instanceId: "score-ledger", portId: "score-in" },
          payloadType: "score-transaction-v1",
          delivery: "event",
        },
        {
          from: { instanceId: "score-ledger", portId: "score-state" },
          to: { instanceId: "score-observer", portId: "state-in" },
          payloadType: "score-state-v1",
          delivery: "state",
        },
      ],
      scoringAuthority: {
        ledgerInstanceId: "score-ledger",
        duplicateCapacity: 1,
        capacityEvidenceId: hash("d"),
        awardProfile: "bounded-score-number-v1",
        additionOrder: "stable-router-order-binary64-v1",
        sourceRoutes: [
          {
            sourceInstanceId: "score-source",
            sourcePortId: "score-out",
            ledgerPortId: "score-in",
            maximumAward: 7.5,
            evidenceId: hash("f"),
          },
        ],
      },
    });
    const observed: unknown[] = [];
    const factories = {
      "score-source": (value: unknown) => {
        const ctx = value as GameModuleFactoryContextV14;
        return {
          update: () => {
            expect(() =>
              ctx.ports.emitEvent("score-out", {
                sequence: 0,
                emittedAtMs: 16,
                sourceEvidenceId: "score:source:over",
                kind: "pickup",
                award: 8,
              }),
            ).toThrow(/source bound/);
            ctx.ports.emitEvent("score-out", {
              sequence: 0,
              emittedAtMs: 16,
              sourceEvidenceId: "score:source:0",
              kind: "pickup",
              award: 7.5,
            });
          },
        };
      },
      "score-ledger": (value: unknown) => {
        const ctx = value as GameModuleFactoryContextV14;
        expect(() =>
          ctx.ports.declareHandler("score-in", () => undefined),
        ).toThrow(/owned by the Graph 1.4 host/);
        expect(() => ctx.ports.publishState("score-state", {})).toThrow(
          /owned by the Graph 1.4 host/,
        );
        return {};
      },
      "score-observer": (value: unknown) => {
        const ctx = value as GameModuleFactoryContextV14;
        ctx.ports.declareHandler("state-in", (state) => observed.push(state));
        return {};
      },
    };
    const runtime = DeterministicGameModuleProductionInstantiatorV14.create({
      graph: resolved,
      catalog: catalog(resolved, factories),
      createContextV12: (module, clock) =>
        context(module, clock) as GameModuleFactoryContextV12,
      createContextV13: (module, clock) =>
        context(module, clock) as GameModuleFactoryContextV13,
      createContextV14Base: (module, clock) => context(module, clock) as never,
      createAuthorityAdapters: () => ({}),
      registerAddressedHandler: () => undefined,
    });
    runtime.initialize();
    runtime.start();
    runtime.frame(16);
    expect(observed).toEqual([
      expect.objectContaining({ total: 7.5, transactionCount: 1 }),
    ]);
    runtime.destroy();
  });

  it("does not leak the host score ledger across construction, created, or initialize failure", () => {
    const source = moduleView(
      "score-source",
      "1.4.0",
      [],
      [
        {
          id: "score-out",
          payloadType: "score-transaction-v1",
          delivery: "event",
        },
      ],
    );
    const ledger = moduleView(
      "score-ledger",
      "1.4.0",
      [
        {
          id: "score-in",
          payloadType: "score-transaction-v1",
          delivery: "event",
          required: true,
        },
      ],
      [
        {
          id: "score-state",
          payloadType: "score-state-v1",
          delivery: "state",
        },
      ],
    );
    const resolved = graph([source, ledger], {
      bindings: [
        {
          from: { instanceId: "score-source", portId: "score-out" },
          to: { instanceId: "score-ledger", portId: "score-in" },
          payloadType: "score-transaction-v1",
          delivery: "event",
        },
      ],
      scoringAuthority: {
        ledgerInstanceId: "score-ledger",
        duplicateCapacity: 1,
        capacityEvidenceId: hash("6"),
        awardProfile: "bounded-score-number-v1",
        additionOrder: "stable-router-order-binary64-v1",
        sourceRoutes: [
          {
            sourceInstanceId: "score-source",
            sourcePortId: "score-out",
            ledgerPortId: "score-in",
            maximumAward: 1,
            evidenceId: hash("7"),
          },
        ],
      },
    });
    const dispose = vi.spyOn(
      GraphBoundScoreLedgerAdapterV14.prototype,
      "dispose",
    );
    const create = (ledgerFactory: (context: unknown) => unknown) =>
      DeterministicGameModuleProductionInstantiatorV14.create({
        graph: resolved,
        catalog: catalog(resolved, { "score-ledger": ledgerFactory }),
        createContextV12: (module, clock) =>
          context(module, clock) as GameModuleFactoryContextV12,
        createContextV13: (module, clock) =>
          context(module, clock) as GameModuleFactoryContextV13,
        createContextV14Base: (module, clock) =>
          context(module, clock) as never,
        createAuthorityAdapters: () => ({}),
        registerAddressedHandler: () => undefined,
      });

    expect(() =>
      create(() => {
        throw new Error("construction failed");
      }),
    ).toThrow(/construction failed/);
    expect(dispose).not.toHaveBeenCalled();

    const neverInitialized = create(() => ({}));
    expect(neverInitialized.destroy().disposition).toBe("clean");
    expect(dispose).not.toHaveBeenCalled();

    const initializeFailure = create(() => ({
      initialize: () => {
        throw new Error("initialize failed");
      },
    }));
    expect(() => initializeFailure.initialize()).toThrow(
      /module graph terminal failure/,
    );
    expect(initializeFailure.phase).toBe("destroyed");
    expect(dispose).toHaveBeenCalledTimes(1);
    dispose.mockRestore();
  });

  it("rejects a frame-tail callable from an older or non-coordinator factory", () => {
    const legacy = moduleView("legacy12", "1.2.0");
    const resolved = graph([legacy]);
    expect(() =>
      DeterministicGameModuleProductionInstantiatorV14.create({
        graph: resolved,
        catalog: catalog(resolved, {
          legacy12: () => ({ arbitrateOutcomeFrameTail: () => undefined }),
        }),
        createContextV12: (module, clock) =>
          context(module, clock) as GameModuleFactoryContextV12,
        createContextV13: (module, clock) =>
          context(module, clock) as GameModuleFactoryContextV13,
        createContextV14Base: (module, clock) =>
          context(module, clock) as never,
        createAuthorityAdapters: () => noAuthorityAdapters,
        registerAddressedHandler: () => undefined,
      }),
    ).toThrow(/undeclared outcome frame-tail callable/);
  });
});
