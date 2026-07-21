import { describe, expect, it } from "vitest";

import {
  BATCH2_DELIVERY_DEFINITIONS,
  createBatch2DeliveryRegistry,
  planBatch2DeliveryFormation,
} from "../../src/modules/batch2-delivery-library.js";

const common = {
  attackChannelId: "player.primary",
  baseCount: 3,
  speed: 600,
  baseDamage: 10,
  textureRole: "player-projectile",
  spawnOffset: { x: 0, y: -20 },
  maxActive: 16,
  maximumAcceptedRequestsPerSecond: 5,
  maximumCountBonus: 2,
  maximumDamageMultiplier: 2,
  recycleMargin: 32,
  exhaustionPolicy: "drop-and-observe",
} as const;

const configurations = {
  "delivery.spread": {
    ...common,
    totalArcDegrees: 60,
    centeredOrdering: true,
  },
  "delivery.multi-shot": { ...common, lateralSpacing: 12 },
  "delivery.pattern.radial": { ...common, baseAngleOffsetDegrees: 15 },
  "delivery.pattern.spiral": { ...common, rotationStepDegrees: 20 },
  "delivery.pattern.fan": { ...common, arcDegrees: 90 },
  "delivery.pattern.aimed": { ...common, aimSpreadDegrees: 30 },
  "delivery.pattern.wave": {
    ...common,
    waveSpreadDegrees: 40,
    phaseStepDegrees: 90,
  },
  "delivery.pattern.rain": {
    ...common,
    spreadDegrees: 20,
    downwardBaseDirection: { x: 0, y: 1 },
  },
  "delivery.pattern.rotating-ring": {
    ...common,
    ringRotationStepDegrees: 12,
  },
  "delivery.pattern.burst": {
    ...common,
    burstSpreadDegrees: 15,
    emissionIndexMode: "stable-request-sequence",
  },
} as const;

describe("Batch 2 delivery production library", () => {
  it("loader-admits all ten Manifest 1.3 definitions over one bundle", async () => {
    const registry = await createBatch2DeliveryRegistry();
    expect(BATCH2_DELIVERY_DEFINITIONS).toHaveLength(10);
    expect(registry.list()).toHaveLength(10);

    const implementationHashes = new Set<string>();
    for (const definition of BATCH2_DELIVERY_DEFINITIONS) {
      const registration = registry.find(
        definition.manifest.moduleId,
        definition.manifest.version,
      )[0]!;
      expect(registration.registrationKind).toBe("production");
      expect(registration.manifest.schemaVersion).toBe("1.3.0");
      expect(registration.executableHandle?.exportKind).toBe(
        "lifecycle-create-v1",
      );
      expect(registration.artifactIdentity?.envelopeSha256).toMatch(
        /^[a-f0-9]{64}$/,
      );
      implementationHashes.add(registration.implementationBundle!.sha256);
    }
    expect(implementationHashes.size).toBe(1);
  });

  it("closes attack, channel, modifier, and host-resource authority exactly", () => {
    for (const definition of BATCH2_DELIVERY_DEFINITIONS) {
      const manifest = definition.manifest;
      expect(manifest.attackChannel).toEqual({
        role: "delivery",
        configurationField: "attackChannelId",
        targetInputPort: "target",
        targetPayloadType: "target-solution-v1",
        requestInputPort: "request",
        requestPayloadType: "attack-request-v2",
      });
      expect(
        manifest.provides.some(
          ({ id, version }) =>
            id === "delivery.projectile-channel" && version === "1.0.0",
        ),
      ).toBe(true);
      expect(manifest.ownedEntityChannels).toEqual([
        expect.objectContaining({
          channelId: "projectiles",
          entityRole: "projectile",
          capacity: {
            kind: "resource-grant",
            resources: ["activeEntities", "activeProjectiles"],
          },
        }),
      ]);
      expect(manifest.modifierTargets).toEqual([
        expect.objectContaining({ fieldId: "attack.damage.multiplier" }),
        expect.objectContaining({
          fieldId: "attack.projectile-count.bonus",
        }),
      ]);
      expect(manifest.resources).toEqual({
        activeEntities: 256,
        activeProjectiles: 256,
        spawnsPerSecond: 2_560,
        timers: 0,
      });
    }
  });

  it("uses maximum-reachable reservations and strict adapter configurations", async () => {
    const registry = await createBatch2DeliveryRegistry();
    for (const definition of BATCH2_DELIVERY_DEFINITIONS) {
      const configuration =
        configurations[
          definition.manifest.moduleId as keyof typeof configurations
        ];
      const registration = registry.find(
        definition.manifest.moduleId,
        definition.manifest.version,
      )[0]!;
      expect(definition.configurationSchema.parse(configuration)).toEqual(
        configuration,
      );
      expect(registration.evaluateResourceReservation(configuration)).toEqual({
        activeEntities: 16,
        activeProjectiles: 16,
        spawnsPerSecond: 25,
        timers: 0,
      });
      expect(() =>
        definition.configurationSchema.parse({
          ...configuration,
          undeclaredGeometry: 1,
        }),
      ).toThrow();
    }

    const spread = BATCH2_DELIVERY_DEFINITIONS[0]!;
    expect(() =>
      spread.configurationSchema.parse({
        ...configurations["delivery.spread"],
        maxActive: 4,
      }),
    ).toThrow(/maximum effective count/);
    expect(() =>
      spread.configurationSchema.parse({
        ...configurations["delivery.spread"],
        arcDegrees: 30,
      }),
    ).toThrow();
  });
});

