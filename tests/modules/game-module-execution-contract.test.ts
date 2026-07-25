import { z } from "zod";

import { describe, expect, it } from "vitest";

import {
  GameModuleManifestSchema,
  GameModuleManifestV11Schema,
} from "../../src/modules/game-module-contract.js";
import {
  ContactDecisionPairMatrix,
  ContactDecisionPayloadSchema,
  ContactPolicyChainProfileSchema,
  RuntimePayloadSchemas,
  canonicalJsonBytes,
  computeContactPolicyChainProfileEvidenceHash,
  createModuleArtifactHashDescriptor,
  isLegalContactDecisionPair,
} from "../../src/modules/game-module-execution-contract.js";
import { GameModuleRegistry } from "../../src/modules/game-module-registry.js";
import {
  ModuleResolutionError,
  ModuleResolutionErrorCode,
  resolveGameAssembly,
} from "../../src/modules/game-module-resolver.js";

const hash = "a".repeat(64);
const emptyConfiguration = z.strictObject({});
const noResources = {
  activeEntities: 0,
  activeProjectiles: 0,
  spawnsPerSecond: 0,
  timers: 0,
} as const;
const sameOwner = {
  ownerRelation: "same-owner",
  sourceActorRoles: ["player", "enemy", "boss", "companion", "world"],
  targetActorRoles: ["player", "enemy", "boss", "companion", "world"],
  sourceEntityRoles: [],
} as const;
function manifest11(
  moduleId: string,
  overrides: Record<string, unknown> = {},
): unknown {
  return {
    schemaVersion: "1.1.0",
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
    conflicts: [],
    exclusiveOwnership: [],
    cardinality: {
      maximumInstancesPerAssembly: 16,
      maximumInstancesPerOwner: 16,
    },
    resources: noResources,
    runtimeLeases: { startLeases: 0, instanceLeases: 0, graphLeases: 0 },
    browserSupport: { desktop: true, touch: true },
    evidence: {
      provenanceId: "tests.execution-foundation",
      testSuiteId: "modules.execution-contract",
    },
    ...overrides,
  };
}

type RequestedModule = Readonly<{
  instanceId: string;
  moduleId: string;
  ownerId?: string;
}>;

function assembly11(
  modules: readonly RequestedModule[],
  options: Readonly<{
    bindings?: readonly unknown[];
    actors?: readonly unknown[];
    contactPolicySelections?: readonly unknown[];
    damageSinkRoutes?: readonly unknown[];
  }> = {},
): unknown {
  return {
    schemaVersion: "1.0.0",
    assemblyId: "test.execution-foundation",
    kernelVersion: "1.0.0",
    engine: { id: "phaser", version: "3.90.0" },
    actors: options.actors ?? [{ actorId: "player-one", role: "player" }],
    modules: modules.map((entry) => ({
      instanceId: entry.instanceId,
      moduleId: entry.moduleId,
      versionRange: "1.0.0",
      ownerId: entry.ownerId ?? "player-one",
      configuration: {},
    })),
    bindings: options.bindings ?? [],
    assetRoles: [],
    contactPolicySelections: options.contactPolicySelections,
    damageSinkRoutes: options.damageSinkRoutes,
    globalBudget: {
      activeEntities: 100,
      activeProjectiles: 100,
      spawnsPerSecond: 100,
      timers: 100,
    },
  };
}

