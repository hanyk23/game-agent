import {
  DeterministicGameModuleGraphExecutionHarness,
  type GameModuleGraphExecutionHarnessOptions,
} from "./game-module-graph-execution-harness.js";
import type {
  ResolvedModuleGraph,
  ResolvedModuleGraphV12,
  ResolvedModuleGraphV13,
} from "./game-module-resolver.js";
import type { ResolvedModuleGraphV14 } from "./game-module-resolver-v14.js";
import {
  GraphAuthorityFacadeHostV14,
  type GraphAuthorityAdaptersV14,
} from "./game-module-production-authority-v14.js";
import type { ContactPolicyRuntimeRegistry } from "./game-module-contact-policy-host.js";
import type { ProductionModuleExecutionRegistry } from "./game-module-runtime-factory.js";
import type { GameModuleRuntimeServiceHost } from "./game-module-runtime-services.js";
import {
  createPhaseGuardedRuntimeServicesV12,
  type GameModuleScopedRuntimeServicesV12,
} from "./game-module-runtime-services.js";
import type {
  GameModuleFactoryContextV12,
  GameModuleFactoryContextV13,
  GameModuleFactoryContextV13ServiceKey,
  GameModuleFactoryContextV14,
  GameModuleFactoryContextV14ServiceKey,
  OutcomeFrameTailCallableV14,
} from "./game-module-runtime-factory.js";
import type { ModulePortHandler } from "./game-module-port-router.js";
import { HostileAttackLineageRouterV1 } from "./game-module-hostile-attack-router.js";
import { BrowserGameModuleRuntimeCatalogV12 } from "./game-module-runtime-catalog.js";
import {
  BrowserGameModuleRuntimeCatalogV13,
  BrowserGameModuleRuntimeCatalogV14,
} from "./game-module-runtime-catalog.js";
import {
  DeterministicGameModuleRuntimeV12,
  GraphTransitionGuard,
  type GameModuleLifecycleParticipantV12,
  type RuntimeFactoryControlsV12,
  type RuntimeHostFrameHooksV14,
} from "./game-module-runtime-abi-v12.js";
import { RuntimePayloadSchemas } from "./game-module-runtime-payloads.js";
import { ProjectileDeliveryAdmissionHostV1 } from "./game-module-projectile-delivery-admission-host.js";

function assertExactKeys(
  value: unknown,
  expected: readonly string[],
  label: string,
): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object")
    throw new Error(`${label} must be an object`);
  const actual = Object.keys(value).sort();
  if (JSON.stringify(actual) !== JSON.stringify([...expected].sort()))
    throw new Error(`${label} exposes unexpected authority`);
}

export function validateFactoryContextV12(
  context: GameModuleFactoryContextV12,
): GameModuleFactoryContextV12 {
  assertExactKeys(
    context,
    ["identity", "configuration", "services", "ports", "clock", "assets"],
    "Manifest 1.2 factory context",
  );
  assertExactKeys(
    context.identity,
    ["instanceId", "ownerId", "moduleId", "version", "artifactEnvelopeSha256"],
    "factory identity",
  );
  assertExactKeys(
    context.services,
    [
      "viewport",
      "actors",
      "input",
      "overlaps",
      "channels",
      "observation",
      "contact",
    ],
    "factory services",
  );
  assertExactKeys(
    context.ports,
    ["declareHandler", "publishState", "emitEvent"],
    "Manifest 1.2 factory ports",
  );
  assertExactKeys(context.clock, ["nowMs", "schedule"], "factory clock");
  assertExactKeys(
    context.assets,
    ["requireTexture", "optionalTexture"],
    "factory assets",
  );
  return Object.freeze(context);
}

export function validateFactoryContextV13(
  context: GameModuleFactoryContextV13,
  grantedServices: readonly GameModuleFactoryContextV13ServiceKey[],
): GameModuleFactoryContextV13 {
  assertExactKeys(
    context,
    ["identity", "configuration", "services", "ports", "clock", "assets"],
    "Manifest 1.3 factory context",
  );
  assertExactKeys(
    context.identity,
    ["instanceId", "ownerId", "moduleId", "version", "artifactEnvelopeSha256"],
    "factory identity",
  );
  const baseServices = [
    "viewport",
    "actors",
    "input",
    "overlaps",
    "channels",
    "observation",
    "contact",
  ];
  assertExactKeys(
    context.services,
    [...baseServices, ...new Set(grantedServices)],
    "Manifest 1.3 factory services",
  );
  assertExactKeys(
    context.ports,
    ["declareHandler", "declareAddressedHandler", "publishState", "emitEvent"],
    "Manifest 1.3 factory ports",
  );
  assertExactKeys(context.clock, ["nowMs", "schedule"], "factory clock");
  assertExactKeys(
    context.assets,
    ["requireTexture", "optionalTexture"],
    "factory assets",
  );
  return Object.freeze(context);
}

export function validateFactoryContextV14(
  context: GameModuleFactoryContextV14,
  grantedServices: readonly GameModuleFactoryContextV14ServiceKey[],
): GameModuleFactoryContextV14 {
  assertExactKeys(
    context,
    ["identity", "configuration", "services", "ports", "clock", "assets"],
    "Manifest 1.4 factory context",
  );
  assertExactKeys(
    context.identity,
    ["instanceId", "ownerId", "moduleId", "version", "artifactEnvelopeSha256"],
    "factory identity",
  );
  const baseServices = [
    "viewport",
    "actors",
    "input",
    "overlaps",
    "channels",
    "observation",
    "contact",
  ];
  assertExactKeys(
    context.services,
    [...baseServices, ...new Set(grantedServices)],
    "Manifest 1.4 factory services",
  );
  assertExactKeys(
    context.ports,
    ["declareHandler", "declareAddressedHandler", "publishState", "emitEvent"],
    "Manifest 1.4 factory ports",
  );
  assertExactKeys(context.clock, ["nowMs", "schedule"], "factory clock");
  assertExactKeys(
    context.assets,
    ["requireTexture", "optionalTexture"],
    "factory assets",
  );
  return Object.freeze(context);
}

export type GameModuleProductionInstantiationOptions = Readonly<{
  graph: ResolvedModuleGraph;
  registry: ProductionModuleExecutionRegistry &
    Partial<ContactPolicyRuntimeRegistry>;
  serviceHost: GameModuleRuntimeServiceHost;
}>;

/**
 * Production entry point. Unlike the pure harness, it requires an explicit
 * scoped runtime-service host and accepts no caller-supplied entity authority.
 */
export class DeterministicGameModuleProductionInstantiator {
  static create(
    options: GameModuleProductionInstantiationOptions,
  ): DeterministicGameModuleGraphExecutionHarness {
    const harnessOptions: GameModuleGraphExecutionHarnessOptions = {
      graph: options.graph,
      registry: options.registry,
      serviceHost: options.serviceHost,
    };
    return DeterministicGameModuleGraphExecutionHarness.create(harnessOptions);
  }
}

export type GameModuleProductionInstantiationV12Options = Readonly<{
  graph: ResolvedModuleGraphV12;
  catalog: BrowserGameModuleRuntimeCatalogV12;
  createContext(
    module: ResolvedModuleGraphV12["modules"][number],
    clock: GameModuleFactoryContextV12["clock"],
  ): GameModuleFactoryContextV12;
}>;

