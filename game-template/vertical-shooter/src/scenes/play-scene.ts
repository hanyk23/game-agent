import Phaser from "phaser";

import { selectBossPhaseIndex } from "../../../../src/gameplay/boss-phase.js";
import {
  planBossPatternSchedule,
  type ScheduledBossPattern,
} from "../../../../src/gameplay/boss-pattern-scheduler.js";
import {
  planBulletEmission,
  type SupportedBulletPattern,
} from "../../../../src/gameplay/bullet-pattern-planner.js";
import {
  planEnemyPatternSchedule,
  type ScheduledEnemyPattern,
} from "../../../../src/gameplay/enemy-pattern-scheduler.js";
import {
  planEnemySpawnX,
  planEnemyWaveSchedule,
  type ScheduledEnemyWave,
} from "../../../../src/gameplay/enemy-wave-scheduler.js";
import {
  evaluateGameOutcome,
  type GameOutcome,
} from "../../../../src/gameplay/game-outcome.js";
import {
  planPlayerFiring,
  planPlayerWeaponEmission,
  type PlayerWeaponFiringPlan,
} from "../../../../src/gameplay/player-firing-planner.js";
import {
  applyPickupEffect,
  applyShieldedPlayerDamage,
  canSpawnPickup,
  planPickupSchedule,
  type ScheduledPickup,
} from "../../../../src/gameplay/pickup-planner.js";
import {
  awardDefeatScore,
  awardFlatScore,
  awardGrazeScore,
  createScoringState,
  expireCombo,
  isGrazeContact,
  type ScoringState,
} from "../../../../src/gameplay/scoring-state.js";
import {
  addRuntimeBackground,
  addRuntimeEffect,
  addRuntimeHudPanel,
  catalogSelections,
  fitSpriteToBox,
  textureKeyForQuery,
} from "../runtime-assets.js";
import { demoRuntimeConfig } from "../runtime-config.js";
import type {
  RuntimeEntityPool,
  RuntimeKernel,
  RuntimeText,
  RuntimeTextStyle,
  RuntimeTimer,
} from "../runtime-kernel/contracts.js";
import { createPhaserRuntimeKernel } from "../runtime-kernel/phaser-runtime-kernel.js";
import {
  type ScoringExecutionSnapshot,
  type ShooterPlaySnapshot,
  type ShooterRuntimeSnapshot,
} from "../test-bridge.js";
import {
  registerBatch1SnapshotReader,
  registerBatch2FormationSnapshotReader,
  registerBatch2ProgressionSnapshotReader,
  registerBatch2NearestSnapshotReader,
  registerBatch2DefenseSnapshotReader,
  registerBatch2SnapshotReader,
  registerMixedV13ConformanceSnapshotReader,
  registerMixedV14ConformanceSnapshotReader,
} from "../test-bridge.js";
import {
  createBatch1BrowserRuntime,
  type Batch1BrowserRuntime,
} from "../runtime-kernel/batch1-browser-runtime.js";
import {
  createBatch2BrowserRuntime,
  type Batch2BrowserRuntime,
} from "../runtime-kernel/batch2-browser-runtime.js";
import {
  createBatch2FormationBrowserRuntime,
  type Batch2FormationBrowserRuntime,
} from "../runtime-kernel/batch2-formation-browser-runtime.js";
import {
  createBatch2ProgressionBrowserRuntime,
  type Batch2ProgressionBrowserRuntime,
} from "../runtime-kernel/batch2-progression-browser-runtime.js";
import {
  createBatch2NearestBrowserConformanceRuntime,
  type Batch2NearestBrowserConformanceRuntime,
} from "../runtime-kernel/batch2-nearest-browser-conformance.js";
import {
  createBatch2DefenseBrowserRuntime,
  type Batch2DefenseBrowserRuntime,
} from "../runtime-kernel/batch2-defense-browser-runtime.js";
import {
  createMixedV13BrowserConformanceRuntime,
  type MixedV13BrowserConformanceRuntime,
} from "../runtime-kernel/mixed-v13-browser-conformance.js";
import {
  createMixedV14BrowserConformanceRuntime,
  type MixedV14BrowserConformanceRuntime,
} from "../runtime-kernel/mixed-v14-browser-conformance.js";

type EnemySprite = Phaser.Physics.Arcade.Sprite & {
  health: number;
  waveIndex: number;
  patternEvents: RuntimeTimer[];
};
type PlayerProjectile = Phaser.Physics.Arcade.Sprite & {
  weaponIndex: number;
  damage: number;
};
type EnemyBullet = Phaser.Physics.Arcade.Sprite & {
  grazed: boolean;
  patternIndex: number;
  spawnX: number;
  spawnY: number;
  movementRecorded: boolean;
  sourceWaveIndex: number;
  sourceWavePatternIndex: number;
};
type PickupSprite = Phaser.Physics.Arcade.Sprite & {
  pickupIndex: number;
};
type PickupExecution = {
  plan: ScheduledPickup;
  spawnAttempts: number;
  successfulSpawns: number;
  droppedByBudget: number;
  collections: number;
  appliedValue: number;
};
type WeaponExecution = {
  plan: PlayerWeaponFiringPlan;
  fireAttempts: number;
  successfulProjectiles: number;
  droppedProjectiles: number;
  maxProjectilesPerFire: number;
  hitCount: number;
  damageDealt: number;
  lastProjectileSpeed: number | null;
};
type EnemyWaveExecution = {
  plan: ScheduledEnemyWave;
  started: boolean;
  spawnAttempts: number;
  successfulSpawns: number;
  patternSchedule: readonly ScheduledEnemyPattern[];
  patternExecutions: EnemyWavePatternExecution[];
};
type PatternExecutionMetrics = {
  emissionAttempts: number;
  requestedBullets: number;
  plannedBullets: number;
  successfulSpawns: number;
  droppedByBudget: number;
  droppedByPool: number;
  movedBullets: number;
  maxTravelDistance: number;
  minimumAimErrorRadians: number | null;
};
type EnemyWavePatternExecution = PatternExecutionMetrics & {
  schedule: ScheduledEnemyPattern;
  emitterCount: number;
};
type EnemyPatternEmitter = {
  enemy: EnemySprite;
  waveExecution: EnemyWaveExecution;
  schedule: ScheduledEnemyPattern;
  emissionIndex: number;
};
type BulletPatternExecution = {
  id: string;
  pattern: SupportedBulletPattern["pattern"];
} & PatternExecutionMetrics;
type ArcadeCollisionObject = Phaser.Physics.Arcade.Sprite;
const enemyWaveSchedule = planEnemyWaveSchedule(demoRuntimeConfig.enemyWaves);
const playerFiringPlan = planPlayerFiring(demoRuntimeConfig.weapons);
const pickupSchedule = planPickupSchedule(demoRuntimeConfig.pickups);
const pickupTints = {
  heal: 0x66ff99,
  weaponPower: 0x9cecff,
  shield: 0xcc99ff,
  scoreBonus: 0xffdc6e,
} as const;

