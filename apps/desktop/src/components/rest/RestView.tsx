import {useEffect, useRef, useState} from "react";
import type {CSSProperties, ReactElement} from "react";
import type {BagItemView, CoinLedgerEntry, DesktopGameState, PricedMove, RentalPokemon, RestAction, RestEventStatusView, ShopKind, ShopOffer, TalentView} from "@changebattle/shared";
import {AnimatePresence, motion, Reorder} from "motion/react";
import {DraggableFloatingButton} from "../feedback/DraggableFloatingButton";
import {ScreenToast} from "../feedback/ScreenToast";
import {PokopiaModal, pokopiaItemVariants} from "../motion/PokopiaModal";
import {MoveCard, MoveCardContent, moveCardClassName} from "../move/MoveCard";
import {MoveReplacePanel} from "../bag/MoveReplacePanel";
import {RestBagPanel} from "../bag/RestBagPanel";
import {ItemIcon, PokemonSprite, abilityDescription, coinCostLabel, conditionText, displayName, hpTone, itemCategoryLabel, moveDescription, parseHp, runtimeMoveLabel, statLine, statMarker, statusCode, statusLabel, talentShortText, toId, trainerImageUrl, typeId, userFacingError} from "../../lib/ui";
import {STAT_ROWS} from "../../lib/ui";
import {RestHeader} from "./RestHeader";
import {RestMainPanelHost} from "./RestMainPanelHost";
import {RestToolBar, type RestToolItem} from "./RestToolBar";
import {RestMyTeamPanel} from "./team/RestMyTeamPanel";
import "./RestView.css";

export function ExchangeView({exchange, onSkip, onExchange}: {exchange: DesktopGameState["exchange"]; onSkip: () => void; onExchange: (ownIndex: number, enemyIndex: number) => void}) {
  const [own, setOwn] = useState(0);
  const [enemy, setEnemy] = useState(0);
  if (!exchange) return null;
  return <div className="exchange-page"><h2>胜利后交换</h2><div className="exchange-columns exchange-columns-with-label"><div><h3>你的队伍</h3>{exchange.player_display.map((pokemon, index) => <button className={`exchange-card ${own === index ? "selected" : ""}`} onClick={() => setOwn(index)} key={pokemon.species_id}><PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} /><span>{displayName(pokemon)}</span><small>{pokemon.item_zh || "无道具"}</small></button>)}</div><div className="exchange-center-label" aria-hidden="true"><span>交换</span></div><div><h3>敌方队伍</h3>{exchange.enemy_display.map((pokemon, index) => <button className={`exchange-card ${enemy === index ? "selected" : ""}`} onClick={() => setEnemy(index)} key={pokemon.species_id}><PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} /><span>{displayName(pokemon)}</span><small>{pokemon.item_zh || "无道具"}</small></button>)}</div></div><div className="command-row"><button onClick={() => onExchange(own, enemy)}>交换</button><button onClick={onSkip}>跳过</button></div></div>;
}

type RestActionResult = DesktopGameState | boolean | void;
type RestActionHandler = (action: RestAction, successMessage?: string) => RestActionResult | Promise<RestActionResult>;

function isDesktopGameStateResult(result: RestActionResult): result is DesktopGameState {
  return Boolean(result && typeof result === "object" && "screen" in result);
}

function restActionResultMessage(result: RestActionResult): string | undefined {
  return isDesktopGameStateResult(result) ? result.toast_message || result.message : undefined;
}

function errorMessage(error: unknown): string {
  return userFacingError(error) || "操作失败。";
}

export function RestView({rest, onAction}: {rest: DesktopGameState["rest"]; onAction: RestActionHandler}) {
  const [pokemonModalSlot, setPokemonModalSlot] = useState<number | null>(null);
  const [activePanel, setActivePanel] = useState<RestWorkspacePanel>(() => new URLSearchParams(location.search).get("scenario") === "rest-shop" ? "shop" : "myTeam");
  const [moveEditorSlot, setMoveEditorSlot] = useState<number | null>(null);
  const [moveEditorMoveSlot, setMoveEditorMoveSlot] = useState(0);
  const [statsEditorSlot, setStatsEditorSlot] = useState<number | null>(null);
  const [bagTargetSlot, setBagTargetSlot] = useState(0);
  const [talentActionId, setTalentActionId] = useState<string | null>(null);
  const [abortConfirmOpen, setAbortConfirmOpen] = useState(false);
  const [eventPanelOpen, setEventPanelOpen] = useState(false);
  const [coinLedgerOpen, setCoinLedgerOpen] = useState(false);
  const [toast, setToast] = useState<{id: number; message: string; tone?: "normal" | "danger"} | null>(null);
  const restToastStyle = {
    "--screen-toast-left": "14px",
    "--screen-toast-min-width": "156px",
    "--screen-toast-max-width": "260px",
    "--screen-toast-border-width": "2px",
    "--screen-toast-border-radius": "4px",
    "--screen-toast-background": "rgb(31 27 29 / 82%)",
    "--screen-toast-padding-y": "6px",
    "--screen-toast-padding-x": "9px",
    "--screen-toast-font-size": "9px",
    "--screen-toast-line-height": "1.28",
  } as CSSProperties;

  if (!rest) return <div className="loading-panel"><strong>正在整理队伍...</strong></div>;
  const nightSkyRows = rest.night_sky?.rows || [];
  const revealedSkyCount = nightSkyRows.reduce((sum, row) => sum + Math.min(3, Number(row.revealed || 0)), 0);
  const manualTalents = (rest.talents || []).filter(talent => isManualRunTalent(talent.id));
  const activeTalentAction = manualTalents.find(talent => talent.id === talentActionId) || null;
  const showToast = (message: string, tone: "normal" | "danger" = "normal") => {
    setToast({id: Date.now(), message, tone});
  };
  const successMessageForAction = (action: RestAction): string | undefined => {
    if (action.type === "exchange" || action.type === "all_in_exchange") return "宝可梦已交换";
    if (action.type === "randomize_all_stats" || action.type === "randomize_stat_part") return "数值已重置";
    if (action.type === "adjust_stats") return "数值已保存";
    if (action.type === "apply_drawn_move") return "技能已更换";
    return undefined;
  };
  const runRestAction = async (action: RestAction, successMessage = successMessageForAction(action)) => {
    try {
      const result = await Promise.resolve(onAction(action));
      if (result !== false && action.type !== "next" && action.type !== "abort") showToast(restActionResultMessage(result) || successMessage || "操作完成。");
      return result;
    } catch (error) {
      showToast(errorMessage(error));
      return false;
    }
  };
  const fireAction = (action: RestAction) => {
    void runRestAction(action);
  };
  const workspaceKey = activePanel === "pokemon" ? `pokemon-${pokemonModalSlot ?? 0}` : activePanel === "bag" ? `bag-${bagTargetSlot}` : activePanel === "statsEditor" ? `stats-${statsEditorSlot ?? 0}` : activePanel === "talentAction" ? `talent-${talentActionId || "none"}` : activePanel || "empty";
  const shouldPromptRestEvent = Boolean(rest.rest_event?.required && rest.rest_event.options.length);
  const shouldPromptNamedChallenge = !shouldPromptRestEvent && hasRunTalent(rest, "intel_named_challenge") && Number(rest.battle_no || 0) <= 0 && !rest.named_challenge_decided;
  const shouldPromptRainbowRocket = Boolean(rest.rainbow_rocket_support && !rest.rainbow_rocket_support.completed);
  const toolItems: RestToolItem[] = [
    {id: "myTeam", label: "我的队伍"},
    {id: "bag", label: "背包"},
    {id: "exchange", label: "交换"},
    {id: "shop", label: "商店"},
    {id: "forge", label: "熔炉"},
    ...(rest.recycler_available ? [{id: "recycler", label: "道具回收商", event: true}] : []),
    ...(rest.event_services?.doctor ? [{id: "eventDoctor", label: "蹩脚医生", event: true}] : []),
    ...(rest.event_services?.tutor ? [{id: "eventTutor", label: "讲师老奶奶", event: true}] : []),
    ...(rest.event_services?.egg ? [{id: "eventEgg", label: "培育屋爷爷", event: true}] : []),
    ...(rest.event_services?.raid_exchange ? [{id: "raidExchange", label: "骇人奇袭", event: true}] : []),
    ...(rest.event_services?.score_bet ? [{id: "scoreBet", label: "重金下注", event: true}] : []),
    ...(Number(rest.event_services?.level_points || 0) > 0 ? [{id: "eventLevel", label: "分配等级", badge: rest.event_services?.level_points, event: true}] : []),
    {id: "nightSky", label: "进度图", badge: `${revealedSkyCount}/${(nightSkyRows.length || rest.battles) * 3}`},
    ...manualTalents.map(talent => ({id: `talent:${talent.id}`, label: talent.name, used: runTalentActionUsed(rest, talent.id), badge: runTalentActionUsed(rest, talent.id) ? "已用" : undefined})),
  ];
  const activeToolId = activePanel === "talentAction" && talentActionId ? `talent:${talentActionId}` : activePanel === "nightSky" && talentActionId === "intel_reroute" ? "talent:intel_reroute" : activePanel;

  function openManualTalent(talent: TalentView) {
    if (runTalentActionUsed(rest as NonNullable<DesktopGameState["rest"]>, talent.id)) return;
    setTalentActionId(talent.id);
    setActivePanel(talent.id === "intel_reroute" ? "nightSky" : "talentAction");
  }

  function selectTool(id: string) {
    if (id === "bag") setBagTargetSlot(0);
    if (id.startsWith("talent:")) {
      const talent = manualTalents.find(entry => entry.id === id.slice("talent:".length));
      if (talent) openManualTalent(talent);
      return;
    }
    setTalentActionId(null);
    setActivePanel(id as RestWorkspacePanel);
  }

  function unequipItem(slot: number) {
    const itemName = rest?.player_display[slot]?.item_zh || "道具";
    void runRestAction({type: "unequip_item", slot}, `${itemName} 已放回背包`).then(ok => {
      if (ok === false) return;
    });
  }

  return (
    <div className="rest-page">
      <RestHeader battleNo={rest.battle_no} battles={rest.battles} wins={rest.wins} coins={rest.coins ?? 0} nextDisabled={shouldPromptRainbowRocket} nextTitle={shouldPromptRainbowRocket ? "请先处理彩虹火箭队支援" : undefined} onOpenCoinLedger={() => setCoinLedgerOpen(true)} onAbort={() => setAbortConfirmOpen(true)} onNext={() => onAction({type: "next"})} />
      <RestToolBar items={toolItems} activeId={activeToolId} onSelect={selectTool} />
      {rest.rest_event_statuses?.length ? (
        <DraggableFloatingButton className="floating-rest-event-button" title="查看特殊事件" storageKey="changebattle:floating:rest-events" onClick={() => setEventPanelOpen(true)}>
          <span>事件</span>
          <b>{rest.rest_event_statuses.length}</b>
        </DraggableFloatingButton>
      ) : null}
      <RestMainPanelHost>
        <AnimatePresence mode="wait">
          <motion.div className="rest-workspace-panel" initial={{opacity: 0, y: 12, scale: 0.985}} animate={{opacity: 1, y: 0, scale: 1}} exit={{opacity: 0, y: -10, scale: 0.985}} transition={{duration: 0.22, ease: [0.2, 0.8, 0.2, 1]}} key={workspaceKey}>
            {!activePanel ? <div className="rest-workspace-empty" /> : null}
            {activePanel === "myTeam" ? <RestMyTeamPanel rest={rest} selectedSlot={pokemonModalSlot ?? 0} onSelectSlot={setPokemonModalSlot} onMove={(slot, moveSlot) => { setMoveEditorSlot(slot); setMoveEditorMoveSlot(moveSlot ?? 0); }} onUseItem={slot => { setBagTargetSlot(slot); setActivePanel("bag"); }} onUnequip={unequipItem} onStats={slot => { setStatsEditorSlot(slot); setActivePanel("statsEditor"); }} onAction={fireAction} /> : null}
            {activePanel === "exchange" ? <RestExchangeModal embedded rest={rest} onClose={() => setActivePanel(null)} onAction={fireAction} /> : null}
            {activePanel === "bag" ? <RestBagPanel rest={rest} initialTarget={bagTargetSlot} onAction={runRestAction} /> : null}
            {activePanel === "recycler" ? <ItemRecyclerModal embedded rest={rest} onClose={() => setActivePanel(null)} onAction={fireAction} /> : null}
            {activePanel === "eventDoctor" ? <DoctorEventPanel embedded rest={rest} onClose={() => setActivePanel(null)} onAction={runRestAction} /> : null}
            {activePanel === "eventTutor" ? <EventMoveServicePanel embedded rest={rest} service="tutor" onClose={() => setActivePanel(null)} onAction={runRestAction} /> : null}
            {activePanel === "eventEgg" ? <EventMoveServicePanel embedded rest={rest} service="egg" onClose={() => setActivePanel(null)} onAction={runRestAction} /> : null}
            {activePanel === "raidExchange" ? <RaidExchangePanel embedded rest={rest} onClose={() => setActivePanel(null)} onAction={runRestAction} /> : null}
            {activePanel === "scoreBet" ? <ScoreBetPanel embedded rest={rest} onClose={() => setActivePanel(null)} onAction={runRestAction} /> : null}
            {activePanel === "eventLevel" ? <EventLevelPanel embedded rest={rest} onClose={() => setActivePanel(null)} onAction={runRestAction} /> : null}
            {activePanel === "talentAction" && activeTalentAction ? <RunTalentActionModal embedded talent={activeTalentAction} rest={rest} onClose={() => setActivePanel(null)} onAction={fireAction} /> : null}
            {activePanel === "nightSky" ? <NightSkyModal embedded rest={rest} onClose={() => setActivePanel(null)} onAction={fireAction} /> : null}
            {activePanel === "shop" ? <ShopModal embedded rest={rest} shop={rest.shop} onClose={() => setActivePanel(null)} onRoll={shopKind => runRestAction({type: "roll_shop", shopKind})} onBuy={offerId => runRestAction({type: "buy_shop_offer", offerId}, "道具已购买")} onBarterBuy={(offerId, itemIds) => runRestAction({type: "event_barter_buy", offerId, itemIds}, "道具已交换")} /> : null}
            {activePanel === "forge" ? <ForgeModal embedded rest={rest} onClose={() => setActivePanel(null)} onAction={runRestAction} onNotice={showToast} /> : null}
            {activePanel === "pokemon" && pokemonModalSlot !== null ? <RestPokemonModal embedded rest={rest} initialSlot={pokemonModalSlot} onClose={() => setActivePanel(null)} onMove={(slot, moveSlot) => { setMoveEditorSlot(slot); setMoveEditorMoveSlot(moveSlot ?? 0); }} onUseItem={slot => { setPokemonModalSlot(null); setBagTargetSlot(slot); setActivePanel("bag"); }} onUnequip={unequipItem} onStats={slot => { setPokemonModalSlot(null); setStatsEditorSlot(slot); setActivePanel("statsEditor"); }} onAction={fireAction} /> : null}
            {activePanel === "statsEditor" && statsEditorSlot !== null ? <StatsAdjustModal embedded rest={rest} initialSlot={statsEditorSlot} onClose={() => setActivePanel(null)} onAction={fireAction} /> : null}
          </motion.div>
        </AnimatePresence>
      </RestMainPanelHost>
      {abortConfirmOpen ? (
        <div className="modal-layer">
          <section className="confirm-modal">
            <h2>中断挑战</h2>
            <p>确认后将直接结束本局挑战，并中断当前连胜。历史最高连胜仍会保留。</p>
            <div className="command-row">
              <button className="danger-button" onClick={() => { setAbortConfirmOpen(false); onAction({type: "abort"}); }}>确认中断</button>
              <button onClick={() => setAbortConfirmOpen(false)}>取消</button>
            </div>
          </section>
        </div>
      ) : null}
      {rest.all_in_pending_next ? (
        <div className="modal-layer">
          <section className="confirm-modal all-in-result-modal">
            <h2>孤注一掷</h2>
            <p>{rest.all_in_result ? `${rest.all_in_result.old_name} 被替换成了 ${rest.all_in_result.new_name}。` : "替换已经完成。"}</p>
            <p>队伍内另外两只宝可梦已陷入半血睡眠状态，即将结束休整。</p>
            <div className="command-row">
              <button onClick={() => onAction({type: "next"})}>进入下一场</button>
            </div>
          </section>
        </div>
      ) : null}
      {toast ? <ScreenToast key={toast.id} message={toast.message} tone={toast.tone} durationMs={2600} style={restToastStyle} onDone={() => setToast(null)} /> : null}
      {moveEditorSlot !== null ? <MoveAdjustModal rest={rest} initialSlot={moveEditorSlot} initialMoveSlot={moveEditorMoveSlot} onClose={() => setMoveEditorSlot(null)} onAction={runRestAction} /> : null}
      {coinLedgerOpen ? <CoinLedgerModal entries={rest.coin_ledger || []} onClose={() => setCoinLedgerOpen(false)} /> : null}
      {eventPanelOpen && rest.rest_event_statuses?.length ? <RestEventInfoPanel statuses={rest.rest_event_statuses} onClose={() => setEventPanelOpen(false)} /> : null}
      {shouldPromptRainbowRocket && rest.rainbow_rocket_support ? <RainbowRocketSupportPrompt rest={rest} onAction={runRestAction} /> : null}
      {shouldPromptRestEvent ? <RestEventPrompt rest={rest} onAction={runRestAction} /> : null}
      {shouldPromptNamedChallenge ? <NamedChallengePrompt rest={rest} onAction={runRestAction} /> : null}
    </div>
  );
}

