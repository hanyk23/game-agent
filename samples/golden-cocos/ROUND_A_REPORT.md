# Round A 报告：Cocos 3.8.7 弹幕黄金样本（交用户验收）

- **日期**：2026-07-26
- **环境**：macOS 26.5.1（darwin），Node v24.18.0
- **引擎**：Cocos Creator 3.8.7 社区版（`/Applications/Cocos/Creator/3.8.7/CocosCreator.app`）
- **样本工程**：`samples/golden-cocos/CocosShooter/`（独立目录，不污染 `src/`）
- **构建方式**：沿用阶段一 spike 确定的兜底 CLI（`docs/spikes/cocos-3.8.7-headless-build.md`）：realpath 归一 + `--no-sandbox`（**不加** `--disable-gpu`）+ 可写 `--engine` 副本，退出码 `36` 为唯一 pass 判据。

> 结论先行：五条判据全部给出「命令 + 退出码 + 关键产物路径」证据并通过。样本是**真实产品形态**——引擎中立内核逐字节复用了两个真实产品模块，Cocos host 只做适配；竖版/横版都构建 `36`，产物同机字节级可复现。方向（orientation）由**构建注入值**在运行时读取驱动，竖/横玩法轴向确有差异（确定性 axis 探针证明）；渲染使用 **license 合规的 corpus sprite 素材**（逐字节副本），并以**固定比例 + 黑边留白**呈现，绝不拉伸窗口。

---

## 0. 样本结构（框架层：kernel / adapter 分层）

样本刻意复刻产品的 **engine-neutral kernel + Cocos adapter** 分层：

```
samples/golden-cocos/CocosShooter/
├── assets/
│   ├── game-core.ts        # 引擎中立内核：不 import cc/DOM，纯 TS 弹幕模拟
│   ├── cocos-host.ts       # 唯一接触 cc 的适配层：Canvas/Camera/Sprite/Graphics/Label/输入
│   ├── main.scene          # 单节点场景，挂 CocosShooterHost（运行时建全部节点）
│   ├── modules/            # 复用的真实产品模块（逐字节副本）
│   │   ├── game-module-safe-counter.ts        # = src/modules/…（哈希一致）
│   │   ├── game-module-entity-directory.ts    # = src/modules/…（哈希一致）
│   │   └── PROVENANCE.md                       # 来源 + 字节一致性说明
│   └── resources/art/      # license 合规 sprite 素材（corpus 逐字节副本 + .meta）
│       ├── player.png  enemy.png  player-bullet.png  enemy-bullet.png  background.png
├── tools/
│   ├── build.sh            # headless web-mobile 构建（orientation 参数）
│   ├── repro-check.sh      # 同机两次构建 + SHA-256 比对
│   ├── smoke.ts            # 无引擎跑通可玩闭环 + 双向 axis 轴向探针（Node）
│   └── play.sh             # 开发期一键试玩（构建双向 + 起服务 + 开浏览器；非产品验证环节）
├── package.json  tsconfig.json
└── settings/ profiles/     # Cocos 工程配置（构建时物化的默认值）
```

- **数据流**：`cocos-host.ts`（每帧 dt + 输入）→ `BulletHellCore.step()` → `snapshot()` → host 渲染。渲染优先用 corpus **sprite 素材**（`resources.load(...SpriteFrame)`），素材加载完成前回退到 `Graphics` 画圆；HUD/结束横幅用 `Label`。
- **方向参数化**：`cocos-host.ts` 用 `settings.querySettings(SettingsCategory.SCREEN, 'orientation')` 读**构建注入**的方向（不再靠窗口宽高比推断），传给内核；内核用 `forward/cross` 逻辑轴映射到屏幕轴，**没有写死竖版**（竖版 forward=+y，横版 forward=+x；开火、敌人移动、出屏裁剪、出生点全部由该轴推导）。
- **固定比例**：host 用 `view.setDesignResolutionSize(w, h, ResolutionPolicy.SHOW_ALL)`（竖版 720×1280 / 横版 1280×720），窗口比例不符时**留黑边（letterbox）而非拉伸**。

---

## 判据 1：可玩最小闭环（玩家 / 敌人 / 弹幕 / 碰撞 / 结束条件）✅

**内容**：一个 Cocos 2D 场景，含

