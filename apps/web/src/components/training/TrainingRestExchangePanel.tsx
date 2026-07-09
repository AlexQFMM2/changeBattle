import {useEffect, useMemo, useState, type CSSProperties} from "react";
import type {FormalPokemonExchangeViewV4, LocalPokemonV4} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import {TrainingRestUiPanel} from "./TrainingRestUiPanel";
import {TrainingRestShopDialogue} from "./TrainingRestShopDialogue";
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
  const [localDialogueText, setLocalDialogueText] = useState("");
  const sourceTeam = view?.player?.localTeam.pokemon || [];
  const exchangeableSourceTeam = useMemo(() => sourceTeam.filter(pokemon => !isProtectedSoulmatePokemon(pokemon)), [sourceTeam]);
  const targetTeam = view?.opponent?.localTeam.pokemon || [];
  const selectedSource = exchangeableSourceTeam.find(pokemon => pokemon.localPokemonId === selectedSourceId) || null;
  const selectedTarget = targetTeam.find(pokemon => pokemon.localPokemonId === selectedTargetId) || null;
  useEffect(() => {
    if (!open) setLocalDialogueText("");
  }, [open]);
  const disabledReason = !view
    ? "交换功能正在整理中。"
    : !view.available
      ? view.message
      : !selectedSource
        ? exchangeableSourceTeam.length ? "请选择我方宝可梦。" : "队伍里还没有可以交换的宝可梦。"
        : !selectedTarget
          ? "请选择对手宝可梦。"
          : "";
  const canConfirm = open && !busy && !disabledReason;
  const confirmText = view?.nextCost ? `交换（${view.nextCost}金币）` : "交换（免费）";
  const dialogueText = localDialogueText || (disabledReason
    ? disabledReason
    : `${selectedSource ? pokemonName(selectedSource) : "我方宝可梦"} 与 ${selectedTarget ? pokemonName(selectedTarget) : "对手宝可梦"} 将进行交换。确认后会立即生效。`);
  function selectSourcePokemon(pokemonId: string) {
    const pokemon = sourceTeam.find(entry => entry.localPokemonId === pokemonId) || null;
    if (isProtectedSoulmatePokemon(pokemon)) {
      setLocalDialogueText("灵魂伴侣的宝可梦不支持交换。");
      return;
    }
    setLocalDialogueText("");
    onSelectSource(pokemonId);
  }
  function selectTargetPokemon(pokemonId: string) {
    setLocalDialogueText("");
    onSelectTarget(pokemonId);
  }
  return (
    <section className={`training-rest-exchange-panel ${open ? "open" : ""}`} aria-label="宝可梦交换面板" aria-hidden={!open}>
      <TrainingRestUiPanel
        className="training-rest-exchange-main-panel"
        contentClassName="training-rest-exchange-main-inner"
        width="var(--rest-exchange-main-w)"
        height="var(--rest-exchange-main-h)"
      >
        <div className="training-rest-exchange-columns">
          <ExchangeTeamColumn
            title="我的队伍"
            subtitle={view?.player?.name || "玩家"}
            pokemon={sourceTeam}
            selectedId={selectedSourceId}
            side="source"
            onSelect={selectSourcePokemon}
            emptyText="暂无可交换宝可梦"
          />
          <ExchangeTeamColumn
            title="上一场对手"
            subtitle={view?.opponent?.name || "对手"}
            pokemon={targetTeam}
            selectedId={selectedTargetId}
            side="target"
            onSelect={selectTargetPokemon}
            emptyText="还没有可交换的上一场对手"
          />
        </div>
      </TrainingRestUiPanel>
      <TrainingRestShopDialogue
        speaker="交换员"
        itemName="队伍交换"
        text={dialogueText}
        actions={[
          {label: "关闭", onClick: onClose},
          {label: busy ? "交换中" : "确认交换", meta: confirmText.replace(/^交换（|）$/g, ""), primary: true, disabled: !canConfirm, onClick: onConfirm},
        ]}
      />
    </section>
  );
}

function ExchangeTeamColumn({
  title,
  subtitle,
  pokemon,
  selectedId,
  side,
  onSelect,
  emptyText,
}: {
  title: string;
  subtitle: string;
  pokemon: LocalPokemonV4[];
  selectedId: string;
  side: "source" | "target";
  onSelect: (pokemonId: string) => void;
  emptyText: string;
}) {
  return (
    <section className={`training-rest-exchange-column ${side}`}>
      <header>
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </header>
      <PokemonExchangeList pokemon={pokemon} selectedId={selectedId} side={side} onSelect={onSelect} emptyText={emptyText} />
    </section>
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
        const isSoulmate = side === "source" && isProtectedSoulmatePokemon(entry);
        return (
        <button
          className={`${selectedId === entry.localPokemonId ? "selected" : ""} ${entry.entryHp <= 0 ? "fainted" : ""}`}
          data-disabled={isSoulmate ? "true" : "false"}
          type="button"
          title={isSoulmate ? "灵魂伴侣的宝可梦不支持交换。" : undefined}
          aria-disabled={isSoulmate}
          onClick={() => onSelect(entry.localPokemonId)}
          key={`${side}-${entry.localPokemonId}`}
          style={{"--rest-exchange-hp-rate": hpRate} as CSSProperties}
        >
          <span className="training-rest-exchange-index">{index + 1}</span>
          <PokemonIcon pokemon={entry} />
          <strong>{pokemonName(entry)}</strong>
          <small>{isSoulmate ? "不可交换" : `Lv.${entry.level} · ${Math.max(0, entry.entryHp)}/${Math.max(1, entry.maxHp)}`}</small>
          <i aria-hidden="true" />
        </button>
      );
      })}
    </div>
  );
}

function PokemonIcon({pokemon}: {pokemon: LocalPokemonV4}) {
  if (pokemon.iconStyle) {
    return <span className="training-rest-exchange-picon picon" aria-hidden="true" style={styleFromCss(pokemon.iconStyle)} />;
  }
  return <ImageWithFallback src={pokemon.iconUrl || pokemon.spriteUrl || ""} alt="" fallback={pokemonName(pokemon).slice(0, 1) || "?"} />;
}

function pokemonName(pokemon: LocalPokemonV4): string {
  return pokemon.nickname || pokemon.nameZh || pokemon.name || pokemon.speciesId;
}

function isProtectedSoulmatePokemon(pokemon: Pick<LocalPokemonV4, "formalSourceKind" | "originKind"> | null | undefined): boolean {
  return pokemon?.formalSourceKind === "soulmate-vault" || pokemon?.originKind === "soulmate";
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
