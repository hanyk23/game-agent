import {
  parseGameDesignV2,
  sha256GameDesignV2,
  type GameDesignV2,
} from "../src/gameplay/game-design-v2.js";
import { verifyGameDesignV2References } from "../src/gameplay/game-design-v2-consistency.js";
import type { DesignStageV2Result } from "../src/requirements/design-agent-result.js";
import type { IntentLedgerV2 } from "../src/requirements/intent-ledger-v2.js";

const EXPECTED_MODEL = "deepseek-v4-flash";

export type DesignAgentV2StructuralAssertion = Readonly<{
  id: string;
  description: string;
  passed: boolean;
  detail: string;
}>;

export type EvaluateDesignAgentV2StructuralAssertionsInput = Readonly<{
  result: Extract<DesignStageV2Result, { status: "design-ready" }>;
  intentLedger: IntentLedgerV2;
  expectedRequestSha256: string;
  expectedGameSpecSha256: string;
  expectedIntentLedgerSha256: string;
}>;

export function didDesignAgentV2StructuralAssertionsPass(
  status: DesignStageV2Result["status"],
  assertions: readonly DesignAgentV2StructuralAssertion[],
): boolean {
  return (
    status === "design-ready" &&
    assertions.length > 0 &&
    assertions.every((assertion) => assertion.passed)
  );
}

type AimingShootingRelation = Readonly<{
  bindingId: string;
  aimingId: string;
  actionId: string;
  actorId: string;
  actionInCoreLoop: boolean;
}>;

function findAimingShootingRelation(
  design: GameDesignV2,
  intentLedger: IntentLedgerV2,
): AimingShootingRelation | undefined {
  const actorIds = new Set(design.systemDesign.actors.map((actor) => actor.id));
  const aimingById = new Map(
    design.spatialDesign.aiming.map((aiming) => [aiming.id, aiming]),
  );
  const actionById = new Map(
    design.systemDesign.actions.map((action) => [action.id, action]),
  );
  const coreLoopActionIds = new Set(design.gameplayDesign.coreLoop.actionIds);
  const userDeclaredStatementIds = new Set(
    intentLedger.entries
      .filter((entry) => entry.source === "user-declared")
      .map((entry) => entry.statementId),
  );

  const bindings = design.requirementBindings.decisions.filter(
    (decision) =>
      decision.source !== "agent-derived" &&
      userDeclaredStatementIds.has(decision.statementId),
  );
  for (const binding of bindings) {
    const targetIds = new Set(binding.targets.map((target) => target.nodeId));
    const aimingTargets = [...targetIds]
      .map((nodeId) => aimingById.get(nodeId))
      .filter((aiming) => aiming !== undefined);
    const actionTargets = [...targetIds]
      .map((nodeId) => actionById.get(nodeId))
      .filter((action) => action !== undefined);

    for (const aiming of aimingTargets) {
      if (aiming.subject === undefined || !actorIds.has(aiming.subject)) {
        continue;
      }
      for (const action of actionTargets) {
        if (action.actor !== aiming.subject || !actorIds.has(action.actor)) {
          continue;
        }
        const actionInCoreLoop = coreLoopActionIds.has(action.id);
        if (!actionInCoreLoop) continue;

        return {
          bindingId: binding.id,
          aimingId: aiming.id,
          actionId: action.id,
          actorId: action.actor,
          actionInCoreLoop,
        };
      }
    }
  }
  return undefined;
}

/**
 * Deterministic structural assertions shared by the live probe and offline
 * re-audit. This function performs no I/O and does not mutate its inputs.
 */
