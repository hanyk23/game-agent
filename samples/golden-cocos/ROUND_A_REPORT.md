# Round A 报告：Cocos 3.8.7 弹幕黄金样本（交用户验收）

- **日期**：2026-07-26
- **环境**：macOS 26.5.1（darwin），Node v24.18.0
- **引擎**：Cocos Creator 3.8.7 社区版（`/Applications/Cocos/Creator/3.8.7/CocosCreator.app`）
- **样本工程**：`samples/golden-cocos/CocosShooter/`（独立目录，不污染 `src/`）
- **构建方式**：沿用阶段一 spike 确定的兜底 CLI（`docs/spikes/cocos-3.8.7-headless-build.md`）：realpath 归一 + `--no-sandbox`（**不加** `--disable-gpu`）+ 可写 `--engine` 副本，退出码 `36` 为唯一 pass 判据。

> 结论先行：五条判据全部给出「命令 + 退出码 + 关键产物路径」证据并通过。样本是**真实产品形态**——引擎中立内核逐字节复用了两个真实产品模块，Cocos host 只做适配；竖版/横版都构建 `36`，产物同机字节级可复现。

---

## 0. 样本结构（框架层：kernel / adapter 分层）

样本刻意复刻产品的 **engine-neutral kernel + Cocos adapter** 分层：

```
samples/golden-cocos/CocosShooter/
├── assets/
│   ├── game-core.ts        # 引擎中立内核：不 import cc/DOM，纯 TS 弹幕模拟
│   ├── cocos-host.ts       # 唯一接触 cc 的适配层：Canvas/Camera/Graphics/Label/输入
│   ├── main.scene          # 单节点场景，挂 CocosShooterHost（运行时建全部节点）
│   └── modules/            # 复用的真实产品模块（逐字节副本）
│       ├── game-module-safe-counter.ts        # = src/modules/…（哈希一致）
│       ├── game-module-entity-directory.ts    # = src/modules/…（哈希一致）
│       └── PROVENANCE.md                       # 来源 + 字节一致性说明
├── tools/
│   ├── build.sh            # headless web-mobile 构建（orientation 参数）
│   ├── repro-check.sh      # 同机两次构建 + SHA-256 比对
│   └── smoke.ts            # 无引擎跑通可玩闭环（Node）
├── package.json  tsconfig.json
└── settings/ profiles/     # Cocos 工程配置（构建时物化的默认值）
```

- **数据流**：`cocos-host.ts`（每帧 dt + 输入）→ `BulletHellCore.step()` → `snapshot()` → host 用 `Graphics` 画圆 + `Label` 显示 HUD/结束横幅。
- **方向参数化**：`cocos-host.ts` 读 `screen.windowSize` 判定 `portrait|landscape`，传给内核；内核用 `forward/cross` 逻辑轴映射到屏幕轴，**没有写死竖版**（竖版 forward=+y，横版 forward=+x；开火、敌人移动、出屏裁剪、出生点全部由该轴推导）。

---

## 判据 1：可玩最小闭环（玩家 / 敌人 / 弹幕 / 碰撞 / 结束条件）✅

**内容**：一个 Cocos 2D 场景，含

- **玩家**：近边居中，自动/按键（←→ / A D）沿 cross 轴移动，定时开火（`player-bullets` 通道）。
- **敌人**：从远边生成、向玩家侧推进，定时朝玩家瞄准开火（`enemies` / `enemy-bullets` 通道，≥1 种弹幕发射）。
- **碰撞检测**：圆-圆碰撞——玩家子弹 vs 敌人（击杀 +100 分）、敌弹 vs 玩家（扣血）、敌机 vs 玩家（扣血）。
- **结束条件**：`playerHp<=0` → `lost`；`enemiesKilled>=enemyBudget && 场上无敌人` → `won`。

**证据（无引擎跑通闭环，证明逻辑真的会结束而非空壳）**：

```
$ npx tsx samples/golden-cocos/CocosShooter/tools/smoke.ts
[portrait]  state=won frames=779 score=1200 hp=4 enemy=true pbullet=true ebullet=true => PASS
[landscape] state=won frames=779 score=1200 hp=4 enemy=true pbullet=true ebullet=true => PASS
smoke_exit=0
```

同一 `BulletHellCore`（Cocos host 每帧调用的那个）在两个方向都推进到终态 `won`，且三类实体（敌人 / 玩家子弹 / 敌弹）都真实出现过。

**证据（可玩逻辑确实进了 web 产物）**——构建产物 `assets/main/index.js` 里存在内核/host 的判别字符串：

```
$ B=.../build/web-mobile/assets/main/index.js
$ grep -c "YOU WIN"        $B   → 1
$ grep -c "GAME OVER"      $B   → 1
$ grep -c "player-bullets" $B   → 1
$ grep -c "enemy-bullets"  $B   → 1
```

> 备注：本轮判据 1 用「Node headless 闭环 + 产物内含判定逻辑」作为确定性证据；浏览器内实跑属于后续 Verifier（Playwright）阶段，不影响「可玩闭环是否成型」的判定。用户实跑验收时可用任意静态服务器托管 `build/web-mobile/` 打开 `index.html`。

