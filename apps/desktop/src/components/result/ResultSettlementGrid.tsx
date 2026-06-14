import {useMemo} from "react";
import type {ResultSummaryRow} from "@changebattle/shared";
import "./ResultSettlementGrid.css";

export function ResultSettlementGrid({rows}: {rows: ResultSummaryRow[]}) {
  return (
    <div className="result-settlement-grid">
      <ResultRows title="金币结算" rows={rows} tone="coin" />
    </div>
  );
}

export function ResultRows({title, rows, tone}: {title: string; rows: ResultSummaryRow[]; tone: "coin" | "bp"}) {
  const total = useMemo(() => rows.map(row => row.value).join(" / "), [rows]);
  return (
    <section className={`result-section result-rows ${tone}`}>
      <header>
        <strong>{title}</strong>
        <span>{rows.length ? total : "无变动"}</span>
      </header>
      <div>
        {rows.length ? rows.map((row, index) => (
          <article key={`${title}-${row.label}-${index}`}>
            <span>{row.label}</span>
            <b>{row.value}</b>
            {row.detail ? <small>{row.detail}</small> : null}
          </article>
        )) : <p>本项没有结算变动。</p>}
      </div>
    </section>
  );
}
