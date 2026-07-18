# Formal Room Lobby / Match / FormalRun 三层重构计划

## Summary

把当前 `room === formalRun` 的临时设计重构为更正式的三层模型：

```text
Room / Lobby
  在线房间、大厅、成员、Room ID、连接、房间内对局列表

Match / 对局
  房间里的一个玩法实例，可创建、配置、开始、观战、结束

FormalRun
  Match 开始后生成的正式流程权威状态，从 starter 到最终结算
```

核心目标是抛弃“继续游戏 = 自动恢复 formalRun”的思路。正式游戏入口先创建房间，进入房间页；房间页里再创建/配置/开始对局。后续联机、观战、对局详情、阶段展示都挂在房间页和 Match 上，而不是强行塞进 FormalRun。

第一版先只做单人，但结构按未来多人预留：

```text
首页
  -> 开始游戏
  -> 创建 Room
  -> 房间页
  -> 右侧创建对局
  -> 选择赛制：单打-AI / 双打-AI / 合作-AI
  -> 创建 Match，状态未开始
  -> 对局详情
  -> 开始对局
  -> 服务端生成 FormalRun
  -> starter-select / round / rest / battle / settlement
```

## Why

当前 room v1 把 room 当成一局正式流程本身：

```text
POST /rooms
  -> 直接 createFormalGameRun()
  -> 直接 prepare starter candidates
```

这导致几个问题：

- 房间页只能变成“中转页”，没有真正 lobby 语义。
- “继续游戏”要同时恢复本地 formalRun、服务器 room、activeBattle，逻辑越来越绕。
- 未来联机、观战、对局详情、房间成员、准备状态都没有自然位置。
- 开房即生成正式流程，导致玩家还没选择赛制和准备，就已经消耗服务器正式流程计算。

新的模型里，Room 是容器，Match 是房间内的对局，FormalRun 是 Match 开始后的业务状态机。

## Concept Model

### Room

Room 表示一个在线大厅。

第一版字段草案：

```ts
type FormalLobbyRoomV1 = {
  roomId: string;
  roomTokenHash: string;
  status: "open" | "closed";
  connectionState: "online" | "disconnected" | "closed";
  closeReason?: "host-left" | "timeout" | "server-restarted" | "deleted" | "error";
  createdAt: string;
  updatedAt: string;
  lastHeartbeatAt: string;
  expiresAt: string;
  hostPlayerId: string;
  localPlayerId: string;
  players: FormalLobbyPlayerV1[];
  matches: FormalLobbyMatchSummaryV1[];
};
```

第一版单人玩家字段：

```ts
type FormalLobbyPlayerV1 = {
  playerId: string;
  displayName: string;
  role: "host";
  ready: boolean;
  joinedAt: string;
  lastSeenAt: string;
};
```

### Match

Match 表示房间里的一个正式对局记录。

状态第一版：

```ts
type FormalLobbyMatchStatusV1 =
  | "not_started"
  | "started_group_stage"
  | "started_top8_stage"
  | "ended";
```

字段草案：

```ts
type FormalLobbyMatchV1 = {
  matchId: string;
  title: string;
  mode: "singles" | "doubles" | "coop";
  status: FormalLobbyMatchStatusV1;
  phaseLabel: "未开始" | "小组赛阶段" | "8强阶段" | "已结束";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  endedAt?: string;
  cleanupAt?: string;
  formalRun?: FormalGameRunV4 | null;
  activeBattle?: {
    sessionId: string;
    nodeId: string;
    battleGameId: string;
    status: "creating" | "running" | "ended" | "lost";
  } | null;
  settlementSummary?: unknown;
};
```

阶段映射第一版：

- `not_started`：未开始。
- `started_group_stage`：FormalRun 已开始，当前轮次仍在小组赛/常规阶段。
- `started_top8_stage`：FormalRun 已开始，进入 8 强或 boss/final bracket 阶段。
- `ended`：FormalRun 已最终结算，保留 60 秒后从房间对局列表清除。

### FormalRun

FormalRun 只在 Match start 后创建。

它继续负责：

- starter candidates
- starter select
- round plan
- rest state
- battle session 绑定
- finalize battle
- finalize run

但 FormalRun 不再是 Room 本体。

## UX Structure

房间页第一版按用户草图实现，先不追求视觉精细：

