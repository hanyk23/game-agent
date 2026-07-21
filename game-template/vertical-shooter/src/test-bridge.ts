export type EnemyWavePatternExecutionSnapshot = Readonly<{
  id: string;
  pattern: BulletPatternExecutionSnapshot["pattern"];
  emitterCount: number;
  emissionAttempts: number;
  requestedBullets: number;
  plannedBullets: number;
  successfulSpawns: number;
  droppedByBudget: number;
  droppedByPool: number;
  movedBullets: number;
  maxTravelDistance: number;
  minimumAimErrorRadians: number | null;
}>;

export type EnemyWaveExecutionSnapshot = Readonly<{
  id: string;
  startMs: number;
  spawnIntervalMs: number;
  health: number;
  moveSpeed: number;
  started: boolean;
  spawnAttempts: number;
  successfulSpawns: number;
  patterns: readonly EnemyWavePatternExecutionSnapshot[];
}>;

export type WeaponExecutionSnapshot = Readonly<{
  id: string;
  fireIntervalMs: number;
  projectileSpeed: number;
  damage: number;
  projectileCount: number;
  fireAttempts: number;
  successfulProjectiles: number;
  droppedProjectiles: number;
  maxProjectilesPerFire: number;
  hitCount: number;
  damageDealt: number;
  lastProjectileSpeed: number | null;
}>;

export type PickupExecutionSnapshot = Readonly<{
  id: string;
  effect: "heal" | "weaponPower" | "shield" | "scoreBonus";
  value: number;
  spawnMs: number;
  fallSpeed: number;
  spawnAttempts: number;
  successfulSpawns: number;
  droppedByBudget: number;
  collections: number;
  appliedValue: number;
}>;

export type BulletPatternExecutionSnapshot = Readonly<{
  id: string;
  pattern:
    | "radial"
    | "spiral"
    | "fan"
    | "aimed"
    | "wave"
    | "rain"
    | "rotatingRing"
    | "burst";
  emissionAttempts: number;
  requestedBullets: number;
  plannedBullets: number;
  successfulSpawns: number;
  droppedByBudget: number;
  droppedByPool: number;
  movedBullets: number;
  maxTravelDistance: number;
  minimumAimErrorRadians: number | null;
}>;

export type RuntimeAssetExecutionSnapshot = Readonly<{
  mode: "legacy-geometric" | "catalog";
  expectedTextureKeys: readonly string[];
  loadedTextureKeys: readonly string[];
  usedTextureKeys: readonly string[];
}>;

export type ScoringExecutionSnapshot = Readonly<{
  comboWindowMs: number;
  comboMultiplierCap: number;
  grazePoints: number;
  comboCount: number;
  comboMultiplier: number;
  maxComboMultiplier: number;
  defeatCount: number;
  defeatScore: number;
  grazeCount: number;
  grazeScore: number;
  minimumEnemyBulletDistance: number | null;
  hitRadiusAtMinimumDistance: number | null;
}>;

export type ShooterPlaySnapshot = Readonly<{
  scene: "play";
  elapsedMs: number;
  score: number;
  playerHealth: number;
  playerX: number;
  playerY: number;
  bossHealth: number | null;
  bossX: number | null;
  bossY: number | null;
  nearestPlayerBulletY: number | null;
  bossPhaseId: string | null;
  activeEnemies: number;
  activeEnemyBullets: number;
  maxEnemyBullets: number;
  peakActiveEnemyBullets: number;
  activePlayerBullets: number;
  maxPlayerBullets: number;
  activePickups: number;
  maxPickups: number;
  weaponPowerBonus: number;
  shieldStrength: number;
  scoring: ScoringExecutionSnapshot;
  weapons: readonly WeaponExecutionSnapshot[];
  enemyWaves: readonly EnemyWaveExecutionSnapshot[];
  bulletPatterns: readonly BulletPatternExecutionSnapshot[];
  pickups: readonly PickupExecutionSnapshot[];
  assets: RuntimeAssetExecutionSnapshot;
  ending: boolean;
}>;

export type ShooterRuntimeSnapshot =
  | Readonly<{ scene: "start" }>
  | ShooterPlaySnapshot
  | Readonly<{
      scene: "end";
      won: boolean;
      outcomeReason:
        | "bossDefeated"
        | "surviveMs"
        | "scoreReached"
        | "healthDepleted"
        | "timeExpired";
      elapsedMs: number;
      score: number;
      scoring: ScoringExecutionSnapshot;
    }>;

