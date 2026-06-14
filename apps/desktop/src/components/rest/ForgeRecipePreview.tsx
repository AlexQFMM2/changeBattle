import type {BagItemView} from "@changebattle/shared";
import {ItemIcon} from "../../lib/ui";
import {forgeKindLabel} from "./forgeModel";
import "./ForgeRecipePreview.css";

export function ForgeRecipePreview({items, materialIds, working, onRemoveMaterial, onForge, onClear}: {items: BagItemView[]; materialIds: string[]; working?: boolean; onRemoveMaterial: (index: number) => void; onForge: () => void; onClear: () => void}) {
  const selectedItems = materialIds.map(id => items.find(item => item.id === id)).filter((item): item is BagItemView => Boolean(item));
  const selectedKinds = selectedItems.map(forgeKindLabel);
  const sameKind = selectedKinds.length === 3 && selectedKinds.every(kind => kind === selectedKinds[0]);
  const hint = materialIds.length ? `材料类型：${selectedKinds.join(" / ")}${materialIds.length === 3 ? `　预计产出 ${sameKind ? 2 : 1} 个` : ""}` : "同类型 3 个材料会产出 2 个不同重铸物。";

  return (
    <aside className="forge-recipe-preview">
      <div className="forge-recipe-slots">
        {[0, 1, 2].map(index => {
          const id = materialIds[index];
          const item = items.find(entry => entry.id === id);
          return <button type="button" disabled={!id || working} onClick={() => onRemoveMaterial(index)} key={`forge-slot-${index}`}>{item ? <><ItemIcon item={item} /><span>{item.name_zh || item.name}</span></> : <span>材料 {index + 1}</span>}</button>;
        })}
      </div>
      <p>{hint}</p>
      <div className="forge-recipe-actions">
        <button className="forge-main-button" type="button" disabled={working || materialIds.length !== 3} onClick={onForge}>{working ? "重铸中" : "普通重铸"}</button>
        <button type="button" disabled={!materialIds.length || working} onClick={onClear}>清空材料</button>
      </div>
    </aside>
  );
}
