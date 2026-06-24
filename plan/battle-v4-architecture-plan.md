# Battle V4 架构计划：Showdown Protocol Runtime 优先

## Summary

Battle V4 的核心目标不是继续修补 V3，而是按 Pokemon Showdown 官方 client 的边界重建战斗内核：

```txt
Showdown raw protocol 是事实源
request 是指令 UI 源
animation queue 只表现事实变化
V2 战斗页 UI 继续复用
```

实施顺序固定为：

```txt
训练场测试优先
-> singles / doubles / multi 三模式稳定
-> 再接正式 GameRun 流程
```

训练场是 V4 第一入口，用来快速验证 Showdown 原始返回、协议解析、p1/p2/p3/p4、seat 映射、request/choice、主动换人、濒死强制换人、动画消费和状态展示。正式 GameRun 不在第一阶段接入，避免又把不稳定内核带进正式流程。

V4 不直接搬官方 `panel-battle.tsx` 页面。官方页面是 AGPL 且依赖 Pokemon Showdown 自己的房间、网络、Preact、全局状态。V4 只参考/局部移植官方 MIT 的 `battle-*.ts`、Showdown simulator 和 Showdown Dex：`BattleTextParser / BattleChoiceBuilder / BattleStream / Dex data / Dex search` 是优先复用对象。

本文档已迁移到 `changeBattleV2`。后续实现默认基于 V2 新项目边界：`apps/api` 放 Web/Desktop 共用应用函数，`packages/*` 放无 UI 依赖的核心包，旧 `changeBattle` 只作为参考来源，不作为运行时依赖。

官方资料统一放在工作区外部研究目录：

```txt
/home/alexqfmm/workPlace/pokemon/pokemonShowdownAbout/
  pokemonShowdown/       # server / simulator / data
  pokemonShowdownClient/ # official web client
  pokemonShowdownDex/    # dex.pokemonshowdown.com
```

## Core Architecture

```txt
Showdown BattleStream raw output
-> RawProtocolRecorder
-> ProtocolParser             # 优先复用官方 BattleTextParser
-> BattleProtocolRuntime
   -> p1/p2/p3/p4 side model
   -> active slot model
   -> pokemon model
   -> request model
-> BattleEventAdapter
-> AnimationQueue
-> ViewTeam Commit
-> V2 Battle UI
```

核心边界：

- `|request|...` 不进入动画队列，只更新 `CommandState`。
- `|move| / |switch| / |drag| / |replace| / |faint| / |-damage| / |-start| / |-end|` 进入 `BattleProtocolRuntime`。
- `BattleProtocolRuntime` 只接收 raw protocol，不读取 React UI 状态。
- `BattleEventAdapter` 只把 protocol fact 转成动画事件，不创造事实。
- `AnimationQueue` 只包含动画和 checkpoint commit，不包含 `showCommand`。
- `CommandPresenter` 只从 `request` 和 runtime state 生成 UI 可选操作。
- V2 UI 只读 `BattleViewModelV4`、播放动画、提交 choice，不参与身份判断。
- 正式流程、训练场、debug 最终都走同一个 V4 runtime；差异只在创建 GameRun/Player/Team 的入口。

## Official Reuse Strategy

官方资源分三档复用，避免再次凭空猜协议，同时避免把不适合的页面体系硬塞进项目。

### 直接复用

这些模块优先复制/封装到 `changeBattleV2` 的 battle/showdown adapter 层，并保留原始 license 注释：

- `pokemonShowdownClient/play.pokemonshowdown.com/src/battle-text-parser.ts`
  - 用于解析 raw protocol line 的 `args/kwArgs`。
  - V4 不再自己手写临时 parser，除非官方 parser 无法独立运行。
- `pokemonShowdownClient/play.pokemonshowdown.com/src/battle-choices.ts`
  - 用于参考或移植 request -> choice string 的构建规则。
  - 尤其是 doubles/multi 多选择、targetLoc、自动 pass、forceSwitch。
- `pokemonShowdown/data/*.ts`
  - `pokedex/moves/abilities/items/learnsets/typechart/aliases/formats-data` 是 Dex 事实源。
  - 后续技能动画绑定、图鉴搜索、合法招式、属性显示都应优先从这些数据派生。
- `pokemonShowdown/sim/teams.ts`
  - 用于 Showdown team pack/unpack 规则对照。

### 包装复用

