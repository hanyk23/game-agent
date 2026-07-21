import { createHash } from "node:crypto";

import { z } from "zod";

import { BATCH1_MODULE_DEFINITIONS } from "./batch1-gameplay-library.js";
import {
  GameModuleManifestV14Schema,
  type GameModuleManifestV14,
} from "./game-module-contract.js";
import {
  createModuleArtifactHashDescriptor,
  type CanonicalConfigurationDescriptor,
  type CanonicalResourceReservationDescriptorV11,
} from "./game-module-execution-contract.js";
import { TrustedGameModuleExecutableLoader } from "./game-module-executable-loader.js";
import {
  evaluateCanonicalResourceReservationV11,
  GameModuleRegistry,
} from "./game-module-registry.js";

const logicalId = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/);
const nonNegativeScore = z
  .number()
  .finite()
  .min(0)
  .max(Number.MAX_SAFE_INTEGER);
const authorization = Object.freeze({
  ownerRelation: "same-owner" as const,
  sourceActorRoles: Object.freeze([
    "player" as const,
    "enemy" as const,
    "boss" as const,
  ]),
  targetActorRoles: Object.freeze([
    "player" as const,
    "enemy" as const,
    "boss" as const,
  ]),
  sourceEntityRoles: Object.freeze([]),
});
const hostileLifecycleToPlayerAuthorization = Object.freeze({
  ownerRelation: "different-owner" as const,
  sourceActorRoles: Object.freeze(["enemy" as const, "boss" as const]),
  targetActorRoles: Object.freeze(["player" as const]),
  sourceEntityRoles: Object.freeze([]),
});

function baseManifest(kind: string) {
  return BATCH1_MODULE_DEFINITIONS.find(
    (entry) => entry.manifest.kind === kind,
  )!.manifest;
}
function manifest(
  kind: string,
  overrides: Readonly<Record<string, unknown>>,
): GameModuleManifestV14 {
  return GameModuleManifestV14Schema.parse(
    JSON.parse(
      JSON.stringify({
        ...structuredClone(baseManifest("player-intent")),
        schemaVersion: "1.4.0",
        provides: [],
        requires: [],
        inputPorts: [],
        outputPorts: [],
        dependencies: [],
        assetRequirements: [],
        conflicts: [],
        exclusiveOwnership: [],
        actorSnapshotReads: [],
        entityChannelReads: [],
        projectileChannelConsumer: null,
        attackChannel: null,
        projectileDelivery: undefined,
        preparedEffectCommit: null,
        modifierTargets: [],
        pickupEffectPlanTransform: null,
        actorRootProducer: null,
        actorRootConsumers: [],
        hostileAttackChannel: null,
        aggregateResourceClaims: [],
        actorSetDamageSink: null,
        actorRootContactConsumer: null,
        outcomeCommit: null,
        kind,
        ...overrides,
      }),
    ) as unknown,
  );
}
const noResources = Object.freeze({
  activeEntities: 0,
  activeProjectiles: 0,
  spawnsPerSecond: 0,
  timers: 0,
});
const zeroReservation: CanonicalResourceReservationDescriptorV11 = {
  descriptorVersion: "1.0.0",
  reservationId: "batch3.scoring-outcome.zero",
  strategy: "constant",
  fields: [],
};

const defeatConfiguration = z.strictObject({
  scoreBySourceId: z.record(logicalId, nonNegativeScore),
});
const comboConfiguration = z.strictObject({
  comboWindowMs: z.number().int().min(0).max(3_600_000),
  multiplierCap: z.number().finite().min(1).max(1_000),
});
const pickupConfiguration = z.strictObject({});
const grazeConfiguration = z.strictObject({
  award: nonNegativeScore.positive(),
});
const ledgerConfiguration = z.strictObject({});
const playerHealthConfiguration = z.strictObject({
  candidate: z.literal("loss"),
});
const bossDefeatConfiguration = z.strictObject({ candidate: z.literal("win") });
const scoreThresholdConfiguration = z.strictObject({
  candidate: z.enum(["win", "loss"]),
  threshold: nonNegativeScore.positive(),
});
const survivalTimeConfiguration = z.strictObject({
  candidate: z.enum(["win", "loss"]),
  thresholdMs: z.number().int().min(0).max(3_600_000),
});
const coordinatorConfiguration = z.strictObject({});

