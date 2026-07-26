# Spike：Cocos Creator 3.8.7 headless Web 构建可行性验证

- **类型**：spike-only（可行性验证，不改任何业务代码，不动 hash-locked 文档）
- **日期**：2026-07-26
- **环境**：macOS 26.5.1（darwin），Node v24.18.0
- **引擎**：Cocos Creator 3.8.7 社区版
  - 安装路径：`/Applications/Cocos/Creator/3.8.7/CocosCreator.app`
  - 主二进制（Electron）：`/Applications/Cocos/Creator/3.8.7/CocosCreator.app/Contents/MacOS/CocosCreator`
  - 版本指纹（`Contents/Resources/info.json`）：`editor=818dc441… engine=6a204c1b… time=1754563235819`（2025-08-07 构建）
- **最小工程**：`/private/tmp/cocos-spike/MinimalProject`（手工 scaffold 的空 3D 工程 + 1 个最小 Scene，未引入任何项目模块）

> ⚠️ 结论先行：**主选路径（独立 `cocos` CLI）在 3.8.7 不存在**；**兜底路径（`CocosCreator --project … --build …`）可以在无 GUI 窗口下跑通并产出 web-mobile 产物，退出码稳定为 36=成功 / 34=构建失败 / 32=参数错**。orientation 可通过 `--build` 的 `packages` 字段注入。这条路径适合接入确定性 orchestrator。

---

## 0. TL;DR 给 Orchestrator 的接入建议

- **用哪条命令**：老编辑器 CLI（Electron 主二进制）headless 构建：
  ```
  <CocosCreator二进制> \
    --home <可写profile目录> \
    --user-data-dir=<可写electron目录> \
    --no-sandbox \
    --project <工程绝对路径> \
    --build "platform=web-mobile;packages={\"web-mobile\":{\"orientation\":\"portrait|landscape|auto\"}}"
  ```
- **靠哪个退出码判成败**：**退出码 36 = 成功**；**34 = 构建失败**（详见构建日志）；**32 = 参数不合法**。orchestrator 只信任 `36` 为 pass，其余一律 fail-closed。
- **产物在哪**：默认 `<工程>/build/web-mobile/`，入口 `index.html`（静态可读，SystemJS 加载 `index.js`）。
- **头号风险的处置**：issue #8459 描述的“CLI 仍拉起 GUI”在本机**未复现为窗口弹出**——`--build` 分支根本不打开编辑器窗口（见 §1 源码证据）。真正的坑是 **Electron/Chromium 子进程与 GPU 沙箱** 以及 **写盘路径权限**，用 `--no-sandbox` + 重定向 `--home` / `--user-data-dir` / `--engine` 即可解决（见 §5 踩坑）。

---

## 1. 头号风险：CLI 构建是否真能无 GUI 跑通

### 1.1 主选路径：独立 `cocos build` CLI —— ❌ 不存在

**命令 / 证据：**
```
$ which cocos
no cocos on PATH
$ find "/Applications/Cocos/Creator/3.8.7/CocosCreator.app" -name "cocos" -type f
(空)
```
安装包内**没有**独立的 `cocos` 可执行文件；`Contents/MacOS/` 下只有一个 Electron 二进制 `CocosCreator`。因此 3.8.7 社区版**不提供** `cocos build --project … --platform web-mobile` 这种独立 CLI。

### 1.2 兜底路径：`CocosCreator --project <path> --build "platform=web-mobile"` —— ✅ 可跑通

**为什么它是 headless 的（源码级证据）**：从 `app.asar` 解出 `launch/source/launch.ts`，关键分支：

```ts
// launch.ts（Cocos 官方启动脚本，节选）
if (setting.args.build) {
    await Editor.Startup.__protected__.manager(true, !!setting.args.metric);
    // …扫描并启动插件…
    const params = setting.args.build.split(';');
    const options = {};
    params.forEach((str) => { const arr = str.split('='); options[arr[0].trim()] = arr[1]; });
    const code = await Editor.Startup.__protected__.build(options, setting.args.dev);
    app.exit(code);      // ← 用 build() 的返回值作为进程退出码
    process.exit(code);
}
// 只有【没有 --build】时才走 else，去 Editor.Startup.__protected__.window({...}) 打开窗口
```

