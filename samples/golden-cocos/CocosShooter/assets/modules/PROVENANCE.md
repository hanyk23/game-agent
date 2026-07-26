# 复用模块来源（PROVENANCE）

本目录下的两个模块是**产品真实模块的逐字节副本**（不是 mock、不是改写），
用于证明现有引擎中立模块能在 Cocos host 下工作。

| 本副本 | 源文件（仓库内） | 用途 |
|--------|------------------|------|
| `game-module-safe-counter.ts` | `src/modules/game-module-safe-counter.ts` | ADR 0027 `safe-monotonic-v1`：为逻辑实体分配严格递增的唯一 id |
| `game-module-entity-directory.ts` | `src/modules/game-module-entity-directory.ts` | Batch 3 逻辑实体目录：按 channel 强制活跃实体容量上限 + generation 血缘（产品的有界资源契约） |

## 为什么是“复制”而不是“软链接”

阶段一 spike（`docs/spikes/cocos-3.8.7-headless-build.md` §5.4）已证实：Cocos 的
rollup 编译要求参与编译的脚本位于工程 rootDir 之内；指向仓库 `../../src` 的软链会
触发 `TS6059 … not under rootDir` 失败（退出码 34）。同时 Cocos 资源库只扫描
`assets/` 下的脚本。因此复用只能通过“把评审过的字节物化进 `assets/`”，这恰好与产品
真实的“物化评审字节 + 拒绝字节漂移”模型一致。

## 字节一致性校验（复现命令）

```
shasum -a 256 \
  ../../../../../src/modules/game-module-safe-counter.ts \
  game-module-safe-counter.ts
shasum -a 256 \
  ../../../../../src/modules/game-module-entity-directory.ts \
  game-module-entity-directory.ts
```

锁定哈希（2026-07-26）：

- `game-module-safe-counter.ts`     → `e9597a91b2e91c8ee285046c169792b511e5756c0804e9a53626ae5e6269d742`
- `game-module-entity-directory.ts` → `57272b463f7add29f980f72fe664f82e2c6fe8925c8602e88e60ed8a5f47c7d4`

两个副本必须与源文件哈希逐字节相等；不相等即视为字节漂移，样本作废。
