import type {BattleRulePreset, BattleSetting} from "@changebattle/shared";
import {BATTLE_RULE_PRESET_OPTIONS} from "@changebattle/shared";

export type BattleSettingTab = "regions" | "systems" | "legendary";

export type BattleSettingSaveStatus = "idle" | "saving" | "saved" | "error";

export const BATTLE_SETTING_TABS: Array<{id: BattleSettingTab; label: string}> = [
  {id: "regions", label: "地区专爱"},
  {id: "systems", label: "战斗系统"},
  {id: "legendary", label: "神战"},
];

export const BATTLE_RULE_PRESET_STATE: Record<BattleRulePreset, {ready: boolean; summary: string; detail: string}> = {
  none: {ready: true, summary: "默认", detail: "不开放 Mega、Z 招式、极巨化或太晶化。适合保留最朴素的随机对战体验。"},
  gen7: {ready: true, summary: "Mega + Z", detail: "开放 Mega 进化与 Z 招式。随机池最多到第七世代；Mega 石与 Z 纯晶会进入道具池。"},
  gen8: {ready: true, summary: "极巨 / 超极巨", detail: "开放极巨化与超极巨化。随机池最多到第八世代；对战使用第八世代 Showdown 规则。"},
  gen9: {ready: true, summary: "太晶化", detail: "开放太晶珠。每场战斗每方可太晶化一次，太晶爆发会按当前太晶属性展示。"},
};

export function selectedPresetForSetting(setting: BattleSetting, selectedPresetId?: BattleRulePreset) {
  return BATTLE_RULE_PRESET_OPTIONS.find(option => option.id === (selectedPresetId || setting.battle_rule_preset)) || BATTLE_RULE_PRESET_OPTIONS[0];
}

export function battleSettingDetail(tab: BattleSettingTab, setting: BattleSetting, selectedPresetId?: BattleRulePreset): {title: string; text: string; strong: string; footer: string} {
  const selectedRegionCount = setting.allowed_generations.length;
  const selectedPreset = selectedPresetForSetting(setting, selectedPresetId);
  const selectedPresetState = BATTLE_RULE_PRESET_STATE[selectedPreset.id];
  const selectedPresetOpen = setting.battle_rule_preset === selectedPreset.id;
  const title = tab === "systems" ? selectedPreset.name : tab === "regions" ? "地区专爱" : "神战";
  const text = tab === "regions"
    ? `已选择 ${selectedRegionCount}/9 个地区，随机宝可梦只会来自这些世代。`
    : tab === "systems"
      ? selectedPresetState.detail
      : setting.legendary_battle ? "神战开启：随机池允许 tier10 神兽/幻兽档，每队最多 1 只。" : "神战关闭：随机池排除 tier10 神兽/幻兽档。";
  const strong = tab === "systems"
    ? selectedPresetState.ready
      ? selectedPresetOpen ? `${selectedPreset.name} 已启用` : `${selectedPreset.name} 可启用`
      : `${selectedPreset.name} 未接入`
    : selectedRegionCount >= 3 ? "配置有效" : "配置未完成";
  return {title, text, strong, footer: `地区 ${selectedRegionCount}/9　规则 ${selectedPreset.name}`};
}

export function saveStatusText(status: BattleSettingSaveStatus, notice?: string): string {
  if (notice) return notice;
  if (status === "saving") return "正在保存，对下一局新挑战生效。";
  if (status === "saved") return "已保存，对下一局新挑战生效。";
  if (status === "error") return "保存失败，请重试。";
  return "修改后点击保存并返回，对下一局新挑战生效。";
}
