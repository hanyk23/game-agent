import { z } from "zod";

import {
  CapabilityScopeSchema,
  ContactDetectorDescriptorSchema,
  ContactDetectorDescriptorV12Schema,
  ContactPolicyTransformDescriptorSchema,
  ContactResolutionDescriptorSchema,
  ContactResolutionDescriptorV12Schema,
  DamageSinkDescriptorSchema,
  EntityMutationAccessDescriptorSchema,
  EndpointAuthorizationSchema,
  OwnedEntityChannelDescriptorSchema,
  MovementArbiterCapabilityDescriptorV12Schema,
  ProjectileDeliveryCapabilityDescriptorV12Schema,
  PortDeliverySchema,
} from "./game-module-execution-contract.js";

const LogicalIdSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/);

const InstanceIdSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/);

const ConfigurationFieldSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z][A-Za-z0-9]*$/);

export const SemanticVersionSchema = z
  .string()
  .regex(
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/,
    "versions must use major.minor.patch without prerelease syntax",
  );

export const VersionRangeSchema = z
  .string()
  .regex(
    /^(?:\^|~)?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/,
    "version ranges support only exact, caret, or tilde selectors",
  );

export const ModuleKindSchema = z.enum([
  "player-intent",
  "locomotion",
  "targeting",
  "attack-trigger",
  "attack-delivery",
  "combat-interaction",
  "progression-loadout",
  "encounter-flow",
  "companion-behavior",
  "scoring",
  "outcome",
]);

export const PortPayloadTypeSchema = z.enum([
  "movement-vector-v1",
  "movement-command-v1",
  "resolved-movement-command-v1",
  "aim-vector-v1",
  "attack-intent-v1",
  "target-selection-v1",
  "attack-request-v1",
  "entity-channel-v1",
  "emission-v1",
  "contact-candidate-v1",
  "contact-decision-v1",
  "hit-v1",
  "damage-v1",
  "health-state-v1",
  "resource-transaction-v1",
  "modifier-application-v1",
  "encounter-transition-v1",
]);

export const ModuleResourceBudgetSchema = z.strictObject({
  activeEntities: z.number().int().min(0).max(10_000),
  activeProjectiles: z.number().int().min(0).max(10_000),
  spawnsPerSecond: z.number().int().min(0).max(10_000),
  timers: z.number().int().min(0).max(10_000),
});

const ProvidedCapabilitySchema = z.strictObject({
  id: LogicalIdSchema,
  version: SemanticVersionSchema,
});

const ProvidedCapabilityV11Schema = ProvidedCapabilitySchema.extend({
  scope: CapabilityScopeSchema,
});

const RequiredCapabilitySchema = z.strictObject({
  id: LogicalIdSchema,
  versionRange: VersionRangeSchema,
  cardinality: z.enum(["exactly-one", "at-least-one"]),
});

const RequiredCapabilityV11Schema = RequiredCapabilitySchema.extend({
  scope: CapabilityScopeSchema,
});

const InputPortSchema = z.strictObject({
  id: LogicalIdSchema,
  payloadType: PortPayloadTypeSchema,
  required: z.boolean(),
  multiple: z.boolean(),
});

const OutputPortSchema = z.strictObject({
  id: LogicalIdSchema,
  payloadType: PortPayloadTypeSchema,
});

const InputPortV11Schema = InputPortSchema.extend({
  delivery: PortDeliverySchema,
  authorization: EndpointAuthorizationSchema,
});

const OutputPortV11Schema = OutputPortSchema.extend({
  delivery: PortDeliverySchema,
  entityRole: LogicalIdSchema.optional(),
});

export const RuntimeLeaseCeilingsSchema = z.strictObject({
  startLeases: z.number().int().min(0).max(10_000),
  instanceLeases: z.number().int().min(0).max(10_000),
  graphLeases: z.number().int().min(0).max(10_000),
});

const ModuleDependencySchema = z.strictObject({
  moduleId: LogicalIdSchema,
  versionRange: VersionRangeSchema,
  optional: z.boolean(),
});

export const ModuleDependencyV12Schema = ModuleDependencySchema.extend({
  scope: z.enum(["owner", "assembly"]),
});

export const ModuleAssetRequirementV12Schema = z.strictObject({
  roleId: LogicalIdSchema,
  category: z.enum([
    "player",
    "enemy",
    "boss",
    "background",
    "projectile",
    "pickup",
    "ui",
    "effect",
  ]),
  cardinality: z.enum(["exactly-one", "optional-one"]),
  sharing: z.enum(["instance", "assembly"]),
});

export const ModuleRuntimeContractV12Schema = z.strictObject({
  update: z
    .strictObject({
      mode: z.literal("graph-frame-v1"),
      registrationId: LogicalIdSchema,
    })
    .nullable(),
  timerSlots: z.strictObject({ slotGroupId: LogicalIdSchema }),
  inputRegistrations: z.array(
    z.strictObject({
      registrationId: LogicalIdSchema,
      kind: z.enum(["keyboard", "pointer-down", "pointer-move", "pointer-up"]),
    }),
  ),
  observationReaders: z.array(z.strictObject({ readerId: LogicalIdSchema })),
  contactCommit: z
    .strictObject({
      commitServiceId: LogicalIdSchema,
      maximumConcurrentCommits: z.number().int().min(1).max(256),
      admittedOperations: z
        .array(z.enum(["consume", "retain"]))
        .min(1)
        .max(2),
    })
    .nullable(),
});

const OwnedPoolDescriptorV12Schema = z.strictObject({
  poolId: LogicalIdSchema,
  entityRole: LogicalIdSchema,
  capacityResource: z.literal("activeEntities"),
  projectileResource: z.literal("activeProjectiles").nullable(),
});

const OwnedEntityChannelDescriptorV12Schema =
  OwnedEntityChannelDescriptorSchema.extend({
    entityRole: LogicalIdSchema,
    poolDescriptor: OwnedPoolDescriptorV12Schema.optional(),
  });

function reportDuplicateIds(
  values: readonly string[],
  field: string,
  context: z.RefinementCtx,
): void {
  const seen = new Set<string>();
  for (const [index, value] of values.entries()) {
    if (seen.has(value)) {
      context.addIssue({
        code: "custom",
        message: `duplicate ${field}: ${value}`,
        path: [field, index],
      });
    }
    seen.add(value);
  }
}

export const GameModuleManifestV10Schema = z
  .strictObject({
    schemaVersion: z.literal("1.0.0"),
    moduleId: LogicalIdSchema,
    version: SemanticVersionSchema,
    kind: ModuleKindSchema,
    implementationId: LogicalIdSchema,
    configurationSchemaId: LogicalIdSchema,
    kernelVersionRange: VersionRangeSchema,
    engine: z.strictObject({
      id: z.literal("phaser"),
      versionRange: VersionRangeSchema,
    }),
    provides: z.array(ProvidedCapabilitySchema).max(32),
    requires: z.array(RequiredCapabilitySchema).max(32),
    inputPorts: z.array(InputPortSchema).max(32),
    outputPorts: z.array(OutputPortSchema).max(32),
    dependencies: z.array(ModuleDependencySchema).max(32),
    conflicts: z.array(LogicalIdSchema).max(32),
    exclusiveOwnership: z.array(LogicalIdSchema).max(32),
    cardinality: z.strictObject({
      maximumInstancesPerAssembly: z.number().int().min(1).max(128),
      maximumInstancesPerOwner: z.number().int().min(1).max(32),
    }),
    resources: ModuleResourceBudgetSchema,
    browserSupport: z.strictObject({
      desktop: z.boolean(),
      touch: z.boolean(),
    }),
    evidence: z.strictObject({
      provenanceId: LogicalIdSchema,
      testSuiteId: LogicalIdSchema,
      sha256: z.string().regex(/^[a-f0-9]{64}$/),
    }),
  })
  .superRefine((manifest, context) => {
    reportDuplicateIds(
      manifest.provides.map((entry) => entry.id),
      "provides",
      context,
    );
    reportDuplicateIds(
      manifest.requires.map((entry) => entry.id),
      "requires",
      context,
    );
    reportDuplicateIds(
      manifest.inputPorts.map((entry) => entry.id),
      "inputPorts",
      context,
    );
    reportDuplicateIds(
      manifest.outputPorts.map((entry) => entry.id),
      "outputPorts",
      context,
    );
    reportDuplicateIds(
      manifest.dependencies.map((entry) => entry.moduleId),
      "dependencies",
      context,
    );
    reportDuplicateIds(manifest.conflicts, "conflicts", context);
    reportDuplicateIds(
      manifest.exclusiveOwnership,
      "exclusiveOwnership",
      context,
    );
    if (manifest.conflicts.includes(manifest.moduleId)) {
      context.addIssue({
        code: "custom",
        message: "a module cannot conflict with itself",
        path: ["conflicts"],
      });
    }
  });

