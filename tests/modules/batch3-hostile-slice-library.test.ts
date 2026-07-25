import { describe, expect, it } from "vitest";

import {
  BATCH3_HOSTILE_SLICE_DEFINITIONS,
  createBatch3HostileSliceRegistry,
} from "../../src/modules/batch3-hostile-slice-library.js";
import { BATCH1_VERTICAL_SLICE_ASSEMBLY } from "../../src/modules/batch1-vertical-slice.js";
import { ActorRootCustodyHostV1 } from "../../src/modules/game-module-actor-root-custody-host.js";
import { resolveBatch3AuthorityPlanV14 } from "../../src/modules/game-module-authority-resolver-v14.js";
import {
  GameAssemblySpecV13Schema,
  GameModuleManifestV14Schema,
} from "../../src/modules/game-module-contract.js";
import { createModuleArtifactHashDescriptor } from "../../src/modules/game-module-execution-contract.js";
import { HostileAttackLineageRouterV1 } from "../../src/modules/game-module-hostile-attack-router.js";
import { HostileAggregateContentionHostV1 } from "../../src/modules/game-module-hostile-contention-host.js";
import { RuntimeKernelSessionQuarantineLedgerV12 } from "../../src/modules/game-module-runtime-abi-v12.js";

const lockIdentity = new TextEncoder().encode(
  "pnpm-lock.batch3.hostile-slice.v1",
);
const toolchainIdentity = new TextEncoder().encode(
  "typescript-5.9.3.esm-self-contained.batch3.hostile-slice.v1",
);

function artifactFor(
  definition: (typeof BATCH3_HOSTILE_SLICE_DEFINITIONS)[number],
) {
  const implementationBundle = new TextEncoder().encode(
    definition.implementationSource,
  );
  return createModuleArtifactHashDescriptor({
    manifest: definition.manifest,
    configurationDescriptor: definition.configurationDescriptor,
    reservationDescriptor: definition.reservationDescriptor,
    implementationBundle,
    dependencyLockIdentity: lockIdentity,
    toolchainIdentity,
  });
}

