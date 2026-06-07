import {useEffect, useMemo, useState} from "react";
import type {DesktopDexCategory, DesktopDexEntry, MoveSummary} from "@changebattle/shared";
import {AnimatePresence, motion, type Variants} from "motion/react";
import {PokopiaModal, pokopiaItemVariants} from "../motion/PokopiaModal";
import {STAT_ROWS, assetUrl, typeId} from "../../lib/ui";

export type QuickDexCategory = Exclude<DesktopDexCategory, "trainers">;

const QUICK_DEX_TABS: Array<{id: QuickDexCategory; label: string; hint: string}> = [
  {id: "pokemon", label: "宝可梦", hint: "属性 / 种族值 / 技能池"},
  {id: "items", label: "道具", hint: "战斗与养成说明"},
  {id: "moves", label: "技能", hint: "属性 / 威力 / 命中"},
  {id: "abilities", label: "特性", hint: "触发效果"},
];

const POKEMON_TYPE_FILTERS = ["全部", "一般", "火", "水", "电", "草", "冰", "格斗", "毒", "地面", "飞行", "超能力", "虫", "岩石", "幽灵", "龙", "恶", "钢", "妖精"];
const QUICK_DEX_PAGE_SIZE = 4;

type MegaMenuColumn = {
  title: string;
  items: Array<{label: string; query?: string; typeFilter?: string}>;
};

const QUICK_DEX_MENUS: Record<QuickDexCategory, MegaMenuColumn[]> = {
  pokemon: [
    {title: "属性筛选", items: POKEMON_TYPE_FILTERS.slice(0, 7).map(type => ({label: type, typeFilter: type}))},
    {title: "更多属性", items: POKEMON_TYPE_FILTERS.slice(7).map(type => ({label: type, typeFilter: type}))},
    {title: "快速查看", items: [{label: "御三家", query: "starter"}, {label: "传说", query: "legendary"}, {label: "龙系", typeFilter: "龙"}, {label: "妖精", typeFilter: "妖精"}]},
  ],
  items: [
    {title: "道具分类", items: [{label: "全部", query: ""}, {label: "树果", query: "berry"}, {label: "恢复", query: "heal"}, {label: "战斗", query: "battle"}]},
    {title: "常用检索", items: [{label: "药水", query: "potion"}, {label: "精灵球", query: "ball"}, {label: "提升", query: "boost"}]},
    {title: "运营", items: [{label: "金币", query: "coin"}, {label: "经验", query: "exp"}, {label: "技能机器", query: "tm"}]},
  ],
  moves: [
    {title: "属性", items: [{label: "一般", query: "normal"}, {label: "火", query: "fire"}, {label: "水", query: "water"}, {label: "电", query: "electric"}, {label: "草", query: "grass"}]},
    {title: "分类", items: [{label: "物理", query: "physical"}, {label: "特殊", query: "special"}, {label: "变化", query: "status"}]},
    {title: "常用", items: [{label: "高威力", query: "power"}, {label: "必中", query: "必中"}, {label: "先制", query: "priority"}]},
  ],
  abilities: [
    {title: "战斗触发", items: [{label: "天气", query: "weather"}, {label: "威吓", query: "intimidate"}, {label: "免疫", query: "immune"}]},
    {title: "成长运营", items: [{label: "速度", query: "speed"}, {label: "攻击", query: "attack"}, {label: "防御", query: "defense"}]},
    {title: "关键词", items: [{label: "接触", query: "contact"}, {label: "HP", query: "hp"}, {label: "状态", query: "status"}]},
  ],
};

const megaContentVariants: Variants = {
  enter: (direction: number) => ({opacity: 0, x: direction ? direction * 30 : 0}),
  center: {opacity: 1, x: 0},
  exit: (direction: number) => ({opacity: 0, x: direction ? direction * -30 : 0}),
};

function dexSpriteUrl(entry: DesktopDexEntry): string {
  const path = String(entry.sprite?.paths.front_normal || entry.sprite?.paths.front_normal_full || "");
  return path ? assetUrl(path) || "" : "";
}

function entrySummary(entry: DesktopDexEntry): string {
  if (entry.category === "pokemon") return `${entry.types_zh?.join(" / ") || entry.types?.join(" / ") || "未知属性"}  No.${entry.sprite?.national_dex || "--"}`;
  if (entry.category === "moves") return `${entry.type_zh || entry.type || "未知"} / ${entry.move_category_zh || entry.move_category || "变化"}  威力 ${entry.power || "--"}  命中 ${entry.accuracy ?? "必中"}`;
  return entry.desc_zh || entry.desc || entry.id;
}

