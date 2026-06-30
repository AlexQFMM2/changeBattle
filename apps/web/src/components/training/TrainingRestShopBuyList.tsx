import type {CSSProperties} from "react";
import type {FormalShopProductViewV4} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import "./TrainingRestShopBuyList.css";

export type TrainingRestShopBuyListProps = {
  products: FormalShopProductViewV4[];
  selectedSlotId?: string | null;
  buyingSlotId?: string | null;
  breakingSlotId?: string | null;
  breakingProduct?: FormalShopProductViewV4 | null;
  restockingSlotId?: string | null;
  onDetail: (item: FormalShopProductViewV4) => void;
  onBuy: (item: FormalShopProductViewV4) => void;
};

export function TrainingRestShopBuyList({products, selectedSlotId, buyingSlotId, breakingSlotId, breakingProduct, restockingSlotId, onDetail, onBuy}: TrainingRestShopBuyListProps) {
  return (
    <div className="training-rest-shop-buy-list" aria-label="商店购买清单">
      {products.map(product => {
        const selected = product.slotId === selectedSlotId;
        const buying = product.slotId === buyingSlotId;
        const breaking = product.slotId === breakingSlotId;
        const restocking = product.slotId === restockingSlotId;
        const disabled = buying || breaking;
        const displayProduct = breaking && breakingProduct?.slotId === product.slotId ? breakingProduct : product;
        return (
          <article
            className="training-rest-shop-buy-card"
            data-selected={selected ? "true" : "false"}
            data-buying={buying ? "true" : "false"}
            data-breaking={breaking ? "true" : "false"}
            data-restocking={restocking ? "true" : "false"}
            data-empty="false"
            key={product.slotId}
          >
            <div className="training-rest-shop-buy-icon">
              <ShopItemIcon product={displayProduct} />
            </div>
            <strong title={displayProduct.name}>{displayProduct.name}</strong>
            <div className="training-rest-shop-buy-price" aria-label={`价格 ${displayProduct.price}`}>
              <img src="/aboutIcon/coin.png" alt="" draggable={false} />
              <span>{displayProduct.price.toLocaleString()}</span>
            </div>
            <div className="training-rest-shop-buy-actions">
              <button type="button" disabled={disabled} onClick={() => onDetail(displayProduct)}>详情</button>
              <button type="button" disabled={disabled} onClick={() => onBuy(displayProduct)}>{buying ? "处理中" : "购买"}</button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ShopItemIcon({product}: {product: FormalShopProductViewV4}) {
  const spriteStyle = product.iconStyle ? spriteStyleFromCss(product.iconStyle) : null;
  if (spriteStyle) return <span className="training-rest-shop-buy-sprite item-icon" aria-hidden="true" style={spriteStyle} />;
  if (product.iconUrl) return <ImageWithFallback src={product.iconUrl} alt="" fallback="◇" />;
  return <span className="training-rest-shop-buy-fallback">{product.name.slice(0, 1) || "◇"}</span>;
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
