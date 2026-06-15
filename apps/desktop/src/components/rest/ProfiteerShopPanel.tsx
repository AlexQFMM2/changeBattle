import {useState} from "react";
import type {RestState, ShopOffer, ShopState} from "@changebattle/shared";
import {coinCostLabel} from "../../lib/ui";
import type {RestActionHandler} from "./restActionTypes";
import {ShopOfferDetail} from "./ShopOfferDetail";
import {ShopOfferList} from "./ShopOfferList";
import "./ProfiteerShopPanel.css";

export function ProfiteerShopPanel({rest, onClose, onAction, embedded = false}: {rest: RestState; onClose: () => void; onAction: RestActionHandler; embedded?: boolean}) {
  const offers = rest.profiteer_shop_offers || [];
  const [buyingOfferId, setBuyingOfferId] = useState("");
  const [detailOffer, setDetailOffer] = useState<ShopOffer | null>(null);
  const shop: ShopState = {
    roll_count: 0,
    next_roll_cost: null,
    slot_count: Math.max(offers.length, 3),
    offers,
    purchased_item_counts: rest.shop?.purchased_item_counts || {},
    purchased_offer_counts: {},
    purchased_offer_id: null,
    last_roll_bonus: null,
  };

  async function buy(offerId: string) {
    if (buyingOfferId) return;
    setBuyingOfferId(offerId);
    try {
      await onAction({type: "event_profiteer_buy", offerId}, "乘火打劫购买完成");
    } finally {
      setBuyingOfferId("");
    }
  }

  const content = (
    <section className="profiteer-shop-panel" aria-label="乘火打劫工作区">
      <header>
        <div>
          <h2>乘火打劫</h2>
          <p>宝可梦中心停电，普通商店关闭；这里只卖高价应急补给。</p>
        </div>
        <strong>{coinCostLabel(rest.coins)}</strong>
        <button type="button" onClick={onClose}>返回</button>
      </header>
      <div className="profiteer-shop-notice">
        <span>固定 1.5 倍价</span>
        <small>折扣券不影响本工作区；顺手牵羊等级会解锁更多格子。</small>
      </div>
      <ShopOfferList
        offers={offers}
        slotCount={shop.slot_count || 3}
        rolling={false}
        revealed
        shop={shop}
        barterActive={false}
        shopDisabled={!rest.event_services?.profiteer_shop}
        coins={Number(rest.coins || 0)}
        buyingOfferId={buyingOfferId}
        bonus={null}
        onBuy={buy}
        onDetail={setDetailOffer}
      />
      {detailOffer ? <ShopOfferDetail offer={detailOffer} onClose={() => setDetailOffer(null)} /> : null}
    </section>
  );

  return embedded ? content : <div className="modal-layer">{content}</div>;
}
