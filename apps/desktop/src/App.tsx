import {useEffect, useMemo, useRef, useState} from "react";
import {createRoot} from "react-dom/client";
import type {CSSProperties} from "react";
import type {AppStatus, BattleMoveRequest, BattleState, BattleTimelineEvent, DesktopGameState, LocalSave, MoveSummary, RentalPokemon, RuntimePokemon, TrainerGender} from "@changebattle/shared";
import battleEffectAssets from "../../../data/battle_effect_assets.json";
import "./styles.css";

const STAT_ROWS = [
  ["hp", "HP"],
  ["atk", "攻击"],
  ["def", "防御"],
  ["spa", "特攻"],
  ["spd", "特防"],
  ["spe", "速度"],
] as const;

type BattleEffectEntry = {
  visual: string;
  duration_ms?: number;
  anchor?: "target" | "field" | "side";
};

type BattleVisualCue = {
  visual: string;
  side?: "p1" | "p2";
  targetSide?: "p1" | "p2";
  anchor: "target" | "field" | "side";
  durationMs: number;
};

const BATTLE_EFFECTS = battleEffectAssets as {defaults: {duration_ms: number; anchor: "target" | "field" | "side"}; entries: Record<string, BattleEffectEntry>};
const TYPE_ID_BY_ZH: Record<string, string> = {
  一般: "normal",
  火: "fire",
  水: "water",
  电: "electric",
  草: "grass",
  冰: "ice",
  格斗: "fighting",
  毒: "poison",
  地面: "ground",
  飞行: "flying",
  超能力: "psychic",
  虫: "bug",
  岩石: "rock",
  幽灵: "ghost",
  龙: "dragon",
  恶: "dark",
  钢: "steel",
  妖精: "fairy",
};
const STATUS_ID_BY_ZH: Record<string, string> = {
  灼伤: "brn",
  麻痹: "par",
  中毒: "psn",
  剧毒: "tox",
  睡眠: "slp",
  冰冻: "frz",
  混乱: "confusion",
};

function toId(value: string | undefined): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function typeId(value: string | undefined): string {
  const raw = String(value || "");
  return TYPE_ID_BY_ZH[raw] || toId(raw) || "normal";
}

function statusEffectId(value: string | undefined): string {
  const raw = String(value || "");
  return STATUS_ID_BY_ZH[raw] || toId(raw);
}

function battleEffectEntry(key: string): BattleEffectEntry | undefined {
  return BATTLE_EFFECTS.entries[key];
}

function cueFromEntry(entry: BattleEffectEntry | undefined, event: BattleTimelineEvent, fallbackVisual: string, side?: "p1" | "p2", targetSide?: "p1" | "p2"): BattleVisualCue {
  return {
    visual: entry?.visual || fallbackVisual,
    side: side || event.side,
    targetSide: targetSide || event.targetSide,
    anchor: entry?.anchor || BATTLE_EFFECTS.defaults.anchor,
    durationMs: entry?.duration_ms || BATTLE_EFFECTS.defaults.duration_ms,
  };
}

function assetUrl(path?: string): string | undefined {
  return path ? window.changeBattle?.assetUrl(path) : undefined;
}

function pokemonImageUrl(pokemon?: RentalPokemon, variant: "front_normal" | "back_normal" = "front_normal"): string | undefined {
  return assetUrl(pokemon?.sprite?.paths[variant] || pokemon?.sprite?.paths.front_normal);
}

function displayName(pokemon?: RentalPokemon): string {
  return pokemon?.species_zh || pokemon?.species || "未知";
}

function conditionText(condition?: string): string {
  if (!condition) return "?";
  return condition.replace(" fnt", " 濒死").replace(" brn", " 灼伤").replace(" par", " 麻痹").replace(" psn", " 中毒").replace(" tox", "剧毒").replace(" slp", " 睡眠").replace(" frz", " 冰冻");
}

function parseHp(condition?: string): {current: number; max: number; text: string} | null {
  const match = String(condition || "").match(/(\d+)\/(\d+)/);
  if (!match) return null;
  return {current: Number(match[1]), max: Number(match[2]), text: `${match[1]}/${match[2]}`};
}

function statusCode(condition?: string, explicit?: string): string {
  const raw = String(explicit || condition || "").trim();
  if (raw.includes(" fnt") || raw === "fnt" || raw.startsWith("0 ")) return "fnt";
  for (const code of ["brn", "par", "psn", "tox", "slp", "frz"]) {
    if (raw.includes(` ${code}`) || raw === code) return code;
  }
  return "";
}

function statusLabel(code: string): string {
  return {brn: "灼伤", par: "麻痹", psn: "中毒", tox: "剧毒", slp: "睡眠", frz: "冰冻", fnt: "濒死"}[code] || "";
}

function timelineFaintedState(events: BattleTimelineEvent[], fallback: {p1: boolean; p2: boolean}): {p1: boolean; p2: boolean} {
  const next = {...fallback};
  for (const event of events) {
    if (!event.targetSide) continue;
    if (event.type === "switch") next[event.targetSide] = false;
    if (event.type === "faint") next[event.targetSide] = true;
  }
  return next;
}

function runtimeName(runtime?: RuntimePokemon): string {
  const ident = runtime?.ident || "";
  if (ident.includes(":")) return ident.split(":", 2)[1].trim();
  const details = runtime?.details || "";
  return details ? details.split(",", 1)[0].trim() : ident;
}

function findDisplay(team: RentalPokemon[], name?: string): RentalPokemon | undefined {
  const key = toId(name);
  return team.find(pokemon => toId(pokemon.species) === key || toId(pokemon.name) === key || pokemon.species_id === key);
}

function activePokemon(battle: BattleState | null | undefined, side: "p1" | "p2"): {runtime?: RuntimePokemon; display?: RentalPokemon} {
  const runtime = side === "p1"
    ? battle?.request?.side?.pokemon?.find(pokemon => pokemon.active)
    : undefined;
  const activeName = side === "p1" ? runtimeName(runtime) : battle?.tracker.active.p2.name;
  const team = side === "p1" ? battle?.player_display || [] : battle?.enemy_display || [];
  return {runtime, display: findDisplay(team, activeName)};
}

