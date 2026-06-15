import {useEffect, useRef, useState} from "react";
import type {CSSProperties, ReactElement} from "react";
import type {CoinLedgerEntry, DesktopGameState, PricedMove, RestAction, RestEventStatusView, TalentView} from "@changebattle/shared";
import {AnimatePresence, motion, Reorder} from "motion/react";
import {DraggableFloatingButton} from "../feedback/DraggableFloatingButton";
import {ScreenToast} from "../feedback/ScreenToast";
import {PokopiaModal, pokopiaItemVariants} from "../motion/PokopiaModal";
import {MoveCard, MoveCardContent, moveCardClassName} from "../move/MoveCard";
import {MoveReplacePanel} from "../bag/MoveReplacePanel";
import {RestBagPanel} from "../bag/RestBagPanel";
import {PokemonSprite, abilityDescription, coinCostLabel, conditionText, displayName, hpTone, moveDescription, parseHp, runtimeMoveLabel, statLine, statMarker, statusCode, statusLabel, toId, trainerImageUrl, userFacingError} from "../../lib/ui";
import {STAT_ROWS} from "../../lib/ui";
import {RestHeader} from "./RestHeader";
import {RestMainPanelHost} from "./RestMainPanelHost";
import {RestToolBar, type RestToolItem} from "./RestToolBar";
import {RestEventPrompt} from "./RestEventPrompt";
import {NightSkyPanel} from "./NightSkyPanel";
import {RunTalentPanel} from "./RunTalentPanel";
import {RestExchangePanel} from "./RestExchangePanel";
import {RaidExchangePanel} from "./RaidExchangePanel";
import {RestShopPanel} from "./RestShopPanel";
import {RestForgePanel} from "./RestForgePanel";
import {RainbowRocketSupportPanel} from "./RainbowRocketSupportPanel";
import {EventMoveServicePanel} from "./EventMoveServicePanel";
import {ItemRecyclerPanel} from "./ItemRecyclerPanel";
import {ProfiteerShopPanel} from "./ProfiteerShopPanel";
import {ScoreBetPanel} from "./ScoreBetPanel";
import {DoctorEventPanel} from "./DoctorEventPanel";
import {EventLevelPanel} from "./EventLevelPanel";
import type {RestActionHandler, RestActionResult} from "./restActionTypes";
import {RestMyTeamPanel} from "./team/RestMyTeamPanel";
import "./RestView.css";

