import {normalizePlayerItemInstanceV4, type PlayerItemInstanceV4} from "./itemInstance.js";

export type BagStateV4 = {
  maxSize: number;
  items: PlayerItemInstanceV4[];
  battleBagEnabled?: boolean;
};

export const DEFAULT_BAG_MAX_SIZE_V4 = 50;

export function normalizeBagStateV4(bag: unknown, options: {
  defaultMaxSize?: number;
  itemNormalizer?: (item: unknown, index: number) => PlayerItemInstanceV4 | null;
} = {}): BagStateV4 {
  const raw = isRecord(bag) ? bag : {};
  const maxSize = Math.max(1, Math.floor(Number(raw.maxSize || options.defaultMaxSize || DEFAULT_BAG_MAX_SIZE_V4)));
  const normalizeItem = options.itemNormalizer || ((item: unknown, index: number) => normalizePlayerItemInstanceV4(item, {id: `item-${index + 1}`}));
  const items = Array.isArray(raw.items)
    ? raw.items.flatMap((item, index) => {
      const normalized = normalizeItem(item, index);
      return normalized ? [normalized] : [];
    }).slice(0, maxSize)
    : [];
  return {maxSize, items, battleBagEnabled: Boolean(raw.battleBagEnabled)};
}

export function findBagItemByInstanceIdV4(bag: BagStateV4, itemInstanceId: string): PlayerItemInstanceV4 | null {
  return bag.items.find(item => item.id === itemInstanceId) || null;
}

export function findBagItemByItemIdV4(bag: BagStateV4, itemId: string): PlayerItemInstanceV4 | null {
  return bag.items.find(item => item.itemID === itemId) || null;
}

export function addBagItemV4(bag: BagStateV4, item: PlayerItemInstanceV4): BagStateV4 {
  const normalized = normalizeBagStateV4(bag);
  if (normalized.items.length >= normalized.maxSize) return normalized;
  return {...normalized, items: [...normalized.items, item]};
}

export function removeBagItemByInstanceIdV4(bag: BagStateV4, itemInstanceId: string): BagStateV4 {
  const normalized = normalizeBagStateV4(bag);
  return {...normalized, items: normalized.items.filter(item => item.id !== itemInstanceId)};
}

export function replaceBagItemV4(bag: BagStateV4, item: PlayerItemInstanceV4): BagStateV4 {
  const normalized = normalizeBagStateV4(bag);
  const index = normalized.items.findIndex(entry => entry.id === item.id);
  if (index < 0) return addBagItemV4(normalized, item);
  const items = [...normalized.items];
  items[index] = item;
  return {...normalized, items};
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
