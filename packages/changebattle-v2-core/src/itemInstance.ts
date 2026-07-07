export type PlayerItemTypeV4 = "system" | "system-battle" | "held" | "medicine" | "berry" | "training" | "battle" | "tm" | "key" | "misc";

export type PlayerItemInstanceV4 = {
  id: string;
  itemID: string;
  name: string;
  image: string;
  cost: number;
  canSale: boolean;
  type: PlayerItemTypeV4;
  canBattleUse: boolean;
  canUse: boolean;
  canUseToPokemon: boolean;
  canTake: boolean;
  effectRound: number | null;
  getRound: number;
  maxUseCount: number | null;
  useCount: number;
  mappedItemId?: string;
  mappedItemName?: string;
  mappedItemNameZh?: string;
  mappedItemIconUrl?: string;
  mappedTeraType?: string;
  mappedTeraTypeZh?: string;
  systemReforgeKind?: "mega" | "z-crystal" | "tera";
};

export const PLAYER_ITEM_TYPES_V4: PlayerItemTypeV4[] = ["system", "system-battle", "held", "medicine", "berry", "training", "battle", "tm", "key", "misc"];

export function normalizePlayerItemTypeV4(value: unknown): PlayerItemTypeV4 | undefined {
  return PLAYER_ITEM_TYPES_V4.includes(value as PlayerItemTypeV4) ? value as PlayerItemTypeV4 : undefined;
}

export function normalizeSystemReforgeKindV4(value: unknown): PlayerItemInstanceV4["systemReforgeKind"] {
  return value === "mega" || value === "z-crystal" || value === "tera" ? value : undefined;
}

export function normalizeItemIdV4(value: unknown): string {
  const raw = String(value || "").trim();
  if (/^tm:/i.test(raw)) return `tm:${toID(raw.slice(3))}`;
  if (/^system-/i.test(raw)) return raw.toLowerCase().replace(/[^a-z0-9-]+/g, "");
  return toID(raw);
}

export function normalizeOptionalItemIdV4(value: unknown): string | undefined {
  const raw = String(value || "").trim();
  if (!raw) return undefined;
  if (/^tm:/i.test(raw)) return `tm:${toID(raw.slice(3))}`;
  return toID(raw);
}

export function normalizePlayerItemInstanceV4(item: unknown, fallback: Partial<PlayerItemInstanceV4> = {}): PlayerItemInstanceV4 | null {
  const raw = isRecord(item) ? item : {};
  const itemID = normalizeItemIdV4(raw.itemID ?? fallback.itemID);
  if (!itemID) return null;
  const name = normalizeText(raw.name) || fallback.name || itemID;
  return {
    id: normalizeText(raw.id) || fallback.id || itemID,
    itemID,
    name,
    image: normalizeText(raw.image) || fallback.image || "",
    cost: normalizeNullableNumber(raw.cost, fallback.cost ?? 0) ?? 0,
    canSale: typeof raw.canSale === "boolean" ? raw.canSale : fallback.canSale ?? true,
    type: normalizePlayerItemTypeV4(raw.type) || fallback.type || "misc",
    canBattleUse: typeof raw.canBattleUse === "boolean" ? raw.canBattleUse : fallback.canBattleUse ?? false,
    canUse: typeof raw.canUse === "boolean" ? raw.canUse : fallback.canUse ?? false,
    canUseToPokemon: typeof raw.canUseToPokemon === "boolean" ? raw.canUseToPokemon : fallback.canUseToPokemon ?? false,
    canTake: typeof raw.canTake === "boolean" ? raw.canTake : fallback.canTake ?? false,
    effectRound: normalizeNullableNumber(raw.effectRound, fallback.effectRound ?? null) ?? null,
    getRound: normalizeNullableNumber(raw.getRound, fallback.getRound ?? 0) ?? 0,
    maxUseCount: normalizeNullableNumber(raw.maxUseCount, fallback.maxUseCount ?? null) ?? null,
    useCount: normalizeNullableNumber(raw.useCount, fallback.useCount ?? 0) ?? 0,
    mappedItemId: normalizeOptionalItemIdV4(raw.mappedItemId ?? fallback.mappedItemId),
    mappedItemName: normalizeOptionalText(raw.mappedItemName ?? fallback.mappedItemName),
    mappedItemNameZh: normalizeOptionalText(raw.mappedItemNameZh ?? fallback.mappedItemNameZh),
    mappedItemIconUrl: normalizeOptionalText(raw.mappedItemIconUrl ?? fallback.mappedItemIconUrl),
    mappedTeraType: normalizeOptionalText(raw.mappedTeraType ?? fallback.mappedTeraType),
    mappedTeraTypeZh: normalizeOptionalText(raw.mappedTeraTypeZh ?? fallback.mappedTeraTypeZh),
    systemReforgeKind: normalizeSystemReforgeKindV4(raw.systemReforgeKind ?? fallback.systemReforgeKind),
  };
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

function normalizeNullableNumber(value: unknown, fallback: number | null | undefined): number | null | undefined {
  if (value === null) return null;
  if (value === undefined || value === "") return fallback;
  const next = Math.round(Number(value));
  return Number.isFinite(next) ? next : fallback;
}

function toID(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
