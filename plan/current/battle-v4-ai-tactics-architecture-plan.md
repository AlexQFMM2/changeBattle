# Battle V4 AI Minimax 实时算法开发清单

## 最终决定

- [x] 算法主线：Battle V4 AI 采用 **极小极大 / Minimax 实时搜索**。
- [x] 核心战力：持续完善 **估值函数 / Value Function**，让 AI 选择稳定收益而不是只追最高伤害。
- [x] 深度档位固定：单打/双打/合作采用 `2/1/1 -> 4/2/2 -> 6/3/3`，不再把继续变强的主方向放在加深搜索。
- [x] 优先保证前 1-3 步稳定性：第一步不犯低级错，第二步能看反制，第三步只做方向判断和资源规划。
- [x] 性能优化：当搜索深度或双打 joint action 超时时，再引入 **剪枝算法**。
- [x] 默认剪枝方向：优先考虑 **Alpha-Beta pruning**，同时保留 topK / maxNodes / time budget。
- [x] 不做实时出招模型训练。
- [x] 不让 LLM / 小模型直接决定 choice。
- [x] 不使用玩家历史操作训练读心模型。
- [x] 不做完整 Showdown 战斗模拟器替代。
- [x] Showdown request / validator 继续作为合法行动边界。
- [x] 当前 `aiMoveEvaluator` / NumericGuard 作为 depth 1 叶子评分基础。
- [x] Minimax 负责比较未来局面，不负责生成非法指令。

## 总流程

- [x] 输入：battle snapshot、Showdown request、双方队伍、AI profile。
- [x] 处理：合法行动枚举 -> 数值化局面 -> outcome 估算 -> Minimax 搜索 -> 局面评分。
- [x] 输出：选择最高分合法 choice。
- [x] 最终提交前仍经过 validator。
- [x] Debug 串起来第一版：`legalCandidates -> searchBudget -> principalVariation -> chosenAction`。

## 模式架构

- [x] 不写三套完整 AI；采用 **共享 AI 内核 + mode strategy**。
- [x] 共享内核：Minimax 搜索框架、估值函数组件、outcome bucket、team role analysis、debug、validator/fallback。
- [x] 单打 strategy：重点处理留场/换人、读换、撒场、保 win condition、天气/空间启动后的轮转。
- [x] 双打 strategy：重点处理 joint action、双点 KO、Protect/Fake Out、速度控制、ally combo、范围招和队友误伤。
- [x] 合作 strategy：复用双打基础，但估值函数额外强调不坑玩家、保护玩家核心、辅助玩家节奏。
- [x] 单打特点：选择少、战线长，适合更长视野和残局深搜。
- [x] 双打特点：分支宽、回合短，最快两回合结束，多数局不需要看到第六回合。
- [x] 合作特点：队伍规模为 2+2 vs 2+2，分支受限，但必须额外约束玩家体验。
- [x] 搜索预算原则：深度上限不继续膨胀，预算优先给候选质量、对手 reply 质量、估值函数和特殊系统资源判断。
- [x] `chooseAiBattleChoiceV4` 保持唯一外部入口，由 search engine 根据 battle mode 分发到对应 strategy。
- [ ] 后续拆分 `aiSinglesStrategyV4.ts`。
- [ ] 后续拆分 `aiDoublesStrategyV4.ts`。
- [ ] 后续拆分 `aiCoopStrategyV4.ts`。
- [x] 后续抽出 `aiValueFunctionV4.ts`。
- [ ] 后续抽出 `aiOutcomeBucketsV4.ts`。

## 0. 当前基础确认

- [x] 已有 `chooseAiBattleChoiceV4` 入口。
- [x] 已有合法 choice / fallback 框架。
- [x] 已有 AI profile、noise、mistake rate 框架。
- [x] 已有 `aiMoveEvaluator`。
- [x] 已能计算真实 move data。
- [x] 已能计算 type multiplier。
- [x] 已能计算 STAB。
- [x] 已能计算 accuracy。
- [x] 已能计算 damage range。
- [x] 已能计算 expected damage ratio。
- [x] 已能计算 KO chance。
- [x] 已有 Tyranitar vs Ceruledge 回归：馆主级以上不应点 Ice Beam。
- [x] 跑一次现有测试，确认当前 NumericGuard 基线稳定。

## 0.1 估伤模块替换方向

- [ ] 引入 Pokemon Showdown / Smogon damage-calc 作为 AI 估伤模块依据。
- [ ] 当前 `aiMoveEvaluator` 保留为 fallback。
- [ ] 新增 `aiDamageCalcAdapterV4.ts`，负责把 Battle V4 snapshot / request 转成 calc 所需的 `Pokemon` / `Move` / `Field`。
- [ ] `evaluateBattleAiMoveV4` 优先使用 calc adapter；构造失败时回退现有 heuristic。
- [ ] diagnostics 标记 `damageEngine: "smogon-calc" | "heuristic"`。
- [ ] 输出继续保持现有字段：`expectedDamageRange` / `expectedDamageRatio` / `typeMultiplier` / `stab` / `accuracy` / `koChance` / `diagnostics`。
- [ ] Gen 9 优先接入。
- [ ] 支持 singles / doubles damaging move。
- [ ] 支持当前 active target、explicit targetLoc、targetOverride。
- [ ] 支持 weather / terrain / spread / Protect / Dynamax / Terastallize 基础输入。
- [ ] 不在第一版接完整隐藏信息、完整回合模拟、完整状态推进。

## 1. 算法依据

