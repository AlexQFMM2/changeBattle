import {useEffect, useState} from "react";
import type {CSSProperties} from "react";
import type {BagItemView, DesktopGameState, MoveSummary, RentalPokemon, RestAction, TalentView} from "@changebattle/shared";
import {ItemIcon, PokemonSprite, abilityDescription, coinCostLabel, conditionText, displayName, itemCategoryLabel, moveDescription, runtimeMoveLabel, statLine, statMarker, statusCode, statusLabel, talentShortText, toId, trainerImageUrl} from "../../lib/ui";
import {STAT_ROWS} from "../../lib/ui";

export function ExchangeView({exchange, onSkip, onExchange}: {exchange: DesktopGameState["exchange"]; onSkip: () => void; onExchange: (ownIndex: number, enemyIndex: number) => void}) {
  const [own, setOwn] = useState(0);
  const [enemy, setEnemy] = useState(0);
  if (!exchange) return null;
  return <div className="exchange-page"><h2>胜利后交换</h2><div className="exchange-columns exchange-columns-with-label"><div><h3>你的队伍</h3>{exchange.player_display.map((pokemon, index) => <button className={`exchange-card ${own === index ? "selected" : ""}`} onClick={() => setOwn(index)} key={pokemon.species_id}><PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} /><span>{displayName(pokemon)}</span><small>{pokemon.item_zh || "无道具"}</small></button>)}</div><div className="exchange-center-label" aria-hidden="true"><span>交换</span></div><div><h3>敌方队伍</h3>{exchange.enemy_display.map((pokemon, index) => <button className={`exchange-card ${enemy === index ? "selected" : ""}`} onClick={() => setEnemy(index)} key={pokemon.species_id}><PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} /><span>{displayName(pokemon)}</span><small>{pokemon.item_zh || "无道具"}</small></button>)}</div></div><div className="command-row"><button onClick={() => onExchange(own, enemy)}>交换</button><button onClick={onSkip}>跳过</button></div></div>;
}

