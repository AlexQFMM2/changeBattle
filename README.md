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
- Battle V4 正式接入。
- GameRun / 战斗进度 / 背包 / 统计等完整存档。
- 旧 `dexSearch` 兼容。

下一步：

- 搬训练页，先复用 V1 UI，数据和公共函数放到 `apps/api`。
- 训练页稳定后进入 Battle V4 战斗页：训练场优先，三模式稳定后再接正式流程。

详细路线见 `docs/training-and-battle-roadmap.md`。

## UI Rules

做任何页面、弹窗、面板或大型组件前，先读 `docs/ui-design.md`。V2 继续沿用 V1 的 `640 x 320` 游戏视口、像素密度、组件边界和参考图约束；首屏/首页优先复刻 V1 现有组件体验。

参考图保留在 `plan/ui-refences/`。

## Commands

```bash
pnpm install
pnpm web:dev
pnpm desktop:dev
pnpm typecheck
```
