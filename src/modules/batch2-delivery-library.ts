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

export type Batch2DeliveryFormationKind =
  | "spread"
  | "multi-shot"
  | "radial"
  | "spiral"
  | "fan"
  | "aimed"
  | "wave"
  | "rain"
  | "rotatingRing"
  | "burst";

export type Batch2DeliverySpawnPlan = Readonly<{
  angleRadians: number;
  direction: Readonly<{ x: number; y: number }>;
  lateralOffset: Readonly<{ x: number; y: number }>;
}>;

export type Batch2DeliveryPlannerInput = Readonly<{
  kind: Batch2DeliveryFormationKind;
  count: number;
  targetDirection: Readonly<{ x: number; y: number }>;
  emissionIndex: number;
  configuration: Readonly<Record<string, unknown>>;
}>;

function finiteNumber(
  configuration: Readonly<Record<string, unknown>>,
  field: string,
): number {
  const value = configuration[field];
  if (typeof value !== "number" || !Number.isFinite(value))
    throw new Error(`invalid formation field: ${field}`);
  return value;
}

function centeredOrder(count: number): number[] {
  const result: number[] = [];
  if (count % 2 === 1) result.push(0);
  for (let step = 0; result.length < count; step += 1) {
    const offset = count % 2 === 1 ? step + 1 : step + 0.5;
    result.push(-offset);
    if (result.length < count) result.push(offset);
  }
  return result;
}

function fanAngles(center: number, arc: number, count: number): number[] {
  if (count === 1) return [center];
  if (Math.abs(arc - Math.PI * 2) <= 1e-12)
    return centeredOrder(count).map(
      (offset) => center + (offset * arc) / count,
    );
  const step = arc / (count - 1);
  return centeredOrder(count).map((offset) => center + offset * step);
}

/**
 * One reviewed, side-effect-free geometry planner used by every Batch 2
 * delivery adapter. It never performs admission, allocation, or entity access.
 */
export function planBatch2DeliveryFormation(
  input: Batch2DeliveryPlannerInput,
): readonly Batch2DeliverySpawnPlan[] {
  if (!Number.isSafeInteger(input.count) || input.count < 1)
    throw new Error("formation count must be a positive safe integer");
  if (!Number.isSafeInteger(input.emissionIndex) || input.emissionIndex < 0)
    throw new Error("emission index must be a non-negative safe integer");
  const magnitude = Math.hypot(
    input.targetDirection.x,
    input.targetDirection.y,
  );
  if (!Number.isFinite(magnitude) || Math.abs(magnitude - 1) > 1e-6)
    throw new Error("target direction must be normalized");
  const degrees = (value: number): number => (value * Math.PI) / 180;
  let center = Math.atan2(input.targetDirection.y, input.targetDirection.x);
  let angles: number[];
  let lateralSpacing = 0;

  switch (input.kind) {
    case "spread":
      angles = fanAngles(
        center,
        degrees(finiteNumber(input.configuration, "totalArcDegrees")),
        input.count,
      );
      break;
    case "multi-shot":
      lateralSpacing = finiteNumber(input.configuration, "lateralSpacing");
      angles = Array.from({ length: input.count }, () => center);
      break;
    case "radial":
      center += degrees(
        finiteNumber(input.configuration, "baseAngleOffsetDegrees"),
      );
      angles = Array.from(
        { length: input.count },
        (_, index) => center + (index * Math.PI * 2) / input.count,
      );
      break;
    case "spiral":
      center +=
        input.emissionIndex *
        degrees(finiteNumber(input.configuration, "rotationStepDegrees"));
      angles = Array.from(
        { length: input.count },
        (_, index) => center + (index * Math.PI * 2) / input.count,
      );
      break;
    case "fan":
      angles = fanAngles(
        center,
        degrees(finiteNumber(input.configuration, "arcDegrees")),
        input.count,
      );
      break;
    case "aimed":
      angles = fanAngles(
        center,
        degrees(finiteNumber(input.configuration, "aimSpreadDegrees")),
        input.count,
      );
      break;
    case "wave": {
      const spread = degrees(
        finiteNumber(input.configuration, "waveSpreadDegrees"),
      );
      const phase =
        input.emissionIndex *
        degrees(finiteNumber(input.configuration, "phaseStepDegrees"));
      center += Math.sin(phase) * (spread / 2);
      angles = fanAngles(center, spread, input.count);
      break;
    }
    case "rain": {
      const downward = input.configuration.downwardBaseDirection as
        { x?: unknown; y?: unknown } | undefined;
      const x = downward?.x;
      const y = downward?.y;
      const downwardMagnitude =
        typeof x === "number" && typeof y === "number"
          ? Math.hypot(x, y)
          : Number.NaN;
      if (
        !Number.isFinite(downwardMagnitude) ||
        downwardMagnitude <= 0 ||
        typeof x !== "number" ||
        typeof y !== "number"
      )
        throw new Error("invalid rain downward direction");
      center = Math.atan2(y / downwardMagnitude, x / downwardMagnitude);
      angles = fanAngles(
        center,
        degrees(finiteNumber(input.configuration, "spreadDegrees")),
        input.count,
      );
      break;
    }
    case "rotatingRing":
      center +=
        input.emissionIndex *
        degrees(finiteNumber(input.configuration, "ringRotationStepDegrees"));
      angles = Array.from(
        { length: input.count },
        (_, index) => center + (index * Math.PI * 2) / input.count,
      );
      break;
    case "burst":
      angles = fanAngles(
        center,
        degrees(finiteNumber(input.configuration, "burstSpreadDegrees")),
        input.count,
      );
      break;
  }

  const offsets = centeredOrder(input.count);
  return Object.freeze(
    angles.map((angleRadians, index) =>
      Object.freeze({
        angleRadians,
        direction: Object.freeze({
          x: Math.cos(angleRadians),
          y: Math.sin(angleRadians),
        }),
        lateralOffset: Object.freeze({
          x: -Math.sin(center) * offsets[index]! * lateralSpacing,
          y: Math.cos(center) * offsets[index]! * lateralSpacing,
        }),
      }),
    ),
  );
}

