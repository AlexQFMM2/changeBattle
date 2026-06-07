import type {BattleState, RentalPokemon, ResultSummaryState} from "@changebattle/shared";
import {PokemonSprite, displayName, trainerDialogueTitle, trainerDisplayName, trainerImageUrl} from "../../lib/ui";

export function ResultView({message, battle, summary, onBack}: {message: string; battle: BattleState | null; summary: ResultSummaryState | null; onBack: () => void}) {
  const enemy = summary?.enemy_trainer || battle?.enemy_trainer;
  const image = trainerImageUrl(enemy, "frontGif") || trainerImageUrl(enemy, "front");
  const playerWon = summary ? summary.outcome === "win" : battle ? playerWonBattleResult(battle) : false;
  const outcome = summary?.outcome || (playerWon ? "win" : "loss");
  const playerTeam = summary?.player_team?.length ? summary.player_team : battle?.player_display || [];
  const enemyTeam = summary?.enemy_team?.length ? summary.enemy_team : battle?.enemy_display || [];
  const rows = summary?.rows?.length ? summary.rows : [{label: "结算说明", value: message}];
  return (
    <div className={`result-screen result-${outcome}`}>
      <section className="result-panel">
        <div className="result-copy">
          <span>{outcome === "win" ? "WIN" : outcome === "loss" ? "LOST" : "ABORT"}</span>
          <h1>{summary?.headline || (playerWon ? "胜利结算" : enemy ? trainerDisplayName(enemy) : "结算")}</h1>
          {summary?.subtitle ? <p>{summary.subtitle}</p> : message ? <p>{message}</p> : null}
          <div className="result-row-list">
            {rows.map((row, index) => (
              <article key={`${row.label}-${index}`}>
                <strong>{row.label}</strong>
                <b>{row.value}</b>
                {row.detail ? <small>{row.detail}</small> : null}
              </article>
            ))}
          </div>
          <button onClick={onBack}>返回主界面</button>
        </div>
        {enemy ? (
          <aside className="result-trainer-card">
            {image ? <img src={image} alt={trainerDisplayName(enemy)} /> : <i className="shadow-orb large">?</i>}
            <strong>{trainerDisplayName(enemy)}</strong>
            <span>{trainerDialogueTitle(enemy)}</span>
          </aside>
        ) : null}
        <div className="result-team-board">
          <ResultTeamList title="玩家最后队伍" team={playerTeam} />
          <ResultTeamList title="对手最后队伍" team={enemyTeam} />
        </div>
      </section>
    </div>
  );
}

function ResultTeamList({title, team}: {title: string; team: RentalPokemon[]}) {
  return (
    <section className="result-team-list">
      <h3>{title}</h3>
      <div>
        {team.length ? team.slice(0, 3).map((pokemon, index) => (
          <article key={`${title}-${pokemon.species_id}-${index}`}>
            <PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} />
            <strong>{index + 1}. {displayName(pokemon)}</strong>
            <span>Lv{pokemon.level}　{pokemon.item_zh || "无道具"}</span>
          </article>
        )) : <p>暂无队伍记录。</p>}
      </div>
    </section>
  );
}

function playerWonBattleResult(battle: BattleState): boolean {
  const winner = String(battle.winner || "").toLowerCase();
  if (!winner || winner === "tie") return false;
  return !["enemy", "opponent", "对手"].includes(winner);
}
