export type BossTrainerRuleSetPresetData = "none" | "gen7" | "gen8" | "gen9";
export type BossTrainerModeData = "singles" | "doubles" | "coop";

export type BossTrainerPresetPokemonSetData = {
  name: string;
  species: string;
  item?: string;
  ability: string;
  moves: string[];
  nature: string;
  gender?: string;
  evs?: Record<string, number>;
  ivs?: Record<string, number>;
  level: number;
  shiny?: boolean;
  happiness?: number;
  pokeball?: string;
  hpType?: string;
  dynamaxLevel?: number;
  gigantamax?: boolean;
  teraType?: string;
};

export type BossTrainerPresetTeamDiagnosticsData = {
  ok: boolean;
  requestedRuleSet: string;
  resolvedRuleSet: string;
  requestedMode: string;
  formatId: string | null;
  fallbackFormatId?: string;
  seed: number[] | null;
  teamSize: number | null;
  pokemonFilter: {
    requestedSpeciesIds: string[];
    excludedSpeciesIds: string[];
    matchedSpeciesIds: string[];
  } | null;
  archetype: {
    id: string;
    attempts: number;
    bestScore: number;
    matchedPoolSize: number;
  } | null;
  messages: string[];
  elapsedMs: number;
  generationAttempts: string[];
  preferredSpeciesHitCount: number;
  cleanedSpecialSystemForNone: boolean;
  fillToSixCount: number;
};

export type BossTrainerPresetTeamData = {
  trainerId: string;
  trainerNameZh: string;
  trainerType: string;
  ruleSetPreset: BossTrainerRuleSetPresetData;
  mode: BossTrainerModeData;
  variantIndex: number;
  seed: string;
  teamArchetype: string;
  aiPreference: string;
  aiLevel: string;
  powerProfile: string;
  preferredSpeciesIds: string[];
  originalPreferredSpeciesIds: string[];
  pokemonSets: BossTrainerPresetPokemonSetData[];
  packedTeam: string;
  exportedTeam: string;
  diagnostics: BossTrainerPresetTeamDiagnosticsData;
};

export type BossTrainerPresetMatrixSummaryData = {
  trainerId: string;
  trainerNameZh: string;
  trainerType: string;
  expectedCount: number;
  generatedCount: number;
  missingKeys: string[];
  ruleSetCounts: Record<BossTrainerRuleSetPresetData, number>;
  modeCounts: Record<BossTrainerModeData, number>;
  preferredSpeciesHitTeamCount: number;
  preferredSpeciesTotalHits: number;
  zeroPreferredHitTeamCount: number;
  fallbackTeamCount: number;
  warningCount: number;
  cleanedNoneTeamCount: number;
  teamPreferences: string[];
  aiPreference: string;
  aiLevel: string;
  powerProfile: string;
  originalPreferredSpeciesCount: number;
  expandedPreferredSpeciesCount: number;
};

export const BossTrainerPresetTeamCount = 4752;

export const BossTrainerPresetTeamsDataFile = "boss-preset-teams.json";

