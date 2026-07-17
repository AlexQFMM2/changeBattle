# Formal Run Server Room v1 制作清单

## Summary

本清单用于执行 `server-redis-battle-room-continuity-plan.md`：把正式流程从“本地 formalRun 权威 + 本地 BattleService”逐步改成“服务器临时 room 权威 + 云端 battle snapshot/timeline/choice”，范围只覆盖一局正式游戏从开始到最终结算。

不做账号系统、不做长期云存档、不接训练场/图鉴/长期仓库。客户端长期 profile/vault 仍在本地；服务器 room 只保存本局连续性，最终结算返回 `settlement + profileDelta + vaultDelta` 后关闭。

目标执行顺序：

0. 本地 Docker 模拟环境跑起来。
1. Redis 配置完。
2. API 迁移完整。
3. 本地点击开始游戏成功连上房间。
4. checkpoint 和交互计算通过中转页收口。
5. 实现网络连接和网络状态全局组件。
6. Loki 接入。
7. 战斗页完整接入。
8. 结算返回更新。

## 2026-07-17 Progress Snapshot

- [x] 本地 Docker `Battle API + Redis` 已跑通，`GET /health` 返回 `redis:"ok"`。
- [x] `apps/api` 已成为 room 主服务入口，legacy battle-only server 保留在 battle-core。
- [x] Web 正式流程已完成 room 前半段：开始游戏、服务端生成 starter、选择 starter、服务端生成 round plan、进入休整。
- [x] Web 正式战斗闭环已完成本地 smoke：休整页 `prepare-battle`、room-aware BattleV4 snapshot/timeline/choice、`finalize-battle`、进入 settlement。
- [x] WebSocket room 长连接已完成本地 smoke：`/rooms/:roomId/ws` 首包 auth、`room.ready`、`room.updated`、`rest.syncDraft`、`rest.action`、`sync.ack/sync.failed`。
- [x] 休整页 RunGame 更新已改成“本地先改 -> 异步同步 -> ACK 静默 -> 失败回滚/提示”；保存按钮在正式 room 模式隐藏。
- [x] `postService.ts` 已接入 room action registry，并统一标准错误、token header、timeout 和连接状态。
- [x] 全局连接 badge 已接入 WebSocket 优先状态：在线、同步中、重连中、连接失败；业务失败不再误报为网络失败。
- [x] 前端已补恢复保护：正式中转页不再依赖 rAF-only 调度，刷新/热更新时不会在 formalRun 读完前跳回主菜单，战斗页轮询不会被 run patch 反复打断。
- [ ] 尚未完成：最终 `finalize-run` / `final-result` / 本地 profile-vault delta 写回、room 过期清理与容器重启 `server-restarted` 自动标记、Loki、Desk/Android/公网服务器 smoke，以及故障/容量测试。

## 0. 本地 Docker 模拟环境

- [x] 新增或扩展本地 Docker Compose，只启动 `changebattle-battle-api + redis`，可选 Loki 后置。
- [x] 本地 compose 和服务器 compose 尽量同构，服务名、env key、Redis URL、端口策略保持一致。
- [x] 本地 Battle API 暴露到 `127.0.0.1:5191`，方便 Web/Desk/Android 模拟器调试；Redis 只在 Docker network 内访问。
- [x] Web/Desk/App debug 配置可切换到本地 Battle API URL。
- [x] 本地先跑通 `/health`、Redis health、room create/read/heartbeat/delete。
- [ ] 本地模拟容器重启，确认不可恢复 battle room 会标记 `closed/server-restarted`。
- [ ] 本地模拟 Redis 不可用和内存安全水位不足，确认返回可展示错误。
- [ ] 本地 room + battle + formal run 全链路稳定后，再迁移服务器。
- [ ] 本地 `docker build` 生成 Battle API image，使用 `docker save` 导出镜像包。
- [ ] 镜像包上传服务器后，服务器只执行 `docker load` 和 compose run，不做源码构建、依赖安装或 TypeScript 编译。

验收：