---

## 判据 2：复用真实模块（引擎中立、非 mock）✅

**复用了哪两个模块、怎么接进 Cocos host**：

| 复用模块（真实产品文件） | 在样本里的角色 | 接入方式 |
|--------------------------|----------------|----------|
| `src/modules/game-module-safe-counter.ts`（`SafeMonotonicCounterV1`，ADR 0027 safe-monotonic-v1） | 为每个逻辑实体（敌人 / 子弹）分配**严格递增唯一 id** | `game-core.ts` `import { SafeMonotonicCounterV1 }`，`#ids.allocate()` 生成 `e-<n>` |
| `src/modules/game-module-entity-directory.ts`（`DeterministicLogicalEntityDirectory`） | 按 channel 强制**活跃实体容量上限 + generation 血缘**（产品的有界资源契约） | `game-core.ts` 建 3 个 channel（enemies/player-bullets/enemy-bullets），`activate/recycle` 决定能否生成新实体；到容量则拒发 |

即：`SafeMonotonicCounterV1` 是实体 id 权威，`DeterministicLogicalEntityDirectory` 是「能否再生成一颗子弹/一个敌人」的权威。Cocos host 完全不碰这套授权，只渲染 `snapshot()`。

**为什么是复制而非软链**：阶段一 spike §5.4 已证 Cocos rollup 要求参与编译的脚本在工程 rootDir 内，指向 `../../src` 的软链会触发 `TS6059 not under rootDir`（退出码 34）；且 Cocos 资源库只扫描 `assets/`。因此复用只能「把评审字节物化进 `assets/`」，恰好对齐产品真实的「物化评审字节 + 拒绝字节漂移」模型。

**证据 2a：逐字节一致（不是改写、不是替身）**

```
$ shasum -a 256 src/modules/game-module-safe-counter.ts \
    samples/golden-cocos/CocosShooter/assets/modules/game-module-safe-counter.ts
e9597a91b2e91c8ee285046c169792b511e5756c0804e9a53626ae5e6269d742  src/modules/game-module-safe-counter.ts
e9597a91b2e91c8ee285046c169792b511e5756c0804e9a53626ae5e6269d742  samples/.../game-module-safe-counter.ts
$ shasum -a 256 src/modules/game-module-entity-directory.ts \
    samples/golden-cocos/CocosShooter/assets/modules/game-module-entity-directory.ts
57272b463f7add29f980f72fe664f82e2c6fe8925c8602e88e60ed8a5f47c7d4  src/modules/game-module-entity-directory.ts
57272b463f7add29f980f72fe664f82e2c6fe8925c8602e88e60ed8a5f47c7d4  samples/.../game-module-entity-directory.ts
```

两对哈希各自完全相等 → 副本与产品源文件逐字节相同。

**证据 2b：复用模块的真实代码确实被 Cocos 编译进了 web 产物**（产物里存在这两个模块**独有**的字符串常量）：

```
$ B=.../build/web-mobile/assets/main/index.js
$ grep -c "invalid-initial-value"                       $B → 1   # SafeMonotonicCounterErrorCode
$ grep -c "counter-exhausted"                           $B → 1   # SafeMonotonicCounterErrorCode
$ grep -c "SafeMonotonicCounterError"                   $B → 1
$ grep -c "LogicalEntityDirectoryError"                 $B → 1
$ grep -c "active-entity-leak"                          $B → 1   # LogicalEntityDirectoryErrorCode
$ grep -c "logical entity directory has been destroyed" $B → 1
$ grep -c "golden-cocos-entities"                       $B → 1   # 内核给 counter 起的 id
```

这些是两个真实模块的错误码/错误类名，出现在 Cocos 打出的项目 bundle 里，证明它们被真正编译、链接、随游戏一起发布——现有引擎中立模块能在 Cocos host 下工作。

---

## 判据 3：headless 构建 = 36，产出 `index.html` ✅

**命令**（`tools/build.sh portrait`，等价于 spike 的兜底 CLI）：

```
"$BIN" --home <可写home> --user-data-dir=<可写udata> --no-sandbox \
       --engine <可写引擎副本> --project <realpath 工程> \
       --build "platform=web-mobile;packages={\"web-mobile\":{\"orientation\":\"portrait\"}}"
```

**退出码 + 产物**：

```
=== EXIT_CODE=36 (36=success 34=build-failed 32=bad-params) ===
index.html present: yes
```

**关键产物路径**：`samples/golden-cocos/CocosShooter/build/web-mobile/index.html`（+ `index.js`、`cocos-js/cc.js`、`src/settings.json`、`assets/main/index.js` 等，共 25 个文件）。

> 说明：本机 Cocos 安装目录被 agent 沙箱视为不可写，故用 `--engine` 指向 APFS copy-on-write 引擎副本（spike §5.3 的处置）；生产/CI 若安装目录可写则无需此步。

---

## 判据 4：双 orientation（portrait / landscape），diff 只差一行 ✅

