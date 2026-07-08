import {useMemo, useState, type CSSProperties} from "react";
import {motion} from "motion/react";
import type {
  ChangeBattleV2Api,
  DexStatId,
  LocalPokemonV4,
  PlayerItemInstanceV4,
  ShowdownPlayerIdV4,
  TrainingMoveSlotV4,
  TrainingRunGameNodeV4,
  TrainingRunGameV4,
  TrainingPlayerDraftV4,
} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import {styleUrlAssetPath} from "../../lib/assetUrl";
import {localPokemonFrontSpriteUrl} from "../../lib/showdownPokemonSpriteAdapter";
import "../dex/MoveCard.css";
import "./TrainingRestPage.css";

export type TrainingRestPageProps = {
  api: ChangeBattleV2Api;
  run: TrainingRunGameV4;
  onRunChange: (run: TrainingRunGameV4) => void;
  onBackToConfig: () => void;
  onStartBattle?: () => void;
};

type RestPanelId = "pokemon" | "bag" | "progress";

const TOOL_LABELS: Array<[RestPanelId, string]> = [
  ["pokemon", "我的队伍"],
  ["bag", "背包"],
  ["progress", "进度图"],
];

const MODE_LABEL = {
  singles: "单打",
  doubles: "双打",
  coop: "合作",
};

const RULE_LABEL = {
  standard: "无特殊系统",
  gen7: "Gen7",
  gen8: "Gen8",
  gen9: "Gen9",
};

const NODE_STATE_LABEL: Record<TrainingRunGameNodeV4["state"], string> = {
  locked: "未开始",
  ready: "当前",
  preparing: "准备中",
  running: "战斗中",
  won: "胜利",
  lost: "失败",
  skipped: "跳过",
  blocked: "阻断",
};

const STAT_IDS: DexStatId[] = ["hp", "atk", "def", "spa", "spd", "spe"];

function isTrainingPlayerDraft(player: TrainingPlayerDraftV4 | undefined): player is TrainingPlayerDraftV4 {
  return Boolean(player);
}

