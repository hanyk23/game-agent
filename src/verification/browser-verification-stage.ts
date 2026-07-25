import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createServer, type Server } from "node:http";
import { lstat, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { type AddressInfo } from "node:net";
import path from "node:path";

import {
  chromium,
  type Browser,
  type CDPSession,
  type Page,
} from "@playwright/test";

import { parseShooterGameSpec } from "../requirements/shooter-game-spec.js";
import { digestDirectory, sha256File } from "../runs/artifact-hash.js";
import {
  RunManifestSchema,
  transitionRunManifest,
  type RunManifest,
} from "../runs/run-manifest.js";
import { verifySpecEvidenceChain } from "../runs/spec-evidence-chain.js";
import {
  createVerificationFinding,
  type VerificationFinding,
} from "./verification-finding.js";
import {
  BrowserAssertionProfileSchema,
  caseAwareEndSnapshotIssues,
  caseAwarePlaySnapshotIssues,
  deriveCaseAwareBrowserAssertions,
  type BrowserAssertionProfile,
  type CaseAwareBrowserAssertions,
} from "./browser-assertion-profile.js";

type BrowserSnapshot =
  | { scene: "start" }
  | {
      scene: "play";
      elapsedMs: number;
      score: number;
      playerHealth: number;
      playerX: number;
      playerY: number;
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
      scoring: {
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
      };
      bossHealth: number | null;
      bossX: number | null;
      bossY: number | null;
      nearestPlayerBulletY: number | null;
      bossPhaseId: string | null;
      weapons: ReadonlyArray<{
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
      enemyWaves: ReadonlyArray<{
        id: string;
        startMs: number;
        spawnIntervalMs: number;
        health: number;
        moveSpeed: number;
        started: boolean;
        spawnAttempts: number;
        successfulSpawns: number;
        patterns: ReadonlyArray<{
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
      }>;
      bulletPatterns: ReadonlyArray<{
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
      pickups: ReadonlyArray<{
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
      assets: {
        mode: "legacy-geometric" | "catalog";
        expectedTextureKeys: readonly string[];
        loadedTextureKeys: readonly string[];
        usedTextureKeys: readonly string[];
      };
      ending: boolean;
    }
  | {
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
      scoring: {
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
      };
    };

type GateCase = Readonly<{
  name: "desktop" | "mobile";
  assertionProfileId: BrowserAssertionProfile["profileId"];
  viewport: Readonly<{ width: number; height: number }>;
  checks: readonly string[];
  consoleErrorCount: number;
  pageErrorCount: number;
  failedRequestCount: number;
  enemyWavePatternEvidence?: EnemyWavePatternGateEvidence;
  bulletPatternEvidence?: BulletPatternGateEvidence;
  caseAwareEvidence?: CaseAwareGateEvidence;
  screenshot: string;
}>;

type CaseAwareGateEvidence = Readonly<{
  expectedOutcome: CaseAwareBrowserAssertions["expectedOutcome"];
  play: Readonly<{
    elapsedMs: number;
    score: number;
    playerHealth: number;
    activeEnemyBullets: number;
    maxEnemyBullets: number;
    peakActiveEnemyBullets: number;
    activePlayerBullets: number;
    maxPlayerBullets: number;
    activeEnemies: number;
    activePickups: number;
    maxPickups: number;
    executedWeaponIds: readonly string[];
    executedWaveIds: readonly string[];
    executedBossPatternIds: readonly string[];
    collectedPickupIds: readonly string[];
    assetMode: "legacy-geometric" | "catalog";
    expectedTextureCount: number;
    loadedTextureCount: number;
    usedTextureCount: number;
  }>;
  outcome: Readonly<{
    won: boolean;
    reason: string;
    elapsedMs: number;
    score: number;
  }>;
}>;

type BulletPatternGateEvidence = Readonly<{
  maxEnemyBullets: number;
  peakActiveEnemyBullets: number;
  totalBudgetDrops: number;
  patterns: ReadonlyArray<{
    id: string;
    pattern: (typeof browserPatternKinds)[number];
    emissionAttempts: number;
    requestedBullets: number;
    successfulSpawns: number;
    movedBullets: number;
    maxTravelDistance: number;
    minimumAimErrorRadians: number | null;
  }>;
}>;

type EnemyWavePatternGateEvidence = Readonly<{
  waveId: string;
  totalBudgetDrops: number;
  patterns: ReadonlyArray<{
    id: string;
    pattern: (typeof browserWavePatternKinds)[number];
    emitterCount: number;
    emissionAttempts: number;
    requestedBullets: number;
    successfulSpawns: number;
    movedBullets: number;
    maxTravelDistance: number;
    minimumAimErrorRadians: number | null;
  }>;
}>;

const EDGE_CHANNEL = "msedge";
const VERIFICATION_PATH = "verification";

type BoundedFailureSnapshot =
  | { scene: "unavailable" }
  | { scene: "start" }
  | {
      scene: "play";
      elapsedMs: number;
      score: number;
      playerHealth: number;
      activeEnemies: number;
      activeEnemyBullets: number;
      maxEnemyBullets: number;
      peakActiveEnemyBullets: number;
      activePlayerBullets: number;
      maxPlayerBullets: number;
      activePickups: number;
      maxPickups: number;
      bossHealth: number | null;
      ending: boolean;
      weaponCount: number;
      startedWaveIds: readonly string[];
      executedBossPatternIds: readonly string[];
      assetMode: "legacy-geometric" | "catalog";
      loadedTextureCount: number;
      usedTextureCount: number;
    }
  | {
      scene: "end";
      won: boolean;
      outcomeReason: string;
      elapsedMs: number;
      score: number;
    };

class BrowserGateSnapshotFailure extends Error {
  constructor(
    message: string,
    readonly failureSnapshot: BoundedFailureSnapshot,
  ) {
    super(message);
    this.name = "BrowserGateSnapshotFailure";
  }
}

function boundedFailureSnapshot(
  snapshot: BrowserSnapshot | null,
): BoundedFailureSnapshot {
  if (snapshot === null) return { scene: "unavailable" };
  if (snapshot.scene === "start") return { scene: "start" };
  if (snapshot.scene === "end") {
    return {
      scene: "end",
      won: snapshot.won,
      outcomeReason: snapshot.outcomeReason,
      elapsedMs: snapshot.elapsedMs,
      score: snapshot.score,
    };
  }
  return {
    scene: "play",
    elapsedMs: snapshot.elapsedMs,
    score: snapshot.score,
    playerHealth: snapshot.playerHealth,
    activeEnemies: snapshot.activeEnemies,
    activeEnemyBullets: snapshot.activeEnemyBullets,
    maxEnemyBullets: snapshot.maxEnemyBullets,
    peakActiveEnemyBullets: snapshot.peakActiveEnemyBullets,
    activePlayerBullets: snapshot.activePlayerBullets,
    maxPlayerBullets: snapshot.maxPlayerBullets,
    activePickups: snapshot.activePickups,
    maxPickups: snapshot.maxPickups,
    bossHealth: snapshot.bossHealth,
    ending: snapshot.ending,
    weaponCount: snapshot.weapons.length,
    startedWaveIds: snapshot.enemyWaves
      .filter((wave) => wave.started)
      .map((wave) => wave.id),
    executedBossPatternIds: snapshot.bulletPatterns
      .filter((pattern) => pattern.emissionAttempts > 0)
      .map((pattern) => pattern.id),
    assetMode: snapshot.assets.mode,
    loadedTextureCount: snapshot.assets.loadedTextureKeys.length,
    usedTextureCount: snapshot.assets.usedTextureKeys.length,
  };
}

async function throwWithFailureSnapshot(
  page: Page,
  error: unknown,
): Promise<never> {
  if (error instanceof BrowserGateSnapshotFailure) throw error;
  const snapshot = await readSnapshot(page).catch(() => null);
  const message =
    error instanceof Error ? error.message : "Unknown browser gate failure.";
  throw new BrowserGateSnapshotFailure(
    message,
    boundedFailureSnapshot(snapshot),
  );
}

export class BrowserVerificationFailure extends Error {
  constructor(readonly finding: VerificationFinding) {
    super(finding.message);
    this.name = "BrowserVerificationFailure";
  }
}

function verificationPathForAttempt(attempt: number): string {
  if (!Number.isInteger(attempt) || attempt < 0) {
    throw new Error("browser verification attempt must be non-negative");
  }
  return attempt === 0
    ? VERIFICATION_PATH
    : `repairs/round-${attempt}/verification`;
}

function classifyBrowserFailure(
  error: unknown,
  reportPath: string,
  caseName: "desktop" | "mobile",
): VerificationFinding {
  const message =
    error instanceof Error
      ? error.message.slice(0, 500)
      : "Unknown browser gate failure.";
  const normalized = message.toLowerCase();
  if (normalized.includes("case-aware play evidence")) {
    return createVerificationFinding({
      gate: "play",
      code: "configured-play-evidence-failed",
      message,
      suspectedFiles: [
        "game-template/vertical-shooter/src/scenes/play-scene.ts",
      ],
      reportPath,
      caseName,
    });
  }
  if (normalized.includes("case-aware outcome")) {
    return createVerificationFinding({
      gate: "play",
      code: "configured-outcome-failed",
      message,
      suspectedFiles: [
        "game-template/vertical-shooter/src/scenes/end-scene.ts",
        "game-template/vertical-shooter/src/scenes/play-scene.ts",
      ],
      reportPath,
      caseName,
    });
  }
  if (normalized.includes("movement") || normalized.includes("player")) {
    return createVerificationFinding({
      gate: "play",
      code: "player-control-failed",
      message,
      suspectedFiles: [
        "game-template/vertical-shooter/src/scenes/play-scene.ts",
      ],
      reportPath,
      caseName,
    });
  }
  if (normalized.includes("canvas") || normalized.includes("viewport")) {
    return createVerificationFinding({
      gate: "visual",
      code: "responsive-layout-failed",
      message,
      suspectedFiles: ["game-template/vertical-shooter/src/main.ts"],
      reportPath,
      caseName,
    });
  }
  if (normalized.includes("start")) {
    return createVerificationFinding({
      gate: "runtime",
      code: "start-lifecycle-failed",
      message,
      suspectedFiles: [
        "game-template/vertical-shooter/src/scenes/start-scene.ts",
      ],
      reportPath,
      caseName,
    });
  }
  if (normalized.includes("end") || normalized.includes("restart")) {
    return createVerificationFinding({
      gate: "play",
      code: "end-lifecycle-failed",
      message,
      suspectedFiles: [
        "game-template/vertical-shooter/src/scenes/end-scene.ts",
        "game-template/vertical-shooter/src/scenes/play-scene.ts",
      ],
      reportPath,
      caseName,
    });
  }
  return createVerificationFinding({
    gate: "play",
    code: "browser-play-gate-failed",
    message,
    suspectedFiles: ["game-template/vertical-shooter/src/scenes/play-scene.ts"],
    reportPath,
    caseName,
  });
}

function toJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function writeJsonAtomic(
  filePath: string,
  value: unknown,
): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, toJson(value), "utf8");
  await rename(temporaryPath, filePath);
}

function assertInside(parent: string, child: string): void {
  const relative = path.relative(parent, child);
  if (
    relative === "" ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`path must remain inside ${parent}`);
  }
}

function assertGate(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function verifyRunEvidence(
  runDirectory: string,
  manifest: RunManifest,
): Promise<void> {
  const required = {
    spec: "file",
    plan: "file",
    workspace: "directory",
    runtimeConfig: "file",
    buildLog: "file",
    package: "directory",
  } as const;

  for (const [name, kind] of Object.entries(required)) {
    const evidence = manifest.artifacts[name as keyof typeof required];
    if (!evidence)
      throw new Error(`missing required ${name} artifact evidence`);
    const artifactPath = path.resolve(runDirectory, evidence.path);
    assertInside(runDirectory, artifactPath);
    const actual =
      kind === "directory"
        ? (await digestDirectory(artifactPath)).sha256
        : await sha256File(artifactPath);
    if (actual !== evidence.sha256) {
      throw new Error(`${name} artifact hash does not match the manifest`);
    }
  }
  const assetSelection = manifest.artifacts.assetSelection;
  if (assetSelection !== undefined) {
    const selectionPath = path.resolve(runDirectory, assetSelection.path);
    assertInside(runDirectory, selectionPath);
    if ((await sha256File(selectionPath)) !== assetSelection.sha256) {
      throw new Error(
        "assetSelection artifact hash does not match the manifest",
      );
    }
  }
  const assetQueryGrounding = manifest.artifacts.assetQueryGrounding;
  if (assetQueryGrounding !== undefined) {
    const groundingPath = path.resolve(runDirectory, assetQueryGrounding.path);
    assertInside(runDirectory, groundingPath);
    if ((await sha256File(groundingPath)) !== assetQueryGrounding.sha256) {
      throw new Error(
        "assetQueryGrounding artifact hash does not match the manifest",
      );
    }
  }
  await verifySpecEvidenceChain(runDirectory, manifest);
}

async function buildInstrumentedBundle(
  projectDirectory: string,
  templateDirectory: string,
  outputDirectory: string,
): Promise<void> {
  const viteCli = path.join(
    projectDirectory,
    "node_modules",
    "vite",
    "bin",
    "vite.js",
  );
  await new Promise<void>((resolve, reject) => {
    execFile(
      process.execPath,
      [viteCli, "build", templateDirectory, "--outDir", outputDirectory],
      {
        cwd: projectDirectory,
        env: { ...process.env, VITE_SHOOTER_TEST_BRIDGE: "1" },
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
        windowsHide: true,
      },
      (error) =>
        error ? reject(new Error("instrumented Vite build failed")) : resolve(),
    );
  });
}

const contentTypes: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
};

async function startStaticServer(root: string): Promise<{
  server: Server;
  url: string;
}> {
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(
        new URL(request.url ?? "/", "http://127.0.0.1").pathname,
      );
      if (pathname === "/favicon.ico") {
        response.writeHead(204, { "cache-control": "no-store" });
        response.end();
        return;
      }
      const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
      const filePath = path.resolve(root, relativePath);
      assertInside(root, filePath);
      const stats = await lstat(filePath);
      if (!stats.isFile() || stats.isSymbolicLink())
        throw new Error("not found");
      response.writeHead(200, {
        "content-type":
          contentTypes[path.extname(filePath)] ?? "application/octet-stream",
        "cache-control": "no-store",
      });
      response.end(await readFile(filePath));
    } catch {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found\n");
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address() as AddressInfo;
  return { server, url: `http://127.0.0.1:${address.port}` };
}

async function closeServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

async function readSnapshot(page: Page): Promise<BrowserSnapshot | null> {
  return page.evaluate(() => {
    const browserWindow = window as Window & {
      __SHOOTER_TEST__?: { getSnapshot: () => BrowserSnapshot | null };
    };
    return browserWindow.__SHOOTER_TEST__?.getSnapshot() ?? null;
  });
}

async function waitForScene(
  page: Page,
  scene: BrowserSnapshot["scene"],
  timeout = 10_000,
): Promise<BrowserSnapshot> {
  await page.waitForFunction(
    (expectedScene) => {
      const browserWindow = window as Window & {
        __SHOOTER_TEST__?: { getSnapshot: () => BrowserSnapshot | null };
      };
      return (
        browserWindow.__SHOOTER_TEST__?.getSnapshot()?.scene === expectedScene
      );
    },
    scene,
    { timeout },
  );
  const snapshot = await readSnapshot(page);
  assertGate(snapshot, `missing ${scene} runtime snapshot`);
  return snapshot;
}

function hasMateriallyDistinctWaveEvidence(
  snapshot: BrowserSnapshot | null,
): boolean {
  if (snapshot?.scene !== "play") return false;
  const executed = snapshot.enemyWaves.filter(
    (wave) => wave.started && wave.successfulSpawns > 0,
  );
  if (new Set(executed.map((wave) => wave.id)).size < 2) return false;
  return executed.some((left, leftIndex) =>
    executed
      .slice(leftIndex + 1)
      .some(
        (right) =>
          left.startMs !== right.startMs ||
          left.spawnIntervalMs !== right.spawnIntervalMs ||
          left.health !== right.health ||
          left.moveSpeed !== right.moveSpeed,
      ),
  );
}

async function waitForMultiWaveEvidence(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const snapshot = (
      window as Window & {
        __SHOOTER_TEST__?: { getSnapshot: () => BrowserSnapshot | null };
      }
    ).__SHOOTER_TEST__?.getSnapshot();
    if (snapshot?.scene !== "play") return false;
    const executed = snapshot.enemyWaves.filter(
      (wave) => wave.started && wave.successfulSpawns > 0,
    );
    if (new Set(executed.map((wave) => wave.id)).size < 2) return false;
    return executed.some((left, leftIndex) =>
      executed
        .slice(leftIndex + 1)
        .some(
          (right) =>
            left.startMs !== right.startMs ||
            left.spawnIntervalMs !== right.spawnIntervalMs ||
            left.health !== right.health ||
            left.moveSpeed !== right.moveSpeed,
        ),
    );
  });
  assertGate(
    hasMateriallyDistinctWaveEvidence(await readSnapshot(page)),
    "browser did not execute two materially different enemy waves",
  );
}