- [x] 总架构明确为：`Minimax 搜索框架` + `估值函数` + `剪枝优化`。
- [x] 当前优先级：固定搜索深度档位，优先完善估值函数和候选宽度压缩，最后按性能需要加剪枝。
- [x] 高等级 AI 倾向稳定收益：考虑 worst-case / risk penalty，不盲目赌低概率高收益。
- [x] Battle V4 不追求围棋式长线深搜；宝可梦重点是宽度、资源、换人和前三步稳定性。
- [x] 单回合价值最高，双回合反制价值高，三回合以后仅作为趋势判断，四回合以上显著衰减。
- [x] 本地保存 PokéChamp 论文：`docs/reference/pokechamp-paper.pdf`。
- [x] 记录 PokéChamp 使用 minimax tree search 的思路。
- [x] 记录论文中的 one-step world model / damage estimator 思路。
- [x] 区分 PokéChamp minimax 论文和 FoulPlay / MCTS 报道。
- [x] Battle V4 第一版不实现 LLM action sampling。
- [x] Battle V4 第一版不实现 LLM opponent modeling。
- [x] Battle V4 第一版不实现 LLM value estimation。
- [x] Battle V4 采用本地规则算法实时计算。

## 2. Search Engine 骨架

- [x] 新增 `aiSearchEngineV4.ts`。
- [x] 新增 `chooseBattleAiActionBySearchV4(input)`。
- [x] 新增 `BattleAiSearchInputV4`。
- [x] 新增 `BattleAiSearchResultV4`。
- [ ] 新增 `BattleAiSearchNodeV4`。
- [x] 新增 `BattleAiSearchBudgetV4`。
- [x] 支持 depth 1 直接调用现有 NumericGuard scorer。
- [x] 支持 singles depth 2 进入 Minimax。
- [ ] 支持 alpha-beta pruning。
- [ ] 支持 iterative deepening。
- [x] 支持 hard time budget。
- [x] 超时返回当前已知 best legal action。
- [ ] 搜索异常返回 `fallbackLegalChoiceV4`。

## 3. AI 等级映射

- [x] AI 等级 = 理论搜索上限 + 能力模块解锁 + 风险容忍度。
- [x] AI 等级定义理论搜索上限，不代表所有 mode 都固定搜到同一 depth，也不代表所有等级都启用完整复杂搜索。
- [x] `rookie`：理论上限 depth 1。
- [x] `normal`：理论上限 depth 2。
- [x] `elite`：理论上限 depth 3。
- [x] `gymLeader`：理论上限 depth 4。
- [x] `eliteFour`：理论上限 depth 5。
- [x] `champion`：理论上限 depth 6。
- [x] 实现 mode-aware effective depth。
- [ ] 实现局面复杂度动态 depth。
- [ ] 减员/残局时在预算内提高 depth。
- [x] 所有等级共享 10s hard upper bound。
- [x] 低等级保留更高 noise。
- [x] 馆主级以上启用明显优势禁错。
- [x] 深度不足或超时时降级到当前最佳浅层结果。

## 3.1 AI Capability Unlock

- [x] `rookie`：即时判断 AI，不启用 Minimax，不启用 role analysis，不启用完整 outcome bucket，高 noise / 高 mistakeRate。
- [x] `rookie`：允许明显小错和简单贪伤害，避免低等级表现得像战术玩家。
- [x] `normal`：NumericGuard 为主，不启用完整 Minimax，只保留基础安全判断和较高随机性。
- [x] `normal`：可以选择高伤害/高收益行动，但不要求理解体系运营。
- [x] `elite`：轻量战术 AI，可启用 KO / 被 KO 风险判断，但不启用完整队伍体系和复杂轮换。
- [x] `elite`：换人只做残血保命或明显安全换人，不做深层读换。
- [x] `gymLeader`：开始启用完整 singles depth 2、role analysis、outcome bucket、基础轮换和天气/核心判断。
- [x] `eliteFour`：启用更完整 value function、mode-aware dynamic depth、更低 noise、更稳健风险权重。
- [x] `champion`：完整稳定收益策略，强调 worst-case / risk penalty，残局深搜，必要时进入剪枝优化。
- [x] 新增 `BattleAiCapabilityProfileV4`。
- [x] capability 控制 `useMinimax`。
- [x] capability 控制 `useRoleAnalysis`。
- [x] capability 控制 `useOutcomeBuckets`。
- [x] capability 控制 `useSwitchValue`。
- [ ] capability 控制 `useDynamicDepth`。
- [ ] capability 控制 `useOpponentSwitchReply`。
- [ ] capability 控制 `riskTolerance`。

## 3.2 Mode-Aware Search Budget

- [x] 单打：分支窄、战线长，优先允许更深搜索。
- [x] 单打 3v3：开局可按复杂度尝试中等深度，残局可接近 AI 等级上限。
- [x] 双打：分支宽、回合短，优先提高当前回合和下一回合 joint action 质量。
- [x] 双打 4v4：常规预算以 depth 2-3 为主，不默认追到第六回合。
- [x] 双打残局：减员后分支变窄，可动态提高 depth。
- [x] 合作：基于双打预算，但更重视玩家体验约束，不盲目深搜。
- [x] singles effective depth：馆主 2、四天王 4、冠军/反派头目 6。
- [x] doubles effective depth：馆主 1、四天王 2、冠军/反派头目 3。
- [x] coop effective depth：馆主 1、四天王 2、冠军/反派头目 3。
- [x] 上述 effective depth 作为正式档位，不再继续上调到 depth 8/10。
- [x] 单打 depth 6 是冠军/反派头目的上限，不要求所有局面强行搜满。
- [x] 双打/合作 depth 3 是高等级上限，重点放在 joint action 宽度压缩和队友协同。
- [x] 超时或复杂度过高时，优先返回当前 best-so-far，不为了搜满深度牺牲稳定性。
- [ ] singles dynamic depth：在 `min(levelMaxDepth, dynamicDepthFromComplexity)` 内随减员加深。
- [ ] doubles dynamic depth：开局默认不超过 2-3，残局再上调。
- [ ] coop dynamic depth：默认不超过 doubles，同时保留玩家体验约束。
- [ ] complexity 输入：legalActionCount / alivePokemonCount / switchOptionCount / activeCount / targetOptionCount。

