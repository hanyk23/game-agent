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

const enemyProjectileToPlayer = Object.freeze({
  ownerRelation: "different-owner",
  sourceActorRoles: Object.freeze(["enemy", "boss"]),
  targetActorRoles: Object.freeze(["player"]),
  sourceEntityRoles: Object.freeze(["projectile"]),
});

const DamageKindsSchema = z
  .array(z.enum(["projectile", "beam", "field", "contact"]))
  .min(1)
  .max(4)
  .refine((values) => new Set(values).size === values.length, {
    message: "accepted damage kinds must be unique",
  });

const InvulnerabilityConfigurationSchema = z.strictObject({
  durationMs: z.number().int().min(0).max(10_000),
  acceptedDamageKinds: DamageKindsSchema,
});

const ShieldConfigurationSchema = z
  .strictObject({
    maximumStrength: z.number().finite().positive().max(1_000_000),
    initialStrength: z.number().finite().min(0).max(1_000_000),
    acceptedDamageKinds: DamageKindsSchema,
    overflowPolicy: z.literal("pass-remainder"),
  })
  .refine((value) => value.initialStrength <= value.maximumStrength, {
    message: "initial shield strength exceeds maximum",
    path: ["initialStrength"],
  });

const GrazeConfigurationSchema = z.strictObject({
  playerRadius: z.number().finite().min(0).max(1_000),
  bulletRadius: z.number().finite().min(0).max(1_000),
  margin: z.number().finite().min(0).max(1_000),
  ledgerCeiling: z.number().int().min(1).max(10_000),
});

