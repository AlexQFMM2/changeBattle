# ChangeBattle V2 Architecture

## Summary

V2 是从旧项目拆出的干净新基座。当前核心目标有三条：

- 保留 V1 已经打磨好的 UI 体验：`640 x 320` 游戏视口、首屏、首页、弹窗风格、动效节奏。
- 重建数据和运行时边界：Web/Desktop 共用 `apps/api`、`packages/showdown-dex-core`、`packages/showdown-battle-core`，训练、正式 GameRun 和 Battle V4 都不能回到旧的耦合结构。
- 保持 Desktop portable 可发布：release 包必须离线运行，不能依赖 dev battle service、外部 node_modules 或写死路径。

## Repository Policy

V2 代码属于原 ChangeBattle 仓库的 `v2` 分支，而不是独立仓库。

```txt
canonical repo: /home/alexqfmm/workPlace/pokemon/changeBattle
remote: git@github.com:AlexQFMM2/changeBattle.git
branch: v2
working directory used during rebuild: /home/alexqfmm/workPlace/pokemon/changeBattleV2
```

当前 rebuild 目录可能没有 `.git`。进入提交阶段前，需要把 `changeBattleV2` 整理成原仓库 `v2` 分支的 worktree，或把 V2 文件作为 `v2` 分支根目录内容提交。禁止误建一个无关的新仓库，除非明确决定放弃原仓库。

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
- 当前不接 app，不接旧 Battle/GameRun，不接旧完整存档。
- 旧项目素材只能按明确清单迁移；不能把旧 runtime 当隐式依赖。

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

- 正式 GameRun 已有 7 场赛程、休息室、商店、训练场、治疗、交换、结算和下一场预览。
- 商店支持购买/售出、加权补货、自动补货和医保折扣；治疗服务通过 NPC 对话框确认并恢复全队 HP/异常/PP。
- 普通正式商店的训练格只提供 10 个特效药；薄荷、王冠、特性胶囊/膏药、努力药等标准养成材料保留在待结算/局外养育侧，不再污染普通训练商店补货池。
- 训练场从随机课改为自由选课，课程面板和宝可梦选择都按紧凑 2x2 布局组织。
- gen7/gen8/gen9 系统资源按规则集生成：gen7 保障玩家初始 Mega 候选和 NPC Mega/Z 可用条件，gen8 NPC 获得极巨手环，gen9 NPC 获得太晶珠。

### Player Vault / Soulmate

- 玩家长期仓库是局外资产层，普通整理、携带、技能学习、养成道具使用和后续进化都应写回 `PlayerVaultV4` draft，再由页面“保存并返回”一次性落盘。
- 仓库中的灵魂伴侣可以参与局外仓库养成；仓库养成页不能因为它的 `originKind: "soulmate"` 禁用技能学习或养成材料。
- 通过“同行许可”进入正式流程的仓库宝可梦是 run-local 副本。它可以保留仓库养成数值、昵称和允许带入的携带道具，但不能写回仓库本体。
- 正式局内的灵魂伴侣副本不参与任何养成系统：训练场和交换面板要隐藏，后端训练/交换 guard 要拒绝，TM 和特效药也要拒绝。这个限制只针对正式 run-local 副本，不针对训练家仓库里的长期资产。

### Battle V4

- Battle service 使用 Showdown `BattleStream`，raw protocol/request/debug 仍是事实源。
- 播放顺序由 Showdown client playback compiler 生成 timeline，前端 Showdown 风格 scheduler 消费 backend groups，不再自研消息队列决定顺序。
- 战斗页使用 V2 壳展示场景、HP、sprite、指令、左侧事实解说和裁判/训练家开场结束对话。
- 当前重点是继续回归形态变化、濒死/换人、天气场地、HP/PP/状态继承和双打/合作 seat 映射。

### Desktop Release

- Windows Desktop portable release 链路已跑通，`ChangeBattle-V2-Desk-portable-v0.1.0.zip` 已能从 Windows 构建机生成并拉回 Linux。
- 当前 launcher 是 `ChangeBattle-V2-Desk.cmd`，负责设置 portable 环境变量并启动包内 Electron runtime；后续可增加 `.exe` launcher，但安装器/签名/自动更新不在当前边界。

### Sprite Resource Policy

- 主资源来自本地 Showdown 镜像：`assets/showdown/sprites`。
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