## 3.3 前三步稳定性原则

- [x] 第一步稳定性优先：不能打免疫、不能送核心、不能低收益乱交极巨/太晶、不能放弃稳定 KO。
- [x] 第二步反制优先：重点看对方最强 reply、先制、速度线、换入承伤和我方安全换人。
- [x] 第三步只做趋势判断：判断能否形成收割、保住 win condition、极巨/太晶后续价值、天气/空间/顺风能否转化收益。
- [x] 三回合以后不作为主要决策依据，只保留低权重趋势信息，避免远期幻觉带偏当前选择。
- [x] 后续变强方向：候选生成更稳、对手回复更准、估值函数更懂资源、特殊系统不乱交、无效行动直接压死。
- [x] Alpha-Beta 定位为宽度/性能优化，不是为了追求更长搜索。

## 4. Budget 参数

- [x] 定义 `maxDepth`。
- [x] 定义 `maxMs`。
- [x] 定义 `ownTopK`。
- [x] 定义 `foeTopK`。
- [x] 定义 `maxNodes`。
- [x] 定义 `maxJointActions`。
- [ ] 定义 `maxAllyComboActions`。
- [x] Debug 输出 `searchedDepth`。
- [x] Debug 输出 `visitedNodes`。
- [x] Debug 输出 `elapsedMs`。
- [x] Debug 输出 `truncatedReason`。

## 5. Numeric State

- [x] 新增 singles 内部 `BattleAiNumericStateV4`。
- [x] 新增 singles 内部 `BattleAiNumericPokemonV4`。
- [x] 实现 singles 内部 `buildSinglesNumericState()`。
- [x] 读取双方 active。
- [x] 读取可见后排。
- [x] 读取 HP / maxHP。
- [ ] 读取 species / types。
- [ ] 读取 item。
- [ ] 读取 ability / baseAbility。
- [ ] 读取 status。
- [ ] 读取 boosts。
- [ ] 读取 stats。
- [ ] 缺失 stats 时用 dex baseStats + level 估算。
- [ ] diagnostics 标记 `estimatedStats`。
- [ ] 计算 effective speed。
- [ ] 计算 priority 前的速度线。
- [ ] 处理 Tailwind 速度修正。
- [ ] 处理 Trick Room 速度反转。
- [ ] 处理 paralysis 速度修正。
- [ ] 处理常见天气速度特性占位。
- [ ] 处理 Choice Scarf 占位。

## 5.1 Team Role Analysis

- [x] 新增 `aiTeamRoleAnalyzerV4.ts`。
- [x] 新增 `analyzeBattleAiTeamRolesV4(input)`。
- [x] 支持 `weather-setter` 标签。
- [x] 支持 `weather-abuser` 标签。
- [x] 支持 `terrain-setter` 标签。
- [x] 支持 `terrain-abuser` 标签。
- [x] 支持 `pivot` 标签。
- [x] 支持 `wall` 标签。
- [x] 支持 `physical-attacker` / `special-attacker` / `mixed-attacker` 标签。
- [x] 支持 `setup-sweeper` 标签。
- [x] 支持 `revenge-killer` 标签。
- [x] 支持 `hazard-setter` / `hazard-remover` 标签。
- [x] 支持 `status-spreader` 标签。
- [x] 支持 `priority-user` 标签。
- [x] 支持 `speed-control` 标签。
- [x] 支持 `trick-room-setter` 标签。
- [x] 根据天气 setter + abuser 汇总 team archetype。
- [x] 对齐正式赛队伍生成偏好：`rain` / `sun` / `sand` / `snow` / `trick-room` / `tailwind` / `terrain` / `hazard-stack` / `poison-stall` / `setup-offense` / `balanced`。
- [x] 根据场地 setter / abuser 汇总 `terrain` archetype。
- [x] 根据 Tailwind / 速度控制组件汇总 `tailwind` archetype。
- [x] 根据 Trick Room 组件汇总 `trick-room` archetype。
- [x] 根据多层撒场组件汇总 `hazard-stack` archetype。
- [x] 根据中毒 + 回复/Protect/消耗组件汇总 `poison-stall` archetype。
- [x] 根据强化手 + 进攻核心汇总 `setup-offense` archetype。
- [x] 无明显组件时回退 `balanced` archetype。
- [x] 根据角色标签汇总 setters / abusers / pivots / defensiveCore / winConditions。
- [x] 角色标签只用于 AI 内部评分和测试，不展示给玩家。

## 5.2 Doubles Team Generation

- [x] `mode: "doubles" | "coop"` 使用双打结构评分，不再只复用单打 archetype 裁剪。
- [x] 旧 `teamArchetype` 在双打下解释为双打版本：rain / sun / trick-room / tailwind / terrain / balanced。
- [x] strict doubles 4v4 要求 Protect 核心、速度控制、范围输出、utility control。
- [x] rain strict doubles 要求不同成员组成 rain setter + rain abuser 核心。
- [x] sun strict doubles 要求不同成员组成 sun setter + sun abuser 核心，并避免反向天气。
- [x] trick-room strict doubles 要求 Trick Room setter + Trick Room attacker。
- [x] tailwind strict doubles 要求 Tailwind setter + pressure。
- [x] balanced strict doubles 要求 goodstuff 基础结构，而不是随机单打队。
- [x] 新增 doubles diagnostics：Protect / speed control / spread / utility / Fake Out / redirection / weather / Trick Room / lead pair / antiSynergy。
- [x] 新增 recommended lead pairs，供后续 coop 两两分配 NPC 复用。
- [x] 双打/合作 4v4 子集选择优先核心完整、lead pair 高、Protect 多、反协同少。
- [x] 双打 move quality 提高 Protect / Fake Out / Tailwind / Trick Room / Icy Wind / Electroweb / Helping Hand / Follow Me / Rage Powder / Wide Guard / Taunt / Encore / Parting Shot / spread moves。
- [x] rookie / normal / elite 裁剪招式后重新计算 coreComplete，不假报完整。
- [x] `ai:teams` doubles 默认 teamSize 为 4，报告 summary 输出 doubles 平均指标。
- [x] 10 样本 strict doubles 报告：rain / sun / trick-room / tailwind / balanced 均为 `coreComplete=10/10`。
- [x] 10 样本 strict weather doubles 复查：rain / sun 均为 `coreComplete=10/10` 且包含 `*-distinct-core`。
- [x] `ai:selfplay --mode doubles` 支持双打出卷、答题、评估和 JSON / Markdown 报告。
- [x] doubles self-play 默认使用 4v4、strict、ai-exam、rain / sun / trick-room / tailwind / balanced。
- [x] doubles self-play 报告输出 doubles metrics、reason tags 和队伍结构 diagnostics。

