# Pokemon Battle Factory Lab

一个围绕“宝可梦对战工厂”玩法展开的小项目。

我很喜欢原作里“租赁宝可梦、打完交换、下一场继续赌手感”的节奏：它不像普通养成那样完全由长期培养决定，也不像纯随机那样没有策略。它更像一局一局短促但有判断空间的冒险，每次拿到一组陌生队伍，都要快速理解、凑合、下注，然后在胜利后决定要不要换走对手的宝可梦。

这个项目的第一步，是先把可用于对战生成的数据整理出来。当前已经从 `PokeDex_v1.2Build34` dump 并转换出 Gen7 / USUM 规则池下的基础数据，后续会在这套数据上逐步做租赁池、文本版玩法和完整游戏版。

## Current State

当前已经完成第一批基础资产：

- `data/pokemon.jsonl`：宝可梦与形态基础数据、属性、特性、种族值、蛋组等。
- `data/moves.jsonl`：招式名称、描述、属性、分类、威力、命中、PP、优先度。
- `data/abilities.jsonl`：特性名称、描述、触发、目标、作用范围。
- `data/items.jsonl`：道具名称、描述、价格、战斗内外可用性、携带效果等。
- `data/natures.jsonl`：性格名称、加成/降低能力、能力值修正倍率。
- `data/types.jsonl` 与 `data/type_chart.jsonl`：属性与克制关系。
- `data/learnsets_usum.jsonl`：Ultra Sun 规则池下的招式学习表。
- `data/evolutions.jsonl`：进化家族、阶段、前置宝可梦、进化方式。
- `data/assets.json`：独立图片资源索引，使用 `kind + id + variant` 查找图片。
- `assets/placeholders/` 与 `assets/types/`：占位图和属性色块。
- `core/`：公共规则核心，负责数据读取、租赁生成、战斗结算、交换逻辑等。
- `changeBattle-cli/`：纯文本摸鱼版，是 `core` 的第一个使用端。

数据层目前只做“对战工厂的基础数据库”。公共计算逻辑会放在 `core/`，CLI 和未来图形化版本都调用同一套核心，避免重复实现随机、战斗和交换规则。

这里有一个重要边界：`pokemon.jsonl` 里的宝可梦是模板，也就是物种/形态数据；`core` 会根据模板、性格、个体值、努力值和固定 50 级规则生成真正可以参战的宝可梦实例。

## Two Directions

### 1. Text Factory

第一个方向是非常轻量的纯文本小项目，也是最先落地的玩法原型。

目标是做成命令行即可启动的摸鱼版对战工厂：不用复杂 UI，不追求还原完整战斗动画，重点是快速进入随机租赁、选择行动、结算、交换宝可梦的循环。

这个方向的优点：

- 启动快，门槛低。
- 可以先验证玩法是否有趣。
- 适合边摸鱼边玩，一局短，一眼能看懂。
- 对图片、音效、动画的依赖很低。
- 方便快速迭代随机规则、租赁池、难度曲线和交换机制。

文本版优先做这些内容：

- 调用 `core` 从数据中生成可用租赁宝可梦池。
- 随机生成 3 只或 6 只候选队伍。
- 生成基础配招、道具、特性、性格。
- 调用 `core` 做简化战斗结算，先不追求完全复刻主系列战斗系统。
- 战斗胜利后可以从对手队伍里选择交换。
- 连胜、失败、记录、种子复现。

### 2. Playable Game

第二个方向是远期目标：做一个真正可玩的对战工厂游戏。它同样复用 `core`，只把表现层、输入方式和资源展示做得更完整。

它不只是数据库工具，而是一个完整游戏体验：有队伍选择、对战演出、信息面板、租赁交换、连胜奖励、不同规则池、可能还有每日挑战或自定义工厂规则。

这个方向的重点：

- 有清晰、舒服的 UI。
- 有宝可梦、道具、属性、招式等视觉资源。
- 战斗过程更接近真实宝可梦规则。
- 可以配置不同世代、不同规则、不同随机池。
- 有长期目标，例如连胜纪录、解锁、挑战模式。
- 未来可以加入 AI 对手、队伍评级、租赁池平衡。

