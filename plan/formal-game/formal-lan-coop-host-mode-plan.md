# 双人局域网合作模式（房主权威）开发计划

## Summary

新增“局域网合作”作为灵魂伴侣收口后的下一个核心开发点：不做中心服务器、不做公网匹配、不做 PvP，只做 **双人 Vs 电脑**。房主机器创建房间，客机通过局域网或虚拟局域网连接房主；战斗阶段由房主权威计算，客机只提交指令并播放房主广播的后端时序。

这不是“房主把所有页面都算完再发给客机”的模式。第一版更适合现有单机流程的拆法是：

- 非战斗阶段：两台机器各自处理自己的选人、休整、背包、商店、训练和队伍草稿。
- 中转页：作为强同步闸门，收集双方当前草稿，主机整合、校验、生成下一阶段共享事实，再回发给双方。
- 战斗阶段：房主唯一权威，负责 Showdown 会话、AI、rawLog、playbackTimeline、战斗进化和战斗结束判定；客机不得本地计算战斗。
- 战后中转页：房主根据双方战斗结果、画像和 run 状态生成下一轮合作对手、奖励与同步快照，再广播给客机。

现有 Showdown coop 编排保持不变：

```text
near side: p1 + p3
far side:  p2 + p4
```

联机合作映射为：

```text
p1 = 房主玩家
p3 = 客机玩家
p2 = AI 对手 A
p4 = AI 对手 B
```

## Product Boundary

- 第一版以 Desktop 为真实运行目标。
- Web 继续作为页面设计、组件预览和 Chrome automation 检查表面，不作为真实局域网联机产品目标。
- 创建房间只在 Desktop main 中开放。
- 客机也优先是 Desktop；后续如果做 Web 客机，也只应在协议已经稳定后作为轻量连接器，不改变核心方案。
- 不做公网服务器、中心匹配、账号系统、NAT 穿透、PvP、观战和 host migration。
- 远程联机依赖玩家自行使用 Radmin、ZeroTier、Tailscale、蒲公英等虚拟局域网工具。

## Showdown Client 参考口径

仓库里已有权威参考：

```text
pokemonShowdownAbout/pokemonShowdownClient
```

它是中心服务器 + SockJS/WebSocket 的客户端，和本项目“房主当主机”的局域网模型不一样，所以不能照搬网络架构。但它在几个细节上很适合作为实现参照：

- room 模型：服务端消息按 room 分发，`init / deinit / noinit` 改变 room 连接状态，battle room 和普通 room 都走统一收包入口。
- battle request：战斗操作面板由服务端 `|request|...` 驱动；没有 request 就不显示可操作控件。
- choice 提交：前端构造 choice 后发送给服务端，服务端回包再驱动画面，不靠本地提前假设结果。
- 重连状态：断线时把已连接 room 标成 `autoreconnect`，重连后 room 可通过新的 init / request 修复状态。
- keepalive / zombie connection：连接长时间无消息时主动 ping，超过阈值关闭连接并进入重连。
- queued send：断线期间发送会进入队列，重连后再发；本项目不能无脑照搬队列执行，但可以借鉴“提交必须可恢复”的思路。

本项目采用的对应原则：

- 不复用 Showdown 的中心服务器模型；房主 Desktop main 是唯一 host service。
- 不要求局域网协议兼容 Showdown 协议；只参考它的 room、request、choice、reconnect 设计。
- 战斗页必须像 Showdown client 一样由后端 request 驱动操作面板。
- 客机 battle choice 不能直接改本地 battle，只能提交给房主；房主返回 snapshot / playbackTimeline 后，客机再播放。
- 重连后不依赖“猜当前页”，而是按 room status + route + 当前 snapshot 修复 UI。
- Showdown 的 `/choose`、`|request|`、`|init|` 可以作为调试时的行为对照，但本项目 command/event 仍使用自己的结构化协议。

## Core Model

### 权威边界

- 房主权威的内容：
  - 房间状态与流程路由。
  - 中转页同步后的正式 run 事实快照。
  - 战斗 session、Showdown 输入、AI 输入、rawLog、playbackTimeline。
  - 战斗结束后的奖励、下一轮合作对手、最终结算。
- 客机本地权威的内容：
  - 自己在选人页的选择草稿。
  - 自己在休整页的队伍、背包、金币、商店购买、训练、交换等本地草稿。
  - 自己的 ready 状态和 battle choice 输入。
