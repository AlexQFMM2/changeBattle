# Battle Room Redis Continuity Plan

## Summary

当前 Desk/Web/Android 已统一走公网 Battle API。下一步要解决网络波动下的连续性问题：创建战斗成功但客户端没收到、提交指令已执行但返回丢失、App 被杀后无法回到正确正式流程等。

本计划不做账号系统、不做长期云存档。服务器只创建临时房间：

```text
roomId -> authoritative formalRun checkpoint + battleSession + pending action metadata
```

客户端保存 `roomId + roomToken`，继续游戏时重新连接房间。Redis 负责临时状态和 TTL 自动清理。客户端仍保留本地 formalRun draft/cache，用于休整页流畅编辑；Redis 里的 formalRun 只在关键 checkpoint 自动更新。

当前容量判断：这台 2C/2G 服务器清理旧镜像后磁盘余量约 31G，Battle API 常驻约 220MiB。Redis room 第一版按 `maxmemory=128mb`、`maxRooms=100` 设计；由于正式对局通常几分钟到半小时结束，同时 100 局已经足够 debug/beta 阶段使用。

## Key Changes

- 新增 Redis room store：
  - Docker compose 增加 Redis，只供 Battle API 内网访问，不暴露公网端口。
  - room key 使用 `cb:room:<roomId>`，value 存 JSON。
  - Redis `maxmemory=128mb`，room 服务第一版 `maxRooms=100`。
  - 单个 room JSON 上限 1MB；超过时拒绝写入并记录服务端 error log。
  - room heartbeat 每 60 秒发送一次。
  - room 5 分钟未收到 heartbeat 或任何有效请求，标记为 `disconnected`。
  - room 10 分钟完全无响应，自动 close battle session 并清理 room。
  - ended room 保留 30 分钟用于结算确认和问题排查，然后自动清理。
  - 每次成功读取/写入 room 刷新 TTL。

- Room 身份模型：
  - `roomId` 使用 16-24 bytes random，base64url 编码。
  - `roomToken` 使用 32 bytes random，base64url 编码。
  - Redis 只存 `sha256(roomToken)`，客户端本地保存 `roomId + roomToken`。
  - 没有登录注册；拿到 room token 就等价于拿到临时房间钥匙。

- Room 状态内容：
  - `formalRun`：服务器权威 checkpoint，不存休整页未提交 draft。
  - `revision`：每次权威 checkpoint 更新递增，防止旧页面覆盖新状态。
  - `status: "resting" | "preparing" | "battling" | "settling" | "ended"`
  - `connectionState: "online" | "disconnected" | "closed"`
  - `battleSessionId`
  - `createdAt / updatedAt / lastHeartbeatAt / disconnectedAt / closedAt / expiresAt`
  - `pendingActions` / 最近提交结果摘要
  - `clientRequestId -> sessionId` 幂等映射

- 新增 room endpoints：
  - `POST /rooms`：创建正式流程房间，返回 `roomId / roomToken / formalRun`。
  - `GET /rooms/:roomId`：用 token 读取当前 `formalRun` 和可选 `battleSnapshot`。
  - `POST /rooms/:roomId/formal/select-starters`：确认 starter，服务端写入权威 checkpoint。
  - `POST /rooms/:roomId/formal/prepare-round`：服务器侧推进正式赛程/休整快照。
  - `POST /rooms/:roomId/formal/prepare-battle`：自动提交当前休整 draft，校验成功后幂等创建/复用 battle session。
  - `POST /rooms/:roomId/battle/choices`：提交指令，支持 `clientActionId / expectedTurn / expectedRqid`。
  - `POST /rooms/:roomId/formal/finalize-battle`：基于 battle snapshot/timeline 结算正式战斗。
  - `POST /rooms/:roomId/formal/finalize-run`：生成最终结算，返回 `settlement / profileDelta / vaultDelta / summary`，room 进入 `ended`。
  - `GET /rooms/:roomId/final-result`：ended room 的短期只读 final result 读取接口。
  - `POST /rooms/:roomId/heartbeat`：刷新在线状态和 TTL。
  - `DELETE /rooms/:roomId`：玩家主动放弃/结束房间。

