# ChangeBattle V2

ChangeBattle V2 是当前主线。`v2` 分支对应 beta/debug 通道，当前版本是 `0.1.29`。

当前项目已经从“本地大 RunGame 草稿推进”收口到正式 room C/S 架构：服务端 `RunGameV5` 保存权威实体，Web/Desktop/Android 只通过 scoped view 和轻量 command 与 Battle API 交互。训练场和 legacy V4 helper 仍保留，但必须硬隔离，不能作为正式 room fallback。

```txt
current beta:   0.1.29
GitHub Release: https://github.com/AlexQFMM2/changeBattle/releases/tag/desk-debug-v0.1.29
Desktop zip:    ChangeBattle-V2-Desk-portable-debug-v0.1.29.zip
Android APK:    ChangeBattle-V2-Android-debug-v0.1.26.apk
beta latest:    http://119.45.240.157/changebattle-beta/latest.json
beta site:      http://119.45.240.157/changebattle-beta/
official API:   https://api.65h26i.top/changebattle/battle
assets CDN:     https://assets.65h26i.top/beta/
```

后续接手优先读：

- `../README.md`：工作区总入口，解释线上、Release、分支、目录。
- `docs/architecture.md`：当前架构边界。
- `docs/engineering-redlines.md`：红线、代码规范和检查命令。
- `release/README.md`：Desktop/APK/GitHub Release/线上增量发布流程。
- `docs/release-notes-v0.1.29.md`：当前 beta 版本说明。

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

## Current Progress Snapshot

- **Battle V4 AI**：单打已经具备深度搜索、换人后重新估伤、队伍角色识别、威胁图、win condition 保护、极巨/太晶资源提交、reason tags 和反低级失误防呆；双打已经具备 joint action 评分、ally combo、reply search、特殊招式价值、友伤/免疫/重复无效招防呆和调试报告字段。
- **队伍生成器**：随机队伍生成器已从“随机裁剪”升级为按 `purpose / quality / aiLevel / playerProfileHints` 分层生成；单打支持 rain/sun/trick-room 等核心完整度，双打支持 Protect 密度、控速、范围输出、Fake Out、Intimidate、重定向、lead pair 和 coop 后续复用的 doubles diagnostics。
- **AI 验证流程**：单打和双打都已接入 self-play exam / report 流程，能批量生成题目、AI 自动答题、记录决策耗时、debug/value/reason tags，并按 severe/warning 找明显犯病点。
- **Assets CDN**：公共图片、音频、Showdown sprites/fx、训练/商店/奖章等资源已迁到腾讯 COS/CDN，统一走 `https://assets.65h26i.top/beta/...`；`apps/web/public` 和根 `assets/` 不再作为运行时打包来源。
- **Formal Room V5 C/S**：正式 room 主线已经改为 scoped view + 具体 command。`RunGameV5` 是服务端唯一权威；客户端不再上传、保存或接收大 `formalRun/restRunSnapshot` 作为正式 room 展示状态。休整页保留原游戏 UI，但数据源来自 V5 scoped rest view。
- **Battle Server 运行时选择**：Desktop / Android 的 Battle API URL 已按运行时配置接入官方服务器、自建服务器和 Desktop-only 离线服务。Desktop 离线服务由 Electron 主进程启动本地 Battle API，并用进程内 `MemoryRedisLike` 模拟 room 所需 Redis 子集，不恢复旧本地正式流程。
- **资源缓存路线**：公共资源默认继续走 COS/CDN，不重新塞回 release zip；后续增加“缓存资源到本地”开关，Desktop first，首次联网下载约 `4-500MB`，缓存完成后优先本地读取，未命中再回退 CDN。
- **Release 流程**：debug 桌面端主流程已迁到 GitHub Actions。完整包和 Android debug APK 托管在 GitHub Release，线上服务器只发布 Desktop 增量更新 metadata 和下载页；旧 scp 到 Windows 构建机流程已降级为备用方案。
- **0.1.26 battle hotfix**：修复正式 room 战斗提交失败后 UI 停在“提交中”、投降提交失败仍进入结算流、情报解锁失败无明确提示的问题；正式 room 多回合 `battle-choice` smoke 已验证 AI `move/switch` 会正常推进到结束。`0.1.25` 已在线上使用过，本次热修按新版本 `0.1.26` 发布，不做同版本覆盖。
- **0.1.27 Desk/NPC hotfix**：补齐 portable Showdown runtime 和 `ts-chacha20`，恢复历史正式 NPC 固定赛程、强度、立绘与 AI profile；Desk 离线 12 种模式/规则组合均已真实进入 BattleStream `running`。
- **0.1.28 scoped view hotfix**：修复正式休整页 scoped view 成功刷新时清理 effect 导致同步遮罩永久残留的问题；Desk 资源协议现在会回源重试缓存读取失败，并记录完整 protocol/CDN URL 与底层错误。
- **0.1.29 battle presentation hotfix**：战斗页 BGM 播放器跨路由持续挂载，官方 V5 Boss 场次按权威 NPC profile 播放 Boss 音乐；恢复 10 张战斗背景的带 seed 稳定选择，冠军固定冠军舞台。
- **桌面更新**：增量更新使用内容哈希对象池：服务器托管 `latest.json`、`manifests/current.json`、`manifests/vX.Y.Z.json` 和 `objects/<sha>`；客户端按本地实际 sha 与远端清单比较新增/修改/删除。大完整包不放线上服务器，避免流量计费。
- **下一步重点**：继续做正式 room scoped view 细节回归、Battle V5 纯计算拆分、AI/队伍平衡、合作 AI、Android 验收和 release 稳定性。所有 room 主线新代码必须遵守 `docs/engineering-redlines.md`。

