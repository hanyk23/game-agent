import { createHash } from "node:crypto";

import { z } from "zod";

import {
  GameModuleManifestV13Schema,
  type GameModuleManifestV13,
  type ModuleResourceBudget,
} from "./game-module-contract.js";
import {
  createModuleArtifactHashDescriptor,
  type CanonicalConfigurationDescriptor,
  type CanonicalResourceReservationDescriptorV11,
} from "./game-module-execution-contract.js";
import { TrustedGameModuleExecutableLoader } from "./game-module-executable-loader.js";
import {
  evaluateCanonicalResourceReservationV11,
  GameModuleRegistry,
} from "./game-module-registry.js";

const zeroBudget = Object.freeze({
  activeEntities: 0,
  activeProjectiles: 0,
  spawnsPerSecond: 0,
  timers: 0,
});

const sameCombatOwner = Object.freeze({
  ownerRelation: "same-owner",
  sourceActorRoles: Object.freeze(["player", "enemy", "boss"]),
  targetActorRoles: Object.freeze(["player", "enemy", "boss"]),
  sourceEntityRoles: Object.freeze([]),
});

const sameOwnerModifier = Object.freeze({
  ownerRelation: "same-owner",
  sourceActorRoles: Object.freeze(["player", "enemy", "boss"]),
  targetActorRoles: Object.freeze(["player", "enemy", "boss"]),
  sourceEntityRoles: Object.freeze([]),
});

const opposingCombatProjectile = Object.freeze({
  ownerRelation: "different-owner",
  sourceActorRoles: Object.freeze(["player", "enemy", "boss"]),
  targetActorRoles: Object.freeze(["player", "enemy", "boss"]),
  sourceEntityRoles: Object.freeze(["projectile"]),
});

const worldPickupToPlayer = Object.freeze({
  ownerRelation: "different-owner",
  sourceActorRoles: Object.freeze(["world"]),
  targetActorRoles: Object.freeze(["player"]),
  sourceEntityRoles: Object.freeze(["pickup"]),
});

function baseManifest(
  moduleId: string,
  kind: GameModuleManifestV13["kind"],
  overrides: Record<string, unknown>,
): GameModuleManifestV13 {
  return GameModuleManifestV13Schema.parse({
    schemaVersion: "1.3.0",
    moduleId,
    version: "1.0.0",
    kind,
    implementationId: `${moduleId}.v1`,
    configurationSchemaId: `${moduleId}.config`,
    kernelVersionRange: "^1.0.0",
    engine: { id: "phaser", versionRange: "^3.90.0" },
    provides: [],
    requires: [],
    inputPorts: [],
    outputPorts: [],
    dependencies: [],
    assetRequirements: [],
    conflicts: [],
    exclusiveOwnership: [],
    cardinality: {
      maximumInstancesPerAssembly: 64,
      maximumInstancesPerOwner: 1,
    },
    resources: zeroBudget,
    runtimeLeases: { startLeases: 0, instanceLeases: 0, graphLeases: 0 },
    runtimeContract: {
      update: null,
      timerSlots: { slotGroupId: "main" },
      inputRegistrations: [],
      observationReaders: [],
      contactCommit: null,
    },
    browserSupport: { desktop: true, touch: true },
    evidence: {
      provenanceId: "agent.batch2.reviewed",
      testSuiteId: "modules.batch2.progression-compat-library",
    },
    actorSnapshotReads: [],
    entityChannelReads: [],
    projectileChannelConsumer: null,
    attackChannel: null,
    preparedEffectCommit: null,
    modifierTargets: [],
    pickupEffectPlanTransform: null,
    ...overrides,
  });
}

