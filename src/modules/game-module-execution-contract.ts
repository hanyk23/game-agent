import { createHash } from "node:crypto";

import { z } from "zod";

import {
  ContactDispositionSchema,
  ContactSourceOperationSchema,
  isLegalContactDecisionPair,
} from "./game-module-runtime-payloads.js";

export * from "./game-module-runtime-payloads.js";

const LogicalIdSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/);
const ConfigurationFieldSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z][A-Za-z0-9]*$/);
const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const NonNegativeIntegerSchema = z.number().int().min(0);
const ActorRoleSchema = z.enum([
  "player",
  "enemy",
  "boss",
  "companion",
  "world",
]);

export const PortDeliverySchema = z.enum(["state", "event"]);
export const CapabilityScopeSchema = z.enum(["owner", "assembly"]);
export const OwnerRelationSchema = z.enum(["same-owner", "different-owner"]);

const EntityCapacityResourceSchema = z.enum([
  "activeEntities",
  "activeProjectiles",
]);

const EntityCapacityResourcesSchema = z
  .array(EntityCapacityResourceSchema)
  .min(1)
  .max(2)
  .superRefine((resources, context) => {
    if (new Set(resources).size !== resources.length) {
      context.addIssue({
        code: "custom",
        message: "entity capacity resources must not contain duplicates",
      });
    }
    if (!resources.includes("activeEntities")) {
      context.addIssue({
        code: "custom",
        message: "entity channels must charge activeEntities",
      });
    }
  });

export const OwnedEntityChannelDescriptorSchema = z.strictObject({
  channelId: LogicalIdSchema,
  outputPort: LogicalIdSchema,
  capacity: z.discriminatedUnion("kind", [
    z.strictObject({
      kind: z.literal("constant"),
      value: z.number().int().min(0).max(10_000),
      resources: EntityCapacityResourcesSchema,
    }),
    z.strictObject({
      kind: z.literal("resource-grant"),
      resources: EntityCapacityResourcesSchema,
    }),
  ]),
});

export const EntityMutationAccessDescriptorSchema = z
  .strictObject({
    accessId: LogicalIdSchema,
    inputPort: LogicalIdSchema,
    operations: z
      .array(z.enum(["consume", "transfer"]))
      .min(1)
      .max(2),
    transferRecipientActorRoles: z.array(ActorRoleSchema).max(5),
  })
  .superRefine((access, context) => {
    if (new Set(access.operations).size !== access.operations.length) {
      context.addIssue({
        code: "custom",
        message: "entity mutation operations must not contain duplicates",
        path: ["operations"],
      });
    }
    if (
      access.operations.includes("transfer") !==
      access.transferRecipientActorRoles.length > 0
    ) {
      context.addIssue({
        code: "custom",
        message:
          "transfer operations require recipient roles and consume-only access forbids them",
        path: ["transferRecipientActorRoles"],
      });
    }
    if (
      new Set(access.transferRecipientActorRoles).size !==
      access.transferRecipientActorRoles.length
    ) {
      context.addIssue({
        code: "custom",
        message: "transfer recipient roles must not contain duplicates",
        path: ["transferRecipientActorRoles"],
      });
    }
  });

export const ContactDetectorDescriptorSchema = z.strictObject({
  sourceChannelInputPort: LogicalIdSchema,
  candidateOutputPort: LogicalIdSchema,
});

export const ContactDetectorDescriptorV12Schema =
  ContactDetectorDescriptorSchema.extend({ ruleId: LogicalIdSchema });

export const ContactResolutionDescriptorSchema = z.strictObject({
  candidateInputPort: LogicalIdSchema,
  mutationChannelInputPort: LogicalIdSchema,
});

export const ContactResolutionDescriptorV12Schema =
  ContactResolutionDescriptorSchema.extend({
    mutationChannelStatePayload: z.literal("entity-channel-v1"),
    authorization: z.literal("resolved-mutation-grant-v1"),
    finalResolution: z.strictObject({
      profileId: LogicalIdSchema,
      admittedDisposition: z.literal("damage"),
      admittedSourceOperation: z.literal("consume"),
    }),
  });