完整游戏版需要更多资产和工程：

- 图片资源索引与正式图库。
- 战斗系统模拟器。
- 队伍生成器和平衡器。
- 前端 UI 或游戏客户端。
- 存档、战绩、挑战记录。
- 音效、动画和手感。

## Project Layout

```text
pokemonAbout/
  core/              公共规则核心，CLI 和未来图形化版本都复用这里
  changeBattle-cli/  纯文本摸鱼版入口
  data/              PokeDex dump 转换出的 JSONL/JSON 数据
  assets/            图片资源、占位图、属性色块
  tools/             数据转换与校验脚本
```

`core` 的定位不是必须对外提供 HTTP 服务，而是项目内部 API：数据读取、租赁池生成、队伍生成、伤害/战斗结算、胜后交换、随机种子复现等公共逻辑都应该放在这里。

第一版默认所有实例宝可梦为 50 级，符合对战设施/比赛规则的直觉。特殊规则以后再通过配置覆盖。

## Data And Assets

数据文件采用 JSONL，方便流式读取和随机抽取。名称与描述保留英文和简体中文：

```json
{
  "name": {
    "en": "Bulbasaur",
    "zh_cn": "妙蛙种子"
  }
}
```

图片资源不直接写入战斗数据，而是通过 `data/assets.json` 单独管理。运行时推荐使用如下查找方式：

```text
pokemon:{pokemon_id}
pokemon_dex:{national_dex_id}
item:{item_id}
type:{type_id}
move:{move_id}
ability:{ability_id}
```

如果找不到正式资源，就回退到：

```text
assets/placeholders/{kind}.png
```

这样可以先做游戏逻辑，再逐步补图库，不会因为缺图卡住开发。

## Roadmap

### Phase 1: Data Foundation

- 整理 PokeDex dump 数据。
- 生成 Gen7 / USUM 基础 JSONL。
- 建立图片 manifest 和占位图体系。
- 做数据校验和资源校验。

### Phase 2: Core And Text Factory Prototype

- 在 `core` 中实现数据读取、随机种子、租赁套装生成。
- 生成第一版租赁宝可梦套装。
- 在 `changeBattle-cli` 中实现命令行启动和基础交互。
- 在 `core` 中做简化战斗流程，CLI 只负责展示和输入。
- 加入连胜、交换、失败重开。
- 验证“随机租赁 + 交换”的核心乐趣。

### Phase 3: Battle Rules And Balance

- 扩展性格、努力值、个体值、道具、特性选择规则。
- 加入禁传、幻兽、神兽、Mega、形态等规则开关。
- 为宝可梦和招式做分级或权重。
- 优化随机队伍强度，避免过强或过弱。
- 让租赁池更像一个真正的 Battle Factory。

### Phase 4: Visual Game Prototype

- 做第一个可视化 UI。
- 接入图片资源索引。
- 展示宝可梦卡片、属性、招式、道具。
- 加入更完整的战斗信息面板。
- 保留文本版快速启动模式。

### Phase 5: Full Game Direction

- 在 `core` 中逐步完善战斗模拟。
- AI 对手和队伍策略。
- 多规则池和挑战模式。
- 战绩、存档、排行榜或每日种子。
- 更完整的视觉和音效表现。

## Tools

当前工具脚本：

```bash
python3 tools/build_pokedex_battle_data.py
python3 tools/build_natures_data.py
python3 tools/build_pokedex_asset_manifest.py
python3 tools/validate_pokedex_assets.py --write-report
```

这些脚本主要用于刷新数据和资源索引。后续如果新增真实图片或重新 dump 数据，可以通过它们重新生成基础资产。

## Notes

- 当前默认规则版本是 Gen7 / Ultra Sun。
- 第一版不追求完整战斗系统，优先验证玩法循环。
- 图片资源暂时以占位图为主，正式图库后续再逐步接入。
- 数据来自本地 PokeDex dump，项目不打包原始 Dex 程序。
- 未来的目标不是做一个普通图鉴，而是做一个“随机租赁、快速决策、越打越上头”的对战工厂。
