import type {DesktopDexEntry, ShopItem} from "@changebattle/shared";
import type {QuickDexCategory} from "../dex/QuickDexModal";

export type MainMenuDexCard = {
  id: string;
  label: string;
  eyebrow: string;
  category: QuickDexCategory;
  entry: DesktopDexEntry;
  icon?: string;
  shopItem?: ShopItem;
};

export type MainMenuQuickDexSeed = {
  category: QuickDexCategory;
  entry: DesktopDexEntry;
  query: string;
};