const PickupSpawnConfigurationSchema = z
  .strictObject({
    schedule: z
      .array(
        z.strictObject({
          atMs: z.number().int().min(0).max(3_600_000),
          effectId: z.enum(["heal", "shield", "weaponPower", "scoreBonus"]),
          value: z.number().finite().positive().max(100_000),
          position: z.strictObject({
            x: z.number().finite().min(-10_000).max(10_000),
            y: z.number().finite().min(-10_000).max(10_000),
          }),
        }),
      )
      .min(1)
      .max(256),
    fallSpeed: z.number().finite().positive().max(2_000),
    textureRole: z.literal("pickup"),
    maxActive: z.number().int().min(1).max(256),
    maximumSpawnRate: z.number().int().min(1).max(100),
    schedulerIntervalMs: z.number().int().min(10).max(1_000),
    poolExhaustion: z.literal("drop-and-observe"),
  })
  .refine(
    ({ schedule }) =>
      schedule.every(
        (entry, index) =>
          index === 0 || schedule[index - 1]!.atMs <= entry.atMs,
      ),
    { message: "pickup schedule must be ordered", path: ["schedule"] },
  );

const PickupCollectConfigurationSchema = z.strictObject({
  sourceEntityRole: z.literal("pickup"),
  targetActorRole: z.literal("player"),
  maximumTrackedCollections: z.number().int().min(1).max(10_000),
  maximumConcurrentCommits: z.number().int().min(1).max(256),
  maximumApplicationsPerPickup: z.number().int().min(0).max(4),
  effectPlanProfileId: z.literal("batch2.pickup-effects"),
});

const ModifierApplicationConfigurationSchema = z.strictObject({
  routeId: z.string().min(1).max(100),
  targetInstanceId: z.string().min(1).max(100),
  fieldId: z.enum([
    "combat.health.current",
    "combat.shield.current",
    "attack.damage.multiplier",
    "attack.projectile-count.bonus",
  ]),
  operation: z.literal("add"),
  valueScale: z.number().finite().positive().max(100),
  minimumValue: z.number().finite().positive(),
  maximumValue: z.number().finite().positive(),
});

const ModifierConfigurationSchema = z
  .strictObject({
    maximumApplicationsPerPickup: z.literal(4),
    mappings: z
      .array(
        z.strictObject({
          effectId: z.enum(["heal", "shield", "weaponPower", "scoreBonus"]),
          applications: z.array(ModifierApplicationConfigurationSchema).max(4),
        }),
      )
      .min(1)
      .max(4),
  })
  .superRefine(({ mappings }, context) => {
    const effects = mappings.map((entry) => entry.effectId);
    if (new Set(effects).size !== effects.length)
      context.addIssue({
        code: "custom",
        message: "effect mappings must be unique",
        path: ["mappings"],
      });
    for (const [mappingIndex, mapping] of mappings.entries())
      for (const [
        applicationIndex,
        application,
      ] of mapping.applications.entries())
        if (application.minimumValue > application.maximumValue)
          context.addIssue({
            code: "custom",
            message: "modifier value bounds are inverted",
            path: ["mappings", mappingIndex, "applications", applicationIndex],
          });
  });

const HealthV11ConfigurationSchema = z
  .strictObject({
    maxHealth: z.number().finite().positive().max(100_000),
    initialHealth: z.number().finite().positive().max(100_000),
    damageFloor: z.literal(0),
  })
  .refine(({ maxHealth, initialHealth }) => initialHealth <= maxHealth, {
    message: "initialHealth cannot exceed maxHealth",
    path: ["initialHealth"],
  });

const ContactV11ConfigurationSchema = z.strictObject({
  sourceEntityRole: z.literal("projectile"),
  targetActorRole: z.enum(["player", "enemy", "boss"]),
  maximumTrackedContacts: z.number().int().min(1).max(4096),
});

const ResolutionV11ConfigurationSchema = z.strictObject({
  policyProfileId: z.literal("batch1.default-damage"),
  policyProfileVersion: z.literal("1.0.0"),
  allowedDispositions: z.tuple([z.literal("damage")]),
  allowedSourceOperations: z.tuple([z.literal("consume")]),
  maxResolvedContacts: z.number().int().min(1).max(4096),
});

