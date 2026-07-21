import { z } from "zod";

import { describe, expect, it } from "vitest";

import type { ModuleResourceBudget } from "../../src/modules/game-module-contract.js";
import {
  createModuleArtifactHashDescriptor,
  type ArtifactHashDescriptor,
} from "../../src/modules/game-module-execution-contract.js";
import {
  DeterministicModulePortRouter,
  ModulePortRouterError,
  ModulePortRouterErrorCode,
} from "../../src/modules/game-module-port-router.js";
import {
  GameModuleRegistry,
  type ProductionGameModuleRegistrationInput,
} from "../../src/modules/game-module-registry.js";
import {
  ModuleResolutionError,
  ModuleResolutionErrorCode,
  resolveGameAssembly,
  type ResolvedModuleGraph,
} from "../../src/modules/game-module-resolver.js";
import {
  ContractFixtureAssemblies,
  ContractFixtureManifests,
  createContractFixtureRegistry,
} from "../../src/modules/game-module-contract-fixtures.js";

const zeroBudget: ModuleResourceBudget = {
  activeEntities: 0,
  activeProjectiles: 0,
  spawnsPerSecond: 0,
  timers: 0,
};
const sameOwner = {
  ownerRelation: "same-owner",
  sourceActorRoles: ["player"],
  targetActorRoles: ["player"],
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
    resources: zeroBudget,
    runtimeLeases: { startLeases: 8, instanceLeases: 0, graphLeases: 0 },
    browserSupport: { desktop: true, touch: true },
    evidence: {
      provenanceId: "tests.runtime-foundation",
      testSuiteId: "modules.runtime-foundation",
    },
    ...overrides,
  };
}

function productionInput(
  manifest: unknown,
  options: Readonly<{
    configurationSchema?: z.ZodType;
    reservationEvaluator?: (configuration: unknown) => unknown;
    bundleText?: string;
    configurationDescriptorSchemaId?: string;
    reservationDescriptor?: unknown;
  }> = {},
): ProductionGameModuleRegistrationInput {
  const parsedManifest = manifest as {
    moduleId: string;
    configurationSchemaId: string;
  };
  const configurationDescriptor = {
    descriptorVersion: "1.0.0",
    schemaId:
      options.configurationDescriptorSchemaId ??
      parsedManifest.configurationSchemaId,
    dialect: "json-schema-2020-12-subset",
    schema: { type: "object", additionalProperties: false },
  } as const;
  const reservationDescriptor =
    options.reservationDescriptor ??
    ({
      descriptorVersion: "1.0.0",
      reservationId: `${parsedManifest.moduleId}.reservation`,
      strategy: "constant",
      fields: [
        { resource: "activeEntities", constant: 0 },
        { resource: "activeProjectiles", constant: 0 },
        { resource: "spawnsPerSecond", constant: 0 },
        { resource: "timers", constant: 0 },
      ],
    } as const);
  const implementationBundle = Buffer.from(
    options.bundleText ?? `${parsedManifest.moduleId}-bundle-v1`,
  );
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
    configurationSchema: options.configurationSchema ?? z.strictObject({}),
    reservationDescriptor,
    reservationEvaluator:
      options.reservationEvaluator ?? (() => ({ ...zeroBudget })),
    implementationBundle,
    dependencyLockIdentity,
    toolchainIdentity,
    expectedArtifact,
  };
}

function registerProduction(
  registry: GameModuleRegistry,
  manifest: unknown,
  options: Parameters<typeof productionInput>[1] = {},
): ArtifactHashDescriptor {
  const input = productionInput(manifest, options);
  registry.registerProduction(input);
  return input.expectedArtifact as ArtifactHashDescriptor;
}

function assembly(
  modules: readonly Readonly<{
    instanceId: string;
    moduleId: string;
    configuration?: unknown;
  }>[],
  bindings: readonly unknown[] = [],
): unknown {
  return {
    schemaVersion: "1.0.0",
    assemblyId: "test.runtime-foundation",
    kernelVersion: "1.0.0",
    engine: { id: "phaser", version: "3.90.0" },
    actors: [{ actorId: "player-one", role: "player" }],
    modules: modules.map((module) => ({
      instanceId: module.instanceId,
      moduleId: module.moduleId,
      versionRange: "1.0.0",
      ownerId: "player-one",
      configuration: module.configuration ?? {},
    })),
    bindings,
    assetRoles: [],
    globalBudget: {
      activeEntities: 100,
      activeProjectiles: 100,
      spawnsPerSecond: 100,
      timers: 100,
    },
  };
}

