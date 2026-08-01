export type LiveAgentV2ProbeCase = Readonly<{
  id: string;
  prompt: string;
}>;

export const LIVE_AGENT_V2_PROBE_CASES: readonly LiveAgentV2ProbeCase[] = [
  {
    id: "baseline-horizontal-survival",
    prompt:
      "我想要一个横屏的弹幕射击 H5 游戏：玩家可以在二维平面里自由移动，用鼠标瞄准射击，不要 Boss，存活满 120 秒后进入结算。",
  },
  {
    id: "crystal-cavern-shields",
    prompt:
      "做一个横屏水晶洞窟主题的弹幕射击 H5：玩家能在整个二维房间自由移动，用鼠标瞄准并射击；场上周期性出现短时护盾拾取物，敌人混合使用环形弹幕和定点弹幕。不要 Boss，撑过 120 秒进入胜利结算。",
  },
  {
    id: "salvage-score-pressure",
    prompt:
      "生成一个横屏太空打捞主题的弹幕射击 H5。玩家在二维区域自由移动，以鼠标瞄准射击，击毁敌人会增加分数并可能掉落修复道具；敌人压力随时间提升。不要 Boss，玩家存活 120 秒后结算胜利。",
  },
  {
    id: "desert-dash-charge",
    prompt:
      "我需要一个横屏沙海竞技场弹幕射击 H5：玩家可在二维场地自由移动，支持短距离冲刺，并用鼠标瞄准发射普通弹或蓄力弹；敌人从场地边缘持续进入。不要 Boss，坚持生存 120 秒后进入胜利结算。",
  },
] as const;

export function resolveLiveAgentV2ProbeCase(
  caseId = process.env.GAME_AGENT_LIVE_PROBE_CASE_ID ??
    "crystal-cavern-shields",
): LiveAgentV2ProbeCase {
  const probeCase = LIVE_AGENT_V2_PROBE_CASES.find(
    (candidate) => candidate.id === caseId,
  );
  if (probeCase === undefined) {
    throw new Error(
      `Unknown GAME_AGENT_LIVE_PROBE_CASE_ID=${caseId}; expected one of: ${LIVE_AGENT_V2_PROBE_CASES.map((candidate) => candidate.id).join(", ")}`,
    );
  }
  return probeCase;
}