- `packages/showdown-dex-core`：Web/Desktop 共用的 Dex 数据、搜索、详情聚合、图片解析、中文翻译、能力计算、学习面反查。
- `packages/changebattle-v2-core`：V2 运行时结构、玩家仓库、星图天赋、灵魂伴侣、桌面更新等共享纯规则和 catalog。
- `apps/api`：Web/Desktop 共用的应用层 API facade，后续公共函数都放这里。
- `packages/showdown-battle-core`：Node-side BattleStream service。真实战斗逻辑在这里运行，Web/Desktop 只通过 HTTP adapter 读 snapshot / 提交 choice。
- `apps/web`：Web 端适配器、V1 风格首屏/首页、QuickDex 图鉴弹窗。
- `apps/desktop`：Desktop 端适配器，复用 Web UI。

## Translation Rules

英文事实值转中文展示是 Dex 能力，唯一归口是 `packages/showdown-dex-core`。

强制约束：

- API/Web/Desktop 不允许新增自己的宝可梦英汉字典、属性字典、技能分类字典、性格字典、状态/天气/场地/墙钉字典、能力项字典。
- 需要展示中文时，必须调用 `showdown-dex-core` 暴露的方法，或通过 `@changebattle-v2/api` facade 调用同一套方法：
  - `translateDexLabel(table, value)`
  - `translateDexDescription(table, value, fallback?)`
  - `dexLabelToId(table, value)`
  - `toDexId(value)`
- 允许 API view 直接返回 dex-core 已组装好的 `nameZh/type/category/description` 等展示字段；不允许 API/Web 再维护一份本地翻译 fallback 表。
- 存档、战斗协议、Showdown command、身份判断和主键仍只使用英文 ID / Showdown ID。中文只用于展示、搜索标签和 UI 文案。
- ChangeBattle 自己发明的玩法文案不进 dex-core，但也不能随手散落：课程名、医保档位、结算原因、NPC 话术、正式赛阶段名、星图文案等共享业务文本，应放到对应 domain package / 模块的 catalog 或 label helper 里，例如 `packages/changebattle-v2-core`、`apps/api/src/formalGame.ts` 的正式玩法 catalog，或所属功能目录的集中文件。Web 组件只消费这些字段。
- 只有纯局部 UI 文案可以留在组件内，例如一次性按钮、局部空状态、局部 toast、局部确认提示。

如果新增英文枚举展示，先扩展 `packages/showdown-dex-core` 的翻译表和测试，再让 API/Web 调用。不要在组件或 API 文件里临时写 `Record<string, string>` 顶上。

更细规则见 `docs/showdown-dex-integration.md` 的 Chinese Data Policy。

当前已完成：

