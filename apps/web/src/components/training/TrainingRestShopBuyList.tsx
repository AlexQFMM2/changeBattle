import type {CSSProperties} from "react";
import type {FormalShopProductViewV4} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import {assetUrl, styleUrlAssetPath} from "../../lib/assetUrl";
import "./TrainingRestShopBuyList.css";

export type TrainingRestShopBuyListProps = {
  products: FormalShopProductViewV4[];
  selectedSlotId?: string | null;
  buyingSlotId?: string | null;
  breakingSlotId?: string | null;
  breakingProduct?: FormalShopProductViewV4 | null;
  restockingSlotId?: string | null;
  cartSlotIds?: Set<string>;
  pending?: boolean;
  onDetail: (item: FormalShopProductViewV4) => void;
  onToggleCart: (item: FormalShopProductViewV4) => void;
};

export function TrainingRestShopBuyList({products, selectedSlotId, buyingSlotId, breakingSlotId, breakingProduct, restockingSlotId, cartSlotIds, pending = false, onDetail, onToggleCart}: TrainingRestShopBuyListProps) {
  return (
    <div className="training-rest-shop-buy-list" aria-label="商店购买清单">
      {products.map(product => {
        const selected = product.slotId === selectedSlotId;
        const inCart = Boolean(cartSlotIds?.has(product.slotId));
        const buying = product.slotId === buyingSlotId;
        const breaking = product.slotId === breakingSlotId;
        const restocking = product.slotId === restockingSlotId;
        const soldOut = product.stock <= 0;
        const disabled = pending || buying || breaking || soldOut;
        const displayProduct = breaking && breakingProduct?.slotId === product.slotId ? breakingProduct : product;
        return (
          <article
            className="training-rest-shop-buy-card"
            data-selected={selected ? "true" : "false"}
            data-cart={inCart ? "true" : "false"}
            data-buying={buying ? "true" : "false"}
            data-breaking={breaking ? "true" : "false"}
            data-restocking={restocking ? "true" : "false"}
            data-soldout={soldOut ? "true" : "false"}
            data-empty="false"
            key={product.slotId}
          >
            <div className="training-rest-shop-buy-icon">
              <ShopItemIcon product={displayProduct} />
            </div>
            <strong title={displayProduct.name}>{displayProduct.name}</strong>
            <div className="training-rest-shop-buy-price" aria-label={`价格 ${displayProduct.price}`}>
              <img src={assetUrl("aboutIcon/coin.png")} alt="" draggable={false} />
              <span>{displayProduct.price.toLocaleString()}</span>
            </div>
            <div className="training-rest-shop-buy-actions">
              <button type="button" disabled={disabled} onClick={() => onDetail(displayProduct)}>详情</button>
              <button type="button" disabled={disabled} onClick={() => onToggleCart(displayProduct)}>{soldOut ? "售罄" : inCart ? "移出" : "加入"}</button>
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
    backgroundImage: `url("${styleUrlAssetPath(match[1])}")`,
    backgroundPosition: `${match[2]}px ${match[3]}px`,
    backgroundRepeat: "no-repeat",
  };
}
