import type {BagItemView, PricedMove, StatId} from "@changebattle/shared";
import {REST_SHOP_DISCOUNT_COUPONS} from "@changebattle/shared";
import {BagItemDetailPanel} from "./BagItemDetailPanel";
import {BagTargetPokemonList, type BagTargetPokemonEntry} from "./BagTargetPokemonList";
import {MoveReplacePanel} from "./MoveReplacePanel";
import {STAT_LABELS, type TrainingItemUi} from "./bagModel";
import type {PlayerPokemonState, RentalPokemon} from "@changebattle/shared";
import "./BagActionPanel.css";

export type BagActionStep = "detail" | "pokemonPicker" | "moveReplace";

export function BagActionPanel({step, item, targetTeam, targetTitle, selectedTarget, busyIndex, statOptions = [], selectedStat, trainingUi, lockedReason, detailDisabled, detailUseLabel, targetPokemon, targetState, tmMoveLoading = false, displayMove, selectedMoveSlot, onUseDetail, onBackToDetail, onSelectTarget, onSelectStat, onSelectMoveSlot, onConfirmMoveReplace, onCancelMoveReplace}: {
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
  detailDisabled?: boolean;
  detailUseLabel?: string;
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
          <BagItemDetailPanel item={item} disabled={detailDisabled} disabledReason={lockedReason} busy={busyIndex !== null} useLabel={detailUseLabel} onUse={onUseDetail} />
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
    </section>
  );
}
