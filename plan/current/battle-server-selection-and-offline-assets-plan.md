# Battle Server Selection / Desk Offline / Asset Cache Plan

## Summary

把“战斗服务器”和“资源来源”从构建时环境变量，升级为玩家可理解、可切换、可检测的运行时设置。玩家侧只面向 Desktop 和 Android App；Web 端不作为上线产品，只保留给本地开发、ChromeAutomation 自动化测试和公网/本地 API smoke。

当前状态：

- 官方服务器、自建服务器、Desktop-only 离线服务的架构方向已落地到正式 room 主线：Renderer 只认 Battle API base URL，不恢复旧本地正式流程。
- Desktop 离线服务使用本机嵌入式 Battle API + `MemoryRedisLike`，进程退出后未结算 room 不恢复；最终 profile/vault 仍写本地存档。
- Android 不内嵌离线 Battle API，默认走官方 Battle API，也允许后续使用自建服务器。
- 公共资源仍默认走 COS/CDN；本地缓存是独立能力，不改变存储字段必须是 canonical asset path 的红线。

目标体验：

```text
主页 -> 网络与离线设置
  -> 战斗服务器：官方服务器 / 自建服务器 / 离线服务(仅 Desk)
  -> 资源缓存：不缓存 / 缓存到本地
```

服务器选择只影响 Battle API / room / sessions / WebSocket；图片、音频、sprites 等公共资源仍默认走 COS/CDN。资源缓存是单独能力：开启后第一次联网下载公共资源，后续 Desktop 优先从本地 cache 读取，允许断网展示大部分资源。

## Goals

- 普通玩家默认使用官方服务器，不需要理解 URL、端口或 Docker。
- 高级玩家可以填自建服务器地址，并通过 `/health` 一键测试。
- Desktop 可以提供“离线服务”选项：由 Electron 自带 Node runtime 启动内置 Battle API，不要求用户安装 Node 或 Docker。
- Android 不展示“离线服务”，只支持官方/自建服务器；Web dev 仅作为测试端跟随同一配置能力，不做玩家体验承诺。
- 战斗服务器配置进入统一 `postService` / BattleService URL 解析层，页面不直接拼 URL。
- 资源缓存配置进入统一 `assetUrl()` / assets provider 层，业务组件不关心 CDN 还是本地 cache。
- 自建服务器教程和 Desk 离线说明写清楚边界：Docker 是开发者/自建服方案，不是普通玩家离线必需品。

## Non-Goals

- 第一版不做账号系统、云存档、中心匹配、联机大厅或 NAT 穿透。
- 第一版不要求 Android 离线运行 Battle API。
- Web 不上线，不做玩家侧服务器设置和完整离线缓存承诺；浏览器能力只服务 ChromeAutomation/dev smoke。
- 第一版不把资源通过 Battle API 代理，Battle API 继续只传 JSON。
- 第一版不要求用户自己安装 Docker 才能玩 Desktop 离线。

## Battle Server Modes

### 1. 官方服务器

默认模式。

```text
https://api.65h26i.top/changebattle/battle
```

行为：

- 创建正式 room、恢复 room、休整同步、战斗 snapshot/timeline/choice、结算全部走官方 Battle API。
- AI debug 和 room 日志按 `roomId/sessionId` 写官方服务器日志/Loki。
- 资源继续走 `https://assets.65h26i.top/beta/`。

### 2. 自建服务器

玩家在主页设置里输入：

- 协议：`http` / `https`
- IP 或域名
- 端口
- base path，默认 `/changebattle/battle`

组合示例：

```text
http://192.168.1.20:5191/changebattle/battle
https://battle.example.com/changebattle/battle
```

保存前必须测试：

```text
GET <baseUrl>/health
```

成功条件：

- HTTP 200。
- `ok:true`。
- `redis:"ok"` 或本地离线服务可接受的等价状态。
- `service` 包含 `changebattle-v2-battle-service`。

失败时：

- 不切换当前有效服务器。
- 显示可读错误，例如“无法连接服务器”“Battle API 版本不匹配”“Redis 不可用”“路径不是 ChangeBattle Battle API”。

