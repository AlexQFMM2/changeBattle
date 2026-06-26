# Battle V4 Showdown Animation Adapter Plan

## Summary

本计划用于把 Pokemon Showdown client 的动画系统系统化接入 Battle V4。目标不是把原版 jQuery `BattleScene` 直接挂进 React 页面，而是实现一层 `ShowdownAnimationAdapterV4`：

```txt
raw battle protocol
-> BattleProtocolEventV4
-> selected animation key
-> ShowdownAnimationTimelineV4
-> V4 React/CSS playback
-> visibleBattleState checkpoint commit
```

核心原则：

```txt
protocol runtime 是事实源
request 只更新 command state，不进入动画队列
动画只消费 protocol event，不反推战斗事实
未接入的 move 必须走 Showdown-style fallback
已接入的动画必须能在 checklist 中逐 key 勾选追踪
```

配套清单见：

- `changeBattleV2/plan/battle-v4-showdown-animation-checklist.md`

## Source Map

固定参考源：

- `pokemonShowdownAbout/pokemonShowdownClient/play.pokemonshowdown.com/src/battle-animations.ts`
- `pokemonShowdownAbout/pokemonShowdownClient/play.pokemonshowdown.com/src/battle-animations-moves.ts`

资源路径：

- `changeBattleV2/apps/web/public/showdown/fx`
- `changeBattleV2/apps/web/public/showdown/sprites`

授权备注：

```txt
Showdown client as a whole: AGPLv3
battle-*.ts animation/replay engine: MIT
fx/ 大多数资源: CC0
fx/ 中 icicle.png / lightning.png / rocks.png / rock1.png / rock2.png 等存在额外授权说明
sprites/ 不属于上述 CC0 范围
```

后续复制或打包资源时，需要保留源路径、license 说明和差异清单。

## Adapter Core

### ShowdownAnimationTimelineV4

V4 的动画执行单位。它不直接保存 DOM 操作，而是保存可以被 React/CSS executor 执行和诊断导出的 timeline。

```ts
interface ShowdownAnimationTimelineV4 {
  id: string;
  animationKey: string;
  source: 'BattleMoveAnims' | 'BattleOtherAnims' | 'BattleStatusAnims' | 'fallback';
  protocolSequence: number;
  turn: number | null;
  actorSeat: string | null;
  targetSeats: string[];
  steps: ShowdownAnimationStepV4[];
  checkpoints: string[];
}
```

### ShowdownAnimationStepV4

Timeline step 负责描述单个动作：

```ts
type ShowdownAnimationStepV4 =
  | { type: 'showEffect'; effectId: string; from: ShowdownSpriteActorV4; to: ShowdownSpriteActorV4; durationMs: number; easing?: string; fade?: 'in' | 'out' | 'both' | 'none' }
  | { type: 'actorAnim'; actor: ShowdownSpriteActorV4; props: ShowdownActorAnimPropsV4; durationMs: number; easing?: string }
  | { type: 'delay'; actor?: ShowdownSpriteActorV4; durationMs: number }
  | { type: 'wait'; durationMs: number }
  | { type: 'backgroundEffect'; color: string; durationMs: number; opacity: number }
  | { type: 'resultAnim'; actor: ShowdownSpriteActorV4; text: string; tone: 'good' | 'bad' | 'neutral' }
  | { type: 'damageAnim'; actor: ShowdownSpriteActorV4; damage: number | null }
  | { type: 'healAnim'; actor: ShowdownSpriteActorV4; heal: number | null }
  | { type: 'checkpoint'; checkpointId: string };
```

### ShowdownSpriteActorV4

Pokemon actor 和 effect sprite 都使用同一套 Showdown-like 坐标模型。

```ts
interface ShowdownSpriteActorV4 {
  seat: string;
  ident: string;
  side: 'near' | 'far';
  slotIndex: number;
  x: number;
  y: number;
  z: number;
  scale: number;
  opacity: number;
  xscale: number;
  yscale: number;
}
```

### ShowdownEffectSpriteV4

```ts
interface ShowdownEffectSpriteV4 {
  effectId: string;
  assetPath: string;
  width?: number;
  height?: number;
  x: number;
  y: number;
  z: number;
  scale: number;
  opacity: number;
  blendMode?: 'normal' | 'screen' | 'multiply';
}
```

