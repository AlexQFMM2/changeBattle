# 正式流程“灵魂伴侣”下版本计划

## Summary

下一个稳定版本目标：围绕“对战工厂里的租借与羁绊”建立局外长期养成系统。玩家在正式流程中主要使用工厂租借宝可梦，通过交换、训练、情报和资源经营完成连续对战；每次通关或阶段胜利后，可以从队伍中选择一只宝可梦，获得它的 1 级宝宝形态作为局外培养对象。该宝可梦可在后续正式流程中预选参战，并在关键 boss / 冠军战绝境时以“灵魂伴侣”形式隐藏登场，成为规则之外的情感变量。

## Theme

游戏主题收束为：

> 以 Showdown 对战为核心的对战工厂 roguelike。玩家在每局中租借、交换、训练宝可梦完成连续挑战，并在局外培养一只真正属于自己的灵魂伙伴；当工厂规则走到极限时，羁绊可能成为最后的变数。

核心矛盾：

- 工厂规则：宝可梦是租借资产，可以交换、优化、替换。
- 灵魂伴侣：宝可梦是不可替代的伙伴，会在关键时刻回应玩家。

所有后续功能应服务这四个关键词：

- 对战工厂
- 宝可梦对战
- roguelike 经营
- 局外羁绊养成

## Key Features

### 1. 局外宝宝宝可梦

- 正式流程打赢关键节点后，允许从本局队伍中选择一只宝可梦。
- 系统生成该宝可梦对应的 1 级宝宝 / 初始形态，写入局外存档。
- 该宝可梦属于玩家长期资产，不随单局正式流程清空。
- 初始强度不应过高，重点保留成长空间。

建议字段：

- `soulmateId`
- `speciesId`
- `nickname`
- `level`
- `nature`
- `ivs`
- `evs`
- `moves`
- `friendship`
- `badges`
- `isHidden`
- `obtainedFromRunId`
- `parentPokemonSnapshot`
- `createdAt`
- `updatedAt`

### 2. 亲密度

- 新增 `friendship` 字段，作为局外长期培养和关键战触发的核心指标。
- 亲密度可通过局外培养、携带通关、赢下 boss、使用特定道具等方式提升。
- 亲密度不直接等价于数值强度，主要影响：
  - 关键局隐藏登场概率
  - 特殊剧情台词
  - 部分徽章效果
  - 后续星图节点效果

### 3. 徽章

- 灵魂伴侣带队打赢 boss 后获得对应徽章。
- 徽章代表“这只宝可梦经历过什么”，是局外养成目标。
- 徽章可以解锁轻量效果，但不应让灵魂伴侣成为常规外挂。

候选类型：

- 属性 boss 徽章
- 四天王徽章
- 冠军徽章
- 工厂认证徽章
- 羁绊觉醒徽章

### 4. 预选参战

- 进入正式流程前，玩家可以预选一只局外培养宝可梦。
- 它可以作为正常队伍候选的一部分，或作为隐藏后备。
- 具体规则需要后续平衡：
  - 方案 A：占用一个初始选择名额，完全公开参战。
  - 方案 B：不占用初始名额，只在关键战以隐藏单位参与。
  - 方案 C：星图解锁后可在两种模式间选择。

推荐 MVP 使用方案 B，保持“工厂租借队伍”为主玩法。

### 5. 隐藏参战与护主触发

关键 boss / 冠军战开始时，技术上可以把灵魂伴侣一起交给 Showdown battle core，但前端 UI 默认隐藏，不让玩家看到。

触发条件建议：

- 当前战斗是关键局，例如冠军战、最终 boss 战。
- 玩家处于绝境：
  - 可战斗宝可梦数量过低；
  - 或玩家侧总 HP 比例很低；
  - 或对手仍有明显数量优势。
- 灵魂伴侣亲密度达到阈值。
- 本场战斗尚未触发过。
- 本个正式 run 尚未触发过，或由高阶星图放宽限制。

触发概率建议：

- 亲密度 60：5%
- 亲密度 80：15%
- 亲密度 100：30%
- 拥有对应 boss / 冠军徽章：额外加成
- 冠军战：额外加成

触发后：

- 播放特殊登场演出。
- UI 揭示隐藏宝可梦。
- 写入 battle log / run diagnostics。
- 触发对手或裁判台词。

### 6. 裁判与对手反应

根据对手性格或 boss 类型触发两类台词：

- 规则型 / 冷酷型：
  - “裁判，对方作弊。”
  - 强调对战工厂制度和规则压力。
- 热血型 / 认可型：
  - “好啊，让我看看你们的羁绊能到何处。”
  - 强调宝可梦式热血和情感认可。

台词只在关键触发时出现，不应打断普通对战节奏。

## Star Chart Direction

“灵魂伴侣”星图线应偏长期关系与触发条件，不做纯数值堆叠。

候选节点：

