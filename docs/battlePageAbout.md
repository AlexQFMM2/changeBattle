# Battle Page About

本文是 Battle V4 战斗页的底层实现索引。战斗页不是普通 UI 页面，它承接 Showdown battle protocol、choice 构造、播放调度、宝可梦对象生命周期、背包和换人等核心战斗逻辑。

修改战斗页相关代码前，必须先找 Pokemon Showdown Client 的对应实现，再判断本项目如何等价翻译。禁止只凭局部现象改一段前端状态或补一个特例。

## Authority

Showdown Client 是战斗页行为的权威参考。本项目架构不同，不能直接传 JS 对象引用，但行为必须等价：

```txt
Showdown Client:
side.pokemon[] 持久 BattlePokemon 对象
side.active[] 只是引用 BattlePokemon

Battle V4:
battleRosterByPlayer[player].pokemonByKey 持久 battle object
activeKeyBySlot[slot] 只是引用 battleKey
```

因此，排查身份、形态、active、目标、换人、背包、指令问题时，优先比较本项目和 Showdown Client 的对象生命周期差异。

## Playback Time Authority

Showdown Client 不会先把整段战斗日志投影成最终场面再慢慢播动画。`battle.js#nextStep/run/runMajor/runMinor` 按 step queue 一条 protocol line 一条 protocol line 推进，BattlePokemon 对象状态、`side.active[]` 引用、消息和动画在同一个播放进度里同步变化。

Battle V4 必须等价翻译这一点：

- `snapshot.rawLog` 的最终执行结果只能作为最终事实和诊断事实。
- 非 `skipAnimations` 下，BattleArena 当前画面只能来自已消费 playback step 的 visible slots。
- `switch` step 被消费前，seat 仍显示上一只宝可梦，即使最终 snapshot 已经有下一只 active。
- 指令面板可以读最新 request/snapshot 决策事实，但不能反向污染 BattleArena 的播放态。
- 导出诊断时要区分 `runtimeState`（完整 rawLog 最终态）和 `visibleRuntimeState/visibleSlots`（当前播放态）。

典型红线案例：

```txt
|move|p1b: Sharpedo|Crunch|p2a: Slowking
|-damage|p2a: Slowking|0 fnt
|faint|p2a: Slowking
|move|p2b: Sharpedo|Return|p1a: Iron Jugulis
|-damage|p1a: Iron Jugulis|107/167 frz
|switch|p2a: Cacturne|Cacturne, L48, M|134/134
```

播放到 Slowking damage/faint 或 Sharpedo Return 时，p2A 仍必须显示 Slowking/fainted；只有消费到 `switch|p2a: Cacturne` 后，p2A 才能显示 Cacturne。否则就是未来状态泄漏。

## Showdown Sources

