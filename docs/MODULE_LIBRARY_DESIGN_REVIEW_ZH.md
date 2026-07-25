# Phase 7 基础玩法模块库完整设计审核稿

更新日期：2026-07-17  
状态：用户已于 2026-07-17 批准；尚未开始模块实现

## 一、审核范围与文件关系

本文是本轮设计评审的中文主入口，完整汇总以下规范的关键设计内容：

- `docs/BASE_MODULE_LIBRARY_PLAN.md`：基础模块库总体规范；
- `docs/BATCH_1_MODULE_DESIGN.md`：修订后 Batch 1 十一个模块的实现级规范；
- `docs/decisions/0025-batch-1-execution-abi-and-lifecycle.md`：执行 ABI、作用域、资源和清理决策；
- `docs/ARCHITECTURE.md`：成品 Agent 的稳定总体架构。

英文规范仍是实现时的逐条技术底稿；本文记录用户确认的设计意图、边界和取舍。如果中英文出现歧义，以本文已批准结论为准，并在相关实现开始前同步修正英文规范。

本设计的目标是形成完备的 Phase 7 模块库架构，而不是只设计一个最小演示。Batch 1 只是第一批实现切片。所谓“薄运行内核”，仅表示内核只能增加玩法无关的通用能力，不能把生命、攻击、波次等玩法规则重新塞进内核。

## 二、产品目标与本阶段边界

产品目标是可复用的单人纵版弹幕 H5 游戏生成 Agent。某个游戏提示词、测试游戏或旧版固定模板都只是评估输入和兼容证据，不是产品本身。

Phase 7 负责：

- 完成可执行玩法模块 ABI；
- 建立正式模块注册表与确定性模块图实例化器；
- 实现覆盖单人纵版弹幕常见能力的基础模块库；
- 将旧版固定模板行为表达为模块图并建立等价证据；
- 在模块路径达到恢复、浏览器和打包等价之前保留固定路径。

Phase 7 不负责：

- API 模型审核用户意图；
- 模型生成 `GameAssemblySpec`；
- 通过 OpenCode 开发能力缺口；
- 付费模型调用；
- 扩充素材库；
- 方向射击等 Batch 2 玩法的提前实现。

上述成品 Agent 运行行为属于后续 Phase 8/9，不得混入当前实现路线。

## 三、现状核对与关键缺口

已经存在并应复用的能力：

- `GameModuleManifest 1.0.0` 和 `GameAssemblySpec 1.0.0`；
- 本地版本注册表和严格配置 Schema；
- 确定性版本、依赖、冲突、端口、所有权和总资源解析；
- 五种数据装配夹具；
- 生命周期、时间、实体/池、输入、渲染、碰撞、资产、事件、预算、视口和观察接口；
- 旧版 `PlayScene` 已经通过运行内核接缝使用 Phaser 服务；
- 旧版键盘、触摸、边界、自动射击、对象池、碰撞和生命逻辑。

实现 Batch 1 前必须补齐的契约缺口：

1. 端口目前只有载荷类型名称，没有严格的运行时 Schema 和语义。
2. 键盘方向和触摸绝对位置不能安全共用 `movement-vector-v1`。
3. capability 当前按整个 assembly 匹配，可能错误匹配到另一个 actor。
4. 输入端口不能声明是否允许跨 owner 绑定。
5. 正式注册项没有规范化描述符、构建产物身份、资源求值器和实现工厂。
6. 解析结果没有 actor、资产角色、Manifest 证据和稳定启动顺序。
7. 输入监听和持续碰撞监听没有 disposer，无法证明重启无泄漏。
8. 实体泛型仍可暴露 Phaser Sprite，玩法模块缺少安全实体句柄。
9. 投送模块拥有的对象池无法在不传递 Phaser 对象的情况下安全交给碰撞模块。
10. 四项总预算尚未转化为每实例运行配额，监听/碰撞/通道等清理资源也未计数。
11. 没有部分启动失败回滚、反向停止、反向释放和重复调用规则。

## 四、完整基础模块库能力架构

### 4.1 玩家意图

| 模块 ID                      | 职责                       | 批次 |
| ---------------------------- | -------------------------- | ---- |
| `intent.keyboard-movement`   | 键盘移动方向               | 1    |
| `intent.touch-drag`          | 触摸拖动绝对位置           | 1    |
| `intent.movement-arbiter`    | 多移动输入仲裁             | 1    |
| `intent.directional-aim`     | 指针、摇杆或按键瞄准       | 2    |
| `intent.active-attack`       | 按下、按住、释放攻击意图   | 2    |
| `intent.ability`             | 有界能力槽意图             | 4    |
| `intent.equipment-selection` | 已声明装备槽选择           | 4    |
| `intent.touch-combined`      | 移动、瞄准、攻击组合触控区 | 4    |

输入模块只拥有设备状态，不得直接移动 actor、选目标或执行攻击。多个输入源必须通过明确的策略模块组合。

### 4.2 移动

| 模块 ID                       | 职责                   | 批次 |
| ----------------------------- | ---------------------- | ---- |
| `locomotion.bounded`          | 有界速度移动和绝对拖动 | 1    |
| `locomotion.focus-speed`      | 聚焦减速               | 2    |
| `locomotion.dash`             | 有冷却的冲刺/翻滚      | 4    |
| `locomotion.reviewed-inertia` | 有界加速和减速         | 4    |

同一 actor 只能有一个基础位移所有者。聚焦是修饰能力，冲刺是受协调的移动能力，惯性是基础移动策略的替代项。

### 4.3 瞄准

| 模块 ID                   | 职责                     | 批次 |
| ------------------------- | ------------------------ | ---- |
| `targeting.fixed-forward` | 固定世界向上             | 1    |
| `targeting.directional`   | 输入方向或点的标准化瞄准 | 2    |
| `targeting.nearest`       | 稳定最近目标             | 2    |
| `targeting.priority`      | 角色、生命、距离优先级   | 4    |
| `targeting.homing-update` | 有转向速率上限的追踪更新 | 4    |
| `targeting.multi-lock`    | 有数量和过期上限的多锁定 | 4    |

