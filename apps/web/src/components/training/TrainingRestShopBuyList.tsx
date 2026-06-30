import type {CSSProperties} from "react";
import type {ChangeBattleV2Api, FormalRestShopV4, FormalShopCategoryV4, FormalShopItemV4} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import "./TrainingRestShopBuyList.css";

type ShopItemDetail = {
  name?: string;
  nameZh?: string;
  moveName?: string;
  moveNameZh?: string;
  description?: string;
  effectSummary?: string;
  cost?: number;
  iconUrl?: string;
  iconStyle?: string;
};

export type TrainingRestShopBuyListProps = {
  api?: ChangeBattleV2Api;
  shop: FormalRestShopV4 | null | undefined;
  selectedSlotId?: string | null;
  buyingSlotId?: string | null;
  onDetail: (item: FormalShopItemV4) => void;
  onBuy: (item: FormalShopItemV4) => void;
};

const SHOP_COLUMNS: Array<{category: FormalShopCategoryV4; label: string}> = [
  {category: "recovery", label: "恢复药"},
  {category: "berry", label: "树果"},
  {category: "battle", label: "战斗道具"},
  {category: "training", label: "训练道具"},
  {category: "tm", label: "技能机器"},
];

export function TrainingRestShopBuyList({api, shop, selectedSlotId, buyingSlotId, onDetail, onBuy}: TrainingRestShopBuyListProps) {
  const slots = SHOP_COLUMNS.flatMap(column =>
    Array.from({length: 3}, (_, rowIndex) => ({
      key: `${column.category}:${rowIndex}`,
      category: column.category,
      label: column.label,
      item: shop?.categories[column.category]?.[rowIndex] || null,
    })),
  );

  return (
    <div className="training-rest-shop-buy-list" aria-label="商店购买清单">
      {slots.map(slot => {
        const detail = getShopItemDetail(api, slot.item);
        const name = shopItemName(slot.item, detail);
        const price = shopItemPrice(detail);
        const selected = Boolean(slot.item && slot.item.slotId === selectedSlotId);
        const buying = Boolean(slot.item && slot.item.slotId === buyingSlotId);
        return (
          <article
            className="training-rest-shop-buy-card"
            data-selected={selected ? "true" : "false"}
            data-empty={slot.item ? "false" : "true"}
            key={slot.key}
          >
            {slot.item ? (
              <>
                <div className="training-rest-shop-buy-icon">
                  <ShopItemIcon detail={detail} name={name} />
                </div>
                <strong title={name}>{name}</strong>
                <div className="training-rest-shop-buy-price" aria-label={`价格 ${price}`}>
                  <img src="/aboutIcon/coin.png" alt="" draggable={false} />
                  <span>{price.toLocaleString()}</span>
                </div>
                <div className="training-rest-shop-buy-actions">
                  <button type="button" onClick={() => onDetail(slot.item!)}>详情</button>
                  <button type="button" disabled={buying} onClick={() => onBuy(slot.item!)}>{buying ? "处理中" : "购买"}</button>
                </div>
              </>
            ) : (
              <span className="training-rest-shop-buy-empty">{slot.label}</span>
            )}
          </article>
        );
      })}
    </div>
  );
}

export function getShopItemDetail(api: ChangeBattleV2Api | undefined, item: FormalShopItemV4 | null | undefined): ShopItemDetail | null {
  if (!api || !item) return null;
  try {
    return api.getItemDetail(item.itemID) as ShopItemDetail;
  } catch {
    return null;
  }
}

export function shopItemName(item: FormalShopItemV4 | null | undefined, detail: ShopItemDetail | null): string {
  if (item?.category === "tm") {
    return detail?.moveNameZh || detail?.moveName || stripTmPrefix(detail?.nameZh || detail?.name || item.itemID);
  }
  return detail?.nameZh || detail?.name || item?.itemID || "未知道具";
}

export function shopItemPrice(detail: ShopItemDetail | null): number {
  return Math.max(0, Math.floor(Number(detail?.cost || 0)));
}

export function shopItemDescription(detail: ShopItemDetail | null): string {
  return detail?.description || detail?.effectSummary || "这是很实用的道具，要带上吗？";
}

function ShopItemIcon({detail, name}: {detail: ShopItemDetail | null; name: string}) {
  const spriteStyle = detail?.iconStyle ? spriteStyleFromCss(detail.iconStyle) : null;
  if (spriteStyle) return <span className="training-rest-shop-buy-sprite item-icon" aria-hidden="true" style={spriteStyle} />;
  if (detail?.iconUrl) return <ImageWithFallback src={detail.iconUrl} alt="" fallback="◇" />;
  return <span className="training-rest-shop-buy-fallback">{name.slice(0, 1) || "◇"}</span>;
}

function spriteStyleFromCss(css: string): CSSProperties | null {
  const match = /url\(([^)]+)\).*?(-?\d+)px\s+(-?\d+)px/.exec(css);
  if (!match) return null;
  return {
    backgroundImage: `url(${match[1]})`,
    backgroundPosition: `${match[2]}px ${match[3]}px`,
    backgroundRepeat: "no-repeat",
  };
}

function stripTmPrefix(name: string): string {
  return name.replace(/^技能机器[：:]\s*/, "").replace(/^TM[：:]\s*/i, "") || name;
}
