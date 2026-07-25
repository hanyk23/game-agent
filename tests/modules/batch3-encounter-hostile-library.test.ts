import { describe, expect, it, vi } from "vitest";

import { planBatch2DeliveryFormation } from "../../src/modules/batch2-delivery-library.js";
import {
  BATCH3_ENCOUNTER_HOSTILE_DEFINITIONS,
  createBatch3EncounterHostileRegistry,
} from "../../src/modules/batch3-encounter-hostile-library.js";
import {
  BATCH3_HOSTILE_SLICE_DEFINITIONS,
  type Batch3HostileSliceDefinition,
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

const extendedLock = new TextEncoder().encode(
  "pnpm-lock.batch3.encounter-hostile.v1",
);
const extendedToolchain = new TextEncoder().encode(
  "typescript-5.9.3.esm-self-contained.batch3.encounter-hostile.v1",
);
const sliceLock = new TextEncoder().encode("pnpm-lock.batch3.hostile-slice.v1");
const sliceToolchain = new TextEncoder().encode(
  "typescript-5.9.3.esm-self-contained.batch3.hostile-slice.v1",
);

function artifactFor(
  definition: Batch3HostileSliceDefinition,
  source: "extended" | "slice" = "extended",
) {
  return createModuleArtifactHashDescriptor({
    manifest: definition.manifest,
    configurationDescriptor: definition.configurationDescriptor,
    reservationDescriptor: definition.reservationDescriptor,
    implementationBundle: new TextEncoder().encode(
      definition.implementationSource,
    ),
    dependencyLockIdentity: source === "extended" ? extendedLock : sliceLock,
    toolchainIdentity:
      source === "extended" ? extendedToolchain : sliceToolchain,
  });
}

function common(
  instanceId: string,
  moduleId: string,
  version: string,
  configuration: unknown,
  nowMs: () => number,
) {
  return {
    identity: {
      instanceId,
      ownerId: `${instanceId}.owner`,
      moduleId,
      version,
      artifactEnvelopeSha256: "a".repeat(64),
    },
    configuration,
    services: {
      viewport: { read: () => ({ width: 200, height: 100 }) },
      actors: {},
      input: {},
      overlaps: {},
      channels: {},
      observation: { register: () => () => undefined },
      contact: {},
    },
    ports: {
      declareHandler: () => undefined,
      publishState: () => undefined,
      emitEvent: () => undefined,
      declareAddressedHandler: () => undefined,
    },
    clock: {
      nowMs,
      schedule: () => ({ cancel: () => undefined }),
    },
    assets: {
      requireTexture: (role: string) => `texture:${role}`,
      optionalTexture: () => undefined,
    },
  };
}

describe("Batch 3 complete encounter and hostile pattern catalog", () => {
  it("loader-admits Boss, hostile aimed, and all seven remaining @1.1 patterns", async () => {
    const registry = await createBatch3EncounterHostileRegistry();
    expect(
      BATCH3_ENCOUNTER_HOSTILE_DEFINITIONS.map(
        ({ manifest }) => `${manifest.moduleId}@${manifest.version}`,
      ),
    ).toEqual([
      "encounter.boss-phases@1.0.0",
      "targeting.hostile-aimed@1.0.0",
      "delivery.pattern.spiral@1.1.0",
      "delivery.pattern.fan@1.1.0",
      "delivery.pattern.aimed@1.1.0",
      "delivery.pattern.wave@1.1.0",
      "delivery.pattern.rain@1.1.0",
      "delivery.pattern.rotating-ring@1.1.0",
      "delivery.pattern.burst@1.1.0",
    ]);
    for (const definition of BATCH3_ENCOUNTER_HOSTILE_DEFINITIONS) {
      const admitted = registry.findExactProductionV14(
        definition.manifest.moduleId,
        definition.manifest.version,
        artifactFor(definition).envelopeSha256,
      );
      expect(admitted?.registrationKind).toBe("production");
      expect(admitted?.executableHandle?.loadedExport).toBeTypeOf("function");
    }
  });

  it("keeps every hostile pattern on its own enemy-only pool and claim", () => {
    const deliveries = BATCH3_ENCOUNTER_HOSTILE_DEFINITIONS.slice(2);
    expect(
      new Set(
        deliveries.map(
          ({ manifest }) =>
            manifest.ownedEntityChannels![0]!.poolDescriptor!.poolId,
        ),
      ).size,
    ).toBe(7);
    for (const { manifest } of deliveries) {
      expect(manifest.assetRequirements).toEqual([
        expect.objectContaining({ roleId: "enemy-projectile" }),
      ]);
      expect(manifest.modifierTargets).toEqual([]);
      expect(manifest.aggregateResourceClaims).toEqual([
        expect.objectContaining({
          contentionKind: "hostile-contention-v1",
          ownedProjectileChannelId: "projectiles",
        }),
      ]);
    }
  });

  it("resolves two enemy channels and one Boss channel into one host group", async () => {
    const registry = await createBatch3EncounterHostileRegistry();
    const [waves, source, fixed, radial] = BATCH3_HOSTILE_SLICE_DEFINITIONS;
    const [boss, aimed, spiral, fan] = BATCH3_ENCOUNTER_HOSTILE_DEFINITIONS;
    const moduleRequests = [
      {
        instanceId: "enemy-waves",
        definition: waves!,
        source: "slice" as const,
        ownerId: "enemy-owner",
        configuration: {
          maximumEnemies: 2,
          maximumSpawnsPerSecond: 2,
          sourceIds: ["scout"],
          assetRoleBySource: { scout: "enemy" },
          spawnY: 0,
          radius: 8,
          waves: [
            {
              sourceId: "scout",
              startsAtMs: 0,
              endsAtMs: 1_000,
              intervalMs: 500,
              maxAlive: 2,
              speed: 50,
            },
          ],
        },
      },
      {
        instanceId: "boss-phases",
        definition: boss!,
        source: "extended" as const,
        ownerId: "boss-owner",
        configuration: {
          bossStartMs: 1_000,
          handoffId: "waves-to-boss",
          maximumBosses: 1,
          sourceIds: ["dragon"],
          assetRoleBySource: { dragon: "boss" },
          spawnXRatio: 0.5,
          spawnY: 20,
          radius: 20,
          horizontalSpeed: 30,
          minimumXRatio: 0.2,
          maximumXRatio: 0.8,
          phases: [
            {
              phaseId: "opening",
              healthThreshold: 1,
              patterns: [
                {
                  patternSourceId: "fan.one",
                  attackChannelId: "boss.primary",
                  intervalMs: 200,
                  durationMs: 1_000,
                },
              ],
            },
          ],
        },
      },
      ...[
        ["enemy-source-a", "enemy.a", "radial.a", "enemy-owner"],
        ["enemy-source-b", "enemy.b", "spiral.b", "enemy-owner"],
        ["boss-source", "boss.primary", "fan.one", "boss-owner"],
      ].map(
        ([instanceId, attackChannelId, patternSourceId, ownerId], index) => ({
          instanceId: instanceId!,
          definition: source!,
          source: "slice" as const,
          ownerId: ownerId!,
          configuration: {
            attackChannelId,
            patternSourceId,
            activationMode: index === 2 ? "encounter-events" : "root-lifecycle",
            intervalMs: 200,
            durationMs: 1_000,
            maximumEmitters: index === 2 ? 1 : 2,
          },
        }),
      ),
      {
        instanceId: "enemy-fixed",
        definition: fixed!,
        source: "slice" as const,
        ownerId: "enemy-owner",
        configuration: {
          attackChannelId: "enemy.a",
          direction: { x: 0, y: 1 },
        },
      },
      {
        instanceId: "enemy-aimed",
        definition: aimed!,
        source: "extended" as const,
        ownerId: "enemy-owner",
        configuration: {
          attackChannelId: "enemy.b",
          playerSnapshotReadId: "hostile.player",
        },
      },
      {
        instanceId: "boss-fixed",
        definition: fixed!,
        source: "slice" as const,
        ownerId: "boss-owner",
        configuration: {
          attackChannelId: "boss.primary",
          direction: { x: 0, y: 1 },
        },
      },
      {
        instanceId: "enemy-radial",
        definition: radial!,
        source: "slice" as const,
        ownerId: "enemy-owner",
        configuration: {
          attackChannelId: "enemy.a",
          count: 3,
          maximumCountBonus: 0,
          speed: 100,
          damage: 1,
          textureRole: "enemy-projectile",
          maxActive: 4,
          maximumAcceptedRequestsPerSecond: 1,
          baseAngleOffsetDegrees: 0,
          recycleMargin: 20,
          exhaustionPolicy: "drop-and-observe",
        },
      },
      {
        instanceId: "enemy-spiral",
        definition: spiral!,
        source: "extended" as const,
        ownerId: "enemy-owner",
        configuration: {
          attackChannelId: "enemy.b",
          count: 3,
          maximumCountBonus: 0,
          speed: 100,
          damage: 1,
          textureRole: "enemy-projectile",
          maxActive: 4,
          maximumAcceptedRequestsPerSecond: 1,
          rotationStepDegrees: 20,
          recycleMargin: 20,
          exhaustionPolicy: "drop-and-observe",
        },
      },
      {
        instanceId: "boss-fan",
        definition: fan!,
        source: "extended" as const,
        ownerId: "boss-owner",
        configuration: {
          attackChannelId: "boss.primary",
          count: 3,
          maximumCountBonus: 0,
          speed: 100,
          damage: 1,
          textureRole: "enemy-projectile",
          maxActive: 4,
          maximumAcceptedRequestsPerSecond: 1,
          arcDegrees: 90,
          recycleMargin: 20,
          exhaustionPolicy: "drop-and-observe",
        },
      },
    ];
    const assembly = GameAssemblySpecV13Schema.parse({
      ...structuredClone(BATCH1_VERTICAL_SLICE_ASSEMBLY),
      schemaVersion: "1.3.0",
      actors: [
        ...structuredClone(BATCH1_VERTICAL_SLICE_ASSEMBLY.actors),
        { actorId: "enemy-owner", role: "enemy" },
        { actorId: "boss-owner", role: "boss" },
      ],
      modules: [
        ...structuredClone(BATCH1_VERTICAL_SLICE_ASSEMBLY.modules),
        ...moduleRequests.map(
          ({ instanceId, definition, ownerId, configuration }) => ({
            instanceId,
            moduleId: definition.manifest.moduleId,
            versionRange: definition.manifest.version,
            ownerId,
            configuration,
          }),
        ),
      ],
      bindings: [
        ...structuredClone(BATCH1_VERTICAL_SLICE_ASSEMBLY.bindings),
        {
          from: { instanceId: "boss-phases", portId: "handoff-request" },
          to: { instanceId: "enemy-waves", portId: "handoff-request" },
        },
        {
          from: { instanceId: "enemy-waves", portId: "handoff-cleared" },
          to: { instanceId: "boss-phases", portId: "handoff-cleared" },
        },
        ...[
          ["enemy-waves", "enemy-source-a"],
          ["enemy-waves", "enemy-source-b"],
          ["boss-phases", "boss-source"],
        ].flatMap(([producer, consumer]) => [
          {
            from: { instanceId: producer!, portId: "roots" },
            to: { instanceId: consumer!, portId: "roots" },
          },
          {
            from: { instanceId: producer!, portId: "lifecycle" },
            to: { instanceId: consumer!, portId: "lifecycle" },
          },
        ]),
        {
          from: { instanceId: "boss-phases", portId: "activations" },
          to: { instanceId: "boss-source", portId: "activations" },
        },
        ...[
          ["enemy-source-a", "enemy-fixed", "enemy-radial"],
          ["enemy-source-b", "enemy-aimed", "enemy-spiral"],
          ["boss-source", "boss-fixed", "boss-fan"],
        ].flatMap(([sourceId, targetingId, deliveryId]) => [
          {
            from: { instanceId: sourceId!, portId: "requests" },
            to: { instanceId: targetingId!, portId: "requests" },
          },
          {
            from: { instanceId: targetingId!, portId: "targeted" },
            to: { instanceId: deliveryId!, portId: "targeted" },
          },
        ]),
      ],
      effectApplicationBindings: [],
      pickupEffectPlanSelections: [],
      actorRootBindings: [
        ...["enemy-source-a", "enemy-source-b"].map((consumerInstanceId) => ({
          bindingId: `enemy.${consumerInstanceId}`,
          producerInstanceId: "enemy-waves",
          producerOutputPort: "roots",
          consumerInstanceId,
          consumerInputPort: "roots",
          expectedActorRole: "enemy",
          purpose: "pattern-source",
          maximumEntries: 2,
        })),
        {
          bindingId: "boss.pattern-source",
          producerInstanceId: "boss-phases",
          producerOutputPort: "roots",
          consumerInstanceId: "boss-source",
          consumerInputPort: "roots",
          expectedActorRole: "boss",
          purpose: "pattern-source",
          maximumEntries: 1,
        },
      ],
      hostileAggregateBudgetGroups: [
        {
          groupId: "hostile.shared",
          kind: "hostile-contention-v1",
          memberInstanceIds: ["enemy-radial", "enemy-spiral", "boss-fan"],
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
    const manifests = moduleRequests.map(
      ({ instanceId, definition, source: definitionSource }) => {
        const artifact = artifactFor(definition, definitionSource);
        const admitted = registry.findExactProductionV14(
          definition.manifest.moduleId,
          definition.manifest.version,
          artifact.envelopeSha256,
        )!;
        return {
          instanceId,
          manifest: GameModuleManifestV14Schema.parse(admitted.manifest),
        };
      },
    );
    const resolution = resolveBatch3AuthorityPlanV14({ assembly, manifests });
    expect(resolution.plan.actorRootChannels).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ actorRole: "enemy", capacity: 2 }),
        expect.objectContaining({ actorRole: "boss", capacity: 1 }),
      ]),
    );
    expect(
      resolution.plan.hostileAttackChannels.map((channel) => ({
        source: channel.sourceInstanceId,
        delivery: channel.deliveryInstanceId,
        group: channel.contentionGroupId,
      })),
    ).toEqual([
      {
        source: "enemy-source-a",
        delivery: "enemy-radial",
        group: "hostile.shared",
      },
      {
        source: "enemy-source-b",
        delivery: "enemy-spiral",
        group: "hostile.shared",
      },
      {
        source: "boss-source",
        delivery: "boss-fan",
        group: "hostile.shared",
      },
    ]);
    expect(resolution.plan.hostileContentionGroups[0]).toMatchObject({
      groupId: "hostile.shared",
      memberInstanceIds: ["enemy-radial", "enemy-spiral", "boss-fan"],
    });
  });

  it("uses one host-frozen source read for the actual aimed factory", async () => {
    const registry = await createBatch3EncounterHostileRegistry();
    const definition = BATCH3_ENCOUNTER_HOSTILE_DEFINITIONS[1]!;
    const factory = registry.findExactProductionV14(
      definition.manifest.moduleId,
      definition.manifest.version,
      artifactFor(definition).envelopeSha256,
    )!.executableHandle!.loadedExport as (context: unknown) => unknown;
    const handlers = new Map<string, (value: any) => unknown>();
    const proposals: any[] = [];
    const read = vi.fn(() => ({
      directoryRevision: 0,
      sampledAtMs: 0,
      sampledFrameSequence: 0,
      entryCount: 1,
      entries: [
        {
          actorId: "player-one",
          actorGeneration: 0,
          role: "player",
          active: true,
          position: { x: 13, y: 24 },
        },
      ],
    }));
    factory({
      ...common(
        "enemy-aimed",
        definition.manifest.moduleId,
        definition.manifest.version,
        {
          attackChannelId: "enemy.primary",
          playerSnapshotReadId: "hostile.player",
        },
        () => 0,
      ),
      services: {
        ...common(
          "enemy-aimed",
          "targeting.hostile-aimed",
          "1.0.0",
          {},
          () => 0,
        ).services,
        actorSnapshots: { read },
      },
      ports: {
        declareHandler: (id: string, handler: (value: any) => unknown) =>
          handlers.set(id, handler),
        emitEvent: (_id: string, value: unknown) => proposals.push(value),
        publishState: () => undefined,
        declareAddressedHandler: () => undefined,
      },
    });
    const router = new HostileAttackLineageRouterV1({
      sourceInstanceId: "enemy-source",
      targetingInstanceId: "enemy-aimed",
      deliveryInstanceId: "enemy-delivery",
      rootChannelId: "enemy.roots",
      attackChannelId: "enemy.primary",
      projectileChannelId: "enemy.projectiles",
      maximumPending: 1,
      readActiveSource: () => ({ position: { x: 10, y: 20 } }),
    });
    const request = router.acceptRequest("enemy-source", {
      sequence: 0,
      emittedAtMs: 0,
      requestedAtMs: 0,
      attackChannelId: "enemy.primary",
      rootChannelId: "enemy.roots",
      sourceActorId: "root/enemy-source/0",
      sourceGeneration: 2,
      patternSourceId: "aimed.one",
      emissionIndex: 0,
    });
    handlers.get("requests")!(request);
    expect(read).toHaveBeenCalledOnce();
    expect(
      router.targetPosition(
        "enemy-aimed",
        proposals[0].request,
        proposals[0].targetPosition,
      ).direction,
    ).toEqual({ x: 0.6, y: 0.8 });
    router.dispose();
  });

  it("performs wave handoff, enemy slot reuse, and Boss phase cancellation through actual factories", async () => {
    const registry = await createBatch3EncounterHostileRegistry();
    const wavesDefinition = BATCH3_HOSTILE_SLICE_DEFINITIONS[0]!;
    const bossDefinition = BATCH3_ENCOUNTER_HOSTILE_DEFINITIONS[0]!;
    const wavesFactory = registry.findExactProductionV14(
      wavesDefinition.manifest.moduleId,
      wavesDefinition.manifest.version,
      artifactFor(wavesDefinition, "slice").envelopeSha256,
    )!.executableHandle!.loadedExport as (context: unknown) => any;
    const bossFactory = registry.findExactProductionV14(
      bossDefinition.manifest.moduleId,
      bossDefinition.manifest.version,
      artifactFor(bossDefinition).envelopeSha256,
    )!.executableHandle!.loadedExport as (context: unknown) => any;
    let now = 0;
    const session = new RuntimeKernelSessionQuarantineLedgerV12(16);
    const enemyPhysical = new Map<string, unknown>();
    const bossPhysical = new Map<string, unknown>();
    const rootHost = (
      producerInstanceId: string,
      rootChannelId: string,
      actorRole: "enemy" | "boss",
      physical: Map<string, unknown>,
    ) =>
      new ActorRootCustodyHostV1({
        producerInstanceId,
        rootChannelId,
        actorRole,
        capacity: 1,
        session,
        reserveActiveEntity: () => () => undefined,
        adapter: {
          activatePhysical: (reference, request) =>
            physical.set(reference.actorId, request),
          activateLogical: () => undefined,
          deactivatePhysical: (reference) => {
            physical.delete(reference.actorId);
            return true;
          },
          deactivateLogical: () => true,
        },
      });
    const enemyHost = rootHost(
      "enemy-waves",
      "root-channel.enemy-waves.enemy.roots",
      "enemy",
      enemyPhysical,
    );
    const bossHost = rootHost(
      "boss-phases",
      "root-channel.boss-phases.boss.roots",
      "boss",
      bossPhysical,
    );
    const waveHandlers = new Map<string, (value: any) => unknown>();
    const bossHandlers = new Map<string, (value: any) => unknown>();
    const enemyLifecycle: any[] = [];
    const bossLifecycle: any[] = [];
    const activations: any[] = [];
    const waves = wavesFactory({
      ...common(
        "enemy-waves",
        "encounter.scrolling-waves",
        "1.0.0",
        {
          maximumEnemies: 1,
          maximumSpawnsPerSecond: 20,
          sourceIds: ["scout"],
          assetRoleBySource: { scout: "enemy" },
          spawnY: 0,
          radius: 5,
          waves: [
            {
              sourceId: "scout",
              startsAtMs: 0,
              endsAtMs: 500,
              intervalMs: 50,
              maxAlive: 1,
              speed: 100,
            },
          ],
        },
        () => now,
      ),
      services: {
        ...common(
          "enemy-waves",
          "encounter.scrolling-waves",
          "1.0.0",
          {},
          () => now,
        ).services,
        actorRoots: {
          activate: (_grant: string, request: any) =>
            enemyHost.activate(request),
          deactivate: (_grant: string, request: any) =>
            enemyHost.deactivate(request.reference, request.reason),
        },
      },
      ports: {
        declareHandler: (id: string, handler: (value: any) => unknown) =>
          waveHandlers.set(id, handler),
        publishState: () => undefined,
        emitEvent: (id: string, value: any) => {
          if (id === "lifecycle") enemyLifecycle.push(value);
          if (id === "handoff-cleared")
            bossHandlers.get("handoff-cleared")!(value);
        },
        declareAddressedHandler: () => undefined,
      },
    });
    const boss = bossFactory({
      ...common(
        "boss-phases",
        "encounter.boss-phases",
        "1.0.0",
        {
          bossStartMs: 100,
          handoffId: "waves-to-boss",
          maximumBosses: 1,
          sourceIds: ["dragon"],
          assetRoleBySource: { dragon: "boss" },
          spawnXRatio: 0.5,
          spawnY: 10,
          radius: 20,
          horizontalSpeed: 30,
          minimumXRatio: 0.2,
          maximumXRatio: 0.8,
          phases: [
            {
              phaseId: "opening",
              healthThreshold: 1,
              patterns: [
                {
                  patternSourceId: "spiral.one",
                  attackChannelId: "boss.primary",
                  intervalMs: 100,
                  durationMs: 1_000,
                },
              ],
            },
            {
              phaseId: "rage",
              healthThreshold: 0.5,
              patterns: [
                {
                  patternSourceId: "fan.one",
                  attackChannelId: "boss.primary",
                  intervalMs: 50,
                  durationMs: 1_000,
                },
              ],
            },
          ],
        },
        () => now,
      ),
      services: {
        ...common(
          "boss-phases",
          "encounter.boss-phases",
          "1.0.0",
          {},
          () => now,
        ).services,
        actorRoots: {
          activate: (_grant: string, request: any) =>
            bossHost.activate(request),
          deactivate: (_grant: string, request: any) =>
            bossHost.deactivate(request.reference, request.reason),
        },
      },
      ports: {
        declareHandler: (id: string, handler: (value: any) => unknown) =>
          bossHandlers.set(id, handler),
        publishState: () => undefined,
        emitEvent: (id: string, value: any) => {
          if (id === "handoff-request")
            waveHandlers.get("handoff-request")!(value);
          if (id === "lifecycle") bossLifecycle.push(value);
          if (id === "activations") activations.push(value);
        },
        declareAddressedHandler: () => undefined,
      },
    });
    waves.initialize();
    boss.initialize();
    waves.update(0);
    now = 50;
    waves.update(2_000);
    expect(
      enemyLifecycle
        .filter((value) => value.reason === "activated")
        .map((value) => value.actorGeneration),
    ).toEqual([0, 1]);
    now = 100;
    boss.update();
    expect(enemyPhysical.size).toBe(0);
    expect(bossPhysical.size).toBe(1);
    expect(bossLifecycle[0]).toMatchObject({
      actorId: "root/boss-phases/0",
      actorGeneration: 0,
      reason: "activated",
    });
    expect(activations.map((value) => value.patternSourceId)).toEqual([
      "spiral.one",
    ]);
    bossHandlers.get("health")!({
      revision: 1,
      emittedAtMs: 100,
      rootChannelId: "root-channel.boss-phases.boss.roots",
      actorId: "root/boss-phases/0",
      actorGeneration: 0,
      actorRole: "boss",
      sourceId: "dragon",
      current: 40,
      maximum: 100,
      ratio: 0.4,
      reason: "damaged",
    });
    expect(bossLifecycle.at(-1)?.reason).toBe("phase-transition");
    expect(activations.at(-1)?.patternSourceId).toBe("fan.one");
    boss.stop();
    waves.stop();
    expect(bossPhysical.size).toBe(0);
    enemyHost.dispose();
    bossHost.dispose();
  });

  it("matches all seven reviewed planners and proves three independent members share one host cap", async () => {
    const registry = await createBatch3EncounterHostileRegistry();
    const configurations: Record<string, Record<string, unknown>> = {
      spiral: { rotationStepDegrees: 20 },
      fan: { arcDegrees: 90 },
      aimed: { aimSpreadDegrees: 30 },
      wave: { waveSpreadDegrees: 40, phaseStepDegrees: 90 },
      rain: { spreadDegrees: 30, downwardBaseDirection: { x: 0, y: 1 } },
      rotatingRing: { ringRotationStepDegrees: 12 },
      burst: {
        burstSpreadDegrees: 15,
        emissionIndexMode: "stable-request-sequence",
      },
    };
    for (const definition of BATCH3_ENCOUNTER_HOSTILE_DEFINITIONS.slice(2)) {
      const factory = registry.findExactProductionV14(
        definition.manifest.moduleId,
        definition.manifest.version,
        artifactFor(definition).envelopeSha256,
      )!.executableHandle!.loadedExport as (context: unknown) => any;
      const patternKey =
        definition.manifest.moduleId === "delivery.pattern.rotating-ring"
          ? "rotatingRing"
          : definition.manifest.moduleId.split(".").at(-1)!;
      const handlers = new Map<string, (value: any) => unknown>();
      const emissions: any[] = [];
      let plans: any[] = [];
      const config = {
        attackChannelId: "enemy.primary",
        count: 3,
        maximumCountBonus: 0,
        speed: 100,
        damage: 2,
        textureRole: "enemy-projectile",
        maxActive: 6,
        maximumAcceptedRequestsPerSecond: 2,
        recycleMargin: 20,
        exhaustionPolicy: "drop-and-observe",
        ...configurations[patternKey],
      };
      const instance = factory({
        ...common(
          `${patternKey}-delivery`,
          definition.manifest.moduleId,
          "1.1.0",
          config,
          () => 0,
        ),
        services: {
          ...common(
            "delivery",
            definition.manifest.moduleId,
            "1.1.0",
            {},
            () => 0,
          ).services,
          hostileProjectileDelivery: {
            admit: (_grant: string, request: any) => {
              plans = request.plans;
              return {
                activated: request.plans.map((_: unknown, index: number) => ({
                  projectileEntityId: `${patternKey}-projectile-${index}`,
                  projectileChannelId: "projectiles",
                  projectileGeneration: index,
                })),
              };
            },
            recycle: () => undefined,
            observe: () => ({}),
          },
        },
        ports: {
          declareHandler: (id: string, handler: (value: any) => unknown) =>
            handlers.set(id, handler),
          emitEvent: (_id: string, value: any) => emissions.push(value),
          publishState: () => undefined,
          declareAddressedHandler: () => undefined,
        },
      });
      instance.initialize();
      handlers.get("targeted")!({
        sequence: 2,
        emittedAtMs: 0,
        requestedAtMs: 0,
        attackChannelId: "enemy.primary",
        rootChannelId: "enemy.roots",
        sourceActorId: "root/enemy-source/0",
        sourceGeneration: 1,
        patternSourceId: `${patternKey}.one`,
        emissionIndex: 2,
        sourcePosition: { x: 10, y: 20 },
        direction: { x: 0, y: 1 },
      });
      const expected = planBatch2DeliveryFormation({
        kind: patternKey as never,
        count: 3,
        targetDirection: { x: 0, y: 1 },
        emissionIndex: 2,
        configuration: config,
      });
      expect(plans).toHaveLength(3);
      expect(emissions).toHaveLength(3);
      plans.forEach((plan, index) => {
        expect(plan.velocity.x).toBeCloseTo(
          expected[index]!.direction.x * 100,
          10,
        );
        expect(plan.velocity.y).toBeCloseTo(
          expected[index]!.direction.y * 100,
          10,
        );
      });
      instance.stop();
    }

    const contention = new HostileAggregateContentionHostV1({
      groupId: "hostile.shared",
      orderedMemberInstanceIds: ["enemy-radial", "enemy-spiral", "boss-fan"],
      activeEntityCapacity: 5,
      activeProjectileCapacity: 5,
      spawnsPerSecondCapacity: 5,
      nowMs: () => 0,
      session: new RuntimeKernelSessionQuarantineLedgerV12(16),
    });
    const admissions = contention.admitFrame(0, [
      {
        memberInstanceId: "enemy-radial",
        requestSequence: 0,
        plannedProjectiles: 3,
      },
      {
        memberInstanceId: "enemy-spiral",
        requestSequence: 0,
        plannedProjectiles: 3,
      },
      {
        memberInstanceId: "boss-fan",
        requestSequence: 0,
        plannedProjectiles: 3,
      },
    ]);
    expect(admissions.map((value) => value.admittedTokenIds.length)).toEqual([
      3, 2, 0,
    ]);
    expect(
      admissions.map((value) => ({
        member: value.memberInstanceId,
        dropped: value.droppedProjectiles,
      })),
    ).toEqual([
      { member: "enemy-radial", dropped: 0 },
      { member: "enemy-spiral", dropped: 1 },
      { member: "boss-fan", dropped: 3 },
    ]);
  });
});
