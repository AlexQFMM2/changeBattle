# Training Page And Battle V4 Roadmap

## Summary

本文最初记录 V2 从训练页迁移到 Battle V4 的启动路线。该路线的主体已经完成：训练页、Battle V4、正式 GameRun、休息室和 Windows Desktop portable release 都已接入。后续只把本文作为历史背景和回归边界参考，不再从“搬训练页”重新开始。

已完成的启动顺序：

```txt
搬训练页
-> 训练页最小可用
-> Battle V4 训练场入口
-> singles / doubles / multi 三模式协议验证
-> V2 战斗页 UI 接入
-> 正式 GameRun 接入
-> 正式休息室/商店/训练场/治疗/赛程叙事
-> Windows Desktop portable release
```

目标不是回到旧项目继续堆功能，而是在 V2 的干净边界里复用 V1 已经好看的 UI。

## Current Base

当前基础：

- V1 风格 `GameViewport` / 首屏 / 首页 / 玩家设置。
- 最小用户资料存档。
- 首页入口目前保留 `图鉴`、`玩家设置`。
- `apps/api` 作为 Web/Desktop 共用函数入口。
- `packages/showdown-dex-core` 作为 Dex 数据唯一事实源。
- V1 QuickDex 风格图鉴弹窗已接 Showdown Dex、中文数据、本地 sprite。
- Battle V4 使用 Showdown BattleStream 和 Showdown client playback timeline；前端使用 scheduler 消费 backend groups。
- 正式 GameRun 已有休息室、商店、自由选课训练场、治疗服务、7 场赛程、结算和 Windows Desktop portable release。

## Next Step 1: Training Page Migration

### Scope

训练页第一版只搬 V1 训练页体验，不直接进入完整 GameRun：

- 首页新增 `训练` 入口。
- 复用 V1 训练页 UI：布局、按钮、卡片、动效、GameViewport 约束。
- 训练页只负责选择训练模式和进入后续 Battle V4 training session。
- 数据和公共函数放在 `apps/api`，Web/Desktop 共用。
- 不接旧 `window.changeBattle`、旧 `dexSearch`、旧 `game-runtime`。

### Minimal UI

训练页至少包括：

- 返回首页。
- 模式选择：`singles`、`doubles`、`multi/co-op`。
- 队伍/对手选择第一版可以固定或使用少量内置样例。
- Debug 开关：显示 raw protocol / request / active bindings。
- 开始训练战斗按钮。

### Data Model Draft

```ts
type TrainingModeV2 = "singles" | "doubles" | "multi";

type TrainingScenarioV2 = {
  id: string;
  name: string;
  mode: TrainingModeV2;
  playerTeamId: string;
  opponentTeamId: string;
  allyTeamId?: string;
  description?: string;
};
```

### Red Lines

- 训练页不能直接读 V1 runtime。
- 训练页不能复制旧战斗状态机。
- 训练页不能使用中文名、图片名或 UI 文本反推宝可梦 ID。
- 训练页可以先用固定队伍，但队伍数据必须是结构化 ID。

## Next Step 2: Battle V4 Training Session

### Purpose

训练场是 Battle V4 的第一入口。它不是正式流程，也不是训练场旧功能复刻；它是 Showdown protocol runtime 的可视化调试入口。

### First Screen Requirements

Battle V4 training session 页面需要显示：

- V2/V1 战斗页视觉壳。
- raw protocol 面板。
- current request 面板。
- active bindings 面板。
- ui seat map 面板。
- available actions 面板。
- animation queue/debug consumption 面板。

### Runtime Boundary

```txt
Showdown BattleStream raw output
-> RawProtocolRecorder
-> ProtocolParser
-> BattleProtocolRuntimeV4
-> BattleEventAdapterV4
-> AnimationQueue
-> BattleViewModelV4
-> V2 Battle UI
```

关键原则：

- raw protocol 是事实源。
- request 是指令 UI 源。
- animation queue 只表现事实变化。
- UI 不参与身份判断。
- `p1/p2/p3/p4` 不能压扁成 `p1/p2`。

播放顺序、messagebar 和动画 step 分组以 `docs/battle-playback-showdown-parity.md` 的后端 Showdown Playback Compiler 为准，避免前端凭感觉调整节奏。

详细设计继续以 `plan/battle-v4-architecture-plan.md` 为准。

## Next Step 3: V2 Battle UI

### UI Rule

V2 战斗页继续沿用 V1/V2 已喜欢的战斗页视觉，不重新设计营销式页面。

可以搬：

- 场景结构。
- HP 卡。
- 指令面板。
- 目标选择。
- 换人面板。
- 倍速控制。
- Debug 按钮布局。
- motion 动效和 GameViewport 体系。

不能搬：

- V3 `showCommand` 兼容入口。
- 旧 seat fallback。
- 旧 animation 里创造事实的逻辑。
- 旧 GameRun 对战斗页的隐式耦合。

## Acceptance Order

1. 训练页能打开，模式选择能进入 Battle V4 training session。
2. training session 能创建 Showdown battle，完整显示 raw protocol 和 request。
3. singles 能完成 3 回合，包含一次主动换人和一次濒死强制换人。
4. doubles 能完成 3 回合，目标选择不串 seat。
5. multi/co-op 能创建 p1/p2/p3/p4 四 side，ally/enemy seat 不串。
6. 动画可以先粗糙，但 runtime state 必须正确。
7. 三模式训练场稳定后，再接正式 GameRun。

## Test Commands Target

当前已有：

```bash
pnpm --filter @changebattle-v2/showdown-dex-core test
pnpm typecheck
pnpm --filter @changebattle-v2/web exec vite build
pnpm --filter @changebattle-v2/desktop build
```

后续新增：

```bash
pnpm --filter @changebattle-v2/api test
pnpm --filter @changebattle-v2/battle-v4 test
pnpm --filter @changebattle-v2/web test:training-smoke
```

## Current TODO

- Battle V4 回归：形态变化、濒死/换人、天气场地、HP/PP/状态继承、双打/合作 seat 映射。
- 正式 GameRun 打磨：NPC 配队质量、特殊系统、商店/训练经济、赛程叙事、结算体验。
- Desktop portable 稳定性：继续保证离线运行、相对资源路径、worker bundle 无 React/runtime import、内置 battle service。
- 后续可评估 `ChangeBattle-V2-Desk.exe` launcher；安装器、签名、自动更新仍不在当前范围。