export const GameModuleManifestV11Schema = z
  .strictObject({
    schemaVersion: z.literal("1.1.0"),
    moduleId: LogicalIdSchema,
    version: SemanticVersionSchema,
    kind: ModuleKindSchema,
    implementationId: LogicalIdSchema,
    configurationSchemaId: LogicalIdSchema,
    kernelVersionRange: VersionRangeSchema,
    engine: z.strictObject({
      id: z.literal("phaser"),
      versionRange: VersionRangeSchema,
    }),
    provides: z.array(ProvidedCapabilityV11Schema).max(32),
    requires: z.array(RequiredCapabilityV11Schema).max(32),
    inputPorts: z.array(InputPortV11Schema).max(32),
    outputPorts: z.array(OutputPortV11Schema).max(32),
    dependencies: z.array(ModuleDependencySchema).max(32),
    conflicts: z.array(LogicalIdSchema).max(32),
    exclusiveOwnership: z.array(LogicalIdSchema).max(32),
    cardinality: z.strictObject({
      maximumInstancesPerAssembly: z.number().int().min(1).max(128),
      maximumInstancesPerOwner: z.number().int().min(1).max(32),
    }),
    resources: ModuleResourceBudgetSchema,
    runtimeLeases: RuntimeLeaseCeilingsSchema,
    ownedEntityChannels: z
      .array(OwnedEntityChannelDescriptorSchema)
      .max(16)
      .optional(),
    entityMutationAccess: z
      .array(EntityMutationAccessDescriptorSchema)
      .max(16)
      .optional(),
    contactDetector: ContactDetectorDescriptorSchema.optional(),
    contactResolution: ContactResolutionDescriptorSchema.optional(),
    damageSink: DamageSinkDescriptorSchema.optional(),
    contactPolicyTransform: ContactPolicyTransformDescriptorSchema.optional(),
    browserSupport: z.strictObject({
      desktop: z.boolean(),
      touch: z.boolean(),
    }),
    evidence: z.strictObject({
      provenanceId: LogicalIdSchema,
      testSuiteId: LogicalIdSchema,
    }),
  })
  .superRefine((manifest, context) => {
    reportDuplicateIds(
      manifest.provides.map((entry) => entry.id),
      "provides",
      context,
    );
    reportDuplicateIds(
      manifest.requires.map((entry) => entry.id),
      "requires",
      context,
    );
    reportDuplicateIds(
      manifest.inputPorts.map((entry) => entry.id),
      "inputPorts",
      context,
    );
    reportDuplicateIds(
      manifest.outputPorts.map((entry) => entry.id),
      "outputPorts",
      context,
    );
    reportDuplicateIds(
      manifest.dependencies.map((entry) => entry.moduleId),
      "dependencies",
      context,
    );
    reportDuplicateIds(manifest.conflicts, "conflicts", context);
    reportDuplicateIds(
      manifest.exclusiveOwnership,
      "exclusiveOwnership",
      context,
    );
    reportDuplicateIds(
      (manifest.ownedEntityChannels ?? []).map((entry) => entry.channelId),
      "ownedEntityChannels",
      context,
    );
    reportDuplicateIds(
      (manifest.ownedEntityChannels ?? []).map((entry) => entry.outputPort),
      "ownedEntityChannelOutputs",
      context,
    );
    reportDuplicateIds(
      (manifest.entityMutationAccess ?? []).map((entry) => entry.accessId),
      "entityMutationAccess",
      context,
    );
    reportDuplicateIds(
      (manifest.entityMutationAccess ?? []).map((entry) => entry.inputPort),
      "entityMutationInputs",
      context,
    );
    if (manifest.conflicts.includes(manifest.moduleId)) {
      context.addIssue({
        code: "custom",
        message: "a module cannot conflict with itself",
        path: ["conflicts"],
      });
    }
    const hasPolicyExecution = manifest.contactPolicyTransform !== undefined;
    for (const [index, channel] of (
      manifest.ownedEntityChannels ?? []
    ).entries()) {
      const output = manifest.outputPorts.find(
        (port) => port.id === channel.outputPort,
      );
      if (
        output === undefined ||
        output.payloadType !== "entity-channel-v1" ||
        output.delivery !== "state" ||
        output.entityRole === undefined
      ) {
        context.addIssue({
          code: "custom",
          message:
            "owned entity channel outputPort must name a state entity-channel-v1 output with entityRole",
          path: ["ownedEntityChannels", index, "outputPort"],
        });
      }
    }
    for (const [index, access] of (
      manifest.entityMutationAccess ?? []
    ).entries()) {
      const input = manifest.inputPorts.find(
        (port) => port.id === access.inputPort,
      );
      if (
        input === undefined ||
        input.payloadType !== "entity-channel-v1" ||
        input.delivery !== "state" ||
        !input.required ||
        input.multiple
      ) {
        context.addIssue({
          code: "custom",
          message:
            "entity mutation inputPort must name a required single state entity-channel-v1 input",
          path: ["entityMutationAccess", index, "inputPort"],
        });
      }
    }
    if (manifest.contactDetector !== undefined) {
      const source = manifest.inputPorts.find(
        (port) => port.id === manifest.contactDetector?.sourceChannelInputPort,
      );
      const candidate = manifest.outputPorts.find(
        (port) => port.id === manifest.contactDetector?.candidateOutputPort,
      );
      if (
        source?.payloadType !== "entity-channel-v1" ||
        source.delivery !== "state" ||
        !source.required ||
        source.multiple ||
        candidate?.payloadType !== "contact-candidate-v1" ||
        candidate.delivery !== "event"
      ) {
        context.addIssue({
          code: "custom",
          message:
            "contact detector ports do not match channel-to-candidate lineage",
          path: ["contactDetector"],
        });
      }
    }
    if (manifest.contactResolution !== undefined) {
      const candidate = manifest.inputPorts.find(
        (port) => port.id === manifest.contactResolution?.candidateInputPort,
      );
      const channel = manifest.inputPorts.find(
        (port) =>
          port.id === manifest.contactResolution?.mutationChannelInputPort,
      );
      if (
        candidate?.payloadType !== "contact-candidate-v1" ||
        candidate.delivery !== "event" ||
        !candidate.required ||
        candidate.multiple ||
        channel?.payloadType !== "entity-channel-v1" ||
        channel.delivery !== "state" ||
        !channel.required ||
        channel.multiple ||
        !(manifest.entityMutationAccess ?? []).some(
          (access) => access.inputPort === channel.id,
        )
      ) {
        context.addIssue({
          code: "custom",
          message:
            "contact resolution ports do not close candidate/channel lineage",
          path: ["contactResolution"],
        });
      }
    }
    if (
      (manifest.entityMutationAccess ?? []).length > 0 &&
      manifest.contactResolution === undefined
    ) {
      context.addIssue({
        code: "custom",
        message:
          "external entity mutation access is reserved for declared contact resolution",
        path: ["entityMutationAccess"],
      });
    }
    if (
      [...manifest.inputPorts, ...manifest.outputPorts].some(
        (port) => port.payloadType === "contact-decision-v1",
      )
    ) {
      context.addIssue({
        code: "custom",
        message:
          "contact-decision-v1 is transaction-internal and cannot use ordinary ports",
        path: ["inputPorts"],
      });
    }
    if (
      hasPolicyExecution &&
      manifest.inputPorts.length + manifest.outputPorts.length > 0
    ) {
      context.addIssue({
        code: "custom",
        message: "contact policy transforms cannot expose ordinary ports",
        path: ["contactPolicyTransform"],
      });
    }
    if (manifest.damageSink !== undefined) {
      const input = manifest.inputPorts.find(
        (port) => port.id === manifest.damageSink?.inputPort,
      );
      if (
        input === undefined ||
        input.payloadType !== "damage-v1" ||
        input.delivery !== "event" ||
        !input.required
      ) {
        context.addIssue({
          code: "custom",
          message:
            "damage sink inputPort must name a required event damage-v1 input",
          path: ["damageSink", "inputPort"],
        });
      }
      if (manifest.damageSink.downstreamOutputPort !== undefined) {
        const output = manifest.outputPorts.find(
          (port) => port.id === manifest.damageSink?.downstreamOutputPort,
        );
        if (
          output === undefined ||
          output.payloadType !== "damage-v1" ||
          output.delivery !== "event"
        ) {
          context.addIssue({
            code: "custom",
            message:
              "damage sink downstreamOutputPort must name an event damage-v1 output",
            path: ["damageSink", "downstreamOutputPort"],
          });
        }
      }
    }
  });

