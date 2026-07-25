import {
  ContactCandidatePayloadSchema,
  ContactDecisionPayloadSchema,
  type ContactCandidatePayload,
  type ContactDecisionPayload,
} from "./game-module-runtime-payloads.js";

type RuntimeContactPolicyExecutionExports = Readonly<{
  implementationId: string;
  artifactEnvelopeSha256: string;
  runtimeLeaseKeys: Readonly<
    Record<"start" | "instance" | "graph", readonly string[]>
  >;
  contactPolicyTransform?:
    ((decision: Readonly<ContactDecisionPayload>) => unknown) | undefined;
}>;

type RuntimeContactPolicyGraph = Readonly<{
  productionInstantiationAllowed: boolean;
  contactPolicyProfiles: readonly Readonly<{
    consumerInstanceId: string;
    profileId: string;
    version: string;
    evidenceHash: string;
    supportedChainEvidenceId: string;
    orderedPolicyInstanceIds: readonly string[];
    orderedPolicyArtifactHashes: readonly string[];
  }>[];
  modules: readonly Readonly<{
    instanceId: string;
    moduleId: string;
    version: string;
    implementationId: string;
    artifactIdentity?: Readonly<{ envelopeSha256: string }> | undefined;
  }>[];
}>;

type RuntimeContactPolicyDescriptor = Readonly<{
  descriptorVersion: "1.0.0";
  executionModel: "contact-policy-transform-v1";
  inputPayloadType: "contact-decision-v1";
  outputPayloadType: "contact-decision-v1";
  policyPhase: "default" | "defense" | "interaction" | "final";
  policyRole: string;
  allowedPredecessors: readonly string[];
  allowedSuccessors: readonly string[];
  requiresBefore: readonly string[];
  requiresAfter: readonly string[];
  supportedChainEvidenceIds: readonly string[];
  mutableDecisionFields: readonly (
    "disposition" | "sourceOperation" | "damage" | "transferTargetActorId"
  )[];
}>;

type RuntimeContactPolicyProfile = Readonly<{
  schemaVersion: "1.0.0";
  profileId: string;
  version: string;
  orderedPolicies: readonly Readonly<{
    moduleId: string;
    versionRange: string;
    policyRole: string;
  }>[];
  allowedDispositions: readonly string[];
  allowedSourceOperations: readonly string[];
  maxDepth: number;
  supportedChainEvidenceId: string;
  evidenceHash: string;
}>;

type RuntimeContactPolicyRegistration = Readonly<{
  manifest: Readonly<{
    schemaVersion: string;
    moduleId: string;
    version: string;
    implementationId: string;
    contactPolicyTransform?: RuntimeContactPolicyDescriptor | undefined;
  }>;
  executionExports?: RuntimeContactPolicyExecutionExports | undefined;
}>;

/**
 * Browser runtime view of admission-owned policy evidence. Implementations may
 * expose more data, but this host can only read the already verified, frozen
 * profile and the exact executable registration selected by artifact hash.
 */
export type ContactPolicyRuntimeRegistry = Readonly<{
  findContactPolicyProfile(
    profileId: string,
    version: string,
  ): RuntimeContactPolicyProfile | undefined;
  findExactProduction(
    moduleId: string,
    version: string,
    envelopeSha256: string,
  ): RuntimeContactPolicyRegistration | undefined;
}>;

export const ContactPolicyHostErrorCode = {
  graphNotProduction: "graph-not-production",
  missingProfile: "missing-profile",
  ambiguousProfile: "ambiguous-profile",
  registrationMismatch: "registration-mismatch",
  missingTransform: "missing-transform",
  invalidCandidate: "invalid-candidate",
  asynchronousTransform: "asynchronous-transform",
  transformFailed: "transform-failed",
  invalidDecision: "invalid-decision",
  identityMutation: "identity-mutation",
  unauthorizedMutation: "unauthorized-mutation",
  traceMutation: "trace-mutation",
  profileOutcomeRejected: "profile-outcome-rejected",
} as const;

