import {useEffect, useState} from "react";
import type {ResultPokemonSummary} from "@changebattle/shared";
import {PokemonSprite, displayName} from "../../lib/ui";
import {resultPokemonKey} from "./resultUtils";
import "./ResultTeamSummary.css";

const USED_PAGE_SIZE = 3;

export function ResultTeamSummary({usedPokemon}: {usedPokemon: ResultPokemonSummary[]}) {
  const [selectedPokemonKey, setSelectedPokemonKey] = useState(() => resultPokemonKey(usedPokemon[0]?.pokemon));
  const [usedPage, setUsedPage] = useState(0);
  const selectedPokemon = usedPokemon.find(entry => resultPokemonKey(entry.pokemon) === selectedPokemonKey) || usedPokemon[0] || null;
  const usedPageCount = Math.max(1, Math.ceil(usedPokemon.length / USED_PAGE_SIZE));
  const currentUsedPage = Math.min(usedPage, usedPageCount - 1);
  const pagedUsedPokemon = usedPokemon.slice(currentUsedPage * USED_PAGE_SIZE, currentUsedPage * USED_PAGE_SIZE + USED_PAGE_SIZE);

  useEffect(() => {
    if (!usedPokemon.some(entry => resultPokemonKey(entry.pokemon) === selectedPokemonKey)) {
      setSelectedPokemonKey(resultPokemonKey(usedPokemon[0]?.pokemon));
    }
  }, [selectedPokemonKey, usedPokemon]);

  useEffect(() => {
    if (usedPage >= usedPageCount) setUsedPage(Math.max(0, usedPageCount - 1));
  }, [usedPage, usedPageCount]);

  return (
    <section className="result-section result-pokemon-section">
      <header>
        <strong>本局使用过的宝可梦</strong>
        <span>{usedPokemon.length} 只　{currentUsedPage + 1}/{usedPageCount}</span>
      </header>
      <div className="result-pokemon-body">
        <div className="result-used-browser">
          <div className="result-used-list">
            {usedPokemon.length ? Array.from({length: USED_PAGE_SIZE}, (_value, index) => pagedUsedPokemon[index] || null).map((entry, index) => {
              if (!entry) return <span className="result-used-empty-slot" key={`empty-used-${index}`} />;
              const key = resultPokemonKey(entry.pokemon);
              return (
                <button className={selectedPokemon && resultPokemonKey(selectedPokemon.pokemon) === key ? "selected" : ""} onClick={() => setSelectedPokemonKey(key)} key={key}>
                  <PokemonSprite pokemon={entry.pokemon} alt={displayName(entry.pokemon)} />
                  <span>{displayName(entry.pokemon)}</span>
                </button>
              );
            }) : <p>暂无队伍记录。</p>}
          </div>
          <div className="result-used-pager">
            <button disabled={currentUsedPage <= 0} onClick={() => setUsedPage(page => Math.max(0, page - 1))}>上一页</button>
            <span>{currentUsedPage + 1}/{usedPageCount}</span>
            <button disabled={currentUsedPage >= usedPageCount - 1} onClick={() => setUsedPage(page => Math.min(usedPageCount - 1, page + 1))}>下一页</button>
          </div>
        </div>
        <PokemonResultDetail entry={selectedPokemon} />
      </div>
    </section>
  );
}

export function PokemonResultDetail({entry}: {entry: ResultPokemonSummary | null}) {
  if (!entry) {
    return <article className="result-pokemon-detail empty">暂无宝可梦统计。</article>;
  }
  const stats = [
    ["K", entry.kills],
    ["D", entry.deaths],
    ["A", entry.assists],
    ["输出", entry.damage_dealt],
    ["承伤", entry.damage_taken],
  ];
  return (
    <article className="result-pokemon-detail">
      <PokemonSprite pokemon={entry.pokemon} alt={displayName(entry.pokemon)} />
      <div>
        <strong>{displayName(entry.pokemon)}</strong>
        <span>Lv{entry.pokemon.level}　{entry.pokemon.item_zh || "无道具"}</span>
      </div>
      <dl>
        {stats.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
