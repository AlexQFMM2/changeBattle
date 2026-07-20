# Formal Game Plans

Archived before RunGame V5 C/S cleanup; for reference only.

正式游戏主流程相关文档集中在这里：profile 偏好、正式 run、星图、开局候选、7 场计划、休整、结算和后续设施。

| 文档 | 状态 | 说明 |
| --- | --- | --- |
| [formal-game-v4-plan.md](formal-game-v4-plan.md) | 部分完成 | 正式游戏 V4 总计划。星图、开局候选、休整/结算链路已有实现；7 场推进、经济设施和长期循环仍在迭代。 |
| [formal-game-v4-checklist.md](formal-game-v4-checklist.md) | 部分完成 | 主进度清单。第一阶段部分完成度高；第二阶段 7 场计划、第三阶段金币/BP/战斗统计、第四阶段设施仍有未完成项。 |
| [battle-v4-battle-preference-plan.md](battle-v4-battle-preference-plan.md) | 已完成 | 对局偏好作为 profile 配置保存，并在创建 run 时固化为快照。后续仅按规则扩展字段。 |
| [formal-rest-shop-plan.md](formal-rest-shop-plan.md) | 已完成/收口 | 正式休整商店第一版已完成：购买、售出、低价经济、加权补货、商品推荐话术和 UI 动画。 |
| [formal-training-ground-plan.md](formal-training-ground-plan.md) | 已完成/收口 | 正式训练场设施已完成：传授技能、蛋技能、自学招式、自主学习、费用和课后流程。 |
| [formal-transition-backend-migration-plan.md](formal-transition-backend-migration-plan.md) | 已完成/收口 | 正式中转页重计算已迁出 renderer；desktop 通过 worker 执行正式流程计算，coop 队友延后到战斗中转页派遣。 |
| [changebattle-v2-core-data-migration-plan.md](changebattle-v2-core-data-migration-plan.md) | 已完成/收口 | 将自建静态配置表迁入 `packages/changebattle-v2-core`；商店、正式配置、星图、rank 和休整入口 catalog 已收口。 |

## 数据边界

- `packages/showdown-dex-core`: Showdown / Pokemon 原始数据、dex 索引和本地 dex 服务。
- `packages/changebattle-v2-core`: ChangeBattle 自建静态配置，例如正式商店 catalog、正式模式配置、星图 catalog、物种 rank 表和休整入口 catalog。
- `apps/api`: 运行时规则、状态机、随机生成、交易、结算、存档 adapter 和对 Web 保持兼容的 re-export。
- `apps/web`: React UI、页面状态、动画、交互组件和资源展示。
- `assets`: 图片、视频、音频等二进制/静态媒体资源。

## 下一步关注

- 正式商店、训练场、单局战后结算、中转页重计算迁移和 desktop 启动体验优化都已收口；当前优先继续人工测试完整正式流程，稳定后再评估交换、招募等功能完善。
- 正式模式难度与成长已进入动态化测试：敌方 NPC 等级按玩家队伍最高等级生成，普通/精英同级，馆主/四天王/反派 +2，冠军 +4；合作友军不套用敌方加成。
- 正式训练场自习收益已改为先按 30% 等级、70% 数值决定收益类型，再按贪玩/一般/认真决定收益幅度。
- 究极异兽在正式模式中统一视为神兽，受神兽候选和神兽开关规则控制。
- 结算页展示改为“净收益 / 余额”，医疗保险说明明确覆盖战后救助、休整治疗、恢复/复活/PP 类商店道具折扣。
- 新增正式设施时优先拆独立计划，不再把全部内容塞回总计划。
- 测试与修复 bug 是下一阶段重点，尤其是正式流程、coop 战斗、结算幂等和设施交互。
- 自建配置数据迁移已按 `changebattle-v2-core-data-migration-plan.md` 收尾；后续新增配置优先进入 core，运行逻辑仍留在 API/Web。