- [x] 本机 Docker 环境不用公网服务器也能跑完整 room smoke。
- [ ] 本地配置和服务器配置差异只保留域名、证书、Nginx、安全组和 release channel。
- [ ] 服务器部署阶段不承担主要开发调试，只做线上 smoke 和日志确认。
- [ ] 服务器部署可从本地导出的 image tar 恢复，不依赖服务器网络下载 npm/pnpm 依赖。

## 1. Redis 配置完

- [x] Docker compose 增加 Redis 服务，只允许 Battle API 内网访问，不暴露公网端口。
- [x] Redis 配置 `maxmemory=128mb` 和 `maxmemory-policy noeviction`，满员时由应用层明确拒绝新 room。
- [x] Battle API 增加 Redis 连接配置：`REDIS_URL`、`ROOM_MAX_COUNT=100`、`ROOM_MAX_BYTES=1048576`。
- [x] 创建 room 前检查 Redis/宿主机安全水位，剩余内存低于安全阈值时拒绝新房间并提示“服务器已爆满，稍等片刻再试试”。
- [x] 定义 room key 规范：`cb:room:<roomId>`、可选索引 key、TTL key。
- [ ] 定义 room TTL：活跃 room 每次成功读写刷新；`ended` room 保留 30 分钟只读 final result。
- [ ] 定义 Battle API 重启降级：debug v1 不恢复内存 battle session，启动时把不可恢复的 battling room 标记为 `closed/server-restarted`。
- [x] 实现 Redis health check，Battle API `/health` 可展示 Redis 是否可用，但不泄露连接信息。
- [x] 增加 Redis 不可用时的精简错误响应：不静默回本地流程。
- [ ] 本地和服务器分别跑一次 Redis smoke：写入、读取、TTL 刷新、删除。

验收：

- [x] 服务器只开放 `443`；Redis 端口不对公网开放。
- [x] Battle API 容器能访问 Redis。
- [ ] Redis 重启/不可达时客户端能收到明确“服务器状态不可用”错误。

## 2. API 迁移完整

