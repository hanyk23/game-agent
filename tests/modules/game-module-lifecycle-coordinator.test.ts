import { describe, expect, it } from "vitest";

import {
  DeterministicGameModuleLifecycleCoordinator,
  GameModuleLifecycleError,
  GameModuleLifecycleErrorCode,
  type GameModuleLifecycleParticipant,
} from "../../src/modules/game-module-lifecycle-coordinator.js";

function participant(
  instanceId: string,
  calls: string[],
  overrides: Partial<GameModuleLifecycleParticipant> = {},
): GameModuleLifecycleParticipant {
  return {
    instanceId,
    initialize: () => calls.push(`initialize:${instanceId}`),
    start: () => calls.push(`start:${instanceId}`),
    stop: () => calls.push(`stop:${instanceId}`),
    dispose: () => calls.push(`dispose:${instanceId}`),
    ...overrides,
  };
}

function lifecycleFailure(action: () => void): GameModuleLifecycleError {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(GameModuleLifecycleError);
    return error as GameModuleLifecycleError;
  }
  throw new Error("expected lifecycle failure");
}

function graph(
  constructionOrder: readonly string[],
  productionInstantiationAllowed = true,
) {
  return { constructionOrder, productionInstantiationAllowed } as const;
}

describe("deterministic game-module lifecycle coordinator", () => {
  it("initializes and starts provider-first, then stops and disposes in reverse order", () => {
    const calls: string[] = [];
    const coordinator = new DeterministicGameModuleLifecycleCoordinator({
      graph: graph(["provider", "middle", "consumer"]),
      participants: [
        participant("consumer", calls),
        participant("provider", calls),
        participant("middle", calls),
      ],
      destroyGraph: () => calls.push("destroy:graph"),
    });

    coordinator.initialize();
    coordinator.start();
    coordinator.stop();
    coordinator.dispose();
    coordinator.destroy();

    expect(calls).toEqual([
      "initialize:provider",
      "initialize:middle",
      "initialize:consumer",
      "start:provider",
      "start:middle",
      "start:consumer",
      "stop:consumer",
      "stop:middle",
      "stop:provider",
      "dispose:consumer",
      "dispose:middle",
      "dispose:provider",
      "destroy:graph",
    ]);
    expect(coordinator.phase).toBe("destroyed");
  });

  it("pauses and resumes the same participants and retained participant state", () => {
    const calls: string[] = [];
    let retainedState = 0;
    const provider = participant("provider", calls, {
      initialize: () => {
        retainedState = 41;
        calls.push("initialize:provider");
      },
      start: () => calls.push(`start:provider:${++retainedState}`),
    });
    const coordinator = new DeterministicGameModuleLifecycleCoordinator({
      graph: graph(["provider"]),
      participants: [provider],
    });

    coordinator.initialize();
    coordinator.start();
    coordinator.stop();
    coordinator.start();

    expect(calls).toEqual([
      "initialize:provider",
      "start:provider:42",
      "stop:provider",
      "start:provider:43",
    ]);
    expect(coordinator.snapshot()).toMatchObject({
      phase: "running",
      initializedParticipantIds: ["provider"],
      startedParticipantIds: ["provider"],
    });
  });

  it("makes disposal terminal and represents a new game with new participants and coordinator", () => {
    const calls: string[] = [];
    const firstParticipant = participant("module", calls);
    const first = new DeterministicGameModuleLifecycleCoordinator({
      graph: graph(["module"]),
      participants: [firstParticipant],
    });
    first.initialize();
    first.dispose();
    expect(lifecycleFailure(() => first.start()).code).toBe(
      GameModuleLifecycleErrorCode.invalidPhase,
    );

    const secondParticipant = participant("module", calls);
    const second = new DeterministicGameModuleLifecycleCoordinator({
      graph: graph(["module"]),
      participants: [secondParticipant],
    });
    second.initialize();
    expect(secondParticipant).not.toBe(firstParticipant);
    expect(second.phase).toBe("initialized");
  });

  it("rolls back every created participant after partial initialization failure", () => {
    const calls: string[] = [];
    const original = new Error("initialize exploded");
    const cleanup = new Error("dispose cleanup exploded");
    const coordinator = new DeterministicGameModuleLifecycleCoordinator({
      graph: graph(["provider", "failing", "unreached"]),
      participants: [
        participant("provider", calls),
        participant("failing", calls, {
          initialize: () => {
            calls.push("initialize:failing");
            throw original;
          },
        }),
        participant("unreached", calls, {
          dispose: () => {
            calls.push("dispose:unreached");
            throw cleanup;
          },
        }),
      ],
      destroyGraph: () => calls.push("destroy:graph"),
    });

    const error = lifecycleFailure(() => coordinator.initialize());
    expect(error.code).toBe(GameModuleLifecycleErrorCode.transitionFailed);
    expect(error.transition).toBe("initialize");
    expect(error.failures.map(({ error: cause }) => cause)).toEqual([
      original,
      cleanup,
    ]);
    expect(calls).toEqual([
      "initialize:provider",
      "initialize:failing",
      "dispose:unreached",
      "dispose:failing",
      "dispose:provider",
      "destroy:graph",
    ]);
    expect(coordinator.phase).toBe("destroyed");
  });

  it("rolls back an attempted failing start, earlier starts, all instances, and the graph", () => {
    const calls: string[] = [];
    const original = new Error("start exploded");
    const stopFailure = new Error("stop exploded");
    const coordinator = new DeterministicGameModuleLifecycleCoordinator({
      graph: graph(["provider", "failing", "unreached"]),
      participants: [
        participant("provider", calls, {
          stop: () => {
            calls.push("stop:provider");
            throw stopFailure;
          },
        }),
        participant("failing", calls, {
          start: () => {
            calls.push("start:failing");
            throw original;
          },
        }),
        participant("unreached", calls),
      ],
      destroyGraph: () => calls.push("destroy:graph"),
    });
    coordinator.initialize();

    const error = lifecycleFailure(() => coordinator.start());
    expect(error.failures.map(({ error: cause }) => cause)).toEqual([
      original,
      stopFailure,
    ]);
    expect(calls.slice(3)).toEqual([
      "start:provider",
      "start:failing",
      "stop:failing",
      "stop:provider",
      "dispose:unreached",
      "dispose:failing",
      "dispose:provider",
      "destroy:graph",
    ]);
    expect(coordinator.phase).toBe("destroyed");
  });

  it("continues reverse stop and dispose cleanup after exceptions", () => {
    const calls: string[] = [];
    const stopFailure = new Error("middle stop");
    const disposeFailure = new Error("consumer dispose");
    const coordinator = new DeterministicGameModuleLifecycleCoordinator({
      graph: graph(["provider", "middle", "consumer"]),
      participants: [
        participant("provider", calls),
        participant("middle", calls, {
          stop: () => {
            calls.push("stop:middle");
            throw stopFailure;
          },
        }),
        participant("consumer", calls, {
          dispose: () => {
            calls.push("dispose:consumer");
            throw disposeFailure;
          },
        }),
      ],
    });
    coordinator.initialize();
    coordinator.start();

    const stopError = lifecycleFailure(() => coordinator.stop());
    expect(stopError.failures[0]?.error).toBe(stopFailure);
    expect(coordinator.phase).toBe("failed");
    expect(lifecycleFailure(() => coordinator.start()).code).toBe(
      GameModuleLifecycleErrorCode.invalidPhase,
    );
    const disposeError = lifecycleFailure(() => coordinator.dispose());
    expect(disposeError.failures[0]?.error).toBe(disposeFailure);
    expect(calls.slice(-6)).toEqual([
      "stop:consumer",
      "stop:middle",
      "stop:provider",
      "dispose:consumer",
      "dispose:middle",
      "dispose:provider",
    ]);
    expect(coordinator.phase).toBe("disposed");
  });

  it("exposes ordered synchronous boundaries for router and lease assertions", () => {
    const calls: string[] = [];
    const coordinator = new DeterministicGameModuleLifecycleCoordinator({
      graph: graph(["module"]),
      participants: [participant("module", calls)],
      boundaries: {
        beforeInitialize: () => calls.push("boundary:before-initialize"),
        afterInitialize: () => calls.push("boundary:after-initialize"),
        beforeStart: () => calls.push("boundary:before-start"),
        afterStart: () => calls.push("boundary:after-start"),
        beforeStop: () => calls.push("boundary:before-stop"),
        afterStop: ({ phase }) => calls.push(`boundary:after-stop:${phase}`),
        afterDispose: ({ phase }) =>
          calls.push(`boundary:after-dispose:${phase}`),
        afterDestroy: ({ phase }) =>
          calls.push(`boundary:after-destroy:${phase}`),
      },
      destroyGraph: () => calls.push("destroy:graph"),
    });
    coordinator.initialize();
    coordinator.start();
    coordinator.stop();
    coordinator.dispose();
    coordinator.destroy();

    expect(calls).toEqual([
      "boundary:before-initialize",
      "initialize:module",
      "boundary:after-initialize",
      "boundary:before-start",
      "start:module",
      "boundary:after-start",
      "boundary:before-stop",
      "stop:module",
      "boundary:after-stop:stopped",
      "dispose:module",
      "boundary:after-dispose:disposed",
      "destroy:graph",
      "boundary:after-destroy:destroyed",
    ]);
  });

  it("rejects thenables from participant, graph, and boundary hooks synchronously", () => {
    const asyncParticipant = new DeterministicGameModuleLifecycleCoordinator({
      graph: graph(["module"]),
      participants: [
        participant("module", [], { initialize: () => Promise.resolve() }),
      ],
    });
    const participantError = lifecycleFailure(() =>
      asyncParticipant.initialize(),
    );
    expect(
      (participantError.failures[0]?.error as GameModuleLifecycleError).code,
    ).toBe(GameModuleLifecycleErrorCode.asynchronousHook);

    const asyncBoundary = new DeterministicGameModuleLifecycleCoordinator({
      graph: graph([]),
      participants: [],
      boundaries: { beforeInitialize: () => Promise.resolve() },
    });
    const boundaryError = lifecycleFailure(() => asyncBoundary.initialize());
    expect(
      (boundaryError.failures[0]?.error as GameModuleLifecycleError).code,
    ).toBe(GameModuleLifecycleErrorCode.asynchronousHook);

    const asyncDestroy = new DeterministicGameModuleLifecycleCoordinator({
      graph: graph([]),
      participants: [],
      destroyGraph: () => Promise.resolve(),
    });
    asyncDestroy.dispose();
    const destroyError = lifecycleFailure(() => asyncDestroy.destroy());
    expect(
      (destroyError.failures[0]?.error as GameModuleLifecycleError).code,
    ).toBe(GameModuleLifecycleErrorCode.asynchronousHook);
    expect(asyncDestroy.phase).toBe("destroyed");
  });

  it("rejects duplicate definitions, missing order members, repeated calls, and illegal phases", () => {
    const fixtureCalls: string[] = [];
    const fixtureOnly = lifecycleFailure(
      () =>
        new DeterministicGameModuleLifecycleCoordinator({
          graph: graph(["module"], false),
          participants: [participant("module", fixtureCalls)],
        }),
    );
    expect(fixtureOnly.code).toBe(
      GameModuleLifecycleErrorCode.invalidDefinition,
    );
    expect(fixtureCalls).toEqual([]);

    const duplicate = lifecycleFailure(
      () =>
        new DeterministicGameModuleLifecycleCoordinator({
          graph: graph(["module"]),
          participants: [{ instanceId: "module" }, { instanceId: "module" }],
        }),
    );
    expect(duplicate.code).toBe(GameModuleLifecycleErrorCode.invalidDefinition);
    expect(
      lifecycleFailure(
        () =>
          new DeterministicGameModuleLifecycleCoordinator({
            graph: graph([]),
            participants: [{ instanceId: "extra" }],
          }),
      ).code,
    ).toBe(GameModuleLifecycleErrorCode.invalidDefinition);

    const coordinator = new DeterministicGameModuleLifecycleCoordinator({
      graph: graph([]),
      participants: [],
    });
    expect(lifecycleFailure(() => coordinator.start()).code).toBe(
      GameModuleLifecycleErrorCode.invalidPhase,
    );
    coordinator.initialize();
    expect(lifecycleFailure(() => coordinator.initialize()).code).toBe(
      GameModuleLifecycleErrorCode.invalidPhase,
    );
    coordinator.start();
    expect(lifecycleFailure(() => coordinator.dispose()).code).toBe(
      GameModuleLifecycleErrorCode.invalidPhase,
    );
    coordinator.stop();
    expect(lifecycleFailure(() => coordinator.stop()).code).toBe(
      GameModuleLifecycleErrorCode.invalidPhase,
    );
  });
});