这些资源可以作为独立工具或 iframe/webview/adapter 包装，不直接混入战斗 runtime：

- `pokemonShowdownDex/testclient.html`
  - 可作为完整图鉴工具入口。
  - 适合放到 debug / dex 页面作为“官方图鉴参考”打开。
- `pokemonShowdownDex/js/pokedex*.js`
  - 可研究其搜索、面板、详情展示逻辑。
  - 若要接入 React，需要抽数据和搜索逻辑，不直接搬 Backbone panel。
- `pokemonShowdown/sim/battle-stream.ts`
  - 训练场 raw debug 和自动 fixture 生成优先用 BattleStream。
  - Runtime 不直接依赖 Electron IPC；Electron/Web 只负责提供 raw input/output。

### 只参考不搬

这些模块不直接进入项目实现：

- `pokemonShowdownClient/play.pokemonshowdown.com/src/panel-battle.tsx`
  - AGPL 页面，强依赖官方房间系统、网络层、Preact、全局 `PS`。
  - 只参考它的边界：`request -> receiveRequest -> BattleChoiceBuilder`，其他 protocol line -> `battle.add`。
- `pokemonShowdownClient/play.pokemonshowdown.com/src/battle.ts`
  - 可参考 `Battle / Side / Pokemon` 建模和 p3/p4 multi 处理。
  - 不原样照搬完整类；官方为 replay 兼容存在名字匹配等 fallback，V4 红线禁止这些兜底。
- `pokemonShowdownDex/js/panels.js`
  - Backbone/jQuery 面板路由，不进入 React 主应用状态树。

建议新增 adapter 目录：

```txt
packages/showdown-battle-core/
  protocol/
    battle-text-parser.ts
    protocol-types.ts
  choices/
    battle-choice-builder.ts
  dex/
    load-showdown-dex-data.ts
    showdown-dex-search.ts
  debug/
    battlestream-fixture-runner.ts
```

`packages/showdown-battle-core` 只做官方资源适配，不放业务状态、不放 UI、不放 GameRun 逻辑。

## Object Structure

### Showdown Identity

```ts
type ShowdownPlayerId = "p1" | "p2" | "p3" | "p4";
type ShowdownSlot = "a" | "b" | "c" | "d" | "e" | "f";
type ShowdownActiveId = `${ShowdownPlayerId}${ShowdownSlot}`;

type BattleV4Mode = "singles" | "doubles" | "multi";
type BattleV4Source = "training" | "official" | "debug";
type BattleV4GameType = "singles" | "doubles" | "multi" | "freeforall" | "triples";

type BattleV4SeatId =
  | "nearA"
  | "nearB"
  | "farA"
  | "farB";
```

V4 必须明确区分四种身份：

- `ShowdownPlayerId`：Showdown 玩家位，`p1/p2/p3/p4`。
- `ShowdownActiveId`：Showdown 场上位，`p1a/p1b/p3b` 等。
- `BattlePokemonId`：本场战斗内宝可梦实体 ID。
- `BattleV4SeatId`：我方 UI 展示座位，`nearA/nearB/farA/farB`。

`showdownIdentityToken` 继续用于长期回写和 pokeball 承载，但它不是 Showdown active ident，也不能用来替代 `p1a/p2a/p3b`。

### BattleGameV4

```ts
type BattleGameV4 = {
  id: string;
  source: BattleV4Source;
  mode: BattleV4Mode;
  status:
    | "creating"
    | "opening"
    | "running"
    | "waitingInput"
    | "animating"
    | "ended"
    | "blocked";

  showdown: {
    sessionId: string;
    formatId: string;
    gameType: BattleV4GameType;
    seed: string | number[];
    rawProtocol: ShowdownRawFrame[];
    currentRequest: ShowdownRequestState | null;
    lastError?: BattleV4InvariantError;
  };

  participants: Record<ShowdownPlayerId, BattleV4Participant>;
  teams: Record<ShowdownPlayerId, BattlePokemonV4[]>;
  protocol: BattleProtocolStateV4;
  view: BattleViewStateV4;
  animation: BattleAnimationStateV4;
  command: BattleCommandStateV4;
  debug: BattleV4DebugState;
};
```

### Participant

```ts
type BattleV4Participant = {
  playerId: ShowdownPlayerId;
  gamePlayerId: string;
  controller: "local" | "ai" | "remote" | "script";
  alliance: "near" | "far";
  allyPlayerIds: ShowdownPlayerId[];
  foePlayerIds: ShowdownPlayerId[];
};
```