function baseManifest(
  moduleId: string,
  overrides: Record<string, unknown>,
): GameModuleManifestV13 {
  return GameModuleManifestV13Schema.parse({
    schemaVersion: "1.3.0",
    moduleId,
    version: "1.0.0",
    kind: "combat-interaction",
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
      testSuiteId: "modules.batch2.defense-library",
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

const invulnerabilityManifest = baseManifest("combat.invulnerability-window", {
  provides: [{ id: "combat.damage-sink", version: "1.0.0", scope: "owner" }],
  inputPorts: [
    {
      id: "damage",
      payloadType: "damage-v1",
      required: true,
      multiple: true,
      delivery: "event",
      authorization: sameCombatOwner,
    },
  ],
  outputPorts: [
    { id: "downstream", payloadType: "damage-v1", delivery: "event" },
    { id: "state", payloadType: "defense-state-v1", delivery: "state" },
    { id: "result", payloadType: "defense-result-v1", delivery: "event" },
  ],
  exclusiveOwnership: ["combat.defense.invulnerability-window"],
  runtimeLeases: { startLeases: 1, instanceLeases: 2, graphLeases: 0 },
  runtimeContract: {
    update: null,
    timerSlots: { slotGroupId: "main" },
    inputRegistrations: [],
    observationReaders: [{ readerId: "invulnerability" }],
    contactCommit: null,
  },
  damageSink: {
    capability: "combat.damage-sink@1.0.0",
    sinkRole: "filter",
    inputPort: "damage",
    downstreamOutputPort: "downstream",
  },
});

const shieldManifest = baseManifest("combat.shield", {
  provides: [{ id: "combat.damage-sink", version: "1.0.0", scope: "owner" }],
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
      multiple: true,
      delivery: "event",
      authorization: sameCombatOwner,
    },
  ],
  outputPorts: [
    { id: "downstream", payloadType: "damage-v1", delivery: "event" },
    { id: "state", payloadType: "defense-state-v1", delivery: "state" },
    { id: "result", payloadType: "defense-result-v1", delivery: "event" },
  ],
  exclusiveOwnership: ["combat.defense.shield"],
  runtimeLeases: { startLeases: 2, instanceLeases: 2, graphLeases: 0 },
  runtimeContract: {
    update: null,
    timerSlots: { slotGroupId: "main" },
    inputRegistrations: [],
    observationReaders: [{ readerId: "shield" }],
    contactCommit: null,
  },
  damageSink: {
    capability: "combat.damage-sink@1.0.0",
    sinkRole: "filter",
    inputPort: "damage",
    downstreamOutputPort: "downstream",
  },
  modifierTargets: [
    {
      fieldId: "combat.shield.current",
      inputPort: "modifier",
      operation: "add",
      minimum: 0,
      maximum: 1_000_000,
      reset: "dispose-new-graph",
    },
  ],
});

const grazeManifest = baseManifest("combat.graze", {
  requires: [
    {
      id: "delivery.projectile-channel",
      versionRange: "^1.0.0",
      cardinality: "exactly-one",
      scope: "assembly",
    },
  ],
  inputPorts: [
    {
      id: "projectiles",
      payloadType: "entity-channel-v1",
      required: true,
      multiple: false,
      delivery: "state",
      authorization: enemyProjectileToPlayer,
    },
  ],
  outputPorts: [{ id: "graze", payloadType: "graze-v1", delivery: "event" }],
  exclusiveOwnership: ["combat.graze.reader"],
  runtimeLeases: { startLeases: 2, instanceLeases: 1, graphLeases: 0 },
  runtimeContract: {
    update: { mode: "graph-frame-v1", registrationId: "graze.update" },
    timerSlots: { slotGroupId: "main" },
    inputRegistrations: [],
    observationReaders: [{ readerId: "graze" }],
    contactCommit: null,
  },
  entityChannelReads: [
    {
      readId: "graze.projectiles",
      channelStateInputPort: "projectiles",
      sourceEntityRole: "projectile",
      targetActorRoles: ["player"],
      maximumEntriesSource: "resolved-channel-capacity",
      entryFields: [
        "entityId",
        "generation",
        "position",
        "collisionRadius",
        "active",
      ],
      order: "entity-id-generation",
    },
  ],
  projectileChannelConsumer: {
    role: "graze-reader",
    sourceChannelInputPort: "projectiles",
    readId: "graze.projectiles",
    requiredCapability: "delivery.projectile-channel@1.0.0",
    sourceEntityRole: "projectile",
  },
});

const sources = Object.freeze({
  invulnerability: `export function create(context){const config=context.configuration;let activeUntilMs=0;let revision=0;let sequence=0;const accepted=new Set(config.acceptedDamageKinds);const publish=()=>{const now=context.clock.nowMs();context.ports.publishState("state",Object.freeze({revision:revision++,emittedAtMs:now,actorId:context.identity.ownerId,active:now<activeUntilMs,current:Math.max(0,activeUntilMs-now),maximum:config.durationMs}));};const result=(damage,value,amount)=>context.ports.emitEvent("result",Object.freeze({sequence:sequence++,emittedAtMs:context.clock.nowMs(),targetActorId:damage.targetActorId,result:value,amount}));context.ports.declareHandler("damage",damage=>{if(!Object.isFrozen(damage))throw new Error("damage entering defense route must be immutable");const now=context.clock.nowMs();if(accepted.has(damage.damageKind)&&now<activeUntilMs){result(damage,"blocked",damage.amount);return;}if(accepted.has(damage.damageKind)){const until=now+config.durationMs;if(!Number.isSafeInteger(until))throw new Error("invulnerability active-until overflow");activeUntilMs=until;publish();}result(damage,"accepted",damage.amount);context.ports.emitEvent("downstream",damage);});return Object.freeze({instanceId:context.identity.instanceId,initialize(){publish();context.services.observation.register("invulnerability",()=>({activeUntilMs,revision,sequence}));},dispose(){activeUntilMs=0;}});}`,
  shield: `export function create(context){const config=context.configuration;let current=config.initialStrength;let revision=0;let sequence=0;const accepted=new Set(config.acceptedDamageKinds);const publish=()=>context.ports.publishState("state",Object.freeze({revision:revision++,emittedAtMs:context.clock.nowMs(),actorId:context.identity.ownerId,active:current>0,current,maximum:config.maximumStrength}));const result=(damage,value,amount)=>context.ports.emitEvent("result",Object.freeze({sequence:sequence++,emittedAtMs:context.clock.nowMs(),targetActorId:damage.targetActorId,result:value,amount}));context.ports.declareHandler("damage",damage=>{if(!Object.isFrozen(damage))throw new Error("damage entering defense route must be immutable");if(!accepted.has(damage.damageKind)||current===0){result(damage,"passed-remainder",damage.amount);context.ports.emitEvent("downstream",damage);return;}const absorbed=Math.min(current,damage.amount);current-=absorbed;publish();result(damage,"absorbed",absorbed);const remainder=damage.amount-absorbed;if(remainder>0){const forwarded=Object.freeze({...damage,amount:remainder});result(damage,"passed-remainder",remainder);context.ports.emitEvent("downstream",forwarded);}});context.ports.declareAddressedHandler("combat.shield.current",application=>{if(application.fieldId!=="combat.shield.current"||application.operation!=="add")throw new Error("invalid shield modifier");current=Math.min(config.maximumStrength,Math.max(0,current+application.value));publish();});return Object.freeze({instanceId:context.identity.instanceId,initialize(){publish();context.services.observation.register("shield",()=>({current,revision,sequence}));},dispose(){current=0;}});}`,
  graze: `export function create(context){const config=context.configuration;let channelId;let sequence=0;const ledger=new Set();context.ports.declareHandler("projectiles",channel=>{channelId=channel.channelId;});return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("graze",()=>({ledgerSize:ledger.size,sequence}));},update(){if(!channelId)return;const owner=context.services.actors.readOwner();if(!owner||owner.active!==true)return;const snapshot=context.services.entityChannelSnapshots.read("graze.projectiles");const entries=snapshot.entries;const live=new Set(entries.map(entry=>channelId+"/"+entry.entityId+"/"+entry.generation+"/"+owner.actorId));for(const key of ledger)if(!live.has(key))ledger.delete(key);for(const entry of entries){if(entry.active!==true)continue;const key=channelId+"/"+entry.entityId+"/"+entry.generation+"/"+owner.actorId;if(ledger.has(key))continue;const dx=entry.position.x-owner.position.x;const dy=entry.position.y-owner.position.y;const collision=config.playerRadius+config.bulletRadius;const graze=collision+config.margin;const distanceSquared=dx*dx+dy*dy;if(distanceSquared<=collision*collision||distanceSquared>graze*graze)continue;if(ledger.size>=config.ledgerCeiling)throw new Error("graze ledger capacity exceeded");ledger.add(key);context.ports.emitEvent("graze",Object.freeze({sequence:sequence++,emittedAtMs:context.clock.nowMs(),channelId,entityId:entry.entityId,generation:entry.generation,playerActorId:owner.actorId}));}},dispose(){ledger.clear();channelId=undefined;}});}`,
});

export type Batch2DefenseDefinition = Readonly<{
  manifest: GameModuleManifestV13;
  configurationSchema: z.ZodType;
  configurationDescriptor: CanonicalConfigurationDescriptor;
  reservationDescriptor: CanonicalResourceReservationDescriptorV11;
  reservationEvaluator(configuration: unknown): ModuleResourceBudget;
  implementationSource: string;
  exportName: "create";
  exportKind: "lifecycle-create-v1";
}>;

function definition(
  manifest: GameModuleManifestV13,
  configurationSchema: z.ZodType,
  implementationSource: string,
): Batch2DefenseDefinition {
  const configurationDescriptor: CanonicalConfigurationDescriptor = {
    descriptorVersion: "1.0.0",
    schemaId: manifest.configurationSchemaId,
    dialect: "json-schema-2020-12-subset",
    schema: Object.freeze({ type: "object", additionalProperties: false }),
  };
  const reservationDescriptor: CanonicalResourceReservationDescriptorV11 = {
    descriptorVersion: "1.0.0",
    reservationId: `${manifest.moduleId}.resources`,
    strategy: "constant",
    fields: [],
  };
  return Object.freeze({
    manifest,
    configurationSchema,
    configurationDescriptor: Object.freeze(configurationDescriptor),
    reservationDescriptor: Object.freeze(reservationDescriptor),
    reservationEvaluator(configuration: unknown) {
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

export const BATCH2_DEFENSE_DEFINITIONS = Object.freeze([
  definition(
    invulnerabilityManifest,
    InvulnerabilityConfigurationSchema,
    sources.invulnerability,
  ),
  definition(shieldManifest, ShieldConfigurationSchema, sources.shield),
  definition(grazeManifest, GrazeConfigurationSchema, sources.graze),
]);

const lockIdentity = new TextEncoder().encode("pnpm-lock.batch2.defense.v1");
const toolchainIdentity = new TextEncoder().encode(
  "typescript-5.9.3.esm-self-contained.batch2.defense.v1",
);

export async function registerBatch2DefenseDefinitions(
  registry: GameModuleRegistry,
): Promise<void> {
  const loader = new TrustedGameModuleExecutableLoader();
  for (const item of BATCH2_DEFENSE_DEFINITIONS) {
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

export async function createBatch2DefenseRegistry(): Promise<GameModuleRegistry> {
  const registry = new GameModuleRegistry();
  await registerBatch2DefenseDefinitions(registry);
  return registry;
}