type RestWorkspacePanel = "myTeam" | "exchange" | "bag" | "recycler" | "eventDoctor" | "eventTutor" | "eventEgg" | "raidExchange" | "scoreBet" | "eventLevel" | "talentAction" | "nightSky" | "shop" | "forge" | "pokemon" | "moveEditor" | "statsEditor" | null;

function EmbeddedOrModal({embedded, children}: {embedded?: boolean; children: ReactElement}) {
  return embedded ? children : <div className="modal-layer">{children}</div>;
}

function CoinLedgerModal({entries, onClose}: {entries: CoinLedgerEntry[]; onClose: () => void}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const formatTime = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString("zh-CN", {month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"});
  };

  return (
    <div className="modal-layer" role="presentation" onClick={onClose}>
      <section className="coin-ledger-modal" role="dialog" aria-modal="true" aria-labelledby="coin-ledger-title" onClick={event => event.stopPropagation()}>
        <header>
          <h2 id="coin-ledger-title">金币流水</h2>
          <button onClick={onClose}>关闭</button>
        </header>
        {entries.length ? (
          <div className="coin-ledger-list">
            {entries.map(entry => (
              <article className={`coin-ledger-entry ${entry.type}`} key={entry.id}>
                <span>{formatTime(entry.at)}</span>
                <strong>{entry.label || entry.reason}</strong>
                <b>{entry.type === "gain" ? "+" : "-"}{entry.amount}</b>
                <small>{entry.before}{" -> "}{entry.after}</small>
              </article>
            ))}
          </div>
        ) : (
          <p className="coin-ledger-empty">本局还没有金币变化记录。</p>
        )}
      </section>
    </div>
  );
}

function RestEventInfoPanel({statuses, onClose}: {statuses: RestEventStatusView[]; onClose: () => void}) {
  const [selectedId, setSelectedId] = useState(statuses[0]?.id || "");
  const selected = statuses.find(status => status.id === selectedId) || statuses[0];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!selected) return null;

  return (
    <div className="modal-layer rest-event-info-layer" role="presentation" onClick={onClose}>
      <section className={`rest-event-info-modal tone-${selected.tone || "safe"}`} role="dialog" aria-modal="true" aria-labelledby="rest-event-info-title" onClick={event => event.stopPropagation()}>
        <header>
          <div>
            <span>休整事件</span>
            <h2 id="rest-event-info-title">特殊事件</h2>
          </div>
          <button onClick={onClose}>关闭</button>
        </header>
        <div className="rest-event-info-body">
          <nav aria-label="特殊事件列表">
            {statuses.map(status => (
              <button className={`tone-${status.tone || "safe"} ${status.id === selected.id ? "selected" : ""}`} onClick={() => setSelectedId(status.id)} key={status.id}>
                <strong>{status.label}</strong>
                {status.detail ? <small>{status.detail}</small> : null}
              </button>
            ))}
          </nav>
          <article>
            <span className={`rest-event-info-tone tone-${selected.tone || "safe"}`}>{selected.tone === "risk" ? "风险" : selected.tone === "trade" ? "交易" : "增益"}</span>
            <h3>{selected.label}</h3>
            <p>{selected.detail || "这个事件已经生效，当前没有额外说明。"}</p>
          </article>
        </div>
      </section>
    </div>
  );
}

function RainbowRocketSupportPrompt({rest, onAction}: {rest: NonNullable<DesktopGameState["rest"]>; onAction: RestActionHandler}) {
  const support = rest.rainbow_rocket_support;
  const [selected, setSelected] = useState<{source: "factory" | "route"; index: number} | null>(null);
  const [target, setTarget] = useState<number | null>(null);
  const [restoreSlots, setRestoreSlots] = useState<number[]>([]);
  const [teamMode, setTeamMode] = useState<"replace" | "restore">("replace");
  const [busy, setBusy] = useState(false);
  if (!support) return null;
  const teamFull = rest.player_display.length >= support.max_team_size;
  const canComplete = support.invasion ? rest.player_display.length >= support.max_team_size : support.picks_used >= support.picks_required;
  const selectedPokemon = selected ? selected.source === "route" ? support.route_display[selected.index] : support.factory_display[selected.index] : null;
  const pickedText = `${support.picks_used}/${support.picks_required}`;

  async function chooseSupport() {
    if (!selected || !selectedPokemon || busy) return;
    setBusy(true);
    try {
      await Promise.resolve(onAction({type: "rainbow_rocket_support", source: selected.source, candidateIndex: selected.index, targetIndex: teamFull ? target : null}, "彩虹火箭队支援已加入"));
      setSelected(null);
      setTarget(null);
    } finally {
      setBusy(false);
    }
  }

  async function finishSupport() {
    if (busy || !canComplete) return;
    setBusy(true);
    try {
      await Promise.resolve(onAction({type: "rainbow_rocket_support_done"}, "彩虹火箭队支援已确认"));
    } finally {
      setBusy(false);
    }
  }

  async function restoreTeam() {
    if (busy || !restoreSlots.length) return;
    setBusy(true);
    try {
      await Promise.resolve(onAction({type: "rainbow_rocket_restore", slots: restoreSlots}, "工厂治疗完成"));
      setRestoreSlots([]);
    } finally {
      setBusy(false);
    }
  }

  function toggleRestore(slot: number) {
    setRestoreSlots(current => current.includes(slot) ? current.filter(value => value !== slot) : current.length >= 2 ? current : [...current, slot]);
  }

  const candidateGrid = (title: string, source: "factory" | "route", list: RentalPokemon[]) => (
    <section className="rainbow-support-column">
      <h3>{title}</h3>
      <div className="rainbow-support-grid">
        {list.length ? list.map((pokemon, index) => (
          <button className={`mini-pokemon-card ${selected?.source === source && selected.index === index ? "selected" : ""}`} disabled={busy} onClick={() => setSelected({source, index})} key={`${source}-${pokemon.species_id}-${index}`}>
            <PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} />
            <span>{displayName(pokemon)}</span>
            <small>{pokemon.item_zh || "无道具"}</small>
          </button>
        )) : <p className="rainbow-support-empty">暂无候选</p>}
      </div>
    </section>
  );

  return (
    <PokopiaModal className="rainbow-support-modal" closeDisabled labelledBy="rainbow-support-title" onClose={() => undefined}>
      {() => (
        <motion.section className="rainbow-support-content" variants={pokopiaItemVariants}>
          <header>
            <div>
              {support.invasion ? <strong className="rainbow-warning">WARNING / WARNING</strong> : <strong className="rainbow-warning compact">RAINBOW ROCKET</strong>}
              <h2 id="rainbow-support-title">彩虹火箭队入侵</h2>
              <p>{support.invasion ? "赛程已被劫持。工厂临时开放支援，必须把队伍补到 6 只后才能迎战。" : "下一名头目正在接近。选择一次工厂或原赛程支援，再进入下一场。"}</p>
            </div>
            <div className="rainbow-support-progress">
              <span>队伍 {rest.player_display.length}/{support.max_team_size}</span>
              <span>支援 {pickedText}</span>
            </div>
          </header>
          <div className="rainbow-support-main">
            <section className="rainbow-support-team">
              <h3>当前队伍</h3>
              <div className="rainbow-support-grid team">
                {rest.player_display.map((pokemon, index) => {
                  const state = rest.player_state[index];
                  const selectedTarget = target === index;
                  return (
                    <button className={`mini-pokemon-card ${selectedTarget ? "selected" : ""} ${restoreSlots.includes(index) ? "restore-selected" : ""}`} disabled={busy} onClick={() => teamFull && teamMode === "replace" ? setTarget(index) : toggleRestore(index)} key={`rainbow-team-${pokemon.species_id}-${index}`}>
                      <PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} />
                      <span>{index + 1}. {displayName(pokemon)}</span>
                      <small>{conditionText(state?.condition) || "状态正常"}</small>
                    </button>
                  );
                })}
              </div>
              <div className="rainbow-restore-row">
                {teamFull ? <button className={teamMode === "replace" ? "selected" : ""} disabled={busy} onClick={() => setTeamMode("replace")}>选择替换</button> : null}
                <button className={teamMode === "restore" ? "selected" : ""} disabled={busy} onClick={() => setTeamMode("restore")}>选择治疗</button>
                <button disabled={busy || !restoreSlots.length} onClick={() => void restoreTeam()}>工厂治疗 {restoreSlots.length}/2</button>
                <small>队伍未满时点击队员选择治疗；队伍已满时点击队员选择替换目标。</small>
              </div>
            </section>
            {candidateGrid("工厂支援候选", "factory", support.factory_display)}
            {candidateGrid(`${support.route_trainer?.name_zh || "原赛程对手"}支援`, "route", support.route_display)}
          </div>
          <footer className="command-row">
            <button disabled={busy || !selectedPokemon || (teamFull && target === null)} onClick={() => void chooseSupport()}>{teamFull ? "替换入队" : "加入队伍"}</button>
            <button disabled={busy || !canComplete} onClick={() => void finishSupport()}>{canComplete ? "确认支援" : support.invasion ? "队伍未满 6 只" : "尚未选择支援"}</button>
          </footer>
        </motion.section>
      )}
    </PokopiaModal>
  );
}