export class PlayScene extends Phaser.Scene {
  private kernel!: RuntimeKernel<
    Phaser.Physics.Arcade.Sprite,
    ShooterRuntimeSnapshot
  >;
  private player!: Phaser.Physics.Arcade.Sprite;
  private boss: Phaser.Physics.Arcade.Sprite | undefined;
  private projectiles!: RuntimeEntityPool<PlayerProjectile>;
  private enemies!: RuntimeEntityPool<EnemySprite>;
  private enemyBullets!: RuntimeEntityPool<EnemyBullet>;
  private pickups!: RuntimeEntityPool<PickupSprite>;
  private enemySpawnEvents: RuntimeTimer[] = [];
  private enemyWaveExecutions: EnemyWaveExecution[] = [];
  private weaponFireEvents: RuntimeTimer[] = [];
  private weaponExecutions: WeaponExecution[] = [];
  private pickupSpawnEvents: RuntimeTimer[] = [];
  private pickupExecutions: PickupExecution[] = [];
  private bulletPatternExecutions: BulletPatternExecution[] = [];
  private bossPatternEvents: RuntimeTimer[] = [];
  private health = demoRuntimeConfig.player.maxHealth;
  private scoringState: ScoringState = createScoringState();
  private bossHealth = 0;
  private bossDefeated = false;
  private runStartedAtMs = 0;
  private bossPhaseIndex = -1;
  private bossEmissionIndices = new Map<number, number>();
  private peakActiveEnemyBullets = 0;
  private invulnerableUntil = 0;
  private weaponPowerBonus = 0;
  private shieldStrength = 0;
  private minimumEnemyBulletDistance: number | null = null;
  private hitRadiusAtMinimumDistance: number | null = null;
  private scoreText!: RuntimeText;
  private healthText!: RuntimeText;
  private bossText!: RuntimeText;
  private ending = false;
  private dragPointerId: number | undefined;
  private batch1Runtime!: Batch1BrowserRuntime;
  private batch2Runtime!: Batch2BrowserRuntime;
  private batch2FormationRuntime!: Batch2FormationBrowserRuntime;
  private batch2ProgressionRuntime!: Batch2ProgressionBrowserRuntime;
  private batch2NearestRuntime!: Batch2NearestBrowserConformanceRuntime;
  private batch2DefenseRuntime!: Batch2DefenseBrowserRuntime;
  private mixedV13ConformanceRuntime!: MixedV13BrowserConformanceRuntime;
  private mixedV14ConformanceRuntime!: MixedV14BrowserConformanceRuntime;

  constructor() {
    super("play");
  }

  create(): void {
    this.kernel = createPhaserRuntimeKernel(this, {
      budgets: {
        playerBullets: demoRuntimeConfig.resourceBudget.maxPlayerBullets,
        enemies: demoRuntimeConfig.resourceBudget.maxEnemies,
        enemyBullets: demoRuntimeConfig.resourceBudget.maxEnemyBullets,
        pickups: demoRuntimeConfig.resourceBudget.maxPickups,
      },
      expectedTextureKeys: catalogSelections(demoRuntimeConfig).map(
        (selected) => selected.textureKey,
      ),
    });
    this.resetRunState();
    const { width, height } = this.kernel.viewport;
    const backgroundTextureKey = addRuntimeBackground(this, demoRuntimeConfig);
    if (backgroundTextureKey !== null) this.useTexture(backgroundTextureKey);
    const hudTextureKey = addRuntimeHudPanel(this, demoRuntimeConfig);
    if (hudTextureKey !== null) this.useTexture(hudTextureKey);
    const playerTextureKey = textureKeyForQuery(
      demoRuntimeConfig,
      demoRuntimeConfig.player.assetQueryId,
      "player",
    );
    this.player = this.kernel.entities.createSprite(
      width / 2,
      height * 0.82,
      playerTextureKey,
    );
    fitSpriteToBox(this.player, 48, 48);
    this.configurePlayerHitbox();
    this.useTexture(playerTextureKey);
    this.player.setCollideWorldBounds(true);
    this.projectiles = this.kernel.entities.createPool(
      "playerBullets",
    ) as RuntimeEntityPool<PlayerProjectile>;
    this.enemies = this.kernel.entities.createPool(
      "enemies",
    ) as RuntimeEntityPool<EnemySprite>;
    this.enemyBullets = this.kernel.entities.createPool(
      "enemyBullets",
    ) as RuntimeEntityPool<EnemyBullet>;
    this.pickups = this.kernel.entities.createPool(
      "pickups",
    ) as RuntimeEntityPool<PickupSprite>;

    this.scoreText = this.kernel.rendering.createText(
      18,
      16,
      "得分 0 · x1 · 擦0",
      this.hudStyle(),
    );
    this.healthText = this.kernel.rendering
      .createText(width - 18, 16, `生命 ${this.health}`, this.hudStyle())
      .setOrigin(1, 0);
    this.bossText = this.kernel.rendering
      .createText(width / 2, 48, "", this.hudStyle())
      .setOrigin(0.5, 0)
      .setVisible(false);

    this.configureCollisions();
    this.configureTimers();
    this.configureTouchInput();
    this.batch1Runtime = createBatch1BrowserRuntime(this.game.canvas);
    const removeBatch1SnapshotReader = registerBatch1SnapshotReader(() =>
      this.batch1Runtime.snapshot(),
    );
    this.kernel.lifecycle.onShutdown(() => {
      removeBatch1SnapshotReader();
      this.batch1Runtime.destroy();
    });
    this.batch2Runtime = createBatch2BrowserRuntime(this.game.canvas);
    const removeBatch2SnapshotReader = registerBatch2SnapshotReader(() =>
      this.batch2Runtime.snapshot(),
    );
    this.kernel.lifecycle.onShutdown(() => {
      removeBatch2SnapshotReader();
      this.batch2Runtime.destroy();
    });
    this.batch2FormationRuntime = createBatch2FormationBrowserRuntime(
      this.game.canvas,
    );
    const removeBatch2FormationSnapshotReader =
      registerBatch2FormationSnapshotReader(() =>
        this.batch2FormationRuntime.snapshot(),
      );
    this.kernel.lifecycle.onShutdown(() => {
      removeBatch2FormationSnapshotReader();
      this.batch2FormationRuntime.destroy();
    });
    this.batch2ProgressionRuntime = createBatch2ProgressionBrowserRuntime(
      this.game.canvas,
    );
    const removeBatch2ProgressionSnapshotReader =
      registerBatch2ProgressionSnapshotReader(() =>
        this.batch2ProgressionRuntime.snapshot(),
      );
    this.kernel.lifecycle.onShutdown(() => {
      removeBatch2ProgressionSnapshotReader();
      this.batch2ProgressionRuntime.destroy();
    });
    this.batch2NearestRuntime = createBatch2NearestBrowserConformanceRuntime();
    const removeBatch2NearestSnapshotReader =
      registerBatch2NearestSnapshotReader(() =>
        this.batch2NearestRuntime.snapshot(),
      );
    this.kernel.lifecycle.onShutdown(() => {
      removeBatch2NearestSnapshotReader();
      this.batch2NearestRuntime.destroy();
    });
    this.batch2DefenseRuntime = createBatch2DefenseBrowserRuntime(
      this.game.canvas,
    );
    const removeBatch2DefenseSnapshotReader =
      registerBatch2DefenseSnapshotReader(() =>
        this.batch2DefenseRuntime.snapshot(),
      );
    this.kernel.lifecycle.onShutdown(() => {
      removeBatch2DefenseSnapshotReader();
      this.batch2DefenseRuntime.destroy();
    });
    this.mixedV13ConformanceRuntime = createMixedV13BrowserConformanceRuntime();
    const removeMixedV13ConformanceSnapshotReader =
      registerMixedV13ConformanceSnapshotReader(() =>
        this.mixedV13ConformanceRuntime.snapshot(),
      );
    this.kernel.lifecycle.onShutdown(() => {
      removeMixedV13ConformanceSnapshotReader();
      this.mixedV13ConformanceRuntime.destroy();
    });
    this.mixedV14ConformanceRuntime = createMixedV14BrowserConformanceRuntime();
    const removeMixedV14ConformanceSnapshotReader =
      registerMixedV14ConformanceSnapshotReader(() =>
        this.mixedV14ConformanceRuntime.snapshot(),
      );
    this.kernel.lifecycle.onShutdown(() => {
      removeMixedV14ConformanceSnapshotReader();
      this.mixedV14ConformanceRuntime.destroy();
    });

    const removeSnapshotReader = this.kernel.observation.registerReader(() =>
      this.readRuntimeSnapshot(),
    );
    this.kernel.lifecycle.onShutdown(removeSnapshotReader);
  }