即：**带 `--build` 时进程直接走构建分支、拿到 `build()` 返回码后 `app.exit(code)`，从不进入打开窗口的代码路径**。这与 #8459 担心的“拉起 GUI/dashboard”不同——dashboard 只在“既没有 `--project` 也没有 `--build`”时才启动。

**运行时印证（build7 stdout 头部）**：
```
Arguments:
  project: /private/tmp/cocos-spike/MinimalProject
  build: platform=web-mobile
  dev: false
```
且全程 grep `main-window:start-up|afterOpen|BrowserWindow` = **0 次命中**，证明构建期间**没有编辑器窗口被打开**。

> 结论：**兜底路径可在无人值守下产出 web 构建**；主选路径不可用。**推荐兜底路径接入 orchestrator**。

---

## 2. 产物形态

一次成功构建（`platform=web-mobile`）后，`build/web-mobile/` 结构（共 29 个文件，约 6.2 MB）：

```
build/web-mobile/
├── index.html            # 入口（2 KB）
├── index.js              # 引导脚本（System.import('./index.js')）
├── application.js
├── style.css
├── assets/
│   ├── internal/{config.json,index.js,import/…}
│   └── main/{config.json,index.js,import/aca99f9c-….json,…}   # 我们的 scene 以 uuid 命名
├── cocos-js/
│   ├── cc.js             # 引擎主包
│   ├── _virtual_cc-PpajdTiY.js
│   ├── bullet.release.wasm-*.js / .wasm    # 物理
│   └── spine-*.js / .wasm / .bin           # spine 运行时
└── src/
    ├── settings.json     # 运行时设置（含 screen.orientation）
    ├── system.bundle.js  # SystemJS
    ├── polyfills.bundle.js
    ├── import-map.json
    ├── chunks/bundle.js
    └── effect.bin
```

**静态可读性**：`index.html` 是纯静态 HTML，`<body>` 内有 `#GameCanvas`，末尾用 `System.import('./index.js')` 启动。可以在**文件层面**直接读取确认（本 spike **未**在本机/沙箱起任何监听服务，仅做文件层确认）。真正在浏览器里运行需要通过 http(s) 提供（SystemJS + fetch importmap 不能走 `file://`），但这属于**验证阶段**（Playwright）的事，不影响“构建产物是否成型”的判定。

---

## 3. orientation 参数化 —— ✅ 可通过命令行注入

**注入点**：web-mobile 平台扩展的构建选项类型（从 `app.asar` 解出 `modules/platform-extensions/extensions/web-mobile/@types/index.d.ts`）：

```ts
export type IOrientation = 'auto' | 'landscape' | 'portrait';
export interface IOptions {
    useWebGPU: boolean;
    orientation: IOrientation;
    embedWebDebugger: boolean;
}
export interface ITaskOption extends IInternalBuildOptions {
    packages: { 'web-mobile': IOptions }
}
```

**注入方式**：在 `--build` 串里追加 `packages` 字段（各平台选项挂在 `packages.<平台名>` 下）：
```
--build "platform=web-mobile;packages={\"web-mobile\":{\"orientation\":\"landscape\"}}"
```

**验证证据（构建两次，分别注入 landscape / 默认）**：

| 构建 | 注入 | 产物 `src/settings.json` → `screen.orientation` | 退出码 |
|------|------|-----------------------------------|--------|
| build8 | `orientation=landscape` | `"landscape"` | 36 |
| build9 | 不注入（默认） | `"auto"` | 36 |

两次产物 `settings.json` 的 **diff 只有一行不同**：
```
83c83
<   "orientation": "landscape"
---
>   "orientation": "auto"
```
说明 orientation 是一个**干净的参数化落点**：竖版 / 横版 / 自动都能由命令行驱动，落到运行时 `screen.orientation`，不影响其它构建产物。符合黄金样本“vertical / horizontal 都要覆盖”的设计参数要求。

> 备注：`orientation` 属于运行时 canvas 朝向策略；设计分辨率（`designResolution`，默认 1280×720）是另一个参数，也可经构建选项注入，本 spike 未展开。

---

## 4. 确定性钩子：退出码与产物可复现性 —— ✅ 稳定

### 4.1 退出码契约（官方文档 + 运行时双重确认）

官方文档（Cocos Creator 3.x《命令行发布项目》）明确：

- **32** 构建失败 —— 构建参数不合法
- **34** 构建失败 —— 构建过程出错（详见构建日志）
- **36** 构建成功

