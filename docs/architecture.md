# ChangeBattle V2 Architecture

## Summary

V2 是从旧项目拆出的干净新基座。当前核心目标有三条：

- 保留 V1 已经打磨好的 UI 体验：`640 x 320` 游戏视口、首屏、首页、弹窗风格、动效节奏。
- 重建数据和运行时边界：正式 room 主线使用服务端权威 `RunGameV5`、scoped view 和轻量 command，不能回到旧的 V4 大 draft 同步结构。
- 保持 Desktop/Android beta 可发布：完整包走 GitHub Release，线上服务器只承载更新 metadata 和小对象。

当前架构状态：

```txt
Web/Desktop/Android Renderer
  -> Battle API base URL
    -> official server / self-hosted server / desktop embedded server
      -> RunGameV5 authoritative room state
      -> Redis provider or MemoryRedisLike provider
      -> Showdown Battle service
```

正式 room 客户端不保存大 run，不上传 `formalRunDraft`，不从 compat `formalRun` 展示主数据。训练场和 legacy V4 helper 允许保留，但必须物理隔离、入口隔离、语义隔离。

## Repository Policy

V2 代码属于原 ChangeBattle 仓库的 `v2` 分支，而不是独立仓库。

```txt
canonical repo: /home/alexqfmm/workPlace/pokemon/changeBattle
remote: git@github.com:AlexQFMM2/changeBattle.git
branch: v2
working directory used during rebuild: /home/alexqfmm/workPlace/pokemon/changeBattleV2
```

当前 `changeBattleV2` 是 `v2` 分支 worktree。不要误建新仓库，也不要在 `changeBattleV2-release` 做日常开发。

```txt
Showdown 官方数据 / Dex + zh-CN 数据 + 本地 sprite 资源
-> packages/showdown-dex-core
   -> search
   -> detail builders
   -> sprite resolver
   -> zh-CN translation/detail resolver
   -> stat calculator
   -> learnset / holder reverse lookup
-> apps/api
   -> web/desktop shared adapter facade
-> apps/web adapter
-> apps/desktop adapter
-> UI
```

## Boundary

- `showdown-dex-core` 是唯一业务数据层。
- Web 和 Desktop 只维护 adapter，不维护搜索排序、学习面、图片规则、能力计算。
- `apps/api` 放所有 web/desktop 共用的应用层函数和 facade。
- `apps/web`、`apps/desktop` 不直接调用 core；先通过 `apps/api`。
- UI 只消费 core DTO，不直接访问 Showdown 全局变量。
- Web/Desktop/Android 正式 room 主线只走 Battle API scoped view 和具体 command。
- Desktop 离线模式启动本机 Battle API + MemoryRedisLike，不恢复旧本地正式流程。
- Android 使用公网/自建 Battle API，不内嵌离线 Battle API。
- 旧项目素材只能按明确清单迁移；不能把旧 runtime 当隐式依赖。

正式 room 禁止事项集中记录在 `docs/engineering-redlines.md`。

## Package Layout

```txt
packages/showdown-dex-core
  src/index.ts
  src/data/i18n/*

apps/api
  src/index.ts

apps/web
  src/main.tsx
  src/App.tsx

apps/desktop
  src/main.tsx
  src/App.tsx
  electron/main.ts
```

## Current Progress

### Shell / Save

- 已迁 V1 风格 `GameViewport`、首屏、首页、玩家设置。
- 用户资料只保存基础信息：名字、训练师、头像/立绘、创建/更新时间。
- Web 使用 `localStorage`，Desktop 使用 JSON adapter。

### Dex

- 已接入 Showdown 官方数据：`pokedex / moves / abilities / items / learnsets / typechart / aliases / natures / text`。
- 已接入旧项目整理过的中文数据：`zh_cn_overrides`、`zh_cn_details`。
- 已实现：搜索、详情、能力计算、学习面、技能学习者反查、特性拥有者反查、四向立绘、小图 sheet、道具图标。
- QuickDex 使用 V1 弹窗/分页/左右栏视觉壳，但数据只走 V2 API。
- 进化链、其他形态、学习者、特性拥有者均显示 Pokemon 小图。