  update(): void {
    this.batch1Runtime.frame(this.game.loop.delta);
    this.batch2Runtime.frame(this.game.loop.delta);
    this.batch2FormationRuntime.frame(this.game.loop.delta);
    this.batch2ProgressionRuntime.frame(this.game.loop.delta);
    this.batch2NearestRuntime.frame(this.game.loop.delta);
    this.batch2DefenseRuntime.frame(this.game.loop.delta);
    this.updatePlayerVelocity();
    this.checkBossProjectileOverlap();
    this.checkEnemyBulletGrazes();
    this.recordEnemyBulletMovement();
    const scoringState = expireCombo(
      demoRuntimeConfig.scoring,
      this.scoringState,
      this.kernel.clock.nowMs(),
    );
    if (scoringState !== this.scoringState) {
      this.scoringState = scoringState;
      this.updateScoreText();
    }
    this.evaluateOutcome();
    this.recycleOffscreenObjects();
  }

  private checkBossProjectileOverlap(): void {
    if (!this.boss?.active || this.ending) return;
    this.kernel.collisions.overlapNow(
      this.projectiles,
      this.boss,
      (projectile, boss) => this.onProjectileHitsBoss(projectile, boss),
    );
    if (!this.boss?.active || this.ending) return;

    const bossBody = this.boss.body as Phaser.Physics.Arcade.Body;
    this.projectiles.forEach((projectile) => {
      if (!projectile.active || !this.boss?.active) return;
      const body = projectile.body as Phaser.Physics.Arcade.Body;
      const sweptLeft = Math.min(body.prev.x, body.x);
      const sweptRight = Math.max(body.prev.x, body.x) + body.width;
      const sweptTop = Math.min(body.prev.y, body.y);
      const sweptBottom = Math.max(body.prev.y, body.y) + body.height;
      const intersectsBoss =
        sweptRight >= bossBody.left &&
        sweptLeft <= bossBody.right &&
        sweptBottom >= bossBody.top &&
        sweptTop <= bossBody.bottom;
      if (intersectsBoss) this.applyProjectileHitToBoss(projectile, this.boss);
    });
  }

  private resetRunState(): void {
    this.health = demoRuntimeConfig.player.maxHealth;
    this.scoringState = createScoringState();
    this.bossHealth = 0;
    this.bossDefeated = false;
    this.runStartedAtMs = this.kernel.clock.nowMs();
    this.bossPhaseIndex = -1;
    this.bossEmissionIndices.clear();
    this.peakActiveEnemyBullets = 0;
    this.invulnerableUntil = 0;
    this.weaponPowerBonus = 0;
    this.shieldStrength = 0;
    this.minimumEnemyBulletDistance = null;
    this.hitRadiusAtMinimumDistance = null;
    this.ending = false;
    this.dragPointerId = undefined;
    this.boss = undefined;
    this.bossPatternEvents = [];
    this.enemySpawnEvents = [];
    this.weaponFireEvents = [];
    this.pickupSpawnEvents = [];
    this.weaponExecutions = playerFiringPlan.map((plan) => ({
      plan,
      fireAttempts: 0,
      successfulProjectiles: 0,
      droppedProjectiles: 0,
      maxProjectilesPerFire: 0,
      hitCount: 0,
      damageDealt: 0,
      lastProjectileSpeed: null,
    }));
    this.enemyWaveExecutions = enemyWaveSchedule.map((plan) => {
      const wave = demoRuntimeConfig.enemyWaves[plan.sourceIndex];
      if (!wave) throw new Error(`Missing enemy wave: ${plan.waveId}`);
      const patternSchedule = planEnemyPatternSchedule(
        wave,
        demoRuntimeConfig.bulletPatterns,
      );
      return {
        plan,
        started: false,
        spawnAttempts: 0,
        successfulSpawns: 0,
        patternSchedule,
        patternExecutions: patternSchedule.map((schedule) => ({
          schedule,
          emitterCount: 0,
          emissionAttempts: 0,
          requestedBullets: 0,
          plannedBullets: 0,
          successfulSpawns: 0,
          droppedByBudget: 0,
          droppedByPool: 0,
          movedBullets: 0,
          maxTravelDistance: 0,
          minimumAimErrorRadians: null,
        })),
      };
    });
    this.pickupExecutions = pickupSchedule.map((plan) => ({
      plan,
      spawnAttempts: 0,
      successfulSpawns: 0,
      droppedByBudget: 0,
      collections: 0,
      appliedValue: 0,
    }));
    this.bulletPatternExecutions = demoRuntimeConfig.bulletPatterns.map(
      (pattern) => ({
        id: pattern.id,
        pattern: pattern.pattern,
        emissionAttempts: 0,
        requestedBullets: 0,
        plannedBullets: 0,
        successfulSpawns: 0,
        droppedByBudget: 0,
        droppedByPool: 0,
        movedBullets: 0,
        maxTravelDistance: 0,
        minimumAimErrorRadians: null,
      }),
    );
  }

  private configurePlayerHitbox(): void {
    this.configureCircularBody(
      this.player,
      demoRuntimeConfig.player.hitboxRadius,
    );
  }

