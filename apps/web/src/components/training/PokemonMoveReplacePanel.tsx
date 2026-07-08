import {useMemo, useState} from "react";
import {dexLabelToId, type DexMoveSummary, type LocalPokemonV4} from "@changebattle-v2/api";
import "../dex/MoveCard.css";
import "./PokemonMoveReplacePanel.css";

export type PokemonMoveReplacePanelProps = {
  pokemon: LocalPokemonV4;
  newMove: DexMoveSummary;
  busy?: boolean;
  onConfirm: (moveSlot: number) => void;
  onCancel: () => void;
};

export function PokemonMoveReplacePanel({pokemon, newMove, busy = false, onConfirm, onCancel}: PokemonMoveReplacePanelProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const duplicateSlot = useMemo(
    () => pokemon.moves.findIndex(move => normalizeId(move.moveId) === normalizeId(newMove.id)),
    [newMove.id, pokemon.moves],
  );
  const canConfirm = selectedSlot !== null && duplicateSlot < 0 && !busy;

  return (
    <section className="pokemon-move-replace-panel" aria-label="替换技能">
      <header className="pokemon-move-replace-header">
        <div>
          <strong>{pokemon.nameZh || pokemon.name}</strong>
          <span>准备学习 {newMove.nameZh || newMove.name}</span>
        </div>
        <button type="button" onClick={onCancel} aria-label="关闭技能替换">×</button>
      </header>
      <div className="pokemon-move-replace-body">
        <article className="pokemon-move-replace-new">
          <small>新技能</small>
          <MoveSummaryCard move={newMove} />
        </article>
        <div className="pokemon-move-replace-slots">
          {pokemon.moves.slice(0, 4).map((move, index) => (
            <button
              className={`${selectedSlot === index ? "selected" : ""} ${duplicateSlot === index ? "duplicate" : ""}`}
              type="button"
              onClick={() => setSelectedSlot(index)}
              key={`${move.moveId}-${index}`}
            >
              <em>#{index + 1}</em>
              <MoveSummaryCard move={move} />
            </button>
          ))}
        </div>
      </div>
      <footer className="pokemon-move-replace-footer">
        <span>{duplicateSlot >= 0 ? "目标已经学会这个招式。" : selectedSlot === null ? "请选择要替换的技能槽。" : `将替换第 ${selectedSlot + 1} 个技能。`}</span>
        <button type="button" onClick={onCancel}>取消</button>
        <button type="button" disabled={!canConfirm} onClick={() => selectedSlot !== null ? onConfirm(selectedSlot) : undefined}>{busy ? "学习中" : "确认学习"}</button>
      </footer>
    </section>
  );
}

type MoveCardSummary = {
  id?: string;
  moveId?: string;
  name: string;
  nameZh: string;
  type?: string;
  typeId?: string;
  category?: string;
  categoryId?: string;
  power: number;
  accuracy: number | null;
  pp: number;
};

function MoveSummaryCard({move}: {move: MoveCardSummary}) {
  const typeId = moveTypeId(move.typeId || move.type || "normal") || "normal";
  return (
    <span className={`pokemon-move-replace-card move-card move-choice move-card-dex quick-dex-move-card move-type-${typeId}`}>
      <span className="move-name-row">
        <strong>{move.nameZh || move.name || move.id || move.moveId}</strong>
        <i>{move.category || move.categoryId || "-"}</i>
      </span>
      <span className="move-meta-row">
        <b>{move.type || move.typeId || "-"}</b>
        <em>威 {move.power || "-"}</em>
        <em>命 {move.accuracy ?? "-"}</em>
        <em>PP {move.pp || "-"}</em>
      </span>
    </span>
  );
}

function normalizeId(value: string | undefined): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function moveTypeId(value: string | undefined): string {
  return dexLabelToId("types", value || "");
}