- [x] 新增 `apps/api/src/postService.ts`，作为三端统一服务器交互门面；页面和流程层不直接散写 `fetch`。
- [x] `postService.ts` 对外提供 `postApi(actionName, input)` 风格调用，例如 `postApi("getRandomTeam", {})`、`postApi("rooms.start", input)`。
- [x] `postService.ts` 内部维护 action registry：action name、endpoint、method、标准 input/output、错误码、是否需要 room token、是否需要幂等 id。
- [x] `postService.ts` 统一注入 base URL、`roomToken` header、`clientRequestId/clientActionId`、timeout、AbortSignal 和 CORS 所需 header。
- [x] `postService.ts` 统一返回标准结果：`ok/data` 或 `ok:false/error/retryable/backend/statusCode`，页面不直接解析原始 fetch exception。
- [x] `postService.ts` 与全局 connection monitor 联动，更新 pending 状态、RTT、最近成功请求时间和连续失败次数。
- [x] room endpoints、battle choice、finalize、后续 `getRandomTeam` 等服务器函数都必须先接入 registry，再给业务页面调用。
- [ ] 新增独立 room store 抽象，隐藏 Redis 读写、TTL、JSON size limit、token hash 校验；当前逻辑仍在 API server 内部。
- [x] `roomId` 使用 18 bytes random base64url；`roomToken` 使用 32 bytes random base64url。
- [x] Redis 只保存 `sha256(roomToken)`，日志和普通响应不输出明文 token。
- [x] HTTP `roomToken` 使用 `Authorization: Bearer <roomToken>` 或专用 header 传递；WebSocket token 通过首条 auth 消息传递，不放 URL query string。
- [x] 定义 room 状态结构：`formalRun`、`revision`、`status`、`connectionState`、`activeBattle`、`closeReason`、时间戳、幂等映射。
- [x] 明确 `status` 只表示正式流程阶段；房间是否可继续由 `connectionState` 和 `closeReason` 判断。
- [x] 当前所有推进型 room mutation 使用进程内 per-room lock；Redis CAS/Lua 原子化留作后续增强。
- [x] 新增 `POST /rooms`：创建正式流程 room，返回 `roomId / roomToken / formalRun`。
- [x] 新增 `GET /rooms/:roomId`：恢复 room，返回服务器权威 `formalRun` 和可选 battle summary/snapshot。
- [x] 新增 `POST /rooms/:roomId/formal/select-starters`。
- [x] 新增 `POST /rooms/:roomId/formal/prepare-round`。
- [x] 新增 `POST /rooms/:roomId/formal/rest-action`，用于治疗、交换、购买、训练学习等强校验休整操作即时 checkpoint。
- [x] 新增 `POST /rooms/:roomId/formal/sync-rest-draft`，作为 WebSocket 断线时的休整 draft HTTP fallback。
- [x] 新增 `GET /rooms/:roomId/ws`，用于 room 级 WebSocket 长连接、认证、ACK、广播和错误通知。
- [x] 新增 `POST /rooms/:roomId/formal/prepare-battle`，支持 `clientRequestId` 和 `baseRevision`。
- [x] 新增 `POST /rooms/:roomId/battle/choices`，支持 `clientActionId / expectedTurn / expectedRqid`。
- [x] 新增 `POST /rooms/:roomId/formal/finalize-battle`。
- [ ] 新增 `POST /rooms/:roomId/formal/finalize-run`。
- [ ] 新增 `GET /rooms/:roomId/final-result`，只允许 ended room 短期读取。
- [x] 新增 `POST /rooms/:roomId/heartbeat`。
- [x] 新增 `DELETE /rooms/:roomId`，用于主动关闭 room。
- [x] 给 heavy job 增加并发限制：队伍生成、AI 选择、正式流程大计算不能无限并发打满 2C/2G。
- [ ] 给 AI/队伍生成设置单次 timeout：AI 超时返回 best-so-far 或合法 fallback，队伍生成超时返回可展示错误。
- [ ] 普通响应默认不返回 AI debug 大对象；debug 只进服务端日志。

验收：

- [ ] 错误 token 不能读取或推进 room。
- [ ] `maxRooms=100` 时超额返回服务器繁忙。
- [ ] 单 room JSON 超过 1MB 时拒绝写入并记录服务端错误日志。
- [ ] 并发推进同一个 room 时，只能有一个 mutation 成功提交。
- [ ] 所有 room endpoint 错误响应都精简、可展示、无内部 stack/token。
- [x] CORS 允许 `Authorization`、`Content-Type`、可选 `X-ChangeBattle-Room-Token` 等 room 请求 header。
- [ ] API 层测试覆盖 `postApi` 成功响应、标准错误、网络失败、timeout、room token header、幂等 id 注入。

## 3. 本地点击开始游戏成功连上房间

- [x] 客户端正式流程入口改成先调用 `POST /rooms`，而不是直接创建本地 `formalRun` 作为唯一权威。
- [x] 开局请求只上传必要的本地 snapshot：`profileSnapshot`、`playerVaultSnapshot`、`mode`、seed/options。
- [x] 服务器创建 room 后返回首个 `formalRun` checkpoint。
- [x] 客户端本地保存 `roomId + roomToken` 和最近展示 cache。
- [x] “继续游戏”优先使用本地 room credential 调 `GET /rooms/:roomId` 恢复。
- [ ] room 不存在、过期、关闭、token 错误时，显示明确恢复失败提示。
- [x] 本地长期 profile/vault 不上传为云存档；room 只保存本局正式流程。

验收：

- [x] Web 点击开始正式游戏能拿到 room credential。
- [ ] Desk/Android 点击开始正式游戏都能拿到 room credential。
- [x] Web 刷新/重启后能通过 room credential 回到当前正式流程。
- [x] room 创建失败不静默退回标题或休整页。

## 4. Checkpoint 和交互计算：中转页

