# ChangeBattle V2 Plan Index

这个目录只保留当前下一步开发计划。已经完成、明显落后或暂时不用的旧计划和参考素材已清理。

## 状态口径

- `已完成`：当前计划主体已经收口；后续优化应开新计划或在对应 README 里追加。
- `部分完成`：已有代码或数据落地，但 checklist 仍有明确未完成项。
- `规划中`：主要是后续方案记录，当前不代表已经实现。
- `参考资料`：用于查阅，不作为施工进度本身。

## 当前最常用入口

- 运行时数据标准化迁移：[`runtime-data-standardization-migration-plan.md`](runtime-data-standardization-migration-plan.md)
- 正式游戏当前主线：[`formal-game/README.md`](formal-game/README.md)
- 灵魂伴侣蛋孵化施工计划：[`formal-game/formal-soulmate-egg-hatch-and-growth-plan.md`](formal-game/formal-soulmate-egg-hatch-and-growth-plan.md)
- 灵魂伴侣下版本：[`formal-game/formal-soulmate-next-version-plan.md`](formal-game/formal-soulmate-next-version-plan.md)
- Desktop EXE 无黑框启动改造：[`desktop-exe-launcher-plan.md`](desktop-exe-launcher-plan.md)
- Assets CDN 核心抽象：[`assets-cdn-core-plan.md`](assets-cdn-core-plan.md)
- Battle diagnostics / AI 出招复现：[`../debug/README.md`](../debug/README.md)

## 当前进度

- 正式游戏主流程已经进入可持续测试阶段：开局候选、星图扩展、选人、7 场计划、休整页、战斗页、单局战后结算、最终结算和 BP 发放都已接入。
- 正式休整商店和训练场已经完成第一版闭环：购买/售出、加权补货、课程学习、自主训练、费用、金币流水和课后流程均已接入。
- 正式流程重计算已经迁出 renderer；desktop 通过 `formalComputeWorker` 执行正式计算，并用静态 boot splash 改善启动白屏体感。
- Battle V4 已完成 Showdown-style playback 重构、HP 缓动修正、投降框组件化、天气持久层资源重载、Substitute 持续标记、选人页两步选择交互，以及特殊系统目标选择修复；小图闪光因本地 picon 无 shiny sheet，采用普通 picon + 星标提示。
- 正式模式稳定性继续收口：敌方 NPC 等级按玩家最高等级动态计算，究极异兽归入神兽候选，自习收益改为等级/数值约 3:7，战斗入场同步本地 PP。
- 休整页弹窗栈已补齐：背包打开时，技能学习替换和 Mega/Z/太晶系统道具重铸面板会显示在背包之上。
- 灵魂伴侣蛋生成规则已经抽到 `packages/changebattle-v2-core` helper；正式灵魂伴侣领取和 debug 新增宝可梦共用同一套进化根、个体/性格/技能 fallback 生成逻辑。
- 训练家长期仓库页已经从旧 tab/格子背包改成同屏整理界面：左侧背包列、右侧 4x6 宝可梦箱、浮层抽屉详情、本地 draft 延迟保存、debug 添加、道具类型化使用、携带/卸下/放生和非阻塞反馈都已接入。
- 新仓库背包列不再展示空位，也不再支持旧的手动移动道具；道具容量仍按每页 6 个和至少 3 页规则保存，解锁箱页和 profile BP 的边界后续单独收口。
- 训练家仓库进化已经接入：进化道具走 preview/apply，按亲密度和进化链阶段校验，消耗道具并保留昵称、等级、技能、性格、个体、努力等养成数据；Web 使用全局 `GameEvolutionModal` 统一播放进化事件。
- 正式普通商店训练格已经切换为 10 个特效药；旧薄荷、王冠、特性胶囊/膏药、努力药等标准养成材料保留在待结算/局外养育侧，正式局内灵魂伴侣副本不能使用 TM 或特效药。
- 灵魂伴侣边界已经明确：仓库长期资产可以在训练家仓库养成；通过同行许可进入正式流程的是 run-local 副本，不参与局内训练、交换、TM、特效药等任何养成系统。
- Battle diagnostics 已补充 AI 出招复现方法：遇到 release blocked / invalid choice，可用 diagnostics 的 `allRequests` 直接跑当前 V2 `chooseAiBattleChoiceV4` 判断是旧包落后还是当前 core 仍需修。
- Plan 文档已收敛到当前主线；运行时标准化这类跨模块迁移保留在根目录，玩法计划优先进入对应目录 README。

## 下一步

- 下一步正式玩法主线是继续跑完整流程、记录阻断问题，并围绕正式赛程、NPC 配队、特殊系统、商店/训练经济、结算体验和长期仓库整理做回归打磨。
- 训练家仓库下一步重点是性能/体验回归、组件预览覆盖、解锁箱页的 draft/profile BP 边界、灵魂伴侣战后亲密度成长，以及 debug 添加与正式 release 隐藏入口的回归验证。
- Battle V4 下一步继续按 diagnostics 驱动修问题：动画/顺序问题先走 playback probe，非法 AI 指令先走 `debug/README.md` 的 `allRequests` 复现方法。
- 存档级结构迁移仍按运行时标准化计划推进；Pokemon/Item/Bag/Vault/Log 等规则性 helper 优先放 `packages/changebattle-v2-core`，API 主要做编排。