function RestEventPrompt({rest, onAction}: {rest: NonNullable<DesktopGameState["rest"]>; onAction: RestActionHandler}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const options = rest.rest_event?.options || [];

  async function choose(eventId: string, eventName: string) {
    if (busyId) return;
    setBusyId(eventId);
    try {
      await Promise.resolve(onAction({type: "choose_rest_event", eventId}, `奇遇：${eventName}`));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PokopiaModal className="rest-event-modal" closeDisabled labelledBy="rest-event-title" onClose={() => undefined}>
      {() => (
        <motion.section className="rest-event-content" variants={pokopiaItemVariants}>
          <header>
            <div>
              <h2 id="rest-event-title">休整奇遇</h2>
              <p>本次休整开始前，必须选择一张事件卡。</p>
            </div>
          </header>
          <div className="rest-event-card-grid">
            {options.map(option => (
              <button className={`rest-event-card tone-${option.tone || "safe"}`} disabled={Boolean(busyId)} onClick={() => void choose(option.id, option.name)} key={`rest-event-${option.id}`}>
                <strong>{option.name}</strong>
                <div className="rest-event-card-body">
                  <section>
                    <b>介绍：</b>
                    <p>{option.intro || option.desc}</p>
                  </section>
                  <section>
                    <b>效果：</b>
                    <ul>
                      {(option.effects?.length ? option.effects : [option.desc, option.detail].filter((value): value is string => Boolean(value))).map((effect, index) => <li key={`${option.id}-effect-${index}`}>{effect}</li>)}
                    </ul>
                  </section>
                </div>
              </button>
            ))}
          </div>
        </motion.section>
      )}
    </PokopiaModal>
  );
}

function NamedChallengePrompt({rest, onAction}: {rest: NonNullable<DesktopGameState["rest"]>; onAction: RestActionHandler}) {
  const [busy, setBusy] = useState(false);
  const champions = rest.champion_options || [];

  async function choose(trainerId: string | null) {
    if (busy) return;
    setBusy(true);
    try {
      const champion = trainerId ? champions.find(entry => entry.id === trainerId) : null;
      await Promise.resolve(onAction({type: "set_named_champion", trainerId}, trainerId ? `最终 Boss：${champion?.name_zh || "已指定"}` : "本局不发动指名挑战"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <PokopiaModal className="named-challenge-modal" closeDisabled labelledBy="named-challenge-title" onClose={() => undefined}>
      {() => (
        <motion.section className="named-challenge-content" variants={pokopiaItemVariants}>
          <header>
            <div>
              <h2 id="named-challenge-title">指名挑战</h2>
              <p>第一场前选择本局最终 Boss，或本局不发动。</p>
            </div>
          </header>
          <div className="named-champion-grid">
            {champions.map(champion => {
              const image = trainerImageUrl(champion, "avatar") || trainerImageUrl(champion, "front");
              return (
                <button disabled={busy} onClick={() => void choose(champion.id)} key={`named-champion-${champion.id}`}>
                  {image ? <img src={image} alt="" /> : <span>?</span>}
                  <strong>{champion.name_zh}</strong>
                </button>
              );
            })}
          </div>
          <footer>
            <button disabled={busy} onClick={() => void choose(null)}>不发动</button>
          </footer>
        </motion.section>
      )}
    </PokopiaModal>
  );
}

function hasRunTalent(rest: NonNullable<DesktopGameState["rest"]>, id: string): boolean {
  return runTalentLevel(rest, id) > 0;
}

function runTalentLevel(rest: NonNullable<DesktopGameState["rest"]>, id: string): number {
  const talent = rest.talents?.find(entry => entry.id === id);
  return talent ? Math.max(1, Math.floor(Number(talent.level || 1))) : 0;
}

function isActiveRunTalent(id: string): boolean {
  return ["growth_all_in", "intel_rumor", "intel_reroute", "exchange_trust", "growth_lead_change", "economy_bp_exchange", "economy_recycle_receipt", "economy_portfolio", "economy_bargainer"].includes(id);
}

function isManualRunTalent(id: string): boolean {
  return ["growth_all_in", "intel_reroute", "exchange_trust", "growth_lead_change", "economy_bp_exchange"].includes(id);
}

function runTalentActionUsed(rest: NonNullable<DesktopGameState["rest"]>, id: string): boolean {
  if (id === "growth_all_in") return Boolean(rest.all_in_used || rest.all_in_pending_next);
  if (id === "exchange_trust") return Boolean(rest.trust_level_used);
  if (id === "growth_lead_change") return Boolean(rest.lead_change_used);
  if (id === "intel_reroute") return Number(rest.reroute_used || 0) >= Number(rest.reroute_limit || 3);
  return false;
}

function RestPokemonModal({rest, initialSlot, onClose, onMove, onUseItem, onUnequip, onStats, onAction, embedded = false}: {rest: NonNullable<DesktopGameState["rest"]>; initialSlot: number; onClose: () => void; onMove: (slot: number, moveSlot?: number) => void; onUseItem?: (slot: number) => void; onUnequip: (slot: number) => void; onStats: (slot: number) => void; onAction?: RestActionHandler; embedded?: boolean}) {
  const [slot, setSlot] = useState(initialSlot);
  const [tab, setTab] = useState<"info" | "moves" | "stats">("info");
  const [sheetFocus, setSheetFocus] = useState<{type: "nature" | "ability" | "item" | "move"; moveIndex?: number}>({type: "ability"});
  const pokemon = rest.player_display[slot] || rest.player_display[0];
  const state = rest.player_state[slot] || rest.player_state[0];
  const revealTraining = hasRunTalent(rest, "intel_god_eye");
  const hp = parseHp(state?.condition);
  const hpWidth = hp && hp.max > 0 ? Math.max(0, Math.min(100, (hp.current / hp.max) * 100)) : 0;
  useEffect(() => {
    setSheetFocus({type: "ability"});
  }, [slot]);
  if (!pokemon) return null;
  const focusedMove = sheetFocus.type === "move" ? pokemon.moves[sheetFocus.moveIndex ?? 0] : null;
  const sheetInfoTitle = focusedMove ? (focusedMove.name_zh || focusedMove.name) : sheetFocus.type === "item" ? (pokemon.item_zh || "无道具") : sheetFocus.type === "nature" ? (pokemon.nature_zh || pokemon.nature || "性格") : (pokemon.ability_zh || pokemon.ability || "特性");
  const sheetInfoBody = focusedMove ? moveDescription(focusedMove) : sheetFocus.type === "item" ? (pokemon.item_desc_zh || pokemon.item_desc || "当前没有携带道具。") : sheetFocus.type === "nature" ? "性格会影响能力倾向。可以在中间面板使用随机功能重新抽取。" : abilityDescription(pokemon);
  return (
    <EmbeddedOrModal embedded={embedded}>
      <section className={`rest-pokemon-modal ${embedded ? "embedded-single" : ""}`}>
        {!embedded ? <aside className="detail-team-list">
          {rest.player_display.map((entry, index) => <button className={slot === index ? "selected" : ""} onClick={() => setSlot(index)} key={`${entry.species_id}-rest-detail`}><PokemonSprite pokemon={entry} alt={displayName(entry)} /><span>{displayName(entry)}</span><small>{conditionText(rest.player_state[index]?.condition)}</small></button>)}
        </aside> : null}
        <main className="rest-pokemon-detail">
          {!embedded ? <header>
            <div className="rest-pokemon-title">
              <div><h2>{displayName(pokemon)}{pokemon.shiny ? <span className="shiny-name-tag">闪光</span> : null}</h2><p>Lv{pokemon.level}　{pokemon.types_zh?.join(" / ") || pokemon.types.join(" / ")}　{pokemon.item_zh || "无道具"}</p></div>
            </div>
            <div className="rest-pokemon-actions">
              <button onClick={() => onMove(slot)}>技能随机</button>
              {onUseItem ? <button onClick={() => onUseItem(slot)}>使用道具</button> : null}
              {pokemon.item_id ? <button onClick={() => onUnequip(slot)}>卸下道具</button> : null}
              <button onClick={() => onStats(slot)}>重置数值</button>
              <button onClick={onClose}>关闭</button>
            </div>
          </header> : null}
          {embedded ? <section className="rest-pokemon-sheet">
            <aside className="rest-sheet-profile">
              <div className="rest-sheet-identity">
                <PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} badge={false} />
                <div>
                  <h2>{displayName(pokemon)}{pokemon.shiny ? <span className="shiny-name-tag">闪光</span> : null}</h2>
                  <button className={sheetFocus.type === "nature" ? "selected" : ""} onClick={() => setSheetFocus({type: "nature"})}><span>性格</span><strong>{pokemon.nature_zh || pokemon.nature || "未知"}</strong></button>
                  <button className={sheetFocus.type === "ability" ? "selected" : ""} onClick={() => setSheetFocus({type: "ability"})}><span>特性</span><strong>{pokemon.ability_zh || pokemon.ability}</strong></button>
                  <button className={sheetFocus.type === "item" ? "selected" : ""} onClick={() => setSheetFocus({type: "item"})}><span>道具</span><strong>{pokemon.item_zh || "无"}</strong></button>
                </div>
              </div>
              <div className="rest-sheet-battle-block">
                <div className="rest-sheet-hp"><span>HP</span><strong>{hp?.text || conditionText(state?.condition)}</strong><i className={`hp-${hpTone(hp)}`} style={{width: `${hpWidth}%`} as CSSProperties} /></div>
                <div className="rest-sheet-moves">
                  {pokemon.moves.map((move, index) => (
                    <MoveCard
                      size="sheet"
                      className="rest-sheet-move-card"
                      selected={sheetFocus.type === "move" && sheetFocus.moveIndex === index}
                      name={runtimeMoveLabel(pokemon, state?.moves?.[index], index)}
                      moveType={move.type || move.type_zh}
                      typeLabel={move.type_zh || move.type || "一般"}
                      category={move.category_zh || move.category || "变化"}
                      pp={state?.moves?.[index]?.pp ?? move.pp}
                      maxPp={state?.moves?.[index]?.maxpp ?? move.pp}
                      onClick={() => setSheetFocus({type: "move", moveIndex: index})}
                      key={`${move.id}-sheet-${index}`}
                    />
                  ))}
                </div>
              </div>
            </aside>
            <section className="rest-sheet-stats">
              <div className="rest-sheet-reroll-grid">
                <button onClick={() => onAction?.({type: "randomize_all_stats", slot})}>全部随机 <strong>{coinCostLabel(rest.costs.randomize_all)}</strong></button>
                <button onClick={() => onAction?.({type: "randomize_stat_part", slot, part: "nature"})}>性格 <strong>{coinCostLabel(rest.costs.randomize_part)}</strong></button>
                <button onClick={() => onAction?.({type: "randomize_stat_part", slot, part: "ability"})}>特性 <strong>{coinCostLabel(rest.costs.randomize_part)}</strong></button>
                <button onClick={() => onAction?.({type: "randomize_stat_part", slot, part: "ivs"})}>个体 <strong>{coinCostLabel(rest.costs.randomize_part)}</strong></button>
                <button onClick={() => onAction?.({type: "randomize_stat_part", slot, part: "evs"})}>努力 <strong>{coinCostLabel(rest.costs.randomize_part)}</strong></button>
              </div>
              <div className="detail-stat-list rest-sheet-stat-list">{STAT_ROWS.map(([stat, label]) => <p key={stat}><span>{label}</span><strong>{statLine(pokemon, stat, revealTraining)}</strong></p>)}</div>
            </section>
            <section className="rest-sheet-description">
              {sheetFocus.type === "item" && pokemon.item_id ? <button className="rest-sheet-floating-action" onClick={() => onUnequip(slot)}>卸下道具</button> : null}
              {sheetFocus.type === "move" ? <button className="rest-sheet-floating-action" onClick={() => onMove(slot, sheetFocus.moveIndex ?? 0)}>更换该技能</button> : null}
              <h3>{sheetInfoTitle}</h3>
              <p>{sheetInfoBody}</p>
            </section>
          </section> : <>
            <div className="detail-tabs">
              <button className={tab === "info" ? "selected" : ""} onClick={() => setTab("info")}>基础信息</button>
              <button className={tab === "moves" ? "selected" : ""} onClick={() => setTab("moves")}>技能</button>
              <button className={tab === "stats" ? "selected" : ""} onClick={() => setTab("stats")}>数值</button>
            </div>
            <section className="detail-tab-panel">
              {tab === "info" ? <div className="detail-info-grid"><p>HP：{conditionText(state?.condition)}</p><p>特性：{pokemon.ability_zh || pokemon.ability}</p><p>性格：{pokemon.nature_zh || pokemon.nature}</p><p className="wide">{abilityDescription(pokemon)}</p></div> : null}
              {tab === "moves" ? <div className="detail-move-list">{pokemon.moves.map((move, index) => <article key={`${move.id}-${index}`}><strong>{index + 1}. {move.name_zh || move.name}</strong><span>{move.type_zh}/{move.category_zh}　威力 {move.power || "--"}　PP {state?.moves?.[index]?.pp ?? move.pp}/{state?.moves?.[index]?.maxpp ?? move.pp}</span>{move.learn_source_labels?.length ? <span>来源：{move.learn_source_labels.join(" / ")}</span> : null}<small>{moveDescription(move)}</small></article>)}</div> : null}
              {tab === "stats" ? <div className="detail-stat-panel">
                <div className="detail-hp-row"><span>HP</span><strong>{statLine(pokemon, "hp", revealTraining)}</strong><i /></div>
                <div className="detail-stat-list">{STAT_ROWS.filter(([stat]) => stat !== "hp").map(([stat, label]) => <p key={stat}><span>{label}</span><strong>{statLine(pokemon, stat, revealTraining)}</strong></p>)}</div>
              </div> : null}
            </section>
          </>}
          {!embedded ? <footer className="command-row">
            <button onClick={() => onMove(slot)}>更换技能</button>
            {pokemon.item_id ? <button onClick={() => onUnequip(slot)}>卸下道具</button> : null}
            <button onClick={() => onStats(slot)}>重置数值</button>
            <button onClick={onClose}>关闭</button>
          </footer> : null}
        </main>
      </section>
    </EmbeddedOrModal>
  );
}

function RestExchangeModal({rest, onClose, onAction, embedded = false}: {rest: NonNullable<DesktopGameState["rest"]>; onClose: () => void; onAction: RestActionHandler; embedded?: boolean}) {
  const [own, setOwn] = useState(0);
  const [enemy, setEnemy] = useState(0);
  const canExchange = rest.costs.exchange !== null && rest.enemy_display.length > 0 && !rest.taken_enemy_slots.includes(enemy + 1);
  const canAllIn = hasRunTalent(rest, "growth_all_in") && !rest.all_in_used;
  const exchangeCostLabel = coinCostLabel(rest.costs.exchange);
  return (
    <EmbeddedOrModal embedded={embedded}>
      <section className="rest-edit-modal exchange-rest-modal">
        <header><div><h2>交换宝可梦</h2><p>本次费用：{coinCostLabel(rest.costs.exchange)}　已交换 {rest.exchange_count}/3</p></div></header>
        <div className={`rest-exchange-grid ${embedded ? "embedded-horizontal" : ""}`}>
          <div>{rest.player_display.map((pokemon, index) => <button className={`mini-pokemon-card ${own === index ? "selected" : ""}`} onClick={() => setOwn(index)} key={`${pokemon.species_id}-own-${index}`}><PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} /><span>{displayName(pokemon)}</span></button>)}</div>
          <div className="exchange-center-label" aria-hidden="true"><span>交换</span></div>
          <div>{rest.enemy_display.map((pokemon, index) => <button className={`mini-pokemon-card ${enemy === index ? "selected" : ""}`} disabled={rest.taken_enemy_slots.includes(index + 1)} onClick={() => setEnemy(index)} key={`${pokemon.species_id}-enemy-${index}`}><PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} /><span>{displayName(pokemon)}</span>{rest.taken_enemy_slots.includes(index + 1) ? <small>已交换</small> : null}</button>)}</div>
        </div>
        <div className="command-row">
          <button disabled={!canExchange} onClick={() => onAction({type: "exchange", ownIndex: own, enemyIndex: enemy})}>立即交换（{exchangeCostLabel}）</button>
          {hasRunTalent(rest, "growth_all_in") ? <button disabled={!canAllIn} onClick={() => onAction({type: "all_in_exchange", ownIndex: own})}>{rest.all_in_used ? "孤注一掷已用" : "孤注一掷"}</button> : null}
        </div>
      </section>
    </EmbeddedOrModal>
  );
}

function isLockedBagItem(item?: BagItemView | null): boolean {
  return Boolean(item?.locked);
}

function isBarterMaterialItem(item?: BagItemView | null): boolean {
  return Boolean(item && item.count > 0 && !item.locked && !item.item_battle_system);
}

function ItemRecyclerModal({rest, onClose, onAction, embedded = false}: {rest: NonNullable<DesktopGameState["rest"]>; onClose: () => void; onAction: RestActionHandler; embedded?: boolean}) {
  const items = Object.values(rest.bag_categories || {consumable: [], held: [], tm: []}).flat().filter(item => !isLockedBagItem(item));
  return (
    <EmbeddedOrModal embedded={embedded}>
      <section className="shop-modal bag-manage-modal recycler-modal">
        <header>
          <div>
            <h2>道具回收商</h2>
            <p>本次休整可以出售背包道具。回收票据流水 {coinCostLabel(rest.recycle_receipt_value || 0)}</p>
          </div>
          <button onClick={onClose}>关闭</button>
        </header>
        <div className="shop-list recycler-list">
          {items.length ? items.map(item => (
            <button onClick={() => onAction({type: "sell_item", itemId: item.id})} key={`recycler-${item.id}`}>
              <ItemIcon item={item} />
              <strong>{item.name_zh || item.name}</strong>
              <span>x{item.count}　回收 {coinCostLabel(item.sell_price)}</span>
              <small>{itemCategoryLabel(item.category)}　{item.desc_zh || item.desc || item.name}</small>
            </button>
          )) : <p>背包为空。</p>}
        </div>
      </section>
    </EmbeddedOrModal>
  );
}

function DoctorEventPanel({rest, onClose, onAction, embedded = false}: {rest: NonNullable<DesktopGameState["rest"]>; onClose: () => void; onAction: RestActionHandler; embedded?: boolean}) {
  const [busy, setBusy] = useState<"status" | "hp" | null>(null);
  async function choose(branch: "status" | "hp") {
    if (busy) return;
    setBusy(branch);
    try {
      await onAction({type: "choose_doctor_treatment", branch}, branch === "status" ? "哥哥完成治疗" : "弟弟完成治疗");
    } finally {
      setBusy(null);
    }
  }
  return (
    <EmbeddedOrModal embedded={embedded}>
      <section className="shop-modal event-service-modal">
        <header><div><h2>蹩脚医生兄弟</h2><p>两兄弟手艺都不太稳定，但今天你必须挑一个。</p></div><button onClick={onClose}>返回</button></header>
        <div className="event-service-card-grid">
          <button disabled={Boolean(busy)} onClick={() => void choose("status")}>
            <strong>哥哥：诊断异常</strong>
            <span>全队解除异常并回满 PP，未濒死宝可梦 HP 压到一半。</span>
          </button>
          <button disabled={Boolean(busy)} onClick={() => void choose("hp")}>
            <strong>弟弟：强行补血</strong>
            <span>全队回满 HP，濒死复活到一半，并随机附加可治愈异常。</span>
          </button>
        </div>
      </section>
    </EmbeddedOrModal>
  );
}

function EventMoveServicePanel({rest, service, onClose, onAction, embedded = false}: {rest: NonNullable<DesktopGameState["rest"]>; service: "tutor" | "egg"; onClose: () => void; onAction: RestActionHandler; embedded?: boolean}) {
  const [slot, setSlot] = useState(0);
  const [moveSlot, setMoveSlot] = useState(0);
  const [moves, setMoves] = useState<PricedMove[]>([]);
  const [moveId, setMoveId] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const pokemon = rest.player_display[slot] || rest.player_display[0];
  const source = service === "egg" ? "egg" : "tutor";
  const title = service === "egg" ? "培育屋爷爷" : "讲师老奶奶";
  const serviceCost = 100;
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMoves([]);
    setMoveId("");
    void window.changeBattle!.learnableMoves(slot).then(list => {
      if (cancelled) return;
      const known = new Set((pokemon?.moves || []).map(move => toId(move.id || move.name)));
      const filtered = list.filter(move => (move.learn_sources || []).includes(source) && !known.has(toId(move.id || move.name)));
      setMoves(filtered);
      setMoveId(toId(filtered[0]?.id || filtered[0]?.name || ""));
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [slot, pokemon, source]);

  async function learn() {
    if (busy || !moveId) return;
    setBusy(true);
    try {
      await onAction({type: "event_learn_move", service, slot, moveSlot, moveId}, "事件技能已学习");
    } finally {
      setBusy(false);
    }
  }

  return (
    <EmbeddedOrModal embedded={embedded}>
      <section className="shop-modal event-service-modal">
        <header>
          <div><h2>{title}</h2><p>每次花 {serviceCost} 金币学习 1 个{service === "egg" ? "遗传" : "教授"}招式，本次休整内不限次数。</p></div>
          <div className="event-service-header-actions">
            <button disabled={busy || !moveId || Number(rest.coins || 0) < serviceCost} onClick={() => void learn()}>{busy ? "学习中" : "确认技能"}</button>
            <button onClick={onClose}>返回</button>
          </div>
        </header>
        <div className="event-service-layout">
          <aside className="event-service-team">
            {rest.player_display.map((entry, index) => <button className={slot === index ? "selected" : ""} aria-label={displayName(entry)} title={displayName(entry)} onClick={() => setSlot(index)} key={`event-move-slot-${entry.species_id}-${index}`}><PokemonSprite pokemon={entry} alt={displayName(entry)} /></button>)}
          </aside>
          <main>
            <div className="segmented-row">
              {(pokemon?.moves || []).map((move, index) => <button className={moveSlot === index ? "selected" : ""} onClick={() => setMoveSlot(index)} key={`event-replace-${index}`}><strong>{index + 1}</strong><small>{move.name_zh || move.name}</small></button>)}
            </div>
            <div className="event-move-list">
              {loading ? <p>读取可学招式中...</p> : moves.length ? moves.map(move => (
                <EventLearnMoveCard
                  move={move}
                  selected={moveId === toId(move.id || move.name)}
                  onClick={() => setMoveId(toId(move.id || move.name))}
                  key={`event-learn-${move.id || move.name}`}
                />
              )) : <p>当前没有可学习的{service === "egg" ? "遗传" : "教授"}招式。</p>}
            </div>
          </main>
        </div>
      </section>
    </EmbeddedOrModal>
  );
}

function EventLearnMoveCard({move, selected, onClick}: {move: PricedMove; selected: boolean; onClick: () => void}) {
  const moveType = move.type || move.type_zh || "Normal";
  const description = moveDescription(move);
  return (
    <button type="button" className={`event-learn-move-card move-type-${typeId(moveType)} ${selected ? "selected" : ""}`} onClick={onClick}>
      <span className="event-learn-move-title">
        <strong>{move.name_zh || move.name}</strong>
        <i>{move.category_zh || move.category || "变化"}</i>
      </span>
      <span className="event-learn-move-stats">
        <b>{move.type_zh || move.type || "一般"}</b>
        <em>PP {move.pp ?? "--"}</em>
        <em>威力 {move.power || "--"}</em>
        <em>命中 {move.accuracy ?? "必中"}</em>
      </span>
      <small>{description}</small>
    </button>
  );
}

function RaidExchangePanel({rest, onClose, onAction, embedded = false}: {rest: NonNullable<DesktopGameState["rest"]>; onClose: () => void; onAction: RestActionHandler; embedded?: boolean}) {
  const [own, setOwn] = useState(0);
  const [enemy, setEnemy] = useState(0);
  const battleNo = rest.event_services?.raid_exchange_battle_no || Number(rest.battle_no || 0) + 1;
  const row = rest.night_sky?.rows?.find(entry => Number(entry.battle_no) === Number(battleNo));
  const enemies = (row?.enemies || []).filter((entry): entry is RentalPokemon => Boolean(entry));
  return (
    <EmbeddedOrModal embedded={embedded}>
      <section className="rest-edit-modal exchange-rest-modal">
        <header><div><h2>骇人奇袭</h2><p>观测第 {battleNo} 场完整队伍，并抢先交换 1 只宝可梦。</p></div><button onClick={onClose}>返回</button></header>
        <div className={`rest-exchange-grid ${embedded ? "embedded-horizontal" : ""}`}>
          <div>{rest.player_display.map((pokemon, index) => <button className={`mini-pokemon-card ${own === index ? "selected" : ""}`} onClick={() => setOwn(index)} key={`raid-own-${pokemon.species_id}-${index}`}><PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} /><span>{displayName(pokemon)}</span></button>)}</div>
          <div className="exchange-center-label" aria-hidden="true"><span>奇袭</span></div>
          <div>{enemies.map((pokemon, index) => <button className={`mini-pokemon-card ${enemy === index ? "selected" : ""}`} onClick={() => setEnemy(index)} key={`raid-enemy-${pokemon.species_id}-${index}`}><PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} /><span>{displayName(pokemon)}</span></button>)}</div>
        </div>
        <div className="command-row">
          <button disabled={!enemies.length} onClick={() => onAction({type: "event_raid_exchange", ownIndex: own, enemyIndex: enemy}, "奇袭交换完成")}>执行奇袭交换</button>
        </div>
      </section>
    </EmbeddedOrModal>
  );
}

