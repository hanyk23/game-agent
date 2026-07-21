import type { ActorRootReferenceV1 } from "./game-module-actor-root-custody-host.js";
import {
  ActorSetHealthBankHostV1,
  type ActorSetHealthTransitionV1,
} from "./game-module-actor-set-combat-host.js";
import { ContactCommitCoordinatorV14 } from "./game-module-contact-commit-v14.js";
import type { ResolvedModuleGraphV14 } from "./game-module-resolver-v14.js";
import type { GraphAuthorityAdaptersV14 } from "./game-module-production-authority-v14.js";
import type {
  ContactDecisionPayloadV2,
  DamagePayloadV2,
} from "./game-module-runtime-payloads.js";

export type ContactCandidateKindV14 = "projectile-root" | "actor-root-player";

export type ContactCandidateRegistrarV14 = Readonly<{
  register(
    instanceId: string,
    kind: ContactCandidateKindV14,
    handler: (candidate: Readonly<unknown>) => unknown,
  ): void | (() => void);
}>;

export type FixedContactDeliveriesV14 = Readonly<{
  deliverHitEvidence(evidenceId: number): unknown;
  deliverDamage(
    decision: ContactDecisionPayloadV2,
    evidenceId: number,
  ): unknown;
}>;

export type GraphActorContactAuthorityAdaptersV14 = Readonly<{
  actorSetHealth: Readonly<{
    damage(
      routeId: string,
      instanceId: string,
      payload: DamagePayloadV2,
    ): ActorSetHealthTransitionV1;
    snapshot(
      instanceId: string,
    ): ReturnType<ActorSetHealthBankHostV1["snapshot"]>;
  }>;
  contactCandidates: Readonly<{
    register(
      instanceId: string,
      kind: ContactCandidateKindV14,
      handler: (candidate: Readonly<unknown>) => unknown,
    ): () => void;
  }>;
  contactCommitV2: Readonly<{
    commit(
      instanceId: string,
      decision: ContactDecisionPayloadV2,
    ): Readonly<{ evidenceId: number }>;
  }>;
}> &
  Required<
    Pick<
      GraphAuthorityAdaptersV14,
      "actorSetHealth" | "contactCandidates" | "contactCommitV2"
    >
  >;

/**
 * Graph-bound glue for the existing actor-set and source-first contact hosts.
 * Factories receive only instance-bound facades projected from this adapter.
 */
export class GraphBoundActorContactAuthorityAdapterV14 {
  readonly #graph: ResolvedModuleGraphV14;
  readonly #healthHosts: ReadonlyMap<string, ActorSetHealthBankHostV1>;
  readonly #candidateRegistrar: ContactCandidateRegistrarV14;
  readonly #contactCoordinator: ContactCommitCoordinatorV14;
  readonly #deliveriesFor: (instanceId: string) => FixedContactDeliveriesV14;
  readonly #routeById = new Map<
    string,
    ResolvedModuleGraphV14["actorSetDamageRoutes"][number]
  >();
  readonly #routeByRootChannel = new Map<
    string,
    ResolvedModuleGraphV14["actorSetDamageRoutes"][number]
  >();

