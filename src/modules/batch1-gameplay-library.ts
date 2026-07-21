import { createHash } from "node:crypto";

import { z } from "zod";

import {
  GameModuleManifestV12Schema,
  type GameModuleManifestV12,
  type ModuleResourceBudget,
} from "./game-module-contract.js";
import {
  computeContactPolicyChainProfileEvidenceHash,
  createModuleArtifactHashDescriptor,
  type CanonicalConfigurationDescriptor,
  type CanonicalResourceReservationDescriptor,
  type ContactPolicyChainProfile,
} from "./game-module-execution-contract.js";
import { TrustedGameModuleExecutableLoader } from "./game-module-executable-loader.js";
import { GameModuleRegistry } from "./game-module-registry.js";

const zeroBudget = Object.freeze({
  activeEntities: 0,
  activeProjectiles: 0,
  spawnsPerSecond: 0,
  timers: 0,
});
const samePlayer = Object.freeze({
  ownerRelation: "same-owner",
  sourceActorRoles: Object.freeze(["player"]),
  targetActorRoles: Object.freeze(["player"]),
  sourceEntityRoles: Object.freeze([]),
});
const sameEnemy = Object.freeze({
  ownerRelation: "same-owner",
  sourceActorRoles: Object.freeze(["enemy"]),
  targetActorRoles: Object.freeze(["enemy"]),
  sourceEntityRoles: Object.freeze([]),
});
const playerToEnemyProjectile = Object.freeze({
  ownerRelation: "different-owner",
  sourceActorRoles: Object.freeze(["player"]),
  targetActorRoles: Object.freeze(["enemy"]),
  sourceEntityRoles: Object.freeze(["projectile"]),
});

function baseManifest(
  moduleId: string,
  kind: GameModuleManifestV12["kind"],
  overrides: Record<string, unknown>,
): GameModuleManifestV12 {
  return GameModuleManifestV12Schema.parse({
    schemaVersion: "1.2.0",
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
      maximumInstancesPerAssembly: 16,
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
      provenanceId: "agent.batch1.reviewed",
      testSuiteId: "modules.batch1.vertical-slice",
    },
    ...overrides,
  });
}

const KeyboardConfigurationSchema = z.strictObject({
  bindings: z.literal("arrows-and-wasd"),
  normalizeDiagonal: z.literal(true),
  emitNeutral: z.literal(true),
});
const TouchConfigurationSchema = z.strictObject({
  capture: z.literal("first-active"),
  release: z.literal("matching-pointer-up"),
  emitOnDown: z.literal(false),
});
const ArbiterConfigurationSchema = z.strictObject({
  policy: z.literal("touch-while-active-else-keyboard"),
  keyboardSourceId: z.string().min(1),
  touchSourceId: z.string().min(1),
});
const LocomotionConfigurationSchema = z
  .strictObject({
    moveSpeed: z.number().finite().min(50).max(2000),
    bounds: z.strictObject({
      left: z.number().finite().min(0).max(256),
      right: z.number().finite().min(0).max(256),
      top: z.number().finite().min(0).max(256),
      bottom: z.number().finite().min(0).max(256),
    }),
    absoluteMode: z.literal("clamp"),
    neutralMode: z.literal("zero-velocity"),
  })
  .refine(
    ({ bounds }) =>
      bounds.left + bounds.right < 720 && bounds.top + bounds.bottom < 720,
    "bounds must retain a positive play area",
  );
const TargetConfigurationSchema = z.strictObject({
  angleDegrees: z.literal(-90),
});
const TriggerConfigurationSchema = z.strictObject({
  intervalMs: z.number().int().min(50).max(10_000),
  firstEmission: z.literal("after-interval"),
});
const DeliveryConfigurationSchema = z.strictObject({
  speed: z.number().finite().min(100).max(2000),
  damage: z.number().finite().positive().max(100_000),
  textureRole: z.literal("player-projectile"),
  spawnOffset: z.strictObject({
    x: z.number().finite().min(-256).max(256),
    y: z.number().finite().min(-256).max(256),
  }),
  maxActive: z.number().int().min(1).max(256),
  maximumSpawnRate: z.number().int().min(1).max(20),
  recycleMargin: z.number().finite().min(0).max(256),
  poolExhaustion: z.literal("drop-and-observe"),
});
const HealthConfigurationSchema = z
  .strictObject({
    maxHealth: z.number().finite().positive().max(100_000),
    initialHealth: z.number().finite().positive().max(100_000),
    damageFloor: z.literal(0),
  })
  .refine(({ maxHealth, initialHealth }) => initialHealth <= maxHealth, {
    message: "initialHealth cannot exceed maxHealth",
    path: ["initialHealth"],
  });
