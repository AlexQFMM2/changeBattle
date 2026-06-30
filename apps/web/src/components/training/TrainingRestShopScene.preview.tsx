import {useState} from "react";
import type {FormalRestShopV4} from "@changebattle-v2/api";
import {TrainingRestShopScene} from "./TrainingRestShopScene";
import "./TrainingRestShopScene.preview.css";

const PREVIEW_SHOP: FormalRestShopV4 = {
  nodeId: "preview-shop",
  seed: "preview-shop",
  updatedAt: new Date(0).toISOString(),
  categories: {
    recovery: [
      {slotId: "preview-shop:recovery:0", category: "recovery", itemID: "potion", stock: 1, generatedAt: new Date(0).toISOString()},
      {slotId: "preview-shop:recovery:1", category: "recovery", itemID: "superpotion", stock: 1, generatedAt: new Date(0).toISOString()},
      {slotId: "preview-shop:recovery:2", category: "recovery", itemID: "hyperpotion", stock: 1, generatedAt: new Date(0).toISOString()},
    ],
    berry: [
      {slotId: "preview-shop:berry:0", category: "berry", itemID: "oranberry", stock: 1, generatedAt: new Date(0).toISOString()},
      {slotId: "preview-shop:berry:1", category: "berry", itemID: "sitrusberry", stock: 1, generatedAt: new Date(0).toISOString()},
      {slotId: "preview-shop:berry:2", category: "berry", itemID: "lumberry", stock: 1, generatedAt: new Date(0).toISOString()},
    ],
    battle: [
      {slotId: "preview-shop:battle:0", category: "battle", itemID: "leftovers", stock: 1, generatedAt: new Date(0).toISOString()},
      {slotId: "preview-shop:battle:1", category: "battle", itemID: "lifeorb", stock: 1, generatedAt: new Date(0).toISOString()},
      {slotId: "preview-shop:battle:2", category: "battle", itemID: "choicescarf", stock: 1, generatedAt: new Date(0).toISOString()},
    ],
    training: [
      {slotId: "preview-shop:training:0", category: "training", itemID: "rarecandy", stock: 1, generatedAt: new Date(0).toISOString()},
      {slotId: "preview-shop:training:1", category: "training", itemID: "protein", stock: 1, generatedAt: new Date(0).toISOString()},
      {slotId: "preview-shop:training:2", category: "training", itemID: "bottlecap", stock: 1, generatedAt: new Date(0).toISOString()},
    ],
    tm: [
      {slotId: "preview-shop:tm:0", category: "tm", itemID: "tm:protect", stock: 1, generatedAt: new Date(0).toISOString()},
      {slotId: "preview-shop:tm:1", category: "tm", itemID: "tm:thunderbolt", stock: 1, generatedAt: new Date(0).toISOString()},
      {slotId: "preview-shop:tm:2", category: "tm", itemID: "tm:icebeam", stock: 1, generatedAt: new Date(0).toISOString()},
    ],
  },
};

export function TrainingRestShopScenePreview() {
  const [open, setOpen] = useState(true);
  return (
    <section className="training-rest-shop-scene-preview" aria-label="商店独立场景预览">
      <TrainingRestShopScene
        open={open}
        shop={PREVIEW_SHOP}
        money={3600}
        busy={!open}
        onBuy={slotId => `预览购买：${slotId}`}
        onBack={() => setOpen(current => !current)}
      />
      <div className="training-rest-shop-scene-preview-note" role="status">
        {open ? "预览：商店场景 / 离开按钮可切换状态" : "预览：关闭状态仍保持场景尺寸"}
      </div>
    </section>
  );
}
