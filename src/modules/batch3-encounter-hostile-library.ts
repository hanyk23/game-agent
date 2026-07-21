import { createHash } from "node:crypto";

import { z } from "zod";

import { BATCH1_MODULE_DEFINITIONS } from "./batch1-gameplay-library.js";
import {
  type Batch3HostileSliceDefinition,
  registerBatch3HostileSliceDefinitions,
} from "./batch3-hostile-slice-library.js";
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
const direction = z
  .strictObject({
    x: z.number().finite().min(-1).max(1),
    y: z.number().finite().min(-1).max(1),
  })
  .refine(({ x, y }) => Math.abs(Math.hypot(x, y) - 1) <= 1e-6, {
    message: "direction must be normalized",
  });
const authorization = Object.freeze({
  ownerRelation: "same-owner" as const,
  sourceActorRoles: Object.freeze(["enemy" as const, "boss" as const]),
  targetActorRoles: Object.freeze(["enemy" as const, "boss" as const]),
  sourceEntityRoles: Object.freeze([]),
});
const enemyToBossAuthorization = Object.freeze({
  ownerRelation: "different-owner" as const,
  sourceActorRoles: Object.freeze(["enemy" as const]),
  targetActorRoles: Object.freeze(["boss" as const]),
  sourceEntityRoles: Object.freeze([]),
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
  return GameModuleManifestV14Schema.parse(
    JSON.parse(
      JSON.stringify({
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
      }),
    ) as unknown,
  );
}

const bossConfiguration = z
  .strictObject({
    bossStartMs: z.number().int().min(0).max(3_600_000),
    handoffId: logicalId,
    maximumBosses: z.literal(1),
    sourceIds: z.array(logicalId).length(1),
    assetRoleBySource: z.record(logicalId, z.literal("boss")),
    spawnXRatio: z.number().finite().min(0).max(1),
    spawnY: z.number().finite().min(-256).max(512),
    radius: z.number().finite().positive().max(256),
    horizontalSpeed: z.number().finite().min(0).max(2_000),
    minimumXRatio: z.number().finite().min(0).max(1),
    maximumXRatio: z.number().finite().min(0).max(1),
    phases: z
      .array(
        z.strictObject({
          phaseId: logicalId,
          healthThreshold: z.number().finite().min(0).max(1),
          patterns: z
            .array(
              z.strictObject({
                patternSourceId: logicalId,
                attackChannelId: logicalId,
                intervalMs: z.number().int().min(1).max(60_000),
                durationMs: z.number().int().min(0).max(3_600_000),
              }),
            )
            .min(1)
            .max(16),
        }),
      )
      .min(1)
      .max(16),
  })
  .superRefine((configuration, context) => {
    const sourceId = configuration.sourceIds[0]!;
    if (
      Object.keys(configuration.assetRoleBySource).length !== 1 ||
      configuration.assetRoleBySource[sourceId] !== "boss"
    )
      context.addIssue({
        code: "custom",
        message: "Boss source and asset role must close exactly",
      });
    if (
      configuration.minimumXRatio > configuration.maximumXRatio ||
      configuration.spawnXRatio < configuration.minimumXRatio ||
      configuration.spawnXRatio > configuration.maximumXRatio
    )
      context.addIssue({
        code: "custom",
        message: "Boss horizontal bounds are invalid",
      });
    if (configuration.phases[0]?.healthThreshold !== 1)
      context.addIssue({
        code: "custom",
        message: "first Boss phase must start at health ratio one",
        path: ["phases", 0, "healthThreshold"],
      });
    for (let index = 1; index < configuration.phases.length; index += 1)
      if (
        configuration.phases[index]!.healthThreshold >=
        configuration.phases[index - 1]!.healthThreshold
      )
        context.addIssue({
          code: "custom",
          message: "Boss phase thresholds must be strictly descending",
          path: ["phases", index, "healthThreshold"],
        });
  });

const aimedConfiguration = z.strictObject({
  attackChannelId: logicalId,
  playerSnapshotReadId: z.literal("hostile.player"),
});

const commonDeliveryShape = {
  attackChannelId: logicalId,
  count: z.number().int().min(1).max(96),
  maximumCountBonus: z.literal(0),
  speed: z.number().finite().positive().max(2_000),
  damage: z.number().finite().positive().max(100_000),
  textureRole: z.literal("enemy-projectile"),
  maxActive: z.number().int().min(1).max(1_000),
  maximumAcceptedRequestsPerSecond: z.number().int().min(1).max(64),
  recycleMargin: z.number().finite().min(0).max(256),
  exhaustionPolicy: z.literal("drop-and-observe"),
};

function deliveryConfiguration(
  specific: z.ZodRawShape,
): z.ZodType<Record<string, unknown>> {
  return z
    .strictObject({ ...commonDeliveryShape, ...specific })
    .superRefine((configuration, context) => {
      if (configuration.count > configuration.maxActive)
        context.addIssue({
          code: "custom",
          message: "hostile pattern count exceeds its independent pool",
          path: ["count"],
        });
      if (
        configuration.count * configuration.maximumAcceptedRequestsPerSecond >
        1_248
      )
        context.addIssue({
          code: "custom",
          message: "hostile pattern spawn reservation is unsafe",
          path: ["maximumAcceptedRequestsPerSecond"],
        });
    }) as z.ZodType<Record<string, unknown>>;
}

const deliverySchemas = Object.freeze({
  spiral: deliveryConfiguration({
    rotationStepDegrees: z.number().finite().min(-360).max(360),
  }),
  fan: deliveryConfiguration({
    arcDegrees: z.number().finite().positive().max(360),
  }),
  aimed: deliveryConfiguration({
    aimSpreadDegrees: z.number().finite().min(0).max(180),
  }),
  wave: deliveryConfiguration({
    waveSpreadDegrees: z.number().finite().min(0).max(180),
    phaseStepDegrees: z.number().finite().min(-360).max(360),
  }),
  rain: deliveryConfiguration({
    spreadDegrees: z.number().finite().min(0).max(180),
    downwardBaseDirection: direction,
  }),
  rotatingRing: deliveryConfiguration({
    ringRotationStepDegrees: z.number().finite().min(-360).max(360),
  }),
  burst: deliveryConfiguration({
    burstSpreadDegrees: z.number().finite().min(0).max(180),
    emissionIndexMode: z.literal("stable-request-sequence"),
  }),
});

const bossManifest = v14Manifest("player-intent", {
  moduleId: "encounter.boss-phases",
  version: "1.0.0",
  kind: "encounter-flow",
  implementationId: "encounter.boss-phases.v1",
  configurationSchemaId: "encounter.boss-phases.config",
  inputPorts: [
    {
      id: "handoff-cleared",
      payloadType: "encounter-handoff-v1",
      required: true,
      multiple: false,
      delivery: "event",
      authorization: enemyToBossAuthorization,
    },
    {
      id: "health",
      payloadType: "health-state-v3",
      required: true,
      multiple: false,
      delivery: "state",
      authorization,
    },
    {
      id: "defeated",
      payloadType: "actor-defeated-v1",
      required: false,
      multiple: false,
      delivery: "event",
      authorization,
    },
  ],
  outputPorts: [
    {
      id: "handoff-request",
      payloadType: "encounter-handoff-v1",
      delivery: "event",
    },
    { id: "roots", payloadType: "actor-root-channel-v1", delivery: "state" },
    {
      id: "lifecycle",
      payloadType: "actor-root-lifecycle-v1",
      delivery: "event",
    },
    {
      id: "activations",
      payloadType: "encounter-pattern-activation-v1",
      delivery: "event",
    },
  ],
  assetRequirements: [
    {
      roleId: "boss",
      category: "boss",
      cardinality: "exactly-one",
      sharing: "assembly",
    },
  ],
  resources: {
    activeEntities: 1,
    activeProjectiles: 0,
    spawnsPerSecond: 1,
    timers: 0,
  },
  runtimeLeases: { startLeases: 4, instanceLeases: 2, graphLeases: 0 },
  runtimeContract: {
    update: { mode: "graph-frame-v1", registrationId: "boss.update" },
    timerSlots: { slotGroupId: "main" },
    inputRegistrations: [],
    observationReaders: [{ readerId: "boss" }],
    contactCommit: null,
  },
  browserSupport: { desktop: true, touch: true },
  actorRootProducer: {
    producerId: "boss.roots",
    rootChannelOutputPort: "roots",
    lifecycleOutputPort: "lifecycle",
    actorRole: "boss",
    capacityConfigurationField: "maximumBosses",
    sourceIdsConfigurationField: "sourceIds",
    poolId: "boss.pool",
    assetRoleMappingConfigurationField: "assetRoleBySource",
    movementMode: "boss-horizontal-v1",
  },
  evidence: {
    provenanceId: "agent.batch3.reviewed",
    testSuiteId: "modules.batch3.encounter-hostile",
  },
});

const aimedManifest = v14Manifest("targeting", {
  moduleId: "targeting.hostile-aimed",
  version: "1.0.0",
  implementationId: "targeting.hostile-aimed.v1",
  configurationSchemaId: "targeting.hostile-aimed.config",
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
  runtimeLeases: { startLeases: 1, instanceLeases: 1, graphLeases: 0 },
  runtimeContract: {
    update: null,
    timerSlots: { slotGroupId: "main" },
    inputRegistrations: [],
    observationReaders: [],
    contactCommit: null,
  },
  actorSnapshotReads: [
    {
      readId: "hostile.player",
      ownerRelation: "different-owner",
      sourceActorRoles: ["enemy", "boss"],
      targetActorRoles: ["player"],
      maximumEntries: 1,
      entryFields: ["actorId", "actorGeneration", "role", "active", "position"],
      envelopeFields: [
        "directoryRevision",
        "sampledAtMs",
        "sampledFrameSequence",
        "entryCount",
      ],
      order: "actor-id-generation",
      distanceOrigin: null,
    },
  ],
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
    testSuiteId: "modules.batch3.encounter-hostile",
  },
});

