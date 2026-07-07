import {normalizeStatTableV4, normalizeTrainingGenderV4, type LocalPokemonV4} from "./pokemonInstance.js";

/** 玩家全局道具背包中的聚合道具记录，用于局外仓库持久化，不是局内背包的单个道具实例。 */
export type PlayerItemRecordV4 = {
  itemId: string;
  quantity: number;
  boxKind?: "prep" | "storage";
  storagePageIndex?: number;
  slotIndex?: number;
};

/** 玩家全局宝可梦箱子中宝可梦携带的招式记录。 */
export type PlayerPokemonMoveRecordV4 = {
  moveId: string;
  remainingPp?: number;
  maxPp?: number;
};

/** 玩家全局宝可梦箱子中的长期宝可梦记录，用于局外养成和后续带入局内。 */
export type PlayerPokemonRecordV4 = {
  playerPokemonId: string;
  speciesId: string;
  gender: LocalPokemonV4["gender"];
  nature: string;
  abilityId: string;
  evs: LocalPokemonV4["evs"];
  ivs: LocalPokemonV4["ivs"];
  moves: PlayerPokemonMoveRecordV4[];
  friendship: number;
  shiny: boolean;
  metAt: string;
  honors: string[];
};

/** 玩家全局仓库，包含局外道具背包和局外宝可梦箱子。 */
export type PlayerVaultV4 = {
  version: 1;
  items: PlayerItemRecordV4[];
  pokemon: PlayerPokemonRecordV4[];
  itemStoragePageCount: number;
  pokemonStoragePageCount: number;
};

export type PlayerVaultMergeResultV4 = {
  vault: PlayerVaultV4;
  depositedItemCount: number;
  rejectedItemCount: number;
};

export const PLAYER_VAULT_PAGE_SIZE_V4 = 24;

export const DEFAULT_PLAYER_VAULT_UNLOCKED_STORAGE_PAGE_COUNT_V4 = 2;

export function normalizePlayerVaultV4(value?: unknown): PlayerVaultV4 {
  const raw = isPlainRecord(value) ? value : {};
  const itemStoragePageCount = normalizePlayerVaultStoragePageCountV4(raw.itemStoragePageCount ?? raw.unlockedStoragePageCount);
  const pokemonStoragePageCount = normalizePlayerVaultStoragePageCountV4(raw.pokemonStoragePageCount ?? raw.unlockedStoragePageCount);
  const itemRecords = new Map<string, PlayerItemRecordV4>();
  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  let fallbackStorageIndex = 0;
  for (const item of rawItems) {
    let record = normalizePlayerItemRecordV4(item);
    if (!record) continue;
    if (!Number.isFinite(record.slotIndex)) {
      record = {
        ...record,
        boxKind: "storage",
        storagePageIndex: Math.floor(fallbackStorageIndex / PLAYER_VAULT_PAGE_SIZE_V4),
        slotIndex: fallbackStorageIndex % PLAYER_VAULT_PAGE_SIZE_V4,
      };
      fallbackStorageIndex += 1;
    }
    const key = playerItemRecordKeyV4(record);
    const current = itemRecords.get(key);
    itemRecords.set(key, current ? {...current, quantity: current.quantity + record.quantity} : record);
  }
  const pokemon = (Array.isArray(raw.pokemon) ? raw.pokemon : [])
    .map(entry => normalizePlayerPokemonRecordV4(entry))
    .filter((entry): entry is PlayerPokemonRecordV4 => Boolean(entry));
  return {
    version: 1,
    items: Array.from(itemRecords.values()).sort(comparePlayerItemRecordsV4),
    pokemon,
    itemStoragePageCount,
    pokemonStoragePageCount,
  };
}

export function normalizePlayerItemRecordV4(value: unknown): PlayerItemRecordV4 | null {
  if (!isPlainRecord(value)) return null;
  const itemId = normalizeNonEmptyText(value.itemId ?? value.itemID ?? value.id);
  if (!itemId) return null;
  const quantity = clampInt(value.quantity, 1, 999999, 1);
  const boxKind = value.boxKind === "prep" ? "prep" : "storage";
  const storagePageIndex = boxKind === "storage" ? clampInt(value.storagePageIndex, 0, 999, 0) : undefined;
  const slotIndex = Number.isFinite(Number(value.slotIndex)) ? clampInt(value.slotIndex, 0, PLAYER_VAULT_PAGE_SIZE_V4 - 1, 0) : undefined;
  return {itemId, quantity, boxKind, storagePageIndex, slotIndex};
}

export function normalizePlayerPokemonRecordV4(value: unknown, nowIso = new Date().toISOString()): PlayerPokemonRecordV4 | null {
  if (!isPlainRecord(value)) return null;
  const playerPokemonId = normalizeNonEmptyText(value.playerPokemonId ?? value.localPokemonId);
  const speciesId = normalizeNonEmptyText(value.speciesId);
  if (!playerPokemonId || !speciesId) return null;
  return {
    playerPokemonId,
    speciesId,
    gender: normalizeTrainingGenderV4(value.gender),
    nature: normalizeNonEmptyText(value.nature) || "Hardy",
    abilityId: normalizeNonEmptyText(value.abilityId),
    evs: normalizeStatTableV4(value.evs, 0),
    ivs: normalizeStatTableV4(value.ivs, 31),
    moves: normalizePlayerPokemonMovesV4(value.moves),
    friendship: clampInt(value.friendship, 0, 255, 0),
    shiny: Boolean(value.shiny),
    metAt: normalizeIsoText(value.metAt) || nowIso,
    honors: Array.isArray(value.honors)
      ? Array.from(new Set(value.honors.map(normalizeNonEmptyText).filter(Boolean)))
      : [],
  };
}