教程入口：

- Windows / Linux / NAS Docker Compose 启动 Battle API + Redis。
- 局域网直连 `http://IP:5191/changebattle/battle`。
- 公网建议 Nginx + HTTPS + 443，`5191` 不直接暴露公网。
- Android 真机访问局域网时需要填电脑局域网 IP，不要填 `127.0.0.1`。

### 3. 离线服务，仅 Desktop

只有 Desktop 显示。Electron main 进程启动内置本地 Battle API：

```text
http://127.0.0.1:<allocated-port>/changebattle/battle
```

关键原则：

- 用户不需要安装 Node。
- 用户不需要安装 Docker。
- Electron runtime 自带 Node 能力，Desk 包内携带 Battle API 所需代码/vendor。
- Renderer 仍通过同一套 `postService` 调用 `/rooms`、`/sessions`，只是 baseUrl 从公网切到本地。

影响：

- Desktop 包体会变大，因为需要重新带本地 Battle API / Showdown vendor / 必要运行时依赖。
- 官方服务器日志无法看到离线对局；本地 debug log 可写 Desktop userData/logs。
- 完整离线正式流程需要本地 Battle API 也承载 Redis room 等价能力。第一版不要求用户安装 Redis，也不打包 Redis 进程；在本地 Battle API 内部实现 `MemoryRedisLike`，模拟当前 room 逻辑用到的 Redis 子集。
- `MemoryRedisLike` 只服务 Desktop 离线 API。它保留 room 机制和 HTTP API surface，但进程退出后 room 丢失；长期 profile/vault 仍由 Desktop 本地存档保存。

推荐交互：

```text
服务器不可用。
[重试官方服务器] [切换自建服务器] [启动离线服务]
```

## Local Redis-Like Store

为了最大限度减少前端和后端业务逻辑改动，Desktop 离线第一版不抽一套全新的 room API，也不让前端走 IPC/local worker 分支。做法是把 `apps/api/src/server.ts` 里的 Redis 访问底层抽成 provider：

```ts
type RedisLikeCommandProvider = {
  command(command: string, ...args: string[]): Promise<string | string[] | number | null>;
  close?(): Promise<void>;
};
```

同时把 API server 从当前顶层 singleton 拆成可嵌入 factory，避免 Electron main 里 `import` 后立刻监听端口：

```ts
type BattleApiServerOptions = {
  host: string;
  port: number;
  basePath: string;
  redisProvider: RedisLikeCommandProvider;
  storageKind: "redis" | "memory";
  battleService?: BattleServiceApiV4;
};

createBattleApiServer(options);
startBattleApiServerFromEnv();
```

线上 Docker 使用真实 Redis provider：

```text
RedisSocketProvider
  -> redis://changebattle-redis:6379
```

Desktop 离线使用内存 provider：

```text
MemoryRedisLikeProvider
  -> Map<string, {value, expiresAt}>
  -> Map<string, Set<string>>
  -> setInterval sweep expired keys
```

第一版只模拟当前 room 需要的 Redis 命令：

```text
PING
INFO memory
GET
SET key value PX ttl
DEL
SADD
SREM
SMEMBERS
SCARD
PTTL      # optional, test/debug only
```

`INFO memory` 在离线模式下可以返回合成值，例如 `used_memory` 取当前 JSON/Set 估算值，`maxmemory` 取离线配置上限或 `0`。这样现有内存安全水位逻辑不用分叉。

这样这些主逻辑可以基本保持不变：

- `loadRoom`
- `saveRoom`
- `deleteRoom`
- `countActiveRooms`
- `sweepRoomsOnStartup`
- `redisHealth`
- `cb:room:<roomId>` / `cb:rooms` key 规范

离线 health 建议仍返回客户端可接受状态：

```json
{
  "ok": true,
  "redis": "ok",
  "storage": "memory",
  "basePath": "/changebattle/battle"
}
```

限制：

