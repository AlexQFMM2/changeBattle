import {useMemo, useState} from "react";
import type {BattlePreferenceV4, ChangeBattleV2Api, FormalCompetitionModeV4, TrainingRuleSetV4, UserProfileV2} from "@changebattle-v2/api";
import {
  BATTLE_GENERATION_OPTIONS_V4,
  BATTLE_RULE_PRESET_OPTIONS_V4,
  BATTLE_SYSTEM_OPTIONS_V4,
  normalizeBattlePreferenceV4,
} from "@changebattle-v2/api";
import "./BattlePreferencePage.css";

type BattlePreferenceTab = "regions" | "systems" | "competition" | "legendary" | "bag";
type SaveStatus = "idle" | "saving" | "saved" | "error";

const TABS: Array<{id: BattlePreferenceTab; label: string}> = [
  {id: "regions", label: "地区专爱"},
  {id: "systems", label: "战斗系统"},
  {id: "competition", label: "比赛类型"},
  {id: "legendary", label: "神战"},
  {id: "bag", label: "战斗背包"},
];

const RULE_DETAIL: Record<TrainingRuleSetV4, {summary: string; detail: string}> = {
  standard: {summary: "默认", detail: "不开放 Mega、Z 招式、极巨化或太晶化。适合保留最朴素的随机对战体验。"},
  gen7: {summary: "Mega + Z", detail: "开放 Mega 进化与 Z 招式。随机池最多到第七世代；Mega 石与 Z 纯晶会进入系统道具池。"},
  gen8: {summary: "极巨化", detail: "开放极巨化与超极巨化。随机池最多到第八世代；对战使用第八世代 Showdown 规则。"},
  gen9: {summary: "太晶化", detail: "开放太晶珠。每场战斗每方可太晶化一次，太晶属性来自太晶珠配置。"},
};

const COMPETITION_DETAIL: Record<FormalCompetitionModeV4, {label: string; summary: string; detail: string}> = {
  standard: {label: "普通赛事", summary: "7 场", detail: "默认正式流程，连续完成 7 场挑战后进入结算。"},
  single: {label: "单局模式", summary: "1 场", detail: "只打一场就进入结算链路，适合本地调试战斗、奖励和收服流程。"},
  leagueLoop: {label: "联盟循环赛", summary: "后续", detail: "无尽循环赛预留模式，当前版本暂不开放。"},
};