export type GameModuleProductionInstantiationV13Options = Readonly<{
  graph: ResolvedModuleGraphV13;
  catalog: BrowserGameModuleRuntimeCatalogV13;
  createContextV12(
    module: ResolvedModuleGraphV13["modules"][number],
    clock: GameModuleFactoryContextV12["clock"],
  ): GameModuleFactoryContextV12;
  createContextV13(
    module: ResolvedModuleGraphV13["modules"][number],
    clock: GameModuleFactoryContextV13["clock"],
  ): GameModuleFactoryContextV13;
  registerAddressedHandler(
    routeId: string,
    handler: ModulePortHandler,
  ): void | (() => void);
}>;

export type GameModuleFactoryContextV14Base = Readonly<
  Omit<GameModuleFactoryContextV14, "services"> & {
    services: GameModuleScopedRuntimeServicesV12;
  }
>;

export type ProductionModuleV14View = Readonly<
  Omit<
    ResolvedModuleGraphV13["modules"][number],
    "manifestSchemaVersion" | "factoryContextVersion" | "runtimePorts"
  > & {
    manifestSchemaVersion: "1.2.0" | "1.3.0" | "1.4.0";
    factoryContextVersion: "1.2.0" | "1.3.0" | "1.4.0";
    runtimePorts: Readonly<{
      inputPorts: readonly Readonly<{
        id: string;
        payloadType: string;
        delivery: "state" | "event";
        required: boolean;
      }>[];
      outputPorts: readonly Readonly<{
        id: string;
        payloadType: string;
        delivery: "state" | "event";
      }>[];
    }>;
  }
>;

export type GameModuleProductionInstantiationV14Options = Readonly<{
  graph: ResolvedModuleGraphV14;
  catalog: BrowserGameModuleRuntimeCatalogV14;
  createContextV12(
    module: ProductionModuleV14View,
    clock: GameModuleFactoryContextV12["clock"],
  ): GameModuleFactoryContextV12;
  createContextV13(
    module: ProductionModuleV14View,
    clock: GameModuleFactoryContextV13["clock"],
  ): GameModuleFactoryContextV13;
  createContextV14Base(
    module: ProductionModuleV14View,
    clock: GameModuleFactoryContextV14["clock"],
  ): GameModuleFactoryContextV14Base;
  createAuthorityAdapters(
    guard: GraphTransitionGuard,
  ): GraphAuthorityAdaptersV14;
  registerAddressedHandler(
    routeId: string,
    handler: ModulePortHandler,
  ): void | (() => void);
}>;

export type ResolvedPickupEffectTransformV13 = Readonly<{
  plan: ResolvedModuleGraphV13["pickupEffectPlans"][number];
  transform: (...args: readonly unknown[]) => unknown;
}>;

/** Resolves a planner only through the graph-selected transform catalog entry. */
export function resolvePickupEffectTransformV13(
  graph: ResolvedModuleGraphV13,
  catalog: BrowserGameModuleRuntimeCatalogV13,
  commitInstanceId: string,
): ResolvedPickupEffectTransformV13 {
  const plans = graph.pickupEffectPlans.filter(
    (plan) => plan.commitInstanceId === commitInstanceId,
  );
  if (plans.length !== 1)
    throw new Error(
      `prepared effect commit requires one resolved plan: ${commitInstanceId}`,
    );
  const plan = plans[0]!;
  const transformModule = graph.modules.find(
    (module) => module.instanceId === plan.transformInstanceId,
  );
  if (
    transformModule === undefined ||
    transformModule.manifestSchemaVersion !== "1.3.0" ||
    transformModule.factoryContextVersion !== "1.3.0"
  )
    throw new Error(
      `pickup effect transform is not an admitted Manifest 1.3 module: ${plan.transformInstanceId}`,
    );
  const entry = catalog.findForGraph(graph, plan.transformInstanceId);
  if (entry.exportKind !== "pickup-effect-plan-transform-v1")
    throw new Error(
      `pickup effect transform export kind mismatch: ${plan.transformInstanceId}`,
    );
  return Object.freeze({ plan, transform: entry.executable });
}

function payloadSchema(payloadType: string) {
  const schema =
    RuntimePayloadSchemas[payloadType as keyof typeof RuntimePayloadSchemas];
  if (schema === undefined)
    throw new Error(`unsupported Manifest 1.2 runtime payload: ${payloadType}`);
  return schema;
}

const OutcomeConditionProviderProposalSchema = RuntimePayloadSchemas[
  "outcome-condition-v1"
].pick({
  candidate: true,
  met: true,
  reason: true,
  observedAtMs: true,
  evidenceId: true,
});

function createResolvedPortsV12(
  graph: ResolvedModuleGraphV12,
  module: ResolvedModuleGraphV12["modules"][number],
  controls: RuntimeFactoryControlsV12,
): GameModuleFactoryContextV12["ports"] {
  const registration = graph.bindings.filter(
    (binding) => binding.to.instanceId === module.instanceId,
  );
  const handlers = new Set<string>();
  return Object.freeze({
    declareHandler: (portId: string, handler: ModulePortHandler) => {
      const manifestPort = module.runtimePorts?.inputPorts.find(
        (port) => port.id === portId,
      );
      if (manifestPort === undefined)
        throw new Error(
          `undeclared input port: ${module.instanceId}.${portId}`,
        );
      const bound = registration.filter(
        (binding) => binding.to.portId === portId,
      );
      if (manifestPort.required && bound.length === 0)
        throw new Error(
          `unbound required input port: ${module.instanceId}.${portId}`,
        );
      if (handlers.has(portId))
        throw new Error(
          `duplicate input handler: ${module.instanceId}.${portId}`,
        );
      handlers.add(portId);
      for (const binding of bound) {
        const key = `${binding.from.instanceId}.${binding.from.portId}`;
        const metadata = (replay: boolean) =>
          Object.freeze({
            fromInstanceId: binding.from.instanceId,
            fromPortId: binding.from.portId,
            toInstanceId: binding.to.instanceId,
            toPortId: binding.to.portId,
            payloadType: binding.payloadType,
            delivery: binding.delivery as "state" | "event",
            replay,
          });
        if (binding.delivery === "state")
          controls.registerStateHandler(key, (payload, replay) =>
            handler(
              payloadSchema(binding.payloadType).parse(payload),
              metadata(replay),
            ),
          );
        else if (binding.delivery === "event")
          controls.registerEventHandler(key, (payload) =>
            handler(
              payloadSchema(binding.payloadType).parse(payload),
              metadata(false),
            ),
          );
        else throw new Error(`legacy delivery cannot enter Graph 1.2: ${key}`);
      }
    },
    publishState: (portId: string, payload: unknown) => {
      const output = module.runtimePorts?.outputPorts.find(
        (port) => port.id === portId && port.delivery === "state",
      );
      if (output === undefined)
        throw new Error(
          `undeclared state output: ${module.instanceId}.${portId}`,
        );
      controls.publishState(
        `${module.instanceId}.${portId}`,
        payloadSchema(output.payloadType).parse(payload),
      );
    },
    emitEvent: (portId: string, payload: unknown) => {
      const output = module.runtimePorts?.outputPorts.find(
        (port) => port.id === portId && port.delivery === "event",
      );
      if (output === undefined)
        throw new Error(
          `undeclared event output: ${module.instanceId}.${portId}`,
        );
      controls.emitEvent(
        `${module.instanceId}.${portId}`,
        payloadSchema(output.payloadType).parse(payload),
      );
    },
  });
}

