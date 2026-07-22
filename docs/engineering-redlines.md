# ChangeBattle V2 Engineering Red Lines

本文档是当前项目的硬边界。任何新功能、修复、重构和发版前检查，都要先确认没有踩这些线。

## Formal Room C/S

正式 room 主线只允许走 RunGame V5 C/S 边界：

- 服务端 `RunGameV5` 是唯一权威状态。
- 客户端通过 `GET match view?scope=...` 获取页面 scoped view。
- 客户端通过具体 match command 推进状态，例如 `training.apply`、`team.heal`、`shop.buy`、`prepare-battle`、`battle-choice`、`finalize-run`。
- command 输入统一是小 payload + `commandId`，不上传整份 run/draft。
- command 成功后只用服务端返回的 scoped view 更新页面快照。

禁止：

- 正式 room 请求或响应携带 `formalRun`、`restRunSnapshot`、`runGameV5`、`playersById`、`pokemonById`、`bagsById`、`itemInstancesById` 等大对象。
- 正式 room 主线调用 `formalRunDraft`、`syncDraft`、`rooms.restAction`、`rooms.prepareBattle`、聚合 `rest-action`。
- 把 compat view 写回服务端、localStorage、Desktop formal run 文件或 command log。
- 为了显示方便，把完整 Player、Pokemon、Bag、Item 复制进 `gameMap` / `roundPlan` / node slot。

允许：

- 训练场、本地 legacy、dev-only adapter、smoke test 可以保留 V4 helper。
- legacy 文件必须通过文件名、注释和入口开关明确隔离，不能作为正式 fallback。

## 客户端状态

客户端只保存自己当前页面需要看的东西：

- room credential
- 当前 matchId / revision / phase
- 当前页面 scoped view snapshot
- 少量 command / settlement 幂等 key
- UI 草稿，例如排序拖拽草稿

客户端不保存 room 大 run，不把旧 localStorage formal run 当 room 恢复来源。刷新 room 页面时必须重新拉服务端 view 或 final-result。

## 服务端确认交互

所有会修改服务端权威状态的操作都必须按同一套体感处理：

```text
点击确认 -> 生成稳定 commandId -> 显示遮罩等待 -> HTTP 返回
  -> 成功：应用服务端返回 view
  -> 失败：不提交本地权威状态，显示业务错误或网络异常
  -> 超时：不提交本地权威状态，显示“网络异常，xx未成功”
```

不得出现乐观写权威状态、后台偷偷同步、失败后本地仍显示成功这类模糊状态。

战斗页属于同一条红线：

- `battle-choice` / trainer item / surrender 提交前可以显示“提交中”，但失败必须落到明确失败文案，并清除 busy/submitting。
- 投降或战斗结束 command 失败时不得继续触发 `onBattleComplete`、结算页或返回房间。
- 强制换人回合必须按 battle snapshot request 生成 `switch`/`pass`，不得在 smoke 或 UI 中硬发 `move` 后把服务端拒绝误判为 AI 卡死。
- AI 出招问题不能只靠肉眼看 UI；至少看服务端 `battle-ai-choice` 日志，或跑正式 room 多回合 `battle-choice` smoke。

## UI 质量

ChangeBattle 是成品游戏界面，不是 CLI。

- 改数据源时必须保留原设计、原交互层级、原弹窗和动效节奏。
- 不允许把原休整页、战斗页、设置页替换成“能用就行”的薄列表页。
- 高风险 UI 重构前先备份到 `/tmp`，迁移后用 ChromeAutomation 截图确认。
- 所有页面按 `640 x 320` 游戏视口设计，遵守 `docs/ui-design.md`。
- NPC 商店、训练、治疗优先复用 `TrainingRestShopDialogue`；系统二次确认才用系统确认弹窗。

## 资源和头像

存储型资源字段只保存 canonical asset path：

```text
npc/avatars/6-asset-a73f3e71.webp
runtime/items/redthread/icon.png
showdown/sprites/ani/pikachu.gif
```

禁止保存：

```text
changebattle-asset://beta/...
https://assets.65h26i.top/beta/...
file://...
data:...
blob:...
../x.png
x.png?v=1
```

`assetUrl()` 是纯计算工具，只把合法相对路径解析成当前 runtime URL。它不负责兼容脏存档，也不负责猜测用户输入。

发现坏头像/坏资源存档时，引导用户重新选择并保存，不在纯工具函数里做兜底转换。

## Release 和线上

- `v2` 对应 beta/debug，线上路径 `/changebattle-beta/`。
- `release` 分支对应 stable，线上路径 `/changebattle/`。
- GitHub Release 托管完整 Desktop zip / Android APK。
- 线上服务器只托管 `latest.json`、下载页、manifest 和增量 objects。
- 不把完整 zip/apk 上传到线上服务器作为主要下载源，避免流量计费失控。
- `release/` 目录只是本地发版工作台，不是 `release` 分支。
- 推送 `release` 分支前必须先检查 `.github/workflows/*` 的 `on:` 触发规则，确认普通 push 是否会触发构建/发版。
- 推送 `release` 后必须查看 GitHub Actions 最近运行，确认没有意外 release workflow；文档改动也不能默认“不会触发”。
- 真正生成版本必须是显式发版动作，例如 `gh workflow run ...`、手动 `gh release create/upload` 或发布脚本，不允许把普通 push 当隐式发版开关。

## 常用红线扫描

```bash
rg "formalRunDraft|syncDraft|rooms\\.matches\\.commands\\.restAction|rooms\\.prepareBattle|view\\.formalRun|view\\.viewV5|formalRoomViewV5|roomBattleDisplayRunFromViewV5" apps/api/src apps/web/src -g '*.ts' -g '*.tsx'

rg "buildFormalRunCompatViewV5|buildRunGameViewV5|commitFinalSettlementV5|RunGameViewV5" apps/api/src/runGameV5.ts apps/api/src/server.ts apps/web/src -g '*.ts' -g '*.tsx'

rg "changebattle-asset://|https://assets\\.65h26i\\.top" apps packages -g '*.ts' -g '*.tsx' -g '*.json'
```

允许命中必须能解释为 legacy/dev-only、测试 fixture 或纯展示 runtime URL。解释不清就继续拆。

## 必跑检查

常规代码改动：

```bash
pnpm --filter @changebattle-v2/api typecheck
pnpm --filter @changebattle-v2/web typecheck
pnpm --filter @changebattle-v2/desktop typecheck
pnpm --filter @changebattle-v2/mobile typecheck
pnpm --filter @changebattle-v2/showdown-battle-core typecheck
pnpm --filter @changebattle-v2/api test:formal-game
git diff --check
```

UI / room 主线改动还要跑 ChromeAutomation，从创建房间到结算返回房间，并截图确认关键页面没有降级。
