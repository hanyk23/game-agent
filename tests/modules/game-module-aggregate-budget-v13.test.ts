import { z } from "zod";

import { describe, expect, it } from "vitest";

import { BATCH1_MODULE_DEFINITIONS } from "../../src/modules/batch1-gameplay-library.js";
import { GameModuleManifestV13Schema } from "../../src/modules/game-module-contract.js";
import { MaximumReachableReservationDescriptorV11Schema } from "../../src/modules/game-module-execution-contract.js";
import {
  evaluateCanonicalResourceReservationV11,
  GameModuleRegistry,
} from "../../src/modules/game-module-registry.js";
import {
  ModuleResolutionError,
  ModuleResolutionErrorCode,
  resolveGameAssemblyV13,
} from "../../src/modules/game-module-resolver.js";

const sameOwner = {
  ownerRelation: "same-owner" as const,
  sourceActorRoles: ["player"] as const,
  targetActorRoles: ["player"] as const,
  sourceEntityRoles: [] as const,
};

function baseManifest(
  moduleId: string,
  kind: "targeting" | "attack-trigger" | "attack-delivery",
  overrides: Record<string, unknown>,
) {
  return GameModuleManifestV13Schema.parse({
    ...structuredClone(BATCH1_MODULE_DEFINITIONS[0]!.manifest),
    schemaVersion: "1.3.0",
    moduleId,
    version: "1.0.0",
    kind,
    implementationId: `${moduleId}.v1`,
    configurationSchemaId: `${moduleId}.config`,
    provides: [],
    requires: [],
    inputPorts: [],
    outputPorts: [],
    dependencies: [],
    assetRequirements: [],
    conflicts: [],
    exclusiveOwnership: [],
    cardinality: {
      maximumInstancesPerAssembly: 128,
      maximumInstancesPerOwner: 32,
    },
    resources: {
      activeEntities: 0,
      activeProjectiles: 0,
      spawnsPerSecond: 0,
      timers: 0,
    },
    runtimeLeases: { startLeases: 0, instanceLeases: 0, graphLeases: 0 },
    runtimeContract: {
      update: null,
      timerSlots: { slotGroupId: "main" },
      inputRegistrations: [],
      observationReaders: [],
      contactCommit: null,
    },
    ownedEntityChannels: [],
    entityMutationAccess: [],
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

function patternFixture() {
  const registry = new GameModuleRegistry();
  const modules: Array<Record<string, unknown>> = [];
  const bindings: Array<Record<string, unknown>> = [];
  const grants = [
    { channel: "alpha", active: 4, rate: 12 },
    { channel: "beta", active: 6, rate: 18 },
    { channel: "gamma", active: 8, rate: 24 },
  ];
  for (const grant of grants) {
    const targeting = baseManifest(
      `targeting.test-${grant.channel}`,
      "targeting",
      {
        outputPorts: [
          {
            id: "target",
            payloadType: "target-solution-v1",
            delivery: "state",
          },
        ],
        runtimeLeases: {
          startLeases: 0,
          instanceLeases: 1,
          graphLeases: 0,
        },
        attackChannel: {
          role: "targeting",
          configurationField: "attackChannelId",
          targetOutputPort: "target",
          targetPayloadType: "target-solution-v1",
        },
      },
    );
    const trigger = baseManifest(
      `trigger.test-${grant.channel}`,
      "attack-trigger",
      {
        outputPorts: [
          {
            id: "request",
            payloadType: "attack-request-v2",
            delivery: "event",
          },
        ],
        attackChannel: {
          role: "trigger",
          configurationField: "attackChannelId",
          requestOutputPort: "request",
          requestPayloadType: "attack-request-v2",
        },
      },
    );
    const delivery = baseManifest(
      `delivery.pattern-${grant.channel}`,
      "attack-delivery",
      {
        provides: [
          { id: "delivery.projectile", version: "1.0.0", scope: "owner" },
          {
            id: "delivery.projectile-channel",
            version: "1.0.0",
            scope: "assembly",
          },
        ],
        inputPorts: [
          {
            id: "target",
            payloadType: "target-solution-v1",
            required: true,
            multiple: false,
            delivery: "state",
            authorization: sameOwner,
          },
          {
            id: "request",
            payloadType: "attack-request-v2",
            required: true,
            multiple: false,
            delivery: "event",
            authorization: sameOwner,
          },
        ],
        outputPorts: [
          {
            id: "projectiles",
            payloadType: "entity-channel-v1",
            delivery: "state",
            entityRole: "projectile",
          },
        ],
        resources: {
          activeEntities: grant.active,
          activeProjectiles: grant.active,
          spawnsPerSecond: grant.rate,
          timers: 0,
        },
        runtimeLeases: {
          startLeases: 2,
          instanceLeases: 3,
          graphLeases: 0,
        },
        ownedEntityChannels: [
          {
            channelId: "projectiles",
            outputPort: "projectiles",
            entityRole: "projectile",
            capacity: {
              kind: "resource-grant",
              resources: ["activeEntities", "activeProjectiles"],
            },
            poolDescriptor: {
              poolId: "projectiles.pool",
              entityRole: "projectile",
              capacityResource: "activeEntities",
              projectileResource: "activeProjectiles",
            },
          },
        ],
        projectileDelivery: {
          capability: "delivery.projectile@1.0.0",
          channelId: "projectiles",
          entityRole: "projectile",
          capacityResources: ["activeEntities", "activeProjectiles"],
        },
        attackChannel: {
          role: "delivery",
          configurationField: "attackChannelId",
          targetInputPort: "target",
          targetPayloadType: "target-solution-v1",
          requestInputPort: "request",
          requestPayloadType: "attack-request-v2",
        },
      },
    );
    const configuration = z.strictObject({
      attackChannelId: z.string().regex(/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/),
    });
    registry.register(targeting, configuration);
    registry.register(trigger, configuration);
    registry.register(delivery, configuration);
    for (const [role, manifest] of [
      ["targeting", targeting],
      ["trigger", trigger],
      ["delivery", delivery],
    ] as const)
      modules.push({
        instanceId: `${role}-${grant.channel}`,
        moduleId: manifest.moduleId,
        versionRange: manifest.version,
        ownerId: "player-one",
        configuration: { attackChannelId: grant.channel },
      });
    bindings.push(
      {
        from: {
          instanceId: `targeting-${grant.channel}`,
          portId: "target",
        },
        to: { instanceId: `delivery-${grant.channel}`, portId: "target" },
      },
      {
        from: { instanceId: `trigger-${grant.channel}`, portId: "request" },
        to: { instanceId: `delivery-${grant.channel}`, portId: "request" },
      },
    );
  }
  const assembly = {
    schemaVersion: "1.2.0",
    assemblyId: "test.pattern-contention",
    kernelVersion: "1.0.0",
    engine: { id: "phaser", version: "3.90.0" },
    actors: [{ actorId: "player-one", role: "player" }],
    modules,
    bindings,
    assetRoles: [],
    assetBindings: [],
    effectApplicationBindings: [],
    pickupEffectPlanSelections: [],
    globalBudget: {
      activeEntities: 18,
      activeProjectiles: 18,
      spawnsPerSecond: 54,
      timers: 0,
    },
  };
  return { registry, assembly };
}

describe("Graph 1.3 projectile aggregate budget", () => {
  it("keeps an unchanged Manifest 1.2-only Graph 1.3 on an empty zero ledger", () => {
    const legacy = BATCH1_MODULE_DEFINITIONS[0]!;
    const registry = new GameModuleRegistry();
    registry.register(legacy.manifest, legacy.configurationSchema);
    const graph = resolveGameAssemblyV13(
      {
        schemaVersion: "1.2.0",
        assemblyId: "test.legacy-empty-contention",
        kernelVersion: "1.0.0",
        engine: { id: "phaser", version: "3.90.0" },
        actors: [{ actorId: "player-one", role: "player" }],
        modules: [
          {
            instanceId: "legacy-input",
            moduleId: legacy.manifest.moduleId,
            versionRange: legacy.manifest.version,
            ownerId: "player-one",
            configuration: {
              bindings: "arrows-and-wasd",
              normalizeDiagonal: true,
              emitNeutral: true,
            },
          },
        ],
        bindings: [],
        assetRoles: [],
        assetBindings: [],
        effectApplicationBindings: [],
        pickupEffectPlanSelections: [],
        globalBudget: legacy.manifest.resources,
      },
      registry,
    ).graph;
    expect(graph.projectileBudgetContention).toEqual({
      budget: { activeProjectiles: 0, spawnsPerSecond: 0 },
      totals: { activeProjectiles: 0, spawnsPerSecond: 0 },
      orderedOwners: [],
    });
  });

  it("materializes independent pool/channel custody in stable resolved order", () => {
    const { registry, assembly } = patternFixture();
    const contention = resolveGameAssemblyV13(assembly, registry).graph
      .projectileBudgetContention;

    expect(contention.budget).toEqual({
      activeProjectiles: 18,
      spawnsPerSecond: 54,
    });
    expect(contention.totals).toEqual({
      activeProjectiles: 18,
      spawnsPerSecond: 54,
    });
    expect(contention.orderedOwners.map((owner) => owner.instanceId)).toEqual([
      "delivery-alpha",
      "delivery-beta",
      "delivery-gamma",
    ]);
    expect(
      contention.orderedOwners.map((owner) => [
        owner.channelId,
        owner.poolId,
        owner.cumulativeActiveProjectiles,
        owner.cumulativeSpawnsPerSecond,
      ]),
    ).toEqual([
      ["delivery-alpha.projectiles", "delivery-alpha.projectiles.pool", 4, 12],
      ["delivery-beta.projectiles", "delivery-beta.projectiles.pool", 10, 30],
      ["delivery-gamma.projectiles", "delivery-gamma.projectiles.pool", 18, 54],
    ]);
  });

  it("evaluates maximum-reachable formulas exactly and rejects unsafe arithmetic", () => {
    const descriptor = MaximumReachableReservationDescriptorV11Schema.parse({
      descriptorVersion: "1.1.0",
      reservationId: "delivery.pattern.maximum-reachable",
      strategy: "maximum-reachable-v1",
      fields: [
        {
          resource: "activeEntities",
          formula: { kind: "configuration-field", field: "maxActive" },
        },
        {
          resource: "activeProjectiles",
          formula: { kind: "configuration-field", field: "maxActive" },
        },
        {
          resource: "spawnsPerSecond",
          formula: {
            kind: "product-field-and-sum",
            factorField: "maximumAcceptedRequestsPerSecond",
            sumFields: ["baseCount", "maximumCountBonus"],
          },
        },
        {
          resource: "timers",
          formula: { kind: "constant", value: 0 },
        },
      ],
    });
    expect(
      evaluateCanonicalResourceReservationV11(descriptor, {
        maxActive: 12,
        maximumAcceptedRequestsPerSecond: 5,
        baseCount: 2,
        maximumCountBonus: 3,
      }),
    ).toEqual({
      activeEntities: 12,
      activeProjectiles: 12,
      spawnsPerSecond: 25,
      timers: 0,
    });
    expect(() =>
      evaluateCanonicalResourceReservationV11(descriptor, {
        maxActive: 12,
        maximumAcceptedRequestsPerSecond: Number.MAX_SAFE_INTEGER,
        baseCount: 1,
        maximumCountBonus: 1,
      }),
    ).toThrow(/safe integer/);
    expect(() =>
      evaluateCanonicalResourceReservationV11(descriptor, {
        maxActive: 12,
        maximumAcceptedRequestsPerSecond: 1,
        baseCount: -1,
        maximumCountBonus: 1,
      }),
    ).toThrow(/non-negative safe integer/);
  });

  it("rejects an assembly one over either aggregate budget", () => {
    const { registry, assembly } = patternFixture();
    for (const field of ["activeProjectiles", "spawnsPerSecond"] as const) {
      const broken = structuredClone(assembly);
      broken.globalBudget[field] -= 1;
      expect(() => resolveGameAssemblyV13(broken, registry)).toThrow(
        ModuleResolutionError,
      );
      try {
        resolveGameAssemblyV13(broken, registry);
      } catch (error) {
        expect((error as ModuleResolutionError).code).toBe(
          ModuleResolutionErrorCode.resourceBudgetExceeded,
        );
      }
    }
  });

  it("rejects a pattern pool whose capacity is not its exact projectile grant", () => {
    const { registry: unused, assembly } = patternFixture();
    void unused;
    const registry = new GameModuleRegistry();
    const source = patternFixture();
    const deliveryRequest = source.assembly.modules.find(
      (module) => module.instanceId === "delivery-alpha",
    )!;
    const registration = source.registry.find(
      deliveryRequest.moduleId as string,
      deliveryRequest.versionRange as string,
    )[0]!;
    const manifest = structuredClone(registration.manifest);
    if (manifest.schemaVersion !== "1.3.0") throw new Error("expected V1.3");
    manifest.ownedEntityChannels![0]!.capacity = {
      kind: "constant",
      value: 3,
      resources: ["activeEntities", "activeProjectiles"],
    };
    registry.register(manifest, registration.configurationSchema);
    for (const request of source.assembly.modules) {
      if (request.instanceId === "delivery-alpha") continue;
      const found = source.registry.find(
        request.moduleId as string,
        request.versionRange as string,
      )[0]!;
      if (
        registry.find(found.manifest.moduleId, found.manifest.version)
          .length === 0
      )
        registry.register(found.manifest, found.configurationSchema);
    }
    expect(() => resolveGameAssemblyV13(assembly, registry)).toThrowError(
      /one exact independently owned channel\/pool/,
    );
  });
});

describe("Graph 1.3 attack-channel rejection matrix", () => {
  function expectRejected(
    mutate: (assembly: ReturnType<typeof patternFixture>["assembly"]) => void,
    expectedCodes: readonly ModuleResolutionErrorCode[],
  ) {
    const { registry, assembly } = patternFixture();
    const broken = structuredClone(assembly);
    mutate(broken);
    try {
      resolveGameAssemblyV13(broken, registry);
      throw new Error("expected resolution rejection");
    } catch (error) {
      expect(error).toBeInstanceOf(ModuleResolutionError);
      expect(expectedCodes).toContain((error as ModuleResolutionError).code);
    }
  }

  it("rejects a missing channel role", () => {
    expectRejected(
      (assembly) => {
        assembly.modules = assembly.modules.filter(
          (module) => module.instanceId !== "trigger-alpha",
        );
        assembly.bindings = assembly.bindings.filter(
          (binding) =>
            (binding.from as { instanceId: string }).instanceId !==
            "trigger-alpha",
        );
      },
      [
        ModuleResolutionErrorCode.invalidAttackChannel,
        ModuleResolutionErrorCode.missingRequiredPort,
      ],
    );
  });

  it("rejects duplicate roles and delivery ownership", () => {
    expectRejected(
      (assembly) => {
        const duplicate = structuredClone(
          assembly.modules.find(
            (module) => module.instanceId === "delivery-alpha",
          )!,
        );
        duplicate.instanceId = "delivery-alpha-copy";
        assembly.modules.push(duplicate);
        assembly.globalBudget.activeEntities += 4;
        assembly.globalBudget.activeProjectiles += 4;
        assembly.globalBudget.spawnsPerSecond += 12;
        assembly.bindings.push(
          {
            from: { instanceId: "targeting-alpha", portId: "target" },
            to: { instanceId: "delivery-alpha-copy", portId: "target" },
          },
          {
            from: { instanceId: "trigger-alpha", portId: "request" },
            to: { instanceId: "delivery-alpha-copy", portId: "request" },
          },
        );
      },
      [ModuleResolutionErrorCode.invalidAttackChannel],
    );
  });

  it("rejects owner and configured-channel mismatches", () => {
    expectRejected(
      (assembly) => {
        assembly.actors.push({ actorId: "player-two", role: "player" });
        assembly.modules.find(
          (module) => module.instanceId === "trigger-alpha",
        )!.ownerId = "player-two";
      },
      [
        ModuleResolutionErrorCode.assemblyInvalid,
        ModuleResolutionErrorCode.endpointUnauthorized,
        ModuleResolutionErrorCode.invalidAttackChannel,
      ],
    );
    expectRejected(
      (assembly) => {
        assembly.modules.find(
          (module) => module.instanceId === "trigger-alpha",
        )!.configuration = { attackChannelId: "beta" };
      },
      [ModuleResolutionErrorCode.invalidAttackChannel],
    );
  });

  it("rejects targeting fan-out across channel identities", () => {
    expectRejected(
      (assembly) => {
        assembly.bindings = assembly.bindings.filter(
          (binding) =>
            !(
              (binding.from as { instanceId: string }).instanceId ===
                "targeting-beta" &&
              (binding.to as { instanceId: string }).instanceId ===
                "delivery-beta"
            ),
        );
        assembly.bindings.push({
          from: { instanceId: "targeting-alpha", portId: "target" },
          to: { instanceId: "delivery-beta", portId: "target" },
        });
      },
      [ModuleResolutionErrorCode.invalidAttackChannel],
    );
  });
});
