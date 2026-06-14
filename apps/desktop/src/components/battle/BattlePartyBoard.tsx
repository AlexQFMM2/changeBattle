import type {BattleState, RentalPokemon} from "@changebattle/shared";
import type {CSSProperties} from "react";
import type {PartyStatusSlot} from "../../lib/ui";
import {statusCode} from "../../lib/ui";
import {BattleSmallImage} from "./BattleSmallImage";
import "./BattlePartyBoard.css";

export function BattlePartyBoard({battle, playerSlots, enemySlots, onOpenStatus, onOpenEnemyDex}: {battle: BattleState; playerSlots: PartyStatusSlot[]; enemySlots: PartyStatusSlot[]; onOpenStatus: () => void; onOpenEnemyDex?: (pokemon: RentalPokemon) => void}) {
  const weather = battle.tracker.weather && battle.tracker.weather !== "无" ? battle.tracker.weather : "无";
  const field = battle.tracker.field.join(" / ") || "无";
  const enemyLeft = enemySlots.filter(slot => !statusCode(slot.condition, slot.status).includes("fnt")).length;
  const enemyTotal = Math.max(1, enemySlots.length);
  return (
    <div className="battle-party-board">
      <PartyStatusColumn side="player" title="我方" slots={playerSlots} />
      <button className="battle-center-status" onClick={onOpenStatus}>
        <strong>第 {battle.tracker.turn} 回合</strong>
        <span>天气 {weather}</span>
        <span>场地 {field}</span>
        <span>我方能力 {boostSummary(battle.tracker.boosts.p1)}</span>
        <span>对手能力 {boostSummary(battle.tracker.boosts.p2)}</span>
        <small>对手剩余 {enemyLeft}/{enemyTotal}</small>
      </button>
      <PartyStatusColumn side="enemy" title="对手" slots={enemySlots} onOpenEnemyDex={onOpenEnemyDex} />
    </div>
  );
}

function PartyStatusColumn({side, title, slots, onOpenEnemyDex}: {side: "player" | "enemy"; title: string; slots: PartyStatusSlot[]; onOpenEnemyDex?: (pokemon: RentalPokemon) => void}) {
  return (
    <div className={`party-status-column ${side}`}>
      <strong>{title}</strong>
      <div className="party-status-slots" style={{"--party-slot-count": Math.max(1, slots.length)} as CSSProperties}>
        {slots.map(slot => {
          const enemyDexClick = side === "enemy" && onOpenEnemyDex && slot.revealed && slot.display ? () => onOpenEnemyDex(slot.display!) : undefined;
          return <BattleSmallImage slot={slot} side={side} onClick={enemyDexClick || slot.onClick} key={slot.key} />;
        })}
      </div>
    </div>
  );
}

function boostSummary(boosts: Record<string, number>): string {
  const labels: Record<string, string> = {atk: "攻击", def: "防御", spa: "特攻", spd: "特防", spe: "速度", accuracy: "命中", evasion: "闪避"};
  const rows = Object.entries(boosts).filter(([, value]) => value !== 0);
  if (!rows.length) return "无";
  return rows.map(([stat, value]) => `${labels[stat] || stat}${value > 0 ? "+" : ""}${value}`).join(" / ");
}