目标查询只能使用安全 actor/实体目录快照，并以逻辑实体 ID 稳定打破平局。

### 4.4 攻击触发

| 模块 ID               | 职责                   | 批次 |
| --------------------- | ---------------------- | ---- |
| `trigger.interval`    | 固定间隔自动攻击       | 1    |
| `trigger.active`      | 主动按下/按住/释放攻击 | 2    |
| `trigger.cooldown`    | 冷却门控               | 4    |
| `trigger.charge`      | 有界蓄力等级           | 4    |
| `trigger.ammunition`  | 弹匣、装填和备用弹药   | 4    |
| `trigger.energy-heat` | 能量或热量约束         | 4    |

触发模块只产生攻击请求，不生成弹丸。冷却、弹药和能量是明确的请求过滤器，不能作为隐藏逻辑塞进投送模块。

### 4.5 攻击投送

| 模块族       | 模块 ID                                                                                              | 批次 |
| ------------ | ---------------------------------------------------------------------------------------------------- | ---- |
| 基础弹丸     | `delivery.projectile`                                                                                | 1    |
| 齐射         | `delivery.spread`、`delivery.multi-shot`                                                             | 2    |
| 八种旧版弹幕 | `delivery.pattern.radial`、`.spiral`、`.fan`、`.aimed`、`.wave`、`.rain`、`.rotating-ring`、`.burst` | 2/3  |
| 追踪弹       | `delivery.homing-projectile`                                                                         | 4    |
| 非弹丸代表   | `delivery.beam`、`delivery.area-field`                                                               | 4    |
| 延迟/环绕    | `delivery.mine`、`delivery.orbit`                                                                    | 4    |
| 伙伴命令     | `delivery.companion-command`                                                                         | 4    |

所有创建实体的投送模块必须拥有自己的池和实体通道，声明活动量和生成速率上限，并输出可验证的逻辑实体证据。

### 4.6 战斗交互

| 模块 ID                              | 职责                             | 批次 |
| ------------------------------------ | -------------------------------- | ---- |
| `combat.health`                      | 有界生命状态                     | 1    |
| `interaction.projectile-contact`     | 只检测接触，不改变弹丸           | 1    |
| `interaction.contact-default-damage` | 建立默认伤害决策                 | 1    |
| `interaction.contact-resolution`     | 执行最终消费/保留/转移并输出结果 | 1    |
| `combat.shield`                      | 下游伤害的护盾消耗               | 2    |
| `combat.invulnerability-window`      | 下游伤害的无敌时间门控           | 2    |
| `combat.graze`                       | 单次擦弹                         | 2    |
| `interaction.projectile-cancel`      | 把接触决策变为抵消               | 4    |
| `interaction.absorption`             | 把接触决策变为吸收及资源事务     | 4    |
| `interaction.reflection`             | 把接触决策变为所有权/方向转移    | 4    |
| `interaction.polarity`               | 按极性匹配转换接触决策           | 4    |
| `combat.status`                      | 小型封闭状态效果集合             | 4    |

完整链路必须显式连接：接触候选 → 默认伤害决策 → 可选极性/抵消/吸收/反射策略 → 最终弹丸决议 → 护盾/无敌 → 生命。接触检测绝不消费弹丸；只有最终决议模块拥有消费、保留或转移来源实体的权限。

### 4.7 成长与配装

计划模块包括：

- `progression.pickup-spawn`
- `progression.pickup-collect`
- `progression.modifier`
- `progression.upgrade-choice`
- `progression.evolution-recipe`
- `loadout.slotted`
- `progression.local-unlock-reference`

修饰器只能写入接收模块公开的封闭字段 ID，不能通过路径、反射或代码访问模块内部。

### 4.8 遭遇流程

计划模块包括：

- `encounter.scrolling-waves`
- `encounter.boss-phases`
- `encounter.fixed-arena`
- `encounter.room-sequence`
- `encounter.timed-survival`
- `encounter.objectives`

旧版波次与 Boss 调度器是抽取时的行为真值来源。遭遇模块负责调度和 actor 来源，不负责伤害、计分或结果判断。

### 4.9 伙伴行为

计划模块包括：

- `companion.follow`
- `companion.orbit`
- `companion.targeting`
- `companion.attack`
- `companion.collection-support`

伙伴始终从属于唯一玩家 actor，不能演化成第二玩家或联机拓扑。

### 4.10 计分与结果

计划模块包括：

- `scoring.defeat`
- `scoring.combo`
- `scoring.graze`
- `scoring.pickup`
- `outcome.player-health`
- `outcome.boss-defeat`
- `outcome.score-threshold`
- `outcome.survival-time`
- `outcome.objective`
- `outcome.coordinator`

计分只消费不可变玩法证据，结果只读取状态快照。结果协调器负责阈值包含关系、优先级和唯一终局转换。

## 五、生产模块执行 ABI

### 5.1 Manifest 与注册项

正式可执行模块使用 `GameModuleManifest 1.1.0`。它在现有 1.0.0 基础上增加：

- capability 作用域；
- 输入端口允许的 owner 关系；
- 资源上限语义；
- state/event 端口语义、结构化跨 owner 授权，以及分作用域运行租约上限。

Manifest 1.0.0 只保留给已有数据夹具，不能进入生产实例化。

一个正式注册项绑定以下可复现构件：

1. 精确 Manifest；
2. 规范化配置 Schema 描述符及本地验证器；
3. 规范化资源预留描述符及本地求值器；
4. 受审查的实现 bundle 导出。

证据不能直接哈希运行时函数、闭包、Zod 实例或 `function.toString()`。注册证据使用带版本、长度分隔的封装，覆盖规范化 Manifest JSON、两个描述符字节、实现 bundle 字节、依赖锁身份和构建/工具链身份。工厂及求值器代码由 bundle 字节覆盖，资源预留结果不得超过 Manifest 上限。

