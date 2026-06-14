import type {BagFilterKey} from "./bagModel";
import {BAG_FILTERS} from "./bagModel";
import "./BagFilterTabs.css";

export function BagFilterTabs({activeKey, counts, disabled = false, onSelect}: {activeKey: BagFilterKey; counts: Record<BagFilterKey, number>; disabled?: boolean; onSelect: (key: BagFilterKey) => void}) {
  return (
    <nav className="bag-filter-tabs" role="tablist" aria-label="背包分类">
      {BAG_FILTERS.map(entry => {
        const count = counts[entry.key] || 0;
        return (
          <button className={activeKey === entry.key ? "selected" : ""} disabled={disabled || !count} role="tab" aria-selected={activeKey === entry.key} type="button" onClick={() => onSelect(entry.key)} key={entry.key}>
            <span>{entry.label}</span>
            <b>{count}</b>
          </button>
        );
      })}
    </nav>
  );
}