### Formal Game / Rest

- 正式 GameRun 已迁到 `RunGameV5` 权威模型：Player、PokemonInstance、Bag、ItemInstance 独立存储，map/round/battle 只引用 ID。
- `GET /rooms/:roomId/matches/:matchId/view?scope=...` 返回页面 scoped view：summary、starter、rest、battle、settlement。
- room command 只返回小型 result 和当前 scope view，不返回 `formalRun/restRunSnapshot/runGameV5`。
- 正式休整页保留原游戏 UI，展示数据来自 V5 scoped rest view，经 room-only display model 派生。
- 训练场/legacy 本地流程可以继续使用 V4 run，但不能进入正式 room 主线。
- 正式 GameRun 已有 7 场赛程、休息室、商店、训练场、治疗、交换、结算和下一场预览。
- 商店支持购买/售出、加权补货、自动补货和医保折扣；治疗服务通过 NPC 对话框确认并恢复全队 HP/异常/PP。
- 普通正式商店的训练格只提供 10 个特效药；薄荷、王冠、特性胶囊/膏药、努力药等标准养成材料保留在待结算/局外养育侧，不再污染普通训练商店补货池。
- 训练场从随机课改为自由选课，课程面板和宝可梦选择都按紧凑 2x2 布局组织。
- gen7/gen8/gen9 系统资源按规则集生成：gen7 保障玩家初始 Mega 候选和 NPC Mega/Z 可用条件，gen8 NPC 获得极巨手环，gen9 NPC 获得太晶珠。

### Player Vault / Soulmate

- 玩家长期仓库是局外资产层，普通整理、携带、技能学习、养成道具使用和后续进化都应写回 `PlayerVaultV4` draft，再由页面“保存并返回”一次性落盘。
- 仓库中的灵魂伴侣可以参与局外仓库养成；仓库养成页不能因为它的 `originKind: "soulmate"` 禁用技能学习或养成材料。
- 通过“同行许可”进入正式流程的仓库宝可梦是 run-local 副本。它可以保留仓库养成数值、昵称和允许带入的携带道具；携带物会复制为本 run 背包实例并绑定到宝可梦，不扣仓库资产。
- 正式局内的灵魂伴侣副本不参与任何养成系统：训练场和交换面板要隐藏，后端训练/交换 guard 要拒绝，TM 和特效药也要拒绝；普通恢复、PP、异常和复活类治疗仍允许。这个限制只针对正式 run-local 副本，不针对训练家仓库里的长期资产。
- 每场正式战斗结束后按 run 上的 node marker 幂等回写来源仓库宝可梦亲密度：胜利且有效参与 `+15`，胜利但无有效参与 `+10`，阵亡 `-3`，范围限制在 `0..255`。
- 每场正式战斗胜利后还会按击败的馆主/四天王/冠军/反派目标幂等写入来源仓库宝可梦自己的 `honors`：地区制霸奖章和反派肃清奖章都是单只宝可梦个人荣誉，不是物种成就，也不是玩家全局成就。
- 正式战斗中的灵魂伴侣进化由后端计算并修改 Showdown 会话：core 负责 3% 概率、亲密度门槛、唯一下一段目标和幂等 marker；battle service 使用 `formeChange(..., evolutionEffect, true)` 产生 `detailschange` 并刷新 request；Web 只按 `rawLog -> playbackTimeline -> scheduler` 播放 transform，不本地插队动画。

### Battle V4

- Battle service 使用 Showdown `BattleStream`，raw protocol/request/debug 仍是事实源。
- 播放顺序由 Showdown client playback compiler 生成 timeline，前端 Showdown 风格 scheduler 消费 backend groups，不再自研消息队列决定顺序。
- 战斗页使用 V2 壳展示场景、HP、sprite、指令、左侧事实解说和裁判/训练家开场结束对话。
- 当前重点是继续回归形态变化、濒死/换人、天气场地、HP/PP/状态继承和双打/合作 seat 映射。