- V1 风格 `GameViewport`、首屏、首页、玩家设置基础体验迁移。
- 用户资料最小存档：只保存训练师基础信息。
- Showdown Dex Core：宝可梦、技能、特性、战斗道具搜索与详情。
- Showdown 公共资源：3D 四向立绘、小图 sheet、道具小图 sheet、battle fx 已迁到 CDN，并通过统一 asset URL 解析。
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
- 正式普通商店训练格：旧的薄荷、王冠、特性胶囊/膏药、努力药、糖果、PP 提升不再进入普通商店；普通训练池只刷 10 个高风险高收益“特效药”，使用时直接修改局内 `LocalPokemonV4`，不做 Showdown 战斗内回合触发。
- 待结算/养育材料：EV 增减药、25 种性格薄荷、特性胶囊/膏药、银色/金色/灰色王冠等标准养成材料仍保留在 Dex 和待结算/局外养育侧；神奇糖果、PP 提升/PP 极限提升不再作为普通训练商店补货内容。
- 休整页手动保存策略：队伍、背包、预览解锁等交互只更新内存草稿，只有小黑板“保存”写入 RunGame 快照。
- 休整页组件边界规范化：队伍、背包、公告栏、下一场预览、小黑板、标题牌、确认弹窗均拆为独立组件和独立 CSS，并接入组件预览目录。
- 休整页体验补齐：队伍底部排序按钮、背包/队伍底部宽选择区、背包成功 toast、弹层背景点击关闭、结束休整首发濒死校验。
- 正式休整商店：购买/售出双向交易、5 类 5x3 商品板、正式低价经济、按实例 `cost / 4` 售出、购买碎裂/补货动画、加权补货和队伍状态推荐话术均已接入；自动补货默认开启，不再依赖星图节点。
- 正式休息室治疗：公告栏治疗按钮使用 `TrainingRestShopDialogue` 对话框确认，基础 250 金币，医保 basic/standard/premium 分别 9/8/5 折，成功后全队 HP/异常/PP 恢复。
- 正式训练场：从随机课程改为自由选课，课程选择使用 NPC 对话框和 2x2 课程面板；遗传学、实践课、自学招式、自习课四类课程由用户选择后进入。
- 正式流程稳定化：NPC 等级改为按玩家队伍最高等级动态计算，究极异兽在正式候选中统一归入神兽分类，自习收益改为按当前 IV/EV 缺口动态追赶，并继续使用逐次自习随机种子。
- 星图天赋静态化：节点 catalog 同时声明展示文案和 `runtimeEffects`，业务侧显式读取效果；新增/移除天赋时维护静态节点、对应业务分支和 smoke 断言即可。
- 星图新天赋“随身携带”：点亮后，每个正式 run 第一次进入休整页时，会从玩家长期仓库的预备背包随机带入最多 3 种道具，每种 1 个，并扣减预备背包库存；run 内只触发一次。
- 玩家长期仓库：玩家道具/宝可梦已从 profile 中拆到独立 player vault；训练家仓库页已改为同屏整理界面，左侧背包列、右侧宝可梦箱固定展示，详情通过浮层抽屉打开，普通整理操作走页面本地 draft，只有“保存并返回”才写回顶层存档。
- 训练家仓库道具使用：局外道具已统一接入目标选择模式和类型化流程，覆盖数值变化、技能学习/替换、进化道具、战斗携带道具；携带道具支持格子角标、详情卸下、替换归还背包，技能、数值和进化结果都有非阻塞反馈。
- 训练家仓库进化：进化道具已接入 core/API/Web 闭环，按进化链阶段与亲密度门槛校验，支持多目标选择、道具消耗、保留养成数据、更新 vault draft，并复用全局 `GameEvolutionModal` 展示“异样提示 → 进化动画 → 结果 → 对比详情”流程。
- 训练家仓库荣誉奖章：宝可梦详情页已接入 10 个个人奖章，按这只宝可梦自己的 `honors` 进度从下往上点亮；点击任意奖章可查看说明和待攻克目标，目标来自 Dex 训练师数据，不是物种或玩家全局成就。
- 训练家仓库宝可梦操作：宝可梦详情抽屉支持卸下道具和危险操作“放生”；放生会二次确认，携带道具优先放回道具箱，道具箱满时阻止放生。
- 训练家仓库 debug 入口：beta/dev 下可通过简单搜索弹窗添加 debug 道具和 debug 宝可梦；debug 宝可梦复用 core 蛋生成规则 helper，来源标记为 `debug-custom`，debug 道具来源标记为 `debug`；stable/release 隐藏入口但不隐藏已有数据。
- 灵魂伴侣蛋孵化：最终胜利后的待结算休整页已接入“就决定是你了”入口，按本局战斗记录筛选候选，使用 `packages/changebattle-v2-core` 的蛋生成 helper 生成进化根宝可梦并写入长期仓库；孵化动画使用资源相对路径 `runtime/soulmate/egg-hatch-sheet.png`。
- 灵魂伴侣星图线：`灵魂伴侣`、`同行许可 I / II`、`爱不释手`、`欧洲父母`、`一眼万年`、待结算商店带出和育儿基金等节点已静态化到 star chart catalog，业务侧按 `runtimeEffects` 读取。
- 真实对局灵魂伴侣：通过“同行许可”进入正式流程的仓库宝可梦已接入选人页专属槽位、休整页浅绿色队伍标记、战斗昵称展示、战后亲密度回写和战后荣誉授章；点亮“爱不释手”时会把仓库携带物复制为 run-local 背包实例，不扣仓库资产。
- 灵魂伴侣战斗进化：正式战斗中，达到亲密度门槛且下一段进化目标唯一的灵魂伴侣会在下一次行动请求前按 3% 概率触发羁绊进化；后端通过 Showdown `formeChange(..., evolutionEffect, true)` 写入 `detailschange`/提示协议，Web 只按 rawLog playback 顺序播放白光 transform 动画并同步 run-local 与来源仓库形态。
- 灵魂伴侣边界：仓库中的灵魂伴侣是局外长期资产，可以在训练家仓库使用局外养成道具、技能学习和进化；被“同行许可”带入正式流程的是 run-local 副本，保留养成数值和昵称，但不写回仓库，也不能参与正式局内训练、交换、TM 或特效药改造，普通恢复/治疗仍可使用。
- 休整页弹窗栈：背包触发的技能学习替换、Mega/Z/太晶系统道具重铸等二级弹窗已提升到背包上方，关闭上层弹窗不会误关闭背包。
- 通用弹窗组件：`AppModal` 已作为统一遮罩层 + 居中弹窗组件接入，后续系统弹窗优先复用它，避免局部 z-index/绝对定位造成层级错乱。
- Battle V4 提交流水：控制台会按“等待补全 / 草稿完成 / 正在提交 / 提交成功 / 提交失败”打印高信号日志；双打残局里攻击目标会正确携带目标后缀，避免卡在 `1/2` 没有反馈。
- 正式赛程：7 场正式战斗已采用小组赛/晋级赛阶段命名，战斗开场/结束按裁判和训练家对话流程组织。
- 特殊系统：gen7 会保障玩家初始候选至少 2 个可 Mega 宝可梦，NPC 队伍至少 1 个 Mega 手并携带映射 Mega 石；Z 招式专属优先并补齐 required move；gen8/9 NPC 默认获得极巨手环/太晶珠。
- Windows Desktop portable release：debug 桌面端主发布链路已迁到 GitHub Actions；完整 zip 由 GitHub Release 托管，更新 metadata artifact 下载到本地后发布到自有服务器。`0.1.29` 是当前战斗 BGM、Boss 场景识别和正式背景选择修复 beta 基线；线上服务器只放增量 metadata 和下载页，Android debug APK 当前仍为 0.1.26。