export function TrainingRestPage({api, run, onRunChange, onBackToConfig, onStartBattle}: TrainingRestPageProps) {
  const [activePanel, setActivePanel] = useState<RestPanelId>("pokemon");
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const normalizedRun = useMemo(() => run.gameMap?.length && run.status === "resting" ? run : api.enterTrainingRest(run), [api, run]);
  const currentNode = api.getCurrentTrainingNode(normalizedRun);
  const p1 = normalizedRun.players.p1;
  const team = p1?.localTeam.pokemon || [];
  const selected = team[selectedSlot] || team[0] || null;
  const wins = normalizedRun.gameMap.filter(node => node.state === "won").length;

  function updateRunDraft(next: TrainingRunGameV4) {
    onRunChange(next);
    setHasUnsavedChanges(true);
  }

  async function saveRestRun() {
    await api.saveTrainingRun(normalizedRun);
    setHasUnsavedChanges(false);
    setToast("休整状态已保存。");
    window.setTimeout(() => setToast(null), 1800);
  }

  function startPendingBattle() {
    onStartBattle?.();
  }

  function moveP1TeamSlot(from: number, to: number) {
    const player = normalizedRun.players.p1;
    if (!player || from === to || from < 0 || to < 0 || from >= team.length || to >= team.length) return;
    const pokemon = [...team];
    const [moved] = pokemon.splice(from, 1);
    if (!moved) return;
    pokemon.splice(to, 0, moved);
    const nextPlayer = {...player, localTeam: {...player.localTeam, pokemon}};
    const nextPlayers = {...normalizedRun.players, p1: nextPlayer};
    const nextScenarioPlayers = normalizedRun.scenario.players.map(scenarioPlayer => scenarioPlayer.playerId === "p1" ? nextPlayer : scenarioPlayer);
    setSelectedSlot(to);
    updateRunDraft({
      ...normalizedRun,
      players: nextPlayers,
      scenario: {...normalizedRun.scenario, players: nextScenarioPlayers},
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <motion.div className="training-rest-page" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{duration: 0.18}}>
      <TrainingRestHeader run={normalizedRun} currentNode={currentNode} wins={wins} activePanel={activePanel} hasUnsavedChanges={hasUnsavedChanges} onPanel={setActivePanel} onBack={onBackToConfig} onSave={() => void saveRestRun()} onNext={startPendingBattle} />
      <main className="training-rest-main-panel-host">
        <section className="training-rest-workspace-panel">
          {activePanel === "pokemon" ? <TrainingRestPokemonPanel api={api} team={team} selectedSlot={selectedSlot} selected={selected} onSelectSlot={setSelectedSlot} onMoveSlot={moveP1TeamSlot} /> : null}
          {activePanel === "bag" ? <TrainingRestBagPanel api={api} run={normalizedRun} ownerId="p1" onRunChange={updateRunDraft} onToast={setToast} /> : null}
          {activePanel === "progress" ? <TrainingRestProgressPanel run={normalizedRun} /> : null}
        </section>
      </main>
      {toast ? <button className="training-rest-toast" type="button" onClick={() => setToast(null)}>{toast}</button> : null}
    </motion.div>
  );
}

function TrainingRestHeader({run, currentNode, wins, activePanel, hasUnsavedChanges, onPanel, onBack, onSave, onNext}: {
  run: TrainingRunGameV4;
  currentNode: TrainingRunGameNodeV4 | null;
  wins: number;
  activePanel: RestPanelId;
  hasUnsavedChanges: boolean;
  onPanel: (panel: RestPanelId) => void;
  onBack: () => void;
  onSave: () => void;
  onNext: () => void;
}) {
  return (
    <header className="training-rest-header">
      <div className="training-rest-header-title">
        <h2>休整菜单</h2>
        <nav className="training-rest-header-tools" aria-label="常用休整工具">
          {TOOL_LABELS.map(([id, label]) => (
            <button className={activePanel === id ? "selected" : ""} type="button" onClick={() => onPanel(id as RestPanelId)} key={id}>{label}</button>
          ))}
        </nav>
      </div>
      <div className="training-rest-header-stats" aria-label="本局状态">
        <span>{currentNode ? `第${currentNode.index + 1}/${run.gameMap.length}` : "未就绪"}</span>
        <span>节点 {currentNode ? MODE_LABEL[currentNode.mode] : "--"}</span>
        <span>配置 {MODE_LABEL[run.scenario.mode]}</span>
        <span>胜场 {wins}</span>
      </div>
      <div className="training-rest-header-actions">
        <button className="danger-button" type="button" onClick={onBack}>返回配置</button>
        <button className={hasUnsavedChanges ? "save-button changed" : "save-button"} type="button" onClick={onSave}>{hasUnsavedChanges ? "保存*" : "保存"}</button>
        <button type="button" onClick={onNext}>下一场</button>
      </div>
    </header>
  );
}

function TrainingRestPokemonPanel({api, team, selectedSlot, selected, onSelectSlot, onMoveSlot}: {
  api: ChangeBattleV2Api;
  team: LocalPokemonV4[];
  selectedSlot: number;
  selected: LocalPokemonV4 | null;
  onSelectSlot: (slot: number) => void;
  onMoveSlot: (from: number, to: number) => void;
}) {
  return (
    <section className="training-rest-pokemon-panel">
      <aside className="training-rest-team-sidebar">
        <header className="training-rest-team-sidebar-header">
          <strong>当前队伍</strong>
          <div className="training-rest-team-order" aria-label="切换顺序">
            <button type="button" disabled={selectedSlot <= 0} onClick={() => onMoveSlot(selectedSlot, selectedSlot - 1)}>↑</button>
            <button type="button" disabled={selectedSlot >= team.length - 1} onClick={() => onMoveSlot(selectedSlot, selectedSlot + 1)}>↓</button>
          </div>
        </header>
        <div className="training-rest-team-slots">
          {team.slice(0, 6).map((pokemon, index) => (
            <TrainingRestTeamMiniCard api={api} pokemon={pokemon} index={index} selected={index === selectedSlot} onSelect={() => onSelectSlot(index)} key={pokemon.localPokemonId} />
          ))}
        </div>
      </aside>
      {selected ? <TrainingRestPokemonDetail api={api} pokemon={selected} /> : <div className="training-rest-empty">还没有宝可梦。</div>}
    </section>
  );
}

function TrainingRestTeamMiniCard({api, pokemon, index, selected, onSelect}: {api: ChangeBattleV2Api; pokemon: LocalPokemonV4; index: number; selected: boolean; onSelect: () => void}) {
  const hpRate = pokemon.maxHp ? Math.max(0, Math.min(100, pokemon.entryHp / pokemon.maxHp * 100)) : 0;
  const status = api.translateDexLabel("status", pokemon.entryStatus) || "";
  return (
    <button className={`training-rest-team-mini-card ${selected ? "selected" : ""} ${pokemon.entryHp <= 0 ? "status-fnt" : ""}`} type="button" onClick={onSelect}>
      <span className="training-rest-team-mini-card-index">{index + 1}</span>
      {status && status !== "正常" ? <em>{status}</em> : null}
      <TrainingRestPokemonSprite pokemon={pokemon} kind="icon" />
      <strong>{pokemon.nameZh}</strong>
      <small className="training-rest-team-mini-card-level">Lv.{pokemon.level}</small>
      <i className="training-rest-mini-hp" style={{"--training-rest-hp-rate": `${hpRate}%`} as CSSProperties} />
    </button>
  );
}

function TrainingRestPokemonDetail({api, pokemon}: {api: ChangeBattleV2Api; pokemon: LocalPokemonV4}) {
  const hpRate = pokemon.maxHp ? Math.max(0, Math.min(100, pokemon.entryHp / pokemon.maxHp * 100)) : 0;
  const detail = useMemo(() => api.getPokemonDetail(pokemon.speciesId), [api, pokemon.speciesId]);
  const calculated = useMemo(() => api.dex.calculatePokemonStats({
    speciesId: pokemon.speciesId,
    level: pokemon.level,
    nature: pokemon.nature,
    evs: pokemon.evs,
    ivs: pokemon.ivs,
  }).stats, [api, pokemon.evs, pokemon.ivs, pokemon.level, pokemon.nature, pokemon.speciesId]);
  const natureZh = api.translateDexLabel("natures", pokemon.nature) || "未知";
  return (
    <article className="training-rest-selected-pokemon-detail">
      <section className="training-rest-selected-pokemon-main">
        <div className="training-rest-selected-pokemon-identity">
          <TrainingRestPokemonSprite pokemon={pokemon} kind="front" />
          <span>No.{pokemon.speciesId}</span>
          <h3>{pokemon.nameZh}</h3>
          <small>{pokemon.name} · Lv.{pokemon.level}</small>
          <small>{pokemon.abilityNameZh || "特性未定"} · {pokemon.itemId || "无道具"}</small>
        </div>
        <div className="training-rest-selected-pokemon-facts">
          <div className="selected"><span>特性</span><strong>{pokemon.abilityNameZh || "特性未定"}</strong></div>
          <div><span>道具</span><strong>{pokemon.itemId || "无道具"}</strong></div>
          <div><span>状态</span><strong>{api.translateDexLabel("status", pokemon.entryStatus) || "正常"}</strong></div>
        </div>
        <div className="training-rest-selected-pokemon-hp">
          <span>HP</span>
          <strong>{pokemon.entryHp}/{pokemon.maxHp}</strong>
          <i style={{"--training-rest-hp-rate": `${hpRate}%`} as CSSProperties} />
        </div>
        <div className="training-rest-selected-move-row">
          {pokemon.moves.map((move, index) => (
            <TrainingRestMoveCard api={api} move={move} key={`${move.moveId}-${index}`} />
          ))}
        </div>
      </section>
      <aside className="training-rest-selected-pokemon-stats">
        <div className="training-rest-reroll-lines">
          <p><span>性格</span><strong>{natureZh}</strong></p>
          <p><span>特性</span><strong>{pokemon.abilityNameZh || "特性未定"}</strong></p>
        </div>
        <dl>
          {STAT_IDS.map(stat => (
            <div key={stat}>
              <dt>{api.translateDexLabel("stats", stat)}</dt>
              <dd>{calculated[stat]} ({detail.baseStats[stat]} | {pokemon.ivs[stat]} | {pokemon.evs[stat]})</dd>
            </div>
          ))}
        </dl>
      </aside>
    </article>
  );
}

function TrainingRestMoveCard({api, move}: {api: ChangeBattleV2Api; move: TrainingMoveSlotV4}) {
  const typeId = toId(move.type || "normal") || "normal";
  return (
    <div className={`training-rest-move-card move-card move-choice move-card-dex quick-dex-move-card move-type-${typeId}`}>
      <span className="move-name-row">
        <strong>{move.nameZh || move.name || move.moveId}</strong>
        <i>{api.translateDexLabel("categories", move.category)}</i>
      </span>
      <span className="move-meta-row">
        <b>{api.translateDexLabel("types", move.type || "?")}</b>
        <em>威 {move.power || "-"}</em>
        <em>命 {move.accuracy ?? "-"}</em>
        <em>PP {move.remainingPp}/{move.maxPp || move.pp || "-"}</em>
      </span>
    </div>
  );
}

function toId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function styleFromCss(css: string): CSSProperties {
  const match = /url\(([^)]+)\).*?(-?\d+)px\s+(-?\d+)px/.exec(css);
  if (!match) return {};
  return {
    backgroundImage: `url("${styleUrlAssetPath(match[1])}")`,
    backgroundPosition: `${match[2]}px ${match[3]}px`,
    backgroundRepeat: "no-repeat",
  };
}

