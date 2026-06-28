import {
  generateShowdownRandomTeamV4,
  type ShowdownRandomTeamGeneratorInputV4,
  type ShowdownRandomTeamGeneratorResultV4,
  type ShowdownRandomTeamPokemonSetV4,
} from "@changebattle-v2/showdown-battle-core/teamGenerator";
import {toID, type DexStatId, type ShowdownDexService} from "@changebattle-v2/showdown-dex-core";
import type {LocalPokemonV4, LocalTeamV4, ShowdownPlayerIdV4, StatTableV4, TrainingGenderV4, TrainingMoveSlotV4} from "./training.js";

export type TeamGeneratorAdapterDiagnosticsV4 = {
  ok: boolean;
  messages: string[];
  missingSpecies: string[];
  missingMoves: string[];
  missingAbilities: string[];
  missingItems: string[];
};

export type RandomBattleTeamPreviewInputV4 = ShowdownRandomTeamGeneratorInputV4 & {
  includeLocalTeam?: boolean;
};

export type RandomBattleTeamPreviewResultV4 = ShowdownRandomTeamGeneratorResultV4 & {
  localTeam: LocalTeamV4 | null;
  adapterDiagnostics: TeamGeneratorAdapterDiagnosticsV4;
};

const STAT_IDS: DexStatId[] = ["hp", "atk", "def", "spa", "spd", "spe"];

export async function generateRandomBattleTeamPreviewV4(dex: ShowdownDexService, input: RandomBattleTeamPreviewInputV4 = {}): Promise<RandomBattleTeamPreviewResultV4> {
  const generated = await generateShowdownRandomTeamV4(input);
  const adapterDiagnostics = createAdapterDiagnostics();
  const localTeam = input.includeLocalTeam === false
    ? null
    : convertShowdownTeamToLocalTeamV4(dex, generated.pokemonSets, {
      playerId: input.playerId,
      localTeamName: input.localTeamName,
      diagnostics: adapterDiagnostics,
    });
  adapterDiagnostics.ok = adapterDiagnostics.messages.length === 0;
  return {...generated, localTeam, adapterDiagnostics};
}

export function convertShowdownTeamToLocalTeamV4(
  dex: ShowdownDexService,
  sets: ShowdownRandomTeamPokemonSetV4[],
  options: {
    playerId?: ShowdownPlayerIdV4;
    localTeamName?: string;
    diagnostics?: TeamGeneratorAdapterDiagnosticsV4;
  } = {},
): LocalTeamV4 {
  const diagnostics = options.diagnostics || createAdapterDiagnostics();
  const playerId = options.playerId || "p2";
  return {
    id: `showdown-random-team-${playerId}`,
    name: options.localTeamName || `${playerId.toUpperCase()} Showdown 随机队`,
    pokemon: sets.slice(0, 6).map((set, index) => convertShowdownSetToLocalPokemonV4(dex, set, index, diagnostics)),
  };
}

