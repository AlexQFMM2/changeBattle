import {useMemo, useState, type CSSProperties} from "react";
import {motion} from "motion/react";
import type {
  ChangeBattleV2Api,
  DexStatId,
  LocalPokemonV4,
  ShowdownPlayerIdV4,
  TrainingMoveSlotV4,
  TrainingRunGameNodeV4,
  TrainingRunGameV4,
  TrainingPlayerDraftV4,
} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
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

const STATUS_LABEL: Record<string, string> = {
  "": "正常",
  brn: "灼伤",
  par: "麻痹",
  psn: "中毒",
  tox: "剧毒",
  slp: "睡眠",
  frz: "冰冻",
};

const STAT_ROWS: Array<[DexStatId, string]> = [
  ["hp", "HP"],
  ["atk", "攻击"],
  ["def", "防御"],
  ["spa", "特攻"],
  ["spd", "特防"],
  ["spe", "速度"],
];

const NATURE_LABEL: Record<string, string> = {
  Hardy: "勤奋",
  Lonely: "怕寂寞",
  Brave: "勇敢",
  Adamant: "固执",
  Naughty: "顽皮",
  Bold: "大胆",
  Docile: "坦率",
  Relaxed: "悠闲",
  Impish: "淘气",
  Lax: "乐天",
  Timid: "胆小",
  Hasty: "急躁",
  Serious: "认真",
  Jolly: "爽朗",
  Naive: "天真",
  Modest: "内敛",
  Mild: "慢吞吞",
  Quiet: "冷静",
  Bashful: "害羞",
  Rash: "马虎",
  Calm: "温和",
  Gentle: "温顺",
  Sassy: "自大",
  Careful: "慎重",
  Quirky: "浮躁",
};

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
          {activePanel === "bag" ? <TrainingRestBagPanel api={api} run={normalizedRun} ownerId="p1" /> : null}
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
            <TrainingRestTeamMiniCard pokemon={pokemon} index={index} selected={index === selectedSlot} onSelect={() => onSelectSlot(index)} key={pokemon.localPokemonId} />
          ))}
        </div>
      </aside>
      {selected ? <TrainingRestPokemonDetail api={api} pokemon={selected} /> : <div className="training-rest-empty">还没有宝可梦。</div>}
    </section>
  );
}

function TrainingRestTeamMiniCard({pokemon, index, selected, onSelect}: {pokemon: LocalPokemonV4; index: number; selected: boolean; onSelect: () => void}) {
  const hpRate = pokemon.maxHp ? Math.max(0, Math.min(100, pokemon.entryHp / pokemon.maxHp * 100)) : 0;
  const status = STATUS_LABEL[pokemon.entryStatus] || pokemon.entryStatus || "";
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
  const natureZh = natureLabel(pokemon.nature);
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
          <div><span>状态</span><strong>{STATUS_LABEL[pokemon.entryStatus] || pokemon.entryStatus || "正常"}</strong></div>
        </div>
        <div className="training-rest-selected-pokemon-hp">
          <span>HP</span>
          <strong>{pokemon.entryHp}/{pokemon.maxHp}</strong>
          <i style={{"--training-rest-hp-rate": `${hpRate}%`} as CSSProperties} />
        </div>
        <div className="training-rest-selected-move-row">
          {pokemon.moves.map((move, index) => (
            <TrainingRestMoveCard move={move} key={`${move.moveId}-${index}`} />
          ))}
        </div>
      </section>
      <aside className="training-rest-selected-pokemon-stats">
        <div className="training-rest-reroll-lines">
          <p><span>性格</span><strong>{natureZh}</strong></p>
          <p><span>特性</span><strong>{pokemon.abilityNameZh || "特性未定"}</strong></p>
        </div>
        <dl>
          {STAT_ROWS.map(([stat, label]) => (
            <div key={stat}>
              <dt>{label}</dt>
              <dd>{calculated[stat]} ({detail.baseStats[stat]} | {pokemon.ivs[stat]} | {pokemon.evs[stat]})</dd>
            </div>
          ))}
        </dl>
      </aside>
    </article>
  );
}

