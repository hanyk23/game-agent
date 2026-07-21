import { createHash } from "node:crypto";

import { z } from "zod";

import { BATCH1_MODULE_DEFINITIONS } from "./batch1-gameplay-library.js";
import {
  GameModuleManifestV14Schema,
  type GameModuleManifestV14,
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
const authorization = Object.freeze({
  ownerRelation: "same-owner" as const,
  sourceActorRoles: Object.freeze(["enemy" as const, "boss" as const]),
  targetActorRoles: Object.freeze(["enemy" as const, "boss" as const]),
  sourceEntityRoles: Object.freeze([]),
});
const bossToEnemyAuthorization = Object.freeze({
  ownerRelation: "different-owner" as const,
  sourceActorRoles: Object.freeze(["boss" as const]),
  targetActorRoles: Object.freeze(["enemy" as const]),
  sourceEntityRoles: Object.freeze([]),
});

const scrollingWavesConfiguration = z
  .strictObject({
    maximumEnemies: z.number().int().min(1).max(120),
    maximumSpawnsPerSecond: z.number().int().min(1).max(200),
    sourceIds: z.array(logicalId).min(1).max(32),
    assetRoleBySource: z.record(logicalId, z.literal("enemy")),
    spawnY: z.number().finite().min(-256).max(256),
    radius: z.number().finite().positive().max(256),
    waves: z
      .array(
        z
          .strictObject({
            sourceId: logicalId,
            startsAtMs: z.number().int().min(0).max(3_600_000),
            endsAtMs: z.number().int().min(1).max(3_600_000),
            intervalMs: z.number().int().min(1).max(60_000),
            maxAlive: z.number().int().min(1).max(120),
            speed: z.number().finite().positive().max(2_000),
          })
          .refine((wave) => wave.endsAtMs > wave.startsAtMs, {
            message: "wave end must follow start",
            path: ["endsAtMs"],
          }),
      )
      .min(1)
      .max(64),
  })
  .superRefine((configuration, context) => {
    if (
      new Set(configuration.sourceIds).size !== configuration.sourceIds.length
    )
      context.addIssue({ code: "custom", message: "sourceIds must be unique" });
    const sourceIds = new Set(configuration.sourceIds);
    if (
      Object.keys(configuration.assetRoleBySource).length !== sourceIds.size ||
      Object.keys(configuration.assetRoleBySource).some(
        (id) => !sourceIds.has(id),
      ) ||
      configuration.waves.some(
        (wave) =>
          !sourceIds.has(wave.sourceId) ||
          wave.maxAlive > configuration.maximumEnemies,
      )
    )
      context.addIssue({
        code: "custom",
        message: "wave sources/assets/capacities must close exactly",
      });
  });

const encounterPatternConfiguration = z.strictObject({
  attackChannelId: logicalId,
  patternSourceId: logicalId,
  activationMode: z
    .enum(["root-lifecycle", "encounter-events"])
    .default("root-lifecycle"),
  intervalMs: z.number().int().min(1).max(60_000),
  durationMs: z.number().int().min(0).max(3_600_000),
  maximumEmitters: z.number().int().min(1).max(120),
});

const encounterPatternV11Configuration = z
  .strictObject({
    attackChannelId: logicalId,
    patternSourceId: logicalId,
    allowedSourceIds: z.array(logicalId).min(1).max(32),
    activationMode: z.enum(["root-lifecycle", "encounter-events"]),
    intervalMs: z.number().int().min(1).max(60_000),
    durationMs: z.number().int().min(0).max(3_600_000),
    maximumEmitters: z.number().int().min(1).max(120),
  })
  .refine(
    ({ allowedSourceIds }) =>
      new Set(allowedSourceIds).size === allowedSourceIds.length,
    { message: "allowedSourceIds must be unique", path: ["allowedSourceIds"] },
  );

const hostileFixedConfiguration = z
  .strictObject({
    attackChannelId: logicalId,
    direction: z.strictObject({
      x: z.number().finite().min(-1).max(1),
      y: z.number().finite().min(-1).max(1),
    }),
  })
  .refine(
    ({ direction }) =>
      Math.abs(Math.hypot(direction.x, direction.y) - 1) <= 1e-6,
    {
      message: "hostile fixed direction must be normalized",
      path: ["direction"],
    },
  );

const hostileRadialConfiguration = z
  .strictObject({
    attackChannelId: logicalId,
    count: z.number().int().min(1).max(96),
    maximumCountBonus: z.literal(0),
    speed: z.number().finite().positive().max(2_000),
    damage: z.number().finite().positive().max(100_000),
    textureRole: z.literal("enemy-projectile"),
    maxActive: z.number().int().min(1).max(1_000),
    maximumAcceptedRequestsPerSecond: z.number().int().min(1).max(64),
    baseAngleOffsetDegrees: z.number().finite().min(-360).max(360),
    recycleMargin: z.number().finite().min(0).max(256),
    exhaustionPolicy: z.literal("drop-and-observe"),
  })
  .superRefine((configuration, context) => {
    if (configuration.count > configuration.maxActive)
      context.addIssue({
        code: "custom",
        message: "radial count exceeds the independent local pool",
        path: ["count"],
      });
    if (
      configuration.count * configuration.maximumAcceptedRequestsPerSecond >
      1_248
    )
      context.addIssue({
        code: "custom",
        message: "radial spawn reservation is unsafe",
        path: ["maximumAcceptedRequestsPerSecond"],
      });
  });

function baseManifest(kind: string) {
  return BATCH1_MODULE_DEFINITIONS.find(
    (entry) => entry.manifest.kind === kind,
  )!.manifest;
}

function v14Manifest(
  kind: string,
  overrides: Readonly<Record<string, unknown>>,
): GameModuleManifestV14 {
  const candidate = {
    ...structuredClone(baseManifest(kind)),
    schemaVersion: "1.4.0",
    provides: [],
    requires: [],
    inputPorts: [],
    outputPorts: [],
    dependencies: [],
    assetRequirements: [],
    conflicts: [],
    exclusiveOwnership: [],
    actorSnapshotReads: [],
    entityChannelReads: [],
    projectileChannelConsumer: null,
    attackChannel: null,
    projectileDelivery: undefined,
    preparedEffectCommit: null,
    modifierTargets: [],
    pickupEffectPlanTransform: null,
    actorRootProducer: null,
    actorRootConsumers: [],
    hostileAttackChannel: null,
    aggregateResourceClaims: [],
    actorSetDamageSink: null,
    actorRootContactConsumer: null,
    outcomeCommit: null,
    ...overrides,
  };
  return GameModuleManifestV14Schema.parse(
    JSON.parse(JSON.stringify(candidate)) as unknown,
  );
}

const scrollingManifest = v14Manifest("player-intent", {
  moduleId: "encounter.scrolling-waves",
  version: "1.0.0",
  kind: "encounter-flow",
  implementationId: "encounter.scrolling-waves.v1",
  configurationSchemaId: "encounter.scrolling-waves.config",
  inputPorts: [
    {
      id: "handoff-request",
      payloadType: "encounter-handoff-v1",
      required: false,
      multiple: false,
      delivery: "event",
      authorization: bossToEnemyAuthorization,
    },
    {
      id: "defeated",
      payloadType: "actor-defeated-v1",
      required: false,
      multiple: true,
      delivery: "event",
      authorization,
    },
  ],
  outputPorts: [
    { id: "roots", payloadType: "actor-root-channel-v1", delivery: "state" },
    {
      id: "lifecycle",
      payloadType: "actor-root-lifecycle-v1",
      delivery: "event",
    },
    {
      id: "handoff-cleared",
      payloadType: "encounter-handoff-v1",
      delivery: "event",
    },
  ],
  assetRequirements: [
    {
      roleId: "enemy",
      category: "enemy",
      cardinality: "exactly-one",
      sharing: "assembly",
    },
  ],
  resources: {
    activeEntities: 120,
    activeProjectiles: 0,
    spawnsPerSecond: 200,
    timers: 0,
  },
  runtimeLeases: { startLeases: 3, instanceLeases: 2, graphLeases: 0 },
  runtimeContract: {
    update: { mode: "graph-frame-v1", registrationId: "encounter.update" },
    timerSlots: { slotGroupId: "main" },
    inputRegistrations: [],
    observationReaders: [{ readerId: "encounter" }],
    contactCommit: null,
  },
  browserSupport: { desktop: true, touch: true },
  evidence: {
    provenanceId: "agent.batch3.reviewed",
    testSuiteId: "modules.batch3.hostile-slice",
  },
  actorRootProducer: {
    producerId: "enemy.roots",
    rootChannelOutputPort: "roots",
    lifecycleOutputPort: "lifecycle",
    actorRole: "enemy",
    capacityConfigurationField: "maximumEnemies",
    sourceIdsConfigurationField: "sourceIds",
    poolId: "enemy.pool",
    assetRoleMappingConfigurationField: "assetRoleBySource",
    movementMode: "scrolling-wave-v1",
  },
});

const sourceManifest = v14Manifest("attack-trigger", {
  moduleId: "trigger.encounter-pattern",
  version: "1.0.0",
  implementationId: "trigger.encounter-pattern.v1",
  configurationSchemaId: "trigger.encounter-pattern.config",
  inputPorts: [
    {
      id: "roots",
      payloadType: "actor-root-channel-v1",
      required: true,
      multiple: false,
      delivery: "state",
      authorization,
    },
    {
      id: "lifecycle",
      payloadType: "actor-root-lifecycle-v1",
      required: true,
      multiple: false,
      delivery: "event",
      authorization,
    },
    {
      id: "activations",
      payloadType: "encounter-pattern-activation-v1",
      required: false,
      multiple: false,
      delivery: "event",
      authorization,
    },
  ],
  outputPorts: [
    { id: "requests", payloadType: "attack-request-v3", delivery: "event" },
  ],
  resources: {
    activeEntities: 0,
    activeProjectiles: 0,
    spawnsPerSecond: 0,
    timers: 0,
  },
  runtimeLeases: { startLeases: 4, instanceLeases: 1, graphLeases: 0 },
  runtimeContract: {
    update: {
      mode: "graph-frame-v1",
      registrationId: "encounter-pattern.update",
    },
    timerSlots: { slotGroupId: "main" },
    inputRegistrations: [],
    observationReaders: [{ readerId: "encounter-pattern" }],
    contactCommit: null,
  },
  actorRootConsumers: [
    {
      consumerId: "enemy.pattern-source",
      rootChannelInputPort: "roots",
      expectedActorRole: "enemy",
      purpose: "pattern-source",
      maximumEntries: 120,
    },
    {
      consumerId: "boss.pattern-source",
      rootChannelInputPort: "roots",
      expectedActorRole: "boss",
      purpose: "pattern-source",
      maximumEntries: 1,
    },
  ],
  hostileAttackChannel: {
    role: "source",
    configurationField: "attackChannelId",
    rootChannelInputPort: "roots",
    lifecycleInputPort: "lifecycle",
    requestOutputPort: "requests",
    requestPayloadType: "attack-request-v3",
  },
  evidence: {
    provenanceId: "agent.batch3.reviewed",
    testSuiteId: "modules.batch3.hostile-slice",
  },
});

const sourceManifestV11 = GameModuleManifestV14Schema.parse({
  ...structuredClone(sourceManifest),
  version: "1.1.0",
  implementationId: "trigger.encounter-pattern.v1-1",
  configurationSchemaId: "trigger.encounter-pattern.config-v1-1",
  cardinality: {
    maximumInstancesPerAssembly: 64,
    maximumInstancesPerOwner: 16,
  },
  evidence: {
    provenanceId: "agent.batch3.reviewed",
    testSuiteId: "modules.batch3.hostile-slice-v1-1",
  },
});

const targetingManifest = v14Manifest("targeting", {
  moduleId: "targeting.hostile-fixed",
  version: "1.0.0",
  implementationId: "targeting.hostile-fixed.v1",
  configurationSchemaId: "targeting.hostile-fixed.config",
  cardinality: {
    maximumInstancesPerAssembly: 64,
    maximumInstancesPerOwner: 16,
  },
  inputPorts: [
    {
      id: "requests",
      payloadType: "attack-request-v3",
      required: true,
      multiple: false,
      delivery: "event",
      authorization,
    },
  ],
  outputPorts: [
    { id: "targeted", payloadType: "targeted-attack-v1", delivery: "event" },
  ],
  resources: {
    activeEntities: 0,
    activeProjectiles: 0,
    spawnsPerSecond: 0,
    timers: 0,
  },
  runtimeLeases: { startLeases: 1, instanceLeases: 0, graphLeases: 0 },
  runtimeContract: {
    update: null,
    timerSlots: { slotGroupId: "main" },
    inputRegistrations: [],
    observationReaders: [],
    contactCommit: null,
  },
  hostileAttackChannel: {
    role: "targeting",
    configurationField: "attackChannelId",
    requestInputPort: "requests",
    targetedOutputPort: "targeted",
    requestPayloadType: "attack-request-v3",
    targetedPayloadType: "targeted-attack-v1",
  },
  evidence: {
    provenanceId: "agent.batch3.reviewed",
    testSuiteId: "modules.batch3.hostile-slice",
  },
});

const deliveryManifest = v14Manifest("attack-delivery", {
  moduleId: "delivery.pattern.radial",
  version: "1.1.0",
  implementationId: "delivery.pattern.radial.hostile.v1",
  configurationSchemaId: "delivery.pattern.radial.hostile.config",
  provides: [
    {
      id: "delivery.projectile-channel",
      version: "1.0.0",
      scope: "assembly",
    },
  ],
  inputPorts: [
    {
      id: "targeted",
      payloadType: "targeted-attack-v1",
      required: true,
      multiple: false,
      delivery: "event",
      authorization,
    },
  ],
  outputPorts: [
    {
      id: "projectiles",
      payloadType: "entity-channel-v1",
      delivery: "state",
      entityRole: "projectile",
    },
    { id: "emission", payloadType: "emission-v2", delivery: "event" },
  ],
  assetRequirements: [
    {
      roleId: "enemy-projectile",
      category: "projectile",
      cardinality: "exactly-one",
      sharing: "instance",
    },
  ],
  resources: {
    activeEntities: 1_000,
    activeProjectiles: 1_000,
    spawnsPerSecond: 1_248,
    timers: 0,
  },
  runtimeLeases: { startLeases: 2, instanceLeases: 4, graphLeases: 0 },
  runtimeContract: {
    update: {
      mode: "graph-frame-v1",
      registrationId: "hostile-delivery.update",
    },
    timerSlots: { slotGroupId: "main" },
    inputRegistrations: [],
    observationReaders: [{ readerId: "hostile-delivery" }],
    contactCommit: null,
  },
  ownedEntityChannels: [
    {
      channelId: "projectiles",
      outputPort: "projectiles",
      entityRole: "projectile",
      capacity: {
        kind: "resource-grant",
        resources: ["activeEntities", "activeProjectiles"],
      },
      poolDescriptor: {
        poolId: "hostile-projectiles.pool",
        entityRole: "projectile",
        capacityResource: "activeEntities",
        projectileResource: "activeProjectiles",
      },
    },
  ],
  hostileAttackChannel: {
    role: "delivery",
    configurationField: "attackChannelId",
    targetedInputPort: "targeted",
    projectileChannelOutputPort: "projectiles",
    emissionOutputPort: "emission",
    targetedPayloadType: "targeted-attack-v1",
    emissionPayloadType: "emission-v2",
    requiredAssetRole: "enemy-projectile",
  },
  aggregateResourceClaims: [
    {
      claimId: "hostile.projectiles.claim",
      contentionKind: "hostile-contention-v1",
      ownedProjectileChannelId: "projectiles",
      resources: ["activeEntities", "activeProjectiles", "spawnsPerSecond"],
      capacitySource: "resolved-resource-grant",
    },
  ],
  evidence: {
    provenanceId: "agent.batch3.reviewed",
    testSuiteId: "modules.batch3.hostile-slice",
  },
});

const scrollingFactorySource = `export function create(context){
const config=context.configuration;const rootChannelId="root-channel."+context.identity.instanceId+".enemy.roots";let sequence=0;let handoffSequence=0;let revision=0;let cancelled=false;const active=[];const next=config.waves.map(w=>w.startsAtMs);const lane=[.12,.31,.5,.69,.88];let laneIndex=0;
const emitLifecycle=(reference,sourceId,reason,position)=>context.ports.emitEvent("lifecycle",Object.freeze({sequence:sequence++,emittedAtMs:context.clock.nowMs(),rootChannelId:reference.rootChannelId,actorId:reference.actorId,actorGeneration:reference.actorGeneration,actorRole:"enemy",sourceId,reason,position:Object.freeze({...position})}));
const deactivate=(record,reason)=>{context.services.actorRoots.deactivate(rootChannelId,Object.freeze({reference:record.reference,reason}));if(reason!=="terminal-cleanup")emitLifecycle(record.reference,record.sourceId,reason,record.position);};
context.ports.declareHandler("handoff-request",handoff=>{if(handoff.status!=="requested")throw new Error("waves require a handoff request");if(cancelled)throw new Error("duplicate waves handoff request");cancelled=true;const ordered=active.splice(0).sort((a,b)=>a.reference.actorId.localeCompare(b.reference.actorId)||a.reference.actorGeneration-b.reference.actorGeneration);for(const record of ordered)deactivate(record,"boss-handoff");context.ports.emitEvent("handoff-cleared",Object.freeze({sequence:handoffSequence++,emittedAtMs:context.clock.nowMs(),handoffId:handoff.handoffId,bossStartMs:handoff.bossStartMs,status:"cleared"}));});
context.ports.declareHandler("defeated",defeat=>{const index=active.findIndex(record=>record.reference.actorId===defeat.actorId&&record.reference.actorGeneration===defeat.actorGeneration&&record.reference.rootChannelId===defeat.rootChannelId);if(index<0)throw new Error("enemy defeat reference is stale or inactive");const record=active[index];if(record.sourceId!==defeat.sourceId)throw new Error("enemy defeat source lineage mismatch");deactivate(record,"health-depleted");active.splice(index,1);});
return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.assets.requireTexture("enemy");context.ports.publishState("roots",Object.freeze({revision:revision++,emittedAtMs:context.clock.nowMs(),rootChannelId,producerInstanceId:context.identity.instanceId,actorRole:"enemy",capacity:config.maximumEnemies}));context.services.observation.register("encounter",()=>Object.freeze({active:active.length,sequence,laneIndex,cancelled}));},update(deltaMs){if(!Number.isFinite(deltaMs)||deltaMs<0)throw new Error("invalid encounter delta");const now=context.clock.nowMs();for(let index=active.length-1;index>=0;index-=1){const record=active[index];record.position.y+=record.speed*deltaMs/1000;if(record.position.y>context.services.viewport.read().height+config.radius){deactivate(record,"offscreen");active.splice(index,1);}}if(cancelled)return;for(let waveIndex=0;waveIndex<config.waves.length;waveIndex+=1){const wave=config.waves[waveIndex];if(now<wave.startsAtMs||now>=wave.endsAtMs||now<next[waveIndex])continue;next[waveIndex]+=wave.intervalMs;const waveAlive=active.filter(entry=>entry.waveIndex===waveIndex).length;if(active.length>=config.maximumEnemies||waveAlive>=wave.maxAlive)continue;const viewport=context.services.viewport.read();const position={x:viewport.width*lane[laneIndex++%lane.length],y:config.spawnY};const reference=context.services.actorRoots.activate(rootChannelId,Object.freeze({sourceId:wave.sourceId,assetRole:config.assetRoleBySource[wave.sourceId],position:Object.freeze({...position}),radius:config.radius,movement:Object.freeze({mode:"scrolling-wave-v1",velocity:Object.freeze({x:0,y:wave.speed})})}));const record={reference,sourceId:wave.sourceId,waveIndex,speed:wave.speed,position};active.push(record);emitLifecycle(reference,wave.sourceId,"activated",position);}},stop(){for(const record of active.splice(0).reverse())deactivate(record,"terminal-cleanup");},dispose(){active.splice(0);}});}`;

const sourceFactorySource = `export function create(context){
const config=context.configuration;let channel;let sequence=0;let activationSequence=0;const emitters=new Map();
const keyOf=(value,patternSourceId)=>value.actorId+"@"+value.actorGeneration+"/"+patternSourceId;
const clearRoot=value=>{for(const [key,record] of emitters)if(record.actorId===value.actorId&&record.actorGeneration===value.actorGeneration)emitters.delete(key);};
const emit=record=>{if(sequence>=Number.MAX_SAFE_INTEGER||record.emissionIndex>=Number.MAX_SAFE_INTEGER)throw new Error("encounter pattern sequence exhausted");context.ports.emitEvent("requests",Object.freeze({sequence:sequence++,emittedAtMs:context.clock.nowMs(),requestedAtMs:context.clock.nowMs(),attackChannelId:config.attackChannelId,rootChannelId:record.rootChannelId,sourceActorId:record.actorId,sourceGeneration:record.actorGeneration,patternSourceId:record.patternSourceId,emissionIndex:record.emissionIndex++}));};
const activate=(value,patternSourceId,startsAtMs,endsAtMs,intervalMs)=>{if(emitters.size>=config.maximumEmitters)throw new Error("encounter emitter capacity exhausted");const key=keyOf(value,patternSourceId);if(emitters.has(key))throw new Error("duplicate encounter pattern activation");const now=context.clock.nowMs();const record={rootChannelId:value.rootChannelId,actorId:value.actorId,actorGeneration:value.actorGeneration,patternSourceId,activationSequence:activationSequence++,emissionIndex:0,nextDueMs:startsAtMs,endsAtMs,intervalMs};emitters.set(key,record);if(now>=record.nextDueMs&&record.nextDueMs<=record.endsAtMs){emit(record);record.nextDueMs+=record.intervalMs;}};
context.ports.declareHandler("roots",value=>{channel=value;});
context.ports.declareHandler("lifecycle",value=>{if(!channel||value.rootChannelId!==channel.rootChannelId)throw new Error("encounter root lineage mismatch");if(value.reason==="activated"&&(config.activationMode??"root-lifecycle")==="root-lifecycle")activate(value,config.patternSourceId,context.clock.nowMs(),context.clock.nowMs()+config.durationMs,config.intervalMs);else if(value.reason!=="activated")clearRoot(value);});
context.ports.declareHandler("activations",value=>{if((config.activationMode??"root-lifecycle")!=="encounter-events")throw new Error("unexpected encounter pattern activation");if(!channel||value.rootChannelId!==channel.rootChannelId||value.attackChannelId!==config.attackChannelId)throw new Error("encounter activation lineage mismatch");activate(value,value.patternSourceId,value.startsAtMs,value.endsAtMs,value.intervalMs);});
return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("encounter-pattern",()=>Object.freeze({emitters:emitters.size,sequence}));},update(){const now=context.clock.nowMs();const ordered=[...emitters.values()].sort((a,b)=>a.activationSequence-b.activationSequence||a.actorId.localeCompare(b.actorId)||a.actorGeneration-b.actorGeneration);for(const record of ordered){if(now>record.endsAtMs){emitters.delete(keyOf(record,record.patternSourceId));continue;}if(now>=record.nextDueMs&&record.nextDueMs<=record.endsAtMs){emit(record);record.nextDueMs+=record.intervalMs;}}},stop(){},dispose(){emitters.clear();channel=undefined;}});}`;

const sourceFactorySourceV11 = `export function create(context){
const config=context.configuration;let channel;let sequence=0;let activationSequence=0;const emitters=new Map();const allowed=new Set(config.allowedSourceIds);
const keyOf=(value,patternSourceId)=>value.actorId+"@"+value.actorGeneration+"/"+patternSourceId;
const clearRoot=value=>{for(const [key,record] of emitters)if(record.actorId===value.actorId&&record.actorGeneration===value.actorGeneration)emitters.delete(key);};
const emit=record=>{if(sequence>=Number.MAX_SAFE_INTEGER||record.emissionIndex>=Number.MAX_SAFE_INTEGER)throw new Error("encounter pattern sequence exhausted");context.ports.emitEvent("requests",Object.freeze({sequence:sequence++,emittedAtMs:context.clock.nowMs(),requestedAtMs:context.clock.nowMs(),attackChannelId:config.attackChannelId,rootChannelId:record.rootChannelId,sourceActorId:record.actorId,sourceGeneration:record.actorGeneration,patternSourceId:record.patternSourceId,emissionIndex:record.emissionIndex++}));};
const activate=(value,patternSourceId,startsAtMs,endsAtMs,intervalMs)=>{if(emitters.size>=config.maximumEmitters)throw new Error("encounter emitter capacity exhausted");const key=keyOf(value,patternSourceId);if(emitters.has(key))throw new Error("duplicate encounter pattern activation");const now=context.clock.nowMs();const record={rootChannelId:value.rootChannelId,actorId:value.actorId,actorGeneration:value.actorGeneration,patternSourceId,activationSequence:activationSequence++,emissionIndex:0,nextDueMs:startsAtMs,endsAtMs,intervalMs};emitters.set(key,record);if(now>=record.nextDueMs&&record.nextDueMs<=record.endsAtMs){emit(record);record.nextDueMs+=record.intervalMs;}};
context.ports.declareHandler("roots",value=>{channel=value;});
context.ports.declareHandler("lifecycle",value=>{if(!channel||value.rootChannelId!==channel.rootChannelId)throw new Error("encounter root lineage mismatch");if(value.reason!=="activated"){clearRoot(value);return;}if(config.activationMode==="root-lifecycle"&&allowed.has(value.sourceId))activate(value,config.patternSourceId,context.clock.nowMs(),context.clock.nowMs()+config.durationMs,config.intervalMs);});
context.ports.declareHandler("activations",value=>{if(config.activationMode!=="encounter-events")throw new Error("unexpected encounter pattern activation");if(!channel||value.rootChannelId!==channel.rootChannelId||value.attackChannelId!==config.attackChannelId||value.patternSourceId!==config.patternSourceId)throw new Error("encounter activation lineage mismatch");activate(value,value.patternSourceId,value.startsAtMs,value.endsAtMs,value.intervalMs);});
return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("encounter-pattern",()=>Object.freeze({emitters:emitters.size,sequence}));},update(){const now=context.clock.nowMs();const ordered=[...emitters.values()].sort((a,b)=>a.activationSequence-b.activationSequence||a.actorId.localeCompare(b.actorId)||a.actorGeneration-b.actorGeneration);for(const record of ordered){if(now>record.endsAtMs){emitters.delete(keyOf(record,record.patternSourceId));continue;}if(now>=record.nextDueMs&&record.nextDueMs<=record.endsAtMs){emit(record);record.nextDueMs+=record.intervalMs;}}},stop(){},dispose(){emitters.clear();channel=undefined;}});}`;

const targetingFactorySource = `export function create(context){const config=context.configuration;context.ports.declareHandler("requests",request=>{if(request.attackChannelId!==config.attackChannelId)throw new Error("hostile targeting channel mismatch");context.ports.emitEvent("targeted",Object.freeze({request,direction:config.direction}));});return Object.freeze({instanceId:context.identity.instanceId});}`;

const deliveryFactorySource = `export function create(context){
const config=context.configuration;const active=[];let emitted=0;let observedLineage;
context.ports.declareHandler("targeted",targeted=>{
if(targeted.attackChannelId!==config.attackChannelId)throw new Error("hostile delivery channel mismatch");
const lineageId="hostile."+targeted.rootChannelId+"."+targeted.attackChannelId;observedLineage=lineageId;
const textureKey=context.assets.requireTexture(config.textureRole);const offset=config.baseAngleOffsetDegrees*Math.PI/180;
const plans=Array.from({length:config.count},(_,index)=>{const angle=Math.atan2(targeted.direction.y,targeted.direction.x)+offset+index*Math.PI*2/config.count;const velocity=Object.freeze({x:Math.cos(angle)*config.speed,y:Math.sin(angle)*config.speed});return Object.freeze({position:targeted.sourcePosition,velocity,damage:config.damage,textureKey});});
const result=context.services.hostileProjectileDelivery.admit(lineageId,Object.freeze({requestSequence:targeted.sequence,plans:Object.freeze(plans)}));
if(result.activated.length===0)context.ports.emitEvent("emission",Object.freeze({targeted,projectile:null,final:true}));
for(let index=0;index<result.activated.length;index+=1){const projectile=result.activated[index];const plan=plans[index];active.push({lineageId,reference:projectile,position:{...plan.position},velocity:plan.velocity});context.ports.emitEvent("emission",Object.freeze({targeted,projectile:Object.freeze({projectileEntityId:projectile.projectileEntityId,projectileChannelId:projectile.projectileChannelId,projectileGeneration:projectile.projectileGeneration,position:plan.position,velocity:plan.velocity,damage:config.damage}),final:index===result.activated.length-1}));emitted++;}
});
const recycleAll=()=>{for(const record of active.splice(0).reverse())context.services.hostileProjectileDelivery.recycle(record.lineageId,record.reference);};
return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.assets.requireTexture(config.textureRole);context.ports.publishState("projectiles",Object.freeze({revision:0,emittedAtMs:context.clock.nowMs(),channelId:context.identity.instanceId+".projectiles",ownerInstanceId:context.identity.instanceId,ownerActorId:context.identity.ownerId,entityRole:"projectile",generation:0}));context.services.observation.register("hostile-delivery",()=>Object.freeze({...(observedLineage?context.services.hostileProjectileDelivery.observe(observedLineage):{}),emitted,active:active.length}));},update(deltaMs){if(!Number.isFinite(deltaMs)||deltaMs<0)throw new Error("invalid hostile delivery delta");const viewport=context.services.viewport.read();for(let index=active.length-1;index>=0;index-=1){const record=active[index];record.position.x+=record.velocity.x*deltaMs/1000;record.position.y+=record.velocity.y*deltaMs/1000;const margin=config.recycleMargin;if(record.position.x < -margin||record.position.x > viewport.width+margin||record.position.y < -margin||record.position.y > viewport.height+margin){context.services.hostileProjectileDelivery.recycle(record.lineageId,record.reference);active.splice(index,1);}}},stop(){recycleAll();},dispose(){active.splice(0);}});
}`;

const reservation = {
  scrolling: {
    descriptorVersion: "1.1.0",
    reservationId: "encounter.scrolling-waves.maximum-reachable",
    strategy: "maximum-reachable-v1",
    fields: [
      {
        resource: "activeEntities",
        formula: { kind: "configuration-field", field: "maximumEnemies" },
      },
      {
        resource: "activeProjectiles",
        formula: { kind: "constant", value: 0 },
      },
      {
        resource: "spawnsPerSecond",
        formula: {
          kind: "configuration-field",
          field: "maximumSpawnsPerSecond",
        },
      },
      { resource: "timers", formula: { kind: "constant", value: 0 } },
    ],
  },
  zero: {
    descriptorVersion: "1.0.0",
    reservationId: "batch3.hostile.zero",
    strategy: "constant",
    fields: [],
  },
  delivery: {
    descriptorVersion: "1.1.0",
    reservationId: "delivery.pattern.radial.hostile.maximum-reachable",
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
          sumFields: ["count", "maximumCountBonus"],
        },
      },
      { resource: "timers", formula: { kind: "constant", value: 0 } },
    ],
  },
} as const satisfies Record<string, CanonicalResourceReservationDescriptorV11>;

