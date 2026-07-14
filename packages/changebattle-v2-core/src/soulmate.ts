import {getPokemonDisplayNameV4, normalizeLocalPokemonV4, TRAINING_STAT_IDS_V4, type LocalPokemonV4, type LocalTeamV4, type StatTableV4} from "./pokemonInstance.js";
import {getPokemonEligibleForSoulmateV4, getPokemonParticipantsForSoulmateV4, type BattleLogPokemonSummaryV4, type TrainingBattleLogEntryV4} from "./battleLog.js";
import {normalizePlayerPokemonRecordV4, type PlayerPokemonMoveRecordV4, type PlayerPokemonRecordV4} from "./playerVault.js";

export type PlayerSoulmatePokemonRecordV4 = {
  soulmateId: string;
  localPokemonId: string;
  speciesId: string;
  displayName: string;
  nickname?: string;
  shiny: boolean;
  metAt: string;
  sourceRunId?: string;
  sourcePokemonKey: string;
  originalPokemon: LocalPokemonV4;
};

export type SoulmateCandidateV4 = {
  candidateId: string;
  pokemonKey: string;
  localPokemonId: string;
  speciesId: string;
  displayName: string;
  iconUrl?: string;
  iconStyle?: string;
  shiny: boolean;
  damageDealt: number;
  usedRounds: number[];
  pokemon: LocalPokemonV4;
};

export type SoulmateChooseInputV4 = {
  battleLog: TrainingBattleLogEntryV4[];
  team: LocalTeamV4;
  selectedPokemonKey: string;
  rngSeed?: string | number;
  nickname?: string;
  nowIso?: string;
  sourceRunId?: string;
};

export type SoulmateChooseResultV4 = {
  candidate: SoulmateCandidateV4;
  soulmate: PlayerSoulmatePokemonRecordV4;
};

export type SoulmateRenameInputV4 = {
  soulmate: PlayerSoulmatePokemonRecordV4;
  nickname?: string;
};

export type SoulmateEvolutionEdgeInputV4 = {
  evoType?: string;
  evoItem?: string;
  evoItemId?: string;
};

export type SoulmateEvolutionRequirementV4 = {
  itemId: string;
  requirementKind: "specific-item" | "linking-cord" | "universal-stone";
};

export type PlayerVaultEggPokemonDexV4 = {
  getPokemonDetail: (speciesId: string) => PlayerVaultEggPokemonDetailV4;
  getPokemonEvolutionRoot?: (speciesId: string) => string | {id?: string; speciesId?: string} | null | undefined;
  getPokemonSelfLearnSkills?: (speciesId: string) => PlayerVaultEggMoveDetailV4[];
  getMoveDetail?: (moveId: string) => PlayerVaultEggMoveDetailV4;
};

export type PlayerVaultEggPokemonDetailV4 = {
  id: string;
  abilities?: Array<{id?: string; name?: string}>;
};

export type PlayerVaultEggMoveDetailV4 = {
  id: string;
  pp?: number;
};

export type PlayerVaultEggPokemonRecordInputV4 = {
  dex: PlayerVaultEggPokemonDexV4;
  speciesId: string;
  originKind: NonNullable<PlayerPokemonRecordV4["originKind"]>;
  seed: string | number;
  nickname?: string;
  sourceRunId?: string;
  sourcePokemonKey?: string;
  inherited?: {
    gender?: LocalPokemonV4["gender"];
    nature?: string;
    fallbackMoveIds?: string[];
  };
  level?: number;
  friendship?: number;
  shinyRate?: number;
  nowIso?: string;
};

export const SOULMATE_UNIVERSAL_EVOLUTION_STONE_ITEM_ID_V4 = "universal-evolution-stone";

export const SOULMATE_LINKING_CORD_ITEM_ID_V4 = "linking-cord";

export const SOULMATE_EVOLUTION_FRIENDSHIP_REQUIREMENTS_V4 = [100, 200] as const;
export const SOULMATE_SINGLE_EVOLUTION_FRIENDSHIP_REQUIREMENT_V4 = 150;