export function RestView({rest, message, onAction}: {rest: DesktopGameState["rest"]; message?: string; onAction: (action: RestAction) => boolean | void | Promise<boolean | void>}) {
  const [pokemonModalSlot, setPokemonModalSlot] = useState<number | null>(null);
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [recyclerOpen, setRecyclerOpen] = useState(false);
  const [talentOpen, setTalentOpen] = useState(false);
  const [talentActionId, setTalentActionId] = useState<string | null>(null);
  const [nightSkyOpen, setNightSkyOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [moveEditorSlot, setMoveEditorSlot] = useState<number | null>(null);
  const [statsEditorSlot, setStatsEditorSlot] = useState<number | null>(null);
  const [abortConfirmOpen, setAbortConfirmOpen] = useState(false);

  if (!rest) return <div className="loading-panel"><strong>正在整理队伍...</strong></div>;
  const hasScoutTalent = hasRunTalent(rest, "intel_rumor");
  const nightSkyRows = rest.night_sky?.rows || [];
  const revealedSkyCount = nightSkyRows.reduce((sum, row) => sum + Math.min(3, Number(row.revealed || 0)), 0);
  const manualTalents = (rest.talents || []).filter(talent => isManualRunTalent(talent.id));
  const activeTalent = rest.talents?.find(talent => talent.id === talentActionId) || null;
  const fireAction = (action: RestAction) => {
    void onAction(action);
  };

  return (
    <div className="rest-page">
      <header className="rest-header">
        <div>
          <h2>休整菜单</h2>
          <p>第 {rest.battle_no}/{rest.battles} 场后　连胜 {rest.wins}　金币 {rest.coins ?? 0}</p>
          <button className="talent-inline-button" onClick={() => setTalentOpen(true)}>本局天赋：{rest.talents?.length ? rest.talents.map(talent => `${talent.name}（${talent.category}）`).join(" / ") : "当前无天赋"}</button>
          {message ? <p className="rest-message">{message}</p> : null}
        </div>
        <div className="rest-header-actions">
          <button onClick={() => setExchangeOpen(true)}>交换</button>
          <button onClick={() => setBagOpen(true)}>背包</button>
          {rest.recycler_available ? <button className="event-button" onClick={() => setRecyclerOpen(true)}>道具回收商</button> : null}
          <button onClick={() => setShopOpen(true)}>购买道具</button>
          <button className="danger-button" onClick={() => setAbortConfirmOpen(true)}>中断挑战</button>
          <button onClick={() => onAction({type: "next"})}>下一场</button>
        </div>
      </header>
      <section className="rest-talent-action-row">
        <button onClick={() => setTalentOpen(true)}>携带天赋</button>
        {hasScoutTalent ? <button onClick={() => setNightSkyOpen(true)}>小道消息 <small>{revealedSkyCount}/{(nightSkyRows.length || rest.battles) * 3}</small></button> : null}
        {manualTalents.map(talent => {
          const used = runTalentActionUsed(rest, talent.id);
          return <button className={used ? "used" : ""} disabled={used} onClick={() => setTalentActionId(talent.id)} key={`manual-${talent.id}`}>{talent.name}{used ? <small>已用</small> : null}</button>;
        })}
      </section>
      <section className="rest-team-panel">
        <h3>你的队伍</h3>
        <div className="rest-team-list">
          {rest.player_display.map((pokemon, index) => {
            const state = rest.player_state[index];
            const status = statusCode(state?.condition, state?.status);
            return <button className="rest-team-card" onClick={() => setPokemonModalSlot(index)} key={`${pokemon.species_id}-${index}`}><PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} /><strong>{index + 1}. {displayName(pokemon)}</strong>{status ? <i className={`status-badge ${status}`}>{statusLabel(status)}</i> : null}<span>{conditionText(state?.condition)}</span><small>{pokemon.item_zh || "无道具"}　{(state?.moves || []).map((move, moveIndex) => `${runtimeMoveLabel(pokemon, move, moveIndex)} ${move.pp}/${move.maxpp}`).join(" / ")}</small></button>;
          })}
        </div>
      </section>
      {pokemonModalSlot !== null ? <RestPokemonModal rest={rest} initialSlot={pokemonModalSlot} onClose={() => setPokemonModalSlot(null)} onMove={slot => { setPokemonModalSlot(null); setMoveEditorSlot(slot); }} onUnequip={slot => { setPokemonModalSlot(null); onAction({type: "unequip_item", slot}); }} onStats={slot => { setPokemonModalSlot(null); setStatsEditorSlot(slot); }} /> : null}
      {exchangeOpen ? <RestExchangeModal rest={rest} onClose={() => setExchangeOpen(false)} onAction={fireAction} /> : null}
      {bagOpen ? <BagManageModal rest={rest} onClose={() => setBagOpen(false)} onAction={fireAction} /> : null}
      {recyclerOpen ? <ItemRecyclerModal rest={rest} onClose={() => setRecyclerOpen(false)} onAction={fireAction} /> : null}
      {talentOpen ? <RunTalentModal rest={rest} onClose={() => setTalentOpen(false)} onAction={fireAction} /> : null}
      {nightSkyOpen ? <NightSkyModal rest={rest} onClose={() => setNightSkyOpen(false)} onAction={fireAction} /> : null}
      {activeTalent ? <RunTalentActionModal talent={activeTalent} rest={rest} onClose={() => setTalentActionId(null)} onAction={fireAction} /> : null}
      {shopOpen ? <ShopModal rest={rest} shop={rest.shop} onClose={() => setShopOpen(false)} onRoll={preferredCategory => onAction({type: "roll_shop", preferredCategory})} onBuy={offerId => fireAction({type: "buy_shop_offer", offerId})} /> : null}
      {moveEditorSlot !== null ? <MoveAdjustModal rest={rest} initialSlot={moveEditorSlot} onClose={() => setMoveEditorSlot(null)} onAction={fireAction} /> : null}
      {statsEditorSlot !== null ? <StatsAdjustModal rest={rest} initialSlot={statsEditorSlot} onClose={() => setStatsEditorSlot(null)} onAction={fireAction} /> : null}
      {abortConfirmOpen ? (
        <div className="modal-layer">
          <section className="confirm-modal">
            <h2>中断挑战</h2>
            <p>确认后将直接结束本局挑战，当前连胜归零，历史最高连胜保留。</p>
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
    </div>
  );
}

function hasRunTalent(rest: NonNullable<DesktopGameState["rest"]>, id: string): boolean {
  return Boolean(rest.talents?.some(talent => talent.id === id));
}

function isActiveRunTalent(id: string): boolean {
  return ["growth_all_in", "intel_rumor", "intel_shop_strategy", "intel_reroute", "exchange_trust", "growth_lead_change", "economy_bp_exchange", "economy_recycle_receipt", "economy_portfolio", "economy_bargainer"].includes(id);
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

function RestPokemonModal({rest, initialSlot, onClose, onMove, onUnequip, onStats}: {rest: NonNullable<DesktopGameState["rest"]>; initialSlot: number; onClose: () => void; onMove: (slot: number) => void; onUnequip: (slot: number) => void; onStats: (slot: number) => void}) {
  const [slot, setSlot] = useState(initialSlot);
  const [tab, setTab] = useState<"info" | "moves" | "stats" | "items">("info");
  const pokemon = rest.player_display[slot] || rest.player_display[0];
  const state = rest.player_state[slot] || rest.player_state[0];
  const revealTraining = hasRunTalent(rest, "intel_god_eye");
  if (!pokemon) return null;
  return (
    <div className="modal-layer">
      <section className="rest-pokemon-modal">
        <aside className="detail-team-list">
          {rest.player_display.map((entry, index) => <button className={slot === index ? "selected" : ""} onClick={() => setSlot(index)} key={`${entry.species_id}-rest-detail`}><PokemonSprite pokemon={entry} alt={displayName(entry)} /><span>{displayName(entry)}</span><small>{conditionText(rest.player_state[index]?.condition)}</small></button>)}
        </aside>
        <main className="rest-pokemon-detail">
          <header>
            <div><h2>{displayName(pokemon)}</h2><p>Lv{pokemon.level}　{pokemon.types_zh?.join(" / ") || pokemon.types.join(" / ")}　{pokemon.item_zh || "无道具"}</p></div>
            <button onClick={onClose}>关闭</button>
          </header>
          <div className="detail-tabs">
            <button className={tab === "info" ? "selected" : ""} onClick={() => setTab("info")}>基础信息</button>
            <button className={tab === "moves" ? "selected" : ""} onClick={() => setTab("moves")}>技能</button>
            <button className={tab === "stats" ? "selected" : ""} onClick={() => setTab("stats")}>数值</button>
            <button className={tab === "items" ? "selected" : ""} onClick={() => setTab("items")}>道具</button>
          </div>
          <section className="detail-tab-panel">
            {tab === "info" ? <div className="detail-info-grid"><p>HP：{conditionText(state?.condition)}</p><p>性别：{pokemon.gender || "未知"}</p><p>特性：{pokemon.ability_zh || pokemon.ability}</p><p>性格：{pokemon.nature_zh || pokemon.nature}</p><p>闪光：{pokemon.shiny ? "是" : "否"}</p><p>职责：{pokemon.role_zh || pokemon.role || "无"}</p><p className="wide">{abilityDescription(pokemon)}</p></div> : null}
            {tab === "moves" ? <div className="detail-move-list">{pokemon.moves.map((move, index) => <article key={`${move.id}-${index}`}><strong>{index + 1}. {move.name_zh || move.name}</strong><span>{move.type_zh}/{move.category_zh}　威力 {move.power || "--"}　PP {state?.moves?.[index]?.pp ?? move.pp}/{state?.moves?.[index]?.maxpp ?? move.pp}</span><small>{moveDescription(move)}</small></article>)}</div> : null}
            {tab === "stats" ? <div className="stat-grid">{STAT_ROWS.map(([stat, label]) => <div key={stat}><span>{label}</span><strong>{statLine(pokemon, stat, revealTraining)}</strong></div>)}</div> : null}
            {tab === "items" ? <div className="detail-info-grid"><p>当前携带：{pokemon.item_zh || "无道具"}</p><p className="wide">{pokemon.item_desc_zh || pokemon.item_desc || "暂无道具说明"}</p><p>背包携带道具：{rest.bag_categories?.held?.length || 0}</p><p>技能机器：{rest.bag_categories?.tm?.length || 0}</p></div> : null}
          </section>
          <footer className="command-row">
            <button onClick={() => onMove(slot)}>更换技能</button>
            {pokemon.item_id ? <button onClick={() => onUnequip(slot)}>卸下道具</button> : null}
            <button onClick={() => onStats(slot)}>重置数值</button>
            <button onClick={onClose}>关闭</button>
          </footer>
        </main>
      </section>
    </div>
  );
}

function RestExchangeModal({rest, onClose, onAction}: {rest: NonNullable<DesktopGameState["rest"]>; onClose: () => void; onAction: (action: RestAction) => void | Promise<void>}) {
  const [own, setOwn] = useState(0);
  const [enemy, setEnemy] = useState(0);
  const canExchange = rest.costs.exchange !== null && rest.enemy_display.length > 0 && !rest.taken_enemy_slots.includes(enemy + 1);
  const canAllIn = hasRunTalent(rest, "growth_all_in") && !rest.all_in_used;
  return (
    <div className="modal-layer">
      <section className="rest-edit-modal exchange-rest-modal">
        <header><div><h2>交换宝可梦</h2><p>本次费用：{coinCostLabel(rest.costs.exchange)}　已交换 {rest.exchange_count}/3</p></div><button onClick={onClose}>关闭</button></header>
        <div className="rest-exchange-grid">
          <div>{rest.player_display.map((pokemon, index) => <button className={`mini-pokemon-card ${own === index ? "selected" : ""}`} onClick={() => setOwn(index)} key={`${pokemon.species_id}-own-${index}`}><PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} /><span>{displayName(pokemon)}</span></button>)}</div>
          <div className="exchange-center-label" aria-hidden="true"><span>交换</span></div>
          <div>{rest.enemy_display.map((pokemon, index) => <button className={`mini-pokemon-card ${enemy === index ? "selected" : ""}`} disabled={rest.taken_enemy_slots.includes(index + 1)} onClick={() => setEnemy(index)} key={`${pokemon.species_id}-enemy-${index}`}><PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} /><span>{displayName(pokemon)}</span>{rest.taken_enemy_slots.includes(index + 1) ? <small>已交换</small> : null}</button>)}</div>
        </div>
        <div className="command-row">
          <button disabled={!canExchange} onClick={() => onAction({type: "exchange", ownIndex: own, enemyIndex: enemy})}>确认交换</button>
          {hasRunTalent(rest, "growth_all_in") ? <button disabled={!canAllIn} onClick={() => onAction({type: "all_in_exchange", ownIndex: own})}>{rest.all_in_used ? "孤注一掷已用" : "孤注一掷"}</button> : null}
          <button onClick={onClose}>关闭</button>
        </div>
      </section>
    </div>
  );
}

function tmMoveId(item?: BagItemView): string {
  if (!item) return "";
  if (item.move_id) return toId(item.move_id);
  return item.id.startsWith("tm:") ? toId(item.id.slice(3)) : "";
}

function BagManageModal({rest, onClose, onAction}: {rest: NonNullable<DesktopGameState["rest"]>; onClose: () => void; onAction: (action: RestAction) => void | Promise<void>}) {
  const items = Object.values(rest.bag_categories || {consumable: [], held: [], tm: []}).flat();
  const [itemId, setItemId] = useState(items[0]?.id || "");
  const [target, setTarget] = useState(0);
  const [moveSlot, setMoveSlot] = useState(0);
  const [tmLegalBySlot, setTmLegalBySlot] = useState<Record<number, string[]>>({});
  const [tmLoading, setTmLoading] = useState(false);
  const selected = items.find(item => item.id === itemId) || items[0];
  const targetPokemon = rest.player_display[target] || rest.player_display[0];
  const targetState = rest.player_state[target] || rest.player_state[0];
  const selectedMoveId = tmMoveId(selected);
  const isTm = selected?.category === "tm";
  const isConsumable = selected?.category === "consumable";
  const isHeld = selected?.category === "held";

  useEffect(() => {
    if (items.length && !items.some(item => item.id === itemId)) setItemId(items[0].id);
  }, [items, itemId]);

  useEffect(() => {
    let cancelled = false;
    setMoveSlot(0);
    setTmLegalBySlot({});
    if (!isTm || !selectedMoveId) return () => { cancelled = true; };
    setTmLoading(true);
    void Promise.all(rest.player_display.map((_pokemon, index) => window.changeBattle!.learnableMoves(index).then(moves => [index, moves.map(move => toId(move.id || move.name))] as const))).then(entries => {
      if (cancelled) return;
      setTmLegalBySlot(Object.fromEntries(entries));
    }).finally(() => {
      if (!cancelled) setTmLoading(false);
    });
    return () => { cancelled = true; };
  }, [isTm, selectedMoveId, rest.player_display]);

  function targetAlreadyKnows(slot: number): boolean {
    const pokemon = rest.player_display[slot];
    return Boolean(selectedMoveId && pokemon?.moves.some(move => toId(move.id || move.name) === selectedMoveId));
  }

  function targetCanLearn(slot: number): boolean {
    if (!isTm) return true;
    if (!selectedMoveId || targetAlreadyKnows(slot)) return false;
    return Boolean(tmLegalBySlot[slot]?.includes(selectedMoveId));
  }

  function targetHint(slot: number): string {
    if (!isTm) return conditionText(rest.player_state[slot]?.condition);
    if (tmLoading) return "读取可学习技能...";
    if (targetAlreadyKnows(slot)) return "已学会";
    return targetCanLearn(slot) ? "可以学习" : "不能学习";
  }

  function useSelectedItem() {
    if (!selected) return;
    if (isConsumable) {
      onAction({type: "use_item", itemId: selected.id, slot: target, moveSlot: moveSlot || undefined, context: "rest"});
      onClose();
    } else if (isTm) {
      if (!targetCanLearn(target)) return;
      onAction({type: "use_tm", itemId: selected.id, slot: target, moveSlot});
      onClose();
    } else if (isHeld) {
      onAction({type: "equip_item", itemId: selected.id, slot: target});
      onClose();
    }
  }

  function actionLabel(): string {
    if (!selected) return "选择道具";
    if (isConsumable) return "使用";
    if (isTm) return targetCanLearn(target) ? "学习" : "不能学习";
    return targetPokemon?.item_id ? "交换携带道具" : "携带";
  }

  return (
    <div className="modal-layer">
      <section className="shop-modal bag-manage-modal">
        <header><div><h2>本局背包</h2><p>选择道具后，再选择目标宝可梦。</p></div><button onClick={onClose}>关闭</button></header>
        <div className="bag-manage-layout">
          <div className="shop-list bag-item-list">
            {items.length ? items.map(item => <button className={selected?.id === item.id ? "selected" : ""} onClick={() => setItemId(item.id)} key={item.id}><ItemIcon item={item} /><strong>{item.name_zh || item.name}</strong><span>x{item.count}　{itemCategoryLabel(item.category)}</span><small>{item.desc_zh || item.desc || item.name}</small></button>) : <p>背包为空。</p>}
          </div>
          <section className="bag-action-panel">
            {selected ? <>
              <h3>{selected.name_zh || selected.name}</h3>
              <p>{itemCategoryLabel(selected.category)}　x{selected.count}</p>
              <div className="detail-team-list compact-targets">
                {rest.player_display.map((pokemon, index) => {
                  const disabled = isTm && !tmLoading && !targetCanLearn(index);
                  return <button className={target === index ? "selected" : ""} disabled={disabled} onClick={() => { setTarget(index); setMoveSlot(0); }} key={`${pokemon.species_id}-bag-target-${index}`}><PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} /><span>{displayName(pokemon)}</span><small>{targetHint(index)}</small></button>;
                })}
              </div>
              {isTm && targetPokemon ? <div className="move-slot-row">{targetPokemon.moves.map((move, index) => <button className={moveSlot === index ? "selected" : ""} disabled={!targetCanLearn(target)} onClick={() => setMoveSlot(index)} key={`${move.id}-tm-slot-${index}`}>{index + 1}. {move.name_zh}</button>)}</div> : null}
              {isConsumable && (targetState?.moves || []).length ? <select value={moveSlot} onChange={event => setMoveSlot(Number(event.target.value))}><option value={0}>不指定技能</option>{(targetState.moves || []).map(move => <option value={move.slot} key={`${move.id}-${move.slot}-bag`}>{move.move} PP {move.pp}/{move.maxpp}</option>)}</select> : null}
              {isHeld && targetPokemon?.item_id ? <p className="item-return-hint">当前携带 {targetPokemon.item_zh || targetPokemon.item}，装备后旧道具会回到背包。</p> : null}
              <div className="command-row">
                <button disabled={!selected || (isTm && (tmLoading || !targetCanLearn(target)))} onClick={useSelectedItem}>{actionLabel()}</button>
              </div>
            </> : <p>背包为空。</p>}
          </section>
        </div>
      </section>
    </div>
  );
}

