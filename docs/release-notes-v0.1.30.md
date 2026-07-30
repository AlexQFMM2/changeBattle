# ChangeBattle V2 0.1.30 Beta Release Notes

version: 0.1.30
tag:     desk-debug-v0.1.30
branch:  v2

GitHub Release:

https://github.com/AlexQFMM2/changeBattle/releases/tag/desk-debug-v0.1.30

Desktop portable:

https://github.com/AlexQFMM2/changeBattle/releases/download/desk-debug-v0.1.30/ChangeBattle-V2-Desk-portable-debug-v0.1.30.zip

Android debug APK:

https://github.com/AlexQFMM2/changeBattle/releases/download/desk-debug-v0.1.30/ChangeBattle-V2-Android-debug-v0.1.30.apk

线上 beta 更新：

latest.json: http://119.45.240.157/changebattle-beta/latest.json
download:    http://119.45.240.157/changebattle-beta/

## 本版重点

- RunGame V5 休整按 KISS 原则继续收口：正式 room 主线只走 V5 scoped view + 具体 command，不恢复 `formalRun/restRunSnapshot` 传输或展示 fallback。
- `prepare-round` 改为 V5-native 下一场参赛方生成；NPC / player / ai-ally 使用同一个中间层，为后续联机扩展预留同一入口。
- 生成 NPC 在 V5 生成阶段直接带稳定、符合类型的战斗立绘；不再用头像兜底掩盖错误。
- 玩家初始候选和普通 NPC 的推荐/正确技能数量提升到 3 个。
- 正式 room 训练自习支持批量轮数，服务端按金币、roll 和稳定 seed 原子计算结果。
- 正式 room 商店改为购物车购买、买后售罄；移除购买后自动补货，新增 50 金币整店刷新。
- 商店列表、训练收益、重随随机继续由服务端权威生成，客户端只提交玩家选择。

## 验收记录

- `api/web/desktop/mobile/showdown-battle-core` typecheck 已通过。
- `api test:formal-game` 已通过。
- `git diff --check` 已通过。
- ChromeAutomation 已跑到正式 room starter -> rest -> battle opening；Network/localStorage 审计未发现 `formalRun/restRunSnapshot/runGameV5/playersById/pokemonById/bagsById/itemInstancesById/commandLog` 等大对象传输或缓存。

## 发布边界

- 完整 Desktop zip 和 Android APK 挂 GitHub Release。
- 线上 beta 服务器只发布 `latest.json / index.html / manifests / objects`，不托管完整 zip/apk。
- 本版仍是 beta/debug，不是 stable release。
