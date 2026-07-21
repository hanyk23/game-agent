import { GameAssemblySpecV12Schema } from "./game-module-contract.js";
import { BATCH1_VERTICAL_SLICE_ASSET_EVIDENCE } from "./batch1-vertical-slice.js";
import { createBatch2CoreProductionRegistry } from "./batch2-core-library.js";
import {
  resolveGameAssemblyV13,
  type ResolvedModuleGraphV13Result,
} from "./game-module-resolver.js";

const sourceSha256 = "1".repeat(64);
const runtimeSha256 = "2".repeat(64);

export const BATCH2_VERTICAL_SLICE_ASSEMBLY = GameAssemblySpecV12Schema.parse({
  schemaVersion: "1.2.0",
  assemblyId: "batch2.core-vertical-slice",
  kernelVersion: "1.0.0",
  engine: { id: "phaser", version: "3.90.0" },
  actors: [
    { actorId: "player-one", role: "player" },
    { actorId: "enemy-one", role: "enemy" },
  ],
  modules: [
    {
      instanceId: "keyboard",
      moduleId: "intent.keyboard-movement",
      versionRange: "1.0.0",
      ownerId: "player-one",
      configuration: {
        bindings: "arrows-and-wasd",
        normalizeDiagonal: true,
        emitNeutral: true,
      },
    },
    {
      instanceId: "touch",
      moduleId: "intent.touch-drag",
      versionRange: "1.0.0",
      ownerId: "player-one",
      configuration: {
        capture: "first-active",
        release: "matching-pointer-up",
        emitOnDown: false,
      },
    },
    {
      instanceId: "arbiter",
      moduleId: "intent.movement-arbiter",
      versionRange: "1.0.0",
      ownerId: "player-one",
      configuration: {
        policy: "touch-while-active-else-keyboard",
        keyboardSourceId: "keyboard",
        touchSourceId: "touch",
      },
    },
    {
      instanceId: "focus",
      moduleId: "intent.focus",
      versionRange: "1.0.0",
      ownerId: "player-one",
      configuration: {
        device: "keyboard",
        control: "ShiftLeft",
        initialFocused: false,
      },
    },
    {
      instanceId: "focus-speed",
      moduleId: "locomotion.focus-speed",
      versionRange: "1.0.0",
      ownerId: "player-one",
      configuration: { multiplier: 0.5, releaseBehavior: "restore" },
    },
    {
      instanceId: "locomotion",
      moduleId: "locomotion.bounded",
      versionRange: "1.1.0",
      ownerId: "player-one",
      configuration: {
        moveSpeed: 300,
        bounds: { left: 24, right: 24, top: 24, bottom: 24 },
        absoluteMode: "clamp",
        neutralMode: "zero-velocity",
      },
    },
    {
      instanceId: "aim",
      moduleId: "intent.directional-aim",
      versionRange: "1.0.0",
      ownerId: "player-one",
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
      ownerId: "player-one",
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
      ownerId: "player-one",
      configuration: {
        attackChannelId: "player.primary",
        pointFallbackDirection: { x: 0, y: -1 },
        zeroVectorPolicy: "retain-last",
      },
    },
    {
      instanceId: "trigger",
      moduleId: "trigger.active",
      versionRange: "1.0.0",
      ownerId: "player-one",
      configuration: { attackChannelId: "player.primary", mode: "press" },
    },
    {
      instanceId: "delivery",
      moduleId: "delivery.spread",
      versionRange: "1.0.0",
      ownerId: "player-one",
      configuration: {
        attackChannelId: "player.primary",
        baseCount: 3,
        totalArcDegrees: 20,
        centeredOrdering: true,
        speed: 600,
        baseDamage: 10,
        textureRole: "player-projectile",
        spawnOffset: { x: 0, y: -28 },
        maxActive: 16,
        maximumAcceptedRequestsPerSecond: 10,
        maximumCountBonus: 1,
        maximumDamageMultiplier: 2,
        recycleMargin: 32,
        exhaustionPolicy: "drop-and-observe",
      },
    },
    {
      instanceId: "health",
      moduleId: "combat.health",
      versionRange: "1.1.0",
      ownerId: "enemy-one",
      configuration: {
        maxHealth: 100,
        initialHealth: 100,
        damageFloor: 0,
      },
    },
    {
      instanceId: "detector",
      moduleId: "interaction.projectile-contact",
      versionRange: "1.1.0",
      ownerId: "enemy-one",
      configuration: {
        sourceEntityRole: "projectile",
        targetActorRole: "enemy",
        maximumTrackedContacts: 64,
      },
    },
    {
      instanceId: "default-policy",
      moduleId: "interaction.contact-default-damage",
      versionRange: "1.0.0",
      ownerId: "enemy-one",
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
      ownerId: "enemy-one",
      configuration: {
        policyProfileId: "batch1.default-damage",
        policyProfileVersion: "1.0.0",
        allowedDispositions: ["damage"],
        allowedSourceOperations: ["consume"],
        maxResolvedContacts: 64,
      },
    },
  ],
  bindings: [
    {
      from: { instanceId: "keyboard", portId: "command" },
      to: { instanceId: "arbiter", portId: "commands" },
    },
    {
      from: { instanceId: "touch", portId: "command" },
      to: { instanceId: "arbiter", portId: "commands" },
    },
    {
      from: { instanceId: "arbiter", portId: "resolved" },
      to: { instanceId: "locomotion", portId: "command" },
    },
    {
      from: { instanceId: "focus", portId: "focus" },
      to: { instanceId: "focus-speed", portId: "focus" },
    },
    {
      from: { instanceId: "focus-speed", portId: "scale" },
      to: { instanceId: "locomotion", portId: "speed-scale" },
    },
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
  damageSinkRoutes: [{ ownerId: "enemy-one", headInstanceId: "health" }],
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
    activeEntities: 16,
    activeProjectiles: 16,
    spawnsPerSecond: 40,
    timers: 0,
  },
});

export async function resolveBatch2VerticalSlice(): Promise<ResolvedModuleGraphV13Result> {
  const registry = await createBatch2CoreProductionRegistry();
  return resolveGameAssemblyV13(
    BATCH2_VERTICAL_SLICE_ASSEMBLY,
    registry,
    BATCH1_VERTICAL_SLICE_ASSET_EVIDENCE,
  );
}
