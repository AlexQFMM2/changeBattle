# ChangeBattle 后续玩法规划：双打 64 模式

本文档记录双打 64 模式的后续实现计划。当前只做规划，不进入实现。

双打不是单纯把 Showdown format 从单打换成双打。它会影响开局选队、每场战前选出战顺序、战斗状态模型、时间线解析、玩家指令、AI、道具、特殊系统和战斗 UI。实现时应优先把“多 active 槽位”作为共享运行时能力补齐，再逐步接 UI，避免桌面端和移动端行为漂移。

## 1. 目标体验

- 新增一个可选玩法模式，不替换当前单打。
- 单打默认体验保持不变：开局选 3 只，一次上 1 只，技能按钮直接提交出招。
- 双打 64 模式：
  - 开局从候选中选择 6 只，作为本局可携带队伍。
  - 每场战斗开始前，从 6 只中选择 4 只，并决定出场顺序。
  - 战斗开始后双方同时上 2 只宝可梦。
  - 每回合需要分别给我方两只 active 宝可梦选择行动。
  - 选择单体技能后，需要额外选择攻击目标。
  - 目标选择必须允许合法的己方目标，包括攻击队友或自己。
  - 范围技能、自身技能、自动目标技能不弹目标选择。
  - 战斗页双方 active 血条卡都改成两行布局，场上同时展示四只宝可梦。

## 2. 已验证的 Showdown 协议结论

本地用 `../pokemonShowdowm/pokemon-showdown/dist/sim` 做过非持久化验证，结论如下：

- 以下 format 存在，且 `gameType` 是 `doubles`：
  - `gen7doublescustomgame`
  - `gen8doublescustomgame`
  - `gen9doublescustomgame`
- 双打队伍预览可使用 `team 1234` 选择 4 只并决定顺序。
- 进入双打后，玩家 request 的 `active` 数组长度为 2。
- 双打组合指令用逗号拼接，例如：
  - `move 1 1, move 1 1`
  - `move 1 2, move 2 -1`
  - `move 1 -2, move 2 -1`
- 目标编号规则：
  - 正数 `1` / `2` 指向对方左位 / 右位。
  - 负数 `-1` / `-2` 指向己方左位 / 右位。
  - `move 1 -2` 可以让己方左位攻击己方右位。
  - `Helping Hand` 这类 `adjacentAlly` 招式可用 `-1` / `-2` 指向队友。
- 范围技能不能带手动目标。
  - 例如 `Surf` 的 `target` 是 `allAdjacent`。
  - 如果发送 `move 1 1`，Showdown 会返回 `Can't move: You can't choose a target for Surf`。
- 因此 UI 必须根据 `BattleMoveRequest.target` 决定是否进入目标选择步骤。

## 3. 规则与设置模型

### 3.1 新增 battle mode

建议给 `BattleSetting` 增加独立字段：

```ts
type BattleMode = "singles" | "doubles64";

type BattleSetting = {
  allowed_generations: number[];
  battle_rule_preset: BattleRulePreset;
  enabled_battle_systems: BattleSystemId[];
  legendary_battle: boolean;
  battle_mode: BattleMode;
};
```

设计理由：

- `battle_rule_preset` 现在表示规则世代和特殊系统组合，例如 gen7 / gen8 / gen9。
- 双打是对战人数/队伍规则，不应混进 gen preset。
- 这样可以组合出：
  - gen7 单打 customgame
  - gen7 双打 64 customgame
  - gen8 单打 customgame
  - gen8 双打 64 customgame
  - gen9 单打 customgame
  - gen9 双打 64 customgame

### 3.2 共享 helper

新增共享 helper，桌面和移动都必须使用：

- `isDoublesBattleSetting(setting): boolean`
- `battleModeForSetting(setting): BattleMode`
- `starterSelectionCountForSetting(setting): number`
  - 单打：3
  - 双打 64：6
