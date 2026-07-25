import {
  GameAssemblySpecV12Schema,
  type GameAssemblySpecV12,
} from "./game-module-contract.js";
import { createBatch2CoreProductionRegistry } from "./batch2-core-library.js";
import { BATCH1_VERTICAL_SLICE_ASSET_EVIDENCE } from "./batch1-vertical-slice.js";
import { BATCH2_VERTICAL_SLICE_ASSEMBLY } from "./batch2-vertical-slice.js";
import {
  resolveGameAssemblyV13,
  type ResolvedModuleGraphV13Result,
} from "./game-module-resolver.js";

export type Batch2FormationCase = Readonly<{
  caseId: string;
  moduleId: string;
  configuration: Readonly<Record<string, unknown>>;
}>;

const commonConfiguration = Object.freeze({
  attackChannelId: "player.primary",
  baseCount: 3,
  speed: 600,
  baseDamage: 10,
  textureRole: "player-projectile",
  spawnOffset: Object.freeze({ x: 0, y: -28 }),
  maxActive: 16,
  maximumAcceptedRequestsPerSecond: 10,
  maximumCountBonus: 1,
  maximumDamageMultiplier: 2,
  recycleMargin: 32,
  exhaustionPolicy: "drop-and-observe",
});

/**
 * The frozen Batch 2 delivery matrix. Each row is sufficient to replace the
 * delivery in the production vertical slice without changing any unrelated
 * authority, binding, asset, or compatibility evidence.
 */
export const BATCH2_FORMATION_CASES: readonly Batch2FormationCase[] =
  Object.freeze([
    Object.freeze({
      caseId: "spread",
      moduleId: "delivery.spread",
      configuration: Object.freeze({
        ...commonConfiguration,
        totalArcDegrees: 20,
        centeredOrdering: true,
      }),
    }),
    Object.freeze({
      caseId: "multi-shot",
      moduleId: "delivery.multi-shot",
      configuration: Object.freeze({
        ...commonConfiguration,
        lateralSpacing: 12,
      }),
    }),
    Object.freeze({
      caseId: "radial",
      moduleId: "delivery.pattern.radial",
      configuration: Object.freeze({
        ...commonConfiguration,
        baseAngleOffsetDegrees: 15,
      }),
    }),
    Object.freeze({
      caseId: "spiral",
      moduleId: "delivery.pattern.spiral",
      configuration: Object.freeze({
        ...commonConfiguration,
        rotationStepDegrees: 20,
      }),
    }),
    Object.freeze({
      caseId: "fan",
      moduleId: "delivery.pattern.fan",
      configuration: Object.freeze({
        ...commonConfiguration,
        arcDegrees: 90,
      }),
    }),
    Object.freeze({
      caseId: "aimed",
      moduleId: "delivery.pattern.aimed",
      configuration: Object.freeze({
        ...commonConfiguration,
        aimSpreadDegrees: 30,
      }),
    }),
    Object.freeze({
      caseId: "wave",
      moduleId: "delivery.pattern.wave",
      configuration: Object.freeze({
        ...commonConfiguration,
        waveSpreadDegrees: 40,
        phaseStepDegrees: 90,
      }),
    }),
    Object.freeze({
      caseId: "rain",
      moduleId: "delivery.pattern.rain",
      configuration: Object.freeze({
        ...commonConfiguration,
        spreadDegrees: 20,
        downwardBaseDirection: Object.freeze({ x: 0, y: 1 }),
      }),
    }),
    Object.freeze({
      caseId: "rotating-ring",
      moduleId: "delivery.pattern.rotating-ring",
      configuration: Object.freeze({
        ...commonConfiguration,
        ringRotationStepDegrees: 12,
      }),
    }),
    Object.freeze({
      caseId: "burst",
      moduleId: "delivery.pattern.burst",
      configuration: Object.freeze({
        ...commonConfiguration,
        burstSpreadDegrees: 15,
        emissionIndexMode: "stable-request-sequence",
      }),
    }),
  ]);

export function createBatch2FormationAssembly(
  formation: Batch2FormationCase,
): GameAssemblySpecV12 {
  const assembly = structuredClone(BATCH2_VERTICAL_SLICE_ASSEMBLY);
  assembly.assemblyId = `batch2.formation-${formation.caseId}`;
  const delivery = assembly.modules.find(
    ({ instanceId }) => instanceId === "delivery",
  );
  if (delivery === undefined)
    throw new Error("Batch 2 vertical slice delivery is missing");
  delivery.moduleId = formation.moduleId;
  delivery.configuration = structuredClone(
    formation.configuration,
  ) as typeof delivery.configuration;
  return GameAssemblySpecV12Schema.parse(assembly);
}

export async function resolveBatch2FormationMatrix(): Promise<
  readonly ResolvedModuleGraphV13Result[]
> {
  const registry = await createBatch2CoreProductionRegistry();
  return Object.freeze(
    BATCH2_FORMATION_CASES.map((formation) =>
      resolveGameAssemblyV13(
        createBatch2FormationAssembly(formation),
        registry,
        BATCH1_VERTICAL_SLICE_ASSET_EVIDENCE,
      ),
    ),
  );
}
