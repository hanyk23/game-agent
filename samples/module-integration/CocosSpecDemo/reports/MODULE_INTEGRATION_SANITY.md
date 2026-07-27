# 模块集成 Sanity（方案 B）验收报告 — 打通 spec → runtime → Cocos 全链路

> 性质：一次性 sanity check，用来暴露"契约 → runtime → 引擎"这一路的**真实整合缺口**，
> 为 Phase 3-B（Generator 深集成）喂输入。**非**黄金样本 / 模板 / 新契约；不进
> `BASELINE_LOCK`、不进 `check:fast` 守卫。`src/**` 全程只读。
>
> 产出目录：`samples/module-integration/CocosSpecDemo/`（与 golden-cocos 平级独立）。

---

## 0. 结论速览

- **六条判据 A–F 全绿。**
- **最大的真实缺口（GAP-1）**：任务把 `composeShooterGame` 定为 Cocos host 的 in-engine 入口，
  但它**无法在 Cocos 运行时执行**——其 import 闭包依赖 `zod`（v4 在 Cocos SystemJS executor 下
  初始化失败）+ `node:crypto`（"Node.js builtin modules are not provided by Cocos Creator"）。
  composition 本质是 **orchestration-time（Node）** 关注点。已按铁律 9「在 Demo 侧写薄适配、
  不改上游」处理：**真实** composer 在 Node 侧跑（smoke 现跑 / build-runtime-config 预跑），
  输出 `RuntimeGameConfig` 物化成 JSON，Cocos host 逐字节消费——**无 mock、无禁用 shim、无改 src**。
- **纠正了任务的一处前提**：任务称"`bullet-pattern-planner` 只识别 `fan/aimed/wave/rain/burst`"。
  实测 planner 的 fallthrough 分支额外覆盖 `radial`（rotation=0 均匀环）/`spiral`/`rotatingRing`，
  **支持 spec 允许的全部 8 种 pattern**。fixture 用的 `radial/spiral/fan` **无需任何映射适配**即通。
  → **pattern 词汇表差集为空**（详见 §3）。

---

## 1. 六条判据 — 命令 + 真数字

### 判据 A：13（实为 18）个模块副本 SHA-256 与 src 逐字节相等

命令：`shasum -a 256 <src> <copy>` 逐组对比（脚本见 `assets/modules/PROVENANCE.md`）。

| # | 模块 | 副本位置 | SHA-256 | 结果 |
|---|---|---|---|---|
| 1 | bullet-pattern-planner.ts | assets/gameplay/ | `86c04fcc…705f5f` | IDENTICAL |
| 2 | enemy-wave-scheduler.ts | assets/gameplay/ | `0227501e…529591` | IDENTICAL |
| 3 | player-firing-planner.ts | assets/gameplay/ | `f72eb4dd…1846f077` | IDENTICAL |
| 4 | scoring-state.ts | assets/gameplay/ | `8e861299…3e65c998d` | IDENTICAL |
| 5 | pickup-planner.ts | assets/gameplay/ | `3d8edd5a…bf7b2c8b` | IDENTICAL |
| 6 | game-outcome.ts | assets/gameplay/ | `17828514…b298f249` | IDENTICAL |
| 7 | runtime-game-config.ts | assets/runtime/ + chain/runtime/ | `5ec5a3ca…597079c` | IDENTICAL（两份同源） |
| 8 | game-module-safe-counter.ts | assets/modules/ | `e9597a91…6269d742` | IDENTICAL |
| 9 | game-module-entity-directory.ts | assets/modules/ | `57272b46…5f47c7d4` | IDENTICAL |
| 10 | shooter-game-composer.ts | chain/runtime/ | `90cf30a0…9a77271` | IDENTICAL |
| 11 | resource-budget.ts | chain/runtime/ | `95d99532…f0c765de` | IDENTICAL |
| 12 | shooter-game-spec.ts | chain/requirements/ | `43ca2873…825dc25b` | IDENTICAL |
| 13 | asset-selection-plan.ts | chain/assets/ | `56f7be41…037efc1c` | IDENTICAL |
| 14 | asset-catalog.ts | chain/assets/ | `814020fb…2ac246277` | IDENTICAL |
| 15 | asset-license-policy.ts | chain/assets/ | `96516e93…522cf297` | IDENTICAL |
| 16 | asset-query-grounding.ts | chain/assets/ | `527e3ee4…c189f437ba5` | IDENTICAL |
| 17 | asset-retrieval.ts | chain/assets/ | `83945ef5…ef866a69` | IDENTICAL |