- 中转页合并后的内容才成为双方共同事实。

这个边界的好处是：休整页不需要每次点道具、买东西都走网络；网络压力和卡顿集中在阶段切换处。战斗页则必须由房主统一计算，避免两端 Showdown 状态分叉。

### Coop 类型

- 在 core 增加局域网合作协议类型：
  - `CoopLanSeatV4 = "p1" | "p3"`
  - `CoopLanRoomStatusV4 = "waitingGuest" | "lobby" | "selecting" | "syncing" | "resting" | "battle" | "settled" | "closed"`
  - `CoopLanRoomSnapshotV4`
  - `CoopLanClientCommandV4`
  - `CoopLanHostEventV4`
  - `CoopLanSyncBarrierV4`
- `TrainingPlayerDraftV4.controller` 和 `BattleServicePlayerInputV4.controller` 增加 `"remote"`。
- `remote` controller 规则：
  - 不自动提交 choice。
  - 不进入 AI 选择。
  - 由 host service 收到远端 battle command 后代为调用 battle service。
- 正式 run 增加 coop 局域网元信息：

```ts
coopLan?: {
  enabled: true;
  roomId: string;
  hostSeat: "p1";
  guestSeat: "p3";
  protocolVersion: 1;
}
```

- 正式 run 增加双人个人资源：

```ts
moneyByPlayerId?: Partial<Record<"p1" | "p3", number>>;
```

`money` 保留作为 p1 / 旧存档兼容字段。

### 长期存档边界

- 第一版不接入客机长期仓库写回。
- p3 在本局内使用客机本地生成或选择出来的局内队伍、背包和金币草稿。
- p3 的长期收益不写回客机本地 `PlayerVaultV4`。
- 后续若要做客机长期成长，需要单独设计“客机存档交换 / 签名 / 导出 / 防篡改”计划。

## 通信模型

### 基础通道

第一版使用 **HTTP + SSE**，不引入 WebSocket：

- 客机用 HTTP POST 向房主发送 command。
- 客机用 `EventSource` 订阅房主 SSE event stream。
- 房主用 Node `http` 在 Electron main 中实现 host service。
- 房主也通过本地 IPC 走同一套 command/event 语义，避免房主 UI 和客机 UI 两套逻辑。

HTTP endpoints：

- `GET /health`
- `GET /room`
- `POST /join`
- `POST /command`
- `GET /events?clientToken=...&afterEventId=...`
- `POST /ack`
- `POST /resync`

### 双向消息

客机发给房主的 command 包括：

- `joinRoom`
- `leaveRoom`
- `clientHello`
- `sendChatMessage`
- `sendQuickSignal`
- `openSurrenderVote`
- `respondSurrenderVote`
- `cancelSurrenderVote`
- `selectStarterDraftReady`
- `restDraftReady`
- `battleChoiceSubmit`
- `battleTrainerItemSubmit`
- `battlePlaybackAck`
- `settlementSeen`
- `returnToLobbyReady`
- `requestSnapshot`
- `ackEvents`

房主发给客机的 event 包括：

- `roomSnapshot`
- `chatMessage`
- `quickSignal`
- `surrenderVoteOpened`
- `surrenderVoteUpdated`
- `surrenderVoteCancelled`
- `surrenderVoteAccepted`
- `route`
- `syncBarrierOpened`
- `syncBarrierAccepted`
- `syncBarrierRejected`
- `formalSharedSnapshot`
- `restOpponentPreview`
- `battleSessionSnapshot`
- `playbackTimeline`
- `battleEnded`
- `battleResultSnapshot`
- `settlementSnapshot`
- `notice`
- `clientKicked`
- `roomClosed`

### 消息基础字段

所有 command 带：

```ts
{
  roomId: string;
  roomCode: string;
  clientId: string;
  clientToken: string;
  seat: "p1" | "p3";
  commandId: string;
  commandSeq: number;
  baseRevision: number;
  payload: unknown;
}
```

所有 event 带：

```ts
{
  roomId: string;
  eventId: number;
  revision: number;
  type: string;
  payload: unknown;
}
```

### 可靠性规则

局域网也会丢包、断流、重复提交，所以第一版必须把“不会因为一条消息丢了就卡死”写进协议：

