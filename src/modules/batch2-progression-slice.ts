import { BATCH1_VERTICAL_SLICE_ASSET_EVIDENCE } from "./batch1-vertical-slice.js";
import { createBatch2CoreProductionRegistry } from "./batch2-core-library.js";
import { BATCH2_VERTICAL_SLICE_ASSEMBLY } from "./batch2-vertical-slice.js";
import { GameAssemblySpecV12Schema } from "./game-module-contract.js";
import {
  resolveGameAssemblyV13,
  type ModuleAssetAdmissionEvidenceV12,
  type ResolvedModuleGraphV13Result,
} from "./game-module-resolver.js";

function cloneModule(instanceId: string) {
  const module = BATCH2_VERTICAL_SLICE_ASSEMBLY.modules.find(
    (candidate) => candidate.instanceId === instanceId,
  );
  if (module === undefined)
    throw new Error(`missing slice module: ${instanceId}`);
  return structuredClone(module);
}

function cloneConfiguration(instanceId: string): Record<string, unknown> {
  const configuration = cloneModule(instanceId).configuration;
  if (
    configuration === null ||
    typeof configuration !== "object" ||
    Array.isArray(configuration)
  )
    throw new Error(`invalid slice configuration: ${instanceId}`);
  return structuredClone(configuration) as Record<string, unknown>;
}

const playerAim = {
  ...cloneModule("aim"),
  instanceId: "player-aim",
  ownerId: "player-one",
};
const playerAttackIntent = {
  ...cloneModule("attack-intent"),
  instanceId: "player-attack-intent",
  ownerId: "player-one",
};
const playerTargeting = {
  ...cloneModule("targeting"),
  instanceId: "player-targeting",
  ownerId: "player-one",
  configuration: {
    ...cloneConfiguration("targeting"),
    attackChannelId: "player.primary",
  },
};
const playerTrigger = {
  ...cloneModule("trigger"),
  instanceId: "player-trigger",
  ownerId: "player-one",
  configuration: {
    ...cloneConfiguration("trigger"),
    attackChannelId: "player.primary",
  },
};
const playerDelivery = {
  ...cloneModule("delivery"),
  instanceId: "player-delivery",
  ownerId: "player-one",
  configuration: {
    ...cloneConfiguration("delivery"),
    attackChannelId: "player.primary",
    baseCount: 1,
    totalArcDegrees: 0,
    baseDamage: 12,
    maxActive: 4,
    maximumAcceptedRequestsPerSecond: 2,
    maximumCountBonus: 1,
  },
};
const sourceSha256 = "3".repeat(64);
const runtimeSha256 = "4".repeat(64);
const pickupArtifact = Object.freeze({
  assetId: "batch2.pickup",
  sourceSha256,
  runtimeSha256,
  provenanceId: "agent.batch2.reviewed",
  licenseRecordId: "project-owner-approved",
});

export const BATCH2_PROGRESSION_SLICE_ASSET_EVIDENCE: ModuleAssetAdmissionEvidenceV12 =
  Object.freeze({
    assets: Object.freeze([
      ...BATCH1_VERTICAL_SLICE_ASSET_EVIDENCE.assets,
      pickupArtifact,
    ]),
    approvedSharingEvidenceIds: Object.freeze([]),
  });

