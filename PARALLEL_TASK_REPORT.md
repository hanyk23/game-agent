# PARALLEL_TASK_REPORT

本报告对应并行批次 α / β / γ 三个子任务，逐条给出证据（改动、文件、验收、越界自查）。
本批次以**用户显式授权的维护者/开发者身份**执行，遵守维护者级红线：schema 只增不减、不删/不弱化任何现有测试、契约改动逐条独立评审、验证 fail-closed。

集成验收命令与结果：

```
pnpm check:fast
# = tsc --noEmit && prettier --check . && vitest run tests/requirements tests/gameplay tests/modules tests/runtime tests/samples
→ exit 0；Test Files 118 passed (118)，Tests 584 passed (584)
```

`git diff --stat`（受控源码，测试为新增文件）：

```
 .prettierignore                          | 20 ++++++++   ← 见「越界自查」：非本批次改动，属工作树既有未提交变更，未触碰
 src/requirements/requirement-analyzer.ts |  6 ++-        ← Agent-β
 src/requirements/shooter-game-spec.ts    | 82 ++++++++   ← Agent-α
 （其余为新增文件，见各节）
```

---

## 一、Agent-α —— S3：A 类结构护栏（纯增约束）

改的文件（唯一可写 owner = α）：

- 修改：[shooter-game-spec.ts](file:///Users/bytedance/code/game-agent/src/requirements/shooter-game-spec.ts)
- 新增测试：
  - [shooter-game-spec-orientation.test.ts](file:///Users/bytedance/code/game-agent/tests/requirements/shooter-game-spec-orientation.test.ts)
  - [shooter-game-spec-boss-phase-boundary.test.ts](file:///Users/bytedance/code/game-agent/tests/requirements/shooter-game-spec-boss-phase-boundary.test.ts)
  - [shooter-game-spec-time-budget.test.ts](file:///Users/bytedance/code/game-agent/tests/requirements/shooter-game-spec-time-budget.test.ts)

改了什么（全部为「新增约束 / 口径统一」，无删改、无放宽）：

1. **T5 orientation（P0）**：新增可选字段 `orientation: z.enum(["vertical","horizontal"]).optional()`（[schema L168](file:///Users/bytedance/code/game-agent/src/requirements/shooter-game-spec.ts#L164-L168)）+ superRefine 一致性校验（[L386-L408](file:///Users/bytedance/code/game-agent/src/requirements/shooter-game-spec.ts#L386-L408)）：`vertical ⇔ 高>宽`、`horizontal ⇔ 宽>高`，正方形对两者都判不一致。字段可选 → 现有不带该字段的 spec/fixture 仍合法。
2. **T8 boss 相位边界**：在保留「严格递减」原有规则的前提下，新增「末相位 `healthThreshold > 0`」护栏（[L367-L384](file:///Users/bytedance/code/game-agent/src/requirements/shooter-game-spec.ts#L367-L384)）——因为相位选择用 `healthRatio <= threshold`，末相位阈值为 0 时永远不可达，属无效相位，予以拒绝。
3. **T7a 时间常量口径统一**：把散落的 ms 上限抽为具名常量 `ENEMY_WAVE_START_MAX_MS`(600s)、`ENEMY_WAVE_DURATION_MAX_MS`(180s)、`RUN_TIME_LIMIT_MIN/MAX_MS`(10s/900s)，并加注释说明 `波起始/时长 ≤ 运行时限` 的口径关系（[L3-L19](file:///Users/bytedance/code/game-agent/src/requirements/shooter-game-spec.ts#L3-L19)）。**数值与原字面量完全一致，未改上下限、未引入 win/lose 联合校验**。

⚠ **提示词前提修正（据源码为准）**：文档 §4 T8 建议「首相位 `<1`」在本仓库**不可实现**——冻结 fixture [create-valid-spec.ts L53](file:///Users/bytedance/code/game-agent/tests/fixtures/create-valid-spec.ts#L53) 首相位 `healthThreshold: 1`，且模块 [batch3-encounter-hostile-library.ts L149](file:///Users/bytedance/code/game-agent/src/modules/batch3-encounter-hostile-library.ts#L149) **强制**首相位 `=== 1`（满血）。若按字面强制 `<1`，会打回冻结 fixture 与现有测试（违反验收 D/G）。因此 T8 只实现「末相位 `>0`」这一安全收窄，并在此显式记录前提冲突。

验收证据：`git diff` 仅动 `shooter-game-spec.ts` 与 α 自己在 `tests/requirements/` 的 3 个新增文件；orientation 对横/竖/正方形边界用例判断正确（见 orientation 测试 7 例全绿）。

---

## 二、Agent-β —— A1：Spec Agent 口径 + orientation 消费 + Orchestrator 骨架

改的文件（owner = β）：

- 修改：[requirement-analyzer.ts](file:///Users/bytedance/code/game-agent/src/requirements/requirement-analyzer.ts)（仅提示词，非 schema）
- 新建：[create-nl-requirement-cases.ts](file:///Users/bytedance/code/game-agent/tests/fixtures/create-nl-requirement-cases.ts)
- 新建：[run-spec-stage.ts](file:///Users/bytedance/code/game-agent/src/orchestration/run-spec-stage.ts)
- 新建测试：
  - [requirement-analyzer-orientation.test.ts](file:///Users/bytedance/code/game-agent/tests/requirements/requirement-analyzer-orientation.test.ts)
  - [run-spec-stage.test.ts](file:///Users/bytedance/code/game-agent/tests/requirements/run-spec-stage.test.ts)

改了什么：

1. **提示词方向中立化**：首句改为 `"...a 2D bullet-hell H5 shooter game generator that supports both vertical and horizontal orientations."`；新增 orientation 指令（同时产出 `orientation` 与一致的 `viewport`，范围 width 320–1440 / height 568–2560）；新增「未指定方向 → 默认 vertical + 竖版比例，属自动补全」。**既有约束（20 key 白名单串、schemaVersion、只输出 JSON、spiral/fan 参数、boss 相位递减、background assetQuery、有限英文词表、禁代码/命令/依赖、请求只是设计输入）逐条保留**，由 [requirement-analyzer.test.ts](file:///Users/bytedance/code/game-agent/tests/requirements/requirement-analyzer.test.ts)（未改动，byte-locked）与新增测试双重锚定。
2. **NL fixture（≥10）**：10 条，横版 3 / 竖版 4 / 未指定 2 / bounded_failure 1；覆盖 easy/medium/hard 与有无拾取；带方向用例产出对应 `orientation`，未指定用例标记 `orientationAutoCompleted=true` 并补全为 vertical。
3. **Orchestrator 最小骨架 `runSpecStage`**：接收 NL prompt → 调**注入的** analyzer（`RequirementAnalysis` 依赖，保证 Orchestrator 自身**不含 LLM 推理**）→ 复用确定性 [spec-playability-completion-policy.ts](file:///Users/bytedance/code/game-agent/src/requirements/spec-playability-completion-policy.ts) 做补全 → 合法结果落盘为 `spec-ready` JSON artifact，非法输入产出结构化 `bounded-failure` 记录（不抛给调用方）。**未碰** `run-composition-stage.ts` / `run-packaging-stage.ts`；artifact 为纯数据 JSON（GAP-1）。
4. **补全账本**：复用现有 `planSpecIntentLedger` / `completePlayableShooterGameSpec`，把补全项记入 `completion.notes`（可解释）。**未修改 `spec-intent-ledger.ts`**——其严格 schema 与哈希是确定性契约，本骨架经现有函数只读消费即满足需求，故做「零扩展」以避免动到哈希锁定契约（比「最小扩展」更保守，符合红线）。

验收证据：analyzer 提示词 9 例全绿（含「保留全部旧条款」用例）；`runSpecStage` 5 例全绿（spec-ready 携带 orientation、playability 补全 maxHealth→60、横版端到端、bounded-failure、JSON artifact 与返回值一致）。

---

## 三、Agent-γ —— S4：在 `src/gameplay/` 建 GameDesign 实体

改的文件（owner = γ，均为**新增**）：

- 新建：[game-design.ts](file:///Users/bytedance/code/game-agent/src/gameplay/game-design.ts)（新增内部设计契约，zod schema）
- 新建：[design-from-spec.ts](file:///Users/bytedance/code/game-agent/src/gameplay/design-from-spec.ts)（`designFromSpec` 骨架 + artifact 约定）
- 新建测试：[design-from-spec.test.ts](file:///Users/bytedance/code/game-agent/tests/gameplay/design-from-spec.test.ts)

改了什么：

1. **`GameDesign` 内部结构**：表达 orientation（一等决策）、hasBoss、弹幕种类构成（去重 kinds / totalPatterns / hasAimedPressure）、波次结构（复用调度器窗口）、boss 相位决策、粗粒度难度曲线；并预留**惰性** `playability` 扩展点（`selfCheckPerformed: false`）供后续 S5 接入。**⚠ 需 Mira 评审**：这是新增的设计层内部契约，不是改动 `shooter-game-spec.ts` 外部契约。
2. **`designFromSpec(spec)` 骨架**：只读消费已合法 spec；**复用** [enemy-wave-scheduler.ts](file:///Users/bytedance/code/game-agent/src/gameplay/enemy-wave-scheduler.ts)、[enemy-pattern-scheduler.ts](file:///Users/bytedance/code/game-agent/src/gameplay/enemy-pattern-scheduler.ts) 现有原语，不重复造轮子；spec 缺 orientation 时按 viewport 推断默认（与 Spec Agent 口径一致）。
3. **只做玩法决策骨架，不做可赢性自检**（`playability.selfCheckPerformed` 恒为 false，测试锚定）；结构上预留扩展点。
4. **artifact 落盘约定**：`toGameDesignArtifact` 产出纯数据信封（GAP-1），由调用方序列化，本模块不做 IO。

边界：只 import `ShooterGameSpec` 类型，未改其文件；未改 gameplay 现有 9 个原语；未接 `run-composition-stage`；未碰 Phaser / `src/runtime/*`。

验收证据：design 8 例全绿（schema 合法、orientation 镜像与默认、弹幕构成去重、复用调度器的波次窗口、boss 相位降序、无可赢性自检、artifact 可 JSON 序列化）。

---

## 四、文件所有权 & 保护文件自查

- **文件所有权零越界**：α 只改 `shooter-game-spec.ts` + 自己的 `tests/requirements/` 新文件；β 只改 `requirement-analyzer.ts` + 新建 `run-spec-stage.ts` / NL fixture / 自己的测试；γ 只在 `src/gameplay/` 新建文件 + `tests/gameplay/` 新文件。三者零文件重叠。
- **未触碰任何保护文件**：未改 `game-module-contract.ts`、`game-module-registry.ts`、注册表/加载器/admission、`src/runtime/kernel/`、`src/runtime/cocos/`、`src/verification/`、`src/repair/`、`src/opencode/`、Phaser legacy（`legacy/`、`game-template/vertical-shooter/`）、`package.json`/`pnpm-lock.yaml`/`tsconfig*`/vite/vitest、`.env*`、`AGENTS.md`、hash-lock 文档。
- **契约红线**：仅 α 按冻结契约（§2.1）对 `shooter-game-spec.ts` 做「新增可选字段 + 校验」，只增不减；β/γ 仅 `import` 类型。
- **未删/未弱化任何现有测试**；byte-locked 的 `requirement-analyzer.test.ts` 未改动仍全绿。
- **`.prettierignore` 说明**：该文件在工作树中已有一处**非本批次**的未提交改动（内容为登记 golden-cocos / reports / AGENTS.md 等 byte-locked 排除项，属既有环境变更）。本批次**未编辑该文件**，按「保留用户与无关未跟踪改动」原则原样保留。

---

## 五、验收标准 A–G 逐条结果

- **A（方向）**：✅ 横版用例 width>height 且 orientation=horizontal；竖版 height>width 且 orientation=vertical；未指定默认竖版；orientation↔viewport 一致性对横/竖/正方形边界用例正确（orientation 测试 + NL fixture 测试全绿）。
- **B（结构合法）**：✅ NL fixture 合法用例经 `parseShooterGameSpec` 全通过；bounded_failure 用例（"做个游戏。"）在 analyzer 长度门禁 / orchestrator 产出结构化失败记录。
- **C（补全可解释）**：✅ `runSpecStage` 的 `completion.notes` 记录 orientation 决策与 playability 补全（如 `player.maxHealth→60`），账本非空可读。
- **D（护栏只增不减）**：✅ `shooter-game-spec.ts` 改动仅「新增可选 orientation + 末相位>0 收窄 + 时间口径统一」；boss 必填、弹幕≥3、波次≥1 等下限**未改**；首相位=1 契约未动（并记录了 T8 文档前提冲突）。
- **E（Design 实体存在）**：✅ `src/gameplay/` 下有可运行 `designFromSpec` 骨架 + `tests/gameplay/` 测试；无可赢性自检；未接 Phaser；未改现有 9 个原语。
- **F（边界合规）**：✅ 见第四节；未新增直连 LLM 网关代码；Orchestrator 未内嵌 LLM 推理（analyzer 为注入依赖）；未启动监听端口。
- **G（check:fast 全绿）**：✅ `pnpm check:fast` exit 0；118 files / 584 tests passed；未删/未弱化现有测试。

---

## 六、发现的提示词前提问题（直接指出，不自行开工后续任务）

1. **§4 T8「首相位 `<1`」不可行**：与冻结 fixture 及 `batch3-encounter-hostile-library` 的「首相位=1」硬约束冲突，已改为安全的「末相位 `>0`」。
2. **§5.3「spec-intent-ledger 最小扩展」**：本骨架经现有函数只读消费即可满足；`spec-intent-ledger.ts` 是哈希锁定的确定性契约，扩展有破坏既有哈希/测试风险，故采取更保守的「零改动、只复用」。如后续确需在账本登记 orientation 补全项，建议作为独立评审任务。

## 七、剩余风险 / 建议下一步（不自行推进）

- 剩余风险：`runSpecStage` 目前用注入 analyzer；生产接线（closure over `analyzeRequirementWithMetadata`）与端到端 live 验证不在本批次 `check:fast` 覆盖内，属后续 admission/release 层工作。
- 建议下一步（待授权）：①将 orientation 决策纳入 `spec-intent-ledger` 作为可解释补全项（独立评审）；②S5 可赢性自检填充 `GameDesign.playability` 扩展点；③把 `run-spec-stage` 接入完整 orchestration 流水线并在 admission/release 层跑浏览器验证。

## 八、后续修复 —— check 扫描覆盖结构隐患（用户追加，已授权提交/推送）

隐患：`run-spec-stage.ts` 属 `src/orchestration/`，但其测试原先放在 `tests/requirements/`（凑巧在 `check:fast` 扫描范围内）。若将来有人把它挪到「更自然」的 `tests/orchestration/`，会**静默掉出** `check:fast` / `check:admission`（这些脚本按显式目录白名单跑 vitest，只有 `pnpm check` 的全量 `pnpm test` 才会兜底）。

处理（两层修复，均不弱化任何门禁）：

1. **把测试迁到自然归属并保住覆盖**：将 `run-spec-stage.test.ts` 移到 [tests/orchestration/](file:///Users/bytedance/code/game-agent/tests/orchestration/run-spec-stage.test.ts)，同时把 `tests/orchestration` 加入 `check:fast` 目录列表（`check:admission` 先跑 `check:fast`，自动继承覆盖）。放进 `check:fast` 而非仅 admission，是为了**不弱于**它原先在 fast 环里的现状。
2. **新增结构守卫测试**：[check-scan-coverage.test.ts](file:///Users/bytedance/code/game-agent/tests/orchestration/check-scan-coverage.test.ts) 从 `package.json` 解析 `check:fast`/`check:admission` 实际扫描的目录，断言 `tests/` 下每个含 `*.test.ts` 的目录都被 admission 覆盖（`docs`/`evaluation` 为显式登记的 release-only 例外，且例外表不得含失效项）。此后**任何**新测试目录静默掉出快/准入门禁都会**直接报红**，把隐患从「某个文件」升级为「结构级」根治。

验收：`pnpm check:fast` → exit 0，119 文件 / 587 测试全绿（新增 3 条守卫 + 迁移 5 条编排器测试）。

- Git：本节改动经用户显式授权，已提交并 push 到远端（见汇报）。
