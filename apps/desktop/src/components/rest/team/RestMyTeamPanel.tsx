import {useEffect, useState} from "react";
import type {DesktopGameState, RestAction} from "@changebattle/shared";
import {RestSelectedPokemonDetail} from "./RestSelectedPokemonDetail";
import {RestTeamMiniCard} from "./RestTeamMiniCard";
import type {RestPokemonFocus} from "./restTeamModel";
import "./RestMyTeamPanel.css";

type RestState = NonNullable<DesktopGameState["rest"]>;

export function RestMyTeamPanel({rest, selectedSlot = 0, onSelectSlot, onMove, onUseItem, onUnequip, onStats, onAction}: {rest: RestState; selectedSlot?: number; onSelectSlot?: (slot: number) => void; onMove?: (slot: number, moveSlot?: number) => void; onUseItem?: (slot: number) => void; onUnequip?: (slot: number) => void; onStats?: (slot: number) => void; onAction?: (action: RestAction) => void | Promise<unknown>}) {
  const [internalSlot, setInternalSlot] = useState(selectedSlot);
  const slot = Math.min(Math.max(0, onSelectSlot ? selectedSlot : internalSlot), Math.max(0, rest.player_display.length - 1));
  const pokemon = rest.player_display[slot] || rest.player_display[0];
  const state = rest.player_state[slot] || rest.player_state[0];
  const [focus, setFocus] = useState<RestPokemonFocus>({type: "ability"});

  useEffect(() => {
    setFocus({type: "ability"});
  }, [slot]);

  if (!pokemon) {
    return <section className="rest-my-team-panel empty"><strong>我的队伍</strong><span>当前没有队伍记录。</span></section>;
  }

  function selectSlot(nextSlot: number) {
    onSelectSlot?.(nextSlot);
    setInternalSlot(nextSlot);
  }

  return (
    <section className="rest-my-team-panel">
      <aside className="rest-my-team-slots">
        {rest.player_display.slice(0, 6).map((entry, index) => (
          <RestTeamMiniCard pokemon={entry} state={rest.player_state[index]} index={index} selected={index === slot} onSelect={() => selectSlot(index)} key={`${entry.run_member_id || entry.showdown_id || entry.species_id}-${index}`} />
        ))}
      </aside>
      <RestSelectedPokemonDetail rest={rest} pokemon={pokemon} state={state} slot={slot} focus={focus} onFocus={setFocus} onMove={onMove} onUseItem={onUseItem} onUnequip={onUnequip} onStats={onStats} onAction={onAction} />
    </section>
  );
}
