import type {PokemonPowerProfileV4} from "./formalGameCatalog.js";

export type TrainingGenderV4 = "M" | "F" | "N";

export type TrainingStatusV4 = "" | "brn" | "par" | "psn" | "tox" | "slp" | "frz";

export type TrainingStatIdV4 = "hp" | "atk" | "def" | "spa" | "spd" | "spe";

export type StatTableV4 = Record<TrainingStatIdV4, number>;

export type LocalTeamV4 = {
  id: string;
  name: string;
  pokemon: LocalPokemonV4[];
};

export type LocalPokemonV4 = {
  localPokemonId: string;
  formalSourceKind?: "starter-random" | "soulmate-vault";
  sourcePlayerPokemonId?: string;
  originKind?: "soulmate" | "debug-custom";
  showdownIdentityToken?: string;
  showdownId?: string;
  pokeballId?: string;
  speciesId: string;
  name: string;
  nameZh: string;
  nickname?: string;
  level: number;
  gender: TrainingGenderV4;
  shiny: boolean;
  itemId: string;
  heldItemInstanceId?: string;
  abilityId: string;
  abilityName: string;
  abilityNameZh: string;
  nature: string;
  moves: TrainingMoveSlotV4[];
  evs: StatTableV4;
  ivs: StatTableV4;
  powerProfile?: PokemonPowerProfileV4;
  ivTotalCap?: number;
  evTotalCap?: number;
  locks?: LocalPokemonLocksV4;
  entryHp: number;
  entryStatus: TrainingStatusV4;
  maxHp: number;
  spriteUrl?: string;
  shinySpriteUrl?: string;
  frontSpriteUrl?: string;
  backSpriteUrl?: string;
  frontShinySpriteUrl?: string;
  backShinySpriteUrl?: string;
  iconUrl?: string;
  iconStyle?: string;
};

export type LocalPokemonLocksV4 = {
  ivs?: Partial<Record<TrainingStatIdV4, boolean>>;
  evs?: Partial<Record<TrainingStatIdV4, boolean>>;
  moves?: Record<number, boolean>;
};

export type TrainingMoveSlotV4 = {
  moveId: string;
  name: string;
  nameZh: string;
  type: string;
  category: string;
  power: number;
  accuracy: number | null;
  pp: number;
  maxPp: number;
  remainingPp: number;
};

export const TRAINING_STAT_IDS_V4: TrainingStatIdV4[] = ["hp", "atk", "def", "spa", "spd", "spe"];

export const TRAINING_STATUS_IDS_V4: TrainingStatusV4[] = ["", "brn", "par", "psn", "tox", "slp", "frz"];

export function getPokemonDisplayNameV4(pokemon: Pick<LocalPokemonV4, "nickname" | "nameZh" | "name" | "speciesId"> | null | undefined): string {
  if (!pokemon) return "";
  return pokemon.nickname?.trim() || pokemon.nameZh?.trim() || pokemon.name?.trim() || pokemon.speciesId;
}

export function getPokemonIdentityKeyV4(pokemon: Pick<LocalPokemonV4, "localPokemonId" | "showdownIdentityToken" | "showdownId" | "pokeballId" | "speciesId"> | null | undefined): string {
  if (!pokemon) return "";
  return pokemon.localPokemonId || pokemon.showdownIdentityToken || pokemon.showdownId || pokemon.pokeballId || pokemon.speciesId;
}

export function normalizeTrainingStatusV4(status: unknown): TrainingStatusV4 {
  return status === "brn" || status === "par" || status === "psn" || status === "tox" || status === "slp" || status === "frz"
    ? status
    : "";
}

export function normalizeTrainingGenderV4(gender: unknown): TrainingGenderV4 {
  return gender === "M" || gender === "F" || gender === "N" ? gender : "N";
}

export function normalizeStatTableV4(stats: unknown, fallback: number): StatTableV4 {
  const raw = isRecord(stats) ? stats : {};
  return Object.fromEntries(TRAINING_STAT_IDS_V4.map(stat => [stat, clampInt(raw[stat], 0, 252, fallback)])) as StatTableV4;
}

export function normalizeMoveSlotV4(move: unknown): TrainingMoveSlotV4 | null {
  if (!isRecord(move)) return null;
  const moveId = normalizeText(move.moveId);
  if (!moveId) return null;
  const pp = clampInt(move.pp, 0, 99, 0);
  const maxPp = clampInt(move.maxPp, 0, 99, pp);
  return {
    moveId,
    name: normalizeText(move.name) || moveId,
    nameZh: normalizeText(move.nameZh) || normalizeText(move.name) || moveId,
    type: normalizeText(move.type),
    category: normalizeText(move.category),
    power: clampInt(move.power, 0, 999, 0),
    accuracy: normalizeNullableNumber(move.accuracy, null),
    pp,
    maxPp,
    remainingPp: clampInt(move.remainingPp, 0, maxPp, maxPp),
  };
}

