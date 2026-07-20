# ChangeBattle V2

一个从旧项目拆出的干净新基座。当前项目已经进入“正式 room 服务化 + Desktop/App beta 发布 + RunGame V5 数据结构收口”阶段：V1 风格首屏/首页、训练配置页、Battle V4 战斗页、正式 GameRun、休息室/商店/训练场/治疗服务、长期玩家仓库、星图天赋静态化、Windows Desktop portable、Android debug App、内容哈希增量更新、腾讯 COS/CDN 公共资源加载都已经接入。

当前最新 beta/debug 口径：

```txt
current beta:   0.1.24
v2 worktree:    /home/alexqfmm/workPlace/pokemon/changeBattleV2
release tree:   /home/alexqfmm/workPlace/pokemon/changeBattleV2-release
GitHub Release: https://github.com/AlexQFMM2/changeBattle/releases/tag/desk-debug-v0.1.24
beta latest:    http://119.45.240.157/changebattle-beta/latest.json
beta site:      http://119.45.240.157/changebattle-beta/
official API:   https://api.65h26i.top/changebattle/battle
assets CDN:     https://assets.65h26i.top/beta/
```

本目录是 `release` 分支 worktree，主要用于 stable 通道发版和回看稳定版状态；日常开发和 beta/debug 验证在 `changeBattleV2` 的 `v2` 分支进行。不要把本目录当日常开发主工作区。

## Repository / Branch

V2 属于原 ChangeBattle 仓库，不是独立新仓库。

```txt
remote: git@github.com:AlexQFMM2/changeBattle.git
daily/beta branch: v2
stable branch: release
daily worktree: /home/alexqfmm/workPlace/pokemon/changeBattleV2
stable worktree: /home/alexqfmm/workPlace/pokemon/changeBattleV2-release
```

长期分支约定：

```txt
v2        日常开发 / beta/debug 通道 -> /changebattle-beta/
release   stable 正式通道           -> /changebattle/
hotfix/*  从 release 临时切出，修完合回 release 并同步回 v2
```

`release/` 目录是本地发版产物工作台，不等于 `release` 分支。

- `packages/showdown-dex-core`：Web/Desktop 共用的 Dex 数据、搜索、详情聚合、图片解析、中文翻译、能力计算、学习面反查。
- `apps/api`：Battle API / room / RunGameV5 权威服务端，以及 Web/Desktop/Android 共用的应用层 facade。
- `packages/showdown-battle-core`：Node-side BattleStream service。真实战斗逻辑在这里运行，Web/Desktop 只通过 HTTP adapter 读 snapshot / 提交 choice。
- `apps/web`：Web 端适配器、V1 风格首屏/首页、QuickDex 图鉴弹窗。
- `apps/desktop`：Desktop 端适配器，复用 Web UI。
- `apps/mobile`：Android App，复用 Web UI/API/CDN 资源，当前发布 debug APK。

## Current Architecture

正式 room 主线已经从 V4 大对象同步迁到 RunGame V5 实体化 C/S：

- 服务端 `RunGameV5` 是唯一权威状态。
- Player、PokemonInstance、Bag、ItemInstance 独立存储。
- `gameMap`、round、battle 只引用 ID，不复制完整 Player / Pokemon / Bag / Item。
- 客户端只按页面拉 scoped view，只通过轻量 command 修改服务端实体。
- 客户端不再上传、保存、展示依赖大 `FormalGameRunV4` / `restRunSnapshot`。
- 训练场和 legacy 本地流程可以保留 V4 helper，但必须和正式 room 主线硬隔离。

这次 V4 -> V5 不是小修补，而是为 Web/Desktop/Android 统一 C/S 架构做的数据边界重构。App 端正是因为要复用同一套 room、Battle API、资源 CDN 和更新口径，才推动了正式流程服务化。

正式 room 的红线：

