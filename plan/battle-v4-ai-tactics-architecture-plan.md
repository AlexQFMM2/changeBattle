# Battle V4 AI Minimax 实时算法开发清单

## 最终决定

- [x] 算法主线：Battle V4 AI 采用 **极小极大 / Minimax 实时搜索**。
- [x] 核心战力：持续完善 **估值函数 / Value Function**，让 AI 选择稳定收益而不是只追最高伤害。
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
- [x] `chooseAiBattleChoiceV4` 保持唯一外部入口，由 search engine 根据 battle mode 分发到对应 strategy。
- [ ] 后续拆分 `aiSinglesStrategyV4.ts`。
- [ ] 后续拆分 `aiDoublesStrategyV4.ts`。
- [ ] 后续拆分 `aiCoopStrategyV4.ts`。
- [ ] 后续抽出 `aiValueFunctionV4.ts`。
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

## 1. 算法依据

- [x] 总架构明确为：`Minimax 搜索框架` + `估值函数` + `剪枝优化`。
- [x] 当前优先级：先完善估值函数，再扩大搜索深度，最后按性能需要加剪枝。
- [x] 高等级 AI 倾向稳定收益：考虑 worst-case / risk penalty，不盲目赌低概率高收益。
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
- [ ] singles dynamic depth：在 `min(levelMaxDepth, dynamicDepthFromComplexity)` 内随减员加深。
- [ ] doubles dynamic depth：开局默认不超过 2-3，残局再上调。
- [ ] coop dynamic depth：默认不超过 doubles，同时保留玩家体验约束。
- [ ] complexity 输入：legalActionCount / alivePokemonCount / switchOptionCount / activeCount / targetOptionCount。

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
- [ ] 读取可见后排。
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
- [x] 保住我方核心额外加分。
- [x] 撒场推进额外加分。
- [x] 异常推进额外加分。
- [x] 危险换人扣分。
- [ ] 击杀高威胁目标额外加分。
- [ ] 我方速度权加分。
- [ ] 对方速度权扣分。
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
- [ ] 风险项单独输出。
- [ ] reasons 可解释。

## 11.1 Singles Role-Aware Switch Value

- [x] singles depth 2 接入 team role analysis。
- [x] 当前天气匹配后排 weather-abuser 时，switch 加分。
- [x] 当前 active 是天气 setter 且天气已开、后排有健康 abuser 时，低 KO 留场降分。
- [x] 残血时换入 pivot / wall 加分。
- [x] 低血 win condition 换入扣分。
- [x] 天气招式在己方有对应 abuser 时加分。
- [x] 天气招式在己方无对应 abuser 时降分。

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

- [ ] 双打开始实现前拆出 `aiDoublesStrategyV4.ts`。
- [ ] 双打搜索以 joint action 为单位。
- [ ] 一个 joint action 包含两个 active 的行动。
- [ ] 支持 move + move。
- [ ] 支持 move + switch。
- [ ] 支持 switch + move。
- [ ] 支持 switch + switch。
- [ ] 支持 move target foe。
- [ ] 支持 move target ally。
- [ ] 支持 move target self。
- [ ] 支持 spread move。
- [ ] spread move 伤害估算第一版复用现有 evaluator。
- [ ] 队友误伤必须扣分。
- [ ] 只有 combo detector 命中时，打队友才允许获得正向战术分。

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

- [ ] 新增 `detectBattleAiAllyCombosV4()`。
- [ ] 支持 Weakness Policy。
- [ ] 支持 Contrary。
- [ ] 支持 Flash Fire。
- [ ] 支持 Lightning Rod。
- [ ] 支持 Storm Drain。
- [ ] 支持 Water Absorb。
- [ ] 支持 Volt Absorb。
- [ ] 支持 Sap Sipper。
- [ ] 支持 Motor Drive。
- [ ] 支持 Anger Point 占位。
- [ ] 支持 Surf / Discharge / Earthquake + 队友免疫或吸收占位。
- [ ] combo 必须检查是否会击杀队友。
- [ ] combo 必须检查触发后队友是否有输出窗口。
- [ ] combo 必须输出 `comboId`。
- [ ] combo 必须输出 benefit。
- [ ] combo 必须输出 risk。
- [ ] combo 必须进入 debug。

## 15. 特殊招式第一批

- [ ] Protect：残血会被击杀或被双点时加分。
- [ ] Protect：己方稳定 KO 且不需要保护时扣分。
- [ ] Fake Out：仅首回合/可用时保留高权重。
- [ ] Fake Out：不可用时剪枝或强扣分。
- [ ] Sucker Punch：目标高概率攻击时加分。
- [ ] Sucker Punch：目标高概率变化招时扣分。
- [ ] Tailwind：我方无顺风且速度线收益明显时加分。
- [ ] Tailwind：我方已有顺风时扣分或剪枝。
- [ ] Trick Room：低速队收益时加分。
- [ ] Trick Room：高速队自毁时扣分。
- [ ] Weather move：能抢天气且己方收益高时加分。
- [ ] Terrain move：能抢场地且己方收益高时加分。
- [ ] Recovery：能脱离 KO 线时加分。
- [ ] Setup move：有存活窗口和后续收益时加分。

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
- [ ] 输出每个候选的 score parts。
- [ ] 输出 ally combo reasons。
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
- [ ] 免疫测试。
- [ ] 抵抗测试。
- [ ] 克制测试。
- [ ] 四倍克制测试。
- [ ] STAB 测试。
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

## 19. 双打测试

- [ ] 单体招按 targetLoc 分别评分。
- [ ] 不攻击 fainted 目标。
- [ ] spread move 命中多个目标。
- [ ] spread move 计算队友误伤。
- [ ] 双点 KO 威胁下 Protect 分提高。
- [ ] Fake Out 阻止 Trick Room。
- [ ] Tailwind mirror 场景。
- [ ] Trick Room vs 高速队场景。
- [ ] Weather war 场景。
- [ ] Weakness Policy 打队友触发场景。
- [ ] Contrary + stat drop 打队友强化场景。
- [ ] Flash Fire 队友触发场景。
- [ ] Lightning Rod / Storm Drain 队友吸收场景。
- [ ] Surf / Discharge / Earthquake 配合免疫场景。
- [ ] joint action 不能生成非法 target suffix。

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