export const GameModuleManifestV12Schema = z
  .strictObject({
    schemaVersion: z.literal("1.2.0"),
    moduleId: LogicalIdSchema,
    version: SemanticVersionSchema,
    kind: ModuleKindSchema,
    implementationId: LogicalIdSchema,
    configurationSchemaId: LogicalIdSchema,
    kernelVersionRange: VersionRangeSchema,
    engine: z.strictObject({
      id: z.literal("phaser"),
      versionRange: VersionRangeSchema,
    }),
    provides: z.array(ProvidedCapabilityV11Schema).max(32),
    requires: z.array(RequiredCapabilityV11Schema).max(32),
    inputPorts: z.array(InputPortV11Schema).max(32),
    outputPorts: z.array(OutputPortV11Schema).max(32),
    dependencies: z.array(ModuleDependencyV12Schema).max(32),
    assetRequirements: z.array(ModuleAssetRequirementV12Schema).max(32),
    conflicts: z.array(LogicalIdSchema).max(32),
    exclusiveOwnership: z.array(LogicalIdSchema).max(32),
    cardinality: z.strictObject({
      maximumInstancesPerAssembly: z.number().int().min(1).max(128),
      maximumInstancesPerOwner: z.number().int().min(1).max(32),
    }),
    resources: ModuleResourceBudgetSchema,
    runtimeLeases: RuntimeLeaseCeilingsSchema,
    runtimeContract: ModuleRuntimeContractV12Schema,
    ownedEntityChannels: z
      .array(OwnedEntityChannelDescriptorV12Schema)
      .max(16)
      .optional(),
    entityMutationAccess: z
      .array(EntityMutationAccessDescriptorSchema)
      .max(16)
      .optional(),
    contactDetector: ContactDetectorDescriptorV12Schema.optional(),
    contactResolution: ContactResolutionDescriptorV12Schema.optional(),
    damageSink: DamageSinkDescriptorSchema.optional(),
    contactPolicyTransform: ContactPolicyTransformDescriptorSchema.optional(),
    movementArbiter: MovementArbiterCapabilityDescriptorV12Schema.optional(),
    projectileDelivery:
      ProjectileDeliveryCapabilityDescriptorV12Schema.optional(),
    sharedSemantics: z
      .strictObject({
        touchUncapturedMovement: z.literal("ignore"),
        triggerResumeCadence: z.literal("preserve-simulation-time"),
        fixedForwardOwner: z.enum(["attack-trigger", "attack-delivery"]),
        defaultPolicySuccessorProfileId: LogicalIdSchema.optional(),
      })
      .optional(),
    browserSupport: z.strictObject({
      desktop: z.boolean(),
      touch: z.boolean(),
    }),
    evidence: z.strictObject({
      provenanceId: LogicalIdSchema,
      testSuiteId: LogicalIdSchema,
    }),
  })
  .superRefine((manifest, context) => {
    for (const [field, values] of [
      ["provides", manifest.provides.map((entry) => entry.id)],
      ["requires", manifest.requires.map((entry) => entry.id)],
      ["inputPorts", manifest.inputPorts.map((entry) => entry.id)],
      ["outputPorts", manifest.outputPorts.map((entry) => entry.id)],
      [
        "assetRequirements",
        manifest.assetRequirements.map((entry) => entry.roleId),
      ],
      [
        "inputRegistrations",
        manifest.runtimeContract.inputRegistrations.map(
          (entry) => entry.registrationId,
        ),
      ],
      [
        "observationReaders",
        manifest.runtimeContract.observationReaders.map(
          (entry) => entry.readerId,
        ),
      ],
    ] as const) {
      reportDuplicateIds(values, field, context);
    }
    const dependencyKeys = manifest.dependencies.map(
      (entry) => `${entry.scope}:${entry.moduleId}`,
    );
    reportDuplicateIds(dependencyKeys, "dependencies", context);
    const channels = manifest.ownedEntityChannels ?? [];
    reportDuplicateIds(
      channels.map((entry) => entry.channelId),
      "ownedEntityChannels",
      context,
    );
    reportDuplicateIds(
      channels.flatMap((entry) =>
        entry.poolDescriptor === undefined ? [] : [entry.poolDescriptor.poolId],
      ),
      "ownedPools",
      context,
    );
    for (const [index, channel] of channels.entries()) {
      const output = manifest.outputPorts.find(
        (port) => port.id === channel.outputPort,
      );
      if (
        output?.payloadType !== "entity-channel-v1" ||
        output.delivery !== "state" ||
        output.entityRole !== channel.entityRole
      ) {
        context.addIssue({
          code: "custom",
          message:
            "owned channel role must match its state entity-channel output",
          path: ["ownedEntityChannels", index],
        });
      }
      const pool = channel.poolDescriptor;
      if (
        pool !== undefined &&
        (pool.entityRole !== channel.entityRole ||
          (channel.entityRole === "projectile") !==
            (pool.projectileResource === "activeProjectiles"))
      ) {
        context.addIssue({
          code: "custom",
          message: "pool role/resource does not match its owned channel",
          path: ["ownedEntityChannels", index, "poolDescriptor"],
        });
      }
    }
    if (
      manifest.runtimeContract.observationReaders.length > 8 ||
      manifest.runtimeContract.inputRegistrations.length > 32
    ) {
      context.addIssue({
        code: "custom",
        message: "runtime registration hard limit exceeded",
        path: ["runtimeContract"],
      });
    }
    const commit = manifest.runtimeContract.contactCommit;
    if (
      (manifest.contactResolution === undefined) !== (commit === null) ||
      (commit !== null && commit.admittedOperations.includes("retain"))
    ) {
      context.addIssue({
        code: "custom",
        message:
          "Batch 1 contact resolution requires a consume-only commit service",
        path: ["runtimeContract", "contactCommit"],
      });
    }
    const providesMovementArbiter = manifest.provides.some(
      (entry) => entry.id === "intent.movement-arbiter",
    );
    if (providesMovementArbiter !== (manifest.movementArbiter !== undefined)) {
      context.addIssue({
        code: "custom",
        message:
          "movement-arbiter capability requires its canonical descriptor",
        path: ["movementArbiter"],
      });
    }
    const providesProjectileDelivery = manifest.provides.some(
      (entry) => entry.id === "delivery.projectile",
    );
    if (
      providesProjectileDelivery !==
        (manifest.projectileDelivery !== undefined) ||
      (manifest.projectileDelivery !== undefined &&
        !channels.some(
          (channel) =>
            channel.channelId === manifest.projectileDelivery?.channelId &&
            channel.entityRole === "projectile",
        ))
    ) {
      context.addIssue({
        code: "custom",
        message:
          "projectile delivery requires its canonical projectile channel",
        path: ["projectileDelivery"],
      });
    }
    const minimumStartLeases =
      manifest.resources.timers +
      manifest.runtimeContract.inputRegistrations.length +
      (manifest.runtimeContract.update === null ? 0 : 1) +
      manifest.inputPorts.length +
      (manifest.contactDetector === undefined ? 0 : 1);
    const minimumInstanceLeases =
      manifest.runtimeContract.observationReaders.length +
      manifest.outputPorts.filter((port) => port.delivery === "state").length +
      channels.reduce(
        (count, channel) =>
          count + 1 + (channel.poolDescriptor === undefined ? 0 : 1),
        0,
      ) +
      (manifest.entityMutationAccess?.length ?? 0) +
      (commit === null ? 0 : 1);
    if (
      minimumStartLeases > manifest.runtimeLeases.startLeases ||
      minimumInstanceLeases > manifest.runtimeLeases.instanceLeases
    ) {
      context.addIssue({
        code: "custom",
        message: "runtime descriptor exceeds the declared lease ceiling",
        path: ["runtimeLeases"],
      });
    }
  });

const PortPayloadTypeV13Schema = z.union([
  PortPayloadTypeSchema,
  z.enum([
    "aim-command-v1",
    "focus-state-v1",
    "movement-scale-v1",
    "target-solution-v1",
    "attack-request-v2",
    "modifier-state-v1",
    "health-state-v2",
    "defense-state-v1",
    "defense-result-v1",
    "graze-v1",
    "pickup-collected-v1",
  ]),
]);

const InputPortV13Schema = InputPortV11Schema.extend({
  payloadType: PortPayloadTypeV13Schema,
});

const OutputPortV13Schema = OutputPortV11Schema.extend({
  payloadType: PortPayloadTypeV13Schema,
});

const ActorRoleSchema = z.enum([
  "player",
  "enemy",
  "boss",
  "companion",
  "world",
]);

export const ActorSnapshotReadDescriptorV1Schema = z.strictObject({
  readId: LogicalIdSchema,
  ownerRelation: z.enum(["same-owner", "different-owner"]),
  sourceActorRoles: z.array(ActorRoleSchema).min(1).max(5),
  targetActorRoles: z.array(ActorRoleSchema).min(1).max(5),
  maximumEntries: z.number().int().min(1).max(128),
  entryFields: z
    .array(
      z.enum([
        "actorId",
        "actorGeneration",
        "role",
        "active",
        "position",
        "collisionRadius",
        "healthRatio",
      ]),
    )
    .min(1)
    .max(7),
  envelopeFields: z.tuple([
    z.literal("directoryRevision"),
    z.literal("sampledAtMs"),
    z.literal("sampledFrameSequence"),
    z.literal("entryCount"),
  ]),
  order: z.enum(["distance-then-actor-id-generation", "actor-id-generation"]),
  distanceOrigin: z.literal("owner-position-same-snapshot").nullable(),
});

export const EntityChannelReadDescriptorV1Schema = z.strictObject({
  readId: LogicalIdSchema,
  channelStateInputPort: LogicalIdSchema,
  sourceEntityRole: LogicalIdSchema,
  targetActorRoles: z.array(ActorRoleSchema).min(1).max(5),
  maximumEntriesSource: z.literal("resolved-channel-capacity"),
  entryFields: z
    .array(
      z.enum([
        "entityId",
        "generation",
        "position",
        "collisionRadius",
        "active",
      ]),
    )
    .min(1)
    .max(5),
  order: z.literal("entity-id-generation"),
});

export const AttackChannelDescriptorV1Schema = z.discriminatedUnion("role", [
  z.strictObject({
    role: z.literal("targeting"),
    configurationField: z.literal("attackChannelId"),
    targetOutputPort: LogicalIdSchema,
    targetPayloadType: z.literal("target-solution-v1"),
  }),
  z.strictObject({
    role: z.literal("trigger"),
    configurationField: z.literal("attackChannelId"),
    requestOutputPort: LogicalIdSchema,
    requestPayloadType: z.literal("attack-request-v2"),
  }),
  z.strictObject({
    role: z.literal("delivery"),
    configurationField: z.literal("attackChannelId"),
    targetInputPort: LogicalIdSchema,
    targetPayloadType: z.literal("target-solution-v1"),
    requestInputPort: LogicalIdSchema,
    requestPayloadType: z.literal("attack-request-v2"),
  }),
]);

