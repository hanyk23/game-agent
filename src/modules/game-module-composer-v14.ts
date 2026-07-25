import {
  resolveBatch3AuthorityPlanV14,
  type Batch3ManifestSelectionV14,
  type Batch3ScoreAwardBoundV14,
} from "./game-module-authority-resolver-v14.js";
import {
  resolveGameAssemblyBaseV14,
  type ExecutionReadinessReport,
  type ResolvedActorSnapshotGrantV13,
  type ResolvedEntityChannelReadGrantV13,
  type ResolvedProjectileChannelLineageV13,
} from "./game-module-resolver.js";
import {
  ResolvedModuleGraphV14Schema,
  type ResolvedModuleGraphV14,
  type ResolvedScoreCapacityBasisV14,
} from "./game-module-resolver-v14.js";
import type { GameAssemblySpecV13 } from "./game-module-contract.js";
import type { GameModuleRegistry } from "./game-module-registry.js";
import { sha256CanonicalJson } from "./game-module-execution-contract.js";

export type ResolvedModuleGraphV14Result = Readonly<{
  graph: ResolvedModuleGraphV14;
  readinessReport: ExecutionReadinessReport;
}>;

/**
 * Composes the version-neutral Assembly 1.3 binding result with the separate,
 * pure ADR 0028 authority plan.  Version 1.3 participants are retained as
 * their reviewed registrations; no manifest or factory-context upcast occurs.
 */
