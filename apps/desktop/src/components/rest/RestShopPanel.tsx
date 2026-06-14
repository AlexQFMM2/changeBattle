import {useEffect, useState} from "react";
import type {RestState, ShopKind, ShopOffer, ShopState} from "@changebattle/shared";
import {coinCostLabel} from "../../lib/ui";
import type {RestActionResult} from "./restActionTypes";
import {BarterMaterialPicker} from "./BarterMaterialPicker";
import {ShopKindTabs} from "./ShopKindTabs";
import {ShopOfferDetail} from "./ShopOfferDetail";
import {ShopOfferList} from "./ShopOfferList";
import {ShopClosedNotice} from "./ShopClosedNotice";
import {DEFAULT_SHOP_KINDS, SHOP_KIND_VIEW} from "./shopModel";
import "./RestShopPanel.css";

export function RestShopPanel({rest, shop, onClose, onRoll, onBuy, onBarterBuy}: {rest: RestState; shop: RestState["shop"]; onClose: () => void; onRoll: (shopKind: ShopKind) => RestActionResult | Promise<RestActionResult>; onBuy: (offerId: string) => RestActionResult | Promise<RestActionResult>; onBarterBuy?: (offerId: string, itemIds: string[]) => RestActionResult | Promise<RestActionResult>}) {
  const [shopKind, setShopKind] = useState<ShopKind>((shop?.kind as ShopKind | undefined) || "recovery");
  const activeKind = (shop?.kind as ShopKind | undefined) || "recovery";
  const availableKinds = shop?.available_kinds?.length ? shop.available_kinds : DEFAULT_SHOP_KINDS;
  const offersForKind = (kind: ShopKind) => shop?.offers_by_kind?.[kind] || (activeKind === kind ? (shop?.offers || []) : []);
  const offers = offersForKind(shopKind);
  const slotCount = shop?.slot_count || offers.length || 3;
  const [rolling, setRolling] = useState(false);
  const [revealed, setRevealed] = useState(Boolean(offers.length));
  const [buyingOfferId, setBuyingOfferId] = useState("");
  const [barterOffer, setBarterOffer] = useState<ShopOffer | null>(null);
  const [detailOffer, setDetailOffer] = useState<ShopOffer | null>(null);
  const bonus = shop?.last_roll_bonus || null;
  const barterActive = hasRestEventStatus(rest, "barter");
  const shopDisabled = hasRestEventStatus(rest, "shop_disabled");
  const rainbowRocketActive = hasRestEventStatus(rest, "rainbow_rocket");
  const occupiedByRainbowRocket = rainbowRocketActive || shopDisabled || !shop;
  const rollCost = barterActive ? 0 : activeKind === shopKind ? Number(shop?.next_roll_cost || 0) : Number(shop?.free_rolls_remaining || 0) > 0 ? 0 : SHOP_KIND_VIEW[shopKind].cost;
  const canAffordRoll = Number(rest.coins || 0) >= rollCost;
  const discountForKind = (kind: ShopKind) => Number(rest.shop_kind_discounts?.[kind] || 1);

  useEffect(() => {
    if (!offers.length) setRevealed(false);
    else if (!rolling) setRevealed(true);
  }, [offers.length, rolling]);

  useEffect(() => {
    if (!availableKinds.includes(shopKind)) setShopKind(availableKinds[0] || "recovery");
  }, [availableKinds, shopKind]);

  async function roll() {
    if (rolling || !canAffordRoll || shopDisabled) return;
    setRolling(true);
    setRevealed(false);
    const ok = await onRoll(shopKind);
    if (ok === false) {
      setRolling(false);
      setRevealed(Boolean(offers.length));
      return;
    }
    window.setTimeout(() => {
      setRolling(false);
      setRevealed(true);
    }, 1300);
  }

  async function buy(offerId: string) {
    if (buyingOfferId) return;
    if (barterActive) {
      const offer = offers.find(entry => entry.offer_id === offerId) || null;
      setBarterOffer(offer);
      return;
    }
    setBuyingOfferId(offerId);
    try {
      await onBuy(offerId);
    } finally {
      setBuyingOfferId("");
    }
  }

  if (occupiedByRainbowRocket) {
    return (
      <section className="rest-shop-panel rest-shop-panel-closed">
        <ShopClosedNotice onBack={onClose} />
      </section>
    );
  }

  return (
    <section className={`rest-shop-panel shop-theme-${SHOP_KIND_VIEW[shopKind].theme}`}>
      <ShopKindTabs kinds={availableKinds} activeKind={shopKind} discountForKind={discountForKind} onSelect={kind => { setShopKind(kind); setRevealed(Boolean(offersForKind(kind).length)); }} />
      <div className="rest-shop-control-row">
        <span>{SHOP_KIND_VIEW[shopKind].label}　抽奖 {barterActive ? "免费" : coinCostLabel(rollCost)}　{slotCount} 格{discountForKind(shopKind) < 1 ? `　折扣 ${Math.round(discountForKind(shopKind) * 10)}折` : ""}{shop?.free_rolls_remaining ? `　免费 ${shop.free_rolls_remaining}` : ""}</span>
        <button type="button" disabled={rolling || !canAffordRoll} onClick={roll}>{rolling ? "抽取中" : "抽奖"}</button>
        <button type="button" onClick={onClose}>跳过</button>
      </div>
      {bonus && revealed ? <div className="slot-bonus-pop"><strong>抽到 {bonus.match_count} 连！</strong><span>免费获得 {bonus.count} 个 {bonus.name_zh || bonus.name}</span></div> : null}
      <ShopOfferList offers={offers} slotCount={slotCount} rolling={rolling} revealed={revealed} shop={shop as ShopState | null | undefined} barterActive={barterActive} shopDisabled={shopDisabled} coins={Number(rest.coins || 0)} buyingOfferId={buyingOfferId} bonus={bonus} onBuy={buy} onDetail={setDetailOffer} />
      {barterOffer && onBarterBuy ? <BarterMaterialPicker rest={rest} offer={barterOffer} onClose={() => setBarterOffer(null)} onBuy={async (offerId, itemIds) => { setBuyingOfferId(offerId); try { await onBarterBuy(offerId, itemIds); setBarterOffer(null); } finally { setBuyingOfferId(""); } }} /> : null}
      {detailOffer ? <ShopOfferDetail offer={detailOffer} onClose={() => setDetailOffer(null)} /> : null}
    </section>
  );
}

function hasRestEventStatus(rest: RestState, id: string): boolean {
  return Boolean(rest.rest_event_statuses?.some(status => status.id === id));
}