  private configureCircularBody(
    sprite: Phaser.Physics.Arcade.Sprite,
    worldRadius: number,
  ): void {
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    const scale = Math.abs(sprite.scaleX);
    if (!Number.isFinite(scale) || scale <= 0) {
      throw new Error("Runtime texture produced an invalid hitbox scale");
    }
    const sourceRadius = worldRadius / scale;
    body.setCircle(
      sourceRadius,
      sprite.width / 2 - sourceRadius,
      sprite.height / 2 - sourceRadius,
    );
  }

  private enemyBulletHitRadius(bullet: EnemyBullet): number {
    return Math.min(bullet.displayWidth, bullet.displayHeight) / 2;
  }

  private configureCollisions(): void {
    this.kernel.collisions.watchOverlap(
      this.projectiles,
      this.enemies,
      (projectile, enemy) => this.onProjectileHitsEnemy(projectile, enemy),
    );
    this.kernel.collisions.watchOverlap(
      this.player,
      this.enemies,
      (player, enemy) => this.onPlayerHitsEnemy(player, enemy),
    );
    this.kernel.collisions.watchOverlap(
      this.player,
      this.enemyBullets,
      (player, bullet) => this.onPlayerHitsEnemyBullet(player, bullet),
    );
    this.kernel.collisions.watchOverlap(
      this.player,
      this.pickups,
      (player, pickup) => this.onPlayerCollectsPickup(player, pickup),
    );
  }

  private configureTimers(): void {
    for (const execution of this.weaponExecutions) {
      this.weaponFireEvents.push(
        this.kernel.clock.schedule({
          delayMs: execution.plan.fireIntervalMs,
          loop: true,
          callback: () => this.fireWeapon(execution),
        }),
      );
    }
    for (const execution of this.enemyWaveExecutions) {
      this.enemySpawnEvents.push(
        this.kernel.clock.schedule({
          delayMs: execution.plan.startMs,
          callback: () => this.startEnemyWave(execution),
        }),
      );
    }
    for (const execution of this.pickupExecutions) {
      this.pickupSpawnEvents.push(
        this.kernel.clock.schedule({
          delayMs: execution.plan.spawnMs,
          callback: () => this.spawnPickup(execution),
        }),
      );
    }
    this.kernel.clock.schedule({
      delayMs: demoRuntimeConfig.schedule.bossStartMs,
      callback: () => this.spawnBoss(),
    });
  }

  private configureTouchInput(): void {
    this.kernel.input.onPointerDown((pointer) => {
      this.dragPointerId = pointer.id;
    });
    this.kernel.input.onPointerMove((pointer) => {
      if (pointer.isDown && pointer.id === this.dragPointerId) {
        this.player.setPosition(
          this.kernel.viewport.clampX(pointer.worldX),
          this.kernel.viewport.clampY(pointer.worldY),
        );
      }
    });
    this.kernel.input.onPointerUp((pointer) => {
      if (pointer.id === this.dragPointerId) this.dragPointerId = undefined;
    });
  }

  private updatePlayerVelocity(): void {
    const direction = this.kernel.input.readDirection();
    this.player.setVelocity(
      direction.x * demoRuntimeConfig.player.moveSpeed,
      direction.y * demoRuntimeConfig.player.moveSpeed,
    );
  }

  private recycleOffscreenObjects(): void {
    this.projectiles.forEach((projectile) => {
      if (projectile.active && projectile.y < -20) {
        projectile.disableBody(true, true);
      }
    });
    this.enemies.forEach((enemy) => {
      if (enemy.active && enemy.y > this.kernel.viewport.height + 30) {
        this.destroyEnemy(enemy);
      }
    });
    this.enemyBullets.forEach((bullet) => {
      if (
        bullet.active &&
        (bullet.x < -30 ||
          bullet.x > this.kernel.viewport.width + 30 ||
          bullet.y < -30 ||
          bullet.y > this.kernel.viewport.height + 30)
      ) {
        bullet.disableBody(true, true);
      }
    });
    this.pickups.forEach((pickup) => {
      if (pickup.active && pickup.y > this.kernel.viewport.height + 30) {
        pickup.disableBody(true, true);
      }
    });
  }

  private fireWeapon(execution: WeaponExecution): void {
    if (this.ending || !this.player.active) return;
    execution.fireAttempts += 1;
    const emission = planPlayerWeaponEmission(execution.plan, {
      currentActiveProjectiles: this.projectiles.countActive(),
      maxActiveProjectiles: demoRuntimeConfig.resourceBudget.maxPlayerBullets,
    });
    let successfulThisFire = 0;
    const weapon = demoRuntimeConfig.weapons[execution.plan.sourceIndex];
    if (weapon === undefined) {
      throw new Error(`Missing weapon: ${execution.plan.weaponId}`);
    }
    const textureKey = textureKeyForQuery(
      demoRuntimeConfig,
      weapon.projectileAssetQueryId,
      "player-bullet",
    );
    for (const spawn of emission.spawns) {
      const projectile = this.projectiles.acquire(
        this.player.x + spawn.offsetX,
        this.player.y - 24,
        textureKey,
      ) as PlayerProjectile | null;
      if (!projectile) break;
      projectile.weaponIndex = execution.plan.sourceIndex;
      projectile.damage = spawn.damage + this.weaponPowerBonus;
      projectile
        .enableBody(
          true,
          this.player.x + spawn.offsetX,
          this.player.y - 24,
          true,
          true,
        )
        .setTexture(textureKey)
        .clearTint()
        .setVelocity(0, spawn.velocityY);
      fitSpriteToBox(projectile, 12, 24);
      this.useTexture(textureKey);
      successfulThisFire += 1;
      execution.lastProjectileSpeed = Math.abs(
        (projectile.body as Phaser.Physics.Arcade.Body).velocity.y,
      );
    }
    execution.successfulProjectiles += successfulThisFire;
    execution.droppedProjectiles +=
      emission.droppedCount + emission.spawns.length - successfulThisFire;
    execution.maxProjectilesPerFire = Math.max(
      execution.maxProjectilesPerFire,
      successfulThisFire,
    );
  }

  private spawnPickup(execution: PickupExecution): void {
    execution.spawnAttempts += 1;
    if (this.ending || !this.player.active) return;
    if (
      !canSpawnPickup(
        this.pickups.countActive(),
        demoRuntimeConfig.resourceBudget.maxPickups,
      )
    ) {
      execution.droppedByBudget += 1;
      return;
    }
    const pickup = this.pickups.acquire(
      this.player.x,
      Math.max(36, this.player.y - 90),
      textureKeyForQuery(
        demoRuntimeConfig,
        demoRuntimeConfig.pickups[execution.plan.sourceIndex]!.assetQueryId,
        "pickup",
      ),
    ) as PickupSprite | null;
    if (!pickup) {
      execution.droppedByBudget += 1;
      return;
    }
    pickup.pickupIndex = execution.plan.sourceIndex;
    const pickupTextureKey = textureKeyForQuery(
      demoRuntimeConfig,
      demoRuntimeConfig.pickups[execution.plan.sourceIndex]!.assetQueryId,
      "pickup",
    );
    pickup
      .enableBody(
        true,
        this.player.x,
        Math.max(36, this.player.y - 90),
        true,
        true,
      )
      .setTexture(pickupTextureKey)
      .setTint(pickupTints[execution.plan.effect])
      .setVelocity(0, execution.plan.fallSpeed);
    fitSpriteToBox(pickup, 28, 28);
    this.useTexture(pickupTextureKey);
    execution.successfulSpawns += 1;
  }