function createResolvedPortsV13(
  graph: ResolvedModuleGraphV13,
  module: ResolvedModuleGraphV13["modules"][number],
  controls: RuntimeFactoryControlsV12,
  registerAddressedHandler: GameModuleProductionInstantiationV13Options["registerAddressedHandler"],
): GameModuleFactoryContextV13["ports"] {
  const registration = graph.bindings.filter(
    (binding) => binding.to.instanceId === module.instanceId,
  );
  const handlers = new Set<string>();
  return Object.freeze({
    declareHandler: (portId: string, handler: ModulePortHandler) => {
      const manifestPort = module.runtimePorts.inputPorts.find(
        (port) => port.id === portId,
      );
      if (manifestPort === undefined)
        throw new Error(
          `undeclared input port: ${module.instanceId}.${portId}`,
        );
      const bound = registration.filter(
        (binding) => binding.to.portId === portId,
      );
      if (manifestPort.required && bound.length === 0)
        throw new Error(
          `unbound required input port: ${module.instanceId}.${portId}`,
        );
      if (handlers.has(portId))
        throw new Error(
          `duplicate input handler: ${module.instanceId}.${portId}`,
        );
      handlers.add(portId);
      for (const binding of bound) {
        const key = `${binding.from.instanceId}.${binding.from.portId}`;
        const metadata = (replay: boolean) =>
          Object.freeze({
            fromInstanceId: binding.from.instanceId,
            fromPortId: binding.from.portId,
            toInstanceId: binding.to.instanceId,
            toPortId: binding.to.portId,
            payloadType: binding.payloadType,
            delivery: binding.delivery as "state" | "event",
            replay,
          });
        if (binding.delivery === "state")
          controls.registerStateHandler(key, (payload, replay) =>
            handler(
              Object.freeze(payloadSchema(binding.payloadType).parse(payload)),
              metadata(replay),
            ),
          );
        else if (binding.delivery === "event")
          controls.registerEventHandler(key, (payload) =>
            handler(
              Object.freeze(payloadSchema(binding.payloadType).parse(payload)),
              metadata(false),
            ),
          );
        else throw new Error(`legacy delivery cannot enter Graph 1.3: ${key}`);
      }
    },
    declareAddressedHandler: (fieldId, handler) => {
      if (!module.runtimeAuthorities.modifierTargetFieldIds?.includes(fieldId))
        throw new Error(`undeclared addressed modifier target: ${fieldId}`);
      const routes = graph.effectApplicationRoutes.filter(
        (route) =>
          route.fieldId === fieldId &&
          route.targetInstanceId === module.instanceId,
      );
      for (const route of routes)
        registerAddressedHandler(route.routeId, handler);
    },
    publishState: (portId, payload) => {
      const output = module.runtimePorts.outputPorts.find(
        (port) => port.id === portId && port.delivery === "state",
      );
      if (output === undefined)
        throw new Error(
          `undeclared state output: ${module.instanceId}.${portId}`,
        );
      controls.publishState(
        `${module.instanceId}.${portId}`,
        payloadSchema(output.payloadType).parse(payload),
      );
    },
    emitEvent: (portId, payload) => {
      const output = module.runtimePorts.outputPorts.find(
        (port) => port.id === portId && port.delivery === "event",
      );
      if (output === undefined)
        throw new Error(
          `undeclared event output: ${module.instanceId}.${portId}`,
        );
      controls.emitEvent(
        `${module.instanceId}.${portId}`,
        payloadSchema(output.payloadType).parse(payload),
      );
    },
  });
}

/** ABI26-READY-001: the only Manifest 1.2 browser instantiation entry point. */
export class DeterministicGameModuleProductionInstantiatorV12 {
  static create(
    options: GameModuleProductionInstantiationV12Options,
  ): DeterministicGameModuleRuntimeV12 {
    if (options.graph.executionReadiness.status !== "ready")
      throw new Error("blocked Graph 1.2 cannot instantiate");
    const participantFactories: Array<
      Readonly<{
        module: ResolvedModuleGraphV12["modules"][number];
        executable: (...args: readonly unknown[]) => unknown;
      }>
    > = [];
    for (const instanceId of options.graph.constructionOrder) {
      const module = options.graph.modules.find(
        (candidate) => candidate.instanceId === instanceId,
      );
      if (module === undefined)
        throw new Error(`missing resolved module ${instanceId}`);
      const entry = options.catalog.findForGraph(options.graph, instanceId);
      if (entry.exportKind === "lifecycle-create-v1")
        participantFactories.push(
          Object.freeze({ module, executable: entry.executable }),
        );
    }
    return new DeterministicGameModuleRuntimeV12({
      readiness: options.graph.executionReadiness,
      constructionOrder: options.graph.constructionOrder,
      updateInstanceIds: options.graph.modules
        .filter((module) => {
          if (
            module.manifestSchemaVersion !== "1.2.0" ||
            module.runtimeContract === undefined
          ) {
            throw new Error(
              `ready graph contains a non-1.2 module: ${module.instanceId}`,
            );
          }
          return module.runtimeContract.update !== null;
        })
        .map((module) => module.instanceId),
      exactTimerGrants: Object.fromEntries(
        options.graph.modules.map((module) => [
          module.instanceId,
          module.resourceGrant.timers,
        ]),
      ),
      createParticipants: (controls) =>
        options.graph.constructionOrder.map((instanceId) => {
          const factory = participantFactories.find(
            (candidate) => candidate.module.instanceId === instanceId,
          );
          if (factory === undefined) return Object.freeze({ instanceId });
          const clock = Object.freeze({
            // Runtime payload timestamps are integer milliseconds even when the
            // browser frame clock advances by a finite fractional delta.
            nowMs: () => Math.floor(controls.nowMs()),
            schedule: (schedule: Parameters<typeof controls.schedule>[1]) =>
              controls.schedule(instanceId, schedule),
          });
          const supplied = options.createContext(factory.module, clock);
          const authorities = factory.module.runtimeAuthorities;
          if (authorities === undefined) {
            throw new Error(
              `ready graph lacks runtime authorities for ${instanceId}`,
            );
          }
          const readableChannels = new Set(
            options.graph.entityChannels
              .filter((channel) =>
                channel.readerInstanceIds.includes(instanceId),
              )
              .map((channel) => channel.channelId),
          );
          const activeOwnedEntities: Array<
            Readonly<{ channelId: string; entity: unknown }>
          > = [];
          const cleanupOwnedEntities = (): void => {
            const failures: unknown[] = [];
            for (const owned of activeOwnedEntities.splice(0).reverse()) {
              try {
                supplied.services.channels.recycle(
                  owned.channelId,
                  owned.entity,
                );
              } catch (error) {
                failures.push(error);
              }
            }
            if (failures.length > 0)
              throw new AggregateError(
                failures,
                `owned entity cleanup failed for ${instanceId}`,
              );
          };
          const declaredServices = Object.freeze({
            ...supplied.services,
            input: Object.freeze({
              register: (id: string, handler: (input: unknown) => unknown) => {
                if (!authorities.inputRegistrationIds.includes(id))
                  throw new Error(`undeclared input registration: ${id}`);
                return supplied.services.input.register(id, (input) =>
                  controls.injectExternalEvent(() => handler(input)),
                );
              },
            }),
            overlaps: Object.freeze({
              register: (
                id: string,
                handler: (candidate: unknown) => unknown,
              ) => {
                if (authorities.overlapRuleId !== id)
                  throw new Error(`undeclared overlap rule: ${id}`);
                return supplied.services.overlaps.register(id, (candidate) =>
                  controls.injectExternalEvent(() => handler(candidate)),
                );
              },
            }),
            channels: Object.freeze({
              activate: (id: string, entity: unknown) => {
                if (!authorities.ownedChannelIds.includes(id))
                  throw new Error(`undeclared owned channel: ${id}`);
                const activated = supplied.services.channels.activate(
                  id,
                  entity,
                );
                activeOwnedEntities.push(
                  Object.freeze({ channelId: id, entity: activated }),
                );
                return activated;
              },
              recycle: (id: string, entity: unknown) => {
                if (!authorities.ownedChannelIds.includes(id))
                  throw new Error(`undeclared owned channel: ${id}`);
                supplied.services.channels.recycle(id, entity);
                const reference = entity as Partial<{
                  entityId: string;
                  generation: number;
                }>;
                const index = activeOwnedEntities.findIndex((owned) => {
                  if (owned.channelId !== id) return false;
                  if (owned.entity === entity) return true;
                  const activeReference = owned.entity as Partial<{
                    entityId: string;
                    generation: number;
                  }>;
                  return (
                    typeof reference.entityId === "string" &&
                    reference.entityId === activeReference.entityId &&
                    reference.generation === activeReference.generation
                  );
                });
                if (index >= 0) activeOwnedEntities.splice(index, 1);
              },
              read: (id: string) => {
                if (!readableChannels.has(id))
                  throw new Error(`undeclared channel reader: ${id}`);
                return supplied.services.channels.read(id);
              },
            }),
            observation: Object.freeze({
              register: (id: string, reader: () => unknown) => {
                if (!authorities.observationReaderIds.includes(id))
                  throw new Error(`undeclared observation reader: ${id}`);
                return supplied.services.observation.register(id, reader);
              },
            }),
          });
          const value = factory.executable(
            validateFactoryContextV12(
              Object.freeze({
                ...supplied,
                clock,
                ports: createResolvedPortsV12(
                  options.graph,
                  factory.module,
                  controls,
                ),
                services: createPhaseGuardedRuntimeServicesV12(
                  declaredServices,
                  (operation) => controls.assertService(operation),
                ),
              }),
            ),
          );
          if (value === null || typeof value !== "object")
            throw new Error(
              `factory returned invalid participant for ${instanceId}`,
            );
          const source = value as Record<string, unknown>;
          for (const hook of [
            "initialize",
            "start",
            "update",
            "stop",
            "dispose",
          ] as const)
            if (
              source[hook] !== undefined &&
              typeof source[hook] !== "function"
            )
              throw new Error(`invalid ${hook} hook for ${instanceId}`);
          const participant = Object.freeze({
            instanceId,
            ...(source.initialize === undefined
              ? {}
              : { initialize: source.initialize as () => unknown }),
            ...(source.start === undefined
              ? {}
              : { start: source.start as () => unknown }),
            ...(source.update === undefined
              ? {}
              : { update: source.update as (deltaMs: number) => unknown }),
            ...(source.stop === undefined
              ? authorities.ownsPlayerLocomotion
                ? {
                    stop: () =>
                      supplied.services.actors.writeOwnerMotion(
                        Object.freeze({ x: 0, y: 0 }),
                      ),
                  }
                : {}
              : {
                  stop: () => {
                    const result = (source.stop as () => unknown)();
                    cleanupOwnedEntities();
                    if (authorities.ownsPlayerLocomotion)
                      supplied.services.actors.writeOwnerMotion(
                        Object.freeze({ x: 0, y: 0 }),
                      );
                    return result;
                  },
                }),
            ...(source.dispose === undefined
              ? activeOwnedEntities.length === 0
                ? {}
                : { dispose: cleanupOwnedEntities }
              : {
                  dispose: () => {
                    const result = (source.dispose as () => unknown)();
                    cleanupOwnedEntities();
                    return result;
                  },
                }),
          });
          return participant;
        }),
    });
  }
}

