# Battle V4 AI Decision Architecture Plan

## Summary

本计划只处理 Battle V4 的 AI 决策，不处理队伍生成器。队伍生成器负责“训练师带什么牌”，AI 决策器负责“当前手里这些牌怎么打”。

AI 决策采用长期可维护的评分搜索架构：

```txt
Showdown request
-> LegalActionGenerator 生成所有合法候选
-> FeatureExtractor 抽取行动特征
-> UtilityScorer 按对战偏好加权打分
-> CandidatePruner 裁剪候选
-> SearchPlanner 按 AI 等级决定搜索深度
-> ChoiceAssembler 输出合法 Showdown choice
```

这不是传统行为树。行为树适合处理硬规则和门控，例如强制换人、不能选择濒死目标、不能生成非法特殊系统动作；真正的主脑使用 Utility AI：把所有合法行动算出特征分，再按偏好权重合成最终分数。高等级 AI 在此基础上做有限深度搜索。

## Why This Algorithm

- 宝可梦对战的合法行动空间很大，尤其双打/合作里有多个 active、多个目标、换人、Mega/Z/极巨/太晶。纯行为树会迅速变成大量 if/else，后续很难维护。
- Utility AI 适合“同一套决策器，不同训练师偏好”。进攻、防守、辅助只需要换权重，不需要写三套 AI。
- AI 等级天然对应搜索深度、候选宽度和随机扰动。菜鸟可以乱打，冠军可以深思，但所有等级都共享同一套合法行动生成和评分管线。
- 候选裁剪能控制组合爆炸。冠军可以看 4 层，但每层只保留 Top K 候选，不做全量暴力展开。
- 决策过程可 debug。每次记录候选、特征、权重、最终分和选择原因，后续调 AI 会比调行为树容易很多。

## Core Model

AI profile 分两件事：

```ts
type BattleAiLevelV4 =
  | "rookie"      // 菜鸟
  | "normal"      // 一般
  | "elite"       // 精英
  | "gymLeader"   // 馆主
  | "eliteFour"   // 四天王
  | "champion";   // 冠军

type BattleAiPreferenceV4 =
  | "offense"     // 进攻
  | "defense"     // 防守
  | "support"     // 辅助
  | "balanced";   // 平衡

type BattleAiProfileV4 = {
  level: BattleAiLevelV4;
  preference?: BattleAiPreferenceV4;
};
```

- `level` 只决定思考深度、候选裁剪宽度、随机扰动和失误率。
- `preference` 只决定评分权重。
- 特殊系统不是等级权限。所有等级都能使用 Mega/Z/极巨/太晶，只是菜鸟可能乱用，冠军更会判断时机。
- AI 暂时不使用道具。
- AI 可以读取场上和队伍的明牌信息。

建议等级参数第一版：

| 等级 | 搜索深度 | 行动特点 |
| --- | ---: | --- |
| 菜鸟 | 0 | 合法随机为主，随机扰动大，可能乱用特殊系统 |
| 一般 | 0 | 选择当前回合高分行动，偏高威力/STAB/击杀 |
| 精英 | 1 | 看一层回应，开始规避明显差行动 |
| 馆主 | 2 | 资源判断更稳，偏好权重更明显 |
| 四天王 | 3 | 双打集火、保护、辅助目标选择更好 |
| 冠军 | 4 | 有限搜索最深，随机扰动最低，保留资源能力最好 |

## Decision Pipeline

### LegalActionGenerator

从当前 `BattleServiceRequestV4` 生成候选，不从 UI 状态或自定义字符串硬造指令。

候选包括：

- team preview 选择。
- 强制换人。
- 普通换人。
- 普通出招。
- 需要目标的出招。
- Mega / Mega X / Mega Y / Z / 极巨 / 太晶等特殊系统后缀。
- doubles / coop 的多 active 组合。

生成阶段必须保证：

- disabled 或 0 PP 招式不作为常规候选。
- 濒死或 commanding 的 active 自动 pass。
- 强制换人不重复选择同一只后备。
- 特殊系统只在 request 暴露对应 `can*` 字段时生成。
- 最终 choice 继续走现有 ruleSet 过滤和 Showdown 接受校验。

### FeatureExtractor