const browserWavePatternKinds = ["aimed", "wave"] as const;
const browserPatternWaveId = "browser-gunners";

function hasEnemyWavePatternExecutionEvidence(
  snapshot: BrowserSnapshot | null,
): boolean {
  if (
    snapshot?.scene !== "play" ||
    snapshot.activeEnemyBullets > snapshot.maxEnemyBullets ||
    snapshot.peakActiveEnemyBullets > snapshot.maxEnemyBullets
  ) {
    return false;
  }
  const wave = snapshot.enemyWaves.find(
    (candidate) => candidate.id === browserPatternWaveId,
  );
  if (!wave || wave.successfulSpawns < 2) return false;
  const byKind = new Map(
    wave.patterns.map((pattern) => [pattern.pattern, pattern]),
  );
  return (
    browserWavePatternKinds.every((kind) => {
      const pattern = byKind.get(kind);
      return (
        pattern !== undefined &&
        pattern.emitterCount === wave.successfulSpawns &&
        pattern.emissionAttempts > 0 &&
        pattern.requestedBullets >= pattern.plannedBullets &&
        pattern.plannedBullets >= pattern.successfulSpawns &&
        pattern.successfulSpawns > 0 &&
        pattern.droppedByPool === 0 &&
        pattern.movedBullets > 0 &&
        pattern.maxTravelDistance >= 8 &&
        (kind !== "aimed" ||
          (pattern.minimumAimErrorRadians !== null &&
            pattern.minimumAimErrorRadians < 0.000_001))
      );
    }) && wave.patterns.some((pattern) => pattern.droppedByBudget > 0)
  );
}

async function waitForEnemyWavePatternExecutionEvidence(
  page: Page,
): Promise<void> {
  try {
    await page.waitForFunction(
      ({ waveId, patternKinds }) => {
        const snapshot = (
          window as Window & {
            __SHOOTER_TEST__?: { getSnapshot: () => BrowserSnapshot | null };
          }
        ).__SHOOTER_TEST__?.getSnapshot();
        if (
          snapshot?.scene !== "play" ||
          snapshot.activeEnemyBullets > snapshot.maxEnemyBullets ||
          snapshot.peakActiveEnemyBullets > snapshot.maxEnemyBullets
        ) {
          return false;
        }
        const wave = snapshot.enemyWaves.find(
          (candidate) => candidate.id === waveId,
        );
        if (!wave || wave.successfulSpawns < 2) return false;
        const byKind = new Map(
          wave.patterns.map((pattern) => [pattern.pattern, pattern]),
        );
        return (
          patternKinds.every((kind) => {
            const pattern = byKind.get(kind);
            return (
              pattern !== undefined &&
              pattern.emitterCount === wave.successfulSpawns &&
              pattern.emissionAttempts > 0 &&
              pattern.requestedBullets >= pattern.plannedBullets &&
              pattern.plannedBullets >= pattern.successfulSpawns &&
              pattern.successfulSpawns > 0 &&
              pattern.droppedByPool === 0 &&
              pattern.movedBullets > 0 &&
              pattern.maxTravelDistance >= 8 &&
              (kind !== "aimed" ||
                (pattern.minimumAimErrorRadians !== null &&
                  pattern.minimumAimErrorRadians < 0.000_001))
            );
          }) && wave.patterns.some((pattern) => pattern.droppedByBudget > 0)
        );
      },
      { waveId: browserPatternWaveId, patternKinds: browserWavePatternKinds },
      { timeout: 10_000 },
    );
  } catch {
    throw new Error(
      `enemy-wave pattern evidence timed out: ${JSON.stringify(await readSnapshot(page))}`,
    );
  }
  assertGate(
    hasEnemyWavePatternExecutionEvidence(await readSnapshot(page)),
    "browser did not execute source-aware enemy-wave patterns within the global cap",
  );
}

async function readEnemyWavePatternGateEvidence(
  page: Page,
): Promise<EnemyWavePatternGateEvidence> {
  const snapshot = await readSnapshot(page);
  assertGate(
    hasEnemyWavePatternExecutionEvidence(snapshot) &&
      snapshot?.scene === "play",
    "missing final enemy-wave pattern evidence",
  );
  const wave = snapshot.enemyWaves.find(
    (candidate) => candidate.id === browserPatternWaveId,
  );
  assertGate(wave, `missing ${browserPatternWaveId} wave evidence`);
  return {
    waveId: wave.id,
    totalBudgetDrops: wave.patterns.reduce(
      (total, pattern) => total + pattern.droppedByBudget,
      0,
    ),
    patterns: browserWavePatternKinds.map((kind) => {
      const pattern = wave.patterns.find(
        (candidate) => candidate.pattern === kind,
      );
      assertGate(pattern, `missing ${kind} enemy-wave pattern evidence`);
      return {
        id: pattern.id,
        pattern: kind,
        emitterCount: pattern.emitterCount,
        emissionAttempts: pattern.emissionAttempts,
        requestedBullets: pattern.requestedBullets,
        successfulSpawns: pattern.successfulSpawns,
        movedBullets: pattern.movedBullets,
        maxTravelDistance: pattern.maxTravelDistance,
        minimumAimErrorRadians: pattern.minimumAimErrorRadians,
      };
    }),
  };
}

const browserPatternKinds = [
  "aimed",
  "wave",
  "rain",
  "rotatingRing",
  "burst",
] as const;