- 不新增 `formalRunDraft` / `syncDraft` / 聚合 `rest-action` 作为正式入口。
- 服务端确认操作必须等待 HTTP 返回，只有成功、失败、超时三种结果；等待时显示遮罩。
- 改数据来源必须保留成品游戏 UI，不允许把休整页、战斗页退化成“能用就行”的薄页面。
- 存储型资源字段只保存 canonical asset path，不保存 `changebattle-asset://`、COS URL、`file:`、`data:`。

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
- Windows Desktop portable release：当前 beta 完整包为 `ChangeBattle-V2-Desk-portable-debug-v0.1.24.zip`，完整包挂 GitHub Release；桌面端支持内容哈希增量更新，线上服务器只托管 `latest.json`、manifest 和 objects。
- Desktop launcher：`ChangeBattle-V2-Desk.exe` 已接入，`.cmd` 仍可作为 portable fallback。
- Android App：当前已发布 debug APK `ChangeBattle-V2-Android-debug-v0.1.24.apk`，默认走官方 Battle API。

当前明确不做：

- iOS App、应用商店正式包和 Android 正式签名包。
- 完整 roguelike 奖励扩展和长期循环平衡。
- 安装器、代码签名、商店分发。
- 旧 `dexSearch` 兼容。

当前 Battle V4 / Rest V4 进度：

- 训练场休整页可以进入真实 Battle V4 中转页；正式 room 流程则通过 RunGame V5 scoped view + HTTP command 推进。
- Battle service 使用 Showdown `BattleStream` 创建 session，保留 raw protocol/request/debug。
- 战斗页使用 V2 风格战斗壳展示场景、HP、模型、指令、日志/解说和裁判对话。
- 单打、双打、合作使用同一 session API 和合法随机 AI 推进；特殊系统 gate 和 AI 选择已有 core smoke 覆盖。
- 天气/场地持久层会按资源 key 重建 video/image 层，避免沙暴、雨天、晴天、雪天切换时继续播放旧资源。
- 当前主要工作点已经从“打通流程”转到正式游戏内容打磨、战斗演出稳定性、NPC 队伍质量、三端正式 room 验收和 release 稳定性。

下一步：

- 继续回归 Battle V4：形态变化、濒死/换人、天气场地、HP/PP/状态继承、目标选择和双打 seat 映射。
- 继续打磨正式 GameRun：NPC 配队、特殊系统、商店/训练经济、赛程叙事和结算体验。
- Desktop/App release 后续继续做 beta/stable 通道验收、增量更新回归和下载页信息整理；安装器、代码签名、商店分发仍不在当前范围。

详细路线见 `docs/training-and-battle-roadmap.md`。

## UI Rules

做任何页面、弹窗、面板或大型组件前，先读 `docs/ui-design.md`。V2 继续沿用 V1 的 `640 x 320` 游戏视口、像素密度、组件边界和参考图约束；首屏/首页优先复刻 V1 现有组件体验。

参考图保留在 `plan/ui-refences/`。

休整页里的“对话框”特指带角色立绘、底部文本框和操作按钮的 `TrainingRestShopDialogue` 组件：`apps/web/src/components/training/TrainingRestShopDialogue.tsx`，样式在同目录 `TrainingRestShopDialogue.css`。商店、训练场、治疗服务、类似 NPC 交互都应优先复用这个组件；不要把它误替换成 `TrainingRestConfirmDialog`、自定义浮层、空交互面板或其它临时 UI。`TrainingRestConfirmDialog` 只用于真正脱离 NPC 的系统二次确认，例如放弃比赛、本局结算提示等，不承担 NPC 讲解/选项对话。

## Asset Rules

公共图片、音频、图标、Showdown sprites/fx 等运行时资源已经迁到 COS/CDN：

```txt
https://assets.65h26i.top/beta/
```

业务代码和存档只保存资源相对路径，例如：

