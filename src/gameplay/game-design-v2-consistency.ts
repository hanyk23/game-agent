import { createHash } from "node:crypto";

import {
  sha256GameSpecV2,
  type GameSpecV2,
} from "../requirements/game-spec-v2.js";
import {
  IntentLedgerV2Error,
  sha256IntentLedgerV2,
  verifyIntentLedgerV2,
  type IntentLedgerV2,
  type IntentLedgerV2Request,
} from "../requirements/intent-ledger-v2.js";
import {
  collectGameDesignV2Ids,
  GameDesignV2Schema,
  type DesignConditionNode,
  type DesignEffect,
  type DesignProcessOwner,
  type DesignTrigger,
  type GameDesignV2,
  type SystemDesign,
} from "./game-design-v2.js";

export class GameDesignV2ConsistencyError extends Error {
  constructor(
    readonly code:
      | "schema"
      | "reference"
      | "hash-mismatch"
      | "ledger"
      | "statement-missing"
      | "source-mismatch"
      | "locked-coverage"
      | "forbidden-binding"
      | "forbidden-contradiction",
    message: string,
    options?: ErrorOptions,
  ) {
    super(`GameDesignV2 ${code}: ${message}`, options);
    this.name = "GameDesignV2ConsistencyError";
  }
}

function sha256Utf8(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

type DesignIdSets = Readonly<{
  actors: ReadonlySet<string>;
  resources: ReadonlySet<string>;
  states: ReadonlyMap<string, ReadonlySet<string>>;
  actions: ReadonlySet<string>;
  events: ReadonlySet<string>;
  timers: ReadonlySet<string>;
  processes: ReadonlySet<string>;
  outcomes: ReadonlySet<string>;
  allNodes: ReadonlySet<string>;
}>;

function buildIdSets(design: GameDesignV2): DesignIdSets {
  const system = design.systemDesign;
  return {
    actors: new Set(system.actors.map((value) => value.id)),
    resources: new Set(system.resources.map((value) => value.id)),
    states: new Map(
      system.states.map((value) => [value.id, new Set(value.values)]),
    ),
    actions: new Set(system.actions.map((value) => value.id)),
    events: new Set(system.events.map((value) => value.id)),
    timers: new Set(system.timers.map((value) => value.id)),
    processes: new Set(system.processes.map((value) => value.id)),
    outcomes: new Set(system.outcomes.map((value) => value.id)),
    allNodes: new Set(collectGameDesignV2Ids(design)),
  };
}

type HasId = Readonly<{ has: (id: string) => boolean }>;

function requireRef(set: HasId, id: string, what: string): void {
  if (!set.has(id)) {
    throw new GameDesignV2ConsistencyError(
      "reference",
      `${what} references unknown id "${id}"`,
    );
  }
}

function checkCondition(
  node: DesignConditionNode,
  ids: DesignIdSets,
  where: string,
): void {
  if (node.kind === "all" || node.kind === "any") {
    for (const child of node.of) checkCondition(child, ids, where);
    return;
  }
  if (node.kind === "not") {
    checkCondition(node.of, ids, where);
    return;
  }

  const target = node.target;
  switch (target.type) {
    case "resource":
      requireRef(ids.resources, target.id, `${where} resource`);
      return;
    case "state": {
      requireRef(ids.states, target.id, `${where} state`);
      const values = ids.states.get(target.id);
      if (
        target.equals !== undefined &&
        (values === undefined || !values.has(target.equals))
      ) {
        throw new GameDesignV2ConsistencyError(
          "reference",
          `${where} state value "${target.equals}" is not declared`,
        );
      }
      return;
    }
    case "event":
      requireRef(ids.events, target.id, `${where} event`);
      return;
    case "timer":
      requireRef(ids.timers, target.id, `${where} timer`);
  }
}

function checkTrigger(
  trigger: DesignTrigger,
  ids: DesignIdSets,
  where: string,
): void {
  if (trigger.kind === "event") {
    requireRef(ids.events, trigger.event, `${where} event`);
  } else {
    checkCondition(trigger.condition, ids, `${where} condition`);
  }
}

function checkEffect(
  effect: DesignEffect,
  ids: DesignIdSets,
  where: string,
): void {
  switch (effect.kind) {
    case "resource-change":
      requireRef(ids.resources, effect.resource, `${where} resource`);
      return;
    case "state-transition": {
      const values = ids.states.get(effect.state);
      if (values === undefined) {
        throw new GameDesignV2ConsistencyError(
          "reference",
          `${where} references unknown state "${effect.state}"`,
        );
      }
      for (const value of [effect.from, effect.to]) {
        if (value !== undefined && !values.has(value)) {
          throw new GameDesignV2ConsistencyError(
            "reference",
            `${where} references undeclared state value "${value}"`,
          );
        }
      }
      return;
    }
    case "emit-event":
      requireRef(ids.events, effect.event, `${where} event`);
      return;
    case "spawn":
    case "despawn":
      requireRef(ids.actors, effect.actor, `${where} actor`);
      return;
    case "outcome-request":
      requireRef(ids.outcomes, effect.outcome, `${where} outcome`);
      return;
    case "behavior":
      if (effect.subject !== undefined) {
        requireRef(ids.actors, effect.subject, `${where} behavior subject`);
      }
      if (effect.target !== undefined) {
        requireRef(ids.actors, effect.target, `${where} behavior target`);
      }
  }
}

function checkOwner(
  owner: DesignProcessOwner,
  ids: DesignIdSets,
  where: string,
): void {
  if (owner.type === "actor") {
    requireRef(ids.actors, owner.id, `${where} owner`);
  }
}

export function verifyGameDesignV2References(design: GameDesignV2): void {
  const ids = buildIdSets(design);
  const system: SystemDesign = design.systemDesign;

  for (const action of system.actions) {
    requireRef(ids.actors, action.actor, `action ${action.id}`);
    if (action.emits !== undefined) {
      requireRef(ids.events, action.emits, `action ${action.id} emits`);
    }
    for (const effect of action.effects) {
      checkEffect(effect, ids, `action ${action.id}`);
    }
  }
  for (const timer of system.timers) {
    requireRef(ids.events, timer.emits, `timer ${timer.id} emits`);
    if (timer.startOn !== undefined) {
      requireRef(ids.events, timer.startOn, `timer ${timer.id} startOn`);
    }
    if (timer.stopOn !== undefined) {
      requireRef(ids.events, timer.stopOn, `timer ${timer.id} stopOn`);
    }
  }
  for (const rule of system.rules) {
    checkTrigger(rule.when, ids, `rule ${rule.id}`);
    if (rule.conditions !== undefined) {
      checkCondition(rule.conditions, ids, `rule ${rule.id}`);
    }
    for (const effect of rule.effects) {
      checkEffect(effect, ids, `rule ${rule.id}`);
    }
  }
  for (const process of system.processes) {
    checkOwner(process.owner, ids, `process ${process.id}`);
    if (process.startOn !== undefined) {
      requireRef(ids.events, process.startOn, `process ${process.id} startOn`);
    }
    if (process.stopOn !== undefined) {
      requireRef(ids.events, process.stopOn, `process ${process.id} stopOn`);
    }
    if (process.cadence.kind === "timer") {
      requireRef(
        ids.timers,
        process.cadence.timer,
        `process ${process.id} cadence`,
      );
    }
    if (process.conditions !== undefined) {
      checkCondition(process.conditions, ids, `process ${process.id}`);
    }
    for (const effect of process.effects) {
      checkEffect(effect, ids, `process ${process.id}`);
    }
  }
  for (const outcome of system.outcomes) {
    checkTrigger(outcome.when, ids, `outcome ${outcome.id}`);
  }

  const spatial = design.spatialDesign;
  for (const movement of spatial.movement) {
    requireRef(ids.actors, movement.subject, `movement ${movement.id}`);
  }
  for (const aiming of spatial.aiming) {
    if (aiming.subject !== undefined) {
      requireRef(ids.actors, aiming.subject, `aiming ${aiming.id}`);
    }
  }
  if (spatial.camera.target !== undefined) {
    requireRef(ids.actors, spatial.camera.target, "camera target");
  }
  const boundaries = new Set(spatial.boundaries.map((value) => value.id));
  for (const movement of spatial.movement) {
    if (movement.constrainedToBoundaryId !== undefined) {
      requireRef(
        boundaries,
        movement.constrainedToBoundaryId,
        `movement ${movement.id} boundary`,
      );
    }
  }
  for (const spawn of spatial.spawn) {
    checkOwner(spawn.owner, ids, `spawn ${spawn.id}`);
    if (spawn.spawns !== undefined) {
      requireRef(ids.actors, spawn.spawns, `spawn ${spawn.id}`);
    }
    if (spawn.activationEvent !== undefined) {
      requireRef(ids.events, spawn.activationEvent, `spawn ${spawn.id}`);
    }
    if (spawn.activationCondition !== undefined) {
      checkCondition(spawn.activationCondition, ids, `spawn ${spawn.id}`);
    }
  }
  for (const boundary of spatial.boundaries) {
    if (boundary.subject !== undefined) {
      requireRef(ids.actors, boundary.subject, `boundary ${boundary.id}`);
    }
  }
  for (const culling of spatial.culling) {
    if (culling.subject !== undefined) {
      requireRef(ids.actors, culling.subject, `culling ${culling.id}`);
    }
  }

  for (const actionId of design.gameplayDesign.coreLoop.actionIds) {
    requireRef(ids.actions, actionId, "core loop action");
  }
  for (const decision of design.requirementBindings.decisions) {
    for (const target of decision.targets) {
      requireRef(ids.allNodes, target.nodeId, `binding ${decision.id}`);
    }
  }
  const exclusions = new Set(
    design.requirementBindings.exclusions.map((value) => value.id),
  );
  for (const forbidden of design.requirementBindings.forbidden) {
    requireRef(
      exclusions,
      forbidden.exclusion,
      `forbidden binding ${forbidden.id}`,
    );
  }
}

export type VerifyGameDesignV2Input = Readonly<{
  request: IntentLedgerV2Request;
  gameSpec: GameSpecV2;
  intentLedger: IntentLedgerV2;
  design: unknown;
}>;

export function verifyGameDesignV2Consistency(
  input: VerifyGameDesignV2Input,
): GameDesignV2 {
  let design: GameDesignV2;
  try {
    design = GameDesignV2Schema.parse(input.design);
  } catch (error) {
    throw new GameDesignV2ConsistencyError(
      "schema",
      error instanceof Error ? error.message : "invalid GameDesignV2",
      { cause: error },
    );
  }

  const hashes = {
    request: sha256Utf8(input.request.prompt),
    gameSpec: sha256GameSpecV2(input.gameSpec),
    intentLedger: sha256IntentLedgerV2(input.intentLedger),
  };
  if (design.sources.request.sha256 !== hashes.request) {
    throw new GameDesignV2ConsistencyError(
      "hash-mismatch",
      "request hash mismatch",
    );
  }
  if (design.sources.gameSpec.sha256 !== hashes.gameSpec) {
    throw new GameDesignV2ConsistencyError(
      "hash-mismatch",
      "GameSpecV2 hash mismatch",
    );
  }
  if (design.sources.intentLedger.sha256 !== hashes.intentLedger) {
    throw new GameDesignV2ConsistencyError(
      "hash-mismatch",
      "IntentLedgerV2 hash mismatch",
    );
  }

  let ledger: IntentLedgerV2;
  try {
    ledger = verifyIntentLedgerV2(
      input.request,
      input.gameSpec,
      input.intentLedger,
    );
  } catch (error) {
    throw new GameDesignV2ConsistencyError(
      "ledger",
      error instanceof IntentLedgerV2Error
        ? `${error.code}: ${error.message}`
        : "IntentLedgerV2 verification failed",
      { cause: error },
    );
  }

  verifyGameDesignV2References(design);

  const entries = new Map(
    ledger.entries.map((entry) => [entry.statementId, entry]),
  );
  const covered = new Set<string>();
  for (const decision of design.requirementBindings.decisions) {
    if (decision.source === "agent-derived") continue;
    const entry = entries.get(decision.statementId);
    if (entry === undefined) {
      throw new GameDesignV2ConsistencyError(
        "statement-missing",
        `binding ${decision.id} cites unknown statement ${decision.statementId}`,
      );
    }
    if (entry.source !== decision.source) {
      throw new GameDesignV2ConsistencyError(
        "source-mismatch",
        `binding ${decision.id} source does not match the ledger`,
      );
    }
    covered.add(decision.statementId);
  }

  const exclusions = new Map(
    design.requirementBindings.exclusions.map((value) => [value.id, value]),
  );
  for (const forbidden of design.requirementBindings.forbidden) {
    const entry = entries.get(forbidden.statementId);
    if (entry === undefined) {
      throw new GameDesignV2ConsistencyError(
        "statement-missing",
        `forbidden binding ${forbidden.id} cites an unknown statement`,
      );
    }
    if (entry.strength !== "forbidden") {
      throw new GameDesignV2ConsistencyError(
        "forbidden-binding",
        `forbidden binding ${forbidden.id} does not cite a forbidden statement`,
      );
    }
    covered.add(forbidden.statementId);
  }

  const missingLocked = ledger.entries
    .filter((entry) => entry.locked && !covered.has(entry.statementId))
    .map((entry) => entry.statementId);
  if (missingLocked.length > 0) {
    throw new GameDesignV2ConsistencyError(
      "locked-coverage",
      `locked statements without bindings: ${missingLocked.join(", ")}`,
    );
  }

  const enabledCapabilities = new Set<string>();
  for (const actor of design.systemDesign.actors) {
    enabledCapabilities.add(actor.role);
    for (const capability of actor.capabilityTags) {
      enabledCapabilities.add(capability);
    }
  }
  for (const forbidden of design.requirementBindings.forbidden) {
    const exclusion = exclusions.get(forbidden.exclusion);
    if (exclusion === undefined) {
      throw new GameDesignV2ConsistencyError(
        "forbidden-binding",
        `forbidden binding ${forbidden.id} references an unknown exclusion`,
      );
    }
    if (enabledCapabilities.has(exclusion.capability)) {
      throw new GameDesignV2ConsistencyError(
        "forbidden-contradiction",
        `forbidden capability "${exclusion.capability}" is enabled`,
      );
    }
  }

  return design;
}
