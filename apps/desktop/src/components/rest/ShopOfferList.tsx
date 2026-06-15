import type {CSSProperties} from "react";
import type {ShopOffer, ShopState} from "@changebattle/shared";
import {ItemIcon, coinCostLabel, toId} from "../../lib/ui";
import "./ShopOfferList.css";

export function ShopOfferList({offers, slotCount, rolling, revealed, shop, barterActive, shopDisabled, coins, buyingOfferId, bonus, onBuy, onDetail}: {offers: ShopOffer[]; slotCount: number; rolling: boolean; revealed: boolean; shop: ShopState | null | undefined; barterActive: boolean; shopDisabled: boolean; coins: number; buyingOfferId: string; bonus: ShopState["last_roll_bonus"] | null | undefined; onBuy: (offerId: string) => void; onDetail: (offer: ShopOffer) => void}) {
  return (
    <div className={`shop-offer-list ${rolling ? "rolling" : ""}`} style={{"--shop-offer-list-slot-count": slotCount} as CSSProperties}>
      {rolling ? Array.from({length: slotCount}, (_value, index) => <ShopSlotPlaceholder label="抽取中" key={`rolling-shop-${index}`} />) : revealed && offers.length ? offers.map(offer => {
        const purchaseCount = Number(shop?.purchased_offer_counts?.[offer.offer_id] || (shop?.purchased_offer_id === offer.offer_id ? 1 : 0));
        const itemPurchaseCount = Number(shop?.purchased_item_counts?.[toId(offer.id || offer.name)] || 0);
        const isBonus = bonus?.item_id === toId(offer.id || offer.name);
        const canAffordItem = barterActive || coins >= Number(offer.cost || 0);
        const isBuying = buyingOfferId === offer.offer_id;
        return (
          <article className={`shop-offer-card ${purchaseCount ? "bought" : ""} ${isBonus ? "bonus" : ""}`} key={offer.offer_id}>
            <ItemIcon item={offer} />
            <div>
              <strong>{offer.name_zh || offer.name}</strong>
              <span>
                <b>{coinCostLabel(offer.cost)}</b>
                {offer.original_cost && Number(offer.original_cost) > Number(offer.cost || 0) ? <del>{coinCostLabel(offer.original_cost)}</del> : null}
                {offer.discount_label ? <i>{offer.discount_label}</i> : null}
                {isBonus ? <i>{bonus?.match_count} 连</i> : null}
                {purchaseCount ? <i>已买 x{purchaseCount}</i> : itemPurchaseCount ? <i>同道具 x{itemPurchaseCount}</i> : null}
              </span>
            </div>
            <div className="shop-offer-card-actions">
              <button type="button" disabled={Boolean(buyingOfferId) || !canAffordItem || shopDisabled} onClick={() => onBuy(offer.offer_id)}>{shopDisabled ? "关闭" : isBuying ? "购买中" : barterActive ? "交换" : purchaseCount ? "再买" : "购买"}</button>
              <button type="button" onClick={() => onDetail(offer)}>详情</button>
            </div>
          </article>
        );
      }) : Array.from({length: slotCount}, (_value, index) => <ShopSlotPlaceholder label="待抽取" key={`empty-shop-${index}`} />)}
    </div>
  );
}

function ShopSlotPlaceholder({label}: {label: string}) {
  return (
    <article className="shop-offer-card placeholder">
      <ItemIcon item={undefined} />
      <div>
        <strong>{label}</strong>
        <span>价格待定</span>
      </div>
      <div className="shop-offer-card-actions"><button type="button" disabled>购买</button><button type="button" disabled>详情</button></div>
    </article>
  );
}
