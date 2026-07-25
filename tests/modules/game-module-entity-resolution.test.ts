import { z } from "zod";

import { describe, expect, it } from "vitest";

import {
  GameModuleManifestV11Schema,
  type ModuleResourceBudget,
} from "../../src/modules/game-module-contract.js";
import {
  computeContactPolicyChainProfileEvidenceHash,
  ContactPolicyChainProfileSchema,
  createModuleArtifactHashDescriptor,
} from "../../src/modules/game-module-execution-contract.js";
import {
  GameModuleRegistry,
  type ProductionGameModuleRegistrationInput,
  type RegisteredGameModule,
} from "../../src/modules/game-module-registry.js";
import { DeterministicGameModuleProductionInstantiator } from "../../src/modules/game-module-production-instantiator.js";
import {
  ModuleResolutionError,
  ModuleResolutionErrorCode,
  resolveGameAssembly,
} from "../../src/modules/game-module-resolver.js";
import type {
  GameModuleFactoryContext,
  ProductionModuleExecutionExports,
} from "../../src/modules/game-module-runtime-factory.js";
import { createUnavailableRuntimeServiceHost } from "../../src/modules/game-module-runtime-services.js";
import {
  ContractFixtureAssemblies,
  createContractFixtureRegistry,
} from "../../src/modules/game-module-contract-fixtures.js";
import {
  assembly11,
  manifest11,
  zeroBudget,
} from "./game-module-execution-test-helpers.js";

const sameOwnerChannelAuthorization = {
  ownerRelation: "same-owner",
  sourceActorRoles: ["player"],
  targetActorRoles: ["player"],
  sourceEntityRoles: ["projectile.player"],
} as const;

const sameOwnerEventAuthorization = {
  ownerRelation: "same-owner",
  sourceActorRoles: ["player"],
  targetActorRoles: ["player"],
  sourceEntityRoles: [],
} as const;

function productionInput(
  manifestInput: unknown,
  resourceGrant: ModuleResourceBudget = zeroBudget,
): ProductionGameModuleRegistrationInput {
  const manifest = GameModuleManifestV11Schema.parse(manifestInput);
  const configurationDescriptor = {
    descriptorVersion: "1.0.0",
    schemaId: manifest.configurationSchemaId,
    dialect: "json-schema-2020-12-subset",
    schema: { type: "object", additionalProperties: false },
  } as const;
  const reservationDescriptor = {
    descriptorVersion: "1.0.0",
    reservationId: `${manifest.moduleId}.reservation`,
    strategy: "constant",
    fields: [
      { resource: "activeEntities", constant: resourceGrant.activeEntities },
      {
        resource: "activeProjectiles",
        constant: resourceGrant.activeProjectiles,
      },
      {
        resource: "spawnsPerSecond",
        constant: resourceGrant.spawnsPerSecond,
      },
      { resource: "timers", constant: resourceGrant.timers },
    ],
  } as const;
  const implementationBundle = Buffer.from(`${manifest.moduleId}-bundle-v1`);
  const dependencyLockIdentity = Buffer.from("pnpm-lock-reviewed-v1");
  const toolchainIdentity = Buffer.from("node22-typescript5-v1");
  const expectedArtifact = createModuleArtifactHashDescriptor({
    manifest,
    configurationDescriptor,
    reservationDescriptor,
    implementationBundle,
    dependencyLockIdentity,
    toolchainIdentity,
  });
  return {
    manifest,
    configurationDescriptor,
    configurationSchema: z.strictObject({}),
    reservationDescriptor,
    reservationEvaluator: () => ({ ...resourceGrant }),
    implementationBundle,
    dependencyLockIdentity,
    toolchainIdentity,
    expectedArtifact,
  };
}

function registerProduction(
  registry: GameModuleRegistry,
  manifest: unknown,
  resourceGrant: ModuleResourceBudget = zeroBudget,
): void {
  registry.registerProduction(productionInput(manifest, resourceGrant));
}