const logicalId = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/);
const commonConfigurationShape = {
  attackChannelId: logicalId,
  baseCount: z.number().int().min(1).max(64),
  speed: z.number().finite().min(1).max(2_000),
  baseDamage: z.number().finite().positive().max(100_000),
  textureRole: z.literal("player-projectile"),
  spawnOffset: z.strictObject({
    x: z.number().finite().min(-256).max(256),
    y: z.number().finite().min(-256).max(256),
  }),
  maxActive: z.number().int().min(1).max(256),
  maximumAcceptedRequestsPerSecond: z.number().int().min(1).max(20),
  maximumCountBonus: z.number().int().min(0).max(64),
  maximumDamageMultiplier: z.number().finite().min(1).max(16),
  recycleMargin: z.number().finite().min(0).max(256),
  exhaustionPolicy: z.literal("drop-and-observe"),
};

function deliveryConfiguration(
  specific: z.ZodRawShape,
): z.ZodType<Record<string, unknown>> {
  return z
    .strictObject({ ...commonConfigurationShape, ...specific })
    .superRefine((configuration, context) => {
      if (
        configuration.baseCount + configuration.maximumCountBonus >
        configuration.maxActive
      )
        context.addIssue({
          code: "custom",
          message: "maximum effective count exceeds maxActive",
          path: ["maximumCountBonus"],
        });
      const maximumSpawns =
        configuration.maximumAcceptedRequestsPerSecond *
        (configuration.baseCount + configuration.maximumCountBonus);
      if (!Number.isSafeInteger(maximumSpawns) || maximumSpawns > 10_000)
        context.addIssue({
          code: "custom",
          message: "maximum reachable spawn reservation is unsafe",
          path: ["maximumAcceptedRequestsPerSecond"],
        });
    }) as z.ZodType<Record<string, unknown>>;
}

const schemas = {
  spread: deliveryConfiguration({
    totalArcDegrees: z.number().finite().min(0).max(360),
    centeredOrdering: z.literal(true),
  }),
  multiShot: deliveryConfiguration({
    lateralSpacing: z.number().finite().min(0).max(256),
  }),
  radial: deliveryConfiguration({
    baseAngleOffsetDegrees: z.number().finite().min(-360).max(360),
  }),
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
    downwardBaseDirection: z
      .strictObject({
        x: z.number().finite().min(-1).max(1),
        y: z.number().finite().min(0.000001).max(1),
      })
      .refine(({ x, y }) => Math.hypot(x, y) > 0, "direction must be non-zero"),
  }),
  rotatingRing: deliveryConfiguration({
    ringRotationStepDegrees: z.number().finite().min(-360).max(360),
  }),
  burst: deliveryConfiguration({
    burstSpreadDegrees: z.number().finite().min(0).max(180),
    emissionIndexMode: z.literal("stable-request-sequence"),
  }),
} as const;

