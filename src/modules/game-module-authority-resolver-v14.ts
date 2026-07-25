import {
  GameAssemblySpecV13Schema,
  GameModuleManifestV13Schema,
  GameModuleManifestV14Schema,
  versionSatisfiesRange,
  type GameAssemblySpecV13,
  type GameModuleManifestV13,
  type GameModuleManifestV14,
} from "./game-module-contract.js";
import { sha256CanonicalJson } from "./game-module-execution-contract.js";
import {
  ResolvedActorRootChannelV14Schema,
  ResolvedActorRootMutationGrantV14Schema,
  ResolvedActorSetDamageRouteV14Schema,
  ResolvedHostileAttackChannelV14Schema,
  ResolvedHostileContentionGroupV14Schema,
  ResolvedOutcomeAuthorityV14Schema,
  ResolvedScoreCapacityBasisV14Schema,
  ResolvedScoringAuthorityV14Schema,
  type ResolvedScoreCapacityBasisV14,
} from "./game-module-resolver-v14.js";

type AuthorityBlockerV14 = Readonly<{
  instanceId: string;
  code: string;
  evidenceId?: string;
}>;

type ResolvedActorRootGrantV14 = Readonly<{
  rootChannelId: string;
  producerInstanceId: string;
  producerId: string;
  actorRole: "enemy" | "boss";
  capacity: number;
  poolId: string;
  rootChannelOutputPort: string;
  lifecycleOutputPort: string;
  consumerGrants: readonly Readonly<{
    bindingId: string;
    consumerInstanceId: string;
    inputPort: string;
    expectedActorRole: "enemy" | "boss";
    purpose:
      | "pattern-source"
      | "health-bank"
      | "projectile-target"
      | "body-contact"
      | "defeat-scoring"
      | "boss-phase"
      | "outcome";
    maximumEntries: number;
  }>[];
  identityStrategy: "host-minted-lowest-free-slot-v1";
  counterStrategy: "safe-monotonic-v1";
}>;

type ResolvedHostileAttackGrantV14 = Readonly<{
  lineageId: string;
  rootChannelId: string;
  attackChannelId: string;
  sourceInstanceId: string;
  targetingInstanceId: string;
  deliveryInstanceId: string;
  projectileChannelId: string;
  requestPayloadType: "attack-request-v3";
  targetedPayloadType: "targeted-attack-v1";
  emissionPayloadType: "emission-v2";
  requiredAssetRole: "enemy-projectile";
  contentionGroupId: string;
}>;

type ResolvedHostileContentionGrantV14 = Readonly<{
  groupId: string;
  kind: "hostile-contention-v1";
  memberInstanceIds: readonly string[];
  activeEntityCapacity: number;
  activeProjectileCapacity: number;
  spawnsPerSecondCapacity: number;
  ordering: "resolved-provider-order";
}>;

export type Batch3AuthorityPlanV14 = Readonly<{
  actorRootChannels: readonly ResolvedActorRootGrantV14[];
  hostileAttackChannels: readonly ResolvedHostileAttackGrantV14[];
  hostileContentionGroups: readonly ResolvedHostileContentionGrantV14[];
  actorSetDamageRoutes: readonly Readonly<{
    routeId: string;
    rootChannelId: string;
    orderedSinkInstanceIds: readonly string[];
  }>[];
  actorRootMutationGrants: readonly Readonly<{
    grantId: string;
    rootChannelId: string;
    consumerInstanceId: string;
    producerInstanceId: string;
    operation: "deactivate-root";
  }>[];
  scoringAuthority: Readonly<{
    ledgerInstanceId: string;
    duplicateCapacity: number;
    capacityEvidenceId: string;
    awardProfile: "bounded-score-number-v1";
    additionOrder: "stable-router-order-binary64-v1";
    sourceRoutes: readonly Readonly<{
      sourceInstanceId: string;
      sourcePortId: string;
      ledgerPortId: string;
      maximumAward: number;
      evidenceId: string;
    }>[];
  }> | null;
  outcomeAuthority: Readonly<{
    coordinatorInstanceId: string;
    winConditionInstanceId: string;
    lossConditionInstanceId: string;
    winConditionStateInputPort: string;
    lossConditionStateInputPort: string;
    arbitrationPhase: "post-provider-post-event-frame-v1";
    commitServiceId: string;
  }> | null;
}>;