当前明确不做：

- iOS App 暂不做；下一步只预研/移植 Android App。
- 完整 roguelike 奖励扩展、长期循环平衡和安装器/签名。
- 旧 `dexSearch` 兼容。
- 局域网合作第一版不做中心服务器、公网匹配、账号系统、NAT 穿透、PvP、观战和 host migration。

当前第二轮 / Battle V4 / Rest V4 进度：

- 第二轮灵魂伴侣主体已经落地，当前重点仍是完整回归：最终胜利带走蛋、仓库养成/技能学习/进化、同行许可带入正式流程、正式休整页禁用态、战后亲密度回写、个人荣誉授章和战斗内低概率进化。
- 训练场休整页、正式 GameRun 和 Battle V4 中转页已经接入真实 Showdown `BattleStream` session，保留 raw protocol/request/debug，战斗页使用 V2 风格战斗壳展示场景、HP、模型、指令、日志/解说和裁判对话。
- Battle V4 AI 已从“合法随机推进”升级为 `chooseAiBattleChoiceV4` 的新决策链路：单打侧有深度搜索、估值函数、换人承伤、威胁图、资源提交、防呆和 reason tags；双打侧有 joint action、ally combo、reply search、特殊招式价值、友伤/免疫/重复无效招 guard。
- 正式流程已经开始接入“玩家画像 -> 结构化 Showdown 队伍生成/调整 -> 服务器 room 正式流程 -> 新 AI 决策”的链路；新队伍生成器按 `purpose / quality / aiLevel / playerProfileHints` 调整结构完整度、技能质量、NPC 强度和玩家偏好干扰，失败时保留旧本地生成器回退。
- Formal Run 服务端化已完成本地 Docker 第一刀和第二刀：`Battle API + Redis` 本地 compose 可用；Web 可通过 room 完成开始游戏、starter、赛程、休整、战斗创建、room-aware choice、战斗结算到 settlement；连接状态 badge 已改为轻量 RTT 采样并移到左下角，避免遮挡战斗右上信息。
- 单打和双打都已有 self-play exam / report：能批量出题、让 AI 自动做题、记录每次决策耗时、搜索深度、value breakdown、reason tags，并按 severe/warning 发现明显犯病点。
- 天气/场地持久层会按资源 key 重建 video/image 层，避免沙暴、雨天、晴天、雪天切换时继续播放旧资源。
- 第三轮联机已进入设计落地准备：计划见 `plan/formal-game/formal-lan-coop-host-mode-plan.md`，第一版目标是 Desktop 双人局域网 PvE，沿用 Showdown coop 的 `p1 + p3` 对 `p2 + p4` 编排，战斗阶段由房主权威计算。
- 当前主要工作点已经从“流程打通”转到 AI/队伍质量闭环、人工 debug 验收、coop AI、正式游戏内容打磨、GitHub Actions 桌面发版稳定化和 Android App 移植准备。