- 客机 command 使用 `commandId` 幂等。
  - 房主保存最近 N 条已处理 command 的结果。
  - 同一个 `commandId` 重发时，房主返回第一次处理结果，不重复执行。
- 客机 command 使用递增 `commandSeq`。
  - 房主发现缺号时，不盲目执行后续 command，回发 `resyncRequired`。
  - 对 battle choice 这类关键命令，缺号必须修复后再继续。
- 房主 event 使用递增 `eventId`。
  - 客机 SSE 重连时带 `afterEventId`。
  - 房主从 event log 补发缺失事件；如果 event log 已过期，直接发完整 snapshot 修复。
- 所有关键 command 必须 ack。
  - HTTP POST 的响应是第一层 ack。
  - 房主后续广播 `syncBarrierAccepted` / `battleChoiceAccepted` 是事实 ack。
  - 客机超过超时时间未收到事实 ack，则用同一 `commandId` 重试。
- 客机对 event 批量 ack。
  - 房主可用 ack 判断客机是否已经收到 route / battle timeline。
  - 不要求每个动画帧 ack，只 ack 事实事件和 timeline 批次。
- `baseRevision` 用于发现旧状态提交。
  - 若 command 的 `baseRevision` 落后但可自动重放校验，房主可以接受。
  - 若涉及休整草稿合并、battle choice 或路由推进，落后 revision 默认拒绝并回发最新 snapshot。
- 每个中转页都有超时状态。
  - 客机长时间未 ready：房主显示等待、重试、踢出或 AI 接管选项。
  - 房主长时间无响应：客机显示重连、返回加入页。

### 心跳与重连

- SSE 每 3 秒发送 heartbeat。
- 客机 10 秒未收到 heartbeat，进入 `reconnecting`，暂停继续提交 command。
- 客机重连流程：
  1. `GET /health` 确认房主仍在。
  2. `GET /events?afterEventId=lastEventId` 尝试补事件。
  3. 如果补事件失败，`POST /resync` 拉取当前 room snapshot 和当前页面所需 snapshot。
  4. 客机用 snapshot 修复本地页面，再回到等待 / 当前阶段。
- 房主重启或房间丢失：
  - 客机返回加入页。
  - 第一版不做 host migration。
- 客机断线：
  - 房主房间页和中转页显示“客机断开”。
  - 非战斗阶段可等待重连。
  - 战斗阶段第一版暂停等待；后续可做 AI 临时代管 `p3`。

## 页面流程

整体流程：

```text
main
-> coop room
-> formal start transition
-> starter select
-> starter sync transition
-> round transition
-> rest
-> battle prep sync transition
-> battle transition
-> battle
-> battle result sync transition
-> rest / settlement
-> room
```

### 房间页

- 主菜单新增“局域网合作”入口，进入 `CoopLanRoomPage`。
- 房主选择“创建房间”：
  - Desktop main 启动 host service。
  - 显示局域网地址、端口、房间码、当前玩家列表。
  - 房主 seat 固定为 `p1`。
- 客机选择“加入房间”：
  - 输入 `host:port` 和房间码。
  - 加入成功后 seat 固定为 `p3`。
  - 客机发送显示名、头像、协议版本和本地能力信息。
- 房间状态：
  - `waitingGuest`：房主已开房，等待客机。
  - `lobby`：两人都在房间，可准备。
  - `inRun`：正式流程进行中。
  - `settled`：一次正式流程结束，显示“回到房间 / 再来一局 / 退出房间”。

### 开局中转页

`FormalGameTransitionPage` 在联机中负责建立共享 run 壳：

- 房主创建 coop formal run 外壳：
  - p1 = 房主玩家。
  - p3 = 客机玩家。
  - p2/p4 = AI 对手占位。
  - 记录 `coopLan` 元信息和 run seed。
- 客机不创建权威 run，只保存房主发来的 shared run header。
- 房主广播 `formalSharedSnapshot`，双方确认协议版本、seed、玩家 seat 和路线。
- 双方 ack 后进入选人页。

### 选人页

- p1 和 p3 各自选择自己的开局候选。
- 房主页面只操作 p1 候选。
- 客机页面只操作 p3 候选。
- 候选生成可以各自本地计算，但必须使用共享 seed + seat 派生 seed，保证提交后可复验：

