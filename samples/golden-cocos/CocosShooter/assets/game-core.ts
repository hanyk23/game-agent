// Engine-neutral bullet-hell kernel for the Cocos golden sample (Round A).
//
// This file imports NOTHING from `cc` / Phaser / DOM. It is pure TypeScript
// logic that drives a minimal single-player bullet-hell loop (player, enemies,
// player fire, enemy bullet fire, circle collision, win/lose outcome).
//
// It REUSES two real, engine-neutral product modules verbatim (byte-identical
// copies of src/modules/*, see assets/modules/PROVENANCE.md):
//   - SafeMonotonicCounterV1              (ADR 0027 safe-monotonic-v1)
//       -> mints unique, strictly-increasing logical entity ids.
//   - DeterministicLogicalEntityDirectory (Batch 3 logical entity directory)
//       -> enforces per-channel active-entity capacity + generation lineage,
//          i.e. the product's bounded-resource contract for live entities.
//
// The Cocos adapter (cocos-host.ts) owns rendering/input; this kernel owns the
// simulation. Orientation is a parameter (never hardcoded vertical): the caller
// passes `orientation` and the kernel maps a logical "forward" axis onto it.

import { SafeMonotonicCounterV1 } from "./modules/game-module-safe-counter";
import {
  DeterministicLogicalEntityDirectory,
  type LogicalEntityChannelDeclaration,
  type LogicalEntityReference,
} from "./modules/game-module-entity-directory";

export type Orientation = "portrait" | "landscape";

export type Vec2 = { x: number; y: number };

export type RenderKind = "player" | "enemy" | "player-bullet" | "enemy-bullet";

export type RenderItem = Readonly<{
  kind: RenderKind;
  pos: Vec2;
  radius: number;
}>;

export type GameState = "playing" | "won" | "lost";

export type CoreSnapshot = Readonly<{
  state: GameState;
  score: number;
  playerHp: number;
  enemiesRemaining: number;
  activeBullets: number;
  items: readonly RenderItem[];
}>;

export type CoreConfig = Readonly<{
  orientation: Orientation;
  // Logical field extents in the same units the host renders in.
  fieldWidth: number;
  fieldHeight: number;
  // Total enemies that must be cleared to win.
  enemyBudget?: number;
  // Player hit points before losing.
  playerHp?: number;
  // Deterministic seed so a fixed run is reproducible.
  seed?: number;
}>;

