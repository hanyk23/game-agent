import { z } from "zod";

import { ResolvedModuleGraphV13Schema } from "./game-module-resolver.js";

const GraphV14ModuleSchema =
  ResolvedModuleGraphV13Schema.shape.modules.element.extend({
    manifestSchemaVersion: z.enum(["1.2.0", "1.3.0", "1.4.0"]),
    factoryContextVersion: z.enum(["1.2.0", "1.3.0", "1.4.0"]),
  });

const ActorRootConsumerGrantV14Schema = z.strictObject({
  bindingId: z.string().min(1),
  consumerInstanceId: z.string().min(1),
  inputPort: z.string().min(1),
  expectedActorRole: z.enum(["enemy", "boss"]),
  purpose: z.enum([
    "pattern-source",
    "health-bank",
    "projectile-target",
    "body-contact",
    "defeat-scoring",
    "boss-phase",
    "outcome",
  ]),
  maximumEntries: z.number().int().min(1).max(10_000),
});

export const ResolvedActorRootChannelV14Schema = z.strictObject({
  rootChannelId: z.string().min(1),
  producerInstanceId: z.string().min(1),
  producerId: z.string().min(1),
  actorRole: z.enum(["enemy", "boss"]),
  capacity: z.number().int().min(1).max(10_000),
  poolId: z.string().min(1),
  rootChannelOutputPort: z.string().min(1),
  lifecycleOutputPort: z.string().min(1),
  consumerGrants: z.array(ActorRootConsumerGrantV14Schema).max(256),
  identityStrategy: z.literal("host-minted-lowest-free-slot-v1"),
  counterStrategy: z.literal("safe-monotonic-v1"),
});

export const ResolvedHostileAttackChannelV14Schema = z.strictObject({
  lineageId: z.string().min(1),
  rootChannelId: z.string().min(1),
  attackChannelId: z.string().min(1),
  sourceInstanceId: z.string().min(1),
  targetingInstanceId: z.string().min(1),
  deliveryInstanceId: z.string().min(1),
  projectileChannelId: z.string().min(1),
  requestPayloadType: z.literal("attack-request-v3"),
  targetedPayloadType: z.literal("targeted-attack-v1"),
  emissionPayloadType: z.literal("emission-v2"),
  requiredAssetRole: z.literal("enemy-projectile"),
  contentionGroupId: z.string().min(1),
});

export const ResolvedHostileContentionGroupV14Schema = z.strictObject({
  groupId: z.string().min(1),
  kind: z.literal("hostile-contention-v1"),
  memberInstanceIds: z.array(z.string().min(1)).min(1).max(128),
  activeEntityCapacity: z.number().int().min(1).max(10_000),
  activeProjectileCapacity: z.number().int().min(1).max(10_000),
  spawnsPerSecondCapacity: z.number().int().min(1).max(10_000),
  ordering: z.literal("resolved-provider-order"),
});

export const ResolvedActorSetDamageRouteV14Schema = z.strictObject({
  routeId: z.string().min(1),
  rootChannelId: z.string().min(1),
  orderedSinkInstanceIds: z.array(z.string().min(1)).min(1).max(32),
  defeatLifecycle: z
    .strictObject({
      defeatedOutputPort: z.string().min(1),
      producerInstanceId: z.string().min(1),
      defeatedInputPort: z.string().min(1),
    })
    .nullable(),
});

export const ResolvedActorRootMutationGrantV14Schema = z.strictObject({
  grantId: z.string().min(1),
  rootChannelId: z.string().min(1),
  consumerInstanceId: z.string().min(1),
  producerInstanceId: z.string().min(1),
  operation: z.literal("deactivate-root"),
});

export const ResolvedContactRouteV14Schema = z.strictObject({
  routeId: z.string().min(1),
  kind: z.enum(["projectile-root", "actor-root-player"]),
  detectorInstanceId: z.string().min(1),
  policyInstanceId: z.string().min(1),
  resolutionInstanceId: z.string().min(1),
  sourceChannelProviderInstanceId: z.string().min(1).nullable(),
  rootChannelId: z.string().min(1),
  sourceMutationGrantId: z.string().min(1).nullable(),
  targetDamageRouteId: z.string().min(1),
  targetSinkInstanceId: z.string().min(1),
  sourceOperation: z.enum(["consume", "deactivate-root"]),
});

export const ResolvedScoreCapacityBasisV14Schema = z.strictObject({
  profile: z.literal("resolved-score-capacity-basis-v1"),
  maximumWaveBossDefeats: z.number().int().min(0).max(1_000_000),
  waveBossEvidenceId: z.string().regex(/^[a-f0-9]{64}$/),
  maximumGrazeProjectileGenerations: z.number().int().min(0).max(1_000_000),
  grazeGenerationEvidenceId: z.string().regex(/^[a-f0-9]{64}$/),
  maximumScheduledPickups: z.number().int().min(0).max(1_000_000),
  pickupScheduleEvidenceId: z.string().regex(/^[a-f0-9]{64}$/),
});