const sources = Object.freeze({
  pickupSpawn: `export function create(context){const config=context.configuration;let timer;let cursor=0;let generation=0;let startedAt=0;let dropped=0;const active=[];const emitDue=()=>{const elapsed=context.clock.nowMs()-startedAt;while(cursor<config.schedule.length&&config.schedule[cursor].atMs<=elapsed){const entry=config.schedule[cursor++];if(active.length>=config.maxActive){dropped++;continue;}const entityId="pickup-"+(++generation);const position=Object.freeze({...entry.position});const velocity=Object.freeze({x:0,y:config.fallSpeed});const entity=Object.freeze({entityId,generation,position,velocity,effectId:entry.effectId,value:entry.value,textureKey:context.assets.requireTexture(config.textureRole)});active.push(context.services.channels.activate("pickups",entity));}};return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.assets.requireTexture(config.textureRole);context.ports.publishState("pickups",Object.freeze({revision:0,emittedAtMs:context.clock.nowMs(),channelId:context.identity.instanceId+".pickups",ownerInstanceId:context.identity.instanceId,ownerActorId:context.identity.ownerId,entityRole:"pickup",generation:0}));context.services.observation.register("pickup-spawn",()=>({cursor,generation,active:active.length,dropped}));},start(){startedAt=context.clock.nowMs();timer=context.clock.schedule(Object.freeze({mode:"interval",initialDelayMs:0,intervalMs:config.schedulerIntervalMs,callback:emitDue}));},update(){},stop(){timer?.cancel();timer=undefined;active.splice(0);},dispose(){timer?.cancel();timer=undefined;active.splice(0);}});}`,
  pickupCollect: `export function create(context){let channel;let remove;let tracked=0;const seen=new Set();context.ports.declareHandler("sources",value=>{channel=value;});return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("pickup-collect",()=>({tracked,duplicates:seen.size}));},start(){remove=context.services.overlaps.register("pickup.commit",raw=>{if(!channel)throw new Error("pickup overlap before channel");const sourceKey=channel.channelId+":"+raw.sourceEntityId+":"+raw.sourceGeneration;if(seen.has(sourceKey))return;if(seen.size>=context.configuration.maximumTrackedCollections)throw new Error("pickup duplicate ledger exhausted");const prepared=context.services.preparedEffects.prepare(sourceKey,Object.freeze({sourceChannelId:channel.channelId,sourceEntityId:raw.sourceEntityId,sourceGeneration:raw.sourceGeneration,targetActorId:context.identity.ownerId,effectId:raw.effectId,value:raw.value}));prepared.commit();seen.add(sourceKey);tracked++;});},stop(){remove?.();remove=undefined;seen.clear();},dispose(){remove?.();remove=undefined;seen.clear();tracked=0;}});}`,
  modifier: `export function transform(configuration,collected){const mapping=configuration.mappings.find(entry=>entry.effectId===collected.effectId);if(!mapping)return Object.freeze([]);if(mapping.applications.length>configuration.maximumApplicationsPerPickup)throw new Error("modifier plan ceiling exceeded");return Object.freeze(mapping.applications.map(application=>Object.freeze({routeId:application.routeId,targetInstanceId:application.targetInstanceId,fieldId:application.fieldId,operation:application.operation,value:Math.min(application.maximumValue,Math.max(application.minimumValue,collected.value*application.valueScale))})));}`,
  health: `export function create(context){const config=context.configuration;let current=config.initialHealth;let revision=0;const seen=new Set();const publish=(delta,reason)=>context.ports.publishState("state",Object.freeze({revision:revision++,emittedAtMs:context.clock.nowMs(),actorId:context.identity.ownerId,current,maximum:config.maxHealth,delta,reason}));context.ports.declareHandler("damage",damage=>{if(damage.targetActorId!==context.identity.ownerId)throw new Error("damage target mismatch");const key=damage.sourceActorId+":"+damage.contactSequence;if(seen.has(key))throw new Error("duplicate damage");seen.add(key);const before=current;current=Math.max(config.damageFloor,current-damage.amount);publish(current-before,current===0?"depleted":"damaged");});context.ports.declareAddressedHandler("combat.health.current",application=>{if(application.targetInstanceId!==context.identity.instanceId||application.fieldId!=="combat.health.current"||application.operation!=="add")throw new Error("addressed health modifier mismatch");const before=current;current=Math.min(config.maxHealth,current+application.value);publish(current-before,"healed");});return Object.freeze({instanceId:context.identity.instanceId,initialize(){publish(0,"initialized");context.services.observation.register("health",()=>({current,maximum:config.maxHealth,revision}));},dispose(){seen.clear();}});}`,
  contact: `export function create(context){const config=context.configuration;let channel;let sequence=0;let remove;const seen=new Set();context.ports.declareHandler("sources",value=>{channel=value;});return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("contacts",()=>({sequence,tracked:seen.size}));},start(){remove=context.services.overlaps.register("projectile.overlap",raw=>{if(!channel)throw new Error("overlap before channel");const key=channel.channelId+":"+raw.sourceEntityId+":"+raw.sourceGeneration+":"+context.identity.ownerId;if(seen.has(key))return;if(seen.size>=config.maximumTrackedContacts)throw new Error("contact ledger exhausted");seen.add(key);const contactSequence=sequence++;context.ports.emitEvent("candidate",Object.freeze({sequence:contactSequence,emittedAtMs:context.clock.nowMs(),contactId:"contact."+contactSequence,sourceChannelId:channel.channelId,sourceEntityId:raw.sourceEntityId,sourceGeneration:raw.sourceGeneration,sourceActorId:channel.ownerActorId,targetActorId:context.identity.ownerId,contactSequence,metadata:Object.freeze({damage:raw.damage,damageKind:"projectile"})}));});},update(){},stop(){remove?.();remove=undefined;seen.clear();},dispose(){remove?.();remove=undefined;seen.clear();}});}`,
  resolution: `export function create(context){let resolved=0;context.ports.declareHandler("sources",()=>{});context.ports.declareHandler("candidate",candidate=>{if(resolved>=context.configuration.maxResolvedContacts)throw new Error("resolved contact ceiling exceeded");const decision=context.services.contact.executePolicy(candidate);const prepared=context.services.contact.prepareCommit(candidate,decision,Object.freeze({hit(evidenceId){context.ports.emitEvent("hit",Object.freeze({sequence:evidenceId,emittedAtMs:context.clock.nowMs(),sourceEntityId:candidate.sourceEntityId,targetActorId:candidate.targetActorId,contactSequence:candidate.contactSequence,consumed:true}));},damage(evidenceId){context.ports.emitEvent("damage",Object.freeze({sequence:evidenceId,emittedAtMs:context.clock.nowMs(),sourceActorId:candidate.sourceActorId,targetActorId:candidate.targetActorId,amount:decision.damage,damageKind:decision.metadata.damageKind,contactSequence:candidate.contactSequence}));}}));prepared.commit();resolved++;});return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("resolution",()=>({resolved}));},dispose(){resolved=0;}});}`,
});

