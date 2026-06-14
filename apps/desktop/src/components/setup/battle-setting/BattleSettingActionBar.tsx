import type {BattleSettingSaveStatus} from "./battleSettingModel";
import {saveStatusText} from "./battleSettingModel";
import "./BattleSettingActionBar.css";

export function BattleSettingActionBar({status = "idle", notice = "", onSaveAndBack}: {status?: BattleSettingSaveStatus; notice?: string; onSaveAndBack: () => void}) {
  return (
    <footer className={`battle-setting-action-bar ${status}`}>
      <span>{saveStatusText(status, notice)}</span>
      <div className="battle-setting-action-buttons">
        <button disabled={status === "saving"} onClick={onSaveAndBack} type="button">{status === "saving" ? "保存中" : "保存并返回"}</button>
      </div>
    </footer>
  );
}