export const ResolvedScoreSourceRouteV14Schema = z.strictObject({
  sourceInstanceId: z.string().min(1),
  sourcePortId: z.string().min(1),
  ledgerPortId: z.string().min(1),
  maximumAward: z.number().finite().min(0).max(Number.MAX_SAFE_INTEGER),
  evidenceId: z.string().regex(/^[a-f0-9]{64}$/),
});

function compareScoreSourceRoutes(
  left: z.infer<typeof ResolvedScoreSourceRouteV14Schema>,
  right: z.infer<typeof ResolvedScoreSourceRouteV14Schema>,
): number {
  return (
    left.sourceInstanceId.localeCompare(right.sourceInstanceId) ||
    left.sourcePortId.localeCompare(right.sourcePortId) ||
    left.ledgerPortId.localeCompare(right.ledgerPortId)
  );
}

export const ResolvedScoringAuthorityV14Schema = z
  .strictObject({
    ledgerInstanceId: z.string().min(1),
    duplicateCapacity: z.number().int().min(1).max(1_000_000),
    capacityEvidenceId: z.string().regex(/^[a-f0-9]{64}$/),
    awardProfile: z.literal("bounded-score-number-v1"),
    additionOrder: z.literal("stable-router-order-binary64-v1"),
    sourceRoutes: z.array(ResolvedScoreSourceRouteV14Schema).min(1).max(1_000),
  })
  .superRefine((authority, context) => {
    const identities = authority.sourceRoutes.map(
      (route) =>
        `${route.sourceInstanceId}\u0000${route.sourcePortId}\u0000${route.ledgerPortId}`,
    );
    if (new Set(identities).size !== identities.length)
      context.addIssue({
        code: "custom",
        message: "score source routes must have unique exact identities",
        path: ["sourceRoutes"],
      });
    for (let index = 1; index < authority.sourceRoutes.length; index += 1)
      if (
        compareScoreSourceRoutes(
          authority.sourceRoutes[index - 1]!,
          authority.sourceRoutes[index]!,
        ) >= 0
      ) {
        context.addIssue({
          code: "custom",
          message: "score source routes must use stable identity order",
          path: ["sourceRoutes", index],
        });
        break;
      }
  });

export const ResolvedOutcomeAuthorityV14Schema = z.strictObject({
  coordinatorInstanceId: z.string().min(1),
  winConditionInstanceId: z.string().min(1),
  lossConditionInstanceId: z.string().min(1),
  winConditionStateInputPort: z.string().min(1),
  lossConditionStateInputPort: z.string().min(1),
  arbitrationPhase: z.literal("post-provider-post-event-frame-v1"),
  commitServiceId: z.string().min(1),
});