export const ProjectileChannelConsumerDescriptorV1Schema = z.discriminatedUnion(
  "role",
  [
    z.strictObject({
      role: z.literal("contact-detector"),
      sourceChannelInputPort: LogicalIdSchema,
      candidateOutputPort: LogicalIdSchema,
      requiredCapability: z.literal("delivery.projectile-channel@1.0.0"),
      sourceEntityRole: z.literal("projectile"),
    }),
    z.strictObject({
      role: z.literal("graze-reader"),
      sourceChannelInputPort: LogicalIdSchema,
      readId: LogicalIdSchema,
      requiredCapability: z.literal("delivery.projectile-channel@1.0.0"),
      sourceEntityRole: z.literal("projectile"),
    }),
  ],
);

export const PreparedEffectCommitDescriptorV1Schema = z.strictObject({
  commitServiceId: LogicalIdSchema,
  mutationChannelStateInputPort: LogicalIdSchema,
  admittedSourceOperation: z.literal("consume"),
  effectPlanProfileId: LogicalIdSchema,
  collectedOutputPort: LogicalIdSchema,
  applicationRouteSourceId: LogicalIdSchema,
  maximumApplicationsPerCommit: z.number().int().min(0).max(32),
  maximumConcurrentCommits: z.number().int().min(1).max(256),
  duplicateLedgerCapacity: z.number().int().min(1).max(10_000),
});

export const ModifierTargetDescriptorV1Schema = z.strictObject({
  fieldId: z.enum([
    "combat.health.current",
    "combat.shield.current",
    "attack.damage.multiplier",
    "attack.projectile-count.bonus",
  ]),
  inputPort: LogicalIdSchema,
  operation: z.literal("add"),
  minimum: z.number().finite(),
  maximum: z.number().finite(),
  reset: z.literal("dispose-new-graph"),
});

export const PickupEffectPlanTransformDescriptorV1Schema = z.strictObject({
  profileId: LogicalIdSchema,
  exportKind: z.literal("pickup-effect-plan-transform-v1"),
  maximumApplicationsPerPlan: z.number().int().min(0).max(32),
});

export const GameModuleManifestV13Schema = z
  .strictObject({
    ...GameModuleManifestV12Schema.shape,
    schemaVersion: z.literal("1.3.0"),
    inputPorts: z.array(InputPortV13Schema).max(32),
    outputPorts: z.array(OutputPortV13Schema).max(32),
    actorSnapshotReads: z.array(ActorSnapshotReadDescriptorV1Schema).max(16),
    entityChannelReads: z.array(EntityChannelReadDescriptorV1Schema).max(16),
    projectileChannelConsumer:
      ProjectileChannelConsumerDescriptorV1Schema.nullable(),
    attackChannel: AttackChannelDescriptorV1Schema.nullable(),
    preparedEffectCommit: PreparedEffectCommitDescriptorV1Schema.nullable(),
    modifierTargets: z.array(ModifierTargetDescriptorV1Schema).max(16),
    pickupEffectPlanTransform:
      PickupEffectPlanTransformDescriptorV1Schema.nullable(),
  })
  .superRefine((manifest, context) => {
    const {
      actorSnapshotReads,
      entityChannelReads,
      projectileChannelConsumer,
      attackChannel,
      preparedEffectCommit,
      modifierTargets,
      pickupEffectPlanTransform,
      ...v12Fields
    } = manifest;
    const inheritedInputPorts = v12Fields.inputPorts.map((port) => ({
      ...port,
      payloadType: PortPayloadTypeSchema.safeParse(port.payloadType).success
        ? port.payloadType
        : "movement-vector-v1",
    }));
    const inheritedOutputPorts = v12Fields.outputPorts.map((port) => ({
      ...port,
      payloadType: PortPayloadTypeSchema.safeParse(port.payloadType).success
        ? port.payloadType
        : "movement-vector-v1",
    }));
    const preparedMutationInput =
      preparedEffectCommit?.mutationChannelStateInputPort;
    const inheritedMutationAccess = v12Fields.entityMutationAccess?.filter(
      (access) => access.inputPort !== preparedMutationInput,
    );
    const inherited = GameModuleManifestV12Schema.safeParse({
      ...v12Fields,
      schemaVersion: "1.2.0",
      inputPorts: inheritedInputPorts,
      outputPorts: inheritedOutputPorts,
      entityMutationAccess: inheritedMutationAccess,
    });
    if (!inherited.success) {
      for (const issue of inherited.error.issues)
        context.addIssue({ ...issue, path: issue.path });
    }
    for (const [field, values] of [
      ["actorSnapshotReads", actorSnapshotReads.map((entry) => entry.readId)],
      ["entityChannelReads", entityChannelReads.map((entry) => entry.readId)],
      ["modifierTargets", modifierTargets.map((entry) => entry.fieldId)],
    ] as const)
      reportDuplicateIds(values, field, context);
    for (const [index, read] of actorSnapshotReads.entries()) {
      if (
        new Set(read.entryFields).size !== read.entryFields.length ||
        !read.entryFields.includes("actorId") ||
        !read.entryFields.includes("actorGeneration") ||
        !read.entryFields.includes("active") ||
        (read.order === "distance-then-actor-id-generation") !==
          (read.distanceOrigin === "owner-position-same-snapshot")
      )
        context.addIssue({
          code: "custom",
          message: "actor snapshot identity fields or distance origin invalid",
          path: ["actorSnapshotReads", index],
        });
    }
    for (const [index, read] of entityChannelReads.entries()) {
      if (
        new Set(read.entryFields).size !== read.entryFields.length ||
        !manifest.inputPorts.some(
          (port) =>
            port.id === read.channelStateInputPort &&
            port.payloadType === "entity-channel-v1" &&
            port.delivery === "state",
        )
      )
        context.addIssue({
          code: "custom",
          message: "entity channel read fields or input port invalid",
          path: ["entityChannelReads", index],
        });
    }
    if (attackChannel !== null) {
      const port =
        attackChannel.role === "targeting"
          ? manifest.outputPorts.find(
              (entry) => entry.id === attackChannel.targetOutputPort,
            )
          : attackChannel.role === "trigger"
            ? manifest.outputPorts.find(
                (entry) => entry.id === attackChannel.requestOutputPort,
              )
            : undefined;
      if (
        (attackChannel.role === "targeting" && port?.delivery !== "state") ||
        (attackChannel.role === "trigger" && port?.delivery !== "event") ||
        (attackChannel.role === "targeting" &&
          port?.payloadType !== "target-solution-v1") ||
        (attackChannel.role === "trigger" &&
          port?.payloadType !== "attack-request-v2") ||
        (attackChannel.role === "delivery" &&
          (!manifest.inputPorts.some(
            (entry) =>
              entry.id === attackChannel.targetInputPort &&
              entry.payloadType === "target-solution-v1" &&
              entry.delivery === "state",
          ) ||
            !manifest.inputPorts.some(
              (entry) =>
                entry.id === attackChannel.requestInputPort &&
                entry.payloadType === "attack-request-v2" &&
                entry.delivery === "event",
            )))
      )
        context.addIssue({
          code: "custom",
          message: "attack channel descriptor ports do not match its role",
          path: ["attackChannel"],
        });
    }
    if (
      modifierTargets.some(
        (target) =>
          target.minimum > target.maximum ||
          !manifest.inputPorts.some(
            (port) =>
              port.id === target.inputPort &&
              port.payloadType === "modifier-application-v1" &&
              port.delivery === "event",
          ),
      )
    )
      context.addIssue({
        code: "custom",
        message: "modifier target input or bounds invalid",
        path: ["modifierTargets"],
      });
    if (
      attackChannel !== null &&
      ((attackChannel.role === "targeting" && manifest.kind !== "targeting") ||
        (attackChannel.role === "trigger" &&
          manifest.kind !== "attack-trigger") ||
        (attackChannel.role === "delivery" &&
          manifest.kind !== "attack-delivery"))
    )
      context.addIssue({
        code: "custom",
        message: "attack channel role does not match module kind",
        path: ["attackChannel", "role"],
      });
    if (
      preparedEffectCommit !== null &&
      (!manifest.outputPorts.some(
        (port) =>
          port.id === preparedEffectCommit.collectedOutputPort &&
          port.payloadType === "pickup-collected-v1" &&
          port.delivery === "event",
      ) ||
        !manifest.inputPorts.some(
          (port) =>
            port.id === preparedEffectCommit.mutationChannelStateInputPort &&
            port.payloadType === "entity-channel-v1" &&
            port.delivery === "state",
        ) ||
        manifest.outputPorts.some(
          (port) => port.id === preparedEffectCommit.applicationRouteSourceId,
        ) ||
        manifest.entityMutationAccess?.filter(
          (access) =>
            access.inputPort ===
              preparedEffectCommit.mutationChannelStateInputPort &&
            access.operations.length === 1 &&
            access.operations[0] === "consume" &&
            access.transferRecipientActorRoles.length === 0,
        ).length !== 1)
    )
      context.addIssue({
        code: "custom",
        message: "prepared effect output or planner ceiling mismatch",
        path: ["preparedEffectCommit"],
      });
    if (
      projectileChannelConsumer?.role === "graze-reader" &&
      !entityChannelReads.some(
        (read) => read.readId === projectileChannelConsumer.readId,
      )
    )
      context.addIssue({
        code: "custom",
        message:
          "graze projectile consumer requires its channel read descriptor",
        path: ["projectileChannelConsumer"],
      });
    if (
      projectileChannelConsumer?.role === "contact-detector" &&
      (manifest.contactDetector?.sourceChannelInputPort !==
        projectileChannelConsumer.sourceChannelInputPort ||
        manifest.contactDetector?.candidateOutputPort !==
          projectileChannelConsumer.candidateOutputPort)
    )
      context.addIssue({
        code: "custom",
        message: "projectile consumer must close the contact detector ports",
        path: ["projectileChannelConsumer"],
      });
    if (
      pickupEffectPlanTransform !== null &&
      (manifest.contactPolicyTransform !== undefined ||
        manifest.inputPorts.length !== 0 ||
        manifest.outputPorts.length !== 0 ||
        manifest.runtimeContract.update !== null ||
        manifest.runtimeContract.inputRegistrations.length !== 0 ||
        manifest.runtimeContract.observationReaders.length !== 0 ||
        manifest.runtimeContract.contactCommit !== null ||
        manifest.resources.activeEntities !== 0 ||
        manifest.resources.activeProjectiles !== 0 ||
        manifest.resources.spawnsPerSecond !== 0 ||
        manifest.resources.timers !== 0 ||
        manifest.runtimeLeases.startLeases !== 0 ||
        manifest.runtimeLeases.instanceLeases !== 0 ||
        manifest.runtimeLeases.graphLeases !== 0 ||
        (manifest.ownedEntityChannels?.length ?? 0) !== 0 ||
        (manifest.entityMutationAccess?.length ?? 0) !== 0 ||
        actorSnapshotReads.length !== 0 ||
        entityChannelReads.length !== 0 ||
        projectileChannelConsumer !== null ||
        attackChannel !== null ||
        preparedEffectCommit !== null ||
        modifierTargets.length !== 0)
    )
      context.addIssue({
        code: "custom",
        message: "pickup effect transform must expose no lifecycle authority",
        path: ["pickupEffectPlanTransform"],
      });
  });

