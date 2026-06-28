import {useMemo, useState, type CSSProperties} from "react";
import {motion} from "motion/react";
import type {
  ChangeBattleV2Api,
  BagStateV4,
  LocalPokemonV4,
  PlayerItemInstanceV4,
  ShowdownPlayerIdV4,
  TrainingModeV4,
  TrainingNpcV4,
  TrainingPlayerDraftV4,
  TrainingRuleSetV4,
  TrainingRunGameV4,
  StatTableV4,
  TrainingMoveSlotV4,
  TrainingStatusV4,
} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import {TrainingDexSelect, type TrainingDexSelectOption} from "./TrainingDexSelect";
import "./TrainingConfigPage.css";

export type TrainingConfigPageProps = {
  api: ChangeBattleV2Api;
  run: TrainingRunGameV4;
  onRunChange: (run: TrainingRunGameV4) => void;
  onStartRun: (run: TrainingRunGameV4) => void | Promise<void>;
  onStartRunNew: (run: TrainingRunGameV4) => void | Promise<void>;
  onBack: () => void;
};

const MODE_LABEL: Record<TrainingModeV4, string> = {
  singles: "单打",
  doubles: "双打",
  coop: "合作",
};

const RULE_LABEL: Record<TrainingRuleSetV4, string> = {
  standard: "无特殊系统",
  gen7: "Gen7",
  gen8: "Gen8",
  gen9: "Gen9",
};

const STAT_LABEL: Record<keyof StatTableV4, string> = {
  hp: "HP",
  atk: "攻击",
  def: "防御",
  spa: "特攻",
  spd: "特防",
  spe: "速度",
};

const STATUS_LABEL: Record<TrainingStatusV4, string> = {
  "": "无异常",
  brn: "灼伤",
  par: "麻痹",
  psn: "中毒",
  tox: "剧毒",
  slp: "睡眠",
  frz: "冰冻",
};

const NATURE_OPTIONS = [
  ["Hardy", "勤奋"], ["Lonely", "怕寂寞"], ["Brave", "勇敢"], ["Adamant", "固执"], ["Naughty", "顽皮"],
  ["Bold", "大胆"], ["Docile", "坦率"], ["Relaxed", "悠闲"], ["Impish", "淘气"], ["Lax", "乐天"],
  ["Timid", "胆小"], ["Hasty", "急躁"], ["Serious", "认真"], ["Jolly", "爽朗"], ["Naive", "天真"],
  ["Modest", "内敛"], ["Mild", "慢吞吞"], ["Quiet", "冷静"], ["Bashful", "害羞"], ["Rash", "马虎"],
  ["Calm", "温和"], ["Gentle", "温顺"], ["Sassy", "自大"], ["Careful", "慎重"], ["Quirky", "浮躁"],
] as const;

const NATURE_LABEL = Object.fromEntries(NATURE_OPTIONS.map(([id, label]) => [id, label])) as Record<string, string>;
const TEST_BAG_ITEM_IDS = [
  "leftovers", "lifeorb", "oranberry", "potion", "ether",
  "ev-hp-plus", "ev-atk-down", "adamantmint", "abilitycapsule", "abilitypatch",
  "rarecandy", "bottlecap", "goldbottlecap", "graybottlecap",
  "tm:thunderbolt", "system-mega-stone", "system-z-crystal", "system-tera-orb",
];

