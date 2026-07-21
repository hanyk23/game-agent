import { z } from "zod";

import {
  GameAssemblySpecSchema,
  GameModuleManifestSchema,
  type GameAssemblySpec,
  type GameModuleManifest,
} from "./game-module-contract.js";
import { GameModuleRegistry } from "./game-module-registry.js";

const fixtureHash = "0".repeat(64);
const noResources = {
  activeEntities: 0,
  activeProjectiles: 0,
  spawnsPerSecond: 0,
  timers: 0,
} as const;

type ManifestOptions = Readonly<{
  moduleId: string;
  kind: GameModuleManifest["kind"];
  provides?: GameModuleManifest["provides"];
  requires?: GameModuleManifest["requires"];
  inputPorts?: GameModuleManifest["inputPorts"];
  outputPorts?: GameModuleManifest["outputPorts"];
  dependencies?: GameModuleManifest["dependencies"];
  conflicts?: readonly string[];
  ownership?: readonly string[];
  resources?: GameModuleManifest["resources"];
}>;

function createManifest(options: ManifestOptions): GameModuleManifest {
  return GameModuleManifestSchema.parse({
    schemaVersion: "1.0.0",
    moduleId: options.moduleId,
    version: "1.0.0",
    kind: options.kind,
    implementationId: `${options.moduleId}.v1`,
    configurationSchemaId: `${options.moduleId}.config`,
    kernelVersionRange: "^1.0.0",
    engine: { id: "phaser", versionRange: "^3.90.0" },
    provides: options.provides ?? [],
    requires: options.requires ?? [],
    inputPorts: options.inputPorts ?? [],
    outputPorts: options.outputPorts ?? [],
    dependencies: options.dependencies ?? [],
    conflicts: options.conflicts ?? [],
    exclusiveOwnership: options.ownership ?? [],
    cardinality: {
      maximumInstancesPerAssembly: 16,
      maximumInstancesPerOwner: 1,
    },
    resources: options.resources ?? noResources,
    browserSupport: { desktop: true, touch: true },
    evidence: {
      provenanceId: "fixtures.module-contracts",
      testSuiteId: "modules.contract-fixtures",
      sha256: fixtureHash,
    },
  });
}

