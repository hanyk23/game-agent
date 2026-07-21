import type { RuntimeGameConfig } from "../../../src/runtime/runtime-game-config.js";
import { parseRuntimeGameConfig } from "./runtime-assets.js";

import generatedRuntimeConfig from "./generated/runtime-config.json" with { type: "json" };

export const demoRuntimeConfig: RuntimeGameConfig = parseRuntimeGameConfig(
  generatedRuntimeConfig,
);
