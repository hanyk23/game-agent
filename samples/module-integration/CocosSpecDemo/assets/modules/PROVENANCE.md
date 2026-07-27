# PROVENANCE — 模块集成 sanity（方案 B）逐字节副本登记

本文件登记 `samples/module-integration/CocosSpecDemo/` 内**全部** `src/` 复用副本的
来源与 SHA-256。所有副本均为 `cp` 逐字节复制，**未做任何改写**；`src/**` 只读，未改动。

> 校验命令（在仓库根执行）：
> ```
> shasum -a 256 <src 源文件> <Demo 副本>
> ```
> 两行 hash 必须相等（IDENTICAL）。

## 一、任务要求的 13 个副本

### 引擎中立玩法规划（6，`src/gameplay/` → `assets/gameplay/`，Cocos 打包）

| 副本（assets/gameplay/） | 源（src/gameplay/） | SHA-256 | 一致 |
|---|---|---|---|
| `bullet-pattern-planner.ts` | 同名 | `86c04fcc1974930ce4807ca2249c94b986354215ec1aa15303176fcb7c705f5f` | IDENTICAL |
| `enemy-wave-scheduler.ts` | 同名 | `0227501e56d791463f1558356b9e5a3ae06ef048676d5fd4b6809c53c4529591` | IDENTICAL |
| `player-firing-planner.ts` | 同名 | `f72eb4dd652867aea71bc80f26d5671573338d3ed14c1742646807541846f077` | IDENTICAL |
| `scoring-state.ts` | 同名 | `8e861299d396ddd1aeeba1f7b192036386f207adad8e182c1b89cff3e65c998d` | IDENTICAL |
| `pickup-planner.ts` | 同名 | `3d8edd5a43e246cfd9019d3ea544e588f24be6a7a079595afddfec93bf7b2c8b` | IDENTICAL |
| `game-outcome.ts` | 同名 | `17828514acdcf1a0e6a5d9194e5978f7df1f024c2fbc736e2106b3ffb298f249` | IDENTICAL |

### Contract 模块（2，`src/modules/` → `assets/modules/`，Cocos 打包）

| 副本（assets/modules/） | 源（src/modules/） | SHA-256 | 一致 |
|---|---|---|---|
| `game-module-safe-counter.ts` | 同名 | `e9597a91b2e91c8ee285046c169792b511e5756c0804e9a53626ae5e6269d742` | IDENTICAL |
| `game-module-entity-directory.ts` | 同名 | `57272b463f7add29f980f72fe664f82e2c6fe8925c8602e88e60ed8a5f47c7d4` | IDENTICAL |

### 引擎中立 runtime 编译（3，`src/runtime/`）

> **重要（GAP-1）**：`shooter-game-composer.ts` 与 `resource-budget.ts` 的 import 闭包依赖
> `zod` + `node:crypto`，**无法在 Cocos 运行时执行**（详见根目录报告）。因此这 3 个 runtime
> 模块被放到 **`chain/`（仅 Node 执行，不进 Cocos 扫描）**，只有类型无副作用的
> `runtime-game-config.ts` 另存一份到 `assets/runtime/` 供引擎侧类型引用。

| 副本 | 源（src/runtime/） | SHA-256 | 一致 |
|---|---|---|---|
| `chain/runtime/shooter-game-composer.ts` | `shooter-game-composer.ts` | `90cf30a0e11c85fbe77816bcfc4286ff593f0ac49dce7af631cfce9039a77271` | IDENTICAL |
| `chain/runtime/resource-budget.ts` | `resource-budget.ts` | `95d995322397503f55ea9261dc05a2bf1e7975bf9edb0d34e8e17009f0c765de` | IDENTICAL |
| `chain/runtime/runtime-game-config.ts` | `runtime-game-config.ts` | `5ec5a3cae9ea707fa4bcff5a43739bbbad442cdb5804e5e958daf74a8597079c` | IDENTICAL |
| `assets/runtime/runtime-game-config.ts`（同源第二份） | `runtime-game-config.ts` | `5ec5a3cae9ea707fa4bcff5a43739bbbad442cdb5804e5e958daf74a8597079c` | IDENTICAL |