```text
starter-seed = `${run.seed}:starter:${seat}`
```

- 客机选完后不直接修改房主 run，而是进入选人同步中转页并提交：
  - 选择的 candidateId。
  - 生成出的 `LocalPokemonV4[]` 摘要。
  - 起始背包、金币、可校验 seed/hash。

### 选人同步中转页

这是第一个强同步闸门：

- 房主收集：
  - p1 starter draft。
  - p3 starter draft。
- 房主校验：
  - candidateId 是否来自对应 seat 的候选池。
  - localTeam / bag / money 是否能由 seed 和候选规则复算。
  - p1/p3 是否都 ready。
- 校验通过后房主整合：
  - `restRunSnapshot.players.p1`
  - `restRunSnapshot.players.p3`
  - 当前节点 participants：`p1/p2/p3/p4`
- 房主广播整合后的 `formalSharedSnapshot`。
- 客机收到后覆盖自己的共享事实部分，保留自己的本地 UI 草稿缓存。
- 双方 ack 后进入 round transition / rest。

### 轮次中转页

`FormalRoundTransitionPage` 在联机中不只是动画页，还负责广播下一战公共信息：

- 当前 round / node。
- 下一战 AI 对手 p2/p4 的预览。
- 当前赛程进度。
- 是否进入最终休整或最终结算。

客机只播放同步动画和提示，不自行推进路线。

### 休整页

休整页是“各休整各的”：

- 房主 `viewSeat = "p1"`。
- 客机 `viewSeat = "p3"`。
- 只展示和操作当前 seat 的个人区域：
  - 队伍详情。
  - 背包。
  - 金币。
  - 商店。
  - 训练。
  - 交换。
  - 治疗。
- 大部分休整操作在本机立即计算，形成本地 rest draft。
- 不要求房主实时知道客机每次使用了什么道具。
- 不要求双方看到同一批商店货架；每个 seat 可用共享 run seed + seat + node 派生自己的货架：

```text
shop-seed = `${run.seed}:shop:${nodeId}:${seat}`
training-seed = `${run.seed}:training:${nodeId}:${seat}`
exchange-seed = `${run.seed}:exchange:${nodeId}:${seat}`
```

- 这样两人商店不抢库存，也不会因为网络延迟影响休整手感。
- 如果后续想做“共享补给箱”或“共同商店库存”，再单独加共享设施，不放进第一版。

休整页 ready：

- 玩家点 ready 后进入战斗准备同步中转页。
- ready payload 包括：
  - `seat`
  - `localTeam`
  - `bag`
  - `money`
  - 本轮 rest operation log 或最终 draft hash。
  - 当前 nodeId / revision。
- 客机通过 command 发给房主；房主本地 p1 也走同样数据结构。

### 战斗准备同步中转页

这是第二个强同步闸门，责任很大：

- 房主收集 p1/p3 的 rest-ready payload。
- 房主校验：
  - payload 对应当前 node。
  - localTeam 合法且未越权修改共享字段。
  - 背包、金币、训练、商店、交换结果能由本地规则和 operation log 复验。
  - 灵魂伴侣、荣誉、长期仓库等边界不被客机伪造写回。
- 校验失败：
  - 对应玩家退回休整页。
  - 显示明确错误和房主最新 snapshot。
- 校验通过：
  - 房主整合 p1/p3 当前战斗队伍与背包。
  - 根据双方画像 / 当前 node / 赛程生成或确认 p2/p4 AI 对手。
  - 生成 battle-ready shared snapshot。
  - 广播给客机。
- 双方 ack 后进入 battle transition。

## 战斗页与调度

### Battle 创建

只有房主创建 battle session：

```ts
p1: controller "local",  alliance "near"
p3: controller "remote", alliance "near"
p2: controller "ai",     alliance "far"
p4: controller "ai",     alliance "far"
```

- 房主广播 `battleSessionId` 和初始 `BattleSessionSnapshotV4`。
- 客机不创建本地 battle service。
- 客机只用房主 snapshot 初始化战斗 UI 和 playback 状态。

### 指令循环

- 房主本机提交 p1 choice。
- 客机提交 p3 choice：

```ts
submitBattleChoice({
  playerId: "p3",
  choice,
  trainerItems,
  requestId,
  commandId,
  baseRevision,
})
```