const manifests = {
  pickupSpawn: baseManifest("progression.pickup-spawn", "progression-loadout", {
    provides: [
      { id: "progression.pickup-channel", version: "1.0.0", scope: "assembly" },
    ],
    outputPorts: [
      {
        id: "pickups",
        payloadType: "entity-channel-v1",
        delivery: "state",
        entityRole: "pickup",
      },
    ],
    assetRequirements: [
      {
        roleId: "pickup",
        category: "pickup",
        cardinality: "exactly-one",
        sharing: "instance",
      },
    ],
    exclusiveOwnership: ["progression.pickup-spawn.primary"],
    resources: {
      activeEntities: 256,
      activeProjectiles: 0,
      spawnsPerSecond: 100,
      timers: 1,
    },
    runtimeLeases: { startLeases: 2, instanceLeases: 4, graphLeases: 0 },
    runtimeContract: {
      update: { mode: "graph-frame-v1", registrationId: "pickup-spawn.update" },
      timerSlots: { slotGroupId: "pickup-spawn" },
      inputRegistrations: [],
      observationReaders: [{ readerId: "pickup-spawn" }],
      contactCommit: null,
    },
    ownedEntityChannels: [
      {
        channelId: "pickups",
        outputPort: "pickups",
        entityRole: "pickup",
        capacity: { kind: "resource-grant", resources: ["activeEntities"] },
        poolDescriptor: {
          poolId: "pickups.pool",
          entityRole: "pickup",
          capacityResource: "activeEntities",
          projectileResource: null,
        },
      },
    ],
  }),
  pickupCollect: baseManifest(
    "progression.pickup-collect",
    "progression-loadout",
    {
      requires: [
        {
          id: "progression.pickup-channel",
          versionRange: "^1.0.0",
          cardinality: "exactly-one",
          scope: "assembly",
        },
      ],
      inputPorts: [
        {
          id: "sources",
          payloadType: "entity-channel-v1",
          required: true,
          multiple: false,
          delivery: "state",
          authorization: worldPickupToPlayer,
        },
      ],
      outputPorts: [
        {
          id: "collected",
          payloadType: "pickup-collected-v1",
          delivery: "event",
        },
      ],
      exclusiveOwnership: ["progression.pickup-collection.primary"],
      runtimeLeases: { startLeases: 2, instanceLeases: 1, graphLeases: 0 },
      runtimeContract: {
        update: null,
        timerSlots: { slotGroupId: "main" },
        inputRegistrations: [],
        observationReaders: [{ readerId: "pickup-collect" }],
        contactCommit: null,
      },
      entityMutationAccess: [
        {
          accessId: "pickup.consume",
          inputPort: "sources",
          operations: ["consume"],
          transferRecipientActorRoles: [],
        },
      ],
      preparedEffectCommit: {
        commitServiceId: "pickup.commit",
        mutationChannelStateInputPort: "sources",
        admittedSourceOperation: "consume",
        effectPlanProfileId: "batch2.pickup-effects",
        collectedOutputPort: "collected",
        applicationRouteSourceId: "applications",
        maximumApplicationsPerCommit: 4,
        maximumConcurrentCommits: 256,
        duplicateLedgerCapacity: 10_000,
      },
    },
  ),
  modifier: baseManifest("progression.modifier", "progression-loadout", {
    implementationId: "progression.modifier.transform.v1",
    pickupEffectPlanTransform: {
      profileId: "batch2.pickup-effects",
      exportKind: "pickup-effect-plan-transform-v1",
      maximumApplicationsPerPlan: 4,
    },
  }),
  health: baseManifest("combat.health", "combat-interaction", {
    version: "1.1.0",
    implementationId: "combat.health.v1-1",
    provides: [
      { id: "combat.health", version: "1.1.0", scope: "owner" },
      { id: "combat.damage-sink", version: "1.0.0", scope: "owner" },
    ],
    inputPorts: [
      {
        id: "damage",
        payloadType: "damage-v1",
        required: true,
        multiple: true,
        delivery: "event",
        authorization: sameCombatOwner,
      },
      {
        id: "modifier",
        payloadType: "modifier-application-v1",
        required: false,
        multiple: false,
        delivery: "event",
        authorization: sameOwnerModifier,
      },
    ],
    outputPorts: [
      { id: "state", payloadType: "health-state-v2", delivery: "state" },
    ],
    exclusiveOwnership: ["combat.health", "combat.damage-sink.terminal"],
    runtimeLeases: { startLeases: 2, instanceLeases: 2, graphLeases: 0 },
    runtimeContract: {
      update: null,
      timerSlots: { slotGroupId: "main" },
      inputRegistrations: [],
      observationReaders: [{ readerId: "health" }],
      contactCommit: null,
    },
    damageSink: {
      capability: "combat.damage-sink@1.0.0",
      sinkRole: "terminal-health",
      inputPort: "damage",
    },
    modifierTargets: [
      {
        fieldId: "combat.health.current",
        inputPort: "modifier",
        operation: "add",
        minimum: 0,
        maximum: 100_000,
        reset: "dispose-new-graph",
      },
    ],
  }),
  contact: baseManifest(
    "interaction.projectile-contact",
    "combat-interaction",
    {
      version: "1.1.0",
      implementationId: "interaction.projectile-contact.v1-1",
      provides: [
        {
          id: "interaction.projectile-contact-candidate",
          version: "1.0.0",
          scope: "owner",
        },
      ],
      requires: [
        {
          id: "delivery.projectile-channel",
          versionRange: "1.0.0",
          cardinality: "exactly-one",
          scope: "assembly",
        },
      ],
      inputPorts: [
        {
          id: "sources",
          payloadType: "entity-channel-v1",
          required: true,
          multiple: false,
          delivery: "state",
          authorization: opposingCombatProjectile,
        },
      ],
      outputPorts: [
        {
          id: "candidate",
          payloadType: "contact-candidate-v1",
          delivery: "event",
        },
      ],
      exclusiveOwnership: ["combat.contact-detection.projectile"],
      runtimeLeases: { startLeases: 3, instanceLeases: 1, graphLeases: 0 },
      runtimeContract: {
        update: { mode: "graph-frame-v1", registrationId: "contact.update" },
        timerSlots: { slotGroupId: "main" },
        inputRegistrations: [],
        observationReaders: [{ readerId: "contacts" }],
        contactCommit: null,
      },
      contactDetector: {
        sourceChannelInputPort: "sources",
        candidateOutputPort: "candidate",
        ruleId: "projectile.overlap",
      },
      projectileChannelConsumer: {
        role: "contact-detector",
        sourceChannelInputPort: "sources",
        candidateOutputPort: "candidate",
        requiredCapability: "delivery.projectile-channel@1.0.0",
        sourceEntityRole: "projectile",
      },
    },
  ),
  resolution: baseManifest(
    "interaction.contact-resolution",
    "combat-interaction",
    {
      version: "1.1.0",
      implementationId: "interaction.contact-resolution.v1-1",
      requires: [
        {
          id: "interaction.projectile-contact-candidate",
          versionRange: "^1.0.0",
          cardinality: "exactly-one",
          scope: "owner",
        },
        {
          id: "combat.damage-sink",
          versionRange: "1.0.0",
          cardinality: "exactly-one",
          scope: "owner",
        },
      ],
      inputPorts: [
        {
          id: "sources",
          payloadType: "entity-channel-v1",
          required: true,
          multiple: false,
          delivery: "state",
          authorization: opposingCombatProjectile,
        },
        {
          id: "candidate",
          payloadType: "contact-candidate-v1",
          required: true,
          multiple: false,
          delivery: "event",
          authorization: sameCombatOwner,
        },
      ],
      outputPorts: [
        { id: "hit", payloadType: "hit-v1", delivery: "event" },
        { id: "damage", payloadType: "damage-v1", delivery: "event" },
      ],
      exclusiveOwnership: ["combat.contact-resolution.projectile"],
      runtimeLeases: { startLeases: 2, instanceLeases: 3, graphLeases: 0 },
      runtimeContract: {
        update: null,
        timerSlots: { slotGroupId: "main" },
        inputRegistrations: [],
        observationReaders: [{ readerId: "resolution" }],
        contactCommit: {
          commitServiceId: "contact.commit",
          maximumConcurrentCommits: 4,
          admittedOperations: ["consume"],
        },
      },
      entityMutationAccess: [
        {
          accessId: "projectile.consume",
          inputPort: "sources",
          operations: ["consume"],
          transferRecipientActorRoles: [],
        },
      ],
      contactResolution: {
        candidateInputPort: "candidate",
        mutationChannelInputPort: "sources",
        mutationChannelStatePayload: "entity-channel-v1",
        authorization: "resolved-mutation-grant-v1",
        finalResolution: {
          profileId: "batch1.default-damage",
          admittedDisposition: "damage",
          admittedSourceOperation: "consume",
        },
      },
    },
  ),
};

