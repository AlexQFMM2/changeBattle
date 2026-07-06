# ChangeBattle V2

一个干净的新基座。当前阶段已经进入 V2 正式游戏可玩验证期：V1 风格首屏/首页、训练配置页、Battle V4 战斗页、正式 GameRun、休息室/商店/训练场/治疗服务、长期玩家仓库、星图天赋静态化、Windows Desktop portable release 和桌面端文件级增量更新都已经接入。

## Repository / Branch

V2 仍在原 ChangeBattle 仓库内维护。当前本地工作目录是独立 checkout/worktree：

```txt
repo: /home/alexqfmm/workPlace/pokemon/changeBattleV2
remote: git@github.com:AlexQFMM2/changeBattle.git
current branch: v2
GitHub default branch: release
```

长期分支约定：

```txt
release   正式发布分支，对应 stable 更新通道
v2        日常开发 / 新功能测试主线，对应 beta 测试通道
update    更新系统 / 发布流程专项分支，验证后合回 v2
hotfix/*  从 release 临时切出的正式版修复分支，不长期保留
```

权威开发和发布流程见 `docs/gitAbout.md`。

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
- Battle V4 播放顺序：后端 Showdown Playback Compiler 用 client `Battle + BattleSceneStub` 编译 rawLog timeline，前端使用 Showdown 风格 scheduler 顺序消费 `stepQueue/currentStep/scene work`，详见 `docs/battle-playback-showdown-parity.md`。
- Battle V4 展示层：闪光立绘、天气/场地/墙/钉子状态、形态变化、极巨化 timeline、左侧事实解说列表、裁判/训练家开场和结束对话框都已接入或进入回归验证。
- 新休息室基础流程：我的队伍、我的背包、图鉴、下一场预览、治疗、训练场、结束休整、放弃比赛。
- 休整页图鉴接入：左侧公告栏图鉴入口、下一场未知宝可梦解锁、已解锁后打开 QuickDex 对应详情。
- 统一背包组件：休整页和 Battle V4 共用 `PlayerBagPanel`；休整页展示完整 `Player.bag`，战斗页只展示 `canBattleUse` 道具，并按页面注入不同宝可梦目标列表。
- 休整页背包：测试背包生成、道具详情、队伍选择、携带/更替/卸下、普通道具丢弃、恢复道具、PP 药、复活/异常恢复、树果恢复、训练道具和技能机器立即使用均已接入；成功后消耗实例，只更新内存草稿，不自动保存。
- Battle V4 背包：恢复类战斗道具已能占用当前行动槽，先于普通行动结算并消耗 `Player.bag` 实例；场上 HP 恢复会输出 heal 事件供现有时间线播放。
- Battle V4 状态同步：战斗入场会同步本地队伍剩余 PP 到 Showdown，旧存档缺 PP 字段时保持 Showdown 默认满 PP；战斗页已识别 Substitute 开始/结束并显示持续“替身”标记。
- 图鉴技能来源接口：自学、教授、遗传、技能机器来源已沉为 API；休整页随机技能只从自学池抽取，TM 合法性使用技能机器池判断。
- 训练道具：EV 增减药、25 种性格薄荷、特性胶囊/膏药、神奇糖果、银色/金色/灰色王冠已接入结构化效果；药剂仍遵守 EV 510/单项 252，但不再被旧数值等级 cap 额外阻挡。
- 休整页手动保存策略：队伍、背包、预览解锁等交互只更新内存草稿，只有小黑板“保存”写入 RunGame 快照。
- 休整页组件边界规范化：队伍、背包、公告栏、下一场预览、小黑板、标题牌、确认弹窗均拆为独立组件和独立 CSS，并接入组件预览目录。
- 休整页体验补齐：队伍底部排序按钮、背包/队伍底部宽选择区、背包成功 toast、弹层背景点击关闭、结束休整首发濒死校验。
- 正式休整商店：购买/售出双向交易、5 类 5x3 商品板、正式低价经济、按实例 `cost / 4` 售出、购买碎裂/补货动画、加权补货和队伍状态推荐话术均已接入；自动补货默认开启，不再依赖星图节点。
- 正式休息室治疗：公告栏治疗按钮使用 `TrainingRestShopDialogue` 对话框确认，基础 250 金币，医保 basic/standard/premium 分别 9/8/5 折，成功后全队 HP/异常/PP 恢复。
- 正式训练场：从随机课程改为自由选课，课程选择使用 NPC 对话框和 2x2 课程面板；遗传学、实践课、自学招式、自习课四类课程由用户选择后进入。
- 正式流程稳定化：NPC 等级改为按玩家队伍最高等级动态计算，究极异兽在正式候选中统一归入神兽分类，自习收益改为按当前 IV/EV 缺口动态追赶，并继续使用逐次自习随机种子。
- 星图天赋静态化：节点 catalog 同时声明展示文案和 `runtimeEffects`，业务侧显式读取效果；新增/移除天赋时维护静态节点、对应业务分支和 smoke 断言即可。
- 星图新天赋“随身携带”：点亮后，每个正式 run 第一次进入休整页时，会从玩家长期仓库的预备背包随机带入最多 3 种道具，每种 1 个，并扣减预备背包库存；run 内只触发一次。
- 玩家长期仓库：玩家道具/宝可梦已从 profile 中拆到独立 player vault，背包仓库支持预备箱/存储箱、移动、丢弃和解锁箱页；正式结算会把本局背包道具放入长期存储箱。
- 休整页弹窗栈：背包触发的技能学习替换、Mega/Z/太晶系统道具重铸等二级弹窗已提升到背包上方，关闭上层弹窗不会误关闭背包。
- 通用弹窗组件：`AppModal` 已作为统一遮罩层 + 居中弹窗组件接入，后续系统弹窗优先复用它，避免局部 z-index/绝对定位造成层级错乱。
- Battle V4 提交流水：控制台会按“等待补全 / 草稿完成 / 正在提交 / 提交成功 / 提交失败”打印高信号日志；双打残局里攻击目标会正确携带目标后缀，避免卡在 `1/2` 没有反馈。
- 正式赛程：7 场正式战斗已采用小组赛/晋级赛阶段命名，战斗开场/结束按裁判和训练家对话流程组织。
- 特殊系统：gen7 会保障玩家初始候选至少 2 个可 Mega 宝可梦，NPC 队伍至少 1 个 Mega 手并携带映射 Mega 石；Z 招式专属优先并补齐 required move；gen8/9 NPC 默认获得极巨手环/太晶珠。
- Windows Desktop portable release：一键 Windows 构建链路已跑通；`0.1.1` 是文件级增量更新初始化版本，`0.1.2` / `0.1.3` 已验证从旧包启动后自动下载增量、校验、替换并提示重启。当前 stable latest 是 `0.1.3`。

