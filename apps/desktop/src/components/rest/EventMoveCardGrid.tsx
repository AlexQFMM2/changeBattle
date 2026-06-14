import type {PricedMove} from "@changebattle/shared";
import {MoveCard} from "../move/MoveCard";
import {toId} from "../../lib/ui";
import "./EventMoveCardGrid.css";

type EventMoveCardGridProps = {
  moves: PricedMove[];
  selectedMoveId: string;
  loading?: boolean;
  serviceLabel?: string;
  onSelectMove: (moveId: string) => void;
};

export function EventMoveCardGrid({moves, selectedMoveId, loading = false, serviceLabel = "可学", onSelectMove}: EventMoveCardGridProps) {
  if (loading) {
    return (
      <div className="event-move-card-grid empty">
        <p>读取可学招式中...</p>
      </div>
    );
  }
  if (!moves.length) {
    return (
      <div className="event-move-card-grid empty">
        <p>当前没有可学习的{serviceLabel}招式。</p>
      </div>
    );
  }
  return (
    <div className="event-move-card-grid">
      {moves.map(move => {
        const moveId = toId(move.id || move.name);
        return (
          <MoveCard
            size="sheet"
            className="event-move-card-grid-card"
            selected={selectedMoveId === moveId}
            name={move.name_zh || move.name}
            moveType={move.type || move.type_zh}
            typeLabel={move.type_zh || move.type || "一般"}
            category={move.category_zh || move.category || "变化"}
            pp={move.pp || "--"}
            power={move.power || "--"}
            accuracy={move.accuracy ?? "必中"}
            onClick={() => onSelectMove(moveId)}
            key={`event-move-card-${move.id || move.name}`}
          />
        );
      })}
    </div>
  );
}