- 不是完整 Redis 实现，只支持当前 API server 使用的命令子集。
- Electron 退出、崩溃或本地 API 重启后，memory room 丢失。
- 关闭后继续游戏时如果 room 不存在，按“离线房间已结束/无法恢复”处理。
- 后续如果要恢复离线对局，再升级为 `SQLiteRoomStore` 或文件/SQLite 持久化 provider；前端仍不需要分叉。

实现注意：

- 真实 Redis provider 仍按 URL 建连接；Memory provider 不依赖 `CHANGEBATTLE_REDIS_URL`，因此 `ensureRedisEnabled()` 需要改成检查 provider 是否存在，而不是检查 URL 字符串。
- `SET key value PX ttl` 必须记录过期时间；`GET/SMEMBERS/SCARD` 前要懒清理过期 key，后台 sweep 只是辅助。
- `cb:rooms` set 里可能残留已过期 room；`cleanupRoomIndex()` 继续负责清理，Memory provider 不需要实现 Redis 的自动 keyspace notification。
- 命令返回值要尽量贴近当前 parser 已消费的 Redis 返回类型：`PING -> "PONG"`、`SET -> "OK"`、`DEL/SADD/SREM/SCARD -> number`、`SMEMBERS -> string[]`、missing `GET -> null`。

## Config File

Desktop 使用可读写配置文件。建议主文件：

```text
.battleServer.json
```

兼容入口：

- 如后续确实需要隐藏短名，可支持 `.battleServer` 作为同结构 JSON。
- 用户提到的 `.batterServer` 不建议作为主名，避免 typo 固化；如已经存在可做一次性迁移到 `.battleServer.json`。

建议位置：

Desktop portable：

```text
<portable-root>/config/.battleServer.json
```

Desktop userData fallback：

```text
%APPDATA%/ChangeBattleV2/.battleServer.json
```

Android / Web dev：

- 不读本地文件。
- Android 使用 Capacitor Preferences 保存同结构配置。
- Web dev 可用 localStorage / IndexedDB 保存同结构配置，主要用于本地 Docker、公网 API 和 ChromeAutomation smoke。

配置草案：

```json
{
  "version": 1,
  "mode": "official",
  "officialUrl": "https://api.65h26i.top/changebattle/battle",
  "custom": {
    "protocol": "http",
    "host": "",
    "port": 5191,
    "basePath": "/changebattle/battle",
    "lastVerifiedAt": null
  },
  "desktopOffline": {
    "enabled": false,
    "port": 0,
    "actualBaseUrl": null,
    "lastStartedAt": null
  },
  "assetCache": {
    "enabled": false,
    "provider": "cdn-first",
    "version": null,
    "cachedBytes": 0,
    "cachedFileCount": 0,
    "lastUpdatedAt": null
  }
}
```

模式枚举：

```text
official
custom
desktop-offline
```

## API / Code Architecture

### Server config client

新增或扩展 API facade：

```text
apps/api/src/serverConfig.ts
apps/api/src/postService.ts
```

对外能力：

- `getBattleServerConfig()`
- `setBattleServerMode(mode)`
- `setCustomBattleServer(input)`
- `testBattleServer(url)`
- `resolveBattleServiceBaseUrl(runtime)`
- `watchBattleServerConfig(listener)`

### Desktop bridge

Electron main/preload 提供：

```text
desktopApp:getBattleServerConfig
desktopApp:setBattleServerConfig
desktopApp:testBattleServer
desktopApp:startOfflineBattleServer
desktopApp:stopOfflineBattleServer
desktopApp:getOfflineBattleServerStatus
```

本地离线服务启动策略：

- 选择离线模式时启动。
- App 启动时如果上次是离线模式，自动启动。
- 退出 Desktop 时优雅关闭。
- 启动失败时回退到上一次可用模式，并提示错误。

### Android / Web dev storage

Android / Web dev 使用同一套配置结构，但能力差异：

- `official`：可用。
- `custom`：可用。
- `desktop-offline`：隐藏或 disabled，提示“仅桌面端支持”。
- Web dev 不进入玩家发布口径；相关 UI 可以简化，只要满足自动化测试切 API 地址即可。

### postService 接入

