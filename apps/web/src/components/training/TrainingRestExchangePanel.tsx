import type {CSSProperties, ReactNode} from "react";
import type {FormalPokemonExchangeViewV4, LocalPokemonV4} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import {TrainingRestUiPanel} from "./TrainingRestUiPanel";
import {styleUrlAssetPath} from "../../lib/assetUrl";
import "./TrainingRestExchangePanel.css";

export type TrainingRestExchangePanelProps = {
  open: boolean;
  view: FormalPokemonExchangeViewV4 | null;
  selectedSourceId: string;
  selectedTargetId: string;
  busy?: boolean;
  onSelectSource: (pokemonId: string) => void;
  onSelectTarget: (pokemonId: string) => void;
  onConfirm: () => void;
  onClose: () => void;
};

export function TrainingRestExchangePanel({
  open,
  view,
  selectedSourceId,
  selectedTargetId,
  busy = false,
  onSelectSource,
  onSelectTarget,
  onConfirm,
  onClose,
}: TrainingRestExchangePanelProps) {
  const sourceTeam = view?.player?.localTeam.pokemon || [];
  const targetTeam = view?.opponent?.localTeam.pokemon || [];
  const selectedSource = sourceTeam.find(pokemon => pokemon.localPokemonId === selectedSourceId) || null;
  const selectedTarget = targetTeam.find(pokemon => pokemon.localPokemonId === selectedTargetId) || null;
  const disabledReason = !view
    ? "交换功能正在整理中。"
    : !view.available
      ? view.message
      : !selectedSource
        ? "请选择我方宝可梦。"
        : !selectedTarget
          ? "请选择对手宝可梦。"
          : "";
  const canConfirm = open && !busy && !disabledReason;
  const confirmText = view?.nextCost ? `交换（${view.nextCost}金币）` : "交换（免费）";
  return (
    <section className={`training-rest-exchange-panel ${open ? "open" : ""}`} aria-label="宝可梦交换面板" aria-hidden={!open}>
      <ExchangeHangingCard
        side="source"
        title="我的队伍"
        subtitle={view?.player?.name || "P1"}
      >
        <PokemonExchangeList pokemon={sourceTeam} selectedId={selectedSourceId} side="source" onSelect={onSelectSource} emptyText="暂无可交换宝可梦" />
      </ExchangeHangingCard>
      <ExchangeHangingCard
        side="target"
        title="上一场对手"
        subtitle={view?.opponent?.name || view?.message || "暂无记录"}
      >
        <PokemonExchangeList pokemon={targetTeam} selectedId={selectedTargetId} side="target" onSelect={onSelectTarget} emptyText="还没有可交换的上一场对手" />
      </ExchangeHangingCard>
      <footer className="training-rest-exchange-footer">
        <div className="training-rest-exchange-pair">
          <PokemonMiniSummary pokemon={selectedSource} fallback="我方" />
          <button className="training-rest-exchange-swap-button" type="button" disabled={!selectedSource || !selectedTarget} aria-label="交换选择">
            ⇄
          </button>
          <PokemonMiniSummary pokemon={selectedTarget} fallback="对手" />
        </div>
        <div className="training-rest-exchange-actions">
          <button type="button" onClick={onClose}>关闭</button>
          <button type="button" disabled={!canConfirm} onClick={onConfirm}>{busy ? "交换中" : confirmText}</button>
        </div>
      </footer>
    </section>
  );
}

function ExchangeHangingCard({
  side,
  title,
  subtitle,
  children,
}: {
  side: "source" | "target";
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className={`training-rest-exchange-hanging-card ${side}`}>
      <span className="training-rest-exchange-hanger hanger-left" aria-hidden="true" />
      <span className="training-rest-exchange-hanger hanger-right" aria-hidden="true" />
      <TrainingRestUiPanel
        className="training-rest-exchange-card-frame"
        contentClassName="training-rest-exchange-card-inner"
        width="100%"
        height="var(--rest-exchange-card-frame-h)"
      >
        <header>
          <strong>{title}</strong>
          <small>{subtitle}</small>
        </header>
        {children}
      </TrainingRestUiPanel>
    </div>
  );
}

function PokemonExchangeList({
  pokemon,
  selectedId,
  side,
  onSelect,
  emptyText,
}: {
  pokemon: LocalPokemonV4[];
  selectedId: string;
  side: "source" | "target";
  onSelect: (pokemonId: string) => void;
  emptyText: string;
}) {
  if (!pokemon.length) return <div className="training-rest-exchange-empty">{emptyText}</div>;
  return (
    <div className="training-rest-exchange-list">
      {pokemon.slice(0, 6).map((entry, index) => {
        const hpRate = `${Math.max(0, Math.min(100, Math.round((Math.max(0, entry.entryHp) / Math.max(1, entry.maxHp)) * 100)))}%`;
        return (
        <button
          className={`${selectedId === entry.localPokemonId ? "selected" : ""} ${entry.entryHp <= 0 ? "fainted" : ""}`}
          type="button"
          onClick={() => onSelect(entry.localPokemonId)}
          key={`${side}-${entry.localPokemonId}`}
          style={{"--rest-exchange-hp-rate": hpRate} as CSSProperties}
        >
          <span className="training-rest-exchange-index">{index + 1}</span>
          <PokemonIcon pokemon={entry} />
          <strong>{entry.nameZh || entry.name}</strong>
          <small>Lv.{entry.level} · {Math.max(0, entry.entryHp)}/{Math.max(1, entry.maxHp)}</small>
          <i aria-hidden="true" />
        </button>
      );
      })}
    </div>
  );
}

function PokemonMiniSummary({pokemon, fallback}: {pokemon: LocalPokemonV4 | null; fallback: string}) {
  const hpRate = pokemon
    ? `${Math.max(0, Math.min(100, Math.round((Math.max(0, pokemon.entryHp) / Math.max(1, pokemon.maxHp)) * 100)))}%`
    : "0%";
  return (
    <span className={`training-rest-exchange-mini ${pokemon ? "" : "empty"}`} style={{"--rest-exchange-hp-rate": hpRate} as CSSProperties}>
      {pokemon ? <PokemonIcon pokemon={pokemon} /> : null}
      <strong>{pokemon ? pokemon.nameZh || pokemon.name : fallback}</strong>
      {pokemon ? <small>Lv.{pokemon.level}</small> : null}
      {pokemon ? <i aria-hidden="true" /> : null}
    </span>
  );
}

function PokemonIcon({pokemon}: {pokemon: LocalPokemonV4}) {
  if (pokemon.iconStyle) {
    return <span className="training-rest-exchange-picon picon" aria-hidden="true" style={styleFromCss(pokemon.iconStyle)} />;
  }
  return <ImageWithFallback src={pokemon.iconUrl || pokemon.spriteUrl || ""} alt="" fallback={(pokemon.nameZh || pokemon.name).slice(0, 1) || "?"} />;
}

function styleFromCss(css: string): CSSProperties {
  const match = /url\(([^)]+)\).*?(-?\d+)px\s+(-?\d+)px/.exec(css);
  if (!match) return {};
  return {
    backgroundImage: `url("${styleUrlAssetPath(match[1])}")`,
    backgroundPosition: `${match[2]}px ${match[3]}px`,
    backgroundRepeat: "no-repeat",
  };
}
