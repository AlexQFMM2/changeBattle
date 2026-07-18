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
  -> 在创建对局面板里调整本场对局偏好
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

对局偏好也跟着下沉到 Match 创建阶段：外层不再有一个“当前正式流程正在生效”的全局对局偏好。玩家进入房间后创建对局，在创建对局面板里选择赛制并调整偏好；确认创建时把偏好作为本场 Match 的配置快照保存。后续开始对局、生成 FormalRun、恢复房间，都以 Match 上的配置快照为准。

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
  config: {
    mode: "singles" | "doubles" | "coop";
    battlePreferenceSnapshot: BattlePreferenceConfigV1;
    rules?: Record<string, unknown>;
  };
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

`BattlePreferenceConfigV1` 第一版复用现有“对局偏好”数据结构或由它裁剪而来。关键规则是：Match 创建后保存的是快照，后续外部设置变化不影响已经创建的 Match。

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

## Service Game Contract

后续“服务化正式游戏”的核心规则从 **客户端/服务端各维护一份 runGame 再同步**，收口为：

```text
服务端 Redis formalRun = 唯一权威状态
客户端 = 展示 view cache + pending UI + 本地草稿
HTTP command = 推进游戏的唯一主链路
WebSocket = 服务端通知/房间在线状态，不做主流程 ACK
本地存档 = 长期 profile/vault 写回与离线缓存，不阻塞正式流程跳转
```

### 调用边界

正式流程不能按“组件渲染时不断 GET”实现。网络调用只发生在事件边界：

- 进入页面、刷新恢复、WS 通知本地 revision 落后时，`GET room/view` 一次。
- 玩家确认一个会改变状态的操作时，`POST command` 一次。
- `POST command` 成功响应必须包含最新 `revision + phase + view` 或足够的 delta；客户端直接渲染响应，不再额外 GET。
- 战斗页不按动画帧请求；提交一次 choice 返回 `snapshot + timelineDelta`，客户端本地播放 timeline。
- 本地保存 `formalRun` / `playerVault` 失败不能卡住正式流程；正式 room 模式下服务端 ACK 成功就进入下一页面，本地保存后台补写或提示。

反例：

```text
React render/useEffect
  -> GET room
  -> setFormalRun
  -> useEffect 依赖 formalRun 再 GET
```

这种会造成上百上千次无意义请求，禁止作为正式流程实现方式。

### Client State

客户端可以缓存数据用于展示，但不能把缓存当权威状态推进：

```ts
type FormalRoomClientStateV2 = {
  roomCredential: {roomId: string; roomToken: string};
  matchId?: string;
  lastKnownRevision: number;
  phase: "lobby" | "starter" | "roundPreparing" | "rest" | "battle" | "settling" | "ended";
  viewCache?: FormalRoomViewV1;
  pendingAction?: {
    commandId: string;
    label: string;
    startedAt: string;
  };
  localDraft?: unknown;
};
```

`localDraft` 只用于页面内未确认交互，例如选择项、拖拽排序、弹窗草稿。用户点击确认后必须变成 command 发给服务端；服务端 ACK 后用返回 view 覆盖 `viewCache`。

### View Model

短期为了少改组件，服务端可继续返回完整 `formalRun`，但客户端只把它当 `viewCache`。中期新增页面级 view：

```text
GET /rooms/:roomId/view
GET /rooms/:roomId/matches/:matchId/view
```

返回：

```ts
type FormalRoomViewV1 = {
  room: FormalLobbyRoomV1;
  match?: FormalLobbyMatchV1;
  revision: number;
  phase: FormalRoomPhaseV1;
  starterView?: FormalStarterViewV1;
  restView?: FormalRestViewV1;
  battleView?: FormalBattleViewV1;
  settlementView?: FormalSettlementViewV1;
};
```

页面只消费当前 phase 所需 view，避免把完整 `formalRun` 泄漏到所有组件里。

### Command Model

所有推进型操作统一为 command：

```ts
type FormalRoomCommandEnvelopeV1<T> = {
  commandId: string;
  baseRevision?: number;
  payload: T;
};
```

服务端规则：

- `commandId` 幂等；重复提交返回第一次处理结果，不重复扣钱、开战、结算。
- `baseRevision` 落后时拒绝或返回当前 view，客户端重拉后再提示/重试。
- 每个 command 的响应都包含 `revision`。
- 错误响应必须可展示，不返回 stack、token 或 AI debug 大对象。

推荐 command endpoint：

```text
POST /rooms/:roomId/matches/:matchId/commands/select-starters
POST /rooms/:roomId/matches/:matchId/commands/prepare-round
POST /rooms/:roomId/matches/:matchId/commands/rest-action
POST /rooms/:roomId/matches/:matchId/commands/prepare-battle
POST /rooms/:roomId/matches/:matchId/commands/battle-choice
POST /rooms/:roomId/matches/:matchId/commands/finalize-battle
POST /rooms/:roomId/matches/:matchId/commands/finalize-run
```