第一版先做启发式特征，不做完整伤害模拟，但宝可梦核心机制必须进入 feature 家族。实现可以先粗后细，接口和 debug 维度不能缺位：

- `damage`：基础威力、类别、当前 PP、粗略输出价值。
- `ko`：根据目标剩余 HP 的粗略击杀机会。
- `stab`：本系加成。
- `typeAdvantage`：属性克制/抵抗/无效。
- `accuracy`：命中风险。
- `survival`：自己残血、濒死风险、换人收益。
- `protect`：守住类动作价值。
- `recovery`：回复类动作价值。
- `support`：帮助、顺风、控速、异常、强化等辅助价值。
- `switch`：换人价值。
- `special`：Mega/Z/极巨/太晶带来的收益与资源成本。
- `targeting`：双打集火、补刀、避免打空目标。
- `weather`：天气收益/损失，例如雨天水火修正、天气启动/覆盖、天气受益方。
- `terrain`：场地收益/损失，例如电气/青草/精神/薄雾场地对技能、状态和回复的影响。
- `room`：空间/控速收益，例如戏法空间、顺风、速度变化对先后手和输出窗口的影响。
- `statStage`：能力等级变化价值，包括强化、削弱、当前攻防速命中闪避等级对行动收益的影响。
- `ability`：特性联动价值，例如威吓、降雨、悠游自如、恶作剧之心、避雷针等对当前行动的修正。
- `item`：携带道具联动价值，例如讲究、剩饭、气势披带、生命宝珠、树果、Mega/Z/太晶相关资源。

这些 feature 仍然只服务“当下牌局怎么打”，不把天气队、空间队、毒守队等构筑风格写进 AI 决策核心。构筑风格属于后续队伍生成器；AI 只读取当前场面和已有资源，然后让相关 feature 自然影响分数。

### UtilityScorer

每个行动先形成 feature vector，再按偏好权重合成：

```txt
score = dot(features, preferenceWeights)
      + levelBonus
      + randomNoise(level)
      - riskPenalty
```

偏好只改权重：

- 进攻：提高 `damage / ko / typeAdvantage / special`。
- 防守：提高 `survival / protect / recovery / switch / item`。
- 辅助：提高 `support / targeting / room / terrain / weather / statStage / ability`。
- 平衡：所有权重接近 1。

### CandidatePruner

为防止双打和多层搜索爆炸，分两层裁剪：

- 单 active 先按分数保留 Top N。
- 多 active 组合成完整回合 choice 后，再保留 Top K。

菜鸟可以直接合法随机；一般及以上才启用稳定 Top K。冠军也必须受裁剪和时间预算限制。

### SearchPlanner

高等级 AI 做有限深度搜索。这里的“4 回合思考”按搜索层理解，不做完整随机战斗模拟：

```txt
Depth 0: 当前局面评分
Depth 1: 我方当前行动
Depth 2: 对方可能回应
Depth 3: 我方后续承接
Depth 4: 对方再回应
```

第一版可以先用启发式局面估值，不 clone 完整 Showdown battle。后续如果性能允许，再考虑接 Showdown clone battle 做更真实模拟。

### Async Runtime

AI 在收到 request 后启动异步计算，最多思考 10 秒。

- `createBattleSession`、玩家 `submitChoice`、`getSnapshot` 都只推进已完成或超时的 AI 结果。
- 新 request 到来时取消同 player 的旧 AI 任务，避免提交过期 choice。
- 超时必须使用保底合法选择，不允许卡住 battle。
- debug 记录 request key、耗时、是否超时、候选数量、最终 choice。

## Integration Boundaries

- AI 接入 `packages/showdown-battle-core`，替换当前 `randomLegalChoice` 的 AI 自动提交路径。
- UI 不参与 AI 决策；正式游戏、训练场、debug 都复用同一 AI engine。
- `controller="local"` 仍由玩家操作。
- `controller="ai"` 使用 AI profile。
- `controller="script"` 暂不改动，留给剧情或固定脚本。
- team preview 可以先沿用合法默认选择，后续再接 AI 评分。
- AI 不使用 trainer item，不调用 Battle V4 背包。

## Debug And Tuning

每次 AI 决策写入 snapshot debug：

