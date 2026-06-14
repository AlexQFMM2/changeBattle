import type {ShopOffer, StarterItemGroupState} from "@changebattle/shared";
import {ItemIcon, itemCategoryLabel} from "../../../lib/ui";
import {offerName} from "./starterItemsModel";
import "./StarterOfferDetail.css";

export function StarterOfferDetail({group, offer, selected, locked}: {group: StarterItemGroupState | null; offer: ShopOffer | null; selected: boolean; locked: boolean}) {
  return (
    <aside className="starter-offer-detail">
      {offer ? (
        <>
          <div className="starter-offer-detail-head">
            <ItemIcon item={offer} />
            <div>
              <span>{group?.name || "开局道具"}</span>
              <h3>{offerName(offer)}</h3>
            </div>
          </div>
          <p>{offer.desc_zh || offer.desc || offer.move_name_zh || offer.name}</p>
          <strong>{selected ? locked ? "已带入" : "已暂选" : "未选择"}</strong>
          <small>{itemCategoryLabel(offer.category)} · Lv{offer.item_tier || 1}</small>
        </>
      ) : (
        <div className="starter-offer-detail-empty">
          <span>开局道具</span>
          <h3>暂无道具</h3>
          <p>当前分类没有可选择的开局道具。</p>
        </div>
      )}
    </aside>
  );
}
