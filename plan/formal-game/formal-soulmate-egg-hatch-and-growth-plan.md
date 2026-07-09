# 灵魂伴侣蛋孵化与成长规则计划

## Summary

下一步实现“灵魂伴侣”MVP 闭环：玩家在正式赛最终胜利后的 `battleEndedPendingSettlement` 休整页中，从本局有记录的己方宝可梦里选择一只；点击“就决定是你了”后进入蛋孵化流程，播放蛋碎裂动画，生成该宝可梦进化链的最小形态实例，提示“已送入玩家的宝可梦箱子”。

本轮目标是把“带走入口”接成真正的局外资产写入流程。孵化动画资源可后续替换，先预留动画状态和组件边界。

## Core Decision

- 玩家获得的是目标宝可梦对应进化链的最小形态。
- 获得时等级固定为 `50`，不是 1 级。
- 灵魂伴侣允许进化。
- 灵魂伴侣通过训练家仓库的局外养成道具、技能学习、亲密度和后续进化成长，不通过普通正式流程交换/训练交互成长。
- 待结算休整页只负责最终胜利后的蛋领取和待结算商店材料购买，不开放“灵魂伴侣训练页”。
- 仓库中的灵魂伴侣是玩家长期资产；训练、进化和亲密度变化写回 `PlayerVaultV4`，可以带出并存档。
- 被“同行许可”带入正式流程的是 run-local 副本：保留仓库养成数值、昵称和允许带入的携带道具，但不写回仓库，也不能参与正式局内养成系统。

## MVP Flow

### 1. 选择入口

触发位置：

- 正式赛最终胜利后进入 `battleEndedPendingSettlement` 休整页。
- 玩家星图已点亮 `灵魂伴侣`。
- 当前 run 的 `battleLog` 中存在可展示的己方候选宝可梦。

现有护士弹窗保留：

- 文案：
  - `宝可梦们很喜欢你呢，你真是一位出色的训练师。作为奖励工厂允许你选择一只宝可梦蛋带走培养；请选择吧`
- 按钮：
  - `不用了`：关闭弹窗，本次不领取。
  - `就决定是你了`：选中候选后可点击，进入孵化流程。

调整：

- 当前“就决定是你了”只提示开发中的逻辑改为真正提交选择。
- 提交前校验：
  - run 状态必须是 `battleEndedPendingSettlement`。
  - 星图快照必须拥有 `soulmate_egg_reward`。
  - 候选必须来自本局 `battleLog` 中出现过的己方 `p1` 宝可梦。
  - 同一 run 不能重复领取，使用 `soulmateEggClaimedAt` 或等价字段幂等保护。

### 2. 蛋孵化动画

点击“就决定是你了”后：

1. 关闭候选选择态或锁定选择。
2. 打开孵化动画层。
3. 展示宝可梦蛋。
4. 播放蛋摇晃、裂纹、碎裂、白光出现的阶段动画。
5. 动画结束后展示孵化出的宝可梦小图/立绘和名称。
6. 提示：
   - `已送入玩家的宝可梦箱子。`

动画资源策略：

- 本轮先实现状态机和 CSS 动画占位。
- 后续可以替换为用户提供的蛋孵化素材。
- 组件边界建议：
  - `SoulmateEggHatchDialog`
  - props: `candidate`, `hatchedPokemon`, `phase`, `onDone`

动画阶段建议：

- `intro`
- `shake`
- `crack`
- `burst`
- `reveal`
- `done`

### 3. 生成宝可梦实例

从候选宝可梦生成局外灵魂伴侣记录：

- 读取候选宝可梦当前 species。
- 根据进化链解析最小形态。
- 使用最小形态生成 `PlayerPokemonRecordV4` 或专门的 `PlayerSoulmatePokemonRecordV4`。
- 初始等级固定 `50`。
- 初始亲密度：
  - 默认 `70`。
  - 若星图点亮 `一眼万年`，则为 `120`。
- 闪光概率：
  - 默认 `1/30`。
  - 若星图点亮 `欧洲父母`，则为 `1/8`。
- 记录来源：
  - `obtainedFromRunId`
  - `obtainedFromNodeId`
  - `parentPokemonSnapshot`
  - `hatchedAt`

