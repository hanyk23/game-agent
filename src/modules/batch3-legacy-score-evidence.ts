import { sha256ShooterGameSpec } from "../assets/asset-query-grounding.js";
import { planBossPatternSchedule } from "../gameplay/boss-pattern-scheduler.js";
import { planEnemyPatternSchedule } from "../gameplay/enemy-pattern-scheduler.js";
import { planEnemyWaveSchedule } from "../gameplay/enemy-wave-scheduler.js";
import { planPickupSchedule } from "../gameplay/pickup-planner.js";
import {
  parseShooterGameSpec,
  type ShooterGameSpec,
} from "../requirements/shooter-game-spec.js";
import { BATCH3_SCORING_OUTCOME_DEFINITIONS } from "./batch3-scoring-outcome-library.js";
import type { Batch3ScoreAwardBoundV14 } from "./game-module-authority-resolver-v14.js";
import {
  GameAssemblySpecV13Schema,
  versionSatisfiesRange,
  type GameAssemblySpecV13,
} from "./game-module-contract.js";
import { sha256CanonicalJson } from "./game-module-execution-contract.js";
import {
  ResolvedScoreCapacityBasisV14Schema,
  type ResolvedScoreCapacityBasisV14,
} from "./game-module-resolver-v14.js";
import { z } from "zod";

const SCORE_TRANSACTION_PAYLOAD = "score-transaction-v1";
const SCORE_TRANSACTION_PORT = "transactions";
const SUPPORTED_DIRECT_SCORE_SOURCES = Object.freeze([
  "scoring.combo",
  "scoring.pickup",
  "scoring.graze",
]);

const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);

export const Batch3LegacyScoreEvidenceSchema = z.strictObject({
  sourceSpecSha256: Sha256Schema,
  assemblyEvidenceId: Sha256Schema,
  scoreCapacityBasis: ResolvedScoreCapacityBasisV14Schema,
  scoreAwardBounds: z.array(
    z.strictObject({
      sourceInstanceId: z.string().min(1),
      sourcePortId: z.string().min(1),
      ledgerInstanceId: z.string().min(1),
      ledgerPortId: z.string().min(1),
      maximumAward: z.number().finite().min(0).max(Number.MAX_SAFE_INTEGER),
      evidenceId: Sha256Schema,
    }),
  ),
  evidenceId: Sha256Schema,
});

type ParsedBatch3LegacyScoreEvidence = z.infer<
  typeof Batch3LegacyScoreEvidenceSchema
>;

export type Batch3LegacyScoreEvidence = Readonly<
  Omit<ParsedBatch3LegacyScoreEvidence, "scoreAwardBounds"> & {
    scoreAwardBounds: readonly Readonly<
      ParsedBatch3LegacyScoreEvidence["scoreAwardBounds"][number]
    >[];
  }
>;

type ScoreSourceModule = GameAssemblySpecV13["modules"][number];

function checkedAdd(left: number, right: number, label: string): number {
  const result = left + right;
  if (!Number.isSafeInteger(result) || result < 0)
    throw new Error(`${label} exceeds the safe integer range`);
  return result;
}

function checkedMultiply(left: number, right: number, label: string): number {
  const result = left * right;
  if (!Number.isSafeInteger(result) || result < 0)
    throw new Error(`${label} exceeds the safe integer range`);
  return result;
}

function definitionFor(moduleId: string) {
  const definition = BATCH3_SCORING_OUTCOME_DEFINITIONS.find(
    (candidate) => candidate.manifest.moduleId === moduleId,
  );
  if (definition === undefined)
    throw new Error(`unknown direct score source: ${moduleId}`);
  return definition;
}

function parseSourceConfiguration(module: ScoreSourceModule) {
  const definition = definitionFor(module.moduleId);
  if (!versionSatisfiesRange(definition.manifest.version, module.versionRange))
    throw new Error(
      `direct score source version does not admit the reviewed artifact: ${module.instanceId}`,
    );
  const output = definition.manifest.outputPorts.find(
    (port) =>
      port.id === SCORE_TRANSACTION_PORT &&
      port.payloadType === SCORE_TRANSACTION_PAYLOAD &&
      port.delivery === "event",
  );
  if (output === undefined)
    throw new Error(
      `module is not a direct score source: ${module.instanceId}`,
    );
  return definition.configurationSchema.parse(module.configuration);
}

function maximumDefeatAward(spec: ShooterGameSpec): number {
  return Math.max(
    spec.boss.scoreValue,
    ...spec.enemyWaves.map((wave) => wave.scoreValue),
  );
}