function TrainingRestPokemonSprite({pokemon, kind}: {pokemon: LocalPokemonV4; kind: "icon" | "front"}) {
  if (kind === "icon" && pokemon.iconStyle) {
    return <span className="training-rest-pokemon-icon picon" aria-hidden="true" style={styleFromCss(pokemon.iconStyle)} />;
  }
  const src = kind === "front"
    ? (localPokemonFrontSpriteUrl(pokemon) || pokemon.iconUrl || "")
    : (pokemon.spriteUrl || pokemon.iconUrl || "");
  return <ImageWithFallback src={src} alt={pokemon.nameZh} fallback={pokemon.nameZh.slice(0, 1) || "?"} />;
}

function TrainingRestBagPanel({api, run, ownerId, onRunChange, onToast}: {
  api: ChangeBattleV2Api;
  run: TrainingRunGameV4;
  ownerId: ShowdownPlayerIdV4;
  onRunChange: (run: TrainingRunGameV4) => void;
  onToast: (message: string | null) => void;
}) {
  const owner = run.players[ownerId];
  const team = owner?.localTeam.pokemon || [];
  const bag = api.normalizeBagState(owner?.bag);
  const items = bag.items;
  const [selectedId, setSelectedId] = useState(items[0]?.id || "");
  const [equipItemId, setEquipItemId] = useState<string | null>(null);
  const selected = items.find(item => item.id === selectedId) || items[0] || null;
  const equipItem = equipItemId ? items.find(item => item.id === equipItemId) || null : null;
  const heldBy = useMemo(() => buildHeldItemOwnerMap(team), [team]);

  function showToast(message: string) {
    onToast(message);
    window.setTimeout(() => onToast(null), 1800);
  }

  function requestEquip(item: PlayerItemInstanceV4) {
    const eligibility = getBagItemEquipEligibility(api, item);
    if (!eligibility.canEquip) {
      showToast(eligibility.reason);
      return;
    }
    if (!team.length) {
      showToast("当前队伍里还没有可携带道具的宝可梦。");
      return;
    }
    setEquipItemId(item.id);
  }

  function confirmEquip(item: PlayerItemInstanceV4, targetPokemonId: string) {
    if (!owner) return;
    const target = team.find(pokemon => pokemon.localPokemonId === targetPokemonId);
    if (!target) {
      showToast("请选择要携带道具的宝可梦。");
      return;
    }
    const nextPokemon = team.map(pokemon => {
      if (pokemon.localPokemonId === targetPokemonId) {
        return {...pokemon, itemId: item.itemID, heldItemInstanceId: item.id};
      }
      if (pokemon.heldItemInstanceId === item.id) {
        return {...pokemon, itemId: "", heldItemInstanceId: undefined};
      }
      return pokemon;
    });
    const nextPlayer = {...owner, localTeam: {...owner.localTeam, pokemon: nextPokemon}};
    const nextPlayers = {...run.players, [ownerId]: nextPlayer};
    const nextScenarioPlayers = run.scenario.players.map(player => player.playerId === ownerId ? nextPlayer : player);
    onRunChange({
      ...run,
      players: nextPlayers,
      scenario: {...run.scenario, players: nextScenarioPlayers},
      updatedAt: new Date().toISOString(),
    });
    setEquipItemId(null);
    showToast(`已让 ${target.nameZh || target.name} 携带 ${item.name}。`);
  }

  return (
    <div className="training-rest-bag-panel">
      <aside className="training-rest-bag-left">
        <nav className="training-rest-bag-tabs" aria-label="背包分类">
          <span className="selected">全部<b>{items.length}/{bag.maxSize}</b></span>
          {bag.battleBagEnabled ? <span>战斗<b>开</b></span> : <span>战斗<b>关</b></span>}
        </nav>
        <div className="training-rest-bag-list">
          {items.length ? items.map(item => <TrainingRestBagItem api={api} item={item} heldBy={heldBy.get(item.id)} selected={item.id === selected?.id} onSelect={() => setSelectedId(item.id)} key={item.id} />) : <p>背包为空。</p>}
        </div>
      </aside>
      <aside className="training-rest-bag-detail">
        {selected ? <TrainingRestBagDetail api={api} item={selected} heldBy={heldBy.get(selected.id)} onEquip={() => requestEquip(selected)} /> : (
          <>
            <strong>背包工作区</strong>
            <span>道具使用后续接入；本页先展示实例详情。</span>
          </>
        )}
      </aside>
      {equipItem ? (
        <TrainingRestEquipItemModal
          api={api}
          item={equipItem}
          team={team}
          heldBy={heldBy.get(equipItem.id)}
          onCancel={() => setEquipItemId(null)}
          onConfirm={pokemonId => confirmEquip(equipItem, pokemonId)}
        />
      ) : null}
    </div>
  );
}

