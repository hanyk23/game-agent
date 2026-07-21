import type { z } from "zod";

import {
  compareSemanticVersions,
  GameModuleManifestSchema,
  GameModuleManifestV11Schema,
  GameModuleManifestV12Schema,
  GameModuleManifestV13Schema,
  GameModuleManifestV14Schema,
  type GameModuleManifest,
  type GameModuleManifestV11,
  type GameModuleManifestV12,
  type GameModuleManifestV13,
  type GameModuleManifestV14,
  ModuleResourceBudgetSchema,
  type ModuleResourceBudget,
  versionSatisfiesRange,
} from "./game-module-contract.js";
import {
  ArtifactHashDescriptorSchema,
  CanonicalConfigurationDescriptorSchema,
  CanonicalResourceReservationDescriptorSchema,
  CanonicalResourceReservationDescriptorV11Schema,
  computeContactPolicyChainProfileEvidenceHash,
  ContactPolicyChainProfileSchema,
  createModuleArtifactHashDescriptor,
  sha256CanonicalJson,
  type ArtifactHashDescriptor,
  type CanonicalConfigurationDescriptor,
  type CanonicalResourceReservationDescriptorV11,
  type ContactPolicyChainProfile,
} from "./game-module-execution-contract.js";
import {
  validateProductionModuleExecutionExports,
  type ProductionModuleExecutionExports,
} from "./game-module-runtime-factory.js";
import {
  isLoaderMintedExecutableArtifactHandle,
  type ExecutableArtifactHandle,
} from "./game-module-executable-loader.js";

export type RegisteredGameModule = Readonly<{
  manifest: GameModuleManifest;
  configurationSchema: z.ZodType;
  registrationKind: "fixture" | "production";
  manifestSha256: string;
  configurationDescriptor?: CanonicalConfigurationDescriptor;
  reservationDescriptor?: CanonicalResourceReservationDescriptorV11;
  artifactIdentity?: ArtifactHashDescriptor;
  implementationBundle?: Readonly<{
    byteLength: number;
    sha256: string;
  }>;
  executionExports?: ProductionModuleExecutionExports;
  executableHandle?: ExecutableArtifactHandle;
  evaluateResourceReservation(configuration: unknown): ModuleResourceBudget;
}>;

export type RegisteredGameModuleV14 = Readonly<
  Omit<RegisteredGameModule, "manifest"> & {
    manifest: GameModuleManifestV14;
  }
>;

type AnyRegisteredGameModule = RegisteredGameModule | RegisteredGameModuleV14;

export type ProductionGameModuleRegistrationV12Input = Readonly<{
  manifest: unknown;
  configurationDescriptor: unknown;
  configurationSchema: z.ZodType;
  reservationDescriptor: unknown;
  reservationEvaluator: (validatedConfiguration: unknown) => unknown;
  implementationBundle: Uint8Array;
  dependencyLockIdentity: Uint8Array;
  toolchainIdentity: Uint8Array;
  expectedArtifact: unknown;
  executableHandle: ExecutableArtifactHandle;
}>;

export type ProductionGameModuleRegistrationV13Input =
  ProductionGameModuleRegistrationV12Input;

export type ProductionGameModuleRegistrationV14Input =
  ProductionGameModuleRegistrationV13Input;

export type ProductionGameModuleRegistrationInput = Readonly<{
  manifest: unknown;
  configurationDescriptor: unknown;
  configurationSchema: z.ZodType;
  reservationDescriptor: unknown;
  reservationEvaluator: (validatedConfiguration: unknown) => unknown;
  implementationBundle: Uint8Array;
  dependencyLockIdentity: Uint8Array;
  toolchainIdentity: Uint8Array;
  expectedArtifact: unknown;
  executionExports?: ProductionModuleExecutionExports;
}>;

function deepFreeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
}

