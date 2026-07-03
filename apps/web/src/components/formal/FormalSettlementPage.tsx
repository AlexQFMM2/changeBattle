import {useMemo, useState, type CSSProperties} from "react";
import type {FormalGameRunV4, FormalSettlementPokemonStatsV4, UserProfileV2} from "@changebattle-v2/api";
import {assetUrl, styleUrlAssetPath} from "../../lib/assetUrl";
import {pokemonSpriteUrl} from "../../lib/showdownPokemonSpriteAdapter";
import "./PokemonSprite.css";
import "./FormalSettlementPage.css";

export function FormalSettlementPage({run, profile, onBackToMain}: {
  run: FormalGameRunV4;
  profile: UserProfileV2;
  onBackToMain: () => void;
}) {
  const settlement = run.settlement;
  const stats = useMemo(() => (settlement?.pokemonStats || []).filter(hasBattleActivity), [settlement?.pokemonStats]);
  const defaultKey = settlement?.mvpPokemonKey && stats.some(entry => entry.pokemonKey === settlement.mvpPokemonKey)
    ? settlement.mvpPokemonKey
    : stats[0]?.pokemonKey || "";
  const [selectedKey, setSelectedKey] = useState(defaultKey);
  const selected = useMemo(() => stats.find(entry => entry.pokemonKey === selectedKey) || stats[0] || null, [selectedKey, stats]);

  if (!settlement) {
    return (
      <main className="formal-settlement-page">
        <section className="formal-settlement-empty">
          <h1>暂无结算数据</h1>
          <button type="button" onClick={onBackToMain}>返回主页</button>
        </section>
      </main>
    );
  }

  return (
    <main className="formal-settlement-page">
      <section className="formal-settlement-header">
        <div>
          <span>{outcomeLabel(settlement.outcome)}</span>
          <strong>{profile.name}</strong>
        </div>
        <dl>
          <div><dt>获得 BP</dt><dd>{settlement.bpGained}</dd></div>
          <div><dt>胜场</dt><dd>{settlement.wonRounds}/7</dd></div>
          <div><dt>金币</dt><dd>{settlement.coinSummary.net >= 0 ? "+" : ""}{settlement.coinSummary.net}</dd></div>
        </dl>
        <button type="button" onClick={onBackToMain}>返回主页</button>
      </section>

      {selected ? (
        <section className={`formal-settlement-card ${selected.isMvp ? "is-mvp" : ""}`}>
          {selected.isMvp ? <div className="formal-settlement-rays" aria-hidden="true" /> : null}
          <div className="formal-settlement-pokemon">
            <img src={settlementPokemonSprite(selected)} alt={selected.nameZh || selected.name} onError={() => {
              console.error("[FormalSettlementPage] pokemon sprite failed", {speciesId: selected.speciesId, src: settlementPokemonSprite(selected)});
            }} />
            <strong>{selected.nameZh || selected.name}</strong>
            <span>{selected.isMvp ? "本局 MVP" : "队伍成员"}</span>
          </div>
          <div className="formal-settlement-stats">
            <Metric label="KDA" value={`${selected.kills}/${selected.deaths}/${selected.assists}`} />
            <Metric label="输出" value={selected.damageDealt} />
            <Metric label="承伤" value={selected.damageTaken} />
            <Metric label="治疗" value={selected.healing} />
            <Metric label="评分" value={Math.round(selected.mvpScore)} />
            <Metric label="出场" value={`${selected.usedRounds.length || 0} 场`} />
          </div>
        </section>
      ) : null}

      <section className="formal-settlement-roster" aria-label="本局使用过的宝可梦">
        {stats.map(entry => (
          <button
            type="button"
            className={`${entry.pokemonKey === selected?.pokemonKey ? "active" : ""} ${entry.isMvp ? "mvp" : ""}`}
            onClick={() => setSelectedKey(entry.pokemonKey)}
            key={entry.pokemonKey}
          >
            <SettlementPokemonIcon entry={entry} />
            {entry.isMvp ? <b><img src={assetUrl("aboutIcon/mvp-crown.png")} alt="" /></b> : null}
          </button>
        ))}
      </section>
    </main>
  );
}

function Metric({label, value}: {label: string; value: string | number}) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function outcomeLabel(outcome: string): string {
  if (outcome === "win") return "挑战完成";
  if (outcome === "abandoned") return "中途放弃";
  return "挑战结束";
}

function hasBattleActivity(entry: FormalSettlementPokemonStatsV4): boolean {
  return entry.kills > 0
    || entry.deaths > 0
    || entry.assists > 0
    || entry.damageDealt > 0
    || entry.damageTaken > 0
    || entry.healing > 0
    || entry.usedRounds.length > 0;
}

function SettlementPokemonIcon({entry}: {entry: FormalSettlementPokemonStatsV4}) {
  const alt = entry.nameZh || entry.name;
  if (entry.iconStyle) {
    return <span className="formal-settlement-roster-icon picon" aria-label={alt} style={styleFromCss(entry.iconStyle)} />;
  }
  const src = entry.iconUrl || settlementPokemonSprite(entry);
  if (src) return <span className="formal-settlement-roster-icon"><img src={src} alt={alt} /></span>;
  return <span className="formal-settlement-roster-icon empty" aria-label={alt}>{alt.slice(0, 1) || "?"}</span>;
}

function settlementPokemonSprite(entry: FormalSettlementPokemonStatsV4): string {
  return entry.speciesId ? pokemonSpriteUrl({speciesId: entry.speciesId, facing: "front", shiny: Boolean(entry.shiny)}) : "";
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