function statLine(pokemon: RentalPokemon, stat: string): string {
  const marker = pokemon.nature_plus === stat ? " ↑" : pokemon.nature_minus === stat ? " ↓" : "";
  return `${pokemon.stats[stat] ?? "?"} (${pokemon.base_stats[stat] ?? "?"} | ${pokemon.ivs[stat] ?? 31} | ${pokemon.evs[stat] ?? 0})${marker}`;
}

function moveSummaryFor(pokemon: RentalPokemon | undefined, requestMove: BattleMoveRequest): MoveSummary | undefined {
  const key = toId(requestMove.id || requestMove.move);
  return pokemon?.moves.find(move => move.id === key || toId(move.name) === key || toId(move.name_zh) === key);
}

function moveSummaryByName(pokemon: RentalPokemon | undefined, moveName: string | undefined): MoveSummary | undefined {
  const key = toId(moveName);
  return pokemon?.moves.find(move => move.id === key || toId(move.name) === key || toId(move.name_zh) === key);
}

function debugMove(id: string, name: string, type = "Fire"): MoveSummary {
  return {id, name, name_zh: name, type, type_zh: type === "Fire" ? "火" : "一般", category: "Physical", category_zh: "物理", power: 120, accuracy: 100, pp: 5, priority: 0, short_desc: "", short_desc_zh: "", desc: "", desc_zh: ""};
}

function debugPokemon(species: string, zh: string): RentalPokemon {
  const move = debugMove("explosion", "大爆炸", "Normal");
  return {
    name: species, species, species_zh: zh, species_id: toId(species), level: 50, gender: "", types: ["Normal"], types_zh: ["一般"],
    ability: "Blaze", ability_zh: "猛火", ability_id: "blaze", ability_desc: "", ability_desc_zh: "",
    item: "", item_zh: "", item_id: "", item_desc: "", item_desc_zh: "",
    moves: [move], base_stats: {hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100},
    stats: {hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100},
    evs: {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0}, ivs: {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31},
    nature: "Serious", nature_zh: "认真", nature_plus: "", nature_minus: "", role: "debug", role_zh: "测试",
  };
}

function debugBattle(ended = false): BattleState {
  const player = debugPokemon("PlayerMon", "爆焰龟兽");
  const enemy = debugPokemon("EnemyMon", "爆肌蚊");
  const base = {
    request: {side: {pokemon: [{ident: "p1: PlayerMon", details: "PlayerMon, L50", condition: ended ? "0 fnt" : "100/100", active: true}]}, active: [{moves: [{id: "explosion", move: "Explosion", pp: 5, maxpp: 5}]}]},
    tracker: {turn: 1, active: {p1: {name: "PlayerMon", condition: ended ? "0 fnt" : "100/100", status: ""}, p2: {name: "EnemyMon", condition: ended ? "0 fnt" : "100/100", status: ""}}, boosts: {p1: {}, p2: {}}, side_conditions: {p1: [], p2: []}, weather: "无", field: [], pp: {}},
    recent_events: ended ? ["爆焰龟兽 使用 大爆炸。", "爆肌蚊 HP: 0/100", "效果拔群！", "爆肌蚊 倒下了。", "爆焰龟兽 HP: 0/100", "爆焰龟兽 倒下了。", "胜者：玩家"] : ["爆焰龟兽 上场了。", "爆肌蚊 上场了。"],
    timeline_events: ended ? [
      {id: "d1", type: "move", text: "爆焰龟兽 使用 大爆炸。", side: "p1", source: "爆焰龟兽", source_id: "PlayerMon", move: "大爆炸"},
      {id: "d2", type: "damage", text: "爆肌蚊 HP: 0/100", targetSide: "p2", target: "爆肌蚊", target_id: "EnemyMon", condition: "0/100", hp: {current: 0, max: 100, text: "0/100"}},
      {id: "d3", type: "effectiveness", text: "效果拔群！", targetSide: "p2"},
      {id: "d4", type: "faint", text: "爆肌蚊 倒下了。", targetSide: "p2", target: "爆肌蚊", target_id: "EnemyMon", condition: "0 fnt", hp: {current: 0, max: 100, text: "0/100"}},
      {id: "d5", type: "damage", text: "爆焰龟兽 HP: 0/100", targetSide: "p1", target: "爆焰龟兽", target_id: "PlayerMon", condition: "0/100", hp: {current: 0, max: 100, text: "0/100"}},
      {id: "d6", type: "faint", text: "爆焰龟兽 倒下了。", targetSide: "p1", target: "爆焰龟兽", target_id: "PlayerMon", condition: "0 fnt", hp: {current: 0, max: 100, text: "0/100"}},
      {id: "d7", type: "win", text: "胜者：玩家", side: "p1"},
    ] as BattleTimelineEvent[] : [],
    player_team: [{species: "PlayerMon"}], player_display: [player], enemy_team: [{species: "EnemyMon"}], enemy_display: [enemy],
  };
  return {ended, winner: ended ? "Player" : null, ...base} as BattleState;
}

function installBrowserAutomationBridge() {
  if (!import.meta.env.DEV || !new URLSearchParams(location.search).has("automated") || window.changeBattle) return;
  const save: LocalSave = {version: 1, trainer: {name: "自动测试", gender: "other"}, stats: {battle_points: 0, battles: 0, wins: 0, losses: 0, rank_status: "未开放"}, current_run: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString()};
  const candidates = Array.from({length: 6}, (_, index) => debugPokemon(`Candidate${index + 1}`, `候选${index + 1}`));
  window.changeBattle = {
    generateCandidates: async () => ({seed: [1, 2, 3, 4], team: candidates.map(pokemon => ({species: pokemon.species})), display: candidates, packed: ""}),
    assetUrl: path => path,
    loadSave: async () => save,
    createNewSave: async trainer => ({...save, trainer}),
    updateTrainer: async trainer => ({...save, trainer}),
    prepareCandidates: async () => ({screen: "rentalSelect", save, candidates: {seed: [1, 2, 3, 4], team: candidates.map(pokemon => ({species: pokemon.species})), display: candidates, packed: ""}, selected_indexes: [], message: "自动测试候选"}),
    beginChallenge: async () => ({screen: "battleMain", save, battle: debugBattle(false), message: "自动测试对局"}),
    continueRun: async () => ({screen: "battleMain", save, battle: debugBattle(false), message: "自动测试对局"}),
    battleChoice: async () => ({screen: "battleMain", save, battle: debugBattle(true), message: "自动测试胜利", pending_transition: {screen: "result", save, battle: debugBattle(true), message: "自动测试结算"}}),
    exchange: async () => ({screen: "result", save, message: "自动测试交换"}),
    getBattleState: async () => debugBattle(false),
  };
}

