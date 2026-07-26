# golden-cocos — Cocos 3.8.7 弹幕黄金样本（Round A）

本目录是 Cocos + 多 Agent 重构的 **Round A 黄金样本候选**，交用户实跑验收。
验收通过后由 Round B 固化为**框架层 + 契约层**基线（不锚定内容层）。

- 验收报告（逐条判据 + 命令 + 退出码 + 产物路径）：[`ROUND_A_REPORT.md`](./ROUND_A_REPORT.md)
- 样本工程：[`CocosShooter/`](./CocosShooter/)
- 复用模块来源与字节一致性：[`CocosShooter/assets/modules/PROVENANCE.md`](./CocosShooter/assets/modules/PROVENANCE.md)

## 一句话

一个 Cocos 2D 弹幕最小闭环（玩家 / 敌人 / 双方弹幕 / 圆碰撞 / 胜负结束），
采用产品的 **engine-neutral kernel + Cocos adapter** 分层，内核**逐字节复用**两个真实
产品模块（`SafeMonotonicCounterV1`、`DeterministicLogicalEntityDirectory`），
headless 构建竖版/横版均退出码 `36`，产物同机 SHA-256 可复现。

## 快速验收

```bash
npx tsx CocosShooter/tools/smoke.ts          # 无引擎跑通可玩闭环
bash  CocosShooter/tools/build.sh portrait   # EXIT_CODE=36 + index.html
bash  CocosShooter/tools/build.sh landscape  # EXIT_CODE=36 + index.html
bash  CocosShooter/tools/repro-check.sh      # 两次构建 SHA-256 一致
```

生成物（`build/`、`temp/`、`library/`、同级 `.build-work/`）均已 gitignore，不入库。
