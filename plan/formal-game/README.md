# Formal Game Plans

正式游戏主流程相关文档集中在这里：profile 偏好、正式 run、星图、开局候选、7 场计划、休整、结算和后续设施。

| 文档 | 状态 | 说明 |
| --- | --- | --- |
| [formal-game-v4-plan.md](formal-game-v4-plan.md) | 部分完成 | 正式游戏 V4 总计划。星图、开局候选、休整/结算链路已有实现；7 场推进、经济设施和长期循环仍在迭代。 |
| [formal-game-v4-checklist.md](formal-game-v4-checklist.md) | 部分完成 | 主进度清单。第一阶段部分完成度高；第二阶段 7 场计划、第三阶段金币/BP/战斗统计、第四阶段设施仍有未完成项。 |
| [battle-v4-battle-preference-plan.md](battle-v4-battle-preference-plan.md) | 已完成 | 对局偏好作为 profile 配置保存，并在创建 run 时固化为快照。后续仅按规则扩展字段。 |
| [formal-rest-shop-plan.md](formal-rest-shop-plan.md) | 待规划 | 正式休整商店后续方向：商店只负责购买，出售集成到背包；5 个店铺、星图扩充库存，UI 暂不写死。 |
| [changebattle-v2-core-data-migration-plan.md](changebattle-v2-core-data-migration-plan.md) | 部分完成 | 将自建静态配置表迁入 `packages/changebattle-v2-core`；商店 catalog 已作为试点迁移，后续继续处理商品 view、正式模式配置、星图和 rank 数据。 |

## 数据边界

- `packages/showdown-dex-core`: Showdown / Pokemon 原始数据、dex 索引和本地 dex 服务。
- `packages/changebattle-v2-core`: ChangeBattle 自建静态配置，例如正式商店 catalog、正式模式配置、星图 catalog、物种 rank 表和休整入口 catalog。
- `apps/api`: 运行时规则、状态机、随机生成、交易、结算、存档 adapter 和对 Web 保持兼容的 re-export。
- `apps/web`: React UI、页面状态、动画、交互组件和资源展示。
- `assets`: 图片、视频、音频等二进制/静态媒体资源。

## 下一步关注

- 以 `formal-game-v4-checklist.md` 为准继续收敛 7 场 round plan、胜负推进、金币流水和设施经济。
- 新增正式设施时优先拆独立计划，不再把全部内容塞回总计划。
- 商店后续按 `formal-rest-shop-plan.md` 继续规划，先确认店铺/货柜方向和星图库存规则，再改 UI。
- 自建配置数据迁移已按 `changebattle-v2-core-data-migration-plan.md` 收尾；后续新增配置优先进入 core，运行逻辑仍留在 API/Web。
