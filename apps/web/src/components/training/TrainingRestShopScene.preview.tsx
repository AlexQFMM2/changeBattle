import {useMemo, useState} from "react";
import type {ChangeBattleV2Api, FormalRestShopV4, FormalShopCategoryV4, FormalShopItemV4} from "@changebattle-v2/api";
import {TrainingRestShopScene} from "./TrainingRestShopScene";
import "./TrainingRestShopScene.preview.css";

const PREVIEW_SHOP_ITEMS: Record<FormalShopCategoryV4, string[]> = {
  recovery: ["potion", "superpotion", "hyperpotion", "fullrestore"],
  berry: ["oranberry", "sitrusberry", "lumberry", "leppaberry"],
  battle: ["leftovers", "lifeorb", "choicescarf", "rockyhelmet"],
  training: ["rarecandy", "abilitycapsule", "bottlecap", "jollymint"],
  tm: ["tm:protect", "tm:thunderbolt", "tm:icebeam", "tm:flamethrower", "tm:earthquake", "tm:substitute"],
};

export function TrainingRestShopScenePreview({api}: {api: ChangeBattleV2Api}) {
  const [open, setOpen] = useState(true);
  const shop = useMemo(() => createPreviewShop(), []);
  return (
    <section className="training-rest-shop-scene-preview" aria-label="商店独立场景预览">
      <TrainingRestShopScene
        api={api}
        open={open}
        shop={shop}
        money={3600}
        busy={!open}
        onBack={() => setOpen(current => !current)}
      />
      <div className="training-rest-shop-scene-preview-note" role="status">
        {open ? "预览：商店场景 / 返回按钮可切换状态" : "预览：关闭状态仍保持场景尺寸"}
      </div>
    </section>
  );
}

function createPreviewShop(): FormalRestShopV4 {
  const nodeId = "shop-scene-preview-node";
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
  return {nodeId, seed: "shop-scene-preview-seed", categories, updatedAt: "preview"};
}