**`ALL_IDENTICAL=1`。**

> **依赖闭包比预期大（缺口伴生现象）**：任务假设 composer 闭包只需 2 个 spec/asset 文件，
> 实测 `asset-selection-plan.ts` 还 value-import 了 4 个 asset-\* 文件（其一
> `asset-query-grounding.ts` 又拉 `node:crypto`）。逐字节复制的 17 个 .ts + 1 份重复 = 18 副本，
> 全部 IDENTICAL。spec fixture `valid-spec.json` 物化 SHA-256 =
> `415fcc9be313ec672b960494710e698951d70b4370f54850f9fef55a9a5095d6`（5333B），
> fixture 源 `tests/fixtures/create-valid-spec.ts` 未改。

### 判据 B：smoke.ts portrait/landscape 跑到终态 + 五要素证据

命令：
```
tsx tools/build-runtime-config.ts   # 真实 composer 在 Node 跑，物化 RuntimeGameConfig
tsx tools/smoke.ts
```
build-runtime-config 输出（证明 composer 真跑）：
```
composed RuntimeGameConfig -> …/assets/resources/config/runtime-config.json
schedule.bossStartMs=30000 schedule.roundTimeLimitMs=210000 resourceBudget.maxEnemyBullets=260 resolvedAssets.mode=legacy-geometric composition.resourceProfile=balanced
```
smoke 输出（真数字）：
```
[portrait] scheduled boss window: [30000,210000]ms
[portrait] budget cap hit: 23 次
[portrait] state=lost reason=healthDepleted frames=714 elapsedMs=11900 score=780 profile=balanced assets=legacy-geometric
[portrait] stats: maxCombo=3 comboBuildups=2 pickups=2 graze=8 shieldAbsorb=0 capHits=23 maxEnemyBullets=260 maxPlayerBullets=16
[portrait] => PASS
[landscape] scheduled boss window: [30000,210000]ms
[landscape] budget cap hit: 22 次
[landscape] state=lost reason=healthDepleted frames=701 elapsedMs=11683 score=770 profile=balanced assets=legacy-geometric
[landscape] stats: maxCombo=3 comboBuildups=2 pickups=2 graze=7 shieldAbsorb=0 capHits=22 maxEnemyBullets=260 maxPlayerBullets=16
[landscape] => PASS
smoke_exit=0
```
五要素全绿（两朝向都满足）：

| 要素 | portrait | landscape | 来源模块 |
|---|---|---|---|
| combo ≥ 2 至少一次 | maxCombo=3, comboBuildups=2 ✅ | maxCombo=3, comboBuildups=2 ✅ | scoring-state |
| pickup 生效至少一次 | pickups=2 ✅ | pickups=2 ✅ | pickup-planner |
| graze 至少一次 | graze=8 ✅ | graze=7 ✅ | scoring-state |
| `schedule.bossStartMs>0` 被 core 消费（打印 boss window） | `[30000,210000]ms` ✅ | `[30000,210000]ms` ✅ | composer→core |
| `resourceBudget.maxEnemyBullets` 当活跃上限（打印 cap hit） | `23 次`（cap=260）✅ | `22 次` ✅ | bullet-pattern-planner |

### 判据 C：build.sh portrait & landscape 均 EXIT_CODE=36 且 index.html present

```
$ bash tools/build.sh portrait  portrait   → === EXIT_CODE=36 …===  index.html present: yes
$ bash tools/build.sh landscape landscape  → === EXIT_CODE=36 …===  index.html present: yes
```
两朝向 **EXIT_CODE=36**（36=success），`index.html present: yes`。

### 判据 D：产物 index.js grep 到每个模块独有字符串（≥11 组）

