# Battle V4 Team Generator Architecture Plan

## Summary

队伍生成器负责“训练师带什么牌”，AI 决策器负责“当前这些牌怎么打”。这两个系统必须解耦：

- 队伍生成器关心物种池、队伍风格、规则世代、模式、携带物和 V2 本地队伍模型。
- AI 决策器只读取战斗 request/snapshot，在当前牌局里选择合法指令。

第一版队伍生成器已经以函数式预览接入，不接训练配置页、不替换正式 NPC 队伍、不写入 run。它复用 Pokemon Showdown vendor 的随机队伍生成器，再叠加 V2 需要的过滤、风格倾向、diagnostics 和 `LocalTeamV4` adapter。

长期方向不是完全手写一套配招器，而是分层：

```txt
TeamGenerationInput
-> FormatResolver               规则/模式映射 Showdown format
-> SpeciesPoolFilter            宝可梦物种池硬过滤
-> ArchetypeScorer              队伍类型软评分
-> ShowdownRandomGenerator      复用 Showdown 随机 set 和配招逻辑
-> CandidateSelector            多次尝试选最高分队伍
-> V2LocalTeamAdapter           转换到 LocalTeamV4
-> Diagnostics                  输出过滤、评分、转换问题
```

## Why This Architecture

- Showdown 已经维护了大量随机队伍 set、招式、特性、道具和世代规则。直接复用它可以避免我们重复维护基础配招数据。
- V2 需要的是“可控的生成入口”，不是把 Showdown random 原样塞进正式游戏。所以过滤、队伍类型和 V2 adapter 放在我们自己的层。
- 宝可梦队伍构筑属于长期可迭代系统。天气队、空间队、毒守队、撒钉队、接力队不应该写进 AI 决策核心，而应该写在队伍生成器里。
- 第一版用软评分比硬模板更稳：Showdown 随机生成有兼容性规则，硬收窄池子容易凑不满队伍。软评分可以先稳定产出，后续再逐步升级为模板约束。
- 所有结果都有 diagnostics，方便后续看生成质量，而不是靠肉眼猜为什么生成了某队。

## Core API

核心函数在 `@changebattle-v2/showdown-battle-core/teamGenerator`，这是 **Node/backend-only** 能力。前端可以 import 类型和 API facade，但不能在浏览器启动路径静态加载 Showdown vendor；真实生成时按需动态加载 vendor。

```ts
type ShowdownTeamArchetypeV4 =
  | "balanced"
  | "rain"
  | "sun"
  | "sand"
  | "snow"
  | "trick-room"
  | "tailwind"
  | "terrain"
  | "hazard-stack"
  | "poison-stall"
  | "baton-pass"
  | "setup-offense";

type ShowdownPokemonFilterV4 = {
  speciesIds?: string[];
  excludedSpeciesIds?: string[];
};

type ShowdownRandomTeamGeneratorInputV4 = {
  ruleSet?: "standard" | "gen7" | "gen8" | "gen9";
  mode?: "singles" | "doubles" | "coop";
  seed?: string | number | number[];
  teamSize?: number;
  playerId?: "p1" | "p2" | "p3" | "p4";
  localTeamName?: string;
  pokemonFilter?: string[] | ShowdownPokemonFilterV4;
  teamArchetype?: ShowdownTeamArchetypeV4;
  archetypeAttempts?: number;
  strictArchetype?: boolean;
};
```

输出：

```ts
type ShowdownRandomTeamGeneratorResultV4 = {
  formatId: string | null;
  pokemonSets: PokemonSet[];
  packedTeam: string;
  exportedTeam: string;
  diagnostics: {
    ok: boolean;
    requestedRuleSet: TrainingRuleSetV4;
    resolvedRuleSet: "gen7" | "gen8" | "gen9";
    requestedMode: TrainingModeV4;
    formatId: string | null;
    seed: number[] | null;
    teamSize: number | null;
    pokemonFilter: {
      requestedSpeciesIds: string[];
      excludedSpeciesIds: string[];
      matchedSpeciesIds: string[];
    } | null;
    archetype: {
      id: ShowdownTeamArchetypeV4;
      attempts: number;
      bestScore: number;
      matchedPoolSize: number;
    } | null;
    messages: string[];
    elapsedMs: number;
  };
};
```

API 层额外暴露：

```ts
generateRandomBattleTeamPreviewV4(input): Promise<RandomBattleTeamPreviewResultV4>
convertShowdownSetToLocalPokemonV4(set, index)
convertShowdownTeamToLocalTeamV4(...)
```

API 层只做预览和转换，不自动写入 run。

## Format Resolver

