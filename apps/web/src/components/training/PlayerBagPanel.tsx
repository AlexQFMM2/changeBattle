import {useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode} from "react";
import {motion} from "motion/react";
import type {ChangeBattleV2Api, DexItemDetail, PlayerItemInstanceV4} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import {styleUrlAssetPath} from "../../lib/assetUrl";
import "./PlayerBagPanel.css";

export type PlayerBagPokemonTarget = {
  key: string;
  name: string;
  nameZh?: string;
  level?: number;
  hp: number;
  maxHp: number;
  status?: string;
  iconUrl?: string;
  spriteUrl?: string;
  iconStyle?: string;
  heldItem?: PlayerItemInstanceV4 | null;
  battleIdLabel?: string;
};

export type PlayerBagAction = {
  key: string;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  title?: string;
  onClick: () => void;
};

export type PlayerBagPanelProps = {
  api: ChangeBattleV2Api;
  open: boolean;
  layout?: "scene" | "modal" | "battle";
  title?: string;
  items: PlayerItemInstanceV4[];
  maxSize: number;
  isBattle?: boolean;
  pokemonTargets: PlayerBagPokemonTarget[];
  heldItemIds?: Set<string>;
  actions: PlayerBagAction[];
  emptyItemText?: string;
  emptyTargetText?: string;
  footerNote?: ReactNode;
  onClose: () => void;
  onSelectionChange?: (selection: {item: PlayerItemInstanceV4 | null; target: PlayerBagPokemonTarget | null}) => void;
};

export function PlayerBagPanel({
  api,
  open,
  layout = "scene",
  title = "我的背包",
  items,
  maxSize,
  isBattle = false,
  pokemonTargets,
  heldItemIds = new Set(),
  actions,
  emptyItemText,
  emptyTargetText = "暂无宝可梦",
  footerNote,
  onClose,
  onSelectionChange,
}: PlayerBagPanelProps) {
  const visibleItems = useMemo(() => isBattle ? items.filter(item => item.canBattleUse) : items, [isBattle, items]);
  const [selectedItemId, setSelectedItemId] = useState(visibleItems[0]?.id || "");
  const [selectedTargetKey, setSelectedTargetKey] = useState(pokemonTargets[0]?.key || "");
  const bagStripRef = useRef<HTMLDivElement | null>(null);
  const [scrollState, setScrollState] = useState({left: 0, max: 0});
  const visibleItemIdsSignature = useMemo(() => visibleItems.map(item => item.id).join("|"), [visibleItems]);
  const targetKeysSignature = useMemo(() => pokemonTargets.map(target => target.key).join("|"), [pokemonTargets]);
  const firstVisibleItemId = visibleItems[0]?.id || "";
  const firstTargetKey = pokemonTargets[0]?.key || "";
  const selectedItem = visibleItems.find(item => item.id === selectedItemId) || visibleItems[0] || null;
  const selectedTarget = pokemonTargets.find(target => target.key === selectedTargetKey) || pokemonTargets[0] || null;
  const selectedDetail = useMemo(() => itemDetailFor(api, selectedItem), [api, selectedItem]);
  const selectionSignature = `${selectedItem?.id || ""}:${selectedTarget?.key || ""}`;
  const lastSelectionSignatureRef = useRef("");

  useEffect(() => {
    if (!visibleItems.length) {
      if (selectedItemId) setSelectedItemId("");
      return;
    }
    if (!visibleItems.some(item => item.id === selectedItemId)) setSelectedItemId(firstVisibleItemId);
  }, [firstVisibleItemId, selectedItemId, visibleItemIdsSignature, visibleItems]);

  useEffect(() => {
    if (!pokemonTargets.length) {
      if (selectedTargetKey) setSelectedTargetKey("");
      return;
    }
    if (!pokemonTargets.some(target => target.key === selectedTargetKey)) setSelectedTargetKey(firstTargetKey);
  }, [firstTargetKey, pokemonTargets, selectedTargetKey, targetKeysSignature]);

  useEffect(() => {
    if (lastSelectionSignatureRef.current === selectionSignature) return;
    lastSelectionSignatureRef.current = selectionSignature;
    onSelectionChange?.({item: selectedItem, target: selectedTarget});
  }, [onSelectionChange, selectedItem, selectedTarget, selectionSignature]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(updateScrollState);
    return () => window.cancelAnimationFrame(frame);
  }, [visibleItems.length, open]);

  function updateScrollState() {
    const node = bagStripRef.current;
    if (!node) {
      setScrollState({left: 0, max: 0});
      return;
    }
    setScrollState({
      left: Math.round(node.scrollLeft),
      max: Math.max(0, Math.round(node.scrollWidth - node.clientWidth)),
    });
  }

  function scrollBagStrip(value: number) {
    const node = bagStripRef.current;
    if (!node) return;
    node.scrollLeft = value;
    updateScrollState();
  }

  function selectBagItem(itemId: string) {
    setSelectedItemId(itemId);
    window.requestAnimationFrame(() => {
      const node = bagStripRef.current;
      const index = visibleItems.findIndex(item => item.id === itemId);
      const target = index >= 0 ? node?.children.item(index) : null;
      if (target instanceof HTMLElement) {
        target.scrollIntoView({block: "nearest", inline: "center"});
        updateScrollState();
      }
    });
  }

  return (
    <>
      <motion.section
        className={`training-rest-new-bag-panel training-rest-ui-panel ${open ? "open" : ""}`}
        data-layout={layout}
        aria-label={title}
        initial={false}
        animate={open ? {opacity: 1, y: 0, scale: 1} : {opacity: 0, y: 8, scale: 0.985}}
        transition={{duration: 0.16}}
      >
        {open ? (
          <div className="training-rest-new-bag-shell">
            <button className="training-rest-new-bag-close" type="button" onClick={onClose} aria-label="关闭背包">×</button>
            <header className="training-rest-new-bag-header">
              <strong>{title}</strong>
              <span>{visibleItems.length}/{maxSize}</span>
            </header>
            <section className="training-rest-new-bag-main">
              <div className="training-rest-new-bag-top">
                <article className="training-rest-new-bag-detail">
                  {selectedItem ? (
                    <>
                      <div className="training-rest-new-bag-detail-title">
                        <PlayerBagItemIcon api={api} item={selectedItem} large />
                        <div>
                          <strong>{displayItemName(selectedItem)}</strong>
                          <small>{selectedDetail?.kindLabel || itemTypeLabel(selectedItem.type)}</small>
                        </div>
                      </div>
                      <div className="training-rest-new-bag-description">
                        {itemDescription(selectedItem, selectedDetail)}
                      </div>
                    </>
                  ) : (
                    <div className="training-rest-new-bag-empty">
                      <strong>{emptyItemText || (isBattle ? "没有可战斗使用的道具" : "当前背包为空")}</strong>
                      <span>{isBattle ? "当前战斗背包没有可使用道具。" : "请先在训练配置页生成或添加道具。"}</span>
                    </div>
                  )}
                </article>
                <div className="training-rest-new-bag-pokemon-list" aria-label="宝可梦列表">
                  {pokemonTargets.length ? pokemonTargets.slice(0, 4).map(target => (
                    <button
                      className={target.key === selectedTarget?.key ? "selected" : ""}
                      type="button"
                      onClick={() => setSelectedTargetKey(target.key)}
                      key={target.key}
                    >
                      <PlayerBagPokemonIcon target={target} />
                      {target.heldItem ? (
                        <span
                          className="training-rest-new-bag-held-shortcut"
                          role="button"
                          tabIndex={0}
                          title={`查看${displayItemName(target.heldItem)}`}
                          onClick={event => {
                            event.stopPropagation();
                            selectBagItem(target.heldItem!.id);
                          }}
                          onKeyDown={event => {
                            if (event.key !== "Enter" && event.key !== " ") return;
                            event.preventDefault();
                            event.stopPropagation();
                            selectBagItem(target.heldItem!.id);
                          }}
                        >
                          <PlayerBagItemIcon api={api} item={target.heldItem} />
                        </span>
                      ) : null}
                      <small className="training-rest-new-bag-pokemon-level">
                        {target.status && target.status !== "" ? `${target.status} · ` : ""}Lv.{target.level ?? "?"}
                      </small>
                      <small className={`training-rest-new-bag-pokemon-held-label ${target.heldItem ? "has-item" : "empty"}`}>
                        {target.heldItem ? displayItemName(target.heldItem) : "无道具"}
                      </small>
                      {isBattle && target.battleIdLabel ? <em className="training-rest-new-bag-battle-id">{target.battleIdLabel}</em> : null}
                      <i style={{"--training-rest-new-bag-hp-rate": `${hpRate(target.hp, target.maxHp)}%`} as CSSProperties} />
                    </button>
                  )) : <p>{emptyTargetText}</p>}
                </div>
              </div>
              <footer className="training-rest-new-bag-actions">
                {actions.map(action => (
                  <button
                    className={action.danger ? "danger" : ""}
                    type="button"
                    disabled={action.disabled}
                    title={action.title}
                    onClick={action.onClick}
                    key={action.key}
                  >
                    {action.label}
                  </button>
                ))}
              </footer>
            </section>
            {footerNote ? <small className="training-rest-new-bag-footer-note">{footerNote}</small> : null}
          </div>
        ) : null}
      </motion.section>
      <motion.section
        className={`training-rest-new-bag-drawer ${open ? "open" : ""}`}
        data-layout={layout}
        aria-label="背包道具列表"
        initial={false}
        animate={open ? {y: 0, opacity: 1} : {y: "110%", opacity: 0}}
        transition={{duration: 0.18}}
      >
        <div className="training-rest-new-bag-strip-wrap">
          <div className="training-rest-new-bag-strip" ref={bagStripRef} onScroll={updateScrollState}>
            {visibleItems.length ? visibleItems.map(item => {
              const important = isImportantSystemBattleItem(item, itemDetailFor(api, item));
              return (
                <button
                  className={`${item.id === selectedItem?.id ? "selected" : ""} ${heldItemIds.has(item.id) ? "held" : ""} ${important ? "important" : ""}`}
                  type="button"
                  onClick={() => selectBagItem(item.id)}
                  key={item.id}
                >
                  <PlayerBagItemIcon api={api} item={item} />
                  <strong>{displayItemName(item)}</strong>
                </button>
              );
            }) : <span className="training-rest-new-bag-strip-empty">{emptyItemText || (isBattle ? "没有可用道具" : "当前背包为空")}</span>}
          </div>
          <input
            className="training-rest-new-bag-scrollbar"
            type="range"
            min={0}
            max={Math.max(1, scrollState.max)}
            value={Math.min(scrollState.left, Math.max(1, scrollState.max))}
            disabled={!scrollState.max}
            onChange={event => scrollBagStrip(Number(event.currentTarget.value))}
            aria-label="横向滚动背包道具"
          />
        </div>
      </motion.section>
    </>
  );
}

export function displayItemName(item: PlayerItemInstanceV4 | null | undefined): string {
  if (!item) return "";
  const mapped = item.mappedItemNameZh || item.mappedItemName || item.mappedTeraTypeZh || item.mappedTeraType || "";
  return mapped ? `${item.name}（${mapped}）` : item.name;
}

export function itemDetailFor(api: ChangeBattleV2Api, item: PlayerItemInstanceV4 | null): DexItemDetail | null {
  if (!item) return null;
  try {
    return api.getItemDetail(item.itemID);
  } catch {
    return null;
  }
}

function itemDescription(_item: PlayerItemInstanceV4, detail: DexItemDetail | null): string {
  return detail?.description || detail?.effectSummary || "暂无道具介绍。";
}

export function PlayerBagItemIcon({api, item, large = false}: {api: ChangeBattleV2Api; item: PlayerItemInstanceV4; large?: boolean}) {
  const className = large ? "training-rest-new-bag-detail-icon" : "training-rest-new-bag-item-icon";
  try {
    const detail = api.getItemDetail(item.itemID);
    const spriteStyle = detail.iconStyle ? spriteStyleFromCss(detail.iconStyle) : null;
    if (spriteStyle) return <span className={className} aria-hidden="true"><span className="training-rest-new-bag-sprite-icon" style={spriteStyle} /></span>;
    if (detail.iconUrl) return <span className={className} style={styleOnlyFromCss(detail.iconStyle)}><ImageWithFallback src={detail.iconUrl} alt="" fallback="◇" /></span>;
  } catch {
    // Fall back to instance image or text marker.
  }
  return item.image ? <span className={className}><ImageWithFallback src={item.image} alt="" fallback="◇" /></span> : <span className={className}>◇</span>;
}

function PlayerBagPokemonIcon({target}: {target: PlayerBagPokemonTarget}) {
  const iconStyle = target.iconStyle ? spriteStyleFromCss(target.iconStyle) : null;
  if (iconStyle) return <span className="training-rest-new-bag-pokemon-icon picon" aria-hidden="true" style={iconStyle} />;
  const src = target.spriteUrl || target.iconUrl || "";
  return <ImageWithFallback src={src} alt="" fallback={(target.nameZh || target.name).slice(0, 1) || "?"} />;
}

function isImportantSystemBattleItem(item: PlayerItemInstanceV4, detail: DexItemDetail | null): boolean {
  return item.type === "system-battle" || detail?.kind === "system-battle";
}

function hpRate(hp: number, maxHp: number): number {
  if (!maxHp) return 0;
  return Math.max(0, Math.min(100, hp / maxHp * 100));
}

function itemTypeLabel(type: PlayerItemInstanceV4["type"]): string {
  const labels: Record<PlayerItemInstanceV4["type"], string> = {
    system: "系统道具",
    "system-battle": "系统战斗道具",
    held: "携带道具",
    medicine: "回复道具",
    berry: "树果",
    training: "训练道具",
    battle: "战斗道具",
    tm: "技能机器",
    key: "重要道具",
    misc: "其他道具",
  };
  return labels[type] || type;
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

function styleOnlyFromCss(css: string | undefined): CSSProperties | undefined {
  if (!css) return undefined;
  const filter = /filter:\s*([^;]+)/.exec(css)?.[1]?.trim();
  return filter ? {filter} : undefined;
}