function hasBulletPatternExecutionEvidence(
  snapshot: BrowserSnapshot | null,
): boolean {
  if (
    snapshot?.scene !== "play" ||
    snapshot.activeEnemyBullets > snapshot.maxEnemyBullets ||
    snapshot.peakActiveEnemyBullets > snapshot.maxEnemyBullets ||
    snapshot.peakActiveEnemyBullets !== snapshot.maxEnemyBullets
  ) {
    return false;
  }
  const byKind = new Map(
    snapshot.bulletPatterns.map((pattern) => [pattern.pattern, pattern]),
  );
  const covered = browserPatternKinds.every((kind) => {
    const pattern = byKind.get(kind);
    return (
      pattern !== undefined &&
      pattern.emissionAttempts > 0 &&
      pattern.requestedBullets >= pattern.plannedBullets &&
      pattern.plannedBullets >= pattern.successfulSpawns &&
      pattern.successfulSpawns > 0 &&
      pattern.droppedByPool === 0 &&
      pattern.movedBullets > 0 &&
      pattern.maxTravelDistance >= 8 &&
      (kind !== "aimed" ||
        (pattern.minimumAimErrorRadians !== null &&
          pattern.minimumAimErrorRadians < 0.000_001))
    );
  });
  return (
    covered &&
    snapshot.bulletPatterns.some((pattern) => pattern.droppedByBudget > 0)
  );
}

async function waitForBulletPatternExecutionEvidence(
  page: Page,
): Promise<void> {
  try {
    await page.waitForFunction(
      (requiredKinds) => {
        const snapshot = (
          window as Window & {
            __SHOOTER_TEST__?: { getSnapshot: () => BrowserSnapshot | null };
          }
        ).__SHOOTER_TEST__?.getSnapshot();
        if (
          snapshot?.scene !== "play" ||
          snapshot.activeEnemyBullets > snapshot.maxEnemyBullets ||
          snapshot.peakActiveEnemyBullets > snapshot.maxEnemyBullets ||
          snapshot.peakActiveEnemyBullets !== snapshot.maxEnemyBullets
        ) {
          return false;
        }
        const byKind = new Map(
          snapshot.bulletPatterns.map((pattern) => [pattern.pattern, pattern]),
        );
        return (
          requiredKinds.every((kind) => {
            const pattern = byKind.get(kind);
            return (
              pattern !== undefined &&
              pattern.emissionAttempts > 0 &&
              pattern.requestedBullets >= pattern.plannedBullets &&
              pattern.plannedBullets >= pattern.successfulSpawns &&
              pattern.successfulSpawns > 0 &&
              pattern.droppedByPool === 0 &&
              pattern.movedBullets > 0 &&
              pattern.maxTravelDistance >= 8 &&
              (kind !== "aimed" ||
                (pattern.minimumAimErrorRadians !== null &&
                  pattern.minimumAimErrorRadians < 0.000_001))
            );
          }) &&
          snapshot.bulletPatterns.some((pattern) => pattern.droppedByBudget > 0)
        );
      },
      browserPatternKinds,
      { timeout: 25_000 },
    );
  } catch {
    throw new Error(
      `bullet-pattern evidence timed out: ${JSON.stringify(await readSnapshot(page))}`,
    );
  }
  assertGate(
    hasBulletPatternExecutionEvidence(await readSnapshot(page)),
    "browser did not execute and move all five bullet patterns within the global cap",
  );
}

async function readBulletPatternGateEvidence(
  page: Page,
): Promise<BulletPatternGateEvidence> {
  const snapshot = await readSnapshot(page);
  assertGate(
    hasBulletPatternExecutionEvidence(snapshot) && snapshot?.scene === "play",
    "missing final bullet-pattern execution evidence",
  );
  const patterns = browserPatternKinds.map((kind) => {
    const pattern = snapshot.bulletPatterns.find(
      (candidate) => candidate.pattern === kind,
    );
    assertGate(pattern, `missing ${kind} bullet-pattern evidence`);
    return {
      id: pattern.id,
      pattern: kind,
      emissionAttempts: pattern.emissionAttempts,
      requestedBullets: pattern.requestedBullets,
      successfulSpawns: pattern.successfulSpawns,
      movedBullets: pattern.movedBullets,
      maxTravelDistance: pattern.maxTravelDistance,
      minimumAimErrorRadians: pattern.minimumAimErrorRadians,
    };
  });
  return {
    maxEnemyBullets: snapshot.maxEnemyBullets,
    peakActiveEnemyBullets: snapshot.peakActiveEnemyBullets,
    totalBudgetDrops: snapshot.bulletPatterns.reduce(
      (total, pattern) => total + pattern.droppedByBudget,
      0,
    ),
    patterns,
  };
}

function hasMateriallyDistinctWeaponEvidence(
  snapshot: BrowserSnapshot | null,
  requireDamage: boolean,
): boolean {
  if (
    snapshot?.scene !== "play" ||
    snapshot.activePlayerBullets > snapshot.maxPlayerBullets
  ) {
    return false;
  }
  const executed = snapshot.weapons.filter(
    (weapon) =>
      weapon.fireAttempts > 0 &&
      weapon.successfulProjectiles > 0 &&
      weapon.maxProjectilesPerFire === weapon.projectileCount &&
      weapon.lastProjectileSpeed === weapon.projectileSpeed &&
      (!requireDamage ||
        (weapon.hitCount > 0 &&
          weapon.damageDealt >= weapon.damage * weapon.hitCount)),
  );
  if (new Set(executed.map((weapon) => weapon.id)).size < 2) return false;
  return executed.some((left, leftIndex) =>
    executed
      .slice(leftIndex + 1)
      .some(
        (right) =>
          left.fireIntervalMs !== right.fireIntervalMs ||
          left.projectileSpeed !== right.projectileSpeed ||
          left.damage !== right.damage ||
          left.projectileCount !== right.projectileCount,
      ),
  );
}

async function waitForMultiWeaponEvidence(
  page: Page,
  requireDamage = false,
): Promise<void> {
  await page.waitForFunction((mustHaveDamage) => {
    const snapshot = (
      window as Window & {
        __SHOOTER_TEST__?: { getSnapshot: () => BrowserSnapshot | null };
      }
    ).__SHOOTER_TEST__?.getSnapshot();
    if (
      snapshot?.scene !== "play" ||
      snapshot.activePlayerBullets > snapshot.maxPlayerBullets
    ) {
      return false;
    }
    const executed = snapshot.weapons.filter(
      (weapon) =>
        weapon.fireAttempts > 0 &&
        weapon.successfulProjectiles > 0 &&
        weapon.maxProjectilesPerFire === weapon.projectileCount &&
        weapon.lastProjectileSpeed === weapon.projectileSpeed &&
        (!mustHaveDamage ||
          (weapon.hitCount > 0 &&
            weapon.damageDealt >= weapon.damage * weapon.hitCount)),
    );
    if (new Set(executed.map((weapon) => weapon.id)).size < 2) return false;
    return executed.some((left, leftIndex) =>
      executed
        .slice(leftIndex + 1)
        .some(
          (right) =>
            left.fireIntervalMs !== right.fireIntervalMs ||
            left.projectileSpeed !== right.projectileSpeed ||
            left.damage !== right.damage ||
            left.projectileCount !== right.projectileCount,
        ),
    );
  }, requireDamage);
  assertGate(
    hasMateriallyDistinctWeaponEvidence(
      await readSnapshot(page),
      requireDamage,
    ),
    `browser did not execute two materially different weapons${
      requireDamage ? " with per-weapon damage" : ""
    }`,
  );
}

function hasPickupExecutionEvidence(snapshot: BrowserSnapshot | null): boolean {
  if (
    snapshot?.scene !== "play" ||
    snapshot.activePickups > snapshot.maxPickups
  ) {
    return false;
  }
  const collected = snapshot.pickups.filter(
    (pickup) =>
      pickup.spawnAttempts === 1 &&
      pickup.successfulSpawns === 1 &&
      pickup.droppedByBudget === 0 &&
      pickup.collections === 1 &&
      (pickup.effect === "heal"
        ? pickup.appliedValue >= 0 && pickup.appliedValue <= pickup.value
        : pickup.appliedValue === pickup.value),
  );
  const effects = new Set(collected.map((pickup) => pickup.effect));
  return (
    effects.has("heal") &&
    effects.has("weaponPower") &&
    effects.has("shield") &&
    effects.has("scoreBonus") &&
    snapshot.weaponPowerBonus > 0
  );
}

async function waitForPickupExecutionEvidence(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const snapshot = (
      window as Window & {
        __SHOOTER_TEST__?: { getSnapshot: () => BrowserSnapshot | null };
      }
    ).__SHOOTER_TEST__?.getSnapshot();
    if (
      snapshot?.scene !== "play" ||
      snapshot.activePickups > snapshot.maxPickups
    ) {
      return false;
    }
    const collected = snapshot.pickups.filter(
      (pickup) =>
        pickup.spawnAttempts === 1 &&
        pickup.successfulSpawns === 1 &&
        pickup.droppedByBudget === 0 &&
        pickup.collections === 1 &&
        (pickup.effect === "heal"
          ? pickup.appliedValue >= 0 && pickup.appliedValue <= pickup.value
          : pickup.appliedValue === pickup.value),
    );
    const effects = new Set(collected.map((pickup) => pickup.effect));
    return (
      effects.has("heal") &&
      effects.has("weaponPower") &&
      effects.has("shield") &&
      effects.has("scoreBonus") &&
      snapshot.weaponPowerBonus > 0
    );
  });
  assertGate(
    hasPickupExecutionEvidence(await readSnapshot(page)),
    "browser did not collect all four pickup effects within the pickup budget",
  );
}

function hasCatalogAssetEvidence(snapshot: BrowserSnapshot | null): boolean {
  if (snapshot?.scene !== "play" || snapshot.assets.mode !== "catalog") {
    return false;
  }
  const expected = new Set(snapshot.assets.expectedTextureKeys);
  const loaded = new Set(snapshot.assets.loadedTextureKeys);
  const used = new Set(snapshot.assets.usedTextureKeys);
  return (
    expected.size >= 9 &&
    expected.size === snapshot.assets.expectedTextureKeys.length &&
    [...expected].every(
      (textureKey) => loaded.has(textureKey) && used.has(textureKey),
    )
  );
}

async function waitForCatalogAssetEvidence(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const snapshot = (
      window as Window & {
        __SHOOTER_TEST__?: { getSnapshot: () => BrowserSnapshot | null };
      }
    ).__SHOOTER_TEST__?.getSnapshot();
    if (snapshot?.scene !== "play" || snapshot.assets.mode !== "catalog") {
      return false;
    }
    const expected = new Set(snapshot.assets.expectedTextureKeys);
    const loaded = new Set(snapshot.assets.loadedTextureKeys);
    const used = new Set(snapshot.assets.usedTextureKeys);
    return (
      expected.size >= 9 &&
      expected.size === snapshot.assets.expectedTextureKeys.length &&
      [...expected].every(
        (textureKey) => loaded.has(textureKey) && used.has(textureKey),
      )
    );
  });
  assertGate(
    hasCatalogAssetEvidence(await readSnapshot(page)),
    "browser did not preload and render every selected catalog texture",
  );
}

function hasScoringExecutionEvidence(
  snapshot: BrowserSnapshot | null,
): boolean {
  if (snapshot === null || snapshot.scene === "start") return false;
  const scoring = snapshot.scoring;
  return (
    scoring.comboWindowMs === 10_000 &&
    scoring.comboMultiplierCap === 3 &&
    scoring.grazePoints === 40 &&
    scoring.defeatCount >= 2 &&
    scoring.defeatScore > 0 &&
    scoring.maxComboMultiplier > 1 &&
    scoring.maxComboMultiplier <= scoring.comboMultiplierCap &&
    scoring.grazeCount >= 1 &&
    scoring.grazeScore === scoring.grazeCount * scoring.grazePoints &&
    snapshot.score >= scoring.defeatScore + scoring.grazeScore
  );
}