当前明确不做：

- app 端。
- 完整 roguelike 奖励扩展、长期循环平衡和安装器/签名。
- 旧 `dexSearch` 兼容。

当前 Battle V4 / Rest V4 进度：

- 训练场休整页可以进入真实 Battle V4 中转页。
- Battle service 使用 Showdown `BattleStream` 创建 session，保留 raw protocol/request/debug。
- 战斗页使用 V2 风格战斗壳展示场景、HP、模型、指令、日志/解说和裁判对话。
- 单打、双打、合作使用同一 session API 和合法随机 AI 推进；特殊系统 gate 和 AI 选择已有 core smoke 覆盖。
- 天气/场地持久层会按资源 key 重建 video/image 层，避免沙暴、雨天、晴天、雪天切换时继续播放旧资源。
- 当前主要工作点已经从“打通流程”转到正式游戏内容打磨、战斗演出稳定性、NPC 队伍质量和 Windows portable 体验。

下一步：

- 继续回归 Battle V4：形态变化、濒死/换人、天气场地、HP/PP/状态继承、目标选择和双打 seat 映射。
- 继续打磨正式 GameRun：NPC 配队、特殊系统、商店/训练经济、赛程叙事和结算体验。
- Windows release 后续可做 `ChangeBattle-V2-Desk.exe` launcher，替代当前 `.cmd` 启动入口；安装器、签名仍不在当前范围。