function resolutionCode(
  assemblyInput: unknown,
  registry: GameModuleRegistry,
): string {
  try {
    resolveGameAssembly(assemblyInput, registry);
    throw new Error("expected resolution failure");
  } catch (error) {
    expect(error).toBeInstanceOf(ModuleResolutionError);
    return (error as ModuleResolutionError).code;
  }
}

function routerCode(action: () => void): string {
  try {
    action();
    throw new Error("expected router failure");
  } catch (error) {
    expect(error).toBeInstanceOf(ModulePortRouterError);
    return (error as ModulePortRouterError).code;
  }
}

describe("exact production module registration", () => {
  it("binds exact descriptors, reviewed bundle identity, and local evaluators", () => {
    const manifest = manifest11("test.production");
    const registry = new GameModuleRegistry();
    const artifact = registerProduction(registry, manifest);
    const registration = registry.findExactProduction(
      "test.production",
      "1.0.0",
      artifact.envelopeSha256,
    );
    expect(registration).toMatchObject({
      registrationKind: "production",
      manifestSha256: artifact.manifestSha256,
      implementationBundle: {
        sha256: artifact.implementationBundleSha256,
      },
    });
    expect(registration?.evaluateResourceReservation({})).toEqual(zeroBudget);
    expect(
      registry.findExactProduction("test.production", "1.0.0", "0".repeat(64)),
    ).toBeUndefined();
  });

  it("rejects descriptor, bundle, and Manifest-generation drift", () => {
    const manifest = manifest11("test.drift");
    const descriptorMismatch = productionInput(manifest, {
      configurationDescriptorSchemaId: "test.other.config",
    });
    expect(() =>
      new GameModuleRegistry().registerProduction(descriptorMismatch),
    ).toThrow(/configuration descriptor mismatch/);

    const bundleMismatch = productionInput(manifest);
    expect(() =>
      new GameModuleRegistry().registerProduction({
        ...bundleMismatch,
        implementationBundle: Buffer.from("tampered-bundle"),
      }),
    ).toThrow(/artifact identity mismatch/);

    expect(() =>
      new GameModuleRegistry().registerProduction({
        ...productionInput(manifest),
        manifest: ContractFixtureManifests[0],
      }),
    ).toThrow();
  });

  it("derives exact grants and rejects asynchronous or over-ceiling evaluators", () => {
    const budgetManifest = manifest11("test.budgeted", {
      resources: { ...zeroBudget, timers: 2 },
    });
    const schema = z.strictObject({ timers: z.number().int().min(0).max(3) });
    const registry = new GameModuleRegistry();
    registerProduction(registry, budgetManifest, {
      configurationSchema: schema,
      reservationEvaluator: (configuration) => ({
        ...zeroBudget,
        timers: (configuration as { timers: number }).timers,
      }),
      reservationDescriptor: {
        descriptorVersion: "1.0.0",
        reservationId: "test.budgeted.reservation",
        strategy: "configuration-fields-v1",
        fields: [{ resource: "timers", configurationField: "timers" }],
      },
    });
    const graph = resolveGameAssembly(
      assembly([
        {
          instanceId: "budgeted",
          moduleId: "test.budgeted",
          configuration: { timers: 2 },
        },
      ]),
      registry,
    );
    expect(graph.modules[0]?.resourceGrant.timers).toBe(2);
    expect(graph.resourceTotals.timers).toBe(2);
    expect(graph.productionInstantiationAllowed).toBe(true);

    expect(
      resolutionCode(
        assembly([
          {
            instanceId: "budgeted",
            moduleId: "test.budgeted",
            configuration: { timers: 3 },
          },
        ]),
        registry,
      ),
    ).toBe(ModuleResolutionErrorCode.invalidResourceReservation);

    const asyncRegistry = new GameModuleRegistry();
    registerProduction(asyncRegistry, manifest11("test.async-reservation"), {
      reservationEvaluator: async () => ({ ...zeroBudget }),
    });
    expect(
      resolutionCode(
        assembly([
          {
            instanceId: "async-reservation",
            moduleId: "test.async-reservation",
          },
        ]),
        asyncRegistry,
      ),
    ).toBe(ModuleResolutionErrorCode.invalidResourceReservation);

    let calls = 0;
    const nondeterministicRegistry = new GameModuleRegistry();
    registerProduction(
      nondeterministicRegistry,
      manifest11("test.nondeterministic-reservation", {
        resources: { ...zeroBudget, timers: 1 },
      }),
      {
        reservationEvaluator: () => ({
          ...zeroBudget,
          timers: calls++ % 2,
        }),
      },
    );
    expect(
      resolutionCode(
        assembly([
          {
            instanceId: "nondeterministic",
            moduleId: "test.nondeterministic-reservation",
          },
        ]),
        nondeterministicRegistry,
      ),
    ).toBe(ModuleResolutionErrorCode.invalidResourceReservation);
  });
});