本机实测退出码汇总：

| 构建 | 场景 | 退出码 | 说明 |
|------|------|--------|------|
| build5 | 工程无 scene | **34** | 内容错误：`The selected scene does not exist…`（构建失败） |
| build6 | 有 scene，但 `/tmp` 软链导致 rollup rootDir 冲突 | **34** | 子进程 `buildEngineCommand failed with code -1` |
| build7 | 修正为 `/private/tmp` 规范路径 | **36** | 成功，产出 `index.html` |
| build8 | 成功 + 注入 landscape | **36** | 成功 |
| build9 | 成功（默认，复现 build7） | **36** | 成功 |

退出码严格对应官方契约，`36` 可作为 orchestrator 唯一 pass 判据，**fail-closed** 安全。

### 4.2 产物可复现性（同工程重复构建）

对 build8（landscape）与 build9（default，与 build7 同参）两次**独立**构建做对比：

- **文件树完全一致**：`diff tree8.txt tree9.txt` → `IDENTICAL FILE TREE`（均 29 文件）。
- **内容哈希逐字节一致**（SHA-256）：
  ```
  IDENTICAL  cocos-js/cc.js                    d71c65ed7720…
  IDENTICAL  cocos-js/_virtual_cc-PpajdTiY.js  d0b2e7cd5f9b…
  IDENTICAL  src/system.bundle.js              90f192f3b04f…
  IDENTICAL  src/polyfills.bundle.js           f1e4ced33221…
  ```
- **内容寻址文件名稳定**：引擎/spine 分块文件名带内容哈希后缀（如 `spine-BGFFnNyc.js`），两次构建完全相同 → 说明引擎编译产物可复现。
- 唯一差异是被显式注入的 `settings.json.orientation`（见 §3），即“输入变才变，输入不变则产物不变”。

> 结论：**退出码稳定可依赖**，**产物在字节级高度可复现**，满足确定性 orchestrator 的接入前提。

---

## 5. 踩到的坑（关键，直接影响接入）

按“主进程 → 子进程 → 路径”排列，全部有可复现的处置方案：

1. **默认会写 `~/.CocosCreator` 与 `~/Library/Application Support/CocosCreator`**
   - 现象：首启报 `EPERM: mkdir '/Users/…/.CocosCreator/profiles/…'`、profile 保存失败后**主进程 0% CPU 卡死**（不退出）。
   - 处置：用 `--home <可写目录>` 重定向 profile；用 `--user-data-dir=<可写目录>` 重定向 Electron userData。二者都指向可写目录后，profile 正常落盘、构建继续。

2. **GPU 进程 / Chromium 沙箱初始化失败**
   - 现象（无任何 flag 时）：`sandbox initialization failed: Operation not permitted` → `GPU process isn't usable. Goodbye.` → 主进程 `Trace/BPT trap: 5`（退出码 133，非构建码）。
   - 处置：加 **`--no-sandbox`**。加了之后 GPU 子进程不再崩，构建正常推进。
   - ⚠️ **反面教训**：**不要用 `--disable-gpu`**。实测它会触发 Sentry 的 `gpu-context` 集成不停抛 `GPU access not allowed`，日志在 9 分钟内涨到 **11 MB / 1000+ 万行**且构建卡住不前。只留 `--no-sandbox`、保持 GPU 开启才正常。

3. **引擎编译缓存写在安装目录内 → 被 agent 沙箱拦截**
   - 现象：`EPERM … /Applications/Cocos/.../resources/3d/engine/bin/.cache/dev/editor/import-map.json`，随后主进程卡死。
   - 根因甄别：我直接 `touch` 该路径**能成功**（真实 macOS 允许写），是 **TRAE agent 沙箱**在拦截被 spawn 出来的 Cocos 子进程，**不是** GUI 依赖、也不是真实 OS 权限问题。
   - 处置：用 **`--engine <可写副本>`** 把 2.3 GB 引擎目录克隆到可写位置（APFS `cp -cR` 写时复制，约 8 秒），指向副本后引擎编译缓存落到可写目录，构建通过。
   - 对生产环境的含义：真机/CI 上若 Cocos 安装目录可写，此坑不存在；若安装目录只读或被沙箱保护，则**必须**提供可写引擎副本（`--engine`）或让 orchestrator 在可写位置准备引擎。