export type Batch3AuthorityReadinessReportV14 = Readonly<{
  graphEvidenceId: string;
  status: "ready" | "blocked";
  blockers: readonly AuthorityBlockerV14[];
}>;

export type Batch3AuthorityResolutionV14 = Readonly<{
  plan: Batch3AuthorityPlanV14;
  readinessReport: Batch3AuthorityReadinessReportV14;
}>;

/**
 * A Graph 1.4 authority plan can retain an older participant verbatim.  Only
 * a parsed Manifest 1.4 may contribute ADR 0028 authority descriptors; a
 * Manifest 1.3 participant remains a normal port/binding participant.
 */
export type Batch3ManifestSelectionV14 = Readonly<{
  instanceId: string;
  manifest: GameModuleManifestV13 | GameModuleManifestV14;
}>;

export type Batch3ScoreAwardBoundV14 = Readonly<{
  sourceInstanceId: string;
  sourcePortId: string;
  ledgerInstanceId: string;
  ledgerPortId: string;
  maximumAward: number;
  evidenceId: string;
}>;

function deepFreeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function configurationRecord(
  assembly: GameAssemblySpecV13,
  instanceId: string,
): Readonly<Record<string, unknown>> | undefined {
  const value = assembly.modules.find(
    (module) => module.instanceId === instanceId,
  )?.configuration;
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : undefined;
}

function addBlocker(
  blockers: AuthorityBlockerV14[],
  instanceId: string,
  code: string,
  evidence?: unknown,
): void {
  blockers.push({
    instanceId,
    code,
    ...(evidence === undefined
      ? {}
      : { evidenceId: sha256CanonicalJson(evidence) }),
  });
}

/**
 * Resolves only accepted ADR 0028 authority data. It performs no loading,
 * factory execution, runtime mutation, or browser instantiation.
 */
