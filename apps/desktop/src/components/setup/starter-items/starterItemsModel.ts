import type {DesktopGameState, ShopOffer, StarterItemGroup, StarterItemGroupState} from "@changebattle/shared";

export const STARTER_ITEM_GROUP_ORDER: StarterItemGroup[] = ["recovery", "berry", "tm", "battle"];

const STARTER_ITEM_GROUP_LABELS: Record<StarterItemGroup, string> = {
  recovery: "恢复道具",
  berry: "树果",
  tm: "技能机器",
  battle: "战斗道具",
};

export function starterItemGroupLabel(groupId: StarterItemGroup): string {
  return STARTER_ITEM_GROUP_LABELS[groupId] || groupId;
}

export function starterItemGroups(starter: DesktopGameState["starter"]): StarterItemGroupState[] {
  const fromRuntime = [...(starter?.item_groups || [])];
  const groups = fromRuntime.length
    ? fromRuntime
    : STARTER_ITEM_GROUP_ORDER.map(id => ({
        id,
        name: starterItemGroupLabel(id),
        quality_level: 1,
        quantity_level: 0,
        max_quality_level: 3,
        max_quantity_level: 3,
        offers: (starter?.offers || []).filter(offer => offer.starter_group === id),
        purchased_offer_ids: [],
      }));
  return groups
    .filter(group => group.offers.length > 0)
    .sort((a, b) => STARTER_ITEM_GROUP_ORDER.indexOf(a.id) - STARTER_ITEM_GROUP_ORDER.indexOf(b.id));
}

export function purchasedStarterOffers(starter: DesktopGameState["starter"]): ShopOffer[] {
  return starter?.purchased_list || (starter?.purchased ? [starter.purchased] : []);
}

export function purchasedIdsForGroup(group: StarterItemGroupState): string[] {
  return group.purchased_offer_ids || (group.purchased_offer_id ? [group.purchased_offer_id] : []);
}

export function starterGroupLimit(starter: DesktopGameState["starter"], group: StarterItemGroupState): number {
  const groupCount = starterItemGroups(starter).length || 1;
  const perGroupLimit = (starter?.max_purchases || 0) > groupCount ? 2 : 1;
  return Math.min(perGroupLimit, group.offers.length || perGroupLimit);
}

export function selectedCountForGroup(group: StarterItemGroupState, stagedOfferIds: Set<string>): number {
  const purchasedCount = purchasedIdsForGroup(group).length;
  const stagedCount = group.offers.filter(offer => stagedOfferIds.has(offer.offer_id) && !purchasedIdsForGroup(group).includes(offer.offer_id)).length;
  return purchasedCount + stagedCount;
}

export function submissionOfferIds(groups: StarterItemGroupState[], stagedOfferIds: Set<string>): string[] {
  return groups.flatMap(group => {
    const purchasedIds = new Set(purchasedIdsForGroup(group));
    return group.offers
      .filter(offer => stagedOfferIds.has(offer.offer_id) && !purchasedIds.has(offer.offer_id))
      .map(offer => offer.offer_id);
  });
}

export function offerName(offer: ShopOffer): string {
  return offer.name_zh || offer.move_name_zh || offer.name || offer.move_name || offer.id;
}