- 房主收到 p3 command 后：
  - 校验当前 request 是否需要 p3 输入。
  - 校验 requestId 是否匹配。
  - 幂等检查 commandId。
  - 调用 battle service 代 p3 提交。
- p2/p4 AI 继续由房主 battle service 自动处理。
- 当本轮所需输入齐备，房主推进 Showdown。

### 时序分发

- 房主每次 battle service 推进后广播：
  - 最新 `BattleSessionSnapshotV4`。
  - 从 rawLog 编译出的 `playbackTimeline` 批次。
  - 当前 request / route / ended 状态。
- 客机接收到 timeline 后塞入前端调度器播放。
- 客机不得本地插入战斗事件。
- 灵魂伴侣战斗进化也只在房主侧执行，结果通过 rawLog / playbackTimeline 同步。
- 操作面板只在双方都播放到对应 request 且 snapshot 表示需要本地 seat 输入时显示。

### 防卡死

- 每个 battle request 有 `requestId`。
- p1/p3 提交 choice 必须带 requestId。
- 如果客机丢了当前 request event：
  - 客机超时 request snapshot。
  - 房主重发当前 battle snapshot。
- 如果房主已经处理了 choice，但客机没收到 ack：
  - 客机用同一 commandId 重发。
  - 房主返回已处理结果，不重复提交 Showdown。
- 如果 timeline 丢包：
  - 客机用 lastEventId 补 SSE。
  - 补不了则拉完整 battle snapshot，并从最新稳定点继续。

### Battle Complete

- 房主检测 ended 后广播 `battleEnded` 和 route。
- 双方进入 `FormalBattleResultTransitionPage`。
- 客机在结果中转页只等待房主结算，不本地 finalize。

## 战后结果同步中转页

这是第三个强同步闸门，也是联机流程里最重要的中转页：

- 房主执行正式战斗 finalize。
- 房主根据战斗结果更新：
  - p1/p3 本局队伍状态。
  - p1/p3 本局背包、金币、奖励。
  - 灵魂伴侣亲密度、荣誉、战斗进化同步。
  - 当前 run 进度。
- 房主根据双方画像和当前 run 状态生成下一轮合作对手：
  - p1/p3 的队伍强度。
  - 当前 round / node。
  - 已击败对手。
  - 模式难度。
  - 可选剧情或 boss 权重。
- 房主广播：
  - `battleResultSnapshot`
  - `formalSharedSnapshot`
  - `restOpponentPreview`
  - `playerNoticeBySeat`
  - 下一 route。
- 客机收到后覆盖自己的共享事实部分，并把属于 p3 的结果映射到本地 UI。
- 双方 ack 后：
  - 中间胜利：进入下一次 rest。
  - 最终胜利 / 失败：进入 settlement。

## Settlement 与回房间

- `FormalSettlementTransitionPage` 由房主执行最终结算。
- 客机显示同步 settlement，不本地计算最终结果。
- `FormalSettlementPage` 增加“回到房间”按钮。
- 房主点击后广播 `roomReturnedToLobby`。
- 客机收到后同步回房间页。
- 不自动关闭 host service。

本轮结算写回：

- 房主 profile / playerVault 按现有单机逻辑写回。
- p3 的长期仓库不写回客机本地。
- p3 在本局内获得的资源只存在于房主这次 coop run 中。

## 联机体验细节

这些功能不一定都在第一版首日完成，但协议和页面要预留位置。否则战斗流程能跑起来后，玩家仍然会遇到“无法沟通 / 不知道对方卡在哪 / 误投降 / 退出后状态不清楚”的问题。

### 聊天

- 房间页、休整页、中转页、战斗页共用同一个 room chat。
- 第一版只做纯文本短消息：
  - 不支持图片、富文本、链接预览。
  - 本地显示时间、seat、昵称。
  - 房主也通过 host event 广播自己的消息，保证两端聊天顺序一致。
- command：

```ts
sendChatMessage({
  messageId,
  seat,
  text,
  createdAt,
})
```

- event：

```ts
chatMessage({
  messageId,
  seat,
  displayName,
  text,
  createdAt,
})
```

- 规则：
  - 单条长度限制，例如 120 字。
  - 房主负责过滤空消息、过长消息和过快刷屏。
  - `messageId` 幂等，重发不重复显示。
  - 聊天 event 也进入 event log，客机重连后可补最近 N 条。