function resolutionCode(
  assembly: unknown,
  registry: GameModuleRegistry,
): string {
  try {
    resolveGameAssembly(assembly, registry);
    throw new Error("expected resolution failure");
  } catch (error) {
    expect(error).toBeInstanceOf(ModuleResolutionError);
    return (error as ModuleResolutionError).code;
  }
}

function channelOutput(portId = "projectiles") {
  return {
    id: portId,
    payloadType: "entity-channel-v1",
    delivery: "state",
    entityRole: "projectile.player",
  } as const;
}

function channelInput(portId: string) {
  return {
    id: portId,
    payloadType: "entity-channel-v1",
    delivery: "state",
    required: true,
    multiple: false,
    authorization: sameOwnerChannelAuthorization,
  } as const;
}

function candidateOutput() {
  return {
    id: "candidate",
    payloadType: "contact-candidate-v1",
    delivery: "event",
  } as const;
}

function candidateInput() {
  return {
    id: "candidate",
    payloadType: "contact-candidate-v1",
    delivery: "event",
    required: true,
    multiple: false,
    authorization: sameOwnerEventAuthorization,
  } as const;
}

function producerManifest(capacity: unknown) {
  return manifest11("test.entity-producer", {
    kind: "attack-delivery",
    outputPorts: [channelOutput()],
    resources: {
      ...zeroBudget,
      activeEntities: 4,
      activeProjectiles: 4,
    },
    runtimeLeases: { startLeases: 0, instanceLeases: 1, graphLeases: 0 },
    ownedEntityChannels: [
      { channelId: "projectiles", outputPort: "projectiles", capacity },
    ],
  });
}

function detectorManifest() {
  return manifest11("test.contact-detector", {
    dependencies: [
      {
        moduleId: "test.entity-producer",
        versionRange: "1.0.0",
        optional: false,
      },
    ],
    inputPorts: [channelInput("source-channel")],
    outputPorts: [candidateOutput()],
    contactDetector: {
      sourceChannelInputPort: "source-channel",
      candidateOutputPort: "candidate",
    },
    runtimeLeases: { startLeases: 1, instanceLeases: 0, graphLeases: 0 },
  });
}

function resolverManifest(
  transferRecipientActorRoles: readonly string[] = ["enemy"],
) {
  return manifest11("test.contact-resolver", {
    dependencies: [
      {
        moduleId: "test.contact-detector",
        versionRange: "1.0.0",
        optional: false,
      },
      {
        moduleId: "test.entity-producer",
        versionRange: "1.0.0",
        optional: false,
      },
    ],
    inputPorts: [candidateInput(), channelInput("mutation-channel")],
    entityMutationAccess: [
      {
        accessId: "source-mutation",
        inputPort: "mutation-channel",
        operations: ["consume", "transfer"],
        transferRecipientActorRoles,
      },
    ],
    contactResolution: {
      candidateInputPort: "candidate",
      mutationChannelInputPort: "mutation-channel",
    },
    runtimeLeases: { startLeases: 2, instanceLeases: 1, graphLeases: 0 },
  });
}

function policyManifest() {
  return manifest11("test.default-policy", {
    contactPolicyTransform: {
      descriptorVersion: "1.0.0",
      executionModel: "contact-policy-transform-v1",
      inputPayloadType: "contact-decision-v1",
      outputPayloadType: "contact-decision-v1",
      policyPhase: "default",
      policyRole: "policy.default-damage",
      allowedPredecessors: [],
      allowedSuccessors: [],
      requiresBefore: [],
      requiresAfter: [],
      supportedChainEvidenceIds: ["evidence.default-damage"],
      mutableDecisionFields: ["disposition", "sourceOperation", "damage"],
    },
  });
}

const bindings = [
  {
    from: { instanceId: "producer", portId: "projectiles" },
    to: { instanceId: "detector", portId: "source-channel" },
  },
  {
    from: { instanceId: "detector", portId: "candidate" },
    to: { instanceId: "resolver", portId: "candidate" },
  },
  {
    from: { instanceId: "producer", portId: "projectiles" },
    to: { instanceId: "resolver", portId: "mutation-channel" },
  },
] as const;

