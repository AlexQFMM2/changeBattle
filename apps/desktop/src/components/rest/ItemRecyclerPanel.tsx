import type {BagItemView, RestState} from "@changebattle/shared";
import {ItemIcon, coinCostLabel} from "../../lib/ui";
import type {RestActionHandler} from "./restActionTypes";
import "./ItemRecyclerPanel.css";

export function ItemRecyclerPanel({rest, onClose, onAction, embedded = false}: {rest: RestState; onClose: () => void; onAction: RestActionHandler; embedded?: boolean}) {
  const items = Object.values(rest.bag_categories || {consumable: [], held: [], tm: []}).flat().filter(item => !isLockedBagItem(item));
  const content = (
    <section className="item-recycler-panel">
      <header>
        <div>
          <h2>道具回收商</h2>
          <p>出售背包道具。回收票据流水 {coinCostLabel(rest.recycle_receipt_value || 0)}</p>
        </div>
        <button type="button" onClick={onClose}>返回</button>
      </header>
      <div className="item-recycler-list">
        {items.length ? items.map(item => (
          <button type="button" onClick={() => onAction({type: "sell_item", itemId: item.id})} key={`recycler-${item.id}`}>
            <ItemIcon item={item} />
            <strong>{item.name_zh || item.name}</strong>
            <span>x{item.count}</span>
            <b>{coinCostLabel(item.sell_price || 0)}</b>
          </button>
        )) : <p>背包里没有可回收的道具。</p>}
      </div>
    </section>
  );
  return embedded ? content : <div className="modal-layer">{content}</div>;
}

function isLockedBagItem(item?: BagItemView | null): boolean {
  return Boolean(item?.locked);
}
