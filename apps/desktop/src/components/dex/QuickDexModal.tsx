import {useEffect, useMemo, useState} from "react";
import type {DesktopDexCategory, DesktopDexEntry, MoveSummary} from "@changebattle/shared";
import {AnimatePresence, motion, type Variants} from "motion/react";
import {PokopiaModal, pokopiaItemVariants} from "../motion/PokopiaModal";
import {DexCategoryTabs} from "./DexCategoryTabs";
import {DexDetailPanel} from "./DexDetailPanel";
import {DexResultList} from "./DexResultList";
import {DexSearchBar} from "./DexSearchBar";
import {DEX_TABS, QUICK_DEX_PAGE_SIZE, categoryIndex, type DexAbilitySummary} from "./dexModel";
import "./QuickDexModal.css";

export type QuickDexCategory = DesktopDexCategory;

type MegaMenuColumn = {
  title: string;
  items: Array<{label: string; query?: string; typeFilter?: string}>;
};

export type QuickDexModalPreviewProps = {
  entries: DesktopDexEntry[];
  category?: QuickDexCategory;
  activeMega?: QuickDexCategory | null;
  loading?: boolean;
  error?: string | null;
  expanded?: boolean;
  query?: string;
  total?: number;
};

const POKEMON_TYPE_FILTERS = ["全部", "一般", "火", "水", "电", "草", "冰", "格斗", "毒", "地面", "飞行", "超能力", "虫", "岩石", "幽灵", "龙", "恶", "钢", "妖精"];

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
  trainers: [
    {title: "基础身份", items: [{label: "全部", query: ""}, {label: "馆主", query: "type:gym"}, {label: "四天王", query: "type:elite4"}, {label: "冠军", query: "type:champion"}]},
    {title: "特殊身份", items: [{label: "反派头目", query: "type:villain"}, {label: "特殊事件", query: "event:special"}]},
    {title: "事件来源", items: [{label: "普通乱入", query: "event:villain_intrusion"}, {label: "彩虹火箭队", query: "event:rainbow_rocket"}]},
  ],
};

const megaContentVariants: Variants = {
  enter: (direction: number) => ({opacity: 0, x: direction ? direction * 30 : 0}),
  center: {opacity: 1, x: 0},
  exit: (direction: number) => ({opacity: 0, x: direction ? direction * -30 : 0}),
};

export function QuickDexModal({initialCategory = "pokemon", initialEntry = null, initialQuery = "", onClose, preview}: {initialCategory?: QuickDexCategory; initialEntry?: DesktopDexEntry | null; initialQuery?: string; onClose: () => void; preview?: QuickDexModalPreviewProps}) {
  const [category, setCategory] = useState<QuickDexCategory>(preview?.category || initialCategory);
  const [activeMega, setActiveMega] = useState<QuickDexCategory | null>(preview?.activeMega === undefined ? null : preview.activeMega);
  const [query, setQuery] = useState(preview?.query || initialQuery || initialEntry?.id || "");
  const [typeFilter, setTypeFilter] = useState("全部");
  const [entries, setEntries] = useState<DesktopDexEntry[]>(preview?.entries || (initialEntry ? [initialEntry] : []));
  const [selectedId, setSelectedId] = useState(initialEntry?.id || preview?.entries[0]?.id || "");
  const [total, setTotal] = useState(preview?.total || preview?.entries.length || (initialEntry ? 1 : 0));
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(Boolean(preview?.loading));
  const [error, setError] = useState<string | null>(preview?.error || null);
  const [direction, setDirection] = useState(0);
  const [detailExpanded, setDetailExpanded] = useState(Boolean(preview?.expanded));
  const selected = entries.find(entry => entry.id === selectedId) || entries[0] || initialEntry || null;
  const activeTab = DEX_TABS.find(tab => tab.id === category) || DEX_TABS[0];
  const pageCount = Math.max(1, Math.ceil(total / QUICK_DEX_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const isPreview = Boolean(preview);
  const searchQuery = useMemo(() => {
    if (category !== "pokemon" || typeFilter === "全部") return query;
    return `${query} ${typeFilter}`.trim();
  }, [category, query, typeFilter]);

  useEffect(() => {
    if (!preview) return;
    setCategory(preview.category || preview.entries[0]?.category || "pokemon");
    setActiveMega(preview.activeMega === undefined ? null : preview.activeMega);
    setEntries(preview.entries);
    setTotal(preview.total || preview.entries.length);
    setLoading(Boolean(preview.loading));
    setError(preview.error || null);
    setDetailExpanded(Boolean(preview.expanded));
    setQuery(preview.query || "");
    setSelectedId(preview.entries[0]?.id || "");
  }, [preview]);

  useEffect(() => {
    if (isPreview) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const timer = window.setTimeout(() => {
      void window.changeBattle!.dexSearch(category, searchQuery, currentPage * QUICK_DEX_PAGE_SIZE, QUICK_DEX_PAGE_SIZE).then(result => {
        if (cancelled) return;
        const nextEntries = result.entries || [];
        const shouldPinInitial = currentPage === 0 && initialEntry && initialEntry.category === category && !nextEntries.some(entry => entry.id === initialEntry.id);
        const merged = shouldPinInitial ? [initialEntry, ...nextEntries] : nextEntries;
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
  }, [category, currentPage, initialEntry, isPreview, searchQuery]);

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

  function openAbility(ability: DexAbilitySummary) {
    setDirection(categoryIndex("abilities") > categoryIndex(category) ? 1 : -1);
    setCategory("abilities");
    setActiveMega(null);
    setQuery(ability.id || ability.name);
    setTypeFilter("全部");
    setSelectedId(ability.id);
    setPage(0);
  }

  function renderContent(close: () => void) {
    return (
    <motion.div className="quick-dex-content-grid" variants={pokopiaItemVariants}>
      <header className="quick-dex-header">
        <div>
          <h2 id="quick-dex-title">图鉴</h2>
          <p>{activeTab.hint}</p>
        </div>
        <button onClick={close}>关闭</button>
      </header>
      <section className="quick-dex-mega" onMouseLeave={() => setActiveMega(null)}>
        <DexCategoryTabs variant="quick" category={category} activeMega={activeMega} onCategoryPreview={previewCategory} onCategoryChange={chooseCategory} />
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
      <DexSearchBar variant="quick" query={query} loading={loading} resultCount={entries.length} total={total} onQueryChange={value => { setQuery(value); setPage(0); }} />
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          className={`quick-dex-body ${detailExpanded ? "detail-expanded" : ""}`}
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
          <DexResultList
            variant="quick"
            entries={entries}
            selectedId={selected?.id}
            loading={loading}
            error={error}
            page={currentPage}
            pageCount={pageCount}
            category={category}
            onSelect={entry => setSelectedId(entry.id)}
            onPageChange={setPage}
          />
          <DexDetailPanel variant="quick" entry={selected} expanded={detailExpanded} showTrainerPool={false} onToggleExpanded={() => setDetailExpanded(value => !value)} onMoveSelect={openMove} onAbilitySelect={openAbility} />
        </motion.div>
      </AnimatePresence>
    </motion.div>
    );
  }

  if (isPreview) return <div className="pokopia-content quick-dex-modal component-gallery-quick-dex-inline">{renderContent(onClose)}</div>;
  return (
    <PokopiaModal className="quick-dex-modal" labelledBy="quick-dex-title" onClose={onClose}>
      {requestClose => renderContent(requestClose)}
    </PokopiaModal>
  );
}