const providerManifest = manifest11("test.router-provider", {
  outputPorts: [
    {
      id: "a-selection",
      payloadType: "target-selection-v1",
      delivery: "state",
    },
    {
      id: "z-selection",
      payloadType: "target-selection-v1",
      delivery: "state",
    },
    {
      id: "request",
      payloadType: "attack-request-v1",
      delivery: "event",
    },
  ],
});

const consumerManifest = manifest11("test.router-consumer", {
  inputPorts: [
    {
      id: "a-selection",
      payloadType: "target-selection-v1",
      delivery: "state",
      required: true,
      multiple: false,
      authorization: sameOwner,
    },
    {
      id: "z-selection",
      payloadType: "target-selection-v1",
      delivery: "state",
      required: true,
      multiple: false,
      authorization: sameOwner,
    },
    {
      id: "request",
      payloadType: "attack-request-v1",
      delivery: "event",
      required: true,
      multiple: false,
      authorization: sameOwner,
    },
  ],
});

const routerBindings = [
  {
    from: { instanceId: "provider", portId: "a-selection" },
    to: { instanceId: "consumer", portId: "a-selection" },
  },
  {
    from: { instanceId: "provider", portId: "z-selection" },
    to: { instanceId: "consumer", portId: "z-selection" },
  },
  {
    from: { instanceId: "provider", portId: "request" },
    to: { instanceId: "consumer", portId: "request" },
  },
] as const;

function createRouterGraph(): ResolvedModuleGraph {
  const registry = new GameModuleRegistry();
  registerProduction(registry, providerManifest);
  registerProduction(registry, consumerManifest);
  return resolveGameAssembly(
    assembly(
      [
        { instanceId: "provider", moduleId: "test.router-provider" },
        { instanceId: "consumer", moduleId: "test.router-consumer" },
      ],
      routerBindings,
    ),
    registry,
  );
}

function selection(revision: number, x: number, y: number): unknown {
  return {
    revision,
    emittedAtMs: revision,
    kind: "direction",
    direction: { x, y },
  };
}

function request(sequence: number): unknown {
  return {
    sequence,
    emittedAtMs: sequence,
    requestedAtMs: sequence,
    channel: "primary",
  };
}

