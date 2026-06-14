import {useEffect, useRef, useState} from "react";
import type {BattleRulePreset, BattleSetting, LocalSave} from "@changebattle/shared";
import {DEFAULT_BATTLE_SETTING, normalizeBattleSetting} from "@changebattle/shared";
import {BattleRuleDetailPanel} from "./BattleRuleDetailPanel";
import {BattleRulePresetList} from "./BattleRulePresetList";
import {BattleRuleTabs} from "./BattleRuleTabs";
import {BattleSettingActionBar} from "./BattleSettingActionBar";
import type {BattleSettingSaveStatus, BattleSettingTab} from "./battleSettingModel";
import "./BattleSettingPage.css";

export type BattleSettingPageProps = {
  save: LocalSave | null;
  onSaved: (save: LocalSave) => void;
  onBack: () => void;
  previewSetting?: BattleSetting;
  previewStatus?: BattleSettingSaveStatus;
  previewNotice?: string;
};

export function BattleSettingPage({save, onSaved, onBack, previewSetting, previewStatus, previewNotice}: BattleSettingPageProps) {
  const [setting, setSetting] = useState<BattleSetting>(() => normalizeBattleSetting(previewSetting || save?.battle_setting || DEFAULT_BATTLE_SETTING));
  const [activeTab, setActiveTab] = useState<BattleSettingTab>("regions");
  const [selectedPresetId, setSelectedPresetId] = useState<BattleRulePreset>(() => setting.battle_rule_preset || "none");
  const [status, setStatus] = useState<BattleSettingSaveStatus>(previewStatus || "idle");
  const [notice, setNotice] = useState(previewNotice || "");
  const isPreview = Boolean(previewSetting);
  const editedRef = useRef(false);

  useEffect(() => {
    if (isPreview) {
      const normalized = normalizeBattleSetting(previewSetting);
      setSetting(normalized);
      setSelectedPresetId(normalized.battle_rule_preset);
      setStatus(previewStatus || "idle");
      setNotice(previewNotice || "");
      return;
    }
    let cancelled = false;
    void window.changeBattle?.getBattleSetting().then(result => {
      if (cancelled || !result) return;
      const normalized = normalizeBattleSetting(result.setting);
      if (!editedRef.current) {
        setSetting(normalized);
        setSelectedPresetId(normalized.battle_rule_preset);
      }
      if (result.save) onSaved(result.save);
    }).catch(() => {
      if (cancelled || editedRef.current) return;
      const normalized = normalizeBattleSetting(save?.battle_setting || DEFAULT_BATTLE_SETTING);
      setSetting(normalized);
      setSelectedPresetId(normalized.battle_rule_preset);
    });
    return () => {
      cancelled = true;
    };
  }, [isPreview, onSaved, previewNotice, previewSetting, previewStatus, save?.battle_setting]);

  function applySettingChange(next: BattleSetting) {
    editedRef.current = true;
    const normalized = normalizeBattleSetting(next);
    setSetting(normalized);
    setSelectedPresetId(normalized.battle_rule_preset);
    setNotice("");
    setStatus("idle");
  }

  async function saveAndBack() {
    if (status === "saving") return;
    if (isPreview) {
      onBack();
      return;
    }
    setStatus("saving");
    setNotice("");
    try {
      const result = await window.changeBattle!.updateBattleSetting(setting);
      const normalized = normalizeBattleSetting(result.setting);
      setSetting(normalized);
      setSelectedPresetId(normalized.battle_rule_preset);
      if (result.save) onSaved(result.save);
      setStatus("saved");
      onBack();
    } catch (error) {
      setStatus("error");
      setNotice(error instanceof Error ? error.message : "保存失败，请重试。");
    }
  }

  function toggleGeneration(generation: number) {
    const current = setting;
    const selected = current.allowed_generations.includes(generation);
    if (selected && current.allowed_generations.length <= 3) {
      setStatus("error");
      setNotice("地区专爱至少保留 3 个地区。");
      return;
    }
    const allowed_generations = selected
      ? current.allowed_generations.filter(value => value !== generation)
      : [...current.allowed_generations, generation].sort((a, b) => a - b);
    applySettingChange({...current, allowed_generations});
  }

  function selectPreset(preset: BattleRulePreset) {
    setSelectedPresetId(preset);
    applySettingChange({...setting, battle_rule_preset: preset});
  }

  function setLegendary(enabled: boolean) {
    applySettingChange({...setting, legendary_battle: enabled});
  }

  return (
    <div className="battle-setting-page">
      <section className="battle-setting-shell">
        <BattleRuleTabs activeTab={activeTab} onSelectTab={tab => { setActiveTab(tab); setNotice(""); if (status === "error") setStatus("idle"); }} />
        <main className="battle-setting-body">
          <BattleRulePresetList tab={activeTab} setting={setting} selectedPresetId={selectedPresetId} onToggleGeneration={toggleGeneration} onSelectPreset={selectPreset} onSetLegendary={setLegendary} />
          <BattleRuleDetailPanel tab={activeTab} setting={setting} selectedPresetId={selectedPresetId} saveStatus={status} notice={notice} />
        </main>
        <BattleSettingActionBar status={status} notice={notice} onSaveAndBack={saveAndBack} />
      </section>
    </div>
  );
}
