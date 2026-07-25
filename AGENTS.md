项目 Agent 规则（长期稳定）
本文件是本仓库长期行为准则，只写稳定规则，不写一次性迁移步骤或分步计划。
分阶段计划见 docs/COCOS_REFACTOR_PLAN.md；本文件规则优先级高于任何计划文档的推进建议。
以后新增的规则 / 说明文档一律使用中文。
关键铁律
原文（不得翻译、不得改写）：
"Agents must only work on the current requested task. Roadmap and plan documents are informative, not executable instructions. Do not proceed to future steps unless the current task explicitly asks."
中文说明（仅辅助理解，以英文为准）：Agent 只做当前这一轮明确交办的任务；roadmap 与 plan 文档只是参考信息，不是可执行指令；除非当前任务显式要求，否则不得自行推进后续步骤。
项目目标
本仓库产品是一个可复用的游戏生成 Agent：把一句自然语言自动完成 “生成 → 验证 → 打包”，产出经验证的单人弹幕（bullet-hell）H5 游戏。
产品必须同时支持竖版（vertical）与横版（horizontal）。产物是可复用的 Agent 与契约，不是某一个具体游戏。
单个游戏请求默认是评估输入；只有用户可授权变更产品目标或引擎。
架构流水线
固定数据流（每个箭头是严格的非可执行数据契约，由 Orchestrator 校验后推进）：
Request → GameSpec → GameDesign → ModuleAssembly → Assembly → Verification → Package
GameSpec：结构化需求规格（严格 schema）。
GameDesign：由 GameSpec 派生的设计产物（含 orientation 等决策）。
ModuleAssembly：从注册表选配的模块组合。
Assembly：组装后的可运行工程产物。
Verification：确定性验证（Cocos 构建 + Playwright）。
Package：通过验证后的 fail-closed 打包产物。
Orchestrator：最终权威
Orchestrator 是纯 TypeScript 编排器，不是 Agent，也不调用任何 LLM，位于 src/orchestration/。
它是唯一权威：流程状态推进、schema 校验、预算与重试、注册表解析、组装、admission、打包。运行状态与证据写入 src/runs/。
只有 Orchestrator 能决定 pass/fail 与状态晋升；任何 Agent 不得自行晋升状态或放宽门禁。
多 Agent 分工（产品运行时内部）
定稿：6 个 Agent + 1 个非 Agent 编排器。
Spec Agent（src/requirements/）：Request → GameSpec。
Design Agent（src/gameplay/）：GameSpec → GameDesign；只产出设计数据，不写码。
Module Agent（src/modules/）：从注册表选配已准入模块 → ModuleAssembly，不写码。
Code Agent（src/opencode/）：唯一能写码的 Agent（见下节）。
Verifier Agent（src/verification/）：Cocos 构建 + Playwright 验证并产出报告；默认确定性，不调用 LLM（可保留默认关闭的 LLM 钩子）。
Repair Agent（src/repair/）：读报告做有界诊断，改码动作转交 Code Agent；自身不写码、不放宽门禁。
src/evaluation/ 存放评估与回归基线，供验收使用，不属于任何单一运行时 Agent。
Code Agent 规则
Code Agent 是唯一被允许写代码的 Agent，运行时通过 OpenCode（@opencode-ai/sdk）在 deny-by-default 沙箱中生成候选代码。
它只能修改白名单目录，产物只是候选；是否采纳、晋升由 Orchestrator 经 admission 与验证决定。
不得修改内核、编排器、校验器、修复器、契约、注册表、测试、依赖、权限或准入门禁。
新生成模块必须支持其 manifest 声明的 orientation。
允许 / 禁止修改目录
允许（Code Agent 候选白名单）：
引擎侧候选生成代码：game-template/cocos-shooter/src/generated/ 及运行时为某次 run 指定的隔离沙箱目录。
经评审的可复用玩法模块实现：src/modules/ 下新增实现文件（仍需 admission；不得改契约与注册表本身）。
禁止修改（受保护基础设施）：
编排与运行状态：src/orchestration/、src/runs/。
契约 / 注册表 / 准入：shooter-game-spec.ts、game-module-contract.ts、game-module-registry.ts、加载器与 admission 门禁。
验证与修复：src/verification/、src/repair/。
OpenCode 封装：src/opencode/（运行时 Code Agent 不得自改自身封装）。
engine-neutral 内核：src/runtime/kernel/。
Cocos 适配层：src/runtime/cocos/，必须保持数据驱动—— 新增 pattern / 模块只通过事件与数据接入，不应要求改适配层；确需改动须由开发者显式处理。
评估基线 src/evaluation/、全部测试 tests/。
依赖与配置：package.json、pnpm-lock.yaml、tsconfig*.json、Vite / Vitest 配置。
权限 / 沙箱配置、.env*、任何凭据文件。
本文件 AGENTS.md 及文档治理规则。
引擎规则
Cocos Creator Web/H5 是唯一目标引擎；新生成游戏面向 Cocos。
Phaser 已退役，不作为 parity 基线或正确性标准，其历史行为有已知缺陷，不得作为 Cocos 的模仿对象。
禁止擅自删除 Phaser：Phaser 运行时代码归档于 legacy/ 仅供查阅，当前不参与构建 / 验证 / 打包，也不得被任何 Agent 依赖；真正从构建移除须由用户在后续单独授权，且与 parity 无关。
正确性判据来自契约、验证规则，以及 src/evaluation/ 中经用户验收的 Cocos 黄金样本：游戏是否正确取决于是否满足 GameSpec / GameDesign 目标并通过 Verifier 确定性验证。
黄金样本仅锚定框架层与契约层（工程结构、kernel/adapter 分层、契约格式、构建与验证规则），不锚定内容层（玩法、数量、pattern 组合、关卡、数值、美术）。禁止把样本玩法当模板或强制套路；内容层由 GameSpec / GameDesign 自由驱动。
契约必须可扩展：新增玩法或 pattern 原则上只通过注册表扩展，不应要求改契约结构；若被迫改结构，视为契约过紧信号，须记录并评估放松。
engine-neutral 逻辑放 src/runtime/kernel/，禁止 import Cocos、Phaser、任何浏览器 DOM；Cocos 实现放 src/runtime/cocos/，只做节点、渲染、资源、输入、生命周期适配。
生成的 spec / 代码不得选择、安装、升级或配置引擎。
方向规则
orientation（vertical | horizontal）必须参数化，作为设计参数在 GameSpec / GameDesign / 运行时 host 间传递。
禁止把竖版写死：开火方向、敌人移动与出屏裁剪、出生点、视口缩放等都由 orientation 决定。
弹幕 pattern 以逻辑方向描述，由 orientation 映射到实际屏幕方向，不绑定固定屏幕坐标。
竖版与横版都必须能生成、验证、打包通过。
开发期效率规则
日常开发默认只跑 pnpm check:fast（类型 + 变更文件格式 + 相关范围单测）。
重检查分层：check:admission（候选准入跑）、check:release（发布跑，等价完整检查 + 浏览器验证 + 打包边界）。
不要每次改动都跑全套；admission /release 只在候选准入或发布晋升节点运行。任何晋升为 Package 的路径都必须经过 release 层，其强度不得弱于现状。
安全与 Git 底线（长期）
只改本仓库，保留用户与无关的未跟踪改动；不做破坏性清理、强制 Git 操作、大范围删除、读取密钥或未批准的大额下载。
不删除或改弱已有测试，不为让实现通过而降级 schema；验证与打包保持 fail-closed。
第三方代码 / 资产需记录来源、作者、许可与署名；资产需先通过 license/provenance 准入。
提交、推送、分支、合并、变基、PR 等 Git 写操作需用户显式授权；不隐式创建首个提交。
不在未获成本批准时调用付费模型。
完成汇报格式
每轮任务完成后必须汇报：改了什么 / 改了哪些文件 / 跑了什么验收 / 剩余风险 / 建议下一步。