export const MovementArbiterCapabilityDescriptorV12Schema = z.strictObject({
  capability: z.literal("intent.movement-arbiter@1.0.0"),
  scope: z.literal("owner"),
  outputPayloadType: z.literal("resolved-movement-command-v1"),
});

export const ProjectileDeliveryCapabilityDescriptorV12Schema = z.strictObject({
  capability: z.literal("delivery.projectile@1.0.0"),
  channelId: LogicalIdSchema,
  entityRole: z.literal("projectile"),
  capacityResources: z.tuple([
    z.literal("activeEntities"),
    z.literal("activeProjectiles"),
  ]),
});

export const ContactIdentityV12Schema = z.strictObject({
  producerInstanceId: LogicalIdSchema,
  producerSequence: NonNegativeIntegerSchema,
  sourceChannelId: LogicalIdSchema,
  sourceEntityId: LogicalIdSchema,
  sourceGeneration: NonNegativeIntegerSchema,
});

export const EndpointAuthorizationSchema = z
  .strictObject({
    ownerRelation: OwnerRelationSchema,
    sourceActorRoles: z.array(ActorRoleSchema).min(1).max(5),
    targetActorRoles: z.array(ActorRoleSchema).min(1).max(5),
    sourceEntityRoles: z.array(LogicalIdSchema).max(32),
  })
  .superRefine((authorization, context) => {
    for (const field of [
      "sourceActorRoles",
      "targetActorRoles",
      "sourceEntityRoles",
    ] as const) {
      const values = authorization[field];
      if (new Set(values).size !== values.length) {
        context.addIssue({
          code: "custom",
          message: `${field} must not contain duplicates`,
          path: [field],
        });
      }
    }
    if (
      authorization.ownerRelation === "different-owner" &&
      authorization.sourceEntityRoles.length === 0
    ) {
      context.addIssue({
        code: "custom",
        message: "different-owner authorization requires sourceEntityRoles",
        path: ["sourceEntityRoles"],
      });
    }
  });

export const DamageSinkDescriptorSchema = z
  .strictObject({
    capability: z.literal("combat.damage-sink@1.0.0"),
    sinkRole: z.enum(["filter", "terminal-health"]),
    inputPort: LogicalIdSchema,
    downstreamOutputPort: LogicalIdSchema.optional(),
  })
  .superRefine((descriptor, context) => {
    if (
      descriptor.sinkRole === "filter" &&
      descriptor.downstreamOutputPort === undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "filter damage sinks require downstreamOutputPort",
        path: ["downstreamOutputPort"],
      });
    }
    if (
      descriptor.sinkRole === "terminal-health" &&
      descriptor.downstreamOutputPort !== undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "terminal health cannot declare downstreamOutputPort",
        path: ["downstreamOutputPort"],
      });
    }
  });

export const ContactPolicyTransformDescriptorSchema = z.strictObject({
  descriptorVersion: z.literal("1.0.0"),
  executionModel: z.literal("contact-policy-transform-v1"),
  inputPayloadType: z.literal("contact-decision-v1"),
  outputPayloadType: z.literal("contact-decision-v1"),
  policyPhase: z.enum(["default", "defense", "interaction", "final"]),
  policyRole: LogicalIdSchema,
  allowedPredecessors: z.array(LogicalIdSchema).max(16),
  allowedSuccessors: z.array(LogicalIdSchema).max(16),
  requiresBefore: z.array(LogicalIdSchema).max(16),
  requiresAfter: z.array(LogicalIdSchema).max(16),
  supportedChainEvidenceIds: z.array(LogicalIdSchema).min(1).max(16),
  mutableDecisionFields: z
    .array(
      z.enum([
        "disposition",
        "sourceOperation",
        "damage",
        "transferTargetActorId",
      ]),
    )
    .min(1)
    .max(4),
});

