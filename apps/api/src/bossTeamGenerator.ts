import {
  generateShowdownRandomTeamV4,
  serializeShowdownTeamV4,
  type ShowdownRandomTeamGeneratorDiagnosticsV4,
  type ShowdownRandomTeamPokemonSetV4,
  type ShowdownTeamArchetypeV4,
} from "@changebattle-v2/showdown-battle-core/teamGenerator";
import type {DexTrainerDetail, DexTrainerType, ShowdownDexService} from "@changebattle-v2/showdown-dex-core";

export type BossTrainerRuleSetPresetV4 = "none" | "gen7" | "gen8" | "gen9";
type BossTrainerModeV4 = "singles" | "doubles" | "coop";
type BossTrainerRuleSetV4 = "standard" | "gen7" | "gen8" | "gen9";
type BossTrainerAiPreferenceV4 = "offense" | "defense" | "support" | "balanced";

export type BossTrainerPresetTeamDiagnosticsV4 = ShowdownRandomTeamGeneratorDiagnosticsV4 & {
  fallbackFormatId?: string;
  generationAttempts: string[];
  preferredSpeciesHitCount: number;
  cleanedSpecialSystemForNone: boolean;
  fillToSixCount: number;
};

export type BossTrainerPresetTeamV4 = {
  trainerId: string;
  trainerNameZh: string;
  trainerType: DexTrainerType;
  ruleSetPreset: BossTrainerRuleSetPresetV4;
  mode: BossTrainerModeV4;
  variantIndex: number;
  seed: string;
  teamArchetype: ShowdownTeamArchetypeV4;
  aiPreference: BossTrainerAiPreferenceV4;
  aiLevel: string;
  powerProfile: string;
  preferredSpeciesIds: string[];
  originalPreferredSpeciesIds: string[];
  pokemonSets: ShowdownRandomTeamPokemonSetV4[];
  packedTeam: string;
  exportedTeam: string;
  diagnostics: BossTrainerPresetTeamDiagnosticsV4;
};

export type BossTrainerPresetMatrixSummaryV4 = {
  trainerId: string;
  trainerNameZh: string;
  trainerType: DexTrainerType;
  expectedCount: number;
  generatedCount: number;
  missingKeys: string[];
  ruleSetCounts: Record<BossTrainerRuleSetPresetV4, number>;
};

const BOSS_TYPES = new Set<DexTrainerType>(["gym", "elite4", "champion", "villain"]);
const RULE_SET_PRESETS: BossTrainerRuleSetPresetV4[] = ["none", "gen7", "gen8", "gen9"];
const MODES: BossTrainerModeV4[] = ["singles", "doubles", "coop"];
const VARIANT_INDEXES = [1, 2, 3] as const;
const GEN7_FALLBACK_FORMAT = "[Gen 7] Random Battle";
const GENERIC_EXPANSION_SPECIES = [
  "dragonite", "gyarados", "garchomp", "metagross", "tyranitar", "lucario",
  "gardevoir", "milotic", "arcanine", "snorlax", "lapras", "crobat",
  "roserade", "weavile", "magnezone", "togekiss", "hydreigon", "volcarona",
];
const SPECIAL_SYSTEM_ITEM_PATTERN = /(ite|itex|itey|ium z|iumz|ultranecroziumz|rustedsword|rustedshield)$/i;

export async function generateBossTrainerPresetTeamsV4(
  dex: ShowdownDexService,
  input: {trainerId?: string; limitTrainers?: number; archetypeAttempts?: number} = {},
): Promise<{teams: BossTrainerPresetTeamV4[]; summaries: BossTrainerPresetMatrixSummaryV4[]}> {
  const trainers = bossTrainerDetails(dex, input.trainerId, input.limitTrainers);
  const teams: BossTrainerPresetTeamV4[] = [];
  for (const trainer of trainers) {
    for (const ruleSetPreset of RULE_SET_PRESETS) {
      for (const mode of MODES) {
        for (const variantIndex of VARIANT_INDEXES) {
          teams.push(await generateBossTrainerPresetTeamV4(dex, trainer, {ruleSetPreset, mode, variantIndex, archetypeAttempts: input.archetypeAttempts}));
        }
      }
    }
  }
  return {teams, summaries: trainers.map(trainer => summarizeBossTrainerMatrix(trainer, teams))};
}

