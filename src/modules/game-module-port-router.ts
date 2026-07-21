import { z } from "zod";

import { RuntimePayloadSchemas } from "./game-module-runtime-payloads.js";
import type {
  ResolvedModuleGraph,
  ResolvedPortBinding,
} from "./game-module-resolver.js";

export const ModulePortRouterErrorCode = {
  graphNotProduction: "graph-not-production",
  invalidPhase: "invalid-phase",
  unknownEndpoint: "unknown-endpoint",
  duplicateHandler: "duplicate-handler",
  missingHandler: "missing-handler",
  unsupportedPayload: "unsupported-payload",
  invalidPayload: "invalid-payload",
  nonMonotonicRevision: "non-monotonic-revision",
  nonMonotonicSequence: "non-monotonic-sequence",
  asynchronousHandler: "asynchronous-handler",
  dispatchDepthExceeded: "dispatch-depth-exceeded",
  leaseCeilingExceeded: "lease-ceiling-exceeded",
} as const;

export type ModulePortRouterErrorCode =
  (typeof ModulePortRouterErrorCode)[keyof typeof ModulePortRouterErrorCode];

export class ModulePortRouterError extends Error {
  constructor(
    readonly code: ModulePortRouterErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ModulePortRouterError";
  }
}

export type ModulePortRouterPhase =
  | "declaring"
  | "initializing"
  | "starting"
  | "running"
  | "stopped"
  | "destroyed";

export type PortDeliveryMetadata = Readonly<{
  fromInstanceId: string;
  fromPortId: string;
  toInstanceId: string;
  toPortId: string;
  payloadType: ResolvedPortBinding["payloadType"];
  delivery: "state" | "event";
  replay: boolean;
}>;

export type ModulePortHandler = (
  payload: Readonly<unknown>,
  metadata: PortDeliveryMetadata,
) => unknown;

export type ModulePortRouterSnapshot = Readonly<{
  phase: ModulePortRouterPhase;
  startLeases: number;
  graphLeases: number;
  retainedStatePorts: number;
  declaredHandlers: number;
}>;

type RetainedState = Readonly<{
  payload: Readonly<unknown>;
  revision: number;
}>;

function endpointKey(instanceId: string, portId: string): string {
  return `${instanceId}.${portId}`;
}

function fail(code: ModulePortRouterErrorCode, message: string): never {
  throw new ModulePortRouterError(code, message);
}