export function soulmateEvolutionFriendshipRequirementV4(evolutionIndex: number): number | null {
  const index = Math.max(0, Math.floor(Number(evolutionIndex || 0)));
  return SOULMATE_EVOLUTION_FRIENDSHIP_REQUIREMENTS_V4[index] ?? null;
}

export function soulmateEvolutionFriendshipRequirementForChainV4(evolutionIndex: number, evolutionStageCount: number): number | null {
  const stageCount = Math.max(0, Math.floor(Number(evolutionStageCount || 0)));
  if (stageCount === 1) return SOULMATE_SINGLE_EVOLUTION_FRIENDSHIP_REQUIREMENT_V4;
  return soulmateEvolutionFriendshipRequirementV4(evolutionIndex);
}

export function normalizeSoulmateEvolutionRequirementV4(edge: SoulmateEvolutionEdgeInputV4 | null | undefined): SoulmateEvolutionRequirementV4 {
  const evoType = normalizeOptionalText(edge?.evoType);
  const evoItemId = normalizeItemIdText(edge?.evoItemId || edge?.evoItem);
  if (evoType === "trade") {
    return {itemId: SOULMATE_LINKING_CORD_ITEM_ID_V4, requirementKind: "linking-cord"};
  }
  if (evoType === "useItem" && evoItemId) {
    return {itemId: evoItemId, requirementKind: "specific-item"};
  }
  return {itemId: SOULMATE_UNIVERSAL_EVOLUTION_STONE_ITEM_ID_V4, requirementKind: "universal-stone"};
}

export function createPlayerVaultEggPokemonRecordV4(input: PlayerVaultEggPokemonRecordInputV4): PlayerPokemonRecordV4 | null {
  const rootSpeciesId = playerVaultEggRootSpeciesIdV4(input.dex, input.speciesId);
  const detail = safePlayerVaultEggPokemonDetailV4(input.dex, rootSpeciesId || input.speciesId);
  if (!detail?.id) return null;
  const seed = String(input.seed || `${input.originKind}:${detail.id}`);
  const moveIds = playerVaultEggMoveIdsV4(input.dex, detail.id, input.inherited?.fallbackMoveIds);
  const moves = playerVaultEggMoveRecordsV4(input.dex, moveIds);
  const abilityId = detail.abilities?.find(ability => normalizeOptionalText(ability.id))?.id || "";
  return normalizePlayerPokemonRecordV4({
    playerPokemonId: `${input.originKind}-${hashSoulmateSeedV4(seed)}`,
    speciesId: detail.id,
    nickname: normalizeOptionalText(input.nickname),
    level: clampSoulmateInt(input.level, 1, 100, 50),
    originKind: input.originKind,
    rootSpeciesId: detail.id,
    sourceRunId: normalizeOptionalText(input.sourceRunId),
    sourcePokemonKey: normalizeOptionalText(input.sourcePokemonKey),
    gender: input.inherited?.gender || "N",
    nature: normalizeOptionalText(input.inherited?.nature) || "Hardy",
    abilityId,
    evs: zeroSoulmateStatsV4(),
    ivs: randomSoulmateIvStatsV4(`${seed}:ivs`),
    moves,
    friendship: clampSoulmateInt(input.friendship, 0, 255, 100),
    shiny: seededFractionV4(`${seed}:shiny`) < Math.max(0, Math.min(1, Number(input.shinyRate || 0))),
    metAt: normalizeIsoText(input.nowIso) || new Date().toISOString(),
    honors: input.originKind === "soulmate" ? ["灵魂伴侣"] : ["调试创建"],
  });
}

