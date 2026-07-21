import { DeterministicLogicalEntityDirectory } from "./game-module-entity-directory.js";
import {
  DeterministicContactPolicyTransactionHost,
  type ContactPolicyRuntimeRegistry,
} from "./game-module-contact-policy-host.js";
import {
  DeterministicGameModuleLeaseLedger,
  type GameModuleLeaseOwnerDeclaration,
} from "./game-module-lease-ledger.js";
import {
  DeterministicGameModuleLifecycleCoordinator,
  type GameModuleLifecycleFailure,
  type GameModuleLifecycleParticipant,
} from "./game-module-lifecycle-coordinator.js";
import {
  DeterministicModulePortRouter,
  type ModulePortRouterSnapshot,
} from "./game-module-port-router.js";
import type {
  ResolvedGameModule,
  ResolvedModuleGraph,
} from "./game-module-resolver.js";
import {
  asLifecycleParticipant,
  type GameModuleFactoryContext,
  type ProductionModuleExecutionExports,
  type ProductionModuleExecutionRegistry,
} from "./game-module-runtime-factory.js";
import {
  createUnavailableRuntimeServiceHost,
  type GameModuleRuntimeServiceHost,
  type GameModuleRuntimeServiceScopeAuthority,
  type GameModuleRuntimeServiceScopeEvidence,
  type GameModuleScopedRuntimeServices,
} from "./game-module-runtime-services.js";

export const GraphExecutionHarnessErrorCode = {
  graphNotProduction: "graph-not-production",
  registrationMismatch: "registration-mismatch",
  missingExecutionExport: "missing-execution-export",
  asynchronousFactory: "asynchronous-factory",
  asynchronousServiceScope: "asynchronous-service-scope",
  invalidServiceScope: "invalid-service-scope",
  serviceScopeFailed: "service-scope-failed",
  factoryFailed: "factory-failed",
  cleanupFailed: "cleanup-failed",
} as const;

export type GraphExecutionHarnessErrorCode =
  (typeof GraphExecutionHarnessErrorCode)[keyof typeof GraphExecutionHarnessErrorCode];

export class GraphExecutionHarnessError extends Error {
  constructor(
    readonly code: GraphExecutionHarnessErrorCode,
    message: string,
    readonly failures: readonly GameModuleLifecycleFailure[] = [],
  ) {
    super(message);
    this.name = "GraphExecutionHarnessError";
  }
}

export type GameModuleGraphExecutionHarnessOptions = Readonly<{
  graph: ResolvedModuleGraph;
  registry: ProductionModuleExecutionRegistry &
    Partial<ContactPolicyRuntimeRegistry>;
  serviceHost?: GameModuleRuntimeServiceHost;
}>;

function isThenable(value: unknown): boolean {
  if (
    value === null ||
    (typeof value !== "object" && typeof value !== "function")
  ) {
    return false;
  }
  try {
    return typeof (value as { then?: unknown }).then === "function";
  } catch (error) {
    throw new GraphExecutionHarnessError(
      GraphExecutionHarnessErrorCode.asynchronousServiceScope,
      "execution boundary returned an unreadable thenable",
      Object.freeze([cleanupFailure("initialize", error)]),
    );
  }
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
}

function frozenClone<T>(value: T): Readonly<T> {
  return deepFreeze(structuredClone(value));
}