const zeroAuthorization = Object.freeze({
  ownerRelation: "same-owner",
  sourceActorRoles: Object.freeze(["player", "enemy", "boss"]),
  targetActorRoles: Object.freeze(["player", "enemy", "boss"]),
  sourceEntityRoles: Object.freeze([]),
});

const maximumReachableReservation: CanonicalResourceReservationDescriptorV11 = {
  descriptorVersion: "1.1.0",
  reservationId: "delivery.maximum-reachable",
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
        sumFields: ["baseCount", "maximumCountBonus"],
      },
    },
    { resource: "timers", formula: { kind: "constant", value: 0 } },
  ],
};

function deliveryManifest(
  moduleId: string,
  specificCapability: string,
): GameModuleManifestV13 {
  return GameModuleManifestV13Schema.parse({
    schemaVersion: "1.3.0",
    moduleId,
    version: "1.0.0",
    kind: "attack-delivery",
    implementationId: `${moduleId}.v1`,
    configurationSchemaId: `${moduleId}.config`,
    kernelVersionRange: "^1.0.0",
    engine: { id: "phaser", versionRange: "^3.90.0" },
    provides: [
      { id: specificCapability, version: "1.0.0", scope: "owner" },
      { id: "delivery.projectile", version: "1.0.0", scope: "owner" },
      {
        id: "delivery.projectile-channel",
        version: "1.0.0",
        scope: "assembly",
      },
    ],
    requires: [
      {
        id: "targeting.solution-v2",
        versionRange: "^1.0.0",
        cardinality: "exactly-one",
        scope: "owner",
      },
      {
        id: "trigger.attack-v2",
        versionRange: "^1.0.0",
        cardinality: "exactly-one",
        scope: "owner",
      },
    ],
    inputPorts: [
      {
        id: "target",
        payloadType: "target-solution-v1",
        required: true,
        multiple: false,
        delivery: "state",
        authorization: zeroAuthorization,
      },
      {
        id: "request",
        payloadType: "attack-request-v2",
        required: true,
        multiple: false,
        delivery: "event",
        authorization: zeroAuthorization,
      },
      {
        id: "modifier",
        payloadType: "modifier-application-v1",
        required: false,
        multiple: true,
        delivery: "event",
        authorization: zeroAuthorization,
      },
    ],
    outputPorts: [
      {
        id: "projectiles",
        payloadType: "entity-channel-v1",
        delivery: "state",
        entityRole: "projectile",
      },
      { id: "emission", payloadType: "emission-v1", delivery: "event" },
      {
        id: "modifier-state",
        payloadType: "modifier-state-v1",
        delivery: "state",
      },
    ],
    dependencies: [],
    assetRequirements: [
      {
        roleId: "player-projectile",
        category: "projectile",
        cardinality: "exactly-one",
        sharing: "instance",
      },
    ],
    conflicts: [],
    exclusiveOwnership: [`${moduleId}.channel`],
    cardinality: {
      maximumInstancesPerAssembly: 128,
      maximumInstancesPerOwner: 16,
    },
    resources: {
      activeEntities: 256,
      activeProjectiles: 256,
      spawnsPerSecond: 2_560,
      timers: 0,
    },
    runtimeLeases: { startLeases: 4, instanceLeases: 6, graphLeases: 0 },
    runtimeContract: {
      update: { mode: "graph-frame-v1", registrationId: "delivery.update" },
      timerSlots: { slotGroupId: "main" },
      inputRegistrations: [],
      observationReaders: [{ readerId: "delivery" }],
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
          poolId: "projectiles.pool",
          entityRole: "projectile",
          capacityResource: "activeEntities",
          projectileResource: "activeProjectiles",
        },
      },
    ],
    browserSupport: { desktop: true, touch: true },
    evidence: {
      provenanceId: "agent.batch2.reviewed",
      testSuiteId: "modules.batch2.delivery-library",
    },
    actorSnapshotReads: [],
    entityChannelReads: [],
    projectileChannelConsumer: null,
    attackChannel: {
      role: "delivery",
      configurationField: "attackChannelId",
      targetInputPort: "target",
      targetPayloadType: "target-solution-v1",
      requestInputPort: "request",
      requestPayloadType: "attack-request-v2",
    },
    preparedEffectCommit: null,
    projectileDelivery: {
      capability: "delivery.projectile@1.0.0",
      channelId: "projectiles",
      entityRole: "projectile",
      capacityResources: ["activeEntities", "activeProjectiles"],
    },
    modifierTargets: [
      {
        fieldId: "attack.damage.multiplier",
        inputPort: "modifier",
        operation: "add",
        minimum: 0,
        maximum: 15,
        reset: "dispose-new-graph",
      },
      {
        fieldId: "attack.projectile-count.bonus",
        inputPort: "modifier",
        operation: "add",
        minimum: 0,
        maximum: 64,
        reset: "dispose-new-graph",
      },
    ],
    pickupEffectPlanTransform: null,
  });
}