function maximumAwardFor(
  module: ScoreSourceModule,
  configuration: Readonly<Record<string, unknown>>,
  spec: ShooterGameSpec,
  maximumWaveBossDefeats: number,
): number {
  if (module.moduleId === "scoring.combo") {
    if (
      configuration.comboWindowMs !== spec.scoring.comboWindowMs ||
      configuration.multiplierCap !== spec.scoring.comboMultiplierCap
    )
      throw new Error(`combo configuration does not match the source Spec`);
    const multiplier =
      spec.scoring.comboWindowMs === 0
        ? 1
        : Math.min(spec.scoring.comboMultiplierCap, maximumWaveBossDefeats);
    const maximumAward = Math.floor(maximumDefeatAward(spec) * multiplier);
    if (
      !Number.isFinite(maximumAward) ||
      maximumAward < 0 ||
      maximumAward > Number.MAX_SAFE_INTEGER
    )
      throw new Error("combo award exceeds the supported score range");
    return maximumAward;
  }
  if (module.moduleId === "scoring.pickup") {
    return Math.max(
      0,
      ...spec.pickups
        .filter((pickup) => pickup.effect === "scoreBonus")
        .map((pickup) => pickup.value),
    );
  }
  if (module.moduleId === "scoring.graze") {
    if (configuration.award !== spec.scoring.grazePoints)
      throw new Error("graze configuration does not match the source Spec");
    return spec.scoring.grazePoints;
  }
  throw new Error(`unknown direct score source: ${module.moduleId}`);
}

function deriveCapacityBasis(
  spec: ShooterGameSpec,
  sourceSpecSha256: string,
): ResolvedScoreCapacityBasisV14 {
  const waveSchedule = planEnemyWaveSchedule(spec.enemyWaves);
  const maximumWaveEnemies = waveSchedule.reduce(
    (total, wave) =>
      checkedAdd(total, wave.spawnCount, "wave/Boss defeat capacity"),
    0,
  );
  const maximumWaveBossDefeats = checkedAdd(
    maximumWaveEnemies,
    1,
    "wave/Boss defeat capacity",
  );

  let maximumGrazeProjectileGenerations = 0;
  const enemyPatternEvidence = spec.enemyWaves.map((wave) => {
    const schedule = planEnemyPatternSchedule(wave, spec.bulletPatterns);
    const spawnCount = waveSchedule.find(
      (candidate) => candidate.waveId === wave.id,
    )!.spawnCount;
    const projectileCountPerRoot = schedule.reduce((total, pattern) => {
      const bulletCount =
        spec.bulletPatterns[pattern.patternIndex]!.bulletCount;
      return checkedAdd(
        total,
        checkedMultiply(
          pattern.emissionCount,
          bulletCount,
          "enemy projectile generation capacity",
        ),
        "enemy projectile generation capacity",
      );
    }, 0);
    const projectileCount = checkedMultiply(
      spawnCount,
      projectileCountPerRoot,
      "enemy projectile generation capacity",
    );
    maximumGrazeProjectileGenerations = checkedAdd(
      maximumGrazeProjectileGenerations,
      projectileCount,
      "hostile projectile generation capacity",
    );
    return { waveId: wave.id, spawnCount, schedule, projectileCount };
  });
  const bossPatternEvidence = spec.boss.phases.map((phase) => {
    const schedule = planBossPatternSchedule(phase, spec.bulletPatterns);
    const projectileCount = schedule.reduce((total, pattern) => {
      const bulletCount =
        spec.bulletPatterns[pattern.patternIndex]!.bulletCount;
      return checkedAdd(
        total,
        checkedMultiply(
          pattern.emissionCount,
          bulletCount,
          "Boss projectile generation capacity",
        ),
        "Boss projectile generation capacity",
      );
    }, 0);
    maximumGrazeProjectileGenerations = checkedAdd(
      maximumGrazeProjectileGenerations,
      projectileCount,
      "hostile projectile generation capacity",
    );
    return { phaseId: phase.id, schedule, projectileCount };
  });

  const pickupSchedule = planPickupSchedule(spec.pickups);
  const basis = {
    profile: "resolved-score-capacity-basis-v1" as const,
    maximumWaveBossDefeats,
    waveBossEvidenceId: sha256CanonicalJson({
      profile: "legacy-wave-boss-defeat-capacity-v1",
      sourceSpecSha256,
      waveSchedule,
      bossDefeatCount: 1,
      maximumWaveBossDefeats,
    }),
    maximumGrazeProjectileGenerations,
    grazeGenerationEvidenceId: sha256CanonicalJson({
      profile: "legacy-hostile-projectile-generation-capacity-v1",
      sourceSpecSha256,
      enemyPatternEvidence,
      bossPatternEvidence,
      maximumGrazeProjectileGenerations,
    }),
    maximumScheduledPickups: pickupSchedule.length,
    pickupScheduleEvidenceId: sha256CanonicalJson({
      profile: "legacy-pickup-capacity-v1",
      sourceSpecSha256,
      pickupSchedule,
    }),
  };
  return ResolvedScoreCapacityBasisV14Schema.parse(basis);
}