详细路线见 `docs/training-and-battle-roadmap.md`。

## UI Rules

做任何页面、弹窗、面板或大型组件前，先读 `docs/ui-design.md`。V2 继续沿用 V1 的 `640 x 320` 游戏视口、像素密度、组件边界和参考图约束；首屏/首页优先复刻 V1 现有组件体验。

参考图保留在 `plan/ui-refences/`。

休整页里的“对话框”特指带角色立绘、底部文本框和操作按钮的 `TrainingRestShopDialogue` 组件：`apps/web/src/components/training/TrainingRestShopDialogue.tsx`，样式在同目录 `TrainingRestShopDialogue.css`。商店、训练场、治疗服务、类似 NPC 交互都应优先复用这个组件；不要把它误替换成 `TrainingRestConfirmDialog`、自定义浮层、空交互面板或其它临时 UI。`TrainingRestConfirmDialog` 只用于真正脱离 NPC 的系统二次确认，例如放弃比赛、本局结算提示等，不承担 NPC 讲解/选项对话。

## Asset Rules

运行时图片、音频、图标等共享资源统一放在仓库根目录的 `assets/` 下，例如 `assets/aboutIcon/coin.png`、`assets/shop/rest-store/...`、`assets/training-ground/learn.png`。前端组件通过 `assetUrl("...")` 引用这些资源，路径相对于 `assets/` 根目录，例如 `assetUrl("rest/heal.png")`。

不要把这类资源临时放到 `apps/web/src/assets/` 或随意放进 `apps/web/public/`。`apps/web/src/assets/` 只适合真正需要被代码模块静态 import、并且已有明确局部打包约定的源码内资源；休整页、商店、训练场、战斗页等运行时 UI 资源默认都属于根目录 `assets/`。新增资源前先检查 `assets/` 里已有分类，优先复用/扩展现有目录，避免只为一个图标新开孤立资源体系。

## Commands

```bash
pnpm install
pnpm battle:dev
pnpm web:dev
pnpm desktop:dev
pnpm typecheck
```

`./start_desk` 会自动清理本项目旧的 battle service、desktop dev、Electron 主进程和 renderer dev server（默认 `127.0.0.1:5181`），再启动本地 battle service（默认 `127.0.0.1:5191`）和桌面端。看到“代码改了但 UI 还是旧的”时，优先从 `pnpm desk:dev` / `./start_desk` 重新启动；不要直接复用旧的 5181 renderer。

`pnpm desktop:dev` 只启动桌面端，不启动 battle service；但它也会在 dev 启动前清理本项目旧的 renderer/Electron 进程，避免接到 stale Vite 页面。Web 端手测真实战斗时需要另开一个终端运行 `pnpm battle:dev`。

## Desktop Release

当前发布形态是 Windows Desktop portable zip，而不是安装器。当前 stable 已发布：

```txt
release/ChangeBattle-V2-Desk-portable-v0.1.3.zip
source: v2@1c8bd4e6
generated: 2026-07-06 Asia/Shanghai
size: 约 598 MiB
stable latest: http://119.45.240.157/changebattle/latest.json
stable site:   http://119.45.240.157/changebattle/
beta latest:   http://119.45.240.157/changebattle-beta/latest.json
beta site:     http://119.45.240.157/changebattle-beta/
```

玩家解压后运行：

```txt
ChangeBattle-V2-Desk.cmd
```

`.cmd` 不是业务运行时，只是 portable launcher：用 `%~dp0` 计算解压目录，设置 `CHANGEBATTLE_PROJECT_ROOT`、Showdown runtime vendor、Showdown client vendor 等环境变量，然后调用包内 `runtime/electron/electron.exe` 启动 `apps/desktop`。VSCode 那种可见 `.exe` 也是 Electron，但走了更完整的应用打包/launcher/安装器体系；V2 现在先保留已验证的 portable 目录结构，后续如果要美化启动入口，优先做一个小型 `ChangeBattle-V2-Desk.exe` launcher 来替代 `.cmd`，而不是立刻重做完整安装器。

