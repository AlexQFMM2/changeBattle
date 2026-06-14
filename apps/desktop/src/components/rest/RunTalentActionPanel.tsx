import {useState} from "react";
import type {RestState, TalentView} from "@changebattle/shared";
import {displayName} from "../../lib/ui";
import type {RestActionHandler} from "./restActionTypes";
import {RunTalentExchangePanel} from "./RunTalentExchangePanel";
import {RunTalentPokemonPicker, type RunTalentPokemonPickerEntry} from "./RunTalentPokemonPicker";
import "./RunTalentActionPanel.css";

export function RunTalentActionPanel({talent, rest, onAction}: {talent: TalentView; rest: RestState; onAction: RestActionHandler}) {
  const [selectedSlot, setSelectedSlot] = useState(0);
  const selectedPokemon = rest.player_display[selectedSlot];
  const entries = createPickerEntries(talent.id, rest);

  if (talent.id === "economy_bp_exchange") {
    return (
      <div className="run-talent-action-panel run-talent-action-panel-exchange">
        <RunTalentExchangePanel rest={rest} onAction={onAction} />
      </div>
    );
  }

  if (!isPokemonTalent(talent.id)) {
    return <p className="run-talent-action-empty">这个天赋不需要在休整页手动发动。</p>;
  }

  const used = runTalentActionUsed(rest, talent.id);
  const disabled = used || !selectedPokemon || isSelectedDisabled(talent.id, rest, selectedSlot);
  const actionLabel = actionButtonLabel(talent.id, rest, selectedPokemon ? displayName(selectedPokemon) : "");
  return (
    <div className="run-talent-action-panel">
      <RunTalentPokemonPicker entries={entries} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} />
      <div className="run-talent-action-summary">
        <span>{actionHint(talent.id)}</span>
        <button type="button" disabled={disabled} onClick={() => dispatchTalentAction(talent.id, selectedSlot, onAction)}>
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

function createPickerEntries(talentId: string, rest: RestState): RunTalentPokemonPickerEntry[] {
  const used = runTalentActionUsed(rest, talentId);
  return rest.player_display.map((pokemon, slot) => {
    const fainted = Boolean(rest.player_state[slot]?.fainted);
    const disabledReason = talentId === "growth_lead_change" && slot === 0 ? "当前首发" : talentId === "growth_lead_change" && fainted ? "濒死" : used ? "已使用" : "";
    return {
      pokemon,
      state: rest.player_state[slot],
      slot,
      used,
      disabled: used || Boolean(disabledReason),
      disabledReason,
    };
  });
}

function isPokemonTalent(id: string): boolean {
  return id === "growth_all_in" || id === "exchange_trust" || id === "growth_lead_change";
}

function isSelectedDisabled(id: string, rest: RestState, slot: number): boolean {
  if (id === "growth_lead_change") return slot === 0 || Boolean(rest.player_state[slot]?.fainted);
  return false;
}

function runTalentActionUsed(rest: RestState, id: string): boolean {
  if (id === "growth_all_in") return Boolean(rest.all_in_used || rest.all_in_pending_next);
  if (id === "exchange_trust") return Boolean(rest.trust_level_used);
  if (id === "growth_lead_change") return Boolean(rest.lead_change_used);
  return false;
}

function actionHint(id: string): string {
  if (id === "growth_all_in") return "选择 1 只宝可梦触发孤注一掷。";
  if (id === "exchange_trust") return "选择 1 只宝可梦提升信赖等级。";
  if (id === "growth_lead_change") return "选择非濒死队员调整为下一场首发。";
  return "";
}

function actionButtonLabel(id: string, rest: RestState, pokemonName: string): string {
  if (id === "growth_all_in") return rest.all_in_used || rest.all_in_pending_next ? "孤注一掷已用" : `孤注一掷：${pokemonName}`;
  if (id === "exchange_trust") return rest.trust_level_used ? "本次已培养" : "培养信赖";
  if (id === "growth_lead_change") return rest.lead_change_used ? "本次已调整" : "设为首发";
  return "发动";
}

function dispatchTalentAction(id: string, slot: number, onAction: RestActionHandler) {
  if (id === "growth_all_in") {
    onAction({type: "all_in_exchange", ownIndex: slot});
    return;
  }
  if (id === "exchange_trust") {
    onAction({type: "trust_level", slot});
    return;
  }
  if (id === "growth_lead_change") {
    onAction({type: "set_lead", slot});
  }
}