const registeredFixtures = [
  {
    manifest: createManifest({
      moduleId: "intent.directional",
      kind: "player-intent",
      provides: [{ id: "intent.player", version: "1.0.0" }],
      outputPorts: [
        { id: "aim", payloadType: "aim-vector-v1" },
        { id: "attack", payloadType: "attack-intent-v1" },
      ],
      ownership: ["player.intent"],
    }),
    configurationSchema: z.strictObject({}),
  },
  {
    manifest: createManifest({
      moduleId: "targeting.fixed-forward",
      kind: "targeting",
      provides: [{ id: "targeting.selection", version: "1.0.0" }],
      outputPorts: [{ id: "selection", payloadType: "target-selection-v1" }],
      ownership: ["attack.targeting"],
    }),
    configurationSchema: z.strictObject({ angleDegrees: z.literal(-90) }),
  },
  {
    manifest: createManifest({
      moduleId: "targeting.directional",
      kind: "targeting",
      provides: [{ id: "targeting.selection", version: "1.0.0" }],
      requires: [
        {
          id: "intent.player",
          versionRange: "^1.0.0",
          cardinality: "exactly-one",
        },
      ],
      inputPorts: [
        {
          id: "aim",
          payloadType: "aim-vector-v1",
          required: true,
          multiple: false,
        },
      ],
      outputPorts: [{ id: "selection", payloadType: "target-selection-v1" }],
      ownership: ["attack.targeting"],
    }),
    configurationSchema: z.strictObject({ normalize: z.literal(true) }),
  },
  {
    manifest: createManifest({
      moduleId: "targeting.nearest",
      kind: "targeting",
      provides: [{ id: "targeting.selection", version: "1.0.0" }],
      outputPorts: [{ id: "selection", payloadType: "target-selection-v1" }],
      ownership: ["attack.targeting"],
    }),
    configurationSchema: z.strictObject({
      maximumRange: z.number().positive(),
    }),
  },
  {
    manifest: createManifest({
      moduleId: "trigger.interval",
      kind: "attack-trigger",
      provides: [{ id: "trigger.attack", version: "1.0.0" }],
      outputPorts: [{ id: "request", payloadType: "attack-request-v1" }],
      ownership: ["attack.primary-trigger"],
      resources: { ...noResources, timers: 1 },
    }),
    configurationSchema: z.strictObject({
      intervalMs: z.number().int().min(50).max(10_000),
    }),
  },
  {
    manifest: createManifest({
      moduleId: "trigger.active",
      kind: "attack-trigger",
      provides: [{ id: "trigger.attack", version: "1.0.0" }],
      requires: [
        {
          id: "intent.player",
          versionRange: "^1.0.0",
          cardinality: "exactly-one",
        },
      ],
      inputPorts: [
        {
          id: "intent",
          payloadType: "attack-intent-v1",
          required: true,
          multiple: false,
        },
      ],
      outputPorts: [{ id: "request", payloadType: "attack-request-v1" }],
      ownership: ["attack.primary-trigger"],
    }),
    configurationSchema: z.strictObject({ mode: z.literal("press-or-hold") }),
  },
  {
    manifest: createManifest({
      moduleId: "delivery.projectile",
      kind: "attack-delivery",
      provides: [{ id: "delivery.attack", version: "1.0.0" }],
      inputPorts: [
        {
          id: "target",
          payloadType: "target-selection-v1",
          required: true,
          multiple: false,
        },
        {
          id: "attack",
          payloadType: "attack-request-v1",
          required: true,
          multiple: false,
        },
      ],
      outputPorts: [{ id: "emission", payloadType: "emission-v1" }],
      ownership: ["attack.primary-delivery"],
      resources: {
        activeEntities: 0,
        activeProjectiles: 200,
        spawnsPerSecond: 60,
        timers: 0,
      },
    }),
    configurationSchema: z.strictObject({
      speed: z.number().min(100).max(2_000),
      damage: z.number().positive().max(100_000),
    }),
  },
  {
    manifest: createManifest({
      moduleId: "interaction.polarity",
      kind: "combat-interaction",
      provides: [{ id: "interaction.projectile", version: "1.0.0" }],
      ownership: ["combat.projectile-contact"],
    }),
    configurationSchema: z.strictObject({
      polarities: z.tuple([z.literal("light"), z.literal("dark")]),
      matchingResult: z.literal("absorb"),
    }),
  },
  {
    manifest: createManifest({
      moduleId: "loadout.slotted",
      kind: "progression-loadout",
      provides: [{ id: "loadout.slots", version: "1.0.0" }],
      ownership: ["progression.loadout"],
    }),
    configurationSchema: z.strictObject({
      slots: z.tuple([
        z.literal("primary"),
        z.literal("armor"),
        z.literal("secondary"),
        z.literal("companion"),
      ]),
    }),
  },
  ...[
    ["equipment.primary", "attack-delivery", "equipment.primary"],
    ["equipment.secondary", "attack-delivery", "equipment.secondary"],
    ["defense.armor", "combat-interaction", "equipment.armor"],
    ["companion.satellite", "companion-behavior", "equipment.companion"],
  ].map(([moduleId, kind, capability]) => ({
    manifest: createManifest({
      moduleId: moduleId!,
      kind: kind! as GameModuleManifest["kind"],
      provides: [{ id: capability!, version: "1.0.0" }],
      requires: [
        {
          id: "loadout.slots",
          versionRange: "^1.0.0",
          cardinality: "exactly-one",
        },
      ],
      dependencies: [
        {
          moduleId: "loadout.slotted",
          versionRange: "^1.0.0",
          optional: false,
        },
      ],
      ownership: [capability!],
      resources:
        moduleId === "companion.satellite"
          ? { ...noResources, activeEntities: 1 }
          : noResources,
    }),
    configurationSchema:
      moduleId === "companion.satellite"
        ? z.strictObject({ orbitRadius: z.number().min(20).max(300) })
        : z.strictObject({ equipmentId: z.string().min(1).max(80) }),
  })),
] as const;

