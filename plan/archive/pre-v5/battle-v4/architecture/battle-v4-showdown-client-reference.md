# Battle V4 Showdown Client 战斗流参考文档

## Summary

本文档用于指导 Battle V4 的完整战斗页架构：单打、双打、合作/multi 的玩家操作、目标选择、换人、文字提示、动画播放都必须在同一套 Showdown client 思路下设计。

当前结论：

```txt
V4 不复制 Showdown 的 AGPL 战斗页
V4 模仿 Showdown client 的战斗命令流和协议播放流
V4 视觉继续按 ui-refences + V1 实现还原
单打、双打、合作是三个并列模式，不是互相退化
双打和合作是核心架构压力测试；单打可以作为第一手动验收闭环，但不能作为架构简化依据
```

Showdown client 的战斗页可以拆成两条主链路：

```txt
玩家操作链路:
|request| JSON
-> receiveRequest()
-> BattleChoiceBuilder
-> render controls
-> /move /switch /team
-> BattleChoiceBuilder.addChoice()
-> done 后 /choose ...

协议播放链路:
raw battle protocol line
-> Battle.add()
-> Battle.nextStep()
-> Battle.run()
-> runMajor / runMinor
-> BattleScene animation
-> BattleLog / BattleTextParser 文本
```

我们的模仿重点不是页面 DOM，而是这两条链路的职责边界。V1 单打做得好但撑不起双打/合作，根因就是 UI 和指令事实耦合太深、active slot 和 player/ally 概念没有一开始建模清楚；V4 不能重走这条路。

## Architecture Principle

V4 必须把三件事彻底分开：

```txt
game type / seat / active slot 是战斗结构
request / choice builder 是玩家当前可操作内容
protocol runtime / animation queue 是 Showdown 已经发生的事实
```

不能出现的设计：

```txt
单打页面自己拼完整 choice
双打页面再补一套 choice 拼接
合作页面又特殊合并 p1/p3 指令
UI 组件直接判断谁是当前 active 的事实源
动画或 snapshot 反推本回合发生了什么
```

三种模式定义：

```txt
singles:
  3v3
  每方 1 个玩家
  每方同时上 1 只
  active slots = p1a / p2a
  本地玩家通常控制 1 个 active

doubles:
  4v4
  每方 1 个玩家
  每方同时上 2 只
  active slots = p1a,p1b / p2a,p2b
  本地玩家通常控制 2 个 active
  choice 必须逐 active 暂存，全部完成才提交

multi / 合作:
  4v4
  每方 2 个玩家
  每个玩家同时上 1 只
  active slots = p1a,p3a / p2a,p4a
  p1 与 p3 是 ally，但本地玩家只提交自己 request 里要求的选择
  ally 队伍和 active 只读展示
  不把 p3 的 choice 合并进 p1
```

必须统一的设计：

```txt
shared command runtime:
  active slot 数组是基本单位
  request.active / forceSwitch 数组是操作需求源
  choice draft 按 active index 前进
  target picker 能表达 +1/+2 和 -1/-2
  switch picker 能防止两个 active 换入同一只
  ally 队伍/active 可以展示，但不能被本地玩家代操作

singles:
  使用同一套 command runtime
  request.active 长度为 1
  target picker 通常只是确认 UI
  choice draft 只处理本地当前 1 个 active

doubles:
  使用同一套 command runtime
  request.active 长度通常为 2
  choice draft 逐个处理本地 2 个 active

multi / 合作:
  使用同一套 command runtime
  request.active 长度通常为 1
  ally active 只读展示
  本地 choice 不合并 ally choice
```

如果某个实现只能让单打工作、但双打需要推翻重做，这个实现就不算 V4 的正确方向。

## Reference Root

官方 client 参考目录：

```txt
/home/alexqfmm/workPlace/pokemon/pokemonShowdownAbout/pokemonShowdownClient/play.pokemonshowdown.com
```

V4 项目目录：

```txt
/home/alexqfmm/workPlace/pokemon/changeBattleV2
```

V4 UI 参考：

```txt
changeBattleV2/plan/references/ui/ui-refences/参考ui.md
changeBattleV2/plan/references/ui/ui-refences/image.png      # 战斗准备页
changeBattleV2/plan/references/ui/ui-refences/image-1.png    # 技能选择页
changeBattleV2/plan/references/ui/ui-refences/image-2.png    # 攻击对象选择面板
changeBattleV2/plan/references/ui/ui-refences/image-3.png    # 战斗页详细拆解
changeBattleV2/plan/references/ui/ui-refences/image-4.png    # 对局详情/换人列表参考
changeBattleV2/plan/references/ui/ui-refences/image-5.png    # 带特殊系统技能选择
```

V1 参考：

```txt
/home/alexqfmm/workPlace/pokemon/changeBattle
```

V1 的价值：

- 战斗页整体 UI 已经接近参考图，V4 应优先 1:1 对照它的布局、比例、信息卡、小图标、面板关系。
- V1 换人选择、目标选择、技能卡片是直接 UI 参考。
- V4 只替换底层 Showdown protocol/request runtime，不重新发明视觉。

## Source Map

### panel-battle.tsx

路径：

```txt
pokemonShowdownAbout/pokemonShowdownClient/play.pokemonshowdown.com/src/panel-battle.tsx
```

用途：

- Showdown client 战斗房间页面。
- 处理 `|request|`。
- 渲染 move/switch/team/wait 控制区。
- 将按钮写成 `data-cmd="/move 1"`、`data-cmd="/switch 3"`。

重点参考：

```txt
BattlePanel.receiveLine()
```

参考位置：

- `receiveLine(args)`：约 404 行。
- `receiveRequest(request)`：约 429 行。
- `renderMoveMenu(choices)`：约 580 行。
- `renderMoveControls(active, choices)`：约 636 行。
- `renderMoveTargetControls(request, choices)`：约 709 行。
- `renderSwitchMenu(request, choices)`：约 757 行。
- `renderPlayerControls(request)`：约 912 行。

模仿思路：

- V4 不复制该页面。
- V4 参考它的 request 分支顺序：

```txt
requestType === "move"
  -> 如果 choices.current.move 存在，显示 target picker
  -> 否则显示当前 choices.index() 对应 active 的技能 + 换人入口
  -> 双打/合作不是展示所有 active 的技能，而是按 builder 当前 index 逐个 active 选择

requestType === "switch"
  -> 显示强制换人/换人菜单
  -> forceSwitch 数组长度决定本地需要处理几个 slot
  -> false slot 或不能操作 slot 由 fillPasses() 自动 pass

requestType === "team"
  -> Showdown 原版显示队伍预览
  -> 我们项目训练场阶段可以由 service 自动处理初始队伍预览
  -> 但类型和 builder 仍需保留 team request，不能把 team request 从架构里删除

requestType === "wait"
  -> 不允许操作
```

V4 注意：

- 训练场阶段可以不显示 Showdown 的 team preview UI，但 requestType team 必须在 command runtime 里被识别和记录，避免后续正式流程冲突。
- 技能区、目标区、换人区的视觉按 `ui-refences` 和 V1，不按 Showdown 原版按钮样式。
- Showdown 的 `panel-battle.tsx` 属于 client 页面体系，受 AGPL 影响，不直接搬入 V4。

双打/合作需要重点参考的原版细节：

- `renderPlayerControls()` 使用 `choices.index()` 找当前要操作的 Pokemon。
- `renderMoveMenu()` 使用 `choices.currentMoveRequest()`，所以一次只展示当前 active 的技能。
- `renderMoveControls()` 中有 `activeIndex = battle.mySide.n > 1 ? pokemonIndex + battle.pokemonControlled : pokemonIndex`，这是 multi/多 active 时把 request index 映射到场上 active slot 的关键。
- `renderMoveTargetControls()` 通过 `+slot` 表示远端目标，通过 `-slot` 表示己方/近端目标。
- `renderSwitchMenu()` 会展示 `request.ally?.pokemon`，但 ally pokemon 的按钮是 disabled，并且命令是 `/switch notMine`，也就是只读展示，不能替队友选择。

### battle-choices.ts

路径：

```txt
pokemonShowdownAbout/pokemonShowdownClient/play.pokemonshowdown.com/src/battle-choices.ts
```

用途：

- Showdown client 的 request -> choice string 构建器。
- 这是玩家命令流的核心。
- 文件本身是 battle 相关模块，可作为后续实现选择逻辑的重要参考。

