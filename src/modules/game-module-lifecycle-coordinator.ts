export const GameModuleLifecycleErrorCode = {
  invalidDefinition: "invalid-definition",
  invalidPhase: "invalid-phase",
  asynchronousHook: "asynchronous-hook",
  hookFailed: "hook-failed",
  transitionFailed: "transition-failed",
} as const;

export type GameModuleLifecycleErrorCode =
  (typeof GameModuleLifecycleErrorCode)[keyof typeof GameModuleLifecycleErrorCode];

export type GameModuleLifecyclePhase =
  | "created"
  | "initialized"
  | "running"
  | "stopped"
  | "failed"
  | "disposed"
  | "destroyed";

export type GameModuleLifecycleTransition =
  "initialize" | "start" | "stop" | "dispose" | "destroy";

export type GameModuleLifecycleStage =
  | GameModuleLifecycleTransition
  | "before-initialize"
  | "after-initialize"
  | "before-start"
  | "after-start"
  | "before-stop"
  | "after-stop"
  | "after-dispose"
  | "after-destroy";

export type GameModuleLifecycleFailure = Readonly<{
  stage: GameModuleLifecycleStage;
  participantId?: string;
  error: unknown;
}>;

export class GameModuleLifecycleError extends Error {
  constructor(
    readonly code: GameModuleLifecycleErrorCode,
    message: string,
    readonly transition?: GameModuleLifecycleTransition,
    readonly failures: readonly GameModuleLifecycleFailure[] = [],
  ) {
    super(message);
    this.name = "GameModuleLifecycleError";
  }
}

export type GameModuleLifecycleParticipant = Readonly<{
  instanceId: string;
  initialize?: () => unknown;
  start?: () => unknown;
  stop?: () => unknown;
  dispose?: () => unknown;
}>;

export type GameModuleLifecycleBoundaryContext = Readonly<{
  transition: GameModuleLifecycleTransition;
  phase: GameModuleLifecyclePhase;
  attemptedParticipantIds: readonly string[];
}>;

export type GameModuleLifecycleBoundaries = Readonly<{
  beforeInitialize?: (context: GameModuleLifecycleBoundaryContext) => unknown;
  afterInitialize?: (context: GameModuleLifecycleBoundaryContext) => unknown;
  beforeStart?: (context: GameModuleLifecycleBoundaryContext) => unknown;
  afterStart?: (context: GameModuleLifecycleBoundaryContext) => unknown;
  beforeStop?: (context: GameModuleLifecycleBoundaryContext) => unknown;
  afterStop?: (context: GameModuleLifecycleBoundaryContext) => unknown;
  afterDispose?: (context: GameModuleLifecycleBoundaryContext) => unknown;
  afterDestroy?: (context: GameModuleLifecycleBoundaryContext) => unknown;
}>;

export type GameModuleLifecycleCoordinatorOptions = Readonly<{
  graph: Pick<
    ResolvedModuleGraph,
    "constructionOrder" | "productionInstantiationAllowed"
  >;
  participants: readonly GameModuleLifecycleParticipant[];
  boundaries?: GameModuleLifecycleBoundaries;
  destroyGraph?: () => unknown;
}>;

export type GameModuleLifecycleSnapshot = Readonly<{
  phase: GameModuleLifecyclePhase;
  participantIds: readonly string[];
  initializedParticipantIds: readonly string[];
  startedParticipantIds: readonly string[];
}>;

type ParticipantHook = "initialize" | "start" | "stop" | "dispose";

