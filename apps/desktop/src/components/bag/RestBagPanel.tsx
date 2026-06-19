import {useEffect, useMemo, useState} from "react";
import type {BagItemView, DesktopGameState, PricedMove, RestAction, StatId} from "@changebattle/shared";
import {REST_SHOP_DISCOUNT_COUPONS} from "@changebattle/shared";
import {STAT_ROWS} from "../../lib/ui";
import {toId} from "../../lib/ui";
import {BagActionPanel, type BagActionStep, type BagDetailAction} from "./BagActionPanel";
import {BagFilterTabs} from "./BagFilterTabs";
import {BagItemList} from "./BagItemList";
import {BAG_FILTERS, TRAINING_ITEM_UI, bagFilterForItem, isLockedBagItem, isTrainingBagItem, resolveTmMoveIdForSlot, tmFallbackMove, tmMoveId, tmMoveSearchQuery} from "./bagModel";
import type {BagFilterKey} from "./bagModel";
import "./RestBagPanel.css";

type RestState = NonNullable<DesktopGameState["rest"]>;
type RestActionResult = DesktopGameState | boolean | void;
type RestActionHandler = (action: RestAction, successMessage?: string) => RestActionResult | Promise<RestActionResult>;
type BagUseAction = "use" | "equip" | "tm";

const SINGLE_MOVE_PP_ITEMS = new Set(["ether", "maxether", "leppaberry"]);

function isDesktopGameStateResult(result: RestActionResult): result is DesktopGameState {
  return Boolean(result && typeof result === "object" && "screen" in result);
}

