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
- [x] 8. 用户档案与存档系统
- [x] 9. CLI 交易/休整系统首版
- [ ] 10. Electron 单机桌面版路线
- [ ] 11. 轻量服务器与后续联机路线

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
- 注意：这是一版历史最小流程；当前 CLI 已升级为第 9 阶段的休整菜单，交换现在发生在休整菜单中。

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
- 注意：这是一版历史最小流程；当前 CLI 已升级为车轮战状态继承，不再每局自动恢复满 HP/PP/异常。

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

- 项目路径：`/home/alexqfmm/workPlace/pokemon/changeBattle`
- Showdown 路径：`/home/alexqfmm/workPlace/pokemon/pokemonShowdowm/pokemon-showdown`
- 今晚默认 format：`gen7customgame`
- 今晚默认队伍来源：Showdown `gen7randombattle` 生成结果裁剪成 3v3
- 今晚不做联机、不做 Docker、不做图片动画、不做完整中文润色

## 8. 用户档案与存档系统

状态：已完成。

目标：增加游戏外层流程，让玩家可以创建训练师、读档、新游戏、查看用户信息，并在每小局结束的存档点恢复挑战进度。

计划：

- 新增单存档文件：
  - 路径：`saves/save.json`
  - `.gitignore` 忽略 `saves/`
  - `version = 1`
  - `trainer` 保存姓名和性别。
  - `stats` 保存对战点数、总对局数、胜场、败场、胜率、Rank 状态。
  - `current_run` 保存进行中的对战工厂挑战；无挑战时为 `null`。
- 启动流程改为：
  - `1. 读取存档`
  - `2. 新游戏`
  - 读取存档时，如果存在进行中挑战，直接恢复到对应阶段。
  - 新游戏需要输入训练师姓名和性别；已有存档时覆盖前确认。
- 游戏主界面新增：
  - `1. 开始对局`
  - `2. 用户信息`
  - `3. 退出游戏`
  - 用户信息页可编辑训练师姓名和性别。
- 存档点规则：
  - 小局中途不存档。
  - 每小局胜负结束后保存一次。
  - 胜利后保存为小局结束阶段。
  - 小局结束处理完成后保存为下一局准备状态。
  - 失败或 7 连胜通关后更新统计、清空 `current_run` 并回主界面。
- 统计规则：
  - 每小局胜利：总对局数 +1，胜场 +1。
  - 失败：总对局数 +1，败场 +1。
  - Rank 第一版不计算，显示“未开放”。

验证：

- 无存档读取不崩溃，会回到启动菜单。
- 新游戏可创建 `saves/save.json`，JSON 可正常解析。
- 有存档时新游戏覆盖需要确认。
- 胜利后退出，再读档能恢复到小局结束阶段。
- 用户信息统计和胜率正确。
- `./start_game_cli --seed 123 --battles 1 --auto` 仍可跑通。

## 9. CLI 交易/休整系统首版

状态：已完成。

目标：把 CLI 挑战升级为车轮战。玩家队伍的 HP、PP、异常跨小局继承；每小局胜利后进入休整菜单，再决定保存、进入下一场、交换宝可梦或花 BP 恢复。

实际结果：

- `showdown-adapter/adapter.js` 新增 `state` 与 `syncState` 命令，可读取 Showdown 当前队伍 HP/异常/PP，并在下一小局开局同步回 BattleStream。
- `core/showdown_client.py` 新增 `state()`、`sync_state()`。
- `changeBattle-cli/play.py` 的 `current_run` 增加 `player_state`、`bp_earned_this_run`、`rest_status`、`enemy_raw`、`enemy_display`。
- 胜利后保存为 `status=awaiting_rest`，读档会回到休整菜单。
- 休整菜单包含：下一场、保存、交换宝可梦、恢复 HP、恢复 PP、恢复异常状态、调整能力值，以及购买道具/调整技能占位。
- 交换费用为本次休整第 1/2/3 只分别 `0/1/2BP`，交换来的宝可梦满 HP、满 PP、无异常。
- 恢复 HP 费用为选择 1/2/3 只分别 `1/2/3BP`。
- 恢复 PP 费用为选择 1/2/3 只分别 `0/1/2BP`，恢复该宝可梦全部招式 PP。
- 恢复异常费用为选择 1/2/3 只分别 `0/0/1BP`。
- 调整能力值费用为 `10BP`，可调整个体值、特性、性格、努力值；保存时校验个体 `0-31`、努力值单项 `0-255`、总和不超过 `510`。
- 新增 `data/goods.csv` 作为 BP 消费配置表，字段为 `item_id,item_type,item_name,item_cost`；当前包含 `skill`、`item`、`service` 三类。
- `tools/build_goods_csv.py` 可从本地 Showdown 数据生成默认价格：道具默认 `5BP`；技能按威力分档，变化/低威力 `1BP`，最高档 `5BP`；交换、恢复、能力调整等休整服务也通过 `service` 行覆盖价格。
- 购买道具已开放：购买后的道具进入当前大局 `bag_items`，大局结束后随 `current_run` 清空；装备新道具或交换宝可梦时，原携带道具会自动卸下回到本局背包。
- 调整技能已开放：技能候选来自 Showdown Gen7 合法学习表，不能给宝可梦学习非法招式；替换技能时按 `goods.csv` 扣 BP，旧技能投资返还一半（向下取整）。
- 每小局胜利立即获得 `5BP`；完成一大局挑战额外获得 `连胜局数 * 2 + 7`。
- 连胜局数按“大局”计算：默认 `7` 小场全赢才算连胜 `1` 局；连续通关第二大局才算连胜 `2` 局。
- 失败首版不扣 BP，清空当前挑战并返回主界面。
- `--auto` 模式会跳过休整直接进入下一场，保留烟测能力。