### 依赖闭包 spec/asset（2，任务点名的）

| 副本 | 源 | SHA-256 | 一致 |
|---|---|---|---|
| `chain/requirements/shooter-game-spec.ts` | `src/requirements/shooter-game-spec.ts` | `43ca2873897eaaa5ab297316aa7dd8c67a00f1e2e913f48a0320a9e0825dc25b` | IDENTICAL |
| `chain/assets/asset-selection-plan.ts` | `src/assets/asset-selection-plan.ts` | `56f7be4129b66cd615ee102be532ec19a352b1ea0978807fa3ef7a81037efc1c` | IDENTICAL |

## 二、GAP-1 强制新增的 asset 闭包副本（超出任务预期的 4 个）

任务假设 composer 的依赖闭包只有 2 个 spec/asset 文件；**实测 `asset-selection-plan.ts`
的 import 链还需以下 4 个文件**（`asset-query-grounding.ts` 更进一步 import 了 `node:crypto`），
否则连 Node 侧 `composeShooterGame` 都 import 失败。全部逐字节复制进 `chain/assets/`：

| 副本 | 源（src/assets/） | SHA-256 | 一致 |
|---|---|---|---|
| `chain/assets/asset-catalog.ts` | `asset-catalog.ts` | `814020fbea327e98558c7dcad173291c92c3c8198926eec3d6ceeaf2ac246277` | IDENTICAL |
| `chain/assets/asset-license-policy.ts` | `asset-license-policy.ts` | `96516e9356309964c6dffd809f613c2df1157d5aaaed8553b13ea0ad522cf297` | IDENTICAL |
| `chain/assets/asset-query-grounding.ts` | `asset-query-grounding.ts` | `527e3ee40dc928529c4d1f109f824d063f534c7213f63f17b5a40c189f437ba5` | IDENTICAL |
| `chain/assets/asset-retrieval.ts` | `asset-retrieval.ts` | `83945ef572ada09e2c8e6c34517f04be3539a577089257b0e223a677ef866a69` | IDENTICAL |

## 三、Spec fixture 物化

- 物化命令（不改 `tests/fixtures/create-valid-spec.ts`）：
  ```
  tsx -e 'import {createValidSpec} from "./tests/fixtures/create-valid-spec.ts";
          import {writeFileSync} from "node:fs";
          writeFileSync("…/assets/spec/valid-spec.json",
            JSON.stringify(createValidSpec(), null, 2) + "\n");'
  ```
- `assets/spec/valid-spec.json` SHA-256：`415fcc9be313ec672b960494710e698951d70b4370f54850f9fef55a9a5095d6`（5333 bytes）
- fixture 源 `tests/fixtures/create-valid-spec.ts` SHA-256：`b324e413cc8813f053152db6ce32173f52d4d2c9f14bc80b1ae29f711a428f71`（只读，未改）
- `assets/resources/config/runtime-config.json`：由 `tools/build-runtime-config.ts` 调用**真实**
  `composeShooterGame` 物化，非手写；SHA-256 见报告判据 D。

## 四、素材副本（5 张，与 golden 同源，CC0）

`assets/resources/art/` 下 5 张 PNG 与 `samples/golden-cocos/CocosShooter/assets/resources/art/`
逐字节相同（后者又等于仓库 `assets/corpus/` 的 CC0 源）。license / provenance 详见同目录
`PROVENANCE.md`（从 golden 复制）。

## 五、合计

- 任务要求副本：**13**（6 gameplay + 2 contract + 3 runtime + 2 spec/asset）——全部 IDENTICAL。
- GAP-1 强制新增：**4**（asset 闭包）+ **1**（`runtime-game-config.ts` 在 assets/ 的第二份）——全部 IDENTICAL。
- 源码 `src/**` 全程只读，无一字节改动。
