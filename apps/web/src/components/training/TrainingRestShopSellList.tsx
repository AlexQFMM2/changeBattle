import type {CSSProperties} from "react";
import type {ChangeBattleV2Api, PlayerItemInstanceV4} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import "./TrainingRestShopSellList.css";

export type TrainingRestShopSellListProps = {
  api?: ChangeBattleV2Api;
  items: PlayerItemInstanceV4[];
  selectedIds: Set<string>;
  heldItemInstanceIds?: Set<string>;
  onToggle: (item: PlayerItemInstanceV4) => void;
};

const SELL_LIST_LIMIT = 15;

export function TrainingRestShopSellList({api, items, selectedIds, heldItemInstanceIds = new Set(), onToggle}: TrainingRestShopSellListProps) {
  const sellableItems = items
    .filter(item => item.canSale && !heldItemInstanceIds.has(item.id) && sellPrice(item) > 0)
    .slice(0, SELL_LIST_LIMIT);

  if (!sellableItems.length) {
    return (
      <div className="training-rest-shop-sell-list training-rest-shop-sell-list-empty" aria-label="可售道具清单">
        没有可以售出的道具
      </div>
    );
  }

  return (
    <div className="training-rest-shop-sell-list" aria-label="可售道具清单">
      {sellableItems.map(item => {
        const detail = safeItemDetail(api, item.itemID);
        const selected = selectedIds.has(item.id);
        const name = item.name || detail?.nameZh || detail?.name || item.itemID;
        return (
          <button
            className="training-rest-shop-sell-card"
            data-selected={selected ? "true" : "false"}
            key={item.id}
            type="button"
            onClick={() => onToggle(item)}
          >
            <div className="training-rest-shop-sell-icon">
              <SellItemIcon item={item} iconStyle={detail?.iconStyle} iconUrl={detail?.iconUrl} name={name} />
            </div>
            <strong title={name}>{name}</strong>
            <div className="training-rest-shop-sell-price" aria-label={`售出价格 ${sellPrice(item)}`}>
              <img src="/aboutIcon/coin.png" alt="" draggable={false} />
              <span>{sellPrice(item).toLocaleString()}</span>
            </div>
            <span>{selected ? "已选择" : "选择"}</span>
          </button>
        );
      })}
    </div>
  );
}

export function sellPrice(item: PlayerItemInstanceV4): number {
  return Math.max(0, Math.floor(Math.max(0, Number(item.cost || 0)) / 4));
}

function SellItemIcon({item, iconStyle, iconUrl, name}: {item: PlayerItemInstanceV4; iconStyle?: string; iconUrl?: string; name: string}) {
  const mappedUrl = item.mappedItemIconUrl || "";
  const spriteStyle = iconStyle ? spriteStyleFromCss(iconStyle) : null;
  if (spriteStyle) return <span className="training-rest-shop-sell-sprite item-icon" aria-hidden="true" style={spriteStyle} />;
  if (mappedUrl || item.image || iconUrl) return <ImageWithFallback src={mappedUrl || item.image || iconUrl || ""} alt="" fallback="◇" />;
  return <span className="training-rest-shop-sell-fallback">{name.slice(0, 1) || "◇"}</span>;
}

function safeItemDetail(api: ChangeBattleV2Api | undefined, itemID: string) {
  try {
    return api?.getItemDetail(itemID) || null;
  } catch {
    return null;
  }
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