export function normalizeLocalPokemonV4(pokemon: unknown, options: {
  fallbackId?: string;
  fallbackSpeciesId?: string;
  fallbackName?: string;
  fallbackNameZh?: string;
} = {}): LocalPokemonV4 {
  const raw = isRecord(pokemon) ? pokemon : {};
  const speciesId = normalizeText(raw.speciesId) || options.fallbackSpeciesId || "pikachu";
  const name = normalizeText(raw.name) || options.fallbackName || speciesId;
  const nameZh = normalizeText(raw.nameZh) || options.fallbackNameZh || name;
  const maxHp = Math.max(1, clampInt(raw.maxHp, 1, 999, 1));
  const rawMoves = Array.isArray(raw.moves) ? raw.moves : [];
  return {
    localPokemonId: normalizeText(raw.localPokemonId) || options.fallbackId || speciesId,
    formalSourceKind: raw.formalSourceKind === "starter-random" || raw.formalSourceKind === "soulmate-vault" ? raw.formalSourceKind : undefined,
    sourcePlayerPokemonId: normalizeOptionalText(raw.sourcePlayerPokemonId),
    originKind: raw.originKind === "soulmate" || raw.originKind === "debug-custom" ? raw.originKind : undefined,
    showdownIdentityToken: normalizeOptionalText(raw.showdownIdentityToken),
    showdownId: normalizeOptionalText(raw.showdownId),
    pokeballId: normalizeOptionalText(raw.pokeballId),
    speciesId,
    name,
    nameZh,
    nickname: normalizeOptionalText(raw.nickname),
    level: clampInt(raw.level, 1, 100, 50),
    gender: normalizeTrainingGenderV4(raw.gender),
    shiny: Boolean(raw.shiny),
    itemId: normalizeText(raw.itemId),
    heldItemInstanceId: normalizeOptionalText(raw.heldItemInstanceId),
    abilityId: normalizeText(raw.abilityId),
    abilityName: normalizeText(raw.abilityName),
    abilityNameZh: normalizeText(raw.abilityNameZh) || normalizeText(raw.abilityName),
    nature: normalizeText(raw.nature) || "Serious",
    moves: rawMoves.flatMap(move => {
      const normalized = normalizeMoveSlotV4(move);
      return normalized ? [normalized] : [];
    }).slice(0, 4),
    evs: normalizeStatTableV4(raw.evs, 0),
    ivs: normalizeStatTableV4(raw.ivs, 31),
    powerProfile: normalizePokemonPowerProfile(raw.powerProfile),
    ivTotalCap: normalizeOptionalPositiveNumber(raw.ivTotalCap),
    evTotalCap: normalizeOptionalPositiveNumber(raw.evTotalCap),
    locks: normalizeLocalPokemonLocksV4(raw.locks),
    entryHp: clampInt(raw.entryHp, 0, maxHp, maxHp),
    entryStatus: normalizeTrainingStatusV4(raw.entryStatus),
    maxHp,
    spriteUrl: normalizeOptionalText(raw.spriteUrl),
    shinySpriteUrl: normalizeOptionalText(raw.shinySpriteUrl),
    frontSpriteUrl: normalizeOptionalText(raw.frontSpriteUrl),
    backSpriteUrl: normalizeOptionalText(raw.backSpriteUrl),
    frontShinySpriteUrl: normalizeOptionalText(raw.frontShinySpriteUrl),
    backShinySpriteUrl: normalizeOptionalText(raw.backShinySpriteUrl),
    iconUrl: normalizeOptionalText(raw.iconUrl),
    iconStyle: normalizeOptionalText(raw.iconStyle),
  };
}

export function normalizeLocalTeamV4(team: unknown, options: {fallbackId?: string; fallbackName?: string} = {}): LocalTeamV4 {
  const raw = isRecord(team) ? team : {};
  const pokemon = Array.isArray(raw.pokemon)
    ? raw.pokemon.map((entry, index) => normalizeLocalPokemonV4(entry, {fallbackId: `pokemon-${index + 1}`}))
    : [];
  return {
    id: normalizeText(raw.id) || options.fallbackId || "team",
    name: normalizeText(raw.name) || options.fallbackName || "队伍",
    pokemon,
  };
}

function normalizeLocalPokemonLocksV4(locks: unknown): LocalPokemonLocksV4 | undefined {
  if (!isRecord(locks)) return undefined;
  const ivs = normalizeStatLocks(locks.ivs);
  const evs = normalizeStatLocks(locks.evs);
  const moves = isRecord(locks.moves)
    ? Object.fromEntries(Object.entries(locks.moves).filter(([slot]) => Number.isInteger(Number(slot))).map(([slot, locked]) => [Number(slot), Boolean(locked)]))
    : undefined;
  if (!ivs && !evs && !moves) return undefined;
  return {ivs, evs, moves};
}

function normalizeStatLocks(value: unknown): Partial<Record<TrainingStatIdV4, boolean>> | undefined {
  if (!isRecord(value)) return undefined;
  const entries = TRAINING_STAT_IDS_V4.flatMap(stat => stat in value ? [[stat, Boolean(value[stat])] as const] : []);
  return entries.length ? Object.fromEntries(entries) : undefined;
}

function normalizePokemonPowerProfile(value: unknown): PokemonPowerProfileV4 | undefined {
  return value === "rookie" || value === "normal" || value === "elite" || value === "boss" || value === "champion"
    ? value
    : undefined;
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeText(value: unknown): string {
  return String(value || "").trim();
}

function normalizeOptionalText(value: unknown): string | undefined {
  const text = normalizeText(value);
  return text || undefined;
}

function normalizeOptionalPositiveNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const next = Math.max(0, Math.round(Number(value)));
  return Number.isFinite(next) ? next : undefined;
}

function normalizeNullableNumber(value: unknown, fallback: number | null): number | null {
  if (value === null) return null;
  if (value === undefined || value === "") return fallback;
  const next = Math.round(Number(value));
  return Number.isFinite(next) ? next : fallback;
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const next = Math.round(Number(value));
  if (!Number.isFinite(next)) return fallback;
  return Math.max(min, Math.min(max, next));
}