### Desktop Release

- 当前 beta/debug 版本为 `0.1.25`，GitHub Release tag 是 `desk-debug-v0.1.25`。
- Desktop portable zip 和 Android debug APK 挂 GitHub Release。
- 线上 beta 服务器只托管 `latest.json`、下载页、manifest 和增量 objects，不托管完整 zip/apk。
- 当前 launcher 包含 `ChangeBattle-V2-Desk.cmd` 和轻量 `.exe` 入口；安装器、签名、商店分发不在当前边界。
- Desktop 离线服务在 Electron 主进程启动嵌入式 Battle API，监听 `127.0.0.1:<port>`，使用 MemoryRedisLike；Renderer 仍只认 Battle API URL。

### Sprite Resource Policy

- 运行时公共资源来自 COS/CDN：`https://assets.65h26i.top/beta/`。
- 存储型资源字段只保存 canonical asset path，例如 `npc/avatars/6-asset-a73f3e71.webp`。
- `assetUrl()` 只负责把合法相对路径解析成当前 runtime URL，不兼容修复脏数据。
- 旧本地 Showdown 镜像只作为资源整理/补图来源，不作为 release 运行时依赖。
- `missing-sprites.json` 保留官方 404 清单，不删除。
- 只对 V2 缺失路径从旧 runtime 精确补图，补图清单写在 `assets/showdown/sprites/runtime-overrides.json`。
- 后续要恢复纯 Showdown 镜像时，按 `runtime-overrides.json copied[].targetPath` 删除即可。

## Data Source

V2 运行时不依赖外部研究目录。进入项目的官方数据和中文数据都在 repo 内：

- Showdown data：`packages/showdown-dex-core/src/data/*`
- zh-CN data：`packages/showdown-dex-core/src/data/i18n/*`
- sprites/icons：`assets/showdown/*`

`pokemonShowdownAbout` 只作为研究目录和后续同步来源，不作为运行时依赖。

## Red Lines

- 不保留旧 `dexSearch`。
- 不用中文名、展示文本、图片名反推 ID。
- 不在 UI 中拼 sprite URL。
- 不把 Pokemon Showdown Dex 的 Backbone/jQuery 面板搬进 React。
- 不让 web/desk 各写一套 Dex 逻辑。
- 不让 UI 直接读旧项目文件或旧 runtime 数据。
- 不把中文名、展示文本、图片名用于战斗身份判断。
- 正式 room 不传、不存、不展示依赖大 `formalRun/restRunSnapshot`。
- 正式 room 不新增 `syncDraft/formalRunDraft/restAction` 入口。
- 改数据结构不能牺牲已设计好的游戏 UI。
- 线上服务器不托管完整 zip/apk，大完整包统一挂 GitHub Release。

## UI Architecture

V2 UI 继续吃 V1 的 UI 约束：所有页面按 `640 x 320` 游戏视口设计，再由 `GameViewport` 缩放到 Web/Desktop 窗口。

做 UI 前必须阅读：

- `docs/ui-design.md`
- `plan/ui-refences/参考ui.md`

首屏和首页允许复用 V1 的 `motion` / `react-router` 页面体验与组件动画，但不允许引入旧业务依赖：`@changebattle/shared`、`@changebattle/game-runtime`、旧 `window.changeBattle`、旧 `dexSearch/shopItems`。

## Next Boundary

下一阶段不再是“迁训练页”，而是正式游戏打磨和 release 稳定性：

- Battle V4 继续按 Showdown timeline / scheduler parity 查问题，禁止回到前端凭感觉重排动画。
- 正式 GameRun 继续打磨 NPC 配队、特殊系统、商店/训练经济、赛程叙事和结算体验。
- Desktop portable 继续保持离线运行、相对资源路径、worker bundle 无 React/runtime import、内置 battle service。