桌面端更新能力：

- 启动后后台读取当前通道的 `latest.json`。
- 普通游戏代码/资源变化会自动下载增量文件、校验、替换，并提示重启后生效。
- 右下角版本徽标可手动检查更新，已是最新时显示“当前已是最新版本”。
- Electron runtime、launcher、updater 或 portable 目录结构变化仍要求完整包。

正式/测试通道：

```txt
release 分支 -> stable -> http://119.45.240.157/changebattle/
v2 分支      -> beta   -> http://119.45.240.157/changebattle-beta/
```

只生成 release 按：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattleV2
CHANGEBATTLE_RELEASE_CHANNEL=stable ./tools/build_release_on_windows.sh 0.1.4
```

生成 release 并同步更新提示清单按：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattleV2
CHANGEBATTLE_RELEASE_CHANNEL=stable ./tools/build_release_and_publish_update.sh 0.1.4
```

更新服务器只托管小文件和增量文件：

```txt
http://119.45.240.157/changebattle/latest.json
http://119.45.240.157/changebattle/manifests/vX.Y.Z/files.json
http://119.45.240.157/changebattle/files/vX.Y.Z/...
```

`latest.json`、版本比较、channel URL、文件清单对比和增量路径校验的纯规则在 `packages/changebattle-v2-core/src/desktopUpdateCatalog.ts`；Electron 主进程负责拉取清单、下载增量、校验和替换文件。脚本只发布 manifest/download page/incremental files，不上传约 600 MiB 的 portable zip；完整包下载镜像通过 `CHANGEBATTLE_RELEASE_MIRRORS` 写入 `latest.json` 和游戏官网。

详细流程、服务器目录、Windows 构建机、检查项和排错见 `release/README.md` 和 `release/docs/windows-desktop-release.md`。

## Battle Playback Verification

遇到“某只宝可梦替另一只播放死亡动画”“技能/伤害/换人顺序不对”“前端疑似重复消费”等问题时，先不要直接改动画层，先用 diagnostics rawLog 验证两层顺序：

1. 后端 Showdown client compiler 顺序：

```bash
node tools/probe-showdown-playback.mjs debug/battle-v4-diagnostics-xxx.json
```

这个命令把 diagnostics 里的 `rawLog` 喂给正式 `packages/showdown-battle-core/dist/playbackCompiler.js`，输出 `ShowdownPlaybackTimelineV4.groups` 的简表：group id、raw index、waitMode、scene call signature 和 summary。若看到 `move/damage/faint/result` 变成 `scene-only` 且排在后续 `switch/turn` 后面，优先查后端 compiler 的 raw call mapping / grouping，不要先怀疑 React CSS 动画。

2. 前端 scheduler 消费顺序：

```bash
pnpm --dir . --filter @changebattle-v2/web test:scheduler
node tools/probe-battle-scheduler-parity.mjs debug/battle-v4-diagnostics-xxx.json
```

这个命令把同一份 backend groups 喂给前端 `createBattleV4ShowdownSchedulerPlan` 纯函数，检查：

- `backend group order === scheduler step order`
- `backend scheduler-signature === scheduler signature`
- diagnostics 里实际 `playbackStepConsumption` 是否按 backend group 前缀消费

判定顺序：

- backend timeline 已经错：修 `packages/showdown-battle-core/src/playbackCompiler.ts`。
- backend timeline 对、scheduler plan 错：修 `apps/web/src/components/battle-v4/useBattleV4ShowdownScheduler.ts`。
- backend timeline 和 scheduler plan 都对，但画面错：修 scene call 到 React/CSS 动画、sprite instance、HP/statbar 映射。

可选参数：

- `--json`：输出摘要 JSON，方便 diff。
- `--full`：带完整 timeline / plan。
- `--saved`：直接读取 diagnostics 里保存的 `showdownPlaybackTimeline`，不重新编译 rawLog。