`postService` 的 baseUrl 解析顺序：

1. 当前运行时配置选择的 server URL。
2. 构建环境变量 fallback。
3. 官方服务器默认 URL。

所有 room / battle action 都从这个解析层取 URL，包括：

- HTTP `postApi(...)`
- room WebSocket URL
- BattleServiceClientV4 wrapper

页面禁止直接读取 env 拼 Battle API URL。

## UI Plan

Desktop / Android 主页新增“网络与离线”入口，或放入设置页里的独立 tab。Web dev 可以复用该入口用于自动化测试，但不作为上线产品验收。

### 战斗服务器面板

展示：

- 当前模式。
- 当前 base URL。
- 最近一次 `/health` 测试结果。
- RTT。
- Redis/room 状态。

操作：

- 官方服务器：一键选择 + 测试。
- 自建服务器：输入表单 + 测试 + 保存。
- 离线服务：Desktop only，启动/停止/测试。
- 教程按钮：打开自建服务器文档。

### 资源缓存面板

展示：

- 当前是否启用。
- 预计资源大小：约 `4-500MB`。
- 已缓存大小和文件数。
- 当前资源版本。
- 最近更新。

操作：

- 开启缓存。
- 暂停/继续下载。
- 重试失败资源。
- 清除缓存。
- 校验缓存。

提示文案：

```text
开启后会把公共图片、音频、sprites 缓存到本地。第一次加载仍需联网，约 4-500MB；缓存完成后，Desktop 可在断网时展示大部分资源。
```

## Asset Cache Plan

### Desktop first

Desktop 是第一优先级：

- 缓存目录使用 portable cache 或 Electron userData。
- 通过 `assetRegistry` / manifest 枚举公共资源。
- 下载时限速和并发控制，避免启动时打满网络。
- `assetUrl(path)` 优先返回本地 file/custom protocol URL；miss 时回退 CDN。
- 下载失败不阻塞游戏，只提示缓存未完成。

建议缓存目录：

```text
<portable-root>/cache/assets/beta/<relative-path>
```

或：

```text
%APPDATA%/ChangeBattleV2/cache/assets/beta/<relative-path>
```

Desktop 资源 URL 不建议直接暴露 `file://` 给 renderer；优先使用 Electron custom protocol，例如：

```text
changebattle-asset://beta/runtime/items/xxx.png
```

### Android later

Android 第二阶段：

- 使用 Capacitor Filesystem / Cache。
- 注意 Android 存储配额和清理策略。
- 真机第一次下载 500MB 需要 Wi-Fi 提示。
- 暂不承诺完整离线 Battle API，只做资源展示离线。

### Web dev only

Web 只服务开发测试和 ChromeAutomation，不进入玩家侧资源缓存路线。需要时可以做可选轻量 cache 方便自动化 smoke：

- 使用 Cache API / Service Worker。
- 明确提示浏览器可能清理缓存。
- 不承诺完整 500MB 离线可用。

## Release Impact

### Desktop official/custom only

如果只做官方/自建服务器选择：

- Desktop 包体基本不变。
- 不需要重新加入 Showdown vendor。
- GitHub Actions release 仍保持当前约 `138M` 级别。

### Desktop offline service

启用 Desk 离线服务后：

- Desktop release 需要重新纳入本地 Battle API 依赖。
- 需要重新评估 zip 体积和增量对象池。
- 不恢复公共 assets 打包，资源仍通过 CDN 或本地 asset cache。
- 本地 Battle API 依赖必须和服务器 API surface 保持一致。
- Showdown vendor / showdown-client vendor 只为 Desktop 离线服务重新纳入 Desktop 包；Android APK 和官方/自建服务器模式不因此重新打入这些 Node-side vendor。
- 如果包体增长明显，优先做 Desktop release flavor：`official/custom only` 小包作为默认，`with-offline-service` 作为可选包；不要牺牲 Android 包体。

### Asset cache

资源缓存不进入 release zip。

- 用户选择开启后下载。
- cache 不参与增量更新 object pool。
- 资源版本由 CDN manifest / registry 控制。