- `灵魂伴侣`：解锁局外宝宝宝可梦系统。
- `亲密培养`：提高亲密度成长效率。
- `工厂通行证`：允许灵魂伴侣作为隐藏后备进入关键战。
- `护主心切`：解锁绝境登场判定。
- `并肩作战`：带着灵魂伴侣打赢 boss 后获得徽章。
- `羁绊证明`：徽章提升隐藏登场概率。
- `最后约定`：冠军战额外提高触发概率。

设计原则：

- 星图不应让灵魂伴侣变成稳定第七人。
- 越强的效果越应限制在关键局、绝境、一次性触发。
- 星图强调“让羁绊被看见”，而不是简单加攻击、防御、等级。

## Data / API Plan

### Profile-level Data

建议在 profile 层新增：

- `soulmates?: FormalSoulmatePokemonV4[]`
- `activeSoulmateId?: string`

### Run Snapshot

正式 run 创建时记录快照：

- `soulmateSnapshot?: FormalSoulmatePokemonV4 | null`
- `soulmateBattleState?: FormalSoulmateBattleStateV4`

这样本局使用的是创建 run 时的局外快照，不会因为局外数据中途变化导致战斗不稳定。

### Candidate APIs

候选 helper：

- `canCreateSoulmateFromPokemon(run, pokemonId)`
- `createSoulmateFromFormalPokemon(profile, run, pokemonId)`
- `listFormalSoulmates(profile)`
- `selectFormalSoulmate(profile, soulmateId | null)`
- `prepareFormalRunSoulmateSnapshot(run, profile)`

### Battle APIs

候选 helper：

- `shouldInjectSoulmateForBattle(run, roundNode)`
- `buildBattleTeamWithHiddenSoulmate(participants, soulmateSnapshot)`
- `evaluateSoulmateRescueTrigger(battleState, run, context)`
- `revealSoulmateInBattle(run, battleSessionId)`

## UI Plan

### 局外页面

- 新增灵魂伴侣入口。
- 展示当前培养宝可梦、亲密度、徽章、成长记录。
- 允许选择本局预选对象。

### 正式流程结算

- 关键胜利后提供“带走宝宝”选择。
- 展示来源宝可梦和将生成的宝宝形态。
- 若已有灵魂伴侣，提示替换 / 保留 / 新增名额规则。

### 战斗中

- 隐藏状态下不显示灵魂伴侣。
- 触发后使用特殊登场层和台词层。
- Debug 面板需要显示 hidden teammate 注入与 reveal 事件，方便排查。

## Technical Notes

- Showdown battle core 不适合中途凭空追加队伍成员，因此推荐战斗创建时就注入隐藏队友。
- 前端和诊断层负责隐藏 UI，直到触发 reveal。
- 触发逻辑必须确定性，基于 run seed、battle id、turn、亲密度等生成，避免读档刷概率。
- 隐藏宝可梦不应影响普通选择指令，直到 reveal 后才进入可操作状态。

## MVP Scope

第一版建议只做：

- 局外保存 1 只灵魂伴侣。
- 正式流程胜利后可从队伍中生成 1 级宝宝。
- 进入冠军战时隐藏注入。
- 绝境时按亲密度概率 reveal。
- 两类对手台词。
- 简单徽章记录。

暂不做：

- 多只灵魂伴侣收藏。
- 复杂局外训练小游戏。
- 完整图鉴式成长系统。
- 多阶段剧情线。
- PVP 或联网同步。

## Test Plan

- 创建灵魂伴侣时生成正确宝宝形态，等级为 1。
- 局外存档能持久化灵魂伴侣、亲密度和徽章。
- 正式 run 创建时记录 soulmate snapshot，之后局外改动不影响本 run。
- 普通战斗不注入或不显示灵魂伴侣。
- 冠军战 / 关键 boss 战能隐藏注入，但 UI 初始不可见。
- 未达绝境时不触发 reveal。
- 达到绝境且亲密度满足时，触发概率稳定、可复现。
- reveal 后 UI 显示宝可梦，Showdown 指令选择正常。
- 每场 / 每 run 触发次数受限。
- 战斗日志和诊断记录 hidden inject、trigger roll、reveal result。

## Open Questions

- 局外宝宝是否允许多只收藏，还是第一版只保留 1 只？
- 宝宝形态如何处理无进化链、传说、悖谬、特殊形态？
- 灵魂伴侣是占用队伍名额，还是只作为关键局隐藏后备？
- 触发后如果裁判判定作弊，是否会有代价，例如扣 BP、降低奖励、触发特殊 boss 台词？
- 亲密度增长是否和使用频率绑定，还是局外培养也可推进？
- 徽章是否只记录荣誉，还是提供少量机制加成？

## Assumptions

- 当前首版优先稳定正式流程、战斗节奏和 release；灵魂伴侣作为下一版本目标，不进入本轮实现。
- 核心玩法仍是宝可梦对战和对战工厂经营，灵魂伴侣只在关键局制造情感高潮。
- 技术核心继续使用 Showdown battle core，隐藏登场通过创建战斗时注入队伍实现。