  constructor(
    input: Readonly<{
      graph: ResolvedModuleGraphV14;
      healthHosts: ReadonlyMap<string, ActorSetHealthBankHostV1>;
      candidateRegistrar: ContactCandidateRegistrarV14;
      contactCoordinator: ContactCommitCoordinatorV14;
      deliveriesFor(instanceId: string): FixedContactDeliveriesV14;
    }>,
  ) {
    if (input.graph.graphVersion !== "1.4.0")
      throw new Error("actor/contact authority requires Graph 1.4");
    this.#graph = input.graph;
    this.#healthHosts = input.healthHosts;
    this.#candidateRegistrar = input.candidateRegistrar;
    this.#contactCoordinator = input.contactCoordinator;
    this.#deliveriesFor = input.deliveriesFor;

    for (const route of input.graph.actorSetDamageRoutes) {
      const terminal = route.orderedSinkInstanceIds.at(-1);
      const module = input.graph.modules.find(
        (candidate) => candidate.instanceId === terminal,
      );
      if (
        terminal === undefined ||
        module?.moduleId !== "combat.health" ||
        module.version !== "1.2.0" ||
        !input.healthHosts.has(terminal) ||
        this.#routeById.has(route.routeId) ||
        this.#routeByRootChannel.has(route.rootChannelId)
      )
        throw new Error("invalid graph-bound actor-set health route");
      this.#routeById.set(route.routeId, route);
      this.#routeByRootChannel.set(route.rootChannelId, route);
    }
    if (input.healthHosts.size !== this.#routeById.size)
      throw new Error("actor-set health host closure is not exact");
  }

  readonly adapters: GraphActorContactAuthorityAdaptersV14 = Object.freeze({
    actorSetHealth: Object.freeze({
      damage: (routeId: string, instanceId: string, payload: DamagePayloadV2) =>
        this.#damage(instanceId, routeId, payload),
      snapshot: (instanceId: string) => this.#healthHost(instanceId).snapshot(),
    }),
    contactCandidates: Object.freeze({
      register: (
        instanceId: string,
        kind: ContactCandidateKindV14,
        handler: (candidate: Readonly<unknown>) => unknown,
      ) => this.#registerCandidate(instanceId, kind, handler),
    }),
    contactCommitV2: Object.freeze({
      commit: (instanceId: string, decision: ContactDecisionPayloadV2) =>
        this.#commit(instanceId, decision),
    }),
  });

  activateRoot(
    reference: ActorRootReferenceV1,
  ): ActorSetHealthTransitionV1["state"] {
    const route = this.#routeByRootChannel.get(reference.rootChannelId);
    if (route === undefined)
      throw new Error("actor root lacks a resolved health route");
    return this.#healthHost(route.orderedSinkInstanceIds.at(-1)!).activate(
      reference,
    );
  }

  pruneRoot(reference: ActorRootReferenceV1): void {
    const route = this.#routeByRootChannel.get(reference.rootChannelId);
    if (route === undefined)
      throw new Error("actor root lacks a resolved health route");
    this.#healthHost(route.orderedSinkInstanceIds.at(-1)!).prune(reference);
  }

  #damage(
    instanceId: string,
    routeId: string,
    payload: DamagePayloadV2,
  ): ActorSetHealthTransitionV1 {
    const route = this.#routeById.get(routeId);
    if (
      route === undefined ||
      route.orderedSinkInstanceIds.at(-1) !== instanceId ||
      route.rootChannelId !== payload.targetRootChannelId
    )
      throw new Error("actor-set damage route/terminal/root lineage mismatch");
    return this.#healthHost(instanceId).damage(payload);
  }

  #registerCandidate(
    instanceId: string,
    kind: ContactCandidateKindV14,
    handler: (candidate: Readonly<unknown>) => unknown,
  ): () => void {
    const module = this.#graph.modules.find(
      (candidate) => candidate.instanceId === instanceId,
    );
    const expectedModuleId =
      kind === "projectile-root"
        ? "interaction.projectile-root-contact"
        : "interaction.actor-root-contact";
    if (
      module?.moduleId !== expectedModuleId ||
      module.version !== "1.0.0" ||
      (kind === "actor-root-player" &&
        !this.#graph.actorRootMutationGrants.some(
          (grant) => grant.consumerInstanceId === instanceId,
        ))
    )
      throw new Error("undeclared graph-bound contact candidate registrar");
    return (
      this.#candidateRegistrar.register(instanceId, kind, handler) ??
      (() => undefined)
    );
  }

  #commit(
    instanceId: string,
    decision: ContactDecisionPayloadV2,
  ): Readonly<{ evidenceId: number }> {
    const module = this.#graph.modules.find(
      (candidate) => candidate.instanceId === instanceId,
    );
    if (
      module?.moduleId !== "interaction.contact-resolution" ||
      module.version !== "1.2.0"
    )
      throw new Error("undeclared Graph 1.4 V2 contact resolver");
    return this.#contactCoordinator
      .prepare(decision, this.#deliveriesFor(instanceId))
      .commit();
  }

  #healthHost(instanceId: string): ActorSetHealthBankHostV1 {
    const host = this.#healthHosts.get(instanceId);
    if (host === undefined)
      throw new Error("undeclared graph-bound actor-set health host");
    return host;
  }
}
