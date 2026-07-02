# Battle Playback Showdown Parity

Battle V4 的播放顺序以 Pokemon Showdown client 为权威参照。

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