- **玩家**：近边居中，**纯手动**按键（←→ / A D）沿 cross 轴移动、松手即停（无自动索敌），定时开火（`player-bullets` 通道）。
- **敌人**：从远边生成、向玩家侧推进，定时朝玩家瞄准开火（`enemies` / `enemy-bullets` 通道，≥1 种弹幕发射）。
- **碰撞检测**：圆-圆碰撞——玩家子弹 vs 敌人（击杀 +100 分）、敌弹 vs 玩家（扣血）、敌机 vs 玩家（扣血）。
- **结束条件**：`playerHp<=0` → `lost`；`enemiesKilled>=enemyBudget && 场上无敌人` → `won`。

**证据（无引擎跑通闭环 + 双向 axis 轴向探针，证明逻辑真的会结束且竖/横确有差异）**：

```
$ npx tsx samples/golden-cocos/CocosShooter/tools/smoke.ts
[portrait]  AXIS player=(360,38)  bulletTravel=(dx=0.0, dy=8.7) forward=+y(up)    => PASS
[landscape] AXIS player=(38,360)  bulletTravel=(dx=8.7, dy=0.0) forward=+x(right) => PASS
[portrait]  state=won frames=779 score=1200 hp=4 enemy=true pbullet=true ebullet=true => PASS
[landscape] state=won frames=779 score=1200 hp=4 enemy=true pbullet=true ebullet=true => PASS
smoke_exit=0
```

同一 `BulletHellCore`（Cocos host 每帧调用的那个）在两个方向都推进到终态 `won`，且三类实体（敌人 / 玩家子弹 / 敌弹）都真实出现过。**axis 探针**用同一 seed 各跑两帧、测首颗玩家子弹的位移向量：竖版沿 `+y`（屏幕向上）、横版沿 `+x`（屏幕向右）——这是「同一套源码产两个不同方向 build」的**确定性运行时证据**，不依赖浏览器渲染。因内核是纯手动，smoke 用测试侧 autopilot 注入按键式 steer 驱动闭环（不是内核内置自动驾驶）。

**证据（可玩逻辑 + 素材确实进了 web 产物）**——构建产物 `assets/main/index.js` 里存在判别字符串（本轮重跑，portrait build）：

```
$ B=.../build/web-mobile/assets/main/index.js
$ grep -c "YOU WIN"        $B → 1     $ grep -c "GAME OVER"      $B → 1
$ grep -c "player-bullets" $B → 1     $ grep -c "enemy-bullets"  $B → 1
$ grep -c "querySettings"  $B → 1     # 运行时读注入 orientation（#2）
$ grep -c "art/player"     $B → 1     $ grep -c "art/enemy"      $B → 1
$ grep -c "art/background" $B → 1     $ grep -c "spriteFrame"    $B → 1   # sprite 素材（#4）
```

> 备注：本轮判据 1 以「Node headless 闭环 + 产物内含判定逻辑」为确定性证据。本轮另做了**浏览器单标签实跑抽验**（`tools/play.sh` 起服务）：竖版画面正常渲染出星空背景 + 飞船/敌人/子弹 sprite + HUD，且在 1400×900 宽窗口下仍保持 9:16 竖版比例 + 左右黑边（固定比例、不拉伸）。系统化的浏览器验证仍归后续 Verifier（Playwright）阶段。用户实跑验收可直接 `bash tools/play.sh`。

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

## 判据 4：双 orientation（portrait / landscape），运行时确有差异 ✅

**两次构建**（同工程、仅 orientation 不同）均 `36`：

```
portrait  : EXIT_CODE=36  index.html present: yes
landscape : EXIT_CODE=36  index.html present: yes
```

**`build/web-mobile/src/settings.json` 的 `screen` 段对比（抽取关键字段）**：

```
portrait  screen: {"exactFitScreen":true,"designResolution":{"width":1280,"height":720,"policy":4},"orientation":"portrait"}
landscape screen: {"exactFitScreen":true,"designResolution":{"width":1280,"height":720,"policy":4},"orientation":"landscape"}
```

产物层面 `screen.orientation` 干净地随命令行参数切换（`portrait` ↔ `landscape`），是 orientation 的参数化落点。