function isThenable(value: unknown): boolean {
  return (
    (typeof value === "object" || typeof value === "function") &&
    value !== null &&
    "then" in value &&
    typeof (value as { then?: unknown }).then === "function"
  );
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

function frozenClone(value: unknown): Readonly<unknown> {
  return deepFreeze(structuredClone(value));
}

export class DeterministicModulePortRouter {
  readonly #bindingsByOutput = new Map<
    string,
    readonly ResolvedPortBinding[]
  >();
  readonly #targetKeys = new Set<string>();
  readonly #handlers = new Map<string, ModulePortHandler>();
  readonly #retainedStates = new Map<string, RetainedState>();
  readonly #eventSequences = new Map<string, number>();
  readonly #constructionIndex = new Map<string, number>();
  readonly #maximumDispatchDepth: number;
  #phase: ModulePortRouterPhase = "declaring";
  #startLeases = 0;
  #graphLeases = 1;
  #dispatchDepth = 0;

  constructor(readonly graph: ResolvedModuleGraph) {
    if (!graph.productionInstantiationAllowed) {
      fail(
        ModulePortRouterErrorCode.graphNotProduction,
        "port router requires an entirely production-registered graph",
      );
    }
    graph.constructionOrder.forEach((instanceId, index) =>
      this.#constructionIndex.set(instanceId, index),
    );
    for (const binding of graph.bindings) {
      if (binding.delivery === "legacy-event") {
        fail(
          ModulePortRouterErrorCode.graphNotProduction,
          "production router cannot accept legacy fixture bindings",
        );
      }
      const outputKey = endpointKey(
        binding.from.instanceId,
        binding.from.portId,
      );
      const targetKey = endpointKey(binding.to.instanceId, binding.to.portId);
      const current = this.#bindingsByOutput.get(outputKey) ?? [];
      if (
        current.some(
          (candidate) =>
            candidate.payloadType !== binding.payloadType ||
            candidate.delivery !== binding.delivery,
        )
      ) {
        fail(
          ModulePortRouterErrorCode.unknownEndpoint,
          `resolved output ${outputKey} has inconsistent binding contracts`,
        );
      }
      this.#bindingsByOutput.set(
        outputKey,
        Object.freeze([...current, binding].sort(compareBindings)),
      );
      this.#targetKeys.add(targetKey);
    }
    for (const module of graph.modules) {
      const subscriptionCount = [...this.#targetKeys].filter((key) =>
        key.startsWith(`${module.instanceId}.`),
      ).length;
      if (subscriptionCount > module.runtimeLeaseCeilings.startLeases) {
        fail(
          ModulePortRouterErrorCode.leaseCeilingExceeded,
          `${module.instanceId} requires ${subscriptionCount} subscription leases but admits ${module.runtimeLeaseCeilings.startLeases}`,
        );
      }
    }
    this.#maximumDispatchDepth = Math.max(1, graph.bindings.length + 1);
  }

  get phase(): ModulePortRouterPhase {
    return this.#phase;
  }

  declareHandler(
    instanceId: string,
    portId: string,
    handler: ModulePortHandler,
  ): void {
    this.#requirePhase("declaring");
    const key = endpointKey(instanceId, portId);
    if (!this.#targetKeys.has(key)) {
      fail(
        ModulePortRouterErrorCode.unknownEndpoint,
        `cannot declare an unbound input handler: ${key}`,
      );
    }
    if (this.#handlers.has(key)) {
      fail(
        ModulePortRouterErrorCode.duplicateHandler,
        `handler already declared: ${key}`,
      );
    }
    this.#handlers.set(key, handler);
  }

  beginInitialization(): void {
    this.#requirePhase("declaring");
    for (const targetKey of this.#targetKeys) {
      if (!this.#handlers.has(targetKey)) {
        fail(
          ModulePortRouterErrorCode.missingHandler,
          `missing handler for bound input: ${targetKey}`,
        );
      }
    }
    this.#phase = "initializing";
  }

  publishState(instanceId: string, portId: string, payload: unknown): void {
    if (this.#phase !== "initializing" && this.#phase !== "running") {
      fail(
        ModulePortRouterErrorCode.invalidPhase,
        `state publication is forbidden while router is ${this.#phase}`,
      );
    }
    const key = endpointKey(instanceId, portId);
    const bindings = this.#requireOutput(key, "state");
    const parsed = this.#parsePayload(bindings[0]!, payload);
    const revision = this.#requireCounter(parsed, "revision");
    const previous = this.#retainedStates.get(key);
    if (previous !== undefined && revision <= previous.revision) {
      fail(
        ModulePortRouterErrorCode.nonMonotonicRevision,
        `${key} revision ${revision} is not greater than ${previous.revision}`,
      );
    }
    const frozenPayload = frozenClone(parsed);
    this.#retainedStates.set(
      key,
      Object.freeze({ payload: frozenPayload, revision }),
    );
    if (this.#phase === "running") {
      this.#deliver(bindings, frozenPayload, false);
    }
  }

  activateSubscriptionsAndReplay(): void {
    if (this.#phase !== "initializing" && this.#phase !== "stopped") {
      fail(
        ModulePortRouterErrorCode.invalidPhase,
        `subscriptions cannot activate while router is ${this.#phase}`,
      );
    }
    this.#phase = "starting";
    this.#startLeases = this.#targetKeys.size;
    const orderedStates = [...this.#retainedStates.entries()].sort(
      ([leftKey], [rightKey]) => this.#compareOutputKeys(leftKey, rightKey),
    );
    try {
      for (const [key, state] of orderedStates) {
        this.#deliver(this.#bindingsByOutput.get(key)!, state.payload, true);
      }
    } catch (error) {
      this.#startLeases = 0;
      this.#phase = "stopped";
      throw error;
    }
  }

  enterRunning(): void {
    this.#requirePhase("starting");
    this.#phase = "running";
  }

  emitEvent(instanceId: string, portId: string, payload: unknown): void {
    this.#requirePhase("running");
    const key = endpointKey(instanceId, portId);
    const bindings = this.#requireOutput(key, "event");
    const parsed = this.#parsePayload(bindings[0]!, payload);
    const sequence = this.#requireCounter(parsed, "sequence");
    const previous = this.#eventSequences.get(key);
    if (previous !== undefined && sequence <= previous) {
      fail(
        ModulePortRouterErrorCode.nonMonotonicSequence,
        `${key} sequence ${sequence} is not greater than ${previous}`,
      );
    }
    this.#eventSequences.set(key, sequence);
    this.#deliver(bindings, frozenClone(parsed), false);
  }

  stop(): void {
    if (this.#phase !== "running" && this.#phase !== "starting") {
      fail(
        ModulePortRouterErrorCode.invalidPhase,
        `router cannot stop while ${this.#phase}`,
      );
    }
    this.#phase = "stopped";
    this.#startLeases = 0;
  }

  destroy(): void {
    if (this.#phase === "running") {
      fail(
        ModulePortRouterErrorCode.invalidPhase,
        "running router must stop before destruction",
      );
    }
    if (this.#phase === "destroyed") {
      fail(
        ModulePortRouterErrorCode.invalidPhase,
        "router is already destroyed",
      );
    }
    this.#handlers.clear();
    this.#retainedStates.clear();
    this.#eventSequences.clear();
    this.#startLeases = 0;
    this.#graphLeases = 0;
    this.#phase = "destroyed";
  }

  snapshot(): ModulePortRouterSnapshot {
    return Object.freeze({
      phase: this.#phase,
      startLeases: this.#startLeases,
      graphLeases: this.#graphLeases,
      retainedStatePorts: this.#retainedStates.size,
      declaredHandlers: this.#handlers.size,
    });
  }

  #requirePhase(expected: ModulePortRouterPhase): void {
    if (this.#phase !== expected) {
      fail(
        ModulePortRouterErrorCode.invalidPhase,
        `router phase ${this.#phase}; expected ${expected}`,
      );
    }
  }

  #requireOutput(
    key: string,
    delivery: "state" | "event",
  ): readonly ResolvedPortBinding[] {
    const bindings = this.#bindingsByOutput.get(key);
    if (bindings === undefined || bindings.length === 0) {
      fail(
        ModulePortRouterErrorCode.unknownEndpoint,
        `cannot emit an unbound output: ${key}`,
      );
    }
    if (bindings[0]!.delivery !== delivery) {
      fail(
        ModulePortRouterErrorCode.invalidPhase,
        `${key} is ${bindings[0]!.delivery}, not ${delivery}`,
      );
    }
    return bindings;
  }

  #parsePayload(binding: ResolvedPortBinding, payload: unknown): unknown {
    const schema = (
      RuntimePayloadSchemas as Partial<Record<string, z.ZodType>>
    )[binding.payloadType];
    if (schema === undefined) {
      fail(
        ModulePortRouterErrorCode.unsupportedPayload,
        `no runtime schema registered for ${binding.payloadType}`,
      );
    }
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      fail(
        ModulePortRouterErrorCode.invalidPayload,
        `invalid ${binding.payloadType}: ${parsed.error.message}`,
      );
    }
    return parsed.data;
  }

  #requireCounter(payload: unknown, field: "revision" | "sequence"): number {
    if (
      payload === null ||
      typeof payload !== "object" ||
      !(field in payload) ||
      !Number.isSafeInteger((payload as Record<string, unknown>)[field]) ||
      ((payload as Record<string, number>)[field] ?? -1) < 0
    ) {
      fail(
        ModulePortRouterErrorCode.invalidPayload,
        `payload requires a non-negative safe-integer ${field}`,
      );
    }
    return (payload as Record<string, number>)[field]!;
  }

  #deliver(
    bindings: readonly ResolvedPortBinding[],
    payload: Readonly<unknown>,
    replay: boolean,
  ): void {
    this.#dispatchDepth += 1;
    if (this.#dispatchDepth > this.#maximumDispatchDepth) {
      this.#dispatchDepth -= 1;
      fail(
        ModulePortRouterErrorCode.dispatchDepthExceeded,
        "synchronous port dispatch exceeded resolved graph depth",
      );
    }
    try {
      for (const binding of bindings) {
        const targetKey = endpointKey(binding.to.instanceId, binding.to.portId);
        const handler = this.#handlers.get(targetKey);
        if (handler === undefined || this.#startLeases === 0) {
          fail(
            ModulePortRouterErrorCode.missingHandler,
            `inactive handler for bound input: ${targetKey}`,
          );
        }
        const result = handler(
          payload,
          Object.freeze({
            fromInstanceId: binding.from.instanceId,
            fromPortId: binding.from.portId,
            toInstanceId: binding.to.instanceId,
            toPortId: binding.to.portId,
            payloadType: binding.payloadType,
            delivery: binding.delivery as "state" | "event",
            replay,
          }),
        );
        if (isThenable(result)) {
          fail(
            ModulePortRouterErrorCode.asynchronousHandler,
            `port handler returned a thenable: ${targetKey}`,
          );
        }
      }
    } finally {
      this.#dispatchDepth -= 1;
    }
  }

  #compareOutputKeys(leftKey: string, rightKey: string): number {
    const leftSeparator = leftKey.indexOf(".");
    const rightSeparator = rightKey.indexOf(".");
    const leftInstance = leftKey.slice(0, leftSeparator);
    const leftPort = leftKey.slice(leftSeparator + 1);
    const rightInstance = rightKey.slice(0, rightSeparator);
    const rightPort = rightKey.slice(rightSeparator + 1);
    return (
      (this.#constructionIndex.get(leftInstance) ?? Number.MAX_SAFE_INTEGER) -
        (this.#constructionIndex.get(rightInstance) ??
          Number.MAX_SAFE_INTEGER) || leftPort.localeCompare(rightPort)
    );
  }
}

function compareBindings(
  left: ResolvedPortBinding,
  right: ResolvedPortBinding,
): number {
  return (
    left.to.instanceId.localeCompare(right.to.instanceId) ||
    left.to.portId.localeCompare(right.to.portId)
  );
}
