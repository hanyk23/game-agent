import { describe, expect, it } from "vitest";

import {
  GraphExecutionHarnessError,
  GraphExecutionHarnessErrorCode,
} from "../../src/modules/game-module-graph-execution-harness.js";
import { DeterministicGameModuleProductionInstantiator } from "../../src/modules/game-module-production-instantiator.js";
import {
  GameModuleLifecycleError,
  GameModuleLifecycleErrorCode,
} from "../../src/modules/game-module-lifecycle-coordinator.js";
import { GameModuleRegistry } from "../../src/modules/game-module-registry.js";
import { resolveGameAssembly } from "../../src/modules/game-module-resolver.js";
import type { GameModuleFactoryContext } from "../../src/modules/game-module-runtime-factory.js";
import {
  createUnavailableRuntimeServiceHost,
  type GameModuleRuntimeServiceHost,
  type GameModuleRuntimeServiceScopeEvidence,
  type GameModuleScopedRuntimeServices,
} from "../../src/modules/game-module-runtime-services.js";
import {
  assembly11,
  manifest11,
  registerExecutable,
} from "./game-module-execution-test-helpers.js";

const validServices = createUnavailableRuntimeServiceHost().createScope(
  {} as GameModuleRuntimeServiceScopeEvidence,
);

function failure(action: () => unknown): GraphExecutionHarnessError {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(GraphExecutionHarnessError);
    return error as GraphExecutionHarnessError;
  }
  throw new Error("expected production instantiation failure");
}

function nestedHarnessCode(
  error: GraphExecutionHarnessError,
): string | undefined {
  return (error.failures[0]?.error as GraphExecutionHarnessError | undefined)
    ?.code;
}

function lifecycleFailure(action: () => unknown): GameModuleLifecycleError {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(GameModuleLifecycleError);
    return error as GameModuleLifecycleError;
  }
  throw new Error("expected lifecycle failure");
}

function createHost(
  calls: string[],
  scopeFactory: (
    evidence: GameModuleRuntimeServiceScopeEvidence,
  ) => unknown = () => validServices,
): GameModuleRuntimeServiceHost {
  return {
    createScope: (evidence) => {
      calls.push(`scope:${evidence.instanceId}`);
      return scopeFactory(evidence) as GameModuleScopedRuntimeServices;
    },
    revoke: (instanceId, scope) => {
      calls.push(`revoke:${scope}:${instanceId}`);
    },
    destroy: () => {
      calls.push("destroy:services");
    },
  };
}

function createFoundation(
  calls: string[],
  contexts: GameModuleFactoryContext[] = [],
) {
  const providerManifest = manifest11("test.production-provider", {
    outputPorts: [
      {
        id: "projectiles",
        payloadType: "entity-channel-v1",
        delivery: "state",
        entityRole: "friendly-projectile",
      },
    ],
    ownedEntityChannels: [
      {
        channelId: "projectiles",
        outputPort: "projectiles",
        capacity: {
          kind: "constant",
          value: 0,
          resources: ["activeEntities", "activeProjectiles"],
        },
      },
    ],
    runtimeLeases: { startLeases: 1, instanceLeases: 2, graphLeases: 1 },
  });
  const consumerManifest = manifest11("test.production-consumer", {
    dependencies: [
      {
        moduleId: "test.production-provider",
        versionRange: "1.0.0",
        optional: false,
      },
    ],
  });
  const registry = new GameModuleRegistry();
  registerExecutable(registry, providerManifest, {
    runtimeLeaseKeys: {
      start: ["update"],
      instance: ["state"],
      graph: ["budget"],
    },
    create: (context) => {
      calls.push("factory:provider");
      contexts.push(context);
      context.leases.acquire("graph", "budget");
      return {
        initialize: () => {
          calls.push("initialize:provider");
          context.leases.acquire("instance", "state");
        },
        start: () => {
          calls.push("start:provider");
          context.leases.acquire("start", "update");
        },
        stop: () => calls.push("stop:provider"),
        dispose: () => calls.push("dispose:provider"),
      };
    },
  });
  registerExecutable(registry, consumerManifest, {
    create: (context) => {
      calls.push("factory:consumer");
      contexts.push(context);
      return {
        initialize: () => calls.push("initialize:consumer"),
        start: () => calls.push("start:consumer"),
        stop: () => calls.push("stop:consumer"),
        dispose: () => calls.push("dispose:consumer"),
      };
    },
  });
  const graph = resolveGameAssembly(
    assembly11(
      [
        { instanceId: "consumer", moduleId: "test.production-consumer" },
        { instanceId: "provider", moduleId: "test.production-provider" },
      ],
      [],
      {
        assetRoles: [
          {
            roleId: "projectile.sprite",
            category: "projectile",
            requiredByInstanceIds: ["provider"],
          },
        ],
      },
    ),
    registry,
  );
  return { graph, registry };
}

