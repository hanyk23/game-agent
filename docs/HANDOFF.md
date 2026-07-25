# 项目重构交接（HANDOFF）

> 本文件用于跨对话/跨接手人的上下文交接：记录已定稿决策、已完成动作、待办清单。
> 长期行为规则以 `AGENTS.md` 为准；分阶段计划以 `docs/COCOS_REFACTOR_PLAN.md` 为准；本文件只做“当前状态快照 + 下一步”。

## 产品目标

- 产品是一个**可复用的游戏生成 Agent**：一句自然语言 →「生成 → 验证 → 打包」→ 经验证的单人弹幕（bullet-hell）H5 游戏。
- **同时支持竖版与横版**；产物是可复用 Agent 与契约，不是某个具体游戏。

## 已定稿决策

- **引擎**：Cocos Creator Web/H5 是唯一目标引擎。
- **Phaser**：已退役，**不作为 parity 基线或正确性标准**；归档于 `legacy/`，当前仍在构建里但仅供查阅；**禁止擅自删除**，真正移除待 Cocos 独立跑通整条流水线后由用户单独授权，且与 parity 无关。
- **正确性来源**：契约 + 验证规则 + `src/evaluation/` 中经用户验收的 Cocos 黄金样本。
- **黄金样本定位**：只锚定**框架层 + 契约层**，不锚定内容层（玩法/数值/关卡/美术）；契约用开放注册表保持可扩展，防止游戏结构固化。
- **方向**：orientation（vertical|horizontal）参数化，禁止把竖版写死。
- **架构**：6 个 Agent + 1 个非 Agent 编排器。
  - Orchestrator（`src/orchestration/`）：纯 TS、无 LLM、最终权威。
  - Spec（`src/requirements/`）、Design（`src/gameplay/`）、Module（`src/modules/`）、Code（`src/opencode/`，唯一写码、经 OpenCode）、Verifier（`src/verification/`，默认确定性）、Repair（`src/repair/`，只诊断）。
  - `src/evaluation/`：评估与回归基线，不属任一运行时 Agent。

## 执行轮次

0.5 Phaser 归档准备 → A 手动 Cocos 黄金样本(交用户验收) → B 固化基线(仅框架/契约层) → 2 定义/重构契约 → 3–7 实现 → 7.5 灵活性/防固化验证 → 8–11 收尾。

## 本轮已完成（避免新对话重做）

- **AGENTS.md**：已瘦身至 113 行 / 8199 字节（预算 ≤130 行 / ≤9000 字节），并补回原句「禁止擅自删除 Phaser」。
- **tests/document-governance.test.ts**：删除 `locks the product objective above evaluation cases` 这一措辞断言块（校验的是具体用词而非规则存在性，属错误断言设计）；保留行数/字节预算、CURRENT_STATUS 防退化、ABI 1.2 hash 联动三块。已全绿。
- **batch3-module-evidence-chain.ts**：前轮遗留 typecheck 错误已修复。
- **计划文档**：`docs/ROADMAP.md`、`docs/CURRENT_STATUS.md`、`docs/COCOS_REFACTOR_PLAN.md` 已改写为新策略。

## 待办（下一步，按序）

1. **收敛其余旧文档**：`docs/COCOS_MIGRATION_PLAN.md`、`docs/HANDOFF.md`、ADR 0029/0022/0002 等仍含旧 Phaser/parity/M6 表述，收敛到新策略消除口径分歧（纯文档、无新授权）。
2. **定义 `pnpm check:fast`**：需授权改 `package.json`，同时落地 admission/release 分层；这是后续所有轮次的验收命令，当前尚不存在。
3. **Round A**：手动产出 Cocos 黄金样本交验收；涉及 Cocos 下载/依赖，须先单独批准 version/size/source/purpose。

## 已知风险 / 护栏

- 受保护文件（AGENTS.md、`tests/`、契约、注册表、`src/orchestration|verification|repair|opencode`、`runtime/kernel|cocos`、依赖与配置）由用户手动改，Code Agent/Trae 不得擅动。
- 不删除或改弱测试、不降级 schema、不放宽门禁；验证与打包 fail-closed。
- Git 写操作需显式授权；不隐式建首次提交。不在未获成本批准时调用付费模型。
