import type {RestState} from "@changebattle/shared";
import {coinCostLabel} from "../../lib/ui";
import type {RestActionHandler} from "./restActionTypes";
import {PokemonExchangePanel} from "./PokemonExchangePanel";
import "./RestExchangePanel.css";

export function RestExchangePanel({rest, onClose, onAction}: {rest: RestState; onClose: () => void; onAction: RestActionHandler}) {
  const disabledSlots = (rest.taken_enemy_slots || []).map(slot => ({index: Math.max(0, Number(slot) - 1), reason: "已交换"}));
  const exchangeDisabled = rest.costs.exchange === null || rest.costs.exchange === undefined;
  const costLabel = exchangeDisabled ? "禁用" : coinCostLabel(rest.costs.exchange);
  const allEnemySlotsDisabled = rest.enemy_display.length > 0 && disabledSlots.length >= rest.enemy_display.length;
  const unavailableReason = exchangeDisabled
    ? "本次不可交换"
    : !rest.enemy_display.length
      ? "没有敌方队伍"
      : allEnemySlotsDisabled
        ? "敌方已交换完"
        : "";
  const canExchange = !exchangeDisabled && rest.enemy_display.length > 0 && !allEnemySlotsDisabled;
  return (
    <PokemonExchangePanel
      title="交换宝可梦"
      description={`本次费用：${costLabel}${unavailableReason ? `　${unavailableReason}` : ""}　已交换 ${rest.exchange_count || 0}/3`}
      ownTeam={rest.player_display}
      enemyTeam={rest.enemy_display}
      enemyDisabledSlots={disabledSlots}
      confirmLabel={canExchange ? `确认交换（${costLabel}）` : unavailableReason || "不可交换"}
      confirmDisabled={!canExchange}
      centerLabel="交换"
      className="rest-exchange-panel"
      onClose={onClose}
      onConfirm={(ownIndex, enemyIndex) => onAction({type: "exchange", ownIndex, enemyIndex})}
    />
  );
}