- `teamPreviewPickCountForSetting(setting): number`
  - 单打：当前队伍全选
  - 双打 64：4
- `showdownFormatForBattleSetting(setting): string`
  - 单打：
    - `gen7customgame`
    - `gen8customgame`
    - `gen9customgame`
  - 双打：
    - `gen7doublescustomgame`
    - `gen8doublescustomgame`
    - `gen9doublescustomgame`

### 3.3 兼容策略

- 旧存档没有 `battle_mode` 时，`normalizeBattleSetting` 默认补 `"singles"`。
- 现有单打存档、单打测试、单打 UI 不应因为新增字段改变行为。
- 设置页新增“对战模式”区域：
  - 单打
  - 双打 64
- 文案上明确双打模式会把开局选队数量改为 6，并在每场战斗前选择 4 只出战。

## 4. 开局选队与 64 战前选 4

### 4.1 开局选队

当前开局选队有多个硬编码的 `3`：

- `RentalSelectPage` 只显示 3 个已选槽。
- `RentalActionBar` 要求 `selectedCount === 3` 才能开始。
- `App.toggleCandidate` 最多保留 3 个 selected index。
- `run-planning.beginChallenge` 校验 `selectedIndexes.length !== 3`。
- 移动端 `mobileRuntime.beginChallenge` 默认 `[0, 1, 2]`。

双打接入后：

- 所有这些位置都改为读取 `starterSelectionCountForSetting(setting)`。
- 单打继续显示 3 个槽位。
- 双打显示 6 个槽位。
- “已选 3/3” 改为“已选 N/M”。
- 灵魂伴侣等天赋规则需要按目标人数重算：
  - 推荐首版规则：回忆候选仍最多 1 只。
  - 双打 64 选择 1 只回忆候选时，需要再选择 5 只本局候选。
  - 未选择回忆候选时，需要选择 6 只本局候选。

### 4.2 每场战前选 4

双打 64 每场战斗开始前新增一个出战选择步骤。

流程：

1. 休整结束，准备进入下一场战斗。
2. 如果是单打，沿用现有自动开战流程。
3. 如果是双打 64，进入 `battleTeamPreview` 或类似 screen。
4. 页面展示：
   - 我方 6 只队伍。
   - 对手已知预览信息。
   - 4 个出战槽位。
5. 玩家按顺序选择 4 只。
6. 点击确认后，把顺序传给 `BattleSession.start()`。
7. `BattleSession.chooseTeamPreview()` 收到 Showdown team preview request 时发送 `team 1234` 形式的选择。

数据建议：

```ts
type BattleTeamPreviewState = {
  battle_no: number;
  pick_count: 4;
  player_slots: BattleViewSlot[] | RentalPokemon[];
  enemy_preview: RentalPokemon[];
  selected_indexes: number[];
};
```

注意：

- Showdown 的 `team 1234` 是队伍原始槽位编号，不是筛选后的 index。
- 玩家选择顺序就是出场顺序，前两只会成为开局 active。
- 敌方也需要选择 4 只。
  - 首版可以按稳定随机或 AI 评分选择。
  - 如果是 Boss/彩虹火箭队固定队伍，仍按同一规则截取或选择 4 只。

## 5. BattleState 与 tracker 重构

### 5.1 当前单打限制

当前代码里大量逻辑只读第一只 active：

- `request.active?.[0]`
- `battle.tracker.active.p1`
- `battle.tracker.active.p2`
- `battle_view.player.active_index`
- `activeBattleViewSlot(view.player)`
- `activePokemon(battle, "p1")`

双打不能继续用一个 active 覆盖整个 side，否则会出现：

- 同侧两只宝可梦 HP 串位。
- 状态变化应用到错误 active。
- 替身、太晶、极巨、形态变化串到另一只。
- 时间线动画找不到正确 sprite。
- 顶部队伍卡 active 标记错误。
- 同 species / 同 name 宝可梦靠名字匹配时混乱。

