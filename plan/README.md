# ChangeBattle V2 Plan Index

这个目录只保留当前下一步开发计划。已经完成、明显落后或暂时不用的旧计划和参考素材已清理。

## 状态口径

- `已完成`：当前计划主体已经收口；后续优化应开新计划或在对应 README 里追加。
- `部分完成`：已有代码或数据落地，但 checklist 仍有明确未完成项。
- `规划中`：主要是后续方案记录，当前不代表已经实现。
- `参考资料`：用于查阅，不作为施工进度本身。

## 当前最常用入口

- 工程红线 / 代码规范：[`../docs/engineering-redlines.md`](../docs/engineering-redlines.md)
- RunGame V5 实体化模型：[`runGame-v5-entity-model-plan.md`](runGame-v5-entity-model-plan.md)
- Formal Room 休整交互 Result Contract 去 V4 化：[`formal-room-rest-result-contract-v5-plan.md`](formal-room-rest-result-contract-v5-plan.md)
- Formal Room V5 休整规则对齐：[`formal-room-rest-rules-parity-v5-plan.md`](formal-room-rest-rules-parity-v5-plan.md)
- 运行时数据标准化迁移：[`runtime-data-standardization-migration-plan.md`](runtime-data-standardization-migration-plan.md)
- 正式游戏当前主线：[`formal-game/README.md`](formal-game/README.md)
- 灵魂伴侣蛋孵化施工计划：[`formal-game/formal-soulmate-egg-hatch-and-growth-plan.md`](formal-game/formal-soulmate-egg-hatch-and-growth-plan.md)
- 灵魂伴侣下版本：[`formal-game/formal-soulmate-next-version-plan.md`](formal-game/formal-soulmate-next-version-plan.md)
- Desktop EXE 无黑框启动改造：[`desktop-exe-launcher-plan.md`](desktop-exe-launcher-plan.md)
- Assets CDN 核心抽象：[`assets-cdn-core-plan.md`](assets-cdn-core-plan.md)
- Android-only App 移植：[`android-capacitor-app-migration-plan.md`](android-capacitor-app-migration-plan.md)
- 服务器 Docker / Battle API：[`server-docker-battle-api-plan.md`](server-docker-battle-api-plan.md)
- Redis 临时房间连续性：[`server-redis-battle-room-continuity-plan.md`](server-redis-battle-room-continuity-plan.md)
- Formal Run Server Room 制作清单：[`formal-run-server-room-implementation-checklist.md`](formal-run-server-room-implementation-checklist.md)
- Room Lobby / Match / FormalRun 三层重构：[`formal-room-lobby-match-refactor-plan.md`](formal-room-lobby-match-refactor-plan.md)
- Battle server 选择 / Desk 离线 / 资源缓存：[`battle-server-selection-and-offline-assets-plan.md`](battle-server-selection-and-offline-assets-plan.md)
- Battle diagnostics / AI 出招复现：[`../debug/README.md`](../debug/README.md)

## 当前进度