接触策略注册项还必须绑定规范化 transform 描述符。注册表另行拥有并哈希 `ContactPolicyChainProfile`：`profileId`、版本、精确有序策略 ID/版本约束、策略角色、允许的 disposition/sourceOperation、最大深度、受支持链证据 ID 和证据哈希。装配只可引用 profile 并填写有界参数，不能直接列举、遗漏或重排策略。profile 及其引用的策略产物哈希都进入解析证据。

### 5.2 ResolvedModuleGraph 1.1.0

解析结果必须保留：

- actor 和角色；
- 资产角色；
- 精确模块、版本、implementation ID 和证据哈希；
- 已验证配置；
- 端口绑定和 state/event 投递语义；
- 每实例资源配额；
- 显式依赖和 capability provider 边；
- 已展开的策略 profile 和每个 owner 的伤害接收链；
- 稳定 provider-first 生命周期顺序。

相同优先级按 `instanceId` 字典序稳定排序。同步 event 数据流出现环时解析失败。策略 Manifest 必须声明 `executionModel`、`policyPhase`、`allowedPredecessors`、`allowedSuccessors`、`requiresBefore`、`requiresAfter`、`supportedChainEvidenceIds` 和 `mutableDecisionFields`；解析器同时核对 profile 与 Manifest，任何未知顺序在实例化前失败。伤害链若从中段旁路进入、向下分叉、成环、重复 sink、存在多个终点或未终止，同样在解析期失败；多个 damage producer 可以共享唯一链头。跨 owner 授权必须同时约束 same/different owner、来源 actor 角色、目标 actor 角色和来源实体角色；不再允许宽泛的 `any-declared-actor`。

### 5.3 生命周期

实例化顺序：

1. 校验图、内核和注册表身份；
2. 分配作用域上下文；
3. 按 provider-first 顺序创建全部工厂；
4. 完成全部端口接线并声明处理器，但暂不激活投递；
5. 按相同顺序调用 `initialize`，只允许写入 state，不允许发 event；
6. 全部 initialize 成功后，先激活所有消费者的端口订阅 start lease，再按稳定顺序重放最新 state；
7. 按相同顺序调用 `start`；恢复流程同样先激活订阅、重放 state，再调用 start；
8. 全部 start 成功后，图原子进入 `running` 并启用 event；
9. 每帧按稳定顺序调用存在的 `update(deltaMs)`。

停止和释放：

- stop 先禁止新 event，再按反向顺序；
- `dispose` 按反向顺序且最多一次；
- 部分创建、初始化或启动失败时，对已启动模块反向停止，对已创建模块反向释放；
- 原始错误和清理错误均写入不可变失败证据，互不覆盖；
- dispose 后调用任何运行操作都失败关闭；
- `stop → start` 只表示同一图实例的暂停/恢复；
- 游戏重开固定表示 `dispose → instantiate`，生成全新的生命、触发和接触状态；
- 图销毁发生在 dispose 之后，并释放整图基础设施。

上下文强制追踪并兜底释放：

- 端口订阅；
- 输入监听；
- 计时器；
- 持续碰撞监听；
- 观察读取器；
- 实体通道；
- 对象池。

任何模块都不能用“暂停整个场景物理”作为自己的清理方法。

### 5.4 作用域运行上下文

模块工厂不能获得 Phaser 对象，也不能获得完整内核，只能获得：

- 实例 ID、owner actor、Manifest、已验证配置、资产角色和资源配额；
- 只允许已解析绑定的端口读取/输出；
- 内核时间和计费计时器；
- 键盘方向读取和可取消指针订阅；
- 安全 actor/实体句柄；
- 自己拥有的对象池和实体通道；
- 绑定授予的外部实体通道只读/受限操作；
- 可取消碰撞监听；
- 视口、资产角色解析、预算与命名空间观察。

安全实体句柄只提供活动状态、位置、有界速度、碰撞体配置、激活/回收和不可变元数据。模块不得获得 Phaser Sprite、Group 或 Scene。

Batch 1 的 actor 根实体由运行宿主提供：固定场景是兼容宿主，测试使用确定性假宿主。模块不得创建或销毁另一个模块/宿主拥有的 actor 根。后续遭遇模块可以通过同一安全目录创建自己拥有的敌方 actor。

## 六、端口载荷与所有权

所有载荷均为严格 Schema 验证和冻结的数据值。拒绝未知字段、非有限数字、未声明逻辑 ID、失效实体引用、非单调序列以及未绑定输出。

Batch 1 新增或正式使用：

| 载荷                           | 语义                                                           |
| ------------------------------ | -------------------------------------------------------------- |
| `movement-command-v1`          | 输入源、序列、采样时间、是否激活，以及速度方向或绝对位置二选一 |
| `resolved-movement-command-v1` | 仲裁后的命令、选中源和选择原因                                 |
| `target-selection-v1`          | 标准化非零方向                                                 |
| `attack-request-v1`            | 主攻击请求序列和时间，不含伤害规则                             |
| `entity-channel-v1`            | 数据化逻辑通道授权，不包含运行对象                             |
| `emission-v1`                  | 弹丸逻辑 ID、代次、位置、速度和伤害证据                        |
| `contact-candidate-v1`         | 接触候选，只含来源、目标和接触元数据，不含处理结果             |
| `contact-decision-v1`          | 事务内冻结值：候选身份、处置、独立来源操作、策略轨迹和结果字段 |
| `hit-v1`                       | 来源/目标实体、接触序列和是否消耗                              |
| `damage-v1`                    | 来源/目标 actor、正有限伤害值、类型和接触序列                  |
| `health-state-v1`              | 当前/最大生命、修订号、变化量和原因                            |

每个输出端口必须声明 `delivery: state | event`。state 只保留一个最新修订并可在消费者激活时确定性重放；event 不缓存、不重放，而且图进入 `running` 前禁止发送。固定瞄准、生命状态和实体通道声明是 state；移动命令、攻击请求、发射、接触候选、hit 和 damage 是 event。接触决策不是普通 event，只能存在于受限同步策略事务中。

