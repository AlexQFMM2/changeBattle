import {getPokemonDisplayNameV4, normalizeLocalPokemonV4, type LocalPokemonV4, type LocalTeamV4} from "./pokemonInstance.js";
import {getPokemonEligibleForSoulmateV4, getPokemonParticipantsForSoulmateV4, type BattleLogPokemonSummaryV4, type TrainingBattleLogEntryV4} from "./battleLog.js";

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

export const SOULMATE_UNIVERSAL_EVOLUTION_STONE_ITEM_ID_V4 = "universal-evolution-stone";

export const SOULMATE_LINKING_CORD_ITEM_ID_V4 = "linking-cord";

export const SOULMATE_EVOLUTION_FRIENDSHIP_REQUIREMENTS_V4 = [100, 200] as const;

export function soulmateEvolutionFriendshipRequirementV4(evolutionIndex: number): number | null {
  const index = Math.max(0, Math.floor(Number(evolutionIndex || 0)));
  return SOULMATE_EVOLUTION_FRIENDSHIP_REQUIREMENTS_V4[index] ?? null;
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

export function createSoulmateCandidateListV4(input: {
  battleLog: TrainingBattleLogEntryV4[];
  team: LocalTeamV4;
  resolvePokemonKey?: (summary: BattleLogPokemonSummaryV4) => string | null | undefined;
  requireDamageDealt?: boolean;
}): SoulmateCandidateV4[] {
  const teamByKey = buildTeamKeyMapV4(input.team);
  const summarize = input.requireDamageDealt ? getPokemonEligibleForSoulmateV4 : getPokemonParticipantsForSoulmateV4;
  return summarize(input.battleLog, {playerId: "p1"}).flatMap(summary => {
    const resolvedKey = input.resolvePokemonKey?.(summary) || summary.pokemonKey;
    const pokemon = teamByKey.get(normalizeBattleKeyText(resolvedKey));
    if (!pokemon) return [];
    return [createCandidateFromSummaryV4({...summary, pokemonKey: resolvedKey}, pokemon)];
  });
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