export type ShooterTestBridge = Readonly<{
  getSnapshot: () => ShooterRuntimeSnapshot | null;
  getBatch1Snapshot: () =>
    | import("./runtime-kernel/batch1-browser-runtime.js").Batch1BrowserSnapshot
    | null;
  getBatch2Snapshot: () =>
    | import("./runtime-kernel/batch2-browser-runtime.js").Batch2BrowserSnapshot
    | null;
  getBatch2FormationSnapshot: () =>
    | import("./runtime-kernel/batch2-formation-browser-runtime.js").Batch2FormationBrowserSnapshot
    | null;
  getBatch2ProgressionSnapshot: () =>
    | import("./runtime-kernel/batch2-progression-browser-conformance.js").Batch2ProgressionBrowserSnapshot
    | null;
  getBatch2NearestSnapshot: () =>
    | import("./runtime-kernel/batch2-nearest-browser-conformance.js").Batch2NearestBrowserConformanceSnapshot
    | null;
  getBatch2DefenseSnapshot: () =>
    | import("./runtime-kernel/batch2-defense-browser-runtime.js").Batch2DefenseBrowserRuntimeSnapshot
    | null;
  getMixedV13ConformanceSnapshot: () =>
    | import("./runtime-kernel/mixed-v13-browser-conformance.js").MixedV13BrowserConformanceSnapshot
    | null;
  getMixedV14ConformanceSnapshot: () =>
    | import("./runtime-kernel/mixed-v14-browser-conformance.js").MixedV14BrowserConformanceSnapshot
    | null;
}>;

declare global {
  interface Window {
    readonly __SHOOTER_TEST__?: ShooterTestBridge;
  }
}

let snapshotReader: (() => ShooterRuntimeSnapshot) | undefined;
let batch1SnapshotReader:
  | (() => import("./runtime-kernel/batch1-browser-runtime.js").Batch1BrowserSnapshot)
  | undefined;
let batch2SnapshotReader:
  | (() => import("./runtime-kernel/batch2-browser-runtime.js").Batch2BrowserSnapshot)
  | undefined;
let batch2FormationSnapshotReader:
  | (() => import("./runtime-kernel/batch2-formation-browser-runtime.js").Batch2FormationBrowserSnapshot)
  | undefined;
let batch2ProgressionSnapshotReader:
  | (() => import("./runtime-kernel/batch2-progression-browser-conformance.js").Batch2ProgressionBrowserSnapshot)
  | undefined;
let batch2NearestSnapshotReader:
  | (() => import("./runtime-kernel/batch2-nearest-browser-conformance.js").Batch2NearestBrowserConformanceSnapshot)
  | undefined;
let batch2DefenseSnapshotReader:
  | (() => import("./runtime-kernel/batch2-defense-browser-runtime.js").Batch2DefenseBrowserRuntimeSnapshot)
  | undefined;
let mixedV13ConformanceSnapshotReader:
  | (() => import("./runtime-kernel/mixed-v13-browser-conformance.js").MixedV13BrowserConformanceSnapshot)
  | undefined;
let mixedV14ConformanceSnapshotReader:
  | (() => import("./runtime-kernel/mixed-v14-browser-conformance.js").MixedV14BrowserConformanceSnapshot)
  | undefined;

function freezeSnapshot(
  snapshot: ShooterRuntimeSnapshot,
): ShooterRuntimeSnapshot {
  if (snapshot.scene !== "play") return Object.freeze({ ...snapshot });
  return Object.freeze({
    ...snapshot,
    weapons: Object.freeze(
      snapshot.weapons.map((weapon) => Object.freeze({ ...weapon })),
    ),
    enemyWaves: Object.freeze(
      snapshot.enemyWaves.map((wave) =>
        Object.freeze({
          ...wave,
          patterns: Object.freeze(
            wave.patterns.map((pattern) => Object.freeze({ ...pattern })),
          ),
        }),
      ),
    ),
    bulletPatterns: Object.freeze(
      snapshot.bulletPatterns.map((pattern) => Object.freeze({ ...pattern })),
    ),
    pickups: Object.freeze(
      snapshot.pickups.map((pickup) => Object.freeze({ ...pickup })),
    ),
    scoring: Object.freeze({ ...snapshot.scoring }),
    assets: Object.freeze({
      ...snapshot.assets,
      expectedTextureKeys: Object.freeze([
        ...snapshot.assets.expectedTextureKeys,
      ]),
      loadedTextureKeys: Object.freeze([...snapshot.assets.loadedTextureKeys]),
      usedTextureKeys: Object.freeze([...snapshot.assets.usedTextureKeys]),
    }),
  });
}