type ProductionGraphView = Readonly<
  Omit<ResolvedModuleGraphV13, "graphVersion" | "modules" | "bindings"> & {
    graphVersion: "1.3.0" | "1.4.0";
    modules: readonly ProductionModuleV14View[];
    bindings: readonly Readonly<{
      from: Readonly<{ instanceId: string; portId: string }>;
      to: Readonly<{ instanceId: string; portId: string }>;
      payloadType: string;
      delivery: "state" | "event";
    }>[];
  }
>;

type ProductionRuntimeOptions = Readonly<{
  graph: ProductionGraphView;
  findEntry(instanceId: string): Readonly<{
    exportKind:
      | "lifecycle-create-v1"
      | "contact-policy-transform-v1"
      | "pickup-effect-plan-transform-v1";
    executable: (...args: readonly unknown[]) => unknown;
  }>;
  createContext(
    version: ProductionModuleV14View["factoryContextVersion"],
    module: ProductionModuleV14View,
    clock: GameModuleFactoryContextV12["clock"],
  ):
    | GameModuleFactoryContextV12
    | GameModuleFactoryContextV13
    | GameModuleFactoryContextV14Base;
  registerAddressedHandler(
    routeId: string,
    handler: ModulePortHandler,
  ): void | (() => void);
  authorityHost?: GraphAuthorityFacadeHostV14;
  guard?: GraphTransitionGuard;
}>;