`contact-decision-v1` 把两个维度正式分开：`disposition = damage | absorb | reflect | cancel | ignore`；`sourceOperation = consume | retain | transfer`。合法组合仅为：damage→consume/retain、absorb→consume、reflect→transfer、cancel→consume、ignore→retain。事务种子固定为 ignore/retain；接触 ID、来源通道/实体/代次、目标 actor 和候选元数据不可变。策略只能改变 Manifest 白名单字段，trace 只能由事务宿主追加一次。

受限 ABI 为：

```ts
type ContactPolicyTransform = (
  decision: FrozenContactDecision,
) => FrozenContactDecision;
```

事务宿主按 profile 顺序逐个调用并检查恰好一次同步返回；Promise/thenable、无返回、抛错、身份改变、越权字段改变、非法组合或错误 trace 都使整笔事务失败。transform 不获得 mutation grant；完整链失败时不得改变来源实体，也不得发送任何结果 event。

capability 默认只在同 owner 范围匹配。跨 owner 输入必须使用结构化约束：`same-owner | different-owner`、来源 actor 角色集合、目标 actor 角色集合、来源实体角色集合。不允许 `any-declared-actor`。玩家弹丸→敌人/Boss 接触必须同时满足来源、目标和实体角色。最终 damage 依赖目标 owner 的 `combat.damage-sink@1.0.0`，不直接依赖 health。sink 描述符声明 filter/terminal-health 角色、输入端口和 filter 的单一下游输出；每个 owner 解析出唯一链头、有序 sink 和唯一终端 health。所有 producer 绑定链头，多个 producer 可共享链头。

## 七、资源预算模型

保留现有四项玩法预算：

- `activeEntities`
- `activeProjectiles`
- `spawnsPerSecond`
- `timers`

语义改为：Manifest 声明上限，规范化资源预留描述符及本地求值器计算精确实例预留，解析器汇总后与 assembly 总预算比较，运行上下文执行同样或更严格的实例配额。求值器代码由实现 bundle 哈希覆盖，不直接哈希函数对象。

弹丸同时计入活动实体和活动弹丸。生成速率使用内核时间最近 1000 ms 窗口。任何超额尝试必须在副作用前失败。对象池耗尽只有在配置明确允许 `drop-and-observe` 时才可以记录丢弃，否则失败关闭。

租约按生命周期拆分：

- `startLeases`：输入监听、端口消费订阅、计时器、碰撞监听和 update 注册；stop 或失败启动后必须为零；
- `instanceLeases`：模块对象池、实体通道、状态缓存和模块观察读取器；stop 时池内活动实体必须为零，dispose 后租约本身为零；
- `graphLeases`：端口路由器、根 actor 目录和共享预算账本；整图销毁后为零。

每个模块都必须有“恰好达到上限”和“超过上限 1”测试。暂停只验证 start 租约清零；dispose 验证 instance 租约清零；整图销毁验证 graph 租约清零。

## 八、Batch 1 十一个模块详细设计

### 8.1 `intent.keyboard-movement@1.0.0`

- **职责：**每次 update 读取方向键和 WASD，合并两组按键，归一化斜向并输出激活或中立移动命令。
- **非职责：**触摸、仲裁、移动速度、actor 修改、边界、瞄准和攻击。
- **配置 Schema：**严格固定为 `{bindings:"arrows-and-wasd", normalizeDiagonal:true, emitNeutral:true}`；v1 不允许自定义键码。
- **输入/输出端口：**无输入；输出 `command: movement-command-v1`。
- **状态及实体所有权：**拥有最后命令和输出序列；所有权域 `player.movement-intent-source.keyboard`；不拥有实体。
- **可用内核接口：**键盘方向轮询、时钟、输出端口、命名空间观察。
- **依赖/冲突/基数：**提供 owner-scoped `intent.movement-source@1.0.0`；无依赖和冲突；每 owner 最多 1、每 assembly 最多 16。
- **生命周期：**initialize 初始化序列；start 开始采样；update 每帧采样一次；stop 在 event 已禁止后只停止采样，不再输出；dispose 清空状态。
- **资源：**四项玩法资源均为 0；观察租约 1。
- **确定性失败：**键盘服务缺失、方向非有限、时间/序列倒退、载荷验证失败、dispose 后 update。
- **验收：**单元测试八方向、中立、方向键/WASD 合并和斜向归一化；契约测试 owner scope 和 stopped event 拒绝；资源测试零运行资源；交互测试连接仲裁；桌面浏览器证明与旧版速度方向一致。

### 8.2 `intent.touch-drag@1.0.0`

- **职责：**确定性捕获一个指针，在主动拖动时输出世界坐标绝对位置命令。
- **非职责：**位置夹取、直接移动 actor、多点手势、攻击/瞄准和仲裁。
- **配置 Schema：**`{capture:"first-active", release:"matching-pointer-up", emitOnDown:false}`，保持旧版按下不立即移动。
- **端口：**无输入；输出 `command: movement-command-v1`。
- **状态/所有权：**捕获的 pointer ID、最新位置和序列；`player.movement-intent-source.touch`；无实体。
- **内核接口：**可取消 pointer down/move/up、时钟、输出和观察。
- **依赖/冲突/基数：**提供 owner-scoped `intent.movement-source@1.0.0`；每 owner 1。
- **生命周期：**start 注册三个监听；stop 在 event 已禁止后只释放捕获并删除三个监听，不再输出；dispose 幂等。
- **资源：**玩法资源 0；输入租约 3、观察租约 1。
- **失败：**重复捕获、无效坐标、缺少 disposer、stop 后仍收到监听、载荷错误。其他指针移动只忽略并观察，不算失败。
- **验收：**捕获/移动/抬起/竞争指针单元测试；监听清理契约；移动仲裁交互；移动浏览器与旧版拖到指针位置一致；重启无重复监听。

### 8.3 `intent.movement-arbiter@1.0.0`