function ScoreBetPanel({rest, onClose, onAction, embedded = false}: {rest: NonNullable<DesktopGameState["rest"]>; onClose: () => void; onAction: RestActionHandler; embedded?: boolean}) {
  const bet = rest.score_bet;
  const [draftStake, setDraftStake] = useState(String(bet?.stake || 100));
  useEffect(() => {
    setDraftStake(String(bet?.stake || 100));
  }, [bet?.stake]);
  if (!bet) {
    return (
      <EmbeddedOrModal embedded={embedded}>
        <section className="shop-modal score-bet-modal">
          <header><div><h2>重金下注</h2><p>当前没有进行中的盘口。</p></div><button onClick={onClose}>返回</button></header>
        </section>
      </EmbeddedOrModal>
    );
  }
  const currentBet = bet;
  const targets: Array<{value: 1 | 2 | 3; label: string}> = [
    {value: 3, label: "3:0"},
    {value: 2, label: "2:0"},
    {value: 1, label: "1:0"},
  ];
  const multiplierOptions = currentBet.multiplier_options?.length ? currentBet.multiplier_options : [1.5, 2, 3, 5];
  const maxStake = Math.max(100, Number(currentBet.max_stake || currentBet.stake || 100));
  const numericDraft = Math.max(100, Math.min(maxStake, Math.floor(Number(draftStake || currentBet.stake || 100))));
  const targetLabel = `${currentBet.target_alive}:0`;

  function adjustStake(delta: number) {
    const nextStake = Math.max(100, Math.min(maxStake, Math.floor(Number(currentBet.stake || 100) + delta)));
    setDraftStake(String(nextStake));
    void onAction({type: "event_score_bet_adjust", stake: nextStake}, "下注已调整");
  }

  function applyStake() {
    setDraftStake(String(numericDraft));
    void onAction({type: "event_score_bet_adjust", stake: numericDraft}, "下注已调整");
  }

  return (
    <EmbeddedOrModal embedded={embedded}>
      <section className="shop-modal event-service-modal score-bet-modal">
        <header><div><h2>重金下注</h2><p>精确命中下一战比分才返还，赢多赢少都算没中。</p></div><button onClick={onClose}>返回</button></header>
        <div className="score-bet-summary">
          <article><span>盘口</span><strong>{targetLabel}</strong><small>只能押自己赢</small></article>
          <article><span>下注</span><strong>{currentBet.stake} 金币</strong><small>最低 100，最高 {maxStake}</small></article>
          <article><span>返还</span><strong>{currentBet.payout || Math.floor(currentBet.stake * currentBet.multiplier)} 金币</strong><small>赔率 {currentBet.multiplier}x</small></article>
        </div>
        <div className="segmented-row score-bet-target-row">
          {targets.map(target => (
            <button className={currentBet.target_alive === target.value ? "selected" : ""} onClick={() => onAction({type: "event_score_bet_adjust", targetAlive: target.value}, `盘口已改为 ${target.label}`)} key={`score-bet-target-${target.value}`}>
              <strong>{target.label}</strong>
              <small>比分</small>
            </button>
          ))}
        </div>
        <div className="segmented-row score-bet-target-row">
          {multiplierOptions.map(multiplier => (
            <button className={Math.abs(Number(currentBet.multiplier || 0) - multiplier) < 0.001 ? "selected" : ""} onClick={() => onAction({type: "event_score_bet_adjust", multiplier}, `赔率已改为 ${multiplier}x`)} key={`score-bet-multiplier-${multiplier}`}>
              <strong>{multiplier}x</strong>
              <small>赔率</small>
            </button>
          ))}
        </div>
        <div className="score-bet-controls">
          <button disabled={currentBet.stake <= 100} onClick={() => adjustStake(-100)}>-100</button>
          <input type="number" min={100} max={maxStake} step={100} value={draftStake} onChange={event => setDraftStake(event.target.value)} onBlur={applyStake} />
          <button disabled={currentBet.stake >= maxStake} onClick={() => adjustStake(100)}>+100</button>
          <button onClick={applyStake}>调整下注</button>
        </div>
      </section>
    </EmbeddedOrModal>
  );
}

