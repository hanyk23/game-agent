import { createHash } from "node:crypto";

import { z } from "zod";

import { BATCH2_CONTROL_DEFINITIONS } from "./batch2-gameplay-library.js";
import { BATCH2_DEFENSE_DEFINITIONS } from "./batch2-defense-library.js";
import { BATCH2_DELIVERY_DEFINITIONS } from "./batch2-delivery-library.js";
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

const logicalId = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/);

export const IntervalTriggerConfigurationSchema = z.strictObject({
  attackChannelId: logicalId,
  intervalMs: z.number().int().min(50).max(2_000),
});

export const FixedForwardTargetingConfigurationSchema = z.strictObject({
  attackChannelId: logicalId,
});

export const PlayerProjectileDeliveryConfigurationSchema = z
  .strictObject({
    attackChannelId: logicalId,
    projectileCount: z.number().int().min(1).max(12),
    maximumCountBonus: z.literal(0),
    speed: z.number().finite().min(120).max(1_500),
    damage: z.number().finite().min(0.1).max(100),
    maximumWeaponPowerBonus: z.number().finite().min(0).max(1_200_000),
    textureRole: z.literal("player-projectile"),
    spawnOffsetY: z.number().finite().min(-256).max(0),
    lateralSpacing: z.number().finite().min(0).max(256),
    maxActive: z.number().int().min(1).max(256),
    maximumAcceptedRequestsPerSecond: z.number().int().min(1).max(20),
    recycleMargin: z.number().finite().min(0).max(256),
    exhaustionPolicy: z.literal("drop-and-observe"),
  })
  .superRefine((configuration, context) => {
    if (configuration.projectileCount > configuration.maxActive)
      context.addIssue({
        code: "custom",
        message: "projectileCount exceeds the independent pool capacity",
        path: ["projectileCount"],
      });
    if (
      configuration.maximumAcceptedRequestsPerSecond *
        configuration.projectileCount >
      10_000
    )
      context.addIssue({
        code: "custom",
        message: "maximum projectile spawn rate is unsafe",
        path: ["maximumAcceptedRequestsPerSecond"],
      });
  });

const activeTrigger = BATCH2_CONTROL_DEFINITIONS.find(
  ({ manifest }) =>
    manifest.moduleId === "trigger.active" && manifest.version === "1.0.0",
)!.manifest;
const directionalTargeting = BATCH2_CONTROL_DEFINITIONS.find(
  ({ manifest }) => manifest.moduleId === "targeting.directional",
)!.manifest;
const multiShotDelivery = BATCH2_DELIVERY_DEFINITIONS.find(
  ({ manifest }) => manifest.moduleId === "delivery.multi-shot",
)!.manifest;
const legacyGrazeDefinition = BATCH2_DEFENSE_DEFINITIONS.find(
  ({ manifest }) => manifest.moduleId === "combat.graze",
)!;

const multiChannelGrazeManifest: GameModuleManifestV13 =
  GameModuleManifestV13Schema.parse({
    ...structuredClone(legacyGrazeDefinition.manifest),
    version: "1.1.0",
    implementationId: "combat.graze.v1-1",
    configurationSchemaId: "combat.graze.config-v1-1",
    exclusiveOwnership: [],
    cardinality: {
      maximumInstancesPerAssembly: 64,
      maximumInstancesPerOwner: 16,
    },
    evidence: {
      provenanceId: "agent.batch3.reviewed",
      testSuiteId: "modules.batch3.legacy-player-library",
    },
  });

const fixedForwardTargetingManifest: GameModuleManifestV13 =
  GameModuleManifestV13Schema.parse({
    ...structuredClone(directionalTargeting),
    moduleId: "targeting.fixed-forward",
    version: "1.1.0",
    implementationId: "targeting.fixed-forward.v1-1",
    configurationSchemaId: "targeting.fixed-forward.config-v1-1",
    provides: [
      { id: "targeting.solution-v2", version: "1.1.0", scope: "owner" },
    ],
    requires: [],
    inputPorts: [],
    exclusiveOwnership: [],
    cardinality: {
      maximumInstancesPerAssembly: 64,
      maximumInstancesPerOwner: 4,
    },
    runtimeLeases: { startLeases: 1, instanceLeases: 2, graphLeases: 0 },
    runtimeContract: {
      update: null,
      timerSlots: { slotGroupId: "main" },
      inputRegistrations: [],
      observationReaders: [{ readerId: "target" }],
      contactCommit: null,
    },
    evidence: {
      provenanceId: "agent.batch3.reviewed",
      testSuiteId: "modules.batch3.legacy-player-library",
    },
  });

