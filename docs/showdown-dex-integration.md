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

### Centralized Translation Contract

All English factual values must be translated through `packages/showdown-dex-core`.

Public entry points:

```ts
translateDexLabel(table, value)
translateDexDescription(table, value, fallback?)
dexLabelToId(table, value)
toDexId(value)
```

`createShowdownDexService()` exposes the same methods, and `@changebattle-v2/api` re-exports them for Web/Desktop callers.

Covered tables include:

- `pokemon` / `species`
- `moves` / `moveDescriptions`
- `abilities` / `abilityDescriptions`
- `items` / `itemDescriptions`
- `types`
- `categories`
- `natures`
- `stats`
- `status`
- `weather`
- `field`
- `sideConditions`
- `gender`

Hard rules:

- Do not add local translation dictionaries in `apps/web`, `apps/api`, or `apps/desktop` for any table listed above.
- Do not add ad hoc helpers like `typeLabelZh`, `moveCategoryZh`, `NATURE_LABEL`, `STATUS_LABEL`, `TYPE_ZH_BY_ID`, `TYPE_ID_BY_ZH`, `weatherLabel`, `fieldLabel`, `sideConditionLabel`, or stat-label maps in UI/API files.
- Do not translate by mutating saved Pokemon, move, item, or battle records. Runtime records store English IDs; views may carry Chinese display fields.
- Do not use Chinese names for identity checks, storage keys, Showdown protocol parsing, command generation, battle matching, or save migration.
- Do not special-case one component because “it is only UI”. If it is an English factual label, extend dex-core and call the shared function.
- `dexLabelToId("types", value)` is the approved way to convert a display type value back to a CSS/logic id when the UI may receive either English or Chinese.

Allowed outside dex-core, but still centralized by owner:

- ChangeBattle gameplay copy that is not a Showdown/Dex fact belongs to its owning domain package or feature module, not random UI/API call sites. Examples: lesson names, medical insurance tiers, settlement reasons, NPC lines, formal round labels, star-chart text.
- Shared gameplay labels should live in a catalog or label helper under the owning package/module, for example `packages/changebattle-v2-core`, `apps/api/src/formalGame.ts` formal-game catalogs, or a focused file inside the feature directory. Web components should consume the provided label/view fields.
- Purely local UI copy may stay in the component when it is not reused and does not encode gameplay meaning: one-off buttons, empty states, toasts, and confirmation prompts.
- UI-specific abbreviations that are not general translations, such as one-character type badges, if they are strictly presentational and not used as a general label source.
- Static gameplay labels owned by another domain package, when they are not Showdown/Dex facts.

When adding a new translated enum:

1. Add the table or entries in `packages/showdown-dex-core`.
2. Add or update tests in `packages/showdown-dex-core/src/index.test.ts`.
3. Use `api.translateDexLabel(...)`, `api.translateDexDescription(...)`, `api.dexLabelToId(...)`, or the direct dex-core export from the caller.
4. Run `pnpm --filter @changebattle-v2/showdown-dex-core test` and `pnpm typecheck`.

## Validation Commands

```bash
pnpm --filter @changebattle-v2/showdown-dex-core test
pnpm typecheck
pnpm --filter @changebattle-v2/web exec vite build
pnpm --filter @changebattle-v2/desktop build
```

Known note: web/desktop renderer bundle is large because Showdown data and zh-CN data are bundled eagerly. This is acceptable for the current stage; later we can lazy-load Dex data when opening the Dex modal.
