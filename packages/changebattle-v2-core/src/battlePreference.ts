export type TrainingModeV4 = "singles" | "doubles" | "coop";
export type TrainingRuleSetV4 = "standard" | "gen7" | "gen8" | "gen9";
export type FormalCompetitionModeV4 = "standard" | "single" | "leagueLoop";
export type BattleSystemPreferenceV4 = "mega" | "zmove" | "dynamax" | "terastal";

export type BattlePreferenceV4 = {
  allowedGenerations: number[];
  ruleSet: TrainingRuleSetV4;
  enabledBattleSystems: BattleSystemPreferenceV4[];
  competitionMode: FormalCompetitionModeV4;
  legendaryBattle: boolean;
  battleBagEnabled: boolean;
};

export const BATTLE_GENERATION_OPTIONS_V4 = [
  {generation: 1, region: "关都"},
  {generation: 2, region: "城都"},
  {generation: 3, region: "丰缘"},
  {generation: 4, region: "神奥"},
  {generation: 5, region: "合众"},
  {generation: 6, region: "卡洛斯"},
  {generation: 7, region: "阿罗拉"},
  {generation: 8, region: "伽勒尔"},
  {generation: 9, region: "帕底亚"},
] as const;

export const BATTLE_SYSTEM_OPTIONS_V4: Array<{id: BattleSystemPreferenceV4; name: string}> = [
  {id: "mega", name: "Mega"},
  {id: "zmove", name: "Z 招式"},
  {id: "dynamax", name: "极巨化"},
  {id: "terastal", name: "太晶化"},
];

export const BATTLE_RULE_PRESET_OPTIONS_V4: Array<{id: TrainingRuleSetV4; name: string; systems: BattleSystemPreferenceV4[]; maxGeneration?: number}> = [
  {id: "standard", name: "无特殊系统", systems: []},
  {id: "gen7", name: "第七世代规则", systems: ["mega", "zmove"], maxGeneration: 7},
  {id: "gen8", name: "第八世代规则", systems: ["dynamax"], maxGeneration: 8},
  {id: "gen9", name: "第九世代规则", systems: ["terastal"], maxGeneration: 9},
];

export const DEFAULT_BATTLE_PREFERENCE_V4: BattlePreferenceV4 = {
  allowedGenerations: [1, 2, 3, 4, 5, 6, 7],
  ruleSet: "standard",
  enabledBattleSystems: [],
  competitionMode: "standard",
  legendaryBattle: false,
  battleBagEnabled: true,
};

export function battleSystemsForRuleSetV4(ruleSet: TrainingRuleSetV4): BattleSystemPreferenceV4[] {
  return [...(BATTLE_RULE_PRESET_OPTIONS_V4.find(option => option.id === ruleSet)?.systems || [])];
}

export function normalizeBattlePreferenceV4(input?: Partial<BattlePreferenceV4> | null): BattlePreferenceV4 {
  const validGenerations = new Set<number>(BATTLE_GENERATION_OPTIONS_V4.map(option => option.generation));
  const allowedGenerations = Array.from(new Set((input?.allowedGenerations || DEFAULT_BATTLE_PREFERENCE_V4.allowedGenerations)
    .map(value => Math.floor(Number(value)))
    .filter(value => validGenerations.has(value))))
    .sort((a, b) => a - b);
  const ruleSet = BATTLE_RULE_PRESET_OPTIONS_V4.some(option => option.id === input?.ruleSet)
    ? input!.ruleSet as TrainingRuleSetV4
    : DEFAULT_BATTLE_PREFERENCE_V4.ruleSet;
  const competitionMode = normalizeFormalCompetitionModeV4(input?.competitionMode);
  return {
    allowedGenerations: allowedGenerations.length ? allowedGenerations : [...DEFAULT_BATTLE_PREFERENCE_V4.allowedGenerations],
    ruleSet,
    enabledBattleSystems: battleSystemsForRuleSetV4(ruleSet),
    competitionMode,
    legendaryBattle: Boolean(input?.legendaryBattle),
    battleBagEnabled: typeof input?.battleBagEnabled === "boolean" ? input.battleBagEnabled : DEFAULT_BATTLE_PREFERENCE_V4.battleBagEnabled,
  };
}

export function normalizeFormalCompetitionModeV4(value: unknown): FormalCompetitionModeV4 {
  return value === "single" || value === "leagueLoop" ? value : "standard";
}
