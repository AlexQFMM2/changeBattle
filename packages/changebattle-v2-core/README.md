# ChangeBattle V2 Core

`@changebattle-v2/core` 是 ChangeBattle V2 的共享规则包。它负责放“跨端共用、可测试、无副作用”的静态数据和纯规则，给 `apps/api`、`apps/web`、`apps/desktop`、测试和工具脚本共同使用。

这个包不是业务执行层。Dex 查询、存档读写、正式 run 编排、宝可梦实例实际修改、UI 交互、Electron bridge 都不应该放进 core。

## 职责边界

应该放在 core：

- 静态 catalog：星图节点、商店商品、休息中心服务、正式模式基础配置。
- 纯规则：价格表、费用折扣、等级/IV/EV 档位、NPC 分级、技能质量要求、训练室收益范围。
- 纯判断：某个物种是否可随机生成、某个 NPC 类型属于哪个强度档、某个 round 是否享受折扣。
- 纯评分/权重：玩家画像合并权重、NPC 针对强度、候选评分所需的无状态规则。
- 可复用类型：跨 API/Web/Desktop 使用的规则输入、规则输出和 catalog 类型。

不应该放在 core：

- Showdown Dex service 调用、招式/物种详情查询、真实可学习技能解析。
- `FormalGameRunV4` 的流程推进、休整页生成、战斗结算、仓库写入。
- 直接修改 `LocalPokemonV4`、玩家存档、背包、箱子、金币、BP。
- React 组件、Electron IPC、localStorage、desktop save store。
- 隐式效果执行器。例如星图 runtime effect 只能声明效果，具体 `if/else` 执行仍在 API/UI 的显式业务入口里。

一句话：core 决定“规则是什么”，API/Web/Desktop 决定“什么时候执行、怎么落到存档和界面上”。

## 目录索引

### 正式模式基础

- `formalGameCatalog.ts`：正式模式常量、NPC 训练家类型、fallback 物种/招式、starter role、基础标签。
- `formalShopCatalog.ts`：正式商店商品池、显式价格表、价格区间、商品分类、补货权重。
- `restCenterCatalog.ts`：休息中心服务 catalog。
- `playerHonorCatalog.ts`：玩家荣誉 catalog/types 预留。
- `natureCatalog.ts`：标准性格中文名和能力修正表。

### 队伍生成

- `formalSpeciesRanks.ts`：人工维护的物种 rank 表。
- `formalSpeciesRules.ts`：物种 rank 查询、starter 允许 rank、究极异兽 legendary 归类、随机形态过滤。
- `formalPowerProfileRules.ts`：数值强度档、等级/IV/EV 范围、档位 normalize/advance/infer、确定性随机 helper。
- `formalTeamGenerationRules.ts`：玩家 starter 档位 deck、NPC 类型分级、NPC 等级加成、team preference 到 role 的映射。
- `formalMoveGenerationRules.ts`：玩家/NPC 正确技能数量、boss preset 招式优先级、role 补位技能偏好。
- `formalPlayerProfileRules.ts`：玩家队伍画像/上一场出招画像的数据结构、合并权重、针对强度规则。

### 训练与星图

- `formalTrainingGroundRules.ts`：训练室课程表、课程轮换、自习事件权重、自习 IV/EV 收益范围、课程折扣、东亚教育稳定收益 helper。
- `starChartCatalog.ts`：星图节点、成本、前置、UI 文案、runtime effect 声明。

### 统一出口

- `index.ts`：core 包公开导出入口。新增可复用规则模块后，需要从这里导出。

## 开发规范

### 1. 先判断规则归属

新增逻辑前先问三件事：

- 这个值是否需要 Web/Desktop/API/测试共用？
- 这个判断是否不依赖存档 IO、Dex service、React 状态和运行时副作用？
- 后续平衡调整时，策划是否应该只改一个集中规则文件？

如果答案大多是“是”，优先放 core。否则留在 API/UI。

### 2. 数值规则和执行逻辑分开

core 只返回规则结果，例如：

- 课程基础费用是多少。
- 当前 round 是否打折，折扣后费用是多少。
- NPC 类型对应哪个 power profile。
- 自习事件的 IV/EV 收益范围是多少。
- 普通 NPC 至少需要几个正确技能。

API 再负责真正执行：

- 扣金币、写 coinLog。
- 修改宝可梦 IV/EV/性格/HP。
- 生成 `LocalPokemonV4`。
- 保存 run/profile/playerVault。

### 3. 技能规则和数值规则分开

队伍生成相关规则必须保持拆分：

- 数值规则只管等级、IV、EV、性格、特性强度、power profile。
- 技能规则只管有效技能数量、推荐技能优先级、preset moves fallback。
- 物种规则只管物种 rank、形态过滤、legendary/Ultra Beast 归类。

不要在一个 helper 里同时决定物种、数值和技能，否则后续平衡会很难查。

### 4. 星图只声明 runtime effect

`starChartCatalog.ts` 里的 `effects` 是 UI 文案，`runtimeEffects` 才是业务效果声明。

新增星图天赋时需要同时做：

- 在 catalog 中新增节点、成本、前置、文案。
- 如有业务效果，新增稳定的 runtime effect id。
- 在 API/Web 的具体业务入口显式判断，例如 `if (starChartHasRuntimeEffectV4(...))`。
- 增加 smoke 断言，覆盖“解锁关系”和“业务效果生效”。

不要在 core 里做“自动执行所有 runtime effect”的注册器。效果执行必须留在业务入口，方便查问题和删除天赋。

### 5. 调参优先改 core

以下类型的平衡调整，默认应该在 core 找入口：

- 商店价格、价格范围、商品池。
- 新增正式商店商品时，必须同时补 core 显式价格表和 smoke 断言；不要在 API/UI 按 dex cost 或招式威力动态定价。
- 训练室课程费用、折扣、自习权重、自习收益范围。
- NPC 分级、等级加成、数值档位。
- 玩家/NPC 正确技能数量。
- 物种 rank 和随机池过滤。
- 星图节点成本、前置和 runtime effect 声明。

如果发现同类常量散落在 `apps/api/src/formalGame.ts` 或 React 组件里，应优先考虑迁回 core。

### 6. 测试要求

改 core 规则时，至少补一条能锁住规则的 smoke/unit 断言。常用命令：

```bash
pnpm --dir changeBattleV2 --filter @changebattle-v2/core build
pnpm --dir changeBattleV2 --filter @changebattle-v2/api typecheck
pnpm --dir changeBattleV2 --filter @changebattle-v2/web typecheck
pnpm --dir changeBattleV2 --filter @changebattle-v2/api test:formal-game
```

如果改动会影响 desktop release，还需要按 release 文档跑 desktop 相关检查。

### 7. 命名约定

- catalog 文件用 `*Catalog.ts`，表达静态列表/表格。
- 纯规则文件用 `*Rules.ts`，表达判断、映射、权重、费用和范围计算。
- 常量使用明确业务前缀，例如 `FORMAL_TRAINING_GROUND_*`、`FORMAL_SHOP_*`。
- runtime effect id 使用稳定英文 snake_case，不随中文文案变化。
- helper 名称要写清业务范围，例如 `formalTrainingGroundLessonFeeV4`，不要用模糊的 `calculateFee`。

### 8. 版本兼容

core 规则变更通常不直接迁移旧存档。涉及旧存档时：

- catalog 删除节点时，normalize 应自然忽略不存在的节点。
- 新字段应在 API normalize 层兼容缺省值。
- 不要让 core 依赖具体存档版本；core 只提供规则和默认值。
