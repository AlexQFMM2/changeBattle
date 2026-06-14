import type {CSSProperties} from "react";
import type {ShopKind} from "@changebattle/shared";
import {SHOP_KIND_VIEW} from "./shopModel";
import "./ShopKindTabs.css";

export function ShopKindTabs({kinds, activeKind, discountForKind, onSelect}: {kinds: ShopKind[]; activeKind: ShopKind; discountForKind: (kind: ShopKind) => number; onSelect: (kind: ShopKind) => void}) {
  return (
    <div className="shop-kind-tabs" style={{"--shop-kind-tabs-count": kinds.length} as CSSProperties}>
      {kinds.map(kind => {
        const view = SHOP_KIND_VIEW[kind];
        const discount = discountForKind(kind);
        return (
          <button className={activeKind === kind ? "selected" : ""} type="button" onClick={() => onSelect(kind)} key={kind}>
            <strong>{view.label}{discount < 1 ? <b>{Math.round(discount * 10)}折</b> : null}</strong>
            <small>{view.desc}</small>
          </button>
        );
      })}
    </div>
  );
}