| 领域 | Showdown Client 文件 | 重点函数/对象 | Battle V4 对应位置 |
| --- | --- | --- | --- |
| 宝可梦对象生命周期 | `packages/showdown-battle-core/vendor/showdown-client/js/battle.js` | `BattlePokemon`、`side.pokemon[]`、`side.active[]` | `packages/showdown-battle-core/src/index.ts` 的 roster；`apps/web/src/components/battle-v4/usePokemonBattleOBJHook.ts` |
| 切换上场身份解析 | `battle.js` | `getSwitchedPokemon(pokemonid, details)` | `switchedSidePokemonRow`、`battleRosterKeyForSwitch`、`canonicalBattleKeyV4` |
| 普通事件取对象 | `battle.js` | `getPokemon(pokemonid)` | `parseIdent.slotExplicit`、`activeRosterPokemon`、`patchDetailsChange`、`patchActiveCondition` |
| faint 生命周期 | `battle.js` | `side.faint(pokemon)` | `patchActiveCondition(..., {clearActiveSlot:true})`、`clearRosterActiveSlot`、`lastPokemonKeyBySlot` |
| switch/drag/replace | `battle.js` | `switchOut`、`dragIn`、`replace`、`lastPokemon` | `upsertActive`、`upsertRosterPokemon`、`clearRosterLastPokemonKeys` |
| 形态永久变化 | `battle.js` | `detailschange` | roster `species/details/searchId`；`usePokemonBattleOBJHook` 的 `battleSpeciesId/battleDetails` |
| 临时形态变化 | `battle.js` | `-formechange`、`volatiles.formechange` | `battleV4ProtocolExecutor.ts` 的 `volatileFormeSpeciesId/oldSpriteState` |
| 变身 | `battle.js` | `-transform`、复制目标当前 forme | `battleV4ProtocolExecutor.ts` 的 `transformedSpeciesId` |
| sprite/icon 来源 | `battle-dex.js` | `speciesForme`、`volatiles.formechange` | `showdownPokemonSpriteAdapter`、`usePokemonBattleOBJHook`、`battleV4ProtocolExecutor` |
| 动画播放 | `battle-animations.js`、`battle.js` scene 调用 | `runMoveAnim`、`damageAnim`、`healAnim`、`finishAnimations` | `packages/showdown-battle-core/src/playbackCompiler.ts`、`useBattleV4ShowdownScheduler.ts` |
| 播放时间推进 | `battle.js` | `nextStep`、`run`、`runMajor`、`runMinor` | `battleV4Playback.ts` 的 visible slots、`useBattleV4ShowdownScheduler.ts` |
| 指令构造 | Showdown Client `battle-choices.ts` / `BattleChoiceBuilder` | `fixRequest`、`current.targetLoc`、`chooseMove`、`chooseSwitch`、`chooseTeamPreview` | `showdownCommand.ts` shared validator；`useBattleV4CommandBuilder.ts` |
| 战斗消息 | `battle.js` protocol log handling | `-fail`、`-activate`、`detailschange`、`move` | `battleV4Commentary.ts`、`battleV4MessageFlow.ts` |

## Battle Modes

战斗页必须同时考虑单打、双打、合作三种入口。任何指令、目标、换人、展示改动都不能只用当前复现模式验证。

| 模式 | Showdown game type | 玩家/seat | active 数量 | 重点风险 |
| --- | --- | --- | --- | --- |
| 单打 `singles` | `singles` | 通常 `p1A` vs `p2A` | 每侧 1 个 active | 不应强制弹目标选择；单体招式缺 targetLoc 时 `move N` 应合法 |
| 双打 `doubles` | `doubles` | `p1A/p1B` vs `p2A/p2B` | 每侧最多 2 个 active | 目标选择、范围招式、fainted active pass、force switch 顺序最容易错 |
| 合作 `coop` | `multi` | 近侧 `p1/p3`，远侧 `p2/p4` | 每个玩家通常 1 个 active，整体多 active | 指令归属、盟友只读、投降确认、seat 映射、目标 loc 都要分清 |

### Singles

- `targetable:false` 且 `request.active.length === 1` 时，普通单体招式可以直接提交 `move N`。
- 不允许因为双打修复，把单打所有 `normal` 招式都强制打开目标面板。
- 换人编号仍按 `request.side.pokemon` 行号，不能按当前场上显示重排。

### Doubles

- `request.active[index]` 是第几个 active slot 的行动请求，不等于 `side.pokemon[index]`。
- `side.pokemon[row.active]` 才是当前出战队伍行；API/Web 要通过 normalized request 对齐。
- `targetLoc` 是 Showdown loc，不是 UI seat index：
  - 敌方目标是正数：`+1/+2`
  - 己方目标是负数：`-1/-2`
  - self/范围/场地类招式不允许手动 suffix
- fainted/commanding active 应自动 pass，不要让用户或 AI 提交非法占位。

### Coop