function EventLevelPanel({rest, onClose, onAction, embedded = false}: {rest: NonNullable<DesktopGameState["rest"]>; onClose: () => void; onAction: RestActionHandler; embedded?: boolean}) {
  const points = Number(rest.event_services?.level_points || 0);
  return (
    <EmbeddedOrModal embedded={embedded}>
      <section className="shop-modal event-service-modal">
        <header><div><h2>恋恋不舍</h2><p>本次不能交换宝可梦，但还可以分配 {points} 点等级。</p></div><button onClick={onClose}>返回</button></header>
        <div className="event-service-card-grid">
          {rest.player_display.map((pokemon, index) => <button disabled={points <= 0} onClick={() => onAction({type: "event_apply_level", slot: index}, "等级已提升")} key={`event-level-${pokemon.species_id}-${index}`}><PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} /><strong>{displayName(pokemon)}</strong><span>Lv{pokemon.level}</span></button>)}
        </div>
      </section>
    </EmbeddedOrModal>
  );
}

function ForgeModal({rest, onClose, onAction, onNotice, embedded = false}: {rest: NonNullable<DesktopGameState["rest"]>; onClose: () => void; onAction: RestActionHandler; onNotice?: (message: string, tone?: "normal" | "danger") => void; embedded?: boolean}) {
  const items = Object.values(rest.bag_categories || {consumable: [], held: [], tm: []}).flat();
  const normalForgeItems = items.filter(item => item.item_battle_system !== "mega" && item.item_battle_system !== "zmove");
  const specialForgeItems = items.filter(item => item.item_battle_system === "mega" || item.item_battle_system === "zmove");
  const [materials, setMaterials] = useState<string[]>([]);
  const [working, setWorking] = useState(false);
  const teraType = rest.player_display.find(pokemon => pokemon.tera_type_zh)?.tera_type_zh;
  const materialCounts = materials.reduce<Record<string, number>>((acc, id) => ({...acc, [id]: Number(acc[id] || 0) + 1}), {});
  const selectedMaterialItems = materials.map(id => items.find(item => item.id === id)).filter((item): item is BagItemView => Boolean(item));
  const selectedKinds = selectedMaterialItems.map(forgeKindLabel);
  const sameKind = selectedKinds.length === 3 && selectedKinds.every(kind => kind === selectedKinds[0]);

  function blockedNormalForgeReason(item: BagItemView): string {
    if (item.item_battle_system === "terastal") return "该道具不能被放进普通熔炉。";
    if (isLockedBagItem(item)) return item.lock_reason || "该道具不能被放进普通熔炉。";
    return "";
  }

  function addMaterial(itemId: string, maxCount: number) {
    if (materials.length >= 3) return;
    if (Number(materialCounts[itemId] || 0) >= maxCount) return;
    setMaterials(current => [...current, itemId]);
  }

  async function runForge(action: RestAction) {
    if (working) return;
    setWorking(true);
    try {
      const ok = await Promise.resolve(onAction(action));
      if (ok !== false) setMaterials([]);
    } finally {
      setWorking(false);
    }
  }

  return (
    <EmbeddedOrModal embedded={embedded}>
      <section className="shop-modal forge-modal shop-theme-orange">
        <header className="forge-header">
          <div><h2>熔炉</h2><p>投入 3 个道具重铸；同类型材料会产出 2 个不同重铸物。</p></div>
          <button onClick={onClose}>返回</button>
        </header>
        <div className="forge-grid">
          <div className="forge-material-list">
            {normalForgeItems.length ? normalForgeItems.map(item => {
              const picked = Number(materialCounts[item.id] || 0);
              const blockedReason = blockedNormalForgeReason(item);
              return (
                <button className={`${picked ? "selected" : ""} ${blockedReason ? "blocked" : ""}`} disabled={working || (!blockedReason && (materials.length >= 3 || picked >= item.count))} onClick={() => { if (blockedReason) { onNotice?.(blockedReason, "danger"); return; } addMaterial(item.id, item.count); }} key={`forge-material-${item.id}`}>
                  <ItemIcon item={item} />
                  <span>{item.name_zh || item.name}</span>
                  <small>x{item.count}{picked ? ` / 已选 ${picked}` : ""}</small>
                  <em>{blockedReason || item.desc_zh || item.desc || itemCategoryLabel(item.category)}</em>
                </button>
              );
            }) : <p>背包里没有可投入普通熔炉的道具。</p>}
          </div>
          <aside className="forge-panel">
            <div className="forge-slots">
              {[0, 1, 2].map(index => {
                const id = materials[index];
                const item = items.find(entry => entry.id === id);
                return <button onClick={() => setMaterials(current => current.filter((_value, itemIndex) => itemIndex !== index))} disabled={!id || working} key={`forge-slot-${index}`}>{item ? <><ItemIcon item={item} /><span>{item.name_zh || item.name}</span></> : <span>材料 {index + 1}</span>}</button>;
              })}
            </div>
            <button className="forge-main-button" disabled={working || materials.length !== 3} onClick={() => runForge({type: "forge_items", itemIds: materials})}>{working ? "重铸中" : "普通重铸"}</button>
            <p className="forge-rule-hint">
              {materials.length ? `材料类型：${selectedKinds.join(" / ")}${materials.length === 3 ? `　预计产出 ${sameKind ? 2 : 1} 个` : ""}` : "同类型 3 个材料会产出 2 个不同重铸物。"}
            </p>
            <button disabled={!materials.length || working} onClick={() => setMaterials([])}>清空材料</button>
          </aside>
        </div>
        <div className="forge-special-row">
          {specialForgeItems.map(item => <button disabled={working || Number(rest.coins || 0) < 50} onClick={() => runForge({type: "forge_special_item", itemId: item.id})} key={`special-forge-${item.id}`}><ItemIcon item={item} /><span>{item.name_zh || item.name}</span><small>{item.item_battle_system === "mega" ? "Mega 石重铸" : "Z 纯晶重铸"} 50</small></button>)}
          {teraType ? <button disabled={working || Number(rest.coins || 0) < 50} onClick={() => runForge({type: "forge_tera_orb"})}><span>太晶珠：{teraType}</span><small>重铸属性 50</small></button> : null}
        </div>
      </section>
    </EmbeddedOrModal>
  );
}

function forgeKindLabel(item: BagItemView): string {
  if (item.category === "tm") return "技能机器";
  const text = `${item.id} ${item.name} ${item.name_zh} ${item.desc || ""} ${item.desc_zh || ""}`.toLowerCase();
  if (item.id.endsWith("berry") || text.includes("berry") || text.includes("树果")) return "树果";
  if (/ether|elixir/.test(item.id) || /\bpp\b/.test(text)) return "PP 补剂";
  if (item.category === "held") return "普通携带";
  return "回复";
}

