import {useEffect, useState} from "react";
import type {RentalPokemon} from "@changebattle/shared";
import {ExchangePokemonCard} from "./ExchangePokemonCard";
import "./PokemonExchangePanel.css";

export type PokemonExchangeDisabledSlot = {
  index: number;
  reason: string;
};

export function PokemonExchangePanel({title, description, ownTeam, enemyTeam, enemyDisabledSlots = [], confirmLabel, confirmDisabled, emptyEnemyText = "没有可交换的对方宝可梦。", centerLabel = "交换", className = "", onClose, onConfirm}: {title: string; description: string; ownTeam: RentalPokemon[]; enemyTeam: RentalPokemon[]; enemyDisabledSlots?: PokemonExchangeDisabledSlot[]; confirmLabel: string; confirmDisabled?: boolean; emptyEnemyText?: string; centerLabel?: string; className?: string; onClose?: () => void; onConfirm: (ownIndex: number, enemyIndex: number) => void}) {
  const [ownIndex, setOwnIndex] = useState(0);
  const [enemyIndex, setEnemyIndex] = useState(0);
  const disabledMap = new Map(enemyDisabledSlots.map(slot => [slot.index, slot.reason]));
  const firstEnemyIndex = enemyTeam.findIndex((_pokemon, index) => !disabledMap.has(index));
  const selectedEnemyDisabled = disabledMap.has(enemyIndex);
  const canConfirm = ownTeam.length > 0 && enemyTeam.length > 0 && !selectedEnemyDisabled && !confirmDisabled;

  useEffect(() => {
    if (ownIndex >= ownTeam.length) setOwnIndex(0);
  }, [ownIndex, ownTeam.length]);

  useEffect(() => {
    if (!enemyTeam.length) {
      setEnemyIndex(0);
      return;
    }
    if (enemyIndex >= enemyTeam.length || disabledMap.has(enemyIndex)) {
      setEnemyIndex(firstEnemyIndex >= 0 ? firstEnemyIndex : 0);
    }
  }, [disabledMap, enemyIndex, enemyTeam.length, firstEnemyIndex]);

  return (
    <section className={`pokemon-exchange-panel ${className}`} role="dialog" aria-label={title}>
      <header className="pokemon-exchange-panel-header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {onClose ? <button type="button" onClick={onClose}>返回</button> : null}
      </header>
      <div className="pokemon-exchange-panel-body">
        <ExchangeTeamGrid title="我的队伍" team={ownTeam} selectedIndex={ownIndex} onSelect={setOwnIndex} />
        <div className="pokemon-exchange-center" aria-hidden="true">
          <span>{centerLabel}</span>
        </div>
        <ExchangeTeamGrid title="对方队伍" team={enemyTeam} selectedIndex={enemyIndex} disabledMap={disabledMap} emptyText={emptyEnemyText} onSelect={setEnemyIndex} />
      </div>
      <footer className="pokemon-exchange-panel-footer">
        <button type="button" disabled={!canConfirm} onClick={() => onConfirm(ownIndex, enemyIndex)}>
          {confirmLabel}
        </button>
      </footer>
    </section>
  );
}

function ExchangeTeamGrid({title, team, selectedIndex, disabledMap = new Map<number, string>(), emptyText, onSelect}: {title: string; team: RentalPokemon[]; selectedIndex: number; disabledMap?: Map<number, string>; emptyText?: string; onSelect: (index: number) => void}) {
  return (
    <section className="pokemon-exchange-team">
      <h3>{title}</h3>
      {team.length ? (
        <div className="pokemon-exchange-team-grid">
          {team.slice(0, 6).map((pokemon, index) => (
            <ExchangePokemonCard
              pokemon={pokemon}
              index={index}
              selected={selectedIndex === index}
              disabled={disabledMap.has(index)}
              disabledReason={disabledMap.get(index)}
              onSelect={() => onSelect(index)}
              key={`${title}-${pokemon.species_id}-${index}`}
            />
          ))}
        </div>
      ) : (
        <p className="pokemon-exchange-empty">{emptyText || "暂无队伍数据。"}</p>
      )}
    </section>
  );
}