下一步：

- 继续扩大 AI 出题/做题/评估闭环：单打和双打都要增加题目覆盖、报告摘要、关键回合解说、决策耗时统计和 severe/warning 归因，优先让“明显犯病”能被稳定抓出来。
- 做人工 debug 对局验收：挑选 self-play 报告里的高价值局面逐回合讲解，检查 AI 是否像正常玩家一样处理 KO、换人、极巨/太晶、集火、Protect、Fake Out、Tailwind/Trick Room 和友伤。
- 推进 coop AI：先复用 doubles 队伍生成器和 lead pair diagnostics，把 4v4 doubles 队伍拆成两个 NPC 视角，再做合作场景下的 ally coordination、seat 映射、joint action 调试和出题评估。
- 完成 Formal Run room v1 的剩余切片：金币交易类休整操作即时 `rest-action`、最终 `finalize-run` 和本地 profile/vault delta 写回、room heartbeat/过期/重连 UI、容器重启后的 `server-restarted` 失败结算、Loki 日志接入。
- 增加 Desktop / Android App 的“网络与离线”设置：战斗服务器支持官方服务器、自建服务器和 Desktop-only 离线服务；自建服务器保存前做 `/health` 测试；Desktop 离线服务通过本地 Battle API + `MemoryRedisLike` 保留 room 机制，不要求用户安装 Docker/Redis；资源缓存作为独立开关，先做 Desktop 本地缓存。Web 只保留给本地开发和 ChromeAutomation smoke，不进入玩家发布口径。
- 启动 Android-only App 移植计划：优先基于 Capacitor 复用 Web UI/API/资源 CDN 和公网 Battle API；只做 Android，不做 iOS；第一轮先验证 640x320 视口、存档、网络/API、音频、资源 CDN 和正式战斗 room 流程。
- 继续把正式 GameRun 和新队伍生成器磨稳：玩家画像、地区限制、是否神战、战斗系统、NPC 强度、Boss 偏好、特殊系统道具和旧生成器 fallback 都要在正式流程里可解释、可回退。
- 继续回归 Battle V4 演出和状态继承：形态变化、濒死/换人、天气场地、HP/PP/状态继承、目标选择、双打/合作 seat 映射，以及灵魂伴侣战斗进化在 singles/doubles/coop 下的播放顺序。
- 桌面 release 后续继续验证 GitHub Actions + 对象池增量更新链路；安装器、签名仍不在当前范围。

详细路线见 `docs/training-and-battle-roadmap.md`、`plan/formal-game/README.md` 和 `plan/formal-game/formal-lan-coop-host-mode-plan.md`。

Battle API 运行时服务器选择、Desktop 离线服务和资源缓存路线见 `plan/battle-server-selection-and-offline-assets-plan.md`。

## Desktop Battle API 选择