```text
┌──────────────────────────────────────────────┐
│ ┌──────────────┐   ┌──────────────────────┐ │
│ │ 用户信息      │   │ 对局列表 / 创建对局 / │ │
│ └──────────────┘   │ 对局详情 / 后续观战   │ │
│ ┌──────────────┐   │                      │ │
│ │ 成员列表      │   │                      │ │
│ │              │   │                      │ │
│ └──────────────┘   └──────────────────────┘ │
└──────────────────────────────────────────────┘
```

左侧：

- 用户信息。
- Room ID。
- 成员列表。
- 当前连接状态。
- 离开房间按钮。

右侧状态：

- `match-list`：对局列表。
- `create-match`：创建对局面板。
- `match-detail`：对局详情。
- 后续 `spectate`：观战入口。

### 初始房间页

```text
Room ID: xxxx
成员：
  你 / 房主 / 在线

右侧：
  对局列表为空
  [创建对局]
```

### 创建对局面板

点击“创建对局”后，右侧切换为创建对局面板：

```text
创建对局

赛制：
  [单打-AI] [双打-AI] [合作-AI]

[确认创建] [取消]
```

确认创建后：

- 调 `POST /rooms/:roomId/matches`。
- 返回 `matchId`。
- 右侧回到对局详情或列表。
- 对局状态为 `未开始`。

### 对局详情

```text
对局详情

Match ID: xxxx
赛制：双打-AI
状态：未开始

[开始对局] [返回列表]
```

开始对局：

- 调 `POST /rooms/:roomId/matches/:matchId/start`。
- 服务端创建 FormalRun + starter candidates。
- Match 状态变为 `started_group_stage`。
- 客户端进入 `/formal/starter-select`。

### 离开房间

第一版单人规则：

```text
离开
  -> DELETE /rooms/:roomId
  -> 关闭房间
  -> 断 WS
  -> 清本地 room credential
  -> 清本地 formalRun cache
  -> 回主页
```

多人后续规则可扩展为：

- 房主离开：关闭房间或转移房主。
- 普通成员离开：只移除成员。

## API Refactor

### 新增 / 调整接口

```text
POST   /rooms
GET    /rooms/:roomId
DELETE /rooms/:roomId
GET    /rooms/:roomId/ws

POST   /rooms/:roomId/lobby/ready
POST   /rooms/:roomId/lobby/unready

POST   /rooms/:roomId/matches
GET    /rooms/:roomId/matches/:matchId
POST   /rooms/:roomId/matches/:matchId/start
DELETE /rooms/:roomId/matches/:matchId
```

正式流程接口迁移到 match scope：

```text
POST /rooms/:roomId/matches/:matchId/formal/select-starters
POST /rooms/:roomId/matches/:matchId/formal/prepare-round
POST /rooms/:roomId/matches/:matchId/formal/rest-action
POST /rooms/:roomId/matches/:matchId/formal/sync-draft
POST /rooms/:roomId/matches/:matchId/formal/prepare-battle
GET  /rooms/:roomId/matches/:matchId/battle/snapshot
GET  /rooms/:roomId/matches/:matchId/battle/playback-timeline?from=0
POST /rooms/:roomId/matches/:matchId/battle/choices
POST /rooms/:roomId/matches/:matchId/formal/finalize-battle
POST /rooms/:roomId/matches/:matchId/formal/finalize-run
GET  /rooms/:roomId/matches/:matchId/final-result
```

### Backward Compatibility

当前已存在旧接口：

```text
POST /rooms
POST /rooms/:roomId/formal/select-starters
...
```

迁移期建议：

- 先新增 match-scoped v2 接口。
- 旧接口继续保留一小段时间，内部映射到 room 的 active match。
- 前端先切新接口。
- 本地 Docker smoke 稳定后，再标记旧接口 deprecated。

## Server Data Model

Redis key 第一版仍可维持一个 room JSON：

```text
cb:room:<roomId>
cb:rooms
```

Room JSON 改为：

```ts
{
  roomId,
  tokenHash,
  status,
  connectionState,
  hostPlayerId,
  players,
  matches,
  activeMatchId,
  idempotency,
  createdAt,
  updatedAt,
  lastHeartbeatAt,
  expiresAt
}
```

容量约束沿用：

- `maxRooms=100`
- room JSON `<=1MB`
- Redis `maxmemory=128mb`
- 创建 room/match/formalRun 前检查内存安全水位

Ended match 清理：