- UI：
  - 房间页完整显示聊天框。
  - 休整页可以收起到右侧小面板。
  - 战斗页只显示轻量侧栏消息，避免挡住操作面板。
  - 中转页显示聊天和双方 ready 状态，便于沟通“我还在调队伍”。

### 快捷信号

除了自由聊天，建议增加几个无需打字的快捷信号：

- `我准备好了`
- `等我一下`
- `我断线重连了`
- `这回合你先打`
- `我需要治疗`
- `可以进下一战`

快捷信号也是 chat event 的一种，但 type 区分为 `quickSignal`，方便 UI 用更醒目的样式展示。

### 投降 / 结束本局

双人合作不能让单人误点直接结束全局。第一版投降走双确认：

- 任一玩家点击“投降 / 结束本局”后，进入 `surrenderVoteOpen`。
- 另一名玩家看到确认弹窗：
  - `同意投降`
  - `继续战斗`
- 只有 p1 和 p3 都同意时，房主才执行投降结算。
- 任一玩家拒绝或超时，投降取消。
- 战斗页投降和非战斗页结束本局都走同一套 vote，只是文案不同。

command：

```ts
openSurrenderVote({ voteId, seat, scope: "battle" | "run" })
respondSurrenderVote({ voteId, seat, accepted: boolean })
cancelSurrenderVote({ voteId, seat })
```

event：

```ts
surrenderVoteOpened
surrenderVoteUpdated
surrenderVoteCancelled
surrenderVoteAccepted
```

规则：

- 同一时间只能有一个 active vote。
- `voteId` 幂等，重复点击不重复开票。
- 房主断线不处理投降，客机显示连接丢失。
- 客机断线时房主可以等待重连；第一版不默认把断线当同意投降。
- 战斗中投降被确认后，由房主通过 battle service / formal finalize 进入失败结算，不让客机本地直接跳结果页。

### 暂停与等待

- 中转页天然是等待状态，不需要额外暂停。
- 休整页没有严格倒计时；一方 ready 后可以取消 ready，直到双方都 ready 且房主开始推进。
- 战斗页第一版不做复杂暂停系统：
  - p1/p3 任一方未提交 choice 时，操作面板保持等待。
  - 可显示“等待 p3 选择行动”或“等待房主同步”。
  - 后续如果做计时器，必须由房主权威计时，不能两端各倒各的。
- 断线时：
  - 战斗阶段暂停等待，不自动推进。
  - 非战斗阶段保留当前本地 draft，重连后进入对应页面或同步中转页。

### 退出、踢出与 AI 接管

- 客机主动退出：
  - 房主收到 `leaveRoom`。
  - 如果在 lobby，房间回到 `waitingGuest`。
  - 如果在 run 中，房主显示选择：
    - 等待客机重连。
    - 结束本局。
    - 后续扩展：AI 接管 p3。
- 房主退出：
  - host service 关闭。
  - 客机收到 `roomClosed` 或心跳超时后返回加入页。
- 房主踢出客机：
  - 第一版只在房间页开放。
  - run 中不建议踢出，除非后续做 AI 接管。
- AI 接管：
  - 作为后续扩展。
  - 如果要做，必须明确 p3 由 `remote` 切到 `ai/script` 后是否还能重连抢回控制权。

### 隐私与玩家身份

- 第一版只传显示名、头像、seat、协议版本。
- 不传客机长期存档。
- 不传客机本地文件路径。
- 聊天和协议日志默认只保存在本次 debug/session；如果导出日志，需要明确包含聊天文本。
- 房间码只防误连，不提供强安全；局域网内恶意连接不在第一版安全模型内。

## Desktop Host Service

在 Electron main 新增 `coopLanHostService`：

- `startRoom({profileName, avatar, port?})`
- `stopRoom(roomId)`
- `getRoomSnapshot(roomId)`
- `handleClientCommand(command)`
- `appendEvent(event)`
- `broadcast(event)`
- `getEventsAfter(eventId)`
- `resyncClient(clientToken)`

监听地址：

- 默认 `0.0.0.0:8898`。
- 如果端口占用，自动尝试 `8899..8910`。
- 房间页展示所有本机局域网 IPv4 地址。

简单安全：

- 房间码 6 位数字/字母。
- 客机加入后分配 `clientToken`。
- 后续 command 必须带 token。
- 第一版不做加密，依赖局域网/虚拟局域网信任。

