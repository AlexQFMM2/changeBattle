import type {ChangeBattleV2Api, DexMoveSummary, PlayerPokemonRecordV4} from "@changebattle-v2/api";
import {MoveCard} from "../formal/move/MoveCard";
import "./VaultMoveReplaceModal.css";

export type VaultMoveReplaceMove = {
  moveId: string;
  name: string;
  nameZh: string;
  type: string;
  category: string;
  power: number | string;
  pp: number | string;
};

export type VaultMoveReplaceState = {
  itemKey: string;
  itemName: string;
  pokemon: PlayerPokemonRecordV4;
  pokemonName: string;
  move: DexMoveSummary;
  currentMoves: VaultMoveReplaceMove[];
};

export function VaultMoveReplaceModal({api, state, onBack, onCancel, onConfirm}: {
  api: ChangeBattleV2Api;
  state: VaultMoveReplaceState;
  onBack: () => void;
  onCancel: () => void;
  onConfirm: (moveSlot: number) => void;
}) {
  return (
    <div className="vault-move-replace-modal-layer" role="presentation">
      <section className="vault-move-replace-modal" aria-label="选择替换技能">
        <header>
          <div>
            <strong>{state.itemName}</strong>
            <span>{state.pokemonName}</span>
          </div>
          <button type="button" onClick={onCancel} aria-label="关闭">×</button>
        </header>
        <div className="vault-move-replace-modal-body">
          <article className="vault-move-replace-modal-new">
            <span>本次学习</span>
            <MoveCard
              className="vault-move-replace-card"
              size="battle"
              name={state.move.nameZh || state.move.name}
              moveType={state.move.type}
              typeLabel={api.translateDexLabel("types", state.move.type)}
              category={api.translateDexLabel("categories", state.move.category)}
              power={state.move.power}
              pp={state.move.pp}
              meta={[`威力 ${state.move.power || "--"}`, `PP ${state.move.pp}`]}
              disabled
            />
          </article>
          <div className="vault-move-replace-modal-current" aria-label="当前技能">
            {Array.from({length: 4}, (_, index) => {
              const move = state.currentMoves[index];
              return (
                <MoveCard
                  className="vault-move-replace-current-card"
                  size="sheet"
                  name={move?.nameZh || move?.name || "空技能槽"}
                  moveType={move?.type || "Normal"}
                  typeLabel={move ? api.translateDexLabel("types", move.type) : "一般"}
                  category={move ? api.translateDexLabel("categories", move.category) : "替换"}
                  power={move?.power || "--"}
                  pp={move?.pp || "--"}
                  badge={index + 1}
                  meta={move ? [`威力 ${move.power || "--"}`, `PP ${move.pp}`] : ["点击写入"]}
                  onClick={() => onConfirm(index)}
                  key={index}
                />
              );
            })}
          </div>
        </div>
        <footer>
          <button type="button" onClick={onBack}>返回选择</button>
          <span>选择右侧技能槽后立即确认替换。</span>
        </footer>
      </section>
    </div>
  );
}