const playerProjectileDeliveryManifest: GameModuleManifestV13 =
  GameModuleManifestV13Schema.parse({
    ...structuredClone(multiShotDelivery),
    moduleId: "delivery.projectile",
    version: "1.1.0",
    implementationId: "delivery.projectile.v1-1",
    configurationSchemaId: "delivery.projectile.config-v1-1",
    provides: [
      { id: "delivery.projectile", version: "1.0.0", scope: "owner" },
      {
        id: "delivery.projectile-channel",
        version: "1.0.0",
        scope: "assembly",
      },
    ],
    exclusiveOwnership: [],
    cardinality: {
      maximumInstancesPerAssembly: 64,
      maximumInstancesPerOwner: 4,
    },
    modifierTargets: [
      {
        fieldId: "attack.damage.multiplier",
        inputPort: "modifier",
        operation: "add",
        minimum: 0,
        maximum: 12_000_000,
        reset: "dispose-new-graph",
      },
    ],
    runtimeLeases: { startLeases: 4, instanceLeases: 6, graphLeases: 0 },
    outputPorts: multiShotDelivery.outputPorts,
    inputPorts: multiShotDelivery.inputPorts,
    evidence: {
      provenanceId: "agent.batch3.reviewed",
      testSuiteId: "modules.batch3.legacy-player-library",
    },
  });

const intervalTriggerManifest: GameModuleManifestV13 =
  GameModuleManifestV13Schema.parse({
    ...structuredClone(activeTrigger),
    moduleId: "trigger.interval",
    version: "1.1.0",
    implementationId: "trigger.interval.v1-1",
    configurationSchemaId: "trigger.interval.config-v1-1",
    provides: [{ id: "trigger.attack-v2", version: "1.1.0", scope: "owner" }],
    requires: [],
    inputPorts: [],
    exclusiveOwnership: [],
    cardinality: {
      maximumInstancesPerAssembly: 64,
      maximumInstancesPerOwner: 4,
    },
    resources: {
      activeEntities: 0,
      activeProjectiles: 0,
      spawnsPerSecond: 0,
      timers: 1,
    },
    runtimeLeases: { startLeases: 1, instanceLeases: 1, graphLeases: 0 },
    runtimeContract: {
      update: null,
      timerSlots: { slotGroupId: "interval" },
      inputRegistrations: [],
      observationReaders: [{ readerId: "trigger" }],
      contactCommit: null,
    },
    evidence: {
      provenanceId: "agent.batch3.reviewed",
      testSuiteId: "modules.batch3.legacy-player-library",
    },
  });

const configurationDescriptor: CanonicalConfigurationDescriptor = {
  descriptorVersion: "1.0.0",
  schemaId: intervalTriggerManifest.configurationSchemaId,
  dialect: "json-schema-2020-12-subset",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["attackChannelId", "intervalMs"],
    properties: {
      attackChannelId: {
        type: "string",
        pattern: "^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$",
      },
      intervalMs: { type: "integer", minimum: 50, maximum: 2_000 },
    },
  },
};

const reservationDescriptor: CanonicalResourceReservationDescriptorV11 = {
  descriptorVersion: "1.0.0",
  reservationId: "trigger.interval.resources-v1-1",
  strategy: "constant",
  fields: [{ resource: "timers", constant: 1 }],
};

const implementationSource = `export function create(context){let sequence=0;let timer;const emit=()=>{const now=Math.floor(context.clock.nowMs());context.ports.emitEvent("request",Object.freeze({sequence:sequence++,emittedAtMs:now,requestedAtMs:now,attackChannelId:context.configuration.attackChannelId,slot:"primary"}));};const cancel=()=>{timer?.cancel();timer=undefined;};return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("trigger",()=>({sequence,timerActive:timer?.active??false,intervalMs:context.configuration.intervalMs}));},start(){cancel();timer=context.clock.schedule(Object.freeze({mode:"interval",initialDelayMs:context.configuration.intervalMs,intervalMs:context.configuration.intervalMs,callback:emit}));},stop(){cancel();},dispose(){cancel();}});}`;

const fixedForwardTargetingSource = `export function create(context){let revision=0;const publish=()=>context.ports.publishState("selection",Object.freeze({revision:revision++,emittedAtMs:Math.floor(context.clock.nowMs()),attackChannelId:context.configuration.attackChannelId,direction:Object.freeze({x:0,y:-1}),targetEvidence:null}));return Object.freeze({instanceId:context.identity.instanceId,initialize(){publish();context.services.observation.register("target",()=>({revision,direction:Object.freeze({x:0,y:-1})}));}});}`;