export function createSoulmateCandidateListV4(input: {
  battleLog: TrainingBattleLogEntryV4[];
  team: LocalTeamV4;
  resolvePokemonKey?: (summary: BattleLogPokemonSummaryV4) => string | null | undefined;
  requireDamageDealt?: boolean;
}): SoulmateCandidateV4[] {
  const teamByKey = buildTeamKeyMapV4(input.team);
  const summarize = input.requireDamageDealt ? getPokemonEligibleForSoulmateV4 : getPokemonParticipantsForSoulmateV4;
  const mergedByPokemonKey = new Map<string, {summary: BattleLogPokemonSummaryV4; pokemon: LocalPokemonV4}>();
  for (const summary of summarize(input.battleLog, {playerId: "p1"})) {
    const resolvedKey = input.resolvePokemonKey?.(summary) || summary.pokemonKey;
    const pokemon = teamByKey.get(normalizeBattleKeyText(resolvedKey));
    if (!pokemon) continue;
    const stableKey = pokemon.localPokemonId || pokemon.showdownIdentityToken || pokemon.showdownId || pokemon.pokeballId || resolvedKey;
    const normalizedStableKey = normalizeBattleKeyText(stableKey);
    const current = mergedByPokemonKey.get(normalizedStableKey);
    const nextSummary = {...summary, pokemonKey: stableKey};
    if (!current) {
      mergedByPokemonKey.set(normalizedStableKey, {summary: nextSummary, pokemon});
      continue;
    }
    current.summary = mergeSoulmateCandidateSummary(current.summary, nextSummary);
  }
  return Array.from(mergedByPokemonKey.values())
    .map(entry => createCandidateFromSummaryV4(entry.summary, entry.pokemon))
    .sort((a, b) => b.damageDealt - a.damageDealt || b.usedRounds.length - a.usedRounds.length || a.displayName.localeCompare(b.displayName));
}

export function createSoulmatePokemonRecordV4(input: {
  candidate: SoulmateCandidateV4;
  rngSeed?: string | number;
  nickname?: string;
  nowIso?: string;
  sourceRunId?: string;
}): PlayerSoulmatePokemonRecordV4 {
  const nickname = normalizeOptionalText(input.nickname);
  const originalPokemon = normalizeLocalPokemonV4({
    ...input.candidate.pokemon,
    localPokemonId: input.candidate.localPokemonId,
    speciesId: input.candidate.speciesId,
    shiny: rollSoulmateShinyV4(input.rngSeed),
    nickname,
  });
  const displayName = nickname || getPokemonDisplayNameV4(originalPokemon);
  return {
    soulmateId: `soulmate-${hashSoulmateSeedV4(`${input.candidate.pokemonKey}:${input.nowIso || ""}`)}`,
    localPokemonId: originalPokemon.localPokemonId,
    speciesId: originalPokemon.speciesId,
    displayName,
    ...(nickname ? {nickname} : {}),
    shiny: Boolean(originalPokemon.shiny),
    metAt: normalizeIsoText(input.nowIso) || new Date(0).toISOString(),
    sourceRunId: normalizeOptionalText(input.sourceRunId),
    sourcePokemonKey: input.candidate.pokemonKey,
    originalPokemon,
  };
}

export function chooseSoulmatePokemonV4(input: SoulmateChooseInputV4): SoulmateChooseResultV4 | null {
  const candidates = createSoulmateCandidateListV4({battleLog: input.battleLog, team: input.team});
  const candidate = candidates.find(entry => entry.pokemonKey === input.selectedPokemonKey || entry.localPokemonId === input.selectedPokemonKey) || null;
  if (!candidate) return null;
  return {
    candidate,
    soulmate: createSoulmatePokemonRecordV4({
      candidate,
      rngSeed: input.rngSeed,
      nickname: input.nickname,
      nowIso: input.nowIso,
      sourceRunId: input.sourceRunId,
    }),
  };
}

export function renameSoulmatePokemonV4(input: SoulmateRenameInputV4): PlayerSoulmatePokemonRecordV4 {
  const nickname = normalizeOptionalText(input.nickname);
  const originalPokemon = normalizeLocalPokemonV4({...input.soulmate.originalPokemon, nickname});
  return {
    ...input.soulmate,
    displayName: nickname || getPokemonDisplayNameV4(originalPokemon),
    nickname,
    originalPokemon,
  };
}