const input = (
  id: string,
  payloadType: string,
  delivery: "event" | "state",
) => ({
  id,
  payloadType,
  required: true,
  multiple: delivery === "event",
  delivery,
  authorization,
});
const state = (id: string, payloadType: string) => ({
  id,
  payloadType,
  delivery: "state" as const,
});
const event = (id: string, payloadType: string) => ({
  id,
  payloadType,
  delivery: "event" as const,
});
const scoreRuntime = (update: unknown = null) => ({
  update,
  timerSlots: { slotGroupId: "main" },
  inputRegistrations: [],
  observationReaders: [],
  contactCommit: null,
});

const defeatManifest = manifest("scoring", {
  moduleId: "scoring.defeat",
  version: "1.0.0",
  implementationId: "scoring.defeat.v1",
  configurationSchemaId: "scoring.defeat.config",
  inputPorts: [
    {
      ...input("defeats", "actor-root-lifecycle-v1", "event"),
      authorization: hostileLifecycleToPlayerAuthorization,
    },
  ],
  outputPorts: [event("sources", "score-source-v1")],
  resources: noResources,
  runtimeLeases: { startLeases: 1, instanceLeases: 1, graphLeases: 0 },
  runtimeContract: scoreRuntime(),
  browserSupport: { desktop: true, touch: true },
  evidence: {
    provenanceId: "agent.batch3.reviewed",
    testSuiteId: "modules.batch3.scoring-outcome",
  },
});
const comboManifest = manifest("scoring", {
  moduleId: "scoring.combo",
  version: "1.0.0",
  implementationId: "scoring.combo.v1",
  configurationSchemaId: "scoring.combo.config",
  inputPorts: [input("sources", "score-source-v1", "event")],
  outputPorts: [event("transactions", "score-transaction-v1")],
  resources: noResources,
  runtimeLeases: { startLeases: 1, instanceLeases: 1, graphLeases: 0 },
  runtimeContract: scoreRuntime(),
  browserSupport: { desktop: true, touch: true },
  evidence: {
    provenanceId: "agent.batch3.reviewed",
    testSuiteId: "modules.batch3.scoring-outcome",
  },
});
const pickupManifest = manifest("scoring", {
  moduleId: "scoring.pickup",
  version: "1.0.0",
  implementationId: "scoring.pickup.v1",
  configurationSchemaId: "scoring.pickup.config",
  inputPorts: [input("pickups", "pickup-collected-v1", "event")],
  outputPorts: [event("transactions", "score-transaction-v1")],
  resources: noResources,
  runtimeLeases: { startLeases: 1, instanceLeases: 1, graphLeases: 0 },
  runtimeContract: scoreRuntime(),
  browserSupport: { desktop: true, touch: true },
  evidence: {
    provenanceId: "agent.batch3.reviewed",
    testSuiteId: "modules.batch3.scoring-outcome",
  },
});
const grazeManifest = manifest("scoring", {
  moduleId: "scoring.graze",
  version: "1.0.0",
  implementationId: "scoring.graze.v1",
  configurationSchemaId: "scoring.graze.config",
  inputPorts: [input("grazes", "graze-v1", "event")],
  outputPorts: [event("transactions", "score-transaction-v1")],
  resources: noResources,
  runtimeLeases: { startLeases: 1, instanceLeases: 1, graphLeases: 0 },
  runtimeContract: scoreRuntime(),
  browserSupport: { desktop: true, touch: true },
  evidence: {
    provenanceId: "agent.batch3.reviewed",
    testSuiteId: "modules.batch3.scoring-outcome",
  },
});
const ledgerManifest = manifest("scoring", {
  moduleId: "scoring.ledger",
  version: "1.0.0",
  implementationId: "scoring.ledger.v1",
  configurationSchemaId: "scoring.ledger.config",
  inputPorts: [input("transactions", "score-transaction-v1", "event")],
  outputPorts: [state("score", "score-state-v1")],
  resources: noResources,
  runtimeLeases: { startLeases: 2, instanceLeases: 1, graphLeases: 0 },
  runtimeContract: scoreRuntime(),
  browserSupport: { desktop: true, touch: true },
  evidence: {
    provenanceId: "agent.batch3.reviewed",
    testSuiteId: "modules.batch3.scoring-outcome",
  },
});