## 5.3 Formal Team Generation Integration

- [x] 正式流程采用混合优先：先尝试 `generateShowdownRandomTeamV4`，失败时回退旧本地生成器。
- [x] NPC 强度映射到新生成器 `aiLevel` 与 `quality`：rookie 宽松，普通结构化，Gym / Elite4 / Champion / Boss 严格。
- [x] 玩家画像转换为 `playerProfileHints`，包括弱点类型、常用招式/效果、速度风格和体系倾向。
- [x] 正式偏好传入新生成器：battle mode、ruleSet、teamSize、allowed generations、legendary toggle 和 battle systems diagnostics。
- [x] 单地区 / 单世代限制保留，不再因少于 3 个世代回退默认池。
- [x] Boss / Villain 优先尝试 strict Showdown 结构化队伍，失败后回退 preset / local。
- [x] coop 敌方队伍复用 doubles / coop 结构评分，ally 分队后续再用 recommended lead pairs 优化。
- [x] diagnostics 输出生成路径、质量、AI 等级、规则、世代、神战开关、战斗系统、画像 hints 和 fallback 原因。
- [x] 正式 round / battle / settlement 链路支持 async，为新生成器和后续远端/重型生成留出空间。

## 6. 合法行动枚举

- [ ] 新增 `BattleAiSingleActionV4`。
- [ ] 新增 `BattleAiJointActionV4`。
- [ ] 实现 `generateLegalBattleAiSingleActionsV4()`。
- [ ] 实现 `generateLegalBattleAiJointActionsV4()`。
- [ ] 单打枚举 move。
- [ ] 单打枚举 switch。
- [ ] 双打枚举每个 active 的 move。
- [ ] 双打枚举每个 active 的 switch。
- [ ] 双打组合两个 active 的行动。
- [ ] 正确保留 targetLoc。
- [ ] 允许合法 ally target。
- [ ] 允许合法 self target。
- [ ] 排除 fainted target。
- [ ] 排除 request 不存在的 move。
- [ ] 排除 validator 不通过的 choice。
- [ ] joint action 最终能还原成 Showdown choice string。

## 7. 候选剪枝

- [x] 单个 active 先用 depth 1 scorer 排序。
- [x] 我方候选保留 `ownTopK`。
- [x] 对手候选保留 `foeTopK`。
- [ ] 双打先生成 per-active top actions。
- [ ] 双打再组合 joint actions。
- [ ] joint actions 按初评保留 `maxJointActions`。
- [ ] 明显 KO 候选强制保留。
- [ ] 明显保护保命候选强制保留。
- [ ] 明显控速候选强制保留。
- [ ] ally combo 候选单独保留少量名额。

## 8. One-Step Outcome Estimator

- [ ] 新增 `BattleAiActionOutcomeV4`。
- [ ] 实现 `estimateBattleAiActionOutcomeV4()`。
- [x] 复用现有 `evaluateBattleAiMoveV4()`。
- [x] 估算伤害范围。
- [x] 估算 expected damage。
- [x] 估算 KO chance。
- [ ] 估算命中风险。
- [ ] 估算 priority。
- [ ] 估算行动顺序。
- [x] 估算 switch 后承伤收益。
- [ ] 估算保护收益。
- [ ] 估算回复收益。
- [ ] 估算强化收益。
- [ ] 估算削弱收益。
- [ ] 估算异常收益。
- [ ] 估算天气变化。
- [ ] 估算场地变化。
- [ ] 估算 Trick Room 变化。
- [ ] 估算 Tailwind 变化。
- [ ] 未覆盖效果写 diagnostics。

## 9. 局面推进

- [ ] 新增 `applyBattleAiOutcomeToNumericStateV4()`。
- [x] singles depth 2 应用 HP delta。
- [x] singles depth 2 应用 fainted 状态。
- [x] singles depth 2 稳定 KO 后不再套用对手 reply 伤害。
- [ ] 应用 stat stage delta。
- [ ] 应用 status delta。
- [ ] 应用 weather delta。
- [ ] 应用 terrain delta。
- [ ] 应用 Tailwind turn delta。
- [ ] 应用 Trick Room turn delta。
- [x] 应用 switch delta。
- [ ] 不确定随机结果用 expected state。
- [ ] 高风险随机结果写 outcome bucket。
- [x] 不追求完整 Showdown 事件顺序。

## 10. Outcome Bucket

