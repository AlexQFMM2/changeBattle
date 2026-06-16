import {useMemo, useState} from "react";
import type {CoinLedgerEntry, ResultSummaryRow} from "@changebattle/shared";
import "./ResultSettlementGrid.css";

export function ResultSettlementGrid({rows, bpRows = [], ledger = []}: {rows: ResultSummaryRow[]; bpRows?: ResultSummaryRow[]; ledger?: CoinLedgerEntry[]}) {
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const displayRows = rows.length ? rows : bpRows;
  return (
    <div className="result-settlement-grid">
      <ResultRows title="结算汇总" rows={displayRows} tone="coin" ledgerCount={ledger.length} onOpenLedger={() => setLedgerOpen(true)} />
      {ledgerOpen ? <CoinLedgerOverlay ledger={ledger} onClose={() => setLedgerOpen(false)} /> : null}
    </div>
  );
}

export function ResultRows({title, rows, tone, ledgerCount = 0, onOpenLedger}: {title: string; rows: ResultSummaryRow[]; tone: "coin" | "bp"; ledgerCount?: number; onOpenLedger?: () => void}) {
  const total = useMemo(() => rows.map(row => row.value).join(" / "), [rows]);
  return (
    <section className={`result-section result-rows ${tone}`}>
      <header>
        <strong>{title}</strong>
        <span>{rows.length ? total : "无变动"}</span>
        {ledgerCount > 0 && onOpenLedger ? <button type="button" onClick={onOpenLedger}>查看流水</button> : null}
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

function coinLedgerTime(entry: CoinLedgerEntry): string {
  const date = new Date(entry.at);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
}

function CoinLedgerOverlay({ledger, onClose}: {ledger: CoinLedgerEntry[]; onClose: () => void}) {
  const sortedLedger = useMemo(() => [...ledger].sort((left, right) => Date.parse(right.at || "") - Date.parse(left.at || "")), [ledger]);
  return (
    <div className="result-ledger-overlay" role="dialog" aria-modal="true" aria-label="金币流水">
      <section>
        <header>
          <strong>金币流水</strong>
          <span>{sortedLedger.length} 条</span>
          <button type="button" onClick={onClose}>关闭</button>
        </header>
        <div className="result-ledger-list">
          {sortedLedger.length ? sortedLedger.map(entry => (
            <article className={entry.type} key={entry.id}>
              <b>{entry.type === "gain" ? "+" : "-"}{entry.amount}金币</b>
              <strong>{entry.label || entry.reason}</strong>
              <span>{`${entry.before} -> ${entry.after}`}</span>
              <small>{[entry.reason, coinLedgerTime(entry)].filter(Boolean).join(" / ")}</small>
            </article>
          )) : <p>本局暂无金币流水。</p>}
        </div>
      </section>
    </div>
  );
}
