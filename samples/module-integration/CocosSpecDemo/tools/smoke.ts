// Headless full-chain smoke harness for the Module Integration Sanity (方案 B).
//
// Proves the WHOLE data path CLOSES with no engine present, running the REAL
// composer in Node (where zod + node:crypto exist — see GAP-1):
//
//   valid-spec.json
//     -> composeRuntimeConfig(json)                              [chain/compose]
//          == composeShooterGame(parseShooterGameSpec(json), …)  [runtime]
//        -> RuntimeGameConfig
//           -> SpecDemoCore drives the six gameplay planners + two contract
//              modules for BOTH orientations until a terminal state.
//
// It asserts the criterion-B evidence is actually produced at runtime:
//   * combo >= 2 reached at least once      (scoring-state)
//   * a pickup effect applied at least once  (pickup-planner)
//   * a graze scored at least once           (scoring-state)
//   * schedule.bossStartMs > 0 was consumed  (composer -> core boss window)
//   * resourceBudget.maxEnemyBullets bit as the active cap at least once
//                                            (bullet-pattern-planner drop)
//
// The core is pure-manual (no auto-track); this harness supplies a test-side
// autopilot (dodge nearest bullet, otherwise divert to a pickup / farm the
// nearest enemy) so the run exercises real input, not a kernel autopilot.
//
// Run with:  npx tsx tools/smoke.ts
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  SpecDemoCore,
  type Orientation,
  type RenderItem,
} from "../assets/game-core";
import { composeRuntimeConfigFromFile } from "../chain/compose";
import type { RuntimeGameConfig } from "../chain/runtime/runtime-game-config";

const HERE = dirname(fileURLToPath(import.meta.url));
const SPEC_PATH = resolve(HERE, "../assets/spec/valid-spec.json");
// THE mandated entry point, executed in Node: valid-spec.json -> composeShooterGame.
const RUNTIME_CONFIG: RuntimeGameConfig =
  composeRuntimeConfigFromFile(SPEC_PATH);

const crossOf = (o: Orientation, p: { x: number; y: number }): number =>
  o === "portrait" ? p.x : p.y;
const fwdOf = (o: Orientation, p: { x: number; y: number }): number =>
  o === "portrait" ? p.y : p.x;

/** Test-side autopilot: dodge the nearest incoming enemy bullet along the cross
 *  axis; when the lane is clear, divert toward a pickup (to trigger a pickup
 *  effect) or shadow the nearest enemy (to farm kills for combos). Returns a
 *  [-1, 1] steer fed into the pure-manual core. */
function autopilotSteer(
  o: Orientation,
  player: RenderItem,
  items: readonly RenderItem[],
): number {
  const px = crossOf(o, player.pos);
  const pf = fwdOf(o, player.pos);

  let threat: { dist: number; cross: number } | null = null;
  for (const b of items) {
    if (b.kind !== "enemy-bullet") continue;
    const df = fwdOf(o, b.pos) - pf;
    const dc = crossOf(o, b.pos) - px;
    const dist = Math.hypot(df, dc);
    if (dist < 120 && (threat === null || dist < threat.dist)) {
      threat = { dist, cross: crossOf(o, b.pos) };
    }
  }
  if (threat !== null) return px < threat.cross ? -1 : 1;

  const pickup = items.find((it) => it.kind === "pickup");
  const foes = items.filter((it) => it.kind === "enemy" || it.kind === "boss");
  const target = pickup ?? foes[0];
  if (target === undefined) return 0;
  const delta = crossOf(o, target.pos) - px;
  return Math.max(-1, Math.min(1, delta / 30));
}

type RunResult = Readonly<{ ok: boolean }>;

function run(orientation: Orientation): RunResult {
  const core = new SpecDemoCore({
    orientation,
    runtimeConfig: RUNTIME_CONFIG,
    seed: 0x51ed5eed,
  });

  const [bossStart, roundLimit] = core.bossWindow();
  console.log(
    `[${orientation}] scheduled boss window: [${bossStart},${roundLimit}]ms`,
  );

  const dt = 1 / 60;
  let frames = 0;
  const maxFrames = 60 * 240; // 240s safety cap
  let sawEnemy = false;
  let sawPlayerBullet = false;
  let sawEnemyBullet = false;

  while (core.state === "playing" && frames < maxFrames) {
    const items = core.snapshot().items;
    const player = items.find((it) => it.kind === "player")!;
    core.step(dt, autopilotSteer(orientation, player, items));
    for (const item of items) {
      if (item.kind === "enemy" || item.kind === "boss") sawEnemy = true;
      if (item.kind === "player-bullet") sawPlayerBullet = true;
      if (item.kind === "enemy-bullet") sawEnemyBullet = true;
    }
    frames += 1;
  }

  const s = core.stats();
  console.log(`[${orientation}] budget cap hit: ${s.budgetCapHits} 次`);

  const terminal = core.state === "won" || core.state === "lost";
  const checks: Array<[string, boolean]> = [
    ["terminal", terminal],
    ["sawEnemy", sawEnemy],
    ["sawPlayerBullet", sawPlayerBullet],
    ["sawEnemyBullet", sawEnemyBullet],
    ["combo>=2 (>=1 buildup)", s.comboBuildups >= 1],
    ["pickup applied (>=1)", s.pickupsApplied >= 1],
    ["graze (>=1)", s.grazeCount >= 1],
    ["bossStartMs>0 consumed", s.bossWindowConsumed && s.bossStartMs > 0],
    ["budget cap hit (>=1)", s.budgetCapHits >= 1],
  ];
  const ok = checks.every(([, pass]) => pass);

  console.log(
    `[${orientation}] state=${core.state} reason=${s.finalReason} ` +
      `frames=${frames} elapsedMs=${s.elapsedMs} score=${s.finalScore} ` +
      `profile=${s.resourceProfile} assets=${s.resolvedAssetsMode}`,
  );
  console.log(
    `[${orientation}] stats: maxCombo=${s.maxComboMultiplier} ` +
      `comboBuildups=${s.comboBuildups} pickups=${s.pickupsApplied} ` +
      `graze=${s.grazeCount} shieldAbsorb=${s.shieldAbsorbEvents} ` +
      `capHits=${s.budgetCapHits} maxEnemyBullets=${s.maxEnemyBullets} ` +
      `maxPlayerBullets=${s.maxPlayerBullets}`,
  );
  for (const [name, pass] of checks) {
    if (!pass) console.log(`[${orientation}] MISSING: ${name}`);
  }
  console.log(`[${orientation}] => ${ok ? "PASS" : "FAIL"}`);
  return { ok };
}

const portrait = run("portrait");
const landscape = run("landscape");
const allOk = portrait.ok && landscape.ok;
console.log(`smoke_exit=${allOk ? 0 : 1}`);
if (!allOk) process.exitCode = 1;
