# ChangeBattle Tonight Plan

目标：今晚先看到一个能玩的文字版对战工厂最小流程。  
原则：**数据与战斗规则都走 Pokemon Showdown**；本项目只做玩法流程、输入输出、中文/资源补充。每完成一步打 `[x]`。

## Progress

- [x] 1. 现有原型与方向确认
- [x] 2. Showdown 引擎配置
- [x] 3. Showdown 租赁队伍生成
- [x] 4. CLI 接入 Showdown 3v3
- [x] 5. 单场胜负与交换
- [x] 6. 7 连战最小闭环
- [x] 7. 清理本地 legacy 数据

## 1. 现有原型与方向确认

状态：已完成。

已确认：

- 本项目已有纯 Python 原型，可作为参考，但不再继续扩写战斗规则。
- Showdown 已在本机跑通：
  - 路径：`/home/alexqfmm/workPlace/pokemon/pokemonShowdowm/pokemon-showdown`
  - `npm ci` 可安装依赖。
  - `node build --force` 可构建。
  - `simulate-battle --skip-build` 可跑随机战斗和自定义 3v3。
- Showdown server 仓库没有完整图片/动画资源；图片以后再看 client 或官方 sprites。

后续定位：

- Showdown 是宝可梦数据源和战斗规则源。
- 本项目不再维护宝可梦、招式、特性、道具、学习表的战斗权威数据。
- 本地 PokeDex dump JSONL 降级为 legacy，后续只保留有用的中文/资源/玩法配置。

## 2. Showdown 引擎配置

状态：已完成。

目标：让项目能稳定找到并调用本机 Showdown。

计划：

- 新增 `.env.example`：
  - `SHOWDOWN_PATH=/home/alexqfmm/workPlace/pokemon/pokemonShowdowm/pokemon-showdown`
- 新增 `docs/showdown.md`，记录：
  - Showdown 安装/build 命令。
  - 当前 commit。
  - `--skip-build` 使用要求。
  - 最小 battle 验证命令。
- 新增 `core/showdown_config.py`：
  - 从环境变量读取 `SHOWDOWN_PATH`。
  - 找不到时使用当前本机默认路径。
  - 检查 `dist/sim/index.js` 是否存在。
- 给出清晰错误提示，不静默失败。

实际结果：

- 已新增 `.env.example`。
- 已新增 `docs/showdown.md`。
- 已新增 `core/showdown_config.py`。
- 已新增 `core/showdown_client.py`。
- `python3 -m core.showdown_config` 和 `python3 -m core.showdown_client` 均可验证。

验证：

```bash
SHOWDOWN_PATH=/home/alexqfmm/workPlace/pokemon/pokemonShowdowm/pokemon-showdown \
python3 -m core.showdown_config
```

应输出 Showdown 路径、commit、dist 状态。

## 3. Showdown 租赁队伍生成

状态：已完成。

目标：第一版不再从本地 PokeDex JSONL 生成宝可梦，而是直接让 Showdown 生成可战斗 set。

计划：

- 新增 `showdown-adapter/` Node 脚本。
- 第一版直接调用 Showdown API：
  - `Teams.generate('gen7randombattle')` 获取随机 set。
  - 或使用 `Dex`/`Teams` 从 Showdown 数据生成 50 级 set。
- 为今晚可玩，默认采用 Showdown 随机队伍生成，再裁剪成 3v3：
  - 生成玩家候选 6 只。
  - 玩家选择 3 只。
  - 敌方从生成队伍中取 3 只。
- 所有 set 通过 Showdown 自己的 `Teams.pack` 进入 battle。
- 暂不自建 rank、权重、禁用池。
- 暂不强制全员 50 级；如果 Showdown random battle 给动态等级，今晚先接受。后续再做 Battle Factory 专用 50 级池。

验证：

- 固定 seed 能生成相同候选。
- 候选包含 species、ability、item、moves、level、evs、ivs。
- 生成的 packed team 能进入 `gen7customgame` 或合适 format 的 battle。

实际结果：

- 已新增 `showdown-adapter/adapter.js`。
- `generate` 命令直接调用 Showdown `Teams.generate('gen7randombattle')`。
- 固定 seed 可复现生成 6 只候选。
- CLI 第一版裁剪为 3v3。

## 4. CLI 接入 Showdown 3v3

状态：已完成。

目标：`changeBattle-cli/play.py` 使用 Showdown battle，不再走 Python 原型 battle。

计划：