### 5.2 新增多 active 表达

保留旧字段用于单打兼容，但新增多 active 字段：

```ts
type BattleActiveSlotSnapshot = {
  position: number; // 0 or 1 in doubles
  name?: string;
  display_name?: string;
  species_id?: string;
  sprite?: SpriteMapEntry;
  condition?: string;
  status?: string;
  substitute?: boolean;
  showdown_id?: string;
  dynamaxed?: boolean;
  gigantamaxed?: boolean;
  terastallized?: boolean;
  tera_type?: string;
  tera_type_zh?: string;
  original_species_id?: string;
  original_name?: string;
  original_display_name?: string;
  original_sprite?: SpriteMapEntry;
};

type BattleTracker = {
  active: Record<"p1" | "p2", BattleActiveSlotSnapshot>; // 兼容字段：默认 position 0
  active_slots: Record<"p1" | "p2", BattleActiveSlotSnapshot[]>;
  ...
};

type BattleSideView = {
  side: BattleSideId;
  active_index: number; // 兼容字段：第一个 active
  active_indexes: number[];
  slots: BattleViewSlot[];
};

type BattleViewSlot = {
  ...
  active: boolean;
  active_position?: number;
};
```

规则：

- 单打时 `active_slots[side]` 长度为 1。
- 双打时 `active_slots[side]` 最多长度为 2。
- `tracker.active[side]` 始终镜像 `active_slots[side][0]`，保证旧 UI 和旧测试可以逐步迁移。
- 新逻辑都优先使用 `active_slots`。

### 5.3 ident 与 showdown_id

Showdown 双打 ident 形如：

- `p1a: Charizard`
- `p1b: Pikachu`
- `p2a: Charizard`
- `p2b: Pikachu`

需要新增 helper：

- `sideFromIdent(raw): "p1" | "p2" | null`
- `positionFromIdent(raw): 0 | 1 | null`
- `activeSlotFromIdent(tracker, raw)`
- `activeSlotByShowdownId(tracker, side, showdownId)`

匹配优先级：

1. 显式 `showdown_id` / `pokeball`。
2. Showdown ident position：`a` -> 0，`b` -> 1。
3. request.side.pokemon 中 active 且 ident 匹配的行。
4. 最后才允许按 species/name fallback。

重要原则：

- 双打状态同步必须按 `showdown_id` 为主键。
- 不能只按 species/name 匹配。
- 同侧两个相同 species 或同名宝可梦时，仍必须能正确区分。

## 6. Showdown session 与请求处理

### 6.1 format 选择

`BattleSession.showdownBattleFormat()` 改为读取共享 helper：

- 单打保持现状。
- 双打使用 `genXdoublescustomgame`。

### 6.2 team preview

当前 `chooseTeamPreview()` 会自动选择全部队伍。双打需要改成：

- 单打：
  - 仍可自动选择当前队伍全部槽位。
- 双打：
  - 玩家侧使用运行时传入的 4 个槽位顺序。
  - 敌方侧使用 `enemyTeamPreviewChoice()` 返回 4 个槽位。

`playerTeamPreviewChoice(request)`：

- 单打：`team 123` 或当前逻辑。
- 双打：校验传入顺序长度为 4，并且都在 request.side.pokemon 范围内。

### 6.3 request key 与 enemy choice cache

`enemyRequestKey()` 当前只读 `request.active[0].moves`。

双打后 key 必须包含：

- `request.active` 中每个 active 的 moves/PP/disabled。
- `forceSwitch` 完整数组。
- 每只 side pokemon 的 condition/active。
- teamPreview 状态和已选顺序。

否则 AI 可能复用错误的敌方行动。

### 6.4 PP 记忆

`updatePpMemory()` 当前只记录第一只 active。

双打后：

