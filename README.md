# ChangeBattle V2

一个干净的新基座。当前阶段已经完成 V1 风格首屏/首页、训练配置页、Battle V4 战斗页主体接入、正式 GameRun 新休整页和正式休整商店。

## Repository / Branch

V2 不是长期独立仓库；它属于原 ChangeBattle 仓库的 `v2` 分支。

```txt
canonical repo: /home/alexqfmm/workPlace/pokemon/changeBattle
remote: git@github.com:AlexQFMM2/changeBattle.git
branch: v2
current V2 working directory: /home/alexqfmm/workPlace/pokemon/changeBattleV2
```

提交时应提交到原仓库的 `v2` 分支。`changeBattleV2` 目录如果还没有 `.git`，需要先把它整理为原仓库 `v2` 分支的 worktree，或把当前 V2 文件作为 `v2` 分支根目录内容提交；不要把它当成新项目新仓库处理。

- `packages/showdown-dex-core`：Web/Desktop 共用的 Dex 数据、搜索、详情聚合、图片解析、中文翻译、能力计算、学习面反查。
- `apps/api`：Web/Desktop 共用的应用层 API facade，后续公共函数都放这里。
- `packages/showdown-battle-core`：Node-side BattleStream service。真实战斗逻辑在这里运行，Web/Desktop 只通过 HTTP adapter 读 snapshot / 提交 choice。
- `apps/web`：Web 端适配器、V1 风格首屏/首页、QuickDex 图鉴弹窗。
- `apps/desktop`：Desktop 端适配器，复用 Web UI。

当前已完成：

- V1 风格 `GameViewport`、首屏、首页、玩家设置基础体验迁移。
- 用户资料最小存档：只保存训练师基础信息。
- Showdown Dex Core：宝可梦、技能、特性、战斗道具搜索与详情。
- 本地 Showdown 资源：3D 四向立绘、小图 sheet、道具小图 sheet。
- 对 Showdown 缺失的 V2 sprite 路径，按 `missing-sprites.json` 从旧 runtime 精确补图，并用 `runtime-overrides.json` 标记可重置范围。
- 中文图鉴数据：中文名、中文说明、中文搜索、属性/分类/性格等基础翻译。
- 训练配置页：训练师、队伍、背包测试道具和训练场入口。
- RunGame 存档入口：主页支持发现存档后继续游戏；重新开始训练场会清理旧 RunGame。
- Battle V4 训练场/战斗页主体：Showdown BattleStream session、request/choice、战斗 UI 壳、核心 singles/doubles/coop 流程接入。
- Battle V4 播放顺序：后端 Showdown Playback Compiler 用 client `Battle + BattleSceneStub` 编译 rawLog timeline，前端按 `docs/battle-playback-showdown-parity.md` 消费消息/动画 step。
- 新休整页基础流程：我的队伍、我的背包、图鉴、下一场预览、结束休整、放弃比赛。
- 休整页图鉴接入：左侧公告栏图鉴入口、下一场未知宝可梦解锁、已解锁后打开 QuickDex 对应详情。
- 统一背包组件：休整页和 Battle V4 共用 `PlayerBagPanel`；休整页展示完整 `Player.bag`，战斗页只展示 `canBattleUse` 道具，并按页面注入不同宝可梦目标列表。
- 休整页背包：测试背包生成、道具详情、队伍选择、携带/更替/卸下、普通道具丢弃、恢复道具、PP 药、复活/异常恢复、树果恢复、训练道具和技能机器立即使用均已接入；成功后消耗实例，只更新内存草稿，不自动保存。
- Battle V4 背包：恢复类战斗道具已能占用当前行动槽，先于普通行动结算并消耗 `Player.bag` 实例；场上 HP 恢复会输出 heal 事件供现有时间线播放。
- 图鉴技能来源接口：自学、教授、遗传、技能机器来源已沉为 API；休整页随机技能只从自学池抽取，TM 合法性使用技能机器池判断。
- 训练道具：EV 增减药、25 种性格薄荷、特性胶囊/膏药、神奇糖果、银色/金色/灰色王冠已接入结构化效果；Mega/Z/太晶重铸仍保留入口但未实现。
- 休整页手动保存策略：队伍、背包、预览解锁等交互只更新内存草稿，只有小黑板“保存”写入 RunGame 快照。
- 休整页组件边界规范化：队伍、背包、公告栏、下一场预览、小黑板、标题牌、确认弹窗均拆为独立组件和独立 CSS，并接入组件预览目录。
- 休整页体验补齐：队伍底部排序按钮、背包/队伍底部宽选择区、背包成功 toast、弹层背景点击关闭、结束休整首发濒死校验。
- 正式休整商店：购买/售出双向交易、5 类 5x3 商品板、正式低价经济、按实例 `cost / 4` 售出、购买碎裂/补货动画、加权补货和队伍状态推荐话术均已接入。

当前明确不做：

- app 端。
- 完整 roguelike 奖励扩展、训练场设施和长期循环平衡。
- 旧 `dexSearch` 兼容。

当前 Battle V4 / Rest V4 进度：

- 训练场休整页可以进入真实 Battle V4 中转页。
- Battle service 使用 Showdown `BattleStream` 创建 session，保留 raw protocol/request/debug。
- 战斗页使用 V2 风格战斗壳展示场景、HP、模型、指令、日志。
- 单打已打通核心 smoke；双打/合作使用同一 session API 和合法随机 AI 推进，后续继续补完整目标选择与动画。
- 当前主要工作点已经从商店转到正式训练场设施：传授技能、蛋技能和自主训练。

下一步：

- 实现正式训练场：教授传授来源技能、教授蛋技能、自主训练随机个体值和努力值。
- 继续完善休整页队伍与图鉴联动，并继续按 `docs/ui-design.md` 拆组件、补 preview。
- 补战斗结束后的 HP/异常/PP/携带道具消耗精准继承与更多战斗背包用例。
- 继续把旧 `battle-v2` 的目标选择、换人面板、日志弹窗、倍速/调试按钮细节迁到 `battle-v4`。

详细路线见 `docs/training-and-battle-roadmap.md`。

## UI Rules

做任何页面、弹窗、面板或大型组件前，先读 `docs/ui-design.md`。V2 继续沿用 V1 的 `640 x 320` 游戏视口、像素密度、组件边界和参考图约束；首屏/首页优先复刻 V1 现有组件体验。

参考图保留在 `plan/ui-refences/`。

## Commands

```bash
pnpm install
pnpm battle:dev
pnpm web:dev
pnpm desktop:dev
pnpm typecheck
```

`./start_desk` 会自动尝试启动本地 battle service（默认 `127.0.0.1:5191`），再启动桌面端。Web 端手测真实战斗时需要另开一个终端运行 `pnpm battle:dev`。