- [x] 新增 `BattleAiOutcomeBucketV4`。
- [x] 支持 `ko`。
- [ ] 支持 `joint-ko`。
- [x] 支持 `threaten-ko`。
- [x] 支持 `self-ko-risk`。
- [x] 支持 `revenge-kill-risk`。
- [x] 支持 `safe-switch`。
- [x] 支持 `unsafe-switch`。
- [x] 支持 `setup-weather`。
- [x] 支持 `enable-wincon`。
- [x] 支持 `preserve-wincon`。
- [x] 支持 `hazard-progress`。
- [x] 支持 `status-progress`。
- [x] Outcome bucket 进入 singles depth 2 leaf score。
- [ ] 新增 `BattleAiDamageBucketV4`。
- [ ] 支持 `immune`。
- [ ] 支持 `negligible`。
- [ ] 支持 `chip`。
- [ ] 支持 `pressure`。
- [ ] 支持 `two-hit-ko`。
- [ ] 支持 `near-ko`。
- [ ] 支持 `possible-ko`。
- [ ] 支持 `guaranteed-ko`。
- [ ] Damage bucket 改用 calc damage rolls / range 推导。
- [ ] `guaranteed-ko` / `possible-ko` / `two-hit-ko` / `near-ko` 基于真实 roll 判断。
- [ ] 双打 spread damage 使用 calc 的 `gameType: "Doubles"` 修正。
- [ ] Protect / Max / Z / Tera 相关伤害修正优先由 calc 处理。
- [ ] 支持 `selfRiskBucket`。
- [ ] 支持 `speedBucket`。
- [ ] 支持 `fieldBucket`。
- [ ] 支持 `comboBucket`。
- [ ] 搜索节点可用 bucket 合并近似状态。

## 11. 局面评分 Value Function

- [x] 新增 singles 内部 `scoreSinglesLeafState()`。
- [x] 我方剩余 HP 加分。
- [x] 对方剩余 HP 扣分。
- [x] 我方 KO 对手加分。
- [x] 我方被 KO 扣分。
- [x] 整队 HP 总量差进入评分。
- [x] 存活数量差进入评分。
- [x] 残血数量压力进入评分。
- [x] win condition 存活/健康进入评分。
- [x] 保住我方核心额外加分。
- [x] 撒场推进额外加分。
- [x] 异常推进额外加分。
- [x] 危险换人扣分。
- [x] 击杀高威胁目标额外加分。
- [x] 我方速度权加分。
- [x] 对方速度权扣分。
- [ ] Value Function 不直接实现伤害公式，只消费估伤模块输出。
- [ ] singles / doubles / coop 共用同一估伤 adapter。
- [ ] targetOverride 换人承伤改用 calc adapter 重新估伤。
- [ ] Dynamax / Terastallize / Max Move 的进攻与防守收益基于 calc 输出校准。
- [ ] 估值函数继续负责资源、风险、队伍角色、局面价值；damage-calc 只负责伤害 oracle。
- [ ] 我方有利天气加分。
- [ ] 对方有利天气扣分。
- [ ] 我方有利场地加分。
- [ ] 对方有利场地扣分。
- [ ] 我方有利 Trick Room 加分。
- [ ] 对方有利 Trick Room 扣分。
- [ ] 我方有利 Tailwind 加分。
- [ ] 对方有利 Tailwind 扣分。
- [ ] 我方强化加分。
- [ ] 对方强化扣分。
- [ ] 我方异常扣分。
- [ ] 对方异常加分。
- [x] 风险项单独输出。
- [x] 输出 selected leaf `valueBreakdown`。
- [x] reasons 可解释。

## 11.1 Singles Role-Aware Switch Value

- [x] singles depth 2 接入 team role analysis。
- [x] 当前天气匹配后排 weather-abuser 时，switch 加分。
- [x] 当前 active 是天气 setter 且天气已开、后排有健康 abuser 时，低 KO 留场降分。
- [x] 残血时换入 pivot / wall 加分。
- [x] 低血 win condition 换入扣分。
- [x] 天气招式在己方有对应 abuser 时加分。
- [x] 天气招式在己方无对应 abuser 时降分。

## 11.2 Singles Value Function v3 Stability

- [x] 新增 `stability` value breakdown 分项。
- [x] 使用 damage bucket 对我方行动和对手 reply 做稳定性加减分。
- [x] 免疫 / 0 伤害攻击招额外强扣分，避免重复无效行动。
- [x] negligible 低收益攻击招在无 KO 机会时扣分。
- [x] 对手稳定 KO 且我方不能先 KO 时，贪伤害/变化招扣分。
- [x] 当前 active 是 win condition 且暴露在高伤害或稳定 KO 下时扣分。
- [x] safe-switch 在 stability 中加分，unsafe-switch 在 stability 中继续扣分。
- [x] setup / weather / terrain / speed-control 在会被稳定 KO 时额外扣分。

## 11.3 Singles Strategic Context v1

- [x] 新增 `aiStrategicContextV4.ts`。
- [x] 基于可见队伍、角色标签、HP、速度/进攻 stats 构建 `selfWinConditions`。
- [x] 基于可见队伍、角色标签、HP、速度/进攻 stats 构建 `foeThreats`。
- [x] 标记 `currentFoeThreat`，用于当前回合击杀/压低威胁加分。
- [x] 新增 `resourceAdvice`，后排存在健康 win condition 且当前 active 不是资源持有目标时，倾向保留极巨/太晶。
- [x] Value Function 新增 `strategic` breakdown 分项。
- [x] 击杀当前高威胁目标加分。
- [x] 压低当前高威胁目标加分。
- [x] 当前 active 是 win condition 且面临稳定反杀时继续扣分。
- [x] 低收益太晶/极巨在有健康后排 win condition 时扣分。
- [x] 明确收益的极巨/太晶保留正向提交分。
- [x] 新增 debug `reasonTags`。
- [x] 首批 reason tags：`ko-current-threat`、`pressure-current-threat`、`preserve-wincon`、`avoid-wincon-sacrifice`、`safe-switch`、`unsafe-switch`。
- [x] 首批资源 tags：`commit-dynamax`、`hold-dynamax`、`commit-tera`、`hold-tera`。
- [x] 首批防犯病 tags：`avoid-immune-move`、`avoid-low-value-setup`、`revenge-kill`、`speed-control-value`。