Desktop 的“网络与离线 / Battle API”设置有三种模式。它们不是三套游戏流程，Renderer 始终只调用同一套 Battle API base URL；正式游戏仍走 `Room -> Match -> RunGameV5 -> HTTP commands -> final-result -> ack-final-result`。

```txt
官方服务器：Renderer -> https://api.65h26i.top/changebattle/battle -> 公网 Battle API -> Redis
本地服务器：Renderer -> http://127.0.0.1:5191/changebattle/battle -> 自建/Docker Battle API -> Redis
本地模拟：  Renderer -> http://127.0.0.1:<port>/changebattle/battle -> Desktop 嵌入式 Battle API -> MemoryRedisLike
```

- 官方服务器：普通玩家默认模式。需要联网，Desktop 保存配置前应请求 `/health` 成功；正式 room、战斗指令、结算都由公网 Battle API 权威推进。
- 本地服务器：给开发者、自建服和局域网/公网 Docker 部署使用。常见本机地址是 `http://127.0.0.1:5191/changebattle/battle`，服务由 `docker/battle-api/docker-compose.yml` 启动，Redis 保存 room 状态；公网部署时在 Desktop 里填写 Nginx 反代后的 `https://.../changebattle/battle`。
- 本地模拟（不用 Docker）：Desktop-only 离线模式。Electron 主进程启动本机嵌入式 Battle API，只监听 loopback，内部用 `MemoryRedisLike` 模拟 room 需要的 Redis 子集；玩家不需要安装 Docker、Redis、Node。应用退出后未结算离线 room 不恢复，最终结算后的 profile/vault 仍写 Desktop 本地存档。

模式切换红线：

- 三种模式切换都要清 room credential，不能跨服务器恢复旧 room。
- 本地模拟启动失败不能覆盖当前已保存配置。
- 不允许为本地模拟恢复旧的本地正式流程；它必须继续是同一套 Battle API + V5 scoped view + 轻量 command。
- 资源缓存是独立开关，不等于 Battle API 模式；公共 assets 仍默认走 COS/CDN 或本地 cache，不由 Battle API 代理。

## UI Rules

做任何页面、弹窗、面板或大型组件前，先读 `docs/ui-design.md`。V2 继续沿用 V1 的 `640 x 320` 游戏视口、像素密度、组件边界和参考图约束；首屏/首页优先复刻 V1 现有组件体验。

参考图保留在 `plan/ui-refences/`。

休整页里的“对话框”特指带角色立绘、底部文本框和操作按钮的 `TrainingRestShopDialogue` 组件：`apps/web/src/components/training/TrainingRestShopDialogue.tsx`，样式在同目录 `TrainingRestShopDialogue.css`。商店、训练场、治疗服务、类似 NPC 交互都应优先复用这个组件；不要把它误替换成 `TrainingRestConfirmDialog`、自定义浮层、空交互面板或其它临时 UI。`TrainingRestConfirmDialog` 只用于真正脱离 NPC 的系统二次确认，例如放弃比赛、本局结算提示等，不承担 NPC 讲解/选项对话。

## Asset Rules

运行时图片、音频、图标、Showdown sprites/fx 等共享资源已经迁到腾讯 COS/CDN，当前公共根为：

```txt
https://assets.65h26i.top/beta/
```

业务代码仍然记录资源相对路径，例如 `runtime/items/redthread/icon.png`、`showdown/sprites/ani/pikachu.gif`、`music/battle/trainer.ogg`。Web/Desktop 通过 `assetUrl("...")` 或 `assetsTool("...")` 解析为 CDN URL；不要在组件里硬编码 `/showdown/...`、`/npc/...`、`/assets/...`、本机绝对路径或 `file://`。

`apps/web/public` 和仓库根 `assets/` 不再是运行时打包来源，也不应为了让文件进入 release 而恢复大资源目录。`apps/web/vite.config.ts`、`apps/desktop/vite.config.ts` 和 desktop renderer 构建已经关闭 publicDir；桌面 release 只打包代码、vendor、launcher 需要的小图标和必要资源，不再携带约 500M 的公共 assets。

后续“缓存资源到本地”不会改变 release 包体策略：资源仍不打入 zip/APK，玩家选择开启后由运行时下载到本地 cache。Desktop 优先实现完整缓存和本地读取；Android 后续评估 Capacitor 文件系统；Web 不上线，只做开发测试需要的轻量能力，不承诺浏览器完整保留约 `4-500MB` 缓存。