const PortPayloadTypeV14Schema = z.union([
  PortPayloadTypeV13Schema,
  z.enum([
    "actor-root-channel-v1",
    "actor-root-lifecycle-v1",
    "actor-defeated-v1",
    "encounter-pattern-activation-v1",
    "encounter-handoff-v1",
    "attack-request-v3",
    "targeted-attack-v1",
    "emission-v2",
    "contact-candidate-v2",
    "contact-decision-v2",
    "damage-v2",
    "health-state-v3",
    "defeat-evidence-v1",
    "score-source-v1",
    "score-transaction-v1",
    "score-state-v1",
    "outcome-condition-v1",
    "terminal-decision-v1",
  ]),
]);

const InputPortV14Schema = InputPortV11Schema.extend({
  payloadType: PortPayloadTypeV14Schema,
});

const OutputPortV14Schema = OutputPortV11Schema.extend({
  payloadType: PortPayloadTypeV14Schema,
});

export const ActorRootProducerDescriptorV1Schema = z.strictObject({
  producerId: LogicalIdSchema,
  rootChannelOutputPort: LogicalIdSchema,
  lifecycleOutputPort: LogicalIdSchema,
  actorRole: z.enum(["enemy", "boss"]),
  capacityConfigurationField: ConfigurationFieldSchema,
  sourceIdsConfigurationField: ConfigurationFieldSchema,
  poolId: LogicalIdSchema,
  assetRoleMappingConfigurationField: ConfigurationFieldSchema,
  movementMode: z.enum(["scrolling-wave-v1", "boss-horizontal-v1"]),
});

export const ActorRootConsumerDescriptorV1Schema = z.strictObject({
  consumerId: LogicalIdSchema,
  rootChannelInputPort: LogicalIdSchema,
  expectedActorRole: z.enum(["enemy", "boss"]),
  purpose: z.enum([
    "pattern-source",
    "health-bank",
    "projectile-target",
    "body-contact",
    "defeat-scoring",
    "boss-phase",
    "outcome",
  ]),
  maximumEntries: z.number().int().min(1).max(10_000),
});

export const HostileAttackChannelDescriptorV1Schema = z.discriminatedUnion(
  "role",
  [
    z.strictObject({
      role: z.literal("source"),
      configurationField: z.literal("attackChannelId"),
      rootChannelInputPort: LogicalIdSchema,
      lifecycleInputPort: LogicalIdSchema,
      requestOutputPort: LogicalIdSchema,
      requestPayloadType: z.literal("attack-request-v3"),
    }),
    z.strictObject({
      role: z.literal("targeting"),
      configurationField: z.literal("attackChannelId"),
      requestInputPort: LogicalIdSchema,
      targetedOutputPort: LogicalIdSchema,
      requestPayloadType: z.literal("attack-request-v3"),
      targetedPayloadType: z.literal("targeted-attack-v1"),
    }),
    z.strictObject({
      role: z.literal("delivery"),
      configurationField: z.literal("attackChannelId"),
      targetedInputPort: LogicalIdSchema,
      projectileChannelOutputPort: LogicalIdSchema,
      emissionOutputPort: LogicalIdSchema,
      targetedPayloadType: z.literal("targeted-attack-v1"),
      emissionPayloadType: z.literal("emission-v2"),
      requiredAssetRole: z.literal("enemy-projectile"),
    }),
  ],
);

export const AggregateResourceClaimDescriptorV1Schema = z.strictObject({
  claimId: LogicalIdSchema,
  contentionKind: z.literal("hostile-contention-v1"),
  ownedProjectileChannelId: LogicalIdSchema,
  resources: z.tuple([
    z.literal("activeEntities"),
    z.literal("activeProjectiles"),
    z.literal("spawnsPerSecond"),
  ]),
  capacitySource: z.literal("resolved-resource-grant"),
});

export const ActorSetDamageSinkDescriptorV1Schema = z.strictObject({
  rootChannelInputPort: LogicalIdSchema,
  damageInputPort: LogicalIdSchema,
  healthStateOutputPort: LogicalIdSchema,
  defeatedOutputPort: LogicalIdSchema,
  maximumEntriesSource: z.literal("resolved-root-channel-capacity"),
});

export const ActorRootContactConsumerDescriptorV1Schema = z.strictObject({
  rootChannelInputPort: LogicalIdSchema,
  candidateOutputPort: LogicalIdSchema,
  admittedSourceOperation: z.literal("deactivate-root"),
});

export const OutcomeCommitDescriptorV1Schema = z.strictObject({
  commitServiceId: LogicalIdSchema,
  arbitrationPhase: z.literal("post-provider-post-event-frame-v1"),
  winConditionStateInputPort: LogicalIdSchema,
  lossConditionStateInputPort: LogicalIdSchema,
  coordinatorIdentity: z.literal("resolved-instance"),
});