describe("deterministic state/event port router", () => {
  it("replays state in stable order, delivers running events, and never replays events", () => {
    const router = new DeterministicModulePortRouter(createRouterGraph());
    const deliveries: string[] = [];
    for (const portId of ["a-selection", "z-selection", "request"] as const) {
      router.declareHandler("consumer", portId, (payload, metadata) => {
        expect(Object.isFrozen(payload)).toBe(true);
        deliveries.push(`${portId}:${metadata.replay ? "replay" : "live"}`);
      });
    }
    router.beginInitialization();
    expect(
      routerCode(() => router.emitEvent("provider", "request", request(0))),
    ).toBe(ModulePortRouterErrorCode.invalidPhase);
    router.publishState("provider", "z-selection", selection(0, 0, -1));
    router.publishState("provider", "a-selection", selection(0, 1, 0));
    expect(deliveries).toEqual([]);

    router.activateSubscriptionsAndReplay();
    expect(deliveries).toEqual(["a-selection:replay", "z-selection:replay"]);
    expect(router.snapshot().startLeases).toBe(3);
    router.enterRunning();
    router.emitEvent("provider", "request", request(0));
    router.publishState("provider", "a-selection", selection(1, 0, 1));
    expect(deliveries.slice(-2)).toEqual(["request:live", "a-selection:live"]);

    router.stop();
    expect(router.snapshot().startLeases).toBe(0);
    router.activateSubscriptionsAndReplay();
    expect(deliveries.slice(-2)).toEqual([
      "a-selection:replay",
      "z-selection:replay",
    ]);
    expect(deliveries.filter((entry) => entry === "request:replay")).toEqual(
      [],
    );
    router.enterRunning();
    router.emitEvent("provider", "request", request(1));
    router.stop();
    router.destroy();
    expect(router.snapshot()).toMatchObject({
      phase: "destroyed",
      startLeases: 0,
      graphLeases: 0,
      retainedStatePorts: 0,
      declaredHandlers: 0,
    });
  });

  it("rejects missing handlers, invalid payloads, and non-monotonic counters", () => {
    const missing = new DeterministicModulePortRouter(createRouterGraph());
    missing.declareHandler("consumer", "a-selection", () => undefined);
    expect(routerCode(() => missing.beginInitialization())).toBe(
      ModulePortRouterErrorCode.missingHandler,
    );
    missing.destroy();
    expect(missing.snapshot().graphLeases).toBe(0);

    const router = new DeterministicModulePortRouter(createRouterGraph());
    for (const portId of ["a-selection", "z-selection", "request"] as const) {
      router.declareHandler("consumer", portId, () => undefined);
    }
    router.beginInitialization();
    expect(
      routerCode(() =>
        router.publishState("provider", "a-selection", {
          ...(selection(0, 1, 0) as object),
          unknown: true,
        }),
      ),
    ).toBe(ModulePortRouterErrorCode.invalidPayload);
    router.publishState("provider", "a-selection", selection(0, 1, 0));
    expect(
      routerCode(() =>
        router.publishState("provider", "a-selection", selection(0, 1, 0)),
      ),
    ).toBe(ModulePortRouterErrorCode.nonMonotonicRevision);
    router.publishState("provider", "z-selection", selection(0, 0, -1));
    router.activateSubscriptionsAndReplay();
    router.enterRunning();
    router.emitEvent("provider", "request", request(0));
    expect(
      routerCode(() => router.emitEvent("provider", "request", request(0))),
    ).toBe(ModulePortRouterErrorCode.nonMonotonicSequence);
  });

  it("fails closed on asynchronous replay handlers and releases start leases", () => {
    const router = new DeterministicModulePortRouter(createRouterGraph());
    router.declareHandler("consumer", "a-selection", async () => undefined);
    router.declareHandler("consumer", "z-selection", () => undefined);
    router.declareHandler("consumer", "request", () => undefined);
    router.beginInitialization();
    router.publishState("provider", "a-selection", selection(0, 1, 0));
    expect(routerCode(() => router.activateSubscriptionsAndReplay())).toBe(
      ModulePortRouterErrorCode.asynchronousHandler,
    );
    expect(router.snapshot()).toMatchObject({
      phase: "stopped",
      startLeases: 0,
      graphLeases: 1,
    });
  });

  it("rejects fixture-only graphs and operations outside their lifecycle phase", () => {
    const fixtureGraph = resolveGameAssembly(
      ContractFixtureAssemblies.legacyForward,
      createContractFixtureRegistry(),
    );
    expect(
      routerCode(() => new DeterministicModulePortRouter(fixtureGraph)),
    ).toBe(ModulePortRouterErrorCode.graphNotProduction);

    const router = new DeterministicModulePortRouter(createRouterGraph());
    expect(
      routerCode(() =>
        router.declareHandler("consumer", "not-a-port", () => undefined),
      ),
    ).toBe(ModulePortRouterErrorCode.unknownEndpoint);
    router.declareHandler("consumer", "a-selection", () => undefined);
    expect(
      routerCode(() =>
        router.declareHandler("consumer", "a-selection", () => undefined),
      ),
    ).toBe(ModulePortRouterErrorCode.duplicateHandler);
    for (const portId of ["z-selection", "request"] as const) {
      router.declareHandler("consumer", portId, () => undefined);
    }
    router.beginInitialization();
    router.publishState("provider", "a-selection", selection(0, 1, 0));
    router.publishState("provider", "z-selection", selection(0, 0, -1));
    router.activateSubscriptionsAndReplay();
    router.enterRunning();
    router.stop();
    expect(
      routerCode(() => router.emitEvent("provider", "request", request(0))),
    ).toBe(ModulePortRouterErrorCode.invalidPhase);
  });

  it("rejects subscription activation plans above the consumer lease ceiling", () => {
    const lowLeaseConsumer = manifest11("test.router-low-lease", {
      inputPorts: (consumerManifest as { inputPorts: unknown }).inputPorts,
      runtimeLeases: {
        startLeases: 2,
        instanceLeases: 0,
        graphLeases: 0,
      },
    });
    const registry = new GameModuleRegistry();
    registerProduction(registry, providerManifest);
    registerProduction(registry, lowLeaseConsumer);
    const graph = resolveGameAssembly(
      assembly(
        [
          { instanceId: "provider", moduleId: "test.router-provider" },
          { instanceId: "consumer", moduleId: "test.router-low-lease" },
        ],
        routerBindings,
      ),
      registry,
    );
    expect(routerCode(() => new DeterministicModulePortRouter(graph))).toBe(
      ModulePortRouterErrorCode.leaseCeilingExceeded,
    );
  });
});
