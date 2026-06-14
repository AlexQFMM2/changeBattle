import type {DesktopDexCategory} from "@changebattle/shared";
import {DEX_TABS, TRAINER_DEX_FILTERS, type DexVariant, type TrainerDexFilter} from "./dexModel";
import "./DexCategoryTabs.css";

export function DexCategoryTabs({variant = "full", category, trainerFilter = "all", activeMega = null, onCategoryChange, onTrainerFilterChange, onCategoryPreview}: {variant?: DexVariant; category: DesktopDexCategory; trainerFilter?: TrainerDexFilter; activeMega?: DesktopDexCategory | null; onCategoryChange: (category: DesktopDexCategory) => void; onTrainerFilterChange?: (filter: TrainerDexFilter) => void; onCategoryPreview?: (category: DesktopDexCategory) => void}) {
  if (variant === "quick") {
    return (
      <nav className="quick-dex-mega-tabs dex-category-tabs quick" aria-label="图鉴分类">
        {DEX_TABS.map(tab => (
          <button className={category === tab.id ? "selected" : ""} onMouseEnter={() => onCategoryPreview?.(tab.id)} onFocus={() => onCategoryPreview?.(tab.id)} onClick={() => onCategoryChange(tab.id)} key={tab.id}>
            {activeMega === tab.id ? <i /> : null}
            <span>{tab.label}<b>⌄</b></span>
          </button>
        ))}
      </nav>
    );
  }
  return (
    <>
      <nav className="dex-tabs dex-category-tabs" aria-label="图鉴分类">
        {DEX_TABS.map(tab => <button className={category === tab.id ? "selected" : ""} onClick={() => onCategoryChange(tab.id)} key={tab.id}>{tab.label}</button>)}
      </nav>
      {category === "trainers" && onTrainerFilterChange ? (
        <nav className="dex-subtabs dex-category-subtabs" aria-label="训练师筛选">
          {TRAINER_DEX_FILTERS.map(filter => <button className={trainerFilter === filter.id ? "selected" : ""} onClick={() => onTrainerFilterChange(filter.id)} key={filter.id}>{filter.label}</button>)}
        </nav>
      ) : null}
    </>
  );
}
