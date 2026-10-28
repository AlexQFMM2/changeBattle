# 宝可梦聊天接口

仅扩展现有 API 服务，不改 Web/Desktop 或正式 V5 房间流程。随机队伍、战斗引擎和 normal/balanced AI 复用现有包，聊天局使用独立协调器。

启用 `CHANGEBATTLE_POKEMON_CHAT_ENABLED=true` 且配置 `CHANGEBATTLE_POKEMON_CHAT_TOKEN` 后开放 `/dex/*` 与 `/chat-battles*`；默认关闭，无 token 不开放。部署为原单实例进程，不为此增加多副本。原 `/sessions`、`/rooms` 语义保持，聊天唯一名额不限制原客户端对局。

## 鉴权与身份

使用独立的机器人 Bearer token，原全局服务 token 与客户端鉴权策略保持不变。聊天接口额外接收 `x-changebattle-chat-owner`：由可信机器人服务对渠道/会话/发言人生成的稳定不透明身份，不能来自模型。它不是单独的认证凭证。GET 对局使用 `x-changebattle-instance`；写操作的 `instanceId` 必须匹配健康/availability 返回的进程 epoch。

`GET /health` 保留原字段，增加 `pokemonEnabled`、`chatContractVersion=1`、`chatInstanceId`。

## 接口

- `GET /dex/search?category=pokemon|moves|abilities|items&query=...&offset=0&limit=10`。最多 20 条，中文/英文由现有 dex 解析。结果含来源版本。
- `GET /dex/:category/:id`：英文身份。宝可梦可用 `section=learnset&offset=0` 取得每页 20 项学招，未声明历史世代支持。
- `GET /chat-battles/availability`：`free|self|busy`，只有 self 返回自己的玩家视图，其他调用者不获得对局标识或用户信息。
- `POST /chat-battles`：`{id, operationId, instanceId, issuedAt}`，issuedAt 为毫秒。原子占用名额并调用现有生成器产生六候选。
- `POST /chat-battles/:id/select`：`{operationId, instanceId, revision, selection:[2,5,1]}`。三个唯一编号，第一只首发；合法选择后才生成 p2 三只并创建单打 session。
- `POST /chat-battles/:id/actions`：`{operationId, instanceId, revision, actionId}`，仅可使用本轮返回动作；p1 local / p2 ai。不能提交 raw choice 或指挥 p2。
- `POST /chat-battles/:id/end`：`{operationId, instanceId, revision}`。选队取消，实战调用已有 forfeit。
- `GET /chat-battles/:id?operationId=...`：当前视图；可选操作键返回 done/rejected/not_found。用于响应丢失后核对，不能靠猜测重发。

当前只允许机器人跨渠道合计一局；准备、选队和实战都占用。有效操作后等待五分钟，无效输入和查询不续时。服务端独立定时结束，超时不判胜负。终态释放名额且保留有界结果 24 小时；达到记录上限时拒绝新建，不驱逐活跃局。进程重启对局中断，旧 epoch 的请求拒绝，不自动复活。

写操作键每条玩家消息每局固定，同键改参数报 operation_conflict。先持久保存客户端待执行请求，网络/5xx 不明后查操作状态，未接受才原键重试。旧 revision 报 stale，用户需根据新视图重新指令。首次建局请求超过五分钟拒绝；终态请求不会重新建局。

## 视图与资源

只返回己方队伍/状态、公开对手出场/血量、合法动作、有限公开事件与结算；内部 full snapshot、p2 request、隐藏招式和 AI 决策均不返回。事件由 p1 player stream 投影，窗口不连续时标记截断。固定队伍编号通过稳定身份映射，不按换人后的数组位置猜测。

所有 API 请求都由唯一协调入口串行裁决，避免超时和出招竞争。额外开局/操作限额受机器人端预算、服务端单局/有界记录约束。日志不记录聊天、身份头或 token。

## 验证 / 发布

`pnpm --filter @changebattle-v2/api test:chat-battle`；原流程回归 `pnpm --filter @changebattle-v2/api test:formal-game`。qqChat 另有本地跨仓库 HTTP 检查，平台发送使用替身。

发布前确认旧内存对局已结束或安排维护窗口；只升级服务端，客户端不发版。先服务后机器人开关；回退关闭新能力并切旧程序，不回退原业务数据。尚未以本地测试代替真实平台发送权限验收。
