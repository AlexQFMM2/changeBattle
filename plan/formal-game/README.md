# Formal Game Plans

这里保留正式游戏当前还会指导下一步开发的计划。已经收口或明显落后的施工计划已清理。

## 当前入口

| 文档 | 状态 | 说明 |
| --- | --- | --- |
| [formal-soulmate-egg-hatch-and-growth-plan.md](formal-soulmate-egg-hatch-and-growth-plan.md) | 主体已落地，后续回归 | “就决定是你了”后的蛋生成规则已抽到 core helper，并能写入长期宝可梦箱；仓库进化、全局进化弹窗、真实对局同行许可、战后亲密度回写、个人荣誉奖章和战斗内低概率进化已接入，后续主要看提示与回归。 |
| [formal-soulmate-battle-evolution-plan.md](formal-soulmate-battle-evolution-plan.md) | 已落地，后续回归 | 真实战斗中，亲密度达到门槛且下一段目标唯一的灵魂伴侣，在下一次 move request 前按 core 3% 概率判定是否进化；基于 Showdown `formeChange(..., evolutionEffect, true)`，前端只消费 rawLog/playbackTimeline。 |
| [formal-lan-coop-host-mode-plan.md](formal-lan-coop-host-mode-plan.md) | 下一核心开发点 | 双人局域网 PvE 合作：Desktop 优先，非战斗阶段各自本地计算并在中转页强同步，战斗阶段房主权威；客机作为 `p3` 与房主 `p1` 同队，对战 `p2/p4` AI。 |
| [formal-soulmate-next-version-plan.md](formal-soulmate-next-version-plan.md) | 后续扩展 | 围绕局外灵魂伴侣成长、展示和长期养成推进。 |

## 当前事实

- 正式游戏主流程已经具备完整闭环：开局候选、正式 run、单局/普通赛事、休整页、商店、训练场、战斗、战后奖励、最终结算和 BP 发放。
- 胜利后的最终休整页已接入：最后一场胜利后先进入 `battleEndedPendingSettlement`，玩家可最后整理队伍/背包/商店，再点击“去结算”。
- “灵魂伴侣”入口已接入最终胜利后的待结算休整页弹窗；蛋生成宝可梦记录的规则已抽到 `packages/changebattle-v2-core`，正式领取和 debug 新增宝可梦共用同一个 helper，孵化动画已接入 `assets/runtime/soulmate/egg-hatch-sheet.png` 序列图。
- 真实对局灵魂伴侣已接入：通过同行许可进入选人页专属槽位，休整页显示浅绿色禁用态，战斗昵称优先展示，战后按表现幂等回写来源仓库宝可梦亲密度，并在战斗中支持后端 rawLog 驱动的低概率羁绊进化。
- 宝可梦个人荣誉已接入：仓库详情页常驻展示 9 个地区制霸奖章和 1 个反派肃清奖章，战斗胜利后只给当前队伍里的仓库来源宝可梦写入个人 `honors`，重复进入结果页不会重复授章。
- 长期玩家仓库已成为正式流程后的关键承接页：同屏背包列 + 宝可梦箱、浮层详情抽屉、本地 draft 延迟保存、道具使用选择模式、携带道具、放生和进化操作都已进入回归阶段。
- 正式流程重计算已迁出 renderer；desktop 通过 worker 执行正式流程计算。
- 自建静态配置优先进入 `packages/changebattle-v2-core`，运行时规则保留在 API/Web。

## 下一步关注

- 回归“灵魂伴侣”MVP：最终胜利带走蛋、仓库养成/技能学习/进化、同行许可带入正式流程、正式休整页禁用态、战后亲密度回写、个人荣誉授章和战斗内低概率进化。
- 进入局域网合作模式设计落地：沿用 Showdown coop 的 `p1+p3` 对 `p2+p4` 编排，Desktop 先做双人 Vs 电脑；选人/休整各自本地算，中转页负责收集、校验和同步，战斗页由房主统一计算并分发时序。
- 隐藏登场和更多亲密度来源归入后续扩展；战斗内进化后续重点看 single/doubles/coop 的 rawLog 顺序、刷新后 request 和仓库同步稳定性。
- 完善最终休整右侧公告栏：展示胜利提示、本局奖励/医疗概览、结伴提示和长期仓库入口提示。
- 继续人工测试 single/standard 正式流程，重点看战后奖励幂等、结算 battleLog 统计、商店/训练场/背包在最终休整页是否稳定。
- 新增正式设施、长期养成能力或仓库扩展时单独开计划，不再扩写早期总计划。
