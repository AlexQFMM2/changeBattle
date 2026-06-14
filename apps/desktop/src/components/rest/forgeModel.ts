import type {BagItemView} from "@changebattle/shared";

export function forgeKindLabel(item: BagItemView): string {
  if (item.category === "tm") return "技能机器";
  const text = `${item.id} ${item.name} ${item.name_zh} ${item.desc || ""} ${item.desc_zh || ""}`.toLowerCase();
  if (item.id.endsWith("berry") || text.includes("berry") || text.includes("树果")) return "树果";
  if (/ether|elixir/.test(item.id) || /\bpp\b/.test(text)) return "PP 补剂";
  if (item.category === "held") return "普通携带";
  return "回复";
}

export function blockedNormalForgeReason(item: BagItemView): string {
  if (item.item_battle_system === "terastal") return "该道具不能被放进普通熔炉。";
  if (item.locked) return item.lock_reason || "该道具不能被放进普通熔炉。";
  return "";
}
