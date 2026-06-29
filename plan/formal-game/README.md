# Formal Game Plans

正式游戏主流程相关文档集中在这里：profile 偏好、正式 run、星图、开局候选、7 场计划、休整、结算和后续设施。

| 文档 | 状态 | 说明 |
| --- | --- | --- |
| [formal-game-v4-plan.md](formal-game-v4-plan.md) | 部分完成 | 正式游戏 V4 总计划。星图、开局候选、休整/结算链路已有实现；7 场推进、经济设施和长期循环仍在迭代。 |
| [formal-game-v4-checklist.md](formal-game-v4-checklist.md) | 部分完成 | 主进度清单。第一阶段部分完成度高；第二阶段 7 场计划、第三阶段金币/BP/战斗统计、第四阶段设施仍有未完成项。 |
| [battle-v4-battle-preference-plan.md](battle-v4-battle-preference-plan.md) | 已完成 | 对局偏好作为 profile 配置保存，并在创建 run 时固化为快照。后续仅按规则扩展字段。 |

## 下一步关注

- 以 `formal-game-v4-checklist.md` 为准继续收敛 7 场 round plan、胜负推进、金币流水和设施经济。
- 新增正式设施时优先拆独立计划，不再把全部内容塞回总计划。