function TrainingRestBagItem({api, item, heldBy, selected, onSelect}: {api: ChangeBattleV2Api; item: PlayerItemInstanceV4; heldBy?: LocalPokemonV4; selected: boolean; onSelect: () => void}) {
  let desc = "暂无说明。";
  try {
    const detail = api.getItemDetail(item.itemID);
    desc = detail.description || detail.effectSummary || desc;
  } catch {
    desc = item.name;
  }
  return (
    <button className={selected ? "selected" : ""} type="button" onClick={onSelect}>
      <TrainingRestBagItemIcon api={api} item={item} />
      <strong>{item.name}</strong>
      <small>{heldBy ? `已携带：${heldBy.nameZh || heldBy.name}` : desc}</small>
    </button>
  );
}

function TrainingRestBagDetail({api, item, heldBy, onEquip}: {api: ChangeBattleV2Api; item: PlayerItemInstanceV4; heldBy?: LocalPokemonV4; onEquip: () => void}) {
  let desc = "暂无说明。";
  let summary = "";
  let kind = "道具";
  try {
    const detail = api.getItemDetail(item.itemID);
    desc = detail.description || desc;
    summary = detail.effectSummary && detail.effectSummary !== detail.description ? detail.effectSummary : "";
    kind = detail.kindLabel || kind;
  } catch {
    // Keep stable item id if Dex has no data.
  }
  return (
    <>
      <div className="training-rest-bag-detail-title">
        <TrainingRestBagItemIcon api={api} item={item} large />
        <div>
          <strong>{item.name}</strong>
          <small>{kind}</small>
        </div>
      </div>
      <p>{desc}</p>
      {summary ? <p className="muted">{summary}</p> : null}
      {heldBy ? <p className="muted">当前由 {heldBy.nameZh || heldBy.name} 携带。</p> : null}
      <div className="training-rest-bag-actions">
        <button type="button" onClick={onEquip}>携带</button>
      </div>
    </>
  );
}

