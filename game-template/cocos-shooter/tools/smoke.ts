// Minimal smoke for the Cocos template.
// Only asserts: BulletHellCore instantiates without throwing and snapshot()
// returns a valid structure after N steps. It deliberately contains NO gameplay
// assertions (no enemy/bullet probes) — those belong to generated content and
// are exercised by the golden sample's smoke, not this skeleton.
// Run with:  npx tsx tools/smoke.ts
import {
  BulletHellCore,
  type Orientation,
  type GameState,
} from "../assets/game-core";

function run(orientation: Orientation): void {
  const core = new BulletHellCore({
    orientation,
    fieldWidth: orientation === "portrait" ? 720 : 1280,
    fieldHeight: orientation === "portrait" ? 1280 : 720,
  });
  core.autoStep(60);
  const snap = core.snapshot();

  const validStates: readonly GameState[] = ["playing", "won", "lost"];
  const ok =
    validStates.includes(snap.state) &&
    typeof snap.score === "number" &&
    typeof snap.playerHp === "number";
  if (!ok) {
    console.log(`[${orientation}] smoke FAIL: invalid snapshot`);
    process.exit(1);
  }

  console.log(
    `[${orientation}] state=${snap.state} score=${snap.score} hp=${snap.playerHp} => PASS`,
  );
}

run("portrait");
run("landscape");
console.log("smoke_exit=0");
process.exit(0);