function deliveryManifest(
  moduleId: string,
  patternKey: string,
): GameModuleManifestV14 {
  const patternId =
    patternKey === "rotatingRing" ? "rotating-ring" : patternKey;
  return v14Manifest("attack-delivery", {
    moduleId,
    version: "1.1.0",
    implementationId: `${moduleId}.hostile.v1`,
    configurationSchemaId: `${moduleId}.hostile.config`,
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
          poolId: `hostile-projectiles.${patternId}.pool`,
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
        claimId: `hostile.projectiles.${patternId}.claim`,
        contentionKind: "hostile-contention-v1",
        ownedProjectileChannelId: "projectiles",
        resources: ["activeEntities", "activeProjectiles", "spawnsPerSecond"],
        capacitySource: "resolved-resource-grant",
      },
    ],
    evidence: {
      provenanceId: "agent.batch3.reviewed",
      testSuiteId: "modules.batch3.encounter-hostile",
    },
  });
}

const bossFactorySource = `export function create(context){
const config=context.configuration;const rootChannelId="root-channel."+context.identity.instanceId+".boss.roots";let lifecycleSequence=0;let handoffSequence=0;let activationSequence=0;let revision=0;let requested=false;let reference;let position;let phaseIndex=-1;
const sourceId=config.sourceIds[0];
const emitLifecycle=reason=>context.ports.emitEvent("lifecycle",Object.freeze({sequence:lifecycleSequence++,emittedAtMs:context.clock.nowMs(),rootChannelId,actorId:reference.actorId,actorGeneration:reference.actorGeneration,actorRole:"boss",sourceId,reason,position:Object.freeze({...position})}));
const emitPhase=index=>{if(index===phaseIndex)return;if(phaseIndex>=0)emitLifecycle("phase-transition");phaseIndex=index;const now=context.clock.nowMs();for(const pattern of config.phases[index].patterns)context.ports.emitEvent("activations",Object.freeze({sequence:activationSequence++,emittedAtMs:now,rootChannelId,actorId:reference.actorId,actorGeneration:reference.actorGeneration,actorRole:"boss",attackChannelId:pattern.attackChannelId,patternSourceId:pattern.patternSourceId,startsAtMs:now,endsAtMs:now+pattern.durationMs,intervalMs:pattern.intervalMs}));};
const activate=()=>{if(reference)throw new Error("Boss already active");const viewport=context.services.viewport.read();position={x:viewport.width*config.spawnXRatio,y:config.spawnY};reference=context.services.actorRoots.activate(rootChannelId,Object.freeze({sourceId,assetRole:"boss",position:Object.freeze(position),radius:config.radius,movement:Object.freeze({mode:"boss-horizontal-v1",speed:config.horizontalSpeed,minX:viewport.width*config.minimumXRatio,maxX:viewport.width*config.maximumXRatio})}));emitLifecycle("activated");emitPhase(0);};
context.ports.declareHandler("handoff-cleared",handoff=>{if(handoff.status!=="cleared"||handoff.handoffId!==config.handoffId||handoff.bossStartMs!==config.bossStartMs)throw new Error("Boss handoff acknowledgement mismatch");activate();});
context.ports.declareHandler("health",health=>{if(!reference||health.rootChannelId!==rootChannelId||health.actorId!==reference.actorId||health.actorGeneration!==reference.actorGeneration)throw new Error("Boss health lineage mismatch");let selected=0;for(let index=1;index<config.phases.length;index+=1)if(health.ratio<=config.phases[index].healthThreshold)selected=index;emitPhase(selected);});
context.ports.declareHandler("defeated",defeat=>{if(!reference||defeat.rootChannelId!==rootChannelId||defeat.actorId!==reference.actorId||defeat.actorGeneration!==reference.actorGeneration)throw new Error("Boss defeat lineage mismatch");context.services.actorRoots.deactivate(rootChannelId,Object.freeze({reference,reason:"health-depleted"}));emitLifecycle("health-depleted");reference=undefined;phaseIndex=-1;});
return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.assets.requireTexture("boss");context.ports.publishState("roots",Object.freeze({revision:revision++,emittedAtMs:context.clock.nowMs(),rootChannelId,producerInstanceId:context.identity.instanceId,actorRole:"boss",capacity:1}));context.services.observation.register("boss",()=>Object.freeze({requested,active:reference!==undefined,phaseIndex}));},update(){if(!requested&&context.clock.nowMs()>=config.bossStartMs){requested=true;context.ports.emitEvent("handoff-request",Object.freeze({sequence:handoffSequence++,emittedAtMs:context.clock.nowMs(),handoffId:config.handoffId,bossStartMs:config.bossStartMs,status:"requested"}));}},stop(){if(reference){context.services.actorRoots.deactivate(rootChannelId,Object.freeze({reference,reason:"terminal-cleanup"}));reference=undefined;}},dispose(){reference=undefined;position=undefined;phaseIndex=-1;}});}`;

