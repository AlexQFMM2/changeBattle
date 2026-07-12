// Battle V4 command construction is bottom-layer battle-page logic, alongside the
// Showdown timeline scheduler and command-order calculation utilities.
// It follows Pokemon Showdown Client's BattleChoiceBuilder flow:
// fix request -> build partial choice -> fill automatic passes -> stringify.
// When changing this hook, first compare with Showdown Client battle-choices.ts.
import {useCallback, useEffect, useState} from "react";
import type {AppDebugConfigV4, BattleCommandActionV4, BattleCommandDraftV4, BattleMoveRequestV4, BattleNormalizedRequestV4, BattleSpecialChoiceV4, BattleTrainerItemChoiceV4} from "@changebattle-v2/api";
import {addBattleCommandChoiceV4, appendBattleSpecialChoiceSuffixV4, battleDebugLog, createBattleCommandDraftV4, fillBattleCommandPassesV4, isBattleCommandDraftDoneV4, setBattleCommandCurrentMoveV4, showdownMoveNeedsExplicitTargetV4, splitBattleTrainerItemChoicesV4, stringifyBattleCommandDraftV4, undoBattleCommandChoiceV4, withBattleMoveTargetSuffixV4} from "@changebattle-v2/api";

export type BattleV4CommandBuilderMode = "command" | "moves";
export type BattleV4CommandBuilderMoveAction = Extract<BattleCommandActionV4, {kind: "move"}>;

export type BattleV4CommandBuilderFinalChoice = {
  input: string;
  choice: string;
  trainerItems: Array<BattleTrainerItemChoiceV4 & {activeIndex: number}>;
  draft: BattleCommandDraftV4;
};

export type BattleV4CommandBuilderIncompleteChoice = {
  reason: string;
  choice: string;
  trainerItems: Array<BattleTrainerItemChoiceV4 & {activeIndex: number}>;
  draftBefore: BattleCommandDraftV4;
  draftAfter: BattleCommandDraftV4;
  finalChoice: string;
};

export type BattleV4CommandBuilderMoveDraftInput = {
  selectedSpecial?: BattleSpecialChoiceV4 | null;
  commandSpecial?: BattleSpecialChoiceV4 | null;
  displayedMove: BattleMoveRequestV4;
};

export type UseBattleV4CommandBuilderOptions = {
  normalizedRequest: BattleNormalizedRequestV4 | null | undefined;
  requestResetKey: string;
  battleStatus?: "creating" | "running" | "ended" | "blocked" | null;
  debugConfig?: AppDebugConfigV4;
  onFinalChoice: (choice: BattleV4CommandBuilderFinalChoice) => void;
  onIncompleteChoice?: (choice: BattleV4CommandBuilderIncompleteChoice) => void;
  onCommandModeChange?: (mode: BattleV4CommandBuilderMode) => void;
  onSwitchPanelOpenChange?: (open: boolean) => void;
};