- [x] 正式 server room 模式移除手动保存按钮。
- [x] 休整页继续保留本地 draft，保证非金币类预览、技能调整草稿、交换预览等交互流畅。
- [x] 治疗、交换、购买、训练学习调用 `rest-action` 强校验即时更新 room checkpoint。
- [x] 其余 RunGame 更新调用 `sync-rest-draft`：队伍排序/首发、背包携带/卸下/丢弃/使用/TM/系统道具重铸、出售、打听、重随、医疗保险、训练换课、灵魂蛋领取、进入战斗/结算/放弃前 checkpoint。
- [x] 休整同步改成“本地先改、异步同步、ACK 静默、失败回滚到最近确认 checkpoint 并提示 `网络异常，xx操作未成功`”。
- [x] 业务失败保留当前页面并展示业务错误，不污染全局连接状态。
- [ ] 后续仍可把休整操作进一步 command 化，减少完整 `formalRunDraft` 信任面。
- [x] 第一版先不做完整反作弊；服务端只做结构/边界校验，后续再把休整操作完全 command 化。
- [x] 未进入关键 checkpoint 前，刷新/重连丢弃未提交的非金币 draft，恢复服务器 checkpoint。
- [x] 进入战斗按钮改成进入中转页，由中转页提交当前 rest draft 到 `prepare-battle`。
- [x] `prepare-battle` 校验 `baseRevision / formalRun.id / currentRoundIndex / status / size`。
- [ ] revision 不匹配时拒绝 draft，并返回服务器当前 checkpoint 给客户端恢复。
- [x] `prepare-battle` 成功后冻结本地 rest draft，返回或复用同一个 `battleSessionId`。
- [x] 战斗结束中转页调用 `finalize-battle`，由服务器结算单场并推进 formalRun。
- [ ] `finalize-battle` 支持非正常战斗结果：`battle-ended`、`forfeit`、`timeout`、`server-restarted`。
- [x] `finalize-battle` 返回的新 formalRun 覆盖本地 cache。
- [x] 所有中转页失败都显示可读错误和“重试/返回当前 checkpoint”的明确入口。

验收：

- [x] 多次点击进入战斗不会创建多个 battle session。
- [x] `prepare-battle` 响应丢失后，重试同 `clientRequestId` 返回同一个 session。
- [x] 旧休整页 draft 不能覆盖战斗后的服务器 checkpoint。
- [x] `rest-action` / `sync-rest-draft` 响应丢失后，可通过 room WebSocket/HTTP fallback 重拉当前 checkpoint；相同 `clientActionId` 不重复提交。

## 5. 网络连接和网络状态全局组件

- [x] 新增全局 room connection monitor，维护请求 RTT、最近成功请求时间、连续失败次数、在线/同步中/重连/失败状态。
- [x] 正式 room 进入后建立 WebSocket 长连接；任意成功 room mutation 也刷新 `lastHeartbeatAt`。
- [ ] 正式 room 流程活跃时补固定 60 秒 heartbeat 定时器。
- [ ] 心跳不做后台强保活；用户长时间不操作、页面挂起或 App 被系统杀掉，room 超时按断线/放弃处理。
- [ ] 5 分钟无有效心跳或请求时，客户端进入 reconnecting；服务器标记 disconnected。
- [ ] 10 分钟无响应后，服务器关闭 room；客户端显示 room 已过期/关闭。
- [ ] 新增通用连接遮罩/弹窗，覆盖 `connecting`、`reconnecting`、`submitting`、`recovering`、`failed`；当前已有左下角状态徽标。
- [x] 开始游戏、恢复 room、进入战斗、提交指令、战斗结算、最终结算都复用同一个连接状态来源。
- [x] 新增最小全局延迟信号组件，不绑定 BattleV4Page。
- [x] 延迟信号第一版显示连接状态和 RTT；只采样轻量请求，避免把重计算耗时当成网络延迟。
- [x] Battle/Rest/Transition/Settlement 页面都能读取同一个网络状态。
- [x] 离线/重连状态只影响 UI 和恢复流程，不直接改变游戏判定。

验收：

