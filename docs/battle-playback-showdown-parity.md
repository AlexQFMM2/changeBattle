# Battle Playback Showdown Parity

Battle V4 的播放顺序以 Pokemon Showdown client 为权威参照。

“与 Showdown Client 一致”只能在本文件矩阵覆盖且测试通过时使用。只验证调度、choice、
roster 或某个单点事件，不能声称全链路一致。

运行时链路是：

```txt
BattleSessionSnapshotV4.rawLog
=> backend ShowdownPlaybackCompiler
=> ShowdownPlaybackTimelineV4.groups
=> frontend playback step scheduler
```

`request` 只用于指令 UI；动画、消息、伤害、道具、治疗、turn/upkeep 的播放顺序只看 `rawLog`。

## Runtime API

后端 battle service 暴露：

```txt
GET /sessions/:sessionId/playback-timeline?from=<previousRawIndex>
```

Desktop 侧通过 preload 暴露：

```ts
api.battleService.getPlaybackTimeline(sessionId, previousIndex)
```

返回：

```ts
type ShowdownPlaybackTimelineV4 = {
  sessionId?: string;
  rawFrom: number;
  rawTo: number;
  rawLogLength: number;
  groups: ShowdownPlaybackGroupV4[];
  debug: {calls: ShowdownPlaybackSceneCallV4[]};
  compilerVersion: string;
};
```

`groups` 按 Showdown client `finishAnimations` 边界切分。前端仍用本地 `executeBattleV4Protocol` 投影 HP、状态、slot 事实，但不再自己决定 step 分组。

## Compiler

正式编译器在：

```txt
packages/showdown-battle-core/src/playbackCompiler.ts
```

它使用 vendored Showdown client JS：

```txt
packages/showdown-battle-core/vendor/showdown-client/js
```

实现方式：

- Node `vm` 加载 Showdown client `Battle + BattleSceneStub`。
- patch scene stub 的 `runMoveAnim`、`runOtherAnim`、`resultAnim`、`damageAnim`、`healAnim`、`animSummon`、`incrementTurn`、`updateWeather`、`finishAnimations` 等方法。
- 以 `finishAnimations` 生成 `ShowdownPlaybackGroupV4[]`。
- 再把 scene call 按 raw protocol 语义回填 `rawIndices/rawLines`。
- Battle service 按 `sessionId + rawLog.length` 缓存全量编译结果，`previousIndex` 只过滤返回增量。

## CLI Check

先构建 core：

```bash
pnpm --filter @changebattle-v2/showdown-battle-core build
```

再用 diagnostics rawLog 编译 timeline：

```bash
node tools/probe-showdown-playback.mjs debug/battle-v4-diagnostics-xxx.json
```

这个 CLI 只是正式 compiler 的薄 wrapper，不维护第二套解析逻辑。

## Example

对这段 raw protocol：

```txt
|move|p1a: Raichu|Spark|p2a: Fearow
|-supereffective|p2a: Fearow
|-damage|p2a: Fearow|34/100
|-enditem|p2a: Fearow|Oran Berry|[eat]
|-heal|p2a: Fearow|44/100|[from] item: Oran Berry
|move|p2a: Fearow|Pursuit|p1a: Raichu
|-damage|p1a: Raichu|72/100
|upkeep
|turn|2
```

Showdown timeline group 顺序应是：

```txt
move spark
result Super-effective + damage Fearow
other consume
other heal + heal Fearow
move pursuit
damage Raichu
statbar/statbar/weatherUpdate
turn
```

所以不要把这些揉成：

```txt
move + supereffective + damage + enditem + heal
move + damage
```

## Debug

战斗页 diagnostics 需要重点看：

- `showdownPlaybackTimeline`: 后端 compiler 返回的 timeline。
- `playbackStepQueue`: 前端待消费 step。
- `activePlaybackStep`: 当前播放 step。
- `playbackStepConsumption`: 实际消费顺序。
- `playbackCompilerUnavailable`: 为 true 时说明正在使用前端 fallback parser。

判断问题时先看 Showdown timeline 是否正确；如果 timeline 正确但视觉不对，问题通常在 frontend scene call 到现有 CSS 动画/HP tween 的映射层。

## Scheduler Parity Test

一致性拆成两层测：

1. 后端 compiler parity：
   `packages/showdown-battle-core/src/index.test.ts` 的 `showdownPlaybackTimelineSmoke` 用 Raichu/Fearow rawLog 直接跑 Showdown client compiler，断言 group 顺序：

