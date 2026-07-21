import type { ResolvedModuleGraphV14 } from "./game-module-resolver-v14.js";
import type {
  GameModuleFactoryContextV14,
  OutcomeFrameTailCallableV14,
} from "./game-module-runtime-factory.js";
import type { RuntimeHostFrameHooksV14 } from "./game-module-runtime-abi-v12.js";
import type { OutcomeConditionUpdateV1 } from "./game-module-outcome-host.js";
import { GraphBoundScoreLedgerAdapterV14 } from "./game-module-score-authority-adapter-v14.js";

type V14AuthorityServices = Pick<
  GameModuleFactoryContextV14["services"],
  | "actorSnapshots"
  | "entityChannelSnapshots"
  | "preparedEffects"
  | "actorRoots"
  | "actorRootSnapshots"
  | "actorRootMutation"
  | "actorSetHealth"
  | "contactCandidates"
  | "contactCommitV2"
  | "hostileProjectileDelivery"
  | "outcomeCommit"
>;

export type GraphAuthorityAdaptersV14 = Readonly<{
  actorSnapshots?: Readonly<{ read(grantId: string): unknown }>;
  entityChannelSnapshots?: Readonly<{ read(grantId: string): unknown }>;
  preparedEffects?: Readonly<{
    prepare(
      instanceId: string,
      sourceKey: string,
      collectedTemplate: unknown,
    ): unknown;
  }>;
  actorRoots?: Readonly<{
    activate(rootChannelId: string, request: Readonly<unknown>): unknown;
    deactivate(rootChannelId: string, request: Readonly<unknown>): unknown;
  }>;
  actorRootSnapshots?: Readonly<{
    read(bindingId: string): unknown;
  }>;
  actorRootMutation?: Readonly<{
    deactivate(grantId: string, request: Readonly<unknown>): unknown;
  }>;
  actorSetHealth?: Readonly<{
    damage(
      routeId: string,
      terminalInstanceId: string,
      request: Readonly<unknown>,
    ): unknown;
  }>;
  contactCandidates?: Readonly<{
    register(
      instanceId: string,
      contactKind: "projectile-root" | "actor-root-player",
      handler: (candidate: unknown) => unknown,
    ): () => void;
  }>;
  contactCommitV2?: Readonly<{
    commit(instanceId: string, decision: Readonly<unknown>): unknown;
  }>;
  hostileProjectileDelivery?: Readonly<{
    admit(
      lineageId: string,
      contentionGroupId: string,
      request: Readonly<unknown>,
    ): unknown;
    recycle(
      lineageId: string,
      contentionGroupId: string,
      request: Readonly<unknown>,
    ): unknown;
    observe(lineageId: string, contentionGroupId: string): unknown;
  }>;
  hostileAttackLineage?: Readonly<{
    readActiveSource(
      lineageId: string,
      rootChannelId: string,
      actorId: string,
      actorGeneration: number,
    ): Readonly<{ position: Readonly<{ x: number; y: number }> }>;
  }>;
  outcomeCommit?: Readonly<{
    publishCondition(update: OutcomeConditionUpdateV1): unknown;
    commit(commitServiceId: string, decision: Readonly<unknown>): unknown;
    beginFrame(frameSequence: number): void;
    arbitrateFrameTail(
      frameSequence: number,
      coordinator: OutcomeFrameTailCallableV14,
    ): unknown;
    afterGuard(frameSequence: number): void;
  }>;
}>;

/**
 * Projects resolver-owned Graph 1.4 grants into instance-bound facades.
 * Raw adapters and graph descriptors never enter a factory context.
 */
export class GraphAuthorityFacadeHostV14 {
  readonly #graph: ResolvedModuleGraphV14;
  readonly #adapters: GraphAuthorityAdaptersV14;
  readonly #outcomeRoutes = new Map<
    string,
    Readonly<{ outputPortId: string; candidate: "win" | "loss" }>
  >();
  #scoreLedger: GraphBoundScoreLedgerAdapterV14 | undefined;

  constructor(
    graph: ResolvedModuleGraphV14,
    adapters: GraphAuthorityAdaptersV14,
  ) {
    if (graph.graphVersion !== "1.4.0")
      throw new Error("Graph 1.4 authority host requires Graph 1.4");
    this.#graph = graph;
    this.#adapters = adapters;
    this.#requireAdapters();
    this.#validateOutcomePublicationClosure();
  }

