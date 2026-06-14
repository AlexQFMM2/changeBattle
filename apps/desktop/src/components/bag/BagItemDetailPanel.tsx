import type {BagItemView} from "@changebattle/shared";
import {ItemIcon, itemCategoryLabel} from "../../lib/ui";
import "./BagItemDetailPanel.css";

type BagItemDetailPanelProps = {
  item: BagItemView;
  descriptionVisible?: boolean;
  busy?: boolean;
  useLabel?: string;
  disabled?: boolean;
  disabledReason?: string;
  onUse: () => void;
};

export function BagItemDetailPanel({item, descriptionVisible = true, busy = false, useLabel = "使用", disabled = false, disabledReason, onUse}: BagItemDetailPanelProps) {
  return (
    <section className="bag-item-detail-panel">
      <div className="bag-detail-hero">
        <div className="bag-detail-icon"><ItemIcon item={item} /></div>
        <strong>{item.name_zh || item.name}</strong>
        <small>{item.name || item.id}</small>
        <small className="bag-detail-meta"><span>{itemCategoryLabel(item.category)}</span><span>剩余 x{item.count}</span></small>
      </div>
      <div className="bag-detail-description">
        <p>{descriptionVisible ? item.desc_zh || item.desc || item.name : "？？？"}</p>
        {disabledReason ? <small className="bag-detail-disabled-reason">{disabledReason}</small> : null}
      </div>
      <footer>
        <button className="bag-detail-use-button" disabled={busy || disabled} onClick={onUse}>{busy ? "处理中" : useLabel}</button>
      </footer>
    </section>
  );
}
