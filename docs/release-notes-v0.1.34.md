# ChangeBattle V2 0.1.34 Beta Release Notes

version: 0.1.34
tag:     desk-debug-v0.1.34
branch:  v2

GitHub Release:

https://github.com/AlexQFMM2/changeBattle/releases/tag/desk-debug-v0.1.34

Desktop portable:

https://github.com/AlexQFMM2/changeBattle/releases/download/desk-debug-v0.1.34/ChangeBattle-V2-Desk-portable-debug-v0.1.34.zip

Android debug APK:

https://github.com/AlexQFMM2/changeBattle/releases/download/desk-debug-v0.1.34/ChangeBattle-V2-Android-debug-v0.1.34.apk

线上 beta 更新：

latest.json: http://119.45.240.157/changebattle-beta/latest.json
download:    http://119.45.240.157/changebattle-beta/

## 本版重点

- 修复正式 room 休整人工反馈：医疗保险弹窗、神战关闭后 NPC 过滤、课程返回层级、训练结果弹窗关闭、商店刷新费用、队伍排序后战斗首发顺序、结算恢复卡死等。
- 玩家 starter 使用专用数值预算：IV 总和 90-120，EV 总和 280-320；训练自习曲线继续以 EV 510 为上限。
- 战斗 runtime 修复训练家道具复活后的 snapshot/request side 同步，战斗背包展示优先使用最新 battle snapshot。
- 创建房间隐藏地区选择，默认使用全图规则；正式 room 继续使用 V5 scoped view + 小 command result，不恢复 `formalRun/restRunSnapshot`。
- Desktop 本地模拟内置 Battle API 包含本版服务端修复；Android debug APK 同步本版 Web/配置；官方线上 Battle API 容器需要更新。

## 验收记录

- `pnpm --filter @changebattle-v2/api typecheck` 已通过。
- `pnpm --filter @changebattle-v2/web typecheck` 已通过。
- `pnpm --filter @changebattle-v2/desktop typecheck` 已通过。
- `pnpm --filter @changebattle-v2/mobile typecheck` 已通过。
- `pnpm --filter @changebattle-v2/showdown-battle-core typecheck` 已通过。
- `pnpm --filter @changebattle-v2/showdown-battle-core test` 已通过。
- `pnpm --filter @changebattle-v2/api test:formal-game` 已通过。
- ChromeAutomation 已跑通：创建房间 -> 创建对局 -> starter -> rest -> 保险 -> 自习 2 轮 -> 商店刷新/购物车购买 -> 队伍排序 -> battle -> 投降 -> settlement -> 返回房间 ended match。
- localStorage / API 响应抽查未出现 `formalRun/restRunSnapshot/runGameV5/entity maps/commandLog`。
- `git diff --check` 已通过。

## 发布边界

- 本版改 API 服务端逻辑、Web/Desk UI 逻辑、Desktop 内置离线 API 和 Android debug APK。
- 线上 beta 服务器只发布 `latest.json / index.html / manifests / objects`，不托管完整 zip/apk。
- 完整 Desktop zip 与 Android debug APK 挂 GitHub Release。
