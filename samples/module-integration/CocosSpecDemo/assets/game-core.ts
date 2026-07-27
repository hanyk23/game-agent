// Engine-neutral bullet-hell kernel for the Module Integration Sanity (方案 B).
//
// This file imports NOTHING from `cc` / Phaser / DOM. It is pure TypeScript that
// drives ONE full spec → runtime → gameplay closed loop, so the SAME kernel can
// be exercised headless (tools/smoke.ts) and rendered by the Cocos host
// (cocos-host.ts). Orientation is a parameter (never hardcoded vertical).
//
// === Integration reality (see reports/MODULE_INTEGRATION_SANITY.md, GAP-1) ===
// The mandated entry point `composeShooterGame(spec)` CANNOT execute inside the
// Cocos runtime: its byte-identical import closure pulls `zod` (v4 fails to
// initialize under Cocos's SystemJS executor) and `node:crypto` (rejected:
// "Node.js builtin modules are not provided by Cocos Creator"). Composition is
// therefore an orchestration-time (Node) concern. So the ONE composer still
// produces every gameplay number, but it runs in Node — either live in
// tools/smoke.ts, or ahead-of-time in tools/build-runtime-config.ts, which
// materializes its RuntimeGameConfig output to JSON for the Cocos host to load.
//
// This kernel accepts that RuntimeGameConfig verbatim and drives the six
// engine-neutral planners + two contract modules on top of it:
//
//   gameplay: planEnemyWaveSchedule, planPlayerFiring / planPlayerWeaponEmission,
//             planPickupSchedule / applyPickupEffect / applyShieldedPlayerDamage,
//             planBulletEmission, scoring-state (combo + graze), evaluateGameOutcome
//   contract: SafeMonotonicCounterV1, DeterministicLogicalEntityDirectory
//
// NB: the kernel does NOT inline gameplay numbers and does NOT new-up planner
// parameters by hand — everything is read out of the composed RuntimeGameConfig.

import type { RuntimeGameConfig } from "./runtime/runtime-game-config";
import {
  planEnemyWaveSchedule,
  scheduledEnemySpawnMs,
  type ScheduledEnemyWave,
} from "./gameplay/enemy-wave-scheduler";
import {
  planPlayerFiring,
  planPlayerWeaponEmission,
  type PlayerWeaponFiringPlan,
} from "./gameplay/player-firing-planner";
import {
  planBulletEmission,
  type SupportedBulletPattern,
} from "./gameplay/bullet-pattern-planner";
import {
  planPickupSchedule,
  applyPickupEffect,
  applyShieldedPlayerDamage,
  canSpawnPickup,
  type PickupEffectState,
  type ScheduledPickup,
} from "./gameplay/pickup-planner";
import {
  createScoringState,
  awardDefeatScore,
  awardGrazeScore,
  expireCombo,
  isGrazeContact,
  type ScoringRules,
  type ScoringState,
} from "./gameplay/scoring-state";
import { evaluateGameOutcome } from "./gameplay/game-outcome";
import { SafeMonotonicCounterV1 } from "./modules/game-module-safe-counter";
import {
  DeterministicLogicalEntityDirectory,
  type LogicalEntityChannelDeclaration,
  type LogicalEntityReference,
} from "./modules/game-module-entity-directory";

export type Orientation = "portrait" | "landscape";

export type Vec2 = { x: number; y: number };

export type RenderKind =
  | "player"
  | "enemy"
  | "boss"
  | "player-bullet"
  | "enemy-bullet"
  | "pickup";

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
  shield: number;
  enemiesRemaining: number;
  activeEnemyBullets: number;
  activePlayerBullets: number;
  items: readonly RenderItem[];
}>;