  private startEnemyWave(execution: EnemyWaveExecution): void {
    if (this.ending || this.boss?.active) return;
    execution.started = true;
    this.spawnEnemy(execution);
    if (execution.plan.spawnCount <= 1) return;
    this.enemySpawnEvents.push(
      this.kernel.clock.schedule({
        delayMs: execution.plan.spawnIntervalMs,
        repeat: execution.plan.spawnCount - 2,
        callback: () => this.spawnEnemy(execution),
      }),
    );
  }

  private spawnEnemy(execution: EnemyWaveExecution): void {
    execution.spawnAttempts += 1;
    if (this.ending || this.boss?.active) return;
    const wave = demoRuntimeConfig.enemyWaves[execution.plan.sourceIndex];
    if (!wave) throw new Error(`Missing enemy wave: ${execution.plan.waveId}`);
    if (
      this.countActiveEnemiesForWave(execution.plan.sourceIndex) >=
        Math.min(wave.maxAlive, demoRuntimeConfig.resourceBudget.maxEnemies) ||
      this.enemies.countActive() >= demoRuntimeConfig.resourceBudget.maxEnemies
    ) {
      return;
    }
    const enemy = this.enemies.create(
      planEnemySpawnX(
        this.kernel.viewport.width,
        execution.plan.sourceIndex,
        execution.spawnAttempts - 1,
      ),
      24,
      textureKeyForQuery(demoRuntimeConfig, wave.enemyAssetQueryId, "enemy"),
    ) as EnemySprite;
    const enemyTextureKey = textureKeyForQuery(
      demoRuntimeConfig,
      wave.enemyAssetQueryId,
      "enemy",
    );
    enemy.setTexture(enemyTextureKey);
    fitSpriteToBox(enemy, 40, 40);
    this.useTexture(enemyTextureKey);
    enemy.health = wave.health;
    enemy.waveIndex = execution.plan.sourceIndex;
    enemy.patternEvents = [];
    enemy.setVelocityY(wave.moveSpeed);
    execution.successfulSpawns += 1;
    this.startEnemyPatterns(enemy, execution);
  }

  private startEnemyPatterns(
    enemy: EnemySprite,
    execution: EnemyWaveExecution,
  ): void {
    for (const schedule of execution.patternSchedule) {
      const patternExecution =
        execution.patternExecutions[schedule.wavePatternIndex];
      if (!patternExecution) {
        throw new Error(
          `Missing wave pattern execution: ${execution.plan.waveId}/${schedule.patternId}`,
        );
      }
      patternExecution.emitterCount += 1;
      const emitter: EnemyPatternEmitter = {
        enemy,
        waveExecution: execution,
        schedule,
        emissionIndex: 0,
      };
      this.emitEnemyPattern(emitter);
      const remainingEmissions = schedule.emissionCount - 1;
      if (remainingEmissions > 0) {
        enemy.patternEvents.push(
          this.kernel.clock.schedule({
            delayMs: schedule.intervalMs,
            repeat: remainingEmissions - 1,
            callback: () => this.emitEnemyPattern(emitter),
          }),
        );
      }
    }
  }

  private emitEnemyPattern(emitter: EnemyPatternEmitter): void {
    if (!emitter.enemy.active || this.ending || this.boss?.active) {
      return;
    }
    this.emitEnemyBulletPattern({
      patternIndex: emitter.schedule.patternIndex,
      expectedPatternId: emitter.schedule.patternId,
      emissionIndex: emitter.emissionIndex,
      sourceX: emitter.enemy.x,
      sourceY: emitter.enemy.y + 20,
      sourceWaveIndex: emitter.waveExecution.plan.sourceIndex,
      sourceWavePatternIndex: emitter.schedule.wavePatternIndex,
    });
    emitter.emissionIndex += 1;
  }

  private countActiveEnemiesForWave(waveIndex: number): number {
    let count = 0;
    this.enemies.forEach((enemy) => {
      if (enemy.active && enemy.waveIndex === waveIndex) count += 1;
    });
    return count;
  }

  private stopEnemyWaves(): void {
    for (const event of this.enemySpawnEvents) event.cancel();
    this.enemySpawnEvents = [];
    this.enemies.forEach((enemy) => {
      this.stopEnemyPatternEvents(enemy);
    });
  }

  private stopEnemyPatternEvents(enemy: EnemySprite): void {
    for (const event of enemy.patternEvents ?? []) event.cancel();
    enemy.patternEvents = [];
  }

  private destroyEnemy(enemy: EnemySprite): void {
    this.stopEnemyPatternEvents(enemy);
    enemy.destroy();
  }

  private clearEnemies(): void {
    this.enemies.forEach((enemy) => {
      this.stopEnemyPatternEvents(enemy);
    });
    this.enemies.clear(true);
  }

  private spawnBoss(): void {
    if (this.ending || this.boss?.active) return;
    this.stopEnemyWaves();
    this.clearEnemies();
    this.bossHealth = demoRuntimeConfig.boss.maxHealth;
    const bossTextureKey = textureKeyForQuery(
      demoRuntimeConfig,
      demoRuntimeConfig.boss.assetQueryId,
      "boss",
    );
    this.boss = this.kernel.entities.createSprite(
      this.kernel.viewport.width / 2,
      120,
      bossTextureKey,
    );
    fitSpriteToBox(this.boss, 96, 72);
    this.useTexture(bossTextureKey);
    this.boss.setCollideWorldBounds(true).setBounce(1, 0);
    this.startBossPhase(0);
  }

  private startBossPhase(phaseIndex: number): void {
    const phase = demoRuntimeConfig.boss.phases[phaseIndex];
    if (!phase || !this.boss) return;
    this.bossPhaseIndex = phaseIndex;
    this.stopBossPatterns();
    this.bossEmissionIndices.clear();
    this.boss.setVelocityX((phaseIndex % 2 === 0 ? 1 : -1) * phase.moveSpeed);
    this.updateBossText();
    const schedule = planBossPatternSchedule(
      phase,
      demoRuntimeConfig.bulletPatterns,
    );
    for (const entry of schedule) {
      this.bossEmissionIndices.set(entry.phasePatternIndex, 0);
      this.emitBossPattern(entry);
      const remainingEmissions = entry.emissionCount - 1;
      if (remainingEmissions > 0) {
        this.bossPatternEvents.push(
          this.kernel.clock.schedule({
            delayMs: entry.intervalMs,
            repeat: remainingEmissions - 1,
            callback: () => this.emitBossPattern(entry),
          }),
        );
      }
    }
  }

