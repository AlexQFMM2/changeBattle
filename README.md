# ChangeBattle

ChangeBattle 是一个以 Pokemon Showdown 为底层规则引擎的宝可梦 Boss Rush / 对战工厂式 roguelite。

项目当前主版本是 Electron + React 桌面端，同时维护 Capacitor Android 自用 App。早期 Python CLI 仍保留在仓库中，但已经不是主要开发和规则验收入口。

当前版本：`0.7.5`

```text
Pokemon Showdown = 宝可梦数据、队伍 set、权威战斗规则和 BattleStream
ChangeBattle     = 随机选队、连战流程、休整运营、商店、任务、图鉴、中文 UI 和发版包装
```

ChangeBattle 不手写完整伤害公式、异常、特性、道具、天气、场地、复杂招式等底层对战规则。这些规则交给 Pokemon Showdown；本项目专注于把 Showdown 对战包装成一局短周期、可养成、可运营的单机挑战。

## 游戏规则

### 核心玩法

一局挑战默认是 `7` 场连续战斗。玩家先从随机候选中组建临时队伍，再通过战斗胜利、休整商店、道具管理、技能调整、数值养成、任务奖励和战后交换，逐步把随机队伍打磨成能击败后续 Boss 的阵容。

当前主流程：

1. 在主菜单配置天赋和开局筹备。
2. 开始挑战，生成随机宝可梦候选和开局道具候选。
3. 选择初始队伍，进入第 1 场前休整。
4. 在休整页处理商店、背包、交换、技能、数值、侦察、随机事件和任务。
5. 进入战斗，使用 Showdown 规则进行真实对战。
6. 胜利后进入下一次休整；失败或通关后进入结算。
7. 挑战结束时把本局资源按规则折算为局外成长。

### 队伍与战斗

- 每局使用随机生成的宝可梦和道具，队伍不是永久队伍。
- 战斗规则、合法行动、命中、伤害、PP、异常、特性、道具、天气、场地和胜负判定均由 Pokemon Showdown 处理。
- 桌面端战斗页提供招式、换人、战斗背包、特殊系统按钮、战斗日志、动画和战斗状态展示。
- 支持 Mega、Z 招式、极巨化、太晶化等特殊系统；具体是否启用由当前对局配置决定。
- 战斗中显示宝可梦真实状态，包括 HP、异常、能力变化、性别等战斗相关信息。

### 休整与经济

休整页是一局内运营的核心。玩家可以在休整时花金币补强队伍，也可以保留资源应对后续战斗。

主要休整功能：

- 回复、道具、技能机器、训练商店。
- 技能随机、技能机器学习、教授招式和遗传招式服务。
- 宝可梦交换、首发调整、数值调整和随机数值重置。
- 侦察下一场、路线改道、指定冠军等情报和路线操作。
- 道具回收、重铸、以物易物等背包经济功能。
- 随机休整事件和任务事件。

金币是局内货币：

- 普通战斗胜利基础获得 `500` 金币。
- 通关奖励随连续通关次数提高。
- 闪光、护符金币、任务、事件和特殊奖励会产生额外金币。
- 商店、交换、技能、侦察、数值调整等消费都扣本局金币。
- 金币变化会写入金币流水，休整页可查看收入、支出、原因和余额变化。

BP 是局外成长货币：

- 新存档初始获得 BP，用于星图、开局筹备和天赋成长。
- 本局结束时，剩余金币按规则折算为 BP。
- BP 和金币不会混用；金币服务单局运营，BP 服务长期成长。

### 商店和道具

休整商店按用途拆分：

- 回复商店：回复药、状态药、PP、树果等续航道具。
- 道具商店：战斗携带道具和部分专属/半专属道具。
- 技能商店：技能机器和招式相关商品。
- 训练商店：王冠、维生素、降 EV 树果、神奇糖果等培养道具。

