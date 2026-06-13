import {useEffect, useRef, useState} from "react";
import type {DesktopDexCategory, DesktopDexEntry, DesktopDexSearchResult, MoveSummary, RentalPokemon} from "@changebattle/shared";
import {AnimatedModalLayer, AnimatedPanel} from "../motion/Animated";
import {PokemonProfile} from "../pokemon/PokemonProfile";
import {ItemIcon, PokemonSprite, STAT_ROWS, assetUrl, displayName, trainerImageUrl} from "../../lib/ui";
import {POKEMON_INFO_TAB_ID, groupLearnsetBySource, pokemonDexDetailTabs} from "./learnsetGroups";

const DEX_TABS: Array<{id: DesktopDexCategory; label: string}> = [
  {id: "pokemon", label: "宝可梦"},
  {id: "abilities", label: "特性"},
  {id: "moves", label: "技能"},
  {id: "items", label: "道具"},
  {id: "trainers", label: "训练师"},
];
const DEX_PAGE_SIZE = 8;
type TrainerDexFilter = "all" | "gym" | "elite4" | "champion" | "villain" | "special";
const TRAINER_DEX_FILTERS: Array<{id: TrainerDexFilter; label: string; query?: string}> = [
  {id: "all", label: "全部"},
  {id: "gym", label: "馆主", query: "type:gym"},
  {id: "elite4", label: "四天王", query: "type:elite4"},
  {id: "champion", label: "冠军", query: "type:champion"},
  {id: "villain", label: "反派头目", query: "type:villain"},
  {id: "special", label: "特殊事件", query: "event:special"},
];
type DexAbilitySummary = NonNullable<DesktopDexEntry["abilities"]>[number];

function dexEntryText(entry: DesktopDexEntry): string {
  if (entry.category === "trainers") return entry.boss_summary || entry.desc_zh || "尚未遭遇";
  if (entry.category === "pokemon") return `${entry.types_zh?.join(" / ") || entry.types?.join(" / ") || "未知属性"}　No.${entry.sprite?.national_dex || "--"}`;
  if (entry.category === "moves") return `${entry.type_zh || entry.type || "未知"} / ${entry.move_category_zh || entry.move_category || "变化"}　威力 ${entry.power || "--"}　命中 ${entry.accuracy ?? "必中"}　PP ${entry.pp || "--"}`;
  return entry.desc_zh || "暂无中文说明。";
}

function dexSpriteUrl(entry: DesktopDexEntry): string {
  const path = String(entry.sprite?.paths.front_normal || entry.sprite?.paths.front_normal_full || "");
  return path ? assetUrl(path) || "" : "";
}

function pokemonMetaLabel(entry: DesktopDexEntry): string {
  const height = entry.heightm ? `身高 ${entry.heightm}m` : "";
  const weight = entry.weightkg ? `体重 ${entry.weightkg}kg` : "";
  const fixedGender = entry.gender === "M" ? "仅雄性" : entry.gender === "F" ? "仅雌性" : entry.gender === "N" ? "无性别" : "";
  const ratio = entry.gender_ratio && !fixedGender
    ? `♂ ${Math.round(Number(entry.gender_ratio.M || 0) * 100)}% / ♀ ${Math.round(Number(entry.gender_ratio.F || 0) * 100)}%`
    : fixedGender;
  return [height, weight, ratio].filter(Boolean).join("　");
}

