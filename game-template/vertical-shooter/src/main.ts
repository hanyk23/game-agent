import Phaser from "phaser";

import { demoRuntimeConfig } from "./runtime-config.js";
import { BootScene } from "./scenes/boot-scene.js";
import { EndScene } from "./scenes/end-scene.js";
import { PlayScene } from "./scenes/play-scene.js";
import { StartScene } from "./scenes/start-scene.js";
import { installReadOnlyTestBridge } from "./test-bridge.js";
import {
  GAME_MODULE_RUNTIME_FACTORY_REGISTRY_KEY,
  gameModuleRuntimeFoundation,
} from "./runtime-kernel/game-module-runtime.js";

installReadOnlyTestBridge();

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game-root",
  width: demoRuntimeConfig.viewport.logicalWidth,
  height: demoRuntimeConfig.viewport.logicalHeight,
  backgroundColor: "#07111f",
  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 2,
  },
  callbacks: {
    postBoot: (game) =>
      game.registry.set(
        GAME_MODULE_RUNTIME_FACTORY_REGISTRY_KEY,
        gameModuleRuntimeFoundation,
      ),
  },
  scene: [BootScene, StartScene, PlayScene, EndScene],
});
