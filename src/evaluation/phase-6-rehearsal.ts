import { createBrowserGateSpec } from "../verification/browser-gate-spec.js";
import {
  EvaluationBatchDefinitionSchema,
  type EvaluationBatchDefinition,
} from "./evaluation-schema.js";

function createOrbitalSiegeSpec() {
  const spec = createBrowserGateSpec();
  spec.title = "Orbital Siege Baseline";
  spec.theme = "orbital fleet siege";
  spec.story =
    "A blue interceptor breaks a disciplined orbital blockade and defeats its command carrier.";
  return spec;
}

function createRetroMeteorScoreSpec() {
  const spec = createBrowserGateSpec();
  spec.title = "Retro Meteor Score Rush";
  spec.theme = "retro meteor salvage race";
  spec.story =
    "A salvage pilot races through meteor lanes and wins by reaching a score quota before being overwhelmed.";
  spec.visualStyle = ["pixel-art", "retro"];
  spec.difficulty = "easy";
  spec.enemyWaves[0]!.spawnIntervalMs = 400;
  spec.enemyWaves[0]!.scoreValue = 150;
  spec.enemyWaves[1]!.startMs = 1_400;
  spec.enemyWaves[1]!.spawnIntervalMs = 250;
  spec.enemyWaves[1]!.scoreValue = 250;
  spec.boss.phases[0]!.patternIds = ["browser-wave", "browser-aimed"];
  spec.scoring = {
    comboWindowMs: 4_000,
    comboMultiplierCap: 6,
    grazePoints: 15,
  };
  spec.winCondition = { type: "scoreReached", targetScore: 500 };
  spec.loseCondition = { type: "healthDepleted" };
  return spec;
}

function createNeonMonsoonSurvivalSpec() {
  const spec = createBrowserGateSpec();
  spec.title = "Neon Monsoon Survival";
  spec.theme = "neon plasma monsoon";
  spec.story =
    "A courier survives a timed plasma storm while dense enemy formations compete for a strict projectile budget.";
  spec.visualStyle = ["vector", "glow"];
  spec.difficulty = "hard";
  spec.enemyWaves[0]!.spawnIntervalMs = 250;
  spec.enemyWaves[0]!.maxAlive = 4;
  spec.enemyWaves[1]!.startMs = 1_000;
  spec.enemyWaves[1]!.spawnIntervalMs = 150;
  spec.enemyWaves[1]!.maxAlive = 6;
  spec.bulletPatterns = spec.bulletPatterns.map((pattern) => ({
    ...pattern,
    speed: Math.min(pattern.speed + 35, 640),
    intervalMs: Math.max(pattern.intervalMs - 40, 80),
  }));
  spec.scoring = {
    comboWindowMs: 1_200,
    comboMultiplierCap: 2.5,
    grazePoints: 80,
  };
  spec.winCondition = { type: "surviveMs", targetMs: 10_000 };
  spec.loseCondition = { type: "timeExpired", limitMs: 20_000 };
  return spec;
}

export function createPhase6RehearsalDefinition(): EvaluationBatchDefinition {
  return EvaluationBatchDefinitionSchema.parse({
    schemaVersion: "1.0.0",
    batchId: "phase-6-rehearsal-v1",
    description:
      "No-paid Phase 6 rehearsal covering one Boss-defeat baseline and two valid alternative game outcomes through the common deterministic pipeline.",
    paidModelCallsAllowed: false,
    executionMode: "sequential",
    cases: [
      {
        caseId: "orbital-siege-balanced",
        request:
          "Create a medium orbital fleet siege with overlapping waves, a multi-pattern carrier Boss, combo/graze scoring, and a Boss-defeat victory.",
        inputKind: "local-spec",
        resourceProfile: "balanced",
        enableAssetSelection: true,
        browserGate: "case-aware-v1",
        expectedDifferentiators: {
          theme:
            "Orbital fleet siege using the reviewed science-fiction catalog",
          difficulty: "medium",
          waveStructure:
            "Three overlapping waves including a durable aimed/wave gunner formation",
          bossPatterns: ["aimed", "wave", "rain", "rotatingRing", "burst"],
          scoring:
            "Long combo window, 3x cap, 40-point grazes, and four pickup effects",
          winCondition: "bossDefeated",
          loseCondition: "timeExpired at 30000 ms",
        },
        spec: createOrbitalSiegeSpec(),
      },
      {
        caseId: "retro-meteor-score-rush",
        request:
          "Create an easy retro meteor salvage score rush with staggered waves, reversed opening Boss emitters, and a score-target victory.",
        inputKind: "local-spec",
        resourceProfile: "desktop",
        enableAssetSelection: true,
        browserGate: "case-aware-v1",
        expectedDifferentiators: {
          theme: "Retro meteor salvage race",
          difficulty: "easy",
          waveStructure:
            "Slower opening wave followed by a later high-value dive wave",
          bossPatterns: ["wave+aimed opening", "rain", "rotatingRing", "burst"],
          scoring:
            "4000 ms combo window, 6x cap, 15-point grazes, and higher wave values",
          winCondition: "scoreReached at 500",
          loseCondition: "healthDepleted",
        },
        spec: createRetroMeteorScoreSpec(),
      },
      {
        caseId: "neon-monsoon-survival",
        request:
          "Create a hard neon plasma survival run with denser overlapping waves, faster bullets, short combos, valuable grazes, and a timed survival victory.",
        inputKind: "local-spec",
        resourceProfile: "mobile",
        enableAssetSelection: true,
        browserGate: "case-aware-v1",
        expectedDifferentiators: {
          theme: "Neon plasma monsoon",
          difficulty: "hard",
          waveStructure:
            "Earlier dense overlapping formations under the shared mobile budget",
          bossPatterns: [
            "faster aimed",
            "faster wave",
            "faster rain",
            "faster rotatingRing",
            "faster burst",
          ],
          scoring: "1200 ms combo window, 2.5x cap, and 80-point grazes",
          winCondition: "surviveMs at 10000 ms",
          loseCondition: "timeExpired at 20000 ms",
        },
        spec: createNeonMonsoonSurvivalSpec(),
      },
    ],
  });
}