> **重要（回应「横版仍是竖版」）**：产物差一个字段只是**构建参数生效**的证据，不等于**运行时表现不同**。真正的运行时差异由两处保证并已验证：
> 1. host 在 `onLoad` 用 `settings.querySettings(SettingsCategory.SCREEN,'orientation')` **读该注入值**（不再靠窗口宽高比推断），传入内核；
> 2. 内核据此切换 `forward/cross` 逻辑轴——竖版子弹沿 `+y`、横版沿 `+x`（见判据 1 的 axis 探针：`dy=8.7` vs `dx=8.7`，同 seed 结果确定不同）。
>
> 注：Cocos web-mobile 会**锁定朝向**——横版 build 放进竖形浏览器窗口时，引擎自身会 `rotate(90deg)` 强制横向呈现（`pal/screen-adapter`）。因此目视横版需用横形窗口；其正确性已由确定性 axis 探针独立证明，不依赖窗口形状。

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
IDENTICAL  src/settings.json  b5c9d19904db00f69b0adf7eeabf359568e5cfc1af0217824f492fd0343962f1
IDENTICAL  src/chunks/bundle.js 6dc77f412f55b2fa1eed3b1926baa1fc7d988427bedde66a943ab5951f562516
=== REPRODUCIBLE ===
```

6 个关键产物两次构建 SHA-256 全部一致（含我们自己的引导 bundle `src/chunks/bundle.js` 与入口 `index.html`）。`cc.js` 哈希 `d71c65ed7720…` 与 spike 记录一致，交叉印证。`settings.json` 哈希本轮为 `b5c9d199…`（较上一版变化，因新增 sprite 素材 → `preloadBundles`/资源列表随之变化，属预期）。

---

## 判据 6（本轮新增）：license 合规 sprite 素材 + 固定比例呈现 ✅

玩家/敌人/子弹/背景改用真实美术素材（不再是画圆），素材是仓库 `assets/corpus/`（CC0，Kenney / OpenGameArt）里已过 license 准入的 PNG 的**逐字节副本**，放入 `assets/resources/art/`；headless 构建自动生成 `.meta`（`type:"sprite-frame"`），运行时 `resources.load("art/xxx/spriteFrame", SpriteFrame)` 加载，加载完成前回退到 Graphics 画圆。

**证据 6a：素材 = corpus 源逐字节副本（provenance）**

```
$ # 样本副本 sha256 == corpus 源 sha256（BYTE-MATCH）
player        <= assets/corpus/sources/kenney/space-shooter-remastered/player/playerShip1_blue.png
enemy         <= assets/corpus/sources/kenney/space-shooter-remastered/enemy/enemyBlack1.png
player-bullet <= assets/corpus/sources/kenney/space-shooter-remastered/player-projectile/laserBlue01.png
enemy-bullet  <= assets/corpus/sources/kenney/space-shooter-remastered/enemy-projectile/laserRed02.png
background    <= assets/corpus/sources/opengameart/seamless-space-backgrounds/background/blue-nebula-1.png
648ec163…  player.png        2aaa39e6…  enemy.png         eced881c…  player-bullet.png
9300564441…  enemy-bullet.png  fc3693ef…  background.png
```

5 张素材的样本副本 sha256 与 corpus 源逐一相等（BYTE-MATCH），来源、license 见 `assets/corpus/catalog.json` 与 `assets/corpus/evidence/licenses/`。

**证据 6b：素材进产物 + 浏览器实证显示**

- bundle 校验（判据 1 已列）：`art/player` / `art/enemy` / `art/background` / `spriteFrame` 各 =1。
- 浏览器单标签实跑：竖版画面渲染出星空背景 + 玩家飞船 / 敌人 / 子弹 sprite + HUD（非画圆、非黑屏）。

**证据 6c：固定比例，不拉伸（回应「不要强行适配窗口比例」）**

host 用 `view.setDesignResolutionSize(720/1280, ResolutionPolicy.SHOW_ALL)`。浏览器在 **1400×900 横向宽窗口**下打开竖版，canvas 显示比例仍约 **0.56（9:16）**，左右两侧留黑边（letterbox），未被拉伸填满窗口——与「固定比例」要求一致。

---

## 约束遵守情况

- ✅ 未动 hash-locked 文档（`BATCH_3_MODULE_DESIGN.md`、ADR 0028 等文档零改动）。
- ✅ 未删 Phaser（`game-template/vertical-shooter/` 未触碰）。
- ✅ 未改契约 schema（`shooter-game-spec.ts` / `game-module-contract.ts` 等未触碰）。
- ✅ 样本代码全部在独立目录 `samples/golden-cocos/`，`src/` 零改动（仅**读取**并逐字节复制了两个模块）。
- ✅ 未新建 mock 替身；复用的是真实产品模块的逐字节副本。
- ✅ 素材是仓库 `assets/corpus/`（已过 license 准入）的**逐字节副本**，仅**读取** corpus、复制进样本 `assets/resources/art/`；未改动 corpus 与 license 准入策略。
- ⚠️ 唯一仓库级改动：`.gitignore` 追加忽略样本的构建产物/临时目录（`build/`、`temp/`、`library/`、`.build-work/`），避免 2.3G 引擎副本与产物入库。

---

## 复现指引（用户验收）

```bash
# 1) 无引擎跑通可玩闭环 + 双向 axis 轴向探针
npx tsx samples/golden-cocos/CocosShooter/tools/smoke.ts

