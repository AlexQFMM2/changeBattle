import {
  FormalPokemonSpeciesRankById,
  type FormalPokemonSpeciesRankData,
} from "./formalSpeciesRanks.js";

export type FormalSpeciesRuleInputV4 = {
  id?: string;
  name?: string;
  baseSpecies?: string;
  forme?: string;
  num?: number;
  isNonstandard?: string | null;
  isMega?: boolean;
  battleOnly?: unknown;
  changesFrom?: string;
};

export const FORMAL_STARTER_ALLOWED_RANKS_V4 = new Set<FormalPokemonSpeciesRankData>(["rank4", "rank5", "rank6"]);

export const FORMAL_ULTRA_BEAST_IDS_V4 = new Set([
  "nihilego",
  "buzzwole",
  "pheromosa",
  "xurkitree",
  "celesteela",
  "kartana",
  "guzzlord",
  "stakataka",
  "blacephalon",
  "poipole",
  "naganadel",
]);

export function formalSpeciesRankForIdsV4(input: {id?: string; name?: string; baseSpecies?: string}): FormalPokemonSpeciesRankData {
  const detailId = formalToIdV4(input.id);
  if (FORMAL_ULTRA_BEAST_IDS_V4.has(detailId)) return "legendary";
  const direct = FormalPokemonSpeciesRankById[detailId];
  if (direct) return direct;
  const baseId = formalToIdV4(input.baseSpecies || input.name);
  if (FORMAL_ULTRA_BEAST_IDS_V4.has(baseId)) return "legendary";
  return FormalPokemonSpeciesRankById[baseId] || "rank4";
}

export function isFormalStarterAllowedRankV4(rank: FormalPokemonSpeciesRankData): boolean {
  return FORMAL_STARTER_ALLOWED_RANKS_V4.has(rank);
}

export function isFormalRandomGeneratableSpeciesV4(input: FormalSpeciesRuleInputV4): boolean {
  const id = formalToIdV4(input.id);
  const forme = formalToIdV4(input.forme);
  if (!id || Number(input.num || 0) <= 0) return false;
  if (input.isNonstandard && input.isNonstandard !== "Past" && input.isNonstandard !== "Future") return false;
  if (input.isMega || forme.includes("mega") || id.endsWith("mega") || id.includes("megax") || id.includes("megay")) return false;
  if (forme.includes("gmax") || id.endsWith("gmax") || id.includes("gmax")) return false;
  if (input.battleOnly || forme.includes("ultra") || forme.includes("totem") || forme.includes("tera") || forme.includes("terastal") || forme.includes("stellar")) return false;
  if (input.changesFrom && !isFormalAllowedRegionalOrStableVariantV4(forme)) return false;
  if (isFormalBlockedBattleFormV4(id, forme)) return false;
  return true;
}

function isFormalAllowedRegionalOrStableVariantV4(forme: string): boolean {
  return forme === "alola" || forme === "galar" || forme === "hisui" || forme === "paldea";
}

function isFormalBlockedBattleFormV4(id: string, forme: string): boolean {
  const blockedFormes = [
    "bond",
    "zen",
    "galarzen",
    "school",
    "blade",
    "busted",
    "complete",
    "ash",
    "sunshine",
    "sunny",
    "rainy",
    "snowy",
    "meteor",
    "gulping",
    "gorging",
    "hangry",
    "noice",
    "hero",
    "crowned",
    "eternamax",
    "terastal",
    "stellar",
  ];
  if (blockedFormes.some(blocked => forme === blocked || forme.includes(blocked))) return true;
  return id.includes("totem") || id.includes("eternamax") || id.includes("ultra") || id.includes("crowned") || id.includes("bond");
}

export function formalToIdV4(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