async function waitForScoringExecutionEvidence(page: Page): Promise<void> {
  try {
    await page.waitForFunction(
      () => {
        const snapshot = (
          window as Window & {
            __SHOOTER_TEST__?: { getSnapshot: () => BrowserSnapshot | null };
          }
        ).__SHOOTER_TEST__?.getSnapshot();
        if (
          snapshot === undefined ||
          snapshot === null ||
          snapshot.scene === "start"
        )
          return false;
        const scoring = snapshot.scoring;
        return (
          scoring.comboWindowMs === 10_000 &&
          scoring.comboMultiplierCap === 3 &&
          scoring.grazePoints === 40 &&
          scoring.defeatCount >= 2 &&
          scoring.defeatScore > 0 &&
          scoring.maxComboMultiplier > 1 &&
          scoring.maxComboMultiplier <= scoring.comboMultiplierCap &&
          scoring.grazeCount >= 1 &&
          scoring.grazeScore === scoring.grazeCount * scoring.grazePoints &&
          snapshot.score >= scoring.defeatScore + scoring.grazeScore
        );
      },
      undefined,
      { timeout: 15_000 },
    );
  } catch {
    throw new Error(
      `combo/graze evidence timed out: ${JSON.stringify(await readSnapshot(page))}`,
    );
  }
  assertGate(
    hasScoringExecutionEvidence(await readSnapshot(page)),
    "browser did not execute bounded combo and one-shot graze scoring",
  );
}

async function waitForBatch1VerticalSliceEvidence(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const bridge = (
        window as Window & {
          __SHOOTER_TEST__?: {
            getBatch1Snapshot?: () => {
              phase: string;
              emittedProjectiles: number;
              resolvedContacts: number;
              enemyHealth: number;
            } | null;
          };
        }
      ).__SHOOTER_TEST__;
      const snapshot = bridge?.getBatch1Snapshot?.();
      return (
        snapshot?.phase === "running" &&
        snapshot.emittedProjectiles > 0 &&
        snapshot.resolvedContacts > 0 &&
        snapshot.enemyHealth < 100
      );
    },
    undefined,
    { timeout: 8_000 },
  );
}

async function waitForBatch2VerticalSliceEvidence(
  page: Page,
  requireContact: boolean,
): Promise<void> {
  try {
    await page.waitForFunction(
      (contactRequired) => {
        const snapshot = (
          window as Window & {
            __SHOOTER_TEST__?: {
              getBatch2Snapshot?: () => {
                phase: string;
                requestedAttacks: number;
                emittedProjectiles: number;
                resolvedContacts: number;
                enemyHealth: number;
                droppedByRate: number;
                droppedByPool: number;
              } | null;
            };
          }
        ).__SHOOTER_TEST__?.getBatch2Snapshot?.();
        return (
          snapshot?.phase === "running" &&
          snapshot.requestedAttacks > 0 &&
          snapshot.emittedProjectiles >= 3 &&
          (!contactRequired ||
            (snapshot.resolvedContacts > 0 && snapshot.enemyHealth < 100)) &&
          snapshot.droppedByRate >= 0 &&
          snapshot.droppedByPool >= 0
        );
      },
      requireContact,
      { timeout: 8_000 },
    );
  } catch (error) {
    const snapshot = await page.evaluate(() =>
      (
        window as Window & {
          __SHOOTER_TEST__?: { getBatch2Snapshot?: () => unknown };
        }
      ).__SHOOTER_TEST__?.getBatch2Snapshot?.(),
    );
    throw new Error(
      `Batch 2 browser evidence timed out: ${JSON.stringify(snapshot)}`,
      { cause: error },
    );
  }
}

type Batch2FormationMatrixSnapshot = Readonly<{
  phase: string;
  completedCases: readonly Readonly<{
    caseId: string;
    moduleId: string;
    requestedAttacks: number;
    activatedProjectiles: number;
    finiteGeometry: boolean;
    cleanup: Readonly<{
      active: number;
      input: number;
      overlap: number;
      observation: number;
    }>;
  }>[];
  allPassed: boolean;
}>;

type Batch2ProgressionSnapshot = Readonly<{
  phase: string;
  activePickups: number;
  collectedEvents: number;
  addressedApplications: number;
  deliveryDamageBonus: number;
  activePreparedEffects: number;
  effectTrace: readonly string[];
}>;

type Batch2NearestSnapshot = Readonly<{
  phase: string;
  completedCases: readonly Readonly<{
    caseId: string;
    actorReadsBeforeAttack: number;
    actorReadsAfterAttack: number;
    noReresolve: boolean;
    cleanupResidue: number;
  }>[];
  allPassed: boolean;
}>;

type Batch2DefenseSnapshot = Readonly<{
  phase: string;
  currentCaseIndex: number;
  currentHitCount: number;
  simulationTimeMs: number;
  completedCases: readonly Readonly<{
    durationMs: number;
    healthAfterFirst: number;
    healthAfterSecond: number;
    healthAfterExpiry: number | null;
    sameTimeBlocked: boolean;
    exactExpiryAccepted: boolean | null;
    route: readonly string[];
    cleanupResidue: number;
  }>[];
  allPassed: boolean;
  cleanupResidue: number;
}>;

async function completeBatch2DefenseEvidence(
  page: Page,
  box: Readonly<{ x: number; y: number; width: number; height: number }>,
  input: "mouse" | "touch",
): Promise<void> {
  const trigger = async () => {
    const x = box.x + box.width * 0.3;
    const y = box.y + box.height * 0.55;
    if (input === "mouse") await page.mouse.click(x, y);
    else await page.touchscreen.tap(x, y);
  };
  await trigger();
  await trigger();
  await page.waitForFunction(() => {
    const snapshot = (
      window as Window & {
        __SHOOTER_TEST__?: {
          getBatch2DefenseSnapshot?: () => Batch2DefenseSnapshot | null;
        };
      }
    ).__SHOOTER_TEST__?.getBatch2DefenseSnapshot?.();
    return (
      snapshot?.currentCaseIndex === 0 &&
      snapshot.currentHitCount === 2 &&
      snapshot.simulationTimeMs === 125
    );
  });
  await trigger();
  await trigger();
  await trigger();
  await page.waitForFunction(() => {
    const snapshot = (
      window as Window & {
        __SHOOTER_TEST__?: {
          getBatch2DefenseSnapshot?: () => Batch2DefenseSnapshot | null;
        };
      }
    ).__SHOOTER_TEST__?.getBatch2DefenseSnapshot?.();
    return (
      snapshot?.phase === "complete" &&
      snapshot.allPassed &&
      snapshot.cleanupResidue === 0 &&
      snapshot.completedCases.length === 2 &&
      snapshot.completedCases[0]?.durationMs === 125 &&
      snapshot.completedCases[0]?.healthAfterFirst === 95 &&
      snapshot.completedCases[0]?.healthAfterSecond === 95 &&
      snapshot.completedCases[0]?.healthAfterExpiry === 65 &&
      snapshot.completedCases[0]?.sameTimeBlocked === true &&
      snapshot.completedCases[0]?.exactExpiryAccepted === true &&
      snapshot.completedCases[1]?.durationMs === 0 &&
      snapshot.completedCases[1]?.sameTimeBlocked === false &&
      snapshot.completedCases.every(
        (evidence) =>
          evidence.route.join(">") === "invulnerability>shield>health" &&
          evidence.cleanupResidue === 0,
      )
    );
  });
}

async function waitForBatch2NearestEvidence(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const snapshot = (
      window as Window & {
        __SHOOTER_TEST__?: {
          getBatch2NearestSnapshot?: () => Batch2NearestSnapshot | null;
        };
      }
    ).__SHOOTER_TEST__?.getBatch2NearestSnapshot?.();
    const expected = [
      "empty",
      "equal-distance-tie",
      "inactive",
      "out-of-range",
      "stale-old",
      "stale-new",
      "stale-fallback",
    ];
    return (
      snapshot?.phase === "complete" &&
      snapshot.allPassed &&
      snapshot.completedCases.length === expected.length &&
      snapshot.completedCases.every(
        (evidence, index) =>
          evidence.caseId === expected[index] &&
          evidence.noReresolve &&
          evidence.actorReadsBeforeAttack === evidence.actorReadsAfterAttack &&
          evidence.cleanupResidue === 0,
      )
    );
  });
}

async function readBatch2ProgressionSnapshot(
  page: Page,
): Promise<Batch2ProgressionSnapshot | null> {
  return page.evaluate(
    () =>
      (
        window as Window & {
          __SHOOTER_TEST__?: {
            getBatch2ProgressionSnapshot?: () => Batch2ProgressionSnapshot | null;
          };
        }
      ).__SHOOTER_TEST__?.getBatch2ProgressionSnapshot?.() ?? null,
  );
}

async function completeBatch2ProgressionEvidence(
  page: Page,
  box: Readonly<{ x: number; y: number; width: number; height: number }>,
  input: "mouse" | "touch",
): Promise<void> {
  const before = await readBatch2ProgressionSnapshot(page);
  if ((before?.collectedEvents ?? 0) === 0) {
    const x = box.x + (box.width * 400) / 720;
    const y = box.y + (box.height * 160) / 720;
    if (input === "mouse") await page.mouse.click(x, y);
    else await page.touchscreen.tap(x, y);
  }
  await page.waitForFunction(() => {
    const snapshot = (
      window as Window & {
        __SHOOTER_TEST__?: {
          getBatch2ProgressionSnapshot?: () => Batch2ProgressionSnapshot | null;
        };
      }
    ).__SHOOTER_TEST__?.getBatch2ProgressionSnapshot?.();
    return (
      snapshot?.phase === "running" &&
      snapshot.activePickups === 0 &&
      snapshot.collectedEvents === 1 &&
      snapshot.addressedApplications === 1 &&
      snapshot.deliveryDamageBonus === 1 &&
      snapshot.activePreparedEffects === 0 &&
      snapshot.effectTrace.join(",") === "consume,collected,application"
    );
  });
}

async function waitForFreshBatch2Progression(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const snapshot = (
      window as Window & {
        __SHOOTER_TEST__?: {
          getBatch2ProgressionSnapshot?: () => Batch2ProgressionSnapshot | null;
        };
      }
    ).__SHOOTER_TEST__?.getBatch2ProgressionSnapshot?.();
    return (
      snapshot?.phase === "running" &&
      snapshot.activePickups === 1 &&
      snapshot.collectedEvents === 0 &&
      snapshot.addressedApplications === 0 &&
      snapshot.deliveryDamageBonus === 0 &&
      snapshot.effectTrace.length === 0
    );
  });
}

async function readBatch2FormationMatrixSnapshot(
  page: Page,
): Promise<Batch2FormationMatrixSnapshot | null> {
  return page.evaluate(
    () =>
      (
        window as Window & {
          __SHOOTER_TEST__?: {
            getBatch2FormationSnapshot?: () => Batch2FormationMatrixSnapshot | null;
          };
        }
      ).__SHOOTER_TEST__?.getBatch2FormationSnapshot?.() ?? null,
  );
}