事件存储：

- 房主内存保存最近 N 条 event。
- 每个 event 带 eventId / revision。
- 若客机 afterEventId 太旧，房主返回 `snapshotRequired`。
- 房主保存最近 N 条 commandId 的处理结果，支持幂等重试。

## UI / Preview

- Desktop 是正式产品入口。
- Web 只保留必要的组件预览和 Chrome automation 检查：
  - 房间页布局预览。
  - 中转页等待/失败/重连状态预览。
  - 战斗页 remote seat 输入状态预览。
- 不把 Web 当成真实局域网联机环境要求。

## 开发与测试策略

这个功能不能等到最后才拿两台电脑人工试。第一版需要从一开始就把“可模拟两端、可注入网络故障、可重放协议”作为开发工具的一部分，否则后面很容易出现偶发卡死但无法复现。

### 分层开发

建议按四层推进：

1. **纯协议层**
   - 不启动 Electron UI。
   - 在 Node 测试里创建 in-memory host 和 guest client。
   - 用同步或虚拟时钟模拟 command/event/ack/retry。
   - 验证 room state、revision、eventId、commandId、sync barrier。
2. **本机双客户端层**
   - 同一台机器启动一个 host service。
   - 启动两个 renderer 窗口或两个 Desktop profile：一个房主、一个客机。
   - 客机通过 `127.0.0.1:port` 加入。
   - 用这个模式开发绝大多数页面和流程。
3. **故障注入层**
   - 在 host service 或 client transport 前加 debug network adapter。
   - 支持延迟、丢 event、丢 command response、重复 command、乱序 event、断开 SSE、恢复连接。
   - 所有故障都要可配置 seed，方便复现。
4. **真实局域网层**
   - 两台机器或虚拟局域网。
   - 只验证端口、防火墙、地址展示、真实断线重连、性能和用户体验。
   - 不把真实局域网当主要调试环境。

### Headless Host Harness

新增一个开发测试 harness，不绑定 UI：

```text
host.startRoom()
guest.joinRoom()
guest.send(command)
host.tick()
guest.readEvents()
```

它要能跑完整脚本：

```text
create room
guest join
start run
p1 select starter
p3 select starter
starter sync barrier
p1 rest draft ready
p3 rest draft ready
battle prep sync barrier
p1 submit battle choice
p3 submit battle choice
host broadcast timeline
battle result sync barrier
return lobby
```

这个 harness 的目标不是替代 UI，而是把协议正确性压住：

- 每个 command 是否幂等。
- 每个 barrier 是否只在双方 ready 后推进。
- 丢失一个 event 后能否补齐。
- 重复提交 battle choice 是否不会重复进入 Showdown。
- 客机落后 revision 时是否能被修复。

### Debug Network Adapter

开发环境需要一个可插拔网络故障层：

```ts
type CoopLanDebugNetworkOptions = {
  latencyMs?: number;
  jitterMs?: number;
  dropCommandRate?: number;
  dropEventRate?: number;
  duplicateCommandRate?: number;
  duplicateEventRate?: number;
  reorderEventRate?: number;
  disconnectAfterEventId?: number;
  seed?: string;
};
```

使用方式：

- 正常开发默认关闭。
- 协议测试可以用固定 seed 打开。
- Desktop debug 菜单提供几个预设：
  - `稳定局域网`
  - `高延迟`
  - `偶发丢包`
  - `SSE 断线重连`
  - `battle choice ack 丢失`
  - `中转页 ready 丢失`

核心要求：

- 所有故障都发生在 transport 层，不改业务代码。
- 所有故障都可复现。
- 不能只测“断开后返回房间”，还要测“断开后继续当前战斗 / 当前中转页”。

### 本机双窗口开发

Desktop debug 需要支持一键启动本机联机：

- `启动房主窗口`
- `启动客机窗口`
- 自动使用 `127.0.0.1` 和当前房间码加入。
- 两个窗口显示不同标题：
  - `LAN Host - p1`
  - `LAN Guest - p3`
- 两个窗口都显示：
  - `roomId`
  - `revision`
  - `lastEventId`
  - `connectionState`
  - `currentRoute`
  - `currentBarrier`

这比一开始就拿两台机器调要稳得多，也能配合截图和自动化检查页面状态。

