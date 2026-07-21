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

const samePlayer = Object.freeze({
  ownerRelation: "same-owner",
  sourceActorRoles: Object.freeze(["player"]),
  targetActorRoles: Object.freeze(["player"]),
  sourceEntityRoles: Object.freeze([]),
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
      provenanceId: "agent.batch2.reviewed",
      testSuiteId: "modules.batch2.core-library",
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

const DirectionalAimConfigurationSchema = z.discriminatedUnion("source", [
  z.strictObject({
    source: z.literal("pointer-world"),
    deadZone: z.number().finite().min(0).max(256),
    normalization: z.literal("unit"),
    pointerCapture: z.literal("latest-active"),
  }),
  z.strictObject({
    source: z.literal("keyboard-vector"),
    deadZone: z.number().finite().min(0).max(1),
    normalization: z.literal("unit"),
    pointerCapture: z.literal("none"),
  }),
]);

const ActiveAttackConfigurationSchema = z.strictObject({
  device: z.enum(["keyboard", "pointer"]),
  control: z.string().min(1).max(64),
  pointerCapture: z.enum(["matching-pointer", "none"]),
});

const FocusConfigurationSchema = z.strictObject({
  device: z.literal("keyboard"),
  control: z.string().min(1).max(64),
  initialFocused: z.literal(false),
});

const FocusSpeedConfigurationSchema = z.strictObject({
  multiplier: z.number().finite().min(0.1).max(1),
  releaseBehavior: z.literal("restore"),
});

const LocomotionV11ConfigurationSchema = z
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

const DirectionalTargetingConfigurationSchema = z.strictObject({
  attackChannelId: z.string().min(1).max(100),
  pointFallbackDirection: z.strictObject({
    x: z.number().finite(),
    y: z.number().finite(),
  }),
  zeroVectorPolicy: z.literal("retain-last"),
});

const NearestTargetingConfigurationSchema = z.strictObject({
  attackChannelId: z.string().min(1).max(100),
  range: z.number().finite().positive().max(100_000),
  allowedRoles: z
    .array(z.enum(["enemy", "boss"]))
    .min(1)
    .max(2),
  inactivePolicy: z.literal("ignore"),
  noTargetFallbackDirection: z.strictObject({
    x: z.number().finite(),
    y: z.number().finite(),
  }),
});

const ActiveTriggerConfigurationSchema = z.discriminatedUnion("mode", [
  z.strictObject({
    attackChannelId: z.string().min(1).max(100),
    mode: z.literal("press"),
  }),
  z.strictObject({
    attackChannelId: z.string().min(1).max(100),
    mode: z.literal("release"),
  }),
  z.strictObject({
    attackChannelId: z.string().min(1).max(100),
    mode: z.literal("hold-repeat"),
    initialDelayMs: z.number().int().min(0).max(10_000),
    repeatIntervalMs: z.number().int().min(50).max(10_000),
  }),
]);

const sources = Object.freeze({
  directionalAim: `export function create(context){let revision=0;let last=Object.freeze({x:0,y:-1});let remove;const publish=(active,command)=>context.ports.publishState("aim",Object.freeze({sourceId:context.identity.instanceId,revision:revision++,emittedAtMs:context.clock.nowMs(),active,command:Object.freeze(command)}));return Object.freeze({instanceId:context.identity.instanceId,initialize(){publish(false,{kind:"direction",direction:last});context.services.observation.register("aim",()=>({revision,last}));},start(){const registration=context.configuration.source==="pointer-world"?"aim.pointer":"aim.keyboard";remove=context.services.input.register(registration,value=>{if(!value)return;if(context.configuration.source==="pointer-world"){if(!Number.isFinite(value.worldX)||!Number.isFinite(value.worldY))throw new Error("invalid aim point");publish(true,{kind:"world-point",point:Object.freeze({x:value.worldX,y:value.worldY})});return;}if(!Number.isFinite(value.x)||!Number.isFinite(value.y))throw new Error("invalid aim direction");const length=Math.hypot(value.x,value.y);if(length<=context.configuration.deadZone){publish(false,{kind:"direction",direction:last});return;}last=Object.freeze({x:value.x/length,y:value.y/length});publish(true,{kind:"direction",direction:last});});},stop(){remove?.();remove=undefined;},dispose(){remove?.();remove=undefined;}});}`,
  activeAttack: `export function create(context){let sequence=0;let captured;let removers=[];const emit=(phase,identity)=>context.ports.emitEvent("intent",Object.freeze({sourceId:context.identity.instanceId,sequence:sequence++,emittedAtMs:context.clock.nowMs(),phase,inputIdentity:String(identity)}));const accept=(phase,identity)=>{if(phase==="press"){if(captured!==undefined)return;captured=identity;emit("press",identity);return;}if(identity!==captured)return;emit("release",identity);captured=undefined;};return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("attack",()=>({sequence,captured:captured??null}));},start(){if(context.configuration.device==="pointer"){removers=[context.services.input.register("attack.pointer-down",value=>accept("press",value.id)),context.services.input.register("attack.pointer-up",value=>accept("release",value.id))];return;}removers=[context.services.input.register("attack.keyboard",value=>{if(!value||!(value.phase==="press"||value.phase==="release"))throw new Error("invalid attack input");accept(value.phase,value.identity);})];},stop(){for(const remove of removers)remove();removers=[];captured=undefined;},dispose(){for(const remove of removers)remove();removers=[];captured=undefined;}});}`,
  focus: `export function create(context){let revision=0;let focused=false;let remove;const publish=()=>context.ports.publishState("focus",Object.freeze({sourceId:context.identity.instanceId,revision:revision++,emittedAtMs:context.clock.nowMs(),active:focused}));return Object.freeze({instanceId:context.identity.instanceId,initialize(){publish();context.services.observation.register("focus",()=>({revision,focused}));},start(){remove=context.services.input.register("focus.keyboard",value=>{if(!value||!(value.phase==="press"||value.phase==="release"))throw new Error("invalid focus input");focused=value.phase==="press";publish();});},stop(){remove?.();remove=undefined;focused=false;},dispose(){remove?.();remove=undefined;focused=false;}});}`,
  focusSpeed: `export function create(context){let revision=0;let focused=false;const publish=()=>context.ports.publishState("scale",Object.freeze({revision:revision++,emittedAtMs:context.clock.nowMs(),scale:focused?context.configuration.multiplier:1}));context.ports.declareHandler("focus",(value,metadata)=>{focused=value.active===true;if(metadata?.replay!==true)publish();});return Object.freeze({instanceId:context.identity.instanceId,initialize(){publish();context.services.observation.register("scale",()=>({revision,focused,scale:focused?context.configuration.multiplier:1}));},dispose(){focused=false;}});}`,
  locomotionV11: `export function create(context){const config=context.configuration;let command;let scale=1;context.ports.declareHandler("command",value=>{command=value;});context.ports.declareHandler("speed-scale",value=>{if(!Number.isFinite(value.scale)||value.scale<=0||value.scale>1)throw new Error("invalid movement scale");scale=value.scale;});return Object.freeze({instanceId:context.identity.instanceId,initialize(){const owner=context.services.actors.readOwner();if(!owner||owner.active!==true)throw new Error("inactive owner actor");context.services.observation.register("motion",()=>({commandKind:command?.command?.kind??null,scale}));},update(){if(!command)return;if(command.command.kind==="velocity-direction"){const d=command.command.direction;context.services.actors.writeOwnerMotion(Object.freeze({x:command.active?d.x*config.moveSpeed*scale:0,y:command.active?d.y*config.moveSpeed*scale:0}));return;}const viewport=context.services.viewport.read();const b=config.bounds;context.services.actors.writeOwnerPosition(Object.freeze({x:Math.min(viewport.width-b.right,Math.max(b.left,command.command.position.x)),y:Math.min(viewport.height-b.bottom,Math.max(b.top,command.command.position.y))}));context.services.actors.writeOwnerMotion(Object.freeze({x:0,y:0}));},stop(){},dispose(){command=undefined;scale=1;}});}`,
  directionalTargeting: `export function create(context){let revision=0;let last;const normalize=value=>{const length=Math.hypot(value.x,value.y);if(!Number.isFinite(length)||length===0)return undefined;return Object.freeze({x:value.x/length,y:value.y/length});};const publish=direction=>{last=direction;context.ports.publishState("selection",Object.freeze({revision:revision++,emittedAtMs:context.clock.nowMs(),attackChannelId:context.configuration.attackChannelId,direction,targetEvidence:null}));};context.ports.declareHandler("aim",(value,metadata)=>{if(value.command.kind==="direction"){const direction=normalize(value.command.direction);if(direction){last=direction;if(metadata?.replay!==true)publish(direction);}return;}const owner=context.services.actors.readOwner();const direction=owner?normalize({x:value.command.point.x-owner.position.x,y:value.command.point.y-owner.position.y}):undefined;if(direction){last=direction;if(metadata?.replay!==true)publish(direction);}else if(!last){const fallback=normalize(context.configuration.pointFallbackDirection);if(!fallback)throw new Error("invalid targeting fallback");last=fallback;if(metadata?.replay!==true)publish(fallback);}});return Object.freeze({instanceId:context.identity.instanceId,initialize(){const fallback=normalize(context.configuration.pointFallbackDirection);if(!fallback)throw new Error("invalid targeting fallback");publish(fallback);context.services.observation.register("target",()=>({revision,last}));},dispose(){last=undefined;}});}`,
  nearestTargeting: `export function create(context){let revision=0;let last;const normalize=value=>{const length=Math.hypot(value.x,value.y);if(!Number.isFinite(length)||length===0)return undefined;return Object.freeze({x:value.x/length,y:value.y/length});};return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("nearest",()=>({revision,last}));},update(){const snapshot=context.services.actorSnapshots.read("nearest.targets");const owner=context.services.actors.readOwner();if(!owner)throw new Error("missing targeting owner");const target=snapshot.entries.find(entry=>entry.active===true&&context.configuration.allowedRoles.includes(entry.role)&&Math.hypot(entry.position.x-owner.position.x,entry.position.y-owner.position.y)<=context.configuration.range);const direction=target?normalize({x:target.position.x-owner.position.x,y:target.position.y-owner.position.y}):normalize(context.configuration.noTargetFallbackDirection);if(!direction)throw new Error("invalid nearest fallback");last=direction;context.ports.publishState("selection",Object.freeze({revision:revision++,emittedAtMs:context.clock.nowMs(),attackChannelId:context.configuration.attackChannelId,direction,targetEvidence:target?Object.freeze({actorId:target.actorId,actorGeneration:target.actorGeneration,directoryRevision:snapshot.directoryRevision}):null}));},dispose(){last=undefined;}});}`,
  activeTrigger: `export function create(context){let state="idle";let identity;let sequence=0;let timer;const emit=()=>context.ports.emitEvent("request",Object.freeze({sequence:sequence++,emittedAtMs:context.clock.nowMs(),requestedAtMs:context.clock.nowMs(),attackChannelId:context.configuration.attackChannelId,slot:"primary"}));const cancel=()=>{timer?.cancel();timer=undefined;state="idle";identity=undefined;};context.ports.declareHandler("intent",value=>{if(value.phase==="press"){if(state!=="idle")return;identity=value.inputIdentity;if(context.configuration.mode==="press"){emit();state="held-edge";return;}if(context.configuration.mode==="release"){state="held-edge";return;}state="held-waiting";timer=context.clock.schedule(Object.freeze({mode:"interval",initialDelayMs:context.configuration.initialDelayMs,intervalMs:context.configuration.repeatIntervalMs,callback(){if(state==="held-waiting")state="held-repeating";if(state==="held-repeating")emit();}}));return;}if(value.phase!=="release"||state==="idle"||value.inputIdentity!==identity)return;if(context.configuration.mode==="release")emit();cancel();});return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("trigger",()=>({state,identity:identity??null,sequence,timerActive:timer?.active??false}));},stop(){cancel();},dispose(){cancel();sequence=0;}});}`,
});

type Batch2Definition = Readonly<{
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
  descriptorSchema: CanonicalConfigurationDescriptor["schema"] = Object.freeze({
    type: "object",
    additionalProperties: false,
  }),
  reservationDescriptor: CanonicalResourceReservationDescriptorV11 = {
    descriptorVersion: "1.0.0",
    reservationId: `${manifest.moduleId}.resources`,
    strategy: "constant",
    fields: [],
  },
): Batch2Definition {
  const configurationDescriptor: CanonicalConfigurationDescriptor = {
    descriptorVersion: "1.0.0",
    schemaId: manifest.configurationSchemaId,
    dialect: "json-schema-2020-12-subset",
    schema: descriptorSchema,
  };
  return Object.freeze({
    manifest,
    configurationSchema,
    configurationDescriptor: Object.freeze(configurationDescriptor),
    reservationDescriptor: Object.freeze(reservationDescriptor),
    reservationEvaluator: (configuration: unknown) => {
      const parsed = configurationSchema.parse(configuration);
      return evaluateCanonicalResourceReservationV11(
        reservationDescriptor,
        parsed,
      );
    },
    implementationSource,
    exportName: "create",
    exportKind: "lifecycle-create-v1",
  });
}

const manifests = {
  directionalAim: baseManifest("intent.directional-aim", "player-intent", {
    provides: [{ id: "intent.aim-source", version: "1.0.0", scope: "owner" }],
    outputPorts: [
      { id: "aim", payloadType: "aim-command-v1", delivery: "state" },
    ],
    exclusiveOwnership: ["player.aim-intent-source.directional"],
    runtimeLeases: { startLeases: 2, instanceLeases: 2, graphLeases: 0 },
    runtimeContract: {
      update: null,
      timerSlots: { slotGroupId: "main" },
      inputRegistrations: [
        { registrationId: "aim.pointer", kind: "pointer-move" },
        { registrationId: "aim.keyboard", kind: "keyboard" },
      ],
      observationReaders: [{ readerId: "aim" }],
      contactCommit: null,
    },
  }),
  activeAttack: baseManifest("intent.active-attack", "player-intent", {
    provides: [
      { id: "intent.attack-source", version: "1.0.0", scope: "owner" },
    ],
    outputPorts: [
      { id: "intent", payloadType: "attack-intent-v1", delivery: "event" },
    ],
    exclusiveOwnership: ["player.attack-intent-source.active"],
    runtimeLeases: { startLeases: 3, instanceLeases: 1, graphLeases: 0 },
    runtimeContract: {
      update: null,
      timerSlots: { slotGroupId: "main" },
      inputRegistrations: [
        { registrationId: "attack.pointer-down", kind: "pointer-down" },
        { registrationId: "attack.pointer-up", kind: "pointer-up" },
        { registrationId: "attack.keyboard", kind: "keyboard" },
      ],
      observationReaders: [{ readerId: "attack" }],
      contactCommit: null,
    },
  }),
  focus: baseManifest("intent.focus", "player-intent", {
    provides: [{ id: "intent.focus-source", version: "1.0.0", scope: "owner" }],
    outputPorts: [
      { id: "focus", payloadType: "focus-state-v1", delivery: "state" },
    ],
    exclusiveOwnership: ["player.focus-intent-source.keyboard"],
    runtimeLeases: { startLeases: 1, instanceLeases: 2, graphLeases: 0 },
    runtimeContract: {
      update: null,
      timerSlots: { slotGroupId: "main" },
      inputRegistrations: [
        { registrationId: "focus.keyboard", kind: "keyboard" },
      ],
      observationReaders: [{ readerId: "focus" }],
      contactCommit: null,
    },
  }),
  focusSpeed: baseManifest("locomotion.focus-speed", "locomotion", {
    provides: [
      { id: "locomotion.movement-scale", version: "1.0.0", scope: "owner" },
    ],
    requires: [
      {
        id: "intent.focus-source",
        versionRange: "^1.0.0",
        cardinality: "exactly-one",
        scope: "owner",
      },
    ],
    inputPorts: [
      {
        id: "focus",
        payloadType: "focus-state-v1",
        required: true,
        multiple: false,
        delivery: "state",
        authorization: samePlayer,
      },
    ],
    outputPorts: [
      { id: "scale", payloadType: "movement-scale-v1", delivery: "state" },
    ],
    exclusiveOwnership: ["player.movement-scale.primary"],
    runtimeLeases: { startLeases: 1, instanceLeases: 3, graphLeases: 0 },
    runtimeContract: {
      update: null,
      timerSlots: { slotGroupId: "main" },
      inputRegistrations: [],
      observationReaders: [{ readerId: "scale" }],
      contactCommit: null,
    },
  }),
  locomotionV11: baseManifest("locomotion.bounded", "locomotion", {
    version: "1.1.0",
    implementationId: "locomotion.bounded.v1-1",
    requires: [
      {
        id: "intent.movement-resolved",
        versionRange: "^1.0.0",
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
      {
        id: "speed-scale",
        payloadType: "movement-scale-v1",
        required: false,
        multiple: false,
        delivery: "state",
        authorization: samePlayer,
      },
    ],
    exclusiveOwnership: ["player.transform.primary"],
    runtimeLeases: { startLeases: 3, instanceLeases: 1, graphLeases: 0 },
    runtimeContract: {
      update: { mode: "graph-frame-v1", registrationId: "motion.update" },
      timerSlots: { slotGroupId: "main" },
      inputRegistrations: [],
      observationReaders: [{ readerId: "motion" }],
      contactCommit: null,
    },
  }),
  directionalTargeting: baseManifest("targeting.directional", "targeting", {
    provides: [
      { id: "targeting.solution-v2", version: "1.0.0", scope: "owner" },
    ],
    requires: [
      {
        id: "intent.aim-source",
        versionRange: "^1.0.0",
        cardinality: "exactly-one",
        scope: "owner",
      },
    ],
    inputPorts: [
      {
        id: "aim",
        payloadType: "aim-command-v1",
        required: true,
        multiple: false,
        delivery: "state",
        authorization: samePlayer,
      },
    ],
    outputPorts: [
      {
        id: "selection",
        payloadType: "target-solution-v1",
        delivery: "state",
      },
    ],
    exclusiveOwnership: ["player.targeting.directional"],
    runtimeLeases: { startLeases: 1, instanceLeases: 2, graphLeases: 0 },
    runtimeContract: {
      update: null,
      timerSlots: { slotGroupId: "main" },
      inputRegistrations: [],
      observationReaders: [{ readerId: "target" }],
      contactCommit: null,
    },
    attackChannel: {
      role: "targeting",
      configurationField: "attackChannelId",
      targetOutputPort: "selection",
      targetPayloadType: "target-solution-v1",
    },
  }),
  nearestTargeting: baseManifest("targeting.nearest", "targeting", {
    provides: [
      { id: "targeting.solution-v2", version: "1.0.0", scope: "owner" },
    ],
    outputPorts: [
      {
        id: "selection",
        payloadType: "target-solution-v1",
        delivery: "state",
      },
    ],
    exclusiveOwnership: ["player.targeting.nearest"],
    runtimeLeases: { startLeases: 1, instanceLeases: 2, graphLeases: 0 },
    runtimeContract: {
      update: { mode: "graph-frame-v1", registrationId: "nearest.update" },
      timerSlots: { slotGroupId: "main" },
      inputRegistrations: [],
      observationReaders: [{ readerId: "nearest" }],
      contactCommit: null,
    },
    actorSnapshotReads: [
      {
        readId: "nearest.targets",
        ownerRelation: "different-owner",
        sourceActorRoles: ["player"],
        targetActorRoles: ["enemy", "boss"],
        maximumEntries: 128,
        entryFields: [
          "actorId",
          "actorGeneration",
          "role",
          "active",
          "position",
        ],
        envelopeFields: [
          "directoryRevision",
          "sampledAtMs",
          "sampledFrameSequence",
          "entryCount",
        ],
        order: "distance-then-actor-id-generation",
        distanceOrigin: "owner-position-same-snapshot",
      },
    ],
    attackChannel: {
      role: "targeting",
      configurationField: "attackChannelId",
      targetOutputPort: "selection",
      targetPayloadType: "target-solution-v1",
    },
  }),
  activeTrigger: baseManifest("trigger.active", "attack-trigger", {
    provides: [{ id: "trigger.attack-v2", version: "1.0.0", scope: "owner" }],
    requires: [
      {
        id: "intent.attack-source",
        versionRange: "^1.0.0",
        cardinality: "exactly-one",
        scope: "owner",
      },
    ],
    inputPorts: [
      {
        id: "intent",
        payloadType: "attack-intent-v1",
        required: true,
        multiple: false,
        delivery: "event",
        authorization: samePlayer,
      },
    ],
    outputPorts: [
      { id: "request", payloadType: "attack-request-v2", delivery: "event" },
    ],
    exclusiveOwnership: ["player.attack-trigger.active"],
    resources: { ...zeroBudget, timers: 1 },
    runtimeLeases: { startLeases: 3, instanceLeases: 1, graphLeases: 0 },
    runtimeContract: {
      update: null,
      timerSlots: { slotGroupId: "active" },
      inputRegistrations: [],
      observationReaders: [{ readerId: "trigger" }],
      contactCommit: null,
    },
    attackChannel: {
      role: "trigger",
      configurationField: "attackChannelId",
      requestOutputPort: "request",
      requestPayloadType: "attack-request-v2",
    },
  }),
};

const activeTriggerReservation: CanonicalResourceReservationDescriptorV11 = {
  descriptorVersion: "1.1.0",
  reservationId: "trigger.active.resources",
  strategy: "conditional-enum-v1",
  configurationField: "mode",
  cases: [
    { value: "press", resources: zeroBudget },
    {
      value: "hold-repeat",
      resources: { ...zeroBudget, timers: 1 },
    },
    { value: "release", resources: zeroBudget },
  ],
};

export const BATCH2_CONTROL_DEFINITIONS = Object.freeze([
  definition(
    manifests.directionalAim,
    DirectionalAimConfigurationSchema,
    sources.directionalAim,
  ),
  definition(
    manifests.activeAttack,
    ActiveAttackConfigurationSchema,
    sources.activeAttack,
  ),
  definition(manifests.focus, FocusConfigurationSchema, sources.focus),
  definition(
    manifests.focusSpeed,
    FocusSpeedConfigurationSchema,
    sources.focusSpeed,
  ),
  definition(
    manifests.locomotionV11,
    LocomotionV11ConfigurationSchema,
    sources.locomotionV11,
  ),
  definition(
    manifests.directionalTargeting,
    DirectionalTargetingConfigurationSchema,
    sources.directionalTargeting,
  ),
  definition(
    manifests.nearestTargeting,
    NearestTargetingConfigurationSchema,
    sources.nearestTargeting,
  ),
  definition(
    manifests.activeTrigger,
    ActiveTriggerConfigurationSchema,
    sources.activeTrigger,
    {
      type: "object",
      additionalProperties: false,
      required: ["mode"],
      properties: {
        mode: {
          type: "string",
          enum: ["press", "hold-repeat", "release"],
        },
      },
    },
    activeTriggerReservation,
  ),
]);

const lockIdentity = new TextEncoder().encode("pnpm-lock.batch2.control.v1");
const toolchainIdentity = new TextEncoder().encode(
  "typescript-5.9.3.esm-self-contained.batch2.control.v1",
);

export async function registerBatch2ControlDefinitions(
  registry: GameModuleRegistry,
): Promise<void> {
  const loader = new TrustedGameModuleExecutableLoader();
  for (const item of BATCH2_CONTROL_DEFINITIONS) {
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

export async function createBatch2ControlRegistry(): Promise<GameModuleRegistry> {
  const registry = new GameModuleRegistry();
  await registerBatch2ControlDefinitions(registry);
  return registry;
}
