# Docs

这组文档的目标是让人和 AI 都能按任务渐进式加载 ChangeBattle，而不是默认串读整套仓库说明。

ChangeBattle 当前更适合被理解为：

- 一个以 Pokemon Showdown 为规则引擎的宝可梦 Boss Rush / 对战工厂式 roguelite。
- 一个以 Electron + React 桌面端为正式主版本、TypeScript runtime/service 为规则支撑的可玩项目。
- 一套已开始跨 Desktop / Android 复用的本地运行时、数据、资源、发版和 smoke 工具集合。

当前根版本为 `0.7.0`。如果文档与代码冲突，以当前代码为准，并把文档视为待更新。

## 使用方式

- 先从这页进入，只选一个最相关的任务继续读。
- 每次任务默认只补读 `1-2` 篇专题文档。
- 需要理解整体时，先读本页的项目地图，再按任务进入专题。
- 需要发版时，直接进入对应 release 文档，不要顺手重新解释整套游戏规则。
- 需要改资源时，先确认运行时数据文件、静态资源复制脚本和打包脚本，再决定是否清理目录。

## 任务入口

- 理解平台形态、优先级和技术路线：[`platform-targets.md`](./platform-targets.md)
- 理解当前游戏规则与体验目标：[`rule.md`](./rule.md)
- 理解休整奇遇事件池：[`restEventRule.md`](./restEventRule.md)
- 理解随机宝可梦生成规则：[`randomPokemonRule.md`](./randomPokemonRule.md)
- 理解随机道具、商店与初始道具规则：[`randomItemRule.md`](./randomItemRule.md)
- 理解结算与结果页规则：[`resultRule.md`](./resultRule.md)
- 理解天赋系统：[`天赋.md`](./天赋.md)
- 理解 Pokemon Showdown 依赖与规则边界：[`showdown.md`](./showdown.md)
- 理解 Showdown BattleStream 日志解析：[`showdown-battle-log.md`](./showdown-battle-log.md)
- 理解 Showdown 身份、NPC 预生成和状态回写：[`showdown-identity.md`](./showdown-identity.md)
- 理解 Showdown 战斗展示播放流程：[`battle-timeline-flow.md`](./battle-timeline-flow.md)
- 理解 Boss 台词和标签：[`boss_dialogues.md`](./boss_dialogues.md)、[`boss_dialogue_tags.md`](./boss_dialogue_tags.md)
- 理解招式动画资料抓取：[`52poke_fetching.md`](./52poke_fetching.md)、[`move_animation_references.md`](./move_animation_references.md)
- 理解宝可梦/道具资源 registry 与 runtime assets：[`resource-registry.md`](./resource-registry.md)
- 生成 Windows 桌面便携 release：[`windows-desktop-release.md`](./windows-desktop-release.md)
- 生成 Android 自用 APK release：[`app-release.md`](./app-release.md)
- 自动同步源码到 Windows release 构建机：`tools/send_release_source_to_windows.sh`
- 通过 SSH 操作 Windows Android 模拟器做截图 smoke：[`android-emulator-smoke.md`](./android-emulator-smoke.md)
- 查阅历史 green.gba 导出说明：[`green-gba-assets.md`](./green-gba-assets.md)

## 项目地图

### `apps/desktop`

Electron + React 桌面端，是当前正式主版本和最高优先级体验入口。

这里包含：

- Electron main/preload 入口。
- React 页面、战斗视图、图鉴、菜单、过场和 UI 样式。
- 桌面存档读写、路由页、休整页、星图页和战斗展示。
- 通过 `@changebattle/game-runtime` / `@changebattle/game-service` 消费规则、数据和战斗服务。

### `apps/mobile`

Capacitor Android 自用 App，不上架，不考虑 iOS。

当前 mobile 已不是单纯 mock/scaffold 壳。它复用 React UI，接入 `@changebattle/game-runtime`、`@changebattle/game-service`、`@changebattle/shared`，并带有 mobile Showdown bundle、静态资源复制和 Android APK 构建脚本。它可以用于真实本地流程、横屏触摸、资源路径、签名包和模拟器 smoke 验证。

Android release 与模拟器检查分别看 [`app-release.md`](./app-release.md) 和 [`android-emulator-smoke.md`](./android-emulator-smoke.md)。

### `packages/game-runtime`

跨 Desktop / Mobile 复用的游戏运行时规则层。

这里负责：