export function getSoulmateDisplayNameV4(soulmate: PlayerSoulmatePokemonRecordV4 | null | undefined): string {
  if (!soulmate) return "";
  return soulmate.displayName || soulmate.nickname || getPokemonDisplayNameV4(soulmate.originalPokemon);
}

export function normalizeSoulmatePokemonRecordV4(value: unknown): PlayerSoulmatePokemonRecordV4 | null {
  if (!isRecord(value)) return null;
  const originalPokemon = normalizeLocalPokemonV4(value.originalPokemon);
  const sourcePokemonKey = normalizeOptionalText(value.sourcePokemonKey);
  if (!sourcePokemonKey || !originalPokemon.speciesId) return null;
  const nickname = normalizeOptionalText(value.nickname);
  const displayName = normalizeOptionalText(value.displayName) || nickname || getPokemonDisplayNameV4(originalPokemon);
  return {
    soulmateId: normalizeOptionalText(value.soulmateId) || `soulmate-${hashSoulmateSeedV4(sourcePokemonKey)}`,
    localPokemonId: normalizeOptionalText(value.localPokemonId) || originalPokemon.localPokemonId,
    speciesId: normalizeOptionalText(value.speciesId) || originalPokemon.speciesId,
    displayName,
    nickname,
    shiny: Boolean(value.shiny ?? originalPokemon.shiny),
    metAt: normalizeIsoText(value.metAt) || new Date(0).toISOString(),
    sourceRunId: normalizeOptionalText(value.sourceRunId),
    sourcePokemonKey,
    originalPokemon: {...originalPokemon, nickname, shiny: Boolean(value.shiny ?? originalPokemon.shiny)},
  };
}

function createCandidateFromSummaryV4(summary: BattleLogPokemonSummaryV4, pokemon: LocalPokemonV4): SoulmateCandidateV4 {
  const normalized = normalizeLocalPokemonV4(pokemon);
  return {
    candidateId: `soulmate-candidate-${summary.pokemonKey}`,
    pokemonKey: summary.pokemonKey,
    localPokemonId: normalized.localPokemonId,
    speciesId: normalized.speciesId,
    displayName: getPokemonDisplayNameV4(normalized),
    iconUrl: normalized.iconUrl,
    iconStyle: normalized.iconStyle,
    shiny: Boolean(normalized.shiny),
    damageDealt: summary.damageDealt,
    usedRounds: summary.usedRounds,
    pokemon: normalized,
  };
}

function mergeSoulmateCandidateSummary(base: BattleLogPokemonSummaryV4, incoming: BattleLogPokemonSummaryV4): BattleLogPokemonSummaryV4 {
  const usedRounds = Array.from(new Set([...base.usedRounds, ...incoming.usedRounds])).sort((a, b) => a - b);
  const kills = base.kills + incoming.kills;
  const deaths = base.deaths + incoming.deaths;
  const assists = base.assists + incoming.assists;
  const damageDealt = base.damageDealt + incoming.damageDealt;
  const damageTaken = base.damageTaken + incoming.damageTaken;
  const healing = base.healing + incoming.healing;
  return {
    ...base,
    pokemonName: base.pokemonName || incoming.pokemonName,
    kills,
    deaths,
    assists,
    damageDealt,
    damageTaken,
    healing,
    usedRounds,
    kdaScore: (kills + assists * 0.5 + 1) / Math.max(1, deaths),
    mvpScore: kills * 120 + assists * 40 - deaths * 35 + damageDealt + damageTaken * 0.35 + healing * 0.25 + usedRounds.length * 10,
  };
}

function buildTeamKeyMapV4(team: LocalTeamV4): Map<string, LocalPokemonV4> {
  const result = new Map<string, LocalPokemonV4>();
  for (const pokemon of team.pokemon || []) {
    const normalized = normalizeLocalPokemonV4(pokemon);
    [
      normalized.localPokemonId,
      normalized.speciesId,
      normalized.pokeballId,
      normalized.showdownId,
      normalized.showdownIdentityToken,
      normalized.name,
      normalized.nameZh,
      normalized.nickname,
    ].map(normalizeBattleKeyText).filter(Boolean).forEach(key => result.set(key, normalized));
  }
  return result;
}