重点参考：

```txt
BattleChoiceBuilder
BattleChoiceBuilder.fixRequest()
BattleChoiceBuilder.addChoice()
BattleChoiceBuilder.fillPasses()
BattleChoiceBuilder.parseChoice()
BattleChoiceBuilder.stringChoice()
```

参考位置：

- `BattleChoiceBuilder`：约 133 行。
- `toString()`：约 164 行。
- `isDone()`：约 170 行。
- `requestLength()`：约 184 行。
- `currentMoveRequest()`：约 199 行。
- `addChoice(choiceString)`：约 214 行。
- `fillPasses()`：约 294 行。
- `parseChoice(choice)`：约 339 行。
- `stringChoice(choice)`：约 525 行。
- `fixRequest(request, battle)`：约 560 行。

模仿思路：

```txt
按钮只产生 partial command:
  move 1
  move 2
  switch 3

builder 决定:
  是否需要目标
  是否完成当前 active
  是否自动 pass
  最终 choice string 是什么
```

V4 第一里程碑可以先让单打闭环走最小版：

- `move N` 直接提交。
- 主动换人 `switch N` 直接提交。
- 强制换人 `switch N` 直接提交。
- 如果后续 request 明确 `targetable`，再追加 Showdown 风格目标：

```txt
move 1 +1  # 打对面第 1 个 active
move 1 -1  # 打己方第 1 个 active
```

但从架构上，双打/合作必须按 `BattleChoiceBuilder` 设计：

- `choices.current` partial move。
- 第一个 active 选完不提交，切到第二个 active。
- `fillPasses()` 自动跳过不能操作的 slot。
- `alreadySwitchingIn` 防止重复换同一只。
- `isDone()` 后统一提交完整 choice。
- `requestLength()` 由 requestType 决定：
  - move: `request.active.length`
  - switch: `request.forceSwitch.length`
  - team: `request.chosenTeamSize`
  - wait: `0`
- multi/合作只处理当前玩家 request 中的 active；ally 只读，不把 ally 的选择合并到本地 choice。

重要提醒：

普通单打里，Showdown 原版通常不弹真正 target picker。原因在 `fixRequest()`：

```txt
request.targetable ||= battle.mySide.active.length > 1
```

普通 singles 的 active length 是 1，所以普通 `move 1` 直接完成。

因此 V4 如果为了体验做“选技能后选目标/确认目标”：

- UI 可以显示目标确认面板。
- 普通单打提交仍应是 `move N`。
- 不要无条件提交 `move N +1`。
- 只有 request 明确 `targetable` 时，才按 Showdown targetLoc 提交。

### panel-chat.tsx

路径：

```txt
pokemonShowdownAbout/pokemonShowdownClient/play.pokemonshowdown.com/src/panel-chat.tsx
```

用途：

- 房间命令解析器。
- `/move`、`/switch`、`/team`、`/choose` 最终在这里接到 `BattleChoiceBuilder`。

重点参考：

```txt
'cancel,undo'()
'move,switch,team,pass,shift,choose'(target, cmd)
```

参考位置：

- `/cancel` / `/undo`：约 615 行。
- `/move` / `/switch` / `/team` / `/choose`：约 629 行。
- `room.choices.addChoice(target)`：约 637 行。
- `room.choices.isDone()` 后 `sendDirect('/choose ...')`：约 642 行。

原版逻辑：

```txt
用户点按钮 data-cmd="/move 1"
-> room.send("/move 1")
-> panel-chat 命令处理器
-> target = "move 1"
-> room.choices.addChoice("move 1")
-> 如果 choices.isDone()
   -> sendDirect("/choose " + choices.toString())
-> update UI
```

模仿思路：

V4 不需要实现 `/move` 字符串命令系统，但事件语义应一致：

```ts
onMoveClick(moveIndex) {
  const partial = `move ${moveIndex}`;
  addChoiceLikeShowdown(partial);
}

onSwitchConfirm(slotIndex) {
  const partial = `switch ${slotIndex}`;
  addChoiceLikeShowdown(partial);
}
```

第一里程碑可以先简化单打：

```txt
技能点击
-> 如果需要 V4 目标确认 UI，进入 target-selecting
-> 确认目标
-> submitChoice("move N")

换人确认
-> submitChoice("switch N")
```

双打和合作必须回到 Showdown 语义：

```txt
addChoice("move N")
-> 如果未 done，继续让下一个 active 操作
-> done 后 submitChoice(builder.toString())
```

### panels.tsx

路径：

```txt
pokemonShowdownAbout/pokemonShowdownClient/play.pokemonshowdown.com/src/panels.tsx
```

用途：

- 全局捕获 `data-cmd` 按钮点击。
- 找到当前 room。
- 调用 `room.send(cmd, elem)`。

重点参考：

- `window.addEventListener('click', ...)`：约 470 行以后。
- `elem.getAttribute('data-cmd')`：约 524 行。

模仿思路：

V4 是 React，不需要 data-cmd 系统。

但是交互边界要一致：

```txt
UI button
-> local command handler
-> command runtime / choice builder
-> submitChoice
```

不能让按钮直接随意改战斗事实状态。

### client-connection.ts / client-main.ts

路径：

```txt
pokemonShowdownAbout/pokemonShowdownClient/play.pokemonshowdown.com/src/client-connection.ts
pokemonShowdownAbout/pokemonShowdownClient/play.pokemonshowdown.com/src/client-main.ts
```

用途：

- WebSocket 收消息。
- 按 room 分发。
- 每一行先做基础 parse。

重点参考：

- `client-connection.ts`：`PS.receive(data)`，约 99 行、154 行。
- `client-main.ts`：`PS.receive(msg)`，约 2162 行。
- `BattleTextParser.parseLine(line)`，约 2175 行。
- `room.receiveLine(args)`，约 2229 行、2255 行附近。

模仿思路：

V4 目前通过 battle service HTTP / snapshot / record 获取 Showdown 输出，不需要 WebSocket 房间系统。

但是消息边界应相同：

```txt
raw line
-> parse as request or protocol line
-> request 更新 command state
-> protocol line 进入 runtime/record
```

V4 不应该让 UI 自己解析一堆 raw protocol。

### battle.ts

路径：

```txt
pokemonShowdownAbout/pokemonShowdownClient/play.pokemonshowdown.com/src/battle.ts
```

用途：

- Showdown client 的 battle playback/runtime 核心。
- 维护 Battle / Side / Pokemon。
- 解析 protocol line。
- 调用 BattleScene。
- 调用 BattleLog。

文件头说明非常关键：

```txt
Battle
  Side
    Pokemon
  BattleScene
    BattleLog
      BattleTextParser
```

重点参考：

- 文件头架构说明：约 1 行。
- `Battle` class：约 1065 行。
- `animateMove()`：约 1630 行。
- `runMinor()`：约 1726 行。
- `add(command)`：约 3461 行。
- `instantAdd(command)`：约 3477 行。
- `runMajor(args, kwArgs)`：约 3482 行。
- `run(str)`：约 3868 行。
- `nextStep()`：约 3996 行。

协议播放原版逻辑：

```txt
Battle.add(raw line)
-> stepQueue.push(line)
-> nextStep()
-> scene.startAnimations()
-> run(line)
-> parseBattleLine()
-> runMajor 或 runMinor
-> scene.finishAnimations()
-> animations.done(nextStep)
```

重要 major event：

```txt
|gametype|singles/doubles/multi
  -> 设置 active 数量和 p1/p2/p3/p4 关系

|switch|...
  -> getSwitchedPokemon()
  -> side.switchOut()
  -> side.switchIn()
  -> scene.updateWeather()
  -> log()

|move|...
  -> getPokemon(user)
  -> getPokemon(target)
  -> scene.beforeMove()
  -> useMove()
  -> animateMove()
  -> scene.afterMove()
  -> log()

|-damage| / |-heal| / |-status|
  -> runMinor()
  -> 更新 Pokemon 状态
  -> result animation / statbar / log
```

模仿思路：

V4 后续做文字和动画时，不能从 snapshot 猜“发生了什么”。应优先消费 Showdown raw protocol：

```txt
raw protocol line 是事实变化源
snapshot 适合校验/投影当前状态
animation queue 应由 protocol event 生成
```

单打闭环阶段只需要理解，不急着完整移植 `Battle`。

### battle-animations.ts