- [ ] Battle API 暂时不可达时显示全局重连弹窗，不静默跳页；当前会显示状态徽标和操作错误。
- [x] 网络恢复后能自动拉取 room/snapshot 并恢复页面。
- [x] 延迟信号在正式流程全页面保持一致。

## 6. Loki 接入

- [ ] Docker compose 增加 Loki 和 Promtail/Alloy，第一版只收 Battle API stdout JSON log。
- [x] 服务端日志统一 JSON 字段：`scope`、`roomId`、`sessionId`、`turn`、`playerId`、`mode`、`status`、`elapsedMs`、`warnings`。
- [x] AI debug 日志增加 `roomId/sessionId` 关联，但不进入普通客户端响应。
- [x] 日志不记录明文 `roomToken`、玩家隐私原文或大体积无用对象。
- [ ] Loki 标签控制基数：优先 `service/channel/scope`，`roomId/sessionId` 可作为字段查询，避免高基数标签炸内存。
- [ ] 设置 debug/beta 保留策略，优先保当天/近几天日志。
- [ ] 预留 COS 归档入口：每日压缩 JSONL 或重要 room 日志包后续上传 COS。

验收：

- [ ] 能按 `roomId` 查询一局从创建到结算的关键日志。
- [ ] 能按 `sessionId` 查询 AI choice summary。
- [ ] 普通接口响应确认没有完整 AI debug/value breakdown。
- [x] Loki 未接完前，stdout JSON + docker logs 也能临时按 `roomId/sessionId` 排查。

## 7. 战斗页完整接入

- [x] BattleV4Page 保持消费 `api.battleService` 抽象，但正式 room 模式使用 room-aware battle client。
- [x] 进入战斗页先显示“正在连接战斗服务器”，完成 room 恢复和 snapshot 拉取后再解锁指令 UI。
- [x] snapshot/timeline/choice 全部来自云端 Battle API，不再使用本地内存 BattleService 作为正式路径。
- [x] 正式 room 创建的 session 绑定 owner room；正式战斗不能绕过 room 直接调用 `/sessions/:sessionId/choice` 推进。
- [x] `submitChoice` 带 `clientActionId / expectedTurn / expectedRqid`。
- [ ] submit 超时/失败后先拉 `GET /rooms/:roomId` 和当前 snapshot，判断是否仍需行动，再决定重试或恢复。
- [x] 重复 `clientActionId` 不重复执行指令，只返回已处理后的 snapshot 或当前 snapshot。
- [x] timeline 播放使用 `previousIndex` 增量拉取；断线恢复后从最后成功 index 续播。
- [x] 战斗页期间本地 formalRun cache 只展示，不能被旧 draft 覆盖。
- [x] 战斗结束不直接本地结算，进入中转页调用 `finalize-battle`。

验收：

- [x] singles 正式战斗能进入并提交至少一次指令。
- [ ] doubles 正式战斗能进入并提交至少一次 joint choice。
- [ ] 提交指令响应丢失不会复读旧指令，也不会卡死在“检查中”。
- [ ] Battle API 返回错误时显示后端类型和简短错误。
- [ ] Battle API 容器重启导致 session 丢失时，客户端显示 `server-restarted`，并按失败/关闭规则恢复。
- [ ] 战斗中关闭/退出/超时但 room 仍在时，能通过非正常战斗结果按失败结算。

## 8. 结算返回更新

- [ ] `finalize-run` 由服务器根据权威 room formalRun 生成最终结算。
- [ ] 返回 `settlement / profileDelta / vaultDelta / summary`。
- [ ] 返回稳定 `settlementId`。
- [ ] `finalize-run` 必须幂等；重复调用不重复发奖、不重复推进。
- [ ] 客户端本地 profile/vault 记录已应用的 `settlementId`，防止最终响应丢失后重复应用 delta。
- [ ] 客户端收到 final result 后应用本地 profile/vault delta。
- [ ] 本地写入成功后，客户端 ACK 或调用关闭接口，room 进入可清理状态。
- [ ] 如果最终结算响应丢失，客户端可用 `GET /rooms/:roomId/final-result` 在 30 分钟内读取。
- [ ] final result 读取只允许 ended room，不允许继续推进游戏。
- [ ] 结算应用失败时保留 room credential 和 final result，允许用户重试本地写回。

