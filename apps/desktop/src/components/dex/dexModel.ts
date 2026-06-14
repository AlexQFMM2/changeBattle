import type {DesktopDexCategory, DesktopDexEntry} from "@changebattle/shared";
import {assetUrl} from "../../lib/ui";

export type DexVariant = "full" | "quick";
export type DexAbilitySummary = NonNullable<DesktopDexEntry["abilities"]>[number];
export type TrainerDexFilter = "all" | "gym" | "elite4" | "champion" | "villain" | "special";

export const DEX_TABS: Array<{id: DesktopDexCategory; label: string; hint: string}> = [
  {id: "pokemon", label: "宝可梦", hint: "属性 / 种族值 / 技能池"},
  {id: "abilities", label: "特性", hint: "触发效果"},
  {id: "moves", label: "技能", hint: "属性 / 威力 / 命中"},
  {id: "items", label: "道具", hint: "战斗与养成说明"},
  {id: "trainers", label: "训练师", hint: "馆主 / 四天王 / 冠军 / 反派头目"},
];

export const TRAINER_DEX_FILTERS: Array<{id: TrainerDexFilter; label: string; query?: string}> = [
  {id: "all", label: "全部"},
  {id: "gym", label: "馆主", query: "type:gym"},
  {id: "elite4", label: "四天王", query: "type:elite4"},
  {id: "champion", label: "冠军", query: "type:champion"},
  {id: "villain", label: "反派头目", query: "type:villain"},
  {id: "special", label: "特殊事件", query: "event:special"},
];

export const DEX_PAGE_SIZE = 8;
export const QUICK_DEX_PAGE_SIZE = 4;

export function categoryIndex(category: DesktopDexCategory): number {
  return DEX_TABS.findIndex(tab => tab.id === category);
}

export function dexSpriteUrl(entry: DesktopDexEntry): string {
  const path = String(entry.sprite?.paths.front_normal || entry.sprite?.paths.front_normal_full || "");
  return path ? assetUrl(path) || "" : "";
}

export function pokemonMetaLabel(entry: DesktopDexEntry): string {
  const height = entry.heightm ? `身高 ${entry.heightm}m` : "";
  const weight = entry.weightkg ? `体重 ${entry.weightkg}kg` : "";
  const fixedGender = entry.gender === "M" ? "仅雄性" : entry.gender === "F" ? "仅雌性" : entry.gender === "N" ? "无性别" : "";
  const ratio = entry.gender_ratio && !fixedGender
    ? `♂ ${Math.round(Number(entry.gender_ratio.M || 0) * 100)}% / ♀ ${Math.round(Number(entry.gender_ratio.F || 0) * 100)}%`
    : fixedGender;
  return [height, weight, ratio].filter(Boolean).join("　");
}

export function entrySummary(entry: DesktopDexEntry): string {
  if (entry.category === "trainers") return entry.boss_summary || entry.desc_zh || "尚未遭遇";
  if (entry.category === "pokemon") return `${entry.types_zh?.join(" / ") || entry.types?.join(" / ") || "未知属性"}  No.${entry.sprite?.national_dex || "--"}`;
  if (entry.category === "moves") return `${entry.type_zh || entry.type || "未知"} / ${entry.move_category_zh || entry.move_category || "变化"}  威力 ${entry.power || "--"}  命中 ${entry.accuracy ?? "必中"}  PP ${entry.pp || "--"}`;
  return entry.desc_zh || "暂无中文说明。";
}

export function dexEntryText(entry: DesktopDexEntry): string {
  if (entry.category === "trainers") return entry.boss_summary || entry.desc_zh || "尚未遭遇";
  if (entry.category === "pokemon") return `${entry.types_zh?.join(" / ") || entry.types?.join(" / ") || "未知属性"}　No.${entry.sprite?.national_dex || "--"}`;
  if (entry.category === "moves") return `${entry.type_zh || entry.type || "未知"} / ${entry.move_category_zh || entry.move_category || "变化"}　威力 ${entry.power || "--"}　命中 ${entry.accuracy ?? "必中"}　PP ${entry.pp || "--"}`;
  return entry.desc_zh || "暂无中文说明。";
}

export function variantClass(baseClass: string, variant: DexVariant): string {
  return variant === "quick" ? `quick-${baseClass}` : baseClass;
}