const ContactConfigurationSchema = z.strictObject({
  sourceEntityRole: z.literal("projectile"),
  targetActorRole: z.literal("enemy"),
  maximumTrackedContacts: z.number().int().min(1).max(4096),
});
const DefaultDamageConfigurationSchema = z.strictObject({
  damageKind: z.literal("projectile"),
  defaultDisposition: z.literal("damage"),
  defaultSourceOperation: z.literal("consume"),
});
const ResolutionConfigurationSchema = z.strictObject({
  policyProfileId: z.literal("batch1.default-damage"),
  policyProfileVersion: z.literal("1.0.0"),
  allowedDispositions: z.tuple([z.literal("damage")]),
  allowedSourceOperations: z.tuple([z.literal("consume")]),
  maxResolvedContacts: z.number().int().min(1).max(4096),
});

const createSources = Object.freeze({
  keyboard: `export function create(context) {
    let direction = Object.freeze({x:0,y:0}); let sequence = 0; let remove; let disposed = false;
    context.ports.declareHandler;
    return Object.freeze({instanceId:context.identity.instanceId,
      initialize(){ context.services.observation.register("movement",()=>({sequence,direction})); },
      start(){ remove=context.services.input.register("keyboard.direction", value=>{ if(!value||!Number.isFinite(value.x)||!Number.isFinite(value.y)) throw new Error("invalid keyboard direction"); const length=Math.hypot(value.x,value.y); direction=Object.freeze(length===0?{x:0,y:0}:{x:value.x/length,y:value.y/length}); }); },
      update(){ if(disposed) throw new Error("keyboard disposed"); const active=direction.x!==0||direction.y!==0; context.ports.emitEvent("command",Object.freeze({sequence:sequence++,emittedAtMs:context.clock.nowMs(),sourceId:context.identity.instanceId,active,command:Object.freeze({kind:"velocity-direction",direction})})); },
      stop(){ remove?.(); remove=undefined; }, dispose(){ disposed=true; remove?.(); remove=undefined; }
    });
  }`,
  touch: `export function create(context) {
    let captured; let sequence=0; let removers=[];
    const emit=(active,pointer,reason)=>context.ports.emitEvent("command",Object.freeze({sequence:sequence++,emittedAtMs:context.clock.nowMs(),sourceId:context.identity.instanceId,active,command:Object.freeze({kind:"absolute-position",position:Object.freeze({x:pointer.worldX,y:pointer.worldY}),pointerId:pointer.id})}));
    return Object.freeze({instanceId:context.identity.instanceId,
      initialize(){ context.services.observation.register("movement",()=>({sequence,capturedPointerId:captured??null})); },
      start(){ removers=[context.services.input.register("pointer.down",p=>{if(captured===undefined&&p&&p.isDown===true)captured=p.id;}),context.services.input.register("pointer.move",p=>{if(p&&p.id===captured&&p.isDown===true)emit(true,p);}),context.services.input.register("pointer.up",p=>{if(p&&p.id===captured){emit(false,p);captured=undefined;}})]; },
      stop(){ for(const remove of removers)remove(); removers=[]; captured=undefined; }, dispose(){ for(const remove of removers)remove(); removers=[]; captured=undefined; }
    });
  }`,
  arbiter: `export function create(context) {
    const config=context.configuration; let keyboard; let touch; let sequence=0;
    const emit=(command,reason)=>context.ports.emitEvent("resolved",Object.freeze({...command,sequence:sequence++,emittedAtMs:context.clock.nowMs(),selectedSourceId:command.sourceId,arbitrationReason:reason}));
    context.ports.declareHandler("commands",command=>{ if(command.sourceId===config.keyboardSourceId)keyboard=command; else if(command.sourceId===config.touchSourceId)touch=command; else throw new Error("undeclared movement source"); if(touch?.active)emit(touch,"touch-active"); else if(command.sourceId===config.touchSourceId&&keyboard)emit(keyboard,"touch-released"); else if(command.sourceId===config.keyboardSourceId)emit(keyboard,"keyboard"); });
    return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("arbitration",()=>({sequence,keyboardActive:keyboard?.active??false,touchActive:touch?.active??false}));},stop(){},dispose(){keyboard=undefined;touch=undefined;}});
  }`,
  locomotion: `export function create(context) {
    const config=context.configuration; let command; let owner;
    context.ports.declareHandler("command",value=>{command=value;});
    return Object.freeze({instanceId:context.identity.instanceId,
      initialize(){ owner=context.services.actors.readOwner(); if(!owner||owner.active!==true)throw new Error("inactive owner actor"); context.services.observation.register("motion",()=>({commandKind:command?.command?.kind??null})); },
      start(){},
      update(){ if(!command)return; if(command.command.kind==="velocity-direction"){const d=command.command.direction;context.services.actors.writeOwnerMotion(Object.freeze({x:command.active?d.x*config.moveSpeed:0,y:command.active?d.y*config.moveSpeed:0}));}else{const viewport=context.services.viewport.read();const b=config.bounds;context.services.actors.writeOwnerPosition(Object.freeze({x:Math.min(viewport.width-b.right,Math.max(b.left,command.command.position.x)),y:Math.min(viewport.height-b.bottom,Math.max(b.top,command.command.position.y))}));context.services.actors.writeOwnerMotion(Object.freeze({x:0,y:0}));} },
      stop(){},dispose(){command=undefined;owner=undefined;}
    });
  }`,
  targeting: `export function create(context){const selection=Object.freeze({revision:0,emittedAtMs:0,kind:"direction",direction:Object.freeze({x:0,y:-1})});return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.ports.publishState("selection",Object.freeze({...selection,emittedAtMs:context.clock.nowMs()}));context.services.observation.register("target",()=>selection);}});}`,
  trigger: `export function create(context){let sequence=0;let timer;return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("trigger",()=>({sequence,timerActive:timer?.active??false}));},start(){timer=context.clock.schedule(Object.freeze({mode:"interval",initialDelayMs:context.configuration.intervalMs,intervalMs:context.configuration.intervalMs,callback(){context.ports.emitEvent("request",Object.freeze({sequence:sequence++,emittedAtMs:context.clock.nowMs(),requestedAtMs:context.clock.nowMs(),channel:"primary"}));}}));},stop(){timer?.cancel();timer=undefined;},dispose(){timer?.cancel();timer=undefined;}});}`,
  delivery: `export function create(context){const config=context.configuration;let target;let generation=0;let sequence=0;let dropped=0;const active=[];context.ports.declareHandler("target",value=>{target=value;});context.ports.declareHandler("attack",request=>{if(!target)throw new Error("attack before target");if(active.length>=config.maxActive){dropped++;return;}const owner=context.services.actors.readOwner();if(!owner||owner.active!==true)throw new Error("inactive projectile owner");const id="projectile-"+(++generation);const position=Object.freeze({x:owner.position.x+config.spawnOffset.x,y:owner.position.y+config.spawnOffset.y});const velocity=Object.freeze({x:target.direction.x*config.speed,y:target.direction.y*config.speed});const entity=Object.freeze({entityId:id,generation,position,velocity,damage:config.damage,textureKey:context.assets.requireTexture(config.textureRole)});const reference=context.services.channels.activate("projectiles",entity);active.push(reference);context.ports.emitEvent("emission",Object.freeze({sequence:sequence++,emittedAtMs:context.clock.nowMs(),entityId:id,channelId:context.identity.instanceId+".projectiles",ownerActorId:context.identity.ownerId,position,velocity,damage:config.damage,generation}));});return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.assets.requireTexture(config.textureRole);context.ports.publishState("projectiles",Object.freeze({revision:0,emittedAtMs:context.clock.nowMs(),channelId:context.identity.instanceId+".projectiles",ownerInstanceId:context.identity.instanceId,ownerActorId:context.identity.ownerId,entityRole:"projectile",generation:0}));context.services.observation.register("delivery",()=>({generation,active:active.length,dropped,emissions:sequence}));},update(){},stop(){active.splice(0);},dispose(){active.splice(0);}});}`,
  health: `export function create(context){const config=context.configuration;let current=config.initialHealth;let revision=0;const seen=new Set();const publish=(delta,reason)=>context.ports.publishState("state",Object.freeze({revision:revision++,emittedAtMs:context.clock.nowMs(),actorId:context.identity.ownerId,current,maximum:config.maxHealth,delta,reason}));context.ports.declareHandler("damage",damage=>{if(damage.targetActorId!==context.identity.ownerId)throw new Error("damage target mismatch");const key=damage.sourceActorId+":"+damage.contactSequence;if(seen.has(key))throw new Error("duplicate damage");seen.add(key);const before=current;current=Math.max(config.damageFloor,current-damage.amount);publish(current-before,current===0?"depleted":"damaged");});return Object.freeze({instanceId:context.identity.instanceId,initialize(){publish(0,"initialized");context.services.observation.register("health",()=>({current,maximum:config.maxHealth,revision}));},dispose(){seen.clear();}});}`,
  contact: `export function create(context){const config=context.configuration;let channel;let sequence=0;let remove;const seen=new Set();context.ports.declareHandler("sources",value=>{channel=value;});return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("contacts",()=>({sequence,tracked:seen.size}));},start(){remove=context.services.overlaps.register("projectile.overlap",raw=>{if(!channel)throw new Error("overlap before channel");const key=raw.sourceEntityId+":"+raw.sourceGeneration+":"+context.identity.ownerId;if(seen.has(key))return;if(seen.size>=config.maximumTrackedContacts)throw new Error("contact ledger exhausted");seen.add(key);const contactSequence=sequence++;context.ports.emitEvent("candidate",Object.freeze({sequence:contactSequence,emittedAtMs:context.clock.nowMs(),contactId:"contact."+contactSequence,sourceChannelId:channel.channelId,sourceEntityId:raw.sourceEntityId,sourceGeneration:raw.sourceGeneration,sourceActorId:channel.ownerActorId,targetActorId:context.identity.ownerId,contactSequence,metadata:Object.freeze({damage:raw.damage,damageKind:"projectile"})}));});},update(){},stop(){remove?.();remove=undefined;seen.clear();},dispose(){remove?.();remove=undefined;seen.clear();}});}`,
  resolution: `export function create(context){let resolved=0;context.ports.declareHandler("sources",()=>{});context.ports.declareHandler("candidate",candidate=>{if(resolved>=context.configuration.maxResolvedContacts)throw new Error("resolved contact ceiling exceeded");const decision=context.services.contact.executePolicy(candidate);const prepared=context.services.contact.prepareCommit(candidate,decision,Object.freeze({hit(evidenceId){context.ports.emitEvent("hit",Object.freeze({sequence:evidenceId,emittedAtMs:context.clock.nowMs(),sourceEntityId:candidate.sourceEntityId,targetActorId:candidate.targetActorId,contactSequence:candidate.contactSequence,consumed:true}));},damage(evidenceId){context.ports.emitEvent("damage",Object.freeze({sequence:evidenceId,emittedAtMs:context.clock.nowMs(),sourceActorId:candidate.sourceActorId,targetActorId:candidate.targetActorId,amount:decision.damage,damageKind:decision.metadata.damageKind,contactSequence:candidate.contactSequence}));}}));prepared.commit();resolved++;});return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("resolution",()=>({resolved}));},dispose(){resolved=0;}});}`,
  policy: `export function transform(decision){return Object.freeze({...decision,disposition:"damage",sourceOperation:"consume",damage:decision.metadata.damage});}`,
});

