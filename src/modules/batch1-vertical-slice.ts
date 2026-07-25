import { GameAssemblySpecV11Schema } from "./game-module-contract.js";
import { createBatch1ProductionRegistry } from "./batch1-gameplay-library.js";
import {
  resolveGameAssemblyV12,
  type ModuleAssetAdmissionEvidenceV12,
  type ResolvedModuleGraphV12Result,
} from "./game-module-resolver.js";

const sourceSha256 = "1".repeat(64);
const runtimeSha256 = "2".repeat(64);

export const BATCH1_VERTICAL_SLICE_ASSET_EVIDENCE: ModuleAssetAdmissionEvidenceV12 =
  Object.freeze({
    assets: Object.freeze([
      Object.freeze({
        assetId: "batch1.player-projectile",
        sourceSha256,
        runtimeSha256,
        provenanceId: "agent.batch1.reviewed",
        licenseRecordId: "project-owner-approved",
      }),
    ]),
    approvedSharingEvidenceIds: Object.freeze([]),
  });

export const BATCH1_VERTICAL_SLICE_ASSEMBLY = GameAssemblySpecV11Schema.parse({
  schemaVersion: "1.1.0",
  assemblyId: "batch1.vertical-slice",
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
      instanceId: "locomotion",
      moduleId: "locomotion.bounded",
      versionRange: "1.0.0",
      ownerId: "player-one",
      configuration: {
        moveSpeed: 300,
        bounds: { left: 24, right: 24, top: 24, bottom: 24 },
        absoluteMode: "clamp",
        neutralMode: "zero-velocity",
      },
    },
    {
      instanceId: "targeting",
      moduleId: "targeting.fixed-forward",
      versionRange: "1.0.0",
      ownerId: "player-one",
      configuration: { angleDegrees: -90 },
    },
    {
      instanceId: "trigger",
      moduleId: "trigger.interval",
      versionRange: "1.0.0",
      ownerId: "player-one",
      configuration: {
        intervalMs: 100,
        firstEmission: "after-interval",
      },
    },
    {
      instanceId: "delivery",
      moduleId: "delivery.projectile",
      versionRange: "1.0.0",
      ownerId: "player-one",
      configuration: {
        speed: 600,
        damage: 10,
        textureRole: "player-projectile",
        spawnOffset: { x: 0, y: -28 },
        maxActive: 16,
        maximumSpawnRate: 12,
        recycleMargin: 32,
        poolExhaustion: "drop-and-observe",
      },
    },
    {
      instanceId: "health",
      moduleId: "combat.health",
      versionRange: "1.0.0",
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
      versionRange: "1.0.0",
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
      versionRange: "1.0.0",
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
      from: { instanceId: "targeting", portId: "selection" },
      to: { instanceId: "delivery", portId: "target" },
    },
    {
      from: { instanceId: "trigger", portId: "request" },
      to: { instanceId: "delivery", portId: "attack" },
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
  globalBudget: {
    activeEntities: 16,
    activeProjectiles: 16,
    spawnsPerSecond: 12,
    timers: 1,
  },
});

export async function resolveBatch1VerticalSlice(): Promise<ResolvedModuleGraphV12Result> {
  const registry = await createBatch1ProductionRegistry();
  return resolveGameAssemblyV12(
    BATCH1_VERTICAL_SLICE_ASSEMBLY,
    registry,
    BATCH1_VERTICAL_SLICE_ASSET_EVIDENCE,
  );
}