- 战斗页云端流程：
  - BattleV4Page 继续消费 `api.battleService` 抽象，但正式 room 模式下该 client 必须绑定 `roomId + roomToken`，所有 snapshot/timeline/choice 都来自云端 Battle API。
  - 进入战斗页时先显示“正在连接战斗服务器”，完成 `GET /rooms/:roomId` + `getSnapshot(sessionId)` 后再解锁指令 UI。
  - 战斗页不再假设提交成功；`submitChoice` 超时/失败后先拉 room/snapshot 判断当前 `rqid` 是否仍需行动，再决定重试或恢复。
  - timeline 播放按 `previousIndex` 增量拉取；断线恢复后从最后成功 index 继续，不从头重播。
  - 战斗页期间本地 run cache 只展示，不允许旧休整 draft 覆盖服务器 checkpoint。

- 全局连接状态 UI：
  - 新增通用连接遮罩/弹窗，用于开始游戏、恢复 room、进入战斗、提交指令、战斗结算等跨页面网络等待。
  - 弹窗状态至少包含：`connecting`、`reconnecting`、`submitting`、`recovering`、`failed`。
  - `failed` 必须给出“重试 / 返回标题或休整”的明确入口，不能静默跳页。
  - 连接弹窗应复用同一组件，避免每个页面各做一套 loading/error。

- 全局延迟信号组件：
  - 延迟信号是全局组件，不绑定 BattleV4Page；所有 server room 流程共用同一套 room connection monitor。
  - connection monitor 维护：心跳 RTT、最近成功请求时间、连续失败次数、在线/重连/离线状态。
  - UI 显示小型信号指示，形态类似 `FPS 39 / Wi-Fi图标 / 460ms / 电量`，第一版至少显示延迟和连接状态。
  - 战斗页、休整页、结算中转页、恢复房间页都读取同一个全局网络状态。
  - 延迟分级建议：`<100ms` 良好、`100-300ms` 一般、`300-800ms` 较差、`>800ms` 红色高延迟。
  - 5 分钟无有效心跳前，客户端应进入 `reconnecting` 并持续尝试恢复；服务器标记 `disconnected` 后仍允许 10 分钟内重连。
  - 信号检测不参与游戏判定，只影响 UI 提示和自动恢复流程。

- 休整页 draft 与 checkpoint：
  - 正式 server room 模式下移除手动保存按钮，不暴露独立“保存到服务器”入口。
  - 休整页继续使用本地 draft 保证流畅；买卖、治疗、课程、技能调整、交换预览等页面内操作先不请求服务器。
  - 未进入关键流程前，客户端刷新/重连会丢弃未提交 draft，并回到服务器 checkpoint。
  - 点击“进入战斗”时，客户端把当前 rest draft 随 `prepare-battle` 一次性提交；服务端校验 `room.revision / formalRun.id / currentRoundIndex / status / size` 后才创建 battle session。
  - 进入战斗后本地 draft 冻结，禁止旧休整页 draft 再覆盖服务器。
  - 战斗结束回休整由 `finalize-battle` 在服务器更新 checkpoint，客户端用返回的 formalRun 覆盖本地 cache。

- 幂等与恢复规则：
  - 创建战斗使用 `formalRun.id + nodeId + battleGame.id` 作为 `clientRequestId`。
  - 同一个 `clientRequestId` 重试必须返回同一个 `sessionId`。
  - 提交指令使用 `clientActionId`；重复提交返回已处理后的 snapshot 或当前 snapshot。
  - `prepare-battle` 的 rest draft commit 使用 `baseRevision`；revision 不匹配时拒绝并返回服务器当前 formalRun。
  - `finalize-battle / finalize-run` 必须幂等，重复调用不重复推进、不重复发奖。
  - 客户端提交超时后先 `GET /rooms/:roomId` / `getSnapshot`，确认是否仍需行动，再决定是否重试。
  - 客户端不以“按钮点击成功”为准，所有状态以服务器 room + battle snapshot 为准。

- 客户端接入：
  - Desktop/Web/Android 本地只保存 room credential 和最近 cache。
  - “继续游戏”优先用 `roomId + roomToken` 重连服务器 room。
  - 正式流程期间每 60 秒发送 heartbeat；任何成功 room 请求也视为 heartbeat。
  - 客户端发现房间 `disconnected` 但未 `closed` 时，允许一键重连并恢复当前 snapshot。
  - 客户端发现房间已 `closed` / 过期时，显示明确提示，回到休整/标题页，不静默重建旧战斗。
  - 本地 formalRun 降级为 draft/cache，不再作为 server-first 正式流程唯一权威。
  - 正式 server room 模式下隐藏手动保存按钮；玩家不能主动反复把 draft 覆盖到 Redis。
  - BattleV4Page、FormalTransition、FormalRest、FormalSettlement 共用同一套连接状态/错误恢复组件和全局延迟信号组件。
  - 训练场、图鉴、长期仓库暂不接 room；第一版只接正式流程。

