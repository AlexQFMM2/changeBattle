import type {BagItemView} from "@changebattle/shared";
import {ItemIcon} from "../../lib/ui";
import "./BagItemList.css";

export function BagItemList({items, selectedId, disabled = false, emptyText = "这个分类没有道具。", onSelect}: {items: BagItemView[]; selectedId?: string; disabled?: boolean; emptyText?: string; onSelect: (id: string) => void}) {
  return (
    <section className="bag-item-list" aria-label="道具列表">
      {items.length ? items.map(item => (
        <button className={selectedId === item.id ? "selected" : ""} disabled={disabled} type="button" onClick={() => onSelect(item.id)} key={item.id}>
          <ItemIcon item={item} />
          <strong>{item.name_zh || item.name}</strong>
          <b>x{item.count}</b>
        </button>
      )) : <p>{emptyText}</p>}
    </section>
  );
}
