# PARALLEL_TASK_REPORT — S6a + S7（玩法下限迁出 · 第一步）

> HEAD 起点：`32c7ba0`。分支：`chore/cocos-refactor-planning-and-typecheck-fix`。
> 本报告分节给证据；单列「文件所有权零越界」与「是否触碰 boss 必填 / waves 可选」自查。

---

## 一、改了什么（总览）

- **S6a**：把 `bulletPatterns` 数量下限从 `.min(3)` 放宽为 `.min(1)`（保留 `.max(24)`）；同步需求分析器提示词口径（新增一句「弹幕数量由玩法需要决定，至少 1 种，不强制特定数量」）；新增 `tests/requirements/bullet-pattern-count.test.ts` 证明 1 种通过、0 种被拒。
- **S7-α**：把 Verifier 的玩法类断言条件化——`requiredWaves` schema `.min(1)→.min(0)`；末局「必须赢」断言由无条件改为跟随 `expectedOutcome.won`；boss/pickup 证据继续严格跟随 `bossDefeated` 结局（并补注释强化意图）。**技术类断言一字未动。** 更新/新增 `tests/verification/browser-assertion-profile.test.ts` 用例。
- **S7-β**：`browser-verification-stage.ts` **零改动**（α 未改任何导出签名/类型形状，见下）。
- **S7-γ**：`browser-gate-spec.ts` 与其测试 **零改动**（boss 在本批次仍必填，fixture 无条件写 `spec.boss.*` 合法）。

---

## 二、改了哪些文件

| 文件                                                   | 归属 | 变更                                                                                             |
| ------------------------------------------------------ | ---- | ------------------------------------------------------------------------------------------------ |
| `src/requirements/shooter-game-spec.ts`                | S6a  | 1 行：`bulletPatterns .min(3)→.min(1)`（保留 `.max(24)`）                                        |
| `src/requirements/requirement-analyzer.ts`             | S6a  | +1 行提示词措辞；未改 `SHOOTER_GAME_SPEC_TOP_LEVEL_KEYS`；未删结构性约束                         |
| `tests/requirements/bullet-pattern-count.test.ts`      | S6a  | 新增；1 弹幕接受 / 0 弹幕拒绝（并核验拒绝来自 `bulletPatterns` 的 `too_small`）                  |
| `src/verification/browser-assertion-profile.ts`        | S7-α | `requiredWaves.min(0)`；win 断言条件化；boss/pickup 门控注释强化                                 |
| `tests/verification/browser-assertion-profile.test.ts` | S7-α | 保留原 4 个用例；新增 5 个「跟随声明」用例（无 boss / 空 waves / 声明的 wave 仍校验 / win 门控） |

`git diff --stat`（仅列本批次相关文件；其余 4 个为**任务前既有**未跟踪/未提交改动，见第五节）：

```
 src/requirements/requirement-analyzer.ts           |   1 +
 src/requirements/shooter-game-spec.ts              |   2 +-
 src/verification/browser-assertion-profile.ts      |  18 +-
 tests/verification/browser-assertion-profile.test.ts | 187 +++++++++++++++++++++
 tests/requirements/bullet-pattern-count.test.ts    | (new)
```

---

## 三、跑了什么验收（逐条证据）

### 3.1 `tsc --noEmit`

```
tsc OK
```

（在 `pnpm check:fast` 的 `&&` 链中 tsc 先于 format:check 执行并通过；单独复跑亦 OK。）

### 3.2 Prettier（仅本批次触碰文件）

```
Checking formatting...
All matched files use Prettier code style!
```

> 说明：`pnpm check:fast` 的 `format:check` 阶段对 3 个文件报 warn——`docs/CURRENT_STATUS.md`、`docs/HANDOFF.md`、`tests/orchestration/check-scan-coverage.test.ts`。这 3 个均为**本任务开始前就已存在的未提交改动**，不属于本批次，也不在授权触碰范围内，故未改动。

### 3.3 check:fast 测试范围（tests/requirements + gameplay + orchestration + modules + runtime + samples）