## 12. Minimax

- [x] 新增 singles depth 2 minimax 搜索逻辑。
- [x] 我方节点取 max。
- [x] 对手节点取 min。
- [ ] 支持 alpha-beta pruning。
- [ ] Alpha-Beta 仅作为性能优化，不改变估值逻辑。
- [ ] 在 depth 4+ 或双打 joint action 出现性能压力后启用 Alpha-Beta。
- [ ] 支持 iterative deepening。
- [ ] 支持 transposition cache。
- [ ] cache key 使用 bucket state。
- [ ] depth 到 0 时调用 value function。
- [x] 超过 `maxNodes` 截断。
- [x] 超过 `maxMs` 截断。
- [x] 截断时返回当前 best。
- [x] 对手 policy 第一版使用同一套 scorer 近似。
- [x] Debug 记录 top principal variation。

## 13. 双打 Joint Action

- [x] 双打 v0：拆出 `aiDoublesStrategyV4.ts`。
- [x] 双打 v0：不生成新 choice，只重排现有合法 joint candidates。
- [x] 双打 v0：解析 joint action parts，识别 move / switch / pass。
- [x] 双打 v0：识别 move + move。
- [x] 双打 v0：识别 move + switch。
- [x] 双打 v0：识别 switch + move。
- [x] 双打 v0：识别 switch + switch。
- [x] 双打 v0：识别 move target foe。
- [x] 双打 v0：识别 move target ally。
- [x] 双打 v0：识别 move target self。
- [x] 双打 v0：识别 spread move。
- [x] 双打 v0：spread move 伤害估算第一版复用现有 evaluator diagnostics。
- [x] 双打 v0：`allAdjacentFoes` 不算友伤。
- [x] 双打 v0：`allAdjacent` 默认按可能友伤扣分。
- [x] 双打 v0：队友误伤必须扣分。
- [x] 双打 v0：没有 combo detector 命中时，攻击队友不得获得正向战术分。
- [x] 双打 v0：debug 输出 doubles reason tags。
- [x] 双打 v1：引入 ally combo detector 后，打队友才允许正收益。
- [x] 双打 v1：实现 Weakness Policy / Contrary / 吸收特性首批 combo。
- [x] 双打 v1：抽出 `aiDoublesValueFunctionV4.ts`，输出 bounded value breakdown。
- [x] 双打 v1：value breakdown 覆盖 targeting / spread / friendlyFire / combo / protect / disruption / speedControl / field / priority / resource / risk。
- [x] 双打 v2：引入对手 joint reply，馆主/四天王/冠军按 `1/2/3` 搜索。
- [x] 双打 v2：对手 reply 候选同样来自现有 request / validator / candidate generator。
- [x] 双打 v2：lightweight leaf 使用双方 joint value、伤害压力、KO 压力和少量原始候选分。
- [x] 双打 v2：champion depth 3 先用轻量续手项表达，不做完整 Showdown 三回合模拟。
- [x] 双打 v2：特殊招式 value 覆盖 Fake Out / Sucker Punch / Max Guard / Tera defensive。

## 13.1 合作 Coop Strategy

- [ ] 合作开始实现前拆出 `aiCoopStrategyV4.ts`。
- [ ] 合作复用双打 joint action / target / ally combo 基础能力。
- [ ] 合作 value function 增加 `avoidPlayerFriendlyFire`。
- [ ] 合作 value function 增加 `preservePlayerCore`。
- [ ] 合作 value function 增加 `supportPlayerWincon`。
- [ ] 合作 value function 增加 `followPlayerTempo`。
- [ ] 玩家已能稳定 KO 时，AI 优先考虑辅助、保护、控速或打另一个目标。
- [ ] AI 不应抢占明显属于玩家核心的收益窗口，除非可避免失败。
- [ ] AI 不应对玩家 active 使用高风险误伤行动，除非 combo detector 明确收益且不致死。

## 14. Ally Combo Detector

- [x] 新增 `detectBattleAiAllyCombosV4()`。
- [x] 支持 Weakness Policy。
- [x] 支持 Contrary。
- [x] 支持 Flash Fire。
- [x] 支持 Lightning Rod。
- [x] 支持 Storm Drain。
- [x] 支持 Water Absorb。
- [x] 支持 Volt Absorb。
- [x] 支持 Sap Sipper。
- [x] 支持 Motor Drive。
- [ ] 支持 Anger Point 占位。
- [x] 支持 Surf / Discharge / Earthquake + 队友免疫或吸收占位。
- [x] combo 必须检查是否会击杀队友。
- [x] combo 必须检查触发后队友是否有输出窗口。
- [x] combo 必须输出 `comboId`。
- [x] combo 必须输出 benefit。
- [x] combo 必须输出 risk。
- [x] combo 必须进入 debug。

## 15. 特殊招式第一批

- [x] Protect：残血会被击杀或被双点时加分。
- [x] Protect：己方稳定 KO 且不需要保护时扣分。
- [ ] Fake Out：仅首回合/可用时保留高权重。
- [x] Fake Out：不可用时剪枝或强扣分。
- [x] Sucker Punch：目标高概率攻击时加分。
- [x] Sucker Punch：目标高概率变化招时扣分。
- [x] Tailwind：我方无顺风且速度线收益明显时加分。
- [ ] Tailwind：我方已有顺风时扣分或剪枝。
- [x] Trick Room：低速队收益时加分。
- [x] Trick Room：高速队自毁时扣分。
- [x] Weather move：能抢天气且己方收益高时加分。
- [x] Terrain move：能抢场地且己方收益高时加分。
- [ ] Recovery：能脱离 KO 线时加分。
- [ ] Setup move：有存活窗口和后续收益时加分。

