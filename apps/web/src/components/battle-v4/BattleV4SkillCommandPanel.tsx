import {useState} from "react";
import type {BattleCommandActionV4, BattleSpecialChoiceOptionV4, BattleSpecialChoiceV4, BattleSpecialSystemV4, BattleMoveRequestV4, DexMoveDetail} from "@changebattle-v2/api";
import {battleSpecialSystemAllowedForRuleSetV4} from "@changebattle-v2/api";
import "./BattleV4SkillCommandPanel.css";

type MoveActionV4 = Extract<BattleCommandActionV4, {kind: "move"}>;

export type BattleV4SkillCommandMoveCardView = {
  action: MoveActionV4;
  detail: DexMoveDetail | null;
  baseMove: BattleMoveRequestV4;
  displayedMove: BattleMoveRequestV4;
  selectedSpecial: BattleSpecialChoiceV4 | null;
  id: string;
  name: string;
  typeId: string;
  typeLabel: string;
  categoryLabel: string;
  powerLabel: string;
  accuracyLabel: string;
  ppLabel: string;
  effectivenessLabel: string;
  effectivenessTone: "none" | "bad" | "weak" | "normal" | "good" | "great";
};

export type BattleV4SkillCommandPanelProps = {
  commandStatus: string;
  message: string;
  busy: boolean;
  moveCards: BattleV4SkillCommandMoveCardView[];
  previewCard: BattleV4SkillCommandMoveCardView | undefined;
  specialOptions: BattleSpecialChoiceOptionV4[];
  selectedSpecial: BattleSpecialChoiceV4 | null;
  lockedSystems: Set<BattleSpecialSystemV4>;
  mode?: string;
  ruleSet?: string;
  onBack: () => void;
  onPreviewMove: (move: DexMoveDetail) => void;
  onMoveDraft: (action: MoveActionV4, selectedSpecial?: BattleSpecialChoiceV4 | null) => void;
  onPreviewMoveIdChange: (id: string) => void;
  onChooseSpecial: (special: BattleSpecialChoiceV4 | null) => void;
  onUnavailableSpecial: (message: string) => void;
  isDisabledAction: (action: BattleCommandActionV4) => boolean;
  isSpecialDisplayedMoveDisabled: (card: BattleV4SkillCommandMoveCardView) => boolean;
};

const SPECIAL_SYSTEM_BUTTONS: Array<{system: BattleSpecialSystemV4; label: string; icon: string; choices: BattleSpecialChoiceV4[]}> = [
  {system: "mega", label: "mega", icon: "/specIcon/mega2.png", choices: ["mega", "megax", "megay", "ultra"]},
  {system: "zmove", label: "Z招式", icon: "/specIcon/Z2.png", choices: ["zmove"]},
  {system: "max", label: "极巨化", icon: "/specIcon/jjh2.png", choices: ["max"]},
  {system: "terastallize", label: "太晶化", icon: "/specIcon/tjh2.png", choices: ["terastallize"]},
];

export function uniqueSpecialOptionsForActions(actions: MoveActionV4[]): BattleSpecialChoiceOptionV4[] {
  const byId = new Map<string, BattleSpecialChoiceOptionV4>();
  const options: BattleSpecialChoiceOptionV4[] = [];
  for (const action of actions) {
    for (const option of action.specialOptions) {
      const existing = byId.get(option.id);
      if (existing && (!option.ruleAllowed || option.disabled || (existing.ruleAllowed && !existing.disabled))) continue;
      byId.set(option.id, option);
    }
  }
  for (const button of SPECIAL_SYSTEM_BUTTONS) {
    for (const choice of button.choices) {
      const option = byId.get(choice);
      if (option) options.push(option);
    }
  }
  return options;
}

export function BattleV4SkillCommandPanel({
  commandStatus,
  message,
  busy,
  moveCards,
  previewCard,
  specialOptions,
  selectedSpecial,
  lockedSystems,
  mode,
  ruleSet,
  onBack,
  onPreviewMove,
  onMoveDraft,
  onPreviewMoveIdChange,
  onChooseSpecial,
  onUnavailableSpecial,
  isDisabledAction,
  isSpecialDisplayedMoveDisabled,
}: BattleV4SkillCommandPanelProps) {
  return (
    <section className="skill-commnd-dock" aria-label="技能指令">
      <div className="skill-commnd-header">
        <span className="skill-commnd-progress">{commandStatus}</span>
      </div>
      <button className="skill-commnd-back" type="button" onClick={onBack}>返回</button>
      <button className="skill-commnd-preview" type="button" disabled={!previewCard?.detail} onClick={() => {
        if (previewCard?.detail) onPreviewMove(previewCard.detail);
      }}>动画预览</button>
      <div className="skill-commnd-list">
        {moveCards.length ? moveCards.map(card => (
          <div className={`skill-commnd-card-wrap ${card.action.specialOptions.length ? "has-specials" : ""}`} key={`${card.action.choice}-${card.id}`}>
            <button
              className={`skill-commnd-card skill-commnd-type-${card.typeId} skill-commnd-effect-${card.effectivenessTone} ${card.selectedSpecial ? "special-ready" : ""}`}
              type="button"
              disabled={busy || isDisabledAction(card.action) || isSpecialDisplayedMoveDisabled(card)}
              onMouseEnter={() => onPreviewMoveIdChange(card.id)}
              onFocus={() => onPreviewMoveIdChange(card.id)}
              onClick={() => onMoveDraft(card.action, card.selectedSpecial)}
            >
              <span className="skill-commnd-type">{card.typeLabel}</span>
              <span className="skill-commnd-body">
                <strong>{card.name}</strong>
                <span className="skill-commnd-meta">
                  <i>{card.categoryLabel}</i>
                  <i>威力 {card.powerLabel}</i>
                  <i>命中 {card.accuracyLabel}</i>
                </span>
              </span>
              <span className="skill-commnd-pp">{card.ppLabel}</span>
              <span className="skill-commnd-effect">{card.effectivenessLabel}</span>
            </button>
          </div>
        )) : <p>{message || "等待 Showdown request..."}</p>}
      </div>
      <BattleV4SkillSpecialChoiceBar
        options={specialOptions}
        selected={selectedSpecial}
        busy={busy}
        lockedSystems={lockedSystems}
        mode={mode}
        ruleSet={ruleSet}
        onChoose={onChooseSpecial}
        onUnavailable={onUnavailableSpecial}
      />
    </section>
  );
}

