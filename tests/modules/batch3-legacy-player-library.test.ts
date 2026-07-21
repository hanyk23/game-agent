import { describe, expect, it } from "vitest";

import { createBatch2CoreProductionRegistry } from "../../src/modules/batch2-core-library.js";
import {
  BATCH3_LEGACY_PLAYER_DEFINITIONS,
  createBatch3LegacyPlayerRegistry,
} from "../../src/modules/batch3-legacy-player-library.js";
import { createBatch3ProductionRegistry } from "../../src/modules/batch3-production-library.js";
import { createModuleArtifactHashDescriptor } from "../../src/modules/game-module-execution-contract.js";

const lockIdentity = new TextEncoder().encode(
  "pnpm-lock.batch3.legacy-player.v1",
);
const toolchainIdentity = new TextEncoder().encode(
  "typescript-5.9.3.esm-self-contained.batch3.legacy-player.v1",
);

describe("Batch 3 legacy player compatibility library", () => {
  it("loader-admits trigger.interval@1.1.0 with the V13 attack-channel ABI", async () => {
    const definition = BATCH3_LEGACY_PLAYER_DEFINITIONS.find(
      ({ manifest }) => manifest.moduleId === "trigger.interval",
    )!;
    const registry = await createBatch3LegacyPlayerRegistry();
    const implementationBundle = new TextEncoder().encode(
      definition!.implementationSource,
    );
    const artifact = createModuleArtifactHashDescriptor({
      manifest: definition!.manifest,
      configurationDescriptor: definition!.configurationDescriptor,
      reservationDescriptor: definition!.reservationDescriptor,
      implementationBundle,
      dependencyLockIdentity: lockIdentity,
      toolchainIdentity,
    });

    expect(definition!.manifest).toMatchObject({
      schemaVersion: "1.3.0",
      moduleId: "trigger.interval",
      version: "1.1.0",
      cardinality: { maximumInstancesPerOwner: 4 },
      resources: { timers: 1 },
      attackChannel: {
        role: "trigger",
        configurationField: "attackChannelId",
        requestOutputPort: "request",
        requestPayloadType: "attack-request-v2",
      },
    });
    expect(
      registry.findExactProduction(
        "trigger.interval",
        "1.1.0",
        artifact.envelopeSha256,
      )?.executableHandle?.loadedExport,
    ).toBeTypeOf("function");
  });

  it("admits reusable fixed-forward and independent player projectile channels", async () => {
    const registry = await createBatch3LegacyPlayerRegistry();
    expect(
      BATCH3_LEGACY_PLAYER_DEFINITIONS.map(
        ({ manifest }) => `${manifest.moduleId}@${manifest.version}`,
      ),
    ).toEqual([
      "targeting.fixed-forward@1.1.0",
      "trigger.interval@1.1.0",
      "delivery.projectile@1.1.0",
      "combat.graze@1.1.0",
    ]);
    for (const definition of BATCH3_LEGACY_PLAYER_DEFINITIONS) {
      const registration = registry.find(
        definition.manifest.moduleId,
        definition.manifest.version,
      )[0]!;
      expect(registration.registrationKind).toBe("production");
      expect(registration.executableHandle?.loadedExport).toBeTypeOf(
        "function",
      );
      expect(
        definition.manifest.cardinality.maximumInstancesPerOwner,
      ).toBeGreaterThanOrEqual(4);
    }
    const targeting = BATCH3_LEGACY_PLAYER_DEFINITIONS[0]!.manifest;
    expect(targeting.attackChannel).toMatchObject({
      role: "targeting",
      targetPayloadType: "target-solution-v1",
    });
    const delivery = BATCH3_LEGACY_PLAYER_DEFINITIONS[2]!.manifest;
    expect(delivery.exclusiveOwnership).toEqual([]);
    expect(delivery.projectileDelivery).toMatchObject({
      capability: "delivery.projectile@1.0.0",
      channelId: "projectiles",
    });
    expect(delivery.ownedEntityChannels).toEqual([
      expect.objectContaining({
        channelId: "projectiles",
        poolDescriptor: expect.objectContaining({
          poolId: "projectiles.pool",
        }),
      }),
    ]);
    expect(delivery.inputPorts).toContainEqual(
      expect.objectContaining({
        id: "modifier",
        payloadType: "modifier-application-v1",
      }),
    );
    expect(delivery.outputPorts).toContainEqual(
      expect.objectContaining({
        id: "modifier-state",
        payloadType: "modifier-state-v1",
      }),
    );
    expect(delivery.modifierTargets).toEqual([
      {
        fieldId: "attack.damage.multiplier",
        inputPort: "modifier",
        operation: "add",
        minimum: 0,
        maximum: 12_000_000,
        reset: "dispose-new-graph",
      },
    ]);
    const graze = BATCH3_LEGACY_PLAYER_DEFINITIONS[3]!.manifest;
    expect(graze).toMatchObject({
      moduleId: "combat.graze",
      version: "1.1.0",
      exclusiveOwnership: [],
      cardinality: { maximumInstancesPerOwner: 16 },
    });
  });

  it("keeps the reviewed 1.0 registration byte-identical while adding 1.1", async () => {
    const before = await createBatch2CoreProductionRegistry();
    const after = await createBatch3ProductionRegistry();
    const oldBefore = before.find("trigger.interval", "1.0.0")[0]!;
    const oldAfter = after.find("trigger.interval", "1.0.0")[0]!;

    expect(oldAfter.artifactIdentity).toEqual(oldBefore.artifactIdentity);
    expect(oldAfter.manifestSha256).toBe(oldBefore.manifestSha256);
    expect(after.find("trigger.interval", "1.1.0")).toHaveLength(1);
    expect(
      after
        .find("trigger.interval", "^1.0.0")
        .map((entry) => entry.manifest.version),
    ).toEqual(["1.0.0", "1.1.0"]);
    const oldDeliveryBefore = before.find("delivery.projectile", "1.0.0")[0]!;
    const oldDeliveryAfter = after.find("delivery.projectile", "1.0.0")[0]!;
    expect(oldDeliveryAfter.artifactIdentity).toEqual(
      oldDeliveryBefore.artifactIdentity,
    );
    expect(oldDeliveryAfter.manifestSha256).toBe(
      oldDeliveryBefore.manifestSha256,
    );
  });

  it("normalizes one flat weaponPower pickup across independent parallel weapons", async () => {
    const registry = await createBatch3ProductionRegistry();
    const transform = registry.find("progression.modifier", "1.0.0")[0]!
      .executableHandle!.loadedExport as (
      configuration: unknown,
      collected: { effectId: string; value: number },
    ) => ReadonlyArray<{
      targetInstanceId: string;
      fieldId: string;
      operation: string;
      value: number;
    }>;
    const applications = transform(
      {
        maximumApplicationsPerPickup: 4,
        mappings: [
          {
            effectId: "weaponPower",
            applications: [
              {
                routeId: "pickup.effect-route.primary-power",
                targetInstanceId: "primary-delivery",
                fieldId: "attack.damage.multiplier",
                operation: "add",
                valueScale: 1 / 20,
                minimumValue: 0.005,
                maximumValue: 5,
              },
              {
                routeId: "pickup.effect-route.secondary-power",
                targetInstanceId: "secondary-delivery",
                fieldId: "attack.damage.multiplier",
                operation: "add",
                valueScale: 1 / 7,
                minimumValue: 0.005,
                maximumValue: 5,
              },
            ],
          },
        ],
      },
      { effectId: "weaponPower", value: 3 },
    );
    expect(
      applications.map(({ targetInstanceId }) => targetInstanceId),
    ).toEqual(["primary-delivery", "secondary-delivery"]);
    expect(applications[0]!.value).toBeCloseTo(3 / 20, 12);
    expect(applications[1]!.value).toBeCloseTo(3 / 7, 12);

    const delivery = registry.find("delivery.projectile", "1.1.0")[0]!;
    const create = delivery.executableHandle!.loadedExport as (
      context: Record<string, unknown>,
    ) => { initialize(): void };
    const instantiate = (instanceId: string, damage: number, value: number) => {
      const handlers = new Map<string, (payload: any) => void>();
      const addressed = new Map<string, (payload: any) => void>();
      const plans: any[][] = [];
      const emitted: any[] = [];
      const participant = create({
        identity: {
          instanceId,
          ownerId: "player-one",
          moduleId: "delivery.projectile",
        },
        configuration: {
          attackChannelId: `player.${instanceId}`,
          projectileCount: 1,
          maximumCountBonus: 0,
          speed: 500,
          damage,
          maximumWeaponPowerBonus: 3,
          textureRole: "player-projectile",
          spawnOffsetY: -24,
          lateralSpacing: 0,
          maxActive: 8,
          maximumAcceptedRequestsPerSecond: 8,
          recycleMargin: 16,
          exhaustionPolicy: "drop-and-observe",
        },
        services: {
          actors: {
            readOwner: () => ({ active: true, position: { x: 100, y: 500 } }),
          },
          viewport: { read: () => ({ width: 800, height: 600 }) },
          projectileDelivery: {
            admit: (_sequence: number, plan: any[]) => {
              plans.push(plan);
              return {
                accepted: true,
                activated: plan.map((_spawn, index) => ({
                  entityId: `${instanceId}-${index}`,
                  channelId: `${instanceId}.projectiles`,
                  ownerActorId: "player-one",
                  generation: 0,
                })),
              };
            },
            observe: () => ({}),
            recycle: () => undefined,
          },
          observation: { register: () => undefined },
        },
        assets: { requireTexture: () => "player-projectile" },
        clock: { nowMs: () => 100 },
        ports: {
          declareHandler: (id: string, handler: (payload: any) => void) =>
            handlers.set(id, handler),
          declareAddressedHandler: (
            id: string,
            handler: (payload: any) => void,
          ) => addressed.set(id, handler),
          publishState: () => undefined,
          emitEvent: (_id: string, payload: unknown) => emitted.push(payload),
        },
      });
      participant.initialize();
      handlers.get("target")!({
        attackChannelId: `player.${instanceId}`,
        direction: { x: 0, y: -1 },
      });
      addressed.get("attack.damage.multiplier")!({
        targetInstanceId: instanceId,
        fieldId: "attack.damage.multiplier",
        operation: "add",
        value,
      });
      handlers.get("request")!({
        sequence: 0,
        attackChannelId: `player.${instanceId}`,
      });
      return { plans, emitted };
    };
    const primary = instantiate("primary-delivery", 20, applications[0]!.value);
    const secondary = instantiate(
      "secondary-delivery",
      7,
      applications[1]!.value,
    );
    expect(primary.plans[0]![0]!.damage).toBeCloseTo(23, 12);
    expect(secondary.plans[0]![0]!.damage).toBeCloseTo(10, 12);
    expect(primary.emitted[0]!.channelId).toBe("primary-delivery.projectiles");
    expect(secondary.emitted[0]!.channelId).toBe(
      "secondary-delivery.projectiles",
    );
  });

  it("uses each configured fire interval as an independent automatic cadence", async () => {
    const registry = await createBatch3LegacyPlayerRegistry();
    const registration = registry.find("trigger.interval", "1.1.0")[0]!;
    const create = registration.executableHandle!.loadedExport as (context: {
      identity: { instanceId: string };
      configuration: { attackChannelId: string; intervalMs: number };
      services: {
        observation: { register(id: string, reader: () => unknown): void };
      };
      ports: { emitEvent(portId: string, payload: unknown): void };
      clock: {
        nowMs(): number;
        schedule(schedule: {
          mode: string;
          initialDelayMs: number;
          intervalMs: number;
          callback(): void;
        }): { active: boolean; cancel(): void };
      };
    }) => {
      initialize(): void;
      start(): void;
      stop(): void;
    };
    let nowMs = 0;
    let scheduled:
      | {
          mode: string;
          initialDelayMs: number;
          intervalMs: number;
          callback(): void;
        }
      | undefined;
    const emissions: Array<{ portId: string; payload: unknown }> = [];
    const timer = {
      active: true,
      cancel() {
        this.active = false;
      },
    };
    const participant = create({
      identity: { instanceId: "player-primary-trigger" },
      configuration: { attackChannelId: "player.primary", intervalMs: 80 },
      services: { observation: { register() {} } },
      ports: {
        emitEvent(portId, payload) {
          emissions.push({ portId, payload });
        },
      },
      clock: {
        nowMs: () => nowMs,
        schedule(schedule) {
          scheduled = schedule;
          return timer;
        },
      },
    });

    participant.initialize();
    participant.start();
    expect(emissions).toEqual([]);
    expect(scheduled).toMatchObject({
      mode: "interval",
      initialDelayMs: 80,
      intervalMs: 80,
    });

    nowMs = 80;
    scheduled!.callback();
    nowMs = 160;
    scheduled!.callback();
    expect(emissions).toEqual([
      {
        portId: "request",
        payload: {
          sequence: 0,
          emittedAtMs: 80,
          requestedAtMs: 80,
          attackChannelId: "player.primary",
          slot: "primary",
        },
      },
      {
        portId: "request",
        payload: {
          sequence: 1,
          emittedAtMs: 160,
          requestedAtMs: 160,
          attackChannelId: "player.primary",
          slot: "primary",
        },
      },
    ]);
    participant.stop();
    expect(timer.active).toBe(false);
  });

  it("fails closed on invalid or expanded interval configuration", () => {
    const schema = BATCH3_LEGACY_PLAYER_DEFINITIONS[0]!.configurationSchema;
    expect(() =>
      schema.parse({ attackChannelId: "player.primary", intervalMs: 49 }),
    ).toThrow();
    expect(() =>
      schema.parse({
        attackChannelId: "player.primary",
        intervalMs: 80,
        unreviewed: true,
      }),
    ).toThrow();
  });
});
