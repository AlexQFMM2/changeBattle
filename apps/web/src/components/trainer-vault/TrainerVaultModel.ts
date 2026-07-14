import type {CSSProperties} from "react";
import type {ChangeBattleV2Api, PlayerItemInstanceV4, PlayerItemRecordV4, PlayerPokemonRecordV4, PlayerVaultV4} from "@changebattle-v2/api";
import {styleUrlAssetPath} from "../../lib/assetUrl";
import {pokemonSpriteUrl} from "../../lib/showdownPokemonSpriteAdapter";
import type {VaultMoveReplaceMove} from "./VaultMoveReplaceModal";

export type TrainerVaultTab = "bag" | "pokemon";
export type TrainerVaultPokemonDetailTab = "overview" | "stats" | "moves" | "evolution" | "honors";
export type VaultPageKind = "storage";
export type VaultPageEntry =
  | {kind: "item"; key: string; item: PlayerItemRecordV4; pageKind: VaultPageKind; storagePageIndex: number; slotIndex: number}
  | {kind: "pokemon"; key: string; pokemon: PlayerPokemonRecordV4; pageKind: VaultPageKind; storagePageIndex: number; slotIndex: number}
  | {kind: "empty"; key: string; pageKind: VaultPageKind; storagePageIndex: number; slotIndex: number};
export type VaultItemEntry = Extract<VaultPageEntry, {kind: "item"}>;
export type VaultPokemonEntry = Extract<VaultPageEntry, {kind: "pokemon"}>;
export type VaultActiveUseItem = {
  itemKey: string;
  itemId: string;
  itemName: string;
  quantity: number;
  startedFromTab: TrainerVaultTab;
  startedFromPageIndex: number;
};

type VaultItemLocation = {pageKind: VaultPageKind; storagePageIndex: number; slotIndex: number};

export const ITEM_PAGE_SIZE = 6;
export const POKEMON_PAGE_SIZE = 24;
export const STORAGE_BOX_UNLOCK_BP_COST = 24;

export function buildItemPageEntries(playerVault: PlayerVaultV4, storagePageIndex: number): VaultItemEntry[] {
  return playerVault.items
    .map(item => {
      const location = itemLocation(item);
      return {kind: "item" as const, key: itemRecordKey(item), item, ...location};
    })
    .filter(entry => entry.storagePageIndex === storagePageIndex)
    .sort((left, right) => left.slotIndex - right.slotIndex || left.item.itemId.localeCompare(right.item.itemId));
}

export function buildPokemonPageEntries(playerVault: PlayerVaultV4, storagePageIndex: number): VaultPageEntry[] {
  const entries = createEmptyEntries(POKEMON_PAGE_SIZE, storagePageIndex);
  const start = Math.max(0, storagePageIndex) * POKEMON_PAGE_SIZE;
  playerVault.pokemon.slice(start, start + POKEMON_PAGE_SIZE).forEach((pokemon, index) => {
    entries[index] = {kind: "pokemon", key: `pokemon:${pokemon.playerPokemonId}`, pokemon, pageKind: "storage", storagePageIndex, slotIndex: index};
  });
  return entries;
}

export function createEmptyEntries(slotCount: number, storagePageIndex: number): VaultPageEntry[] {
  return Array.from({length: slotCount}, (_, slotIndex) => ({kind: "empty", key: `empty:storage:${storagePageIndex}:${slotIndex}`, pageKind: "storage", storagePageIndex, slotIndex}));
}

export function isItemEntryWithKey(key: string): (entry: VaultItemEntry) => entry is VaultItemEntry {
  return (entry): entry is VaultItemEntry => entry.kind === "item" && entry.key === key;
}

export function isPokemonEntryWithId(pokemonId: string): (entry: VaultPageEntry) => entry is VaultPokemonEntry {
  return (entry): entry is VaultPokemonEntry => entry.kind === "pokemon" && entry.pokemon.playerPokemonId === pokemonId;
}

export function findItemEntryByKey(playerVault: PlayerVaultV4, key: string): VaultItemEntry | null {
  const item = findPlayerVaultItemRecordByKey(playerVault, key);
  if (!item) return null;
  const location = itemLocation(item);
  return {kind: "item", key: itemRecordKey(item), item, ...location};
}

export function findPokemonEntryById(playerVault: PlayerVaultV4, pokemonId: string): VaultPokemonEntry | null {
  if (!pokemonId) return null;
  const index = playerVault.pokemon.findIndex(entry => entry.playerPokemonId === pokemonId);
  const pokemon = playerVault.pokemon[index];
  if (!pokemon || index < 0) return null;
  return {
    kind: "pokemon",
    key: `pokemon:${pokemon.playerPokemonId}`,
    pokemon,
    pageKind: "storage",
    storagePageIndex: Math.floor(index / POKEMON_PAGE_SIZE),
    slotIndex: index % POKEMON_PAGE_SIZE,
  };
}

