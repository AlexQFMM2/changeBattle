import {useEffect, useRef, useState} from "react";
import type {DesktopDexCategory, DesktopDexEntry} from "@changebattle/shared";
import {AnimatedModalLayer, AnimatedPanel} from "../motion/Animated";
import {DexCategoryTabs} from "./DexCategoryTabs";
import {DexDetailPanel} from "./DexDetailPanel";
import {DexResultList} from "./DexResultList";
import {DexSearchBar} from "./DexSearchBar";
import {DEX_PAGE_SIZE, TRAINER_DEX_FILTERS, type DexAbilitySummary, type TrainerDexFilter} from "./dexModel";
import "./DexModal.css";

export type DexModalPreviewProps = {
  entries: DesktopDexEntry[];
  category?: DesktopDexCategory;
  loading?: boolean;
  error?: string | null;
  expanded?: boolean;
  query?: string;
  total?: number;
};

export function DexModal({onClose, preview}: {onClose: () => void; preview?: DexModalPreviewProps}) {
  const [category, setCategory] = useState<DesktopDexCategory>(preview?.category || "pokemon");
  const [trainerFilter, setTrainerFilter] = useState<TrainerDexFilter>("all");
  const [query, setQuery] = useState(preview?.query || "");
  const [entries, setEntries] = useState<DesktopDexEntry[]>(preview?.entries || []);
  const [selectedId, setSelectedId] = useState("");
  const [total, setTotal] = useState(preview?.total || preview?.entries.length || 0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(Boolean(preview?.loading));
  const [error, setError] = useState<string | null>(preview?.error || null);
  const [detailExpanded, setDetailExpanded] = useState(Boolean(preview?.expanded));
  const preferredSelectedId = useRef("");
  const selected = entries.find(entry => entry.id === selectedId) || entries[0] || null;
  const pageCount = Math.max(1, Math.ceil(total / DEX_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const isPreview = Boolean(preview);

  useEffect(() => {
    if (!preview) return;
    setCategory(preview.category || preview.entries[0]?.category || "pokemon");
    setEntries(preview.entries);
    setTotal(preview.total || preview.entries.length);
    setLoading(Boolean(preview.loading));
    setError(preview.error || null);
    setDetailExpanded(Boolean(preview.expanded));
    setSelectedId(preview.entries[0]?.id || "");
  }, [preview]);

  useEffect(() => {
    if (isPreview) return;
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
  }, [category, query, trainerFilter, currentPage, isPreview]);

  function selectCategory(nextCategory: DesktopDexCategory) {
    setCategory(nextCategory);
    setSelectedId("");
    setPage(0);
  }

  function openAbility(ability: DexAbilitySummary) {
    preferredSelectedId.current = ability.id;
    setCategory("abilities");
    setQuery(ability.id || ability.name);
    setSelectedId(ability.id);
    setPage(0);
  }

  const body = (
    <AnimatedPanel className="dex-modal">
      <header>
        <div>
          <h2>图鉴</h2>
          <p>{entries.length}/{total} 个结果</p>
        </div>
        <button onClick={onClose}>关闭</button>
      </header>
      <DexCategoryTabs
        category={category}
        trainerFilter={trainerFilter}
        onCategoryChange={selectCategory}
        onTrainerFilterChange={filter => {
          setTrainerFilter(filter);
          setSelectedId("");
          setPage(0);
        }}
      />
      <DexSearchBar query={query} loading={loading} resultCount={entries.length} total={total} onQueryChange={value => { setQuery(value); setPage(0); }} />
      <div className={`dex-modal-body ${detailExpanded ? "detail-expanded" : ""}`}>
        <DexResultList
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
        <DexDetailPanel entry={selected} expanded={detailExpanded} onToggleExpanded={() => setDetailExpanded(value => !value)} onAbilitySelect={openAbility} />
      </div>
    </AnimatedPanel>
  );
  if (isPreview) return body;
  return <AnimatedModalLayer className="modal-layer">{body}</AnimatedModalLayer>;
}