资源来源与上传：

- 批量公共资源统一上传到 COS `beta/` 前缀，不按 debug/stable/beta 复制三份。
- 上传工具在 `/home/alexqfmm/workPlace/tools/tencent-cos`，密钥只放该工具本地 `.env`。
- ChangeBattle 侧 URL 解析在 `packages/assets-core`，默认 provider 为腾讯 CDN。
- `packages/assets-core/src/generated/assetRegistry.ts` 是当前已上传资源的 registry 快照；不要在没有完整资源源目录时随手 regenerate。
- 新增少量资源时，先上传到 `https://assets.65h26i.top/beta/<path>`，再补 `assets-core` 的 key/path 或让通用 `assetUrl(path)` 直接解析。

发布影响：

- GitHub Actions debug desktop 不再下载 `changeBattleV2-assets.tgz`。
- 增量更新 manifest 当前只管理 `apps/`、`resources/`、`vendor/` 和 `package.json`；公共图片/音频从 CDN 直连，不进入 desktop hash object 池。
- 如果 CDN 资源路径变更，优先保持旧路径兼容；确实需要改路径时，同步修改 catalog/registry 和对应 UI 引用。

## Commands

```bash
pnpm install
pnpm battle:dev
pnpm web:dev
pnpm desktop:dev
pnpm typecheck
```

`./start_desk` 会自动清理本项目旧的 battle service、desktop dev、Electron 主进程和 renderer dev server（默认 `127.0.0.1:5181`），再启动本地 battle service（默认 `127.0.0.1:5191`）和桌面端。看到“代码改了但 UI 还是旧的”时，优先从 `pnpm desk:dev` / `./start_desk` 重新启动；不要直接复用旧的 5181 renderer。

`pnpm desktop:dev` 只启动桌面端，不启动 battle service；但它也会在 dev 启动前清理本项目旧的 renderer/Electron 进程，避免接到 stale Vite 页面。Web 端手测 legacy `/sessions` 战斗时可以另开一个终端运行 `pnpm battle:dev`；手测正式 server room 流程时，优先使用本地 Docker：

```bash
docker compose -f docker/battle-api/docker-compose.yml up -d --build
VITE_CHANGEBATTLE_BATTLE_SERVICE_URL=http://127.0.0.1:5191 pnpm --filter @changebattle-v2/web exec vite --host 127.0.0.1 --port 5187
```

本地 Docker API 当前提供 Redis room、正式流程 checkpoint、room-aware BattleV4 和 `finalize-battle`。如果页面出现“重连中/连接失败”，先确认浏览器当前 dev server 是否带了本地 `VITE_CHANGEBATTLE_BATTLE_SERVICE_URL`，以及 `curl -sS http://127.0.0.1:5191/health` 是否返回 `redis:"ok"`。

## Desktop Release

当前发布形态是 Windows Desktop portable zip，而不是安装器。debug/beta 主流程已经迁到 GitHub Actions：Actions 构建完整 portable zip 并上传 GitHub Release，同时产出 `latest.json + manifests + objects` 更新 artifact；本地下载 artifact 后发布到自有服务器。旧的“scp 到 Windows 构建机再本机构建”流程已经降级为 legacy backup。

当前 beta/debug 基线：

```txt
latest debug: 0.1.29
GitHub Release: https://github.com/AlexQFMM2/changeBattle/releases/tag/desk-debug-v0.1.29
Desktop package: ChangeBattle-V2-Desk-portable-debug-v0.1.29.zip
Android package: ChangeBattle-V2-Android-debug-v0.1.26.apk
beta latest:  http://119.45.240.157/changebattle-beta/latest.json
beta site:    http://119.45.240.157/changebattle-beta/
stable site:  http://119.45.240.157/changebattle/
```

`0.1.29` 是当前战斗 BGM、Boss 场景识别和正式背景选择修复 beta 基线。完整包托管 GitHub Release；beta 服务器只保留 `latest.json`、下载页、manifest 和增量 objects，不托管大 zip/apk。

玩家解压后运行：

```txt
ChangeBattle-V2-Desk.cmd
```

`.cmd` 不是业务运行时，只是 portable launcher：用 `%~dp0` 计算解压目录，设置 `CHANGEBATTLE_PROJECT_ROOT`、Showdown runtime vendor、Showdown client vendor 等环境变量，然后调用包内 `runtime/electron/electron.exe` 启动 `apps/desktop`。当前 release 也会生成一个轻量 `ChangeBattle V2.exe` launcher，用于提供更像普通桌面软件的入口；完整安装器、代码签名和自动安装目录管理仍不在当前范围。