```txt
switch
switch
turn
move
result+damage
otherAnim:consume
otherAnim:heal+heal
move
damage
statbar+statbar
turn
```

运行：

```bash
pnpm --filter @changebattle-v2/showdown-battle-core test
```

2. 前端 scheduler parity：
   `apps/web/src/components/battle-v4/useBattleV4ShowdownScheduler.ts` 暴露纯函数：

```ts
createBattleV4ShowdownSchedulerPlan(stepQueue, {
  preferBackendGroups: true,
  allowOpeningSwitchBatch: true,
  hpTweenDurationMs: 350,
});
```

这个函数不依赖 React effect，不启动 timer，只输出前端调度器将消费的 step 顺序、`sceneCallSignature`、blocking work 数量和 `expectedFinishMs`。测试时把后端 `ShowdownPlaybackTimelineV4.groups` 转成 `playbackStepQueue` 后，断言：

- `plan.map(item => item.sceneCallSignature)` 与后端 group signatures 一致。
- 每个 backend group 只消费一次，`consumeCount` 不重复、不跳组。
- damage/heal group 的 `blockingWorkCount > 0` 且 `expectedFinishMs >= hpTweenDurationMs`。
- `finishReason` 与 step 类型一致：visual group 为 `visual`，turn/immediate 为 `immediate`，纯消息为 `message-only`。

这层测试的目标不是证明 CSS 动画长得像 Showdown，而是证明前端播放器没有重排、重复消费、提前 finish。画面错但 plan 对时，继续查 scene call 到 React/CSS 的映射；plan 错时，先修 scheduler。

## BattlePokemon Lifecycle Matrix

Showdown Client 参考源：

- `packages/showdown-battle-core/vendor/showdown-client/js/battle.js`
- `packages/showdown-battle-core/vendor/showdown-client/js/battle-dex.js`
- `packages/showdown-battle-core/vendor/showdown-client/js/battle-animations.js`

Battle V4 等价层：

| Showdown Client | Battle V4 等价实现 | 必测行为 |
| --- | --- | --- |
| `side.pokemon[]` 保存持久 `BattlePokemon` 对象 | `battleRosterByPlayer[player].pokemonByKey` 保存持久 battle object | battleKey 不含 species/name/forme，形态变化后 key 不变 |
| `side.active[]` 只引用同一个对象 | `activeKeyBySlot[slot]` 只引用 roster key | swap/switch 只移动 key，不复制或重绑对象 |
| `getPokemon(pokemonid)` 有 slot 时优先返回 `side.active[slot]` | active slot ident 优先从 `activeKeyBySlot[slot]` 取 roster entry | damage/heal/status/faint/detailschange 不按 species/index 重新匹配 |
| `getPokemon("p2: Name")` 视为 inactive ident，默认跳过当前 active | `parseIdent.slotExplicit=false` 时走 inactive roster 搜索，不默认写 `p2a` | silent inactive `detailschange` 不能污染当前 active |
| `getSwitchedPokemon(pokemonid, details)` 只在非 active、非 fainted 中找对象；找不到就 addPokemon | switch/drag/replace 通过 pokeball/request row 找 canonical key；不唯一或缺失时 protocol key | Stunfisk 不能继承 Chatot/Aerodactyl identity |
| `side.faint(pokemon)` 清 volatile，`lastPokemon=pokemon`，`active[slot]=null` | `faint` 标记 roster entry 后清 `activeKeyBySlot[slot]`，写 `lastPokemonKeyBySlot` 到 upkeep | faint 后 slot 不再被 inactive detailschange 当 active |
| `detailschange` 移除临时 forme/type volatile，永久更新 `speciesForme/details/searchid` | roster entry 和 Web battle object 更新 `battleSpeciesId/battleDetails/searchId` | Mega 后下场再上场仍显示 Mega |
| `-formechange` 写 `volatiles.formechange`，切出或 `-end` 后还原 | Web playback/runtime 写临时 forme，并保存旧 sprite state | 临时形态结束后回到永久形态 |
| `-transform` 复制目标当前形态到 volatile | Web runtime 用目标当前 `speciesId` 做 transform sprite，`-end transform` 还原 | Transform 不改变长期身份 |
| `battle-dex` sprite/icon 从 `speciesForme` 或 `volatiles.formechange` 派生 | BattleArena/target/bag/switch 从 `PokemonBattleOBJ.battleSpeciesId` 和 playback volatile 派生 | visible slot 不丢 active seat，sprite 指向当前形态资源 |