async function completeBatch2FormationMatrix(
  page: Page,
  box: Readonly<{ x: number; y: number; width: number; height: number }>,
  input: "mouse" | "touch",
): Promise<void> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const before = await readBatch2FormationMatrixSnapshot(page);
    if (before?.phase === "complete") break;
    const completed = before?.completedCases.length ?? 0;
    const x = box.x + box.width * (0.4 + (completed % 3) * 0.1);
    // Keep the conformance click away from the modular player's restart
    // position. An exact zero aim vector is intentionally fail-closed.
    const y = box.y + box.height * 0.65;
    if (input === "mouse") await page.mouse.click(x, y);
    else await page.touchscreen.tap(x, y);
    await page.waitForFunction(
      (expected) => {
        const snapshot = (
          window as Window & {
            __SHOOTER_TEST__?: {
              getBatch2FormationSnapshot?: () => {
                completedCases: readonly unknown[];
              } | null;
            };
          }
        ).__SHOOTER_TEST__?.getBatch2FormationSnapshot?.();
        return (snapshot?.completedCases.length ?? 0) > expected;
      },
      completed,
      { timeout: 8_000 },
    );
  }
  const snapshot = await readBatch2FormationMatrixSnapshot(page);
  assertGate(
    snapshot?.phase === "complete" && snapshot.allPassed,
    `Batch 2 formation matrix incomplete: ${JSON.stringify(snapshot)}`,
  );
  assertGate(
    snapshot.completedCases.length === 10 &&
      new Set(snapshot.completedCases.map(({ moduleId }) => moduleId)).size ===
        10 &&
      snapshot.completedCases.every(
        ({ requestedAttacks, activatedProjectiles, finiteGeometry, cleanup }) =>
          requestedAttacks === 1 &&
          activatedProjectiles === 3 &&
          finiteGeometry &&
          Object.values(cleanup).every((count) => count === 0),
      ),
    `Batch 2 formation evidence invalid: ${JSON.stringify(snapshot)}`,
  );
}

const EXPECTED_MANIFEST_V12_CONTEXT_KEY_BYTES =
  '{"context":["assets","clock","configuration","identity","ports","services"],"identity":["artifactEnvelopeSha256","instanceId","moduleId","ownerId","version"],"services":["actors","channels","contact","input","observation","overlaps","viewport"],"ports":["declareHandler","emitEvent","publishState"],"clock":["nowMs","schedule"],"assets":["optionalTexture","requireTexture"]}';

async function waitForMixedV13ConformanceEvidence(page: Page): Promise<void> {
  await page.waitForFunction(
    (expectedLegacyContextKeyBytes) => {
      const bridge = (
        window as Window & {
          __SHOOTER_TEST__?: {
            getMixedV13ConformanceSnapshot?: () => {
              phase: string;
              legacyContextKeyBytes: string;
              expectedLegacyContextKeyBytes: string;
              legacyHasV13Grant: boolean;
              modernHasActorSnapshotGrant: boolean;
              executedInstanceIds: readonly string[];
            } | null;
          };
        }
      ).__SHOOTER_TEST__;
      const snapshot = bridge?.getMixedV13ConformanceSnapshot?.();
      return (
        snapshot?.phase === "running" &&
        snapshot.legacyContextKeyBytes === expectedLegacyContextKeyBytes &&
        snapshot.expectedLegacyContextKeyBytes ===
          expectedLegacyContextKeyBytes &&
        snapshot.legacyHasV13Grant === false &&
        snapshot.modernHasActorSnapshotGrant === true &&
        JSON.stringify(snapshot.executedInstanceIds) ===
          '["keyboard","modern-probe"]'
      );
    },
    EXPECTED_MANIFEST_V12_CONTEXT_KEY_BYTES,
    { timeout: 8_000 },
  );
}

export const MIXED_V14_PRODUCTION_CONFORMANCE_EXPECTATION = Object.freeze({
  contextVersions: Object.freeze(["1.2.0", "1.3.0", "1.4.0"]),
  serviceKeyBytes: Object.freeze([
    '["actors","channels","contact","input","observation","overlaps","viewport"]',
    '["actorSnapshots","actors","channels","contact","input","observation","overlaps","viewport"]',
    '["actorRootSnapshots","actors","channels","contact","hostileProjectileDelivery","input","observation","overlaps","viewport"]',
  ]),
  executedInstanceIds: Object.freeze([
    "keyboard",
    "modern-probe",
    "batch3-probe",
  ]),
  lifecycleTrace: Object.freeze([
    "keyboard:initialize",
    "modern-probe:initialize",
    "batch3-probe:initialize",
    "keyboard:start",
    "modern-probe:start",
    "batch3-probe:start",
  ]),
});

export function isMixedV14ProductionConformanceEvidence(
  value: unknown,
): boolean {
  if (value === null || typeof value !== "object") return false;
  const snapshot = value as Record<string, unknown>;
  const expected = MIXED_V14_PRODUCTION_CONFORMANCE_EXPECTATION;
  return (
    snapshot.phase === "running" &&
    JSON.stringify(snapshot.contextVersions) ===
      JSON.stringify(expected.contextVersions) &&
    JSON.stringify(snapshot.serviceKeyBytes) ===
      JSON.stringify(expected.serviceKeyBytes) &&
    snapshot.olderContextsHaveV14Authority === false &&
    snapshot.v14HasExactGrantedAuthority === true &&
    JSON.stringify(snapshot.executedInstanceIds) ===
      JSON.stringify(expected.executedInstanceIds) &&
    JSON.stringify(snapshot.lifecycleTrace) ===
      JSON.stringify(expected.lifecycleTrace)
  );
}

async function waitForMixedV14ConformanceEvidence(page: Page): Promise<void> {
  await page.waitForFunction(
    (expected) => {
      const bridge = (
        window as Window & {
          __SHOOTER_TEST__?: {
            getMixedV14ConformanceSnapshot?: () => {
              phase: string;
              contextVersions: readonly string[];
              serviceKeyBytes: readonly string[];
              olderContextsHaveV14Authority: boolean;
              v14HasExactGrantedAuthority: boolean;
              executedInstanceIds: readonly string[];
              lifecycleTrace: readonly string[];
            } | null;
          };
        }
      ).__SHOOTER_TEST__;
      const snapshot = bridge?.getMixedV14ConformanceSnapshot?.();
      return (
        snapshot?.phase === "running" &&
        JSON.stringify(snapshot.contextVersions) ===
          JSON.stringify(expected.contextVersions) &&
        JSON.stringify(snapshot.serviceKeyBytes) ===
          JSON.stringify(expected.serviceKeyBytes) &&
        snapshot.olderContextsHaveV14Authority === false &&
        snapshot.v14HasExactGrantedAuthority === true &&
        JSON.stringify(snapshot.executedInstanceIds) ===
          JSON.stringify(expected.executedInstanceIds) &&
        JSON.stringify(snapshot.lifecycleTrace) ===
          JSON.stringify(expected.lifecycleTrace)
      );
    },
    MIXED_V14_PRODUCTION_CONFORMANCE_EXPECTATION,
    { timeout: 8_000 },
  );
}

function collectPageFailures(page: Page): {
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
} {
  const failures = {
    consoleErrors: [] as string[],
    pageErrors: [] as string[],
    failedRequests: [] as string[],
  };
  page.on("console", (message) => {
    if (message.type() === "error")
      failures.consoleErrors.push(message.text().slice(0, 300));
  });
  page.on("pageerror", (error) =>
    failures.pageErrors.push((error.stack ?? error.message).slice(0, 1_000)),
  );
  page.on("requestfailed", (request) =>
    failures.failedRequests.push(new URL(request.url()).pathname.slice(0, 300)),
  );
  return failures;
}

async function canvasGeometry(page: Page) {
  const canvas = page.locator("canvas");
  await canvas.waitFor({ state: "visible" });
  const box = await canvas.boundingBox();
  assertGate(box, "game canvas has no visible bounding box");
  return { canvas, box };
}

async function runDesktopGate(
  browser: Browser,
  url: string,
  screenshotPath: string,
  screenshotEvidencePath: string,
): Promise<GateCase> {
  const viewport = { width: 1280, height: 720 };
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const failures = collectPageFailures(page);
  const checks: string[] = [];
  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await waitForScene(page, "start");
    checks.push("start-scene");
    const { canvas, box } = await canvasGeometry(page);
    assertGate(
      box.width <= viewport.width && box.height <= viewport.height,
      "desktop canvas overflows viewport",
    );
    checks.push("responsive-canvas");

    await page.keyboard.press("Enter");
    const play = await waitForScene(page, "play");
    assertGate(play.scene === "play", "desktop did not enter play scene");
    checks.push("keyboard-start");
    await page.waitForFunction(() => {
      const bridge = (
        window as Window & {
          __SHOOTER_TEST__?: { getSnapshot: () => BrowserSnapshot | null };
        }
      ).__SHOOTER_TEST__;
      const snapshot = bridge?.getSnapshot();
      return (
        snapshot?.scene === "play" &&
        snapshot.activePlayerBullets > 0 &&
        snapshot.activeEnemies > 0
      );
    });
    checks.push("spawn-and-auto-fire");
    await waitForMultiWeaponEvidence(page);
    checks.push("multi-weapon-firing-and-budget");
    await waitForMultiWaveEvidence(page);
    checks.push("multi-wave-execution");
    await waitForEnemyWavePatternExecutionEvidence(page);
    checks.push("enemy-wave-patterns-generation-movement-and-budget");
    const enemyWavePatternEvidence =
      await readEnemyWavePatternGateEvidence(page);
    await waitForPickupExecutionEvidence(page);
    checks.push("pickup-effects-and-budget");

    const beforeMove = await readSnapshot(page);
    assertGate(beforeMove?.scene === "play", "missing pre-move snapshot");
    await page.keyboard.down("ArrowUp");
    await page.waitForTimeout(350);
    await page.keyboard.up("ArrowUp");
    const afterMove = await readSnapshot(page);
    assertGate(
      afterMove?.scene === "play" && afterMove.playerY < beforeMove.playerY - 5,
      "keyboard movement did not move the player",
    );
    checks.push("keyboard-movement");
    await waitForBatch1VerticalSliceEvidence(page);
    checks.push("batch1-resolved-vertical-slice");
    await waitForMixedV13ConformanceEvidence(page);
    await waitForMixedV14ConformanceEvidence(page);
    checks.push("mixed-v13-context-conformance");
    checks.push("mixed-v14-production-instantiation-conformance");
    await waitForBatch2NearestEvidence(page);
    checks.push("batch2-nearest-targeting-snapshot-evidence");
    await page.keyboard.down("ArrowDown");
    await page.waitForTimeout(350);
    await page.keyboard.up("ArrowDown");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.25);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.54, box.y + box.height * 0.82);
    await page.mouse.up();
    await waitForBatch2VerticalSliceEvidence(page, true);
    checks.push("batch2-ready-v13-vertical-slice");
    await completeBatch2ProgressionEvidence(page, box, "mouse");
    checks.push("batch2-progression-addressed-commit");
    await page.waitForFunction(
      () => {
        const snapshot = (
          window as Window & {
            __SHOOTER_TEST__?: { getSnapshot: () => BrowserSnapshot | null };
          }
        ).__SHOOTER_TEST__?.getSnapshot();
        return (
          snapshot?.scene === "play" &&
          snapshot.bossHealth !== null &&
          snapshot.activeEnemyBullets > 0
        );
      },
      undefined,
      { timeout: 12_000 },
    );
    checks.push("boss-and-enemy-bullets");
    await waitForBulletPatternExecutionEvidence(page);
    checks.push("five-bullet-patterns-generation-movement-and-budget");
    const bulletPatternEvidence = await readBulletPatternGateEvidence(page);
    await waitForScoringExecutionEvidence(page);
    checks.push("combo-and-graze-scoring");
    await waitForCatalogAssetEvidence(page);
    checks.push("catalog-assets-loaded-and-rendered");
    const bossStart = await readSnapshot(page);
    assertGate(
      bossStart?.scene === "play" && bossStart.bossHealth !== null,
      "missing initial Boss snapshot",
    );
    try {
      await page.waitForFunction(
        (initialBossHealth) => {
          const snapshot = (
            window as Window & {
              __SHOOTER_TEST__?: { getSnapshot: () => BrowserSnapshot | null };
            }
          ).__SHOOTER_TEST__?.getSnapshot();
          return (
            snapshot?.scene === "play" &&
            snapshot.bossHealth !== null &&
            snapshot.bossHealth < initialBossHealth
          );
        },
        bossStart.bossHealth,
        { timeout: 8_000 },
      );
    } catch {
      const diagnostic = await readSnapshot(page);
      throw new Error(
        `boss received no player damage: ${JSON.stringify(diagnostic)}`,
      );
    }
    checks.push("boss-damage");
    await waitForMultiWeaponEvidence(page, true);
    checks.push("multi-weapon-damage");
    const end = await waitForScene(page, "end", 25_000);
    assertGate(
      end.scene === "end" && end.won && end.outcomeReason === "bossDefeated",
      "desktop run did not reach the winning end scene",
    );
    checks.push("win-end-scene");
    await page.keyboard.press("Enter");
    await waitForScene(page, "play");
    checks.push("restart");
    await waitForFreshBatch2Progression(page);
    checks.push("batch2-progression-fresh-restart");
    await completeBatch2DefenseEvidence(page, box, "mouse");
    checks.push("batch2-defense-half-open-route-matrix");
    await completeBatch2FormationMatrix(page, box, "mouse");
    checks.push("batch2-ten-formation-browser-matrix");
    await canvas.screenshot({ path: screenshotPath });

    assertGate(
      failures.consoleErrors.length === 0,
      `desktop emitted console errors: ${failures.consoleErrors[0] ?? "unknown"}`,
    );
    assertGate(
      failures.pageErrors.length === 0,
      `desktop emitted page errors: ${failures.pageErrors[0] ?? "unknown"}`,
    );
    assertGate(
      failures.failedRequests.length === 0,
      `desktop had failed requests: ${failures.failedRequests[0] ?? "unknown"}`,
    );
    return {
      name: "desktop",
      assertionProfileId: "comprehensive-v1",
      viewport,
      checks,
      consoleErrorCount: 0,
      pageErrorCount: 0,
      failedRequestCount: 0,
      enemyWavePatternEvidence,
      bulletPatternEvidence,
      screenshot: screenshotEvidencePath,
    };
  } catch (error) {
    return await throwWithFailureSnapshot(page, error);
  } finally {
    await context.close();
  }
}