export function evaluateDesignAgentV2StructuralAssertions(
  input: EvaluateDesignAgentV2StructuralAssertionsInput,
): DesignAgentV2StructuralAssertion[] {
  const {
    result,
    intentLedger,
    expectedRequestSha256,
    expectedGameSpecSha256,
    expectedIntentLedgerSha256,
  } = input;
  const design: GameDesignV2 = result.gameDesign;
  const assertions: DesignAgentV2StructuralAssertion[] = [];

  const push = (
    id: string,
    description: string,
    passed: boolean,
    detail: string,
  ): void => {
    assertions.push({ id, description, passed, detail });
  };

  push(
    "status-design-ready",
    "阶段结果为 design-ready。",
    result.status === "design-ready",
    `status=${result.status}`,
  );

  push(
    "model-is-flash",
    "requested/provenance 模型为 deepseek-v4-flash。",
    result.provenance.model === EXPECTED_MODEL,
    `provenance.model=${result.provenance.model}`,
  );

  let schemaOk = false;
  let schemaDetail = "";
  try {
    parseGameDesignV2(design);
    schemaOk = true;
    schemaDetail = "GameDesignV2 通过本地 schema 重解析。";
  } catch (error) {
    schemaDetail = error instanceof Error ? error.message : String(error);
  }
  push(
    "design-schema-valid",
    "GameDesignV2 通过本地 Schema。",
    schemaOk,
    schemaDetail,
  );

  const recomputedDesignSha = sha256GameDesignV2(design);
  const hashesConsistent =
    design.sources.request.sha256 === expectedRequestSha256 &&
    design.sources.gameSpec.sha256 === expectedGameSpecSha256 &&
    design.sources.intentLedger.sha256 === expectedIntentLedgerSha256 &&
    result.gameSpecSha256 === expectedGameSpecSha256 &&
    result.intentLedgerSha256 === expectedIntentLedgerSha256 &&
    result.gameDesignSha256 === recomputedDesignSha &&
    result.request.sha256 === expectedRequestSha256;
  push(
    "hash-binding-consistent",
    "request/spec/ledger/design hash 一致。",
    hashesConsistent,
    `request=${design.sources.request.sha256 === expectedRequestSha256}, spec=${design.sources.gameSpec.sha256 === expectedGameSpecSha256}, ledger=${design.sources.intentLedger.sha256 === expectedIntentLedgerSha256}, design=${result.gameDesignSha256 === recomputedDesignSha}`,
  );

  const lockedIds = intentLedger.entries
    .filter((entry) => entry.locked === true)
    .map((entry) => entry.statementId);
  const boundIds = new Set<string>([
    ...design.requirementBindings.decisions
      .filter((decision) => decision.source !== "agent-derived")
      .map((decision) => decision.statementId),
    ...design.requirementBindings.forbidden.map(
      (binding) => binding.statementId,
    ),
  ]);
  const missingLocked = lockedIds.filter((id) => !boundIds.has(id));
  push(
    "locked-coverage-complete",
    "所有 locked requirement 都有 binding。",
    missingLocked.length === 0,
    missingLocked.length === 0
      ? `${lockedIds.length} 条 locked 全部绑定。`
      : `未绑定的 locked: ${missingLocked.join(", ")}`,
  );

  const forbiddenLedgerIds = intentLedger.entries
    .filter((entry) => entry.strength === "forbidden")
    .map((entry) => entry.statementId);
  const forbiddenBindingStatementIds = new Set(
    design.requirementBindings.forbidden.map((binding) => binding.statementId),
  );
  const everyForbiddenBound = forbiddenLedgerIds.every((id) =>
    forbiddenBindingStatementIds.has(id),
  );
  const enabledCapabilities = new Set<string>();
  for (const actor of design.systemDesign.actors) {
    enabledCapabilities.add(actor.role);
    for (const tag of actor.capabilityTags ?? []) {
      enabledCapabilities.add(tag);
    }
  }
  const exclusions = new Map(
    design.requirementBindings.exclusions.map((value) => [
      value.id,
      value.capability,
    ]),
  );
  const contradiction = design.requirementBindings.forbidden.find((binding) => {
    const capability = exclusions.get(binding.exclusion);
    return capability !== undefined && enabledCapabilities.has(capability);
  });
  const noBossActor = !design.systemDesign.actors.some(
    (actor) => actor.role === "boss",
  );
  push(
    "forbidden-excluded-and-no-boss-actor",
    "forbidden 要求（不要 Boss）有 exclusion，且已知核心 actor 结构没有 Boss。",
    everyForbiddenBound && contradiction === undefined && noBossActor,
    `forbiddenLedger=[${forbiddenLedgerIds.join(", ")}], everyForbiddenBound=${everyForbiddenBound}, contradiction=${contradiction?.exclusion ?? "none"}, noBossActor=${noBossActor}`,
  );

  const survivalTimer = design.systemDesign.timers.find(
    (timer) => timer.durationMs === 120000,
  );
  push(
    "survival-120000ms",
    "存活时间精确为 120000ms。",
    survivalTimer !== undefined,
    survivalTimer !== undefined
      ? `timer ${survivalTimer.id} durationMs=120000, emits=${survivalTimer.emits}`
      : `无 durationMs=120000 的 timer；实际 timers=${design.systemDesign.timers.map((timer) => timer.durationMs).join(", ")}`,
  );

  const viewport = design.spatialDesign.viewport;
  const viewportOk =
    viewport.orientation === "horizontal" &&
    viewport.logicalWidth > viewport.logicalHeight;
  push(
    "viewport-horizontal-wide",
    "viewport 为 horizontal 且宽大于高。",
    viewportOk,
    `orientation=${viewport.orientation}, ${viewport.logicalWidth}x${viewport.logicalHeight}`,
  );

  const spatial = design.spatialDesign;
  const spatialExplicit =
    spatial.movement.length > 0 &&
    spatial.aiming.length > 0 &&
    typeof spatial.camera.mode === "string" &&
    spatial.camera.mode.length > 0 &&
    spatial.spawn.length > 0;
  push(
    "spatial-decoupled-from-orientation",
    "spatial 的 movement/aim/camera/spawn 均被独立显式声明，未由 orientation 推导。",
    spatialExplicit,
    `movement=${spatial.movement.length}, aiming=${spatial.aiming.length}, camera=${spatial.camera.mode}, spawn=${spatial.spawn.length}`,
  );

  const has2dMovement = spatial.movement.some(
    (movement) => movement.dimensions === "2d",
  );
  push(
    "free-2d-movement",
    "spatial design 表达自由二维移动。",
    has2dMovement,
    `movement dimensions=[${spatial.movement.map((movement) => `${movement.subject}:${movement.dimensions}`).join(", ")}]`,
  );

  const aimingShootingRelation = findAimingShootingRelation(
    design,
    intentLedger,
  );
  push(
    "pointer-world-aiming",
    "结构化 requirement binding 表达鼠标瞄准射击。",
    aimingShootingRelation !== undefined,
    aimingShootingRelation === undefined
      ? "未找到 user-declared binding 连接同一已声明 actor 的 aiming/action，且 action 位于 core loop。"
      : `binding=${aimingShootingRelation.bindingId}, aiming=${aimingShootingRelation.aimingId}, action=${aimingShootingRelation.actionId}, actor=${aimingShootingRelation.actorId}, coreLoop=${aimingShootingRelation.actionInCoreLoop}`,
  );

  const survivalEvent = survivalTimer?.emits;
  const survivalOutcome = design.systemDesign.outcomes.find(
    (outcome) =>
      outcome.result === "won" &&
      outcome.when.kind === "event" &&
      survivalEvent !== undefined &&
      outcome.when.event === survivalEvent,
  );
  push(
    "survival-timer-event-outcome-chain",
    "有可验证的 survival timer/event/outcome 链。",
    survivalTimer !== undefined && survivalOutcome !== undefined,
    survivalOutcome !== undefined
      ? `timer ${survivalTimer?.id} → event ${survivalEvent} → outcome ${survivalOutcome.id} (won)`
      : `未找到由存活事件 ${survivalEvent ?? "?"} 触发的 won outcome。`,
  );

  const lossOutcome = design.systemDesign.outcomes.find(
    (outcome) => outcome.result === "lost",
  );
  push(
    "explicit-loss-outcome",
    "存在明确的 loss 机制。",
    lossOutcome !== undefined,
    lossOutcome !== undefined
      ? `loss outcome ${lossOutcome.id}, trigger=${lossOutcome.when.kind}`
      : "无 result=lost 的 outcome。",
  );

  let referencesClosed = false;
  let referenceDetail = "";
  try {
    verifyGameDesignV2References(design);
    referencesClosed = true;
    referenceDetail = "全部引用闭合。";
  } catch (error) {
    referenceDetail = error instanceof Error ? error.message : String(error);
  }
  push(
    "references-closed",
    "timer/process/rule/event/outcome 引用闭合。",
    referencesClosed,
    referenceDetail,
  );

  const terminalPriorities = design.systemDesign.outcomes
    .filter((outcome) => outcome.terminal)
    .map((outcome) => outcome.priority);
  const distinctTerminal =
    new Set(terminalPriorities).size === terminalPriorities.length;
  push(
    "terminal-outcome-priority-distinct",
    "同帧 outcome priority 明确（terminal 优先级两两不同）。",
    distinctTerminal,
    `terminal priorities=[${terminalPriorities.join(", ")}]`,
  );

  const agentDerived = design.requirementBindings.decisions.filter(
    (decision) => decision.source === "agent-derived",
  );
  const allHaveRationale = agentDerived.every(
    (decision) => decision.rationale.trim().length > 0,
  );
  push(
    "agent-derived-has-rationale",
    "Agent 补全的玩法数值标记 agent-derived 并有 rationale。",
    agentDerived.length > 0 && allHaveRationale,
    `agent-derived=${agentDerived.length}, allHaveRationale=${allHaveRationale}`,
  );

  return assertions;
}