  private emitBossPattern(entry: ScheduledBossPattern): void {
    if (!this.boss?.active || this.ending) return;
    const emissionIndex =
      this.bossEmissionIndices.get(entry.phasePatternIndex) ?? 0;
    this.emitEnemyBulletPattern({
      patternIndex: entry.patternIndex,
      expectedPatternId: entry.patternId,
      emissionIndex,
      sourceX: this.boss.x,
      sourceY: this.boss.y + 42,
      sourceWaveIndex: -1,
      sourceWavePatternIndex: -1,
    });
    this.bossEmissionIndices.set(entry.phasePatternIndex, emissionIndex + 1);
  }

  private emitEnemyBulletPattern(input: {
    patternIndex: number;
    expectedPatternId?: string;
    emissionIndex: number;
    sourceX: number;
    sourceY: number;
    sourceWaveIndex: number;
    sourceWavePatternIndex: number;
  }): void {
    const pattern = demoRuntimeConfig.bulletPatterns[input.patternIndex];
    if (
      !pattern ||
      (input.expectedPatternId !== undefined &&
        pattern.id !== input.expectedPatternId)
    ) {
      throw new Error(
        `Missing enemy bullet pattern: ${input.expectedPatternId ?? input.patternIndex}`,
      );
    }
    const globalExecution = this.bulletPatternExecutions[input.patternIndex];
    if (!globalExecution) {
      throw new Error(`Missing bullet pattern execution: ${pattern.id}`);
    }
    const sourceWaveExecution =
      input.sourceWaveIndex < 0
        ? undefined
        : this.enemyWaveExecutions.find(
            (execution) => execution.plan.sourceIndex === input.sourceWaveIndex,
          );
    if (input.sourceWaveIndex >= 0 && sourceWaveExecution === undefined) {
      throw new Error(`Missing source enemy wave: ${input.sourceWaveIndex}`);
    }
    const sourcePatternExecution =
      input.sourceWavePatternIndex < 0
        ? undefined
        : sourceWaveExecution?.patternExecutions[input.sourceWavePatternIndex];
    if (
      input.sourceWavePatternIndex >= 0 &&
      sourcePatternExecution === undefined
    ) {
      throw new Error(
        `Missing source wave pattern: ${input.sourceWaveIndex}/${input.sourceWavePatternIndex}`,
      );
    }
    const baseAngleRadians =
      pattern.pattern === "aimed"
        ? Phaser.Math.Angle.Between(
            input.sourceX,
            input.sourceY,
            this.player.x,
            this.player.y,
          )
        : Math.PI / 2;
    const plan = planBulletEmission(pattern, {
      baseAngleRadians,
      emissionIndex: input.emissionIndex,
      maxActiveBullets: demoRuntimeConfig.resourceBudget.maxEnemyBullets,
      currentActiveBullets: this.enemyBullets.countActive(),
    });
    const executions: PatternExecutionMetrics[] = [globalExecution];
    if (sourcePatternExecution) executions.push(sourcePatternExecution);
    for (const execution of executions) {
      execution.emissionAttempts += 1;
      execution.requestedBullets += plan.requestedCount;
      execution.plannedBullets += plan.spawns.length;
      execution.droppedByBudget += plan.droppedCount;
    }

    let successfulSpawns = 0;
    for (const spawn of plan.spawns) {
      const enemyProjectileQueryId =
        demoRuntimeConfig.resolvedAssets.mode === "catalog"
          ? demoRuntimeConfig.resolvedAssets.enemyProjectileQueryId
          : "";
      const enemyProjectileTextureKey = textureKeyForQuery(
        demoRuntimeConfig,
        enemyProjectileQueryId,
        "enemy-bullet",
      );
      const bullet = this.enemyBullets.acquire(
        input.sourceX,
        input.sourceY,
        enemyProjectileTextureKey,
      ) as EnemyBullet | null;
      if (!bullet) break;
      bullet.grazed = false;
      bullet.patternIndex = input.patternIndex;
      bullet.spawnX = input.sourceX;
      bullet.spawnY = input.sourceY;
      bullet.movementRecorded = false;
      bullet.sourceWaveIndex = input.sourceWaveIndex;
      bullet.sourceWavePatternIndex = input.sourceWavePatternIndex;
      bullet
        .enableBody(true, input.sourceX, input.sourceY, true, true)
        .setTexture(enemyProjectileTextureKey)
        .setTint(Number.parseInt(pattern.color.slice(1), 16))
        .setVelocity(spawn.velocityX, spawn.velocityY);
      fitSpriteToBox(bullet, 14, 24);
      this.configureCircularBody(bullet, this.enemyBulletHitRadius(bullet));
      this.useTexture(enemyProjectileTextureKey);
      successfulSpawns += 1;
      if (pattern.pattern === "aimed") {
        const aimError = Math.abs(
          Phaser.Math.Angle.Wrap(spawn.angleRadians - baseAngleRadians),
        );
        for (const execution of executions) {
          execution.minimumAimErrorRadians =
            execution.minimumAimErrorRadians === null
              ? aimError
              : Math.min(execution.minimumAimErrorRadians, aimError);
        }
      }
    }
    for (const execution of executions) {
      execution.successfulSpawns += successfulSpawns;
      execution.droppedByPool += plan.spawns.length - successfulSpawns;
    }
    this.peakActiveEnemyBullets = Math.max(
      this.peakActiveEnemyBullets,
      this.enemyBullets.countActive(),
    );
  }

  private stopBossPatterns(): void {
    for (const event of this.bossPatternEvents) event.cancel();
    this.bossPatternEvents = [];
  }

  private recordEnemyBulletMovement(): void {
    this.enemyBullets.forEach((bullet) => {
      if (!bullet.active) return;
      const execution = this.bulletPatternExecutions[bullet.patternIndex];
      if (!execution) return;
      const sourcePatternExecution =
        bullet.sourceWaveIndex < 0
          ? undefined
          : this.enemyWaveExecutions.find(
              (waveExecution) =>
                waveExecution.plan.sourceIndex === bullet.sourceWaveIndex,
            )?.patternExecutions[bullet.sourceWavePatternIndex];
      const distance = Math.hypot(
        bullet.x - bullet.spawnX,
        bullet.y - bullet.spawnY,
      );
      execution.maxTravelDistance = Math.max(
        execution.maxTravelDistance,
        distance,
      );
      if (sourcePatternExecution) {
        sourcePatternExecution.maxTravelDistance = Math.max(
          sourcePatternExecution.maxTravelDistance,
          distance,
        );
      }
      if (!bullet.movementRecorded && distance >= 8) {
        bullet.movementRecorded = true;
        execution.movedBullets += 1;
        if (sourcePatternExecution) sourcePatternExecution.movedBullets += 1;
      }
    });
    this.peakActiveEnemyBullets = Math.max(
      this.peakActiveEnemyBullets,
      this.enemyBullets.countActive(),
    );
  }

