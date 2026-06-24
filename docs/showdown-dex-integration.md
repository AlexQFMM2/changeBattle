# Showdown Dex Integration Notes

## Official Sources

研究目录：

```txt
/home/alexqfmm/workPlace/pokemon/pokemonShowdownAbout/
  pokemonShowdown/
  pokemonShowdownClient/
  pokemonShowdownDex/
```

优先参考：

- `pokemonShowdownClient/play.pokemonshowdown.com/src/battle-dex.ts`
- `pokemonShowdownClient/play.pokemonshowdown.com/src/battle-dex-search.ts`
- `pokemonShowdownDex/testclient.html`
- `pokemonShowdownDex/js/pokedex*.js`
- `pokemonShowdown/data/*.ts`

## What To Reuse

- Dex 数据表：`pokedex / moves / abilities / items / learnsets / typechart / aliases / search-index`。
- Search 思路：本地索引、本地过滤、本地详情，不按查询请求后端 API。
- Sprite resolver：统一生成 icon/front/back/shiny/animated 资源描述。
- Learnset 反查：从 learnsets 反推出某技能谁能学、怎么学。
- Pokemon / item icon sheet：按官方 client 的 sheet 坐标和 icon index 渲染小图。
- 旧项目 zh-CN 数据：只作为图鉴中文展示/搜索数据，不参与身份判断。

## What Not To Reuse Directly

- `panels.js`。
- Backbone/jQuery UI。
- Showdown Dex 的页面路由。
- 任何需要 DOM/global window 才能工作的逻辑进入 core。

## First Milestone

图鉴页面已完成：

- 搜索 `fire` / `妙蛙花` / `十万伏特`。
- 打开 `Ivysaur` / `Venusaur` / `Fire Blast` / `Megahorn` / `Mega Launcher` / `Leftovers`。
- 宝可梦详情按等级计算能力。
- 宝可梦详情展示进化链、其他形态、能力、特性、学习面、四向立绘、叫声 URL。
- 进化链、其他形态、技能学习者、特性拥有者均显示 Pokemon 小图。
- 技能详情反查学习者。
- 特性详情反查拥有者。
- 道具详情显示道具小图和中文说明。

## Current V2 Files

Core:

```txt
packages/showdown-dex-core/src/index.ts
packages/showdown-dex-core/src/localDex.ts
packages/showdown-dex-core/src/data/*
packages/showdown-dex-core/src/data/i18n/zh-cn-overrides.ts
packages/showdown-dex-core/src/data/i18n/zh-cn-details.ts
packages/showdown-dex-core/src/data/pokemon-icon-indexes.ts
```

UI:

```txt
apps/web/src/components/dex/QuickDexModal.tsx
apps/web/src/components/dex/*.css
```

Resources:

```txt
assets/showdown/sprites/ani
assets/showdown/sprites/ani-back
assets/showdown/sprites/ani-shiny
assets/showdown/sprites/ani-back-shiny
assets/showdown/sprites/pokemonicons-sheet.png
assets/showdown/sprites/pokemonicons-pokeball-sheet.png
assets/showdown/sprites/itemicons-sheet.png
assets/showdown/sprites/missing-sprites.json
assets/showdown/sprites/runtime-overrides.json
```

Sync scripts:

```txt
scripts/sync-showdown-sprites.mjs
scripts/sync-runtime-fallback-sprites.mjs
```

## Resource Policy

- `/showdown/` is served from project `assets/showdown` via Vite `publicDir`.
- Main 3D sprites use local Showdown mirror first.
- `missing-sprites.json` is the authoritative list of official Showdown 404 resources.
- `runtime-overrides.json` marks files copied from old runtime only because V2 local Showdown mirror had no file at that exact path.
- Do not delete `missing-sprites.json`; it explains which files are overrides.
- Do not add hidden fallback logic in UI. If a file is intentionally overridden, the file exists at the expected URL and is marked in `runtime-overrides.json`.

## Chinese Data Policy

- `zh-cn-overrides.ts` provides display names for species, moves, abilities, items, types, categories, natures, statuses.
- `zh-cn-details.ts` provides Chinese descriptions for moves, abilities, and items.
- Chinese names are included in search tags.
- English IDs remain the stable key. Chinese names must never be used to infer battle identity.

## Validation Commands

```bash
pnpm --filter @changebattle-v2/showdown-dex-core test
pnpm typecheck
pnpm --filter @changebattle-v2/web exec vite build
pnpm --filter @changebattle-v2/desktop build
```

Known note: web/desktop renderer bundle is large because Showdown data and zh-CN data are bundled eagerly. This is acceptable for the current stage; later we can lazy-load Dex data when opening the Dex modal.