function registerProfile(registry: GameModuleRegistry): void {
  const profileInput = {
    schemaVersion: "1.0.0",
    profileId: "profile.default-damage",
    version: "1.0.0",
    orderedPolicies: [
      {
        moduleId: "test.default-policy",
        versionRange: "1.0.0",
        policyRole: "policy.default-damage",
      },
    ],
    allowedDispositions: ["damage"],
    allowedSourceOperations: ["consume", "transfer"],
    maxDepth: 1,
    supportedChainEvidenceId: "evidence.default-damage",
    evidenceHash: "a".repeat(64),
  } as const;
  registry.registerContactPolicyProfile(
    ContactPolicyChainProfileSchema.parse({
      ...profileInput,
      evidenceHash: computeContactPolicyChainProfileEvidenceHash(profileInput),
    }),
  );
}

function fullRegistry(
  resolver = resolverManifest(),
  producer = producerManifest({
    kind: "resource-grant",
    resources: ["activeEntities", "activeProjectiles"],
  }),
): GameModuleRegistry {
  const registry = new GameModuleRegistry();
  registerProduction(registry, producer, {
    ...zeroBudget,
    activeEntities: 4,
    activeProjectiles: 4,
  });
  registerProduction(registry, detectorManifest());
  registerProduction(registry, resolver);
  registerProduction(registry, policyManifest());
  registerProfile(registry);
  return registry;
}

function fullAssembly(overrides: Record<string, unknown> = {}): unknown {
  return assembly11(
    [
      { instanceId: "producer", moduleId: "test.entity-producer" },
      { instanceId: "detector", moduleId: "test.contact-detector" },
      { instanceId: "resolver", moduleId: "test.contact-resolver" },
      { instanceId: "policy", moduleId: "test.default-policy" },
    ],
    bindings,
    {
      contactPolicySelections: [
        {
          consumerInstanceId: "resolver",
          profileId: "profile.default-damage",
          version: "1.0.0",
        },
      ],
      entityMutationGrantSelections: [
        {
          granteeInstanceId: "resolver",
          accessId: "source-mutation",
          transferRecipientActorIds: ["enemy-one"],
        },
      ],
      ...overrides,
    },
  );
}