export function DexModal({onClose}: {onClose: () => void}) {
  const [category, setCategory] = useState<DesktopDexCategory>("pokemon");
  const [trainerFilter, setTrainerFilter] = useState<TrainerDexFilter>("all");
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<DesktopDexEntry[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailExpanded, setDetailExpanded] = useState(false);
  const preferredSelectedId = useRef("");
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
      const filterQuery = TRAINER_DEX_FILTERS.find(filter => filter.id === trainerFilter)?.query || "";
      const searchQuery = category === "trainers" && filterQuery ? `${query} ${filterQuery}` : query;
      void window.changeBattle!.dexSearch(category, searchQuery, currentPage * DEX_PAGE_SIZE, DEX_PAGE_SIZE).then(result => {
        if (cancelled) return;
        setEntries(result.entries || []);
        setTotal(result.total || 0);
        const preferred = preferredSelectedId.current;
        preferredSelectedId.current = "";
        setSelectedId(current => preferred && result.entries.some(entry => entry.id === preferred) ? preferred : result.entries.some(entry => entry.id === current) ? current : result.entries[0]?.id || "");
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

  function openAbility(ability: DexAbilitySummary) {
    preferredSelectedId.current = ability.id;
    setCategory("abilities");
    setQuery(ability.id || ability.name);
    setSelectedId(ability.id);
    setPage(0);
  }

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
        <div className={`dex-modal-body ${detailExpanded ? "detail-expanded" : ""}`}>
          <div className="dex-result-list">
            {loading ? <p>读取本地图鉴...</p> : null}
            {error ? <p>{error}</p> : null}
            {!loading && !error && entries.length === 0 ? <p>没有匹配结果。</p> : null}
            {entries.map(entry => (
              <button className={`${selected?.id === entry.id ? "selected" : ""} ${entry.category === "trainers" && !entry.unlocked ? "locked" : ""}`} onClick={() => setSelectedId(entry.id)} key={`${entry.category}-${entry.id}`}>
                {entry.category === "pokemon" && dexSpriteUrl(entry) ? <img src={dexSpriteUrl(entry)} alt={entry.name_zh || entry.name} /> : null}
                {entry.category === "items" ? <ItemIcon item={entry} /> : null}
                {entry.category === "trainers" ? <TrainerDexAvatar entry={entry} /> : null}
                <strong>{entry.name_zh || entry.name}</strong>
                <span>{entry.name}</span>
                {entry.category === "trainers" && entry.unlocked && entry.trainer_tags?.length ? <TrainerDexBadges tags={entry.trainer_tags} compact /> : null}
                <small>{dexEntryText(entry)}</small>
              </button>
            ))}
            <nav className="dex-pager">
              <button disabled={loading || currentPage <= 0} onClick={() => setPage(value => Math.max(0, value - 1))}>上一页</button>
              <span>{currentPage + 1}/{pageCount}</span>
              <button disabled={loading || currentPage >= pageCount - 1} onClick={() => setPage(value => Math.min(pageCount - 1, value + 1))}>下一页</button>
            </nav>
          </div>
          <DexEntryDetail entry={selected} expanded={detailExpanded} onToggleExpanded={() => setDetailExpanded(value => !value)} onAbilitySelect={openAbility} />
        </div>
      </AnimatedPanel>
    </AnimatedModalLayer>
  );
}

function TrainerDexBadges({tags, compact = false}: {tags: string[]; compact?: boolean}) {
  const uniqueTags = Array.from(new Set(tags.filter(Boolean)));
  if (!uniqueTags.length) return null;
  return <div className={`trainer-dex-badges ${compact ? "compact" : ""}`}>{uniqueTags.map(tag => <span key={tag}>{tag}</span>)}</div>;
}

function TrainerDexAvatar({entry}: {entry: DesktopDexEntry}) {
  const trainer = entry.trainer;
  const image = entry.unlocked ? trainerImageUrl(trainer, "frontGif") : undefined;
  return image ? <img className="trainer-dex-avatar" src={image} alt={entry.name_zh || entry.name} /> : <i className="shadow-orb">?</i>;
}

function DexEntryDetail({entry, expanded, onToggleExpanded, onAbilitySelect}: {entry: DesktopDexEntry | null; expanded: boolean; onToggleExpanded: () => void; onAbilitySelect: (ability: DexAbilitySummary) => void}) {
  const [pokemonTab, setPokemonTab] = useState(POKEMON_INFO_TAB_ID);
  useEffect(() => {
    setPokemonTab(POKEMON_INFO_TAB_ID);
  }, [entry?.category, entry?.id]);
  if (!entry) return <section className="dex-entry-detail empty"><p>选择一个条目。</p></section>;
  if (entry.category === "trainers") return <TrainerDexDetail entry={entry} />;
  const sprite = dexSpriteUrl(entry);
  const learnsetGroups = entry.category === "pokemon" ? groupLearnsetBySource(entry.learnset || []) : [];
  const pokemonTabs = entry.category === "pokemon" ? pokemonDexDetailTabs(entry.learnset || []) : [];
  const activePokemonTab = pokemonTabs.some(tab => tab.id === pokemonTab) ? pokemonTab : POKEMON_INFO_TAB_ID;
  const activeLearnsetGroup = learnsetGroups.find(group => group.id === activePokemonTab) || null;
  return (
    <section className={`dex-entry-detail ${entry.category === "pokemon" ? "pokemon-dex-detail" : ""}`}>
      {entry.category !== "pokemon" ? (
        <header>
          {sprite ? <img src={sprite} alt={entry.name_zh || entry.name} /> : entry.category === "items" ? <ItemIcon item={entry} /> : null}
          <div>
            <h3>{entry.name_zh || entry.name}</h3>
            <p>{entry.name}　{entry.id}</p>
          </div>
          <button className="dex-detail-expand-button" onClick={onToggleExpanded} title={expanded ? "还原详情面板" : "放大详情面板"} aria-label={expanded ? "还原详情面板" : "放大详情面板"}>{expanded ? "↙" : "⛶"}</button>
        </header>
      ) : null}
      {entry.category === "pokemon" ? (
        <>
          <div className="dex-pokemon-tab-bar">
            <nav className="dex-pokemon-subtabs">
              {pokemonTabs.map(tab => (
                <button className={activePokemonTab === tab.id ? "selected" : ""} onClick={() => setPokemonTab(tab.id)} key={`${entry.id}-${tab.id}`}>
                  <span>{tab.label}</span>
                  {tab.count !== undefined ? <small>{tab.count}</small> : null}
                </button>
              ))}
            </nav>
            <button className="dex-detail-expand-button" onClick={onToggleExpanded} title={expanded ? "还原详情面板" : "放大详情面板"} aria-label={expanded ? "还原详情面板" : "放大详情面板"}>{expanded ? "↙" : "⛶"}</button>
          </div>
          <div className="dex-pokemon-tab-panel">
            {activePokemonTab === POKEMON_INFO_TAB_ID ? <PokemonDexInfo entry={entry} onAbilitySelect={onAbilitySelect} /> : <PokemonDexLearnsetGroup entry={entry} group={activeLearnsetGroup} />}
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
      {entry.category !== "pokemon" ? <p className="dex-description">{entry.desc_zh || "暂无中文说明。"}</p> : null}
    </section>
  );
}

function PokemonDexInfo({entry, onAbilitySelect}: {entry: DesktopDexEntry; onAbilitySelect: (ability: DexAbilitySummary) => void}) {
  const sprite = dexSpriteUrl(entry);
  return (
    <div className="dex-pokemon-info">
      <section className="dex-pokemon-identity">
        {sprite ? <img src={sprite} alt={entry.name_zh || entry.name} /> : null}
        <div>
          <h3>{entry.name_zh || entry.name}</h3>
          <p>{entry.name}　{entry.id}（使用次数{entry.usage_count || 0}）</p>
        </div>
      </section>
      <div className="dex-type-row">{(entry.types_zh || entry.types || []).map(type => <span key={type}>{type}</span>)}</div>
      {pokemonMetaLabel(entry) ? <p className="dex-entry-meta">{pokemonMetaLabel(entry)}</p> : null}
      {entry.base_stats ? <div className="dex-stat-grid">{STAT_ROWS.map(([stat, label]) => <div key={stat}><span>{label}</span><strong>{entry.base_stats?.[stat] || 0}</strong></div>)}</div> : null}
      <section className="dex-ability-panel">
        <h4>可能特性</h4>
        <div>
          {(entry.abilities || []).map(ability => (
            <button onClick={() => onAbilitySelect(ability)} key={ability.id}>
              <strong>{ability.name_zh || ability.name}</strong>
              {ability.hidden ? <span>隐藏</span> : null}
              <small>{ability.desc_zh || ability.name}</small>
            </button>
          ))}
          {!entry.abilities?.length ? <p>暂无特性数据。</p> : null}
        </div>
      </section>
    </div>
  );
}

function PokemonDexLearnsetGroup({entry, group}: {entry: DesktopDexEntry; group: ReturnType<typeof groupLearnsetBySource>[number] | null}) {
  if (!group) return <div className="dex-learnset-panel empty"><p>暂无技能池数据。</p></div>;
  return (
    <div className="dex-learnset-panel">
      <section className="dex-learnset-group">
        <h5><span>{group.label}</span><small>{group.moves.length}</small></h5>
        <div>
          {group.moves.map(move => <DexMoveCard move={move} key={`${entry.id}-${group.id}-${move.id}`} />)}
        </div>
      </section>
    </div>
  );
}

function DexMoveCard({move}: {move: MoveSummary}) {
  return (
    <article>
      <strong>{move.name_zh || move.name}</strong>
      <span>{move.type_zh || move.type} / {move.category_zh || move.category}</span>
      <small>威力 {move.power || "--"}　命中 {move.accuracy ?? "必中"}　PP {move.pp || "--"}</small>
    </article>
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
          <p>{entry.unlocked ? `${trainer?.region || "未知地区"}　${trainer?.role || (trainer?.type === "champion" ? "冠军" : trainer?.type === "elite4" ? "四天王" : trainer?.type === "villain" ? "反派头目" : "馆主")}` : entry.desc_zh || "尚未遭遇"}</p>
          {entry.unlocked ? <TrainerDexBadges tags={entry.trainer_tags || []} /> : null}
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
