import { describe, expect, it, vi } from "vitest";

vi.mock("phaser", () => ({
  default: {
    Scenes: { Events: { SHUTDOWN: "shutdown" } },
    Math: {
      Clamp: (value: number, minimum: number, maximum: number) =>
        Math.min(maximum, Math.max(minimum, value)),
    },
  },
}));

import { createPhaserRuntimeKernel } from "../../game-template/vertical-shooter/src/runtime-kernel/phaser-runtime-kernel.js";

type Listener = (...arguments_: unknown[]) => void;

function fakeScene(options: Readonly<{ throwingOff?: boolean }> = {}) {
  const inputListeners = new Map<string, Listener>();
  const sceneListeners = new Map<string, Listener>();
  const groupState = { active: 0 };
  const timerRemove = vi.fn();
  const colliderDestroy = vi.fn();
  const inputOn = vi.fn((event: string, listener: Listener) => {
    inputListeners.set(event, listener);
  });
  const inputOff = vi.fn((event: string, listener: Listener) => {
    if (options.throwingOff) throw new Error("input off failed");
    if (inputListeners.get(event) === listener) inputListeners.delete(event);
  });
  const sceneOnce = vi.fn((event: string, listener: Listener) => {
    sceneListeners.set(event, listener);
  });
  const sceneOff = vi.fn((event: string, listener: Listener) => {
    if (sceneListeners.get(event) === listener) sceneListeners.delete(event);
  });
  const group = {
    get: vi.fn(() => {
      groupState.active += 1;
      return {};
    }),
    create: vi.fn(() => {
      groupState.active += 1;
      return {};
    }),
    countActive: vi.fn(() => groupState.active),
    clear: vi.fn(() => {
      groupState.active = 0;
    }),
    children: { each: vi.fn() },
  };
  const overlap = vi.fn(
    (_first: unknown, _second: unknown, callback: Listener) => {
      overlap.callback = callback;
      return { destroy: colliderDestroy };
    },
  ) as ReturnType<typeof vi.fn> & { callback?: Listener };
  const immediateOverlap = vi.fn();
  const scene = {
    textures: { exists: vi.fn(() => true) },
    time: {
      now: 17,
      addEvent: vi.fn(() => ({ remove: timerRemove })),
    },
    physics: {
      add: {
        group: vi.fn(() => group),
        sprite: vi.fn(() => ({})),
        overlap,
      },
      overlap: immediateOverlap,
      pause: vi.fn(),
    },
    input: {
      on: inputOn,
      off: inputOff,
      keyboard: {
        createCursorKeys: vi.fn(),
        addKeys: vi.fn(),
      },
    },
    events: { once: sceneOnce, off: sceneOff },
    scene: { start: vi.fn() },
    add: { text: vi.fn() },
    cameras: { main: { shake: vi.fn() } },
    scale: { width: 320, height: 640 },
  };
  return {
    scene,
    inputListeners,
    sceneListeners,
    inputOn,
    inputOff,
    sceneOnce,
    sceneOff,
    timerRemove,
    colliderDestroy,
    overlap,
    immediateOverlap,
    group,
  };
}

function kernelFor(fake: ReturnType<typeof fakeScene>) {
  return createPhaserRuntimeKernel(fake.scene as never, {
    budgets: { projectiles: 3 },
    expectedTextureKeys: [],
  });
}

describe("Phaser runtime-kernel cancellation handles", () => {
  it("removes pointer listeners with the exact registered callback once", () => {
    const fake = fakeScene();
    const kernel = kernelFor(fake);
    const received: unknown[] = [];

    for (const [event, register] of [
      ["pointerdown", kernel.input.onPointerDown],
      ["pointermove", kernel.input.onPointerMove],
      ["pointerup", kernel.input.onPointerUp],
    ] as const) {
      const dispose = register((pointer) => received.push(pointer));
      const registered = fake.inputListeners.get(event)!;
      registered({ id: 2, isDown: true, worldX: 10, worldY: 20 });
      dispose();
      dispose();
      expect(fake.inputOff).toHaveBeenCalledWith(event, registered);
      expect(fake.inputListeners.has(event)).toBe(false);
    }

    expect(received).toHaveLength(3);
    expect(received[0]).toEqual({
      id: 2,
      isDown: true,
      worldX: 10,
      worldY: 20,
    });
    expect(Object.isFrozen(received[0])).toBe(true);
    expect(fake.inputOff).toHaveBeenCalledTimes(3);
  });

  it("destroys a watched overlap once while immediate overlap stays one-shot", () => {
    const fake = fakeScene();
    const kernel = kernelFor(fake);
    const first = {} as never;
    const second = {} as never;
    const contacts: unknown[] = [];
    const cancel = kernel.collisions.watchOverlap(
      first,
      second,
      (left, right) => contacts.push(left, right),
    );
    const callback = fake.overlap.callback!;
    callback(first, second);
    cancel();
    cancel();

    expect(contacts).toEqual([first, second]);
    expect(fake.colliderDestroy).toHaveBeenCalledTimes(1);
    kernel.collisions.overlapNow(first, second, () => undefined);
    expect(fake.immediateOverlap).toHaveBeenCalledTimes(1);
  });

  it("cancels timers and shutdown listeners idempotently", () => {
    const fake = fakeScene();
    const kernel = kernelFor(fake);
    const timer = kernel.clock.schedule({
      delayMs: 10,
      callback: () => undefined,
    });
    timer.cancel();
    timer.cancel();
    expect(fake.timerRemove).toHaveBeenCalledTimes(1);
    expect(fake.timerRemove).toHaveBeenCalledWith(false);

    const shutdown = vi.fn();
    const dispose = kernel.lifecycle.onShutdown(shutdown);
    const registered = fake.sceneListeners.get("shutdown");
    expect(registered).toBe(shutdown);
    dispose();
    dispose();
    expect(fake.sceneOff).toHaveBeenCalledTimes(1);
    expect(fake.sceneOff).toHaveBeenCalledWith("shutdown", registered);
    expect(fake.sceneListeners.has("shutdown")).toBe(false);
  });

  it("clears every active pool entity and reports the zero budget count", () => {
    const fake = fakeScene();
    const kernel = kernelFor(fake);
    const pool = kernel.entities.createPool("projectiles");
    pool.acquire(1, 2, "projectile");
    pool.create(3, 4, "projectile");
    expect(pool.countActive()).toBe(2);
    expect(kernel.budgets.snapshot("projectiles").current).toBe(2);

    pool.clear(true);
    expect(pool.countActive()).toBe(0);
    expect(kernel.budgets.snapshot("projectiles")).toMatchObject({
      current: 0,
      peak: 2,
    });
    expect(fake.group.clear).toHaveBeenCalledWith(true, true);
  });

  it("marks a disposer complete before propagating adapter cleanup errors", () => {
    const fake = fakeScene({ throwingOff: true });
    const kernel = kernelFor(fake);
    const dispose = kernel.input.onPointerDown(() => undefined);
    expect(() => dispose()).toThrow("input off failed");
    expect(() => dispose()).not.toThrow();
    expect(fake.inputOff).toHaveBeenCalledTimes(1);
  });
});