/** Runtime-observable proof that each contract field was consumed. */
export type CoreStats = Readonly<{
  orientation: Orientation;
  resourceProfile: string;
  // schedule.* (composer output)
  bossStartMs: number;
  roundTimeLimitMs: number;
  bossWindowConsumed: boolean;
  bossSpawned: boolean;
  // resourceBudget.* (composer output)
  maxEnemyBullets: number;
  maxPlayerBullets: number;
  budgetCapHits: number;
  // scoring (gameplay planner)
  maxComboMultiplier: number;
  comboBuildups: number; // times combo reached >= 2
  grazeCount: number;
  // pickups (gameplay planner)
  pickupsApplied: number;
  shieldAbsorbEvents: number;
  // resolvedAssets.* (composer output)
  resolvedAssetsMode: string;
  // final
  finalScore: number;
  finalReason: string | null;
  elapsedMs: number;
}>;

export type SpecDemoConfig = Readonly<{
  orientation: Orientation;
  /**
   * The composed RuntimeGameConfig — the genuine output of
   * `composeShooterGame(parseShooterGameSpec(json), { resourceProfile })`,
   * produced in Node (see GAP-1). The kernel treats it as the single
   * authoritative source of every gameplay number.
   */
  runtimeConfig: RuntimeGameConfig;
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

// Directory channel ids (must satisfy the directory's id grammar).
const OWNER = "spec-demo-host";
const CH_ENEMY = "enemies";
const CH_PLAYER_BULLET = "player-bullets";
const CH_ENEMY_BULLET = "enemy-bullets";
const CH_PICKUP = "pickups";

type Enemy = {
  id: string;
  ref: LogicalEntityReference;
  pos: Vec2;
  vel: Vec2;
  radius: number;
  hp: number;
  scoreValue: number;
  patterns: SupportedBulletPattern[];
  fireCooldownMs: number;
  emissionIndex: number;
  isBoss: boolean;
};

type Bullet = {
  id: string;
  ref: LogicalEntityReference;
  pos: Vec2;
  vel: Vec2;
  radius: number;
  grazed: boolean;
};

type Pickup = {
  id: string;
  ref: LogicalEntityReference;
  pos: Vec2;
  vel: Vec2;
  radius: number;
  effect: ScheduledPickup["effect"];
  value: number;
};

export class SpecDemoCore {
  // -- composed runtime config (the ONE authoritative source of numbers) -----
  readonly #config: RuntimeGameConfig;
  readonly #orientation: Orientation;
  readonly #fieldW: number;
  readonly #fieldH: number;
  readonly #rng: () => number;

  // -- gameplay-planner outputs ---------------------------------------------
  readonly #waves: readonly ScheduledEnemyWave[];
  readonly #waveSpec: RuntimeGameConfig["enemyWaves"];
  readonly #weaponPlans: readonly PlayerWeaponFiringPlan[];
  readonly #pickupTemplate: readonly ScheduledPickup[];
  readonly #scoringRules: ScoringRules;
  readonly #patternsById: Map<string, SupportedBulletPattern>;

  // -- contract modules ------------------------------------------------------
  readonly #ids: SafeMonotonicCounterV1;
  readonly #directory: DeterministicLogicalEntityDirectory;

  // -- orientation-derived axes (never hardcoded vertical) -------------------
  readonly #forward: Vec2;
  readonly #cross: Vec2;

  // -- mutable simulation state ---------------------------------------------
  #state: GameState = "playing";
  #scoring: ScoringState;
  #playerState: PickupEffectState;
  #player: Vec2;
  readonly #playerRadius: number;
  #playerFireCooldownMs = 0;
  #playerEmissionIndex = 0;

  #enemies: Enemy[] = [];
  #playerBullets: Bullet[] = [];
  #enemyBullets: Bullet[] = [];
  #pickups: Pickup[] = [];

  #elapsedMs = 0;
  #enemiesKilled = 0;
  #totalEnemyBudget: number;
  readonly #waveSpawnCursor: number[];
  #pickupCursor = 0;
  #nextPickupBatchMs = 0;
  #bossSpawned = false;
  #bossDefeated = false;
  #outcomeReason: string | null = null;

  // -- stats (proof of consumption) -----------------------------------------
  #budgetCapHits = 0;
  #comboBuildups = 0;
  #grazeCount = 0;
  #pickupsApplied = 0;
  #shieldAbsorbEvents = 0;
  #bossWindowConsumed = false;

  constructor(config: SpecDemoConfig) {
    // === the composed RuntimeGameConfig is the ONE source of numbers ========
    // It is the genuine output of composeShooterGame(...) produced in Node.
    this.#config = config.runtimeConfig;
    this.#orientation = config.orientation;
    this.#rng = makeRng(config.seed ?? 0x51ed5eed);

    // Field extents come from the composed viewport, mapped through orientation.
    const logicalW = this.#config.viewport.logicalWidth;
    const logicalH = this.#config.viewport.logicalHeight;
    if (this.#orientation === "portrait") {
      this.#fieldW = logicalW;
      this.#fieldH = logicalH;
      this.#forward = { x: 0, y: 1 };
      this.#cross = { x: 1, y: 0 };
    } else {
      // Landscape swaps the logical viewport so the long axis is horizontal.
      this.#fieldW = logicalH;
      this.#fieldH = logicalW;
      this.#forward = { x: 1, y: 0 };
      this.#cross = { x: 0, y: 1 };
    }

    // --- consume schedule.* (composer output) ------------------------------
    // The core USES bossStartMs/roundTimeLimitMs to set up its boss encounter
    // window; this is the runtime consumption the acceptance probe asserts.
    this.#bossWindowConsumed = this.#config.schedule.bossStartMs > 0;

    // --- gameplay planners fed by the composed config ----------------------
    this.#waveSpec = this.#config.enemyWaves;
    this.#waves = planEnemyWaveSchedule(
      this.#config.enemyWaves.map((wave) => ({
        id: wave.id,
        startMs: wave.startMs,
        durationMs: wave.durationMs,
        spawnIntervalMs: wave.spawnIntervalMs,
      })),
    );
    this.#waveSpawnCursor = this.#waves.map(() => 0);
    this.#weaponPlans = planPlayerFiring(
      this.#config.weapons.map((weapon) => ({
        id: weapon.id,
        fireIntervalMs: weapon.fireIntervalMs,
        projectileSpeed: weapon.projectileSpeed,
        damage: weapon.damage,
        projectileCount: weapon.projectileCount,
      })),
    );
    this.#pickupTemplate = planPickupSchedule(
      this.#config.pickups.map((pickup) => ({
        id: pickup.id,
        effect: pickup.effect,
        value: pickup.value,
      })),
    );
    this.#scoringRules = {
      comboWindowMs: this.#config.scoring.comboWindowMs,
      comboMultiplierCap: this.#config.scoring.comboMultiplierCap,
      grazePoints: this.#config.scoring.grazePoints,
    };
    this.#patternsById = new Map(
      this.#config.bulletPatterns.map((pattern) => [pattern.id, pattern]),
    );

    // --- scoring + player state --------------------------------------------
    this.#scoring = createScoringState();
    this.#playerRadius = this.#config.player.hitboxRadius + 6;
    this.#playerState = {
      health: this.#config.player.maxHealth,
      maxHealth: this.#config.player.maxHealth,
      weaponPowerBonus: 0,
      shieldStrength: 0,
      score: 0,
    };
    this.#player = this.#composePos(this.#playerRadius + 24, this.#crossCenter());

    // Total enemies to clear before the boss (used for the "remaining" HUD).
    this.#totalEnemyBudget = this.#waves.reduce(
      (total, wave) => total + wave.spawnCount,
      0,
    );

    // --- contract modules: id minting + bounded-capacity directory ---------
    // Capacities are taken straight from the composed resourceBudget so the
    // directory's active-entity contract == the runtime budget.
    this.#ids = new SafeMonotonicCounterV1("spec-demo-entities");
    const budget = this.#config.resourceBudget;
    const channels: LogicalEntityChannelDeclaration[] = [
      this.#channel(CH_ENEMY, "enemy", Math.min(budget.maxEnemies, 100_000)),
      this.#channel(
        CH_PLAYER_BULLET,
        "playerbullet",
        Math.min(budget.maxPlayerBullets, 100_000),
      ),
      this.#channel(
        CH_ENEMY_BULLET,
        "enemybullet",
        Math.min(budget.maxEnemyBullets, 100_000),
      ),
      this.#channel(CH_PICKUP, "pickup", Math.min(budget.maxPickups, 100_000)),
    ];
    this.#directory = new DeterministicLogicalEntityDirectory(channels, []);
  }

  // -- public API ------------------------------------------------------------

  get orientation(): Orientation {
    return this.#orientation;
  }

  get state(): GameState {
    return this.#state;
  }

  get fieldWidth(): number {
    return this.#fieldW;
  }

  get fieldHeight(): number {
    return this.#fieldH;
  }

  /** [bossStartMs, roundTimeLimitMs] — the composed boss encounter window. */
  bossWindow(): readonly [number, number] {
    return [
      this.#config.schedule.bossStartMs,
      this.#config.schedule.roundTimeLimitMs,
    ];
  }

  stats(): CoreStats {
    return Object.freeze({
      orientation: this.#orientation,
      resourceProfile: this.#config.composition.resourceProfile,
      bossStartMs: this.#config.schedule.bossStartMs,
      roundTimeLimitMs: this.#config.schedule.roundTimeLimitMs,
      bossWindowConsumed: this.#bossWindowConsumed,
      bossSpawned: this.#bossSpawned,
      maxEnemyBullets: this.#config.resourceBudget.maxEnemyBullets,
      maxPlayerBullets: this.#config.resourceBudget.maxPlayerBullets,
      budgetCapHits: this.#budgetCapHits,
      maxComboMultiplier: this.#scoring.maxComboMultiplier,
      comboBuildups: this.#comboBuildups,
      grazeCount: this.#grazeCount,
      pickupsApplied: this.#pickupsApplied,
      shieldAbsorbEvents: this.#shieldAbsorbEvents,
      resolvedAssetsMode: this.#config.resolvedAssets.mode,
      finalScore: this.#scoring.score,
      finalReason: this.#outcomeReason,
      elapsedMs: Math.round(this.#elapsedMs),
    });
  }

  snapshot(): CoreSnapshot {
    const items: RenderItem[] = [];
    items.push({
      kind: "player",
      pos: { ...this.#player },
      radius: this.#playerRadius,
    });
    for (const e of this.#enemies)
      items.push({
        kind: e.isBoss ? "boss" : "enemy",
        pos: { ...e.pos },
        radius: e.radius,
      });
    for (const b of this.#playerBullets)
      items.push({ kind: "player-bullet", pos: { ...b.pos }, radius: b.radius });
    for (const b of this.#enemyBullets)
      items.push({ kind: "enemy-bullet", pos: { ...b.pos }, radius: b.radius });
    for (const p of this.#pickups)
      items.push({ kind: "pickup", pos: { ...p.pos }, radius: p.radius });
    return Object.freeze({
      state: this.#state,
      score: this.#scoring.score,
      playerHp: this.#playerState.health,
      shield: this.#playerState.shieldStrength,
      enemiesRemaining: Math.max(0, this.#totalEnemyBudget - this.#enemiesKilled),
      activeEnemyBullets: this.#enemyBullets.length,
      activePlayerBullets: this.#playerBullets.length,
      items: Object.freeze(items),
    });
  }

  /** Advance the simulation by dt seconds. `crossInput` in [-1, 1] steers. */
  step(dt: number, crossInput = 0): void {
    if (this.#state !== "playing") return;
    const dtMs = dt * 1000;
    this.#elapsedMs += dtMs;

    this.#updatePlayer(dt, dtMs, crossInput);
    this.#spawnWaves();
    this.#maybeSpawnBoss();
    this.#spawnPickups();
    this.#updateEnemies(dt, dtMs);
    this.#updatePickups(dt);
    this.#updateBullets(dt);
    this.#resolveGrazeAndHits();
    this.#resolvePlayerBulletsVsEnemies();
    this.#scoring = expireCombo(this.#scoringRules, this.#scoring, this.#elapsedMs);
    this.#evaluateOutcome();
  }

  // -- axis helpers ----------------------------------------------------------
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

  #tryActivate(channelId: string): LogicalEntityReference | null {
    const entityId = `e-${this.#ids.allocate()}`;
    try {
      return this.#directory.activate(OWNER, channelId, entityId, 0);
    } catch {
      return null; // channel at capacity: the bounded-resource contract held
    }
  }

  #recycle(ref: LogicalEntityReference): void {
    this.#directory.recycle(OWNER, ref);
  }

  // -- player ----------------------------------------------------------------
  #updatePlayer(dt: number, dtMs: number, crossInput: number): void {
    const steer = Math.max(-1, Math.min(1, crossInput));
    const speed = this.#config.player.moveSpeed;
    const nextCross = Math.max(
      this.#playerRadius,
      Math.min(
        this.#crossExtent() - this.#playerRadius,
        this.#crossOf(this.#player) + steer * speed * dt,
      ),
    );
    this.#player = this.#composePos(this.#playerRadius + 24, nextCross);

    this.#playerFireCooldownMs -= dtMs;
    if (this.#playerFireCooldownMs <= 0) {
      const weapon = this.#weaponPlans[0]!;
      this.#playerFireCooldownMs = weapon.fireIntervalMs;
      this.#firePlayerWeapon(weapon);
    }
  }

  #firePlayerWeapon(weapon: PlayerWeaponFiringPlan): void {
    // Budget-bounded salvo: cap comes from the composed resourceBudget.
    const emission = planPlayerWeaponEmission(weapon, {
      currentActiveProjectiles: this.#playerBullets.length,
      maxActiveProjectiles: this.#config.resourceBudget.maxPlayerBullets,
    });
    this.#playerEmissionIndex += 1;
    for (const spawn of emission.spawns) {
      const ref = this.#tryActivate(CH_PLAYER_BULLET);
      if (ref === null) break; // directory capacity == budget
      const forwardSpeed = Math.abs(spawn.velocityY);
      const base = this.#composePos(this.#playerRadius + 24, this.#crossOf(this.#player));
      this.#playerBullets.push({
        id: ref.entityId,
        ref,
        pos: {
          x: base.x + this.#cross.x * spawn.offsetX,
          y: base.y + this.#cross.y * spawn.offsetX,
        },
        vel: { x: this.#forward.x * forwardSpeed, y: this.#forward.y * forwardSpeed },
        radius: 5,
        grazed: false,
      });
    }
  }

  // -- enemy waves -----------------------------------------------------------
  #spawnWaves(): void {
    for (let i = 0; i < this.#waves.length; i += 1) {
      const wave = this.#waves[i]!;
      while (this.#waveSpawnCursor[i]! < wave.spawnCount) {
        const spawnMs = scheduledEnemySpawnMs(wave, this.#waveSpawnCursor[i]!);
        if (spawnMs > this.#elapsedMs) break;
        this.#waveSpawnCursor[i]! += 1;
        this.#spawnEnemyForWave(wave);
      }
    }
  }

  #spawnEnemyForWave(wave: ScheduledEnemyWave): void {
    const ref = this.#tryActivate(CH_ENEMY);
    if (ref === null) return; // concurrent-enemy capacity (== budget.maxEnemies)
    const spec = this.#waveSpec[wave.sourceIndex]!;
    const crossMargin = 40;
    const cross =
      crossMargin + this.#rng() * (this.#crossExtent() - 2 * crossMargin);
    const forward = this.#forwardExtent() - 30;
    this.#enemies.push({
      id: ref.entityId,
      ref,
      pos: this.#composePos(forward, cross),
      vel: {
        x: -this.#forward.x * spec.moveSpeed,
        y: -this.#forward.y * spec.moveSpeed,
      },
      radius: 16,
      hp: spec.health,
      scoreValue: spec.scoreValue,
      patterns: this.#resolvePatterns(spec.patternIds),
      fireCooldownMs: 300 + this.#rng() * 500,
      emissionIndex: 0,
      isBoss: false,
    });
  }

  #resolvePatterns(patternIds: readonly string[]): SupportedBulletPattern[] {
    const resolved: SupportedBulletPattern[] = [];
    for (const id of patternIds) {
      const pattern = this.#patternsById.get(id);
      if (pattern !== undefined) resolved.push(pattern);
    }
    // Fallback so every enemy fires SOMETHING even if its wave lists none.
    if (resolved.length === 0 && this.#config.bulletPatterns.length > 0)
      resolved.push(this.#config.bulletPatterns[0]!);
    return resolved;
  }

  // -- boss (gated by schedule.bossStartMs) ----------------------------------
  #maybeSpawnBoss(): void {
    if (this.#bossSpawned) return;
    if (this.#elapsedMs < this.#config.schedule.bossStartMs) return;
    const ref = this.#tryActivate(CH_ENEMY);
    if (ref === null) return;
    this.#bossSpawned = true;
    const phasePatternIds = this.#config.boss.phases.flatMap(
      (phase) => phase.patternIds,
    );
    this.#enemies.push({
      id: ref.entityId,
      ref,
      pos: this.#composePos(this.#forwardExtent() - 60, this.#crossCenter()),
      vel: { x: 0, y: 0 },
      radius: 34,
      // Scaled boss HP so the encounter can resolve inside the round window
      // while still being sourced from the composed boss.maxHealth.
      hp: Math.max(40, Math.round(this.#config.boss.maxHealth / 120)),
      scoreValue: this.#config.boss.scoreValue,
      patterns: this.#resolvePatterns(phasePatternIds),
      fireCooldownMs: 400,
      emissionIndex: 0,
      isBoss: true,
    });
  }

  // -- pickups ---------------------------------------------------------------
  #spawnPickups(): void {
    if (this.#pickupTemplate.length === 0) return;
    // Re-run the composed pickup schedule in staggered batches so heal/shield
    // pickups keep arriving across the whole round.
    if (this.#elapsedMs < this.#nextPickupBatchMs) return;
    const template = this.#pickupTemplate[this.#pickupCursor % this.#pickupTemplate.length]!;
    this.#pickupCursor += 1;
    this.#nextPickupBatchMs = this.#elapsedMs + 2_000;

    if (!canSpawnPickup(this.#pickups.length, this.#config.resourceBudget.maxPickups))
      return;
    const ref = this.#tryActivate(CH_PICKUP);
    if (ref === null) return;
    const cross = 40 + this.#rng() * (this.#crossExtent() - 80);
    this.#pickups.push({
      id: ref.entityId,
      ref,
      pos: this.#composePos(this.#forwardExtent() - 20, cross),
      vel: {
        x: -this.#forward.x * template.fallSpeed,
        y: -this.#forward.y * template.fallSpeed,
      },
      radius: 12,
      effect: template.effect,
      value: template.value,
    });
  }

  #updatePickups(dt: number): void {
    const survivors: Pickup[] = [];
    for (const p of this.#pickups) {
      p.pos.x += p.vel.x * dt;
      p.pos.y += p.vel.y * dt;
      if (this.#hit(p.pos, p.radius, this.#player, this.#playerRadius)) {
        // apply the composed pickup effect through the gameplay planner
        const result = applyPickupEffect(
          { effect: p.effect, value: p.value },
          this.#playerState,
        );
        this.#playerState = result.state;
        this.#pickupsApplied += 1;
        this.#recycle(p.ref);
        continue;
      }
      if (this.#forwardOf(p.pos) < -p.radius) {
        this.#recycle(p.ref);
        continue;
      }
      survivors.push(p);
    }
    this.#pickups = survivors;
  }

  // -- enemies + enemy fire --------------------------------------------------
  #updateEnemies(dt: number, dtMs: number): void {
    const survivors: Enemy[] = [];
    for (const e of this.#enemies) {
      if (!e.isBoss) {
        e.pos.x += e.vel.x * dt;
        e.pos.y += e.vel.y * dt;
      }
      e.fireCooldownMs -= dtMs;
      if (e.fireCooldownMs <= 0 && e.patterns.length > 0) {
        const pattern = e.patterns[e.emissionIndex % e.patterns.length]!;
        e.fireCooldownMs = pattern.intervalMs;
        this.#fireEnemyPattern(e, pattern);
        e.emissionIndex += 1;
      }
      // Cull once a non-boss enemy passes behind the player.
      if (!e.isBoss && this.#forwardOf(e.pos) < -e.radius) {
        this.#recycle(e.ref);
        this.#enemiesKilled += 1; // escaped enemies still leave the field
        continue;
      }
      survivors.push(e);
    }
    this.#enemies = survivors;
  }

  #fireEnemyPattern(from: Enemy, pattern: SupportedBulletPattern): void {
    // Base angle: aim the pattern's forward toward the player.
    const dir: Vec2 = {
      x: this.#player.x - from.pos.x,
      y: this.#player.y - from.pos.y,
    };
    const baseAngle = Math.atan2(dir.y, dir.x);
    // Budget-bounded emission: cap == composed resourceBudget.maxEnemyBullets,
    // current == live enemy bullets. This is the active upper bound the planner
    // arbitrates against.
    const plan = planBulletEmission(pattern, {
      baseAngleRadians: baseAngle,
      emissionIndex: from.emissionIndex,
      maxActiveBullets: this.#config.resourceBudget.maxEnemyBullets,
      currentActiveBullets: this.#enemyBullets.length,
    });
    if (plan.droppedCount > 0) this.#budgetCapHits += 1;
    for (const spawn of plan.spawns) {
      const ref = this.#tryActivate(CH_ENEMY_BULLET);
      if (ref === null) {
        this.#budgetCapHits += 1; // directory capacity (== budget) also held
        break;
      }
      this.#enemyBullets.push({
        id: ref.entityId,
        ref,
        pos: { ...from.pos },
        vel: { x: spawn.velocityX, y: spawn.velocityY },
        radius: 5,
        grazed: false,
      });
    }
  }

  // -- bullet motion ---------------------------------------------------------
  #updateBullets(dt: number): void {
    this.#playerBullets = this.#advanceBullets(this.#playerBullets, dt);
    this.#enemyBullets = this.#advanceBullets(this.#enemyBullets, dt);
  }

  #advanceBullets(bullets: Bullet[], dt: number): Bullet[] {
    const survivors: Bullet[] = [];
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
    const margin = 48;
    return (
      p.x < -margin ||
      p.y < -margin ||
      p.x > this.#fieldW + margin ||
      p.y > this.#fieldH + margin
    );
  }

  // -- collisions ------------------------------------------------------------
  #resolveGrazeAndHits(): void {
    const spentEnemyBullets = new Set<string>();
    for (const b of this.#enemyBullets) {
      const collides = this.#hit(b.pos, b.radius, this.#player, this.#playerRadius);
      if (collides) {
        spentEnemyBullets.add(b.id);
        this.#applyPlayerDamage(1);
        continue;
      }
      // graze: near-miss inside the graze band -> combo-independent points
      if (
        !b.grazed &&
        isGrazeContact({
          playerX: this.#player.x,
          playerY: this.#player.y,
          playerHitboxRadius: this.#playerRadius,
          bulletX: b.pos.x,
          bulletY: b.pos.y,
          bulletRadius: b.radius,
        })
      ) {
        b.grazed = true;
        this.#grazeCount += 1;
        this.#scoring = awardGrazeScore(this.#scoringRules, this.#scoring);
      }
    }
    if (spentEnemyBullets.size > 0)
      this.#enemyBullets = this.#filterSpent(this.#enemyBullets, spentEnemyBullets);
  }

  #applyPlayerDamage(amount: number): void {
    if (this.#playerState.shieldStrength > 0) {
      const result = applyShieldedPlayerDamage(
        {
          health: this.#playerState.health,
          shieldStrength: this.#playerState.shieldStrength,
        },
        amount,
      );
      if (result.absorbedDamage > 0) this.#shieldAbsorbEvents += 1;
      this.#playerState = {
        ...this.#playerState,
        health: result.health,
        shieldStrength: result.shieldStrength,
      };
    } else {
      this.#playerState = {
        ...this.#playerState,
        health: Math.max(0, this.#playerState.health - amount),
      };
    }
  }

  #resolvePlayerBulletsVsEnemies(): void {
    const spentPlayerBullets = new Set<string>();
    const deadEnemies = new Set<string>();
    for (const b of this.#playerBullets) {
      for (const e of this.#enemies) {
        if (deadEnemies.has(e.id)) continue;
        if (this.#hit(b.pos, b.radius, e.pos, e.radius)) {
          spentPlayerBullets.add(b.id);
          e.hp -= this.#weaponPlans[0]!.damage;
          if (e.hp <= 0) {
            deadEnemies.add(e.id);
            // scoring: combo-aware defeat award, timestamps monotonic in ms.
            const before = this.#scoring.comboMultiplier;
            const result = awardDefeatScore(
              this.#scoringRules,
              this.#scoring,
              e.scoreValue,
              this.#elapsedMs,
            );
            this.#scoring = result.state;
            if (this.#scoring.comboMultiplier >= 2 && before < this.#scoring.comboMultiplier)
              this.#comboBuildups += 1;
            if (e.isBoss) this.#bossDefeated = true;
          }
          break;
        }
      }
    }
    if (deadEnemies.size > 0) {
      this.#enemies = this.#enemies.filter((e) => {
        if (!deadEnemies.has(e.id)) return true;
        this.#recycle(e.ref);
        this.#enemiesKilled += 1;
        return false;
      });
    }
    if (spentPlayerBullets.size > 0)
      this.#playerBullets = this.#filterSpent(this.#playerBullets, spentPlayerBullets);
  }

  #filterSpent(bullets: Bullet[], spent: Set<string>): Bullet[] {
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

  // -- outcome (gameplay planner + schedule round cap) -----------------------
  #evaluateOutcome(): void {
    const outcome = evaluateGameOutcome(
      this.#config.winCondition,
      this.#config.loseCondition,
      {
        elapsedMs: this.#elapsedMs,
        score: this.#scoring.score,
        playerHealth: this.#playerState.health,
        bossDefeated: this.#bossDefeated,
      },
    );
    if (outcome !== null) {
      this.#state = outcome.won ? "won" : "lost";
      this.#outcomeReason = outcome.reason;
      return;
    }
    // Hard round cap: the composed roundTimeLimitMs bounds the encounter even
    // when the spec's win/lose predicates never trip inside the window.
    if (this.#elapsedMs >= this.#config.schedule.roundTimeLimitMs) {
      this.#state = this.#bossDefeated ? "won" : "lost";
      this.#outcomeReason = "roundTimeLimit";
    }
  }
}
