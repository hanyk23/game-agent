// Ahead-of-time materializer: runs the REAL composer in Node and writes the
// resulting RuntimeGameConfig to a JSON the Cocos host loads at runtime.
//
// This exists because composeShooterGame cannot run in-engine (GAP-1). The
// output is a plain data artifact — the engine-neutral kernel (game-core.ts)
// consumes it identically to how it consumes the live composer output in
// tools/smoke.ts, so "host does not bypass the composer" still holds: the numbers
// are the composer's, only the execution site is Node.
//
// Run with:  npx tsx tools/build-runtime-config.ts
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { composeRuntimeConfigFromFile } from "../chain/compose.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const SPEC = resolve(HERE, "../assets/spec/valid-spec.json");
const OUT = resolve(HERE, "../assets/resources/config/runtime-config.json");

const config = composeRuntimeConfigFromFile(SPEC);
const json = JSON.stringify(config, null, 2) + "\n";
writeFileSync(OUT, json);

console.log(`composed RuntimeGameConfig -> ${OUT}`);
console.log(
  `schedule.bossStartMs=${config.schedule.bossStartMs} ` +
    `schedule.roundTimeLimitMs=${config.schedule.roundTimeLimitMs} ` +
    `resourceBudget.maxEnemyBullets=${config.resourceBudget.maxEnemyBullets} ` +
    `resolvedAssets.mode=${config.resolvedAssets.mode} ` +
    `composition.resourceProfile=${config.composition.resourceProfile}`,
);