路径：

```txt
pokemonShowdownAbout/pokemonShowdownClient/play.pokemonshowdown.com/src/battle-animations.ts
```

用途：

- DOM 场景。
- 宝可梦 sprite。
- 血条/状态条。
- messagebar。
- 招式、换人、倒下、天气等动画。

重点参考：

- `BattleScene`：约 43 行。
- constructor：约 100 行附近。
- `reset()`：约 140 行附近。
- `startAnimations()`：约 456 行。
- `finishAnimations()`：约 463 行。
- `message(message)`：约 478 行。
- `runMoveAnim()`：约 543 行。
- `teamPreview()`：约 849 行。
- `animSummon()`：约 1525 行。
- `animDragIn()`：约 1531 行。
- `animFaint()`：约 1555 行。
- `beforeMove()`：约 1564 行。
- `afterMove()`：约 1567 行。

模仿思路：

V4 不直接搬 jQuery DOM scene。

后续动画阶段应借鉴它的层次：

```txt
Battle event
-> scene method
-> sprite method
-> animation promise/checkpoint
-> next protocol line
```

V4 对应：

```txt
BattleProtocolRuntimeV4
-> BattleEventAdapterV4
-> AnimationQueueV4
-> React/CSS animation state
-> commit checkpoint
```

动画播放不能反过来创造 battle state。

### battle-animations-moves.ts

路径：

```txt
pokemonShowdownAbout/pokemonShowdownClient/play.pokemonshowdown.com/src/battle-animations-moves.ts
```

用途：

- 招式动画表。
- `BattleMoveAnims[moveid] = { anim(scene, [attacker, defender]) { ... } }`。

模仿思路：

后续可按 moveid 建 V4 动画映射：

```txt
moveid
-> V4 animation preset
-> fallback 到 tackle/simple hit
```

不要现在就把巨大动画表塞进 V4。单打闭环阶段只需要保留 moveid，为后续动画绑定留入口。

### battle-log.ts / battle-text-parser.ts

路径：

```txt
pokemonShowdownAbout/pokemonShowdownClient/play.pokemonshowdown.com/src/battle-log.ts
pokemonShowdownAbout/pokemonShowdownClient/play.pokemonshowdown.com/src/battle-text-parser.ts
```

用途：

- `battle-text-parser.ts` 把 raw protocol line 解析成 `args/kwArgs` 和自然语言文本。
- `battle-log.ts` 把解析结果写到 log，同时推给 BattleScene messagebar。

重点参考：

`battle-text-parser.ts`：

- `parseLine(line)`：约 36 行。
- `parseBattleLine(line)`：约 67 行。
- `parseArgs(args, kwArgs)`：约 464 行。
- `sectionBreak(args, kwArgs)`：约 445 行。
- `move` 文本：约 585 行。
- `switch` 文本：约 509 行。
- `faint` 文本：约 569 行。

`battle-log.ts`：

- `BattleLog`：约 33 行。
- `add(args, kwArgs)`：约 139 行。
- `message(message)`：约 981 行。
- `addSpacer()`：约 1013 行。

模仿思路：

V4 后续文字提示不要自己拼一堆中文/英文临时文本。

更稳的路线：

```txt
raw protocol
-> BattleTextParser.parseBattleLine()
-> parseArgs()
-> V4 battle message event
-> V4 message panel
```

如要中文化，可以后续基于 `args/kwArgs` 做 V4 i18n 模板，而不是先把协议事实丢掉。

## Showdown Client Full Flow

### 1. 收到 request

原版：

```txt
server sends:
|request|{"active":[...],"side":{...},"rqid":...}

panel-battle.receiveLine(args)
-> case "request"
-> receiveRequest(JSON.parse(args[1]))
-> BattleChoiceBuilder.fixRequest(request, room.battle)
-> room.battle.myPokemon = request.side.pokemon
-> room.battle.setViewpoint(request.side.id)
-> room.request = request
-> room.choices = new BattleChoiceBuilder(request)
-> renderPlayerControls(request)
```

V4 模仿：

```txt
Battle service 返回 snapshot.request
-> normalizeBattleRequestV4
-> BattleCommandStateV4
-> BattleV4Page 只读 command state
```

全模式通用规则：

- requestType move：显示当前 active index 的技能和可换人入口。
- requestType switch：显示当前 forceSwitch index 的换人面板。
- requestType wait：禁用操作。
- requestType team：训练场阶段可由 service 自动处理，但 command runtime 必须能识别。
- choices.index() 是当前要操作的本地 active，不是固定 0 号位。
- request.side.pokemon 是本地可选择队伍顺序和 choice index 来源。
- request.ally.pokemon 只读展示，不参与本地 choice。

### 2. 渲染技能

原版：

```txt
renderPlayerControls()
-> requestType === "move"
-> choices.current.move ?
   renderMoveTargetControls()
   :
   renderMoveMenu()

renderMoveMenu()
-> choices.currentMoveRequest()
-> renderMoveControls(active, choices)

renderMoveControls()
-> active.moves.map(...)
-> button data-cmd="/move N"
```

V4 模仿：

```txt
commandState.actions
-> Battle V4 技能卡片
-> 点击技能
-> 进入目标确认或直接 submit
```

视觉参考：

- `ui-refences/image-1.png`。
- `ui-refences/image-5.png`。
- V1 战斗页技能选择实现。

注意：

- 技能卡片样式必须按 V1/reference，不按 Showdown 的默认 HTML button。
- 技能按钮不能改动 battle fact，只能触发 choice draft/submit。

### 3. 选择目标

原版：

```txt
BattleChoiceBuilder.addChoice("move 1")
-> 如果 request.targetable 且 move target 需要目标
   -> choices.current = parsed move
   -> 不 push choices
   -> UI 进入 renderMoveTargetControls()

renderMoveTargetControls()
-> farSide.active -> /moveChoice +slot
-> nearSide.active -> /moveChoice -slot
```

V4 singles/doubles/multi 模仿：

分两种：

```txt
普通单打确认目标:
  用户点 move N
  -> 显示目标确认面板
  -> 用户点对面宝可梦
  -> submitChoice("move N")

Showdown targetable 请求:
  用户点 move N
  -> 显示目标选择面板
  -> 用户点目标
  -> submitChoice("move N +1" 或 "move N -1")

双打目标选择:
  用户点当前 active 的 move N
  -> 如果 move 需要目标，builder.current 暂存 move
  -> 显示 far active: +1 / +2
  -> 显示 near active: -1 / -2
  -> 选择目标后 addChoice("move N +2")
  -> 如果还有下一个 active，继续下一只；done 后提交完整 choice

合作/multi 目标选择:
  本地只处理 request 中属于当前玩家的 active
  ally active 可作为 near-side target 显示，但不是可替 ally 出招
  p3/p4 的选择由各自 request/玩家处理
```

视觉参考：

- `ui-refences/image-2.png`。
- V1 攻击对象选择面板。

实现红线：

- 不要普通单打无条件发 `+1`。
- 不要从 UI 猜 Showdown targetLoc。
- 如果 request 没有 targetable，目标面板只是确认 UI。

### 4. 主动换人

原版：

```txt
requestType === "move"
-> renderSwitchMenu(request, choices)
-> request.side.pokemon.map(...)
-> /switch N
```

禁用规则参考：

```txt
trapped
i < numActive
alreadySwitchingIn.includes(i + 1)
serverPokemon.fainted
```

V4 单打模仿：

```txt
mode === "singles"
requestType === "move"
-> 显示换人入口
-> 打开 V4/V1 风格换人面板
-> 确认后 submitChoice("switch N")
```

视觉参考：

- `ui-refences/image-4.png`。
- V1 `BattleV2SwitchSelector`。

实现红线：

- 当前出战不可选。
- 濒死不可选。
- trapped 时主动换人不可选。
- 强制换人时不能返回。
- 对手队伍只读展示。

### 5. 强制换人

原版：

```txt
request.forceSwitch
-> fixRequest() 设置 requestType = "switch"
-> renderPlayerControls()
-> case "switch"
-> renderSwitchMenu(request, choices, true)
```

V4 模仿：

```txt
requestType === "switch"
-> 自动打开换人面板
-> 隐藏/禁用返回
-> 合法目标 submitChoice("switch N")
```

双打/合作约束：