async function runMobileGate(
  browser: Browser,
  url: string,
  screenshotPath: string,
  screenshotEvidencePath: string,
): Promise<GateCase> {
  const viewport = { width: 390, height: 844 };
  const context = await browser.newContext({
    viewport,
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  const failures = collectPageFailures(page);
  const checks: string[] = [];
  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await waitForScene(page, "start");
    const { canvas, box } = await canvasGeometry(page);
    assertGate(
      box.width <= viewport.width && box.height <= viewport.height,
      "mobile canvas overflows viewport",
    );
    checks.push("mobile-responsive-canvas");

    await page.touchscreen.tap(
      box.x + box.width / 2,
      box.y + box.height * 0.72,
    );
    const play = await waitForScene(page, "play");
    assertGate(play.scene === "play", "touch did not start the game");
    checks.push("touch-start");

    const startX = box.x + box.width * 0.5;
    const startY = box.y + box.height * 0.82;
    const targetX = box.x + box.width * 0.25;
    const targetY = box.y + box.height * 0.68;
    const session = await context.newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: startX, y: startY }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: targetX, y: targetY }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await page.waitForTimeout(150);
    const moved = await readSnapshot(page);
    assertGate(
      moved?.scene === "play" && moved.playerX < 200 && moved.playerY < 760,
      "touch drag did not reposition the player",
    );
    checks.push("touch-drag-movement");
    const modularTouch = await page.evaluate(() =>
      (
        window as Window & {
          __SHOOTER_TEST__?: {
            getBatch1Snapshot?: () => {
              player: { x: number; y: number };
            } | null;
          };
        }
      ).__SHOOTER_TEST__?.getBatch1Snapshot?.(),
    );
    assertGate(
      modularTouch !== null &&
        modularTouch !== undefined &&
        modularTouch.player.x < 300 &&
        modularTouch.player.y < 600,
      "Batch 1 touch path did not move the modular actor",
    );
    await waitForBatch1VerticalSliceEvidence(page);
    checks.push("mobile-batch1-resolved-vertical-slice");
    await waitForBatch2VerticalSliceEvidence(page, false);
    checks.push("mobile-batch2-ready-v13-vertical-slice");
    await completeBatch2ProgressionEvidence(page, box, "touch");
    checks.push("mobile-batch2-progression-addressed-commit");
    await waitForMixedV13ConformanceEvidence(page);
    await waitForMixedV14ConformanceEvidence(page);
    checks.push("mobile-mixed-v13-context-conformance");
    checks.push("mobile-mixed-v14-production-instantiation-conformance");
    await waitForBatch2NearestEvidence(page);
    checks.push("mobile-batch2-nearest-targeting-snapshot-evidence");
    await page.waitForFunction(() => {
      const snapshot = (
        window as Window & {
          __SHOOTER_TEST__?: { getSnapshot: () => BrowserSnapshot | null };
        }
      ).__SHOOTER_TEST__?.getSnapshot();
      return (
        snapshot?.scene === "play" &&
        snapshot.activePlayerBullets > 0 &&
        snapshot.activeEnemies > 0
      );
    });
    checks.push("mobile-loop-and-spawns");
    await waitForMultiWeaponEvidence(page);
    checks.push("mobile-multi-weapon-firing-and-budget");
    await waitForMultiWaveEvidence(page);
    checks.push("mobile-multi-wave-execution");
    await waitForEnemyWavePatternExecutionEvidence(page);
    checks.push("mobile-enemy-wave-patterns-generation-movement-and-budget");
    const enemyWavePatternEvidence =
      await readEnemyWavePatternGateEvidence(page);
    await waitForPickupExecutionEvidence(page);
    checks.push("mobile-pickup-effects-and-budget");
    await waitForCatalogAssetEvidence(page);
    checks.push("mobile-catalog-assets-loaded-and-rendered");
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: targetX, y: targetY }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: box.x + box.width * 0.54,
          y: box.y + box.height * 0.82,
        },
      ],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await page.waitForFunction(
      () => {
        const snapshot = (
          window as Window & {
            __SHOOTER_TEST__?: { getSnapshot: () => BrowserSnapshot | null };
          }
        ).__SHOOTER_TEST__?.getSnapshot();
        return (
          snapshot?.scene === "play" &&
          snapshot.bossHealth !== null &&
          snapshot.activeEnemyBullets > 0
        );
      },
      undefined,
      { timeout: 12_000 },
    );
    await waitForBulletPatternExecutionEvidence(page);
    checks.push("mobile-five-bullet-patterns-generation-movement-and-budget");
    const bulletPatternEvidence = await readBulletPatternGateEvidence(page);
    await waitForScoringExecutionEvidence(page);
    checks.push("mobile-combo-and-graze-scoring");
    const end = await waitForScene(page, "end", 25_000);
    assertGate(
      end.scene === "end" && end.won && end.outcomeReason === "bossDefeated",
      "mobile run did not reach the configured winning end scene",
    );
    checks.push("mobile-win-condition-execution");
    await page.touchscreen.tap(
      box.x + box.width / 2,
      box.y + box.height * 0.68,
    );
    await waitForScene(page, "play");
    checks.push("mobile-restart");
    await waitForFreshBatch2Progression(page);
    checks.push("mobile-batch2-progression-fresh-restart");
    await completeBatch2DefenseEvidence(page, box, "touch");
    checks.push("mobile-batch2-defense-half-open-route-matrix");
    await completeBatch2FormationMatrix(page, box, "touch");
    checks.push("mobile-batch2-ten-formation-browser-matrix");
    await canvas.screenshot({ path: screenshotPath });

    assertGate(
      failures.consoleErrors.length === 0,
      "mobile emitted console errors",
    );
    assertGate(failures.pageErrors.length === 0, "mobile emitted page errors");
    assertGate(
      failures.failedRequests.length === 0,
      "mobile had failed requests",
    );
    return {
      name: "mobile",
      assertionProfileId: "comprehensive-v1",
      viewport,
      checks,
      consoleErrorCount: 0,
      pageErrorCount: 0,
      failedRequestCount: 0,
      enemyWavePatternEvidence,
      bulletPatternEvidence,
      screenshot: screenshotEvidencePath,
    };
  } catch (error) {
    return await throwWithFailureSnapshot(page, error);
  } finally {
    await context.close();
  }
}

type PlayBrowserSnapshot = Extract<BrowserSnapshot, { scene: "play" }>;
type EndBrowserSnapshot = Extract<BrowserSnapshot, { scene: "end" }>;
type CaseAwareInputDriver = Readonly<{
  tick: (snapshot?: BrowserSnapshot) => Promise<void>;
  stop: () => Promise<void>;
}>;

function createKeyboardEvasionDriver(page: Page): CaseAwareInputDriver {
  const keys = ["ArrowLeft", "ArrowRight"] as const;
  const durations = [600, 700, 650, 750] as const;
  let active = true;
  let currentKey: (typeof keys)[number] | undefined;
  let step = 0;
  let switchAt = 0;
  let previousBossX: number | undefined;
  let previousBossElapsedMs: number | undefined;
  return {
    async tick(snapshot) {
      if (!active) return;
      if (
        snapshot?.scene === "play" &&
        snapshot.bossHealth !== null &&
        snapshot.bossX !== null &&
        snapshot.bossY !== null
      ) {
        const elapsedDeltaMs =
          previousBossElapsedMs === undefined
            ? 0
            : snapshot.elapsedMs - previousBossElapsedMs;
        const bossVelocityX =
          previousBossX === undefined || elapsedDeltaMs <= 0
            ? 0
            : Math.max(
                -500,
                Math.min(
                  500,
                  ((snapshot.bossX - previousBossX) * 1_000) / elapsedDeltaMs,
                ),
              );
        previousBossX = snapshot.bossX;
        previousBossElapsedMs = snapshot.elapsedMs;
        const projectileSpeed = Math.max(
          ...snapshot.weapons.map((weapon) => weapon.projectileSpeed),
        );
        const travelSeconds =
          Math.max(0, snapshot.playerY - snapshot.bossY) / projectileSpeed;
        const targetX = snapshot.bossX + bossVelocityX * travelSeconds;
        const deltaX = targetX - snapshot.playerX;
        const targetKey =
          Math.abs(deltaX) <= 12
            ? undefined
            : deltaX < 0
              ? "ArrowLeft"
              : "ArrowRight";
        if (currentKey !== targetKey) {
          if (currentKey !== undefined) await page.keyboard.up(currentKey);
          currentKey = targetKey;
          if (currentKey !== undefined) await page.keyboard.down(currentKey);
        }
        return;
      }
      const now = Date.now();
      if (now < switchAt) return;
      if (currentKey !== undefined) await page.keyboard.up(currentKey);
      currentKey = keys[step % keys.length]!;
      await page.keyboard.down(currentKey);
      switchAt = now + durations[step % durations.length]!;
      step += 1;
    },
    async stop() {
      active = false;
      for (const key of keys) await page.keyboard.up(key);
      currentKey = undefined;
    },
  };
}