## Security / Safety

- 自建服务器 URL 不允许 `javascript:`、`file:` 等非 HTTP 协议。
- Web dev 环境下自建 HTTP 服务器可能被 HTTPS 页面 mixed-content 阻止；自动化测试优先使用本地 dev server 或 HTTPS API。
- room token 不写 URL query。
- 自建服务器 health 不上传敏感存档，只做轻量 GET。
- 离线服务只监听 `127.0.0.1`，不监听 `0.0.0.0`。
- 离线服务端口随机分配或配置固定端口时必须检测占用。
- 配置文件不存用户密码、云 token 或 COS 密钥。

## Execution Checklist

## Review Notes

本计划复查后的结论：

- 主方向成立：前端继续只认 Battle API base URL，官方/自建/Desktop 离线只切换 URL，不拆三套正式流程。
- `MemoryRedisLike` 比“另起本地 room store”更适合第一版，因为当前 room 逻辑已经围绕 Redis command 和 `cb:room:*` key 组织，provider 化能保留大部分服务端业务代码。
- 必须先做 `createBattleApiServer(options)` factory，再做 Desktop 离线启动；当前 API server 顶层直接 `listen`，不适合被 Electron main 嵌入。
- Redis command 子集必须包含当前安全水位用到的 `INFO memory`，否则离线 room 创建会卡在容量检查。
- Desktop 离线包会重新带 Node-side Battle API / Showdown vendor，这是离线正式战斗的必要成本；公共 assets 仍然不能回到 release 包。
- Web 只作为 ChromeAutomation/dev smoke，不作为玩家端验收口径；Android 只做官方/自建服务器和后续资源缓存，不做第一版离线 Battle API。

## 2026-07-19 Room / Match / V5 Recheck

当前正式主线已经迁到：

```text
Room Shell
  -> RoomLobbyPage
  -> Match
  -> RunGameV5 server authority
  -> HTTP command
  -> final-result
  -> ack-final-result
  -> 返回房间
```

因此 Desktop 离线服务的边界需要按新模型收口：

- 离线服务必须复用同一套 `POST /rooms`、`POST /rooms/:roomId/matches`、`GET /rooms/:roomId/matches/:matchId/view` 和 `commands/*` API surface。
- Renderer 不新增“离线正式流程”分支；它只从运行时配置拿到 `http://127.0.0.1:<port>/changebattle/battle`，后续仍按 Room Shell + HTTP command 跑。
- WebSocket 仍只做通知和状态；离线模式也启动同一个 `/rooms/:roomId/ws`，不把 command ACK 搬到 WS。
- `RunGameV5` 在离线服务里仍是唯一权威，存进 `MemoryRedisLike` 的 room JSON；前端不回传整份 `formalRunDraft`，也不恢复旧本地 `formalRun` 权威。
- 旧 Desktop `formalGameBridge` / `battleService` 只能保留给训练场、dev fallback 或 legacy 页面；正式 room 主线不得调用它们推进状态。
- 离线服务第一版是“进程内临时房间”，不是“离线可恢复云存档”：Electron 退出或离线 API 重启后，Memory room 丢失；本地 profile/vault 仍能保存最终结算，但未结算 room 按“离线房间已结束/无法恢复”处理。
- `ack-final-result` 后仍要执行已结束 match 清理：清掉完整 `runGameV5/formalRun`，保留轻量 match 索引、结果摘要和 `finalResult` 短期读取。
- 单人房间 V1 不做加入房间；但离线 API 的 room/members/matches 数据结构不能简化成单机直连，否则后续多人/自建服会再次分叉。

### Updated Offline Service Shape

Desktop 离线不是“绕过服务器”，而是“把服务器嵌进 Desktop”：

```text
Electron main
  -> startEmbeddedBattleApi({host:"127.0.0.1", port:0, storage:"memory"})
  -> write runtime actualBaseUrl
Renderer
  -> postService(baseUrl=actualBaseUrl)
  -> RoomLobbyPage
  -> commands/*
Embedded Battle API
  -> RunGameV5
  -> MemoryRedisLike
  -> in-memory BattleService
```