export async function generateBossTrainerPresetTeamV4(
  dex: ShowdownDexService,
  trainer: DexTrainerDetail,
  input: {ruleSetPreset: BossTrainerRuleSetPresetV4; mode: BossTrainerModeV4; variantIndex: number; archetypeAttempts?: number},
): Promise<BossTrainerPresetTeamV4> {
  if (!trainer.bossProfile) throw new Error(`Trainer has no boss profile: ${trainer.id}`);
  const preferredSpeciesIds = expandPreferredSpeciesIds(trainer.bossProfile.preferredSpeciesIds);
  const teamArchetype = trainer.bossProfile.teamPreferences[(input.variantIndex - 1) % trainer.bossProfile.teamPreferences.length] || "balanced";
  const ruleSet = ruleSetForPreset(input.ruleSetPreset);
  const fallbackFormatId = ruleSet === "gen7" && input.mode !== "singles" ? GEN7_FALLBACK_FORMAT : undefined;
  const seed = `boss:${trainer.id}:${input.ruleSetPreset}:${input.mode}:${input.variantIndex}`;
  const generationAttempts: string[] = [];
  let result = await generateShowdownRandomTeamV4({
    ruleSet,
    mode: input.mode,
    formatOverride: fallbackFormatId,
    seed,
    teamSize: 6,
    pokemonFilter: {speciesIds: preferredSpeciesIds},
    teamArchetype,
    archetypeAttempts: input.archetypeAttempts || 32,
  });
  generationAttempts.push("preferred-species");
  if (!result.diagnostics.ok || result.pokemonSets.length < 6) {
    const expanded = expandPreferredSpeciesIds([...preferredSpeciesIds, ...GENERIC_EXPANSION_SPECIES]);
    result = await generateShowdownRandomTeamV4({
      ruleSet,
      mode: input.mode,
      formatOverride: fallbackFormatId,
      seed: `${seed}:expanded`,
      teamSize: 6,
      pokemonFilter: {speciesIds: expanded},
      teamArchetype,
      archetypeAttempts: Math.max(input.archetypeAttempts || 32, 48),
    });
    generationAttempts.push("expanded-preferred-species");
  }
  if (!result.diagnostics.ok || result.pokemonSets.length < 6) {
    result = await generateShowdownRandomTeamV4({
      ruleSet,
      mode: input.mode,
      formatOverride: fallbackFormatId,
      seed: `${seed}:fallback`,
      teamSize: 6,
      teamArchetype,
      archetypeAttempts: Math.max(input.archetypeAttempts || 32, 48),
    });
    generationAttempts.push("unfiltered-fallback");
  }
  const filledSets = result.pokemonSets.length < 6
    ? await fillTeamToSix({baseTeam: result.pokemonSets, ruleSet, ruleSetPreset: input.ruleSetPreset, seed: `${seed}:fill`, preferredSpeciesIds, teamArchetype, archetypeAttempts: input.archetypeAttempts})
    : result.pokemonSets;
  const cleaned = input.ruleSetPreset === "none";
  const pokemonSets = (cleaned ? filledSets.map(cleanSpecialSystemSetForNone) : filledSets).slice(0, 6);
  const serialized = await serializeShowdownTeamV4(pokemonSets);
  return {
    trainerId: trainer.id,
    trainerNameZh: trainer.nameZh,
    trainerType: trainer.trainerType,
    ruleSetPreset: input.ruleSetPreset,
    mode: input.mode,
    variantIndex: input.variantIndex,
    seed,
    teamArchetype,
    aiPreference: trainer.bossProfile.battlePreference,
    aiLevel: trainer.bossProfile.aiLevel,
    powerProfile: trainer.bossProfile.powerProfile,
    preferredSpeciesIds,
    originalPreferredSpeciesIds: trainer.bossProfile.originalPreferredSpeciesIds,
    pokemonSets,
    packedTeam: serialized.packedTeam,
    exportedTeam: serialized.exportedTeam,
    diagnostics: {
      ...result.diagnostics,
      fallbackFormatId,
      generationAttempts,
      preferredSpeciesHitCount: countPreferredHits(pokemonSets, preferredSpeciesIds),
      cleanedSpecialSystemForNone: cleaned,
      fillToSixCount: Math.max(0, 6 - result.pokemonSets.length),
    },
  };
}