function validateServiceScope(
  value: unknown,
  instanceId: string,
): GameModuleScopedRuntimeServices {
  if (value === null || typeof value !== "object") {
    throw new GraphExecutionHarnessError(
      GraphExecutionHarnessErrorCode.invalidServiceScope,
      `runtime service host returned an invalid scope for ${instanceId}`,
    );
  }
  for (const key of [
    "clock",
    "input",
    "actors",
    "pools",
    "collisions",
    "assets",
    "viewport",
    "budgets",
    "observation",
  ]) {
    if (
      (value as Record<string, unknown>)[key] === null ||
      typeof (value as Record<string, unknown>)[key] !== "object"
    ) {
      throw new GraphExecutionHarnessError(
        GraphExecutionHarnessErrorCode.invalidServiceScope,
        `runtime service scope for ${instanceId} lacks ${key}`,
      );
    }
  }
  const methods: Readonly<Record<string, readonly string[]>> = {
    clock: ["nowMs", "schedule"],
    input: ["readDirection", "onPointer"],
    actors: ["read", "setVelocity", "setPosition"],
    pools: ["create", "activate", "recycle", "countActive"],
    collisions: ["watchOverlap"],
    assets: ["resolveRole"],
    viewport: ["clampX", "clampY"],
    budgets: ["limitFor", "observe"],
    observation: ["register"],
  };
  for (const [service, names] of Object.entries(methods)) {
    const record = (value as Record<string, unknown>)[service] as Record<
      string,
      unknown
    >;
    for (const name of names) {
      if (typeof record[name] !== "function") {
        throw new GraphExecutionHarnessError(
          GraphExecutionHarnessErrorCode.invalidServiceScope,
          `runtime service scope for ${instanceId} lacks ${service}.${name}`,
        );
      }
    }
  }
  const viewport = (value as Record<string, unknown>).viewport as Record<
    string,
    unknown
  >;
  if (
    typeof viewport.width !== "number" ||
    !Number.isFinite(viewport.width) ||
    typeof viewport.height !== "number" ||
    !Number.isFinite(viewport.height)
  ) {
    throw new GraphExecutionHarnessError(
      GraphExecutionHarnessErrorCode.invalidServiceScope,
      `runtime service scope for ${instanceId} has invalid viewport bounds`,
    );
  }
  return deepFreeze(value) as GameModuleScopedRuntimeServices;
}

function destroyServiceHost(serviceHost: GameModuleRuntimeServiceHost): void {
  const result = serviceHost.destroy();
  if (isThenable(result)) {
    throw new GraphExecutionHarnessError(
      GraphExecutionHarnessErrorCode.asynchronousServiceScope,
      "runtime service host destruction returned a thenable",
    );
  }
}

function cleanupFailure(
  stage: GameModuleLifecycleFailure["stage"],
  error: unknown,
  participantId?: string,
): GameModuleLifecycleFailure {
  return Object.freeze({
    stage,
    ...(participantId === undefined ? {} : { participantId }),
    error,
  });
}

function registrationFor(
  module: ResolvedGameModule,
  registry: ProductionModuleExecutionRegistry,
): ProductionModuleExecutionExports {
  const envelope = module.artifactIdentity?.envelopeSha256;
  if (envelope === undefined) {
    throw new GraphExecutionHarnessError(
      GraphExecutionHarnessErrorCode.registrationMismatch,
      `resolved module lacks artifact identity: ${module.instanceId}`,
    );
  }
  const registration = registry.findExactProduction(
    module.moduleId,
    module.version,
    envelope,
  );
  if (registration === undefined) {
    throw new GraphExecutionHarnessError(
      GraphExecutionHarnessErrorCode.registrationMismatch,
      `exact production registration is missing: ${module.instanceId}`,
    );
  }
  if (registration.executionExports === undefined) {
    throw new GraphExecutionHarnessError(
      GraphExecutionHarnessErrorCode.missingExecutionExport,
      `execution export is missing: ${module.instanceId}`,
    );
  }
  return registration.executionExports;
}

export class DeterministicGameModuleGraphExecutionHarness {
  readonly graph: ResolvedModuleGraph;
  readonly router: DeterministicModulePortRouter;
  readonly leases: DeterministicGameModuleLeaseLedger;
  readonly entities: DeterministicLogicalEntityDirectory;
  readonly lifecycle: DeterministicGameModuleLifecycleCoordinator;

