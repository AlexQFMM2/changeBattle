import type {ShopOffer} from "@changebattle/shared";
import {ItemIcon, coinCostLabel, itemCategoryLabel} from "../../lib/ui";
import "./ShopOfferDetail.css";

export function ShopOfferDetail({offer, onClose}: {offer: ShopOffer; onClose: () => void}) {
  return (
    <div className="modal-layer">
      <section className="shop-offer-detail-panel">
        <header>
          <ItemIcon item={offer} />
          <div>
            <h2>{offer.name_zh || offer.name}</h2>
            <span>{itemCategoryLabel(offer.category)}　{coinCostLabel(offer.cost)}</span>
          </div>
        </header>
        <p>{offer.desc_zh || offer.desc || offer.name_zh || offer.name}</p>
        {offer.move_name || offer.move_name_zh ? <small>技能：{offer.move_name_zh || offer.move_name}</small> : null}
        <div className="command-row">
          <button type="button" onClick={onClose}>关闭</button>
        </div>
      </section>
    </div>
  );
}