- 新存档、run 状态、休整状态、首战前休整和结果推进。
- 星图、初始升级、初始道具候选、背包和 run 偏好。
- 计划战斗、Boss 路线、普通敌人数值/物种分层、奖励和结算摘要。
- 给 UI/平台层使用的 runtime API 与纯规则 helper。

改“流程为什么跳到这里”“默认点亮哪些星图节点”“普通敌人应该抽什么 tier”这类问题，优先看这里。

### `packages/game-service`

Showdown 数据、生成、战斗和展示服务层。

这里负责：

- 读取 Showdown 数据、中文展示、宝可梦/招式/道具事实。
- 生成候选宝可梦、敌方队伍、Boss 队伍、道具、图鉴条目和战斗展示数据。
- 启动和推进 Showdown battle session，处理 AI、请求、战斗日志和展示状态。
- 承载训练师道具、专属 Z 招式、候选生成等服务层测试。

改“招式能不能点”“AI 为什么用了特殊系统”“闪光图/黑球/战斗 sprite 显示”这类问题，通常需要同时看这里和 UI 展示层。

### `packages/shared`

跨平台共享的类型事实源。

这里定义：

- 存档、run、队伍、战斗状态、图鉴、训练师、道具、天赋、偏好等共享类型。
- 少量跨层 helper，例如战斗槽位的 Showdown id 读取。

修改跨层数据结构时优先从这里确认类型，再同步 runtime、service、desktop 和 mobile。

### `changeBattle-cli`

Python 文字版入口。

它是早期快速验证入口，已经完成最初使命。后续不再主动开发、不再同步 Desk/App 平衡，也不作为当前回归重点；如需了解平台取舍，读 [`platform-targets.md`](./platform-targets.md)。

### `web`

浏览器本地测试形态。

它不作为正式发布模式，也不承担长期存档或服务器能力。Web 入口主要服务 Chrome MCP / Chrome Automation 自动化测试、截图验收和指定场景 smoke；详细边界见 [`platform-targets.md`](./platform-targets.md)。

### `data`

运行时数据与生成产物。

重点文件包括：

- `pokemon_tiers.csv`：随机宝可梦物种 tier 与候选生成基础数据。
- `boss_team_pools.csv`、`rainbow_rocket_team_pools.csv`：Boss / 彩虹火箭队伍池。
- `starter_item_pool.csv`、`shop_pool.csv`、`consumable_item_effects.csv`：初始道具、商店和消耗品效果。
- `pokemon_resource_registry.json`：宝可梦资源权威档案，运行时图片最终来源。
- `item_resource_registry.json`：道具资源权威档案，运行时道具图标最终来源。
- `sprite_index_map.json`：由宝可梦 registry 派生的兼容图片索引。
- `resource_source_sprite_index_map.json` / `sprite_index_map.csv`：资源生成和校对用源映射。
- `battle_effect_assets.json`：当前战斗表现层配置，主要使用 CSS fallback 和必要资源。
- `npc_trainers.csv`、`goods.csv`、中文翻译和详情数据。

### `assets`

桌面端和 App release 会打包的资源目录。

当前主要运行时图片来源：

1. `assets/runtime/pokemon`
2. `assets/runtime/items`
3. placeholder

其他常用资源：

- `assets/battle-backgrounds/backgrounds.csv`：当前战斗背景目录清单。
- `assets/pokeballs-pack`：球资源。
- `assets/audio`、`assets/npc`：音频和 NPC 资源。

参考素材库外置在 `/home/alexqfmm/workPlace/pokemon/ui-refrence/`。`assets/pokemon-showdown`、`assets/pokemon-pack`、`assets/items-pack`、`assets/items`、`assets/pokemon-custom` 和 `assets/pokemon-green` 都不应作为运行时资源来源，也不应进入 release。

### `tools`

资源导入、数据生成、Showdown bundle、release 打包和校验脚本。

常见用途：

- 构建资源 registry 与精选 runtime assets。
- 构建 mobile Showdown bundle，并用 smoke 脚本验证 mobile bundle 能生成随机队。
- 抓取/观察 52poke 招式动画资料，校验战斗效果配置。
- 生成彩虹火箭队资料和队伍数据。
- 生成 Windows desktop release、Android APK release 和源码同步包。

### `docs`

专题文档集合。

本页只负责导航和项目地图；具体规则、发版、资料抓取、台词等细节继续放在对应专题文档里。

## 当前玩法快照

当前主流程是 7 场连战 Boss Rush：

