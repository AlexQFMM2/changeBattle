# ChangeBattle V2 0.1.33 Beta Release Notes

version: 0.1.33
tag:     desk-debug-v0.1.33
branch:  v2

GitHub Release:

https://github.com/AlexQFMM2/changeBattle/releases/tag/desk-debug-v0.1.33

Desktop portable:

https://github.com/AlexQFMM2/changeBattle/releases/download/desk-debug-v0.1.33/ChangeBattle-V2-Desk-portable-debug-v0.1.33.zip

线上 beta 更新：

latest.json: http://119.45.240.157/changebattle-beta/latest.json
download:    http://119.45.240.157/changebattle-beta/

## 本版重点

- 修复正式 room V5 第一轮失败后最终结算输出、承伤、治疗、击杀等战斗统计全为 0 的问题。
- `finalize-battle` 在服务端从 Battle API snapshot/rawLog 生成轻量 per-pokemon battle stats record；`finalize-run` 只汇总该服务端账本生成 settlement。
- 前端不接收金币流水、回合记录或原始战斗日志；结算页只展示服务端返回的最终 settlement。
- 官方服务器需要更新 Battle API 容器；Desktop 的“本地模拟（不用 Docker）”需要更新 Desk 包，因为离线 API 嵌入在 Desktop 内。

## 验收记录

- `pnpm --filter @changebattle-v2/api typecheck` 已通过。
- `pnpm --filter @changebattle-v2/web typecheck` 已通过。
- `pnpm --filter @changebattle-v2/api test:formal-game` 已通过，并覆盖第一轮失败结算非零战斗统计。
- `git diff --check` 已通过。

## 发布边界

- 本版改 API 服务端逻辑和 Desktop 内置离线 API。
- 不改 Android 客户端 UI；Android 走官方/自建 Battle API 时只依赖服务端更新。
- 完整 Desktop zip 挂 GitHub Release；线上 beta 服务器只发布 `latest.json / index.html / manifests / objects`，不托管完整 zip。