type Batch2ProgressionCompatDefinition = Readonly<{
  manifest: GameModuleManifestV13;
  configurationSchema: z.ZodType;
  configurationDescriptor: CanonicalConfigurationDescriptor;
  reservationDescriptor: CanonicalResourceReservationDescriptorV11;
  reservationEvaluator(configuration: unknown): ModuleResourceBudget;
  implementationSource: string;
  exportName: "create" | "transform";
  exportKind: "lifecycle-create-v1" | "pickup-effect-plan-transform-v1";
}>;

function definition(
  manifest: GameModuleManifestV13,
  configurationSchema: z.ZodType,
  implementationSource: string,
  reservationDescriptor: CanonicalResourceReservationDescriptorV11 = {
    descriptorVersion: "1.0.0",
    reservationId: `${manifest.moduleId}.resources`,
    strategy: "constant",
    fields: [],
  },
  exportName: "create" | "transform" = "create",
): Batch2ProgressionCompatDefinition {
  const configurationDescriptor: CanonicalConfigurationDescriptor =
    Object.freeze({
      descriptorVersion: "1.0.0",
      schemaId: manifest.configurationSchemaId,
      dialect: "json-schema-2020-12-subset",
      schema: Object.freeze({ type: "object", additionalProperties: false }),
    });
  return Object.freeze({
    manifest,
    configurationSchema,
    configurationDescriptor,
    reservationDescriptor: Object.freeze(reservationDescriptor),
    reservationEvaluator: (configuration: unknown) =>
      evaluateCanonicalResourceReservationV11(
        reservationDescriptor,
        configurationSchema.parse(configuration),
      ),
    implementationSource,
    exportName,
    exportKind:
      exportName === "transform"
        ? "pickup-effect-plan-transform-v1"
        : "lifecycle-create-v1",
  });
}

