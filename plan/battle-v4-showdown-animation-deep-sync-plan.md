# Battle V4 Showdown Animation Deep Sync Plan

## Summary

本计划用于把 Battle V4 从“全量 fallback 可播放”升级为“系统模仿 Pokemon Showdown client 动画体系”。深搜确认 Showdown 动画由 raw battle protocol、BattleScene 执行器、BattleMoveAnims/BattleOtherAnims/BattleStatusAnims、result/damage/heal、持久天气/场地层、CSS 资源层、move alias/max/gmax 映射共同组成。

本阶段不直接挂载原版 jQuery BattleScene；V4 继续使用 React/CSS timeline executor，但必须逐步把 Showdown 指令语义翻译成可诊断、可预览、可验收的 timeline。

配套执行清单：

- `changeBattleV2/plan/battle-v4-showdown-animation-deep-sync-checklist.md`

## Source Map

固定参考源：

- `pokemonShowdownAbout/pokemonShowdownClient/play.pokemonshowdown.com/src/battle.ts`：protocol 事件如何触发 scene 动画、damage/heal/result/status/weather。
- `pokemonShowdownAbout/pokemonShowdownClient/play.pokemonshowdown.com/src/battle-animations.ts`：BattleScene、BattleOtherAnims、BattleStatusAnims、天气/场地持久层。
- `pokemonShowdownAbout/pokemonShowdownClient/play.pokemonshowdown.com/src/battle-animations-moves.ts`：BattleMoveAnims top-level 608 项，326 个 simple alias/max/gmax 映射，2 个 special/composite assignment。
- `pokemonShowdownAbout/pokemonShowdownClient/play.pokemonshowdown.com/style/battle.css`：.weather、天气、场地、空间 CSS 层。
- `pokemonShowdownAbout/pokemonShowdownClient/play.pokemonshowdown.com/fx` 与 `changeBattleV2/assets/showdown/fx`：特效 sprite、天气图片、weather-gen6 webm/mp4。

## Adapter Fidelity

- `fallback`：只保证不空、不报错。
- `preset`：按类型族群近似，能预览和诊断，但不视为 Showdown 复刻完成。
- `native`：手写 V4 timeline，节奏接近 Showdown。
- `exact`：按 Showdown 原始 scene.showEffect / backgroundEffect / pokemon.anim / wait / delay 逐步翻译。

现有 checklist 中的 `[x]` 只说明“当前已有可播放 timeline”，不代表 exact。深度同步以后以 `adapterFidelity` 为验收事实源。

## Key Workstreams

### Persistent Weather / Terrain / Room Layer

- 新增 Battle V4 persistent weather/terrain state，不再只把天气当一次性 timeline step。
- `-weather` checkpoint 后更新 weather layer，`none` 后淡出。
- `-fieldstart/-fieldend` checkpoint 后更新 terrain/room/gravity layer。
- 优先使用 weather-gen6-sunnyday/raindance/sandstorm/hail webm/mp4，fallback 到 Showdown CSS 同款 jpg/png。
- 预览弹窗和真实战斗共用同一层。
- diagnostics 导出当前 weather/terrain/room、资源路径、是否 video fallback。

### SceneCore Instruction Semantics

- `showEffect` 支持 Showdown 的 from/to/time/delay/easing/fade/explode。
- `pokemon.anim` 支持多段 actor timeline、x/y/z/scale/opacity/xscale/yscale。
- `scene.wait` 和 `pokemon.delay` 精确进入 step scheduler。
- `backgroundEffect` 支持纯色、渐变、图片 URL。
- `resultAnim/damageAnim/healAnim` 统一坐标和本地化短句。
- checkpoint 仍然是唯一 visible state commit 点。

### P0 Exact / Native Moves

第一批优先把肉眼最明显的招式从 preset 升到 exact/native：

- `swordsdance`：按 Showdown 多把 sword 交叉/上升/淡出翻译。
- `earthquake`：按 Showdown 背景震动、土色背景、多段 wisp/冲击、目标晃动翻译。
- `bulldoze`、`protect`、`recover`、`rest`、`thunderbolt`、`flamethrower`、`icebeam`、`surf`、`rockslide`、`psychic`。

### Assignment Registry

- 对 328 个 assignment 建 registry，其中 326 个 simple alias，2 个 special/composite。
- selected key 保留原始 move key，timeline source 指向 alias target 或 composite targets。
- diagnostics 显示 `sourceKey=x / aliasTargetKey=y` 或 `compositeTargets=[...]`。
- checklist 单独追踪 assignment 是否已验证。

### Diagnostics

规范输出：

- `selectedAnimationKey`
- `sourceKey`
- `aliasTargetKey`
- `adapterFidelity`
- `showdownInstructionCount`
- `timelineSteps`
- `persistentWeatherState`
- `renderedWeatherLayer`
- `missingFxAssets`

## Test Plan

必跑：

- `pnpm --dir changeBattleV2 --filter @changebattle-v2/web typecheck`
- `pnpm --dir changeBattleV2 typecheck`
- `pnpm --dir changeBattleV2 test:identity-sync`
- `pnpm --dir changeBattleV2 --filter @changebattle-v2/showdown-battle-core test`

静态校验：

- BattleMoveAnims top-level = 608
- BattleMove simple alias assignments = 326
- BattleMove special/composite assignments = 2
- BattleOtherAnims = 45
- BattleStatusAnims = 10
- Weather CSS classes = 18
- Weather fx resources = 21
- checklist 每个 key 只出现一次，assignment 和 top-level 分开计数。

单元测试与手动验收：

- `swordsdance` 生成多段 sword timeline。
- `earthquake` 生成 background + 多段 ground/hit/actor shake timeline。
- `-weather|Sandstorm` checkpoint 后 persistent weather state 变为 sandstorm。
- `-fieldstart|move: Trick Room` checkpoint 后 room layer 变为 trickroom。
- alias move 保留原始 selected key，同时指向 alias target timeline。
- `phantomforce` 验证 prepareAnim + anim 双段 assignment。
- `headlongrush` 验证 closecombat + earthpower composite timeline。

## Assumptions

- 不直接挂载 Showdown 原版 jQuery BattleScene。
- 深度同步分阶段做：先修天气持久层和 P0 高频 exact，再逐步吃完 other/status/assignment/专属。
- 现有 fallback/preset 继续保留，防止未 exact 的 key 空动画。
- `debug/` 诊断导出目录不纳入提交。
