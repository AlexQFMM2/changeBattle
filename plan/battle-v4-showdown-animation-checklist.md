# Battle V4 Showdown Animation Checklist

## Count Verification

提取日期：2026-06-26

固定参考源：

- `pokemonShowdownAbout/pokemonShowdownClient/play.pokemonshowdown.com/src/battle-animations.ts`
- `pokemonShowdownAbout/pokemonShowdownClient/play.pokemonshowdown.com/src/battle-animations-moves.ts`

数量校验：

```txt
BattleMoveAnims = 608
BattleOtherAnims = 45
BattleStatusAnims = 10
Total = 663
```

每一个动画 key 都以 checkbox 追踪。实现某个 key 后，把对应项从 `[ ]` 改成 `[x]`，并在 `notes:` 后补充验收方式、诊断文件或测试用例。若同名 key 分别存在于不同 source，例如 `bite` 或 `gravity`，必须按 source 分别追踪。

优先级约定：

- `P0`：Adapter Core、通用 fallback、状态动画、当前测试常见招式。
- `P1`：高频类型族群，包括火/水/电/冰/草/地面/岩石/超能/恶/幽灵/格斗/飞行等常规攻击。
- `P2`：状态变化、场地天气空间、保护/替身/回复/强化/道具相关。
- `P3`：Z 招式、稀有专属招式、低频特殊动画。

adapter 约定：

- `native`：已经按 Showdown 指令映射为 V4 timeline。
- `fallback`：暂走 Showdown-style 通用 fallback，不能报错。
- `pending`：尚未接入。

## Extraction Script

清单生成必须从 Showdown 源码抽取 top-level keys，再人工整理 priority；生成后不得删除 key。

```js
const fs = require('fs');
const root = 'pokemonShowdownAbout/pokemonShowdownClient/play.pokemonshowdown.com/src';

function tableKeys(file, table) {
  const src = fs.readFileSync(`${root}/${file}`, 'utf8').split(/\n/);
  const start = src.findIndex(line => line.includes(`export const ${table}`));
  let depth = 0, inTable = false;
  const keys = [];
  for (let i = start; i < src.length; i++) {
    const line = src[i];
    if (!inTable) {
      if (line.includes('{')) { inTable = true; depth = 1; }
      continue;
    }
    const m = /^\t([A-Za-z0-9_]+): \{/.exec(line);
    if (depth === 1 && m) keys.push(m[1]);
    for (const ch of line) {
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
    }
    if (depth <= 0) break;
  }
  return keys;
}

const move = tableKeys('battle-animations-moves.ts', 'BattleMoveAnims');
const other = tableKeys('battle-animations.ts', 'BattleOtherAnims');
const status = tableKeys('battle-animations.ts', 'BattleStatusAnims');
console.log({ move: move.length, other: other.length, status: status.length, total: move.length + other.length + status.length });
```

## Adapter Core Tasks

- [x] 定义 ShowdownAnimationTimelineV4 / ShowdownAnimationStepV4 数据结构，并支持 diagnostics 导出。 | priority: P0 | source: AdapterCore | adapter: native | notes: timeline rendered + diagnostics/typecheck
- [x] 定义 ShowdownSpriteActorV4 / ShowdownEffectSpriteV4，统一 Pokemon actor 与 effect sprite 的坐标、透明度、缩放。 | priority: P0 | source: AdapterCore | adapter: native | notes: timeline rendered + diagnostics/typecheck
- [x] 实现 projectShowdownAnimationTimelineV4(animationKey, context)，支持 move/other/status 三类 key。 | priority: P0 | source: AdapterCore | adapter: native | notes: timeline rendered + diagnostics/typecheck
- [x] 实现 executeShowdownAnimationTimelineV4(timeline)，保证 step 串行、checkpoint 可追踪、skip 可 drain。 | priority: P0 | source: AdapterCore | adapter: native | notes: timeline rendered + diagnostics/typecheck
- [x] 实现 scene.showEffect / pokemon.anim / pokemon.delay / scene.wait 指令适配。 | priority: P0 | source: AdapterCore | adapter: native | notes: timeline rendered + diagnostics/typecheck
- [x] 实现 scene.backgroundEffect / scene.resultAnim / scene.damageAnim / scene.healAnim 指令适配。 | priority: P0 | source: AdapterCore | adapter: native | notes: timeline rendered + diagnostics/typecheck
- [x] 实现 Showdown-style fallback，未实现 move key 不报错并产生可见攻击/受击/结果节奏。 | priority: P0 | source: AdapterCore | adapter: native | notes: timeline rendered + diagnostics/typecheck
- [x] 接入 protocol runtime：request 不进动画队列，只消费 raw protocol event。 | priority: P0 | source: AdapterCore | adapter: native | notes: timeline rendered + diagnostics/typecheck
- [x] 接入 battle diagnostics：导出 selected animation key、timeline steps、consumed checkpoints。 | priority: P0 | source: AdapterCore | adapter: native | notes: timeline rendered + diagnostics/typecheck
- [x] 接入开关：动画关闭时 drain queue，并把 visible state seek 到最新 snapshot。 | priority: P0 | source: AdapterCore | adapter: native | notes: timeline rendered + diagnostics/typecheck