describe("Manifest-to-resolved-graph entity authority", () => {
  it("derives exact resource-grant capacity and one final mutation grant", () => {
    const graph = resolveGameAssembly(fullAssembly(), fullRegistry());
    expect(graph.productionInstantiationAllowed).toBe(true);
    expect(graph.entityChannels).toEqual([
      expect.objectContaining({
        channelId: "producer.projectiles",
        localChannelId: "projectiles",
        ownerInstanceId: "producer",
        ownerActorId: "player-one",
        outputPort: "projectiles",
        entityRole: "projectile.player",
        capacity: 4,
        capacityResources: ["activeEntities", "activeProjectiles"],
        readerInstanceIds: ["detector", "resolver"],
      }),
    ]);
    expect(graph.entityChannels[0]?.sourceArtifactEnvelopeSha256).toMatch(
      /^[a-f0-9]{64}$/,
    );
    expect(graph.entityMutationGrants).toEqual([
      {
        grantId: "resolver.source-mutation",
        accessId: "source-mutation",
        granteeInstanceId: "resolver",
        channelId: "producer.projectiles",
        operations: ["consume", "transfer"],
        transferRecipientActorIds: ["enemy-one"],
      },
    ]);
  });

  it("accepts constant capacity exactly at the exact resource grant", () => {
    const registry = new GameModuleRegistry();
    registerProduction(
      registry,
      producerManifest({
        kind: "constant",
        value: 4,
        resources: ["activeEntities", "activeProjectiles"],
      }),
      {
        ...zeroBudget,
        activeEntities: 4,
        activeProjectiles: 4,
      },
    );
    const graph = resolveGameAssembly(
      assembly11([
        { instanceId: "producer", moduleId: "test.entity-producer" },
      ]),
      registry,
    );
    expect(graph.entityChannels[0]?.capacity).toBe(4);
    expect(graph.entityMutationGrants).toEqual([]);
  });

  it("rejects constant capacity one over an exact resource grant", () => {
    const registry = new GameModuleRegistry();
    registerProduction(
      registry,
      producerManifest({
        kind: "constant",
        value: 5,
        resources: ["activeEntities", "activeProjectiles"],
      }),
      {
        ...zeroBudget,
        activeEntities: 4,
        activeProjectiles: 4,
      },
    );
    expect(
      resolutionCode(
        assembly11([
          { instanceId: "producer", moduleId: "test.entity-producer" },
        ]),
        registry,
      ),
    ).toBe(ModuleResolutionErrorCode.invalidEntityChannel);
  });

  it("rejects wrong entity ports, delivery, role, and mutation input shape", () => {
    for (const manifest of [
      manifest11("test.bad-channel-delivery", {
        outputPorts: [{ ...channelOutput(), delivery: "event" }],
        ownedEntityChannels: [
          {
            channelId: "projectiles",
            outputPort: "projectiles",
            capacity: {
              kind: "constant",
              value: 0,
              resources: ["activeEntities"],
            },
          },
        ],
      }),
      manifest11("test.bad-channel-role", {
        outputPorts: [{ ...channelOutput(), entityRole: undefined }],
        ownedEntityChannels: [
          {
            channelId: "projectiles",
            outputPort: "projectiles",
            capacity: {
              kind: "constant",
              value: 0,
              resources: ["activeEntities"],
            },
          },
        ],
      }),
      manifest11("test.bad-mutation-port", {
        inputPorts: [{ ...channelInput("mutation-channel"), multiple: true }],
        entityMutationAccess: [
          {
            accessId: "mutation",
            inputPort: "mutation-channel",
            operations: ["consume"],
            transferRecipientActorRoles: [],
          },
        ],
      }),
    ]) {
      expect(GameModuleManifestV11Schema.safeParse(manifest).success).toBe(
        false,
      );
    }
  });

  it("rejects missing and ambiguous entity authority bindings", () => {
    expect(
      resolutionCode(
        fullAssembly({ bindings: bindings.slice(0, 2) }),
        fullRegistry(),
      ),
    ).toBe(ModuleResolutionErrorCode.missingRequiredPort);
    expect(
      resolutionCode(
        fullAssembly({ bindings: [...bindings, bindings[2]] }),
        fullRegistry(),
      ),
    ).toBe(ModuleResolutionErrorCode.duplicateBinding);
  });

  it("rejects unknown, duplicate, and unmatched mutation selections", () => {
    expect(
      resolutionCode(
        fullAssembly({
          entityMutationGrantSelections: [
            {
              granteeInstanceId: "missing",
              accessId: "source-mutation",
              transferRecipientActorIds: [],
            },
          ],
        }),
        fullRegistry(),
      ),
    ).toBe(ModuleResolutionErrorCode.assemblyInvalid);
    const validSelection = {
      granteeInstanceId: "resolver",
      accessId: "source-mutation",
      transferRecipientActorIds: ["enemy-one"],
    } as const;
    expect(
      resolutionCode(
        fullAssembly({
          entityMutationGrantSelections: [validSelection, validSelection],
        }),
        fullRegistry(),
      ),
    ).toBe(ModuleResolutionErrorCode.assemblyInvalid);
    expect(
      resolutionCode(
        fullAssembly({
          entityMutationGrantSelections: [
            validSelection,
            {
              granteeInstanceId: "policy",
              accessId: "unknown-access",
              transferRecipientActorIds: [],
            },
          ],
        }),
        fullRegistry(),
      ),
    ).toBe(ModuleResolutionErrorCode.invalidEntityMutationGrant);
  });

  it("rejects missing grant selections and unauthorized transfer actor roles", () => {
    expect(
      resolutionCode(
        fullAssembly({ entityMutationGrantSelections: [] }),
        fullRegistry(),
      ),
    ).toBe(ModuleResolutionErrorCode.missingEntityMutationGrant);
    expect(
      resolutionCode(
        fullAssembly(),
        fullRegistry(resolverManifest(["companion"])),
      ),
    ).toBe(ModuleResolutionErrorCode.invalidEntityMutationGrant);
  });

  it("keeps Manifest 1.0 fixtures parseable but ineligible for production", () => {
    const graph = resolveGameAssembly(
      ContractFixtureAssemblies.legacyForward,
      createContractFixtureRegistry(),
    );
    expect(graph.productionInstantiationAllowed).toBe(false);
    expect(graph.entityChannels).toEqual([]);
    expect(graph.entityMutationGrants).toEqual([]);
  });

  it("instantiates only the resolved mutation authority and cleans transferred custody", () => {
    const sourceRegistry = fullRegistry();
    const graph = resolveGameAssembly(fullAssembly(), sourceRegistry);
    let producerContext: GameModuleFactoryContext | undefined;
    let detectorContext: GameModuleFactoryContext | undefined;
    let resolverContext: GameModuleFactoryContext | undefined;
    let sourceReference:
      ReturnType<GameModuleFactoryContext["entities"]["activate"]> | undefined;
    const createByModuleId = new Map<
      string,
      NonNullable<ProductionModuleExecutionExports["create"]>
    >([
      [
        "test.entity-producer",
        (context) => {
          producerContext = context;
          return {
            initialize: () => {
              sourceReference = context.entities.activate(
                "producer.projectiles",
                "projectile-one",
                1,
              );
              context.ports.publishState("projectiles", {
                revision: 0,
                emittedAtMs: 0,
                channelId: "producer.projectiles",
                ownerInstanceId: "producer",
                ownerActorId: "player-one",
                entityRole: "projectile.player",
                generation: 1,
              });
            },
          };
        },
      ],
      [
        "test.contact-detector",
        (context) => {
          detectorContext = context;
          context.ports.declareHandler("source-channel", () => undefined);
          return {};
        },
      ],
      [
        "test.contact-resolver",
        (context) => {
          resolverContext = context;
          context.ports.declareHandler("candidate", () => undefined);
          context.ports.declareHandler("mutation-channel", () => undefined);
          return {};
        },
      ],
    ]);
    class ExecutableRegistry extends GameModuleRegistry {
      override findExactProduction(
        moduleId: string,
        version: string,
        envelopeSha256: string,
      ): RegisteredGameModule | undefined {
        const registration = sourceRegistry.findExactProduction(
          moduleId,
          version,
          envelopeSha256,
        );
        if (registration === undefined) return undefined;
        const executionExports: ProductionModuleExecutionExports =
          registration.manifest.schemaVersion === "1.1.0" &&
          registration.manifest.contactPolicyTransform !== undefined
            ? {
                implementationId: registration.manifest.implementationId,
                artifactEnvelopeSha256: envelopeSha256,
                runtimeLeaseKeys: { start: [], instance: [], graph: [] },
                contactPolicyTransform: (decision) => decision,
              }
            : {
                implementationId: registration.manifest.implementationId,
                artifactEnvelopeSha256: envelopeSha256,
                runtimeLeaseKeys: { start: [], instance: [], graph: [] },
                create: createByModuleId.get(moduleId) ?? (() => ({})),
              };
        return Object.freeze({ ...registration, executionExports });
      }
    }

    const instance = DeterministicGameModuleProductionInstantiator.create({
      graph,
      registry: new ExecutableRegistry(),
      serviceHost: createUnavailableRuntimeServiceHost(),
    });
    instance.initialize();
    instance.start();
    expect(() =>
      detectorContext!.entities.mutate(
        "resolver.source-mutation",
        sourceReference!,
        "transfer",
        "enemy-one",
      ),
    ).toThrow();
    expect(producerContext).toBeDefined();
    expect(
      resolverContext!.entities.mutate(
        "resolver.source-mutation",
        sourceReference!,
        "transfer",
        "enemy-one",
      ).after?.ownerActorId,
    ).toBe("enemy-one");
    instance.stop();
    instance.dispose();
    instance.destroy();
    expect(instance.lifecycle.phase).toBe("destroyed");
  });
});