export function deriveBatch3LegacyScoreEvidence(input: {
  spec: ShooterGameSpec;
  sourceSpecSha256: string;
  assembly: GameAssemblySpecV13;
}): Batch3LegacyScoreEvidence {
  const spec = parseShooterGameSpec(input.spec);
  if (!/^[a-f0-9]{64}$/.test(input.sourceSpecSha256))
    throw new Error("source Spec SHA-256 is invalid");
  if (sha256ShooterGameSpec(spec) !== input.sourceSpecSha256)
    throw new Error("source Spec SHA-256 does not match the validated Spec");
  const assembly = GameAssemblySpecV13Schema.parse(input.assembly);
  const assemblyEvidenceId = sha256CanonicalJson(assembly);
  const scoreCapacityBasis = deriveCapacityBasis(spec, input.sourceSpecSha256);

  const ledgers = assembly.modules.filter(
    (module) => module.moduleId === "scoring.ledger",
  );
  if (ledgers.length !== 1)
    throw new Error(
      "legacy score evidence requires exactly one scoring ledger",
    );
  const ledger = ledgers[0]!;
  const ledgerDefinition = definitionFor(ledger.moduleId);
  if (
    !versionSatisfiesRange(
      ledgerDefinition.manifest.version,
      ledger.versionRange,
    )
  )
    throw new Error("ledger version does not admit the reviewed artifact");
  ledgerDefinition.configurationSchema.parse(ledger.configuration);

  const directSources = assembly.modules.filter((module) =>
    SUPPORTED_DIRECT_SCORE_SOURCES.includes(module.moduleId),
  );
  if (directSources.length === 0)
    throw new Error("legacy score evidence requires a direct score source");
  const routes = assembly.bindings.filter(
    (binding) =>
      binding.to.instanceId === ledger.instanceId &&
      binding.to.portId === SCORE_TRANSACTION_PORT,
  );
  if (routes.length !== directSources.length)
    throw new Error(
      "every direct score source must bind exactly once to the ledger",
    );

  const scoreAwardBounds = directSources.map((module) => {
    const configuration = parseSourceConfiguration(module);
    const matching = routes.filter(
      (binding) =>
        binding.from.instanceId === module.instanceId &&
        binding.from.portId === SCORE_TRANSACTION_PORT,
    );
    if (matching.length !== 1)
      throw new Error(
        `direct score source must have one exact ledger route: ${module.instanceId}`,
      );
    const maximumAward = maximumAwardFor(
      module,
      configuration,
      spec,
      scoreCapacityBasis.maximumWaveBossDefeats,
    );
    const route = {
      sourceInstanceId: module.instanceId,
      sourcePortId: SCORE_TRANSACTION_PORT,
      ledgerInstanceId: ledger.instanceId,
      ledgerPortId: SCORE_TRANSACTION_PORT,
      maximumAward,
    };
    return Object.freeze({
      ...route,
      evidenceId: sha256CanonicalJson({
        profile: "legacy-score-award-bound-v1",
        sourceSpecSha256: input.sourceSpecSha256,
        assemblyEvidenceId,
        moduleId: module.moduleId,
        versionRange: module.versionRange,
        configuration,
        route,
      }),
    });
  });
  for (const route of routes)
    if (
      !scoreAwardBounds.some(
        (bound) =>
          bound.sourceInstanceId === route.from.instanceId &&
          bound.sourcePortId === route.from.portId,
      )
    )
      throw new Error(
        `unknown direct score source binding: ${route.from.instanceId}.${route.from.portId}`,
      );

  scoreAwardBounds.sort(
    (left, right) =>
      left.sourceInstanceId.localeCompare(right.sourceInstanceId) ||
      left.sourcePortId.localeCompare(right.sourcePortId),
  );
  const evidenceId = sha256CanonicalJson({
    profile: "batch3-legacy-score-evidence-v1",
    sourceSpecSha256: input.sourceSpecSha256,
    assemblyEvidenceId,
    scoreCapacityBasis,
    scoreAwardBounds,
  });
  return Object.freeze({
    sourceSpecSha256: input.sourceSpecSha256,
    assemblyEvidenceId,
    scoreCapacityBasis,
    scoreAwardBounds: Object.freeze(scoreAwardBounds),
    evidenceId,
  });
}