const pickupSpawnReservation: CanonicalResourceReservationDescriptorV11 = {
  descriptorVersion: "1.1.0",
  reservationId: "progression.pickup-spawn.resources",
  strategy: "maximum-reachable-v1",
  fields: [
    {
      resource: "activeEntities",
      formula: { kind: "configuration-field", field: "maxActive" },
    },
    {
      resource: "spawnsPerSecond",
      formula: { kind: "configuration-field", field: "maximumSpawnRate" },
    },
    { resource: "timers", formula: { kind: "constant", value: 1 } },
  ],
};

export const BATCH2_PROGRESSION_COMPAT_DEFINITIONS = Object.freeze([
  definition(
    manifests.pickupSpawn,
    PickupSpawnConfigurationSchema,
    sources.pickupSpawn,
    pickupSpawnReservation,
  ),
  definition(
    manifests.pickupCollect,
    PickupCollectConfigurationSchema,
    sources.pickupCollect,
  ),
  definition(
    manifests.modifier,
    ModifierConfigurationSchema,
    sources.modifier,
    undefined,
    "transform",
  ),
  definition(manifests.health, HealthV11ConfigurationSchema, sources.health),
  definition(manifests.contact, ContactV11ConfigurationSchema, sources.contact),
  definition(
    manifests.resolution,
    ResolutionV11ConfigurationSchema,
    sources.resolution,
  ),
]);