```txt
npc/avatars/6-asset-a73f3e71.webp
runtime/items/redthread/icon.png
showdown/sprites/ani/pikachu.gif
```

展示时通过 `assetUrl("...")` 或对应 assets provider 解析到当前运行时 URL。`assetUrl()` 是纯计算工具，不负责兼容脏数据，也不把 `changebattle-asset://...` 或 COS URL 反向修成相对路径。

禁止在 profile、trainer、room member、runGame 等存储型字段里保存：

```txt
changebattle-asset://...
https://assets.65h26i.top/...
file://...
data:...
blob:...
../x.png
x.png?v=1
```

`apps/web/public` 和根 `assets/` 不再作为 release 运行时大资源来源。新增公共资源时先上传 CDN，再补 catalog/registry 或使用 canonical path。

## Commands

```bash
pnpm install
pnpm battle:dev
pnpm web:dev
pnpm desktop:dev
pnpm typecheck
```

`./start_desk` 会自动清理本项目旧的 battle service、desktop dev、Electron 主进程和 renderer dev server（默认 `127.0.0.1:5181`），再启动本地 battle service（默认 `127.0.0.1:5191`）和桌面端。看到“代码改了但 UI 还是旧的”时，优先从 `pnpm desk:dev` / `./start_desk` 重新启动；不要直接复用旧的 5181 renderer。

`pnpm desktop:dev` 只启动桌面端，不启动 battle service；但它也会在 dev 启动前清理本项目旧的 renderer/Electron 进程，避免接到 stale Vite 页面。Web 端手测 legacy `/sessions` 战斗时可以另开终端运行 `pnpm battle:dev`。手测正式 room 流程优先用本地 Docker Battle API：

```bash
docker compose -f docker/battle-api/docker-compose.yml up -d --build
VITE_CHANGEBATTLE_BATTLE_SERVICE_URL=http://127.0.0.1:5191/changebattle/battle \
  pnpm --filter @changebattle-v2/web exec vite --host 127.0.0.1 --port 5188
```

## Desktop Release

当前发布形态是 Windows Desktop portable zip + Android debug APK。完整包托管 GitHub Release，线上服务器只托管 Desktop 增量 metadata 和下载页。

```txt
version:        0.1.24
tag:            desk-debug-v0.1.24
GitHub Release: https://github.com/AlexQFMM2/changeBattle/releases/tag/desk-debug-v0.1.24
Desktop zip:    ChangeBattle-V2-Desk-portable-debug-v0.1.24.zip
Android APK:    ChangeBattle-V2-Android-debug-v0.1.24.apk
beta latest:    http://119.45.240.157/changebattle-beta/latest.json
beta page:      http://119.45.240.157/changebattle-beta/
```

玩家解压后运行：

```txt
ChangeBattle-V2-Desk.exe
```

`ChangeBattle-V2-Desk.exe` 是轻量 portable launcher；`.cmd` 仍可作为 fallback。当前不是安装器，不做系统安装目录、开始菜单注册、代码签名或自动卸载。

只生成 release 按：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattleV2
./tools/build_release_on_windows.sh X.Y.Z
```

生成 release 并同步更新提示清单按：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattleV2
./tools/build_release_and_publish_update.sh X.Y.Z
```

更新服务器只托管小文件：

```txt
http://119.45.240.157/changebattle/latest.json
http://119.45.240.157/changebattle/
http://119.45.240.157/changebattle-beta/latest.json
http://119.45.240.157/changebattle-beta/
```

`latest.json`、版本比较和默认 manifest 地址的纯规则在 `packages/changebattle-v2-core/src/desktopUpdateCatalog.ts`；Electron 主进程负责拉取清单、下载增量对象、校验并提示重启。脚本只发布 manifest/download page/hash objects，不上传完整 portable zip；完整包和 APK 挂 GitHub Release。

详细流程、Windows 构建机、检查项和排错见 `docs/windows-desktop-release.md`。

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
