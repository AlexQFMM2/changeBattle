# ChangeBattle V2 Server Docker / Battle API Plan

## Summary

Android V2 第一版不再尝试在 WebView 内直接加载 Node-only Showdown vendor。Desktop 也逐步从本地内置 BattleService 切到同一个服务器 Battle API。正式路线改为：

```text
Android / Web / Desktop
  -> COS/CDN: 图片、音频、sprites 等公共资源
  -> Battle API: 创建战斗、提交指令、读取 snapshot/timeline JSON
```

服务器侧用 Docker 独立运行 Battle API。公网 API 默认只返回战斗运行所需的最小 JSON，不返回 AI debug / 搜索树 / value breakdown。AI debug 只写服务器日志，后续通过 Loki 查询。

目标是让服务器压力最小、流量可控、部署可回滚，并给 Android APK、Desktop debug/beta、Web debug 一个统一可访问的 BattleService 地址。三端统一后，后续联机、服务端仲裁、AI debug 查询都会更顺。

实施策略：先在当前 Linux 开发机用 Docker Compose 模拟服务器环境，跑通 Battle API + Redis + room 生命周期；本地闭环稳定后，在本地 build image 并用 `docker save` 导出镜像包，上传服务器后 `docker load` 直接运行。服务器不作为主要开发调试/构建环境，只做部署适配、HTTPS/Nginx/CORS 和线上 smoke。

## Design Goals

- 只先 Docker 化 Battle API，不把整个 ChangeBattle 项目一次性塞进 Docker。
- Battle API 对外提供稳定 HTTPS 入口，Android 不依赖 Windows 构建机或局域网服务。
- Desktop debug/beta 默认走服务器 Battle API，统一按 `sessionId` 查服务端日志。
- 旧的 Desktop 内置 in-memory BattleService 只保留为开发/紧急回退，不作为正式主线。
- Web debug 可使用同一个 Battle API，减少三端分叉。
- 资源文件继续全部走 COS/CDN，Battle API 不代理 assets。
- 客户端响应默认精简，不返回 debug 大对象。
- 服务器日志使用 JSON 结构化格式，后续接 Loki / Promtail / Alloy。
- 先支持 debug/beta，稳定后再切正式 stable。

## Target Architecture

```text
Internet
  -> Nginx HTTPS
    -> /changebattle/battle/*
      -> changebattle-battle-api Docker container
        -> apps/api/dist/server.js
        -> stdout JSON logs
          -> Loki stack, optional in v1

Internet
  -> https://assets.65h26i.top/beta/*
    -> Tencent COS CDN assets
```

建议域名：

```text
https://api.65h26i.top/changebattle/battle
```

客户端构建/运行时注入：

```env
VITE_CHANGEBATTLE_MOBILE_BATTLE_SERVICE_URL=https://api.65h26i.top/changebattle/battle
VITE_CHANGEBATTLE_BATTLE_SERVICE_URL=https://api.65h26i.top/changebattle/battle
CHANGEBATTLE_DESKTOP_BATTLE_SERVICE_URL=https://api.65h26i.top/changebattle/battle
```

后续客户端会从“构建时固定 URL”升级为 Desktop / Android App 的运行时 Battle server 选择。官方服务器仍默认指向上面的公网 API；自建服务器使用玩家输入的 `http(s)://host:port/changebattle/battle` 并通过 `/health` 测试；Desktop-only 离线服务由 Electron main 启动本地 Battle API，renderer 只切换 base URL 到 `127.0.0.1`，本地 API 用 `MemoryRedisLike` 模拟 room 所需 Redis 子集。Web 不上线，只作为本地开发和 ChromeAutomation 自动化测试端；Docker 仍是服务器部署和高级玩家自建服工具，不作为普通 Desktop 离线的必需依赖。详细计划见 [`battle-server-selection-and-offline-assets-plan.md`](battle-server-selection-and-offline-assets-plan.md)。

## API Surface

第一版保留现有 BattleService HTTP 形状，并新增正式 room v1。Docker 主入口已经切到 `apps/api/src/server.ts`；`packages/showdown-battle-core/src/server.ts` 只保留 battle-only/dev fallback。

```text
GET    /health
POST   /sessions
GET    /sessions/:sessionId
GET    /sessions/:sessionId/playback-timeline?from=0
POST   /sessions/:sessionId/choice
POST   /sessions/:sessionId/trainer-item
POST   /sessions/:sessionId/forme-change
DELETE /sessions/:sessionId
```

正式 room v1 当前接口：

