import Phaser from "phaser";

import type { ShooterRuntimeSnapshot } from "../test-bridge.js";
import { registerRuntimeSnapshotReader } from "../test-bridge.js";
import type {
  RuntimeCollisionSource,
  RuntimeDisposer,
  RuntimeEntityPool,
  RuntimeKernel,
  RuntimePointer,
  RuntimeSchedule,
  RuntimeText,
} from "./contracts.js";
import {
  DeterministicRuntimeBudgets,
  DeterministicRuntimeEventBus,
  RuntimeAssetLedger,
} from "./core-services.js";

type ArcadeEntity = Phaser.Physics.Arcade.Sprite;

class PhaserEntityPool<
  TEntity extends ArcadeEntity,
> implements RuntimeEntityPool<TEntity> {
  constructor(
    readonly budgetKey: string,
    private readonly group: Phaser.Physics.Arcade.Group,
    private readonly budgets: DeterministicRuntimeBudgets,
  ) {}

  acquire(x: number, y: number, textureKey: string): TEntity | null {
    const entity = this.group.get(x, y, textureKey) as TEntity | null;
    this.observe();
    return entity;
  }

  create(x: number, y: number, textureKey: string): TEntity {
    const entity = this.group.create(x, y, textureKey) as TEntity;
    this.observe();
    return entity;
  }

  countActive(): number {
    const current = this.group.countActive(true);
    this.budgets.observe(this.budgetKey, current);
    return current;
  }

  forEach(visitor: (entity: TEntity) => void): void {
    this.group.children.each((child) => {
      visitor(child as TEntity);
      return true;
    });
  }

  clear(destroyChildren: boolean): void {
    this.group.clear(true, destroyChildren);
    this.observe();
  }

  nativeGroup(): Phaser.Physics.Arcade.Group {
    return this.group;
  }

  private observe(): void {
    this.budgets.observe(this.budgetKey, this.group.countActive(true));
  }
}

function pointerSnapshot(pointer: Phaser.Input.Pointer): RuntimePointer {
  return Object.freeze({
    id: pointer.id,
    isDown: pointer.isDown,
    worldX: pointer.worldX,
    worldY: pointer.worldY,
  });
}

function collisionSource(
  source: RuntimeCollisionSource<ArcadeEntity>,
): Phaser.Types.Physics.Arcade.ArcadeColliderType {
  if (source instanceof PhaserEntityPool) return source.nativeGroup();
  return source as unknown as Phaser.Types.Physics.Arcade.ArcadeColliderType;
}

function idempotentDisposer(dispose: () => void): RuntimeDisposer {
  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    dispose();
  };
}

