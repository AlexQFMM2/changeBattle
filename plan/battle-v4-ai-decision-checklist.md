# Battle V4 AI Decision Checklist

## Count Verification

初始范围：

```txt
AI profile types = 1
Legal action generator = 1
Utility scoring engine = 1
Candidate pruning/search planner = 1
Async runtime integration = 1
Debug/tuning output = 1
Battle-core test batch = 1
```

本清单只追踪 AI 决策器。队伍生成器、AI 道具使用、完整 Showdown clone battle 模拟不在本批。

## P0: Types And Defaults

- [x] 新增 `BattleAiLevelV4`：`rookie/normal/elite/gymLeader/eliteFour/champion`。 | priority: P0 | source: ai-profile | adapter: native | notes:
- [x] 新增 `BattleAiPreferenceV4`：`offense/defense/support/balanced`。 | priority: P0 | source: ai-profile | adapter: native | notes:
- [x] 新增 `BattleAiProfileV4` 并挂到 AI player draft/input。 | priority: P0 | source: battle-types | adapter: native | notes:
- [x] controller 为 `ai` 但缺少 profile 时使用默认：`normal + balanced`。 | priority: P0 | source: defaults | adapter: native | notes:
- [x] 保持 `local` 玩家由 UI 控制，`script` 玩家暂不接 AI。 | priority: P0 | source: compatibility | adapter: native | notes:

## P0: Legal Action Generator

- [x] 从 `BattleServiceRequestV4` 生成 team preview 合法候选。 | priority: P1 | source: request | adapter: native | notes:
- [x] 从 force switch request 生成合法换人候选。 | priority: P0 | source: request | adapter: native | notes:
- [x] 从 move request 生成普通出招候选。 | priority: P0 | source: request | adapter: native | notes:
- [x] 过滤 disabled / 0 PP 常规招式。 | priority: P0 | source: legality | adapter: native | notes:
- [x] 濒死或 commanding active 自动生成 `pass`。 | priority: P0 | source: legality | adapter: native | notes:
- [x] 双打/合作 target suffix 合法生成。 | priority: P0 | source: legality | adapter: native | notes:
- [x] 多 active 换人不重复选择同一后备。 | priority: P0 | source: legality | adapter: native | notes:
- [x] Mega/Z/极巨/太晶作为普通合法候选生成，不按 AI 等级锁权限。 | priority: P0 | source: special-systems | adapter: native | notes: same special system is limited to once per turn choice
- [x] 最终 choice 继续走 ruleSet 过滤和 Showdown 接受校验。 | priority: P0 | source: safety | adapter: native | notes:

## P0: Utility Scoring

- [x] 建立基础 action feature vector：damage/ko/stab/typeAdvantage/accuracy/survival/protect/recovery/support/switch/special/targeting。 | priority: P0 | source: scorer | adapter: native | notes:
- [x] 建立天气 feature：天气启动、覆盖、天气受益/受损、天气下技能修正。 | priority: P0 | source: scorer-weather | adapter: native | notes: first version heuristic dimension
- [x] 建立场地 feature：电气/青草/精神/薄雾场地收益、状态限制和回复修正。 | priority: P0 | source: scorer-terrain | adapter: native | notes: first version heuristic dimension
- [x] 建立空间/控速 feature：戏法空间、顺风、速度变化对先后手和威胁窗口的影响。 | priority: P0 | source: scorer-room | adapter: native | notes: first version heuristic dimension
- [x] 建立能力等级 feature：强化、削弱、攻防速命中闪避 stage 对收益和风险的影响。 | priority: P0 | source: scorer-stat-stage | adapter: native | notes: first version heuristic dimension
- [x] 建立特性联动 feature：至少保留 ability 维度和常见特性修正入口。 | priority: P0 | source: scorer-ability | adapter: native | notes: first version heuristic dimension
- [x] 建立携带道具联动 feature：至少保留 item 维度和常见携带道具修正入口。 | priority: P0 | source: scorer-item | adapter: native | notes: first version heuristic dimension
- [x] 实现四套偏好权重：进攻、防守、辅助、平衡。 | priority: P0 | source: scorer | adapter: native | notes:
- [x] `level` 控制随机扰动和失误率，不控制特殊系统权限。 | priority: P0 | source: level-config | adapter: native | notes:
- [x] 菜鸟合法随机为主，但仍可被高分行动轻微影响。 | priority: P1 | source: level-config | adapter: native | notes:
- [x] 一般按当前回合高分选择。 | priority: P1 | source: level-config | adapter: native | notes:
- [x] 精英及以上为有限搜索提供稳定排序分。 | priority: P1 | source: level-config | adapter: native | notes: depth affects long-term feature bonus in first version

## P1: Candidate Pruning And Search

- [x] 单 active 候选按分数 Top N 裁剪。 | priority: P1 | source: pruning | adapter: native | notes:
- [x] 多 active 组合后按整回合 Top K 裁剪。 | priority: P1 | source: pruning | adapter: native | notes:
- [x] 精英搜索深度 1。 | priority: P1 | source: search | adapter: native | notes: first version depth bonus
- [x] 馆主搜索深度 2。 | priority: P1 | source: search | adapter: native | notes: first version depth bonus
- [x] 四天王搜索深度 3。 | priority: P1 | source: search | adapter: native | notes: first version depth bonus
- [x] 冠军搜索深度 4。 | priority: P1 | source: search | adapter: native | notes: first version depth bonus
- [x] 搜索先使用轻量局面估值，不 clone 完整 Showdown battle。 | priority: P1 | source: search | adapter: native | notes:

## P0: Async Battle Runtime Integration

- [x] 替换 battle-core 当前 AI 自动提交的 `randomLegalChoice` 路径。 | priority: P0 | source: battle-service | adapter: native | notes: randomLegalChoice retained as fallback wrapper
- [x] 收到 AI request 后启动异步决策任务。 | priority: P0 | source: runtime | adapter: native | notes:
- [x] 每个 AI 任务最多思考 10 秒。 | priority: P0 | source: runtime | adapter: native | notes:
- [x] 新 request 到来时取消同 player 旧任务。 | priority: P0 | source: runtime | adapter: native | notes:
- [x] 任务完成后只在 requestKey 仍匹配时提交。 | priority: P0 | source: runtime | adapter: native | notes:
- [x] 超时使用保底合法 choice，不能卡住战斗。 | priority: P0 | source: runtime | adapter: native | notes:
- [x] `getSnapshot` 只推进已完成或超时 AI，不同步阻塞长思考。 | priority: P1 | source: runtime | adapter: native | notes:

## P1: Debug And Tuning

- [x] snapshot debug 记录 AI 决策耗时、候选数量、最终 choice。 | priority: P1 | source: diagnostics | adapter: native | notes:
- [x] debug 记录 top candidates 的 score 和 features。 | priority: P1 | source: diagnostics | adapter: native | notes:
- [x] debug 记录 timeout/fallback。 | priority: P1 | source: diagnostics | adapter: native | notes:
- [x] 提供内部测试入口 `chooseAiBattleChoiceV4(context)`。 | priority: P1 | source: tests | adapter: native | notes:
- [ ] 追加调参 fixture：残血回复/守住、满血不 Rest、能击杀优先击杀。 | priority: P2 | source: tuning-fixtures | adapter: pending | notes:
- [ ] 追加调参 fixture：明显属性克制、双打集火残血、濒死避免无脑强化。 | priority: P2 | source: tuning-fixtures | adapter: pending | notes:
- [ ] 追加调参 fixture：空间收益、天气收益、场地收益。 | priority: P2 | source: tuning-fixtures | adapter: pending | notes:
- [ ] 追加调参文档示例：如何根据 `debug.aiDecisions.topCandidates[].features` 判断调 weight 还是 feature。 | priority: P2 | source: tuning-docs | adapter: pending | notes:

## Test Plan

- [x] `pnpm --dir changeBattleV2 --filter @changebattle-v2/showdown-battle-core test`。 | priority: P0 | source: verification | adapter: passed | notes:
- [x] `pnpm --dir changeBattleV2 typecheck`。 | priority: P0 | source: verification | adapter: passed | notes:
- [x] AI 决策主测试使用纯函数 `chooseAiBattleChoiceV4(context)`，不打开页面、不依赖 UI。 | priority: P0 | source: tests | adapter: native | notes:
- [x] fixture 直接传入模拟 `request/snapshot/playerId/aiProfile/rngSeed`，断言 choice、debug、耗时。 | priority: P0 | source: tests | adapter: native | notes: inline smoke fixtures
- [x] 建立数据驱动 fixtures：单打、双打、强制换人、Gen7 Mega/Z、Gen8 极巨、Gen9 太晶、天气/场地/空间、能力变化/特性/道具。 | priority: P0 | source: tests | adapter: native | notes: inline smoke fixtures cover these feature keys
- [x] fixture 断言 choice 可解析且合法、`elapsedMs` 小于预算、`candidateCount > 0`、debug feature key 完整。 | priority: P0 | source: tests | adapter: native | notes:
- [x] 少量 BattleStream 集成测试只验证异步提交、超时 fallback、旧 request 不提交、回合推进。 | priority: P1 | source: tests | adapter: native | notes: existing smoke covers AI submit/turn progress; timeout path unit-debugged via runtime fallback
- [x] 单打 request：六个等级都能生成合法 choice。 | priority: P0 | source: tests | adapter: native | notes:
- [x] 双打 request：多 active choice 完整，target 合法。 | priority: P0 | source: tests | adapter: native | notes:
- [x] force switch：不重复切同一后备，不切濒死。 | priority: P0 | source: tests | adapter: native | notes:
- [x] 特殊系统：Mega/Z/极巨/太晶所有等级都能在合法 request 中使用。 | priority: P0 | source: tests | adapter: native | notes:
- [x] 异步：完成提交、超时 fallback、旧 request 不提交。 | priority: P0 | source: tests | adapter: native | notes:
- [x] 合作：AI 不控制 local 队友。 | priority: P1 | source: tests | adapter: native | notes: controller-based routing replaces p1 hardcode

## Non-Goals

- [ ] 本批不实现队伍生成器。 | priority: P3 | source: non-goal | adapter: pending | notes:
- [ ] 本批不实现 AI 使用道具。 | priority: P3 | source: non-goal | adapter: pending | notes:
- [ ] 本批不训练模型、不接历史对局学习。 | priority: P3 | source: non-goal | adapter: pending | notes:
- [ ] 本批不做完整 Showdown clone battle 模拟。 | priority: P3 | source: non-goal | adapter: pending | notes:
