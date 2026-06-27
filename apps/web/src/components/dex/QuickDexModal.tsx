import {useEffect, useMemo, useState, type CSSProperties, type ReactNode} from "react";
import {AnimatePresence, motion} from "motion/react";
import type {
  ChangeBattleV2Api,
  DexAbilityDetail,
  DexCategory,
  DexItemDetail,
  DexMoveDetail,
  DexMoveSummary,
  DexPokemonDetail,
  DexPokemonLink,
  DexSearchRow,
  DexStatsResult,
} from "@changebattle-v2/api";
import {BattleV4MovePreviewModal, type BattleV4EnvironmentPreviewEntry} from "../battle-v4/BattleV4MovePreviewModal";
import {PokopiaModal, pokopiaItemVariants} from "../motion/PokopiaModal";
import "./DexCategoryTabs.css";
import "./DexSearchBar.css";
import "./DexResultList.css";
import "./DexDetailPanel.css";
import "./PokemonDexDetail.css";
import "./MoveCard.css";
import "./QuickDexModal.css";

type QuickDexBaseCategory = Extract<DexCategory, "pokemon" | "moves" | "abilities" | "items">;
type QuickDexCategory = QuickDexBaseCategory | "environment";
type PokemonTabId = (typeof POKEMON_TABS)[number]["id"];
type DetailState =
  | {category: "pokemon"; detail: DexPokemonDetail; stats: DexStatsResult}
  | {category: "moves"; detail: DexMoveDetail}
  | {category: "abilities"; detail: DexAbilityDetail}
  | {category: "items"; detail: DexItemDetail}
  | {category: "environment"; detail: BattleV4EnvironmentPreviewEntry; moveDetail?: DexMoveDetail};

const CATEGORIES: Array<{id: QuickDexCategory; label: string; hint: string}> = [
  {id: "pokemon", label: "宝可梦", hint: "属性、能力、形态、学习面"},
  {id: "moves", label: "技能", hint: "威力、命中、目标、学习者"},
  {id: "abilities", label: "特性", hint: "效果说明与拥有者"},
  {id: "items", label: "战斗道具", hint: "Showdown 道具说明"},
  {id: "environment", label: "环境", hint: "天气、场地、空间与战场环境"},
];

const PAGE_SIZE = 18;
const STAT_LABELS: Record<string, string> = {hp: "HP", atk: "攻击", def: "防御", spa: "特攻", spd: "特防", spe: "速度"};
const SOURCE_LABELS: Record<string, string> = {
  levelup: "自学技能",
  tutor: "教授技能",
  machine: "技能机器",
  egg: "遗传技能",
  event: "其他技能",
  transfer: "其他技能",
  other: "其他技能",
};
const POKEMON_TABS = [
  {id: "summary", label: "详情"},
  {id: "sprites", label: "立绘"},
  {id: "levelup", label: "自学技能"},
  {id: "tutor", label: "教授技能"},
  {id: "machine", label: "技能机器"},
  {id: "egg", label: "遗传技能"},
  {id: "other", label: "其他技能"},
] as const;

