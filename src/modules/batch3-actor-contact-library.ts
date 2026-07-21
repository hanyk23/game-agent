import { createHash } from "node:crypto";

import { z } from "zod";

import { BATCH1_MODULE_DEFINITIONS } from "./batch1-gameplay-library.js";
import {
  GameModuleManifestV14Schema,
  type GameModuleManifestV14,
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
  sourceActorRoles: Object.freeze([
    "player" as const,
    "enemy" as const,
    "boss" as const,
  ]),
  targetActorRoles: Object.freeze([
    "player" as const,
    "enemy" as const,
    "boss" as const,
  ]),
  sourceEntityRoles: Object.freeze([]),
});
const playerProjectileToHostileAuthorization = Object.freeze({
  ownerRelation: "different-owner" as const,
  sourceActorRoles: Object.freeze(["player" as const]),
  targetActorRoles: Object.freeze(["enemy" as const, "boss" as const]),
  sourceEntityRoles: Object.freeze(["projectile"]),
});
const opposingRootAuthorization = Object.freeze({
  ownerRelation: "different-owner" as const,
  sourceActorRoles: Object.freeze(["enemy" as const, "boss" as const]),
  targetActorRoles: Object.freeze(["player" as const]),
  sourceEntityRoles: Object.freeze([]),
});
const noResources = Object.freeze({
  activeEntities: 0,
  activeProjectiles: 0,
  spawnsPerSecond: 0,
  timers: 0,
});
const zeroReservation: CanonicalResourceReservationDescriptorV11 = {
  descriptorVersion: "1.0.0",
  reservationId: "batch3.actor-contact.zero",
  strategy: "constant",
  fields: [],
};

function baseManifest() {
  return BATCH1_MODULE_DEFINITIONS.find(
    (entry) => entry.manifest.kind === "player-intent",
  )!.manifest;
}

function manifest(
  overrides: Readonly<Record<string, unknown>>,
): GameModuleManifestV14 {
  return GameModuleManifestV14Schema.parse(
    JSON.parse(
      JSON.stringify({
        ...structuredClone(baseManifest()),
        schemaVersion: "1.4.0",
        kind: "combat-interaction",
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
        resources: noResources,
        runtimeLeases: { startLeases: 2, instanceLeases: 2, graphLeases: 0 },
        runtimeContract: {
          update: null,
          timerSlots: { slotGroupId: "main" },
          inputRegistrations: [],
          observationReaders: [],
          contactCommit: null,
        },
        browserSupport: { desktop: true, touch: true },
        evidence: {
          provenanceId: "agent.batch3.reviewed",
          testSuiteId: "modules.batch3.actor-contact",
        },
        ...overrides,
      }),
    ) as unknown,
  );
}

const input = (
  id: string,
  payloadType: string,
  delivery: "event" | "state",
  portAuthorization: Readonly<{
    ownerRelation: "same-owner" | "different-owner";
    sourceActorRoles: readonly (
      "player" | "enemy" | "boss" | "companion" | "world"
    )[];
    targetActorRoles: readonly (
      "player" | "enemy" | "boss" | "companion" | "world"
    )[];
    sourceEntityRoles: readonly string[];
  }> = authorization,
) => ({
  id,
  payloadType,
  required: true,
  multiple: delivery === "event",
  delivery,
  authorization: portAuthorization,
});
const event = (id: string, payloadType: string) => ({
  id,
  payloadType,
  delivery: "event" as const,
});
const state = (id: string, payloadType: string) => ({
  id,
  payloadType,
  delivery: "state" as const,
});
const rootConsumers = (
  purpose: "health-bank" | "projectile-target" | "body-contact",
) => [
  {
    consumerId: `enemy.${purpose}`,
    rootChannelInputPort: "roots",
    expectedActorRole: "enemy" as const,
    purpose,
    maximumEntries: 256,
  },
  {
    consumerId: `boss.${purpose}`,
    rootChannelInputPort: "roots",
    expectedActorRole: "boss" as const,
    purpose,
    maximumEntries: 1,
  },
];

