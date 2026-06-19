import {useState} from "react";
import type {BattleTrainingPokemonConfig} from "@changebattle/shared";
import type {BattleTrainingLegalitySummary} from "@changebattle/game-runtime";
import {BattleTrainingDexPicker} from "./BattleTrainingDexPicker";
import {STAT_IDS, STAT_LABELS, TERA_TYPES, type StatId, type TrainingEditorTab, type TrainingSide} from "./battleTrainingModel";
import "./BattleTrainingPokemonEditor.css";

const TABS: Array<{id: TrainingEditorTab; label: string}> = [
  {id: "base", label: "基础"},
  {id: "moves", label: "技能"},
  {id: "stats", label: "数值"},
];

export function BattleTrainingPokemonEditor({side, title, pokemon, legality, onPatch, onMove, onStat}: {
  side: TrainingSide;
  title: string;
  pokemon: BattleTrainingPokemonConfig;
  legality?: BattleTrainingLegalitySummary;
  onPatch: (patch: Partial<BattleTrainingPokemonConfig>) => void;
  onMove: (index: number, value: string, displayValue: string) => void;
  onStat: (bucket: "ivs" | "evs", stat: StatId, value: string) => void;
}) {
  const [tab, setTab] = useState<TrainingEditorTab>("base");
  return (
    <section className={`battle-training-pokemon-editor ${side}`}>
      <header>
        <strong>{title}</strong>
        {legality && !legality.legal ? <span className="battle-training-illegal-badge">非法但可用</span> : null}
        <nav>
          {TABS.map(item => <button type="button" className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)} key={item.id}>{item.label}</button>)}
        </nav>
      </header>
      {tab === "base" ? (
        <div className="battle-training-editor-base">
          {legality?.issues.some(issue => issue.type === "ability") ? <p className="battle-training-legality-note">{legality.issues.filter(issue => issue.type === "ability").map(issue => issue.label).join("、")} 非法但可用</p> : null}
          <BattleTrainingDexPicker category="pokemon" label="物种" value={pokemon.species} displayValue={pokemon.speciesLabel} onChange={(species, speciesLabel) => onPatch({species, speciesLabel, name: pokemon.name === pokemon.species || pokemon.name === pokemon.speciesLabel ? speciesLabel : pokemon.name})} />
          <label>昵称<input value={pokemon.name || ""} onChange={event => onPatch({name: event.target.value})} /></label>
          <label>等级<input type="number" min={1} max={100} value={pokemon.level} onChange={event => onPatch({level: clampLevel(event.target.value)})} /></label>
          <label>性别<select value={pokemon.gender || ""} onChange={event => onPatch({gender: event.target.value as BattleTrainingPokemonConfig["gender"]})}><option value="">默认</option><option value="M">雄</option><option value="F">雌</option><option value="N">无</option></select></label>
          <BattleTrainingDexPicker category="abilities" label="特性" value={pokemon.ability} displayValue={pokemon.abilityLabel} onChange={(ability, abilityLabel) => onPatch({ability, abilityLabel})} />
          <BattleTrainingDexPicker category="items" label="道具" value={pokemon.item || ""} displayValue={pokemon.itemLabel} onChange={(item, itemLabel) => onPatch({item, itemLabel})} />
          <label>性格<input value={pokemon.nature} onChange={event => onPatch({nature: event.target.value})} /></label>
          <label>太晶<select value={pokemon.teraType || ""} onChange={event => onPatch({teraType: event.target.value})}><option value="">默认</option>{TERA_TYPES.map(type => <option value={type} key={type}>{type}</option>)}</select></label>
        </div>
      ) : null}
      {tab === "moves" ? (
        <div className="battle-training-editor-moves">
          {legality?.issues.some(issue => issue.type === "move") ? <p className="battle-training-legality-note">{legality.issues.filter(issue => issue.type === "move").map(issue => issue.label).join("、")} 非法但可用</p> : null}
          {[0, 1, 2, 3].map(index => <BattleTrainingDexPicker category="moves" label={`技能 ${index + 1}`} value={pokemon.moves[index] || ""} displayValue={pokemon.moveLabels?.[index]} onChange={(value, displayValue) => onMove(index, value, displayValue)} key={index} />)}
        </div>
      ) : null}
      {tab === "stats" ? (
        <div className="battle-training-editor-stats">
          <div className="battle-training-editor-stat-head"><span>能力</span><span>IV</span><span>EV</span></div>
          {STAT_IDS.map(stat => (
            <div className="battle-training-editor-stat-row" key={stat}>
              <span>{STAT_LABELS[stat]}</span>
              <input type="number" min={0} max={31} value={pokemon.ivs[stat]} onChange={event => onStat("ivs", stat, event.target.value)} />
              <input type="number" min={0} max={255} value={pokemon.evs[stat]} onChange={event => onStat("evs", stat, event.target.value)} />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function clampLevel(value: string): number {
  const numeric = Math.floor(Number(value || 50));
  if (!Number.isFinite(numeric)) return 50;
  return Math.max(1, Math.min(100, numeric));
}
