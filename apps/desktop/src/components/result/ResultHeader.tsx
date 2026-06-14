import type {ResultSummaryState} from "@changebattle/shared";
import {outcomeLabel} from "./resultUtils";
import "./ResultHeader.css";

export function ResultHeader({outcome, headline, subtitle, onBack, backLabel}: {outcome: ResultSummaryState["outcome"]; headline: string; subtitle: string; onBack: () => void; backLabel: string}) {
  return (
    <header className="result-header">
      <div>
        <span>{outcomeLabel(outcome)}</span>
        <h1>{headline}</h1>
        <p>{subtitle}</p>
      </div>
      <button onClick={onBack}>{backLabel}</button>
    </header>
  );
}