```txt
forceSwitch = [true, true]
  -> 需要为两个 active 逐个选择 switch
  -> 不能重复选择同一只后备
  -> done 后提交 "switch N, switch M"

forceSwitch = [true, false]
  -> 第二个 slot 自动 pass
  -> 最终类似 "switch N, pass"

multi / 合作
  -> 只处理本地 request.forceSwitch 中要求的 slot
  -> ally 队伍只读，不出现可替 ally 操作的确认按钮
```

### 6. 选择完成和提交

原版：

```txt
room.choices.addChoice(target)
if room.choices.isDone():
  room.sendDirect("/choose " + room.choices.toString())
```

V4 singles：

```txt
submitChoice(sessionId, "p1", "move N")
submitChoice(sessionId, "p1", "switch N")
```

V4 doubles / multi：

```txt
builder.addChoice("move N")
if builder.isDone():
  submitChoice(builder.toString())
else:
  继续显示下一个 active 的操作
```

## Protocol Playback Flow

### 1. 非 request 协议进入 Battle.add

原版：

```txt
panel-battle.receiveLine(args)
-> default:
   room.battle.add("|" + args.join("|"))
```

V4 模仿：

```txt
battle service record / raw lines
-> BattleProtocolRuntimeV4.applyLine(rawLine)
-> update protocol state
-> produce events
```

### 2. runMajor / runMinor

原版：

```txt
Battle.run(str)
-> BattleTextParser.parseBattleLine(str)
-> args[0].startsWith("-") ? runMinor : runMajor
```

V4 模仿：

```txt
parse raw line
-> major event: switch/move/faint/turn/win/gametype
-> minor event: damage/heal/status/boost/start/end
```

实现约束：

- 第一里程碑不必完整做动画 runtime。
- 但记录窗口和状态投影应保留 raw line，方便下一阶段接文本/动画。

### 3. switch protocol

原版：

```txt
|switch|p1a: Pikachu|Pikachu, L50|100/100
-> getSwitchedPokemon()
-> poke.healthParse()
-> side.switchOut()
-> side.switchIn()
-> scene.updateWeather()
-> log()
```

V4 后续模仿：

```txt
raw switch line
-> active slot changes
-> old active switch-out animation
-> new active switch-in animation
-> HP/status commit
-> message event
```

### 4. move protocol

原版：

```txt
|move|p1a: Pikachu|Thunderbolt|p2a: Squirtle
-> scene.beforeMove(poke)
-> useMove(poke, move, target)
-> animateMove(poke, move, target)
-> scene.afterMove(poke)
-> log(args)
```

V4 后续模仿：

```txt
raw move line
-> message: 使用了技能
-> attacker motion
-> move effect preset by moveid
-> target hit feedback
-> minor damage/heal/status lines continue播放
```

### 5. 文本提示

原版：

```txt
Battle.log(args, kwArgs)
-> BattleLog.add(args, kwArgs)
-> BattleTextParser.parseArgs(args, kwArgs)
-> BattleLog.message()
-> BattleScene.message()
```

V4 后续模仿：

```txt
raw line
-> BattleTextParserV4 / adapter
-> BattleMessageEvent
-> 参考图中的文字提示区域
```

## V4 Implementation Strategy

### Shared Command Core

V4 的实现顺序可以先验收单打，但核心实现必须是三模式共享 command runtime。单打、双打、合作都是独立模式；共享的是 Showdown request/choice 的抽象，不是说某个模式附属于另一个模式。

双打和合作要作为架构压力测试，因为它们会暴露 active slot、目标选择、逐 active 暂存、重复换人、强制换人数组、ally 只读展示等问题。单打不能被写成特殊捷径，否则后面一定会和双打/合作冲突。

核心状态不应叫 `SinglesCommandMode`，而应是通用 draft：

```ts
type BattleCommandDraftV4 = {
  requestType: "move" | "switch" | "team" | "wait";
  requestLength: number;
  activeIndex: number;
  choices: string[];
  currentMove?: {
    moveIndex: number;
    choice: string;
    requiresTarget: boolean;
  };
  alreadySwitchingIn: number[];
  isDone: boolean;
};
```

UI 可以根据模式不同展示不同布局和文案，但底层操作必须都是：

```txt
click move
-> addChoiceLikeShowdown("move N")
-> 如果需要 target，进入 target picker
-> 如果 not done，activeIndex + 1
-> 如果 done，submit builder.toString()

click switch
-> addChoiceLikeShowdown("switch N")
-> 如果 not done，activeIndex + 1
-> 如果 done，submit builder.toString()
```

### Milestone 1: Singles Manual Closure

第一里程碑手动验收单打：

```txt
训练场 -> 中转页 -> 战斗页
singles:
  技能选择
  可选目标确认
  主动换人
  强制换人
  回合推进
```

但实现时使用 shared command draft：

```txt
singles move:
  requestLength = 1
  activeIndex = 0
  addChoice("move N")
  done
  submit "move N"

singles switch:
  requestLength = 1
  activeIndex = 0
  addChoice("switch N")
  done
  submit "switch N"
```

第一里程碑暂不做完整技能动画和战斗文字播放，但必须保留 raw protocol，为下一阶段文本/动画做事实源。

### Milestone 2: Doubles Command Closure

双打命令闭环是 V4 核心验收，不是可选增强：

```txt
doubles move:
  request.active.length = 2
  activeIndex = 0
  第一只选择 move/switch 后不提交
  activeIndex = 1
  第二只选择 move/switch 后 submit "move A, move B"

doubles target:
  far targets: +1 / +2
  near targets: -1 / -2
  adjacent 规则按 Showdown renderMoveTargetControls()

doubles force switch:
  forceSwitch = [true, true] -> 两次 switch，不可重复目标
  forceSwitch = [true, false] -> 第二位 pass
```

UI 不能平铺两个 active 的所有技能让用户乱点。正确方式是：

```txt
当前要操作谁
-> 显示这只的技能/换人
-> 显示已选择摘要
-> 自动切到下一只
```

### Milestone 3: Multi / 合作 Command Closure

合作/multi 不是“双打加队友按钮”，而是四个 player id 和 ally 只读关系：

```txt
p1 ally = p3
p2 ally = p4
p1/p3 共用 near side 视觉队列，但 request 不是合并提交
本地玩家只对自己的 request 负责
request.ally.pokemon 用于展示，不用于选择
```

V4 的合作处理规则：

```txt
本地是 p1:
  只提交 p1 request 需要的 choice
  p3 active/队伍只读展示

本地是 p3:
  只提交 p3 request 需要的 choice
  p1 active/队伍只读展示

target picker:
  ally active 可以作为 near-side target
  但不能替 ally 选择 move/switch
```

这要求 view model 从一开始就区分：

```txt
local player
ally player
far opponents
controllable active slots
readonly active slots
```

### Skill Flow

通用流程：

```txt
requestType move
-> 根据 draft.activeIndex 找 currentMoveRequest()
-> 显示当前 active 的技能按钮
-> 点击 move N
-> 普通 singles 可直接 done，也可进 V4 目标确认 UI
-> targetable move 进入 target picker
-> 选目标后 addChoice("move N +slot/-slot")
-> done 后 submit
```

普通 singles 目标确认：

```txt
用户点 move N
-> 展示 image-2/V1 风格目标面板
-> 用户点对面宝可梦
-> submitChoice("move N")
```

Showdown targetable：

```txt
用户点 move N
-> builder.current = move N
-> 用户点目标
-> submit/addChoice("move N +1")
```

### Switch Flow

通用流程：

```txt
requestType move
-> 可主动打开 switch panel
-> 选择后备
-> addChoice("switch N")
-> done 后 submit，未 done 切到下一 active

requestType switch
-> 自动打开 switch panel
-> cannot cancel
-> addChoice("switch N")
-> done 后 submit，未 done 切到下一 force-switch slot
```

choiceIndex 来源：

```txt
request.side.pokemon 的一基序号
```

详情展示来源：

```txt
snapshot.players[localPlayer].draft.localTeam.pokemon
```

匹配规则：

```txt
ident / details / name / speciesId 最佳匹配
```

禁用规则：

```txt
当前出战 slot 不可选
倒下不可选
trapped 主动换人不可选
alreadySwitchingIn 不可重复选择
ally 队伍只读不可选
```

### UI 还原边界

必须参考：

- `ui-refences/参考ui.md`
- `ui-refences/image-1.png`
- `ui-refences/image-2.png`
- `ui-refences/image-3.png`
- `ui-refences/image-4.png`
- V1 战斗页源码。

