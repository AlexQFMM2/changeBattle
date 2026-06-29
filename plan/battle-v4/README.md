# Battle V4 Plans

Battle V4 相关文档集中在这里。子目录按内核架构、AI、队伍生成和动画播放拆开。

| 文档/目录 | 状态 | 说明 |
| --- | --- | --- |
| [architecture](architecture/README.md) | 部分完成 | Showdown protocol runtime、choice 指令、client 参考和战斗页架构。 |
| [ai](ai/README.md) | 已完成/调参中 | AI 决策器主体完成，剩余 fixture 与调参文档。 |
| [team-generation](team-generation/README.md) | 部分完成 | Showdown 随机队伍、正式随机池、NPC/Boss 队伍生成规则。 |
| [animation](animation/README.md) | 已完成/长期维护 | Showdown 动画 adapter、deep sync 清单与播放保真度迭代。 |
| [battle-v4-surrender-and-narrative-flow-plan.md](battle-v4-surrender-and-narrative-flow-plan.md) | 部分完成 | 投降框组件化和 15 秒投票流程已落地；训练家立绘/台词演出仍是规划。 |

## 下一步关注

- 投降：后续补正式叙事演出流程，当前只做投降 UI 和失败结算入口。
- 播放：长期按 protocol semantic event 维护，不再把 messagebar 和动画绑死。
- 队伍生成：继续压 NPC 难度曲线、完善 boss preset 过滤和补队。