默认控制关系：

- 训练场 singles/doubles：`p1 = local`，`p2 = ai`。
- 训练场 multi/co-op：`p1 = local`，`p3 = ai/script ally`，`p2/p4 = ai enemy`。
- 后续正式合作双打可按 GameRun player/controller 分配覆盖默认值。

### BattlePokemonV4

```ts
type BattlePokemonV4 = {
  battlePokemonId: string;
  sourcePokemonId: string;
  ownerPlayerId: ShowdownPlayerId;
  teamIndex: number;
  showdownIdentityToken: string;

  ident: string;
  details: string;
  condition: string;
  hp: number | null;
  maxHp: number | null;
  status: string;
  moves: BattleMoveView[];
  fainted: boolean;

  volatileFlags: {
    substitute?: boolean;
    transformed?: boolean;
    terastallized?: boolean;
    dynamaxed?: boolean;
    illusioned?: boolean;
  };
};
```

规则：

- `ident` 来自 Showdown，例如 `p1: Pikachu`。
- active 变化只由 `switch/drag/replace` 写入。
- `faint` 只写 `fainted/hp/status`，不清空 active，不清空 UI seat。
- `Substitute/Transform/Terastal/Dynamax/Illusion` 是视觉/volatile flag，不改长期 identity。

### Protocol State

```ts
type BattleProtocolStateV4 = {
  sides: Record<ShowdownPlayerId, {
    playerId: ShowdownPlayerId;
    name: string;
    active: (BattlePokemonRef | null)[];
    team: BattlePokemonRef[];
  }>;

  activeBindings: Partial<Record<ShowdownActiveId, {
    activeId: ShowdownActiveId;
    playerId: ShowdownPlayerId;
    slotIndex: number;
    battlePokemonId: string;
    uiSeatId: BattleV4SeatId;
  }>>;

  uiSeatMap: Record<BattleV4SeatId, ShowdownActiveId | null>;
};
```

Seat 映射默认规则：

- singles：`p1a -> nearA`，`p2a -> farA`。
- doubles：`p1a -> nearA`，`p1b -> nearB`，`p2a -> farA`，`p2b -> farB`。
- multi/co-op：`p1a -> nearA`，`p3b -> nearB`，`p2a -> farA`，`p4b -> farB`。

如果 raw protocol fixture 证明 multi slot 不同，必须以 raw protocol 修正规则，不能用 UI 现象猜。

### Command State

```ts
type BattleCommandStateV4 = {
  phase: "none" | "team" | "move" | "switch" | "wait";
  request: ShowdownRequestState | null;
  actingPlayerId: ShowdownPlayerId | null;
  choicesDraft: string[];
  availableActions: BattleV4Action[];
};
```

规则：

- `requestType = move`：从 `request.active` 生成招式和目标选择。
- `requestType = switch`：从 `request.forceSwitch` 和 `request.side.pokemon` 生成强制换人选择。
- `requestType = team`：生成队伍预览选择。
- `requestType = wait`：不显示本地 command。
- 自动 `pass` 只在 choice layer 处理，不进入动画队列。
- AI/NPC 只在队列空、runtime 不在 animating、且 command 判断对应 player 非 local 时提交选择。

### Runtime Event

```ts
type BattleV4RuntimeEvent =
  | {type: "move"; user: ShowdownActiveId; target: ShowdownActiveId | null; move: string}
  | {type: "damage"; target: ShowdownActiveId; condition: string}
  | {type: "heal"; target: ShowdownActiveId; condition: string}
  | {type: "status"; target: ShowdownActiveId; status: string}
  | {type: "volatileStart"; target: ShowdownActiveId; volatile: string}
  | {type: "volatileEnd"; target: ShowdownActiveId; volatile: string}
  | {type: "switch" | "drag" | "replace"; activeId: ShowdownActiveId; pokemon: BattlePokemonRef}
  | {type: "faint"; target: ShowdownActiveId}
  | {type: "fieldEffect" | "sideEffect"; effect: string; active: boolean}
  | {type: "turn"; turn: number}
  | {type: "end"; winner: ShowdownPlayerId | null};
```

Runtime event 是动画 adapter 的输入，不是 UI 事实源。事实源仍是 `BattleProtocolStateV4`。

