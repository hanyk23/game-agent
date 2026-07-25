import Phaser from "phaser";

import { catalogSelections } from "../runtime-assets.js";
import { demoRuntimeConfig } from "../runtime-config.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload(): void {
    const queued = new Set<string>();
    for (const selected of catalogSelections(demoRuntimeConfig)) {
      if (queued.has(selected.textureKey)) continue;
      this.load.image(selected.textureKey, selected.runtimeUrl);
      queued.add(selected.textureKey);
    }
  }

  create(): void {
    if (demoRuntimeConfig.resolvedAssets.mode === "legacy-geometric") {
      this.createCircleTexture("player", 18, 0xf4f7ff);
      this.createCircleTexture("player-bullet", 5, 0x9cecff);
      this.createCircleTexture("enemy", 16, 0xff6b81);
      this.createCircleTexture("enemy-bullet", 7, 0xffffff);
      this.createCircleTexture("pickup", 11, 0x66ff99);
      this.createCircleTexture("boss", 34, 0x384462);
    }
    this.scene.start("start");
  }

  private createCircleTexture(
    key: string,
    radius: number,
    color: number,
  ): void {
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(color, 1);
    graphics.fillCircle(radius, radius, radius);
    graphics.generateTexture(key, radius * 2, radius * 2);
    graphics.destroy();
  }
}
