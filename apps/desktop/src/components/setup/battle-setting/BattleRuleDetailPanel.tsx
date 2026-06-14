import type {BattleRulePreset, BattleSetting} from "@changebattle/shared";
import type {BattleSettingSaveStatus, BattleSettingTab} from "./battleSettingModel";
import {battleSettingDetail, saveStatusText} from "./battleSettingModel";
import "./BattleRuleDetailPanel.css";

export function BattleRuleDetailPanel({tab, setting, selectedPresetId, saveStatus = "idle", notice = "", longText = false}: {tab: BattleSettingTab; setting: BattleSetting; selectedPresetId: BattleRulePreset; saveStatus?: BattleSettingSaveStatus; notice?: string; longText?: boolean}) {
  const detail = battleSettingDetail(tab, setting, selectedPresetId);
  return (
    <aside className={`battle-rule-detail-panel ${saveStatus}`}>
      <div className="battle-rule-detail-copy">
        <span>对局偏好</span>
        <h3>{longText ? `${detail.title}长标题测试` : detail.title}</h3>
        <p>{longText ? `${detail.text} 这是一段额外追加的长说明，用于确认详情面板内部滚动，而不是把页面撑开。` : detail.text}</p>
        <strong>{detail.strong}</strong>
        <small>{saveStatusText(saveStatus, notice)}</small>
      </div>
      <footer>{detail.footer}</footer>
    </aside>
  );
}