// -- deterministic PRNG (mulberry32) so headless runs are reproducible --------
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Channel identifiers (must satisfy the directory's id grammar).
const OWNER = "core-host";
const CH_ENEMY = "enemies";
const CH_PLAYER_BULLET = "player-bullets";
const CH_ENEMY_BULLET = "enemy-bullets";

const CAP_ENEMY = 12;
const CAP_PLAYER_BULLET = 48;
const CAP_ENEMY_BULLET = 96;

type Mover = {
  id: string;
  ref: LogicalEntityReference;
  channelId: string;
  pos: Vec2;
  vel: Vec2;
  radius: number;
  fireCooldown: number;
};

function len(v: Vec2): number {
  return Math.hypot(v.x, v.y);
}

export class BulletHellCore {
  readonly #orientation: Orientation;
  readonly #fieldW: number;
  readonly #fieldH: number;
  readonly #enemyBudget: number;
  readonly #rng: () => number;

  // Reused product modules -----------------------------------------------
  readonly #ids: SafeMonotonicCounterV1;
  readonly #directory: DeterministicLogicalEntityDirectory;

  // Forward axis derived from orientation (never hardcoded vertical).
  readonly #forward: Vec2;
  readonly #cross: Vec2;

  #state: GameState = "playing";
  #score = 0;
  #playerHp: number;
  #time = 0;

  #player: Vec2;
  #playerRadius = 14;
  #playerFireCooldown = 0;

  #enemies: Mover[] = [];
  #playerBullets: Mover[] = [];
  #enemyBullets: Mover[] = [];

  #enemiesSpawned = 0;
  #enemiesKilled = 0;
  #enemySpawnCooldown = 0;

  constructor(config: CoreConfig) {
    this.#orientation = config.orientation;
    this.#fieldW = config.fieldWidth;
    this.#fieldH = config.fieldHeight;
    this.#enemyBudget = config.enemyBudget ?? 12;
    this.#playerHp = config.playerHp ?? 5;
    this.#rng = makeRng(config.seed ?? 0x9e3779b9);

    // Forward = toward the enemy side. Portrait: up (+y). Landscape: right (+x).
    if (this.#orientation === "portrait") {
      this.#forward = { x: 0, y: 1 };
      this.#cross = { x: 1, y: 0 };
    } else {
      this.#forward = { x: 1, y: 0 };
      this.#cross = { x: 0, y: 1 };
    }

    // Player starts on the near edge, centered on the cross axis.
    this.#player = this.#composePos(this.#playerRadius + 24, this.#crossCenter());

    this.#ids = new SafeMonotonicCounterV1("golden-cocos-entities");
    const channels: LogicalEntityChannelDeclaration[] = [
      this.#channel(CH_ENEMY, "enemy", CAP_ENEMY),
      this.#channel(CH_PLAYER_BULLET, "playerbullet", CAP_PLAYER_BULLET),
      this.#channel(CH_ENEMY_BULLET, "enemybullet", CAP_ENEMY_BULLET),
    ];
    this.#directory = new DeterministicLogicalEntityDirectory(channels, []);
  }

  get orientation(): Orientation {
    return this.#orientation;
  }

  // -- axis helpers: map (forward, cross) scalars onto (x, y) ----------------
  #composePos(forward: number, cross: number): Vec2 {
    return {
      x: this.#forward.x * forward + this.#cross.x * cross,
      y: this.#forward.y * forward + this.#cross.y * cross,
    };
  }

  #forwardOf(p: Vec2): number {
    return p.x * this.#forward.x + p.y * this.#forward.y;
  }

  #crossOf(p: Vec2): number {
    return p.x * this.#cross.x + p.y * this.#cross.y;
  }

  #forwardExtent(): number {
    return this.#orientation === "portrait" ? this.#fieldH : this.#fieldW;
  }

  #crossExtent(): number {
    return this.#orientation === "portrait" ? this.#fieldW : this.#fieldH;
  }

  #crossCenter(): number {
    return this.#crossExtent() / 2;
  }

  #channel(
    channelId: string,
    role: string,
    capacity: number,
  ): LogicalEntityChannelDeclaration {
    return {
      channelId,
      ownerInstanceId: OWNER,
      ownerActorId: OWNER,
      entityRole: role,
      capacity,
      readerInstanceIds: [],
    };
  }

  // Attempt to reserve a live-entity slot through the reused directory.
  // Returns the reference on success, or null when the channel is at capacity
  // (the product's bounded-resource contract, honored here verbatim).
  #tryActivate(channelId: string): LogicalEntityReference | null {
    const entityId = `e-${this.#ids.allocate()}`;
    try {
      return this.#directory.activate(OWNER, channelId, entityId, 0);
    } catch {
      return null;
    }
  }

  #recycle(ref: LogicalEntityReference): void {
    this.#directory.recycle(OWNER, ref);
  }

  // -- public API ------------------------------------------------------------

  /** Advance the simulation by dt seconds. `crossInput` in [-1, 1] steers the
   *  player along the cross axis (0 = hold still; pure manual, no auto-track). */
  step(dt: number, crossInput = 0): void {
    if (this.#state !== "playing") return;
    this.#time += dt;

    this.#updatePlayer(dt, crossInput);
    this.#spawnEnemies(dt);
    this.#updateEnemies(dt);
    this.#updateBullets(dt);
    this.#resolveCollisions();
    this.#evaluateOutcome();
  }

  snapshot(): CoreSnapshot {
    const items: RenderItem[] = [];
    items.push({ kind: "player", pos: { ...this.#player }, radius: this.#playerRadius });
    for (const e of this.#enemies)
      items.push({ kind: "enemy", pos: { ...e.pos }, radius: e.radius });
    for (const b of this.#playerBullets)
      items.push({ kind: "player-bullet", pos: { ...b.pos }, radius: b.radius });
    for (const b of this.#enemyBullets)
      items.push({ kind: "enemy-bullet", pos: { ...b.pos }, radius: b.radius });
    return Object.freeze({
      state: this.#state,
      score: this.#score,
      playerHp: this.#playerHp,
      enemiesRemaining: this.#enemyBudget - this.#enemiesKilled,
      activeBullets: this.#playerBullets.length + this.#enemyBullets.length,
      items: Object.freeze(items),
    });
  }

  get state(): GameState {
    return this.#state;
  }

  // -- simulation internals --------------------------------------------------

  #updatePlayer(dt: number, crossInput: number): void {
    // Pure manual control: the player only moves while an input axis is held.
    // Releasing the key stops the player (no auto-tracking). Steering is clamped
    // to [-1, 1] so callers (host keyboard / smoke harness) drive it directly.
    const steer = Math.max(-1, Math.min(1, crossInput));
    const speed = 260;
    const nextCross = Math.max(
      this.#playerRadius,
      Math.min(this.#crossExtent() - this.#playerRadius, this.#crossOf(this.#player) + steer * speed * dt),
    );
    this.#player = this.#composePos(this.#playerRadius + 24, nextCross);

    this.#playerFireCooldown -= dt;
    if (this.#playerFireCooldown <= 0) {
      this.#playerFireCooldown = 0.28;
      this.#firePlayerBullet();
    }
  }

  #firePlayerBullet(): void {
    const ref = this.#tryActivate(CH_PLAYER_BULLET);
    if (ref === null) return; // at capacity: bounded by the reused directory
    const speed = 520;
    this.#playerBullets.push({
      id: ref.entityId,
      ref,
      channelId: CH_PLAYER_BULLET,
      pos: { ...this.#player },
      vel: { x: this.#forward.x * speed, y: this.#forward.y * speed },
      radius: 5,
      fireCooldown: 0,
    });
  }

  #spawnEnemies(dt: number): void {
    if (this.#enemiesSpawned >= this.#enemyBudget) return;
    this.#enemySpawnCooldown -= dt;
    if (this.#enemySpawnCooldown > 0) return;
    this.#enemySpawnCooldown = 0.9;

    const ref = this.#tryActivate(CH_ENEMY);
    if (ref === null) return; // at concurrent-enemy capacity
    this.#enemiesSpawned += 1;
    const crossMargin = 40;
    const cross =
      crossMargin + this.#rng() * (this.#crossExtent() - 2 * crossMargin);
    const forward = this.#forwardExtent() - 30;
    const speed = 70 + this.#rng() * 40;
    this.#enemies.push({
      id: ref.entityId,
      ref,
      channelId: CH_ENEMY,
      pos: this.#composePos(forward, cross),
      vel: { x: -this.#forward.x * speed, y: -this.#forward.y * speed },
      radius: 16,
      fireCooldown: 0.6 + this.#rng() * 0.8,
    });
  }

  #updateEnemies(dt: number): void {
    const survivors: Mover[] = [];
    for (const e of this.#enemies) {
      e.pos.x += e.vel.x * dt;
      e.pos.y += e.vel.y * dt;
      e.fireCooldown -= dt;
      if (e.fireCooldown <= 0) {
        e.fireCooldown = 1.1 + this.#rng() * 0.6;
        this.#fireEnemyBullet(e);
      }
      // Cull once the enemy passes behind the player (off the near edge).
      if (this.#forwardOf(e.pos) < -e.radius) {
        this.#recycle(e.ref);
        this.#enemiesKilled += 1; // escaped enemies still leave the field
        continue;
      }
      survivors.push(e);
    }
    this.#enemies = survivors;
  }

  #fireEnemyBullet(from: Mover): void {
    const ref = this.#tryActivate(CH_ENEMY_BULLET);
    if (ref === null) return;
    const dir: Vec2 = {
      x: this.#player.x - from.pos.x,
      y: this.#player.y - from.pos.y,
    };
    const d = len(dir) || 1;
    const speed = 240;
    this.#enemyBullets.push({
      id: ref.entityId,
      ref,
      channelId: CH_ENEMY_BULLET,
      pos: { ...from.pos },
      vel: { x: (dir.x / d) * speed, y: (dir.y / d) * speed },
      radius: 5,
      fireCooldown: 0,
    });
  }

  #updateBullets(dt: number): void {
    this.#playerBullets = this.#advanceBullets(this.#playerBullets, dt);
    this.#enemyBullets = this.#advanceBullets(this.#enemyBullets, dt);
  }

  #advanceBullets(bullets: Mover[], dt: number): Mover[] {
    const survivors: Mover[] = [];
    for (const b of bullets) {
      b.pos.x += b.vel.x * dt;
      b.pos.y += b.vel.y * dt;
      if (this.#outOfField(b.pos)) {
        this.#recycle(b.ref);
        continue;
      }
      survivors.push(b);
    }
    return survivors;
  }

  #outOfField(p: Vec2): boolean {
    const margin = 40;
    return (
      p.x < -margin ||
      p.y < -margin ||
      p.x > this.#fieldW + margin ||
      p.y > this.#fieldH + margin
    );
  }

  #resolveCollisions(): void {
    // player bullets vs enemies
    const deadEnemies = new Set<string>();
    const spentPlayerBullets = new Set<string>();
    for (const b of this.#playerBullets) {
      for (const e of this.#enemies) {
        if (deadEnemies.has(e.id)) continue;
        if (this.#hit(b.pos, b.radius, e.pos, e.radius)) {
          deadEnemies.add(e.id);
          spentPlayerBullets.add(b.id);
          this.#score += 100;
          this.#enemiesKilled += 1;
          break;
        }
      }
    }
    // enemy bullets vs player
    const spentEnemyBullets = new Set<string>();
    for (const b of this.#enemyBullets) {
      if (this.#hit(b.pos, b.radius, this.#player, this.#playerRadius)) {
        spentEnemyBullets.add(b.id);
        this.#playerHp -= 1;
      }
    }
    // enemy body vs player
    for (const e of this.#enemies) {
      if (deadEnemies.has(e.id)) continue;
      if (this.#hit(e.pos, e.radius, this.#player, this.#playerRadius)) {
        deadEnemies.add(e.id);
        this.#playerHp -= 1;
      }
    }

    if (deadEnemies.size > 0) {
      this.#enemies = this.#enemies.filter((e) => {
        if (!deadEnemies.has(e.id)) return true;
        this.#recycle(e.ref);
        return false;
      });
    }
    if (spentPlayerBullets.size > 0)
      this.#playerBullets = this.#filterSpent(this.#playerBullets, spentPlayerBullets);
    if (spentEnemyBullets.size > 0)
      this.#enemyBullets = this.#filterSpent(this.#enemyBullets, spentEnemyBullets);
  }

  #filterSpent(bullets: Mover[], spent: Set<string>): Mover[] {
    return bullets.filter((b) => {
      if (!spent.has(b.id)) return true;
      this.#recycle(b.ref);
      return false;
    });
  }

  #hit(a: Vec2, ar: number, b: Vec2, br: number): boolean {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const r = ar + br;
    return dx * dx + dy * dy <= r * r;
  }

  #evaluateOutcome(): void {
    if (this.#playerHp <= 0) {
      this.#state = "lost";
      return;
    }
    if (this.#enemiesKilled >= this.#enemyBudget && this.#enemies.length === 0) {
      this.#state = "won";
    }
  }
}
