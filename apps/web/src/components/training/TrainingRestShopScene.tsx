import {useState} from "react";
import type {ChangeBattleV2Api, FormalRestShopV4, FormalShopProductViewV4} from "@changebattle-v2/api";
import {TrainingRestShopBuyList} from "./TrainingRestShopBuyList";
import {TrainingRestShopDialogue} from "./TrainingRestShopDialogue";
import {TrainingRestShopInteractionPanel, type TrainingRestShopInteractionMode} from "./TrainingRestShopInteractionPanel";
import "./TrainingRestShopScene.css";

export type TrainingRestShopSceneProps = {
  api?: ChangeBattleV2Api;
  open: boolean;
  shop?: FormalRestShopV4 | null;
  money: number;
  busy?: boolean;
  onBuy?: (slotId: string) => Promise<string> | string;
  onBack: () => void;
};

const SHOP_WELCOME_TEXT = "欢迎光临，今天想要做些什么呢";
const SHOP_BUY_TEXT = "想看看今天的货物吗？";
const SHOP_SELL_TEXT = "需要整理背包里的道具吗？";

export function TrainingRestShopScene({api, open, shop, money, busy = false, onBuy, onBack}: TrainingRestShopSceneProps) {
  const [dialogueText, setDialogueText] = useState(SHOP_WELCOME_TEXT);
  const [interactionMode, setInteractionMode] = useState<TrainingRestShopInteractionMode | null>(null);
  const [selectedShopItem, setSelectedShopItem] = useState<FormalShopProductViewV4 | null>(null);
  const [buyingSlotId, setBuyingSlotId] = useState<string | null>(null);

  function leaveShop() {
    setDialogueText(SHOP_WELCOME_TEXT);
    setInteractionMode(null);
    setSelectedShopItem(null);
    onBack();
  }

  function openInteractionMode(mode: TrainingRestShopInteractionMode) {
    setInteractionMode(mode);
    setSelectedShopItem(null);
    setDialogueText(mode === "buy" ? SHOP_BUY_TEXT : SHOP_SELL_TEXT);
  }

  function closeInteractionMode() {
    setInteractionMode(null);
    setSelectedShopItem(null);
    setDialogueText(SHOP_WELCOME_TEXT);
  }

  function showShopItemDetail(item: FormalShopProductViewV4) {
    setSelectedShopItem(item);
    setDialogueText(item.summary);
  }

  function closeShopItemDetail() {
    setSelectedShopItem(null);
    setDialogueText(SHOP_BUY_TEXT);
  }

  async function buyShopItem(item: FormalShopProductViewV4) {
    if (!onBuy) {
      setDialogueText("购买功能正在整理中。");
      return;
    }
    setBuyingSlotId(item.slotId);
    try {
      const message = await onBuy(item.slotId);
      setSelectedShopItem(null);
      setDialogueText(message || "购买完成。");
    } catch (error) {
      setDialogueText(shopBuyErrorMessage(error));
    } finally {
      setBuyingSlotId(null);
    }
  }

  const shopProducts = api?.createFormalShopProductViews ? api.createFormalShopProductViews(shop) : [];
  const selectedItemName = selectedShopItem?.name;
  const dialogueActions = selectedShopItem
    ? [
        {label: "返回", onClick: closeShopItemDetail},
        {label: "立即购买", primary: true, onClick: () => void buyShopItem(selectedShopItem)},
      ]
    : interactionMode
    ? [{label: "返回", onClick: closeInteractionMode}]
    : [
        {label: "离开", onClick: leaveShop},
        {label: "售出", onClick: () => openInteractionMode("sell")},
        {label: "购买", primary: true, onClick: () => openInteractionMode("buy")},
      ];

  return (
    <section className="training-rest-shop-scene" data-open={open ? "true" : "false"} aria-label="休整商店场景" aria-hidden={!open}>
      <img className="training-rest-shop-scene-back" src="/shop/rest-store/back-lounge-menu-v4-640.png" alt="" draggable={false} />
      <div className="training-rest-shop-scene-money" aria-label="当前金币">
        <img src="/aboutIcon/coin.png" alt="" draggable={false} />
        <strong>{Math.max(0, Math.floor(money)).toLocaleString()}</strong>
      </div>
      {busy ? <div className="training-rest-shop-scene-busy" role="status">整理商店中</div> : null}
      <TrainingRestShopInteractionPanel mode={interactionMode}>
        {interactionMode === "buy" ? (
          <TrainingRestShopBuyList
            products={shopProducts}
            selectedSlotId={selectedShopItem?.slotId}
            buyingSlotId={buyingSlotId}
            onDetail={showShopItemDetail}
            onBuy={item => void buyShopItem(item)}
          />
        ) : null}
      </TrainingRestShopInteractionPanel>
      <TrainingRestShopDialogue
        speaker="店员"
        itemName={selectedItemName}
        text={dialogueText}
        actions={dialogueActions}
      />
    </section>
  );
}

function shopBuyErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || "");
  if (message.includes("金币不足")) return "噢，太可惜了，你的钱好像不太够。";
  if (message.includes("背包已满")) return "你的背包好像已经满了，先整理一下再来吧。";
  return message || "购买失败，请稍后再试。";
}