## 15.1 特殊系统评分

- [x] 新增 `aiSpecialSystemScorerV4.ts`。
- [x] Mega / Z 保持轻量评分，不作为本轮战略重点。
- [x] Dynamax 不再只按固定增伤处理。
- [x] Dynamax 评分包含 HP 翻倍后的生存收益。
- [x] Dynamax 评分识别 Max Guard 保命/拖关键回合价值。
- [x] Dynamax 评分识别 Max Airstream 速度线收益。
- [x] Dynamax 评分识别 Max Knuckle / Max Ooze 攻击滚雪球收益。
- [x] Dynamax 评分识别 Max Steelspike / Max Quake 防守站场收益。
- [x] Dynamax 评分识别 Max Geyser / Max Flare / Max Rockfall / Max Hailstorm 天气收益。
- [x] Dynamax 评分识别 Max Lightning / Max Mindstorm / Max Overgrowth / Max Starfall 场地收益。
- [x] Dynamax 评分识别 Max Phantasm / Max Darkness / Max Strike / Max Wyrmwind / Max Flutterby 降低对手能力收益。
- [x] G-Max 第一版识别残留伤害、极光幕、撒场、清场、无视守住、群体状态等高价值特例。
- [x] Terastallize 评分包含同属性 STAB `1.5 -> 2` 的进攻收益。
- [x] Terastallize 评分包含非本系变本系 STAB 的进攻收益。
- [x] Terastallize 评分包含 Tera Blast 按 teraType 变属性。
- [x] Terastallize 评分包含低血防守太晶和 win condition 太晶启发。
- [x] 低收益太晶加入轻量扣分，避免冠军级 AI 乱交资源。
- [x] 特殊系统评分写入 candidate diagnostics：`specialSystemScore` / `specialSystemTags` / `specialSystemBreakdown`。
- [x] Value Function 读取特殊系统 tags 做上下文加减分。
- [x] 本轮仍不做完整三回合 Dynamax 模拟，只用启发式 momentum 表达后续价值。

## 16. 接入 chooseAiBattleChoiceV4

- [x] 保留原入口。
- [x] 保留原 fallback。
- [x] 新搜索结果转回原 choice 格式。
- [x] choice 提交前再次 validator。
- [x] depth 1 使用现有 evaluator 结果。
- [x] singles depth 2 使用 Minimax。
- [x] 配置开关：可关闭 Minimax 回到 NumericGuard。
- [x] Debug 中标记 `strategy: "numeric-guard" | "minimax"`。

## 17. Debug

- [x] `BattleAiDecisionDebugV4` 增加 `search` 字段。
- [x] 输出 budget。
- [x] 输出 depth。
- [x] 输出节点数。
- [x] 输出耗时。
- [x] 输出截断原因。
- [x] 输出 capability profile。
- [x] 输出 top candidates。
- [x] 输出 principal variation。
- [x] 输出每个候选的 outcome bucket。
- [x] 输出 selected leaf value breakdown。
- [x] 输出 selected/high-score candidate reason tags。
- [ ] 输出每个候选的 score parts。
- [x] 输出 ally combo reasons。
- [ ] 输出 fallback reason。

## 18. 单打测试

- [x] Tyranitar vs Ceruledge：Ice Beam 不应被 gymLeader+ 选择。
- [x] singles depth 2：双方 request 存在时进入 minimax，并输出 principal variation。
- [x] normal / elite：有双方 request 时也不启用完整 Minimax。
- [x] AI 等级 capability 映射测试。
- [x] singles depth 2：稳定 KO 输出 `ko` outcome bucket。
- [x] outcome bucket：Stealth Rock 输出 `hazard-progress`。
- [x] outcome bucket：Toxic 输出 `status-progress`。
- [x] 队伍标签：Pelipper / Drizzle -> `weather-setter: rain`。
- [x] 队伍标签：Barraskewda / Swift Swim -> `weather-abuser: rain`。
- [x] 队伍标签：Ferrothorn + Leech Seed/Protect/Spikes -> `wall` + `hazard-setter`。
- [x] 队伍标签：Rotom-W + Volt Switch -> `pivot`。
- [x] 队伍标签：Dragon Dance 用户 -> `setup-sweeper`。
- [x] 队伍类型：Tailwind 组件 + 进攻核心 -> `tailwind`。
- [x] 队伍类型：Trick Room 组件 -> `trick-room`。
- [x] 队伍类型：场地组件 -> `terrain`。
- [x] 队伍类型：多层撒场 -> `hazard-stack`。
- [x] 队伍类型：中毒 + 回复/Protect 消耗 -> `poison-stall`。
- [x] 队伍类型：强化手 + 进攻核心 -> `setup-offense`。
- [x] 队伍类型：无明显组件 -> `balanced`。
- [x] 雨天已开，场上 setter 无 KO 机会，后排 rain abuser 健康：switch abuser 分提高。
- [x] 免疫测试。
- [ ] 抵抗测试。
- [ ] 克制测试。
- [ ] 四倍克制测试。
- [x] STAB 测试。
- [x] 季节形态 fallback：`Sawsbuck-Winter` 应识别为一般系，不被幽灵招反复命中。
- [x] 形态优先级 fallback：`active.species` 为基础名但 side row 为 `Oricorio-Sensu` 时，Tera Blast/普通系应识别幽灵免疫。
- [x] 物理伤害读取 atk/def。
- [x] 特殊伤害读取 spa/spd。
- [ ] 命中低但可 KO 的招式测试。
- [ ] 稳定 KO 不被低命中高威力乱压。
- [ ] priority 先手测试。
- [ ] Trick Room 速度反转测试。
- [ ] Tailwind 速度翻倍测试。
- [ ] Protect 保命测试。
- [ ] Fake Out 可用性测试。
- [ ] Sucker Punch 场景测试。
- [x] switch 抗性测试。
- [x] value function：整队 HP 总量差测试。
- [x] value function：win condition 健康/送死测试。
- [x] value function：对手后排数量影响撒场收益测试。
- [x] value function：对方多个残血时收割压力测试。
- [x] value function v3：免疫攻击、核心暴露、safe switch 稳定性测试。
- [x] strategic context：识别当前威胁和我方 win condition。
- [x] strategic context：低收益太晶输出 `hold-tera`。
- [x] strategic context：Max Airstream 明确收益输出 `commit-dynamax` + `speed-control-value`。
- [x] strategic context：免疫招输出 `avoid-immune-move`。
- [x] strategic context：选中稳定 KO 当前威胁输出 `ko-current-threat`。
- [x] Max Lightning / Max Geyser 输出特殊系统战略 tags。
- [x] Max Guard 不生成非法 target suffix，并输出 `max-guard` tag。
- [x] 太晶同属性 STAB 从 `1.5` 提升到 `2`。
- [x] Tera Blast 按 teraType 估算属性，非 Tera Blast 招式保持原属性。