function createTouchEvasionDriver(
  session: CDPSession,
  box: Readonly<{ x: number; y: number; width: number; height: number }>,
  logicalViewport: Readonly<{ width: number; height: number }>,
): CaseAwareInputDriver {
  let active = true;
  let step = 0;
  let moveAt = 0;
  let previousBossX: number | undefined;
  let previousBossElapsedMs: number | undefined;
  const screenPoint = (worldX: number, worldY: number) => ({
    x: box.x + (worldX / logicalViewport.width) * box.width,
    y: box.y + (worldY / logicalViewport.height) * box.height,
  });
  const drag = async (
    from: Readonly<{ x: number; y: number }>,
    to: Readonly<{ x: number; y: number }>,
  ) => {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [from],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [to],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  };
  return {
    async tick(snapshot) {
      if (!active || snapshot?.scene !== "play") return;
      const now = Date.now();
      let targetX: number;
      if (
        snapshot.bossHealth !== null &&
        snapshot.bossX !== null &&
        snapshot.bossY !== null
      ) {
        if (now < moveAt) return;
        const elapsedDeltaMs =
          previousBossElapsedMs === undefined
            ? 0
            : snapshot.elapsedMs - previousBossElapsedMs;
        const bossVelocityX =
          previousBossX === undefined || elapsedDeltaMs <= 0
            ? 0
            : Math.max(
                -500,
                Math.min(
                  500,
                  ((snapshot.bossX - previousBossX) * 1_000) / elapsedDeltaMs,
                ),
              );
        previousBossX = snapshot.bossX;
        previousBossElapsedMs = snapshot.elapsedMs;
        const projectileSpeed = Math.max(
          ...snapshot.weapons.map((weapon) => weapon.projectileSpeed),
        );
        const travelSeconds =
          Math.max(0, snapshot.playerY - snapshot.bossY) / projectileSpeed;
        targetX = snapshot.bossX + bossVelocityX * travelSeconds;
        moveAt = now + 100;
      } else {
        if (now < moveAt) return;
        targetX = logicalViewport.width * (step % 2 === 0 ? 0.25 : 0.75);
        step += 1;
        moveAt = now + 700;
      }
      targetX = Math.max(0, Math.min(logicalViewport.width, targetX));
      if (Math.abs(targetX - snapshot.playerX) <= 8) return;
      await drag(
        screenPoint(snapshot.playerX, snapshot.playerY),
        screenPoint(targetX, logicalViewport.height * 0.82),
      );
    },
    async stop() {
      active = false;
    },
  };
}

async function waitForCaseAwarePlayEvidence(
  page: Page,
  assertions: CaseAwareBrowserAssertions,
  inputDriver?: CaseAwareInputDriver,
): Promise<PlayBrowserSnapshot> {
  const deadline = Date.now() + assertions.playEvidenceTimeoutMs;
  let lastPlay: PlayBrowserSnapshot | null = null;
  let lastIssues: string[] = ["no play snapshot observed"];
  while (Date.now() <= deadline) {
    const snapshot = await readSnapshot(page);
    await inputDriver?.tick(snapshot ?? undefined);
    if (snapshot?.scene === "play") {
      lastPlay = snapshot;
      lastIssues = caseAwarePlaySnapshotIssues(snapshot, assertions);
      if (lastIssues.length === 0) return snapshot;
    } else if (snapshot?.scene === "end") {
      throw new Error(
        `case-aware play evidence ended before requirements passed; final=${JSON.stringify(
          boundedFailureSnapshot(snapshot),
        )}; issues=${lastIssues.slice(0, 8).join(" | ")}`,
      );
    }
    await page.waitForTimeout(50);
  }
  throw new Error(
    `case-aware play evidence timed out; issues=${lastIssues
      .slice(0, 8)
      .join(" | ")}; final=${JSON.stringify(
      boundedFailureSnapshot(await readSnapshot(page)),
    )}; lastPlayElapsedMs=${lastPlay?.elapsedMs ?? "none"}`,
  );
}

async function waitForCaseAwareRequiredPickups(
  page: Page,
  assertions: CaseAwareBrowserAssertions,
): Promise<void> {
  if (assertions.requiredPickupIds.length === 0) return;
  const deadline = Date.now() + assertions.playEvidenceTimeoutMs;
  let lastIssues = assertions.requiredPickupIds.map(
    (pickupId) => `pickup ${pickupId} has no evidence`,
  );
  while (Date.now() <= deadline) {
    const snapshot = await readSnapshot(page);
    if (snapshot?.scene === "play") {
      lastIssues = assertions.requiredPickupIds.flatMap((pickupId) => {
        const pickup = snapshot.pickups.find(
          (candidate) => candidate.id === pickupId,
        );
        return pickup !== undefined &&
          pickup.successfulSpawns > 0 &&
          pickup.droppedByBudget === 0 &&
          pickup.collections > 0
          ? []
          : [`pickup ${pickupId} did not spawn and collect within budget`];
      });
      if (lastIssues.length === 0) return;
    } else if (snapshot?.scene === "end") {
      throw new Error(
        `case-aware play evidence ended before required pickups passed; final=${JSON.stringify(
          boundedFailureSnapshot(snapshot),
        )}; issues=${lastIssues.slice(0, 8).join(" | ")}`,
      );
    }
    await page.waitForTimeout(50);
  }
  throw new Error(
    `case-aware play evidence timed out waiting for required pickups; final=${JSON.stringify(
      boundedFailureSnapshot(await readSnapshot(page)),
    )}; issues=${lastIssues.slice(0, 8).join(" | ")}`,
  );
}

async function waitForCaseAwareOutcome(
  page: Page,
  assertions: CaseAwareBrowserAssertions,
  inputDriver?: CaseAwareInputDriver,
): Promise<EndBrowserSnapshot> {
  const deadline = Date.now() + assertions.outcomeTimeoutMs;
  while (Date.now() <= deadline) {
    const snapshot = await readSnapshot(page);
    await inputDriver?.tick(snapshot ?? undefined);
    if (snapshot?.scene === "end") {
      const issues = caseAwareEndSnapshotIssues(snapshot, assertions);
      assertGate(
        issues.length === 0,
        `case-aware outcome mismatch: ${issues.join(" | ")}; final=${JSON.stringify(
          boundedFailureSnapshot(snapshot),
        )}`,
      );
      return snapshot;
    }
    await page.waitForTimeout(50);
  }
  throw new Error(
    `case-aware outcome timed out; final=${JSON.stringify(
      boundedFailureSnapshot(await readSnapshot(page)),
    )}`,
  );
}

function readCaseAwareGateEvidence(
  play: PlayBrowserSnapshot,
  outcome: EndBrowserSnapshot,
  assertions: CaseAwareBrowserAssertions,
): CaseAwareGateEvidence {
  return {
    expectedOutcome: assertions.expectedOutcome,
    play: {
      elapsedMs: play.elapsedMs,
      score: play.score,
      playerHealth: play.playerHealth,
      activeEnemyBullets: play.activeEnemyBullets,
      maxEnemyBullets: play.maxEnemyBullets,
      peakActiveEnemyBullets: play.peakActiveEnemyBullets,
      activePlayerBullets: play.activePlayerBullets,
      maxPlayerBullets: play.maxPlayerBullets,
      activeEnemies: play.activeEnemies,
      activePickups: play.activePickups,
      maxPickups: play.maxPickups,
      executedWeaponIds: play.weapons
        .filter((weapon) => weapon.successfulProjectiles > 0)
        .map((weapon) => weapon.id),
      executedWaveIds: play.enemyWaves
        .filter((wave) => wave.successfulSpawns > 0)
        .map((wave) => wave.id),
      executedBossPatternIds: play.bulletPatterns
        .filter((pattern) => pattern.successfulSpawns > 0)
        .map((pattern) => pattern.id),
      collectedPickupIds: play.pickups
        .filter((pickup) => pickup.collections > 0)
        .map((pickup) => pickup.id),
      assetMode: play.assets.mode,
      expectedTextureCount: play.assets.expectedTextureKeys.length,
      loadedTextureCount: play.assets.loadedTextureKeys.length,
      usedTextureCount: play.assets.usedTextureKeys.length,
    },
    outcome: {
      won: outcome.won,
      reason: outcome.outcomeReason,
      elapsedMs: outcome.elapsedMs,
      score: outcome.score,
    },
  };
}

async function runCaseAwareDesktopGate(
  browser: Browser,
  url: string,
  screenshotPath: string,
  screenshotEvidencePath: string,
  assertions: CaseAwareBrowserAssertions,
): Promise<GateCase> {
  const viewport = { width: 1280, height: 720 };
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const failures = collectPageFailures(page);
  const checks: string[] = [];
  let inputDriver: CaseAwareInputDriver | undefined;
  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await waitForScene(page, "start");
    checks.push("case-aware-start-scene");
    const { canvas, box } = await canvasGeometry(page);
    assertGate(
      box.width <= viewport.width && box.height <= viewport.height,
      "desktop canvas overflows viewport",
    );
    checks.push("case-aware-responsive-canvas");

    await page.keyboard.press("Enter");
    const beforeMove = await waitForScene(page, "play");
    assertGate(beforeMove.scene === "play", "desktop did not enter play scene");
    checks.push("case-aware-keyboard-start");
    await page.keyboard.down("ArrowUp");
    await page.waitForTimeout(300);
    await page.keyboard.up("ArrowUp");
    const afterMove = await readSnapshot(page);
    assertGate(
      afterMove?.scene === "play" && afterMove.playerY < beforeMove.playerY - 5,
      "keyboard movement did not move the player",
    );
    checks.push("case-aware-keyboard-movement");

    await page.keyboard.down("ArrowDown");
    await page.waitForTimeout(450);
    await page.keyboard.up("ArrowDown");
    const restored = await readSnapshot(page);
    assertGate(
      restored?.scene === "play" && restored.playerY > afterMove.playerY + 5,
      "keyboard movement did not restore the player firing lane",
    );
    checks.push("case-aware-keyboard-firing-lane-restored");

    if (assertions.requiredPickupIds.length > 0) {
      await waitForCaseAwareRequiredPickups(page, assertions);
      checks.push("case-aware-desktop-required-pickups");
    }

    inputDriver = createKeyboardEvasionDriver(page);
    const play = await waitForCaseAwarePlayEvidence(
      page,
      assertions,
      inputDriver,
    );
    checks.push("case-aware-configured-play-evidence");
    await canvas.screenshot({ path: screenshotPath });
    const outcome = await waitForCaseAwareOutcome(
      page,
      assertions,
      inputDriver,
    );
    await inputDriver.stop();
    inputDriver = undefined;
    checks.push("case-aware-configured-outcome");
    await page.keyboard.press("Enter");
    await waitForScene(page, "play");
    checks.push("case-aware-restart");

    assertGate(
      failures.consoleErrors.length === 0,
      `desktop emitted console errors: ${failures.consoleErrors[0] ?? "unknown"}`,
    );
    assertGate(
      failures.pageErrors.length === 0,
      `desktop emitted page errors: ${failures.pageErrors[0] ?? "unknown"}`,
    );
    assertGate(
      failures.failedRequests.length === 0,
      `desktop had failed requests: ${failures.failedRequests[0] ?? "unknown"}`,
    );
    return {
      name: "desktop",
      assertionProfileId: "case-aware-v1",
      viewport,
      checks,
      consoleErrorCount: 0,
      pageErrorCount: 0,
      failedRequestCount: 0,
      caseAwareEvidence: readCaseAwareGateEvidence(play, outcome, assertions),
      screenshot: screenshotEvidencePath,
    };
  } catch (error) {
    return await throwWithFailureSnapshot(page, error);
  } finally {
    await inputDriver?.stop();
    await context.close();
  }
}

