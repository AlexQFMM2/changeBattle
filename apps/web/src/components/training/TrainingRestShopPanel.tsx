import {useEffect, useMemo, useState, type CSSProperties} from "react";
import type {ChangeBattleV2Api, FormalRestShopV4, FormalShopCategoryV4, FormalShopItemV4, PlayerItemInstanceV4, TrainingPlayerDraftV4} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import "./TrainingRestShopPanel.css";

export type TrainingRestShopPanelProps = {
  api: ChangeBattleV2Api;
  open: boolean;
  shop: FormalRestShopV4 | null;
  player: TrainingPlayerDraftV4 | null;
  money: number;
  busy?: boolean;
  message?: string;
  onClose: () => void;
  onBuy: (slotId: string) => void;
  onSell: (itemInstanceIds: string[]) => void;
};

const CATEGORY_LABELS: Record<FormalShopCategoryV4, string> = {
  recovery: "恢复药",
  berry: "树果",
  battle: "战斗道具",
  tm: "技能机器",
  training: "训练道具",
};

const CATEGORY_ORDER: FormalShopCategoryV4[] = ["recovery", "berry", "battle", "tm", "training"];

export function TrainingRestShopPanel({api, open, shop, player, money, busy = false, message = "", onClose, onBuy, onSell}: TrainingRestShopPanelProps) {
  const bagItems = player?.bag.items || [];
  const heldItemIds = useMemo(() => new Set((player?.localTeam.pokemon || []).map(pokemon => pokemon.heldItemInstanceId).filter(Boolean) as string[]), [player?.localTeam.pokemon]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<{kind: "bag"; item: PlayerItemInstanceV4} | {kind: "shop"; item: FormalShopItemV4} | null>(null);
  const sellableItems = useMemo(() => bagItems.filter(item => canSellItem(item, heldItemIds)), [bagItems, heldItemIds]);
  const selectedItems = useMemo(() => bagItems.filter(item => selectedIds.has(item.id) && canSellItem(item, heldItemIds)), [bagItems, heldItemIds, selectedIds]);
  const selectedSellTotal = selectedItems.reduce((sum, item) => sum + sellPrice(item), 0);

  useEffect(() => {
    if (!open) {
      setSelectedIds(new Set());
      setDetail(null);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIds(current => {
      const valid = new Set(bagItems.filter(item => canSellItem(item, heldItemIds)).map(item => item.id));
      const next = new Set(Array.from(current).filter(id => valid.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [bagItems, heldItemIds]);

  if (!open) return null;

  function toggleSellItem(item: PlayerItemInstanceV4) {
    if (!canSellItem(item, heldItemIds) || busy) return;
    setSelectedIds(current => {
      const next = new Set(current);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
    setDetail({kind: "bag", item});
  }

  function confirmSell() {
    if (!selectedItems.length || busy) return;
    onSell(selectedItems.map(item => item.id));
  }

  return (
    <section className="training-rest-shop-panel" aria-label="正式休整商店">
      <div className="training-rest-shop-shell">
        <button className="training-rest-shop-close" type="button" aria-label="关闭商店" onClick={onClose}>×</button>
        <section className="training-rest-shop-bag" aria-label="玩家背包出售区">
          <PanelHeader title="背包" meta={`${sellableItems.length}/${bagItems.length}`} />
          <div className="training-rest-shop-list bag-list">
            {bagItems.length ? bagItems.map(item => {
              const disabled = !canSellItem(item, heldItemIds);
              const selected = selectedIds.has(item.id);
              return (
                <button
                  className={`${selected ? "selected" : ""} ${disabled ? "disabled" : ""}`}
                  type="button"
                  disabled={disabled || busy}
                  title={disabled ? sellDisabledReason(item, heldItemIds) : `卖出价 ${sellPrice(item)}`}
                  onClick={() => toggleSellItem(item)}
                  key={item.id}
                >
                  <ShopIcon api={api} itemID={item.itemID} image={item.image} />
                  <span>
                    <strong>{item.name}</strong>
                    <small>{disabled ? sellDisabledReason(item, heldItemIds) : `卖出 ${sellPrice(item)}`}</small>
                  </span>
                </button>
              );
            }) : (
              <p>背包为空</p>
            )}
          </div>
          <footer className="training-rest-shop-sell-footer">
            <span>总卖价：{selectedSellTotal}</span>
            <button type="button" disabled={!selectedItems.length || busy} onClick={confirmSell}>确认卖出</button>
          </footer>
        </section>
        <section className="training-rest-shop-store" aria-label="本轮商店商品">
          <PanelHeader title="商店" meta={shop ? `${Math.max(0, Math.floor(money)).toLocaleString()} 金币` : "未开放"} />
          {shop ? (
            <div className="training-rest-shop-store-list">
              {CATEGORY_ORDER.map(category => (
                <article className="training-rest-shop-category" key={category}>
                  <h3>{CATEGORY_LABELS[category]}</h3>
                  {shop.categories[category].map(item => (
                    <ShopStockRow
                      api={api}
                      item={item}
                      money={money}
                      busy={busy}
                      onDetail={() => setDetail({kind: "shop", item})}
                      onBuy={() => onBuy(item.slotId)}
                      key={item.slotId}
                    />
                  ))}
                </article>
              ))}
            </div>
          ) : (
            <div className="training-rest-shop-empty">
              <strong>商店仅正式流程开放</strong>
              <span>当前没有可用商店。</span>
            </div>
          )}
        </section>
        <ShopDetail api={api} detail={detail} onClose={() => setDetail(null)} />
        <span className="training-rest-shop-message" role="status">{message || "选择左侧道具卖出，或从右侧逐件购买。"}</span>
      </div>
    </section>
  );
}

function PanelHeader({title, meta}: {title: string; meta: string}) {
  return (
    <header className="training-rest-shop-panel-header">
      <strong>{title}</strong>
      <span>{meta}</span>
    </header>
  );
}

function ShopStockRow({api, item, money, busy, onDetail, onBuy}: {
  api: ChangeBattleV2Api;
  item: FormalShopItemV4;
  money: number;
  busy: boolean;
  onDetail: () => void;
  onBuy: () => void;
}) {
  const detail = itemDetail(api, item.itemID);
  const price = Math.max(0, Math.floor(Number(detail?.cost || 0)));
  const disabled = busy || item.stock <= 0 || price <= 0 || money < price;
  return (
    <div className={`training-rest-shop-stock ${disabled ? "disabled" : ""}`}>
      <ShopIcon api={api} itemID={item.itemID} image={detail?.iconUrl} iconStyle={detail?.iconStyle} />
      <span>
        <strong>{detail?.nameZh || detail?.name || item.itemID}</strong>
        <small>{price} 金币 · 库存 {item.stock}</small>
      </span>
      <button type="button" onClick={onDetail}>详情</button>
      <button type="button" disabled={disabled} onClick={onBuy}>购买</button>
    </div>
  );
}

function ShopDetail({api, detail, onClose}: {
  api: ChangeBattleV2Api;
  detail: {kind: "bag"; item: PlayerItemInstanceV4} | {kind: "shop"; item: FormalShopItemV4} | null;
  onClose: () => void;
}) {
  if (!detail) return null;
  const itemID = detail.kind === "bag" ? detail.item.itemID : detail.item.itemID;
  const dexDetail = itemDetail(api, itemID);
  const name = detail.kind === "bag" ? detail.item.name : dexDetail?.nameZh || dexDetail?.name || itemID;
  const price = detail.kind === "bag" ? sellPrice(detail.item) : Math.max(0, Math.floor(Number(dexDetail?.cost || 0)));
  return (
    <aside className="training-rest-shop-detail" aria-label="商品详情">
      <button type="button" onClick={onClose} aria-label="关闭详情">×</button>
      <div>
        <ShopIcon api={api} itemID={itemID} image={detail.kind === "bag" ? detail.item.image : dexDetail?.iconUrl} iconStyle={dexDetail?.iconStyle} large />
        <span>
          <strong>{name}</strong>
          <small>{dexDetail?.kindLabel || (detail.kind === "bag" ? detail.item.type : "")}</small>
        </span>
      </div>
      <p>{dexDetail?.effectSummary || dexDetail?.description || "暂无说明。"}</p>
      <em>{detail.kind === "bag" ? `卖出价 ${price}` : `售价 ${price}`}</em>
    </aside>
  );
}

function ShopIcon({api, itemID, image, iconStyle, large = false}: {api: ChangeBattleV2Api; itemID: string; image?: string; iconStyle?: string; large?: boolean}) {
  const detail = itemDetail(api, itemID);
  const spriteStyle = spriteStyleFromCss(iconStyle || detail?.iconStyle);
  const fallback = detail?.iconUrl || image || "/aboutIcon/shop.png";
  const imageStyle = styleOnlyFromCss(iconStyle || detail?.iconStyle);
  if (spriteStyle) {
    return (
      <span className={`training-rest-shop-icon ${large ? "large" : ""}`}>
        <span className="training-rest-shop-sprite-icon" style={spriteStyle} />
      </span>
    );
  }
  return (
    <span className={`training-rest-shop-icon ${large ? "large" : ""}`} style={imageStyle}>
      <ImageWithFallback src={fallback} alt="" fallback={itemID.slice(0, 2).toUpperCase()} />
    </span>
  );
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

function styleOnlyFromCss(css: string | undefined): CSSProperties | undefined {
  if (!css) return undefined;
  const filter = /filter:\s*([^;]+)/.exec(css)?.[1]?.trim();
  return filter ? {filter} : undefined;
}

function itemDetail(api: ChangeBattleV2Api, itemID: string) {
  try {
    return api.getItemDetail(itemID);
  } catch {
    return null;
  }
}

function canSellItem(item: PlayerItemInstanceV4, heldItemIds: Set<string>): boolean {
  return Boolean(item.canSale && !heldItemIds.has(item.id) && sellPrice(item) > 0);
}

function sellPrice(item: PlayerItemInstanceV4): number {
  return Math.floor(Math.max(0, Number(item.cost || 0)) * 0.25);
}

function sellDisabledReason(item: PlayerItemInstanceV4, heldItemIds: Set<string>): string {
  if (heldItemIds.has(item.id)) return "携带中";
  if (!item.canSale) return "不可售";
  if (sellPrice(item) <= 0) return "无价值";
  return "不可售";
}
