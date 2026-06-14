import type {RentalPokemon, RestState} from "@changebattle/shared";
import type {RestActionHandler} from "./restActionTypes";
import {PokemonExchangePanel} from "./PokemonExchangePanel";
import "./RaidExchangePanel.css";

export function RaidExchangePanel({rest, onClose, onAction}: {rest: RestState; onClose: () => void; onAction: RestActionHandler}) {
  const battleNo = rest.event_services?.raid_exchange_battle_no || Number(rest.battle_no || 0) + 1;
  const row = rest.night_sky?.rows?.find(entry => Number(entry.battle_no) === Number(battleNo));
  const enemies = (row?.enemies || []).filter((entry): entry is RentalPokemon => Boolean(entry)).slice(0, 6);
  return (
    <PokemonExchangePanel
      title="骇人奇袭"
      description={`观测第 ${battleNo} 场完整队伍，并抢先交换 1 只宝可梦。`}
      ownTeam={rest.player_display}
      enemyTeam={enemies}
      confirmLabel="执行奇袭交换"
      confirmDisabled={!enemies.length}
      emptyEnemyText="没有可奇袭交换的敌方宝可梦。"
      centerLabel="奇袭"
      className="raid-exchange-panel"
      onClose={onClose}
      onConfirm={(ownIndex, enemyIndex) => onAction({type: "event_raid_exchange", ownIndex, enemyIndex}, "奇袭交换完成")}
    />
  );
}
