# 面向纵版弹幕射击小游戏生成的 AI 代码生成智能体

本仓库用于实现一个从简短自然语言需求到可运行 H5 纵版弹幕射击游戏的可重复、可测试、可追踪、可有限修复的生成系统。

规格、稳定模板、确定性组合、小型已审核素材库、桌面/移动浏览器门禁、有限修复和静态 H5 打包已经形成可运行基线。模块数据契约、确定性解析器与薄运行内核已经完成；Batch 1 和全部 Batch 2 正式玩法定义均已 loader admission，多个 ready graph 与浏览器切片通过验证。当前开发主线仍是覆盖常见单人纵版弹幕能力的可执行基础模块库，完成核心库和旧版行为一致性后，再进入模型编排与受限模块开发子系统。当前没有新的付费调用授权。开发路线见 `docs/ROADMAP.md`，模块范围见 `docs/BASE_MODULE_LIBRARY_PLAN.md`，成品 Agent 的目标运行行为见 `docs/ARCHITECTURE.md`。

## 当前推荐方案

- TypeScript 编排器拥有状态机、产物和验证结果的最终控制权。
- 通过 `@opencode-ai/sdk` 启动或连接 OpenCode，将其作为受权限约束的代码执行 Agent。
- 当前保留版本化 `ShooterGameSpec` 和通过验证的 Phaser 模板作为兼容基线；新主线先建设薄运行内核后的可执行基础模块库。模型编排、`GameAssemblySpec` 生成和 OpenCode 隔离开发控制器属于后续开发阶段。
- 使用 Playwright 执行构建后浏览器测试，并将日志、断言和截图输入有上限的修复循环。
- 素材先做小型、许可明确的本地目录；验证流程后再扩展到原题要求的 300-500 张。

## 项目阶段

1. 原始生成、验证与打包流水线（基线完成）
2. 300-500 张素材扩充（部分完成，暂停）
3. 固定模板端到端验收（完成并保留为迁移证据）
4. 模块契约和薄运行内核（完成）
5. 可执行基础模块库（当前主线）
6. 模型编排与受限模块开发子系统（待开发）
7. 模块化多游戏验收和最终交付（计划）

阶段状态和进入/退出门槛以 `docs/ROADMAP.md` 为准。

## 开发命令

```powershell
pnpm install --frozen-lockfile
pnpm check
pnpm run:offline-deepseek
pnpm eval:natural-language-probe:grounding-replay -- <probe-run-id>
pnpm browser:verify
pnpm package:verified -- <run-id>
pnpm opencode:probe
```

`pnpm check` 检查生成配置、格式、TypeScript、单元/集成测试和生产构建。`pnpm run:offline-deepseek` 只重放已记录的有效 Spec。`pnpm browser:verify` 使用本机 Microsoft Edge 的 Chromium 内核执行 1280×720 桌面和 390×844 触控仿真门禁。`pnpm package:verified -- <run-id>` 只将已经通过上述门禁且全部证据哈希仍匹配的运行提升为包含运行说明、许可归属和不可变清单的静态交付目录。`pnpm opencode:probe` 只验证本地 OpenCode 服务、会话与事件，默认不调用模型；只有在明确批准费用并设置 `OPENCODE_RUN_MODEL_PROBE=1` 后才执行结构化模型输出探针。

开始后续工作前，请先执行 `AGENTS.md` 的恢复协议，并阅读 `docs/ROADMAP.md`、`docs/HANDOFF.md` 和 `docs/CURRENT_STATUS.md`。