- `match.status="ended"` 后设置 `cleanupAt=endedAt+60s`。
- sweep 时删除 ended 超过 60 秒的 match summary / formalRun / activeBattle 引用。
- final result 恢复仍可保留在 match 内或独立 short-lived result key，默认 30 分钟。

## WebSocket Protocol

WS 仍只做服务端通知，不承载主要业务 mutation。

连接流程：

```text
房间页 HTTP 创建/恢复 room
  -> 展示 Room ID
  -> 创建 WS
  -> auth roomToken
  -> 收 room.ready
```

服务端推送：

```text
room.ready
room.updated
match.created
match.updated
match.started
match.ended
match.removed
room.closed
server.error
```

客户端 mutation 仍走 HTTP：

- 创建 match
- 开始 match
- formal select starters
- rest-action
- battle choice
- finalize

## Client Refactor

### postService Registry

新增：

```text
rooms.create
rooms.get
rooms.delete
rooms.ready
rooms.unready
rooms.matches.create
rooms.matches.get
rooms.matches.start
rooms.matches.delete
rooms.matches.final.get
```

旧 formal room action 迁移为 match scope：

```text
rooms.matches.formal.selectStarters
rooms.matches.formal.prepareRound
rooms.matches.formal.syncDraft
rooms.matches.formal.restAction
rooms.matches.formal.prepareBattle
rooms.matches.battle.getSnapshot
rooms.matches.battle.getPlaybackTimeline
rooms.matches.battle.submitChoice
rooms.matches.formal.finalizeBattle
rooms.matches.formal.finalizeRun
```

### App Routing

建议路由：

```text
/room
/room/:roomId
/formal/starter-select
/formal/round-transition
/formal/rest
/formal/battle-transition
/formal/battle
/formal/battle-result-transition
/formal/settlement-transition
/formal/settlement
```

第一版也可继续 hash-router 内部只用 `/formal/room`，但状态里必须有 `roomId/matchId`。

### 首页

首页去掉传统“继续正式游戏”口径。

保留：

- 开始游戏：创建 Room，进入房间页。
- 训练场：本地流程。
- 最近房间：后续可选，不在第一版。
- 游戏设置。

第一版不做加入房间。

### 房间页

新增 `FormalLobbyPage` 或 `RoomLobbyPage`：

- 左侧用户信息。
- 左侧成员列表。
- 左侧 Room ID。
- 右侧对局列表。
- 右侧创建对局面板。
- 右侧对局详情。

状态来源：

- `roomCredential`
- `roomSnapshot`
- `selectedMatchId`
- `rightPanel`
- `connectionState`

## Migration Steps

### Slice 1: Plan and Types

- [ ] 新增 room/lobby/match 类型定义。
- [ ] 明确 `Room` 不再要求 `formalRun`。
- [ ] Match 内持有 `formalRun` 和 `activeBattle`。
- [ ] 更新计划/README，标记旧 `room === formalRun` 方案废弃。

### Slice 2: Server Room Lobby API

- [ ] `POST /rooms` 改为创建空 lobby room。
- [ ] `GET /rooms/:roomId` 返回 room + players + matches。
- [ ] `DELETE /rooms/:roomId` 关闭房间。
- [ ] `/rooms/:roomId/ws` 推送 `room.ready/room.updated`。
- [ ] 保留旧 `/rooms` formal-run start 兼容或加 feature flag。

### Slice 3: Match API

- [ ] `POST /rooms/:roomId/matches` 创建未开始对局。
- [ ] `GET /rooms/:roomId/matches/:matchId` 返回详情。
- [ ] `POST /rooms/:roomId/matches/:matchId/start` 生成 FormalRun + starter candidates。
- [ ] Match start 幂等，重复 `clientRequestId` 返回同一个 FormalRun。
- [ ] Match 状态从 `not_started` 进入 `started_group_stage`。

### Slice 4: Formal APIs Move Under Match

- [ ] starter select 增加 `matchId` scope。
- [ ] round prepare 增加 `matchId` scope。
- [ ] rest sync/rest action 增加 `matchId` scope。
- [ ] prepare battle / battle snapshot / choice 增加 `matchId` scope。
- [ ] finalize battle / finalize run 增加 `matchId` scope。
- [ ] 旧接口映射到 activeMatch，前端切完后 deprecated。

### Slice 5: Room Lobby UI