export const GameModuleManifestV14Schema = z
  .strictObject({
    ...GameModuleManifestV13Schema.shape,
    schemaVersion: z.literal("1.4.0"),
    inputPorts: z.array(InputPortV14Schema).max(32),
    outputPorts: z.array(OutputPortV14Schema).max(32),
    actorRootProducer: ActorRootProducerDescriptorV1Schema.nullable(),
    actorRootConsumers: z.array(ActorRootConsumerDescriptorV1Schema).max(16),
    hostileAttackChannel: HostileAttackChannelDescriptorV1Schema.nullable(),
    aggregateResourceClaims: z
      .array(AggregateResourceClaimDescriptorV1Schema)
      .max(16),
    actorSetDamageSink: ActorSetDamageSinkDescriptorV1Schema.nullable(),
    actorRootContactConsumer:
      ActorRootContactConsumerDescriptorV1Schema.nullable(),
    outcomeCommit: OutcomeCommitDescriptorV1Schema.nullable(),
  })
  .superRefine((manifest, context) => {
    const {
      actorRootProducer,
      actorRootConsumers,
      hostileAttackChannel,
      aggregateResourceClaims,
      actorSetDamageSink,
      actorRootContactConsumer,
      outcomeCommit,
      ...v13Fields
    } = manifest;
    const mapInheritedPayload = <T extends { payloadType: string }>(
      port: T,
    ) => ({
      ...port,
      payloadType: PortPayloadTypeV13Schema.safeParse(port.payloadType).success
        ? port.payloadType
        : "movement-vector-v1",
    });
    const inherited = GameModuleManifestV13Schema.safeParse({
      ...v13Fields,
      schemaVersion: "1.3.0",
      inputPorts: v13Fields.inputPorts.map(mapInheritedPayload),
      outputPorts: v13Fields.outputPorts.map(mapInheritedPayload),
    });
    if (!inherited.success)
      for (const issue of inherited.error.issues)
        context.addIssue({ ...issue, path: issue.path });

    reportDuplicateIds(
      actorRootConsumers.map((entry) => entry.consumerId),
      "actorRootConsumers",
      context,
    );
    reportDuplicateIds(
      aggregateResourceClaims.map((entry) => entry.claimId),
      "aggregateResourceClaims",
      context,
    );
    const input = (
      id: string,
      payloadType: string,
      delivery: "state" | "event",
    ) =>
      manifest.inputPorts.some(
        (port) =>
          port.id === id &&
          port.payloadType === payloadType &&
          port.delivery === delivery,
      );
    const output = (
      id: string,
      payloadType: string,
      delivery: "state" | "event",
    ) =>
      manifest.outputPorts.some(
        (port) =>
          port.id === id &&
          port.payloadType === payloadType &&
          port.delivery === delivery,
      );

    if (
      actorRootProducer !== null &&
      (!output(
        actorRootProducer.rootChannelOutputPort,
        "actor-root-channel-v1",
        "state",
      ) ||
        !output(
          actorRootProducer.lifecycleOutputPort,
          "actor-root-lifecycle-v1",
          "event",
        ) ||
        manifest.kind !== "encounter-flow")
    )
      context.addIssue({
        code: "custom",
        message: "actor-root producer ports or module kind are invalid",
        path: ["actorRootProducer"],
      });
    for (const [index, consumer] of actorRootConsumers.entries())
      if (
        !input(consumer.rootChannelInputPort, "actor-root-channel-v1", "state")
      )
        context.addIssue({
          code: "custom",
          message: "actor-root consumer requires its exact state input",
          path: ["actorRootConsumers", index],
        });

    if (hostileAttackChannel !== null) {
      const valid =
        hostileAttackChannel.role === "source"
          ? manifest.kind === "attack-trigger" &&
            input(
              hostileAttackChannel.rootChannelInputPort,
              "actor-root-channel-v1",
              "state",
            ) &&
            input(
              hostileAttackChannel.lifecycleInputPort,
              "actor-root-lifecycle-v1",
              "event",
            ) &&
            output(
              hostileAttackChannel.requestOutputPort,
              "attack-request-v3",
              "event",
            )
          : hostileAttackChannel.role === "targeting"
            ? manifest.kind === "targeting" &&
              input(
                hostileAttackChannel.requestInputPort,
                "attack-request-v3",
                "event",
              ) &&
              output(
                hostileAttackChannel.targetedOutputPort,
                "targeted-attack-v1",
                "event",
              )
            : manifest.kind === "attack-delivery" &&
              input(
                hostileAttackChannel.targetedInputPort,
                "targeted-attack-v1",
                "event",
              ) &&
              output(
                hostileAttackChannel.projectileChannelOutputPort,
                "entity-channel-v1",
                "state",
              ) &&
              output(
                hostileAttackChannel.emissionOutputPort,
                "emission-v2",
                "event",
              );
      if (!valid)
        context.addIssue({
          code: "custom",
          message: "hostile attack descriptor ports do not match its role",
          path: ["hostileAttackChannel"],
        });
    }
    if (
      aggregateResourceClaims.length > 0 &&
      (hostileAttackChannel?.role !== "delivery" ||
        aggregateResourceClaims.some(
          (claim) =>
            !manifest.ownedEntityChannels?.some(
              (channel) =>
                channel.channelId === claim.ownedProjectileChannelId &&
                channel.entityRole === "projectile",
            ),
        ))
    )
      context.addIssue({
        code: "custom",
        message: "aggregate claims require the exact hostile delivery channel",
        path: ["aggregateResourceClaims"],
      });
    if (
      actorSetDamageSink !== null &&
      (!input(
        actorSetDamageSink.rootChannelInputPort,
        "actor-root-channel-v1",
        "state",
      ) ||
        !input(actorSetDamageSink.damageInputPort, "damage-v2", "event") ||
        !output(
          actorSetDamageSink.healthStateOutputPort,
          "health-state-v3",
          "state",
        ) ||
        !output(
          actorSetDamageSink.defeatedOutputPort,
          "actor-defeated-v1",
          "event",
        ))
    )
      context.addIssue({
        code: "custom",
        message: "actor-set damage sink ports are invalid",
        path: ["actorSetDamageSink"],
      });
    if (
      actorRootContactConsumer !== null &&
      (!input(
        actorRootContactConsumer.rootChannelInputPort,
        "actor-root-channel-v1",
        "state",
      ) ||
        !output(
          actorRootContactConsumer.candidateOutputPort,
          "contact-candidate-v2",
          "event",
        ))
    )
      context.addIssue({
        code: "custom",
        message: "actor-root contact consumer ports are invalid",
        path: ["actorRootContactConsumer"],
      });
    if (
      outcomeCommit !== null &&
      (!input(
        outcomeCommit.winConditionStateInputPort,
        "outcome-condition-v1",
        "state",
      ) ||
        !input(
          outcomeCommit.lossConditionStateInputPort,
          "outcome-condition-v1",
          "state",
        ) ||
        manifest.kind !== "outcome" ||
        manifest.runtimeContract.update !== null)
    )
      context.addIssue({
        code: "custom",
        message:
          "outcome commit requires exact state ports and no update lease",
        path: ["outcomeCommit"],
      });
  });

export const GameModuleManifestSchema = z.discriminatedUnion("schemaVersion", [
  GameModuleManifestV10Schema,
  GameModuleManifestV11Schema,
  GameModuleManifestV12Schema,
  GameModuleManifestV13Schema,
  GameModuleManifestV14Schema,
]);

const ActorSchema = z.strictObject({
  actorId: InstanceIdSchema,
  role: z.enum(["player", "enemy", "boss", "companion", "world"]),
});

const ModuleRequestSchema = z.strictObject({
  instanceId: InstanceIdSchema,
  moduleId: LogicalIdSchema,
  versionRange: VersionRangeSchema,
  ownerId: InstanceIdSchema,
  configuration: z.json(),
});

const PortReferenceSchema = z.strictObject({
  instanceId: InstanceIdSchema,
  portId: LogicalIdSchema,
});

const PortBindingSchema = z.strictObject({
  from: PortReferenceSchema,
  to: PortReferenceSchema,
});

const ContactPolicySelectionSchema = z.strictObject({
  consumerInstanceId: InstanceIdSchema,
  profileId: LogicalIdSchema,
  version: SemanticVersionSchema,
});

const DamageSinkRouteSelectionSchema = z.strictObject({
  ownerId: InstanceIdSchema,
  headInstanceId: InstanceIdSchema,
});

const EntityMutationGrantSelectionSchema = z.strictObject({
  granteeInstanceId: InstanceIdSchema,
  accessId: LogicalIdSchema,
  transferRecipientActorIds: z.array(InstanceIdSchema).max(128),
});

const AssetRoleSchema = z.strictObject({
  roleId: LogicalIdSchema,
  category: z.enum([
    "player",
    "enemy",
    "boss",
    "background",
    "projectile",
    "pickup",
    "ui",
    "effect",
  ]),
  requiredByInstanceIds: z.array(InstanceIdSchema).min(1).max(64),
});

export const GameAssemblySpecV10Schema = z
  .strictObject({
    schemaVersion: z.literal("1.0.0"),
    assemblyId: LogicalIdSchema,
    kernelVersion: SemanticVersionSchema,
    engine: z.strictObject({
      id: z.literal("phaser"),
      version: SemanticVersionSchema,
    }),
    actors: z.array(ActorSchema).min(1).max(128),
    modules: z.array(ModuleRequestSchema).min(1).max(128),
    bindings: z.array(PortBindingSchema).max(256),
    assetRoles: z.array(AssetRoleSchema).max(128),
    contactPolicySelections: z
      .array(ContactPolicySelectionSchema)
      .max(64)
      .optional(),
    damageSinkRoutes: z
      .array(DamageSinkRouteSelectionSchema)
      .max(128)
      .optional(),
    entityMutationGrantSelections: z
      .array(EntityMutationGrantSelectionSchema)
      .max(128)
      .optional(),
    globalBudget: ModuleResourceBudgetSchema,
  })
  .superRefine((assembly, context) => {
    reportDuplicateIds(
      assembly.actors.map((entry) => entry.actorId),
      "actors",
      context,
    );
    reportDuplicateIds(
      assembly.modules.map((entry) => entry.instanceId),
      "modules",
      context,
    );
    reportDuplicateIds(
      assembly.assetRoles.map((entry) => entry.roleId),
      "assetRoles",
      context,
    );

    const playerCount = assembly.actors.filter(
      (actor) => actor.role === "player",
    ).length;
    if (playerCount !== 1) {
      context.addIssue({
        code: "custom",
        message: "single-player assemblies require exactly one player actor",
        path: ["actors"],
      });
    }

    const actorIds = new Set(assembly.actors.map((entry) => entry.actorId));
    for (const [index, request] of assembly.modules.entries()) {
      if (!actorIds.has(request.ownerId)) {
        context.addIssue({
          code: "custom",
          message: `unknown module owner: ${request.ownerId}`,
          path: ["modules", index, "ownerId"],
        });
      }
    }

    const instanceIds = new Set(
      assembly.modules.map((entry) => entry.instanceId),
    );
    for (const [index, binding] of assembly.bindings.entries()) {
      if (!instanceIds.has(binding.from.instanceId)) {
        context.addIssue({
          code: "custom",
          message: `unknown binding source: ${binding.from.instanceId}`,
          path: ["bindings", index, "from", "instanceId"],
        });
      }
      if (!instanceIds.has(binding.to.instanceId)) {
        context.addIssue({
          code: "custom",
          message: `unknown binding target: ${binding.to.instanceId}`,
          path: ["bindings", index, "to", "instanceId"],
        });
      }
    }
    for (const [roleIndex, assetRole] of assembly.assetRoles.entries()) {
      for (const [
        instanceIndex,
        instanceId,
      ] of assetRole.requiredByInstanceIds.entries()) {
        if (!instanceIds.has(instanceId)) {
          context.addIssue({
            code: "custom",
            message: `unknown asset-role module: ${instanceId}`,
            path: [
              "assetRoles",
              roleIndex,
              "requiredByInstanceIds",
              instanceIndex,
            ],
          });
        }
      }
    }
    for (const [index, selection] of (
      assembly.contactPolicySelections ?? []
    ).entries()) {
      if (!instanceIds.has(selection.consumerInstanceId)) {
        context.addIssue({
          code: "custom",
          message: `unknown policy consumer: ${selection.consumerInstanceId}`,
          path: ["contactPolicySelections", index, "consumerInstanceId"],
        });
      }
    }
    reportDuplicateIds(
      (assembly.contactPolicySelections ?? []).map(
        (selection) => selection.consumerInstanceId,
      ),
      "contactPolicySelections",
      context,
    );
    reportDuplicateIds(
      (assembly.damageSinkRoutes ?? []).map((route) => route.ownerId),
      "damageSinkRoutes",
      context,
    );
    for (const [index, route] of (assembly.damageSinkRoutes ?? []).entries()) {
      if (!actorIds.has(route.ownerId)) {
        context.addIssue({
          code: "custom",
          message: `unknown damage route owner: ${route.ownerId}`,
          path: ["damageSinkRoutes", index, "ownerId"],
        });
      }
      if (!instanceIds.has(route.headInstanceId)) {
        context.addIssue({
          code: "custom",
          message: `unknown damage route head: ${route.headInstanceId}`,
          path: ["damageSinkRoutes", index, "headInstanceId"],
        });
      }
    }
    const grantKeys = new Set<string>();
    for (const [index, selection] of (
      assembly.entityMutationGrantSelections ?? []
    ).entries()) {
      const key = `${selection.granteeInstanceId}.${selection.accessId}`;
      if (grantKeys.has(key)) {
        context.addIssue({
          code: "custom",
          message: `duplicate entity mutation grant selection: ${key}`,
          path: ["entityMutationGrantSelections", index],
        });
      }
      grantKeys.add(key);
      if (!instanceIds.has(selection.granteeInstanceId)) {
        context.addIssue({
          code: "custom",
          message: `unknown entity mutation grantee: ${selection.granteeInstanceId}`,
          path: ["entityMutationGrantSelections", index, "granteeInstanceId"],
        });
      }
      if (
        new Set(selection.transferRecipientActorIds).size !==
        selection.transferRecipientActorIds.length
      ) {
        context.addIssue({
          code: "custom",
          message: "duplicate entity mutation transfer recipient",
          path: [
            "entityMutationGrantSelections",
            index,
            "transferRecipientActorIds",
          ],
        });
      }
      for (const actorId of selection.transferRecipientActorIds) {
        if (!actorIds.has(actorId)) {
          context.addIssue({
            code: "custom",
            message: `unknown entity mutation transfer recipient: ${actorId}`,
            path: [
              "entityMutationGrantSelections",
              index,
              "transferRecipientActorIds",
            ],
          });
        }
      }
    }
  });