function NightSkyModal({rest, onClose, onAction, embedded = false}: {rest: NonNullable<DesktopGameState["rest"]>; onClose: () => void; onAction: RestActionHandler; embedded?: boolean}) {
  const rows = rest.night_sky?.rows || [];
  const nextBattleNo = Math.max(1, Math.min(Number(rest.battles || rows.length || 1), Number(rest.battle_no || 0) + 1));
  const [selectedBattleNo, setSelectedBattleNo] = useState(() => rows.find(row => row.battle_no === nextBattleNo)?.battle_no || rows[0]?.battle_no || 0);
  useEffect(() => {
    if (!rows.length) {
      setSelectedBattleNo(0);
      return;
    }
    if (!rows.some(row => row.battle_no === selectedBattleNo)) setSelectedBattleNo(rows.find(row => row.battle_no === nextBattleNo)?.battle_no || rows[0].battle_no);
  }, [nextBattleNo, rows, selectedBattleNo]);
  const selectedIndex = Math.max(0, rows.findIndex(row => row.battle_no === selectedBattleNo));
  const selectedRow = rows[selectedIndex] || rows[0] || null;
  const rumorLevel = runTalentLevel(rest, "intel_rumor");
  const hasScoutTalent = rumorLevel > 0;
  const hasRerouteTalent = hasRunTalent(rest, "intel_reroute");
  const currentBattleNo = Number(rest.battle_no || 0);
  const selectedTrainerVisible = selectedRow ? selectedRow.trainer_visible !== false : false;
  const selectedTrainerImage = selectedRow && selectedTrainerVisible ? trainerImageUrl(selectedRow.trainer, "front") || trainerImageUrl(selectedRow.trainer, "avatar") : "";
  const selectedFuture = selectedRow ? Number(selectedRow.battle_no) > currentBattleNo : false;
  const rerouteUsed = Number(rest.reroute_used || 0);
  const rerouteLimit = Number(rest.reroute_limit || 3);
  const canRerouteSelected = Boolean(hasRerouteTalent && selectedRow && selectedFuture && rerouteUsed < rerouteLimit);
  const canScoutOne = Boolean(rumorLevel >= 2 && selectedRow && selectedFuture && Number(selectedRow.revealed || 0) < 1);
  const canScoutAll = Boolean(rumorLevel >= 3 && selectedRow && selectedFuture && !selectedRow.unlocked);
  const scoutOneLabel = !hasScoutTalent ? "需要小道消息" : rumorLevel < 2 ? "需要 Lv2" : !selectedFuture ? "已挑战" : Number(selectedRow?.revealed || 0) >= 1 ? "已揭示一只" : "揭示 1 只（免费）";
  const scoutAllLabel = !hasScoutTalent ? "需要小道消息" : rumorLevel < 3 ? "需要 Lv3" : !selectedFuture ? "已挑战" : selectedRow?.unlocked ? "已解锁三只" : `解锁三只（${coinCostLabel(rest.costs.scout_all)}）`;
  return (
    <EmbeddedOrModal embedded={embedded}>
      <section className="shop-modal night-sky-modal night-sky-gallery-modal">
        {selectedRow ? (
          <div className="night-sky-gallery">
            <div className="night-sky-gallery-main">
              <AnimatePresence mode="wait">
                <motion.div className={`night-sky-gallery-stage ${selectedTrainerVisible ? "" : "unknown"}`} initial={{opacity: 0, x: 16, scale: .98}} animate={{opacity: 1, x: 0, scale: 1}} exit={{opacity: 0, x: -16, scale: .98}} transition={{type: "spring", stiffness: 330, damping: 30}} key={`night-sky-stage-${selectedRow.battle_no}`}>
                  {selectedTrainerImage ? <img src={selectedTrainerImage} alt="" /> : <i>?</i>}
                  <small>{selectedTrainerVisible ? selectedRow.trainer.name_zh : "???"}</small>
                </motion.div>
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.article className="night-sky-selected-detail" initial={{opacity: 0, y: 8}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -8}} transition={{duration: .18}} key={`night-sky-detail-${selectedRow.battle_no}`}>
                  <div className="night-sky-selected-copy">
                    <strong>{selectedRow.battle_no === nextBattleNo ? "下一场" : selectedRow.encountered ? "已挑战" : `第 ${selectedRow.battle_no} 场`}</strong>
                    <span>{selectedTrainerVisible ? selectedRow.label : "未知对手"}</span>
                  </div>
                  <div className="night-sky-selected-enemies">
                    {selectedRow.enemies.map((enemy, index) => enemy ? (
                      <div className="night-sky-pokemon" key={`${selectedRow.battle_no}-${enemy.species_id}-${index}`}>
                        <PokemonSprite pokemon={enemy} alt={displayName(enemy)} />
                        <span>{displayName(enemy)}</span>
                      </div>
                    ) : (
                      <div className="night-sky-pokemon night-sky-unknown" key={`${selectedRow.battle_no}-unknown-${index}`}>
                        <i>?</i>
                        <span>未查看</span>
                      </div>
                    ))}
                  </div>
                  <div className="night-sky-actions">
                    <button disabled={!canScoutOne} onClick={() => onAction({type: "night_sky_scout", battleNo: selectedRow.battle_no, level: "one"})}>{scoutOneLabel}</button>
                    <button disabled={!canScoutAll} onClick={() => onAction({type: "night_sky_scout", battleNo: selectedRow.battle_no, level: "all"})}>{scoutAllLabel}</button>
                    <button disabled={!canRerouteSelected} onClick={() => onAction({type: "reroute_next", battleNo: selectedRow.battle_no})}>{hasRerouteTalent ? `更换对手 ${rerouteUsed}/${rerouteLimit}` : "需要公子驾到"}</button>
                  </div>
                </motion.article>
              </AnimatePresence>
            </div>
            <nav className="night-sky-thumbnail-nav" aria-label="小道消息节点">
              {rows.map(row => {
                const trainerVisible = row.trainer_visible !== false;
                const trainerImage = trainerVisible ? trainerImageUrl(row.trainer, "avatar") || trainerImageUrl(row.trainer, "front") : "";
                const selected = row.battle_no === selectedRow.battle_no;
                return (
                  <motion.button
                    className={`night-sky-thumbnail ${selected ? "active" : ""} ${trainerVisible ? "" : "unknown"} ${row.encountered ? "encountered" : ""}`}
                    aria-label={`选择小道消息节点 ${row.battle_no}`}
                    onClick={() => setSelectedBattleNo(row.battle_no)}
                    initial={false}
                    animate={{opacity: selected ? 1 : 0.62, y: selected ? -2 : 0}}
                    whileHover={{scale: 1.05, opacity: 1}}
                    whileTap={{scale: 0.96}}
                    key={`night-sky-thumb-${row.battle_no}`}
                  >
                    {selected ? <motion.i layoutId="night-sky-thumbnail-active" transition={{type: "spring", stiffness: 420, damping: 32}} /> : null}
                    {trainerImage ? <img src={trainerImage} alt="" /> : <span>?</span>}
                  </motion.button>
                );
              })}
            </nav>
          </div>
        ) : <p className="night-sky-empty">小道消息尚未展开。</p>}
      </section>
    </EmbeddedOrModal>
  );
}

function RunTalentActionContent({talent, rest, onAction}: {talent: TalentView; rest: NonNullable<DesktopGameState["rest"]>; onAction: RestActionHandler}) {
  const [allInSlot, setAllInSlot] = useState(0);
  const [trustSlot, setTrustSlot] = useState(0);
  const [leadSlot, setLeadSlot] = useState(0);
  const [bpAmount, setBpAmount] = useState(1);
  const canAllIn = hasRunTalent(rest, "growth_all_in") && !rest.all_in_used;

  if (talent.id === "growth_all_in") {
    return (
      <div className="talent-card-actions">
        <div className="talent-target-row compact">
          {rest.player_display.map((pokemon, index) => (
            <button className={`${allInSlot === index ? "selected" : ""} ${rest.all_in_used ? "used" : ""}`} disabled={Boolean(rest.all_in_used)} onClick={() => setAllInSlot(index)} key={`${pokemon.species_id}-all-in-${index}`}>
              <PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} />
              <span>{index + 1}. {displayName(pokemon)}</span>
              {rest.all_in_used ? <small>已用</small> : null}
            </button>
          ))}
        </div>
        <button disabled={!canAllIn} onClick={() => onAction({type: "all_in_exchange", ownIndex: allInSlot})}>{rest.all_in_used ? "孤注一掷已用" : `孤注一掷：${displayName(rest.player_display[allInSlot])}`}</button>
      </div>
    );
  }
  if (talent.id === "intel_reroute") {
    const preview = rest.next_opponent_preview;
    const used = rest.reroute_used || 0;
    const limit = rest.reroute_limit || 3;
    return (
      <div className="talent-card-actions">
        <div className="talent-run-mini">
          <strong>{preview ? `第 ${preview.battle_no} 场：${preview.trainer.name_zh}` : "没有可改道的下一场"}</strong>
          <span>{preview?.label || "本局已接近结束"}　{used}/{limit}</span>
        </div>
        <button className={used >= limit ? "used" : ""} disabled={!preview || used >= limit} onClick={() => onAction({type: "reroute_next"})}>{used >= limit ? "次数已用尽" : "更换下一场对手"}</button>
      </div>
    );
  }
  if (talent.id === "exchange_trust") {
    return (
      <div className="talent-card-actions">
        <div className="talent-target-row compact">
          {rest.player_display.map((pokemon, index) => (
            <button className={`${trustSlot === index ? "selected" : ""} ${rest.trust_level_used ? "used" : ""}`} disabled={Boolean(rest.trust_level_used)} onClick={() => setTrustSlot(index)} key={`${pokemon.species_id}-trust-${index}`}>
              <PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} />
              <span>{index + 1}. {displayName(pokemon)} Lv{pokemon.level}</span>
              {rest.trust_level_used ? <small>已用</small> : null}
            </button>
          ))}
        </div>
        <button disabled={Boolean(rest.trust_level_used)} onClick={() => onAction({type: "trust_level", slot: trustSlot})}>{rest.trust_level_used ? "本次已培养" : "培养信赖"}</button>
      </div>
    );
  }
  if (talent.id === "growth_lead_change") {
    return (
      <div className="talent-card-actions">
        <div className="talent-target-row compact">
          {rest.player_display.map((pokemon, index) => (
            <button className={`${leadSlot === index ? "selected" : ""} ${rest.lead_change_used ? "used" : ""}`} disabled={Boolean(rest.lead_change_used) || Boolean(rest.player_state[index]?.fainted)} onClick={() => setLeadSlot(index)} key={`${pokemon.species_id}-lead-${index}`}>
              <PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} />
              <span>{index + 1}. {displayName(pokemon)}</span>
              {rest.lead_change_used ? <small>已用</small> : null}
            </button>
          ))}
        </div>
        <button disabled={Boolean(rest.lead_change_used) || leadSlot === 0} onClick={() => onAction({type: "set_lead", slot: leadSlot})}>{rest.lead_change_used ? "本次已调整" : "设为首发"}</button>
      </div>
    );
  }
  if (talent.id === "economy_bp_exchange") {
    return (
      <div className="talent-card-actions bp-exchange-actions">
        <input type="number" min={1} max={99} value={bpAmount} onChange={event => setBpAmount(Math.max(1, Math.floor(Number(event.target.value || 1))))} />
        <button onClick={() => onAction({type: "bp_to_coins", bp: bpAmount})}>兑换 {bpAmount * 50} 金币</button>
      </div>
    );
  }
  return <p className="talent-action-empty">这个天赋不需要在休整页手动发动。</p>;
}

function RunTalentActionModal({talent, rest, onClose, onAction, embedded = false}: {talent: TalentView; rest: NonNullable<DesktopGameState["rest"]>; onClose: () => void; onAction: RestActionHandler; embedded?: boolean}) {
  return (
    <EmbeddedOrModal embedded={embedded}>
      <section className="shop-modal talent-action-modal">
        <header><div><h2>{talent.name}</h2><p>{talentShortText(talent)}</p></div><button onClick={onClose}>关闭</button></header>
        <RunTalentActionContent talent={talent} rest={rest} onAction={onAction} />
      </section>
    </EmbeddedOrModal>
  );
}