## Red Lines

这些是 V4 硬红线，违反就是 bug：

- 严禁从中文文本、日志描述、名字、物种、图片、HP、速度顺序反推身份或目标。
- 严禁把 `request` 当动画指令。
- 严禁动画队列里出现 `showCommand`。
- 严禁用 `request.active[index]` 直接决定 UI seat。
- 严禁用 `request` 的 active 变化 synthetic commit seat。
- 严禁没有 `switch/drag/replace` 就切换模型或 active binding。
- 严禁在 `faint` 时清空 seat；只有 `switch/drag/replace` 能改变 active binding。
- 严禁把 `p3/p4` 压扁进 `p1/p2`；multi 必须建四个 player side。
- 严禁加“唯一匹配所以兜底”的逻辑。
- 严禁缺 ident、缺 seat、缺 target 时继续猜；必须 blocked 并导出 raw trace。
- 严禁前端修改事实状态；前端只提交 choice、播放动画、触发 commit checkpoint。
- 严禁为了兼容 V3 旧路径保留双数据源；V4 战斗页只读 V4 runtime/view。
- 严禁先接正式流程再验证训练场；训练场三模式不稳，不进入正式 GameRun 接入。

## Implementation Phases

### Phase 0：文档与官方对照

目标：把 V4 的协议事实和官方 client 对照固定下来。

产出：

- `docs/showdown-sim-protocol.zh-CN.md`：官方 SIM-PROTOCOL 中文注释版。
- `docs/showdown-client-battle-architecture-notes.md`：官方 client battle 架构笔记。
- `plan/battle-v4-architecture-plan.md`：本文档。
- 官方研究目录索引：
  - `/home/alexqfmm/workPlace/pokemon/pokemonShowdownAbout/pokemonShowdown/sim/SIM-PROTOCOL.md`
  - `/home/alexqfmm/workPlace/pokemon/pokemonShowdownAbout/pokemonShowdown/sim/battle-stream.ts`
  - `/home/alexqfmm/workPlace/pokemon/pokemonShowdownAbout/pokemonShowdownClient/play.pokemonshowdown.com/src/battle-text-parser.ts`
  - `/home/alexqfmm/workPlace/pokemon/pokemonShowdownAbout/pokemonShowdownClient/play.pokemonshowdown.com/src/battle-choices.ts`
  - `/home/alexqfmm/workPlace/pokemon/pokemonShowdownAbout/pokemonShowdownDex/testclient.html`

验收：

- 明确 `request` 与 protocol line 分离。
- 明确 `p3/p4` 是一等 side。
- 明确 V4 不直接搬官方 AGPL 页面。
- 明确 parser、choice、dex 数据优先从官方 MIT 资源适配。

### Phase 1：训练场 Raw Debug 优先

目标：训练场能创建 V4 raw battle session，优先看清 Showdown 原始返回。

范围：

- 训练场可选择 `singles / doubles / multi`。
- 使用 BattleStream raw API 创建 session。
- 显示完整 raw writes、raw chunks、当前 request、parsed lines。
- multi 模式必须真正写入 `p1/p2/p3/p4` player，不用双打假装合作。
- Debug 输出为 pretty JSON，不写 jsonl。

暂不做：

- 不接正式 GameRun。
- 不做完整动画。
- 不做复杂道具、结算、休整。

验收：

- singles 能看到 `p1a/p2a`。
- doubles 能看到 `p1a/p1b/p2a/p2b`。
- multi 能看到 `p1/p2/p3/p4` 和对应 active ident。
- 每次 `choose` 后能完整查看 Showdown 原始返回。

### Phase 2：Protocol Runtime

目标：实现纯 TypeScript、无 React/Electron 依赖的 `BattleProtocolRuntimeV4`。

前置：

- 先建立 `showdown-adapter/protocol`，接入官方 `BattleTextParser.parseBattleLine` 能力。
- Runtime 不使用手写 split parser 作为主路径。
- 若官方 parser 因依赖无法直接运行，必须保留官方解析行为对照测试。

覆盖 major protocol：

- `start`
- `player`
- `teamsize`
- `gametype`
- `poke`
- `switch`
- `drag`
- `replace`
- `move`
- `faint`
- `swap`
- `turn`
- `win`
- `tie`

覆盖 minor protocol：