商店支持抽奖刷新和商品购买。同次抽奖出现重复道具时，会按重复数量自动赠送额外道具。任务奖励中有四类商店折扣券，使用后仅在本次休整让对应商店抽奖和购买 5 折。

战斗背包是本局共享背包：

- 恢复类道具可在战斗或休整中使用，具体效果以 `data/consumable_item_effects.csv` 为准。
- 技能机器是一次性消耗道具。
- 训练类消耗品主要在休整页使用。
- 任务奖励道具不可出售、不可重铸、不可用于以物易物。

### 随机事件与任务

休整随机事件会改变本次休整或下一场战斗的规则，例如赞助、诊所券、道具回收商、特殊服务、灵魂互换、重金下注等。

任务是特殊事件大类：

- 同一时间最多 1 个进行中任务。
- 接取后从当前时间点开始追踪，不追溯旧战斗。
- 完成后自动发放金币和道具奖励。
- 失败或到期后自动清除。
- 进行中任务会显示在休整或战斗状态条中。

当前任务：

- 王牌试炼：3 场内同一只宝可梦击倒 5 只，奖励 500 金币和训练商店折扣券。
- 常胜冠军：连续赢 3 场，且每场己方存活数至少 2，奖励 500 金币和战斗道具商店折扣券。
- 属性专家：3 场内累计打出 8 次效果绝佳，奖励 500 金币和技能机器折扣券。
- 药系天王：3 场内任意一场使用 5 次战斗道具，奖励 500 金币和恢复商店折扣券。
- 节俭挑战：接下来 2 次休整每次总支出不超过 500 金币，奖励 1000 金币。

### 天赋和开局成长

天赋是局外成长系统，主要改变一局挑战中的策略方向。

当前路线：

- 开局筹备：提高初始金币、初始道具容量、候选质量和开局重随能力。
- 交换筑队：强化战后交换、信赖培养、交换状态和 Boss 交换价值。
- 情报规划：提前查看训练师、Boss、阵容、招式效果和路线信息。
- 养成改造：强化技能、数值、商店选择、首发调整和高风险爆发。
- 经济运营：提高金币入账、出售收益、消费返利和结算转换效率。

开局筹备使用 BP 升级，影响开局道具候选数量、质量、宝可梦候选查看和重随次数。

## 技术架构

### 前端技术栈

桌面端：

- Electron `38`
- React `19`
- React DOM `19`
- React Router `7`
- Vite `7`
- electron-vite `4`
- TypeScript `5.9`
- motion `12`

移动端：

- React `19`
- React Router `7`
- Vite `7`
- Capacitor `8`
- Android 平台：`@capacitor/android`
- Capacitor 插件：App、Filesystem、Splash Screen、Status Bar

桌面端是当前正式主版本；移动端是 Android 自用 App，不上架，不考虑 iOS。

### 后端 / 运行时技术栈

本项目没有传统意义上的远程后端服务器。游戏运行在本地进程内，由共享 TypeScript runtime 和 service 层提供规则、数据和战斗服务。

核心技术：

- Node.js / TypeScript ESM
- pnpm workspace monorepo
- Pokemon Showdown 本地集成
- Showdown BattleStream / battle session
- Electron main process 本地存档读写
- Capacitor Android 本地文件和资源访问
- CSV / JSON 作为主要运行时数据源

核心包：

- `@changebattle/shared`：跨端共享类型、存档结构、战斗状态、图鉴、道具、天赋等类型事实源。
- `@changebattle/game-runtime`：跨 Desktop / Mobile 复用的游戏流程规则层。
- `@changebattle/game-service`：Showdown 数据、队伍生成、战斗 session、中文展示、图鉴和资源服务层。

### 数据和资源

主要数据目录是 `data/`：