function createProductionRuntime(
  options: ProductionRuntimeOptions,
): DeterministicGameModuleRuntimeV12 {
  const graph = options.graph;
  if (graph.executionReadiness.status !== "ready")
    throw new Error(`blocked Graph ${graph.graphVersion} cannot instantiate`);
  const entries = new Map(
    graph.modules.map((module) => [
      module.instanceId,
      options.findEntry(module.instanceId),
    ]),
  );
  let outcomeFrameTail: OutcomeFrameTailCallableV14 | undefined;
  const outcomeAuthority =
    graph.graphVersion === "1.4.0"
      ? (graph as unknown as ResolvedModuleGraphV14).outcomeAuthority
      : null;
  const hostFrameHooks: RuntimeHostFrameHooksV14 | undefined =
    outcomeAuthority === null
      ? undefined
      : options.authorityHost!.createOutcomeFrameHooks(
          outcomeAuthority.coordinatorInstanceId,
          () => outcomeFrameTail,
        );
  return new DeterministicGameModuleRuntimeV12({
    readiness: graph.executionReadiness,
    constructionOrder: graph.constructionOrder,
    updateInstanceIds: graph.modules
      .filter((module) => module.runtimeContract.update !== null)
      .map((module) => module.instanceId),
    exactTimerGrants: Object.fromEntries(
      graph.modules.map((module) => [
        module.instanceId,
        module.resourceGrant.timers,
      ]),
    ),
    ...(hostFrameHooks === undefined ? {} : { hostFrameHooks }),
    ...(options.guard === undefined ? {} : { guard: options.guard }),
    createParticipants: (controls) => {
      const graphV14ForRouters =
        graph.graphVersion === "1.4.0"
          ? (graph as unknown as ResolvedModuleGraphV14)
          : undefined;
      const hostileRouters = new Map(
        graphV14ForRouters?.hostileAttackChannels.map((channel) => [
          channel.lineageId,
          new HostileAttackLineageRouterV1({
            sourceInstanceId: channel.sourceInstanceId,
            targetingInstanceId: channel.targetingInstanceId,
            deliveryInstanceId: channel.deliveryInstanceId,
            rootChannelId: channel.rootChannelId,
            attackChannelId: channel.attackChannelId,
            projectileChannelId: channel.projectileChannelId,
            maximumPending:
              graphV14ForRouters.actorRootChannels.find(
                (root) => root.rootChannelId === channel.rootChannelId,
              )?.capacity ?? 1,
            readActiveSource: (rootChannelId, actorId, actorGeneration) =>
              options.authorityHost!.readHostileActiveSource(
                channel.lineageId,
                rootChannelId,
                actorId,
                actorGeneration,
              ),
          }),
        ]) ?? [],
      );
      const participants = graph.constructionOrder.map((instanceId) => {
        const module = graph.modules.find(
          (candidate) => candidate.instanceId === instanceId,
        )!;
        const entry = entries.get(instanceId)!;
        if (entry.exportKind !== "lifecycle-create-v1")
          return Object.freeze({ instanceId });
        const clock = Object.freeze({
          nowMs: () => Math.floor(controls.nowMs()),
          schedule: (schedule: Parameters<typeof controls.schedule>[1]) =>
            controls.schedule(instanceId, schedule),
        });
        const supplied = options.createContext(
          module.factoryContextVersion,
          module,
          clock,
        );
        const authorities = module.runtimeAuthorities;
        const readableChannels = new Set(
          graph.entityChannels
            .filter((channel) => channel.readerInstanceIds.includes(instanceId))
            .map((channel) => channel.channelId),
        );
        const activeOwnedEntities: Array<
          Readonly<{ channelId: string; entity: unknown }>
        > = [];
        const cleanupOwnedEntities = (): void => {
          const failures: unknown[] = [];
          for (const owned of activeOwnedEntities.splice(0).reverse()) {
            try {
              supplied.services.channels.recycle(owned.channelId, owned.entity);
            } catch (error) {
              failures.push(error);
            }
          }
          if (failures.length > 0)
            throw new AggregateError(
              failures,
              `owned entity cleanup failed for ${instanceId}`,
            );
        };
        const declaredBase = Object.freeze({
          viewport: supplied.services.viewport,
          actors: supplied.services.actors,
          input: Object.freeze({
            register: (id: string, handler: (input: unknown) => unknown) => {
              if (!authorities.inputRegistrationIds.includes(id))
                throw new Error(`undeclared input registration: ${id}`);
              return supplied.services.input.register(id, (input) =>
                controls.injectExternalEvent(() => handler(input)),
              );
            },
          }),
          overlaps: Object.freeze({
            register: (
              id: string,
              handler: (candidate: unknown) => unknown,
            ) => {
              if (authorities.overlapRuleId !== id)
                throw new Error(`undeclared overlap rule: ${id}`);
              return supplied.services.overlaps.register(id, (candidate) =>
                controls.injectExternalEvent(() => handler(candidate)),
              );
            },
          }),
          channels: Object.freeze({
            activate: (id: string, entity: unknown) => {
              if (!authorities.ownedChannelIds.includes(id))
                throw new Error(`undeclared owned channel: ${id}`);
              const activated = supplied.services.channels.activate(id, entity);
              activeOwnedEntities.push(
                Object.freeze({ channelId: id, entity: activated }),
              );
              return activated;
            },
            recycle: (id: string, entity: unknown) => {
              if (!authorities.ownedChannelIds.includes(id))
                throw new Error(`undeclared owned channel: ${id}`);
              supplied.services.channels.recycle(id, entity);
              const reference = entity as Partial<{
                entityId: string;
                generation: number;
              }>;
              const index = activeOwnedEntities.findIndex((owned) => {
                if (owned.channelId !== id) return false;
                if (owned.entity === entity) return true;
                const activeReference = owned.entity as Partial<{
                  entityId: string;
                  generation: number;
                }>;
                return (
                  typeof reference.entityId === "string" &&
                  reference.entityId === activeReference.entityId &&
                  reference.generation === activeReference.generation
                );
              });
              if (index >= 0) activeOwnedEntities.splice(index, 1);
            },
            read: (id: string) => {
              if (!readableChannels.has(id))
                throw new Error(`undeclared channel reader: ${id}`);
              return supplied.services.channels.read(id);
            },
          }),
          observation: Object.freeze({
            register: (id: string, reader: () => unknown) => {
              if (!authorities.observationReaderIds.includes(id))
                throw new Error(`undeclared observation reader: ${id}`);
              return supplied.services.observation.register(id, reader);
            },
          }),
          contact: supplied.services.contact,
        });
        let projectileDeliveryHost:
          ProjectileDeliveryAdmissionHostV1<unknown> | undefined;
        const deliveryChannel = graph.attackChannels.some(
          (channel) => channel.deliveryInstanceId === instanceId,
        )
          ? graph.entityChannels.find(
              (channel) =>
                channel.ownerInstanceId === instanceId &&
                channel.entityRole === "projectile",
            )
          : undefined;
        if (deliveryChannel !== undefined) {
          const configuration = module.configuration as Record<string, unknown>;
          const baseCount = configuration.baseCount;
          const maximumCountBonus = configuration.maximumCountBonus;
          const maxActive = configuration.maxActive;
          const maximumAcceptedRequestsPerSecond =
            configuration.maximumAcceptedRequestsPerSecond;
          if (
            !Number.isSafeInteger(baseCount) ||
            !Number.isSafeInteger(maximumCountBonus) ||
            !Number.isSafeInteger(maxActive) ||
            !Number.isSafeInteger(maximumAcceptedRequestsPerSecond)
          )
            throw new Error(
              `invalid resolved projectile delivery configuration: ${instanceId}`,
            );
          projectileDeliveryHost =
            new ProjectileDeliveryAdmissionHostV1<unknown>({
              instanceId,
              maxActive: maxActive as number,
              maximumEffectiveCount:
                (baseCount as number) + (maximumCountBonus as number),
              maximumAcceptedRequestsPerSecond:
                maximumAcceptedRequestsPerSecond as number,
              nowMs: () => Math.floor(controls.nowMs()),
              activate: (entityId, generation, plan) =>
                declaredBase.channels.activate(
                  deliveryChannel.localChannelId,
                  Object.freeze({
                    ...(plan as Record<string, unknown>),
                    entityId,
                    generation,
                  }),
                ) as never,
              recycle: (reference) =>
                declaredBase.channels.recycle(
                  deliveryChannel.localChannelId,
                  reference,
                ),
            });
        }
        const guardedBase = createPhaseGuardedRuntimeServicesV12(
          declaredBase,
          (operation) => controls.assertService(operation),
        );
        const graphV14 =
          graph.graphVersion === "1.4.0"
            ? (graph as unknown as ResolvedModuleGraphV14)
            : undefined;
        const isScoreLedger =
          graphV14?.scoringAuthority?.ledgerInstanceId === instanceId;
        let scoreLedgerInitialized = false;
        const scoreInputPortIds = new Set(
          isScoreLedger
            ? module.runtimePorts.inputPorts
                .filter(
                  (port) =>
                    port.payloadType === "score-transaction-v1" &&
                    port.delivery === "event",
                )
                .map((port) => port.id)
            : [],
        );
        const scoreOutputPortIds = new Set(
          isScoreLedger
            ? module.runtimePorts.outputPorts
                .filter(
                  (port) =>
                    port.payloadType === "score-state-v1" &&
                    port.delivery === "state",
                )
                .map((port) => port.id)
            : [],
        );
        const outcomeCandidate =
          outcomeAuthority?.winConditionInstanceId === instanceId
            ? "win"
            : outcomeAuthority?.lossConditionInstanceId === instanceId
              ? "loss"
              : undefined;
        const outcomeOutputPortIds = new Set(
          module.runtimePorts.outputPorts
            .filter(
              (port) =>
                port.payloadType === "outcome-condition-v1" &&
                port.delivery === "state",
            )
            .map((port) => port.id),
        );
        if (isScoreLedger) {
          if (scoreInputPortIds.size !== 1 || scoreOutputPortIds.size !== 1)
            throw new Error(
              `authoritative score ledger ports are not unique: ${instanceId}`,
            );
          const ledgerPortId = [...scoreInputPortIds][0]!;
          const outputPortId = [...scoreOutputPortIds][0]!;
          for (const binding of graph.bindings.filter(
            (candidate) =>
              candidate.to.instanceId === instanceId &&
              candidate.to.portId === ledgerPortId &&
              candidate.payloadType === "score-transaction-v1" &&
              candidate.delivery === "event",
          )) {
            const key = `${binding.from.instanceId}.${binding.from.portId}`;
            controls.registerEventHandler(key, (payload) => {
              const transaction = Object.freeze(
                payloadSchema("score-transaction-v1").parse(payload),
              );
              const scoreState = options.authorityHost!.applyScoreTransaction({
                ledgerInstanceId: instanceId,
                sourceInstanceId: binding.from.instanceId,
                sourcePortId: binding.from.portId,
                ledgerPortId,
                transaction,
              });
              controls.publishState(
                `${instanceId}.${outputPortId}`,
                payloadSchema("score-state-v1").parse(scoreState),
              );
            });
          }
        }
        const addressedDeclarations = new Map<string, ModulePortHandler>();
        const resolvedPorts = createResolvedPortsV13(
          graph as unknown as ResolvedModuleGraphV13,
          module as unknown as ResolvedModuleGraphV13["modules"][number],
          controls,
          (routeId, handler) => {
            if (addressedDeclarations.has(routeId))
              throw new Error(`duplicate addressed effect handler: ${routeId}`);
            addressedDeclarations.set(routeId, handler);
          },
        );
        const hostileChannel = graphV14?.hostileAttackChannels.find(
          (channel) =>
            channel.sourceInstanceId === instanceId ||
            channel.targetingInstanceId === instanceId ||
            channel.deliveryInstanceId === instanceId,
        );
        const hostilePorts =
          hostileChannel === undefined
            ? resolvedPorts
            : Object.freeze({
                ...resolvedPorts,
                emitEvent: (portId: string, payload: unknown) => {
                  const router = hostileRouters.get(hostileChannel.lineageId)!;
                  if (
                    instanceId === hostileChannel.sourceInstanceId &&
                    portId ===
                      module.runtimePorts.outputPorts.find(
                        (port) => port.payloadType === "attack-request-v3",
                      )?.id
                  ) {
                    const request = Object.freeze(
                      payloadSchema("attack-request-v3").parse(payload),
                    );
                    return resolvedPorts.emitEvent(
                      portId,
                      router.acceptRequest(instanceId, request as never),
                    );
                  }
                  if (
                    instanceId === hostileChannel.targetingInstanceId &&
                    portId ===
                      module.runtimePorts.outputPorts.find(
                        (port) => port.payloadType === "targeted-attack-v1",
                      )?.id
                  ) {
                    const proposal = payload as Readonly<{
                      request: unknown;
                      direction?: unknown;
                      targetPosition?: unknown;
                    }>;
                    const request = payloadSchema("attack-request-v3").parse(
                      proposal.request,
                    );
                    const keys = Object.keys(proposal).sort().join();
                    if (keys === "direction,request") {
                      const direction = RuntimePayloadSchemas[
                        "targeted-attack-v1"
                      ].shape.direction.parse(proposal.direction);
                      return resolvedPorts.emitEvent(
                        portId,
                        router.target(instanceId, request as never, direction),
                      );
                    }
                    if (keys !== "request,targetPosition")
                      throw new Error(
                        "hostile targeting proposal shape is invalid",
                      );
                    const targetPosition = RuntimePayloadSchemas[
                      "targeted-attack-v1"
                    ].shape.sourcePosition.parse(proposal.targetPosition);
                    return resolvedPorts.emitEvent(
                      portId,
                      router.targetPosition(
                        instanceId,
                        request as never,
                        targetPosition,
                      ),
                    );
                  }
                  if (
                    instanceId === hostileChannel.deliveryInstanceId &&
                    portId ===
                      module.runtimePorts.outputPorts.find(
                        (port) => port.payloadType === "emission-v2",
                      )?.id
                  ) {
                    const proposal = payload as Readonly<{
                      targeted: unknown;
                      projectile: unknown | null;
                      final: unknown;
                    }>;
                    const targeted = payloadSchema("targeted-attack-v1").parse(
                      proposal.targeted,
                    );
                    if (typeof proposal.final !== "boolean")
                      throw new Error(
                        "hostile delivery proposal final flag is invalid",
                      );
                    if (proposal.projectile === null) {
                      if (!proposal.final)
                        throw new Error(
                          "empty hostile delivery proposal must be final",
                        );
                      router.completeDelivery(instanceId, targeted as never);
                      return undefined;
                    }
                    const projectile = RuntimePayloadSchemas["emission-v2"]
                      .pick({
                        projectileEntityId: true,
                        projectileChannelId: true,
                        projectileGeneration: true,
                        position: true,
                        velocity: true,
                        damage: true,
                      })
                      .parse(proposal.projectile);
                    return resolvedPorts.emitEvent(
                      portId,
                      router.emit(
                        instanceId,
                        targeted as never,
                        projectile,
                        proposal.final,
                      ),
                    );
                  }
                  return resolvedPorts.emitEvent(portId, payload);
                },
              });
        const ports =
          isScoreLedger || outcomeOutputPortIds.size > 0
            ? Object.freeze({
                ...hostilePorts,
                declareHandler: (
                  portId: string,
                  handler: ModulePortHandler,
                ) => {
                  if (scoreInputPortIds.has(portId))
                    throw new Error(
                      "score transaction input is owned by the Graph 1.4 host",
                    );
                  return hostilePorts.declareHandler(portId, handler);
                },
                publishState: (portId: string, payload: unknown) => {
                  if (scoreOutputPortIds.has(portId))
                    throw new Error(
                      "score state publication is owned by the Graph 1.4 host",
                    );
                  if (outcomeOutputPortIds.has(portId)) {
                    if (outcomeCandidate === undefined)
                      throw new Error(
                        `non-selected outcome provider cannot publish: ${instanceId}`,
                      );
                    const proposal = Object.freeze(
                      OutcomeConditionProviderProposalSchema.parse(payload),
                    );
                    if (proposal.candidate !== outcomeCandidate)
                      throw new Error(
                        "outcome provider publication authority mismatch",
                      );
                    const state =
                      options.authorityHost!.publishOutcomeCondition({
                        providerInstanceId: instanceId,
                        sourcePortId: portId,
                        proposal,
                      });
                    controls.publishState(
                      `${instanceId}.${portId}`,
                      Object.freeze(
                        payloadSchema("outcome-condition-v1").parse(state),
                      ),
                    );
                    return;
                  }
                  return hostilePorts.publishState(portId, payload);
                },
              })
            : hostilePorts;
        const context =
          module.factoryContextVersion === "1.2.0"
            ? validateFactoryContextV12(
                Object.freeze({
                  ...supplied,
                  services: guardedBase,
                  ports: Object.freeze({
                    declareHandler: ports.declareHandler,
                    publishState: ports.publishState,
                    emitEvent: ports.emitEvent,
                  }),
                  clock,
                }) as GameModuleFactoryContextV12,
              )
            : (() => {
                const suppliedV13 = supplied as GameModuleFactoryContextV13;
                const grantedServices: GameModuleFactoryContextV14ServiceKey[] =
                  [];
                const extensions: Record<string, unknown> = {};
                if (
                  module.factoryContextVersion === "1.3.0" &&
                  graph.actorSnapshotGrants.some(
                    (grant) => grant.instanceId === instanceId,
                  )
                ) {
                  grantedServices.push("actorSnapshots");
                  if (suppliedV13.services.actorSnapshots === undefined)
                    throw new Error(
                      `missing actor snapshot service for ${instanceId}`,
                    );
                  extensions.actorSnapshots = Object.freeze({
                    read: (readId: string) => {
                      controls.assertService("read");
                      const grant = graph.actorSnapshotGrants.find(
                        (candidate) =>
                          candidate.instanceId === instanceId &&
                          candidate.descriptor.readId === readId,
                      );
                      if (grant === undefined)
                        throw new Error(
                          `undeclared actor snapshot read: ${readId}`,
                        );
                      return suppliedV13.services.actorSnapshots!.read(
                        grant.grantId,
                      );
                    },
                  });
                }
                if (
                  module.factoryContextVersion === "1.3.0" &&
                  graph.entityChannelReadGrants.some(
                    (grant) => grant.instanceId === instanceId,
                  )
                ) {
                  grantedServices.push("entityChannelSnapshots");
                  if (suppliedV13.services.entityChannelSnapshots === undefined)
                    throw new Error(
                      `missing entity channel snapshot service for ${instanceId}`,
                    );
                  extensions.entityChannelSnapshots = Object.freeze({
                    read: (readId: string) => {
                      controls.assertService("read");
                      const grant = graph.entityChannelReadGrants.find(
                        (candidate) =>
                          candidate.instanceId === instanceId &&
                          candidate.descriptor.readId === readId,
                      );
                      if (grant === undefined)
                        throw new Error(
                          `undeclared entity channel snapshot read: ${readId}`,
                        );
                      return suppliedV13.services.entityChannelSnapshots!.read(
                        grant.grantId,
                      );
                    },
                  });
                }
                if (
                  module.factoryContextVersion === "1.3.0" &&
                  graph.pickupEffectPlans.some(
                    (plan) => plan.commitInstanceId === instanceId,
                  )
                ) {
                  grantedServices.push("preparedEffects");
                  if (suppliedV13.services.preparedEffects === undefined)
                    throw new Error(
                      `missing prepared effect service for ${instanceId}`,
                    );
                  extensions.preparedEffects = Object.freeze({
                    prepare: (sourceKey: string, template: unknown) => {
                      controls.assertService("contact-commit");
                      return suppliedV13.services.preparedEffects!.prepare(
                        sourceKey,
                        template,
                      );
                    },
                  });
                }
                if (projectileDeliveryHost !== undefined) {
                  grantedServices.push("projectileDelivery");
                  extensions.projectileDelivery = Object.freeze({
                    admit: (
                      requestSequence: number,
                      plan: readonly unknown[],
                    ) => {
                      controls.assertService("activate-entity");
                      return projectileDeliveryHost!.admit(
                        requestSequence,
                        plan,
                      );
                    },
                    recycle: (reference: never) => {
                      controls.assertService("recycle-entity");
                      projectileDeliveryHost!.recycle(reference);
                    },
                    observe: () => projectileDeliveryHost!.observe(),
                  });
                }
                if (module.factoryContextVersion === "1.3.0")
                  return validateFactoryContextV13(
                    Object.freeze({
                      ...suppliedV13,
                      services: Object.freeze({
                        ...guardedBase,
                        ...extensions,
                      }),
                      ports,
                      clock,
                    }),
                    grantedServices as GameModuleFactoryContextV13ServiceKey[],
                  );
                const authority =
                  options.authorityHost!.servicesForInstance(instanceId);
                const guardedAuthority: Record<string, unknown> = {};
                if (authority.actorSnapshots !== undefined) {
                  grantedServices.push("actorSnapshots");
                  guardedAuthority.actorSnapshots = Object.freeze({
                    read: (readId: string) => {
                      controls.assertService("read");
                      return authority.actorSnapshots!.read(readId);
                    },
                  });
                }
                if (authority.entityChannelSnapshots !== undefined) {
                  grantedServices.push("entityChannelSnapshots");
                  guardedAuthority.entityChannelSnapshots = Object.freeze({
                    read: (readId: string) => {
                      controls.assertService("read");
                      return authority.entityChannelSnapshots!.read(readId);
                    },
                  });
                }
                if (authority.preparedEffects !== undefined) {
                  grantedServices.push("preparedEffects");
                  guardedAuthority.preparedEffects = Object.freeze({
                    prepare: (sourceKey: string, template: unknown) => {
                      controls.assertService("contact-commit");
                      return authority.preparedEffects!.prepare(
                        sourceKey,
                        template,
                      );
                    },
                  });
                }
                if (authority.actorRoots !== undefined) {
                  grantedServices.push("actorRoots");
                  guardedAuthority.actorRoots = Object.freeze({
                    activate: (grantId: string, request: Readonly<unknown>) => {
                      controls.assertService("activate-entity");
                      return authority.actorRoots!.activate(grantId, request);
                    },
                    deactivate: (
                      grantId: string,
                      request: Readonly<unknown>,
                    ) => {
                      controls.assertService("recycle-entity");
                      return authority.actorRoots!.deactivate(grantId, request);
                    },
                  });
                }
                if (authority.actorRootSnapshots !== undefined) {
                  grantedServices.push("actorRootSnapshots");
                  guardedAuthority.actorRootSnapshots = Object.freeze({
                    read: (grantId: string) => {
                      controls.assertService("read");
                      return authority.actorRootSnapshots!.read(grantId);
                    },
                  });
                }
                if (authority.actorRootMutation !== undefined) {
                  grantedServices.push("actorRootMutation");
                  guardedAuthority.actorRootMutation = Object.freeze({
                    deactivate: (
                      grantId: string,
                      request: Readonly<unknown>,
                    ) => {
                      controls.assertService("contact-commit");
                      return authority.actorRootMutation!.deactivate(
                        grantId,
                        request,
                      );
                    },
                  });
                }
                if (authority.hostileProjectileDelivery !== undefined) {
                  grantedServices.push("hostileProjectileDelivery");
                  guardedAuthority.hostileProjectileDelivery = Object.freeze({
                    admit: (grantId: string, request: Readonly<unknown>) => {
                      controls.assertService("activate-entity");
                      return authority.hostileProjectileDelivery!.admit(
                        grantId,
                        request,
                      );
                    },
                    recycle: (grantId: string, request: Readonly<unknown>) => {
                      controls.assertService("recycle-entity");
                      return authority.hostileProjectileDelivery!.recycle(
                        grantId,
                        request,
                      );
                    },
                    observe: (grantId: string) => {
                      controls.assertService("read");
                      return authority.hostileProjectileDelivery!.observe(
                        grantId,
                      );
                    },
                  });
                }
                if (authority.outcomeCommit !== undefined) {
                  grantedServices.push("outcomeCommit");
                  guardedAuthority.outcomeCommit = authority.outcomeCommit;
                }
                return validateFactoryContextV14(
                  Object.freeze({
                    ...supplied,
                    services: Object.freeze({
                      ...guardedBase,
                      ...extensions,
                      ...guardedAuthority,
                    }),
                    ports,
                    clock,
                  }) as GameModuleFactoryContextV14,
                  grantedServices,
                );
              })();
        const value = entry.executable(context);
        if (value === null || typeof value !== "object")
          throw new Error(
            `factory returned invalid participant for ${instanceId}`,
          );
        const source = value as Record<string, unknown>;
        for (const hook of [
          "initialize",
          "start",
          "update",
          "stop",
          "dispose",
        ] as const)
          if (source[hook] !== undefined && typeof source[hook] !== "function")
            throw new Error(`invalid ${hook} hook for ${instanceId}`);
        const candidateFrameTail = source.arbitrateOutcomeFrameTail;
        const isOutcomeCoordinator =
          outcomeAuthority?.coordinatorInstanceId === instanceId;
        if (isOutcomeCoordinator) {
          if (
            module.factoryContextVersion !== "1.4.0" ||
            typeof candidateFrameTail !== "function" ||
            outcomeFrameTail !== undefined
          )
            throw new Error(
              `invalid resolved outcome frame-tail callable: ${instanceId}`,
            );
          outcomeFrameTail = candidateFrameTail as OutcomeFrameTailCallableV14;
        } else if (candidateFrameTail !== undefined) {
          throw new Error(
            `undeclared outcome frame-tail callable: ${instanceId}`,
          );
        }
        let addressedReleases: Array<() => void> = [];
        const activateAddressedHandlers = (): void => {
          if (addressedReleases.length !== 0)
            throw new Error(
              `addressed effect handlers already active for ${instanceId}`,
            );
          try {
            for (const [routeId, handler] of [
              ...addressedDeclarations.entries(),
            ].sort(([left], [right]) => left.localeCompare(right))) {
              const release = options.registerAddressedHandler(
                routeId,
                handler,
              );
              addressedReleases.push(
                typeof release === "function" ? release : () => undefined,
              );
            }
          } catch (error) {
            for (const release of addressedReleases.splice(0).reverse()) {
              try {
                release();
              } catch {
                // Registration unwind is best-effort here; the primary
                // activation failure remains the lifecycle failure.
              }
            }
            throw error;
          }
        };
        const releaseAddressedHandlers = (): void => {
          const failures: unknown[] = [];
          for (const release of addressedReleases.splice(0).reverse()) {
            try {
              release();
            } catch (error) {
              failures.push(error);
            }
          }
          if (failures.length > 0)
            throw new AggregateError(
              failures,
              `addressed effect handler cleanup failed for ${instanceId}`,
            );
        };
        const disposeScoreLedger = (): void => {
          if (!scoreLedgerInitialized) return;
          options.authorityHost!.disposeScoreLedger();
          scoreLedgerInitialized = false;
        };
        const initializeParticipant = (): unknown => {
          if (isScoreLedger) {
            options.authorityHost!.initializeScoreLedger(() =>
              Math.floor(controls.nowMs()),
            );
            scoreLedgerInitialized = true;
          }
          try {
            const result =
              source.initialize === undefined
                ? undefined
                : (source.initialize as () => unknown)();
            if (
              result !== null &&
              (typeof result === "object" || typeof result === "function") &&
              typeof (result as { then?: unknown }).then === "function"
            )
              throw new Error(
                `initialize returned a thenable for ${instanceId}`,
              );
            return result;
          } catch (primary) {
            try {
              disposeScoreLedger();
            } catch (cleanupFailure) {
              throw new AggregateError(
                [primary, cleanupFailure],
                `initialize cleanup failed for ${instanceId}`,
              );
            }
            throw primary;
          }
        };
        const finishWithCleanup = (
          operation: (() => unknown) | undefined,
          includeMotionReset: boolean,
          includeScoreLedgerDispose: boolean,
        ): unknown => {
          const failures: unknown[] = [];
          let result: unknown;
          try {
            result = operation?.();
          } catch (error) {
            failures.push(error);
          }
          for (const cleanup of [
            releaseAddressedHandlers,
            ...(projectileDeliveryHost === undefined
              ? []
              : [() => projectileDeliveryHost!.stop()]),
            cleanupOwnedEntities,
            ...(includeMotionReset && authorities.ownsPlayerLocomotion
              ? [
                  () =>
                    supplied.services.actors.writeOwnerMotion(
                      Object.freeze({ x: 0, y: 0 }),
                    ),
                ]
              : []),
            ...(includeScoreLedgerDispose && isScoreLedger
              ? [disposeScoreLedger]
              : []),
            ...(includeScoreLedgerDispose &&
            hostileChannel?.deliveryInstanceId === instanceId
              ? [() => hostileRouters.get(hostileChannel.lineageId)!.dispose()]
              : []),
          ]) {
            try {
              cleanup();
            } catch (error) {
              failures.push(error);
            }
          }
          if (failures.length === 1) throw failures[0];
          if (failures.length > 1)
            throw new AggregateError(
              failures,
              `lifecycle cleanup failed for ${instanceId}`,
            );
          return result;
        };
        return Object.freeze({
          instanceId,
          ...(source.initialize === undefined && !isScoreLedger
            ? {}
            : { initialize: initializeParticipant }),
          start: () => {
            activateAddressedHandlers();
            try {
              return source.start === undefined
                ? undefined
                : (source.start as () => unknown)();
            } catch (error) {
              try {
                releaseAddressedHandlers();
              } catch {
                // Runtime preserves the factory start failure as primary.
              }
              throw error;
            }
          },
          ...(source.update === undefined
            ? {}
            : { update: source.update as (deltaMs: number) => unknown }),
          stop: () =>
            finishWithCleanup(
              source.stop as (() => unknown) | undefined,
              true,
              false,
            ),
          dispose: () =>
            finishWithCleanup(
              source.dispose as (() => unknown) | undefined,
              false,
              true,
            ),
        });
      });
      if (outcomeAuthority !== null && outcomeFrameTail === undefined)
        throw new Error("missing resolved outcome frame-tail callable");
      return participants;
    },
  });
}

