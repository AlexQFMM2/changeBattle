import type {ReactNode} from "react";
import type {BagItemView} from "@changebattle/shared";
import {ItemIcon} from "../../lib/ui";
import "./BagLayout.css";

type BagLayoutProps = {
  className?: string;
  title?: string;
  description?: string;
  items: BagItemView[];
  selectedId?: string;
  disabled?: boolean;
  emptyText?: string;
  listToolbar?: ReactNode;
  onSelect: (id: string) => void;
  onClose?: () => void;
  children: ReactNode;
};

export function BagLayout({className = "", title, description, items, selectedId, disabled = false, emptyText = "背包为空。", listToolbar, onSelect, onClose, children}: BagLayoutProps) {
  return (
    <section className={`shop-modal unified-bag-layout ${className}`.trim()}>
      {title || onClose ? (
        <header className="unified-bag-header">
          <div>
            {title ? <h2>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {onClose ? <button disabled={disabled} onClick={onClose}>关闭</button> : null}
        </header>
      ) : null}
      <div className="unified-bag-body">
        <div className="unified-bag-list">
          {listToolbar ? <div className="unified-bag-list-toolbar">{listToolbar}</div> : null}
          {items.length ? items.map(item => (
            <button className={`unified-bag-list-item ${selectedId === item.id ? "selected" : ""}`} disabled={disabled} onClick={() => onSelect(item.id)} key={item.id}>
              <ItemIcon item={item} />
              <span>
                <strong>{item.name_zh || item.name}</strong>
              </span>
              <b>x{item.count}</b>
            </button>
          )) : <p className="bag-empty">{emptyText}</p>}
        </div>
        <aside className="unified-bag-detail">
          {children}
        </aside>
      </div>
    </section>
  );
}
