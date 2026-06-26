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
- [ ] `xattack` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes:
- [ ] `slashattack` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes:
- [ ] `clawattack` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes:
- [ ] `punchattack` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes:
- [ ] `bite` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes:
- [ ] `kick` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes:
- [x] `fastattack` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [ ] `fastanimattack` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes:
- [x] `fastanimspecial` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [ ] `fastanimself` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes:
- [ ] `sneakattack` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes:
- [ ] `spinattack` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes:
- [ ] `bound` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes:
- [ ] `selfstatus` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes:
- [ ] `lightstatus` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes:
- [ ] `chargestatus` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes:
- [x] `heal` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [x] `shake` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [ ] `consume` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes:
- [ ] `leech` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes:
- [ ] `drain` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes:
- [ ] `hydroshot` | priority: P0 | source: BattleOtherAnims | adapter: fallback | notes:
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

- [ ] `swordsdance` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes:
- [ ] `dragondance` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes:
- [ ] `aerialace` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes:
- [x] `transform` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [x] `protect` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [x] `rest` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [x] `recover` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [ ] `metalclaw` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes:
- [ ] `scratch` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes:
- [ ] `slash` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes:
- [x] `seismictoss` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [ ] `bite` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes:
- [x] `heavyslam` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [ ] `pound` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes:
- [ ] `closecombat` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes:
- [ ] `doublekick` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes:
- [ ] `quickattack` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes:
- [ ] `machpunch` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes:
- [x] `gigaimpact` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [x] `earthquake` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [x] `bulldoze` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [ ] `metalsound` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes:
- [ ] `thunderbolt` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes:
- [ ] `psychic` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes:
- [ ] `icebeam` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes:
- [ ] `flamethrower` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes:
- [ ] `rockslide` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes:
- [ ] `fireblast` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes:
- [ ] `shadowball` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes:
- [ ] `energyball` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes:
- [x] `weatherball` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [ ] `airslash` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes:
- [ ] `surf` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes:
- [ ] `hydropump` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes:
- [x] `eruption` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes: timeline rendered + preview/manual/typecheck
- [ ] `blastburn` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes:
- [ ] `swift` | priority: P0 | source: BattleMoveAnims | adapter: fallback | notes:

## P1

### BattleMoveAnims