function registerAll(
  manifests: readonly unknown[],
  profiles: readonly unknown[] = [],
): GameModuleRegistry {
  const registry = new GameModuleRegistry();
  for (const manifest of manifests)
    registry.register(manifest, emptyConfiguration);
  for (const profile of profiles)
    registry.registerContactPolicyProfile(profile);
  return registry;
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

describe("Manifest 1.1 execution foundation", () => {
  it("keeps Manifest 1.0 parse compatibility but marks its graph fixture-only", async () => {
    const { ContractFixtureAssemblies, createContractFixtureRegistry } =
      await import("../../src/modules/game-module-contract-fixtures.js");
    const graph = resolveGameAssembly(
      ContractFixtureAssemblies.legacyForward,
      createContractFixtureRegistry(),
    );
    expect(graph.graphVersion).toBe("1.1.0");
    expect(graph.productionInstantiationAllowed).toBe(false);
    expect(
      graph.modules.every((module) => module.instantiation === "fixture-only"),
    ).toBe(true);
  });

  it("accepts strict Manifest 1.1 delivery, scope, authorization, and lease fields", () => {
    const parsed = GameModuleManifestV11Schema.parse(
      manifest11("test.state-provider", {
        provides: [{ id: "test.state", version: "1.0.0", scope: "owner" }],
        outputPorts: [
          {
            id: "state",
            payloadType: "health-state-v1",
            delivery: "state",
          },
        ],
      }),
    );
    expect(parsed.schemaVersion).toBe("1.1.0");
    expect(() =>
      GameModuleManifestSchema.parse({
        ...parsed,
        executablePath: "./unsafe.js",
      }),
    ).toThrow();
  });

  it("rejects malformed sink and policy descriptors at the manifest boundary", () => {
    expect(() =>
      GameModuleManifestV11Schema.parse(
        manifest11("test.bad-sink", {
          damageSink: {
            capability: "combat.damage-sink@1.0.0",
            sinkRole: "terminal-health",
            inputPort: "damage",
          },
        }),
      ),
    ).toThrow(/damage sink inputPort/);
    expect(() =>
      GameModuleManifestV11Schema.parse(
        manifest11("test.bad-policy", {
          inputPorts: [
            {
              id: "decision",
              payloadType: "contact-decision-v1",
              delivery: "event",
              required: true,
              multiple: false,
              authorization: sameOwner,
            },
          ],
          contactPolicyTransform: policyDescriptor("test.bad-policy", [], []),
        }),
      ),
    ).toThrow(/cannot expose ordinary ports/);
  });
});

describe("runtime payload and canonical evidence contracts", () => {
  const decisionBase = {
    contactId: "contact.one",
    sourceChannelId: "channel.enemy-projectiles",
    sourceEntityId: "bullet-one",
    sourceGeneration: 1,
    sourceActorId: "enemy-one",
    targetActorId: "player-one",
    contactSequence: 0,
    metadata: { damage: 10, damageKind: "projectile" },
    policyTrace: [],
  } as const;

  it("validates representative state/event payloads and numeric boundaries", () => {
    expect(
      RuntimePayloadSchemas["target-selection-v1"].parse({
        revision: 0,
        emittedAtMs: 0,
        kind: "direction",
        direction: { x: 0, y: -1 },
      }).direction,
    ).toEqual({ x: 0, y: -1 });
    expect(() =>
      RuntimePayloadSchemas["target-selection-v1"].parse({
        revision: 0,
        emittedAtMs: 0,
        kind: "direction",
        direction: { x: 0, y: -0.5 },
      }),
    ).toThrow(/normalized/);
    expect(() =>
      RuntimePayloadSchemas["damage-v1"].parse({
        sequence: 0,
        emittedAtMs: 0,
        sourceActorId: "enemy-one",
        targetActorId: "player-one",
        amount: 0,
        damageKind: "projectile",
        contactSequence: 0,
      }),
    ).toThrow();
  });

  it("implements every legal contact-decision pair and rejects illegal combinations", () => {
    for (const [disposition, operations] of Object.entries(
      ContactDecisionPairMatrix,
    )) {
      for (const sourceOperation of operations) {
        const extra =
          disposition === "damage"
            ? { damage: 10 }
            : sourceOperation === "transfer"
              ? { transferTargetActorId: "enemy-two" }
              : {};
        expect(
          ContactDecisionPayloadSchema.safeParse({
            ...decisionBase,
            disposition,
            sourceOperation,
            ...extra,
          }).success,
        ).toBe(true);
      }
    }
    expect(isLegalContactDecisionPair("damage", "transfer")).toBe(false);
    expect(() =>
      ContactDecisionPayloadSchema.parse({
        ...decisionBase,
        disposition: "damage",
        sourceOperation: "transfer",
        damage: 10,
        transferTargetActorId: "enemy-two",
      }),
    ).toThrow(/illegal contact decision pair/);
  });

  it("canonicalizes object-key order and hashes every length-delimited artifact", () => {
    expect(
      Buffer.from(canonicalJsonBytes({ b: 2, a: 1 })).toString("utf8"),
    ).toBe('{"a":1,"b":2}');
    const input = {
      manifest: { moduleId: "test.hash", version: "1.0.0" },
      configurationDescriptor: {
        descriptorVersion: "1.0.0",
        schemaId: "test.hash.config",
        dialect: "json-schema-2020-12-subset",
        schema: { type: "object", additionalProperties: false },
      },
      reservationDescriptor: {
        descriptorVersion: "1.0.0",
        reservationId: "test.hash.resources",
        strategy: "constant",
        fields: [{ resource: "timers", constant: 0 }],
      },
      implementationBundle: Buffer.from("bundle-v1"),
      dependencyLockIdentity: Buffer.from("lock-v1"),
      toolchainIdentity: Buffer.from("node22-ts5"),
    } as const;
    const first = createModuleArtifactHashDescriptor(input);
    const second = createModuleArtifactHashDescriptor({
      ...input,
      manifest: { version: "1.0.0", moduleId: "test.hash" },
    });
    expect(second).toEqual(first);
    expect(
      createModuleArtifactHashDescriptor({
        ...input,
        implementationBundle: Buffer.from("bundle-v2"),
      }).envelopeSha256,
    ).not.toBe(first.envelopeSha256);
  });
});

function policyDescriptor(
  role: string,
  allowedPredecessors: readonly string[],
  allowedSuccessors: readonly string[],
): unknown {
  return {
    descriptorVersion: "1.0.0",
    executionModel: "contact-policy-transform-v1",
    inputPayloadType: "contact-decision-v1",
    outputPayloadType: "contact-decision-v1",
    policyPhase: role.includes("default") ? "default" : "interaction",
    policyRole: role,
    allowedPredecessors,
    allowedSuccessors,
    requiresBefore: [],
    requiresAfter: [],
    supportedChainEvidenceIds: ["evidence.default-absorb"],
    mutableDecisionFields: ["disposition", "sourceOperation", "damage"],
  };
}

describe("owner-aware resolution and delivery", () => {
  it("matches owner-scoped capabilities only within one owner", () => {
    const provider = manifest11("test.provider", {
      provides: [{ id: "test.capability", version: "1.0.0", scope: "owner" }],
    });
    const consumer = manifest11("test.consumer", {
      requires: [
        {
          id: "test.capability",
          versionRange: "1.0.0",
          cardinality: "exactly-one",
          scope: "owner",
        },
      ],
    });
    const registry = registerAll([provider, consumer]);
    expect(
      resolutionCode(
        assembly11(
          [
            {
              instanceId: "provider",
              moduleId: "test.provider",
              ownerId: "enemy-one",
            },
            { instanceId: "consumer", moduleId: "test.consumer" },
          ],
          {
            actors: [
              { actorId: "player-one", role: "player" },
              { actorId: "enemy-one", role: "enemy" },
            ],
          },
        ),
        registry,
      ),
    ).toBe(ModuleResolutionErrorCode.missingCapability);
  });

  it("admits only structurally authorized cross-owner entity channels", () => {
    const source = manifest11("test.channel-source", {
      outputPorts: [
        {
          id: "channel",
          payloadType: "entity-channel-v1",
          delivery: "state",
          entityRole: "enemy-projectile",
        },
      ],
    });
    const target = manifest11("test.channel-target", {
      inputPorts: [
        {
          id: "sources",
          payloadType: "entity-channel-v1",
          delivery: "state",
          required: true,
          multiple: false,
          authorization: {
            ownerRelation: "different-owner",
            sourceActorRoles: ["enemy"],
            targetActorRoles: ["player"],
            sourceEntityRoles: ["enemy-projectile"],
          },
        },
      ],
    });
    const registry = registerAll([source, target]);
    const valid = assembly11(
      [
        {
          instanceId: "source",
          moduleId: "test.channel-source",
          ownerId: "enemy-one",
        },
        { instanceId: "target", moduleId: "test.channel-target" },
      ],
      {
        actors: [
          { actorId: "player-one", role: "player" },
          { actorId: "enemy-one", role: "enemy" },
        ],
        bindings: [
          {
            from: { instanceId: "source", portId: "channel" },
            to: { instanceId: "target", portId: "sources" },
          },
        ],
      },
    );
    expect(resolveGameAssembly(valid, registry).bindings[0]?.delivery).toBe(
      "state",
    );

    const wrongRoleRegistry = registerAll([
      manifest11("test.wrong-source", {
        outputPorts: [
          {
            id: "channel",
            payloadType: "entity-channel-v1",
            delivery: "state",
            entityRole: "friendly-projectile",
          },
        ],
      }),
      target,
    ]);
    expect(
      resolutionCode(
        assembly11(
          [
            {
              instanceId: "source",
              moduleId: "test.wrong-source",
              ownerId: "enemy-one",
            },
            { instanceId: "target", moduleId: "test.channel-target" },
          ],
          {
            actors: [
              { actorId: "player-one", role: "player" },
              { actorId: "enemy-one", role: "enemy" },
            ],
            bindings: [
              {
                from: { instanceId: "source", portId: "channel" },
                to: { instanceId: "target", portId: "sources" },
              },
            ],
          },
        ),
        wrongRoleRegistry,
      ),
    ).toBe(ModuleResolutionErrorCode.endpointUnauthorized);
  });

  it("rejects delivery mismatches and synchronous event cycles", () => {
    const stateSource = manifest11("test.state-source", {
      outputPorts: [
        { id: "value", payloadType: "damage-v1", delivery: "state" },
      ],
    });
    const eventTarget = manifest11("test.event-target", {
      inputPorts: [
        {
          id: "value",
          payloadType: "damage-v1",
          delivery: "event",
          required: true,
          multiple: false,
          authorization: sameOwner,
        },
      ],
    });
    expect(
      resolutionCode(
        assembly11(
          [
            { instanceId: "source", moduleId: "test.state-source" },
            { instanceId: "target", moduleId: "test.event-target" },
          ],
          {
            bindings: [
              {
                from: { instanceId: "source", portId: "value" },
                to: { instanceId: "target", portId: "value" },
              },
            ],
          },
        ),
        registerAll([stateSource, eventTarget]),
      ),
    ).toBe(ModuleResolutionErrorCode.deliveryMismatch);

    const eventNode = (id: string) =>
      manifest11(id, {
        inputPorts: [
          {
            id: "input",
            payloadType: "damage-v1",
            delivery: "event",
            required: true,
            multiple: false,
            authorization: sameOwner,
          },
        ],
        outputPorts: [
          { id: "output", payloadType: "damage-v1", delivery: "event" },
        ],
      });
    expect(
      resolutionCode(
        assembly11(
          [
            { instanceId: "node-a", moduleId: "test.event-a" },
            { instanceId: "node-b", moduleId: "test.event-b" },
          ],
          {
            bindings: [
              {
                from: { instanceId: "node-a", portId: "output" },
                to: { instanceId: "node-b", portId: "input" },
              },
              {
                from: { instanceId: "node-b", portId: "output" },
                to: { instanceId: "node-a", portId: "input" },
              },
            ],
          },
        ),
        registerAll([eventNode("test.event-a"), eventNode("test.event-b")]),
      ),
    ).toBe(ModuleResolutionErrorCode.synchronousEventCycle);
  });
});

describe("reviewed contact policy profiles", () => {
  const defaultPolicy = manifest11("interaction.default", {
    contactPolicyTransform: policyDescriptor(
      "policy.default",
      [],
      ["interaction.absorb"],
    ),
  });
  const absorbPolicy = manifest11("interaction.absorb", {
    contactPolicyTransform: policyDescriptor(
      "policy.absorb",
      ["interaction.default"],
      [],
    ),
  });
  const consumer = manifest11("interaction.resolution");
  const profileInput = {
    schemaVersion: "1.0.0",
    profileId: "profile.default-absorb",
    version: "1.0.0",
    orderedPolicies: [
      {
        moduleId: "interaction.default",
        versionRange: "1.0.0",
        policyRole: "policy.default",
      },
      {
        moduleId: "interaction.absorb",
        versionRange: "1.0.0",
        policyRole: "policy.absorb",
      },
    ],
    allowedDispositions: ["damage", "absorb"],
    allowedSourceOperations: ["consume"],
    maxDepth: 2,
    supportedChainEvidenceId: "evidence.default-absorb",
    evidenceHash: hash,
  } as const;
  const profile = ContactPolicyChainProfileSchema.parse({
    ...profileInput,
    evidenceHash: computeContactPolicyChainProfileEvidenceHash(profileInput),
  });

  it("expands a registry-owned exact profile into Graph 1.1 evidence", () => {
    const registry = registerAll(
      [defaultPolicy, absorbPolicy, consumer],
      [profile],
    );
    const graph = resolveGameAssembly(
      assembly11(
        [
          { instanceId: "default-policy", moduleId: "interaction.default" },
          { instanceId: "absorb-policy", moduleId: "interaction.absorb" },
          { instanceId: "resolver", moduleId: "interaction.resolution" },
        ],
        {
          contactPolicySelections: [
            {
              consumerInstanceId: "resolver",
              profileId: "profile.default-absorb",
              version: "1.0.0",
            },
          ],
        },
      ),
      registry,
    );
    expect(graph.contactPolicyProfiles[0]?.orderedPolicyInstanceIds).toEqual([
      "default-policy",
      "absorb-policy",
    ]);
  });

  it("deterministically rejects unknown and unreviewed policy order", () => {
    expect(() =>
      registerAll([consumer], [{ ...profile, evidenceHash: hash }]),
    ).toThrow(/evidence hash mismatch/);
    expect(
      resolutionCode(
        assembly11(
          [{ instanceId: "resolver", moduleId: "interaction.resolution" }],
          {
            contactPolicySelections: [
              {
                consumerInstanceId: "resolver",
                profileId: "profile.missing",
                version: "1.0.0",
              },
            ],
          },
        ),
        registerAll([consumer]),
      ),
    ).toBe(ModuleResolutionErrorCode.missingPolicyProfile);

    const reversed = {
      ...profile,
      profileId: "profile.reversed",
      orderedPolicies: [...profile.orderedPolicies].reverse(),
    };
    const hashedReversed = {
      ...reversed,
      evidenceHash: computeContactPolicyChainProfileEvidenceHash(reversed),
    };
    expect(
      resolutionCode(
        assembly11(
          [
            { instanceId: "default-policy", moduleId: "interaction.default" },
            { instanceId: "absorb-policy", moduleId: "interaction.absorb" },
            { instanceId: "resolver", moduleId: "interaction.resolution" },
          ],
          {
            contactPolicySelections: [
              {
                consumerInstanceId: "resolver",
                profileId: "profile.reversed",
                version: "1.0.0",
              },
            ],
          },
        ),
        registerAll([defaultPolicy, absorbPolicy, consumer], [hashedReversed]),
      ),
    ).toBe(ModuleResolutionErrorCode.invalidPolicyOrder);
  });
});

function producerManifest(): unknown {
  return manifest11("test.damage-producer", {
    outputPorts: [
      { id: "damage", payloadType: "damage-v1", delivery: "event" },
    ],
  });
}

function filterManifest(moduleId: string): unknown {
  return manifest11(moduleId, {
    inputPorts: [
      {
        id: "damage",
        payloadType: "damage-v1",
        delivery: "event",
        required: true,
        multiple: true,
        authorization: sameOwner,
      },
    ],
    outputPorts: [
      { id: "downstream", payloadType: "damage-v1", delivery: "event" },
    ],
    damageSink: {
      capability: "combat.damage-sink@1.0.0",
      sinkRole: "filter",
      inputPort: "damage",
      downstreamOutputPort: "downstream",
    },
  });
}

function healthManifest(): unknown {
  return manifest11("combat.health", {
    inputPorts: [
      {
        id: "damage",
        payloadType: "damage-v1",
        delivery: "event",
        required: true,
        multiple: true,
        authorization: sameOwner,
      },
    ],
    damageSink: {
      capability: "combat.damage-sink@1.0.0",
      sinkRole: "terminal-health",
      inputPort: "damage",
    },
  });
}

describe("linear owner-scoped damage-sink resolution", () => {
  const producer = producerManifest();
  const shield = filterManifest("combat.shield");
  const health = healthManifest();
  const baseModules = [
    { instanceId: "producer", moduleId: "test.damage-producer" },
    { instanceId: "shield", moduleId: "combat.shield" },
    { instanceId: "health", moduleId: "combat.health" },
  ] as const;
  const route = [{ ownerId: "player-one", headInstanceId: "shield" }] as const;

  it("pins one producer-to-head linear route terminating at health", () => {
    const graph = resolveGameAssembly(
      assembly11(baseModules, {
        bindings: [
          {
            from: { instanceId: "producer", portId: "damage" },
            to: { instanceId: "shield", portId: "damage" },
          },
          {
            from: { instanceId: "shield", portId: "downstream" },
            to: { instanceId: "health", portId: "damage" },
          },
        ],
        damageSinkRoutes: route,
      }),
      registerAll([producer, shield, health]),
    );
    expect(graph.damageSinkRoutes[0]).toMatchObject({
      headInstanceId: "shield",
      orderedSinkInstanceIds: ["shield", "health"],
      terminalHealthInstanceId: "health",
      producerInstanceIds: ["producer"],
    });
  });

  it("rejects below-head bypass, fork, cycle, and unterminated routes", () => {
    const registry = registerAll([producer, shield, health]);
    expect(
      resolutionCode(
        assembly11(baseModules, {
          bindings: [
            {
              from: { instanceId: "producer", portId: "damage" },
              to: { instanceId: "shield", portId: "damage" },
            },
            {
              from: { instanceId: "shield", portId: "downstream" },
              to: { instanceId: "health", portId: "damage" },
            },
          ],
        }),
        registry,
      ),
    ).toBe(ModuleResolutionErrorCode.missingDamageSinkRoute);
    const bypassBindings = [
      {
        from: { instanceId: "producer", portId: "damage" },
        to: { instanceId: "shield", portId: "damage" },
      },
      {
        from: { instanceId: "producer", portId: "damage" },
        to: { instanceId: "health", portId: "damage" },
      },
      {
        from: { instanceId: "shield", portId: "downstream" },
        to: { instanceId: "health", portId: "damage" },
      },
    ];
    expect(
      resolutionCode(
        assembly11(baseModules, {
          bindings: bypassBindings,
          damageSinkRoutes: route,
        }),
        registry,
      ),
    ).toBe(ModuleResolutionErrorCode.invalidDamageSinkRoute);

    const armor = filterManifest("combat.armor");
    const forkRegistry = registerAll([producer, shield, armor, health]);
    expect(
      resolutionCode(
        assembly11(
          [...baseModules, { instanceId: "armor", moduleId: "combat.armor" }],
          {
            bindings: [
              {
                from: { instanceId: "producer", portId: "damage" },
                to: { instanceId: "shield", portId: "damage" },
              },
              {
                from: { instanceId: "shield", portId: "downstream" },
                to: { instanceId: "health", portId: "damage" },
              },
              {
                from: { instanceId: "shield", portId: "downstream" },
                to: { instanceId: "armor", portId: "damage" },
              },
              {
                from: { instanceId: "armor", portId: "downstream" },
                to: { instanceId: "health", portId: "damage" },
              },
            ],
            damageSinkRoutes: route,
          },
        ),
        forkRegistry,
      ),
    ).toBe(ModuleResolutionErrorCode.invalidDamageSinkRoute);

    const cycleRegistry = registerAll([producer, shield, armor]);
    expect(
      resolutionCode(
        assembly11(
          [
            { instanceId: "producer", moduleId: "test.damage-producer" },
            { instanceId: "shield", moduleId: "combat.shield" },
            { instanceId: "armor", moduleId: "combat.armor" },
          ],
          {
            bindings: [
              {
                from: { instanceId: "producer", portId: "damage" },
                to: { instanceId: "shield", portId: "damage" },
              },
              {
                from: { instanceId: "shield", portId: "downstream" },
                to: { instanceId: "armor", portId: "damage" },
              },
              {
                from: { instanceId: "armor", portId: "downstream" },
                to: { instanceId: "shield", portId: "damage" },
              },
            ],
            damageSinkRoutes: route,
          },
        ),
        cycleRegistry,
      ),
    ).toBe(ModuleResolutionErrorCode.synchronousEventCycle);

    expect(
      resolutionCode(
        assembly11(
          [
            { instanceId: "producer", moduleId: "test.damage-producer" },
            { instanceId: "shield", moduleId: "combat.shield" },
          ],
          {
            bindings: [
              {
                from: { instanceId: "producer", portId: "damage" },
                to: { instanceId: "shield", portId: "damage" },
              },
            ],
            damageSinkRoutes: route,
          },
        ),
        registerAll([producer, shield]),
      ),
    ).toBe(ModuleResolutionErrorCode.invalidDamageSinkRoute);
  });
});