/** Strict serialized boundary for the accepted ADR 0028 Graph 1.4 artifact. */
export const ResolvedModuleGraphV14Schema = z
  .strictObject({
    ...ResolvedModuleGraphV13Schema.shape,
    graphVersion: z.literal("1.4.0"),
    modules: z.array(GraphV14ModuleSchema),
    actorRootChannels: z.array(ResolvedActorRootChannelV14Schema).max(64),
    hostileAttackChannels: z
      .array(ResolvedHostileAttackChannelV14Schema)
      .max(128),
    hostileContentionGroups: z
      .array(ResolvedHostileContentionGroupV14Schema)
      .max(32),
    actorSetDamageRoutes: z
      .array(ResolvedActorSetDamageRouteV14Schema)
      .max(128),
    actorRootMutationGrants: z
      .array(ResolvedActorRootMutationGrantV14Schema)
      .max(128),
    contactRoutes: z.array(ResolvedContactRouteV14Schema).max(256),
    scoringAuthority: ResolvedScoringAuthorityV14Schema.nullable(),
    outcomeAuthority: ResolvedOutcomeAuthorityV14Schema.nullable(),
  })
  .superRefine((graph, context) => {
    const moduleById = new Map(
      graph.modules.map((module) => [module.instanceId, module] as const),
    );
    const reportDuplicates = (
      values: readonly string[],
      path: string,
    ): void => {
      if (new Set(values).size !== values.length)
        context.addIssue({
          code: "custom",
          message: `${path} must contain unique identities`,
          path: [path],
        });
    };
    reportDuplicates(
      graph.actorRootChannels.map((entry) => entry.rootChannelId),
      "actorRootChannels",
    );
    reportDuplicates(
      graph.hostileAttackChannels.map((entry) => entry.lineageId),
      "hostileAttackChannels",
    );
    reportDuplicates(
      graph.hostileContentionGroups.map((entry) => entry.groupId),
      "hostileContentionGroups",
    );
    reportDuplicates(
      graph.contactRoutes.map((entry) => entry.routeId),
      "contactRoutes",
    );

    const rootById = new Map(
      graph.actorRootChannels.map(
        (root) => [root.rootChannelId, root] as const,
      ),
    );
    for (const [index, root] of graph.actorRootChannels.entries()) {
      const producer = moduleById.get(root.producerInstanceId);
      if (
        producer?.manifestSchemaVersion !== "1.4.0" ||
        producer.factoryContextVersion !== "1.4.0" ||
        root.consumerGrants.some(
          (grant) =>
            !moduleById.has(grant.consumerInstanceId) ||
            grant.expectedActorRole !== root.actorRole ||
            grant.maximumEntries > root.capacity,
        )
      )
        context.addIssue({
          code: "custom",
          message: "actor-root lineage, role, or capacity is invalid",
          path: ["actorRootChannels", index],
        });
    }

    const groupById = new Map(
      graph.hostileContentionGroups.map(
        (group) => [group.groupId, group] as const,
      ),
    );
    const globalMembership = new Set<string>();
    for (const [index, group] of graph.hostileContentionGroups.entries()) {
      const members = new Set(group.memberInstanceIds);
      if (
        members.size !== group.memberInstanceIds.length ||
        [...members].some(
          (id) => !moduleById.has(id) || globalMembership.has(id),
        )
      )
        context.addIssue({
          code: "custom",
          message: "hostile contention membership is not unique and complete",
          path: ["hostileContentionGroups", index],
        });
      for (const member of members) globalMembership.add(member);
    }

    for (const [index, channel] of graph.hostileAttackChannels.entries()) {
      const group = groupById.get(channel.contentionGroupId);
      const root = rootById.get(channel.rootChannelId);
      const source = moduleById.get(channel.sourceInstanceId);
      const targeting = moduleById.get(channel.targetingInstanceId);
      const delivery = moduleById.get(channel.deliveryInstanceId);
      if (
        root === undefined ||
        group === undefined ||
        source?.manifestSchemaVersion !== "1.4.0" ||
        targeting?.manifestSchemaVersion !== "1.4.0" ||
        delivery?.manifestSchemaVersion !== "1.4.0" ||
        source.factoryContextVersion !== "1.4.0" ||
        targeting.factoryContextVersion !== "1.4.0" ||
        delivery.factoryContextVersion !== "1.4.0" ||
        new Set([
          channel.sourceInstanceId,
          channel.targetingInstanceId,
          channel.deliveryInstanceId,
        ]).size !== 3 ||
        !group.memberInstanceIds.includes(channel.deliveryInstanceId) ||
        delivery.resources.activeEntities > group.activeEntityCapacity ||
        delivery.resources.activeProjectiles > group.activeProjectileCapacity ||
        delivery.resources.spawnsPerSecond > group.spawnsPerSecondCapacity
      )
        context.addIssue({
          code: "custom",
          message: "hostile V3 triple or contention lineage is invalid",
          path: ["hostileAttackChannels", index],
        });
    }

    const referencedDeliveries = new Set(
      graph.hostileAttackChannels.map((channel) => channel.deliveryInstanceId),
    );
    if (
      [...globalMembership].some((member) => !referencedDeliveries.has(member))
    )
      context.addIssue({
        code: "custom",
        message: "contention group contains a non-hostile delivery member",
        path: ["hostileContentionGroups"],
      });

    const routeRoots = new Set<string>();
    for (const [index, route] of graph.actorSetDamageRoutes.entries()) {
      if (
        !rootById.has(route.rootChannelId) ||
        routeRoots.has(route.rootChannelId) ||
        new Set(route.orderedSinkInstanceIds).size !==
          route.orderedSinkInstanceIds.length ||
        route.orderedSinkInstanceIds.some(
          (instanceId) => !moduleById.has(instanceId),
        )
      )
        context.addIssue({
          code: "custom",
          message: "actor-set route does not close one unique root lineage",
          path: ["actorSetDamageRoutes", index],
        });
      routeRoots.add(route.rootChannelId);
    }
    for (const [index, grant] of graph.actorRootMutationGrants.entries()) {
      const root = rootById.get(grant.rootChannelId);
      if (
        root === undefined ||
        root.producerInstanceId !== grant.producerInstanceId ||
        !moduleById.has(grant.consumerInstanceId)
      )
        context.addIssue({
          code: "custom",
          message: "actor-root mutation grant splits producer lineage",
          path: ["actorRootMutationGrants", index],
        });
    }
    if (graph.scoringAuthority !== null) {
      const authority = graph.scoringAuthority;
      const scoreBindings = graph.bindings.filter(
        (binding) =>
          binding.to.instanceId === authority.ledgerInstanceId &&
          binding.payloadType === "score-transaction-v1" &&
          binding.delivery === "event",
      );
      const routesCloseBindings =
        scoreBindings.length === authority.sourceRoutes.length &&
        authority.sourceRoutes.every(
          (route) =>
            scoreBindings.filter(
              (binding) =>
                binding.from.instanceId === route.sourceInstanceId &&
                binding.from.portId === route.sourcePortId &&
                binding.to.portId === route.ledgerPortId,
            ).length === 1,
        );
      if (
        moduleById.get(authority.ledgerInstanceId)?.manifestSchemaVersion !==
          "1.4.0" ||
        moduleById.get(authority.ledgerInstanceId)?.factoryContextVersion !==
          "1.4.0" ||
        !routesCloseBindings
      )
        context.addIssue({
          code: "custom",
          message:
            "score ledger and source bounds must close exact V1.4 bindings",
          path: ["scoringAuthority"],
        });
    }
    if (graph.outcomeAuthority !== null) {
      const authority = graph.outcomeAuthority;
      const outcomeIds = [
        authority.coordinatorInstanceId,
        authority.winConditionInstanceId,
        authority.lossConditionInstanceId,
      ];
      const selectedBindingsClose = (
        providerInstanceId: string,
        inputPortId: string,
      ): boolean => {
        const runtimePorts = moduleById.get(providerInstanceId)
          ?.runtimePorts as
          | Readonly<{
              outputPorts: readonly Readonly<{
                id: string;
                payloadType: string;
                delivery: string;
              }>[];
            }>
          | undefined;
        const providerOutputs =
          runtimePorts?.outputPorts.filter(
            (port) =>
              port.payloadType === "outcome-condition-v1" &&
              port.delivery === "state",
          ) ?? [];
        const providerBindings = graph.bindings.filter(
          (binding) =>
            binding.from.instanceId === providerInstanceId &&
            binding.payloadType === "outcome-condition-v1" &&
            binding.delivery === "state",
        );
        return (
          providerOutputs.length === 1 &&
          providerBindings.length === 1 &&
          providerBindings[0]!.from.portId === providerOutputs[0]!.id &&
          providerBindings[0]!.to.instanceId ===
            authority.coordinatorInstanceId &&
          providerBindings[0]!.to.portId === inputPortId
        );
      };
      const coordinatorRuntimePorts = moduleById.get(
        authority.coordinatorInstanceId,
      )?.runtimePorts as
        | Readonly<{
            inputPorts: readonly Readonly<{
              id: string;
              payloadType: string;
              delivery: string;
            }>[];
          }>
        | undefined;
      const coordinatorInputs =
        coordinatorRuntimePorts?.inputPorts.filter(
          (port) =>
            port.payloadType === "outcome-condition-v1" &&
            port.delivery === "state",
        ) ?? [];
      const coordinatorInputIds = new Set(
        coordinatorInputs.map((port) => port.id),
      );
      if (
        new Set(outcomeIds).size !== 3 ||
        authority.winConditionStateInputPort ===
          authority.lossConditionStateInputPort ||
        coordinatorInputs.length !== 2 ||
        coordinatorInputIds.size !== 2 ||
        !coordinatorInputIds.has(authority.winConditionStateInputPort) ||
        !coordinatorInputIds.has(authority.lossConditionStateInputPort) ||
        outcomeIds.some(
          (instanceId) =>
            moduleById.get(instanceId)?.manifestSchemaVersion !== "1.4.0" ||
            moduleById.get(instanceId)?.factoryContextVersion !== "1.4.0",
        ) ||
        !selectedBindingsClose(
          authority.winConditionInstanceId,
          authority.winConditionStateInputPort,
        ) ||
        !selectedBindingsClose(
          authority.lossConditionInstanceId,
          authority.lossConditionStateInputPort,
        )
      )
        context.addIssue({
          code: "custom",
          message: "outcome selection must retain three exact V1.4 contexts",
          path: ["outcomeAuthority"],
        });
    }
    if (
      graph.executionReadiness.status === "ready" &&
      (graph.actorRootChannels.some(
        (root) => !routeRoots.has(root.rootChannelId),
      ) ||
        graph.actorRootChannels.some(
          (root) =>
            !graph.actorRootMutationGrants.some(
              (grant) => grant.rootChannelId === root.rootChannelId,
            ),
        ) ||
        graph.scoringAuthority === null ||
        graph.outcomeAuthority === null)
    )
      context.addIssue({
        code: "custom",
        message:
          "ready Graph 1.4 requires actor-set, scoring, and outcome authority closure",
        path: ["executionReadiness"],
      });
  });

export type ResolvedModuleGraphV14 = z.infer<
  typeof ResolvedModuleGraphV14Schema
>;
export type ResolvedScoreCapacityBasisV14 = z.infer<
  typeof ResolvedScoreCapacityBasisV14Schema
>;