export function resolveBatch3AuthorityPlanV14(input: {
  assembly: GameAssemblySpecV13;
  manifests: readonly Batch3ManifestSelectionV14[];
  scoreCapacityBasis?: ResolvedScoreCapacityBasisV14;
  scoreAwardBounds?: readonly Batch3ScoreAwardBoundV14[];
}): Batch3AuthorityResolutionV14 {
  const assembly = GameAssemblySpecV13Schema.parse(input.assembly);
  const blockers: AuthorityBlockerV14[] = [];
  const manifestByInstance = new Map<
    string,
    GameModuleManifestV13 | GameModuleManifestV14
  >();
  for (const selection of input.manifests) {
    if (manifestByInstance.has(selection.instanceId)) {
      addBlocker(
        blockers,
        selection.instanceId,
        "duplicate-manifest-selection",
      );
      continue;
    }
    const request = assembly.modules.find(
      (entry) => entry.instanceId === selection.instanceId,
    );
    if (request === undefined) {
      addBlocker(
        blockers,
        selection.instanceId,
        "manifest-instance-not-selected",
      );
      continue;
    }
    const manifest =
      selection.manifest.schemaVersion === "1.4.0"
        ? GameModuleManifestV14Schema.parse(selection.manifest)
        : GameModuleManifestV13Schema.parse(selection.manifest);
    if (
      request.moduleId !== manifest.moduleId ||
      !versionSatisfiesRange(manifest.version, request.versionRange)
    ) {
      addBlocker(
        blockers,
        selection.instanceId,
        "manifest-selection-identity-mismatch",
        {
          requestedModuleId: request.moduleId,
          requestedVersionRange: request.versionRange,
          manifestModuleId: manifest.moduleId,
          manifestVersion: manifest.version,
        },
      );
      continue;
    }
    manifestByInstance.set(selection.instanceId, manifest);
  }

  const roots: ResolvedActorRootGrantV14[] = [];
  for (const request of assembly.modules) {
    const manifest = manifestByInstance.get(request.instanceId);
    if (manifest === undefined) continue;
    if (manifest.schemaVersion !== "1.4.0") continue;
    const producer = manifest.actorRootProducer;
    if (producer === null) continue;
    const configuration = configurationRecord(assembly, request.instanceId);
    const capacity = configuration?.[producer.capacityConfigurationField];
    if (
      !Number.isSafeInteger(capacity) ||
      (capacity as number) < 1 ||
      (capacity as number) > manifest.resources.activeEntities
    ) {
      addBlocker(blockers, request.instanceId, "invalid-root-capacity", {
        field: producer.capacityConfigurationField,
        capacity: capacity ?? null,
        activeEntities: manifest.resources.activeEntities,
      });
      continue;
    }
    const selectedBindings = assembly.actorRootBindings.filter(
      (binding) => binding.producerInstanceId === request.instanceId,
    );
    const consumerGrants: ResolvedActorRootGrantV14["consumerGrants"][number][] =
      [];
    for (const binding of selectedBindings) {
      const consumerManifest = manifestByInstance.get(
        binding.consumerInstanceId,
      );
      const descriptor =
        consumerManifest?.schemaVersion === "1.4.0"
          ? consumerManifest.actorRootConsumers.find(
              (entry) =>
                entry.rootChannelInputPort === binding.consumerInputPort &&
                entry.expectedActorRole === binding.expectedActorRole &&
                entry.purpose === binding.purpose,
            )
          : undefined;
      if (
        binding.producerOutputPort !== producer.rootChannelOutputPort ||
        descriptor === undefined ||
        descriptor.expectedActorRole !== producer.actorRole ||
        descriptor.expectedActorRole !== binding.expectedActorRole ||
        descriptor.purpose !== binding.purpose ||
        descriptor.maximumEntries < binding.maximumEntries ||
        binding.maximumEntries > (capacity as number)
      ) {
        addBlocker(
          blockers,
          binding.consumerInstanceId,
          "invalid-root-consumer-lineage",
          binding,
        );
        continue;
      }
      consumerGrants.push({
        bindingId: binding.bindingId,
        consumerInstanceId: binding.consumerInstanceId,
        inputPort: binding.consumerInputPort,
        expectedActorRole: binding.expectedActorRole,
        purpose: binding.purpose,
        maximumEntries: binding.maximumEntries,
      });
    }
    roots.push({
      rootChannelId: `root-channel.${request.instanceId}.${producer.producerId}`,
      producerInstanceId: request.instanceId,
      producerId: producer.producerId,
      actorRole: producer.actorRole,
      capacity: capacity as number,
      poolId: producer.poolId,
      rootChannelOutputPort: producer.rootChannelOutputPort,
      lifecycleOutputPort: producer.lifecycleOutputPort,
      consumerGrants,
      identityStrategy: "host-minted-lowest-free-slot-v1",
      counterStrategy: "safe-monotonic-v1",
    });
  }

  for (const binding of assembly.actorRootBindings)
    if (
      !roots.some(
        (root) =>
          root.producerInstanceId === binding.producerInstanceId &&
          root.consumerGrants.some(
            (grant) => grant.bindingId === binding.bindingId,
          ),
      )
    )
      addBlocker(
        blockers,
        binding.producerInstanceId,
        "unresolved-root-binding",
        binding,
      );

  const contentionGroups: ResolvedHostileContentionGrantV14[] =
    assembly.hostileAggregateBudgetGroups.map((group) => ({ ...group }));
  const groupByMember = new Map<string, ResolvedHostileContentionGrantV14>();
  for (const group of contentionGroups)
    for (const member of group.memberInstanceIds)
      groupByMember.set(member, group);

  const hostileChannels: ResolvedHostileAttackGrantV14[] = [];
  for (const request of assembly.modules) {
    const sourceManifest = manifestByInstance.get(request.instanceId);
    const source =
      sourceManifest?.schemaVersion === "1.4.0"
        ? sourceManifest.hostileAttackChannel
        : undefined;
    if (source?.role !== "source") continue;
    const attackChannelId = configurationRecord(assembly, request.instanceId)?.[
      source.configurationField
    ];
    if (typeof attackChannelId !== "string" || attackChannelId.length === 0) {
      addBlocker(blockers, request.instanceId, "invalid-hostile-channel-id");
      continue;
    }
    const root = roots.find((candidate) =>
      candidate.consumerGrants.some(
        (grant) =>
          grant.consumerInstanceId === request.instanceId &&
          grant.inputPort === source.rootChannelInputPort &&
          grant.purpose === "pattern-source",
      ),
    );
    const lifecycleBound =
      root !== undefined &&
      assembly.bindings.some(
        (binding) =>
          binding.from.instanceId === root.producerInstanceId &&
          binding.from.portId === root.lifecycleOutputPort &&
          binding.to.instanceId === request.instanceId &&
          binding.to.portId === source.lifecycleInputPort,
      );
    if (root === undefined || !lifecycleBound) {
      addBlocker(blockers, request.instanceId, "missing-hostile-root-lineage");
      continue;
    }
    const targetBinding = assembly.bindings.find(
      (binding) =>
        binding.from.instanceId === request.instanceId &&
        binding.from.portId === source.requestOutputPort,
    );
    const targetingManifest =
      targetBinding === undefined
        ? undefined
        : manifestByInstance.get(targetBinding.to.instanceId);
    const targeting =
      targetingManifest?.schemaVersion === "1.4.0"
        ? targetingManifest.hostileAttackChannel
        : undefined;
    const targetingChannelId =
      targetBinding === undefined
        ? undefined
        : configurationRecord(assembly, targetBinding.to.instanceId)?.[
            targeting?.role === "targeting" ? targeting.configurationField : ""
          ];
    if (
      targetBinding === undefined ||
      targeting?.role !== "targeting" ||
      targetBinding.to.portId !== targeting.requestInputPort ||
      targetingChannelId !== attackChannelId
    ) {
      addBlocker(blockers, request.instanceId, "missing-hostile-targeting");
      continue;
    }
    const deliveryBinding = assembly.bindings.find(
      (binding) =>
        binding.from.instanceId === targetBinding.to.instanceId &&
        binding.from.portId === targeting.targetedOutputPort,
    );
    const deliveryManifest =
      deliveryBinding === undefined
        ? undefined
        : manifestByInstance.get(deliveryBinding.to.instanceId);
    const delivery =
      deliveryManifest?.schemaVersion === "1.4.0"
        ? deliveryManifest.hostileAttackChannel
        : undefined;
    const deliveryChannelId =
      deliveryBinding === undefined
        ? undefined
        : configurationRecord(assembly, deliveryBinding.to.instanceId)?.[
            delivery?.role === "delivery" ? delivery.configurationField : ""
          ];
    const group =
      deliveryBinding === undefined
        ? undefined
        : groupByMember.get(deliveryBinding.to.instanceId);
    const claim =
      deliveryManifest?.schemaVersion === "1.4.0"
        ? deliveryManifest.aggregateResourceClaims[0]
        : undefined;
    const ownedChannel = deliveryManifest?.ownedEntityChannels?.find(
      (channel) => channel.channelId === claim?.ownedProjectileChannelId,
    );
    if (
      deliveryBinding === undefined ||
      delivery?.role !== "delivery" ||
      deliveryBinding.to.portId !== delivery.targetedInputPort ||
      deliveryChannelId !== attackChannelId ||
      group === undefined ||
      deliveryManifest === undefined ||
      claim === undefined ||
      deliveryManifest.schemaVersion !== "1.4.0" ||
      deliveryManifest.aggregateResourceClaims.length !== 1 ||
      ownedChannel?.entityRole !== "projectile" ||
      deliveryManifest.resources.activeEntities > group.activeEntityCapacity ||
      deliveryManifest.resources.activeProjectiles >
        group.activeProjectileCapacity ||
      deliveryManifest.resources.spawnsPerSecond > group.spawnsPerSecondCapacity
    ) {
      addBlocker(
        blockers,
        request.instanceId,
        "missing-hostile-delivery-or-group",
      );
      continue;
    }
    hostileChannels.push({
      lineageId: `hostile.${root.rootChannelId}.${attackChannelId}`,
      rootChannelId: root.rootChannelId,
      attackChannelId,
      sourceInstanceId: request.instanceId,
      targetingInstanceId: targetBinding.to.instanceId,
      deliveryInstanceId: deliveryBinding.to.instanceId,
      projectileChannelId: claim.ownedProjectileChannelId,
      requestPayloadType: "attack-request-v3",
      targetedPayloadType: "targeted-attack-v1",
      emissionPayloadType: "emission-v2",
      requiredAssetRole: "enemy-projectile",
      contentionGroupId: group.groupId,
    });
  }

  const resolvedDeliveries = new Set(
    hostileChannels.map((channel) => channel.deliveryInstanceId),
  );
  for (const group of contentionGroups)
    for (const member of group.memberInstanceIds)
      if (!resolvedDeliveries.has(member))
        addBlocker(blockers, member, "contention-member-not-hostile-delivery", {
          groupId: group.groupId,
        });

  const rootByBindingId = new Map<
    string,
    Readonly<{
      root: ResolvedActorRootGrantV14;
      grant: ResolvedActorRootGrantV14["consumerGrants"][number];
    }>
  >();
  for (const root of roots)
    for (const grant of root.consumerGrants)
      rootByBindingId.set(grant.bindingId, { root, grant });

  const actorSetDamageRoutes: Batch3AuthorityPlanV14["actorSetDamageRoutes"][number][] =
    [];
  for (const route of assembly.actorSetDamageRoutes) {
    const lineage = rootByBindingId.get(route.rootBindingId);
    const terminalInstanceId = route.orderedSinkInstanceIds.at(-1);
    const terminalManifest =
      terminalInstanceId === undefined
        ? undefined
        : manifestByInstance.get(terminalInstanceId);
    const sink =
      terminalManifest?.schemaVersion === "1.4.0"
        ? terminalManifest.actorSetDamageSink
        : undefined;
    const allSinksKnown = route.orderedSinkInstanceIds.every((instanceId) =>
      manifestByInstance.has(instanceId),
    );
    const exactlyOneTerminal =
      route.orderedSinkInstanceIds.filter((instanceId) => {
        const candidate = manifestByInstance.get(instanceId);
        return (
          candidate?.schemaVersion === "1.4.0" &&
          candidate.actorSetDamageSink !== null
        );
      }).length === 1;
    const adjacentBindingsExist = route.orderedSinkInstanceIds
      .slice(0, -1)
      .every((instanceId, index) =>
        assembly.bindings.some(
          (binding) =>
            binding.from.instanceId === instanceId &&
            binding.to.instanceId === route.orderedSinkInstanceIds[index + 1],
        ),
      );
    if (
      lineage === undefined ||
      lineage.grant.purpose !== "health-bank" ||
      terminalInstanceId !== lineage.grant.consumerInstanceId ||
      sink === undefined ||
      sink === null ||
      sink.rootChannelInputPort !== lineage.grant.inputPort ||
      !allSinksKnown ||
      !exactlyOneTerminal ||
      !adjacentBindingsExist
    ) {
      addBlocker(
        blockers,
        terminalInstanceId ?? route.routeId,
        "invalid-actor-set-route",
        route,
      );
      continue;
    }
    actorSetDamageRoutes.push({
      routeId: route.routeId,
      rootChannelId: lineage.root.rootChannelId,
      orderedSinkInstanceIds: route.orderedSinkInstanceIds,
    });
  }
  for (const [instanceId, manifest] of manifestByInstance)
    if (
      manifest.schemaVersion === "1.4.0" &&
      manifest.actorSetDamageSink !== null &&
      !actorSetDamageRoutes.some(
        (route) => route.orderedSinkInstanceIds.at(-1) === instanceId,
      )
    )
      addBlocker(blockers, instanceId, "orphan-actor-set-health-bank");

  const actorRootMutationGrants: Batch3AuthorityPlanV14["actorRootMutationGrants"][number][] =
    [];
  for (const selection of assembly.actorRootMutationGrantSelections) {
    const lineage = rootByBindingId.get(selection.rootBindingId);
    const consumer = manifestByInstance.get(selection.consumerInstanceId);
    const descriptor =
      consumer?.schemaVersion === "1.4.0"
        ? consumer.actorRootContactConsumer
        : undefined;
    if (
      lineage === undefined ||
      lineage.grant.purpose !== "body-contact" ||
      lineage.grant.consumerInstanceId !== selection.consumerInstanceId ||
      lineage.root.producerInstanceId !== selection.producerInstanceId ||
      descriptor === undefined ||
      descriptor === null ||
      descriptor.rootChannelInputPort !== lineage.grant.inputPort
    ) {
      addBlocker(
        blockers,
        selection.consumerInstanceId,
        "invalid-root-mutation-lineage",
        selection,
      );
      continue;
    }
    actorRootMutationGrants.push({
      grantId: selection.selectionId,
      rootChannelId: lineage.root.rootChannelId,
      consumerInstanceId: selection.consumerInstanceId,
      producerInstanceId: selection.producerInstanceId,
      operation: "deactivate-root",
    });
  }
  for (const [instanceId, manifest] of manifestByInstance)
    if (
      manifest.schemaVersion === "1.4.0" &&
      manifest.actorRootContactConsumer !== null &&
      !actorRootMutationGrants.some(
        (grant) => grant.consumerInstanceId === instanceId,
      )
    )
      addBlocker(blockers, instanceId, "orphan-root-contact-consumer");
  for (const root of roots) {
    if (
      !actorSetDamageRoutes.some(
        (route) => route.rootChannelId === root.rootChannelId,
      )
    )
      addBlocker(
        blockers,
        root.producerInstanceId,
        "root-missing-actor-set-route",
      );
    if (
      !actorRootMutationGrants.some(
        (grant) => grant.rootChannelId === root.rootChannelId,
      )
    )
      addBlocker(
        blockers,
        root.producerInstanceId,
        "root-missing-body-contact-mutation",
      );
  }

  const scoreAwardBounds = input.scoreAwardBounds ?? [];
  const scoreWriters = [...manifestByInstance].filter(([, manifest]) =>
    manifest.outputPorts.some(
      (port) =>
        port.payloadType === "score-state-v1" && port.delivery === "state",
    ),
  );
  const ledgerCandidates = scoreWriters.filter(([, manifest]) =>
    manifest.inputPorts.some(
      (port) =>
        port.payloadType === "score-transaction-v1" &&
        port.delivery === "event",
    ),
  );
  let scoringAuthority: Batch3AuthorityPlanV14["scoringAuthority"] = null;
  if (scoreWriters.length !== 1 || ledgerCandidates.length !== 1) {
    addBlocker(blockers, assembly.assemblyId, "score-ledger-cardinality");
    if (scoreAwardBounds.length !== 0)
      addBlocker(
        blockers,
        assembly.assemblyId,
        "orphan-score-award-bounds",
        scoreAwardBounds,
      );
  } else {
    const [ledgerInstanceId, ledgerManifest] = ledgerCandidates[0]!;
    const ledgerInput = ledgerManifest.inputPorts.find(
      (port) =>
        port.payloadType === "score-transaction-v1" &&
        port.delivery === "event",
    )!;
    const sources = [...manifestByInstance].filter(([, manifest]) =>
      manifest.outputPorts.some(
        (port) =>
          port.payloadType === "score-transaction-v1" &&
          port.delivery === "event",
      ),
    );
    const sourcePorts = sources.flatMap(([sourceInstanceId, manifest]) =>
      manifest.outputPorts
        .filter(
          (port) =>
            port.payloadType === "score-transaction-v1" &&
            port.delivery === "event",
        )
        .map((port) => ({ sourceInstanceId, sourcePortId: port.id })),
    );
    const scoreBindings = sourcePorts.flatMap((source) =>
      assembly.bindings
        .filter(
          (binding) =>
            binding.from.instanceId === source.sourceInstanceId &&
            binding.from.portId === source.sourcePortId &&
            binding.to.instanceId === ledgerInstanceId &&
            binding.to.portId === ledgerInput.id,
        )
        .map(() => ({
          ...source,
          ledgerInstanceId,
          ledgerPortId: ledgerInput.id,
        })),
    );
    const sourcesBoundExactlyOnce =
      scoreBindings.length === sourcePorts.length &&
      sourcePorts.every(
        (source) =>
          scoreBindings.filter(
            (binding) =>
              binding.sourceInstanceId === source.sourceInstanceId &&
              binding.sourcePortId === source.sourcePortId,
          ).length === 1,
      );
    const routeKey = (route: {
      sourceInstanceId: string;
      sourcePortId: string;
      ledgerInstanceId: string;
      ledgerPortId: string;
    }) =>
      `${route.sourceInstanceId}\u0000${route.sourcePortId}\u0000${route.ledgerInstanceId}\u0000${route.ledgerPortId}`;
    const expectedRouteKeys = new Set(scoreBindings.map(routeKey));
    const suppliedRouteKeys = scoreAwardBounds.map(routeKey);
    const validAwardBounds =
      scoreAwardBounds.length === scoreBindings.length &&
      new Set(suppliedRouteKeys).size === suppliedRouteKeys.length &&
      suppliedRouteKeys.every((key) => expectedRouteKeys.has(key)) &&
      scoreAwardBounds.every(
        (bound) =>
          Number.isFinite(bound.maximumAward) &&
          bound.maximumAward >= 0 &&
          bound.maximumAward <= Number.MAX_SAFE_INTEGER &&
          /^[a-f0-9]{64}$/.test(bound.evidenceId),
      );
    const ledgerConfiguration = configurationRecord(assembly, ledgerInstanceId);
    if (
      sources.length === 0 ||
      !sourcesBoundExactlyOnce ||
      !validAwardBounds ||
      ledgerConfiguration?.duplicateCapacity !== undefined ||
      input.scoreCapacityBasis === undefined
    ) {
      addBlocker(
        blockers,
        ledgerInstanceId,
        "invalid-score-ledger-lineage-or-capacity",
      );
    } else {
      const basis = ResolvedScoreCapacityBasisV14Schema.parse(
        input.scoreCapacityBasis,
      );
      const duplicateCapacity =
        basis.maximumWaveBossDefeats +
        basis.maximumGrazeProjectileGenerations +
        basis.maximumScheduledPickups;
      if (
        !Number.isSafeInteger(duplicateCapacity) ||
        duplicateCapacity < 1 ||
        duplicateCapacity > 1_000_000
      )
        addBlocker(
          blockers,
          ledgerInstanceId,
          "score-capacity-overflow",
          basis,
        );
      else
        scoringAuthority = {
          ledgerInstanceId,
          duplicateCapacity,
          capacityEvidenceId: sha256CanonicalJson(basis),
          awardProfile: "bounded-score-number-v1",
          additionOrder: "stable-router-order-binary64-v1",
          sourceRoutes: scoreAwardBounds
            .map((bound) => ({
              sourceInstanceId: bound.sourceInstanceId,
              sourcePortId: bound.sourcePortId,
              ledgerPortId: bound.ledgerPortId,
              maximumAward: bound.maximumAward,
              evidenceId: bound.evidenceId,
            }))
            .sort(
              (left, right) =>
                left.sourceInstanceId.localeCompare(right.sourceInstanceId) ||
                left.sourcePortId.localeCompare(right.sourcePortId) ||
                left.ledgerPortId.localeCompare(right.ledgerPortId),
            ),
        };
    }
  }

  let outcomeAuthority: Batch3AuthorityPlanV14["outcomeAuthority"] = null;
  const selection = assembly.outcomeCoordinatorSelection;
  const commitCandidates = [...manifestByInstance].filter(
    ([, manifest]) =>
      manifest.schemaVersion === "1.4.0" && manifest.outcomeCommit !== null,
  );
  if (selection === null || commitCandidates.length !== 1) {
    addBlocker(
      blockers,
      assembly.assemblyId,
      "outcome-coordinator-cardinality",
    );
  } else {
    const coordinatorManifest = manifestByInstance.get(
      selection.coordinatorInstanceId,
    );
    const commit =
      coordinatorManifest?.schemaVersion === "1.4.0"
        ? coordinatorManifest.outcomeCommit
        : undefined;
    const winManifest = manifestByInstance.get(
      selection.winConditionInstanceId,
    );
    const lossManifest = manifestByInstance.get(
      selection.lossConditionInstanceId,
    );
    const coordinatorInputs =
      coordinatorManifest?.inputPorts.filter(
        (port) =>
          port.payloadType === "outcome-condition-v1" &&
          port.delivery === "state",
      ) ?? [];
    const winOutputs = new Set(
      winManifest?.outputPorts
        .filter(
          (port) =>
            port.payloadType === "outcome-condition-v1" &&
            port.delivery === "state",
        )
        .map((port) => port.id) ?? [],
    );
    const lossOutputs = new Set(
      lossManifest?.outputPorts
        .filter(
          (port) =>
            port.payloadType === "outcome-condition-v1" &&
            port.delivery === "state",
        )
        .map((port) => port.id) ?? [],
    );
    const winBindings =
      commit === undefined || commit === null
        ? []
        : assembly.bindings.filter(
            (binding) =>
              binding.from.instanceId === selection.winConditionInstanceId &&
              winOutputs.has(binding.from.portId),
          );
    const lossBindings =
      commit === undefined || commit === null
        ? []
        : assembly.bindings.filter(
            (binding) =>
              binding.from.instanceId === selection.lossConditionInstanceId &&
              lossOutputs.has(binding.from.portId),
          );
    if (
      commit === undefined ||
      commit === null ||
      commitCandidates[0]![0] !== selection.coordinatorInstanceId ||
      coordinatorInputs.length !== 2 ||
      new Set(coordinatorInputs.map((port) => port.id)).size !== 2 ||
      !coordinatorInputs.some(
        (port) => port.id === commit.winConditionStateInputPort,
      ) ||
      !coordinatorInputs.some(
        (port) => port.id === commit.lossConditionStateInputPort,
      ) ||
      winOutputs.size !== 1 ||
      lossOutputs.size !== 1 ||
      winBindings.length !== 1 ||
      lossBindings.length !== 1 ||
      winBindings[0]?.to.instanceId !== selection.coordinatorInstanceId ||
      winBindings[0]?.to.portId !== commit.winConditionStateInputPort ||
      lossBindings[0]?.to.instanceId !== selection.coordinatorInstanceId ||
      lossBindings[0]?.to.portId !== commit.lossConditionStateInputPort ||
      (winManifest?.schemaVersion === "1.4.0" &&
        winManifest.outcomeCommit !== null) ||
      (lossManifest?.schemaVersion === "1.4.0" &&
        lossManifest.outcomeCommit !== null)
    )
      addBlocker(
        blockers,
        selection.coordinatorInstanceId,
        "invalid-outcome-selection-lineage",
      );
    else
      outcomeAuthority = {
        coordinatorInstanceId: selection.coordinatorInstanceId,
        winConditionInstanceId: selection.winConditionInstanceId,
        lossConditionInstanceId: selection.lossConditionInstanceId,
        winConditionStateInputPort: commit.winConditionStateInputPort,
        lossConditionStateInputPort: commit.lossConditionStateInputPort,
        arbitrationPhase: "post-provider-post-event-frame-v1",
        commitServiceId: commit.commitServiceId,
      };
  }

  const sortedBlockers = blockers
    .slice()
    .sort(
      (left, right) =>
        left.instanceId.localeCompare(right.instanceId) ||
        left.code.localeCompare(right.code) ||
        (left.evidenceId ?? "").localeCompare(right.evidenceId ?? ""),
    );
  const plan: Batch3AuthorityPlanV14 = {
    actorRootChannels: roots.map((root) =>
      ResolvedActorRootChannelV14Schema.parse(root),
    ),
    hostileAttackChannels: hostileChannels.map((channel) =>
      ResolvedHostileAttackChannelV14Schema.parse(channel),
    ),
    hostileContentionGroups: contentionGroups.map((group) =>
      ResolvedHostileContentionGroupV14Schema.parse(group),
    ),
    actorSetDamageRoutes: actorSetDamageRoutes.map((route) =>
      ResolvedActorSetDamageRouteV14Schema.parse(route),
    ),
    actorRootMutationGrants: actorRootMutationGrants.map((grant) =>
      ResolvedActorRootMutationGrantV14Schema.parse(grant),
    ),
    scoringAuthority:
      scoringAuthority === null
        ? null
        : ResolvedScoringAuthorityV14Schema.parse(scoringAuthority),
    outcomeAuthority:
      outcomeAuthority === null
        ? null
        : ResolvedOutcomeAuthorityV14Schema.parse(outcomeAuthority),
  };
  const status = sortedBlockers.length === 0 ? "ready" : "blocked";
  const graphEvidenceId = sha256CanonicalJson({
    authorityVersion: "1.4.0",
    assemblyId: assembly.assemblyId,
    plan,
    blockers: sortedBlockers,
  });
  return deepFreeze({
    plan,
    readinessReport: { graphEvidenceId, status, blockers: sortedBlockers },
  }) as Batch3AuthorityResolutionV14;
}