第一版格式映射：

- `standard` 默认按 `gen9` 处理。
- `gen9 + singles` -> `[Gen 9] Random Battle`
- `gen9 + doubles` -> `[Gen 9] Random Doubles Battle`
- `gen9 + coop` -> `[Gen 9] Multi Random Battle`
- `gen8 + singles` -> `[Gen 8] Random Battle`
- `gen8 + doubles` -> `[Gen 8] Random Doubles Battle`
- `gen8 + coop` -> `[Gen 8] Multi Random Battle`
- `gen7 + singles` -> `[Gen 7] Random Battle`
- `gen7 + doubles/coop` 当前 vendor 没有可直接使用的 random doubles/multi 生成格式，返回明确 diagnostics，不静默降级。

后续如果确认 Gen7 doubles 有稳定随机格式或自定义可行，再补映射。

## Species Pool Filter

`pokemonFilter` 是硬过滤，适合 NPC 签名池、地区池、稀有度池、剧情限制池：

```ts
pokemonFilter: ["pelipper", "barraskewda", "dragonite"]
```

或：

```ts
pokemonFilter: {
  speciesIds: ["pelipper", "barraskewda"],
  excludedSpeciesIds: ["pikachu"],
}
```

实现策略：

- 读取 Showdown generator 内部 `randomSets / randomDoublesSets / randomMegaSets` 等 set 表。
- 按 `speciesIds` 收窄可生成物种。
- 按 `excludedSpeciesIds` 排除物种。
- diagnostics 记录 `requestedSpeciesIds / excludedSpeciesIds / matchedSpeciesIds`。

如果过滤池太小，Showdown 可能因为兼容性规则生成不满队伍。正式接 NPC 前需要为每个 NPC 池做 fixture，避免剧情队伍池过窄。

## Archetype Scoring

`teamArchetype` 表示常见队伍类型。第一版支持：

- `balanced`：平衡随机队。
- `rain`：雨天队，关注 `Drizzle / Swift Swim / Rain Dance / Hurricane / Thunder`。
- `sun`：晴天队，关注 `Drought / Chlorophyll / Solar Power / Protosynthesis / Sunny Day`。
- `sand`：沙暴队，关注 `Sand Stream / Sand Rush / Sand Force / Sandstorm`。
- `snow`：雪天队，关注 `Snow Warning / Slush Rush / Aurora Veil / Blizzard`。
- `trick-room`：空间队，关注 `Trick Room` 和 bulky/wallbreaker role。
- `tailwind`：顺风队，关注 `Tailwind` 和 fast role。
- `terrain`：场地队，关注四大场地特性和场地相关招式。
- `hazard-stack`：撒钉队，关注 `Stealth Rock / Spikes / Toxic Spikes / Sticky Web` 等。
- `poison-stall`：毒守队，关注 `Toxic / Toxic Spikes / Protect / Recover / Regenerator` 等。
- `baton-pass`：接力队，关注 `Baton Pass` 和强化/替身。
- `setup-offense`：强化攻，关注 `Swords Dance / Nasty Plot / Dragon Dance / Shell Smash` 等。

默认策略是软评分：

```txt
生成候选队伍 N 次
-> 每队按 archetype signal 打分
-> 取 bestScore 最高的一队
```

这样不会因为某类队伍池过小导致直接失败。

`strictArchetype=true` 是调试模式，会把候选池硬收窄到匹配该 archetype 的随机 set。它更像未来模板系统，但第一版不建议正式使用，因为可能凑不满队伍。

## Future Template System

软评分只是第一阶段。长期要把常见队伍类型升级成模板约束：

```txt
TeamTemplate
  requiredRoles:
    - weatherSetter
    - weatherAbuser
    - speedControl
  optionalRoles:
    - hazardSetter
    - wallbreaker
    - cleaner
  constraints:
    - minSynergyScore
    - maxSharedWeakness
    - noDuplicateBaseSpecies
```

例子：

- 雨天队：至少 1 个雨天手，至少 1 个雨天受益手，优先水/电/飞行输出。
- 晴天队：至少 1 个晴天手，至少 1 个叶绿素/古代活性受益手。
- 空间队：至少 1 个空间手，至少 2 个慢速打手，避免全队高速。
- 毒守队：至少 1 个下毒/毒菱手，至少 1 个回复/守住核心。
- 撒钉队：至少 1 个 hazard setter，最好有 spinblocker/清场手。
- 接力队：至少 1 个 Baton Pass 手，至少 1 个强化来源和接收手。

模板系统仍然可以复用 Showdown set，只是多一层角色选择和约束满足。