- `pokemon_tiers.csv`：随机宝可梦物种 tier。
- `boss_team_pools.csv`、`rainbow_rocket_team_pools.csv`：Boss 与彩虹火箭队伍池。
- `starter_item_pool.csv`：开局道具候选池。
- `shop_pool.csv`：休整商店候选池。
- `consumable_item_effects.csv`：消耗品效果。
- `sprite_index_map.json` / `sprite_index_map.csv`：宝可梦图片索引。
- `battle_effect_assets.json`：战斗演出效果配置。
- `npc_trainers.csv`、`goods.csv`、翻译表和描述数据。

主要资源目录是 `assets/`：

- `assets/pokemon-pack`
- `assets/pokemon-showdown`
- `assets/items-pack`
- `assets/pokeballs-pack`
- `assets/battle-backgrounds`
- `assets/audio`
- `assets/npc`
- `assets/placeholders`

## 项目结构

```text
changeBattle/
  apps/
    desktop/          Electron + React 桌面端，当前主版本
    mobile/           Capacitor + React Android 自用 App
  packages/
    shared/           跨端共享类型和少量 helper
    game-runtime/     游戏流程、休整、结算、任务、商店和规则 helper
    game-service/     Showdown 数据、生成、战斗、图鉴和展示服务
  data/               CSV/JSON 运行时数据
  assets/             桌面端和 App 打包资源
  docs/               规则、平台、发版、Showdown、资源抓取等专题文档
  tools/              数据生成、资源导入、Showdown bundle、release 脚本
  changeBattle-cli/   早期 Python CLI 入口，保留但不再作为主线
  core/               早期 CLI 相关核心代码
  showdown-adapter/   早期 CLI 的 Showdown 适配层
```

## 启动和构建

安装依赖后，在项目根目录执行。

```bash
pnpm install
```

桌面开发：

```bash
pnpm desktop:dev
```

桌面构建：

```bash
pnpm desktop:build
```

Web 本地自动化测试入口：

```bash
pnpm web:dev
```

常用测试地址：

```text
http://127.0.0.1:5179/?automated#/
http://127.0.0.1:5179/?scenario=battle-flinch#/
http://127.0.0.1:5179/?scenario=rest-shop#/
```

移动端本地 Web 预览：

```bash
pnpm mobile:dev
```

移动端 Web bundle 与 Capacitor sync：

```bash
pnpm mobile:build:web
pnpm mobile:sync
```

Android APK：

```bash
pnpm mobile:apk
pnpm mobile:apk:release
```

桌面 Windows release：

```bash
pnpm desktop:release:win
```

早期 CLI 入口仍可运行，但不是当前主线：

```bash
./start_game_cli
```

## 常用验证

类型检查：

```bash
pnpm --filter @changebattle/shared exec tsc --noEmit
pnpm --filter @changebattle/game-service exec tsc --noEmit
pnpm --filter @changebattle/game-runtime exec tsc --noEmit
pnpm --filter @changebattle/desktop exec tsc --noEmit
pnpm --filter @changebattle/mobile exec tsc --noEmit
```

规则测试：

```bash
pnpm --filter @changebattle/desktop test:talents
pnpm --filter @changebattle/game-service test:trainer-items
```

Mobile Showdown bundle smoke：

```bash
pnpm mobile:showdown:smoke
```

## 文档入口

专题文档从 `docs/README.md` 进入。

常用文档：

- 游戏规则：`docs/rule.md`
- 休整奇遇：`docs/restEventRule.md`
- 随机宝可梦生成：`docs/randomPokemonRule.md`
- 随机道具、商店和开局道具：`docs/randomItemRule.md`
- 结算规则：`docs/resultRule.md`
- 天赋系统：`docs/天赋.md`
- Showdown 集成：`docs/showdown.md`
- Showdown 日志解析：`docs/showdown-battle-log.md`
- 战斗展示播放流程：`docs/battle-timeline-flow.md`
- Windows 桌面发版：`docs/windows-desktop-release.md`
- Android App 发版：`docs/app-release.md`

如果 README 与当前代码或专题文档冲突，以代码为准，并同步更新文档。