export function useBattleV4CommandBuilder(options: UseBattleV4CommandBuilderOptions) {
  const {normalizedRequest, requestResetKey, battleStatus, debugConfig, onFinalChoice, onIncompleteChoice, onCommandModeChange, onSwitchPanelOpenChange} = options;
  const [commandDraft, setCommandDraft] = useState<BattleCommandDraftV4 | null>(null);
  const [pendingMoveAction, setPendingMoveAction] = useState<BattleV4CommandBuilderMoveAction | null>(null);
  const [choiceStatus, setChoiceStatus] = useState("");

  useEffect(() => {
    const draft = normalizedRequest ? createBattleCommandDraftV4(normalizedRequest) : null;
    setCommandDraft(draft);
    setPendingMoveAction(null);
    setChoiceStatus("");
    onCommandModeChange?.("command");
    if (normalizedRequest?.requestType === "switch" && battleStatus === "running") {
      onSwitchPanelOpenChange?.(true);
      return;
    }
    if (battleStatus !== "running" || (normalizedRequest?.requestType !== "move" && normalizedRequest?.requestType !== "switch")) {
      onSwitchPanelOpenChange?.(false);
    }
  }, [battleStatus, requestResetKey]);

  const resetTransientChoice = useCallback(() => {
    setPendingMoveAction(null);
  }, []);

  const clearDraft = useCallback(() => {
    setCommandDraft(null);
    setPendingMoveAction(null);
  }, []);

  const applyChoice = useCallback((input: string) => {
    if (!normalizedRequest) return;
    const inputKind = input.trim().split(/\s+/)[0] || "";
    const before = fillBattleCommandPassesV4(commandDraft || createBattleCommandDraftV4(normalizedRequest), normalizedRequest);
    const after = addBattleCommandChoiceV4(before, normalizedRequest, input);
    const finalChoice = stringifyBattleCommandDraftV4(after);
    battleDebugLog(debugConfig, "draft", "add-choice", {
      before,
      input,
      after,
      isDone: isBattleCommandDraftDoneV4(after),
      finalChoice,
    });
    setPendingMoveAction(null);
    setCommandDraft(after);
    if (inputKind === "switch") onSwitchPanelOpenChange?.(false);
    if (isBattleCommandDraftDoneV4(after)) {
      onCommandModeChange?.("command");
      const split = splitBattleTrainerItemChoicesV4(after);
      onFinalChoice({input, choice: split.choice, trainerItems: split.trainerItems, draft: after});
      return;
    }
    if (before.currentMove && after.currentMove) {
      const split = splitBattleTrainerItemChoicesV4(after);
      onIncompleteChoice?.({
        reason: "draft-choice-incomplete-after-submit",
        choice: input,
        trainerItems: split.trainerItems,
        draftBefore: before,
        draftAfter: after,
        finalChoice,
      });
    }
    setChoiceStatus(`选择 ${after.choices.filter(Boolean).length}/${after.requestLength} 完成`);
    onCommandModeChange?.(after.requestType === "move" ? "moves" : "command");
    if (after.requestType === "switch") onSwitchPanelOpenChange?.(true);
  }, [commandDraft, debugConfig, normalizedRequest, onCommandModeChange, onFinalChoice, onIncompleteChoice, onSwitchPanelOpenChange]);

  const draftMoveAction = useCallback((action: BattleV4CommandBuilderMoveAction, input: BattleV4CommandBuilderMoveDraftInput) => {
    if (!normalizedRequest) return;
    const commandSpecial = input.commandSpecial || null;
    const choice = appendBattleSpecialChoiceSuffixV4(action.choice, commandSpecial);
    const draftedAction = {...action, choice};
    const targetable = battleV4CommandRequestTargetable(normalizedRequest);
    if (!showdownMoveNeedsExplicitTargetV4(input.displayedMove, targetable)) {
      applyChoice(choice);
      return;
    }
    const before = fillBattleCommandPassesV4(commandDraft || createBattleCommandDraftV4(normalizedRequest), normalizedRequest);
    const after = setBattleCommandCurrentMoveV4(before, normalizedRequest, action.moveIndex, true, commandSpecial);
    battleDebugLog(debugConfig, "draft", "current-move", {
      before,
      input: choice,
      after,
      requiresTarget: true,
      shouldOpenTargetPanel: true,
      selectedSpecial: input.selectedSpecial || null,
      commandSpecial,
    });
    setCommandDraft(after);
    setPendingMoveAction(draftedAction);
  }, [applyChoice, commandDraft, debugConfig, normalizedRequest]);

  const applyMoveTarget = useCallback((action: BattleV4CommandBuilderMoveAction, choiceSuffix: string, shouldUseTargetSuffix: boolean) => {
    const choice = shouldUseTargetSuffix && choiceSuffix ? withBattleMoveTargetSuffixV4(action.choice, choiceSuffix) : action.choice;
    applyChoice(choice);
  }, [applyChoice]);

  const undoChoice = useCallback(() => {
    if (!normalizedRequest || !commandDraft) return;
    const before = fillBattleCommandPassesV4(commandDraft, normalizedRequest);
    const after = undoBattleCommandChoiceV4(before, normalizedRequest);
    battleDebugLog(debugConfig, "draft", "undo-choice", {
      before,
      after,
    });
    setPendingMoveAction(null);
    onSwitchPanelOpenChange?.(false);
    onCommandModeChange?.("command");
    setCommandDraft(after);
    setChoiceStatus(`已返回：选择 ${after.choices.filter(Boolean).length}/${after.requestLength} 完成`);
  }, [commandDraft, debugConfig, normalizedRequest, onCommandModeChange, onSwitchPanelOpenChange]);

  const moveNeedsSubmittedTarget = useCallback((move: BattleMoveRequestV4) => {
    return normalizedRequest ? showdownMoveNeedsExplicitTargetV4(move, battleV4CommandRequestTargetable(normalizedRequest)) : false;
  }, [normalizedRequest]);

  return {
    commandDraft,
    pendingMoveAction,
    choiceStatus,
    setChoiceStatus,
    setPendingMoveAction,
    resetTransientChoice,
    clearDraft,
    applyChoice,
    draftMoveAction,
    applyMoveTarget,
    undoChoice,
    moveNeedsSubmittedTarget,
  };
}

function battleV4CommandRequestTargetable(request: BattleNormalizedRequestV4): boolean {
  return Boolean(request.rawRequest.targetable || request.activeRequests.length > 1);
}