export function convertShowdownSetToLocalPokemonV4(
  dex: ShowdownDexService,
  set: ShowdownRandomTeamPokemonSetV4,
  index: number,
  diagnostics: TeamGeneratorAdapterDiagnosticsV4 = createAdapterDiagnostics(),
): LocalPokemonV4 {
  const speciesId = toID(set.species || set.name);
  const detail = safeLookup(
    () => dex.getPokemonDetail(speciesId),
    dex.getPokemonDetail("pikachu"),
    diagnostics,
    "missingSpecies",
    set.species || set.name || `pokemon-${index + 1}`,
  );
  const abilityId = toID(set.ability);
  const ability = detail.abilities.find(entry => entry.id === abilityId || toID(entry.name) === abilityId)
    || safeLookup(() => dex.getAbilityDetail(abilityId), null, diagnostics, "missingAbilities", set.ability);
  const abilityName = ability?.name || set.ability || "";
  const abilityNameZh = typeof (ability as {nameZh?: unknown} | null)?.nameZh === "string"
    ? String((ability as {nameZh: string}).nameZh)
    : abilityName;
  const evs = normalizeStats(set.evs, 0, 252);
  const ivs = normalizeStats(set.ivs, 31, 31);
  const level = clampInt(set.level || 50, 1, 100);
  const nature = set.nature || "Serious";
  const maxHp = dex.calculatePokemonStats({speciesId: detail.id, level, nature, evs, ivs}).stats.hp;
  const moves = normalizeMoves(dex, set.moves || [], diagnostics);
  const itemId = normalizeItemId(dex, set.item || "", diagnostics);

  return {
    localPokemonId: `showdown-random-pokemon-${index + 1}`,
    speciesId: detail.id,
    name: detail.name || set.species || set.name,
    nameZh: detail.nameZh || detail.name || set.species || set.name,
    nickname: set.name && set.name !== set.species ? set.name : undefined,
    level,
    gender: normalizeGender(set.gender),
    shiny: Boolean(set.shiny),
    itemId,
    heldItemInstanceId: undefined,
    abilityId: ability?.id || abilityId,
    abilityName,
    abilityNameZh,
    nature,
    moves,
    evs,
    ivs,
    entryHp: maxHp,
    entryStatus: "",
    maxHp,
    spriteUrl: detail.sprites.frontUrl || detail.sprites.fallbackFrontUrl || detail.sprites.iconUrl,
    shinySpriteUrl: detail.sprites.frontShinyUrl || detail.sprites.fallbackFrontShinyUrl || detail.sprites.frontUrl || detail.sprites.fallbackFrontUrl || detail.sprites.iconUrl,
    frontSpriteUrl: detail.sprites.frontUrl || detail.sprites.fallbackFrontUrl || detail.sprites.iconUrl,
    backSpriteUrl: detail.sprites.backUrl || detail.sprites.fallbackBackUrl || detail.sprites.frontUrl || detail.sprites.fallbackFrontUrl || detail.sprites.iconUrl,
    frontShinySpriteUrl: detail.sprites.frontShinyUrl || detail.sprites.fallbackFrontShinyUrl || detail.sprites.frontUrl || detail.sprites.fallbackFrontUrl || detail.sprites.iconUrl,
    backShinySpriteUrl: detail.sprites.backShinyUrl || detail.sprites.fallbackBackShinyUrl || detail.sprites.backUrl || detail.sprites.fallbackBackUrl || detail.sprites.frontShinyUrl || detail.sprites.fallbackFrontShinyUrl || detail.sprites.iconUrl,
    iconUrl: detail.sprites.iconUrl,
    iconStyle: detail.sprites.iconStyle,
    ...(set.teraType ? {teraType: set.teraType} as Record<string, unknown> : {}),
  } as LocalPokemonV4;
}

export function createAdapterDiagnostics(): TeamGeneratorAdapterDiagnosticsV4 {
  return {ok: true, messages: [], missingSpecies: [], missingMoves: [], missingAbilities: [], missingItems: []};
}

function normalizeMoves(dex: ShowdownDexService, moves: string[], diagnostics: TeamGeneratorAdapterDiagnosticsV4): TrainingMoveSlotV4[] {
  const slots = moves.slice(0, 4).map(move => moveSlotFromId(dex, move, diagnostics));
  while (slots.length < 4) slots.push(moveSlotFromId(dex, "tackle", diagnostics));
  return slots;
}

function moveSlotFromId(dex: ShowdownDexService, moveIdOrName: string, diagnostics: TeamGeneratorAdapterDiagnosticsV4): TrainingMoveSlotV4 {
  const moveId = toID(moveIdOrName);
  const detail = safeLookup(() => dex.getMoveDetail(moveId), null, diagnostics, "missingMoves", moveIdOrName);
  const pp = clampInt(detail?.pp || 0, 0, 99);
  return {
    moveId: detail?.id || moveId,
    name: detail?.name || moveIdOrName,
    nameZh: detail?.nameZh || detail?.name || moveIdOrName,
    type: detail?.type || "",
    category: detail?.category || "",
    power: detail?.power || 0,
    accuracy: detail?.accuracy ?? null,
    pp,
    maxPp: pp,
    remainingPp: pp,
  };
}

function normalizeItemId(dex: ShowdownDexService, item: string, diagnostics: TeamGeneratorAdapterDiagnosticsV4): string {
  const itemId = toID(item);
  if (!itemId) return "";
  const detail = safeLookup(() => dex.getItemDetail(itemId), null, diagnostics, "missingItems", item);
  return detail?.id || itemId;
}

function safeLookup<T>(
  lookup: () => T,
  fallback: T,
  diagnostics: TeamGeneratorAdapterDiagnosticsV4,
  bucket: "missingSpecies" | "missingMoves" | "missingAbilities" | "missingItems",
  label: string,
): T {
  try {
    return lookup();
  } catch (error) {
    if (label) {
      diagnostics[bucket].push(label);
      diagnostics.messages.push(`${bucket}: ${label}`);
    }
    return fallback;
  }
}

function normalizeStats(stats: Record<string, number> | undefined, fallback: number, max: number): StatTableV4 {
  return Object.fromEntries(STAT_IDS.map(stat => [stat, clampInt(stats?.[stat] ?? fallback, 0, max)])) as StatTableV4;
}

function normalizeGender(gender: string | undefined): TrainingGenderV4 {
  if (gender === "M" || gender === "F") return gender;
  return "N";
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(Number(value) || 0)));
}
