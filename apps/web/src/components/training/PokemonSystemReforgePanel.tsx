import {useEffect, useMemo, useState, type CSSProperties} from "react";
import type {DexSystemBattleReforgeOption, LocalPokemonV4, PlayerItemInstanceV4} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import "./PokemonSystemReforgePanel.css";

export type PokemonSystemReforgePanelProps = {
  pokemon: LocalPokemonV4;
  item: PlayerItemInstanceV4;
  options: DexSystemBattleReforgeOption[];
  busy?: boolean;
  emptyReason?: string;
  onConfirm: (option: DexSystemBattleReforgeOption) => void;
  onCancel: () => void;
};

export function PokemonSystemReforgePanel({pokemon, item, options, busy = false, emptyReason, onConfirm, onCancel}: PokemonSystemReforgePanelProps) {
  const [selectedId, setSelectedId] = useState(options[0]?.id || "");
  const selected = useMemo(() => options.find(option => option.id === selectedId) || options[0] || null, [options, selectedId]);
  const canConfirm = Boolean(selected && !busy);

  useEffect(() => {
    if (!options.length) {
      if (selectedId) setSelectedId("");
      return;
    }
    if (!options.some(option => option.id === selectedId)) setSelectedId(options[0]!.id);
  }, [options, selectedId]);

  return (
    <section className="pokemon-system-reforge-panel" aria-label="系统道具重铸">
      <header className="pokemon-system-reforge-header">
        <div>
          <strong>{pokemon.nameZh || pokemon.name}</strong>
          <span>{item.name} 重铸配置</span>
        </div>
        <button type="button" onClick={onCancel} aria-label="关闭重铸">×</button>
      </header>
      <div className="pokemon-system-reforge-body">
        <article className="pokemon-system-reforge-summary">
          <small>当前选择</small>
          {selected ? <ReforgeOptionCard option={selected} selected /> : (
            <p>{emptyReason || "当前没有可用重铸选项。"}</p>
          )}
        </article>
        <div className="pokemon-system-reforge-options">
          {options.length ? options.map(option => (
            <button
              className={option.id === selected?.id ? "selected" : ""}
              type="button"
              onClick={() => setSelectedId(option.id)}
              key={option.id}
            >
              <ReforgeOptionCard option={option} />
            </button>
          )) : <p>{emptyReason || "当前没有可用重铸选项。"}</p>}
        </div>
      </div>
      <footer className="pokemon-system-reforge-footer">
        <span>{selected ? footerText(selected) : emptyReason || "没有可确认的重铸选项。"}</span>
        <button type="button" onClick={onCancel}>取消</button>
        <button type="button" disabled={!canConfirm} onClick={() => selected ? onConfirm(selected) : undefined}>{busy ? "重铸中" : "确认重铸"}</button>
      </footer>
    </section>
  );
}

function ReforgeOptionCard({option, selected = false}: {option: DexSystemBattleReforgeOption; selected?: boolean}) {
  const typeId = typeClassId(option.type || option.mappedTeraType || "");
  return (
    <span className={`pokemon-system-reforge-card ${selected ? "selected" : ""}`}>
      <span className={`pokemon-system-reforge-icon ${typeId ? `type-${typeId}` : ""}`}>
        {option.iconStyle ? <span className="pokemon-system-reforge-sprite" style={spriteStyleFromCss(option.iconStyle)} /> : option.iconUrl ? <ImageWithFallback src={option.iconUrl} alt="" fallback="◇" /> : <b>{option.typeZh || option.nameZh.slice(0, 1)}</b>}
      </span>
      <span className="pokemon-system-reforge-text">
        <strong>{option.nameZh || option.name}</strong>
        <small>{option.typeZh || option.mappedTeraTypeZh || option.requiredMoveNameZh || kindLabel(option.kind)}</small>
        {option.requiredMoveNameZh ? <em>需要：{option.requiredMoveNameZh}</em> : null}
      </span>
    </span>
  );
}

function footerText(option: DexSystemBattleReforgeOption): string {
  if (option.kind === "tera") return `将太晶珠调律为${option.mappedTeraTypeZh || option.mappedTeraType}。`;
  if (option.requiredMoveNameZh) return `将 Z 纯晶重铸为${option.nameZh}，对应${option.requiredMoveNameZh}。`;
  return `将系统道具重铸为${option.nameZh}。`;
}

function kindLabel(kind: DexSystemBattleReforgeOption["kind"]): string {
  if (kind === "mega") return "Mega 石";
  if (kind === "z-crystal") return "Z 纯晶";
  return "太晶属性";
}

function typeClassId(value: string): string {
  const raw = String(value || "").trim();
  const normalized = raw.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (normalized) return normalized;
  return TYPE_ID_BY_ZH[raw] || "";
}

const TYPE_ID_BY_ZH: Record<string, string> = {
  一般: "normal",
  普通: "normal",
  火: "fire",
  水: "water",
  电: "electric",
  草: "grass",
  冰: "ice",
  格斗: "fighting",
  毒: "poison",
  地面: "ground",
  飞行: "flying",
  超能力: "psychic",
  虫: "bug",
  岩石: "rock",
  幽灵: "ghost",
  龙: "dragon",
  恶: "dark",
  钢: "steel",
  妖精: "fairy",
};

function spriteStyleFromCss(css: string): CSSProperties {
  const match = /url\(([^)]+)\).*?(-?\d+)px\s+(-?\d+)px/.exec(css);
  if (!match) return {};
  return {
    backgroundImage: `url(${match[1]})`,
    backgroundPosition: `${match[2]}px ${match[3]}px`,
    backgroundRepeat: "no-repeat",
  };
}
