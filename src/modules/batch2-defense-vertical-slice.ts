import { GameAssemblySpecV12Schema } from "./game-module-contract.js";
import { BATCH1_VERTICAL_SLICE_ASSET_EVIDENCE } from "./batch1-vertical-slice.js";
import { createBatch2CoreProductionRegistry } from "./batch2-core-library.js";
import {
  resolveGameAssemblyV13,
  type ResolvedModuleGraphV13Result,
} from "./game-module-resolver.js";

const sourceSha256 = "1".repeat(64);
const runtimeSha256 = "2".repeat(64);

export const BATCH2_DEFENSE_VERTICAL_SLICE_ASSEMBLY =
  GameAssemblySpecV12Schema.parse({
    schemaVersion: "1.2.0",
    assemblyId: "batch2.defense-vertical-slice",
    kernelVersion: "1.0.0",
    engine: { id: "phaser", version: "3.90.0" },
    actors: [
      { actorId: "attacker-one", role: "player" },
      { actorId: "defender-one", role: "enemy" },
    ],
    modules: [
      {
        instanceId: "aim",
        moduleId: "intent.directional-aim",
        versionRange: "1.0.0",
        ownerId: "attacker-one",
        configuration: {
          source: "pointer-world",
          deadZone: 0,
          normalization: "unit",
          pointerCapture: "latest-active",
        },
      },
      {
        instanceId: "attack-intent",
        moduleId: "intent.active-attack",
        versionRange: "1.0.0",
        ownerId: "attacker-one",
        configuration: {
          device: "pointer",
          control: "primary",
          pointerCapture: "matching-pointer",
        },
      },
      {
        instanceId: "targeting",
        moduleId: "targeting.directional",
        versionRange: "1.0.0",
        ownerId: "attacker-one",
        configuration: {
          attackChannelId: "attacker.primary",
          pointFallbackDirection: { x: 0, y: -1 },
          zeroVectorPolicy: "retain-last",
        },
      },
      {
        instanceId: "trigger",
        moduleId: "trigger.active",
        versionRange: "1.0.0",
        ownerId: "attacker-one",
        configuration: { attackChannelId: "attacker.primary", mode: "press" },
      },
      {
        instanceId: "delivery",
        moduleId: "delivery.spread",
        versionRange: "1.0.0",
        ownerId: "attacker-one",
        configuration: {
          attackChannelId: "attacker.primary",
          baseCount: 1,
          totalArcDegrees: 0,
          centeredOrdering: true,
          speed: 500,
          baseDamage: 30,
          textureRole: "player-projectile",
          spawnOffset: { x: 0, y: -20 },
          maxActive: 8,
          maximumAcceptedRequestsPerSecond: 4,
          maximumCountBonus: 0,
          maximumDamageMultiplier: 1,
          recycleMargin: 32,
          exhaustionPolicy: "drop-and-observe",
        },
      },
      {
        instanceId: "detector",
        moduleId: "interaction.projectile-contact",
        versionRange: "1.1.0",
        ownerId: "defender-one",
        configuration: {
          sourceEntityRole: "projectile",
          targetActorRole: "enemy",
          maximumTrackedContacts: 32,
        },
      },
      {
        instanceId: "default-policy",
        moduleId: "interaction.contact-default-damage",
        versionRange: "1.0.0",
        ownerId: "defender-one",
        configuration: {
          damageKind: "projectile",
          defaultDisposition: "damage",
          defaultSourceOperation: "consume",
        },
      },
      {
        instanceId: "resolver",
        moduleId: "interaction.contact-resolution",
        versionRange: "1.1.0",
        ownerId: "defender-one",
        configuration: {
          policyProfileId: "batch1.default-damage",
          policyProfileVersion: "1.0.0",
          allowedDispositions: ["damage"],
          allowedSourceOperations: ["consume"],
          maxResolvedContacts: 32,
        },
      },
      {
        instanceId: "invulnerability",
        moduleId: "combat.invulnerability-window",
        versionRange: "1.0.0",
        ownerId: "defender-one",
        configuration: {
          durationMs: 125,
          acceptedDamageKinds: ["projectile"],
        },
      },
      {
        instanceId: "shield",
        moduleId: "combat.shield",
        versionRange: "1.0.0",
        ownerId: "defender-one",
        configuration: {
          maximumStrength: 25,
          initialStrength: 25,
          acceptedDamageKinds: ["projectile"],
          overflowPolicy: "pass-remainder",
        },
      },
      {
        instanceId: "health",
        moduleId: "combat.health",
        versionRange: "1.1.0",
        ownerId: "defender-one",
        configuration: { maxHealth: 100, initialHealth: 100, damageFloor: 0 },
      },
    ],
    bindings: [
      {
        from: { instanceId: "aim", portId: "aim" },
        to: { instanceId: "targeting", portId: "aim" },
      },
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
      {
        from: { instanceId: "delivery", portId: "projectiles" },
        to: { instanceId: "detector", portId: "sources" },
      },
      {
        from: { instanceId: "delivery", portId: "projectiles" },
        to: { instanceId: "resolver", portId: "sources" },
      },
      {
        from: { instanceId: "detector", portId: "candidate" },
        to: { instanceId: "resolver", portId: "candidate" },
      },
      {
        from: { instanceId: "resolver", portId: "damage" },
        to: { instanceId: "invulnerability", portId: "damage" },
      },
      {
        from: { instanceId: "invulnerability", portId: "downstream" },
        to: { instanceId: "shield", portId: "damage" },
      },
      {
        from: { instanceId: "shield", portId: "downstream" },
        to: { instanceId: "health", portId: "damage" },
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
          sourceSha256,
          runtimeSha256,
          provenanceId: "agent.batch1.reviewed",
          licenseRecordId: "project-owner-approved",
        },
        sharing: "instance",
        consumerInstanceIds: ["delivery"],
      },
    ],
    contactPolicySelections: [
      {
        consumerInstanceId: "resolver",
        profileId: "batch1.default-damage",
        version: "1.0.0",
      },
    ],
    damageSinkRoutes: [
      { ownerId: "defender-one", headInstanceId: "invulnerability" },
    ],
    entityMutationGrantSelections: [
      {
        granteeInstanceId: "resolver",
        accessId: "projectile.consume",
        transferRecipientActorIds: [],
      },
    ],
    effectApplicationBindings: [],
    pickupEffectPlanSelections: [],
    globalBudget: {
      activeEntities: 8,
      activeProjectiles: 8,
      spawnsPerSecond: 4,
      timers: 0,
    },
  });

export async function resolveBatch2DefenseVerticalSlice(
  durationMs = 125,
): Promise<ResolvedModuleGraphV13Result> {
  const assembly = structuredClone(BATCH2_DEFENSE_VERTICAL_SLICE_ASSEMBLY);
  const invulnerability = assembly.modules.find(
    (module) => module.instanceId === "invulnerability",
  );
  if (
    invulnerability === undefined ||
    !Number.isSafeInteger(durationMs) ||
    durationMs < 0 ||
    durationMs > 10_000
  )
    throw new Error("invalid defense conformance duration");
  invulnerability.configuration = {
    ...(invulnerability.configuration as Record<string, unknown>),
    durationMs,
  };
  const registry = await createBatch2CoreProductionRegistry();
  return resolveGameAssemblyV13(
    assembly,
    registry,
    BATCH1_VERTICAL_SLICE_ASSET_EVIDENCE,
  );
}
