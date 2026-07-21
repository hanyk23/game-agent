import {
  resolveBatch3AuthorityPlanV14,
  type Batch3ManifestSelectionV14,
  type Batch3ScoreAwardBoundV14,
} from "./game-module-authority-resolver-v14.js";
import {
  resolveGameAssemblyInheritedV13Projection,
  type ExecutionReadinessReport,
  type ModuleAssetAdmissionEvidenceV12,
  type ResolvedInheritedGraphProjectionV14Result,
} from "./game-module-resolver.js";
import {
  ResolvedModuleGraphV14Schema,
  type ResolvedModuleGraphV14,
  type ResolvedScoreCapacityBasisV14,
} from "./game-module-resolver-v14.js";
import type {
  GameAssemblySpecV13,
  ModuleResourceBudget,
} from "./game-module-contract.js";
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
    assetEvidence?: ModuleAssetAdmissionEvidenceV12;
  }>,
): ResolvedModuleGraphV14Result {
  const projection = resolveGameAssemblyInheritedV13Projection(
    assembly,
    registry,
    input.assetEvidence,
    true,
  ) as ResolvedInheritedGraphProjectionV14Result;
  const base = projection.graph;
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
        resourceGrant: module.resourceGrant as ModuleResourceBudget,
      });
  }
  const authority = resolveBatch3AuthorityPlanV14({
    assembly,
    manifests: selections,
    scoreCapacityBasis: input.scoreCapacityBasis,
    scoreAwardBounds: input.scoreAwardBounds,
  });
  const blockers = [
    ...projection.readinessReport.blockers,
    ...authority.readinessReport.blockers,
  ];
  const modules = base.modules;
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
    catalogEvidenceId: base.catalogEvidenceId,
    actors: base.actors,
    modules,
    dependencyEdges: base.dependencyEdges,
    capabilityEdges: base.capabilityEdges,
    bindings: base.bindings,
    constructionOrder: base.constructionOrder,
    assetBindings: base.assetBindings,
    contactPolicyProfiles: base.contactPolicyProfiles,
    damageSinkRoutes: base.damageSinkRoutes,
    entityChannels: base.entityChannels,
    entityMutationGrants: base.entityMutationGrants,
    actorSnapshotGrants: base.actorSnapshotGrants,
    entityChannelReadGrants: base.entityChannelReadGrants,
    attackChannels: base.attackChannels,
    projectileChannelLineages: base.projectileChannelLineages,
    effectApplicationRoutes: base.effectApplicationRoutes,
    pickupEffectPlans: base.pickupEffectPlans,
    projectileBudgetContention: base.projectileBudgetContention,
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