describe("shared Batch 2 delivery formation planner", () => {
  const targetDirection = { x: 1, y: 0 } as const;

  it("plans centered spread and centered lateral multi-shot order", () => {
    const spread = planBatch2DeliveryFormation({
      kind: "spread",
      count: 3,
      targetDirection,
      emissionIndex: 0,
      configuration: { totalArcDegrees: 60 },
    });
    expect(spread.map(({ angleRadians }) => angleRadians)).toEqual([
      0,
      expect.closeTo(-Math.PI / 6, 10),
      expect.closeTo(Math.PI / 6, 10),
    ]);

    const multi = planBatch2DeliveryFormation({
      kind: "multi-shot",
      count: 4,
      targetDirection,
      emissionIndex: 0,
      configuration: { lateralSpacing: 10 },
    });
    expect(multi.map(({ lateralOffset }) => lateralOffset.y)).toEqual([
      -5, 5, -15, 15,
    ]);
  });

  it("keeps all eight pattern adapters deterministic through the shared planner", () => {
    const inputs = [
      ["radial", { baseAngleOffsetDegrees: 0 }],
      ["spiral", { rotationStepDegrees: 15 }],
      ["fan", { arcDegrees: 90 }],
      ["aimed", { aimSpreadDegrees: 20 }],
      ["wave", { waveSpreadDegrees: 40, phaseStepDegrees: 90 }],
      ["rain", { spreadDegrees: 30, downwardBaseDirection: { x: 0, y: 1 } }],
      ["rotatingRing", { ringRotationStepDegrees: 12 }],
      ["burst", { burstSpreadDegrees: 10 }],
    ] as const;
    for (const [kind, configuration] of inputs) {
      const input = {
        kind,
        count: 4,
        targetDirection,
        emissionIndex: 2,
        configuration,
      } as const;
      const first = planBatch2DeliveryFormation(input);
      const second = planBatch2DeliveryFormation(input);
      expect(second).toEqual(first);
      expect(first).toHaveLength(4);
      expect(Object.isFrozen(first)).toBe(true);
      expect(
        first.every(
          ({ direction }) =>
            Math.abs(Math.hypot(direction.x, direction.y) - 1) <= 1e-12,
        ),
      ).toBe(true);
    }
  });

  it("maps rotatingRing without leaking it into module IDs and validates inputs", () => {
    const ring = planBatch2DeliveryFormation({
      kind: "rotatingRing",
      count: 2,
      targetDirection,
      emissionIndex: 3,
      configuration: { ringRotationStepDegrees: 10 },
    });
    expect(ring[0]!.angleRadians).toBeCloseTo(Math.PI / 6, 10);
    expect(
      BATCH2_DELIVERY_DEFINITIONS.some(({ manifest }) =>
        manifest.moduleId.includes("rotatingRing"),
      ),
    ).toBe(false);
    expect(() =>
      planBatch2DeliveryFormation({
        kind: "fan",
        count: 0,
        targetDirection,
        emissionIndex: 0,
        configuration: { arcDegrees: 30 },
      }),
    ).toThrow(/positive safe integer/);
    expect(() =>
      planBatch2DeliveryFormation({
        kind: "fan",
        count: 2,
        targetDirection: { x: 2, y: 0 },
        emissionIndex: 0,
        configuration: { arcDegrees: 30 },
      }),
    ).toThrow(/normalized/);
  });
});
