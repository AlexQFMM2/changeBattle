import {useMemo, useState} from "react";
import {motion} from "motion/react";
import type {
  ChangeBattleV2Api,
  LocalPokemonV4,
  ShowdownPlayerIdV4,
  TrainingModeV4,
  TrainingNpcV4,
  TrainingPlayerDraftV4,
  TrainingRuleSetV4,
  TrainingRunGameV4,
} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import "./TrainingConfigPage.css";

export type TrainingConfigPageProps = {
  api: ChangeBattleV2Api;
  run: TrainingRunGameV4;
  onRunChange: (run: TrainingRunGameV4) => void;
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

export function TrainingConfigPage({api, run, onRunChange, onBack}: TrainingConfigPageProps) {
  const npcs = useMemo(() => api.createTrainingNpcCatalog(), [api]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<ShowdownPlayerIdV4>("p1");
  const [selectedPokemonId, setSelectedPokemonId] = useState(run.scenario.players[0]?.localTeam.pokemon[0]?.localPokemonId || "");
  const [message, setMessage] = useState("训练配置已就绪。");
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
    const next = api.updateTrainingScenario(run, {mode});
    commit(next, `已切换为${MODE_LABEL[mode]}。`);
    const first = next.scenario.players[0];
    if (first) {
      setSelectedPlayerId(first.playerId);
      setSelectedPokemonId(first.localTeam.pokemon[0]?.localPokemonId || "");
    }
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

  function randomizeAllTeams() {
    const size = teamSizeForMode(run.scenario.mode);
    const players = run.scenario.players.map(player => ({...player, localTeam: api.randomizeTrainingTeam(player.playerId, size)}));
    const next = api.updateTrainingScenario(run, {players});
    commit(next, "已按当前规则随机全部队伍。");
    const player = next.scenario.players.find(entry => entry.playerId === selectedPlayer.playerId) || next.scenario.players[0];
    if (player) {
      setSelectedPlayerId(player.playerId);
      setSelectedPokemonId(player.localTeam.pokemon[0]?.localPokemonId || "");
    }
  }

  function randomizePlayerTeam(playerId: ShowdownPlayerIdV4) {
    const size = teamSizeForMode(run.scenario.mode);
    const players = run.scenario.players.map(player => player.playerId === playerId ? {...player, localTeam: api.randomizeTrainingTeam(playerId, size)} : player);
    const next = api.updateTrainingScenario(run, {players});
    commit(next, "队伍已随机。");
    const player = next.scenario.players.find(entry => entry.playerId === playerId);
    setSelectedPlayerId(playerId);
    setSelectedPokemonId(player?.localTeam.pokemon[0]?.localPokemonId || "");
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

  return (
    <motion.section className="training-config-page" initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} transition={{type: "spring", stiffness: 300, damping: 30}}>
      <TrainingRuleBar
        mode={run.scenario.mode}
        ruleSet={run.scenario.ruleSet}
        battleCount={run.scenario.battleCount}
        onMode={setMode}
        onRuleSet={ruleSet => patchScenario({ruleSet}, `规则已切换为 ${RULE_LABEL[ruleSet]}。`)}
        onBattleCount={battleCount => patchScenario({battleCount}, `对局数量：${battleCount}。`)}
      />
      <div className="training-config-layout">
        <TrainingPlayersPanel
          players={players}
          npcs={npcs}
          selectedPlayerId={selectedPlayer.playerId}
          selectedNpcIds={run.scenario.selectedNpcIds}
          mode={run.scenario.mode}
          onSelectPlayer={player => {
            setSelectedPlayerId(player.playerId);
            setSelectedPokemonId(player.localTeam.pokemon[0]?.localPokemonId || "");
          }}
          onNpc={setNpc}
        />
        <TrainingPokemonEditor pokemon={selectedPokemon} onPatch={patch => selectedPokemon ? patchPokemon(selectedPokemon.localPokemonId, patch) : undefined} />
        <TrainingTeamPanel
          player={selectedPlayer}
          selectedPokemonId={selectedPokemon?.localPokemonId || ""}
          onSelect={pokemon => setSelectedPokemonId(pokemon.localPokemonId)}
          onRandomize={() => randomizePlayerTeam(selectedPlayer.playerId)}
          onMove={(pokemonId, direction) => movePokemon(selectedPlayer.playerId, pokemonId, direction)}
        />
      </div>
      <footer className="training-config-actions">
        <span>{message}</span>
        <button type="button" onClick={() => randomizePlayerTeam(selectedPlayer.playerId)}>快速随机</button>
        <button type="button" onClick={randomizeAllTeams}>随机全部</button>
        <button type="button" onClick={() => void save()}>保存配置</button>
        <button type="button" className="primary" onClick={() => void save(run, "BattleGame V4 待接入。")}>开始战斗</button>
        <button type="button" onClick={onBack}>返回</button>
      </footer>
    </motion.section>
  );
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

function TrainingPokemonEditor({pokemon, onPatch}: {pokemon: LocalPokemonV4 | null; onPatch: (patch: Partial<LocalPokemonV4>) => void}) {
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
        <div className="training-editor-fields">
          <label>
            <span>种类</span>
            <input value={pokemon.speciesId} onChange={event => onPatch({speciesId: event.target.value})} />
            <small>{pokemon.nameZh}</small>
          </label>
          <label>
            <span>特性</span>
            <input value={pokemon.abilityId} onChange={event => onPatch({abilityId: event.target.value})} />
            <small>{pokemon.abilityNameZh}</small>
          </label>
          <label>
            <span>道具</span>
            <input value={pokemon.itemId} onChange={event => onPatch({itemId: event.target.value})} placeholder="none" />
          </label>
          <label>
            <span>性格</span>
            <input value={pokemon.nature} onChange={event => onPatch({nature: event.target.value})} />
          </label>
          <div className="training-move-grid">
            {pokemon.moves.map((move, index) => (
              <label key={`${move.moveId}-${index}`}>
                <span>招式 {index + 1}</span>
                <input value={move.moveId} onChange={event => {
                  const moves = pokemon.moves.map((entry, moveIndex) => moveIndex === index ? {...entry, moveId: event.target.value, name: event.target.value, nameZh: event.target.value} : entry);
                  onPatch({moves});
                }} />
                <small>{move.nameZh}</small>
              </label>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