function TrainingRestEquipItemModal({api, item, team, heldBy, onCancel, onConfirm}: {
  api: ChangeBattleV2Api;
  item: PlayerItemInstanceV4;
  team: LocalPokemonV4[];
  heldBy?: LocalPokemonV4;
  onCancel: () => void;
  onConfirm: (pokemonId: string) => void;
}) {
  const [selectedPokemonId, setSelectedPokemonId] = useState(heldBy?.localPokemonId || team[0]?.localPokemonId || "");
  const selected = team.find(pokemon => pokemon.localPokemonId === selectedPokemonId) || null;
  return (
    <div className="training-rest-equip-modal" role="dialog" aria-label="选择携带道具的宝可梦">
      <div className="training-rest-equip-modal-card">
        <header className="training-rest-equip-modal-header">
          <TrainingRestBagItemIcon api={api} item={item} />
          <div>
            <strong>选择携带对象</strong>
            <span>{item.name}</span>
          </div>
        </header>
        <div className="training-rest-equip-team-grid">
          {team.map(pokemon => (
            <TrainingRestEquipPokemonCard
              api={api}
              pokemon={pokemon}
              selected={pokemon.localPokemonId === selectedPokemonId}
              holdingThis={pokemon.heldItemInstanceId === item.id}
              onSelect={() => setSelectedPokemonId(pokemon.localPokemonId)}
              key={pokemon.localPokemonId}
            />
          ))}
        </div>
        <footer className="training-rest-equip-modal-actions">
          <button type="button" onClick={onCancel}>取消</button>
          <button type="button" disabled={!selected} onClick={() => selected ? onConfirm(selected.localPokemonId) : undefined}>
            {selected?.itemId && selected.heldItemInstanceId !== item.id ? "确认替换" : "确认携带"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function TrainingRestEquipPokemonCard({api, pokemon, selected, holdingThis, onSelect}: {
  api: ChangeBattleV2Api;
  pokemon: LocalPokemonV4;
  selected: boolean;
  holdingThis: boolean;
  onSelect: () => void;
}) {
  const hpRate = pokemon.maxHp ? Math.max(0, Math.min(100, pokemon.entryHp / pokemon.maxHp * 100)) : 0;
  const currentItem = itemName(api, pokemon.itemId);
  const replaceText = pokemon.itemId && !holdingThis ? `将替换：${currentItem}` : pokemon.itemId ? currentItem : "无道具";
  return (
    <button className={`training-rest-equip-pokemon-card ${selected ? "selected" : ""} ${holdingThis ? "holding" : ""}`} type="button" onClick={onSelect}>
      {holdingThis ? <em>已携带</em> : null}
      <TrainingRestPokemonSprite pokemon={pokemon} kind="icon" />
      <span className="training-rest-equip-pokemon-info">
        <strong>{pokemon.nameZh || pokemon.name}</strong>
        <small>Lv.{pokemon.level} · {replaceText}</small>
        <i className="training-rest-equip-hp"><b style={{width: `${hpRate}%`}} /></i>
      </span>
    </button>
  );
}

function buildHeldItemOwnerMap(team: LocalPokemonV4[]): Map<string, LocalPokemonV4> {
  const map = new Map<string, LocalPokemonV4>();
  for (const pokemon of team) {
    if (pokemon.heldItemInstanceId) map.set(pokemon.heldItemInstanceId, pokemon);
  }
  return map;
}

function getBagItemEquipEligibility(api: ChangeBattleV2Api, item: PlayerItemInstanceV4): {canEquip: boolean; reason: string} {
  if (item.type === "system-battle") return {canEquip: false, reason: "系统战斗道具需要先完成重铸，后续接入。"};
  try {
    const detail = api.getItemDetail(item.itemID);
    if (item.canTake || detail.canTake || ["battle", "held", "berry"].includes(detail.kind)) return {canEquip: true, reason: ""};
  } catch {
    // Fall back to instance flags below.
  }
  if (item.canTake || ["battle", "held", "berry"].includes(item.type)) return {canEquip: true, reason: ""};
  return {canEquip: false, reason: "这个道具不能作为携带道具使用。"};
}

function itemName(api: ChangeBattleV2Api, itemId: string): string {
  if (!itemId) return "无道具";
  try {
    const detail = api.getItemDetail(itemId);
    return detail.nameZh || detail.name || itemId;
  } catch {
    return itemId;
  }
}

function TrainingRestBagItemIcon({api, item, large = false}: {api: ChangeBattleV2Api; item: PlayerItemInstanceV4; large?: boolean}) {
  const className = large ? "training-rest-bag-detail-icon item-icon" : "training-rest-bag-item-icon item-icon";
  try {
    const detail = api.getItemDetail(item.itemID);
    if (detail.iconStyle) return <span className={className} aria-hidden="true" style={styleFromCss(detail.iconStyle)} />;
    if (detail.iconUrl) return <ImageWithFallback src={detail.iconUrl} alt="" fallback="◇" />;
  } catch {
    // Keep stable fallback below.
  }
  return item.image ? <ImageWithFallback src={item.image} alt="" fallback="◇" /> : <span className={className}>◇</span>;
}

function TrainingRestProgressPanel({run}: {run: TrainingRunGameV4}) {
  const [selectedNodeId, setSelectedNodeId] = useState(run.currentNodeId || run.gameMap[0]?.id || "");
  const current = run.gameMap.find(node => node.id === selectedNodeId) || run.gameMap.find(node => node.id === run.currentNodeId) || run.gameMap[0] || null;
  const currentOpponents = current ? [current.p2, current.p4].filter(Boolean).map(playerId => current.participants[playerId as ShowdownPlayerIdV4] || run.players[playerId as ShowdownPlayerIdV4]).filter(isTrainingPlayerDraft) : [];
  return (
    <section className="training-rest-progress-panel">
      <div className="training-rest-progress-gallery">
        <div className="training-rest-progress-main">
          <div className="training-rest-progress-stage">
            {currentOpponents.length ? currentOpponents.map(player => (
              <div className="training-rest-progress-trainer" key={player.playerId}><ImageWithFallback src={player.avatar} alt="" /><small>{player.name}</small></div>
            )) : <div className="training-rest-progress-trainer"><i>?</i><small>未知对手</small></div>}
          </div>
          {current ? (
            <article className="training-rest-progress-detail">
              <div>
                <strong>下一场</strong>
                <span>{MODE_LABEL[current.mode]} · {RULE_LABEL[current.ruleSet]} · {NODE_STATE_LABEL[current.state]}</span>
              </div>
              <div className="training-rest-progress-enemies">
                {currentOpponents.flatMap(player => player.localTeam.pokemon).map(pokemon => (
                  <div className="training-rest-progress-pokemon" key={pokemon.localPokemonId}>
                    <TrainingRestPokemonSprite pokemon={pokemon} kind="icon" />
                    <span>{pokemon.nameZh}</span>
                  </div>
                ))}
              </div>
            </article>
          ) : null}
        </div>
        <nav className="training-rest-progress-thumb-nav" aria-label="训练场进度节点">
          {run.gameMap.map(node => {
            const foe = node.p2 ? node.participants[node.p2] || run.players[node.p2] : null;
            return (
            <button className={`${node.id === current?.id ? "active" : ""} ${node.state === "ready" ? "next" : ""} ${node.state === "won" ? "completed" : ""}`} type="button" onClick={() => setSelectedNodeId(node.id)} key={node.id}>
              {foe?.avatar ? <ImageWithFallback src={foe.avatar} alt="" /> : <span>{node.index + 1}</span>}
            </button>
          );})}
        </nav>
      </div>
    </section>
  );
}