- **职责：**从多个移动源确定性选择唯一命令。
- **非职责：**读取设备、平滑、施加速度/边界、修改或相加命令。
- **配置 Schema：**`{policy:"touch-while-active-else-keyboard", keyboardSourceId, touchSourceId}`；v1 不做向量平均。
- **端口：**必需多输入 `commands: movement-command-v1`，同 owner；输出 `resolved: resolved-movement-command-v1`。
- **状态/所有权：**每个绑定源的最新命令和已选源；独占 `player.movement-intent`。
- **内核接口：**端口订阅、输出、时钟、观察。
- **依赖/冲突/基数：**至少一个 owner-scoped `intent.movement-source@^1.0.0`；与其他已解析移动意图 owner 冲突；每 owner 1。
- **生命周期：**initialize 验证配置 ID 均已绑定；start 订阅；stop 只取消订阅，移动模块在反向 stop 中自行清零速度；dispose 清空缓存。
- **资源：**玩法资源 0；最多 16 个端口订阅、1 个观察读取器。
- **失败：**配置源未绑定、源 ID 重复、序列陈旧、未声明源输入、输出失败。
- **验收：**触摸仅在激活时优先，释放同一调度轮恢复键盘；错误 owner/未绑定 ID 拒绝；键盘+触摸端到端；桌面/移动同时输入结果每次一致。

### 8.4 `locomotion.bounded@1.0.0`

- **职责：**把已仲裁的速度方向或绝对位置应用到 owner actor，并保持碰撞体位于视口内边距内。
- **非职责：**输入读取/仲裁、actor 创建、动画、冲刺/聚焦/惯性、碰撞后果和相机。
- **配置 Schema：**`moveSpeed:50..2000`，四边 `0..256`，`absoluteMode:"clamp"`，`neutralMode:"zero-velocity"`，并验证剩余活动区域为正。
- **端口：**必需同 owner 输入 `command: resolved-movement-command-v1`。
- **状态/所有权：**最新命令和 owner actor 变换/速度；独占 `player.locomotion`；引用但不创建宿主 actor。
- **内核接口：**owner actor 安全句柄、视口、端口订阅、观察。
- **依赖/冲突/基数：**需要 owner-scoped `intent.movement-resolved@1.0.0`；与其他基础变换 owner 冲突；每 owner 1。
- **生命周期：**initialize 解析 active actor；start 订阅并清零速度；update 应用速度或夹取绝对位置；stop 清零并取消；dispose 丢弃句柄。
- **资源：**玩法资源 0；端口订阅 1、观察 1。
- **失败：**actor 缺失/未激活、边界无效、命令非有限、所有权不符、dispose 后操作。
- **验收：**速度、四边、四角、绝对夹取纯测试；独占变换契约；键盘/触摸交互；桌面和移动位置、速度、边界与固定场景在容差内等价。

### 8.5 `targeting.fixed-forward@1.0.0`

- **职责：**为主攻击发布固定世界向上单位方向。
- **非职责：**输入、目标搜索、追踪、触发时序、弹丸创建和方向射击。
- **配置 Schema：**复用现有夹具 `{angleDegrees:-90}`。
- **端口：**state 输出 `selection: target-selection-v1`，采用 replay-latest。
- **状态/所有权：**不可变方向；独占 `attack.primary-targeting`；无实体。
- **内核接口：**输出和观察。
- **依赖/冲突/基数：**提供 owner-scoped `targeting.selection@1.0.0`；与其他主瞄准 owner 冲突；每 owner 1。
- **生命周期：**initialize 把世界向上写入状态路由器；所有模块初始化完成后重放；暂停恢复时向重新激活的消费者重放；stop/dispose 无 start 租约残留。
- **资源：**全部玩法资源 0；观察 1。
- **失败：**角度不是 -90、向量无效、输出未绑定或载荷非法。
- **验收：**精确得到 `{x:0,y:-1}`；复用 legacy-forward 夹具；连接投送；浏览器证明 Batch 1 玩家弹丸水平速度 0、垂直速度为负。

### 8.6 `trigger.interval@1.0.0`

- **职责：**started 期间按固定间隔发出主攻击请求。
- **非职责：**瞄准、伤害、弹药、玩家攻击输入、弹丸生成和池策略。
- **配置 Schema：**`intervalMs:50..10000`，`firstEmission:"after-interval"`，保持旧版首发时机。
- **端口：**event 输出 `request: attack-request-v1`。
- **状态/所有权：**计时器、请求序列和最后触发时间；独占 `attack.primary-trigger`。
- **内核接口：**计费可取消计时器、输出和观察。
- **依赖/冲突/基数：**提供 owner-scoped `trigger.attack@1.0.0`；与其他主触发 owner 冲突；每 owner 1。
- **生命周期：**start/恢复恰好获取一个循环计时器；stop/暂停取消；游戏重开创建新图和新序列；dispose 最多取消一次。
- **资源：**`timers:1`，其余玩法资源 0；观察 1。
- **失败：**出现第二个存活计时器、stop 后回调、序列倒退、预算或端口失败。
- **验收：**假时钟首发、重复节拍、暂停/恢复、游戏重开、无补发爆发；峰值计时器 1；驱动投送；浏览器触发时间与旧版相差不超过一帧。

### 8.7 `delivery.projectile@1.0.0`