export type Batch3HostileSliceDefinition = Readonly<{
  manifest: GameModuleManifestV14;
  configurationSchema: z.ZodType<Record<string, unknown>>;
  configurationDescriptor: CanonicalConfigurationDescriptor;
  reservationDescriptor: CanonicalResourceReservationDescriptorV11;
  reservationEvaluator(configuration: unknown): ModuleResourceBudget;
  implementationSource: string;
  exportName: "create";
  exportKind: "lifecycle-create-v1";
}>;

function definition(
  manifest: GameModuleManifestV14,
  configurationSchema: z.ZodType,
  reservationDescriptor: CanonicalResourceReservationDescriptorV11,
  implementationSource: string,
): Batch3HostileSliceDefinition {
  const descriptor: CanonicalConfigurationDescriptor = Object.freeze({
    descriptorVersion: "1.0.0",
    schemaId: manifest.configurationSchemaId,
    dialect: "json-schema-2020-12-subset",
    schema: Object.freeze({ type: "object", additionalProperties: false }),
  });
  return Object.freeze({
    manifest,
    configurationSchema: configurationSchema as z.ZodType<
      Record<string, unknown>
    >,
    configurationDescriptor: descriptor,
    reservationDescriptor,
    reservationEvaluator(configuration: unknown) {
      return evaluateCanonicalResourceReservationV11(
        reservationDescriptor,
        configurationSchema.parse(configuration),
      );
    },
    implementationSource,
    exportName: "create",
    exportKind: "lifecycle-create-v1",
  });
}

