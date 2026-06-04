import {Fragment, useEffect, useMemo, useRef, useState} from "react";
import {createRoot} from "react-dom/client";
import type {CSSProperties} from "react";
import type {AppStatus, BattleMoveRequest, BattleState, BattleTimelineEvent, DesktopGameState, LocalSave, MoveSummary, PokemonEditOptions, PricedMove, RentalPokemon, RestAction, RuntimePokemon, ShopItem, SpriteMapEntry, TrainerGender} from "@changebattle/shared";
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
const SUBSTITUTE_DOLL_PATH = "assets/battle/substitute-doll.png";

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
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return window.changeBattle?.assetUrl(path);
}

function pokemonImageUrl(pokemon?: {sprite?: SpriteMapEntry}, variant: "front_normal" | "back_normal" = "front_normal"): string | undefined {
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

function bpCostLabel(cost: number | null | undefined): string {
  if (cost === null || cost === undefined) return "-";
  return Number(cost || 0) <= 0 ? "免费" : `${cost}BP`;
}

function restoreCostSuffix(costs: Record<1 | 2 | 3, number>, selectedCount: number, currentCount: number): string {
  const count = selectedCount || currentCount;
  return count > 0 ? `（${bpCostLabel(costs[Math.min(3, count) as 1 | 2 | 3])}）` : "（无需恢复）";
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

type ActiveTrackerDisplay = BattleState["tracker"]["active"]["p1"];

function displayFromActive(active: ActiveTrackerDisplay | undefined, base?: RentalPokemon): RentalPokemon | undefined {
  if (!active?.sprite && !active?.display_name && !active?.species_id) return base;
  const species = active?.name || active?.display_name || base?.species || "Unknown";
  return {
    name: species,
    species,
    species_zh: active?.display_name || base?.species_zh || species,
    species_id: active?.species_id || base?.species_id || toId(species),
    level: base?.level || 50,
    gender: base?.gender || "",
    types: base?.types || [],
    types_zh: base?.types_zh || [],
    ability: base?.ability || "",
    ability_zh: base?.ability_zh || "",
    ability_id: base?.ability_id || "",
    ability_desc: base?.ability_desc || "",
    ability_desc_zh: base?.ability_desc_zh || "",
    item: base?.item || "",
    item_zh: base?.item_zh || "",
    item_id: base?.item_id || "",
    item_desc: base?.item_desc || "",
    item_desc_zh: base?.item_desc_zh || "",
    moves: base?.moves || [],
    base_stats: base?.base_stats || {},
    stats: base?.stats || {},
    evs: base?.evs || {},
    ivs: base?.ivs || {},
    nature: base?.nature || "",
    nature_zh: base?.nature_zh || "",
    nature_plus: base?.nature_plus || "",
    nature_minus: base?.nature_minus || "",
    role: base?.role || "",
    role_zh: base?.role_zh || "",
    sprite: active?.sprite || base?.sprite,
  };
}

function activePokemon(battle: BattleState | null | undefined, side: "p1" | "p2"): {runtime?: RuntimePokemon; display?: RentalPokemon; active?: ActiveTrackerDisplay} {
  const runtime = side === "p1"
    ? battle?.request?.side?.pokemon?.find(pokemon => pokemon.active)
    : undefined;
  const active = battle?.tracker.active[side];
  const activeName = active?.species_id || active?.name || (side === "p1" ? runtimeName(runtime) : "");
  const team = side === "p1" ? battle?.player_display || [] : battle?.enemy_display || [];
  const allDisplays = [...(battle?.player_display || []), ...(battle?.enemy_display || [])];
  const base = findDisplay(team, activeName) || findDisplay(allDisplays, activeName) || findDisplay(team, runtimeName(runtime));
  return {runtime, active, display: displayFromActive(active, base)};
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
    restAction: async () => ({screen: "mainMenu", save, message: "自动测试休整"}),
    shopItems: async () => [],
    learnableMoves: async () => [],
    editOptions: async () => ({abilities: [], natures: []}),
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
  const [rest, setRest] = useState<DesktopGameState["rest"]>(null);
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
    setRest(state.rest || null);
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

  async function restAction(action: RestAction) {
    await runAction(() => window.changeBattle!.restAction(action));
  }

  const content = useMemo(() => {
    if (screen === "title") return <TitleScreen save={save} onLoad={loadGame} onNew={() => setScreen("newGame")} />;
    if (screen === "newGame") return <NewGameScreen name={trainerName} gender={trainerGender} setName={setTrainerName} setGender={setTrainerGender} onCreate={createNewGame} onBack={() => setScreen("title")} />;
    if (screen === "mainMenu") return <MainMenu save={save} onStart={prepareChallenge} onInfo={() => setScreen("userInfo")} onTitle={() => setScreen("title")} />;
    if (screen === "userInfo") return <UserInfo save={save} onSaved={setSave} onBack={() => setScreen("mainMenu")} />;
    if (screen === "rentalSelect") return <RentalSelect candidates={candidates} selected={selected} focusIndex={focusIndex} setFocusIndex={setFocusIndex} onToggle={toggleCandidate} />;
    if (["battleMain", "moveMenu", "teamMenu", "statusMenu"].includes(screen)) return <BattleView battle={battle} mode={screen} setMode={setScreen} onChoice={battleChoice} pendingTransition={pendingTransition} onBattleAnimationDone={applyState} />;
    if (screen === "exchange") return <ExchangeView exchange={exchange} onSkip={() => finishExchange(null, null)} onExchange={finishExchange} />;
    if (screen === "rest") return <RestView rest={rest} message={message} onAction={restAction} />;
    if (screen === "result") return <ResultView message={message} onBack={() => setScreen("mainMenu")} />;
    return null;
  }, [screen, save, trainerName, trainerGender, candidates, selected, focusIndex, battle, exchange, rest, pendingTransition, message]);

  const isBattleScreen = ["battleMain", "moveMenu", "teamMenu", "statusMenu"].includes(screen);
  const hideTextBox = !error && (isBattleScreen || screen === "rest");

  return (
    <main className={`game-shell ${hideTextBox ? "battle-shell" : ""}`}>
      <section className="game-screen">
        {content}
        {loading ? <div className="loading-overlay">正在进入对局...</div> : null}
      </section>
      {hideTextBox ? null : <TextBox message={error || message} danger={Boolean(error)} />}
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
    p1: battle?.tracker.active.p1.name || runtimeName(player.runtime) || "",
    p2: battle?.tracker.active.p2.name || "",
  };
  const finalSubstitutes = {
    p1: Boolean(battle?.tracker.active.p1.substitute),
    p2: Boolean(battle?.tracker.active.p2.substitute),
  };
  const finalFaintedSides = {
    p1: statusCode(finalConditions.p1) === "fnt",
    p2: statusCode(finalConditions.p2) === "fnt",
  };
  const recentEvents = battle?.recent_events.filter(event => event && !event.startsWith("--- 第")) || [];
  const turnEvents = battle ? lastEvents(battle, 14) : [];
  const timelineEvents = battle?.timeline_events || [];
  const timelineKey = timelineEvents.map(event => `${event.id}:${event.text}`).join("\n");
  const recentKey = recentEvents.join("\n");
  const [shownEvents, setShownEvents] = useState(turnEvents);
  const [currentTimelineEvent, setCurrentTimelineEvent] = useState<BattleTimelineEvent | null>(null);
  const [currentVisualCue, setCurrentVisualCue] = useState<BattleVisualCue | null>(null);
  const [playbackActive, setPlaybackActive] = useState(false);
  const [displayConditions, setDisplayConditions] = useState(finalConditions);
  const [displayedActiveNames, setDisplayedActiveNames] = useState(finalActiveNames);
  const [displayedSubstitutes, setDisplayedSubstitutes] = useState(finalSubstitutes);
  const [hpTransitionMs, setHpTransitionMs] = useState({p1: 1400, p2: 1400});
  const [faintedSides, setFaintedSides] = useState({p1: false, p2: false});
  const [introActive, setIntroActive] = useState(false);
  const previousTimelineKeys = useRef<string[]>([]);
  const previousRecentEvents = useRef<string[]>([]);
  const displayConditionsRef = useRef(displayConditions);
  const displayedActiveNamesRef = useRef(displayedActiveNames);
  const displayedSubstitutesRef = useRef(displayedSubstitutes);
  const previousBattlePresent = useRef(false);
  const eventTimers = useRef<number[]>([]);
  const playbackRun = useRef(0);
  const finishRequested = useRef(false);

  useEffect(() => { displayConditionsRef.current = displayConditions; }, [displayConditions]);
  useEffect(() => { displayedActiveNamesRef.current = displayedActiveNames; }, [displayedActiveNames]);
  useEffect(() => { displayedSubstitutesRef.current = displayedSubstitutes; }, [displayedSubstitutes]);
  useEffect(() => {
    const battlePresent = Boolean(battle);
    if (battlePresent && !previousBattlePresent.current) {
      setIntroActive(true);
      const timer = window.setTimeout(() => setIntroActive(false), 1180);
      previousBattlePresent.current = true;
      return () => window.clearTimeout(timer);
    }
    previousBattlePresent.current = battlePresent;
    if (!battlePresent) setIntroActive(false);
  }, [Boolean(battle)]);

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
      setDisplayedSubstitutes(finalSubstitutes);
      setDisplayConditions(finalConditions);
      setFaintedSides(finalFaintedSides);
      previousRecentEvents.current = [];
      return;
    }
    if (!battle.ended) finishRequested.current = false;

    const keys = timelineEvents.map(event => `${event.id}:${event.text}`);
    const known = new Set(previousTimelineKeys.current);
    const addedTimeline = timelineEvents.filter((event, index) => !known.has(keys[index]));
    previousTimelineKeys.current = keys;
    const addedTexts = addedRecentEventTexts(previousRecentEvents.current, recentEvents);
    previousRecentEvents.current = recentEvents;
    const timelinePool = [...addedTimeline];
    const addedFromRecent = addedTexts.map((text, index) => {
      const timelineIndex = timelinePool.findIndex(event => event.text === text);
      if (timelineIndex >= 0) {
        const [event] = timelinePool.splice(timelineIndex, 1);
        return event;
      }
      return {id: `recent-${playbackRun.current}-${index}`, type: "message", text} as BattleTimelineEvent;
    });
    const added = addedFromRecent.length ? [...addedFromRecent, ...timelinePool] : addedTimeline;

    if (!added.length) {
      setShownEvents(turnEvents);
      setCurrentTimelineEvent(null);
      setCurrentVisualCue(null);
      setPlaybackActive(false);
      setFaintedSides(timelineFaintedState(timelineEvents, finalFaintedSides));
      setDisplayedSubstitutes(finalSubstitutes);
      if (battle.ended && pendingTransition && !finishRequested.current) {
        finishRequested.current = true;
        onBattleAnimationDone(pendingTransition);
      }
      return;
    }

    const activeBattle = battle;
    async function playQueue() {
      setPlaybackActive(true);
      if (introActive) {
        await wait(920);
        if (playbackRun.current !== runId) return;
      }
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
          const nextSubstitutes = {...displayedSubstitutesRef.current, [event.targetSide]: false};
          displayedSubstitutesRef.current = nextSubstitutes;
          setDisplayedSubstitutes(nextSubstitutes);
          setFaintedSides(current => ({...current, [event.targetSide!]: false}));
          setCurrentVisualCue(cueFromEntry(battleEffectEntry("battle_action:switch_in"), event, "switch-in", event.targetSide, event.targetSide));
        }
        if (event.type === "form" && event.targetSide && event.target_id) {
          const nextNames = {...displayedActiveNamesRef.current, [event.targetSide]: event.target_id};
          displayedActiveNamesRef.current = nextNames;
          setDisplayedActiveNames(nextNames);
        }
        if (event.type === "substitute" && event.targetSide) {
          const nextSubstitutes = {...displayedSubstitutesRef.current, [event.targetSide]: Boolean(event.substitute)};
          displayedSubstitutesRef.current = nextSubstitutes;
          setDisplayedSubstitutes(nextSubstitutes);
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
      displayedSubstitutesRef.current = finalSubstitutes;
      setDisplayConditions(finalConditions);
      setDisplayedActiveNames(finalActiveNames);
      setDisplayedSubstitutes(finalSubstitutes);
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
  }, [timelineKey, recentKey]);

  if (!battle) return <div className="loading-panel"><strong>正在进入对局...</strong></div>;
  const controlsDisabled = playbackActive;
  const displayPlayer = findDisplay(battle.player_display, displayedActiveNames.p1) || player.display;
  const displayEnemy = findDisplay(battle.enemy_display, displayedActiveNames.p2) || enemy.display;
  const playerSprite = displayedSubstitutes.p1 ? assetUrl(SUBSTITUTE_DOLL_PATH) : pokemonImageUrl(displayPlayer, "back_normal");
  const enemySprite = displayedSubstitutes.p2 ? assetUrl(SUBSTITUTE_DOLL_PATH) : pokemonImageUrl(displayEnemy, "front_normal");
  const messageDuration = currentTimelineEvent ? timelineDuration(currentTimelineEvent, displayConditions[currentTimelineEvent.targetSide || "p1"]) : 1600;
  const messageMs = currentTimelineEvent?.notice_title ? Math.max(2200, messageDuration) : Math.max(900, messageDuration);
  return <div className="battle-layout"><section className={`battle-field ${introActive ? "battle-intro" : ""} ${battleAnimationClass(currentTimelineEvent)}`}><FieldEffectsOverlay battle={battle} /><BattleEffectLayer cue={currentVisualCue} /><div className="turn-badge">第 {battle.tracker.turn} 回合</div><div className="battle-corner-actions"><button disabled={controlsDisabled} onClick={() => setMode("statusMenu")}>状态</button><button className="danger-button" disabled={controlsDisabled} onClick={() => onChoice("forfeit")}>认输</button></div><FighterPanel side="enemy" pokemon={displayEnemy} condition={displayConditions.p2} status={battle.tracker.active.p2.status} substitute={displayedSubstitutes.p2} transitionMs={hpTransitionMs.p2} /><div className="battle-sprites"><img className={`back-sprite ${displayedSubstitutes.p1 ? "substitute-sprite" : ""} ${faintedSides.p1 ? "sprite-fainted" : ""}`} src={playerSprite} /><img className={`front-sprite ${displayedSubstitutes.p2 ? "substitute-sprite" : ""} ${faintedSides.p2 ? "sprite-fainted" : ""}`} src={enemySprite} /></div><FighterPanel side="player" pokemon={displayPlayer} condition={displayConditions.p1} status={battle.tracker.active.p1.status} substitute={displayedSubstitutes.p1} transitionMs={hpTransitionMs.p1} />{currentTimelineEvent ? <div key={currentTimelineEvent.id} className={`battle-message-pop ${currentTimelineEvent.notice_title ? "structured" : ""}`} style={{"--message-duration": `${messageMs}ms`} as CSSProperties}>{currentTimelineEvent.notice_title ? <><strong>{currentTimelineEvent.notice_title}</strong>{currentTimelineEvent.notice_detail ? <small>{currentTimelineEvent.notice_detail}</small> : null}</> : currentTimelineEvent.text}</div> : null}</section><section className="battle-bottom"><div className="battle-log"><strong>上一回合</strong>{shownEvents.map((event, index) => <p className={event === currentTimelineEvent?.text ? "current-event" : ""} key={`${event}-${index}`}>{event}</p>)}</div><div className={`battle-action-panel ${controlsDisabled ? "battle-controls-disabled" : ""}`}>{mode === "moveMenu" ? <MoveMenu battle={battle} disabled={controlsDisabled} onMove={index => onChoice(`move ${index}`)} onBack={() => setMode("battleMain")} /> : mode === "teamMenu" ? <TeamMenu battle={battle} disabled={controlsDisabled} onSwitch={index => onChoice(`switch ${index}`)} onBack={() => setMode("battleMain")} /> : <MainBattleCommands forceSwitch={Boolean(battle.request?.forceSwitch)} disabled={controlsDisabled} setMode={setMode} />}</div></section>{mode === "statusMenu" ? <StatusModal battle={battle} onBack={() => setMode("battleMain")} /> : null}</div>;
}