- 正式流程全程网络化：
  - 第一版 room 化后，正式流程的创建、starter 确认、赛程推进、进入战斗 checkpoint、战斗创建、指令提交、战斗结算、最终结算都以服务器 room 为权威。
  - 客户端只负责展示、页面内 draft、提交输入、保存 room credential 和 cache。
  - 后续再评估训练场、合作模式和联机是否复用同一 room 模型。

- 日志与安全：
  - 服务端 JSON log 记录 `roomId/sessionId/scope/status/elapsedMs`，不记录明文 `roomToken`。
  - 普通客户端响应继续不返回完整 AI debug。
  - Redis 不公网暴露；只由 Battle API 容器访问。

## Test Plan

- Store / token 单测：
  - 创建 room 后 Redis 只保存 token hash。
  - 错误 token 不能读取/推进 room。
  - 读取/写入 room 会刷新 TTL。
  - 5 分钟无 heartbeat 标记 `disconnected`。
  - 10 分钟无有效请求自动 close 并清理 room。
  - ended room 30 分钟后清理。
  - room 数超过 `maxRooms=100` 时拒绝创建新 room。
  - 单 room JSON 超过 1MB 时拒绝写入。

- 幂等测试：
  - 同 `clientRequestId` 多次 prepare battle 只产生一个 `sessionId`。
  - 同 `clientActionId` 多次 submit choice 不重复执行指令。
  - `expectedTurn/rqid` 已过期时返回当前 snapshot，而不是执行旧指令。
  - rest draft 使用旧 `baseRevision` 提交时被拒绝，不能覆盖战斗后 checkpoint。
  - finalize battle / finalize run 重试不会重复推进或重复结算。

- 休整页 draft 测试：
  - server room 模式下不显示手动保存按钮。
  - 休整页页面内修改不请求服务器，进入战斗才提交 draft。
  - 刷新/重连后未提交 draft 被丢弃，恢复服务器 checkpoint。
  - 进入战斗后旧休整页不能再提交 draft 覆盖服务器。

- 恢复测试：
  - 创建战斗响应丢失后，客户端用 room 恢复到同一 battle session。
  - 提交指令响应丢失后，客户端重新拉 room/snapshot 能看到新局面。
  - App/Desk 刷新或重启后，用本地 `roomId + roomToken` 继续正式流程。
  - 心跳丢失 5 分钟后，客户端重连仍能恢复。
  - 心跳丢失超过 10 分钟后，客户端看到明确过期/关闭提示。

- 战斗页网络测试：
  - 进入战斗页先显示连接中，云端 snapshot 到达后再解锁指令。
  - submit choice 响应丢失后不会重复执行旧指令，能通过 snapshot 恢复。
  - timeline 断线后按 `previousIndex` 续拉，不重复整场播放。
  - Battle API 暂时不可达时显示全局重连弹窗，不静默回休整页。
  - 信号指示能显示延迟分级和离线/重连状态。

- 回归验证：
  - Battle API health 仍正常。
  - Desk/Web/Android 均能创建 room、进入正式战斗并提交一次指令。
  - Redis 容器重启或 room 过期时，客户端显示明确错误，不静默回休整页。
  - 普通响应不包含 AI debug 大对象。

## Assumptions

- 第一版 room 只服务正式流程，不接训练场、不接长期云存档。
- 不做账号、登录、注册、多设备绑定；`roomToken` 就是临时访问凭证。
- Redis 是临时连续性层，不承诺永久保存；长时间未响应自动清除是预期行为。
- 第一版容量目标是同时 50 局稳定、100 局硬上限；超过时返回服务器繁忙。
- 正式流程会逐步全程网络化；本地 formalRun 只作为页面 draft、cache 和失败提示辅助。
- 正式 room 模式下取消手动保存，关键 checkpoint 自动同步，降低恶意刷保存和多窗口覆盖风险。
- Battle API 仍是状态型服务；room 和 battle session 后续可以同进程管理，必要时再拆分。
- 后续 coop/联机可以复用 room 模型，但本计划不实现联机协议。
