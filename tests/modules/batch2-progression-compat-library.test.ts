import { describe, expect, it } from "vitest";

import {
  BATCH2_PROGRESSION_COMPAT_DEFINITIONS,
  createBatch2ProgressionCompatRegistry,
} from "../../src/modules/batch2-progression-compat-library.js";

const configurations = {
  "progression.pickup-spawn": {
    schedule: [
      {
        atMs: 0,
        effectId: "heal",
        value: 10,
        position: { x: 360, y: 40 },
      },
      {
        atMs: 1000,
        effectId: "scoreBonus",
        value: 100,
        position: { x: 180, y: 40 },
      },
    ],
    fallSpeed: 120,
    textureRole: "pickup",
    maxActive: 16,
    maximumSpawnRate: 4,
    schedulerIntervalMs: 50,
    poolExhaustion: "drop-and-observe",
  },
  "progression.pickup-collect": {
    sourceEntityRole: "pickup",
    targetActorRole: "player",
    maximumTrackedCollections: 128,
    maximumConcurrentCommits: 4,
    maximumApplicationsPerPickup: 4,
    effectPlanProfileId: "batch2.pickup-effects",
  },
  "progression.modifier": {
    maximumApplicationsPerPickup: 4,
    mappings: [
      {
        effectId: "heal",
        applications: [
          {
            routeId: "collector.effect-route.health",
            targetInstanceId: "player-health",
            fieldId: "combat.health.current",
            operation: "add",
            valueScale: 1,
            minimumValue: 1,
            maximumValue: 100,
          },
        ],
      },
      { effectId: "scoreBonus", applications: [] },
    ],
  },
  "combat.health": {
    maxHealth: 100,
    initialHealth: 100,
    damageFloor: 0,
  },
  "interaction.projectile-contact": {
    sourceEntityRole: "projectile",
    targetActorRole: "enemy",
    maximumTrackedContacts: 256,
  },
  "interaction.contact-resolution": {
    policyProfileId: "batch1.default-damage",
    policyProfileVersion: "1.0.0",
    allowedDispositions: ["damage"],
    allowedSourceOperations: ["consume"],
    maxResolvedContacts: 256,
  },
} as const;