function RunTalentModal({rest, embedded = false}: {rest: NonNullable<DesktopGameState["rest"]>; embedded?: boolean}) {
  const talents = rest.talents || [];
  const [selectedTalentId, setSelectedTalentId] = useState(() => talents[0]?.id || "");
  const selectedTalent = talents.find(talent => talent.id === selectedTalentId) || talents[0] || null;

  useEffect(() => {
    if (!talents.length) {
      setSelectedTalentId("");
      return;
    }
    if (!talents.some(talent => talent.id === selectedTalentId)) setSelectedTalentId(talents[0].id);
  }, [selectedTalentId, talents]);

  return (
    <EmbeddedOrModal embedded={embedded}>
      <section className="shop-modal talent-run-modal talent-run-browser">
        {talents.length ? (
          <div className="talent-run-browser-body">
            <aside className="talent-run-side-list" aria-label="本局天赋列表">
              {talents.map(talent => {
                const used = runTalentActionUsed(rest, talent.id);
                return (
                  <button className={`${selectedTalent?.id === talent.id ? "selected" : ""} ${used ? "used" : ""}`} onClick={() => setSelectedTalentId(talent.id)} key={talent.id}>
                    <strong>{talent.name}</strong>
                    <span>{talent.category}</span>
                    {used ? <small>已用</small> : null}
                  </button>
                );
              })}
            </aside>
            <article className={`talent-run-detail ${selectedTalent && isActiveRunTalent(selectedTalent.id) ? "active-talent-card" : ""}`}>
              {selectedTalent ? (
                <>
                  <div className="talent-run-detail-title">
                    <div>
                      <h3>{selectedTalent.name}</h3>
                      <span>{selectedTalent.category}</span>
                    </div>
                    <b>{runTalentActionUsed(rest, selectedTalent.id) ? "已使用" : isManualRunTalent(selectedTalent.id) ? "可手动" : "常驻"}</b>
                  </div>
                  <p>{talentShortText(selectedTalent)}</p>
                </>
              ) : null}
            </article>
          </div>
        ) : <p className="talent-run-empty">当前无天赋。</p>}
      </section>
    </EmbeddedOrModal>
  );
}

const SHOP_KIND_VIEW: Record<ShopKind, {label: string; desc: string; cost: number; theme: string}> = {
  recovery: {label: "回复商店", desc: "恢复/树果/PP", cost: 50, theme: "green"},
  held: {label: "道具商店", desc: "战斗携带", cost: 75, theme: "blue"},
  tm: {label: "技能商店", desc: "技能机器", cost: 75, theme: "purple"},
  mega: {label: "Mega 商店", desc: "进化石", cost: 75, theme: "orange"},
  zmove: {label: "Z 招式商店", desc: "Z 纯晶", cost: 75, theme: "purple"},
  training: {label: "训练商店", desc: "培养道具", cost: 75, theme: "orange"},
};

function hasRestEventStatus(rest: NonNullable<DesktopGameState["rest"]>, id: string): boolean {
  return Boolean(rest.rest_event_statuses?.some(status => status.id === id));
}

function ShopModal({rest, shop, onClose, onRoll, onBuy, onBarterBuy, embedded = false}: {rest: NonNullable<DesktopGameState["rest"]>; shop: NonNullable<DesktopGameState["rest"]>["shop"]; onClose: () => void; onRoll: (shopKind: ShopKind) => RestActionResult | Promise<RestActionResult>; onBuy: (offerId: string) => RestActionResult | Promise<RestActionResult>; onBarterBuy?: (offerId: string, itemIds: string[]) => RestActionResult | Promise<RestActionResult>; embedded?: boolean}) {
  const [shopKind, setShopKind] = useState<ShopKind>((shop?.kind as ShopKind | undefined) || "recovery");
  const activeKind = (shop?.kind as ShopKind | undefined) || "recovery";
  const availableKinds = shop?.available_kinds?.length ? shop.available_kinds : (["recovery", "held", "tm", "training"] as ShopKind[]);
  const offersForKind = (kind: ShopKind) => shop?.offers_by_kind?.[kind] || (activeKind === kind ? (shop?.offers || []) : []);
  const offers = offersForKind(shopKind);
  const slotCount = shop?.slot_count || offers.length || 3;
  const [rolling, setRolling] = useState(false);
  const [revealed, setRevealed] = useState(Boolean(offers.length));
  const [buyingOfferId, setBuyingOfferId] = useState("");
  const [barterOffer, setBarterOffer] = useState<ShopOffer | null>(null);
  const [detailOffer, setDetailOffer] = useState<ShopOffer | null>(null);
  const bonus = shop?.last_roll_bonus || null;
  const barterActive = hasRestEventStatus(rest, "barter");
  const shopDisabled = hasRestEventStatus(rest, "shop_disabled");
  const rainbowRocketActive = hasRestEventStatus(rest, "rainbow_rocket");
  const occupiedByRainbowRocket = rainbowRocketActive || shopDisabled || !shop;
  const rollCost = barterActive ? 0 : activeKind === shopKind ? Number(shop?.next_roll_cost || 0) : Number(shop?.free_rolls_remaining || 0) > 0 ? 0 : SHOP_KIND_VIEW[shopKind].cost;
  const canAffordRoll = Number(rest.coins || 0) >= rollCost;
  const discountForKind = (kind: ShopKind) => Number(rest.shop_kind_discounts?.[kind] || 1);

  useEffect(() => {
    if (!offers.length) setRevealed(false);
    else if (!rolling) setRevealed(true);
  }, [offers.length, rolling]);

  useEffect(() => {
    if (!availableKinds.includes(shopKind)) setShopKind(availableKinds[0] || "recovery");
  }, [availableKinds, shopKind]);

  async function roll() {
    if (rolling || !canAffordRoll || shopDisabled) return;
    setRolling(true);
    setRevealed(false);
    const ok = await onRoll(shopKind);
    if (ok === false) {
      setRolling(false);
      setRevealed(Boolean(offers.length));
      return;
    }
    window.setTimeout(() => {
      setRolling(false);
      setRevealed(true);
    }, 1300);
  }

  async function buy(offerId: string) {
    if (buyingOfferId) return;
    if (barterActive) {
      const offer = offers.find(entry => entry.offer_id === offerId) || null;
      setBarterOffer(offer);
      return;
    }
    setBuyingOfferId(offerId);
    try {
      await onBuy(offerId);
    } finally {
      setBuyingOfferId("");
    }
  }

  return (
    <EmbeddedOrModal embedded={embedded}>
      <section className={`shop-modal slot-shop-modal shop-theme-${SHOP_KIND_VIEW[shopKind].theme}`}>
        {occupiedByRainbowRocket ? (
          <div className="shop-occupied-panel">
            <strong>商店已被彩虹火箭队成员占领</strong>
            <span>普通商店暂时关闭。请优先处理工厂支援、技能服务和下一场战斗。</span>
            <button onClick={onClose}>返回</button>
          </div>
        ) : (
          <>
            <div className="segmented-row shop-kind-row" style={{"--shop-kind-count": availableKinds.length} as CSSProperties}>
              {availableKinds.map(kind => {
                const discount = discountForKind(kind);
                return (
                  <button className={shopKind === kind ? "selected" : ""} onClick={() => { setShopKind(kind); setRevealed(Boolean(offersForKind(kind).length)); }} key={kind}>
                    <strong>{SHOP_KIND_VIEW[kind].label}{discount < 1 ? <b className="shop-discount-mark">{Math.round(discount * 10)}折</b> : null}</strong>
                    <small>{SHOP_KIND_VIEW[kind].desc}</small>
                  </button>
                );
              })}
            </div>
            <div className="shop-control-row">
              <span>{SHOP_KIND_VIEW[shopKind].label}　抽奖 {barterActive ? "免费" : coinCostLabel(rollCost)}　{slotCount} 格{discountForKind(shopKind) < 1 ? `　折扣 ${Math.round(discountForKind(shopKind) * 10)}折` : ""}{shop?.free_rolls_remaining ? `　免费 ${shop.free_rolls_remaining}` : ""}</span>
              <button disabled={rolling || !canAffordRoll} onClick={roll}>{rolling ? "抽取中" : `抽奖`}</button>
              <button onClick={onClose}>跳过</button>
            </div>
            {bonus && revealed ? <div className="slot-bonus-pop"><strong>抽到 {bonus.match_count} 连！</strong><span>免费获得 {bonus.count} 个 {bonus.name_zh || bonus.name}</span></div> : null}
            <div className={`shop-slot-grid ${rolling ? "rolling" : ""}`} style={{"--slot-count": slotCount} as CSSProperties}>
          {rolling ? Array.from({length: slotCount}, (_, index) => (
            <article className="shop-slot-card placeholder" key={`rolling-shop-${index}`}>
              <ItemIcon item={undefined} />
              <div>
                <strong>抽取中</strong>
                <span>价格待定</span>
              </div>
              <div className="shop-slot-actions"><button disabled>等待</button><button disabled>详情</button></div>
            </article>
          )) : revealed && offers.length ? offers.map(item => {
            const purchaseCount = Number(shop?.purchased_offer_counts?.[item.offer_id] || (shop?.purchased_offer_id === item.offer_id ? 1 : 0));
            const itemPurchaseCount = Number(shop?.purchased_item_counts?.[toId(item.id || item.name)] || 0);
            const isBonus = bonus?.item_id === toId(item.id || item.name);
            const itemCost = Number(item.cost || 0);
            const canAffordItem = barterActive || Number(rest.coins || 0) >= itemCost;
            const isBuying = buyingOfferId === item.offer_id;
            return (
              <article className={`shop-slot-card ${purchaseCount ? "bought" : ""} ${isBonus ? "bonus" : ""}`} key={item.offer_id}>
                <ItemIcon item={item} />
                <div>
                  <strong>{item.name_zh || item.name}</strong>
                  <span><b>{coinCostLabel(item.cost)}</b>{isBonus ? <i>{bonus?.match_count} 连</i> : null}{purchaseCount ? <i>已买 x{purchaseCount}</i> : itemPurchaseCount ? <i>同道具 x{itemPurchaseCount}</i> : null}</span>
                </div>
                <div className="shop-slot-actions">
                  <button disabled={Boolean(buyingOfferId) || !canAffordItem || shopDisabled} onClick={() => buy(item.offer_id)}>{shopDisabled ? "关闭" : isBuying ? "购买中" : barterActive ? "交换" : purchaseCount ? "再买" : "购买"}</button>
                  <button onClick={() => setDetailOffer(item)}>详情</button>
                </div>
              </article>
            );
          }) : Array.from({length: slotCount}, (_, index) => (
            <article className="shop-slot-card placeholder" key={`empty-shop-${index}`}>
              <ItemIcon item={undefined} />
              <div>
                <strong>待抽取</strong>
                <span>价格待定</span>
              </div>
              <div className="shop-slot-actions"><button disabled>购买</button><button disabled>详情</button></div>
            </article>
          ))}
            </div>
            {barterOffer && onBarterBuy ? <BarterBuyModal rest={rest} offer={barterOffer} onClose={() => setBarterOffer(null)} onBuy={async (offerId, itemIds) => { setBuyingOfferId(offerId); try { await onBarterBuy(offerId, itemIds); setBarterOffer(null); } finally { setBuyingOfferId(""); } }} /> : null}
            {detailOffer ? <ShopOfferDetailModal offer={detailOffer} onClose={() => setDetailOffer(null)} /> : null}
          </>
        )}
      </section>
    </EmbeddedOrModal>
  );
}

function ShopOfferDetailModal({offer, onClose}: {offer: ShopOffer; onClose: () => void}) {
  return (
    <div className="modal-layer">
      <section className="shop-offer-detail-modal">
        <header>
          <ItemIcon item={offer} />
          <div>
            <h2>{offer.name_zh || offer.name}</h2>
            <span>{itemCategoryLabel(offer.category)}　{coinCostLabel(offer.cost)}</span>
          </div>
        </header>
        <p>{offer.desc_zh || offer.desc || offer.name_zh || offer.name}</p>
        {offer.move_name || offer.move_name_zh ? <small>技能：{offer.move_name_zh || offer.move_name}</small> : null}
        <div className="command-row">
          <button onClick={onClose}>关闭</button>
        </div>
      </section>
    </div>
  );
}