const playerProjectileDeliverySource = `export function create(context){const config=context.configuration;let target;let emissionSequence=0;let modifierRevision=0;let damageMultiplierBonus=0;const maximumDamageMultiplierBonus=config.maximumWeaponPowerBonus/config.damage;const active=[];const publishModifier=()=>context.ports.publishState("modifier-state",Object.freeze({revision:modifierRevision++,emittedAtMs:Math.floor(context.clock.nowMs()),fieldId:"attack.damage.multiplier",current:damageMultiplierBonus,minimum:0,maximum:maximumDamageMultiplierBonus}));context.ports.declareHandler("target",value=>{if(value.attackChannelId!==config.attackChannelId||value.direction.x!==0||value.direction.y!==-1)throw new Error("player fixed-forward target mismatch");target=value;});context.ports.declareAddressedHandler("attack.damage.multiplier",value=>{if(value.targetInstanceId!==context.identity.instanceId||value.fieldId!=="attack.damage.multiplier"||value.operation!=="add"||!Number.isFinite(value.value)||value.value<=0)throw new Error("invalid player weapon-power modifier");damageMultiplierBonus=Math.min(maximumDamageMultiplierBonus,damageMultiplierBonus+value.value);publishModifier();});context.ports.declareHandler("request",request=>{if(request.attackChannelId!==config.attackChannelId)throw new Error("player delivery channel mismatch");if(!target)throw new Error("player attack before target solution");const owner=context.services.actors.readOwner();if(!owner||owner.active!==true)throw new Error("inactive projectile owner");const textureKey=context.assets.requireTexture(config.textureRole);const count=config.projectileCount;const effectiveDamage=config.damage*(1+damageMultiplierBonus);const plan=Array.from({length:count},(_,index)=>Object.freeze({position:Object.freeze({x:owner.position.x+(index-(count-1)/2)*config.lateralSpacing,y:owner.position.y+config.spawnOffsetY}),velocity:Object.freeze({x:0,y:-config.speed}),damage:effectiveDamage,textureKey}));const result=context.services.projectileDelivery.admit(request.sequence,plan);if(!result.accepted)return;const now=Math.floor(context.clock.nowMs());for(let index=0;index<result.activated.length;index+=1){const reference=result.activated[index];const spawn=plan[index];active.push({reference,position:{...spawn.position},velocity:spawn.velocity});context.ports.emitEvent("emission",Object.freeze({sequence:emissionSequence++,emittedAtMs:now,entityId:reference.entityId,channelId:reference.channelId,ownerActorId:reference.ownerActorId,position:spawn.position,velocity:spawn.velocity,damage:spawn.damage,generation:reference.generation}));}});const clear=()=>active.splice(0);return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.assets.requireTexture(config.textureRole);context.ports.publishState("projectiles",Object.freeze({revision:0,emittedAtMs:Math.floor(context.clock.nowMs()),channelId:context.identity.instanceId+".projectiles",ownerInstanceId:context.identity.instanceId,ownerActorId:context.identity.ownerId,entityRole:"projectile",generation:0}));publishModifier();context.services.observation.register("delivery",()=>({...context.services.projectileDelivery.observe(),emissionSequence,damageMultiplierBonus,weaponPowerBonus:config.damage*damageMultiplierBonus}));},update(deltaMs){if(!Number.isFinite(deltaMs)||deltaMs<0)throw new Error("invalid player delivery delta");const viewport=context.services.viewport.read();for(let index=active.length-1;index>=0;index-=1){const record=active[index];record.position.y+=record.velocity.y*deltaMs/1000;if(record.position.y < -config.recycleMargin||record.position.y > viewport.height+config.recycleMargin){context.services.projectileDelivery.recycle(record.reference);active.splice(index,1);}}},stop(){clear();},dispose(){clear();target=undefined;damageMultiplierBonus=0;}});}`;

function descriptorFor(
  manifest: GameModuleManifestV13,
): CanonicalConfigurationDescriptor {
  return Object.freeze({
    descriptorVersion: "1.0.0",
    schemaId: manifest.configurationSchemaId,
    dialect: "json-schema-2020-12-subset",
    schema: Object.freeze({ type: "object", additionalProperties: false }),
  });
}

const zeroReservation: CanonicalResourceReservationDescriptorV11 = {
  descriptorVersion: "1.0.0",
  reservationId: "targeting.fixed-forward.resources-v1-1",
  strategy: "constant",
  fields: [],
};

const playerDeliveryReservation: CanonicalResourceReservationDescriptorV11 = {
  descriptorVersion: "1.1.0",
  reservationId: "delivery.projectile.resources-v1-1",
  strategy: "maximum-reachable-v1",
  fields: [
    {
      resource: "activeEntities",
      formula: { kind: "configuration-field", field: "maxActive" },
    },
    {
      resource: "activeProjectiles",
      formula: { kind: "configuration-field", field: "maxActive" },
    },
    {
      resource: "spawnsPerSecond",
      formula: {
        kind: "product-field-and-sum",
        factorField: "maximumAcceptedRequestsPerSecond",
        sumFields: ["projectileCount", "maximumCountBonus"],
      },
    },
    { resource: "timers", formula: { kind: "constant", value: 0 } },
  ],
};

