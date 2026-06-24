# ChangeBattle V2 Architecture

## Summary

V2 先只做图鉴，核心目标是把 Showdown Dex 做成干净、可复用、三端一致的数据内核。

```txt
Showdown 官方数据 / Dex
-> packages/showdown-dex-core
   -> search
   -> detail builders
   -> sprite resolver
   -> stat calculator
   -> learnset / holder reverse lookup
-> apps/api
   -> web/desktop shared adapter facade
-> apps/web adapter
-> apps/desktop adapter
-> UI
```

## Boundary

- `showdown-dex-core` 是唯一业务数据层。
- Web 和 Desktop 只维护 adapter，不维护搜索排序、学习面、图片规则、能力计算。
- `apps/api` 放所有 web/desktop 共用的应用层函数和 facade。
- `apps/web`、`apps/desktop` 不直接调用 core；先通过 `apps/api`。
- UI 只消费 core DTO，不直接访问 Showdown 全局变量。
- 第一阶段不接 app，不接 Battle，不接 GameRun，不接旧存档。

## Package Layout

```txt
packages/showdown-dex-core
  src/index.ts

apps/api
  src/index.ts

apps/web
  src/main.tsx
  src/App.tsx

apps/desktop
  src/main.tsx
  src/App.tsx
  electron/main.ts
```

## Data Source

第一版允许 adapter 注入 Showdown Dex 实例：

- Web：后续可通过 bundled Showdown mobile/dex bundle 或 generated static data 初始化。
- Desktop：后续可通过本地 Showdown `dist/sim` 初始化。

进入正式实现后，Core 不依赖外部研究目录；官方数据需要复制、生成或打包到项目内。

## Red Lines

- 不保留旧 `dexSearch`。
- 不用中文名、展示文本、图片名反推 ID。
- 不在 UI 中拼 sprite URL。
- 不把 Pokemon Showdown Dex 的 Backbone/jQuery 面板搬进 React。
- 不让 web/desk 各写一套 Dex 逻辑。
