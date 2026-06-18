import type {BagItemView, PricedMove, StatId} from "@changebattle/shared";
import {REST_SHOP_DISCOUNT_COUPONS} from "@changebattle/shared";
import {STAT_ROWS} from "../../lib/ui";
import {toId} from "../../lib/ui";

export type BagFilterKey = "recovery" | "tm" | "battle" | "training" | "system";

export type TrainingItemUi = {scope: "one" | "all"; fixedStat?: StatId};

export const TRAINING_ITEM_UI: Record<string, TrainingItemUi> = {
  pomegberry: {scope: "one", fixedStat: "hp"},
  kelpsyberry: {scope: "one", fixedStat: "atk"},
  qualotberry: {scope: "one", fixedStat: "def"},
  hondewberry: {scope: "one", fixedStat: "spa"},
  grepaberry: {scope: "one", fixedStat: "spd"},
  tamatoberry: {scope: "one", fixedStat: "spe"},
  hpup: {scope: "one", fixedStat: "hp"},
  protein: {scope: "one", fixedStat: "atk"},
  iron: {scope: "one", fixedStat: "def"},
  calcium: {scope: "one", fixedStat: "spa"},
  zinc: {scope: "one", fixedStat: "spd"},
  carbos: {scope: "one", fixedStat: "spe"},
  bottlecap: {scope: "one"},
  goldbottlecap: {scope: "all"},
};

export const STAT_LABELS = Object.fromEntries(STAT_ROWS) as Record<StatId, string>;

export const BAG_FILTERS: Array<{key: BagFilterKey; label: string}> = [
  {key: "recovery", label: "恢复"},
  {key: "battle", label: "携带"},
  {key: "tm", label: "技能"},
  {key: "training", label: "训练"},
  {key: "system", label: "特殊"},
];

export function isLockedBagItem(item?: BagItemView | null): boolean {
  return Boolean(item?.locked);
}

export function isTrainingBagItem(item: BagItemView): boolean {
  const id = toId(item.id);
  return Boolean(TRAINING_ITEM_UI[id] || id === "rarecandy" || id === "abilitycapsule" || id === "abilitypatch" || id.endsWith("mint"));
}

export function bagFilterForItem(item: BagItemView, filter: BagFilterKey): boolean {
  const system = Boolean(item.locked || REST_SHOP_DISCOUNT_COUPONS[toId(item.id)]);
  const training = isTrainingBagItem(item);
  if (filter === "system") return system;
  if (filter === "training") return !system && training;
  if (filter === "tm") return !system && item.category === "tm";
  if (filter === "battle") return !system && !training && (item.category === "held" || Boolean(item.item_battle_system));
  if (filter === "recovery") return !system && !training && item.category === "consumable";
  return true;
}

export function tmMoveId(item?: BagItemView): string {
  if (!item) return "";
  if (item.move_id) return toId(item.move_id);
  return item.id.startsWith("tm:") ? toId(item.id.slice(3)) : "";
}

function stripMachinePrefix(value: string | undefined): string {
  return String(value || "").replace(/^tm\s*/i, "").replace(/^技能机器\s*/, "").trim();
}

export function tmMoveSearchQuery(item?: BagItemView): string {
  if (!item) return "";
  return tmMoveId(item) || stripMachinePrefix(item.move_name || item.move_name_zh || item.name_zh || item.name);
}

export function resolveTmMoveIdForSlot(item: BagItemView | undefined, learnableMoves: PricedMove[]): string {
  if (!item) return "";
  const explicit = tmMoveId(item);
  if (explicit) return explicit;
  const rawLabels = [item.move_name, item.move_name_zh, item.name, item.name_zh].map(stripMachinePrefix).filter(Boolean);
  const idLabels = new Set(rawLabels.map(toId).filter(Boolean));
  const textLabels = new Set(rawLabels.map(label => label.toLowerCase()));
  const match = learnableMoves.find(move => {
    const moveId = toId(move.id || move.name);
    if (moveId && idLabels.has(moveId)) return true;
    return [move.name, move.name_zh].map(label => stripMachinePrefix(label).toLowerCase()).some(label => label && textLabels.has(label));
  });
  return match ? toId(match.id || match.name) : "";
}

export function tmFallbackMove(item: BagItemView): PricedMove {
  const moveId = tmMoveId(item);
  return {
    id: moveId,
    name: item.move_name || moveId,
    name_zh: item.move_name_zh || item.name_zh?.replace(/^技能机器\s*/, "") || moveId,
    type: item.move_type || "Normal",
    type_zh: item.move_type_zh || item.move_type || "一般",
    category: "Status",
    category_zh: "变化",
    power: 0,
    accuracy: null,
    pp: 0,
    priority: 0,
    desc: item.desc || "",
    desc_zh: item.desc_zh || "",
    short_desc: item.desc || "",
    short_desc_zh: item.desc_zh || "",
    cost: 0,
  };
}