export const BATCH3_LEGACY_PLAYER_DEFINITIONS = Object.freeze([
  Object.freeze({
    manifest: fixedForwardTargetingManifest,
    configurationSchema: FixedForwardTargetingConfigurationSchema,
    configurationDescriptor: descriptorFor(fixedForwardTargetingManifest),
    reservationDescriptor: Object.freeze(zeroReservation),
    reservationEvaluator(configuration: unknown): ModuleResourceBudget {
      const parsed =
        FixedForwardTargetingConfigurationSchema.parse(configuration);
      return evaluateCanonicalResourceReservationV11(zeroReservation, parsed);
    },
    implementationSource: fixedForwardTargetingSource,
    exportName: "create" as const,
    exportKind: "lifecycle-create-v1" as const,
  }),
  Object.freeze({
    manifest: intervalTriggerManifest,
    configurationSchema: IntervalTriggerConfigurationSchema,
    configurationDescriptor: Object.freeze(configurationDescriptor),
    reservationDescriptor: Object.freeze(reservationDescriptor),
    reservationEvaluator(configuration: unknown): ModuleResourceBudget {
      const parsed = IntervalTriggerConfigurationSchema.parse(configuration);
      return evaluateCanonicalResourceReservationV11(
        reservationDescriptor,
        parsed,
      );
    },
    implementationSource,
    exportName: "create" as const,
    exportKind: "lifecycle-create-v1" as const,
  }),
  Object.freeze({
    manifest: playerProjectileDeliveryManifest,
    configurationSchema: PlayerProjectileDeliveryConfigurationSchema,
    configurationDescriptor: descriptorFor(playerProjectileDeliveryManifest),
    reservationDescriptor: Object.freeze(playerDeliveryReservation),
    reservationEvaluator(configuration: unknown): ModuleResourceBudget {
      const parsed =
        PlayerProjectileDeliveryConfigurationSchema.parse(configuration);
      return evaluateCanonicalResourceReservationV11(
        playerDeliveryReservation,
        parsed,
      );
    },
    implementationSource: playerProjectileDeliverySource,
    exportName: "create" as const,
    exportKind: "lifecycle-create-v1" as const,
  }),
  Object.freeze({
    manifest: multiChannelGrazeManifest,
    configurationSchema: legacyGrazeDefinition.configurationSchema,
    configurationDescriptor: descriptorFor(multiChannelGrazeManifest),
    reservationDescriptor: legacyGrazeDefinition.reservationDescriptor,
    reservationEvaluator(configuration: unknown): ModuleResourceBudget {
      const parsed =
        legacyGrazeDefinition.configurationSchema.parse(configuration);
      return evaluateCanonicalResourceReservationV11(
        legacyGrazeDefinition.reservationDescriptor,
        parsed,
      );
    },
    implementationSource: legacyGrazeDefinition.implementationSource,
    exportName: "create" as const,
    exportKind: "lifecycle-create-v1" as const,
  }),
]);

const lockIdentity = new TextEncoder().encode(
  "pnpm-lock.batch3.legacy-player.v1",
);
const toolchainIdentity = new TextEncoder().encode(
  "typescript-5.9.3.esm-self-contained.batch3.legacy-player.v1",
);

export async function registerBatch3LegacyPlayerDefinitions(
  registry: GameModuleRegistry,
): Promise<void> {
  const loader = new TrustedGameModuleExecutableLoader();
  for (const definition of BATCH3_LEGACY_PLAYER_DEFINITIONS) {
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
    const handle = await loader.admit({
      generatedOutput: implementationBundle,
      expectedOutputSha256: createHash("sha256")
        .update(implementationBundle)
        .digest("hex"),
      implementationId: definition.manifest.implementationId,
      exportName: definition.exportName,
      exportKind: definition.exportKind,
      sourceBundleSha256: artifact.implementationBundleSha256,
      manifestSha256: artifact.manifestSha256,
      dependencyLockSha256: artifact.dependencyLockSha256,
      toolchainIdentitySha256: artifact.toolchainIdentitySha256,
    });
    registry.registerProductionV13({
      manifest: definition.manifest,
      configurationDescriptor: definition.configurationDescriptor,
      configurationSchema: definition.configurationSchema,
      reservationDescriptor: definition.reservationDescriptor,
      reservationEvaluator: definition.reservationEvaluator,
      implementationBundle,
      dependencyLockIdentity: lockIdentity,
      toolchainIdentity,
      expectedArtifact: artifact,
      executableHandle: handle,
    });
  }
}

export async function createBatch3LegacyPlayerRegistry(): Promise<GameModuleRegistry> {
  const registry = new GameModuleRegistry();
  await registerBatch3LegacyPlayerDefinitions(registry);
  return registry;
}
