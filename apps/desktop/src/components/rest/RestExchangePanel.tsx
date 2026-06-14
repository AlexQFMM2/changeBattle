import type {RestState} from "@changebattle/shared";
import {coinCostLabel} from "../../lib/ui";
import type {RestActionHandler} from "./restActionTypes";
import {PokemonExchangePanel} from "./PokemonExchangePanel";
import "./RestExchangePanel.css";

export function RestExchangePanel({rest, onClose, onAction}: {rest: RestState; onClose: () => void; onAction: RestActionHandler}) {
  const disabledSlots = (rest.taken_enemy_slots || []).map(slot => ({index: Math.max(0, Number(slot) - 1), reason: "已交换"}));
  const canExchange = rest.costs.exchange !== null && rest.enemy_display.length > 0;
  const costLabel = coinCostLabel(rest.costs.exchange);
  return (
    <PokemonExchangePanel
      title="交换宝可梦"
      description={`本次费用：${costLabel}　已交换 ${rest.exchange_count || 0}/3`}
      ownTeam={rest.player_display}
      enemyTeam={rest.enemy_display}
      enemyDisabledSlots={disabledSlots}
      confirmLabel={`确认交换（${costLabel}）`}
      confirmDisabled={!canExchange}
      centerLabel="交换"
      className="rest-exchange-panel"
      onClose={onClose}
      onConfirm={(ownIndex, enemyIndex) => onAction({type: "exchange", ownIndex, enemyIndex})}
    />
  );
}
