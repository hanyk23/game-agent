import { sha256ShooterGameSpec } from "../assets/asset-query-grounding.js";
import { planEnemyWaveSchedule } from "../gameplay/enemy-wave-scheduler.js";
import { planPickupSchedule } from "../gameplay/pickup-planner.js";
import {
  parseShooterGameSpec,
  type ShooterGameSpec,
} from "../requirements/shooter-game-spec.js";
import { deriveBatch3LegacyScoreEvidence } from "./batch3-legacy-score-evidence.js";
import {
  GameAssemblySpecV13Schema,
  type GameAssemblySpecV13,
} from "./game-module-contract.js";
import type {
  AdmittedModuleAssetEvidenceV12,
  ModuleAssetAdmissionEvidenceV12,
} from "./game-module-resolver.js";

export class Batch3LegacyCoverageError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "Batch3LegacyCoverageError";
  }
}

export type Batch3LegacyAssetEvidenceInput = Readonly<{
  byQueryId: Readonly<Record<string, AdmittedModuleAssetEvidenceV12>>;
  approvedSharingEvidenceIds?: readonly string[];
}>;

export type Batch3LegacyAdapterResult = Readonly<{
  sourceSpecSha256: string;
  assembly: GameAssemblySpecV13;
  assetEvidence: ModuleAssetAdmissionEvidenceV12;
  assetQueryEvidence: readonly Readonly<{
    queryId: string;
    category: ShooterGameSpec["assetQueries"][number]["category"];
    artifact: AdmittedModuleAssetEvidenceV12;
  }>[];
  scoreEvidence: ReturnType<typeof deriveBatch3LegacyScoreEvidence>;
}>;

const id = (value: string) => value.replace(/[^a-z0-9]+/g, "-");
const attackChannel = (role: "enemy" | "boss", patternId: string) =>
  `${role}.${id(patternId)}`;
const patternDeliveryModule = (pattern: string) =>
  pattern === "radial"
    ? "delivery.pattern.radial"
    : `delivery.pattern.${pattern === "rotatingRing" ? "rotating-ring" : pattern}`;

function deliveryConfiguration(
  pattern: ShooterGameSpec["bulletPatterns"][number],
  channel: string,
  maximumActive: number,
) {
  const common = {
    attackChannelId: channel,
    count: pattern.bulletCount,
    maximumCountBonus: 0,
    speed: pattern.speed,
    damage: 1,
    textureRole: "enemy-projectile",
    maxActive: Math.max(pattern.bulletCount, maximumActive),
    maximumAcceptedRequestsPerSecond: Math.ceil(1000 / pattern.intervalMs),
    recycleMargin: 30,
    exhaustionPolicy: "drop-and-observe",
  };
  switch (pattern.pattern) {
    case "radial":
      return { ...common, baseAngleOffsetDegrees: 0 };
    case "spiral":
      return {
        ...common,
        rotationStepDegrees: ((pattern.rotationSpeed ?? 0) * 180) / Math.PI,
      };
    case "fan":
      return { ...common, arcDegrees: pattern.arcDegrees ?? 90 };
    case "aimed":
      return { ...common, aimSpreadDegrees: pattern.aimSpreadDegrees ?? 0 };
    case "wave":
      return {
        ...common,
        waveSpreadDegrees: pattern.aimSpreadDegrees ?? 60,
        phaseStepDegrees: 30,
      };
    case "rain":
      return {
        ...common,
        spreadDegrees: pattern.aimSpreadDegrees ?? 50,
        downwardBaseDirection: { x: 0, y: 1 },
      };
    case "rotatingRing":
      return {
        ...common,
        ringRotationStepDegrees:
          ((pattern.rotationSpeed ?? 0.15) * 180) / Math.PI,
      };
    case "burst":
      return {
        ...common,
        burstSpreadDegrees: pattern.aimSpreadDegrees ?? 24,
        emissionIndexMode: "stable-request-sequence",
      };
  }
}