function rollSoulmateShinyV4(seed: string | number | undefined): boolean {
  return seededFractionV4(seed) < 1 / 8;
}

function seededFractionV4(seed: string | number | undefined): number {
  const text = String(seed ?? "soulmate");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0x100000000;
}

function hashSoulmateSeedV4(seed: string): string {
  return Math.floor(seededFractionV4(seed) * 0xffffffff).toString(36).padStart(6, "0");
}

function playerVaultEggRootSpeciesIdV4(dex: PlayerVaultEggPokemonDexV4, speciesId: string): string {
  const normalizedSpeciesId = normalizeOptionalText(speciesId) || "pikachu";
  try {
    const root = dex.getPokemonEvolutionRoot?.(normalizedSpeciesId);
    if (typeof root === "string") return normalizeOptionalText(root) || normalizedSpeciesId;
    return normalizeOptionalText(root?.id || root?.speciesId) || normalizedSpeciesId;
  } catch {
    return normalizedSpeciesId;
  }
}

function safePlayerVaultEggPokemonDetailV4(dex: PlayerVaultEggPokemonDexV4, speciesId: string): PlayerVaultEggPokemonDetailV4 | null {
  try {
    return dex.getPokemonDetail(speciesId);
  } catch {
    return null;
  }
}

function playerVaultEggMoveIdsV4(dex: PlayerVaultEggPokemonDexV4, speciesId: string, fallbackMoveIds: string[] | undefined): string[] {
  const ids: string[] = [];
  try {
    for (const move of dex.getPokemonSelfLearnSkills?.(speciesId) || []) {
      const moveId = normalizeItemIdText(move.id);
      if (moveId && !ids.includes(moveId)) ids.push(moveId);
      if (ids.length >= 4) break;
    }
  } catch {
    // Fall through to fallback moves.
  }
  for (const moveId of fallbackMoveIds || []) {
    const normalizedMoveId = normalizeItemIdText(moveId);
    if (normalizedMoveId && !ids.includes(normalizedMoveId)) ids.push(normalizedMoveId);
    if (ids.length >= 4) break;
  }
  if (!ids.length) ids.push("tackle");
  return ids.slice(0, 4);
}

function playerVaultEggMoveRecordsV4(dex: PlayerVaultEggPokemonDexV4, moveIds: string[]): PlayerPokemonMoveRecordV4[] {
  return moveIds.map(moveId => {
    let pp = 1;
    try {
      pp = Math.max(1, Math.floor(Number(dex.getMoveDetail?.(moveId)?.pp || 1)));
    } catch {
      pp = 1;
    }
    return {moveId, remainingPp: pp, maxPp: pp};
  });
}

function zeroSoulmateStatsV4(): StatTableV4 {
  return {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0};
}

function randomSoulmateIvStatsV4(seed: string): StatTableV4 {
  return Object.fromEntries(TRAINING_STAT_IDS_V4.map(stat => [stat, Math.floor(seededFractionV4(`${seed}:${stat}`) * 32)])) as StatTableV4;
}

function clampSoulmateInt(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function normalizeBattleKeyText(value: unknown): string {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5:]+/g, "");
}

function normalizeOptionalText(value: unknown): string | undefined {
  const text = String(value || "").trim();
  return text || undefined;
}

function normalizeItemIdText(value: unknown): string {
  const text = String(value || "").trim();
  if (/^tm:/i.test(text)) return `tm:${toIdText(text.slice(3))}`;
  if (/^system-/i.test(text) || /^universal-/i.test(text) || /^linking-/i.test(text)) return text.toLowerCase().replace(/[^a-z0-9-]+/g, "");
  return toIdText(text);
}

function toIdText(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normalizeIsoText(value: unknown): string {
  const text = String(value || "").trim();
  if (!text) return "";
  const time = Date.parse(text);
  return Number.isFinite(time) ? new Date(time).toISOString() : "";
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