export const ContactPolicyChainProfileSchema = z
  .strictObject({
    schemaVersion: z.literal("1.0.0"),
    profileId: LogicalIdSchema,
    version: z.string().regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/),
    orderedPolicies: z
      .array(
        z.strictObject({
          moduleId: LogicalIdSchema,
          versionRange: z
            .string()
            .regex(/^(?:\^|~)?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/),
          policyRole: LogicalIdSchema,
        }),
      )
      .min(1)
      .max(16),
    allowedDispositions: z.array(ContactDispositionSchema).min(1).max(5),
    allowedSourceOperations: z
      .array(ContactSourceOperationSchema)
      .min(1)
      .max(3),
    maxDepth: z.number().int().min(1).max(16),
    supportedChainEvidenceId: LogicalIdSchema,
    evidenceHash: Sha256Schema,
  })
  .superRefine((profile, context) => {
    if (profile.orderedPolicies.length > profile.maxDepth) {
      context.addIssue({
        code: "custom",
        message: "ordered policy count exceeds maxDepth",
        path: ["orderedPolicies"],
      });
    }
    const ids = profile.orderedPolicies.map((policy) => policy.moduleId);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: "custom",
        message: "orderedPolicies cannot repeat a moduleId",
        path: ["orderedPolicies"],
      });
    }
    const hasLegalPair = profile.allowedDispositions.some((disposition) =>
      profile.allowedSourceOperations.some((operation) =>
        isLegalContactDecisionPair(disposition, operation),
      ),
    );
    if (!hasLegalPair) {
      context.addIssue({
        code: "custom",
        message: "profile must admit at least one legal decision pair",
        path: ["allowedSourceOperations"],
      });
    }
  });

export const CanonicalConfigurationDescriptorSchema = z.strictObject({
  descriptorVersion: z.literal("1.0.0"),
  schemaId: LogicalIdSchema,
  dialect: z.literal("json-schema-2020-12-subset"),
  schema: z.json(),
});

export const CanonicalResourceReservationDescriptorSchema = z
  .strictObject({
    descriptorVersion: z.literal("1.0.0"),
    reservationId: LogicalIdSchema,
    strategy: z.enum(["constant", "configuration-fields-v1"]),
    fields: z
      .array(
        z.strictObject({
          resource: z.enum([
            "activeEntities",
            "activeProjectiles",
            "spawnsPerSecond",
            "timers",
          ]),
          configurationField: ConfigurationFieldSchema.optional(),
          constant: NonNegativeIntegerSchema.optional(),
        }),
      )
      .max(4),
  })
  .superRefine((descriptor, context) => {
    const resources = descriptor.fields.map((field) => field.resource);
    if (new Set(resources).size !== resources.length) {
      context.addIssue({
        code: "custom",
        message: "reservation descriptor resources must be unique",
        path: ["fields"],
      });
    }
    for (const [index, field] of descriptor.fields.entries()) {
      const valid =
        descriptor.strategy === "constant"
          ? field.constant !== undefined &&
            field.configurationField === undefined
          : field.configurationField !== undefined &&
            field.constant === undefined;
      if (!valid) {
        context.addIssue({
          code: "custom",
          message:
            descriptor.strategy === "constant"
              ? "constant strategy requires only constant values"
              : "configuration-fields-v1 requires only configurationField values",
          path: ["fields", index],
        });
      }
    }
  });

export const ConditionalEnumReservationDescriptorV11Schema = z
  .strictObject({
    descriptorVersion: z.literal("1.1.0"),
    reservationId: LogicalIdSchema,
    strategy: z.literal("conditional-enum-v1"),
    configurationField: ConfigurationFieldSchema,
    cases: z
      .array(
        z.strictObject({
          value: z.string().min(1).max(100),
          resources: z.strictObject({
            activeEntities: NonNegativeIntegerSchema,
            activeProjectiles: NonNegativeIntegerSchema,
            spawnsPerSecond: NonNegativeIntegerSchema,
            timers: NonNegativeIntegerSchema,
          }),
        }),
      )
      .min(1)
      .max(32),
  })
  .superRefine((descriptor, context) => {
    const values = descriptor.cases.map((entry) => entry.value);
    if (new Set(values).size !== values.length)
      context.addIssue({
        code: "custom",
        message: "conditional reservation cases must be unique",
        path: ["cases"],
      });
  });

