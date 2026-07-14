# Battle V4 AI 战术架构与扩展计划

## Summary

Battle V4 AI 不能只靠“招式伤害评分”解决。单打中真实威力、属性克制、STAB、KO 权重可以避免明显错误；但双打、合作、馆主战和冠军战需要 AI 理解队伍优势、识别常见战术、根据局势执行或反制。

本计划把 `packages/showdown-battle-core` 中的 AI 拆成专门子系统：保留 Showdown request/validator 作为合法指令边界，新增可解释的 AI Brain 与战术模块体系。目标是让 AI 的每次选择都能回答三件事：

- 我的队伍优势是什么。
- 当前局势应该推进自己的战术，还是反制对手。
- 为什么这个合法 choice 是当前最合理的指令。

## Core Principles

- Showdown 仍是规则真相：choice 格式、target suffix、特殊系统、合法性全部继续经过 `showdownCommand` normalizer/validator。
- AI 不直接绕过规则提交命令；所有候选先生成，再评分，最后仍用 validator 过滤。
- 伤害 evaluator 只负责单个行动的战斗收益，不承载全部战术逻辑。
- 战术逻辑必须模块化，每个模块负责一种可解释战术意识，例如天气、空间、威吓轮转、Fake Out、保护、队友误伤。
- 模型学习只学习权重，不学习规则本身；线上运行固定模型，保证可复现、可调试。
- Debug 输出必须能解释候选 choice 的分数来源，不能只给最终分数。

## Dex Evaluation Tag Model

AI 决策的底层事实不应该直接写成“这个技能该不该点”。所有招式、特性、天气、场地、异常、空间等都先进入 `showdown-dex-core` 的评估标签系统，输出稳定的事实标签。AI 是这些标签的消费者，不是标签定义者。

后续实现采用三张表：

1. `DexEvalTag`：原子标签表，描述输出、风险、效果、状态、天气、场地等事实。
2. `DexEvalTagGroup`：标签组表，把一个招式、异常、天气、特性、道具等入口对象关联到多个 tag。
3. `DexEvalTagLink`：关系表，描述 tag 到 tagGroup 的关联语义，并控制递归展开。

这个结构保留“tag 表 + tagGroup 表”的简单维护方式，同时用 link 表解决两个关键问题：

- 关系语义：关联到底是造成、依赖、克制、风险、协同、阻断，不能只靠数组猜。
- 循环控制：天气、场地、特性、道具之间会互相引用，展开 helper 必须能防止死循环。

### Tag Table

`DexEvalTag` 是最小事实单元，不直接代表 AI 分数。

```ts
type DexEvalTagKindV4 =
  | "output"
  | "risk"
  | "effect"
  | "state"
  | "status"
  | "weather"
  | "terrain"
  | "room"
  | "side-condition"
  | "ability"
  | "item"
  | "mechanic"
  | "meta";

type DexEvalTagV4 = {
  id: string;
  kind: DexEvalTagKindV4;
  label: string;
  description: string;
  severity?: "low" | "medium" | "high" | "critical";
};
```

输出评价、风险评价、关联入口都使用 tag 表表达：

```ts
export const DexEvalTagsV4: Record<string, DexEvalTagV4> = {
  "output:none": {id: "output:none", kind: "output", label: "无伤害", description: "不会造成直接伤害"},
  "output:low": {id: "output:low", kind: "output", label: "低伤害", description: "直接伤害偏低"},
  "output:medium": {id: "output:medium", kind: "output", label: "中等伤害", description: "直接伤害中等"},
  "output:high": {id: "output:high", kind: "output", label: "高伤害", description: "直接伤害较高"},
  "output:very-high": {id: "output:very-high", kind: "output", label: "超高伤害", description: "直接伤害极高"},

  "risk:low-accuracy": {id: "risk:low-accuracy", kind: "risk", label: "命中低", description: "命中率存在明显风险"},
  "risk:charge-turn": {id: "risk:charge-turn", kind: "risk", label: "需要蓄力", description: "通常需要一回合准备"},
  "risk:recharge-turn": {id: "risk:recharge-turn", kind: "risk", label: "下回合不能动", description: "使用后需要恢复"},
  "risk:self-lock": {id: "risk:self-lock", kind: "risk", label: "锁招", description: "会限制后续选择"},
  "risk:self-confuse": {id: "risk:self-confuse", kind: "risk", label: "自身混乱", description: "使用后可能让自己混乱"},
  "risk:type-immunity-normal": {id: "risk:type-immunity-normal", kind: "risk", label: "一般属性无效风险", description: "对幽灵属性目标无效"},

  "effect:inflict-status:brn": {id: "effect:inflict-status:brn", kind: "effect", label: "施加烧伤", description: "尝试让目标进入烧伤状态"},
  "effect:stat-drop:spd": {id: "effect:stat-drop:spd", kind: "effect", label: "降低特防", description: "降低目标特防等级"},
  "effect:set-weather:rain": {id: "effect:set-weather:rain", kind: "effect", label: "设置雨天", description: "让天气变为雨天"},
};
```