- Showdown game type 是 `multi`，不是 doubles。
- 近侧视觉上是 `p1/p3`，远侧是 `p2/p4`；不要把 side 简化成只有 p1/p2。
- 本地玩家通常只能操作自己的 request；盟友数据是 readonly ally，用于展示和目标选择。
- 任何 surrender、bag、target、switch 的 UI 都要检查 playerId，不要把 p3 队伍当 p1 队伍改。

## Local Modules

### Core Runtime

- `packages/showdown-battle-core/src/index.ts`
  - 战斗 session、Showdown stream、request、choice submit、raw protocol 事件投影。
  - 这里是 roster 身份和 active slot 的底层真相。
  - 文件顶部已经写明：修改前必须先对照 Showdown Client。

- `packages/showdown-battle-core/src/battleIdentity.ts`
  - `canonicalBattleKeyV4(playerId, pokeball)`。
  - 正常 battleKey 必须是 `playerId:pokeball`。
  - `species/name/details/slot/index` 禁止进入正常 battleKey。

- `packages/showdown-battle-core/src/showdownCommand.ts`
  - choice normalize、targetLoc、validator、AI fallback 共享规则。
  - Web/API/AI 不允许各写一套 target 判断。

- `packages/showdown-battle-core/src/playbackCompiler.ts`
  - 用 vendored Showdown Client 编译 rawLog 播放 timeline。
  - 前端调度顺序以这里输出的 backend groups 为准。

### Command / Choice

- `packages/showdown-battle-core/src/showdownCommand.ts`
  - `normalizeShowdownChoiceRequestV4`
  - `validateShowdownChoiceCommandV4`
  - `showdownMoveNeedsExplicitTargetV4`
  - `validShowdownTargetLocV4`
  - `fallbackLegalChoiceV4`
  - 这些是指令合法性的底层约束，不允许 Web 或 AI 绕过。

- `apps/api/src/battle.ts`
  - `normalizeBattleRequestV4`
  - `createBattleCommandDraftV4`
  - `addBattleCommandChoiceV4`
  - `setBattleCommandCurrentMoveV4`
  - `fillBattleCommandPassesV4`
  - `stringifyBattleCommandDraftV4`
  - 这里负责 API/Web 草稿层，最终语义必须服从 shared validator。

### API Projection

- `apps/api/src/battle.ts`
  - 把 core snapshot 投影成 Web view model、command state、target/switch/bag 所需结构。
  - API 可以做 UI 投影，但不能发明另一套宝可梦身份。

### Web Battle Page

- `apps/web/src/components/battle-v4/BattleV4Page.tsx`
  - 战斗页总装配。
  - 不能在这里临时重排 active 或按旧 viewModel 猜身份。

- `apps/web/src/components/battle-v4/usePokemonBattleOBJHook.ts`
  - 战斗页统一宝可梦对象来源。
  - 场上展示、目标选择、攻击面板、背包、换人面板都应通过 `battleKey -> PokemonBattleOBJ` 读取。
  - localTeam 只提供长期业务资料；当前战斗形态以 roster/teamState/request battle object 为准。

- `apps/web/src/components/battle-v4/useBattleV4CommandBuilder.ts`
  - 战斗页专用指令构造 hook。
  - 负责把玩家草稿格式化成 Showdown server 可接受的 choice 字符串。
  - 必须跟 shared validator 和 Showdown `BattleChoiceBuilder` 语义保持一致。

- `apps/web/src/components/battle-v4/battleV4ProtocolExecutor.ts`
  - 前端 raw protocol runtime 投影。
  - 只负责播放期 runtime slot、HP、状态、临时形态、消息事件。
  - 不允许覆盖长期 identity/battleKey。

- `apps/web/src/components/battle-v4/useBattleV4ShowdownScheduler.ts`
  - 消费 backend Showdown playback groups。
  - 禁止前端凭感觉重排 move/damage/heal/item/turn 顺序。

- `apps/web/src/components/battle-v4/battleV4Commentary.ts`
  - 战斗消息中文化。
  - 处理 protocol phrase 时先看 Showdown log 语义，再映射中文。