function ItemRecyclerModal({rest, onClose, onAction}: {rest: NonNullable<DesktopGameState["rest"]>; onClose: () => void; onAction: (action: RestAction) => void | Promise<void>}) {
  const items = Object.values(rest.bag_categories || {consumable: [], held: [], tm: []}).flat();
  return (
    <div className="modal-layer">
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
    </div>
  );
}

function NightSkyModal({rest, onClose, onAction}: {rest: NonNullable<DesktopGameState["rest"]>; onClose: () => void; onAction: (action: RestAction) => void | Promise<void>}) {
  const rows = rest.night_sky?.rows || [];
  return (
    <div className="modal-layer">
      <section className="shop-modal night-sky-modal">
        <header><div><h2>小道消息</h2><p>按照实际出场顺序查看本局训练师与阵容。</p></div><button onClick={onClose}>关闭</button></header>
        <div className="night-sky-board">{rows.length ? rows.map(row => {
          const trainerImage = trainerImageUrl(row.trainer, "avatar") || trainerImageUrl(row.trainer, "front");
          return (
            <article className="night-sky-row" key={`night-sky-${row.battle_no}`}>
              <div className="night-sky-trainer">{trainerImage ? <img src={trainerImage} alt={row.trainer.name_zh} /> : null}<span>第 {row.battle_no} 场</span><strong>{row.trainer.name_zh || row.trainer.id}</strong><small>{row.label}</small></div>
              <div className="night-sky-slots">{row.enemies.map((enemy, index) => enemy ? <div className="night-sky-pokemon" key={`${row.battle_no}-${enemy.species_id}-${index}`}><PokemonSprite pokemon={enemy} alt={displayName(enemy)} /><span>{displayName(enemy)}</span></div> : <div className="night-sky-pokemon night-sky-unknown" key={`${row.battle_no}-unknown-${index}`}><i>?</i><span>未查看</span></div>)}</div>
              <div className="night-sky-actions"><button disabled={Number(row.revealed || 0) >= 1} onClick={() => onAction({type: "night_sky_scout", battleNo: row.battle_no, level: "one"})}>免费查看一只</button><button disabled={Boolean(row.unlocked)} onClick={() => onAction({type: "night_sky_scout", battleNo: row.battle_no, level: "all"})}>300金币 解锁三只</button></div>
            </article>
          );
        }) : <p>小道消息尚未展开。</p>}</div>
      </section>
    </div>
  );
}

