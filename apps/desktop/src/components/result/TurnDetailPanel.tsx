import type {BattleTurnPokemonState, BattleTurnRecord} from "@changebattle/shared";
import "./TurnDetailPanel.css";

export function TurnDetailPanel({turn}: {turn: BattleTurnRecord | null}) {
  if (!turn) return <article className="result-turn-detail empty">暂无回合详情。</article>;
  return (
    <article className="result-turn-detail">
      <header>
        <strong>{turn.title}</strong>
        <span>{turn.result_tags.join(" / ") || "记录"}</span>
      </header>
      <p>{turn.summary}</p>
      <div className="turn-action-grid">
        <span>我方：{turn.player_action?.label || "未记录行动"}</span>
        <span>对手：{turn.enemy_action?.label || "未记录行动"}</span>
      </div>
      <div className="turn-team-grid">
        <TurnTeam title="我方回合末状态" team={turn.end_state.player_team} />
        <TurnTeam title="对手回合末状态" team={turn.end_state.enemy_team} />
      </div>
    </article>
  );
}

function TurnTeam({title, team}: {title: string; team: BattleTurnPokemonState[]}) {
  return (
    <section className="turn-team-state">
      <strong>{title}</strong>
      {team.map(pokemon => (
        <div className={`turn-pokemon-row ${pokemon.active ? "active" : ""} ${pokemon.fainted ? "fainted" : ""}`} key={`${title}-${pokemon.showdown_id || pokemon.slot}`}>
          <span>{pokemon.active ? "▶" : pokemon.slot}</span>
          <b>{pokemon.name}</b>
          <small>{pokemon.hp}/{pokemon.max_hp}{pokemon.status ? ` ${pokemon.status}` : ""}{pokemon.fainted ? " fnt" : ""}</small>
        </div>
      ))}
    </section>
  );
}
