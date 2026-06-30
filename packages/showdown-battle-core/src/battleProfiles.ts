import {RANDOM_BATTLE_SETS_GEN9_V4} from "./randomBattleSetsGen9Data.js";

export type PokemonBattleRoleTagV4 = {
  id: string;
  label: string;
};

export type PokemonBattleProfileV4 = {
  speciesId: string;
  roles: PokemonBattleRoleTagV4[];
  suggestedMoveIds: string[];
  suggestedAbilityIds: string[];
  suggestedTeraTypes: string[];
  levelHint: number | null;
  source: "showdown-random-battles-gen9";
};

export type RandomBattleSetV4 = {
  role?: string;
  movepool?: string[];
  abilities?: string[];
  teraTypes?: string[];
};

export type RandomBattleSpeciesSetsV4 = {
  level?: number;
  sets?: RandomBattleSetV4[];
};

const EMPTY_BATTLE_PROFILE_SOURCE = "showdown-random-battles-gen9" as const;
const RANDOM_BATTLE_SETS = RANDOM_BATTLE_SETS_GEN9_V4 as Record<string, RandomBattleSpeciesSetsV4>;

const ROLE_LABELS: Record<string, string> = {
  "fastattacker": "高速输出",
  "bulkyattacker": "耐久输出",
  "setup sweeper": "强化清场",
  "setupsweeper": "强化清场",
  "bulkysupport": "耐久辅助",
  "fastsupport": "高速辅助",
  "wallbreaker": "破盾手",
  "bulkysetup": "耐久强化",
  "tera blast user": "太晶爆发手",
  "terablastuser": "太晶爆发手",
  "avpivot": "突击背心轮转",
};

export function getPokemonBattleProfileV4(speciesId: string): PokemonBattleProfileV4 {
  const normalizedSpeciesId = toID(speciesId);
  const entry = RANDOM_BATTLE_SETS[normalizedSpeciesId];
  if (!entry) return emptyPokemonBattleProfileV4(normalizedSpeciesId);
  const sets = Array.isArray(entry.sets) ? entry.sets : [];
  return {
    speciesId: normalizedSpeciesId,
    roles: uniqueStrings(sets.map(set => String(set.role || "").trim()).filter(Boolean))
      .map(role => ({id: role, label: battleRoleLabelV4(role)})),
    suggestedMoveIds: uniqueStrings(sets.flatMap(set => set.movepool || []).map(toID).filter(Boolean)),
    suggestedAbilityIds: uniqueStrings(sets.flatMap(set => set.abilities || []).map(toID).filter(Boolean)),
    suggestedTeraTypes: uniqueStrings(sets.flatMap(set => set.teraTypes || []).map(value => String(value || "").trim()).filter(Boolean)),
    levelHint: Number.isFinite(Number(entry.level)) ? Math.max(1, Math.floor(Number(entry.level))) : null,
    source: EMPTY_BATTLE_PROFILE_SOURCE,
  };
}

export function emptyPokemonBattleProfileV4(speciesId: string): PokemonBattleProfileV4 {
  return {
    speciesId: toID(speciesId),
    roles: [],
    suggestedMoveIds: [],
    suggestedAbilityIds: [],
    suggestedTeraTypes: [],
    levelHint: null,
    source: EMPTY_BATTLE_PROFILE_SOURCE,
  };
}

export function battleRoleLabelV4(role: string): string {
  const normalized = normalizeRoleId(role);
  return ROLE_LABELS[normalized] || ROLE_LABELS[normalized.replace(/\s+/g, "")] || role;
}

function normalizeRoleId(role: string): string {
  return String(role || "").trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

function toID(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
