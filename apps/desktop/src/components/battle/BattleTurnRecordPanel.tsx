import type {BattleTurnPokemonState, BattleTurnRecord} from "@changebattle/shared";
import "./BattleTurnRecordPanel.css";

export function BattleTurnRecordPanel({turns, selectedTurn, onSelectTurn}: {turns: BattleTurnRecord[]; selectedTurn: BattleTurnRecord | null; onSelectTurn: (turn: BattleTurnRecord) => void}) {
  if (!turns.length) return <div className="status-events"><small>本场战斗还没有回合记录。</small></div>;
  return (
    <div className="battle-turn-status">
      <div className="battle-turn-list">
        {turns.map(turn => (
          <button className={selectedTurn?.id === turn.id ? "selected" : ""} onClick={() => onSelectTurn(turn)} key={turn.id}>
            <strong>{turn.title}</strong>
            <span>{turn.summary}</span>
            <small>{battleTurnAliveText(turn.end_state.player_team)} / {battleTurnAliveText(turn.end_state.enemy_team)}</small>
          </button>
        ))}
      </div>
      {selectedTurn ? (
        <article className="battle-turn-detail">
          <strong>{selectedTurn.title}</strong>
          <p>{selectedTurn.summary}</p>
          <div className="battle-turn-team-grid">
            <BattleTurnTeam title="我方" team={selectedTurn.end_state.player_team} />
            <BattleTurnTeam title="对手" team={selectedTurn.end_state.enemy_team} />
          </div>
        </article>
      ) : null}
    </div>
  );
}

function BattleTurnTeam({title, team}: {title: string; team: BattleTurnPokemonState[]}) {
  return (
    <section>
      <strong>{title}</strong>
      {team.map(pokemon => (
        <div className={`${pokemon.active ? "active" : ""} ${pokemon.fainted ? "fainted" : ""}`} key={`${title}-${pokemon.showdown_id || pokemon.slot}`}>
          <span>{pokemon.active ? "▶" : pokemon.slot}</span>
          <b>{pokemon.name}</b>
          <small>{pokemon.hp}/{pokemon.max_hp}{pokemon.status ? ` ${pokemon.status}` : ""}{pokemon.fainted ? " fnt" : ""}</small>
        </div>
      ))}
    </section>
  );
}

function battleTurnAliveText(team: BattleTurnPokemonState[]): string {
  return `${team.filter(pokemon => !pokemon.fainted && pokemon.hp > 0).length}/${Math.max(1, team.length)}`;
}