迁移期可以继续保留现有 REST endpoint，但语义按 command ACK 处理。

### WebSocket Scope

WS 不做主流程成功/失败判定。它只推送：

```json
{"type":"room.updated","revision":12,"scope":"rest"}
```

客户端收到后：

- 如果本地 `lastKnownRevision >= revision`，忽略。
- 如果本地落后，且当前页面需要最新数据，GET 当前 view 一次。
- 不能等 WS 消息才跳页；跳页依据 HTTP command ACK。
- WS 断开只影响“在线/重连”提示，不直接判定本次 command 失败。

### Turn-Based C/S Pattern

这个游戏不是即时动作游戏，不需要每帧同步，也不需要把 WS 当成“操作成功”的主通道。更接近正常回合制/卡牌/策略游戏的模型：

```text
页面进入
  -> GET 当前 view 一次
玩家确认操作
  -> POST command
  -> 服务端校验 + 推进权威状态
  -> 响应最新 revision/view/delta
客户端播放动画/展示结果
  -> 不再为了同一个结果额外 GET
WS 收到通知
  -> 只说明服务器 revision 变了或房间状态变了
  -> 当前页面需要时再 GET view 一次
```

调用量不会是一局上万次。正常一局的网络调用规模应接近“玩家确认操作次数 + 页面恢复次数 + 轻量心跳”：

- starter 选择：1 次 command。
- 生成赛程：1 次 command。
- 休整确认操作：每次确认 1 次 command；浏览、hover、打开弹窗、切换草稿不请求。
- 进入战斗：1 次 `prepare-battle` command。
- 每回合提交指令：1 次 command。
- 战斗结果：1 次 `finalize-battle` command。
- 最终结算：1 次 `finalize-run` command。
- WS/heartbeat 只维持在线感知，不承载业务推进。

所以“用户要看啥就 GET API”只适用于页面入口、刷新恢复、revision 落后时的 view 获取，不适用于 React render、动画播放、hover、选择草稿或普通 state update。

### Client Authority Boundary

客户端允许有三类状态，但它们的权重不同：

```text
viewCache
  最近一次服务端返回的展示数据，只能展示，不能本地推进正式流程。

localDraft
  页面内草稿，例如抽屉选择、队伍拖拽预览、未确认的设置项。
  用户确认后必须转成 command。

localPersistentProfile/vault
  长期本地存档。只在开房提供 snapshot，最终结算写回。
  写入失败不能卡住 room phase 跳转。
```

禁止出现：

- 客户端先本地推进 `formalRun.status`，再等待服务器“追上”。
- 服务端 ACK 成功了，但因为 `saveFormalGameRun()` / `savePlayerVault()` 慢或失败而卡在中转页。
- WS 断了就把正在进行的 HTTP command 判定为失败。
- 页面组件因为 `formalRun` 改变而自动重新 `GET room`，形成循环请求。
- 新旧两个本地 draft 同时可以覆盖 Redis checkpoint。

### Transition Contract

所有正式流程中转页都按同一个模板实现：

```text
1. 读取 roomCredential + matchId。
2. 生成稳定 commandId/clientRequestId。
3. POST command。
4. command ok：
   - 更新 lastKnownRevision。
   - 用 response.view/formalRun 覆盖 viewCache。
   - 立即导航到 response.phase 对应页面。
   - 本地 cache/profile/vault 写入后台执行。
5. command failed：
   - 保持当前中转页。
   - 展示业务错误或网络错误。
   - 提供重试/返回房间当前 view。
```

中转页不等待 WS，也不等待本地存档成功。它只等待当前 HTTP command 的 ACK。

### Migration Slices

后续迁移按低风险切片推进：

1. **中转页去本地阻塞**
   - starter、round、battle prepare、battle result、settlement transition 全部改成“HTTP ACK 后立即跳 phase”。
   - 本地 `saveFormalGameRun/profile/vault` 全部 background 化。

2. **引入 `lastKnownRevision + viewCache`**
   - App/FormalRoom state 层保存 `roomId/token/matchId/revision/phase/viewCache`。
   - 页面不直接把本地 `formalRun` 当权威。

3. **新增 view endpoint**
   - `GET /rooms/:roomId/matches/:matchId/view` 返回当前 phase 所需 view。
   - 迁移期可继续带完整 `formalRun`，但组件只按 view 消费。

4. **command endpoint 统一**
   - 新增 match-scoped `commands/*` endpoint。
   - 旧 `/rooms/:roomId/formal/*` endpoint 内部映射 active match，逐步 deprecated。

5. **休整页 command 化**
   - 当前 `formalRunDraft` 作为 debug/beta checkpoint 暂保留。
   - 逐步把治疗、交换、购买、训练、排序、背包、出售、打听、重随、保险等改成明确 command payload。
   - 减少完整 draft 信任面。