桌面端更新能力：

- 启动后后台读取当前通道的 `latest.json`。
- 如果存在 `objectBaseUrl` 和 `fileManifestUrl`，客户端读取远端 `manifests/current.json`。
- 客户端重新计算本地 managed files 的实际 sha256，不完全信任本地 `update-manifest.json`。
- 远端有、本地没有则新增；同路径 sha 不同则下载替换；本地 manifest 有、远端没有则删除；非 managed 文件不动。
- 普通游戏代码、内置资源和 vendor 变化会从 `objects/<sha前2位>/<sha256>` 下载增量对象、校验、替换，并提示重启后生效；公共图片/音频走 CDN，不进入 desktop 增量对象池。
- 右下角版本徽标可手动检查更新，已是最新时显示“当前已是最新版本”。
- Electron runtime、launcher、updater 或 portable 目录结构变化仍要求完整包。

正式/测试通道：

```txt
release 分支 -> stable -> http://119.45.240.157/changebattle/
v2 分支      -> beta   -> http://119.45.240.157/changebattle-beta/
```

debug/beta 推荐发版命令：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattleV2
VERSION=0.1.29
git push origin v2
gh workflow run "Release Debug Desktop" \
  --repo AlexQFMM2/changeBattle \
  --ref v2 \
  -f version="$VERSION" \
  -f source_ref=v2 \
  -f create_github_release=true \
  -f update_manifest_url=http://119.45.240.157/changebattle-beta/latest.json \
  -f official_site_url=http://119.45.240.157/changebattle-beta/
gh run list --repo AlexQFMM2/changeBattle --workflow "Release Debug Desktop" --limit 3
gh run watch <run-id> --repo AlexQFMM2/changeBattle --exit-status
gh run download <run-id> --repo AlexQFMM2/changeBattle --name "changebattle-beta-update-metadata-v${VERSION}" --dir "tmp/gha-beta-update-v${VERSION}-<run-id>"
```

下载 artifact 后，本地发布更新 metadata 到 beta 服务器：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattleV2
CHANGEBATTLE_RELEASE_CHANNEL=beta \
CHANGEBATTLE_UPDATE_LOCAL_DIR=/home/alexqfmm/workPlace/pokemon/changeBattleV2/tmp/gha-beta-update-vX.Y.Z-<run-id> \
./tools/publish_desktop_update_manifest.sh X.Y.Z
```

更新服务器只托管静态小文件和内容对象：

```txt
http://119.45.240.157/changebattle/latest.json
http://119.45.240.157/changebattle/manifests/current.json
http://119.45.240.157/changebattle/manifests/vX.Y.Z.json
http://119.45.240.157/changebattle/objects/<sha前2位>/<完整sha256>
```

`latest.json`、版本比较、channel URL、对象池文件清单对比和增量路径校验的纯规则在 `packages/changebattle-v2-core/src/desktopUpdateCatalog.ts`；Electron 主进程负责拉取清单、下载增量、校验和替换文件。脚本只发布 manifest/download page/hash objects，不上传完整 portable zip；完整包由 GitHub Release 托管，并写入 `latest.json.fullPackage` / `mirrors`。

详细流程、服务器目录、检查项和排错见 `release/README.md`。旧 Windows 构建机流程只作为 fallback 参考，见 `release/docs/windows-desktop-release.md`。

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

## Battle AI Choice Reproduction

遇到 release 包“玩家出招后卡死”、diagnostics 显示 `blocked` / `p2-pending-action` / Showdown `[Invalid choice]` 时，优先判断是不是 AI 生成了非法指令。复现方法记录在 `debug/README.md`：

```bash
node --input-type=module -e '/* read debug/battle-v4-diagnostics-xxx.json allRequests.p2, then call chooseAiBattleChoiceV4 */'
```

核心判断是：把 diagnostics 里的 `allRequests.p2` 喂给当前 `packages/showdown-battle-core/dist/index.js` 的 `chooseAiBattleChoiceV4`，再用 `validateShowdownChoiceCommandV4` 校验旧 release choice 和当前 choice。若旧 choice 失败、当前 choice 通过，说明当前 V2 已修，release 包只是落后；若当前 choice 仍失败，再补 battle-core regression。
