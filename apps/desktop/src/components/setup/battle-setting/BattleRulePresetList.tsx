import type {BattleRulePreset, BattleSetting} from "@changebattle/shared";
import {BATTLE_GENERATION_OPTIONS, BATTLE_RULE_PRESET_OPTIONS} from "@changebattle/shared";
import type {BattleSettingTab} from "./battleSettingModel";
import {BATTLE_RULE_PRESET_STATE} from "./battleSettingModel";
import "./BattleRulePresetList.css";

export type BattleRulePresetListProps = {
  tab: BattleSettingTab;
  setting: BattleSetting;
  selectedPresetId: BattleRulePreset;
  longText?: boolean;
  onToggleGeneration: (generation: number) => void;
  onSelectPreset: (preset: BattleRulePreset) => void;
  onSetLegendary: (enabled: boolean) => void;
};

export function BattleRulePresetList({tab, setting, selectedPresetId, longText = false, onToggleGeneration, onSelectPreset, onSetLegendary}: BattleRulePresetListProps) {
  return (
    <div className="battle-rule-preset-list">
      {tab === "regions" ? BATTLE_GENERATION_OPTIONS.map(option => {
        const selected = setting.allowed_generations.includes(option.generation);
        return (
          <button className={`battle-rule-preset-row battle-rule-region-row ${selected ? "checked" : ""}`} role="checkbox" aria-checked={selected} onClick={() => onToggleGeneration(option.generation)} type="button" key={option.generation}>
            <i aria-hidden="true" />
            <span>{longText ? `${option.region}地区专爱` : option.region}</span>
            <small>第 {option.generation} 世代</small>
            <b>{selected ? "已选" : "未选"}</b>
          </button>
        );
      }) : null}
      {tab === "systems" ? BATTLE_RULE_PRESET_OPTIONS.map(option => {
        const selected = setting.battle_rule_preset === option.id;
        const presetState = BATTLE_RULE_PRESET_STATE[option.id];
        const selectedForDetail = selectedPresetId === option.id;
        return (
          <button className={`battle-rule-preset-row battle-rule-radio-row ${selected ? "checked" : ""} ${selectedForDetail ? "focused" : ""} ${!presetState.ready ? "unavailable" : ""}`} role="radio" aria-checked={selected} onClick={() => onSelectPreset(option.id)} type="button" key={option.id}>
            <i aria-hidden="true" />
            <span>{longText ? `${option.name}完整规则` : option.name}</span>
            <small>{presetState.summary}</small>
            <b>{presetState.ready ? (selected ? "当前" : "选择") : "未接入"}</b>
          </button>
        );
      }) : null}
      {tab === "legendary" ? (
        <>
          <button className={`battle-rule-preset-row battle-rule-radio-row ${!setting.legendary_battle ? "checked" : ""}`} role="radio" aria-checked={!setting.legendary_battle} onClick={() => onSetLegendary(false)} type="button">
            <i aria-hidden="true" />
            <span>关闭神战</span>
            <small>随机池排除 tier10 神兽/幻兽档。</small>
            <b>{!setting.legendary_battle ? "当前" : "选择"}</b>
          </button>
          <button className={`battle-rule-preset-row battle-rule-radio-row ${setting.legendary_battle ? "checked" : ""}`} role="radio" aria-checked={setting.legendary_battle} onClick={() => onSetLegendary(true)} type="button">
            <i aria-hidden="true" />
            <span>开启神战</span>
            <small>{longText ? "随机池允许 tier10 神兽/幻兽档，每队最多 1 只，挑战更剧烈。" : "随机池允许 tier10 神兽/幻兽档，每队最多 1 只。"}</small>
            <b>{setting.legendary_battle ? "当前" : "选择"}</b>
          </button>
        </>
      ) : null}
    </div>
  );
}