```text
POST   /rooms
GET    /rooms/:roomId
POST   /rooms/:roomId/heartbeat
DELETE /rooms/:roomId
POST   /rooms/:roomId/formal/select-starters
POST   /rooms/:roomId/formal/prepare-round
POST   /rooms/:roomId/formal/prepare-battle
GET    /rooms/:roomId/battle/snapshot
GET    /rooms/:roomId/battle/playback-timeline?from=0
POST   /rooms/:roomId/battle/choices
POST   /rooms/:roomId/formal/finalize-battle
POST   /rooms/:roomId/formal/finalize-run
GET    /rooms/:roomId/final-result
GET    /rooms/:roomId/ws
```

已完成：最终 `finalize-run`、`final-result`、WebSocket 固定 heartbeat、room disconnected/timeout sweep、容器重启 `server-restarted` 处理、Loki/Promtail 可选 compose profile，以及本地 API smoke。休整 `rest-action` 和 WebSocket draft sync 已在本地 Docker + Web smoke 中跑通。

仍未完成：Desk/Android/公网服务器完整 smoke、Redis 不可用/低内存容量测试、线上 Nginx/证书 smoke，以及 battle 中断后的失败结算细化。

后续如需管理员 debug，不混入普通接口，单独开受保护入口，例如：

```text
GET /admin/sessions/:sessionId/logs
```

## Public Response Policy

公网普通响应只包含客户端运行战斗必须的数据：

- `sessionId`
- 当前 `snapshot`
- 当前 `request`
- HP / 状态 / 场地 / 队伍可见信息
- 增量 playback timeline
- 简短错误码和错误信息

默认不返回：

- AI candidates 全量
- 搜索树
- `valueBreakdown` 全量
- `reasonTags` 全量
- 队伍生成 diagnostics 大对象
- 完整历史 debug
- 内部异常 stack trace

debug 信息只写服务器日志。需要人工排查时，用 `sessionId` / `turn` / `playerId` 到 Loki 查。

## Logging / Loki Plan

Battle API 输出 JSON log 到 stdout，字段建议：

```json
{
  "scope": "battle-ai-choice",
  "sessionId": "battle_xxx",
  "turn": 6,
  "playerId": "p2",
  "mode": "doubles",
  "aiLevel": "champion",
  "selectedChoice": "move 2 -1, move 4 -2",
  "elapsedMs": 1280,
  "searchedDepth": 3,
  "reasonTags": ["ko-current-threat", "avoid-friendly-fire"],
  "warnings": []
}
```

日志分级：

- `info`: session create/close、AI choice summary、battle ended。
- `warn`: invalid choice fallback、slow decision、large response、near session limit。
- `error`: create session failed、Showdown crash、uncaught exception。
- `debug`: value breakdown / diagnostics，只在服务器配置允许时输出。

Loki v1 已加入 compose `observability` profile，默认使用本地/服务器更容易拉取的阿里云 xstack 镜像：

```bash
docker compose -f docker/battle-api/docker-compose.yml --profile observability up -d changebattle-loki changebattle-promtail
```

Promtail 只采集 `changebattle-v2-battle-api` 的 Docker stdout，流标签控制在 `service/channel/scope`；`roomId/sessionId/clientActionId` 作为 structured metadata/JSON 字段查询，不作为 Loki 高基数 label。首次接入已有历史 Docker 日志时，Loki 可能拒绝过旧 timestamp；这不影响 Battle API 主服务，生产首次部署建议用新容器日志或持久化 positions。

## Traffic Policy

Battle API 只传 JSON。粗略目标：

- 单打 20 回合：约 `0.5MB - 3MB`。
- 双打 20 回合：约 `1MB - 6MB`。
- debug 关闭后，正常用户流量应远低于 assets/CDN。

必须避免：

- API 返回完整 AI debug。
- 每次 snapshot 带完整历史大对象。
- 资源文件通过 Battle API 转发。

Nginx 开启 gzip：

```nginx
gzip on;
gzip_types application/json text/plain;
```

## Server Hardening

上线前 Battle API 需要从 dev server 补成公网服务：

- [ ] `CHANGEBATTLE_BATTLE_SERVICE_HOST=0.0.0.0`。
- [ ] 支持 `CHANGEBATTLE_BATTLE_SERVICE_BASE_PATH=/changebattle/battle` 或由 Nginx rewrite。
- [ ] CORS 配置：debug 可宽松，stable 限制来源。
- [ ] 请求体大小限制，例如 `1MB`。
- [ ] session TTL，例如 `2h` 自动清理。
- [ ] session 上限，例如 `maxSessions=200`。
- [ ] 创建 room/session 前检查 Redis/宿主机安全水位，低于阈值时返回服务器繁忙。
- [ ] 单 session 最大回合数 / 最大 rawLog 长度保护。
- [ ] 正式 room 创建的 session 绑定 owner room；正式流程不能绕过 room 直接调用 `/sessions/:sessionId/choice` 推进。
- [ ] debug v1 接受容器重启丢失内存 session；启动后由 Redis room 层把不可恢复战斗标记为 `closed/server-restarted`。
- [ ] 错误响应不暴露 stack trace。
- [ ] 基础 token / channel key，至少保护 debug API。
- [ ] CORS 允许 room token 所需 header：`Authorization`、`Content-Type`、可选 `X-ChangeBattle-Room-Token`。
- [ ] `/health` 返回 session 数、uptime、版本、git sha，但不返回敏感信息。
- [ ] graceful shutdown，容器停止时拒绝新 session 并尽量完成当前请求。

