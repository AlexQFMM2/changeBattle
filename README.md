# ChangeBattle

一个以“宝可梦对战工厂”为核心灵感的文字版项目，未来可以继续扩展成图形化游戏。

当前版本的核心定位已经明确：

```text
Pokemon Showdown = 宝可梦数据源 + 权威战斗规则
ChangeBattle     = 租赁、选择、交换、连战、中文 CLI、未来 UI/资源包装
```

所以本项目不再手写完整伤害公式、异常、特性、道具、天气、场地、复杂招式等底层规则。这些最容易出错、也最核心的对战逻辑交给 Pokemon Showdown；ChangeBattle 专注做“6 选 3、打完交换、连续挑战”的对战工厂体验。

## 当前进度

现在已经有一个能玩的纯文本最小闭环：

- [x] 接入本机 Pokemon Showdown。
- [x] 使用 Showdown 生成 Gen7 随机租赁候选。
- [x] 所有宝可梦固定为 50 级。
- [x] 开局 6 选 3，选满 3 只自动开始。
- [x] 对手队伍开局隐藏，只显示已上场宝可梦。
- [x] 使用 Showdown BattleStream 进行 3v3 对战。
- [x] 支持招式、换人、强制换人、倒下、胜负判定。
- [x] 支持命中、会心、属性、物特、异常、特性、道具、天气、场地等 Showdown 规则。
- [x] 支持队伍查看、实时 HP/PP/道具、宝可梦详细页。
- [x] 支持对局状态页，展示天气、场地、钉子、能力变化和最近战报。
- [x] 默认显示上一回合战斗信息。
- [x] 胜利后展示敌方队伍，并允许交换 1 只。
- [x] 默认目标为 7 连战。
- [x] 中文显示已覆盖宝可梦、招式、特性、道具、属性、性格、状态等主要内容。
- [x] 启动脚本 `./start_game_cli` 已可直接使用。

## 怎么启动

进入项目目录：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattle
```

启动文字版：

```bash
./start_game_cli
```

默认每次启动都会生成一个真实随机种子，并打印出来：

```text
随机种子: 123456789
```

如果遇到一局很有意思、很离谱、或者怀疑有 bug，可以用这个 seed 复现：

```bash
./start_game_cli --seed 123456789
```

无人值守烟测：

```bash
./start_game_cli --seed 123 --battles 1 --auto
```

## 桌面版开发入口

Electron + React 桌面版正在搭建中，目前已经能打开基础候选页，并接入本地桌面存档读写。它不会影响上面的 CLI，文字版仍然是当前最完整的可玩入口。

安装依赖后启动桌面开发版：

```bash
./start_game_desk
```

构建桌面端前端产物：

```bash
pnpm desktop:build
```

## Showdown 依赖

Pokemon Showdown 不提交进本仓库，它是外部引擎依赖。默认路径是：

```bash
/home/alexqfmm/workPlace/pokemon/pokemonShowdowm/pokemon-showdown
```

也可以用环境变量覆盖：

```bash
export SHOWDOWN_PATH=/path/to/pokemon-showdown
./start_game_cli
```

Showdown 需要已经安装依赖并构建过，项目会检查：

```text
SHOWDOWN_PATH/dist/sim/index.js
```

如果找不到，会给出明确错误提示。

Showdown 回合协议的解析和桌面演出规则记录在：

```text
docs/showdown-battle-log.md
```

## CLI Windows Release

文字版可以打成 Windows 友好的 zip，包内会带上精简后的 `vendor/pokemon-showdown` 构建产物：

```bash
python3 tools/package_cli_release.py
```

输出文件：

```text
release/changeBattle-cli-win.zip
```

Windows 侧使用方式：

1. 解压 `changeBattle-cli-win.zip`。
2. 双击 `ChangeBattle.cmd`。
   - 已有 Python 3.10+ / Node.js 20+ 时会直接启动。
   - 缺依赖时会询问是否通过 `winget` 安装。
   - 安装/检查完成后会自动启动游戏。

也可以手动分步执行：

1. 双击 `install_windows.cmd`。
2. 双击 `start_game_cli.cmd`。

PowerShell 也可以运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\start_game_cli.ps1
```

## 操作说明

### 租赁选择

候选页每次显示 1 只宝可梦的详细信息，包括：

- 等级、属性、性格修正。
- 最终能力值、种族值、个体值、努力值。
- 特性和说明。
- 道具和说明。
- 4 个招式的属性、分类、威力、命中、PP、效果说明。

输入：

```text
n      下一只
p      上一只
t      选中/取消选中当前宝可梦
1-6    跳转到指定候选
q      退出
```

选满 3 只后自动进入第一场战斗。

### 战斗主菜单

战斗页默认只显示当前必要信息：

```text
1. 技能
2. 道具（暂未开放）
3. 队伍 / 换人
4. 对局状态
5. 认输
q. 退出
```

主菜单上方会展示：

- 当前回合。
- 我方当前宝可梦与对方当前宝可梦。
- HP、异常状态、能力变化。
- 上一回合战斗信息。

### 技能菜单

输入 `1` 进入技能页，再输入：

```text
1/2/3/4  使用对应招式
b        返回主菜单
```

招式的可用性、PP、命中、伤害、追加效果都由 Showdown 判定。