export type ContactPolicyHostErrorCode =
  (typeof ContactPolicyHostErrorCode)[keyof typeof ContactPolicyHostErrorCode];

export class ContactPolicyHostError extends Error {
  constructor(
    readonly code: ContactPolicyHostErrorCode,
    message: string,
    readonly policyInstanceId?: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ContactPolicyHostError";
  }
}

const mutableFields = [
  "disposition",
  "sourceOperation",
  "damage",
  "transferTargetActorId",
] as const;

const identityFields = [
  "contactId",
  "sourceChannelId",
  "sourceEntityId",
  "sourceGeneration",
  "sourceActorId",
  "targetActorId",
  "contactSequence",
  "metadata",
] as const;

function fail(
  code: ContactPolicyHostErrorCode,
  message: string,
  policyInstanceId?: string,
  cause?: unknown,
): never {
  throw new ContactPolicyHostError(code, message, policyInstanceId, cause);
}

function isThenable(value: unknown): boolean {
  if (
    value === null ||
    (typeof value !== "object" && typeof value !== "function")
  ) {
    return false;
  }
  try {
    return typeof (value as { then?: unknown }).then === "function";
  } catch (error) {
    fail(
      ContactPolicyHostErrorCode.asynchronousTransform,
      "contact policy transform returned an unreadable thenable",
      undefined,
      error,
    );
  }
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
}

function frozenClone<T>(value: T): Readonly<T> {
  return deepFreeze(structuredClone(value));
}

function equalValidatedJson(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (left === null || right === null) return false;
  if (typeof left !== "object" || typeof right !== "object") return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => equalValidatedJson(value, right[index]))
    );
  }
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord).sort();
  const rightKeys = Object.keys(rightRecord).sort();
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      (key, index) =>
        key === rightKeys[index] &&
        equalValidatedJson(leftRecord[key], rightRecord[key]),
    )
  );
}

function isDeepFrozen(value: unknown): boolean {
  if (value === null || typeof value !== "object") return true;
  if (!Object.isFrozen(value)) return false;
  return Object.values(value as Record<string, unknown>).every(isDeepFrozen);
}

function versionSatisfiesRange(version: string, range: string): boolean {
  const versionMatch = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(
    version,
  );
  const rangeMatch = /^(\^|~)?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(
    range,
  );
  if (versionMatch === null || rangeMatch === null) return false;
  const candidate = versionMatch.slice(1).map(Number);
  const base = rangeMatch.slice(2).map(Number);
  const operator = rangeMatch[1] ?? "=";
  const compare =
    candidate[0]! - base[0]! ||
    candidate[1]! - base[1]! ||
    candidate[2]! - base[2]!;
  if (compare < 0) return false;
  if (operator === "=") return compare === 0;
  if (operator === "~") {
    return candidate[0] === base[0] && candidate[1] === base[1];
  }
  if (base[0]! > 0) return candidate[0] === base[0];
  if (base[1]! > 0) {
    return candidate[0] === 0 && candidate[1] === base[1];
  }
  return candidate[0] === 0 && candidate[1] === 0 && candidate[2] === base[2];
}

function seedDecision(
  candidate: ContactCandidatePayload,
): ContactDecisionPayload {
  return ContactDecisionPayloadSchema.parse({
    contactId: candidate.contactId,
    sourceChannelId: candidate.sourceChannelId,
    sourceEntityId: candidate.sourceEntityId,
    sourceGeneration: candidate.sourceGeneration,
    sourceActorId: candidate.sourceActorId,
    targetActorId: candidate.targetActorId,
    contactSequence: candidate.contactSequence,
    metadata: candidate.metadata,
    disposition: "ignore",
    sourceOperation: "retain",
    policyTrace: [],
  });
}