const MaximumReachableFormulaV1Schema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("constant"),
    value: NonNegativeIntegerSchema,
  }),
  z.strictObject({
    kind: z.literal("configuration-field"),
    field: ConfigurationFieldSchema,
  }),
  z.strictObject({
    kind: z.literal("sum-configuration-fields"),
    fields: z.array(ConfigurationFieldSchema).min(2).max(8),
  }),
  z.strictObject({
    kind: z.literal("product-field-and-sum"),
    factorField: ConfigurationFieldSchema,
    sumFields: z.array(ConfigurationFieldSchema).min(2).max(8),
  }),
]);

export const MaximumReachableReservationDescriptorV11Schema = z
  .strictObject({
    descriptorVersion: z.literal("1.1.0"),
    reservationId: LogicalIdSchema,
    strategy: z.literal("maximum-reachable-v1"),
    fields: z
      .array(
        z.strictObject({
          resource: z.enum([
            "activeEntities",
            "activeProjectiles",
            "spawnsPerSecond",
            "timers",
          ]),
          formula: MaximumReachableFormulaV1Schema,
        }),
      )
      .max(4),
  })
  .superRefine((descriptor, context) => {
    const resources = descriptor.fields.map((field) => field.resource);
    if (new Set(resources).size !== resources.length)
      context.addIssue({
        code: "custom",
        message: "maximum-reachable reservation resources must be unique",
        path: ["fields"],
      });
    for (const [index, field] of descriptor.fields.entries()) {
      const formula = field.formula;
      const names =
        formula.kind === "sum-configuration-fields"
          ? formula.fields
          : formula.kind === "product-field-and-sum"
            ? [formula.factorField, ...formula.sumFields]
            : [];
      if (new Set(names).size !== names.length)
        context.addIssue({
          code: "custom",
          message: "maximum-reachable formula fields must be unique",
          path: ["fields", index, "formula"],
        });
    }
  });

export const CanonicalResourceReservationDescriptorV11Schema = z.union([
  CanonicalResourceReservationDescriptorSchema,
  ConditionalEnumReservationDescriptorV11Schema,
  MaximumReachableReservationDescriptorV11Schema,
]);

export const ArtifactHashDescriptorSchema = z.strictObject({
  schemaVersion: z.literal("1.0.0"),
  algorithm: z.literal("sha256"),
  envelopeFormat: z.literal("module-registration-envelope-v1"),
  manifestSha256: Sha256Schema,
  configurationDescriptorSha256: Sha256Schema,
  reservationDescriptorSha256: Sha256Schema,
  implementationBundleSha256: Sha256Schema,
  dependencyLockSha256: Sha256Schema,
  toolchainIdentitySha256: Sha256Schema,
  envelopeSha256: Sha256Schema,
});

function normalizeCanonical(value: unknown): unknown {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value))
      throw new Error("canonical JSON rejects non-finite numbers");
    return value;
  }
  if (Array.isArray(value)) return value.map(normalizeCanonical);
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .sort((left, right) => left.localeCompare(right))
        .map((key) => [key, normalizeCanonical(record[key])]),
    );
  }
  throw new Error(`canonical JSON rejects ${typeof value}`);
}

export function canonicalJsonBytes(value: unknown): Uint8Array {
  return Buffer.from(JSON.stringify(normalizeCanonical(value)), "utf8");
}