实现顺序建议：

```txt
1. 640 x 320 主战斗舞台比例固定
2. 背景、双方立绘位置按 V1/reference
3. 上下/左右 HP 信息卡按 V1/reference
4. 右侧命令按钮按 V1/reference
5. 技能区按 image-1/image-5
6. 目标选择按 image-2
7. 换人面板按 image-4
8. 记录/调试窗口限制在战斗页内部，不覆盖全窗口
```

## What To Copy, What Not To Copy

### 可以参考/局部移植

```txt
battle-choices.ts
battle-text-parser.ts
battle.ts 的协议处理思路
battle-animations.ts 的 scene/animation sequencing 思路
battle-animations-moves.ts 的 moveid -> animation preset 思路
```

### 只参考，不复制页面

```txt
panel-battle.tsx
panel-chat.tsx
panels.tsx
client-main.ts
client-connection.ts
```

原因：

- 这些属于 Showdown client 页面/房间/网络体系。
- 依赖官方 `PS` 全局、Preact、room、chat command、jQuery 等。
- UI 风格不是我们参考图/V1 风格。
- `panel-battle.tsx` 是页面代码，不能作为 V4 页面直接复制。

### V4 自己保留

```txt
Battle service HTTP API
Battle V4 React 页面
V1/reference UI 视觉
本地立绘资源
训练场入口
record/debug 面板
```

## Acceptance Checklist For Next Work

单打技能：

- 技能按钮只在 requestType move 时可用。
- wait/busy/end 不可点。
- 点击技能后如果走目标确认，确认前不提交。
- 普通单打确认目标后提交 `move N`。
- 明确 targetable 时才提交 `move N +1/-1`。
- 提交后记录窗口能看到 choice。
- Showdown 正常推进下一回合。

单打换人：

- 主动换人入口只在 singles + move request 出现。
- 强制换人自动打开。
- 当前出战不可选。
- 倒下不可选。
- trapped 主动换人不可选。
- 合法后备确认后提交 `switch N`。
- 记录窗口能看到 choice。
- Showdown 正常切换场上宝可梦。

UI：

- 战斗舞台保持 640 x 320。
- 记录/调试窗口在舞台内部，不全屏覆盖。
- 右侧按钮不出屏。
- 小图标使用正确 sprite sheet offset 或本地图标，不显示整张图。
- 敌方信息卡、己方信息卡、换人卡片对齐 V1/reference。
- 不恢复项目不需要的初始队伍预览 UI。

后续动画/文字：

- 不从 snapshot 猜动画。
- 保留 raw protocol。
- 以 protocol line 作为动画和文字事实源。
- 优先参考 `BattleTextParser` 和 `Battle.runMajor/runMinor`。

## Implementation Checklist

这一节是后续实现 Battle V4 的施工顺序。后续编码按 Phase 从上往下推进；每个 Phase 都要先完成“产物”和“验收”，再进入下一阶段。不要跳过 Phase 0/1 直接改 UI，否则会再次出现单打能走、双打/合作身份关系崩掉的问题。

### Phase 0: 文档和事实源冻结

目标：

```txt
把后续所有实现的模式定义、身份映射、choice 提交规则固定下来。
```

产物：

- 本文档成为后续实现的执行清单。
- 三模式定义固定：
  - singles：3v3，每方 1 个玩家，每方同时上 1 只。
  - doubles：4v4，每方 1 个玩家，每方同时上 2 只。
  - coop / multi：4v4，每方 2 个玩家，每个玩家同时上 1 只。
- 明确单打、双打、合作是并列模式，不写“单打是双打退化”。
- 明确双打/合作是架构压力测试，单打只是第一手动验收入口。

必须补充并遵守的规则：

- `localTeam.pokemon[index]` 是本地队伍事实源。
- `showdownTeam[index]` 必须能回连到同一个 `localTeam.pokemon[index]`。
- `request.side.pokemon[index]` 是 Showdown 当前 request 的队伍顺序，同时决定 `switch ${index + 1}` 和 `team ${index + 1}`。
- UI 展示详情、立绘、小图标、球种必须通过统一 mapping，不允许各组件各自用名字猜。
- 合作里 p1 不能替 p3 选择，p3 也不能替 p1 选择；ally 只读展示。

验收：

- 能回答：`request.side.pokemon[3]` 对应 localTeam 哪只、用哪个球、提交 `switch 4`。
- 能回答：同队两只相同 species 或相同 nickname 时，如何区分它们。
- 能回答：合作里 p1 能不能替 p3 选择，答案必须是不能。

### Phase 1: Team Identity Mapping

目标：

```txt
建立 localTeam -> showdownTeam -> request.side.pokemon -> UI 的稳定身份链。
```

V1 已有方案，V4 直接迁移，不重新发明：

```txt
SHOWDOWN_ID_POOL
-> 每局/每个 RunGame 分配唯一 showdownIdentityToken
-> 写入 BattlePokemon.showdownId
-> 同时写入 Showdown set 的 pokeball
-> request.side.pokemon[].pokeball / battle local mapping 可回读
```

V1 参考位置：

- `changeBattle/packages/game-runtime/src/game-run-v3-debug.ts`
  - `showdownIdForBattlePokemon()`
  - `battleLocalTeamForPlayer()`
  - 核心行为：`copy.showdownId = showdownId; copy.pokeball = showdownId`
- `changeBattle/packages/game-runtime/src/rest-flow.ts`
  - `normalizeRunShowdownIdPool()`
  - `takeRunShowdownId()`
  - `takeReplacementRunShowdownId()`
  - `writePokemonShowdownId()`
- `changeBattleV2/plan/battle-v4/architecture/battle-v4-architecture-plan.md`
  - `Pokeball / Showdown ID Mapping`
  - V4 文档中称为 `showdownIdentityToken`

新增/规范类型：

```ts
type LocalPokemonIdentityV4 = {
  localPokemonId: string;
  showdownIdentityToken: string;
  showdownId: string; // alias of showdownIdentityToken inside battle-facing models
  pokeball: string;   // must equal showdownIdentityToken when used as Showdown metadata carrier
};

type ShowdownTeamPokemonMappingV4 = {
  playerId: ShowdownPlayerIdV4;
  teamIndex: number;
  choiceIndex: number;
  localPokemonId: string;
  showdownIdentityToken: string;
  showdownId: string;
  pokeball: string;
  speciesId: string;
  displayName: string;
};
```

固定生成规则：

- `teamIndex = localTeam.pokemon` 的 0-based index。
- `choiceIndex = teamIndex + 1`。
- `showdownIdentityToken` 从 V1 的 `SHOWDOWN_ID_POOL` 队列分配，不使用 `${playerId}-${localPokemonId}` 临时拼接。
- `showdownId = showdownIdentityToken`。
- `pokeball = showdownIdentityToken`，用于写入 Showdown team 的 pokeball 字段承载身份。
- `displayName = nickname || name || nameZh || speciesId`。
- 如果将来需要真实球种展示，另设字段，不允许覆盖作为身份载体的 `pokeball`。

实现步骤：

- [x] 从 V1 迁移 `SHOWDOWN_ID_POOL` 和 pool 分配/回收规则。
- [x] 为每个 RunGameV4 / BattleSessionV4 初始化 `showdownIdPool`，包含 `used` 和 `available`。
- [x] 扩展训练队伍 normalize/create 流程，保证进入 battle 编译前每只 LocalPokemon 都能获得 `showdownIdentityToken`。
- [x] `showdownIdentityToken` 分配后写入 battle-facing pokemon 的 `showdownId`。
- [x] `showdownIdentityToken` 分配后同时写入 Showdown set 的 `pokeball`。
- [ ] 替换/交换宝可梦时参考 V1 `takeReplacementRunShowdownId()`：释放旧 token，给新成员分配未占用 token。（当前替换功能未接入，后续做替换/捕获/队伍变更时实现）
- [x] 生成 battle input 时同步生成 `ShowdownTeamPokemonMappingV4[]`。
- [x] `compilePokemon` / `compilePokemonSet` 带上 `pokeball = showdownIdentityToken`；如果 Showdown team pack 不保留，则同时存入 session metadata。
- [x] snapshot / view model 投影时携带 mapping，供战斗页 UI 使用。
- [x] 新增统一 resolver：`resolveLocalPokemonFromRequestRow(row, mapping, localTeam, requestIndex)`。
- [x] resolver 优先级固定为：`row.pokeball/showdownIdentityToken` -> `showdownId` -> `teamIndex/choiceIndex` -> `ident/details/name/speciesId` 兜底。
- [x] 替换换人面板、信息卡、小图标、立绘、队伍栏里散落的 name/species/index 匹配。
- [x] request row 找不到 local pokemon 时仍允许展示 Showdown row；详情区显示“无法定位”，但不能改变 `choiceIndex`。