const ENVIRONMENT_ENTRIES: BattleV4EnvironmentPreviewEntry[] = [
  environmentEntry("sunnyday", "Sunny Day", "大晴天", "weather", "SunnyDay", "sunnyday", "move", "技能：大晴天", "天气变为晴天，火属性招式增强，水属性招式减弱。"),
  environmentEntry("raindance", "Rain Dance", "求雨", "weather", "RainDance", "raindance", "move", "技能：求雨", "天气变为雨天，水属性招式增强，火属性招式减弱。"),
  environmentEntry("sandstorm", "Sandstorm", "沙暴", "weather", "Sandstorm", "sandstorm", "move", "技能：沙暴", "沙暴会持续影响战场，并对部分非岩石、地面、钢属性宝可梦造成影响。"),
  environmentEntry("hail", "Hail", "冰雹", "weather", "Hail", "hail", "move", "技能：冰雹", "旧世代天气。当前规则中部分格式会由雪景替代。"),
  environmentEntry("snowscape", "Snowscape", "雪景", "weather", "Snow", "snowscape", "move", "技能：雪景", "天气变为雪景，冰属性宝可梦的防御表现会受到规则影响。"),
  environmentEntry("desolateland", "Desolate Land", "终结之地", "weather", "DesolateLand", undefined, "ability", "特性：终结之地", "暂无 Showdown 技能说明，后续接入完整环境资料。"),
  environmentEntry("primordialsea", "Primordial Sea", "始源之海", "weather", "PrimordialSea", undefined, "ability", "特性：始源之海", "暂无 Showdown 技能说明，后续接入完整环境资料。"),
  environmentEntry("deltastream", "Delta Stream", "德尔塔气流", "weather", "DeltaStream", undefined, "ability", "特性：德尔塔气流", "暂无 Showdown 技能说明，后续接入完整环境资料。"),
  environmentEntry("electricterrain", "Electric Terrain", "电气场地", "terrain", "Electric Terrain", "electricterrain", "move", "技能：电气场地", "场地变为电气场地，影响地面上的宝可梦与电属性相关效果。"),
  environmentEntry("grassyterrain", "Grassy Terrain", "青草场地", "terrain", "Grassy Terrain", "grassyterrain", "move", "技能：青草场地", "场地变为青草场地，影响地面上的宝可梦并提供回复等效果。"),
  environmentEntry("mistyterrain", "Misty Terrain", "薄雾场地", "terrain", "Misty Terrain", "mistyterrain", "move", "技能：薄雾场地", "场地变为薄雾场地，影响地面上的宝可梦与异常状态/龙属性伤害。"),
  environmentEntry("psychicterrain", "Psychic Terrain", "精神场地", "terrain", "Psychic Terrain", "psychicterrain", "move", "技能：精神场地", "场地变为精神场地，影响地面上的宝可梦与先制招式。"),
  environmentEntry("trickroom", "Trick Room", "戏法空间", "room", "Trick Room", "trickroom", "move", "技能：戏法空间", "空间被扭曲，速度较慢的宝可梦会更早行动。"),
  environmentEntry("magicroom", "Magic Room", "魔法空间", "room", "Magic Room", "magicroom", "move", "技能：魔法空间", "空间被改写，携带道具效果暂时失效。"),
  environmentEntry("wonderroom", "Wonder Room", "奇妙空间", "room", "Wonder Room", "wonderroom", "move", "技能：奇妙空间", "空间被改写，防御与特防的计算会交换。"),
  environmentEntry("gravity", "Gravity", "重力", "room", "Gravity", "gravity", "move", "技能：重力", "重力增强，影响飞行/漂浮与部分招式命中。"),
];