这样和官方/自建服的差别只剩部署位置：

- 官方服务器：Battle API + Redis 在公网服务器。
- 自建服务器：Battle API + Redis 在玩家自己的机器/NAS/云主机。
- Desktop 离线：Battle API + MemoryRedisLike 在本机 Electron main。

### Updated Implementation Red Lines

- 禁止为 Desktop 离线新建 `offlineFormalRun`、`localRoomStore`、`ipc command` 之类平行主线。
- 禁止在正式 room 主线重新依赖 `api.saveFormalGameRun()` 作为权威恢复。
- 禁止让 renderer 直接 import API server、Showdown server 或 Redis provider。
- 禁止离线服务监听 `0.0.0.0`；必须只监听 loopback。
- 禁止把公共 assets 打进 Desktop 离线服务包；资源仍走 asset cache。
- 禁止把 `actualBaseUrl` 的随机端口当长期配置；它是运行态结果，重启后重新分配/刷新。
- 离线 health 必须让同一套 UI 能识别：`ok:true`、`redis:"ok"`、`storage:"memory"`、`service:"changebattle-v2-battle-service"`。

### Updated Cut Plan

1. **Server factory 化**
   - 把 `apps/api/src/server.ts` 拆为 `createBattleApiServer(options)` 和 `startBattleApiServerFromEnv()`。
   - 顶层 env 启动文件只负责读取 env、创建 Redis provider、调用 factory、注册 shutdown。
   - Docker 行为和公网 API 路径保持不变。

2. **Redis provider 化**
   - 把 `redisCommand()` 改成 provider command。
   - 真实 Redis provider 继续走 socket RESP。
   - `MemoryRedisLikeProvider` 覆盖当前 room 需要的命令子集。
   - `ensureRedisEnabled()` 改成 `ensureRoomStoreAvailable()`，离线 memory 也算 available。

3. **嵌入式 Battle API**
   - Electron main 新增 `startOfflineBattleServer / stopOfflineBattleServer / getOfflineBattleServerStatus`。
   - 启动使用 `port:0` 动态分配端口，成功后写入内存运行态和 `.battleServer.json.desktopOffline.actualBaseUrl`。
   - 退出 Desktop 时 stop server；异常退出不承诺恢复未结算 room。

4. **设置 UI 接通**
   - Desktop 点击“离线服务”时先启动本地 API，再 `/health`，成功后保存 mode。
   - 启动失败不覆盖当前有效配置。
   - 官方/自建/离线三种模式切换都必须清当前 room credential，避免旧 room 指向不同服务器。

5. **Room 主线 smoke**
   - 离线模式完整跑：创建房间 -> 创建单局对局 -> ready/start -> starter -> rest -> battle -> victory -> settlement -> 返回房间。
   - 验证所有请求都打到 `127.0.0.1:<port>`，没有公网 Battle API 请求。
   - `ack-final-result` 后 1 分钟清理完整 `runGameV5/formalRun`，房间页仍显示已结束 match。

### 1. 文档和配置模型

- [ ] 新增自建服务器教程文档。
- [ ] 定义 `.battleServer.json` schema 和迁移规则。
- [ ] 在 README / plan index 标记官方/自建/Desk 离线/资源缓存路线。

### 2. 服务器选择基础层

- [ ] 新增 server config storage adapter：browser / desktop / mobile。
- [ ] `postService` 改为读取运行时 server config。
- [ ] room WebSocket URL 改为读取同一 base URL。
- [ ] BattleServiceClientV4 wrapper 改为读取同一 base URL。
- [ ] 增加 `/health` 测试 helper 和标准错误。

### 3. UI 第一版：官方 / 自建

- [ ] 主页或设置页增加“网络与离线”入口。
- [ ] 官方服务器模式可一键恢复默认。
- [ ] 自建服务器表单支持协议、host、port、basePath。
- [ ] 保存前必须 health 测试成功。
- [ ] 当前服务器和 RTT 在 UI 中可见。

### 4. Desktop 离线服务

- [ ] `apps/api/src/server.ts` 拆成可嵌入 `createBattleApiServer(options)` 和 env 启动入口，Docker 行为保持不变。
- [ ] 抽 `RedisLikeCommandProvider`，线上 provider 继续使用真实 Redis，`ensureRedisEnabled()` 改为检查 provider。
- [ ] 新增 `MemoryRedisLikeProvider`，支持 `PING/INFO memory/GET/SET PX/DEL/SADD/SREM/SMEMBERS/SCARD/PTTL` 和过期 key sweep。
- [ ] 本地离线 health 返回 `redis:"ok"` 且标记 `storage:"memory"`。
- [ ] Electron main 加本地 Battle API 启停能力。
- [ ] Desktop preload 暴露离线服务 bridge。
- [ ] Desktop release 重新纳入必要 Battle API runtime/vendor。
- [ ] Renderer 离线模式 baseUrl 切到 `127.0.0.1:<port>`。
- [ ] 端口 `0` 表示动态分配；启动成功后把实际 `actualBaseUrl` 写入运行时状态，不把旧随机端口当永久配置。
- [ ] 离线服务只监听 loopback。
- [ ] 离线日志写 Desktop 本地 logs。
- [ ] official/custom/offline 三模式切换 smoke。
- [ ] Electron 退出后 memory room 丢失时，继续游戏显示“离线房间已结束/无法恢复”，不静默重建旧局。

### 5. 资源缓存：Desktop first

- [ ] 定义 assets cache manifest 和版本字段。
- [ ] Desktop 下载器支持进度、暂停、重试、清除。
- [ ] `assetUrl()` 支持 local cache provider。
- [ ] 缓存 miss 自动回退 CDN。
- [ ] 缓存完成后断网检查首页、休整、战斗、图鉴、商店、音频。

### 6. Android / Web dev 后续

- [ ] Android 支持官方/自建服务器设置。
- [ ] Android 资源缓存评估 Capacitor Filesystem 配额。
- [ ] Web dev 支持官方/自建服务器设置，目标是 ChromeAutomation 和本地 Docker smoke。
- [ ] Web dev 资源缓存只做可选测试能力，不进入玩家验收。

## Test Plan

- 官方服务器：
  - `GET /health` 成功。
  - 新开正式 room，完成 starter -> round -> rest。
  - 进入战斗并提交一次 choice。

- 自建服务器：
  - 输入错误 URL 显示可读错误，不覆盖当前有效配置。
  - 输入本地 Docker URL 可保存并完成 room smoke。
  - Android 真机用局域网 IP 可连通。

- Desktop 离线：
  - 无公网时 Desktop 能启动本地离线 Battle API。
  - `/health` 返回 `redis:"ok"`、`storage:"memory"`，且实际 base URL 使用当前启动端口。
  - 正式 room flow 能走本地 baseUrl。
  - 本地 API 使用 `MemoryRedisLike` 后，`POST /rooms -> starter -> round -> rest -> battle -> finalize` 路径和官方服务器一致。
  - room 数量上限、body size、TTL、closed/final-result 读取在 memory provider 下和 Redis provider 下表现一致。
  - 退出 Desktop 后本地服务关闭。
  - 离线模式不要求用户安装 Node/Docker。
  - 本地 API 重启后旧 memory room 不恢复，客户端给出明确“离线房间已结束/无法恢复”提示。

- 资源缓存：
  - 首次下载显示进度。
  - 中断后可重试。
  - 已缓存资源优先走本地。
  - 未缓存资源回退 CDN。
  - 清除缓存后恢复 CDN。

## Assumptions

- 官方服务器仍是 debug/beta 阶段默认路径。
- Docker 是服务器部署和开发者自建服工具，不是普通玩家离线依赖。
- Desktop 离线服务需要重新评估包体，但仍不把 500MB 公共 assets 打回 zip。
- Desktop 离线第一版使用 `MemoryRedisLike`，目标是最小改动跑通本机完整 room API；离线 room 持久化留到第二版。
- 完整 Android 离线 Battle API 是后续大工程，不混入本计划第一版。