export function computeContactPolicyChainProfileEvidenceHash(
  profileInput: unknown,
): string {
  const profile = ContactPolicyChainProfileSchema.parse(profileInput);
  const { evidenceHash: _ignored, ...canonicalProfile } = profile;
  const bytes = canonicalJsonBytes(canonicalProfile);
  const envelope = Buffer.concat([
    Buffer.from(`contact-policy-chain-profile-v1:${bytes.byteLength}:`, "utf8"),
    Buffer.from(bytes),
  ]);
  return sha256(envelope);
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function sha256CanonicalJson(value: unknown): string {
  return sha256(canonicalJsonBytes(value));
}

function appendEnvelopePart(
  parts: Uint8Array[],
  label: string,
  bytes: Uint8Array,
): void {
  const labelBytes = Buffer.from(label, "utf8");
  const header = Buffer.from(
    `${labelBytes.byteLength}:${bytes.byteLength}:`,
    "utf8",
  );
  parts.push(header, labelBytes, bytes);
}

export function createModuleArtifactHashDescriptor(
  input: Readonly<{
    manifest: unknown;
    configurationDescriptor: unknown;
    reservationDescriptor: unknown;
    implementationBundle: Uint8Array;
    dependencyLockIdentity: Uint8Array;
    toolchainIdentity: Uint8Array;
  }>,
): z.infer<typeof ArtifactHashDescriptorSchema> {
  const manifestBytes = canonicalJsonBytes(input.manifest);
  const configurationBytes = canonicalJsonBytes(
    CanonicalConfigurationDescriptorSchema.parse(input.configurationDescriptor),
  );
  const reservationBytes = canonicalJsonBytes(
    CanonicalResourceReservationDescriptorV11Schema.parse(
      input.reservationDescriptor,
    ),
  );
  const parts: Uint8Array[] = [];
  appendEnvelopePart(
    parts,
    "format",
    Buffer.from("module-registration-envelope-v1", "utf8"),
  );
  appendEnvelopePart(parts, "manifest", manifestBytes);
  appendEnvelopePart(parts, "configuration", configurationBytes);
  appendEnvelopePart(parts, "reservation", reservationBytes);
  appendEnvelopePart(parts, "bundle", input.implementationBundle);
  appendEnvelopePart(parts, "dependency-lock", input.dependencyLockIdentity);
  appendEnvelopePart(parts, "toolchain", input.toolchainIdentity);
  const envelope = Buffer.concat(parts.map((part) => Buffer.from(part)));
  return ArtifactHashDescriptorSchema.parse({
    schemaVersion: "1.0.0",
    algorithm: "sha256",
    envelopeFormat: "module-registration-envelope-v1",
    manifestSha256: sha256(manifestBytes),
    configurationDescriptorSha256: sha256(configurationBytes),
    reservationDescriptorSha256: sha256(reservationBytes),
    implementationBundleSha256: sha256(input.implementationBundle),
    dependencyLockSha256: sha256(input.dependencyLockIdentity),
    toolchainIdentitySha256: sha256(input.toolchainIdentity),
    envelopeSha256: sha256(envelope),
  });
}

export type ContactPolicyChainProfile = z.infer<
  typeof ContactPolicyChainProfileSchema
>;
export type ContactPolicyTransformDescriptor = z.infer<
  typeof ContactPolicyTransformDescriptorSchema
>;
export type DamageSinkDescriptor = z.infer<typeof DamageSinkDescriptorSchema>;
export type OwnedEntityChannelDescriptor = z.infer<
  typeof OwnedEntityChannelDescriptorSchema
>;
export type EntityMutationAccessDescriptor = z.infer<
  typeof EntityMutationAccessDescriptorSchema
>;
export type ContactDetectorDescriptor = z.infer<
  typeof ContactDetectorDescriptorSchema
>;
export type ContactResolutionDescriptor = z.infer<
  typeof ContactResolutionDescriptorSchema
>;
export type CanonicalConfigurationDescriptor = z.infer<
  typeof CanonicalConfigurationDescriptorSchema
>;
export type CanonicalResourceReservationDescriptor = z.infer<
  typeof CanonicalResourceReservationDescriptorSchema
>;
export type CanonicalResourceReservationDescriptorV11 = z.infer<
  typeof CanonicalResourceReservationDescriptorV11Schema
>;
export type ArtifactHashDescriptor = z.infer<
  typeof ArtifactHashDescriptorSchema
>;
