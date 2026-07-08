import {useState} from "react";
import {createChangeBattleV2Api, type FormalRestShopV4, type TrainingPlayerDraftV4} from "@changebattle-v2/api";
import {TrainingRestShopScene} from "./TrainingRestShopScene";
import "./TrainingRestShopScene.preview.css";

const PREVIEW_API = createChangeBattleV2Api();
const PREVIEW_BAG_ITEMS = [
  PREVIEW_API.createItemInstance("potion", {id: "preview-bag-potion", cost: 20}),
  PREVIEW_API.createItemInstance("sitrusberry", {id: "preview-bag-sitrus", cost: 20}),
  PREVIEW_API.createItemInstance("leftovers", {id: "preview-bag-leftovers", cost: 600}),
  PREVIEW_API.createItemInstance("tm:protect", {id: "preview-bag-protect", cost: 100}),
  PREVIEW_API.createItemInstance("system-mega-stone", {id: "preview-bag-system", canSale: false, cost: 0}),
];
const PREVIEW_TEAM = PREVIEW_API.randomizeTrainingTeam("p1", 3, ["venusaur", "charizard", "blastoise"]);
const PREVIEW_PLAYER: TrainingPlayerDraftV4 = {
  playerId: "p1",
  name: "预览训练师",
  avatar: "npc/avatars/6-asset-a73f3e71.webp",
  controller: "local",
  alliance: "near",
  localTeam: {
    ...PREVIEW_TEAM,
    pokemon: PREVIEW_TEAM.pokemon.map((pokemon, index) => index === 0 ? {...pokemon, heldItemInstanceId: "preview-bag-sitrus"} : pokemon),
  },
  bag: {maxSize: 50, items: PREVIEW_BAG_ITEMS, battleBagEnabled: true},
};

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
    parenting: [
      {slotId: "preview-shop:parenting:0", category: "parenting", itemID: "heartscale", stock: 1, generatedAt: new Date(0).toISOString()},
      {slotId: "preview-shop:parenting:1", category: "parenting", itemID: "standardtextbook", stock: 1, generatedAt: new Date(0).toISOString()},
      {slotId: "preview-shop:parenting:2", category: "parenting", itemID: "redthread", stock: 1, generatedAt: new Date(0).toISOString()},
    ],
    evolution: [
      {slotId: "preview-shop:evolution:0", category: "evolution", itemID: "universal-evolution-stone", stock: 1, generatedAt: new Date(0).toISOString()},
      {slotId: "preview-shop:evolution:1", category: "evolution", itemID: "linking-cord", stock: 1, generatedAt: new Date(0).toISOString()},
      {slotId: "preview-shop:evolution:2", category: "evolution", itemID: "waterstone", stock: 1, generatedAt: new Date(0).toISOString()},
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
        api={PREVIEW_API}
        open={open}
        shop={PREVIEW_SHOP}
        player={PREVIEW_PLAYER}
        money={3600}
        busy={!open}
        onBuy={slotId => `预览购买：${slotId}`}
        onSell={itemIds => `预览售出 ${itemIds.length} 件道具。`}
        onBack={() => setOpen(current => !current)}
      />
      <div className="training-rest-shop-scene-preview-note" role="status">
        {open ? "预览：商店场景 / 离开按钮可切换状态" : "预览：关闭状态仍保持场景尺寸"}
      </div>
    </section>
  );
}