## Runtime Flow

战斗页主流程分成六条链路，排查时不要混在一起。

### 1. Session / Request Flow

```txt
createBattleSession / submitChoice / submitTrainerItem
=> Showdown BattleStream
=> request chunks
=> snapshot.requests[playerId]
=> API normalizeBattleRequestV4
=> Web command state
```

- `request` 只决定玩家现在能做什么。
- `request.side.pokemon` 是队伍行，不能当成 active slot 顺序。
- `request.active` 是行动 slot 顺序，必须通过 normalized request 映射到队伍行。

### 2. Protocol / Roster Flow

```txt
Showdown rawLog protocol
=> applyRawChunk
=> battleRosterByPlayer.pokemonByKey
=> activeKeyBySlot
=> snapshot.active
=> API/Web battle object projection
```

- raw protocol 是战斗事实来源。
- roster 是长期对象表。
- active slot 只保存 battleKey 引用。
- `snapshot.active` 是投影，不是身份真相。

### 3. Battle Object / Panel Flow

```txt
snapshot + roster + teamState + request + localTeam
=> usePokemonBattleOBJHook
=> activeNear / activeFar / partyByPlayer
=> BattleArena / target panel / move panel / bag / switch panel
```

- 面板只读 hook 输出的 battle object。
- localTeam 只补业务资料：招式、道具、长期名称、正式 run 结算 ID。
- 当前形态、HP、status、fainted、active 以 battle object 为准。

### 4. Choice Draft Flow

```txt
BattleCommandStateV4.actions
=> useBattleV4CommandBuilder
=> BattleCommandDraftV4
=> shared validator
=> submitChoice
```

- 点击招式时，如果 shared rule 判断需要 target，进入 `pendingMoveAction/currentMove`。
- 点击目标后才拼 `move N +1` 等 suffix。
- 草稿满员后 stringify，提交前仍要 preflight validate。

### 5. Playback Flow

```txt
snapshot.rawLog
=> backend Showdown playbackCompiler
=> ShowdownPlaybackTimelineV4.groups
=> Web useBattleV4ShowdownScheduler
=> battleV4ProtocolExecutor / battleV4VisualScene
=> React/CSS visual
```

- 调度顺序以 backend groups 为准。
- protocol executor 只投影播放期 runtime。
- visual scene/CSS 只负责表现，不决定战斗事实。

### 6. Error Flow

```txt
invalid choice / BattleStream error / blocked invariant
=> snapshot.status="blocked" or snapshot.error
=> Web derived battle error
=> close overlays and show error panel
```

- 不允许卡在“等待对手行动”但后台已经 invalid/blocked。
- submit resolve 后要检查返回 snapshot。
- getSnapshot poll 到 blocked/error 也必须进入同一错误态。

## Frontend Scheduling

前端调度不是“按消息一行行播”，而是消费 Showdown Client 等价的 scene group。

核心文件：

- `packages/showdown-battle-core/src/playbackCompiler.ts`
- `apps/web/src/components/battle-v4/battleV4Playback.ts`
- `apps/web/src/components/battle-v4/useBattleV4ShowdownScheduler.ts`
- `apps/web/src/components/battle-v4/battleV4ProtocolExecutor.ts`
- `apps/web/src/components/battle-v4/battleV4VisualScene.ts`
- `apps/web/src/components/battle-v4/battleV4ShowdownAnimationAdapter.ts`

调度职责：

- backend compiler 决定 group 边界。
- scheduler 决定何时消费下一 group、是否等待视觉 work 完成。
- protocol executor 更新 runtime slot、HP、status、volatile forme。
- visual scene 将 semantic event 转成动画命令。
- animation adapter 将 Showdown 动画 key 映射到本项目 CSS/asset 表现。
- BattleArena 当前画面读已消费 step 的 visible slots，不读完整 rawLog 最终 active。

关键红线：

