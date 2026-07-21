# Formal Room 休整交互 Result Contract 去 V4 化修复计划

## Summary

修复正式 room V5 下点击训练后黑屏的根因：服务端 command 已经只返回小 result + scoped view，但前端休整子组件仍复用 `Formal*ResultV4`，并在训练结果页读取 `result.run.restRunSnapshot`。

目标是把 room 模式的休整交互结果 contract 改成 V5-native：小 result 只表达本次操作结果，展示数据从服务端返回后的 scoped view / display model 读取，不再伪造 V4 `run`。

## Root Cause

当前崩溃链路：

```text
点击训练确认
-> training.apply 成功返回 V5 小 result
-> App.tsx 把小 result 包成 V4-looking object
-> result.run = formalRestDisplayModel.legacyRun = null
-> TrainingResultPanel -> findResultPokemon(result, pokemonId)
-> result.run.restRunSnapshot
-> Cannot read properties of null
```

这不是服务端实体写回失败，也不是房间数据再次变大；这是前端结果展示层还在复用 V4 result contract。

## Key Changes

- 新增 room-only result 类型：
  - `RoomRestCommandResult`
  - `RoomTrainingApplyResult`
  - `RoomTeamHealResult`
  - `RoomPokemonRerollResult`
  - `RoomBagActionResult`
- room result 只允许包含 `ok / message / actionType / result / afterPokemon? / beforePokemon? / balanceAfter? / reused?`，不允许包含 `run / restRunSnapshot / FormalGameRunV4 / TrainingRunGameV4`。
- `TrainingRestTrainingGroundScene` 的 result state 不再固定为 `FormalTrainingGroundResultV4`；room path 的 `TrainingResultPanel` 不再调用 `result.run.restRunSnapshot`。
- `applyLesson()` 提交前保存 `pokemonBefore`；提交成功后：
  - legacy V4 从旧 result/run 中取 `afterPokemon`。
  - room V5 从更新后的 display model team 或 command response 的 `afterPokemon` 取 `afterPokemon`。
- 如果 room V5 暂时拿不到 `afterPokemon`，结果页不能崩；显示 `pokemonBefore` + “学习已完成，状态已同步”，刷新 scoped view 后仍能看到变化。
- `App.tsx` room controller 删除这些伪 V4 返回：
  - `run: formalRestDisplayModel.legacyRun as any`
  - `...(submitted.result as any), ok: true`
- `trainingGroundController.onApply` 在 room 模式返回 `RoomTrainingApplyResult`；`applyFormalRoomCommandView(response.data)` 后从最新 rest view/display model 查找 `afterPokemon`。
- `healController`、`teamRerollController`、`opponentPreviewController`、`exchangeController`、`bagActionController`、`shopController`、`soulmateEgg` 的 room path 同步返回 room result，不再伪装 V4 result。
- `TrainingRestNewPage` controller 类型改成显式分支：
  - legacy controller 返回 V4 result。
  - room controller 返回 V5 room result，且 `serverCommitted: true`。
- 组件内部只在 legacy 分支读取 `result.run/restRunSnapshot`；room 分支只读 `message`、`afterPokemon` 和当前 `displayModel`。

## Redline Scan

新增或执行以下扫描：

```bash
rg "result\\.run|\\.run\\.restRunSnapshot|legacyRun as any|run: formalRestDisplayModel\\.legacyRun" apps/web/src/App.tsx apps/web/src/components/training -g '*.ts' -g '*.tsx'
rg "Formal.*ResultV4|ResultV4" apps/web/src/components/training apps/web/src/App.tsx -g '*.ts' -g '*.tsx'
```

允许命中必须限定在 legacy branch、legacy adapter、preview/test；正式 room path 不允许命中。

## Test Plan

### Static

```bash
pnpm --filter @changebattle-v2/web typecheck
pnpm --filter @changebattle-v2/desktop typecheck
pnpm --filter @changebattle-v2/mobile typecheck
git diff --check
```

### API / Data Boundary

- `training.apply` 响应不返回 `formalRun/restRunSnapshot/runGameV5/playersById/pokemonById/bagsById/itemInstancesById`。
- localStorage 不出现 room 大 formal run。
- `runGameV5.commandLog` 不保存大对象。
- 连续训练 2-3 次后 room JSON size 稳定。

### ChromeAutomation 验收

启动本地服务：

```bash
docker compose -f docker/battle-api/docker-compose.yml up -d --build
VITE_CHANGEBATTLE_BATTLE_SERVICE_URL=http://127.0.0.1:5191/changebattle/battle \
  pnpm --filter @changebattle-v2/web exec vite --host 127.0.0.1 --port 5188
start-chrome-automation --url http://127.0.0.1:5188
chrome-automation-pages --json
chrome-automation-attach 127.0.0.1:5188
```

验收流程：

1. 首页 -> 创建房间 -> 创建对局 -> ready/start -> starter -> rest。
2. 打开训练场，完成一次自习课程；确认不黑屏，成果面板显示，console 无 `restRunSnapshot` null error。
3. 再完成一次招式课程；若需要替换招式，选择替换槽后确认，成果面板正常显示。
4. 连续训练 2-3 次，确认每次都显示遮罩等待，成功后只应用服务端返回 view。
5. 点击治疗、重随、购买、出售、背包使用/携带/卸下/丢弃、排序保存，确认都不再读 `result.run` 崩溃。
6. 刷新休整页，确认通过 room credential + `GET match view?scope=rest` 恢复，不依赖 localStorage 大 run。
7. 进入 battle，出招或投降，进入 settlement，返回房间。
8. Network 审计 view/command 响应，不出现大对象字段。
9. localStorage 审计，不出现 room run/view 大缓存。

截图留档：

- 房间页
- starter
- rest
- 训练遮罩
- 训练成果面板
- 商店/背包任一成功操作
- battle
- settlement
- 返回房间后的 ended match

## Assumptions

- 服务端 `training.apply` 实体写回方向正确，不为前端成果面板恢复大 `run`。
- 本轮只修 room 休整交互 result contract，不重写整页 UI。
- legacy 训练场和非 room 正式流程可以继续使用 V4 result，但必须与 room V5 分支类型隔离。
- 若 command response 当前字段不足，优先从返回后的 scoped rest view 取 `afterPokemon`；只在必要时给小 result 增加 `pokemonId/lessonId/balanceAfter` 这类小字段，不返回大对象。
