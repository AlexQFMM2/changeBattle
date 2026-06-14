import {useEffect, useMemo, useState} from "react";
import type {DesktopGameState, ShopOffer} from "@changebattle/shared";
import {StarterItemTabs} from "./StarterItemTabs";
import {StarterItemsActionBar} from "./StarterItemsActionBar";
import {StarterOfferDetail} from "./StarterOfferDetail";
import {StarterOfferList} from "./StarterOfferList";
import {offerName, purchasedIdsForGroup, purchasedStarterOffers, selectedCountForGroup, starterGroupLimit, starterItemGroups, submissionOfferIds} from "./starterItemsModel";
import "./StarterItemsPage.css";

export function StarterItemsPage({starter, onChoose, onBack, previewNoSubmit = false}: {starter: DesktopGameState["starter"]; onChoose: (offerId: string | null) => void | Promise<void>; onBack: () => void | Promise<void>; previewNoSubmit?: boolean}) {
  const groups = useMemo(() => starterItemGroups(starter), [starter]);
  const purchasedOffers = useMemo(() => purchasedStarterOffers(starter), [starter]);
  const [activeGroupId, setActiveGroupId] = useState(groups[0]?.id || "");
  const [stagedOfferIds, setStagedOfferIds] = useState<Set<string>>(() => new Set());
  const [focusedOfferId, setFocusedOfferId] = useState("");
  const [starting, setStarting] = useState(false);

  const activeGroup = groups.find(group => group.id === activeGroupId) || groups[0] || null;
  const focusedOffer = activeGroup?.offers.find(offer => offer.offer_id === focusedOfferId) || activeGroup?.offers.find(offer => stagedOfferIds.has(offer.offer_id) || purchasedIdsForGroup(activeGroup).includes(offer.offer_id)) || activeGroup?.offers[0] || null;
  const purchasedIds = new Set(activeGroup ? purchasedIdsForGroup(activeGroup) : []);
  const focusedSelected = Boolean(focusedOffer && (purchasedIds.has(focusedOffer.offer_id) || stagedOfferIds.has(focusedOffer.offer_id)));
  const focusedLocked = Boolean(focusedOffer && purchasedIds.has(focusedOffer.offer_id));
  const submitIds = useMemo(() => submissionOfferIds(groups, stagedOfferIds), [groups, stagedOfferIds]);
  const selectedTotal = purchasedOffers.length + submitIds.length;
  const maxTotal = groups.reduce((sum, group) => sum + starterGroupLimit(starter, group), 0);
  const summary = maxTotal ? `已选择 ${selectedTotal}/${maxTotal} 个开局道具，可直接开始游戏。` : "当前没有可选择道具，可直接开始游戏。";

  useEffect(() => {
    setActiveGroupId(current => current && groups.some(group => group.id === current) ? current : groups[0]?.id || "");
  }, [groups]);

  useEffect(() => {
    setFocusedOfferId(current => current && activeGroup?.offers.some(offer => offer.offer_id === current) ? current : activeGroup?.offers[0]?.offer_id || "");
  }, [activeGroup]);

  function toggleOffer(offer: ShopOffer) {
    if (!activeGroup) return;
    const purchasedIdSet = new Set(purchasedIdsForGroup(activeGroup));
    if (purchasedIdSet.has(offer.offer_id)) return;
    const limit = starterGroupLimit(starter, activeGroup);
    setFocusedOfferId(offer.offer_id);
    setStagedOfferIds(current => {
      const next = new Set(current);
      if (next.has(offer.offer_id)) {
        next.delete(offer.offer_id);
        return next;
      }
      if (selectedCountForGroup(activeGroup, next) >= limit) return current;
      next.add(offer.offer_id);
      return next;
    });
  }

  async function startGame() {
    if (starting) return;
    setStarting(true);
    try {
      if (!previewNoSubmit) {
        for (const offerId of submitIds) {
          await onChoose(offerId);
        }
        await onChoose(null);
      }
    } finally {
      setStarting(false);
    }
  }

  if (!groups.length) {
    return (
      <div className="starter-items-page">
        <section className="starter-items-empty">
          <h2>开局道具</h2>
          <p>当前没有可选择的开局道具，直接进入选队。</p>
          <button onClick={() => void onChoose(null)} type="button">开始游戏</button>
        </section>
      </div>
    );
  }

  return (
    <div className="starter-items-page">
      <section className="starter-items-shell">
        <header className="starter-items-header">
          <div>
            <h2>开局道具</h2>
            <p>{activeGroup?.name || "开局"} · {activeGroup ? `${selectedCountForGroup(activeGroup, stagedOfferIds)}/${starterGroupLimit(starter, activeGroup)}` : "0/0"} · {focusedOffer ? offerName(focusedOffer) : "无道具"}</p>
          </div>
        </header>
        <StarterItemTabs starter={starter} groups={groups} activeGroupId={activeGroup?.id || ""} stagedOfferIds={stagedOfferIds} onSelectGroup={setActiveGroupId} />
        <main className="starter-items-body">
          <StarterOfferList starter={starter} group={activeGroup} stagedOfferIds={stagedOfferIds} focusedOfferId={focusedOfferId} onFocusOffer={offer => setFocusedOfferId(offer.offer_id)} onToggleOffer={toggleOffer} />
          <StarterOfferDetail group={activeGroup} offer={focusedOffer} selected={focusedSelected} locked={focusedLocked} />
        </main>
        <StarterItemsActionBar summary={summary} starting={starting} onBack={onBack} onStart={startGame} />
      </section>
    </div>
  );
}
