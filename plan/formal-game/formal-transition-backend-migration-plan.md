# Formal Transition Backend Migration Plan

## Summary

正式流程里有几段“中转页”目前仍在 renderer 前端同步执行重计算，导致视频/动画可能卡住，尤其是合作模式选完初始宝可梦后进入休整页时。后续目标是：中转页只负责展示动画和等待结果，正式游戏生成、赛程计划、合作队友、战斗 session 编译、结算等重计算统一迁到后端/桌面主进程或 battle service 侧执行。

本计划第一优先级是拆清楚职责：

- `/formal/round-transition` 只生成赛程和休整快照，不生成合作队友。
- 合作模式 `p3` 队友在用户结束休整、进入战斗页的中转页生成。
- renderer 不再同步执行正式流程重计算，只发起异步请求并等待结果。

## Current Problems

- `FormalGameTransitionPage` 在 renderer 里执行 `createFormalGameRun` 和 `prepareFormalStarterCandidates`。
- `FormalRoundTransitionPage` 在 renderer 里执行 `prepareFormalRoundPlan`。
- `prepareFormalRoundPlan` 目前会为 coop 生成 `p3` script 队友，这既增加“选人后进休整页”的负担，也不利于后续“招募队友”系统。
- `TrainingBattleTransitionPage` 在 renderer 里执行 `createBattleGameFromTrainingNode`，正式战斗也复用这条链路，导致正式 battle session input 编译仍在前端完成。
- `FormalSettlementTransitionPage` 在 renderer 里执行 `prepareFormalSettlement`。
- 战斗 snapshot 保存时，`App.tsx` 里同步执行 `settleFormalBattleRoundV4`。

## Target Architecture

- renderer:
  - 负责播放中转动画、显示状态、提交请求、保存返回结果、导航。
  - 不直接执行正式流程重计算。
- desktop main / backend:
  - 负责正式 run 创建、开局候选生成、7 场计划生成、正式战斗 session 编译、正式结算。
  - 提供异步 bridge/API，renderer 只 `await`。
- battle service:
  - 继续负责 Showdown session 创建和战斗推进。
  - 后续可承接 battle session input 编译，但第一阶段可以先由 desktop main/API 负责。

## Migration Tasks

### 1. 抽出正式流程后端 bridge

- [ ] 新增 `DesktopFormalGameBridge` 类型。
- [ ] Electron preload 暴露 `window.changeBattleV2.formalGame`。
- [ ] Electron main 注册正式流程 IPC handler。
- [ ] handler 内使用 API 层函数执行计算，避免 renderer 直接跑重逻辑。
- [ ] Web runtime 没有 desktop bridge 时保留当前同步 API fallback，方便浏览器调试页继续可用。

建议第一版 bridge 方法：

- `createFormalGameWithStarterCandidates(profile, options): Promise<FormalGameRunV4>`
- `prepareFormalRoundPlan(run): Promise<FormalGameRunV4>`
- `prepareFormalBattleSession(run): Promise<{run: FormalGameRunV4; restRunSnapshot: TrainingRunGameV4; sessionInput: BattleSessionCreateInputV4}>`
- `settleFormalRun(run, profile, reason): Promise<{run: FormalGameRunV4; profile: UserProfileV2}>`
- `settleFormalBattleRound(run, snapshot): Promise<FormalGameRunV4>`

### 2. 迁移正式开局候选生成

- [ ] `FormalGameTransitionPage` 改为优先调用 bridge。
- [ ] renderer 不再直接执行 `prepareFormalStarterCandidates`。
- [ ] 中转动画开始后立即发起异步计算，动画结束时如果结果未返回则继续等待。
- [ ] 错误仍显示在当前中转页，不跳空页面。

验收：

- 开始正式游戏时动画不因候选生成停顿。
- 候选数量仍受星图快照影响。
- run 创建时仍固化 battle preference 和 star chart snapshot。

### 3. 拆分 7 场计划与 coop 队友生成

- [ ] 修改 `prepareFormalRoundPlan`：coop 模式不再生成 `p3` 队友。
- [ ] round plan 只包含本轮节点、对手预览、休整快照所需结构。
- [ ] 休整页和对手预览不依赖已生成的 `p3`。
- [ ] 更新文案：coop 队友不是“进入 7 场计划时生成”，而是“进入战斗时派遣/生成”。
- [ ] 补兼容 normalize：旧存档里已有 `p3` 时不崩溃，新存档不写入 round plan 的队友。

验收：

- 选完初始宝可梦进入休整页时不生成 coop 队友。
- `/formal/round-transition` 的计算量明显下降。
- 后续招募队友系统可以在休整页修改可用队友状态，并影响下一场战斗。

### 4. 迁移正式 round plan 生成到后端

