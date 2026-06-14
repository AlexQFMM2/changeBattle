import type {ShopKind} from "@changebattle/shared";

export const SHOP_KIND_VIEW: Record<ShopKind, {label: string; desc: string; cost: number; theme: string}> = {
  recovery: {label: "回复商店", desc: "恢复/树果/PP", cost: 50, theme: "green"},
  held: {label: "道具商店", desc: "战斗携带", cost: 75, theme: "blue"},
  tm: {label: "技能商店", desc: "技能机器", cost: 75, theme: "purple"},
  mega: {label: "Mega 商店", desc: "进化石", cost: 75, theme: "orange"},
  zmove: {label: "Z 招式商店", desc: "Z 纯晶", cost: 75, theme: "purple"},
  training: {label: "训练商店", desc: "培养道具", cost: 75, theme: "orange"},
};

export const DEFAULT_SHOP_KINDS: ShopKind[] = ["recovery", "held", "tm", "training"];