- `move + damage + heal + item` 不能随意合并成一个大步骤。
- `damage/heal` 必须等待 HP tween。
- `turn/upkeep` 不应被前一个动画拖死。
- backend timeline 正确时，不要改 scheduler 来掩盖 CSS 问题。
- scheduler 错时，不要改 commentary 或 visual scene 绕过去。
- 禁止在动画未追上时用 snapshot 最终 runtime 覆盖 `visibleSlots`。

## Red Lines

这些是战斗页底层红线，不能为了局部现象绕开。

- 禁止用 `species/name/details/slot/index` 生成正常 battleKey。
- 禁止让新上场宝可梦继承旧 active 的 `localPokemonId/showdownIdentityToken/pokeball`。
- 禁止把 `p2: Name` 这种 inactive ident 默认当成 `p2a` active 写入。
- 禁止在 Web 面板各自维护宝可梦对象；场上、目标、攻击、背包、换人必须走统一 battle object。
- 禁止 playback runtime 覆盖长期 identity 或永久 battle species。
- 禁止 BattleArena 在非 `skipAnimations` 下读取 snapshot 最终 active 作为当前画面。
- 禁止让未消费的未来 `switch/drag/replace` 进入当前 visible slot。
- 禁止 target 面板自己“画四张卡”然后猜 targetLoc；必须用 shared validator / Showdown targetLoc 规则。
- 禁止 AI/fallback 绕过 `validateShowdownChoiceCommandV4`。
- 禁止静默吞掉 blocked/error/invalid choice。
- 禁止前端自行重排 rawLog 播放顺序；先看 backend Showdown playback timeline。
- 禁止只修 Bounce、Heat Wave、Protect 等单个招式特例；必须按 Showdown target/choice 模型修。
- 禁止口头声称“与 Showdown 一致”。必须说明参考文件、对应实现、测试覆盖。
- 禁止只测单打；涉及 target/switch/choice 的改动必须覆盖双打，必要时覆盖 coop。
- 禁止只看玩家侧；AI choice、fallback、script ally 也必须过 validator。

## Lifecycle Rules

| 事件 | Showdown 行为 | Battle V4 必须等价 |
| --- | --- | --- |
| `switch/drag` | `getSwitchedPokemon` 找非 active、非 fainted 对象；active slot 引用该对象 | 通过 request row/pokeball 找 canonical battleKey，写入 `activeKeyBySlot` |
| `replace` | 替换 active 引用，保留特定 volatile/illusion 语义 | 不复制旧 identity；必要状态按 protocol 显式更新 |
| `detailschange` | 永久更新同一对象 `speciesForme/details/searchid`，清临时 forme/type volatile | 同一 battleKey 更新 `battleSpeciesId/details/searchId` |
| `-formechange` | 写 volatile forme，切出或结束后还原 | Web runtime 写 `volatileFormeSpeciesId`，保存旧 sprite state |
| `-transform` | 复制目标当前显示形态到 volatile，不改长期身份 | Web runtime 用目标当前 species 展示，`-end transform` 还原 |
| `faint` | 清 volatile，`lastPokemon=pokemon`，`active[slot]=null` | 标记 fainted，清 `activeKeyBySlot[slot]`，写 `lastPokemonKeyBySlot` |
| `upkeep` | 清 `lastPokemon` 保护 | 清 `lastPokemonKeyBySlot` |
| `damage/heal/status` | 有 active slot 时更新 `side.active[slot]` 指向对象 | 只通过 activeKey 找 roster entry 更新，不重新按 species 搜索 |
| `swap` | 交换 active 引用 | 只交换 active slot key，不复制对象状态 |

## Choice Rules

Choice 相关必须按 Showdown `BattleChoiceBuilder` 思路处理：