- 新 run 先选队，再进入第 1 场前的休整页，而不是直接进战斗。
- 初始能力由星图和默认点亮节点决定，初始道具/候选与 [`randomItemRule.md`](./randomItemRule.md) 对齐。
- 随机宝可梦生成遵循 [`randomPokemonRule.md`](./randomPokemonRule.md)，普通敌人不仅有数值分层，也有物种 tier 分层。
- 休整页承载商店、招式学习/替换、道具交换、锻造、奇遇和路线选择。
- 战斗页使用 Showdown 规则推进，UI 负责展示招式、背包、换人、特殊系统按钮、日志和动画。
- 对局偏好中的特殊战斗系统应显式生效；默认初始战斗系统不应让对手自动使用太晶化等未启用系统。

详细规则以专题文档和当前代码为准，本节只作为定位用摘要。

## 运行与验证

常用工作目录：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattle
```

桌面开发：

```bash
pnpm desktop:dev
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

Web 入口只服务 Chrome MCP / Chrome Automation 本地测试，不是正式发布模式。

Mobile 本地 Web 预览：

```bash
pnpm mobile:dev
```

Mobile Web bundle 与 Capacitor sync：

```bash
pnpm mobile:build:web
pnpm mobile:sync
```

Mobile Showdown bundle smoke：

```bash
pnpm mobile:showdown:smoke
```

Android debug / release APK：

```bash
pnpm mobile:apk
pnpm mobile:apk:release
```

Android 自用 APK release 按 [`app-release.md`](./app-release.md) 走。签名文件只放 Windows `D:\changeBattle\signing`，APK 输出统一放 `release/`。需要远程启动模拟器、安装 APK、截图和点按时，按 [`android-emulator-smoke.md`](./android-emulator-smoke.md) 走。

桌面构建：

```bash
pnpm desktop:build
```

完整类型检查：

```bash
pnpm typecheck
```

规则与服务层测试：

```bash
pnpm desktop:test:talents
pnpm game:test:trainer-items
```

Mobile 包级构建检查：

```bash
pnpm --filter @changebattle/mobile build
```

CLI Python 语法检查只作为历史入口检查，不是当前主回归：

```bash
python3 -m py_compile changeBattle-cli/play.py
```

Windows 桌面 release 按 [`windows-desktop-release.md`](./windows-desktop-release.md) 走。发版时要用已提交的 `HEAD` 生成源码包，同步到 Windows 构建机，再生成 `ChangeBattle-Desk-portable-vX.Y.Z.zip`。

## 资源与数据来源

Pokemon Showdown 是对战规则、数据和底层 battle engine 的事实源。ChangeBattle 不手写完整伤害公式、异常、特性、道具、天气、场地和复杂招式规则。

宝可梦和道具图片当前来源：

1. `data/pokemon_resource_registry.json` / `data/item_resource_registry.json`
2. `assets/runtime/pokemon` / `assets/runtime/items`
3. placeholder

战斗背景当前由 `assets/battle-backgrounds/backgrounds.csv` 管理。不要把该目录里的历史导入素材当成运行时必需资源；清理资源前应先检查 CSV、运行时数据文件、mobile static copy 和 release 打包脚本。

`green.gba` 相关文档和工具保留为历史参考与低频资源研究入口，不再代表当前桌面或 App 运行时图片来源。

## 默认阅读原则

- 改桌面 UI：先看 `apps/desktop` 代码，再按需读规则文档。
- 改 Android App：先看 `apps/mobile`、`packages/game-runtime`、`packages/game-service`，再看 [`app-release.md`](./app-release.md)。
- 改流程、休整、星图、默认道具：先看 `packages/game-runtime`，再读 `rule.md` 和 `randomItemRule.md`。
- 改宝可梦、敌人、招式、专属 Z 招式或候选生成：先看 `packages/game-service`，再读 `randomPokemonRule.md`。
- 改 Showdown 解析：优先读 `showdown-battle-log.md`；改战斗展示顺序和动画队列时读 `battle-timeline-flow.md`。
- 改资源：先看 [`resource-registry.md`](./resource-registry.md)、`data/*resource_registry.json`、`assets/runtime/*`、mobile static copy 和 release 打包脚本。
- 改 Desk 发版流程：只读 `windows-desktop-release.md`，不要顺手改 App release。
- 改 Android APK 发版流程：只读 `app-release.md`，不要顺手改 Desk release。
- 判断平台优先级或 Web/App 边界：读 `platform-targets.md`，Desk 仍是正式主版本，Android 是真实自用 App。
- 更新文档时，保持本页做导航，专题文档做细节，不把同一套规则复制到多处。