async function fillTeamToSix(input: {
  baseTeam: ShowdownRandomTeamPokemonSetV4[];
  ruleSet: BossTrainerRuleSetV4;
  ruleSetPreset: BossTrainerRuleSetPresetV4;
  seed: string;
  preferredSpeciesIds: string[];
  teamArchetype: ShowdownTeamArchetypeV4;
  archetypeAttempts?: number;
}): Promise<ShowdownRandomTeamPokemonSetV4[]> {
  const current = [...input.baseTeam];
  const existing = new Set(current.map(set => toID(set.species || set.name)));
  const fillResult = await generateShowdownRandomTeamV4({
    ruleSet: input.ruleSet,
    mode: "singles",
    formatOverride: input.ruleSet === "gen7" && input.ruleSetPreset !== "none" ? GEN7_FALLBACK_FORMAT : undefined,
    seed: input.seed,
    teamSize: 6,
    pokemonFilter: {speciesIds: input.preferredSpeciesIds},
    teamArchetype: input.teamArchetype,
    archetypeAttempts: Math.max(input.archetypeAttempts || 32, 32),
  });
  for (const set of fillResult.pokemonSets) {
    const id = toID(set.species || set.name);
    if (!id || existing.has(id)) continue;
    current.push(set);
    existing.add(id);
    if (current.length >= 6) break;
  }
  if (current.length < 6) {
    const fallback = await generateShowdownRandomTeamV4({
      ruleSet: input.ruleSet,
      mode: "singles",
      formatOverride: input.ruleSet === "gen7" && input.ruleSetPreset !== "none" ? GEN7_FALLBACK_FORMAT : undefined,
      seed: `${input.seed}:unfiltered`,
      teamSize: 6,
      teamArchetype: input.teamArchetype,
      archetypeAttempts: Math.max(input.archetypeAttempts || 32, 32),
    });
    for (const set of fallback.pokemonSets) {
      const id = toID(set.species || set.name);
      if (!id || existing.has(id)) continue;
      current.push(set);
      existing.add(id);
      if (current.length >= 6) break;
    }
  }
  return current;
}

export function summarizeBossTrainerMatrix(trainer: DexTrainerDetail, teams: BossTrainerPresetTeamV4[]): BossTrainerPresetMatrixSummaryV4 {
  const ownTeams = teams.filter(team => team.trainerId === trainer.id);
  const keys = new Set(ownTeams.map(team => matrixKey(team.ruleSetPreset, team.mode, team.variantIndex)));
  const expectedKeys = RULE_SET_PRESETS.flatMap(ruleSetPreset => MODES.flatMap(mode => VARIANT_INDEXES.map(variantIndex => matrixKey(ruleSetPreset, mode, variantIndex))));
  const ruleSetCounts = Object.fromEntries(RULE_SET_PRESETS.map(ruleSetPreset => [ruleSetPreset, ownTeams.filter(team => team.ruleSetPreset === ruleSetPreset).length])) as Record<BossTrainerRuleSetPresetV4, number>;
  return {
    trainerId: trainer.id,
    trainerNameZh: trainer.nameZh,
    trainerType: trainer.trainerType,
    expectedCount: expectedKeys.length,
    generatedCount: ownTeams.length,
    missingKeys: expectedKeys.filter(key => !keys.has(key)),
    ruleSetCounts,
  };
}

function bossTrainerDetails(dex: ShowdownDexService, trainerId?: string, limitTrainers?: number): DexTrainerDetail[] {
  const rows = trainerId ? [{id: trainerId}] : searchAllBossTrainerRows(dex);
  const details = rows
    .map(row => dex.getTrainerDetail(row.id))
    .filter(detail => BOSS_TYPES.has(detail.trainerType) && detail.bossProfile);
  return typeof limitTrainers === "number" ? details.slice(0, Math.max(0, limitTrainers)) : details;
}

function searchAllBossTrainerRows(dex: ShowdownDexService): Array<{id: string}> {
  const rows: Array<{id: string}> = [];
  for (let offset = 0; ; offset += 100) {
    const page = dex.searchDex({category: "trainers", query: "boss", offset, limit: 100});
    rows.push(...page.rows.map(row => ({id: row.id})));
    if (!page.hasMore) break;
  }
  return rows;
}

function ruleSetForPreset(ruleSetPreset: BossTrainerRuleSetPresetV4): BossTrainerRuleSetV4 {
  return ruleSetPreset === "none" ? "standard" : ruleSetPreset;
}

function expandPreferredSpeciesIds(speciesIds: string[]): string[] {
  const unique = Array.from(new Set(speciesIds.map(toID).filter(Boolean)));
  for (const speciesId of GENERIC_EXPANSION_SPECIES) {
    if (unique.length >= 12) break;
    if (!unique.includes(speciesId)) unique.push(speciesId);
  }
  return unique;
}

function cleanSpecialSystemSetForNone(set: ShowdownRandomTeamPokemonSetV4): ShowdownRandomTeamPokemonSetV4 {
  const item = String(set.item || "");
  const cleaned = {...set};
  if (SPECIAL_SYSTEM_ITEM_PATTERN.test(item.replace(/\s+/g, ""))) cleaned.item = "";
  delete cleaned.gigantamax;
  delete cleaned.dynamaxLevel;
  delete cleaned.teraType;
  return cleaned;
}

function countPreferredHits(team: ShowdownRandomTeamPokemonSetV4[], preferredSpeciesIds: string[]): number {
  const preferred = new Set(preferredSpeciesIds.map(toID));
  return team.filter(set => preferred.has(toID(set.species || set.name))).length;
}

function matrixKey(ruleSetPreset: BossTrainerRuleSetPresetV4, mode: BossTrainerModeV4, variantIndex: number): string {
  return `${ruleSetPreset}:${mode}:${variantIndex}`;
}

function toID(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