export function installReadOnlyTestBridge(): void {
  const enabled =
    import.meta.env.DEV || import.meta.env.VITE_SHOOTER_TEST_BRIDGE === "1";
  if (!enabled || window.__SHOOTER_TEST__) return;

  const bridge = Object.freeze({
    getSnapshot: (): ShooterRuntimeSnapshot | null =>
      snapshotReader ? freezeSnapshot(snapshotReader()) : null,
    getBatch1Snapshot: () => batch1SnapshotReader?.() ?? null,
    getBatch2Snapshot: () => batch2SnapshotReader?.() ?? null,
    getBatch2FormationSnapshot: () => batch2FormationSnapshotReader?.() ?? null,
    getBatch2ProgressionSnapshot: () =>
      batch2ProgressionSnapshotReader?.() ?? null,
    getBatch2NearestSnapshot: () => batch2NearestSnapshotReader?.() ?? null,
    getBatch2DefenseSnapshot: () => batch2DefenseSnapshotReader?.() ?? null,
    getMixedV13ConformanceSnapshot: () =>
      mixedV13ConformanceSnapshotReader?.() ?? null,
    getMixedV14ConformanceSnapshot: () =>
      mixedV14ConformanceSnapshotReader?.() ?? null,
  });
  Object.defineProperty(window, "__SHOOTER_TEST__", {
    configurable: false,
    enumerable: false,
    value: bridge,
    writable: false,
  });
}

export function registerBatch2SnapshotReader(
  readSnapshot: () => import("./runtime-kernel/batch2-browser-runtime.js").Batch2BrowserSnapshot,
): () => void {
  batch2SnapshotReader = readSnapshot;
  return () => {
    if (batch2SnapshotReader === readSnapshot) batch2SnapshotReader = undefined;
  };
}

export function registerBatch2FormationSnapshotReader(
  readSnapshot: () => import("./runtime-kernel/batch2-formation-browser-runtime.js").Batch2FormationBrowserSnapshot,
): () => void {
  batch2FormationSnapshotReader = readSnapshot;
  return () => {
    if (batch2FormationSnapshotReader === readSnapshot)
      batch2FormationSnapshotReader = undefined;
  };
}

export function registerBatch2ProgressionSnapshotReader(
  readSnapshot: () => import("./runtime-kernel/batch2-progression-browser-conformance.js").Batch2ProgressionBrowserSnapshot,
): () => void {
  batch2ProgressionSnapshotReader = readSnapshot;
  return () => {
    if (batch2ProgressionSnapshotReader === readSnapshot)
      batch2ProgressionSnapshotReader = undefined;
  };
}

export function registerBatch2NearestSnapshotReader(
  readSnapshot: () => import("./runtime-kernel/batch2-nearest-browser-conformance.js").Batch2NearestBrowserConformanceSnapshot,
): () => void {
  batch2NearestSnapshotReader = readSnapshot;
  return () => {
    if (batch2NearestSnapshotReader === readSnapshot)
      batch2NearestSnapshotReader = undefined;
  };
}

export function registerBatch2DefenseSnapshotReader(
  readSnapshot: () => import("./runtime-kernel/batch2-defense-browser-runtime.js").Batch2DefenseBrowserRuntimeSnapshot,
): () => void {
  batch2DefenseSnapshotReader = readSnapshot;
  return () => {
    if (batch2DefenseSnapshotReader === readSnapshot)
      batch2DefenseSnapshotReader = undefined;
  };
}

export function registerBatch1SnapshotReader(
  readSnapshot: () => import("./runtime-kernel/batch1-browser-runtime.js").Batch1BrowserSnapshot,
): () => void {
  batch1SnapshotReader = readSnapshot;
  return () => {
    if (batch1SnapshotReader === readSnapshot) batch1SnapshotReader = undefined;
  };
}

export function registerMixedV13ConformanceSnapshotReader(
  readSnapshot: () => import("./runtime-kernel/mixed-v13-browser-conformance.js").MixedV13BrowserConformanceSnapshot,
): () => void {
  mixedV13ConformanceSnapshotReader = readSnapshot;
  return () => {
    if (mixedV13ConformanceSnapshotReader === readSnapshot)
      mixedV13ConformanceSnapshotReader = undefined;
  };
}

export function registerMixedV14ConformanceSnapshotReader(
  readSnapshot: () => import("./runtime-kernel/mixed-v14-browser-conformance.js").MixedV14BrowserConformanceSnapshot,
): () => void {
  mixedV14ConformanceSnapshotReader = readSnapshot;
  return () => {
    if (mixedV14ConformanceSnapshotReader === readSnapshot)
      mixedV14ConformanceSnapshotReader = undefined;
  };
}

export function registerRuntimeSnapshotReader(
  readSnapshot: () => ShooterRuntimeSnapshot,
): () => void {
  snapshotReader = readSnapshot;
  return () => {
    if (snapshotReader === readSnapshot) snapshotReader = undefined;
  };
}