export function evaluateCanonicalResourceReservationV11(
  descriptor: CanonicalResourceReservationDescriptorV11,
  configuration: unknown,
): ModuleResourceBudget {
  if (descriptor.strategy === "conditional-enum-v1") {
    if (configuration === null || typeof configuration !== "object")
      throw new Error("conditional-enum-v1 requires an object configuration");
    const value = (configuration as Record<string, unknown>)[
      descriptor.configurationField
    ];
    const selected = descriptor.cases.find((entry) => entry.value === value);
    if (selected === undefined)
      throw new Error(
        `conditional reservation has no case for ${descriptor.configurationField}`,
      );
    return Object.freeze({ ...selected.resources });
  }
  if (descriptor.strategy === "maximum-reachable-v1") {
    if (configuration === null || typeof configuration !== "object")
      throw new Error("maximum-reachable-v1 requires an object configuration");
    const source = configuration as Record<string, unknown>;
    const read = (field: string): number => {
      const value = source[field];
      if (!Number.isSafeInteger(value) || (value as number) < 0)
        throw new Error(
          `maximum-reachable field ${field} is not a non-negative safe integer`,
        );
      return value as number;
    };
    const result: ModuleResourceBudget = {
      activeEntities: 0,
      activeProjectiles: 0,
      spawnsPerSecond: 0,
      timers: 0,
    };
    for (const field of descriptor.fields) {
      const formula = field.formula;
      let value: number;
      if (formula.kind === "constant") value = formula.value;
      else if (formula.kind === "configuration-field")
        value = read(formula.field);
      else {
        const names =
          formula.kind === "sum-configuration-fields"
            ? formula.fields
            : formula.sumFields;
        value = 0;
        for (const name of names) {
          const next = read(name);
          if (next > Number.MAX_SAFE_INTEGER - value)
            throw new Error("maximum-reachable sum exceeds safe integer range");
          value += next;
        }
        if (formula.kind === "product-field-and-sum") {
          const factor = read(formula.factorField);
          if (factor !== 0 && value > Number.MAX_SAFE_INTEGER / factor)
            throw new Error(
              "maximum-reachable product exceeds safe integer range",
            );
          value *= factor;
        }
      }
      result[field.resource] = value;
    }
    return Object.freeze(result);
  }
  const result: ModuleResourceBudget = {
    activeEntities: 0,
    activeProjectiles: 0,
    spawnsPerSecond: 0,
    timers: 0,
  };
  for (const field of descriptor.fields) {
    if (descriptor.strategy === "constant") {
      result[field.resource] = field.constant!;
      continue;
    }
    if (configuration === null || typeof configuration !== "object") {
      throw new Error(
        "configuration-fields-v1 requires an object configuration",
      );
    }
    const value = (configuration as Record<string, unknown>)[
      field.configurationField!
    ];
    if (!Number.isSafeInteger(value) || (value as number) < 0) {
      throw new Error(
        `configuration field ${field.configurationField} is not a non-negative safe integer`,
      );
    }
    result[field.resource] = value as number;
  }
  return result;
}

function assertConditionalReservationConfiguration(
  descriptor: CanonicalResourceReservationDescriptorV11,
  configurationDescriptor: CanonicalConfigurationDescriptor,
): void {
  if (descriptor.strategy !== "conditional-enum-v1") return;
  const schema = configurationDescriptor.schema;
  if (schema === null || typeof schema !== "object" || Array.isArray(schema))
    throw new Error("conditional reservation requires an object JSON schema");
  const properties = (schema as Record<string, unknown>).properties;
  const property =
    properties !== null &&
    typeof properties === "object" &&
    !Array.isArray(properties)
      ? (properties as Record<string, unknown>)[descriptor.configurationField]
      : undefined;
  const values =
    property !== null &&
    typeof property === "object" &&
    !Array.isArray(property)
      ? (property as Record<string, unknown>).enum
      : undefined;
  const required = (schema as Record<string, unknown>).required;
  const expected = descriptor.cases.map((entry) => entry.value);
  if (
    !Array.isArray(values) ||
    values.some((value) => typeof value !== "string") ||
    !Array.isArray(required) ||
    !required.includes(descriptor.configurationField) ||
    JSON.stringify(values) !== JSON.stringify(expected)
  )
    throw new Error(
      "conditional reservation cases must exactly match the required configuration enum",
    );
}

export class GameModuleRegistry {
  readonly #modules = new Map<string, Map<string, AnyRegisteredGameModule>>();
  readonly #contactPolicyProfiles = new Map<
    string,
    Map<string, ContactPolicyChainProfile>
  >();