### Tag Group Table

`DexEvalTagGroup` 是入口对象。招式、异常、天气、场地、空间、特性、道具都可以有自己的 group。

```ts
type DexEvalTagGroupKindV4 =
  | "move"
  | "status"
  | "weather"
  | "terrain"
  | "room"
  | "side-condition"
  | "ability"
  | "item"
  | "mechanic";

type DexEvalTagGroupV4 = {
  id: string;
  kind: DexEvalTagGroupKindV4;
  label: string;
  tagIds: string[];
};
```

示例：

```ts
export const DexEvalTagGroupsV4: Record<string, DexEvalTagGroupV4> = {
  "move:willowisp": {
    id: "move:willowisp",
    kind: "move",
    label: "鬼火",
    tagIds: ["output:none", "risk:low-accuracy", "effect:inflict-status:brn"],
  },
  "move:acid": {
    id: "move:acid",
    kind: "move",
    label: "溶解液",
    tagIds: ["output:low", "effect:stat-drop:spd"],
  },
  "status:brn": {
    id: "status:brn",
    kind: "status",
    label: "烧伤",
    tagIds: ["status:brn", "effect:dot", "effect:physical-attack-cut"],
  },
};
```

### Tag Link Table

`DexEvalTagLink` 描述 tag 和 tagGroup 之间的关系。它不是简单引用，而是带语义的有向边。

```ts
type DexEvalTagRelationV4 =
  | "causes"
  | "depends-on"
  | "blocked-by"
  | "risky-against"
  | "synergy-with"
  | "countered-by"
  | "amplifies"
  | "reduces"
  | "reference";

type DexEvalTagLinkV4 = {
  fromTagId: string;
  toGroupId: string;
  relation: DexEvalTagRelationV4;
  direction: "forward" | "reference-only";
  maxDepth?: number;
  weight?: number;
  note?: string;
};
```

示例：

```ts
export const DexEvalTagLinksV4: DexEvalTagLinkV4[] = [
  {
    fromTagId: "effect:inflict-status:brn",
    toGroupId: "status:brn",
    relation: "causes",
    direction: "forward",
    maxDepth: 1,
  },
  {
    fromTagId: "status:brn",
    toGroupId: "ability:guts",
    relation: "risky-against",
    direction: "reference-only",
  },
  {
    fromTagId: "status:brn",
    toGroupId: "ability:marvelscale",
    relation: "risky-against",
    direction: "reference-only",
  },
  {
    fromTagId: "effect:set-weather:rain",
    toGroupId: "weather:rain",
    relation: "causes",
    direction: "forward",
    maxDepth: 1,
  },
];
```

### Resolve Rules

展开 tagGroup 时必须严格防止循环应用。

```ts
type DexEvalResolveOptionsV4 = {
  maxDepth?: number;
  includeRelations?: DexEvalTagRelationV4[];
  excludeRelations?: DexEvalTagRelationV4[];
};

type DexEvalResolvedTagPathV4 = {
  tagId: string;
  viaGroupId: string;
  relation?: DexEvalTagRelationV4;
  depth: number;
  path: string[];
};

type DexEvalResolvedGroupV4 = {
  rootGroupId: string;
  tags: DexEvalTagV4[];
  groups: DexEvalTagGroupV4[];
  links: DexEvalTagLinkV4[];
  paths: DexEvalResolvedTagPathV4[];
  diagnostics: {
    skippedCycles: string[];
    truncatedByDepth: string[];
    missingTags: string[];
    missingGroups: string[];
  };
};
```

硬规则：

- 默认 `maxDepth = 2`，不能无限展开。
- 每次展开维护 `visitedTagIds` 和 `visitedGroupIds`。
- 同一个 tag 多路径出现时合并，保留最短 path。
- `direction: "reference-only"` 只展示引用，不继续递归。
- `blocked-by`、`risky-against` 默认不继续展开，只作为风险引用。
- `causes`、`depends-on`、`synergy-with` 可以展开，但必须受 `maxDepth` 和 `visited` 限制。
- 展开结果必须带 diagnostics，方便排查循环、缺 tag、缺 group。

伪代码：