export class DeterministicContactPolicyTransactionHost {
  constructor(
    readonly graph: RuntimeContactPolicyGraph,
    readonly registry: ContactPolicyRuntimeRegistry,
  ) {
    if (!graph.productionInstantiationAllowed) {
      fail(
        ContactPolicyHostErrorCode.graphNotProduction,
        "contact policy host requires a production-eligible graph",
      );
    }
  }

  execute(
    consumerInstanceId: string,
    candidateInput: unknown,
  ): Readonly<ContactDecisionPayload> {
    const matching = this.graph.contactPolicyProfiles.filter(
      (profile) => profile.consumerInstanceId === consumerInstanceId,
    );
    if (matching.length === 0) {
      fail(
        ContactPolicyHostErrorCode.missingProfile,
        `no resolved contact profile for ${consumerInstanceId}`,
      );
    }
    if (matching.length !== 1) {
      fail(
        ContactPolicyHostErrorCode.ambiguousProfile,
        `multiple resolved contact profiles for ${consumerInstanceId}`,
      );
    }
    const resolved = matching[0]!;
    const profile = this.registry.findContactPolicyProfile(
      resolved.profileId,
      resolved.version,
    );
    if (
      profile === undefined ||
      !isDeepFrozen(profile) ||
      profile.schemaVersion !== "1.0.0" ||
      profile.profileId !== resolved.profileId ||
      profile.version !== resolved.version ||
      profile.evidenceHash !== resolved.evidenceHash ||
      profile.supportedChainEvidenceId !== resolved.supportedChainEvidenceId ||
      profile.orderedPolicies.length !==
        resolved.orderedPolicyInstanceIds.length ||
      profile.orderedPolicies.length > profile.maxDepth
    ) {
      fail(
        ContactPolicyHostErrorCode.registrationMismatch,
        `resolved contact profile drift for ${consumerInstanceId}`,
      );
    }
    const parsedCandidate =
      ContactCandidatePayloadSchema.safeParse(candidateInput);
    if (!parsedCandidate.success) {
      fail(
        ContactPolicyHostErrorCode.invalidCandidate,
        `invalid contact candidate: ${parsedCandidate.error.message}`,
      );
    }
    let decision = frozenClone(seedDecision(parsedCandidate.data));

    for (const [
      index,
      instanceId,
    ] of resolved.orderedPolicyInstanceIds.entries()) {
      const module = this.graph.modules.find(
        (candidate) => candidate.instanceId === instanceId,
      );
      const expectedPolicy = profile.orderedPolicies[index]!;
      if (
        module === undefined ||
        module.moduleId !== expectedPolicy.moduleId ||
        !versionSatisfiesRange(module.version, expectedPolicy.versionRange) ||
        module.artifactIdentity?.envelopeSha256 !==
          resolved.orderedPolicyArtifactHashes[index]
      ) {
        fail(
          ContactPolicyHostErrorCode.registrationMismatch,
          `resolved policy instance drift at ${instanceId}`,
          instanceId,
        );
      }
      const artifactIdentity = module.artifactIdentity;
      if (artifactIdentity === undefined) {
        fail(
          ContactPolicyHostErrorCode.registrationMismatch,
          `policy artifact identity is missing at ${instanceId}`,
          instanceId,
        );
      }
      const registration = this.registry.findExactProduction(
        module.moduleId,
        module.version,
        artifactIdentity.envelopeSha256,
      );
      const descriptor = registration?.manifest.contactPolicyTransform;
      const transform = registration?.executionExports?.contactPolicyTransform;
      if (
        descriptor === undefined ||
        transform === undefined ||
        !isDeepFrozen(descriptor) ||
        registration?.manifest.schemaVersion !== "1.1.0" ||
        registration.manifest.moduleId !== module.moduleId ||
        registration.manifest.version !== module.version ||
        registration.manifest.implementationId !== module.implementationId ||
        registration.executionExports?.implementationId !==
          module.implementationId ||
        registration.executionExports.artifactEnvelopeSha256 !==
          artifactIdentity.envelopeSha256 ||
        descriptor.descriptorVersion !== "1.0.0" ||
        descriptor.executionModel !== "contact-policy-transform-v1" ||
        descriptor.inputPayloadType !== "contact-decision-v1" ||
        descriptor.outputPayloadType !== "contact-decision-v1" ||
        descriptor.policyRole !== expectedPolicy.policyRole ||
        !descriptor.supportedChainEvidenceIds.includes(
          resolved.supportedChainEvidenceId,
        )
      ) {
        fail(
          ContactPolicyHostErrorCode.missingTransform,
          `missing executable policy transform for ${instanceId}`,
          instanceId,
        );
      }
      const previousModuleId = profile.orderedPolicies[index - 1]?.moduleId;
      const nextModuleId = profile.orderedPolicies[index + 1]?.moduleId;
      const beforeModuleIds = profile.orderedPolicies
        .slice(index + 1)
        .map((policy) => policy.moduleId);
      const afterModuleIds = profile.orderedPolicies
        .slice(0, index)
        .map((policy) => policy.moduleId);
      if (
        (previousModuleId === undefined
          ? descriptor.allowedPredecessors.length !== 0
          : !descriptor.allowedPredecessors.includes(previousModuleId)) ||
        (nextModuleId === undefined
          ? descriptor.allowedSuccessors.length !== 0
          : !descriptor.allowedSuccessors.includes(nextModuleId)) ||
        descriptor.requiresBefore.some(
          (moduleId) => !beforeModuleIds.includes(moduleId),
        ) ||
        descriptor.requiresAfter.some(
          (moduleId) => !afterModuleIds.includes(moduleId),
        )
      ) {
        fail(
          ContactPolicyHostErrorCode.registrationMismatch,
          `policy descriptor drift at ${instanceId}`,
          instanceId,
        );
      }
      let result: unknown;
      try {
        result = transform(decision);
      } catch (error) {
        fail(
          ContactPolicyHostErrorCode.transformFailed,
          `contact policy transform threw: ${instanceId}`,
          instanceId,
          error,
        );
      }
      if (isThenable(result)) {
        fail(
          ContactPolicyHostErrorCode.asynchronousTransform,
          `contact policy transform returned a thenable: ${instanceId}`,
          instanceId,
        );
      }
      const parsed = ContactDecisionPayloadSchema.safeParse(result);
      if (!parsed.success) {
        fail(
          ContactPolicyHostErrorCode.invalidDecision,
          `invalid contact decision from ${instanceId}: ${parsed.error.message}`,
          instanceId,
        );
      }
      for (const field of identityFields) {
        if (!equalValidatedJson(parsed.data[field], decision[field])) {
          fail(
            ContactPolicyHostErrorCode.identityMutation,
            `${instanceId} changed immutable ${field}`,
            instanceId,
          );
        }
      }
      if (!equalValidatedJson(parsed.data.policyTrace, decision.policyTrace)) {
        fail(
          ContactPolicyHostErrorCode.traceMutation,
          `${instanceId} changed host-owned policyTrace`,
          instanceId,
        );
      }
      for (const field of mutableFields) {
        if (
          !descriptor.mutableDecisionFields.includes(field) &&
          !equalValidatedJson(parsed.data[field], decision[field])
        ) {
          fail(
            ContactPolicyHostErrorCode.unauthorizedMutation,
            `${instanceId} changed undeclared ${field}`,
            instanceId,
          );
        }
      }
      decision = frozenClone({
        ...parsed.data,
        policyTrace: [...decision.policyTrace, module.moduleId],
      });
    }

    if (
      !profile.allowedDispositions.includes(decision.disposition) ||
      !profile.allowedSourceOperations.includes(decision.sourceOperation)
    ) {
      fail(
        ContactPolicyHostErrorCode.profileOutcomeRejected,
        `final contact outcome is outside profile ${profile.profileId}`,
      );
    }
    return decision;
  }
}