## V2 LocalTeam Adapter

Adapter 负责把 Showdown `PokemonSet` 转成 V2 `LocalTeamV4`：

- species、move、ability、item 统一通过 dex-core 查询。
- 查不到的字段写入 `adapterDiagnostics`，并用 Showdown 原始值保底。
- moves 补齐 `TrainingMoveSlotV4`：中文名、属性、分类、威力、命中、PP。
- HP 通过 `dex.calculatePokemonStats` 计算，`entryHp=maxHp`。
- sprite/icon 从 `DexPokemonDetail.sprites` 注入。
- held item 第一版只写 `pokemon.itemId`。
- 不创建 `PlayerItemInstanceV4`。
- 不绑定 `heldItemInstanceId`。

正式接入 run 前，必须补“携带物到背包实例”的同步步骤，否则会绕过背包生命周期。

## Integration Boundaries

当前已接：

- battle-core 纯函数生成器。
- API 预览函数。
- V2 adapter。
- core smoke 测试。
- typecheck。

当前不接：

- 不接训练配置页按钮。
- 不替换正式 NPC 队伍。
- 不写入 runGame。
- 不创建背包实例。
- 不处理系统战斗道具生命周期。
- 不做馆主/四天王/冠军构筑分组。

## Future Integration Plan

建议接入顺序：

1. 开发预览入口
   - 输入 `ruleSet/mode/seed/pokemonFilter/teamArchetype`。
   - 展示 exported team、packed team、V2 localTeam 和 diagnostics。

2. NPC 队伍生成配置
   - NPC 定义 `speciesPool / archetype / aiProfile / difficultyTier`。
   - 馆主可以强绑定属性或风格。
   - 四天王/冠军可以使用更大物种池和更高 archetypeAttempts。

3. 背包实例同步
   - 将 Showdown item 转成 `PlayerItemInstanceV4`。
   - 写入 `heldItemInstanceId`。
   - 系统战斗道具继续走 V2 通用 Mega/Z/太晶流程，不让 Showdown 原始特殊物品绕过背包规则。

4. 模板约束升级
   - 将 `teamArchetype` 从软评分升级为可选模板。
   - 增加关键角色保障和弱点控制。

5. 正式替换部分 NPC 队伍
   - 先替换非剧情/测试 NPC。
   - 保留固定手工队伍入口，用于剧情 Boss 或教学关。

## Debug And Tuning

每次生成要看 diagnostics：

- `formatId` 是否符合预期。
- `seed` 是否稳定。
- `pokemonFilter.matchedSpeciesIds` 是否覆盖目标池。
- `archetype.bestScore` 是否足够高。
- `archetype.matchedPoolSize` 是否过小。
- `messages` 是否提示池子太窄或格式不可用。
- `adapterDiagnostics` 是否出现 missing species/move/ability/item。

调参入口：

- 新增 archetype：扩展 `ShowdownTeamArchetypeV4` 和 `scoreSignalsForArchetype`。
- 调整风格倾向：改对应招式/特性/role 的分数。
- 提高生成质量：增大 `archetypeAttempts`。
- 限制 NPC 主题：配置 `pokemonFilter`。
- 严格风格实验：开启 `strictArchetype` 并观察生成失败率。

## Testing Strategy

队伍生成器测试不需要打开页面，也不需要启动 battle：

```txt
generateShowdownRandomTeamV4(input)
-> assert pokemonSets / packedTeam / exportedTeam / diagnostics
```

必要 fixture：

- 相同 `ruleSet/mode/seed` 结果稳定。
- 默认生成非空，通常 6 只。
- Gen9 singles/doubles/coop、Gen8 singles/doubles/coop、Gen7 singles。
- Gen7 doubles/coop 返回明确 unavailable diagnostics。
- `pokemonFilter` 不漏出池外物种。
- `excludedSpeciesIds` 不出现在结果里。
- `teamArchetype` 有评分和 diagnostics。
- `strictArchetype` 不作为默认正式路径，但要有失败 diagnostics。
- Adapter 能生成 `LocalTeamV4`，moves/HP/sprite/icon/itemId 字段齐全。

已验证命令：

- `pnpm --dir changeBattleV2 --filter @changebattle-v2/showdown-battle-core test`
- `pnpm --dir changeBattleV2 --filter @changebattle-v2/api typecheck`
- `pnpm --dir changeBattleV2 typecheck`

## Non-Goals

- 第一版不训练模型。
- 第一版不手写完整配招器。
- 第一版不替换正式 NPC。
- 第一版不接 UI。
- 第一版不写 run。
- 第一版不处理背包实例和系统战斗道具生命周期。
