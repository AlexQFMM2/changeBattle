# ChangeBattle V2

一个干净的新基座。当前阶段已经完成 V1 风格首屏/首页迁移，并先把图鉴做成 V2 的稳定数据入口；下一阶段准备迁训练页，再进入 Battle V4 战斗页。

## Repository / Branch

V2 不是长期独立仓库；它属于原 ChangeBattle 仓库的 `v2` 分支。

```txt
canonical repo: /home/alexqfmm/workPlace/pokemon/changeBattle
remote: git@github.com:AlexQFMM2/changeBattle.git
branch: v2
current V2 working directory: /home/alexqfmm/workPlace/pokemon/changeBattleV2
```

提交时应提交到原仓库的 `v2` 分支。`changeBattleV2` 目录如果还没有 `.git`，需要先把它整理为原仓库 `v2` 分支的 worktree，或把当前 V2 文件作为 `v2` 分支根目录内容提交；不要把它当成新项目新仓库处理。

- `packages/showdown-dex-core`：Web/Desktop 共用的 Dex 数据、搜索、详情聚合、图片解析、中文翻译、能力计算、学习面反查。
- `apps/api`：Web/Desktop 共用的应用层 API facade，后续公共函数都放这里。
- `packages/showdown-battle-core`：Node-side BattleStream service。真实战斗逻辑在这里运行，Web/Desktop 只通过 HTTP adapter 读 snapshot / 提交 choice。
- `apps/web`：Web 端适配器、V1 风格首屏/首页、QuickDex 图鉴弹窗。
- `apps/desktop`：Desktop 端适配器，复用 Web UI。

当前已完成：

- V1 风格 `GameViewport`、首屏、首页、玩家设置基础体验迁移。
- 用户资料最小存档：只保存训练师基础信息。
- Showdown Dex Core：宝可梦、技能、特性、战斗道具搜索与详情。
- 本地 Showdown 资源：3D 四向立绘、小图 sheet、道具小图 sheet。
- 对 Showdown 缺失的 V2 sprite 路径，按 `missing-sprites.json` 从旧 runtime 精确补图，并用 `runtime-overrides.json` 标记可重置范围。
- 中文图鉴数据：中文名、中文说明、中文搜索、属性/分类/性格等基础翻译。

当前明确不做：

- app 端。
- 正式 roguelike GameRun 奖励、商店、结算。
- GameRun / 战斗进度 / 背包 / 统计等完整存档。
- 旧 `dexSearch` 兼容。

当前 Battle V4 首轮：

- 训练场休整页可以进入真实 Battle V4 中转页。
- Battle service 使用 Showdown `BattleStream` 创建 session，保留 raw protocol/request/debug。
- 战斗页使用 V2 风格战斗壳展示场景、HP、模型、指令、日志。
- 单打已打通核心 smoke；双打/合作使用同一 session API 和合法随机 AI 推进，后续继续补完整目标选择与动画。

下一步：

- 搬训练页，先复用 V1 UI，数据和公共函数放到 `apps/api`。
- 继续把旧 `battle-v2` 的目标选择、换人面板、日志弹窗、倍速/调试按钮细节迁到 `battle-v4`，并补战斗结束后的 HP/异常/PP 精准继承。

详细路线见 `docs/training-and-battle-roadmap.md`。

## UI Rules

做任何页面、弹窗、面板或大型组件前，先读 `docs/ui-design.md`。V2 继续沿用 V1 的 `640 x 320` 游戏视口、像素密度、组件边界和参考图约束；首屏/首页优先复刻 V1 现有组件体验。

参考图保留在 `plan/ui-refences/`。

## Commands

```bash
pnpm install
pnpm battle:dev
pnpm web:dev
pnpm desktop:dev
pnpm typecheck
```

`./start_desk` 会自动尝试启动本地 battle service（默认 `127.0.0.1:5191`），再启动桌面端。Web 端手测真实战斗时需要另开一个终端运行 `pnpm battle:dev`。