- `-damage`
- `-heal`
- `-status`
- `-curestatus`
- `-boost`
- `-unboost`
- `-start`
- `-end`
- `-fieldstart`
- `-fieldend`
- `-sidestart`
- `-sideend`
- `detailschange`

规则：

- 所有 line 都保留 raw 原文。
- 解析失败只进入 `unsupportedLines` 或 `blocked`，不猜状态。
- `switch/drag/replace` 是 active binding 唯一事实源。
- `move` 使用 protocol 的 user/move/target。
- `faint` 不清空 seat。

验收：

- raw fixture 喂入 runtime 后能得到稳定 sides、team、activeBindings、uiSeatMap。
- Substitute 通过 `|-start|p2a: X|Substitute` 设置对应 active 的 volatile flag。
- `replace` 不被当作普通 switch；单独保留事件类型。

### Phase 3：Choice / Command Layer

目标：从 Showdown request 生成 V4 command state。

前置：

- 先研究/移植官方 `BattleChoiceBuilder`。
- 不能先写自己的 choice 拼接器再事后补兼容。

范围：

- `requestType = move`：生成 move actions。
- `requestType = switch`：生成 forced switch actions。
- `requestType = team`：生成 team preview actions。
- `requestType = wait`：无本地 command。
- 支持 `active: null` 和 `forceSwitch: false` 自动 pass。
- 支持 doubles/multi 多 active choice 拼接。

规则：

- choice builder 输出 Showdown choice string，例如 `move 1, move 2`、`switch 3, pass`。
- target 选择使用 Showdown move target 规则和当前 active ident，不从 UI seat 猜。
- AI/NPC 自动选择只在 runtime 队列空后发生。

验收：

- forced switch request 不显示普通 move command。
- p3/p4 request 不串到 p1/p2。
- active null 时自动 pass，不阻塞。

### Phase 4：Event Adapter 与 Animation Queue

目标：把 runtime event 转成现有 V2/V3 动画系统能播放的动画队列。

事件映射：

- `move` -> `useMove/useSkill`，包含 user seat、target seat、move id/name。
- `damage/heal` -> HP 动画 + commit HP。
- `status/curestatus` -> 状态动画 + commit status。
- `faint` -> faint 动画 + commit fainted，不清空 seat。
- `switch/drag/replace` -> recall/sendOut/commit active binding。
- `volatileStart/volatileEnd` -> visual flags/form display event。
- `fieldEffect/sideEffect` -> 天气、场地、空间、撒钉等视觉事件。

规则：

- 动画队列只表现 runtime event，不生成 command。
- commit 只 patch 小字段，不整体覆盖 viewTeam。
- `commitSeat` 只能来自 confirmed `switch/drag/replace`。
- 替身走 visual flag，不把宝可梦图片直接改成替身图。

验收：

- 主动换人能生成 recall/sendOut/commit。
- 击倒后先 faint，seat 保留死亡宝可梦，直到 confirmed switch。
- 没有 target seat 的 move 必须 blocked，不播放错误动画。

### Phase 5：V2 UI 接入

目标：复用用户喜欢的 V2 战斗页 UI，只换数据源。

范围：

- 新增 `BattleV4ViewModel` adapter。
- V2 场景、HP 卡、队伍球、指令面板、目标选择、换人面板、倍速、debug 按钮继续沿用视觉风格。
- UI 从 `BattleGameV4.view` 和 `BattleGameV4.command` 渲染。
- UI 提交 choice draft，不生成 protocol fact。

规则：

- UI 不读取 V3 runtime/team/view。
- UI 不维护身份事实。
- UI 不根据名字/图片/位置修正 seat。
- 倍速必须作用于所有动画，包括 atk/useSkill/switch/faint/hp。

验收：

- 训练场 singles/doubles/multi 都能在 V2 风格页面内看到正确四 seat。
- command 面板只在 `command.phase` 允许时出现。
- 队伍球、模型、名字、HP 卡与 seat 一致。

### Phase 6：训练场三模式稳定

目标：训练场先完成 V4 最小闭环。

每个模式必须覆盖：

- 开局出场。
- 普通出招。
- 主动换人。
- 击倒至少一只宝可梦。
- forced switch。
- 换人后回到下一轮 command。

模式要求：

- singles：`p1a/p2a`。
- doubles：`p1a/p1b/p2a/p2b`，覆盖单边击倒。
- multi/co-op：`p1/p2/p3/p4`，覆盖 ally 和 enemy 不串位。