## 18.1 自博弈验收

- [x] 20 题 singles self-play 验收报告：`test/ai-self-play-special-20-20260715/report.md`。
- [x] 20 题全部正常结束：`ended=20`，`maxTurns=0`，`teamGenerationFailed=0`。
- [x] 20 题严重失误清零：`severe=0`。
- [x] 20 题 warning 保持可分析范围：`warning=5`。
- [x] 20 题平均决策时间约 `1.29s`，低于单回合 `10s` 指令预算。
- [x] 20 题队伍核心完整率：rain/sun/trick-room/balanced/setup-offense 均为 `100%`。
- [x] Strategic Context 首次 20 题验收报告：`test/ai-self-play-strategic-20-20260715/report.md`。
- [x] Strategic Context 首次 20 题：`severe=2` 集中在 q017 `Tera Blast` 重复打 Oricorio-Sensu 免疫，已定位为 active species 基础名覆盖 side row 形态。
- [x] q017 targeted rerun 报告：`test/ai-self-play-strategic-q017-rerun-20260715/report.md`。
- [x] q017 targeted rerun：2 题全部正常结束，`severe=0`，`warning=0`，平均决策约 `1.57s`。

## 19. 双打测试

- [ ] 单体招按 targetLoc 分别评分。
- [ ] 不攻击 fainted 目标。
- [ ] spread move 命中多个目标。
- [x] spread move 计算队友误伤。
- [x] 双点 KO 威胁下 Protect 分提高。
- [x] Fake Out 阻止 Trick Room。
- [x] Tailwind mirror 场景。
- [x] Trick Room vs 高速队场景。
- [ ] Weather war 场景。
- [x] Weakness Policy 打队友触发场景。
- [x] Contrary + stat drop 打队友强化场景。
- [x] Flash Fire 队友触发场景。
- [x] Lightning Rod / Storm Drain 队友吸收场景。
- [x] Surf / Discharge / Earthquake 配合免疫场景。
- [ ] joint action 不能生成非法 target suffix。
- [x] doubles v0：`Earthquake/allAdjacent` 输出 `spread-friendly-fire-risk`。
- [x] doubles v0：`Rock Slide/allAdjacentFoes` 输出 `spread-foes`。
- [x] doubles v0：直接攻击队友输出 `avoid-ally-damage`。
- [x] doubles v0：双点同一敌人输出 `double-target-foe`。
- [x] doubles v0：AI 选择后仍通过 validator。
- [x] doubles v1：负数 targetLoc 估伤应真正命中队友。
- [x] doubles v1：Weakness Policy 队友触发获得正向 combo。
- [x] doubles v1：Contrary + stat drop 队友触发获得正向 combo。
- [x] doubles v1：Flash Fire 队友触发获得正向 combo。
- [x] doubles v1：Storm Drain / Water spread 队友触发获得正向 combo。
- [x] doubles v2：gymLeader 双打保持 depth 1 safety shell。
- [x] doubles v2：eliteFour 双打启用 depth 2 reply search。
- [x] doubles v2：champion 双打启用 depth 3 lightweight reply search。
- [x] doubles v2：Fake Out 不可用时强扣分。
- [x] doubles v2：Sucker Punch 区分攻击目标和变化目标。
- [x] doubles v2：Max Guard 在高压双点下提高。
- [x] doubles v2：防守太晶在高压承伤下提高。

## 20. 性能测试

- [ ] 单打 depth 1 在 100ms 内。
- [ ] 单打 depth 2 在 500ms 内。
- [ ] 单打 depth 3 在 2s 内。
- [ ] 双打 depth 1 在 300ms 内。
- [ ] 双打 depth 2 在 2s 内。
- [ ] 双打 depth 3 在 5s 内。
- [ ] champion hard budget 不超过 10s。
- [ ] 超时能返回合法 best-so-far。
- [ ] maxNodes 截断能返回合法 best-so-far。

## 21. 必跑检查

- [x] `pnpm --filter @changebattle-v2/showdown-battle-core test`
- [x] `pnpm --filter @changebattle-v2/api typecheck`
- [x] `pnpm --filter @changebattle-v2/web typecheck`
- [x] `git diff --check`

## 22. 非目标

- [x] 不做实时模型训练。
- [x] 不训练小模型/LLM 来直接选择出招。
- [x] 不做 LLM 直接出招。
- [x] 不做完整 MCTS。
- [x] 不做完整 Showdown 模拟器替代。
- [x] 不绕过 validator。
- [x] 不一次性覆盖全部双打高级战术。
- [x] 不用玩家历史操作做读心式针对。
