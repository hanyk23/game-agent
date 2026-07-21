import { describe, expect, it } from "vitest";

import {
  DeterministicGameModuleGraphExecutionHarness,
  GraphExecutionHarnessError,
  GraphExecutionHarnessErrorCode,
} from "../../src/modules/game-module-graph-execution-harness.js";
import {
  LogicalEntityDirectoryError,
  LogicalEntityDirectoryErrorCode,
} from "../../src/modules/game-module-entity-directory.js";
import {
  GameModuleLeaseLedgerError,
  GameModuleLeaseLedgerErrorCode,
} from "../../src/modules/game-module-lease-ledger.js";
import {
  GameModuleLifecycleError,
  GameModuleLifecycleErrorCode,
} from "../../src/modules/game-module-lifecycle-coordinator.js";
import {
  GameModuleRegistry,
  type RegisteredGameModule,
} from "../../src/modules/game-module-registry.js";
import { resolveGameAssembly } from "../../src/modules/game-module-resolver.js";
import type { GameModuleFactoryContext } from "../../src/modules/game-module-runtime-factory.js";
import {
  assembly11,
  manifest11,
  registerExecutable,
} from "./game-module-execution-test-helpers.js";

const sameOwner = {
  ownerRelation: "same-owner",
  sourceActorRoles: ["player"],
  targetActorRoles: ["player"],
  sourceEntityRoles: [],
} as const;

const providerManifest = manifest11("test.harness-provider", {
  outputPorts: [
    {
      id: "selection",
      payloadType: "target-selection-v1",
      delivery: "state",
    },
    {
      id: "request",
      payloadType: "attack-request-v1",
      delivery: "event",
    },
    {
      id: "entities",
      payloadType: "entity-channel-v1",
      delivery: "state",
      entityRole: "friendly-projectile",
    },
  ],
  ownedEntityChannels: [
    {
      channelId: "projectiles",
      outputPort: "entities",
      capacity: {
        kind: "constant",
        value: 1,
        resources: ["activeEntities"],
      },
    },
  ],
  resources: {
    activeEntities: 1,
    activeProjectiles: 0,
    spawnsPerSecond: 0,
    timers: 0,
  },
  runtimeLeases: { startLeases: 1, instanceLeases: 1, graphLeases: 1 },
});