> **注意 GAP-1 的结构后果**：8 个引擎侧模块（6 gameplay + 2 contract）编译进 `assets/main/index.js`；
> 3 个 runtime 模块（composer/resource-budget/runtime-game-config）在 Node 跑，**其代码不进引擎 bundle，
> 其输出被烘焙进 bundle 内的 `runtime-config.json`**。两者都有可 grep 证据。

引擎侧模块导出符号（`grep -oc` on `assets/main/index.js`）：

| 符号 | 计数 | 模块 |
|---|---|---|
| planBulletEmission | 2 | bullet-pattern-planner |
| planEnemyWaveSchedule | 2 | enemy-wave-scheduler |
| scheduledEnemySpawnMs | 2 | enemy-wave-scheduler |
| planPlayerFiring / planPlayerWeaponEmission | 2 / 2 | player-firing-planner |
| createScoringState / awardDefeatScore / awardGrazeScore / isGrazeContact / expireCombo | 2 / 2 / 2 / 2 / 2 | scoring-state |
| planPickupSchedule / applyPickupEffect / applyShieldedPlayerDamage / canSpawnPickup | 2 / 2 / 2 / 2 | pickup-planner |
| evaluateGameOutcome | 2 | game-outcome |
| SafeMonotonicCounterV1 | 2 | game-module-safe-counter |
| DeterministicLogicalEntityDirectory | 2 | game-module-entity-directory |

每个 byte-copy 文件还各自注册了独立 `_virtual` chunk（`grep -oc "_virtual/<file>.ts"`，均=1）：
`bullet-pattern-planner.ts / enemy-wave-scheduler.ts / player-firing-planner.ts / scoring-state.ts /
pickup-planner.ts / game-outcome.ts / runtime-game-config.ts / game-module-safe-counter.ts /
game-module-entity-directory.ts / game-core.ts / cocos-host.ts` = **11 个不同 chunk**。

3 个 Node-only runtime 模块的输出在 bundle 内 `resources/import/…/runtime-config.json`：
`bossStartMs / roundTimeLimitMs / maxEnemyBullets(×2) / resourceProfile / budgetAdjustments / legacy-geometric`
全部命中。→ **11 组独有字符串全部 ≥1，判据 D 通过。**

### 判据 E：repro-check.sh 6 件关键产物两次构建 SHA-256 全 IDENTICAL

```
$ bash tools/repro-check.sh
=== build #1 ===  exit1=36
=== build #2 ===  exit2=36
IDENTICAL  index.html          b6fe5a618eb865e983ddf2acb0a0e7738120335e25c6a6dddf0117fd43b22155
IDENTICAL  index.js            4317cb547b4d105f69346b925d961df7f951002fd5a4aaae807a361aa1ad49cd
IDENTICAL  application.js      359f85dd922e2568aa991af95a5c356a0102042c8918252987bfbd37f2153eb2
IDENTICAL  cocos-js/cc.js      d71c65ed77200f375faf3fe4acfac138adcae0a99e15922a99f1ca4b3aff7956
IDENTICAL  src/settings.json   b5c9d19904db00f69b0adf7eeabf359568e5cfc1af0217824f492fd0343962f1
IDENTICAL  src/chunks/bundle.js 6dc77f412f55b2fa1eed3b1926baa1fc7d988427bedde66a943ab5951f562516
=== REPRODUCIBLE ===
```
**6/6 IDENTICAL，RC=0。**

### 判据 F：根仓 pnpm check:fast 仍全绿

```
$ pnpm check:fast
 Test Files  112 passed (112)
      Tests  543 passed (543)
CHECKFAST_EXIT=0
```
`tsc --noEmit` + `prettier --check .` + 目标 vitest 全过。**exit 0。**
（Demo 目录已按 golden 先例加入 `.prettierignore`——byte-copy 文件不可被 prettier 改写，
否则破坏字节一致性与可复现构建；根 tsconfig 只含 `src/scripts/tests`，samples 不参与 tsc。）

---

## 2. 模块可用性诊断表（核心输出）

评判口径：能否被 Cocos host / engine-neutral core 在**不改上游**前提下直接组装进闭环。