验收：

- [x] 同一队伍两只相同 species 可区分。
- [x] 同一队伍两只相同 nickname 可区分。
- [x] nickname 与 species name 不一致仍能匹配。
- [x] 换人后 active 变化不影响 localTeam 槽位映射。
- [x] `showdownId === pokeball === showdownIdentityToken` 在 battle-facing models 中成立。
- [x] request.side.pokemon[].pokeball 能回连到正确 localTeam 槽位。
- [x] 队伍栏、信息卡、换人卡片展示的是同一个 source map 结果。

### Phase 2: Request Normalization

目标：

```txt
把 Showdown request 归一化成三模式共享的 command 输入。
```

固定 requestType 规则：

- `forceSwitch` -> `requestType = "switch"`。
- `teamPreview` -> `requestType = "team"`。
- `wait` -> `requestType = "wait"`。
- 默认 -> `requestType = "move"`。

实现步骤：

- [x] 保留并投影 `rqid`。
- [x] 保留并投影 `noCancel`。
- [x] 保留并投影 `targetable`。
- [x] 保留并投影 `chosenTeamSize`。
- [x] 保留并投影 `ally`。
- [x] `request.side.pokemon` 作为 switch/team choice index 的唯一来源。
- [x] `request.ally.pokemon` 只进入 readonly display，不生成 switch choice。
- [x] wait request 下 `actions`、`switchActions`、`targetActions` 全部为空。
- [x] 记录窗口能同时看到 raw request 和 normalized request。

模式约束：

- singles：本地玩家通常控制 1 个 active。
- doubles：本地玩家通常控制 2 个 active。
- coop：本地玩家通常控制 1 个 active，ally active / team 只读。

验收：

- [x] singles requestLength 与 Showdown request 一致。
- [x] doubles requestLength 与 Showdown request 一致。
- [x] coop requestLength 只按本地 request 决定。
- [x] coop 下 ally 队伍展示但不生成可提交 action。

### Phase 3: BattleChoice Draft Core

目标：

```txt
实现 Showdown client 风格的 request -> draft -> final choice string。
```

新增共享 draft：

```ts
type BattleCommandDraftV4 = {
  playerId: ShowdownPlayerIdV4;
  mode: "singles" | "doubles" | "coop";
  requestType: "move" | "switch" | "team" | "wait";
  rqid?: number;
  requestLength: number;
  activeIndex: number;
  choices: string[];
  currentMove: null | {
    moveIndex: number;
    baseChoice: string;
    requiresTarget: boolean;
  };
  alreadySwitchingIn: number[];
  noCancel: boolean;
  isDone: boolean;
};
```

实现步骤：

- [x] 实现 `createBattleCommandDraftV4(request, mode, playerId)`。
- [x] 实现 `draft.index()` 返回当前本地需要操作的 active index。
- [x] 实现 `draft.requestLength()`：
  - move: `request.active.length`
  - switch: `request.forceSwitch.length`
  - team: `chosenTeamSize`
  - wait: `0`
- [x] 实现 `addChoice("move N")`。
- [x] 实现 `addChoice("move N +1/-1/+2/-2")`。
- [x] 实现 `addChoice("switch N")`。
- [x] 实现 `addChoice("team N")`。
- [x] 实现 `parseChoice()` 和 `stringChoice()`，输出 Showdown 兼容 choice string。
- [x] 实现 `fillPasses()`：
  - 空 active 自动 pass。
  - forceSwitch false slot 自动 pass。
  - 已不能操作 slot 自动 pass。
- [x] 实现 `alreadySwitchingIn`，防止双打/强制换人重复换同一后备。
- [x] 实现 `isDone()`，只有 done 后提交。
- [x] 实现 `toString()`，使用 `", "` join。
- [x] request/rqid 变化时自动重置 draft。
- [x] cancel/返回等价于新建 draft；已提交后的 undo 后续单独处理。

验收：

- [x] singles：`move 1` -> done -> `move 1`。
- [x] doubles：第一只 `move 1` -> not done；第二只 `move 2` -> done -> `move 1, move 2`。
- [x] doubles target：`move 1` 需要目标时进入 currentMove；`move 1 +2` 后完成当前 active。
- [x] forceSwitch `[true,false]` 自动包含 pass。
- [x] 重复 switch 同一只会被阻止。

### Phase 4: Command View Model

目标：

```txt
让 React UI 只读 command view model，不直接解析 request。
```

`BattleCommandStateV4` 需要包含：

- `requestType`
- `rqid`
- `activeIndex`
- `activePokemon`
- `choices`
- `isDone`
- `currentMove`
- `waitingForTarget`
- `readonlyAllies`
- `actions`
- `switchActions`
- `targetActions`

实现步骤：

- [x] move request 下 `actions` 只展示当前 active 的技能。
- [x] move request 下 `switchActions` 展示当前 active 可主动换人的候选。
- [x] switch request 下 `switchActions` 指向当前 force-switch slot 的候选。
- [x] target actions 根据当前 move target 生成：
  - singles 普通确认目标：只生成对面 active 确认项，提交仍是 `move N`。
  - targetable/doubles：生成 `+1/+2/-1/-2`。
  - coop：ally 可作为 target 显示，但 ally 不可被代操作。
- [x] view model 携带 resolver 后的展示信息：icon、sprite、pokeball、nameZh、status、hp。
- [x] view model 不硬编码 p1；local player 必须来自 session/playerId。

验收：

- [x] 双打不会同时显示两只宝可梦的技能。
- [x] 选择第一只后 UI 能知道下一只是谁。
- [x] coop 下 ally 信息只读且不会出现在 switchActions。

### Phase 5: Singles UI Closure

目标：

```txt
完成单打 3v3 手动闭环，但不写成单打专用底层。
```

实现步骤：

- [x] 技能按钮使用 V1/reference 样式，不使用 Showdown 原版按钮样式。
- [x] 点击技能后进入目标确认面板，参考 `image-2.png`。
- [x] 普通 singles 确认目标后提交 `move N`。
- [x] request 明确 targetable 时，确认目标后提交 `move N +1/-1`。
- [x] 主动换人入口只在 singles + move request + 非 wait/busy/end 显示。
- [x] 强制换人 request 自动打开换人面板，不能返回。
- [x] 换人确认提交 `switch N`，N 来自 request.side.pokemon 的 1-based choiceIndex。
- [x] 换人面板展示 localTeam 详情、pokeball、icon、HP、状态、禁用原因。
- [x] 记录窗口能看到每次最终提交 choice。

验收：

- [x] 单打技能推进 3 回合。
- [x] 单打主动换人成功。
- [x] 单打强制换人成功。
- [x] 当前出战/倒下/trapped 不可选。
- [x] UI 不出现初始队伍预览。

### Phase 6: Doubles UI Closure

目标：

```txt
完成双打 4v4 命令闭环，这是 V4 command runtime 的核心验收。
```

实现步骤：

- [x] 双打进入战斗页时固定显示每方 2 个 active slot。
- [x] move request 下先显示 `activeIndex = 0` 的宝可梦技能。
- [x] 第一只选择技能或换人后不提交，显示已选择摘要。
- [x] 自动切到 `activeIndex = 1`。
- [x] 第二只选择后提交完整 choice string。
- [x] 目标面板显示对面 `+1/+2` 和己方 `-1/-2`。
- [x] 根据 move target 禁用非法目标。
- [x] 双打主动换人不能选择当前出战、倒下、已被另一 active 选中的后备。
- [x] 双打强制换人支持两个 slot 逐个选择。
- [x] 记录窗口最终 choice 示例：`move 1 +1, move 2 -1` 或 `switch 3, move 1`。

验收：

- [x] 双打两只宝可梦可分别选择不同技能。
- [x] 双打可分别选择不同目标。
- [x] 双打可一只换人、一只攻击。
- [x] 双打 force switch 两个 slot 可分别换不同后备。
- [x] 不再出现永远停在 1 号位的问题。