```
 Test Files  120 passed (120)
      Tests  589 passed (589)
```

其中新增：`tests/requirements/bullet-pattern-count.test.ts (2 tests)` 全绿。

### 3.4 `vitest run tests/verification`（check:fast 不含，S7 必须手动跑）

```
 RUN  v4.1.10 /Users/bytedance/code/game-agent

 ✓ tests/verification/verification-finding.test.ts (2 tests) 3ms
 ✓ tests/verification/browser-gate-spec.test.ts (1 test) 4ms
 ✓ tests/verification/browser-assertion-profile.test.ts (9 tests) 8ms
 ✓ tests/verification/browser-verification-v14-evidence.test.ts (7 tests) 1ms

 Test Files  4 passed (4)
      Tests  19 passed (19)
```

`browser-assertion-profile.test.ts` 由 4 → 9：原 4 个用例全部保留，新增 5 个「跟随声明」用例。

---

## 四、S6a / S7 验收逐条结果

### S6a

- ✅ `parseShooterGameSpec` 接受 1 弹幕（新用例 `accepts a spec that declares a single bullet pattern`）。
- ✅ 拒绝 0 弹幕，且拒绝确来自 `bulletPatterns` 的 `too_small`（新用例 `still rejects a spec that declares no bullet patterns`）。
- ✅ `git diff` 只动 `shooter-game-spec.ts`（一行）、`requirement-analyzer.ts`（措辞）、`tests/requirements/` 新增文件。
- ✅ 未改 `SHOOTER_GAME_SPEC_TOP_LEVEL_KEYS`；未动 `requirement-analyzer-orientation.test.ts`；spiral/fan 结构性约束保留。

### S7

- ✅ **技术断言零损失**：资源上限（active/peak enemy bullets、player bullets、pickups cap）、武器 salvo 执行、scoring 一致（play+end）、asset mode/catalog 加载与渲染断言在 diff 中全部保留、未删。
- ✅ **玩法断言已条件化**：
  - 无 boss 结局的 spec：`requiredBossPatternIds`、`requiredPickupIds` 为 `[]`（用例 `does not require Boss or pickup evidence for a non-Boss outcome`）。
  - 非「求赢」结局：win 断言不再无条件触发（用例 `gates the win requirement on the declared outcome`）。
  - 空 waves：`requiredWaves` 可为空且不被误报缺波次（用例 `accepts a Spec with no required wave without inventing one`）。
- ✅ **已声明的仍校验**：声明了 wave 的 spec，快照缺该 wave 仍报 `wave <id> did not spawn`（用例 `still validates any wave the Spec does declare`）。
- ✅ **回归**：`tests/verification` 19/19 绿；check:fast 测试范围 589/589 绿；tsc 通过。
- ✅ **边界**：未碰 boss 必填约束、未碰 `src/modules|runtime|gameplay`、未碰 composition/packaging、未删除或改弱任何测试。

---

## 五、自查

### 5.1 文件所有权零越界

- S6a 仅动 `shooter-game-spec.ts`（1 行）、`requirement-analyzer.ts`（措辞）、新增 `tests/requirements/bullet-pattern-count.test.ts`。
- S7-α 仅动 `src/verification/browser-assertion-profile.ts` 与 `tests/verification/browser-assertion-profile.test.ts`（α 独占 owner）。
- β 文件 `browser-verification-stage.ts`、γ 文件 `browser-gate-spec.ts`（+其测试）**零改动**。
- 未触碰：hash-lock 文档、Phaser legacy、`src/runtime/kernel|cocos`、`src/repair`、`src/opencode`、`src/modules`、`src/runtime`、注册表/加载器/admission、`game-module-contract.ts`/`game-module-registry.ts`、`run-composition-stage.ts`/`run-packaging-stage.ts`、`package.json`/lockfile/`tsconfig*`/vite/vitest 配置、`.env*`、`AGENTS.md`、`src/gameplay/`。

