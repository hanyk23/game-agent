# Phaser 退役归档准备清单（不动构建）

更新时间：2026-07-25
状态：仅准备（本轮不改任何源码 / 构建 / 受保护文件，不移动任何文件）
用途：为「把 Phaser 运行时归档到 `legacy/` 并从构建/验证/打包移除」这一动作，事先列清全部文件、引用与测试耦合点。**这是一份可执行前的盘点，不是执行本身。**

## 为什么本轮不物理执行

- Phaser 目前是**唯一活跃引擎**：唯一模板 `game-template/vertical-shooter/` 的入口与 scene 全部依赖 Phaser，仓库中**尚不存在** Cocos 替代品（`game-template/cocos-shooter/`、`src/runtime/kernel/`、`src/runtime/cocos/` 均不存在）。
- 构建 / 验证 / 打包接线全部位于**受保护目录**（`src/orchestration/`、`src/verification/`、`package.json`、`tests/`）。真正移除 Phaser 必然要改这些文件，与本轮「禁止改 orchestration/verification、不改测试」以及 `AGENTS.md` 白名单直接冲突。
- 重构计划把 Phaser 依赖移除定位在 **M6 门禁**（见 `docs/COCOS_REFACTOR_PLAN.md`），前提是 M1–M5 已产出一个通过 parity 验证的 Cocos 包。当前处于 **M0**。

因此本轮仅盘点、不落刀。物理迁移应在 Cocos 就位后，由一次显式授权、可以触碰上述受保护文件的轮次执行。

## A. 应移动到 `legacy/` 的 Phaser 运行时文件

真正 `import ... from "phaser"`（值或类型）的运行时文件——归档的核心对象：

- `game-template/vertical-shooter/src/main.ts`（`new Phaser.Game`、`Phaser.Scale.FIT` 引导）
- `game-template/vertical-shooter/src/runtime-assets.ts`（`import type Phaser`）
- `game-template/vertical-shooter/src/runtime-kernel/phaser-runtime-kernel.ts`（引擎缝，实现 `contracts.ts` 的 `RuntimeKernel`）
- `game-template/vertical-shooter/src/scenes/boot-scene.ts`
- `game-template/vertical-shooter/src/scenes/start-scene.ts`
- `game-template/vertical-shooter/src/scenes/play-scene.ts`
- `game-template/vertical-shooter/src/scenes/end-scene.ts`

与之强绑定、需一并评估归档的模板资产：

- `game-template/vertical-shooter/index.html`（`<script src="/src/main.ts">` 入口）
- `game-template/vertical-shooter/spec/demo-spec.ts`（被验证层 `browser-gate-spec.ts` 直接 import）
- `game-template/vertical-shooter/src/generated/*`、`src/test-bridge.ts`、其余 `runtime-kernel/*browser-runtime*.ts` 等：这些不直接 import phaser，但同属该模板工程；是否随迁需在执行轮次按「引擎无关 kernel vs Cocos 适配」的目标重新归位，而非整体照搬进 `legacy/`。

> 注意：`AGENTS.md` 要求「engine-neutral 逻辑放 `src/runtime/kernel/`、Cocos 适配放 `src/runtime/cocos/`」。`runtime-kernel/contracts.ts`、`core-services.ts` 等**引擎无关**部分不应进 `legacy/`，而应在 Cocos 轮次抽取到 `src/runtime/kernel/`。归档时须区分「引擎相关（进 legacy）」与「引擎无关（留用/上移）」，不可一刀切。

## B. 移动后会断裂的受保护引用（本轮禁止改，执行轮必须同步处理）

### B1. 编排 / 打包（`src/orchestration/` — 禁改）

- `src/orchestration/run-composition-stage.ts`
  - `RUN_TEMPLATE_SOURCE_FILES`（约 47–111 行）把 Phaser 的 `main.ts`、`runtime-assets.ts`、`phaser-runtime-kernel.ts`、四个 scene 等全部写死进构建白名单。
  - `executeFixedViteBuild` / `RUNTIME_CONFIG_PATH` / `templateDirectory` 全部指向 `game-template/vertical-shooter`。
  - 影响：文件一旦移动，白名单里的拷贝源路径失效，组装阶段 `copyRegularFile` 会抛错。