const deliveryFactorySource = `export function create(context){
const config=context.configuration;
const moduleKinds=Object.freeze({"delivery.spread":"spread","delivery.multi-shot":"multi-shot","delivery.pattern.radial":"radial","delivery.pattern.spiral":"spiral","delivery.pattern.fan":"fan","delivery.pattern.aimed":"aimed","delivery.pattern.wave":"wave","delivery.pattern.rain":"rain","delivery.pattern.rotating-ring":"rotatingRing","delivery.pattern.burst":"burst"});
const kind=moduleKinds[context.identity.moduleId];if(!kind)throw new Error("unknown delivery formation");
const centeredOrder=count=>{const result=[];if(count%2===1)result.push(0);for(let step=0;result.length<count;step+=1){const offset=count%2===1?step+1:step+.5;result.push(-offset);if(result.length<count)result.push(offset);}return result;};
const finite=field=>{const value=config[field];if(typeof value!=="number"||!Number.isFinite(value))throw new Error("invalid formation field: "+field);return value;};
const fanAngles=(center,arc,count)=>{if(count===1)return[center];if(Math.abs(arc-Math.PI*2)<=1e-12)return centeredOrder(count).map(offset=>center+offset*arc/count);const step=arc/(count-1);return centeredOrder(count).map(offset=>center+offset*step);};
const planFormation=(count,targetDirection,emissionIndex)=>{const degrees=value=>value*Math.PI/180;let center=Math.atan2(targetDirection.y,targetDirection.x);let angles;let spacing=0;if(kind==="spread")angles=fanAngles(center,degrees(finite("totalArcDegrees")),count);else if(kind==="multi-shot"){spacing=finite("lateralSpacing");angles=Array.from({length:count},()=>center);}else if(kind==="radial"){center+=degrees(finite("baseAngleOffsetDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else if(kind==="spiral"){center+=emissionIndex*degrees(finite("rotationStepDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else if(kind==="fan")angles=fanAngles(center,degrees(finite("arcDegrees")),count);else if(kind==="aimed")angles=fanAngles(center,degrees(finite("aimSpreadDegrees")),count);else if(kind==="wave"){const spread=degrees(finite("waveSpreadDegrees"));center+=Math.sin(emissionIndex*degrees(finite("phaseStepDegrees")))*spread/2;angles=fanAngles(center,spread,count);}else if(kind==="rain"){const downward=config.downwardBaseDirection;const magnitude=Math.hypot(downward.x,downward.y);if(!Number.isFinite(magnitude)||magnitude<=0)throw new Error("invalid rain direction");center=Math.atan2(downward.y/magnitude,downward.x/magnitude);angles=fanAngles(center,degrees(finite("spreadDegrees")),count);}else if(kind==="rotatingRing"){center+=emissionIndex*degrees(finite("ringRotationStepDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else angles=fanAngles(center,degrees(finite("burstSpreadDegrees")),count);const offsets=centeredOrder(count);return Object.freeze(angles.map((angle,index)=>Object.freeze({direction:Object.freeze({x:Math.cos(angle),y:Math.sin(angle)}),lateralOffset:Object.freeze({x:-Math.sin(center)*offsets[index]*spacing,y:Math.cos(center)*offsets[index]*spacing})})));};
let target;let emissionIndex=0;let emissionSequence=0;let modifierRevision=0;let damageBonus=0;let countBonus=0;const active=[];
const publishModifier=(fieldId,current,maximum)=>context.ports.publishState("modifier-state",Object.freeze({revision:modifierRevision++,emittedAtMs:context.clock.nowMs(),fieldId,current,minimum:0,maximum}));
context.ports.declareHandler("target",value=>{if(value.attackChannelId!==config.attackChannelId)throw new Error("target channel mismatch");const magnitude=Math.hypot(value.direction.x,value.direction.y);if(!Number.isFinite(magnitude)||Math.abs(magnitude-1)>1e-6)throw new Error("invalid target direction");target=Object.freeze({x:value.direction.x,y:value.direction.y});});
const applyModifier=value=>{if(value.targetInstanceId!==context.identity.instanceId||value.operation!=="add"||!Number.isFinite(value.value)||value.value<=0)throw new Error("invalid delivery modifier application");if(value.fieldId==="attack.damage.multiplier"){damageBonus=Math.min(config.maximumDamageMultiplier-1,damageBonus+value.value);publishModifier(value.fieldId,damageBonus,config.maximumDamageMultiplier-1);return;}if(value.fieldId==="attack.projectile-count.bonus"){if(!Number.isSafeInteger(value.value))throw new Error("projectile count bonus must be an integer");countBonus=Math.min(config.maximumCountBonus,countBonus+value.value);publishModifier(value.fieldId,countBonus,config.maximumCountBonus);return;}throw new Error("unknown delivery modifier target");};
context.ports.declareAddressedHandler("attack.damage.multiplier",applyModifier);
context.ports.declareAddressedHandler("attack.projectile-count.bonus",applyModifier);
context.ports.declareHandler("request",request=>{if(request.attackChannelId!==config.attackChannelId)throw new Error("request channel mismatch");if(!target)throw new Error("attack before target solution");if(emissionIndex>=Number.MAX_SAFE_INTEGER)throw new Error("delivery emission index exhausted");const now=context.clock.nowMs();const effectiveCount=config.baseCount+Math.min(countBonus,config.maximumCountBonus);const effectiveDamage=config.baseDamage*Math.min(1+damageBonus,config.maximumDamageMultiplier);const owner=context.services.actors.readOwner();if(!owner||owner.active!==true)throw new Error("inactive projectile owner");const textureKey=context.assets.requireTexture(config.textureRole);const requestPlan=planFormation(effectiveCount,target,emissionIndex++).map(spawn=>{const position=Object.freeze({x:owner.position.x+config.spawnOffset.x+spawn.lateralOffset.x,y:owner.position.y+config.spawnOffset.y+spawn.lateralOffset.y});const velocity=Object.freeze({x:spawn.direction.x*config.speed,y:spawn.direction.y*config.speed});return Object.freeze({position,velocity,damage:effectiveDamage,textureKey});});const result=context.services.projectileDelivery.admit(request.sequence,requestPlan);if(!result.accepted)return;if(result.activated.length>Number.MAX_SAFE_INTEGER-emissionSequence)throw new Error("delivery emission sequence block exhausted");for(let index=0;index<result.activated.length;index+=1){const reference=result.activated[index];const spawn=requestPlan[index];active.push({reference,position:{x:spawn.position.x,y:spawn.position.y},velocity:spawn.velocity});context.ports.emitEvent("emission",Object.freeze({sequence:emissionSequence++,emittedAtMs:now,entityId:reference.entityId,channelId:reference.channelId,ownerActorId:reference.ownerActorId,position:spawn.position,velocity:spawn.velocity,damage:effectiveDamage,generation:reference.generation}));}});
const recycleAll=()=>{active.splice(0);};
return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.assets.requireTexture(config.textureRole);context.ports.publishState("projectiles",Object.freeze({revision:0,emittedAtMs:context.clock.nowMs(),channelId:context.identity.instanceId+".projectiles",ownerInstanceId:context.identity.instanceId,ownerActorId:context.identity.ownerId,entityRole:"projectile",generation:0}));publishModifier("attack.damage.multiplier",0,config.maximumDamageMultiplier-1);publishModifier("attack.projectile-count.bonus",0,config.maximumCountBonus);context.services.observation.register("delivery",()=>({...context.services.projectileDelivery.observe(),emissionIndex,damageBonus,countBonus}));},update(deltaMs){if(!Number.isFinite(deltaMs)||deltaMs<0)throw new Error("invalid delivery delta");const viewport=context.services.viewport.read();for(let index=active.length-1;index>=0;index-=1){const record=active[index];record.position.x+=record.velocity.x*deltaMs/1000;record.position.y+=record.velocity.y*deltaMs/1000;const margin=config.recycleMargin;if(record.position.x < -margin||record.position.x > viewport.width+margin||record.position.y < -margin||record.position.y > viewport.height+margin){context.services.projectileDelivery.recycle(record.reference);active.splice(index,1);}}},stop(){recycleAll();},dispose(){recycleAll();target=undefined;damageBonus=0;countBonus=0;}});}`;