## Docker Scope

第一版容器只跑 Battle API：

```text
changebattle-battle-api
```

暂不容器化：

- COS 上传工具。
- GitHub Actions release 构建。
- Desktop updater 静态对象池。
- Web 静态页托管。

建议服务器目录：

```text
/opt/changebattle/
  docker-compose.yml
  battle-api/
    .env
    logs/              # optional, stdout 优先
```

本地模拟目录可以复用仓库内 `docker/` 示例；本地只暴露 Battle API 到 `127.0.0.1:5191`，Redis 不暴露公网/宿主机公网接口。服务器迁移时尽量复用同一套 compose 服务名和 env key，只替换 public base URL、Nginx 和证书配置。Battle API image 优先本地 build、本地 smoke、本地 `docker save`，服务器只 `docker load` 和 run。

环境变量草案：

```env
NODE_ENV=production
CHANGEBATTLE_BATTLE_SERVICE_HOST=0.0.0.0
CHANGEBATTLE_BATTLE_SERVICE_PORT=5191
CHANGEBATTLE_BATTLE_SERVICE_PUBLIC_BASE_URL=https://api.65h26i.top/changebattle/battle
CHANGEBATTLE_BATTLE_SERVICE_MAX_SESSIONS=200
CHANGEBATTLE_BATTLE_SERVICE_SESSION_TTL_MS=7200000
CHANGEBATTLE_BATTLE_SERVICE_MAX_BODY_BYTES=1048576
CHANGEBATTLE_BATTLE_SERVICE_DEBUG_LOGS=0
CHANGEBATTLE_BATTLE_SERVICE_TOKEN=<server-side-secret>
```

## Nginx Sketch

```nginx
location /changebattle/battle/ {
  proxy_pass http://127.0.0.1:5191;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;

  client_max_body_size 1m;

  gzip on;
  gzip_types application/json text/plain;
}
```

如果 server 自己支持 base path，也可以不 rewrite，直接让容器识别 `/changebattle/battle/*`。

## Client Integration

### Android

- [x] V2 mobile runtime 不再默认创建 in-memory BattleService。
- [x] mobile runtime 优先读取 `VITE_CHANGEBATTLE_MOBILE_BATTLE_SERVICE_URL`。
- [x] mobile runtime 未配置时默认使用公网 debug Battle API。
- [ ] debug 模拟器可临时使用 `http://10.0.2.2:5191`。
- [x] 真机和 release debug 包使用公网 `https://api.65h26i.top/changebattle/battle`。
- [x] 文档明确：V1 是 mobile Showdown bundle，V2 v1 是 server Battle API；离线内置引擎后续单独立项。

### Desktop

- [x] Desktop renderer/API 支持 server-first BattleService。
- [x] Desktop debug/beta 默认读取 `CHANGEBATTLE_DESKTOP_BATTLE_SERVICE_URL` 或 release config，并通过 HTTP `createBattleServiceClient()` 调用服务器。
- [x] Electron main process 当前内置 `createInMemoryBattleService()` 降级为显式开发 fallback。
- [x] fallback 必须有明确 diagnostics：`battle-backend:local-fallback`，避免误以为日志会上服务器。
- [x] 服务器模式下创建战斗失败时，UI 显示简短错误和后端类型，不暴露 token。
- [ ] Desktop update/debug UI 可显示当前 battle backend：`server` / `local-fallback`。
- [x] 服务器模式下所有 AI debug 只进入服务端 JSON log，Desk 客户端不接收大 debug。

### Web

- [x] Web debug 继续通过 `VITE_CHANGEBATTLE_BATTLE_SERVICE_URL` 指向公网 Battle API。
- [ ] Web stable 是否启用服务器 Battle API 后续决定；当前优先 Android 和 Desktop debug/beta。
- [x] Web/Desk/Android 尽量共用同一套 HTTP BattleService client。

## Implementation Slices

### 1. Battle API Production Guard

- [x] 扩展 `packages/showdown-battle-core/src/server.ts` 配置项。
- [x] 加 body size limit。
- [x] 加 session TTL / max session。
- [x] 加精简错误响应。
- [x] 加 JSON structured log helper。
- [x] 默认关闭公网 response debug。
- [x] 增强 `/health`。

### 2. Docker Deployment