```ts
function resolveDexEvalTagGroupV4(groupId, options) {
  const visitedGroups = new Set();
  const visitedTags = new Set();

  function walkGroup(id, depth, path) {
    if (depth > maxDepth) return markTruncated(id);
    if (visitedGroups.has(id)) return markCycle(id);
    visitedGroups.add(id);

    for (const tagId of group(id).tagIds) {
      if (!visitedTags.has(tagId)) collectTag(tagId, depth, path);
      visitedTags.add(tagId);

      for (const link of linksFrom(tagId)) {
        if (link.direction !== "forward") collectReference(link);
        else if (relationAllowed(link.relation)) walkGroup(link.toGroupId, depth + 1, [...path, tagId]);
      }
    }
  }
}
```

### Dex Helpers

后续工作集中在 `packages/showdown-dex-core`：维护三张表，并提供 resolver/helper。

```ts
getDexEvalTagV4(tagId: string): DexEvalTagV4 | null;
getDexEvalTagGroupV4(groupId: string): DexEvalTagGroupV4 | null;
getDexEvalTagLinksFromV4(tagId: string): DexEvalTagLinkV4[];
resolveDexEvalTagGroupV4(groupId: string, options?: DexEvalResolveOptionsV4): DexEvalResolvedGroupV4;

evaluateMoveTagGroupV4(moveId: string): DexEvalResolvedGroupV4;
evaluateAbilityTagGroupV4(abilityId: string): DexEvalResolvedGroupV4;
evaluateWeatherTagGroupV4(weatherId: string): DexEvalResolvedGroupV4;
evaluateTerrainTagGroupV4(terrainId: string): DexEvalResolvedGroupV4;
evaluateStatusTagGroupV4(statusId: string): DexEvalResolvedGroupV4;
```

`showdown-battle-core` 的 AI 只读取 resolver 输出，再结合当前 battle state 解释价值。例如：

- `Will-O-Wisp` 的 move group 包含 `effect:inflict-status:brn`，通过 link 展开到 `status:brn`，再看到烧伤的稳定扣血、物攻减半、毅力风险、奇异鳞片风险。
- `Acid` 的 move group 包含低输出和降特防；是否值得点要看当前目标、队友是否有特攻手、是否需要越过 KO 线。
- `Screech / Charm` 只通过能力变化 tag 表达，不归为“控制敌方”；控制应该留给异常、行动限制、强制换人等。
- `Thunder Wave` 通过异常/控速 tag group 展开；是否值得点取决于目标速度线、免疫、精神场地、队伍计划。

## Target Architecture

建议在 `packages/showdown-battle-core/src/ai/` 下建立专门 AI 子系统：

```text
ai/
  index.ts
  aiBrain.ts
  aiTypes.ts
  aiFeatureExtractor.ts
  aiTeamPlan.ts
  aiSituation.ts
  aiCandidateGenerator.ts
  aiCandidateScorer.ts
  aiLearning.ts

  evaluators/
    moveDamageEvaluator.ts
    switchEvaluator.ts
    supportEvaluator.ts

  tactics/
    directKoTactic.ts
    targetPriorityTactic.ts
    friendlyFireTactic.ts
    protectTactic.ts
    fakeOutTactic.ts
    trickRoomTactic.ts
    tailwindTactic.ts
    weatherTactic.ts
    intimidatePivotTactic.ts
    redirectionTactic.ts
    setupTactic.ts
    antiSetupTactic.ts
    itemDisruptTactic.ts

  models/
    defaultWeights.ts
    gymLeaderWeights.ts
    championWeights.ts
```

现有 `src/ai.ts` 后续逐步变成薄入口：

```ts
export function chooseAiBattleChoiceV4(context) {
  const request = normalizeShowdownChoiceRequestV4(context.request);
  const brain = analyzeBattleAiBrainV4({snapshot, request, playerId, aiProfile});
  const candidates = generateLegalAiCandidatesV4({request, snapshot, playerId});
  const scored = scoreAiCandidatesV4({brain, candidates, model, context});
  return pickBestLegalChoiceV4({request, scored, fallback});
}
```

## AI Brain

AI Brain 是一回合决策前的局势理解结果，不直接提交 choice。

### Team Plan

`analyzeTeamPlanV4()` 负责识别己方队伍优势：

- 天气：rain、sun、sand、snow。
- 速度控制：Trick Room、Tailwind、Icy Wind、Electroweb、Thunder Wave。
- 轮转：Intimidate、Parting Shot、U-turn、Volt Switch、Regenerator。
- 保护与辅助：Protect、Wide Guard、Quick Guard、Follow Me、Rage Powder。
- 压制：Fake Out、Taunt、Encore、Spore、Will-O-Wisp。
- 强化：Swords Dance、Dragon Dance、Nasty Plot、Calm Mind、Shell Smash。
- 输出核心：高火力打手、天气打手、空间慢速打手、强化清场手。

