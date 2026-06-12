import type {BattleSetting, GeneratedTeam, LocalSave, PokemonSet, RentalPokemon, TalentView} from "@changebattle/shared";
import {DEFAULT_BATTLE_SETTING, normalizeBattleSetting} from "@changebattle/shared";
import {hasTalent, toId} from "./run-rules.js";

export type RuntimeGenerationProfile = "tier1" | "tier2" | "tier3" | "tier4" | "champion";
export type RuntimeSpeciesTier = 1 | 2 | 3 | 4 | 5 | 6 | 10;

export type StarterCandidateService = {
  deriveSeed(base: number, salt: number): number;
  generateRentalCandidates(
    seed: number,
    format: string,
    count: number,
    options: {
      profiles?: RuntimeGenerationProfile[];
      speciesTiers?: RuntimeSpeciesTier[];
      speciesIds?: string[];
      purpose?: "starter" | "normal" | "boss" | "rescue";
      battleSetting?: BattleSetting;
    },
  ): Promise<GeneratedTeam>;
};

export function starterProfilesForStreak(setStreak: number, count: number, talents: TalentView[] = []): RuntimeGenerationProfile[] {
  void talents;
  const base: RuntimeGenerationProfile[] = setStreak <= 0
    ? ["tier1", "tier1", "tier1", "tier2", "tier2", "tier2"]
    : setStreak === 1
      ? ["tier1", "tier1", "tier1", "tier2", "tier2", "tier3"]
      : ["tier1", "tier2", "tier2", "tier3", "tier3", "tier3"];
  return Array.from({length: Math.max(1, count)}, (_value, index) => base[index % base.length]);
}

export function starterSpeciesTiersForStreak(setStreak: number, count: number): RuntimeSpeciesTier[] {
  const base: RuntimeSpeciesTier[] = setStreak <= 0
    ? [3, 4, 4, 4, 5, 5]
    : setStreak === 1
      ? [4, 4, 5, 5, 5, 6]
      : [4, 5, 5, 6, 6, 6];
  return Array.from({length: Math.max(1, count)}, (_value, index) => base[index % base.length]);
}

export function markStarterOrigin(generated: GeneratedTeam, origin: "current" | "memory"): GeneratedTeam {
  return {
    ...generated,
    team: generated.team.map(pokemon => ({...pokemon, starter_origin: origin} as PokemonSet)),
    display: generated.display.map(pokemon => ({...pokemon, starter_origin: origin} as RentalPokemon)),
  };
}

export function ensureStarterShiny(generated: GeneratedTeam, seed: number, talents: TalentView[], setStreak: number): GeneratedTeam {
  void seed;
  void talents;
  void setStreak;
  return generated;
}

export async function generateStarterCandidatesForSave(options: {
  service: StarterCandidateService;
  save: LocalSave;
  seed: number;
  talents: TalentView[];
  count: number;
  setting?: BattleSetting;
}): Promise<GeneratedTeam> {
  const {service, save, seed, talents, count, setting} = options;
  const setStreak = Number(save.stats?.set_win_streak || 0);
  const profiles = starterProfilesForStreak(setStreak, count, talents);
  const speciesTiers = starterSpeciesTiersForStreak(setStreak, count);
  const battleSetting = normalizeBattleSetting(setting || save.battle_setting || DEFAULT_BATTLE_SETTING);
  const current = markStarterOrigin(ensureStarterShiny(await service.generateRentalCandidates(service.deriveSeed(seed, 1), "gen9randombattle", count, {
    profiles,
    speciesTiers,
    purpose: "starter",
    battleSetting,
  }), seed, talents, setStreak), "current");
  if (!hasTalent(talents, "starter_soulmate")) return current;
  const memoryLimit = Math.max(0, 12 - current.display.length);
  const memorySpecies = Array.from(new Set([...(save.run_memory?.player_species_ids || []), ...(save.run_memory?.enemy_species_ids || [])].map(toId).filter(Boolean))).slice(0, memoryLimit);
  if (!memorySpecies.length) return current;
  const memoryProfiles = Array.from({length: memorySpecies.length}, (_value, index) => profiles[index % profiles.length] || "tier1" as RuntimeGenerationProfile);
  const memory = markStarterOrigin(await service.generateRentalCandidates(service.deriveSeed(seed, 0x5017), "gen9randombattle", memorySpecies.length, {
    profiles: memoryProfiles,
    speciesIds: memorySpecies,
    purpose: "starter",
    battleSetting,
  }), "memory");
  return {
    seed: current.seed,
    team: [...current.team, ...memory.team],
    display: [...current.display, ...memory.display],
    packed: current.packed,
  };
}
