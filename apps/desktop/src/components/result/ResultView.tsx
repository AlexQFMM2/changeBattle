import type {BattleState, ResultSummaryState} from "@changebattle/shared";
import {ResultPage} from "./ResultPage";

export function ResultView({message, battle, summary, onBack, backLabel = "返回主界面"}: {message: string; battle: BattleState | null; summary: ResultSummaryState | null; onBack: () => void; backLabel?: string}) {
  return <ResultPage message={message} battle={battle} summary={summary} onBack={onBack} backLabel={backLabel} />;
}
