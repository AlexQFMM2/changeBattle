# Battle V4 Plans

Battle V4 相关文档集中在这里。子目录按内核架构、AI、队伍生成和动画播放拆开。

| 文档/目录 | 状态 | 说明 |
| --- | --- | --- |
| [architecture](architecture/README.md) | 部分完成 | Showdown protocol runtime、choice 指令、client 参考和战斗页架构。 |
| [ai](ai/README.md) | 已完成/调参中 | AI 决策器主体完成，剩余 fixture 与调参文档。 |
| [team-generation](team-generation/README.md) | 部分完成 | Showdown 随机队伍、正式随机池、NPC/Boss 队伍生成规则。 |
| [animation](animation/README.md) | 下一步 | Showdown 动画 adapter、deep sync 清单与播放保真度迭代；下一步接完整战斗流程动画。 |
| [battle-v4-surrender-and-narrative-flow-plan.md](battle-v4-surrender-and-narrative-flow-plan.md) | 下一步 | 投降框组件化已落地；下一步接训练家立绘进场与台词。 |

## 当前进度

- Battle V4 战斗内播放已按 Showdown-style 分层：rawLog -> semantic events -> runtime state -> visual scene/message flow。
- 投降流程已抽成左侧小型 `BattleV4SurrenderPanel`：单打/双打一票，合作两票，15 秒确认，全同意 3 秒后进入失败结算。
- 选人页底部候选已改为两步交互：第一次点击只查看详情，再点当前候选才加入右侧队伍。
- 闪光候选详情使用 shiny sprite；底部像素小图因本地 picon 无 shiny sheet，采用普通 picon 叠星标。

## 下一步关注

- 叙事演出：正式和训练场入口都显示训练家立绘进场与台词，按 V1 点击/空格/Enter 推进，最后进入战斗。
- 动画完善：下一步执行 [`animation/battle-v4-showdown-animation-deep-sync-plan.md`](animation/battle-v4-showdown-animation-deep-sync-plan.md)，新增任务同步写入 deep sync checklist。
- 播放：继续按 protocol semantic event 维护，不再把 messagebar 和动画绑死。
- 队伍生成：继续压 NPC 难度曲线、完善 boss preset 过滤和补队。