| # | 模块 | 归类 | 说明 |
|---|---|---|---|
| 1 | `bullet-pattern-planner` (gameplay) | **开箱即用** | `planBulletEmission(pattern,{baseAngleRadians,emissionIndex,maxActiveBullets,currentActiveBullets})` 直接消费 `resourceBudget.maxEnemyBullets` 做活跃上限，`droppedCount>0` 即 cap 命中（portrait 23 次）。支持全 8 pattern（见 §3）。 |
| 2 | `enemy-wave-scheduler` (gameplay) | **开箱即用** | `planEnemyWaveSchedule(config.enemyWaves)` + `scheduledEnemySpawnMs` 直接排波，无适配。 |
| 3 | `player-firing-planner` (gameplay) | **开箱即用** | `planPlayerFiring(config.weapons)` + `planPlayerWeaponEmission` 逐武器出弹，节奏来自 spec。 |
| 4 | `scoring-state` (gameplay) | **开箱即用** | `createScoringState`+`awardDefeatScore`+`awardGrazeScore`+`isGrazeContact`+`expireCombo` 完整覆盖 combo/graze，数值取自 `config.scoring`。 |
| 5 | `pickup-planner` (gameplay) | **开箱即用** | `planPickupSchedule`/`applyPickupEffect`/`applyShieldedPlayerDamage`/`canSpawnPickup` 覆盖掉落+护盾吸收，容量取 `resourceBudget.maxPickups`。 |
| 6 | `game-outcome` (gameplay) | **开箱即用** | `evaluateGameOutcome(config.winCondition,config.loseCondition,…)` 直接裁决，本 run 命中 `healthDepleted`。 |
| 7 | `runtime-game-config` (runtime) | **开箱即用（类型）** | 纯类型无副作用，assets/ 侧类型引用即可；无运行时代码。 |
| 8 | `resource-budget` (runtime) | **需 Node 侧执行** | 本身无 crypto/zod，但被 composer 内部调用；作为 composer 闭包一部分留在 chain/（Node）。其输出 `resourceBudget.*` 被 core 深度消费。 |
| 9 | `shooter-game-composer` (runtime) | **暴露真实缺口（GAP-1）** | **不能 in-engine 跑**（zod+node:crypto）。薄适配：Node 侧跑真 composer→物化 JSON。见 §4 建议。 |
| 10 | `game-module-safe-counter` (contract) | **开箱即用** | `SafeMonotonicCounterV1("spec-demo-entities")` 铸严格递增 id，无适配。 |
| 11 | `game-module-entity-directory` (contract) | **开箱即用** | `DeterministicLogicalEntityDirectory` 4 channel（enemies/player-bullets/enemy-bullets/pickups），容量取自 `resourceBudget`。 |

**composer 输出字段是否被 Cocos host 真正消费**（关键关注点）：

| 字段 | 是否被消费 | 证据 / 消费点 |
|---|---|---|
| `schedule` (bossStartMs, roundTimeLimitMs) | ✅ 真消费 | game-core L274/373/382/899：boss 门控 + roundTimeLimit 终局判定，打印 `[30000,210000]ms`。 |
| `resourceBudget` (maxEnemyBullets/maxPlayerBullets/maxEnemies/maxPickups/…) | ✅ 真消费 | game-core L334/386/527/637/720：弹幕活跃上限（cap hit）、玩家弹上限、pickup 容量、directory channel 容量。 |
| `resolvedAssets` (mode) | **⚠️ 部分闲置** | game-core L394 读到 `mode=legacy-geometric` 并打印；但**没有具体资产映射**可消费（见下）。 |
| `composition` (resourceProfile, budgetAdjustments) | **⚠️ 弱消费** | game-core L381 读 `resourceProfile` 仅作日志/元数据；`budgetAdjustments=[]` 本 run 为空，未走到调整分支。 |
| 透传字段 (weapons/enemyWaves/pickups/bulletPatterns/scoring/win-lose/player/viewport) | ✅ 全消费 | 见诊断表 1–6 及 game-core L256/277/288/297/304/309/314。 |

**闲置字段结论**：`resolvedAssets` 当前 `mode=legacy-geometric`（无具体 asset 条目），host 只能读到"用几何图形兜底"这一位信息，**拿不到 sprite→资源路径映射**——host 的 `SPRITE_PATH` 仍是硬编码 `resources/art/*`，**没有走 composer 的 resolvedAssets**。这是 §4 要补的字段缺口。