export function findPlayerVaultItemRecordByKey(playerVault: PlayerVaultV4, key: string): PlayerItemRecordV4 | null {
  return playerVault.items.find(entry => itemRecordKey(entry) === key || entry.itemId === key) || null;
}

export function itemRecordKey(item: PlayerItemRecordV4): string {
  const location = itemLocation(item);
  return `${location.pageKind}:${location.storagePageIndex}:${location.slotIndex}:${item.itemId}`;
}

export function itemRecordView(api: ChangeBattleV2Api, item: PlayerItemRecordV4, options: {preferSpriteIcon?: boolean} = {}): {name: string; kindLabel: string; description: string; iconItem: PlayerItemInstanceV4} {
  try {
    const detail = cachedItemDetail(api, item.itemId);
    return {
      name: detail.nameZh || detail.name || item.itemId,
      kindLabel: detail.kindLabel || detail.kind || "道具",
      description: detail.description || detail.effectSummary || "",
      iconItem: {
        id: `player-vault-item-${item.itemId}`,
        itemID: item.itemId,
        name: detail.nameZh || detail.name || item.itemId,
        type: itemTypeFromDetailKind(detail.kind),
        useCount: item.quantity,
        image: options.preferSpriteIcon ? "" : detail.iconUrl || "",
        canBattleUse: Boolean(detail.canBattleUse),
        canUse: Boolean(detail.canUse),
        canUseToPokemon: Boolean(detail.canUseToPokemon),
        canTake: Boolean(detail.canTake),
        canSale: Boolean(detail.canSale),
        cost: detail.cost || 0,
        effectRound: null,
        getRound: 0,
        maxUseCount: null,
      },
    };
  } catch {
    return {
      name: item.itemId,
      kindLabel: "道具",
      description: "",
      iconItem: {
        id: `player-vault-item-${item.itemId}`,
        itemID: item.itemId,
        name: item.itemId,
        image: "",
        type: "misc",
        useCount: item.quantity,
        canBattleUse: false,
        canUse: false,
        canUseToPokemon: false,
        canTake: false,
        canSale: false,
        cost: 0,
        effectRound: null,
        getRound: 0,
        maxUseCount: null,
      },
    };
  }
}

export function safeItemDetail(api: ChangeBattleV2Api, itemId: string) {
  try {
    return cachedItemDetail(api, itemId);
  } catch {
    return null;
  }
}

export function isVaultUsableItemDetail(detail: ReturnType<typeof safeItemDetail>): boolean {
  return Boolean(
    detail?.friendshipEffect ||
    detail?.trainingEffect ||
    detail?.moveTeachingEffect ||
    detail?.kind === "tm" ||
    detail?.kind === "evolution" ||
    detail?.kind === "battle" ||
    detail?.kind === "held",
  );
}

export function moveTeachingUnavailableMessage(view: Extract<ReturnType<ChangeBattleV2Api["getPlayerVaultMoveTeachingView"]>, {ok: true}>): string {
  const moveName = view.unavailableMove?.nameZh || view.unavailableMove?.name || "";
  if (view.unavailableReason?.includes("已经学会") && moveName) return `${view.pokemonName} 已经学会「${moveName}」了。`;
  if (view.unavailableReason?.includes("无法通过技能机器") && moveName) return `「${moveName}」${view.pokemonName}学不会。`;
  return view.unavailableReason || "这只宝可梦没有可学习的技能。";
}

export function playerPokemonDisplayName(api: ChangeBattleV2Api, pokemon: PlayerPokemonRecordV4): string {
  const view = pokemonRecordView(api, pokemon);
  return pokemon.nickname ? `${pokemon.nickname}（${view.name}）` : view.name;
}

export function playerPokemonShortName(api: ChangeBattleV2Api, pokemon: PlayerPokemonRecordV4): string {
  if (pokemon.nickname) return pokemon.nickname;
  return pokemonRecordView(api, pokemon).name;
}

export function playerMoveToReplaceMove(api: ChangeBattleV2Api, moveId: string): VaultMoveReplaceMove {
  try {
    const detail = cachedMoveDetail(api, moveId);
    return {
      moveId: detail.id,
      name: detail.name,
      nameZh: detail.nameZh || detail.name,
      type: detail.type,
      category: detail.category,
      power: detail.power,
      pp: detail.pp,
    };
  } catch {
    return {moveId, name: moveId, nameZh: moveId, type: "Normal", category: "Physical", power: "--", pp: "--"};
  }
}

