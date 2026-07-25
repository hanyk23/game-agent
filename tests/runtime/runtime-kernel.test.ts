import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  DeterministicRuntimeBudgets,
  DeterministicRuntimeEventBus,
  RuntimeAssetLedger,
} from "../../game-template/vertical-shooter/src/runtime-kernel/core-services.js";

describe("thin runtime kernel core services", () => {
  it("delivers declared events synchronously and supports disposal", () => {
    type Events = { hit: Readonly<{ damage: number }> };
    const bus = new DeterministicRuntimeEventBus<Events>();
    const damage: number[] = [];
    const dispose = bus.on("hit", (event) => damage.push(event.damage));

    bus.emit("hit", { damage: 2 });
    dispose();
    bus.emit("hit", { damage: 4 });

    expect(damage).toEqual([2]);
  });

  it("fails closed for unknown, invalid, and exceeded budgets", () => {
    const budgets = new DeterministicRuntimeBudgets({ enemies: 3 });
    budgets.observe("enemies", 2);
    budgets.observe("enemies", 1);

    expect(budgets.snapshot("enemies")).toEqual({
      limit: 3,
      current: 1,
      peak: 2,
    });
    expect(() => budgets.observe("enemies", 4)).toThrow(
      "Runtime budget exceeded",
    );
    expect(() => budgets.limitFor("missing")).toThrow("Unknown runtime budget");
  });

  it("reports immutable asset observation without admitting unknown keys", () => {
    const assets = new RuntimeAssetLedger(
      ["b", "a", "a"],
      (key) => key === "a",
    );
    assets.markUsed("b");
    assets.markUsed("unknown");

    const snapshot = assets.snapshot();
    expect(snapshot).toEqual({
      expectedTextureKeys: ["b", "a"],
      loadedTextureKeys: ["a"],
      usedTextureKeys: ["b"],
    });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.usedTextureKeys)).toBe(true);
  });

  it("keeps the legacy play scene behind the runtime service seam", async () => {
    const source = await readFile(
      "game-template/vertical-shooter/src/scenes/play-scene.ts",
      "utf8",
    );
    const bypasses = [
      "this.time",
      "this.input",
      "this.physics",
      "this.add",
      "this.scale",
      "this.events",
      "this.scene",
      "this.cameras",
      "this.textures",
    ];

    for (const bypass of bypasses) expect(source).not.toContain(bypass);
    expect(source).toContain("createPhaserRuntimeKernel(this");
  });
});
