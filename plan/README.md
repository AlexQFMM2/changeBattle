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
| [formal-game](formal-game/README.md) | 部分完成 | 正式游戏主流程、对局偏好、星图、7 场计划、休整、结算、设施规则 |
| [battle-v4](battle-v4/README.md) | 部分完成 | Battle V4 架构、投降、AI、队伍生成、Showdown 播放与动画 |
| [items-and-bag](items-and-bag/README.md) | 已完成/收口 | 系统战斗道具、背包实例、休整页道具、战斗背包 |
| [dex-resources](dex-resources/README.md) | 已完成 | V1 道具/图标资源迁移、QuickDex 道具扩展 |
| [references](references/README.md) | 参考资料 | UI 参考图和设计拆解素材 |

## 当前最常用入口

- 正式游戏整体：[`formal-game/formal-game-v4-plan.md`](formal-game/formal-game-v4-plan.md)
- 正式游戏进度：[`formal-game/formal-game-v4-checklist.md`](formal-game/formal-game-v4-checklist.md)
- 战斗页投降与演出：[`battle-v4/battle-v4-surrender-and-narrative-flow-plan.md`](battle-v4/battle-v4-surrender-and-narrative-flow-plan.md)
- Battle V4 架构：[`battle-v4/architecture/battle-v4-architecture-plan.md`](battle-v4/architecture/battle-v4-architecture-plan.md)
- Battle V4 动画完善：[`battle-v4/animation/battle-v4-showdown-animation-deep-sync-plan.md`](battle-v4/animation/battle-v4-showdown-animation-deep-sync-plan.md)
- NPC/队伍生成：[`battle-v4/team-generation/battle-v4-team-generator-plan.md`](battle-v4/team-generation/battle-v4-team-generator-plan.md)
- 战斗 AI：[`battle-v4/ai/battle-v4-ai-decision-plan.md`](battle-v4/ai/battle-v4-ai-decision-plan.md)

## 当前进度

- 正式游戏主流程已经进入可跑通阶段：开局候选、星图扩展、选人、7 场计划生成、休整页复用、战斗页进入、投降失败结算、结算页和 BP 发放都已接入。
- 正式休整商店已经完成第一版闭环：购买、售出、正式价格、实例卖价、加权补货、商品详情推荐话术和商店 UI 动画均已接入。
- Battle V4 已完成 Showdown-style playback 重构、HP 缓动修正、投降框组件化，以及选人页两步选择交互；小图闪光因本地 picon 无 shiny sheet，采用普通 picon + 星标提示。
- Plan 文档已按功能目录整理，后续新增计划优先进入对应目录 README，而不是堆在根目录。

## 下一步

- 下一步正式玩法主线是训练场设施：传授技能、蛋技能、自主训练随机个体值和努力值。
- Battle V4 演出仍按 [`battle-v4/battle-v4-surrender-and-narrative-flow-plan.md`](battle-v4/battle-v4-surrender-and-narrative-flow-plan.md) 推进。
- 播放/动画技术路线继续指向 [`battle-v4/animation/battle-v4-showdown-animation-deep-sync-plan.md`](battle-v4/animation/battle-v4-showdown-animation-deep-sync-plan.md) 和 [`battle-v4/animation/battle-v4-showdown-animation-deep-sync-checklist.md`](battle-v4/animation/battle-v4-showdown-animation-deep-sync-checklist.md)。
