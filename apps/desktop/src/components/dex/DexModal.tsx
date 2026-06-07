import {useEffect, useMemo, useState} from "react";
import type {DesktopDexCategory, DesktopDexEntry, DesktopDexSearchResult, RentalPokemon} from "@changebattle/shared";
import {AnimatedModalLayer, AnimatedPanel} from "../motion/Animated";
import {PokemonProfile} from "../pokemon/PokemonProfile";
import {PokemonSprite, STAT_ROWS, assetUrl, displayName, trainerImageUrl} from "../../lib/ui";

const DEX_TABS: Array<{id: DesktopDexCategory; label: string}> = [
  {id: "pokemon", label: "宝可梦"},
  {id: "abilities", label: "特性"},
  {id: "moves", label: "技能"},
  {id: "items", label: "道具"},
  {id: "trainers", label: "训练师"},
];
const DEX_PAGE_SIZE = 8;
const TRAINER_DEX_FILTERS: Array<{id: "all" | "gym" | "elite4" | "champion"; label: string}> = [
  {id: "all", label: "全部"},
  {id: "gym", label: "馆主"},
  {id: "elite4", label: "四天王"},
  {id: "champion", label: "冠军"},
];

function dexEntryText(entry: DesktopDexEntry): string {
  if (entry.category === "trainers") return entry.boss_summary || entry.desc_zh || "尚未遭遇";
  if (entry.category === "pokemon") return `${entry.types_zh?.join(" / ") || entry.types?.join(" / ") || "未知属性"}　No.${entry.sprite?.national_dex || "--"}`;
  if (entry.category === "moves") return `${entry.type_zh || entry.type || "未知"} / ${entry.move_category_zh || entry.move_category || "变化"}　威力 ${entry.power || "--"}　命中 ${entry.accuracy ?? "必中"}　PP ${entry.pp || "--"}`;
  return entry.desc_zh || entry.desc || entry.id;
}

function dexSpriteUrl(entry: DesktopDexEntry): string {
  const path = String(entry.sprite?.paths.front_normal || entry.sprite?.paths.front_normal_full || "");
  return path ? assetUrl(path) || "" : "";
}

