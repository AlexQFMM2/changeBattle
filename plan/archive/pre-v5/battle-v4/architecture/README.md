# Battle V4 Architecture

| 文档 | 状态 | 说明 |
| --- | --- | --- |
| [battle-v4-architecture-plan.md](battle-v4-architecture-plan.md) | 部分完成 | Battle V4 总架构和 protocol runtime 原则。核心方向稳定，部分历史阶段已完成，后续仍作为架构边界参考。 |
| [battle-v4-showdown-client-reference.md](battle-v4-showdown-client-reference.md) | 参考资料/部分完成 | Showdown client 对照文档，包含实现阶段清单和验收场景。用于查行为和避免偏离 protocol。 |
| [battle-v4-showdown-choice-command-reference.md](battle-v4-showdown-choice-command-reference.md) | 已完成/参考资料 | Showdown choice 指令表与 helper 规则已接入，后续主要查阅。 |

## 查找建议

- 想看“为什么这么设计”：先看 architecture plan。
- 想查 Showdown 原版怎么处理 request、choice、rawLog：看 client reference。
- 想查命令字符串合法形式：看 choice command reference。