describe("Batch 2 progression and compatibility production library", () => {
  it("freezes and loader-admits all six definitions with exact export kinds", async () => {
    const registry = await createBatch2ProgressionCompatRegistry();
    expect(BATCH2_PROGRESSION_COMPAT_DEFINITIONS).toHaveLength(6);
    expect(registry.list()).toHaveLength(6);

    for (const definition of BATCH2_PROGRESSION_COMPAT_DEFINITIONS) {
      const registration = registry.find(
        definition.manifest.moduleId,
        definition.manifest.version,
      )[0];
      expect(registration?.registrationKind).toBe("production");
      expect(registration?.manifest.schemaVersion).toBe("1.3.0");
      expect(registration?.executableHandle?.exportKind).toBe(
        definition.manifest.moduleId === "progression.modifier"
          ? "pickup-effect-plan-transform-v1"
          : "lifecycle-create-v1",
      );
      expect(registration?.artifactIdentity?.envelopeSha256).toMatch(
        /^[a-f0-9]{64}$/,
      );
      expect(Object.isFrozen(registration?.manifest)).toBe(true);
    }
  });

  it("validates strict configurations and exact reservations", async () => {
    const registry = await createBatch2ProgressionCompatRegistry();
    for (const definition of BATCH2_PROGRESSION_COMPAT_DEFINITIONS) {
      const configuration = configurations[
        definition.manifest.moduleId as keyof typeof configurations
      ] as unknown;
      expect(() =>
        definition.configurationSchema.parse(configuration),
      ).not.toThrow();
      expect(() =>
        definition.configurationSchema.parse({
          ...(configuration as object),
          undeclared: true,
        }),
      ).toThrow();
      const registration = registry.find(
        definition.manifest.moduleId,
        definition.manifest.version,
      )[0]!;
      expect(registration.evaluateResourceReservation(configuration)).toEqual(
        definition.manifest.moduleId === "progression.pickup-spawn"
          ? {
              activeEntities: 16,
              activeProjectiles: 0,
              spawnsPerSecond: 4,
              timers: 1,
            }
          : {
              activeEntities: 0,
              activeProjectiles: 0,
              spawnsPerSecond: 0,
              timers: 0,
            },
      );
    }
  });

  it("encodes prepared effects, addressed health, and source-first projectile lineage", () => {
    const byId = (moduleId: string) =>
      BATCH2_PROGRESSION_COMPAT_DEFINITIONS.find(
        (entry) => entry.manifest.moduleId === moduleId,
      )!.manifest;

    const collector = byId("progression.pickup-collect");
    expect(collector.preparedEffectCommit).toMatchObject({
      mutationChannelStateInputPort: "sources",
      admittedSourceOperation: "consume",
      effectPlanProfileId: "batch2.pickup-effects",
      applicationRouteSourceId: "applications",
    });
    expect(
      collector.outputPorts.some((port) => port.id === "applications"),
    ).toBe(false);

    const modifier = byId("progression.modifier");
    expect(modifier.pickupEffectPlanTransform).toMatchObject({
      exportKind: "pickup-effect-plan-transform-v1",
      maximumApplicationsPerPlan: 4,
    });
    expect(modifier.inputPorts).toEqual([]);
    expect(modifier.outputPorts).toEqual([]);
    expect(modifier.runtimeLeases).toEqual({
      startLeases: 0,
      instanceLeases: 0,
      graphLeases: 0,
    });

    const health = byId("combat.health");
    expect(health.version).toBe("1.1.0");
    expect(health.modifierTargets).toEqual([
      expect.objectContaining({
        fieldId: "combat.health.current",
        inputPort: "modifier",
        operation: "add",
      }),
    ]);
    expect(health.outputPorts[0]?.payloadType).toBe("health-state-v2");
    expect(health.inputPorts[0]?.authorization).toEqual({
      ownerRelation: "same-owner",
      sourceActorRoles: ["player", "enemy", "boss"],
      targetActorRoles: ["player", "enemy", "boss"],
      sourceEntityRoles: [],
    });

    const contact = byId("interaction.projectile-contact");
    expect(contact.projectileChannelConsumer).toMatchObject({
      role: "contact-detector",
      requiredCapability: "delivery.projectile-channel@1.0.0",
      sourceChannelInputPort: "sources",
    });
    expect(contact.dependencies).toEqual([]);
    expect(contact.inputPorts[0]?.authorization).toEqual({
      ownerRelation: "different-owner",
      sourceActorRoles: ["player", "enemy", "boss"],
      targetActorRoles: ["player", "enemy", "boss"],
      sourceEntityRoles: ["projectile"],
    });

    const resolution = byId("interaction.contact-resolution");
    expect(resolution.requires).toContainEqual(
      expect.objectContaining({
        id: "interaction.projectile-contact-candidate",
        cardinality: "exactly-one",
      }),
    );
    expect(resolution.contactResolution).toMatchObject({
      mutationChannelInputPort: "sources",
      authorization: "resolved-mutation-grant-v1",
      finalResolution: {
        profileId: "batch1.default-damage",
        admittedSourceOperation: "consume",
      },
    });
  });

  it("rejects unordered pickup schedules and inverted modifier bounds", () => {
    const spawn = BATCH2_PROGRESSION_COMPAT_DEFINITIONS[0]!;
    expect(() =>
      spawn.configurationSchema.parse({
        ...configurations["progression.pickup-spawn"],
        schedule: [
          configurations["progression.pickup-spawn"].schedule[1],
          configurations["progression.pickup-spawn"].schedule[0],
        ],
      }),
    ).toThrow(/ordered/);

    const modifier = BATCH2_PROGRESSION_COMPAT_DEFINITIONS[2]!;
    const mapping = configurations["progression.modifier"].mappings[0]!;
    expect(() =>
      modifier.configurationSchema.parse({
        maximumApplicationsPerPickup: 4,
        mappings: [
          {
            ...mapping,
            applications: [
              {
                ...mapping.applications[0],
                minimumValue: 20,
                maximumValue: 10,
              },
            ],
          },
        ],
      }),
    ).toThrow(/inverted/);
  });

  it("admits only bounded combat target roles for compatible projectile contact", () => {
    const contact = BATCH2_PROGRESSION_COMPAT_DEFINITIONS[4]!;
    for (const targetActorRole of ["player", "enemy", "boss"] as const) {
      expect(() =>
        contact.configurationSchema.parse({
          ...configurations["interaction.projectile-contact"],
          targetActorRole,
        }),
      ).not.toThrow();
    }
    expect(() =>
      contact.configurationSchema.parse({
        ...configurations["interaction.projectile-contact"],
        targetActorRole: "world",
      }),
    ).toThrow();
  });
});
