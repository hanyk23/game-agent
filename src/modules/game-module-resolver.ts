import { z } from "zod";

import {
  GameAssemblySpecSchema,
  GameAssemblySpecV13Schema,
  type GameAssemblySpec,
  type GameAssemblySpecV12,
  type GameAssemblySpecV13,
  type GameModuleManifest,
  type GameModuleManifestV11,
  type GameModuleManifestV12,
  type GameModuleManifestV13,
  type ModuleResourceBudget,
  type RuntimeLeaseCeilings,
  versionSatisfiesRange,
} from "./game-module-contract.js";
import {
  ArtifactHashDescriptorSchema,
  type ArtifactHashDescriptor,
  type DamageSinkDescriptor,
  sha256CanonicalJson,
} from "./game-module-execution-contract.js";
import {
  GameModuleRegistry,
  type RegisteredGameModule,
  type RegisteredGameModuleV14,
} from "./game-module-registry.js";

export const ModuleResolutionErrorCode = {
  assemblyInvalid: "assembly-invalid",
  missingModule: "missing-module",
  ambiguousVersion: "ambiguous-version",
  incompatibleKernel: "incompatible-kernel",
  incompatibleEngine: "incompatible-engine",
  invalidConfiguration: "invalid-configuration",
  moduleCardinality: "module-cardinality",
  missingDependency: "missing-dependency",
  ambiguousDependency: "ambiguous-dependency",
  dependencyCycle: "dependency-cycle",
  moduleConflict: "module-conflict",
  missingCapability: "missing-capability",
  ambiguousCapability: "ambiguous-capability",
  duplicateOwnership: "duplicate-ownership",
  unknownPort: "unknown-port",
  portTypeMismatch: "port-type-mismatch",
  duplicateBinding: "duplicate-binding",
  missingRequiredPort: "missing-required-port",
  resourceBudgetExceeded: "resource-budget-exceeded",
  manifestGenerationMismatch: "manifest-generation-mismatch",
  endpointUnauthorized: "endpoint-unauthorized",
  deliveryMismatch: "delivery-mismatch",
  synchronousEventCycle: "synchronous-event-cycle",
  missingPolicyProfile: "missing-policy-profile",
  invalidPolicyOrder: "invalid-policy-order",
  missingDamageSinkRoute: "missing-damage-sink-route",
  invalidDamageSinkRoute: "invalid-damage-sink-route",
  invalidResourceReservation: "invalid-resource-reservation",
  invalidEntityChannel: "invalid-entity-channel",
  missingEntityMutationGrant: "missing-entity-mutation-grant",
  invalidEntityMutationGrant: "invalid-entity-mutation-grant",
  invalidContactLineage: "invalid-contact-lineage",
  incompatibleContractVersion: "incompatible-contract-version",
  invalidAssetBinding: "invalid-asset-binding",
  invalidAttackChannel: "invalid-attack-channel",
  invalidActorSnapshotGrant: "invalid-actor-snapshot-grant",
  invalidEntityChannelReadGrant: "invalid-entity-channel-read-grant",
  invalidProjectileChannelLineage: "invalid-projectile-channel-lineage",
  invalidEffectApplicationRoute: "invalid-effect-application-route",
  invalidEffectPlanSelection: "invalid-effect-plan-selection",
  invalidModifierTarget: "invalid-modifier-target",
} as const;

export type ModuleResolutionErrorCode =
  (typeof ModuleResolutionErrorCode)[keyof typeof ModuleResolutionErrorCode];

export class ModuleResolutionError extends Error {
  constructor(
    readonly code: ModuleResolutionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ModuleResolutionError";
  }
}

type SelectedModule = Readonly<{
  instanceId: string;
  ownerId: string;
  registration: RegisteredGameModule | RegisteredGameModuleV14;
  configuration: unknown;
  resourceGrant: ModuleResourceBudget;
}>;

export type ResolvedGameModule = Readonly<{
  instanceId: string;
  ownerId: string;
  moduleId: string;
  version: string;
  kind: GameModuleManifest["kind"];
  implementationId: string;
  configurationSchemaId: string;
  configuration: unknown;
  manifestSchemaVersion: "1.0.0" | "1.1.0" | "1.2.0" | "1.3.0" | "1.4.0";
  instantiation: "fixture-only" | "production-eligible";
  manifestSha256: string;
  resources: ModuleResourceBudget;
  resourceGrant: ModuleResourceBudget;
  artifactIdentity?: ArtifactHashDescriptor;
  runtimeLeaseCeilings: RuntimeLeaseCeilings;
}>;

export type ResolvedPortBinding = Readonly<{
  from: GameAssemblySpec["bindings"][number]["from"];
  to: GameAssemblySpec["bindings"][number]["to"];
  payloadType: GameModuleManifest["outputPorts"][number]["payloadType"];
  delivery: "legacy-event" | "state" | "event";
}>;

export type ResolvedDamageSinkRoute = Readonly<{
  ownerId: string;
  headInstanceId: string;
  orderedSinkInstanceIds: readonly string[];
  terminalHealthInstanceId: string;
  producerInstanceIds: readonly string[];
}>;

export type ResolvedContactPolicyProfile = Readonly<{
  consumerInstanceId: string;
  profileId: string;
  version: string;
  evidenceHash: string;
  supportedChainEvidenceId: string;
  orderedPolicyInstanceIds: readonly string[];
  orderedPolicyArtifactHashes: readonly string[];
}>;

export type ResolvedEntityChannel = Readonly<{
  channelId: string;
  localChannelId: string;
  ownerInstanceId: string;
  ownerActorId: string;
  outputPort: string;
  entityRole: string;
  capacity: number;
  capacityResources: readonly ("activeEntities" | "activeProjectiles")[];
  readerInstanceIds: readonly string[];
  sourceArtifactEnvelopeSha256?: string;
}>;

export type ResolvedEntityMutationGrant = Readonly<{
  grantId: string;
  accessId: string;
  granteeInstanceId: string;
  channelId: string;
  operations: readonly ("consume" | "transfer")[];
  transferRecipientActorIds: readonly string[];
}>;

export type ResolvedModuleGraph = Readonly<{
  graphVersion: "1.1.0";
  assemblyId: string;
  kernelVersion: string;
  engine: Readonly<{ id: "phaser"; version: string }>;
  productionInstantiationAllowed: boolean;
  actors: readonly GameAssemblySpec["actors"][number][];
  assetRoles: readonly Readonly<{
    roleId: string;
    category: GameAssemblySpec["assetRoles"][number]["category"];
    requiredByInstanceIds: readonly string[];
  }>[];
  modules: readonly ResolvedGameModule[];
  dependencyEdges: readonly Readonly<{ from: string; to: string }>[];
  capabilityEdges: readonly Readonly<{
    from: string;
    to: string;
    capabilityId: string;
    scope: "owner" | "assembly" | "legacy-assembly";
  }>[];
  bindings: readonly ResolvedPortBinding[];
  constructionOrder: readonly string[];
  contactPolicyProfiles: readonly ResolvedContactPolicyProfile[];
  damageSinkRoutes: readonly ResolvedDamageSinkRoute[];
  entityChannels: readonly ResolvedEntityChannel[];
  entityMutationGrants: readonly ResolvedEntityMutationGrant[];
  resourceTotals: ModuleResourceBudget;
}>;

export type GraphExecutionReadiness = Readonly<{
  status: "ready" | "blocked";
  evidenceId: string;
}>;

export type ExecutionReadinessReport = Readonly<{
  graphEvidenceId: string;
  status: "ready" | "blocked";
  blockers: readonly Readonly<{
    instanceId: string;
    code: string;
    evidenceId?: string;
  }>[];
}>;

export type ResolvedAssemblyAssetBindingV12 = Readonly<{
  bindingId: string;
  roleId: string;
  category: string;
  runtimeSha256: string;
  textureKey: string;
  sharing: "instance" | "assembly";
  consumerInstanceIds: readonly string[];
  approvedSharingEvidenceId?: string;
}>;

export type ResolvedModuleGraphV12 = Readonly<{
  graphVersion: "1.2.0";
  assemblyId: string;
  kernelVersion: string;
  engine: Readonly<{ id: "phaser"; version: string }>;
  executionReadiness: GraphExecutionReadiness;
  catalogEvidenceId: string;
  actors: ResolvedModuleGraph["actors"];
  modules: readonly Readonly<
    ResolvedGameModule & {
      runtimeContract?: GameModuleManifestV12["runtimeContract"];
      runtimePorts?: Readonly<{
        inputPorts: GameModuleManifestV12["inputPorts"];
        outputPorts: GameModuleManifestV12["outputPorts"];
      }>;
      runtimeAuthorities?: Readonly<{
        inputRegistrationIds: readonly string[];
        observationReaderIds: readonly string[];
        ownedChannelIds: readonly string[];
        ownsPlayerLocomotion: boolean;
        overlapRuleId?: string;
      }>;
      catalogEntryEvidenceId?: string;
    }
  >[];
  dependencyEdges: ResolvedModuleGraph["dependencyEdges"];
  capabilityEdges: ResolvedModuleGraph["capabilityEdges"];
  bindings: ResolvedModuleGraph["bindings"];
  constructionOrder: readonly string[];
  assetBindings: readonly ResolvedAssemblyAssetBindingV12[];
  contactPolicyProfiles: ResolvedModuleGraph["contactPolicyProfiles"];
  damageSinkRoutes: ResolvedModuleGraph["damageSinkRoutes"];
  entityChannels: ResolvedModuleGraph["entityChannels"];
  entityMutationGrants: ResolvedModuleGraph["entityMutationGrants"];
  resourceTotals: ModuleResourceBudget;
}>;

export type ResolvedModuleGraphV12Result = Readonly<{
  graph: ResolvedModuleGraphV12;
  readinessReport: ExecutionReadinessReport;
}>;

export type ResolvedAttackChannelV13 = Readonly<{
  ownerActorId: string;
  attackChannelId: string;
  targetingInstanceId: string;
  triggerInstanceId: string;
  deliveryInstanceId: string;
  targetBinding: ResolvedPortBinding;
  requestBinding: ResolvedPortBinding;
}>;

export type ResolvedActorSnapshotGrantV13 = Readonly<{
  grantId: string;
  instanceId: string;
  ownerActorId: string;
  descriptor: GameModuleManifestV13["actorSnapshotReads"][number];
}>;

export type ResolvedEntityChannelReadGrantV13 = Readonly<{
  grantId: string;
  instanceId: string;
  channelId: string;
  maximumEntries: number;
  descriptor: GameModuleManifestV13["entityChannelReads"][number];
}>;

export type ResolvedProjectileChannelLineageV13 = Readonly<{
  lineageId: string;
  providerInstanceId: string;
  providerCapabilityId: "delivery.projectile-channel";
  sourceBinding: ResolvedPortBinding;
  channelId: string;
  channelOutputPort: string;
  consumerInstanceId: string;
  consumerInputPort: string;
}>;

export type ResolvedEffectApplicationRouteV13 = Readonly<{
  routeId: string;
  bindingId: string;
  sourceInstanceId: string;
  applicationRouteSourceId: string;
  targetInstanceId: string;
  targetInputPort: string;
  fieldId: GameAssemblySpecV12["effectApplicationBindings"][number]["fieldId"];
  operation: "add";
  payloadType: "modifier-application-v1";
  targetLeaseId: string;
}>;

export type ResolvedPickupEffectPlanV13 = Readonly<{
  commitInstanceId: string;
  transformInstanceId: string;
  profileId: string;
  mutationChannelId: string;
  mutationGrantId: string;
  maximumApplicationsPerCommit: number;
  routeIds: readonly string[];
}>;

export type ResolvedProjectileBudgetContentionV13 = Readonly<{
  budget: Readonly<{
    activeProjectiles: number;
    spawnsPerSecond: number;
  }>;
  totals: Readonly<{
    activeProjectiles: number;
    spawnsPerSecond: number;
  }>;
  orderedOwners: readonly Readonly<{
    resolvedOrder: number;
    instanceId: string;
    ownerActorId: string;
    attackChannelId: string;
    channelId: string;
    poolId: string;
    activeProjectiles: number;
    spawnsPerSecond: number;
    cumulativeActiveProjectiles: number;
    cumulativeSpawnsPerSecond: number;
  }>[];
}>;

