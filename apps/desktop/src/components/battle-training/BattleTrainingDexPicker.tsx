import {useEffect, useRef, useState} from "react";
import type {DesktopDexCategory, DesktopDexEntry} from "@changebattle/shared";
import "./BattleTrainingDexPicker.css";

const CATEGORY_LABELS: Record<DesktopDexCategory, string> = {
  pokemon: "物种",
  moves: "技能",
  abilities: "特性",
  items: "道具",
  trainers: "训练师",
};

export function BattleTrainingDexPicker({category, label, value, displayValue, placeholder, onChange}: {
  category: DesktopDexCategory;
  label: string;
  value: string;
  displayValue?: string;
  placeholder?: string;
  onChange: (value: string, displayValue: string) => void;
}) {
  const [query, setQuery] = useState(displayValue || value);
  const [results, setResults] = useState<DesktopDexEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => setQuery(displayValue || value), [displayValue, value]);

  useEffect(() => {
    if (!open) return;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setLoading(true);
      void window.changeBattle?.dexSearch(category, query, 0, 5).then(result => {
        setResults(result.entries);
      }).catch(() => {
        setResults([]);
      }).finally(() => setLoading(false));
    }, 120);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [category, open, query]);

  function update(next: string) {
    setQuery(next);
    onChange(next, next);
    setOpen(true);
  }

  function choose(entry: DesktopDexEntry) {
    const nextValue = entry.name || entry.id;
    const nextLabel = entry.name_zh || entry.name || entry.id;
    onChange(nextValue, nextLabel);
    setQuery(nextLabel);
    setOpen(false);
  }

  return (
    <label className="battle-training-dex-picker">
      <span>{label}</span>
      <input
        value={query}
        placeholder={placeholder || CATEGORY_LABELS[category]}
        onChange={event => update(event.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
      />
      {open ? (
        <div className="battle-training-dex-picker-popover">
          {loading ? <p>搜索中</p> : results.length ? results.map(entry => (
            <button type="button" key={`${entry.category}:${entry.id}`} onMouseDown={event => event.preventDefault()} onClick={() => choose(entry)}>
              <strong>{entry.name_zh || entry.name}</strong>
              <small>{entry.name || entry.id}</small>
            </button>
          )) : <p>可直接输入 Showdown 名称</p>}
        </div>
      ) : null}
    </label>
  );
}