- 遍历 `request.active`。
- 用 `request.side.pokemon` 中 active 的 runtime 行按 active position 对齐。
- 每个 active 的 PP 写到对应 `showdown_id` / ident。

## 7. 玩家行动流程

### 7.1 组合 choice 数据结构

UI 内部建议维护一个待提交队列：

```ts
type PendingDoubleChoice = {
  activePosition: number;
  kind: "move" | "switch" | "item" | "pass";
  moveSlot?: number;
  switchSlot?: number;
  target?: number;
  battleSystem?: "zmove" | "mega" | "max" | "terastallize";
  label: string;
  showdownChoice: string;
};
```

当两个 active 都有 choice 后，合并：

```ts
choices
  .sort((a, b) => a.activePosition - b.activePosition)
  .map(choice => choice.showdownChoice)
  .join(", ")
```

### 7.2 技能目标流程

点击技能后：

1. 读取当前 active request。
2. 读取该技能的 `target`。
3. 判断是否需要手动选择目标。
4. 如果不需要，直接生成 `move N`。
5. 如果需要，进入 target picker。
6. 选择目标后生成 `move N target`。

目标规则：

- `self`
  - 不弹目标，生成 `move N`。
- `allAdjacent`、`allAdjacentFoes`、`all`、`foeSide`、`allySide`
  - 不弹目标，生成 `move N`。
- `normal`、`any`、`adjacentFoe`
  - 弹目标。
  - 显示敌方两个 active。
  - 若 Showdown 允许己方目标，也显示己方 active，至少要支持用户手动选择己方槽位。
- `adjacentAlly`
  - 弹目标。
  - 只显示己方另一只 active。
- `adjacentAllyOrSelf`
  - 弹目标。
  - 显示自己和己方另一只。

说明：

- 已验证 `normal` 可以使用负数目标打己方队友。
- UI 不应过度限制玩家战术；最终合法性以 Showdown 为准。
- 如果 Showdown 返回 invalid choice，要把错误展示为 toast，并保留当前行动选择界面。

### 7.3 换人

双打换人有两种：

- 主动换人：
  - 当前 active A 选择 `switch X`。
  - 另一 active B 仍可选择技能或换人。
  - 同一回合不能两只都换到同一个替补槽。
- 强制换人：
  - `request.forceSwitch` 是 boolean 数组。
  - 对 `true` 的位置要求选择替补。
  - 对 `false` 的位置发送 `pass`。

### 7.4 特殊系统

特殊系统必须按 active position 读取 request：

- Mega：`request.active[position].canMegaEvo`
- Z 招式：`request.active[position].canZMove`
- 极巨：`request.active[position].canDynamax` / `maxMoves`
- 太晶：`request.active[position].canTerastallize`

组合校验：

- 同一回合只能提交 Showdown 允许的特殊系统。
- 若 request 只允许一只使用某系统，另一只按钮禁用。
- `zmove` / `mega` / `max` / `terastallize` 的 choice 后缀仍拼到该 active 的单条动作上。

## 8. 战斗 UI 规划

### 8.1 BattleField

当前 `BattleField` 只有：

- 一个 `enemyPanel`
- 一个 `playerPanel`
- 两个 sprite

双打后需要支持：

- enemy panels：最多 2 个，竖向两行或错位两行。
- player panels：最多 2 个，竖向两行或错位两行。
- enemy sprites：最多 2 个，前景左右错位。
- player sprites：最多 2 个，背面左右错位。

建议接口：

```tsx
<BattleField
  enemyPanels={...}
  playerPanels={...}
  sprites={...}
/>
```

兼容：

- 单打可传一个元素数组。
- 旧 `enemyPanel/playerPanel` 可先保留一版，迁移完成后删除。

### 8.2 Fighter panel

`BattleFighterPanel` 需要新增：

- `activePosition?: number`
- `selected?: boolean`
- `targetable?: boolean`
- `targetTone?: "enemy" | "ally" | "self"`
- `onTargetClick?: () => void`

