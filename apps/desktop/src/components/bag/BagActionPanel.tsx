import type {BagItemView, PricedMove, StatId} from "@changebattle/shared";
import {REST_SHOP_DISCOUNT_COUPONS} from "@changebattle/shared";
import {BagItemDetailPanel} from "./BagItemDetailPanel";
import {BagTargetPokemonList, type BagTargetPokemonEntry} from "./BagTargetPokemonList";
import {MoveReplacePanel} from "./MoveReplacePanel";
import {STAT_LABELS, type TrainingItemUi} from "./bagModel";
import type {PlayerPokemonState, RentalPokemon} from "@changebattle/shared";
import {MoveCard} from "../move/MoveCard";
import {runtimeMoveLabel} from "../../lib/ui";
import "./BagActionPanel.css";

export type BagActionStep = "detail" | "pokemonPicker" | "moveReplace" | "ppMovePicker";
export type BagDetailAction = {key: string; label: string; disabled?: boolean; disabledReason?: string; onUse: () => void};

export function BagActionPanel({step, item, targetTeam, targetTitle, selectedTarget, busyIndex, statOptions = [], selectedStat, trainingUi, lockedReason, descriptionVisible = true, detailDisabled, detailUseLabel, detailActions, targetPokemon, targetState, tmMoveLoading = false, displayMove, selectedMoveSlot, onUseDetail, onBackToDetail, onSelectTarget, onSelectStat, onSelectMoveSlot, onConfirmMoveReplace, onCancelMoveReplace, onConfirmPpMove}: {
  step: BagActionStep;
  item: BagItemView | null;
  targetTeam: BagTargetPokemonEntry[];
  targetTitle: string;
  selectedTarget: number;
  busyIndex?: number | null;
  statOptions?: StatId[];
  selectedStat?: StatId;
  trainingUi?: TrainingItemUi;
  lockedReason?: string;
  descriptionVisible?: boolean;
  detailDisabled?: boolean;
  detailUseLabel?: string;
  detailActions?: BagDetailAction[];
  targetPokemon?: RentalPokemon;
  targetState?: PlayerPokemonState;
  tmMoveLoading?: boolean;
  displayMove?: PricedMove;
  selectedMoveSlot: number | null;
  onUseDetail: () => void;
  onBackToDetail: () => void;
  onSelectTarget: (slot: number) => void;
  onSelectStat: (stat: StatId) => void;
  onSelectMoveSlot: (slot: number) => void;
  onConfirmMoveReplace: () => void;
  onCancelMoveReplace: () => void;
  onConfirmPpMove?: (slot: number) => void;
}) {
  if (!item) {
    return <section className="bag-action-panel empty"><p>选择一个道具查看详情。</p></section>;
  }

  const statPicker = trainingUi?.scope === "one" && !REST_SHOP_DISCOUNT_COUPONS[item.id] ? (
    <div className="bag-action-stat-picker" aria-label="选择能力项">
      <span>能力项</span>
      {statOptions.map(stat => (
        <button className={selectedStat === stat ? "selected" : ""} type="button" onClick={() => onSelectStat(stat)} key={stat}>
          {STAT_LABELS[stat]}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <section className={`bag-action-panel step-${step}`}>
      {step === "detail" ? (
        <>
          <BagItemDetailPanel item={item} descriptionVisible={descriptionVisible} actions={detailActions} disabled={detailDisabled} disabledReason={lockedReason} busy={busyIndex !== null} useLabel={detailUseLabel} onUse={onUseDetail} />
          {statPicker}
        </>
      ) : null}
      {step === "pokemonPicker" ? (
        <>
          <div className="bag-action-toolbar">
            <button type="button" onClick={onBackToDetail}>返回详情</button>
            <small>{targetTitle}</small>
          </div>
          {statPicker}
          <BagTargetPokemonList team={targetTeam} selectedIndex={selectedTarget} busyIndex={busyIndex} title={targetTitle} onSelect={onSelectTarget} />
        </>
      ) : null}
      {step === "moveReplace" && targetPokemon && displayMove ? (
        <>
          {tmMoveLoading ? <p className="bag-action-loading">读取技能资料中...</p> : null}
          <MoveReplacePanel pokemon={targetPokemon} state={targetState} newMove={displayMove} selectedMoveSlot={selectedMoveSlot} busy={busyIndex !== null} onSelectMoveSlot={onSelectMoveSlot} onConfirm={onConfirmMoveReplace} onCancel={onCancelMoveReplace} />
        </>
      ) : null}
      {step === "ppMovePicker" && targetPokemon ? (
        <>
          <div className="bag-action-toolbar">
            <button type="button" onClick={onBackToDetail}>返回目标</button>
            <small>选择要恢复 PP 的技能</small>
          </div>
          <div className="bag-pp-move-grid">
            {(targetPokemon.moves || []).map((move, index) => {
              const current = targetState?.moves?.[index];
              const moveSlot = typeof current?.slot === "number" ? current.slot : index + 1;
              const pp = current?.pp ?? move.pp;
              const maxPp = current?.maxpp ?? move.pp;
              const full = typeof pp === "number" && typeof maxPp === "number" && pp >= maxPp;
              return (
                <MoveCard
                  size="sheet"
                  className="bag-pp-move-card"
                  disabled={busyIndex !== null || full}
                  name={runtimeMoveLabel(targetPokemon, current, index)}
                  moveType={move.type || move.type_zh}
                  typeLabel={move.type_zh || move.type || "一般"}
                  category={move.category_zh || move.category || "变化"}
                  pp={pp ?? "--"}
                  maxPp={maxPp ?? "--"}
                  power={move.power || "--"}
                  accuracy={move.accuracy ?? "必中"}
                  onClick={() => onConfirmPpMove?.(moveSlot)}
                  key={`pp-restore-${move.id || move.name}-${index}`}
                />
              );
            })}
          </div>
        </>
      ) : null}
    </section>
  );
}