function conditionManifest(
  moduleId: string,
  implementationId: string,
  configurationSchemaId: string,
  inputs: readonly unknown[],
  update: unknown = null,
) {
  return manifest("outcome", {
    moduleId,
    version: "1.0.0",
    implementationId,
    configurationSchemaId,
    inputPorts: inputs,
    outputPorts: [state("condition", "outcome-condition-v1")],
    resources: noResources,
    runtimeLeases: { startLeases: 2, instanceLeases: 1, graphLeases: 0 },
    runtimeContract: scoreRuntime(update),
    browserSupport: { desktop: true, touch: true },
    evidence: {
      provenanceId: "agent.batch3.reviewed",
      testSuiteId: "modules.batch3.scoring-outcome",
    },
  });
}
const playerHealthManifest = conditionManifest(
  "outcome.player-health",
  "outcome.player-health.v1",
  "outcome.player-health.config",
  [input("health", "health-state-v2", "state")],
);
const bossDefeatManifest = conditionManifest(
  "outcome.boss-defeat",
  "outcome.boss-defeat.v1",
  "outcome.boss-defeat.config",
  [
    {
      ...input("lifecycle", "actor-root-lifecycle-v1", "event"),
      authorization: hostileLifecycleToPlayerAuthorization,
    },
  ],
);
const scoreThresholdManifest = conditionManifest(
  "outcome.score-threshold",
  "outcome.score-threshold.v1",
  "outcome.score-threshold.config",
  [input("score", "score-state-v1", "state")],
);
const survivalTimeManifest = conditionManifest(
  "outcome.survival-time",
  "outcome.survival-time.v1",
  "outcome.survival-time.config",
  [],
  { mode: "graph-frame-v1", registrationId: "outcome.survival-time.update" },
);
const coordinatorManifest = manifest("outcome", {
  moduleId: "outcome.coordinator",
  version: "1.0.0",
  implementationId: "outcome.coordinator.v1",
  configurationSchemaId: "outcome.coordinator.config",
  inputPorts: [
    input("win", "outcome-condition-v1", "state"),
    input("loss", "outcome-condition-v1", "state"),
  ],
  outputPorts: [],
  resources: noResources,
  runtimeLeases: { startLeases: 2, instanceLeases: 2, graphLeases: 0 },
  runtimeContract: scoreRuntime(),
  browserSupport: { desktop: true, touch: true },
  outcomeCommit: {
    commitServiceId: "outcome.commit",
    arbitrationPhase: "post-provider-post-event-frame-v1",
    winConditionStateInputPort: "win",
    lossConditionStateInputPort: "loss",
    coordinatorIdentity: "resolved-instance",
  },
  evidence: {
    provenanceId: "agent.batch3.reviewed",
    testSuiteId: "modules.batch3.scoring-outcome",
  },
});

