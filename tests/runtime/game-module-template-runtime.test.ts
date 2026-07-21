import { describe, expect, it, vi } from "vitest";

import { ownTemplateGameModuleExecution } from "../../game-template/vertical-shooter/src/runtime-kernel/game-module-runtime.js";

function fixture(
  failures: Readonly<{ dispose?: Error; destroy?: Error }> = {},
) {
  const calls: string[] = [];
  let shutdown: (() => void) | undefined;
  const remove = vi.fn(() => {
    shutdown = undefined;
  });
  const execution = {
    initialize: () => calls.push("initialize"),
    start: () => calls.push("start"),
    stop: () => calls.push("stop"),
    dispose: () => {
      calls.push("dispose");
      if (failures.dispose !== undefined) throw failures.dispose;
    },
    destroy: () => {
      calls.push("destroy");
      if (failures.destroy !== undefined) throw failures.destroy;
    },
  };
  const runtime = ownTemplateGameModuleExecution(execution, {
    onShutdown: (listener) => {
      shutdown = listener;
      return remove;
    },
    startScene: () => undefined,
  });
  return { calls, runtime, remove, triggerShutdown: () => shutdown?.() };
}

describe("template game-module lifecycle owner", () => {
  it("preserves pause/resume and performs terminal scene cleanup once", () => {
    const { runtime, calls, triggerShutdown } = fixture();
    runtime.initialize();
    runtime.start();
    runtime.stop();
    runtime.start();
    triggerShutdown();
    runtime.dispose();
    runtime.destroy();
    expect(calls).toEqual([
      "initialize",
      "start",
      "stop",
      "start",
      "dispose",
      "destroy",
    ]);
  });

  it("removes the scene hook on explicit disposal and creates fresh owners", () => {
    const first = fixture();
    first.runtime.dispose();
    first.runtime.destroy();
    first.triggerShutdown();
    expect(first.remove).toHaveBeenCalledTimes(1);
    expect(first.calls).toEqual(["dispose", "destroy"]);

    const second = fixture();
    second.runtime.initialize();
    second.runtime.start();
    expect(second.calls).toEqual(["initialize", "start"]);
    expect(second.runtime).not.toBe(first.runtime);
  });

  it("continues destruction and preserves dispose plus destroy failures", () => {
    const disposeFailure = new Error("dispose failed");
    const destroyFailure = new Error("destroy failed");
    const { runtime, calls } = fixture({
      dispose: disposeFailure,
      destroy: destroyFailure,
    });
    let thrown: unknown;
    try {
      runtime.destroy();
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(AggregateError);
    expect((thrown as AggregateError).errors).toEqual([
      disposeFailure,
      destroyFailure,
    ]);
    expect(calls).toEqual(["dispose", "destroy"]);
  });
});