输出示例：

```ts
type BattleAiTeamPlanV4 = {
  archetypes: Array<"rain" | "sun" | "sand" | "trick-room" | "tailwind" | "setup" | "pivot" | "balanced">;
  winConditions: string[];
  keyPokemon: string[];
  supportMoves: string[];
  riskNotes: string[];
};
```

### Situation

`analyzeBattleSituationV4()` 负责识别当前局势：

- 谁能立即 KO 谁。
- 哪个目标威胁最高。
- 当前天气、空间、顺风、场地对谁有利。
- 是否需要开、抢、拖、反制天气或空间。
- 当前 active 是否是核心，需要保护或换下。
- 双打里是否存在队友误伤风险。
- 对方是否可能开空间、强化、集火、保护、换人。

输出示例：

```ts
type BattleAiSituationV4 = {
  mode: "attack" | "setup-own-plan" | "deny-opponent-plan" | "protect-core" | "stall-field-turns" | "pivot";
  priorities: BattleAiTacticalPriorityV4[];
  activeThreats: BattleAiThreatV4[];
  fieldState: BattleAiFieldStateV4;
};
```

## Tactic Module Interface

每个战术模块只做两件事：识别机会、给候选加减分。模块不能生成非法 choice，也不能跳过 validator。

建议接口：

```ts
type BattleAiTacticModuleV4 = {
  id: string;
  applies(input: BattleAiTacticInputV4): boolean;
  score(input: BattleAiTacticInputV4): BattleAiTacticScoreV4;
};

type BattleAiTacticScoreV4 = {
  delta: number;
  features: Record<string, number>;
  reasons: string[];
};
```

候选总分：

```ts
finalScore =
  baseDamageScore
  + koScore
  + tacticDeltas
  + learnedWeightScore
  + trainerPersonalityBias
  - riskPenalty
```

每个模块必须提供测试 fixture，证明它在应该触发时触发，在不该触发时不触发。

## First Tactic Modules

### Direct KO

- 能稳定 KO 时大幅加分。
- 馆主级以上禁止明显低分招式盖过稳定 KO。
- 如果当前可直接收掉高威胁目标，不应点无关辅助。

### Target Priority

- 双打中优先击杀低血高威胁目标。
- 单体招式必须正确区分 `+1` / `+2`。
- 集火目标要结合威胁、血量、抗性和 KO 线。

### Friendly Fire

- `Earthquake`、`Surf`、`Discharge`、`Explosion` 等会打队友的招式必须扣分。
- 如果队友免疫、吸收或收益，例如 Flying/Levitate 免疫地震，扣分降低或转为加分。
- 如果队友会被范围招 KO，除非能赢下战斗，否则禁止高分。

### Weather

- 识别 Rain/Sun/Sand/Snow 队伍结构。
- 天气未启动且己方天气收益高时，提高开天气价值。
- 天气已对己方有利时，提高对应属性与能力打手价值。
- 对方天气收益更高时，考虑抢天气或拖天气。

### Trick Room

- 识别慢速队、空间手、空间打手。
- 我方慢速且攻击收益低时，提高开空间价值。
- 对方空间队将要启动时，提高 Taunt、Fake Out、集火空间手价值。
- 空间已开且对己方不利时，考虑 Protect、换人、拖回合。

### Tailwind / Speed Control

- 我方高速压制队提高 Tailwind 价值。
- 对方速度明显领先且我方无法直接 KO 时，提高速度控制价值。
- 已经能直接 KO 时，不让速度控制抢掉必杀。

### Protect / Wide Guard / Quick Guard

- 核心残血、被双集火风险高时 Protect 加分。
- 对方范围招威胁明显时 Wide Guard 加分。
- 对方先制威胁明显时 Quick Guard 加分。
- 不能在明显必杀局频繁点保护。

### Fake Out

- 首回合或刚上场时识别 Fake Out 可用性。
- 优先拍空间手、天气手、强化手、能 KO 我方核心的高威胁目标。
- 对 Ghost、Inner Focus、Covert Cloak 等风险扣分。

### Intimidate Pivot

以咆哮虎等威吓手为典型：

- 后排有威吓手且对方物攻威胁高时，提高换入威吓手价值。
- 威吓手在场时，提高 Fake Out、Parting Shot、Knock Off 等局势操作价值。
- 对特殊攻击手威吓收益低，不乱换。
- 对 Defiant、Competitive、Clear Body 等反威吓目标扣分。
- 换入后会被秒时扣分。