function TrainingRestMoveCard({move}: {move: TrainingMoveSlotV4}) {
  const typeId = toId(move.type || "normal") || "normal";
  return (
    <div className={`training-rest-move-card move-card move-choice move-card-dex quick-dex-move-card move-type-${typeId}`}>
      <span className="move-name-row">
        <strong>{move.nameZh || move.name || move.moveId}</strong>
        <i>{categoryLabel(move.category)}</i>
      </span>
      <span className="move-meta-row">
        <b>{move.type || "?"}</b>
        <em>威 {move.power || "-"}</em>
        <em>命 {move.accuracy ?? "-"}</em>
        <em>PP {move.remainingPp}/{move.maxPp || move.pp || "-"}</em>
      </span>
    </div>
  );
}

function natureLabel(nature: string): string {
  return NATURE_LABEL[nature] || nature || "未知";
}

function categoryLabel(category: string): string {
  const id = toId(category);
  if (id === "physical") return "物理";
  if (id === "special") return "特殊";
  if (id === "status") return "变化";
  return category || "?";
}

function toId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
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

function TrainingRestPokemonSprite({pokemon, kind}: {pokemon: LocalPokemonV4; kind: "icon" | "front"}) {
  if (kind === "icon" && pokemon.iconStyle) {
    return <span className="training-rest-pokemon-icon picon" aria-hidden="true" style={styleFromCss(pokemon.iconStyle)} />;
  }
  const src = kind === "front"
    ? ((pokemon.shiny ? pokemon.shinySpriteUrl : pokemon.spriteUrl) || pokemon.iconUrl || "")
    : (pokemon.spriteUrl || pokemon.iconUrl || "");
  return <ImageWithFallback src={src} alt={pokemon.nameZh} fallback={pokemon.nameZh.slice(0, 1) || "?"} />;
}

function TrainingRestBagPanel({api, run, ownerId}: {api: ChangeBattleV2Api; run: TrainingRunGameV4; ownerId: ShowdownPlayerIdV4}) {
  const items = run.players[ownerId]?.bag.items || [];
  const first = items[0] || null;
  return (
    <div className="training-rest-bag-panel">
      <aside className="training-rest-bag-left">
        <nav className="training-rest-bag-tabs" aria-label="背包分类">
          <span className="selected">恢复<b>{items.length}</b></span>
        </nav>
        <div className="training-rest-bag-list">
          {items.length ? items.map(item => <TrainingRestBagItem api={api} itemId={item.itemId} count={item.count} key={item.itemId} />) : <p>背包为空。</p>}
        </div>
      </aside>
      <aside className="training-rest-bag-detail">
        {first ? <TrainingRestBagDetail api={api} itemId={first.itemId} count={first.count} /> : (
          <>
            <strong>背包工作区</strong>
            <span>道具使用会在后续接入休整行为。</span>
          </>
        )}
      </aside>
    </div>
  );
}

function TrainingRestBagItem({api, itemId, count}: {api: ChangeBattleV2Api; itemId: string; count: number}) {
  let name = itemId;
  let desc = "暂无说明。";
  try {
    const detail = api.getItemDetail(itemId);
    name = detail.nameZh || detail.name;
    desc = detail.description || desc;
  } catch {
    // Keep stable item id if Dex has no data.
  }
  return (
    <article>
      <span className="training-rest-bag-item-icon">◇</span>
      <strong>{name}</strong>
      <span>x{count}</span>
      <small>{desc}</small>
    </article>
  );
}

function TrainingRestBagDetail({api, itemId, count}: {api: ChangeBattleV2Api; itemId: string; count: number}) {
  let name = itemId;
  let english = itemId;
  let desc = "暂无说明。";
  try {
    const detail = api.getItemDetail(itemId);
    name = detail.nameZh || detail.name;
    english = detail.name;
    desc = detail.description || desc;
  } catch {
    // Keep stable item id if Dex has no data.
  }
  return (
    <>
      <div className="training-rest-bag-detail-title">
        <span className="training-rest-bag-detail-icon">◇</span>
        <div>
          <strong>{name}</strong>
          <small>{english}</small>
          <em>消耗道具　剩余 x{count}</em>
        </div>
      </div>
      <p>{desc}</p>
    </>
  );
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