显示要求：

- 双打每张卡更紧凑，但 HP 数字必须可读。
- 两行血条卡不能遮挡场地消息。
- 当前正在选择行动的 active 高亮。
- 目标选择时，可选目标高亮，不可选目标置灰。

### 8.3 MoveMenu

当前 `MoveMenu` 只读取 `battle.request.active[0]`。

双打后拆成：

- `BattleActionComposer`
  - 管理当前 active position。
  - 管理 pending choices。
  - 负责提交组合 choice。
- `MoveMenu`
  - 接收 `activePosition`。
  - 只展示该 active 的 moves。
- `TargetPicker`
  - 接收 move target、active slots、当前 active position。
  - 返回 Showdown target number。

底部流程：

1. 默认聚焦第一只尚未选择行动的 active。
2. 玩家选技能。
3. 必要时选目标。
4. 行动进入待提交列表。
5. 自动切到下一只 active。
6. 两只都完成后显示确认区。
7. 点击确认发送组合 choice。

为了操作速度，可以支持：

- 重新选择某只 active 的行动。
- 一键清空本回合选择。
- 当前选择摘要，例如：
  - 左位：十万伏特 -> 对手右位
  - 右位：帮助 -> 我方左位

### 8.4 BattlePartyBoard

顶部队伍卡动画冻结机制继续保留。

双打新增要求：

- 同一侧允许两个 active 标记。
- active 标记要区分左位/右位，例如 `A` / `B` 或 `左` / `右`。
- 动画播放期间整板继续使用上一稳定快照。
- 播放结束后一次性切到最新 battle view。
- 去重仍按 `showdown_id` 为主，不用 species/name。

### 8.5 移动端

移动端复用 desktop React `App`，因此 UI 组件改造会同步影响移动端。

但需要专门补 CSS 验收：

- 横屏 640 x 320 内四个 fighter panel 不重叠。
- 底部 action composer 不遮挡目标选择。
- 目标按钮命中区域足够大。
- 小屏下文字不挤压 HP 数字。

## 9. AI 与自动流程

### 9.1 敌方行动

当前 AI 基本按“一个 active 对一个 active”评分。

双打首版建议：

- 对每个敌方 active 独立生成候选行动。
- 每个行动包含：
  - 技能 slot
  - 是否使用特殊系统
  - 目标编号
  - score
- 两个 active 的候选组合后，选择总分最高的合法组合。
- 避免两只同时换到同一个替补。
- 范围技能不附加目标。

目标评分：

- 攻击技能：
  - 优先能击倒的敌方目标。
  - 其次按预估伤害、属性克制、命中率评分。
  - 如果用户/AI 策略允许，保留攻击队友的可能，但默认 AI 不主动打队友，除非后续加入明确战术识别。
- 辅助队友技能：
  - `adjacentAlly` 默认选队友。
  - `adjacentAllyOrSelf` 根据效果决定自己或队友；首版可选队友优先。
- 自身技能：
  - 不需要目标。

### 9.2 AI 提示

玩家 AI 提示也要输出组合行动，而不是单条行动。

示例文案：

- “左位使用十万伏特攻击对手右位；右位使用帮助支援左位。”
- “左位守住；右位换上第 5 只。”

`BattleAiHintAlternative.choice` 可以保存完整 Showdown choice：

```txt
move 1 2, move 2 -1
```

### 9.3 自动推进

以下逻辑必须支持双 active：

- wait request 自动推进。
- forced continuation move。
- charge / recharge 等只剩一个可选动作的情况。
- AI 代打。
- 自动战斗连续多回合。

原则：

- 如果 `request.active.length === 2`，不能只发送 `move 1`。
- 如果某个 active 因 faint / commanding / recharge 必须 `pass` 或 forced move，需要按 request 生成对应位置 choice。

## 10. 道具、休整与特殊事件影响