### Phase 7: Coop / Multi UI Closure

目标：

```txt
完成合作 4v4 命令闭环，本地玩家只控制自己，ally 只读。
```

实现步骤：

- [x] coop 模式显示每方两个玩家 active：near local + near ally，far opponent + far opponent ally。
- [ ] 本地玩家身份由 session/playerId 决定，不能硬编码 p1。（联机/切换本地玩家视角后续功能再做）
- [x] p1 本地时，只处理 p1 request；p3 队伍/active 只读。
- [ ] p3 本地时，只处理 p3 request；p1 队伍/active 只读。（联机/切换本地玩家视角后续功能再做）
- [x] ally 队伍可以显示 pokeball、状态、icon，但没有确认交换按钮。
- [x] target picker 中 ally active 如果合法可作为目标。
- [x] 不把 p1 和 p3 的 choice 合并提交。
- [x] 记录窗口能区分本地 playerId 提交的 choice。

验收：

- [x] coop 下本地玩家只能控制自己的 1 只 active。
- [x] ally 不会出现在 switch 可选候选中。
- [x] ally 可以作为目标时能被选中。
- [x] p1/p3 seat、active、队伍栏展示正确。

### Phase 8: Raw Protocol Text Preparation

目标：

```txt
建立文字提示事实源，不从 snapshot 猜发生了什么。
```

实现步骤：

- [x] 保留每条 raw protocol line。
- [x] request line 不进 animation queue，只更新 command state。
- [x] 非 request line 进入 protocol runtime/record。
- [x] 接入 `BattleTextParser.parseBattleLine()` 或 V4 adapter。
- [x] 先生成 battle message events，不急着播放动画。
- [x] 文本事件包含 raw line、args、kwArgs、message、turn。
- [x] UI 文字提示区域按 reference/V1 样式展示。
- [x] debug 面板能切换 raw/protocol/message 三种视图。

验收：

- [x] 使用技能、换人、倒下、伤害、回复能产生文本事件。
- [x] 文本事件顺序与 raw protocol 顺序一致。
- [x] 不从 snapshot 差异猜文字。

### Phase 9: Animation Queue Preparation

目标：

```txt
建立动画队列模型，让后续技能动画按 protocol event 播放。
```

动画事件：

- `switchOut`
- `switchIn`
- `moveStart`
- `moveEffect`
- `hit`
- `damage`
- `heal`
- `status`
- `faint`

实现步骤：

- [x] protocol line 转 animation event，不由 UI 直接创建事实。
- [x] moveid 映射到 V4 animation preset。（当前为 Showdown-like 基础 preset，完整 move 表后续扩展）
- [x] 未实现 moveid fallback 到通用 hit。
- [x] 每个 animation event 有 checkpoint，播放完再 commit UI 状态。
- [x] 可配置跳过动画，直接 seek 到最新状态。

验收：

- [x] 换人、攻击、伤害、倒下有最小动画顺序。
- [x] 跳过动画后状态和记录一致。
- [x] 动画不会改变 protocol fact。

### Global Test Plan

- [x] `pnpm --dir changeBattleV2 typecheck` 通过。
- [x] `pnpm --dir changeBattleV2 test:identity-sync` 通过。
- [ ] 队伍映射单测：
  - 重复 species。
  - 重复 nickname。
  - 不同 pokeball。
  - 换人后仍回连正确 localPokemon。
- [ ] choice draft 单测：
  - singles move/switch。
  - doubles move + move。
  - doubles move + target。
  - doubles switch + move。
  - forceSwitch `[true,true]`、`[true,false]`。
  - coop ally readonly。
- [ ] view model 测试：
  - singles 只显示 1 个本地 active command。
  - doubles 当前 active 切换正确。
  - coop 本地与 ally 区分正确。
- [ ] 手动验收：
  - 单打 3v3 完成 3 回合。
  - 双打 4v4 完成 3 回合。
  - 合作 4v4 完成 3 回合。
  - 记录窗口 choice string 与 Showdown client 语义一致。

详细人工验收和 Debug 打印标准以 `Acceptance & Debug Checklist` 为准。

## Acceptance & Debug Checklist

这一章用于明确“怎样算做完”。后续每个 Phase 的实现都必须同时满足：

```txt
功能能走通
记录窗口能证明 choice/protocol 正确
console debug 能证明 mapping/request/draft/submit 正确
isDebug=false 时不打印调试日志
```

### Debug Control

目标：

```txt
开发阶段能尽量多打印，且由 App 顶层统一开关控制。
```

后续实现要新增顶层配置：

```ts
type AppDebugConfigV4 = {
  isDebug: boolean;
  battle: boolean;
  command: boolean;
  mapping: boolean;
  protocol: boolean;
  ui: boolean;
};
```

默认策略：

- [x] `App.tsx` 顶部定义 `const isDebug = true`，开发阶段默认打开。
- 当前阶段先用顶层常量控制，后续可迁移到 URL 参数、localStorage 或环境变量。
- [x] `isDebug` 通过 props 或 context 传给 `BattleV4Page` 和 API/debug helpers。
- [x] 所有 Battle V4 打印必须走统一 logger，不允许散落 `console.log`。
- UI 内“记录”按钮不依赖 `isDebug`，即使 `isDebug=false` 也能打开记录面板。

推荐 logger：

```ts
type BattleDebugScopeV4 =
  | "mapping"
  | "request"
  | "draft"
  | "choice"
  | "submit"
  | "snapshot"
  | "protocol"
  | "ui"
  | "error";

function battleDebugLog(
  isDebug: boolean,
  scope: BattleDebugScopeV4,
  label: string,
  payload?: unknown
): void {
  if (!isDebug) return;
  console.debug(`[BattleV4][${scope}] ${label}`, payload);
}
```

禁止：

- 直接散落 `console.log`。
- 只打印字符串不打印结构化 payload。
- `isDebug=false` 时继续打印 Battle V4 debug 日志。
- 打印完整超大 snapshot；大对象只打印 summary + record tail。

### Required Debug Logs

#### Team Mapping

每次创建 battle session 必须打印：

- [x] 已接入 `mapping/create-source-map` 结构化日志。

- `playerId`
- `teamIndex`
- `choiceIndex`
- `localPokemonId`
- `showdownIdentityToken`
- `showdownId`
- `pokeball`
- `speciesId`
- `displayName`

正确结果：

- 每只宝可梦都有 token。
- `showdownId === pokeball === showdownIdentityToken`。
- 同队 token 不重复。
- `request.side.pokemon` 能回连到 mapping。

示例：

```ts
battleDebugLog(isDebug, "mapping", "create-source-map", {
  playerId,
  teamIndex,
  choiceIndex,
  localPokemonId,
  showdownIdentityToken,
  showdownId,
  pokeball,
  speciesId,
  displayName,
});
```

#### Request Normalization

每次 request/rqid 变化必须打印：

- [x] 已接入 `request/normalize-summary` 结构化日志。

- raw request summary
- normalized requestType
- `rqid`
- `requestLength`
- `targetable`
- active length
- `forceSwitch`
- side.pokemon choiceIndex 列表
- ally 是否存在

正确结果：

- singles move requestLength 通常为 1。
- doubles move requestLength 通常为 2。
- coop 本地 requestLength 通常为 1。
- wait request 无 actions。
- ally 只进入 readonly display。

#### Draft / Choice

每次用户点击技能、目标、换人必须打印：

- before draft
- user action
- parsed partial choice
- after draft
- `isDone`
- final choice string
- 是否 submit

正确结果：

- singles `move 1` 直接 done 或经目标确认后 done。
- doubles 第一只选择后 not done。
- doubles 第二只选择后 done。
- forceSwitch false slot 自动 pass。
- 重复 switch 同一后备会被阻止并有 error 日志。

示例：

```ts
battleDebugLog(isDebug, "draft", "add-choice", {
  before,
  input: "move 1 +2",
  after,
  isDone,
  finalChoice,
});
```

#### Submit / Snapshot

每次提交必须打印：

- [x] 已接入 `submit/submit-choice` 和 `snapshot/after-submit` 结构化日志。

- `sessionId`
- `playerId`
- submitted choice
- response status
- new request/rqid
- new active slots
- record tail

正确结果：

- 提交 choice 和记录窗口一致。
- submit 后 request 更新或进入 wait。
- active slots 与 Showdown 返回一致。