describe("Batch 3 legal hostile production slice", () => {
  it("loader-admits the exact Manifest 1.4 production artifacts", async () => {
    const registry = await createBatch3HostileSliceRegistry();
    expect(
      BATCH3_HOSTILE_SLICE_DEFINITIONS.map(
        ({ manifest }) => `${manifest.moduleId}@${manifest.version}`,
      ),
    ).toEqual([
      "encounter.scrolling-waves@1.0.0",
      "trigger.encounter-pattern@1.0.0",
      "targeting.hostile-fixed@1.0.0",
      "delivery.pattern.radial@1.1.0",
      "trigger.encounter-pattern@1.1.0",
    ]);

    for (const definition of BATCH3_HOSTILE_SLICE_DEFINITIONS) {
      const implementationBundle = new TextEncoder().encode(
        definition.implementationSource,
      );
      const artifact = createModuleArtifactHashDescriptor({
        manifest: definition.manifest,
        configurationDescriptor: definition.configurationDescriptor,
        reservationDescriptor: definition.reservationDescriptor,
        implementationBundle,
        dependencyLockIdentity: lockIdentity,
        toolchainIdentity,
      });
      const admitted = registry.findExactProductionV14(
        definition.manifest.moduleId,
        definition.manifest.version,
        artifact.envelopeSha256,
      );
      expect(admitted).toMatchObject({
        registrationKind: "production",
        manifest: {
          schemaVersion: "1.4.0",
          moduleId: definition.manifest.moduleId,
          version: definition.manifest.version,
        },
        artifactIdentity: artifact,
      });
      expect(admitted?.executableHandle?.loadedExport).toBeTypeOf("function");
    }
  });

  it("keeps encounter-pattern 1.0 isolated and filters 1.1 wave sources", async () => {
    const registry = await createBatch3HostileSliceRegistry();
    const versions = registry
      .findForGraphV14("trigger.encounter-pattern", "^1.0.0")
      .map(({ manifest }) => manifest.version);
    expect(versions).toEqual(["1.0.0", "1.1.0"]);
    const oldDefinition = BATCH3_HOSTILE_SLICE_DEFINITIONS.find(
      ({ manifest }) =>
        manifest.moduleId === "trigger.encounter-pattern" &&
        manifest.version === "1.0.0",
    )!;
    expect(
      registry.findExactProductionV14(
        "trigger.encounter-pattern",
        "1.0.0",
        artifactFor(oldDefinition).envelopeSha256,
      ),
    ).toBeDefined();

    const registration = registry.findForGraphV14(
      "trigger.encounter-pattern",
      "1.1.0",
    )[0]!;
    const handlers = new Map<string, (value: any) => void>();
    const requests: any[] = [];
    let nowMs = 0;
    const create = registration.executableHandle!.loadedExport as (
      context: any,
    ) => { initialize(): void; update(): void };
    const participant = create({
      identity: { instanceId: "enemy-pattern-filter" },
      configuration: {
        attackChannelId: "enemy.aimed",
        patternSourceId: "browser-aimed",
        allowedSourceIds: ["browser-gunners"],
        activationMode: "root-lifecycle",
        intervalMs: 100,
        durationMs: 1000,
        maximumEmitters: 4,
      },
      ports: {
        declareHandler: (id: string, handler: (value: any) => void) =>
          handlers.set(id, handler),
        emitEvent: (id: string, value: any) => requests.push({ id, value }),
      },
      clock: { nowMs: () => nowMs },
      services: { observation: { register() {} } },
    });
    participant.initialize();
    handlers.get("roots")!({ rootChannelId: "enemy.roots" });
    handlers.get("lifecycle")!({
      rootChannelId: "enemy.roots",
      actorId: "enemy-opening",
      actorGeneration: 0,
      sourceId: "browser-opening",
      reason: "activated",
    });
    expect(requests).toEqual([]);
    handlers.get("lifecycle")!({
      rootChannelId: "enemy.roots",
      actorId: "enemy-gunner",
      actorGeneration: 0,
      sourceId: "browser-gunners",
      reason: "activated",
    });
    expect(requests).toHaveLength(1);
    handlers.get("lifecycle")!({
      rootChannelId: "enemy.roots",
      actorId: "enemy-gunner",
      actorGeneration: 0,
      sourceId: "browser-gunners",
      reason: "health-depleted",
    });
    nowMs = 200;
    participant.update();
    expect(requests).toHaveLength(1);
  });

  it("accepts only the exact Boss encounter activation in 1.1 event mode", async () => {
    const registry = await createBatch3HostileSliceRegistry();
    const registration = registry.findForGraphV14(
      "trigger.encounter-pattern",
      "1.1.0",
    )[0]!;
    const handlers = new Map<string, (value: any) => void>();
    const requests: any[] = [];
    const create = registration.executableHandle!.loadedExport as (
      context: any,
    ) => unknown;
    create({
      identity: { instanceId: "boss-pattern" },
      configuration: {
        attackChannelId: "boss.rain",
        patternSourceId: "browser-rain",
        allowedSourceIds: ["boss-main"],
        activationMode: "encounter-events",
        intervalMs: 260,
        durationMs: 10_000,
        maximumEmitters: 1,
      },
      ports: {
        declareHandler: (id: string, handler: (value: any) => void) =>
          handlers.set(id, handler),
        emitEvent: (id: string, value: any) => requests.push({ id, value }),
      },
      clock: { nowMs: () => 0 },
      services: { observation: { register() {} } },
    });
    handlers.get("roots")!({ rootChannelId: "boss.roots" });
    const activation = {
      rootChannelId: "boss.roots",
      actorId: "boss-one",
      actorGeneration: 0,
      attackChannelId: "boss.rain",
      patternSourceId: "browser-rain",
      startsAtMs: 0,
      endsAtMs: 10_000,
      intervalMs: 260,
    };
    expect(() =>
      handlers.get("activations")!({
        ...activation,
        patternSourceId: "browser-wave",
      }),
    ).toThrow(/activation lineage mismatch/);
    handlers.get("activations")!(activation);
    expect(requests).toHaveLength(1);
  });

  it("keeps hostile delivery physically independent and enemy-only", () => {
    const playerRadial = BATCH3_HOSTILE_SLICE_DEFINITIONS.find(
      ({ manifest }) =>
        manifest.moduleId === "delivery.pattern.radial" &&
        manifest.version === "1.1.0",
    )!.manifest;
    expect(playerRadial.assetRequirements).toEqual([
      expect.objectContaining({ roleId: "enemy-projectile" }),
    ]);
    expect(playerRadial.modifierTargets).toEqual([]);
    expect(playerRadial.aggregateResourceClaims).toEqual([
      expect.objectContaining({
        contentionKind: "hostile-contention-v1",
        ownedProjectileChannelId: "projectiles",
      }),
    ]);
    expect(playerRadial.ownedEntityChannels).toEqual([
      expect.objectContaining({
        channelId: "projectiles",
        poolDescriptor: expect.objectContaining({
          poolId: "hostile-projectiles.pool",
        }),
      }),
    ]);
  });

  it("admits the full Spec enemy capacity and the distinct Boss root role", () => {
    const [encounter, source] = BATCH3_HOSTILE_SLICE_DEFINITIONS;
    expect(encounter!.manifest.resources).toMatchObject({
      activeEntities: 120,
      spawnsPerSecond: 200,
    });
    expect(source!.manifest.actorRootConsumers).toEqual([
      expect.objectContaining({
        expectedActorRole: "enemy",
        purpose: "pattern-source",
        maximumEntries: 120,
      }),
      expect.objectContaining({
        expectedActorRole: "boss",
        purpose: "pattern-source",
        maximumEntries: 1,
      }),
    ]);
    expect(() =>
      source!.configurationSchema.parse({
        attackChannelId: "enemy.maximum",
        patternSourceId: "pattern.maximum",
        intervalMs: 80,
        durationMs: 120_000,
        maximumEmitters: 120,
      }),
    ).not.toThrow();
  });

  it("derives exact reservations from strict configuration", () => {
    const [encounter, source, targeting, delivery] =
      BATCH3_HOSTILE_SLICE_DEFINITIONS;
    expect(
      encounter!.reservationEvaluator({
        maximumEnemies: 3,
        maximumSpawnsPerSecond: 5,
        sourceIds: ["scout"],
        assetRoleBySource: { scout: "enemy" },
        spawnY: -10,
        radius: 12,
        waves: [
          {
            sourceId: "scout",
            startsAtMs: 0,
            endsAtMs: 1_000,
            intervalMs: 200,
            maxAlive: 2,
            speed: 80,
          },
        ],
      }),
    ).toEqual({
      activeEntities: 3,
      activeProjectiles: 0,
      spawnsPerSecond: 5,
      timers: 0,
    });
    expect(
      source!.reservationEvaluator({
        attackChannelId: "enemy.primary",
        patternSourceId: "radial.one",
        intervalMs: 200,
        durationMs: 1_000,
        maximumEmitters: 3,
      }),
    ).toEqual({
      activeEntities: 0,
      activeProjectiles: 0,
      spawnsPerSecond: 0,
      timers: 0,
    });
    expect(
      targeting!.reservationEvaluator({
        attackChannelId: "enemy.primary",
        direction: { x: 0, y: 1 },
      }),
    ).toEqual({
      activeEntities: 0,
      activeProjectiles: 0,
      spawnsPerSecond: 0,
      timers: 0,
    });
    expect(
      delivery!.reservationEvaluator({
        attackChannelId: "enemy.primary",
        count: 4,
        maximumCountBonus: 0,
        speed: 200,
        damage: 1,
        textureRole: "enemy-projectile",
        maxActive: 12,
        maximumAcceptedRequestsPerSecond: 5,
        baseAngleOffsetDegrees: 0,
        recycleMargin: 20,
        exhaustionPolicy: "drop-and-observe",
      }),
    ).toEqual({
      activeEntities: 12,
      activeProjectiles: 12,
      spawnsPerSecond: 20,
      timers: 0,
    });
  });

  it("executes admitted factories through host-minted roots, frozen V3 lineage, and group-owned suffix drops", async () => {
    const registry = await createBatch3HostileSliceRegistry();
    const factories = BATCH3_HOSTILE_SLICE_DEFINITIONS.map(
      (definition) =>
        registry.findExactProductionV14(
          definition.manifest.moduleId,
          definition.manifest.version,
          artifactFor(definition).envelopeSha256,
        )!.executableHandle!.loadedExport,
    );
    let nowMs = 0;
    const session = new RuntimeKernelSessionQuarantineLedgerV12(32);
    const physicalRoots = new Map<
      string,
      Readonly<{ position: Readonly<{ x: number; y: number }> }>
    >();
    const rootHost = new ActorRootCustodyHostV1({
      producerInstanceId: "enemy-waves",
      rootChannelId: "root-channel.enemy-waves.enemy.roots",
      actorRole: "enemy",
      capacity: 2,
      session,
      reserveActiveEntity: () => () => undefined,
      adapter: {
        activatePhysical: (reference, request) =>
          physicalRoots.set(reference.actorId, {
            position: Object.freeze({ ...request.position }),
          }),
        activateLogical: () => undefined,
        deactivatePhysical: (reference) => {
          physicalRoots.delete(reference.actorId);
          return true;
        },
        deactivateLogical: () => true,
      },
    });
    const contention = new HostileAggregateContentionHostV1({
      groupId: "hostile.shared",
      orderedMemberInstanceIds: ["enemy-radial"],
      activeEntityCapacity: 3,
      activeProjectileCapacity: 3,
      spawnsPerSecondCapacity: 3,
      nowMs: () => nowMs,
      session,
    });
    const lineage = new HostileAttackLineageRouterV1({
      sourceInstanceId: "enemy-pattern",
      targetingInstanceId: "enemy-fixed",
      deliveryInstanceId: "enemy-radial",
      rootChannelId: "root-channel.enemy-waves.enemy.roots",
      attackChannelId: "enemy.primary",
      projectileChannelId: "projectiles",
      maximumPending: 2,
      readActiveSource: (_channel, actorId) => physicalRoots.get(actorId)!,
    });
    const sourceHandlers = new Map<string, (value: any) => unknown>();
    const encounterHandlers = new Map<string, (value: any) => unknown>();
    const targetingHandlers = new Map<string, (value: any) => unknown>();
    const deliveryHandlers = new Map<string, (value: any) => unknown>();
    const emissions: unknown[] = [];
    const activeProjectiles = new Map<
      string,
      Readonly<{ tokenId: number; generation: number }>
    >();
    let contentionFrame = 0;

    const common = (
      instanceId: string,
      moduleId: string,
      configuration: unknown,
    ) => ({
      identity: {
        instanceId,
        ownerId: "enemy-one",
        moduleId,
        version: "1.0.0",
        artifactEnvelopeSha256: "a".repeat(64),
      },
      configuration,
      services: {
        viewport: { read: () => ({ width: 200, height: 300 }) },
        actors: {},
        input: {},
        overlaps: {},
        channels: {},
        observation: { register: () => () => undefined },
        contact: {},
      },
      clock: {
        nowMs: () => nowMs,
        schedule: () => ({ cancel: () => undefined }),
      },
      assets: {
        requireTexture: (role: string) => `texture:${role}`,
        optionalTexture: () => undefined,
      },
    });
    const source = factories[1]!({
      ...common("enemy-pattern", "trigger.encounter-pattern", {
        attackChannelId: "enemy.primary",
        patternSourceId: "radial.one",
        intervalMs: 200,
        durationMs: 1_000,
        maximumEmitters: 2,
      }),
      ports: {
        declareHandler: (id: string, handler: (value: any) => unknown) =>
          sourceHandlers.set(id, handler),
        emitEvent: (_id: string, request: any) => {
          const accepted = lineage.acceptRequest("enemy-pattern", request);
          return targetingHandlers.get("requests")!(accepted);
        },
        publishState: () => undefined,
        declareAddressedHandler: () => undefined,
      },
    }) as any;
    factories[2]!({
      ...common("enemy-fixed", "targeting.hostile-fixed", {
        attackChannelId: "enemy.primary",
        direction: { x: 0, y: 1 },
      }),
      ports: {
        declareHandler: (id: string, handler: (value: any) => unknown) =>
          targetingHandlers.set(id, handler),
        emitEvent: (_id: string, proposal: any) =>
          deliveryHandlers.get("targeted")!(
            lineage.target("enemy-fixed", proposal.request, proposal.direction),
          ),
        publishState: () => undefined,
        declareAddressedHandler: () => undefined,
      },
    });
    const delivery = factories[3]!({
      ...common("enemy-radial", "delivery.pattern.radial", {
        attackChannelId: "enemy.primary",
        count: 4,
        maximumCountBonus: 0,
        speed: 100,
        damage: 2,
        textureRole: "enemy-projectile",
        maxActive: 8,
        maximumAcceptedRequestsPerSecond: 2,
        baseAngleOffsetDegrees: 0,
        recycleMargin: 20,
        exhaustionPolicy: "drop-and-observe",
      }),
      services: {
        ...common("enemy-radial", "delivery.pattern.radial", {}).services,
        hostileProjectileDelivery: {
          admit: (_grantId: string, request: any) => {
            const [admission] = contention.admitFrame(contentionFrame++, [
              {
                memberInstanceId: "enemy-radial",
                requestSequence: request.requestSequence,
                plannedProjectiles: request.plans.length,
              },
            ]);
            const activated = admission!.admittedTokenIds.map(
              (tokenId: number, index: number) => {
                const projectileEntityId = `hostile-projectile-${tokenId}`;
                const reference = Object.freeze({
                  projectileEntityId,
                  projectileChannelId: "projectiles",
                  projectileGeneration: tokenId,
                });
                activeProjectiles.set(projectileEntityId, {
                  tokenId,
                  generation: tokenId,
                });
                contention.commit(
                  "enemy-radial",
                  tokenId,
                  projectileEntityId,
                  tokenId,
                );
                expect(request.plans[index]).toBeDefined();
                return reference;
              },
            );
            return Object.freeze({ activated: Object.freeze(activated) });
          },
          recycle: (_grantId: string, reference: any) => {
            const record = activeProjectiles.get(reference.projectileEntityId)!;
            contention.release("enemy-radial", record.tokenId);
            activeProjectiles.delete(reference.projectileEntityId);
          },
          observe: () => contention.snapshot(),
        },
      },
      ports: {
        declareHandler: (id: string, handler: (value: any) => unknown) =>
          deliveryHandlers.set(id, handler),
        emitEvent: (_id: string, proposal: any) =>
          proposal.projectile === null
            ? lineage.completeDelivery("enemy-radial", proposal.targeted)
            : emissions.push(
                lineage.emit(
                  "enemy-radial",
                  proposal.targeted,
                  proposal.projectile,
                  proposal.final,
                ),
              ),
        publishState: () => undefined,
        declareAddressedHandler: () => undefined,
      },
    }) as any;
    const encounter = factories[0]!({
      ...common("enemy-waves", "encounter.scrolling-waves", {
        maximumEnemies: 2,
        maximumSpawnsPerSecond: 2,
        sourceIds: ["scout"],
        assetRoleBySource: { scout: "enemy" },
        spawnY: 10,
        radius: 12,
        waves: [
          {
            sourceId: "scout",
            startsAtMs: 0,
            endsAtMs: 1_000,
            intervalMs: 500,
            maxAlive: 1,
            speed: 20,
          },
        ],
      }),
      services: {
        ...common("enemy-waves", "encounter.scrolling-waves", {}).services,
        actorRoots: {
          activate: (_grantId: string, request: any) =>
            rootHost.activate(request),
          deactivate: (_grantId: string, request: any) =>
            rootHost.deactivate(request.reference, request.reason),
        },
      },
      ports: {
        declareHandler: (id: string, handler: (value: any) => unknown) =>
          encounterHandlers.set(id, handler),
        publishState: (_id: string, value: any) =>
          sourceHandlers.get("roots")!(value),
        emitEvent: (_id: string, value: any) =>
          sourceHandlers.get("lifecycle")!(value),
        declareAddressedHandler: () => undefined,
      },
    }) as any;

    source.initialize();
    delivery.initialize();
    encounter.initialize();
    encounter.update(0);
    expect(rootHost.snapshot().roots).toEqual([
      expect.objectContaining({
        reference: expect.objectContaining({
          actorId: "root/enemy-waves/0",
          actorGeneration: 0,
        }),
        state: "active",
      }),
    ]);
    expect(emissions).toHaveLength(3);
    expect(emissions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rootChannelId: "root-channel.enemy-waves.enemy.roots",
          sourceActorId: "root/enemy-waves/0",
          sourceGeneration: 0,
          sourcePosition: { x: 24, y: 10 },
          projectileChannelId: "projectiles",
        }),
      ]),
    );
    expect(contention.snapshot()).toMatchObject({
      active: 3,
      retainedActiveEntities: 3,
      retainedActiveProjectiles: 3,
    });
    expect([...activeProjectiles]).toHaveLength(3);
    encounterHandlers.get("defeated")!({
      rootChannelId: "root-channel.enemy-waves.enemy.roots",
      actorId: "root/enemy-waves/0",
      actorGeneration: 0,
      actorRole: "enemy",
      sourceId: "scout",
    });
    expect(rootHost.snapshot().roots).toHaveLength(0);
    nowMs = 500;
    encounter.update(500);
    expect(rootHost.snapshot().roots).toEqual([
      expect.objectContaining({
        reference: expect.objectContaining({
          actorId: "root/enemy-waves/0",
          actorGeneration: 1,
        }),
      }),
    ]);
    expect([...activeProjectiles]).toHaveLength(3);
    delivery.stop();
    encounter.stop();
    expect(contention.snapshot().active).toBe(0);
    expect(physicalRoots.size).toBe(0);
    lineage.dispose();
    contention.dispose();
    rootHost.dispose();
    nowMs = 1;
  });

  it("resolves the admitted root, V3 triple, and host contention membership", async () => {
    const registry = await createBatch3HostileSliceRegistry();
    const [encounter, source, targeting, delivery] =
      BATCH3_HOSTILE_SLICE_DEFINITIONS;
    const modules = [
      {
        instanceId: "enemy-waves",
        moduleId: encounter!.manifest.moduleId,
        versionRange: "1.0.0",
        ownerId: "enemy-one",
        configuration: {
          maximumEnemies: 120,
          maximumSpawnsPerSecond: 5,
          sourceIds: ["scout"],
          assetRoleBySource: { scout: "enemy" },
          spawnY: -10,
          radius: 12,
          waves: [
            {
              sourceId: "scout",
              startsAtMs: 0,
              endsAtMs: 1_000,
              intervalMs: 200,
              maxAlive: 4,
              speed: 80,
            },
          ],
        },
      },
      {
        instanceId: "enemy-pattern",
        moduleId: source!.manifest.moduleId,
        versionRange: "1.0.0",
        ownerId: "enemy-one",
        configuration: {
          attackChannelId: "enemy.primary",
          patternSourceId: "radial.one",
          intervalMs: 200,
          durationMs: 1_000,
          maximumEmitters: 120,
        },
      },
      {
        instanceId: "enemy-fixed",
        moduleId: targeting!.manifest.moduleId,
        versionRange: "1.0.0",
        ownerId: "enemy-one",
        configuration: {
          attackChannelId: "enemy.primary",
          direction: { x: 0, y: 1 },
        },
      },
      {
        instanceId: "enemy-radial",
        moduleId: delivery!.manifest.moduleId,
        versionRange: "1.1.0",
        ownerId: "enemy-one",
        configuration: {
          attackChannelId: "enemy.primary",
          count: 4,
          maximumCountBonus: 0,
          speed: 200,
          damage: 1,
          textureRole: "enemy-projectile",
          maxActive: 64,
          maximumAcceptedRequestsPerSecond: 5,
          baseAngleOffsetDegrees: 0,
          recycleMargin: 20,
          exhaustionPolicy: "drop-and-observe",
        },
      },
    ];
    const assembly = GameAssemblySpecV13Schema.parse({
      ...structuredClone(BATCH1_VERTICAL_SLICE_ASSEMBLY),
      schemaVersion: "1.3.0",
      modules: [
        ...structuredClone(BATCH1_VERTICAL_SLICE_ASSEMBLY.modules),
        ...modules,
      ],
      bindings: [
        ...structuredClone(BATCH1_VERTICAL_SLICE_ASSEMBLY.bindings),
        {
          from: { instanceId: "enemy-waves", portId: "roots" },
          to: { instanceId: "enemy-pattern", portId: "roots" },
        },
        {
          from: { instanceId: "enemy-waves", portId: "lifecycle" },
          to: { instanceId: "enemy-pattern", portId: "lifecycle" },
        },
        {
          from: { instanceId: "enemy-pattern", portId: "requests" },
          to: { instanceId: "enemy-fixed", portId: "requests" },
        },
        {
          from: { instanceId: "enemy-fixed", portId: "targeted" },
          to: { instanceId: "enemy-radial", portId: "targeted" },
        },
      ],
      effectApplicationBindings: [],
      pickupEffectPlanSelections: [],
      actorRootBindings: [
        {
          bindingId: "enemy.pattern-source",
          producerInstanceId: "enemy-waves",
          producerOutputPort: "roots",
          consumerInstanceId: "enemy-pattern",
          consumerInputPort: "roots",
          expectedActorRole: "enemy",
          purpose: "pattern-source",
          maximumEntries: 120,
        },
      ],
      hostileAggregateBudgetGroups: [
        {
          groupId: "hostile.shared",
          kind: "hostile-contention-v1",
          memberInstanceIds: ["enemy-radial"],
          activeEntityCapacity: 64,
          activeProjectileCapacity: 64,
          spawnsPerSecondCapacity: 1_024,
          ordering: "resolved-provider-order",
        },
      ],
      actorSetDamageRoutes: [],
      actorRootMutationGrantSelections: [],
      outcomeCoordinatorSelection: null,
    });
    const manifests = BATCH3_HOSTILE_SLICE_DEFINITIONS.slice(0, 4).map(
      (definition, index) => {
        const implementationBundle = new TextEncoder().encode(
          definition.implementationSource,
        );
        const artifact = createModuleArtifactHashDescriptor({
          manifest: definition.manifest,
          configurationDescriptor: definition.configurationDescriptor,
          reservationDescriptor: definition.reservationDescriptor,
          implementationBundle,
          dependencyLockIdentity: lockIdentity,
          toolchainIdentity,
        });
        const admitted = registry.findExactProductionV14(
          definition.manifest.moduleId,
          definition.manifest.version,
          artifact.envelopeSha256,
        );
        expect(admitted?.executableHandle).toBeDefined();
        return {
          instanceId: modules[index]!.instanceId,
          manifest: GameModuleManifestV14Schema.parse(admitted!.manifest),
          resourceGrant: definition.reservationEvaluator(
            modules[index]!.configuration,
          ),
        };
      },
    );
    const resolution = resolveBatch3AuthorityPlanV14({ assembly, manifests });
    expect(resolution.plan.actorRootChannels).toEqual([
      expect.objectContaining({
        rootChannelId: "root-channel.enemy-waves.enemy.roots",
        actorRole: "enemy",
        capacity: 120,
      }),
    ]);
    expect(resolution.plan.hostileAttackChannels).toEqual([
      expect.objectContaining({
        lineageId: "hostile.root-channel.enemy-waves.enemy.roots.enemy.primary",
        sourceInstanceId: "enemy-pattern",
        targetingInstanceId: "enemy-fixed",
        deliveryInstanceId: "enemy-radial",
        requiredAssetRole: "enemy-projectile",
        contentionGroupId: "hostile.shared",
      }),
    ]);
    expect(resolution.plan.hostileContentionGroups).toEqual([
      expect.objectContaining({
        groupId: "hostile.shared",
        memberInstanceIds: ["enemy-radial"],
      }),
    ]);
    expect(resolution.readinessReport.status).toBe("blocked");
    expect(resolution.readinessReport.blockers.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        "root-missing-actor-set-route",
        "root-missing-body-contact-mutation",
        "score-ledger-cardinality",
        "outcome-coordinator-cardinality",
      ]),
    );
  });
});