- `request.active.length` 决定本回合需要几个 active choice。
- `request.side.pokemon` 是队伍行，不能假设前两个就是 active。
- `row.active` 与 `request.active[index]` 对齐，用于 active slot。
- `switch N` 的 N 仍按原始队伍行编号。
- `targetable ||= active.length > 1`。
- 缺失 `move.target` 按 Showdown 默认 `normal` 处理。
- `normal/any/adjacentAlly/adjacentAllyOrSelf/adjacentFoe` 在双打/可选目标场景需要合法 targetLoc。
- `self/all/allAdjacent/allAdjacentFoes/allySide/allyTeam/field/foeSide` 不允许手动 target suffix。
- 特殊系统字符串顺序保持 Showdown 格式：`move N mega +1`、`move N zmove +1`、`move N max +1`。
- 人类、AI、fallback、random choice 最终都必须通过 shared validator。

### Request Types

| request type | 何时出现 | 指令形态 | 注意点 |
| --- | --- | --- | --- |
| `team` | Team Preview | `team 1, team 2` | 数量由 `chosenTeamSize/maxChosenTeamSize` 决定，不能重复 |
| `move` | 正常行动 | `move N [special] [targetLoc]` / `switch N` / trainer item placeholder | active slot 数量由 `request.active.length` 决定 |
| `switch` | 强制换人 | `switch N` / `pass` | fainted/forceSwitch false slot 自动 pass |
| `wait` | 等待其他玩家 | 无提交 | UI 只能等待，不应显示可操作 move |

### Command Builder Responsibilities

`useBattleV4CommandBuilder.ts` 只做三件事：

- 管理当前草稿和 pending target 状态。
- 调用 API/core 共享 helper 拼出 Showdown choice。
- 在草稿完成时交给 submit。

它不允许：

- 自己发明 targetLoc 规则。
- 自己绕开 validator 提交字符串。
- 在 request key 改变后保留旧 `pendingMoveAction`。
- 在 blocked/error 时继续自动提交 draft。

### AI / Fallback

- AI 候选 choice 必须经过 `validateShowdownChoiceCommandV4`。
- fallback 必须枚举合法 move/switch/targetLoc，而不是拼一个看似合理的 `move 1`。
- 没有合法 fallback 时必须 blocked，并写出可读错误。
- AI 和玩家使用同一套 shared validator；不能给 AI 开后门。

## Panels

战斗页四类面板必须同源：

- 场上展示：读 `usePokemonBattleOBJHook.activeNear/activeFar` 投影出的 slot；playback 只覆盖播放态。
- 目标选择：目标卡来自当前 active battle object；React key 使用 `seat:battleKey`。
- 攻击面板：招式克制、目标判断、形态属性读 `battleSpeciesId`。
- 背包/换人：全队列表读 `partyByPlayer[player]`；`switch N` 编号仍来自 request side row。

只要出现“场上是 A，目标/背包/换人显示 B”，先查 `battleKey -> object` 是否被绕开。

### Main Battle Scene

主战斗场景包括：

- 宝可梦模型层：`BattleArena` / `BattlePokemonSprite`
- HP 面板：当前 HP、status、fainted、special badge
- 场地层：weather、terrain、room、side condition
- 动画层：move effect、damage/heal、result pop、transform
- 消息层：message bar、commentary log

数据来源：

- 当前宝可梦对象来自 `usePokemonBattleOBJHook`。
- 播放期 HP/status/volatile visual 来自 playback runtime。
- 永久 identity/battle species 不能被 playback stale slot 覆盖。

主场景常见错误：

- Mega/detailschange 后 sprite 消失：查 `battleSpeciesId`、sprite adapter、runtime volatile restore。
- 场上 A 但 HP 面板 B：查 `seat:battleKey` 和 playback merge。
- 伤害打到错误对象：查 choice targetLoc、rawLog target、protocol executor seat。
- 双打只显示一只：查 `activeKeyBySlot`、`activeNear/activeFar`、visual slots 过滤。

### Target Selection Panel

目标面板必须严格使用当前 active battle objects。