  private onProjectileHitsEnemy(
    projectileObject: ArcadeCollisionObject,
    enemyObject: ArcadeCollisionObject,
  ): void {
    const projectile = projectileObject as PlayerProjectile;
    const enemy = enemyObject as EnemySprite;
    if (!projectile.active) return;
    this.recordProjectileHit(projectile);
    projectile.disableBody(true, true);
    enemy.health -= projectile.damage;
    if (enemy.health <= 0) {
      this.destroyEnemy(enemy);
      const wave = demoRuntimeConfig.enemyWaves[enemy.waveIndex];
      if (!wave)
        throw new Error(`Missing enemy wave index: ${enemy.waveIndex}`);
      this.applyDefeatScore(wave.scoreValue);
    }
  }

  private onProjectileHitsBoss(
    projectileObject: ArcadeCollisionObject,
    bossObject: ArcadeCollisionObject,
  ): void {
    const projectile = projectileObject as PlayerProjectile;
    const boss = bossObject as Phaser.Physics.Arcade.Sprite;
    this.applyProjectileHitToBoss(projectile, boss);
  }

  private applyProjectileHitToBoss(
    projectile: PlayerProjectile,
    boss: Phaser.Physics.Arcade.Sprite,
  ): void {
    if (!projectile.active || !boss.active || boss !== this.boss) return;
    this.recordProjectileHit(projectile);
    projectile.disableBody(true, true);
    this.bossHealth = Math.max(0, this.bossHealth - projectile.damage);
    if (this.bossHealth === 0) {
      this.stopBossPatterns();
      boss.destroy();
      this.bossDefeated = true;
      this.applyDefeatScore(demoRuntimeConfig.boss.scoreValue);
      return;
    }

    const healthRatio = this.bossHealth / demoRuntimeConfig.boss.maxHealth;
    const selectedPhaseIndex = selectBossPhaseIndex(
      demoRuntimeConfig.boss.phases,
      healthRatio,
    );
    if (selectedPhaseIndex > this.bossPhaseIndex) {
      this.startBossPhase(selectedPhaseIndex);
    } else {
      this.updateBossText();
    }
  }

  private recordProjectileHit(projectile: PlayerProjectile): void {
    const execution = this.weaponExecutions[projectile.weaponIndex];
    if (!execution) {
      throw new Error(`Missing weapon index: ${projectile.weaponIndex}`);
    }
    execution.hitCount += 1;
    execution.damageDealt += projectile.damage;
  }

  private onPlayerHitsEnemy(
    _playerObject: ArcadeCollisionObject,
    enemyObject: ArcadeCollisionObject,
  ): void {
    this.destroyEnemy(enemyObject as EnemySprite);
    this.damagePlayer();
  }

  private onPlayerHitsEnemyBullet(
    _playerObject: ArcadeCollisionObject,
    bulletObject: ArcadeCollisionObject,
  ): void {
    (bulletObject as Phaser.Physics.Arcade.Sprite).disableBody(true, true);
    this.damagePlayer();
  }

  private onPlayerCollectsPickup(
    _playerObject: ArcadeCollisionObject,
    pickupObject: ArcadeCollisionObject,
  ): void {
    const pickup = pickupObject as PickupSprite;
    if (!pickup.active || this.ending) return;
    const execution = this.pickupExecutions[pickup.pickupIndex];
    if (!execution) {
      throw new Error(`Missing pickup index: ${pickup.pickupIndex}`);
    }
    pickup.disableBody(true, true);
    const result = applyPickupEffect(execution.plan, {
      health: this.health,
      maxHealth: demoRuntimeConfig.player.maxHealth,
      weaponPowerBonus: this.weaponPowerBonus,
      shieldStrength: this.shieldStrength,
      score: this.scoringState.score,
    });
    this.health = result.state.health;
    this.weaponPowerBonus = result.state.weaponPowerBonus;
    this.shieldStrength = result.state.shieldStrength;
    this.scoringState = awardFlatScore(
      this.scoringState,
      result.state.score - this.scoringState.score,
    );
    execution.collections += 1;
    execution.appliedValue += result.appliedValue;
    const effectTextureKey = addRuntimeEffect(
      this,
      demoRuntimeConfig,
      this.player.x,
      this.player.y,
      pickupTints[execution.plan.effect],
    );
    if (effectTextureKey !== null) this.useTexture(effectTextureKey);
    this.updateHealthText();
    this.updateScoreText();
  }

  private damagePlayer(): void {
    if (this.kernel.clock.nowMs() < this.invulnerableUntil || this.ending)
      return;
    this.invulnerableUntil = this.kernel.clock.nowMs() + 500;
    const result = applyShieldedPlayerDamage(
      { health: this.health, shieldStrength: this.shieldStrength },
      1,
    );
    this.health = result.health;
    this.shieldStrength = result.shieldStrength;
    this.updateHealthText();
    this.kernel.rendering.shakeCamera(100, 0.008);
  }

  private updateHealthText(): void {
    this.healthText.setText(
      `生命 ${this.health} · 护盾 ${this.shieldStrength}`,
    );
  }

  private updateScoreText(): void {
    const multiplier = Number.isInteger(this.scoringState.comboMultiplier)
      ? this.scoringState.comboMultiplier.toFixed(0)
      : this.scoringState.comboMultiplier.toFixed(1);
    this.scoreText.setText(
      `得分 ${this.scoringState.score} · x${multiplier} · 擦${this.scoringState.grazeCount}`,
    );
  }

  private applyDefeatScore(basePoints: number): void {
    this.scoringState = awardDefeatScore(
      demoRuntimeConfig.scoring,
      this.scoringState,
      basePoints,
      this.kernel.clock.nowMs(),
    ).state;
    this.updateScoreText();
  }

  private checkEnemyBulletGrazes(): void {
    if (this.ending || !this.player.active) return;
    this.enemyBullets.forEach((bullet) => {
      if (!bullet.active || bullet.grazed) return;
      const bulletRadius = this.enemyBulletHitRadius(bullet);
      const distance = Math.hypot(
        this.player.x - bullet.x,
        this.player.y - bullet.y,
      );
      if (
        this.minimumEnemyBulletDistance === null ||
        distance < this.minimumEnemyBulletDistance
      ) {
        this.minimumEnemyBulletDistance = distance;
        this.hitRadiusAtMinimumDistance =
          demoRuntimeConfig.player.hitboxRadius + bulletRadius;
      }
      if (
        isGrazeContact({
          playerX: this.player.x,
          playerY: this.player.y,
          playerHitboxRadius: demoRuntimeConfig.player.hitboxRadius,
          bulletX: bullet.x,
          bulletY: bullet.y,
          bulletRadius,
        })
      ) {
        bullet.grazed = true;
        this.scoringState = awardGrazeScore(
          demoRuntimeConfig.scoring,
          this.scoringState,
        );
        this.updateScoreText();
      }
    });
  }

  private updateBossText(): void {
    const phase = demoRuntimeConfig.boss.phases[this.bossPhaseIndex];
    this.bossText
      .setText(`Boss ${Math.ceil(this.bossHealth)} · ${phase?.id ?? ""}`)
      .setVisible(true);
  }