export function resolveGameAssemblyV14(
  assembly: GameAssemblySpecV13,
  registry: GameModuleRegistry,
  input: Readonly<{
    scoreCapacityBasis: ResolvedScoreCapacityBasisV14;
    scoreAwardBounds: readonly Batch3ScoreAwardBoundV14[];
  }>,
): ResolvedModuleGraphV14Result {
  const base = resolveGameAssemblyBaseV14(assembly, registry);
  const selections: Batch3ManifestSelectionV14[] = [];
  for (const module of base.modules) {
    const registration = registry
      .findForGraphV14(module.moduleId, module.version)
      .find(
        (candidate) =>
          candidate.manifest.schemaVersion === "1.3.0" ||
          candidate.manifest.schemaVersion === "1.4.0",
      );
    if (
      registration?.manifest.schemaVersion === "1.3.0" ||
      registration?.manifest.schemaVersion === "1.4.0"
    )
      selections.push({
        instanceId: module.instanceId,
        manifest: registration.manifest,
      });
  }
  const authority = resolveBatch3AuthorityPlanV14({
    assembly,
    manifests: selections,
    scoreCapacityBasis: input.scoreCapacityBasis,
    scoreAwardBounds: input.scoreAwardBounds,
  });
  const registrations = new Map(
    base.modules.map((module) => [
      module.instanceId,
      registry.findForGraphV14(module.moduleId, module.version)[0],
    ]),
  );
  const blockers = [...authority.readinessReport.blockers];
  const actorSnapshotGrants: ResolvedActorSnapshotGrantV13[] = [];
  const entityChannelReadGrants: ResolvedEntityChannelReadGrantV13[] = [];
  const projectileChannelLineages: ResolvedProjectileChannelLineageV13[] = [];
  for (const module of base.modules) {
    const manifest = registrations.get(module.instanceId)?.manifest;
    if (
      manifest?.schemaVersion === "1.3.0" ||
      manifest?.schemaVersion === "1.4.0"
    ) {
      const owner = base.actors.find(
        (actor) => actor.actorId === module.ownerId,
      );
      for (const descriptor of manifest.actorSnapshotReads) {
        const targets = base.actors.filter((actor) =>
          descriptor.targetActorRoles.includes(actor.role),
        );
        if (
          owner === undefined ||
          !descriptor.sourceActorRoles.includes(owner.role) ||
          (descriptor.ownerRelation === "same-owner" &&
            !targets.some((target) => target.actorId === owner.actorId)) ||
          (descriptor.ownerRelation === "different-owner" &&
            !targets.some((target) => target.actorId !== owner.actorId))
        ) {
          blockers.push({
            instanceId: module.instanceId,
            code: "invalid-actor-snapshot-grant",
          });
          continue;
        }
        actorSnapshotGrants.push({
          grantId: `${module.instanceId}/actor-read/${descriptor.readId}`,
          instanceId: module.instanceId,
          ownerActorId: module.ownerId,
          descriptor,
        });
      }
      for (const descriptor of manifest.entityChannelReads) {
        const sourceBindings = base.bindings.filter(
          (binding) =>
            binding.to.instanceId === module.instanceId &&
            binding.to.portId === descriptor.channelStateInputPort,
        );
        const source = sourceBindings[0];
        const channel =
          sourceBindings.length === 1 && source !== undefined
            ? base.entityChannels.find(
                (candidate) =>
                  candidate.ownerInstanceId === source.from.instanceId &&
                  candidate.outputPort === source.from.portId &&
                  candidate.entityRole === descriptor.sourceEntityRole,
              )
            : undefined;
        if (channel === undefined) {
          blockers.push({
            instanceId: module.instanceId,
            code: "invalid-entity-channel-read-grant",
          });
          continue;
        }
        entityChannelReadGrants.push({
          grantId: `${module.instanceId}/channel-read/${descriptor.readId}`,
          instanceId: module.instanceId,
          channelId: channel.channelId,
          maximumEntries: channel.capacity,
          descriptor,
        });
      }
      if (manifest.projectileChannelConsumer !== null) {
        const descriptor = manifest.projectileChannelConsumer;
        const sourceBindings = base.bindings.filter(
          (binding) =>
            binding.to.instanceId === module.instanceId &&
            binding.to.portId === descriptor.sourceChannelInputPort,
        );
        const source = sourceBindings[0];
        const provider =
          sourceBindings.length === 1 && source !== undefined
            ? registrations.get(source.from.instanceId)?.manifest
            : undefined;
        const channel =
          source === undefined
            ? undefined
            : base.entityChannels.find(
                (candidate) =>
                  candidate.ownerInstanceId === source.from.instanceId &&
                  candidate.outputPort === source.from.portId &&
                  candidate.entityRole === descriptor.sourceEntityRole,
              );
        if (
          source === undefined ||
          provider === undefined ||
          channel === undefined ||
          !provider.provides.some(
            (capability) =>
              `${capability.id}@${capability.version}` ===
              descriptor.requiredCapability,
          )
        )
          blockers.push({
            instanceId: module.instanceId,
            code: "invalid-projectile-channel-lineage",
          });
        else
          projectileChannelLineages.push({
            lineageId: `${module.instanceId}/projectile-lineage/${channel.channelId}`,
            providerInstanceId: source.from.instanceId,
            providerCapabilityId: "delivery.projectile-channel",
            sourceBinding: source,
            channelId: channel.channelId,
            channelOutputPort: source.from.portId,
            consumerInstanceId: module.instanceId,
            consumerInputPort: descriptor.sourceChannelInputPort,
          });
      }
    }
    // ADR 0028 attack authority is represented by the separate V1.4 plan
    // below.  A retained V1.3 participant has no such authority descriptor
    // and must therefore remain fail-closed until its older runtime grants are
    // explicitly projected.
    if (
      manifest?.schemaVersion === "1.3.0" &&
      (manifest.attackChannel !== null ||
        manifest.preparedEffectCommit !== null)
    )
      blockers.push({
        instanceId: module.instanceId,
        code: "unprojected-v13-plus-runtime-grant",
      });
  }
  const modules = base.modules.map((module) => {
    const registration = registrations.get(module.instanceId);
    const manifest = registration?.manifest;
    if (
      registration === undefined ||
      manifest === undefined ||
      (manifest.schemaVersion !== "1.2.0" &&
        manifest.schemaVersion !== "1.3.0" &&
        manifest.schemaVersion !== "1.4.0")
    ) {
      blockers.push({
        instanceId: module.instanceId,
        code: "missing-manifest",
      });
      return {
        ...module,
        manifestSchemaVersion: "1.2.0" as const,
        factoryContextVersion: "1.2.0" as const,
        runtimeContract: {
          update: null,
          timerSlots: { slotGroupId: "blocked.legacy" },
          inputRegistrations: [],
          observationReaders: [],
          contactCommit: null,
        },
        runtimePorts: { inputPorts: [], outputPorts: [] },
        runtimeAuthorities: {
          inputRegistrationIds: [],
          observationReaderIds: [],
          ownedChannelIds: [],
          ownsPlayerLocomotion: false,
        },
      };
    }
    if (registration.registrationKind !== "production")
      blockers.push({
        instanceId: module.instanceId,
        code: "fixture-registration",
      });
    if (registration.executableHandle === undefined)
      blockers.push({
        instanceId: module.instanceId,
        code: "missing-executable-handle",
      });
    const handle = registration.executableHandle;
    const catalogEntryEvidenceId =
      handle === undefined
        ? undefined
        : sha256CanonicalJson({
            moduleId: module.moduleId,
            version: module.version,
            manifestSchemaVersion: manifest.schemaVersion,
            factoryContextVersion: manifest.schemaVersion,
            envelopeSha256: module.artifactIdentity?.envelopeSha256 ?? null,
            implementationId: handle.implementationId,
            exportName: handle.exportName,
            exportKind: handle.exportKind,
            outputBundleSha256: handle.outputBundleSha256,
          });
    return {
      ...module,
      manifestSchemaVersion: manifest.schemaVersion,
      factoryContextVersion: manifest.schemaVersion,
      runtimeContract: manifest.runtimeContract,
      runtimePorts: {
        inputPorts: manifest.inputPorts,
        outputPorts: manifest.outputPorts,
      },
      runtimeAuthorities: {
        inputRegistrationIds: manifest.runtimeContract.inputRegistrations.map(
          (entry) => entry.registrationId,
        ),
        observationReaderIds: manifest.runtimeContract.observationReaders.map(
          (entry) => entry.readerId,
        ),
        ownedChannelIds: (manifest.ownedEntityChannels ?? []).map(
          (entry) => entry.channelId,
        ),
        ownsPlayerLocomotion:
          manifest.exclusiveOwnership.includes("player.locomotion"),
      },
      ...(catalogEntryEvidenceId === undefined
        ? {}
        : { catalogEntryEvidenceId }),
    };
  });
  const sortedBlockers = blockers.sort(
    (left, right) =>
      left.instanceId.localeCompare(right.instanceId) ||
      left.code.localeCompare(right.code),
  );
  const status = sortedBlockers.length === 0 ? "ready" : "blocked";
  // A blocked authority plan may retain diagnostic candidates that do not form
  // a complete V3 triple.  Graph artifacts serialize grants, not candidates:
  // only groups whose every member is represented by a closed hostile lineage
  // are safe to project.  The original blockers remain hash-bound below.
  const closedHostileAttackChannels = authority.plan.hostileAttackChannels;
  const closedHostileDeliveryIds = new Set(
    closedHostileAttackChannels.map((channel) => channel.deliveryInstanceId),
  );
  const closedHostileContentionGroups =
    authority.plan.hostileContentionGroups.filter((group) =>
      group.memberInstanceIds.every((member) =>
        closedHostileDeliveryIds.has(member),
      ),
    );
  const evidenceId = sha256CanonicalJson({
    graphVersion: "1.4.0",
    baseEvidenceId: sha256CanonicalJson(base),
    authorityEvidenceId: authority.readinessReport.graphEvidenceId,
    modules: modules.map((module) => ({
      instanceId: module.instanceId,
      manifestSchemaVersion: module.manifestSchemaVersion,
      catalogEntryEvidenceId: module.catalogEntryEvidenceId ?? null,
    })),
    blockers: sortedBlockers,
  });
  const graph = ResolvedModuleGraphV14Schema.parse({
    graphVersion: "1.4.0",
    assemblyId: base.assemblyId,
    kernelVersion: base.kernelVersion,
    engine: base.engine,
    executionReadiness: { status, evidenceId },
    catalogEvidenceId: sha256CanonicalJson(
      modules.map((module) => module.catalogEntryEvidenceId ?? null),
    ),
    actors: base.actors,
    modules,
    dependencyEdges: base.dependencyEdges,
    capabilityEdges: base.capabilityEdges,
    bindings: base.bindings,
    constructionOrder: base.constructionOrder,
    assetBindings: [],
    contactPolicyProfiles: base.contactPolicyProfiles,
    damageSinkRoutes: base.damageSinkRoutes,
    entityChannels: base.entityChannels,
    entityMutationGrants: base.entityMutationGrants,
    actorSnapshotGrants,
    entityChannelReadGrants,
    attackChannels: [],
    projectileChannelLineages,
    effectApplicationRoutes: [],
    pickupEffectPlans: [],
    projectileBudgetContention: {
      budget: {
        activeProjectiles: base.resourceTotals.activeProjectiles,
        spawnsPerSecond: base.resourceTotals.spawnsPerSecond,
      },
      totals: { activeProjectiles: 0, spawnsPerSecond: 0 },
      orderedOwners: [],
    },
    resourceTotals: base.resourceTotals,
    ...authority.plan,
    hostileAttackChannels: closedHostileAttackChannels,
    hostileContentionGroups: closedHostileContentionGroups,
  });
  return Object.freeze({
    graph,
    readinessReport: Object.freeze({
      graphEvidenceId: evidenceId,
      status,
      blockers: sortedBlockers,
    }),
  });
}