const healthManifest = manifest({
  moduleId: "combat.health",
  version: "1.2.0",
  implementationId: "combat.health.actor-set.v1",
  configurationSchemaId: "combat.health.actor-set.config",
  provides: [
    { id: "combat.actor-set-damage-sink", version: "1.0.0", scope: "owner" },
  ],
  inputPorts: [
    input("roots", "actor-root-channel-v1", "state"),
    { ...input("damage", "damage-v2", "event"), required: false },
  ],
  outputPorts: [
    state("health", "health-state-v3"),
    event("defeated", "actor-defeated-v1"),
  ],
  runtimeContract: {
    update: null,
    timerSlots: { slotGroupId: "main" },
    inputRegistrations: [],
    observationReaders: [{ readerId: "health" }],
    contactCommit: null,
  },
  runtimeLeases: { startLeases: 2, instanceLeases: 3, graphLeases: 0 },
  actorRootConsumers: rootConsumers("health-bank"),
  actorSetDamageSink: {
    rootChannelInputPort: "roots",
    damageInputPort: "damage",
    healthStateOutputPort: "health",
    defeatedOutputPort: "defeated",
    maximumEntriesSource: "resolved-root-channel-capacity",
  },
});

const projectileRootContactManifest = manifest({
  moduleId: "interaction.projectile-root-contact",
  version: "1.0.0",
  implementationId: "interaction.projectile-root-contact.v1",
  configurationSchemaId: "interaction.projectile-root-contact.config",
  cardinality: {
    maximumInstancesPerAssembly: 64,
    maximumInstancesPerOwner: 16,
  },
  provides: [
    {
      id: "interaction.projectile-root-candidate",
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
    input(
      "projectiles",
      "entity-channel-v1",
      "state",
      playerProjectileToHostileAuthorization,
    ),
    input("roots", "actor-root-channel-v1", "state"),
  ],
  outputPorts: [event("candidates", "contact-candidate-v2")],
  runtimeLeases: { startLeases: 4, instanceLeases: 2, graphLeases: 0 },
  runtimeContract: {
    update: {
      mode: "graph-frame-v1",
      registrationId: "projectile-root.update",
    },
    timerSlots: { slotGroupId: "main" },
    inputRegistrations: [],
    observationReaders: [{ readerId: "projectile-root-contacts" }],
    contactCommit: null,
  },
  contactDetector: {
    sourceChannelInputPort: "projectiles",
    candidateOutputPort: "candidates",
    ruleId: "projectile.overlap",
  },
  projectileChannelConsumer: {
    role: "contact-detector",
    sourceChannelInputPort: "projectiles",
    candidateOutputPort: "candidates",
    requiredCapability: "delivery.projectile-channel@1.0.0",
    sourceEntityRole: "projectile",
  },
  actorRootConsumers: rootConsumers("projectile-target"),
});

const actorRootContactManifest = manifest({
  moduleId: "interaction.actor-root-contact",
  version: "1.0.0",
  implementationId: "interaction.actor-root-contact.v1",
  configurationSchemaId: "interaction.actor-root-contact.config",
  cardinality: {
    maximumInstancesPerAssembly: 64,
    maximumInstancesPerOwner: 16,
  },
  provides: [
    {
      id: "interaction.actor-root-candidate",
      version: "1.0.0",
      scope: "owner",
    },
  ],
  inputPorts: [
    input("roots", "actor-root-channel-v1", "state", opposingRootAuthorization),
  ],
  outputPorts: [event("candidates", "contact-candidate-v2")],
  runtimeLeases: { startLeases: 3, instanceLeases: 2, graphLeases: 0 },
  runtimeContract: {
    update: { mode: "graph-frame-v1", registrationId: "actor-root.update" },
    timerSlots: { slotGroupId: "main" },
    inputRegistrations: [],
    observationReaders: [{ readerId: "actor-root-contacts" }],
    contactCommit: null,
  },
  actorRootConsumers: rootConsumers("body-contact"),
  actorRootContactConsumer: {
    rootChannelInputPort: "roots",
    candidateOutputPort: "candidates",
    admittedSourceOperation: "deactivate-root",
  },
});

const defaultDamageManifest = manifest({
  moduleId: "interaction.contact-default-damage",
  version: "1.1.0",
  implementationId: "interaction.contact-default-damage.v1-1",
  configurationSchemaId: "interaction.contact-default-damage.v1-1.config",
  cardinality: {
    maximumInstancesPerAssembly: 64,
    maximumInstancesPerOwner: 16,
  },
  provides: [
    { id: "interaction.contact-decision-v2", version: "1.0.0", scope: "owner" },
  ],
  inputPorts: [input("candidates", "contact-candidate-v2", "event")],
  outputPorts: [event("decisions", "contact-decision-v2")],
});

const resolutionManifest = manifest({
  moduleId: "interaction.contact-resolution",
  version: "1.2.0",
  implementationId: "interaction.contact-resolution.v1-2",
  configurationSchemaId: "interaction.contact-resolution.v1-2.config",
  cardinality: {
    maximumInstancesPerAssembly: 64,
    maximumInstancesPerOwner: 16,
  },
  requires: [
    {
      id: "interaction.contact-decision-v2",
      versionRange: "1.0.0",
      cardinality: "exactly-one",
      scope: "owner",
    },
  ],
  inputPorts: [input("decisions", "contact-decision-v2", "event")],
  outputPorts: [],
  runtimeLeases: { startLeases: 2, instanceLeases: 3, graphLeases: 0 },
  runtimeContract: {
    update: null,
    timerSlots: { slotGroupId: "main" },
    inputRegistrations: [],
    observationReaders: [{ readerId: "contact-resolution-v2" }],
    contactCommit: null,
  },
});

const healthConfiguration = z.strictObject({
  damageRouteId: logicalId,
  maximumHealthBySourceId: z.record(
    logicalId,
    z.number().finite().positive().max(Number.MAX_SAFE_INTEGER),
  ),
});
const detectorConfiguration = z.strictObject({
  maximumTrackedContacts: z.number().int().min(1).max(10_000),
});
const defaultDamageConfiguration = z.strictObject({
  projectileRootRouteId: logicalId,
  actorRootPlayerRouteId: logicalId,
});
const resolutionConfiguration = z.strictObject({
  maximumResolvedContacts: z.number().int().min(1).max(10_000),
});

const healthFactory = `export function create(context){const service=context.services.actorSetHealth;if(!service||typeof service.damage!=="function")throw new Error("missing actor-set health service");const routeId=context.configuration.damageRouteId;context.ports.declareHandler("roots",()=>{});context.ports.declareHandler("damage",payload=>{const result=service.damage(routeId,payload);context.ports.publishState("health",result.state);if(result.defeated)context.ports.emitEvent("defeated",result.defeated);});return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("health",()=>service.snapshot?service.snapshot():Object.freeze({}));}});}`;
const projectileRootContactFactory = `export function create(context){const config=context.configuration;let projectiles,roots,remove,sequence=0;const seen=new Set();context.ports.declareHandler("projectiles",value=>{projectiles=value;});context.ports.declareHandler("roots",value=>{roots=value;});const emit=raw=>{if(!projectiles||!roots)throw new Error("projectile-root overlap before channel binding");const key=raw.sourceEntityId+":"+raw.sourceGeneration+":"+raw.targetActorId+":"+raw.targetActorGeneration;if(seen.has(key))return;if(seen.size>=config.maximumTrackedContacts)throw new Error("projectile-root contact ledger exhausted");seen.add(key);const n=sequence++;context.ports.emitEvent("candidates",Object.freeze({sequence:n,emittedAtMs:context.clock.nowMs(),contactId:"projectile-root."+n,contactSequence:n,damage:raw.damage,contactKind:"projectile-root",sourceChannelId:projectiles.channelId,sourceEntityId:raw.sourceEntityId,sourceGeneration:raw.sourceGeneration,sourceActorId:projectiles.ownerActorId,targetRootChannelId:roots.rootChannelId,targetActorId:raw.targetActorId,targetActorGeneration:raw.targetActorGeneration}));};return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("projectile-root-contacts",()=>Object.freeze({sequence,tracked:seen.size}));},start(){remove=context.services.overlaps.register("projectile.overlap",emit);},update(){},stop(){if(remove)remove();remove=undefined;seen.clear();},dispose(){if(remove)remove();remove=undefined;seen.clear();}});}`;
const actorRootContactFactory = `export function create(context){const config=context.configuration;const service=context.services.contactCandidates;if(!service||typeof service.register!=="function")throw new Error("missing contact candidate service");let roots,remove,sequence=0;const seen=new Set();context.ports.declareHandler("roots",value=>{roots=value;});const emit=raw=>{if(!roots)throw new Error("actor-root overlap before channel binding");const key=raw.sourceActorId+":"+raw.sourceActorGeneration+":"+raw.targetActorId;if(seen.has(key))return;if(seen.size>=config.maximumTrackedContacts)throw new Error("actor-root contact ledger exhausted");seen.add(key);const n=sequence++;context.ports.emitEvent("candidates",Object.freeze({sequence:n,emittedAtMs:context.clock.nowMs(),contactId:"actor-root-player."+n,contactSequence:n,damage:raw.damage,contactKind:"actor-root-player",sourceRootChannelId:roots.rootChannelId,sourceActorId:raw.sourceActorId,sourceActorGeneration:raw.sourceActorGeneration,targetActorId:raw.targetActorId}));};return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("actor-root-contacts",()=>Object.freeze({sequence,tracked:seen.size}));},start(){remove=service.register(emit);},update(){},stop(){if(remove)remove();remove=undefined;seen.clear();},dispose(){if(remove)remove();remove=undefined;seen.clear();}});}`;
const defaultDamageFactory = `export function create(context){const config=context.configuration;context.ports.declareHandler("candidates",candidate=>{const projectile=candidate.contactKind==="projectile-root";context.ports.emitEvent("decisions",Object.freeze({candidate,disposition:"damage",sourceOperation:projectile?"consume":"deactivate-root",damage:candidate.damage,routeId:projectile?config.projectileRootRouteId:config.actorRootPlayerRouteId}));});return Object.freeze({instanceId:context.identity.instanceId});}`;
const resolutionFactory = `export function create(context){const service=context.services.contactCommitV2;if(!service||typeof service.commit!=="function")throw new Error("missing V2 contact commit service");let resolved=0;context.ports.declareHandler("decisions",decision=>{if(resolved>=context.configuration.maximumResolvedContacts)throw new Error("V2 contact resolution ceiling exceeded");service.commit(decision);resolved++;});return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("contact-resolution-v2",()=>Object.freeze({resolved}));},dispose(){resolved=0;}});}`;

type Definition = Readonly<{
  manifest: GameModuleManifestV14;
  configurationSchema: z.ZodType<Record<string, unknown>>;
  configurationDescriptor: CanonicalConfigurationDescriptor;
  reservationDescriptor: CanonicalResourceReservationDescriptorV11;
  reservationEvaluator(configuration: unknown): unknown;
  implementationSource: string;
  exportName: "create";
  exportKind: "lifecycle-create-v1";
}>;

function definition(
  manifestValue: GameModuleManifestV14,
  configurationSchema: z.ZodType<Record<string, unknown>>,
  implementationSource: string,
): Definition {
  const configurationDescriptor: CanonicalConfigurationDescriptor = {
    descriptorVersion: "1.0.0",
    schemaId: manifestValue.configurationSchemaId,
    dialect: "json-schema-2020-12-subset",
    schema: Object.freeze({ type: "object", additionalProperties: false }),
  };
  return Object.freeze({
    manifest: manifestValue,
    configurationSchema,
    configurationDescriptor,
    reservationDescriptor: zeroReservation,
    reservationEvaluator(configuration) {
      return evaluateCanonicalResourceReservationV11(
        zeroReservation,
        configurationSchema.parse(configuration),
      );
    },
    implementationSource,
    exportName: "create",
    exportKind: "lifecycle-create-v1",
  });
}

export const BATCH3_ACTOR_CONTACT_DEFINITIONS = Object.freeze([
  definition(
    healthManifest,
    healthConfiguration as z.ZodType<Record<string, unknown>>,
    healthFactory,
  ),
  definition(
    projectileRootContactManifest,
    detectorConfiguration as z.ZodType<Record<string, unknown>>,
    projectileRootContactFactory,
  ),
  definition(
    actorRootContactManifest,
    detectorConfiguration as z.ZodType<Record<string, unknown>>,
    actorRootContactFactory,
  ),
  definition(
    defaultDamageManifest,
    defaultDamageConfiguration as z.ZodType<Record<string, unknown>>,
    defaultDamageFactory,
  ),
  definition(
    resolutionManifest,
    resolutionConfiguration as z.ZodType<Record<string, unknown>>,
    resolutionFactory,
  ),
]);

const lockIdentity = new TextEncoder().encode(
  "pnpm-lock.batch3.actor-contact.v1",
);
const toolchainIdentity = new TextEncoder().encode(
  "typescript-5.9.3.esm-self-contained.batch3.actor-contact.v1",
);

export async function registerBatch3ActorContactDefinitions(
  registry: GameModuleRegistry,
): Promise<void> {
  const loader = new TrustedGameModuleExecutableLoader();
  for (const item of BATCH3_ACTOR_CONTACT_DEFINITIONS) {
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

export async function createBatch3ActorContactRegistry(): Promise<GameModuleRegistry> {
  const registry = new GameModuleRegistry();
  await registerBatch3ActorContactDefinitions(registry);
  return registry;
}