function FighterPanel({pokemon, condition, status, side, substitute, transitionMs}: {pokemon?: RentalPokemon; condition?: string; status?: string; side: "player" | "enemy"; substitute?: boolean; transitionMs?: number}) {
  const hp = parseHp(condition);
  const code = statusCode(condition, status);
  return <div className={`fighter-panel ${side}`}><strong>{pokemon ? displayName(pokemon) : "未知"}</strong><span>Lv{pokemon?.level || 50}</span>{code ? <i className={`status-badge ${code}`}>{statusLabel(code)}</i> : null}{substitute ? <i className="substitute-badge">替身</i> : null}<div className="hp-line"><i style={{width: `${hp ? Math.max(0, (hp.current / hp.max) * 100) : 0}%`, "--hp-duration": `${transitionMs || 1400}ms`} as CSSProperties} /></div><small>{hp?.text || conditionText(condition)}</small></div>;
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

function addedRecentEventTexts(previous: string[], current: string[]): string[] {
  let overlap = 0;
  const maxOverlap = Math.min(previous.length, current.length);
  for (let size = maxOverlap; size > 0; size -= 1) {
    const previousTail = previous.slice(previous.length - size);
    const currentHead = current.slice(0, size);
    if (previousTail.every((text, index) => text === currentHead[index])) {
      overlap = size;
      break;
    }
  }
  return current.slice(overlap);
}

function timelineDuration(event: BattleTimelineEvent, previousCondition?: string): number {
  const faster = (ms: number) => Math.max(500, ms - 500);
  if (event.type === "damage" || event.type === "heal") {
    const previous = parseHp(previousCondition);
    const next = event.hp || parseHp(event.condition);
    const ratio = previous && next && previous.max > 0 ? Math.abs(previous.current - next.current) / previous.max : 0.25;
    return faster(Math.round(Math.max(1000, Math.min(5000, 1000 + ratio * 4000))));
  }
  if (event.type === "move") return faster(2600);
  if (event.type === "faint") return faster(2600);
  if (event.type === "switch") return faster(2300);
  if (event.type === "win") return faster(2600);
  return faster(2100);
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

function RestView({rest, message, onAction}: {rest: DesktopGameState["rest"]; message?: string; onAction: (action: RestAction) => void | Promise<void>}) {
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [own, setOwn] = useState(0);
  const [enemy, setEnemy] = useState(0);
  const [bagItem, setBagItem] = useState("");
  const [shopQuery, setShopQuery] = useState("");
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [shopLoading, setShopLoading] = useState(false);
  const [shopError, setShopError] = useState("");
  const [shopOpen, setShopOpen] = useState(false);
  const [moveEditorOpen, setMoveEditorOpen] = useState(false);
  const [statsEditorOpen, setStatsEditorOpen] = useState(false);
  const [abortConfirmOpen, setAbortConfirmOpen] = useState(false);

  useEffect(() => {
    if (!shopOpen) return;
    let cancelled = false;
    setShopLoading(true);
    setShopError("");
    void window.changeBattle!.shopItems(shopQuery).then(items => {
      if (!cancelled) setShopItems(items);
    }).catch(err => {
      if (!cancelled) {
        setShopItems([]);
        setShopError(err instanceof Error ? err.message : String(err));
      }
    }).finally(() => {
      if (!cancelled) setShopLoading(false);
    });
    return () => { cancelled = true; };
  }, [shopQuery, shopOpen]);

  if (!rest) return <div className="loading-panel"><strong>正在整理队伍...</strong></div>;
  const selectedOneBased = selectedSlots.map(index => index + 1);
  const bagEntries = Object.entries(rest.bag_items || {}).filter(([, count]) => count > 0);
  const canExchange = rest.costs.exchange !== null && rest.enemy_display.length > 0 && !rest.taken_enemy_slots.includes(enemy + 1);
  const hpRestoreCount = rest.player_state.filter(state => Number(state.hp || 0) < Number(state.maxhp || 0)).length;
  const ppRestoreCount = rest.player_state.filter(state => (state.moves || []).some(move => Number(move.pp || 0) < Number(move.maxpp || 0))).length;
  const statusRestoreCount = rest.player_state.filter(state => Boolean(state.status)).length;

  function toggleSlot(index: number) {
    setSelectedSlots(current => current.includes(index) ? current.filter(value => value !== index) : [...current, index].sort());
  }

  return (
    <div className="rest-page">
      <header className="rest-header">
        <div>
          <h2>休整菜单</h2>
          <p>第 {rest.battle_no}/{rest.battles} 场后　连胜 {rest.wins}　BP {rest.battle_points}</p>
          {message ? <p className="rest-message">{message}</p> : null}
        </div>
        <div className="rest-header-actions">
          <button className="danger-button" onClick={() => setAbortConfirmOpen(true)}>中断挑战</button>
          <button onClick={() => onAction({type: "next"})}>下一场</button>
        </div>
      </header>
      <section className="rest-team-panel">
        <h3>你的队伍</h3>
        <div className="rest-team-list">
          {rest.player_display.map((pokemon, index) => {
            const state = rest.player_state[index];
            const selected = selectedSlots.includes(index);
            const status = statusCode(state?.condition, state?.status);
            return <button className={`rest-team-card ${selected ? "selected" : ""}`} onClick={() => toggleSlot(index)} key={`${pokemon.species_id}-${index}`}><img src={pokemonImageUrl(pokemon)} alt={displayName(pokemon)} /><strong>{index + 1}. {displayName(pokemon)}</strong>{status ? <i className={`status-badge ${status}`}>{statusLabel(status)}</i> : null}<span>{conditionText(state?.condition)}</span><small>{pokemon.item_zh || "无道具"}　{(state?.moves || []).map(move => `${move.move} ${move.pp}/${move.maxpp}`).join(" / ")}</small></button>;
          })}
        </div>
        <div className="rest-actions">
          <button disabled={!selectedSlots.length} onClick={() => onAction({type: "restore_hp", slots: selectedOneBased})}>恢复HP{restoreCostSuffix(rest.costs.restore_hp, selectedSlots.length, hpRestoreCount)}</button>
          <button disabled={!selectedSlots.length} onClick={() => onAction({type: "restore_pp", slots: selectedOneBased})}>恢复PP{restoreCostSuffix(rest.costs.restore_pp, selectedSlots.length, ppRestoreCount)}</button>
          <button disabled={!selectedSlots.length} onClick={() => onAction({type: "restore_status", slots: selectedOneBased})}>恢复异常{restoreCostSuffix(rest.costs.restore_status, selectedSlots.length, statusRestoreCount)}</button>
          <button onClick={() => setMoveEditorOpen(true)}>调整技能</button>
          <button onClick={() => setStatsEditorOpen(true)}>调整能力值 {bpCostLabel(rest.costs.adjust_stats)}</button>
        </div>
      </section>
      <section className="rest-exchange-panel">
        <h3>交换宝可梦</h3>
        <div className="rest-exchange-grid">
          <div>{rest.player_display.map((pokemon, index) => <button className={`mini-pokemon-card ${own === index ? "selected" : ""}`} onClick={() => setOwn(index)} key={`${pokemon.species_id}-own-${index}`}><img src={pokemonImageUrl(pokemon)} alt={displayName(pokemon)} /><span>{displayName(pokemon)}</span></button>)}</div>
          <div>{rest.enemy_display.map((pokemon, index) => <button className={`mini-pokemon-card ${enemy === index ? "selected" : ""}`} disabled={rest.taken_enemy_slots.includes(index + 1)} onClick={() => setEnemy(index)} key={`${pokemon.species_id}-enemy-${index}`}><img src={pokemonImageUrl(pokemon)} alt={displayName(pokemon)} /><span>{displayName(pokemon)}</span>{rest.taken_enemy_slots.includes(index + 1) ? <small>已交换</small> : null}</button>)}</div>
        </div>
        <button disabled={!canExchange} onClick={() => onAction({type: "exchange", ownIndex: own, enemyIndex: enemy})}>交换</button>
      </section>
      <section className="rest-bag-panel">
        <div className="rest-bag-head"><h3>本局背包</h3><button onClick={() => setShopOpen(true)}>购买道具</button></div>
        <div className="bag-list">
          {bagEntries.length ? bagEntries.map(([itemId, count]) => <button className={bagItem === itemId ? "selected" : ""} onClick={() => setBagItem(itemId)} key={itemId}>{itemId} x{count}</button>) : <span>空</span>}
        </div>
        <div className="rest-actions">
          {rest.player_display.map((pokemon, index) => <button disabled={!bagItem} onClick={() => onAction({type: "equip_item", itemId: bagItem, slot: index})} key={`equip-${pokemon.species_id}-${index}`}>给 {displayName(pokemon)} 装备</button>)}
          <button disabled={!selectedSlots.length} onClick={() => onAction({type: "unequip_item", slot: selectedSlots[0]})}>卸下选中道具</button>
        </div>
      </section>
      {shopOpen ? <ShopModal query={shopQuery} setQuery={setShopQuery} items={shopItems} loading={shopLoading} error={shopError} onClose={() => setShopOpen(false)} onBuy={async itemId => { await onAction({type: "buy_item", itemId}); setShopOpen(false); }} /> : null}
      {moveEditorOpen ? <MoveAdjustModal rest={rest} onClose={() => setMoveEditorOpen(false)} onAction={onAction} /> : null}
      {statsEditorOpen ? <StatsAdjustModal rest={rest} onClose={() => setStatsEditorOpen(false)} onAction={onAction} /> : null}
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
    </div>
  );
}

function ShopModal({query, setQuery, items, loading, error, onClose, onBuy}: {query: string; setQuery: (value: string) => void; items: ShopItem[]; loading: boolean; error: string; onClose: () => void; onBuy: (itemId: string) => void | Promise<void>}) {
  return (
    <div className="modal-layer">
      <section className="shop-modal">
        <header>
          <h2>购买道具</h2>
          <button onClick={onClose}>关闭</button>
        </header>
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索道具中文/英文/ID" />
        {error ? <p className="editor-warning">{error}</p> : loading ? <p>正在读取道具...</p> : null}
        <div className="shop-list">
          {items.length ? items.map(item => (
            <button onClick={() => onBuy(item.id)} key={item.id}>
              <strong>{item.name_zh || item.name}</strong>
              <span>{bpCostLabel(item.cost)}</span>
              <small>{item.desc_zh || item.desc || item.name}</small>
            </button>
          )) : !loading && !error ? <p>没有匹配的道具。</p> : null}
        </div>
      </section>
    </div>
  );
}

function MoveAdjustModal({rest, onClose, onAction}: {rest: NonNullable<DesktopGameState["rest"]>; onClose: () => void; onAction: (action: RestAction) => void | Promise<void>}) {
  const [slot, setSlot] = useState(0);
  const [moveSlot, setMoveSlot] = useState(0);
  const [query, setQuery] = useState("");
  const [moves, setMoves] = useState<PricedMove[]>([]);
  const [moveError, setMoveError] = useState("");
  const [movesLoading, setMovesLoading] = useState(false);
  const playerDisplay = rest.player_display || [];
  const pokemon = playerDisplay[slot] || playerDisplay[0];
  const pokemonMoves = pokemon?.moves || [];
  const currentMove = pokemonMoves[moveSlot];
  const knownMoveIds = new Set(pokemonMoves.map(move => toId(move.id || move.name || move.name_zh)));

  useEffect(() => {
    let cancelled = false;
    setMovesLoading(true);
    setMoveError("");
    void window.changeBattle!.learnableMoves(slot, query).then(next => {
      if (!cancelled) setMoves(next);
    }).catch(err => {
      if (!cancelled) {
        setMoves([]);
        setMoveError(err instanceof Error ? err.message : String(err));
      }
    }).finally(() => {
      if (!cancelled) setMovesLoading(false);
    });
    return () => { cancelled = true; };
  }, [slot, query]);

  return <div className="modal-layer"><section className="rest-edit-modal"><header><h2>调整技能</h2><button onClick={onClose}>关闭</button></header><div className="editor-layout"><aside className="editor-side-list">{playerDisplay.map((entry, index) => <button className={slot === index ? "selected" : ""} onClick={() => { setSlot(index); setMoveSlot(0); }} key={`${entry.species_id}-move-editor-${index}`}><img src={pokemonImageUrl(entry)} alt={displayName(entry)} /><span>{displayName(entry)}</span></button>)}</aside><section className="editor-main"><h3>{displayName(pokemon)}：替换 {currentMove?.name_zh || "选择招式格"}</h3><div className="move-slot-row">{pokemonMoves.map((move, index) => <button className={moveSlot === index ? "selected" : ""} onClick={() => setMoveSlot(index)} key={`${move.id}-${index}`}>{index + 1}. {move.name_zh}</button>)}</div><input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索新技能中文/英文/ID" />{moveError ? <p className="editor-warning">{moveError}</p> : movesLoading ? <p>正在读取可学习招式...</p> : null}<div className="learnable-list">{moves.length ? moves.map(move => {
    const known = knownMoveIds.has(toId(move.id || move.name || move.name_zh));
    return <button className={known ? "already-known" : ""} disabled={known} onClick={() => { onAction({type: "adjust_move", slot, moveSlot, moveId: move.id}); onClose(); }} key={move.id}><strong>{move.name_zh || move.name}</strong><span>{move.type_zh}/{move.category_zh}　威力 {move.power || "--"}　PP {move.pp}　{bpCostLabel(move.cost)}{known ? "　已掌握" : ""}</span><small>{move.desc_zh || move.desc || "暂无说明"}</small></button>;
  }) : !movesLoading && !moveError ? <p>没有匹配的可学习招式。</p> : null}</div></section></div></section></div>;
}

