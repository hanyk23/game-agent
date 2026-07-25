import Phaser from "phaser";

import { addRuntimeBackground } from "../runtime-assets.js";
import { demoRuntimeConfig } from "../runtime-config.js";
import {
  registerRuntimeSnapshotReader,
  type ScoringExecutionSnapshot,
} from "../test-bridge.js";
import type { GameOutcomeReason } from "../../../../src/gameplay/game-outcome.js";

export type EndSceneData = {
  won: boolean;
  outcomeReason: GameOutcomeReason;
  elapsedMs: number;
  score: number;
  scoring: ScoringExecutionSnapshot;
};

export class EndScene extends Phaser.Scene {
  constructor() {
    super("end");
  }

  create(data: EndSceneData): void {
    const removeSnapshotReader = registerRuntimeSnapshotReader(() => ({
      scene: "end",
      won: data.won,
      outcomeReason: data.outcomeReason,
      elapsedMs: data.elapsedMs,
      score: data.score,
      scoring: data.scoring,
    }));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, removeSnapshotReader);
    const { width, height } = this.scale;
    addRuntimeBackground(this, demoRuntimeConfig);
    this.add
      .text(width / 2, height * 0.38, data.won ? "任务完成" : "任务失败", {
        color: data.won ? "#8ff0b3" : "#ff8798",
        fontFamily: "system-ui, sans-serif",
        fontSize: "42px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height * 0.52, `得分 ${data.score}`, {
        color: "#f4f7ff",
        fontFamily: "system-ui, sans-serif",
        fontSize: "28px",
      })
      .setOrigin(0.5);
    const restart = this.add
      .text(width / 2, height * 0.68, "重新开始", {
        backgroundColor: "#2f6fed",
        color: "#ffffff",
        fontFamily: "system-ui, sans-serif",
        fontSize: "26px",
        padding: { x: 28, y: 14 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    restart.once("pointerup", () => this.scene.start("play"));
    this.input.keyboard?.once("keydown-ENTER", () => this.scene.start("play"));
  }
}