### 5.2 是否触碰 boss 必填 / waves 可选（必须为否）

- 是否把 `boss` 改为可选？**否。**
- 是否把 `enemyWaves.min(1)` 降为 `min(0)`？**否。**（改的是 Verifier 内部 `requiredWaves` 断言下限，非 spec 的 `enemyWaves`。）
- 是否做了任何 S6b 动作？**否。**

### 5.3 β 零改动论证

α 的两处 schema 改动中，`requiredWaves.min(1)→.min(0)` **不改变** Zod 推导出的 TS 类型（两种下限的 `.parse` 结果均为 `RequiredWave[]`）；另两处改动只在 `caseAwareEndSnapshotIssues` / `deriveCaseAwareBrowserAssertions` **函数体内部**，未改任何导出函数签名或导出类型形状。因此 `browser-verification-stage.ts` 无需适配，实测 tsc 通过、`tests/verification` 全绿即为佐证。

### 5.4 γ 零改动论证

S7 未放开 boss（仍必填），`createBrowserGateSpec()` 无条件写 `spec.boss.*` 合法且必要；其测试 `browser-gate-spec.test.ts` 断言的是 pattern/boss phase 结构，与 α 的条件化互不影响，实测 1/1 绿。**结论：零改动**；若后续 S6b 放开 boss，需另行评估该 fixture。

---

## 六、提示词前提核验

逐行核对，行号/字段/依赖全部与提示词一致，未发现前提错误：

- `shooter-game-spec.ts` L189 原为 `.min(3).max(24)` ✓
- `spec-completion-policy.ts` 用 `bulletPatterns[0]!`（要求非空，`.min(1)` 已保住）✓ ，全项目无「弹幕<3 被拒」负向测试 ✓
- `browser-assertion-profile.ts` `requiredWaves` schema 原为 `.min(1)`（第 42 行）✓；`caseAwareEndSnapshotIssues` 原为无条件 `if (!snapshot.won)` ✓；`requiredBossPatternIds` 原已 `bossOutcome ? ... : []` ✓
- `browser-gate-spec.ts` / `browser-verification-stage.ts` / `src/modules`、`src/runtime` 多处无条件访问 `spec.boss.*`（故本批次不放开 boss 是正确决定）✓
- 补充说明：受保护的 `run-packaging-stage.ts` 仅以 `CaseAwareBrowserAssertionsSchema.nullable().optional()` 方式引用该 schema，α 的放宽不影响其类型/校验。

---

## 七、剩余风险

- α 的 win 门控当前对所有已派生结局都保持既有行为（`outcomeFor` 目前只产出 `won: true` 的三种结局）；「非求赢」分支尚无 schema 层入口，测试以白盒方式验证该分支条件化。真正引入「非赢」合法结局需在后续批次扩展 `ExpectedOutcomeSchema`（超出本批次范围）。
- 3 个既有未提交文件的 Prettier warn 会使 `pnpm check:fast` 整链 `&&` 提前退出。这不是本批次引入，但在这些文件被格式化/提交前，直接跑 `pnpm check:fast` 会在 format 阶段失败；本报告以「touched 文件 prettier 全绿 + 手动跑测试范围」佐证本批次质量。

---

## 八、建议下一步

- **S6b（需另行授权碰 `src/modules|runtime`）**：在 S7 铺好条件化断言的基础上，把 `boss` 改为可选、`enemyWaves` 放宽至 `min(0)`，并同步修正所有无条件访问 `spec.boss.*` / 假设有波次的消费方（`browser-verification-stage.ts`、`browser-gate-spec.ts`、`src/modules/`、`src/runtime/`）。这是独立批次，不在本轮范围。
- 由用户决定是否单独处理那 3 个既有未提交文件的 Prettier 告警（属文档治理/既有改动，非本批次）。

---

## 九、Git

本批次改动已完成并本地验收通过。**Git 写操作需用户显式授权**：请确认后我再推送分支（提示词末尾要求推送，但按项目铁律需显式授权，故在此等待放行）。