```ts
type BattleAiDecisionDebugV4 = {
  playerId: ShowdownPlayerIdV4;
  rqid?: number;
  requestKey: string;
  level: BattleAiLevelV4;
  preference: BattleAiPreferenceV4;
  elapsedMs: number;
  timedOut: boolean;
  candidateCount: number;
  selectedChoice: string;
  selectedScore: number;
  topCandidates: Array<{
    choice: string;
    score: number;
    features: Record<string, number>;
  }>;
};
```

调参优先看 debug，不靠猜。后续可以把对局日志转成离线样本，逐步调整权重。

## Future Tuning Guide

后续细调不需要推翻架构，主要从 4 个入口进入：

- 偏好权重：`PREFERENCE_WEIGHTS`。调整进攻/防守/辅助/平衡训练师在同一局面下更偏向哪些 feature。进攻主要看 `damage / ko / typeAdvantage / special`，防守主要看 `survival / protect / recovery / switch / item`，辅助主要看 `support / room / terrain / weather / statStage / ability`。
- 等级参数：`AI_LEVEL_CONFIG`。调整 `searchDepth / perSlotTopN / turnTopK / randomNoise / mistakeRate`。菜鸟更乱就提高随机扰动和失误率；冠军更稳就降低扰动、提高候选宽度。
- feature 原始分：`featuresForMove / movePowerEstimate / estimateKoScore / estimateStabScore / estimateTypeAdvantageScore / specialScore / longTermFeatureScore`。例如不会补刀就调 `ko`，太爱太晶就调 `special`，不重视属性克制就调 `typeAdvantage`。
- 决策 debug：`snapshot.debug.aiDecisions`。每次看 `topCandidates[].features` 和 `selectedScore`，先确认 AI 为什么这么选，再决定改权重还是改 feature。

推荐调参流程：

```txt
跑一局或 fixture
-> 查看 debug.aiDecisions
-> 判断选择是否符合预期
-> 调整 feature 或 preference weight
-> 重跑纯函数 fixture 和 battle-core smoke
```

建议后续追加的典型 fixture：

- 残血时应该回复/守住，满血不应无脑 Rest。
- 能击杀时优先击杀。
- 电系招式优先打暴鲤龙等明显克制目标。
- 双打能集火残血目标。
- 不重复使用同一特殊系统。
- 有空间收益时更愿意开戏法空间。
- 有天气收益时更愿意开雨/晴等天气。
- 濒死时避免无脑强化。

## Test Plan

- `pnpm --dir changeBattleV2 --filter @changebattle-v2/showdown-battle-core test`
- `pnpm --dir changeBattleV2 typecheck`
- AI 决策测试以纯函数为主，不依赖页面、不打开战斗 UI。测试直接调用 `chooseAiBattleChoiceV4(context)`，输入模拟 `request / snapshot / playerId / aiProfile / rngSeed`，断言返回 choice、debug 和耗时。
- 建立数据驱动 fixtures：单打、双打、强制换人、Gen7 Mega/Z、Gen8 极巨、Gen9 太晶、天气/场地/空间、能力变化/特性/道具联动。
- 每个 fixture 断言：choice 可解析且合法、`elapsedMs` 小于预算、`candidateCount > 0`、debug feature key 完整、特殊系统不会在非法 request 中出现。
- 少量 battle-core 集成测试才启动 BattleStream，用于验证 AI 异步任务提交、超时 fallback、旧 request 不提交、AI choice 能推进回合。
- 单元测试覆盖六个等级和四个偏好都能产出合法 choice。
- 单打 move request：能选择合法出招，特殊系统候选按 request 生成。
- 双打 move request：能生成完整多 active choice，目标合法，濒死槽位 pass。
- force switch：不切濒死，不重复切同一后备。
- gen7/gen8/gen9/standard：特殊系统后缀受 request 和 ruleSet 共同约束。
- 异步：AI 任务完成后提交；超时后 fallback；旧 request 不提交。
- 合作：AI 只控制 `controller="ai"` 玩家，不控制 local 队友。

## Non-Goals

- 本计划不实现队伍生成器。
- 本计划不实现 AI 使用道具。
- 第一版不做完整 Showdown battle clone 模拟。
- 第一版不训练模型、不接历史对局学习，只保留 debug 和未来训练数据出口。
