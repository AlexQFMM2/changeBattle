import type {PlayerPokemonState, PricedMove, RentalPokemon} from "@changebattle/shared";
import {MoveCard} from "../move/MoveCard";
import {moveDescription, runtimeMoveLabel} from "../../lib/ui";
import "./MoveReplacePanel.css";

type MoveReplacePanelProps = {
  pokemon: RentalPokemon;
  state?: PlayerPokemonState;
  newMove: PricedMove;
  selectedMoveSlot: number | null;
  busy?: boolean;
  onSelectMoveSlot: (slot: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function MoveReplacePanel({pokemon, state, newMove, selectedMoveSlot, busy = false, onSelectMoveSlot, onConfirm, onCancel}: MoveReplacePanelProps) {
  return (
    <section className="move-replace-panel">
      <div className="move-replace-layout">
        <section className="move-replace-new-move">
          <h3>要学习的新技能</h3>
          <MoveCard
            size="sheet"
            className="tm-replace-move-card tm-replace-move-card-readonly"
            name={newMove.name_zh || newMove.name}
            moveType={newMove.type || newMove.type_zh}
            typeLabel={newMove.type_zh || newMove.type || "一般"}
            category={newMove.category_zh || newMove.category || "变化"}
            pp={newMove.pp || "--"}
            power={newMove.power || "--"}
            accuracy={newMove.accuracy ?? "必中"}
            tabIndex={-1}
          />
          <p>{moveDescription(newMove)}</p>
        </section>
        <section className="move-replace-current-moves">
          <h3>选择替换目标</h3>
          <div>
            {(pokemon.moves || []).map((move, index) => (
              <MoveCard
                size="sheet"
                className="tm-replace-move-card"
                selected={selectedMoveSlot === index}
                name={runtimeMoveLabel(pokemon, state?.moves?.[index], index)}
                moveType={move.type || move.type_zh}
                typeLabel={move.type_zh || move.type || "一般"}
                category={move.category_zh || move.category || "变化"}
                pp={state?.moves?.[index]?.pp ?? move.pp}
                maxPp={state?.moves?.[index]?.maxpp ?? move.pp}
                power={move.power || "--"}
                accuracy={move.accuracy ?? "必中"}
                onClick={() => onSelectMoveSlot(index)}
                key={`move-replace-${move.id || move.name}-${index}`}
              />
            ))}
          </div>
        </section>
      </div>
      <footer>
        <button disabled={busy || selectedMoveSlot === null} onClick={onConfirm}>{busy ? "替换中" : "确认替换"}</button>
        <button onClick={onCancel}>返回</button>
      </footer>
    </section>
  );
}