const lockIdentity = new TextEncoder().encode(
  "pnpm-lock.batch2.progression-compat.v1",
);
const toolchainIdentity = new TextEncoder().encode(
  "typescript-5.9.3.esm-self-contained.batch2.progression-compat.v1",
);

export async function registerBatch2ProgressionCompatDefinitions(
  registry: GameModuleRegistry,
): Promise<void> {
  const loader = new TrustedGameModuleExecutableLoader();
  for (const item of BATCH2_PROGRESSION_COMPAT_DEFINITIONS) {
    const implementationBundle = new TextEncoder().encode(
      item.implementationSource,
    );
    const artifact = createModuleArtifactHashDescriptor({
      manifest: item.manifest,
      configurationDescriptor: item.configurationDescriptor,
      reservationDescriptor: item.reservationDescriptor,
      implementationBundle,
      dependencyLockIdentity: lockIdentity,
      toolchainIdentity,
    });
    const handle = await loader.admit({
      generatedOutput: implementationBundle,
      expectedOutputSha256: createHash("sha256")
        .update(implementationBundle)
        .digest("hex"),
      implementationId: item.manifest.implementationId,
      exportName: item.exportName,
      exportKind: item.exportKind,
      sourceBundleSha256: artifact.implementationBundleSha256,
      manifestSha256: artifact.manifestSha256,
      dependencyLockSha256: artifact.dependencyLockSha256,
      toolchainIdentitySha256: artifact.toolchainIdentitySha256,
    });
    registry.registerProductionV13({
      manifest: item.manifest,
      configurationDescriptor: item.configurationDescriptor,
      configurationSchema: item.configurationSchema,
      reservationDescriptor: item.reservationDescriptor,
      reservationEvaluator: item.reservationEvaluator,
      implementationBundle,
      dependencyLockIdentity: lockIdentity,
      toolchainIdentity,
      expectedArtifact: artifact,
      executableHandle: handle,
    });
  }
}

export async function createBatch2ProgressionCompatRegistry(): Promise<GameModuleRegistry> {
  const registry = new GameModuleRegistry();
  await registerBatch2ProgressionCompatDefinitions(registry);
  return registry;
}