  private constructor(
    graph: ResolvedModuleGraph,
    router: DeterministicModulePortRouter,
    leases: DeterministicGameModuleLeaseLedger,
    entities: DeterministicLogicalEntityDirectory,
    participants: readonly GameModuleLifecycleParticipant[],
    serviceHost: GameModuleRuntimeServiceHost,
    scopedInstanceIds: readonly string[],
  ) {
    this.graph = graph;
    this.router = router;
    this.leases = leases;
    this.entities = entities;
    this.lifecycle = new DeterministicGameModuleLifecycleCoordinator({
      graph,
      participants,
      boundaries: {
        beforeInitialize: () => router.beginInitialization(),
        beforeStart: () => router.activateSubscriptionsAndReplay(),
        afterStart: () => router.enterRunning(),
        beforeStop: () => {
          if (router.phase === "running" || router.phase === "starting") {
            router.stop();
          }
        },
        afterStop: () => {
          const failures: GameModuleLifecycleFailure[] = [];
          for (const instanceId of [...scopedInstanceIds].reverse()) {
            try {
              const result = serviceHost.revoke(instanceId, "start");
              if (isThenable(result)) {
                throw new GraphExecutionHarnessError(
                  GraphExecutionHarnessErrorCode.asynchronousServiceScope,
                  `runtime service start revocation returned a thenable for ${instanceId}`,
                );
              }
            } catch (error) {
              failures.push(cleanupFailure("after-stop", error, instanceId));
            }
          }
          try {
            leases.releaseAll({ scope: "start" });
            leases.assertNoLeaks({ scope: "start" });
          } catch (error) {
            failures.push(cleanupFailure("after-stop", error));
          }
          if (failures.length > 0) {
            throw new GraphExecutionHarnessError(
              GraphExecutionHarnessErrorCode.cleanupFailed,
              "start-scope cleanup failed",
              Object.freeze(failures),
            );
          }
        },
        afterDispose: () => {
          const failures: GameModuleLifecycleFailure[] = [];
          for (const instanceId of [...scopedInstanceIds].reverse()) {
            try {
              const result = serviceHost.revoke(instanceId, "instance");
              if (isThenable(result)) {
                throw new GraphExecutionHarnessError(
                  GraphExecutionHarnessErrorCode.asynchronousServiceScope,
                  `runtime service instance revocation returned a thenable for ${instanceId}`,
                );
              }
            } catch (error) {
              failures.push(cleanupFailure("after-dispose", error, instanceId));
            }
          }
          for (const instanceId of [...graph.constructionOrder].reverse()) {
            try {
              entities.releaseOwnedChannels(instanceId);
            } catch (error) {
              failures.push(cleanupFailure("after-dispose", error, instanceId));
            }
          }
          try {
            leases.releaseAll({ scope: "start" });
            leases.releaseAll({ scope: "instance" });
            leases.assertNoLeaks({ scope: "start" });
            leases.assertNoLeaks({ scope: "instance" });
          } catch (error) {
            failures.push(cleanupFailure("after-dispose", error));
          }
          if (failures.length > 0) {
            throw new GraphExecutionHarnessError(
              GraphExecutionHarnessErrorCode.cleanupFailed,
              "instance cleanup failed",
              Object.freeze(failures),
            );
          }
        },
      },
      destroyGraph: () => {
        const failures: GameModuleLifecycleFailure[] = [];
        for (const action of [
          () => router.destroy(),
          () => destroyServiceHost(serviceHost),
          () => leases.releaseAll({ scope: "graph" }),
          () => entities.destroy(),
          () => leases.assertNoLeaks(),
          () => leases.destroy(),
        ]) {
          try {
            action();
          } catch (error) {
            failures.push(cleanupFailure("destroy", error));
          }
        }
        if (failures.length > 0) {
          throw new GraphExecutionHarnessError(
            GraphExecutionHarnessErrorCode.cleanupFailed,
            "graph cleanup failed",
            Object.freeze(failures),
          );
        }
      },
    });
  }

