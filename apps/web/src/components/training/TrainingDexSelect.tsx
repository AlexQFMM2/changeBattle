import {useEffect, useMemo, useState} from "react";
import type {ChangeBattleV2Api, DexCategory, DexSearchRow} from "@changebattle-v2/api";
import "./TrainingDexSelect.css";

export type TrainingDexSelectOption = {
  id: string;
  name: string;
  nameZh: string;
  subtitle?: string;
  description?: string;
};

export function TrainingDexSelect({
  api,
  category,
  label,
  value,
  display,
  placeholder = "输入中文或英文",
  fixedOptions,
  allowEmpty = false,
  emptyLabel = "无",
  onSelect,
}: {
  api: ChangeBattleV2Api;
  category: DexCategory;
  label: string;
  value: string;
  display: string;
  placeholder?: string;
  fixedOptions?: TrainingDexSelectOption[];
  allowEmpty?: boolean;
  emptyLabel?: string;
  onSelect: (id: string, row?: TrainingDexSelectOption) => void;
}) {
  const [draft, setDraft] = useState(display || value);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setDraft(display || value);
  }, [display, value]);

  const options = useMemo(() => {
    const query = draft.trim();
    const fixed = fixedOptions?.filter(option => matchesOption(option, query)).slice(0, 8);
    if (fixedOptions) return fixed || [];
    const rows = api.searchDex({category, query, limit: 8}).rows;
    return rows.map(rowToOption);
  }, [api, category, draft, fixedOptions]);

  function commitFirst() {
    const first = options[0];
    if (first) {
      onSelect(first.id, first);
      setDraft(first.nameZh || first.name);
      setOpen(false);
      return;
    }
    if (allowEmpty && !draft.trim()) {
      onSelect("");
      setDraft(emptyLabel);
      setOpen(false);
    }
  }

  return (
    <label className="training-dex-select">
      <span>{label}</span>
      <input
        value={draft}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={event => {
          setDraft(event.target.value);
          setOpen(true);
        }}
        onKeyDown={event => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitFirst();
          }
          if (event.key === "Escape") {
            setDraft(display || value);
            setOpen(false);
          }
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
      />
      <small>{value ? `ID: ${value}` : emptyLabel}</small>
      {open ? (
        <div className="training-dex-select-popover">
          {allowEmpty ? (
            <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => { onSelect(""); setDraft(emptyLabel); setOpen(false); }}>
              <strong>{emptyLabel}</strong>
              <small>清空</small>
            </button>
          ) : null}
          {options.map(option => (
            <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => { onSelect(option.id, option); setDraft(option.nameZh || option.name); setOpen(false); }} key={option.id}>
              <strong>{option.nameZh || option.name}</strong>
              <small>{option.id}</small>
              {option.subtitle ? <em>{option.subtitle}</em> : null}
            </button>
          ))}
          {!options.length && (!allowEmpty || draft.trim()) ? <p>未找到匹配项</p> : null}
        </div>
      ) : null}
    </label>
  );
}

function rowToOption(row: DexSearchRow): TrainingDexSelectOption {
  return {id: row.id, name: row.name, nameZh: row.nameZh, subtitle: row.subtitle, description: row.description};
}

function matchesOption(option: TrainingDexSelectOption, query: string): boolean {
  if (!query) return true;
  const text = `${option.id} ${option.name} ${option.nameZh} ${option.subtitle || ""}`.toLowerCase();
  return text.includes(query.toLowerCase());
}