- **职责：**组合最新方向和攻击请求，从自有有界池取得弹丸、配置并发布通道/发射证据。
- **非职责：**决定触发时机、选择目标、处理碰撞、修改生命、实现其他轨迹、多发或敌人回收。
- **配置 Schema：**`speed:100..2000`、`damage:0.001..100000`、固定玩家弹丸资产角色、生成偏移各 `-256..256`、`maxActive:1..256`、`maximumSpawnRate:1..20`、回收边距 `0..256`、池耗尽策略固定 `drop-and-observe`。
- **端口：**必需同 owner state 输入 `target: target-selection-v1` 和 event 输入 `attack: attack-request-v1`；state 输出 `projectiles: entity-channel-v1`，event 输出 `emission: emission-v1`。
- **状态/实体所有权：**最新目标、请求序列、池、通道、弹丸代次 ID、丢弃计数；独占 `attack.primary-delivery`；拥有池中全部弹丸。
- **内核接口：**owner 位置只读、拥有的池/通道、安全实体句柄、资产角色、视口、实例预算、输出和观察。
- **依赖/冲突/基数：**需要 owner-scoped targeting 和 trigger；与其他主投送 owner 冲突；每 owner 1。
- **生命周期：**initialize 解析资产、创建空池/通道并写入通道 state；路由器在运行前重放目标和通道；attack event 获取/配置；update 回收；stop 将全部弹丸回池但保留空的 instance 池/通道；恢复时重放 state；dispose 清池并撤销通道。
- **资源：**Manifest 上限为实体 256、弹丸 256、每秒生成 20、计时器 0；实例预留为 `maxActive`、`maxActive`、`maximumSpawnRate`、0；图校验触发上界不超过配置生成率；端口订阅 2、观察 1、通道 1。
- **失败：**目标/通道未就绪、请求陈旧、actor/资产非法、操作非自有实体、预算账目漂移、未授权通道或非法发射。合法池耗尽只能记录丢弃。
- **验收：**速度、偏移、伤害、代次、回收、池耗尽单元测试；必需端口和通道授权契约；属性测试不超活动量/生成率；与瞄准、触发、碰撞连接；浏览器与旧版生成点、速度、伤害、池上限和回收计数等价。

### 8.8 `combat.health@1.0.0`

- **职责：**拥有一个 actor 的当前/最大生命，按绑定顺序应用伤害，夹到 0，并发布状态变化。
- **非职责：**碰撞检测、护盾、无敌、治疗、销毁 actor、计分、Boss 阶段和结果。
- **配置 Schema：**`maxHealth:0.001..100000`、`initialHealth:0.001..maxHealth`、`damageFloor:0`。
- **端口：**必需同 owner、多来源 event 输入 `damage: damage-v1`；state 输出 `state: health-state-v1`，采用 replay-latest。
- **状态/所有权：**当前/最大生命和 revision；独占 `combat.health`；无实体。
- **内核接口：**端口订阅、输出、观察。
- **依赖/冲突/基数：**提供 owner-scoped `combat.health@1.0.0` 和终端 `combat.damage-sink@1.0.0`，没有下游 sink 输出；同 actor 不允许第二个生命或终端 sink owner；每 owner 1、assembly 最多 128。
- **生命周期：**initialize 建立状态并写入 revision 0；运行期每次伤害只增加一次 revision 并替换最新 state；stop/暂停取消 event 订阅但保留实例状态；恢复时重放；游戏重开通过 dispose 后重新实例化获得初始状态。
- **资源：**玩法资源 0；端口订阅 1、观察 1。
- **失败：**伤害目标不是 owner、伤害非正/非有限、同来源接触序列重复、stop 后伤害、revision 溢出、载荷错误。
- **验收：**扣减、归零、顺序、只耗尽一次、重复拒绝属性测试；owner 和多伤害来源契约；碰撞一次对应 revision 一次；关闭护盾/无敌后浏览器生命变化与固定场景基础伤害等价。

### 8.9 `interaction.projectile-contact@1.0.0`

- **职责：**监听一个受授权弹丸通道与 owner actor 的重叠，为每个活动来源代次/目标组合只输出一个不可变接触候选。
- **非职责：**消费、失活、转移或反射弹丸；选择策略；输出伤害；修改生命或防御。
- **配置 Schema：**严格来源实体角色、目标 actor 角色和 `maximumTrackedContacts:1..4096`；目标角色必须与 owner 一致。
- **端口：**state 输入 `sources: entity-channel-v1`，跨 owner 约束必须明确 different-owner、来源/目标 actor 角色和来源实体角色；event 输出 `candidate: contact-candidate-v1`。
- **状态/实体所有权：**一个 overlap 规则、接触序列和有界活动代次账本；独占 `combat.contact-detection.<source-role>`；不拥有实体。
- **内核接口：**来源通道只读权限、owner actor、安全可取消 overlap、活动代次快照、输出和观察；没有回收/转移权限。
- **依赖/冲突/基数：**需要兼容实体通道；同 owner 同来源/目标规则只能有一个 detector；assembly 最多 64。
- **生命周期：**initialize 验证授权；start 获得一个 overlap start lease；update 根据通道活动代次表淘汰账本；stop 删除 overlap 并清运行账本；dispose 释放实例状态。
- **资源：**玩法资源 0；start leases 为端口订阅 1、overlap 1；instance observation 1；账本硬上限不得超过来源池容量与目标上限的验证结果。
- **失败：**角色/owner/通道错误、过期或失活来源、重复候选、账本上限、缺 disposer、running 外 event、载荷错误。
- **验收：**证明检测绝不改变来源；每代次/目标恰好一个候选；角色授权、代次淘汰、硬上限、stop 清理和长时间内存稳定；浏览器几何和接触次数与固定路径一致。

### 8.10 `interaction.contact-default-damage@1.0.0`

- **职责：**在已准入策略事务中，把一个冻结种子决策同步转换为默认 `damage/consume` 决策。
- **非职责：**碰撞检测、实体操作、护盾、无敌、吸收、反射、极性和生命修改。
- **配置 Schema：**严格 `{damageKind:"projectile", defaultDisposition:"damage", defaultSourceOperation:"consume"}`。
- **端口/执行 ABI：**没有普通 state/event 端口。注册声明 `executionModel:"contact-policy-transform-v1"`、输入/输出 `contact-decision-v1`、`policyPhase:"default"`、前后继约束、受支持证据 ID，以及 `disposition,sourceOperation,damage` 可修改字段白名单。
- **状态/实体所有权：**无状态；独占 `combat.contact-policy.default-damage` 角色；无实体、订阅或授权。
- **内核接口：**无。事务宿主只传入和接收冻结值，transform 不能访问端口、时间、actor、实体、mutation grant 或异步服务。
- **依赖/冲突/基数：**每个已准入 profile 恰好一个默认策略；与另一默认初始化器冲突；后续转换只能按 profile 精确顺序出现。
- **生命周期：**bundle 随图注册验证，但单次 transform 不获得租约、不保留实例状态。
- **资源：**玩法资源和运行租约均为 0。
- **失败：**返回 Promise/thenable、无返回、抛错、修改输入、改变身份/trace/非白名单字段、非法 disposition/sourceOperation 组合、伤害非正、profile 不符或同事务二次调用。
- **验收：**一次调用恰好返回一个冻结 `damage/consume` 值，只改变白名单且绝不接触来源实体；契约测试拒绝缺失、重复、异步、抛错和身份篡改，并证明宿主只追加一次本策略 ID。