### Redirection

- Follow Me / Rage Powder 保护己方核心或空间手时加分。
- 对方有草系、防尘、防粉、范围招时降低 Rage Powder 价值。
- 如果核心已安全或可直接 KO，不让 redirection 抢掉强行动。

## Learning Model

学习系统不应直接替代战术模块。推荐路线：

1. 战术模块产出可解释 features。
2. 战斗日志记录每个候选 choice 的 features、score、selected、局势结果。
3. 离线训练权重。
4. 生成固定模型权重表。
5. 线上 AI 只加载固定权重，不在线改变行为。

候选日志建议：

```ts
type BattleAiDecisionTrainingRowV4 = {
  battleId: string;
  turn: number;
  playerId: string;
  aiLevel: string;
  trainerId?: string;
  teamPlan: BattleAiTeamPlanV4;
  situation: BattleAiSituationV4;
  candidates: Array<{
    choice: string;
    legal: boolean;
    selected: boolean;
    features: Record<string, number>;
    tacticReasons: string[];
    score: number;
  }>;
  outcome?: {
    hpSwing: number;
    koSwing: number;
    preservedWinCondition: boolean;
    wonBattle?: boolean;
  };
};
```

首版模型使用线性权重：

```ts
score = sum(feature * weight)
```

优点：

- 可解释。
- 可手调。
- 可离线训练。
- 可按 AI 等级和训练师性格切换。
- 不会绕过 Showdown validator。

## AI Level Behavior

- `rookie`：主要使用基础伤害和少量随机，允许明显失误。
- `normal`：使用伤害、克制、KO、基本目标选择。
- `elite`：启用天气、空间、保护、双打目标优先级。
- `gymLeader`：启用队伍流派识别和主要战术模块，减少明显失误。
- `eliteFour`：启用更多反制模块，例如 anti-setup、redirection、friendly fire。
- `champion`：启用完整战术模块、低随机、明显优势禁错、更多保核心和反制判断。

训练师性格通过权重偏置体现：

- offense：更重视 KO、压制、速度控制。
- defense：更重视保护、换人、回复、风险规避。
- support：更重视天气、空间、redirection、Fake Out、Wide Guard。
- balanced：权重均衡。

## Test Strategy

每个战术模块至少配一组正反 fixture：

- 正例：该战术应该触发，并让对应 choice 排在前列。
- 反例：局面不适合该战术时不能乱触发。
- 冲突例：直接 KO、保护核心、开空间等多个战术冲突时，优先级符合预期。

优先压测场景：

- 单打：明显弱点、免疫、稳定 KO、低命中高威力和稳定招式取舍。
- 双打：`+1/+2` 目标选择、范围招收益、队友误伤、集火残血高威胁。
- 天气：雨天水打手、晴天火打手、沙暴岩石/地面/钢收益、抢天气。
- 空间：己方慢速开空间、对方空间手反制、空间回合拖延。
- 威吓：换入威吓手、避免送 Defiant、Parting Shot 轮转。
- 保护：核心残血 Protect、Wide Guard 防范围、不能错过必杀。

## Rollout Plan

1. 保留当前 `chooseAiBattleChoiceV4` 行为，先增加 `ai/` 子系统并由旧入口调用。
2. 把当前伤害 evaluator 移入 `ai/evaluators/`。
3. 新增 `aiBrain`，先只输出 teamPlan/situation/debug，不改变选择。
4. 分批启用战术模块，每启用一批就加 fixture。
5. AI debug 中展示每个 tactic 的 delta 和 reason。
6. 稳定后增加 `aiLearning` 日志采集，但默认不影响线上行为。
7. 最后再引入离线权重训练产物。

## Non-Goals

- 不在本阶段做黑盒神经网络决策。
- 不让 AI 在线自学习并即时改变正式战斗行为。
- 不绕过 Showdown validator。
- 不追求一次覆盖全部宝可梦战术；优先建立可扩展架构。
- 不把所有战术硬塞进伤害 evaluator。

## Acceptance Criteria

- AI 代码从单一 `ai.ts` 收敛到可维护的 AI 子系统。
- 每个战术模块有明确输入、输出、debug reason 和测试 fixture。
- 常见双打基础战术能够被解释和压测。
- 馆主级以上不会因为随机噪声覆盖明显正确选择。
- 后续新增咆哮虎威吓轮转、空间队、雨天队等，只需要新增或调整战术模块，不需要重写主 AI。
