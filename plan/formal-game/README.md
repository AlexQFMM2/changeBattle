# Formal Game Plans

这里保留正式游戏当前还会指导下一步开发的计划。已经收口或明显落后的施工计划已清理。

## 当前入口

| 文档 | 状态 | 说明 |
| --- | --- | --- |
| [formal-soulmate-egg-hatch-and-growth-plan.md](formal-soulmate-egg-hatch-and-growth-plan.md) | 主体已落地，后续回归 | “就决定是你了”后的蛋生成规则已抽到 core helper，并能写入长期宝可梦箱；仓库进化与全局进化弹窗已接入，后续主要看战后亲密度成长和回归。 |
| [formal-soulmate-next-version-plan.md](formal-soulmate-next-version-plan.md) | 后续扩展 | 围绕局外灵魂伴侣成长、展示和长期养成推进。 |

## 当前事实

- 正式游戏主流程已经具备完整闭环：开局候选、正式 run、单局/普通赛事、休整页、商店、训练场、战斗、战后奖励、最终结算和 BP 发放。
- 胜利后的最终休整页已接入：最后一场胜利后先进入 `battleEndedPendingSettlement`，玩家可最后整理队伍/背包/商店，再点击“去结算”。
- “灵魂伴侣”入口已接入最终胜利后的待结算休整页弹窗；蛋生成宝可梦记录的规则已抽到 `packages/changebattle-v2-core`，正式领取和 debug 新增宝可梦共用同一个 helper，孵化动画已接入 `assets/runtime/soulmate/egg-hatch-sheet.png` 序列图。
- 长期玩家仓库已成为正式流程后的关键承接页：同屏背包列 + 宝可梦箱、浮层详情抽屉、本地 draft 延迟保存、道具使用选择模式、携带道具、放生和进化操作都已进入回归阶段。
- 正式流程重计算已迁出 renderer；desktop 通过 worker 执行正式流程计算。
- 自建静态配置优先进入 `packages/changebattle-v2-core`，运行时规则保留在 API/Web。

## 下一步关注

- 回归“灵魂伴侣”MVP：从本局 battleLog 出现过的己方宝可梦中选择一只，孵化为进化链最小形态的 50 级局外长期伙伴，写入长期宝可梦箱后可在仓库使用局外养成、技能学习和进化流程。
- 补齐灵魂伴侣战后亲密度成长：通过同行许可带入正式流程的 run-local 副本仍不参与局内养成，但战斗表现结算需要能反映到长期资产的亲密度规则。
- 完善最终休整右侧公告栏：展示胜利提示、本局奖励/医疗概览、结伴提示和长期仓库入口提示。
- 继续人工测试 single/standard 正式流程，重点看战后奖励幂等、结算 battleLog 统计、商店/训练场/背包在最终休整页是否稳定。
- 新增正式设施、长期养成能力或仓库扩展时单独开计划，不再扩写早期总计划。
