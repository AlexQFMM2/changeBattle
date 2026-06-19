import type {BattleTrainingConfig} from "@changebattle/shared";
import {defaultTrainingConfig, trainingPokemon} from "./battleTrainingModel";
import "./BattleTrainingPresetBar.css";

export function gigaImpactPreset(): BattleTrainingConfig {
  const config = defaultTrainingConfig();
  const player = trainingPokemon("Golem", "Sturdy", ["Tackle", "Rock Throw", "Defense Curl", "Mud-Slap"]);
  const enemy = trainingPokemon("Raticate", "Run Away", ["Giga Impact", "Quick Attack", "Tackle", "Tail Whip"]);
  return {...config, player, enemy, playerTeam: [player], enemyTeam: [enemy]};
}

export function fullTeamPreset(): BattleTrainingConfig {
  const config = defaultTrainingConfig();
  const playerTeam = [
    trainingPokemon("Golem", "Sturdy", ["Tackle", "Rock Throw"]),
    trainingPokemon("Charizard", "Blaze", ["Surf", "Flamethrower"]),
    trainingPokemon("Pikachu", "Static", ["Thunderbolt", "Quick Attack"]),
  ];
  const enemyTeam = [
    trainingPokemon("Raticate", "Run Away", ["Giga Impact"]),
    trainingPokemon("Blastoise", "Torrent", ["Surf", "Protect"]),
    trainingPokemon("Venusaur", "Overgrow", ["Sunny Day", "Solar Beam"]),
  ];
  return {...config, player: playerTeam[0], enemy: enemyTeam[0], playerTeam, enemyTeam};
}

export function BattleTrainingPresetBar({submitting, onStart, onBack}: {
  submitting?: boolean;
  onStart: () => void;
  onBack: () => void;
}) {
  return (
    <section className="battle-training-preset-bar">
      <div className="battle-training-preset-title">
        <strong>战斗训练场</strong>
      </div>
      <div className="battle-training-preset-actions">
        <button type="button" className="primary" disabled={submitting} onClick={onStart}>{submitting ? "启动中" : "开始"}</button>
        <button type="button" onClick={onBack}>返回</button>
      </div>
    </section>
  );
}
