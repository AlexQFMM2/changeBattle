import {useState} from "react";
import type {BagItemView, RestAction, RestState} from "@changebattle/shared";
import {ForgeMaterialList} from "./ForgeMaterialList";
import {ForgeRecipePreview} from "./ForgeRecipePreview";
import {ForgeResultPanel} from "./ForgeResultPanel";
import {blockedNormalForgeReason} from "./forgeModel";
import type {RestActionHandler} from "./restActionTypes";
import "./RestForgePanel.css";

export function RestForgePanel({rest, onClose, onAction, onNotice}: {rest: RestState; onClose: () => void; onAction: RestActionHandler; onNotice?: (message: string, tone?: "normal" | "danger") => void}) {
  const items = Object.values(rest.bag_categories || {consumable: [], held: [], tm: []}).flat();
  const normalForgeItems = items.filter(item => item.item_battle_system !== "mega" && item.item_battle_system !== "zmove");
  const specialForgeItems = items.filter(item => item.item_battle_system === "mega" || item.item_battle_system === "zmove");
  const [materials, setMaterials] = useState<string[]>([]);
  const [working, setWorking] = useState(false);
  const teraType = rest.player_display.find(pokemon => pokemon.tera_type_zh)?.tera_type_zh;
  const materialCounts = materials.reduce<Record<string, number>>((acc, id) => ({...acc, [id]: Number(acc[id] || 0) + 1}), {});

  function addMaterial(item: BagItemView) {
    if (materials.length >= 3) return;
    if (Number(materialCounts[item.id] || 0) >= item.count) return;
    setMaterials(current => [...current, item.id]);
  }

  async function runForge(action: RestAction) {
    if (working) return;
    setWorking(true);
    try {
      const ok = await Promise.resolve(onAction(action));
      if (ok !== false) setMaterials([]);
    } finally {
      setWorking(false);
    }
  }

  return (
    <section className="rest-forge-panel">
      <header className="rest-forge-panel-header">
        <div>
          <h2>熔炉</h2>
          <p>投入 3 个道具重铸；同类型材料会产出 2 个不同重铸物。</p>
        </div>
        <button type="button" onClick={onClose}>返回</button>
      </header>
      <div className="rest-forge-panel-body">
        <ForgeMaterialList
          items={normalForgeItems}
          materialCounts={materialCounts}
          materialsFull={materials.length >= 3}
          working={working}
          blockedReasonForItem={blockedNormalForgeReason}
          onAddMaterial={addMaterial}
          onBlocked={reason => onNotice?.(reason, "danger")}
        />
        <ForgeRecipePreview
          items={items}
          materialIds={materials}
          working={working}
          onRemoveMaterial={index => setMaterials(current => current.filter((_value, itemIndex) => itemIndex !== index))}
          onForge={() => runForge({type: "forge_items", itemIds: materials})}
          onClear={() => setMaterials([])}
        />
      </div>
      <ForgeResultPanel
        specialItems={specialForgeItems}
        teraType={teraType}
        coins={Number(rest.coins || 0)}
        working={working}
        onForgeSpecial={itemId => runForge({type: "forge_special_item", itemId})}
        onForgeTera={() => runForge({type: "forge_tera_orb"})}
      />
    </section>
  );
}