### Projection And Execution

必须提供两个核心函数：

```ts
function projectShowdownAnimationTimelineV4(
  animationKey: string,
  context: ShowdownAnimationContextV4
): ShowdownAnimationTimelineV4;

function executeShowdownAnimationTimelineV4(
  timeline: ShowdownAnimationTimelineV4,
  options: ShowdownAnimationExecutionOptionsV4
): Promise<ShowdownAnimationExecutionResultV4>;
```

`projectShowdownAnimationTimelineV4()` 负责把 Showdown 的动画 key 和当前 protocol context 翻译成 V4 timeline。`executeShowdownAnimationTimelineV4()` 只负责播放，不读取 request，不生成 choice，不修改 battle snapshot。

## Supported Showdown Instructions

第一版 adapter 必须支持以下 Showdown 指令形态：

- `scene.showEffect(effectId, from, to, easing, fade)`
- `pokemon.anim(props, easing)`
- `pokemon.delay(ms)`
- `scene.wait(ms)`
- `scene.backgroundEffect(color, duration, opacity)`
- `scene.resultAnim(pokemon, text, tone)`
- `scene.damageAnim(pokemon, damage)`
- `scene.healAnim(pokemon, heal)`

映射要求：

- `showEffect`：生成 effect sprite，按 from/to 插值移动或淡入淡出。
- `pokemon.anim`：只改变 actor 的 visual transform，不直接改真实 active identity。
- `pokemon.delay` / `scene.wait`：必须进入 timeline，不能被同步循环瞬间吞掉。
- `backgroundEffect`：用于天气、场地、Z 招式、强力招式背景闪烁。
- `resultAnim`：用于“效果拔群 / 收效甚微 / 没有效果 / miss / immune”等结果提示。
- `damageAnim` / `healAnim`：只展示扣血/回血结果，不展示完整 HP 字符串；HP bar tween 由 checkpoint commit 控制。

## Coordinate System

V4 定义一套 Showdown-like actor 坐标：

```txt
x/y/z/scale/opacity/xscale/yscale
```

约束：

- singles / doubles / coop 共用 seat 映射。
- `p1a/p1b/p3a/p3b` 归 near side，`p2a/p2b/p4a/p4b` 归 far side。
- actor 坐标只描述当前可见位置，不反向决定 protocol active。
- timeline 必须支持 `leftof(offset)` 和 `behind(offset)` 这类 Showdown 位置语义。
- doubles 中同侧两个 actor 的卡片、模型、动画目标必须绑定同一个 seat，不能左右反。
- coop 中本地可操作 seat 和 ally/enemy read-only seat 共用显示系统，但 command panel 仍只读本地 request。

## Runtime Flow

### Protocol Consumption

```txt
snapshot.rawLog delta
-> parseBattleProtocolLineV4(rawLine)
-> BattleProtocolEventV4
-> projectBattleMessageEventsV4(events)
-> projectBattleAnimationEventsV4(events)
-> projectShowdownAnimationTimelineV4(animationKey, context)
-> execute timeline
-> checkpoint commit visibleBattleState
```

`|request|` 和 player stream request 不进入动画队列，只更新 command view model。

### Visible State

`BattleArena` 应读 `visibleBattleState`，而不是直接瞬时读取最新 snapshot：

- `switch` checkpoint：旧 actor switchOut 后，再 commit 新 active binding。
- `formechange` / `transform` checkpoint：动画播放到形态变化点后，更新 species/details/sprite binding。
- `-damage` checkpoint：受击动画之后再 tween/commit HP。
- `-heal` checkpoint：回血动画之后再 tween/commit HP。
- `faint` checkpoint：倒下动画之后再标记 fainted。
- `request ready` checkpoint：当前 protocol queue drain 后，再展示 command panel。

这条顺序要模仿 Showdown client：先播放 battle protocol / animation queue，再根据当前 request 更新 controls / 选择面板。

## Animation Key Selection

选择顺序：

1. `move` protocol 优先使用 `moveid` 查 `BattleMoveAnims`。
2. `-status` / `cant` / `confused` 等使用 `BattleStatusAnims` 或 `BattleOtherAnims`。
3. `switch` / `drag` / `replace` / `faint` / `formechange` / `transform` 使用 V4 native protocol animation。
4. 未实现 move key 使用 Showdown-style fallback：

