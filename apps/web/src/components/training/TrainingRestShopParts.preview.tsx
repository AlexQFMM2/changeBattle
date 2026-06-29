import {useMemo} from "react";
import type {ChangeBattleV2Api, FormalRestShopV4, FormalShopCategoryV4, FormalShopItemV4} from "@changebattle-v2/api";
import {TrainingRestShopClerk} from "./TrainingRestShopClerk";
import {TrainingRestShopRouteButton} from "./TrainingRestShopRouteButton";
import {TrainingRestShopShelf} from "./TrainingRestShopShelf";
import "./TrainingRestShopParts.preview.css";

const PREVIEW_SHOP_ITEMS: Record<FormalShopCategoryV4, string[]> = {
  recovery: ["potion", "superpotion", "hyperpotion", "fullrestore"],
  berry: ["oranberry", "sitrusberry", "lumberry", "leppaberry"],
  battle: ["leftovers", "lifeorb", "choicescarf", "rockyhelmet"],
  training: ["rarecandy", "abilitycapsule", "bottlecap", "jollymint"],
  tm: ["tm:protect", "tm:thunderbolt", "tm:icebeam", "tm:flamethrower", "tm:earthquake", "tm:substitute"],
};

export function TrainingRestShopPartsPreview({api}: {api: ChangeBattleV2Api}) {
  const shop = useMemo(() => createPreviewShop(), []);
  return (
    <section className="training-rest-shop-parts-preview" aria-label="商店部件预览">
      <div className="training-rest-shop-parts-preview-clerks">
        <figure>
          <TrainingRestShopClerk action="wait" />
          <figcaption>wait</figcaption>
        </figure>
        <figure>
          <TrainingRestShopClerk action="get" />
          <figcaption>get</figcaption>
        </figure>
        <figure>
          <TrainingRestShopClerk action="pull" />
          <figcaption>pull</figcaption>
        </figure>
      </div>
      <TrainingRestShopShelf api={api} shop={shop} />
      <TrainingRestShopRouteButton className="training-rest-shop-parts-preview-route-right" label="去商店" direction="right" onClick={() => undefined} />
      <TrainingRestShopRouteButton className="training-rest-shop-parts-preview-route-left" label="去休整中心" direction="left" onClick={() => undefined} />
    </section>
  );
}

function createPreviewShop(): FormalRestShopV4 {
  const nodeId = "shop-parts-preview-node";
  const categories = Object.fromEntries(Object.entries(PREVIEW_SHOP_ITEMS).map(([category, itemIDs]) => [
    category,
    itemIDs.map((itemID, index): FormalShopItemV4 => ({
      slotId: `${nodeId}:${category}:${index}`,
      category: category as FormalShopCategoryV4,
      itemID,
      stock: 1,
      generatedAt: "preview",
    })),
  ])) as Record<FormalShopCategoryV4, FormalShopItemV4[]>;
  return {nodeId, seed: "shop-parts-preview-seed", categories, updatedAt: "preview"};
}