export type Batch2DeliveryDefinition = Readonly<{
  manifest: GameModuleManifestV13;
  configurationSchema: z.ZodType<Record<string, unknown>>;
  configurationDescriptor: CanonicalConfigurationDescriptor;
  reservationDescriptor: CanonicalResourceReservationDescriptorV11;
  reservationEvaluator(configuration: unknown): ModuleResourceBudget;
  implementationSource: string;
  exportName: "create";
  exportKind: "lifecycle-create-v1";
}>;

function definition(
  manifest: GameModuleManifestV13,
  configurationSchema: z.ZodType<Record<string, unknown>>,
): Batch2DeliveryDefinition {
  const configurationDescriptor = Object.freeze({
    descriptorVersion: "1.0.0" as const,
    schemaId: manifest.configurationSchemaId,
    dialect: "json-schema-2020-12-subset" as const,
    schema: Object.freeze({ type: "object", additionalProperties: false }),
  });
  return Object.freeze({
    manifest,
    configurationSchema,
    configurationDescriptor,
    reservationDescriptor: maximumReachableReservation,
    reservationEvaluator(configuration: unknown) {
      const parsed = configurationSchema.parse(configuration);
      return evaluateCanonicalResourceReservationV11(
        maximumReachableReservation,
        parsed,
      );
    },
    implementationSource: deliveryFactorySource,
    exportName: "create",
    exportKind: "lifecycle-create-v1",
  });
}