### 8.11 `interaction.contact-resolution@1.0.0`

- **职责：**接收候选，在一个有深度上限的同步事务中执行已解析 profile，验证唯一最终决策，执行唯一受授权的来源操作，再输出结果。
- **非职责：**检测重叠、发明/重排策略、护盾或无敌行为、生命存储、计分和结果。
- **配置 Schema：**严格 `{policyProfileId,policyProfileVersion,allowedDispositions,allowedSourceOperations,maxResolvedContacts}`；Batch 1 使用受审查默认伤害 profile，分别只允许 `["damage"]` 和 `["consume"]`。
- **端口：**event 输入 `candidate: contact-candidate-v1`；event 输出 `hit: hit-v1`、`damage: damage-v1` 以及后续可选资源/转移证据；damage 必须绑定目标 owner 恰好一个 `combat.damage-sink@1.0.0`，而不是直接要求 health。
- **状态/实体所有权：**决议序列和有界 in-flight 集；独占 `combat.contact-resolution.<source-role>`；不拥有实体，但独占绑定来源通道的 mutation grant。
- **内核接口：**策略事务宿主、受授权通道变更、owner 身份、event 输入/输出、预算和观察。
- **依赖/冲突/基数：**需要一个精确解析的 `ContactPolicyChainProfile` 及其策略产物；damage 需要同 owner 单线 sink 链唯一终止于 health；相同规则只能有一个 resolver；assembly 最多 64。
- **生命周期：**running 中每个候选在同一同步事务完成；完整成功后才可消费/转移，且发生在结果 event 之前；stop 取消候选订阅并清 in-flight；dispose 撤销 mutation grant。
- **资源：**玩法资源 0；端口 start lease 1；观察 instance lease 1。
- **失败：**未知/未审查 profile 或顺序；transform 缺失、重复、异步、抛错、改变身份或越权修改；组合/trace 非法；来源失活或代次变化；重复决议；未授权变更；producer 绑定非链头、伤害链分叉/成环/重复或未终止；running 外 event；载荷错误。transform 失败不得产生 mutation 或结果 event。
- **验收：**每个策略按精确顺序恰好执行一次；完整验证前身份和来源不变；失败无 mutation/event；成功消费先于 hit/damage；Batch 1 damage 穿过唯一终端 sink 并只产生一个 health revision。

## 九、六条端到端代表性交互

### 9.1 键盘意图 → 有界移动

键盘模块每帧输出归一化命令，仲裁器选择键盘，有界移动模块应用 `direction × moveSpeed`。中立命令同帧清零速度，碰撞体不能越过配置边界。

### 9.2 触摸拖动 → 有界移动

pointer down 只捕获不移动；匹配 pointer move 输出绝对世界位置；仲裁器选触摸；移动模块夹取后设置位置；匹配 pointer up 释放触摸控制。

### 9.3 键盘和触摸同时存在

触摸捕获并激活时始终优先，与回调顺序无关。仲裁器仍保存最新键盘命令；匹配 pointer up 的同一确定性调度轮立即恢复键盘。不叠加、不平均，也不同时应用两次移动。

### 9.4 固定瞄准 → 间隔触发 → 弹丸投送

固定瞄准在 initialize 写入世界向上 state。全部模块初始化后，路由器先向投送模块重放该状态；所有模块 start 成功、图进入 running 后，触发器才可在完整一个间隔后发请求 0。目标缺失时投送不得自行假定方向。

### 9.5 弹丸命中 → 伤害 → 生命变化

投送通道先连接接触检测，再把候选交给最终决议模块。决议模块构造冻结种子，在同一事务中按已审查 profile 调用默认伤害及后续可选策略；Batch 1 得到 `damage/consume`。完整验证成功后才消费来源并发 hit/damage。damage 进入目标 owner 的线性 damage-sink 链，Batch 1 直接唯一终止于 health 并只产生一次 revision；后续护盾/无敌作为上游 sink 插入，不能旁路 health。

### 9.6 暂停、恢复、游戏重开和释放

stop 表示暂停：先禁止 event，再反向释放全部 start leases；移除接触监听、取消计时器、清零移动、释放 pointer，并把活动弹丸全部回池，但保留空池、通道和状态。恢复重新获取 start leases，并在 event 启用前重放 state。游戏重开必须 dispose 旧实例后重新 instantiate；图销毁再释放 graph leases。部分启动失败按相同作用域反向回滚。

## 十、旧版行为等价证明

| 行为     | 固定路径基线                                 | 模块路径验收                                                                                                                     |
| -------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 键盘     | 方向键/WASD 合并，斜向归一化                 | 八方向、模长 1、速度、中立停止和帧位置在一个物理步容差内一致                                                                     |
| 触摸     | 捕获 pointer ID，仅按下移动事件设置夹取位置  | 相同 down/move/up，位置误差不超过 0.5 px，竞争指针忽略，重启无重复                                                               |
| 边界     | Phaser world bounds + viewport clamp         | 四边/四角均不越过等价边界，桌面/移动均测                                                                                         |
| 基础射击 | 完整间隔后首发，玩家偏移位置生成向上池化弹丸 | 触发时间一帧内，x 速度 0，y 速度/伤害/偏移/活动上限/回收计数一致                                                                 |
| 基础战斗 | 弹丸只消耗一次，伤害一次，生命扣减           | 候选只进入受审查 profile 一次；默认 transform 在 trace 恰好一次；`damage/consume` 经过唯一 sink；一个 hit 和一个 health revision |
| 清理     | 场景切换取消已知计时器并重建                 | stop 清 start leases/活动实体；dispose 清 instance leases；图销毁清 graph leases；两次暂停恢复和两次新游戏计数不增长             |

