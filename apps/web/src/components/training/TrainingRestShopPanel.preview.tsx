import {useMemo, useState} from "react";
import type {ChangeBattleV2Api, FormalRestShopV4, FormalShopCategoryV4, FormalShopItemV4, PlayerItemInstanceV4, TrainingPlayerDraftV4} from "@changebattle-v2/api";
import {TrainingRestShopPanel} from "./TrainingRestShopPanel";
import "./TrainingRestShopPanel.preview.css";

type ShopPreviewVariant = "standard" | "low-money" | "empty-bag" | "long";

const PREVIEW_SHOP_ITEMS: Record<FormalShopCategoryV4, string[]> = {
  recovery: ["potion", "hyperpotion", "fullrestore"],
  berry: ["oranberry", "sitrusberry", "lumberry"],
  battle: ["leftovers", "lifeorb", "choicescarf"],
  tm: ["tm:protect", "tm:thunderbolt", "tm:icebeam"],
  training: ["rarecandy", "abilitycapsule", "bottlecap"],
};

const RESTOCK_ITEMS: Record<FormalShopCategoryV4, string[]> = {
  recovery: ["freshwater", "lemonade", "maxpotion"],
  berry: ["leppaberry", "oranberry", "sitrusberry"],
  battle: ["choiceband", "assaultvest", "rockyhelmet"],
  tm: ["tm:flamethrower", "tm:earthquake", "tm:substitute"],
  training: ["ppup", "jollymint", "goldbottlecap"],
};

export function TrainingRestShopPanelPreview({api}: {api: ChangeBattleV2Api}) {
  const [variant, setVariant] = useState<ShopPreviewVariant>("standard");
  const initialPlayer = useMemo(() => createPreviewPlayer(api, variant), [api, variant]);
  const initialShop = useMemo(() => createPreviewShop(), []);
  const [player, setPlayer] = useState(initialPlayer);
  const [shop, setShop] = useState(initialShop);
  const [money, setMoney] = useState(3600);
  const [message, setMessage] = useState("预览：正式商店双向面板。");

  function reset(nextVariant: ShopPreviewVariant) {
    setVariant(nextVariant);
    const nextPlayer = createPreviewPlayer(api, nextVariant);
    setPlayer(nextPlayer);
    setShop(createPreviewShop());
    setMoney(nextVariant === "low-money" ? 120 : 3600);
    setMessage(nextVariant === "empty-bag" ? "预览：空背包仍可购买。" : "预览：正式商店双向面板。");
  }

  function buy(slotId: string) {
    const located = findShopItem(shop, slotId);
    if (!located) return;
    const detail = safeItemDetail(api, located.item.itemID);
    const cost = Math.max(0, Math.floor(Number(detail?.cost || 0)));
    if (money < cost) {
      setMessage("预览：金币不足。");
      return;
    }
    const bought = api.createItemInstance(located.item.itemID, {id: `preview-bought-${Date.now()}`});
    setPlayer(current => ({...current, bag: {...current.bag, items: [...current.bag.items, bought]}}));
    setMoney(current => current - cost);
    setShop(current => restockShop(current, located.category, located.index));
    setMessage(`预览：购买 ${detail?.nameZh || detail?.name || located.item.itemID}。`);
  }

  function sell(ids: string[]) {
    const selected = player.bag.items.filter(item => ids.includes(item.id));
    const total = selected.reduce((sum, item) => sum + Math.floor(Math.max(0, item.cost) * 0.25), 0);
    setPlayer(current => ({...current, bag: {...current.bag, items: current.bag.items.filter(item => !ids.includes(item.id))}}));
    setMoney(current => current + total);
    setMessage(`预览：卖出 ${selected.length} 件，获得 ${total} 金币。`);
  }

  return (
    <section className="training-rest-shop-preview-canvas" aria-label="商店组件预览">
      <div className="training-rest-shop-preview-bg" aria-hidden="true" />
      <div className="training-rest-shop-preview-controls" aria-label="预览状态">
        {([
          ["standard", "普通"],
          ["low-money", "低金币"],
          ["empty-bag", "空背包"],
          ["long", "长列表"],
        ] as const).map(([id, label]) => (
          <button className={variant === id ? "active" : ""} type="button" onClick={() => reset(id)} key={id}>{label}</button>
        ))}
      </div>
      <TrainingRestShopPanel
        api={api}
        open
        shop={shop}
        player={player}
        money={money}
        message={message}
        onClose={() => setMessage("预览：关闭按钮被点击。")}
        onBuy={buy}
        onSell={sell}
      />
    </section>
  );
}

function createPreviewPlayer(api: ChangeBattleV2Api, variant: ShopPreviewVariant): TrainingPlayerDraftV4 {
  const base = api.createTrainingRunFromScenario(api.createTrainingRunGame({
    id: "shop-preview-profile",
    name: "商店预览",
    avatarAsset: "/npc/avatars/6-asset-a73f3e71.webp",
  })).players.p1!;
  const sourceIds = variant === "empty-bag"
    ? []
    : variant === "long"
      ? ["leftovers", "lifeorb", "choicescarf", "choiceband", "choicespecs", "potion", "hyperpotion", "sitrusberry", "lumberry", "rarecandy", "tm:protect", "tm:thunderbolt"]
      : ["leftovers", "lifeorb", "potion", "sitrusberry", "system-mega-stone"];
  const items = sourceIds.map((itemID, index) => api.createItemInstance(itemID, {
    id: `shop-preview-item-${index + 1}`,
    name: variant === "long" && index === 1 ? "非常非常长的生命宝珠名字" : undefined,
  }));
  const pokemon = base.localTeam.pokemon.map((entry, index) => index === 0 && items[0]
    ? {...entry, itemId: items[0].itemID, heldItemInstanceId: items[0].id}
    : entry);
  return {
    ...base,
    localTeam: {...base.localTeam, pokemon},
    bag: {...base.bag, items, maxSize: 50},
  };
}

function createPreviewShop(): FormalRestShopV4 {
  const nodeId = "shop-preview-node";
  const categories = Object.fromEntries(Object.entries(PREVIEW_SHOP_ITEMS).map(([category, itemIDs]) => [
    category,
    itemIDs.map((itemID, index) => ({
      slotId: `${nodeId}:${category}:${index}`,
      category: category as FormalShopCategoryV4,
      itemID,
      stock: 1,
      generatedAt: "preview",
    })),
  ])) as Record<FormalShopCategoryV4, FormalShopItemV4[]>;
  return {nodeId, seed: "shop-preview-seed", categories, updatedAt: "preview"};
}

function findShopItem(shop: FormalRestShopV4, slotId: string): {category: FormalShopCategoryV4; item: FormalShopItemV4; index: number} | null {
  for (const category of Object.keys(shop.categories) as FormalShopCategoryV4[]) {
    const index = shop.categories[category].findIndex(item => item.slotId === slotId);
    if (index >= 0) return {category, item: shop.categories[category][index]!, index};
  }
  return null;
}

function restockShop(shop: FormalRestShopV4, category: FormalShopCategoryV4, index: number): FormalRestShopV4 {
  const restockPool = RESTOCK_ITEMS[category];
  const itemID = restockPool[index % restockPool.length] || restockPool[0]!;
  return {
    ...shop,
    categories: {
      ...shop.categories,
      [category]: shop.categories[category].map((item, itemIndex) => itemIndex === index ? {...item, itemID, generatedAt: `preview-${Date.now()}`} : item),
    },
  };
}

function safeItemDetail(api: ChangeBattleV2Api, itemID: string) {
  try {
    return api.getItemDetail(itemID);
  } catch {
    return null;
  }
}
