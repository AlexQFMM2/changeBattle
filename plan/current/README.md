# Current Plans

这些计划是当前仍有指导意义的施工入口。部分文件记录了从旧 room / V4 迁到 V5 的过程；若文件内部出现 `formalRunDraft`、`syncDraft`、`rest-action` 等词，必须按红线语境理解，不得恢复为正式主线入口。

## Core Architecture

- [`runGame-v5-entity-model-plan.md`](runGame-v5-entity-model-plan.md)：RunGame V5 实体化权威模型。
- [`runtime-data-standardization-migration-plan.md`](runtime-data-standardization-migration-plan.md)：运行时数据标准化迁移。
- [`formal-room-lobby-match-refactor-plan.md`](formal-room-lobby-match-refactor-plan.md)：Room / Match / FormalRun 三层重构历史到 V5 过渡。
- [`formal-run-server-room-implementation-checklist.md`](formal-run-server-room-implementation-checklist.md)：Formal Run Server Room 制作清单。

## Server / Offline / Release Runtime

- [`server-docker-battle-api-plan.md`](server-docker-battle-api-plan.md)：Battle API Docker / 自建服务器。
- [`server-redis-battle-room-continuity-plan.md`](server-redis-battle-room-continuity-plan.md)：Redis 临时房间连续性。
- [`battle-server-selection-and-offline-assets-plan.md`](battle-server-selection-and-offline-assets-plan.md)：Battle server 选择、Desktop 离线服务、资源缓存。
- [`assets-cdn-core-plan.md`](assets-cdn-core-plan.md)：Assets CDN 核心抽象。
- [`desktop-exe-launcher-plan.md`](desktop-exe-launcher-plan.md)：Desktop EXE launcher。

## Client / Gameplay

- [`android-capacitor-app-migration-plan.md`](android-capacitor-app-migration-plan.md)：Android App 移植。
- [`battle-v4-ai-tactics-architecture-plan.md`](battle-v4-ai-tactics-architecture-plan.md)：Battle V4 AI 策略架构。

## Red Line

正式 room 主线以 RunGame V5 C/S 为准。客户端不上传大 draft、不保存 room 大 run、不把归档 V4 计划当 fallback。
