import type {ReactElement} from "react";
import type {RestState} from "@changebattle/shared";
import {PokemonSprite, displayName} from "../../lib/ui";
import type {RestActionHandler} from "./restActionTypes";
import "./EventLevelPanel.css";

export function EventLevelPanel({rest, onClose, onAction, embedded = false}: {rest: RestState; onClose: () => void; onAction: RestActionHandler; embedded?: boolean}) {
  const points = Number(rest.event_services?.level_points || 0);
  const content = (
    <section className="event-level-panel" role="dialog" aria-label="恋恋不舍">
      <header>
        <div>
          <h2>恋恋不舍</h2>
          <p>本次不能交换宝可梦，但还可以分配 {points} 点等级。</p>
        </div>
        <button type="button" onClick={onClose}>返回</button>
      </header>
      <div className="event-level-grid">
        {rest.player_display.map((pokemon, index) => (
          <button disabled={points <= 0} type="button" onClick={() => onAction({type: "event_apply_level", slot: index}, "等级已提升")} key={`event-level-${pokemon.species_id}-${index}`}>
            <span>{index + 1}</span>
            <PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} />
            <strong>{displayName(pokemon)}</strong>
            <small>Lv{pokemon.level}</small>
          </button>
        ))}
      </div>
    </section>
  );

  return <EmbeddedOrModal embedded={embedded}>{content}</EmbeddedOrModal>;
}

function EmbeddedOrModal({embedded, children}: {embedded?: boolean; children: ReactElement}) {
  return embedded ? children : <div className="modal-layer">{children}</div>;
}