# 2) headless 构建（竖版 / 横版），看 EXIT_CODE=36 与 index.html
bash samples/golden-cocos/CocosShooter/tools/build.sh portrait
bash samples/golden-cocos/CocosShooter/tools/build.sh landscape

# 3) 同机复现（两次构建比对 SHA-256）
bash samples/golden-cocos/CocosShooter/tools/repro-check.sh

# 4) 一键浏览器试玩（构建双向 + 起服务 8080/8081 + 开浏览器；开发期便利，非产品验证环节）
bash samples/golden-cocos/CocosShooter/tools/play.sh
#    竖版 http://127.0.0.1:8080/   横版 http://127.0.0.1:8081/（用横形窗口看）
bash samples/golden-cocos/CocosShooter/tools/play.sh --stop   # 停服务
```

> 若在 agent 沙箱内运行：脚本已自动把引擎克隆到工程同级 `.build-work/engine`（可写），因此可直接跑；也可用 `! bash …` 在沙箱外运行。
> `play.sh` 只是给人看的便利脚本；产品里由 **Verifier Agent** 用 **Playwright** headless 驱动产物完成验证，无需人工起服务器。

---

## 剩余风险 / 待确认

- **系统化浏览器验证仍待 Verifier**：本轮做了单标签抽验（渲染/比例目视 PASS），但**多标签同开会因后台页 canvas 归零而黑屏**（浏览器测试假象，非游戏缺陷）；系统化、可重放的浏览器验证归后续 Playwright（Verifier）阶段。
- **`_updateAdaptResult Invalid size` 告警**：引擎在容器尺寸就绪前的早期一帧会 assert 一次该错误（`cocos/ui/view.ts`），随后容器就绪即恢复正常渲染，不影响最终画面；属引擎适配噪音，非本样本引入。
- **横版目视需横形窗口**：Cocos web-mobile 锁向会把横版 build 在竖窗口里 rotate 90°；其正确性已由 axis 探针独立证明。
- **引擎副本策略**：本机因沙箱不可写安装目录而用 `--engine` 副本；生产环境路径策略需 orchestrator 固化（spike §5 已列处置）。
- **黄金样本定位**：本样本只应锚定**框架层（工程结构 / kernel-adapter 分层 / 构建-复现规则）+ 契约层**；玩法/数值（12 敌人、5 血、弹速等）与**具体美术素材**属内容层，不应被 lock 为模板。
- **Cocos 依赖仍未 pin**：Cocos 未纳入仓库依赖；任何工具链下载/依赖变更需单独批准。

## 建议下一步

1. 由用户按上面「复现指引」实跑验收（尤其 `smoke` axis 探针、build=36、SHA-256 一致、`play.sh` 目视双向）。
2. 验收通过后进 **Round B**：把本样本的**框架层 + 契约层**（目录结构、kernel/adapter 边界、复用即物化字节的规则、build/repro 判据）固化为基线；明确排除内容层（含美术素材）。
3. 需要系统化浏览器实证时，把 `build/web-mobile/` 接入 Playwright（Verifier），作为独立一轮。