installBrowserAutomationBridge();

function App() {
  const [screen, setScreen] = useState<AppStatus>("title");
  const [save, setSave] = useState<LocalSave | null>(null);
  const [trainerName, setTrainerName] = useState("训练师");
  const [trainerGender, setTrainerGender] = useState<TrainerGender>("other");
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 0xffffffff));
  const [candidates, setCandidates] = useState<RentalPokemon[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [focusIndex, setFocusIndex] = useState(0);
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [exchange, setExchange] = useState<DesktopGameState["exchange"]>(null);
  const [pendingTransition, setPendingTransition] = useState<DesktopGameState | null>(null);
  const [message, setMessage] = useState("欢迎来到 ChangeBattle。选择读取存档或开始新游戏。");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void window.changeBattle?.loadSave().then(loaded => {
      setSave(loaded);
      if (loaded) {
        setTrainerName(loaded.trainer.name);
        setTrainerGender(loaded.trainer.gender);
      }
    });
  }, []);

  function applyState(state: DesktopGameState) {
    setSave(state.save || null);
    if (state.candidates?.display) {
      setCandidates(state.candidates.display);
      setSelected(state.selected_indexes || []);
      setFocusIndex(0);
    }
    setBattle(state.battle || null);
    setExchange(state.exchange || null);
    setPendingTransition(state.pending_transition || null);
    setScreen(state.screen);
    setMessage(state.message || "");
  }

  async function runAction(action: () => Promise<DesktopGameState | LocalSave | null>, fallbackScreen?: AppStatus) {
    setLoading(true);
    setError(null);
    try {
      const result = await action();
      if (result && "screen" in result) applyState(result);
      else if (result && "trainer" in result) setSave(result);
      if (fallbackScreen) setScreen(fallbackScreen);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadGame() {
    await runAction(async () => {
      const loaded = await window.changeBattle!.loadSave();
      if (!loaded) throw new Error("没有找到桌面端存档。请选择新游戏。");
      setTrainerName(loaded.trainer.name);
      setTrainerGender(loaded.trainer.gender);
      setSave(loaded);
      if (loaded.current_run) return window.changeBattle!.continueRun();
      return {screen: "mainMenu", save: loaded, message: `欢迎回来，${loaded.trainer.name}。`};
    });
  }

  async function createNewGame() {
    await runAction(async () => {
      const created = await window.changeBattle!.createNewSave({name: trainerName, gender: trainerGender});
      return {screen: "mainMenu", save: created, message: `新存档已创建：${created.trainer.name}`};
    });
  }

  async function prepareChallenge() {
    await runAction(() => window.changeBattle!.prepareCandidates(seed));
  }

  async function beginChallenge(nextSelected = selected) {
    await runAction(() => window.changeBattle!.beginChallenge(nextSelected, seed, 7));
  }

  function toggleCandidate(index: number) {
    setSelected(current => {
      const next = current.includes(index) ? current.filter(value => value !== index) : current.length < 3 ? [...current, index] : current;
      if (next.length === 3) void beginChallenge(next);
      return next;
    });
  }

  async function battleChoice(choice: string) {
    await runAction(() => window.changeBattle!.battleChoice(choice));
  }

  async function finishExchange(ownIndex: number | null, enemyIndex: number | null) {
    await runAction(() => window.changeBattle!.exchange(ownIndex, enemyIndex));
  }

  const content = useMemo(() => {
    if (screen === "title") return <TitleScreen save={save} onLoad={loadGame} onNew={() => setScreen("newGame")} />;
    if (screen === "newGame") return <NewGameScreen name={trainerName} gender={trainerGender} setName={setTrainerName} setGender={setTrainerGender} onCreate={createNewGame} onBack={() => setScreen("title")} />;
    if (screen === "mainMenu") return <MainMenu save={save} onStart={prepareChallenge} onInfo={() => setScreen("userInfo")} onTitle={() => setScreen("title")} />;
    if (screen === "userInfo") return <UserInfo save={save} onSaved={setSave} onBack={() => setScreen("mainMenu")} />;
    if (screen === "rentalSelect") return <RentalSelect candidates={candidates} selected={selected} focusIndex={focusIndex} setFocusIndex={setFocusIndex} onToggle={toggleCandidate} />;
    if (["battleMain", "moveMenu", "teamMenu", "statusMenu"].includes(screen)) return <BattleView battle={battle} mode={screen} setMode={setScreen} onChoice={battleChoice} pendingTransition={pendingTransition} onBattleAnimationDone={applyState} />;
    if (screen === "exchange") return <ExchangeView exchange={exchange} onSkip={() => finishExchange(null, null)} onExchange={finishExchange} />;
    if (screen === "result") return <ResultView message={message} onBack={() => setScreen("mainMenu")} />;
    return null;
  }, [screen, save, trainerName, trainerGender, candidates, selected, focusIndex, battle, exchange, pendingTransition, message]);

  const isBattleScreen = ["battleMain", "moveMenu", "teamMenu", "statusMenu"].includes(screen);

  return (
    <main className={`game-shell ${isBattleScreen && !error ? "battle-shell" : ""}`}>
      <section className="game-screen">
        {content}
        {loading ? <div className="loading-overlay">正在进入对局...</div> : null}
      </section>
      {isBattleScreen && !error ? null : <TextBox message={error || message} danger={Boolean(error)} />}
    </main>
  );
}

function TextBox({message, danger = false}: {message?: string; danger?: boolean}) {
  return <section className={`text-box ${danger ? "danger" : ""}`}>{message || "请选择。"}</section>;
}

function TitleScreen({save, onLoad, onNew}: {save: LocalSave | null; onLoad: () => void; onNew: () => void}) {
  return <div className="title-screen"><h1>ChangeBattle</h1><p>宝可梦对战工厂</p><div className="command-menu"><button onClick={onLoad}>读取存档</button><button onClick={onNew}>开始新游戏</button><button onClick={() => window.close()}>退出</button></div>{save ? <span className="save-hint">检测到存档：{save.trainer.name}</span> : <span className="save-hint">未读取存档</span>}</div>;
}

function NewGameScreen({name, gender, setName, setGender, onCreate, onBack}: {name: string; gender: TrainerGender; setName: (value: string) => void; setGender: (value: TrainerGender) => void; onCreate: () => void; onBack: () => void}) {
  return <div className="panel-page"><h2>训练师登记</h2><label>姓名<input value={name} onChange={event => setName(event.target.value)} /></label><label>性别<select value={gender} onChange={event => setGender(event.target.value as TrainerGender)}><option value="male">男</option><option value="female">女</option><option value="other">其他</option></select></label><div className="command-row"><button onClick={onCreate}>创建存档</button><button onClick={onBack}>返回</button></div></div>;
}

function MainMenu({save, onStart, onInfo, onTitle}: {save: LocalSave | null; onStart: () => void; onInfo: () => void; onTitle: () => void}) {
  return <div className="title-screen small"><h1>{save?.trainer.name || "训练师"}</h1><p>Rank：{save?.stats.rank_status || "未开放"}　BP：{save?.stats.battle_points || 0}</p><div className="command-menu"><button onClick={onStart}>{save?.current_run ? "继续对局" : "开始对局"}</button><button onClick={onInfo}>用户信息</button><button onClick={onTitle}>返回标题</button></div></div>;
}

function UserInfo({save, onSaved, onBack}: {save: LocalSave | null; onSaved: (save: LocalSave) => void; onBack: () => void}) {
  const [name, setName] = useState(save?.trainer.name || "训练师");
  const [gender, setGender] = useState<TrainerGender>(save?.trainer.gender || "other");
  const stats = save?.stats;
  const winRate = stats?.battles ? Math.round((stats.wins / stats.battles) * 1000) / 10 : 0;
  async function saveTrainer() {
    const next = await window.changeBattle!.updateTrainer({name, gender});
    onSaved(next);
  }
  return <div className="panel-page"><h2>用户信息</h2><table className="info-table"><tbody><tr><th>训练师</th><td><input value={name} onChange={event => setName(event.target.value)} /></td></tr><tr><th>性别</th><td><select value={gender} onChange={event => setGender(event.target.value as TrainerGender)}><option value="male">男</option><option value="female">女</option><option value="other">其他</option></select></td></tr><tr><th>Rank</th><td>{stats?.rank_status || "未开放"}</td></tr><tr><th>对战点数</th><td>{stats?.battle_points || 0}</td></tr><tr><th>总对局数</th><td>{stats?.battles || 0}</td></tr><tr><th>胜场/败场</th><td>{stats?.wins || 0} / {stats?.losses || 0}</td></tr><tr><th>胜率</th><td>{winRate}%</td></tr></tbody></table><div className="command-row"><button onClick={saveTrainer}>保存信息</button><button onClick={onBack}>返回</button></div></div>;
}

function RentalSelect({candidates, selected, focusIndex, setFocusIndex, onToggle}: {candidates: RentalPokemon[]; selected: number[]; focusIndex: number; setFocusIndex: (index: number) => void; onToggle: (index: number) => void}) {
  const pokemon = candidates[focusIndex];
  if (!pokemon) return <div className="loading-panel"><strong>正在生成租赁候选...</strong></div>;
  return <div className="dex-layout"><PokemonProfile pokemon={pokemon} selected={selected.includes(focusIndex)} /><div className="dex-actions"><span>候选 {focusIndex + 1}/{candidates.length}</span><span>已选择：{selected.map(index => displayName(candidates[index])).join(" / ") || "无"}</span><div className="command-row"><button onClick={() => setFocusIndex((focusIndex + candidates.length - 1) % candidates.length)}>上一只</button><button onClick={() => setFocusIndex((focusIndex + 1) % candidates.length)}>下一只</button><button onClick={() => onToggle(focusIndex)}>{selected.includes(focusIndex) ? "取消选中" : "选中"}</button></div></div></div>;
}

function PokemonProfile({pokemon, selected = false, runtime, compact = false}: {pokemon: RentalPokemon; selected?: boolean; runtime?: RuntimePokemon; compact?: boolean}) {
  return <div className={`pokemon-profile ${compact ? "compact" : ""}`}><aside className="profile-card"><span>No.{pokemon.sprite?.national_dex || "?"}</span><img src={pokemonImageUrl(pokemon)} alt={displayName(pokemon)} /><h2>{displayName(pokemon)}</h2><p>{pokemon.species}</p><p>Lv{pokemon.level} {pokemon.gender}</p>{selected ? <strong>已选中</strong> : null}</aside><section className="profile-info"><h3>{pokemon.types_zh.join(" / ")}　{pokemon.nature_zh}</h3><div className="info-strip"><span>特性</span><strong>{pokemon.ability_zh}</strong><span>道具</span><strong>{pokemon.item_zh || "无"}</strong><span>HP</span><strong>{runtime ? conditionText(runtime.condition) : pokemon.stats.hp}</strong></div><div className="stat-grid">{STAT_ROWS.map(([stat, label]) => <div key={stat}><span>{label}</span><strong>{statLine(pokemon, stat)}</strong></div>)}</div><div className="moves-panel">{pokemon.moves.map(move => <div className="move-detail" key={move.id}><strong>{move.name_zh}</strong><span>{move.type_zh}/{move.category_zh}</span><span>威力 {move.power || "--"}</span><span>命中 {move.accuracy ?? "必中"}</span><p>{move.desc_zh || move.desc || "暂无说明"}</p></div>)}</div></section></div>;
}

function visualCueForEvent(event: BattleTimelineEvent, battle: BattleState, displayedNames: {p1: string; p2: string}): BattleVisualCue | null {
  if (event.type === "move") {
    const actingSide = event.side || "p1";
    const team = actingSide === "p1" ? battle.player_display : battle.enemy_display;
    const pokemon = findDisplay(team, event.source_id || displayedNames[actingSide]);
    const summary = moveSummaryByName(pokemon, event.move);
    const moveKey = event.move ? `move:${toId(event.move)}` : "";
    const typeKey = `move_type:${typeId(summary?.type || summary?.type_zh)}`;
    const entry = battleEffectEntry(moveKey) || battleEffectEntry(typeKey) || battleEffectEntry("move_type:normal");
    return cueFromEntry(entry, event, entry?.visual || "normal-hit", actingSide, event.targetSide || (actingSide === "p1" ? "p2" : "p1"));
  }
  if (event.type === "damage") return cueFromEntry(battleEffectEntry("battle_action:damage"), event, "impact");
  if (event.type === "heal") return cueFromEntry(battleEffectEntry("battle_action:heal"), event, "heal");
  if (event.type === "faint") return cueFromEntry(battleEffectEntry("battle_action:faint"), event, "faint");
  if (event.type === "boost") return cueFromEntry(battleEffectEntry("battle_action:boost"), event, "boost");
  if (event.type === "item") return cueFromEntry(battleEffectEntry("battle_action:item"), event, "item");
  if (event.type === "ability") return cueFromEntry(battleEffectEntry("battle_action:ability"), event, "ability");
  if (event.type === "status") {
    const key = event.effect ? `status:${statusEffectId(event.effect)}` : "";
    return cueFromEntry(battleEffectEntry(key) || battleEffectEntry("status:confusion"), event, "status");
  }
  if (event.type === "weather") {
    const effect = toId(event.effect || event.text);
    const key = effect.includes("rain") || event.text.includes("雨") ? "weather:rain" : effect.includes("sun") || event.text.includes("晴") ? "weather:sun" : effect.includes("hail") || event.text.includes("雪") || event.text.includes("冰雹") ? "weather:hail" : effect.includes("sand") || event.text.includes("沙暴") ? "weather:sand" : "";
    return cueFromEntry(battleEffectEntry(key), event, key ? key.replace("weather:", "") : "field");
  }
  if (event.type === "field") {
    const effect = toId(event.effect || event.text);
    const sideKey = effect.includes("stealthrock") || event.text.includes("隐形岩") ? "side_condition:stealthrock" : effect.includes("toxicspikes") || event.text.includes("毒菱") ? "side_condition:toxicspikes" : effect.includes("spikes") || event.text.includes("撒菱") ? "side_condition:spikes" : effect.includes("reflect") || event.text.includes("反射壁") ? "side_condition:reflect" : effect.includes("lightscreen") || event.text.includes("光墙") ? "side_condition:lightscreen" : "";
    const fieldKey = effect.includes("trickroom") || event.text.includes("戏法空间") ? "field:trickroom" : effect.includes("electricterrain") || event.text.includes("电气") ? "field:electricterrain" : effect.includes("grassyterrain") || event.text.includes("青草") ? "field:grassyterrain" : effect.includes("mistyterrain") || event.text.includes("薄雾") ? "field:mistyterrain" : effect.includes("psychicterrain") || event.text.includes("精神") ? "field:psychicterrain" : "";
    const entry = battleEffectEntry(sideKey) || battleEffectEntry(fieldKey);
    return cueFromEntry(entry, event, entry?.visual || "field");
  }
  return null;
}

function BattleEffectLayer({cue}: {cue: BattleVisualCue | null}) {
  if (!cue) return null;
  return <div className={`battle-effect-layer anchor-${cue.anchor} side-${cue.side || "none"} target-${cue.targetSide || "none"}`} style={{"--cue-duration": `${cue.durationMs}ms`} as CSSProperties}><div className={`battle-effect effect-${cue.visual}`}><i /><i /><i /><i /><i /><i /></div></div>;
}

function BattleView({battle, mode, setMode, onChoice, pendingTransition, onBattleAnimationDone}: {battle: BattleState | null; mode: AppStatus; setMode: (mode: AppStatus) => void; onChoice: (choice: string) => void; pendingTransition: DesktopGameState | null; onBattleAnimationDone: (state: DesktopGameState) => void}) {
  const player = activePokemon(battle, "p1");
  const enemy = activePokemon(battle, "p2");
  const finalConditions = {
    p1: player.runtime?.condition || battle?.tracker.active.p1.condition || "",
    p2: battle?.tracker.active.p2.condition || "",
  };
  const finalActiveNames = {
    p1: runtimeName(player.runtime) || battle?.tracker.active.p1.name || "",
    p2: battle?.tracker.active.p2.name || "",
  };
  const finalFaintedSides = {
    p1: statusCode(finalConditions.p1) === "fnt",
    p2: statusCode(finalConditions.p2) === "fnt",
  };
  const turnEvents = battle ? lastEvents(battle, 14) : [];
  const timelineEvents = battle?.timeline_events || [];
  const timelineKey = timelineEvents.map(event => `${event.id}:${event.text}`).join("\n");
  const [shownEvents, setShownEvents] = useState(turnEvents);
  const [currentTimelineEvent, setCurrentTimelineEvent] = useState<BattleTimelineEvent | null>(null);
  const [currentVisualCue, setCurrentVisualCue] = useState<BattleVisualCue | null>(null);
  const [playbackActive, setPlaybackActive] = useState(false);
  const [displayConditions, setDisplayConditions] = useState(finalConditions);
  const [displayedActiveNames, setDisplayedActiveNames] = useState(finalActiveNames);
  const [hpTransitionMs, setHpTransitionMs] = useState({p1: 1400, p2: 1400});
  const [faintedSides, setFaintedSides] = useState({p1: false, p2: false});
  const previousTimelineKeys = useRef<string[]>([]);
  const displayConditionsRef = useRef(displayConditions);
  const displayedActiveNamesRef = useRef(displayedActiveNames);
  const eventTimers = useRef<number[]>([]);
  const playbackRun = useRef(0);
  const finishRequested = useRef(false);

  useEffect(() => { displayConditionsRef.current = displayConditions; }, [displayConditions]);
  useEffect(() => { displayedActiveNamesRef.current = displayedActiveNames; }, [displayedActiveNames]);

  useEffect(() => {
    playbackRun.current += 1;
    const runId = playbackRun.current;
    eventTimers.current.forEach(timer => window.clearTimeout(timer));
    eventTimers.current = [];
    const wait = (ms: number) => new Promise<void>(resolve => {
      const timer = window.setTimeout(resolve, ms);
      eventTimers.current.push(timer);
    });

    if (!battle) {
      setShownEvents(turnEvents);
      setCurrentTimelineEvent(null);
      setCurrentVisualCue(null);
      setPlaybackActive(false);
      setDisplayedActiveNames(finalActiveNames);
      setDisplayConditions(finalConditions);
      setFaintedSides(finalFaintedSides);
      return;
    }
    if (!battle.ended) finishRequested.current = false;

    const keys = timelineEvents.map(event => `${event.id}:${event.text}`);
    const known = new Set(previousTimelineKeys.current);
    const added = timelineEvents.filter((event, index) => !known.has(keys[index]));
    previousTimelineKeys.current = keys;

    if (!added.length) {
      setShownEvents(turnEvents);
      setCurrentTimelineEvent(null);
      setCurrentVisualCue(null);
      setPlaybackActive(false);
      setFaintedSides(timelineFaintedState(timelineEvents, finalFaintedSides));
      if (battle.ended && pendingTransition && !finishRequested.current) {
        finishRequested.current = true;
        onBattleAnimationDone(pendingTransition);
      }
      return;
    }

    const activeBattle = battle;
    async function playQueue() {
      setPlaybackActive(true);
      for (const event of added) {
        if (playbackRun.current !== runId) return;
        const duration = timelineDuration(event, displayConditionsRef.current[event.targetSide || "p1"]);
        setCurrentTimelineEvent(event);
        setShownEvents(events => [...events, event.text].slice(-14));
        if (event.type === "switch" && event.targetSide && event.target_id) {
          const oldName = displayedActiveNamesRef.current[event.targetSide];
          if (oldName && oldName !== event.target_id) {
            setCurrentVisualCue(cueFromEntry(battleEffectEntry("battle_action:switch_out"), event, "switch-out", event.targetSide, event.targetSide));
            await wait(520);
          }
          const nextNames = {...displayedActiveNamesRef.current, [event.targetSide]: event.target_id};
          displayedActiveNamesRef.current = nextNames;
          setDisplayedActiveNames(nextNames);
          setFaintedSides(current => ({...current, [event.targetSide!]: false}));
          setCurrentVisualCue(cueFromEntry(battleEffectEntry("battle_action:switch_in"), event, "switch-in", event.targetSide, event.targetSide));
        }
        if (event.type !== "switch") {
          setCurrentVisualCue(visualCueForEvent(event, activeBattle, displayedActiveNamesRef.current));
        }
        if (["damage", "heal"].includes(event.type) && event.targetSide) {
          await wait(Math.min(520, Math.max(260, duration * 0.22)));
          if (playbackRun.current !== runId) return;
          setHpTransitionMs(current => ({...current, [event.targetSide!]: duration}));
        }
        if (event.targetSide && event.condition && ["damage", "heal", "switch", "faint"].includes(event.type)) {
          const nextConditions = {...displayConditionsRef.current, [event.targetSide]: event.condition};
          displayConditionsRef.current = nextConditions;
          setDisplayConditions(nextConditions);
        }
        if (event.type === "faint" && event.targetSide) {
          setFaintedSides(current => ({...current, [event.targetSide!]: true}));
        }
        await wait(duration);
        setCurrentVisualCue(null);
      }
      if (playbackRun.current !== runId) return;
      await wait(420);
      if (playbackRun.current !== runId) return;
      setCurrentTimelineEvent(null);
      setCurrentVisualCue(null);
      setPlaybackActive(false);
      setShownEvents(lastEvents(activeBattle, 14));
      displayConditionsRef.current = finalConditions;
      displayedActiveNamesRef.current = finalActiveNames;
      setDisplayConditions(finalConditions);
      setDisplayedActiveNames(finalActiveNames);
      setFaintedSides(timelineFaintedState(timelineEvents, finalFaintedSides));
      if (activeBattle.ended && pendingTransition && !finishRequested.current) {
        finishRequested.current = true;
        onBattleAnimationDone(pendingTransition);
      }
    }

    void playQueue();
    return () => {
      eventTimers.current.forEach(timer => window.clearTimeout(timer));
      eventTimers.current = [];
    };
  }, [timelineKey]);

  if (!battle) return <div className="loading-panel"><strong>正在进入对局...</strong></div>;
  const controlsDisabled = playbackActive;
  const displayPlayer = findDisplay(battle.player_display, displayedActiveNames.p1) || player.display;
  const displayEnemy = findDisplay(battle.enemy_display, displayedActiveNames.p2) || enemy.display;
  return <div className="battle-layout"><section className={`battle-field ${battleAnimationClass(currentTimelineEvent)}`}><FieldEffectsOverlay battle={battle} /><BattleEffectLayer cue={currentVisualCue} /><div className="turn-badge">第 {battle.tracker.turn} 回合</div><div className="battle-corner-actions"><button disabled={controlsDisabled} onClick={() => setMode("statusMenu")}>状态</button><button className="danger-button" disabled={controlsDisabled} onClick={() => onChoice("forfeit")}>认输</button></div><FighterPanel side="enemy" pokemon={displayEnemy} condition={displayConditions.p2} status={battle.tracker.active.p2.status} transitionMs={hpTransitionMs.p2} /><div className="battle-sprites"><img className={`back-sprite ${faintedSides.p1 ? "sprite-fainted" : ""}`} src={pokemonImageUrl(displayPlayer, "back_normal")} /><img className={`front-sprite ${faintedSides.p2 ? "sprite-fainted" : ""}`} src={pokemonImageUrl(displayEnemy, "front_normal")} /></div><FighterPanel side="player" pokemon={displayPlayer} condition={displayConditions.p1} status={battle.tracker.active.p1.status} transitionMs={hpTransitionMs.p1} />{currentTimelineEvent ? <div className="battle-message-pop">{currentTimelineEvent.text}</div> : null}</section><section className="battle-bottom"><div className="battle-log"><strong>上一回合</strong>{shownEvents.map((event, index) => <p className={event === currentTimelineEvent?.text ? "current-event" : ""} key={`${event}-${index}`}>{event}</p>)}</div><div className={`battle-action-panel ${controlsDisabled ? "battle-controls-disabled" : ""}`}>{mode === "moveMenu" ? <MoveMenu battle={battle} disabled={controlsDisabled} onMove={index => onChoice(`move ${index}`)} onBack={() => setMode("battleMain")} /> : mode === "teamMenu" ? <TeamMenu battle={battle} disabled={controlsDisabled} onSwitch={index => onChoice(`switch ${index}`)} onBack={() => setMode("battleMain")} /> : <MainBattleCommands forceSwitch={Boolean(battle.request?.forceSwitch)} disabled={controlsDisabled} setMode={setMode} />}</div></section>{mode === "statusMenu" ? <StatusModal battle={battle} onBack={() => setMode("battleMain")} /> : null}</div>;
}

function FighterPanel({pokemon, condition, status, side, transitionMs}: {pokemon?: RentalPokemon; condition?: string; status?: string; side: "player" | "enemy"; transitionMs?: number}) {
  const hp = parseHp(condition);
  const code = statusCode(condition, status);
  return <div className={`fighter-panel ${side}`}><strong>{pokemon ? displayName(pokemon) : "未知"}</strong><span>Lv{pokemon?.level || 50}</span>{code ? <i className={`status-badge ${code}`}>{statusLabel(code)}</i> : null}<div className="hp-line"><i style={{width: `${hp ? Math.max(0, (hp.current / hp.max) * 100) : 0}%`, "--hp-duration": `${transitionMs || 1400}ms`} as CSSProperties} /></div><small>{hp?.text || conditionText(condition)}</small></div>;
}

function FieldEffectsOverlay({battle}: {battle: BattleState}) {
  const weather = battle.tracker.weather && battle.tracker.weather !== "无" ? [battle.tracker.weather] : [];
  return <div className="field-effects"><div className="field-effects-row global">{[...weather, ...battle.tracker.field].map(effect => <EffectBadge key={effect} effect={effect} />)}</div><div className="field-effects-row enemy-side">{battle.tracker.side_conditions.p2.map(effect => <EffectBadge key={effect} effect={effect} />)}</div><div className="field-effects-row player-side">{battle.tracker.side_conditions.p1.map(effect => <EffectBadge key={effect} effect={effect} />)}</div></div>;
}

function EffectBadge({effect}: {effect: string}) {
  return <span className="effect-badge"><b>{effectIcon(effect)}</b>{effect}</span>;
}

function effectIcon(effect: string): string {
  if (effect.includes("撒菱") || effect.includes("Spikes")) return "△";
  if (effect.includes("隐形岩") || effect.includes("Stealth Rock")) return "◆";
  if (effect.includes("毒菱") || effect.includes("Toxic Spikes")) return "◇";
  if (effect.includes("沙暴")) return "S";
  if (effect.includes("雨") || effect.includes("Rain")) return "R";
  if (effect.includes("晴") || effect.includes("Sun")) return "D";
  if (effect.includes("雪") || effect.includes("冰雹") || effect.includes("Hail")) return "H";
  if (effect.includes("电气") || effect.includes("青草") || effect.includes("薄雾") || effect.includes("精神")) return "T";
  return "*";
}

function moveTypeClass(summary: MoveSummary | undefined): string {
  const raw = summary?.type || summary?.type_zh || "";
  const typeId = toId(raw);
  const zhMap: Record<string, string> = {
    一般: "normal",
    火: "fire",
    水: "water",
    电: "electric",
    草: "grass",
    冰: "ice",
    格斗: "fighting",
    毒: "poison",
    地面: "ground",
    飞行: "flying",
    超能力: "psychic",
    虫: "bug",
    岩石: "rock",
    幽灵: "ghost",
    龙: "dragon",
    恶: "dark",
    钢: "steel",
    妖精: "fairy",
  };
  return `move-type-${zhMap[raw] || typeId || "normal"}`;
}

function moveTypeLabel(summary: MoveSummary | undefined): string {
  const raw = summary?.type_zh || summary?.type || "?";
  return raw === "超能力" ? "超" : raw === "一般" ? "普" : raw;
}

function MainBattleCommands({forceSwitch, disabled, setMode}: {forceSwitch: boolean; disabled?: boolean; setMode: (mode: AppStatus) => void}) {
  return <div className="command-grid battle-command-grid">{forceSwitch ? <button disabled={disabled} onClick={() => setMode("teamMenu")}>换人</button> : <button disabled={disabled} onClick={() => setMode("moveMenu")}>战斗</button>}<button disabled={disabled} onClick={() => setMode("teamMenu")}>宝可梦</button><button disabled>背包</button></div>;
}

function MoveMenu({battle, disabled, onMove, onBack}: {battle: BattleState; disabled?: boolean; onMove: (index: number) => void; onBack: () => void}) {
  const moves = battle.request?.active?.[0]?.moves || [];
  const active = activePokemon(battle, "p1").display;
  return <div className="move-menu">{moves.map((move, index) => { const summary = moveSummaryFor(active, move); return <button className={`move-choice ${moveTypeClass(summary)}`} key={move.id || index} disabled={disabled || move.disabled} onClick={() => onMove(index + 1)}><strong>{summary?.name_zh || move.move}</strong><span><b>{moveTypeLabel(summary)}</b> PP {move.pp}/{move.maxpp}</span></button>; })}<button className="menu-back" disabled={disabled} onClick={onBack}>返回</button></div>;
}

function TeamMenu({battle, disabled, onSwitch, onBack}: {battle: BattleState; disabled?: boolean; onSwitch: (index: number) => void; onBack: () => void}) {
  const rows = battle.request?.side?.pokemon || [];
  const [focus, setFocus] = useState(0);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const focusedRuntime = rows[focus];
  const focusedDisplay = findDisplay(battle.player_display, runtimeName(focusedRuntime));
  const detailRuntime = detailIndex === null ? undefined : rows[detailIndex];
  const detailPokemon = detailIndex === null ? undefined : findDisplay(battle.player_display, runtimeName(detailRuntime));
  return <div className="team-menu"><div className="team-list">{rows.map((runtime, index) => { const display = findDisplay(battle.player_display, runtimeName(runtime)); const canSwitch = !runtime.active && !String(runtime.condition).endsWith(" fnt"); const status = statusCode(runtime.condition); return <div className={`team-row ${focus === index ? "selected" : ""}`} key={runtime.ident}><div className="team-summary" onClick={() => setFocus(index)}><span>{runtime.active ? "▶" : `${index + 1}.`}</span><strong>{display ? displayName(display) : runtimeName(runtime)}</strong>{status ? <i className={`status-badge ${status}`}>{statusLabel(status)}</i> : null}<small>{conditionText(runtime.condition)}　{runtime.item || ""}</small></div><button disabled={disabled} onClick={() => { setFocus(index); setDetailIndex(index); }}>详情</button><button disabled={disabled || !canSwitch} onClick={() => onSwitch(index + 1)}>换上</button></div>; })}<button disabled={disabled} onClick={onBack}>返回</button></div><div className="team-preview">{focusedDisplay ? <><img src={pokemonImageUrl(focusedDisplay)} alt={displayName(focusedDisplay)} /><strong>{displayName(focusedDisplay)}</strong><small>{conditionText(focusedRuntime?.condition)}　{focusedDisplay.item_zh || "无道具"}</small></> : <p>选择宝可梦。</p>}</div>{detailPokemon ? <PokemonDetailModal pokemon={detailPokemon} runtime={detailRuntime} onClose={() => setDetailIndex(null)} /> : null}</div>;
}

function PokemonDetailModal({pokemon, runtime, onClose}: {pokemon: RentalPokemon; runtime?: RuntimePokemon; onClose: () => void}) {
  return <div className="modal-layer"><section className="pokemon-detail-modal"><header><h2>{displayName(pokemon)}</h2><button onClick={onClose}>关闭</button></header><PokemonProfile pokemon={pokemon} runtime={runtime} /></section></div>;
}

function StatusModal({battle, onBack}: {battle: BattleState; onBack: () => void}) {
  return <div className="modal-layer"><section className="status-modal"><header><h2>对局状态</h2><button onClick={onBack}>关闭</button></header><div className="status-grid"><p>回合：{battle.tracker.turn}</p><p>天气：{battle.tracker.weather || "无"}</p><p>全场：{battle.tracker.field.join(" / ") || "无"}</p><p>我方场地：{battle.tracker.side_conditions.p1.join(" / ") || "无"}</p><p>对手场地：{battle.tracker.side_conditions.p2.join(" / ") || "无"}</p><p>我方能力：{boostSummary(battle.tracker.boosts.p1)}</p><p>对手能力：{boostSummary(battle.tracker.boosts.p2)}</p></div><h3>最近战报</h3><div className="status-events">{lastEvents(battle, 14).map((event, index) => <small key={index}>{event}</small>)}</div></section></div>;
}

function lastEvents(battle: BattleState, limit = 5): string[] {
  return battle.recent_events.filter(event => event && !event.startsWith("--- 第")).slice(-limit);
}

function timelineDuration(event: BattleTimelineEvent, previousCondition?: string): number {
  if (event.type === "damage" || event.type === "heal") {
    const previous = parseHp(previousCondition);
    const next = event.hp || parseHp(event.condition);
    const ratio = previous && next && previous.max > 0 ? Math.abs(previous.current - next.current) / previous.max : 0.25;
    return Math.round(Math.max(1000, Math.min(5000, 1000 + ratio * 4000)));
  }
  if (event.type === "move") return 2600;
  if (event.type === "faint") return 2600;
  if (event.type === "switch") return 2300;
  if (event.type === "win") return 2600;
  return 2100;
}

function battleAnimationClass(event: BattleTimelineEvent | null): string {
  if (!event) return "";
  if (event.type === "move" && event.side === "p1") return "player-acting";
  if (event.type === "move" && event.side === "p2") return "enemy-acting";
  if (event.type === "damage" && event.targetSide === "p1") return "player-hit";
  if (event.type === "damage" && event.targetSide === "p2") return "enemy-hit";
  if (event.type === "heal" && event.targetSide === "p1") return "player-heal";
  if (event.type === "heal" && event.targetSide === "p2") return "enemy-heal";
  if (event.type === "faint" && event.targetSide === "p1") return "player-faint";
  if (event.type === "faint" && event.targetSide === "p2") return "enemy-faint";
  return "";
}

function boostSummary(boosts: Record<string, number>): string {
  const labels: Record<string, string> = {atk: "攻击", def: "防御", spa: "特攻", spd: "特防", spe: "速度", accuracy: "命中", evasion: "闪避"};
  const rows = Object.entries(boosts).filter(([, value]) => value !== 0);
  if (!rows.length) return "无";
  return rows.map(([stat, value]) => `${labels[stat] || stat}${value > 0 ? "+" : ""}${value}`).join(" / ");
}

function ExchangeView({exchange, onSkip, onExchange}: {exchange: DesktopGameState["exchange"]; onSkip: () => void; onExchange: (ownIndex: number, enemyIndex: number) => void}) {
  const [own, setOwn] = useState(0);
  const [enemy, setEnemy] = useState(0);
  if (!exchange) return null;
  return <div className="exchange-page"><h2>胜利后交换</h2><div className="exchange-columns"><div><h3>你的队伍</h3>{exchange.player_display.map((pokemon, index) => <button className={`exchange-card ${own === index ? "selected" : ""}`} onClick={() => setOwn(index)} key={pokemon.species_id}><img src={pokemonImageUrl(pokemon)} alt={displayName(pokemon)} /><span>{displayName(pokemon)}</span><small>{pokemon.item_zh || "无道具"}</small></button>)}</div><div><h3>敌方队伍</h3>{exchange.enemy_display.map((pokemon, index) => <button className={`exchange-card ${enemy === index ? "selected" : ""}`} onClick={() => setEnemy(index)} key={pokemon.species_id}><img src={pokemonImageUrl(pokemon)} alt={displayName(pokemon)} /><span>{displayName(pokemon)}</span><small>{pokemon.item_zh || "无道具"}</small></button>)}</div></div><div className="command-row"><button onClick={() => onExchange(own, enemy)}>交换</button><button onClick={onSkip}>跳过</button></div></div>;
}

function ResultView({message, onBack}: {message: string; onBack: () => void}) {
  return <div className="title-screen small"><h1>结算</h1><p>{message}</p><button onClick={onBack}>返回主界面</button></div>;
}

createRoot(document.getElementById("root")!).render(<App />);