function StatsAdjustModal({rest, onClose, onAction}: {rest: NonNullable<DesktopGameState["rest"]>; onClose: () => void; onAction: (action: RestAction) => void}) {
  const [slot, setSlot] = useState(0);
  const pokemon = rest.player_display[slot];
  const [ivs, setIvs] = useState<Record<string, number>>(() => ({...rest.player_display[0].ivs}));
  const [evs, setEvs] = useState<Record<string, number>>(() => ({...rest.player_display[0].evs}));
  const [ability, setAbility] = useState(rest.player_display[0].ability);
  const [nature, setNature] = useState(rest.player_display[0].nature || "Serious");
  const [options, setOptions] = useState<PokemonEditOptions>({abilities: [], natures: []});

  useEffect(() => {
    const next = rest.player_display[slot];
    setIvs({...next.ivs});
    setEvs({...next.evs});
    setAbility(next.ability);
    setNature(next.nature || "Serious");
    let cancelled = false;
    void window.changeBattle!.editOptions(slot).then(nextOptions => {
      if (!cancelled) setOptions(nextOptions);
    }).catch(() => {
      if (!cancelled) setOptions({abilities: [], natures: []});
    });
    return () => { cancelled = true; };
  }, [slot, rest.player_display]);

  function setStat(target: "ivs" | "evs", stat: string, value: string) {
    const parsed = Number(value);
    const setter = target === "ivs" ? setIvs : setEvs;
    setter(current => ({...current, [stat]: Number.isFinite(parsed) ? parsed : 0}));
  }

  const evTotal = STAT_ROWS.reduce((sum, [stat]) => sum + Number(evs[stat] || 0), 0);
  return <div className="modal-layer"><section className="rest-edit-modal stats-editor"><header><h2>调整能力值</h2><button onClick={onClose}>关闭</button></header><div className="editor-layout"><aside className="editor-side-list">{rest.player_display.map((entry, index) => <button className={slot === index ? "selected" : ""} onClick={() => setSlot(index)} key={`${entry.species_id}-stats-editor`}><img src={pokemonImageUrl(entry)} alt={displayName(entry)} /><span>{displayName(entry)}</span></button>)}</aside><section className="editor-main"><h3>{displayName(pokemon)}　费用 {bpCostLabel(rest.costs.adjust_stats)}</h3><div className="stats-editor-controls"><label>特性<select value={ability} onChange={event => setAbility(event.target.value)}>{options.abilities.map(option => <option value={option.name} key={option.id}>{option.name_zh}</option>)}</select></label><label>性格<select value={nature} onChange={event => setNature(event.target.value)}>{options.natures.map(option => <option value={option.name} key={option.id}>{option.name_zh} {option.plus ? `${option.plus_zh}↑ / ${option.minus_zh}↓` : "无修正"}</option>)}</select></label></div><div className="stat-edit-grid"><strong>能力</strong><strong>个体值</strong><strong>努力值</strong><strong>当前</strong>{STAT_ROWS.map(([stat, label]) => <Fragment key={stat}><span>{label}</span><input type="number" min={0} max={31} value={ivs[stat] ?? 31} onChange={event => setStat("ivs", stat, event.target.value)} /><input type="number" min={0} max={255} value={evs[stat] ?? 0} onChange={event => setStat("evs", stat, event.target.value)} /><span>{pokemon.stats[stat]}</span></Fragment>)}</div><p className={evTotal > 510 ? "editor-warning" : ""}>努力值合计：{evTotal}/510</p><div className="command-row"><button onClick={() => { onAction({type: "adjust_stats", slot, ivs, evs, ability, nature}); onClose(); }}>保存调整 {bpCostLabel(rest.costs.adjust_stats)}</button><button onClick={onClose}>放弃</button></div></section></div></section></div>;
}

function ResultView({message, onBack}: {message: string; onBack: () => void}) {
  return <div className="title-screen small"><h1>结算</h1><p>{message}</p><button onClick={onBack}>返回主界面</button></div>;
}

createRoot(document.getElementById("root")!).render(<App />);