type Batch1Definition = Readonly<{
  manifest: GameModuleManifestV12;
  configurationSchema: z.ZodType;
  configurationDescriptor: CanonicalConfigurationDescriptor;
  reservationDescriptor: CanonicalResourceReservationDescriptor;
  reservationEvaluator(configuration: unknown): ModuleResourceBudget;
  implementationSource: string;
  exportName: string;
  exportKind: "lifecycle-create-v1" | "contact-policy-transform-v1";
}>;

function definition(
  manifest: GameModuleManifestV12,
  configurationSchema: z.ZodType,
  implementationSource: string,
  reservationFields: CanonicalResourceReservationDescriptor["fields"] = [],
  exportName = "create",
): Batch1Definition {
  const configurationDescriptor = Object.freeze({
    descriptorVersion: "1.0.0" as const,
    schemaId: manifest.configurationSchemaId,
    dialect: "json-schema-2020-12-subset" as const,
    schema: Object.freeze({ type: "object", additionalProperties: false }),
  });
  const reservationDescriptor: CanonicalResourceReservationDescriptor = {
    descriptorVersion: "1.0.0" as const,
    reservationId: `${manifest.moduleId}.reservation`,
    strategy: reservationFields.some((field) => field.configurationField)
      ? ("configuration-fields-v1" as const)
      : ("constant" as const),
    fields: [...reservationFields],
  };
  return Object.freeze({
    manifest,
    configurationSchema,
    configurationDescriptor,
    reservationDescriptor,
    reservationEvaluator: (configuration: unknown) => {
      const parsed = configurationSchema.parse(configuration) as Record<
        string,
        unknown
      >;
      const budget: ModuleResourceBudget = { ...zeroBudget };
      for (const field of reservationFields) {
        budget[field.resource] =
          reservationDescriptor.strategy === "constant"
            ? field.constant!
            : (parsed[field.configurationField!] as number);
      }
      return budget;
    },
    implementationSource,
    exportName,
    exportKind:
      exportName === "transform"
        ? "contact-policy-transform-v1"
        : "lifecycle-create-v1",
  });
}