### B2. 验证（`src/verification/` — 禁改）

- `src/verification/browser-gate-spec.ts` 第 1 行 `import { demoShooterGameSpec } from "../../game-template/vertical-shooter/spec/demo-spec.js"`。
- `src/verification/browser-verification-stage.ts` 约 399–469、2777 行，硬编码引用各 scene 与 `vertical-shooter`。

### B3. 依赖与脚本（`package.json` — 禁改）

- `dependencies.phaser: "3.90.0"`（移除依赖前须完成 license / package / 陈旧引用审计，见 M6）。
- 脚本 `typecheck` 内 `tsc -p game-template/vertical-shooter/tsconfig.json`；`template:build` / `check` 内 `vite build game-template/vertical-shooter`。
- 说明：本轮验收要求的 `pnpm check:fast` **目前不存在**（`package.json` 仅有 `check`），属分层检查方案（`docs/DEVELOPER_FAST_PATH_PLAN.md`）尚未落地，非本任务范围。

### B4. 组合脚本（`scripts/` — 非本轮范围）

- `scripts/compose-template.ts`、`scripts/evaluate-bounded-repair.ts` 引用 `game-template/vertical-shooter/...`。

## C. 会被移动破坏、且本轮禁止删/改的测试（执行轮由用户决定去留）

以下测试直接 import 或硬编码 Phaser 模板路径；物理移动文件会使其失败。本轮**不 skip、不改**，仅登记，供后续执行轮次由用户决定是标 `skip` 还是迁移：

- `tests/runs/run-composition-stage.test.ts`：约 123–131 行断言 `RUN_TEMPLATE_SOURCE_FILES` **精确等于**含 `phaser-runtime-kernel.ts` 与各 scene 的列表。
- `tests/runtime/runtime-kernel.test.ts`：import `.../vertical-shooter/src/runtime-kernel/core-services.js`，并引用 `scenes/play-scene.ts`。
- `tests/runtime/runtime-kernel-cancellation.test.ts`：`vi.mock("phaser", ...)` + import `.../phaser-runtime-kernel.js`。
- `tests/verification/verification-finding.test.ts`：硬编码 `scenes/play-scene.ts` 路径。
- `tests/repair/bounded-repair-controller.test.ts`：`targetPath = "game-template/vertical-shooter/src/scenes/play-scene.ts"`。
- `tests/modules/*`、`tests/runs/batch3-*`：多处以字符串 `engine: { id: "phaser", version: "3.90.0" }` 出现（契约/manifest 语义值，非运行依赖）。

## D. 仅为字符串 / schema 值的 Phaser 引用（属契约层，**不随本次归档变动**）

这些是模块 manifest / 契约里的引擎标识字符串或类型字面量，属受保护的契约/注册表，退役 Phaser **运行时**不应改动它们（改契约需单独授权轮次）：

- `src/modules/game-module-contract.ts`（`z.literal("phaser")` 多处）
- `src/modules/game-module-resolver.ts`、`game-module-contract-fixtures.ts`
- `src/modules/batch1-*.ts`、`batch2-*.ts`、`batch3-legacy-adapter.ts`（`engine: { id: "phaser", ... }`）
- `src/gameplay/player-firing-planner.ts`（注释中提及 Phaser timer 语义）

## E. 建议的执行顺序（留待后续显式授权轮次）

1. 先完成 Cocos 模板与 kernel/adapter 分层（M1–M4），使产品有可构建引擎。
2. 在一次显式授权、允许触碰 `src/orchestration/` `src/verification/` `package.json` `tests/` 的轮次中：
   - 把 A 节「引擎相关」文件 `git mv` 进 `legacy/`；引擎无关部分上移到 `src/runtime/kernel/`。
   - 同步更新 B 节全部受保护引用，改指 Cocos 模板。
   - 按用户决定处理 C 节测试（skip 或迁移），不静默删除。
   - 完成 license/package 审计后再移除 `package.json` 的 `phaser` 依赖（M6）。
3. 最终以 release 层门禁验证竖版 + 横版均能构建/验证/打包通过。