export function RestBagPanel({rest, initialTarget = 0, onAction, learnableMoves}: {rest: RestState; initialTarget?: number; onAction: RestActionHandler; learnableMoves?: (slot: number, query?: string) => Promise<PricedMove[]>}) {
  const allItems = useMemo(() => Object.values(rest.bag_categories || {consumable: [], held: [], tm: []}).flat(), [rest.bag_categories]);
  const counts = useMemo(() => Object.fromEntries(BAG_FILTERS.map(entry => [entry.key, allItems.filter(item => bagFilterForItem(item, entry.key)).length])) as Record<BagFilterKey, number>, [allItems]);
  const firstAvailableFilter = BAG_FILTERS.find(entry => counts[entry.key])?.key || "recovery";
  const [filter, setFilter] = useState<BagFilterKey>(firstAvailableFilter);
  const items = useMemo(() => allItems.filter(item => bagFilterForItem(item, filter)), [allItems, filter]);
  const [itemId, setItemId] = useState(() => items[0]?.id || allItems[0]?.id || "");
  const selected = items.find(item => item.id === itemId) || items[0] || null;
  const [step, setStep] = useState<BagActionStep>("detail");
  const [busySlot, setBusySlot] = useState<number | null>(null);
  const [selectedAction, setSelectedAction] = useState<BagUseAction>("use");
  const [selectedTarget, setSelectedTarget] = useState(() => Math.max(0, Math.min(initialTarget, Math.max(0, rest.player_display.length - 1))));
  const [selectedMoveSlot, setSelectedMoveSlot] = useState<number | null>(null);
  const [tmLegalBySlot, setTmLegalBySlot] = useState<Record<number, PricedMove[]>>({});
  const [tmLoading, setTmLoading] = useState(false);
  const [tmMove, setTmMove] = useState<PricedMove | null>(null);
  const [tmMoveLoading, setTmMoveLoading] = useState(false);
  const selectedMoveId = tmMoveId(selected || undefined);
  const selectedMoveQuery = tmMoveSearchQuery(selected || undefined);
  const trainingUi = selected ? TRAINING_ITEM_UI[toId(selected.id)] : undefined;
  const [selectedStat, setSelectedStat] = useState<StatId | undefined>(() => trainingUi?.scope === "one" ? trainingUi.fixedStat || "hp" : undefined);
  const statOptions = trainingUi?.scope === "one" ? trainingUi.fixedStat ? [trainingUi.fixedStat] : STAT_ROWS.map(([stat]) => stat) : [];
  const locked = isLockedBagItem(selected);
  const isTm = selected?.category === "tm";
  const selectedId = selected ? toId(selected.id) : "";
  const isConsumable = selected?.category === "consumable";
  const isHeld = selected?.category === "held";
  const isBerry = Boolean(selectedId && selectedId.endsWith("berry"));
  const isTrainingItem = Boolean(selected && isTrainingBagItem(selected));
  const canUseOnPokemon = Boolean(selected && (isConsumable || isTrainingItem));
  const canEquipAsHeld = Boolean(selected && !isTrainingItem && (isHeld || isBerry));
  const needsPpMove = Boolean(selected && SINGLE_MOVE_PP_ITEMS.has(selectedId));

  useEffect(() => {
    if (!items.length && filter !== firstAvailableFilter) setFilter(firstAvailableFilter);
  }, [filter, firstAvailableFilter, items.length]);

  useEffect(() => {
    if (itemId && !items.some(item => item.id === itemId)) setItemId(items[0]?.id || "");
    if (!itemId && items.length) setItemId(items[0].id);
  }, [itemId, items]);

  useEffect(() => {
    setSelectedStat(trainingUi?.scope === "one" ? trainingUi.fixedStat || "hp" : undefined);
    setStep("detail");
    setSelectedTarget(Math.max(0, Math.min(initialTarget, Math.max(0, rest.player_display.length - 1))));
    setSelectedMoveSlot(null);
    setSelectedAction(isTm ? "tm" : canUseOnPokemon ? "use" : "equip");
    setTmMove(null);
  }, [canUseOnPokemon, initialTarget, isTm, selected?.id, trainingUi?.fixedStat, trainingUi?.scope, rest.player_display.length]);

  useEffect(() => {
    let cancelled = false;
    setTmLegalBySlot({});
    if (!isTm) return () => { cancelled = true; };
    const loader = learnableMoves || ((slot: number, query?: string) => window.changeBattle?.learnableMoves(slot, query) || Promise.resolve([]));
    setTmLoading(true);
    void Promise.all(rest.player_display.map((_pokemon, index) => loader(index, selectedMoveQuery).then(moves => [index, moves] as const))).then(entries => {
      if (!cancelled) setTmLegalBySlot(Object.fromEntries(entries));
    }).finally(() => {
      if (!cancelled) setTmLoading(false);
    });
    return () => { cancelled = true; };
  }, [isTm, learnableMoves, selected?.id, selectedMoveId, selectedMoveQuery, rest.player_display]);

  useEffect(() => {
    let cancelled = false;
    setTmMove(null);
    if (!isTm || step !== "moveReplace") return () => { cancelled = true; };
    const loader = learnableMoves || ((slot: number, query?: string) => window.changeBattle?.learnableMoves(slot, query) || Promise.resolve([]));
    setTmMoveLoading(true);
    void loader(selectedTarget, selectedMoveQuery).then(moves => {
      const moveId = selectedTmMoveIdForSlot(selectedTarget);
      if (!cancelled) setTmMove(moves.find(move => toId(move.id || move.name) === moveId) || null);
    }).finally(() => {
      if (!cancelled) setTmMoveLoading(false);
    });
    return () => { cancelled = true; };
  }, [isTm, learnableMoves, selected?.id, selectedMoveId, selectedMoveQuery, selectedTarget, step, tmLegalBySlot]);

  function selectedTmMoveIdForSlot(slot: number): string {
    return resolveTmMoveIdForSlot(selected || undefined, tmLegalBySlot[slot] || []);
  }

  function alreadyKnows(slot: number): boolean {
    const pokemon = rest.player_display[slot];
    const moveId = selectedTmMoveIdForSlot(slot);
    return Boolean(moveId && pokemon?.moves.some(move => toId(move.id || move.name) === moveId));
  }

  function canUseOn(slot: number): boolean {
    if (!selected || locked) return false;
    if (selectedAction === "equip") return canEquipAsHeld && selected.count > 0;
    if (selectedAction === "use" && trainingUi?.scope === "one" && !selectedStat) return false;
    if (!isTm) return canUseOnPokemon && selected.count > 0;
    const moveId = selectedTmMoveIdForSlot(slot);
    if (!moveId || alreadyKnows(slot)) return false;
    return Boolean(tmLegalBySlot[slot]?.some(move => toId(move.id || move.name) === moveId));
  }

  function targetText(slot: number): string {
    if (!selected) return "不可用";
    if (selectedAction === "equip") {
      const held = rest.player_display[slot]?.item_zh || rest.player_display[slot]?.item;
      return held ? `替换 ${held}` : "携带";
    }
    if (isTm) {
      if (tmLoading) return "读取中";
      if (alreadyKnows(slot)) return "已学会";
      return canUseOn(slot) ? "学习" : "不能学";
    }
    return "使用";
  }

  function targetDisabledReason(slot: number): string {
    if (!selected) return "不可用";
    if (locked) return selected.lock_reason || "不可使用";
    if (busySlot !== null) return busySlot === slot ? "处理中" : "等待";
    if (selected.count <= 0) return "没有库存";
    if (selectedAction === "use" && !canUseOnPokemon) return "不能对宝可梦使用";
    if (selectedAction === "equip" && !canEquipAsHeld) return "不能携带";
    if (selectedAction === "use" && trainingUi?.scope === "one" && !selectedStat) return "请选择能力项";
    if (isTm) {
      if (tmLoading) return "读取中";
      if (alreadyKnows(slot)) return "已学会";
      return canUseOn(slot) ? "" : "不能学";
    }
    return "";
  }

  function itemsFromRest(nextRest?: RestState | null): BagItemView[] {
    return nextRest ? Object.values(nextRest.bag_categories || {consumable: [], held: [], tm: []}).flat() : allItems;
  }

  function selectNextItemAfterUse(item: BagItemView, nextRest?: RestState | null) {
    const sourceItems = itemsFromRest(nextRest);
    const nextItems = sourceItems.filter(entry => entry.id !== item.id && bagFilterForItem(entry, filter) && entry.count > 0);
    setItemId(nextItems[0]?.id || "");
    setStep("detail");
  }

  async function applyTo(slot: number) {
    if (!selected || busySlot !== null || !canUseOn(slot)) return;
    if (isTm) {
      setSelectedTarget(slot);
      setSelectedMoveSlot(null);
      setStep("moveReplace");
      return;
    }
    if (selectedAction === "use" && needsPpMove) {
      setSelectedTarget(slot);
      setStep("ppMovePicker");
      return;
    }
    setBusySlot(slot);
    try {
      const result = selectedAction === "equip"
        ? await Promise.resolve(onAction({type: "equip_item", itemId: selected.id, slot}, "道具已携带"))
        : await Promise.resolve(onAction({type: "use_item", itemId: selected.id, slot, stat: trainingUi?.scope === "one" ? selectedStat : undefined, context: "rest"}, "道具已使用"));
      if (result !== false) {
        const nextRest = isDesktopGameStateResult(result) ? result.rest : null;
        const nextItem = itemsFromRest(nextRest).find(entry => entry.id === selected.id);
        if (selectedAction === "equip") setStep("detail");
        else if ((nextItem?.count ?? selected.count - 1) <= 0) selectNextItemAfterUse(selected, nextRest);
        else setStep("pokemonPicker");
      }
    } finally {
      setBusySlot(null);
    }
  }

  async function confirmPpMove(moveSlot: number) {
    if (!selected || busySlot !== null || selectedAction !== "use" || !needsPpMove) return;
    setBusySlot(selectedTarget);
    try {
      const result = await Promise.resolve(onAction({type: "use_item", itemId: selected.id, slot: selectedTarget, moveSlot, context: "rest"}, "PP 已恢复"));
      if (result !== false) {
        const nextRest = isDesktopGameStateResult(result) ? result.rest : null;
        const nextItem = itemsFromRest(nextRest).find(entry => entry.id === selected.id);
        if ((nextItem?.count ?? selected.count - 1) <= 0) selectNextItemAfterUse(selected, nextRest);
        else setStep("pokemonPicker");
      }
    } finally {
      setBusySlot(null);
    }
  }

  async function applyDirect() {
    if (!selected || busySlot !== null) return;
    setBusySlot(-1);
    try {
      const result = await Promise.resolve(onAction({type: "use_item", itemId: selected.id, slot: 0, context: "rest"}, "道具已使用"));
      if (result !== false) {
        const nextRest = isDesktopGameStateResult(result) ? result.rest : null;
        const nextItem = itemsFromRest(nextRest).find(entry => entry.id === selected.id);
        (nextItem?.count ?? selected.count - 1) <= 0 ? selectNextItemAfterUse(selected, nextRest) : setStep("detail");
      }
    } finally {
      setBusySlot(null);
    }
  }

  async function confirmTmReplace() {
    const moveId = selectedTmMoveIdForSlot(selectedTarget);
    if (!selected || busySlot !== null || selectedMoveSlot === null || !moveId) return;
    setBusySlot(selectedTarget);
    try {
      const result = await Promise.resolve(onAction({type: "use_tm", itemId: selected.id, slot: selectedTarget, moveSlot: selectedMoveSlot}, "技能机器已使用"));
      if (result !== false) {
        const nextRest = isDesktopGameStateResult(result) ? result.rest : null;
        const nextItem = nextRest ? Object.values(nextRest.bag_categories || {consumable: [], held: [], tm: []}).flat().find(entry => entry.id === selected.id) : null;
        if ((nextItem?.count ?? selected.count - 1) <= 0) selectNextItemAfterUse(selected, nextRest);
        else setStep("detail");
      }
    } finally {
      setBusySlot(null);
    }
  }

  const targetPokemon = rest.player_display[selectedTarget] || rest.player_display[0];
  const targetState = rest.player_state[selectedTarget];
  const team = rest.player_display.map((pokemon, index) => ({
    pokemon,
    condition: rest.player_state[index]?.condition,
    status: rest.player_state[index]?.status,
    heldItem: pokemon.item_zh || pokemon.item || "无道具",
    disabled: !canUseOn(index),
    disabledReason: targetDisabledReason(index),
  }));
  const detailDisabled = !selected || locked || busySlot !== null || selected.count <= 0 || (selectedAction === "use" && trainingUi?.scope === "one" && !selectedStat);
  const lockedReason = selected && locked ? selected.lock_reason || "这是规则提供的特殊道具，只能查看，不能使用、丢弃或交换。" : selected ? REST_SHOP_DISCOUNT_COUPONS[toId(selected.id)]?.desc_zh : undefined;
  const detailUseLabel = selected?.category === "tm" ? "立即使用" : selectedAction === "equip" ? "携带" : canUseOnPokemon ? "对宝可梦使用" : "使用";
  const detailActions: BagDetailAction[] = [];
  if (selected && isTm) detailActions.push({key: "tm", label: "立即使用", disabled: detailDisabled, disabledReason: lockedReason, onUse: () => { setSelectedAction("tm"); setStep("pokemonPicker"); }});
  if (selected && !isTm && canUseOnPokemon) detailActions.push({key: "use", label: REST_SHOP_DISCOUNT_COUPONS[toId(selected.id)] ? "使用" : "对宝可梦使用", disabled: detailDisabled, disabledReason: lockedReason, onUse: () => { setSelectedAction("use"); REST_SHOP_DISCOUNT_COUPONS[toId(selected.id)] ? void applyDirect() : setStep("pokemonPicker"); }});
  if (selected && !isTm && canEquipAsHeld) detailActions.push({key: "equip", label: "携带", disabled: locked || busySlot !== null || selected.count <= 0, disabledReason: lockedReason, onUse: () => { setSelectedAction("equip"); setStep("pokemonPicker"); }});
  const targetTitle = isTm ? "选择学习者" : selectedAction === "equip" ? "点击宝可梦携带/替换" : needsPpMove ? "选择宝可梦后选择技能" : "点击宝可梦直接使用";
  const displayMove = selected ? tmMove || tmFallbackMove(selected) : undefined;

  return (
    <section className="rest-bag-tool-panel">
      <aside className="rest-bag-left">
        <BagFilterTabs activeKey={filter} counts={counts} disabled={busySlot !== null} onSelect={key => { setFilter(key); setStep("detail"); }} />
        <BagItemList items={items} selectedId={selected?.id} disabled={busySlot !== null} onSelect={id => { setItemId(id); setStep("detail"); }} />
      </aside>
      <BagActionPanel
        step={step}
        item={selected}
        targetTeam={team}
        targetTitle={targetTitle}
        selectedTarget={selectedTarget}
        busyIndex={busySlot}
        statOptions={statOptions}
        selectedStat={selectedStat}
        trainingUi={trainingUi}
        lockedReason={lockedReason}
        detailDisabled={detailDisabled}
        detailUseLabel={detailUseLabel}
        detailActions={detailActions}
        targetPokemon={targetPokemon}
        targetState={targetState}
        tmMoveLoading={tmMoveLoading}
        displayMove={displayMove}
        selectedMoveSlot={selectedMoveSlot}
        onUseDetail={() => void (selected && REST_SHOP_DISCOUNT_COUPONS[toId(selected.id)] ? applyDirect() : setStep("pokemonPicker"))}
        onBackToDetail={() => setStep("detail")}
        onSelectTarget={slot => { setSelectedTarget(slot); void applyTo(slot); }}
        onSelectStat={setSelectedStat}
        onSelectMoveSlot={setSelectedMoveSlot}
        onConfirmMoveReplace={() => void confirmTmReplace()}
        onCancelMoveReplace={() => setStep("pokemonPicker")}
        onConfirmPpMove={slot => void confirmPpMove(slot)}
      />
    </section>
  );
}