**两次构建**（同工程、仅 orientation 不同）均 `36`：

```
portrait  : EXIT_CODE=36  index.html present: yes
landscape : EXIT_CODE=36  index.html present: yes
```

**`build/web-mobile/src/settings.json` 的 `screen.orientation` diff（规范化后）**：

```
83c83
<         "orientation": "portrait"
---
>         "orientation": "landscape"
```

只有一行不同（line 83），与 spike §3 完全一致——orientation 是干净的命令行参数化落点，竖版/横版都能驱动，落到运行时 `screen.orientation`。

---

## 判据 5：同机复现（关键产物 SHA-256 一致）✅

**命令**：`tools/repro-check.sh`（同参数 portrait 独立构建 2 次，比对 6 个关键产物）。

```
=== build #1 === exit1=36
=== build #2 === exit2=36
=== key artifact SHA-256 comparison ===
IDENTICAL  index.html         588c89cfef3a5f6bd60f35c5761c3962c15c2c772393f8fb7dab27bf6d736e14
IDENTICAL  index.js           4317cb547b4d105f69346b925d961df7f951002fd5a4aaae807a361aa1ad49cd
IDENTICAL  application.js      359f85dd922e2568aa991af95a5c356a0102042c8918252987bfbd37f2153eb2
IDENTICAL  cocos-js/cc.js     d71c65ed77200f375faf3fe4acfac138adcae0a99e15922a99f1ca4b3aff7956
IDENTICAL  src/settings.json  2bc6b1dcb5f88fc1d244c8cc7758c6130e3aff5dc4109b57a0c0fdbe08988746
IDENTICAL  src/chunks/bundle.js 6dc77f412f55b2fa1eed3b1926baa1fc7d988427bedde66a943ab5951f562516
=== REPRODUCIBLE ===
```

6 个关键产物两次构建 SHA-256 全部一致（含我们自己的引导 bundle `src/chunks/bundle.js` 与入口 `index.html`）。`cc.js` 哈希 `d71c65ed7720…` 与 spike 记录一致，交叉印证。

---

## 约束遵守情况

- ✅ 未动 hash-locked 文档（`BATCH_3_MODULE_DESIGN.md`、ADR 0028 等文档零改动）。
- ✅ 未删 Phaser（`game-template/vertical-shooter/` 未触碰）。
- ✅ 未改契约 schema（`shooter-game-spec.ts` / `game-module-contract.ts` 等未触碰）。
- ✅ 样本代码全部在独立目录 `samples/golden-cocos/`，`src/` 零改动（仅**读取**并逐字节复制了两个模块）。
- ✅ 未新建 mock 替身；复用的是真实产品模块的逐字节副本。
- ⚠️ 唯一仓库级改动：`.gitignore` 追加忽略样本的构建产物/临时目录（`build/`、`temp/`、`library/`、`.build-work/`），避免 2.3G 引擎副本与产物入库。

---

## 复现指引（用户验收）

```bash
# 1) 无引擎跑通可玩闭环
npx tsx samples/golden-cocos/CocosShooter/tools/smoke.ts

# 2) headless 构建（竖版 / 横版），看 EXIT_CODE=36 与 index.html
bash samples/golden-cocos/CocosShooter/tools/build.sh portrait
bash samples/golden-cocos/CocosShooter/tools/build.sh landscape

# 3) 同机复现（两次构建比对 SHA-256）
bash samples/golden-cocos/CocosShooter/tools/repro-check.sh

# 4)（可选）浏览器实跑：用任意静态服务器托管产物，SystemJS 需 http(s)（不能 file://）
#    npx serve samples/golden-cocos/CocosShooter/build/web-mobile
```

> 若在 agent 沙箱内运行：脚本已自动把引擎克隆到工程同级 `.build-work/engine`（可写），因此可直接跑；也可用 `! bash …` 在沙箱外运行。

---

## 剩余风险 / 待确认

- **浏览器实跑未纳入本轮**：判据 1 用 Node 闭环 + 产物含判定逻辑作为确定性证据；真正浏览器内渲染/交互属 Round B/Verifier（Playwright）阶段。
- **引擎副本策略**：本机因沙箱不可写安装目录而用 `--engine` 副本；生产环境路径策略需 orchestrator 固化（spike §5 已列处置）。
- **黄金样本定位**：本样本只应锚定**框架层（工程结构 / kernel-adapter 分层 / 构建-复现规则）+ 契约层**；玩法/数值（12 敌人、5 血、弹速等）属内容层，不应被 lock 为模板。
- **Cocos 依赖仍未 pin**：Cocos 未纳入仓库依赖；任何工具链下载/依赖变更需单独批准。

## 建议下一步

1. 由用户按上面「复现指引」实跑验收（尤其 build=36 与 SHA-256 一致）。
2. 验收通过后进 **Round B**：把本样本的**框架层 + 契约层**（目录结构、kernel/adapter 边界、复用即物化字节的规则、build/repro 判据）固化为基线；明确排除内容层。
3. 需要浏览器实证时，把 `build/web-mobile/` 接入 Playwright（Verifier），作为独立一轮。