4. **`/tmp` 软链到 `/private/tmp` 触发 rollup `rootDir` 冲突（导致 34）**
   - 现象：`--engine /tmp/…` 但 TS/rollup 解析出 `/private/tmp/…`，报 `TS6059: File … is not under 'rootDir' '/tmp/…'`，引擎编译子进程退出 -1 → 整体 34。
   - 处置：**统一使用规范化的真实路径**（macOS 上用 `/private/tmp` 而非 `/tmp`；一般用 `realpath` 归一化）。改用 `/private/tmp` 后同一工程立即 36 成功。
   - 对 orchestrator 的含义：传给 `--project` / `--engine` / `--home` 的路径必须先 `realpath` 归一，避免软链造成不确定失败。

5. **最小工程必须至少含 1 个 Scene**
   - 现象：纯空工程报 `The selected scene does not exist…` → 34。
   - 处置：至少放一个 `.scene` + 对应 `.scene.meta`（本 spike 手写了一个含 Main Camera 的最小 3D 场景）。

6. **日志噪音**：headless 构建 stdout/日志里混有大量 Sentry / GPU / profile 报错栈，**多为非致命噪音**。判定成败**只应依据进程退出码**，日志用于诊断。建议 orchestrator 过滤 `sentry|GPU access|EPERM|node:internal|^\s+at ` 之类噪音后再存证。

---

## 6. 复现脚本

已保存 `/private/tmp/cocos-spike/run-build.sh`（接受 `portrait|landscape|auto` 参数），核心命令：

```bash
BIN="/Applications/Cocos/Creator/3.8.7/CocosCreator.app/Contents/MacOS/CocosCreator"
PROJ="/private/tmp/cocos-spike/MinimalProject"   # 注意用规范化真实路径
"$BIN" \
  --home /private/tmp/cocos-spike/home \
  --user-data-dir=/private/tmp/cocos-spike/userdata \
  --no-sandbox \
  --engine /private/tmp/cocos-spike/engine \       # 安装目录不可写时才需要
  --project "$PROJ" \
  --build "platform=web-mobile;packages={\"web-mobile\":{\"orientation\":\"portrait\"}}"
echo "exit=$?"   # 36=成功
```
> 若在 TRAE agent 沙箱内运行，需通过用户侧 `! bash …`（沙箱外）执行，或放宽沙箱对 Cocos 缓存目录的写权限；否则会被 §5.3 的沙箱拦截打断。

---

## 7. 结论

| 问题 | 结论 |
|------|------|
| 主选独立 `cocos` CLI | ❌ 3.8.7 社区版不存在 |
| 兜底 `CocosCreator --build` 是否 headless | ✅ 是；`--build` 分支不开窗口（源码 + 运行时双证） |
| 至少一条路径能无人值守产出 web 构建 | ✅ 兜底路径可以 |
| 哪条更适合接进确定性 orchestrator | 兜底路径（Electron 主二进制 `--build`），靠退出码 **36** 判成功 |
| 产物形态 | `build/web-mobile/`，`index.html` 静态可读，SystemJS 加载 |
| orientation 参数化 | ✅ `packages={"web-mobile":{"orientation":…}}` → `settings.json.screen.orientation` |
| 退出码稳定 | ✅ 32/34/36 与官方契约一致 |
| 产物可复现 | ✅ 文件树 + 内容哈希逐字节一致 |

**黄金样本策略的前置门通过**：本机可无 GUI 地把最小 Cocos 3.8.7 工程构建成 web-mobile 产物，退出码确定，orientation 可参数化，竖版/横版都能覆盖。建议下一步在此基础上定义 orchestrator 的构建调用契约与证据落盘规则（含路径归一、引擎副本策略、日志过滤、`36`-only pass）。

---

### 附：证据文件位置（临时目录，非仓库）

- 工程：`/private/tmp/cocos-spike/MinimalProject/`
- 成功产物：`/private/tmp/cocos-spike/MinimalProject/build/web-mobile/`
- 各次构建日志：`/private/tmp/cocos-spike/build{5,6,7,8,9}.log`（+ `.exit`）
- 复现脚本：`/private/tmp/cocos-spike/run-build.sh`
- 从 `app.asar` 解出的源码/类型定义：`/tmp/cocos_asar_extract/`（`launch.ts` / web-mobile `index.d.ts` / builder `options.d.ts` 等）
