import "./PageActionBar.css";

export function PageActionBar({saveLabel, backLabel = "返回", saveDisabled = false, onSave, onBack}: {saveLabel: string; backLabel?: string; saveDisabled?: boolean; onSave?: () => void; onBack?: () => void}) {
  return (
    <div className="page-action-bar">
      <button disabled={saveDisabled} onClick={onSave}>{saveLabel}</button>
      <button onClick={onBack}>{backLabel}</button>
    </div>
  );
}