export function normalizePlayerPokemonMovesV4(value: unknown): PlayerPokemonMoveRecordV4[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(move => {
    if (!isPlainRecord(move)) return [];
    const moveId = normalizeNonEmptyText(move.moveId ?? move.id);
    if (!moveId) return [];
    const remainingPp = optionalNonNegativeInt(move.remainingPp);
    const maxPp = optionalNonNegativeInt(move.maxPp);
    return [{
      moveId,
      ...(remainingPp === undefined ? {} : {remainingPp}),
      ...(maxPp === undefined ? {} : {maxPp}),
    }];
  }).slice(0, 4);
}

export function normalizePlayerVaultStoragePageCountV4(value: unknown): number {
  return clampInt(value, 1, 999, DEFAULT_PLAYER_VAULT_UNLOCKED_STORAGE_PAGE_COUNT_V4);
}

export function playerVaultUnlockedStoragePageCountV4(vault?: PlayerVaultV4 | null, kind: "item" | "pokemon" = "item"): number {
  const normalized = vault ? normalizePlayerVaultV4(vault) : null;
  return kind === "pokemon"
    ? normalizePlayerVaultStoragePageCountV4(normalized?.pokemonStoragePageCount)
    : normalizePlayerVaultStoragePageCountV4(normalized?.itemStoragePageCount);
}

export function playerVaultStorageCapacityV4(vault?: PlayerVaultV4 | null, kind: "item" | "pokemon" = "item"): number {
  return PLAYER_VAULT_PAGE_SIZE_V4 * playerVaultUnlockedStoragePageCountV4(vault, kind);
}

export function addPlayerVaultItemV4(vault: PlayerVaultV4 | undefined | null, item: PlayerItemRecordV4): PlayerVaultMergeResultV4 {
  const next = normalizePlayerVaultV4(vault);
  const record = normalizePlayerItemRecordV4(item);
  if (!record) return {vault: next, depositedItemCount: 0, rejectedItemCount: 1};
  const items = next.items.map(entry => ({...entry}));
  const existing = items.find(entry => playerItemRecordKeyV4(entry) === playerItemRecordKeyV4(record));
  if (existing) {
    existing.quantity += record.quantity;
    return {vault: normalizePlayerVaultV4({...next, items}), depositedItemCount: record.quantity, rejectedItemCount: 0};
  }
  if ((record.boxKind || "storage") === "storage" && !Number.isFinite(record.slotIndex)) {
    const openSlot = firstOpenPlayerVaultStorageSlotV4(items, next.itemStoragePageCount);
    if (!openSlot) return {vault: next, depositedItemCount: 0, rejectedItemCount: record.quantity};
    items.push({...record, boxKind: "storage", storagePageIndex: openSlot.storagePageIndex, slotIndex: openSlot.slotIndex});
  } else {
    items.push(record);
  }
  return {vault: normalizePlayerVaultV4({...next, items}), depositedItemCount: record.quantity, rejectedItemCount: 0};
}

export function addPlayerVaultPokemonV4(vault: PlayerVaultV4 | undefined | null, pokemon: PlayerPokemonRecordV4): PlayerVaultV4 {
  const next = normalizePlayerVaultV4(vault);
  const record = normalizePlayerPokemonRecordV4(pokemon);
  if (!record) return next;
  const pokemonList = next.pokemon.filter(entry => entry.playerPokemonId !== record.playerPokemonId);
  pokemonList.push(record);
  return normalizePlayerVaultV4({...next, pokemon: pokemonList});
}

export function firstOpenPlayerVaultStorageSlotV4(items: PlayerItemRecordV4[], storagePageCount: number): {storagePageIndex: number; slotIndex: number} | null {
  const occupied = new Set(items
    .filter(item => (item.boxKind || "storage") === "storage")
    .map(item => `${item.storagePageIndex || 0}:${item.slotIndex || 0}`));
  for (let pageIndex = 0; pageIndex < normalizePlayerVaultStoragePageCountV4(storagePageCount); pageIndex += 1) {
    for (let slotIndex = 0; slotIndex < PLAYER_VAULT_PAGE_SIZE_V4; slotIndex += 1) {
      if (!occupied.has(`${pageIndex}:${slotIndex}`)) return {storagePageIndex: pageIndex, slotIndex};
    }
  }
  return null;
}

export function playerItemRecordKeyV4(record: PlayerItemRecordV4): string {
  return `${record.boxKind || "storage"}:${record.storagePageIndex || 0}:${record.slotIndex || 0}:${record.itemId}`;
}

export function comparePlayerItemRecordsV4(a: PlayerItemRecordV4, b: PlayerItemRecordV4): number {
  const aKind = a.boxKind || "storage";
  const bKind = b.boxKind || "storage";
  if (aKind !== bKind) return aKind === "prep" ? -1 : 1;
  const pageDelta = (a.storagePageIndex || 0) - (b.storagePageIndex || 0);
  if (pageDelta) return pageDelta;
  const slotDelta = (a.slotIndex || 0) - (b.slotIndex || 0);
  if (slotDelta) return slotDelta;
  return a.itemId.localeCompare(b.itemId);
}

function normalizeNonEmptyText(value: unknown): string {
  return String(value || "").trim();
}

function normalizeIsoText(value: unknown): string {
  const text = normalizeNonEmptyText(value);
  if (!text) return "";
  const time = Date.parse(text);
  return Number.isFinite(time) ? new Date(time).toISOString() : "";
}

function optionalNonNegativeInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return clampInt(value, 0, 999, 0);
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const next = Math.floor(Number(value));
  if (!Number.isFinite(next)) return fallback;
  return Math.max(min, Math.min(max, next));
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