const manifests = {
  keyboard: baseManifest("intent.keyboard-movement", "player-intent", {
    provides: [
      { id: "intent.movement-source", version: "1.0.0", scope: "owner" },
    ],
    outputPorts: [
      { id: "command", payloadType: "movement-command-v1", delivery: "event" },
    ],
    exclusiveOwnership: ["player.movement-intent-source.keyboard"],
    runtimeLeases: { startLeases: 2, instanceLeases: 1, graphLeases: 0 },
    runtimeContract: {
      update: { mode: "graph-frame-v1", registrationId: "keyboard.update" },
      timerSlots: { slotGroupId: "main" },
      inputRegistrations: [
        { registrationId: "keyboard.direction", kind: "keyboard" },
      ],
      observationReaders: [{ readerId: "movement" }],
      contactCommit: null,
    },
  }),
  touch: baseManifest("intent.touch-drag", "player-intent", {
    provides: [
      { id: "intent.movement-source", version: "1.0.0", scope: "owner" },
    ],
    outputPorts: [
      { id: "command", payloadType: "movement-command-v1", delivery: "event" },
    ],
    exclusiveOwnership: ["player.movement-intent-source.touch"],
    runtimeLeases: { startLeases: 3, instanceLeases: 1, graphLeases: 0 },
    runtimeContract: {
      update: null,
      timerSlots: { slotGroupId: "main" },
      inputRegistrations: [
        { registrationId: "pointer.down", kind: "pointer-down" },
        { registrationId: "pointer.move", kind: "pointer-move" },
        { registrationId: "pointer.up", kind: "pointer-up" },
      ],
      observationReaders: [{ readerId: "movement" }],
      contactCommit: null,
    },
  }),
  arbiter: baseManifest("intent.movement-arbiter", "player-intent", {
    provides: [
      { id: "intent.movement-resolved", version: "1.0.0", scope: "owner" },
      { id: "intent.movement-arbiter", version: "1.0.0", scope: "owner" },
    ],
    requires: [
      {
        id: "intent.movement-source",
        versionRange: "^1.0.0",
        cardinality: "at-least-one",
        scope: "owner",
      },
    ],
    inputPorts: [
      {
        id: "commands",
        payloadType: "movement-command-v1",
        required: true,
        multiple: true,
        delivery: "event",
        authorization: samePlayer,
      },
    ],
    outputPorts: [
      {
        id: "resolved",
        payloadType: "resolved-movement-command-v1",
        delivery: "event",
      },
    ],
    exclusiveOwnership: ["player.movement-intent"],
    movementArbiter: {
      capability: "intent.movement-arbiter@1.0.0",
      scope: "owner",
      outputPayloadType: "resolved-movement-command-v1",
    },
    runtimeLeases: { startLeases: 1, instanceLeases: 1, graphLeases: 0 },
    runtimeContract: {
      update: null,
      timerSlots: { slotGroupId: "main" },
      inputRegistrations: [],
      observationReaders: [{ readerId: "arbitration" }],
      contactCommit: null,
    },
  }),
  locomotion: baseManifest("locomotion.bounded", "locomotion", {
    requires: [
      {
        id: "intent.movement-resolved",
        versionRange: "1.0.0",
        cardinality: "exactly-one",
        scope: "owner",
      },
    ],
    inputPorts: [
      {
        id: "command",
        payloadType: "resolved-movement-command-v1",
        required: true,
        multiple: false,
        delivery: "event",
        authorization: samePlayer,
      },
    ],
    dependencies: [
      {
        moduleId: "intent.movement-arbiter",
        versionRange: "1.0.0",
        optional: false,
        scope: "owner",
      },
    ],
    exclusiveOwnership: ["player.locomotion"],
    runtimeLeases: { startLeases: 2, instanceLeases: 1, graphLeases: 0 },
    runtimeContract: {
      update: { mode: "graph-frame-v1", registrationId: "locomotion.update" },
      timerSlots: { slotGroupId: "main" },
      inputRegistrations: [],
      observationReaders: [{ readerId: "motion" }],
      contactCommit: null,
    },
  }),
  targeting: baseManifest("targeting.fixed-forward", "targeting", {
    provides: [{ id: "targeting.selection", version: "1.0.0", scope: "owner" }],
    outputPorts: [
      {
        id: "selection",
        payloadType: "target-selection-v1",
        delivery: "state",
      },
    ],
    exclusiveOwnership: ["attack.primary-targeting"],
    runtimeLeases: { startLeases: 0, instanceLeases: 2, graphLeases: 0 },
    runtimeContract: {
      update: null,
      timerSlots: { slotGroupId: "main" },
      inputRegistrations: [],
      observationReaders: [{ readerId: "target" }],
      contactCommit: null,
    },
  }),
  trigger: baseManifest("trigger.interval", "attack-trigger", {
    provides: [{ id: "trigger.attack", version: "1.0.0", scope: "owner" }],
    outputPorts: [
      { id: "request", payloadType: "attack-request-v1", delivery: "event" },
    ],
    exclusiveOwnership: ["attack.primary-trigger"],
    resources: { ...zeroBudget, timers: 1 },
    runtimeLeases: { startLeases: 1, instanceLeases: 1, graphLeases: 0 },
    runtimeContract: {
      update: null,
      timerSlots: { slotGroupId: "primary" },
      inputRegistrations: [],
      observationReaders: [{ readerId: "trigger" }],
      contactCommit: null,
    },
    sharedSemantics: {
      touchUncapturedMovement: "ignore",
      triggerResumeCadence: "preserve-simulation-time",
      fixedForwardOwner: "attack-delivery",
    },
  }),
  delivery: baseManifest("delivery.projectile", "attack-delivery", {
    provides: [{ id: "delivery.projectile", version: "1.0.0", scope: "owner" }],
    requires: [
      {
        id: "targeting.selection",
        versionRange: "^1.0.0",
        cardinality: "exactly-one",
        scope: "owner",
      },
      {
        id: "trigger.attack",
        versionRange: "^1.0.0",
        cardinality: "exactly-one",
        scope: "owner",
      },
    ],
    inputPorts: [
      {
        id: "target",
        payloadType: "target-selection-v1",
        required: true,
        multiple: false,
        delivery: "state",
        authorization: samePlayer,
      },
      {
        id: "attack",
        payloadType: "attack-request-v1",
        required: true,
        multiple: false,
        delivery: "event",
        authorization: samePlayer,
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
    ],
    dependencies: [
      {
        moduleId: "targeting.fixed-forward",
        versionRange: "1.0.0",
        optional: false,
        scope: "owner",
      },
      {
        moduleId: "trigger.interval",
        versionRange: "1.0.0",
        optional: false,
        scope: "owner",
      },
    ],
    assetRequirements: [
      {
        roleId: "player-projectile",
        category: "projectile",
        cardinality: "exactly-one",
        sharing: "instance",
      },
    ],
    exclusiveOwnership: ["attack.primary-delivery"],
    resources: {
      activeEntities: 256,
      activeProjectiles: 256,
      spawnsPerSecond: 20,
      timers: 0,
    },
    runtimeLeases: { startLeases: 3, instanceLeases: 4, graphLeases: 0 },
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
    projectileDelivery: {
      capability: "delivery.projectile@1.0.0",
      channelId: "projectiles",
      entityRole: "projectile",
      capacityResources: ["activeEntities", "activeProjectiles"],
    },
    sharedSemantics: {
      touchUncapturedMovement: "ignore",
      triggerResumeCadence: "preserve-simulation-time",
      fixedForwardOwner: "attack-delivery",
    },
  }),
  health: baseManifest("combat.health", "combat-interaction", {
    provides: [
      { id: "combat.health", version: "1.0.0", scope: "owner" },
      { id: "combat.damage-sink", version: "1.0.0", scope: "owner" },
    ],
    inputPorts: [
      {
        id: "damage",
        payloadType: "damage-v1",
        required: true,
        multiple: true,
        delivery: "event",
        authorization: sameEnemy,
      },
    ],
    outputPorts: [
      { id: "state", payloadType: "health-state-v1", delivery: "state" },
    ],
    exclusiveOwnership: ["combat.health", "combat.damage-sink.terminal"],
    cardinality: {
      maximumInstancesPerAssembly: 128,
      maximumInstancesPerOwner: 1,
    },
    runtimeLeases: { startLeases: 1, instanceLeases: 2, graphLeases: 0 },
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
  }),
  contact: baseManifest(
    "interaction.projectile-contact",
    "combat-interaction",
    {
      inputPorts: [
        {
          id: "sources",
          payloadType: "entity-channel-v1",
          required: true,
          multiple: false,
          delivery: "state",
          authorization: playerToEnemyProjectile,
        },
      ],
      outputPorts: [
        {
          id: "candidate",
          payloadType: "contact-candidate-v1",
          delivery: "event",
        },
      ],
      dependencies: [
        {
          moduleId: "delivery.projectile",
          versionRange: "1.0.0",
          optional: false,
          scope: "assembly",
        },
      ],
      exclusiveOwnership: ["combat.contact-detection.projectile"],
      cardinality: {
        maximumInstancesPerAssembly: 64,
        maximumInstancesPerOwner: 1,
      },
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
    },
  ),
  policy: baseManifest(
    "interaction.contact-default-damage",
    "combat-interaction",
    {
      exclusiveOwnership: ["combat.contact-policy.default-damage"],
      cardinality: {
        maximumInstancesPerAssembly: 1,
        maximumInstancesPerOwner: 1,
      },
      contactPolicyTransform: {
        descriptorVersion: "1.0.0",
        executionModel: "contact-policy-transform-v1",
        inputPayloadType: "contact-decision-v1",
        outputPayloadType: "contact-decision-v1",
        policyPhase: "default",
        policyRole: "default-damage",
        allowedPredecessors: [],
        allowedSuccessors: [],
        requiresBefore: [],
        requiresAfter: [],
        supportedChainEvidenceIds: ["batch1.default-damage.chain"],
        mutableDecisionFields: ["disposition", "sourceOperation", "damage"],
      },
      sharedSemantics: {
        touchUncapturedMovement: "ignore",
        triggerResumeCadence: "preserve-simulation-time",
        fixedForwardOwner: "attack-delivery",
        defaultPolicySuccessorProfileId: "batch1.default-damage",
      },
    },
  ),
  resolution: baseManifest(
    "interaction.contact-resolution",
    "combat-interaction",
    {
      requires: [
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
          authorization: playerToEnemyProjectile,
        },
        {
          id: "candidate",
          payloadType: "contact-candidate-v1",
          required: true,
          multiple: false,
          delivery: "event",
          authorization: sameEnemy,
        },
      ],
      outputPorts: [
        { id: "hit", payloadType: "hit-v1", delivery: "event" },
        { id: "damage", payloadType: "damage-v1", delivery: "event" },
      ],
      dependencies: [
        {
          moduleId: "interaction.projectile-contact",
          versionRange: "1.0.0",
          optional: false,
          scope: "owner",
        },
      ],
      exclusiveOwnership: ["combat.contact-resolution.projectile"],
      cardinality: {
        maximumInstancesPerAssembly: 64,
        maximumInstancesPerOwner: 1,
      },
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

export const BATCH1_MODULE_DEFINITIONS = Object.freeze([
  definition(
    manifests.keyboard,
    KeyboardConfigurationSchema,
    createSources.keyboard,
  ),
  definition(manifests.touch, TouchConfigurationSchema, createSources.touch),
  definition(
    manifests.arbiter,
    ArbiterConfigurationSchema,
    createSources.arbiter,
  ),
  definition(
    manifests.locomotion,
    LocomotionConfigurationSchema,
    createSources.locomotion,
  ),
  definition(
    manifests.targeting,
    TargetConfigurationSchema,
    createSources.targeting,
  ),
  definition(
    manifests.trigger,
    TriggerConfigurationSchema,
    createSources.trigger,
    [{ resource: "timers", constant: 1 }],
  ),
  definition(
    manifests.delivery,
    DeliveryConfigurationSchema,
    createSources.delivery,
    [
      { resource: "activeEntities", configurationField: "maxActive" },
      { resource: "activeProjectiles", configurationField: "maxActive" },
      { resource: "spawnsPerSecond", configurationField: "maximumSpawnRate" },
    ],
  ),
  definition(manifests.health, HealthConfigurationSchema, createSources.health),
  definition(
    manifests.contact,
    ContactConfigurationSchema,
    createSources.contact,
  ),
  definition(
    manifests.policy,
    DefaultDamageConfigurationSchema,
    createSources.policy,
    [],
    "transform",
  ),
  definition(
    manifests.resolution,
    ResolutionConfigurationSchema,
    createSources.resolution,
  ),
]);

const profileBasis = {
  schemaVersion: "1.0.0" as const,
  profileId: "batch1.default-damage",
  version: "1.0.0",
  orderedPolicies: [
    {
      moduleId: "interaction.contact-default-damage",
      versionRange: "1.0.0",
      policyRole: "default-damage",
    },
  ],
  allowedDispositions: ["damage"] as const,
  allowedSourceOperations: ["consume"] as const,
  maxDepth: 1,
  supportedChainEvidenceId: "batch1.default-damage.chain",
};
export const BATCH1_DEFAULT_DAMAGE_PROFILE: ContactPolicyChainProfile = {
  ...profileBasis,
  orderedPolicies: [...profileBasis.orderedPolicies],
  allowedDispositions: [...profileBasis.allowedDispositions],
  allowedSourceOperations: [...profileBasis.allowedSourceOperations],
  evidenceHash: computeContactPolicyChainProfileEvidenceHash({
    ...profileBasis,
    orderedPolicies: [...profileBasis.orderedPolicies],
    allowedDispositions: [...profileBasis.allowedDispositions],
    allowedSourceOperations: [...profileBasis.allowedSourceOperations],
    evidenceHash: "0".repeat(64),
  }),
};

const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

export async function createBatch1ProductionRegistry(): Promise<GameModuleRegistry> {
  const registry = new GameModuleRegistry();
  const lock = new TextEncoder().encode("batch1-reviewed-pnpm-lock-v1");
  const toolchain = new TextEncoder().encode("node22-typescript5-batch1-v1");
  const loader = new TrustedGameModuleExecutableLoader();
  for (const definition of BATCH1_MODULE_DEFINITIONS) {
    const bundle = new TextEncoder().encode(definition.implementationSource);
    const artifact = createModuleArtifactHashDescriptor({
      manifest: definition.manifest,
      configurationDescriptor: definition.configurationDescriptor,
      reservationDescriptor: definition.reservationDescriptor,
      implementationBundle: bundle,
      dependencyLockIdentity: lock,
      toolchainIdentity: toolchain,
    });
    const handle = await loader.admit({
      generatedOutput: bundle,
      expectedOutputSha256: sha256(bundle),
      implementationId: definition.manifest.implementationId,
      exportName: definition.exportName,
      exportKind: definition.exportKind,
      sourceBundleSha256: sha256(bundle),
      manifestSha256: artifact.manifestSha256,
      dependencyLockSha256: artifact.dependencyLockSha256,
      toolchainIdentitySha256: artifact.toolchainIdentitySha256,
    });
    registry.registerProductionV12({
      manifest: definition.manifest,
      configurationDescriptor: definition.configurationDescriptor,
      configurationSchema: definition.configurationSchema,
      reservationDescriptor: definition.reservationDescriptor,
      reservationEvaluator: definition.reservationEvaluator,
      implementationBundle: bundle,
      dependencyLockIdentity: lock,
      toolchainIdentity: toolchain,
      expectedArtifact: artifact,
      executableHandle: handle,
    });
  }
  registry.registerContactPolicyProfile(BATCH1_DEFAULT_DAMAGE_PROFILE);
  return registry;
}