- 当前 beta/debug Desktop 版本是 `0.1.29`；完整 Desktop zip 挂 GitHub Release `desk-debug-v0.1.29`，线上 beta 服务器只保留增量 metadata 和下载页；Android debug APK 当前仍为 0.1.26。
- 正式 room 主线已经完成 RunGame V5 C/S 收口：服务端权威 `RunGameV5`，客户端只消费 scoped view 和轻量 command，不再传输、保存或展示依赖大 `formalRun/restRunSnapshot`。
- legacy `/rooms/:id/formal/*`、`syncDraft/restAction`、聚合 `rest-action` 已硬隔离为 dev/legacy 入口；训练场和本地 legacy 可继续用 V4 helper，但不得进入正式 room 主线。
- 正式休整页已经恢复原游戏 UI，数据源来自 V5 scoped rest view。后续改数据结构必须保留成品 UI，不允许退化成薄列表页。
- ChromeAutomation 验收正式休整功能时，不能只跑自然局金币不足等失败路径。若初始金币/状态不足，必须打开测试模式或使用测试种子/测试资金，实际点击训练、商店购买补货、重随、治疗等成功路径；失败路径只能作为补充。
- 正式游戏主流程已经进入可持续测试阶段：开局候选、星图扩展、选人、7 场计划、休整页、战斗页、单局战后结算、最终结算和 BP 发放都已接入。
- 正式休整商店和训练场已经完成第一版闭环：购买/售出、加权补货、课程学习、自主训练、费用、金币流水和课后流程均已接入。
- 正式流程已经从客户端/desktop worker 推进迁到服务器 room。当前网络职责是“服务端 `RunGameV5` 唯一权威、HTTP command ACK 推进页面、客户端只缓存 scoped view、WS 只做 revision/房间通知、本地不保存 room 大 run”。desktop worker 只保留为训练场/legacy/dev 能力。
- Battle V4 已完成 Showdown-style playback 重构、HP 缓动修正、投降框组件化、天气持久层资源重载、Substitute 持续标记、选人页两步选择交互，以及特殊系统目标选择修复；小图闪光因本地 picon 无 shiny sheet，采用普通 picon + 星标提示。
- 正式模式稳定性继续收口：敌方 NPC 等级按玩家最高等级动态计算，究极异兽归入神兽候选，自习收益改为等级/数值约 3:7，战斗入场同步本地 PP。
- 休整页弹窗栈已补齐：背包打开时，技能学习替换和 Mega/Z/太晶系统道具重铸面板会显示在背包之上。
- 灵魂伴侣蛋生成规则已经抽到 `packages/changebattle-v2-core` helper；正式灵魂伴侣领取和 debug 新增宝可梦共用同一套进化根、个体/性格/技能 fallback 生成逻辑。
- 训练家长期仓库页已经从旧 tab/格子背包改成同屏整理界面：左侧背包列、右侧 4x6 宝可梦箱、浮层抽屉详情、本地 draft 延迟保存、debug 添加、道具类型化使用、携带/卸下/放生和非阻塞反馈都已接入。
- 新仓库背包列不再展示空位，也不再支持旧的手动移动道具；道具容量仍按每页 6 个和至少 3 页规则保存，解锁箱页和 profile BP 的边界后续单独收口。
- 训练家仓库进化已经接入：进化道具走 preview/apply，按亲密度和进化链阶段校验，消耗道具并保留昵称、等级、技能、性格、个体、努力等养成数据；Web 使用全局 `GameEvolutionModal` 统一播放进化事件。
- 正式普通商店训练格已经切换为 10 个特效药；旧薄荷、王冠、特性胶囊/膏药、努力药等标准养成材料保留在待结算/局外养育侧，正式局内灵魂伴侣副本不能使用 TM 或特效药。
- 灵魂伴侣边界已经明确：仓库长期资产可以在训练家仓库养成；通过同行许可进入正式流程的是 run-local 副本，不参与局内训练、交换、TM、特效药等任何养成系统。
- Battle V4 AI 和队伍生成器已完成第一轮重构：单打 threat/resource/special-system/reason tags，双打 joint action/value/reply/免疫防呆，单打/双打 self-play exam/report，正式流程已接入“玩家画像 -> 结构化队伍生成 -> 新 AI 决策”的链路。
- Assets CDN 迁移已落地：公共资源统一走 `https://assets.65h26i.top/beta/...`，`apps/web/public` 和根 `assets/` 不再作为运行时打包来源；debug desktop release 不再下载 assets 包。
- GitHub Actions release 和手动 GitHub Release 补资产流程均已跑通：`0.1.26` beta 完整包资产在 GitHub Release，线上 beta `latest.json` 的完整包链接也指向 GitHub。
- `0.1.26` 额外补齐战斗提交失败态、投降失败不假结算、NPC 对手立绘和正式 room 多回合 AI smoke 文档；后续遇到“表面正常但实际卡住”的问题，按 `docs/engineering-redlines.md` 的等待态/AI smoke 红线检查。`0.1.25` 已经在线上使用过，本次不做同版本覆盖。
- Battle diagnostics 已补充 AI 出招复现方法：遇到 release blocked / invalid choice，可用 diagnostics 的 `allRequests` 直接跑当前 V2 `chooseAiBattleChoiceV4` 判断是旧包落后还是当前 core 仍需修。
- Plan 文档已收敛到当前主线；运行时标准化这类跨模块迁移保留在根目录，玩法计划优先进入对应目录 README。