export function createPhaserRuntimeKernel(
  scene: Phaser.Scene,
  options: Readonly<{
    budgets: Readonly<Record<string, number>>;
    expectedTextureKeys: readonly string[];
  }>,
): RuntimeKernel<ArcadeEntity, ShooterRuntimeSnapshot> {
  const budgets = new DeterministicRuntimeBudgets(options.budgets);
  const assets = new RuntimeAssetLedger(
    options.expectedTextureKeys,
    (textureKey) => scene.textures.exists(textureKey),
  );
  let cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  let wasd:
    | Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>
    | undefined;
  const schedule = (entry: RuntimeSchedule) => {
    const event = scene.time.addEvent({
      delay: entry.delayMs,
      ...(entry.repeat === undefined ? {} : { repeat: entry.repeat }),
      ...(entry.loop === undefined ? {} : { loop: entry.loop }),
      callback: entry.callback,
    });
    return { cancel: idempotentDisposer(() => event.remove(false)) };
  };
  const createPool = (budgetKey: string) =>
    new PhaserEntityPool(
      budgetKey,
      scene.physics.add.group({
        maxSize: budgets.limitFor(budgetKey),
        allowGravity: false,
      }),
      budgets,
    );
  const invokeOverlap = (
    first: RuntimeCollisionSource<ArcadeEntity>,
    second: RuntimeCollisionSource<ArcadeEntity>,
    callback: (first: ArcadeEntity, second: ArcadeEntity) => void,
  ) => {
    const invoke = (firstObject: unknown, secondObject: unknown) =>
      callback(firstObject as ArcadeEntity, secondObject as ArcadeEntity);
    scene.physics.overlap(
      collisionSource(first),
      collisionSource(second),
      invoke,
    );
  };
  const watchOverlap = (
    first: RuntimeCollisionSource<ArcadeEntity>,
    second: RuntimeCollisionSource<ArcadeEntity>,
    callback: (first: ArcadeEntity, second: ArcadeEntity) => void,
  ): RuntimeDisposer => {
    const invoke = (firstObject: unknown, secondObject: unknown) =>
      callback(firstObject as ArcadeEntity, secondObject as ArcadeEntity);
    const collider = scene.physics.add.overlap(
      collisionSource(first),
      collisionSource(second),
      invoke,
    );
    return idempotentDisposer(() => collider.destroy());
  };
  const registerPointerListener = (
    eventName: "pointerdown" | "pointermove" | "pointerup",
    listener: (pointer: RuntimePointer) => void,
  ): RuntimeDisposer => {
    const invoke = (pointer: Phaser.Input.Pointer) =>
      listener(pointerSnapshot(pointer));
    scene.input.on(eventName, invoke);
    return idempotentDisposer(() => scene.input.off(eventName, invoke));
  };

  return {
    lifecycle: {
      onShutdown: (dispose) => {
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, dispose);
        return idempotentDisposer(() =>
          scene.events.off(Phaser.Scenes.Events.SHUTDOWN, dispose),
        );
      },
      startScene: (sceneKey, data) =>
        scene.scene.start(sceneKey, data as object | undefined),
    },
    clock: { nowMs: () => scene.time.now, schedule },
    entities: {
      createSprite: (x, y, textureKey) =>
        scene.physics.add.sprite(x, y, textureKey),
      createPool,
    },
    input: {
      readDirection: () => {
        const activeCursors = (cursors ??=
          scene.input.keyboard!.createCursorKeys());
        const activeWasd = (wasd ??= scene.input.keyboard!.addKeys({
          up: Phaser.Input.Keyboard.KeyCodes.W,
          down: Phaser.Input.Keyboard.KeyCodes.S,
          left: Phaser.Input.Keyboard.KeyCodes.A,
          right: Phaser.Input.Keyboard.KeyCodes.D,
        }) as Record<
          "up" | "down" | "left" | "right",
          Phaser.Input.Keyboard.Key
        >);
        const x =
          Number(activeCursors.right.isDown || activeWasd.right.isDown) -
          Number(activeCursors.left.isDown || activeWasd.left.isDown);
        const y =
          Number(activeCursors.down.isDown || activeWasd.down.isDown) -
          Number(activeCursors.up.isDown || activeWasd.up.isDown);
        const length = Math.hypot(x, y);
        return length === 0 ? { x: 0, y: 0 } : { x: x / length, y: y / length };
      },
      onPointerDown: (listener) =>
        registerPointerListener("pointerdown", listener),
      onPointerMove: (listener) =>
        registerPointerListener("pointermove", listener),
      onPointerUp: (listener) => registerPointerListener("pointerup", listener),
    },
    rendering: {
      createText: (x, y, text, style) =>
        scene.add.text(x, y, text, style) as RuntimeText,
      shakeCamera: (durationMs, intensity) =>
        scene.cameras.main.shake(durationMs, intensity),
    },
    collisions: {
      watchOverlap,
      overlapNow: (first, second, callback) =>
        invokeOverlap(first, second, callback),
      pause: () => scene.physics.pause(),
    },
    assets,
    events: new DeterministicRuntimeEventBus(),
    budgets,
    observation: { registerReader: registerRuntimeSnapshotReader },
    viewport: {
      width: scene.scale.width,
      height: scene.scale.height,
      clampX: (x) => Phaser.Math.Clamp(x, 0, scene.scale.width),
      clampY: (y) => Phaser.Math.Clamp(y, 0, scene.scale.height),
    },
  };
}