export function pokemonRecordView(api: ChangeBattleV2Api, pokemon: PlayerPokemonRecordV4): {name: string; abilityName: string; spriteUrl: string; iconUrl: string; iconStyle: string} {
  try {
    const detail = cachedPokemonDetail(api, pokemon.speciesId);
    const ability = detail.abilities.find(entry => entry.id === pokemon.abilityId);
    return {
      name: detail.nameZh || detail.name || pokemon.speciesId,
      abilityName: ability?.nameZh || ability?.name || pokemon.abilityId || "特性未知",
      spriteUrl: pokemonSpriteUrl({speciesId: pokemon.speciesId, shiny: pokemon.shiny}),
      iconUrl: detail.sprites.iconUrl || "",
      iconStyle: detail.sprites.iconStyle || "",
    };
  } catch {
    return {
      name: pokemon.speciesId,
      abilityName: pokemon.abilityId || "特性未知",
      spriteUrl: pokemonSpriteUrl({speciesId: pokemon.speciesId, shiny: pokemon.shiny}),
      iconUrl: "",
      iconStyle: "",
    };
  }
}

export function spriteStyleFromCss(css: string): CSSProperties | null {
  const match = /url\(([^)]+)\).*?(-?\d+)px\s+(-?\d+)px/.exec(css);
  if (!match) return null;
  return {
    backgroundImage: `url("${styleUrlAssetPath(match[1])}")`,
    backgroundPosition: `${match[2]}px ${match[3]}px`,
    backgroundRepeat: "no-repeat",
  };
}

function itemLocation(item: PlayerItemRecordV4): VaultItemLocation {
  return {
    pageKind: "storage",
    storagePageIndex: Math.max(0, Math.floor(Number(item.storagePageIndex || 0))),
    slotIndex: clampItemSlotIndex(item.slotIndex),
  };
}

function clampItemSlotIndex(value: unknown): number {
  const slotIndex = Math.floor(Number(value));
  if (!Number.isFinite(slotIndex)) return 0;
  return Math.min(ITEM_PAGE_SIZE - 1, Math.max(0, slotIndex));
}

type TrainerVaultDetailCache = {
  items: Map<string, ReturnType<ChangeBattleV2Api["getItemDetail"]>>;
  pokemon: Map<string, ReturnType<ChangeBattleV2Api["getPokemonDetail"]>>;
  moves: Map<string, ReturnType<ChangeBattleV2Api["getMoveDetail"]>>;
};

const TRAINER_VAULT_DETAIL_CACHE = new WeakMap<ChangeBattleV2Api, TrainerVaultDetailCache>();

function trainerVaultDetailCache(api: ChangeBattleV2Api): TrainerVaultDetailCache {
  const existing = TRAINER_VAULT_DETAIL_CACHE.get(api);
  if (existing) return existing;
  const cache = {items: new Map(), pokemon: new Map(), moves: new Map()};
  TRAINER_VAULT_DETAIL_CACHE.set(api, cache);
  return cache;
}

function cachedItemDetail(api: ChangeBattleV2Api, itemId: string): ReturnType<ChangeBattleV2Api["getItemDetail"]> {
  const cache = trainerVaultDetailCache(api).items;
  const cached = cache.get(itemId);
  if (cached) return cached;
  const detail = api.getItemDetail(itemId);
  cache.set(itemId, detail);
  return detail;
}

function cachedPokemonDetail(api: ChangeBattleV2Api, speciesId: string): ReturnType<ChangeBattleV2Api["getPokemonDetail"]> {
  const cache = trainerVaultDetailCache(api).pokemon;
  const cached = cache.get(speciesId);
  if (cached) return cached;
  const detail = api.getPokemonDetail(speciesId);
  cache.set(speciesId, detail);
  return detail;
}

function cachedMoveDetail(api: ChangeBattleV2Api, moveId: string): ReturnType<ChangeBattleV2Api["getMoveDetail"]> {
  const cache = trainerVaultDetailCache(api).moves;
  const cached = cache.get(moveId);
  if (cached) return cached;
  const detail = api.getMoveDetail(moveId);
  cache.set(moveId, detail);
  return detail;
}

function itemTypeFromDetailKind(kind: string): PlayerItemInstanceV4["type"] {
  if (kind === "berry") return "berry";
  if (kind === "recovery" || kind === "revive" || kind === "pp") return "medicine";
  if (kind === "tm") return "tm";
  if (kind === "training") return "training";
  if (kind === "parenting" || kind === "evolution") return "misc";
  if (kind === "system") return "system";
  if (kind === "system-battle") return "system-battle";
  if (kind === "held") return "held";
  if (kind === "battle") return "battle";
  return "misc";
}