export function adaptShooterGameSpecToBatch3(input: {
  spec: ShooterGameSpec;
  assets: Batch3LegacyAssetEvidenceInput;
}): Batch3LegacyAdapterResult {
  const spec = parseShooterGameSpec(input.spec);
  const sourceSpecSha256 = sha256ShooterGameSpec(spec);
  const assetQueryEvidence = spec.assetQueries.map((query) => {
    const artifact = input.assets.byQueryId[query.id];
    if (artifact === undefined)
      throw new Batch3LegacyCoverageError(
        "missing-admitted-asset-query",
        `missing admitted asset evidence for ${query.id}`,
      );
    return Object.freeze({ queryId: query.id, category: query.category, artifact });
  });
  const query = (queryId: string) => {
    const found = assetQueryEvidence.find((entry) => entry.queryId === queryId);
    if (found === undefined)
      throw new Batch3LegacyCoverageError(
        "unresolved-asset-query-reference",
        `unresolved asset query reference: ${queryId}`,
      );
    return found.artifact;
  };
  if (spec.controls.touch.mode !== "drag" || !spec.controls.touch.relativeMovement)
    throw new Batch3LegacyCoverageError(
      "unsupported-touch-control",
      "Batch 3 legacy adapter currently admits relative drag touch only",
    );
  const enemyAssetIds = new Set(
    spec.enemyWaves.map((wave) => wave.enemyAssetQueryId),
  );
  if (enemyAssetIds.size !== 1)
    throw new Batch3LegacyCoverageError(
      "multiple-wave-enemy-assets",
      "scrolling-waves@1.0 admits one reviewed enemy asset role",
    );
  const enemyAssetId = [...enemyAssetIds][0]!;
  const enemyProjectileQuery = spec.assetQueries.find(
    ({ category }) => category === "enemy-projectile",
  );
  if (enemyProjectileQuery === undefined)
    throw new Batch3LegacyCoverageError(
      "missing-enemy-projectile-query",
      "hostile delivery requires an admitted enemy-projectile query",
    );

  const enemyPatternIds = new Set(spec.enemyWaves.flatMap((wave) => wave.patternIds));
  const bossPatternIds = new Set(spec.boss.phases.flatMap((phase) => phase.patternIds));
  const channels = [
    ...[...enemyPatternIds].map((patternId) => ({ role: "enemy" as const, patternId })),
    ...[...bossPatternIds].map((patternId) => ({ role: "boss" as const, patternId })),
  ];
  if (channels.length > 16)
    throw new Batch3LegacyCoverageError(
      "hostile-channel-coverage-exceeded",
      `legacy hostile channels ${channels.length} exceed the reviewed 16-channel Graze coverage`,
    );
  const patternById = new Map(spec.bulletPatterns.map((pattern) => [pattern.id, pattern]));
  for (const channel of channels)
    if (!patternById.has(channel.patternId))
      throw new Batch3LegacyCoverageError(
        "unknown-pattern-reference",
        `unknown hostile pattern ${channel.patternId}`,
      );

  const modules: any[] = [
    { instanceId: "keyboard", ownerId: "player-one", moduleId: "intent.keyboard-movement", versionRange: "1.0.0", configuration: { bindings: "arrows-and-wasd", normalizeDiagonal: true, emitNeutral: true } },
    { instanceId: "touch", ownerId: "player-one", moduleId: "intent.touch-drag", versionRange: "1.0.0", configuration: { capture: "first-active", release: "matching-pointer-up", emitOnDown: false } },
    { instanceId: "arbiter", ownerId: "player-one", moduleId: "intent.movement-arbiter", versionRange: "1.0.0", configuration: { policy: "touch-while-active-else-keyboard", keyboardSourceId: "keyboard", touchSourceId: "touch" } },
    { instanceId: "focus", ownerId: "player-one", moduleId: "intent.focus", versionRange: "1.0.0", configuration: { device: "keyboard", control: spec.controls.keyboard.focus[0] ?? "ShiftLeft", initialFocused: false } },
    { instanceId: "focus-speed", ownerId: "player-one", moduleId: "locomotion.focus-speed", versionRange: "1.0.0", configuration: { multiplier: 0.5, releaseBehavior: "restore" } },
    { instanceId: "locomotion", ownerId: "player-one", moduleId: "locomotion.bounded", versionRange: "1.1.0", configuration: { moveSpeed: spec.player.moveSpeed, bounds: { left: 24, right: 24, top: 24, bottom: 24 }, absoluteMode: "clamp", neutralMode: "zero-velocity" } },
    { instanceId: "player-health", ownerId: "player-one", moduleId: "combat.health", versionRange: "1.1.0", configuration: { maxHealth: spec.player.maxHealth, initialHealth: spec.player.maxHealth, damageFloor: 0 } },
  ];
  const maximumWeaponPowerBonus = spec.pickups
    .filter((pickup) => pickup.effect === "weaponPower")
    .reduce((total, pickup) => total + pickup.value, 0);
  const bindings: any[] = [
    { from: { instanceId: "keyboard", portId: "command" }, to: { instanceId: "arbiter", portId: "commands" } },
    { from: { instanceId: "touch", portId: "command" }, to: { instanceId: "arbiter", portId: "commands" } },
    { from: { instanceId: "arbiter", portId: "resolved" }, to: { instanceId: "locomotion", portId: "command" } },
    { from: { instanceId: "focus", portId: "focus" }, to: { instanceId: "focus-speed", portId: "focus" } },
    { from: { instanceId: "focus-speed", portId: "scale" }, to: { instanceId: "locomotion", portId: "speed-scale" } },
  ];
  for (const [index, weapon] of spec.weapons.entries()) {
    const suffix = `weapon-${index}`;
    const channel = `player.${id(weapon.id)}`;
    modules.push(
      { instanceId: `${suffix}-target`, ownerId: "player-one", moduleId: "targeting.fixed-forward", versionRange: "1.1.0", configuration: { attackChannelId: channel } },
      { instanceId: `${suffix}-trigger`, ownerId: "player-one", moduleId: "trigger.interval", versionRange: "1.1.0", configuration: { attackChannelId: channel, intervalMs: weapon.fireIntervalMs } },
      { instanceId: `${suffix}-delivery`, ownerId: "player-one", moduleId: "delivery.projectile", versionRange: "1.1.0", configuration: { attackChannelId: channel, projectileCount: weapon.projectileCount, maximumCountBonus: 0, speed: weapon.projectileSpeed, damage: weapon.damage, maximumWeaponPowerBonus, textureRole: "player-projectile", spawnOffsetY: -24, lateralSpacing: 14, maxActive: Math.max(weapon.projectileCount, 16), maximumAcceptedRequestsPerSecond: Math.ceil(1000 / weapon.fireIntervalMs), recycleMargin: 20, exhaustionPolicy: "drop-and-observe" } },
    );
    bindings.push(
      { from: { instanceId: `${suffix}-target`, portId: "selection" }, to: { instanceId: `${suffix}-delivery`, portId: "target" } },
      { from: { instanceId: `${suffix}-trigger`, portId: "request" }, to: { instanceId: `${suffix}-delivery`, portId: "request" } },
    );
  }
  const waveSchedule = planEnemyWaveSchedule(spec.enemyWaves);
  const bossStartMs = Math.max(...spec.enemyWaves.map((wave) => wave.startMs + wave.durationMs));
  modules.push(
    { instanceId: "enemy-waves", ownerId: "enemy-host", moduleId: "encounter.scrolling-waves", versionRange: "1.0.0", configuration: { maximumEnemies: spec.viewport.maxEnemies, maximumSpawnsPerSecond: Math.max(...spec.enemyWaves.map((wave) => Math.ceil(1000 / wave.spawnIntervalMs))), sourceIds: spec.enemyWaves.map((wave) => wave.id), assetRoleBySource: Object.fromEntries(spec.enemyWaves.map((wave) => [wave.id, "enemy"])), spawnY: 0, radius: 16, waves: spec.enemyWaves.map((wave) => ({ sourceId: wave.id, startsAtMs: wave.startMs, endsAtMs: wave.startMs + wave.durationMs, intervalMs: wave.spawnIntervalMs, maxAlive: wave.maxAlive, speed: wave.moveSpeed })) } },
    { instanceId: "boss", ownerId: "boss-host", moduleId: "encounter.boss-phases", versionRange: "1.0.0", configuration: { bossStartMs, handoffId: "legacy-boss-handoff", maximumBosses: 1, sourceIds: ["boss-main"], assetRoleBySource: { "boss-main": "boss" }, spawnXRatio: 0.5, spawnY: 96, radius: 32, horizontalSpeed: Math.max(...spec.boss.phases.map((phase) => phase.moveSpeed)), minimumXRatio: 0.1, maximumXRatio: 0.9, phases: spec.boss.phases.map((phase) => ({ phaseId: phase.id, healthThreshold: phase.healthThreshold, patterns: phase.patternIds.map((patternId) => { const pattern = patternById.get(patternId)!; return { patternSourceId: patternId, attackChannelId: attackChannel("boss", patternId), intervalMs: pattern.intervalMs, durationMs: pattern.durationMs }; }) })) } },
    { instanceId: "enemy-health", ownerId: "enemy-host", moduleId: "combat.health", versionRange: "1.2.0", configuration: { damageRouteId: "enemy.damage", maximumHealthBySourceId: Object.fromEntries(spec.enemyWaves.map((wave) => [wave.id, wave.health])) } },
    { instanceId: "boss-health", ownerId: "boss-host", moduleId: "combat.health", versionRange: "1.2.0", configuration: { damageRouteId: "boss.damage", maximumHealthBySourceId: { "boss-main": spec.boss.maxHealth } } },
  );
  bindings.push(
    { from: { instanceId: "boss", portId: "handoff-request" }, to: { instanceId: "enemy-waves", portId: "handoff-request" } },
    { from: { instanceId: "enemy-waves", portId: "handoff-cleared" }, to: { instanceId: "boss", portId: "handoff-cleared" } },
    { from: { instanceId: "enemy-waves", portId: "roots" }, to: { instanceId: "enemy-health", portId: "roots" } },
    { from: { instanceId: "boss", portId: "roots" }, to: { instanceId: "boss-health", portId: "roots" } },
    { from: { instanceId: "enemy-health", portId: "defeated" }, to: { instanceId: "enemy-waves", portId: "defeated" } },
    { from: { instanceId: "boss-health", portId: "health" }, to: { instanceId: "boss", portId: "health" } },
    { from: { instanceId: "boss-health", portId: "defeated" }, to: { instanceId: "boss", portId: "defeated" } },
  );
  const actorRootBindings: any[] = [
    { bindingId: "enemy.health", producerInstanceId: "enemy-waves", producerOutputPort: "roots", consumerInstanceId: "enemy-health", consumerInputPort: "roots", expectedActorRole: "enemy", purpose: "health-bank", maximumEntries: spec.viewport.maxEnemies },
    { bindingId: "boss.health", producerInstanceId: "boss", producerOutputPort: "roots", consumerInstanceId: "boss-health", consumerInputPort: "roots", expectedActorRole: "boss", purpose: "health-bank", maximumEntries: 1 },
  ];
  const hostileMembers: string[] = [];
  for (const [index, entry] of channels.entries()) {
    const pattern = patternById.get(entry.patternId)!;
    const prefix = `${entry.role}-pattern-${index}`;
    const channel = attackChannel(entry.role, entry.patternId);
    const producer = entry.role === "enemy" ? "enemy-waves" : "boss";
    const allowedSourceIds = entry.role === "enemy" ? spec.enemyWaves.filter((wave) => wave.patternIds.includes(entry.patternId)).map((wave) => wave.id) : ["boss-main"];
    const source = `${prefix}-source`, target = `${prefix}-target`, delivery = `${prefix}-delivery`, graze = `${prefix}-graze`;
    hostileMembers.push(delivery);
    modules.push(
      { instanceId: source, ownerId: `${entry.role}-host`, moduleId: "trigger.encounter-pattern", versionRange: "1.1.0", configuration: { attackChannelId: channel, patternSourceId: entry.patternId, allowedSourceIds, activationMode: entry.role === "enemy" ? "root-lifecycle" : "encounter-events", intervalMs: pattern.intervalMs, durationMs: pattern.durationMs, maximumEmitters: entry.role === "enemy" ? spec.viewport.maxEnemies : 1 } },
      { instanceId: target, ownerId: `${entry.role}-host`, moduleId: pattern.pattern === "aimed" ? "targeting.hostile-aimed" : "targeting.hostile-fixed", versionRange: "1.0.0", configuration: pattern.pattern === "aimed" ? { attackChannelId: channel, playerSnapshotReadId: "hostile.player" } : { attackChannelId: channel, direction: { x: 0, y: 1 } } },
      { instanceId: delivery, ownerId: `${entry.role}-host`, moduleId: patternDeliveryModule(pattern.pattern), versionRange: "1.1.0", configuration: deliveryConfiguration(pattern, channel, spec.viewport.maxEnemyBullets) },
      { instanceId: graze, ownerId: "player-one", moduleId: "combat.graze", versionRange: "1.1.0", configuration: { playerRadius: spec.player.hitboxRadius, bulletRadius: 4, margin: 12, ledgerCeiling: spec.viewport.maxEnemyBullets } },
    );
    bindings.push(
      { from: { instanceId: producer, portId: "roots" }, to: { instanceId: source, portId: "roots" } },
      { from: { instanceId: producer, portId: "lifecycle" }, to: { instanceId: source, portId: "lifecycle" } },
      ...(entry.role === "boss" ? [{ from: { instanceId: "boss", portId: "activations" }, to: { instanceId: source, portId: "activations" } }] : []),
      { from: { instanceId: source, portId: "requests" }, to: { instanceId: target, portId: "requests" } },
      { from: { instanceId: target, portId: "targeted" }, to: { instanceId: delivery, portId: "targeted" } },
      { from: { instanceId: delivery, portId: "projectiles" }, to: { instanceId: graze, portId: "projectiles" } },
    );
    actorRootBindings.push({ bindingId: `${prefix}.source`, producerInstanceId: producer, producerOutputPort: "roots", consumerInstanceId: source, consumerInputPort: "roots", expectedActorRole: entry.role, purpose: "pattern-source", maximumEntries: entry.role === "enemy" ? spec.viewport.maxEnemies : 1 });
  }

  for (const [weaponIndex] of spec.weapons.entries()) {
    for (const target of [
      { id: "enemy", ownerId: "enemy-host", producer: "enemy-waves", role: "enemy", maximumEntries: spec.viewport.maxEnemies, routeId: "enemy.damage" },
      { id: "boss", ownerId: "boss-host", producer: "boss", role: "boss", maximumEntries: 1, routeId: "boss.damage" },
    ] as const) {
      const prefix = `weapon-${weaponIndex}-${target.id}-contact`;
      const detector = `${prefix}-detector`;
      const policy = `${prefix}-damage`;
      const resolution = `${prefix}-resolution`;
      modules.push(
        { instanceId: detector, ownerId: target.ownerId, moduleId: "interaction.projectile-root-contact", versionRange: "1.0.0", configuration: { maximumTrackedContacts: 10_000 } },
        { instanceId: policy, ownerId: target.ownerId, moduleId: "interaction.contact-default-damage", versionRange: "1.1.0", configuration: { projectileRootRouteId: target.routeId, actorRootPlayerRouteId: "player.damage" } },
        { instanceId: resolution, ownerId: target.ownerId, moduleId: "interaction.contact-resolution", versionRange: "1.2.0", configuration: { maximumResolvedContacts: 10_000 } },
      );
      bindings.push(
        { from: { instanceId: `weapon-${weaponIndex}-delivery`, portId: "projectiles" }, to: { instanceId: detector, portId: "projectiles" } },
        { from: { instanceId: target.producer, portId: "roots" }, to: { instanceId: detector, portId: "roots" } },
        { from: { instanceId: detector, portId: "candidates" }, to: { instanceId: policy, portId: "candidates" } },
        { from: { instanceId: policy, portId: "decisions" }, to: { instanceId: resolution, portId: "decisions" } },
      );
      actorRootBindings.push({ bindingId: `${prefix}.root`, producerInstanceId: target.producer, producerOutputPort: "roots", consumerInstanceId: detector, consumerInputPort: "roots", expectedActorRole: target.role, purpose: "projectile-target", maximumEntries: target.maximumEntries });
    }
  }

  const actorRootMutationGrantSelections: any[] = [];
  for (const source of [
    { id: "enemy", ownerId: "player-one", producer: "enemy-waves", role: "enemy", maximumEntries: spec.viewport.maxEnemies },
    { id: "boss", ownerId: "player-one", producer: "boss", role: "boss", maximumEntries: 1 },
  ] as const) {
    const prefix = `${source.id}-body-contact`;
    const detector = `${prefix}-detector`;
    const policy = `${prefix}-damage`;
    const resolution = `${prefix}-resolution`;
    modules.push(
      { instanceId: detector, ownerId: source.ownerId, moduleId: "interaction.actor-root-contact", versionRange: "1.0.0", configuration: { maximumTrackedContacts: 10_000 } },
      { instanceId: policy, ownerId: source.ownerId, moduleId: "interaction.contact-default-damage", versionRange: "1.1.0", configuration: { projectileRootRouteId: `${source.id}.damage`, actorRootPlayerRouteId: "player.damage" } },
      { instanceId: resolution, ownerId: source.ownerId, moduleId: "interaction.contact-resolution", versionRange: "1.2.0", configuration: { maximumResolvedContacts: 10_000 } },
    );
    bindings.push(
      { from: { instanceId: source.producer, portId: "roots" }, to: { instanceId: detector, portId: "roots" } },
      { from: { instanceId: detector, portId: "candidates" }, to: { instanceId: policy, portId: "candidates" } },
      { from: { instanceId: policy, portId: "decisions" }, to: { instanceId: resolution, portId: "decisions" } },
    );
    const rootBindingId = `${prefix}.root`;
    actorRootBindings.push({ bindingId: rootBindingId, producerInstanceId: source.producer, producerOutputPort: "roots", consumerInstanceId: detector, consumerInputPort: "roots", expectedActorRole: source.role, purpose: "body-contact", maximumEntries: source.maximumEntries });
    actorRootMutationGrantSelections.push({ selectionId: `${prefix}.deactivate`, rootBindingId, consumerInstanceId: detector, producerInstanceId: source.producer, operation: "deactivate-root" });
  }
  modules.push(
    { instanceId: "defeat-score", ownerId: "player-one", moduleId: "scoring.defeat", versionRange: "1.0.0", configuration: { scoreBySourceId: { ...Object.fromEntries(spec.enemyWaves.map((wave) => [wave.id, wave.scoreValue])), "boss-main": spec.boss.scoreValue } } },
    { instanceId: "combo-score", ownerId: "player-one", moduleId: "scoring.combo", versionRange: "1.0.0", configuration: { comboWindowMs: spec.scoring.comboWindowMs, multiplierCap: spec.scoring.comboMultiplierCap } },
    { instanceId: "graze-score", ownerId: "player-one", moduleId: "scoring.graze", versionRange: "1.0.0", configuration: { award: spec.scoring.grazePoints } },
    { instanceId: "score-ledger", ownerId: "player-one", moduleId: "scoring.ledger", versionRange: "1.0.0", configuration: {} },
    { instanceId: "win-condition", ownerId: "player-one", moduleId: spec.winCondition.type === "bossDefeated" ? "outcome.boss-defeat" : spec.winCondition.type === "scoreReached" ? "outcome.score-threshold" : "outcome.survival-time", versionRange: "1.0.0", configuration: spec.winCondition.type === "bossDefeated" ? { candidate: "win" } : spec.winCondition.type === "scoreReached" ? { candidate: "win", threshold: spec.winCondition.targetScore } : { candidate: "win", thresholdMs: spec.winCondition.targetMs } },
    { instanceId: "loss-condition", ownerId: "player-one", moduleId: spec.loseCondition.type === "timeExpired" ? "outcome.survival-time" : "outcome.player-health", versionRange: "1.0.0", configuration: spec.loseCondition.type === "timeExpired" ? { candidate: "loss", thresholdMs: spec.loseCondition.limitMs } : { candidate: "loss" } },
    { instanceId: "outcome-coordinator", ownerId: "player-one", moduleId: "outcome.coordinator", versionRange: "1.0.0", configuration: {} },
  );
  bindings.push(
    { from: { instanceId: "enemy-waves", portId: "lifecycle" }, to: { instanceId: "defeat-score", portId: "defeats" } },
    { from: { instanceId: "boss", portId: "lifecycle" }, to: { instanceId: "defeat-score", portId: "defeats" } },
    { from: { instanceId: "defeat-score", portId: "sources" }, to: { instanceId: "combo-score", portId: "sources" } },
    { from: { instanceId: "combo-score", portId: "transactions" }, to: { instanceId: "score-ledger", portId: "transactions" } },
    ...channels.map((_, index) => ({ from: { instanceId: `${channels[index]!.role}-pattern-${index}-graze`, portId: "graze" }, to: { instanceId: "graze-score", portId: "grazes" } })),
    { from: { instanceId: "graze-score", portId: "transactions" }, to: { instanceId: "score-ledger", portId: "transactions" } },
    ...(spec.winCondition.type === "bossDefeated" ? [{ from: { instanceId: "boss", portId: "lifecycle" }, to: { instanceId: "win-condition", portId: "lifecycle" } }] : spec.winCondition.type === "scoreReached" ? [{ from: { instanceId: "score-ledger", portId: "score" }, to: { instanceId: "win-condition", portId: "score" } }] : []),
    ...(spec.loseCondition.type === "healthDepleted" ? [{ from: { instanceId: "player-health", portId: "state" }, to: { instanceId: "loss-condition", portId: "health" } }] : []),
    { from: { instanceId: "win-condition", portId: "condition" }, to: { instanceId: "outcome-coordinator", portId: "win" } },
    { from: { instanceId: "loss-condition", portId: "condition" }, to: { instanceId: "outcome-coordinator", portId: "loss" } },
  );
  if (modules.length > 128)
    throw new Batch3LegacyCoverageError("assembly-module-limit", `derived module count ${modules.length} exceeds Assembly 1.3 limit 128`);

  const assetRoles: any[] = [];
  const assetBindings: any[] = [];
  const bindAsset = (bindingId: string, roleId: string, category: string, artifact: AdmittedModuleAssetEvidenceV12, consumers: string[], sharing: "instance" | "assembly") => {
    assetRoles.push({ roleId, category, requiredByInstanceIds: consumers });
    assetBindings.push({ bindingId, roleId, category, artifact, sharing, consumerInstanceIds: consumers });
  };
  for (const [index, weapon] of spec.weapons.entries()) bindAsset(`player-projectile-${index}`, "player-projectile", "projectile", query(weapon.projectileAssetQueryId), [`weapon-${index}-delivery`], "instance");
  bindAsset("enemy", "enemy", "enemy", query(enemyAssetId), ["enemy-waves"], "instance");
  bindAsset("boss", "boss", "boss", query(spec.boss.assetQueryId), ["boss"], "instance");
  for (const [index, member] of hostileMembers.entries()) bindAsset(`enemy-projectile-${index}`, "enemy-projectile", "projectile", query(enemyProjectileQuery.id), [member], "instance");

  const assembly = GameAssemblySpecV13Schema.parse({
    schemaVersion: "1.3.0", assemblyId: `legacy-${sourceSpecSha256.slice(0, 16)}`, kernelVersion: "1.0.0", engine: { id: "phaser", version: "3.90.0" },
    actors: [{ actorId: "player-one", role: "player" }, { actorId: "enemy-host", role: "enemy" }, { actorId: "boss-host", role: "boss" }, { actorId: "world", role: "world" }],
    modules, bindings, assetRoles, assetBindings,
    globalBudget: { activeEntities: 10_000, activeProjectiles: 10_000, spawnsPerSecond: 10_000, timers: 256 },
    contactPolicySelections: [], damageSinkRoutes: [{ ownerId: "player-one", headInstanceId: "player-health" }], entityMutationGrantSelections: [], effectApplicationBindings: [], pickupEffectPlanSelections: [],
    actorRootBindings,
    hostileAggregateBudgetGroups: [{ groupId: "hostile.shared", kind: "hostile-contention-v1", memberInstanceIds: hostileMembers, activeEntityCapacity: spec.viewport.maxEnemyBullets, activeProjectileCapacity: spec.viewport.maxEnemyBullets, spawnsPerSecondCapacity: Math.min(10_000, Math.max(...channels.map(({ patternId }) => { const pattern = patternById.get(patternId)!; return pattern.bulletCount * Math.ceil(1000 / pattern.intervalMs); }))), ordering: "resolved-provider-order" }],
    actorSetDamageRoutes: [{ routeId: "enemy.damage", rootBindingId: "enemy.health", orderedSinkInstanceIds: ["enemy-health"] }, { routeId: "boss.damage", rootBindingId: "boss.health", orderedSinkInstanceIds: ["boss-health"] }],
    actorRootMutationGrantSelections,
    outcomeCoordinatorSelection: { coordinatorInstanceId: "outcome-coordinator", winConditionInstanceId: "win-condition", lossConditionInstanceId: "loss-condition", arbitrationPhase: "post-provider-post-event-frame-v1" },
  });
  const assetEvidence = Object.freeze({ assets: Object.freeze(assetQueryEvidence.map(({ artifact }) => artifact)), approvedSharingEvidenceIds: Object.freeze(input.assets.approvedSharingEvidenceIds ?? []) });
  const scoreEvidence = deriveBatch3LegacyScoreEvidence({ spec, sourceSpecSha256, assembly });
  void waveSchedule;
  void planPickupSchedule(spec.pickups);
  return Object.freeze({ sourceSpecSha256, assembly, assetEvidence, assetQueryEvidence: Object.freeze(assetQueryEvidence), scoreEvidence });
}