const defeatFactory = `export function create(context){const c=context.configuration;let n=0;context.ports.declareHandler("defeats",v=>{if(v.reason!=="health-depleted")return;const baseAward=c.scoreBySourceId[v.sourceId];if(baseAward===undefined)throw new Error("defeat source is not admitted for scoring");context.ports.emitEvent("sources",Object.freeze({sequence:n++,emittedAtMs:context.clock.nowMs(),sourceEvidenceId:"defeat:"+v.rootChannelId+":"+v.actorId+":"+v.actorGeneration,kind:"defeat",baseAward}));});return Object.freeze({instanceId:context.identity.instanceId});}`;
const comboFactory = `export function create(context){const c=context.configuration;let n=0,last=null,count=0;context.ports.declareHandler("sources",v=>{if(v.kind!=="defeat")throw new Error("combo only accepts defeat");const now=context.clock.nowMs();const chained=c.comboWindowMs>0&&last!==null&&now-last<=c.comboWindowMs;count=chained?count+1:1;last=now;const award=Math.floor(v.baseAward*Math.min(c.multiplierCap,count));context.ports.emitEvent("transactions",Object.freeze({sequence:n++,emittedAtMs:now,sourceEvidenceId:v.sourceEvidenceId,kind:"defeat",award}));});return Object.freeze({instanceId:context.identity.instanceId,stop(){last=null;count=0;}});}`;
const pickupFactory = `export function create(context){let n=0;context.ports.declareHandler("pickups",v=>{if(v.effectId!=="scoreBonus")return;context.ports.emitEvent("transactions",Object.freeze({sequence:n++,emittedAtMs:context.clock.nowMs(),sourceEvidenceId:"pickup:"+v.commitEvidenceId+":"+v.eventOrdinal,kind:"pickup",award:v.value}));});return Object.freeze({instanceId:context.identity.instanceId});}`;
const grazeFactory = `export function create(context){const c=context.configuration;let n=0;context.ports.declareHandler("grazes",v=>context.ports.emitEvent("transactions",Object.freeze({sequence:n++,emittedAtMs:context.clock.nowMs(),sourceEvidenceId:"graze:"+v.channelId+":"+v.entityId+":"+v.generation+":"+v.playerActorId,kind:"graze",award:c.award})));return Object.freeze({instanceId:context.identity.instanceId});}`;
const ledgerFactory = `export function create(context){return Object.freeze({instanceId:context.identity.instanceId});}`;
const playerHealthFactory = `export function create(context){let n=0;const publish=v=>context.ports.publishState("condition",Object.freeze({candidate:"loss",met:v.current<=0,reason:"player-health",observedAtMs:context.clock.nowMs(),evidenceId:"player-health:"+v.revision}));context.ports.declareHandler("health",publish);return Object.freeze({instanceId:context.identity.instanceId});}`;
const bossDefeatFactory = `export function create(context){let n=0;context.ports.declareHandler("lifecycle",v=>{if(v.actorRole!=="boss"||v.reason!=="health-depleted")return;context.ports.publishState("condition",Object.freeze({candidate:"win",met:true,reason:"boss-defeat",observedAtMs:context.clock.nowMs(),evidenceId:"boss-defeat:"+v.actorId+":"+v.actorGeneration}));});return Object.freeze({instanceId:context.identity.instanceId});}`;
const scoreThresholdFactory = `export function create(context){const c=context.configuration;context.ports.declareHandler("score",v=>context.ports.publishState("condition",Object.freeze({candidate:c.candidate,met:v.total>=c.threshold,reason:"score-threshold",observedAtMs:context.clock.nowMs(),evidenceId:"score-threshold:"+v.revision})));return Object.freeze({instanceId:context.identity.instanceId});}`;
const survivalTimeFactory = `export function create(context){const c=context.configuration;let n=0;return Object.freeze({instanceId:context.identity.instanceId,update(){const now=context.clock.nowMs();context.ports.publishState("condition",Object.freeze({candidate:c.candidate,met:now>=c.thresholdMs,reason:"survival-time",observedAtMs:now,evidenceId:"survival-time:"+n++}));}});}`;
const coordinatorFactory = `export function create(context){return Object.freeze({instanceId:context.identity.instanceId,arbitrateOutcomeFrameTail(view){const selected=view.win&&view.win.met?view.win:view.loss&&view.loss.met?view.loss:null;if(selected)context.services.outcomeCommit.commit("outcome.commit",Object.freeze({outcome:selected.candidate,reason:selected.reason,conditionEvidenceId:selected.evidenceId}));}});}`;

type Definition = Readonly<{
  manifest: GameModuleManifestV14;
  configurationSchema: z.ZodType<Record<string, unknown>>;
  configurationDescriptor: CanonicalConfigurationDescriptor;
  reservationDescriptor: CanonicalResourceReservationDescriptorV11;
  reservationEvaluator(configuration: unknown): unknown;
  implementationSource: string;
  exportName: "create";
  exportKind: "lifecycle-create-v1";
}>;
function definition(
  manifestValue: GameModuleManifestV14,
  configurationSchema: z.ZodType<Record<string, unknown>>,
  implementationSource: string,
): Definition {
  const configurationDescriptor: CanonicalConfigurationDescriptor = {
    descriptorVersion: "1.0.0",
    schemaId: manifestValue.configurationSchemaId,
    dialect: "json-schema-2020-12-subset",
    schema: Object.freeze({ type: "object", additionalProperties: false }),
  };
  return Object.freeze({
    manifest: manifestValue,
    configurationSchema,
    configurationDescriptor,
    reservationDescriptor: zeroReservation,
    reservationEvaluator(configuration) {
      return evaluateCanonicalResourceReservationV11(
        zeroReservation,
        configurationSchema.parse(configuration),
      );
    },
    implementationSource,
    exportName: "create",
    exportKind: "lifecycle-create-v1",
  });
}

