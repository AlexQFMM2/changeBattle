import "./PlayerNameEditor.css";

export function PlayerNameEditor({value, disabled = false, onChange}: {value: string; disabled?: boolean; onChange?: (value: string) => void}) {
  return (
    <label className="player-name-editor">
      <span>昵称</span>
      <input value={value} disabled={disabled} onChange={event => onChange?.(event.target.value)} />
    </label>
  );
}
