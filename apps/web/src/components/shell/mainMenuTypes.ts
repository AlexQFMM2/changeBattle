import type {DexCategory, DexSearchRow} from "@changebattle-v2/api";

export type QuickDexCategory = Extract<DexCategory, "pokemon" | "moves" | "abilities" | "items">;

export type MainMenuShopItem = {
  id: string;
  name: string;
  name_zh?: string;
  iconUrl?: string;
  iconStyle?: string;
};

export type MainMenuDexCard = {
  id: string;
  label: string;
  eyebrow: string;
  category: QuickDexCategory;
  entry: DexSearchRow;
  icon?: string;
  shopItem?: MainMenuShopItem;
};

export type MainMenuQuickDexSeed = {
  category: QuickDexCategory;
  entry: DexSearchRow;
  query: string;
};