---

## 3. 契约与 planner 词汇表差异 专项

- **spec 允许的 pattern 集合**（`BulletPatternSchema.pattern` z.enum，`shooter-game-spec.ts:43`）：
  `{ radial, spiral, fan, aimed, wave, rain, rotatingRing, burst }` — **8 种**。
- **planner 实际支持的集合**（`bullet-pattern-planner.ts:42–95`）：
  显式分支 `fan / aimed / wave / rain / burst`（L42–83）+ **fallthrough 分支**（L85–95）覆盖
  `spiral`（emissionIndex×rotationSpeed）、`rotatingRing`（emissionIndex×rotationSpeed?0.15）、
  以及 `radial`（rotation=0，`baseAngle + 2π·i/count` 均匀环）。→ **8 种全支持**。
- **差集 = ∅（空）。**

> **纠正任务前提**：任务描述称"planner 只识别 fan/aimed/wave/rain/burst，radial/spiral/fan 是故意留的缺口"。
> 实测**不成立**——fallthrough 让 `radial/spiral/rotatingRing` 也被正确处理。fixture 的
> `radial-slow / spiral-medium / fan-medium` 三种 **无需任何映射层或适配**，直接跑通（判据 B 已验证弹幕正常发射、cap 命中）。
- **建议**：**不补 planner、不收窄 spec、不建映射层**。词汇表已对齐。唯一可选改进：planner 的
  fallthrough 对"未知 pattern"是静默按均匀环处理，可考虑在 planner 增加显式 `radial` 分支或对
  真正未知值抛错，让"契约新增 pattern 但 planner 漏实现"能 fail-fast——但这属于**上游 src 的健壮性
  改进，不在本次 sanity 授权范围**，仅登记为建议。

---

## 4. 方案 B 想验的东西验到了没有 + Phase 3-B 前置建议

### 验到了没有：**验到了，且暴露了预期外的真实缺口。**
- ✅ 一份 `ShooterGameSpec`（fixture）能经 `parseShooterGameSpec → composeShooterGame → RuntimeGameConfig`
  拼出**可玩闭环**：6 planner + 2 contract 模块全部真消费，portrait/landscape 都跑到终态并满足全部
  运行时证据（combo/pickup/graze/boss-window/budget-cap）。
- ✅ 产物能 Cocos headless 构建（36）、可复现（6/6 IDENTICAL）、模块真进 bundle（判据 D）。
- ⚠️ 但**入口假设被证伪**：composer **不能 in-engine 跑**（GAP-1），这是方案 B 抓到的**头号真实缺口**，
  直接决定 Phase 3-B 的架构走向。

### GAP-1 详情（Phase 3-B 必须正视）
`composeShooterGame` 的 import 闭包（composer→spec-parser→asset-selection-plan→asset-query-grounding）
value-import 了 `zod` 与 `node:crypto`：
- Cocos SystemJS executor 下 zod v4 报 `Cannot read properties of undefined (reading 'mergeDefs' / 'normalizeParams')`（91×）；
- `node:crypto` 直接被拒："Node.js builtin modules are not provided by Cocos Creator"。
- 另有 GAP-1b：Cocos 的 SystemJS 不认 NodeNext 的 `.js` 相对 specifier（诊断中剥掉 `.js` 后 not-found 归零）。

→ 结论与仓库既有分层一致：**composition 是 orchestration-time（Node）职责，不属于引擎运行时**。
本 Demo 的薄适配（Node 跑真 composer→物化 `runtime-config.json`→host 消费）就是这个结论的最小落地，
**没有绕过 composer**（所有数值仍是 composer 产出的），只是把执行点放到 Node。

### Phase 3-B 前置建议（喂给 Generator 深集成）
1. **确立"composer 在 orchestration/Node 侧、engine 侧只吃 RuntimeGameConfig JSON"为正式契约边界。**
   Generator 产线应在打包前跑 composer 物化 config，作为引擎 bundle 的数据输入——而不是让引擎 import composer。
   建议给 orchestrator 增加一步"compose→emit runtime-config.json"的确定性产物（可纳入 Verification 证据）。