### 10.1 战斗道具

战斗中使用道具时，目标选择需要适配双打：

- 回复 HP：可选择我方 active 和后备。
- PP 回复：如果目标是 active，需要按对应 active 的 moves 展示 PP。
- 状态解除：可选择我方 active 和后备。
- 复活：后备濒死目标仍可选。

发送到底层的选择仍可保持现有 `item itemId slot moveSlot` 形式，但 slot 必须是队伍槽位，不是 active position。

### 10.2 帝牙卢卡恩典

需要确认它回滚/恢复的是整回合状态，不是单 active 状态。

双打要求：

- 回滚记录包含两边所有 active slot。
- 恢复后 `active_slots`、`battle_view.active_indexes`、队伍 HP/PP 都一致。

### 10.3 战斗记录与结算

战斗记录中一回合可能有多条我方行动和多条敌方行动。

建议：

- `BattleTurnAction` 支持数组或新增 `player_actions` / `enemy_actions`。
- 兼容字段 `player_action` 保留第一条，用于旧 UI。
- 结果统计仍按宝可梦维度聚合，不按 active position 聚合。

## 11. 桌面与移动 runtime 同步点

桌面 Electron runtime 和移动 runtime 都有自己的开局/战斗入口，因此以下改动必须两端同步：

- 保存和读取 `battle_mode`。
- 生成候选数量。
- 开局选队数量。
- `beginChallenge` 默认 selected indexes。
- 每场战斗前是否进入 64 选 4。
- `buildStartBattleSessionOptions` 是否携带 team preview order。
- 结算后进入下一场时是否再次触发战前选 4。
- 彩虹火箭队、Boss、突发事件的队伍数量和选 4 逻辑。

推荐做法：

- 尽量把规则放在 `packages/shared` 或 `packages/game-runtime` helper。
- 桌面和移动只调用 helper，不各自写数字。

## 12. 分阶段实施建议

### Phase 1：协议与共享模型

- 增加 `battle_mode` 与 normalize 兼容。
- 增加双打 format helper。
- 增加 `active_slots` / `active_indexes` 类型。
- 增加 ident position 解析 helper。
- 增加 Showdown 双打协议测试。

验收：

- 单打 typecheck 和现有测试不变。
- 可以用测试创建 `gen9doublescustomgame` session。
- `request.active.length === 2` 能进入 state。

### Phase 2：BattleSession 多 active

- 改造 tracker active slot 更新。
- 改造 timeline 解析，把 HP/status/form/substitute/faint 应用到正确 active。
- 改造 `buildBattleView()` 输出多个 active slot。
- 改造 PP 记忆、request key、team preview。

验收：

- 双打中四只 active 都有正确 `showdown_id`。
- 攻击己方队友时，受伤的是正确槽位。
- 同侧两只同名/同 species 时不会串位。

### Phase 3：玩家组合指令

- 增加组合 choice parser / validator。
- 支持双 active move / switch / pass。
- 支持目标选择 helper。
- 支持特殊系统按 active position 校验。

验收：

- 可以发送 `move 1 2, move 2 -1`。
- 范围技能不会生成非法 target。
- forced switch 双槽位可正常提交。

### Phase 4：AI 与自动流程

- 敌方 AI 生成双 active 合法组合。
- AI 提示输出组合行动。
- 自动推进支持双 active。
- AI 代打连续多回合不阻塞。

验收：

- 敌方每回合都能合法行动。
- AI 提示 choice 可直接执行。
- 自动战斗能跑完一场双打。

### Phase 5：UI 接入

- 新增设置页模式选项。
- 开局选队支持 6。
- 新增战前选 4 页面。
- 改造 BattleField 四 active 展示。
- 改造底部行动 composer。
- 改造目标选择层。
- 改造顶部队伍卡双 active 标记。

验收：

- 单打 UI 无回归。
- 双打 UI 640 x 320 内可用。
- 移动端横屏可用。