export const BossTrainerPresetMatrixSummaries = {
  "gym:帕底亚地区:阿枫:1": {
    "trainerId": "gym:帕底亚地区:阿枫:1",
    "trainerNameZh": "阿枫",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 25,
    "preferredSpeciesTotalHits": 89,
    "zeroPreferredHitTeamCount": 11,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "hazard-stack",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "support",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 9,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:阿罗拉地区:阿塞萝拉:3": {
    "trainerId": "elite4:阿罗拉地区:阿塞萝拉:3",
    "trainerNameZh": "阿塞萝拉",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 27,
    "preferredSpeciesTotalHits": 94,
    "zeroPreferredHitTeamCount": 9,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "snow",
      "trick-room",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 6,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:伽勒尔地区:波普菈:6": {
    "trainerId": "gym:伽勒尔地区:波普菈:6",
    "trainerNameZh": "波普菈",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 26,
    "preferredSpeciesTotalHits": 93,
    "zeroPreferredHitTeamCount": 10,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "trick-room",
      "poison-stall",
      "balanced"
    ],
    "aiPreference": "support",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 8,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:伽勒尔地区:彩豆:4": {
    "trainerId": "gym:伽勒尔地区:彩豆:4",
    "trainerNameZh": "彩豆",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 28,
    "preferredSpeciesTotalHits": 83,
    "zeroPreferredHitTeamCount": 8,
    "fallbackTeamCount": 15,
    "warningCount": 9,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "setup-offense",
      "tailwind",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 7,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:卡洛斯地区:查克洛:2": {
    "trainerId": "gym:卡洛斯地区:查克洛:2",
    "trainerNameZh": "查克洛",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 16,
    "preferredSpeciesTotalHits": 25,
    "zeroPreferredHitTeamCount": 20,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "snow",
      "sand",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 6,
    "expandedPreferredSpeciesCount": 12
  },
  "champion:伽勒尔地区:丹帝:1": {
    "trainerId": "champion:伽勒尔地区:丹帝:1",
    "trainerNameZh": "丹帝",
    "trainerType": "champion",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 26,
    "preferredSpeciesTotalHits": 85,
    "zeroPreferredHitTeamCount": 10,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "balanced",
      "setup-offense"
    ],
    "aiPreference": "balanced",
    "aiLevel": "champion",
    "powerProfile": "champion",
    "originalPreferredSpeciesCount": 0,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:卡洛斯地区:得抚:8": {
    "trainerId": "gym:卡洛斯地区:得抚:8",
    "trainerNameZh": "得抚",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 25,
    "preferredSpeciesTotalHits": 33,
    "zeroPreferredHitTeamCount": 11,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "snow",
      "sand",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 4,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:卡洛斯地区:朵拉塞娜:4": {
    "trainerId": "elite4:卡洛斯地区:朵拉塞娜:4",
    "trainerNameZh": "朵拉塞娜",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 29,
    "preferredSpeciesTotalHits": 113,
    "zeroPreferredHitTeamCount": 7,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "poison-stall",
      "hazard-stack",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 4,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:卡洛斯地区:福爷:4": {
    "trainerId": "gym:卡洛斯地区:福爷:4",
    "trainerNameZh": "福爷",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 26,
    "preferredSpeciesTotalHits": 36,
    "zeroPreferredHitTeamCount": 10,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "balanced",
      "setup-offense"
    ],
    "aiPreference": "balanced",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 3,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:卡洛斯地区:葛吉花:7": {
    "trainerId": "gym:卡洛斯地区:葛吉花:7",
    "trainerNameZh": "葛吉花",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 25,
    "preferredSpeciesTotalHits": 69,
    "zeroPreferredHitTeamCount": 11,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "trick-room",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "support",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 3,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:帕底亚地区:古鲁夏:8": {
    "trainerId": "gym:帕底亚地区:古鲁夏:8",
    "trainerNameZh": "古鲁夏",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 30,
    "preferredSpeciesTotalHits": 123,
    "zeroPreferredHitTeamCount": 6,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "rain",
      "snow",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 22,
    "expandedPreferredSpeciesCount": 18
  },
  "elite4:阿罗拉地区:哈拉:1": {
    "trainerId": "elite4:阿罗拉地区:哈拉:1",
    "trainerNameZh": "哈拉",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 29,
    "preferredSpeciesTotalHits": 89,
    "zeroPreferredHitTeamCount": 7,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sun",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 5,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:帕底亚地区:海岱:4": {
    "trainerId": "gym:帕底亚地区:海岱:4",
    "trainerNameZh": "海岱",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 31,
    "preferredSpeciesTotalHits": 125,
    "zeroPreferredHitTeamCount": 5,
    "fallbackTeamCount": 15,
    "warningCount": 11,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sand",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 6,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:关都地区:菊子:3": {
    "trainerId": "elite4:关都地区:菊子:3",
    "trainerNameZh": "菊子",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 33,
    "preferredSpeciesTotalHits": 176,
    "zeroPreferredHitTeamCount": 3,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "poison-stall",
      "rain",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 19,
    "expandedPreferredSpeciesCount": 18
  },
  "gym:伽勒尔地区:卡芜:3": {
    "trainerId": "gym:伽勒尔地区:卡芜:3",
    "trainerNameZh": "卡芜",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 29,
    "preferredSpeciesTotalHits": 103,
    "zeroPreferredHitTeamCount": 7,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sun",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 5,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:阿罗拉地区:卡希丽:4": {
    "trainerId": "elite4:阿罗拉地区:卡希丽:4",
    "trainerNameZh": "卡希丽",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 29,
    "preferredSpeciesTotalHits": 93,
    "zeroPreferredHitTeamCount": 7,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "tailwind",
      "hazard-stack",
      "balanced"
    ],
    "aiPreference": "support",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 7,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:关都地区:科拿:1": {
    "trainerId": "elite4:关都地区:科拿:1",
    "trainerNameZh": "科拿",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 26,
    "preferredSpeciesTotalHits": 74,
    "zeroPreferredHitTeamCount": 10,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "rain",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 12,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:卡洛斯地区:可尔妮:3": {
    "trainerId": "gym:卡洛斯地区:可尔妮:3",
    "trainerNameZh": "可尔妮",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 24,
    "preferredSpeciesTotalHits": 33,
    "zeroPreferredHitTeamCount": 12,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "tailwind",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "support",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 3,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:帕底亚地区:寇沙:2": {
    "trainerId": "gym:帕底亚地区:寇沙:2",
    "trainerNameZh": "寇沙",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 26,
    "preferredSpeciesTotalHits": 88,
    "zeroPreferredHitTeamCount": 10,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "balanced",
      "setup-offense"
    ],
    "aiPreference": "balanced",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 9,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:帕底亚地区:莱姆:6": {
    "trainerId": "gym:帕底亚地区:莱姆:6",
    "trainerNameZh": "莱姆",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 33,
    "preferredSpeciesTotalHits": 132,
    "zeroPreferredHitTeamCount": 3,
    "fallbackTeamCount": 15,
    "warningCount": 11,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sand",
      "trick-room",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 6,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:阿罗拉地区:丽姿:2": {
    "trainerId": "elite4:阿罗拉地区:丽姿:2",
    "trainerNameZh": "丽姿",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 26,
    "preferredSpeciesTotalHits": 82,
    "zeroPreferredHitTeamCount": 10,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sand",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 8,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:帕底亚地区:莉普:7": {
    "trainerId": "gym:帕底亚地区:莉普:7",
    "trainerNameZh": "莉普",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 32,
    "preferredSpeciesTotalHits": 115,
    "zeroPreferredHitTeamCount": 4,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "trick-room",
      "sun",
      "balanced"
    ],
    "aiPreference": "support",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 6,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:伽勒尔地区:露璃娜:2": {
    "trainerId": "gym:伽勒尔地区:露璃娜:2",
    "trainerNameZh": "露璃娜",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 29,
    "preferredSpeciesTotalHits": 91,
    "zeroPreferredHitTeamCount": 7,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "hazard-stack",
      "poison-stall",
      "balanced"
    ],
    "aiPreference": "support",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 9,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:阿罗拉地区:马睿因:5": {
    "trainerId": "elite4:阿罗拉地区:马睿因:5",
    "trainerNameZh": "马睿因",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 29,
    "preferredSpeciesTotalHits": 153,
    "zeroPreferredHitTeamCount": 7,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sand",
      "terrain",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 5,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:伽勒尔地区:玛瓜:7": {
    "trainerId": "gym:伽勒尔地区:玛瓜:7",
    "trainerNameZh": "玛瓜",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 28,
    "preferredSpeciesTotalHits": 92,
    "zeroPreferredHitTeamCount": 8,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sand",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 5,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:卡洛斯地区:玛绣:6": {
    "trainerId": "gym:卡洛斯地区:玛绣:6",
    "trainerNameZh": "玛绣",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 23,
    "preferredSpeciesTotalHits": 33,
    "zeroPreferredHitTeamCount": 13,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "balanced",
      "setup-offense"
    ],
    "aiPreference": "balanced",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 4,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:伽勒尔地区:美蓉:8": {
    "trainerId": "gym:伽勒尔地区:美蓉:8",
    "trainerNameZh": "美蓉",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 27,
    "preferredSpeciesTotalHits": 100,
    "zeroPreferredHitTeamCount": 9,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "snow",
      "rain",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 5,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:伽勒尔地区:聂梓:9": {
    "trainerId": "gym:伽勒尔地区:聂梓:9",
    "trainerNameZh": "聂梓",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 30,
    "preferredSpeciesTotalHits": 117,
    "zeroPreferredHitTeamCount": 6,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "hazard-stack",
      "poison-stall",
      "balanced"
    ],
    "aiPreference": "support",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 10,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:伽勒尔地区:欧尼奥:5": {
    "trainerId": "gym:伽勒尔地区:欧尼奥:5",
    "trainerNameZh": "欧尼奥",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 25,
    "preferredSpeciesTotalHits": 45,
    "zeroPreferredHitTeamCount": 11,
    "fallbackTeamCount": 15,
    "warningCount": 24,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "rain",
      "sun",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 8,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:卡洛斯地区:帕琦拉:1": {
    "trainerId": "elite4:卡洛斯地区:帕琦拉:1",
    "trainerNameZh": "帕琦拉",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 28,
    "preferredSpeciesTotalHits": 154,
    "zeroPreferredHitTeamCount": 8,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sun",
      "rain",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 4,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:伽勒尔地区:奇巴纳:10": {
    "trainerId": "gym:伽勒尔地区:奇巴纳:10",
    "trainerNameZh": "奇巴纳",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 30,
    "preferredSpeciesTotalHits": 166,
    "zeroPreferredHitTeamCount": 6,
    "fallbackTeamCount": 15,
    "warningCount": 10,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "setup-offense",
      "sand",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 27,
    "expandedPreferredSpeciesCount": 18
  },
  "gym:帕底亚地区:奇树:3": {
    "trainerId": "gym:帕底亚地区:奇树:3",
    "trainerNameZh": "奇树",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 24,
    "preferredSpeciesTotalHits": 83,
    "zeroPreferredHitTeamCount": 12,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "terrain",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "support",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 8,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:卡洛斯地区:希特隆:5": {
    "trainerId": "gym:卡洛斯地区:希特隆:5",
    "trainerNameZh": "希特隆",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 17,
    "preferredSpeciesTotalHits": 22,
    "zeroPreferredHitTeamCount": 19,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "terrain",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "support",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 3,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:伽勒尔地区:亚洛:1": {
    "trainerId": "gym:伽勒尔地区:亚洛:1",
    "trainerNameZh": "亚洛",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 30,
    "preferredSpeciesTotalHits": 93,
    "zeroPreferredHitTeamCount": 6,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "rain",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 8,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:卡洛斯地区:雁铠:3": {
    "trainerId": "elite4:卡洛斯地区:雁铠:3",
    "trainerNameZh": "雁铠",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 29,
    "preferredSpeciesTotalHits": 147,
    "zeroPreferredHitTeamCount": 7,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "balanced",
      "setup-offense"
    ],
    "aiPreference": "balanced",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 4,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:卡洛斯地区:志米:2": {
    "trainerId": "elite4:卡洛斯地区:志米:2",
    "trainerNameZh": "志米",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 29,
    "preferredSpeciesTotalHits": 156,
    "zeroPreferredHitTeamCount": 7,
    "fallbackTeamCount": 15,
    "warningCount": 23,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sand",
      "rain",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 4,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:卡洛斯地区:紫罗兰:1": {
    "trainerId": "gym:卡洛斯地区:紫罗兰:1",
    "trainerNameZh": "紫罗兰",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 20,
    "preferredSpeciesTotalHits": 28,
    "zeroPreferredHitTeamCount": 16,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "balanced",
      "setup-offense"
    ],
    "aiPreference": "balanced",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 2,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:神奥地区:阿柳:1": {
    "trainerId": "elite4:神奥地区:阿柳:1",
    "trainerNameZh": "阿柳",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 29,
    "preferredSpeciesTotalHits": 97,
    "zeroPreferredHitTeamCount": 7,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "hazard-stack",
      "poison-stall",
      "balanced"
    ],
    "aiPreference": "support",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 8,
    "expandedPreferredSpeciesCount": 12
  },
  "champion:合众地区:阿戴克:1": {
    "trainerId": "champion:合众地区:阿戴克:1",
    "trainerNameZh": "阿戴克",
    "trainerType": "champion",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 31,
    "preferredSpeciesTotalHits": 121,
    "zeroPreferredHitTeamCount": 5,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sun",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "balanced",
    "aiLevel": "champion",
    "powerProfile": "champion",
    "originalPreferredSpeciesCount": 6,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:蓝莓学园:纳莉:2": {
    "trainerId": "elite4:蓝莓学园:纳莉:2",
    "trainerNameZh": "纳莉",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 29,
    "preferredSpeciesTotalHits": 166,
    "zeroPreferredHitTeamCount": 7,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "hazard-stack",
      "sand",
      "balanced"
    ],
    "aiPreference": "support",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 6,
    "expandedPreferredSpeciesCount": 12
  },
  "villain:彩虹火箭队:水梧桐:3": {
    "trainerId": "villain:彩虹火箭队:水梧桐:3",
    "trainerNameZh": "水梧桐",
    "trainerType": "villain",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 36,
    "preferredSpeciesTotalHits": 191,
    "zeroPreferredHitTeamCount": 0,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "poison-stall",
      "rain",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "champion",
    "powerProfile": "champion",
    "originalPreferredSpeciesCount": 6,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:神奥地区:菊野:2": {
    "trainerId": "elite4:神奥地区:菊野:2",
    "trainerNameZh": "菊野",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 27,
    "preferredSpeciesTotalHits": 104,
    "zeroPreferredHitTeamCount": 9,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sand",
      "snow",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 9,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:关都地区:夏伯:8": {
    "trainerId": "gym:关都地区:夏伯:8",
    "trainerNameZh": "夏伯",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 31,
    "preferredSpeciesTotalHits": 131,
    "zeroPreferredHitTeamCount": 5,
    "fallbackTeamCount": 15,
    "warningCount": 11,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sun",
      "sand",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 18,
    "expandedPreferredSpeciesCount": 18
  },
  "gym:关都地区:青绿:10": {
    "trainerId": "gym:关都地区:青绿:10",
    "trainerNameZh": "青绿",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 36,
    "preferredSpeciesTotalHits": 190,
    "zeroPreferredHitTeamCount": 0,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sun",
      "sand",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 12,
    "expandedPreferredSpeciesCount": 12
  },
  "champion:关都地区:小茂-青绿:1": {
    "trainerId": "champion:关都地区:小茂-青绿:1",
    "trainerNameZh": "小茂 / 青绿",
    "trainerType": "champion",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 36,
    "preferredSpeciesTotalHits": 191,
    "zeroPreferredHitTeamCount": 0,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sun",
      "sand",
      "balanced"
    ],
    "aiPreference": "balanced",
    "aiLevel": "champion",
    "powerProfile": "champion",
    "originalPreferredSpeciesCount": 12,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:丰缘地区:藤树:2": {
    "trainerId": "gym:丰缘地区:藤树:2",
    "trainerNameZh": "藤树",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 25,
    "preferredSpeciesTotalHits": 77,
    "zeroPreferredHitTeamCount": 11,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 9,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:关都地区:小刚:1": {
    "trainerId": "gym:关都地区:小刚:1",
    "trainerNameZh": "小刚",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 19,
    "preferredSpeciesTotalHits": 67,
    "zeroPreferredHitTeamCount": 17,
    "fallbackTeamCount": 15,
    "warningCount": 9,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sand",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 10,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:关都地区:希巴:2": {
    "trainerId": "elite4:关都地区:希巴:2",
    "trainerNameZh": "希巴",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 26,
    "preferredSpeciesTotalHits": 85,
    "zeroPreferredHitTeamCount": 10,
    "fallbackTeamCount": 15,
    "warningCount": 9,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sand",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 11,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:城都地区:希巴:3": {
    "trainerId": "elite4:城都地区:希巴:3",
    "trainerNameZh": "希巴",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 27,
    "preferredSpeciesTotalHits": 86,
    "zeroPreferredHitTeamCount": 9,
    "fallbackTeamCount": 15,
    "warningCount": 9,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sand",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 11,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:合众地区:哈奇库:11": {
    "trainerId": "gym:合众地区:哈奇库:11",
    "trainerNameZh": "哈奇库",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 20,
    "preferredSpeciesTotalHits": 25,
    "zeroPreferredHitTeamCount": 16,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "snow",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 3,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:城都地区:阿笔:2": {
    "trainerId": "gym:城都地区:阿笔:2",
    "trainerNameZh": "阿笔",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 27,
    "preferredSpeciesTotalHits": 79,
    "zeroPreferredHitTeamCount": 9,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "hazard-stack",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "support",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 10,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:合众地区:亚堤:7": {
    "trainerId": "gym:合众地区:亚堤:7",
    "trainerNameZh": "亚堤",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 10,
    "preferredSpeciesTotalHits": 11,
    "zeroPreferredHitTeamCount": 26,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "hazard-stack",
      "sand",
      "balanced"
    ],
    "aiPreference": "support",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 6,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:神奥地区:东瓜:6": {
    "trainerId": "gym:神奥地区:东瓜:6",
    "trainerNameZh": "东瓜",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 29,
    "preferredSpeciesTotalHits": 90,
    "zeroPreferredHitTeamCount": 7,
    "fallbackTeamCount": 15,
    "warningCount": 9,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sand",
      "hazard-stack",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 14,
    "expandedPreferredSpeciesCount": 14
  },
  "elite4:合众地区:嘉德丽雅:4": {
    "trainerId": "elite4:合众地区:嘉德丽雅:4",
    "trainerNameZh": "嘉德丽雅",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 25,
    "preferredSpeciesTotalHits": 89,
    "zeroPreferredHitTeamCount": 11,
    "fallbackTeamCount": 15,
    "warningCount": 9,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "trick-room",
      "sand",
      "balanced"
    ],
    "aiPreference": "support",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 8,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:神奥地区:小菘:7": {
    "trainerId": "gym:神奥地区:小菘:7",
    "trainerNameZh": "小菘",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 36,
    "preferredSpeciesTotalHits": 162,
    "zeroPreferredHitTeamCount": 0,
    "fallbackTeamCount": 15,
    "warningCount": 12,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "snow",
      "rain",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 17,
    "expandedPreferredSpeciesCount": 17
  },
  "gym:合众地区:黑连:5": {
    "trainerId": "gym:合众地区:黑连:5",
    "trainerNameZh": "黑连",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 4,
    "preferredSpeciesTotalHits": 6,
    "zeroPreferredHitTeamCount": 32,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "balanced",
      "setup-offense"
    ],
    "aiPreference": "balanced",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 4,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:合众地区:伯特:2": {
    "trainerId": "gym:合众地区:伯特:2",
    "trainerNameZh": "伯特",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 7,
    "preferredSpeciesTotalHits": 9,
    "zeroPreferredHitTeamCount": 29,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "balanced",
      "setup-offense"
    ],
    "aiPreference": "balanced",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 2,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:城都地区:阿四:5": {
    "trainerId": "gym:城都地区:阿四:5",
    "trainerNameZh": "阿四",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 27,
    "preferredSpeciesTotalHits": 85,
    "zeroPreferredHitTeamCount": 9,
    "fallbackTeamCount": 15,
    "warningCount": 18,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sand",
      "sun",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 9,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:合众地区:天桐:1": {
    "trainerId": "gym:合众地区:天桐:1",
    "trainerNameZh": "天桐",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 5,
    "preferredSpeciesTotalHits": 6,
    "zeroPreferredHitTeamCount": 31,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "balanced",
      "setup-offense"
    ],
    "aiPreference": "balanced",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 2,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:城都地区:小椿:8": {
    "trainerId": "gym:城都地区:小椿:8",
    "trainerNameZh": "小椿",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 29,
    "preferredSpeciesTotalHits": 97,
    "zeroPreferredHitTeamCount": 7,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "setup-offense",
      "rain",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 6,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:合众地区:菊老大:9": {
    "trainerId": "gym:合众地区:菊老大:9",
    "trainerNameZh": "菊老大",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 22,
    "preferredSpeciesTotalHits": 26,
    "zeroPreferredHitTeamCount": 14,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sand",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 5,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:神奥地区:吉宪:4": {
    "trainerId": "gym:神奥地区:吉宪:4",
    "trainerNameZh": "吉宪",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 30,
    "preferredSpeciesTotalHits": 98,
    "zeroPreferredHitTeamCount": 6,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "rain",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 13,
    "expandedPreferredSpeciesCount": 13
  },
  "gym:合众地区:寇恩:3": {
    "trainerId": "gym:合众地区:寇恩:3",
    "trainerNameZh": "寇恩",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 4,
    "preferredSpeciesTotalHits": 4,
    "zeroPreferredHitTeamCount": 32,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "rain",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 2,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:蓝莓学园:赤松:1": {
    "trainerId": "elite4:蓝莓学园:赤松:1",
    "trainerNameZh": "赤松",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 27,
    "preferredSpeciesTotalHits": 162,
    "zeroPreferredHitTeamCount": 9,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sun",
      "tailwind",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 6,
    "expandedPreferredSpeciesCount": 12
  },
  "champion:神奥地区:竹兰:1": {
    "trainerId": "champion:神奥地区:竹兰:1",
    "trainerNameZh": "竹兰",
    "trainerType": "champion",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 30,
    "preferredSpeciesTotalHits": 125,
    "zeroPreferredHitTeamCount": 6,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "setup-offense",
      "hazard-stack",
      "balanced"
    ],
    "aiPreference": "balanced",
    "aiLevel": "champion",
    "powerProfile": "champion",
    "originalPreferredSpeciesCount": 6,
    "expandedPreferredSpeciesCount": 12
  },
  "villain:彩虹火箭队:赤日:4": {
    "trainerId": "villain:彩虹火箭队:赤日:4",
    "trainerNameZh": "赤日",
    "trainerType": "villain",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 36,
    "preferredSpeciesTotalHits": 189,
    "zeroPreferredHitTeamCount": 0,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "poison-stall",
      "rain",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "champion",
    "powerProfile": "champion",
    "originalPreferredSpeciesCount": 6,
    "expandedPreferredSpeciesCount": 12
  },
  "champion:卡洛斯地区:卡露妮:1": {
    "trainerId": "champion:卡洛斯地区:卡露妮:1",
    "trainerNameZh": "卡露妮",
    "trainerType": "champion",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 24,
    "preferredSpeciesTotalHits": 67,
    "zeroPreferredHitTeamCount": 12,
    "fallbackTeamCount": 15,
    "warningCount": 10,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "snow",
      "tailwind",
      "balanced"
    ],
    "aiPreference": "balanced",
    "aiLevel": "champion",
    "powerProfile": "champion",
    "originalPreferredSpeciesCount": 6,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:丰缘地区:源治:4": {
    "trainerId": "elite4:丰缘地区:源治:4",
    "trainerNameZh": "源治",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 27,
    "preferredSpeciesTotalHits": 90,
    "zeroPreferredHitTeamCount": 9,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "setup-offense",
      "poison-stall",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 7,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:合众地区:夏卡:12": {
    "trainerId": "gym:合众地区:夏卡:12",
    "trainerNameZh": "夏卡",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 16,
    "preferredSpeciesTotalHits": 20,
    "zeroPreferredHitTeamCount": 20,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 4,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:蓝莓学园:杜若:4": {
    "trainerId": "elite4:蓝莓学园:杜若:4",
    "trainerNameZh": "杜若",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 36,
    "preferredSpeciesTotalHits": 182,
    "zeroPreferredHitTeamCount": 0,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "setup-offense",
      "rain",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 7,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:合众地区:小菊儿:8": {
    "trainerId": "gym:合众地区:小菊儿:8",
    "trainerNameZh": "小菊儿",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 9,
    "preferredSpeciesTotalHits": 10,
    "zeroPreferredHitTeamCount": 27,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "hazard-stack",
      "terrain",
      "balanced"
    ],
    "aiPreference": "support",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 5,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:关都地区:莉佳:4": {
    "trainerId": "gym:关都地区:莉佳:4",
    "trainerNameZh": "莉佳",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 26,
    "preferredSpeciesTotalHits": 78,
    "zeroPreferredHitTeamCount": 10,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "terrain",
      "hazard-stack",
      "balanced"
    ],
    "aiPreference": "support",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 12,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:城都地区:阿速:1": {
    "trainerId": "gym:城都地区:阿速:1",
    "trainerNameZh": "阿速",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 23,
    "preferredSpeciesTotalHits": 74,
    "zeroPreferredHitTeamCount": 13,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "tailwind",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "support",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 10,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:神奥地区:梅丽莎:5": {
    "trainerId": "gym:神奥地区:梅丽莎:5",
    "trainerNameZh": "梅丽莎",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 28,
    "preferredSpeciesTotalHits": 90,
    "zeroPreferredHitTeamCount": 8,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "setup-offense",
      "snow",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 14,
    "expandedPreferredSpeciesCount": 14
  },
  "gym:丰缘地区:亚莎:4": {
    "trainerId": "gym:丰缘地区:亚莎:4",
    "trainerNameZh": "亚莎",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 31,
    "preferredSpeciesTotalHits": 82,
    "zeroPreferredHitTeamCount": 5,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sun",
      "hazard-stack",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 11,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:神奥地区:大叶:3": {
    "trainerId": "elite4:神奥地区:大叶:3",
    "trainerNameZh": "大叶",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 31,
    "preferredSpeciesTotalHits": 123,
    "zeroPreferredHitTeamCount": 5,
    "fallbackTeamCount": 15,
    "warningCount": 11,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sun",
      "sand",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 10,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:神奥地区:菜种:2": {
    "trainerId": "gym:神奥地区:菜种:2",
    "trainerNameZh": "菜种",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 28,
    "preferredSpeciesTotalHits": 108,
    "zeroPreferredHitTeamCount": 8,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "terrain",
      "sun",
      "balanced"
    ],
    "aiPreference": "support",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 19,
    "expandedPreferredSpeciesCount": 18
  },
  "champion:帕底亚地区:也慈:1": {
    "trainerId": "champion:帕底亚地区:也慈:1",
    "trainerNameZh": "也慈",
    "trainerType": "champion",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 26,
    "preferredSpeciesTotalHits": 87,
    "zeroPreferredHitTeamCount": 10,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "balanced",
      "setup-offense"
    ],
    "aiPreference": "balanced",
    "aiLevel": "champion",
    "powerProfile": "champion",
    "originalPreferredSpeciesCount": 0,
    "expandedPreferredSpeciesCount": 12
  },
  "villain:彩虹火箭队:魁奇思:5": {
    "trainerId": "villain:彩虹火箭队:魁奇思:5",
    "trainerNameZh": "魁奇思",
    "trainerType": "villain",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 36,
    "preferredSpeciesTotalHits": 189,
    "zeroPreferredHitTeamCount": 0,
    "fallbackTeamCount": 15,
    "warningCount": 10,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "setup-offense",
      "rain",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "champion",
    "powerProfile": "champion",
    "originalPreferredSpeciesCount": 6,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:关都地区:坂木:9": {
    "trainerId": "gym:关都地区:坂木:9",
    "trainerNameZh": "坂木",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 24,
    "preferredSpeciesTotalHits": 74,
    "zeroPreferredHitTeamCount": 12,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 6,
    "expandedPreferredSpeciesCount": 12
  },
  "villain:彩虹火箭队:坂木:1": {
    "trainerId": "villain:彩虹火箭队:坂木:1",
    "trainerNameZh": "坂木",
    "trainerType": "villain",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 33,
    "preferredSpeciesTotalHits": 162,
    "zeroPreferredHitTeamCount": 3,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "setup-offense",
      "rain",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "champion",
    "powerProfile": "champion",
    "originalPreferredSpeciesCount": 6,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:丰缘地区:波妮:3": {
    "trainerId": "elite4:丰缘地区:波妮:3",
    "trainerNameZh": "波妮",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 28,
    "preferredSpeciesTotalHits": 87,
    "zeroPreferredHitTeamCount": 8,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "snow",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 7,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:合众地区:越橘:1": {
    "trainerId": "elite4:合众地区:越橘:1",
    "trainerNameZh": "越橘",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 29,
    "preferredSpeciesTotalHits": 92,
    "zeroPreferredHitTeamCount": 7,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sand",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 10,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:帕底亚地区:八朔:4": {
    "trainerId": "elite4:帕底亚地区:八朔:4",
    "trainerNameZh": "八朔",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 27,
    "preferredSpeciesTotalHits": 102,
    "zeroPreferredHitTeamCount": 9,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "setup-offense",
      "poison-stall",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 7,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:合众地区:艾莉丝:13": {
    "trainerId": "gym:合众地区:艾莉丝:13",
    "trainerNameZh": "艾莉丝",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 21,
    "preferredSpeciesTotalHits": 69,
    "zeroPreferredHitTeamCount": 15,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "setup-offense",
      "rain",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 7,
    "expandedPreferredSpeciesCount": 12
  },
  "champion:合众地区:艾莉丝:2": {
    "trainerId": "champion:合众地区:艾莉丝:2",
    "trainerNameZh": "艾莉丝",
    "trainerType": "champion",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 30,
    "preferredSpeciesTotalHits": 120,
    "zeroPreferredHitTeamCount": 6,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "setup-offense",
      "rain",
      "balanced"
    ],
    "aiPreference": "balanced",
    "aiLevel": "champion",
    "powerProfile": "champion",
    "originalPreferredSpeciesCount": 7,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:关都地区:阿杏:6": {
    "trainerId": "gym:关都地区:阿杏:6",
    "trainerNameZh": "阿杏",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 26,
    "preferredSpeciesTotalHits": 83,
    "zeroPreferredHitTeamCount": 10,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "poison-stall",
      "hazard-stack",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 6,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:城都地区:阿蜜:6": {
    "trainerId": "gym:城都地区:阿蜜:6",
    "trainerNameZh": "阿蜜",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 27,
    "preferredSpeciesTotalHits": 89,
    "zeroPreferredHitTeamCount": 9,
    "fallbackTeamCount": 15,
    "warningCount": 9,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sand",
      "hazard-stack",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 7,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:丰缘地区:亚当:9": {
    "trainerId": "gym:丰缘地区:亚当:9",
    "trainerNameZh": "亚当",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 26,
    "preferredSpeciesTotalHits": 83,
    "zeroPreferredHitTeamCount": 10,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "rain",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 12,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:城都地区:梨花:4": {
    "trainerId": "elite4:城都地区:梨花:4",
    "trainerNameZh": "梨花",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 27,
    "preferredSpeciesTotalHits": 93,
    "zeroPreferredHitTeamCount": 9,
    "fallbackTeamCount": 15,
    "warningCount": 18,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sand",
      "snow",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 9,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:关都地区:阿桔:5": {
    "trainerId": "gym:关都地区:阿桔:5",
    "trainerNameZh": "阿桔",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 31,
    "preferredSpeciesTotalHits": 91,
    "zeroPreferredHitTeamCount": 5,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "poison-stall",
      "hazard-stack",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 13,
    "expandedPreferredSpeciesCount": 13
  },
  "elite4:城都地区:阿桔:2": {
    "trainerId": "elite4:城都地区:阿桔:2",
    "trainerNameZh": "阿桔",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 27,
    "preferredSpeciesTotalHits": 84,
    "zeroPreferredHitTeamCount": 9,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "poison-stall",
      "hazard-stack",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 13,
    "expandedPreferredSpeciesCount": 13
  },
  "champion:阿罗拉地区:库库伊:1": {
    "trainerId": "champion:阿罗拉地区:库库伊:1",
    "trainerNameZh": "库库伊",
    "trainerType": "champion",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 26,
    "preferredSpeciesTotalHits": 91,
    "zeroPreferredHitTeamCount": 10,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "balanced",
      "setup-offense"
    ],
    "aiPreference": "balanced",
    "aiLevel": "champion",
    "powerProfile": "champion",
    "originalPreferredSpeciesCount": 0,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:蓝莓学园:紫竽:3": {
    "trainerId": "elite4:蓝莓学园:紫竽:3",
    "trainerNameZh": "紫竽",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 36,
    "preferredSpeciesTotalHits": 185,
    "zeroPreferredHitTeamCount": 0,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sand",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 6,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:关都地区:阿渡:4": {
    "trainerId": "elite4:关都地区:阿渡:4",
    "trainerNameZh": "阿渡",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 28,
    "preferredSpeciesTotalHits": 93,
    "zeroPreferredHitTeamCount": 8,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "setup-offense",
      "rain",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 8,
    "expandedPreferredSpeciesCount": 12
  },
  "champion:城都地区:阿渡:1": {
    "trainerId": "champion:城都地区:阿渡:1",
    "trainerNameZh": "阿渡",
    "trainerType": "champion",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 27,
    "preferredSpeciesTotalHits": 93,
    "zeroPreferredHitTeamCount": 9,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "setup-offense",
      "rain",
      "balanced"
    ],
    "aiPreference": "balanced",
    "aiLevel": "champion",
    "powerProfile": "champion",
    "originalPreferredSpeciesCount": 8,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:帕底亚地区:青木:5": {
    "trainerId": "gym:帕底亚地区:青木:5",
    "trainerNameZh": "青木",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 26,
    "preferredSpeciesTotalHits": 85,
    "zeroPreferredHitTeamCount": 10,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 11,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:帕底亚地区:青木:3": {
    "trainerId": "elite4:帕底亚地区:青木:3",
    "trainerNameZh": "青木",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 26,
    "preferredSpeciesTotalHits": 90,
    "zeroPreferredHitTeamCount": 10,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 11,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:合众地区:芦荟:4": {
    "trainerId": "gym:合众地区:芦荟:4",
    "trainerNameZh": "芦荟",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 8,
    "preferredSpeciesTotalHits": 8,
    "zeroPreferredHitTeamCount": 28,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "balanced",
      "setup-offense"
    ],
    "aiPreference": "balanced",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 3,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:关都地区:马志士:3": {
    "trainerId": "gym:关都地区:马志士:3",
    "trainerNameZh": "马志士",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 25,
    "preferredSpeciesTotalHits": 75,
    "zeroPreferredHitTeamCount": 11,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "terrain",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "support",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 12,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:神奥地区:悟松:4": {
    "trainerId": "elite4:神奥地区:悟松:4",
    "trainerNameZh": "悟松",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 27,
    "preferredSpeciesTotalHits": 102,
    "zeroPreferredHitTeamCount": 9,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "trick-room",
      "sun",
      "balanced"
    ],
    "aiPreference": "support",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 11,
    "expandedPreferredSpeciesCount": 12
  },
  "villain:彩虹火箭队:露莎米奈:7": {
    "trainerId": "villain:彩虹火箭队:露莎米奈:7",
    "trainerNameZh": "露莎米奈",
    "trainerType": "villain",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 36,
    "preferredSpeciesTotalHits": 189,
    "zeroPreferredHitTeamCount": 0,
    "fallbackTeamCount": 15,
    "warningCount": 24,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "rain",
      "sand",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "champion",
    "powerProfile": "champion",
    "originalPreferredSpeciesCount": 6,
    "expandedPreferredSpeciesCount": 12
  },
  "villain:彩虹火箭队:弗拉达利:6": {
    "trainerId": "villain:彩虹火箭队:弗拉达利:6",
    "trainerNameZh": "弗拉达利",
    "trainerType": "villain",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 36,
    "preferredSpeciesTotalHits": 189,
    "zeroPreferredHitTeamCount": 0,
    "fallbackTeamCount": 15,
    "warningCount": 24,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "rain",
      "sand",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "champion",
    "powerProfile": "champion",
    "originalPreferredSpeciesCount": 6,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:合众地区:西子伊:14": {
    "trainerId": "gym:合众地区:西子伊:14",
    "trainerNameZh": "西子伊",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 10,
    "preferredSpeciesTotalHits": 16,
    "zeroPreferredHitTeamCount": 26,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "snow",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 4,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:合众地区:连武:2": {
    "trainerId": "elite4:合众地区:连武:2",
    "trainerNameZh": "连武",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 29,
    "preferredSpeciesTotalHits": 94,
    "zeroPreferredHitTeamCount": 7,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "setup-offense",
      "hazard-stack",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 9,
    "expandedPreferredSpeciesCount": 12
  },
  "villain:彩虹火箭队:赤焰松:2": {
    "trainerId": "villain:彩虹火箭队:赤焰松:2",
    "trainerNameZh": "赤焰松",
    "trainerType": "villain",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 31,
    "preferredSpeciesTotalHits": 155,
    "zeroPreferredHitTeamCount": 5,
    "fallbackTeamCount": 15,
    "warningCount": 14,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "poison-stall",
      "sand",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "champion",
    "powerProfile": "champion",
    "originalPreferredSpeciesCount": 6,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:神奥地区:阿李:3": {
    "trainerId": "gym:神奥地区:阿李:3",
    "trainerNameZh": "阿李",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 26,
    "preferredSpeciesTotalHits": 91,
    "zeroPreferredHitTeamCount": 10,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "setup-offense",
      "sun",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 13,
    "expandedPreferredSpeciesCount": 13
  },
  "gym:关都地区:小霞:2": {
    "trainerId": "gym:关都地区:小霞:2",
    "trainerNameZh": "小霞",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 28,
    "preferredSpeciesTotalHits": 88,
    "zeroPreferredHitTeamCount": 8,
    "fallbackTeamCount": 15,
    "warningCount": 9,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "rain",
      "sand",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 12,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:城都地区:松叶:4": {
    "trainerId": "gym:城都地区:松叶:4",
    "trainerNameZh": "松叶",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 25,
    "preferredSpeciesTotalHits": 86,
    "zeroPreferredHitTeamCount": 11,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "trick-room",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "support",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 7,
    "expandedPreferredSpeciesCount": 12
  },
  "champion:帕底亚地区:妮莫:2": {
    "trainerId": "champion:帕底亚地区:妮莫:2",
    "trainerNameZh": "妮莫",
    "trainerType": "champion",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 25,
    "preferredSpeciesTotalHits": 88,
    "zeroPreferredHitTeamCount": 11,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "balanced",
      "setup-offense"
    ],
    "aiPreference": "balanced",
    "aiLevel": "champion",
    "powerProfile": "champion",
    "originalPreferredSpeciesCount": 0,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:丰缘地区:千里:5": {
    "trainerId": "gym:丰缘地区:千里:5",
    "trainerNameZh": "千里",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 23,
    "preferredSpeciesTotalHits": 74,
    "zeroPreferredHitTeamCount": 13,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "balanced",
      "setup-offense"
    ],
    "aiPreference": "balanced",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 9,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:丰缘地区:芙蓉:2": {
    "trainerId": "elite4:丰缘地区:芙蓉:2",
    "trainerNameZh": "芙蓉",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 27,
    "preferredSpeciesTotalHits": 93,
    "zeroPreferredHitTeamCount": 9,
    "fallbackTeamCount": 15,
    "warningCount": 19,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "rain",
      "sun",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 7,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:帕底亚地区:波琵:2": {
    "trainerId": "elite4:帕底亚地区:波琵:2",
    "trainerNameZh": "波琵",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 27,
    "preferredSpeciesTotalHits": 95,
    "zeroPreferredHitTeamCount": 9,
    "fallbackTeamCount": 15,
    "warningCount": 9,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sand",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 6,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:城都地区:柳伯:7": {
    "trainerId": "gym:城都地区:柳伯:7",
    "trainerNameZh": "柳伯",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 29,
    "preferredSpeciesTotalHits": 98,
    "zeroPreferredHitTeamCount": 7,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "snow",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 13,
    "expandedPreferredSpeciesCount": 13
  },
  "champion:关都地区:赤红:2": {
    "trainerId": "champion:关都地区:赤红:2",
    "trainerNameZh": "赤红",
    "trainerType": "champion",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 36,
    "preferredSpeciesTotalHits": 182,
    "zeroPreferredHitTeamCount": 0,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "rain",
      "sun",
      "balanced"
    ],
    "aiPreference": "balanced",
    "aiLevel": "champion",
    "powerProfile": "champion",
    "originalPreferredSpeciesCount": 6,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:帕底亚地区:辛俐:1": {
    "trainerId": "elite4:帕底亚地区:辛俐:1",
    "trainerNameZh": "辛俐",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 28,
    "preferredSpeciesTotalHits": 96,
    "zeroPreferredHitTeamCount": 8,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "poison-stall",
      "sun",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 6,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:神奥地区:瓢太:1": {
    "trainerId": "gym:神奥地区:瓢太:1",
    "trainerNameZh": "瓢太",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 28,
    "preferredSpeciesTotalHits": 91,
    "zeroPreferredHitTeamCount": 8,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sand",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 14,
    "expandedPreferredSpeciesCount": 14
  },
  "gym:丰缘地区:杜娟:1": {
    "trainerId": "gym:丰缘地区:杜娟:1",
    "trainerNameZh": "杜娟",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 25,
    "preferredSpeciesTotalHits": 77,
    "zeroPreferredHitTeamCount": 11,
    "fallbackTeamCount": 15,
    "warningCount": 9,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sand",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 10,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:合众地区:霍米加:6": {
    "trainerId": "gym:合众地区:霍米加:6",
    "trainerNameZh": "霍米加",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 9,
    "preferredSpeciesTotalHits": 10,
    "zeroPreferredHitTeamCount": 27,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "hazard-stack",
      "poison-stall",
      "balanced"
    ],
    "aiPreference": "support",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 5,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:关都地区:娜姿:7": {
    "trainerId": "gym:关都地区:娜姿:7",
    "trainerNameZh": "娜姿",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 28,
    "preferredSpeciesTotalHits": 82,
    "zeroPreferredHitTeamCount": 8,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "trick-room",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "support",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 11,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:合众地区:婉龙:3": {
    "trainerId": "elite4:合众地区:婉龙:3",
    "trainerNameZh": "婉龙",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 29,
    "preferredSpeciesTotalHits": 90,
    "zeroPreferredHitTeamCount": 7,
    "fallbackTeamCount": 15,
    "warningCount": 24,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "snow",
      "rain",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 9,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:丰缘地区:花月:1": {
    "trainerId": "elite4:丰缘地区:花月:1",
    "trainerNameZh": "花月",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 28,
    "preferredSpeciesTotalHits": 86,
    "zeroPreferredHitTeamCount": 8,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 9,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:合众地区:风露:10": {
    "trainerId": "gym:合众地区:风露:10",
    "trainerNameZh": "风露",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 19,
    "preferredSpeciesTotalHits": 66,
    "zeroPreferredHitTeamCount": 17,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "tailwind",
      "hazard-stack",
      "balanced"
    ],
    "aiPreference": "support",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 5,
    "expandedPreferredSpeciesCount": 12
  },
  "champion:丰缘地区:大吾:1": {
    "trainerId": "champion:丰缘地区:大吾:1",
    "trainerNameZh": "大吾",
    "trainerType": "champion",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 31,
    "preferredSpeciesTotalHits": 128,
    "zeroPreferredHitTeamCount": 5,
    "fallbackTeamCount": 15,
    "warningCount": 11,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sand",
      "hazard-stack",
      "balanced"
    ],
    "aiPreference": "balanced",
    "aiLevel": "champion",
    "powerProfile": "champion",
    "originalPreferredSpeciesCount": 6,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:丰缘地区:小枫与小南:7": {
    "trainerId": "gym:丰缘地区:小枫与小南:7",
    "trainerNameZh": "小枫与小南",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 24,
    "preferredSpeciesTotalHits": 76,
    "zeroPreferredHitTeamCount": 12,
    "fallbackTeamCount": 15,
    "warningCount": 9,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "sand",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "defense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 8,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:神奥地区:电次:8": {
    "trainerId": "gym:神奥地区:电次:8",
    "trainerNameZh": "电次",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 28,
    "preferredSpeciesTotalHits": 101,
    "zeroPreferredHitTeamCount": 8,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "terrain",
      "rain",
      "balanced"
    ],
    "aiPreference": "support",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 15,
    "expandedPreferredSpeciesCount": 15
  },
  "gym:丰缘地区:米可利:8": {
    "trainerId": "gym:丰缘地区:米可利:8",
    "trainerNameZh": "米可利",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 25,
    "preferredSpeciesTotalHits": 84,
    "zeroPreferredHitTeamCount": 11,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "rain",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 9,
    "expandedPreferredSpeciesCount": 12
  },
  "champion:丰缘地区:米可利:2": {
    "trainerId": "champion:丰缘地区:米可利:2",
    "trainerNameZh": "米可利",
    "trainerType": "champion",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 28,
    "preferredSpeciesTotalHits": 87,
    "zeroPreferredHitTeamCount": 8,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "rain",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "balanced",
    "aiLevel": "champion",
    "powerProfile": "champion",
    "originalPreferredSpeciesCount": 9,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:丰缘地区:铁旋:3": {
    "trainerId": "gym:丰缘地区:铁旋:3",
    "trainerNameZh": "铁旋",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 23,
    "preferredSpeciesTotalHits": 73,
    "zeroPreferredHitTeamCount": 13,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "terrain",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "support",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 14,
    "expandedPreferredSpeciesCount": 14
  },
  "gym:城都地区:小茜:3": {
    "trainerId": "gym:城都地区:小茜:3",
    "trainerNameZh": "小茜",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 25,
    "preferredSpeciesTotalHits": 80,
    "zeroPreferredHitTeamCount": 11,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "terrain",
      "setup-offense",
      "balanced"
    ],
    "aiPreference": "support",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 8,
    "expandedPreferredSpeciesCount": 12
  },
  "elite4:城都地区:一树:1": {
    "trainerId": "elite4:城都地区:一树:1",
    "trainerNameZh": "一树",
    "trainerType": "elite4",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 27,
    "preferredSpeciesTotalHits": 94,
    "zeroPreferredHitTeamCount": 9,
    "fallbackTeamCount": 15,
    "warningCount": 15,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "trick-room",
      "terrain",
      "balanced"
    ],
    "aiPreference": "support",
    "aiLevel": "eliteFour",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 7,
    "expandedPreferredSpeciesCount": 12
  },
  "gym:丰缘地区:娜琪:6": {
    "trainerId": "gym:丰缘地区:娜琪:6",
    "trainerNameZh": "娜琪",
    "trainerType": "gym",
    "expectedCount": 36,
    "generatedCount": 36,
    "missingKeys": [],
    "ruleSetCounts": {
      "none": 9,
      "gen7": 9,
      "gen8": 9,
      "gen9": 9
    },
    "modeCounts": {
      "singles": 12,
      "doubles": 12,
      "coop": 12
    },
    "preferredSpeciesHitTeamCount": 26,
    "preferredSpeciesTotalHits": 77,
    "zeroPreferredHitTeamCount": 10,
    "fallbackTeamCount": 15,
    "warningCount": 6,
    "cleanedNoneTeamCount": 9,
    "teamPreferences": [
      "setup-offense",
      "tailwind",
      "balanced"
    ],
    "aiPreference": "offense",
    "aiLevel": "gymLeader",
    "powerProfile": "boss",
    "originalPreferredSpeciesCount": 11,
    "expandedPreferredSpeciesCount": 12
  }
} as Record<string, BossTrainerPresetMatrixSummaryData>;
