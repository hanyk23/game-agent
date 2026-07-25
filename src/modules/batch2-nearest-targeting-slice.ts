import {
  GameAssemblySpecV12Schema,
  type GameAssemblySpecV12,
} from "./game-module-contract.js";
import { BATCH1_VERTICAL_SLICE_ASSET_EVIDENCE } from "./batch1-vertical-slice.js";
import { createBatch2CoreProductionRegistry } from "./batch2-core-library.js";
import {
  resolveGameAssemblyV13,
  type ResolvedModuleGraphV13Result,
} from "./game-module-resolver.js";

export const BATCH2_NEAREST_TARGETING_ASSEMBLY: GameAssemblySpecV12 =
  GameAssemblySpecV12Schema.parse({
    schemaVersion: "1.2.0",
    assemblyId: "batch2.nearest-targeting-slice",
    kernelVersion: "1.0.0",
    engine: { id: "phaser", version: "3.90.0" },
    actors: [
      { actorId: "player-one", role: "player" },
      { actorId: "enemy-one", role: "enemy" },
      { actorId: "boss-one", role: "boss" },
    ],
    modules: [
      {
        instanceId: "attack-intent",
        moduleId: "intent.active-attack",
        versionRange: "1.0.0",
        ownerId: "player-one",
        configuration: {
          device: "pointer",
          control: "primary",
          pointerCapture: "matching-pointer",
        },
      },
      {
        instanceId: "targeting",
        moduleId: "targeting.nearest",
        versionRange: "1.0.0",
        ownerId: "player-one",
        configuration: {
          attackChannelId: "player.nearest",
          range: 300,
          allowedRoles: ["enemy", "boss"],
          inactivePolicy: "ignore",
          noTargetFallbackDirection: { x: 0, y: -1 },
        },
      },
      {
        instanceId: "trigger",
        moduleId: "trigger.active",
        versionRange: "1.0.0",
        ownerId: "player-one",
        configuration: {
          attackChannelId: "player.nearest",
          mode: "press",
        },
      },
      {
        instanceId: "delivery",
        moduleId: "delivery.spread",
        versionRange: "1.0.0",
        ownerId: "player-one",
        configuration: {
          attackChannelId: "player.nearest",
          baseCount: 1,
          totalArcDegrees: 0,
          centeredOrdering: true,
          speed: 600,
          baseDamage: 10,
          textureRole: "player-projectile",
          spawnOffset: { x: 0, y: 0 },
          maxActive: 8,
          maximumAcceptedRequestsPerSecond: 8,
          maximumCountBonus: 0,
          maximumDamageMultiplier: 2,
          recycleMargin: 32,
          exhaustionPolicy: "drop-and-observe",
        },
      },
    ],
    bindings: [
      {
        from: { instanceId: "attack-intent", portId: "intent" },
        to: { instanceId: "trigger", portId: "intent" },
      },
      {
        from: { instanceId: "targeting", portId: "selection" },
        to: { instanceId: "delivery", portId: "target" },
      },
      {
        from: { instanceId: "trigger", portId: "request" },
        to: { instanceId: "delivery", portId: "request" },
      },
    ],
    assetRoles: [
      {
        roleId: "player-projectile",
        category: "projectile",
        requiredByInstanceIds: ["delivery"],
      },
    ],
    assetBindings: [
      {
        bindingId: "player-projectile",
        roleId: "player-projectile",
        category: "projectile",
        artifact: {
          assetId: "batch1.player-projectile",
          sourceSha256: "1".repeat(64),
          runtimeSha256: "2".repeat(64),
          provenanceId: "agent.batch1.reviewed",
          licenseRecordId: "project-owner-approved",
        },
        sharing: "instance",
        consumerInstanceIds: ["delivery"],
      },
    ],
    contactPolicySelections: [],
    damageSinkRoutes: [],
    entityMutationGrantSelections: [],
    effectApplicationBindings: [],
    pickupEffectPlanSelections: [],
    globalBudget: {
      activeEntities: 8,
      activeProjectiles: 8,
      spawnsPerSecond: 8,
      timers: 0,
    },
  });

export async function resolveBatch2NearestTargetingSlice(): Promise<ResolvedModuleGraphV13Result> {
  const registry = await createBatch2CoreProductionRegistry();
  return resolveGameAssemblyV13(
    BATCH2_NEAREST_TARGETING_ASSEMBLY,
    registry,
    BATCH1_VERTICAL_SLICE_ASSET_EVIDENCE,
  );
}