describe("deterministic production module instantiator", () => {
  it("derives frozen scopes from Graph 1.1 and coordinates full lifecycle in stable order", () => {
    const calls: string[] = [];
    const contexts: GameModuleFactoryContext[] = [];
    const evidence: GameModuleRuntimeServiceScopeEvidence[] = [];
    const { graph, registry } = createFoundation(calls, contexts);
    const host = createHost(calls, (scopeEvidence) => {
      expect(Object.isFrozen(scopeEvidence)).toBe(true);
      evidence.push(scopeEvidence);
      return validServices;
    });

    const instance = DeterministicGameModuleProductionInstantiator.create({
      graph,
      registry,
      serviceHost: host,
    });
    expect(calls).toEqual([
      "scope:provider",
      "factory:provider",
      "scope:consumer",
      "factory:consumer",
    ]);
    expect(contexts.map((context) => context.services)).toEqual([
      validServices,
      validServices,
    ]);
    expect(evidence).toEqual([
      expect.objectContaining({
        instanceId: "provider",
        ownerId: "player-one",
        moduleId: "test.production-provider",
        assetRoleIds: ["projectile.sprite"],
        ownedChannelIds: ["provider.projectiles"],
        readableChannelIds: [],
        mutationGrantIds: [],
      }),
      expect.objectContaining({
        instanceId: "consumer",
        assetRoleIds: [],
        ownedChannelIds: [],
        readableChannelIds: [],
        mutationGrantIds: [],
      }),
    ]);
    expect(graph.entityChannels.map(({ channelId }) => channelId)).toEqual([
      "provider.projectiles",
    ]);

    instance.initialize();
    instance.start();
    expect(calls.slice(-4)).toEqual([
      "initialize:provider",
      "initialize:consumer",
      "start:provider",
      "start:consumer",
    ]);
    instance.stop();
    expect(calls.slice(-4)).toEqual([
      "stop:consumer",
      "stop:provider",
      "revoke:start:consumer",
      "revoke:start:provider",
    ]);
    expect(instance.snapshot().leaseCounts).toEqual({
      start: 0,
      instance: 2,
      graph: 1,
    });

    instance.start();
    instance.stop();
    expect(calls.filter((entry) => entry.startsWith("scope:"))).toEqual([
      "scope:provider",
      "scope:consumer",
    ]);
    expect(calls.filter((entry) => entry === "start:provider")).toHaveLength(2);
    instance.dispose();
    expect(calls.slice(-4)).toEqual([
      "dispose:consumer",
      "dispose:provider",
      "revoke:instance:consumer",
      "revoke:instance:provider",
    ]);
    expect(instance.snapshot()).toMatchObject({
      lifecyclePhase: "disposed",
      leaseCounts: { start: 0, instance: 0, graph: 1 },
      activeEntities: 0,
    });
    instance.destroy();
    expect(calls.at(-1)).toBe("destroy:services");
    expect(instance.lifecycle.phase).toBe("destroyed");
    expect(instance.router.snapshot()).toMatchObject({
      phase: "destroyed",
      startLeases: 0,
      graphLeases: 0,
    });
  });

  it("creates new service scopes and participants for a new game instance", () => {
    const calls: string[] = [];
    const contexts: GameModuleFactoryContext[] = [];
    const { graph, registry } = createFoundation(calls, contexts);
    const first = DeterministicGameModuleProductionInstantiator.create({
      graph,
      registry,
      serviceHost: createHost(calls),
    });
    first.initialize();
    first.dispose();
    first.destroy();
    const second = DeterministicGameModuleProductionInstantiator.create({
      graph,
      registry,
      serviceHost: createHost(calls),
    });
    second.initialize();

    expect(contexts).toHaveLength(4);
    expect(contexts[0]).not.toBe(contexts[2]);
    expect(calls.filter((entry) => entry === "scope:provider")).toHaveLength(2);
  });

  it("ignores caller-supplied authority and constructs entity authority only from the graph", () => {
    const calls: string[] = [];
    const { graph, registry } = createFoundation(calls);
    const options = {
      graph,
      registry,
      serviceHost: createHost(calls),
      entityChannels: [{ channelId: "attacker.injected", capacity: 10_000 }],
      mutationGrants: [{ grantId: "attacker.grant" }],
    };

    const instance =
      DeterministicGameModuleProductionInstantiator.create(options);
    expect(instance.graph.entityChannels).toBe(graph.entityChannels);
    expect(instance.graph.entityMutationGrants).toBe(
      graph.entityMutationGrants,
    );
    expect(
      instance.graph.entityChannels.some(
        ({ channelId }) => channelId === "attacker.injected",
      ),
    ).toBe(false);
    instance.dispose();
    instance.destroy();
  });

  it.each([
    {
      label: "throwing",
      scopeFactory: () => {
        throw new Error("scope exploded");
      },
      code: GraphExecutionHarnessErrorCode.serviceScopeFailed,
    },
    {
      label: "asynchronous",
      scopeFactory: () => Promise.resolve(validServices),
      code: GraphExecutionHarnessErrorCode.asynchronousServiceScope,
    },
    {
      label: "shape-drifting",
      scopeFactory: () => ({}),
      code: GraphExecutionHarnessErrorCode.invalidServiceScope,
    },
  ])(
    "rejects and rolls back $label service scopes",
    ({ scopeFactory, code }) => {
      const calls: string[] = [];
      const { graph, registry } = createFoundation(calls);
      const error = failure(() =>
        DeterministicGameModuleProductionInstantiator.create({
          graph,
          registry,
          serviceHost: createHost(calls, scopeFactory),
        }),
      );

      expect(error.code).toBe(GraphExecutionHarnessErrorCode.factoryFailed);
      expect(nestedHarnessCode(error)).toBe(code);
      expect(calls).toContain("destroy:services");
    },
  );

  it("reverses scope revocation and participant cleanup after partial factory failure", () => {
    const calls: string[] = [];
    const { graph, registry } = createFoundation(calls);
    let scopeCount = 0;
    const host = createHost(calls, () => {
      scopeCount += 1;
      if (scopeCount === 2) throw new Error("consumer scope failed");
      return validServices;
    });

    const error = failure(() =>
      DeterministicGameModuleProductionInstantiator.create({
        graph,
        registry,
        serviceHost: host,
      }),
    );
    expect(error.code).toBe(GraphExecutionHarnessErrorCode.factoryFailed);
    expect(calls.slice(-6)).toEqual([
      "dispose:provider",
      "revoke:start:consumer",
      "revoke:instance:consumer",
      "revoke:start:provider",
      "revoke:instance:provider",
      "destroy:services",
    ]);
  });

  it.each([
    {
      label: "throwing",
      result: () => {
        throw new Error("revoke exploded");
      },
    },
    { label: "asynchronous", result: () => Promise.resolve() },
  ])(
    "collects $label start-scope revocation failure after reverse stop",
    ({ result }) => {
      const calls: string[] = [];
      const { graph, registry } = createFoundation(calls);
      const base = createHost(calls);
      const host: GameModuleRuntimeServiceHost = {
        ...base,
        revoke: (instanceId, scope) => {
          calls.push(`revoke:${scope}:${instanceId}`);
          if (scope === "start" && instanceId === "consumer") {
            return result();
          }
        },
      };
      const instance = DeterministicGameModuleProductionInstantiator.create({
        graph,
        registry,
        serviceHost: host,
      });
      instance.initialize();
      instance.start();

      const error = lifecycleFailure(() => instance.stop());
      expect(error.code).toBe(GameModuleLifecycleErrorCode.transitionFailed);
      expect(instance.lifecycle.phase).toBe("failed");
      expect(calls.slice(-4)).toEqual([
        "stop:consumer",
        "stop:provider",
        "revoke:start:consumer",
        "revoke:start:provider",
      ]);
    },
  );

  it.each([
    {
      label: "throwing",
      result: () => {
        throw new Error("destroy exploded");
      },
    },
    { label: "asynchronous", result: () => Promise.resolve() },
  ])(
    "collects $label service-host destruction while destroying remaining infrastructure",
    ({ result }) => {
      const calls: string[] = [];
      const { graph, registry } = createFoundation(calls);
      const base = createHost(calls);
      const host: GameModuleRuntimeServiceHost = {
        ...base,
        destroy: () => {
          calls.push("destroy:services");
          return result();
        },
      };
      const instance = DeterministicGameModuleProductionInstantiator.create({
        graph,
        registry,
        serviceHost: host,
      });
      instance.dispose();

      const error = lifecycleFailure(() => instance.destroy());
      expect(error.code).toBe(GameModuleLifecycleErrorCode.transitionFailed);
      expect(instance.lifecycle.phase).toBe("destroyed");
      expect(instance.router.snapshot()).toMatchObject({
        phase: "destroyed",
        startLeases: 0,
        graphLeases: 0,
      });
    },
  );
});