function categoryIndex(category: QuickDexCategory): number {
  return QUICK_DEX_TABS.findIndex(tab => tab.id === category);
}

export function QuickDexModal({initialCategory = "pokemon", initialEntry = null, initialQuery = "", onClose}: {initialCategory?: QuickDexCategory; initialEntry?: DesktopDexEntry | null; initialQuery?: string; onClose: () => void}) {
  const [category, setCategory] = useState<QuickDexCategory>(initialCategory);
  const [activeMega, setActiveMega] = useState<QuickDexCategory | null>(null);
  const [query, setQuery] = useState(initialQuery || initialEntry?.id || "");
  const [typeFilter, setTypeFilter] = useState("全部");
  const [entries, setEntries] = useState<DesktopDexEntry[]>(initialEntry ? [initialEntry] : []);
  const [selectedId, setSelectedId] = useState(initialEntry?.id || "");
  const [total, setTotal] = useState(initialEntry ? 1 : 0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState(0);
  const selected = entries.find(entry => entry.id === selectedId) || entries[0] || initialEntry || null;
  const activeTab = QUICK_DEX_TABS.find(tab => tab.id === category) || QUICK_DEX_TABS[0];
  const pageCount = Math.max(1, Math.ceil(total / QUICK_DEX_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const searchQuery = useMemo(() => {
    if (category !== "pokemon" || typeFilter === "全部") return query;
    return `${query} ${typeFilter}`.trim();
  }, [category, query, typeFilter]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const timer = window.setTimeout(() => {
      void window.changeBattle!.dexSearch(category, searchQuery, currentPage * QUICK_DEX_PAGE_SIZE, QUICK_DEX_PAGE_SIZE).then(result => {
        if (cancelled) return;
        const nextEntries = result.entries || [];
        const shouldPinInitial = currentPage === 0 && initialEntry && initialEntry.category === category && !nextEntries.some(entry => entry.id === initialEntry.id);
        const merged = shouldPinInitial
          ? [initialEntry, ...nextEntries]
          : nextEntries;
        setEntries(merged);
        setTotal(result.total || merged.length);
        setSelectedId(current => merged.some(entry => entry.id === current) ? current : merged[0]?.id || "");
      }).catch(err => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setEntries(initialEntry && initialEntry.category === category ? [initialEntry] : []);
        setTotal(initialEntry && initialEntry.category === category ? 1 : 0);
        setSelectedId(initialEntry && initialEntry.category === category ? initialEntry.id : "");
      }).finally(() => {
        if (!cancelled) setLoading(false);
      });
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [category, currentPage, initialEntry, searchQuery]);

  useEffect(() => {
    setPage(0);
  }, [category, searchQuery]);

  function chooseCategory(nextCategory: QuickDexCategory) {
    if (nextCategory === category) return;
    setDirection(categoryIndex(nextCategory) > categoryIndex(category) ? 1 : -1);
    setCategory(nextCategory);
    setSelectedId("");
    setQuery("");
    setTypeFilter("全部");
    setPage(0);
  }

  function previewCategory(nextCategory: QuickDexCategory) {
    if (nextCategory !== activeMega) {
      const previous = activeMega || category;
      setDirection(categoryIndex(nextCategory) > categoryIndex(previous) ? 1 : -1);
      setActiveMega(nextCategory);
    }
  }

  function applyMegaItem(nextCategory: QuickDexCategory, item: MegaMenuColumn["items"][number]) {
    chooseCategory(nextCategory);
    setQuery(item.query || "");
    setTypeFilter(item.typeFilter || "全部");
    setPage(0);
    setActiveMega(null);
  }

  function openMove(move: MoveSummary) {
    setDirection(categoryIndex("moves") > categoryIndex(category) ? 1 : -1);
    setCategory("moves");
    setActiveMega(null);
    setQuery(move.id || move.name_zh || move.name);
    setTypeFilter("全部");
    setSelectedId(move.id);
    setPage(0);
  }

  return (
    <PokopiaModal className="quick-dex-modal" labelledBy="quick-dex-title" onClose={onClose}>
      {requestClose => (
        <motion.div className="quick-dex-content-grid" variants={pokopiaItemVariants}>
          <header className="quick-dex-header">
            <div>
              <h2 id="quick-dex-title">图鉴</h2>
              <p>{activeTab.hint}</p>
            </div>
            <button onClick={() => requestClose()}>关闭</button>
          </header>
          <section className="quick-dex-mega" onMouseLeave={() => setActiveMega(null)}>
            <nav className="quick-dex-mega-tabs" aria-label="图鉴分类">
              {QUICK_DEX_TABS.map(tab => (
                <button className={category === tab.id ? "selected" : ""} onMouseEnter={() => previewCategory(tab.id)} onFocus={() => previewCategory(tab.id)} onClick={() => chooseCategory(tab.id)} key={tab.id}>
                  {activeMega === tab.id ? <motion.i layoutId="quick-dex-tab-indicator" transition={{type: "spring", stiffness: 500, damping: 35}} /> : null}
                  <span>
                    {tab.label}
                    <motion.b animate={{rotate: activeMega === tab.id ? 180 : 0}} transition={{type: "spring", stiffness: 500, damping: 30}}>⌄</motion.b>
                  </span>
                </button>
              ))}
            </nav>
            <AnimatePresence>
              {activeMega ? (
                <motion.div className="quick-dex-mega-panel" initial={{opacity: 0, y: -8}} animate={{opacity: 1, y: 0, transition: {type: "spring", stiffness: 500, damping: 35}}} exit={{opacity: 0, y: -8, transition: {duration: 0.15, ease: "easeOut"}}}>
                  <AnimatePresence mode="popLayout" custom={direction}>
                    <motion.div className="quick-dex-mega-grid" custom={direction} variants={megaContentVariants} initial="enter" animate="center" exit="exit" transition={{type: "spring", stiffness: 300, damping: 30}} key={activeMega}>
                      {QUICK_DEX_MENUS[activeMega].map((column, columnIndex) => (
                        <motion.div className="quick-dex-mega-column" initial={{opacity: 0, y: direction ? 0 : 8}} animate={{opacity: 1, y: 0}} transition={{type: "spring", stiffness: 400, damping: 30, delay: columnIndex * 0.04}} key={column.title}>
                          <strong>{column.title}</strong>
                          {column.items.map(item => (
                            <button className={(category === activeMega && ((item.typeFilter && item.typeFilter === typeFilter) || (item.query !== undefined && item.query === query))) ? "active" : ""} onClick={() => applyMegaItem(activeMega, item)} key={`${column.title}-${item.label}`}>
                              {item.label}
                            </button>
                          ))}
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </section>
          <div className="quick-dex-tools">
            <input value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} placeholder="搜索名称、英文、属性、说明" />
            <span>{loading ? "读取中..." : `${entries.length}/${total}`}</span>
          </div>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              className="quick-dex-body"
              custom={direction}
              variants={{
                enter: (value: number) => ({opacity: 0, x: value ? value * 28 : 0}),
                center: {opacity: 1, x: 0},
                exit: (value: number) => ({opacity: 0, x: value ? value * -28 : 0}),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{type: "spring", stiffness: 310, damping: 30}}
              key={category}
            >
              <div className="quick-dex-result-pane">
                <div className={`quick-dex-list ${category === "moves" ? "move-results" : ""}`}>
                  {error ? <p className="quick-dex-message">{error}</p> : null}
                  {!loading && !error && entries.length === 0 ? <p className="quick-dex-message">没有匹配结果。</p> : null}
                  {entries.map((entry, index) => (
                    entry.category === "moves" ? (
                      <motion.button
                        className={`move-choice quick-dex-move-card quick-dex-result-move-card move-type-${typeId(entry.type || entry.type_zh)} ${selected?.id === entry.id ? "selected" : ""}`}
                        onClick={() => setSelectedId(entry.id)}
                        initial={{opacity: 0, y: 8}}
                        animate={{opacity: 1, y: 0}}
                        transition={{delay: index * 0.025, type: "spring", stiffness: 360, damping: 30}}
                        key={`${entry.category}-${entry.id}`}
                      >
                        <span className="move-name-row">
                          <strong>{entry.name_zh || entry.name}</strong>
                          <i>{entry.move_category_zh || entry.move_category || "变化"}</i>
                        </span>
                        <span className="move-meta-row">
                          <b>{entry.type_zh || entry.type || "一般"}</b>
                          <em>PP {entry.pp || "--"}</em>
                          <em>威力 {entry.power || "--"}</em>
                          <em>命中 {entry.accuracy ?? "必中"}</em>
                        </span>
                      </motion.button>
                    ) : (
                      <motion.button
                        className={selected?.id === entry.id ? "selected" : ""}
                        onClick={() => setSelectedId(entry.id)}
                        initial={{opacity: 0, y: 8}}
                        animate={{opacity: 1, y: 0}}
                        transition={{delay: index * 0.025, type: "spring", stiffness: 360, damping: 30}}
                        key={`${entry.category}-${entry.id}`}
                      >
                        {entry.category === "pokemon" && dexSpriteUrl(entry) ? <img src={dexSpriteUrl(entry)} alt={entry.name_zh || entry.name} /> : <span>{entry.category === "abilities" ? "特" : "道"}</span>}
                        <strong>{entry.name_zh || entry.name}</strong>
                        <small>{entrySummary(entry)}</small>
                      </motion.button>
                    )
                  ))}
                </div>
                <nav className="quick-dex-pager" aria-label="图鉴翻页">
                  <button disabled={loading || currentPage <= 0} onClick={() => setPage(value => Math.max(0, value - 1))}>上一页</button>
                  <span>{currentPage + 1}/{pageCount}</span>
                  <button disabled={loading || currentPage >= pageCount - 1} onClick={() => setPage(value => Math.min(pageCount - 1, value + 1))}>下一页</button>
                </nav>
              </div>
              <QuickDexDetail entry={selected} onMoveSelect={openMove} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </PokopiaModal>
  );
}

function QuickDexDetail({entry, onMoveSelect}: {entry: DesktopDexEntry | null; onMoveSelect: (move: MoveSummary) => void}) {
  if (!entry) return <section className="quick-dex-detail empty">选择左侧条目查看详情。</section>;
  const sprite = dexSpriteUrl(entry);
  return (
    <section className="quick-dex-detail">
      <header>
        {sprite ? <img src={sprite} alt={entry.name_zh || entry.name} /> : <span>{entry.category === "moves" ? "技" : entry.category === "abilities" ? "特" : "道"}</span>}
        <div>
          <h3>{entry.name_zh || entry.name}</h3>
          <p>{entry.name} / {entry.id}</p>
        </div>
      </header>
      {entry.category === "pokemon" ? (
        <>
          <div className="quick-dex-badges">{(entry.types_zh || entry.types || []).map(type => <span key={type}>{type}</span>)}</div>
          {entry.base_stats ? <div className="quick-dex-stat-grid">{STAT_ROWS.map(([stat, label]) => <p key={stat}><span>{label}</span><strong>{entry.base_stats?.[stat] || 0}</strong></p>)}</div> : null}
          <div className="quick-dex-learnset">
            {(entry.learnset || []).map(move => (
              <button className={`move-choice quick-dex-move-card move-type-${typeId(move.type || move.type_zh)}`} onClick={() => onMoveSelect(move)} key={move.id}>
                <span className="move-name-row">
                  <strong>{move.name_zh || move.name}</strong>
                  <i>{move.category_zh || move.category || "变化"}</i>
                </span>
                <span className="move-meta-row">
                  <b>{move.type_zh || move.type || "一般"}</b>
                  <em>PP {move.pp || "--"}</em>
                  <em>威力 {move.power || "--"}</em>
                  <em>命中 {move.accuracy ?? "必中"}</em>
                </span>
              </button>
            ))}
            {!entry.learnset?.length ? <small>暂无技能池数据。</small> : null}
          </div>
        </>
      ) : null}
      {entry.category === "moves" ? (
        <div className="quick-dex-facts">
          <p>属性 <strong>{entry.type_zh || entry.type || "--"}</strong></p>
          <p>分类 <strong>{entry.move_category_zh || entry.move_category || "--"}</strong></p>
          <p>威力 <strong>{entry.power || "--"}</strong></p>
          <p>命中 <strong>{entry.accuracy ?? "必中"}</strong></p>
          <p>PP <strong>{entry.pp || "--"}</strong></p>
          <p>优先度 <strong>{entry.priority || 0}</strong></p>
        </div>
      ) : null}
      {entry.category !== "pokemon" ? <p className="quick-dex-description">{entry.desc_zh || entry.desc || "暂无说明。"}</p> : null}
    </section>
  );
}