export function DexModal({onClose}: {onClose: () => void}) {
  const [category, setCategory] = useState<DesktopDexCategory>("pokemon");
  const [trainerFilter, setTrainerFilter] = useState<"all" | "gym" | "elite4" | "champion">("all");
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<DesktopDexEntry[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selected = entries.find(entry => entry.id === selectedId) || entries[0] || null;
  const pageCount = Math.max(1, Math.ceil(total / DEX_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setEntries([]);
    setSelectedId("");
    const timer = window.setTimeout(() => {
      const searchQuery = category === "trainers" && trainerFilter !== "all" ? `${query} type:${trainerFilter}` : query;
      void window.changeBattle!.dexSearch(category, searchQuery, currentPage * DEX_PAGE_SIZE, DEX_PAGE_SIZE).then(result => {
        if (cancelled) return;
        setEntries(result.entries || []);
        setTotal(result.total || 0);
        setSelectedId(current => result.entries.some(entry => entry.id === current) ? current : result.entries[0]?.id || "");
      }).catch(err => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setEntries([]);
        setTotal(0);
        setSelectedId("");
      }).finally(() => {
        if (!cancelled) setLoading(false);
      });
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [category, query, trainerFilter, currentPage]);

  return (
    <AnimatedModalLayer className="modal-layer">
      <AnimatedPanel className="dex-modal">
        <header>
          <div>
            <h2>图鉴</h2>
            <p>{entries.length}/{total} 个结果</p>
          </div>
          <button onClick={onClose}>关闭</button>
        </header>
        <nav className="dex-tabs">
          {DEX_TABS.map(tab => <button className={category === tab.id ? "selected" : ""} onClick={() => { setCategory(tab.id); setSelectedId(""); setPage(0); }} key={tab.id}>{tab.label}</button>)}
        </nav>
        {category === "trainers" ? (
          <nav className="dex-subtabs">
            {TRAINER_DEX_FILTERS.map(filter => <button className={trainerFilter === filter.id ? "selected" : ""} onClick={() => { setTrainerFilter(filter.id); setSelectedId(""); setPage(0); }} key={filter.id}>{filter.label}</button>)}
          </nav>
        ) : null}
        <input className="dex-search-input" value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} placeholder="搜索名称、英文、属性、说明" />
        <div className="dex-modal-body">
          <div className="dex-result-list">
            {loading ? <p>读取本地图鉴...</p> : null}
            {error ? <p>{error}</p> : null}
            {!loading && !error && entries.length === 0 ? <p>没有匹配结果。</p> : null}
            {entries.map(entry => (
              <button className={`${selected?.id === entry.id ? "selected" : ""} ${entry.category === "trainers" && !entry.unlocked ? "locked" : ""}`} onClick={() => setSelectedId(entry.id)} key={`${entry.category}-${entry.id}`}>
                {entry.category === "pokemon" && dexSpriteUrl(entry) ? <img src={dexSpriteUrl(entry)} alt={entry.name_zh || entry.name} /> : null}
                {entry.category === "trainers" ? <TrainerDexAvatar entry={entry} /> : null}
                <strong>{entry.name_zh || entry.name}</strong>
                <span>{entry.name}</span>
                <small>{dexEntryText(entry)}</small>
              </button>
            ))}
            <nav className="dex-pager">
              <button disabled={loading || currentPage <= 0} onClick={() => setPage(value => Math.max(0, value - 1))}>上一页</button>
              <span>{currentPage + 1}/{pageCount}</span>
              <button disabled={loading || currentPage >= pageCount - 1} onClick={() => setPage(value => Math.min(pageCount - 1, value + 1))}>下一页</button>
            </nav>
          </div>
          <DexEntryDetail entry={selected} />
        </div>
      </AnimatedPanel>
    </AnimatedModalLayer>
  );
}

function TrainerDexAvatar({entry}: {entry: DesktopDexEntry}) {
  const trainer = entry.trainer;
  const image = entry.unlocked ? trainerImageUrl(trainer, "frontGif") : undefined;
  return image ? <img className="trainer-dex-avatar" src={image} alt={entry.name_zh || entry.name} /> : <i className="shadow-orb">?</i>;
}

function DexEntryDetail({entry}: {entry: DesktopDexEntry | null}) {
  if (!entry) return <section className="dex-entry-detail empty"><p>选择一个条目。</p></section>;
  if (entry.category === "trainers") return <TrainerDexDetail entry={entry} />;
  const sprite = dexSpriteUrl(entry);
  return (
    <section className="dex-entry-detail">
      <header>
        {sprite ? <img src={sprite} alt={entry.name_zh || entry.name} /> : null}
        <div>
          <h3>{entry.name_zh || entry.name}</h3>
          <p>{entry.name}　{entry.id}</p>
        </div>
      </header>
      {entry.category === "pokemon" ? (
        <>
          <div className="dex-type-row">{(entry.types_zh || entry.types || []).map(type => <span key={type}>{type}</span>)}</div>
          {entry.base_stats ? <div className="dex-stat-grid">{STAT_ROWS.map(([stat, label]) => <div key={stat}><span>{label}</span><strong>{entry.base_stats?.[stat] || 0}</strong></div>)}</div> : null}
          <div className="dex-learnset-panel">
            <h4>技能池</h4>
            <div>
              {entry.learnset?.length ? entry.learnset.map(move => (
                <article key={`${entry.id}-${move.id}`}>
                  <strong>{move.name_zh || move.name}</strong>
                  <span>{move.type_zh || move.type} / {move.category_zh || move.category}</span>
                  <small>威力 {move.power || "--"}　命中 {move.accuracy ?? "必中"}　PP {move.pp || "--"}</small>
                </article>
              )) : <p>暂无技能池数据。</p>}
            </div>
          </div>
        </>
      ) : null}
      {entry.category === "moves" ? (
        <div className="dex-fact-grid">
          <p>属性：{entry.type_zh || entry.type || "--"}</p>
          <p>分类：{entry.move_category_zh || entry.move_category || "--"}</p>
          <p>威力：{entry.power || "--"}</p>
          <p>命中：{entry.accuracy ?? "必中"}</p>
          <p>PP：{entry.pp || "--"}</p>
          <p>优先度：{entry.priority || 0}</p>
        </div>
      ) : null}
      {entry.category !== "pokemon" ? <p className="dex-description">{entry.desc_zh || entry.desc || "暂无说明。"}</p> : null}
    </section>
  );
}

function TrainerDexDetail({entry}: {entry: DesktopDexEntry}) {
  const [detailPokemon, setDetailPokemon] = useState<RentalPokemon | null>(null);
  const trainer = entry.trainer;
  const image = entry.unlocked ? trainerImageUrl(trainer, "frontGif") : undefined;
  const record = entry.boss_record;
  const lastResult = record?.last_result === "win" ? "胜利" : record?.last_result === "loss" ? "失败" : "未结算";
  return (
    <section className={`dex-entry-detail trainer-dex-detail ${entry.unlocked ? "" : "locked"}`}>
      <header>
        {image ? <img src={image} alt={entry.name_zh || entry.name} /> : <i className="shadow-orb large">?</i>}
        <div>
          <h3>{entry.unlocked ? entry.name_zh : "未知训练师"}</h3>
          <p>{trainer?.region || "未知地区"}　{trainer?.role || (trainer?.type === "champion" ? "冠军" : trainer?.type === "elite4" ? "四天王" : "馆主")}</p>
        </div>
      </header>
      <div className="trainer-dex-stats">
        <span>交手 <strong>{record?.completed || 0}</strong></span>
        <span>胜 <strong>{record?.wins || 0}</strong></span>
        <span>负 <strong>{record?.losses || 0}</strong></span>
        <span>上次 <strong>{lastResult}</strong></span>
      </div>
      <p className="dex-description">{entry.unlocked ? "已记录这位强敌的遭遇资料。配置池展示的是对战中实际遇到过的预设宝可梦配置。" : "尚未遭遇。击败路上的训练师，直到这位强敌站到你面前。"}</p>
      <div className="trainer-pool-panel">
        <h4>遭遇配置池</h4>
        <div>
          {(entry.boss_pool_rows || []).map(row => (
            <article className="trainer-pool-row" key={`${entry.id}-${row.team_index}`}>
              <span>配置 {row.team_index}</span>
              <div>
                {row.slots.map(slot => slot.unlocked && slot.pokemon ? (
                  <button className="trainer-pool-slot unlocked" onClick={() => setDetailPokemon(slot.pokemon || null)} key={slot.key}>
                    <PokemonSprite pokemon={slot.pokemon} alt={displayName(slot.pokemon)} />
                    <strong>{displayName(slot.pokemon)}</strong>
                  </button>
                ) : (
                  <button className="trainer-pool-slot locked" disabled key={slot.key}>
                    <i className="shadow-orb">?</i>
                    <strong>未知</strong>
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
      {detailPokemon ? (
        <div className="modal-layer nested">
          <section className="pokemon-detail-modal trainer-pokemon-detail">
            <header><h2>{displayName(detailPokemon)} 的预设配置</h2><button onClick={() => setDetailPokemon(null)}>关闭</button></header>
            <PokemonProfile pokemon={detailPokemon} compact revealTraining />
          </section>
        </div>
      ) : null}
    </section>
  );
}