```txt
message
-> attacker wind-up
-> generic projectile/contact/special effect
-> defender hitmark/shake
-> damage/heal/status/result checkpoint
```

fallback 不允许走随机自造动画；它必须复用 `BattleOtherAnims` 的通用 key 和 Showdown 节奏。

## Implementation Order

1. Adapter Core
   - timeline 数据结构
   - executor 串行播放
   - checkpoint / diagnostics
   - skip animations drain

2. BattleOtherAnims 通用 fallback
   - `hitmark`
   - `attack`
   - `contactattack`
   - `fastattack`
   - `fastanimspecial`
   - `heal`
   - `shake`
   - `sound`

3. BattleStatusAnims 全量 10 项
   - `brn`
   - `psn`
   - `slp`
   - `par`
   - `frz`
   - `flinch`
   - `attracted`
   - `cursed`
   - `confused`
   - `confusedselfhit`

4. 当前测试高频 move
   - `eruption`
   - `weatherball`
   - `earthquake`
   - `bulldoze`
   - `gigaimpact`
   - `heavyslam`
   - `seismictoss`
   - `transform`
   - `protect`
   - `recover`
   - `rest`

5. 按类型族群接入 608 个 move key
   - 火 / 水 / 电 / 冰 / 草
   - 地面 / 岩石 / 钢 / 毒
   - 超能 / 恶 / 幽灵
   - 格斗 / 飞行 / 虫 / 龙 / 妖精 / 一般
   - 状态变化 / 场地天气空间 / 回复强化 / 保护替身
   - Z 招式 / 稀有专属招式

完整 key 追踪以 checklist 为唯一事实源。

## Diagnostics

每次导出诊断必须包含：

- `rawProtocol`
- `parsedProtocolEvents`
- `messageEvents`
- `animationEvents`
- `selectedAnimationKey`
- `animationTimeline`
- `timelineSteps`
- `consumedCheckpoints`
- `visibleStateBefore`
- `visibleStateAfter`
- `requestPanelRevealReason`

诊断要能回答这些问题：

- 某条 raw protocol 为什么选择这个 animation key？
- timeline 是否串行播放，还是被同步 drain？
- damage/heal/status/faint 是否在对应 checkpoint 后才 commit？
- request panel 是否等动画队列 drain 后才出现？
- 未实现 key 是否 fallback，fallback 用了哪个 `BattleOtherAnims` key？

## Test Plan

文档校验：

- checklist 中 `BattleMoveAnims` 项数必须等于 608。
- checklist 中 `BattleOtherAnims` 项数必须等于 45。
- checklist 中 `BattleStatusAnims` 项数必须等于 10。
- 动画 key checkbox 总数必须等于 663。
- 总 checkbox 数必须等于 663 加 Adapter Core 工程任务数。

实现后验收：

- 单打、双打、合作各跑 3 回合。
- 能看到 move animation、result animation、damage/heal animation、status animation、weather animation。
- diagnostics 能导出 raw protocol、selected animation key、timeline steps、consumed checkpoints。
- 未实现动画不会报错，必须 fallback 到 Showdown-style 通用动画。
- 已实现动画必须能在 checklist 中从 `[ ]` 改成 `[x]` 并附测试说明。

必跑命令：

```bash
pnpm --dir changeBattleV2 typecheck
pnpm --dir changeBattleV2 test:identity-sync
pnpm --dir changeBattleV2 --filter @changebattle-v2/showdown-battle-core test
pnpm --dir changeBattleV2 --filter @changebattle-v2/web typecheck
```

## Assumptions

- 动画资源继续使用 `apps/web/public/showdown/fx` 与 `apps/web/public/showdown/sprites`。
- 不直接挂载 Showdown 原版 jQuery `BattleScene`。
- `battle-animations.ts` / `battle-animations-moves.ts` 的动画逻辑可作为 MIT 参考来源。
- checklist 是后续接入进度的唯一事实源；实现一个动画就勾一个，不再靠口头记录。
- 完整覆盖所有 Showdown move animation 是长期目标；第一阶段先保证 adapter 架构、fallback、状态动画和当前测试高频招式。