function BarterBuyModal({rest, offer, onClose, onBuy}: {rest: NonNullable<DesktopGameState["rest"]>; offer: ShopOffer; onClose: () => void; onBuy: (offerId: string, itemIds: string[]) => void | Promise<void>}) {
  const items = Object.values(rest.bag_categories || {consumable: [], held: [], tm: []}).flat().filter(isBarterMaterialItem);
  const [selected, setSelected] = useState<string[]>([]);
  const counts = selected.reduce<Record<string, number>>((acc, id) => ({...acc, [id]: Number(acc[id] || 0) + 1}), {});
  const value = selected.reduce((sum, id) => sum + Number(items.find(item => item.id === id)?.sell_price || 0), 0);
  const required = Math.ceil(Number(offer.cost || 0) * 0.7);
  function toggle(id: string, maxCount: number) {
    setSelected(current => {
      const picked = current.filter(value => value === id).length;
      if (current.length >= 3 || picked >= maxCount) return current;
      return [...current, id];
    });
  }
  return (
    <PokopiaModal className="barter-buy-modal" labelledBy="barter-buy-title" onClose={onClose}>
      {requestClose => (
        <motion.section className="barter-buy-content" variants={pokopiaItemVariants}>
          <header>
            <div><h2 id="barter-buy-title">以物易物</h2><p>{offer.name_zh || offer.name} 需要材料估值至少 {coinCostLabel(required)}，不找零。</p></div>
            <button onClick={() => requestClose()}>关闭</button>
          </header>
          <div className="barter-material-list">
            {items.length ? items.map(item => {
              const picked = Number(counts[item.id] || 0);
              return (
                <button className={picked ? "selected" : ""} disabled={selected.length >= 3 && !picked} onClick={() => toggle(item.id, item.count)} key={`barter-${item.id}`}>
                  <ItemIcon item={item} />
                  <span><strong>{item.name_zh || item.name}</strong><small>x{item.count}　估值 {coinCostLabel(item.sell_price || 0)}{picked ? `　已选 ${picked}` : ""}</small></span>
                </button>
              );
            }) : <p>背包里没有可交换的道具。</p>}
          </div>
          <footer className="command-row">
            <span>当前估值 {coinCostLabel(value)}</span>
            <button disabled={!selected.length} onClick={() => setSelected([])}>清空</button>
            <button disabled={!selected.length || value < required} onClick={() => onBuy(offer.offer_id, selected)}>确认交换</button>
          </footer>
        </motion.section>
      )}
    </PokopiaModal>
  );
}

const MOVE_DRAW_FLIP_BACK_MS = 420;
const MOVE_DRAW_SHUFFLE_STEP_MS = 520;
const MOVE_DRAW_FINAL_HOLD_MS = 460;
const MOVE_DRAW_RESULT_WAIT_MS = 2000;
const moveDrawLayoutTransition = {duration: 0.46, ease: [0.2, 0.82, 0.2, 1] as const};

function MoveAdjustModal({rest, initialSlot = 0, initialMoveSlot = 0, onClose, onAction}: {rest: NonNullable<DesktopGameState["rest"]>; initialSlot?: number; initialMoveSlot?: number; onClose: () => void; onAction: RestActionHandler}) {
  const slot = initialSlot;
  const drawMoveSlot = initialMoveSlot;
  const pokemon = rest.player_display[slot] || rest.player_display[0];
  const currentMove = pokemon?.moves[drawMoveSlot];
  const drawKey = `${slot}:${drawMoveSlot}`;
  const serverDraws = rest.move_draws?.[drawKey] || [];
  const serverRoll = Number(rest.move_draw_rolls?.[drawKey] || 0);
  const cardCount = hasRunTalent(rest, "growth_more_choices") ? 16 : 8;
  const [order, setOrder] = useState(() => Array.from({length: cardCount}, (_, index) => `card-${index}`));
  const [step, setStep] = useState<"draw" | "replace">("draw");
  const [phase, setPhase] = useState<"idle" | "shuffle" | "reveal">("idle");
  const [selectedMoveId, setSelectedMoveId] = useState("");
  const [selectedReplaceSlot, setSelectedReplaceSlot] = useState<number | null>(null);
  const [applying, setApplying] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [revealedMoves, setRevealedMoves] = useState<PricedMove[]>([]);
  const latestDrawRef = useRef({drawKey, roll: serverRoll, draws: serverDraws});
  latestDrawRef.current = {drawKey, roll: serverRoll, draws: serverDraws};
  const revealOrder = revealedMoves.map((move, index) => `${move.id || move.name}-${index}`);
  const selectedMove = revealedMoves.find(move => toId(move.id || move.name) === toId(selectedMoveId)) || null;

  useEffect(() => {
    setOrder(Array.from({length: cardCount}, (_, index) => `card-${index}`));
    setStep("draw");
    setPhase("idle");
    setSelectedMoveId("");
    setSelectedReplaceSlot(null);
    setApplying(false);
    setDrawing(false);
    setRevealedMoves([]);
  }, [slot, drawMoveSlot, cardCount]);

  async function drawCandidates() {
    if (drawing) return;
    const wait = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));
    const waitForDraws = async (startRoll: number) => {
      const startedAt = Date.now();
      let fallbackDraws: PricedMove[] | null = null;
      while (Date.now() - startedAt < MOVE_DRAW_RESULT_WAIT_MS) {
        const latest = latestDrawRef.current;
        if (latest.drawKey === drawKey && latest.draws.length) {
          fallbackDraws = latest.draws;
          if (latest.roll > startRoll) return latest.draws;
        }
        await wait(80);
      }
      return fallbackDraws;
    };
    const orderSeed = Date.now();
    const nextOrder = Array.from({length: cardCount}, (_, index) => `card-${orderSeed}-${index}`);
    const startRoll = serverRoll;
    setDrawing(true);
    setSelectedMoveId("");
    setSelectedReplaceSlot(null);
    setRevealedMoves([]);
    setStep("draw");
    setPhase("idle");
    setOrder(nextOrder);
    const drawPromise = Promise.resolve(onAction({type: "draw_moves", slot, moveSlot: drawMoveSlot}));
    await wait(MOVE_DRAW_FLIP_BACK_MS);
    setPhase("shuffle");
    await wait(80);
    for (let step = 0; step < 3; step += 1) {
      setOrder(current => shuffleOrder(current, step));
      await wait(MOVE_DRAW_SHUFFLE_STEP_MS);
    }
    const ok = await drawPromise;
    if (ok === false) {
      setDrawing(false);
      setPhase("idle");
      return;
    }
    await wait(MOVE_DRAW_FINAL_HOLD_MS);
    const nextDraws = await waitForDraws(startRoll);
    if (!nextDraws?.length) {
      setDrawing(false);
      setPhase("idle");
      return;
    }
    setRevealedMoves(nextDraws.slice(0, cardCount));
    setSelectedMoveId("");
    setPhase("reveal");
    setDrawing(false);
  }

  function confirmLearning() {
    if (!selectedMove) return;
    setSelectedReplaceSlot(null);
    setStep("replace");
  }

  async function confirmReplace() {
    if (!selectedMove || selectedReplaceSlot === null || applying) return;
    setApplying(true);
    try {
      const ok = await Promise.resolve(onAction({type: "apply_drawn_move", slot, moveSlot: selectedReplaceSlot, moveId: selectedMoveId, drawMoveSlot}));
      if (ok !== false) onClose();
    } finally {
      setApplying(false);
    }
  }

  return (
    <PokopiaModal className="move-draw-modal" labelledBy="move-draw-title" onClose={onClose}>
      {requestClose => (
        <motion.section className="move-draw-content" variants={pokopiaItemVariants}>
          <header>
            <div>
              <h2 id="move-draw-title">{step === "replace" ? "确认学习" : "技能随机"}</h2>
              <p>{step === "replace" && selectedMove ? `${displayName(pokemon)} 准备学习 ${selectedMove.name_zh || selectedMove.name}` : `${displayName(pokemon)}：抽取可学习技能${currentMove ? `（参考 ${currentMove.name_zh || currentMove.name}）` : ""}`}</p>
            </div>
            <span>{coinCostLabel(rest.costs.move_draw)}</span>
          </header>
          {step === "draw" ? (
            <>
              <Reorder.Group as="div" axis="y" values={phase === "reveal" ? revealOrder : order} onReorder={phase === "reveal" ? () => undefined : setOrder} className={`move-draw-card-grid ${cardCount > 8 ? "large" : ""} ${phase === "reveal" ? "revealed" : "shuffling"}`}>
                {phase === "reveal" ? revealedMoves.map((move, index) => {
                  const moveId = toId(move.id || move.name);
                  return (
                    <Reorder.Item as="button" value={`${moveId}-${index}`} drag={false} transition={moveDrawLayoutTransition} className={moveCardClassName({moveType: move.type || move.type_zh, size: "draw", selected: selectedMoveId === moveId, className: "quick-dex-move-card move-draw-choice"})} onClick={() => setSelectedMoveId(moveId)} key={`${moveId}-${index}`}>
                      <MoveCardContent name={move.name_zh || move.name} moveType={move.type || move.type_zh} typeLabel={move.type_zh || move.type || "一般"} category={move.category_zh || move.category || "变化"} pp={move.pp || "--"} power={move.power || "--"} accuracy={move.accuracy ?? "必中"} />
                    </Reorder.Item>
                  );
                }) : order.map(id => (
                  <Reorder.Item as="div" value={id} drag={false} transition={moveDrawLayoutTransition} className="move-draw-card-back" key={id}>
                    <i>TM</i>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
              <footer>
                <button disabled={drawing} onClick={drawCandidates}>{phase === "reveal" ? `继续随机（${coinCostLabel(rest.costs.move_draw)}）` : drawing ? "随机中" : `开始随机（${coinCostLabel(rest.costs.move_draw)}）`}</button>
                {phase === "reveal" ? <button disabled={!selectedMove} onClick={confirmLearning}>确认学习</button> : null}
                <button onClick={() => requestClose()}>取消</button>
              </footer>
            </>
          ) : selectedMove ? (
            <div className="move-draw-replace-stage">
              <MoveReplacePanel
                pokemon={pokemon}
                state={rest.player_state[slot]}
                newMove={selectedMove}
                selectedMoveSlot={selectedReplaceSlot}
                busy={applying}
                onSelectMoveSlot={setSelectedReplaceSlot}
                onConfirm={() => void confirmReplace()}
                onCancel={() => setStep("draw")}
              />
            </div>
          ) : null}
        </motion.section>
      )}
    </PokopiaModal>
  );
}

function shuffleOrder(order: string[], step: number): string[] {
  const next = [...order];
  for (let index = 0; index < next.length; index += 1) {
    const swapIndex = (index * 5 + step * 3 + 1) % next.length;
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function StatsAdjustModal({rest, initialSlot = 0, onClose, onAction, embedded = false}: {rest: NonNullable<DesktopGameState["rest"]>; initialSlot?: number; onClose: () => void; onAction: RestActionHandler; embedded?: boolean}) {
  const [slot, setSlot] = useState(initialSlot);
  const pokemon = rest.player_display[slot];
  return (
    <EmbeddedOrModal embedded={embedded}>
      <section className="rest-edit-modal stats-editor">
        <header><h2>重置数值</h2><button onClick={onClose}>关闭</button></header>
        <div className="editor-layout">
          <aside className="editor-side-list">{rest.player_display.map((entry, index) => <button className={slot === index ? "selected" : ""} onClick={() => setSlot(index)} key={`${entry.species_id}-stats-editor`}><PokemonSprite pokemon={entry} alt={displayName(entry)} /><span>{displayName(entry)}</span></button>)}</aside>
          <section className="editor-main stats-editor-main">
            <header className="stats-editor-title">
              <h3>{displayName(pokemon)}</h3>
              <button className="dice-button" onClick={() => onAction({type: "randomize_all_stats", slot})}>🎲（{coinCostLabel(rest.costs.randomize_all)}）</button>
            </header>
            <div className="stats-meta-grid">
              <div><span>性格</span><strong>{pokemon.nature_zh || pokemon.nature || "未知"}</strong><button className="dice-button small" onClick={() => onAction({type: "randomize_stat_part", slot, part: "nature"})}>🎲（{coinCostLabel(rest.costs.randomize_part)}）</button></div>
              <div><span>特性</span><strong>{pokemon.ability_zh || pokemon.ability || "未知"}</strong><button className="dice-button small" onClick={() => onAction({type: "randomize_stat_part", slot, part: "ability"})}>🎲（{coinCostLabel(rest.costs.randomize_part)}）</button></div>
            </div>
            <div className="stat-reset-table">
              <div className="stat-reset-head"><span /><span>能力值</span><span><button className="dice-button small" onClick={() => onAction({type: "randomize_stat_part", slot, part: "ivs"})}>个体 🎲（{coinCostLabel(rest.costs.randomize_part)}）</button></span><span><button className="dice-button small" onClick={() => onAction({type: "randomize_stat_part", slot, part: "evs"})}>努力值 🎲（{coinCostLabel(rest.costs.randomize_part)}）</button></span></div>
              {STAT_ROWS.map(([stat, label]) => <div className="stat-reset-row" key={stat}><span>{label}<b>{statMarker(pokemon, stat)}</b></span><strong>{pokemon.stats[stat] ?? "?"}</strong><strong>{pokemon.ivs[stat] ?? "?"}</strong><strong>{pokemon.evs[stat] ?? "?"}</strong></div>)}
            </div>
          </section>
        </div>
      </section>
    </EmbeddedOrModal>
  );
}