export const BATCH2_PROGRESSION_SLICE_ASSEMBLY =
  GameAssemblySpecV12Schema.parse({
    schemaVersion: "1.2.0",
    assemblyId: "batch2.progression-vertical-slice",
    kernelVersion: "1.0.0",
    engine: { id: "phaser", version: "3.90.0" },
    actors: [
      { actorId: "player-one", role: "player" },
      { actorId: "world-one", role: "world" },
    ],
    modules: [
      playerAim,
      playerAttackIntent,
      playerTargeting,
      playerTrigger,
      playerDelivery,
      {
        instanceId: "pickup-spawn",
        moduleId: "progression.pickup-spawn",
        versionRange: "1.0.0",
        ownerId: "world-one",
        configuration: {
          schedule: [
            {
              atMs: 0,
              effectId: "weaponPower",
              value: 1,
              position: { x: 400, y: 160 },
            },
          ],
          fallSpeed: 80,
          textureRole: "pickup",
          maxActive: 2,
          maximumSpawnRate: 2,
          schedulerIntervalMs: 50,
          poolExhaustion: "drop-and-observe",
        },
      },
      {
        instanceId: "pickup-collect",
        moduleId: "progression.pickup-collect",
        versionRange: "1.0.0",
        ownerId: "player-one",
        configuration: {
          sourceEntityRole: "pickup",
          targetActorRole: "player",
          maximumTrackedCollections: 8,
          maximumConcurrentCommits: 2,
          maximumApplicationsPerPickup: 4,
          effectPlanProfileId: "batch2.pickup-effects",
        },
      },
      {
        instanceId: "pickup-modifier",
        moduleId: "progression.modifier",
        versionRange: "1.0.0",
        ownerId: "player-one",
        configuration: {
          maximumApplicationsPerPickup: 4,
          mappings: [
            {
              effectId: "weaponPower",
              applications: [
                {
                  routeId: "pickup-collect.effect-route.delivery-damage",
                  targetInstanceId: "player-delivery",
                  fieldId: "attack.damage.multiplier",
                  operation: "add",
                  valueScale: 1,
                  minimumValue: 1,
                  maximumValue: 1,
                },
              ],
            },
            { effectId: "scoreBonus", applications: [] },
          ],
        },
      },
    ],
    bindings: [
      {
        from: { instanceId: "player-aim", portId: "aim" },
        to: { instanceId: "player-targeting", portId: "aim" },
      },
      {
        from: { instanceId: "player-attack-intent", portId: "intent" },
        to: { instanceId: "player-trigger", portId: "intent" },
      },
      {
        from: { instanceId: "player-targeting", portId: "selection" },
        to: { instanceId: "player-delivery", portId: "target" },
      },
      {
        from: { instanceId: "player-trigger", portId: "request" },
        to: { instanceId: "player-delivery", portId: "request" },
      },
      {
        from: { instanceId: "pickup-spawn", portId: "pickups" },
        to: { instanceId: "pickup-collect", portId: "sources" },
      },
    ],
    assetRoles: [
      {
        roleId: "player-projectile",
        category: "projectile",
        requiredByInstanceIds: ["player-delivery"],
      },
      {
        roleId: "pickup",
        category: "pickup",
        requiredByInstanceIds: ["pickup-spawn"],
      },
    ],
    assetBindings: [
      {
        bindingId: "player-projectile",
        roleId: "player-projectile",
        category: "projectile",
        artifact: BATCH1_VERTICAL_SLICE_ASSET_EVIDENCE.assets[0],
        sharing: "instance",
        consumerInstanceIds: ["player-delivery"],
      },
      {
        bindingId: "pickup",
        roleId: "pickup",
        category: "pickup",
        artifact: pickupArtifact,
        sharing: "instance",
        consumerInstanceIds: ["pickup-spawn"],
      },
    ],
    contactPolicySelections: [],
    damageSinkRoutes: [],
    entityMutationGrantSelections: [
      {
        granteeInstanceId: "pickup-collect",
        accessId: "pickup.consume",
        transferRecipientActorIds: [],
      },
    ],
    effectApplicationBindings: [
      {
        bindingId: "delivery-damage",
        from: {
          instanceId: "pickup-collect",
          applicationRouteSourceId: "applications",
        },
        to: { instanceId: "player-delivery", portId: "modifier" },
        fieldId: "attack.damage.multiplier",
        operation: "add",
      },
    ],
    pickupEffectPlanSelections: [
      {
        commitInstanceId: "pickup-collect",
        transformInstanceId: "pickup-modifier",
        profileId: "batch2.pickup-effects",
      },
    ],
    globalBudget: {
      activeEntities: 6,
      activeProjectiles: 4,
      spawnsPerSecond: 6,
      timers: 1,
    },
  });

export async function resolveBatch2ProgressionSlice(): Promise<ResolvedModuleGraphV13Result> {
  const registry = await createBatch2CoreProductionRegistry();
  return resolveGameAssemblyV13(
    BATCH2_PROGRESSION_SLICE_ASSEMBLY,
    registry,
    BATCH2_PROGRESSION_SLICE_ASSET_EVIDENCE,
  );
}
