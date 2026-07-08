import type {ChangeBattleV2Api} from "@changebattle-v2/api";
import "./VaultNumericPreviewModal.css";

export type VaultNumericPreviewModalState = Extract<ReturnType<ChangeBattleV2Api["previewPlayerVaultNumericItemUse"]>, {ok: true}>;

export function VaultNumericPreviewModal({preview, onCancel, onConfirm}: {
  preview: VaultNumericPreviewModalState;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="vault-numeric-preview-modal-layer" role="presentation">
      <section className="vault-numeric-preview-modal" aria-label="确认数值变化">
        <header>
          <div>
            <strong>{preview.itemName}</strong>
            <span>{preview.pokemonName}</span>
          </div>
          <button type="button" onClick={onCancel} aria-label="关闭">×</button>
        </header>
        <div className="vault-numeric-preview-modal-grid">
          <strong>变化前</strong>
          <strong>变化后</strong>
          {preview.changes.map(change => (
            <article key={`${change.label}:${change.before}:${change.after}`}>
              <span>{change.label}</span>
              <b>{change.before}</b>
              <i>{change.after}</i>
            </article>
          ))}
        </div>
        <footer>
          <button type="button" onClick={onCancel}>取消</button>
          <button type="button" className="primary" onClick={onConfirm}>确认使用</button>
        </footer>
      </section>
    </div>
  );
}