## P0

### BattleOtherAnims

- [x] `hitmark` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [x] `attack` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [x] `contactattack` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [x] `xattack` | priority: P0 | source: BattleOtherAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `slashattack` | priority: P0 | source: BattleOtherAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `clawattack` | priority: P0 | source: BattleOtherAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `punchattack` | priority: P0 | source: BattleOtherAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `bite` | priority: P0 | source: BattleOtherAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `kick` | priority: P0 | source: BattleOtherAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `fastattack` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [x] `fastanimattack` | priority: P0 | source: BattleOtherAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `fastanimspecial` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [x] `fastanimself` | priority: P0 | source: BattleOtherAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `sneakattack` | priority: P0 | source: BattleOtherAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `spinattack` | priority: P0 | source: BattleOtherAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `bound` | priority: P0 | source: BattleOtherAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `selfstatus` | priority: P0 | source: BattleOtherAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `lightstatus` | priority: P0 | source: BattleOtherAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `chargestatus` | priority: P0 | source: BattleOtherAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `heal` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [x] `shake` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [x] `consume` | priority: P0 | source: BattleOtherAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `leech` | priority: P0 | source: BattleOtherAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `drain` | priority: P0 | source: BattleOtherAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `hydroshot` | priority: P0 | source: BattleOtherAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `sound` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck

### BattleStatusAnims

- [x] `brn` | priority: P0 | source: BattleStatusAnims | adapter: native | notes: timeline rendered + preview/manual/typecheck
- [x] `psn` | priority: P0 | source: BattleStatusAnims | adapter: native | notes: timeline rendered + preview/manual/typecheck
- [x] `slp` | priority: P0 | source: BattleStatusAnims | adapter: native | notes: timeline rendered + preview/manual/typecheck
- [x] `par` | priority: P0 | source: BattleStatusAnims | adapter: native | notes: timeline rendered + preview/manual/typecheck
- [x] `frz` | priority: P0 | source: BattleStatusAnims | adapter: native | notes: timeline rendered + preview/manual/typecheck
- [x] `flinch` | priority: P0 | source: BattleStatusAnims | adapter: native | notes: timeline rendered + preview/manual/typecheck
- [x] `attracted` | priority: P0 | source: BattleStatusAnims | adapter: native | notes: timeline rendered + preview/manual/typecheck
- [x] `cursed` | priority: P0 | source: BattleStatusAnims | adapter: native | notes: timeline rendered + preview/manual/typecheck
- [x] `confused` | priority: P0 | source: BattleStatusAnims | adapter: native | notes: timeline rendered + preview/manual/typecheck
- [x] `confusedselfhit` | priority: P0 | source: BattleStatusAnims | adapter: native | notes: timeline rendered + preview/manual/typecheck

### BattleMoveAnims

- [x] `swordsdance` | priority: P0 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `dragondance` | priority: P0 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `aerialace` | priority: P0 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `transform` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [x] `protect` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [x] `rest` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [x] `recover` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [x] `metalclaw` | priority: P0 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `scratch` | priority: P0 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `slash` | priority: P0 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `seismictoss` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [x] `bite` | priority: P0 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `heavyslam` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [x] `pound` | priority: P0 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `closecombat` | priority: P0 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `doublekick` | priority: P0 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `quickattack` | priority: P0 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `machpunch` | priority: P0 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `gigaimpact` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [x] `earthquake` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [x] `bulldoze` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [x] `metalsound` | priority: P0 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `thunderbolt` | priority: P0 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `psychic` | priority: P0 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `icebeam` | priority: P0 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `flamethrower` | priority: P0 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `rockslide` | priority: P0 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `fireblast` | priority: P0 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `shadowball` | priority: P0 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `energyball` | priority: P0 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `weatherball` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [x] `airslash` | priority: P0 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `surf` | priority: P0 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `hydropump` | priority: P0 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `eruption` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [x] `blastburn` | priority: P0 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `swift` | priority: P0 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck

## P1

### BattleMoveAnims

- [x] `afteryou` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `allyswitch` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `bravebird` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `acrobatics` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `flyingpress` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `steelwing` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `wingattack` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `dualwingbeat` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `dragonbreath` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `orderup` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `dragonpulse` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `focusblast` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `aurasphere` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `technoblast` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `painsplit` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `flail` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `uturn` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `flipturn` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `rapidspin` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `gyroball` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `mortalspin` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `icespinner` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `voltswitch` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `thunderwave` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `shockwave` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `discharge` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `bugbuzz` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `explosion` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `populationbomb` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `magiccoat` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `bide` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `doomdesire` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `shadowforce` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `bounce` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `dig` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `dive` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `fly` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `skydrop` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `skullbash` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `skyattack` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `hiddenpower` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `storedpower` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `haze` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `seedflare` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `powerwhip` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `woodhammer` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `ivycudgel` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `ivycudgelwater` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `ivycudgelfire` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `ivycudgelrock` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `crushclaw` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `falseswipe` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `direclaw` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `dragonclaw` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `furycutter` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `cut` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `nightslash` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `shadowclaw` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `multiattack` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `holdback` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `knockdown` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `peck` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `drillpeck` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `irontail` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `superfang` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `bugbite` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `crunch` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `pursuit` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: native timeline + preview/manual/typecheck
- [x] `blazekick` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `lowkick` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `stomp` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `thunderouskick` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `tropkick` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `jumpkick` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `highjumpkick` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `ironhead` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `heartstamp` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `slam` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `dragontail` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `reversal` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `punishment` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `forcepalm` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `circlethrow` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `knockoff` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `assurance` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `chipaway` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `bodyslam` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `bloodmoon` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `gigatonhammer` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `steamroller` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `clamp` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `wakeupslap` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `smellingsalts` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `karatechop` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `crosschop` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `lick` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `visegrip` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `headbutt` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `block` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `xscissor` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `crosspoison` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `facade` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `guillotine` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `return` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `leafblade` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `thrash` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `pluck` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `bind` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `dualchop` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `doublehit` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `doubleslap` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `endeavor` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `playrough` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `strength` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `hammerarm` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `icehammer` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `skyuppercut` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `meteormash` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `shadowpunch` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `ragefist` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `focuspunch` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `drainpunch` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `dynamicpunch` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `cometpunch` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `megapunch` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `poweruppunch` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `dizzypunch` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `needlearm` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `rocksmash` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `hornleech` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `absorb` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `megadrain` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `gigadrain` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `bitterblade` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `leechlife` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `extremespeed` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `suckerpunch` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `astonish` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `rollout` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `accelerock` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `bulletpunch` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `wickedblow` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `vacuumwave` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `jetpunch` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `assist` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `mirrormove` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `naturepower` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `copycat` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `megahorn` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `firepunch` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `icepunch` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `thunderpunch` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `poisonfang` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `psychicfangs` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `icefang` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `firefang` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `thunderfang` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `wildcharge` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `spark` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `zapcannon` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `armorcannon` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `torchsong` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `chloroblast` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `hyperbeam` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `shelltrap` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `spinout` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `matchagotcha` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `flamecharge` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `flareblitz` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `burnup` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `beakblast` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `vcreate` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `outrage` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `ragingfury` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `boltstrike` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `fusionflare` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `fusionbolt` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `zenheadbutt` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `fakeout` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `covet` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `feint` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `thief` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `shadowsneak` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `feintattack` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `struggle` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `tickle` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `earthpower` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `drillrun` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `poisongas` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `smog` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `clearsmog` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `bonemerang` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `boneclub` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `shadowbone` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `whirlwind` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `hurricane` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `springtidestorm` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `wildboltstorm` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `sandsearstorm` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `ominouswind` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `magmastorm` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `firespin` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `leaftornado` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `roar` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `round` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `yawn` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `sing` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `perishsong` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `partingshot` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `nobleroar` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `disarmingvoice` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `growl` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `screech` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `snore` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `synchronoise` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `sonicboom` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `eerieimpulse` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `supersonic` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `confide` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `defog` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `grasswhistle` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `hypervoice` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `boomburst` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `heatwave` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `snarl` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `thunder` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `thundercage` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `meanlook` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `nightshade` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `fairylock` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `rockblast` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `geargrind` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `iciclespear` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `tailslap` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `furyswipes` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `furyattack` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `bulletseed` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `spikecannon` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `twineedle` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `razorshell` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `aquastep` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `aquacutter` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `wavecrash` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `crabhammer` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `aquajet` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `iceshard` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `watershuriken` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `freezingglare` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `freezedry` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `icywind` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `ancientpower` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `powergem` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `chargebeam` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `psybeam` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `twinbeam` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `toxic` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `spicyextract` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `sludge` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `sludgewave` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `smokescreen` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `sludgebomb` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `syrupbomb` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `mudbomb` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `magnetbomb` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `seedbomb` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `willowisp` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `confuseray` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `lovelykiss` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `rockwrecker` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `stoneedge` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `avalanche` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `triplearrows` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `thousandarrows` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `thousandwaves` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `iciclecrash` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `spore` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `judgment` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `psystrike` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `hex` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `infernalparade` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `darkpulse` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `fierywrath` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `terrainpulse` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `naturesmadness` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `ruination` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `electroball` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `moonblast` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `mistball` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `present` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `iceball` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `flowertrick` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `healingwish` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `stealthrock` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `gmaxsteelsurge` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `spikes` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `toxicspikes` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `stickyweb` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `leechseed` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `mysticalpower` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `psyshock` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `barbbarrage` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `esperwing` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `sandtomb` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `saltcure` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `flashcannon` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `lusterpurge` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `grassknot` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `aeroblast` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `aircutter` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `dracometeor` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `makeitrain` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `brine` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `octazooka` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `waterpledge` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `soak` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `watersport` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `scald` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `steameruption` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `waterpulse` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `bubblebeam` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `muddywater` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `mudshot` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `lavaplume` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `dragonenergy` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `waterspout` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `solarbeam` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `electroshot` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `solarblade` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `lightofruin` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `meteorbeam` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `blizzard` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `sheercold` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `glaciallance` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `freezeshock` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `iceburn` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `razorwind` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `overheat` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `sacredfire` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `blueflare` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `electroweb` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `fling` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `worryseed` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `rockthrow` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `paraboliccharge` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `drainingkiss` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `oblivionwing` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `signalbeam` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `simplebeam` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `triattack` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `tripleaxel` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `hypnosis` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `darkvoid` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `roaroftime` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `spacialrend` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `sacredsword` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `secretsword` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `psychocut` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `precipiceblades` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `originpulse` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `dragonascent` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `diamondstorm` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `dazzlinggleam` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `mistyexplosion` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `payday` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `leafstorm` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `petaldance` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `petalblizzard` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `magicalleaf` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `leafage` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `gunkshot` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `hyperspacehole` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `hyperspacefury` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `poisonjab` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `psychoboost` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `bestow` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `finalgambit` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `forestscurse` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `trickortreat` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `healpulse` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `spite` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `lockon` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `mindreader` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `memento` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `spiritshackle` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `brutalswing` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `revelationdance` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `prismaticlaser` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `firstimpression` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `shoreup` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `firelash` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `powertrip` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `smartstrike` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `spotlight` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `anchorshot` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `clangingscales` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `spectralthief` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `plasmafists` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `collisioncourse` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `electrodrift` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `sunsteelstrike` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `moongeistbeam` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `astralbarrage` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `photongeyser` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `coreenforcer` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `stokedsparksurfer` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `supercellslam` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `psychicnoise` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `fishiousrend` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `stompingtantrum` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `temperflare` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `terastarstorm` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `thunderclap` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `mightycleave` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `spiritbreak` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `stoneaxe` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `malignantchain` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `hardpress` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `dragoncheer` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `upperhand` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `revivalblessing` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `blazingtorque` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `combattorque` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `magicaltorque` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `noxioustorque` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `wickedtorque` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `tachyoncutter` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `ficklebeam` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `ficklebeamallout` | priority: P1 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck

## P2

### BattleOtherAnims

- [x] `shiny` | priority: P2 | source: BattleOtherAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `flight` | priority: P2 | source: BattleOtherAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `dance` | priority: P2 | source: BattleOtherAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `gravity` | priority: P2 | source: BattleOtherAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `futuresighthit` | priority: P2 | source: BattleOtherAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `doomdesirehit` | priority: P2 | source: BattleOtherAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `itemoff` | priority: P2 | source: BattleOtherAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `anger` | priority: P2 | source: BattleOtherAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `bidecharge` | priority: P2 | source: BattleOtherAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `bideunleash` | priority: P2 | source: BattleOtherAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `spectralthiefboost` | priority: P2 | source: BattleOtherAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `schoolingin` | priority: P2 | source: BattleOtherAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `schoolingout` | priority: P2 | source: BattleOtherAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `megaevo` | priority: P2 | source: BattleOtherAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `powerconstruct` | priority: P2 | source: BattleOtherAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck

### BattleMoveAnims

- [x] `taunt` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `instruct` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `quash` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `swagger` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `quiverdance` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `victorydance` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `agility` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `doubleteam` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `metronome` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `teeterdance` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `splash` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `encore` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `attract` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `raindance` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `sunnyday` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `hail` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `snowscape` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `chillyreception` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `sandstorm` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `gravity` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `trickroom` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `magicroom` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `wonderroom` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `babydolleyes` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `faketears` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `tearfullook` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `featherdance` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `followme` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `foresight` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `mimic` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `sketch` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `doodle` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `odorsleuth` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `celebrate` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `playnice` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `tailwhip` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `leer` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `kinesis` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `electricterrain` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `grassyterrain` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `mistyterrain` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `lifedew` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `junglehealing` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `topsyturvy` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `embargo` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `healblock` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `flash` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `tailwind` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `auroraveil` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `reflect` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `safeguard` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `lightscreen` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `mist` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `bellydrum` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `aromatherapy` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `healbell` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `detect` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `kingsshield` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `spikyshield` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `burningbulwark` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `banefulbunker` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `craftyshield` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `matblock` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `quickguard` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `wideguard` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `endure` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `focusenergy` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `rockpolish` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `harden` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `defensecurl` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `irondefense` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `howl` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `acupressure` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `curse` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `autotomize` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `shiftgear` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `bulkup` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `shellsmash` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `stockpile` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `swallow` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `ingrain` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `aquaring` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `coil` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `conversion` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `powertrick` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `ragepowder` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `refresh` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `recycle` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `teleport` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `cottonguard` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `defendorder` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `meditate` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `sharpen` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `withdraw` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `roost` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `softboiled` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `milkdrink` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `happyhour` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `snatch` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `acidarmor` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `barrier` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `morningsun` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `moonlight` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `lunarblessing` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `cosmicpower` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `charge` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `luckychant` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `geomancy` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `magnetrise` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `substitute` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `batonpass` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `calmmind` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `nastyplot` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `minimize` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `growth` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `tailglow` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `takeheart` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `trick` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `switcheroo` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `skillswap` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `sleeptalk` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `wish` | priority: P2 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck

## P3

### BattleOtherAnims

- [x] `primalalpha` | priority: P3 | source: BattleOtherAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `primalomega` | priority: P3 | source: BattleOtherAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `zpower` | priority: P3 | source: BattleOtherAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `ultraburst` | priority: P3 | source: BattleOtherAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck

### BattleMoveAnims

- [x] `gigavolthavoc` | priority: P3 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `infernooverdrive` | priority: P3 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `alloutpummeling` | priority: P3 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `supersonicskystrike` | priority: P3 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `aciddownpour` | priority: P3 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `blackholeeclipse` | priority: P3 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `continentalcrush` | priority: P3 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `neverendingnightmare` | priority: P3 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `corkscrewcrash` | priority: P3 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `twinkletackle` | priority: P3 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `pulverizingpancake` | priority: P3 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `catastropika` | priority: P3 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `sinisterarrowraid` | priority: P3 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `oceanicoperetta` | priority: P3 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `extremeevoboost` | priority: P3 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `guardianofalola` | priority: P3 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `splinteredstormshards` | priority: P3 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `letssnuggleforever` | priority: P3 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `clangoroussoulblaze` | priority: P3 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `soulstealing7starstrike` | priority: P3 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
- [x] `searingsunrazesmash` | priority: P3 | source: BattleMoveAnims | adapter: native | notes: preset router timeline + preview/manual/typecheck