6. **WS 降级为通知层**
   - WS client 上移到 room shell。
   - 只处理 `room.updated/match.updated/room.closed/server.error`。
   - command 成败、页面跳转、pending 文案只看 HTTP response。

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
  当前：单打-AI
  [调整赛制]

对局偏好：
  当前模板摘要
  [调整偏好]

[确认创建] [取消]
```

UI 约定：

- 创建对局面板只展示摘要和确认按钮，复杂选择都放进公共抽屉组件。
- 赛制使用公共抽屉选择：单打-AI / 双打-AI / 合作-AI。
- 对局偏好也使用公共抽屉承载，点击“调整偏好”从侧边打开。
- 对局偏好抽屉内复用现有 `BattlePreferencePage` 的控件/校验逻辑，第一版可以抽成 `BattlePreferenceEditor`。
- 两个抽屉确认后只更新创建面板里的待创建 Match 配置草稿。
- 点击“确认创建”时，才把 `mode + battlePreferenceSnapshot` 提交给服务器。

确认创建后：

- 调 `POST /rooms/:roomId/matches`，输入包含 `mode` 和 `battlePreferenceSnapshot`。
- 返回 `matchId`。
- 右侧回到对局详情或列表。
- 对局状态为 `未开始`。

### 对局详情

```text
对局详情

Match ID: xxxx
赛制：双打-AI
对局偏好：困难度 / 规则 / 队伍生成摘要
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

`POST /rooms/:roomId/matches` 输入第一版：

```ts
type CreateFormalLobbyMatchInputV1 = {
  clientRequestId: string;
  title?: string;
  mode: "singles" | "doubles" | "coop";
  battlePreferenceSnapshot: BattlePreferenceConfigV1;
};
```

规则：

- `mode` 来自创建对局面板里的赛制抽屉。
- `battlePreferenceSnapshot` 来自创建对局面板里的对局偏好抽屉。
- 服务端保存创建时快照；Match 创建后再改外部默认偏好，不影响已创建 Match。
- Match 未开始前是否允许编辑配置可以后续做；第一版建议直接删除重建，降低状态复杂度。

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

`rooms.matches.create` 必须携带 `mode + battlePreferenceSnapshot`。前端不要从全局 BattlePreference 状态临时读取当前值来开始 FormalRun；所有正式流程 helper 只读 Match 上保存的配置快照。

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
- 创建对局面板只维护待创建 Match 草稿：`mode`、`battlePreferenceSnapshot`、`title`。
- 赛制和对局偏好都通过公共抽屉编辑，右侧面板只展示摘要。

状态来源：

- `roomCredential`
- `roomSnapshot`
- `selectedMatchId`
- `rightPanel`
- `connectionState`

### 对局偏好迁移

现有外层 `BattlePreferencePage` 不再直接决定当前正式对局。

迁移方向：

- 抽出可复用编辑器，例如 `BattlePreferenceEditor`。
- 创建对局面板点击“调整偏好”时，用公共抽屉挂载该编辑器。
- 抽屉确认后把结果写入 Match 创建草稿。
- `POST /rooms/:roomId/matches` 保存该偏好快照。
- `POST /rooms/:roomId/matches/:matchId/start` 只读取 Match 上的快照生成 FormalRun。

外层入口处理：

- 第一版可以隐藏旧“对局偏好”入口，避免误解。
- 如果后续保留，则改名为“默认对局模板”，只影响新建 Match 的默认填充值。
- 已创建 Match 不跟随默认模板变化。

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

- [ ] `POST /rooms/:roomId/matches` 创建未开始对局，输入包含 `mode + battlePreferenceSnapshot`。
- [ ] `GET /rooms/:roomId/matches/:matchId` 返回详情。
- [ ] `POST /rooms/:roomId/matches/:matchId/start` 生成 FormalRun + starter candidates。
- [ ] Match start 幂等，重复 `clientRequestId` 返回同一个 FormalRun。
- [ ] Match 状态从 `not_started` 进入 `started_group_stage`。
- [ ] Match start 使用 Match 保存的偏好快照，不读取外层全局偏好。

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
- [ ] 创建对局面板展示赛制摘要和对局偏好摘要。
- [ ] 赛制使用公共抽屉选择单打-AI / 双打-AI / 合作-AI。
- [ ] 对局偏好使用公共抽屉编辑，复用/抽出 `BattlePreferenceEditor`。
- [ ] 创建对局后右侧显示对局详情。
- [ ] 对局详情可开始对局。
- [ ] 离开房间关闭 room 并清本地 credential/cache。

### Slice 6: Client State Cleanup

- [ ] 移除传统正式“继续游戏”自动恢复入口。
- [ ] 移除或隐藏外层“对局偏好”作为当前正式对局入口的语义。
- [ ] 如保留外层偏好，只作为新建 Match 的默认模板。
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