建议字段：

```ts
type PlayerSoulmatePokemonRecordV4 = {
  soulmateId: string;
  localPokemonId: string;
  speciesId: string;
  currentSpeciesId: string;
  rootSpeciesId: string;
  level: 50;
  friendship: number;
  evolutionStage: number;
  evolutionCount: number;
  nickname?: string;
  moves: PlayerPokemonMoveRecordV4[];
  heldItemId?: string;
  badges?: string[];
  obtainedFromRunId?: string;
  obtainedFromNodeId?: string;
  parentPokemonSnapshot?: unknown;
  createdAt: string;
  updatedAt: string;
};
```

落点建议：

- core:
  - `packages/changebattle-v2-core/src/soulmate.ts`
  - 类型、normalize、纯 helper、亲密度规则、进化门槛 helper。
- API:
  - 根据 run/profile/vault 编排领取流程。
  - 查询 Dex / 进化链。
  - 写入玩家全局宝可梦箱子。
- Web:
  - 展示候选、动画和结果。
  - 不手写进化链推导。

### 4. 写入玩家宝可梦箱子

孵化完成后写入玩家全局宝可梦箱子：

- 推荐复用 `PlayerVaultV4` 的宝可梦箱子结构。
- 如果需要单独标记灵魂伴侣，在 record 上增加 `originKind: "soulmate"` 或专门字段。
- 写入成功后在 run 上记录已领取：
  - `soulmateEggClaimedAt`
  - `soulmatePokemonId`
  - `soulmateCandidateId`
- 最终结算重复打开时不能重复生成。

提示文案：

- `蛋孵化了！{pokemonName} 已送入玩家的宝可梦箱子。`

失败处理：

- 候选失效：提示 `这只宝可梦暂时无法带走。`
- 已领取：提示 `本次奖励已经领取。`
- 写入失败：保留当前弹窗，提示错误，不推进领取标记。

## Friendship Rules

亲密度用于进化和后续隐藏进化/羁绊触发。

### Gain / Loss

- 每次使用道具：`+3`
- 携带并赢下一局，且有有效参与：`+15`
- 携带并赢下一局，但未出场或没有有效输出：`+10`
- 阵亡：`-3`

结算建议：

- `+15` 和 `+10` 二选一，不叠加。
- 阵亡惩罚可以和胜利收益叠加。
- 亲密度最低不低于 `0`。
- 亲密度上限第一版可设为 `255`。

有效参与口径：

- 出场过；
- 或 battleLog 中有该宝可梦作为 source/target 的有效记录；
- 或造成伤害、治疗、击倒、承伤任一项大于 0。

## Evolution Rules

### 门槛

可进化宝可梦统一按进化次数给亲密度分段。

二段进化链示例：小火龙 -> 火恐龙 -> 喷火龙

- 小火龙亲密度达到 `100` 后，可使用进化道具进化为火恐龙。
- 火恐龙亲密度达到 `200` 后，可使用进化道具进化为喷火龙。

通用规则：

- 第 1 次进化门槛：`100`
- 第 2 次进化门槛：`200`
- 若后续存在更多阶段，暂不开放或按后续规则扩展。

### 道具

新增道具分类：`evolution`

进化条件来源：

- 原始进化条件以 Showdown Dex species 字段为准，包括 `prevo`、`evos`、`evoType`、`evoLevel`、`evoItem`、`evoMove`、`evoCondition`、`evoRegion`。
- ChangeBattle 不手写全量宝可梦进化条件表，只把 Showdown 的进化条件边归一化为灵魂伴侣玩法道具需求。
- `showdown-dex-core` 需要暴露 `evolutionEdges` 和 `getPokemonEvolutionTree`，供 API 解析最小形态、分支进化和对应进化道具。

进化方式归一化：

- 原版等级进化：使用 `通用进化石`
- 原版亲密度进化：使用 `通用进化石`
- 原版特殊石头进化：使用对应特殊石头
  - `火之石`
  - `水之石`
  - `雷之石`
  - `叶之石`
  - `月之石`
  - `太阳之石`
  - `光之石`
  - `暗之石`
  - `觉醒石`
  - `冰之石`
