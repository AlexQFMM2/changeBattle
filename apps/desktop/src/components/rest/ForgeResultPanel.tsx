import type {BagItemView} from "@changebattle/shared";
import {ItemIcon} from "../../lib/ui";
import "./ForgeResultPanel.css";

export function ForgeResultPanel({specialItems, teraType, coins, working, onForgeSpecial, onForgeTera}: {specialItems: BagItemView[]; teraType?: string; coins: number; working?: boolean; onForgeSpecial: (itemId: string) => void; onForgeTera: () => void}) {
  const disabled = working || coins < 50;
  return (
    <div className="forge-result-panel">
      {specialItems.length || teraType ? (
        <>
          {specialItems.map(item => <button type="button" disabled={disabled} onClick={() => onForgeSpecial(item.id)} key={`special-forge-${item.id}`}><ItemIcon item={item} /><span>{item.name_zh || item.name}</span><small>{item.item_battle_system === "mega" ? "Mega 石重铸" : "Z 纯晶重铸"} 50</small></button>)}
          {teraType ? <button type="button" disabled={disabled} onClick={onForgeTera}><span>太晶珠：{teraType}</span><small>重铸属性 50</small></button> : null}
        </>
      ) : <p>没有可进行的特殊重铸。</p>}
    </div>
  );
}