async function runCaseAwareMobileGate(
  browser: Browser,
  url: string,
  screenshotPath: string,
  screenshotEvidencePath: string,
  assertions: CaseAwareBrowserAssertions,
  logicalViewport: Readonly<{ width: number; height: number }>,
): Promise<GateCase> {
  const viewport = { width: 390, height: 844 };
  const context = await browser.newContext({
    viewport,
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  const failures = collectPageFailures(page);
  const checks: string[] = [];
  let inputDriver: CaseAwareInputDriver | undefined;
  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await waitForScene(page, "start");
    const { canvas, box } = await canvasGeometry(page);
    assertGate(
      box.width <= viewport.width && box.height <= viewport.height,
      "mobile canvas overflows viewport",
    );
    checks.push("case-aware-mobile-responsive-canvas");

    await page.touchscreen.tap(
      box.x + box.width / 2,
      box.y + box.height * 0.72,
    );
    await waitForScene(page, "play");
    checks.push("case-aware-touch-start");

    const startX = box.x + box.width * 0.5;
    const startY = box.y + box.height * 0.82;
    const targetX = box.x + box.width * 0.25;
    const targetY = box.y + box.height * 0.68;
    const session = await context.newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: startX, y: startY }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: targetX, y: targetY }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await page.waitForTimeout(150);
    const moved = await readSnapshot(page);
    assertGate(
      moved?.scene === "play" && moved.playerX < 200 && moved.playerY < 760,
      "touch drag did not reposition the player",
    );
    checks.push("case-aware-touch-drag-movement");

    if (assertions.requiredPickupIds.length > 0) {
      await waitForCaseAwareRequiredPickups(page, assertions);
      checks.push("case-aware-mobile-required-pickups");
    }

    const restoredX = box.x + box.width * 0.54;
    const restoredY = box.y + box.height * 0.82;
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: targetX, y: targetY }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: restoredX, y: restoredY }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await page.waitForTimeout(150);
    const restored = await readSnapshot(page);
    assertGate(
      restored?.scene === "play" &&
        moved?.scene === "play" &&
        restored.playerX > moved.playerX + 5 &&
        restored.playerY > moved.playerY + 5,
      "touch drag did not restore the player to the firing lane",
    );
    checks.push("case-aware-touch-firing-lane-restored");

    inputDriver = createTouchEvasionDriver(session, box, logicalViewport);
    const play = await waitForCaseAwarePlayEvidence(
      page,
      assertions,
      inputDriver,
    );
    checks.push("case-aware-mobile-configured-play-evidence");
    await canvas.screenshot({ path: screenshotPath });
    const outcome = await waitForCaseAwareOutcome(
      page,
      assertions,
      inputDriver,
    );
    await inputDriver.stop();
    inputDriver = undefined;
    checks.push("case-aware-mobile-configured-outcome");
    await page.touchscreen.tap(
      box.x + box.width / 2,
      box.y + box.height * 0.68,
    );
    try {
      await waitForScene(page, "play");
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`mobile touch restart failed: ${detail}`);
    }
    checks.push("case-aware-mobile-restart");

    assertGate(
      failures.consoleErrors.length === 0,
      `mobile emitted console errors: ${failures.consoleErrors[0] ?? "unknown"}`,
    );
    assertGate(
      failures.pageErrors.length === 0,
      `mobile emitted page errors: ${failures.pageErrors[0] ?? "unknown"}`,
    );
    assertGate(
      failures.failedRequests.length === 0,
      `mobile had failed requests: ${failures.failedRequests[0] ?? "unknown"}`,
    );
    return {
      name: "mobile",
      assertionProfileId: "case-aware-v1",
      viewport,
      checks,
      consoleErrorCount: 0,
      pageErrorCount: 0,
      failedRequestCount: 0,
      caseAwareEvidence: readCaseAwareGateEvidence(play, outcome, assertions),
      screenshot: screenshotEvidencePath,
    };
  } catch (error) {
    return await throwWithFailureSnapshot(page, error);
  } finally {
    await inputDriver?.stop();
    await context.close();
  }
}

function withVerificationEvidence(
  manifest: RunManifest,
  sha256: string,
  verificationPath: string,
): RunManifest {
  return RunManifestSchema.parse({
    ...manifest,
    artifacts: {
      ...manifest.artifacts,
      verification: { path: verificationPath, sha256 },
    },
  });
}

export async function runBrowserVerificationStage(options: {
  projectDirectory: string;
  runId: string;
  attempt?: number;
  failureDisposition?: "terminal" | "repairable";
  assertionProfile?: BrowserAssertionProfile;
  now?: () => Date;
}): Promise<RunManifest> {
  const projectDirectory = path.resolve(options.projectDirectory);
  const runsDirectory = path.join(projectDirectory, "artifacts", "runs");
  const runDirectory = path.join(runsDirectory, options.runId);
  assertInside(runsDirectory, runDirectory);
  const manifestPath = path.join(runDirectory, "manifest.json");
  let manifest = RunManifestSchema.parse(
    JSON.parse(await readFile(manifestPath, "utf8")),
  );
  if (manifest.state !== "built") {
    throw new Error(
      `browser verification requires built state, received ${manifest.state}`,
    );
  }
  await verifyRunEvidence(runDirectory, manifest);
  const assertionProfile = BrowserAssertionProfileSchema.parse(
    options.assertionProfile ?? {
      profileVersion: "1.0.0",
      profileId: "comprehensive-v1",
    },
  );
  let caseAssertions: CaseAwareBrowserAssertions | undefined;
  let caseLogicalViewport:
    Readonly<{ width: number; height: number }> | undefined;
  if (assertionProfile.profileId === "case-aware-v1") {
    const specEvidence = manifest.artifacts.spec;
    assertGate(specEvidence, "case-aware verification requires Spec evidence");
    const specPath = path.join(runDirectory, ...specEvidence.path.split("/"));
    assertInside(runDirectory, specPath);
    const spec = parseShooterGameSpec(
      JSON.parse(await readFile(specPath, "utf8")),
    );
    caseAssertions = deriveCaseAwareBrowserAssertions(
      spec,
      manifest.artifacts.assetSelection !== undefined,
    );
    caseLogicalViewport = {
      width: spec.viewport.logicalWidth,
      height: spec.viewport.logicalHeight,
    };
  }

  const verificationPath = verificationPathForAttempt(options.attempt ?? 0);
  const reportPath = `${verificationPath}/browser-gates.json`;
  const verificationDirectory = path.join(runDirectory, verificationPath);
  await mkdir(verificationDirectory);
  const browserBuildDirectory = path.join(
    verificationDirectory,
    "browser-build",
  );
  const templateDirectory = path.join(
    runDirectory,
    "workspace",
    "game-template",
    "vertical-shooter",
  );
  await buildInstrumentedBundle(
    projectDirectory,
    templateDirectory,
    browserBuildDirectory,
  );
  const screenshotsDirectory = path.join(verificationDirectory, "screenshots");
  await mkdir(screenshotsDirectory);
  const { server, url } = await startStaticServer(browserBuildDirectory);
  let browser: Browser | undefined;
  const cases: GateCase[] = [];

  try {
    browser = await chromium.launch({ channel: EDGE_CHANNEL, headless: true });
    cases.push(
      assertionProfile.profileId === "comprehensive-v1"
        ? await runDesktopGate(
            browser,
            url,
            path.join(screenshotsDirectory, "desktop.png"),
            `${verificationPath}/screenshots/desktop.png`,
          )
        : await runCaseAwareDesktopGate(
            browser,
            url,
            path.join(screenshotsDirectory, "desktop.png"),
            `${verificationPath}/screenshots/desktop.png`,
            caseAssertions!,
          ),
    );
    await writeJsonAtomic(path.join(runDirectory, reportPath), {
      verificationVersion: "1.3.0",
      status: "runtime-passed",
      browser: { engine: "chromium", channel: EDGE_CHANNEL },
      assertionProfile,
      caseAssertions: caseAssertions ?? null,
      cases,
      findings: [],
    });
    manifest = withVerificationEvidence(
      manifest,
      (await digestDirectory(verificationDirectory)).sha256,
      verificationPath,
    );
    manifest = transitionRunManifest(
      manifest,
      "runtime_checked",
      "Desktop Chromium runtime and play gates passed.",
      options.now?.() ?? new Date(),
    );
    await writeJsonAtomic(manifestPath, manifest);

    cases.push(
      assertionProfile.profileId === "comprehensive-v1"
        ? await runMobileGate(
            browser,
            url,
            path.join(screenshotsDirectory, "mobile.png"),
            `${verificationPath}/screenshots/mobile.png`,
          )
        : await runCaseAwareMobileGate(
            browser,
            url,
            path.join(screenshotsDirectory, "mobile.png"),
            `${verificationPath}/screenshots/mobile.png`,
            caseAssertions!,
            caseLogicalViewport!,
          ),
    );
    await writeJsonAtomic(path.join(runDirectory, reportPath), {
      verificationVersion: "1.3.0",
      status: "passed",
      browser: { engine: "chromium", channel: EDGE_CHANNEL },
      assertionProfile,
      caseAssertions: caseAssertions ?? null,
      cases,
      findings: [],
    });
    manifest = withVerificationEvidence(
      manifest,
      (await digestDirectory(verificationDirectory)).sha256,
      verificationPath,
    );
    manifest = transitionRunManifest(
      manifest,
      "play_checked",
      "Desktop and mobile Chromium gates passed.",
      options.now?.() ?? new Date(),
    );
    await writeJsonAtomic(manifestPath, manifest);
    return manifest;
  } catch (error) {
    const caseName = cases.length === 0 ? "desktop" : "mobile";
    const finding = classifyBrowserFailure(error, reportPath, caseName);
    await writeJsonAtomic(path.join(runDirectory, reportPath), {
      verificationVersion: "1.3.0",
      status: "failed",
      browser: { engine: "chromium", channel: EDGE_CHANNEL },
      assertionProfile,
      caseAssertions: caseAssertions ?? null,
      completedCases: cases,
      findings: [finding],
      failureSnapshot:
        error instanceof BrowserGateSnapshotFailure
          ? error.failureSnapshot
          : { scene: "unavailable" },
    });
    manifest = withVerificationEvidence(
      manifest,
      (await digestDirectory(verificationDirectory)).sha256,
      verificationPath,
    );
    if ((options.failureDisposition ?? "terminal") === "terminal") {
      manifest = transitionRunManifest(
        manifest,
        "failed",
        "Automated Chromium gate failed; bounded evidence recorded.",
        options.now?.() ?? new Date(),
      );
    }
    await writeJsonAtomic(manifestPath, manifest);
    throw new BrowserVerificationFailure(finding);
  } finally {
    await browser?.close();
    await closeServer(server);
  }
}