const consumerManifest = manifest11("test.harness-consumer", {
  dependencies: [
    {
      moduleId: "test.harness-provider",
      versionRange: "1.0.0",
      optional: false,
    },
  ],
  inputPorts: [
    {
      id: "selection",
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
    {
      id: "entities",
      payloadType: "entity-channel-v1",
      delivery: "state",
      required: true,
      multiple: false,
      authorization: {
        ...sameOwner,
        sourceEntityRoles: ["friendly-projectile"],
      },
    },
  ],
  runtimeLeases: { startLeases: 3, instanceLeases: 0, graphLeases: 0 },
});

const bindings = [
  {
    from: { instanceId: "provider", portId: "selection" },
    to: { instanceId: "consumer", portId: "selection" },
  },
  {
    from: { instanceId: "provider", portId: "request" },
    to: { instanceId: "consumer", portId: "request" },
  },
  {
    from: { instanceId: "provider", portId: "entities" },
    to: { instanceId: "consumer", portId: "entities" },
  },
] as const;

function selection(revision: number): unknown {
  return {
    revision,
    emittedAtMs: revision,
    kind: "direction",
    direction: { x: 0, y: -1 },
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

function harnessError(action: () => unknown): GraphExecutionHarnessError {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(GraphExecutionHarnessError);
    return error as GraphExecutionHarnessError;
  }
  throw new Error("expected graph execution harness failure");
}

function lifecycleError(action: () => unknown): GameModuleLifecycleError {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(GameModuleLifecycleError);
    return error as GameModuleLifecycleError;
  }
  throw new Error("expected lifecycle failure");
}

function createGraph(registry: GameModuleRegistry) {
  return resolveGameAssembly(
    assembly11(
      [
        { instanceId: "consumer", moduleId: "test.harness-consumer" },
        { instanceId: "provider", moduleId: "test.harness-provider" },
      ],
      bindings,
    ),
    registry,
  );
}

describe("fake-only Graph 1.1 execution harness", () => {
  it("coordinates factories, ports, leases, entities, pause/resume, and zero-residue destruction", () => {
    const calls: string[] = [];
    let providerContext: GameModuleFactoryContext | undefined;
    const registry = new GameModuleRegistry();
    registerExecutable(registry, providerManifest, {
      runtimeLeaseKeys: {
        start: ["update"],
        instance: [],
        graph: ["shared-budget"],
      },
      create: (context) => {
        calls.push("factory:provider");
        providerContext = context;
        context.leases.acquire("graph", "shared-budget");
        return {
          initialize: () => {
            calls.push("initialize:provider");
            context.entities.activate(
              "provider.projectiles",
              "projectile-one",
              0,
            );
            context.ports.publishState("selection", selection(0));
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
        context.ports.declareHandler("selection", (_payload, metadata) =>
          calls.push(`selection:${metadata.replay ? "replay" : "live"}`),
        );
        context.ports.declareHandler("request", (_payload, metadata) =>
          calls.push(`request:${metadata.replay ? "replay" : "live"}`),
        );
        context.ports.declareHandler("entities", () => undefined);
        return {
          initialize: () => calls.push("initialize:consumer"),
          start: () => calls.push("start:consumer"),
          stop: () => calls.push("stop:consumer"),
          dispose: () => calls.push("dispose:consumer"),
        };
      },
    });
    const graph = createGraph(registry);
    expect(graph.constructionOrder).toEqual(["provider", "consumer"]);
    const harness = DeterministicGameModuleGraphExecutionHarness.create({
      graph,
      registry,
    });
    expect(calls).toEqual(["factory:provider", "factory:consumer"]);
    expect(harness.snapshot().leaseCounts).toEqual({
      start: 0,
      instance: 1,
      graph: 1,
    });

    harness.initialize();
    expect(harness.snapshot()).toMatchObject({
      lifecyclePhase: "initialized",
      leaseCounts: { start: 0, instance: 1, graph: 1 },
      activeEntities: 1,
    });
    harness.start();
    providerContext!.ports.emitEvent("request", request(0));
    expect(calls.slice(2)).toEqual([
      "initialize:provider",
      "initialize:consumer",
      "selection:replay",
      "start:provider",
      "start:consumer",
      "request:live",
    ]);
    expect(harness.snapshot().leaseCounts).toEqual({
      start: 1,
      instance: 1,
      graph: 1,
    });

    harness.stop();
    expect(calls.slice(-2)).toEqual(["stop:consumer", "stop:provider"]);
    expect(harness.snapshot()).toMatchObject({
      lifecyclePhase: "stopped",
      leaseCounts: { start: 0, instance: 1, graph: 1 },
      activeEntities: 1,
    });
    harness.start();
    providerContext!.ports.emitEvent("request", request(1));
    expect(calls.slice(-4)).toEqual([
      "selection:replay",
      "start:provider",
      "start:consumer",
      "request:live",
    ]);
    harness.stop();
    harness.dispose();
    expect(calls.slice(-4)).toEqual([
      "stop:consumer",
      "stop:provider",
      "dispose:consumer",
      "dispose:provider",
    ]);
    expect(harness.snapshot()).toMatchObject({
      lifecyclePhase: "disposed",
      router: { phase: "stopped", startLeases: 0, graphLeases: 1 },
      leaseCounts: { start: 0, instance: 0, graph: 1 },
      activeEntities: 0,
    });
    expect(lifecycleError(() => harness.start()).code).toBe(
      GameModuleLifecycleErrorCode.invalidPhase,
    );

    harness.destroy();
    expect(harness.lifecycle.phase).toBe("destroyed");
    expect(harness.router.snapshot()).toMatchObject({
      phase: "destroyed",
      startLeases: 0,
      graphLeases: 0,
      retainedStatePorts: 0,
      declaredHandlers: 0,
    });
    expect(() => harness.leases.snapshot()).toThrowError(
      expect.objectContaining({
        code: GameModuleLeaseLedgerErrorCode.destroyed,
      }),
    );
    expect(() => harness.entities.snapshot()).toThrowError(
      expect.objectContaining({
        code: LogicalEntityDirectoryErrorCode.destroyed,
      }),
    );
  });

  it("uses a new harness and new participants for a new game after disposal", () => {
    const participants: object[] = [];
    const registry = new GameModuleRegistry();
    registerExecutable(registry, manifest11("test.new-game"), {
      create: () => {
        const state = { initializeCount: 0 };
        participants.push(state);
        return {
          initialize: () => {
            state.initializeCount += 1;
          },
        };
      },
    });
    const graph = resolveGameAssembly(
      assembly11([{ instanceId: "game", moduleId: "test.new-game" }]),
      registry,
    );

    const first = DeterministicGameModuleGraphExecutionHarness.create({
      graph,
      registry,
    });
    first.initialize();
    first.dispose();
    first.destroy();
    const second = DeterministicGameModuleGraphExecutionHarness.create({
      graph,
      registry,
    });
    second.initialize();

    expect(participants).toHaveLength(2);
    expect(participants[0]).not.toBe(participants[1]);
    expect(participants).toEqual([
      { initializeCount: 1 },
      { initializeCount: 1 },
    ]);
  });

  it.each([
    {
      label: "throwing",
      create: () => {
        throw new Error("factory exploded");
      },
      nestedCode: GraphExecutionHarnessErrorCode.factoryFailed,
    },
    {
      label: "asynchronous",
      create: () => Promise.resolve({}),
      nestedCode: GraphExecutionHarnessErrorCode.asynchronousFactory,
    },
  ])("rolls back $label factory failure", ({ create, nestedCode }) => {
    const calls: string[] = [];
    const registry = new GameModuleRegistry();
    const first = manifest11("test.factory-first", {
      runtimeLeases: { startLeases: 0, instanceLeases: 0, graphLeases: 1 },
    });
    const failing = manifest11("test.factory-failing", {
      dependencies: [
        {
          moduleId: "test.factory-first",
          versionRange: "1.0.0",
          optional: false,
        },
      ],
    });
    registerExecutable(registry, first, {
      runtimeLeaseKeys: { start: [], instance: [], graph: ["host"] },
      create: (context) => {
        calls.push("factory:first");
        context.leases.acquire("graph", "host");
        return { dispose: () => calls.push("dispose:first") };
      },
    });
    registerExecutable(registry, failing, { create });
    const graph = resolveGameAssembly(
      assembly11([
        { instanceId: "first", moduleId: "test.factory-first" },
        { instanceId: "failing", moduleId: "test.factory-failing" },
      ]),
      registry,
    );

    const error = harnessError(() =>
      DeterministicGameModuleGraphExecutionHarness.create({ graph, registry }),
    );
    expect(error.code).toBe(GraphExecutionHarnessErrorCode.factoryFailed);
    expect((error.failures[0]?.error as GraphExecutionHarnessError).code).toBe(
      nestedCode,
    );
    expect(calls).toEqual(["factory:first", "dispose:first"]);
  });

  it.each([
    {
      label: "throwing",
      start: () => {
        throw new Error("start exploded");
      },
    },
    { label: "asynchronous", start: () => Promise.resolve() },
  ])(
    "rolls back $label start failure through graph destruction",
    ({ start }) => {
      const calls: string[] = [];
      const registry = new GameModuleRegistry();
      const manifest = manifest11("test.start-failure", {
        runtimeLeases: { startLeases: 1, instanceLeases: 1, graphLeases: 1 },
      });
      registerExecutable(registry, manifest, {
        runtimeLeaseKeys: {
          start: ["update"],
          instance: ["state"],
          graph: ["host"],
        },
        create: (context) => {
          context.leases.acquire("graph", "host");
          return {
            initialize: () => context.leases.acquire("instance", "state"),
            start: () => {
              context.leases.acquire("start", "update");
              return start();
            },
            stop: () => calls.push("stop"),
            dispose: () => calls.push("dispose"),
          };
        },
      });
      const graph = resolveGameAssembly(
        assembly11([{ instanceId: "failing", moduleId: "test.start-failure" }]),
        registry,
      );
      const harness = DeterministicGameModuleGraphExecutionHarness.create({
        graph,
        registry,
      });
      harness.initialize();

      const error = lifecycleError(() => harness.start());
      expect(error.code).toBe(GameModuleLifecycleErrorCode.transitionFailed);
      expect(error.transition).toBe("start");
      expect(calls).toEqual(["stop", "dispose"]);
      expect(harness.lifecycle.phase).toBe("destroyed");
      expect(harness.router.snapshot().phase).toBe("destroyed");
      expect(() => harness.leases.snapshot()).toThrow(
        GameModuleLeaseLedgerError,
      );
      expect(() => harness.entities.snapshot()).toThrow(
        LogicalEntityDirectoryError,
      );
    },
  );

  it("rejects a resolved production registration with no execution export", () => {
    const source = new GameModuleRegistry();
    const manifest = manifest11("test.missing-export");
    registerExecutable(source, manifest, { create: () => ({}) });
    const graph = resolveGameAssembly(
      assembly11([{ instanceId: "missing", moduleId: "test.missing-export" }]),
      source,
    );
    class MissingExportRegistry extends GameModuleRegistry {
      override findExactProduction(
        moduleId: string,
        version: string,
        envelopeSha256: string,
      ): RegisteredGameModule | undefined {
        const registration = source.findExactProduction(
          moduleId,
          version,
          envelopeSha256,
        );
        if (registration === undefined) return undefined;
        const { executionExports: _executionExports, ...withoutExport } =
          registration;
        return Object.freeze(withoutExport);
      }
    }

    const error = harnessError(() =>
      DeterministicGameModuleGraphExecutionHarness.create({
        graph,
        registry: new MissingExportRegistry(),
      }),
    );
    expect(error.code).toBe(
      GraphExecutionHarnessErrorCode.missingExecutionExport,
    );
    expect(error.message).toContain("missing");
  });

  it("rejects module start keys plus router subscriptions one over the shared ceiling", () => {
    const registry = new GameModuleRegistry();
    registerExecutable(registry, providerManifest, { create: () => ({}) });
    registerExecutable(registry, consumerManifest, {
      runtimeLeaseKeys: {
        start: ["timer"],
        instance: [],
        graph: [],
      },
      create: () => ({}),
    });
    const graph = createGraph(registry);
    const error = harnessError(() =>
      DeterministicGameModuleGraphExecutionHarness.create({ graph, registry }),
    );
    expect(error.code).toBe(
      GraphExecutionHarnessErrorCode.registrationMismatch,
    );
    expect(error.message).toContain("above ceiling 3");
  });
});