  servicesForInstance(instanceId: string): V14AuthorityServices {
    if (!this.#graph.modules.some((module) => module.instanceId === instanceId))
      throw new Error(`unknown Graph 1.4 instance: ${instanceId}`);
    const services: Record<string, unknown> = {};
    const actorSnapshotGrants = this.#graph.actorSnapshotGrants.filter(
      (grant) => grant.instanceId === instanceId,
    );
    if (actorSnapshotGrants.length > 0) {
      const byReadId = new Map(
        actorSnapshotGrants.map((grant) => {
          const descriptor = grant.descriptor as Readonly<{ readId: string }>;
          return [descriptor.readId, grant.grantId] as const;
        }),
      );
      services.actorSnapshots = Object.freeze({
        read: (readId: string) => {
          const grantId = byReadId.get(readId);
          if (grantId === undefined)
            throw new Error(`undeclared actor snapshot read: ${readId}`);
          return this.#adapters.actorSnapshots!.read(grantId);
        },
      });
    }
    const entitySnapshotGrants = this.#graph.entityChannelReadGrants.filter(
      (grant) => grant.instanceId === instanceId,
    );
    if (entitySnapshotGrants.length > 0) {
      const byReadId = new Map(
        entitySnapshotGrants.map((grant) => {
          const descriptor = grant.descriptor as Readonly<{ readId: string }>;
          return [descriptor.readId, grant.grantId] as const;
        }),
      );
      services.entityChannelSnapshots = Object.freeze({
        read: (readId: string) => {
          const grantId = byReadId.get(readId);
          if (grantId === undefined)
            throw new Error(
              `undeclared entity channel snapshot read: ${readId}`,
            );
          return this.#adapters.entityChannelSnapshots!.read(grantId);
        },
      });
    }
    if (
      this.#graph.pickupEffectPlans.some(
        (plan) => plan.commitInstanceId === instanceId,
      )
    )
      services.preparedEffects = Object.freeze({
        prepare: (sourceKey: string, collectedTemplate: unknown) =>
          this.#adapters.preparedEffects!.prepare(
            instanceId,
            sourceKey,
            collectedTemplate,
          ),
      });
    const producedRoots = this.#graph.actorRootChannels.filter(
      (channel) => channel.producerInstanceId === instanceId,
    );
    if (producedRoots.length > 0) {
      const allowed = new Set(
        producedRoots.map((channel) => channel.rootChannelId),
      );
      services.actorRoots = Object.freeze({
        activate: (grantId: string, request: Readonly<unknown>) => {
          if (!allowed.has(grantId))
            throw new Error(`undeclared actor-root producer grant: ${grantId}`);
          return this.#adapters.actorRoots!.activate(grantId, request);
        },
        deactivate: (grantId: string, request: Readonly<unknown>) => {
          if (!allowed.has(grantId))
            throw new Error(`undeclared actor-root producer grant: ${grantId}`);
          return this.#adapters.actorRoots!.deactivate(grantId, request);
        },
      });
    }
    const snapshotBindings = this.#graph.actorRootChannels.flatMap((channel) =>
      channel.consumerGrants.filter(
        (grant) => grant.consumerInstanceId === instanceId,
      ),
    );
    if (snapshotBindings.length > 0) {
      const allowed = new Set(snapshotBindings.map((grant) => grant.bindingId));
      services.actorRootSnapshots = Object.freeze({
        read: (grantId: string) => {
          if (!allowed.has(grantId))
            throw new Error(`undeclared actor-root snapshot grant: ${grantId}`);
          return this.#adapters.actorRootSnapshots!.read(grantId);
        },
      });
    }
    const mutationGrants = this.#graph.actorRootMutationGrants.filter(
      (grant) => grant.consumerInstanceId === instanceId,
    );
    if (mutationGrants.length > 0) {
      const allowed = new Set(mutationGrants.map((grant) => grant.grantId));
      services.actorRootMutation = Object.freeze({
        deactivate: (grantId: string, request: Readonly<unknown>) => {
          if (!allowed.has(grantId))
            throw new Error(`undeclared actor-root mutation grant: ${grantId}`);
          return this.#adapters.actorRootMutation!.deactivate(grantId, request);
        },
      });
    }
    const actorSetRoutes = (this.#graph.actorSetDamageRoutes ?? []).filter(
      (route) => route.orderedSinkInstanceIds.at(-1) === instanceId,
    );
    if (actorSetRoutes.length > 0) {
      const allowed = new Set(actorSetRoutes.map((route) => route.routeId));
      services.actorSetHealth = Object.freeze({
        damage: (routeId: string, request: Readonly<unknown>) => {
          if (!allowed.has(routeId))
            throw new Error(`undeclared actor-set health route: ${routeId}`);
          return this.#adapters.actorSetHealth!.damage(
            routeId,
            instanceId,
            request,
          );
        },
      });
    }
    const module = this.#graph.modules.find(
      (candidate) => candidate.instanceId === instanceId,
    );
    const contactKind = this.#contactKind(module);
    if (contactKind !== undefined) {
      services.contactCandidates = Object.freeze({
        register: (handler: (candidate: unknown) => unknown) =>
          this.#adapters.contactCandidates!.register(
            instanceId,
            contactKind,
            handler,
          ),
      });
    }
    if (
      this.#isV2ContactResolution(module) &&
      (this.#graph.contactRoutes ?? []).some(
        (route) => route.resolutionInstanceId === instanceId,
      )
    ) {
      services.contactCommitV2 = Object.freeze({
        commit: (decision: Readonly<unknown>) =>
          this.#adapters.contactCommitV2!.commit(instanceId, decision),
      });
    }
    const hostileLineages = this.#graph.hostileAttackChannels.filter(
      (channel) => channel.deliveryInstanceId === instanceId,
    );
    if (hostileLineages.length > 0) {
      const byLineage = new Map(
        hostileLineages.map((channel) => [channel.lineageId, channel] as const),
      );
      const resolve = (grantId: string) => {
        const channel = byLineage.get(grantId);
        if (channel === undefined)
          throw new Error(
            `undeclared hostile projectile delivery grant: ${grantId}`,
          );
        return channel;
      };
      services.hostileProjectileDelivery = Object.freeze({
        admit: (grantId: string, request: Readonly<unknown>) => {
          const channel = resolve(grantId);
          return this.#adapters.hostileProjectileDelivery!.admit(
            channel.lineageId,
            channel.contentionGroupId,
            request,
          );
        },
        recycle: (grantId: string, request: Readonly<unknown>) => {
          const channel = resolve(grantId);
          return this.#adapters.hostileProjectileDelivery!.recycle(
            channel.lineageId,
            channel.contentionGroupId,
            request,
          );
        },
        observe: (grantId: string) => {
          const channel = resolve(grantId);
          return this.#adapters.hostileProjectileDelivery!.observe(
            channel.lineageId,
            channel.contentionGroupId,
          );
        },
      });
    }
    if (this.#graph.outcomeAuthority?.coordinatorInstanceId === instanceId) {
      const commitServiceId = this.#graph.outcomeAuthority.commitServiceId;
      services.outcomeCommit = Object.freeze({
        commit: (grantId: string, decision: Readonly<unknown>) => {
          if (grantId !== commitServiceId)
            throw new Error(`undeclared outcome commit grant: ${grantId}`);
          return this.#adapters.outcomeCommit!.commit(grantId, decision);
        },
      });
    }
    return Object.freeze(services) as V14AuthorityServices;
  }

  readHostileActiveSource(
    lineageId: string,
    rootChannelId: string,
    actorId: string,
    actorGeneration: number,
  ): Readonly<{ position: Readonly<{ x: number; y: number }> }> {
    const channel = this.#graph.hostileAttackChannels.find(
      (candidate) => candidate.lineageId === lineageId,
    );
    if (channel === undefined || channel.rootChannelId !== rootChannelId)
      throw new Error("undeclared hostile source lineage read");
    return this.#adapters.hostileAttackLineage!.readActiveSource(
      lineageId,
      rootChannelId,
      actorId,
      actorGeneration,
    );
  }

  createOutcomeFrameHooks(
    coordinatorInstanceId: string,
    getCoordinator: () => OutcomeFrameTailCallableV14 | undefined,
  ): RuntimeHostFrameHooksV14 | undefined {
    const authority = this.#graph.outcomeAuthority;
    if (authority === null) return undefined;
    if (authority.coordinatorInstanceId !== coordinatorInstanceId)
      throw new Error(
        `undeclared outcome coordinator: ${coordinatorInstanceId}`,
      );
    return Object.freeze({
      beginFrame: (frameSequence: number) =>
        this.#adapters.outcomeCommit!.beginFrame(frameSequence),
      frameTail: (frameSequence: number) => {
        const coordinator = getCoordinator();
        if (coordinator === undefined)
          throw new Error("missing resolved outcome frame-tail callable");
        return this.#adapters.outcomeCommit!.arbitrateFrameTail(
          frameSequence,
          coordinator,
        );
      },
      afterGuard: (frameSequence: number) =>
        this.#adapters.outcomeCommit!.afterGuard(frameSequence),
    });
  }

  publishOutcomeCondition(
    input: Readonly<{
      providerInstanceId: string;
      sourcePortId: string;
      proposal: Readonly<{
        candidate: "win" | "loss";
        met: boolean;
        reason:
          "player-health" | "boss-defeat" | "score-threshold" | "survival-time";
        observedAtMs: number;
        evidenceId: string;
      }>;
    }>,
  ): unknown {
    const route = this.#outcomeRoutes.get(input.providerInstanceId);
    if (
      route === undefined ||
      route.outputPortId !== input.sourcePortId ||
      route.candidate !== input.proposal.candidate
    )
      throw new Error("outcome provider publication authority mismatch");
    return this.#adapters.outcomeCommit!.publishCondition(
      Object.freeze({
        providerInstanceId: input.providerInstanceId,
        ...input.proposal,
      }),
    );
  }

  initializeScoreLedger(nowMs: () => number): void {
    if (this.#graph.scoringAuthority === null)
      throw new Error("cannot initialize score ledger without authority");
    if (this.#scoreLedger !== undefined)
      throw new Error("authoritative score ledger is already initialized");
    this.#scoreLedger = new GraphBoundScoreLedgerAdapterV14({
      graph: this.#graph,
      nowMs,
    });
  }

  disposeScoreLedger(): void {
    const ledger = this.#scoreLedger;
    if (ledger === undefined)
      throw new Error("authoritative score ledger is not initialized");
    ledger.dispose();
    this.#scoreLedger = undefined;
  }

  applyScoreTransaction(
    input: Readonly<{
      ledgerInstanceId: string;
      sourceInstanceId: string;
      sourcePortId: string;
      ledgerPortId: string;
      transaction: Readonly<unknown>;
    }>,
  ): unknown {
    if (
      this.#graph.scoringAuthority?.ledgerInstanceId !== input.ledgerInstanceId
    )
      throw new Error(
        `undeclared authoritative score ledger: ${input.ledgerInstanceId}`,
      );
    const matches = this.#graph.bindings.filter(
      (binding) =>
        binding.from.instanceId === input.sourceInstanceId &&
        binding.from.portId === input.sourcePortId &&
        binding.to.instanceId === input.ledgerInstanceId &&
        binding.to.portId === input.ledgerPortId &&
        binding.payloadType === "score-transaction-v1" &&
        binding.delivery === "event",
    );
    if (matches.length !== 1)
      throw new Error("score delivery lacks one exact resolved binding");
    if (this.#scoreLedger === undefined)
      throw new Error("authoritative score ledger is not initialized");
    return this.#scoreLedger.accept(Object.freeze({ ...input }));
  }

  #requireAdapters(): void {
    const required = (
      condition: boolean,
      adapter: unknown,
      name: string,
    ): void => {
      if (condition && adapter === undefined)
        throw new Error(`missing Graph 1.4 authority adapter: ${name}`);
    };
    const v14Instances = new Set(
      this.#graph.modules
        .filter((module) => module.factoryContextVersion === "1.4.0")
        .map((module) => module.instanceId),
    );
    required(
      this.#graph.actorSnapshotGrants.some((grant) =>
        v14Instances.has(grant.instanceId),
      ),
      this.#adapters.actorSnapshots,
      "actorSnapshots",
    );
    required(
      this.#graph.entityChannelReadGrants.some((grant) =>
        v14Instances.has(grant.instanceId),
      ),
      this.#adapters.entityChannelSnapshots,
      "entityChannelSnapshots",
    );
    required(
      this.#graph.pickupEffectPlans.some((plan) =>
        v14Instances.has(plan.commitInstanceId),
      ),
      this.#adapters.preparedEffects,
      "preparedEffects",
    );
    required(
      this.#graph.actorRootChannels.length > 0,
      this.#adapters.actorRoots,
      "actorRoots",
    );
    required(
      this.#graph.actorRootChannels.some(
        (channel) => channel.consumerGrants.length > 0,
      ),
      this.#adapters.actorRootSnapshots,
      "actorRootSnapshots",
    );
    required(
      this.#graph.actorRootMutationGrants.length > 0,
      this.#adapters.actorRootMutation,
      "actorRootMutation",
    );
    required(
      (this.#graph.actorSetDamageRoutes?.length ?? 0) > 0,
      this.#adapters.actorSetHealth,
      "actorSetHealth",
    );
    required(
      this.#graph.modules.some(
        (module) => this.#contactKind(module) !== undefined,
      ),
      this.#adapters.contactCandidates,
      "contactCandidates",
    );
    required(
      (this.#graph.contactRoutes?.length ?? 0) > 0,
      this.#adapters.contactCommitV2,
      "contactCommitV2",
    );
    required(
      this.#graph.hostileAttackChannels.length > 0,
      this.#adapters.hostileProjectileDelivery,
      "hostileProjectileDelivery",
    );
    required(
      this.#graph.hostileAttackChannels.length > 0,
      this.#adapters.hostileAttackLineage,
      "hostileAttackLineage",
    );
    required(
      this.#graph.outcomeAuthority !== null,
      this.#adapters.outcomeCommit,
      "outcomeCommit",
    );
  }

  #validateOutcomePublicationClosure(): void {
    const authority = this.#graph.outcomeAuthority;
    if (authority === null) return;
    const coordinator = this.#graph.modules.find(
      (module) => module.instanceId === authority.coordinatorInstanceId,
    );
    const coordinatorPorts = coordinator?.runtimePorts as
      | Readonly<{
          inputPorts: readonly Readonly<{
            id: string;
            payloadType: string;
            delivery: string;
          }>[];
        }>
      | undefined;
    const coordinatorInputs = new Set(
      coordinatorPorts?.inputPorts
        .filter(
          (port) =>
            port.payloadType === "outcome-condition-v1" &&
            port.delivery === "state",
        )
        .map((port) => port.id) ?? [],
    );
    const targets = new Set<string>();
    for (const [providerInstanceId, candidate] of [
      [authority.winConditionInstanceId, "win"],
      [authority.lossConditionInstanceId, "loss"],
    ] as const) {
      const expectedInputPort =
        candidate === "win"
          ? authority.winConditionStateInputPort
          : authority.lossConditionStateInputPort;
      const provider = this.#graph.modules.find(
        (module) => module.instanceId === providerInstanceId,
      );
      const providerPorts = provider?.runtimePorts as
        | Readonly<{
            outputPorts: readonly Readonly<{
              id: string;
              payloadType: string;
              delivery: string;
            }>[];
          }>
        | undefined;
      const outputs =
        providerPorts?.outputPorts.filter(
          (port) =>
            port.payloadType === "outcome-condition-v1" &&
            port.delivery === "state",
        ) ?? [];
      const bindings = this.#graph.bindings.filter(
        (binding) =>
          binding.from.instanceId === providerInstanceId &&
          outputs.some((port) => port.id === binding.from.portId) &&
          binding.payloadType === "outcome-condition-v1" &&
          binding.delivery === "state",
      );
      if (
        outputs.length !== 1 ||
        bindings.length !== 1 ||
        bindings[0]!.from.portId !== outputs[0]!.id ||
        bindings[0]!.to.instanceId !== authority.coordinatorInstanceId ||
        bindings[0]!.to.portId !== expectedInputPort ||
        !coordinatorInputs.has(expectedInputPort) ||
        targets.has(bindings[0]!.to.portId)
      )
        throw new Error(
          `outcome provider lacks one exact resolved binding: ${providerInstanceId}`,
        );
      targets.add(bindings[0]!.to.portId);
      this.#outcomeRoutes.set(
        providerInstanceId,
        Object.freeze({ outputPortId: outputs[0]!.id, candidate }),
      );
    }
    if (coordinatorInputs.size !== 2 || targets.size !== 2)
      throw new Error("outcome coordinator state binding closure is not exact");
  }

  #contactKind(
    module: ResolvedModuleGraphV14["modules"][number] | undefined,
  ): "projectile-root" | "actor-root-player" | undefined {
    if (module?.factoryContextVersion !== "1.4.0" || module.version !== "1.0.0")
      return undefined;
    if (module.moduleId === "interaction.actor-root-contact")
      return "actor-root-player";
    return undefined;
  }

  #isV2ContactResolution(
    module: ResolvedModuleGraphV14["modules"][number] | undefined,
  ): boolean {
    return (
      module?.factoryContextVersion === "1.4.0" &&
      module.moduleId === "interaction.contact-resolution" &&
      module.version === "1.2.0"
    );
  }
}