- 原版交换进化：使用 `通讯绳`
- 原版携带道具交换：第一版可先统一为 `通讯绳`
- 原版特殊条件进化：第一版可先统一为 `通用进化石`

分支进化：

- 伊布这类分支由使用的特殊石头决定。
- 第一版只开放已明确映射进化道具的分支。
- 不明确的时间、地点、招式、性别、队伍条件分支先不开放。

## Soulmate Growth Boundary

灵魂伴侣的成长入口已经从“待结算专属训练页”收束到训练家仓库。正式局内只使用副本，不改长期资产。

### 训练家仓库

- 仓库宝可梦详情、道具使用和后续进化都以 `PlayerVaultV4` 为事实源。
- 仓库中的灵魂伴侣可以使用局外养成道具。
- 仓库中的灵魂伴侣可以学习技能，包括技能机器和后续技能学习来源。
- 仓库中的灵魂伴侣可以携带/卸下道具、标记出战、放生和后续进化。
- 这些操作只修改仓库 draft，点击“保存并返回”后写回顶层存档。

### 待结算休整页

- 最终胜利后仍负责灵魂伴侣蛋领取。
- 待结算商店可以售卖标准养成材料，用于离开正式流程后回到仓库养成。
- 不新增待结算专属“灵魂伴侣训练”入口，避免把局外资产养成混进正式 run 页面状态。

### 正式局内副本

- 通过“同行许可”进入正式流程的是 run-local 副本。
- 副本保留仓库养成数值、昵称、闪光、性格、特性、招式等身份信息。
- 点亮“爱不释手”后才允许携带仓库当前携带道具进入正式流程。
- 副本不写回仓库本体；run 放弃、异常退出或结算都不移动仓库资产。
- 副本不参与正式训练场、交换、技能机器、特效药等任何局内养成系统。
- 前端列表需要隐藏受保护副本，后端 guard 需要拒绝绕过 UI 直接传入的 protected pokemonId。

强度约束：

- 仓库宝可梦带入正式流程时保留完整养成数值，不做开局强度投影。
- 正式流程最多追加的仓库候选数量由独立星图节点“同行许可 I / II”决定，不由“灵魂伴侣”或“育儿基金”节点隐式提供。
- 正式赛内不能通过普通交换获得或替换灵魂伴侣。
- 技能仍最多 4 个。
- 强度过高的问题后续通过人物画像、NPC 选择和难度曲线处理，不在正式局内临时削弱仓库宝可梦。

## Hidden Evolution Future Scope

隐藏进化属于高难度后续流程，本轮不实现。

规则设想：

- 当灵魂伴侣亲密度已满且满足进化条件，但玩家未手动进化时；
- 每次进入战斗页后有 `30%` 概率触发隐藏战斗进化；
- 战斗创建时提前把进化型传给 Showdown；
- 前端初始不在队伍里显示进化型；
- 玩家队伍全灭时不立即结束战斗；
- 弹出提示：
  - `{pokemonName} 发出了不可思议的光芒！`
- 灵魂伴侣进化后显示在队伍里；
- 玩家换上进化后的灵魂伴侣继续战斗。

技术注意：

- Showdown battle core 不适合中途凭空追加宝可梦。
- 因此隐藏进化需要战斗创建前预置进化型，再由 UI 和战斗流程控制 reveal。
- 触发概率必须基于 run seed / battle id 做确定性随机，避免读档刷概率。

## Data / API Plan

### Core

新增或完善：

- `packages/changebattle-v2-core/src/soulmate.ts`

职责：

- `PlayerSoulmatePokemonRecordV4`
- `SoulmateCandidateV4`
- `SoulmateEggHatchResultV4`
- `normalizeSoulmatePokemonRecordV4`
- `createSoulmateCandidateListV4`
- `soulmateInitialFriendshipForStarChartV4`
- `soulmateShinyRateForStarChartV4`
- `getSoulmateEvolutionFriendshipThresholdV4`
- `calculateSoulmateFriendshipDeltaV4`

禁止：

- 访问 Dex runtime。
- 访问 storage。
- 访问 battle session runtime。
- 直接推进 run 状态。