- CLI 启动后：
  - 生成 6 只候选。
  - 展示编号、宝可梦、等级、道具、特性、招式。
  - 玩家输入 3 个编号选队。
- battle 初始化：
  - format 第一版用 `gen7customgame`。
  - 自动发送 `team 123` 或按玩家选择顺序发送队伍预览。
  - 敌方随机选择出场顺序。
- 行动输入：
  - `1/2/3/4` 使用招式。
  - `s2/s3` 换人。
  - `team` 查看队伍。
  - `q` 退出。
- 解析 Showdown `|request|`：
  - `active`：显示当前可用招式、PP、disabled。
  - `forceSwitch`：强制玩家换人。
  - `wait`：等待对方或系统，不要求输入。
- 敌方第一版随机合法行动。

验证：

```bash
SHOWDOWN_PATH=/home/alexqfmm/workPlace/pokemon/pokemonShowdowm/pokemon-showdown \
python3 changeBattle-cli/play.py --seed 123
```

应能完成一场 3v3 对战，并由 Showdown 自动处理全部战斗规则。

实际结果：

- `changeBattle-cli/play.py` 已改为 Showdown 驱动。
- 支持 6 选 3、team preview、招式、换人、强制换人、胜负。
- 支持 `--auto` 自动行动用于烟测。

## 5. 单场胜负与交换

状态：已完成。

目标：完成一场对战工厂式单局闭环。

计划：

- 对局结束后解析 Showdown `|win|` 或 battle end 数据。
- 玩家胜利：
  - 展示敌方 3 只宝可梦。
  - 允许选择 0 或 1 只与自己队伍交换。
- 玩家失败：
  - 显示失败结算。
  - 结束本轮。
- 第一版交换只换整只 Showdown set，不拆招式/道具。

验证：

- 胜利后可交换。
- 交换后玩家队伍进入下一局。
- 失败后不进入交换。

实际结果：

- 胜利后展示敌方 3 只。
- 玩家可输入 `玩家编号 敌方编号` 交换 1 只，或输入 `0` 跳过。
- 失败后显示连胜数并结束。

## 6. 7 连战最小闭环

状态：已完成。

目标：今晚如果时间够，做出一组 7 小局流程。

计划：

- 开局 6 选 3。
- 每局生成新的敌方 3 只。
- 胜利后可交换 1 只。
- 默认每局结束自动恢复满 HP/PP。
- 连胜到 7 局后显示通关。
- 失败则显示本轮连胜数并结束。

验证：

- 连胜计数正确。
- 交换后的队伍可继续下一局。
- 第 7 胜后流程结束。

实际结果：

- 默认 `--battles 7`。
- 每局生成新敌方。
- 胜后可交换。
- 连胜到目标场数显示通关。
- 失败显示挑战结束和连胜数。

## 7. 清理本地 legacy 数据

状态：已完成。

目标：Showdown 路线跑通后，清理不再作为主数据源的本地 PokeDex dump 文件。

计划：

- 保留：
  - `assets/`
  - `data/assets.json`
  - 后续新增的中文/玩法配置。
- 移除或迁移为 legacy：
  - `data/pokemon.jsonl`
  - `data/moves.jsonl`
  - `data/abilities.jsonl`
  - `data/items.jsonl`
  - `data/learnsets_usum.jsonl`
  - `data/type_chart.jsonl`
  - 其他由 PokeDex dump 生成的战斗数据。
- 清理 `core/__pycache__/` 等缓存目录。
- 删除或改写依赖旧 JSONL 的测试。
- README 改成 Showdown 数据源说明。

实际结果：

- 已移除旧 PokeDex JSONL 战斗数据。
- 已移除旧 Python 自研战斗核心和对应测试。
- 保留 `assets/` 与 `data/assets.json`。
- `tools/validate_pokedex_assets.py` 改为只校验本地资源 manifest。
- README 已改成 Showdown 数据源说明。

注意：

- 这一步放在 Showdown CLI 跑通之后做，避免今晚主线被清理工作打断。
- 删除前先确认没有运行入口依赖旧数据。

## Defaults

- 项目路径：`/home/alexqfmm/workPlace/pokemon/pokemonAbout`
- Showdown 路径：`/home/alexqfmm/workPlace/pokemon/pokemonShowdowm/pokemon-showdown`
- 今晚默认 format：`gen7customgame`
- 今晚默认队伍来源：Showdown `gen7randombattle` 生成结果裁剪成 3v3
- 今晚不做联机、不做 Docker、不做图片动画、不做完整中文润色
