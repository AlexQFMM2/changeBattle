import type {ShopOffer, StarterItemGroupState} from "@changebattle/shared";
import {ItemIcon, itemCategoryLabel} from "../../../lib/ui";
import {offerName, purchasedIdsForGroup, selectedCountForGroup, starterGroupLimit} from "./starterItemsModel";
import type {DesktopGameState} from "@changebattle/shared";
import "./StarterOfferList.css";

export function StarterOfferList({starter, group, stagedOfferIds, focusedOfferId, onFocusOffer, onToggleOffer}: {starter: DesktopGameState["starter"]; group: StarterItemGroupState | null; stagedOfferIds: Set<string>; focusedOfferId: string; onFocusOffer: (offer: ShopOffer) => void; onToggleOffer: (offer: ShopOffer) => void}) {
  if (!group) return <div className="starter-offer-list empty">暂无可选择道具。</div>;
  const purchasedIds = new Set(purchasedIdsForGroup(group));
  const limit = starterGroupLimit(starter, group);
  const selectedCount = selectedCountForGroup(group, stagedOfferIds);
  return (
    <div className="starter-offer-list">
      {Array.from({length: 4}, (_value, slotIndex) => {
        const offer = group.offers[slotIndex];
        if (!offer) return <div className="starter-offer-slot empty" key={`${group.id}-empty-${slotIndex}`} />;
        const purchased = purchasedIds.has(offer.offer_id);
        const staged = stagedOfferIds.has(offer.offer_id);
        const selected = purchased || staged;
        const disabled = purchased || (!selected && selectedCount >= limit);
        return (
          <button className={`starter-offer-card ${selected ? "selected" : ""} ${focusedOfferId === offer.offer_id ? "focused" : ""}`} disabled={disabled} role="checkbox" aria-checked={selected} onMouseEnter={() => onFocusOffer(offer)} onFocus={() => onFocusOffer(offer)} onClick={() => onToggleOffer(offer)} type="button" key={offer.offer_id}>
            <ItemIcon item={offer} />
            <i aria-hidden="true" />
            <strong>{offerName(offer)}</strong>
            <span><b>Lv{offer.item_tier || 1}</b><em>{purchased ? "已带" : staged ? "已选" : "免费"}</em></span>
            <small>{itemCategoryLabel(offer.category)}</small>
          </button>
        );
      })}
    </div>
  );
}