模块浏览器测试必须与固定路径桌面/移动验证并行存在，不得替换或修改不可变旧版基线。等价失败应转化为可复用契约、测试或设计修正，不能针对单个游戏打补丁。

## 十一、四个实施批次与退出门槛

### Batch 1：基础可执行战斗

十一个模块按本文实现。退出门槛：模块图能够启动、移动、射击、无副作用检测接触、经过可替换策略完成最终决议、改变生命、暂停恢复、重新实例化新游戏并按作用域释放；固定路径保持通过。

### Batch 2：旧版攻防能力

方向瞄准、主动攻击、聚焦、齐射/多发、八种旧版弹幕、护盾、无敌、擦弹、拾取和修饰。退出门槛：纯规划结果、时序、对象池争用以及桌面/触摸行为与旧版等价。

### Batch 3：遭遇、计分、结果和完整旧版图

波次、普通敌人来源、Boss 阶段、计分、结果协调和全图重启。退出门槛：旧版 v2 完整表达为模块图，并通过等价浏览器、恢复和打包证据。固定路径仍不自动删除。

### Batch 4：组合广度

冲刺/惯性、追踪、代表性非弹丸、抵消/吸收/反射/极性/状态、蓄力/冷却/弹药/能量、升级/进化/配装、竞技场/房间/计时目标和伙伴。退出门槛：方向射击、自动瞄准、极性吸收和槽位装备夹具成为可执行支持图。

## 十二、模块准入和兼容性门槛

每个正式模块必须具备：

1. 精确 ID/版本、规范化 Manifest/描述符、本地验证器/求值器、实现 bundle 和精确产物哈希；
2. capability、端口语义、owner 关系、依赖、冲突、基数和所有权；
3. 资产需求、玩法资源、start/instance/graph 租约、浏览器支持和来源证据；
4. 纯逻辑单元/属性测试和所有确定性失败测试；
5. 配置、端口、owner、生命周期、回滚和资源契约测试；
6. 需要的成对兼容测试和指定代表性交互；
7. 对用户可见行为的桌面/触摸浏览器证据；
8. 固定路径无回归，且没有秘密、依赖、许可证或权限违规。

兼容性分五层：

1. 静态兼容；
2. 生命周期兼容；
3. 成对契约；
4. 三个以上模块的代表性交互；
5. 浏览器行为和旧版等价。

不进行无界笛卡尔组合测试。未获得代表性交互证据的组合必须明确标为不支持，不能因端口名称相同就声称兼容。特别是策略顺序不能留到兼容测试才发现：装配只能引用已审查 profile，解析器必须同时核对 profile 和各策略 Manifest，并在实例化前拒绝未知排列。

## 十三、用户已批准的设计决策

前九项原则和十一模块结论已确认，以下四个二审闭环也已由用户批准：

1. 最终接触决议依赖同 owner `combat.damage-sink@1.0.0`；解析器证明所有 producer 只进入唯一链头，链无分叉、重复或环，并唯一终止于 health。Batch 1 的 health 提供终端 sink，能力本身不是第十二个模块。
2. `disposition` 与 `sourceOperation` 是两个必填正交字段，严格执行五类处置的合法组合表；Batch 1 分别只允许 `damage` 和 `consume`。
3. 所有接触策略使用恰好一次、同步、冻结值的 `ContactPolicyTransform` ABI；身份字段和 trace 受宿主管理，完整事务失败时禁止任何 mutation 和结果 event。
4. 装配只引用注册表拥有的 `ContactPolicyChainProfile`；解析器同时验证 profile 与策略 Manifest 的版本、阶段、前后继、证据和字段白名单，未知顺序确定性拒绝。

这四点不改变 Batch 1 的十一模块结论，也不提前实现方向射击、护盾或其他后续玩法。

Phase 8 另行设计受审查的 `AssemblyRecipe`：模型选择高层配方和有界参数，确定性代码展开为普通 `GameAssemblySpec`。配方不能绕过 Schema、解析、所有权、预算、证据或验证。这是后续设计要求，不是 Phase 7 当前开发动作。

## 十四、精确实现顺序

1. 实现 Manifest 1.1、state/event 载荷、决策组合表、damage-sink 能力、策略 transform/profile 描述符、结构化跨 owner 授权、capability scope、规范化描述符和构建产物哈希；升级解析器及失败测试。
2. 实现 ResolvedModuleGraph 1.1、策略 profile 展开和顺序校验、线性伤害链证明、正式 bundle 注册、state 路由器、event 阶段与循环拒绝。
3. 实现 provider-first 生命周期、部分失败回滚、start/instance/graph 租约、暂停恢复和新游戏重建。
4. 扩展运行内核：可取消输入/碰撞、安全实体句柄/通道、受限 mutation grant、实例预算和有界活动代次查询；保持旧 `PlayScene` 行为不变。
5. 实现键盘、触摸、仲裁和有界移动，并建立桌面/移动等价证据。
6. 实现固定瞄准、间隔触发、弹丸投送、接触检测、策略事务宿主/默认伤害 transform、最终接触决议和终端 damage-sink 生命，并完成基础战斗浏览器切片。
7. 运行统一质量门、固定模板浏览器回归和暂停/新游戏分作用域泄漏验证，再决定 Batch 2。

## 十五、当前验证状态

本轮只修改设计文档，没有实现玩法代码。已完成：

- 文档格式检查通过；
- 文档治理、现有模块契约和运行内核契约测试 17/17 通过；
- 完整测试 42 个文件、200/200 通过；
- 修订后 Batch 1 十一个模块结构审计通过；每个模块均具备职责、非职责、Schema、端口、所有权、内核接口、依赖/冲突/基数、生命周期/资源、失败条件和验收；
- 六条端到端交互完整；
- ROADMAP、HANDOFF、CURRENT_STATUS 均在行数治理上限内。

尚未完成且不能提前声称通过：

- Manifest/Graph 1.1 代码；
- 正式实现工厂和实例化器；
- 十一个修订后的 Batch 1 模块；
- 模块路径浏览器等价证据；
- 模块路径恢复和打包证据。