2. **给 `RuntimeGameConfig.resolvedAssets` 补"逻辑 sprite → 资源路径/uuid"映射字段。** 当前
   `mode=legacy-geometric` 只是兜底位，host 拿不到真实 asset 绑定，被迫硬编码 `SPRITE_PATH`。
   Phase 3-B 若要 composer 决定用哪些 corpus 素材，需要在 runtime-game-config 增加
   `resolvedAssets.sprites: { player, enemy, playerBullet, enemyBullet, background }`（路径或 asset uuid），
   host 才能真正"数据驱动"选素材。**这是 runtime-game-config 需要新增的字段。**
3. **给 composer 增加"目标执行环境/序列化"约束参数**（可选）：确保其输出是纯 JSON-safe 的
   `RuntimeGameConfig`（当前已是），并考虑把 `budgetAdjustments` 的语义在 host 侧真正消费
   （目前为空数组、未走调整分支），否则该字段对引擎是死信息。
4. **依赖闭包告警**：composer 闭包比"2 个 spec/asset"大得多（+4 asset 文件 + crypto）。Phase 3-B
   若要在受限环境跑 composer，需确认 Node 运行时可用；若要进一步瘦身，可评估把 `asset-query-grounding`
   的 crypto 用法（grounding 哈希）与核心 compose 解耦——**属上游改动，需单独授权。**
5. **pattern 词汇表已对齐**（§3），Phase 3-B **无需**为 radial/spiral 补 planner；建议仅把
   "planner 对未知 pattern 静默兜底"登记为潜在健壮性改进项。

### 本次在 Demo 侧写的薄适配（全部登记，未改上游）
- `chain/compose.ts`（Node-only）：包一层 `composeRuntimeConfig(rawSpec)` = 真 `composeShooterGame(...,{resourceProfile:"balanced"})`。
- `tools/build-runtime-config.ts`（Node-only）：跑真 composer→写 `runtime-config.json`。
- `game-core.ts` 构造入参从 `rawSpec` 改为预 compose 好的 `runtimeConfig: RuntimeGameConfig`（≈3 行核心改动）：
  因 composer 不能 in-engine 跑，core 改吃 config 对象；smoke 在 Node 侧现跑 composer 传入，host 加载 JSON 传入。
- `chain/`（与 assets/ 平级，Cocos 只扫 assets/ 故不触碰）承载 zod/crypto poison 闭包，镜像 src 相对布局让
  byte-copy 的相对 import 解析成立。
- **无 mock、无禁用/替身、无改 `src/**`、无改契约/schema/planner。**

---

## 5. 目录与产物一览

```
samples/module-integration/CocosSpecDemo/
├── assets/                     # Cocos 扫描（clean，无 zod/crypto/.js-relative value-import）
│   ├── cocos-host.ts           # 唯一碰 cc；加载 config/runtime-config.json → new SpecDemoCore({runtimeConfig})
│   ├── game-core.ts            # engine-neutral kernel，吃 RuntimeGameConfig 驱动 6+2 模块
│   ├── main.scene              # 单节点挂 host
│   ├── gameplay/ (6)  modules/ (2 + PROVENANCE.md)  runtime/ (runtime-game-config.ts)
│   ├── spec/valid-spec.json                        # createValidSpec() 物化
│   └── resources/
│       ├── art/ (5 PNG + metas, 与 golden byte-identical)
│       └── config/runtime-config.json              # 真 composer 在 Node 物化的输出
├── chain/                      # Node-only（Cocos 不扫）：composer 的 zod/crypto poison 闭包
│   ├── compose.ts              # 薄适配：包真 composeShooterGame
│   ├── runtime/ (composer, resource-budget, runtime-game-config)
│   ├── requirements/ (shooter-game-spec)
│   └── assets/ (asset-selection-plan + catalog/license/query-grounding/retrieval)
├── tools/  build.sh  smoke.ts  repro-check.sh  build-runtime-config.ts
└── package.json  tsconfig.json  settings/  profiles/
```
`build/ temp/ library/ .build-work/` 已加 `.gitignore`。
