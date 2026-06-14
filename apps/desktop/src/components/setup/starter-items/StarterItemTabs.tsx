import type {StarterItemGroup, StarterItemGroupState} from "@changebattle/shared";
import {purchasedIdsForGroup, selectedCountForGroup, starterGroupLimit} from "./starterItemsModel";
import type {DesktopGameState} from "@changebattle/shared";
import "./StarterItemTabs.css";

export function StarterItemTabs({starter, groups, activeGroupId, stagedOfferIds, onSelectGroup}: {starter: DesktopGameState["starter"]; groups: StarterItemGroupState[]; activeGroupId: string; stagedOfferIds: Set<string>; onSelectGroup: (groupId: StarterItemGroup) => void}) {
  return (
    <nav className="starter-item-tabs" aria-label="开局道具分类">
      {groups.map(group => {
        const selectedCount = selectedCountForGroup(group, stagedOfferIds);
        const limit = starterGroupLimit(starter, group);
        const locked = purchasedIdsForGroup(group).length >= limit;
        return (
          <button className={`${activeGroupId === group.id ? "current" : ""} ${locked ? "locked" : ""}`} onClick={() => onSelectGroup(group.id)} type="button" key={group.id}>
            <strong>{group.name}</strong>
            <span>{selectedCount}/{limit}</span>
          </button>
        );
      })}
    </nav>
  );
}