function RunTalentActionModal({talent, rest, onClose, onAction}: {talent: TalentView; rest: NonNullable<DesktopGameState["rest"]>; onClose: () => void; onAction: (action: RestAction) => void | Promise<void>}) {
  const [allInSlot, setAllInSlot] = useState(0);
  const [trustSlot, setTrustSlot] = useState(0);
  const [leadSlot, setLeadSlot] = useState(0);
  const [bpAmount, setBpAmount] = useState(1);
  const canAllIn = hasRunTalent(rest, "growth_all_in") && !rest.all_in_used;

  function actionPanel() {
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
          <button className={used >= limit ? "used" : ""} disabled={!preview || used >= limit || preview.trainer.type === "champion"} onClick={() => onAction({type: "reroute_next"})}>{used >= limit ? "次数已用尽" : "更换下一场对手"}</button>
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

  return (
    <div className="modal-layer">
      <section className="shop-modal talent-action-modal">
        <header><div><h2>{talent.name}</h2><p>{talentShortText(talent)}</p></div><button onClick={onClose}>关闭</button></header>
        {actionPanel()}
      </section>
    </div>
  );
}

function RunTalentModal({rest, onClose}: {rest: NonNullable<DesktopGameState["rest"]>; onClose: () => void; onAction: (action: RestAction) => void | Promise<void>}) {
  return (
    <div className="modal-layer">
      <section className="shop-modal talent-run-modal">
        <header><div><h2>本局天赋</h2><p>{rest.talents?.length ? "当前天赋效果会影响休整与结算。" : "当前无天赋。"}</p></div><button onClick={onClose}>关闭</button></header>
        <div className="talent-run-list">
          {rest.talents?.length ? rest.talents.map(talent => (
            <article className={isActiveRunTalent(talent.id) ? "active-talent-card" : ""} key={talent.id}>
              <strong>{talent.name}</strong>
              <span>{talent.category}</span>
              <p>{talentShortText(talent)}</p>
            </article>
          )) : <p>当前无天赋。</p>}
        </div>
      </section>
    </div>
  );
}

type ShopPreferredCategory = "healing" | "pp" | "berry" | "battle" | "tm";

function ShopModal({rest, shop, onClose, onRoll, onBuy}: {rest: NonNullable<DesktopGameState["rest"]>; shop: NonNullable<DesktopGameState["rest"]>["shop"]; onClose: () => void; onRoll: (preferredCategory?: ShopPreferredCategory) => boolean | void | Promise<boolean | void>; onBuy: (offerId: string) => void | Promise<void>}) {
  const offers = shop?.offers || [];
  const slotCount = shop?.slot_count || offers.length || 3;
  const [rolling, setRolling] = useState(false);
  const [revealed, setRevealed] = useState(Boolean(offers.length));
  const [preferredCategory, setPreferredCategory] = useState<"" | ShopPreferredCategory>("");
  const purchased = Boolean(shop?.purchased_offer_id);
  const bonus = shop?.last_roll_bonus || null;
  const canChooseCategory = hasRunTalent(rest, "intel_shop_strategy");
  const rollCost = Number(shop?.next_roll_cost || 0) + (preferredCategory ? Number(shop?.preferred_roll_cost || 100) : 0);
  const canAffordRoll = Number(rest.coins || 0) >= rollCost;

  useEffect(() => {
    if (!offers.length) setRevealed(false);
    else if (!rolling) setRevealed(true);
  }, [offers.length, rolling]);

  async function roll() {
    if (rolling || !canAffordRoll) return;
    setRolling(true);
    setRevealed(false);
    const ok = await onRoll(preferredCategory || undefined);
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
    await onBuy(offerId);
    onClose();
  }

  return (
    <div className="modal-layer">
      <section className="shop-modal slot-shop-modal">
        <header>
          <div>
            <h2>随机商店</h2>
            <p>抽奖次数 {shop?.roll_count || 0}　下次抽奖 {coinCostLabel(shop?.next_roll_cost)}　{slotCount} 格{shop?.free_rolls_remaining ? `　额外免费 ${shop.free_rolls_remaining}` : ""}</p>
          </div>
          <button onClick={onClose}>关闭</button>
        </header>
        {canChooseCategory ? (
          <div className="segmented-row">
            <button className={!preferredCategory ? "selected" : ""} onClick={() => setPreferredCategory("")}>随机</button>
            <button className={preferredCategory === "healing" ? "selected" : ""} onClick={() => setPreferredCategory("healing")}>恢复药</button>
            <button className={preferredCategory === "pp" ? "selected" : ""} onClick={() => setPreferredCategory("pp")}>PP药</button>
            <button className={preferredCategory === "berry" ? "selected" : ""} onClick={() => setPreferredCategory("berry")}>树果</button>
            <button className={preferredCategory === "battle" ? "selected" : ""} onClick={() => setPreferredCategory("battle")}>战斗道具</button>
            <button className={preferredCategory === "tm" ? "selected" : ""} onClick={() => setPreferredCategory("tm")}>技能机器</button>
            <span>{preferredCategory ? `指定加收 ${coinCostLabel(shop?.preferred_roll_cost || 100)}` : "不指定类型"}</span>
          </div>
        ) : null}
        <div className="command-row"><button disabled={rolling || !canAffordRoll} onClick={roll}>抽奖（{coinCostLabel(shop?.next_roll_cost)}）</button><button onClick={onClose}>跳过</button></div>
        <div className={`slot-reels ${rolling ? "rolling" : ""} ${revealed && offers.length ? "settled" : ""}`} style={{"--slot-count": slotCount} as CSSProperties}>
          {Array.from({length: slotCount}, (_, index) => {
            return <div className="slot-reel" key={`slot-${index}`}><ItemIcon item={undefined} /><span>{rolling ? "抽取中" : revealed && offers.length ? "已揭晓" : "待抽取"}</span></div>;
          })}
        </div>
        {bonus && revealed ? <div className="slot-bonus-pop"><strong>抽到 {bonus.match_count} 连！</strong><span>免费获得 {bonus.count} 个 {bonus.name_zh || bonus.name}</span></div> : null}
        {revealed && offers.length ? <div className="shop-card-grid" style={{"--slot-count": slotCount} as CSSProperties}>
          {offers.map(item => {
            const isPurchased = shop?.purchased_offer_id === item.offer_id;
            const isBonus = bonus?.item_id === toId(item.id || item.name);
            return (
              <article className={`shop-card ${isPurchased ? "purchased" : ""} ${isBonus ? "bonus" : ""}`} key={item.offer_id}>
                <ItemIcon item={item} />
                <strong>{item.name_zh || item.name}</strong>
                <span>{itemCategoryLabel(item.category)}　{coinCostLabel(item.cost)}</span>
                <small>{item.desc_zh || item.desc || item.name}</small>
                {isBonus ? <b>{bonus?.match_count} 连奖励</b> : null}
                <button disabled={purchased} onClick={() => buy(item.offer_id)}>{isPurchased ? "已购买" : "购买这张"}</button>
              </article>
            );
          })}
        </div> : !rolling ? <p className="slot-empty">还没有商品。点击抽奖，本局第一次免费。</p> : null}
      </section>
    </div>
  );
}

function MoveAdjustModal({rest, initialSlot = 0, onClose, onAction}: {rest: NonNullable<DesktopGameState["rest"]>; initialSlot?: number; onClose: () => void; onAction: (action: RestAction) => void | Promise<void>}) {
  const [slot, setSlot] = useState(initialSlot);
  const [moveSlot, setMoveSlot] = useState(0);
  const playerDisplay = rest.player_display || [];
  const pokemon = playerDisplay[slot] || playerDisplay[0];
  const pokemonMoves = pokemon?.moves || [];
  const currentMove = pokemonMoves[moveSlot];
  const draws = rest.move_draws?.[`${slot}:${moveSlot}`] || [];
  const tmItems = rest.bag_categories?.tm || [];
  const moveColumnCount = 1 + (tmItems.length ? 1 : 0);

  return (
    <div className="modal-layer">
      <section className="rest-edit-modal move-editor-modal">
        <header><h2>更换技能</h2><button onClick={onClose}>关闭</button></header>
        <div className="editor-layout">
          <aside className="editor-side-list">{playerDisplay.map((entry, index) => <button className={slot === index ? "selected" : ""} onClick={() => { setSlot(index); setMoveSlot(0); }} key={`${entry.species_id}-move-editor-${index}`}><PokemonSprite pokemon={entry} alt={displayName(entry)} /><span>{displayName(entry)}</span></button>)}</aside>
          <section className="editor-main">
            <h3>{displayName(pokemon)}：替换 {currentMove?.name_zh || "选择招式格"}</h3>
            <div className="move-slot-row">{pokemonMoves.map((move, index) => <button className={moveSlot === index ? "selected" : ""} onClick={() => setMoveSlot(index)} key={`${move.id}-${index}`}>{index + 1}. {move.name_zh}</button>)}</div>
            <div className="move-editor-columns" style={{"--move-column-count": moveColumnCount} as CSSProperties}>
              <section>
                <div className="command-row"><button onClick={() => onAction({type: "draw_moves", slot, moveSlot})}>抽取候选（{coinCostLabel(rest.costs.move_draw)}）</button></div>
                <div className="learnable-list">{draws.length ? draws.map(move => <button onClick={() => { onAction({type: "apply_drawn_move", slot, moveSlot, moveId: move.id}); onClose(); }} key={move.id}><strong>{move.name_zh || move.name}</strong><span>{move.type_zh}/{move.category_zh}　威力 {move.power || "--"}　PP {move.pp}</span><small>{moveDescription(move)}</small></button>) : <p>先抽取候选技能，再选择一个替换当前招式。</p>}</div>
              </section>
              {tmItems.length ? <section>
                <h4>技能机器</h4>
                <div className="learnable-list">{tmItems.map(item => <button onClick={() => { onAction({type: "use_tm", itemId: item.id, slot, moveSlot}); onClose(); }} key={item.id}><strong>{item.name_zh || item.name}</strong><span>x{item.count}</span><small>{item.desc_zh || item.desc || item.name}</small></button>)}</div>
              </section> : null}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function StatsAdjustModal({rest, initialSlot = 0, onClose, onAction}: {rest: NonNullable<DesktopGameState["rest"]>; initialSlot?: number; onClose: () => void; onAction: (action: RestAction) => void}) {
  const [slot, setSlot] = useState(initialSlot);
  const pokemon = rest.player_display[slot];
  return (
    <div className="modal-layer">
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
    </div>
  );
}
