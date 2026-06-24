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

## What Not To Reuse Directly

- `panels.js`。
- Backbone/jQuery UI。
- Showdown Dex 的页面路由。
- 任何需要 DOM/global window 才能工作的逻辑进入 core。

## First Milestone

图鉴页面必须能完成：

- 搜索 `fire`。
- 打开 `Ivysaur` / `Venusaur`。
- 打开 `Fire Blast` / `Megahorn`。
- 打开 `Mega Launcher`。
- 宝可梦详情按等级计算能力。
- 技能详情反查学习者。
- 特性详情反查拥有者。
