import type {ChangeEvent} from "react";
import type {DexVariant} from "./dexModel";
import "./DexSearchBar.css";

export function DexSearchBar({variant = "full", query, loading, resultCount, total, placeholder = "搜索名称、英文、属性、说明", onQueryChange}: {variant?: DexVariant; query: string; loading?: boolean; resultCount: number; total: number; placeholder?: string; onQueryChange: (query: string) => void}) {
  const className = variant === "quick" ? "quick-dex-tools dex-search-bar quick" : "dex-search-bar";
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onQueryChange(event.target.value);
  }
  return (
    <div className={className}>
      <input className={variant === "full" ? "dex-search-input" : ""} value={query} onChange={handleChange} placeholder={placeholder} />
      {variant === "quick" ? <span>{loading ? "读取中..." : `${resultCount}/${total}`}</span> : null}
    </div>
  );
}
