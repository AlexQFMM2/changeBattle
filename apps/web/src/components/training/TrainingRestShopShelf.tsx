import type {CSSProperties} from "react";
import type {ChangeBattleV2Api, FormalRestShopV4, FormalShopCategoryV4, FormalShopItemV4} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import "./TrainingRestShopShelf.css";

export type TrainingRestShopShelfProps = {
  api: ChangeBattleV2Api;
  shop: FormalRestShopV4 | null;
  backgroundVisible?: boolean;
};

const SHELF_CATEGORY_COLUMNS: Record<FormalShopCategoryV4, number[]> = {
  recovery: [0],
  berry: [1],
  battle: [2],
  training: [3],
  tm: [4, 5],
};

const SHELF_CATEGORY_LABELS: Record<FormalShopCategoryV4, string> = {
  recovery: "恢复药",
  berry: "树果",
  battle: "战斗道具",
  training: "训练道具",
  tm: "技能机器",
};

const SHELF_CATEGORY_ORDER: FormalShopCategoryV4[] = ["recovery", "berry", "battle", "training", "tm"];

export function TrainingRestShopShelf({api, shop, backgroundVisible = true}: TrainingRestShopShelfProps) {
  const slots = createShelfSlots(api, shop);
  return (
    <section className="training-rest-shop-shelf" aria-label="商店货架">
      {backgroundVisible ? <img className="training-rest-shop-shelf-bg" src="/shop/rest-store/shelf.png" alt="" draggable={false} /> : null}
      <div className="training-rest-shop-shelf-slots" aria-hidden={!shop}>
        {slots.map(slot => (
          <div
            className={`training-rest-shop-shelf-slot ${slot.item ? "filled" : ""}`}
            style={{"--training-rest-shop-shelf-slot-col": slot.col, "--training-rest-shop-shelf-slot-row": slot.row} as CSSProperties}
            title={slot.item ? slot.name : SHELF_CATEGORY_LABELS[slot.category]}
            key={`${slot.category}-${slot.col}-${slot.row}`}
          >
            {slot.item ? (
              <ShelfItemIcon api={api} item={slot.item} name={slot.name} iconUrl={slot.iconUrl} iconStyle={slot.iconStyle} />
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

type ShelfSlot = {
  category: FormalShopCategoryV4;
  col: number;
  row: number;
  item: FormalShopItemV4 | null;
  name: string;
  iconUrl?: string;
  iconStyle?: string;
};

function createShelfSlots(api: ChangeBattleV2Api, shop: FormalRestShopV4 | null): ShelfSlot[] {
  const slots: ShelfSlot[] = [];
  for (const category of SHELF_CATEGORY_ORDER) {
    const columns = SHELF_CATEGORY_COLUMNS[category];
    const items = (shop?.categories[category] || [])
      .slice()
      .sort((left, right) => itemCost(api, left.itemID) - itemCost(api, right.itemID));
    const maxItems = columns.length * 4;
    for (let index = 0; index < maxItems; index += 1) {
      const col = columns[Math.floor(index / 4)] ?? columns[0]!;
      const row = index % 4;
      const item = items[index] || null;
      const detail = item ? safeItemDetail(api, item.itemID) : null;
      slots.push({
        category,
        col,
        row,
        item,
        name: detail?.nameZh || detail?.name || item?.itemID || SHELF_CATEGORY_LABELS[category],
        iconUrl: detail?.iconUrl,
        iconStyle: detail?.iconStyle,
      });
    }
  }
  return slots;
}

function ShelfItemIcon({api, item, name, iconUrl, iconStyle}: {
  api: ChangeBattleV2Api;
  item: FormalShopItemV4;
  name: string;
  iconUrl?: string;
  iconStyle?: string;
}) {
  const spriteStyle = spriteStyleFromCss(iconStyle);
  if (spriteStyle) {
    return <span className="training-rest-shop-shelf-item-sprite" style={spriteStyle} aria-label={name} />;
  }
  const detail = safeItemDetail(api, item.itemID);
  return (
    <span className="training-rest-shop-shelf-item-img">
      <ImageWithFallback src={iconUrl || detail?.iconUrl || "/aboutIcon/shop.png"} alt={name} fallback={name.slice(0, 1)} />
    </span>
  );
}

function safeItemDetail(api: ChangeBattleV2Api, itemID: string) {
  try {
    return api.getItemDetail(itemID);
  } catch {
    return null;
  }
}

function itemCost(api: ChangeBattleV2Api, itemID: string): number {
  return Math.max(0, Math.floor(Number(safeItemDetail(api, itemID)?.cost || 0)));
}

function spriteStyleFromCss(iconStyle: string | undefined): CSSProperties | null {
  if (!iconStyle) return null;
  const match = /url\(([^)]+)\).*?(-?\d+)px\s+(-?\d+)px/.exec(iconStyle);
  if (!match) return null;
  return {
    backgroundImage: `url(${match[1]!.replace(/^['"]|['"]$/g, "")})`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: `${match[2]}px ${match[3]}px`,
  };
}