export type ResolvedModuleGraphV13 = Readonly<{
  graphVersion: "1.3.0";
  assemblyId: string;
  kernelVersion: string;
  engine: Readonly<{ id: "phaser"; version: string }>;
  executionReadiness: GraphExecutionReadiness;
  catalogEvidenceId: string;
  actors: ResolvedModuleGraph["actors"];
  modules: readonly Readonly<
    ResolvedGameModule & {
      manifestSchemaVersion: "1.2.0" | "1.3.0";
      factoryContextVersion: "1.2.0" | "1.3.0";
      runtimeContract: GameModuleManifestV12["runtimeContract"];
      runtimePorts: Readonly<{
        inputPorts:
          | GameModuleManifestV12["inputPorts"]
          | GameModuleManifestV13["inputPorts"];
        outputPorts:
          | GameModuleManifestV12["outputPorts"]
          | GameModuleManifestV13["outputPorts"];
      }>;
      runtimeAuthorities: Readonly<{
        inputRegistrationIds: readonly string[];
        observationReaderIds: readonly string[];
        ownedChannelIds: readonly string[];
        ownsPlayerLocomotion: boolean;
        overlapRuleId?: string;
        modifierTargetFieldIds?: readonly string[];
      }>;
      catalogEntryEvidenceId?: string;
    }
  >[];
  dependencyEdges: ResolvedModuleGraph["dependencyEdges"];
  capabilityEdges: ResolvedModuleGraph["capabilityEdges"];
  bindings: ResolvedModuleGraph["bindings"];
  constructionOrder: readonly string[];
  assetBindings: readonly ResolvedAssemblyAssetBindingV12[];
  contactPolicyProfiles: ResolvedModuleGraph["contactPolicyProfiles"];
  damageSinkRoutes: ResolvedModuleGraph["damageSinkRoutes"];
  entityChannels: ResolvedModuleGraph["entityChannels"];
  entityMutationGrants: ResolvedModuleGraph["entityMutationGrants"];
  actorSnapshotGrants: readonly ResolvedActorSnapshotGrantV13[];
  entityChannelReadGrants: readonly ResolvedEntityChannelReadGrantV13[];
  attackChannels: readonly ResolvedAttackChannelV13[];
  projectileChannelLineages: readonly ResolvedProjectileChannelLineageV13[];
  effectApplicationRoutes: readonly ResolvedEffectApplicationRouteV13[];
  pickupEffectPlans: readonly ResolvedPickupEffectPlanV13[];
  projectileBudgetContention: ResolvedProjectileBudgetContentionV13;
  resourceTotals: ModuleResourceBudget;
}>;

export type ResolvedModuleGraphV13Result = Readonly<{
  graph: ResolvedModuleGraphV13;
  readinessReport: ExecutionReadinessReport;
}>;

const GraphV13EndpointSchema = z.strictObject({
  instanceId: z.string(),
  portId: z.string(),
});
const GraphV13BindingSchema = z.strictObject({
  from: GraphV13EndpointSchema,
  to: GraphV13EndpointSchema,
  payloadType: z.string(),
  delivery: z.enum(["legacy-event", "state", "event"]),
});
const GraphV13ResourceBudgetSchema = z.strictObject({
  activeEntities: z.number().int().nonnegative(),
  activeProjectiles: z.number().int().nonnegative(),
  spawnsPerSecond: z.number().int().nonnegative(),
  timers: z.number().int().nonnegative(),
});
const GraphV13ModuleSchema = z.strictObject({
  instanceId: z.string(),
  ownerId: z.string(),
  moduleId: z.string(),
  version: z.string(),
  kind: z.string(),
  implementationId: z.string(),
  configurationSchemaId: z.string(),
  configuration: z.unknown(),
  manifestSchemaVersion: z.enum(["1.2.0", "1.3.0"]),
  factoryContextVersion: z.enum(["1.2.0", "1.3.0"]),
  instantiation: z.enum(["fixture-only", "production-eligible"]),
  manifestSha256: z.string(),
  resources: GraphV13ResourceBudgetSchema,
  resourceGrant: GraphV13ResourceBudgetSchema,
  artifactIdentity: ArtifactHashDescriptorSchema.optional(),
  runtimeLeaseCeilings: z.strictObject({
    startLeases: z.number().int().nonnegative(),
    instanceLeases: z.number().int().nonnegative(),
    graphLeases: z.number().int().nonnegative(),
  }),
  runtimeContract: z.unknown(),
  runtimePorts: z.strictObject({
    inputPorts: z.array(z.unknown()),
    outputPorts: z.array(z.unknown()),
  }),
  runtimeAuthorities: z.strictObject({
    inputRegistrationIds: z.array(z.string()),
    observationReaderIds: z.array(z.string()),
    ownedChannelIds: z.array(z.string()),
    ownsPlayerLocomotion: z.boolean(),
    overlapRuleId: z.string().optional(),
    modifierTargetFieldIds: z.array(z.string()).optional(),
  }),
  catalogEntryEvidenceId: z.string().optional(),
});

/** Strict serialized boundary for the Node-resolved Graph 1.3 artifact. */
export const ResolvedModuleGraphV13Schema = z.strictObject({
  graphVersion: z.literal("1.3.0"),
  assemblyId: z.string(),
  kernelVersion: z.string(),
  engine: z.strictObject({ id: z.literal("phaser"), version: z.string() }),
  executionReadiness: z.strictObject({
    status: z.enum(["ready", "blocked"]),
    evidenceId: z.string(),
  }),
  catalogEvidenceId: z.string(),
  actors: z.array(z.strictObject({ actorId: z.string(), role: z.string() })),
  modules: z.array(GraphV13ModuleSchema),
  dependencyEdges: z.array(
    z.strictObject({ from: z.string(), to: z.string() }),
  ),
  capabilityEdges: z.array(
    z.strictObject({
      from: z.string(),
      to: z.string(),
      capabilityId: z.string(),
      scope: z.enum(["owner", "assembly", "legacy-assembly"]),
    }),
  ),
  bindings: z.array(GraphV13BindingSchema),
  constructionOrder: z.array(z.string()),
  assetBindings: z.array(
    z.strictObject({
      bindingId: z.string(),
      roleId: z.string(),
      category: z.string(),
      runtimeSha256: z.string(),
      textureKey: z.string(),
      sharing: z.enum(["instance", "assembly"]),
      consumerInstanceIds: z.array(z.string()),
      approvedSharingEvidenceId: z.string().optional(),
    }),
  ),
  contactPolicyProfiles: z.array(
    z.strictObject({
      consumerInstanceId: z.string(),
      profileId: z.string(),
      version: z.string(),
      evidenceHash: z.string(),
      supportedChainEvidenceId: z.string(),
      orderedPolicyInstanceIds: z.array(z.string()),
      orderedPolicyArtifactHashes: z.array(z.string()),
    }),
  ),
  damageSinkRoutes: z.array(
    z.strictObject({
      ownerId: z.string(),
      headInstanceId: z.string(),
      orderedSinkInstanceIds: z.array(z.string()),
      terminalHealthInstanceId: z.string(),
      producerInstanceIds: z.array(z.string()),
    }),
  ),
  entityChannels: z.array(
    z.strictObject({
      channelId: z.string(),
      localChannelId: z.string(),
      ownerInstanceId: z.string(),
      ownerActorId: z.string(),
      outputPort: z.string(),
      entityRole: z.string(),
      capacity: z.number().int().nonnegative(),
      capacityResources: z.array(
        z.enum(["activeEntities", "activeProjectiles"]),
      ),
      readerInstanceIds: z.array(z.string()),
      sourceArtifactEnvelopeSha256: z.string().optional(),
    }),
  ),
  entityMutationGrants: z.array(
    z.strictObject({
      grantId: z.string(),
      accessId: z.string(),
      granteeInstanceId: z.string(),
      channelId: z.string(),
      operations: z.array(z.enum(["consume", "transfer"])),
      transferRecipientActorIds: z.array(z.string()),
    }),
  ),
  actorSnapshotGrants: z.array(
    z.strictObject({
      grantId: z.string(),
      instanceId: z.string(),
      ownerActorId: z.string(),
      descriptor: z.unknown(),
    }),
  ),
  entityChannelReadGrants: z.array(
    z.strictObject({
      grantId: z.string(),
      instanceId: z.string(),
      channelId: z.string(),
      maximumEntries: z.number().int().nonnegative(),
      descriptor: z.unknown(),
    }),
  ),
  attackChannels: z.array(
    z.strictObject({
      ownerActorId: z.string(),
      attackChannelId: z.string(),
      targetingInstanceId: z.string(),
      triggerInstanceId: z.string(),
      deliveryInstanceId: z.string(),
      targetBinding: GraphV13BindingSchema,
      requestBinding: GraphV13BindingSchema,
    }),
  ),
  projectileChannelLineages: z.array(
    z.strictObject({
      lineageId: z.string(),
      providerInstanceId: z.string(),
      providerCapabilityId: z.literal("delivery.projectile-channel"),
      sourceBinding: GraphV13BindingSchema,
      channelId: z.string(),
      channelOutputPort: z.string(),
      consumerInstanceId: z.string(),
      consumerInputPort: z.string(),
    }),
  ),
  effectApplicationRoutes: z.array(
    z.strictObject({
      routeId: z.string(),
      bindingId: z.string(),
      sourceInstanceId: z.string(),
      applicationRouteSourceId: z.string(),
      targetInstanceId: z.string(),
      targetInputPort: z.string(),
      fieldId: z.string(),
      operation: z.literal("add"),
      payloadType: z.literal("modifier-application-v1"),
      targetLeaseId: z.string(),
    }),
  ),
  pickupEffectPlans: z.array(
    z.strictObject({
      commitInstanceId: z.string(),
      transformInstanceId: z.string(),
      profileId: z.string(),
      mutationChannelId: z.string(),
      mutationGrantId: z.string(),
      maximumApplicationsPerCommit: z.number().int().nonnegative(),
      routeIds: z.array(z.string()),
    }),
  ),
  projectileBudgetContention: z.strictObject({
    budget: z.strictObject({
      activeProjectiles: z.number().int().nonnegative(),
      spawnsPerSecond: z.number().int().nonnegative(),
    }),
    totals: z.strictObject({
      activeProjectiles: z.number().int().nonnegative(),
      spawnsPerSecond: z.number().int().nonnegative(),
    }),
    orderedOwners: z.array(
      z.strictObject({
        resolvedOrder: z.number().int().nonnegative(),
        instanceId: z.string(),
        ownerActorId: z.string(),
        attackChannelId: z.string(),
        channelId: z.string(),
        poolId: z.string(),
        activeProjectiles: z.number().int().nonnegative(),
        spawnsPerSecond: z.number().int().nonnegative(),
        cumulativeActiveProjectiles: z.number().int().nonnegative(),
        cumulativeSpawnsPerSecond: z.number().int().nonnegative(),
      }),
    ),
  }),
  resourceTotals: GraphV13ResourceBudgetSchema,
});

export type AdmittedModuleAssetEvidenceV12 = Readonly<{
  assetId: string;
  sourceSha256: string;
  runtimeSha256: string;
  provenanceId: string;
  licenseRecordId: string;
  attributionRecordId?: string;
}>;

export type ModuleAssetAdmissionEvidenceV12 = Readonly<{
  assets: readonly AdmittedModuleAssetEvidenceV12[];
  approvedSharingEvidenceIds: readonly string[];
}>;

function fail(code: ModuleResolutionErrorCode, message: string): never {
  throw new ModuleResolutionError(code, message);
}

function deepFreezeData<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreezeData(child);
    }
  }
  return value;
}