- [x] 本地 Docker Compose smoke：Battle API + Redis。
- [x] 本地 room API smoke：create/read/heartbeat/delete。
- [x] 本地 formal run smoke：开始游戏 -> 战斗 -> 结算。
- [x] 本地 WebSocket smoke：room auth、HTTP mutation 后收到 `room.updated`，closed/timeout room 收到 `room.closed` 后客户端停止重连。
- [x] 本地 Web UI smoke：开始正式 singles -> starter -> round -> 休整页，连接在线；业务失败不误报连接失败。
- [ ] 本地故障 smoke：Battle API 容器重启、Redis 不可用、内存安全水位不足。
- [x] 本地 build Battle API image，并记录 image tag / git sha。
- [ ] 本地 `docker save` 导出 image tar，上传服务器后 `docker load`。
- [ ] 服务器 compose 使用已 load image，不在服务器上安装依赖或编译源码。
- [x] 新增 Battle API `Dockerfile`。
- [x] 新增服务器 `docker-compose.yml` 示例。
- [x] 编写 `.env.example`。
- [x] 写 Nginx location 示例。
- [ ] 本地闭环稳定后，服务器首次部署 smoke。

### 3. Loki Observability

- [x] 先保证 Battle API stdout 是 JSON。
- [ ] 可选新增 `loki` + `promtail` / `alloy` compose。
- [ ] 按 `sessionId`、`scope`、`level` 查询日志。
- [x] AI debug 日志只在服务端保留，不进入普通客户端响应。
- [x] Loki 未接完前，stdout JSON + docker logs 作为临时排查路径。

### 4. Client Battle API Switch

- [x] V2 mobile runtime 改为 HTTP BattleService URL。
- [x] 默认 debug 环境可配置模拟器地址。
- [x] 正式 debug APK 指向公网 Battle API。
- [ ] APK 创建正式战斗 smoke。
- [x] Desktop debug/beta 切到公网 Battle API。
- [x] Desktop local fallback 只用于显式开发/紧急回退。
- [x] Web debug 可指向同一公网 Battle API。
- [x] Web 本地 Docker room smoke 的 `roomId/sessionId` 能在 docker logs 中查询到 room 创建、AI choice、choice submit、finalize。
- [ ] 三端创建战斗后的 `sessionId` 都能在服务器日志中查询。

## Test Plan

本地：

```bash
pnpm --filter @changebattle-v2/showdown-battle-core test
pnpm --filter @changebattle-v2/showdown-battle-core typecheck
pnpm --filter @changebattle-v2/api typecheck
pnpm --filter @changebattle-v2/web typecheck
git diff --check
```

API smoke：

```bash
curl -sS http://127.0.0.1:5191/health
curl -sS https://api.65h26i.top/changebattle/battle/health
```

Docker smoke：

```bash
docker compose up -d changebattle-battle-api
docker compose logs -f changebattle-battle-api
curl -sS http://127.0.0.1:5191/health
```

Android smoke：

- [ ] APK 启动横屏无系统白条/灰栏。
- [ ] 首页图片走 COS。
- [ ] 创建 singles 正式战斗成功。
- [ ] 至少提交一次指令成功。
- [ ] Battle API 响应不包含 AI debug 大对象。
- [ ] 服务器日志能按 `sessionId` 查到 AI choice summary。

Desktop smoke：

- [ ] 配置服务器 Battle API 后，桌面端创建正式战斗走公网 API。
- [ ] Desk 服务器模式下至少完成一回合 singles 正式战斗。
- [ ] Desk 服务器模式下至少完成一回合 doubles 正式战斗。
- [ ] 对应 `sessionId` 能在服务器日志里查到 AI choice summary。
- [ ] 客户端响应不包含 AI debug 大对象。
- [ ] 故意断开 Battle API 时，local fallback 或错误提示路径清晰，不静默失败。

## Open Questions

- Battle API 是否需要和现有正式 Web 共享同一个域名，还是独立 `api.65h26i.top`。
- debug token 是否在 APK 内明文可接受；正式阶段是否改为一次性 session token。
- Desktop debug token 是否通过 release config 注入，还是由本地设置页配置。
- Loki 是第一版同时上，还是先 stdout + docker logs，等 API 稳定后再接。
- Redis room 上线后，旧 `/sessions` API 如何限制正式 room session 的直接推进。
- 是否需要为公网 Battle API 单独做 GitHub Actions build/publish image。

## Assumptions

- 服务器按流量计费，因此 assets 永远走 COS/CDN，不走 Battle API。
- Android 第一版允许联网，不要求离线完整战斗。
- Desktop 后续以 server-first 为主，保留本地内置 BattleService 只是开发/紧急 fallback。
- Battle API 是状态型服务，session 保存在容器内存；容器重启会丢失当前战斗，debug/beta 阶段可接受，并由 Redis room 层给客户端明确失败/关闭状态。
- 以后若要 Android 离线运行，需要单独做 V2 mobile Showdown bundle，不混入本计划。
