import type {BagItemView} from "@changebattle/shared";
import {ItemIcon, itemCategoryLabel} from "../../lib/ui";
import "./BagItemDetailPanel.css";

type BagItemDetailPanelProps = {
  item: BagItemView;
  descriptionVisible?: boolean;
  busy?: boolean;
  useLabel?: string;
  actions?: Array<{key: string; label: string; disabled?: boolean; disabledReason?: string; onUse: () => void}>;
  disabled?: boolean;
  disabledReason?: string;
  onUse: () => void;
};

export function BagItemDetailPanel({item, descriptionVisible = true, busy = false, useLabel = "使用", actions, disabled = false, disabledReason, onUse}: BagItemDetailPanelProps) {
  const resolvedActions = actions?.length ? actions : [{key: "use", label: useLabel, disabled, disabledReason, onUse}];
  const firstDisabledReason = resolvedActions.find(action => action.disabled && action.disabledReason)?.disabledReason || disabledReason;
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
        {firstDisabledReason ? <small className="bag-detail-disabled-reason">{firstDisabledReason}</small> : null}
      </div>
      <footer>
        <div className="bag-detail-action-row">
          {resolvedActions.map(action => (
            <button className="bag-detail-use-button" disabled={busy || action.disabled} onClick={action.onUse} key={action.key}>
              {busy ? "处理中" : action.label}
            </button>
          ))}
        </div>
      </footer>
    </section>
  );
}