function isThenable(value: unknown): boolean {
  return (
    value !== null &&
    (typeof value === "object" || typeof value === "function") &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

function definitionFailure(message: string): never {
  throw new GameModuleLifecycleError(
    GameModuleLifecycleErrorCode.invalidDefinition,
    message,
  );
}

/**
 * Coordinates already-created module participants. It deliberately does not
 * instantiate modules or know about a runtime engine, router, or lease ledger.
 */
export class DeterministicGameModuleLifecycleCoordinator {
  readonly #ordered: readonly GameModuleLifecycleParticipant[];
  readonly #boundaries: GameModuleLifecycleBoundaries;
  readonly #destroyGraph: (() => unknown) | undefined;
  #phase: GameModuleLifecyclePhase = "created";
  #initializedCount = 0;
  #startedCount = 0;

  constructor(options: GameModuleLifecycleCoordinatorOptions) {
    if (!options.graph.productionInstantiationAllowed) {
      definitionFailure(
        "lifecycle coordination requires an entirely production-eligible graph",
      );
    }
    const participantsById = new Map<string, GameModuleLifecycleParticipant>();
    for (const participant of options.participants) {
      if (participant.instanceId.length === 0) {
        definitionFailure("participant instanceId must not be empty");
      }
      if (participantsById.has(participant.instanceId)) {
        definitionFailure(`duplicate participant: ${participant.instanceId}`);
      }
      participantsById.set(participant.instanceId, participant);
    }

    const seen = new Set<string>();
    const ordered: GameModuleLifecycleParticipant[] = [];
    for (const instanceId of options.graph.constructionOrder) {
      if (seen.has(instanceId)) {
        definitionFailure(`duplicate construction-order entry: ${instanceId}`);
      }
      seen.add(instanceId);
      const participant = participantsById.get(instanceId);
      if (participant === undefined) {
        definitionFailure(
          `missing participant for construction order: ${instanceId}`,
        );
      }
      ordered.push(participant);
    }
    const extras = [...participantsById.keys()].filter((id) => !seen.has(id));
    if (extras.length > 0) {
      definitionFailure(
        `participants absent from construction order: ${extras.sort().join(", ")}`,
      );
    }

    this.#ordered = Object.freeze(ordered);
    this.#boundaries = options.boundaries ?? {};
    this.#destroyGraph = options.destroyGraph;
  }

  get phase(): GameModuleLifecyclePhase {
    return this.#phase;
  }

  snapshot(): GameModuleLifecycleSnapshot {
    return Object.freeze({
      phase: this.#phase,
      participantIds: Object.freeze(
        this.#ordered.map(({ instanceId }) => instanceId),
      ),
      initializedParticipantIds: Object.freeze(
        this.#ordered
          .slice(0, this.#initializedCount)
          .map(({ instanceId }) => instanceId),
      ),
      startedParticipantIds: Object.freeze(
        this.#ordered
          .slice(0, this.#startedCount)
          .map(({ instanceId }) => instanceId),
      ),
    });
  }

  initialize(): void {
    this.#requirePhase("initialize", ["created"]);
    const failures: GameModuleLifecycleFailure[] = [];
    if (!this.#invokeBoundary("before-initialize", "initialize", failures)) {
      this.#rollbackAfterFailure("initialize", failures);
    }

    for (let index = 0; index < this.#ordered.length; index += 1) {
      const participant = this.#ordered[index]!;
      if (!this.#invokeParticipant(participant, "initialize", failures)) {
        this.#rollbackAfterFailure("initialize", failures);
      }
      this.#initializedCount = index + 1;
    }
    if (!this.#invokeBoundary("after-initialize", "initialize", failures)) {
      this.#rollbackAfterFailure("initialize", failures);
    }
    this.#phase = "initialized";
  }

  start(): void {
    this.#requirePhase("start", ["initialized", "stopped"]);
    const failures: GameModuleLifecycleFailure[] = [];
    if (!this.#invokeBoundary("before-start", "start", failures)) {
      this.#rollbackAfterFailure("start", failures);
    }

    for (let index = 0; index < this.#ordered.length; index += 1) {
      const participant = this.#ordered[index]!;
      this.#startedCount = index + 1;
      if (!this.#invokeParticipant(participant, "start", failures)) {
        this.#rollbackAfterFailure("start", failures);
      }
    }
    if (!this.#invokeBoundary("after-start", "start", failures)) {
      this.#rollbackAfterFailure("start", failures);
    }
    this.#phase = "running";
  }

  stop(): void {
    this.#requirePhase("stop", ["running"]);
    const failures: GameModuleLifecycleFailure[] = [];
    this.#invokeBoundary("before-stop", "stop", failures);
    this.#stopAttempted(failures);
    this.#phase = "stopped";
    this.#invokeBoundary("after-stop", "stop", failures);
    if (failures.length > 0) {
      this.#phase = "failed";
    }
    this.#throwTransitionFailures("stop", failures);
  }

  dispose(): void {
    this.#requirePhase("dispose", [
      "created",
      "initialized",
      "stopped",
      "failed",
    ]);
    const failures: GameModuleLifecycleFailure[] = [];
    this.#disposeAll(failures);
    this.#phase = "disposed";
    this.#invokeBoundary("after-dispose", "dispose", failures);
    this.#throwTransitionFailures("dispose", failures);
  }

  destroy(): void {
    this.#requirePhase("destroy", ["disposed"]);
    const failures: GameModuleLifecycleFailure[] = [];
    if (this.#destroyGraph !== undefined) {
      this.#invokeFunction("destroy", undefined, this.#destroyGraph, failures);
    }
    this.#phase = "destroyed";
    this.#invokeBoundary("after-destroy", "destroy", failures);
    this.#throwTransitionFailures("destroy", failures);
  }

  #rollbackAfterFailure(
    transition: "initialize" | "start",
    failures: GameModuleLifecycleFailure[],
  ): never {
    if (transition === "start") {
      this.#invokeBoundary("before-stop", "stop", failures);
      this.#stopAttempted(failures);
      this.#invokeBoundary("after-stop", "stop", failures);
    }
    this.#disposeAll(failures);
    this.#phase = "disposed";
    this.#invokeBoundary("after-dispose", "dispose", failures);
    if (this.#destroyGraph !== undefined) {
      this.#invokeFunction("destroy", undefined, this.#destroyGraph, failures);
    }
    this.#phase = "destroyed";
    this.#invokeBoundary("after-destroy", "destroy", failures);
    this.#throwTransitionFailures(transition, failures);
    throw new GameModuleLifecycleError(
      GameModuleLifecycleErrorCode.hookFailed,
      `${transition} rollback unexpectedly contained no failure`,
      transition,
    );
  }

  #stopAttempted(failures: GameModuleLifecycleFailure[]): void {
    for (let index = this.#startedCount - 1; index >= 0; index -= 1) {
      this.#invokeParticipant(this.#ordered[index]!, "stop", failures);
    }
    this.#startedCount = 0;
  }

  #disposeAll(failures: GameModuleLifecycleFailure[]): void {
    for (let index = this.#ordered.length - 1; index >= 0; index -= 1) {
      this.#invokeParticipant(this.#ordered[index]!, "dispose", failures);
    }
    this.#startedCount = 0;
    this.#initializedCount = 0;
  }

  #invokeParticipant(
    participant: GameModuleLifecycleParticipant,
    hook: ParticipantHook,
    failures: GameModuleLifecycleFailure[],
  ): boolean {
    const callback = participant[hook];
    if (callback === undefined) {
      return true;
    }
    return this.#invokeFunction(
      hook,
      participant.instanceId,
      callback,
      failures,
    );
  }

  #invokeBoundary(
    stage: Exclude<GameModuleLifecycleStage, ParticipantHook | "destroy">,
    transition: GameModuleLifecycleTransition,
    failures: GameModuleLifecycleFailure[],
  ): boolean {
    const key = stage.replace(/-([a-z])/g, (_, letter: string) =>
      letter.toUpperCase(),
    ) as keyof GameModuleLifecycleBoundaries;
    const callback = this.#boundaries[key];
    if (callback === undefined) {
      return true;
    }
    const context = Object.freeze({
      transition,
      phase: this.#phase,
      attemptedParticipantIds: Object.freeze(
        this.#ordered
          .slice(0, this.#startedCount)
          .map(({ instanceId }) => instanceId),
      ),
    });
    return this.#invokeFunction(
      stage,
      undefined,
      () => callback(context),
      failures,
    );
  }

  #invokeFunction(
    stage: GameModuleLifecycleStage,
    participantId: string | undefined,
    callback: () => unknown,
    failures: GameModuleLifecycleFailure[],
  ): boolean {
    try {
      const result = callback();
      if (isThenable(result)) {
        const error = new GameModuleLifecycleError(
          GameModuleLifecycleErrorCode.asynchronousHook,
          `${stage}${participantId === undefined ? "" : ` hook for ${participantId}`} returned a thenable`,
        );
        failures.push(
          Object.freeze({
            stage,
            ...(participantId === undefined ? {} : { participantId }),
            error,
          }),
        );
        return false;
      }
      return true;
    } catch (error) {
      failures.push(
        Object.freeze({
          stage,
          ...(participantId === undefined ? {} : { participantId }),
          error,
        }),
      );
      return false;
    }
  }

  #requirePhase(
    transition: GameModuleLifecycleTransition,
    allowed: readonly GameModuleLifecyclePhase[],
  ): void {
    if (!allowed.includes(this.#phase)) {
      throw new GameModuleLifecycleError(
        GameModuleLifecycleErrorCode.invalidPhase,
        `${transition} is forbidden while lifecycle is ${this.#phase}`,
        transition,
      );
    }
  }

  #throwTransitionFailures(
    transition: GameModuleLifecycleTransition,
    failures: GameModuleLifecycleFailure[],
  ): never | void {
    if (failures.length === 0) {
      return;
    }
    throw new GameModuleLifecycleError(
      GameModuleLifecycleErrorCode.transitionFailed,
      `${transition} failed with ${failures.length} deterministic lifecycle failure${failures.length === 1 ? "" : "s"}`,
      transition,
      Object.freeze([...failures]),
    );
  }
}
import type { ResolvedModuleGraph } from "./game-module-resolver.js";