- [ ] 首页“开始游戏”只创建 Room 并进入房间页。
- [ ] 房间页展示 Room ID。
- [ ] 左侧用户信息和成员列表。
- [ ] 右侧对局列表。
- [ ] 点击“创建对局”右侧切创建面板。
- [ ] 创建对局后右侧显示对局详情。
- [ ] 对局详情可开始对局。
- [ ] 离开房间关闭 room 并清本地 credential/cache。

### Slice 6: Client State Cleanup

- [ ] 移除传统正式“继续游戏”自动恢复入口。
- [ ] `formalRun` 本地只作为显示 cache，不作为权威继续入口。
- [ ] room credential 只在房间页/正式流程内读取。
- [ ] 首页、设置、训练场、星图、仓库不读 room、不连 WS。
- [ ] 断线恢复统一回房间页，由房间页决定是否恢复 match/formalRun。

### Slice 7: Match End and Cleanup

- [ ] finalize-run 后 Match 状态变 `ended`。
- [ ] Match 保留 60 秒出现在对局列表。
- [ ] 60 秒后 sweep 清除 ended match 记录。
- [ ] final-result 仍保留 30 分钟用于最终响应丢失恢复。
- [ ] 房间可继续创建下一场 match，第一版可暂时禁止多 match 并提示“本房间已有对局”。

### Slice 8: Documentation and Smoke

- [ ] 更新 `plan/server-docker-battle-api-plan.md`。
- [ ] 更新 `plan/server-redis-battle-room-continuity-plan.md`。
- [ ] 更新 `plan/formal-run-server-room-implementation-checklist.md`。
- [ ] 更新 `plan/README.md`。
- [ ] 本地 Docker smoke：创建 room -> 创建 match -> start match -> starter -> round -> rest。
- [ ] Web smoke：房间页创建对局、开始对局。
- [ ] Desktop smoke：本地 Docker API + 房间页。

## Test Plan

### API

- `POST /rooms` 返回 lobby room，不包含 formalRun。
- `POST /rooms/:roomId/matches` 创建未开始 match。
- `POST /rooms/:roomId/matches/:matchId/start` 返回 formalRun starter candidates。
- 重复 `clientRequestId` start match 不重复生成 FormalRun。
- `GET /rooms/:roomId` 返回 matches 列表和当前状态。
- `DELETE /rooms/:roomId` 关闭房间，后续 match/formal 操作拒绝。
- ended match 60 秒后从 room match list 清理。
- 错误 token、错误 room、错误 match 返回标准错误。

### Web

- 首页无 room 请求、无 room WS。
- 点击开始游戏后进入房间页，显示 Room ID。
- 点击创建对局后右侧显示创建面板。
- 选择赛制并确认，列表/详情显示状态 `未开始`。
- 点击开始对局后进入 starter select。
- 完整 singles 至少跑到休整页。
- 离开房间调用 DELETE，清本地 credential 和 formalRun。

### Regression

- 训练场不受 room lobby 改造影响。
- battle service `/sessions` dev/training 路径仍可用。
- Desktop/Web/Mobile typecheck 全过。
- Docker health 仍返回 `redis:"ok"`。

必跑：

```bash
pnpm --filter @changebattle-v2/api typecheck
pnpm --filter @changebattle-v2/web typecheck
pnpm --filter @changebattle-v2/desktop typecheck
pnpm --filter @changebattle-v2/mobile typecheck
pnpm --filter @changebattle-v2/showdown-battle-core typecheck
git diff --check
```

## Risks

- API 迁移面很大，旧 room formalRun 接口和新 match-scoped 接口需要短期并存。
- 前端当前很多组件直接 `loadFormalRoomCredential()`，需要逐步改成 App/RoomContext 显式传入 room/match credential。
- Match 状态与 FormalRun 阶段映射要定义清楚，否则“已开始（小组赛/8强）”会和旧 currentRoundIndex 逻辑打架。
- 离开房间即关闭 room 会导致单人旧局不可恢复，这是预期行为，但 UI 文案要明确。
- 已结束 match 60 秒清理和 final-result 30 分钟恢复是两个不同 TTL，不能混淆。

## Decisions

- 第一版不做加入房间。
- 第一版不做观战，只预留右侧详情/观战入口位置。
- 第一版房间内只允许一个 active match；历史 ended match 可短暂展示。
- 第一版 WS 只做服务端通知，所有 mutation 走 HTTP。
- 首页不再自动继续正式游戏；正式流程只从房间页开始/恢复。
- Room ID 可以展示；room token 不展示、不进 URL query、不写日志。