export const BATCH3_HOSTILE_SLICE_DEFINITIONS = Object.freeze([
  definition(
    scrollingManifest,
    scrollingWavesConfiguration,
    reservation.scrolling,
    scrollingFactorySource,
  ),
  definition(
    sourceManifest,
    encounterPatternConfiguration,
    reservation.zero,
    sourceFactorySource,
  ),
  definition(
    targetingManifest,
    hostileFixedConfiguration,
    reservation.zero,
    targetingFactorySource,
  ),
  definition(
    deliveryManifest,
    hostileRadialConfiguration,
    reservation.delivery,
    deliveryFactorySource,
  ),
  definition(
    sourceManifestV11,
    encounterPatternV11Configuration,
    reservation.zero,
    sourceFactorySourceV11,
  ),
]);

const lockIdentity = new TextEncoder().encode(
  "pnpm-lock.batch3.hostile-slice.v1",
);
const toolchainIdentity = new TextEncoder().encode(
  "typescript-5.9.3.esm-self-contained.batch3.hostile-slice.v1",
);

export async function registerBatch3HostileSliceDefinitions(
  registry: GameModuleRegistry,
): Promise<void> {
  const loader = new TrustedGameModuleExecutableLoader();
  for (const item of BATCH3_HOSTILE_SLICE_DEFINITIONS) {
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
    registry.registerProductionV14({
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

export async function createBatch3HostileSliceRegistry(): Promise<GameModuleRegistry> {
  const registry = new GameModuleRegistry();
  await registerBatch3HostileSliceDefinitions(registry);
  return registry;
}