const AssemblyAssetBindingV11Schema = z.strictObject({
  bindingId: LogicalIdSchema,
  roleId: LogicalIdSchema,
  category: z.enum([
    "player",
    "enemy",
    "boss",
    "background",
    "projectile",
    "pickup",
    "ui",
    "effect",
  ]),
  artifact: z.strictObject({
    assetId: LogicalIdSchema,
    sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
    runtimeSha256: z.string().regex(/^[a-f0-9]{64}$/),
    provenanceId: LogicalIdSchema,
    licenseRecordId: LogicalIdSchema,
    attributionRecordId: LogicalIdSchema.optional(),
  }),
  sharing: z.enum(["instance", "assembly"]),
  approvedSharingEvidenceId: LogicalIdSchema.optional(),
  consumerInstanceIds: z.array(InstanceIdSchema).min(1).max(128),
});

export const GameAssemblySpecV11Schema = z
  .strictObject({
    schemaVersion: z.literal("1.1.0"),
    assemblyId: LogicalIdSchema,
    kernelVersion: SemanticVersionSchema,
    engine: z.strictObject({
      id: z.literal("phaser"),
      version: SemanticVersionSchema,
    }),
    actors: z.array(ActorSchema).min(1).max(128),
    modules: z.array(ModuleRequestSchema).min(1).max(128),
    bindings: z.array(PortBindingSchema).max(256),
    assetRoles: z.array(AssetRoleSchema).max(128),
    assetBindings: z.array(AssemblyAssetBindingV11Schema).max(256),
    contactPolicySelections: z
      .array(ContactPolicySelectionSchema)
      .max(64)
      .optional(),
    damageSinkRoutes: z
      .array(DamageSinkRouteSelectionSchema)
      .max(128)
      .optional(),
    entityMutationGrantSelections: z
      .array(EntityMutationGrantSelectionSchema)
      .max(128)
      .optional(),
    globalBudget: ModuleResourceBudgetSchema,
  })
  .superRefine((assembly, context) => {
    reportDuplicateIds(
      assembly.actors.map((entry) => entry.actorId),
      "actors",
      context,
    );
    reportDuplicateIds(
      assembly.modules.map((entry) => entry.instanceId),
      "modules",
      context,
    );
    reportDuplicateIds(
      assembly.assetBindings.map((entry) => entry.bindingId),
      "assetBindings",
      context,
    );
    const instanceIds = new Set(
      assembly.modules.map((entry) => entry.instanceId),
    );
    if (
      assembly.actors.filter((actor) => actor.role === "player").length !== 1
    ) {
      context.addIssue({
        code: "custom",
        message: "single-player assemblies require exactly one player actor",
        path: ["actors"],
      });
    }
    for (const [index, request] of assembly.modules.entries()) {
      if (!assembly.actors.some((actor) => actor.actorId === request.ownerId)) {
        context.addIssue({
          code: "custom",
          message: `unknown module owner: ${request.ownerId}`,
          path: ["modules", index, "ownerId"],
        });
      }
    }
    for (const [index, binding] of assembly.bindings.entries()) {
      if (
        !instanceIds.has(binding.from.instanceId) ||
        !instanceIds.has(binding.to.instanceId)
      ) {
        context.addIssue({
          code: "custom",
          message: "binding references an unknown module instance",
          path: ["bindings", index],
        });
      }
    }
    for (const [index, binding] of assembly.assetBindings.entries()) {
      const consumers = new Set(binding.consumerInstanceIds);
      if (
        consumers.size !== binding.consumerInstanceIds.length ||
        [...consumers].some((id) => !instanceIds.has(id))
      ) {
        context.addIssue({
          code: "custom",
          message: "asset binding consumers must be unique known instances",
          path: ["assetBindings", index, "consumerInstanceIds"],
        });
      }
      if (
        (binding.sharing === "instance" &&
          binding.consumerInstanceIds.length !== 1) ||
        (binding.sharing === "instance" &&
          binding.approvedSharingEvidenceId !== undefined) ||
        (binding.sharing === "assembly" &&
          (binding.consumerInstanceIds.length < 2 ||
            binding.approvedSharingEvidenceId === undefined))
      ) {
        context.addIssue({
          code: "custom",
          message: "asset sharing evidence/cardinality mismatch",
          path: ["assetBindings", index],
        });
      }
    }
  });

const EffectApplicationBindingV1Schema = z.strictObject({
  bindingId: LogicalIdSchema,
  from: z.strictObject({
    instanceId: InstanceIdSchema,
    applicationRouteSourceId: LogicalIdSchema,
  }),
  to: PortReferenceSchema,
  fieldId: z.enum([
    "combat.health.current",
    "combat.shield.current",
    "attack.damage.multiplier",
    "attack.projectile-count.bonus",
  ]),
  operation: z.literal("add"),
});

const PickupEffectPlanSelectionV1Schema = z.strictObject({
  commitInstanceId: InstanceIdSchema,
  transformInstanceId: InstanceIdSchema,
  profileId: LogicalIdSchema,
});

export const GameAssemblySpecV12Schema = z
  .strictObject({
    ...GameAssemblySpecV11Schema.shape,
    schemaVersion: z.literal("1.2.0"),
    effectApplicationBindings: z
      .array(EffectApplicationBindingV1Schema)
      .max(256),
    pickupEffectPlanSelections: z
      .array(PickupEffectPlanSelectionV1Schema)
      .max(64),
  })
  .superRefine((assembly, context) => {
    const {
      effectApplicationBindings,
      pickupEffectPlanSelections,
      ...v11Fields
    } = assembly;
    const inherited = GameAssemblySpecV11Schema.safeParse({
      ...v11Fields,
      schemaVersion: "1.1.0",
    });
    if (!inherited.success) {
      for (const issue of inherited.error.issues)
        context.addIssue({ ...issue, path: issue.path });
    }
    reportDuplicateIds(
      effectApplicationBindings.map((binding) => binding.bindingId),
      "effectApplicationBindings",
      context,
    );
    const instanceIds = new Set(
      assembly.modules.map((module) => module.instanceId),
    );
    for (const [index, binding] of effectApplicationBindings.entries()) {
      if (
        !instanceIds.has(binding.from.instanceId) ||
        !instanceIds.has(binding.to.instanceId)
      )
        context.addIssue({
          code: "custom",
          message: "effect application binding references an unknown instance",
          path: ["effectApplicationBindings", index],
        });
    }
    const selectionKeys = pickupEffectPlanSelections.map(
      (selection) => selection.commitInstanceId,
    );
    reportDuplicateIds(selectionKeys, "pickupEffectPlanSelections", context);
    for (const [index, selection] of pickupEffectPlanSelections.entries()) {
      if (
        !instanceIds.has(selection.commitInstanceId) ||
        !instanceIds.has(selection.transformInstanceId) ||
        selection.commitInstanceId === selection.transformInstanceId
      )
        context.addIssue({
          code: "custom",
          message: "pickup effect plan selection instances are invalid",
          path: ["pickupEffectPlanSelections", index],
        });
    }
  });