export const BATCH2_DELIVERY_DEFINITIONS = Object.freeze([
  definition(
    deliveryManifest("delivery.spread", "delivery.spread"),
    schemas.spread,
  ),
  definition(
    deliveryManifest("delivery.multi-shot", "delivery.multi-shot"),
    schemas.multiShot,
  ),
  definition(
    deliveryManifest("delivery.pattern.radial", "delivery.pattern.radial"),
    schemas.radial,
  ),
  definition(
    deliveryManifest("delivery.pattern.spiral", "delivery.pattern.spiral"),
    schemas.spiral,
  ),
  definition(
    deliveryManifest("delivery.pattern.fan", "delivery.pattern.fan"),
    schemas.fan,
  ),
  definition(
    deliveryManifest("delivery.pattern.aimed", "delivery.pattern.aimed"),
    schemas.aimed,
  ),
  definition(
    deliveryManifest("delivery.pattern.wave", "delivery.pattern.wave"),
    schemas.wave,
  ),
  definition(
    deliveryManifest("delivery.pattern.rain", "delivery.pattern.rain"),
    schemas.rain,
  ),
  definition(
    deliveryManifest(
      "delivery.pattern.rotating-ring",
      "delivery.pattern.rotating-ring",
    ),
    schemas.rotatingRing,
  ),
  definition(
    deliveryManifest("delivery.pattern.burst", "delivery.pattern.burst"),
    schemas.burst,
  ),
]);

const lockIdentity = new TextEncoder().encode("pnpm-lock.batch2.delivery.v1");
const toolchainIdentity = new TextEncoder().encode(
  "typescript-5.9.3.esm-self-contained.batch2.delivery.v1",
);

export async function registerBatch2DeliveryDefinitions(
  registry: GameModuleRegistry,
): Promise<void> {
  const loader = new TrustedGameModuleExecutableLoader();
  for (const item of BATCH2_DELIVERY_DEFINITIONS) {
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

export async function createBatch2DeliveryRegistry(): Promise<GameModuleRegistry> {
  const registry = new GameModuleRegistry();
  await registerBatch2DeliveryDefinitions(registry);
  return registry;
}
