import type {BattleTrainingPokemonConfig} from "@changebattle/shared";
import type {BattleTrainingLegalitySummary} from "@changebattle/game-runtime";
import {TRAINING_MAX_TEAM_SIZE, type TrainingSide} from "./battleTrainingModel";
import "./BattleTrainingTeamPanel.css";

export function BattleTrainingTeamPanel({title, side, team, legalities = [], selectedIndex, onSelect, onAdd, onDuplicate, onRemove, onClear}: {
  title: string;
  side: TrainingSide;
  team: BattleTrainingPokemonConfig[];
  legalities?: Array<BattleTrainingLegalitySummary | undefined>;
  selectedIndex: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onDuplicate: (index: number) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
}) {
  const canAdd = team.length < TRAINING_MAX_TEAM_SIZE;
  return (
    <section className={`battle-training-team-panel ${side}`}>
      <header>
        <strong>{title}</strong>
        <span>{team.length}/{TRAINING_MAX_TEAM_SIZE}</span>
      </header>
      <div className="battle-training-team-list">
        {Array.from({length: TRAINING_MAX_TEAM_SIZE}, (_, index) => {
          const pokemon = team[index];
          if (!pokemon) {
            return (
              <button className="battle-training-team-slot empty" type="button" disabled={!canAdd} onClick={onAdd} key={`empty-${index}`}>
                <span>+</span>
                <small>{canAdd ? "添加" : "已满"}</small>
              </button>
            );
          }
          const legality = legalities[index];
          const illegal = Boolean(legality && !legality.legal);
          return (
            <button className={`battle-training-team-slot ${selectedIndex === index ? "selected" : ""} ${illegal ? "illegal" : ""}`} type="button" onClick={() => onSelect(index)} key={`${index}-${pokemon.species}-${pokemon.name}`}>
              <b>{index + 1}</b>
              <span>{pokemon.name || pokemon.speciesLabel || pokemon.species}</span>
              <em>Lv.{pokemon.level || 50}</em>
              <small>{illegal ? "非法但可用" : pokemon.abilityLabel || pokemon.ability || pokemon.itemLabel || pokemon.item || "未设置"}</small>
            </button>
          );
        })}
      </div>
      <footer>
        <button type="button" disabled={!team[selectedIndex] || team.length >= TRAINING_MAX_TEAM_SIZE} onClick={() => onDuplicate(selectedIndex)}>复制</button>
        <button type="button" disabled={team.length <= 1 || !team[selectedIndex]} onClick={() => onRemove(selectedIndex)}>删除</button>
        <button type="button" onClick={onClear}>清空</button>
      </footer>
    </section>
  );
}