const baseAssembly = {
  schemaVersion: "1.0.0",
  kernelVersion: "1.0.0",
  engine: { id: "phaser", version: "3.90.0" },
  actors: [{ actorId: "player-one", role: "player" }],
  assetRoles: [],
  globalBudget: {
    activeEntities: 100,
    activeProjectiles: 500,
    spawnsPerSecond: 200,
    timers: 100,
  },
} as const;

const projectileConfiguration = { speed: 720, damage: 12 };

export const ContractFixtureAssemblies = Object.freeze({
  legacyForward: GameAssemblySpecSchema.parse({
    ...baseAssembly,
    assemblyId: "fixture.legacy-forward",
    modules: [
      {
        instanceId: "fixed-target",
        moduleId: "targeting.fixed-forward",
        versionRange: "^1.0.0",
        ownerId: "player-one",
        configuration: { angleDegrees: -90 },
      },
      {
        instanceId: "interval-trigger",
        moduleId: "trigger.interval",
        versionRange: "^1.0.0",
        ownerId: "player-one",
        configuration: { intervalMs: 240 },
      },
      {
        instanceId: "projectile-delivery",
        moduleId: "delivery.projectile",
        versionRange: "^1.0.0",
        ownerId: "player-one",
        configuration: projectileConfiguration,
      },
    ],
    bindings: [
      {
        from: { instanceId: "fixed-target", portId: "selection" },
        to: { instanceId: "projectile-delivery", portId: "target" },
      },
      {
        from: { instanceId: "interval-trigger", portId: "request" },
        to: { instanceId: "projectile-delivery", portId: "attack" },
      },
    ],
  }),
  directionalActive: GameAssemblySpecSchema.parse({
    ...baseAssembly,
    assemblyId: "fixture.directional-active",
    modules: [
      {
        instanceId: "player-intent",
        moduleId: "intent.directional",
        versionRange: "^1.0.0",
        ownerId: "player-one",
        configuration: {},
      },
      {
        instanceId: "directional-target",
        moduleId: "targeting.directional",
        versionRange: "^1.0.0",
        ownerId: "player-one",
        configuration: { normalize: true },
      },
      {
        instanceId: "active-trigger",
        moduleId: "trigger.active",
        versionRange: "^1.0.0",
        ownerId: "player-one",
        configuration: { mode: "press-or-hold" },
      },
      {
        instanceId: "projectile-delivery",
        moduleId: "delivery.projectile",
        versionRange: "^1.0.0",
        ownerId: "player-one",
        configuration: projectileConfiguration,
      },
    ],
    bindings: [
      {
        from: { instanceId: "player-intent", portId: "aim" },
        to: { instanceId: "directional-target", portId: "aim" },
      },
      {
        from: { instanceId: "player-intent", portId: "attack" },
        to: { instanceId: "active-trigger", portId: "intent" },
      },
      {
        from: { instanceId: "directional-target", portId: "selection" },
        to: { instanceId: "projectile-delivery", portId: "target" },
      },
      {
        from: { instanceId: "active-trigger", portId: "request" },
        to: { instanceId: "projectile-delivery", portId: "attack" },
      },
    ],
  }),
  automaticTarget: GameAssemblySpecSchema.parse({
    ...baseAssembly,
    assemblyId: "fixture.automatic-target",
    modules: [
      {
        instanceId: "nearest-target",
        moduleId: "targeting.nearest",
        versionRange: "^1.0.0",
        ownerId: "player-one",
        configuration: { maximumRange: 1_200 },
      },
      {
        instanceId: "interval-trigger",
        moduleId: "trigger.interval",
        versionRange: "^1.0.0",
        ownerId: "player-one",
        configuration: { intervalMs: 400 },
      },
      {
        instanceId: "projectile-delivery",
        moduleId: "delivery.projectile",
        versionRange: "^1.0.0",
        ownerId: "player-one",
        configuration: projectileConfiguration,
      },
    ],
    bindings: [
      {
        from: { instanceId: "nearest-target", portId: "selection" },
        to: { instanceId: "projectile-delivery", portId: "target" },
      },
      {
        from: { instanceId: "interval-trigger", portId: "request" },
        to: { instanceId: "projectile-delivery", portId: "attack" },
      },
    ],
  }),
  polarityAbsorption: GameAssemblySpecSchema.parse({
    ...baseAssembly,
    assemblyId: "fixture.polarity-absorption",
    modules: [
      {
        instanceId: "fixed-target",
        moduleId: "targeting.fixed-forward",
        versionRange: "^1.0.0",
        ownerId: "player-one",
        configuration: { angleDegrees: -90 },
      },
      {
        instanceId: "interval-trigger",
        moduleId: "trigger.interval",
        versionRange: "^1.0.0",
        ownerId: "player-one",
        configuration: { intervalMs: 240 },
      },
      {
        instanceId: "projectile-delivery",
        moduleId: "delivery.projectile",
        versionRange: "^1.0.0",
        ownerId: "player-one",
        configuration: projectileConfiguration,
      },
      {
        instanceId: "polarity-contact",
        moduleId: "interaction.polarity",
        versionRange: "^1.0.0",
        ownerId: "player-one",
        configuration: {
          polarities: ["light", "dark"],
          matchingResult: "absorb",
        },
      },
    ],
    bindings: [
      {
        from: { instanceId: "fixed-target", portId: "selection" },
        to: { instanceId: "projectile-delivery", portId: "target" },
      },
      {
        from: { instanceId: "interval-trigger", portId: "request" },
        to: { instanceId: "projectile-delivery", portId: "attack" },
      },
    ],
  }),
  slottedEquipment: GameAssemblySpecSchema.parse({
    ...baseAssembly,
    assemblyId: "fixture.slotted-equipment",
    actors: [
      { actorId: "player-one", role: "player" },
      { actorId: "satellite-one", role: "companion" },
    ],
    modules: [
      {
        instanceId: "player-loadout",
        moduleId: "loadout.slotted",
        versionRange: "^1.0.0",
        ownerId: "player-one",
        configuration: {
          slots: ["primary", "armor", "secondary", "companion"],
        },
      },
      {
        instanceId: "primary-weapon",
        moduleId: "equipment.primary",
        versionRange: "^1.0.0",
        ownerId: "player-one",
        configuration: { equipmentId: "wide-cannon" },
      },
      {
        instanceId: "player-armor",
        moduleId: "defense.armor",
        versionRange: "^1.0.0",
        ownerId: "player-one",
        configuration: { equipmentId: "shield-armor" },
      },
      {
        instanceId: "secondary-weapon",
        moduleId: "equipment.secondary",
        versionRange: "^1.0.0",
        ownerId: "player-one",
        configuration: { equipmentId: "homing-missile" },
      },
      {
        instanceId: "satellite-module",
        moduleId: "companion.satellite",
        versionRange: "^1.0.0",
        ownerId: "satellite-one",
        configuration: { orbitRadius: 72 },
      },
    ],
    bindings: [],
  }),
} satisfies Readonly<Record<string, GameAssemblySpec>>);

export function createContractFixtureRegistry(): GameModuleRegistry {
  const registry = new GameModuleRegistry();
  for (const fixture of registeredFixtures) {
    registry.register(fixture.manifest, fixture.configurationSchema);
  }
  return registry;
}

export const ContractFixtureManifests = Object.freeze(
  registeredFixtures.map((fixture) => fixture.manifest),
);