- [ ] `afteryou` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `allyswitch` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `bravebird` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `acrobatics` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `flyingpress` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `steelwing` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `wingattack` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `dualwingbeat` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `dragonbreath` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `orderup` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `dragonpulse` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `focusblast` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `aurasphere` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `technoblast` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `painsplit` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `flail` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `uturn` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `flipturn` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `rapidspin` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `gyroball` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `mortalspin` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `icespinner` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `voltswitch` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `thunderwave` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `shockwave` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `discharge` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `bugbuzz` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `explosion` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `populationbomb` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `magiccoat` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `bide` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `doomdesire` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `shadowforce` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `bounce` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `dig` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `dive` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `fly` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `skydrop` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `skullbash` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `skyattack` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `hiddenpower` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `storedpower` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `haze` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `seedflare` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `powerwhip` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `woodhammer` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `ivycudgel` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `ivycudgelwater` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `ivycudgelfire` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `ivycudgelrock` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `crushclaw` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `falseswipe` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `direclaw` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `dragonclaw` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `furycutter` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `cut` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `nightslash` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `shadowclaw` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `multiattack` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `holdback` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `knockdown` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `peck` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `drillpeck` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `irontail` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `superfang` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `bugbite` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `crunch` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `pursuit` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `blazekick` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `lowkick` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `stomp` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `thunderouskick` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `tropkick` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `jumpkick` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `highjumpkick` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `ironhead` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `heartstamp` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `slam` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `dragontail` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `reversal` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `punishment` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `forcepalm` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `circlethrow` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `knockoff` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `assurance` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `chipaway` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `bodyslam` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `bloodmoon` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `gigatonhammer` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `steamroller` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `clamp` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `wakeupslap` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `smellingsalts` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `karatechop` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `crosschop` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `lick` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `visegrip` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `headbutt` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `block` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `xscissor` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `crosspoison` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `facade` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `guillotine` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `return` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `leafblade` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `thrash` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `pluck` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `bind` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `dualchop` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `doublehit` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `doubleslap` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `endeavor` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `playrough` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `strength` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `hammerarm` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `icehammer` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `skyuppercut` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `meteormash` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `shadowpunch` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `ragefist` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `focuspunch` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `drainpunch` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `dynamicpunch` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `cometpunch` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `megapunch` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `poweruppunch` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `dizzypunch` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `needlearm` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `rocksmash` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `hornleech` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `absorb` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `megadrain` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `gigadrain` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `bitterblade` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `leechlife` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `extremespeed` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `suckerpunch` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `astonish` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `rollout` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `accelerock` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `bulletpunch` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `wickedblow` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `vacuumwave` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `jetpunch` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `assist` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `mirrormove` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `naturepower` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `copycat` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `megahorn` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `firepunch` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `icepunch` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `thunderpunch` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `poisonfang` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `psychicfangs` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `icefang` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `firefang` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `thunderfang` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `wildcharge` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `spark` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `zapcannon` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `armorcannon` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `torchsong` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `chloroblast` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `hyperbeam` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `shelltrap` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `spinout` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `matchagotcha` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `flamecharge` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `flareblitz` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `burnup` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `beakblast` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `vcreate` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `outrage` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `ragingfury` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `boltstrike` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `fusionflare` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `fusionbolt` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `zenheadbutt` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `fakeout` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `covet` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `feint` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `thief` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `shadowsneak` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `feintattack` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `struggle` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `tickle` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `earthpower` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `drillrun` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `poisongas` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `smog` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `clearsmog` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `bonemerang` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `boneclub` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `shadowbone` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `whirlwind` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `hurricane` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `springtidestorm` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `wildboltstorm` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `sandsearstorm` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `ominouswind` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `magmastorm` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `firespin` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `leaftornado` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `roar` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `round` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `yawn` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `sing` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `perishsong` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `partingshot` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `nobleroar` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `disarmingvoice` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `growl` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `screech` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `snore` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `synchronoise` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `sonicboom` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `eerieimpulse` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `supersonic` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `confide` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `defog` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `grasswhistle` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `hypervoice` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `boomburst` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `heatwave` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `snarl` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `thunder` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `thundercage` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `meanlook` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `nightshade` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `fairylock` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `rockblast` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `geargrind` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `iciclespear` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `tailslap` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `furyswipes` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `furyattack` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `bulletseed` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `spikecannon` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `twineedle` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `razorshell` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `aquastep` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `aquacutter` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `wavecrash` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `crabhammer` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `aquajet` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `iceshard` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `watershuriken` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `freezingglare` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `freezedry` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `icywind` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `ancientpower` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `powergem` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `chargebeam` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `psybeam` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `twinbeam` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `toxic` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `spicyextract` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `sludge` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `sludgewave` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `smokescreen` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `sludgebomb` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `syrupbomb` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `mudbomb` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `magnetbomb` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `seedbomb` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `willowisp` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `confuseray` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `lovelykiss` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `rockwrecker` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `stoneedge` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `avalanche` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `triplearrows` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `thousandarrows` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `thousandwaves` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `iciclecrash` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `spore` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `judgment` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `psystrike` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `hex` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `infernalparade` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `darkpulse` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `fierywrath` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `terrainpulse` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `naturesmadness` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `ruination` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `electroball` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `moonblast` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `mistball` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `present` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `iceball` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `flowertrick` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `healingwish` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `stealthrock` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `gmaxsteelsurge` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `spikes` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `toxicspikes` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `stickyweb` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `leechseed` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `mysticalpower` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `psyshock` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `barbbarrage` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `esperwing` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `sandtomb` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `saltcure` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `flashcannon` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `lusterpurge` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `grassknot` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `aeroblast` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `aircutter` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `dracometeor` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `makeitrain` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `brine` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `octazooka` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `waterpledge` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `soak` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `watersport` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `scald` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `steameruption` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `waterpulse` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `bubblebeam` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `muddywater` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `mudshot` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `lavaplume` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `dragonenergy` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `waterspout` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `solarbeam` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `electroshot` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `solarblade` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `lightofruin` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `meteorbeam` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `blizzard` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `sheercold` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `glaciallance` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `freezeshock` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `iceburn` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `razorwind` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `overheat` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `sacredfire` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `blueflare` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `electroweb` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `fling` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `worryseed` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `rockthrow` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `paraboliccharge` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `drainingkiss` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `oblivionwing` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `signalbeam` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `simplebeam` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `triattack` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `tripleaxel` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `hypnosis` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `darkvoid` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `roaroftime` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `spacialrend` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `sacredsword` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `secretsword` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `psychocut` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `precipiceblades` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `originpulse` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `dragonascent` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `diamondstorm` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `dazzlinggleam` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `mistyexplosion` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `payday` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `leafstorm` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `petaldance` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `petalblizzard` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `magicalleaf` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `leafage` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `gunkshot` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `hyperspacehole` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `hyperspacefury` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `poisonjab` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `psychoboost` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `bestow` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `finalgambit` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `forestscurse` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `trickortreat` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `healpulse` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `spite` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `lockon` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `mindreader` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `memento` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `spiritshackle` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `brutalswing` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `revelationdance` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `prismaticlaser` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `firstimpression` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `shoreup` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `firelash` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `powertrip` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `smartstrike` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `spotlight` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `anchorshot` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `clangingscales` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `spectralthief` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `plasmafists` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `collisioncourse` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `electrodrift` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `sunsteelstrike` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `moongeistbeam` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `astralbarrage` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `photongeyser` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `coreenforcer` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `stokedsparksurfer` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `supercellslam` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `psychicnoise` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `fishiousrend` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `stompingtantrum` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `temperflare` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `terastarstorm` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `thunderclap` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `mightycleave` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `spiritbreak` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `stoneaxe` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `malignantchain` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `hardpress` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `dragoncheer` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `upperhand` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `revivalblessing` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `blazingtorque` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `combattorque` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `magicaltorque` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `noxioustorque` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `wickedtorque` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `tachyoncutter` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `ficklebeam` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `ficklebeamallout` | priority: P1 | source: BattleMoveAnims | adapter: pending | notes:

## P2

### BattleOtherAnims

- [ ] `shiny` | priority: P2 | source: BattleOtherAnims | adapter: pending | notes:
- [ ] `flight` | priority: P2 | source: BattleOtherAnims | adapter: pending | notes:
- [ ] `dance` | priority: P2 | source: BattleOtherAnims | adapter: pending | notes:
- [ ] `gravity` | priority: P2 | source: BattleOtherAnims | adapter: pending | notes:
- [ ] `futuresighthit` | priority: P2 | source: BattleOtherAnims | adapter: pending | notes:
- [ ] `doomdesirehit` | priority: P2 | source: BattleOtherAnims | adapter: pending | notes:
- [ ] `itemoff` | priority: P2 | source: BattleOtherAnims | adapter: pending | notes:
- [ ] `anger` | priority: P2 | source: BattleOtherAnims | adapter: pending | notes:
- [ ] `bidecharge` | priority: P2 | source: BattleOtherAnims | adapter: pending | notes:
- [ ] `bideunleash` | priority: P2 | source: BattleOtherAnims | adapter: pending | notes:
- [ ] `spectralthiefboost` | priority: P2 | source: BattleOtherAnims | adapter: pending | notes:
- [ ] `schoolingin` | priority: P2 | source: BattleOtherAnims | adapter: pending | notes:
- [ ] `schoolingout` | priority: P2 | source: BattleOtherAnims | adapter: pending | notes:
- [ ] `megaevo` | priority: P2 | source: BattleOtherAnims | adapter: pending | notes:
- [ ] `powerconstruct` | priority: P2 | source: BattleOtherAnims | adapter: pending | notes:

### BattleMoveAnims

- [ ] `taunt` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `instruct` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `quash` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `swagger` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `quiverdance` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `victorydance` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `agility` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `doubleteam` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `metronome` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `teeterdance` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `splash` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `encore` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `attract` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `raindance` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `sunnyday` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `hail` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `snowscape` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `chillyreception` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `sandstorm` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `gravity` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `trickroom` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `magicroom` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `wonderroom` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `babydolleyes` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `faketears` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `tearfullook` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `featherdance` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `followme` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `foresight` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `mimic` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `sketch` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `doodle` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `odorsleuth` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `celebrate` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `playnice` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `tailwhip` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `leer` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `kinesis` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `electricterrain` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `grassyterrain` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `mistyterrain` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `lifedew` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `junglehealing` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `topsyturvy` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `embargo` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `healblock` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `flash` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `tailwind` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `auroraveil` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `reflect` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `safeguard` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `lightscreen` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `mist` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `bellydrum` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `aromatherapy` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `healbell` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `detect` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `kingsshield` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `spikyshield` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `burningbulwark` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `banefulbunker` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `craftyshield` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `matblock` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `quickguard` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `wideguard` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `endure` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `focusenergy` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `rockpolish` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `harden` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `defensecurl` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `irondefense` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `howl` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `acupressure` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `curse` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `autotomize` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `shiftgear` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `bulkup` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `shellsmash` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `stockpile` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `swallow` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `ingrain` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `aquaring` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `coil` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `conversion` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `powertrick` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `ragepowder` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `refresh` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `recycle` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `teleport` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `cottonguard` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `defendorder` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `meditate` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `sharpen` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `withdraw` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `roost` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `softboiled` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `milkdrink` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `happyhour` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `snatch` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `acidarmor` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `barrier` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `morningsun` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `moonlight` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `lunarblessing` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `cosmicpower` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `charge` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `luckychant` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `geomancy` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `magnetrise` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `substitute` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `batonpass` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `calmmind` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `nastyplot` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `minimize` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `growth` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `tailglow` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `takeheart` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `trick` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `switcheroo` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `skillswap` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `sleeptalk` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `wish` | priority: P2 | source: BattleMoveAnims | adapter: pending | notes:

## P3

### BattleOtherAnims

- [ ] `primalalpha` | priority: P3 | source: BattleOtherAnims | adapter: pending | notes:
- [ ] `primalomega` | priority: P3 | source: BattleOtherAnims | adapter: pending | notes:
- [ ] `zpower` | priority: P3 | source: BattleOtherAnims | adapter: pending | notes:
- [ ] `ultraburst` | priority: P3 | source: BattleOtherAnims | adapter: pending | notes:

### BattleMoveAnims

- [ ] `gigavolthavoc` | priority: P3 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `infernooverdrive` | priority: P3 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `alloutpummeling` | priority: P3 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `supersonicskystrike` | priority: P3 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `aciddownpour` | priority: P3 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `blackholeeclipse` | priority: P3 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `continentalcrush` | priority: P3 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `neverendingnightmare` | priority: P3 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `corkscrewcrash` | priority: P3 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `twinkletackle` | priority: P3 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `pulverizingpancake` | priority: P3 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `catastropika` | priority: P3 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `sinisterarrowraid` | priority: P3 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `oceanicoperetta` | priority: P3 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `extremeevoboost` | priority: P3 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `guardianofalola` | priority: P3 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `splinteredstormshards` | priority: P3 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `letssnuggleforever` | priority: P3 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `clangoroussoulblaze` | priority: P3 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `soulstealing7starstrike` | priority: P3 | source: BattleMoveAnims | adapter: pending | notes:
- [ ] `searingsunrazesmash` | priority: P3 | source: BattleMoveAnims | adapter: pending | notes:

