import {useEffect, useMemo, useRef, useState, type CSSProperties} from "react";
import {motion} from "motion/react";
import type {ChangeBattleV2Api, DexItemDetail, LocalPokemonV4, PlayerItemInstanceV4, TrainingPlayerDraftV4, TrainingRunGameV4} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import "./TrainingRestNewBagPanel.css";

export type TrainingRestNewBagPanelProps = {
  api: ChangeBattleV2Api;
  open: boolean;
  run: TrainingRunGameV4;
  onClose: () => void;
  onRunDraftChange: (run: TrainingRunGameV4, message: string) => void;
};

const EQUIPPABLE_ITEM_KINDS = new Set(["battle", "held", "berry", "special"]);

export function TrainingRestNewBagPanel({api, open, run, onClose, onRunDraftChange}: TrainingRestNewBagPanelProps) {
  const p1 = run.players.p1 || null;
  const bag = api.normalizeBagState(p1?.bag);
  const team = p1?.localTeam.pokemon || [];
  const [selectedItemId, setSelectedItemId] = useState(bag.items[0]?.id || "");
  const [selectedPokemonId, setSelectedPokemonId] = useState(team[0]?.localPokemonId || "");
  const bagStripRef = useRef<HTMLDivElement | null>(null);
  const [scrollState, setScrollState] = useState({left: 0, max: 0});
  const selectedItem = bag.items.find(item => item.id === selectedItemId) || bag.items[0] || null;
  const selectedPokemon = team.find(pokemon => pokemon.localPokemonId === selectedPokemonId) || team[0] || null;
  const selectedDetail = useMemo(() => itemDetailFor(api, selectedItem), [api, selectedItem]);
  const heldBy = useMemo(() => buildHeldItemMap(team), [team]);
  const equipEligibility = selectedItem ? getBagItemEquipEligibility(selectedItem, selectedDetail) : {canEquip: false, reason: "请选择道具"};
  const canDiscard = Boolean(selectedItem && !isSystemItem(selectedItem, selectedDetail));

  useEffect(() => {
    if (!bag.items.length) {
      setSelectedItemId("");
      return;
    }
    if (!bag.items.some(item => item.id === selectedItemId)) setSelectedItemId(bag.items[0]?.id || "");
  }, [bag.items, selectedItemId]);

  useEffect(() => {
    if (!team.length) {
      setSelectedPokemonId("");
      return;
    }
    if (!team.some(pokemon => pokemon.localPokemonId === selectedPokemonId)) setSelectedPokemonId(team[0]?.localPokemonId || "");
  }, [selectedPokemonId, team]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(updateScrollState);
    return () => window.cancelAnimationFrame(frame);
  }, [bag.items.length, open]);

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
      const index = bag.items.findIndex(item => item.id === itemId);
      const target = index >= 0 ? node?.children.item(index) : null;
      if (target instanceof HTMLElement) {
        target.scrollIntoView({block: "nearest", inline: "center"});
        updateScrollState();
      }
    });
  }

  function equipSelectedItem() {
    if (!p1 || !selectedItem) return;
    if (!selectedPokemon) {
      return;
    }
    if (!equipEligibility.canEquip) {
      return;
    }
    const nextTeam = {
      ...p1.localTeam,
      pokemon: p1.localTeam.pokemon.map(pokemon => {
        if (pokemon.localPokemonId === selectedPokemon.localPokemonId) {
          return {...pokemon, itemId: selectedItem.itemID, heldItemInstanceId: selectedItem.id};
        }
        if (pokemon.heldItemInstanceId === selectedItem.id) {
          return {...pokemon, itemId: "", heldItemInstanceId: undefined};
        }
        return pokemon;
      }),
    };
    const nextRun = patchP1(run, {...p1, localTeam: nextTeam});
    onRunDraftChange(nextRun, "背包已更新，记得手动保存。");
  }

  function discardSelectedItem() {
    if (!p1 || !selectedItem) return;
    if (!canDiscard) {
      return;
    }
    const nextBag = {...bag, items: bag.items.filter(item => item.id !== selectedItem.id)};
    const nextTeam = {
      ...p1.localTeam,
      pokemon: p1.localTeam.pokemon.map(pokemon => pokemon.heldItemInstanceId === selectedItem.id
        ? {...pokemon, itemId: "", heldItemInstanceId: undefined}
        : pokemon),
    };
    const nextRun = patchP1(run, {...p1, bag: nextBag, localTeam: nextTeam});
    onRunDraftChange(nextRun, "背包已更新，记得手动保存。");
  }

  return (
    <>
      <motion.section
        className={`training-rest-new-bag-panel training-rest-ui-panel ${open ? "open" : ""}`}
        aria-label="我的背包操作"
        initial={false}
        animate={open ? {opacity: 1, y: 0, scale: 1} : {opacity: 0, y: 8, scale: 0.985}}
        transition={{duration: 0.16}}
      >
        {open ? (
          <div className="training-rest-new-bag-shell">
            <button className="training-rest-new-bag-close" type="button" onClick={onClose} aria-label="关闭背包">×</button>
            <header className="training-rest-new-bag-header">
              <strong>我的背包</strong>
              <span>{bag.items.length}/{bag.maxSize}</span>
            </header>
            <section className="training-rest-new-bag-main">
              <div className="training-rest-new-bag-top">
                <article className="training-rest-new-bag-detail">
                  {selectedItem ? (
                    <>
                      <div className="training-rest-new-bag-detail-title">
                        <RestBagItemIcon api={api} item={selectedItem} large />
                        <div>
                          <strong>{selectedItem.name}</strong>
                          <small>{selectedDetail?.kindLabel || itemTypeLabel(selectedItem.type)}</small>
                        </div>
                      </div>
                      <div className="training-rest-new-bag-description">
                        {selectedDetail?.description || selectedDetail?.effectSummary || "暂无道具介绍。"}
                      </div>
                    </>
                  ) : (
                    <div className="training-rest-new-bag-empty">
                      <strong>当前背包为空</strong>
                      <span>请先在训练配置页生成或添加道具。</span>
                    </div>
                  )}
                </article>
                <div className="training-rest-new-bag-pokemon-list" aria-label="宝可梦列表">
                  {team.length ? team.slice(0, 4).map(pokemon => {
                    const heldItem = itemForPokemon(bag.items, pokemon);
                    return (
                      <button
                        className={pokemon.localPokemonId === selectedPokemon?.localPokemonId ? "selected" : ""}
                        type="button"
                        onClick={() => setSelectedPokemonId(pokemon.localPokemonId)}
                        key={pokemon.localPokemonId}
                      >
                        <RestBagPokemonIcon pokemon={pokemon} />
                        {heldItem ? (
                          <span
                            className="training-rest-new-bag-held-shortcut"
                            role="button"
                            tabIndex={0}
                            title={`查看${heldItem.name}`}
                            onClick={event => {
                              event.stopPropagation();
                              selectBagItem(heldItem.id);
                            }}
                            onKeyDown={event => {
                              if (event.key !== "Enter" && event.key !== " ") return;
                              event.preventDefault();
                              event.stopPropagation();
                              selectBagItem(heldItem.id);
                            }}
                          >
                            <RestBagItemIcon api={api} item={heldItem} />
                          </span>
                        ) : null}
                        <small className="training-rest-new-bag-pokemon-level">Lv.{pokemon.level}</small>
                        <i style={{"--training-rest-new-bag-hp-rate": `${hpRate(pokemon)}%`} as CSSProperties} />
                      </button>
                    );
                  }) : <p>暂无宝可梦</p>}
                </div>
              </div>
              <footer className="training-rest-new-bag-actions">
                <button type="button" disabled={!selectedItem || !selectedPokemon || !equipEligibility.canEquip} title={equipEligibility.reason} onClick={equipSelectedItem}>
                  立即携带
                </button>
                <button type="button" disabled={!selectedItem || !selectedItem.canUse}>
                  立即使用
                </button>
                <button type="button" disabled={!selectedItem || !isRecastCandidate(selectedItem, selectedDetail)}>
                  重铸
                </button>
                <button type="button" className="danger" disabled={!selectedItem || !canDiscard} onClick={discardSelectedItem}>
                  丢弃
                </button>
              </footer>
            </section>
          </div>
        ) : null}
      </motion.section>
      <motion.section
        className={`training-rest-new-bag-drawer ${open ? "open" : ""}`}
        aria-label="背包道具列表"
        initial={false}
        animate={open ? {y: 0, opacity: 1} : {y: "110%", opacity: 0}}
        transition={{duration: 0.18}}
      >
        <div className="training-rest-new-bag-drawer-title">背包道具</div>
        <div className="training-rest-new-bag-strip-wrap">
          <div className="training-rest-new-bag-strip" ref={bagStripRef} onScroll={updateScrollState}>
            {bag.items.length ? bag.items.map(item => {
              const important = isImportantSystemBattleItem(item, itemDetailFor(api, item));
              return (
                <button
                  className={`${item.id === selectedItem?.id ? "selected" : ""} ${heldBy.has(item.id) ? "held" : ""} ${important ? "important" : ""}`}
                  type="button"
                  onClick={() => setSelectedItemId(item.id)}
                  key={item.id}
                >
                  <RestBagItemIcon api={api} item={item} />
                  <strong>{item.name}</strong>
                </button>
              );
            }) : <span className="training-rest-new-bag-strip-empty">当前背包为空</span>}
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

function patchP1(run: TrainingRunGameV4, p1: TrainingPlayerDraftV4): TrainingRunGameV4 {
  const nextPlayers = {...run.players, p1};
  const nextScenarioPlayers = run.scenario.players.map(player => player.playerId === "p1" ? p1 : player);
  return {
    ...run,
    players: nextPlayers,
    scenario: {...run.scenario, players: nextScenarioPlayers},
    updatedAt: new Date().toISOString(),
  };
}

function itemDetailFor(api: ChangeBattleV2Api, item: PlayerItemInstanceV4 | null): DexItemDetail | null {
  if (!item) return null;
  try {
    return api.getItemDetail(item.itemID);
  } catch {
    return null;
  }
}

function getBagItemEquipEligibility(item: PlayerItemInstanceV4, detail: DexItemDetail | null): {canEquip: boolean; reason: string} {
  if (item.canTake || detail?.canTake || (detail && EQUIPPABLE_ITEM_KINDS.has(detail.kind))) return {canEquip: true, reason: ""};
  if (["battle", "held", "berry"].includes(item.type)) return {canEquip: true, reason: ""};
  return {canEquip: false, reason: "该道具当前不能携带。"};
}

function buildHeldItemMap(team: LocalPokemonV4[]): Map<string, LocalPokemonV4> {
  const map = new Map<string, LocalPokemonV4>();
  for (const pokemon of team) {
    if (pokemon.heldItemInstanceId) map.set(pokemon.heldItemInstanceId, pokemon);
  }
  return map;
}

function isSystemItem(item: PlayerItemInstanceV4, detail: DexItemDetail | null): boolean {
  return item.type === "system" || item.type === "system-battle" || item.itemID.startsWith("system-") || detail?.source === "system";
}

function isRecastCandidate(item: PlayerItemInstanceV4, detail: DexItemDetail | null): boolean {
  return item.itemID === "system-mega-stone" || item.itemID === "system-z-crystal" || item.itemID === "system-tera-orb" || detail?.kind === "system-battle";
}

function isImportantSystemBattleItem(item: PlayerItemInstanceV4, detail: DexItemDetail | null): boolean {
  return item.type === "system-battle" || detail?.kind === "system-battle";
}

function RestBagItemIcon({api, item, large = false}: {api: ChangeBattleV2Api; item: PlayerItemInstanceV4; large?: boolean}) {
  const className = large ? "training-rest-new-bag-detail-icon" : "training-rest-new-bag-item-icon";
  try {
    const detail = api.getItemDetail(item.itemID);
    if (detail.iconStyle) return <span className={className} aria-hidden="true"><span className="training-rest-new-bag-sprite-icon" style={styleFromCss(detail.iconStyle)} /></span>;
    if (detail.iconUrl) return <span className={className}><ImageWithFallback src={detail.iconUrl} alt="" fallback="◇" /></span>;
  } catch {
    // Fall back to instance image or text marker.
  }
  return item.image ? <span className={className}><ImageWithFallback src={item.image} alt="" fallback="◇" /></span> : <span className={className}>◇</span>;
}

function RestBagPokemonIcon({pokemon}: {pokemon: LocalPokemonV4}) {
  if (pokemon.iconStyle) return <span className="training-rest-new-bag-pokemon-icon picon" aria-hidden="true" style={styleFromCss(pokemon.iconStyle)} />;
  const src = pokemon.spriteUrl || pokemon.iconUrl || "";
  return <ImageWithFallback src={src} alt="" fallback={pokemon.nameZh.slice(0, 1) || "?"} />;
}

function itemForPokemon(items: PlayerItemInstanceV4[], pokemon: LocalPokemonV4): PlayerItemInstanceV4 | null {
  if (pokemon.heldItemInstanceId) return items.find(item => item.id === pokemon.heldItemInstanceId) || null;
  return null;
}

function hpRate(pokemon: LocalPokemonV4): number {
  if (!pokemon.maxHp) return 0;
  return Math.max(0, Math.min(100, pokemon.entryHp / pokemon.maxHp * 100));
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

function styleFromCss(css: string): CSSProperties {
  const match = /url\(([^)]+)\).*?(-?\d+)px\s+(-?\d+)px/.exec(css);
  if (!match) return {};
  return {
    backgroundImage: `url(${match[1]})`,
    backgroundPosition: `${match[2]}px ${match[3]}px`,
    backgroundRepeat: "no-repeat",
  };
}