- 可选目标由 `validShowdownTargetLocV4` 过滤。
- 不可选目标可以显示但必须 disabled，不能提交 suffix。
- React key 必须包含 `seat:battleKey`，避免 Chatot -> Stunfisk 复用旧卡。
- 面板打开条件来自 `showdownMoveNeedsExplicitTargetV4`。
- `allAdjacent/allAdjacentFoes/self/field/foeSide` 等不应打开目标选择。

排查顺序：

1. 当前 move target 类型是什么。
2. `normalizedRequest.targetable` 是否正确。
3. `pendingMoveAction` 是否属于当前 request key。
4. target card 的 battleKey 是否等于场上 slot battleKey。
5. 点击后生成的 suffix 是否是 Showdown loc。

### Switch Panel

换人面板必须读全队 battle objects，但 `switch N` 编号仍用 request side row。

- 当前 active、bench、fainted、reserved switch 都来自 normalized request 和 party objects。
- 双打强制换人不能让两个 slot 选择同一只 bench。
- trapped/maybeTrapped 按 Showdown Client 行为处理：`maybeTrapped` 可 tentative switch，`trapped` 禁止。
- coop 下只允许操作当前玩家队伍，盟友/敌方可展示但不可操作。

排查顺序：

1. `request.requestType` 是 `switch` 还是 `move`。
2. `forceSwitch` 长度和 active slot 数是否一致。
3. `switchDisabledReason` 是否正确。
4. `switch N` 是否对应原始 side row index。
5. 是否有 duplicate switch。

### Bag Panel

背包是本项目自定义层，不是 Showdown 标准 choice，但必须跟 Battle V4 草稿和 active slot 对齐。

核心规则：

- 使用 `traineritem <itemInstanceId> <targetKey>` 进入 draft。
- `splitBattleTrainerItemChoicesV4` 将 trainer item 从 Showdown choice 中拆出。
- core `submitTrainerItem` 先应用道具效果，再提交 Showdown 可接受的 placeholder/pass/move choice。
- 背包目标列表必须读 `partyByPlayer[player]`，targetKey 优先 battleKey/pokeball/token。
- 回复药、状态药、特殊系统道具必须检查当前 HP/status/ruleSet。

排查顺序：

1. item 是否在玩家 battle bag 中。
2. targetKey 是否能解析到同一只 battle object/localPokemon。
3. 道具是否允许在当前状态使用。
4. trainer item 是否被 split 出来。
5. placeholder choice 是否通过 Showdown validator。
6. 使用后是否更新 local team/teamState/roster。

### Move / Attack Panel

攻击面板显示和提交是两件事：

- 显示：move name、PP、type、克制倍率、特殊系统按钮。
- 提交：choice 字符串必须符合 Showdown validator。

规则：

- PP 和 disabled 读 request active move。
- 克制倍率读目标 battleSpeciesId，不读 baseSpeciesId。
- Mega/Z/Max/Tera 是否显示由 ruleSet、bag special system、request capability 共同决定。
- 点击 move 后是否直接提交，由 shared target rule 决定。
- 任何显示 fallback 不得影响最终 validator。

## Playback Rules

播放顺序参考 `docs/battle-playback-showdown-parity.md`。核心原则：

- rawLog 是动画、消息、HP、状态播放顺序的事实来源。
- backend `playbackCompiler.ts` 通过 Showdown Client scene stub 生成 groups。
- Web scheduler 只消费 backend groups，不重新定义 Showdown 播放边界。
- `runtimeState` 可以表示完整 rawLog 最终态；`visibleRuntimeState/visibleSlots` 才表示当前画面。
- BattleArena 必须使用 `visibleSlots` 派生出的 battle objects；目标/背包/换人仍可使用最新 request/snapshot 决策事实。
- 如果 timeline 正确但画面错，查 `battleV4ProtocolExecutor`、`battleV4VisualScene`、CSS 动画映射。
- 如果 timeline 本身错，先查 `playbackCompiler.ts` 与 Showdown Client scene 方法差异。

## Diagnostics Checklist