### Phase 6：道具、事件、记录与完整回归

- 战斗道具目标适配双打。
- 帝牙卢卡恩典适配双打回滚。
- 战斗记录展示多行动。
- Boss/彩虹火箭队/突发事件队伍适配。
- 完整通关、失败、中止结算验证。

验收：

- 双打普通路线可完整跑完。
- 双打 Boss / 彩虹火箭队路线不崩。
- 结算统计与 BP/金币逻辑不受影响。

## 13. 测试计划

### 13.1 单元与协议测试

- format id 存在：
  - `gen7doublescustomgame`
  - `gen8doublescustomgame`
  - `gen9doublescustomgame`
- 6 只队伍 `team 1234` 后 active length 为 2。
- `move 1 2, move 2 -1` 被 Showdown 接受。
- `move 1 -2, move 2 -1` 被 Showdown 接受。
- `Surf` / `allAdjacent` 生成 choice 时不带 target。
- 带 target 的 `Surf` 会被测试标记为非法，用来防止 UI helper 生成错误 choice。

### 13.2 game-service 测试

- 双打初始 state 输出两个我方 active 和两个敌方 active。
- `BattleViewSlot.active_position` 正确。
- 同侧重复 species/name 时按 `showdown_id` 区分。
- 攻击己方目标时，timeline `target_showdown_id` 正确。
- 敌方 AI 双 active 组合 choice 合法。
- forced switch 双槽位生成合法 choice。
- Mega/Z/极巨/太晶按 active position 显示和消耗。

### 13.3 runtime 测试

- 单打开局仍要求选 3。
- 双打开局要求选 6。
- 双打每场战前要求选 4。
- 桌面和移动 `beginChallenge` 行为一致。
- 双打结算后下一场再次进入选 4。
- 中止/失败/通关结算能正常生成结果页。

### 13.4 UI 手动验收

- 设置页选择双打 64 后，开局选队显示 6 个槽位。
- 战前选 4 页面可以排序。
- 战斗页双方各显示两只 active，血条卡两行展示。
- 点击技能后，单体技能进入目标选择。
- 可以选择己方队友作为攻击目标。
- 范围技能不弹目标选择。
- 两只 active 都选择行动后才提交本回合。
- 动画播放期间顶部队伍卡冻结，播放完后统一更新。
- 移动端横屏无重叠。

### 13.5 回归命令

- `pnpm --filter @changebattle/game-service test:trainer-items`
- 新增后运行双打专用测试，例如 `pnpm --filter @changebattle/game-service test:doubles`
- `pnpm --filter @changebattle/desktop test:talents`
- `pnpm -r --if-present typecheck`
- `pnpm --filter @changebattle/mobile build`

## 14. 风险与注意事项

- 最大风险是状态串位，尤其是同侧两只相同宝可梦时。
- 不要用 species/name 作为双打 active 的主要身份。
- 不要只改 UI；如果 tracker 仍是单 active，UI 一定会在动画、HP、状态上出错。
- 不要让桌面端和移动端各自实现一套 6/4 规则。
- 不要把双打塞进 `battle_rule_preset`，否则 gen7/gen8/gen9 特殊系统组合会变得混乱。
- Showdown 的 request 是权威来源；UI 可以做友好限制，但最终非法 choice 要能从 Showdown 错误恢复。
- 特殊系统在双打中更容易出现“一回合只能一次”的约束，必须按 request 校验，不要靠本地猜。

## 15. 默认假设

- 双打作为新模式加入，单打默认不变。
- 双打规则采用“带 6 只，每场选 4 只”的 64 规则。
- 首版目标是完整接入，不做隐藏 demo。
- 桌面端和移动端都需要支持。
- 可以沿用 Showdown `customgame` 的开放合法性规则。
- AI 首版不主动设计攻击队友的高级战术，但玩家必须能手动攻击己方合法目标。
