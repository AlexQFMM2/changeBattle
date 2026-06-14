import type {ReactNode} from "react";
import "./RestToolBar.css";

export type RestToolItem = {
  id: string;
  label: string;
  badge?: ReactNode;
  event?: boolean;
  disabled?: boolean;
  used?: boolean;
};

export function RestToolBar({items, activeId, onSelect}: {items: RestToolItem[]; activeId: string | null; onSelect: (id: string) => void}) {
  return (
    <nav className="rest-toolbar" aria-label="休整工具">
      {items.map(item => (
        <button
          className={`${activeId === item.id ? "selected" : ""} ${item.event ? "event-button" : ""} ${item.used ? "used" : ""}`}
          type="button"
          disabled={item.disabled}
          onClick={() => onSelect(item.id)}
          key={item.id}
        >
          {item.label}
          {item.badge ? <small>{item.badge}</small> : null}
        </button>
      ))}
      <span className="rest-toolbar-spacer" />
    </nav>
  );
}