  #insert(registration: AnyRegisteredGameModule): void {
    const manifest = registration.manifest;
    const versions = this.#modules.get(manifest.moduleId) ?? new Map();
    if (versions.has(manifest.version)) {
      throw new Error(
        `duplicate module registration: ${manifest.moduleId}@${manifest.version}`,
      );
    }
    versions.set(manifest.version, Object.freeze(registration));
    this.#modules.set(manifest.moduleId, versions);
  }

  register(manifestInput: unknown, configurationSchema: z.ZodType): void {
    const manifest = GameModuleManifestSchema.parse(manifestInput);
    const frozenManifest = deepFreeze(manifest);
    this.#insert({
      manifest: frozenManifest,
      configurationSchema,
      registrationKind: "fixture",
      manifestSha256: sha256CanonicalJson(frozenManifest),
      evaluateResourceReservation: () =>
        Object.freeze({ ...frozenManifest.resources }),
    });
  }

  registerProduction(input: ProductionGameModuleRegistrationInput): void {
    const manifest = GameModuleManifestV11Schema.parse(input.manifest);
    const configurationDescriptor =
      CanonicalConfigurationDescriptorSchema.parse(
        input.configurationDescriptor,
      );
    const reservationDescriptor =
      CanonicalResourceReservationDescriptorSchema.parse(
        input.reservationDescriptor,
      );
    if (configurationDescriptor.schemaId !== manifest.configurationSchemaId) {
      throw new Error(
        `configuration descriptor mismatch for ${manifest.moduleId}@${manifest.version}`,
      );
    }
    if (
      input.implementationBundle.byteLength === 0 ||
      input.dependencyLockIdentity.byteLength === 0 ||
      input.toolchainIdentity.byteLength === 0
    ) {
      throw new Error("production artifact inputs must be non-empty");
    }
    const artifactIdentity = createModuleArtifactHashDescriptor({
      manifest,
      configurationDescriptor,
      reservationDescriptor,
      implementationBundle: input.implementationBundle,
      dependencyLockIdentity: input.dependencyLockIdentity,
      toolchainIdentity: input.toolchainIdentity,
    });
    const expectedArtifact = ArtifactHashDescriptorSchema.parse(
      input.expectedArtifact,
    );
    if (JSON.stringify(artifactIdentity) !== JSON.stringify(expectedArtifact)) {
      throw new Error(
        `production artifact identity mismatch for ${manifest.moduleId}@${manifest.version}`,
      );
    }
    const evaluateResourceReservation = (
      configuration: unknown,
    ): ModuleResourceBudget => {
      const firstConfiguration = deepFreeze(structuredClone(configuration));
      const secondConfiguration = deepFreeze(structuredClone(configuration));
      const result = ModuleResourceBudgetSchema.parse(
        input.reservationEvaluator(firstConfiguration),
      );
      const repeated = ModuleResourceBudgetSchema.parse(
        input.reservationEvaluator(secondConfiguration),
      );
      if (JSON.stringify(result) !== JSON.stringify(repeated)) {
        throw new Error(
          `non-deterministic reservation evaluator for ${manifest.moduleId}@${manifest.version}`,
        );
      }
      const expected = evaluateCanonicalResourceReservationV11(
        reservationDescriptor,
        firstConfiguration,
      );
      if (JSON.stringify(result) !== JSON.stringify(expected)) {
        throw new Error(
          `reservation evaluator drift for ${manifest.moduleId}@${manifest.version}`,
        );
      }
      for (const resource of Object.keys(
        result,
      ) as (keyof ModuleResourceBudget)[]) {
        if (result[resource] > manifest.resources[resource]) {
          throw new Error(
            `${resource} reservation exceeds manifest ceiling for ${manifest.moduleId}@${manifest.version}`,
          );
        }
      }
      return Object.freeze({ ...result });
    };
    const frozenManifest: GameModuleManifestV11 = deepFreeze(manifest);
    const executionExports =
      input.executionExports === undefined
        ? undefined
        : validateProductionModuleExecutionExports(
            input.executionExports,
            frozenManifest,
            artifactIdentity,
          );
    this.#insert({
      manifest: frozenManifest,
      configurationSchema: input.configurationSchema,
      registrationKind: "production",
      manifestSha256: artifactIdentity.manifestSha256,
      configurationDescriptor: deepFreeze(configurationDescriptor),
      reservationDescriptor: deepFreeze(reservationDescriptor),
      artifactIdentity: deepFreeze(artifactIdentity),
      implementationBundle: Object.freeze({
        byteLength: input.implementationBundle.byteLength,
        sha256: artifactIdentity.implementationBundleSha256,
      }),
      ...(executionExports === undefined ? {} : { executionExports }),
      evaluateResourceReservation,
    });
  }

  registerProductionV12(input: ProductionGameModuleRegistrationV12Input): void {
    const manifest = GameModuleManifestV12Schema.parse(input.manifest);
    const configurationDescriptor =
      CanonicalConfigurationDescriptorSchema.parse(
        input.configurationDescriptor,
      );
    const reservationDescriptor =
      CanonicalResourceReservationDescriptorSchema.parse(
        input.reservationDescriptor,
      );
    if (configurationDescriptor.schemaId !== manifest.configurationSchemaId) {
      throw new Error(
        `configuration descriptor mismatch for ${manifest.moduleId}@${manifest.version}`,
      );
    }
    if (!isLoaderMintedExecutableArtifactHandle(input.executableHandle)) {
      throw new Error(
        "Manifest 1.2 registration requires a loader-minted executable handle",
      );
    }
    if (
      input.implementationBundle.byteLength === 0 ||
      input.dependencyLockIdentity.byteLength === 0 ||
      input.toolchainIdentity.byteLength === 0
    ) {
      throw new Error("production artifact inputs must be non-empty");
    }
    const artifactIdentity = createModuleArtifactHashDescriptor({
      manifest,
      configurationDescriptor,
      reservationDescriptor,
      implementationBundle: input.implementationBundle,
      dependencyLockIdentity: input.dependencyLockIdentity,
      toolchainIdentity: input.toolchainIdentity,
    });
    const expectedArtifact = ArtifactHashDescriptorSchema.parse(
      input.expectedArtifact,
    );
    if (JSON.stringify(artifactIdentity) !== JSON.stringify(expectedArtifact)) {
      throw new Error(
        `production artifact identity mismatch for ${manifest.moduleId}@${manifest.version}`,
      );
    }
    const handle = input.executableHandle;
    const expectedKind =
      manifest.contactPolicyTransform === undefined
        ? "lifecycle-create-v1"
        : "contact-policy-transform-v1";
    if (
      handle.implementationId !== manifest.implementationId ||
      handle.exportKind !== expectedKind ||
      handle.manifestSha256 !== artifactIdentity.manifestSha256 ||
      handle.sourceBundleSha256 !==
        artifactIdentity.implementationBundleSha256 ||
      handle.dependencyLockSha256 !== artifactIdentity.dependencyLockSha256 ||
      handle.toolchainIdentitySha256 !==
        artifactIdentity.toolchainIdentitySha256
    ) {
      throw new Error(
        `executable handle identity mismatch for ${manifest.moduleId}@${manifest.version}`,
      );
    }
    const evaluateResourceReservation = (
      configuration: unknown,
    ): ModuleResourceBudget => {
      const first = deepFreeze(structuredClone(configuration));
      const second = deepFreeze(structuredClone(configuration));
      const result = ModuleResourceBudgetSchema.parse(
        input.reservationEvaluator(first),
      );
      const repeated = ModuleResourceBudgetSchema.parse(
        input.reservationEvaluator(second),
      );
      if (JSON.stringify(result) !== JSON.stringify(repeated)) {
        throw new Error(
          `non-deterministic reservation evaluator for ${manifest.moduleId}@${manifest.version}`,
        );
      }
      const expected = evaluateCanonicalResourceReservationV11(
        reservationDescriptor,
        first,
      );
      if (JSON.stringify(result) !== JSON.stringify(expected)) {
        throw new Error(
          `reservation evaluator drift for ${manifest.moduleId}@${manifest.version}`,
        );
      }
      for (const resource of Object.keys(
        result,
      ) as (keyof ModuleResourceBudget)[]) {
        if (result[resource] > manifest.resources[resource]) {
          throw new Error(
            `${resource} reservation exceeds manifest ceiling for ${manifest.moduleId}@${manifest.version}`,
          );
        }
      }
      return Object.freeze({ ...result });
    };
    const frozenManifest: GameModuleManifestV12 = deepFreeze(manifest);
    this.#insert({
      manifest: frozenManifest,
      configurationSchema: input.configurationSchema,
      registrationKind: "production",
      manifestSha256: artifactIdentity.manifestSha256,
      configurationDescriptor: deepFreeze(configurationDescriptor),
      reservationDescriptor: deepFreeze(reservationDescriptor),
      artifactIdentity: deepFreeze(artifactIdentity),
      implementationBundle: Object.freeze({
        byteLength: input.implementationBundle.byteLength,
        sha256: artifactIdentity.implementationBundleSha256,
      }),
      executableHandle: handle,
      evaluateResourceReservation,
    });
  }

  registerProductionV13(input: ProductionGameModuleRegistrationV13Input): void {
    const manifest = GameModuleManifestV13Schema.parse(input.manifest);
    const configurationDescriptor =
      CanonicalConfigurationDescriptorSchema.parse(
        input.configurationDescriptor,
      );
    const reservationDescriptor =
      CanonicalResourceReservationDescriptorV11Schema.parse(
        input.reservationDescriptor,
      );
    if (configurationDescriptor.schemaId !== manifest.configurationSchemaId)
      throw new Error(
        `configuration descriptor mismatch for ${manifest.moduleId}@${manifest.version}`,
      );
    assertConditionalReservationConfiguration(
      reservationDescriptor,
      configurationDescriptor,
    );
    if (!isLoaderMintedExecutableArtifactHandle(input.executableHandle))
      throw new Error(
        "Manifest 1.3 registration requires a loader-minted executable handle",
      );
    if (
      input.implementationBundle.byteLength === 0 ||
      input.dependencyLockIdentity.byteLength === 0 ||
      input.toolchainIdentity.byteLength === 0
    )
      throw new Error("production artifact inputs must be non-empty");
    const artifactIdentity = createModuleArtifactHashDescriptor({
      manifest,
      configurationDescriptor,
      reservationDescriptor,
      implementationBundle: input.implementationBundle,
      dependencyLockIdentity: input.dependencyLockIdentity,
      toolchainIdentity: input.toolchainIdentity,
    });
    const expectedArtifact = ArtifactHashDescriptorSchema.parse(
      input.expectedArtifact,
    );
    if (JSON.stringify(artifactIdentity) !== JSON.stringify(expectedArtifact))
      throw new Error(
        `production artifact identity mismatch for ${manifest.moduleId}@${manifest.version}`,
      );
    const expectedKind =
      manifest.pickupEffectPlanTransform !== null
        ? "pickup-effect-plan-transform-v1"
        : manifest.contactPolicyTransform === undefined
          ? "lifecycle-create-v1"
          : "contact-policy-transform-v1";
    const handle = input.executableHandle;
    if (
      handle.implementationId !== manifest.implementationId ||
      handle.exportKind !== expectedKind ||
      handle.manifestSha256 !== artifactIdentity.manifestSha256 ||
      handle.sourceBundleSha256 !==
        artifactIdentity.implementationBundleSha256 ||
      handle.dependencyLockSha256 !== artifactIdentity.dependencyLockSha256 ||
      handle.toolchainIdentitySha256 !==
        artifactIdentity.toolchainIdentitySha256
    )
      throw new Error(
        `executable handle identity mismatch for ${manifest.moduleId}@${manifest.version}`,
      );
    const evaluateResourceReservation = (
      configuration: unknown,
    ): ModuleResourceBudget => {
      const first = deepFreeze(structuredClone(configuration));
      const second = deepFreeze(structuredClone(configuration));
      const result = ModuleResourceBudgetSchema.parse(
        input.reservationEvaluator(first),
      );
      const repeated = ModuleResourceBudgetSchema.parse(
        input.reservationEvaluator(second),
      );
      if (JSON.stringify(result) !== JSON.stringify(repeated))
        throw new Error(
          `non-deterministic reservation evaluator for ${manifest.moduleId}@${manifest.version}`,
        );
      const expected = evaluateCanonicalResourceReservationV11(
        reservationDescriptor,
        first,
      );
      if (JSON.stringify(result) !== JSON.stringify(expected))
        throw new Error(
          `reservation evaluator drift for ${manifest.moduleId}@${manifest.version}`,
        );
      for (const resource of Object.keys(
        result,
      ) as (keyof ModuleResourceBudget)[]) {
        if (result[resource] > manifest.resources[resource])
          throw new Error(
            `${resource} reservation exceeds manifest ceiling for ${manifest.moduleId}@${manifest.version}`,
          );
      }
      return Object.freeze({ ...result });
    };
    const frozenManifest: GameModuleManifestV13 = deepFreeze(manifest);
    this.#insert({
      manifest: frozenManifest,
      configurationSchema: input.configurationSchema,
      registrationKind: "production",
      manifestSha256: artifactIdentity.manifestSha256,
      configurationDescriptor: deepFreeze(configurationDescriptor),
      reservationDescriptor: deepFreeze(reservationDescriptor),
      artifactIdentity: deepFreeze(artifactIdentity),
      implementationBundle: Object.freeze({
        byteLength: input.implementationBundle.byteLength,
        sha256: artifactIdentity.implementationBundleSha256,
      }),
      executableHandle: handle,
      evaluateResourceReservation,
    });
  }

  registerProductionV14(input: ProductionGameModuleRegistrationV14Input): void {
    const manifest = GameModuleManifestV14Schema.parse(input.manifest);
    const configurationDescriptor =
      CanonicalConfigurationDescriptorSchema.parse(
        input.configurationDescriptor,
      );
    const reservationDescriptor =
      CanonicalResourceReservationDescriptorV11Schema.parse(
        input.reservationDescriptor,
      );
    if (configurationDescriptor.schemaId !== manifest.configurationSchemaId)
      throw new Error(
        `configuration descriptor mismatch for ${manifest.moduleId}@${manifest.version}`,
      );
    assertConditionalReservationConfiguration(
      reservationDescriptor,
      configurationDescriptor,
    );
    if (!isLoaderMintedExecutableArtifactHandle(input.executableHandle))
      throw new Error(
        "Manifest 1.4 registration requires a loader-minted executable handle",
      );
    if (
      input.implementationBundle.byteLength === 0 ||
      input.dependencyLockIdentity.byteLength === 0 ||
      input.toolchainIdentity.byteLength === 0
    )
      throw new Error("production artifact inputs must be non-empty");
    const artifactIdentity = createModuleArtifactHashDescriptor({
      manifest,
      configurationDescriptor,
      reservationDescriptor,
      implementationBundle: input.implementationBundle,
      dependencyLockIdentity: input.dependencyLockIdentity,
      toolchainIdentity: input.toolchainIdentity,
    });
    const expectedArtifact = ArtifactHashDescriptorSchema.parse(
      input.expectedArtifact,
    );
    if (JSON.stringify(artifactIdentity) !== JSON.stringify(expectedArtifact))
      throw new Error(
        `production artifact identity mismatch for ${manifest.moduleId}@${manifest.version}`,
      );
    const expectedKind =
      manifest.pickupEffectPlanTransform !== null
        ? "pickup-effect-plan-transform-v1"
        : manifest.contactPolicyTransform === undefined
          ? "lifecycle-create-v1"
          : "contact-policy-transform-v1";
    const handle = input.executableHandle;
    if (
      handle.implementationId !== manifest.implementationId ||
      handle.exportKind !== expectedKind ||
      handle.manifestSha256 !== artifactIdentity.manifestSha256 ||
      handle.sourceBundleSha256 !==
        artifactIdentity.implementationBundleSha256 ||
      handle.dependencyLockSha256 !== artifactIdentity.dependencyLockSha256 ||
      handle.toolchainIdentitySha256 !==
        artifactIdentity.toolchainIdentitySha256
    )
      throw new Error(
        `executable handle identity mismatch for ${manifest.moduleId}@${manifest.version}`,
      );
    const evaluateResourceReservation = (
      configuration: unknown,
    ): ModuleResourceBudget => {
      const first = deepFreeze(structuredClone(configuration));
      const second = deepFreeze(structuredClone(configuration));
      const result = ModuleResourceBudgetSchema.parse(
        input.reservationEvaluator(first),
      );
      const repeated = ModuleResourceBudgetSchema.parse(
        input.reservationEvaluator(second),
      );
      if (JSON.stringify(result) !== JSON.stringify(repeated))
        throw new Error(
          `non-deterministic reservation evaluator for ${manifest.moduleId}@${manifest.version}`,
        );
      const expected = evaluateCanonicalResourceReservationV11(
        reservationDescriptor,
        first,
      );
      if (JSON.stringify(result) !== JSON.stringify(expected))
        throw new Error(
          `reservation evaluator drift for ${manifest.moduleId}@${manifest.version}`,
        );
      for (const resource of Object.keys(
        result,
      ) as (keyof ModuleResourceBudget)[]) {
        if (result[resource] > manifest.resources[resource])
          throw new Error(
            `${resource} reservation exceeds manifest ceiling for ${manifest.moduleId}@${manifest.version}`,
          );
      }
      return Object.freeze({ ...result });
    };
    const frozenManifest: GameModuleManifestV14 = deepFreeze(manifest);
    this.#insert({
      manifest: frozenManifest,
      configurationSchema: input.configurationSchema,
      registrationKind: "production",
      manifestSha256: artifactIdentity.manifestSha256,
      configurationDescriptor: deepFreeze(configurationDescriptor),
      reservationDescriptor: deepFreeze(reservationDescriptor),
      artifactIdentity: deepFreeze(artifactIdentity),
      implementationBundle: Object.freeze({
        byteLength: input.implementationBundle.byteLength,
        sha256: artifactIdentity.implementationBundleSha256,
      }),
      executableHandle: handle,
      evaluateResourceReservation,
    });
  }

  find(
    moduleId: string,
    versionRange: string,
  ): readonly RegisteredGameModule[] {
    const versions = this.#modules.get(moduleId);
    if (versions === undefined) return Object.freeze([]);
    return Object.freeze(
      [...versions.values()]
        .filter(
          (entry): entry is RegisteredGameModule =>
            entry.manifest.schemaVersion !== "1.4.0",
        )
        .filter((entry) =>
          versionSatisfiesRange(entry.manifest.version, versionRange),
        )
        .sort((left, right) =>
          compareSemanticVersions(
            left.manifest.version,
            right.manifest.version,
          ),
        ),
    );
  }

  /**
   * Version 1.4 composition is the sole caller allowed to select the complete
   * mixed-version catalog.  The legacy `find` surface deliberately continues
   * to hide V1.4 registrations from older resolvers.
   */
  findForGraphV14(
    moduleId: string,
    versionRange: string,
  ): readonly (RegisteredGameModule | RegisteredGameModuleV14)[] {
    const versions = this.#modules.get(moduleId);
    if (versions === undefined) return Object.freeze([]);
    return Object.freeze(
      [...versions.values()]
        .filter((entry) =>
          versionSatisfiesRange(entry.manifest.version, versionRange),
        )
        .sort((left, right) =>
          compareSemanticVersions(
            left.manifest.version,
            right.manifest.version,
          ),
        ),
    );
  }

  list(): readonly RegisteredGameModule[] {
    return Object.freeze(
      [...this.#modules.values()]
        .flatMap((versions) => [...versions.values()])
        .filter(
          (entry): entry is RegisteredGameModule =>
            entry.manifest.schemaVersion !== "1.4.0",
        )
        .sort(
          (left, right) =>
            left.manifest.moduleId.localeCompare(right.manifest.moduleId) ||
            compareSemanticVersions(
              left.manifest.version,
              right.manifest.version,
            ),
        ),
    );
  }

  findExactProduction(
    moduleId: string,
    version: string,
    envelopeSha256: string,
  ): RegisteredGameModule | undefined {
    const registration = this.#modules.get(moduleId)?.get(version);
    return registration?.registrationKind === "production" &&
      registration.manifest.schemaVersion !== "1.4.0" &&
      registration.artifactIdentity?.envelopeSha256 === envelopeSha256
      ? (registration as RegisteredGameModule)
      : undefined;
  }

  findExactProductionV14(
    moduleId: string,
    version: string,
    envelopeSha256: string,
  ): AnyRegisteredGameModule | undefined {
    const registration = this.#modules.get(moduleId)?.get(version);
    return registration?.registrationKind === "production" &&
      registration.artifactIdentity?.envelopeSha256 === envelopeSha256
      ? registration
      : undefined;
  }

  registerContactPolicyProfile(profileInput: unknown): void {
    const profile = ContactPolicyChainProfileSchema.parse(profileInput);
    if (
      computeContactPolicyChainProfileEvidenceHash(profile) !==
      profile.evidenceHash
    ) {
      throw new Error(
        `contact policy profile evidence hash mismatch: ${profile.profileId}@${profile.version}`,
      );
    }
    const versions =
      this.#contactPolicyProfiles.get(profile.profileId) ?? new Map();
    if (versions.has(profile.version)) {
      throw new Error(
        `duplicate contact policy profile: ${profile.profileId}@${profile.version}`,
      );
    }
    versions.set(profile.version, deepFreeze(profile));
    this.#contactPolicyProfiles.set(profile.profileId, versions);
  }

  findContactPolicyProfile(
    profileId: string,
    version: string,
  ): ContactPolicyChainProfile | undefined {
    return this.#contactPolicyProfiles.get(profileId)?.get(version);
  }
}
