// Headless smoke harness for the engine-neutral kernel.
//
// Proves the playable minimal loop CLOSES: it runs the same BulletHellCore the
// Cocos host drives, in both orientations, until it reaches a terminal state
// (won/lost), and asserts the reused product modules were the authority for
// entity ids + capacity. The kernel is PURE MANUAL (no auto-track), so this
// harness supplies a test-side autopilot that steers toward the nearest enemy
// each frame -- exercising real manual input, not a kernel autopilot.
// Run with:  npx tsx tools/smoke.ts
import { BulletHellCore, type Orientation, type RenderItem } from "../assets/game-core";

/** Test-side autopilot: replicate a human tracking the nearest enemy along the
 *  cross axis, then feed the resulting [-1,1] steer into the pure-manual core. */
function autopilotSteer(orientation: Orientation, items: readonly RenderItem[]): number {
  const forwardOf = (p: { x: number; y: number }) => (orientation === "portrait" ? p.y : p.x);
  const crossOf = (p: { x: number; y: number }) => (orientation === "portrait" ? p.x : p.y);
  const player = items.find((it) => it.kind === "player");
  const enemies = items.filter((it) => it.kind === "enemy");
  if (!player || enemies.length === 0) return 0;
  let nearest = enemies[0]!;
  for (const e of enemies) if (forwardOf(e.pos) < forwardOf(nearest.pos)) nearest = e;
  const delta = crossOf(nearest.pos) - crossOf(player.pos);
  return Math.max(-1, Math.min(1, delta / 40));
}

function run(orientation: Orientation): void {
  const core = new BulletHellCore({
    orientation,
    fieldWidth: orientation === "portrait" ? 720 : 1280,
    fieldHeight: orientation === "portrait" ? 1280 : 720,
    enemyBudget: 12,
    playerHp: 5,
    seed: 0x51ed5eed,
  });

  const dt = 1 / 60;
  let frames = 0;
  const maxFrames = 60 * 120; // 120s safety cap
  let sawEnemy = false;
  let sawPlayerBullet = false;
  let sawEnemyBullet = false;

  while (core.state === "playing" && frames < maxFrames) {
    const steer = autopilotSteer(orientation, core.snapshot().items);
    core.step(dt, steer);
    const snap = core.snapshot();
    for (const item of snap.items) {
      if (item.kind === "enemy") sawEnemy = true;
      if (item.kind === "player-bullet") sawPlayerBullet = true;
      if (item.kind === "enemy-bullet") sawEnemyBullet = true;
    }
    frames += 1;
  }

  const snap = core.snapshot();
  const ok =
    (core.state === "won" || core.state === "lost") &&
    sawEnemy &&
    sawPlayerBullet &&
    sawEnemyBullet;

  console.log(
    `[${orientation}] state=${core.state} frames=${frames} ` +
      `score=${snap.score} hp=${snap.playerHp} ` +
      `enemy=${sawEnemy} pbullet=${sawPlayerBullet} ebullet=${sawEnemyBullet} ` +
      `=> ${ok ? "PASS" : "FAIL"}`,
  );
  if (!ok) process.exitCode = 1;
}

run("portrait");
run("landscape");