排查战斗页 bug 时按这个顺序看：

1. rawLog 是否有对应 protocol 事件。
2. Showdown Client 对该事件如何处理，具体函数在哪。
3. core roster 是否保持正确 `pokemonByKey` 和 `activeKeyBySlot`。
4. `teamStateByPlayer` 和 request side row 是否提供正确 pokeball。
5. API view model 是否只是投影，没有重建身份。
6. `usePokemonBattleOBJHook` 输出的 `battleKey/battleSpeciesId/hp/status` 是否一致。
7. Web playback consumed sequence 是否已经到达对应 rawLog event。
8. `visibleSlots/visibleRuntimeState` 是否被未来 final runtime 污染。
9. 场上、目标、攻击、背包、换人是否读取同一个 battle object，且场上是否服从播放态。
10. choice 是否通过 shared validator。
11. blocked/error 是否显式展示。
12. Web playback timeline 和 scheduler 消费顺序是否与 backend groups 一致。

## Required Tests

改动战斗页底层逻辑时，至少跑：

```bash
pnpm --filter @changebattle-v2/showdown-battle-core test
pnpm --filter @changebattle-v2/api test:identity-sync
pnpm --filter @changebattle-v2/api typecheck
pnpm --filter @changebattle-v2/web test:scheduler
pnpm --filter @changebattle-v2/web typecheck
pnpm --filter @changebattle-v2/core test
git diff --check
```

如果改的是 release/debug 包，再按 `release/README.md` 的发布流程额外验证增量更新。

## Debug Artifacts

诊断 JSON 重点看：

- `rawLog`
- `snapshot.status`
- `snapshot.error`
- `requests`
- `debug.latestSidePokemon`
- `battleRosterByPlayer`
- `teamStateByPlayer`
- `visualSlots`
- `runtimeState.slots`
- `visibleRuntimeState`
- `visibleSlots`
- `showdownPlaybackTimeline`
- `playbackStepQueue`
- `playbackStepConsumption`

看到“卡死”或“没反馈”时，先查 blocked/error/invalid choice 是否被静默吞掉；看到“面板错位”时，先查 battleKey；看到“形态消失”时，先查 detailschange/formechange/transform 的永久/volatile 分层。

## Regression Matrix

战斗页改动至少考虑这些组合：

| 场景 | 必看点 |
| --- | --- |
| 单打普通招式 | `move N` 不要求 target suffix |
| 单打 self/field 招式 | 不弹目标面板，不允许 suffix |
| 双打 normal 单体招式 | 必须选择合法敌方 targetLoc |
| 双打 allAdjacent/allAdjacentFoes | 不弹目标面板，不能带 suffix |
| 双打 adjacentAlly/adjacentAllyOrSelf | 只能选合法己方或自己 |
| 双打一只 fainted active | fainted slot 自动 pass，另一只仍可行动 |
| 强制换人 | switch 数量、重复选择、fainted bench、reserved switch |
| coop/multi | p1/p3 近侧、p2/p4 远侧，盟友 readonly |
| trainer item | targetKey 命中、placeholder choice 合法、无效道具有反馈 |
| Mega/detailschange | key 不变，形态永久，切出再上场仍是 Mega |
| formechange/transform | 临时形态可还原，不污染长期身份 |
| Chatot faint -> Stunfisk switch | 新对象用 Stunfisk pokeball，不继承 Chatot |
| inactive silent detailschange | 不污染当前 active |
| AI locked move | 不提交缺 target 的裸非法 move |
| blocked/invalid choice | UI 强提示，不静默等待 |

## Maintenance Rule

任何战斗页底层变更的 PR/提交说明必须回答：

- 参考了 Showdown Client 哪个文件、哪个函数。
- 本项目等价落在哪一层。
- 为什么不能只在 UI 层补丁。
- 哪个测试证明没有破坏单打、双打、合作、多 active、背包、换人、特殊形态。

答不上来，就不要改战斗页底层逻辑。
