# Battle V4 投降框组件化与演出流程计划

## Summary

本轮实现投降框组件化与投降流程调整：把 `BattleV4Page` 内联投降弹窗抽成独立组件，点击投降后从左侧弹出，视觉参考 `changeBattleV2/plan/references/ui/ui-refences/image copy.png`；单打/双打 1 票，合作 2 票，确认窗口持续 15 秒；全部同意后延迟 3 秒进入正式结算中转，判定玩家失败。

玩家/NPC 立绘进场、台词、胜负后再进场台词、离开页面等“非竞技式演出流程”先记录为后续阶段，本轮不实现。

## Key Changes

- 新增独立投降组件 `BattleV4SurrenderPanel`，组件只接收参与者、确认状态、倒计时、提交状态和确认/取消回调，不直接访问 run、snapshot 或路由。
- 投降框从页面左侧弹出，使用深色像素风面板、标题“发起投降”、票数格、青色倒计时条和“是/否”按钮。
- 单打/双打只显示 1 个票格；合作显示 2 个票格，第二票由 AI 队友短延迟自动同意。
- 倒计时从 30 秒改为 15 秒；未全员同意时关闭投降框并继续战斗。
- 全员同意后提交态等待 3 秒，再触发现有 `reason=surrender` 失败结算链路。
- 未来正式演出流程目标：训练家立绘进场 -> 台词 -> 进入战斗 -> 胜利/失败后训练家立绘重新进场 -> 台词 -> 离开战斗页进入中转页。
- “投球”演出暂时不接入主流程；如后续需要，可优先替换为 V2 自己的轻量出场/换人演出。

## Test Plan

- `pnpm --dir changeBattleV2 --filter @changebattle-v2/web typecheck`
- `pnpm --dir changeBattleV2 typecheck`
- 手测单打/双打投降只显示 1 个确认位，合作显示 2 个确认位。
- 手测 15 秒未确认会关闭投降框并继续战斗。
- 手测全员同意后等待 3 秒进入 `/formal/settlement-transition?reason=surrender`。
- 手测训练场未传 `onSurrenderSettlement` 时不显示投降按钮。

## Assumptions

- 本轮只做投降框和投降流程参数，不做训练家立绘/台词流程。
- 合作第二票暂时由 AI 自动同意；未来多人联机再改为真实玩家确认。
- 投降失败结算沿用现有 `reason=surrender`，不新增 settlement reason。