export function QuickDexModal({api, onClose}: {api: ChangeBattleV2Api; onClose: () => void}) {
  const [category, setCategory] = useState<QuickDexCategory>("pokemon");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<DexSearchRow[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<DexSearchRow | null>(null);
  const [detail, setDetail] = useState<DetailState | null>(null);
  const [level, setLevel] = useState(50);
  const [pokemonTab, setPokemonTab] = useState<PokemonTabId>("summary");
  const [previewMove, setPreviewMove] = useState<DexMoveDetail | null>(null);
  const [previewEnvironment, setPreviewEnvironment] = useState<BattleV4EnvironmentPreviewEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activeCategory = CATEGORIES.find(item => item.id === category) || CATEGORIES[0];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const timer = window.setTimeout(() => {
      try {
        if (category === "environment") {
          const result = searchEnvironmentEntries(query, page * PAGE_SIZE, PAGE_SIZE);
          if (cancelled) return;
          setRows(result.rows);
          setTotal(result.total);
          setSelected(current => result.rows.find(row => row.id === current?.id) || result.rows[0] || null);
          return;
        }
        const result = api.searchDex({category, query, offset: page * PAGE_SIZE, limit: PAGE_SIZE});
        if (cancelled) return;
        setRows(result.rows);
        setTotal(result.total);
        setSelected(current => result.rows.find(row => row.id === current?.id) || result.rows[0] || null);
      } catch (err) {
        if (cancelled) return;
        setRows([]);
        setTotal(0);
        setSelected(null);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 100);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [api, category, page, query]);

  useEffect(() => {
    if (!selected) {
      setDetail(null);
      return;
    }
    try {
      setDetail(loadDetail(api, selected, level));
    } catch (err) {
      setDetail(null);
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [api, level, selected]);

  const visibleOtherMoves = useMemo(() => {
    if (detail?.category !== "pokemon") return [];
    const explicit = new Set(["levelup", "tutor", "machine", "egg"]);
    return detail.detail.learnset.filter(move => move.learnSources?.some(source => !explicit.has(source)));
  }, [detail]);

  function chooseCategory(next: QuickDexCategory) {
    setCategory(next);
    setQuery("");
    setPage(0);
    setSelected(null);
    setDetail(null);
    setPokemonTab("summary");
  }

  function jumpTo(row: DexSearchRow) {
    if (row.category === "trainers" && row.tags.includes("environment")) {
      setCategory("environment");
      setQuery(row.id);
      setPage(0);
      setSelected(row);
      return;
    }
    setCategory(row.category as QuickDexCategory);
    setQuery(row.id);
    setPage(0);
    setSelected(row);
  }

  function jump(categoryId: QuickDexBaseCategory, id: string) {
    const result = api.searchDex({category: categoryId, query: id, limit: 1});
    const row = result.rows[0] || {id, category: categoryId, name: id, nameZh: id, tags: []};
    jumpTo(row);
  }

  function playCry(url: string | undefined) {
    if (!url) return;
    void new Audio(url).play().catch(() => setError("叫声资源暂时不可用。"));
  }

  function renderContent(close: () => void) {
    return (
      <motion.div className="quick-dex-content-grid" variants={pokopiaItemVariants}>
        <header className="quick-dex-header">
          <div>
            <h2 id="quick-dex-title">图鉴</h2>
            <p>{activeCategory.hint}</p>
          </div>
          <button type="button" onClick={() => close()}>关闭</button>
        </header>

        <section className="quick-dex-mega">
          <nav className="quick-dex-mega-tabs dex-category-tabs quick" aria-label="图鉴分类">
            {CATEGORIES.map(item => (
              <button type="button" className={item.id === category ? "selected" : ""} onClick={() => chooseCategory(item.id)} key={item.id}>
                {item.id === category ? <i /> : null}
                <span>{item.label}<b>⌄</b></span>
              </button>
            ))}
          </nav>
        </section>

        <div className="quick-dex-tools">
          <input value={query} placeholder={`搜索${activeCategory.label}`} onChange={event => { setQuery(event.target.value); setPage(0); }} />
          <span>{loading ? "检索中" : `${total} 条`}</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div className="quick-dex-body" key={category} initial={{opacity: 0, x: 14}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: -14}}>
            <aside className="quick-dex-result-pane dex-result-list-shell quick">
              <div className={`quick-dex-list ${category === "moves" ? "move-results" : ""}`}>
                {rows.map(row => (
                  <button type="button" className={row.id === selected?.id ? "selected" : ""} onClick={() => setSelected(row)} key={`${row.category}-${row.id}`}>
                    {row.sprite?.iconUrl ? <PokemonIcon row={row} /> : row.iconUrl || row.iconStyle ? <DexItemIcon iconUrl={row.iconUrl} iconStyle={row.iconStyle} className="quick-dex-list-item-icon" /> : <span>{categoryIconForRow(row)}</span>}
                    <strong>{row.nameZh || row.name}</strong>
                    <small>{row.subtitle || row.name}</small>
                  </button>
                ))}
                {loading ? <p className="quick-dex-message">读取本地图鉴...</p> : null}
                {!loading && !rows.length ? <p className="quick-dex-message">{error || "没有匹配结果。"}</p> : null}
              </div>
              <footer className="quick-dex-pager" aria-label="图鉴翻页">
                <button type="button" disabled={page <= 0} onClick={() => setPage(value => Math.max(0, value - 1))}>上一页</button>
                <span>{page + 1}/{pageCount}</span>
                <button type="button" disabled={page + 1 >= pageCount} onClick={() => setPage(value => Math.min(pageCount - 1, value + 1))}>下一页</button>
              </footer>
            </aside>

            <section className="quick-dex-detail">
              {detail?.category === "pokemon" ? (
                <PokemonDetail
                  detail={detail.detail}
                  stats={detail.stats}
                  level={level}
                  tab={pokemonTab}
                  otherMoves={visibleOtherMoves}
                  onLevelChange={setLevel}
                  onTabChange={setPokemonTab}
                  onAbilityClick={id => jump("abilities", id)}
                  onPokemonClick={id => jump("pokemon", id)}
                  onMoveClick={id => jump("moves", id)}
                  onPlayCry={() => playCry(detail.detail.cryUrl)}
                />
              ) : null}
              {detail?.category === "moves" ? <MoveDetail detail={detail.detail} onPokemonClick={id => jump("pokemon", id)} onPreviewMove={setPreviewMove} /> : null}
              {detail?.category === "abilities" ? <AbilityDetail detail={detail.detail} onPokemonClick={id => jump("pokemon", id)} /> : null}
              {detail?.category === "items" ? <ItemDetail detail={detail.detail} /> : null}
              {detail?.category === "environment" ? (
                <EnvironmentDetail
                  detail={detail.detail}
                  moveDetail={detail.moveDetail}
                  onMoveClick={id => jump("moves", id)}
                  onPreviewEnvironment={setPreviewEnvironment}
                />
              ) : null}
              {!detail ? <p className="quick-dex-detail empty">{loading ? "正在读取详情..." : error || "选择左侧条目查看详情。"}</p> : null}
            </section>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <>
      <PokopiaModal className="quick-dex-modal" labelledBy="quick-dex-title" onClose={onClose}>
        {requestClose => renderContent(requestClose)}
      </PokopiaModal>
      {previewMove ? <BattleV4MovePreviewModal api={api} move={previewMove} initialMode="singles" onClose={() => setPreviewMove(null)} /> : null}
      {previewEnvironment ? <BattleV4MovePreviewModal api={api} environment={previewEnvironment} initialMode="singles" onClose={() => setPreviewEnvironment(null)} /> : null}
    </>
  );
}

function loadDetail(api: ChangeBattleV2Api, row: DexSearchRow, level: number): DetailState {
  if (row.category === "trainers" && row.tags.includes("environment")) {
    const environment = ENVIRONMENT_ENTRIES.find(entry => entry.id === row.id) || ENVIRONMENT_ENTRIES[0]!;
    let moveDetail: DexMoveDetail | undefined;
    if (environment.moveId) {
      try {
        moveDetail = api.getMoveDetail(environment.moveId);
      } catch {
        moveDetail = undefined;
      }
    }
    return {category: "environment", detail: environment, moveDetail};
  }
  if (row.category === "pokemon") {
    return {category: "pokemon", detail: api.getPokemonDetail(row.id), stats: api.dex.calculatePokemonStats({speciesId: row.id, level})};
  }
  if (row.category === "moves") return {category: "moves", detail: api.getMoveDetail(row.id)};
  if (row.category === "abilities") return {category: "abilities", detail: api.getAbilityDetail(row.id)};
  return {category: "items", detail: api.getItemDetail(row.id)};
}

function PokemonIcon({row}: {row: DexSearchRow}) {
  if (!row.sprite?.iconStyle) return <span className="quick-dex-pokemon-icon">P</span>;
  return <span className="quick-dex-pokemon-icon picon" aria-hidden="true" style={styleFromCss(row.sprite.iconStyle)} />;
}

function PokemonDetail({
  detail,
  stats,
  level,
  tab,
  otherMoves,
  onLevelChange,
  onTabChange,
  onAbilityClick,
  onPokemonClick,
  onMoveClick,
  onPlayCry,
}: {
  detail: DexPokemonDetail;
  stats: DexStatsResult;
  level: number;
  tab: PokemonTabId;
  otherMoves: DexMoveSummary[];
  onLevelChange: (level: number) => void;
  onTabChange: (tab: PokemonTabId) => void;
  onAbilityClick: (id: string) => void;
  onPokemonClick: (id: string) => void;
  onMoveClick: (id: string) => void;
  onPlayCry: () => void;
}) {
  const moveGroups: Record<string, DexMoveSummary[]> = {
    levelup: detail.learnsetGroups.levelup,
    tutor: detail.learnsetGroups.tutor,
    machine: detail.learnsetGroups.machine,
    egg: detail.learnsetGroups.egg,
    other: otherMoves,
  };

  return (
    <div className="quick-dex-pokemon-info">
      <div className="quick-dex-pokemon-tab-bar">
        <nav className="quick-dex-pokemon-subtabs" aria-label="宝可梦详情分类">
          {POKEMON_TABS.map(item => <button type="button" className={item.id === tab ? "selected" : ""} onClick={() => onTabChange(item.id)} key={item.id}>{item.label}</button>)}
        </nav>
        <button type="button" className="quick-dex-detail-expand-button" onClick={onPlayCry} title="播放叫声">♪</button>
      </div>
      {tab === "summary" ? (
        <div className="quick-dex-pokemon-tab-panel quick-dex-pokemon-info">
          <div className="quick-dex-pokemon-identity">
            <img src={detail.sprites.animatedFrontUrl || detail.sprites.frontUrl} alt={detail.name} onError={event => {
              if (detail.sprites.frontUrl && event.currentTarget.src !== detail.sprites.frontUrl) event.currentTarget.src = detail.sprites.frontUrl;
            }} />
            <div>
              <h3>{detail.nameZh || detail.name}</h3>
              <p>No.{detail.num} · {detail.name}</p>
              <div className="quick-dex-badges">{detail.types.map(type => <span key={type}>{type}</span>)}</div>
            </div>
          </div>
          <div className="quick-dex-badges">
            <span>身高 {detail.heightm ?? "-"}m</span>
            <span>体重 {detail.weightkg ?? "-"}kg</span>
            <span>蛋群 {detail.eggGroups.join(" / ") || "-"}</span>
          </div>
          <div className="quick-dex-ability-panel">
            <h4>特性</h4>
            <div>{detail.abilities.map(ability => <button type="button" onClick={() => onAbilityClick(ability.id)} key={ability.id}><strong>{ability.nameZh || ability.name}</strong>{ability.hidden ? <span>H</span> : null}<small>{ability.description || "查看特性详情"}</small></button>)}</div>
          </div>
          <div className="quick-dex-learnset-group">
            <h4>进化链 <small>{detail.evolutionChain.length}</small></h4>
            <div>{detail.evolutionChain.map(pokemon => <PokemonLinkCard pokemon={pokemon} onPokemonClick={onPokemonClick} key={pokemon.id} />)}</div>
          </div>
          <div className="quick-dex-learnset-group">
            <h4>其他形态 <small>{detail.formes.length}</small></h4>
            <div>{detail.formes.length ? detail.formes.map(pokemon => <PokemonLinkCard pokemon={pokemon} onPokemonClick={onPokemonClick} key={pokemon.id} />) : <small className="quick-dex-description">无</small>}</div>
          </div>
          <div className="quick-dex-learnset-group">
            <label>等级 <input type="number" min={1} max={100} value={level} onChange={event => onLevelChange(Number(event.target.value))} /></label>
          </div>
          <div className="quick-dex-stat-grid">
            {Object.entries(detail.baseStats).map(([stat, base]) => (
              <p key={stat}>
                <span>{STAT_LABELS[stat]}</span>
                <strong>{base} / Lv.{level}: {stats.stats[stat as keyof typeof stats.stats]}</strong>
              </p>
            ))}
          </div>
        </div>
      ) : null}
      {tab === "sprites" ? <SpriteGrid detail={detail} /> : null}
      {tab !== "summary" && tab !== "sprites" ? <MoveGrid moves={moveGroups[tab] || []} onMoveClick={onMoveClick} emptyLabel={`${SOURCE_LABELS[tab]}暂无数据`} /> : null}
    </div>
  );
}

function PokemonLinkCard({pokemon, onPokemonClick}: {pokemon: DexPokemonLink; onPokemonClick: (id: string) => void}) {
  return (
    <button className="quick-dex-link-card with-icon" type="button" onClick={() => onPokemonClick(pokemon.id)}>
      {pokemon.sprite ? <PokemonIcon row={pokemonLinkToRow(pokemon)} /> : null}
      <strong>{pokemon.nameZh || pokemon.name}</strong>
      <small>No.{pokemon.num}</small>
    </button>
  );
}

function pokemonLinkToRow(pokemon: DexPokemonLink): DexSearchRow {
  return {id: pokemon.id, category: "pokemon", name: pokemon.name, nameZh: pokemon.nameZh, tags: [], sprite: pokemon.sprite};
}

function SpriteGrid({detail}: {detail: DexPokemonDetail}) {
  const sprites = [
    ["正面", detail.sprites.animatedFrontUrl, detail.sprites.frontUrl],
    ["背面", detail.sprites.animatedBackUrl, detail.sprites.backUrl],
    ["异色正面", detail.sprites.animatedFrontShinyUrl, detail.sprites.frontShinyUrl],
    ["异色背面", detail.sprites.animatedBackShinyUrl, detail.sprites.backShinyUrl],
  ];
  return (
    <div className="quick-dex-sprite-grid">
      {sprites.map(([label, url, fallback]) => (
        <figure key={label}>
          <img src={url || fallback} alt={`${detail.name} ${label}`} onError={event => {
            if (fallback && event.currentTarget.src !== fallback) event.currentTarget.src = fallback;
          }} />
          <figcaption>{label}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function MoveDetail({detail, onPokemonClick, onPreviewMove}: {detail: DexMoveDetail; onPokemonClick: (id: string) => void; onPreviewMove: (move: DexMoveDetail) => void}) {
  return (
    <div className="quick-dex-pokemon-info">
      <DetailTitle
        title={detail.nameZh || detail.name}
        eyebrow={detail.name}
        tags={[detail.type, detail.category]}
        action={<button className="quick-dex-detail-action" type="button" onClick={() => onPreviewMove(detail)}>动画预览</button>}
      />
      <div className="quick-dex-badges">
        <span>威力 {detail.power || "-"}</span>
        <span>命中 {detail.accuracy ?? "-"}</span>
        <span>PP {detail.pp}</span>
        <span>优先度 {detail.priority}</span>
        <span>目标 {detail.target || "-"}</span>
      </div>
      <p className="quick-dex-description">{detail.description || "暂无说明。"}</p>
      <TagCloud values={detail.flagsText} />
      <div className="quick-dex-learnset-group">
        <h4>谁能学 <small>{detail.learners.length}</small></h4>
        <div>{detail.learners.slice(0, 120).map(entry => <button className="quick-dex-link-card with-icon" type="button" onClick={() => onPokemonClick(entry.pokemon.id)} key={entry.pokemon.id}>{entry.pokemon.sprite?.iconUrl ? <PokemonIcon row={entry.pokemon} /> : null}<strong>{entry.pokemon.nameZh || entry.pokemon.name}</strong><small>{entry.sources.map(source => SOURCE_LABELS[source]).join("/")}</small></button>)}</div>
      </div>
    </div>
  );
}

function AbilityDetail({detail, onPokemonClick}: {detail: DexAbilityDetail; onPokemonClick: (id: string) => void}) {
  return (
    <div className="quick-dex-pokemon-info">
      <DetailTitle title={detail.nameZh || detail.name} eyebrow={detail.name} tags={["特性"]} />
      <p className="quick-dex-description">{detail.description || "暂无说明。"}</p>
      <div className="quick-dex-learnset-group">
        <h4>拥有者 <small>{detail.holders.length}</small></h4>
        <div>{detail.holders.map(entry => <button className="quick-dex-link-card with-icon" type="button" onClick={() => onPokemonClick(entry.pokemon.id)} key={`${entry.pokemon.id}-${entry.hidden ? "h" : "n"}`}>{entry.pokemon.sprite?.iconUrl ? <PokemonIcon row={entry.pokemon} /> : null}<strong>{entry.pokemon.nameZh || entry.pokemon.name}</strong><small>{entry.hidden ? "隐藏特性" : "普通特性"}</small></button>)}</div>
      </div>
    </div>
  );
}

function ItemDetail({detail}: {detail: DexItemDetail}) {
  const usageBadges = [
    booleanBadge("战斗中使用", detail.canBattleUse),
    booleanBadge("直接使用", detail.canUse),
    booleanBadge("对宝可梦使用", detail.canUseToPokemon),
    booleanBadge("可携带", detail.canTake),
    booleanBadge("可售卖", detail.canSale),
    detail.futureInstanceCompatible ? "可放入背包" : "",
  ].filter(Boolean);
  return (
    <div className="quick-dex-pokemon-info">
      <DetailTitle title={detail.nameZh || detail.name} eyebrow={detail.name} tags={[detail.kindLabel, detail.sourceLabel || ""]} />
      <div className="item-detail-head">
        {detail.iconUrl || detail.iconStyle ? <DexItemIcon iconUrl={detail.iconUrl} iconStyle={detail.iconStyle} /> : null}
        <div>
          <p className="quick-dex-description">{detail.description || "暂无说明。"}</p>
          {detail.effectSummary && detail.effectSummary !== detail.description ? <p className="quick-dex-description muted">{detail.effectSummary}</p> : null}
        </div>
      </div>
      <div className="quick-dex-badges item-detail-usage">
        {usageBadges.map(value => <span key={value}>{value}</span>)}
      </div>
      <div className="item-detail-meta-grid">
        <span><b>ID</b><em>{detail.id}</em></span>
        <span><b>分类</b><em>{detail.kindLabel}</em></span>
        <span><b>来源</b><em>{detail.sourceLabel || detail.source || "Showdown"}</em></span>
        <span><b>成本</b><em>{detail.cost ?? "-"}</em></span>
        {detail.moveName || detail.moveNameZh ? <span><b>对应技能</b><em>{detail.moveNameZh || detail.moveName}</em></span> : null}
      </div>
    </div>
  );
}

function booleanBadge(label: string, value: boolean | undefined): string {
  if (value === undefined) return "";
  return `${label}${value ? "：是" : "：否"}`;
}

function DexItemIcon({iconUrl, iconStyle, className = ""}: {iconUrl?: string; iconStyle?: string; className?: string}) {
  const classNames = ["item-icon", className].filter(Boolean).join(" ");
  if (iconStyle) return <span className={classNames} style={styleFromCss(iconStyle)} />;
  if (iconUrl) return <img className={classNames} src={iconUrl} alt="" loading="lazy" />;
  return null;
}

function EnvironmentDetail({
  detail,
  moveDetail,
  onMoveClick,
  onPreviewEnvironment,
}: {
  detail: BattleV4EnvironmentPreviewEntry;
  moveDetail?: DexMoveDetail;
  onMoveClick: (id: string) => void;
  onPreviewEnvironment: (entry: BattleV4EnvironmentPreviewEntry) => void;
}) {
  const description = moveDetail?.description || detail.description;
  return (
    <div className="quick-dex-pokemon-info">
      <DetailTitle
        title={detail.nameZh}
        eyebrow={detail.name}
        tags={[detail.groupLabel, detail.sourceLabel]}
        action={<button className="quick-dex-detail-action" type="button" onClick={() => onPreviewEnvironment(detail)}>动画预览</button>}
      />
      <div className="quick-dex-badges">
        <span>{detail.groupLabel}</span>
        <span>{detail.sourceLabel}</span>
        {moveDetail ? <span>PP {moveDetail.pp}</span> : null}
        {moveDetail ? <span>目标 {moveDetail.target || "-"}</span> : null}
      </div>
      <p className="quick-dex-description">{description || "暂无说明。"}</p>
      {moveDetail ? (
        <>
          <div className="quick-dex-badges">
            <span>{moveDetail.type}</span>
            <span>{moveDetail.category}</span>
            <span>威力 {moveDetail.power || "-"}</span>
            <span>命中 {moveDetail.accuracy ?? "-"}</span>
          </div>
          <button className="quick-dex-link-card quick-dex-environment-source" type="button" onClick={() => onMoveClick(moveDetail.id)}>
            <strong>查看对应技能</strong>
            <small>{moveDetail.nameZh || moveDetail.name}</small>
          </button>
        </>
      ) : (
        <p className="quick-dex-description">该条目目前作为环境资料占位，后续可补完整 Showdown 规则说明。</p>
      )}
    </div>
  );
}

function MoveGrid({moves, onMoveClick, emptyLabel}: {moves: DexMoveSummary[]; onMoveClick: (id: string) => void; emptyLabel: string}) {
  if (!moves.length) return <p className="quick-dex-description">{emptyLabel}</p>;
  return <div className="quick-dex-learnset"><div className="quick-dex-learnset-group"><div>{moves.map(move => <MoveCardButton move={move} onClick={() => onMoveClick(move.id)} key={move.id} />)}</div></div></div>;
}

function MoveCardButton({move, onClick}: {move: DexMoveSummary; onClick: () => void}) {
  return (
    <button type="button" className={`move-card move-choice move-card-dex quick-dex-move-card move-type-${(move.typeId || move.type).toLowerCase()}`} onClick={onClick}>
      <span className="move-name-row"><strong>{move.nameZh || move.name}</strong><i>{move.category}</i></span>
      <span className="move-meta-row"><b>{move.type}</b><em>威 {move.power || "-"}</em><em>命 {move.accuracy ?? "-"}</em><em>PP {move.pp}</em></span>
    </button>
  );
}

function DetailTitle({title, eyebrow, tags, action}: {title: string; eyebrow: string; tags: string[]; action?: ReactNode}) {
  return <header><span>{categoryIcon("abilities")}</span><div><h3>{title}</h3><p>{eyebrow}</p><TagCloud values={tags} /></div>{action}</header>;
}

function TagCloud({values}: {values: string[]}) {
  return <div className="quick-dex-badges">{values.filter(Boolean).map(value => <span key={value}>{value}</span>)}</div>;
}

function categoryIcon(category: DexCategory): string {
  return {pokemon: "P", moves: "M", abilities: "A", items: "I", trainers: "T"}[category];
}

function categoryIconForRow(row: DexSearchRow): string {
  if (row.category === "trainers" && row.tags.includes("environment")) {
    const group = ENVIRONMENT_ENTRIES.find(entry => entry.id === row.id)?.group;
    if (group === "weather") return "天";
    if (group === "terrain") return "场";
    if (group === "room") return "空";
    return "环";
  }
  return categoryIcon(row.category);
}

function environmentEntry(
  id: string,
  name: string,
  nameZh: string,
  group: BattleV4EnvironmentPreviewEntry["group"],
  protocolId: string,
  moveId: string | undefined,
  sourceType: BattleV4EnvironmentPreviewEntry["sourceType"],
  sourceLabel: string,
  description: string,
): BattleV4EnvironmentPreviewEntry {
  const groupLabel = group === "weather" ? "天气" : group === "terrain" ? "场地" : "空间";
  return {
    id,
    name,
    nameZh,
    group,
    groupLabel,
    protocolId,
    moveId,
    sourceType,
    sourceLabel,
    description,
    tags: [groupLabel, sourceLabel, name, nameZh, moveId || ""].filter(Boolean),
  };
}

function searchEnvironmentEntries(query: string, offset: number, limit: number): {rows: DexSearchRow[]; total: number} {
  const normalized = normalizeSearchText(query);
  const entries = ENVIRONMENT_ENTRIES.filter(entry => {
    if (!normalized) return true;
    return [
      entry.id,
      entry.name,
      entry.nameZh,
      entry.group,
      entry.groupLabel,
      entry.protocolId,
      entry.moveId || "",
      ...entry.tags,
    ].some(value => normalizeSearchText(value).includes(normalized));
  });
  return {
    rows: entries.slice(offset, offset + limit).map(environmentToSearchRow),
    total: entries.length,
  };
}

function environmentToSearchRow(entry: BattleV4EnvironmentPreviewEntry): DexSearchRow {
  return {
    id: entry.id,
    category: "trainers",
    name: entry.name,
    nameZh: entry.nameZh,
    subtitle: `${entry.groupLabel} · ${entry.sourceLabel}`,
    description: entry.description,
    tags: ["environment", entry.group, entry.groupLabel, entry.sourceLabel, entry.moveId || ""].filter(Boolean),
  };
}

function normalizeSearchText(value: string): string {
  return String(value || "").toLowerCase().replace(/[\s_-]+/g, "");
}

function styleFromCss(css: string): CSSProperties {
  const match = /url\(([^)]+)\).*?(-?\d+)px\s+(-?\d+)px/.exec(css);
  if (!match) return {};
  return {backgroundImage: `url(${match[1]})`, backgroundPosition: `${match[2]}px ${match[3]}px`, backgroundRepeat: "no-repeat"};
}