### 队伍菜单

输入 `3` 进入队伍页。

可以看到：

- 当前队伍顺序。
- 哪只是当前上场宝可梦。
- 每只宝可梦的实时 HP/状态。
- 实时持有道具。

输入：

```text
1/2/3    查看对应宝可梦详细信息
s2/s3    换到对应位置
b        返回主菜单
```

换人后队伍顺序会跟随 Showdown 当前运行时顺序。详情页会按当前行的宝可梦匹配，不再按初始顺序错位。

### 对局状态

输入 `4` 进入对局状态页。

当前会展示：

- 天气。
- 全场效果。
- 我方场地状态。
- 对手场地状态。
- 双方当前宝可梦。
- 最近战报。

## 图片资源

当前已支持从本地 `green.gba` 抽取宝可梦像素图。这个 ROM 是 Emerald 改版，内含大量宝可梦正面、背面、普通色和闪光色资源。

已整理的本地资源目录：

```text
assets/pokemon-green/pokemon/{index}/front_normal.png
assets/pokemon-green/pokemon/{index}/back_normal.png
assets/pokemon-green/pokemon/{index}/front_shiny.png
assets/pokemon-green/pokemon/{index}/back_shiny.png
```

`assets/pokemon-green/` 是本地资源目录，已被 `.gitignore` 忽略，不随仓库发布。Showdown species 到图片的可校对源映射在：

```text
data/sprite_index_map.csv
```

运行时读取的 manifest 由 CSV 生成：

```text
data/sprite_index_map.json
```

发现错图时改 CSV 的 `species_id,image`，再运行 `python3 tools/build_sprite_index_map.py` 重建 JSON。桌面 UI 按 `species_id -> sprite_index_map.json -> image path` 查图；找不到时回退 `assets/placeholders/pokemon.png`。详细导出和映射说明见 [docs/green-gba-assets.md](docs/green-gba-assets.md)。

桌面战斗特效已经有第一版通用表现层：

```text
data/battle_effect_assets.json
```

当前先用 CSS fallback 覆盖属性招式、异常、天气、场地、撒钉、出场/收回、倒下、回血、强化、道具和特性触发。后续可以用新脚本继续从 `green.gba` 摸索真实战斗特效候选：

```bash
python3 tools/extract_green_gba_battle_effects.py \
  /home/alexqfmm/workPlace/pokemon/green.gba \
  --out-dir dump/green-gba-battle-effects
```

## 项目结构

```text
changeBattle/
  start_game_cli       一键启动文字版
  changeBattle-cli/    CLI 游戏入口
  core/                Showdown 路径配置、Python 客户端、中文显示层
  showdown-adapter/    Node 侧 Showdown Teams/BattleStream 适配器
  data/                中文覆盖表、描述表、资源 manifest
  assets/              占位图、属性色块和未来 UI 图片资源
  docs/                规则文档、随机规则、Showdown 集成、green.gba 图片资源说明
  tools/               资源校验、green.gba 抽图、sprite 映射脚本
  plan.md              当前阶段计划与完成情况
```

## 当前架构

Python CLI 不直接计算战斗。

流程大致是：

```text
play.py
  -> core/showdown_client.py
    -> showdown-adapter/adapter.js
      -> Pokemon Showdown dist/sim
```

Showdown 负责：

- 宝可梦、招式、特性、道具、属性等权威数据。
- 队伍生成和 set pack/unpack。
- BattleStream 对战流程。
- 伤害、命中、会心、追加效果、异常、特性、道具、天气、场地。
- 合法行动、强制换人、胜负判定。

ChangeBattle 负责：

- 对战工厂式流程。
- 玩家输入。
- 中文显示和战报翻译。
- 对手信息隐藏。
- 胜后交换。
- 未来的租赁池、难度曲线、图形化 UI 和资源系统。

## 已知限制

- 当前候选池来自 Showdown `gen7randombattle`，还不是专门设计的对战工厂租赁池。
- 当前战斗 format 使用 `gen7customgame` 承接随机 set，后续需要更细地整理规则限制。
- 道具菜单暂未开放，当前只支持宝可梦自己携带道具在战斗中自动生效。
- 敌方行动目前是随机合法行动，还没有 AI 策略。
- 中文词库已经覆盖大量内容，但仍可能有翻译缺失或显示不够自然。
- 终端 UI 仍是第一版，后续可以继续压缩排版、增强战报层级。
- green.gba 宝可梦图片已完成本地抽取和映射，但尚未接入 CLI/桌面 UI；形态图仍需要后续手工校正。

## 下一步

短期优先级：

- 做专属对战工厂租赁池，而不是直接使用 random battle。
- 补充更自然的中文战报，尤其是复杂招式、特性、道具触发。
- 强化敌方随机行动，让它至少避免明显离谱操作。
- 增加连胜记录、挑战结算、交换历史。
- 完善终端 UI 的分页和信息层级。

中长期方向：

- Electron 图形化版本。
- 将 `data/sprite_index_map.json` 接入 UI，实现 Showdown species 自动查图。
- 继续逆道具图标、招式特效等非宝可梦资源。
- 更接近原版对战工厂的难度曲线和 Boss 局。
- 未来再考虑 Showdown server / Docker / 联机玩法。