  private readRuntimeSnapshot(): ShooterPlaySnapshot {
    let nearestPlayerBulletY: number | null = null;
    this.projectiles.forEach((projectile) => {
      if (
        projectile.active &&
        (nearestPlayerBulletY === null || projectile.y < nearestPlayerBulletY)
      ) {
        nearestPlayerBulletY = projectile.y;
      }
    });
    return {
      scene: "play",
      elapsedMs: this.elapsedMs(),
      score: this.scoringState.score,
      playerHealth: this.health,
      playerX: this.player.x,
      playerY: this.player.y,
      bossHealth: this.boss?.active ? this.bossHealth : null,
      bossX: this.boss?.active ? this.boss.x : null,
      bossY: this.boss?.active ? this.boss.y : null,
      nearestPlayerBulletY,
      bossPhaseId:
        demoRuntimeConfig.boss.phases[this.bossPhaseIndex]?.id ?? null,
      activeEnemies: this.enemies.countActive(),
      activeEnemyBullets: this.enemyBullets.countActive(),
      maxEnemyBullets: demoRuntimeConfig.resourceBudget.maxEnemyBullets,
      peakActiveEnemyBullets: this.peakActiveEnemyBullets,
      activePlayerBullets: this.projectiles.countActive(),
      maxPlayerBullets: demoRuntimeConfig.resourceBudget.maxPlayerBullets,
      activePickups: this.pickups.countActive(),
      maxPickups: demoRuntimeConfig.resourceBudget.maxPickups,
      weaponPowerBonus: this.weaponPowerBonus,
      shieldStrength: this.shieldStrength,
      scoring: this.readScoringSnapshot(),
      weapons: this.weaponExecutions.map((execution) => ({
        id: execution.plan.weaponId,
        fireIntervalMs: execution.plan.fireIntervalMs,
        projectileSpeed: execution.plan.projectileSpeed,
        damage: execution.plan.damage,
        projectileCount: execution.plan.projectileCount,
        fireAttempts: execution.fireAttempts,
        successfulProjectiles: execution.successfulProjectiles,
        droppedProjectiles: execution.droppedProjectiles,
        maxProjectilesPerFire: execution.maxProjectilesPerFire,
        hitCount: execution.hitCount,
        damageDealt: execution.damageDealt,
        lastProjectileSpeed: execution.lastProjectileSpeed,
      })),
      enemyWaves: this.enemyWaveExecutions.map((execution) => {
        const wave = demoRuntimeConfig.enemyWaves[execution.plan.sourceIndex]!;
        return {
          id: execution.plan.waveId,
          startMs: execution.plan.startMs,
          spawnIntervalMs: execution.plan.spawnIntervalMs,
          health: wave.health,
          moveSpeed: wave.moveSpeed,
          started: execution.started,
          spawnAttempts: execution.spawnAttempts,
          successfulSpawns: execution.successfulSpawns,
          patterns: execution.patternExecutions.map((patternExecution) => {
            const pattern =
              demoRuntimeConfig.bulletPatterns[
                patternExecution.schedule.patternIndex
              ];
            if (!pattern) {
              throw new Error(
                `Missing wave snapshot pattern: ${patternExecution.schedule.patternId}`,
              );
            }
            return {
              id: pattern.id,
              pattern: pattern.pattern,
              emitterCount: patternExecution.emitterCount,
              emissionAttempts: patternExecution.emissionAttempts,
              requestedBullets: patternExecution.requestedBullets,
              plannedBullets: patternExecution.plannedBullets,
              successfulSpawns: patternExecution.successfulSpawns,
              droppedByBudget: patternExecution.droppedByBudget,
              droppedByPool: patternExecution.droppedByPool,
              movedBullets: patternExecution.movedBullets,
              maxTravelDistance: patternExecution.maxTravelDistance,
              minimumAimErrorRadians: patternExecution.minimumAimErrorRadians,
            };
          }),
        };
      }),
      bulletPatterns: this.bulletPatternExecutions.map((execution) => ({
        ...execution,
      })),
      pickups: this.pickupExecutions.map((execution) => ({
        id: execution.plan.pickupId,
        effect: execution.plan.effect,
        value: execution.plan.value,
        spawnMs: execution.plan.spawnMs,
        fallSpeed: execution.plan.fallSpeed,
        spawnAttempts: execution.spawnAttempts,
        successfulSpawns: execution.successfulSpawns,
        droppedByBudget: execution.droppedByBudget,
        collections: execution.collections,
        appliedValue: execution.appliedValue,
      })),
      assets: {
        mode: demoRuntimeConfig.resolvedAssets.mode,
        ...this.kernel.assets.snapshot(),
      },
      ending: this.ending,
    };
  }

  private useTexture(textureKey: string): void {
    this.kernel.assets.markUsed(textureKey);
  }

  private readScoringSnapshot(): ScoringExecutionSnapshot {
    return {
      comboWindowMs: demoRuntimeConfig.scoring.comboWindowMs,
      comboMultiplierCap: demoRuntimeConfig.scoring.comboMultiplierCap,
      grazePoints: demoRuntimeConfig.scoring.grazePoints,
      comboCount: this.scoringState.comboCount,
      comboMultiplier: this.scoringState.comboMultiplier,
      maxComboMultiplier: this.scoringState.maxComboMultiplier,
      defeatCount: this.scoringState.defeatCount,
      defeatScore: this.scoringState.defeatScore,
      grazeCount: this.scoringState.grazeCount,
      grazeScore: this.scoringState.grazeScore,
      minimumEnemyBulletDistance: this.minimumEnemyBulletDistance,
      hitRadiusAtMinimumDistance: this.hitRadiusAtMinimumDistance,
    };
  }

  private elapsedMs(): number {
    return Math.max(0, this.kernel.clock.nowMs() - this.runStartedAtMs);
  }

  private evaluateOutcome(): void {
    if (this.ending) return;
    const outcome = evaluateGameOutcome(
      demoRuntimeConfig.winCondition,
      demoRuntimeConfig.loseCondition,
      {
        elapsedMs: this.elapsedMs(),
        score: this.scoringState.score,
        playerHealth: this.health,
        bossDefeated: this.bossDefeated,
      },
    );
    if (outcome !== null) this.finish(outcome);
  }

  private finish(outcome: GameOutcome): void {
    if (this.ending) return;
    this.ending = true;
    this.stopEnemyWaves();
    for (const event of this.weaponFireEvents) event.cancel();
    this.weaponFireEvents = [];
    for (const event of this.pickupSpawnEvents) event.cancel();
    this.pickupSpawnEvents = [];
    this.stopBossPatterns();
    this.kernel.collisions.pause();
    this.kernel.lifecycle.startScene("end", {
      won: outcome.won,
      outcomeReason: outcome.reason,
      elapsedMs: outcome.elapsedMs,
      score: this.scoringState.score,
      scoring: this.readScoringSnapshot(),
    });
  }

  private hudStyle(): RuntimeTextStyle {
    return {
      color: "#f4f7ff",
      fontFamily: "system-ui, sans-serif",
      fontSize: "20px",
    };
  }
}