export function BattlePreferencePage({api, profile, debugFeatureEnabled = false, onProfileChange, onBack}: {
  api: ChangeBattleV2Api;
  profile: UserProfileV2;
  debugFeatureEnabled?: boolean;
  onProfileChange: (profile: UserProfileV2) => void;
  onBack: () => void;
}) {
  const [preference, setPreference] = useState<BattlePreferenceV4>(() => normalizeBattlePreferenceV4(profile.battlePreference));
  const [activeTab, setActiveTab] = useState<BattlePreferenceTab>("regions");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [notice, setNotice] = useState("修改后点击保存并返回，对下一局新挑战生效。");
  const selectedRule = useMemo(() => BATTLE_RULE_PRESET_OPTIONS_V4.find(option => option.id === preference.ruleSet) || BATTLE_RULE_PRESET_OPTIONS_V4[0]!, [preference.ruleSet]);

  function apply(next: Partial<BattlePreferenceV4>) {
    setPreference(current => normalizeBattlePreferenceV4({...current, ...next}));
    setStatus("idle");
    setNotice("修改后点击保存并返回，对下一局新挑战生效。");
  }

  function toggleGeneration(generation: number) {
    const selected = preference.allowedGenerations.includes(generation);
    if (selected && preference.allowedGenerations.length <= 3) {
      setStatus("error");
      setNotice("地区专爱至少保留 3 个地区。");
      return;
    }
    const allowedGenerations = selected
      ? preference.allowedGenerations.filter(value => value !== generation)
      : [...preference.allowedGenerations, generation].sort((a, b) => a - b);
    apply({allowedGenerations});
  }

  async function saveAndBack() {
    if (status === "saving") return;
    setStatus("saving");
    setNotice("正在保存，对下一局新挑战生效。");
    try {
      const saved = await api.updateBattlePreference(profile, preference);
      onProfileChange(saved);
      setStatus("saved");
      onBack();
    } catch (error) {
      setStatus("error");
      setNotice(error instanceof Error ? error.message : "保存失败，请重试。");
    }
  }

  return (
    <main className="battle-preference-page">
      <section className="battle-preference-shell">
        <header className="battle-preference-header">
          <div>
            <h2>对局偏好</h2>
            <span>这些设置会在创建新游戏时写入 runGame，成为队伍生成和战斗规则约束。</span>
          </div>
        </header>
        <nav className="battle-preference-tabs" aria-label="对局偏好分类">
          {TABS.map(tab => (
            <button className={tab.id === activeTab ? "active" : ""} type="button" key={tab.id} onClick={() => { setActiveTab(tab.id); setStatus("idle"); setNotice("修改后点击保存并返回，对下一局新挑战生效。"); }}>
              {tab.label}
            </button>
          ))}
        </nav>
        <section className="battle-preference-body">
          <section className="battle-preference-list">
            {activeTab === "regions" ? (
              BATTLE_GENERATION_OPTIONS_V4.map(option => {
                const active = preference.allowedGenerations.includes(option.generation);
                return (
                  <button className={active ? "selected" : ""} type="button" key={option.generation} onClick={() => toggleGeneration(option.generation)}>
                    <strong>第 {option.generation} 世代</strong>
                    <span>{option.region}</span>
                  </button>
                );
              })
            ) : null}
            {activeTab === "systems" ? (
              BATTLE_RULE_PRESET_OPTIONS_V4.map(option => (
                <button className={option.id === preference.ruleSet ? "selected" : ""} type="button" key={option.id} onClick={() => apply({ruleSet: option.id})}>
                  <strong>{option.name}</strong>
                  <span>{RULE_DETAIL[option.id].summary}</span>
                </button>
              ))
            ) : null}
            {activeTab === "competition" ? (
              <>
                <button className={preference.competitionMode === "standard" ? "selected" : ""} type="button" onClick={() => apply({competitionMode: "standard"})}>
                  <strong>{COMPETITION_DETAIL.standard.label}</strong>
                  <span>{COMPETITION_DETAIL.standard.summary}</span>
                </button>
                {debugFeatureEnabled ? (
                  <button className={preference.competitionMode === "single" ? "selected" : ""} type="button" onClick={() => apply({competitionMode: "single"})}>
                    <strong>{COMPETITION_DETAIL.single.label}</strong>
                    <span>{COMPETITION_DETAIL.single.summary}</span>
                  </button>
                ) : null}
              </>
            ) : null}
            {activeTab === "legendary" ? (
              <>
                <button className={!preference.legendaryBattle ? "selected" : ""} type="button" onClick={() => apply({legendaryBattle: false})}>
                  <strong>关闭神战</strong>
                  <span>随机池排除神兽与幻兽档。</span>
                </button>
                <button className={preference.legendaryBattle ? "selected" : ""} type="button" onClick={() => apply({legendaryBattle: true})}>
                  <strong>开启神战</strong>
                  <span>允许神兽与幻兽进入正式生成池。</span>
                </button>
              </>
            ) : null}
            {activeTab === "bag" ? (
              <>
                <button className={preference.battleBagEnabled ? "selected" : ""} type="button" onClick={() => apply({battleBagEnabled: true})}>
                  <strong>开启战斗背包</strong>
                  <span>战斗页允许打开背包并使用可战斗道具。</span>
                </button>
                <button className={!preference.battleBagEnabled ? "selected" : ""} type="button" onClick={() => apply({battleBagEnabled: false})}>
                  <strong>关闭战斗背包</strong>
                  <span>战斗中隐藏背包入口，不能提交训练师道具。</span>
                </button>
              </>
            ) : null}
          </section>
          <BattlePreferenceDetail activeTab={activeTab} preference={preference} selectedRule={selectedRule} />
        </section>
        <footer className="battle-preference-actions">
          <button type="button" onClick={onBack}>返回</button>
          <span className={status === "error" ? "error" : ""} role="status">{notice}</span>
          <button type="button" disabled={status === "saving"} onClick={() => void saveAndBack()}>{status === "saving" ? "保存中..." : "保存并返回"}</button>
        </footer>
      </section>
    </main>
  );
}

function BattlePreferenceDetail({activeTab, preference, selectedRule}: {
  activeTab: BattlePreferenceTab;
  preference: BattlePreferenceV4;
  selectedRule: (typeof BATTLE_RULE_PRESET_OPTIONS_V4)[number];
}) {
  const systemNames = selectedRule.systems
    .map(system => BATTLE_SYSTEM_OPTIONS_V4.find(option => option.id === system)?.name || system)
    .join(" / ") || "无";
  const title = activeTab === "regions" ? "地区专爱" : activeTab === "systems" ? selectedRule.name : activeTab === "legendary" ? "神战" : "战斗背包";
  const competition = COMPETITION_DETAIL[preference.competitionMode] || COMPETITION_DETAIL.standard;
  const text = activeTab === "regions"
    ? `已选择 ${preference.allowedGenerations.length}/9 个地区。正式队伍生成会优先使用这些世代的宝可梦。`
    : activeTab === "systems"
      ? RULE_DETAIL[selectedRule.id].detail
      : activeTab === "competition"
        ? competition.detail
        : activeTab === "legendary"
        ? (preference.legendaryBattle ? "神战开启：正式生成池允许神兽与幻兽进入。" : "神战关闭：正式生成池会排除神兽与幻兽。")
        : (preference.battleBagEnabled ? "战斗背包开启：战斗中可以打开背包，使用恢复类战斗道具。" : "战斗背包关闭：战斗页隐藏背包入口。");
  const detailTitle = activeTab === "competition" ? "比赛类型" : title;
  const strong = activeTab === "systems" ? `启用系统：${systemNames}` : activeTab === "regions" ? "配置有效" : activeTab === "competition" ? competition.label : "会写入新游戏";
  return (
    <aside className="battle-preference-detail">
      <span>{detailTitle}</span>
      <strong>{strong}</strong>
      <p>{text}</p>
      <small>地区 {preference.allowedGenerations.length}/9 · 规则 {selectedRule.name} · 赛事 {competition.label} · 背包 {preference.battleBagEnabled ? "开" : "关"}</small>
    </aside>
  );
}