/** ADR 0027 mixed-version entry point; factory context is selected per manifest. */
export class DeterministicGameModuleProductionInstantiatorV13 {
  static create(
    options: GameModuleProductionInstantiationV13Options,
  ): DeterministicGameModuleRuntimeV12 {
    if (options.graph.graphVersion !== "1.3.0")
      throw new Error("Graph 1.3 instantiator requires Graph 1.3");
    return createProductionRuntime({
      graph: options.graph as unknown as ProductionGraphView,
      findEntry: (instanceId) =>
        options.catalog.findForGraph(options.graph, instanceId),
      createContext: (version, module, clock) => {
        if (version === "1.2.0")
          return options.createContextV12(module as never, clock);
        if (version === "1.3.0")
          return options.createContextV13(module as never, clock);
        throw new Error("Graph 1.3 cannot select a Manifest 1.4 context");
      },
      registerAddressedHandler: options.registerAddressedHandler,
    });
  }
}

/** ADR 0028 exact mixed-version entry point with host-owned V1.4 authority. */
export class DeterministicGameModuleProductionInstantiatorV14 {
  static create(
    options: GameModuleProductionInstantiationV14Options,
  ): DeterministicGameModuleRuntimeV12 {
    if (options.graph.graphVersion !== "1.4.0")
      throw new Error("Graph 1.4 instantiator requires Graph 1.4");
    const guard = new GraphTransitionGuard();
    const authorityHost = new GraphAuthorityFacadeHostV14(
      options.graph,
      options.createAuthorityAdapters(guard),
    );
    return createProductionRuntime({
      graph: options.graph as unknown as ProductionGraphView,
      findEntry: (instanceId) =>
        options.catalog.findForGraph(options.graph, instanceId),
      createContext: (version, module, clock) => {
        if (version === "1.2.0") return options.createContextV12(module, clock);
        if (version === "1.3.0") return options.createContextV13(module, clock);
        if (version === "1.4.0")
          return options.createContextV14Base(module, clock);
        throw new Error(`unsupported factory context version: ${version}`);
      },
      registerAddressedHandler: options.registerAddressedHandler,
      authorityHost,
      guard,
    });
  }
}