export function ExchangeView({exchange, onSkip, onExchange}: {exchange: DesktopGameState["exchange"]; onSkip: () => void; onExchange: (ownIndex: number, enemyIndex: number) => void}) {
  const [own, setOwn] = useState(0);
  const [enemy, setEnemy] = useState(0);
  if (!exchange) return null;
  return <div className="exchange-page"><h2>胜利后交换</h2><div className="exchange-columns exchange-columns-with-label"><div><h3>你的队伍</h3>{exchange.player_display.map((pokemon, index) => <button className={`exchange-card ${own === index ? "selected" : ""}`} onClick={() => setOwn(index)} key={pokemon.species_id}><PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} /><span>{displayName(pokemon)}</span><small>{pokemon.item_zh || "无道具"}</small></button>)}</div><div className="exchange-center-label" aria-hidden="true"><span>交换</span></div><div><h3>敌方队伍</h3>{exchange.enemy_display.map((pokemon, index) => <button className={`exchange-card ${enemy === index ? "selected" : ""}`} onClick={() => setEnemy(index)} key={pokemon.species_id}><PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} /><span>{displayName(pokemon)}</span><small>{pokemon.item_zh || "无道具"}</small></button>)}</div></div><div className="command-row"><button onClick={() => onExchange(own, enemy)}>交换</button><button onClick={onSkip}>跳过</button></div></div>;
}

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
    "--screen-toast-left": "18px",
    "--screen-toast-min-width": "312px",
    "--screen-toast-max-width": "520px",
    "--screen-toast-border-width": "2px",
    "--screen-toast-border-radius": "6px",
    "--screen-toast-background": "rgb(31 27 29 / 82%)",
    "--screen-toast-padding-y": "10px",
    "--screen-toast-padding-x": "14px",
    "--screen-toast-font-size": "14px",
    "--screen-toast-line-height": "1.32",
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
  const primaryToolItems = [
    {id: "myTeam", label: "我的队伍"},
    {id: "bag", label: "背包"},
    {id: "nightSky", label: "进度图", badge: `${revealedSkyCount}/${(nightSkyRows.length || rest.battles) * 3}`},
  ];
  const toolItems: RestToolItem[] = [
    {id: "exchange", label: "交换"},
    {id: "shop", label: "商店"},
    {id: "forge", label: "熔炉"},
    ...(rest.recycler_available ? [{id: "recycler", label: "道具回收商", event: true}] : []),
    ...(rest.event_services?.doctor ? [{id: "eventDoctor", label: "蹩脚医生", event: true}] : []),
    ...(rest.event_services?.tutor ? [{id: "eventTutor", label: "讲师老奶奶", event: true}] : []),
    ...(rest.event_services?.egg ? [{id: "eventEgg", label: "培育屋爷爷", event: true}] : []),
    ...(rest.event_services?.raid_exchange ? [{id: "raidExchange", label: "骇人奇袭", event: true}] : []),
    ...(rest.event_services?.score_bet ? [{id: "scoreBet", label: "重金下注", event: true}] : []),
    ...(rest.event_services?.profiteer_shop ? [{id: "profiteerShop", label: "乘火打劫", event: true}] : []),
    ...(Number(rest.event_services?.level_points || 0) > 0 ? [{id: "eventLevel", label: "分配等级", badge: rest.event_services?.level_points, event: true}] : []),
    ...manualTalents.map(talent => ({id: `talent:${talent.id}`, label: talent.name, used: runTalentActionUsed(rest, talent.id), badge: runTalentActionUsed(rest, talent.id) ? "已用" : undefined})),
  ];
  const activeToolId = activePanel === "talentAction" && talentActionId ? `talent:${talentActionId}` : activePanel;

  function openManualTalent(talent: TalentView) {
    if (runTalentActionUsed(rest as NonNullable<DesktopGameState["rest"]>, talent.id)) return;
    setTalentActionId(talent.id);
    setActivePanel("talentAction");
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
      <RestHeader battleNo={rest.battle_no} battles={rest.battles} wins={rest.wins} coins={rest.coins ?? 0} tools={primaryToolItems.map(item => ({...item, selected: activeToolId === item.id}))} nextDisabled={shouldPromptRainbowRocket} nextTitle={shouldPromptRainbowRocket ? "请先处理彩虹火箭队支援" : undefined} onOpenCoinLedger={() => setCoinLedgerOpen(true)} onAbort={() => setAbortConfirmOpen(true)} onNext={() => onAction({type: "next"})} onSelectTool={selectTool} />
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
            {activePanel === "exchange" ? <RestExchangePanel rest={rest} onClose={() => setActivePanel(null)} onAction={fireAction} /> : null}
            {activePanel === "bag" ? <RestBagPanel rest={rest} initialTarget={bagTargetSlot} onAction={runRestAction} /> : null}
            {activePanel === "recycler" ? <ItemRecyclerPanel embedded rest={rest} onClose={() => setActivePanel(null)} onAction={fireAction} /> : null}
            {activePanel === "eventDoctor" ? <DoctorEventPanel embedded rest={rest} onClose={() => setActivePanel(null)} onAction={runRestAction} /> : null}
            {activePanel === "eventTutor" ? <EventMoveServicePanel embedded rest={rest} service="tutor" onClose={() => setActivePanel(null)} onAction={runRestAction} /> : null}
            {activePanel === "eventEgg" ? <EventMoveServicePanel embedded rest={rest} service="egg" onClose={() => setActivePanel(null)} onAction={runRestAction} /> : null}
            {activePanel === "raidExchange" ? <RaidExchangePanel rest={rest} onClose={() => setActivePanel(null)} onAction={runRestAction} /> : null}
            {activePanel === "scoreBet" ? <ScoreBetPanel embedded rest={rest} onClose={() => setActivePanel(null)} onAction={runRestAction} /> : null}
            {activePanel === "profiteerShop" ? <ProfiteerShopPanel embedded rest={rest} onClose={() => setActivePanel(null)} onAction={runRestAction} /> : null}
            {activePanel === "eventLevel" ? <EventLevelPanel embedded rest={rest} onClose={() => setActivePanel(null)} onAction={runRestAction} /> : null}
            {activePanel === "talentAction" && activeTalentAction ? <RunTalentPanel embedded talent={activeTalentAction} rest={rest} onClose={() => setActivePanel(null)} onAction={fireAction} /> : null}
            {activePanel === "nightSky" ? <NightSkyPanel embedded rest={rest} onClose={() => setActivePanel(null)} onAction={fireAction} /> : null}
            {activePanel === "shop" ? <RestShopPanel rest={rest} shop={rest.shop} onClose={() => setActivePanel(null)} onRoll={shopKind => runRestAction({type: "roll_shop", shopKind})} onBuy={offerId => runRestAction({type: "buy_shop_offer", offerId}, "道具已购买")} onBarterBuy={(offerId, itemIds) => runRestAction({type: "event_barter_buy", offerId, itemIds}, "道具已交换")} /> : null}
            {activePanel === "forge" ? <RestForgePanel rest={rest} onClose={() => setActivePanel(null)} onAction={runRestAction} onNotice={showToast} /> : null}
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
      {shouldPromptRainbowRocket && rest.rainbow_rocket_support ? <RainbowRocketSupportPanel rest={rest} onAction={runRestAction} /> : null}
      {shouldPromptRestEvent ? <RestEventPrompt rest={rest} onAction={runRestAction} /> : null}
      {shouldPromptNamedChallenge ? <NamedChallengePrompt rest={rest} onAction={runRestAction} /> : null}
    </div>
  );
}

type RestWorkspacePanel = "myTeam" | "exchange" | "bag" | "recycler" | "eventDoctor" | "eventTutor" | "eventEgg" | "raidExchange" | "scoreBet" | "profiteerShop" | "eventLevel" | "talentAction" | "nightSky" | "shop" | "forge" | "pokemon" | "moveEditor" | "statsEditor" | null;

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

function isManualRunTalent(id: string): boolean {
  return ["growth_all_in", "exchange_trust", "growth_lead_change", "economy_bp_exchange"].includes(id);
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