function BattleV4SkillSpecialChoiceBar({options, selected, busy, lockedSystems, mode, ruleSet, onChoose, onUnavailable}: {
  options: BattleSpecialChoiceOptionV4[];
  selected: BattleSpecialChoiceV4 | null;
  busy: boolean;
  lockedSystems: Set<BattleSpecialSystemV4>;
  mode?: string;
  ruleSet?: string;
  onChoose: (special: BattleSpecialChoiceV4 | null) => void;
  onUnavailable: (message: string) => void;
}) {
  const [notice, setNotice] = useState("");
  const [expanded, setExpanded] = useState(false);
  const buttons = SPECIAL_SYSTEM_BUTTONS.map(button => {
    const systemOptions = options.filter(option => button.choices.includes(option.id));
    const ruleAllowed = battleSpecialSystemAllowedForRuleSetV4(button.system, ruleSet, mode);
    const available = systemOptions.find(option => option.ruleAllowed && !option.disabled);
    const locked = lockedSystems.has(button.system);
    const representative = available || systemOptions[0] || null;
    return {...button, ruleAllowed, available, representative, locked};
  });
  const selectedButton = buttons.find(button => selected && button.choices.includes(selected));
  const hasAvailable = buttons.some(button => button.available);
  return (
    <div className={`skill-commnd-special-panel ${expanded ? "expanded" : ""}`} aria-label="特殊系统">
      <button
        className={`skill-commnd-special-main ${selectedButton ? "selected" : ""} ${hasAvailable ? "available" : ""}`}
        type="button"
        disabled={busy}
        title={expanded ? "收起特殊系统" : "展开特殊系统"}
        aria-label={expanded ? "收起特殊系统" : "展开特殊系统"}
        aria-expanded={expanded}
        onClick={() => setExpanded(value => !value)}
      >
        {selectedButton ? <img src={selectedButton.icon} alt="" /> : <span>特</span>}
      </button>
      <div className="skill-commnd-special-bar">
        {buttons.map(button => {
          const active = Boolean(selected && button.choices.includes(selected));
          const reason = unavailableSpecialReason(button.system, button.ruleAllowed, button.available || null, button.representative, button.locked);
          const detail = specialSystemDetailLabel(button.label, button.available || button.representative || null);
          const title = active ? `关闭${button.label}` : reason || `启用${detail}`;
          return (
            <button
              className={`skill-commnd-special-button skill-commnd-special-${button.system} ${button.ruleAllowed ? "rule-on" : "rule-off"} ${button.available ? "available" : "unavailable"} ${button.locked ? "locked" : ""} ${active ? "selected" : ""}`}
              type="button"
              disabled={busy}
              title={title}
              aria-label={title}
              key={button.system}
              onClick={() => {
                const nextNotice = active ? `已取消${button.label}` : reason || `已选择${detail}`;
                if (active) {
                  onChoose(null);
                  setNotice(nextNotice);
                  onUnavailable(nextNotice);
                  setExpanded(false);
                  return;
                }
                if (reason) {
                  setNotice(reason);
                  onUnavailable(reason);
                  return;
                }
                onChoose(button.available?.id || null);
                setNotice(nextNotice);
                onUnavailable(nextNotice);
                setExpanded(false);
              }}
            >
              <img src={button.icon} alt="" />
              <span>{button.label}</span>
            </button>
          );
        })}
      </div>
      <p className={`skill-commnd-special-notice ${notice ? "show" : ""}`}>{notice || "按 Showdown 请求显示可用特殊系统"}</p>
    </div>
  );
}

function unavailableSpecialReason(system: BattleSpecialSystemV4, ruleAllowed: boolean, option: BattleSpecialChoiceOptionV4 | null, representative: BattleSpecialChoiceOptionV4 | null, locked: boolean): string {
  const name = system === "mega" ? "Mega/究极爆发" :
    system === "zmove" ? "Z招式" :
    system === "max" ? "极巨化" :
    "太晶化";
  if (!ruleAllowed) return `${name}当前规则不可用`;
  if (locked) return `${name}本回合已选择，不能让第二只同时使用`;
  if (!representative) return `${name}没有出现在本次 Showdown request 中`;
  if (!option) return `${name}当前不可用：${representative.moveName || representative.label || "对应招式"}被禁用或已不可选`;
  return "";
}

function specialSystemDetailLabel(label: string, option: BattleSpecialChoiceOptionV4 | null): string {
  if (!option) return label;
  const detail = [option.label, option.moveName, option.typeLabel].filter(Boolean).join(" · ");
  return detail || label;
}
