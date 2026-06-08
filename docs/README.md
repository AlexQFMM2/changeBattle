# Docs

这组文档的目标是让人和 AI 都能按任务渐进式加载 ChangeBattle，而不是默认串读整套仓库说明。

ChangeBattle 当前更适合被理解为：

- 一个以 Pokemon Showdown 为规则引擎的宝可梦对战工厂游戏。
- 一个 Electron + React 桌面端、TypeScript 游戏服务层、Python CLI 并存的可玩项目。
- 一套围绕租赁、交换、连战、中文展示、战斗演出和桌面 release 的资料与工具集合。

如果文档与代码冲突，以当前代码为准，并把文档视为待更新。

## 使用方式

- 先从这页进入，只选一个最相关的任务继续读。
- 每次任务默认只补读 `1-2` 篇专题文档。
- 需要理解整体时，先读本页的项目地图，再按任务进入专题。
- 需要发版时，直接进入 Windows release 文档，不要顺手重新解释整套游戏规则。
- 需要改资源时，先确认运行时数据文件和打包脚本，再决定是否清理目录。

## 任务入口

- 理解当前游戏规则与体验目标：[`rule.md`](./rule.md)
- 理解随机宝可梦生成规则：[`randomPokemonRule.md`](./randomPokemonRule.md)
- 理解随机道具与商店规则：[`randomItemRule.md`](./randomItemRule.md)
- 理解结算与结果页规则：[`resultRule.md`](./resultRule.md)
- 理解天赋系统：[`天赋.md`](./天赋.md)
- 理解 Pokemon Showdown 依赖与规则边界：[`showdown.md`](./showdown.md)
- 理解 Showdown BattleStream 日志解析：[`showdown-battle-log.md`](./showdown-battle-log.md)
- 理解 Boss 台词和标签：[`boss_dialogues.md`](./boss_dialogues.md)、[`boss_dialogue_tags.md`](./boss_dialogue_tags.md)
- 理解招式动画资料抓取：[`52poke_fetching.md`](./52poke_fetching.md)、[`move_animation_references.md`](./move_animation_references.md)
- 生成 Windows 桌面便携 release：[`windows-desktop-release.md`](./windows-desktop-release.md)
- 查阅历史 green.gba 导出说明：[`green-gba-assets.md`](./green-gba-assets.md)

## 项目地图

### `apps/desktop`

Electron + React 桌面端。

这里包含：

- Electron main/preload 入口。
- React 页面、战斗视图、图鉴、菜单、过场和 UI 样式。
- 桌面存档读写、NPC/战斗状态装饰、桌面端规则测试。

这是当前主要用户体验入口。

### `packages/game-service`

TypeScript 游戏服务层。

这里负责：

- 读取 Showdown 数据。
- 生成候选宝可梦、道具、图鉴条目和中文展示信息。
- 提供桌面端可消费的运行时数据结构。
- 承载训练师道具等服务层测试。

### `packages/shared`

跨桌面端和游戏服务层共享的类型事实源。

这里定义：

- 存档、队伍、战斗状态、图鉴、训练师、道具、天赋等共享类型。
- 少量跨层 helper，例如战斗槽位的 Showdown id 读取。

修改跨层数据结构时优先从这里确认类型。

### `changeBattle-cli`

Python 文字版入口。

它保留了 CLI 可玩闭环和部分规则/显示实现。桌面端是当前重点，但 CLI 仍可用于快速验证和回归。

### `data`

运行时数据与生成产物。

重点文件包括：

- `sprite_index_map.json`：当前运行时宝可梦图片路径来源。
- `pokemon_pack_manifest.json`：资源导入记录，不应被误认为所有字段都仍是运行时依赖。
- `battle_effect_assets.json`：当前战斗表现层配置，主要使用 CSS fallback 和仍保留的必要资源。
- `npc_trainers.csv`、`goods.csv`、中文翻译和详情数据。

### `assets`

桌面端和 release 会打包的资源目录。

当前主要图片来源：

- `assets/pokemon-pack`：优先使用的宝可梦图片资源。
- `assets/pokemon-showdown`：其次使用的 Showdown sprite fallback。
- `assets/battle-backgrounds/backgrounds.csv`：当前战斗背景目录清单。
- `assets/items-pack`、`assets/pokeballs-pack`、`assets/audio`、`assets/npc`：道具、球、音频、NPC 等资源。

`assets/pokemon-green` 不再作为运行时资源来源；如果本地或构建机残留，也不应进入 release。

### `tools`

资源导入、数据生成、release 打包和校验脚本。

常见用途：

- 导入 pokemon pack 资源。
- 生成 sprite map。
- 抓取/观察 52poke 招式动画资料。
- 校验战斗效果配置。
- 生成 CLI 或 Windows desktop release。

### `docs`

专题文档集合。

本页只负责导航和项目地图；具体规则、发版、资料抓取、台词等细节继续放在对应专题文档里。

## 运行与验证

常用工作目录：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattle
```

桌面开发：

```bash
pnpm desktop:dev
```

桌面构建：

```bash
pnpm --filter @changebattle/desktop build
```

完整类型检查：

```bash
pnpm typecheck
```

规则测试：

```bash
pnpm --filter @changebattle/desktop test:talents
pnpm --filter @changebattle/game-service test:trainer-items
```

CLI Python 语法检查：

```bash
python3 -m py_compile changeBattle-cli/play.py
```

Windows 桌面 release 按 [`windows-desktop-release.md`](./windows-desktop-release.md) 走。发版时要用已提交的 `HEAD` 生成源码包，同步到 Windows 构建机，再生成 `ChangeBattle-Desk-portable-vX.Y.Z.zip`。

## 资源与数据来源

Pokemon Showdown 是对战规则、数据和底层 battle engine 的事实源。ChangeBattle 不手写完整伤害公式、异常、特性、道具、天气、场地和复杂招式规则。

宝可梦图片当前优先级：

1. `assets/pokemon-pack`
2. `assets/pokemon-showdown`
3. placeholder

战斗背景当前由 `assets/battle-backgrounds/backgrounds.csv` 管理。不要把该目录里的历史导入素材当成运行时必需资源；清理资源前应先检查 CSV、运行时数据文件和打包脚本。

`green.gba` 相关文档和工具保留为历史参考与低频资源研究入口，不再代表当前桌面运行时图片来源。

## 默认阅读原则

- 改桌面 UI：先看 `apps/desktop` 代码，再按需读规则文档。
- 改战斗规则/生成逻辑：先看 `packages/game-service` 和 `packages/shared`，再读 `rule.md`、`randomPokemonRule.md`、`randomItemRule.md`。
- 改 Showdown 解析：优先读 `showdown-battle-log.md`。
- 改资源：先看 `data/*manifest*`、`sprite_index_map.json`、`assets/*` 和 `tools/package_desktop_release.py`。
- 改发版流程：只读 `windows-desktop-release.md`，不要顺手改 release 产物。
- 更新文档时，保持本页做导航，专题文档做细节，不把同一套规则复制到多处。