验收：

- 三模式每个至少稳定 3 回合。
- 不出现 forced switch 跳普通 command。
- 不出现 faint 后模型提前消失。
- Debug 文件可直接格式化、搜索、折叠。

### Phase 7：正式 GameRun 接入

目标：训练场稳定后，再把正式 `createBattleGame` 切到 V4。

范围：

- `GameRun/Pokemon/Bag/Rest/Settlement` 后续按 V2 新架构重新接入，不从旧 V3 直接搬状态。
- 正式战斗创建 `BattleGameV4`。
- 正式战斗结束写回仍只在 animation queue 消费完、runtime ended 后执行。
- V3 可保留为旧实现备份，不混入 V4 runtime。

验收：

- 单打正式流程能打一场完整战斗并返回休整。
- 双打正式流程能打一场完整战斗并返回休整。
- 合作双打正式流程能打一场完整战斗并返回休整。
- 结算、历史、BP 写回不重复。

## Debug Files

每场 V4 battle 生成一个 debug 文件夹：

```txt
battle-v4-<source>-<mode>-<battleId>-<timestamp>/
  initial-self-check.json
  raw-protocol.json
  runtime-events.json
  animation-consumption.json
  command-state.json
```

规则：

- 全部 pretty JSON：`JSON.stringify(data, null, 2)`。
- 内容完整，不裁剪。
- `raw-protocol.json` 必须包含 Showdown 原始 writes/chunks。
- `runtime-events.json` 必须包含 raw line、parsed args、kwArgs、event 类型、映射后的 active/seat。
- blocked 时必须写入 lastError、current request、activeBindings、uiSeatMap。

## Test Plan

单元测试：

- raw protocol parser：`args/kwArgs` 与官方格式一致。
- `parsePokemonIdent`：支持 `p1`、`p2`、`p3`、`p4` 和 `a-f` slot。
- singles fixture：start/switch/move/damage/faint/request。
- doubles fixture：p1A/p1B/p2A/p2B 目标和击倒。
- multi fixture：p1/p2/p3/p4 四 side 和 seat 映射。
- forced switch fixture：request 只生成 switch command，不生成 move command。
- Substitute fixture：volatile flag 更新，不改 display identity。
- replace/drag/swap fixture：保持独立事件，不混成普通 switch。

UI/烟测：

- 训练场 singles：主动换人、击倒、强制换人。
- 训练场 doubles：击倒 p2A 或 p2B，只对应 seat 换人。
- 训练场 multi：四 player side 不串位，AI ally/enemy choice 不串。
- 倍速覆盖 atk/useSkill/switch/faint/hp。
- Debug 导出文件可打开、格式化、搜索。

回归命令：

```bash
pnpm --filter @changebattle-v2/showdown-battle-core typecheck
pnpm --filter @changebattle-v2/desktop typecheck
pnpm --filter @changebattle-v2/desktop test:battle-v4-model
pnpm --filter @changebattle-v2/desktop test:battle-v4-training-smoke
```

## Migration Rules

- V4 第一阶段不影响 V2 当前首屏、首页、用户资料、图鉴入口。
- V4 不复用 V3 的 `showCommand` 动画路径。
- V4 不复用 V3 的 request.active synthetic seat commit。
- V4 可以参考旧项目 V2/V3 的视觉组件和动画脚本，但复制进入 V2 时必须改成 V4 adapter 输入。
- V4 runtime 必须放在无 UI 依赖的 runtime/model 层，方便 Electron/Web/测试共用。
- 旧 Battle V2/V3 页面只作为参考，不作为 V2 新项目的运行时回退。
- 官方 adapter 必须保留 license 头和来源路径注释。
- AGPL 页面代码不直接复制进项目业务代码。
- Showdown Dex 可作为独立工具入口保留，不强行 React 化。

## Assumptions

- 用户继续偏好 V2 战斗页 UI，V4 不重做视觉。
- 官方 client 是协议边界参考；不直接搬 AGPL 页面。
- `battle-*.ts` 的 MIT 逻辑可以作为实现参考或局部移植来源。
- Showdown Dex 是 MIT，可复用数据、搜索和独立工具页；UI 是否深度接入另行设计。
- 训练场优先级高于正式流程。
- V4 的第一成功标准不是“一次性打完整正式一局”，而是训练场 raw protocol 和 runtime 状态完全可解释、可测试、可复现。
