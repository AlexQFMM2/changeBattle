import {useEffect, useMemo, useState} from "react";
import type {BattleAiHint, BattleState, BattleTrainingConfig, BattleTrainingOptions, BattleTrainingPokemonConfig, DesktopDexEntry, DesktopGameState} from "@changebattle/shared";
import {BattleView} from "../battle/BattleView";
import {BattleTrainingPokemonEditor} from "../../components/battle-training/BattleTrainingPokemonEditor";
import {BattleTrainingPresetBar} from "../../components/battle-training/BattleTrainingPresetBar";
import {BattleTrainingTeamPanel} from "../../components/battle-training/BattleTrainingTeamPanel";
import {checkTrainingPokemonLegality, type BattleTrainingDexProfile} from "@changebattle/game-runtime";
import {
  battleSnapshot,
  cloneTrainingConfig,
  cloneTrainingPokemon,
  configWithTeams,
  defaultTrainingConfig,
  normalizeTrainingPokemon,
  normalizeTrainingTeam,
  trainingPokemon,
  type BattleAnimationSpeed,
  type StatId,
  type TrainingLogEntry,
  type TrainingSide,
} from "../../components/battle-training/battleTrainingModel";
import "./BattleTrainingPage.css";

export function BattleTrainingPage({battle, battleBag, choicePending, onBattleState, onBack, battleAnimationSpeed, onBattleAnimationSpeedChange}: {
  battle: BattleState | null;
  battleBag: DesktopGameState["battle_bag"];
  choicePending: boolean;
  onBattleState: (state: DesktopGameState) => void;
  onBack: () => void;
  battleAnimationSpeed: BattleAnimationSpeed;
  onBattleAnimationSpeedChange: (speed: BattleAnimationSpeed) => void;
}) {
  const [config, setConfig] = useState<BattleTrainingConfig>(() => defaultTrainingConfig());
  const [started, setStarted] = useState(Boolean(battle));
  const [selected, setSelected] = useState<Record<TrainingSide, number>>({player: 0, enemy: 0});
  const [activeSide, setActiveSide] = useState<TrainingSide>("player");
  const [logs, setLogs] = useState<TrainingLogEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [options, setOptions] = useState<BattleTrainingOptions>({natures: []});
  const [generatingSlot, setGeneratingSlot] = useState<string | null>(null);
  const playerTeam = useMemo(() => normalizeTrainingTeam(config, "player"), [config]);
  const enemyTeam = useMemo(() => normalizeTrainingTeam(config, "enemy"), [config]);
  const activeConfig = useMemo(() => cloneTrainingConfig(configWithTeams(config, playerTeam, enemyTeam)), [config, playerTeam, enemyTeam]);
  const selectedPlayer = Math.min(selected.player, Math.max(0, playerTeam.length - 1));
  const selectedEnemy = Math.min(selected.enemy, Math.max(0, enemyTeam.length - 1));
  const activeIndex = activeSide === "player" ? selectedPlayer : selectedEnemy;
  const activeTeam = activeSide === "player" ? playerTeam : enemyTeam;
  const activePokemon = activeTeam[activeIndex];
  const [dexProfiles, setDexProfiles] = useState<Record<string, BattleTrainingDexProfile>>({});
  const activeProfile = activePokemon ? dexProfiles[profileKey(activePokemon)] : undefined;
  const activeLegality = activePokemon ? checkTrainingPokemonLegality(activePokemon, activeProfile) : undefined;
  const playerLegalities = useMemo(() => playerTeam.map(pokemon => checkTrainingPokemonLegality(pokemon, dexProfiles[profileKey(pokemon)])), [dexProfiles, playerTeam]);
  const enemyLegalities = useMemo(() => enemyTeam.map(pokemon => checkTrainingPokemonLegality(pokemon, dexProfiles[profileKey(pokemon)])), [dexProfiles, enemyTeam]);

  useEffect(() => {
    const all = [...playerTeam, ...enemyTeam].filter(Boolean);
    for (const pokemon of all) {
      const key = profileKey(pokemon);
      if (!key || dexProfiles[key]) continue;
      void loadDexProfile(pokemon).then(profile => {
        if (!profile) return;
        setDexProfiles(current => current[key] ? current : {...current, [key]: profile});
      });
    }
  }, [dexProfiles, playerTeam, enemyTeam]);

  useEffect(() => {
    void window.changeBattle?.battleTrainingOptions().then(setOptions).catch(() => setOptions({natures: []}));
  }, []);

  function patchTeam(side: TrainingSide, updater: (team: BattleTrainingPokemonConfig[]) => BattleTrainingPokemonConfig[], selectIndex?: number) {
    setConfig(current => {
      const currentPlayer = normalizeTrainingTeam(current, "player");
      const currentEnemy = normalizeTrainingTeam(current, "enemy");
      const nextPlayer = side === "player" ? updater(currentPlayer) : currentPlayer;
      const nextEnemy = side === "enemy" ? updater(currentEnemy) : currentEnemy;
      return configWithTeams(current, nextPlayer, nextEnemy);
    });
    if (typeof selectIndex === "number") setSelected(current => ({...current, [side]: selectIndex}));
  }

  function patchPokemon(side: TrainingSide, index: number, patch: Partial<BattleTrainingPokemonConfig>) {
    patchTeam(side, team => team.map((pokemon, pokemonIndex) => pokemonIndex === index ? normalizeTrainingPokemon({...pokemon, ...patch}, pokemon) : pokemon));
  }

  function patchMove(side: TrainingSide, index: number, moveIndex: number, value: string, displayValue = value) {
    patchTeam(side, team => team.map((pokemon, pokemonIndex) => {
      if (pokemonIndex !== index) return pokemon;
      const moves = [...pokemon.moves];
      const moveLabels = [...(pokemon.moveLabels || [])];
      moves[moveIndex] = value;
      moveLabels[moveIndex] = displayValue;
      return normalizeTrainingPokemon({...pokemon, moves, moveLabels}, pokemon);
    }));
  }

  function patchSpecies(side: TrainingSide, index: number, species: string, speciesLabel: string, entry?: DesktopDexEntry) {
    patchPokemon(side, index, {species, speciesLabel, name: activeTeam[index]?.name === activeTeam[index]?.species || activeTeam[index]?.name === activeTeam[index]?.speciesLabel ? speciesLabel : activeTeam[index]?.name});
    if (!entry) return;
    const speciesId = entry.id || entry.name || species;
    const slotKey = `${side}:${index}`;
    setGeneratingSlot(slotKey);
    void window.changeBattle?.generateBattleTrainingPokemon(speciesId, Date.now()).then(generated => {
      patchTeam(side, team => team.map((pokemon, pokemonIndex) => pokemonIndex === index ? normalizeTrainingPokemon({...generated, name: generated.speciesLabel || generated.species}, pokemon) : pokemon));
    }).catch(error => {
      appendLog({kind: "error", error: error instanceof Error ? error.message : String(error)});
    }).finally(() => setGeneratingSlot(current => current === slotKey ? null : current));
  }

  function patchStat(side: TrainingSide, index: number, bucket: "ivs" | "evs", stat: StatId, value: string) {
    const limit = bucket === "ivs" ? 31 : 255;
    const next = Math.max(0, Math.min(limit, Math.floor(Number(value || 0))));
    patchTeam(side, team => team.map((pokemon, pokemonIndex) => pokemonIndex === index ? normalizeTrainingPokemon({...pokemon, [bucket]: {...pokemon[bucket], [stat]: next}}, pokemon) : pokemon));
  }

  function addPokemon(side: TrainingSide) {
    patchTeam(side, team => [...team, trainingPokemon(side === "player" ? "Pikachu" : "Eevee", side === "player" ? "Static" : "Run Away", ["Tackle"])], side === "player" ? playerTeam.length : enemyTeam.length);
  }

  function duplicatePokemon(side: TrainingSide, index: number) {
    patchTeam(side, team => {
      if (!team[index] || team.length >= 6) return team;
      const copy = cloneTrainingPokemon(team[index]);
      copy.name = `${copy.name || copy.species} 复制`;
      return [...team.slice(0, index + 1), copy, ...team.slice(index + 1)];
    }, Math.min(index + 1, 5));
  }

  function movePokemon(side: TrainingSide, index: number, direction: -1 | 1) {
    patchTeam(side, team => {
      const targetIndex = index + direction;
      if (!team[index] || targetIndex < 0 || targetIndex >= team.length) return team;
      const next = [...team];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    }, Math.max(0, Math.min(index + direction, (side === "player" ? playerTeam : enemyTeam).length - 1)));
    setActiveSide(side);
  }

  function removePokemon(side: TrainingSide, index: number) {
    patchTeam(side, team => team.length <= 1 ? team : team.filter((_, pokemonIndex) => pokemonIndex !== index), Math.max(0, index - 1));
  }

  function clearTeam(side: TrainingSide) {
    const fallback = side === "player" ? trainingPokemon("Golem", "Sturdy", ["Tackle"]) : trainingPokemon("Raticate", "Run Away", ["Giga Impact"]);
    patchTeam(side, () => [fallback], 0);
  }

  function appendLog(entry: Omit<TrainingLogEntry, "id">) {
    const next = {id: Date.now() + Math.random(), ...entry};
    setLogs(current => [next, ...current].slice(0, 80));
    console.info("[changebattle:training]", next);
  }

  async function start() {
    if (!window.changeBattle?.startBattleTraining || submitting) return;
    setSubmitting(true);
    const startedAt = performance.now();
    try {
      const result = await window.changeBattle.startBattleTraining(activeConfig);
      onBattleState(result);
      setStarted(true);
      appendLog({kind: "start", elapsedMs: Math.round(performance.now() - startedAt), after: battleSnapshot(result.battle || null)});
    } catch (error) {
      appendLog({kind: "error", error: error instanceof Error ? error.message : String(error)});
    } finally {
      setSubmitting(false);
    }
  }

  async function choose(choice: string): Promise<boolean> {
    const before = battleSnapshot(battle);
    const startedAt = performance.now();
    try {
      const result = await window.changeBattle!.battleChoice(choice);
      onBattleState(result);
      appendLog({kind: "choice", choice, elapsedMs: Math.round(performance.now() - startedAt), before, after: battleSnapshot(result.battle || null)});
      return true;
    } catch (error) {
      appendLog({kind: "error", choice, elapsedMs: Math.round(performance.now() - startedAt), before, error: error instanceof Error ? error.message : String(error)});
      return false;
    }
  }

  async function autoAdvance(): Promise<boolean> {
    const before = battleSnapshot(battle);
    const startedAt = performance.now();
    try {
      const result = await window.changeBattle!.autoAdvanceBattle();
      onBattleState(result);
      appendLog({kind: "auto", elapsedMs: Math.round(performance.now() - startedAt), before, after: battleSnapshot(result.battle || null)});
      return true;
    } catch (error) {
      appendLog({kind: "error", elapsedMs: Math.round(performance.now() - startedAt), before, error: error instanceof Error ? error.message : String(error)});
      return false;
    }
  }

  if (started && battle) {
    const resultLabel = trainingBattleResultLabel(battle);
    return (
      <section className="battle-training-page training-live">
        <BattleView
          battle={battle}
          battleBag={battleBag || {consumable: [], held: [], tm: []}}
          mode="battleMain"
          setMode={() => undefined}
          onChoice={choose}
          onAutoAdvance={autoAdvance}
          onBattleHint={async (): Promise<BattleAiHint> => { throw new Error("训练场暂不提供 AI 提示。"); }}
          choicePending={choicePending}
          pendingTransition={null}
          onBattleAnimationDone={() => undefined}
          battleAnimationSpeed={battleAnimationSpeed}
          onBattleAnimationSpeedChange={onBattleAnimationSpeedChange}
        />
        {battle.ended ? (
          <div className="battle-training-result-panel">
            <strong>{resultLabel}</strong>
            <span>训练战斗已结束，请返回上一页继续调整队伍。</span>
            <button type="button" onClick={() => setStarted(false)}>返回上一页</button>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="battle-training-page">
      <BattleTrainingPresetBar
        submitting={submitting}
        onStart={() => void start()}
        onBack={onBack}
      />
      <div className="battle-training-layout">
        <BattleTrainingTeamPanel title="我方队伍" side="player" team={playerTeam} legalities={playerLegalities} selectedIndex={selectedPlayer} onSelect={index => { setSelected(current => ({...current, player: index})); setActiveSide("player"); }} onAdd={() => { addPokemon("player"); setActiveSide("player"); }} onMove={(index, direction) => movePokemon("player", index, direction)} onDuplicate={index => duplicatePokemon("player", index)} onRemove={index => removePokemon("player", index)} onClear={() => clearTeam("player")} />
        <BattleTrainingPokemonEditor
          title={`${activeSide === "player" ? "我方" : "对方"}：${generatingSlot === `${activeSide}:${activeIndex}` ? "生成中" : activePokemon?.name || activePokemon?.speciesLabel || activePokemon?.species || "宝可梦"}`}
          side={activeSide}
          pokemon={activePokemon}
          legality={activeLegality}
          natures={options.natures}
          onPatch={patch => patchPokemon(activeSide, activeIndex, patch)}
          onSpecies={(species, speciesLabel, entry) => patchSpecies(activeSide, activeIndex, species, speciesLabel, entry)}
          onMove={(index, value, displayValue) => patchMove(activeSide, activeIndex, index, value, displayValue)}
          onStat={(bucket, stat, value) => patchStat(activeSide, activeIndex, bucket, stat, value)}
        />
        <BattleTrainingTeamPanel title="对方队伍" side="enemy" team={enemyTeam} legalities={enemyLegalities} selectedIndex={selectedEnemy} onSelect={index => { setSelected(current => ({...current, enemy: index})); setActiveSide("enemy"); }} onAdd={() => { addPokemon("enemy"); setActiveSide("enemy"); }} onMove={(index, direction) => movePokemon("enemy", index, direction)} onDuplicate={index => duplicatePokemon("enemy", index)} onRemove={index => removePokemon("enemy", index)} onClear={() => clearTeam("enemy")} />
      </div>
    </section>
  );
}

function profileKey(pokemon: BattleTrainingPokemonConfig): string {
  return String(pokemon.species || pokemon.speciesLabel || "").trim().toLowerCase();
}

async function loadDexProfile(pokemon: BattleTrainingPokemonConfig): Promise<BattleTrainingDexProfile | null> {
  const query = pokemon.species || pokemon.speciesLabel || "";
  if (!query) return null;
  const result = await window.changeBattle?.dexSearch("pokemon", query, 0, 8);
  const entry = bestPokemonEntry(result?.entries || [], pokemon);
  if (!entry) return null;
  return {
    speciesId: entry.id,
    abilities: (entry.abilities || []).map(ability => ability.name || ability.id),
    moves: (entry.learnset || []).map(move => move.name || move.id),
  };
}

function bestPokemonEntry(entries: DesktopDexEntry[], pokemon: BattleTrainingPokemonConfig): DesktopDexEntry | undefined {
  const wanted = compactId(pokemon.species);
  return entries.find(entry => compactId(entry.name) === wanted || compactId(entry.id) === wanted || compactId(entry.name_zh) === compactId(pokemon.speciesLabel))
    || entries[0];
}

function trainingBattleResultLabel(battle: BattleState): string {
  const winner = String(battle.winner || "").toLowerCase();
  if (!battle.ended) return "";
  if (!winner || winner === "tie") return "训练平局";
  return ["enemy", "opponent", "对手"].includes(winner) ? "训练失败" : "训练胜利";
}

function compactId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "");
}