验收：

- [ ] 最终结算响应丢失后能重新取回同一个 final result。
- [ ] 本地 profile/vault 只应用一次 delta。
- [ ] room 结束后不能继续 prepare battle 或 submit choice。

## 横向测试清单

- [ ] Room store/token 单测：创建、读取、错误 token、TTL 刷新、关闭、ended 清理。
- [ ] Room capacity 单测：内存安全水位不足时拒绝创建 room。
- [ ] Room restart 单测：Battle API 重启后不可恢复 battle room 标记为 `closed/server-restarted`。
- [ ] 幂等单测：prepare battle、submit choice、finalize battle、finalize run。
- [ ] CAS/lock 单测：同 room 并发推进只有一个成功。
- [ ] Revision 单测：旧 `baseRevision` 不能覆盖新 checkpoint。
- [ ] Rest-action 单测：治疗、交换、购买、训练学习即时更新 checkpoint，重复 `clientActionId` 不重复扣钱或重复改状态。
- [ ] Draft sync 单测：队伍、背包、出售、打听、重随、医保、训练换课、灵魂蛋等 RunGame 更新可写入 checkpoint，旧 revision 被拒绝。
- [x] WebSocket smoke：auth -> `room.ready` -> `rest.syncDraft` -> `sync.ack`，revision 正常递增。
- [x] WebSocket rest-action smoke：auth -> `rest.action shop.buy` -> `sync.ack`，购买成功且 revision 正常递增。
- [x] Web UI smoke：开始正式 singles -> starter -> round -> 休整页，连接显示在线；治疗金币不足显示业务错误且不误报连接失败。
- [ ] Rest-action UI 测试：pending -> ACK 更新本地 cache，失败回滚；committed 操作不被 prepare-battle 重复提交。
- [ ] 网络恢复测试：创建战斗响应丢失、提交指令响应丢失、App/Desk 重启恢复。
- [ ] 心跳测试：5 分钟 disconnected，10 分钟 closed，ended 30 分钟 final-result。
- [ ] 响应体测试：普通 API 不包含 AI debug 大对象。
- [ ] 容量保护测试：`maxRooms=100`、room JSON `<=1MB`、heavy job 并发限制。
- [ ] 端到端 smoke：开始游戏 -> 选择 starter -> 生成赛程 -> 休整 draft -> 进入战斗 -> 提交指令 -> 战后结算 -> 最终结算 -> 本地 delta 写回。
- [ ] Battle中断 smoke：战斗中关闭/退出，room 仍在则按失败结算；room 已清理则按结束/放弃提示。

## 必跑验证

```bash
pnpm --filter @changebattle-v2/showdown-battle-core test
pnpm --filter @changebattle-v2/showdown-battle-core typecheck
pnpm --filter @changebattle-v2/api typecheck
pnpm --filter @changebattle-v2/web typecheck
pnpm --filter @changebattle-v2/desktop typecheck
pnpm --filter @changebattle-v2/mobile typecheck
git -C changeBattleV2 diff --check
```

## Stop Point

本清单完成时，应达到：

- Redis room 可以支撑正式流程连续性。
- 三端都能从开始游戏进入服务器房间。
- 正式战斗页通过云端 Battle API 完成交互。
- 网络波动可以通过 room/snapshot/timeline 恢复。
- 最终结算能返回本地 profile/vault delta 并安全写回。
- 战斗中关闭、退出、容器重启等不可恢复情况有明确失败/关闭路径。
- AI debug 已进入服务端日志链路，不再塞进普通客户端响应。

不要求本阶段完成：

- 账号系统。
- 长期云存档。
- 训练场/图鉴/长期仓库服务器化。
- 联机/coop room 协议。
- COS 日志归档自动化。
- 完整反作弊与休整操作 command 化。
