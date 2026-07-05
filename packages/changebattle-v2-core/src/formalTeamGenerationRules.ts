import {
  NPC_TEAM_PREFERENCES,
  type FormalNpcBattlePreferenceV4,
  type FormalNpcTeamPreferenceV4,
  type FormalNpcTypeV4,
  type FormalStarterRoleV4,
  type PokemonPowerProfileV4,
} from "./formalGameCatalog.js";
import {formalCreateRngV4, formalShuffleV4} from "./formalPowerProfileRules.js";

export type FormalNpcGenerationTierV4 = "rookie" | "normal" | "elite" | "boss" | "champion";

export function formalStarterPowerProfileDeckV4(seed: string, streak: number, count: number): PokemonPowerProfileV4[] {
  const safeStreak = Math.max(0, Math.floor(Number(streak || 0)));
  const safeCount = Math.max(0, Math.floor(Number(count || 0)));
  if (safeStreak >= 2) return Array.from({length: safeCount}, () => "elite");
  const normalCount = Math.max(0, Math.min(safeCount - 1, Math.ceil(safeCount * 0.8)));
  const eliteCount = safeCount - normalCount;
  return formalShuffleV4([
    ...Array.from({length: normalCount}, () => "normal" as const),
    ...Array.from({length: eliteCount}, () => "elite" as const),
  ], formalCreateRngV4(`${seed}:starter-power-profile:${safeStreak}:${safeCount}`));
}

export function formalNpcGenerationTierForTypeV4(type: FormalNpcTypeV4): FormalNpcGenerationTierV4 {
  if (type === "rookie") return "rookie";
  if (type === "normal") return "normal";
  if (type === "elite") return "elite";
  if (type === "champion" || type === "villain") return "champion";
  return "boss";
}

export function formalNpcLevelBonusForTypeV4(type: FormalNpcTypeV4): number {
  if (type === "rookie") return -2;
  if (type === "normal") return -1;
  if (type === "elite") return 0;
  if (type === "gym" || type === "elite4") return 1;
  if (type === "champion" || type === "villain") return 2;
  return 0;
}

export function formalNpcPowerProfileForTypeV4(type: FormalNpcTypeV4, streak: number, roundIndex: number, isCoopAlly = false): PokemonPowerProfileV4 {
  if (isCoopAlly) return "elite";
  const tier = formalNpcGenerationTierForTypeV4(type);
  if (tier === "rookie" || tier === "normal" || tier === "elite") return tier;
  const safeStreak = Math.max(0, Math.floor(Number(streak || 0)));
  if (safeStreak <= 0) return "elite";
  if (safeStreak === 1) return type === "gym" ? "elite" : "boss";
  if (safeStreak === 2) return "boss";
  if (tier === "champion") return "champion";
  if (roundIndex >= 5 && type === "elite4") return "champion";
  return "boss";
}

export function formalTeamPreferenceForNpcV4(type: FormalNpcTypeV4, battlePreference: FormalNpcBattlePreferenceV4, pickOne: <T>(values: readonly T[]) => T | undefined): FormalNpcTeamPreferenceV4 {
  if (type === "champion") return pickOne(["balanced", "setup-offense", "tailwind", "terrain"]) || "balanced";
  if (type === "villain") return pickOne(["poison-stall", "hazard-stack", "setup-offense", "balanced"]) || "balanced";
  if (type === "gym") return pickOne(["rain", "sun", "sand", "snow", "terrain", "balanced"]) || "balanced";
  if (type === "elite4") return pickOne(["trick-room", "tailwind", "hazard-stack", "setup-offense", "balanced"]) || "balanced";
  if (battlePreference === "offense") return pickOne(["setup-offense", "tailwind", "rain", "sun"]) || "setup-offense";
  if (battlePreference === "defense") return pickOne(["sand", "snow", "poison-stall", "balanced"]) || "balanced";
  if (battlePreference === "support") return pickOne(["trick-room", "terrain", "hazard-stack", "tailwind"]) || "balanced";
  return pickOne(NPC_TEAM_PREFERENCES) || "balanced";
}

export function formalRoleForTeamPreferenceV4(teamPreference: FormalNpcTeamPreferenceV4, index: number): FormalStarterRoleV4 {
  if (teamPreference === "trick-room") return index < 2 ? "trick-room" : index < 4 ? "offense" : "defense";
  if (teamPreference === "tailwind") return index === 0 ? "speed-control" : index < 4 ? "offense" : "support";
  if (teamPreference === "hazard-stack" || teamPreference === "poison-stall") return index < 2 ? "disruption" : index < 4 ? "defense" : "offense";
  if (teamPreference === "setup-offense") return index < 4 ? "offense" : index === 4 ? "speed-control" : "support";
  if (teamPreference === "rain" || teamPreference === "sun" || teamPreference === "sand" || teamPreference === "snow") return index === 0 ? "weather" : index < 4 ? "offense" : "defense";
  if (teamPreference === "terrain") return index === 0 ? "support" : index < 4 ? "offense" : "defense";
  return index < 2 ? "offense" : index < 4 ? "defense" : "support";
}

export function formalTeamPreferenceTypeHintsV4(teamPreference: FormalNpcTeamPreferenceV4): string[] {
  if (teamPreference === "rain") return ["Water", "Electric", "Flying", "Grass"];
  if (teamPreference === "sun") return ["Fire", "Grass", "Ground", "Dragon"];
  if (teamPreference === "sand") return ["Rock", "Ground", "Steel"];
  if (teamPreference === "snow") return ["Ice", "Water", "Steel"];
  if (teamPreference === "terrain") return ["Electric", "Grass", "Psychic", "Fairy"];
  return [];
}