  static create(
    options: GameModuleGraphExecutionHarnessOptions,
  ): DeterministicGameModuleGraphExecutionHarness {
    const { graph, registry } = options;
    const serviceHost =
      options.serviceHost ?? createUnavailableRuntimeServiceHost();
    if (!graph.productionInstantiationAllowed) {
      throw new GraphExecutionHarnessError(
        GraphExecutionHarnessErrorCode.graphNotProduction,
        "graph execution requires an entirely production-eligible graph",
      );
    }
    const exportsByInstance = new Map(
      graph.modules.map((module) => [
        module.instanceId,
        registrationFor(module, registry),
      ]),
    );
    let contactPolicyHost:
      DeterministicContactPolicyTransactionHost | undefined;
    if (graph.contactPolicyProfiles.length > 0) {
      if (typeof registry.findContactPolicyProfile !== "function") {
        throw new GraphExecutionHarnessError(
          GraphExecutionHarnessErrorCode.registrationMismatch,
          "contact-policy graph requires a runtime policy registry",
        );
      }
      contactPolicyHost = new DeterministicContactPolicyTransactionHost(
        graph,
        registry as ProductionModuleExecutionRegistry &
          ContactPolicyRuntimeRegistry,
      );
    }
    const subscriptionCounts = new Map<string, number>();
    for (const binding of graph.bindings) {
      subscriptionCounts.set(
        binding.to.instanceId,
        (subscriptionCounts.get(binding.to.instanceId) ?? 0) + 1,
      );
    }
    const infrastructureInstanceKeys = new Map<string, string[]>();
    for (const module of graph.modules) {
      infrastructureInstanceKeys.set(module.instanceId, []);
    }
    for (const channel of graph.entityChannels) {
      infrastructureInstanceKeys
        .get(channel.ownerInstanceId)!
        .push(`entity-channel.${channel.localChannelId}`);
    }
    for (const grant of graph.entityMutationGrants) {
      infrastructureInstanceKeys
        .get(grant.granteeInstanceId)!
        .push(`entity-grant.${grant.accessId}`);
    }
    for (const module of graph.modules) {
      const declaredModuleStartKeys = exportsByInstance.get(module.instanceId)!
        .runtimeLeaseKeys.start.length;
      const routerSubscriptions =
        subscriptionCounts.get(module.instanceId) ?? 0;
      if (
        declaredModuleStartKeys + routerSubscriptions >
        module.runtimeLeaseCeilings.startLeases
      ) {
        throw new GraphExecutionHarnessError(
          GraphExecutionHarnessErrorCode.registrationMismatch,
          `${module.instanceId} declares ${declaredModuleStartKeys} module start lease(s) plus ${routerSubscriptions} router subscription lease(s), above ceiling ${module.runtimeLeaseCeilings.startLeases}`,
        );
      }
      const declaredModuleInstanceKeys = exportsByInstance.get(
        module.instanceId,
      )!.runtimeLeaseKeys.instance.length;
      const moduleInfrastructureKeys = infrastructureInstanceKeys.get(
        module.instanceId,
      )!;
      const infrastructureInstances = moduleInfrastructureKeys.length;
      if (
        moduleInfrastructureKeys.some((key) =>
          exportsByInstance
            .get(module.instanceId)!
            .runtimeLeaseKeys.instance.includes(key),
        )
      ) {
        throw new GraphExecutionHarnessError(
          GraphExecutionHarnessErrorCode.registrationMismatch,
          `${module.instanceId} execution exports collide with host-owned entity lease keys`,
        );
      }
      if (
        declaredModuleInstanceKeys + infrastructureInstances >
        module.runtimeLeaseCeilings.instanceLeases
      ) {
        throw new GraphExecutionHarnessError(
          GraphExecutionHarnessErrorCode.registrationMismatch,
          `${module.instanceId} declares ${declaredModuleInstanceKeys} module instance lease(s) plus ${infrastructureInstances} entity infrastructure lease(s), above ceiling ${module.runtimeLeaseCeilings.instanceLeases}`,
        );
      }
    }
    const declarations: GameModuleLeaseOwnerDeclaration[] = graph.modules.map(
      (module) => ({
        ownerId: module.instanceId,
        ceilings: module.runtimeLeaseCeilings,
        keys: Object.freeze({
          ...exportsByInstance.get(module.instanceId)!.runtimeLeaseKeys,
          instance: Object.freeze([
            ...exportsByInstance.get(module.instanceId)!.runtimeLeaseKeys
              .instance,
            ...infrastructureInstanceKeys.get(module.instanceId)!,
          ]),
        }),
      }),
    );
    const leases = new DeterministicGameModuleLeaseLedger(declarations);
    for (const module of graph.constructionOrder) {
      for (const key of infrastructureInstanceKeys.get(module)!) {
        leases.acquire(module, "instance", key);
      }
    }
    const entities = new DeterministicLogicalEntityDirectory(
      graph.entityChannels.map((channel) => ({
        channelId: channel.channelId,
        ownerInstanceId: channel.ownerInstanceId,
        ownerActorId: channel.ownerActorId,
        entityRole: channel.entityRole,
        capacity: channel.capacity,
        readerInstanceIds: channel.readerInstanceIds,
      })),
      graph.entityMutationGrants.map((grant) => ({
        grantId: grant.grantId,
        granteeInstanceId: grant.granteeInstanceId,
        channelId: grant.channelId,
        operations: grant.operations,
        transferTargetActorIds: grant.transferRecipientActorIds,
      })),
    );
    const router = new DeterministicModulePortRouter(graph);
    const participants: GameModuleLifecycleParticipant[] = [];
    const scopedInstanceIds: string[] = [];

    try {
      for (const instanceId of graph.constructionOrder) {
        const module = graph.modules.find(
          (candidate) => candidate.instanceId === instanceId,
        )!;
        const execution = exportsByInstance.get(instanceId)!;
        if (execution.create === undefined) {
          participants.push(Object.freeze({ instanceId }));
          continue;
        }
        const scopeEvidence: GameModuleRuntimeServiceScopeEvidence =
          Object.freeze({
            instanceId,
            ownerId: module.ownerId,
            moduleId: module.moduleId,
            version: module.version,
            artifactEnvelopeSha256: module.artifactIdentity!.envelopeSha256,
            resourceGrant: module.resourceGrant,
            assetRoleIds: Object.freeze(
              graph.assetRoles
                .filter((role) =>
                  role.requiredByInstanceIds.includes(instanceId),
                )
                .map((role) => role.roleId)
                .sort(),
            ),
            ownedChannelIds: Object.freeze(
              graph.entityChannels
                .filter((channel) => channel.ownerInstanceId === instanceId)
                .map((channel) => channel.channelId),
            ),
            readableChannelIds: Object.freeze(
              graph.entityChannels
                .filter((channel) =>
                  channel.readerInstanceIds.includes(instanceId),
                )
                .map((channel) => channel.channelId),
            ),
            mutationGrantIds: Object.freeze(
              graph.entityMutationGrants
                .filter((grant) => grant.granteeInstanceId === instanceId)
                .map((grant) => grant.grantId),
            ),
            runtimeLeaseKeys: execution.runtimeLeaseKeys,
          });
        const scopeAuthority: GameModuleRuntimeServiceScopeAuthority =
          Object.freeze({
            acquireLease: (scope, key) =>
              leases.acquire(instanceId, scope, key),
            releaseLease: (lease) => leases.release(lease),
            activateEntity: (channelId, entityId, generation) =>
              entities.activate(instanceId, channelId, entityId, generation),
            readEntity: (reference) => entities.read(instanceId, reference),
            recycleEntity: (reference) =>
              entities.recycle(instanceId, reference),
            isGenerationActive: (channelId, entityId, generation) =>
              entities.isGenerationActive(channelId, entityId, generation),
          });
        let servicesValue: unknown;
        scopedInstanceIds.push(instanceId);
        try {
          servicesValue = serviceHost.createScope(
            scopeEvidence,
            scopeAuthority,
          );
        } catch (error) {
          throw new GraphExecutionHarnessError(
            GraphExecutionHarnessErrorCode.serviceScopeFailed,
            `runtime service scope creation threw for ${instanceId}`,
            Object.freeze([cleanupFailure("initialize", error, instanceId)]),
          );
        }
        if (isThenable(servicesValue)) {
          throw new GraphExecutionHarnessError(
            GraphExecutionHarnessErrorCode.asynchronousServiceScope,
            `runtime service scope creation returned a thenable for ${instanceId}`,
          );
        }
        const services = validateServiceScope(servicesValue, instanceId);
        const ports: GameModuleFactoryContext["ports"] = Object.freeze({
          declareHandler: (portId, handler) =>
            router.declareHandler(instanceId, portId, handler),
          publishState: (portId, payload) =>
            router.publishState(instanceId, portId, payload),
          emitEvent: (portId, payload) =>
            router.emitEvent(instanceId, portId, payload),
        });
        const scopedLeases: GameModuleFactoryContext["leases"] = Object.freeze({
          acquire: (scope, key) => leases.acquire(instanceId, scope, key),
          release: (lease) => leases.release(lease),
        });
        const scopedEntities: GameModuleFactoryContext["entities"] =
          Object.freeze({
            activate: (channelId, entityId, generation) =>
              entities.activate(instanceId, channelId, entityId, generation),
            read: (reference) => entities.read(instanceId, reference),
            recycle: (reference) => entities.recycle(instanceId, reference),
            mutate: (grantId, reference, operation, transferTargetActorId) =>
              entities.mutate(
                instanceId,
                grantId,
                reference,
                operation,
                transferTargetActorId,
              ),
            isGenerationActive: (channelId, entityId, generation) =>
              entities.isGenerationActive(channelId, entityId, generation),
          });
        const context: GameModuleFactoryContext = Object.freeze({
          identity: Object.freeze({
            instanceId,
            ownerId: module.ownerId,
            moduleId: module.moduleId,
            version: module.version,
            artifactEnvelopeSha256: module.artifactIdentity!.envelopeSha256,
          }),
          configuration: frozenClone(module.configuration),
          services,
          ports,
          contactPolicies: Object.freeze({
            execute: (candidate: unknown) => {
              if (contactPolicyHost === undefined) {
                throw new GraphExecutionHarnessError(
                  GraphExecutionHarnessErrorCode.registrationMismatch,
                  `no contact-policy profile is resolved for ${instanceId}`,
                );
              }
              return contactPolicyHost.execute(instanceId, candidate);
            },
          }),
          leases: scopedLeases,
          entities: scopedEntities,
        });
        let value: unknown;
        try {
          value = execution.create(context);
        } catch (error) {
          throw new GraphExecutionHarnessError(
            GraphExecutionHarnessErrorCode.factoryFailed,
            `factory threw for ${instanceId}`,
            Object.freeze([cleanupFailure("initialize", error, instanceId)]),
          );
        }
        if (isThenable(value)) {
          throw new GraphExecutionHarnessError(
            GraphExecutionHarnessErrorCode.asynchronousFactory,
            `factory returned a thenable for ${instanceId}`,
          );
        }
        participants.push(asLifecycleParticipant(instanceId, value));
      }
      return new DeterministicGameModuleGraphExecutionHarness(
        graph,
        router,
        leases,
        entities,
        Object.freeze(participants),
        serviceHost,
        Object.freeze(scopedInstanceIds),
      );
    } catch (primary) {
      const failures: GameModuleLifecycleFailure[] = [
        cleanupFailure("initialize", primary),
      ];
      for (const participant of [...participants].reverse()) {
        try {
          participant.dispose?.();
        } catch (error) {
          failures.push(
            cleanupFailure("dispose", error, participant.instanceId),
          );
        }
      }
      for (const instanceId of [...scopedInstanceIds].reverse()) {
        for (const scope of ["start", "instance"] as const) {
          try {
            const result = serviceHost.revoke(instanceId, scope);
            if (isThenable(result)) {
              throw new GraphExecutionHarnessError(
                GraphExecutionHarnessErrorCode.asynchronousServiceScope,
                `runtime service ${scope} revocation returned a thenable for ${instanceId}`,
              );
            }
          } catch (error) {
            failures.push(cleanupFailure("after-dispose", error, instanceId));
          }
        }
      }
      for (const instanceId of [...graph.constructionOrder].reverse()) {
        try {
          entities.releaseOwnedChannels(instanceId);
        } catch (error) {
          failures.push(cleanupFailure("after-dispose", error, instanceId));
        }
      }
      for (const [stage, action] of [
        ["destroy", () => router.destroy()],
        ["after-dispose", () => leases.releaseAll()],
        ["destroy", () => entities.destroy()],
        ["destroy", () => destroyServiceHost(serviceHost)],
        ["destroy", () => leases.destroy()],
      ] as const) {
        try {
          action();
        } catch (error) {
          failures.push(cleanupFailure(stage, error));
        }
      }
      throw new GraphExecutionHarnessError(
        GraphExecutionHarnessErrorCode.factoryFailed,
        `graph factory creation failed with ${failures.length} failure(s)`,
        Object.freeze(failures),
      );
    }
  }

  initialize(): void {
    this.lifecycle.initialize();
  }

  start(): void {
    this.lifecycle.start();
  }

  stop(): void {
    this.lifecycle.stop();
  }

  dispose(): void {
    this.lifecycle.dispose();
  }

  destroy(): void {
    this.lifecycle.destroy();
  }

  snapshot(): Readonly<{
    lifecyclePhase: string;
    router: ModulePortRouterSnapshot;
    leaseCounts: Readonly<{ start: number; instance: number; graph: number }>;
    activeEntities: number;
  }> {
    return Object.freeze({
      lifecyclePhase: this.lifecycle.phase,
      router: this.router.snapshot(),
      leaseCounts: this.leases.snapshot().counts,
      activeEntities: this.entities.snapshot().activeEntities.length,
    });
  }
}