## 下一步

- 下一步正式玩法主线是继续跑完整流程、记录阻断问题，并围绕正式赛程、NPC 配队、特殊系统、商店/训练经济、结算体验和长期仓库整理做回归打磨。
- 下一步架构主线是把 battle/result/settlement 计算里剩余的 V4-shaped helper 继续拆到纯 V5 或 legacy adapter；正式 room API 响应继续保持 scoped view 和小 result。
- 下一步休整 UI 主线是执行 [`formal-room-rest-result-contract-v5-plan.md`](formal-room-rest-result-contract-v5-plan.md)，把 room V5 休整交互结果从 V4 `result.run/restRunSnapshot` contract 中拆出来，并用 ChromeAutomation 验收训练、治疗、商店、背包、战斗、结算闭环。
- 下一步休整规则主线是执行 [`formal-room-rest-rules-parity-v5-plan.md`](formal-room-rest-rules-parity-v5-plan.md)：训练自习、商店出货/补货、重随、交换由后端 V5 以小 context 纯规则计算，玩法随机不得被客户端 `commandId`、前端路由或重试策略影响。
- 下一步 ChromeAutomation 回归要优先补测试模式/测试资金下的休整成功路径，不再把 0 金币局的“金币不足”当作训练/商店/重随验收完成。
- 下一步 AI 主线是继续扩大单打/双打出题、做题、评估样本，结合人工 debug 对局验收，优先把 severe 犯病点稳定抓出来。
- 下一步 coop 主线是复用 doubles 队伍生成器和 lead pair diagnostics，推进合作 AI 的 seat 映射、ally coordination、joint action 调试和出题评估。
- 下一步 App 主线只做 Android：基于 Capacitor 复用 Web UI/API/CDN 资源，先验证 640x320 视口、存档、音频、网络/API、正式战斗和更新策略；iOS 暂不进入范围。
- 下一步服务器主线是在本地 Docker、官方服务器、Desktop 离线三种模式下继续验收正式 room：进入页面/恢复/落后 revision 才 GET scoped view，浏览/动画/草稿不请求，所有玩家确认操作走 HTTP command 幂等 ACK，WS 只通知 revision/房间状态、不做 ACK、不控制跳转。公网响应默认不返回 AI debug，Redis 存对局连续性，Loki 存当天结构化日志，COS 存历史归档。
- 下一步运行时配置主线是把 Battle API 从构建时 env 升级为 Desktop / Android App 的运行时服务器选择：官方服务器、自建服务器和 Desktop-only 离线服务共用同一套 `postService`/room/WebSocket base URL；Desktop 离线服务通过 Electron 本地 Battle API + 进程内 `MemoryRedisLike` 保留 room 机制，不要求玩家安装 Docker/Redis；Web 端只服务本地开发和 ChromeAutomation 自动化测试，不作为上线产品；资源缓存单独做 Desktop-first，不把 500MB 公共 assets 打回 release 包。
- 训练家仓库下一步重点是性能/体验回归、组件预览覆盖、解锁箱页的 draft/profile BP 边界、灵魂伴侣战后亲密度成长，以及 debug 添加与正式 release 隐藏入口的回归验证。
- Battle V4 下一步继续按 diagnostics 驱动修问题：动画/顺序问题先走 playback probe，非法 AI 指令先走 `debug/README.md` 的 `allRequests` 复现方法。
- 存档级结构迁移仍按运行时标准化计划推进；Pokemon/Item/Bag/Vault/Log 等规则性 helper 优先放 `packages/changebattle-v2-core`，API 主要做编排。
