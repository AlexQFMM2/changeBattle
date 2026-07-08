import type {ChangeBattleV2Api, DexMoveSummary, PlayerVaultMoveTeachingViewV4, PlayerVaultV4} from "@changebattle-v2/api";
import {MoveCard} from "../formal/move/MoveCard";
import "./VaultMoveSelectModal.css";

export type VaultMoveSelectState = {
  itemKey: string;
  pokemonId: string;
  query: string;
};

export function VaultMoveSelectModal({api, vault, state, onStateChange, onCancel, onSelectMove}: {
  api: ChangeBattleV2Api;
  vault: PlayerVaultV4;
  state: VaultMoveSelectState;
  onStateChange: (state: VaultMoveSelectState) => void;
  onCancel: () => void;
  onSelectMove: (view: Extract<PlayerVaultMoveTeachingViewV4, {ok: true}>, move: DexMoveSummary) => void;
}) {
  const view = api.getPlayerVaultMoveTeachingView(vault, state.itemKey, state.pokemonId, state.query);
  return (
    <div className="vault-move-select-modal-layer" role="presentation">
      <section className="vault-move-select-modal" aria-label="选择要学习的技能">
        <header>
          <div>
            <strong>{view.ok ? view.itemName : "使用道具"}</strong>
            <span>{view.ok ? `${view.sourceLabel} · ${view.pokemonName}` : view.reason}</span>
          </div>
          <button type="button" onClick={onCancel} aria-label="关闭">×</button>
        </header>
        <div className="vault-move-select-modal-body">
          <label>
            <span>搜索</span>
            <input
              value={state.query}
              onChange={event => onStateChange({...state, query: event.target.value})}
              placeholder={view.ok && view.oncePerPokemon ? "禁断秘籍可搜索任意技能" : "筛选可学习技能"}
              disabled={!view.ok || Boolean(view.unavailableReason)}
            />
          </label>
          {view.ok && view.unavailableReason ? <p>{view.unavailableReason}</p> : null}
          {view.ok && view.alreadyUsed && !view.unavailableReason ? <p>这只宝可梦已经不能继续使用该道具。</p> : null}
          <div className="vault-move-select-modal-grid">
            {view.ok && view.moves.length ? view.moves.map(move => (
              <MoveCard
                className="vault-move-select-card"
                size="sheet"
                disabled={view.alreadyUsed}
                name={move.nameZh || move.name}
                moveType={move.type}
                typeLabel={api.translateDexLabel("types", move.type)}
                category={api.translateDexLabel("categories", move.category)}
                power={move.power}
                pp={move.pp}
                meta={[`威力 ${move.power || "--"}`, `PP ${move.pp}`]}
                onClick={() => onSelectMove(view, move)}
                key={move.id}
              />
            )) : <p>{view.ok ? view.unavailableReason || "没有可学习的技能。" : view.reason}</p>}
          </div>
        </div>
        <footer>
          <button type="button" onClick={onCancel}>取消</button>
          <span>选择技能后进入替换槽位。</span>
        </footer>
      </section>
    </div>
  );
}