export const BATCH3_SCORING_OUTCOME_DEFINITIONS = Object.freeze([
  definition(
    defeatManifest,
    defeatConfiguration as z.ZodType<Record<string, unknown>>,
    defeatFactory,
  ),
  definition(
    comboManifest,
    comboConfiguration as z.ZodType<Record<string, unknown>>,
    comboFactory,
  ),
  definition(
    pickupManifest,
    pickupConfiguration as z.ZodType<Record<string, unknown>>,
    pickupFactory,
  ),
  definition(
    grazeManifest,
    grazeConfiguration as z.ZodType<Record<string, unknown>>,
    grazeFactory,
  ),
  definition(
    ledgerManifest,
    ledgerConfiguration as z.ZodType<Record<string, unknown>>,
    ledgerFactory,
  ),
  definition(
    playerHealthManifest,
    playerHealthConfiguration as z.ZodType<Record<string, unknown>>,
    playerHealthFactory,
  ),
  definition(
    bossDefeatManifest,
    bossDefeatConfiguration as z.ZodType<Record<string, unknown>>,
    bossDefeatFactory,
  ),
  definition(
    scoreThresholdManifest,
    scoreThresholdConfiguration as z.ZodType<Record<string, unknown>>,
    scoreThresholdFactory,
  ),
  definition(
    survivalTimeManifest,
    survivalTimeConfiguration as z.ZodType<Record<string, unknown>>,
    survivalTimeFactory,
  ),
  definition(
    coordinatorManifest,
    coordinatorConfiguration as z.ZodType<Record<string, unknown>>,
    coordinatorFactory,
  ),
]);
const lockIdentity = new TextEncoder().encode(
  "pnpm-lock.batch3.scoring-outcome.v1",
);
const toolchainIdentity = new TextEncoder().encode(
  "typescript-5.9.3.esm-self-contained.batch3.scoring-outcome.v1",
);
export async function registerBatch3ScoringOutcomeDefinitions(
  registry: GameModuleRegistry,
): Promise<void> {
  const loader = new TrustedGameModuleExecutableLoader();
  for (const item of BATCH3_SCORING_OUTCOME_DEFINITIONS) {
    const implementationBundle = new TextEncoder().encode(
      item.implementationSource,
    );
    const artifact = createModuleArtifactHashDescriptor({
      manifest: item.manifest,
      configurationDescriptor: item.configurationDescriptor,
      reservationDescriptor: item.reservationDescriptor,
      implementationBundle,
      dependencyLockIdentity: lockIdentity,
      toolchainIdentity,
    });
    const handle = await loader.admit({
      generatedOutput: implementationBundle,
      expectedOutputSha256: createHash("sha256")
        .update(implementationBundle)
        .digest("hex"),
      implementationId: item.manifest.implementationId,
      exportName: item.exportName,
      exportKind: item.exportKind,
      sourceBundleSha256: artifact.implementationBundleSha256,
      manifestSha256: artifact.manifestSha256,
      dependencyLockSha256: artifact.dependencyLockSha256,
      toolchainIdentitySha256: artifact.toolchainIdentitySha256,
    });
    registry.registerProductionV14({
      manifest: item.manifest,
      configurationDescriptor: item.configurationDescriptor,
      configurationSchema: item.configurationSchema,
      reservationDescriptor: item.reservationDescriptor,
      reservationEvaluator: item.reservationEvaluator,
      implementationBundle,
      dependencyLockIdentity: lockIdentity,
      toolchainIdentity,
      expectedArtifact: artifact,
      executableHandle: handle,
    });
  }
}
export async function createBatch3ScoringOutcomeRegistry(): Promise<GameModuleRegistry> {
  const registry = new GameModuleRegistry();
  await registerBatch3ScoringOutcomeDefinitions(registry);
  return registry;
}