### 协议日志与重放

每次局域网合作 debug run 都应能导出协议日志：

```text
timestamp
direction: host->guest | guest->host | host-local
eventId / commandId
revision
route
payload summary
payload hash
```

日志用途：

- 复现卡死。
- 对比房主和客机是不是在同一个 revision。
- 判断是 command 丢了、event 丢了，还是 UI 没消费 snapshot。
- 构造回归测试。

后续可以做 replay：

- 输入协议日志。
- 重放到 headless guest client。
- 确认最终 room snapshot / route / battle snapshot 一致。

### 页面自动化测试

Web 不作为真实联机运行目标，但仍可以用它做视觉和状态预览：

- 房间页各种状态截图。
- 中转页等待、失败、重连、校验失败截图。
- 休整页 `p1/p3` viewSeat 切换截图。
- 战斗页 remote request / waiting / disconnected 状态截图。

真实联机交互自动化优先放在 Desktop debug 双窗口：

- 可以后续用 Electron automation 或 Playwright attach 到两个窗口。
- 不要求第一版就完成全量自动化，但 debug hooks 要先留出来。

### 开发顺序建议

1. 协议类型和 headless host/guest harness。
2. commandId/eventId/revision/ack/resync 测试。
3. 房间页 Desktop host service + 本机客机加入。
4. 选人同步中转页。
5. 休整本地 draft + 战斗准备同步中转页。
6. battle remote controller：先固定队伍打最小 Showdown coop。
7. timeline 分发和客机调度器消费。
8. 战后结果同步中转页。
9. 断线重连和故障注入。
10. 真实局域网手工测试。

## Test Plan

- Core / API：
  - coop 模式保持 `p1/p3 near`、`p2/p4 far`。
  - `remote` controller 不触发 AI 自动选择。
  - p1/p3 starter 使用 seat 派生 seed，互不污染。
  - p1/p3 休整草稿各自本地生成，中转页合并后共享事实一致。
  - p1/p3 商店、训练、交换按 seat 独立，不要求共享货架。
  - 战斗准备中转页拒绝 nodeId / revision / draft hash 不匹配的 payload。
  - 房主提交 p1、客机提交 p3 后，Showdown multi battle 正常推进。
  - p2/p4 不出现在休整可操作玩家列表。
- Desktop service：
  - 创建房间后 `/health` 和 `/room` 可访问。
  - 房间码错误无法加入。
  - 客机 command 可被房主 ack。
  - 同一 commandId 重发不会重复执行。
  - commandSeq 缺号时触发 resync。
  - 客机断开 SSE 后带 `afterEventId` 重连可补事件。
  - event log 过期时可通过完整 snapshot 修复。
  - 旧 revision 的 battle choice 被拒绝并返回最新 battle snapshot。
- Flow：
  - 房主和客机各自选人，选人同步中转页整合后再进入休整。
  - 房主和客机各自休整，战斗准备中转页收齐 localTeam / bag / money 后再进入战斗。
  - 战斗页房主只提交 p1，客机只提交 p3。
  - 两端 battle playback 顺序一致。
  - 战后结果中转页由房主生成下一轮合作对手并同步给客机。
  - 最终结算后两端都能回到房间。
- Regression：
  - 单机 singles / doubles / coop 不受影响。
  - 现有 AI 合作模式仍能运行，p3 script 队友逻辑保留。
  - `pnpm --filter @changebattle-v2/core typecheck`
  - `pnpm --filter @changebattle-v2/api typecheck`
  - `pnpm --filter @changebattle-v2/desktop typecheck`
  - `pnpm --filter @changebattle-v2/showdown-battle-core test`
  - `pnpm --filter @changebattle-v2/api test:formal-game`
  - `pnpm typecheck`

## Assumptions

- 第一版只做双人局域网 PvE：`p1+p3` vs `p2+p4`。
- 非战斗阶段优先本地计算，中转页做强同步；战斗阶段房主权威。
- 不做公网服务器、中心匹配、账号系统、NAT 穿透、PvP、观战和 host migration。
- 远程联机依赖玩家自行使用虚拟局域网。
- 客机长期存档、客机仓库导入/写回、双方长期收益同步不进入第一版。
- 第一版优先复用现有本地 coop battle 编排，把 `p3 script` 替换为 `p3 remote`。
