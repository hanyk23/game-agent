import Phaser from "phaser";

import { addRuntimeBackground } from "../runtime-assets.js";
import { demoRuntimeConfig } from "../runtime-config.js";
import { registerRuntimeSnapshotReader } from "../test-bridge.js";

export class StartScene extends Phaser.Scene {
  constructor() {
    super("start");
  }

  create(): void {
    const removeSnapshotReader = registerRuntimeSnapshotReader(() => ({
      scene: "start",
    }));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, removeSnapshotReader);
    const { width, height } = this.scale;
    addRuntimeBackground(this, demoRuntimeConfig);
    this.add
      .text(width / 2, height * 0.34, demoRuntimeConfig.title, {
        color: "#f4f7ff",
        fontFamily: "system-ui, sans-serif",
        fontSize: "38px",
        fontStyle: "bold",
        align: "center",
      })
      .setOrigin(0.5);
    this.add
      .text(
        width / 2,
        height * 0.53,
        "方向键 / WASD 移动\n触屏拖动移动\n自动射击",
        {
          color: "#b9c8e6",
          fontFamily: "system-ui, sans-serif",
          fontSize: "22px",
          align: "center",
          lineSpacing: 10,
        },
      )
      .setOrigin(0.5);
    const start = this.add
      .text(width / 2, height * 0.72, "开始", {
        backgroundColor: "#2f6fed",
        color: "#ffffff",
        fontFamily: "system-ui, sans-serif",
        fontSize: "28px",
        padding: { x: 34, y: 16 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    start.once("pointerup", () => this.scene.start("play"));
    this.input.keyboard?.once("keydown-ENTER", () => this.scene.start("play"));
  }
}