const aimedFactorySource = `export function create(context){const config=context.configuration;context.ports.declareHandler("requests",request=>{if(request.attackChannelId!==config.attackChannelId)throw new Error("hostile aimed channel mismatch");const snapshot=context.services.actorSnapshots.read(config.playerSnapshotReadId);if(!snapshot||snapshot.entryCount!==1||!Array.isArray(snapshot.entries)||snapshot.entries.length!==1)throw new Error("hostile aimed player snapshot is not singular");const player=snapshot.entries[0];if(player.role!=="player"||player.active!==true||!player.position||!Number.isFinite(player.position.x)||!Number.isFinite(player.position.y))throw new Error("hostile aimed player snapshot is invalid");context.ports.emitEvent("targeted",Object.freeze({request,targetPosition:Object.freeze({x:player.position.x,y:player.position.y})}));});return Object.freeze({instanceId:context.identity.instanceId});}`;

const deliveryFactorySource = `export function create(context){
const config=context.configuration;const kinds=Object.freeze({"delivery.pattern.spiral":"spiral","delivery.pattern.fan":"fan","delivery.pattern.aimed":"aimed","delivery.pattern.wave":"wave","delivery.pattern.rain":"rain","delivery.pattern.rotating-ring":"rotatingRing","delivery.pattern.burst":"burst"});const kind=kinds[context.identity.moduleId];if(!kind)throw new Error("unknown hostile pattern delivery");
const centeredOrder=count=>{const result=[];if(count%2===1)result.push(0);for(let step=0;result.length<count;step+=1){const offset=count%2===1?step+1:step+.5;result.push(-offset);if(result.length<count)result.push(offset);}return result;};
const finite=field=>{const value=config[field];if(typeof value!=="number"||!Number.isFinite(value))throw new Error("invalid hostile formation field: "+field);return value;};
const fanAngles=(center,arc,count)=>{if(count===1)return[center];if(Math.abs(arc-Math.PI*2)<=1e-12)return centeredOrder(count).map(offset=>center+offset*arc/count);const step=arc/(count-1);return centeredOrder(count).map(offset=>center+offset*step);};
const plan=(targeted)=>{const degrees=value=>value*Math.PI/180;let center=Math.atan2(targeted.direction.y,targeted.direction.x);let angles;if(kind==="spiral"){center+=targeted.emissionIndex*degrees(finite("rotationStepDegrees"));angles=Array.from({length:config.count},(_,index)=>center+index*Math.PI*2/config.count);}else if(kind==="fan")angles=fanAngles(center,degrees(finite("arcDegrees")),config.count);else if(kind==="aimed")angles=fanAngles(center,degrees(finite("aimSpreadDegrees")),config.count);else if(kind==="wave"){const spread=degrees(finite("waveSpreadDegrees"));center+=Math.sin(targeted.emissionIndex*degrees(finite("phaseStepDegrees")))*spread/2;angles=fanAngles(center,spread,config.count);}else if(kind==="rain"){const downward=config.downwardBaseDirection;const magnitude=Math.hypot(downward.x,downward.y);if(!Number.isFinite(magnitude)||magnitude<=0)throw new Error("invalid hostile rain direction");center=Math.atan2(downward.y/magnitude,downward.x/magnitude);angles=fanAngles(center,degrees(finite("spreadDegrees")),config.count);}else if(kind==="rotatingRing"){center+=targeted.emissionIndex*degrees(finite("ringRotationStepDegrees"));angles=Array.from({length:config.count},(_,index)=>center+index*Math.PI*2/config.count);}else angles=fanAngles(center,degrees(finite("burstSpreadDegrees")),config.count);return Object.freeze(angles.map(angle=>Object.freeze({position:targeted.sourcePosition,velocity:Object.freeze({x:Math.cos(angle)*config.speed,y:Math.sin(angle)*config.speed}),damage:config.damage})));};
const active=[];let emitted=0;let observedLineage;
context.ports.declareHandler("targeted",targeted=>{if(targeted.attackChannelId!==config.attackChannelId)throw new Error("hostile delivery channel mismatch");const lineageId="hostile."+targeted.rootChannelId+"."+targeted.attackChannelId;observedLineage=lineageId;const textureKey=context.assets.requireTexture(config.textureRole);const plans=plan(targeted).map(value=>Object.freeze({...value,textureKey}));const result=context.services.hostileProjectileDelivery.admit(lineageId,Object.freeze({requestSequence:targeted.sequence,plans}));if(result.activated.length===0)context.ports.emitEvent("emission",Object.freeze({targeted,projectile:null,final:true}));for(let index=0;index<result.activated.length;index+=1){const projectile=result.activated[index];const spawn=plans[index];active.push({lineageId,reference:projectile,position:{...spawn.position},velocity:spawn.velocity});context.ports.emitEvent("emission",Object.freeze({targeted,projectile:Object.freeze({projectileEntityId:projectile.projectileEntityId,projectileChannelId:projectile.projectileChannelId,projectileGeneration:projectile.projectileGeneration,position:spawn.position,velocity:spawn.velocity,damage:spawn.damage}),final:index===result.activated.length-1}));emitted++;}});
const recycleAll=()=>{for(const record of active.splice(0).reverse())context.services.hostileProjectileDelivery.recycle(record.lineageId,record.reference);};
return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.assets.requireTexture(config.textureRole);context.ports.publishState("projectiles",Object.freeze({revision:0,emittedAtMs:context.clock.nowMs(),channelId:context.identity.instanceId+".projectiles",ownerInstanceId:context.identity.instanceId,ownerActorId:context.identity.ownerId,entityRole:"projectile",generation:0}));context.services.observation.register("hostile-delivery",()=>Object.freeze({...(observedLineage?context.services.hostileProjectileDelivery.observe(observedLineage):{}),emitted,active:active.length}));},update(deltaMs){if(!Number.isFinite(deltaMs)||deltaMs<0)throw new Error("invalid hostile delivery delta");const viewport=context.services.viewport.read();for(let index=active.length-1;index>=0;index-=1){const record=active[index];record.position.x+=record.velocity.x*deltaMs/1000;record.position.y+=record.velocity.y*deltaMs/1000;const margin=config.recycleMargin;if(record.position.x < -margin||record.position.x > viewport.width+margin||record.position.y < -margin||record.position.y > viewport.height+margin){context.services.hostileProjectileDelivery.recycle(record.lineageId,record.reference);active.splice(index,1);}}},stop(){recycleAll();},dispose(){active.splice(0);}});}`;