export const ActorRootBindingV1Schema = z.strictObject({
  bindingId: LogicalIdSchema,
  producerInstanceId: InstanceIdSchema,
  producerOutputPort: LogicalIdSchema,
  consumerInstanceId: InstanceIdSchema,
  consumerInputPort: LogicalIdSchema,
  expectedActorRole: z.enum(["enemy", "boss"]),
  purpose: z.enum([
    "pattern-source",
    "health-bank",
    "projectile-target",
    "body-contact",
    "defeat-scoring",
    "boss-phase",
    "outcome",
  ]),
  maximumEntries: z.number().int().min(1).max(10_000),
});

export const HostileAggregateBudgetGroupV1Schema = z.strictObject({
  groupId: LogicalIdSchema,
  kind: z.literal("hostile-contention-v1"),
  memberInstanceIds: z.array(InstanceIdSchema).min(1).max(128),
  activeEntityCapacity: z.number().int().min(1).max(10_000),
  activeProjectileCapacity: z.number().int().min(1).max(10_000),
  spawnsPerSecondCapacity: z.number().int().min(1).max(10_000),
  ordering: z.literal("resolved-provider-order"),
});

export const ActorSetDamageRouteV1Schema = z.strictObject({
  routeId: LogicalIdSchema,
  rootBindingId: LogicalIdSchema,
  orderedSinkInstanceIds: z.array(InstanceIdSchema).min(1).max(32),
});

export const ActorRootMutationGrantSelectionV1Schema = z.strictObject({
  selectionId: LogicalIdSchema,
  rootBindingId: LogicalIdSchema,
  consumerInstanceId: InstanceIdSchema,
  producerInstanceId: InstanceIdSchema,
  operation: z.literal("deactivate-root"),
});

export const OutcomeCoordinatorSelectionV1Schema = z.strictObject({
  coordinatorInstanceId: InstanceIdSchema,
  winConditionInstanceId: InstanceIdSchema,
  lossConditionInstanceId: InstanceIdSchema,
  arbitrationPhase: z.literal("post-provider-post-event-frame-v1"),
});

export const GameAssemblySpecV13Schema = z
  .strictObject({
    ...GameAssemblySpecV12Schema.shape,
    schemaVersion: z.literal("1.3.0"),
    actorRootBindings: z.array(ActorRootBindingV1Schema).max(256),
    hostileAggregateBudgetGroups: z
      .array(HostileAggregateBudgetGroupV1Schema)
      .max(32),
    actorSetDamageRoutes: z.array(ActorSetDamageRouteV1Schema).max(128),
    actorRootMutationGrantSelections: z
      .array(ActorRootMutationGrantSelectionV1Schema)
      .max(128),
    outcomeCoordinatorSelection: OutcomeCoordinatorSelectionV1Schema.nullable(),
  })
  .superRefine((assembly, context) => {
    const {
      actorRootBindings,
      hostileAggregateBudgetGroups,
      actorSetDamageRoutes,
      actorRootMutationGrantSelections,
      outcomeCoordinatorSelection,
      ...v12Fields
    } = assembly;
    const inherited = GameAssemblySpecV12Schema.safeParse({
      ...v12Fields,
      schemaVersion: "1.2.0",
    });
    if (!inherited.success)
      for (const issue of inherited.error.issues)
        context.addIssue({ ...issue, path: issue.path });

    reportDuplicateIds(
      actorRootBindings.map((entry) => entry.bindingId),
      "actorRootBindings",
      context,
    );
    reportDuplicateIds(
      hostileAggregateBudgetGroups.map((entry) => entry.groupId),
      "hostileAggregateBudgetGroups",
      context,
    );
    reportDuplicateIds(
      actorSetDamageRoutes.map((entry) => entry.routeId),
      "actorSetDamageRoutes",
      context,
    );
    reportDuplicateIds(
      actorRootMutationGrantSelections.map((entry) => entry.selectionId),
      "actorRootMutationGrantSelections",
      context,
    );
    const instanceIds = new Set(
      assembly.modules.map((module) => module.instanceId),
    );
    const bindingIds = new Set(
      actorRootBindings.map((entry) => entry.bindingId),
    );
    for (const [index, binding] of actorRootBindings.entries())
      if (
        !instanceIds.has(binding.producerInstanceId) ||
        !instanceIds.has(binding.consumerInstanceId) ||
        binding.producerInstanceId === binding.consumerInstanceId
      )
        context.addIssue({
          code: "custom",
          message: "actor-root binding references invalid instances",
          path: ["actorRootBindings", index],
        });

    const groupMembership = new Set<string>();
    for (const [index, group] of hostileAggregateBudgetGroups.entries()) {
      const members = new Set(group.memberInstanceIds);
      if (
        members.size !== group.memberInstanceIds.length ||
        [...members].some(
          (member) => !instanceIds.has(member) || groupMembership.has(member),
        )
      )
        context.addIssue({
          code: "custom",
          message:
            "hostile contention membership must be unique known instances",
          path: ["hostileAggregateBudgetGroups", index, "memberInstanceIds"],
        });
      for (const member of members) groupMembership.add(member);
    }
    for (const [index, route] of actorSetDamageRoutes.entries())
      if (
        !bindingIds.has(route.rootBindingId) ||
        new Set(route.orderedSinkInstanceIds).size !==
          route.orderedSinkInstanceIds.length ||
        route.orderedSinkInstanceIds.some((id) => !instanceIds.has(id))
      )
        context.addIssue({
          code: "custom",
          message: "actor-set damage route is not a unique known linear route",
          path: ["actorSetDamageRoutes", index],
        });
    for (const [index, selection] of actorRootMutationGrantSelections.entries())
      if (
        !bindingIds.has(selection.rootBindingId) ||
        !instanceIds.has(selection.consumerInstanceId) ||
        !instanceIds.has(selection.producerInstanceId) ||
        selection.consumerInstanceId === selection.producerInstanceId
      )
        context.addIssue({
          code: "custom",
          message: "actor-root mutation selection references invalid lineage",
          path: ["actorRootMutationGrantSelections", index],
        });
    if (
      outcomeCoordinatorSelection !== null &&
      (!instanceIds.has(outcomeCoordinatorSelection.coordinatorInstanceId) ||
        !instanceIds.has(outcomeCoordinatorSelection.winConditionInstanceId) ||
        !instanceIds.has(outcomeCoordinatorSelection.lossConditionInstanceId) ||
        new Set([
          outcomeCoordinatorSelection.coordinatorInstanceId,
          outcomeCoordinatorSelection.winConditionInstanceId,
          outcomeCoordinatorSelection.lossConditionInstanceId,
        ]).size !== 3)
    )
      context.addIssue({
        code: "custom",
        message:
          "outcome coordinator selection requires three distinct instances",
        path: ["outcomeCoordinatorSelection"],
      });
  });

export const GameAssemblySpecSchema = z.discriminatedUnion("schemaVersion", [
  GameAssemblySpecV10Schema,
  GameAssemblySpecV11Schema,
  GameAssemblySpecV12Schema,
  GameAssemblySpecV13Schema,
]);

export type SemanticVersion = z.infer<typeof SemanticVersionSchema>;
export type GameModuleManifest = z.infer<typeof GameModuleManifestSchema>;
export type GameModuleManifestV11 = z.infer<typeof GameModuleManifestV11Schema>;
export type GameModuleManifestV12 = z.infer<typeof GameModuleManifestV12Schema>;
export type GameModuleManifestV13 = z.infer<typeof GameModuleManifestV13Schema>;
export type GameModuleManifestV14 = z.infer<typeof GameModuleManifestV14Schema>;
export type GameAssemblySpec = z.infer<typeof GameAssemblySpecSchema>;
export type GameAssemblySpecV11 = z.infer<typeof GameAssemblySpecV11Schema>;
export type GameAssemblySpecV12 = z.infer<typeof GameAssemblySpecV12Schema>;
export type GameAssemblySpecV13 = z.infer<typeof GameAssemblySpecV13Schema>;
export type ModuleResourceBudget = z.infer<typeof ModuleResourceBudgetSchema>;
export type RuntimeLeaseCeilings = z.infer<typeof RuntimeLeaseCeilingsSchema>;

type VersionParts = Readonly<{
  major: number;
  minor: number;
  patch: number;
}>;

function parseVersionParts(version: string): VersionParts {
  const parsed = SemanticVersionSchema.parse(version);
  const [major, minor, patch] = parsed.split(".").map(Number);
  if (major === undefined || minor === undefined || patch === undefined) {
    throw new Error(`invalid semantic version: ${version}`);
  }
  return { major, minor, patch };
}

export function compareSemanticVersions(left: string, right: string): number {
  const a = parseVersionParts(left);
  const b = parseVersionParts(right);
  return a.major - b.major || a.minor - b.minor || a.patch - b.patch;
}

export function versionSatisfiesRange(
  version: string,
  versionRange: string,
): boolean {
  SemanticVersionSchema.parse(version);
  VersionRangeSchema.parse(versionRange);
  const operator = versionRange.startsWith("^")
    ? "^"
    : versionRange.startsWith("~")
      ? "~"
      : "=";
  const baseText = operator === "=" ? versionRange : versionRange.slice(1);
  const candidate = parseVersionParts(version);
  const base = parseVersionParts(baseText);
  if (compareSemanticVersions(version, baseText) < 0) return false;
  if (operator === "=") return version === baseText;
  if (operator === "~") {
    return candidate.major === base.major && candidate.minor === base.minor;
  }
  if (base.major > 0) return candidate.major === base.major;
  if (base.minor > 0) {
    return candidate.major === 0 && candidate.minor === base.minor;
  }
  return (
    candidate.major === 0 &&
    candidate.minor === 0 &&
    candidate.patch === base.patch
  );
}
