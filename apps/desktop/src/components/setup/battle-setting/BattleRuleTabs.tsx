import type {BattleSettingTab} from "./battleSettingModel";
import {BATTLE_SETTING_TABS} from "./battleSettingModel";
import "./BattleRuleTabs.css";

export function BattleRuleTabs({activeTab, longText = false, onSelectTab}: {activeTab: BattleSettingTab; longText?: boolean; onSelectTab: (tab: BattleSettingTab) => void}) {
  return (
    <nav className="battle-rule-tabs" aria-label="对局偏好分类">
      {BATTLE_SETTING_TABS.map(tab => (
        <button className={activeTab === tab.id ? "selected" : ""} onClick={() => onSelectTab(tab.id)} type="button" key={tab.id}>
          {longText ? `${tab.label}设置` : tab.label}
        </button>
      ))}
    </nav>
  );
}