- [ ] `FormalRoundTransitionPage` 改为优先调用 bridge 的 `prepareFormalRoundPlan`。
- [ ] renderer fallback 只用于 web 调试。
- [ ] 保存 run 的职责保持清晰：要么 bridge 返回已保存 run，要么 renderer 只保存轻量返回结果，避免重复写。
- [ ] 中转页 tip 区分“生成赛程”和“等待保存”。

验收：

- 选完人进入休整页时动画持续播放，不被 JS 同步计算卡住。
- 重复进入已生成 round plan 的 run 不重复生成。
- coop 模式不在这一阶段生成 `p3`。

### 5. 正式战斗中转页生成 coop 队友

- [ ] 新增正式专用战斗中转逻辑，不再完全复用训练模式 `createBattleGameFromTrainingNode(run, node)`。
- [ ] 输入使用完整 `FormalGameRunV4`，不是只传 `restRunSnapshot`。
- [ ] 根据当前节点和 run 状态生成本场 `p3`：
  - 第一版仍可沿用现有 script/AI 生成器。
  - 后续接入招募队友时，从 run 的招募状态中选择队友。
- [ ] 将生成的 `p3` 写入本场 battle session input，不提前固化到 7 场计划。
- [ ] `p3` controller 继续为 `script`，并沿用已修复的自动出招流程。

验收：

- coop 只有点击休整页“开始战斗”后才生成本场队友。
- 同一场 battle session 内队友稳定。
- 返回休整页后下一场可以根据新招募状态生成不同队友。
- p1 选完技能后不会等待 p3 手动输入。

### 6. 迁移 battle session input 编译

- [ ] 把正式战斗的 `sessionInput` 编译移到 bridge/backend。
- [ ] 保留训练模式现有前端编译路径，或后续单独迁移训练模式。
- [ ] 特殊系统准入继续由 run/node ruleSet + 背包专属道具决定。
- [ ] bridge 返回创建 battle session 所需输入，或直接在后端调用 battle service 并返回 session id。

推荐分两步：

1. 第一阶段：backend 编译 `sessionInput`，renderer 调用 battle service 创建 session。
2. 第二阶段：backend 直接创建 session，renderer 只拿 `sessionId`。

验收：

- 正式战斗中转页动画不被 session input 编译阻塞。
- 太晶/Mega/Z/极巨准入仍按过滤后的 request 展示。
- coop `p3` 不会偷偷使用未授权特殊系统。

### 7. 迁移正式结算

- [ ] `FormalSettlementTransitionPage` 改为调用 bridge 结算。
- [ ] `prepareFormalSettlement`、`claimFormalSettlementBp`、保存 run/profile 的顺序在后端统一处理。
- [ ] 战斗 snapshot 后的 `settleFormalBattleRoundV4` 也迁移到 bridge。
- [ ] 保留幂等字段，避免刷新或重复事件导致重复发钱/升级/BP。

验收：

- 结算中转页不因 battleLog 长度明显卡顿。
- BP 领取、金币流水、战绩统计保持幂等。
- 单局战后结算仍只结算一次。

## Implementation Order

1. 后端 bridge 框架。
2. `prepareFormalRoundPlan` 迁出 renderer。
3. 从 round plan 移除 coop `p3` 生成。
4. 正式 battle transition 生成本场 coop 队友。
5. 正式 battle session input 编译迁出 renderer。
6. 正式开局候选生成迁出 renderer。
7. 正式结算迁出 renderer。

这个顺序优先解决当前最明显卡顿，同时不提前阻塞招募队友系统。

## Test Plan

- Typecheck:
  - `pnpm --dir changeBattleV2 --filter @changebattle-v2/api typecheck`
  - `pnpm --dir changeBattleV2 --filter @changebattle-v2/web typecheck`
  - `pnpm --dir changeBattleV2 --filter @changebattle-v2/desktop typecheck`
  - `pnpm --dir changeBattleV2 typecheck`
- Formal smoke:
  - `pnpm --dir changeBattleV2 --filter @changebattle-v2/api test:formal-game`
- Static:
  - `git -C changeBattleV2 diff --check`
- 手测：
  - 单打/双打/合作模式创建正式游戏。
  - 合作模式选完初始宝可梦后进入休整页，动画不中断。
  - 合作模式休整页点击开始战斗后生成 `p3`，并自动提交 script 指令。
  - 无特殊系统道具时前端不展示特殊按钮。
  - 正式结算刷新不重复发奖。

## Assumptions

- “后端”第一阶段指 Electron desktop main/API bridge；浏览器 web runtime 可保留同步 fallback。
- 合作队友未来会接入招募系统，因此不应在 7 场计划阶段固定。
- 第一版不重做 battle service 协议，只调整计算位置和正式流程职责。
- 旧存档可能已有 coop `p3`，normalize 需要兼容，但新存档不再提前生成。
- 训练模式是否迁移到后端另开计划，本计划聚焦正式流程。
