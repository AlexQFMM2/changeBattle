# ChangeBattle V2 Plan Index

这个目录只保留当前仍有指导意义的计划。已完成、明显过期、被 RunGame V5 服务化取代的 V4/worker/旧 release 计划已经移到 [`archive/pre-v5`](archive/pre-v5/README.md)。

## 当前状态

- 当前 beta/debug 版本是 `0.1.24`。
- Desktop portable zip 和 Android debug APK 挂 GitHub Release `desk-debug-v0.1.24`。
- 线上 beta 服务器只保留 `latest.json`、下载页、manifests 和增量 objects，不托管完整 zip/apk。
- 正式 room 主线已经收口为 RunGame V5 C/S：服务端权威实体，客户端 scoped view + lightweight command。
- 训练场和 legacy V4 helper 只允许作为本地/历史/开发路径，不能作为正式 room fallback。

## 当前入口

- 当前计划集合：[`current/README.md`](current/README.md)
- RunGame V5 实体化模型：[`current/runGame-v5-entity-model-plan.md`](current/runGame-v5-entity-model-plan.md)
- Runtime 数据标准化：[`current/runtime-data-standardization-migration-plan.md`](current/runtime-data-standardization-migration-plan.md)
- Battle API Docker / 自建服务器：[`current/server-docker-battle-api-plan.md`](current/server-docker-battle-api-plan.md)
- Redis 临时房间连续性：[`current/server-redis-battle-room-continuity-plan.md`](current/server-redis-battle-room-continuity-plan.md)
- Battle server 选择 / Desktop 离线 / 资源缓存：[`current/battle-server-selection-and-offline-assets-plan.md`](current/battle-server-selection-and-offline-assets-plan.md)
- Assets CDN 核心抽象：[`current/assets-cdn-core-plan.md`](current/assets-cdn-core-plan.md)
- Android App 移植：[`current/android-capacitor-app-migration-plan.md`](current/android-capacitor-app-migration-plan.md)
- Desktop EXE launcher：[`current/desktop-exe-launcher-plan.md`](current/desktop-exe-launcher-plan.md)
- Battle V4 AI 策略架构：[`current/battle-v4-ai-tactics-architecture-plan.md`](current/battle-v4-ai-tactics-architecture-plan.md)
- 正式玩法后续：[`formal-game/README.md`](formal-game/README.md)
- UI / 参考资料：[`references/README.md`](references/README.md)

## 红线

- 不把归档中的旧 V4 总计划、旧 V4 清单、旧 Battle V4 目录当当前施工入口。
- 正式 room 不新增旧 draft 同步、聚合休整命令或任何大 draft 写回路径。
- 客户端不保存 room 大 `FormalGameRunV4` / `restRunSnapshot`；刷新和恢复必须拉服务端 scoped view。
- 改数据源必须保留成品游戏 UI，不允许把休整页、战斗页退化成薄页面。
- 存储型资源字段只保存 canonical asset path，不保存 resolved URL。
- 推送 `release` 分支前先检查 `.github/workflows/*` 的 `on:`，推送后用 `gh run list` 确认没有意外发版 workflow。

## 归档

- [`archive/README.md`](archive/README.md)：归档规则。
- [`archive/pre-v5/README.md`](archive/pre-v5/README.md)：V5 服务化前的 V4/worker/旧 release 计划索引。

归档文档只作历史参考。归档里的 V4、formal worker、本地 RunGame、大 draft、旧 assets 口径不能覆盖当前 RunGame V5 C/S 红线。