export function TrainingConfigPage({api, run, onRunChange, onStartRun, onStartRunNew, onBack}: TrainingConfigPageProps) {
  const npcs = useMemo(() => api.createTrainingNpcCatalog(), [api]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<ShowdownPlayerIdV4>("p1");
  const [selectedPokemonId, setSelectedPokemonId] = useState(run.scenario.players[0]?.localTeam.pokemon[0]?.localPokemonId || "");
  const [activeDesignTab, setActiveDesignTab] = useState<string>("team:p1");
  const [message, setMessage] = useState("训练配置已就绪。");
  const [randomizing, setRandomizing] = useState(false);
  const players = run.scenario.players;
  const selectedPlayer = players.find(player => player.playerId === selectedPlayerId) || players[0]!;
  const selectedPokemon = selectedPlayer.localTeam.pokemon.find(pokemon => pokemon.localPokemonId === selectedPokemonId) || selectedPlayer.localTeam.pokemon[0] || null;

  function commit(next: TrainingRunGameV4, nextMessage = "训练配置已更新。") {
    onRunChange(next);
    setMessage(nextMessage);
  }

  async function save(next = run, nextMessage = "训练配置已保存。") {
    const saved = await api.saveTrainingRun(next);
    commit(saved, nextMessage);
  }

  function patchScenario(patch: Parameters<typeof api.updateTrainingScenario>[1], nextMessage?: string) {
    const next = api.updateTrainingScenario(run, patch);
    commit(next, nextMessage);
  }

  function setMode(mode: TrainingModeV4) {
    const players = run.scenario.players.map(player => ({...player, bag: api.ensureDefaultSystemItemsForRuleSet(player.bag, run.scenario.ruleSet)}));
    const next = api.updateTrainingScenario(run, {mode, players});
    commit(next, `已切换为${MODE_LABEL[mode]}。`);
    const first = next.scenario.players[0];
    if (first) {
      setSelectedPlayerId(first.playerId);
      setActiveDesignTab(`team:${first.playerId}`);
      setSelectedPokemonId(first.localTeam.pokemon[0]?.localPokemonId || "");
    }
  }

  function setRuleSet(ruleSet: TrainingRuleSetV4) {
    const players = run.scenario.players.map(player => ({...player, bag: api.ensureDefaultSystemItemsForRuleSet(player.bag, ruleSet)}));
    const next = api.updateTrainingScenario(run, {ruleSet, players});
    commit(next, `规则已切换为 ${RULE_LABEL[ruleSet]}。`);
  }

  function setNpc(playerId: ShowdownPlayerIdV4, npcId: string) {
    const npc = npcs.find(entry => entry.id === npcId);
    if (!npc) return;
    const players = run.scenario.players.map(player => {
      if (player.playerId !== playerId) return player;
      return {...player, name: npc.name, avatar: npc.avatar};
    });
    patchScenario({players, selectedNpcIds: {...run.scenario.selectedNpcIds, [playerId]: npcId}}, `已选择 ${npc.name}。`);
  }

  function runRandomizer(work: () => void) {
    setRandomizing(true);
    setMessage("正在随机...");
    window.setTimeout(() => {
      work();
      setRandomizing(false);
    }, 120);
  }

  function randomizeAllTeams() {
    runRandomizer(() => {
      const size = teamSizeForMode(run.scenario.mode);
      const players = run.scenario.players.map(player => ({...player, localTeam: api.randomizeTrainingTeam(player.playerId, size)}));
      const next = api.updateTrainingScenario(run, {players});
      commit(next, "已按当前规则随机全部队伍。");
      const player = next.scenario.players.find(entry => entry.playerId === selectedPlayer.playerId) || next.scenario.players[0];
      if (player) {
        setSelectedPlayerId(player.playerId);
        setSelectedPokemonId(player.localTeam.pokemon[0]?.localPokemonId || "");
      }
    });
  }

  function randomizePlayerTeam(playerId: ShowdownPlayerIdV4) {
    runRandomizer(() => {
      const size = teamSizeForMode(run.scenario.mode);
      const players = run.scenario.players.map(player => player.playerId === playerId ? {...player, localTeam: api.randomizeTrainingTeam(playerId, size)} : player);
      const next = api.updateTrainingScenario(run, {players});
      commit(next, "队伍已随机。");
      const player = next.scenario.players.find(entry => entry.playerId === playerId);
      setSelectedPlayerId(playerId);
      setSelectedPokemonId(player?.localTeam.pokemon[0]?.localPokemonId || "");
    });
  }

  function movePokemon(playerId: ShowdownPlayerIdV4, pokemonId: string, direction: -1 | 1) {
    const players = run.scenario.players.map(player => {
      if (player.playerId !== playerId) return player;
      const index = player.localTeam.pokemon.findIndex(pokemon => pokemon.localPokemonId === pokemonId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= player.localTeam.pokemon.length) return player;
      const pokemon = [...player.localTeam.pokemon];
      const [entry] = pokemon.splice(index, 1);
      if (!entry) return player;
      pokemon.splice(target, 0, entry);
      return {...player, localTeam: {...player.localTeam, pokemon}};
    });
    const next = api.updateTrainingScenario(run, {players});
    commit(next, "队伍顺序已调整。");
  }

  function patchPokemon(pokemonId: string, patch: Partial<LocalPokemonV4>) {
    const players = run.scenario.players.map(player => {
      if (player.playerId !== selectedPlayer.playerId) return player;
      return {
        ...player,
        localTeam: {
          ...player.localTeam,
          pokemon: player.localTeam.pokemon.map(pokemon => pokemon.localPokemonId === pokemonId ? {...pokemon, ...patch} : pokemon),
        },
      };
    });
    const next = api.updateTrainingScenario(run, {players});
    commit(next, "宝可梦配置已更新。");
  }

  function patchPlayerBag(playerId: ShowdownPlayerIdV4, bag: BagStateV4, nextMessage = "背包已更新。") {
    const players = run.scenario.players.map(player => player.playerId === playerId ? {...player, bag: api.normalizeBagState(bag)} : player);
    const next = api.updateTrainingScenario(run, {players});
    commit(next, nextMessage);
  }

  function addBagItem(playerId: ShowdownPlayerIdV4, itemID: string) {
    const player = run.scenario.players.find(entry => entry.playerId === playerId);
    if (!player) return;
    const bag = api.normalizeBagState(player.bag);
    if (bag.items.length >= bag.maxSize) {
      setMessage(`背包已满：${bag.items.length}/${bag.maxSize}。`);
      return;
    }
    const instance = api.createItemInstance(itemID);
    patchPlayerBag(playerId, {...bag, items: [...bag.items, instance]}, `已添加 ${instance.name}。`);
  }

  function deleteBagItem(playerId: ShowdownPlayerIdV4, instanceId: string) {
    const player = run.scenario.players.find(entry => entry.playerId === playerId);
    if (!player) return;
    const bag = api.normalizeBagState(player.bag);
    const item = bag.items.find(entry => entry.id === instanceId);
    if (item && isManagedSystemItem(item)) {
      setMessage("系统战斗道具由规则自动管理，不能手动删除。");
      return;
    }
    patchPlayerBag(playerId, {...bag, items: bag.items.filter(item => item.id !== instanceId)}, "道具实例已删除。");
  }

  function patchBagItem(playerId: ShowdownPlayerIdV4, instanceId: string, patch: Partial<PlayerItemInstanceV4>) {
    const player = run.scenario.players.find(entry => entry.playerId === playerId);
    if (!player) return;
    const bag = api.normalizeBagState(player.bag);
    patchPlayerBag(playerId, {...bag, items: bag.items.map(item => item.id === instanceId ? {...item, ...patch} : item)}, "道具实例已更新。");
  }

  function toggleBattleBag(playerId: ShowdownPlayerIdV4, enabled: boolean) {
    const player = run.scenario.players.find(entry => entry.playerId === playerId);
    if (!player) return;
    const bag = api.normalizeBagState(player.bag);
    patchPlayerBag(playerId, {...bag, battleBagEnabled: enabled}, enabled ? "战斗背包开关已开启。" : "战斗背包开关已关闭。");
  }

  function seedTestBag(playerId: ShowdownPlayerIdV4) {
    const player = run.scenario.players.find(entry => entry.playerId === playerId);
    if (!player) return;
    const bag = api.normalizeBagState(player.bag);
    const openSlots = Math.max(0, bag.maxSize - bag.items.length);
    if (!openSlots) {
      setMessage(`背包已满：${bag.items.length}/${bag.maxSize}。`);
      return;
    }
    const additions = TEST_BAG_ITEM_IDS.slice(0, openSlots).map(itemID => api.createItemInstance(itemID));
    const skipped = TEST_BAG_ITEM_IDS.length - additions.length;
    patchPlayerBag(
      playerId,
      {...bag, items: [...bag.items, ...additions]},
      skipped > 0 ? `测试道具已添加 ${additions.length} 个，容量不足跳过 ${skipped} 个。` : "测试背包已生成。",
    );
  }

  return (
    <motion.section className="training-config-page" initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} transition={{type: "spring", stiffness: 300, damping: 30}}>
      <TrainingRuleBar
        mode={run.scenario.mode}
        ruleSet={run.scenario.ruleSet}
        battleCount={run.scenario.battleCount}
        onMode={setMode}
        onRuleSet={setRuleSet}
        onBattleCount={battleCount => patchScenario({battleCount}, `对局数量：${battleCount}。`)}
      />
      <TrainingDesignTabs
        players={players}
        activeTab={activeDesignTab}
        onTeamTab={player => {
          setActiveDesignTab(`team:${player.playerId}`);
          setSelectedPlayerId(player.playerId);
          setSelectedPokemonId(player.localTeam.pokemon[0]?.localPokemonId || "");
        }}
        onBagTab={() => {
          const p1 = players.find(player => player.playerId === "p1") || players[0];
          if (!p1) return;
          setActiveDesignTab("bag:p1");
          setSelectedPlayerId(p1.playerId);
        }}
      />
      <div className={`training-config-layout ${activeDesignTab === "bag:p1" ? "bag-mode" : ""}`}>
        <TrainingPlayersPanel
          players={players}
          npcs={npcs}
          selectedPlayerId={selectedPlayer.playerId}
          selectedNpcIds={run.scenario.selectedNpcIds}
          mode={run.scenario.mode}
          onSelectPlayer={player => {
            setActiveDesignTab(`team:${player.playerId}`);
            setSelectedPlayerId(player.playerId);
            setSelectedPokemonId(player.localTeam.pokemon[0]?.localPokemonId || "");
          }}
          onNpc={setNpc}
        />
        {activeDesignTab === "bag:p1" ? (
          <TrainingBagPanel
            api={api}
            player={players.find(player => player.playerId === "p1") || selectedPlayer}
            onAdd={itemID => addBagItem("p1", itemID)}
            onDelete={instanceId => deleteBagItem("p1", instanceId)}
            onPatchItem={(instanceId, patch) => patchBagItem("p1", instanceId, patch)}
            onToggleBattleBag={enabled => toggleBattleBag("p1", enabled)}
            onSeedTestBag={() => seedTestBag("p1")}
          />
        ) : (
          <>
          <TrainingPokemonEditor api={api} pokemon={selectedPokemon} onPatch={patch => selectedPokemon ? patchPokemon(selectedPokemon.localPokemonId, patch) : undefined} />
          <TrainingTeamPanel
            player={selectedPlayer}
            selectedPokemonId={selectedPokemon?.localPokemonId || ""}
            onSelect={pokemon => setSelectedPokemonId(pokemon.localPokemonId)}
            onRandomize={() => randomizePlayerTeam(selectedPlayer.playerId)}
            onMove={(pokemonId, direction) => movePokemon(selectedPlayer.playerId, pokemonId, direction)}
          />
          </>
        )}
      </div>
      <footer className="training-config-actions">
        <span>{message}</span>
        <button type="button" disabled={randomizing} onClick={() => randomizePlayerTeam(selectedPlayer.playerId)}>快速随机</button>
        <button type="button" disabled={randomizing} onClick={randomizeAllTeams}>随机全部</button>
        <button type="button" onClick={() => void save()}>保存配置</button>
        <button type="button" className="primary" disabled={randomizing} onClick={() => void onStartRun(run)}>开始战斗</button>
        <button type="button" className="primary alt" disabled={randomizing} onClick={() => void onStartRunNew(run)}>开始游戏（新）</button>
        <button type="button" onClick={onBack}>返回</button>
      </footer>
      {randomizing ? <div className="training-randomizing-toast" role="status">正在随机...</div> : null}
    </motion.section>
  );
}

function TrainingDesignTabs({players, activeTab, onTeamTab, onBagTab}: {
  players: TrainingPlayerDraftV4[];
  activeTab: string;
  onTeamTab: (player: TrainingPlayerDraftV4) => void;
  onBagTab: () => void;
}) {
  return (
    <nav className="training-design-tabs" aria-label="训练设计标签">
      {players.map(player => (
        <button className={activeTab === `team:${player.playerId}` ? "active" : ""} type="button" onClick={() => onTeamTab(player)} key={`team-${player.playerId}`}>
          {player.playerId.toUpperCase()}队伍设计
        </button>
      ))}
      <button className={activeTab === "bag:p1" ? "active" : ""} type="button" onClick={onBagTab}>P1背包设计</button>
    </nav>
  );
}

function TrainingBagPanel({api, player, onAdd, onDelete, onPatchItem, onToggleBattleBag, onSeedTestBag}: {
  api: ChangeBattleV2Api;
  player: TrainingPlayerDraftV4;
  onAdd: (itemID: string) => void;
  onDelete: (instanceId: string) => void;
  onPatchItem: (instanceId: string, patch: Partial<PlayerItemInstanceV4>) => void;
  onToggleBattleBag: (enabled: boolean) => void;
  onSeedTestBag: () => void;
}) {
  const bag = api.normalizeBagState(player.bag);
  const [selectedId, setSelectedId] = useState(bag.items[0]?.id || "");
  const selected = bag.items.find(item => item.id === selectedId) || bag.items[0] || null;
  const selectedDetail = useMemo(() => {
    if (!selected) return null;
    try {
      return api.getItemDetail(selected.itemID);
    } catch {
      return null;
    }
  }, [api, selected]);
  const addDisplay = bag.items.length >= bag.maxSize ? `容量已满 ${bag.items.length}/${bag.maxSize}` : "搜索并添加道具";
  const selectedIsManagedSystemItem = Boolean(selected && isManagedSystemItem(selected));
  return (
    <section className="training-bag-panel">
      <header>
        <strong>背包管理</strong>
        <span>{bag.items.length}/{bag.maxSize}</span>
      </header>
      <label className="training-bag-toggle">
        <input type="checkbox" checked={Boolean(bag.battleBagEnabled)} onChange={event => onToggleBattleBag(event.target.checked)} />
        <span>允许战斗页使用背包道具</span>
      </label>
      <TrainingDexSelect api={api} category="items" label="添加" value="" display={addDisplay} onSelect={itemID => onAdd(itemID)} />
      <button className="training-bag-seed-button" type="button" onClick={onSeedTestBag}>生成测试背包</button>
      <div className="training-bag-list">
        {bag.items.length ? bag.items.map(item => (
          <button className={item.id === selected?.id ? "selected" : ""} type="button" onClick={() => setSelectedId(item.id)} key={item.id}>
            <BagItemIcon api={api} item={item} />
            <strong>{item.name}</strong>
            <small>{bagItemListText(api, item)}</small>
          </button>
        )) : <p>背包为空。</p>}
      </div>
      {selected ? (
        <div className="training-bag-detail">
          <div className="training-bag-detail-title">
            <BagItemIcon api={api} item={selected} />
            <div>
              <strong>{selected.name}</strong>
              <small>{selectedDetail?.description || selected.itemID}</small>
            </div>
          </div>
          <div className="training-bag-edit-grid">
            <label><span>价格</span><input type="number" value={selected.cost} onChange={event => onPatchItem(selected.id, {cost: Number(event.target.value)})} /></label>
            <label><span>获取回合</span><input type="number" value={selected.getRound} onChange={event => onPatchItem(selected.id, {getRound: Number(event.target.value)})} /></label>
            <label><span>有效回合</span><input type="number" value={selected.effectRound ?? ""} placeholder="不限" onChange={event => onPatchItem(selected.id, {effectRound: nullableNumberFromInput(event.currentTarget.value)})} /></label>
            <label><span>使用次数</span><input type="number" value={selected.useCount} onChange={event => onPatchItem(selected.id, {useCount: Number(event.target.value)})} /></label>
            <label><span>最大次数</span><input type="number" value={selected.maxUseCount ?? ""} placeholder="不限" onChange={event => onPatchItem(selected.id, {maxUseCount: nullableNumberFromInput(event.currentTarget.value)})} /></label>
            <label className="training-bag-mini-check"><input type="checkbox" checked={selected.canSale} onChange={event => onPatchItem(selected.id, {canSale: event.target.checked})} /><span>可售卖</span></label>
          </div>
          <div className="training-bag-flags">
            <span>{selected.canBattleUse ? "可战斗使用" : "不可战斗使用"}</span>
            <span>{selected.canUse ? "可直接使用" : "不可直接使用"}</span>
            <span>{selected.canUseToPokemon ? "可对宝可梦使用" : "不可对宝可梦使用"}</span>
            <span>{selected.canTake ? "可携带" : "不可携带"}</span>
          </div>
          <button type="button" className="danger" disabled={selectedIsManagedSystemItem} title={selectedIsManagedSystemItem ? "系统战斗道具由规则自动管理，不能手动删除" : "删除实例"} onClick={() => onDelete(selected.id)}>
            {selectedIsManagedSystemItem ? "规则自动管理" : "删除实例"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function BagItemIcon({api, item}: {api: ChangeBattleV2Api; item: PlayerItemInstanceV4}) {
  try {
    const detail = api.getItemDetail(item.itemID);
    if (detail.iconStyle) return <span className="training-bag-item-icon item-icon" aria-hidden="true" style={styleFromCss(detail.iconStyle)} />;
    if (detail.iconUrl) return <ImageWithFallback src={detail.iconUrl} alt="" fallback="◇" />;
  } catch {
    // Fall back to instance image or text marker.
  }
  return item.image ? <ImageWithFallback src={item.image} alt="" fallback="◇" /> : <span className="training-bag-item-icon">◇</span>;
}

function nullableNumberFromInput(value: string): number | null {
  if (!value.trim()) return null;
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
}

function isManagedSystemItem(item: PlayerItemInstanceV4): boolean {
  return item.itemID.startsWith("system-");
}

function bagItemListText(api: ChangeBattleV2Api, item: PlayerItemInstanceV4): string {
  try {
    const detail = api.getItemDetail(item.itemID);
    return detail.description || detail.effectSummary || detail.kindLabel || item.name;
  } catch {
    return item.name;
  }
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

function teamSizeForMode(mode: TrainingModeV4): number {
  if (mode === "singles") return 3;
  if (mode === "doubles") return 4;
  return 2;
}

function TrainingRuleBar({mode, ruleSet, battleCount, onMode, onRuleSet, onBattleCount}: {
  mode: TrainingModeV4;
  ruleSet: TrainingRuleSetV4;
  battleCount: 1 | 2;
  onMode: (mode: TrainingModeV4) => void;
  onRuleSet: (ruleSet: TrainingRuleSetV4) => void;
  onBattleCount: (count: 1 | 2) => void;
}) {
  return (
    <header className="training-rule-bar">
      <strong>训练自定义</strong>
      <nav aria-label="训练模式">
        {(["singles", "doubles", "coop"] as TrainingModeV4[]).map(item => (
          <button className={item === mode ? "active" : ""} type="button" onClick={() => onMode(item)} key={item}>{MODE_LABEL[item]}</button>
        ))}
      </nav>
      <nav aria-label="规则">
        {(["standard", "gen7", "gen8", "gen9"] as TrainingRuleSetV4[]).map(item => (
          <button className={item === ruleSet ? "active" : ""} type="button" onClick={() => onRuleSet(item)} key={item}>{RULE_LABEL[item]}</button>
        ))}
      </nav>
      <label>
        <span>对局</span>
        <select value={battleCount} onChange={event => onBattleCount(Number(event.target.value) === 2 ? 2 : 1)}>
          <option value={1}>1</option>
          <option value={2}>2</option>
        </select>
      </label>
    </header>
  );
}

function TrainingPlayersPanel({players, npcs, selectedPlayerId, selectedNpcIds, mode, onSelectPlayer, onNpc}: {
  players: TrainingPlayerDraftV4[];
  npcs: TrainingNpcV4[];
  selectedPlayerId: ShowdownPlayerIdV4;
  selectedNpcIds: Partial<Record<ShowdownPlayerIdV4, string>>;
  mode: TrainingModeV4;
  onSelectPlayer: (player: TrainingPlayerDraftV4) => void;
  onNpc: (playerId: ShowdownPlayerIdV4, npcId: string) => void;
}) {
  return (
    <aside className="training-players-panel">
      <header>
        <strong>参战方</strong>
        <span>{MODE_LABEL[mode]}</span>
      </header>
      <div className="training-player-list">
        {players.map(player => (
          <button className={player.playerId === selectedPlayerId ? "selected" : ""} type="button" onClick={() => onSelectPlayer(player)} key={player.playerId}>
            <ImageWithFallback src={player.avatar} alt="" />
            <b>{player.playerId.toUpperCase()}</b>
            <span>{player.name}</span>
            <small>{player.alliance === "near" ? "我方" : "对手"} · {player.controller}</small>
          </button>
        ))}
      </div>
      <div className="training-npc-picker">
        <strong>NPC</strong>
        {players.filter(player => player.playerId !== "p1").map(player => (
          <label key={player.playerId}>
            <span>{player.playerId.toUpperCase()}</span>
            <select value={selectedNpcIds[player.playerId] || ""} onChange={event => onNpc(player.playerId, event.target.value)}>
              {npcs.filter(npc => player.alliance === npc.alliance).map(npc => <option value={npc.id} key={npc.id}>{npc.name} · {npc.title}</option>)}
            </select>
          </label>
        ))}
      </div>
    </aside>
  );
}

function TrainingTeamPanel({player, selectedPokemonId, onSelect, onRandomize, onMove}: {
  player: TrainingPlayerDraftV4;
  selectedPokemonId: string;
  onSelect: (pokemon: LocalPokemonV4) => void;
  onRandomize: () => void;
  onMove: (pokemonId: string, direction: -1 | 1) => void;
}) {
  return (
    <aside className={`training-team-panel ${player.alliance === "far" ? "enemy" : ""}`}>
      <header>
        <strong>{player.name}</strong>
        <span>{player.localTeam.pokemon.length}/6</span>
      </header>
      <div className="training-team-list">
        {player.localTeam.pokemon.map((pokemon, index) => (
          <button className={pokemon.localPokemonId === selectedPokemonId ? "selected" : ""} type="button" onClick={() => onSelect(pokemon)} key={pokemon.localPokemonId}>
            <b>{index + 1}</b>
            <ImageWithFallback src={pokemon.iconUrl || pokemon.spriteUrl || ""} alt="" />
            <strong>{pokemon.nameZh}</strong>
            <small>Lv.{pokemon.level} · {pokemon.abilityNameZh}</small>
            <em>
              <span role="button" tabIndex={0} aria-label="上移" onClick={event => { event.stopPropagation(); onMove(pokemon.localPokemonId, -1); }}>▲</span>
              <span role="button" tabIndex={0} aria-label="下移" onClick={event => { event.stopPropagation(); onMove(pokemon.localPokemonId, 1); }}>▼</span>
            </em>
          </button>
        ))}
      </div>
      <button type="button" onClick={onRandomize}>随机此队</button>
    </aside>
  );
}

function TrainingPokemonEditor({api, pokemon, onPatch}: {api: ChangeBattleV2Api; pokemon: LocalPokemonV4 | null; onPatch: (patch: Partial<LocalPokemonV4>) => void}) {
  const [tab, setTab] = useState<"base" | "stats" | "moves" | "entry">("base");
  if (!pokemon) {
    return (
      <section className="training-pokemon-editor empty">
        <strong>未选择宝可梦</strong>
      </section>
    );
  }
  return (
    <section className="training-pokemon-editor">
      <header>
        <strong>{pokemon.nameZh}</strong>
        <span>ID: {pokemon.speciesId}</span>
      </header>
      <nav className="training-editor-tabs" aria-label="宝可梦编辑标签">
        {[
          ["base", "基础"],
          ["stats", "能力"],
          ["moves", "招式"],
          ["entry", "进场"],
        ].map(([id, label]) => (
          <button className={tab === id ? "active" : ""} type="button" onClick={() => setTab(id as typeof tab)} key={id}>{label}</button>
        ))}
      </nav>
      <div className="training-editor-body">
        <div className="training-editor-preview">
          <ImageWithFallback src={(pokemon.shiny ? pokemon.shinySpriteUrl : pokemon.spriteUrl) || pokemon.iconUrl || ""} alt={pokemon.nameZh} />
          <label>
            <span>等级</span>
            <input type="number" min={1} max={100} value={pokemon.level} onChange={event => onPatch({level: Number(event.target.value)})} />
          </label>
          <label>
            <span>性别</span>
            <select value={pokemon.gender} onChange={event => onPatch({gender: event.target.value as LocalPokemonV4["gender"]})}>
              <option value="N">N</option>
              <option value="M">M</option>
              <option value="F">F</option>
            </select>
          </label>
          <label className="training-checkbox">
            <input type="checkbox" checked={pokemon.shiny} onChange={event => onPatch({shiny: event.target.checked})} />
            <span>闪光</span>
          </label>
        </div>
        {tab === "base" ? <TrainingBaseEditor api={api} pokemon={pokemon} onPatch={onPatch} /> : null}
        {tab === "stats" ? <TrainingStatsEditor pokemon={pokemon} onPatch={onPatch} /> : null}
        {tab === "moves" ? <TrainingMovesEditor api={api} pokemon={pokemon} onPatch={onPatch} /> : null}
        {tab === "entry" ? <TrainingEntryEditor pokemon={pokemon} onPatch={onPatch} /> : null}
      </div>
    </section>
  );
}

function TrainingBaseEditor({api, pokemon, onPatch}: {api: ChangeBattleV2Api; pokemon: LocalPokemonV4; onPatch: (patch: Partial<LocalPokemonV4>) => void}) {
  const abilityOptions = useMemo<TrainingDexSelectOption[]>(() => {
    try {
      return api.getPokemonDetail(pokemon.speciesId).abilities.map(ability => ({id: ability.id, name: ability.name, nameZh: ability.nameZh, subtitle: ability.hidden ? "隐藏特性" : "常规特性"}));
    } catch {
      return [];
    }
  }, [api, pokemon.speciesId]);
  const itemDisplay = useMemo(() => {
    if (!pokemon.itemId) return "无道具";
    try {
      return api.getItemDetail(pokemon.itemId).nameZh;
    } catch {
      return pokemon.itemId;
    }
  }, [api, pokemon.itemId]);
  return (
    <div className="training-editor-fields">
      <TrainingDexSelect api={api} category="pokemon" label="宝可梦" value={pokemon.speciesId} display={pokemon.nameZh} onSelect={speciesId => onPatch({speciesId})} />
      <TrainingDexSelect api={api} category="abilities" label="特性" value={pokemon.abilityId} display={pokemon.abilityNameZh} fixedOptions={abilityOptions} onSelect={abilityId => onPatch({abilityId})} />
      <TrainingDexSelect api={api} category="items" label="道具" value={pokemon.itemId} display={itemDisplay} allowEmpty emptyLabel="无道具" onSelect={itemId => onPatch({itemId})} />
      <label>
        <span>性格</span>
        <select value={pokemon.nature} onChange={event => onPatch({nature: event.target.value})}>
          {NATURE_OPTIONS.map(([id, label]) => <option value={id} key={id}>{label}</option>)}
        </select>
        <small>{NATURE_LABEL[pokemon.nature] || "未选择"}</small>
      </label>
    </div>
  );
}

function TrainingStatsEditor({pokemon, onPatch}: {pokemon: LocalPokemonV4; onPatch: (patch: Partial<LocalPokemonV4>) => void}) {
  const evTotal = statKeys().reduce((sum, stat) => sum + (pokemon.evs[stat] || 0), 0);
  return (
    <div className="training-stats-editor">
      <header>
        <span>EV 合计 {evTotal}/510</span>
        <span>HP {pokemon.maxHp}</span>
      </header>
      <div className="training-stat-head">
        <span>能力</span>
        <span>努力值</span>
        <span>个体值</span>
      </div>
      {statKeys().map(stat => (
        <div className="training-stat-row" key={stat}>
          <span>{STAT_LABEL[stat]}</span>
          <input type="number" min={0} max={252} value={pokemon.evs[stat]} onChange={event => onPatch({evs: {...pokemon.evs, [stat]: Number(event.target.value)}})} />
          <input type="number" min={0} max={31} value={pokemon.ivs[stat]} onChange={event => onPatch({ivs: {...pokemon.ivs, [stat]: Number(event.target.value)}})} />
        </div>
      ))}
    </div>
  );
}

function TrainingMovesEditor({api, pokemon, onPatch}: {api: ChangeBattleV2Api; pokemon: LocalPokemonV4; onPatch: (patch: Partial<LocalPokemonV4>) => void}) {
  function patchMove(index: number, patch: Partial<TrainingMoveSlotV4>) {
    onPatch({moves: pokemon.moves.map((move, moveIndex) => moveIndex === index ? {...move, ...patch} : move)});
  }

  return (
    <div className="training-moves-editor">
      {pokemon.moves.map((move, index) => (
        <div className="training-move-row" key={`${move.moveId}-${index}`}>
          <TrainingDexSelect api={api} category="moves" label={`招式 ${index + 1}`} value={move.moveId} display={move.nameZh} onSelect={moveId => patchMove(index, {moveId})} />
          <label>
            <span>剩余 PP</span>
            <input type="number" min={0} max={move.maxPp} value={move.remainingPp} onChange={event => patchMove(index, {remainingPp: Number(event.target.value)})} />
            <small>最大 {move.maxPp || move.pp}</small>
          </label>
        </div>
      ))}
    </div>
  );
}

function TrainingEntryEditor({pokemon, onPatch}: {pokemon: LocalPokemonV4; onPatch: (patch: Partial<LocalPokemonV4>) => void}) {
  return (
    <div className="training-entry-editor">
      <strong>{pokemon.nameZh} 进场状态</strong>
      <label>
        <span>进场 HP</span>
        <input type="number" min={0} max={pokemon.maxHp} value={pokemon.entryHp} onChange={event => onPatch({entryHp: Number(event.target.value)})} />
        <small>最大 HP {pokemon.maxHp}</small>
      </label>
      <div className="training-entry-hp-actions">
        <button type="button" onClick={() => onPatch({entryHp: pokemon.maxHp})}>满血</button>
        <button type="button" onClick={() => onPatch({entryHp: Math.floor(pokemon.maxHp / 2)})}>半血</button>
        <button type="button" onClick={() => onPatch({entryHp: 1})}>1 HP</button>
        <button type="button" onClick={() => onPatch({entryHp: 0})}>濒死</button>
      </div>
      <label>
        <span>进场异常</span>
        <select value={pokemon.entryStatus} onChange={event => onPatch({entryStatus: event.target.value as TrainingStatusV4})}>
          {(Object.keys(STATUS_LABEL) as TrainingStatusV4[]).map(status => <option value={status} key={status || "none"}>{STATUS_LABEL[status]}</option>)}
        </select>
      </label>
    </div>
  );
}

function statKeys(): Array<keyof StatTableV4> {
  return ["hp", "atk", "def", "spa", "spd", "spe"];
}
