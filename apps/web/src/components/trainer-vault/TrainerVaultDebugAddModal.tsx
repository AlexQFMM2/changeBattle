import type {ChangeBattleV2Api} from "@changebattle-v2/api";
import "./TrainerVaultDebugAddModal.css";

export type TrainerVaultDebugAddKind = "bag" | "pokemon";

export type TrainerVaultDebugAddState = {
  kind: TrainerVaultDebugAddKind;
  query: string;
  selectedId: string;
  quantity: number;
  error?: string;
};

export function TrainerVaultDebugAddModal({api, state, onStateChange, onCancel, onConfirm}: {
  api: ChangeBattleV2Api;
  state: TrainerVaultDebugAddState;
  onStateChange: (state: TrainerVaultDebugAddState) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const category = state.kind === "bag" ? "items" : "pokemon";
  const result = api.searchDex({category, query: state.query, limit: 30});
  const rows = result.rows || [];
  const selected = rows.find(row => row.id === state.selectedId) || null;
  const title = state.kind === "bag" ? "新增自定义道具" : "新增自定义宝可梦";
  return (
    <div className="trainer-vault-debug-add-modal-layer" role="presentation">
      <section className="trainer-vault-debug-add-modal" aria-label={title}>
        <header>
          <div>
            <strong>{title}</strong>
            <span>{state.kind === "bag" ? "搜索道具并加入调试背包" : "搜索物种并按蛋规则生成"}</span>
          </div>
          <button type="button" onClick={onCancel} aria-label="关闭">×</button>
        </header>
        <div className="trainer-vault-debug-add-modal-form">
          <label>
            <span>搜索</span>
            <input
              value={state.query}
              onChange={event => onStateChange({...state, query: event.target.value, selectedId: "", error: ""})}
              placeholder={state.kind === "bag" ? "输入道具名或 ID" : "输入宝可梦名或 ID"}
              autoFocus
            />
          </label>
          {state.kind === "bag" ? (
            <label>
              <span>数量</span>
              <input
                type="number"
                min={1}
                max={999}
                value={state.quantity}
                onChange={event => onStateChange({...state, quantity: Math.max(1, Math.min(999, Math.floor(Number(event.target.value || 1))))})}
              />
            </label>
          ) : null}
          <div className="trainer-vault-debug-add-modal-results">
            {rows.length ? rows.map(row => (
              <button
                className={state.selectedId === row.id ? "selected" : ""}
                type="button"
                onClick={() => onStateChange({...state, selectedId: row.id, error: ""})}
                key={row.id}
              >
                <strong>{row.nameZh || row.name || row.id}</strong>
                <span>{row.subtitle || row.description || row.id}</span>
              </button>
            )) : <p>{state.query ? "没有匹配结果。" : "输入关键词后选择一个结果。"}</p>}
          </div>
          {state.error ? <p className="trainer-vault-debug-add-modal-error">{state.error}</p> : null}
        </div>
        <footer>
          <button type="button" onClick={onCancel}>取消</button>
          <span>{selected ? `已选择：${selected.nameZh || selected.name || selected.id}` : "请选择一个结果。"}</span>
          <button type="button" onClick={onConfirm} disabled={!state.selectedId}>确定</button>
        </footer>
      </section>
    </div>
  );
}