示例：

```ts
battleDebugLog(isDebug, "submit", "submit-choice", {
  sessionId,
  playerId,
  choice,
});
```

#### UI Resolver

每次打开换人面板、目标面板、渲染信息卡时必须打印：

- [x] 已接入换人面板 `ui/resolve-switch-candidate` 结构化日志。

- request row
- requestIndex
- choiceIndex
- resolved localPokemonId
- resolved token
- resolved pokeball
- fallback reason

正确结果：

- 正常情况下不走 name/species fallback。
- 找不到 local pokemon 时明确显示“无法定位”。
- 不能因为无法定位改变 `switch N` 的 N。

### Manual Acceptance Scenarios

#### Scenario 0: Debug 开关验收

步骤：

1. 在 `App.tsx` 顶层设置 `isDebug = true`。
2. 进入训练场。
3. 开始任意单打战斗。
4. 打开浏览器/devtools console。
5. 点击技能、打开换人、提交选择。
6. 改成 `isDebug = false` 后刷新，再重复同样操作。

正确结果：

- `isDebug=true` 时 console 出现带 scope 的结构化日志。
- 日志包含 mapping、request、draft、submit、snapshot。
- `isDebug=false` 后不再打印 Battle V4 debug 日志。
- UI 内“记录”按钮仍可打开记录面板。

失败判定：

- `isDebug=false` 仍打印 Battle V4 debug。
- debug 日志没有 scope 或没有 payload。
- 记录面板被 debug 开关影响无法打开。

#### Scenario 1: Team Mapping 验收

准备：

- 单打队伍放两只相同 species。
- 至少一只使用 nickname。
- 每只通过 pool 分配不同 `showdownIdentityToken`。

步骤：

1. 进入战斗。
2. 打开记录面板。
3. 打开换人面板。
4. 查看 console mapping 日志。
5. 主动换第二只同 species 宝可梦。

正确结果：

- mapping 日志里两只同 species token 不同。
- `showdownId === pokeball === showdownIdentityToken`。
- 换人面板两张卡显示各自正确信息。
- 提交的是正确 `switch N`。
- 换上后场上信息卡对应的是被选择的那只，不被同 species 混淆。

失败判定：

- 两只同 species 显示同一个详情。
- 换人后变成另一只同名/同物种。
- pokeball/token 缺失或重复。

#### Scenario 2: Singles 技能闭环验收

准备：

- 训练场选择单打。
- p1 队伍 3 只，p2 队伍 3 只。
- 开启 `isDebug`。

步骤：

1. 进入战斗页。
2. 确认场上每方只有 1 只 active。
3. 点击“技能/战斗”。
4. 选择一个技能。
5. 如果出现目标确认，点击对方 active。
6. 等待 Showdown 推进。
7. 连续完成 3 回合。

正确结果：

- command 日志显示 requestType 为 move。
- draft 日志显示 requestLength 为 1。
- 普通 singles 提交 choice 为 `move N`，不是无条件 `move N +1`。
- 记录窗口能看到提交 choice。
- 回合数推进。
- 下一回合技能按钮重新可用。

失败判定：

- 普通单打提交了错误 targetLoc。
- 选技能后卡住不提交。
- 下一回合仍显示上一回合 draft。
- 技能按钮在 wait 状态仍可点击。

#### Scenario 3: Singles 主动换人验收

步骤：

1. 单打 move request 下点击换人入口。
2. 查看换人面板。
3. 尝试选择当前出战宝可梦。
4. 选择合法后备。
5. 点击确认交换。
6. 等待 Showdown 推进。

正确结果：

- 当前出战显示禁用原因“当前出战”。
- 倒下宝可梦显示“已经倒下”。
- trapped 时主动换人全部不可选，显示“无法逃脱”。
- 合法后备提交 `switch N`。
- N 与 request.side.pokemon 的 1-based index 一致。
- 换上后场上宝可梦、信息卡、token/mapping 一致。

#### Scenario 4: Singles 强制换人验收

触发方式：

- 让己方 active 倒下，或用 debug/脚本制造 forceSwitch request。

步骤：

1. 等到 requestType = switch。
2. 观察换人面板是否自动打开。
3. 尝试返回。
4. 选择合法后备并确认。

正确结果：

- 面板自动打开。
- 返回按钮隐藏或禁用。
- 只能选择合法后备。
- 提交 `switch N`。
- 新 active 出场后进入下一 request 或 wait。

#### Scenario 5: Doubles 技能闭环验收

准备：

- 训练场选择双打。
- p1/p2 各 4 只。
- 每方同时上 2 只。

步骤：

1. 进入双打战斗页。
2. 确认双方各显示 2 个 active slot。
3. 第一只选择技能 A。
4. 不应提交，UI 切到第二只。
5. 第二只选择技能 B。
6. 完整提交。
7. 连续完成 3 回合。

正确结果：

- 第一只选择后 draft `isDone = false`。
- UI 显示第一只已选择摘要。
- 第二只选择后 draft `isDone = true`。
- 提交字符串类似 `move 1, move 2`。
- 两只可以选择不同技能。
- 不再永远停在 1 号位。

失败判定：

- 第一只选择后立刻提交完整回合。
- 第二只无法操作。
- 两只技能混在一个面板里让用户乱点。
- 自动给第二只填默认 move。

#### Scenario 6: Doubles 目标选择验收

步骤：

1. 选择一个需要目标的技能。
2. 进入目标选择面板。
3. 查看对方两个 active 和己方两个 active。
4. 选择不同目标组合。
5. 提交回合。

正确结果：

- 对方目标显示为 `+1`、`+2`。
- 己方目标显示为 `-1`、`-2`。
- 非法 adjacent target 禁用。
- 最终 choice 示例：`move 1 +2, move 2 +1`。
- 记录窗口与 debug submit 日志一致。

#### Scenario 7: Doubles 换人验收

步骤：

1. 第一只选择换人到后备 3。
2. 第二只尝试也选择后备 3。
3. 第二只改选后备 4。
4. 提交。

正确结果：

- 第二只重复选择后备 3 被禁用或报错。
- 最终 choice 示例：`switch 3, switch 4` 或 `switch 3, move 1`。
- 两个 slot 不会换入同一只宝可梦。
- mapping 仍然正确。

#### Scenario 8: Doubles 强制换人验收

触发：

- 双打场上两只均倒下，或一只倒下一只未倒。

正确结果：

- `forceSwitch = [true, true]` 时要求选择两只不同后备。
- `forceSwitch = [true, false]` 时第二位自动 pass。
- debug draft 显示 pass 被 fillPasses 自动补上。
- 最终 choice 符合 Showdown 语义。

#### Scenario 9: Coop / Multi 本地控制验收

准备：

- 训练场选择合作。
- p1/p3 为 near side，p2/p4 为 far side。
- 每个玩家 1 只 active。

步骤：

1. 以 p1 本地身份进入战斗。
2. 查看 p3 active 和队伍。
3. 尝试给 p3 换人或选技能。
4. p1 选择技能/目标并提交。

正确结果：

- p3 active 可展示，但不可被 p1 操作。
- p3 队伍只读，不出现在 p1 switchActions。
- p1 choice 只提交给 p1。
- 不出现 `p1 + p3` 合并 choice。
- ally 如果是合法目标，可在 target picker 中作为目标显示。

失败判定：

- p1 能替 p3 选技能/换人。
- p1 提交字符串包含 p3 choice。
- ally 队伍进入可交换候选。

#### Scenario 10: Raw Protocol Text 验收

步骤：

1. 开启 debug。
2. 进行一次 move。
3. 进行一次 switch。
4. 造成一次 damage。
5. 造成一次 faint。

正确结果：

- raw protocol 记录完整。
- request line 只更新 command state，不进入 animation queue。
- move/switch/damage/faint 生成 message event。
- message 顺序与 raw protocol 顺序一致。
- 不从 snapshot diff 猜文本。

#### Scenario 11: Animation Queue 最小验收

步骤：

1. 执行一次换人。
2. 执行一次攻击造成伤害。
3. 执行一次倒下。
4. 使用跳过动画。

正确结果：

- 换人顺序为 switchOut -> switchIn。
- 攻击顺序为 moveStart -> moveEffect/hit -> damage。
- 倒下触发 faint。
- 跳过动画后状态与最新 protocol 一致。
- 动画事件不修改 battle fact，只消费 protocol event。
