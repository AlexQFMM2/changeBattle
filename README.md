# ChangeBattle V2

一个干净的新基座，第一阶段只做图鉴：

- `packages/showdown-dex-core`：三端共用的 Dex 数据、搜索、详情聚合、图片解析、能力计算、学习面反查。
- `apps/api`：Web/Desktop 共用的应用层 API facade，后续公共函数都放这里。
- `apps/web`：Web 端适配器和图鉴页面。
- `apps/desktop`：Desktop 端适配器和图鉴页面。

当前明确不做：

- app 端。
- Battle V4。
- GameRun / 存档 / 训练场。
- 旧 `dexSearch` 兼容。

## Commands

```bash
pnpm install
pnpm web:dev
pnpm desktop:dev
pnpm typecheck
```