验证：

```bash
PYTHONPYCACHEPREFIX=/tmp/changebattle-pycache python3 -m py_compile changeBattle-cli/play.py core/showdown_client.py
node --check showdown-adapter/adapter.js
PYTHONDONTWRITEBYTECODE=1 ./start_game_cli --seed 123 --battles 1 --auto
PYTHONDONTWRITEBYTECODE=1 ./start_game_cli --seed 123 --battles 2 --auto
```

已确认：

- 第二小局开局会继承第一小局结束后的 HP/异常状态。
- BP 公式：默认 7 小场通关时，小场奖励 `35BP`，第 1 大局通关额外 `9BP`，合计 `44BP`。
- 连续通关第 2 大局时，通关额外奖励为 `11BP`。
- 休整交换按 `0/1/2BP` 扣费。
- 恢复 HP/PP/异常会更新 `player_state`，并用于下一小局同步。

## 10. Electron 单机桌面版路线

状态：进行中。

目标：优先做本地单机桌面版，不要求服务器参与核心战斗和存档。桌面版用 Electron + React + TypeScript，把 Pokemon Showdown 作为本地 npm 依赖调用。这样既能复用 Showdown 的完整规则，又能保留后续 H5/Web 化的界面资产。

定位：

- 当前 Python CLI 继续作为玩法验证版本。
- 下一阶段新增 Node/TypeScript GameService，逐步承接 CLI 里对 Showdown adapter 的调用。
- Electron 客户端负责窗口、页面、输入、存档文件、GitHub Release 分发。
- 单机版所有计算都在本地完成，不依赖云服务器。
- 本地存档继续优先，账号系统和云同步后置。

技术路线：

- 建立桌面端工作区：
  - `apps/desktop`：Electron 主进程、预加载脚本、React 渲染端。
  - `packages/game-service`：TypeScript 封装 Showdown、租赁生成、对局流程、存档模型。
  - `packages/shared`：通用类型、中文文本、资源索引。
- Showdown 依赖方式：
  - 使用 npm 包或本地 pinned 版本，不把完整 Showdown 仓库塞进项目。
  - 只调用 `pokemon-showdown` 的 sim/data/team 相关能力。
  - 固定版本，避免规则变化导致存档/战斗表现漂移。
- UI 目标：
  - 复刻当前 CLI 流程：启动菜单、新游戏/读档、主界面、6 选 3、对战菜单、技能页、队伍页、对局状态页、结算与交换。
  - 中文优先显示，英文作为辅助信息。
  - 一开始不追求动画，先保证桌面 UI 清楚、稳定、可玩。
- 存档：
  - 第一版使用本地 JSON 或 SQLite。
  - 存档目录使用 Electron `app.getPath('userData')`。
  - 继续沿用“小局结束才保存”的原则。
- 打包：
  - 使用 `electron-builder`。
  - Windows Release 优先，Linux 构建作为开发验证。
  - GitHub Release 上传安装包/zip。

计划步骤：

- [x] 10.1 初始化 Node/TypeScript 桌面工作区。
- [x] 10.2 把当前 `showdown-adapter/adapter.js` 升级为 TypeScript `GameService`。
- [x] 10.3 实现 Electron 空窗口和 React 基础布局。
- [x] 10.4 接入本地存档读写。
- [ ] 10.5 复刻训练师创建、读档、新游戏、主界面。
- [ ] 10.6 复刻 6 选 3 选择界面。
- [ ] 10.7 复刻基础对战菜单：技能、队伍、对局状态、认输。
- [ ] 10.8 复刻结算、交换、7 连战闭环。
- [ ] 10.9 打包 Windows 可执行版本并写 Release 流程。

验证：

- `pnpm install` 能安装桌面依赖。
- `pnpm desktop:dev` 能启动 Electron 窗口。
- 桌面版能完成一局 3v3。
- 桌面版能完成 7 连战挑战。
- 关闭再打开能读取本地存档。
- GitHub Release 包在 Windows 上解压即可运行。

## 11. 轻量服务器与后续联机路线

状态：未开始。

目标：服务器不参与第一阶段单机核心玩法。等桌面单机稳定后，再按轻量化路线补在线能力。服务器优先做“联机入口和状态服务”，而不是一上来重做完整 Web 游戏。

定位：

- 单机版：本地计算、本地存档、本地可玩。
- 轻量服务器第一版：在线状态、版本公告、排行榜、每日种子、挑战记录上传。
- 联机版后续：房间、匹配、WebSocket 对战协议、断线处理、旁观。
- 若未来做强权威联机，再考虑服务器持有 battle 状态并统一判定行动。

服务器路线：

- 可以继续参考 xstack 的成熟设计，但只抽取需要的部分。
- 第一版服务尽量轻：Node/TypeScript + SQLite 或 Postgres 二选一。
- 有账号系统时再引入数据库用户表、密码哈希、session/token。
- 有在线检测/踢下线需求时再引入 WebSocket presence。
- Docker 部署后置，保持和现有 `citra-room`、`yuzu-multiplayer` 服务一样轻。

计划步骤：

- [ ] 11.1 明确服务器只做辅助服务，不影响单机运行。
- [ ] 11.2 设计账号/本地存档/云同步边界。
- [ ] 11.3 设计排行榜和每日挑战种子。
- [ ] 11.4 设计联机房间协议。
- [ ] 11.5 Dockerfile + docker-compose。
- [ ] 11.6 nginx 反代部署。

注意：

- 不在桌面单机版完成前启动服务器大改。
- 不让服务器成为启动游戏的必需条件。
- 后续联机如果要公平性，必须让服务器掌握随机数和行动结算，不能只信客户端。
