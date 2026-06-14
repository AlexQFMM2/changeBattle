import type {BagItemView} from "@changebattle/shared";
import {ItemIcon, itemCategoryLabel} from "../../lib/ui";
import "./ForgeMaterialList.css";

export function ForgeMaterialList({items, materialCounts, materialsFull, working, blockedReasonForItem, onAddMaterial, onBlocked}: {items: BagItemView[]; materialCounts: Record<string, number>; materialsFull: boolean; working?: boolean; blockedReasonForItem: (item: BagItemView) => string; onAddMaterial: (item: BagItemView) => void; onBlocked?: (reason: string) => void}) {
  return (
    <div className="forge-material-list-panel">
      {items.length ? items.map(item => {
        const picked = Number(materialCounts[item.id] || 0);
        const blockedReason = blockedReasonForItem(item);
        const disabled = Boolean(working || (!blockedReason && (materialsFull || picked >= item.count)));
        return (
          <button className={`${picked ? "selected" : ""} ${blockedReason ? "blocked" : ""}`} type="button" disabled={disabled} onClick={() => { if (blockedReason) { onBlocked?.(blockedReason); return; } onAddMaterial(item); }} key={`forge-material-${item.id}`}>
            <ItemIcon item={item} />
            <span>{item.name_zh || item.name}</span>
            <small>x{item.count}{picked ? ` / 已选 ${picked}` : ""}</small>
            <em>{blockedReason || item.desc_zh || item.desc || itemCategoryLabel(item.category)}</em>
          </button>
        );
      }) : <p>背包里没有可投入普通熔炉的道具。</p>}
    </div>
  );
}