function selectModules(
  assembly: GameAssemblySpec,
  registry: GameModuleRegistry,
  includeV14 = false,
): readonly SelectedModule[] {
  return Object.freeze(
    assembly.modules.map((request) => {
      const matches = includeV14
        ? registry.findForGraphV14(request.moduleId, request.versionRange)
        : registry.find(request.moduleId, request.versionRange);
      if (matches.length === 0) {
        fail(
          ModuleResolutionErrorCode.missingModule,
          `no registered version satisfies ${request.moduleId}@${request.versionRange}`,
        );
      }
      if (matches.length > 1) {
        fail(
          ModuleResolutionErrorCode.ambiguousVersion,
          `multiple registered versions satisfy ${request.moduleId}@${request.versionRange}`,
        );
      }
      const registration = matches[0]!;
      const manifest = registration.manifest;
      if (
        !versionSatisfiesRange(
          assembly.kernelVersion,
          manifest.kernelVersionRange,
        )
      ) {
        fail(
          ModuleResolutionErrorCode.incompatibleKernel,
          `${request.instanceId} does not support kernel ${assembly.kernelVersion}`,
        );
      }
      if (
        assembly.engine.id !== manifest.engine.id ||
        !versionSatisfiesRange(
          assembly.engine.version,
          manifest.engine.versionRange,
        )
      ) {
        fail(
          ModuleResolutionErrorCode.incompatibleEngine,
          `${request.instanceId} does not support ${assembly.engine.id}@${assembly.engine.version}`,
        );
      }
      const parsedConfiguration = registration.configurationSchema.safeParse(
        request.configuration,
      );
      if (!parsedConfiguration.success) {
        fail(
          ModuleResolutionErrorCode.invalidConfiguration,
          `invalid configuration for ${request.instanceId}: ${parsedConfiguration.error.message}`,
        );
      }
      let resourceGrant: ModuleResourceBudget;
      try {
        resourceGrant = registration.evaluateResourceReservation(
          parsedConfiguration.data,
        );
      } catch (error) {
        fail(
          ModuleResolutionErrorCode.invalidResourceReservation,
          `invalid resource reservation for ${request.instanceId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      return Object.freeze({
        instanceId: request.instanceId,
        ownerId: request.ownerId,
        registration,
        configuration: deepFreezeData(parsedConfiguration.data),
        resourceGrant,
      });
    }),
  );
}

function validateCardinality(selected: readonly SelectedModule[]): void {
  for (const entry of selected) {
    const manifest = entry.registration.manifest;
    const assemblyCount = selected.filter(
      (candidate) =>
        candidate.registration.manifest.moduleId === manifest.moduleId,
    ).length;
    if (assemblyCount > manifest.cardinality.maximumInstancesPerAssembly) {
      fail(
        ModuleResolutionErrorCode.moduleCardinality,
        `${manifest.moduleId} exceeds its assembly cardinality`,
      );
    }
    const ownerCount = selected.filter(
      (candidate) =>
        candidate.ownerId === entry.ownerId &&
        candidate.registration.manifest.moduleId === manifest.moduleId,
    ).length;
    if (ownerCount > manifest.cardinality.maximumInstancesPerOwner) {
      fail(
        ModuleResolutionErrorCode.moduleCardinality,
        `${manifest.moduleId} exceeds cardinality for owner ${entry.ownerId}`,
      );
    }
  }
}

function validateConflicts(selected: readonly SelectedModule[]): void {
  const selectedModuleIds = new Set(
    selected.map((entry) => entry.registration.manifest.moduleId),
  );
  for (const entry of selected) {
    for (const conflict of entry.registration.manifest.conflicts) {
      if (selectedModuleIds.has(conflict)) {
        fail(
          ModuleResolutionErrorCode.moduleConflict,
          `${entry.instanceId} conflicts with ${conflict}`,
        );
      }
    }
  }
}

function validateOwnership(selected: readonly SelectedModule[]): void {
  const owners = new Map<string, string>();
  for (const entry of selected) {
    for (const domain of entry.registration.manifest.exclusiveOwnership) {
      const key = `${entry.ownerId}:${domain}`;
      const previous = owners.get(key);
      if (previous !== undefined) {
        fail(
          ModuleResolutionErrorCode.duplicateOwnership,
          `${entry.instanceId} and ${previous} both own ${domain} for ${entry.ownerId}`,
        );
      }
      owners.set(key, entry.instanceId);
    }
  }
}

function buildCapabilityEdges(
  assembly: GameAssemblySpec,
  selected: readonly SelectedModule[],
): readonly Readonly<{
  from: string;
  to: string;
  capabilityId: string;
  scope: "owner" | "assembly" | "legacy-assembly";
}>[] {
  const edges: Readonly<{
    from: string;
    to: string;
    capabilityId: string;
    scope: "owner" | "assembly" | "legacy-assembly";
  }>[] = [];
  const provided = selected.flatMap((entry) =>
    entry.registration.manifest.provides.map((capability) => ({
      instanceId: entry.instanceId,
      ownerId: entry.ownerId,
      manifestSchemaVersion: entry.registration.manifest.schemaVersion,
      capability,
    })),
  );
  for (const entry of selected) {
    for (const requirement of entry.registration.manifest.requires) {
      const requirementScope =
        "scope" in requirement ? requirement.scope : "legacy-assembly";
      let matches = provided.filter(
        (provider) =>
          provider.capability.id === requirement.id &&
          versionSatisfiesRange(
            provider.capability.version,
            requirement.versionRange,
          ) &&
          (requirementScope !== "owner" ||
            provider.ownerId === entry.ownerId) &&
          (!("scope" in provider.capability) ||
            requirementScope === "legacy-assembly" ||
            provider.capability.scope === requirementScope),
      );
      if (
        requirement.id === "combat.damage-sink" &&
        requirement.cardinality === "exactly-one" &&
        requirementScope === "owner"
      ) {
        const routeHead = (assembly.damageSinkRoutes ?? []).find(
          (route) => route.ownerId === entry.ownerId,
        )?.headInstanceId;
        if (routeHead !== undefined) {
          matches = matches.filter(
            (provider) => provider.instanceId === routeHead,
          );
        }
      }
      if (matches.length === 0) {
        fail(
          ModuleResolutionErrorCode.missingCapability,
          `${entry.instanceId} requires ${requirement.id}@${requirement.versionRange}`,
        );
      }
      if (requirement.cardinality === "exactly-one" && matches.length !== 1) {
        fail(
          ModuleResolutionErrorCode.ambiguousCapability,
          `${entry.instanceId} requires exactly one provider for ${requirement.id}`,
        );
      }
      for (const provider of matches) {
        edges.push(
          Object.freeze({
            from: entry.instanceId,
            to: provider.instanceId,
            capabilityId: requirement.id,
            scope: requirementScope,
          }),
        );
      }
    }
  }
  return Object.freeze(
    edges.sort(
      (left, right) =>
        left.from.localeCompare(right.from) ||
        left.to.localeCompare(right.to) ||
        left.capabilityId.localeCompare(right.capabilityId),
    ),
  );
}

function buildDependencyEdges(
  selected: readonly SelectedModule[],
): readonly Readonly<{ from: string; to: string }>[] {
  const edges: Readonly<{ from: string; to: string }>[] = [];
  for (const entry of selected) {
    for (const dependency of entry.registration.manifest.dependencies) {
      const matches = selected.filter(
        (candidate) =>
          candidate.registration.manifest.moduleId === dependency.moduleId &&
          (!("scope" in dependency) ||
            dependency.scope === "assembly" ||
            candidate.ownerId === entry.ownerId) &&
          versionSatisfiesRange(
            candidate.registration.manifest.version,
            dependency.versionRange,
          ),
      );
      if (matches.length === 0) {
        if (dependency.optional) continue;
        fail(
          ModuleResolutionErrorCode.missingDependency,
          `${entry.instanceId} requires ${dependency.moduleId}@${dependency.versionRange}`,
        );
      }
      if (matches.length > 1) {
        fail(
          ModuleResolutionErrorCode.ambiguousDependency,
          `${entry.instanceId} has multiple dependency instances for ${dependency.moduleId}`,
        );
      }
      edges.push(
        Object.freeze({
          from: entry.instanceId,
          to: matches[0]!.instanceId,
        }),
      );
    }
  }
  return Object.freeze(
    edges.sort(
      (left, right) =>
        left.from.localeCompare(right.from) || left.to.localeCompare(right.to),
    ),
  );
}

function validateAcyclicDependencies(
  selected: readonly SelectedModule[],
  edges: readonly Readonly<{ from: string; to: string }>[],
): void {
  const adjacency = new Map<string, readonly string[]>();
  for (const entry of selected) {
    adjacency.set(
      entry.instanceId,
      edges
        .filter((edge) => edge.from === entry.instanceId)
        .map((edge) => edge.to),
    );
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (instanceId: string): void => {
    if (visiting.has(instanceId)) {
      fail(
        ModuleResolutionErrorCode.dependencyCycle,
        `dependency cycle includes ${instanceId}`,
      );
    }
    if (visited.has(instanceId)) return;
    visiting.add(instanceId);
    for (const dependency of adjacency.get(instanceId) ?? []) visit(dependency);
    visiting.delete(instanceId);
    visited.add(instanceId);
  };
  for (const entry of selected) visit(entry.instanceId);
}

function validateBindings(
  assembly: GameAssemblySpec,
  selected: readonly SelectedModule[],
): readonly ResolvedPortBinding[] {
  const byInstanceId = new Map(
    selected.map((entry) => [entry.instanceId, entry] as const),
  );
  const actorRoles = new Map(
    assembly.actors.map((actor) => [actor.actorId, actor.role] as const),
  );
  const targetCounts = new Map<string, number>();
  const bindingKeys = new Set<string>();
  const resolved: ResolvedPortBinding[] = [];

  for (const binding of assembly.bindings) {
    const source = byInstanceId.get(binding.from.instanceId)!;
    const target = byInstanceId.get(binding.to.instanceId)!;
    const output = source.registration.manifest.outputPorts.find(
      (port) => port.id === binding.from.portId,
    );
    const input = target.registration.manifest.inputPorts.find(
      (port) => port.id === binding.to.portId,
    );
    if (output === undefined || input === undefined) {
      fail(
        ModuleResolutionErrorCode.unknownPort,
        `binding references an undeclared port: ${binding.from.instanceId}.${binding.from.portId} -> ${binding.to.instanceId}.${binding.to.portId}`,
      );
    }
    if (output.payloadType !== input.payloadType) {
      fail(
        ModuleResolutionErrorCode.portTypeMismatch,
        `${output.payloadType} cannot bind to ${input.payloadType}`,
      );
    }
    let delivery: ResolvedPortBinding["delivery"] = "legacy-event";
    if ("delivery" in output && "delivery" in input) {
      const v11Output = output as GameModuleManifestV11["outputPorts"][number];
      const v11Input = input as GameModuleManifestV11["inputPorts"][number];
      if (v11Output.delivery !== v11Input.delivery) {
        fail(
          ModuleResolutionErrorCode.deliveryMismatch,
          `${binding.from.instanceId}.${binding.from.portId} delivery ${v11Output.delivery} cannot bind to ${v11Input.delivery}`,
        );
      }
      delivery = v11Output.delivery;
      const authorization = v11Input.authorization;
      const ownersMatch = source.ownerId === target.ownerId;
      if (
        (authorization.ownerRelation === "same-owner" && !ownersMatch) ||
        (authorization.ownerRelation === "different-owner" && ownersMatch) ||
        !authorization.sourceActorRoles.includes(
          actorRoles.get(source.ownerId)!,
        ) ||
        !authorization.targetActorRoles.includes(
          actorRoles.get(target.ownerId)!,
        ) ||
        (authorization.sourceEntityRoles.length > 0 &&
          (v11Output.entityRole === undefined ||
            !authorization.sourceEntityRoles.includes(v11Output.entityRole)))
      ) {
        fail(
          ModuleResolutionErrorCode.endpointUnauthorized,
          `binding is not authorized for owners/roles: ${binding.from.instanceId}.${binding.from.portId} -> ${binding.to.instanceId}.${binding.to.portId}`,
        );
      }
    } else if (
      source.registration.manifest.schemaVersion !==
      target.registration.manifest.schemaVersion
    ) {
      fail(
        ModuleResolutionErrorCode.manifestGenerationMismatch,
        "Manifest 1.0 fixture ports cannot bind Manifest 1.1 production ports",
      );
    }
    const bindingKey = `${binding.from.instanceId}.${binding.from.portId}->${binding.to.instanceId}.${binding.to.portId}`;
    if (bindingKeys.has(bindingKey)) {
      fail(
        ModuleResolutionErrorCode.duplicateBinding,
        `duplicate binding: ${bindingKey}`,
      );
    }
    bindingKeys.add(bindingKey);
    const targetKey = `${binding.to.instanceId}.${binding.to.portId}`;
    const count = (targetCounts.get(targetKey) ?? 0) + 1;
    if (!input.multiple && count > 1) {
      fail(
        ModuleResolutionErrorCode.duplicateBinding,
        `${targetKey} accepts only one binding`,
      );
    }
    targetCounts.set(targetKey, count);
    resolved.push(
      Object.freeze({
        from: Object.freeze({ ...binding.from }),
        to: Object.freeze({ ...binding.to }),
        payloadType: output.payloadType,
        delivery,
      }),
    );
  }

  for (const entry of selected) {
    for (const input of entry.registration.manifest.inputPorts) {
      if (
        input.required &&
        !targetCounts.has(`${entry.instanceId}.${input.id}`)
      ) {
        fail(
          ModuleResolutionErrorCode.missingRequiredPort,
          `${entry.instanceId}.${input.id} requires a binding`,
        );
      }
    }
  }

  const eventEdges = resolved
    .filter((binding) => binding.delivery === "event")
    .map((binding) => ({
      from: binding.from.instanceId,
      to: binding.to.instanceId,
    }));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (instanceId: string): void => {
    if (visiting.has(instanceId)) {
      fail(
        ModuleResolutionErrorCode.synchronousEventCycle,
        `synchronous event cycle includes ${instanceId}`,
      );
    }
    if (visited.has(instanceId)) return;
    visiting.add(instanceId);
    for (const edge of eventEdges.filter(
      (candidate) => candidate.from === instanceId,
    )) {
      visit(edge.to);
    }
    visiting.delete(instanceId);
    visited.add(instanceId);
  };
  for (const entry of selected) visit(entry.instanceId);

  return Object.freeze(
    resolved.sort(
      (left, right) =>
        left.from.instanceId.localeCompare(right.from.instanceId) ||
        left.from.portId.localeCompare(right.from.portId) ||
        left.to.instanceId.localeCompare(right.to.instanceId) ||
        left.to.portId.localeCompare(right.to.portId),
    ),
  );
}

function resolveContactPolicyProfiles(
  assembly: GameAssemblySpec,
  selected: readonly SelectedModule[],
  registry: GameModuleRegistry,
): readonly ResolvedContactPolicyProfile[] {
  const resolved: ResolvedContactPolicyProfile[] = [];
  for (const selection of assembly.contactPolicySelections ?? []) {
    const profile = registry.findContactPolicyProfile(
      selection.profileId,
      selection.version,
    );
    if (profile === undefined) {
      fail(
        ModuleResolutionErrorCode.missingPolicyProfile,
        `unknown contact policy profile ${selection.profileId}@${selection.version}`,
      );
    }
    const policyEntries = profile.orderedPolicies.map((policy) => {
      const matches = selected.filter(
        (entry) =>
          entry.registration.manifest.moduleId === policy.moduleId &&
          versionSatisfiesRange(
            entry.registration.manifest.version,
            policy.versionRange,
          ),
      );
      if (matches.length !== 1) {
        fail(
          ModuleResolutionErrorCode.invalidPolicyOrder,
          `profile ${profile.profileId} requires exactly one ${policy.moduleId}@${policy.versionRange}`,
        );
      }
      const entry = matches[0]!;
      const manifest = entry.registration.manifest;
      const descriptor =
        manifest.schemaVersion !== "1.0.0"
          ? manifest.contactPolicyTransform
          : undefined;
      if (
        descriptor === undefined ||
        descriptor.executionModel !== "contact-policy-transform-v1" ||
        descriptor.policyRole !== policy.policyRole ||
        !descriptor.supportedChainEvidenceIds.includes(
          profile.supportedChainEvidenceId,
        )
      ) {
        fail(
          ModuleResolutionErrorCode.invalidPolicyOrder,
          `${entry.instanceId} does not satisfy profile ${profile.profileId}`,
        );
      }
      return { entry, descriptor };
    });

    for (const [index, current] of policyEntries.entries()) {
      const previous =
        policyEntries[index - 1]?.entry.registration.manifest.moduleId;
      const next =
        policyEntries[index + 1]?.entry.registration.manifest.moduleId;
      const descriptor = current.descriptor;
      if (
        (previous === undefined
          ? descriptor.allowedPredecessors.length !== 0
          : !descriptor.allowedPredecessors.includes(previous)) ||
        (next === undefined
          ? descriptor.allowedSuccessors.length !== 0
          : !descriptor.allowedSuccessors.includes(next))
      ) {
        fail(
          ModuleResolutionErrorCode.invalidPolicyOrder,
          `profile ${profile.profileId} violates predecessor/successor rules at ${current.entry.instanceId}`,
        );
      }
      const beforeIds = policyEntries
        .slice(index + 1)
        .map((entry) => entry.entry.registration.manifest.moduleId);
      const afterIds = policyEntries
        .slice(0, index)
        .map((entry) => entry.entry.registration.manifest.moduleId);
      if (
        descriptor.requiresBefore.some(
          (moduleId) => !beforeIds.includes(moduleId),
        ) ||
        descriptor.requiresAfter.some(
          (moduleId) => !afterIds.includes(moduleId),
        )
      ) {
        fail(
          ModuleResolutionErrorCode.invalidPolicyOrder,
          `profile ${profile.profileId} violates before/after rules at ${current.entry.instanceId}`,
        );
      }
    }

    resolved.push(
      Object.freeze({
        consumerInstanceId: selection.consumerInstanceId,
        profileId: profile.profileId,
        version: profile.version,
        evidenceHash: profile.evidenceHash,
        supportedChainEvidenceId: profile.supportedChainEvidenceId,
        orderedPolicyInstanceIds: Object.freeze(
          policyEntries.map((entry) => entry.entry.instanceId),
        ),
        orderedPolicyArtifactHashes: Object.freeze(
          policyEntries.map(
            (entry) =>
              entry.entry.registration.artifactIdentity?.envelopeSha256 ??
              entry.entry.registration.manifestSha256,
          ),
        ),
      }),
    );
  }
  return Object.freeze(
    resolved.sort((left, right) =>
      left.consumerInstanceId.localeCompare(right.consumerInstanceId),
    ),
  );
}

function damageSinkDescriptor(
  entry: SelectedModule,
): DamageSinkDescriptor | undefined {
  const manifest = entry.registration.manifest;
  return manifest.schemaVersion !== "1.0.0" ? manifest.damageSink : undefined;
}

function resolveDamageSinkRoutes(
  assembly: GameAssemblySpec,
  selected: readonly SelectedModule[],
  bindings: readonly ResolvedPortBinding[],
): readonly ResolvedDamageSinkRoute[] {
  const routes: ResolvedDamageSinkRoute[] = [];
  const sinks = selected.filter(
    (entry) => damageSinkDescriptor(entry) !== undefined,
  );
  const sinkIdsAcrossGraph = new Set(sinks.map((entry) => entry.instanceId));
  const producerOutputs = selected.flatMap((entry) =>
    damageSinkDescriptor(entry) === undefined
      ? entry.registration.manifest.outputPorts
          .filter((port) => port.payloadType === "damage-v1")
          .map((port) => ({ instanceId: entry.instanceId, portId: port.id }))
      : [],
  );
  for (const output of producerOutputs) {
    const outputBindings = bindings.filter(
      (binding) =>
        binding.from.instanceId === output.instanceId &&
        binding.from.portId === output.portId,
    );
    if (
      outputBindings.length === 0 ||
      outputBindings.some(
        (binding) => !sinkIdsAcrossGraph.has(binding.to.instanceId),
      )
    ) {
      fail(
        ModuleResolutionErrorCode.invalidDamageSinkRoute,
        `${output.instanceId}.${output.portId} must bind a declared damage-sink head`,
      );
    }
  }
  const owners = new Set(sinks.map((entry) => entry.ownerId));
  for (const ownerId of owners) {
    const ownerSinks = sinks.filter((entry) => entry.ownerId === ownerId);
    const routeSelection = (assembly.damageSinkRoutes ?? []).find(
      (route) => route.ownerId === ownerId,
    );
    if (routeSelection === undefined) {
      fail(
        ModuleResolutionErrorCode.missingDamageSinkRoute,
        `owner ${ownerId} has damage sinks but no declared route`,
      );
    }
    const byId = new Map(
      ownerSinks.map((entry) => [entry.instanceId, entry] as const),
    );
    const head = byId.get(routeSelection.headInstanceId);
    if (head === undefined) {
      fail(
        ModuleResolutionErrorCode.invalidDamageSinkRoute,
        `route head ${routeSelection.headInstanceId} is not a same-owner damage sink`,
      );
    }
    const terminals = ownerSinks.filter(
      (entry) => damageSinkDescriptor(entry)?.sinkRole === "terminal-health",
    );
    if (terminals.length !== 1) {
      fail(
        ModuleResolutionErrorCode.invalidDamageSinkRoute,
        `owner ${ownerId} requires exactly one terminal health sink`,
      );
    }

    const ordered: string[] = [];
    const visited = new Set<string>();
    let current: SelectedModule | undefined = head;
    while (current !== undefined) {
      if (visited.has(current.instanceId)) {
        fail(
          ModuleResolutionErrorCode.invalidDamageSinkRoute,
          `damage sink cycle or duplicate includes ${current.instanceId}`,
        );
      }
      visited.add(current.instanceId);
      ordered.push(current.instanceId);
      const descriptor = damageSinkDescriptor(current)!;
      if (descriptor.sinkRole === "terminal-health") break;
      const downstream = bindings.filter(
        (binding) =>
          binding.from.instanceId === current!.instanceId &&
          binding.from.portId === descriptor.downstreamOutputPort,
      );
      if (downstream.length !== 1) {
        fail(
          ModuleResolutionErrorCode.invalidDamageSinkRoute,
          `${current.instanceId} must have exactly one downstream damage sink`,
        );
      }
      const next = byId.get(downstream[0]!.to.instanceId);
      const nextDescriptor =
        next === undefined ? undefined : damageSinkDescriptor(next);
      if (
        next === undefined ||
        nextDescriptor === undefined ||
        downstream[0]!.to.portId !== nextDescriptor.inputPort
      ) {
        fail(
          ModuleResolutionErrorCode.invalidDamageSinkRoute,
          `${current.instanceId} downstream must be a same-owner damage sink input`,
        );
      }
      current = next;
    }
    if (
      ordered.length !== ownerSinks.length ||
      ordered.at(-1) !== terminals[0]!.instanceId
    ) {
      fail(
        ModuleResolutionErrorCode.invalidDamageSinkRoute,
        `owner ${ownerId} damage route is disconnected or unterminated`,
      );
    }

    const sinkIds = new Set(ownerSinks.map((entry) => entry.instanceId));
    const producerBindings = bindings.filter(
      (binding) =>
        binding.payloadType === "damage-v1" &&
        !sinkIds.has(binding.from.instanceId) &&
        sinkIds.has(binding.to.instanceId),
    );
    if (
      producerBindings.some(
        (binding) => binding.to.instanceId !== routeSelection.headInstanceId,
      )
    ) {
      fail(
        ModuleResolutionErrorCode.invalidDamageSinkRoute,
        `owner ${ownerId} has a producer bound below the declared route head`,
      );
    }
    for (const [index, sinkId] of ordered.entries()) {
      const descriptor = damageSinkDescriptor(byId.get(sinkId)!)!;
      const incoming = bindings.filter(
        (binding) =>
          binding.to.instanceId === sinkId &&
          binding.to.portId === descriptor.inputPort,
      );
      const expectedUpstream = index === 0 ? undefined : ordered[index - 1];
      if (
        incoming.some(
          (binding) =>
            sinkIds.has(binding.from.instanceId) &&
            binding.from.instanceId !== expectedUpstream,
        )
      ) {
        fail(
          ModuleResolutionErrorCode.invalidDamageSinkRoute,
          `owner ${ownerId} damage route forks or bypasses at ${sinkId}`,
        );
      }
    }
    routes.push(
      Object.freeze({
        ownerId,
        headInstanceId: routeSelection.headInstanceId,
        orderedSinkInstanceIds: Object.freeze(ordered),
        terminalHealthInstanceId: terminals[0]!.instanceId,
        producerInstanceIds: Object.freeze(
          [
            ...new Set(
              producerBindings.map((binding) => binding.from.instanceId),
            ),
          ].sort(),
        ),
      }),
    );
  }
  if (
    (assembly.damageSinkRoutes ?? []).some(
      (route) => !owners.has(route.ownerId),
    )
  ) {
    fail(
      ModuleResolutionErrorCode.invalidDamageSinkRoute,
      "a declared damage route owner has no damage sink",
    );
  }
  return Object.freeze(
    routes.sort((left, right) => left.ownerId.localeCompare(right.ownerId)),
  );
}

function stableProviderFirstOrder(
  selected: readonly SelectedModule[],
  dependencyEdges: readonly Readonly<{ from: string; to: string }>[],
  capabilityEdges: readonly Readonly<{ from: string; to: string }>[],
): readonly string[] {
  const edges = [...dependencyEdges, ...capabilityEdges];
  const result: string[] = [];
  const visited = new Set<string>();
  const visit = (instanceId: string): void => {
    if (visited.has(instanceId)) return;
    const providers = edges
      .filter((edge) => edge.from === instanceId)
      .map((edge) => edge.to)
      .sort((left, right) => left.localeCompare(right));
    for (const provider of providers) visit(provider);
    visited.add(instanceId);
    result.push(instanceId);
  };
  for (const entry of [...selected].sort((left, right) =>
    left.instanceId.localeCompare(right.instanceId),
  )) {
    visit(entry.instanceId);
  }
  return Object.freeze(result);
}

function resolveEntityAuthorization(
  assembly: GameAssemblySpec,
  selected: readonly SelectedModule[],
  bindings: readonly ResolvedPortBinding[],
  contactPolicyProfiles: readonly ResolvedContactPolicyProfile[],
): Readonly<{
  entityChannels: readonly ResolvedEntityChannel[];
  entityMutationGrants: readonly ResolvedEntityMutationGrant[];
}> {
  const selectedById = new Map(
    selected.map((entry) => [entry.instanceId, entry] as const),
  );
  const actorRoleById = new Map(
    assembly.actors.map((actor) => [actor.actorId, actor.role] as const),
  );
  const channels: ResolvedEntityChannel[] = [];

  for (const entry of selected) {
    const manifest = entry.registration.manifest;
    if (manifest.schemaVersion === "1.0.0") continue;
    for (const descriptor of manifest.ownedEntityChannels ?? []) {
      const output = manifest.outputPorts.find(
        (port) => port.id === descriptor.outputPort,
      )!;
      const capacityResources = descriptor.capacity.resources;
      const capacity =
        descriptor.capacity.kind === "constant"
          ? descriptor.capacity.value
          : Math.min(
              ...capacityResources.map(
                (resource) => entry.resourceGrant[resource],
              ),
            );
      if (
        capacityResources.some(
          (resource) => capacity > entry.resourceGrant[resource],
        )
      ) {
        fail(
          ModuleResolutionErrorCode.invalidEntityChannel,
          `${entry.instanceId}.${descriptor.channelId} capacity ${capacity} exceeds exact resource grant`,
        );
      }
      const channelId = `${entry.instanceId}.${descriptor.channelId}`;
      if (channels.some((channel) => channel.channelId === channelId)) {
        fail(
          ModuleResolutionErrorCode.invalidEntityChannel,
          `duplicate resolved entity channel: ${channelId}`,
        );
      }
      const readers = [
        ...new Set(
          bindings
            .filter(
              (binding) =>
                binding.from.instanceId === entry.instanceId &&
                binding.from.portId === descriptor.outputPort,
            )
            .map((binding) => binding.to.instanceId),
        ),
      ].sort();
      channels.push(
        Object.freeze({
          channelId,
          localChannelId: descriptor.channelId,
          ownerInstanceId: entry.instanceId,
          ownerActorId: entry.ownerId,
          outputPort: descriptor.outputPort,
          entityRole: output.entityRole!,
          capacity,
          capacityResources: Object.freeze([...capacityResources]),
          readerInstanceIds: Object.freeze(readers),
          ...(entry.registration.artifactIdentity === undefined
            ? {}
            : {
                sourceArtifactEnvelopeSha256:
                  entry.registration.artifactIdentity.envelopeSha256,
              }),
        }),
      );
    }
  }

  const selections = assembly.entityMutationGrantSelections ?? [];
  const grants: ResolvedEntityMutationGrant[] = [];
  const consumedSelections = new Set<number>();
  const grantedChannels = new Set<string>();

  for (const grantee of selected) {
    const manifest = grantee.registration.manifest;
    if (manifest.schemaVersion === "1.0.0") continue;
    for (const access of manifest.entityMutationAccess ?? []) {
      const matching = selections
        .map((selection, index) => ({ selection, index }))
        .filter(
          ({ selection }) =>
            selection.granteeInstanceId === grantee.instanceId &&
            selection.accessId === access.accessId,
        );
      if (matching.length === 0) {
        fail(
          ModuleResolutionErrorCode.missingEntityMutationGrant,
          `missing entity mutation grant selection: ${grantee.instanceId}.${access.accessId}`,
        );
      }
      if (matching.length !== 1) {
        fail(
          ModuleResolutionErrorCode.invalidEntityMutationGrant,
          `ambiguous entity mutation grant selection: ${grantee.instanceId}.${access.accessId}`,
        );
      }
      const { selection, index: selectionIndex } = matching[0]!;
      consumedSelections.add(selectionIndex);
      const preparedCommit =
        manifest.schemaVersion === "1.3.0"
          ? manifest.preparedEffectCommit
          : null;
      if (
        preparedCommit !== null &&
        preparedCommit.mutationChannelStateInputPort === access.inputPort
      ) {
        const mutationBindings = bindings.filter(
          (binding) =>
            binding.to.instanceId === grantee.instanceId &&
            binding.to.portId === access.inputPort,
        );
        const mutationBinding = mutationBindings[0];
        const channel =
          mutationBindings.length !== 1
            ? undefined
            : channels.find(
                (candidate) =>
                  candidate.ownerInstanceId ===
                    mutationBinding!.from.instanceId &&
                  candidate.outputPort === mutationBinding!.from.portId,
              );
        if (
          mutationBinding === undefined ||
          channel === undefined ||
          access.operations.length !== 1 ||
          access.operations[0] !== "consume" ||
          selection.transferRecipientActorIds.length !== 0
        )
          fail(
            ModuleResolutionErrorCode.invalidEntityMutationGrant,
            `prepared effect mutation grant does not close one consume-only source channel: ${grantee.instanceId}.${access.accessId}`,
          );
        if (grantedChannels.has(channel.channelId))
          fail(
            ModuleResolutionErrorCode.invalidEntityMutationGrant,
            `multiple mutation grants target ${channel.channelId}`,
          );
        grantedChannels.add(channel.channelId);
        grants.push(
          Object.freeze({
            grantId: `${grantee.instanceId}.${access.accessId}`,
            accessId: access.accessId,
            granteeInstanceId: grantee.instanceId,
            channelId: channel.channelId,
            operations: Object.freeze(["consume"] as const),
            transferRecipientActorIds: Object.freeze([]),
          }),
        );
        continue;
      }
      const profileCount = contactPolicyProfiles.filter(
        (profile) => profile.consumerInstanceId === grantee.instanceId,
      ).length;
      const resolution = manifest.contactResolution;
      if (
        profileCount !== 1 ||
        resolution === undefined ||
        resolution.mutationChannelInputPort !== access.inputPort
      ) {
        fail(
          ModuleResolutionErrorCode.invalidContactLineage,
          `${grantee.instanceId}.${access.accessId} is not the unique final contact resolver authority`,
        );
      }
      const candidateBindings = bindings.filter(
        (binding) =>
          binding.to.instanceId === grantee.instanceId &&
          binding.to.portId === resolution.candidateInputPort,
      );
      const mutationBindings = bindings.filter(
        (binding) =>
          binding.to.instanceId === grantee.instanceId &&
          binding.to.portId === access.inputPort,
      );
      if (candidateBindings.length !== 1 || mutationBindings.length !== 1) {
        fail(
          ModuleResolutionErrorCode.invalidContactLineage,
          `${grantee.instanceId}.${access.accessId} requires one candidate and one mutation-channel binding`,
        );
      }
      const candidateBinding = candidateBindings[0]!;
      const detector = selectedById.get(candidateBinding.from.instanceId);
      const detectorManifest = detector?.registration.manifest;
      const detectorDescriptor =
        detectorManifest !== undefined &&
        detectorManifest.schemaVersion !== "1.0.0"
          ? detectorManifest.contactDetector
          : undefined;
      if (
        detector === undefined ||
        detectorDescriptor === undefined ||
        detectorDescriptor.candidateOutputPort !== candidateBinding.from.portId
      ) {
        fail(
          ModuleResolutionErrorCode.invalidContactLineage,
          `candidate source is not a declared contact detector for ${grantee.instanceId}`,
        );
      }
      const detectorSourceBindings = bindings.filter(
        (binding) =>
          binding.to.instanceId === detector.instanceId &&
          binding.to.portId === detectorDescriptor.sourceChannelInputPort,
      );
      if (detectorSourceBindings.length !== 1) {
        fail(
          ModuleResolutionErrorCode.invalidContactLineage,
          `contact detector ${detector.instanceId} requires one source-channel binding`,
        );
      }
      const mutationBinding = mutationBindings[0]!;
      const detectorSourceBinding = detectorSourceBindings[0]!;
      if (
        detectorSourceBinding.from.instanceId !==
          mutationBinding.from.instanceId ||
        detectorSourceBinding.from.portId !== mutationBinding.from.portId
      ) {
        fail(
          ModuleResolutionErrorCode.invalidContactLineage,
          `candidate and mutation authority do not share one source channel for ${grantee.instanceId}`,
        );
      }
      const channel = channels.find(
        (candidate) =>
          candidate.ownerInstanceId === mutationBinding.from.instanceId &&
          candidate.outputPort === mutationBinding.from.portId,
      );
      if (channel === undefined) {
        fail(
          ModuleResolutionErrorCode.invalidEntityMutationGrant,
          `mutation source is not a resolved owned entity channel for ${grantee.instanceId}`,
        );
      }
      const recipients = selection.transferRecipientActorIds;
      const allowsTransfer = access.operations.includes("transfer");
      if (
        allowsTransfer !== recipients.length > 0 ||
        recipients.some(
          (actorId) =>
            !access.transferRecipientActorRoles.includes(
              actorRoleById.get(actorId)!,
            ),
        )
      ) {
        fail(
          ModuleResolutionErrorCode.invalidEntityMutationGrant,
          `transfer recipients exceed ${grantee.instanceId}.${access.accessId} authorization`,
        );
      }
      if (grantedChannels.has(channel.channelId)) {
        fail(
          ModuleResolutionErrorCode.invalidEntityMutationGrant,
          `multiple mutation grants target ${channel.channelId}`,
        );
      }
      grantedChannels.add(channel.channelId);
      grants.push(
        Object.freeze({
          grantId: `${grantee.instanceId}.${access.accessId}`,
          accessId: access.accessId,
          granteeInstanceId: grantee.instanceId,
          channelId: channel.channelId,
          operations: Object.freeze([...access.operations]),
          transferRecipientActorIds: Object.freeze([...recipients].sort()),
        }),
      );
    }
  }
  if (consumedSelections.size !== selections.length) {
    fail(
      ModuleResolutionErrorCode.invalidEntityMutationGrant,
      "entity mutation grant selection does not match a production Manifest 1.1 access",
    );
  }
  return Object.freeze({
    entityChannels: Object.freeze(
      channels.sort((left, right) =>
        left.channelId.localeCompare(right.channelId),
      ),
    ),
    entityMutationGrants: Object.freeze(
      grants.sort((left, right) => left.grantId.localeCompare(right.grantId)),
    ),
  });
}

function totalResources(
  selected: readonly SelectedModule[],
  budget: ModuleResourceBudget,
): ModuleResourceBudget {
  const totals: ModuleResourceBudget = {
    activeEntities: 0,
    activeProjectiles: 0,
    spawnsPerSecond: 0,
    timers: 0,
  };
  for (const entry of selected) {
    const resources = entry.resourceGrant;
    totals.activeEntities += resources.activeEntities;
    totals.activeProjectiles += resources.activeProjectiles;
    totals.spawnsPerSecond += resources.spawnsPerSecond;
    totals.timers += resources.timers;
  }
  for (const field of Object.keys(totals) as (keyof ModuleResourceBudget)[]) {
    if (totals[field] > budget[field]) {
      fail(
        ModuleResolutionErrorCode.resourceBudgetExceeded,
        `${field} total ${totals[field]} exceeds budget ${budget[field]}`,
      );
    }
  }
  return Object.freeze(totals);
}

function resolveGameAssemblyInternal(
  assemblyInput: unknown,
  registry: GameModuleRegistry,
  includeV14 = false,
): ResolvedModuleGraph {
  const parsed = GameAssemblySpecSchema.safeParse(assemblyInput);
  if (!parsed.success) {
    fail(
      ModuleResolutionErrorCode.assemblyInvalid,
      `invalid game assembly: ${parsed.error.message}`,
    );
  }
  const assembly = parsed.data;
  const selected = selectModules(assembly, registry, includeV14);
  validateCardinality(selected);
  validateConflicts(selected);
  validateOwnership(selected);
  const capabilityEdges = buildCapabilityEdges(assembly, selected);
  const dependencyEdges = buildDependencyEdges(selected);
  validateAcyclicDependencies(selected, [
    ...dependencyEdges,
    ...capabilityEdges,
  ]);
  const bindings = validateBindings(assembly, selected);
  const contactPolicyProfiles = resolveContactPolicyProfiles(
    assembly,
    selected,
    registry,
  );
  const { entityChannels, entityMutationGrants } = resolveEntityAuthorization(
    assembly,
    selected,
    bindings,
    contactPolicyProfiles,
  );
  const damageSinkRoutes = resolveDamageSinkRoutes(
    assembly,
    selected,
    bindings,
  );
  const resourceTotals = totalResources(selected, assembly.globalBudget);
  const constructionOrder = stableProviderFirstOrder(
    selected,
    dependencyEdges,
    capabilityEdges,
  );

  const modules = Object.freeze(
    selected
      .map((entry): ResolvedGameModule => {
        const manifest = entry.registration.manifest;
        const base = {
          instanceId: entry.instanceId,
          ownerId: entry.ownerId,
          moduleId: manifest.moduleId,
          version: manifest.version,
          kind: manifest.kind,
          implementationId: manifest.implementationId,
          configurationSchemaId: manifest.configurationSchemaId,
          configuration: entry.configuration,
          manifestSchemaVersion: manifest.schemaVersion,
          instantiation:
            entry.registration.registrationKind === "production"
              ? "production-eligible"
              : "fixture-only",
          manifestSha256: entry.registration.manifestSha256,
          resources: Object.freeze({ ...manifest.resources }),
          resourceGrant: Object.freeze({ ...entry.resourceGrant }),
          runtimeLeaseCeilings: Object.freeze(
            manifest.schemaVersion !== "1.0.0"
              ? { ...manifest.runtimeLeases }
              : { startLeases: 0, instanceLeases: 0, graphLeases: 0 },
          ),
        } as const;
        return Object.freeze(
          entry.registration.artifactIdentity === undefined
            ? base
            : {
                ...base,
                artifactIdentity: entry.registration.artifactIdentity,
              },
        );
      })
      .sort((left, right) => left.instanceId.localeCompare(right.instanceId)),
  );

  return Object.freeze({
    graphVersion: "1.1.0",
    assemblyId: assembly.assemblyId,
    kernelVersion: assembly.kernelVersion,
    engine: Object.freeze({ ...assembly.engine }),
    productionInstantiationAllowed: modules.every(
      (module) => module.instantiation === "production-eligible",
    ),
    actors: Object.freeze(
      assembly.actors.map((actor) => Object.freeze({ ...actor })),
    ),
    assetRoles: Object.freeze(
      assembly.assetRoles.map((role) =>
        Object.freeze({
          ...role,
          requiredByInstanceIds: Object.freeze([...role.requiredByInstanceIds]),
        }),
      ),
    ),
    modules,
    dependencyEdges,
    capabilityEdges,
    bindings,
    constructionOrder,
    contactPolicyProfiles,
    damageSinkRoutes,
    entityChannels,
    entityMutationGrants,
    resourceTotals,
  });
}

export function resolveGameAssembly(
  assemblyInput: unknown,
  registry: GameModuleRegistry,
): ResolvedModuleGraph {
  const parsed = GameAssemblySpecSchema.safeParse(assemblyInput);
  if (!parsed.success) {
    fail(
      ModuleResolutionErrorCode.assemblyInvalid,
      `invalid game assembly: ${parsed.error.message}`,
    );
  }
  if (parsed.data.schemaVersion !== "1.0.0") {
    fail(
      ModuleResolutionErrorCode.incompatibleContractVersion,
      "Assembly 1.1 must be resolved through resolveGameAssemblyV12",
    );
  }
  return resolveGameAssemblyInternal(parsed.data, registry);
}

/**
 * ADR 0028 base pass.  It deliberately returns only the version-neutral
 * binding/resource result; Graph 1.4 authority closure is added by the V1.4
 * composer after this pass has accepted the exact Assembly 1.3 bytes.
 */
export function resolveGameAssemblyBaseV14(
  assemblyInput: unknown,
  registry: GameModuleRegistry,
): ResolvedModuleGraph {
  const parsed = GameAssemblySpecV13Schema.safeParse(assemblyInput);
  if (!parsed.success)
    fail(
      ModuleResolutionErrorCode.assemblyInvalid,
      `invalid Graph 1.4 assembly: ${parsed.error.message}`,
    );
  const assembly: GameAssemblySpecV13 = parsed.data;
  return resolveGameAssemblyInternal(assembly, registry, true);
}

export function resolveGameAssemblyV12(
  assemblyInput: unknown,
  registry: GameModuleRegistry,
  assetEvidence: ModuleAssetAdmissionEvidenceV12 = Object.freeze({
    assets: Object.freeze([]),
    approvedSharingEvidenceIds: Object.freeze([]),
  }),
): ResolvedModuleGraphV12Result {
  const parsed = GameAssemblySpecSchema.safeParse(assemblyInput);
  if (!parsed.success) {
    fail(
      ModuleResolutionErrorCode.assemblyInvalid,
      `invalid game assembly: ${parsed.error.message}`,
    );
  }
  const assembly = parsed.data;
  if (assembly.schemaVersion !== "1.1.0") {
    fail(
      ModuleResolutionErrorCode.incompatibleContractVersion,
      "Graph 1.2 requires Assembly 1.1",
    );
  }
  const legacy = resolveGameAssemblyInternal(assembly, registry);
  const blockers: Array<{
    instanceId: string;
    code: string;
    evidenceId?: string;
  }> = [];
  const modules: ResolvedModuleGraphV12["modules"] = legacy.modules.map(
    (module): ResolvedModuleGraphV12["modules"][number] => {
      const registration = registry.find(module.moduleId, module.version)[0];
      if (
        module.manifestSchemaVersion !== "1.2.0" ||
        registration?.manifest.schemaVersion !== "1.2.0"
      ) {
        blockers.push({
          instanceId: module.instanceId,
          code: "manifest-not-1.2",
        });
        return module;
      }
      const handle = registration.executableHandle;
      const catalogEntryEvidenceId =
        handle === undefined
          ? undefined
          : sha256CanonicalJson({
              moduleId: module.moduleId,
              version: module.version,
              envelopeSha256: module.artifactIdentity?.envelopeSha256,
              implementationId: handle.implementationId,
              exportName: handle.exportName,
              exportKind: handle.exportKind,
              outputBundleSha256: handle.outputBundleSha256,
            });
      if (registration.registrationKind !== "production") {
        blockers.push({
          instanceId: module.instanceId,
          code: "fixture-registration",
        });
      } else if (handle === undefined) {
        blockers.push({
          instanceId: module.instanceId,
          code: "missing-executable-handle",
        });
      }
      return Object.freeze({
        ...module,
        manifestSchemaVersion: "1.2.0" as const,
        runtimeContract: registration.manifest.runtimeContract,
        runtimePorts: Object.freeze({
          inputPorts: registration.manifest.inputPorts,
          outputPorts: registration.manifest.outputPorts,
        }),
        runtimeAuthorities: Object.freeze({
          inputRegistrationIds: Object.freeze(
            registration.manifest.runtimeContract.inputRegistrations.map(
              (input) => input.registrationId,
            ),
          ),
          observationReaderIds: Object.freeze(
            registration.manifest.runtimeContract.observationReaders.map(
              (reader) => reader.readerId,
            ),
          ),
          ownedChannelIds: Object.freeze(
            (registration.manifest.ownedEntityChannels ?? []).map(
              (channel) => channel.channelId,
            ),
          ),
          ownsPlayerLocomotion:
            registration.manifest.exclusiveOwnership.includes(
              "player.locomotion",
            ),
          ...(registration.manifest.contactDetector === undefined
            ? {}
            : { overlapRuleId: registration.manifest.contactDetector.ruleId }),
        }),
        ...(catalogEntryEvidenceId === undefined
          ? {}
          : { catalogEntryEvidenceId }),
      });
    },
  );

  const resolvedAssets: ResolvedAssemblyAssetBindingV12[] = [];
  for (const module of modules) {
    const registration = registry.find(module.moduleId, module.version)[0];
    if (registration?.manifest.schemaVersion !== "1.2.0") continue;
    for (const requirement of registration.manifest.assetRequirements) {
      const matches = assembly.assetBindings.filter(
        (binding) =>
          binding.roleId === requirement.roleId &&
          binding.category === requirement.category &&
          binding.sharing === requirement.sharing &&
          binding.consumerInstanceIds.includes(module.instanceId),
      );
      if (matches.length === 0 && requirement.cardinality === "optional-one")
        continue;
      if (matches.length !== 1) {
        blockers.push({
          instanceId: module.instanceId,
          code:
            matches.length === 0
              ? "missing-required-asset"
              : "ambiguous-asset-binding",
        });
        continue;
      }
      const binding = matches[0]!;
      const admitted = assetEvidence.assets.find(
        (asset) => asset.assetId === binding.artifact.assetId,
      );
      if (
        admitted === undefined ||
        admitted.sourceSha256 !== binding.artifact.sourceSha256 ||
        admitted.runtimeSha256 !== binding.artifact.runtimeSha256 ||
        admitted.provenanceId !== binding.artifact.provenanceId ||
        admitted.licenseRecordId !== binding.artifact.licenseRecordId ||
        admitted.attributionRecordId !== binding.artifact.attributionRecordId ||
        (binding.sharing === "assembly" &&
          !assetEvidence.approvedSharingEvidenceIds.includes(
            binding.approvedSharingEvidenceId!,
          ))
      ) {
        blockers.push({
          instanceId: module.instanceId,
          code: "unadmitted-asset-evidence",
        });
        continue;
      }
      if (
        !resolvedAssets.some((asset) => asset.bindingId === binding.bindingId)
      ) {
        resolvedAssets.push(
          Object.freeze({
            bindingId: binding.bindingId,
            roleId: binding.roleId,
            category: binding.category,
            runtimeSha256: binding.artifact.runtimeSha256,
            textureKey: `module/${binding.artifact.runtimeSha256}/${binding.bindingId}`,
            sharing: binding.sharing,
            consumerInstanceIds: Object.freeze([
              ...binding.consumerInstanceIds,
            ]),
            ...(binding.approvedSharingEvidenceId === undefined
              ? {}
              : {
                  approvedSharingEvidenceId: binding.approvedSharingEvidenceId,
                }),
          }),
        );
      }
    }
  }
  const resolvedBindingIds = new Set(
    resolvedAssets.map((asset) => asset.bindingId),
  );
  if (
    assembly.assetBindings.some(
      (binding) => !resolvedBindingIds.has(binding.bindingId),
    )
  ) {
    blockers.push({
      instanceId: "graph",
      code: "unused-or-unresolved-asset-binding",
    });
  }
  const duplicateAssetKeys = resolvedAssets.map((asset) => asset.textureKey);
  if (new Set(duplicateAssetKeys).size !== duplicateAssetKeys.length) {
    fail(
      ModuleResolutionErrorCode.invalidAssetBinding,
      "resolved asset texture keys collide",
    );
  }
  const catalogEvidenceId = sha256CanonicalJson(
    modules.map((module) => ({
      instanceId: module.instanceId,
      catalogEntryEvidenceId: module.catalogEntryEvidenceId ?? null,
    })),
  );
  const sortedBlockers = Object.freeze(
    blockers
      .map((blocker) => Object.freeze(blocker))
      .sort(
        (left, right) =>
          left.instanceId.localeCompare(right.instanceId) ||
          left.code.localeCompare(right.code),
      ),
  );
  const status =
    sortedBlockers.length === 0 ? ("ready" as const) : ("blocked" as const);
  const graphBasis = {
    graphVersion: "1.2.0",
    assemblyId: assembly.assemblyId,
    catalogEvidenceId,
    constructionOrder: legacy.constructionOrder,
    modules: modules.map((module) => ({
      instanceId: module.instanceId,
      manifestSha256: module.manifestSha256,
      catalogEntryEvidenceId: module.catalogEntryEvidenceId ?? null,
    })),
    assets: resolvedAssets,
    blockers: sortedBlockers,
  };
  const graphEvidenceId = sha256CanonicalJson(graphBasis);
  const readinessReport = deepFreezeData({
    graphEvidenceId,
    status,
    blockers: sortedBlockers,
  }) as ExecutionReadinessReport;
  const graph = deepFreezeData({
    graphVersion: "1.2.0",
    assemblyId: assembly.assemblyId,
    kernelVersion: assembly.kernelVersion,
    engine: { ...assembly.engine },
    executionReadiness: { status, evidenceId: graphEvidenceId },
    catalogEvidenceId,
    actors: legacy.actors,
    modules,
    dependencyEdges: legacy.dependencyEdges,
    capabilityEdges: legacy.capabilityEdges,
    bindings: legacy.bindings,
    constructionOrder: legacy.constructionOrder,
    assetBindings: resolvedAssets,
    contactPolicyProfiles: legacy.contactPolicyProfiles,
    damageSinkRoutes: legacy.damageSinkRoutes,
    entityChannels: legacy.entityChannels,
    entityMutationGrants: legacy.entityMutationGrants,
    resourceTotals: legacy.resourceTotals,
  }) as ResolvedModuleGraphV12;
  return Object.freeze({ graph, readinessReport });
}

/** ADR 0027: resolves Assembly 1.2 into a mixed Manifest 1.2/1.3 Graph 1.3. */
export function resolveGameAssemblyV13(
  assemblyInput: unknown,
  registry: GameModuleRegistry,
  assetEvidence: ModuleAssetAdmissionEvidenceV12 = Object.freeze({
    assets: Object.freeze([]),
    approvedSharingEvidenceIds: Object.freeze([]),
  }),
): ResolvedModuleGraphV13Result {
  const parsed = GameAssemblySpecSchema.safeParse(assemblyInput);
  if (!parsed.success)
    fail(
      ModuleResolutionErrorCode.assemblyInvalid,
      `invalid game assembly: ${parsed.error.message}`,
    );
  if (parsed.data.schemaVersion !== "1.2.0")
    fail(
      ModuleResolutionErrorCode.incompatibleContractVersion,
      "Graph 1.3 requires Assembly 1.2",
    );
  const assembly = parsed.data;
  const legacy = resolveGameAssemblyInternal(assembly, registry);
  const registrationByInstance = new Map(
    assembly.modules.map((request) => {
      const module = legacy.modules.find(
        (candidate) => candidate.instanceId === request.instanceId,
      )!;
      return [
        request.instanceId,
        registry.find(module.moduleId, module.version)[0]!,
      ] as const;
    }),
  );
  const blockers: Array<{
    instanceId: string;
    code: string;
    evidenceId?: string;
  }> = [];
  const modules: ResolvedModuleGraphV13["modules"] = legacy.modules.map(
    (module) => {
      const registration = registrationByInstance.get(module.instanceId)!;
      const manifest = registration.manifest;
      if (
        manifest.schemaVersion !== "1.2.0" &&
        manifest.schemaVersion !== "1.3.0"
      ) {
        blockers.push({
          instanceId: module.instanceId,
          code: "manifest-not-1.2-or-1.3",
        });
        return Object.freeze({
          ...module,
          manifestSchemaVersion: "1.2.0" as const,
          factoryContextVersion: "1.2.0" as const,
          runtimeContract: Object.freeze({
            update: null,
            timerSlots: { slotGroupId: "blocked.legacy" },
            inputRegistrations: [],
            observationReaders: [],
            contactCommit: null,
          }),
          runtimePorts: Object.freeze({
            inputPorts: [],
            outputPorts: [],
          }),
          runtimeAuthorities: Object.freeze({
            inputRegistrationIds: Object.freeze([]),
            observationReaderIds: Object.freeze([]),
            ownedChannelIds: Object.freeze([]),
            ownsPlayerLocomotion: false,
          }),
        });
      }
      if (registration.registrationKind !== "production")
        blockers.push({
          instanceId: module.instanceId,
          code: "fixture-registration",
        });
      if (registration.executableHandle === undefined)
        blockers.push({
          instanceId: module.instanceId,
          code: "missing-executable-handle",
        });
      const handle = registration.executableHandle;
      const catalogEntryEvidenceId =
        handle === undefined
          ? undefined
          : sha256CanonicalJson({
              moduleId: module.moduleId,
              version: module.version,
              manifestSchemaVersion: manifest.schemaVersion,
              factoryContextVersion: manifest.schemaVersion,
              envelopeSha256: module.artifactIdentity?.envelopeSha256,
              implementationId: handle.implementationId,
              exportName: handle.exportName,
              exportKind: handle.exportKind,
              outputBundleSha256: handle.outputBundleSha256,
            });
      return Object.freeze({
        ...module,
        manifestSchemaVersion: manifest.schemaVersion,
        factoryContextVersion: manifest.schemaVersion,
        runtimeContract: manifest.runtimeContract,
        runtimePorts: Object.freeze({
          inputPorts: manifest.inputPorts,
          outputPorts: manifest.outputPorts,
        }),
        runtimeAuthorities: Object.freeze({
          inputRegistrationIds: Object.freeze(
            manifest.runtimeContract.inputRegistrations.map(
              (input) => input.registrationId,
            ),
          ),
          observationReaderIds: Object.freeze(
            manifest.runtimeContract.observationReaders.map(
              (reader) => reader.readerId,
            ),
          ),
          ownedChannelIds: Object.freeze(
            (manifest.ownedEntityChannels ?? []).map(
              (channel) => channel.channelId,
            ),
          ),
          ownsPlayerLocomotion:
            manifest.exclusiveOwnership.includes("player.locomotion"),
          modifierTargetFieldIds: Object.freeze(
            manifest.schemaVersion === "1.3.0"
              ? manifest.modifierTargets.map((target) => target.fieldId)
              : [],
          ),
          ...(manifest.contactDetector !== undefined
            ? { overlapRuleId: manifest.contactDetector.ruleId }
            : manifest.schemaVersion === "1.3.0" &&
                manifest.preparedEffectCommit !== null
              ? {
                  overlapRuleId: manifest.preparedEffectCommit.commitServiceId,
                }
              : {}),
        }),
        ...(catalogEntryEvidenceId === undefined
          ? {}
          : { catalogEntryEvidenceId }),
      });
    },
  );

  const actorSnapshotGrants: ResolvedActorSnapshotGrantV13[] = [];
  const entityChannelReadGrants: ResolvedEntityChannelReadGrantV13[] = [];
  for (const module of modules) {
    const registration = registrationByInstance.get(module.instanceId)!;
    if (registration.manifest.schemaVersion !== "1.3.0") continue;
    const manifest = registration.manifest;
    const owner = assembly.actors.find(
      (actor) => actor.actorId === module.ownerId,
    )!;
    for (const descriptor of manifest.actorSnapshotReads) {
      const targets = assembly.actors.filter((actor) =>
        descriptor.targetActorRoles.includes(actor.role),
      );
      if (
        !descriptor.sourceActorRoles.includes(owner.role) ||
        (descriptor.ownerRelation === "same-owner" &&
          !targets.some((target) => target.actorId === owner.actorId)) ||
        (descriptor.ownerRelation === "different-owner" &&
          !targets.some((target) => target.actorId !== owner.actorId))
      )
        fail(
          ModuleResolutionErrorCode.invalidActorSnapshotGrant,
          `actor snapshot roles do not resolve for ${module.instanceId}.${descriptor.readId}`,
        );
      actorSnapshotGrants.push(
        Object.freeze({
          grantId: `${module.instanceId}/actor-read/${descriptor.readId}`,
          instanceId: module.instanceId,
          ownerActorId: module.ownerId,
          descriptor,
        }),
      );
    }
    for (const descriptor of manifest.entityChannelReads) {
      const sourceBindings = legacy.bindings.filter(
        (binding) =>
          binding.to.instanceId === module.instanceId &&
          binding.to.portId === descriptor.channelStateInputPort,
      );
      if (sourceBindings.length !== 1)
        fail(
          ModuleResolutionErrorCode.invalidEntityChannelReadGrant,
          `entity channel read requires one source binding: ${module.instanceId}.${descriptor.readId}`,
        );
      const source = sourceBindings[0]!;
      const channel = legacy.entityChannels.find(
        (candidate) =>
          candidate.ownerInstanceId === source.from.instanceId &&
          candidate.outputPort === source.from.portId &&
          candidate.entityRole === descriptor.sourceEntityRole,
      );
      if (channel === undefined)
        fail(
          ModuleResolutionErrorCode.invalidEntityChannelReadGrant,
          `entity channel read source is not the exact resolved channel: ${module.instanceId}.${descriptor.readId}`,
        );
      entityChannelReadGrants.push(
        Object.freeze({
          grantId: `${module.instanceId}/channel-read/${descriptor.readId}`,
          instanceId: module.instanceId,
          channelId: channel.channelId,
          maximumEntries: channel.capacity,
          descriptor,
        }),
      );
    }
  }

  const attackGroups = new Map<
    string,
    Array<{
      module: ResolvedModuleGraphV13["modules"][number];
      descriptor: NonNullable<GameModuleManifestV13["attackChannel"]>;
      attackChannelId: string;
    }>
  >();
  for (const module of modules) {
    const manifest = registrationByInstance.get(module.instanceId)!.manifest;
    if (manifest.schemaVersion !== "1.3.0" || manifest.attackChannel === null)
      continue;
    if (
      module.configuration === null ||
      typeof module.configuration !== "object" ||
      Array.isArray(module.configuration)
    )
      fail(
        ModuleResolutionErrorCode.invalidAttackChannel,
        `attack channel configuration must be an object: ${module.instanceId}`,
      );
    const attackChannelId = (module.configuration as Record<string, unknown>)[
      manifest.attackChannel.configurationField
    ];
    if (
      typeof attackChannelId !== "string" ||
      !/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(attackChannelId)
    )
      fail(
        ModuleResolutionErrorCode.invalidAttackChannel,
        `invalid attack channel ID: ${module.instanceId}`,
      );
    const key = `${module.ownerId}\0${attackChannelId}`;
    const entries = attackGroups.get(key) ?? [];
    entries.push({
      module,
      descriptor: manifest.attackChannel,
      attackChannelId,
    });
    attackGroups.set(key, entries);
  }
  const attackChannels: ResolvedAttackChannelV13[] = [];
  for (const entries of attackGroups.values()) {
    const targeting = entries.filter(
      (entry) => entry.descriptor.role === "targeting",
    );
    const triggers = entries.filter(
      (entry) => entry.descriptor.role === "trigger",
    );
    const deliveries = entries.filter(
      (entry) => entry.descriptor.role === "delivery",
    );
    if (
      targeting.length !== 1 ||
      triggers.length !== 1 ||
      deliveries.length !== 1
    )
      fail(
        ModuleResolutionErrorCode.invalidAttackChannel,
        `attack channel requires one targeting, trigger, and delivery: ${entries[0]!.attackChannelId}`,
      );
    const targetDescriptor = targeting[0]!.descriptor;
    const triggerDescriptor = triggers[0]!.descriptor;
    const deliveryDescriptor = deliveries[0]!.descriptor;
    if (
      targetDescriptor.role !== "targeting" ||
      triggerDescriptor.role !== "trigger" ||
      deliveryDescriptor.role !== "delivery"
    )
      throw new Error("unreachable attack descriptor branch");
    const targetBindings = legacy.bindings.filter(
      (binding) =>
        binding.from.instanceId === targeting[0]!.module.instanceId &&
        binding.from.portId === targetDescriptor.targetOutputPort,
    );
    const requestBindings = legacy.bindings.filter(
      (binding) =>
        binding.from.instanceId === triggers[0]!.module.instanceId &&
        binding.from.portId === triggerDescriptor.requestOutputPort,
    );
    if (
      targetBindings.length !== 1 ||
      requestBindings.length !== 1 ||
      targetBindings[0]!.to.instanceId !== deliveries[0]!.module.instanceId ||
      targetBindings[0]!.to.portId !== deliveryDescriptor.targetInputPort ||
      requestBindings[0]!.to.instanceId !== deliveries[0]!.module.instanceId ||
      requestBindings[0]!.to.portId !== deliveryDescriptor.requestInputPort
    )
      fail(
        ModuleResolutionErrorCode.invalidAttackChannel,
        `attack channel bindings do not close: ${entries[0]!.attackChannelId}`,
      );
    attackChannels.push(
      Object.freeze({
        ownerActorId: entries[0]!.module.ownerId,
        attackChannelId: entries[0]!.attackChannelId,
        targetingInstanceId: targeting[0]!.module.instanceId,
        triggerInstanceId: triggers[0]!.module.instanceId,
        deliveryInstanceId: deliveries[0]!.module.instanceId,
        targetBinding: targetBindings[0]!,
        requestBinding: requestBindings[0]!,
      }),
    );
  }

  // Batch 2 projectile deliveries own independent physical channels/pools, but
  // their maximum-reachable grants contend through one deterministic assembly
  // ledger. Materializing the ledger makes both custody and contention order
  // part of Graph 1.3 evidence instead of leaving them as runtime convention.
  const projectileOwners: Array<
    ResolvedProjectileBudgetContentionV13["orderedOwners"][number]
  > = [];
  const resolvedPoolIds = new Set<string>();
  const resolvedChannelIds = new Set<string>();
  let cumulativeActiveProjectiles = 0;
  let cumulativeSpawnsPerSecond = 0;
  for (const [
    resolvedOrder,
    instanceId,
  ] of legacy.constructionOrder.entries()) {
    const module = modules.find(
      (candidate) => candidate.instanceId === instanceId,
    )!;
    const manifest = registrationByInstance.get(instanceId)!.manifest;
    if (
      manifest.schemaVersion !== "1.3.0" ||
      manifest.attackChannel?.role !== "delivery" ||
      !manifest.provides.some(
        (capability) =>
          capability.id === "delivery.projectile-channel" &&
          capability.version === "1.0.0",
      )
    )
      continue;
    const attack = attackChannels.find(
      (candidate) => candidate.deliveryInstanceId === instanceId,
    );
    const deliveryDescriptor = manifest.projectileDelivery;
    const ownedDescriptors = (manifest.ownedEntityChannels ?? []).filter(
      (channel) =>
        channel.entityRole === "projectile" &&
        channel.channelId === deliveryDescriptor?.channelId,
    );
    const ownedDescriptor = ownedDescriptors[0];
    const channel = legacy.entityChannels.find(
      (candidate) =>
        candidate.ownerInstanceId === instanceId &&
        candidate.localChannelId === ownedDescriptor?.channelId,
    );
    const pool = ownedDescriptor?.poolDescriptor;
    if (
      manifest.kind !== "attack-delivery" ||
      attack === undefined ||
      deliveryDescriptor === undefined ||
      ownedDescriptors.length !== 1 ||
      channel === undefined ||
      pool === undefined ||
      pool.projectileResource !== "activeProjectiles" ||
      channel.capacityResources.length !== 2 ||
      !channel.capacityResources.includes("activeEntities") ||
      !channel.capacityResources.includes("activeProjectiles") ||
      channel.capacity !== module.resourceGrant.activeEntities ||
      channel.capacity !== module.resourceGrant.activeProjectiles
    )
      fail(
        ModuleResolutionErrorCode.invalidEntityChannel,
        `projectile delivery requires one exact independently owned channel/pool: ${instanceId}`,
      );
    const resolvedPoolId = `${instanceId}.${pool.poolId}`;
    if (
      resolvedPoolIds.has(resolvedPoolId) ||
      resolvedChannelIds.has(channel.channelId)
    )
      fail(
        ModuleResolutionErrorCode.invalidEntityChannel,
        `projectile delivery pool/channel custody is not unique: ${instanceId}`,
      );
    resolvedPoolIds.add(resolvedPoolId);
    resolvedChannelIds.add(channel.channelId);
    if (
      module.resourceGrant.activeProjectiles >
        Number.MAX_SAFE_INTEGER - cumulativeActiveProjectiles ||
      module.resourceGrant.spawnsPerSecond >
        Number.MAX_SAFE_INTEGER - cumulativeSpawnsPerSecond
    )
      fail(
        ModuleResolutionErrorCode.invalidResourceReservation,
        `projectile aggregate exceeds safe integer range before ${instanceId}`,
      );
    cumulativeActiveProjectiles += module.resourceGrant.activeProjectiles;
    cumulativeSpawnsPerSecond += module.resourceGrant.spawnsPerSecond;
    projectileOwners.push(
      Object.freeze({
        resolvedOrder,
        instanceId,
        ownerActorId: module.ownerId,
        attackChannelId: attack.attackChannelId,
        channelId: channel.channelId,
        poolId: resolvedPoolId,
        activeProjectiles: module.resourceGrant.activeProjectiles,
        spawnsPerSecond: module.resourceGrant.spawnsPerSecond,
        cumulativeActiveProjectiles,
        cumulativeSpawnsPerSecond,
      }),
    );
  }
  if (
    cumulativeActiveProjectiles > assembly.globalBudget.activeProjectiles ||
    cumulativeSpawnsPerSecond > assembly.globalBudget.spawnsPerSecond
  )
    fail(
      ModuleResolutionErrorCode.resourceBudgetExceeded,
      "projectile aggregate exceeds its assembly budget",
    );
  const projectileBudgetContention = Object.freeze({
    budget: Object.freeze({
      activeProjectiles: assembly.globalBudget.activeProjectiles,
      spawnsPerSecond: assembly.globalBudget.spawnsPerSecond,
    }),
    totals: Object.freeze({
      activeProjectiles: cumulativeActiveProjectiles,
      spawnsPerSecond: cumulativeSpawnsPerSecond,
    }),
    orderedOwners: Object.freeze(projectileOwners),
  });

  const projectileChannelLineages: ResolvedProjectileChannelLineageV13[] = [];
  for (const module of modules) {
    const manifest = registrationByInstance.get(module.instanceId)!.manifest;
    if (
      manifest.schemaVersion !== "1.3.0" ||
      manifest.projectileChannelConsumer === null
    )
      continue;
    const descriptor = manifest.projectileChannelConsumer;
    const matches = legacy.bindings.filter(
      (binding) =>
        binding.to.instanceId === module.instanceId &&
        binding.to.portId === descriptor.sourceChannelInputPort,
    );
    if (matches.length !== 1)
      fail(
        ModuleResolutionErrorCode.invalidProjectileChannelLineage,
        `projectile consumer requires one source binding: ${module.instanceId}`,
      );
    const sourceBinding = matches[0]!;
    const provider = registrationByInstance.get(sourceBinding.from.instanceId);
    const providesCapability = provider?.manifest.provides.some(
      (capability) =>
        capability.id === "delivery.projectile-channel" &&
        capability.version === "1.0.0",
    );
    const channel = legacy.entityChannels.find(
      (candidate) =>
        candidate.ownerInstanceId === sourceBinding.from.instanceId &&
        candidate.outputPort === sourceBinding.from.portId &&
        candidate.entityRole === descriptor.sourceEntityRole,
    );
    if (!providesCapability || channel === undefined)
      fail(
        ModuleResolutionErrorCode.invalidProjectileChannelLineage,
        `projectile capability does not match exact channel provider: ${module.instanceId}`,
      );
    if (descriptor.role === "contact-detector") {
      const candidateBindings = legacy.bindings.filter(
        (binding) =>
          binding.from.instanceId === module.instanceId &&
          binding.from.portId === descriptor.candidateOutputPort,
      );
      if (candidateBindings.length !== 1)
        fail(
          ModuleResolutionErrorCode.invalidProjectileChannelLineage,
          `contact candidate must have one resolution binding: ${module.instanceId}`,
        );
      const resolutionInstanceId = candidateBindings[0]!.to.instanceId;
      const resolutionManifest =
        registrationByInstance.get(resolutionInstanceId)?.manifest;
      const mutationInput =
        resolutionManifest?.schemaVersion !== "1.0.0"
          ? resolutionManifest?.contactResolution?.mutationChannelInputPort
          : undefined;
      const mutationBindings = legacy.bindings.filter(
        (binding) =>
          binding.to.instanceId === resolutionInstanceId &&
          binding.to.portId === mutationInput,
      );
      const grant = legacy.entityMutationGrants.find(
        (candidate) =>
          candidate.granteeInstanceId === resolutionInstanceId &&
          candidate.channelId === channel.channelId,
      );
      if (
        mutationBindings.length !== 1 ||
        mutationBindings[0]!.from.instanceId !==
          sourceBinding.from.instanceId ||
        mutationBindings[0]!.from.portId !== sourceBinding.from.portId ||
        grant === undefined
      )
        fail(
          ModuleResolutionErrorCode.invalidProjectileChannelLineage,
          `candidate and mutation grant split projectile lineage: ${module.instanceId}`,
        );
    }
    projectileChannelLineages.push(
      Object.freeze({
        lineageId: `${module.instanceId}/projectile-lineage/${channel.channelId}`,
        providerInstanceId: sourceBinding.from.instanceId,
        providerCapabilityId: "delivery.projectile-channel",
        sourceBinding,
        channelId: channel.channelId,
        channelOutputPort: sourceBinding.from.portId,
        consumerInstanceId: module.instanceId,
        consumerInputPort: descriptor.sourceChannelInputPort,
      }),
    );
  }

  const effectApplicationRoutes: ResolvedEffectApplicationRouteV13[] = [];
  for (const binding of assembly.effectApplicationBindings) {
    const source = registrationByInstance.get(
      binding.from.instanceId,
    )?.manifest;
    const target = registrationByInstance.get(binding.to.instanceId)?.manifest;
    const commit =
      source?.schemaVersion === "1.3.0" ? source.preparedEffectCommit : null;
    const targets =
      target?.schemaVersion === "1.3.0" ? target.modifierTargets : [];
    const targetDescriptor = targets.filter(
      (candidate) =>
        candidate.inputPort === binding.to.portId &&
        candidate.fieldId === binding.fieldId &&
        candidate.operation === binding.operation,
    );
    if (
      commit === null ||
      commit.applicationRouteSourceId !==
        binding.from.applicationRouteSourceId ||
      targetDescriptor.length !== 1
    )
      fail(
        ModuleResolutionErrorCode.invalidEffectApplicationRoute,
        `effect binding does not resolve one exact target: ${binding.bindingId}`,
      );
    effectApplicationRoutes.push(
      Object.freeze({
        routeId: `${binding.from.instanceId}.effect-route.${binding.bindingId}`,
        bindingId: binding.bindingId,
        sourceInstanceId: binding.from.instanceId,
        applicationRouteSourceId: binding.from.applicationRouteSourceId,
        targetInstanceId: binding.to.instanceId,
        targetInputPort: binding.to.portId,
        fieldId: binding.fieldId,
        operation: binding.operation,
        payloadType: "modifier-application-v1",
        targetLeaseId: `start/effect-target/${binding.from.instanceId}.effect-route.${binding.bindingId}`,
      }),
    );
  }
  const pickupEffectPlans: ResolvedPickupEffectPlanV13[] = [];
  for (const selection of assembly.pickupEffectPlanSelections) {
    const commitManifest = registrationByInstance.get(
      selection.commitInstanceId,
    )?.manifest;
    const transformManifest = registrationByInstance.get(
      selection.transformInstanceId,
    )?.manifest;
    const commitManifestV13 =
      commitManifest?.schemaVersion === "1.3.0" ? commitManifest : undefined;
    const commit = commitManifestV13?.preparedEffectCommit ?? null;
    const transform =
      transformManifest?.schemaVersion === "1.3.0"
        ? transformManifest.pickupEffectPlanTransform
        : null;
    const routes = effectApplicationRoutes.filter(
      (route) => route.sourceInstanceId === selection.commitInstanceId,
    );
    const mutationAccess =
      commit === null
        ? undefined
        : commitManifestV13?.entityMutationAccess?.find(
            (access) =>
              access.inputPort === commit.mutationChannelStateInputPort &&
              access.operations.length === 1 &&
              access.operations[0] === "consume",
          );
    const mutationBindings =
      commit === null
        ? []
        : legacy.bindings.filter(
            (binding) =>
              binding.to.instanceId === selection.commitInstanceId &&
              binding.to.portId === commit.mutationChannelStateInputPort,
          );
    const mutationChannel =
      mutationBindings.length !== 1
        ? undefined
        : legacy.entityChannels.find(
            (channel) =>
              channel.ownerInstanceId ===
                mutationBindings[0]!.from.instanceId &&
              channel.outputPort === mutationBindings[0]!.from.portId,
          );
    const mutationGrant =
      mutationAccess === undefined || mutationChannel === undefined
        ? undefined
        : legacy.entityMutationGrants.find(
            (grant) =>
              grant.granteeInstanceId === selection.commitInstanceId &&
              grant.accessId === mutationAccess.accessId &&
              grant.channelId === mutationChannel.channelId &&
              grant.operations.length === 1 &&
              grant.operations[0] === "consume",
          );
    if (
      commit === null ||
      transform === null ||
      commit.effectPlanProfileId !== selection.profileId ||
      transform.profileId !== selection.profileId ||
      routes.length > commit.maximumApplicationsPerCommit ||
      routes.length > transform.maximumApplicationsPerPlan ||
      mutationGrant === undefined ||
      mutationChannel === undefined
    )
      fail(
        ModuleResolutionErrorCode.invalidEffectPlanSelection,
        `pickup effect plan selection does not close: ${selection.commitInstanceId}`,
      );
    pickupEffectPlans.push(
      Object.freeze({
        commitInstanceId: selection.commitInstanceId,
        transformInstanceId: selection.transformInstanceId,
        profileId: selection.profileId,
        mutationChannelId: mutationChannel.channelId,
        mutationGrantId: mutationGrant.grantId,
        maximumApplicationsPerCommit: commit.maximumApplicationsPerCommit,
        routeIds: Object.freeze(routes.map((route) => route.routeId).sort()),
      }),
    );
  }
  for (const module of modules) {
    const manifest = registrationByInstance.get(module.instanceId)!.manifest;
    if (
      manifest.schemaVersion === "1.3.0" &&
      manifest.preparedEffectCommit !== null &&
      pickupEffectPlans.filter(
        (plan) => plan.commitInstanceId === module.instanceId,
      ).length !== 1
    )
      fail(
        ModuleResolutionErrorCode.invalidEffectPlanSelection,
        `prepared effect commit requires one plan selection: ${module.instanceId}`,
      );
  }

  const resolvedAssets: ResolvedAssemblyAssetBindingV12[] = [];
  for (const module of modules) {
    const manifest = registrationByInstance.get(module.instanceId)!.manifest;
    if (
      manifest.schemaVersion !== "1.2.0" &&
      manifest.schemaVersion !== "1.3.0"
    )
      continue;
    for (const requirement of manifest.assetRequirements) {
      const matches = assembly.assetBindings.filter(
        (binding) =>
          binding.roleId === requirement.roleId &&
          binding.category === requirement.category &&
          binding.sharing === requirement.sharing &&
          binding.consumerInstanceIds.includes(module.instanceId),
      );
      if (matches.length === 0 && requirement.cardinality === "optional-one")
        continue;
      if (matches.length !== 1) {
        blockers.push({
          instanceId: module.instanceId,
          code:
            matches.length === 0
              ? "missing-required-asset"
              : "ambiguous-asset-binding",
        });
        continue;
      }
      const binding = matches[0]!;
      const admitted = assetEvidence.assets.find(
        (asset) => asset.assetId === binding.artifact.assetId,
      );
      if (
        admitted === undefined ||
        admitted.sourceSha256 !== binding.artifact.sourceSha256 ||
        admitted.runtimeSha256 !== binding.artifact.runtimeSha256 ||
        admitted.provenanceId !== binding.artifact.provenanceId ||
        admitted.licenseRecordId !== binding.artifact.licenseRecordId ||
        admitted.attributionRecordId !== binding.artifact.attributionRecordId ||
        (binding.sharing === "assembly" &&
          !assetEvidence.approvedSharingEvidenceIds.includes(
            binding.approvedSharingEvidenceId!,
          ))
      ) {
        blockers.push({
          instanceId: module.instanceId,
          code: "unadmitted-asset-evidence",
        });
        continue;
      }
      if (
        !resolvedAssets.some((asset) => asset.bindingId === binding.bindingId)
      )
        resolvedAssets.push(
          Object.freeze({
            bindingId: binding.bindingId,
            roleId: binding.roleId,
            category: binding.category,
            runtimeSha256: binding.artifact.runtimeSha256,
            textureKey: `module/${binding.artifact.runtimeSha256}/${binding.bindingId}`,
            sharing: binding.sharing,
            consumerInstanceIds: Object.freeze([
              ...binding.consumerInstanceIds,
            ]),
            ...(binding.approvedSharingEvidenceId === undefined
              ? {}
              : {
                  approvedSharingEvidenceId: binding.approvedSharingEvidenceId,
                }),
          }),
        );
    }
  }

  const catalogEvidenceId = sha256CanonicalJson(
    modules.map((module) => ({
      instanceId: module.instanceId,
      manifestSchemaVersion: module.manifestSchemaVersion,
      factoryContextVersion: module.factoryContextVersion,
      catalogEntryEvidenceId: module.catalogEntryEvidenceId ?? null,
    })),
  );
  const sortedBlockers = Object.freeze(
    blockers
      .map((blocker) => Object.freeze(blocker))
      .sort(
        (left, right) =>
          left.instanceId.localeCompare(right.instanceId) ||
          left.code.localeCompare(right.code),
      ),
  );
  const status =
    sortedBlockers.length === 0 ? ("ready" as const) : ("blocked" as const);
  const graphBasis = {
    graphVersion: "1.3.0",
    assemblyId: assembly.assemblyId,
    catalogEvidenceId,
    constructionOrder: legacy.constructionOrder,
    modules: modules.map((module) => ({
      instanceId: module.instanceId,
      manifestSchemaVersion: module.manifestSchemaVersion,
      factoryContextVersion: module.factoryContextVersion,
      manifestSha256: module.manifestSha256,
      catalogEntryEvidenceId: module.catalogEntryEvidenceId ?? null,
    })),
    actorSnapshotGrants,
    entityChannelReadGrants,
    attackChannels,
    projectileChannelLineages,
    effectApplicationRoutes,
    pickupEffectPlans,
    projectileBudgetContention,
    assets: resolvedAssets,
    blockers: sortedBlockers,
  };
  const graphEvidenceId = sha256CanonicalJson(graphBasis);
  const readinessReport = deepFreezeData({
    graphEvidenceId,
    status,
    blockers: sortedBlockers,
  }) as ExecutionReadinessReport;
  const graph = deepFreezeData({
    graphVersion: "1.3.0",
    assemblyId: assembly.assemblyId,
    kernelVersion: assembly.kernelVersion,
    engine: { ...assembly.engine },
    executionReadiness: { status, evidenceId: graphEvidenceId },
    catalogEvidenceId,
    actors: legacy.actors,
    modules,
    dependencyEdges: legacy.dependencyEdges,
    capabilityEdges: legacy.capabilityEdges,
    bindings: legacy.bindings,
    constructionOrder: legacy.constructionOrder,
    assetBindings: resolvedAssets,
    contactPolicyProfiles: legacy.contactPolicyProfiles,
    damageSinkRoutes: legacy.damageSinkRoutes,
    entityChannels: legacy.entityChannels,
    entityMutationGrants: legacy.entityMutationGrants,
    actorSnapshotGrants,
    entityChannelReadGrants,
    attackChannels,
    projectileChannelLineages,
    effectApplicationRoutes,
    pickupEffectPlans,
    projectileBudgetContention,
    resourceTotals: legacy.resourceTotals,
  }) as ResolvedModuleGraphV13;
  ResolvedModuleGraphV13Schema.parse(graph);
  return Object.freeze({ graph, readinessReport });
}