### API

新增 facade：

- `claimFormalSoulmateEggV4(runId, candidateId)`
- `createSoulmatePokemonFromCandidateV4(input)`
- `resolveSoulmateRootSpeciesV4(speciesId)`
- `evolveSoulmatePokemonV4(input)`

职责：

- 校验 run 状态和星图快照。
- 校验候选合法性。
- 查询进化链和 Dex metadata。
- 生成宝可梦实例。
- 写入玩家宝可梦箱子。
- 标记 run 已领取，保证幂等。

### Web

新增/调整：

- `TrainingRestNewPage`
  - “就决定是你了”调用 API。
  - 成功后打开孵化动画层。
- `SoulmateEggHatchDialog`
  - 展示蛋孵化流程。
  - 展示孵化结果。
- 玩家箱子页后续展示灵魂伴侣标记。

## Test Plan

### Typecheck

- `pnpm --dir changeBattleV2 --filter @changebattle-v2/core typecheck`
- `pnpm --dir changeBattleV2 --filter @changebattle-v2/api typecheck`
- `pnpm --dir changeBattleV2 --filter @changebattle-v2/web typecheck`

### Smoke

- 未点亮 `灵魂伴侣`：最终休整页不允许领取蛋。
- 点亮 `灵魂伴侣`：最终休整页可选择候选并进入孵化流程。
- 未选择候选时，“就决定是你了”不可点击。
- 选择候选后点击，播放孵化流程并生成最小形态 50 级宝可梦。
- 默认初始亲密度为 `70`。
- 点亮 `一眼万年` 后初始亲密度为 `120`。
- 默认闪光概率为 `1/30`，点亮 `欧洲父母` 后为 `1/8`。
- 同一个 run 重复点击或刷新后不能重复领取。
- 写入玩家宝可梦箱子后，读档能看到该宝可梦。
- 普通训练页不显示正式局内灵魂伴侣副本。
- 交换面板不显示正式局内灵魂伴侣副本。
- 后端训练/交换 guard 直接拒绝正式局内灵魂伴侣副本。
- 正式局内灵魂伴侣副本不能使用技能机器或特效药。
- 仓库养成页中的灵魂伴侣仍可以使用技能机器和局外养成材料。

### Evolution Smoke

- 小火龙亲密度 `99` 时不可进化。
- 小火龙亲密度 `100` 且有 `通用进化石` 时可进化为火恐龙。
- 火恐龙亲密度 `199` 时不可进化为喷火龙。
- 火恐龙亲密度 `200` 且有 `通用进化石` 时可进化为喷火龙。
- 伊布使用 `火之石` 进化为火伊布。
- 原版交换进化宝可梦使用 `通讯绳` 可进化。

## Implementation Order

1. 定义 core 灵魂伴侣记录、normalize、亲密度和进化门槛 helper。
2. API 实现候选领取校验和幂等字段。
3. API 接 Dex 进化链，解析最小形态并生成 50 级实例。
4. API 写入玩家宝可梦箱子。
5. Web 将“就决定是你了”接到领取 API。
6. Web 新增蛋孵化动画占位组件。
7. Web 成功后提示已送入玩家宝可梦箱子。
8. 训练家仓库承接灵魂伴侣局外养成入口。
9. 后续实现仓库进化道具预览、确认和写回。
10. 最后再考虑隐藏战斗进化。

## Assumptions

- 本轮先接“带走并生成局外宝可梦”闭环，隐藏战斗进化不做。
- 孵化动画素材后续替换，本轮先用 CSS/占位动画保证流程跑通。
- 灵魂伴侣初始形态等级为 50，不是 1 级。
- 灵魂伴侣属于玩家长期资产，应写入玩家宝可梦箱子并参与存档。
- 灵魂伴侣长期资产只在训练家仓库养成；正式流程里的 run-local 副本不进入普通正式流程交换/训练/TM/特效药系统，避免破坏工厂租借队伍主玩法。
- 当前最大缺口是训练家仓库进化：进化道具已经能识别并给出未开放提示，下一步需要接进化预览、条件校验、道具消耗和 vault 写回。
