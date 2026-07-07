# ChangeBattle V2 Plan Index

这个目录按功能域整理。根目录只保留索引，具体计划、清单和参考图放到对应子目录。

## 状态口径

- `已完成`：当前计划主体已经收口；后续优化应开新计划或在对应 README 里追加。
- `部分完成`：已有代码或数据落地，但 checklist 仍有明确未完成项。
- `规划中`：主要是后续方案记录，当前不代表已经实现。
- `参考资料`：用于查阅，不作为施工进度本身。

## 功能目录

| 目录 | 状态 | 内容 |
| --- | --- | --- |
| [formal-game](formal-game/README.md) | 当前主线 | 正式游戏稳定化、最终休整、灵魂伴侣下版本计划 |
| [battle-v4](battle-v4/README.md) | 部分完成 | Battle V4 架构、投降、AI、队伍生成、Showdown 播放与动画 |
| [references](references/README.md) | 参考资料 | UI 参考图和设计拆解素材 |
| [archive](archive/) | 历史归档 | 已完成或明显落后的施工计划，保留用于查历史设计 |

## 当前最常用入口

- 正式游戏当前主线：[`formal-game/README.md`](formal-game/README.md)
- 灵魂伴侣下版本：[`formal-game/formal-soulmate-next-version-plan.md`](formal-game/formal-soulmate-next-version-plan.md)
- 战斗页投降与演出：[`battle-v4/battle-v4-surrender-and-narrative-flow-plan.md`](battle-v4/battle-v4-surrender-and-narrative-flow-plan.md)
- Battle V4 架构：[`battle-v4/architecture/battle-v4-architecture-plan.md`](battle-v4/architecture/battle-v4-architecture-plan.md)
- Battle V4 动画完善：[`battle-v4/animation/battle-v4-showdown-animation-deep-sync-plan.md`](battle-v4/animation/battle-v4-showdown-animation-deep-sync-plan.md)
- NPC/队伍生成：[`battle-v4/team-generation/battle-v4-team-generator-plan.md`](battle-v4/team-generation/battle-v4-team-generator-plan.md)

## 当前进度

- 正式游戏主流程已经进入可持续测试阶段：开局候选、星图扩展、选人、7 场计划、休整页、战斗页、单局战后结算、最终结算和 BP 发放都已接入。
- 正式休整商店和训练场已经完成第一版闭环：购买/售出、加权补货、课程学习、自主训练、费用、金币流水和课后流程均已接入。
- 正式流程重计算已经迁出 renderer；desktop 通过 `formalComputeWorker` 执行正式计算，并用静态 boot splash 改善启动白屏体感。
- Battle V4 已完成 Showdown-style playback 重构、HP 缓动修正、投降框组件化、天气持久层资源重载、Substitute 持续标记，以及选人页两步选择交互；小图闪光因本地 picon 无 shiny sheet，采用普通 picon + 星标提示。
- 正式模式稳定性继续收口：敌方 NPC 等级按玩家最高等级动态计算，究极异兽归入神兽候选，自习收益改为等级/数值约 3:7，战斗入场同步本地 PP。
- 休整页弹窗栈已补齐：背包打开时，技能学习替换和 Mega/Z/太晶系统道具重铸面板会显示在背包之上。
- Plan 文档已按功能目录整理，后续新增计划优先进入对应目录 README，而不是堆在根目录。

## 下一步

- 下一步正式玩法主线是继续跑完整流程、记录阻断问题，并围绕胜利后最终休整页推进“结伴/灵魂伴侣”功能。
- Battle V4 演出仍按 [`battle-v4/battle-v4-surrender-and-narrative-flow-plan.md`](battle-v4/battle-v4-surrender-and-narrative-flow-plan.md) 推进。
- 播放/动画技术路线继续指向 [`battle-v4/animation/battle-v4-showdown-animation-deep-sync-plan.md`](battle-v4/animation/battle-v4-showdown-animation-deep-sync-plan.md) 和 [`battle-v4/animation/battle-v4-showdown-animation-deep-sync-checklist.md`](battle-v4/animation/battle-v4-showdown-animation-deep-sync-checklist.md)。