const bossReservation: CanonicalResourceReservationDescriptorV11 = {
  descriptorVersion: "1.1.0",
  reservationId: "encounter.boss-phases.maximum-reachable",
  strategy: "maximum-reachable-v1",
  fields: [
    {
      resource: "activeEntities",
      formula: { kind: "configuration-field", field: "maximumBosses" },
    },
    { resource: "activeProjectiles", formula: { kind: "constant", value: 0 } },
    { resource: "spawnsPerSecond", formula: { kind: "constant", value: 1 } },
    { resource: "timers", formula: { kind: "constant", value: 0 } },
  ],
};
const zeroReservation: CanonicalResourceReservationDescriptorV11 = {
  descriptorVersion: "1.0.0",
  reservationId: "batch3.encounter-hostile.zero",
  strategy: "constant",
  fields: [],
};
const deliveryReservation: CanonicalResourceReservationDescriptorV11 = {
  descriptorVersion: "1.1.0",
  reservationId: "delivery.pattern.hostile.maximum-reachable",
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
};

function definition(
  manifest: GameModuleManifestV14,
  configurationSchema: z.ZodType<Record<string, unknown>>,
  reservationDescriptor: CanonicalResourceReservationDescriptorV11,
  implementationSource: string,
): Batch3HostileSliceDefinition {
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
    reservationDescriptor,
    reservationEvaluator(configuration: unknown): ModuleResourceBudget {
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

const deliveryDefinitions = [
  ["delivery.pattern.spiral", "spiral"],
  ["delivery.pattern.fan", "fan"],
  ["delivery.pattern.aimed", "aimed"],
  ["delivery.pattern.wave", "wave"],
  ["delivery.pattern.rain", "rain"],
  ["delivery.pattern.rotating-ring", "rotatingRing"],
  ["delivery.pattern.burst", "burst"],
] as const;

export const BATCH3_ENCOUNTER_HOSTILE_DEFINITIONS = Object.freeze([
  definition(
    bossManifest,
    bossConfiguration as z.ZodType<Record<string, unknown>>,
    bossReservation,
    bossFactorySource,
  ),
  definition(
    aimedManifest,
    aimedConfiguration as z.ZodType<Record<string, unknown>>,
    zeroReservation,
    aimedFactorySource,
  ),
  ...deliveryDefinitions.map(([moduleId, patternKey]) =>
    definition(
      deliveryManifest(moduleId, patternKey),
      deliverySchemas[patternKey],
      deliveryReservation,
      deliveryFactorySource,
    ),
  ),
]);

const lockIdentity = new TextEncoder().encode(
  "pnpm-lock.batch3.encounter-hostile.v1",
);
const toolchainIdentity = new TextEncoder().encode(
  "typescript-5.9.3.esm-self-contained.batch3.encounter-hostile.v1",
);

export async function registerBatch3EncounterHostileDefinitions(
  registry: GameModuleRegistry,
): Promise<void> {
  const loader = new TrustedGameModuleExecutableLoader();
  for (const item of BATCH3_ENCOUNTER_HOSTILE_DEFINITIONS) {
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

export async function createBatch3EncounterHostileRegistry(): Promise<GameModuleRegistry> {
  const registry = new GameModuleRegistry();
  await registerBatch3HostileSliceDefinitions(registry);
  await registerBatch3EncounterHostileDefinitions(registry);
  return registry;
}
